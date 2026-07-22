"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type Probs = { 笑雨: number; 骐源: number; 其他: number };
type PredictOk = { label: string; probs: Probs; confidence: number; threshold?: number };

const LABELS: Array<keyof Probs> = ["笑雨", "骐源", "其他"];

/** 压缩到边长与体积上限内，避免线上 vinext 默认 ~1MB 体积极限触发 413 */
async function compressImageBlob(
  source: Blob,
  opts: { maxEdge?: number; maxBytes?: number; quality?: number } = {},
): Promise<Blob> {
  const maxEdge = opts.maxEdge ?? 1280;
  const maxBytes = opts.maxBytes ?? 900_000;
  let quality = opts.quality ?? 0.85;

  const bitmap = await createImageBitmap(source);
  const scale = Math.min(1, maxEdge / Math.max(bitmap.width, bitmap.height));
  const w = Math.max(1, Math.round(bitmap.width * scale));
  const h = Math.max(1, Math.round(bitmap.height * scale));
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    bitmap.close();
    return source;
  }
  ctx.drawImage(bitmap, 0, 0, w, h);
  bitmap.close();

  const toBlob = (q: number) =>
    new Promise<Blob | null>((resolve) => canvas.toBlob((b) => resolve(b), "image/jpeg", q));

  let blob = await toBlob(quality);
  while (blob && blob.size > maxBytes && quality > 0.45) {
    quality -= 0.1;
    blob = await toBlob(quality);
  }
  return blob ?? source;
}

function isSecureForCamera(): boolean {
  if (typeof window === "undefined") return false;
  return window.isSecureContext === true;
}

function httpsHintUrl(): string {
  if (typeof window === "undefined") return "https://服务器IP:8443/";
  const { hostname, protocol, port } = window.location;
  if (protocol === "https:") return window.location.href;
  const host = hostname || "服务器IP";
  // 常见课堂部署：HTTP 8080 ↔ HTTPS 8443
  if (port === "8080" || port === "") {
    return `https://${host}:8443/`;
  }
  return `https://${host}:8443/`;
}

export function FacePredictLab() {
  const [preview, setPreview] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<PredictOk | null>(null);
  const [cameraOn, setCameraOn] = useState(false);
  const [secureOk, setSecureOk] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const captureRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setSecureOk(isSecureForCamera());
  }, []);

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    setCameraOn(false);
  }, []);

  useEffect(() => () => stopCamera(), [stopCamera]);

  const runPredict = async (raw: Blob) => {
    setBusy(true);
    setError(null);
    setResult(null);
    try {
      const blob = await compressImageBlob(raw);
      const body = new FormData();
      body.append("image", blob, "face.jpg");
      const res = await fetch("/api/face-predict", { method: "POST", body });
      const rawText = await res.text();
      let data: Record<string, unknown> = {};
      try {
        data = JSON.parse(rawText) as Record<string, unknown>;
      } catch {
        /* plain text error e.g. Payload Too Large */
      }

      if (!res.ok) {
        if (res.status === 413) {
          throw new Error("图片仍过大（413）。请换一张更小的照片，或裁剪后再试。");
        }
        const msg =
          typeof data.error === "string"
            ? data.error
            : typeof data.detail === "string"
              ? data.detail
              : rawText?.trim() || `请求失败（${res.status}）`;
        throw new Error(
          res.status === 503 && typeof data.hint === "string"
            ? `${data.error ?? "人脸推理服务未启动"}。${data.hint}`
            : msg,
        );
      }
      if (
        typeof data.label !== "string" ||
        typeof data.confidence !== "number" ||
        !data.probs
      ) {
        throw new Error("返回格式无效");
      }
      setResult(data as unknown as PredictOk);
    } catch (e) {
      setError(e instanceof Error ? e.message : "预测失败");
    } finally {
      setBusy(false);
    }
  };

  const onFile = async (file: File | null) => {
    if (!file) return;
    stopCamera();
    const url = URL.createObjectURL(file);
    setPreview(url);
    await runPredict(file);
  };

  const startCamera = async () => {
    setError(null);
    setResult(null);
    if (!isSecureForCamera()) {
      setError(
        `网页内摄像头需要 HTTPS（或本机 localhost）。请打开 ${httpsHintUrl()} （需已运行 ./deploy/enable-https.sh，首次接受自签名证书），或改用「上传照片 / 拍照上传（手机）」。`,
      );
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: { ideal: 960 }, height: { ideal: 720 } },
        audio: false,
      });
      streamRef.current = stream;
      setCameraOn(true);
      requestAnimationFrame(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          void videoRef.current.play();
        }
      });
    } catch {
      setError("无法打开摄像头，请检查浏览器权限，或改用「上传照片 / 拍照上传（手机）」。");
    }
  };

  const capture = async () => {
    const video = videoRef.current;
    if (!video || !video.videoWidth) {
      setError("摄像头尚未就绪，请稍候再拍。");
      return;
    }
    const canvas = document.createElement("canvas");
    const maxEdge = 960;
    const scale = Math.min(1, maxEdge / Math.max(video.videoWidth, video.videoHeight));
    canvas.width = Math.max(1, Math.round(video.videoWidth * scale));
    canvas.height = Math.max(1, Math.round(video.videoHeight * scale));
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob((b) => resolve(b), "image/jpeg", 0.82),
    );
    if (!blob) {
      setError("截图失败");
      return;
    }
    setPreview(URL.createObjectURL(blob));
    stopCamera();
    await runPredict(blob);
  };

  return (
    <div className="face-lab interactive">
      <div className="interactive-head">
        <div>
          <span>趣味实验 · 真实 ANN · ResNet18 迁移学习</span>
          <h3>同样是像素：网络怎样从数字识别扩展到人脸特征？</h3>
        </div>
        <button
          type="button"
          onClick={() => {
            setPreview(null);
            setResult(null);
            setError(null);
            stopCamera();
            if (fileRef.current) fileRef.current.value = "";
            if (captureRef.current) captureRef.current.value = "";
          }}
        >
          重置
        </button>
      </div>

      <div className="face-lab-actions">
        <button type="button" className="primary" disabled={busy} onClick={() => fileRef.current?.click()}>
          上传照片
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          hidden
          onChange={(e) => void onFile(e.target.files?.[0] ?? null)}
        />
        <input
          ref={captureRef}
          type="file"
          accept="image/*"
          capture="user"
          hidden
          onChange={(e) => void onFile(e.target.files?.[0] ?? null)}
        />
        <button type="button" disabled={busy} onClick={() => captureRef.current?.click()}>
          拍照上传（手机）
        </button>
        {!cameraOn ? (
          <button type="button" disabled={busy} onClick={() => void startCamera()}>
            {secureOk ? "打开摄像头" : "打开摄像头（需 HTTPS :8443）"}
          </button>
        ) : (
          <>
            <button type="button" className="primary" disabled={busy} onClick={() => void capture()}>
              拍照识别
            </button>
            <button type="button" disabled={busy} onClick={stopCamera}>
              关闭摄像头
            </button>
          </>
        )}
      </div>

      <div className="face-lab-stage">
        <div className="face-lab-preview">
          <span>输入</span>
          {cameraOn ? (
            <video ref={videoRef} playsInline muted autoPlay />
          ) : preview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={preview} alt="待识别预览" />
          ) : (
            <div className="face-lab-empty">上传、手机拍照，或打开摄像头后，预览会出现在这里。</div>
          )}
        </div>

        <div className="face-lab-result">
          <span>输出</span>
          {busy && <p className="face-lab-status">推理中…（首次加载模型可能稍慢）</p>}
          {error && <p className="face-lab-error">{error}</p>}
          {!busy && !error && !result && (
            <p className="face-lab-status">等待一张含清晰正脸的图片。</p>
          )}
          {result && (
            <>
              <div className="face-lab-label">
                <small>预测标签</small>
                <strong>{result.label}</strong>
                <em>
                  最大置信度 {(result.confidence * 100).toFixed(1)}%
                  {typeof result.threshold === "number"
                    ? ` · 拒识阈值 ${(result.threshold * 100).toFixed(0)}%`
                    : ""}
                </em>
              </div>
              <div className="face-lab-probs" aria-label="三类概率">
                {LABELS.map((name) => {
                  const p = result.probs[name] ?? 0;
                  return (
                    <div key={name}>
                      <div>
                        <b>{name}</b>
                        <small>{(p * 100).toFixed(1)}%</small>
                      </div>
                      <i style={{ width: `${Math.max(2, p * 100)}%` }} />
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </div>

      <p className="lab-disclaimer">
        Softmax 概率不等于真实身份匹配概率；本演示仅用于理解 ANN，不可用于门禁或身份认证。人脸属敏感信息，请获授权后使用。
      </p>
    </div>
  );
}
