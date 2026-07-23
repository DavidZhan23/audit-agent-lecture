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
  https://211.159.166.109:8443/   （网页内实时摄像头；需另跑 ./deploy/enable-https.sh）

ANN 人脸演示（第 ③ 章）会随脚本部署：同步 checkpoint、安装 Python 依赖、
PM2 启动 face-predict（本机 8765），课件经 /api/face-predict 代理。
HTTP 可用上传/手机拍照；电脑网页内摄像头请用 HTTPS :8443。

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
HTTPS_PORT="${HTTPS_PORT:-8443}"
PM2_APP_NAME="${PM2_APP_NAME:-audit-courseware}"
PM2_FACE_NAME="${PM2_FACE_NAME:-face-predict}"
ENABLE_FACE_PREDICT="${ENABLE_FACE_PREDICT:-true}"
FACE_PREDICT_HOST="${FACE_PREDICT_HOST:-127.0.0.1}"
FACE_PREDICT_PORT="${FACE_PREDICT_PORT:-8765}"
FACE_PREDICT_URL="${FACE_PREDICT_URL:-http://${FACE_PREDICT_HOST}:${FACE_PREDICT_PORT}}"
AUTO_SETUP="${AUTO_SETUP:-true}"
SSH_OPTS=(-o StrictHostKeyChecking=accept-new -o ConnectTimeout=30 -o ServerAliveInterval=10)

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
log "人脸推理:   ENABLE_FACE_PREDICT=$ENABLE_FACE_PREDICT ($FACE_PREDICT_URL)"

if [[ "$ENABLE_FACE_PREDICT" == "true" ]]; then
  local_ckpt="$PROJECT_ROOT/services/face-predict/checkpoints/transfer/best.pt"
  if [[ ! -f "$local_ckpt" ]]; then
    fail "本机缺少模型权重 $local_ckpt（约 247MB），无法部署 ANN 演示。可设 ENABLE_FACE_PREDICT=false 仅部署课件。"
  fi
  log "检测到 checkpoint: $(du -h "$local_ckpt" | awk '{print $1}')"
fi

log "测试 SSH 连接..."
if ! run_ssh "$SSH_TARGET" "echo ok" >/dev/null; then
  fail "无法 SSH 到 ${SSH_TARGET} (超时或认证失败). 请检查: 1) 本机网络 2) 腾讯云安全组是否放行 22 3) 服务器是否开机 4) 密码/密钥是否正确"
fi

log "确保远程目录存在..."
run_ssh "$SSH_TARGET" \
  "sudo mkdir -p '$REMOTE_DIR' && sudo chown -R \"\$USER:\$USER\" '$REMOTE_DIR'"

if [[ "$MODE" != "--setup-only" ]]; then
  log "同步项目文件（含 services/face-predict 与 checkpoint，排除 .venv）..."
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
  "REMOTE_DIR='$REMOTE_DIR' DEPLOY_DIR='$REMOTE_DIR/deploy' APP_PORT='$APP_PORT' NGINX_PORT='$NGINX_PORT' PM2_APP_NAME='$PM2_APP_NAME' PM2_FACE_NAME='$PM2_FACE_NAME' ENABLE_FACE_PREDICT='$ENABLE_FACE_PREDICT' FACE_PREDICT_HOST='$FACE_PREDICT_HOST' FACE_PREDICT_PORT='$FACE_PREDICT_PORT' FACE_PREDICT_URL='$FACE_PREDICT_URL' AUTO_SETUP='$AUTO_SETUP' SERVER_HOST='$SERVER_HOST' bash -s" \
  < "$SCRIPT_DIR/remote-deploy.sh"

log "部署完成"
log "课件 HTTP:  http://${SERVER_HOST}:${NGINX_PORT}/"
log "课件 HTTPS: https://${SERVER_HOST}:${HTTPS_PORT}/  （网页内摄像头；需 ./deploy/enable-https.sh）"
log "ANN:        第 ③ 章「真实 ANN 演示」→ 上传 / 手机拍照 / HTTPS 下打开摄像头"
log "Fitness:    http://${SERVER_HOST}/"
