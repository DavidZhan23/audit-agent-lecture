# 审计智能体基础课课件

**课程标题：** LLM，Agent基础、架构以及其在审计中的应用  

从审计问题（BX-42306）出发：通俗逻辑 → 特征拟合（ML）→ ANN → LLM → Agent+LLM；审计智能体章节为占位待设计。

技术栈：[vinext](https://github.com/cloudflare/vinext)（Next.js App Router）。

## 给 AI / 协作者：先读结构文档

改课件前请先阅读 **[`docs/`](docs/README.md)**（总览见 [`docs/lecture-structure.md`](docs/lecture-structure.md)）。  
项目约束：`.cursor/rules/lecture-docs.mdc`、根目录 `AGENTS.md`。  
**改章节/互动/案例后必须同步更新 `docs/`。**

## 环境要求

- Node.js `>=22.13.0`
- （可选，ANN 人脸演示）Python 3.10+，见 `services/face-predict/README.md`

## 本地开发

```bash
npm install
npm run dev
```

### ANN 人脸识别演示（第 ③ 章）

需**另开终端**启动 Python 推理服务（默认 `8765`），课件页通过 `/api/face-predict` 同源代理调用：

```bash
cd services/face-predict
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python server.py
```

然后浏览器打开课程「超多特征与 ANN」中的「真实 ANN 演示」：上传照片或摄像头拍照。  
详情与 curl 示例见 [`services/face-predict/README.md`](services/face-predict/README.md)。

常用命令：

| 命令 | 说明 |
|------|------|
| `npm run dev` | 本地开发 |
| `npm run build` | 生产构建 |
| `npm run start` | 本地启动生产服务 |
| `npm test` | 构建并校验页面渲染 |
| `npm run lint` | ESLint 检查 |

主要代码在 `app/`，课件素材在 `public/`。

## 部署到服务器

课件与同机上的 fitness 应用（80 端口）互不影响：课件默认走 **8080**，由 PM2 直接对外提供服务。

线上地址示例：

- 课件：`http://211.159.166.109:8080/`
- Fitness：`http://211.159.166.109/`（原站点，不改动）

### 首次部署

1. **确认本机能 SSH 登录服务器**

   ```bash
   ssh root@211.159.166.109
   ```

2. **在腾讯云控制台放行 8080**  
   云服务器 → 防火墙 / 安全组 → 入站规则新增：`TCP:8080`，来源 `0.0.0.0/0`（或「全部 IPv4」）。

3. **填写部署配置**

   ```bash
   cp deploy/deploy.env.example deploy/deploy.env
   ```

   编辑 `deploy/deploy.env`，至少设置：

   - `SERVER_HOST`：服务器 IP
   - `SERVER_USER`：SSH 用户（如 `root`）
   - 若需指定密钥：取消注释并填写 `SSH_KEY=...`

4. **一键部署**

   ```bash
   chmod +x deploy/deploy.sh deploy/remote-deploy.sh
   ./deploy/deploy.sh
   ```

   脚本会：同步代码（含 `services/face-predict` 与 `best.pt`）→ 安装 Node/Python 依赖并构建 → PM2 启动课件（8080）与人脸推理（本机 8765）→ 健康检查。

   若暂时不部署 ANN 演示，在 `deploy.env` 设 `ENABLE_FACE_PREDICT=false`。

### 公网使用摄像头（HTTPS）

浏览器要求 **HTTPS**（或 localhost）才能调用摄像头。可一键开自签名 HTTPS（**8443**，PM2 反代，不占用 80，不影响 fitness）：

```bash
# 先确保课件已在 8080 运行（./deploy/deploy.sh）
./deploy/enable-https.sh
```

然后：

1. 腾讯云安全组放行 **TCP 8443**
2. 打开 `https://211.159.166.109:8443/`
3. 首次提示证书不受信任 → **高级 → 继续访问**
4. 即可使用「打开摄像头」

`http://IP:8080` 仍可看课件，但不能开网页摄像头（可用上传/拍照上传）。

### 后续代码更新

```bash
./deploy/deploy.sh
```

无需重复配置 `deploy.env` 或重新放行端口（除非你改了端口）。  
**说明：** 首次带人脸推理的部署会下载 CPU 版 PyTorch，耗时与磁盘占用较大；之后更新会复用服务器上的 `.venv`（rsync 已排除该目录）。

可选参数：

```bash
./deploy/deploy.sh --sync-only   # 只同步代码，不在服务器构建
./deploy/deploy.sh --setup-only  # 只跑服务器端安装/启动，不同步
./deploy/deploy.sh -h            # 帮助
```

### 部署相关文件

| 路径 | 作用 |
|------|------|
| `deploy/deploy.sh` | 本机一键部署入口 |
| `deploy/remote-deploy.sh` | 服务器端构建与启动（含 Python venv） |
| `deploy/deploy.env` | 本机私有配置（勿提交密钥） |
| `deploy/deploy.env.example` | 配置模板 |
| `deploy/ecosystem.config.cjs` | PM2：课件 + face-predict |
| `services/face-predict/` | ANN 推理包与 checkpoint |

### 服务器上常用运维命令

SSH 登录后：

```bash
pm2 list                          # 应看到 audit-courseware 与 face-predict
pm2 logs audit-courseware         # 课件日志
pm2 logs face-predict             # 人脸推理日志
pm2 restart audit-courseware      # 重启课件
pm2 restart face-predict          # 重启推理
curl http://127.0.0.1:8765/health # 推理健康检查
```

## 项目结构（简要）

- `app/`：页面与互动组件
- `public/`：静态资源与审计案例数据
- `deploy/`：一键部署脚本
- `db/`、`examples/d1/`：可选 D1 / Drizzle 示例（当前课件主流程可不依赖）

## 了解更多

- [vinext Documentation](https://github.com/cloudflare/vinext)
- [Drizzle D1 Guide](https://orm.drizzle.team/docs/get-started/d1-new)
