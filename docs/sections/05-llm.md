# 05 · llm — ④ 从 ANN 到 LLM

- **锚点：** `#llm`
- **侧栏：** 从 ANN 到 LLM（20′）
- **课纲定位：** LLM = 大规模 ANN 在 Token 序列上的发展

## 教学目标

- 明确与 ANN 的连续关系
- 幻觉与「不会主动取数」边界
- 优劣势双栏

## 内容块

1. `Definition` — LLM
2. 「和上一章的连续关系」说明块
3. `DatasetAnchor` — BX-42519：周日客户招待、小票语义、CRM与日历相互矛盾
4. `LanguageTrainingShift` / `LlmPipeline` / `AttentionLab`（儿童餐、生日蛋糕、CRM无拜访等上下文）/ language lab
5. 三阶段：预训练 / 指令对齐 / 推理
6. 幻觉警示 / `CapabilityBoundary` / 优劣势
7. `DeepDive`（Token / Attention）
8. `Bridge` → Agent + LLM

## 对应代码

`app/page.tsx` → `section#llm`
