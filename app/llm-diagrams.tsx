"use client";

import { useState } from "react";

const ink = "#24302c";
const muted = "#5f6d68";
const accent = "#1f5c4d";
const accentSoft = "#e8f0ed";
const warm = "#9a623c";
const warmSoft = "#f4ece5";
const blue = "#1d4f91";
const blueSoft = "#e8eef6";
const line = "#d8ddda";

/** ANN 能认出字，却串不起多段业务语境 */
export function AnnToLlmGapDiagram() {
  return (
    <div className="llm-diagram">
      <div className="llm-diagram-head">
        <span>图示 01 · 为什么还要再走一步</span>
        <h4>ANN 解决「看见」，LLM 接手「读懂并对照」</h4>
      </div>
      <svg viewBox="0 0 920 280" role="img" aria-label="从 ANN 到 LLM 的能力缺口">
        <rect x="20" y="36" width="280" height="200" rx="12" fill="#fff" stroke={line} />
        <text x="40" y="68" fill={accent} fontSize="13" fontWeight="700">ANN 已经能做</text>
        <text x="40" y="100" fill={ink} fontSize="15" fontFamily="Georgia, serif">小票像素 →「儿童套餐」</text>
        <text x="40" y="128" fill={ink} fontSize="15" fontFamily="Georgia, serif">说明字段 → 一串字符</text>
        <text x="40" y="156" fill={ink} fontSize="15" fontFamily="Georgia, serif">CRM 截图 → 「无拜访」字样</text>
        <text x="40" y="198" fill={muted} fontSize="12">输出：局部识别结果</text>
        <text x="40" y="218" fill={muted} fontSize="12">不问：合起来像不像客户招待</text>

        <path d="M320 136 H390" stroke={ink} strokeWidth="2" markerEnd="url(#gap-arrow)" />
        <defs>
          <marker id="gap-arrow" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto">
            <path d="M0,0 L8,4 L0,8 Z" fill={ink} />
          </marker>
        </defs>

        <rect x="410" y="36" width="220" height="200" rx="12" fill={warmSoft} stroke="#e0c9b4" />
        <text x="430" y="68" fill={warm} fontSize="13" fontWeight="700">缺口</text>
        <text x="430" y="108" fill={ink} fontSize="14" fontFamily="Georgia, serif">多段文字要互相</text>
        <text x="430" y="132" fill={ink} fontSize="14" fontFamily="Georgia, serif">参照、对照、质疑</text>
        <text x="430" y="168" fill={muted} fontSize="12">制度例外、语气、隐含关系</text>
        <text x="430" y="192" fill={muted} fontSize="12">长度可变、结构不规整</text>
        <text x="430" y="216" fill={muted} fontSize="12">不是固定维数的像素表</text>

        <path d="M650 136 H720" stroke={ink} strokeWidth="2" markerEnd="url(#gap-arrow)" />

        <rect x="740" y="36" width="160" height="200" rx="12" fill={accentSoft} stroke="#b7cfc6" />
        <text x="760" y="68" fill={accent} fontSize="13" fontWeight="700">LLM 接手</text>
        <text x="760" y="112" fill={ink} fontSize="14" fontFamily="Georgia, serif">把说明、小票、</text>
        <text x="760" y="136" fill={ink} fontSize="14" fontFamily="Georgia, serif">CRM、日历当作</text>
        <text x="760" y="160" fill={ink} fontSize="14" fontFamily="Georgia, serif">同一段上下文</text>
        <text x="760" y="200" fill={muted} fontSize="12">生成解释与疑点</text>
        <text x="760" y="220" fill={muted} fontSize="12">（仍不是定论）</text>
      </svg>
    </div>
  );
}

/** 连续关系：对象变了，训练逻辑没变 */
export function ContinuityLadderDiagram() {
  const rows = [
    { stage: "经典 ML", sees: "人工表格特征", train: "拟合标签", out: "异常概率" },
    { stage: "ANN / CNN", sees: "像素等高维输入", train: "拟合标签", out: "数字 / 类别" },
    { stage: "LLM", sees: "Token 序列", train: "拟合「下一个」", out: "文字 / 解释" },
  ];
  return (
    <div className="llm-diagram">
      <div className="llm-diagram-head">
        <span>图示 02 · 连续关系</span>
        <h4>LLM 不是外星人：仍是「参数化函数 + 损失训练」</h4>
      </div>
      <div className="continuity-table">
        <div className="continuity-row head">
          <span>阶段</span>
          <span>看什么</span>
          <span>训练在干什么</span>
          <span>输出</span>
        </div>
        {rows.map((row) => (
          <div className="continuity-row" key={row.stage}>
            <strong>{row.stage}</strong>
            <span>{row.sees}</span>
            <span>{row.train}</span>
            <span>{row.out}</span>
          </div>
        ))}
      </div>
      <p className="llm-diagram-note">
        真正变的是：输入从「一张固定大小的表/图」变成「可长可短的语言序列」；目标从「分到少数类别」变成「在巨大词表上预测下一个 Token」。
      </p>
    </div>
  );
}

/** 分词示意 */
export function TokenizeDiagram() {
  const pieces = [
    { t: "周日", tip: "日期词" },
    { t: "接待", tip: "动作" },
    { t: "重要", tip: "修饰" },
    { t: "客户", tip: "对象" },
    { t: "，", tip: "标点也是 Token" },
    { t: "儿童", tip: "…" },
    { t: "套餐", tip: "…" },
  ];
  return (
    <div className="llm-diagram">
      <div className="llm-diagram-head">
        <span>图示 03 · Tokenization</span>
        <h4>模型不读「整句中文」，先切成 Token，再变成向量</h4>
      </div>
      <div className="tokenize-flow">
        <div className="tokenize-raw">
          <span>原文</span>
          <strong>周日接待重要客户，儿童套餐……</strong>
        </div>
        <i>→ 切分 →</i>
        <div className="tokenize-chips">
          {pieces.map((p) => (
            <div key={p.t}>
              <b>{p.t}</b>
              <small>{p.tip}</small>
            </div>
          ))}
        </div>
        <i>→ 查表 →</i>
        <div className="tokenize-vec">
          <span>Embedding</span>
          <strong>每个 Token → 一串数字</strong>
          <p>相近语义的向量在空间中更靠近；位置编码再告诉模型「谁先谁后」。</p>
        </div>
      </div>
      <p className="llm-diagram-note">
        词表往往有数万到十余万项。英文常按子词切（BPE 等）；中文也可能是字、词或子词混合。课堂只需记住：<b>离散符号 → 连续向量</b>，后面全是神经网络运算。
      </p>
    </div>
  );
}

/** 生成 = 反复下一个 Token */
export function GenerationLoopDiagram() {
  const steps = [
    { n: "1", ctx: "周日接待", pick: "重要", probs: "客户 18% · 重要 41% · 领导 9%" },
    { n: "2", ctx: "周日接待重要", pick: "客户", probs: "客户 62% · 嘉宾 11% · …" },
    { n: "3", ctx: "……儿童套餐", pick: "生日", probs: "生日 48% · 薯条 7% · …" },
    { n: "4", ctx: "……矛盾时", pick: "转", probs: "转 55% · 应 12% · …" },
  ];
  return (
    <div className="llm-diagram">
      <div className="llm-diagram-head">
        <span>图示 04 · 生成循环</span>
        <h4>聊天、写摘要、写疑点说明：本质都是「写一个，再写一个」</h4>
      </div>
      <div className="gen-loop-grid">
        {steps.map((s) => (
          <article key={s.n}>
            <span>第 {s.n} 步</span>
            <p>已有上下文</p>
            <code>{s.ctx}</code>
            <p>候选概率（示意）</p>
            <small>{s.probs}</small>
            <strong>选出 →「{s.pick}」</strong>
          </article>
        ))}
      </div>
      <p className="llm-diagram-note">
        每一步在整个词表上做 Softmax。温度、Top-p 等采样策略只是「怎么从概率里挑」，不改变「预测下一个」这一核心任务。
      </p>
    </div>
  );
}

/** 为什么「预测下一个」能学出那么多能力 */
export function WhyNextTokenDiagram() {
  const cards = [
    {
      title: "要预测对，必须学语法",
      body: "「的 / 地 / 得」、主谓搭配、制度公文常见句式——错了就升高 Loss。",
    },
    {
      title: "要预测对，必须学世界里的共现",
      body: "「发票」后常接「号码 / 金额」；「CRM」后常接「拜访 / 商机」。这不是数据库查询，是统计规律。",
    },
    {
      title: "要预测对，必须学长程依赖",
      body: "前面写了「客户招待」，后面出现「儿童餐」时，模型应感到不协调——这正是 Attention 要帮忙的地方。",
    },
    {
      title: "规模放大后，能力「看起来像推理」",
      body: "海量文本 + 深层网络，使连续预测表现为总结、对比、按指令作答；但机制仍是下一 Token。",
    },
  ];
  return (
    <div className="llm-diagram">
      <div className="llm-diagram-head">
        <span>图示 05 · 训练目标为何够用</span>
        <h4>「只会猜下一个词」为什么能做那么多事？</h4>
      </div>
      <div className="why-grid">
        {cards.map((c) => (
          <article key={c.title}>
            <strong>{c.title}</strong>
            <p>{c.body}</p>
          </article>
        ))}
      </div>
    </div>
  );
}

/** Attention 热力图示意 */
export function AttentionHeatmapDiagram() {
  const tokens = ["周日", "客户招待", "儿童套餐", "生日蛋糕", "CRM无拜访", "家属生日"];
  // 当前查询：「是否真实招待」——对后几项更敏感
  const weights = [0.08, 0.14, 0.22, 0.24, 0.18, 0.14];
  return (
    <div className="llm-diagram">
      <div className="llm-diagram-head">
        <span>图示 06 · Attention（示意）</span>
        <h4>当前要回答的问题，对上下文里每个 Token「看」得有多重</h4>
      </div>
      <div className="attn-heat">
        <div className="attn-heat-query">
          <span>Query（当前关注）</span>
          <strong>这笔报销是否像真实客户招待？</strong>
        </div>
        <div className="attn-heat-bars">
          {tokens.map((token, i) => (
            <div key={token}>
              <b style={{ opacity: 0.35 + weights[i] * 2.5 }}>{token}</b>
              <i style={{ width: `${weights[i] * 100}%` }} />
              <small>{(weights[i] * 100).toFixed(0)}%</small>
            </div>
          ))}
        </div>
      </div>
      <p className="llm-diagram-note">
        教学版说法：每个位置生成 <b>Query</b>，上下文位置提供 <b>Key / Value</b>；相似度高的位置权重大，信息被多「抄」一点过来。
        真实模型有多头、多层；课堂只抓「不是平均读，而是有重点地读」。
      </p>
    </div>
  );
}

/** Transformer 堆叠 */
export function TransformerStackDiagram() {
  return (
    <div className="llm-diagram">
      <div className="llm-diagram-head">
        <span>图示 07 · Transformer 块</span>
        <h4>一层「看全局」+「再变换」；堆很多层就成为大模型骨干</h4>
      </div>
      <svg viewBox="0 0 920 300" role="img" aria-label="Transformer 层结构示意">
        <rect x="40" y="40" width="140" height="220" rx="10" fill={blueSoft} stroke="#b8c8dc" />
        <text x="58" y="78" fill={blue} fontSize="13" fontWeight="700">输入</text>
        <text x="58" y="110" fill={ink} fontSize="13">Token 向量</text>
        <text x="58" y="134" fill={ink} fontSize="13">+ 位置编码</text>
        <text x="58" y="180" fill={muted} fontSize="11">长度 = 上下文</text>
        <text x="58" y="200" fill={muted} fontSize="11">窗口内的序列</text>

        <path d="M200 150 H250" stroke={ink} strokeWidth="2" />

        {[0, 1, 2].map((i) => {
          const x = 260 + i * 150;
          return (
            <g key={i}>
              <rect x={x} y="40" width="130" height="220" rx="10" fill="#fff" stroke={line} />
              <text x={x + 18} y="72" fill={accent} fontSize="12" fontWeight="700">
                Block {i + 1}{i === 2 ? " … N" : ""}
              </text>
              <rect x={x + 14} y="90" width="102" height="48" rx="6" fill={accentSoft} />
              <text x={x + 28} y="120" fill={ink} fontSize="12">
                Self-Attention
              </text>
              <rect x={x + 14} y="156" width="102" height="48" rx="6" fill={warmSoft} />
              <text x={x + 36} y="186" fill={ink} fontSize="12">
                FFN 前馈
              </text>
              <text x={x + 22} y="230" fill={muted} fontSize="10">
                + 残差 / 归一化
              </text>
            </g>
          );
        })}

        <path d="M710 150 H760" stroke={ink} strokeWidth="2" />

        <rect x="760" y="40" width="140" height="220" rx="10" fill={accentSoft} stroke="#b7cfc6" />
        <text x="778" y="78" fill={accent} fontSize="13" fontWeight="700">输出头</text>
        <text x="778" y="118" fill={ink} fontSize="13">线性层</text>
        <text x="778" y="142" fill={ink} fontSize="13">→ 词表 logits</text>
        <text x="778" y="178" fill={ink} fontSize="13">Softmax</text>
        <text x="778" y="210" fill={muted} fontSize="11">下一个 Token</text>
        <text x="778" y="230" fill={muted} fontSize="11">的概率分布</text>
      </svg>
      <p className="llm-diagram-note">
        「大」主要来自：层数 N、隐藏维度、词表、训练数据与算力。架构家族仍是这张图的反复堆叠（及若干工程变体）。
      </p>
    </div>
  );
}

/** 三阶段生命周期 */
export function LlmLifecycleDiagram() {
  const [stage, setStage] = useState(0);
  const stages = [
    {
      title: "预训练 Pre-training",
      body: "在海量公开/授权文本上，反复做下一 Token 预测。得到「通用语言与知识表达」的底座权重。成本高、周期长，通常由模型厂商完成。",
      tag: "学世界怎么说话",
    },
    {
      title: "指令微调与对齐",
      body: "用「指令—回答」数据、偏好数据等，让模型更听话、更安全、输出格式更稳。审计场景里常见的「按要点列疑点」习惯，多在这一阶段强化。",
      tag: "学怎么按人的要求说",
    },
    {
      title: "推理 Inference（你每天在用的）",
      body: "权重基本固定。你把提示词 + 当前资料塞进上下文，模型逐 Token 生成。课堂演示、业务试用，绝大多数时间都在这一阶段。",
      tag: "用已学好的参数生成",
    },
  ];
  return (
    <div className="llm-diagram">
      <div className="llm-diagram-head">
        <span>图示 08 · 生命周期</span>
        <h4>训练很贵；你平时点的「发送」，几乎都是推理</h4>
      </div>
      <div className="lifecycle-tabs">
        {stages.map((s, i) => (
          <button key={s.title} type="button" className={stage === i ? "active" : ""} onClick={() => setStage(i)}>
            <span>0{i + 1}</span>
            <strong>{s.title}</strong>
          </button>
        ))}
      </div>
      <div className="lifecycle-panel">
        <em>{stages[stage].tag}</em>
        <p>{stages[stage].body}</p>
      </div>
    </div>
  );
}

/** 上下文窗口里有什么 */
export function ContextWindowDiagram() {
  const slots = [
    { name: "系统提示", desc: "角色、禁止事项、输出格式", tone: "sys" },
    { name: "制度摘录", desc: "招待费规定、例外条款", tone: "doc" },
    { name: "本案材料", desc: "说明 / OCR / CRM / 日历", tone: "case" },
    { name: "对话历史", desc: "已问已答（若多轮）", tone: "chat" },
    { name: "正在生成", desc: "模型一个 Token 一个 Token 往外写", tone: "out" },
  ];
  return (
    <div className="llm-diagram">
      <div className="llm-diagram-head">
        <span>图示 09 · 上下文窗口</span>
        <h4>模型「知道」的，原则上只等于你放进窗口里的</h4>
      </div>
      <div className="context-window">
        {slots.map((s) => (
          <div key={s.name} className={`ctx-slot ${s.tone}`}>
            <strong>{s.name}</strong>
            <p>{s.desc}</p>
          </div>
        ))}
      </div>
      <p className="llm-diagram-note">
        窗口有长度上限。超长制度与底稿需要摘要、分段或 RAG 检索后再塞入。
        <b>没写进窗口的 CRM 记录，模型不会「偷偷连库」看到。</b>
      </p>
    </div>
  );
}

/** 能力涌现 vs 边界 */
export function CapabilityBoundaryStrip() {
  return (
    <div className="llm-diagram">
      <div className="llm-diagram-head">
        <span>图示 10 · 能做什么 / 不能当什么</span>
        <h4>同一套下一 Token 机器：表现很强，职责边界很硬</h4>
      </div>
      <div className="cap-strip">
        <div>
          <span>擅长</span>
          <ul>
            <li>归纳多段文字矛盾</li>
            <li>按制度语言起草疑点说明</li>
            <li>把非结构化材料整理成核对清单</li>
            <li>在给定资料内做对比与改写</li>
          </ul>
        </div>
        <div>
          <span>不擅长 / 不能替代</span>
          <ul>
            <li>保证事实正确（会幻觉）</li>
            <li>自动进入企业系统取数</li>
            <li>替代审计职业判断与定性</li>
            <li>在资料缺失时「诚实沉默」——它仍可能写得流畅</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

/** 从 ANN 像素头到 LLM 语言头的并排对比 */
export function AnnLlmSideBySide() {
  return (
    <div className="llm-diagram">
      <div className="llm-diagram-head">
        <span>图示 11 · 结构对照</span>
        <h4>上一章的 Softmax 头，换成「词表那么大」的 Softmax 头</h4>
      </div>
      <div className="side-by-side">
        <article>
          <span>ANN 数字识别</span>
          <code>256 → 隐藏层×L → Softmax(10)</code>
          <p>10 个类别：数字 0—9。一张图一个答案。</p>
        </article>
        <article>
          <span>LLM 语言建模</span>
          <code>Token 序列 → Transformer×N → Softmax(|V|)</code>
          <p>|V| 可达数万级。每一步在整个词表上选一个，再进入下一步。</p>
        </article>
      </div>
    </div>
  );
}
