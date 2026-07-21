#!/usr/bin/env bash
# 在服务器上执行：安装依赖、构建、配置 PM2 与 Nginx
set -euo pipefail

# 非交互 SSH 常缺少 /usr/sbin，nginx 通常在这里
export PATH="/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin:${PATH:-}"

REMOTE_DIR="${REMOTE_DIR:-/var/www/audit-agent-courseware}"
DEPLOY_DIR="${DEPLOY_DIR:-$REMOTE_DIR/deploy}"
APP_PORT="${APP_PORT:-3001}"
NGINX_PORT="${NGINX_PORT:-8080}"
PM2_APP_NAME="${PM2_APP_NAME:-audit-courseware}"
AUTO_SETUP="${AUTO_SETUP:-true}"
SERVER_HOST="${SERVER_HOST:-127.0.0.1}"
SCRIPT_DIR="$DEPLOY_DIR"
NGINX_BIN=""

log() { printf '\n[deploy] %s\n' "$*"; }
fail() { printf '\n[deploy] 错误: %s\n' "$*" >&2; exit 1; }

require_cmd() {
  command -v "$1" >/dev/null 2>&1 || fail "缺少命令: $1"
}

find_nginx() {
  if command -v nginx >/dev/null 2>&1; then
    command -v nginx
    return 0
  fi
  local candidate
  for candidate in /usr/sbin/nginx /usr/local/sbin/nginx /usr/local/nginx/sbin/nginx; do
    if [[ -x "$candidate" ]]; then
      printf '%s\n' "$candidate"
      return 0
    fi
  done
  return 1
}

ensure_nginx() {
  if NGINX_BIN="$(find_nginx)"; then
    log "找到 Nginx: $NGINX_BIN ($("$NGINX_BIN" -v 2>&1))"
    return 0
  fi

  [[ "$AUTO_SETUP" == "true" ]] || fail "缺少 nginx，请先安装后重试"

  log "未找到 nginx，开始安装（仅用于 8080 反代，不会改动 80 端口站点）..."
  if command -v apt-get >/dev/null 2>&1; then
    sudo apt-get update -y
    sudo DEBIAN_FRONTEND=noninteractive apt-get install -y nginx
  elif command -v dnf >/dev/null 2>&1; then
    sudo dnf install -y nginx
  elif command -v yum >/dev/null 2>&1; then
    sudo yum install -y nginx
  else
    fail "无法识别包管理器，请手动安装 nginx"
  fi

  NGINX_BIN="$(find_nginx)" || fail "nginx 安装后仍找不到可执行文件"

  # 避免默认站点占用 80，与 fitness 冲突
  for f in /etc/nginx/conf.d/default.conf /etc/nginx/sites-enabled/default; do
    if [[ -e "$f" ]]; then
      sudo mv "$f" "${f}.disabled-by-audit-deploy" 2>/dev/null || sudo rm -f "$f"
      log "已禁用可能占用 80 的默认配置: $f"
    fi
  done

  if command -v systemctl >/dev/null 2>&1; then
    sudo systemctl enable nginx >/dev/null 2>&1 || true
    sudo systemctl start nginx || true
  fi
}

node_version_ok() {
  command -v node >/dev/null 2>&1 || return 1
  node -e 'const [major, minor] = process.versions.node.split(".").map(Number); process.exit(major > 22 || (major === 22 && minor >= 13) ? 0 : 1)'
}

install_node22() {
  if node_version_ok; then
    log "Node.js $(node -v) 已满足要求 (>=22.13)"
    return 0
  fi

  if command -v node >/dev/null 2>&1; then
    log "当前 Node $(node -v) 版本过低，准备安装 Node 22..."
  else
    log "未检测到 Node.js，准备安装 Node 22..."
  fi

  if [[ "$AUTO_SETUP" != "true" ]]; then
    fail "需要 Node.js >= 22.13，请手动安装后重试"
  fi

  require_cmd curl
  if command -v apt-get >/dev/null 2>&1; then
    curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
    sudo apt-get install -y nodejs
  elif command -v dnf >/dev/null 2>&1; then
    curl -fsSL https://rpm.nodesource.com/setup_22.x | sudo bash -
    sudo dnf install -y nodejs
  elif command -v yum >/dev/null 2>&1; then
    curl -fsSL https://rpm.nodesource.com/setup_22.x | sudo bash -
    sudo yum install -y nodejs
  else
    fail "无法识别包管理器，请手动安装 Node.js 22+"
  fi

  node_version_ok || fail "Node.js 安装失败或版本仍低于 22.13"
  log "Node.js $(node -v) 安装完成"
}

install_pm2() {
  if command -v pm2 >/dev/null 2>&1; then
    log "PM2 已安装: $(pm2 -v)"
    return 0
  fi
  [[ "$AUTO_SETUP" == "true" ]] || fail "缺少 PM2，请运行: npm i -g pm2"
  log "安装 PM2..."
  sudo npm install -g pm2
  pm2 startup systemd -u "$USER" --hp "$HOME" >/tmp/pm2-startup.txt 2>&1 || true
  if grep -q "sudo env PATH" /tmp/pm2-startup.txt; then
    log "如需开机自启，请执行 pm2 startup 输出的命令"
  fi
}

ensure_remote_dir() {
  sudo mkdir -p "$REMOTE_DIR"
  sudo chown -R "$USER:$USER" "$REMOTE_DIR"
}

build_app() {
  cd "$REMOTE_DIR"
  log "安装依赖..."
  npm ci
  log "构建生产包..."
  npm run build
  [[ -d dist/client && -d dist/server ]] || fail "构建失败：未找到 dist/client 或 dist/server"
}

configure_pm2() {
  cd "$REMOTE_DIR"
  # 直接对外暴露 NGINX_PORT（8080），不再经系统 nginx 反代
  export REMOTE_DIR PM2_APP_NAME
  export PUBLIC_PORT="$NGINX_PORT"
  export NGINX_PORT
  log "启动 / 重启 PM2 进程: $PM2_APP_NAME (0.0.0.0:$NGINX_PORT)"
  pm2 delete "$PM2_APP_NAME" >/dev/null 2>&1 || true
  pm2 start "$SCRIPT_DIR/ecosystem.config.cjs" --update-env
  pm2 save
  sleep 3
  pm2 describe "$PM2_APP_NAME" | head -40 || true
}

configure_nginx() {
  # fitness 已占用 80；系统新装 nginx 默认也会抢 80，容易启动失败。
  # 课件改为 PM2 直接监听 8080，跳过系统 nginx。
  log "跳过系统 nginx（课件由 Node 直接监听 :$NGINX_PORT，fitness 的 :80 不受影响）"
  if [[ -f /etc/nginx/conf.d/audit-courseware.conf ]]; then
    sudo rm -f /etc/nginx/conf.d/audit-courseware.conf || true
  fi
}

open_firewall_port() {
  if command -v firewall-cmd >/dev/null 2>&1 && sudo firewall-cmd --state >/dev/null 2>&1; then
    sudo firewall-cmd --permanent --add-port="${NGINX_PORT}/tcp" || true
    sudo firewall-cmd --reload || true
    log "firewalld 已尝试开放 ${NGINX_PORT}/tcp"
  elif command -v ufw >/dev/null 2>&1 && sudo ufw status >/dev/null 2>&1; then
    sudo ufw allow "${NGINX_PORT}/tcp" || true
    log "ufw 已尝试开放 ${NGINX_PORT}/tcp"
  else
    log "未检测到 firewalld/ufw；云防火墙/安全组请确认已放行 ${NGINX_PORT}/tcp"
  fi
}

health_check() {
  sleep 3
  local code
  code="$(curl -s -o /dev/null -w '%{http_code}' "http://127.0.0.1:${NGINX_PORT}/" || true)"
  if [[ "$code" != "200" ]]; then
    log "健康检查失败，最近 PM2 日志如下："
    pm2 logs "$PM2_APP_NAME" --lines 40 --nostream || true
    fail "应用健康检查失败 (127.0.0.1:${NGINX_PORT} -> HTTP ${code:-000})"
  fi

  local public_host="${SERVER_HOST:-127.0.0.1}"
  log "健康检查通过"
  log "课件访问地址: http://${public_host}:${NGINX_PORT}/"
  log "fitness 应用: http://${public_host}/ (80 端口未改动)"
}

main() {
  ensure_remote_dir
  install_node22
  install_pm2
  build_app
  configure_pm2
  configure_nginx
  open_firewall_port
  health_check
}

main "$@"
