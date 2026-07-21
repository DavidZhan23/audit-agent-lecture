"""模型包：仅导出迁移学习 ResNet18。"""

from models.transfer_model import TransferResNet18, build_transfer_model

__all__ = ["TransferResNet18", "build_transfer_model"]
