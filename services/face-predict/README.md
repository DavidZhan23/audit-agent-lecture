# 人脸推理服务（ANN 课堂演示）

从「认出笑雨」项目抽取的**最小推理包**：ResNet18 迁移学习 checkpoint + 人脸检测裁剪 + HTTP API。

## 模型

| 项 | 值 |
|----|-----|
| 类型 | `transfer_resnet18`（ImageNet 预训练 ResNet18） |
| 输入尺寸 | **224×224**（以 checkpoint 内 `image_size` 为准） |
| 训练类别 | `笑雨` / `骐源` / `其他` |
| 展示标签 | `笑雨` / `骐源` / `其他人物` / `无法确定`（置信度 &lt; 0.70） |
| 权重 | `checkpoints/transfer/best.pt`（约 123MB） |
| 设备 | Apple Silicon 优先 **MPS**，否则 CUDA / CPU |

## 目录

```text
services/face-predict/
├── config.py
├── infer.py                 # 核心推理（懒加载单例）
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

或在仓库根目录：`npm run face-api`。

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
  "confidence": 0.91,
  "threshold": 0.7
}
```

`label` 可能为：`笑雨` / `骐源` / `其他人物` / `无法确定`。

## 与课件前端联调

1. 先启动本服务（8765）  
2. 再在项目根目录 `npm run dev`（默认 3000）  
3. 打开课程 **ANN**，使用「真实 ANN 演示」上传或拍照  

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

## 从「认出笑雨demo」升级权重

正式权重二选一（内容相同）：

- `认出笑雨demo/checkpoints/best.pt`
- `认出笑雨demo/checkpoints/transfer/best.pt`

复制到本目录：

```bash
cp "/Users/davidzhan/Desktop/认出笑雨demo/checkpoints/transfer/best.pt" \
  "services/face-predict/checkpoints/transfer/best.pt"
```

并保持 `config.IMAGE_SIZE=224`、`DROPOUT=0.35`。推理时会读取 checkpoint 内的 `image_size` / `dropout`。

可同步的代码（不要拷 dataset / train）：

- `models/transfer_model.py`
- `utils/face_detection.py` / `checkpoint.py` / `device.py`
- `assets/haarcascade_frontalface_default.xml`

## 生产部署

一键部署脚本会同步本目录（含 checkpoint）、安装依赖，并由 PM2 拉起 `face-predict`。详见仓库根 `README.md` 与 `deploy/`。
