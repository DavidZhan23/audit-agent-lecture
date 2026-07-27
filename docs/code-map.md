# 代码地图（文档 ↔ 实现）

## 课件内容

| 文档 | 代码 |
|------|------|
| `docs/lecture-structure.md` | `app/page.tsx`：`nav`、`stages`、`Home` |
| `docs/sections/*.md` | `app/page.tsx` 对应 `section#...` |
| `docs/interactives.md` | `app/course-interactives.tsx` + page 内 lab |
| `docs/data-pack.md` | `public/toy_audit_case/**` |
| 分页课件导航 | `app/page.tsx`（`coursePages` / `CoursePager` / `Home`）+ `app/globals.css` |
| 神经网络人脸故事与演示 | `app/face-predict-lab.tsx` + `public/images/xiaoyu.jpg` + `services/face-predict/**` + `app/api/face-predict/route.ts` |
| 大语言模型五段主线 | `app/ann-to-llm-journey.tsx`（`AnnToLlmJourney` / `LanguageEncodingLab` / `PretrainingLoopLab` / `EngineeringCallLab` / `AgentTransitionBoard`） |
| 5.5对话生成循环补充 | `app/llm-generation-lesson.tsx`（对话式LLM整体结构 / Prefill / 逐Token Decode / 生成循环 / Token循环与智能体循环对比） |
| Transformer六场景可视化 | `app/transformer-visual-journey.tsx`（神经网络结构替换 / 完整大语言模型 / Block内部 / Attention示例 / Block堆叠 / 语言模型输出层） |
| 大语言模型备用详稿与图示 | `app/page.tsx`（旧七步组件）+ `app/llm-diagrams.tsx`；不进入当前 `Home` 的05主线 |
| Transformer 论文原图 | `public/images/transformer-encoder-decoder-architecture.png`；5.2 `LanguageEncodingLab` 弹窗；备用组件 `app/page.tsx`（`TransformerReferenceFigure`） |
| 智能体八章 / 审计六章 | `app/page.tsx`（智能体06—13；审计应用14—19） |
| 第二部分智能体教学主线 | `app/agent-lecture-journey.tsx`（章节路线、组成结构、九步运行模拟、三类切换、规划调整、组合案例） |
| 第三部分审计应用主线 | `app/audit-application-journey.tsx`（统一六问、资料解析、证据冲突、权限问数、报告工作台、协作系统、治理看板） |
| 通用智能体与审计互动 | `app/agent-audit-interactives.tsx` |
| 智能体分支 / 审计画布 | `app/course-interactives.tsx` |
| 第一部分Python代码实验 | `app/page.tsx` → 当前 `Home` 中 `InlinePythonLab`；第二、第三部分不展示代码栏 |

## 应用壳

| 职责 | 路径 |
|------|------|
| 页面元数据 / 全局样式引入 | `app/layout.tsx` |
| 全局样式 | `app/globals.css` |
| 互动样式 | `app/course-interactives.css` |
| 手写数字样本 | `app/digit-samples.ts` |
| Worker 入口（vinext） | `worker/index.ts` |

## 部署（非课件内容，但常一起改）

| 职责 | 路径 |
|------|------|
| 一键部署 | `deploy/deploy.sh` |
| 服务器构建启动（含 Python 虚拟环境 / 中央处理器版深度学习框架） | `deploy/remote-deploy.sh` |
| PM2（课件 + `face-predict`） | `deploy/ecosystem.config.cjs` |
| 配置模板（含 `ENABLE_FACE_PREDICT`） | `deploy/deploy.env.example` |
| 使用说明 | 根目录 `README.md` |

## 判断「当前线上课件」的方法

打开 `app/page.tsx`，找到：

```ts
export default function Home()
```

**以该函数体内的章节为准。** 同文件中未 export 的 `ComplexHome` 等仅为备用，勿当作默认结构，除非已改为 default export。
