# 互动组件清单

实现：`app/course-interactives.tsx`；部分在 `app/page.tsx`。

| 组件 | 主要章节 | 作用 |
|------|----------|------|
| `TaskLogicDemo` | code | Excel 双表：报销金额 vs 开票金额（映射+判断） |
| `FeatureFittingDemo` | ml | 单表：弱信号 + 历史核实标签 → 预测 NEW；讲义板书 |
| `AnnPixelDemo` | nn | 票据图片收件箱 + DigitsImageLab + 结构图/公式板书 |
| `ReceiptImageInbox` | nn（嵌在 AnnPixelDemo） | 一叠待识别收据图：人眼慢 → 计算机认数字 |
| `MlpNetworkDiagram` / `CnnPipelineDiagram` / `NetworkComparePanel` | nn（`app/nn-diagrams.tsx`） | MLP/CNN 结构图；同框按钮切换对比 |
| `LessonTakeaway` | 备用/旧版章节 | 本章一句话 |
| `DeepDive` | 备用（当前 Home 的 nn 已精简） | 可折叠扩展 |
| `KnownUnknownBridge` / `FunctionFittingLab` / `ConfusionMatrixLab` | 备用（当前 Home 的 ml 已精简） | 旧版 ML 互动 |
| `NeuronContinuityLab` 等 | 备用（旧版 nn DeepDive） | ANN 解剖 |
| `DigitsImageLab` | nn（嵌在 AnnPixelDemo） | 自构 16×16 示意像素 → 数字 0—9 |
| `FacePredictLab` | nn 趣味支线 | 真实 ResNet18（224）人脸：上传/拍照 → 检测裁剪 → 三类概率；低置信拒识 |
| `LlmContextDemo` | llm | BX-42519 语境证据 + Token 互动 + 板书（内嵌 Attention） |
| `ContextEvidenceInbox` | llm（嵌在 LlmContextDemo） | 说明/小票/CRM/日历多段文字 |
| `LanguageTrainingShift` / `AttentionLab` | llm（嵌在 LlmContextDemo） | 下一 Token 样本；语境关注哪些词 |
| `AgentBranchLab` | agent | BX-42017行程矛盾 / 行程一致 / 工具失败三分支 |
| `AuditAgentCanvas` | audit（预习 DeepDive） | 设计画布 |
| `ToyDatasetExplorer` / `CaseMatrix` | audit（预习） | 多表与情形矩阵 |
| `Quiz` | audit 收束 | 结课自测 |

Agent 长章的规范列表、架构 stack、好处双栏为 `page.tsx` 内静态内容块（非独立导出组件）。
