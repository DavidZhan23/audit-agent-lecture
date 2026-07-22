"use client";

import { useMemo, useState } from "react";
import { DIGIT_SIZE, digitSamples } from "./digit-samples";

const sigmoid = (value: number) => 1 / (1 + Math.exp(-value));

export function LessonTakeaway({ children }: { children: React.ReactNode }) {
  return <div className="lesson-takeaway"><span>本章必须带走的一句话</span><strong>{children}</strong></div>;
}

export function DeepDive({ title, children }: { title: string; children: React.ReactNode }) {
  return <details className="deep-dive"><summary><span>扩展内容</span><strong>{title}</strong><i>展开</i></summary><div>{children}</div></details>;
}

export function KnownUnknownBridge() {
  const items = [
    ["关系已经知道", "计算", "总金额 = 各笔金额相加", "把明确公式交给程序。"],
    ["判断已经知道", "规则", "金额 > 标准且无审批", "把明确条件交给程序。"],
    ["关系无法完整写出", "学习", "哪些组合更像历史真实疑点？", "给出案例，让模型寻找近似关系。"],
  ];
  return <div className="known-unknown"><div className="concept-question"><span>先不要急着说“AI”</span><h3>计算机面对的三类问题，有什么不同？</h3></div><div>{items.map((item, index) => <section key={item[1]}><b>0{index + 1}</b><small>{item[0]}</small><strong>{item[1]}</strong><code>{item[2]}</code><p>{item[3]}</p></section>)}</div><blockquote><b>严谨提醒：</b>机器学习不等于“没有解析解”。真正的分界是：判断关系能否被人完整写出，还是需要从历史案例中估计。</blockquote></div>;
}

const fitStates = [
  { label: "训练前", epoch: 0, w: 0, b: 0, loss: 0.693 },
  { label: "训练10步", epoch: 10, w: 1.51, b: -0.92, loss: 0.537 },
  { label: "训练完成", epoch: 60, w: 5.75, b: -3.28, loss: 0.288 },
];
const fitPoints = [
  { x: .12, y: 0, id: "HIST-0012" }, { x: .24, y: 0, id: "HIST-0047" },
  { x: .39, y: 0, id: "HIST-0086" }, { x: .52, y: 0, id: "HIST-0113" },
  { x: .63, y: 1, id: "HIST-0159" }, { x: .77, y: 1, id: "HIST-0204" },
  { x: .91, y: 1, id: "HIST-0231" },
];

export function FunctionFittingLab() {
  const [stage, setStage] = useState(0);
  const model = fitStates[stage];
  const px = (x: number) => 42 + x * 310;
  const py = (y: number) => 198 - y * 156;
  const curve = Array.from({ length: 41 }, (_, index) => {
    const x = index / 40;
    const y = sigmoid(model.w * x + model.b);
    return `${index ? "L" : "M"}${px(x).toFixed(1)},${py(y).toFixed(1)}`;
  }).join(" ");
  const lossX = 424 + model.epoch / 60 * 286;
  const lossY = 198 - (0.76 - model.loss) / .65 * 145;
  return <div className="fitting-lab interactive">
    <div className="interactive-head"><div><span>核心互动 · 函数拟合</span><h3>训练究竟在做什么？看曲线和Loss同时变化</h3></div><button onClick={() => setStage(0)}>重置</button></div>
    <div className="fit-controls" role="group" aria-label="选择训练阶段">{fitStates.map((item, index) => <button key={item.label} className={stage === index ? "active" : ""} aria-pressed={stage === index} onClick={() => setStage(index)}><strong>{item.label}</strong><small>epoch {item.epoch}</small></button>)}<button className="primary" disabled={stage === fitStates.length - 1} onClick={() => setStage(Math.min(fitStates.length - 1, stage + 1))}>训练一步 →</button></div>
    <div className="fit-live"><span>当前模型：ŷ = sigmoid({model.w.toFixed(2)} × x {model.b < 0 ? "−" : "+"} {Math.abs(model.b).toFixed(2)})</span><strong>Loss = {model.loss.toFixed(3)}</strong></div>
    <svg className="fit-chart" viewBox="0 0 760 245" role="img" aria-label={`训练阶段${model.label}，总体损失${model.loss.toFixed(3)}`}>
      <title>模型拟合与损失下降同步图</title><desc>左侧概率曲线逐步靠近历史标签，右侧参数沿损失曲线向低点移动。</desc>
      <g className="chart-grid"><line x1="42" y1="42" x2="352" y2="42"/><line x1="42" y1="120" x2="352" y2="120"/><line x1="42" y1="198" x2="352" y2="198"/><line x1="42" y1="198" x2="352" y2="198"/><line x1="424" y1="42" x2="710" y2="42"/><line x1="424" y1="120" x2="710" y2="120"/><line x1="424" y1="198" x2="710" y2="198"/></g>
      <text x="42" y="22">模型怎样拟合历史案例</text><text x="424" y="22">参数怎样寻找更低Loss</text>
      <text x="6" y="46">1 疑点</text><text x="6" y="202">0 正常</text><text x="140" y="230">组合异常程度 x</text><text x="510" y="230">训练步数 / 参数位置</text>
      {fitPoints.map((point) => { const predicted = sigmoid(model.w * point.x + model.b); return <g key={point.id}><line className="error-line" x1={px(point.x)} y1={py(point.y)} x2={px(point.x)} y2={py(predicted)} /><circle className={point.y ? "point risk" : "point normal"} cx={px(point.x)} cy={py(point.y)} r="5"/></g>; })}
      <path className="model-curve" d={curve}/>
      <path className="loss-curve" d="M424,45 C485,50 520,100 563,145 C610,194 665,200 710,202"/>
      <circle className="loss-point" cx={lossX} cy={lossY} r="7"/><text className="loss-label" x={Math.min(660, lossX + 10)} y={Math.max(55, lossY - 10)}>Loss {model.loss.toFixed(3)}</text>
    </svg>
    <div className="fit-formula"><span>输入 X</span><i>→</i><span>带参数的函数 fθ</span><i>→</i><span>预测 ŷ</span><i>与答案 y 比较</i><strong>→ 调整参数，让总体误差更小</strong></div>
    <p className="lab-disclaimer">图中7条代表样本、学习率和第0/10/60步参数与下方Python代码的“一维拟合演示”完全一致。Loss下降只说明更贴合训练案例，不自动证明模型在新数据上可靠。</p>
  </div>;
}

const evaluationRecords = [
  [94,1],[89,1],[84,1],[79,0],[76,1],[72,0],[68,1],[63,0],[59,1],[55,0],
  [51,0],[47,1],[43,0],[38,0],[34,1],[29,0],[24,0],[18,0],[14,1],[8,0],
] as const;

export function ConfusionMatrixLab() {
  const [threshold, setThreshold] = useState(50);
  const result = useMemo(() => evaluationRecords.reduce((acc, [score, actual]) => {
    const predicted = score >= threshold ? 1 : 0;
    if (predicted && actual) acc.tp += 1;
    else if (predicted && !actual) acc.fp += 1;
    else if (!predicted && actual) acc.fn += 1;
    else acc.tn += 1;
    return acc;
  }, { tp: 0, fp: 0, fn: 0, tn: 0 }), [threshold]);
  const precision = result.tp / Math.max(1, result.tp + result.fp);
  const recall = result.tp / Math.max(1, result.tp + result.fn);
  return <div className="confusion-lab interactive">
    <div className="interactive-head"><div><span>核心互动 · 模型评价</span><h3>报警阈值改变时，误报和遗漏怎样交换？</h3></div><button onClick={() => setThreshold(50)}>重置</button></div>
    <label className="threshold-control"><span>重点核查阈值</span><strong>{threshold}%</strong><input aria-label="重点核查阈值" type="range" min="20" max="80" step="5" value={threshold} onChange={(event) => setThreshold(Number(event.target.value))}/></label>
    <div className="evaluation-grid"><div className="record-grid" aria-label="20笔验证记录">{evaluationRecords.map(([score, actual], index) => { const predicted = score >= threshold; const status = predicted ? actual ? "tp" : "fp" : actual ? "fn" : "tn"; return <div key={index} className={status} aria-label={`记录${index + 1}，风险分${score}，${status}`}><strong>{score}</strong><small>{status.toUpperCase()}</small></div>; })}</div><div className="matrix-summary"><div><span>真阳性 TP</span><strong>{result.tp}</strong><p>真实疑点且报出</p></div><div><span>假阳性 FP</span><strong>{result.fp}</strong><p>合理事项被误报</p></div><div><span>假阴性 FN</span><strong>{result.fn}</strong><p>真实疑点被遗漏</p></div><div><span>真阴性 TN</span><strong>{result.tn}</strong><p>正常事项正确通过</p></div></div></div>
    <div className="metric-explain"><div><span>查准率</span><strong>{(precision * 100).toFixed(0)}%</strong><p>报出的事项中，有多少确实值得查。</p></div><div><span>召回率</span><strong>{(recall * 100).toFixed(0)}%</strong><p>全部真实疑点中，系统找到了多少。</p></div><p>{threshold < 45 ? "阈值较低：更少遗漏，但审计人员要处理更多误报。" : threshold > 60 ? "阈值较高：清单更短，但更容易漏掉真实疑点。" : "当前阈值在工作量与遗漏风险之间折中；它仍需结合审计目标决定。"}</p></div>
  </div>;
}

export function TrainingLifecycle() {
  const [active, setActive] = useState(0);
  const steps = [
    ["历史训练集", "240条", "模型在这里调整参数。"],
    ["独立验证集", "60条", "训练过程不读取，用来检查新案例表现。"],
    ["训练", "参数变化", "反复计算预测、Loss和参数更新。"],
    ["推理", "参数固定", "把本期待审事项输入已训练模型。"],
    ["风险防线", "泄漏/过拟合", "不能把答案字段泄漏给模型，也不能只看训练成绩。"],
  ];
  return <div className="training-lifecycle"><div>{steps.map((step, index) => <button key={step[0]} className={active === index ? "active" : ""} onClick={() => setActive(index)}><span>0{index + 1}</span><strong>{step[0]}</strong></button>)}</div><section><span>机器学习流程 {active + 1}/5</span><h3>{steps[active][0]}</h3><strong>{steps[active][1]}</strong><p>{steps[active][2]}</p></section></div>;
}

export function NeuronContinuityLab() {
  const [phase, setPhase] = useState(0);
  const [mismatch, setMismatch] = useState(.82);
  const [fontAnomaly, setFontAnomaly] = useState(.74);
  const phases = [
    { name: "随机初始化", w1: .18, w2: -.12, bias: .02, loss: .693 },
    { name: "训练过程中", w1: 1.26, w2: .84, bias: -.72, loss: .318 },
    { name: "训练完成", w1: 2.42, w2: 1.87, bias: -2.15, loss: .071 },
  ];
  const state = phases[phase];
  const z = mismatch * state.w1 + fontAnomaly * state.w2 + state.bias;
  const output = sigmoid(z);
  return <div className="neuron-continuity interactive">
    <div className="interactive-head"><div><span>核心互动 · 从函数到神经网络</span><h3>一个神经元仍然是“带参数的函数”</h3></div><button onClick={() => { setPhase(0); setMismatch(.82); setFontAnomaly(.74); }}>重置</button></div>
    <div className="phase-tabs">{phases.map((item, index) => <button key={item.name} className={phase === index ? "active" : ""} onClick={() => setPhase(index)}><strong>{item.name}</strong><small>Loss {item.loss}</small></button>)}</div>
    <div className="neuron-layout"><div className="neuron-inputs"><label><span>金额矛盾程度 x₁</span><strong>{mismatch.toFixed(2)}</strong><input aria-label="金额矛盾程度" type="range" min="0" max="1" step="0.01" value={mismatch} onChange={(e) => setMismatch(Number(e.target.value))}/></label><label><span>字体异常程度 x₂</span><strong>{fontAnomaly.toFixed(2)}</strong><input aria-label="字体异常程度" type="range" min="0" max="1" step="0.01" value={fontAnomaly} onChange={(e) => setFontAnomaly(Number(e.target.value))}/></label></div><div className="neuron-calc"><div><span>x₁ × w₁</span><strong>{mismatch.toFixed(2)} × {state.w1.toFixed(2)}</strong></div><i>+</i><div><span>x₂ × w₂</span><strong>{fontAnomaly.toFixed(2)} × {state.w2.toFixed(2)}</strong></div><i>+</i><div><span>偏置 b</span><strong>{state.bias.toFixed(2)}</strong></div><i>→</i><div className="neuron-output"><span>修改概率</span><strong>{(output * 100).toFixed(1)}%</strong></div></div></div>
    <div className="representation-ladder">{["票据像素", "边缘与笔画", "数字区域", "打印金额", "二维码金额", "修改概率"].map((item, index) => <div key={item}><b>{String(index + 1).padStart(2,"0")}</b><span>{item}</span>{index < 5 && <i>→</i>}</div>)}</div>
    <p className="lab-disclaimer">这里把多层网络压缩成一个神经元观察加权计算；下方检查点和Python代码再展示同一事项的2→2→1网络。真实票据模型需要大量标注图片、数据增强和独立测试。</p>
  </div>;
}

const digitConfidence: Record<number, number> = {
  0: 98.2,
  1: 97.6,
  2: 99.5,
  3: 96.8,
  4: 98.9,
  5: 95.4,
  6: 99.8,
  7: 97.1,
  8: 94.2,
  9: 96.5,
};

type TrainPhase = "before" | "during" | "after";

/** 示意 Softmax：训练前均匀 → 训练中略乱且真数字稍高 → 训练后峰值对准 */
function demoSoftmax(digit: number, phase: TrainPhase): number[] {
  if (phase === "before") {
    return Array.from({ length: 10 }, () => 0.1);
  }
  if (phase === "during") {
    // 接近原先「训练前」的略不均匀，但真数字再抬一点
    const raw = Array.from({ length: 10 }, (_, i) => {
      const base = 0.7 + ((digit * 5 + i * 11) % 9) * 0.08;
      return i === digit ? base * 2.4 : base;
    });
    const sum = raw.reduce((a, b) => a + b, 0);
    return raw.map((v) => v / sum);
  }
  const peak = digitConfidence[digit] / 100;
  const rest = (1 - peak) / 9;
  return Array.from({ length: 10 }, (_, i) => (i === digit ? peak : rest));
}

const trainPhaseMeta: Record<TrainPhase, { label: string; caption: string; note: (guess: number, p: number) => React.ReactNode }> = {
  before: {
    label: "训练前",
    caption: "输出：10 类概率（训练前）",
    note: () => <>十类几乎均匀摊开，模型还什么都没学到。</>,
  },
  during: {
    label: "训练中",
    caption: "输出：10 类概率（训练中）",
    note: (guess, p) => (
      <>
        真数字 <strong>{guess}</strong> 开始抬起（约 {(p * 100).toFixed(0)}%），但还不够稳。
      </>
    ),
  },
  after: {
    label: "训练后",
    caption: "输出：10 类概率（训练后）",
    note: (guess, p) => (
      <>
        峰值落在 <strong>{guess}</strong>，置信度约 {(p * 100).toFixed(1)}% —— 票面可据此拼出金额数字。
      </>
    ),
  },
};

export function DigitsImageLab() {
  const [selected, setSelected] = useState(2); // 默认选本课金额里的「2」
  const [phase, setPhase] = useState<TrainPhase>("after");
  const sample = digitSamples[selected];
  const probs = useMemo(() => demoSoftmax(sample.digit, phase), [sample.digit, phase]);
  const guess = probs.indexOf(Math.max(...probs));
  const meta = trainPhaseMeta[phase];

  return (
    <div className="digits-lab interactive">
      <div className="interactive-head">
        <div>
          <span>核心互动 · 像素读成数字</span>
          <h3>点选 0—9：看清输入像素，再看输出概率怎样随训练变化</h3>
        </div>
        <button
          type="button"
          onClick={() => {
            setSelected(2);
            setPhase("after");
          }}
        >
          重置
        </button>
      </div>

      <div className="digit-controls" role="group" aria-label="选择数字 0 到 9">
        {digitSamples.map((item, index) => (
          <button
            key={item.digit}
            type="button"
            className={selected === index ? "active" : ""}
            aria-pressed={selected === index}
            onClick={() => setSelected(index)}
          >
            {item.digit}
          </button>
        ))}
      </div>

      <div className="digit-phase-tabs" role="tablist" aria-label="训练阶段">
        {(Object.keys(trainPhaseMeta) as TrainPhase[]).map((key) => (
          <button
            key={key}
            type="button"
            role="tab"
            aria-selected={phase === key}
            className={phase === key ? "active" : ""}
            onClick={() => setPhase(key)}
          >
            {trainPhaseMeta[key].label}
          </button>
        ))}
      </div>

      <div className="digit-strip" aria-hidden>
        {digitSamples.map((item, index) => (
          <button
            key={`thumb-${item.digit}`}
            type="button"
            className={selected === index ? "active" : ""}
            onClick={() => setSelected(index)}
            title={`数字 ${item.digit}`}
          >
            <div className="digit-mini-grid">
              {item.pixels.map((value, pi) => (
                <i key={pi} style={{ opacity: 0.1 + value / 17 }} />
              ))}
            </div>
            <span>{item.digit}</span>
          </button>
        ))}
      </div>

      <div className="digit-layout digit-layout-pair">
        <div>
          <span className="digit-caption">输入：{DIGIT_SIZE}×{DIGIT_SIZE} 亮度格子</span>
          <div
            className="digit-grid digit-grid-16"
            role="img"
            aria-label={`示意数字${sample.digit}的${DIGIT_SIZE}乘${DIGIT_SIZE}像素图`}
          >
            {sample.pixels.map((value, index) => (
              <i key={index} style={{ opacity: 0.08 + value / 17 }} />
            ))}
          </div>
          <small>人眼看出是「{sample.digit}」；计算机只收到这些亮度数字。</small>
        </div>

        <div className={`digit-probs phase-${phase}`}>
          <span className="digit-caption">{meta.caption}</span>
          <div className="digit-prob-bars" role="img" aria-label="数字0到9的示意概率">
            {probs.map((p, d) => (
              <div key={d} className={d === guess && phase !== "before" ? "top" : ""}>
                <b>{d}</b>
                <i style={{ width: `${Math.max(2, p * 100)}%` }} />
                <em>{(p * 100).toFixed(1)}%</em>
              </div>
            ))}
          </div>
          <p className="digit-prob-readout">{meta.note(guess, probs[guess])}</p>
        </div>
      </div>
      <p className="lab-disclaimer">
        示意笔画为课堂自构，用来体会「只看像素也能给出类别概率」；网络怎样一层层算，见下方结构图。
      </p>
    </div>
  );
}

export function LanguageTrainingShift() {
  const tokens = ["客户", "招待", "证据", "相互", "矛盾", "时", "转", "人工复核"];
  const [target, setTarget] = useState(5);
  return <div className="shift-lab interactive"><div className="interactive-head"><div><span>核心互动 · 训练答案从哪里来</span><h3>把同一句话错开一位，就得到下一个Token训练样本</h3></div><button onClick={() => setTarget(5)}>重置</button></div><div className="shift-row"><span>输入上下文</span><div>{tokens.map((token, index) => <button key={index} className={index < target ? "context" : "future"} disabled={index > 6} onClick={() => index >= 1 && index <= 6 && setTarget(index)}>{index < target ? token : "·"}</button>)}</div></div><div className="shift-row target"><span>正确答案</span><div>{tokens.map((token, index) => <b key={index} className={index === target ? "active" : ""}>{index === target ? token : "·"}</b>)}</div></div><div className="shift-result"><span>模型当前任务</span><strong>看到“{tokens.slice(0, target).join("")}”，预测下一个Token是“{tokens[target]}”</strong><p>真实文本自动提供答案；预测错误产生Loss，反向传播继续调整神经网络权重。</p></div></div>;
}

const attentionSets = {
  comparison: {
    label: "招待目的",
    focus: "是否像真实客户招待",
    tokens: [["周日", .54], ["客户招待", .72], ["儿童套餐", .91], ["生日蛋糕", 1]],
    conclusion: "模型判断业务目的时，会联系日期、申报说明和小票明细中的语义线索。",
  },
  policy: {
    label: "交叉印证",
    focus: "还需参考哪些上下文",
    tokens: [["CRM无拜访", 1], ["联系人休假", .78], ["家属生日", .91], ["转人工复核", .84]],
    conclusion: "Attention帮助模型联系多段上下文，但这些关联仍需回到原始系统核验。",
  },
} as const;

export function AttentionLab() {
  const [mode, setMode] = useState<keyof typeof attentionSets>("comparison");
  const item = attentionSets[mode];
  return <div className="attention-lab interactive"><div className="interactive-head"><div><span>核心互动 · Attention</span><h3>理解当前问题时，模型应该重点参考哪些Token？</h3></div><button onClick={() => setMode("comparison")}>重置</button></div><div className="attention-tabs"><button className={mode === "comparison" ? "active" : ""} onClick={() => setMode("comparison")}>步骤1 · 理解票据语义</button><button className={mode === "policy" ? "active" : ""} onClick={() => setMode("policy")}>步骤2 · 联系业务记录</button></div><div className="attention-focus"><span>当前要理解</span><strong>{item.focus}</strong></div><div className="attention-tokens">{item.tokens.map(([token, weight]) => <div key={token}><span style={{ opacity: .28 + weight * .72 }}>{token}</span><i style={{ width: `${weight * 100}%` }}/><small>关联程度 {(weight * 100).toFixed(0)}%</small></div>)}</div><p>{item.conclusion}</p></div>;
}

type AgentScenario = "mismatch" | "consistent" | "error";
const agentScenarios: Record<AgentScenario, { label: string; steps: Array<[string,string,string]> }> = {
  mismatch: { label: "证据矛盾", steps: [
    ["读取报销", "BX-42017：上海机场→苏州客户，出租车费468元", "金额不显眼，但目标要求核验真实行程。"],
    ["查询航班", "员工当天由北京飞抵南京", "落地城市与报销起点、目的地矛盾，继续查询住宿。"],
    ["查询酒店", "员工当晚入住南京酒店", "第二个独立来源继续指向南京，需要核实业务目的。"],
    ["查询CRM与日历", "无苏州拜访；日历为南京内部会议", "事实来源已经能够形成可复核的行程疑点。"],
    ["停止并升级", "形成“声称苏州 vs 证据南京”证据包", "提交审计人员复核，不自动认定违规。"],
  ]},
  consistent: { label: "行程一致", steps: [
    ["读取报销", "BX-42017：上海机场→苏州客户", "先查询实际航班。"],
    ["查询航班", "航班抵达上海，与报销起点一致", "核心行程证据一致，无需扩大查询范围。"],
    ["记录并停止", "保留航班来源与核验时间", "满足当前停止条件，减少不必要的系统访问。"],
  ]},
  error: { label: "工具失败", steps: [
    ["读取报销", "BX-42017：上海机场→苏州客户", "下一步需要查询实际航班。"],
    ["查询航班", "航班系统超时，未取得结果", "不能把“查不到”当作“行程一致”。"],
    ["受控停止", "保留失败原因并转人工", "不编造到达城市，也不静默放行。"],
  ]},
};

export function AgentBranchLab() {
  const [scenario, setScenario] = useState<AgentScenario>("mismatch");
  const [visible, setVisible] = useState(1);
  const current = agentScenarios[scenario];
  const select = (next: AgentScenario) => { setScenario(next); setVisible(1); };
  return <div className="agent-branch interactive"><div className="interactive-head"><div><span>核心互动 · 反馈分支</span><h3>下一步不是固定列表，而是由上一步结果决定</h3></div><button onClick={() => setVisible(1)}>重置</button></div><div className="scenario-tabs">{(Object.keys(agentScenarios) as AgentScenario[]).map((key) => <button key={key} className={scenario === key ? "active" : ""} onClick={() => select(key)}>{agentScenarios[key].label}</button>)}</div><div className="agent-state"><span>目标</span><strong>核验BX-42017声称的苏州客户行程</strong><p>工具预算：最多5次；默认只读；禁止自动定性；结论必须由人复核。</p></div><ol className="branch-trace">{current.steps.slice(0, visible).map((step, index) => <li key={`${scenario}-${index}`}><b>{String(index + 1).padStart(2,"0")}</b><div><span>行动：{step[0]}</span><strong>{step[1]}</strong><p>决策理由：{step[2]}</p></div></li>)}</ol><div className="branch-actions"><button disabled={visible >= current.steps.length} onClick={() => setVisible(Math.min(current.steps.length, visible + 1))}>执行下一步</button><button className="primary" onClick={() => setVisible(current.steps.length)}>运行到停止</button><p>{visible >= current.steps.length ? "当前状态：已按停止条件结束。" : `当前状态：已完成 ${visible}/${current.steps.length} 步，等待选择下一行动。`}</p></div></div>;
}

export function AuditAgentCanvas() {
  const [active, setActive] = useState(0);
  const items = [
    ["场景", "差旅报销初审", "选择高频、边界清楚且有人复核的窄任务。"],
    ["目标", "形成可复核疑点", "不允许自动认定违规、舞弊或错报。"],
    ["输入", "报销、发票、审批、行程、制度", "每项事实保留来源、时间和关联键。"],
    ["确定性规则", "重复、缺失、阈值", "明确条件优先交给普通代码。"],
    ["模型", "分类、图像、语言", "只在规则难以完整表达时使用。"],
    ["工具", "只读查询为默认", "写入、发送和扩大范围必须审批。"],
    ["状态", "证据、缺口、失败记录", "工具失败不能被隐藏或改写成结论。"],
    ["人工关口", "证据评价与重大定性", "关键判断始终由审计人员负责。"],
    ["评估", "召回、误报、追溯、稳定性", "同时衡量效率和职业判断风险。"],
    ["试点", "影子运行→小范围→扩大", "先比较人工结果，不直接接管流程。"],
  ];
  return <div className="agent-canvas"><div className="canvas-list">{items.map((item, index) => <button key={item[0]} className={active === index ? "active" : ""} onClick={() => setActive(index)}><b>{String(index + 1).padStart(2,"0")}</b><span>{item[0]}</span></button>)}</div><section><span>审计智能体设计画布 {active + 1}/10</span><h3>{items[active][0]}</h3><strong>{items[active][1]}</strong><p>{items[active][2]}</p><button onClick={() => setActive((active + 1) % items.length)}>{active === items.length - 1 ? "重新查看" : "下一项 →"}</button></section></div>;
}
