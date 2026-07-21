# 06 · agent — ⑤ Agent + LLM（长章）

- **锚点：** `#agent`
- **侧栏：** Agent + LLM（30′）
- **课纲定位：** 本课核心章——定义、行业规范、架构、价值，再用 BX-42017 动态取证演示

## 教学目标

- 区分 LLM 应用 vs Agent 系统
- 掌握六条行业底线规范
- 记住六块参考架构
- 说清好处与「不要神话」
- 跑通矛盾 / 失败分支演示

## 内容块（按小节）

### 6.1 什么是 Agent？

- 说明段 + `Definition`
- 四格：程序 / 工作流 / 大模型 / Agent
- LLM ≠ Agent 对照条

### 6.2 行业规范与底线

`control-lines` 六条：最小权限、人在回路、工具边界、可观测、停止条件、数据合规

### 6.3 参考架构

`stack` 六块：目标与策略 / LLM 决策核 / 工具层 / 状态与记忆 / 编排循环 / 控制与护栏
提及 ReAct、Plan-and-Execute、Human-in-the-loop

### 6.4 好处与边界

双栏好处 / 不要神话；`autonomy` 三档自主度

### 6.5 行程矛盾 BX-42017

`DatasetAnchor` / `AgentBranchLab` / agent lab / `CapabilityBoundary` / takeaway / bridge → 审计智能体。先查航班；发现南京矛盾后才扩展到酒店、CRM和日历；行程一致时减少调查，工具失败时受控转人工。

## 对应代码

`app/page.tsx` → `section#agent`
