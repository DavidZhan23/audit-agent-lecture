"use client";

import { useEffect, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { TransformerVisualJourney } from "./transformer-visual-journey";
import {
  AutoregressiveGenerationDemo,
  LecturerGenerationNotes,
  LLMArchitectureOverview,
} from "./llm-generation-lesson";

const exampleTokens = ["审计人员", "发现", "这份", "合同", "存在", "异常", "，", "因此", "决定", "进一步", "核查", "。"];

const journeySteps = [
  ["5.1", "同一套学习机制", "大语言模型仍然是神经网络"],
  ["5.2", "文字变成数字", "Token + Embedding"],
  ["5.3", "联系上下文", "Transformer + Attention"],
  ["5.4", "海量文本预训练", "反复预测下一个 Token"],
  ["5.5", "工程师怎样调用", "模型 → 调用接口 → 产品 → 智能体"],
];

function SectionLead({ no, eyebrow, title, children }: { no: string; eyebrow: string; title: string; children: ReactNode }) {
  return (
    <header className="ann-llm-section-lead">
      <div><span>{no}</span><small>{eyebrow}</small></div>
      <div><h3>{title}</h3><p>{children}</p></div>
    </header>
  );
}

function MemoryLine({ children }: { children: ReactNode }) {
  return <p className="ann-llm-memory"><span>一句话记住</span><strong>{children}</strong></p>;
}

function AnnContinuityBoard() {
  const loop = ["输入样本", "作出预测", "计算误差", "调整权重"];
  const changes = [
    ["输入", "像素 / 表格", "Token 向量"],
    ["结构", "普通网络 / 卷积神经网络", "Transformer"],
    ["训练任务", "分类或数值预测", "预测下一个 Token"],
    ["规模", "一个专用任务", "海量文本 + 模型 + 计算"],
  ];
  return (
    <div className="ann-continuity-board">
      <div className="ann-loop-card">
        <span>上一章已经掌握</span>
        <h4>神经网络怎样学习</h4>
        <div>{loop.map((item, index) => <span key={item}>{item}{index < loop.length - 1 && <i>→</i>}</span>)}</div>
      </div>
      <i className="ann-expands">扩展为</i>
      <div className="ann-change-grid">
        {changes.map(([name, before, after]) => (
          <article key={name}>
            <span>{name}</span>
            <div className="ann-change-flow">
              <small>{before}</small>
              <i aria-hidden="true">→</i>
              <strong>{after}</strong>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}

function LanguageEncodingLab() {
  const [stage, setStage] = useState(0);
  const [showArchitecture, setShowArchitecture] = useState(false);
  const stages = ["原始句子", "Token 序列", "Embedding 向量", "进入神经网络"];
  const vectors: Record<string, string> = {
    "审计人员": "[0.62, −0.18, 0.41, …]",
    "合同": "[0.71, 0.26, −0.33, …]",
    "异常": "[−0.44, 0.83, 0.29, …]",
    "核查": "[0.56, 0.74, −0.12, …]",
  };

  useEffect(() => {
    if (!showArchitecture) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setShowArchitecture(false);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKey);
    };
  }, [showArchitecture]);

  const architectureModal = showArchitecture
    ? createPortal(
      <div className="transformer-arch-modal" role="presentation" onClick={() => setShowArchitecture(false)}>
        <div className="transformer-arch-dialog" role="dialog" aria-modal="true" aria-labelledby="transformer-arch-title" onClick={(event) => event.stopPropagation()}>
          <header>
            <div>
              <span>论文原图 · 2017</span>
              <h4 id="transformer-arch-title">Transformer 编码器—解码器架构</h4>
            </div>
            <button type="button" onClick={() => setShowArchitecture(false)}>关闭</button>
          </header>
          <div className="transformer-arch-dialog-body">
            {/* Locally cached scholarly figure; keep unmodified. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/images/transformer-encoder-decoder-architecture.png"
              alt="Attention Is All You Need 论文中的 Transformer 编码器—解码器完整架构图"
            />
          </div>
          <p className="transformer-arch-caption">
            图源：Vaswani 等，
            <a href="https://arxiv.org/abs/1706.03762" target="_blank" rel="noreferrer">《Attention Is All You Need》</a>
            （2017），经
            <a href="https://commons.wikimedia.org/wiki/File:Attention_Is_All_You_Need_-_Encoder-decoder_Architecture.png" target="_blank" rel="noreferrer"> Wikimedia Commons</a>
            提供；原图未修改，许可为
            <a href="https://creativecommons.org/licenses/by-sa/4.0/" target="_blank" rel="noreferrer"> CC BY-SA 4.0</a>。
          </p>
        </div>
      </div>,
      document.body,
    )
    : null;

  return (
    <div className="language-encoding-lab">
      <div className="ann-llm-lab-head">
        <div><span>逐步互动</span><h4>文字究竟怎样进入神经网络？</h4></div>
        <button type="button" onClick={() => setStage((stage + 1) % stages.length)}>下一步 →</button>
      </div>
      <div className="encoding-tabs" role="tablist" aria-label="文字数字化步骤">
        {stages.map((item, index) => <button type="button" role="tab" aria-selected={stage === index} className={stage === index ? "active" : ""} key={item} onClick={() => setStage(index)}><b>0{index + 1}</b><span>{item}</span></button>)}
      </div>
      <div className="encoding-stage" aria-live="polite">
        {stage === 0 && <div className="raw-language"><span>人读到的文字</span><p>“审计人员发现这份合同存在异常，因此决定进一步核查。”</p><small>整句话不能原样放进神经元做加权计算。</small></div>}
        {stage === 1 && <div className="token-sequence"><span>模型处理的基本单位</span><div>{exampleTokens.map((token, index) => <b key={`${token}-${index}`}>{token}</b>)}</div><small>Token 可以是字、词或子词；此处只展示概念，不展开分词算法。</small></div>}
        {stage === 2 && <div className="embedding-stage"><div className="embedding-list">{Object.entries(vectors).map(([token, vector]) => <div key={token}><b>{token}</b><code>{vector}</code></div>)}</div><aside><span>不是普通编号</span><strong>向量携带可学习的语义关系</strong><p>训练后，“合同”通常更靠近“协议”，“核查”更靠近“检查”，而不是只得到 17、42 这样的<strong className="key-term">流水号</strong>。</p></aside></div>}
        {stage === 3 && (
          <div className="network-entry">
            <div>{exampleTokens.slice(0, 6).map((token, index) => <span key={token}><b>{token}</b><small>{index === 0 ? "[0.62, …]" : index === 3 ? "[0.71, …]" : "[…, …]"}</small></span>)}</div>
            <i>→</i>
            <button type="button" className="transformer-entry-trigger" aria-haspopup="dialog" aria-expanded={showArchitecture} onClick={() => setShowArchitecture(true)}>
              <strong>Transformer 神经网络</strong>
              <small>点击查看论文架构图</small>
            </button>
            <p>模型实际接收和计算的是<strong className="key-term">向量序列</strong>，不是屏幕上的汉字。</p>
          </div>
        )}
      </div>
      {architectureModal}
    </div>
  );
}

const trainStates = [
  { round: "刚开始", loss: "2.86", probs: [22, 20, 18, 16], note: "权重接近随机，几个候选差不多。" },
  { round: "重复许多批次", loss: "1.74", probs: [42, 21, 19, 10], note: "“核查”在相似上下文中逐渐得到更高概率。" },
  { round: "持续扩大训练", loss: "0.82", probs: [68, 14, 10, 5], note: "模型同时学习词义、语法、文本结构和上下文模式。" },
  { round: "形成基础模型", loss: "0.36", probs: [82, 8, 6, 2], note: "同一套预训练带来续写、总结、翻译和问答等广泛能力。" },
];

function PretrainingLoopLab() {
  const [state, setState] = useState(0);
  const current = trainStates[state];
  const candidates = ["核查", "调查", "分析", "处理"];
  return (
    <div className="pretraining-loop-lab">
      <div className="ann-llm-lab-head">
        <div><span>训练互动</span><h4>同一件事，在海量文本上反复做</h4></div>
        <div><button type="button" onClick={() => setState(0)}>重置</button><button type="button" className="primary" onClick={() => setState(Math.min(trainStates.length - 1, state + 1))} disabled={state === trainStates.length - 1}>训练一轮 →</button></div>
      </div>
      <div className="prediction-prompt"><span>输入一段 Token</span><p>审计人员发现这份合同存在异常，因此决定进一步 <b>＿＿</b></p></div>
      <div className="training-live">
        <div><span>候选下一个 Token</span>{candidates.map((token, index) => <div key={token}><b>{token}</b><i><span style={{ width: `${current.probs[index]}%` }} /></i><small>{current.probs[index]}%</small></div>)}</div>
        <aside><span>{current.round}</span><strong>Loss {current.loss}</strong><p>{current.note}</p><small>与真实 Token 比较 → 计算误差 → 反向传播 → 调整大量权重</small></aside>
      </div>
      <div className="ann-llm-training-compare">
        <article><span>普通神经网络</span><code>输入样本 → 预测 → 误差 → 调权重</code></article>
        <i>= 同一机制，扩大对象与规模 ⇒</i>
        <article><span>大语言模型</span><code>Token 上文 → 预测下一个 Token → 误差 → 调整大量权重 → 海量重复</code></article>
      </div>
      <div className="scale-balance"><span><b>数据规模</b><small>覆盖大量语言与知识模式</small></span><span><b>模型规模</b><small>容纳更丰富的表示</small></span><span><b>计算规模</b><small>完成长期反复训练</small></span></div>
    </div>
  );
}

function EngineeringCallLab() {
  return (
    <>
      <LLMArchitectureOverview />

      <AutoregressiveGenerationDemo />
      <LecturerGenerationNotes />
    </>
  );
}

function AgentTransitionBoard() {
  return (
    <div className="agent-transition-board">
      <div className="agent-transition-question"><span>留给下一章的问题</span><h4>如果任务不是回答一句话，而是让模型自己判断下一步做什么，会发生什么？</h4></div>
      <div className="call-vs-agent-loop">
        <article><span>普通模型调用</span><code>输入 → 大语言模型 → 输出</code><p>生成<strong className="key-term">一次回答</strong>，流程到此结束。</p></article>
        <i>→ 关键变化 →</i>
        <article><span>智能体运行机制</span><code>目标 → 大语言模型判断 → 工具执行 → 观察结果 ↺</code><p>根据结果<strong className="key-term">继续决策、调用工具</strong>，直到完成或<strong className="key-term">受控停止</strong>。</p></article>
      </div>
      <p>大语言模型是整个人工智能应用中的<strong className="key-term">核心能力模块</strong>，更接近智能体的“大脑”。聊天产品用提示词、会话、知识、界面和安全机制让它变得可用；当系统进一步加入<strong className="key-term">受控工具、记忆和持续执行循环</strong>时，它才开始成为能够围绕目标采取行动的智能体核心。</p>
    </div>
  );
}

export function AnnToLlmJourney() {
  return (
    <div className="ann-to-llm-journey">
      <div className="ann-llm-driving-question">
        <span>本章问题</span>
        <h3>普通神经网络已经可以通过训练学习规律，那么它还需要哪些关键变化，才能成为大语言模型？</h3>
      </div>

      <nav className="ann-llm-route" aria-label="从神经网络到大语言模型的五步路线">
        {journeySteps.map(([no, title, detail], index) => <div key={no}><b>{no}</b><strong>{title}</strong><small>{detail}</small>{index < journeySteps.length - 1 && <i>→</i>}</div>)}
      </nav>

      <section className="ann-llm-section">
        <SectionLead no="5.1" eyebrow="大语言模型和神经网络的关系" title="大语言模型并不是另一种完全不同的人工智能">上一部分中，神经网络通过作出预测、计算误差并调整权重来学习。大语言模型没有抛弃这套机制；变化的是数据、结构、训练任务与规模。</SectionLead>
        <AnnContinuityBoard />
        <MemoryLine>大语言模型不是取代了神经网络，而是把神经网络用于理解和生成语言，并将它推向更大的规模。</MemoryLine>
      </section>

      <section className="ann-llm-section">
        <SectionLead no="5.2" eyebrow="第一个变化 · 输入" title="先让文字变成神经网络可以处理的数字">神经网络只能计算数字。语言必须先被拆成 Token，再把每个 Token 转换成包含可学习语义关系的 Embedding 向量。</SectionLead>
        <LanguageEncodingLab />
        <MemoryLine>文字没有直接进入模型；模型实际接收和计算的是由文字转换而来的数字向量。</MemoryLine>
      </section>

      <section className="ann-llm-section">
        <SectionLead no="5.3" eyebrow="第二个变化 · 结构" title="Transformer 让模型结合上下文处理语言">上一章的专用网络不擅长直接处理长句中的复杂关系；而一个词的含义又会随上下文变化。Self-Attention 让每个 Token 动态参考句中其他相关 Token，形成当前语境下的表示。</SectionLead>
        <TransformerVisualJourney />
      </section>

      <section className="ann-llm-section">
        <SectionLead no="5.4" eyebrow="第三个变化 · 训练" title="从完成一个任务，变成在海量文本中学习语言">大语言模型把大量文本统一成一个简单训练任务：根据前面的 Token，预测接下来最可能出现的 Token。</SectionLead>
        <PretrainingLoopLab />
        <div className="pretraining-capabilities"><span>同一套大规模预训练</span><i>→</i>{["翻译", "总结", "问答", "写作"].map(item => <b key={item}>{item}</b>)}</div>
        <MemoryLine>大语言模型的基础训练并不神秘：仍然是在预测、纠错和调整权重，只是训练材料变成海量语言，数据、模型与计算规模共同增长。</MemoryLine>
      </section>

      <section className="ann-llm-section">
        <SectionLead no="5.5" eyebrow="工程师的真实使用方式" title="工程师实际上怎样调用大语言模型？">预训练之后，模型已经能根据上下文生成文字。但普通用户看到的聊天网页并不是模型本身；工程师会通过推理服务的调用接口发送上下文，再由应用把模型能力组织成可用产品。</SectionLead>
        <EngineeringCallLab />
        <AgentTransitionBoard />
      </section>
    </div>
  );
}
