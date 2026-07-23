# 互动组件清单

实现：`app/course-interactives.tsx`；部分在 `app/page.tsx`。

| 组件 | 主要章节 | 作用 |
|------|----------|------|
| `CoursePager` | 全课 | 独立底部控制区；上一页/下一页、完整目录、页码与键盘导航；不覆盖正文，配合可显隐章节侧栏 |
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
| `FacePredictLab` | nn 趣味支线 | 真实 ResNet34（224，head_hidden=512）人脸：上传/拍照 → 检测裁剪 → 三类概率；阈值 0.70 拒识 |
| `LlmContextDemo` / `LlmChapterRoute` | llm | BX-42519 动机 + 七步连续主线；明确本章学习顺序 |
| `ContextEvidenceInbox` | llm（嵌在 LlmContextDemo） | 说明/小票/CRM/日历多段文字 |
| `AnnToLlmGapDiagram` 等 | llm（`app/llm-diagrams.tsx`） | 缺口/连续关系/分词/生成循环/Attention/Transformer/生命周期/窗口/边界等图示 |
| `LanguageTrainingShift` / `AttentionLab` / `TokenLab` / `LlmPipeline` | llm | 下一 Token 样本；语境关注；手选 Token；五步流水线 |
| `LlmTrainingWorkbench` | llm | 四个训练状态；同步观察预测、Loss与参数更新 |
| `LlmCheckpointExplorer` | llm | 打开 config/tokenizer/权重文件；浏览真实同类张量名称与形状 |
| `LlmCallLab` | llm | request → 推理服务 → response；解释模型部署和调用 |
| `InlinePythonLab(attention / language / llm_call)` | llm | 计算微型Attention；运行神经语言模型训练；运行一次无网络模型调用模拟 |
| `AgentChapterRoute` | part-2 | 章节06—09四章路线，避免一个大section平铺内容 |
| `AgentFitLab` | agent | 四类任务互动判断：程序、工作流、LLM应用或Agent |
| `AgentArchitectureExplorer` | agent | 六块架构的输入、产出与失败风险 |
| `ToolContractLab` | agent | 工具Schema、参数、成功/超时/拒绝返回与下一行动 |
| `AgentStateExplorer` | agent | 区分状态、记忆、轨迹并展示五类停止条件 |
| `AgentControlLab` | agent | 建议、只读、受控执行三种自主度与动作权限 |
| `AgentBranchLab` | agent | BX-42017行程矛盾 / 行程一致 / 工具失败三分支 |
| `AuditChapterRoute` | part-3 | 功能全景→智能问数→智能报告→共性治理四章路线 |
| `AuditCapabilityMap` | audit | 六类审计智能功能的输入、输出、技术组合与边界 |
| `AskDataLab` | audit-architecture | 指标查询、多表追问、口径不清、越权请求四种问数分支 |
| `ReportGenerationLab` | audit-evidence | 证据完整、原因缺失、数字冲突三种报告生成状态 |
| `AuditScenarioSelector` | audit | 对四类任务进行五维适配诊断 |
| `AuditEvidenceMap` | audit | 九表两制度到能力层与证据包的来源链 |
| `EvidencePackageLab` | audit | BX-42017五字段证据包逐项复核 |
| `AuditResponsibilityLab` | audit-evidence | 报告上下游六个审计环节的人机责任、交接物与原因 |
| `AuditEvaluationLab` | audit | 离线、影子、试点、扩围四阶段门槛 |
| `AuditAgentCanvas` | audit | 六步设计画布 |
| `CaseMatrix` | audit（折叠扩展） | 六类事项在五种技术下的结果差异 |
| `Quiz` | audit 收束 | 九题自测，新增智能问数与报告生成边界 |

第二、第三部分互动集中在 `app/agent-audit-interactives.tsx`，正文与治理图示在 `app/page.tsx`；这两部分不展示代码栏。
