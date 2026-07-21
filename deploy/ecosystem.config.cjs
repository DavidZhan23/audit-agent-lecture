/** PM2：课件 Node + 人脸推理 Python（由 remote-deploy.sh 注入环境变量） */
const path = require("path");

const remoteDir = path.resolve(process.env.REMOTE_DIR || ".");
const faceDir = path.join(remoteDir, "services/face-predict");
const facePython = path.join(faceDir, ".venv", "bin", "python");
const publicPort = process.env.PUBLIC_PORT || process.env.NGINX_PORT || "8080";
const facePort = process.env.FACE_PREDICT_PORT || "8765";
const faceHost = process.env.FACE_PREDICT_HOST || "127.0.0.1";
const faceUrl = process.env.FACE_PREDICT_URL || `http://${faceHost}:${facePort}`;
const enableFace = (process.env.ENABLE_FACE_PREDICT || "true") !== "false";

const apps = [
  {
    name: process.env.PM2_APP_NAME || "audit-courseware",
    cwd: remoteDir,
    script: path.join(remoteDir, "node_modules", ".bin", "vinext"),
    args: `start --port ${publicPort} --hostname 0.0.0.0`,
    env: {
      NODE_ENV: "production",
      WRANGLER_LOG_PATH: ".wrangler/wrangler.log",
      FACE_PREDICT_URL: faceUrl,
    },
    instances: 1,
    exec_mode: "fork",
    autorestart: true,
    max_memory_restart: "512M",
    time: true,
  },
];

if (enableFace) {
  apps.push({
    name: process.env.PM2_FACE_NAME || "face-predict",
    cwd: faceDir,
    // PM2 要求解释器为绝对路径；直接跑 venv 里的 python 最稳
    script: facePython,
    args: "server.py",
    interpreter: "none",
    env: {
      FACE_PREDICT_HOST: faceHost,
      FACE_PREDICT_PORT: String(facePort),
      OMP_NUM_THREADS: "1",
      MKL_NUM_THREADS: "1",
    },
    instances: 1,
    exec_mode: "fork",
    autorestart: true,
    max_memory_restart: "1536M",
    time: true,
  });
}

module.exports = { apps };
