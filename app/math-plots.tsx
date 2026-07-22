"use client";

/** 讲义用数形结合图：少字、可投屏、重点一眼可见 */

function axisArrow(x1: number, y1: number, x2: number, y2: number) {
  const isH = y1 === y2;
  return (
    <g stroke="#44554f" strokeWidth="1.6" fill="#44554f">
      <line x1={x1} y1={y1} x2={x2} y2={y2} />
      {isH ? (
        <polygon points={`${x2},${y2} ${x2 - 7},${y2 - 4} ${x2 - 7},${y2 + 4}`} />
      ) : (
        <polygon points={`${x2},${y2} ${x2 - 4},${y2 + 7} ${x2 + 4},${y2 + 7}`} />
      )}
    </g>
  );
}

export function SigmoidPlot() {
  const width = 560;
  const height = 300;
  const pad = { l: 56, r: 28, t: 36, b: 52 };
  const innerW = width - pad.l - pad.r;
  const innerH = height - pad.t - pad.b;
  const zMin = -6;
  const zMax = 6;
  const xOf = (z: number) => pad.l + ((z - zMin) / (zMax - zMin)) * innerW;
  const yOf = (p: number) => pad.t + (1 - p) * innerH;

  const pts: string[] = [];
  const area: string[] = [`${xOf(zMin).toFixed(1)},${yOf(0).toFixed(1)}`];
  for (let i = 0; i <= 160; i += 1) {
    const z = zMin + ((zMax - zMin) * i) / 160;
    const p = 1 / (1 + Math.exp(-z));
    const x = xOf(z);
    const y = yOf(p);
    pts.push(`${i === 0 ? "M" : "L"}${x.toFixed(2)},${y.toFixed(2)}`);
    area.push(`${x.toFixed(2)},${y.toFixed(2)}`);
  }
  area.push(`${xOf(zMax).toFixed(1)},${yOf(0).toFixed(1)}`);

  const marks = [
    { z: -2, p: 1 / (1 + Math.exp(2)), tag: "更像正常", side: "left" as const },
    { z: 0, p: 0.5, tag: "五五开", side: "top" as const },
    { z: 2, p: 1 / (1 + Math.exp(-2)), tag: "更像异常", side: "right" as const },
  ];

  return (
    <figure className="math-figure">
      <header className="math-figure-title">
        <span>图 1</span>
        <strong>Sigmoid：把得分变成概率</strong>
      </header>
      <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Sigmoid 函数图像">
        <defs>
          <linearGradient id="sigFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#1f6b4f" stopOpacity="0.16" />
            <stop offset="100%" stopColor="#1f6b4f" stopOpacity="0.02" />
          </linearGradient>
        </defs>
        <rect x="0" y="0" width={width} height={height} fill="#fff" />
        {/* light grid */}
        {[-4, -2, 0, 2, 4].map((z) => (
          <line key={`vx-${z}`} x1={xOf(z)} y1={pad.t} x2={xOf(z)} y2={pad.t + innerH} stroke="#eef2f0" />
        ))}
        {[0.25, 0.5, 0.75].map((p) => (
          <line key={`hy-${p}`} x1={pad.l} y1={yOf(p)} x2={pad.l + innerW} y2={yOf(p)} stroke="#eef2f0" />
        ))}
        {/* asymptote hints */}
        <line x1={pad.l} y1={yOf(1)} x2={pad.l + innerW} y2={yOf(1)} stroke="#c5d0cb" strokeDasharray="5 4" />
        <line x1={pad.l} y1={yOf(0)} x2={pad.l + innerW} y2={yOf(0)} stroke="#c5d0cb" strokeDasharray="5 4" />

        <path d={`M${area[0]} L${area.slice(1).join(" L")}`} fill="url(#sigFill)" opacity="0.9" />
        <path d={pts.join(" ")} fill="none" stroke="#1f6b4f" strokeWidth="3" strokeLinecap="round" />

        {axisArrow(pad.l, pad.t + innerH, pad.l + innerW + 8, pad.t + innerH)}
        {axisArrow(pad.l, pad.t + innerH, pad.l, pad.t - 8)}

        {/* ticks */}
        {[-4, -2, 0, 2, 4].map((z) => (
          <g key={`tick-${z}`}>
            <line x1={xOf(z)} y1={pad.t + innerH} x2={xOf(z)} y2={pad.t + innerH + 5} stroke="#44554f" />
            <text x={xOf(z)} y={pad.t + innerH + 18} textAnchor="middle" fill="#5f6d68" fontSize="11">
              {z}
            </text>
          </g>
        ))}
        {[0, 0.5, 1].map((p) => (
          <g key={`yt-${p}`}>
            <line x1={pad.l - 5} y1={yOf(p)} x2={pad.l} y2={yOf(p)} stroke="#44554f" />
            <text x={pad.l - 10} y={yOf(p) + 4} textAnchor="end" fill="#5f6d68" fontSize="11">
              {p}
            </text>
          </g>
        ))}

        {marks.map(({ z, p, tag, side }) => {
          const cx = xOf(z);
          const cy = yOf(p);
          const labelX = side === "left" ? cx - 58 : side === "right" ? cx + 58 : cx;
          const labelY = side === "top" ? cy - 28 : cy - 2;
          return (
            <g key={z}>
              <circle cx={cx} cy={cy} r="5" fill="#fff" stroke="#1f6b4f" strokeWidth="2.5" />
              <text x={labelX} y={labelY} textAnchor="middle" fill="#1f6b4f" fontSize="12" fontWeight="700">
                {tag}
              </text>
              <text x={labelX} y={labelY + 14} textAnchor="middle" fill="#6a7872" fontSize="10">
                {`z=${z}, p≈${p.toFixed(2)}`}
              </text>
            </g>
          );
        })}

        <text x={pad.l + innerW + 4} y={pad.t + innerH + 4} fill="#24302c" fontSize="13" fontWeight="700">
          z
        </text>
        <text x={pad.l + 8} y={pad.t - 12} fill="#24302c" fontSize="13" fontWeight="700">
          p
        </text>
      </svg>
      <p className="math-figure-note">课堂一句：分数往右推，概率往 1 靠；往左推，往 0 靠。两端会“顶满”，中间最敏感。</p>
    </figure>
  );
}

export function CrossEntropyPlot() {
  const width = 560;
  const height = 300;
  const pad = { l: 56, r: 28, t: 44, b: 52 };
  const innerW = width - pad.l - pad.r;
  const innerH = height - pad.t - pad.b;
  const lossMax = 3.2;
  const xOf = (p: number) => pad.l + p * innerW;
  const yOf = (loss: number) => pad.t + (1 - Math.min(loss, lossMax) / lossMax) * innerH;

  const build = (fn: (p: number) => number) => {
    const out: string[] = [];
    for (let i = 0; i <= 120; i += 1) {
      const p = 0.03 + (0.94 * i) / 120;
      out.push(`${i === 0 ? "M" : "L"}${xOf(p).toFixed(2)},${yOf(fn(p)).toFixed(2)}`);
    }
    return out.join(" ");
  };

  const pathY1 = build((p) => -Math.log(p));
  const pathY0 = build((p) => -Math.log(1 - p));

  // example points for lecture storytelling
  const bad = { p: 0.12, loss: -Math.log(0.12), label: "真异常却给低分" };
  const good = { p: 0.88, loss: -Math.log(0.88), label: "真异常且给高分" };

  return (
    <figure className="math-figure">
      <header className="math-figure-title">
        <span>图 2</span>
        <strong>交叉熵：猜错，罚得重</strong>
      </header>
      <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label="交叉熵损失曲线">
        <rect x="0" y="0" width={width} height={height} fill="#fff" />
        {[0.25, 0.5, 0.75].map((p) => (
          <line key={`g-${p}`} x1={xOf(p)} y1={pad.t} x2={xOf(p)} y2={pad.t + innerH} stroke="#eef2f0" />
        ))}
        {[1, 2, 3].map((L) => (
          <line key={`h-${L}`} x1={pad.l} y1={yOf(L)} x2={pad.l + innerW} y2={yOf(L)} stroke="#eef2f0" />
        ))}

        {axisArrow(pad.l, pad.t + innerH, pad.l + innerW + 8, pad.t + innerH)}
        {axisArrow(pad.l, pad.t + innerH, pad.l, pad.t - 8)}

        <path d={pathY1} fill="none" stroke="#b45309" strokeWidth="2.8" strokeLinecap="round" />
        <path d={pathY0} fill="none" stroke="#1d4f91" strokeWidth="2.8" strokeLinecap="round" strokeDasharray="7 5" />

        {/* lecture callouts on y=1 curve */}
        <circle cx={xOf(bad.p)} cy={yOf(bad.loss)} r="4.5" fill="#b45309" />
        <line x1={xOf(bad.p)} y1={yOf(bad.loss)} x2={xOf(bad.p) + 36} y2={yOf(bad.loss) - 28} stroke="#b45309" strokeWidth="1" />
        <text x={xOf(bad.p) + 40} y={yOf(bad.loss) - 32} fill="#9a3412" fontSize="11" fontWeight="700">
          {bad.label}
        </text>
        <circle cx={xOf(good.p)} cy={yOf(good.loss)} r="4.5" fill="#b45309" />
        <line x1={xOf(good.p)} y1={yOf(good.loss)} x2={xOf(good.p) - 8} y2={yOf(good.loss) - 34} stroke="#b45309" strokeWidth="1" />
        <text x={xOf(good.p) - 10} y={yOf(good.loss) - 38} textAnchor="end" fill="#9a3412" fontSize="11" fontWeight="700">
          {good.label}
        </text>

        {/* legend */}
        <g transform={`translate(${pad.l + 8}, ${pad.t - 22})`}>
          <line x1="0" y1="0" x2="22" y2="0" stroke="#b45309" strokeWidth="2.8" />
          <text x="28" y="4" fill="#9a3412" fontSize="11" fontWeight="700">
            y=1（真异常）
          </text>
          <line x1="140" y1="0" x2="162" y2="0" stroke="#1d4f91" strokeWidth="2.8" strokeDasharray="7 5" />
          <text x="168" y="4" fill="#1e3a8a" fontSize="11" fontWeight="700">
            y=0（真正常）
          </text>
        </g>

        {[0, 0.5, 1].map((p) => (
          <text key={`xt-${p}`} x={xOf(p)} y={pad.t + innerH + 18} textAnchor="middle" fill="#5f6d68" fontSize="11">
            {p}
          </text>
        ))}
        {[0, 1, 2, 3].map((L) => (
          <text key={`yt-${L}`} x={pad.l - 10} y={yOf(L) + 4} textAnchor="end" fill="#5f6d68" fontSize="11">
            {L}
          </text>
        ))}
        <text x={pad.l + innerW + 4} y={pad.t + innerH + 4} fill="#24302c" fontSize="13" fontWeight="700">
          p
        </text>
        <text x={pad.l + 8} y={pad.t - 12} fill="#24302c" fontSize="13" fontWeight="700">
          ℓ
        </text>
      </svg>
      <p className="math-figure-note">课堂一句：橙线看「漏报」有多疼，蓝虚线看「误报」有多疼。训练 = 两边都少挨打。</p>
    </figure>
  );
}

export function ReluPlot() {
  const width = 560;
  const height = 260;
  const pad = { l: 56, r: 28, t: 36, b: 48 };
  const innerW = width - pad.l - pad.r;
  const innerH = height - pad.t - pad.b;
  const zMin = -3;
  const zMax = 3;
  const yMax = 3;
  const xOf = (z: number) => pad.l + ((z - zMin) / (zMax - zMin)) * innerW;
  const yOf = (v: number) => pad.t + (1 - v / yMax) * innerH;

  const left = `M${xOf(zMin).toFixed(1)},${yOf(0).toFixed(1)} L${xOf(0).toFixed(1)},${yOf(0).toFixed(1)}`;
  const right = `M${xOf(0).toFixed(1)},${yOf(0).toFixed(1)} L${xOf(zMax).toFixed(1)},${yOf(zMax).toFixed(1)}`;

  return (
    <figure className="math-figure">
      <header className="math-figure-title">
        <span>图 3</span>
        <strong>ReLU：负的掐掉，正的原样过</strong>
      </header>
      <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label="ReLU 函数图像">
        <rect x="0" y="0" width={width} height={height} fill="#fff" />
        {[-2, -1, 0, 1, 2].map((z) => (
          <line key={`vx-${z}`} x1={xOf(z)} y1={pad.t} x2={xOf(z)} y2={pad.t + innerH} stroke="#eef2f0" />
        ))}
        {[1, 2].map((v) => (
          <line key={`hy-${v}`} x1={pad.l} y1={yOf(v)} x2={pad.l + innerW} y2={yOf(v)} stroke="#eef2f0" />
        ))}

        {axisArrow(pad.l, pad.t + innerH, pad.l + innerW + 8, pad.t + innerH)}
        {axisArrow(pad.l, pad.t + innerH, pad.l, pad.t - 8)}

        <path d={left} fill="none" stroke="#1d4f91" strokeWidth="3" strokeLinecap="round" />
        <path d={right} fill="none" stroke="#1f6b4f" strokeWidth="3" strokeLinecap="round" />
        <circle cx={xOf(0)} cy={yOf(0)} r="4.5" fill="#b45309" />

        <text x={xOf(-1.6)} y={yOf(0) - 12} textAnchor="middle" fill="#1e3a8a" fontSize="12" fontWeight="700">
          负值 → 0
        </text>
        <text x={xOf(1.7)} y={yOf(1.7) - 14} textAnchor="middle" fill="#14532d" fontSize="12" fontWeight="700">
          正值原样
        </text>

        {[-2, 0, 2].map((z) => (
          <text key={`xt-${z}`} x={xOf(z)} y={pad.t + innerH + 18} textAnchor="middle" fill="#5f6d68" fontSize="11">
            {z}
          </text>
        ))}
        {[0, 1, 2, 3].map((v) => (
          <text key={`yt-${v}`} x={pad.l - 10} y={yOf(v) + 4} textAnchor="end" fill="#5f6d68" fontSize="11">
            {v}
          </text>
        ))}
        <text x={pad.l + innerW + 4} y={pad.t + innerH + 4} fill="#24302c" fontSize="13" fontWeight="700">
          z
        </text>
        <text x={pad.l + 8} y={pad.t - 12} fill="#24302c" fontSize="13" fontWeight="700">
          ReLU
        </text>
      </svg>
      <p className="math-figure-note">课堂一句：没有这类「拐一下」，多层线性叠在一起仍等价于一层；非线性才让网络学出笔画组合。</p>
    </figure>
  );
}
