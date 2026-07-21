"""迁移学习模型：ImageNet 预训练 ResNet18。"""

from __future__ import annotations

from typing import Optional

import torch
import torch.nn as nn
from torchvision import models

import config


class TransferResNet18(nn.Module):
    """基于 ResNet18 的三分类迁移学习模型。"""

    def __init__(
        self,
        num_classes: int = config.NUM_CLASSES,
        dropout: float = config.DROPOUT,
        pretrained: bool = True,
    ) -> None:
        super().__init__()
        self.num_classes = num_classes
        self.model_name = "transfer_resnet18"

        weights = models.ResNet18_Weights.DEFAULT if pretrained else None
        backbone = models.resnet18(weights=weights)
        in_features = backbone.fc.in_features
        backbone.fc = nn.Sequential(
            nn.Dropout(p=dropout),
            nn.Linear(in_features, num_classes),
        )
        self.backbone = backbone

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        """返回 logits，不在模型内做 Softmax。"""
        return self.backbone(x)

    def freeze_backbone(self) -> None:
        """冻结除分类头以外的全部参数。"""
        for name, param in self.backbone.named_parameters():
            param.requires_grad = name.startswith("fc.")

    def unfreeze_layer4(self) -> None:
        """解冻 layer4 与分类头，保持更低层冻结。"""
        for name, param in self.backbone.named_parameters():
            if name.startswith("layer4.") or name.startswith("fc."):
                param.requires_grad = True
            else:
                param.requires_grad = False

    def unfreeze_layer3_and_layer4(self) -> None:
        """解冻 layer3、layer4 与分类头，适合小数据上进一步提升区分度。"""
        for name, param in self.backbone.named_parameters():
            if (
                name.startswith("layer3.")
                or name.startswith("layer4.")
                or name.startswith("fc.")
            ):
                param.requires_grad = True
            else:
                param.requires_grad = False

    def unfreeze_all(self) -> None:
        """解冻全部参数。"""
        for param in self.parameters():
            param.requires_grad = True

    def trainable_parameter_names(self) -> list[str]:
        """返回当前可训练参数名。"""
        return [name for name, p in self.named_parameters() if p.requires_grad]


def build_transfer_model(
    num_classes: int = config.NUM_CLASSES,
    dropout: float = config.DROPOUT,
    pretrained: bool = True,
) -> TransferResNet18:
    """构建迁移学习模型。"""
    return TransferResNet18(
        num_classes=num_classes,
        dropout=dropout,
        pretrained=pretrained,
    )
