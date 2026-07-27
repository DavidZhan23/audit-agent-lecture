"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

type ArchitectureStep = {
  title: string;
  short: string;
  detail: string;
  core?: boolean;
};

const architectureSteps: readonly ArchitectureStep[] = [
  { title: "用户对话", short: "页面中的提问与历史", detail: "应用收集当前问题、对话历史和需要提供的材料。" },
  { title: "对话模板", short: "Chat Template", detail: "把 system、user、assistant 等角色内容与特殊标记组织成统一序列。" },
  { title: "Tokenizer", short: "切分与查词表", detail: "按该模型的词表和切分规则，把文字转成 Token。" },
  { title: "Token ID", short: "[421, 98, 735, …]", detail: "每个 Token 用词表中的数字编号表示，神经网络不直接计算网页上的汉字。" },
  { title: "Embedding 与位置信息", short: "ID → 向量 + 顺序", detail: "Embedding 把 Token ID 映射为可学习向量，位置信息让模型区分先后顺序。" },
  { title: "多层 Transformer Block", short: "Transformer Block × N", detail: "多个 Decoder-only Block 反复堆叠，逐层汇集并加工已有上下文信息。", core: true },
  { title: "语言模型输出层", short: "LM Head", detail: "把最后一个位置的隐藏表示映射为整个词表的候选分数。" },
  { title: "下一 Token 概率", short: "该 42% · 根据 25% · …", detail: "模型本轮的主要输出是下一个 Token 的候选概率分布，还不是完整回答。" },
];

export function LLMArchitectureOverview() {
  const [currentStep, setCurrentStep] = useState(0);
  const active = currentStep === 0 ? null : architectureSteps[currentStep - 1];

  return (
    <section className="llm-architecture-overview" aria-labelledby="llm-architecture-title">
      <header className="generation-module-head">
        <div><span>5.5 内部补充 · 整体结构</span><h4 id="llm-architecture-title">一个使用 Transformer 的对话式大语言模型，整体是什么样子？</h4><p>从用户输入到下一 Token 概率，需要经过一条完整的数据处理链路。</p></div>
        <strong>当前步骤：{String(currentStep).padStart(2, "0")} / 08</strong>
      </header>

      <div className="architecture-step-flow" aria-label="对话式大语言模型整体结构">
        {architectureSteps.map((step, index) => {
          const position = index + 1;
          const state = currentStep === 0 ? "outline" : position === currentStep ? "current" : position < currentStep ? "complete" : "future";
          return (
            <div className="architecture-step-wrap" key={step.title}>
              <button type="button" className={`architecture-step ${state}${step.core ? " core" : ""}`} onClick={() => setCurrentStep(position)} aria-current={state === "current" ? "step" : undefined} aria-label={`第${position}步：${step.title}`}>
                <b>{String(position).padStart(2, "0")}</b><span>{step.title}</span><small>{step.short}</small>
                {step.core && <span className="transformer-block-stack" aria-label="Transformer Block中的两个核心部分"><i><em>Masked Self-Attention</em><small>从已有上下文中寻找相关信息</small></i><i><em>Feed Forward Network</em><small>进一步加工和转换</small></i></span>}
              </button>
              {index < architectureSteps.length - 1 && <i className="architecture-arrow" aria-hidden="true">→</i>}
            </div>
          );
        })}
      </div>

      {active && (
        <div className="architecture-step-explanation" aria-live="polite">
          <span>正在讲解 · {String(currentStep).padStart(2, "0")}</span>
          <strong>{active.title}</strong>
          <p>{active.detail}</p>
        </div>
      )}

      <div className="generation-controls">
        <button type="button" onClick={() => setCurrentStep(Math.max(0, currentStep - 1))} disabled={currentStep === 0}>上一步</button>
        <button type="button" className="primary" onClick={() => setCurrentStep(Math.min(architectureSteps.length, currentStep + 1))} disabled={currentStep === architectureSteps.length}>下一步</button>
        <button type="button" onClick={() => setCurrentStep(0)}>重新演示</button>
      </div>
    </section>
  );
}

type Candidate = { token: string; probability: number };
type GenerationStep = { selectedToken: string; candidates: Candidate[]; stop?: boolean };

const generationSteps: GenerationStep[] = [
  { selectedToken: "该", candidates: [{ token: "该", probability: 42 }, { token: "根据", probability: 25 }, { token: "当前", probability: 18 }, { token: "这份", probability: 10 }, { token: "其他", probability: 5 }] },
  { selectedToken: "合同", candidates: [{ token: "合同", probability: 61 }, { token: "项目", probability: 17 }, { token: "业务", probability: 12 }, { token: "单位", probability: 6 }, { token: "其他", probability: 4 }] },
  { selectedToken: "可能", candidates: [{ token: "可能", probability: 49 }, { token: "主要", probability: 21 }, { token: "存在", probability: 18 }, { token: "已经", probability: 7 }, { token: "其他", probability: 5 }] },
  { selectedToken: "存在", candidates: [{ token: "存在", probability: 55 }, { token: "涉及", probability: 18 }, { token: "出现", probability: 13 }, { token: "包含", probability: 9 }, { token: "其他", probability: 5 }] },
  { selectedToken: "工作内容", candidates: [{ token: "工作内容", probability: 46 }, { token: "核心业务", probability: 22 }, { token: "项目", probability: 15 }, { token: "任务", probability: 11 }, { token: "其他", probability: 6 }] },
  { selectedToken: "拆分", candidates: [{ token: "拆分", probability: 52 }, { token: "转交", probability: 18 }, { token: "调整", probability: 14 }, { token: "外包", probability: 10 }, { token: "其他", probability: 6 }] },
  { selectedToken: "后", candidates: [{ token: "后", probability: 63 }, { token: "并", probability: 14 }, { token: "再", probability: 11 }, { token: "时", probability: 7 }, { token: "其他", probability: 5 }] },
  { selectedToken: "转由", candidates: [{ token: "转由", probability: 58 }, { token: "交由", probability: 19 }, { token: "委托", probability: 12 }, { token: "由", probability: 7 }, { token: "其他", probability: 4 }] },
  { selectedToken: "其他单位", candidates: [{ token: "其他单位", probability: 64 }, { token: "第三方", probability: 18 }, { token: "外部人员", probability: 9 }, { token: "关联方", probability: 6 }, { token: "其他", probability: 3 }] },
  { selectedToken: "实施", candidates: [{ token: "实施", probability: 57 }, { token: "完成", probability: 20 }, { token: "执行", probability: 13 }, { token: "处理", probability: 6 }, { token: "其他", probability: 4 }] },
  { selectedToken: "的", candidates: [{ token: "的", probability: 68 }, { token: "，", probability: 12 }, { token: "，存在", probability: 9 }, { token: "等", probability: 7 }, { token: "其他", probability: 4 }] },
  { selectedToken: "转分包", candidates: [{ token: "转分包", probability: 62 }, { token: "分包", probability: 17 }, { token: "履约", probability: 10 }, { token: "合规", probability: 7 }, { token: "其他", probability: 4 }] },
  { selectedToken: "风险", candidates: [{ token: "风险", probability: 71 }, { token: "情形", probability: 10 }, { token: "线索", probability: 9 }, { token: "问题", probability: 6 }, { token: "其他", probability: 4 }] },
  { selectedToken: "。", candidates: [{ token: "。", probability: 66 }, { token: "，", probability: 13 }, { token: "，建议", probability: 10 }, { token: "的情形", probability: 7 }, { token: "其他", probability: 4 }] },
  { selectedToken: "<结束回答>", stop: true, candidates: [{ token: "<结束回答>", probability: 78 }, { token: "同时", probability: 9 }, { token: "此外", probability: 7 }, { token: "需要", probability: 4 }, { token: "其他", probability: 2 }] },
];

const systemPrompt = "你是一名合同审计助手。只根据提供的材料回答；证据不足时必须明确说明。";
const userPrompt = "请用一句话说明这份合同可能存在的风险。";

function TokenProbabilityPanel({ candidates, selectedToken }: { candidates: Candidate[]; selectedToken: string }) {
  return (
    <div className="token-probability-panel">
      <div><span>本轮候选 Token</span><small>课堂模拟数据，不代表任何真实模型的实际输出概率。</small></div>
      {candidates.map(candidate => <div className={candidate.token === selectedToken ? "selected" : ""} key={candidate.token}><b>{candidate.token}</b><i aria-hidden="true"><span style={{ width: `${candidate.probability}%` }} /></i><strong>{candidate.probability}%</strong>{candidate.token === selectedToken && <em>本轮选中</em>}</div>)}
    </div>
  );
}

function ConversationInputPipeline() {
  return (
    <section className="conversation-input-pipeline">
      <div className="generation-subhead"><span>模型真正收到什么</span><h5>网页中的一句问题 ≠ 完整模型上下文</h5></div>
      <div className="input-reality-compare">
        <article><span>用户在网页中输入</span><p>“{userPrompt}”</p></article><i>≠</i>
        <article><span>模型实际可能收到</span><ul><li><b>system</b>角色和回答规则</li><li><b>user</b>当前问题</li><li><b>assistant</b>此前回答</li><li>角色分隔标记与特殊 Token</li><li>应用提供的材料或检索结果</li></ul></article>
      </div>
      <p className="generation-key-line">模型收到的通常不只是用户输入的一句话，而是经过后端和对话模板组织后的完整上下文。</p>

      <div className="prefill-panel">
        <div className="generation-subhead"><span>Prefill · 上下文处理</span><h5>第一步：模型先读取已有上下文</h5><p>模型先处理当前对话中已经存在的 Token，并通过 Transformer 计算它们之间的上下文关系。</p></div>
        <div className="prefill-flow">{["system 内容 + user 内容 + assistant 开始标记", "Chat Template", "Tokenizer", "已有 Token 序列", "Transformer 上下文计算"].map((item, index) => <div key={item}><b>{String(index + 1).padStart(2, "0")}</b><span>{item}</span>{index < 4 && <i>→</i>}</div>)}</div>
        <div className="kv-cache-note"><b>KV Cache · 推理优化</b><p>推理服务通常会缓存已经计算过的上下文信息，避免每生成一个新 Token 都从头计算全部历史内容。</p><strong>KV Cache 是一次生成过程中的计算缓存，不等于模型的长期记忆，也不等于聊天应用保存的会话记录。</strong></div>
      </div>
    </section>
  );
}

const generationPseudoCode = `let context = encode(messages);

for (let step = 0; step < maxOutputTokens; step++) {
  const probabilities = model.predictNextToken(context);

  const nextToken = sample(probabilities, {
    temperature,
    topP
  });

  if (isStopToken(nextToken)) {
    break;
  }

  streamToUser(nextToken);
  context.push(nextToken);
}`;

const pseudoCodeNotes = [
  ["model.predictNextToken(context)", "完成一次 Transformer 前向计算，根据当前上下文得到下一 Token 的概率分布。"],
  ["sample(probabilities)", "根据候选概率选择一个 Token。可以选择概率最高的 Token，也可以结合 temperature、top-p 等规则进行采样。"],
  ["isStopToken(nextToken)", "判断当前 Token 是否代表回答结束，或者是否触发了预设停止条件。"],
  ["streamToUser(nextToken)", "把刚生成的 Token 尽快发送到网页并展示给用户；流式输出不代表模型已经一次生成了整段内容。"],
  ["context.push(nextToken)", "把刚生成的 Token 加入当前上下文，使它参与下一轮预测。"],
  ["break", "满足停止条件后，退出本次生成循环。"],
];

function GenerationPseudoCode() {
  return (
    <section className="generation-pseudocode">
      <div className="generation-subhead"><span>通用教学伪代码</span><h5>推理程序如何把一次次前向计算组成回答</h5></div>
      <div className="generation-code-layout"><pre><code>{generationPseudoCode}</code></pre><div>{pseudoCodeNotes.map(([code, note]) => <article key={code}><code>{code}</code><p>{note}</p></article>)}</div></div>
      <p className="sequence-caveat">实际推理框架通常会通过 KV Cache 等方式优化计算，因此不会在每一轮完整重复计算所有历史 Token。但在教学上，仍可理解为：模型每次根据当前全部上下文继续预测下一 Token。</p>
    </section>
  );
}

function SamplingMethods() {
  return (
    <section className="sampling-methods"><div className="generation-subhead"><span>小概念卡</span><h5>概率最高的 Token 一定会被选择吗？</h5><p>不一定。推理程序可以每次都选择概率最高的 Token，也可以按照概率进行采样。</p></div><div className="sampling-card-grid"><article><strong>Greedy · 贪心选择</strong><p>每次直接选择概率最高的 Token。输出通常更稳定，但可能比较单一。</p></article><article><strong>Temperature</strong><p>调整概率分布的平滑程度。较低时更稳定，较高时更多样。</p></article><article><strong>Top-p</strong><p>只在累计概率达到一定范围的候选 Token 中进行选择。</p></article></div><p className="generation-key-line">无论使用哪种选择方式，模型本身首先输出的仍然是下一 Token 的概率分布。</p></section>
  );
}

export function AutoregressiveGenerationDemo() {
  const [currentTokenIndex, setCurrentTokenIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(false);
  const isFinished = currentTokenIndex >= generationSteps.length;
  const generatedTokens = useMemo(() => generationSteps.slice(0, currentTokenIndex).filter(step => !step.stop).map(step => step.selectedToken), [currentTokenIndex]);
  const currentStep = generationSteps[Math.min(currentTokenIndex, generationSteps.length - 1)];

  const generateNext = useCallback(() => setCurrentTokenIndex(index => Math.min(generationSteps.length, index + 1)), []);
  const reset = useCallback(() => { setIsAutoPlaying(false); setCurrentTokenIndex(0); }, []);

  useEffect(() => {
    if (!isAutoPlaying || isFinished) return;
    const timer = window.setTimeout(() => {
      if (currentTokenIndex + 1 >= generationSteps.length) setIsAutoPlaying(false);
      generateNext();
    }, 1250);
    return () => window.clearTimeout(timer);
  }, [generateNext, isAutoPlaying, isFinished, currentTokenIndex]);

  return (
    <section className="autoregressive-generation" aria-labelledby="generation-demo-title">
      <header className="generation-module-head"><div><span>5.5 内部补充 · Prefill + Decode</span><h4 id="generation-demo-title">模型不是一次写出完整句子，而是一个 Token 一个 Token 地生成</h4><p>每生成一个新 Token，它都会成为下一次预测的上下文。</p></div><strong>生成轮次：{String(Math.min(currentTokenIndex + 1, generationSteps.length)).padStart(2, "0")} / {generationSteps.length}</strong></header>
      <ConversationInputPipeline />

      <div className="generation-subhead decode-head"><span>Decode · 逐 Token 生成</span><h5>第二步：每次预测并生成一个新 Token</h5><p>为了便于教学，界面按汉字或词块展示生成过程；真实 Tokenizer 产生的 Token 不一定等于一个完整汉字或完整词，也可能是词的一部分、标点或特殊标记。</p></div>
      <div className="decode-workbench">
        <div className="decode-context"><span>当前已有上下文</span><p><b>system</b>{systemPrompt}</p><p><b>user</b>{userPrompt}</p><p><b>assistant</b>{generatedTokens.length ? generatedTokens.join("") : "等待模型继续生成……"}{isFinished && <em>&lt;结束回答&gt;</em>}</p><small>新 Token 追加后，会参与下一轮 Transformer 计算。</small></div>
        <div className="decode-transformer"><span>本轮前向计算</span><strong>Transformer × N</strong><i>上下文 → 下一 Token 概率</i><small>这是一次前向计算，不是在 Transformer 内部无限循环。</small></div>
        <TokenProbabilityPanel candidates={currentStep.candidates} selectedToken={currentStep.selectedToken} />
      </div>
      <div className="generated-answer" aria-live="polite"><span>已经生成的回答</span><p>{generatedTokens.length ? generatedTokens.map((token, index) => <b key={`${token}-${index}`}>{token}</b>) : <em>等待生成第一个 Token</em>}</p>{isFinished && <div><strong>回答生成完成</strong><small>本次模拟生成 {generatedTokens.length} 个教学 Token 块 · 停止原因：模型生成了结束回答 Token</small></div>}</div>
      <div className="generation-controls"><button type="button" className="primary" onClick={generateNext} disabled={isFinished} aria-label="生成下一个模拟Token">生成下一个 Token</button><button type="button" onClick={() => setIsAutoPlaying(true)} disabled={isAutoPlaying || isFinished} aria-label="开始自动演示">自动演示</button><button type="button" onClick={() => setIsAutoPlaying(false)} disabled={!isAutoPlaying} aria-label="暂停自动演示">暂停</button><button type="button" onClick={reset} aria-label="重新开始Token生成演示">重新开始</button><span aria-live="polite">{isAutoPlaying ? "自动演示中" : isFinished ? "生成已完成" : "等待下一次操作"}</span></div>
      <GenerationPseudoCode />
      <SamplingMethods />
    </section>
  );
}

export function LecturerGenerationNotes() {
  const script = [
    "我们前面说，大语言模型训练时反复预测下一个 Token。模型真正回答问题时，使用的仍然是同一个核心机制。",
    "用户的问题和系统规则会先被组织成一段完整上下文，再转换成 Token。",
    "Transformer 根据已有 Token 计算下一 Token 的概率。推理程序选择一个，追加到回答末尾，然后再次预测。",
    "所以，从工程上看，一次回答确实包含一个循环。但这个循环通常由模型外部的推理程序运行，Transformer 每一次只完成一次前向计算。",
    "模型不是一次性把整句话写好以后再慢慢显示，而是在生成过程中逐步形成回答。",
    "当模型生成特殊结束 Token，或者达到最大长度、命中停止序列、被用户取消时，循环就会结束。句号本身并不代表回答一定结束。",
    "还要注意，这里的 Token 循环不是智能体循环。Token 循环是在生成一次回答，智能体循环是在决定下一步行动。",
  ];
  const questions = ["模型生成句号以后，是否一定停止？", "模型的一次前向计算会生成完整段落吗？", "生成循环是在 Transformer 内部，还是由推理服务控制？", "EOS 和 max_output_tokens 有什么区别？", "Token 生成循环与智能体行动循环有什么区别？"];
  return <aside className="generation-lecturer-notes"><header><span>仅供讲师使用</span><h4>讲师提示</h4><strong>预计讲解时间：5—8分钟</strong></header><div><section><span>建议讲解词</span>{script.map(item => <p key={item}>{item}</p>)}</section><section><span>现场提问建议</span><ol>{questions.map(item => <li key={item}>{item}</li>)}</ol></section></div></aside>;
}
