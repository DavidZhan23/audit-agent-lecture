# 审计智能体基础课课件

从一笔 286 元报销讲起，互动讲解规则、机器学习、神经网络、大模型与智能体。

技术栈：[vinext](https://github.com/cloudflare/vinext)（Next.js App Router）。

## 环境要求

- Node.js `>=22.13.0`

## 本地开发

```bash
npm install
npm run dev
```

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

   脚本会：同步代码 → 安装依赖并构建 → 用 PM2 在 `8080` 启动 → 做健康检查。

### 后续代码更新


```bash
./deploy/deploy.sh
```

无需重复配置 `deploy.env` 或重新放行端口（除非你改了端口）。

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
| `deploy/remote-deploy.sh` | 服务器端构建与启动 |
| `deploy/deploy.env` | 本机私有配置（勿提交密钥） |
| `deploy/deploy.env.example` | 配置模板 |
| `deploy/ecosystem.config.cjs` | PM2 进程配置 |

### 服务器上常用运维命令

SSH 登录后：

```bash
pm2 list                          # 查看进程
pm2 logs audit-courseware         # 查看日志
pm2 restart audit-courseware      # 重启课件
```

## 项目结构（简要）

- `app/`：页面与互动组件
- `public/`：静态资源与审计案例数据
- `deploy/`：一键部署脚本
- `db/`、`examples/d1/`：可选 D1 / Drizzle 示例（当前课件主流程可不依赖）

## 了解更多

- [vinext Documentation](https://github.com/cloudflare/vinext)
- [Drizzle D1 Guide](https://orm.drizzle.team/docs/get-started/d1-new)
