# 代码地图（文档 ↔ 实现）

## 课件内容

| 文档 | 代码 |
|------|------|
| `docs/lecture-structure.md` | `app/page.tsx`：`nav`、`stages`、`Home` |
| `docs/sections/*.md` | `app/page.tsx` 对应 `section#...` |
| `docs/interactives.md` | `app/course-interactives.tsx` + page 内 lab |
| `docs/data-pack.md` | `public/toy_audit_case/**` |
| 分页课件导航 | `app/page.tsx`（`coursePages` / `CoursePager` / `Home`）+ `app/globals.css` |
| ANN 人脸故事与演示 | `app/face-predict-lab.tsx` + `public/images/xiaoyu.jpg` + `services/face-predict/**` + `app/api/face-predict/route.ts` |
| LLM 七步详稿 | `app/page.tsx`（`LlmContextDemo` / `LlmTrainingWorkbench` / `LlmCheckpointExplorer` / `LlmCallLab` / 两段Python） |
| LLM 图示 | `app/llm-diagrams.tsx`（缺口/分词/生成/Attention/Transformer/生命周期等） |
| Transformer 论文原图 | `app/page.tsx`（`TransformerReferenceFigure`）+ `public/images/transformer-encoder-decoder-architecture.png` |
| Agent四章 / 审计四章 | `app/page.tsx`（Agent定义/运行/控制/建设；审计功能/问数/报告/治理） |
| Agent与审计互动 | `app/agent-audit-interactives.tsx` |
| Agent分支 / 审计画布 | `app/course-interactives.tsx` |
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
| 服务器构建启动（含 Python venv / CPU torch） | `deploy/remote-deploy.sh` |
| PM2（课件 + `face-predict`） | `deploy/ecosystem.config.cjs` |
| 配置模板（含 `ENABLE_FACE_PREDICT`） | `deploy/deploy.env.example` |
| 使用说明 | 根目录 `README.md` |

## 判断「当前线上课件」的方法

打开 `app/page.tsx`，找到：

```ts
export default function Home()
```

**以该函数体内的章节为准。** 同文件中未 export 的 `ComplexHome` 等仅为备用，勿当作默认结构，除非已改为 default export。
