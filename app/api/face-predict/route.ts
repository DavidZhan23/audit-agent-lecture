import { NextRequest, NextResponse } from "next/server";

/** 同源代理到 Python 人脸推理服务，前端只请求 /api/face-predict */
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// 部分运行时对 Route Handler 体积极限较严；与 next.config bodySizeLimit 一并放宽意图
export const maxDuration = 60;

const UPSTREAM = process.env.FACE_PREDICT_URL ?? "http://127.0.0.1:8765";
const MAX_PROXY_BYTES = 12 * 1024 * 1024;

export async function POST(request: NextRequest) {
  const contentLength = Number(request.headers.get("content-length") || "0");
  if (contentLength > MAX_PROXY_BYTES) {
    return NextResponse.json(
      { error: "图片过大", hint: "请压缩后重试（上限约 12MB）" },
      { status: 413 },
    );
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: "无法解析表单数据" }, { status: 400 });
  }

  const image = formData.get("image");
  if (!image || !(image instanceof Blob)) {
    return NextResponse.json({ error: "缺少 image 字段" }, { status: 400 });
  }

  if (image.size > MAX_PROXY_BYTES) {
    return NextResponse.json(
      { error: "图片过大", hint: "请压缩后重试（上限约 12MB）" },
      { status: 413 },
    );
  }

  const upstreamForm = new FormData();
  const filename = image instanceof File && image.name ? image.name : "capture.jpg";
  upstreamForm.append("image", image, filename);

  let upstream: Response;
  try {
    upstream = await fetch(`${UPSTREAM}/api/face-predict`, {
      method: "POST",
      body: upstreamForm,
    });
  } catch {
    return NextResponse.json(
      {
        error: "人脸推理服务未启动",
        hint: "请先在 services/face-predict 运行：python server.py",
      },
      { status: 503 },
    );
  }

  const text = await upstream.text();
  let payload: unknown = text;
  try {
    payload = JSON.parse(text);
  } catch {
    /* keep text */
  }

  if (!upstream.ok) {
    const detail =
      typeof payload === "object" && payload && "detail" in payload
        ? String((payload as { detail: unknown }).detail)
        : text || upstream.statusText;
    return NextResponse.json({ error: detail }, { status: upstream.status });
  }

  return NextResponse.json(payload);
}

