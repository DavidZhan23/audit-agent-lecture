"use client";

import { useState } from "react";
import { DIGIT_SIZE, digitSamples } from "./digit-samples";

/** 神经网络结构示意图：投屏清晰；MLP / CNN 同框切换对比 */

const ink = "#24302c";
const muted = "#5f6d68";
const accent = "#1f5c4d";
const accentSoft = "#e8f0ed";
const blue = "#1d4f91";
const blueSoft = "#e8eef6";
const warm = "#9a623c";
const warmSoft = "#f4ece5";
const line = "#d8ddda";

function SharedDefs({ prefix }: { prefix: string }) {
  return (
    <defs>
      <linearGradient id={`${prefix}-paper`} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#ffffff" />
        <stop offset="100%" stopColor="#f7f9f8" />
      </linearGradient>
      <linearGradient id={`${prefix}-gAccent`} x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#2a7a64" />
        <stop offset="100%" stopColor="#1f5c4d" />
      </linearGradient>
      <linearGradient id={`${prefix}-gBlue`} x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#3b6ea8" />
        <stop offset="100%" stopColor="#1d4f91" />
      </linearGradient>
      <filter id={`${prefix}-soft`} x="-20%" y="-20%" width="140%" height="140%">
        <feDropShadow dx="0" dy="2" stdDeviation="2.2" floodColor="#1f2926" floodOpacity="0.08" />
      </filter>
      <marker id={`${prefix}-arrow`} markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto">
        <path d="M0,0 L7,3.5 L0,7 Z" fill={ink} />
      </marker>
    </defs>
  );
}

function StageCard({
  x,
  y,
  w,
  h,
  filterId,
}: {
  x: number;
  y: number;
  w: number;
  h: number;
  filterId: string;
}) {
  return (
    <rect
      x={x}
      y={y}
      width={w}
      height={h}
      rx="10"
      fill="#fff"
      stroke={line}
      strokeWidth="1"
      filter={`url(#${filterId})`}
    />
  );
}

function LayerBadge({
  cx,
  y,
  label,
  fill,
  color,
  width = 108,
}: {
  cx: number;
  y: number;
  label: string;
  fill: string;
  color: string;
  width?: number;
}) {
  return (
    <g>
      <rect x={cx - width / 2} y={y} width={width} height={28} rx="14" fill={fill} />
      <text x={cx} y={y + 18} textAnchor="middle" fill={color} fontSize="12" fontWeight="700">
        {label}
      </text>
    </g>
  );
}

function PixelGrid({
  x,
  y,
  cell,
  rows,
  cols,
  pixels,
  on,
}: {
  x: number;
  y: number;
  cell: number;
  rows: number;
  cols: number;
  pixels?: readonly number[];
  on?: (r: number, c: number) => boolean;
}) {
  const gap = 1.2;
  return (
    <g>
      <rect
        x={x - 4}
        y={y - 4}
        width={cols * (cell + gap) - gap + 8}
        height={rows * (cell + gap) - gap + 8}
        rx="6"
        fill="#202b28"
      />
      {Array.from({ length: rows * cols }, (_, i) => {
        const r = Math.floor(i / cols);
        const c = i % cols;
        const value = pixels ? pixels[i] : on?.(r, c) ? 14 : 0;
        const lit = (value ?? 0) > 2;
        return (
          <rect
            key={i}
            x={x + c * (cell + gap)}
            y={y + r * (cell + gap)}
            width={cell}
            height={cell}
            rx="0.5"
            fill={lit ? "#7dcea0" : "#3a4541"}
            opacity={pixels ? 0.25 + ((value ?? 0) / 16) * 0.75 : 1}
          />
        );
      })}
    </g>
  );
}

function columnYs(count: number, start: number, gap: number) {
  return Array.from({ length: count }, (_, i) => start + i * gap);
}

/** 两层之间画满全连接（示意节点全部两两相连） */
function FullMesh({
  xFrom,
  ysFrom,
  xTo,
  ysTo,
  color,
  opacity,
  keyPrefix,
  r = 8,
}: {
  xFrom: number;
  ysFrom: number[];
  xTo: number;
  ysTo: number[];
  color: string;
  opacity: number;
  keyPrefix: string;
  r?: number;
}) {
  return (
    <g>
      {ysFrom.flatMap((y0, i) =>
        ysTo.map((y1, j) => (
          <line
            key={`${keyPrefix}-${i}-${j}`}
            x1={xFrom + r}
            y1={y0}
            x2={xTo - r}
            y2={y1}
            stroke={color}
            strokeOpacity={opacity}
            strokeWidth="0.95"
          />
        )),
      )}
    </g>
  );
}

function MlpSvg() {
  const width = 960;
  const height = 460;
  const prefix = "mlp";
  const midY = 240;
  const inputDim = DIGIT_SIZE * DIGIT_SIZE; // 256，与上方 DigitsImageLab 一致
  const demoPixels = digitSamples[2].pixels;

  // 列中心：像素 | 输入 | 隐1 | 隐2 | ··· | 隐L | 输出
  const pixelCx = 70;
  const inX = 195;
  const h1X = 355;
  const h2X = 475;
  const dotsX = 575;
  const hLX = 675;
  const outX = 830;

  const inYs = columnYs(6, 118, 36);
  const hYs = columnYs(6, 118, 36);
  const outDigits = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
  const outYs = columnYs(10, 112, 28);

  const gridCell = 4.2;
  const gridSize = DIGIT_SIZE * gridCell + (DIGIT_SIZE - 1) * 1.2;
  const gridX = pixelCx - gridSize / 2;
  const gridY = midY - gridSize / 2 - 6;

  return (
    <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label="全连接深度神经网络结构图">
      <SharedDefs prefix={prefix} />
      <rect x="0" y="0" width={width} height={height} fill={`url(#${prefix}-paper)`} />

      <StageCard x={20} y={58} w={100} h={340} filterId={`${prefix}-soft`} />
      <StageCard x={140} y={58} w={110} h={340} filterId={`${prefix}-soft`} />
      <StageCard x={280} y={58} w={460} h={340} filterId={`${prefix}-soft`} />
      <rect x={286} y={64} width={448} height={36} rx="8" fill={blueSoft} />
      <text x={510} y={87} textAnchor="middle" fill={blue} fontSize="13" fontWeight="700">
        隐藏层 × L（可叠很多层）
      </text>
      <StageCard x={770} y={58} w={120} h={340} filterId={`${prefix}-soft`} />

      <LayerBadge cx={pixelCx} y={18} label={`${DIGIT_SIZE}×${DIGIT_SIZE}`} fill={accentSoft} color={accent} width={88} />
      <LayerBadge cx={inX} y={18} label={`输入 · ${inputDim}`} fill={accentSoft} color={accent} width={100} />
      <LayerBadge cx={510} y={18} label="隐藏层 × L" fill={blueSoft} color={blue} width={120} />
      <LayerBadge cx={outX} y={18} label="输出 · 10" fill={warmSoft} color={warm} width={100} />

      <PixelGrid x={gridX} y={gridY} cell={gridCell} rows={DIGIT_SIZE} cols={DIGIT_SIZE} pixels={demoPixels} />
      <text x={pixelCx} y={432} textAnchor="middle" fill={muted} fontSize="12">
        示意数字「2」
      </text>

      <line
        x1={120}
        y1={midY}
        x2={140}
        y2={midY}
        stroke={ink}
        strokeWidth="1.5"
        markerEnd={`url(#${prefix}-arrow)`}
      />
      <text x={130} y={midY - 10} textAnchor="middle" fill={muted} fontSize="10">
        拉平
      </text>

      <FullMesh xFrom={inX} ysFrom={inYs} xTo={h1X} ysTo={hYs} color={accent} opacity={0.18} keyPrefix="i-h1" />
      <FullMesh xFrom={h1X} ysFrom={hYs} xTo={h2X} ysTo={hYs} color={blue} opacity={0.16} keyPrefix="h1-h2" />
      <FullMesh xFrom={h2X} ysFrom={hYs} xTo={hLX} ysTo={hYs} color={blue} opacity={0.12} keyPrefix="h2-hL" />
      <FullMesh xFrom={hLX} ysFrom={hYs} xTo={outX} ysTo={outYs} color={warm} opacity={0.14} keyPrefix="hL-o" r={9} />

      {inYs.map((y, i) => (
        <circle key={`in-${i}`} cx={inX} cy={y} r={8.5} fill="#fff" stroke={accent} strokeWidth="1.7" />
      ))}
      <text x={inX} y={432} textAnchor="middle" fill={muted} fontSize="12">
        {inputDim} 维 ···
      </text>

      {hYs.map((y, i) => (
        <circle key={`h1-${i}`} cx={h1X} cy={y} r={8.5} fill={blueSoft} stroke={blue} strokeWidth="1.7" />
      ))}
      <text x={h1X} y={372} textAnchor="middle" fill={blue} fontSize="11" fontWeight="700">
        第 1 层
      </text>

      {hYs.map((y, i) => (
        <circle key={`h2-${i}`} cx={h2X} cy={y} r={8.5} fill={blueSoft} stroke={blue} strokeWidth="1.7" />
      ))}
      <text x={h2X} y={372} textAnchor="middle" fill={blue} fontSize="11" fontWeight="700">
        第 2 层
      </text>

      <g>
        <circle cx={dotsX} cy={midY - 28} r={3.2} fill={blue} opacity="0.45" />
        <circle cx={dotsX} cy={midY} r={3.2} fill={blue} opacity="0.45" />
        <circle cx={dotsX} cy={midY + 28} r={3.2} fill={blue} opacity="0.45" />
        <text x={dotsX} y={372} textAnchor="middle" fill={blue} fontSize="11" fontWeight="700">
          ··· 更多
        </text>
      </g>

      {hYs.map((y, i) => (
        <circle key={`hL-${i}`} cx={hLX} cy={y} r={8.5} fill={blueSoft} stroke={blue} strokeWidth="1.7" />
      ))}
      <text x={hLX} y={372} textAnchor="middle" fill={blue} fontSize="11" fontWeight="700">
        第 L 层
      </text>

      <text x={510} y={432} textAnchor="middle" fill={muted} fontSize="12">
        结构：{DIGIT_SIZE}×{DIGIT_SIZE}（{inputDim}）→ 隐藏层×L → 10
      </text>

      {outDigits.map((d, i) => (
        <g key={`o-${d}`}>
          <circle
            cx={outX}
            cy={outYs[i]}
            r={10}
            fill={d === 2 ? `url(#${prefix}-gAccent)` : "#fff"}
            stroke={d === 2 ? accent : warm}
            strokeWidth="1.7"
          />
          <text
            x={outX}
            y={outYs[i] + 4}
            textAnchor="middle"
            fill={d === 2 ? "#fff" : ink}
            fontSize="11"
            fontWeight="700"
          >
            {d}
          </text>
        </g>
      ))}
      <text x={outX} y={432} textAnchor="middle" fill={muted} fontSize="12">
        Softmax · 10 类
      </text>

      <line
        x1={outX + 18}
        y1={outYs[2]}
        x2={outX + 54}
        y2={outYs[2]}
        stroke={accent}
        strokeWidth="1.5"
        markerEnd={`url(#${prefix}-arrow)`}
      />
      <text x={outX + 62} y={outYs[2] + 4} fill={accent} fontSize="14" fontWeight="700">
        「2」
      </text>
    </svg>
  );
}

function CnnSvg() {
  const width = 900;
  const height = 420;
  const prefix = "cnn";
  const col = [100, 290, 480, 650, 800];
  const cardTop = 56;
  const cardH = 280;
  const contentY = 118;
  const demoPixels = digitSamples[2].pixels;
  const inputDim = DIGIT_SIZE * DIGIT_SIZE;

  return (
    <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label="卷积神经网络流水线示意图">
      <SharedDefs prefix={prefix} />
      <rect x="0" y="0" width={width} height={height} fill={`url(#${prefix}-paper)`} />

      <StageCard x={34} y={cardTop} w={132} h={cardH} filterId={`${prefix}-soft`} />
      <StageCard x={214} y={cardTop} w={152} h={cardH} filterId={`${prefix}-soft`} />
      <StageCard x={404} y={cardTop} w={152} h={cardH} filterId={`${prefix}-soft`} />
      <StageCard x={584} y={cardTop} w={132} h={cardH} filterId={`${prefix}-soft`} />
      <StageCard x={744} y={cardTop} w={126} h={cardH} filterId={`${prefix}-soft`} />

      {[0, 1, 2, 3].map((i) => {
        const fromRight = [166, 366, 556, 716][i];
        const toLeft = [214, 404, 584, 744][i];
        return (
          <line
            key={`a-${i}`}
            x1={fromRight}
            y1={contentY + 48}
            x2={toLeft}
            y2={contentY + 48}
            stroke={ink}
            strokeWidth="1.6"
            markerEnd={`url(#${prefix}-arrow)`}
          />
        );
      })}

      <text x={col[0]} y={82} textAnchor="middle" fill={accent} fontSize="13" fontWeight="700">
        ① {DIGIT_SIZE}×{DIGIT_SIZE}
      </text>
      <PixelGrid
        x={col[0] - 38}
        y={contentY - 4}
        cell={4.2}
        rows={DIGIT_SIZE}
        cols={DIGIT_SIZE}
        pixels={demoPixels}
      />
      <text x={col[0]} y={contentY + 108} textAnchor="middle" fill={muted} fontSize="11">
        {inputDim} 像素
      </text>

      <text x={col[1]} y={82} textAnchor="middle" fill={blue} fontSize="13" fontWeight="700">
        ② 卷积×多层
      </text>
      {["边", "角", "线"].map((label, i) => (
        <g key={label} transform={`translate(${col[1] - 54 + i * 38}, ${contentY + 18})`}>
          <rect
            width="32"
            height="32"
            rx="6"
            fill={i === 1 ? `url(#${prefix}-gBlue)` : "#fff"}
            stroke={blue}
            strokeWidth="1.4"
          />
          <text
            x="16"
            y="21"
            textAnchor="middle"
            fill={i === 1 ? "#fff" : blue}
            fontSize="12"
            fontWeight="700"
          >
            {label}
          </text>
        </g>
      ))}
      <text x={col[1]} y={contentY + 108} textAnchor="middle" fill={muted} fontSize="11">
        隐藏层可叠很多
      </text>

      <text x={col[2]} y={82} textAnchor="middle" fill={blue} fontSize="13" fontWeight="700">
        ③ 特征图
      </text>
      {[0, 1, 2].map((i) => (
        <rect
          key={`fm-${i}`}
          x={col[2] - 36 + i * 10}
          y={contentY + 8 + i * 10}
          width="58"
          height="58"
          rx="6"
          fill={i % 2 === 0 ? accentSoft : blueSoft}
          stroke={i % 2 === 0 ? accent : blue}
          strokeWidth="1.5"
        />
      ))}
      <text x={col[2]} y={contentY + 108} textAnchor="middle" fill={muted} fontSize="11">
        边缘 → 笔画
      </text>

      <text x={col[3]} y={82} textAnchor="middle" fill={warm} fontSize="13" fontWeight="700">
        ④ 池化
      </text>
      <rect
        x={col[3] - 30}
        y={contentY + 22}
        width="46"
        height="46"
        rx="6"
        fill={warmSoft}
        stroke={warm}
        strokeWidth="1.5"
      />
      <rect
        x={col[3] - 18}
        y={contentY + 34}
        width="46"
        height="46"
        rx="6"
        fill="#fff"
        stroke={warm}
        strokeWidth="1.5"
        opacity="0.92"
      />
      <text x={col[3]} y={contentY + 108} textAnchor="middle" fill={muted} fontSize="11">
        缩小、保重点
      </text>

      <text x={col[4]} y={82} textAnchor="middle" fill={accent} fontSize="13" fontWeight="700">
        ⑤ 输出 · 10
      </text>
      {[0, 1, 2, 3].map((i) => (
        <circle
          key={`fc-${i}`}
          cx={col[4] - 26}
          cy={contentY + 10 + i * 24}
          r={7.5}
          fill="#fff"
          stroke={accent}
          strokeWidth="1.5"
        />
      ))}
      <line
        x1={col[4] - 14}
        y1={contentY + 46}
        x2={col[4] + 2}
        y2={contentY + 46}
        stroke={ink}
        strokeWidth="1.4"
        markerEnd={`url(#${prefix}-arrow)`}
      />
      {[0, 2, 8, 9].map((d, i) => (
        <g key={`cls-${d}`}>
          <circle
            cx={col[4] + 24}
            cy={contentY + 10 + i * 24}
            r={10}
            fill={d === 2 ? `url(#${prefix}-gAccent)` : "#fff"}
            stroke={accent}
            strokeWidth="1.5"
          />
          <text
            x={col[4] + 24}
            y={contentY + 14 + i * 24}
            textAnchor="middle"
            fill={d === 2 ? "#fff" : ink}
            fontSize="11"
            fontWeight="700"
          >
            {d}
          </text>
        </g>
      ))}
      <text x={col[4]} y={contentY + 128} textAnchor="middle" fill={muted} fontSize="11">
        Softmax → 0—9
      </text>

      <rect x="34" y={356} width={832} height={42} rx="8" fill="#f3f6f4" stroke={line} />
      <text x={width / 2} y={382} textAnchor="middle" fill={ink} fontSize="13">
        与全连接同一终点：输入高维像素，输出 10 个数字类别；中间用卷积叠很多层学形状
      </text>
    </svg>
  );
}

const MODES = {
  mlp: {
    tab: "全连接网络",
    sub: `16×16（256）→ 隐藏层×L → 10`,
    lead: "与上方示意同一套层数：16×16 像素拉成 256 维，经过可叠很多层的隐藏层，最后 Softmax 得到 0—9 共 10 类。相邻层全连接。",
  },
  cnn: {
    tab: "卷积神经网络 CNN",
    sub: `16×16 → 卷积×多层 → 10`,
    lead: "同样从 16×16 出发、同样输出 10 类；中间改用卷积叠很多层，先保留邻域再学边缘与笔画。",
  },
} as const;

/** MLP / CNN 同框切换，便于课堂对比 */
export function NetworkComparePanel() {
  const [mode, setMode] = useState<"mlp" | "cnn">("mlp");
  const meta = MODES[mode];

  return (
    <figure className="math-figure nn-arch-figure nn-compare">
      <header className="math-figure-title">
        <span>结构对比</span>
        <strong>同一套层数：16×16（256）→ 隐藏层×L → 10</strong>
      </header>

      <div className="nn-compare-tabs" role="tablist" aria-label="网络结构切换">
        {(Object.keys(MODES) as Array<"mlp" | "cnn">).map((key) => (
          <button
            key={key}
            type="button"
            role="tab"
            aria-selected={mode === key}
            className={mode === key ? "active" : ""}
            onClick={() => setMode(key)}
          >
            <b>{MODES[key].tab}</b>
            <small>{MODES[key].sub}</small>
          </button>
        ))}
      </div>

      <p className="nn-compare-lead">{meta.lead}</p>
      <div className="nn-compare-stage" key={mode}>
        {mode === "mlp" ? <MlpSvg /> : <CnnSvg />}
      </div>
    </figure>
  );
}


/** 兼容旧引用 */
export function MlpNetworkDiagram() {
  return (
    <figure className="math-figure nn-arch-figure">
      <MlpSvg />
    </figure>
  );
}

export function CnnPipelineDiagram() {
  return (
    <figure className="math-figure nn-arch-figure">
      <CnnSvg />
    </figure>
  );
}
