"""人脸推理服务配置（仅保留推理所需项）。"""

from __future__ import annotations

from pathlib import Path
from typing import Dict, List

PROJECT_ROOT: Path = Path(__file__).resolve().parent

CLASS_NAMES: List[str] = ["笑雨", "骐源", "其他"]
CLASS_TO_INDEX: Dict[str, int] = {"笑雨": 0, "骐源": 1, "其他": 2}
INDEX_TO_CLASS: Dict[int, str] = {v: k for k, v in CLASS_TO_INDEX.items()}
NUM_CLASSES: int = len(CLASS_NAMES)

CHECKPOINTS_DIR: Path = PROJECT_ROOT / "checkpoints"
TRANSFER_CHECKPOINT_DIR: Path = CHECKPOINTS_DIR / "transfer"
DEFAULT_CHECKPOINT: Path = TRANSFER_CHECKPOINT_DIR / "best.pt"

IMAGE_SIZE: int = 224
DROPOUT: float = 0.35
TRANSFER_BACKBONE: str = "resnet34"
TRANSFER_HEAD_HIDDEN: int = 512

FACE_EXPAND_RATIO: float = 0.30
FACE_MIN_SIZE: int = 40

IMAGENET_MEAN: List[float] = [0.485, 0.456, 0.406]
IMAGENET_STD: List[float] = [0.229, 0.224, 0.225]

# 课件演示默认拒识阈值（与产品约定一致）
UNKNOWN_CONFIDENCE_THRESHOLD: float = 0.70
LOG_LEVEL: str = "INFO"
