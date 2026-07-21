import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // vinext / Next 默认约 1MB，手机原图与摄像头截图常超限 → 413
  experimental: {
    serverActions: {
      bodySizeLimit: "12mb",
      // HTTPS 反代场景下 Origin/Host 偶发不一致时的兜底（主修复在 https-proxy 保留 Host）
      allowedOrigins: ["211.159.166.109:8443", "211.159.166.109:8080", "localhost:8443", "127.0.0.1:8443"],
    },
  },
};

export default nextConfig;
