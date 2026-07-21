# 代码地图（文档 ↔ 实现）

## 课件内容

| 文档 | 代码 |
|------|------|
| `docs/lecture-structure.md` | `app/page.tsx`：`nav`、`stages`、`Home` |
| `docs/sections/*.md` | `app/page.tsx` 对应 `section#...`（含 `#audit` 占位） |
| `docs/interactives.md` | `app/course-interactives.tsx` + page 内 lab |
| `docs/data-pack.md` | `public/toy_audit_case/**` |
| ANN 人脸演示 | `services/face-predict/**` + `app/face-predict-lab.tsx` + `app/api/face-predict/route.ts` |

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
