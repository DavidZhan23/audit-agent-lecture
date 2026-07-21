#!/usr/bin/env bash
# 一键部署：从本机同步代码到服务器并执行 remote-deploy.sh
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
ENV_FILE="$SCRIPT_DIR/deploy.env"

usage() {
  cat <<'EOF'
用法: ./deploy/deploy.sh [选项]

选项:
  --setup-only   仅执行服务器端安装/配置，不同步代码
  --sync-only    仅同步代码，不在服务器构建
  -h, --help     显示帮助

首次使用:
  1. cp deploy/deploy.env.example deploy/deploy.env
  2. 编辑 deploy/deploy.env，填写 SERVER_USER（及 SSH_KEY 如需要）
  3. 确保本机可 SSH 登录服务器: ssh USER@211.159.166.109
  4. ./deploy/deploy.sh

部署完成后课件访问地址（默认）:
  http://211.159.166.109:8080/

fitness 应用不受影响:
  http://211.159.166.109/
EOF
}

if [[ "${1:-}" == "-h" || "${1:-}" == "--help" ]]; then
  usage
  exit 0
fi

if [[ ! -f "$ENV_FILE" ]]; then
  echo "未找到 $ENV_FILE"
  echo "请先运行: cp deploy/deploy.env.example deploy/deploy.env"
  exit 1
fi

# shellcheck disable=SC1090
source "$ENV_FILE"

SERVER_HOST="${SERVER_HOST:-211.159.166.109}"
REMOTE_DIR="${REMOTE_DIR:-/var/www/audit-agent-courseware}"
APP_PORT="${APP_PORT:-3001}"
NGINX_PORT="${NGINX_PORT:-8080}"
PM2_APP_NAME="${PM2_APP_NAME:-audit-courseware}"
AUTO_SETUP="${AUTO_SETUP:-true}"
SSH_OPTS=(-o StrictHostKeyChecking=accept-new -o ConnectTimeout=15)

if [[ -z "${SERVER_USER:-}" ]]; then
  echo "请在 deploy/deploy.env 中设置 SERVER_USER"
  exit 1
fi

SSH_TARGET="${SERVER_USER}@${SERVER_HOST}"
SSH_CMD=(ssh "${SSH_OPTS[@]}")
if [[ -n "${SSH_KEY:-}" ]]; then
  SSH_CMD+=(-i "${SSH_KEY/#\~/$HOME}")
fi
# rsync -e 需要单个字符串
RSYNC_SSH="${SSH_CMD[*]}"

MODE="${1:-}"

log() { printf '[local] %s\n' "$*"; }
fail() { printf '[local] 错误: %s\n' "$*" >&2; exit 1; }

run_ssh() {
  "${SSH_CMD[@]}" "$@"
}

log "目标服务器: $SSH_TARGET"
log "远程目录:   $REMOTE_DIR"
log "对外端口:   $NGINX_PORT (fitness 仍使用 80)"

log "测试 SSH 连接..."
run_ssh "$SSH_TARGET" "echo ok" >/dev/null || fail "无法 SSH 到 $SSH_TARGET，请检查用户、密钥与防火墙"

log "确保远程目录存在..."
run_ssh "$SSH_TARGET" \
  "sudo mkdir -p '$REMOTE_DIR' && sudo chown -R \"\$USER:\$USER\" '$REMOTE_DIR'"

if [[ "$MODE" != "--setup-only" ]]; then
  log "同步项目文件..."
  rsync -avz --delete \
    --exclude-from="$SCRIPT_DIR/rsync-exclude.txt" \
    -e "$RSYNC_SSH" \
    "$PROJECT_ROOT/" "$SSH_TARGET:$REMOTE_DIR/"
fi

if [[ "$MODE" == "--sync-only" ]]; then
  log "仅同步完成 (--sync-only)"
  exit 0
fi

log "在服务器上构建并发布..."
run_ssh "$SSH_TARGET" \
  "REMOTE_DIR='$REMOTE_DIR' DEPLOY_DIR='$REMOTE_DIR/deploy' APP_PORT='$APP_PORT' NGINX_PORT='$NGINX_PORT' PM2_APP_NAME='$PM2_APP_NAME' AUTO_SETUP='$AUTO_SETUP' SERVER_HOST='$SERVER_HOST' bash -s" \
  < "$SCRIPT_DIR/remote-deploy.sh"

log "部署完成"
log "课件:   http://${SERVER_HOST}:${NGINX_PORT}/"
log "Fitness: http://${SERVER_HOST}/"
