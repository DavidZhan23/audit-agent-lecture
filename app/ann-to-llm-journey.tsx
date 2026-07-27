"use client";

import { useState, type ReactNode } from "react";
import { TransformerVisualJourney } from "./transformer-visual-journey";

const exampleTokens = ["审计人员", "发现", "这份", "合同", "存在", "异常", "，", "因此", "决定", "进一步", "核查", "。"];

const journeySteps = [
  ["5.1", "同一套学习机制", "大语言模型仍然是神经网络"],
  ["5.2", "文字变成数字", "Token + Embedding"],
  ["5.3", "联系上下文", "Transformer + Attention"],
  ["5.4", "海量文本预训练", "反复预测下一个 Token"],
  ["5.5", "学会遵循指令", "从续写模型到对话助手"],
  ["5.6", "工程师怎样调用", "模型 → 调用接口 → 产品 → 智能体"],
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
        <p>前向计算、Loss、反向传播都保留下来。</p>
      </div>
      <i className="ann-expands">扩展为</i>
      <div className="ann-change-grid">
        {changes.map(([name, before, after]) => <article key={name}><span>{name}</span><small>{before}</small><i>→</i><strong>{after}</strong></article>)}
      </div>
    </div>
  );
}

function LanguageEncodingLab() {
  const [stage, setStage] = useState(0);
  const stages = ["原始句子", "Token 序列", "Embedding 向量", "进入神经网络"];
  const vectors: Record<string, string> = {
    "审计人员": "[0.62, −0.18, 0.41, …]",
    "合同": "[0.71, 0.26, −0.33, …]",
    "异常": "[−0.44, 0.83, 0.29, …]",
    "核查": "[0.56, 0.74, −0.12, …]",
  };
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
        {stage === 2 && <div className="embedding-stage"><div className="embedding-list">{Object.entries(vectors).map(([token, vector]) => <div key={token}><b>{token}</b><code>{vector}</code></div>)}</div><aside><span>不是普通编号</span><strong>向量携带可学习的语义关系</strong><p>训练后，“合同”通常更靠近“协议”，“核查”更靠近“检查”，而不是只得到 17、42 这样的流水号。</p></aside></div>}
        {stage === 3 && <div className="network-entry"><div>{exampleTokens.slice(0, 6).map((token, index) => <span key={token}><b>{token}</b><small>{index === 0 ? "[0.62, …]" : index === 3 ? "[0.71, …]" : "[…, …]"}</small></span>)}</div><i>→</i><strong>Transformer 神经网络</strong><p>模型实际接收和计算的是向量序列，不是屏幕上的汉字。</p></div>}
      </div>
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

function AlignmentLab() {
  const [mode, setMode] = useState<"base" | "instruction">("base");
  return (
    <div className="alignment-lab">
      <div className="ann-llm-lab-head">
        <div><span>对比互动</span><h4>同一句输入，基础模型和指令模型有什么不同？</h4></div>
        <div><button type="button" className={mode === "base" ? "active" : ""} aria-pressed={mode === "base"} onClick={() => setMode("base")}>基础模型</button><button type="button" className={mode === "instruction" ? "active" : ""} aria-pressed={mode === "instruction"} onClick={() => setMode("instruction")}>指令模型</button></div>
      </div>
      <div className="alignment-dialogue">
        <div><span>用户输入</span><p>“请总结这份合同的异常点。”</p></div>
        <i>→</i>
        <div className={mode}><span>{mode === "base" ? "完成预训练的基础模型" : "经过指令训练的对话模型"}</span>{mode === "base" ? <p>请总结这份合同的异常点。欢迎进入合同审查栏目，本文将介绍……</p> : <p>摘要：合同存在一处异常，需要进一步核查异常条款、影响范围及相关审批依据。</p>}<small>{mode === "base" ? "首先擅长续写，可能继续模仿网页、文章或问答文本。" : "更能识别“总结”是一项任务，并按要求组织回答。"}</small></div>
      </div>
      <div className="alignment-stages"><span><b>预训练</b><small>学会语言与广泛模式</small></span><i>→</i><span><b>指令微调</b><small>学习按要求完成任务</small></span><i>→</i><span><b>偏好 / 反馈</b><small>改善有用性与行为</small></span><i>→</i><span><b>安全约束</b><small>降低不当输出风险</small></span></div>
      <p className="alignment-caveat">这些训练让模型更擅长按人的要求使用能力，但不是安装知识库，也不意味着模型从此不会犯错。</p>
    </div>
  );
}

type CallOption = "document" | "rule" | "history" | "database" | "agent";
type ApiField = "model" | "messages" | "parameters";

const apiFieldNotes: Record<ApiField, { title: string; body: string }> = {
  model: {
    title: "model：模型服务中的标识",
    body: "它告诉推理服务这次调用哪个模型；不同模型的能力、速度、成本和上下文长度可能不同。它不是模型的全部代码。",
  },
  messages: {
    title: "messages：这一次交给模型的上下文",
    body: "system 规定角色与规则，user 提出任务，assistant 可承载此前回复。模型不是天然知道自己是“合同审计助手”；同一个模型可在不同应用上下文中表现为不同助手。",
  },
  parameters: {
    title: "generation parameters：控制本次生成",
    body: "temperature、最大输出长度等参数会影响随机性与回答长度；它们不会让模型自动获得缺失的事实。",
  },
};

const callOptions: Array<{ key: CallOption; label: string; detail: string }> = [
  { key: "document", label: "加入合同正文", detail: "先解析文件，再把相关段落放入上下文" },
  { key: "rule", label: "加入审计规则", detail: "检索企业转分包判断规则并保留依据" },
  { key: "history", label: "加入历史对话", detail: "由应用保存，并在本次调用中重新发送" },
  { key: "database", label: "允许查询合同库", detail: "应用按权限执行外部查询，不是模型绕过系统直连" },
  { key: "agent", label: "开启智能体循环", detail: "让工具结果回到模型，由模型判断下一步" },
];

function EngineeringCallLab() {
  const [field, setField] = useState<ApiField>("messages");
  const [options, setOptions] = useState<Record<CallOption, boolean>>({
    document: false,
    rule: false,
    history: false,
    database: false,
    agent: false,
  });

  const toggleOption = (key: CallOption) => {
    setOptions(current => {
      const next = { ...current, [key]: !current[key] };
      if (key === "agent" && !current.agent) next.database = true;
      if (key === "database" && current.database) next.agent = false;
      return next;
    });
  };

  const messages = [
    {
      role: "system",
      content: "你是一名合同审计助手。只根据提供的材料回答；证据不足时必须明确说明。",
    },
    ...(options.history ? [{ role: "assistant", content: "此前已确认合同主体为海岳工程有限公司，金额为980万元。" }] : []),
    ...(options.document ? [{ role: "user", content: "[合同相关段落] 乙方可将海上安装作业交由具备资质的第三方实施。" }] : []),
    ...(options.rule ? [{ role: "user", content: "[审计规则] 未经书面批准将核心工作交由第三方，属于需进一步核查的转分包风险线索。" }] : []),
    { role: "user", content: "检查这份合同是否可能存在转分包风险。" },
  ];

  const requestCode = `const result = await llm.generate(${JSON.stringify({
    model: "instruction-model",
    messages,
    temperature: 0.2,
    max_output_tokens: 160,
  }, null, 2)});`;

  let responseText = "仅根据当前问题还无法判断：我没有收到合同正文、企业判断规则，也不知道“这份合同”具体指哪一份。";
  let responseNote = "裸模型调用只能基于已发送的上下文生成文字，不能自行读取合同系统。";
  if (options.document) {
    responseText = "合同相关段落允许第三方实施部分海上安装作业，存在需要核查的线索；但缺少企业判断规则和审批资料，暂不能定性。";
    responseNote = "文件上传后通常要先解析、筛选或检索；模型不一定直接获得完整文件。";
  }
  if (options.document && options.rule) {
    responseText = "存在转分包风险线索：合同允许第三方实施安装作业，而企业规则要求核心工作转交第三方须有书面批准。建议核查批准文件及第三方工作范围。";
    responseNote = "这是基于本次上下文生成的分析，仍需核验原文、审批和实际履约证据。";
  }
  if (options.database) {
    responseText = "程序已按授权查询合同库，找到1份潜在关联合同。当前流程可展示查询结果，但下一步仍由预先编排的程序决定。";
    responseNote = "一次由程序预先安排的查询仍是固定工作流，不一定是完整智能体。";
  }
  if (options.agent) {
    responseText = "已观察到1份潜在关联合同。下一步将对比双方主体、工作范围、金额和签订时间；若证据仍不足，再决定是否继续检索。";
    responseNote = "关键变化：工具结果返回给大语言模型，形成“决策—行动—观察—再决策”的受控循环。";
  }

  return (
    <div className="engineering-call-lab">
      <div className="bare-model-call">
        <div><span>最基础的调用</span><strong>输入</strong><p>请用一句话总结这份合同的主要工作内容。</p></div>
        <i>→ 调用接口 →</i>
        <div><span>模型逐 Token 生成</span><strong>输出</strong><p>该合同主要涉及海上设备的安装、调试和后续技术支持。</p></div>
      </div>

      <p className="api-is-interface"><b>工程事实：</b>工程师通常通过推理服务、开发工具包或调用接口使用模型。调用接口是应用访问模型能力的入口，不是模型本身；模型通常也看不到网页，只接收后端组织后发送的上下文。</p>

      <div className="api-field-inspector">
        <div role="tablist" aria-label="解释模型调用接口的核心字段">
          {(Object.keys(apiFieldNotes) as ApiField[]).map(key => <button type="button" role="tab" aria-selected={field === key} className={field === key ? "active" : ""} key={key} onClick={() => setField(key)}>{key}</button>)}
        </div>
        <section aria-live="polite"><span>请求字段</span><h4>{apiFieldNotes[field].title}</h4><p>{apiFieldNotes[field].body}</p></section>
      </div>

      <div className="web-to-model-flow" aria-label="从网页输入到模型输出的调用流程">
        {["用户在网页输入", "前端发送给后端", "后端组织请求", "调用接口访问模型", "模型生成Token", "网页展示回答"].map((step, index) => <div key={step}><b>0{index + 1}</b><span>{step}</span>{index < 5 && <i>→</i>}</div>)}
      </div>

      <div className="model-context-reality">
        <div><span>用户在网页中只看到</span><p>“检查这份合同是否可能存在转分包风险。”</p></div>
        <i>≠</i>
        <div><span>后端实际组织给模型的上下文</span><ul><li><b>system</b> 合同审计角色、回答规则、安全边界</li>{options.history && <li><b>assistant</b> 此前对话中的合同主体和金额</li>}{options.document && <li><b>document</b> 解析后筛选出的合同相关段落</li>}{options.rule && <li><b>knowledge</b> 检索到的企业判断规则</li>}<li><b>user</b> 当前问题</li></ul></div>
      </div>

      <div className="call-option-bar" aria-label="逐层增加大模型产品能力">
        {callOptions.map(option => <button type="button" aria-pressed={options[option.key]} className={options[option.key] ? "active" : ""} key={option.key} onClick={() => toggleOption(option.key)}><i>{options[option.key] ? "✓" : "+"}</i><span>{option.label}</span><small>{option.detail}</small></button>)}
      </div>

      <div className="api-call-workbench">
        <div><span>工程师发送的请求 · 通用伪代码</span><pre>{requestCode}</pre></div>
        <aside><span>模拟返回</span><pre>{JSON.stringify({ text: responseText }, null, 2)}</pre><p>{responseNote}</p></aside>
      </div>
      <p className="api-security-note">演示仅使用前端模拟数据，不连接外部模型；真实接口密钥、内部地址和敏感信息不能放在浏览器代码里。系统提示词可以影响行为，但不能保证模型永远正确或绝对服从。</p>

      <div className="ai-four-levels">
        <article><b>01</b><span>大语言模型</span><strong>生成能力</strong><p>接收 Token 上下文，预测并生成后续 Token。</p></article>
        <article><b>02</b><span>模型调用接口</span><strong>访问接口</strong><p>让其他程序可以调用模型；调用接口不是模型，也不是智能体。</p></article>
        <article><b>03</b><span>大模型应用</span><strong>可用产品</strong><p>组合网页、后端、会话、文件、知识、安全和固定流程。</p></article>
        <article><b>04</b><span>智能体</span><strong>行动循环</strong><p>围绕目标多次调用模型和工具，并根据结果继续决策。</p></article>
      </div>
      <p className="four-level-summary">模型提供语言与推理能力，调用接口让程序可以使用模型，应用把模型变成可用产品，智能体则让系统能够围绕目标持续采取行动。</p>
    </div>
  );
}

function AgentTransitionBoard() {
  return (
    <div className="agent-transition-board">
      <div className="agent-transition-question"><span>留给下一章的问题</span><h4>如果任务不是回答一句话，而是让模型自己判断下一步做什么，会发生什么？</h4></div>
      <div className="call-vs-agent-loop">
        <article><span>普通模型调用</span><code>输入 → 大语言模型 → 输出</code><p>生成一次回答，流程到此结束。</p></article>
        <i>→ 关键变化 →</i>
        <article><span>智能体运行机制</span><code>目标 → 大语言模型判断 → 工具执行 → 观察结果 ↺</code><p>根据结果继续决策、调用工具，直到完成或受控停止。</p></article>
      </div>
      <p>大语言模型是整个人工智能应用中的核心能力模块，更接近智能体的“大脑”。聊天产品用提示词、会话、知识、界面和安全机制让它变得可用；当系统进一步加入受控工具、记忆和持续执行循环时，它才开始成为能够围绕目标采取行动的智能体核心。</p>
    </div>
  );
}

export function AnnToLlmJourney() {
  return (
    <div className="ann-to-llm-journey">
      <div className="ann-llm-driving-question">
        <span>本章唯一问题</span>
        <h3>普通神经网络已经可以通过训练学习规律，那么它还需要哪些关键变化，才能成为大语言模型？</h3>
      </div>

      <nav className="ann-llm-route" aria-label="从神经网络到大语言模型的六步路线">
        {journeySteps.map(([no, title, detail], index) => <div key={no}><b>{no}</b><strong>{title}</strong><small>{detail}</small>{index < journeySteps.length - 1 && <i>→</i>}</div>)}
      </nav>

      <section className="ann-llm-section">
        <SectionLead no="5.1" eyebrow="先确认没有被推翻的基础" title="大语言模型并不是另一种完全不同的人工智能">上一部分中，神经网络通过作出预测、计算误差并调整权重来学习。大语言模型没有抛弃这套机制；变化的是数据、结构、训练任务与规模。</SectionLead>
        <AnnContinuityBoard />
        <p className="ann-scale-note"><b>“Large”不只是增加神经元：</b>数据覆盖、模型结构与参数、训练任务和计算资源需要共同扩展。</p>
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
        <MemoryLine>Attention 解决的核心问题，是“当前这个词应该重点参考上下文中的哪些信息”。它是计算机制，不是人的意识。</MemoryLine>
      </section>

      <section className="ann-llm-section">
        <SectionLead no="5.4" eyebrow="第三个变化 · 训练" title="从完成一个任务，变成在海量文本中学习语言">大语言模型把大量文本统一成一个简单训练任务：根据前面的 Token，预测接下来最可能出现的 Token。</SectionLead>
        <PretrainingLoopLab />
        <div className="pretraining-capabilities"><span>同一套大规模预训练</span><i>→</i>{["翻译", "总结", "问答", "写作"].map(item => <b key={item}>{item}</b>)}</div>
        <MemoryLine>大语言模型的基础训练并不神秘：仍然是在预测、纠错和调整权重，只是训练材料变成海量语言，数据、模型与计算规模共同增长。</MemoryLine>
      </section>

      <section className="ann-llm-section">
        <SectionLead no="5.5" eyebrow="从基础语言模型到对话助手" title="预训练学会语言，指令训练学会按要求使用能力">完成预训练的基础模型首先擅长根据上下文续写；要更稳定地理解“这是一个任务”，通常还需要指令微调、人类偏好或反馈训练，以及安全与行为约束。</SectionLead>
        <AlignmentLab />
        <MemoryLine>预训练让模型学会语言和广泛模式，指令训练让它更擅长按照人的要求使用这些能力。</MemoryLine>
      </section>

      <section className="ann-llm-section">
        <SectionLead no="5.6" eyebrow="工程师的真实使用方式" title="工程师实际上怎样调用大语言模型？">经过预训练和指令训练，模型已经能按要求生成回答。但普通用户看到的聊天网页并不是模型本身；工程师会通过推理服务的调用接口发送上下文，再由应用把模型能力组织成可用产品。</SectionLead>
        <EngineeringCallLab />
        <MemoryLine>网页输入框中的一句话，往往只是最终模型上下文的一部分；调用接口负责访问模型，网页产品负责把模型变得可用。</MemoryLine>
        <AgentTransitionBoard />
      </section>
    </div>
  );
}
