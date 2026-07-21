# 整堂课结构总览

**最后核对代码：** `app/page.tsx` → `export default function Home`  
**课程标题：** LLM，Agent基础、架构以及其在审计中的应用  
**叙事主线：** 同一笔 `BX-42306`，按问题难度递进解释每层技术的功用与优劣。

## 课程目标

1. 从审计问题出发，讲清规则 → ML → ANN → LLM → Agent 各自解决什么、解决不了什么  
2. 在 Agent 章讲清定义、行业规范底线、参考架构与使用价值  
3. 交付物仍是**可复核疑点**；第 6 部分「审计智能体」为**占位**，待后续设计  

## 侧栏导航（`nav`）

| 序号 | `id` | 标题 | 预计时长 |
|------|------|------|----------|
| 01 | `problem` | 从问题出发 | 8′ |
| 02 | `code` | 通俗逻辑与规则 | 10′ |
| 03 | `ml` | 特征拟合 ML | 15′ |
| 04 | `nn` | 超多特征与 ANN | 15′ |
| 05 | `llm` | 从 ANN 到 LLM | 18′ |
| 06 | `agent` | Agent + LLM | 40′ |
| 07 | `audit` | 审计智能体 | 10′（占位） |

## 能力阶段（`stages`）

| key | 名称 | 核心问题 | 擅长 | 边界 |
|-----|------|----------|------|------|
| `code` | 通俗逻辑与规则 | 条件是否满足？ | 明确逻辑批量执行 | 写不尽的情况 |
| `ml` | 特征拟合（ML） | 像不像历史异常？ | 人工特征上拟合 | 特征靠人；无像素 |
| `nn` | 人工神经网络 | 高维输入里有什么？ | 超多特征表示学习 | 看见≠理解制度 |
| `llm` | 大语言模型 | 合起来意味着什么？ | 语言理解与生成 | 幻觉；不主动取数 |
| `agent` | Agent + LLM | 下一步调用什么、如何停？ | 工具闭环与受控停止 | 须权限与人审 |

## 教学节奏

```text
hero（课程标题 + 286 元问题）
  → problem（问题与路线图）
  → code（① 通俗逻辑）
  → ml（② 特征拟合）
  → nn（③ 超多特征 / ANN：DigitsImageLab + FacePredictLab）
  → llm（④ ANN → LLM）
  → agent（⑤ 定义·规范·架构·好处·演示，长章）
  → audit（⑥ 审计智能体占位 + 简短复盘/自测）
```

## 章节文档

- [01-problem.md](./sections/01-problem.md)  
- [02-code.md](./sections/02-code.md)  
- [03-ml.md](./sections/03-ml.md)  
- [04-nn.md](./sections/04-nn.md)  
- [05-llm.md](./sections/05-llm.md)  
- [06-agent.md](./sections/06-agent.md)  
- [07-audit.md](./sections/07-audit.md)（原 `07-build` / `08-summary` 已合并为占位+收束）  

## 备用实现

同文件内 `ComplexHome` 等未导出函数**不是**当前默认课纲。以 `Home` 为准。
