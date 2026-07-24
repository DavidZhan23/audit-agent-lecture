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
  // 常见课堂部署：HTTP 8080 ↔ HTTPS 8443
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
    <div className="xiaoyu-story">
      <section className="xiaoyu-story-hero" aria-labelledby="xiaoyu-story-title">
        <div className="xiaoyu-portrait">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={XIAOYU_SAMPLE} alt="笑雨举起剪刀手的课堂示例照片" />
          <div><span>今日主角</span><strong>笑雨</strong><small>XIAO YU · 本人已上线</small></div>
        </div>
        <div className="xiaoyu-premise">
          <span>趣味支线 · 5—7分钟 · 课堂虚构故事</span>
          <h3 id="xiaoyu-story-title">不必认识全世界，<br /><em>只要一眼认出笑雨。</em></h3>
          <p>笑雨住在一栋邻里热络、认人却有点马虎的公寓。每天清晨，他和许多年轻人一样，挤进电梯、穿过快递柜前白亮的灯光，再汇入一座脚步匆匆的城市。邻居们总会热情地向他点头，却常在下一秒叫出另一个名字；偶尔一句“你是不是住楼上的那位”，也会把刚刚升起的亲切感轻轻推远。被认错似乎只是一件微不足道的小事，可次数多了，笑雨渐渐觉得，自己像这座城市里一张没有被保存的面孔——每天与许多人擦肩，却很少真正被谁记住。一次深夜，他向小伙伴骐源说起这份难以启齿的失落，没想到骐源沉默片刻，也说自己常有同样的感受。两个<strong>“总被认错的人”</strong>一拍即合：既然邻居一时记不住，那就先教会一个模型。他们整理照片、贴上名字，看着一轮轮训练从屏幕上跑过。终于，模型一次次坚定地显示出“笑雨”。笑雨带着微笑看着电脑，轻声说：“能被你认识，真好啊。”</p>
          <blockquote>“世界很大，而我想被认出来。”</blockquote>
          <div className="xiaoyu-binary"><span>公寓里的所有人</span><i>→</i><strong>笑雨</strong><b>或</b><strong>骐源</strong><b>或</b><strong>其他</strong></div>
        </div>
      </section>

      <section className="xiaoyu-training-map" aria-label="从照片到双人限定识别器的训练流程">
        <div className="xiaoyu-training-head">
          <span>把上面的 ANN 机制换一组像素，再走一遍</span>
          <h4>他“喂给网络”的不是一个名字，而是一组带答案的照片</h4>
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
          <div className="xiaoyu-decision"><span>05 · 上线规则</span><strong>目标身份 ≥ 70%</strong><small>否则：其他 / 无法确定</small></div>
        </div>
        <p><b>精妙之处：</b>这个模型不是要认识全世界，而是划出一个极小的“熟人圈”：准确区分<strong>笑雨与骐源</strong>，并把圈外的人送进“其他”。学会拒绝，和学会认出同样重要。</p>
      </section>

      <div className="face-lab interactive">
        <div className="interactive-head">
          <div>
            <span>模型亮相 · 真实 ANN · ResNet34 迁移学习</span>
            <h3>双人限定识别器 v0.1：让训练后的权重回答</h3>
          </div>
          <button
            type="button"
            onClick={() => {
              setPreview(XIAOYU_SAMPLE);
              setResult(null);
              setError(null);
              stopCamera();
              if (fileRef.current) fileRef.current.value = "";
              if (captureRef.current) captureRef.current.value = "";
            }}
          >
            回到示例
          </button>
        </div>

        <div className="face-lab-actions">
          <button type="button" className="primary" disabled={busy} onClick={() => void runXiaoyuSample()}>
            ▶ 让模型认认笑雨
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
          故事的反转：模型能把像素分进某一类，却不知道“被认错为什么让人难过”。Softmax 概率也不等于真实身份匹配概率；本演示仅用于理解 ANN，不可用于门禁或身份认证。人脸属敏感信息，请获授权后使用。
        </p>
      </div>
    </div>
  );
}
