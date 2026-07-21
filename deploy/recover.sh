#!/usr/bin/env bash
# 重启后恢复课件（不重新 npm install / 不重装 torch）
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
PM2_APP_NAME="${PM2_APP_NAME:-audit-courseware}"
PM2_FACE_NAME="${PM2_FACE_NAME:-face-predict}"
# 重启恢复默认先不启人脸，避免再次内存打满；需要人脸时：
#   RECOVER_WITH_FACE=true ./deploy/recover.sh
if [[ "${RECOVER_WITH_FACE:-}" == "true" ]]; then
  ENABLE_FACE_PREDICT=true
else
  ENABLE_FACE_PREDICT=false
fi
FACE_PREDICT_HOST="${FACE_PREDICT_HOST:-127.0.0.1}"
FACE_PREDICT_PORT="${FACE_PREDICT_PORT:-8765}"
FACE_PREDICT_URL="${FACE_PREDICT_URL:-http://${FACE_PREDICT_HOST}:${FACE_PREDICT_PORT}}"

SSH_TARGET="${SERVER_USER}@${SERVER_HOST}"
SSH_OPTS=(-o StrictHostKeyChecking=accept-new -o ConnectTimeout=30)
SSH_CMD=(ssh "${SSH_OPTS[@]}")
if [[ -n "${SSH_KEY:-}" ]]; then
  SSH_CMD+=(-i "${SSH_KEY/#\~/$HOME}")
fi

log() { printf '[recover] %s\n' "$*"; }
fail() { printf '[recover] 错误: %s\n' "$*" >&2; exit 1; }

log "连接 ${SSH_TARGET} ..."
"${SSH_CMD[@]}" "$SSH_TARGET" "echo ok" >/dev/null || fail "无法 SSH，请先手动: ssh ${SSH_TARGET}"

log "在服务器上拉起 PM2（ENABLE_FACE_PREDICT=${ENABLE_FACE_PREDICT}) ..."
"${SSH_CMD[@]}" "$SSH_TARGET" bash -s <<EOF
set -euo pipefail
export PATH="/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin:\$PATH"
cd '$REMOTE_DIR' || { echo "缺少目录 $REMOTE_DIR"; exit 1; }
command -v pm2 >/dev/null || { echo "缺少 pm2"; exit 1; }
command -v node >/dev/null || { echo "缺少 node"; exit 1; }

export REMOTE_DIR='$REMOTE_DIR'
export PUBLIC_PORT='$NGINX_PORT'
export NGINX_PORT='$NGINX_PORT'
export PM2_APP_NAME='$PM2_APP_NAME'
export PM2_FACE_NAME='$PM2_FACE_NAME'
export ENABLE_FACE_PREDICT='$ENABLE_FACE_PREDICT'
export FACE_PREDICT_HOST='$FACE_PREDICT_HOST'
export FACE_PREDICT_PORT='$FACE_PREDICT_PORT'
export FACE_PREDICT_URL='$FACE_PREDICT_URL'

pm2 delete '$PM2_APP_NAME' >/dev/null 2>&1 || true
pm2 delete '$PM2_FACE_NAME' >/dev/null 2>&1 || true

if [[ ! -f deploy/ecosystem.config.cjs ]]; then
  echo "缺少 deploy/ecosystem.config.cjs"
  exit 1
fi
if [[ ! -x node_modules/.bin/vinext ]]; then
  echo "缺少 node_modules，请在本机重新执行 ./deploy/deploy.sh"
  exit 1
fi

pm2 start deploy/ecosystem.config.cjs --update-env
pm2 save
# 配置开机自启（失败可忽略）
pm2 startup systemd -u "\$USER" --hp "\$HOME" >/tmp/pm2-startup-recover.txt 2>&1 || true
sleep 3
pm2 list
curl -s -o /dev/null -w "local_8080=%{http_code}\\n" "http://127.0.0.1:${NGINX_PORT}/" || true
EOF

log "完成。请访问: http://${SERVER_HOST}:${NGINX_PORT}/"
log "Fitness 应仍在: http://${SERVER_HOST}/"
log "若要启用人脸推理: 编辑 deploy.env 设 ENABLE_FACE_PREDICT=true 后再跑本脚本"
