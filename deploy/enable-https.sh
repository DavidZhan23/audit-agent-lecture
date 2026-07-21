#!/usr/bin/env bash
# 为课件开启公网 HTTPS（自签名证书，端口 8443），以便浏览器允许摄像头
# 用法（本机）: ./deploy/enable-https.sh
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ENV_FILE="$SCRIPT_DIR/deploy.env"

if [[ ! -f "$ENV_FILE" ]]; then
  echo "未找到 $ENV_FILE"
  exit 1
fi
# shellcheck disable=SC1090
source "$ENV_FILE"

SERVER_HOST="${SERVER_HOST:-211.159.166.109}"
SERVER_USER="${SERVER_USER:-root}"
REMOTE_DIR="${REMOTE_DIR:-/var/www/audit-agent-courseware}"
NGINX_PORT="${NGINX_PORT:-8080}"
HTTPS_PORT="${HTTPS_PORT:-8443}"

SSH_TARGET="${SERVER_USER}@${SERVER_HOST}"
SSH_OPTS=(-o StrictHostKeyChecking=accept-new -o ConnectTimeout=30)
SSH_CMD=(ssh "${SSH_OPTS[@]}")
RSYNC_SSH="ssh -o StrictHostKeyChecking=accept-new -o ConnectTimeout=30"
if [[ -n "${SSH_KEY:-}" ]]; then
  SSH_CMD+=(-i "${SSH_KEY/#\~/$HOME}")
  RSYNC_SSH="ssh -o StrictHostKeyChecking=accept-new -o ConnectTimeout=30 -i ${SSH_KEY/#\~/$HOME}"
fi

log() { printf '[https] %s\n' "$*"; }
fail() { printf '[https] 错误: %s\n' "$*" >&2; exit 1; }

log "同步 HTTPS 反代脚本与证书模板..."
"${SSH_CMD[@]}" "$SSH_TARGET" "mkdir -p '$REMOTE_DIR/deploy'"
rsync -avz -e "$RSYNC_SSH" \
  "$SCRIPT_DIR/https-proxy.mjs" \
  "$SCRIPT_DIR/remote-enable-https.sh" \
  "$SSH_TARGET:$REMOTE_DIR/deploy/"

log "在服务器上配置自签名证书 + PM2 HTTPS 反代 :${HTTPS_PORT}（不占用 80，不影响 fitness）..."
"${SSH_CMD[@]}" "$SSH_TARGET" \
  "REMOTE_DIR='$REMOTE_DIR' NGINX_PORT='$NGINX_PORT' HTTPS_PORT='$HTTPS_PORT' SERVER_HOST='$SERVER_HOST' bash '$REMOTE_DIR/deploy/remote-enable-https.sh'"

log "完成。"
log "1) 腾讯云防火墙/安全组放行 TCP ${HTTPS_PORT}"
log "2) 浏览器打开: https://${SERVER_HOST}:${HTTPS_PORT}/"
log "3) 首次会提示「证书不受信任」→ 高级 → 继续访问（自签名，仅课堂用）"
log "4) 之后即可使用「打开摄像头」。HTTP :${NGINX_PORT} 仍可用，但不能开摄像头。"
log "运维: pm2 logs courseware-https / pm2 restart courseware-https"
