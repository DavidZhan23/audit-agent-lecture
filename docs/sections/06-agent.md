# 06 · agent — Agent + LLM（长章）

- **部分大标题：** `#part-2` · 第二部分 · Agent基础与架构
- **锚点：** `#agent`
- **侧栏：** Agent + LLM（40′）
- **章标题：** Agent + LLM
- **课纲定位：** 第二部分、全课核心和最长章节——定义、LLM与Agent区别、模块、工具反馈循环、行业规范、价值、自主边界，再用 BX-42017 验证动态取证

## 教学目标

- 区分 LLM 应用 vs Agent 系统
- 掌握Agent的通用系统框架，而不是只理解一个审计案例
- 掌握六条行业底线规范
- 记住六块参考架构
- 说清好处与「不要神话」
- 跑通矛盾 / 失败分支演示

## 内容块（按小节）

进入本章前先出现 `PartTitle`（第二部分大标题）。

### 6.1 什么是 Agent？

- 说明段 + `Definition`
- 四格：程序 / 工作流 / 大模型 / Agent
- LLM ≠ Agent 对照条

### 6.2 行业规范与底线

`control-lines` 六条：最小权限、人在回路、工具边界、可观测、停止条件、数据合规

### 6.3 参考架构

`stack` 六块：目标与策略 / LLM 决策核 / 工具层 / 状态与记忆 / 编排循环 / 控制与护栏

### 6.4—6.5 价值、边界与反馈演示

- 好处 / 不要神话双栏
- 自主度三档
- BX-42017：`AgentBranchLab` + Python
- `CapabilityBoundary` + `LessonTakeaway` + Bridge → 审计智能体

## 对应代码

`app/page.tsx` → `PartTitle#part-2` + `section#agent`
