# 05 · llm — 从 ANN 到 LLM

- **锚点：** `#llm`
- **侧栏：** 从 ANN 到 LLM（18′）
- **标题：** 从 ANN 到 LLM

## 教学目标

- LLM 仍是 ANN；对象换成 Token 序列
- 用 BX-42519 多段文字证据说明「语境」困难
- 下一个 Token 预测；流畅 ≠ 事实；不会主动取数

## 内容块

1. `SectionTitle` — 05 · 从 ANN 到 LLM
2. `LlmContextDemo`
   - 审计问题 + `ContextEvidenceInbox`（说明 / 小票 / CRM / 日历）
   - `LanguageTrainingShift` — 下一个 Token 样本从哪来
   - 讲义板书：连续关系 → 预测下一个 Token → Attention（内嵌 `AttentionLab`）→ 边界
3. `InlinePythonLab` language — 极小下一 Token 模型
4. `Bridge` → Agent + LLM / `TeacherNote`

已移除（与 02/03/04 精简一致）：Definition、DatasetAnchor、LlmPipeline、三阶段条、幻觉长条、CapabilityBoundary、优劣势双栏、DeepDive、LessonTakeaway。

## 对应代码

`app/page.tsx` → `section#llm`（`LlmContextDemo` / `ContextEvidenceInbox`）
