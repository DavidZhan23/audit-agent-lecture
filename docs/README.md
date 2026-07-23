# 课件文档（给 AI / 协作者先读）

> 修改项目前先读本目录，并始终以 `app/page.tsx` 中导出的 `Home` 为准。

**课程标题：** LLM 与 Agent：基础、架构及审计应用
**顶层架构：** ① 技术基础 → ② Agent基础与架构 → ③ Agent在审计中的应用

## 阅读顺序

1. [lecture-structure.md](./lecture-structure.md) — 120分钟总体架构
2. [sections/](./sections/) — 逐章教学设计
3. [interactives.md](./interactives.md) — 互动与课堂作用
4. [data-pack.md](./data-pack.md) — Toy Data Pack与证据来源
5. [code-map.md](./code-map.md) — 文档、组件与代码位置

## 当前课程事实

| 项 | 当前设计 |
|---|---|
| 第一部分 | `#code`—`#llm`，50分钟；规则→ML→ANN→LLM |
| 第二部分 | `#agent`—`#agent-evaluation`，35分钟；四章讲清定义、运行、控制与建设 |
| 第三部分 | `#audit`—`#audit-rollout`，25分钟主线；功能全景→智能问数→智能报告→共性治理 |
| 审计交付 | 可复核疑点证据包，不是风险分或自动结论 |
| 审计项目 | A集团差旅及招待费专项审计 |
| 主实现 | `app/page.tsx`（`Home`） |

任何教学结构变化都必须同步更新本目录；详细约束见 `.cursor/rules/lecture-docs.mdc`。
