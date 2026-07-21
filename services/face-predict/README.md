# 人脸推理服务（ANN 课堂演示）

从「认出笑雨」项目抽取的**最小推理包**：ResNet18 迁移学习 checkpoint + 人脸检测裁剪 + HTTP API。

## 目录

```text
services/face-predict/
├── config.py
├── infer.py                 # 核心推理
├── server.py                # FastAPI：POST /api/face-predict
├── requirements.txt
├── models/transfer_model.py
├── utils/{face_detection,checkpoint,device}.py
├── assets/haarcascade_frontalface_default.xml
└── checkpoints/transfer/best.pt   # ~123MB，勿删
```

## 安装与启动

在项目根目录：

```bash
cd services/face-predict
python3 -m venv .venv
source .venv/bin/activate          # Windows: .venv\Scripts\activate
pip install -r requirements.txt
python server.py                   # 默认 http://127.0.0.1:8765
```

健康检查：

```bash
curl http://127.0.0.1:8765/health
```

直接测推理：

```bash
curl -X POST http://127.0.0.1:8765/api/face-predict \
  -F "image=@/path/to/face.jpg"
```

期望 JSON：

```json
{
  "label": "笑雨",
  "probs": { "笑雨": 0.91, "骐源": 0.04, "其他": 0.05 },
  "confidence": 0.91
}
```

`label` 可能为：`笑雨` / `骐源` / `其他人物` / `无法确定`。

## 与课件前端联调

1. 先启动本服务（8765）  
2. 再在项目根目录 `npm run dev`（默认 3000）  
3. 打开课程 **③ 超多特征与 ANN**，使用「真实 ANN 演示」上传或拍照  

Next.js 通过 `app/api/face-predict/route.ts` **同源代理**到本服务，避免浏览器跨域。  
可用环境变量覆盖：

```bash
export FACE_PREDICT_URL=http://127.0.0.1:8765
```

## 环境变量

| 变量 | 默认 | 说明 |
|------|------|------|
| `FACE_PREDICT_HOST` | `127.0.0.1` | 绑定地址 |
| `FACE_PREDICT_PORT` | `8765` | 端口 |
| `FACE_PREDICT_URL` | `http://127.0.0.1:8765` | 前端代理目标（写在 Node 侧） |

## 生产部署

一键部署脚本会：

1. rsync 同步本目录与 `checkpoints/transfer/best.pt`（排除 `.venv`）  
2. 在服务器创建 `.venv`，安装 **CPU 版** torch + `requirements.deploy.txt`  
3. 用 PM2 进程 `face-predict` 启动 `server.py`（仅本机 8765，不对外开端口）  
4. 课件进程设置 `FACE_PREDICT_URL`，经 `/api/face-predict` 同源代理  

本地执行：`./deploy/deploy.sh`（见仓库根 `README.md` 部署节）。  
关闭人脸推理：`deploy.env` 中设 `ENABLE_FACE_PREDICT=false`。

## 说明

- Softmax 概率 ≠ 真实身份匹配概率；低置信度会标为「无法确定」  
- 仅课堂演示，不可用于门禁 / 支付等认证  
- 人脸数据敏感，请获授权后使用  
- **生产环境注意：** 公网 `http://IP` 不是安全上下文，浏览器会禁止网页内 `getUserMedia` 实时摄像头；请用「上传照片」或「拍照上传」。本地 `localhost` / HTTPS 可用实时摄像头。上传会在浏览器端自动压缩，避免 vinext 默认约 1MB 限制导致 413。  
