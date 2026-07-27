"use client";

import { useState } from "react";

const scenes = [
  ["01", "从普通神经网络开始", "结构替换"],
  ["02", "完整大语言模型", "Transformer 在哪里"],
  ["03", "放大一个 Block", "内部结构"],
  ["04", "上下文计算", "Attention 示例"],
  ["05", "重复堆叠", "表示逐层更新"],
  ["06", "回到模型输出", "预测下一个 Token"],
];

const annStages = [
  { input: "输入层", hidden: "隐藏计算层", output: "输出层", note: "普通神经网络的抽象结构" },
  { input: "Token Embedding + 位置信息", hidden: "隐藏计算层", output: "输出层", note: "先把输入替换为语言向量" },
  { input: "Token Embedding + 位置信息", hidden: "Transformer Block × N", output: "输出层", note: "再把隐藏计算替换为适合序列的架构" },
  { input: "Token Embedding + 位置信息", hidden: "Transformer Block × N", output: "下一个 Token 的概率分布", note: "最后明确大语言模型的输出任务" },
];

const attentionExamples = {
  "进一步核查": [
    ["存在异常", 94, "触发核查的原因"],
    ["因此", 82, "连接前因与后果"],
    ["决定", 72, "说明行动意图"],
  ],
  "这份合同": [
    ["审计人员", 56, "谁在处理对象"],
    ["发现", 78, "对对象发生的动作"],
    ["存在异常", 88, "对象当前的状态"],
  ],
} as const;

export function TransformerVisualJourney() {
  const [scene, setScene] = useState(0);
  const [annStage, setAnnStage] = useState(0);
  const [focusToken, setFocusToken] = useState<keyof typeof attentionExamples>("进一步核查");
  const currentAnn = annStages[annStage];
  const attentionTargets = attentionExamples[focusToken];

  return (
    <div className="transformer-visual-journey">
      <header className="transformer-journey-head">
        <div><span>连续可视化 · 从整体到局部，再回到整体</span><h4>Token 向量进入神经网络后，Transformer 怎样完成上下文计算？</h4></div>
        <p><b>当前位置</b>完整模型 → Transformer 所在位置 → 单个 Block → 内部计算 → 完整模型输出</p>
      </header>

      <div className="transformer-scene-tabs" role="tablist" aria-label="Transformer 可视化六个场景">
        {scenes.map(([no, title, detail], index) => (
          <button type="button" role="tab" aria-selected={scene === index} className={scene === index ? "active" : ""} key={no} onClick={() => setScene(index)}>
            <b>{no}</b><strong>{title}</strong><small>{detail}</small>
          </button>
        ))}
      </div>

      <section className="transformer-scene-panel" role="tabpanel" hidden={scene !== 0}>
        <div className="transformer-scene-title"><span>场景一 · 与上一章衔接</span><h5>Transformer 仍然是神经网络：改变的是隐藏计算的组织方式</h5><p>点击四步，把普通神经网络的“输入—隐藏层—输出”逐项替换成大语言模型中更具体的结构。</p></div>
        <div className="ann-replacement-controls" role="tablist" aria-label="普通神经网络逐步替换为大语言模型结构">
          {annStages.map((_, index) => <button type="button" role="tab" aria-selected={annStage === index} className={annStage === index ? "active" : ""} key={index} onClick={() => setAnnStage(index)}>第{index + 1}步</button>)}
        </div>
        <div className="ann-replacement-flow" aria-live="polite">
          <article className={annStage >= 1 ? "replaced" : ""}><span>输入</span><strong>{currentAnn.input}</strong></article><i>→</i>
          <article className={annStage >= 2 ? "transformer-node replaced" : ""}><span>隐藏计算</span><strong>{currentAnn.hidden}</strong></article><i>→</i>
          <article className={annStage >= 3 ? "replaced" : ""}><span>输出</span><strong>{currentAnn.output}</strong></article>
        </div>
        <p className="ann-replacement-note">{currentAnn.note}。Transformer 不是神经元，也不是外挂插件；它是一种更适合处理语言序列的神经网络架构。</p>
      </section>

      <section className="transformer-scene-panel" role="tabpanel" hidden={scene !== 1}>
        <div className="transformer-scene-title"><span>场景二 · 先看全局</span><h5>完整的大语言模型神经网络中，Transformer 位于哪里？</h5><p>Tokenizer 在神经网络外负责输入预处理；从 Embedding 开始，数据才进入可训练的神经网络内部。</p></div>
        <div className="llm-whole-architecture">
          <div className="llm-preprocess-zone"><span>神经网络外部 · 输入预处理</span><div><article><small>输入文字</small><strong>审计人员发现……</strong></article><i>↓</i><article><small>Tokenization</small><strong>切分规则</strong></article><i>↓</i><article><small>Token 编号</small><strong>[421, 98, 735, …]</strong></article></div></div>
          <i className="architecture-entry">↓ 进入神经网络</i>
          <div className="llm-neural-network-zone">
            <span>大语言模型 · 神经网络内部</span>
            <div><article><small>输入层</small><strong>Token Embedding<br />+ Position Information</strong></article><i>↓</i><article className="transformer-core"><em>Transformer 对应这里</em><small>核心隐藏计算</small><strong>Transformer Block × N</strong><p>连续堆叠很多个 Decoder-only Block</p></article><i>↓</i><article><small>输出层</small><strong>语言模型输出层</strong><p>把最终表示映射到整个词表</p></article></div>
          </div>
          <i className="architecture-entry">↓</i>
          <div className="llm-probability-output"><span>候选 Token 概率</span><b>核查 58%</b><b>调查 19%</b><b>分析 12%</b><b>其他 11%</b></div>
        </div>
        <p className="transformer-location-answer"><b>答案：</b>Transformer 位于输入 Embedding 和最终输出层之间，是大语言模型最核心的隐藏计算架构；它不等于Tokenizer，更不等于网页、调用接口或整个人工智能产品。</p>
      </section>

      <section className="transformer-scene-panel" role="tabpanel" hidden={scene !== 2}>
        <div className="transformer-scene-title"><span>场景三 · 放大一个 Decoder-only Block</span><h5>一个 Transformer Block 不只有 Attention</h5><p>它会先汇总上下文，再加工当前表示；残差连接和归一化帮助信息在深层网络中稳定传递。</p></div>
        <div className="transformer-block-zoom">
          <div className="block-flow-column">
            <article><span>输入向量</span><strong>每个 Token 当前的表示</strong></article><i>↓</i>
            <article className="attention-part"><span>01 · Layer Norm + Masked Self-Attention</span><strong>只参考当前位置之前的上下文</strong><small>生成时不能提前看到未来答案</small></article><i>↓ + Residual</i>
            <article className="mlp-part"><span>02 · Layer Norm + Feed-Forward Network</span><strong>对每个 Token 的信息做非线性加工</strong><small>继续变换和丰富当前表示</small></article><i>↓ + Residual</i>
            <article><span>输出向量</span><strong>进入下一个 Transformer Block</strong></article>
          </div>
          <aside className="block-part-legend">
            <div><b>Attention</b><p>“我应该参考上下文中的哪些信息？”</p></div>
            <div><b>前馈神经网络</b><p>“获得这些信息后，我该怎样更新当前表示？”</p></div>
            <div><b>Residual</b><p>保留原有信息，并把新计算结果加回来。</p></div>
            <div><b>Normalization</b><p>稳定每层数值，使许多Block可以连续堆叠训练。</p></div>
          </aside>
        </div>
        <p className="attention-mlp-summary"><b>明确分工：</b>Attention 负责从上下文中寻找和汇总相关信息；前馈神经网络负责进一步加工每个 Token 当前携带的信息。</p>
      </section>

      <section className="transformer-scene-panel" role="tabpanel" hidden={scene !== 3}>
        <div className="transformer-scene-title"><span>场景四 · 一轮上下文信息交换</span><h5>选择一个 Token，看看它可能重点参考哪些信息</h5><p>连线强弱仅是教学模拟；真实模型的不同层、不同Attention Head可能关注不同类型的关系。</p></div>
        <div className="attention-example-controls">
          <span>当前要更新的 Token</span>
          {(Object.keys(attentionExamples) as Array<keyof typeof attentionExamples>).map(token => <button type="button" aria-pressed={focusToken === token} className={focusToken === token ? "active" : ""} key={token} onClick={() => setFocusToken(token)}>{token}</button>)}
        </div>
        <div className="attention-context-sentence" aria-label="合同句子的简化Token序列">{["审计人员", "发现", "这份合同", "存在异常", "因此", "决定", "进一步核查"].map(token => <span className={token === focusToken ? "focus" : ""} key={token}>{token}</span>)}</div>
        <div className="attention-connection-map" aria-live="polite">
          <article><span>当前 Token</span><strong>{focusToken}</strong><small>正在更新它的上下文表示</small></article>
          <i>参考上下文 →</i>
          <div>{attentionTargets.map(([token, weight, role]) => <span key={token}><b>{token}</b><i><em style={{ width: `${weight}%` }} /></i><strong>{weight}%</strong><small>{role}</small></span>)}</div>
        </div>
        <p className="attention-teaching-boundary">Self-Attention 会为不同 Token 计算不同的上下文关联。模型不是孤立地理解每个词，而是在多层、多头计算中反复更新表示；这不是人类意识，也不是唯一固定的词语连线。</p>
      </section>

      <section className="transformer-scene-panel" role="tabpanel" hidden={scene !== 4}>
        <div className="transformer-scene-title"><span>场景五 · 收缩回多层结构</span><h5>为什么 Transformer Block 要重复堆叠？</h5><p>一个Block只完成一轮信息交换与特征加工；连续堆叠后，Token表示可以逐层变得更丰富、更抽象。</p></div>
        <div className="transformer-stack-visual">
          <article><b>输入表示</b><span>“进一步核查”</span><small>初始词义与位置信息</small></article><i>↓</i>
          <article className="stack-block"><b>Block 1</b><span>局部关系</span><small>联系“决定”“因此”等附近信息</small></article><i>↓</i>
          <article className="stack-block"><b>Block 2 …</b><span>句子关系</span><small>组合“合同异常→需要核查”的上下文</small></article><i>↓</i>
          <article className="stack-block"><b>Block N</b><span>任务相关表示</span><small>形成可供下一个Token预测使用的最终表示</small></article>
        </div>
        <div className="stack-level-guide"><span><b>较浅层</b><small>词语与局部关系</small></span><span><b>中间层</b><small>短语、句子和上下文组合</small></span><span><b>较深层</b><small>与整体语义和当前任务相关的表示</small></span></div>
        <p className="stack-boundary-note">这是便于理解的概括，不表示某一层只负责一种固定功能；不同模型、不同层之间的分工并没有人工预先写死。</p>
      </section>

      <section className="transformer-scene-panel" role="tabpanel" hidden={scene !== 5}>
        <div className="transformer-scene-title"><span>场景六 · 回到完整模型输出</span><h5>Transformer 的输出怎样变成下一个 Token？</h5><p>多层Transformer先形成最后一个位置的上下文表示，语言模型输出层再把它映射成整个词表的候选概率。</p></div>
        <div className="next-token-architecture">
          <article><span>前文 Token</span><strong>……因此决定进一步</strong></article><i>→</i>
          <article><span>输入层</span><strong>Embedding</strong></article><i>→</i>
          <article className="transformer-core"><span>隐藏计算</span><strong>Transformer × N</strong></article><i>→</i>
          <article><span>最终表示</span><strong>最后一个位置</strong></article><i>→</i>
          <article><span>输出层</span><strong>语言模型输出层</strong></article>
        </div>
        <div className="next-token-probabilities"><span>教学模拟 · 不代表真实模型输出</span>{[["核查", 58], ["调查", 19], ["分析", 12], ["处理", 6], ["其他", 5]].map(([token, probability]) => <div key={token}><b>{token}</b><i><em style={{ width: `${probability}%` }} /></i><strong>{probability}%</strong></div>)}</div>
        <p className="transformer-to-training"><b>自然进入下一节：</b>Transformer 负责结合上下文不断更新 Token 表示；输出层再计算下一个 Token 的概率。那么，模型怎样在海量文本中反复做这件事，并通过误差调整所有权重？</p>
      </section>

      <footer className="transformer-scene-footer">
        <button type="button" onClick={() => setScene(Math.max(0, scene - 1))} disabled={scene === 0}>← 上一个场景</button>
        <span>{String(scene + 1).padStart(2, "0")} / {String(scenes.length).padStart(2, "0")}</span>
        <button type="button" className="primary" onClick={() => setScene(Math.min(scenes.length - 1, scene + 1))} disabled={scene === scenes.length - 1}>下一个场景 →</button>
      </footer>
    </div>
  );
}
