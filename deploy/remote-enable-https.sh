#!/usr/bin/env bash
# 服务器端：自签名证书 + PM2 HTTPS 反代（8443），不启动系统 nginx，避免与 fitness 抢 80
set -euo pipefail

export PATH="/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin:${PATH:-}"

REMOTE_DIR="${REMOTE_DIR:-/var/www/audit-agent-courseware}"
NGINX_PORT="${NGINX_PORT:-8080}"
HTTPS_PORT="${HTTPS_PORT:-8443}"
SERVER_HOST="${SERVER_HOST:-127.0.0.1}"
PM2_HTTPS_NAME="${PM2_HTTPS_NAME:-courseware-https}"
CERT_DIR="$REMOTE_DIR/deploy/certs"
PROXY_JS="$REMOTE_DIR/deploy/https-proxy.mjs"

log() { printf '\n[https] %s\n' "$*"; }
fail() { printf '\n[https] 错误: %s\n' "$*" >&2; exit 1; }

ensure_certs() {
  mkdir -p "$CERT_DIR"
  local crt="$CERT_DIR/courseware.crt"
  local key="$CERT_DIR/courseware.key"
  if [[ -f "$crt" && -f "$key" ]]; then
    log "已有证书: $crt"
  else
    command -v openssl >/dev/null || fail "缺少 openssl"
    log "生成自签名证书（CN=$SERVER_HOST，825 天）..."
    # 兼容旧 openssl（无 -addext 时退回基础自签名）
    if openssl req -help 2>&1 | grep -q -- '-addext'; then
      openssl req -x509 -nodes -newkey rsa:2048 \
        -keyout "$key" -out "$crt" -days 825 \
        -subj "/CN=${SERVER_HOST}/O=AuditCourseware/C=CN" \
        -addext "subjectAltName=IP:${SERVER_HOST},DNS:${SERVER_HOST}"
    else
      openssl req -x509 -nodes -newkey rsa:2048 \
        -keyout "$key" -out "$crt" -days 825 \
        -subj "/CN=${SERVER_HOST}/O=AuditCourseware/C=CN"
    fi
  fi
  chmod 644 "$crt"
  chmod 600 "$key"
}

main() {
  [[ -f "$PROXY_JS" ]] || fail "缺少 $PROXY_JS"
  command -v node >/dev/null || fail "缺少 node"
  command -v pm2 >/dev/null || fail "缺少 pm2"

  # 探测课件是否在上游端口
  up_code="$(curl -s -o /dev/null -w '%{http_code}' "http://127.0.0.1:${NGINX_PORT}/" || true)"
  if [[ "$up_code" != "200" ]]; then
    log "警告: 上游课件 http://127.0.0.1:${NGINX_PORT}/ 返回 ${up_code:-000}，请先启动 audit-courseware"
  fi

  ensure_certs
  local crt="$CERT_DIR/courseware.crt"
  local key="$CERT_DIR/courseware.key"

  # 若之前失败的系统 nginx 半残，不影响我们；可选停掉以免误导
  if systemctl is-active --quiet nginx 2>/dev/null; then
    log "系统 nginx 正在运行；本方案不依赖它。若仅用于失败的 80 绑定可保持不动。"
  fi
  # 去掉可能残留的 8443 nginx 配置，避免以后误启动冲突
  if [[ -f /etc/nginx/conf.d/audit-courseware-https.conf ]]; then
    sudo rm -f /etc/nginx/conf.d/audit-courseware-https.conf || true
    log "已移除系统 nginx 的 8443 配置（改用 PM2 反代）"
  fi

  log "启动 PM2 进程 $PM2_HTTPS_NAME ：0.0.0.0:${HTTPS_PORT} → 127.0.0.1:${NGINX_PORT}"
  pm2 delete "$PM2_HTTPS_NAME" >/dev/null 2>&1 || true
  SSL_CERT="$crt" SSL_KEY="$key" HTTPS_PORT="$HTTPS_PORT" UPSTREAM="http://127.0.0.1:${NGINX_PORT}" \
    pm2 start "$PROXY_JS" --name "$PM2_HTTPS_NAME" --update-env
  pm2 save

  # 本机防火墙
  if command -v firewall-cmd >/dev/null 2>&1 && sudo firewall-cmd --state >/dev/null 2>&1; then
    sudo firewall-cmd --permanent --add-port="${HTTPS_PORT}/tcp" || true
    sudo firewall-cmd --reload || true
  elif command -v ufw >/dev/null 2>&1; then
    sudo ufw allow "${HTTPS_PORT}/tcp" || true
  fi

  sleep 2
  code="$(curl -sk -o /dev/null -w '%{http_code}' "https://127.0.0.1:${HTTPS_PORT}/" || true)"
  log "本机 HTTPS 探测: https://127.0.0.1:${HTTPS_PORT}/ -> HTTP ${code:-000}"
  [[ "$code" == "200" ]] || fail "HTTPS 反代未就绪（上游课件是否在 :${NGINX_PORT}？ pm2 list）"

  log "公网请访问: https://${SERVER_HOST}:${HTTPS_PORT}/"
  log "腾讯云安全组请放行 TCP ${HTTPS_PORT}"
}

main "$@"
