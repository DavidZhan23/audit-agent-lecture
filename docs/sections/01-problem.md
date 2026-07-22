# 01 · problem — 导言（Introduction）

- **锚点：** `#problem`
- **侧栏：** 导言（5′）— 置于「第一部分」标签之上，与正文结构一致
- **标题：** 导言

## 教学目标

- 用 Abstract 交代课程主题、三部分分工
- 用 `CourseArchitecture` 把三部分作为整堂课的唯一顶层骨架明确展示
- 用「主要收获」明确学完后应带走的判断能力
- 自然过渡到「基于任务逻辑的编程」

## 内容块

1. `SectionTitle` — 导言（无副标题 intro）
2. `lesson-abstract` — Abstract + 三部分条目列表
3. `CourseArchitecture` — 三部分总体架构；第二部分标为核心，第三部分标为待设计
4. `content-block.lesson-takeaways` — 「主要收获」四格（无小标题）
5. `Bridge` → 基于任务逻辑的编程 / `TeacherNote`

## 对应代码

`app/page.tsx` → `section#problem`
