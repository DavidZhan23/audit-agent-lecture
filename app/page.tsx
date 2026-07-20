"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";

type StageKey = "code" | "ml" | "nn" | "llm" | "agent";
type CaseState = "发现" | "提示" | "遗漏" | "误报" | "排除误报";

const stages: Array<{
  key: StageKey;
  name: string;
  question: string;
  ability: string;
  limit: string;
  sees: string;
}> = [
  { key: "code", name: "代码与规则", question: "条件是否满足？", ability: "按人写好的步骤准确执行", limit: "只会处理事先写出的情况", sees: "结构化字段" },
  { key: "ml", name: "机器学习", question: "它像不像历史异常？", ability: "从案例中归纳统计规律", limit: "依赖特征、数据和历史标签", sees: "数据中的组合模式" },
  { key: "nn", name: "神经网络", question: "原始内容里有什么特征？", ability: "自动学习多层复杂特征", limit: "识别内容不等于理解业务语境", sees: "数字、图片、文本" },
  { key: "llm", name: "大模型", question: "这些信息合起来意味着什么？", ability: "理解语言、综合上下文、生成解释", limit: "可能幻觉，且不会天然访问系统", sees: "制度、说明与多文档上下文" },
  { key: "agent", name: "智能体", question: "为了完成目标，下一步该做什么？", ability: "调用工具、读取反馈、持续行动", limit: "必须受权限、证据和人工复核约束", sees: "目标、工具结果与运行状态" },
];

const nav = [
  ["problem", "先把问题说清楚", "15′"],
  ["code", "普通代码与规则", "16′"],
  ["ml", "机器学习", "16′"],
  ["nn", "神经网络", "22′"],
  ["llm", "大模型", "24′"],
  ["agent", "智能体", "14′"],
  ["case", "完整案例", "5′"],
  ["build", "审计智能体怎么做", "4′"],
  ["summary", "总结", "4′"],
];

const auditCases: Array<{
  id: string;
  title: string;
  fact: string;
  truth: string;
  state: Record<StageKey, CaseState>;
}> = [
  {
    id: "A", title: "重复发票", fact: "同一发票出现在两个报销单中，文件名不同。", truth: "真实疑点：号码、金额、日期完全一致。",
    state: { code: "发现", ml: "发现", nn: "发现", llm: "发现", agent: "发现" },
  },
  {
    id: "B", title: "住宿超标准", fact: "标准600元，实际720元，但发生在大型展会期间。", truth: "合理例外：存在事前特殊审批和有效补充通知。",
    state: { code: "误报", ml: "误报", nn: "误报", llm: "排除误报", agent: "排除误报" },
  },
  {
    id: "C", title: "拆分报销", fact: "两天内同一商户发生1,960、1,980、1,950、1,990元四笔费用。", truth: "重大疑点：均略低于2,000元审批阈值。",
    state: { code: "遗漏", ml: "发现", nn: "发现", llm: "发现", agent: "发现" },
  },
  {
    id: "D", title: "票据修改", fact: "出租车票报销286元，二维码解析金额为86元。", truth: "重大疑点：图像数字与二维码金额矛盾。",
    state: { code: "遗漏", ml: "提示", nn: "发现", llm: "发现", agent: "发现" },
  },
  {
    id: "E", title: "个人消费伪装", fact: "周日“客户招待”小票包含儿童套餐和生日蛋糕。", truth: "重大疑点：无拜访记录，联系人休假，员工日历为家人生日。",
    state: { code: "提示", ml: "提示", nn: "提示", llm: "发现", agent: "发现" },
  },
  {
    id: "F", title: "行程矛盾", fact: "报销称“上海机场至苏州客户公司”。", truth: "重大疑点：员工实际落地南京，入住南京，发票还被他人使用。",
    state: { code: "遗漏", ml: "遗漏", nn: "遗漏", llm: "提示", agent: "发现" },
  },
];

function SectionTitle({ no, time, title, intro }: { no: string; time: string; title: string; intro: string }) {
  return (
    <header className="section-title">
      <div><span>{no}</span><small>{time}</small></div>
      <div><h2>{title}</h2><p>{intro}</p></div>
    </header>
  );
}

function TeacherNote({ children }: { children: React.ReactNode }) {
  return <aside className="teacher-note"><strong>讲师提示</strong><p>{children}</p></aside>;
}

function Definition({ term, simple, precise }: { term: string; simple: string; precise: string }) {
  return (
    <div className="definition">
      <span>定义</span><h3>{term}</h3><p className="simple">{simple}</p><p className="precise">更准确地说：{precise}</p>
    </div>
  );
}

function Bridge({ from, problem, to }: { from: string; problem: string; to: string }) {
  return (
    <div className="bridge">
      <span>{from}</span><p>{problem}</p><strong>所以，我们需要引入：{to} →</strong>
    </div>
  );
}

function Header({ notes, setNotes }: { notes: boolean; setNotes: (v: boolean) => void }) {
  const [progress, setProgress] = useState(0);
  const [timerOpen, setTimerOpen] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [running, setRunning] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      const total = document.documentElement.scrollHeight - innerHeight;
      setProgress(total ? Math.round(scrollY / total * 100) : 0);
    };
    onScroll(); addEventListener("scroll", onScroll, { passive: true });
    return () => removeEventListener("scroll", onScroll);
  }, []);
  useEffect(() => {
    if (!running) return;
    const id = window.setInterval(() => setSeconds(v => v + 1), 1000);
    return () => clearInterval(id);
  }, [running]);

  return (
    <>
      <header className="topbar">
        <a href="#top" className="brand">从审计问题到智能体</a>
        <div className="top-progress"><i style={{ width: `${progress}%` }} /></div>
        <div className="top-actions">
          <button className={notes ? "on" : ""} onClick={() => setNotes(!notes)}>{notes ? "隐藏讲师备注" : "显示讲师备注"}</button>
          <button onClick={() => setTimerOpen(!timerOpen)}>计时</button>
          <button onClick={() => document.fullscreenElement ? document.exitFullscreen() : document.documentElement.requestFullscreen?.()}>全屏</button>
        </div>
      </header>
      {timerOpen && <div className="timer"><button className="timer-x" onClick={() => setTimerOpen(false)}>×</button><span>课堂计时</span><strong>{String(Math.floor(seconds / 60)).padStart(2, "0")}:{String(seconds % 60).padStart(2, "0")}</strong><div><button onClick={() => setRunning(!running)}>{running ? "暂停" : "开始"}</button><button onClick={() => { setSeconds(0); setRunning(false); }}>归零</button></div></div>}
    </>
  );
}

const triageClaims = [
  { id: "BX-41002", date: "05-14", type: "住宿", amount: "¥720", description: "上海参展", issue: false, truth: "看似超过600元标准，但有事前特殊审批和会展补充制度。" },
  { id: "BX-42017", date: "05-18", type: "出租车", amount: "¥468", description: "上海机场至苏州客户", issue: true, truth: "金额并不显眼，但航班和酒店显示员工当天在南京。" },
  { id: "BX-41881", date: "05-21", type: "材料费", amount: "¥1,960", description: "项目资料整理", issue: true, truth: "单笔低于2,000元，但两天内同商户还有三笔近似金额。" },
  { id: "BX-42306", date: "05-23", type: "出租车", amount: "¥286", description: "市内交通", issue: true, truth: "报销表看不出问题；票据二维码解析金额其实是86元。" },
  { id: "BX-42519", date: "05-26", type: "客户招待", amount: "¥988", description: "客户沟通", issue: true, truth: "周日小票含儿童套餐和生日蛋糕，客户系统无拜访记录。" },
  { id: "BX-42702", date: "05-28", type: "机票", amount: "¥5,480", description: "北京项目返程", issue: false, truth: "金额较高，但行程、项目日程和审批均一致。" },
] as const;

function ManualTriageChallenge() {
  const [picked, setPicked] = useState<Set<string>>(new Set());
  const [revealed, setRevealed] = useState(false);
  const toggle = (id: string) => setPicked(current => {
    const next = new Set(current);
    if (next.has(id)) next.delete(id); else next.add(id);
    return next;
  });
  const correct = triageClaims.filter(claim => claim.issue && picked.has(claim.id)).length;
  const falsePositives = triageClaims.filter(claim => !claim.issue && picked.has(claim.id)).length;
  const missed = triageClaims.filter(claim => claim.issue && !picked.has(claim.id)).length;

  return (
    <div className="triage-challenge">
      <div className="challenge-head"><div><span>课堂挑战</span><h3>你只有60秒：仅看报销表，选出最值得核查的记录</h3></div><p>真实任务有42,000笔，这里只截取6笔。</p></div>
      <div className="claim-table">
        <div className="claim-row claim-header"><span>选择</span><span>报销号</span><span>日期</span><span>类型</span><span>金额</span><span>报销说明</span></div>
        {triageClaims.map(claim => <button key={claim.id} disabled={revealed} className={`claim-row ${picked.has(claim.id) ? "picked" : ""} ${revealed ? claim.issue ? "is-issue" : "is-normal" : ""}`} onClick={() => toggle(claim.id)}><span><i>{picked.has(claim.id) ? "✓" : ""}</i></span><strong>{claim.id}</strong><span>{claim.date}</span><span>{claim.type}</span><b>{claim.amount}</b><span>{claim.description}</span>{revealed && <small>{claim.issue ? "需重点核查" : "合理例外"}：{claim.truth}</small>}</button>)}
      </div>
      <div className="challenge-actions"><div><strong>已选 {picked.size} 笔</strong><p>{revealed ? `找到 ${correct}/4 个真实疑点；误报 ${falsePositives} 个；遗漏 ${missed} 个。` : "不要追求猜对：先体验你现在缺少哪些信息。"}</p></div><div><button onClick={() => { setPicked(new Set()); setRevealed(false); }}>重置</button><button className="primary" onClick={() => setRevealed(true)}>揭示完整证据</button></div></div>
      {revealed && <div className="challenge-lesson"><strong>这不是“眼力比赛”。</strong><p>高金额可能是合理例外，低金额也可能隐藏真实疑点。问题不是审计人员不会判断，而是一张报销表根本没有提供足够证据。</p></div>}
    </div>
  );
}

function EvidenceTrail() {
  const [selected, setSelected] = useState(0);
  const sources = [
    { name: "报销系统", fact: "BX-42017：上海机场→苏州客户，出租车费468元。", meaning: "单看这条记录，金额不超标，说明也算合理。" },
    { name: "航班数据", fact: "员工当天的航班从北京降落南京，不是上海。", meaning: "报销起点与实际行程出现第一个矛盾。" },
    { name: "酒店记录", fact: "员工当晚在南京酒店办理入住。", meaning: "第二个独立数据源继续指向南京。" },
    { name: "客户CRM", fact: "当天没有苏州客户拜访登记，对应联系人正在休假。", meaning: "声称的业务目的缺少业务记录支持。" },
    { name: "发票查验", fact: "发票本身为真，但已被另一家公司的报销记录使用。", meaning: "“真发票”不等于“本人本次业务真实发生”。" },
  ];
  const source = sources[selected];
  return (
    <div className="evidence-demo">
      <div className="evidence-head"><span>把一笔“看起来正常”的报销查到底</span><h3>真正的问题不在一张表里，而在多个系统之间</h3></div>
      <div className="evidence-layout"><div className="evidence-sources">{sources.map((item, index) => <button key={item.name} className={selected === index ? "active" : ""} onClick={() => setSelected(index)}><b>{String(index + 1).padStart(2, "0")}</b><span>{item.name}</span><i>→</i></button>)}</div><div className="evidence-detail"><span>当前打开：{source.name}</span><strong>{source.fact}</strong><p>{source.meaning}</p></div></div>
      <div className="evidence-conclusion"><div><span>只看报销表</span><strong>金额未超标，可能直接通过</strong></div><i>→</i><div><span>串联五类证据</span><strong>行程、业务目的和票据使用相互矛盾</strong></div><i>→</i><div><span>正确系统输出</span><strong>形成可追溯疑点，交审计人员复核</strong></div></div>
    </div>
  );
}

function ProblemSection() {
  const [selected, setSelected] = useState(0);
  const questions = [
    ["真实性", "这笔费用真的发生了吗？是否属于本人、本次业务？"],
    ["合规性", "金额、类型、审批是否符合制度？有没有有效例外？"],
    ["完整性", "是否存在拆分、重复、遗漏或跨系统不一致？"],
    ["证据性", "每个疑点能否回到原始数据、制度依据和核验过程？"],
  ];
  return (
    <>
      <div className="audit-brief">
        <div className="brief-title"><span>模拟审计任务书</span><h3>A集团差旅及招待费专项审计</h3><p>费用同比增长38%，但出差人次只增长9%。管理层希望知道：费用是否真实、合规，以及是否存在拆分、重复或个人消费伪装。</p></div>
        <div className="brief-stats"><div><strong>42,000</strong><span>笔报销</span></div><div><strong>4</strong><span>名审计人员</span></div><div><strong>10</strong><span>个工作日</span></div><div><strong>7</strong><span>类数据源</span></div></div>
        <div className="brief-deliverable"><span>必须交付</span><strong>不是一万条“可能异常”的报警</strong><p>而是一份按风险排序的疑点清单：每项包含事实、适用标准、原始证据、不确定性和下一步核查建议。</p></div>
      </div>

      <ManualTriageChallenge />
      <EvidenceTrail />

      <div className="problem-anatomy"><div><span>01 · 规模</span><strong>人看不完</strong><p>平均每笔只看30秒，42,000笔也需350小时。</p></div><div><span>02 · 模式</span><strong>问题不一定在单笔</strong><p>拆分、频率和关联异常只有组合起来才看得见。</p></div><div><span>03 · 形式</span><strong>证据不只是数字</strong><p>票据图片、报销说明和制度文件都需要处理。</p></div><div><span>04 · 语境</span><strong>异常不等于错误</strong><p>展会期间、特殊审批和制度例外可能排除误报。</p></div><div><span>05 · 行动</span><strong>发现后还要核验</strong><p>需要进入不同系统取数、比对、留痕并交由人复核。</p></div></div>

      <div className="audit-questions">
        {questions.map((q, i) => <button key={q[0]} className={selected === i ? "active" : ""} onClick={() => setSelected(i)}><span>0{i + 1}</span><strong>{q[0]}</strong></button>)}
        <div><strong>{questions[selected][0]}问题</strong><p>{questions[selected][1]}</p></div>
      </div>

      <div className="success-definition"><span>什么叫“解决了问题”</span><div><strong>找得到</strong><p>尽量不漏掉真实疑点</p></div><div><strong>报得准</strong><p>减少合理例外造成的误报</p></div><div><strong>说得清</strong><p>说明事实、标准和推理过程</p></div><div><strong>查得回</strong><p>能追溯原始证据并由人复核</p></div></div>

      <div className="course-promise"><strong>接下来，我们不会突然跳到“智能体”</strong><p>我们先用最普通的代码解决确定性问题，再一步步增加从数据学习、处理图片、理解语言和调用工具的能力。每引入一种技术，只回答两个问题：它新解决了什么？它还解决不了什么？</p></div>
    </>
  );
}

function CodeLab() {
  const [amount, setAmount] = useState(720);
  const [approval, setApproval] = useState(false);
  const [specialPeriod, setSpecialPeriod] = useState(false);
  const standard = 600;
  const result = amount > standard && !approval ? "标记为待核查" : "通过规则检查";
  return (
    <div className="interactive code-lab">
      <div className="interactive-head"><div><span>互动 01</span><h3>运行一段最普通的条件代码</h3></div><small>修改左侧输入，右侧结果立即变化</small></div>
      <div className="code-layout">
        <div className="rule-inputs">
          <label><span>住宿金额</span><strong>¥{amount}</strong><input type="range" min="400" max="1000" step="20" value={amount} onChange={e => setAmount(Number(e.target.value))} /></label>
          <button className={approval ? "active" : ""} onClick={() => setApproval(!approval)}><i />存在特殊审批</button>
          <button className={specialPeriod ? "active" : ""} onClick={() => setSpecialPeriod(!specialPeriod)}><i />处于展会特殊期间</button>
          {specialPeriod && !approval && <p>注意：人知道“展会期间可能有例外”，但代码没有读取补充制度，结果不会自动改变。</p>}
        </div>
        <div className="code-panel">
          <ol>
            <li><code><b>standard</b> = 600</code><em>把标准存入变量</em></li>
            <li><code><b>if</b> amount &gt; standard:</code><em>判断条件是否为真</em></li>
            <li><code>&nbsp;&nbsp;<b>if not</b> special_approval:</code><em>继续检查审批</em></li>
            <li><code>&nbsp;&nbsp;&nbsp;&nbsp;flag = True</code><em>将结果标记为异常</em></li>
            <li><code><b>else</b>: flag = False</code><em>否则不标记</em></li>
          </ol>
          <div className={result === "标记为待核查" ? "code-result alert" : "code-result"}><span>程序输出</span><strong>{result}</strong><p>因为：金额{amount > standard ? "高于" : "未高于"}标准，{approval ? "且存在" : "且不存在"}特殊审批。</p></div>
        </div>
      </div>
    </div>
  );
}

function MachineLearningLab() {
  const [count, setCount] = useState(1);
  const [amount, setAmount] = useState(1600);
  const [sameVendor, setSameVendor] = useState(false);
  const [similarText, setSimilarText] = useState(false);
  const score = Math.min(97, Math.round(10 + count * 9 + (amount >= 1850 && amount < 2000 ? 25 : 0) + (sameVendor ? 18 : 0) + (similarText ? 16 : 0)));
  return (
    <div className="interactive ml-lab">
      <div className="interactive-head"><div><span>互动 02</span><h3>从“单笔是否超标”到“组合模式是否异常”</h3></div><small>这是课堂模拟，不代表真实模型性能</small></div>
      <div className="ml-layout">
        <div className="rule-inputs">
          <label><span>每笔金额</span><strong>¥{amount}</strong><input type="range" min="1000" max="2200" step="10" value={amount} onChange={e => setAmount(Number(e.target.value))} /></label>
          <label><span>两天内相似交易</span><strong>{count}笔</strong><input type="range" min="1" max="6" value={count} onChange={e => setCount(Number(e.target.value))} /></label>
          <button className={sameVendor ? "active" : ""} onClick={() => setSameVendor(!sameVendor)}><i />同一商户</button>
          <button className={similarText ? "active" : ""} onClick={() => setSimilarText(!similarText)}><i />报销说明相似</button>
        </div>
        <div className="score-panel">
          <span>模型输出：异常概率</span><strong>{score}<small>/100</small></strong><div className="score-track"><i style={{ width: `${score}%` }} /></div>
          <ul><li>{amount < 2000 ? "单笔没有越过2,000元阈值" : "单笔已越过2,000元阈值"}</li>{count >= 4 && <li>短时间出现多笔相似交易</li>}{sameVendor && <li>交易集中在同一商户</li>}{similarText && <li>报销说明相似度较高</li>}</ul>
          <p>模型表达的是“像不像历史异常”，不是“已经证明违规”。</p>
        </div>
      </div>
    </div>
  );
}

function TrainingProcess() {
  const [step, setStep] = useState(0);
  const steps = [
    ["准备数据", "收集历史报销记录，并由审计人员确认哪些正常、哪些异常。"],
    ["定义特征与标签", "特征X是金额、时间、商户等输入；标签y是历史确认结果。"],
    ["训练", "模型反复调整内部参数，使自己的预测逐渐接近历史答案。"],
    ["验证", "用训练时没看过的数据检查模型，避免只把历史案例背下来。"],
    ["推理", "把新的报销输入已训练模型，得到风险概率或类别。"],
  ];
  return (
    <div className="step-explainer">
      <div className="step-tabs">{steps.map((s, i) => <button key={s[0]} className={step === i ? "active" : ""} onClick={() => setStep(i)}><span>0{i + 1}</span>{s[0]}</button>)}</div>
      <div className="step-detail"><span>机器学习的第 {step + 1} 步</span><h3>{steps[step][0]}</h3><p>{steps[step][1]}</p><button onClick={() => setStep((step + 1) % steps.length)}>{step === steps.length - 1 ? "重新开始" : "下一步 →"}</button></div>
    </div>
  );
}

function NeuralNetworkLab() {
  const [step, setStep] = useState(0);
  const detail = [
    ["输入层", "把金额、时间、商户、票据像素等输入转成数字。输入层本身不作结论。"],
    ["权重", "每条连接都有一个权重，表示某个输入对后续判断影响有多大。"],
    ["隐藏层", "神经元对输入做加权计算并经过非线性变换，多层叠加后可组合出复杂特征。"],
    ["输出层", "最后输出类别或概率，例如“票据疑似修改：96%”。"],
    ["训练", "预测错误时计算损失，再用反向传播逐层调整权重。反复很多次，损失逐渐变小。"],
  ];
  return (
    <div className="interactive nn-lab">
      <div className="interactive-head"><div><span>互动 03</span><h3>把一个神经网络拆开来看</h3></div><small>示意图只解释原理，不代表真实网络规模</small></div>
      <div className="nn-layout">
        <div className={`network-plain step-${step}`}>
          <div className="nn-column input"><span>金额</span><span>日期</span><span>商户</span><span>票据像素</span><b>输入层</b></div>
          <div className="connections">{Array.from({ length: 8 }).map((_, i) => <i key={i} />)}</div>
          <div className="nn-column hidden"><span /><span /><span /><b>隐藏层 1</b></div>
          <div className="connections second">{Array.from({ length: 6 }).map((_, i) => <i key={i} />)}</div>
          <div className="nn-column hidden"><span /><span /><b>隐藏层 2</b></div>
          <div className="connections third">{Array.from({ length: 3 }).map((_, i) => <i key={i} />)}</div>
          <div className="nn-column output"><span>96%</span><b>输出层</b></div>
        </div>
        <div className="nn-explain"><span>0{step + 1}</span><h3>{detail[step][0]}</h3><p>{detail[step][1]}</p><div>{detail.map((d, i) => <button key={d[0]} className={step === i ? "active" : ""} onClick={() => setStep(i)}>{d[0]}</button>)}</div></div>
      </div>
    </div>
  );
}

function TokenLab() {
  const [tokens, setTokens] = useState<string[]>([]);
  const options = [
    [["内部控制", 35], ["资金管理", 27], ["收入确认", 19]],
    [["的", 58], ["以及", 21], ["相关", 13]],
    [["设计与运行", 44], ["有效性", 36], ["风险", 12]],
    [["是否有效", 51], ["情况", 29], ["测试", 11]],
  ];
  return (
    <div className="interactive token-lab">
      <div className="interactive-head"><div><span>互动 04</span><h3>亲手完成四次“下一个Token预测”</h3></div><button onClick={() => setTokens([])}>重置</button></div>
      <div className="sentence">根据审计计划，本次审计的重点是 {tokens.map((t, i) => <mark key={`${t}${i}`}>{t}</mark>)}<i /></div>
      {tokens.length < options.length ? <div className="token-choices">{options[tokens.length].map(([word, probability]) => <button key={word} onClick={() => setTokens([...tokens, String(word)])}><strong>{word}</strong><span>{probability}%</span><i style={{ width: `${probability}%` }} /></button>)}</div> : <p className="token-complete">连续很多次预测组合起来，形成段落、回答、摘要与代码。</p>}
    </div>
  );
}

function LlmPipeline() {
  const [step, setStep] = useState(0);
  const steps = [
    ["切成Token", "模型不直接看“整句话”，而是先把文字切分成可以处理的Token。"],
    ["变成向量", "每个Token被映射为一组数字，用来表示它在模型空间中的含义与关系。"],
    ["Attention", "注意力机制计算当前Token应该重点参考上下文中的哪些Token。"],
    ["多层Transformer", "信息经过很多层变换，逐步形成更丰富的上下文表示。"],
    ["预测下一个Token", "模型为所有候选Token计算概率，选择一个，再继续预测下一步。"],
  ];
  return (
    <div className="llm-pipeline">
      <div className="pipeline-row">{steps.map((s, i) => <button key={s[0]} className={step === i ? "active" : ""} onClick={() => setStep(i)}><span>0{i + 1}</span><strong>{s[0]}</strong></button>)}</div>
      <div className="pipeline-detail"><strong>{steps[step][0]}</strong><p>{steps[step][1]}</p></div>
    </div>
  );
}

const neuralWeights = {
  before: {
    w1: [[0.12, -0.08, 0.04], [0.03, 0.09, -0.11], [-0.05, 0.06, 0.02], [0.07, -0.03, 0.10]],
    b1: [0, 0, 0],
    w2: [[0.05], [-0.04], [0.08]],
    b2: [0],
    loss: "0.693",
  },
  after: {
    w1: [[1.84, -0.62, 0.31], [1.71, -0.48, 0.27], [0.96, 0.22, -0.15], [0.43, 1.26, 0.74]],
    b1: [-1.32, 0.38, -0.51],
    w2: [[2.41], [0.86], [-0.72]],
    b2: [-1.08],
    loss: "0.041",
  },
};

function Matrix({ name, values }: { name: string; values: number[][] | number[] }) {
  const rows = Array.isArray(values[0]) ? values as number[][] : [values as number[]];
  return (
    <div className="matrix-card">
      <span>{name}</span>
      <div>{rows.map((row, i) => <p key={i}>{row.map((value, j) => <b key={j}>{value.toFixed(2)}</b>)}</p>)}</div>
      <small>shape = [{rows.length}, {rows[0].length}]</small>
    </div>
  );
}

function NeuralCheckpointExplorer() {
  const [trained, setTrained] = useState(true);
  const weights = trained ? neuralWeights.after : neuralWeights.before;
  const losses = [0.693, 0.571, 0.438, 0.302, 0.184, 0.096, 0.041];
  return (
    <div className="model-explorer">
      <div className="model-explorer-head">
        <div><span>模型解剖台 01</span><h3>一个神经网络训练完，底层到底留下了什么？</h3></div>
        <div className="state-switch"><button className={!trained ? "active" : ""} onClick={() => setTrained(false)}>训练前</button><button className={trained ? "active" : ""} onClick={() => setTrained(true)}>训练后</button></div>
      </div>
      <div className="checkpoint-layout">
        <div className="checkpoint-architecture">
          <span>结构没有消失</span>
          <div><b>4</b><p>输入特征</p></div><i>× W1 + b1 →</i><div><b>3</b><p>隐藏神经元</p></div><i>× W2 + b2 →</i><div><b>1</b><p>风险概率</p></div>
          <blockquote>训练主要改变右侧这些权重和偏置，而不是把模型变成一组人能直接阅读的业务规则。</blockquote>
        </div>
        <div className="weight-inspector">
          <Matrix name="layer1.weight · W1" values={weights.w1} />
          <Matrix name="layer1.bias · b1" values={weights.b1} />
          <Matrix name="output.weight · W2" values={weights.w2} />
          <Matrix name="output.bias · b2" values={weights.b2} />
        </div>
      </div>
      <div className="training-result">
        <div><span>损失 Loss</span><strong>{weights.loss}</strong><p>{trained ? "模型预测与训练答案之间的差距已经明显减小。" : "随机初始化时，模型还没有学到有效关系。"}</p></div>
        <div className="loss-chart">{losses.map((loss, i) => <i key={i} style={{ height: `${Math.max(8, loss / .693 * 100)}%` }}><span>{loss.toFixed(2)}</span></i>)}</div>
        <p><strong>训练后的模型文件，本质上就是：</strong>网络结构说明 + 一组组有名称、有形状的数字矩阵。预测时，新数据会依次流过这些矩阵。</p>
      </div>
    </div>
  );
}

const tinyLlmTensors = [
  { name: "token_embedding.weight", shape: "[16, 8]", role: "把16个Token映射为8维向量", preview: [[0.18, -0.42, 0.07, 0.31], [-0.11, 0.64, 0.28, -0.09]] },
  { name: "blocks.0.attn.q_proj.weight", shape: "[8, 8]", role: "生成Query，决定当前Token要寻找什么", preview: [[0.23, -0.16, 0.41, 0.08], [0.04, 0.37, -0.29, 0.12]] },
  { name: "blocks.0.attn.k_proj.weight", shape: "[8, 8]", role: "生成Key，表示上下文Token可提供什么线索", preview: [[-0.07, 0.52, 0.19, -0.33], [0.28, -0.14, 0.06, 0.47]] },
  { name: "blocks.0.attn.v_proj.weight", shape: "[8, 8]", role: "生成Value，承载被注意力汇总的信息", preview: [[0.31, 0.09, -0.21, 0.17], [-0.26, 0.43, 0.15, 0.02]] },
  { name: "blocks.0.mlp.up_proj.weight", shape: "[32, 8]", role: "前馈网络先扩展维度，组合更复杂的特征", preview: [[0.12, -0.08, 0.37, 0.21], [0.44, 0.05, -0.18, 0.29]] },
  { name: "final_norm.weight", shape: "[8]", role: "稳定最后一层表示的数值尺度", preview: [[0.96, 1.03, 0.91, 1.08]] },
  { name: "lm_head.weight", shape: "[16, 8]", role: "把隐藏表示转换为16个候选Token的分数", preview: [[0.17, 0.39, -0.24, 0.06], [-0.35, 0.11, 0.48, 0.22]] },
];

function LlmCheckpointExplorer() {
  const [selected, setSelected] = useState(0);
  const tensor = tinyLlmTensors[selected];
  return (
    <div className="model-explorer llm-explorer">
      <div className="model-explorer-head"><div><span>模型解剖台 02</span><h3>一个大模型训练完，检查点文件里到底是什么？</h3></div><small>下面用微型Transformer说明真实大模型的同类结构</small></div>
      <div className="llm-files">
        <div><span>config.json</span><strong>结构说明</strong><p>层数、隐藏维度、注意力头数、词表大小。</p></div>
        <div><span>tokenizer.json</span><strong>Tokenizer</strong><p>文字怎样切成Token，以及Token与编号的映射。</p></div>
        <div className="main-file"><span>model.safetensors</span><strong>训练后的权重</strong><p>大量张量按名称保存；真实大模型通常会拆成多个分片。</p></div>
        <div><span>generation_config.json</span><strong>生成设置</strong><p>温度、采样、结束Token等默认设置。</p></div>
      </div>
      <div className="tensor-browser">
        <div className="tensor-list"><span>model.safetensors · 张量目录</span>{tinyLlmTensors.map((item, i) => <button key={item.name} className={selected === i ? "active" : ""} onClick={() => setSelected(i)}><strong>{item.name}</strong><small>{item.shape}</small></button>)}</div>
        <div className="tensor-detail"><span>选中的张量</span><h3>{tensor.name}</h3><p>{tensor.role}</p><div className="tensor-values">{tensor.preview.map((row, i) => <p key={i}>{row.map((value, j) => <b key={j}>{value.toFixed(2)}</b>)}</p>)}</div><small>这里只展示左上角少量数值；完整张量形状为 {tensor.shape}。</small></div>
        <div className="transformer-stack"><span>一次前向计算</span>{["Token IDs", "Embedding", "Attention", "MLP", "重复多个Block", "Norm", "LM Head", "下一个Token概率"].map((item, i) => <div key={item}><b>{String(i + 1).padStart(2, "0")}</b><p>{item}</p></div>)}</div>
      </div>
      <div className="scale-note"><strong>从“小模型”到“大模型”，核心变化主要是规模。</strong><p>真实大模型拥有更大的词表、更宽的隐藏维度、更多Transformer层和海量参数。训练后保存的仍然不是中文规则，而是数以亿计、数十亿计甚至更多的浮点数张量。模型能力来自这些参数共同形成的分布式表示。</p></div>
    </div>
  );
}

const kernelExamples = {
  ml: {
    label: "训练机器学习分类器",
    code: `# 真实运行：用历史案例训练一个简单分类模型
import math

# X的三个特征：接近审批阈值、短期交易频率、是否同一商户
# y是审计人员历史确认的结果：0=普通，1=需要重点核查
data = [
    ([0.10, 0.17, 0], 0),
    ([0.75, 0.17, 0], 0),
    ([0.82, 0.33, 0], 0),
    ([0.88, 0.67, 1], 1),
    ([0.92, 0.83, 1], 1),
    ([0.70, 1.00, 1], 1),
]

def sigmoid(z):
    return 1 / (1 + math.exp(-z))

# 模型要学习的参数：3个特征权重 + 1个偏置
weights = [0.0, 0.0, 0.0]
bias = 0.0
learning_rate = 0.8

for epoch in range(1201):
    grad_w = [0.0, 0.0, 0.0]
    grad_b = 0.0
    loss = 0.0

    for features, label in data:
        score = sum(w*x for w, x in zip(weights, features)) + bias
        prediction = sigmoid(score)
        loss += -(label*math.log(prediction + 1e-9) +
                  (1-label)*math.log(1-prediction + 1e-9))
        error = prediction - label
        for i in range(3):
            grad_w[i] += error * features[i]
        grad_b += error

    for i in range(3):
        weights[i] -= learning_rate * grad_w[i] / len(data)
    bias -= learning_rate * grad_b / len(data)

    if epoch in (0, 20, 100, 400, 1200):
        print(f"epoch={epoch:4d}  loss={loss/len(data):.4f}")

print("\\n模型学到的权重：", [round(w, 3) for w in weights])
print("模型学到的偏置：", round(bias, 3))

# 对一组从未参与训练的新报销做预测
new_claim = [0.90, 0.75, 1]
risk = sigmoid(sum(w*x for w, x in zip(weights, new_claim)) + bias)
print("新报销特征：", new_claim)
print("预测的重点核查概率：", f"{risk:.1%}")
print("注意：这是风险预测，不是违规结论。")`,
  },
  neural: {
    label: "训练两层神经网络",
    code: `# 真实运行：用纯Python训练一个 2→2→1 的小神经网络
import math, random
random.seed(7)

# 两个特征：接近审批阈值、同一商户；标签：是否需要重点核查
data = [([0, 0], 0), ([0, 1], 0), ([1, 0], 0), ([1, 1], 1)]

def sigmoid(x):
    return 1 / (1 + math.exp(-x))

# W1: 2×2, b1: 2, W2: 2×1, b2: 1
W1 = [[random.uniform(-.5, .5) for _ in range(2)] for _ in range(2)]
b1 = [0.0, 0.0]
W2 = [random.uniform(-.5, .5) for _ in range(2)]
b2 = 0.0
lr = 1.2

for epoch in range(2001):
    gW1 = [[0.0, 0.0], [0.0, 0.0]]
    gb1 = [0.0, 0.0]
    gW2 = [0.0, 0.0]
    gb2 = 0.0
    loss = 0.0

    for x, y in data:
        h = [sigmoid(x[0]*W1[0][j] + x[1]*W1[1][j] + b1[j]) for j in range(2)]
        pred = sigmoid(h[0]*W2[0] + h[1]*W2[1] + b2)
        loss += (pred - y) ** 2

        d_out = 2 * (pred - y) * pred * (1 - pred)
        for j in range(2):
            gW2[j] += d_out * h[j]
            d_h = d_out * W2[j] * h[j] * (1 - h[j])
            for i in range(2):
                gW1[i][j] += d_h * x[i]
            gb1[j] += d_h
        gb2 += d_out

    for i in range(2):
        for j in range(2):
            W1[i][j] -= lr * gW1[i][j] / len(data)
    for j in range(2):
        b1[j] -= lr * gb1[j] / len(data)
        W2[j] -= lr * gW2[j] / len(data)
    b2 -= lr * gb2 / len(data)

    if epoch in (0, 10, 100, 500, 2000):
        print(f"epoch={epoch:4d}  loss={loss/len(data):.5f}")

print("\\n训练后的 state_dict：")
print("layer1.weight =", [[round(v, 3) for v in row] for row in W1])
print("layer1.bias   =", [round(v, 3) for v in b1])
print("output.weight =", [round(v, 3) for v in W2])
print("output.bias   =", round(b2, 3))

print("\\n四种输入的预测：")
for x, y in data:
    h = [sigmoid(x[0]*W1[0][j] + x[1]*W1[1][j] + b1[j]) for j in range(2)]
    pred = sigmoid(h[0]*W2[0] + h[1]*W2[1] + b2)
    print(x, "真实标签=", y, "预测概率=", round(pred, 3))`,
  },
  language: {
    label: "训练极小语言模型",
    code: `# 真实运行：训练一个极小的“下一个字符”语言模型
# 它不是Transformer，但能展示Tokenizer、训练、权重和生成的基本链条
import random
random.seed(3)

corpus = "审计需要证据。审计需要核验。智能体需要工具。结论需要复核。"
tokens = sorted(set(corpus))
token_to_id = {token: i for i, token in enumerate(tokens)}

# 训练：统计每个字符后面出现另一个字符的次数
counts = [[1 for _ in tokens] for _ in tokens]  # 加1平滑
for current, following in zip(corpus, corpus[1:]):
    counts[token_to_id[current]][token_to_id[following]] += 1

# 归一化后，这张概率表就是这个极小模型训练出的“权重”
weights = []
for row in counts:
    total = sum(row)
    weights.append([value / total for value in row])

checkpoint = {
    "config": {"model_type": "bigram", "vocab_size": len(tokens)},
    "tokenizer": token_to_id,
    "bigram.weight": weights,
}

print("Tokenizer：", checkpoint["tokenizer"])
print("bigram.weight shape =", (len(weights), len(weights[0])))
print("权重矩阵前两行预览：")
for row in weights[:2]:
    print([round(v, 3) for v in row[:8]])

text = "审"
for _ in range(18):
    row = weights[token_to_id[text[-1]]]
    next_token = random.choices(tokens, weights=row, k=1)[0]
    text += next_token
print("\\n生成结果：", text)
print("\\n真实LLM用多层Transformer张量替代这张简单概率表。")`,
  },
  agent: {
    label: "运行智能体循环",
    code: `# 真实运行：一个最小智能体循环
evidence = []
tools = {
    "航班查询": "员工当天航班落地南京",
    "酒店查询": "员工当晚入住南京酒店",
    "客户查询": "当天没有苏州客户拜访记录",
    "发票查验": "发票已在另一家公司出现",
}

plan = ["航班查询", "酒店查询", "客户查询", "发票查验"]
goal = "核实上海机场至苏州的出租车费"
print("目标：", goal)

for step, tool_name in enumerate(plan, 1):
    print(f"\\n第{step}步：调用{tool_name}")
    observation = tools[tool_name]
    evidence.append(observation)
    print("观察结果：", observation)
    print("当前证据数：", len(evidence))

print("\\n停止条件：已取得四类独立证据")
print("系统动作：提交审计人员复核，不自动认定违规。")`,
  },
  rule: {
    label: "运行普通规则",
    code: `# 真实运行：普通代码规则
standard = 600
amount = 720
special_approval = False

if amount > standard and not special_approval:
    result = "标记为待核查"
else:
    result = "通过规则检查"

print("住宿标准：", standard)
print("报销金额：", amount)
print("程序结果：", result)`,
  },
} as const;

type KernelStatus = "loading" | "ready" | "running" | "error";
type KernelRunResult = { stdout?: string; stderr?: string; value?: string; error?: string };
type KernelContextValue = {
  status: KernelStatus;
  message: string;
  run: (code: string) => Promise<KernelRunResult>;
  restart: () => void;
};

const PythonKernelContext = createContext<KernelContextValue | null>(null);

function PythonKernelProvider({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<KernelStatus>("loading");
  const [message, setMessage] = useState("正在加载浏览器Python运行时……");
  const workerRef = useRef<Worker | null>(null);
  const pendingRef = useRef<((result: KernelRunResult) => void) | null>(null);

  const startKernel = useCallback(() => {
    if (pendingRef.current) {
      pendingRef.current({ error: "Kernel已重启，本次运行已取消。" });
      pendingRef.current = null;
    }
    workerRef.current?.terminate();
    setStatus("loading");
    setMessage("正在加载浏览器Python运行时……");

    let worker: Worker;
    try {
      worker = new Worker("/pyodide-worker.mjs", { type: "module" });
    } catch (error) {
      const detail = error instanceof Error ? error.message : "当前浏览器不支持模块Worker";
      setStatus("error");
      setMessage(`Kernel创建失败：${detail}`);
      return;
    }

    workerRef.current = worker;
    worker.onmessage = (event: MessageEvent) => {
      const result = event.data;
      if (result.type === "ready") {
        setStatus("ready");
        setMessage("Python Kernel 已就绪。");
      } else if (result.type === "result") {
        setStatus("ready");
        setMessage("Python Kernel 已就绪。");
        pendingRef.current?.(result);
        pendingRef.current = null;
      } else if (result.type === "run-error") {
        setStatus("ready");
        setMessage("上次代码有错，修改后可继续运行。");
        pendingRef.current?.(result);
        pendingRef.current = null;
      } else if (result.type === "init-error") {
        setStatus("error");
        setMessage(result.error || "Kernel初始化失败，请检查网络后重试。");
      }
    };
    worker.onerror = (event) => {
      const detail = `Kernel加载失败：${event.message || "请检查网络后重试"}`;
      setStatus("error");
      setMessage(detail);
      pendingRef.current?.({ error: detail });
      pendingRef.current = null;
    };
  }, []);

  useEffect(() => {
    startKernel();
    return () => workerRef.current?.terminate();
  }, [startKernel]);

  const run = useCallback((code: string) => new Promise<KernelRunResult>((resolve) => {
    if (status !== "ready" || !workerRef.current) {
      resolve({ error: message });
      return;
    }
    pendingRef.current = resolve;
    setStatus("running");
    setMessage("正在运行代码……");
    workerRef.current.postMessage({ type: "run", code });
  }), [message, status]);

  return <PythonKernelContext.Provider value={{ status, message, run, restart: startKernel }}>{children}</PythonKernelContext.Provider>;
}

function InlinePythonLab({ example, guide }: { example: keyof typeof kernelExamples; guide: string }) {
  const item = kernelExamples[example];
  const kernel = useContext(PythonKernelContext);
  const [code, setCode] = useState(item.code);
  const [output, setOutput] = useState("Python环境正在加载。首次打开需要下载浏览器运行时……");

  useEffect(() => {
    if (!kernel) return;
    if (output.startsWith("Python环境") || output.startsWith("正在重启")) {
      if (kernel.status === "ready") setOutput("Python Kernel 已就绪。点击“运行代码”。");
      if (kernel.status === "error") setOutput(kernel.message);
    }
  }, [kernel, output]);

  if (!kernel) return null;

  const runCode = async () => {
    setOutput("正在运行……");
    const result = await kernel.run(code);
    const parts = [result.stdout, result.stderr, result.value ? `返回值：${result.value}` : "", result.error].filter(Boolean);
    setOutput(parts.join("\n") || "代码运行完成，没有输出。");
  };

  const restart = () => {
    setOutput("正在重启Python Kernel并清空全部变量……");
    kernel.restart();
  };

  return (
    <div className="python-lab inline-python">
      <div className="python-head"><div><span>本节可运行代码</span><h3>{item.label}</h3></div><div className={`kernel-status ${kernel.status}`}><i />{kernel.status === "loading" ? "加载中" : kernel.status === "ready" ? "已就绪" : kernel.status === "running" ? "运行中" : "发生错误"}</div></div>
      <div className="python-workspace">
        <div className="editor-pane"><div><span>Python代码</span><small>可直接修改后重新运行</small></div><textarea spellCheck={false} value={code} onChange={(event) => setCode(event.target.value)} aria-label={`${item.label}Python代码编辑器`} /><footer><button className="run" disabled={kernel.status !== "ready"} onClick={runCode}>▶ 运行代码</button><button onClick={() => setCode(item.code)}>恢复示例</button><button onClick={restart}>重启内核</button></footer></div>
        <div className="output-pane"><div><span>运行输出</span><small>stdout / stderr</small></div><pre>{output}</pre></div>
      </div>
      <div className="kernel-note"><strong>讲解时请学员关注什么</strong><p>{guide}</p></div>
    </div>
  );
}

const agentTraceSteps = [
  ["目标", "核实BX-42017机场出租车费是否与真实行程一致。"],
  ["读取报销工具", "报销称“上海机场至苏州客户公司”，金额468元。"],
  ["模型判断", "缺少实际抵达城市、住宿地点、客户拜访和发票状态。"],
  ["航班工具", "员工当天航班实际降落南京。"],
  ["酒店工具", "员工当晚在南京办理入住。"],
  ["客户系统", "当天无苏州客户拜访登记，联系人处于休假。"],
  ["发票查验", "发票真实，但已在另一家公司出现。"],
  ["控制规则", "证据达到升级阈值；不能自行定性，提交审计人员复核。"],
] as const;

function AgentTrace() {
  const [visible, setVisible] = useState(0);
  const [auto, setAuto] = useState(false);
  const box = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!auto) return;
    if (visible >= agentTraceSteps.length) {
      setAuto(false);
      return;
    }
    const id = window.setTimeout(() => setVisible(v => v + 1), 850);
    return () => window.clearTimeout(id);
  }, [auto, visible]);

  useEffect(() => {
    const log = box.current;
    if (!log) return;
    log.scrollTop = log.scrollHeight;
  }, [visible]);

  const toggleAutoRun = () => {
    if (auto) {
      setAuto(false);
      return;
    }
    if (visible >= agentTraceSteps.length) setVisible(0);
    setAuto(true);
  };

  return (
    <div className="interactive agent-trace">
      <div className="interactive-head"><div><span>互动 05</span><h3>看智能体如何根据结果决定下一步</h3></div><div><button onClick={() => { setVisible(0); setAuto(false); }}>重置</button><button className="primary" onClick={toggleAutoRun}>{auto ? "暂停" : visible >= agentTraceSteps.length ? "重新运行" : "自动运行"}</button></div></div>
      <div className="trace-layout">
        <div className="agent-anatomy"><span>智能体的组成</span>{[["目标", "完成什么"], ["大模型", "理解与决策"], ["工具", "查询与执行"], ["状态", "记住进展"], ["控制", "权限与停止"]].map(x => <div key={x[0]}><strong>{x[0]}</strong><small>{x[1]}</small></div>)}</div>
        <div className="trace-log" ref={box}>{visible === 0 && <p className="trace-empty">点击“自动运行”，逐步观察工具调用和反馈。</p>}{agentTraceSteps.slice(0, visible).map((x, i) => <div key={x[0]} className={i === visible - 1 ? "latest" : ""}><span>{String(i + 1).padStart(2, "0")}</span><p><strong>{x[0]}</strong><small>{x[1]}</small></p></div>)}</div>
      </div>
      <div className="trace-footer"><button disabled={visible >= agentTraceSteps.length} onClick={() => setVisible(Math.min(agentTraceSteps.length, visible + 1))}>单步执行</button><p>{visible >= agentTraceSteps.length ? "当前状态：等待人工复核。异常不是错误，风险不是舞弊。" : "智能体没有把所有步骤预先写死，而是读取上一步结果后决定下一步。"}</p></div>
    </div>
  );
}

function CaseMatrix() {
  const [stage, setStage] = useState<StageKey>("code");
  const [selected, setSelected] = useState("A");
  const currentStage = stages.find(s => s.key === stage)!;
  const item = auditCases.find(c => c.id === selected)!;
  return (
    <div className="case-matrix">
      <div className="matrix-tabs">{stages.map(s => <button key={s.key} className={stage === s.key ? "active" : ""} onClick={() => setStage(s.key)}>{s.name}</button>)}</div>
      <div className="matrix-summary"><span>当前系统主要回答</span><strong>{currentStage.question}</strong><p>能看见：{currentStage.sees}。局限：{currentStage.limit}。</p></div>
      <div className="matrix-body"><div className="case-list">{auditCases.map(c => <button key={c.id} className={selected === c.id ? "active" : ""} onClick={() => setSelected(c.id)}><span>{c.id}</span><strong>{c.title}</strong><small className={`state-${c.state[stage]}`}>{c.state[stage]}</small></button>)}</div><div className="case-detail"><span>事项 {item.id}</span><h3>{item.title}</h3><div><small>已知事实</small><p>{item.fact}</p></div><div><small>完整核验后的真相</small><p>{item.truth}</p></div><blockquote><strong>{currentStage.name}的结果：{item.state[stage]}</strong><p>{caseExplanation(item.id, stage)}</p></blockquote></div></div>
    </div>
  );
}

function caseExplanation(id: string, stage: StageKey) {
  const text: Record<string, Record<StageKey, string>> = {
    A: { code: "三个字段完全一致，精确规则已经足够可靠。", ml: "重复字段也是极强的风险特征。", nn: "OCR可从不同图片中提取相同要素。", llm: "能解释重复原因，但没有必要替代简单规则。", agent: "调用重复检测工具并并列展示原始凭证。" },
    B: { code: "720大于600，代码不知道还有特殊制度。", ml: "历史超标准常对应异常，仍可能高风险。", nn: "能读出金额，但不理解例外条款。", llm: "综合有效制度和事前审批后排除误报。", agent: "自动查询交易日对应制度与审批，保存排除依据。" },
    C: { code: "四笔都小于2,000，单笔规则全部放过。", ml: "同商户、短时间、近阈值的组合像历史拆分模式。", nn: "还能识别多段报销说明高度相似。", llm: "把模式与审批制度联系起来并解释核查理由。", agent: "继续调取付款和参与人员记录，形成证据链。" },
    D: { code: "表格只记录286，金额本身未触发条件。", ml: "金额略高只能形成弱提示。", nn: "图像模型发现数字与二维码信息矛盾。", llm: "能解释矛盾并提出查验原票的建议。", agent: "实际调用发票查验服务并保存返回记录。" },
    E: { code: "周末消费只能触发提示，不能说明用途。", ml: "时间与金额偏离习惯，但真相不清楚。", nn: "识别出儿童套餐，却不理解完整业务语境。", llm: "综合小票、说明、日历和联系人状态识别矛盾。", agent: "主动查询拜访和支付记录，再请求访谈。" },
    F: { code: "金额、审批等字段看起来都正常。", ml: "单笔模式在历史数据中也不突出。", nn: "发票图片本身可能完全真实。", llm: "如果资料被人工提供，能看出矛盾，但不会天然取数。", agent: "依次查询航班、酒店、客户和发票系统，闭合证据。" },
  };
  return text[id][stage];
}

function DesignSteps() {
  const [active, setActive] = useState(0);
  const steps = [
    ["选场景", "从高频、边界清楚、有人复核的任务开始；不要从“万能审计智能体”开始。", "例如：差旅报销初审，而不是“完成整个审计项目”。"],
    ["定输入", "列出允许读取的制度、数据、凭证、历史案例及其版本。", "同时明确哪些敏感数据不能进入模型环境。"],
    ["配工具", "只给完成任务所需的最小工具和最小权限。", "查询可以自动；写入、发送、删除通常需要审批。"],
    ["定输出", "规定每条疑点必须包含事实、标准、证据、不确定性和下一步。", "禁止把概率直接改写成“违规”或“舞弊”。"],
    ["设关口", "在高风险结论、正式底稿、对外发送等节点设置人工确认。", "记录每次模型输入、工具调用、结果和人工决定。"],
    ["做评价", "用真实样本测试召回、误报、证据正确率、时间节省和稳定性。", "先影子运行，再小范围使用，最后逐步扩大。"],
  ];
  return (
    <div className="design-steps"><div className="design-list">{steps.map((s, i) => <button key={s[0]} className={active === i ? "active" : ""} onClick={() => setActive(i)}><span>0{i + 1}</span><strong>{s[0]}</strong></button>)}</div><div className="design-detail"><span>审计智能体建设步骤 {active + 1}/6</span><h3>{steps[active][0]}</h3><p>{steps[active][1]}</p><blockquote>{steps[active][2]}</blockquote><button onClick={() => setActive((active + 1) % steps.length)}>{active === steps.length - 1 ? "重新查看" : "下一步 →"}</button></div></div>
  );
}

function Quiz() {
  const qs = [
    ["普通代码与机器学习最核心的区别？", ["代码更快", "代码执行人写的逻辑，ML从案例中学习参数", "ML不需要人参与"], 1],
    ["神经网络的“训练”主要在做什么？", ["不断调整权重以减小预测误差", "把全部答案存在数据库", "让计算机运行更快"], 0],
    ["大模型生成流畅答案说明什么？", ["事实一定正确", "审计证据充分", "语言模式合理，但事实仍需核验"], 2],
    ["聊天应用具备什么特征后更接近智能体？", ["界面好看", "能调用工具并依据反馈继续行动", "回答字数更多"], 1],
    ["审计智能体输出高风险后应当？", ["直接定性舞弊", "保留证据与不确定性并提交人工复核", "自动删除记录"], 1],
  ] as const;
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const score = Object.entries(answers).filter(([i, a]) => qs[Number(i)][2] === a).length;
  return <div className="quiz"><div className="quiz-score"><span>结课自测</span><strong>{score}<small>/5</small></strong><p>{Object.keys(answers).length === 5 ? score === 5 ? "已经掌握整条能力链。" : "查看标出的正确答案，再回顾相应章节。" : "完成五道题，检查概念是否真正说清楚。"}</p></div><div>{qs.map((q, i) => <section key={q[0]}><p><span>0{i + 1}</span>{q[0]}</p><div>{q[1].map((a, j) => { const answered = answers[i] !== undefined; const cls = answers[i] === j ? (q[2] === j ? "correct" : "wrong") : answered && q[2] === j ? "answer" : ""; return <button className={cls} key={a} onClick={() => setAnswers({ ...answers, [i]: j })}>{a}</button>; })}</div></section>)}</div></div>;
}

export default function Home() {
  const [notes, setNotes] = useState(false);
  return (
    <PythonKernelProvider>
    <main id="top" className={notes ? "show-notes" : ""}>
      <Header notes={notes} setNotes={setNotes} />
      <aside className="sidenav"><div><span>2小时课程</span><strong>从规则到智能体</strong></div><nav>{nav.map((x, i) => <a href={`#${x[0]}`} key={x[0]}><span>{String(i + 1).padStart(2, "0")}</span><b>{x[1]}</b><small>{x[2]}</small></a>)}</nav></aside>
      <div className="page">
        <section className="hero">
          <p>面向审计人员的2小时人工智能基础课</p>
          <h1>42,000笔报销，4名审计人员，10个工作日。<br />怎样找到真正值得核查的问题？</h1>
          <div className="hero-lead">我们先不谈AI、模型或智能体。先把审计目标、数据、时间限制和应交付的证据说清楚，再一步步引入技术。</div>
          <div className="hero-scenario"><div><span>数据规模</span><strong>42,000笔</strong><small>差旅及招待费报销</small></div><div><span>人力限制</span><strong>4人 × 10天</strong><small>不可能靠人工逐笔深查</small></div><div><span>证据分布</span><strong>7类数据源</strong><small>表格、图片、制度与业务系统</small></div><div><span>最终交付</span><strong>可复核疑点</strong><small>不是笼统的“AI风险分”</small></div></div>
          <a className="hero-start" href="#problem">先进入这个审计任务 <span>↓</span></a>
        </section>

        <section id="problem" className="lesson">
          <SectionTitle no="01" time="15分钟" title="开始之前，完整面对我们要解决的问题" intro="技术不是起点。先亲手做一次筛查，再看一笔报销的证据如何散落在不同系统中，最后定义什么才算把问题解决。" />
          <ProblemSection />
          <TeacherNote>先不讲任何技术名称。给学员1分钟完成筛查挑战，让大家为自己的选择说理由；揭示证据后追问：“你是判断错了，还是当时根本没有足够信息？”再逐一打开BX-42017的五类数据，把“筛查—取证—复核”的完整任务讲清楚。</TeacherNote>
        </section>

        <section id="code" className="lesson">
          <SectionTitle no="02" time="16分钟" title="第一步：普通代码和规则系统是什么" intro="在谈AI之前，先理解最传统的计算机程序：人把步骤和条件写清楚，计算机机械、快速、准确地执行。" />
          <Definition term="计算机程序" simple="一组明确的指令，告诉计算机先做什么、后做什么，以及遇到不同条件时怎么办。" precise="程序由变量、条件、循环、函数等结构组成；同样的输入和同样的代码，通常得到同样的输出。" />
          <div className="concept-grid four"><div><span>变量</span><strong>保存数据</strong><p>例如金额、日期、审批状态。</p></div><div><span>条件</span><strong>进行判断</strong><p>如果金额超标，就进入下一步。</p></div><div><span>循环</span><strong>重复处理</strong><p>对42,000笔报销逐笔执行。</p></div><div><span>函数</span><strong>封装步骤</strong><p>把“检查住宿标准”写成可复用模块。</p></div></div>
          <CodeLab />
          <InlinePythonLab example="rule" guide="先看人写好的 standard、amount 和 special_approval，再看 if / else 怎样产生确定结果。尝试改动金额或审批状态，输出只会按人事先写好的条件变化。" />
          <div className="content-block"><h3>规则系统的本质</h3><p>规则系统把业务人员已经知道的判断逻辑写成代码。审计人员先定义“什么情况值得检查”，程序再批量执行。它是自动化，但不一定属于机器学习。</p><div className="two-col"><div><strong>它非常擅长</strong><ul><li>金额、日期和数量的精确比较</li><li>发票号码完全重复</li><li>审批缺失、字段为空</li><li>确定性强、必须一致执行的制度条件</li></ul></div><div><strong>它无法自己做到</strong><ul><li>从历史案例中总结新的规律</li><li>理解图片和自然语言</li><li>发现没有预先写出的组合模式</li><li>自动理解制度中的复杂例外</li></ul></div></div></div>
          <div className="important"><strong>必须记住</strong><p>代码不是AI的反义词。机器学习、大模型和智能体最终也都由代码运行；区别在于，一部分判断逻辑不再由程序员逐条写出，而是由模型从数据中学习得到。</p></div>
          <Bridge from="规则系统的瓶颈" problem="四笔费用分别是1,960、1,980、1,950、1,990元，全部低于2,000元审批阈值。单笔规则全部放过，但组合起来很可疑。" to="机器学习" />
          <TeacherNote>逐行解释互动代码。强调 specialPeriod 按钮不会改变结果，因为代码根本没有使用这个变量。计算机不会因为“人觉得有关系”就自动理解。</TeacherNote>
        </section>

        <section id="ml" className="lesson">
          <SectionTitle no="03" time="16分钟" title="第二步：什么是机器学习" intro="当人很难把所有模式写成规则时，可以给机器历史案例，让模型从数据中学习输入和结果之间的统计关系。" />
          <Definition term="机器学习（Machine Learning）" simple="不给计算机写出每一条判断规则，而是给它许多案例，让它自己总结哪些输入通常对应哪些结果。" precise="机器学习使用数据和算法估计模型参数，使模型能够对训练时没有见过的新数据进行预测、分类或排序。" />
          <div className="notation"><div><span>输入 X</span><strong>特征</strong><p>金额、时间、商户、频率、说明相似度……</p></div><i>→</i><div><span>模型 f</span><strong>学习关系</strong><p>训练得到的内部参数，不是人逐条写出的规则。</p></div><i>→</i><div><span>输出 ŷ</span><strong>预测</strong><p>正常/异常，或0—100的风险概率。</p></div><div className="label"><span>训练时还需要</span><strong>标签 y</strong><p>历史上经过确认的真实结果。</p></div></div>
          <TrainingProcess />
          <MachineLearningLab />
          <InlinePythonLab example="ml" guide="找到 X（三个特征）、y（历史答案）、weights（模型自己学到的参数）和最后的概率输出。观察 loss 逐渐下降，说明训练正在使预测更接近历史答案。" />
          <div className="content-block"><h3>两类常见机器学习</h3><div className="two-col"><div><strong>监督学习：有历史答案</strong><p>用审计人员已确认的正常和异常案例训练分类模型。新交易进来后，模型给出风险概率。</p><small>类比：老师先提供带答案的练习题。</small></div><div><strong>无监督学习：没有标准答案</strong><p>让算法按相似性分组或找离群点，发现从未被写成标签的新模式。</p><small>类比：在人群中寻找行为明显不同的个体。</small></div></div></div>
          <div className="metric-row"><div><strong>查准率</strong><p>系统报出的疑点中，有多少最后真的值得查？</p></div><div><strong>召回率</strong><p>所有真实问题中，系统究竟找到了多少？</p></div><div><strong>为什么两者都要看</strong><p>只追求少误报，可能漏掉问题；只追求不遗漏，可能把所有记录都报警。</p></div></div>
          <Bridge from="机器学习的瓶颈" problem="表格里只写着“出租车费286元”。真正的异常藏在票据图片中：数字2的字体不一致，二维码金额其实是86元。结构化特征里没有这些信息。" to="神经网络与深度学习" />
          <TeacherNote>把“特征”和“标签”讲透。可以让学员说出三个可能有用的报销特征，再追问：这些特征是否可能对某类员工产生偏差？由此引出数据质量与模型偏差。</TeacherNote>
        </section>

        <section id="nn" className="lesson">
          <SectionTitle no="04" time="22分钟" title="第三步：什么是神经网络和深度学习" intro="神经网络仍然属于机器学习。变化在于，它可以从原始数据中逐层学习特征，不必完全依赖人先把特征整理好。" />
          <Definition term="人工神经网络" simple="许多简单计算单元连接成层，输入经过一层层加权和变换，最后产生预测结果。" precise="神经网络是可微分的参数化函数；训练通过损失函数衡量错误，再用反向传播和优化算法调整大量权重。" />
          <div className="equation"><span>一个神经元做的事</span><strong>输入 × 权重，全部相加，再经过一个非线性函数</strong><code>output = activation(w₁x₁ + w₂x₂ + … + bias)</code><p>不要求学员计算公式，只要理解：权重表示影响大小；训练就是不断调整这些权重。</p></div>
          <NeuralNetworkLab />
          <NeuralCheckpointExplorer />
          <InlinePythonLab example="neural" guide="代码中 W1、b1、W2、b2 就是神经网络训练完后要保存的参数。先运行看 loss 下降，再把训练轮数2001改成10，比较参数和预测概率。" />
          <div className="training-loop"><span>一次训练循环</span>{[["1", "做预测"], ["2", "与正确答案比较"], ["3", "计算损失 Loss"], ["4", "反向传播误差"], ["5", "微调每个权重"], ["6", "重复很多轮"]].map((x, i) => <div key={x[0]}><b>{x[0]}</b><p>{x[1]}</p>{i < 5 && <i>→</i>}</div>)}</div>
          <div className="content-block"><h3>为什么叫“深度”学习</h3><p>“深度”主要指神经网络有很多层。浅层可能学习边缘和线条，中间层组合成数字、文字、版面，更深层再组合成票据类型、金额区域或修改痕迹。</p><div className="feature-layers"><span>像素</span><i>→</i><span>边缘</span><i>→</i><span>数字与文字</span><i>→</i><span>版面区域</span><i>→</i><span>票据异常概率</span></div></div>
          <div className="important"><strong>训练与推理不是一回事</strong><p><b>训练</b>是用大量数据反复调整权重，成本高、时间长；<b>推理</b>是训练完成后，把新输入交给模型得到结果。我们日常使用大模型聊天，通常处于推理阶段。</p></div>
          <Bridge from="深度学习的瓶颈" problem="视觉模型识别出了“儿童套餐”和“生日蛋糕”，但它还不能完整解释：为什么这些内容与客户招待目的矛盾？特殊审批又为什么能使超标准住宿变得合理？" to="大语言模型" />
          <TeacherNote>避免把神经网络讲成“电子大脑”。它本质上仍是大量数值运算。用“学习调音台旋钮”比喻权重：预测错了，就一点点调整许多旋钮。</TeacherNote>
        </section>

        <section id="llm" className="lesson">
          <SectionTitle no="05" time="24分钟" title="第四步：大模型到底是什么" intro="大语言模型不是另一个完全不同的技术。它本质上是规模很大的深度神经网络，通常采用Transformer架构，在海量文本上训练。" />
          <Definition term="大语言模型（LLM）" simple="一个读过海量文字、能够根据上下文继续生成文字的神经网络。" precise="大语言模型通过预训练学习Token序列的概率分布，并在指令微调、偏好对齐等阶段形成更适合问答和任务执行的行为。" />
          <TokenLab />
          <LlmPipeline />
          <LlmCheckpointExplorer />
          <InlinePythonLab example="language" guide="先看 Tokenizer 如何把字符映射成编号，再看训练如何得到 bigram.weight，最后看模型怎样逐个生成字符。这是用于讲原理的微型模型；真实LLM用多层Transformer张量完成更复杂的下一Token预测。" />
          <div className="three-stages"><div><span>阶段 1</span><strong>预训练</strong><p>在海量文本上反复预测下一个Token，学习语言、知识表达和关系模式。</p></div><div><span>阶段 2</span><strong>指令训练与对齐</strong><p>学习按照人的指令回答，减少有害或明显不合适的输出。</p></div><div><span>阶段 3</span><strong>推理使用</strong><p>用户给出提示词和上下文，模型逐Token生成当前回答。</p></div></div>
          <div className="content-block"><h3>为什么“预测下一个Token”能表现出这么多能力</h3><p>要准确预测大量复杂文本的后续内容，模型必须学习词语关系、语法结构、常见知识表达、文档格式和许多任务模式。当模型、数据和训练规模足够大时，连续预测就会表现为总结、翻译、问答、写作、代码生成和一定程度的推理能力。</p><p>但这不意味着模型像数据库一样保存并核验每个事实，也不意味着它真正理解世界的方式与人完全相同。</p></div>
          <div className="attention-box"><span>Transformer里的关键思想：Attention</span><h3>理解一句话时，当前词应该重点参考前文中的哪些词？</h3><p>注意力机制为上下文中的Token计算相关程度。例如理解“这笔住宿超标，但已经取得特殊审批”时，“但”后面的信息会显著改变最终判断。</p></div>
          <div className="llm-addons"><div><span>提示词</span><strong>把任务讲清楚</strong><p>规定角色、目标、约束和输出格式。</p></div><div><span>上下文</span><strong>把当前资料给模型</strong><p>合同、制度、底稿、访谈记录。</p></div><div><span>RAG知识库</span><strong>先检索，再回答</strong><p>找出相关制度片段，并保留出处。</p></div><div><span>工具</span><strong>让模型能查和算</strong><p>数据库、程序、发票查验服务。</p></div></div>
          <div className="hallucination"><div><strong>为什么会幻觉</strong><p>模型首先生成“统计上合理的后续文字”，而不是天然从权威系统提取经核验的事实。当资料不足时，它仍可能生成听起来完整的回答。</p></div><div><span>语言流畅</span><i>≠</i><span>事实正确</span><i>≠</i><span>证据充分</span><i>≠</i><span>审计结论</span></div></div>
          <Bridge from="大模型的瓶颈" problem="大模型能够告诉你“应该核对航班、酒店、拜访记录和发票状态”，但它不会天然进入企业系统查询，也不会自动根据查询结果继续下一步。" to="智能体" />
          <TeacherNote>一定把“大模型是神经网络”讲清楚。Token实验后说明真实模型词表、层数和参数规模巨大。讲Attention时只讲“相关性与信息选择”，不进入矩阵公式。</TeacherNote>
        </section>

        <section id="agent" className="lesson">
          <SectionTitle no="06" time="14分钟" title="第五步：大模型怎样变成智能体" intro="大模型是负责理解和生成的模型；智能体是围绕目标运行的系统。关键变化不是回答更长，而是能够使用工具并形成行动闭环。" />
          <Definition term="智能体（Agent）" simple="让大模型不只回答问题，还能为了完成目标，判断下一步、调用工具、读取结果并继续行动。" precise="智能体是能够感知环境状态、根据目标选择行动、通过工具影响或查询环境，并依据反馈更新状态的受控软件系统。" />
          <div className="model-system"><div><span>大模型</span><strong>一个模型</strong><p>输入上下文，输出文字或结构化指令。</p><small>擅长：理解、归纳、生成、规划建议</small></div><i>≠</i><div><span>智能体</span><strong>一个运行系统</strong><p>模型 + 目标 + 工具 + 状态 + 控制机制。</p><small>擅长：围绕目标持续完成多步骤任务</small></div></div>
          <div className="agent-loop"><span>智能体的基本循环</span>{["接收目标", "观察现状", "判断缺口", "选择工具", "执行行动", "读取反馈", "继续或停止"].map((x, i) => <div key={x}><b>{i + 1}</b><p>{x}</p></div>)}</div>
          <AgentTrace />
          <InlinePythonLab example="agent" guide="代码先接收目标，再按计划调用四个工具，每次把观察结果放入 evidence，最后达到停止条件。重点是“目标—行动—反馈—继续”的循环，以及最终仍交由审计人员复核。" />
          <div className="chat-agent"><div><span>只进行一次输入与输出</span><strong>聊天应用</strong><p>用户提问 → 模型回答 → 结束。</p></div><div><span>形成目标—行动—反馈闭环</span><strong>具备智能体能力</strong><p>模型选择工具 → 读取结果 → 决定下一步。</p></div><p>因此，网页版大模型是否是智能体，不取决于它有没有网页，而取决于它能否围绕目标自主调用工具，并根据结果继续行动。</p></div>
          <div className="autonomy"><h3>审计场景不追求“越自主越好”</h3><div><span>可以自动</span><p>读取、检索、计算、比对、整理、提出疑点。</p></div><div><span>需要审批</span><p>扩大数据范围、写入系统、对外发送、形成正式底稿。</p></div><div><span>必须由人判断</span><p>证据评价、重大定性、舞弊判断、沟通与审计意见。</p></div></div>
          <TeacherNote>把智能体定义落到“循环”。纯工作流是预先写死每一步；智能体在受控范围内根据中间结果选择下一步。两者可以混合，实际生产系统通常也应该混合。</TeacherNote>
        </section>

        <section id="case" className="lesson">
          <SectionTitle no="07" time="5分钟" title="回到同一个案例：每增加一种技术，究竟多了什么" intro="不是新技术把旧技术全部淘汰，而是把确定性规则、统计模型、视觉模型、语言模型和工具调用组合起来。" />
          <CaseMatrix />
          <div className="stack"><span>一个成熟审计智能体的能力栈</span><div>{stages.map((s, i) => <section key={s.key}><b>0{i + 1}</b><strong>{s.name}</strong><p>{s.ability}</p></section>)}</div><blockquote>规则仍负责确定性检查；机器学习负责模式识别；神经网络负责复杂感知；大模型负责语义与推理；智能体负责把这些能力组织成可运行流程。</blockquote></div>
          <TeacherNote>切换五个标签，让学员只观察事项B和F：事项B展示如何减少误报；事项F展示为什么只有能主动取数的智能体才能完成证据闭环。</TeacherNote>
        </section>

        <section id="build" className="lesson">
          <SectionTitle no="08" time="4分钟" title="最后落地：我们自己的审计智能体怎么做" intro="从一个窄而清楚的场景起步，先把证据、权限和人工节点设计好，再讨论模型和平台。" />
          <DesignSteps />
          <div className="control-lines"><h3>上线前必须回答的六个问题</h3><ol><li><strong>依据对吗？</strong><span>使用的是哪个版本的法规和制度？</span></li><li><strong>数据能用吗？</strong><span>是否授权、完整、准确、符合保密要求？</span></li><li><strong>工具可控吗？</strong><span>能读什么、能写什么、失败时怎么办？</span></li><li><strong>证据可追溯吗？</strong><span>能否回到原始记录、原文和计算过程？</span></li><li><strong>人在回路吗？</strong><span>关键结论和高风险操作由谁审批？</span></li><li><strong>效果可衡量吗？</strong><span>召回、误报、稳定性和时间节省是多少？</span></li></ol></div>
          <TeacherNote>如果时间有限，这一章只让学员记住：先选场景，再定输入和工具，最后设人工关口。不要一开始追求跨全业务、全自主、多智能体。</TeacherNote>
        </section>

        <section id="summary" className="lesson summary">
          <SectionTitle no="09" time="4分钟" title="总结：五个问题，串起整堂课" intro="能不能执行规则？能不能从案例学习？能不能自动学习复杂特征？能不能理解语言？能不能围绕目标行动？" />
          <div className="summary-chain">{stages.map((s, i) => <div key={s.key}><span>0{i + 1}</span><strong>{s.name}</strong><p>{s.question}</p><small>{s.ability}</small></div>)}</div>
          <Quiz />
          <div className="closing"><p>审计智能体的价值，不是替代审计人员作出职业判断。</p><h3>让机器承担查找、比对、计算和整理，<br />让人专注于证据评价、沟通、核实与决策。</h3><div><span>权限可控</span><span>过程留痕</span><span>证据可查</span><span>结论可复核</span></div></div>
          <TeacherNote>最后请每位学员写下一个最耗时、最重复、又有明确人工复核节点的工作。它比“做一个万能审计智能体”更可能成为成功的第一个场景。</TeacherNote>
        </section>

        <footer><strong>从普通代码到审计智能体</strong><span>面向审计人员的2小时人工智能基础课</span><a href="#top">回到顶部 ↑</a></footer>
      </div>
    </main>
    </PythonKernelProvider>
  );
}
