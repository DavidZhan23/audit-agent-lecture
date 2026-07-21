"""FastAPI：POST /api/face-predict 接收图片，返回分类 JSON。"""

from __future__ import annotations

import logging
import os
from typing import Any, Dict

from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware

import config
from infer import get_predictor

logging.basicConfig(
    level=getattr(logging, config.LOG_LEVEL),
    format="%(asctime)s | %(levelname)s | %(message)s",
)
logger = logging.getLogger(__name__)

app = FastAPI(title="Face Predict API", version="0.1.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def warmup() -> None:
    """启动时预加载模型，避免首请求过慢。"""
    try:
        get_predictor()
        logger.info("模型预热完成")
    except Exception as exc:  # noqa: BLE001
        logger.exception("模型预热失败：%s", exc)


@app.get("/health")
def health() -> Dict[str, Any]:
    ckpt = config.DEFAULT_CHECKPOINT
    return {
        "ok": ckpt.exists(),
        "checkpoint": str(ckpt),
        "checkpoint_exists": ckpt.exists(),
    }


@app.post("/api/face-predict")
async def face_predict(image: UploadFile = File(...)) -> Dict[str, Any]:
    if not image.content_type or not image.content_type.startswith("image/"):
        # 部分浏览器拍照 blob 可能是 application/octet-stream，仍尝试解析
        if image.content_type not in (None, "application/octet-stream"):
            raise HTTPException(status_code=400, detail="请上传图片文件")

    data = await image.read()
    if not data:
        raise HTTPException(status_code=400, detail="空文件")
    if len(data) > 12 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="图片过大（上限 12MB）")

    try:
        predictor = get_predictor()
        result = predictor.predict_bytes(data)
    except FileNotFoundError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc
    except Exception as exc:  # noqa: BLE001
        logger.exception("推理失败")
        raise HTTPException(status_code=500, detail=f"推理失败：{exc}") from exc

    if not result.get("ok"):
        raise HTTPException(
            status_code=422,
            detail=result.get("message", "无法完成预测"),
        )

    # 对外契约：label / probs / confidence
    return {
        "label": result["label"],
        "probs": result["probs"],
        "confidence": result["confidence"],
    }


def main() -> None:
    import uvicorn

    host = os.environ.get("FACE_PREDICT_HOST", "127.0.0.1")
    port = int(os.environ.get("FACE_PREDICT_PORT", "8765"))
    uvicorn.run("server:app", host=host, port=port, reload=False)


if __name__ == "__main__":
    main()
