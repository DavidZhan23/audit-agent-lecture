"""迁移学习模型：ImageNet 预训练 ResNet（默认 ResNet34，容量更大）。"""

from __future__ import annotations

from typing import Literal

import torch
import torch.nn as nn
from torchvision import models

import config

BackboneName = Literal["resnet18", "resnet34"]


def _build_backbone(backbone: BackboneName, pretrained: bool):
    if backbone == "resnet34":
        weights = models.ResNet34_Weights.DEFAULT if pretrained else None
        return models.resnet34(weights=weights)
    weights = models.ResNet18_Weights.DEFAULT if pretrained else None
    return models.resnet18(weights=weights)


class TransferResNet(nn.Module):
    """基于 ResNet 的三分类迁移学习模型。"""

    def __init__(
        self,
        num_classes: int = config.NUM_CLASSES,
        dropout: float = config.DROPOUT,
        pretrained: bool = True,
        backbone: BackboneName = "resnet34",
        head_hidden: int = 512,
    ) -> None:
        super().__init__()
        self.num_classes = num_classes
        self.backbone_name = backbone
        self.model_name = f"transfer_{backbone}"
        self.head_hidden = head_hidden

        net = _build_backbone(backbone, pretrained=pretrained)
        in_features = net.fc.in_features
        if head_hidden and head_hidden > 0:
            # 双层分类头：增加可学习参数，提升区分度
            net.fc = nn.Sequential(
                nn.Dropout(p=dropout),
                nn.Linear(in_features, head_hidden),
                nn.ReLU(inplace=True),
                nn.Dropout(p=dropout),
                nn.Linear(head_hidden, num_classes),
            )
        else:
            # 兼容旧 checkpoint：Dropout + 单层 Linear
            net.fc = nn.Sequential(
                nn.Dropout(p=dropout),
                nn.Linear(in_features, num_classes),
            )
        self.backbone = net

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        """返回 logits，不在模型内做 Softmax。"""
        return self.backbone(x)

    def freeze_backbone(self) -> None:
        """冻结除分类头以外的全部参数。"""
        for name, param in self.backbone.named_parameters():
            param.requires_grad = name.startswith("fc.")

    def unfreeze_layer4(self) -> None:
        """解冻 layer4 与分类头。"""
        for name, param in self.backbone.named_parameters():
            if name.startswith("layer4.") or name.startswith("fc."):
                param.requires_grad = True
            else:
                param.requires_grad = False

    def unfreeze_layer3_and_layer4(self) -> None:
        """解冻 layer3、layer4 与分类头。"""
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


def infer_backbone_and_head(checkpoint: dict) -> tuple[BackboneName, int]:
    """从 checkpoint 推断 backbone 与 head_hidden。"""
    model_name = str(checkpoint.get("model_name", ""))
    cfg = checkpoint.get("config") or {}
    backbone: BackboneName = cfg.get("backbone") or (
        "resnet34" if "resnet34" in model_name else "resnet18"
    )
    sd = checkpoint.get("model_state_dict") or {}
    # 新头含 fc.4.weight；旧头只有 fc.1.weight
    if any(str(k).startswith("backbone.fc.4.") for k in sd):
        head_hidden = int(cfg.get("head_hidden", 512))
    else:
        head_hidden = 0
    return backbone, head_hidden


def build_transfer_model(
    num_classes: int = config.NUM_CLASSES,
    dropout: float = config.DROPOUT,
    pretrained: bool = True,
    backbone: BackboneName | None = None,
    head_hidden: int | None = None,
) -> TransferResNet:
    """构建迁移学习模型。"""
    return TransferResNet(
        num_classes=num_classes,
        dropout=dropout,
        pretrained=pretrained,
        backbone=backbone or getattr(config, "TRANSFER_BACKBONE", "resnet34"),
        head_hidden=head_hidden
        if head_hidden is not None
        else int(getattr(config, "TRANSFER_HEAD_HIDDEN", 512)),
    )


def build_transfer_from_checkpoint(
    checkpoint: dict,
    device: torch.device,
) -> TransferResNet:
    """按 checkpoint 结构构建并加载权重。"""
    cfg = checkpoint.get("config") or {}
    dropout = cfg.get("dropout", config.DROPOUT)
    backbone, head_hidden = infer_backbone_and_head(checkpoint)
    model = build_transfer_model(
        dropout=dropout,
        pretrained=False,
        backbone=backbone,
        head_hidden=head_hidden,
    )
    expected = f"transfer_{backbone}"
    if checkpoint.get("model_name") not in {expected, "transfer_resnet18", "transfer_resnet34"}:
        raise ValueError(
            f"模型类型不匹配：期望 transfer_resnet18/34，实际 {checkpoint.get('model_name')}"
        )
    model.load_state_dict(checkpoint["model_state_dict"])
    model.to(device)
    model.eval()
    return model


# 兼容旧导入名
TransferResNet18 = TransferResNet
