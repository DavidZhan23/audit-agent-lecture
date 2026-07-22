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
| `LlmContextDemo` / `LlmChapterRoute` | llm | BX-42519 动机 + 七步连续主线；明确本章学习顺序 |
| `ContextEvidenceInbox` | llm（嵌在 LlmContextDemo） | 说明/小票/CRM/日历多段文字 |
| `AnnToLlmGapDiagram` 等 | llm（`app/llm-diagrams.tsx`） | 缺口/连续关系/分词/生成循环/Attention/Transformer/生命周期/窗口/边界等图示 |
| `LanguageTrainingShift` / `AttentionLab` / `TokenLab` / `LlmPipeline` | llm | 下一 Token 样本；语境关注；手选 Token；五步流水线 |
| `LlmTrainingWorkbench` | llm | 四个训练状态；同步观察预测、Loss与参数更新 |
| `LlmCheckpointExplorer` | llm | 打开 config/tokenizer/权重文件；浏览真实同类张量名称与形状 |
| `LlmCallLab` | llm | request → 推理服务 → response；解释模型部署和调用 |
| `InlinePythonLab(attention / language / llm_call)` | llm | 计算微型Attention；运行神经语言模型训练；运行一次无网络模型调用模拟 |
| `AgentBranchLab` | agent | BX-42017行程矛盾 / 行程一致 / 工具失败三分支 |
| `AuditAgentCanvas` | audit（预习 DeepDive） | 设计画布 |
| `ToyDatasetExplorer` / `CaseMatrix` | audit（预习） | 多表与情形矩阵 |
| `Quiz` | audit 收束 | 结课自测 |

Agent 长章的规范列表、架构 stack、好处双栏为 `page.tsx` 内静态内容块（非独立导出组件）。
