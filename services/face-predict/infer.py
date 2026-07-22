"""核心推理：人脸检测裁剪 → ResNet18 分类 → JSON 友好结果。"""

from __future__ import annotations

import io
import logging
from functools import lru_cache
from pathlib import Path
from typing import Any, Dict, Optional, Tuple

import torch
import torch.nn.functional as F
from PIL import Image, ImageOps
from torchvision import transforms

import config
from models.transfer_model import build_transfer_model
from utils.checkpoint import load_checkpoint
from utils.device import get_device
from utils.face_detection import crop_face, get_default_face_detector

logger = logging.getLogger(__name__)


def map_final_label(pred_name: str, max_prob: float, threshold: float) -> str:
    if max_prob < threshold:
        return "无法确定"
    if pred_name == "其他":
        return "其他人物"
    return pred_name


def build_transform(image_size: int) -> transforms.Compose:
    return transforms.Compose(
        [
            transforms.Resize((image_size, image_size)),
            transforms.ToTensor(),
            transforms.Normalize(mean=config.IMAGENET_MEAN, std=config.IMAGENET_STD),
        ]
    )


@torch.no_grad()
def classify_face(
    model: torch.nn.Module,
    face_image: Image.Image,
    device: torch.device,
    image_size: int,
) -> Tuple[str, Dict[str, float], float]:
    transform = build_transform(image_size)
    tensor = transform(face_image).unsqueeze(0).to(device)
    logits = model(tensor)
    probs = F.softmax(logits, dim=1).cpu().numpy()[0]
    pred_idx = int(probs.argmax())
    pred_name = config.CLASS_NAMES[pred_idx]
    prob_dict = {name: float(probs[i]) for i, name in enumerate(config.CLASS_NAMES)}
    return pred_name, prob_dict, float(probs.max())


def load_image_from_bytes(data: bytes) -> Image.Image:
    image = Image.open(io.BytesIO(data))
    image = ImageOps.exif_transpose(image)
    return image.convert("RGB")


class FacePredictor:
    """懒加载单例：进程内只加载一次模型。"""

    def __init__(
        self,
        checkpoint_path: Path | None = None,
        confidence_threshold: float | None = None,
    ) -> None:
        self.checkpoint_path = Path(checkpoint_path or config.DEFAULT_CHECKPOINT)
        self.confidence_threshold = (
            config.UNKNOWN_CONFIDENCE_THRESHOLD
            if confidence_threshold is None
            else float(confidence_threshold)
        )
        self.device = get_device()
        self.detector = get_default_face_detector(min_size=config.FACE_MIN_SIZE)
        checkpoint = load_checkpoint(self.checkpoint_path, device=self.device)
        dropout = checkpoint.get("config", {}).get("dropout", config.DROPOUT)
        if checkpoint["model_name"] != "transfer_resnet18":
            raise ValueError(
                f"期望 transfer_resnet18，实际 {checkpoint['model_name']}"
            )
        model = build_transfer_model(dropout=dropout, pretrained=False)
        model.load_state_dict(checkpoint["model_state_dict"])
        model.to(self.device)
        model.eval()
        self.model = model
        self.image_size = int(checkpoint.get("image_size", config.IMAGE_SIZE))
        logger.info(
            "FacePredictor ready device=%s ckpt=%s image_size=%s threshold=%.2f dropout=%s",
            self.device,
            self.checkpoint_path,
            self.image_size,
            self.confidence_threshold,
            dropout,
        )

    def predict_pil(self, image: Image.Image) -> Dict[str, Any]:
        cropped, faces, selected = crop_face(
            image,
            detector=self.detector,
            expand_ratio=config.FACE_EXPAND_RATIO,
            min_size=config.FACE_MIN_SIZE,
        )
        if cropped is None or selected is None:
            return {
                "ok": False,
                "error": "no_face",
                "message": "未检测到人脸，请换更清晰、更大的正脸照片。",
                "faces_detected": 0,
            }

        pred_name, prob_dict, max_prob = classify_face(
            self.model, cropped, self.device, self.image_size
        )
        label = map_final_label(pred_name, max_prob, self.confidence_threshold)
        return {
            "ok": True,
            "label": label,
            "probs": {
                "笑雨": prob_dict["笑雨"],
                "骐源": prob_dict["骐源"],
                "其他": prob_dict["其他"],
            },
            "confidence": max_prob,
            "raw_class": pred_name,
            "threshold": self.confidence_threshold,
            "faces_detected": len(faces),
            "device": str(self.device),
        }

    def predict_bytes(self, data: bytes) -> Dict[str, Any]:
        image = load_image_from_bytes(data)
        return self.predict_pil(image)


@lru_cache(maxsize=1)
def get_predictor() -> FacePredictor:
    return FacePredictor()
