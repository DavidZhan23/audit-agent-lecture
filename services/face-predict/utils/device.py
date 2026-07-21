"""设备选择与环境信息打印。"""

from __future__ import annotations

import logging

import torch

logger = logging.getLogger(__name__)


def get_device() -> torch.device:
    """按 MPS → CUDA → CPU 优先级选择计算设备。"""
    if torch.backends.mps.is_available():
        return torch.device("mps")
    if torch.cuda.is_available():
        return torch.device("cuda")
    return torch.device("cpu")


def print_device_info() -> torch.device:
    """打印 PyTorch 与设备信息，并返回当前设备。"""
    device = get_device()
    mps_available = torch.backends.mps.is_available()
    cuda_available = torch.cuda.is_available()

    print("=" * 60)
    print(f"PyTorch 版本：{torch.__version__}")
    print(f"当前使用设备：{device}")
    print(f"MPS 是否可用：{mps_available}")
    print(f"CUDA 是否可用：{cuda_available}")
    print("=" * 60)

    logger.info(
        "device=%s torch=%s mps=%s cuda=%s",
        device,
        torch.__version__,
        mps_available,
        cuda_available,
    )
    return device
