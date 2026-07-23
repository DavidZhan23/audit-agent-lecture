"""Checkpoint 保存与加载。"""

from __future__ import annotations

import logging
from pathlib import Path
from typing import Any, Dict, Optional

import torch
import torch.nn as nn

import config

logger = logging.getLogger(__name__)

REQUIRED_KEYS = (
    "model_name",
    "model_state_dict",
    "class_names",
    "class_to_index",
    "image_size",
)


def save_checkpoint(
    path: Path,
    model: nn.Module,
    optimizer: Optional[torch.optim.Optimizer],
    scheduler: Optional[Any],
    epoch: int,
    best_val_loss: float,
    best_val_accuracy: float,
    model_name: str,
    extra: Optional[Dict[str, Any]] = None,
) -> None:
    """保存完整 checkpoint。"""
    path = Path(path)
    path.parent.mkdir(parents=True, exist_ok=True)

    payload: Dict[str, Any] = {
        "model_name": model_name,
        "model_state_dict": model.state_dict(),
        "optimizer_state_dict": optimizer.state_dict() if optimizer is not None else None,
        "scheduler_state_dict": scheduler.state_dict() if scheduler is not None else None,
        "epoch": epoch,
        "best_val_loss": best_val_loss,
        "best_val_accuracy": best_val_accuracy,
        "class_names": list(config.CLASS_NAMES),
        "class_to_index": dict(config.CLASS_TO_INDEX),
        "image_size": config.IMAGE_SIZE,
        "normalization_mean": list(config.IMAGENET_MEAN),
        "normalization_std": list(config.IMAGENET_STD),
        "config": {
            "seed": config.SEED,
            "batch_size": config.BATCH_SIZE,
            "dropout": config.DROPOUT,
            "weight_decay": config.WEIGHT_DECAY,
            "use_class_weights": config.USE_CLASS_WEIGHTS,
            "backbone": getattr(config, "TRANSFER_BACKBONE", "resnet34"),
            "head_hidden": int(getattr(config, "TRANSFER_HEAD_HIDDEN", 512)),
        },
    }
    if extra:
        payload.update(extra)

    torch.save(payload, path)
    logger.info("已保存 checkpoint：%s", path)


def load_checkpoint(
    path: Path,
    device: torch.device,
    expected_model_name: Optional[str] = None,
) -> Dict[str, Any]:
    """加载 checkpoint，并校验关键字段与类别映射。"""
    path = Path(path)
    if not path.exists():
        raise FileNotFoundError(
            f"找不到模型文件：{path}\n"
            f"请先运行对应的训练脚本生成 checkpoint。"
        )

    checkpoint = torch.load(path, map_location=device)
    if not isinstance(checkpoint, dict):
        raise ValueError(f"checkpoint 格式无效（应为 dict）：{path}")

    missing = [k for k in REQUIRED_KEYS if k not in checkpoint]
    if missing:
        raise ValueError(f"checkpoint 缺少必要字段 {missing}：{path}")

    if expected_model_name is not None and checkpoint["model_name"] != expected_model_name:
        raise ValueError(
            f"模型类型不匹配：期望 {expected_model_name}，实际 {checkpoint['model_name']}"
        )

    class_names = checkpoint["class_names"]
    if list(class_names) != list(config.CLASS_NAMES):
        raise ValueError(
            "类别名称或顺序与当前配置不一致，可能导致标签错位。\n"
            f"checkpoint: {class_names}\n"
            f"config:     {config.CLASS_NAMES}"
        )

    class_to_index = checkpoint["class_to_index"]
    if dict(class_to_index) != dict(config.CLASS_TO_INDEX):
        raise ValueError(
            "类别映射与当前配置不一致。\n"
            f"checkpoint: {class_to_index}\n"
            f"config:     {config.CLASS_TO_INDEX}"
        )

    if int(checkpoint["image_size"]) != int(config.IMAGE_SIZE):
        logger.warning(
            "checkpoint image_size=%s 与当前 IMAGE_SIZE=%s 不同，将使用 checkpoint 中的尺寸。",
            checkpoint["image_size"],
            config.IMAGE_SIZE,
        )

    logger.info("已加载 checkpoint：%s (epoch=%s)", path, checkpoint.get("epoch"))
    return checkpoint


def count_parameters(model: nn.Module) -> Dict[str, int]:
    """统计总参数量与可训练参数量。"""
    total = sum(p.numel() for p in model.parameters())
    trainable = sum(p.numel() for p in model.parameters() if p.requires_grad)
    return {"total": int(total), "trainable": int(trainable)}
