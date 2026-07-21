/** PM2 配置 — 端口与 hostname 由 remote-deploy.sh 注入 */
module.exports = {
  apps: [
    {
      name: process.env.PM2_APP_NAME || "audit-courseware",
      cwd: process.env.REMOTE_DIR,
      // 直接对外监听 PUBLIC_PORT（默认 8080），不依赖系统 nginx，避免与 fitness 抢 80
      script: "node_modules/.bin/vinext",
      args: `start --port ${process.env.PUBLIC_PORT || process.env.NGINX_PORT || 8080} --hostname 0.0.0.0`,
      env: {
        NODE_ENV: "production",
        WRANGLER_LOG_PATH: ".wrangler/wrangler.log",
      },
      instances: 1,
      exec_mode: "fork",
      autorestart: true,
      max_memory_restart: "512M",
      time: true,
    },
  ],
};
