# 课件文档（给 AI / 协作者先读）

> **任何 AI 或新人接手本项目时：先读本目录，再改代码。**

本目录描述的是**当前实际上线课件**的结构与教学设计，以 `app/page.tsx` 中 `export default function Home` 为准。

**课程标题：** LLM，Agent基础、架构以及其在审计中的应用  
**叙事主线：** 一项审计任务 → 五个难度递增事项 → 通俗逻辑 → 特征拟合（ML）→ ANN → LLM → Agent+LLM → 审计智能体（占位）

## 阅读顺序

1. [lecture-structure.md](./lecture-structure.md) — 整堂课总览  
2. [sections/](./sections/) — 各章节明细  
3. [interactives.md](./interactives.md) — 互动组件  
4. [data-pack.md](./data-pack.md) — Toy Data Pack  
5. [code-map.md](./code-map.md) — 代码对照  

## 维护规则（强制）

改动课件内容后必须同步更新本目录。约束见：`.cursor/rules/lecture-docs.mdc`。

## 快速事实

| 项 | 值 |
|----|-----|
| 标题 | LLM，Agent基础、架构以及其在审计中的应用 |
| 主线项目 | A集团差旅及招待费专项审计（42,000笔、4人、10天） |
| 案例阶梯 | 重复发票 → 拆分报销 → 票据修改 → 招待语义矛盾 → 行程矛盾 |
| 最长章节 | `#agent`（约 30′：定义 / 规范 / 架构 / 价值 / 演示） |
| 占位章节 | `#audit` 审计智能体（待设计） |
| 主实现 | `app/page.tsx`（`Home`） |
