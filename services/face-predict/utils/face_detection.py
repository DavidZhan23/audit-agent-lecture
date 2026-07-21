"""人脸检测与裁剪模块。

默认使用 OpenCV Haar Cascade，接口设计便于后续替换为更强检测器。
"""

from __future__ import annotations

import logging
from abc import ABC, abstractmethod
from dataclasses import dataclass
from pathlib import Path
from typing import List, Optional, Sequence, Tuple, Union

import cv2
import numpy as np
from PIL import Image, ImageOps

logger = logging.getLogger(__name__)

ImageInput = Union[str, Path, Image.Image, np.ndarray]


@dataclass
class FaceBox:
    """人脸边界框（原图像素坐标）。"""

    x: int
    y: int
    w: int
    h: int

    @property
    def area(self) -> int:
        return max(0, self.w) * max(0, self.h)

    def as_xyxy(self) -> Tuple[int, int, int, int]:
        return self.x, self.y, self.x + self.w, self.y + self.h


class FaceDetector(ABC):
    """人脸检测器抽象基类，便于替换实现。"""

    @abstractmethod
    def detect(self, image_rgb: np.ndarray) -> List[FaceBox]:
        """在 RGB 图像上检测人脸，返回边界框列表。"""


def resolve_haar_cascade_path() -> Path:
    """解析 Haar Cascade 路径。

    优先使用项目内置文件（兼容 OpenCV 5 不再捆绑 cascade 的情况），
    其次回退到 ``cv2.data.haarcascades``。
    """
    bundled = Path(__file__).resolve().parent.parent / "assets" / "haarcascade_frontalface_default.xml"
    if bundled.exists():
        return bundled

    data_dir = getattr(cv2, "data", None)
    if data_dir is not None:
        cascade_dir = getattr(data_dir, "haarcascades", None)
        if cascade_dir:
            candidate = Path(cascade_dir) / "haarcascade_frontalface_default.xml"
            if candidate.exists():
                return candidate

    raise FileNotFoundError(
        "找不到 Haar Cascade 文件。请确认项目中存在："
        f"{bundled}"
    )


class HaarCascadeFaceDetector(FaceDetector):
    """基于 OpenCV Haar Cascade 的轻量人脸检测器。"""

    def __init__(
        self,
        scale_factor: float = 1.1,
        min_neighbors: int = 5,
        min_size: int = 40,
        cascade_path: Path | None = None,
    ) -> None:
        cascade_path = Path(cascade_path) if cascade_path else resolve_haar_cascade_path()
        if not cascade_path.exists():
            raise FileNotFoundError(f"找不到 Haar Cascade 文件：{cascade_path}")
        self.cascade = cv2.CascadeClassifier(str(cascade_path))
        if self.cascade.empty():
            raise RuntimeError(f"无法加载 Haar Cascade：{cascade_path}")
        self.scale_factor = scale_factor
        self.min_neighbors = min_neighbors
        self.min_size = min_size

    def detect(self, image_rgb: np.ndarray) -> List[FaceBox]:
        if image_rgb.ndim != 3 or image_rgb.shape[2] != 3:
            raise ValueError("输入图像必须是 HxWx3 的 RGB 数组")

        # 大图先缩放到最长边约 960，降低误检并加快速度，再把坐标映射回原图。
        h, w = image_rgb.shape[:2]
        max_side = max(h, w)
        scale = 1.0
        working = image_rgb
        if max_side > 960:
            scale = 960.0 / max_side
            working = cv2.resize(
                image_rgb,
                (int(w * scale), int(h * scale)),
                interpolation=cv2.INTER_AREA,
            )

        gray = cv2.cvtColor(working, cv2.COLOR_RGB2GRAY)
        min_size = max(20, int(self.min_size * scale))
        faces = self.cascade.detectMultiScale(
            gray,
            scaleFactor=self.scale_factor,
            minNeighbors=self.min_neighbors,
            minSize=(min_size, min_size),
            flags=cv2.CASCADE_SCALE_IMAGE,
        )

        inv = 1.0 / scale
        boxes: List[FaceBox] = []
        for x, y, fw, fh in faces:
            boxes.append(
                FaceBox(
                    x=int(x * inv),
                    y=int(y * inv),
                    w=int(fw * inv),
                    h=int(fh * inv),
                )
            )
        return boxes


def get_default_face_detector(min_size: int = 40) -> FaceDetector:
    """返回默认人脸检测器。"""
    return HaarCascadeFaceDetector(min_size=min_size)


def load_image_rgb(path: Union[str, Path]) -> Image.Image:
    """读取图片，修正 EXIF 方向并转为 RGB。支持中文路径。"""
    path = Path(path)
    if not path.exists():
        raise FileNotFoundError(f"图片不存在：{path}")

    # 使用二进制读取，避免某些平台对中文路径的兼容问题
    try:
        with path.open("rb") as f:
            image = Image.open(f)
            image = ImageOps.exif_transpose(image)
            image = image.convert("RGB")
            # 复制像素，避免文件句柄关闭后不可用
            image.load()
            return image.copy()
    except Exception as exc:  # noqa: BLE001
        raise ValueError(f"无法读取图片：{path}，原因：{exc}") from exc


def pil_to_rgb_ndarray(image: Image.Image) -> np.ndarray:
    """PIL Image → RGB ndarray。"""
    return np.asarray(image.convert("RGB"))


def expand_box(
    box: FaceBox,
    image_width: int,
    image_height: int,
    expand_ratio: float = 0.30,
) -> FaceBox:
    """按比例向外扩展人脸框，并裁剪到图像边界内。"""
    cx = box.x + box.w / 2.0
    cy = box.y + box.h / 2.0
    new_w = box.w * (1.0 + expand_ratio)
    new_h = box.h * (1.0 + expand_ratio)

    x1 = int(max(0, cx - new_w / 2.0))
    y1 = int(max(0, cy - new_h / 2.0))
    x2 = int(min(image_width, cx + new_w / 2.0))
    y2 = int(min(image_height, cy + new_h / 2.0))

    return FaceBox(x=x1, y=y1, w=max(1, x2 - x1), h=max(1, y2 - y1))


def select_largest_face(faces: Sequence[FaceBox]) -> Optional[FaceBox]:
    """选择面积最大的人脸。"""
    if not faces:
        return None
    return max(faces, key=lambda f: f.area)


def crop_face(
    image: Image.Image,
    detector: Optional[FaceDetector] = None,
    expand_ratio: float = 0.30,
    min_size: int = 40,
) -> Tuple[Optional[Image.Image], List[FaceBox], Optional[FaceBox]]:
    """检测并裁剪最大人脸。

    Returns:
        cropped_image: 裁剪后的人脸图，未检测到则为 None
        all_faces: 所有检测到的人脸框
        selected: 实际使用的人脸框
    """
    if detector is None:
        detector = get_default_face_detector(min_size=min_size)

    rgb = pil_to_rgb_ndarray(image)
    faces = detector.detect(rgb)

    # 首次未检出时，用更宽松的 Haar 参数再试一次
    if not faces and isinstance(detector, HaarCascadeFaceDetector):
        fallback = HaarCascadeFaceDetector(
            scale_factor=1.05,
            min_neighbors=3,
            min_size=max(20, min_size // 2),
        )
        faces = fallback.detect(rgb)

    selected = select_largest_face(faces)
    if selected is None:
        return None, list(faces), None

    # 若存在明显更大的主脸，过滤掉面积过小的疑似误检
    if len(faces) > 1:
        largest_area = selected.area
        faces = [f for f in faces if f.area >= 0.35 * largest_area]
        selected = select_largest_face(faces)

    expanded = expand_box(
        selected,
        image_width=image.width,
        image_height=image.height,
        expand_ratio=expand_ratio,
    )
    x1, y1, x2, y2 = expanded.as_xyxy()
    cropped = image.crop((x1, y1, x2, y2))
    return cropped, list(faces), expanded


def detect_and_crop_from_path(
    path: Union[str, Path],
    detector: Optional[FaceDetector] = None,
    expand_ratio: float = 0.30,
    min_size: int = 40,
) -> Tuple[Image.Image, Optional[Image.Image], List[FaceBox], Optional[FaceBox]]:
    """从路径读取图片并裁剪人脸。

    Returns:
        original_rgb, cropped_face, all_faces, selected_box
    """
    original = load_image_rgb(path)
    cropped, faces, selected = crop_face(
        original,
        detector=detector,
        expand_ratio=expand_ratio,
        min_size=min_size,
    )
    return original, cropped, faces, selected
