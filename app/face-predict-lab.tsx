"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type Probs = { 笑雨: number; 骐源: number; 其他: number };
type PredictOk = { label: string; probs: Probs; confidence: number; threshold?: number };

const LABELS: Array<keyof Probs> = ["笑雨", "骐源", "其他"];
const XIAOYU_SAMPLE = "/images/xiaoyu.jpg";

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
  // 常见课堂部署：普通网络连接 8080 ↔ 加密网络连接 8443
  if (port === "8080" || port === "") {
    return `https://${host}:8443/`;
  }
  return `https://${host}:8443/`;
}

export function FacePredictLab() {
  const [preview, setPreview] = useState<string | null>(XIAOYU_SAMPLE);
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
    const id = window.setTimeout(() => setSecureOk(isSecureForCamera()), 0);
    return () => window.clearTimeout(id);
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

  const runXiaoyuSample = async () => {
    stopCamera();
    setPreview(XIAOYU_SAMPLE);
    setError(null);
    setResult(null);
    try {
      const response = await fetch(XIAOYU_SAMPLE);
      if (!response.ok) throw new Error("课堂示例照片读取失败");
      await runPredict(await response.blob());
    } catch (e) {
      setError(e instanceof Error ? e.message : "课堂示例照片读取失败");
    }
  };

  const startCamera = async () => {
    setError(null);
    setResult(null);
    if (!isSecureForCamera()) {
      setError(
        `网页内摄像头需要加密连接（或本机地址）。请打开 ${httpsHintUrl()} （需已运行加密连接脚本，首次接受自签名证书），或改用「上传照片 / 拍照上传（手机）」。`,
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
    <div className="xiaoyu-story">
      <section className="xiaoyu-story-hero" aria-labelledby="xiaoyu-story-title">
        <div className="xiaoyu-portrait">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={XIAOYU_SAMPLE} alt="笑雨举起剪刀手的课堂示例照片" />
          <div><span>室友之一</span><strong>笑雨</strong><small>XIAO YU · 课堂示例照片</small></div>
        </div>
        <div className="xiaoyu-premise">
          <span>案例支线 · 5—7分钟 · 课堂虚构故事</span>
          <h3 id="xiaoyu-story-title">两个室友，<br /><em>想给自家门禁装上“眼睛”。</em></h3>
          <p>笑雨和骐源是合住一套公寓的室友。两人想自己做一个简易的人脸识别门禁：门口摄像头拍到人脸后，模型只判断<strong>“笑雨”“骐源”或“其他”</strong>。如果模型有把握认出笑雨或骐源，门禁程序就执行开门；如果识别为“其他”，或者置信度没有达到阈值，门就保持关闭。两人先在彼此同意的前提下，收集不同角度、表情和光线下的照片并贴好标签，再补充其他人物照片，让模型不只会认出室友，也会拒绝陌生人。</p>
          <blockquote>“模型负责认人，门禁规则负责决定开不开门。”</blockquote>
          <div className="xiaoyu-binary"><span>门口摄像头拍到人脸</span><i>→</i><strong>笑雨：开门</strong><b>或</b><strong>骐源：开门</strong><b>或</b><strong>其他：不开门</strong></div>
        </div>
      </section>

      <section className="xiaoyu-training-map" aria-label="从照片到双人门禁识别器的训练流程">
        <div className="xiaoyu-training-head">
          <span>把上面的神经网络机制换一组像素，再走一遍</span>
          <h4>两位室友用来训练的是一组带标签（他们的名字）的照片</h4>
        </div>
        <div className="xiaoyu-training-flow">
          <div className="xiaoyu-samples">
            <span>01 · 带标签照片</span>
            <div><b className="target">笑雨</b><b className="target">骐源</b><b>其他</b></div>
            <small>角度 · 表情 · 光线 · 背景</small>
          </div>
          <i>→</i>
          <div><span>02 · 输入</span><strong>224 × 224</strong><small>像素张量</small></div>
          <i>→</i>
          <div><span>03 · 表示学习</span><strong>ResNet34</strong><small>边缘 → 纹理 → 面部组合</small></div>
          <i>→</i>
          <div><span>04 · 输出</span><strong>3 类概率</strong><small>Softmax + 交叉熵</small></div>
          <i>→</i>
          <div className="xiaoyu-decision"><span>05 · 门禁规则</span><strong>笑雨 / 骐源 ≥ 70%</strong><small>模拟开门；其他 / 低置信度保持关闭</small></div>
        </div>
      </section>

      <div className="face-lab interactive">
        <div className="face-lab-actions">
          <button type="button" className="primary" disabled={busy} onClick={() => void runXiaoyuSample()}>
            ▶ 用笑雨照片测试开门
          </button>
          <button type="button" disabled={busy} onClick={() => fileRef.current?.click()}>
            换一张照片
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
            {secureOk ? "打开摄像头" : "打开摄像头（需加密连接端口 8443）"}
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
              <div
                className={`face-access-decision ${result.label === "笑雨" || result.label === "骐源" ? "granted" : "denied"}`}
                aria-live="polite"
              >
                <small>门禁动作 · 课堂模拟</small>
                <strong>{result.label === "笑雨" || result.label === "骐源" ? "识别为室友，模拟开门" : "其他或无法确认，门保持关闭"}</strong>
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

      </div>
    </div>
  );
}
