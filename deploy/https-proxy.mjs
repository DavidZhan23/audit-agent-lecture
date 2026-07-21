#!/usr/bin/env node
/**
 * 轻量 HTTPS 反代（仅 Node 内置模块）
 * 环境变量：
 *   SSL_CERT / SSL_KEY / HTTPS_PORT / UPSTREAM (默认 http://127.0.0.1:8080)
 */
import fs from "node:fs";
import http from "node:http";
import https from "node:https";
import net from "node:net";
import { URL } from "node:url";

const port = Number(process.env.HTTPS_PORT || 8443);
const upstream = new URL(process.env.UPSTREAM || "http://127.0.0.1:8080");
const certPath = process.env.SSL_CERT;
const keyPath = process.env.SSL_KEY;

if (!certPath || !keyPath) {
  console.error("缺少 SSL_CERT / SSL_KEY");
  process.exit(1);
}

const options = {
  cert: fs.readFileSync(certPath),
  key: fs.readFileSync(keyPath),
};

function proxyHeaders(req) {
  // 必须保留浏览器原始 Host（如 211.159.166.109:8443）。
  // 若改成 127.0.0.1:8080，vinext 会判定 Origin/Host 不一致并返回 Forbidden。
  const headers = { ...req.headers };
  delete headers["connection"];
  headers["x-forwarded-proto"] = "https";
  headers["x-forwarded-host"] = req.headers.host || "";
  if (req.socket?.remoteAddress) {
    const prior = headers["x-forwarded-for"];
    headers["x-forwarded-for"] = prior
      ? `${prior}, ${req.socket.remoteAddress}`
      : req.socket.remoteAddress;
  }
  return headers;
}

const server = https.createServer(options, (req, res) => {
  const opts = {
    protocol: upstream.protocol,
    hostname: upstream.hostname,
    port: upstream.port || (upstream.protocol === "https:" ? 443 : 80),
    path: req.url,
    method: req.method,
    headers: proxyHeaders(req),
  };

  const proxyReq = http.request(opts, (proxyRes) => {
    res.writeHead(proxyRes.statusCode || 502, proxyRes.headers);
    proxyRes.pipe(res);
  });

  proxyReq.on("error", (err) => {
    console.error("[https-proxy]", err.message);
    if (!res.headersSent) res.writeHead(502, { "content-type": "text/plain; charset=utf-8" });
    res.end(`Bad Gateway: ${err.message}`);
  });

  req.pipe(proxyReq);
});

server.on("upgrade", (req, socket, head) => {
  const headers = proxyHeaders(req);
  const reqLines = [
    `${req.method} ${req.url} HTTP/1.1`,
    ...Object.entries(headers).flatMap(([k, v]) => {
      if (v === undefined) return [];
      if (Array.isArray(v)) return v.map((item) => `${k}: ${item}`);
      return [`${k}: ${v}`];
    }),
    "",
    "",
  ].join("\r\n");

  const upstreamSocket = net.connect(
    Number(upstream.port || 80),
    upstream.hostname,
    () => {
      upstreamSocket.write(reqLines);
      if (head && head.length) upstreamSocket.write(head);
      socket.pipe(upstreamSocket);
      upstreamSocket.pipe(socket);
    },
  );

  const fail = (err) => {
    console.error("[https-proxy upgrade]", err?.message || err);
    socket.destroy();
    upstreamSocket.destroy();
  };
  socket.on("error", fail);
  upstreamSocket.on("error", fail);
});

server.listen(port, "0.0.0.0", () => {
  console.log(`[https-proxy] https://0.0.0.0:${port} → ${upstream.href}`);
});
