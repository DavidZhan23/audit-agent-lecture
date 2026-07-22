# 互动组件清单

实现：`app/course-interactives.tsx`；部分在 `app/page.tsx`。

| 组件 | 主要章节 | 作用 |
|------|----------|------|
| `LessonTakeaway` | 各章 | 本章一句话 |
| `DeepDive` | ml/nn/llm/audit | 可折叠扩展 |
| `KnownUnknownBridge` | ml | 计算/规则/学习 |
| `FunctionFittingLab` | ml | 拟合与 Loss |
| `ConfusionMatrixLab` | ml | 阈值与混淆矩阵 |
| `TrainingLifecycle` | ml | 训练流程 |
| `NeuronContinuityLab` 等 | nn | ANN 解剖 |
| `DigitsImageLab` | nn | 像素→数字 |
| `FacePredictLab` | nn 趣味支线 | 真实 ResNet18 人脸：上传 / 手机拍照 / HTTPS 网页摄像头→检测→分类；解释与票据识别共享的像素处理机制，不作为审计主线证据 |
| `LanguageTrainingShift` / `AttentionLab` | llm | Token训练；用客户招待、儿童餐、生日蛋糕、CRM等上下文解释Attention |
| `AgentBranchLab` | agent | BX-42017行程矛盾 / 行程一致 / 工具失败三分支 |
| `AuditAgentCanvas` | audit（预习 DeepDive） | 设计画布 |
| `ToyDatasetExplorer` / `CaseMatrix` | audit（预习） | 多表与情形矩阵 |
| `Quiz` | audit 收束 | 结课自测 |

Agent 长章的规范列表、架构 stack、好处双栏为 `page.tsx` 内静态内容块（非独立导出组件）。
