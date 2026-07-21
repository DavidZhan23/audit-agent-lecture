# 课件文档（给 AI / 协作者先读）

> **任何 AI 或新人接手本项目时：先读本目录，再改代码。**

本目录描述的是**当前实际上线课件**的结构与教学设计，以 `app/page.tsx` 中 `export default function Home` 为准。

**课程标题：** LLM，Agent基础、架构以及其在审计中的应用  
**顶层架构：** ① 大模型和智能体的技术基础 → ② Agent基础与架构（核心长章）→ ③ Agent在审计中的应用（占位）

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
| 第一部分 | `#problem`—`#llm`：问题 → 规则 → ML → ANN → LLM |
| 第一部分内部案例 | 重复发票 → 拆分报销 → 票据修改 → 招待语义矛盾 |
| 第二部分 | `#agent`：Agent基础与架构，40′核心长章 |
| 第三部分 | `#audit`：Agent在审计中的应用，待后续设计 |
| 审计项目 | A集团差旅及招待费专项审计（作为教学案例与应用背景） |
| 主实现 | `app/page.tsx`（`Home`） |
