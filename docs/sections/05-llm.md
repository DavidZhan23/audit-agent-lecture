# 05 · llm — 从 ANN 到 LLM（详稿）

- **锚点：** `#llm`
- **侧栏：** 从 ANN 到 LLM（30′；可压到 18—20′）
- **标题：** 从 ANN 到 LLM

## 教学目标

- 说清 **为何** ANN 不够：多段文字语境、可变长度、输出也是语言
- 钉死 **LLM = 大规模 ANN**；对象是 Token 序列
- 讲透训练目标：下一 Token 条件概率；生成 = 反复选取
- 建立 Attention / Transformer 的直觉图（不要求矩阵推导）
- 分清预训练 / 指令对齐 / 推理；上下文窗口外 = 未知
- 边界：流畅 ≠ 事实 ≠ 证据 ≠ 结论；不会主动取数 → 引出 Agent

## 内容块（完整稿，可删减）

1. `SectionTitle`
2. `LlmContextDemo`（主叙事）
   - 审计问题 + `ContextEvidenceInbox`（BX-42519）
   - **图示 01** `AnnToLlmGapDiagram` — ANN 看见 vs LLM 对照
   - **5.1** 为何必须再走一步（长文）
   - **图示 02** `ContinuityLadderDiagram` — ML→ANN→LLM 连续关系
   - **图示 11** `AnnLlmSideBySide` — Softmax(10) vs Softmax(|V|)
   - **5.2** Definition：LLM
   - **板书 A** 条件概率 + 链式法则
   - **图示 03** `TokenizeDiagram`
   - **5.3** + `LanguageTrainingShift` + **图示 04** `GenerationLoopDiagram` + `TokenLab`
   - **图示 05** `WhyNextTokenDiagram`
   - **5.4** + `LlmPipeline`
   - **板书 B** Attention 动机
   - **图示 06** `AttentionHeatmapDiagram` + `AttentionLab`
   - **图示 07** `TransformerStackDiagram`
   - **5.5** 规模与涌现观感
   - **图示 08** `LlmLifecycleDiagram` + **图示 09** `ContextWindowDiagram`
   - **5.6** 提示词 / 上下文 / RAG / 工具（`llm-addons`）
   - **图示 10** `CapabilityBoundaryStrip` + 幻觉条 + 三格收束
   - `CapabilityBoundary` + 板书收束 + `LessonTakeaway`
3. `InlinePythonLab` language
4. `Bridge` → Agent / `TeacherNote`（含可跳过清单）

## 图示实现

`app/llm-diagrams.tsx`

## 对应代码

`app/page.tsx` → `section#llm` / `LlmContextDemo`
