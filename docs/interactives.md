# 互动组件清单

实现：`app/course-interactives.tsx`；部分在 `app/page.tsx`。

| 组件 | 主要章节 | 作用 |
|------|----------|------|
| `CoursePager` | 全课 | 独立底部控制区；上一页/下一页、完整目录、页码与键盘导航；不覆盖正文，配合可显隐章节侧栏 |
| `TaskLogicDemo` | code | Excel 双表：报销金额 vs 开票金额（映射+判断） |
| `FeatureFittingDemo` | ml | 单表：弱信号 + 历史核实标签 → 预测 NEW；讲义板书 |
| `AnnPixelDemo` | nn | 票据图片收件箱 + DigitsImageLab + 结构图/公式板书 |
| `ReceiptImageInbox` | nn（嵌在 AnnPixelDemo） | 一叠待识别收据图：人眼慢 → 计算机认数字 |
| `MlpNetworkDiagram` / `CnnPipelineDiagram` / `NetworkComparePanel` | nn（`app/nn-diagrams.tsx`） | 前馈神经网络与卷积神经网络结构图；同框按钮切换对比 |
| `LessonTakeaway` | 备用/旧版章节 | 本章一句话 |
| `DeepDive` | 备用（当前 Home 的 nn 已精简） | 可折叠扩展 |
| `KnownUnknownBridge` / `FunctionFittingLab` / `ConfusionMatrixLab` | 备用（当前 Home 的 ml 已精简） | 旧版机器学习互动 |
| `NeuronContinuityLab` 等 | 备用（旧版 nn DeepDive） | 神经网络解剖 |
| `DigitsImageLab` | nn（嵌在 AnnPixelDemo） | 自构 16×16 示意像素 → 数字 0—9 |
| `FacePredictLab` | nn 案例支线 | 两位室友自制人脸门禁的故事首屏 + 笑雨示例照片 + 数据授权/训练/测试流程，随后直接进入真实 ResNet34（224，head_hidden=512）演示操作区，不设置单独标题栏；输出笑雨/骐源/其他三类概率，并模拟“室友达到0.70阈值则开门，其他或低置信度则保持关闭”的应用规则 |
| `AnnToLlmJourney` | llm（`app/ann-to-llm-journey.tsx`） | 当前05主线：神经网络连续性→文字数字化→Transformer上下文→海量预训练→工程调用→智能体缺口 |
| `LanguageEncodingLab` | llm 5.2 | 四步切换同一句合同文本：原文→Token→Embedding→向量序列进入神经网络；第四步可点击弹出 Transformer 论文架构原图 |
| `TransformerVisualJourney` | llm 5.3（`app/transformer-visual-journey.tsx`） | 六场景从普通神经网络结构替换到完整大语言模型，定位Transformer，放大Decoder-only Block，切换上下文关联，展示多层堆叠，再回到语言模型输出层与下一个Token概率 |
| `PretrainingLoopLab` | llm 5.4 | 点击训练轮次，观察下一个Token候选、损失及权重学习方向；与普通神经网络训练循环对应 |
| `EngineeringCallLab` | llm 5.5 | 汇集LLM整体结构、Prefill、逐Token Decode与模型外生成循环；不再展示字段、调用链、能力开关、模拟接口或四层产品边界 |
| `LLMArchitectureOverview` | llm 5.5 | 八步点亮用户对话→Chat Template→Tokenizer→Token ID→Embedding→Transformer Block × N→LM Head→下一Token概率；点选步骤后显示说明 |
| `AutoregressiveGenerationDemo` | llm 5.5 | 合同审计场景的Prefill与Decode；逐Token显示前端模拟候选概率，支持单步/自动/暂停/重置；附通用伪代码和采样方法小卡 |
| `AgentTransitionBoard` | llm 结尾 | 对比一次模型调用与“判断→工具→观察→再判断”循环，简洁引出06 |
| `LlmContextDemo` / `LlmConstructionExplorer` / `Gpt2PretrainingLab` 等 | llm备用素材 | 检查点、真实训练、论文原图等细节不进入当前 `Home` 的05主线 |
| `InlinePythonLab(rule / ml / neural / …)` | 各章 | 浏览器内可运行代码；`neural` 右侧带 `NeuralTrainMonitor` 回放 epoch/Loss |
| `InlinePythonLab(attention / language / llm_call)` | llm备用素材 | 微型Attention、神经语言模型训练和无网络调用模拟，不进入当前05主线 |
| `FoundationChapterRoute` | part-1 | 章节02—05四章目录：规则→机器学习→神经网络→大语言模型，可点击跳转 |
| `AgentPartRoute` | part-2 | 章节06—13八章可跳转路线：先提出主合同甲贯穿任务，再走结构→循环→三类能力→组合应用→边界 |
| `AgentArchitectureMap` | agent-definition | 承接06提出的主合同甲任务，用八个可点选模块展示智能体系统的输入、产出与风险 |
| `AgentLoopSimulator` | agent-loop | 继续运行06的同一任务；九步转分包检查模拟逐步/自动展示目标、状态、工具输入输出与下一判断 |
| `AgentTypeSwitcher` | agent-knowledge / agent-task / agent-planning | 09—11沿用统一的三类智能体框架并分别默认选中知识型、任务型、规划型；切换时同步改变结构、输入、步骤、输出、场景、自主度与人工介入 |
| `PlanningAdjustmentLab` | agent-planning | 近三年相关合同风险筛查六阶段；先立案例再演示名称匹配升级为语义匹配、缺正文触发补充任务 |
| `CombinedContractCaseLab` | agent-case | 主合同/候选合同、八步组合时间线、判断卡片和六个人工确认节点 |
| `AgentFitLab` | agent | 四类任务互动判断：程序、工作流、大语言模型应用或智能体 |
| `AgentArchitectureExplorer` | agent | 六块智能体架构的输入、产出与失败风险 |
| `ToolContractLab` | agent | 工具Schema、参数、成功/超时/拒绝返回与下一行动 |
| `AgentStateExplorer` | agent | 区分状态、记忆、轨迹并展示五类停止条件 |
| `AgentControlLab` | agent | 建议、只读、受控执行三种自主度与动作权限 |
| `AgentBranchLab` | agent | BX-42017行程矛盾 / 行程一致 / 工具失败三分支 |
| `AuditApplicationRoute` | part-3 | 章节14—19六章可跳转路线：工作链→三案例→协作→治理 |
| `AuditChainChallenge` | audit | “全部资料交给模型/先路由/统一转图片”三选一，解释每种后果 |
| `AuditDesignWorkbench` | audit | 三个案例共用的目标、输入、知识、工具、权限、验证六问工作台 |
| `DocumentParsingLab` | audit-documents | 切换扫描件、电子表格、文字处理文档和图片；展示解析路线、置信度、来源与处理决策 |
| `EvidenceConflictBoard` | audit-documents | 合同正文、付款台账和审批表金额冲突；保留多来源并提出核查方向 |
| `SecureQueryLab` | audit-data | 三个身份权限切换、查询计划、安全校验、权限注入、模拟查询与分析追溯 |
| `ReportArchitectureBoard` | audit-report | 事实证据→审计分析→报告表达三层架构与克制技术路线 |
| `ReportGenerationStudio` | audit-report | 报告类型、六层知识、风格、提纲排序、三栏审核和接受/退回状态 |
| `AuditCollaborationLab` | audit-collaboration | 十二步完整任务、共享底座和四类对象接口 |
| `AuditGovernanceDashboard` | audit-governance | 具体效果、分功能指标与治理边界切换 |
| `CaseMatrix` | audit（折叠扩展） | 六类事项在五种技术下的结果差异 |
| `Quiz` | audit 收束 | 九题自测，新增智能问数与报告生成边界 |

第二部分互动与模拟数据集中在 `app/agent-lecture-journey.tsx`；当前第三部分三个案例的互动与模拟数据集中在 `app/audit-application-journey.tsx`。旧通用互动仍保留在 `app/agent-audit-interactives.tsx`，但不构成当前第三部分主线。第二、第三部分不展示代码栏。
