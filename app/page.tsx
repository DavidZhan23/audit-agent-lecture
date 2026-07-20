"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type StageKey = "rule" | "ml" | "dl" | "llm" | "agent";
type CaseStatus = "found" | "partial" | "missed" | "false" | "cleared";

const stages: Array<{
  key: StageKey;
  short: string;
  title: string;
  verb: string;
  time: string;
  color: string;
  sees: string[];
  strength: string;
  limitation: string;
}> = [
  {
    key: "rule",
    short: "规则",
    title: "规则系统",
    verb: "会执行",
    time: "00:05—00:20",
    color: "#ffb86b",
    sees: ["金额", "日期", "费用类型", "审批状态", "发票号码"],
    strength: "快速、确定地执行已知检查条件",
    limitation: "只会检查人提前想到并写出的规则",
  },
  {
    key: "ml",
    short: "ML",
    title: "机器学习",
    verb: "会归纳",
    time: "00:20—00:32",
    color: "#ffd66b",
    sees: ["历史异常案例", "组合特征", "员工习惯", "群体模式", "阈值距离"],
    strength: "从历史数据中识别隐藏模式并进行预测",
    limitation: "风险评分不是证据，且依赖数据与标签",
  },
  {
    key: "dl",
    short: "深度学习",
    title: "深度学习",
    verb: "会感知",
    time: "00:32—00:44",
    color: "#78e6c6",
    sees: ["发票图片", "消费小票", "文字版面", "图像修改痕迹", "复杂文本特征"],
    strength: "从图片、文本等原始数据中自动学习特征",
    limitation: "识别出内容，不等于理解完整业务含义",
  },
  {
    key: "llm",
    short: "大模型",
    title: "大语言模型",
    verb: "会理解与生成",
    time: "00:44—00:55",
    color: "#79c7ff",
    sees: ["制度条款", "报销说明", "审批材料", "业务背景", "多文档上下文"],
    strength: "理解语言、综合上下文并生成解释",
    limitation: "可能幻觉，也不会天然访问企业系统",
  },
  {
    key: "agent",
    short: "智能体",
    title: "智能体",
    verb: "会行动",
    time: "01:00—01:35",
    color: "#be9cff",
    sees: ["任务目标", "工具结果", "运行状态", "跨系统数据", "人工反馈"],
    strength: "围绕目标自主选择工具、核验事实并形成闭环",
    limitation: "必须有权限、日志、停止条件与人工复核",
  },
];

const caseCards: Array<{
  id: string;
  title: string;
  clue: string;
  truth: string;
  statuses: Record<StageKey, CaseStatus>;
}> = [
  {
    id: "A",
    title: "重复报销",
    clue: "同一张酒店发票出现在两个报销单中，文件名不同。",
    truth: "真实异常：发票号码、金额、日期完全相同。",
    statuses: { rule: "found", ml: "found", dl: "found", llm: "found", agent: "found" },
  },
  {
    id: "B",
    title: "超标准住宿",
    clue: "标准600元，实际720元；当地正在举办大型展会。",
    truth: "合理例外：已取得事前特殊审批，补充通知允许提高标准。",
    statuses: { rule: "false", ml: "false", dl: "false", llm: "cleared", agent: "cleared" },
  },
  {
    id: "C",
    title: "拆分报销",
    clue: "两天内在同一商户发生1,960、1,980、1,950、1,990元四笔费用。",
    truth: "重大疑点：金额均略低于2,000元审批阈值，需核查是否人为拆分。",
    statuses: { rule: "missed", ml: "found", dl: "found", llm: "found", agent: "found" },
  },
  {
    id: "D",
    title: "票据疑似修改",
    clue: "出租车票报销286元，二维码解析金额却是86元。",
    truth: "重大疑点：数字“2”的字体、边缘、背景与其他数字不一致。",
    statuses: { rule: "missed", ml: "partial", dl: "found", llm: "found", agent: "found" },
  },
  {
    id: "E",
    title: "个人消费伪装",
    clue: "星期日“客户招待”小票包含儿童套餐、生日蛋糕和家庭套餐。",
    truth: "重大疑点：无客户拜访记录，联系人休假，员工日历为“家人生日”。",
    statuses: { rule: "partial", ml: "partial", dl: "partial", llm: "found", agent: "found" },
  },
  {
    id: "F",
    title: "跨系统行程矛盾",
    clue: "报销说明称“上海机场至苏州客户公司”。",
    truth: "重大疑点：员工航班落地南京、当晚入住南京，发票还被其他公司使用。",
    statuses: { rule: "missed", ml: "missed", dl: "missed", llm: "partial", agent: "found" },
  },
];

const navigation = [
  ["opening", "开场", "5′"],
  ["map", "能力地图", "5′"],
  ["rule", "规则系统", "10′"],
  ["ml", "机器学习", "12′"],
  ["dl", "深度学习", "12′"],
  ["llm", "大模型", "18′"],
  ["agent", "智能体", "15′"],
  ["lab", "审计智能体实战", "20′"],
  ["build", "设计工作坊", "18′"],
  ["governance", "治理与边界", "7′"],
  ["recap", "总结测验", "5′"],
];

const statusText: Record<CaseStatus, string> = {
  found: "已发现",
  partial: "仅有弱提示",
  missed: "未发现",
  false: "误报",
  cleared: "已排除误报",
};

function SpeakerNote({ children }: { children: React.ReactNode }) {
  return (
    <aside className="speaker-note">
      <span>讲师提示</span>
      <div>{children}</div>
    </aside>
  );
}

function SectionHead({
  eyebrow,
  title,
  summary,
}: {
  eyebrow: string;
  title: string;
  summary: string;
}) {
  return (
    <header className="section-head">
      <p className="eyebrow">{eyebrow}</p>
      <h2>{title}</h2>
      <p className="section-summary">{summary}</p>
    </header>
  );
}

function Timer({ onClose }: { onClose: () => void }) {
  const [seconds, setSeconds] = useState(0);
  const [running, setRunning] = useState(false);

  useEffect(() => {
    if (!running) return;
    const id = window.setInterval(() => setSeconds((value) => value + 1), 1000);
    return () => window.clearInterval(id);
  }, [running]);

  const formatted = `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;

  return (
    <div className="timer-panel" aria-label="课堂计时器">
      <button className="timer-close" onClick={onClose} aria-label="关闭计时器">×</button>
      <span className="timer-label">课堂计时</span>
      <strong>{formatted}</strong>
      <div className="timer-actions">
        <button onClick={() => setRunning((value) => !value)}>{running ? "暂停" : "开始"}</button>
        <button onClick={() => { setSeconds(0); setRunning(false); }}>归零</button>
      </div>
    </div>
  );
}

function OpeningChallenge() {
  const [choice, setChoice] = useState<number | null>(null);
  const options = [
    "人工逐笔检查",
    "编写固定筛选规则",
    "让机器从历史异常案例中学习",
    "把资料交给大模型分析",
    "让智能体读数据、查制度、调用工具并形成底稿",
  ];

  return (
    <div className="challenge-grid">
      <div className="case-brief">
        <div className="case-kicker">远航制造 · 2025专项审计</div>
        <h3>42,000笔报销，<br />两小时怎么查？</h3>
        <div className="case-stats">
          <span><strong>+38%</strong>费用增长</span>
          <span><strong>+9%</strong>出差人次</span>
          <span><strong>36,000</strong>张票据</span>
        </div>
        <p>审计目标不是报出最多的异常，而是找到真正值得核查的问题，并减少误报。</p>
      </div>
      <div className="poll-card">
        <p className="poll-label">课堂投票 · 先别追求标准答案</p>
        {options.map((option, index) => (
          <button
            key={option}
            className={choice === index ? "poll-option selected" : "poll-option"}
            onClick={() => setChoice(index)}
          >
            <span>{index + 1}</span>{option}
          </button>
        ))}
        {choice !== null && (
          <div className="poll-feedback">
            {choice === 4
              ? "这是本课最终要到达的位置。但前四种方法并不会消失，它们会成为智能体的能力组件。"
              : "这个答案有价值，但只能解决任务的一部分。接下来看看它会遗漏什么。"}
          </div>
        )}
      </div>
    </div>
  );
}

function CapabilityMap() {
  const [active, setActive] = useState(0);
  const stage = stages[active];
  return (
    <div className="capability-map">
      <div className="stage-rail" role="tablist" aria-label="人工智能能力升级路径">
        {stages.map((item, index) => (
          <button
            role="tab"
            aria-selected={active === index}
            key={item.key}
            onClick={() => setActive(index)}
            className={active === index ? "active" : ""}
            style={{ "--stage-color": item.color } as React.CSSProperties}
          >
            <span className="stage-number">0{index + 1}</span>
            <strong>{item.short}</strong>
            <small>{item.verb}</small>
          </button>
        ))}
      </div>
      <div className="stage-detail" style={{ "--stage-color": stage.color } as React.CSSProperties}>
        <div>
          <p className="mini-label">当前能力</p>
          <h3>{stage.title}：{stage.verb}</h3>
          <p className="stage-strength">{stage.strength}</p>
        </div>
        <div className="sees-panel">
          <p className="mini-label">机器现在能“看见”</p>
          <div className="chip-row">{stage.sees.map((item) => <span key={item}>{item}</span>)}</div>
        </div>
        <div className="limitation"><strong>仍然做不到：</strong>{stage.limitation}</div>
      </div>
      <div className="relationship-note">
        <strong>注意：</strong>智能体不是“大模型下面的另一种模型”。它是把模型、规则、数据、工具和控制机制组合起来的系统。
      </div>
    </div>
  );
}

function RuleLab() {
  const [amount, setAmount] = useState(1680);
  const [weekend, setWeekend] = useState(false);
  const [newVendor, setNewVendor] = useState(false);
  const [missingApproval, setMissingApproval] = useState(false);
  const [nearThresholdCount, setNearThresholdCount] = useState(1);
  const [mode, setMode] = useState<"rule" | "ml">("rule");

  const ruleFlags = [
    amount > 2000 ? "金额超过2,000元审批阈值" : "",
    weekend ? "周末发生业务招待" : "",
    missingApproval ? "缺少审批记录" : "",
  ].filter(Boolean);
  const mlScore = Math.min(98, Math.round(
    12 + amount / 100 + (weekend ? 12 : 0) + (newVendor ? 16 : 0) +
    (missingApproval ? 30 : 0) + nearThresholdCount * 11 +
    (amount >= 1850 && amount < 2000 ? 18 : 0)
  ));

  return (
    <div className="lab-card rule-lab">
      <div className="lab-toolbar">
        <div>
          <p className="mini-label">互动实验 01</p>
          <h3>同一笔报销，两种判断方式</h3>
        </div>
        <div className="segmented">
          <button className={mode === "rule" ? "active" : ""} onClick={() => setMode("rule")}>规则模式</button>
          <button className={mode === "ml" ? "active" : ""} onClick={() => setMode("ml")}>机器学习</button>
        </div>
      </div>
      <div className="control-result-grid">
        <div className="controls">
          <label>
            <span>报销金额 <strong>¥{amount.toLocaleString()}</strong></span>
            <input type="range" min="500" max="3500" step="10" value={amount} onChange={(e) => setAmount(Number(e.target.value))} />
          </label>
          <label>
            <span>两天内同商户近阈值笔数 <strong>{nearThresholdCount}笔</strong></span>
            <input type="range" min="1" max="5" value={nearThresholdCount} onChange={(e) => setNearThresholdCount(Number(e.target.value))} />
          </label>
          <div className="toggle-grid">
            <button className={weekend ? "on" : ""} onClick={() => setWeekend(!weekend)}>周末消费</button>
            <button className={newVendor ? "on" : ""} onClick={() => setNewVendor(!newVendor)}>新商户</button>
            <button className={missingApproval ? "on" : ""} onClick={() => setMissingApproval(!missingApproval)}>缺少审批</button>
          </div>
        </div>
        <div className={`result-console ${mode}`}>
          {mode === "rule" ? (
            <>
              <p>规则检查结果</p>
              <strong>{ruleFlags.length ? `${ruleFlags.length}条预警` : "未触发预警"}</strong>
              <ul>{ruleFlags.length ? ruleFlags.map((item) => <li key={item}>{item}</li>) : <li>每个字段都没有越过明确阈值</li>}</ul>
              {amount < 2000 && nearThresholdCount >= 4 && <div className="blind-spot">盲点：多笔金额都略低于阈值，规则仍可能全部放过。</div>}
            </>
          ) : (
            <>
              <p>机器学习风险评分</p>
              <strong>{mlScore}<small>/100</small></strong>
              <div className="score-bar"><span style={{ width: `${mlScore}%` }} /></div>
              <ul>
                {nearThresholdCount >= 4 && <li>短期内出现多笔近阈值交易</li>}
                {amount >= 1850 && amount < 2000 && <li>金额异常接近审批阈值</li>}
                {newVendor && <li>商户缺少历史交易记录</li>}
                {weekend && <li>交易时间偏离常规模式</li>}
                {!newVendor && !weekend && nearThresholdCount < 4 && <li>当前组合接近员工日常模式</li>}
              </ul>
            </>
          )}
        </div>
      </div>
      <p className="takeaway"><strong>一句话：</strong>规则问“是否超过2,000元”，机器学习还会问“为什么每次都恰好不到2,000元”。</p>
    </div>
  );
}

function DeepLearningDemo() {
  const [scan, setScan] = useState<"idle" | "text" | "image">("idle");
  const inputs = scan === "idle" ? [0.18, 0.15, 0.12, 0.2] : scan === "text" ? [0.8, 0.62, 0.31, 0.74] : [0.92, 0.85, 0.77, 0.94];
  return (
    <div className="lab-card neural-lab">
      <div className="lab-toolbar">
        <div><p className="mini-label">互动实验 02</p><h3>机器如何从原始票据中学习特征</h3></div>
        <div className="segmented">
          <button className={scan === "text" ? "active" : ""} onClick={() => setScan("text")}>扫描小票文字</button>
          <button className={scan === "image" ? "active" : ""} onClick={() => setScan("image")}>扫描修改痕迹</button>
        </div>
      </div>
      <div className="neural-grid">
        <div className="receipt-mock">
          <div className="receipt-top">远航出租汽车电子票</div>
          <div><span>日期</span><b>2025-05-18</b></div>
          <div><span>里程</span><b>21.4 km</b></div>
          <div className="receipt-amount"><span>金额</span><b><i>2</i>86.00</b></div>
          <div className="receipt-code">二维码解析：¥86.00</div>
          {scan !== "idle" && <div className={`scan-line ${scan}`} />}
        </div>
        <div className="network" aria-label="简化神经网络示意图">
          <div className="network-column">
            {["字体", "边缘", "背景", "二维码"].map((item, i) => <span key={item} style={{ opacity: .35 + inputs[i] * .65 }}>{item}</span>)}
          </div>
          <div className="network-links">
            {inputs.map((value, i) => <i key={i} style={{ opacity: value, height: `${2 + value * 5}px` }} />)}
          </div>
          <div className="network-column hidden-nodes">
            {[0, 1, 2].map((item) => <span key={item} style={{ boxShadow: scan === "image" ? "0 0 24px #78e6c6" : "none" }} />)}
          </div>
          <div className="network-links short">
            {[0, 1, 2].map((item) => <i key={item} style={{ opacity: scan === "idle" ? .15 : .8 }} />)}
          </div>
          <div className="network-output">
            <span>异常概率</span>
            <strong>{scan === "image" ? "96%" : scan === "text" ? "41%" : "—"}</strong>
          </div>
        </div>
      </div>
      <div className="scan-findings">
        {scan === "idle" && <p>选择一种扫描方式，观察机器能从原始图片中提取什么。</p>}
        {scan === "text" && <p><strong>识别到：</strong>日期、里程、报销金额286元、二维码金额86元。</p>}
        {scan === "image" && <p><strong>发现异常：</strong>数字“2”的字体、边缘和背景与“86”不一致，需查验原始电子票据。</p>}
      </div>
      <p className="takeaway"><strong>一句话：</strong>深度学习让机器从图片、文字、声音等原始数据中自动学习复杂特征。</p>
    </div>
  );
}

function TokenDemo() {
  const [tokens, setTokens] = useState<string[]>([]);
  const options = [
    [{ word: "内部控制", p: 34 }, { word: "资金管理", p: 28 }, { word: "收入确认", p: 22 }],
    [{ word: "的", p: 61 }, { word: "以及", p: 19 }, { word: "相关", p: 12 }],
    [{ word: "设计与运行", p: 46 }, { word: "有效性", p: 37 }, { word: "风险", p: 11 }],
    [{ word: "是否有效", p: 52 }, { word: "情况", p: 31 }, { word: "测试", p: 9 }],
  ];
  const current = options[Math.min(tokens.length, options.length - 1)];
  return (
    <div className="lab-card token-lab">
      <div className="lab-toolbar">
        <div><p className="mini-label">互动实验 03</p><h3>大模型最基本的动作：预测下一个Token</h3></div>
        <button className="text-button" onClick={() => setTokens([])}>重新开始</button>
      </div>
      <div className="prompt-line">
        <span>根据审计计划，本次审计的重点是</span>
        {tokens.map((token, index) => <mark key={`${token}-${index}`}>{token}</mark>)}
        <i className="cursor" />
      </div>
      {tokens.length < 4 ? (
        <div className="token-options">
          {current.map((option) => (
            <button key={option.word} onClick={() => setTokens([...tokens, option.word])}>
              <strong>{option.word}</strong><span>{option.p}%</span><i style={{ width: `${option.p}%` }} />
            </button>
          ))}
        </div>
      ) : <div className="completion">一句通顺的话，由连续很多次“下一个Token预测”生成。</div>}
      <div className="llm-facts">
        <div><strong>Token</strong><span>模型处理文字时使用的小单位</span></div>
        <div><strong>上下文</strong><span>当前任务中模型能够看到的信息</span></div>
        <div><strong>参数</strong><span>训练中形成的大量数值关系</span></div>
      </div>
    </div>
  );
}

function LlmBoundary() {
  const [active, setActive] = useState("prompt");
  const items = {
    prompt: ["提示词", "把任务讲清楚", "告诉模型角色、目标、约束和输出格式。"],
    context: ["文件 / 上下文", "把资料交给模型", "让模型分析当前合同、制度、底稿或访谈记录。"],
    rag: ["知识库 / RAG", "先检索，再回答", "从内部知识中找到相关片段，并将来源一并交给模型。"],
    tool: ["工具", "让模型能够查和算", "查询数据库、运行程序、查验发票或生成文件。"],
    agent: ["智能体机制", "让系统持续行动", "围绕目标决定下一步，调用工具，根据结果继续或停止。"],
  } as const;
  const item = items[active as keyof typeof items];
  return (
    <div className="boundary-card">
      <div className="boundary-tabs">
        {Object.entries(items).map(([key, value]) => <button key={key} className={active === key ? "active" : ""} onClick={() => setActive(key)}>{value[0]}</button>)}
      </div>
      <div className="boundary-content"><p>{item[0]}</p><h3>{item[1]}</h3><span>{item[2]}</span></div>
    </div>
  );
}

function AgentLoop() {
  const [step, setStep] = useState(0);
  const loop = [
    ["目标", "核实一笔机场出租车费是否与真实行程一致"],
    ["观察", "现有材料只有报销说明和一张发票"],
    ["判断", "缺少实际到达城市和发票状态"],
    ["行动", "调用航班查询工具和发票查验工具"],
    ["反馈", "航班落地南京；发票显示已被其他公司使用"],
    ["再判断", "需要继续核验酒店、客户地址和拜访记录"],
    ["停止 / 升级", "证据达到预设条件，提交审计人员复核"],
  ];
  return (
    <div className="agent-loop-card">
      <div className="loop-visual">
        {loop.map((item, index) => (
          <button key={item[0]} className={index === step ? "active" : index < step ? "done" : ""} onClick={() => setStep(index)}>
            <span>{index + 1}</span><strong>{item[0]}</strong>
          </button>
        ))}
      </div>
      <div className="loop-detail">
        <p>第 {step + 1} 步</p><h3>{loop[step][0]}</h3><span>{loop[step][1]}</span>
        <button onClick={() => setStep((step + 1) % loop.length)}>{step === loop.length - 1 ? "重新运行" : "执行下一步 →"}</button>
      </div>
    </div>
  );
}

function AuditCaseLab() {
  const [stageIndex, setStageIndex] = useState(0);
  const [selectedCase, setSelectedCase] = useState("A");
  const stage = stages[stageIndex];
  const currentCase = caseCards.find((item) => item.id === selectedCase) ?? caseCards[0];
  const counts = useMemo(() => {
    const statuses = caseCards.map((item) => item.statuses[stage.key]);
    return {
      found: statuses.filter((item) => item === "found").length,
      false: statuses.filter((item) => item === "false").length,
      partial: statuses.filter((item) => item === "partial").length,
    };
  }, [stage.key]);

  return (
    <div className="case-lab">
      <div className="case-stage-selector">
        {stages.map((item, index) => (
          <button key={item.key} onClick={() => setStageIndex(index)} className={stageIndex === index ? "active" : ""} style={{ "--stage-color": item.color } as React.CSSProperties}>
            <span>{index + 1}</span><strong>{item.short}</strong><small>{item.verb}</small>
          </button>
        ))}
      </div>
      <div className="case-dashboard">
        <div className="case-overview">
          <div className="dashboard-head">
            <div><p className="mini-label">当前系统</p><h3>{stage.title}</h3></div>
            <div className="finding-counts"><span><strong>{counts.found}</strong>明确发现</span><span><strong>{counts.partial}</strong>弱提示</span><span><strong>{counts.false}</strong>误报</span></div>
          </div>
          <p className="system-sight"><strong>可用信息：</strong>{stage.sees.join("、")}</p>
          <div className="case-grid">
            {caseCards.map((item) => {
              const status = item.statuses[stage.key];
              return (
                <button key={item.id} className={`case-tile ${status} ${selectedCase === item.id ? "selected" : ""}`} onClick={() => setSelectedCase(item.id)}>
                  <span className="case-id">{item.id}</span>
                  <strong>{item.title}</strong>
                  <small>{statusText[status]}</small>
                </button>
              );
            })}
          </div>
        </div>
        <div className="case-inspector">
          <div className="inspector-top"><span>事项 {currentCase.id}</span><b className={currentCase.statuses[stage.key]}>{statusText[currentCase.statuses[stage.key]]}</b></div>
          <h3>{currentCase.title}</h3>
          <div className="evidence-block"><span>当前线索</span><p>{currentCase.clue}</p></div>
          <div className="evidence-block truth"><span>最终真相</span><p>{currentCase.truth}</p></div>
          <div className="why-box">
            <strong>{stage.title}为什么得到这个结果？</strong>
            <p>{explainCase(currentCase.id, stage.key)}</p>
          </div>
        </div>
      </div>
      <div className="upgrade-prompt">
        <span>课堂追问</span>
        <strong>{stageIndex < 4 ? `上一个系统为什么解决不了？下一步升级为${stages[stageIndex + 1].title}会多获得什么能力？` : "智能体能继续调查，但为什么仍不能直接认定舞弊？"}</strong>
        {stageIndex < 4 && <button onClick={() => setStageIndex(stageIndex + 1)}>解锁下一层能力 →</button>}
      </div>
    </div>
  );
}

function explainCase(caseId: string, stage: StageKey) {
  const explanations: Record<string, Record<StageKey, string>> = {
    A: {
      rule: "发票号码、金额和日期完全相同，命中确定性重复规则。",
      ml: "重复字段是极强的历史异常特征，模型给出高风险评分。",
      dl: "OCR从不同文件名的图片中提取出相同发票要素。",
      llm: "模型能够解释重复要素，但这里精确规则依然更简单可靠。",
      agent: "智能体调用重复检测工具并将两张凭证并列呈现给审计人员。",
    },
    B: {
      rule: "720元高于600元标准，规则不知道还有特殊审批和补充通知。",
      ml: "历史上超标准经常对应异常，模型仍可能给出高风险。",
      dl: "图片识别能读出720元，但无法自行理解制度例外。",
      llm: "同时阅读制度版本、展会通知和事前审批后，判断属于合理例外。",
      agent: "自动查询交易日期对应的有效制度与审批记录，保留排除误报的证据。",
    },
    C: {
      rule: "四笔交易都低于2,000元，没有任何一笔越过规则阈值。",
      ml: "识别到同商户、短时间、近阈值、相似说明的异常组合模式。",
      dl: "文本模型进一步识别四段说明高度相似，但仍不能证明主观故意。",
      llm: "把组合模式与制度审批要求联系起来，生成清晰的核查理由。",
      agent: "调用聚类工具、调取付款记录，并建议核实实际参与人员与完整账单。",
    },
    D: {
      rule: "结构化表格只记录286元，金额本身没有命中规则。",
      ml: "金额略偏高，只能提供弱风险提示，无法证明图片被修改。",
      dl: "发现数字“2”的字体与背景异常，并识别二维码中的86元。",
      llm: "能够解释两种金额之间的矛盾，并提出查验原票的建议。",
      agent: "调用发票查验工具获取原始金额，并把工具返回记录加入证据链。",
    },
    E: {
      rule: "只能看到周末消费，周末本身并不代表违规。",
      ml: "时间与金额偏离日常模式，但真实用途仍不清楚。",
      dl: "识别出儿童套餐和生日蛋糕，却不知道其与客户招待是否矛盾。",
      llm: "综合小票、报销说明、联系人休假和员工日历，识别语义与事实冲突。",
      agent: "进一步查询拜访系统和支付记录，达到阈值后请求人工访谈。",
    },
    F: {
      rule: "报销字段完整、金额未超标，没有精确条件可触发。",
      ml: "单笔交易在历史数据中并不罕见，群体模式也不突出。",
      dl: "发票图片本身可能完全真实，图像中没有足够异常。",
      llm: "如果人工把全部记录放入上下文，模型能看出矛盾，但不会天然去各系统取数。",
      agent: "围绕核实目标依次查询航班、酒店、客户和发票平台，形成跨系统证据闭环。",
    },
  };
  return explanations[caseId][stage];
}

const investigationSteps = [
  ["接收目标", "核实编号BX-42017的机场出租车费是否与真实行程一致。", "目标管理"],
  ["读取报销", "说明称“上海机场至苏州客户公司”，发票金额468元。", "报销数据库"],
  ["识别缺口", "缺少实际抵达城市、住宿地点、客户拜访和发票使用状态。", "大模型判断"],
  ["查询航班", "员工当天航班实际于15:42降落南京禄口机场。", "出行记录"],
  ["查询酒店", "员工当晚21:08办理南京某酒店入住。", "酒店记录"],
  ["查询客户", "客户公司注册地苏州；当天无拜访登记，联系人处于休假。", "客户资料"],
  ["查验发票", "该发票真实，但已在另一家公司报销系统出现。", "发票查验"],
  ["形成证据链", "四类独立证据与报销说明均存在矛盾。", "底稿工具"],
  ["请求复核", "不能自行认定舞弊；建议访谈员工并取得原始支付记录。", "人工审批"],
];

function InvestigationConsole() {
  const [visible, setVisible] = useState(0);
  const [auto, setAuto] = useState(false);
  const logRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!auto || visible >= investigationSteps.length) {
      if (visible >= investigationSteps.length) setAuto(false);
      return;
    }
    const timer = window.setTimeout(() => setVisible((value) => value + 1), 850);
    return () => window.clearTimeout(timer);
  }, [auto, visible]);

  useEffect(() => {
    logRef.current?.scrollTo({ top: logRef.current.scrollHeight, behavior: "smooth" });
  }, [visible]);

  return (
    <div className="investigation">
      <div className="investigation-head">
        <div><p className="mini-label">现场演示</p><h3>差旅审计智能体 · 调查控制台</h3></div>
        <div className="console-actions">
          <button onClick={() => { setVisible(0); setAuto(false); }}>重置</button>
          <button className="primary" onClick={() => setAuto(!auto)}>{auto ? "暂停" : visible === 0 ? "自动运行" : "继续运行"}</button>
        </div>
      </div>
      <div className="investigation-body">
        <div className="agent-tools">
          <span>可用工具</span>
          {["报销数据库", "制度知识库", "数据分析", "图像识别", "出行记录", "客户资料", "发票查验", "底稿生成", "人工审批"].map((tool, index) => (
            <div key={tool} className={visible > 0 && investigationSteps.slice(0, visible).some((item) => item[2] === tool) ? "used" : ""}><i>{String(index + 1).padStart(2, "0")}</i>{tool}</div>
          ))}
        </div>
        <div className="agent-log" ref={logRef}>
          {visible === 0 && <div className="empty-log"><span>◎</span><p>点击“自动运行”，观察智能体如何根据工具结果决定下一步。</p></div>}
          {investigationSteps.slice(0, visible).map((item, index) => (
            <div className={`log-entry ${index === visible - 1 ? "latest" : ""}`} key={item[0]}>
              <span className="log-index">{String(index + 1).padStart(2, "0")}</span>
              <div><p><strong>{item[0]}</strong><em>{item[2]}</em></p><span>{item[1]}</span></div>
            </div>
          ))}
        </div>
        <div className="evidence-chain">
          <span>证据链完整度</span>
          <div className="evidence-meter"><i style={{ width: `${Math.min(100, visible * 12)}%` }} /></div>
          <strong>{Math.min(100, visible * 12)}%</strong>
          <div className="evidence-list">
            {["报销原文", "航班记录", "酒店记录", "客户记录", "发票状态"].map((item, index) => <span key={item} className={visible >= [2, 4, 5, 6, 7][index] ? "ready" : ""}>{item}</span>)}
          </div>
          {visible >= investigationSteps.length && <div className="human-gate"><b>等待人工复核</b><p>异常 ≠ 错误<br />风险 ≠ 舞弊<br />智能体输出 ≠ 审计结论</p></div>}
        </div>
      </div>
      <div className="manual-step">
        <button disabled={visible >= investigationSteps.length} onClick={() => setVisible(Math.min(investigationSteps.length, visible + 1))}>单步执行 →</button>
        <span>课堂上可以逐步停下来追问：“它为什么选择这个工具？”</span>
      </div>
    </div>
  );
}

type CanvasData = {
  scenario: string;
  goal: string;
  inputs: string;
  tools: string;
  output: string;
  evidence: string;
  human: string;
  metric: string;
};

const canvasPresets: Record<string, CanvasData> = {
  expense: {
    scenario: "差旅报销初审",
    goal: "识别值得人工核查的异常报销，并生成带证据的疑点清单",
    inputs: "报销明细、票据图片、差旅制度、审批记录、出行记录",
    tools: "数据库查询、OCR、重复检测、制度检索、发票查验",
    output: "异常事项清单、证据引用、待补资料和建议核查步骤",
    evidence: "每项疑点必须引用原始记录、适用制度和工具返回结果",
    human: "重大疑点、对外发送、正式底稿入库前必须人工确认",
    metric: "真实问题召回率、误报率、证据可追溯率、平均复核时间",
  },
  contract: {
    scenario: "合同条款审阅",
    goal: "识别合同与标准模板、授权制度和采购要求之间的差异",
    inputs: "合同正文、标准模板、授权清单、采购制度、补充协议",
    tools: "文档解析、条款对比、制度检索、金额计算、版本追踪",
    output: "差异清单、风险说明、原文定位和建议复核问题",
    evidence: "每条结论链接合同原文、标准条款与适用制度版本",
    human: "法律判断、重大风险定级、向业务部门发送意见前人工确认",
    metric: "关键条款召回率、错误引用率、复核节省时间",
  },
  procurement: {
    scenario: "采购异常分析",
    goal: "识别供应商集中、拆单采购、关联关系和异常竞价模式",
    inputs: "采购订单、付款、供应商主数据、招投标文件、审批日志",
    tools: "SQL查询、图关系分析、异常检测、文档比对、工商信息查询",
    output: "风险排名、关系图、异常模式解释和下一步核查方案",
    evidence: "所有风险评分附带交易明细、关系路径和计算方法",
    human: "关联关系确认、舞弊判断、进一步调查措施必须人工审批",
    metric: "高风险命中率、误报率、计算可复现率、调查转化率",
  },
};

function DesignCanvas() {
  const [data, setData] = useState<CanvasData>(canvasPresets.expense);
  const [copied, setCopied] = useState(false);
  const fields: Array<[keyof CanvasData, string, string]> = [
    ["goal", "01 目标", "智能体最终要完成什么？"],
    ["inputs", "02 输入", "它能够使用哪些数据和资料？"],
    ["tools", "03 工具", "它需要查什么、算什么、做什么？"],
    ["output", "04 输出", "交付异常清单、底稿还是报告草稿？"],
    ["evidence", "05 证据", "每条结论如何追溯？"],
    ["human", "06 人工控制", "哪些节点必须由人确认？"],
    ["metric", "07 评价", "怎样判断它真的有用且可靠？"],
  ];
  const copyCanvas = async () => {
    const text = [`审计智能体设计画布：${data.scenario}`, ...fields.map(([key, title]) => `${title}：${data[key]}`)].join("\n");
    try { await navigator.clipboard.writeText(text); setCopied(true); window.setTimeout(() => setCopied(false), 1600); } catch { setCopied(false); }
  };
  return (
    <div className="design-canvas">
      <div className="canvas-toolbar">
        <div><p className="mini-label">课堂共创</p><h3>不要从“万能智能体”开始，从一个明确任务开始</h3></div>
        <div className="preset-buttons">
          {Object.entries(canvasPresets).map(([key, preset]) => <button key={key} className={data.scenario === preset.scenario ? "active" : ""} onClick={() => setData(preset)}>{preset.scenario}</button>)}
        </div>
      </div>
      <label className="scenario-name"><span>智能体名称</span><input value={data.scenario} onChange={(e) => setData({ ...data, scenario: e.target.value })} /></label>
      <div className="canvas-grid">
        {fields.map(([key, title, placeholder]) => (
          <label key={key}><span>{title}</span><small>{placeholder}</small><textarea value={data[key]} onChange={(e) => setData({ ...data, [key]: e.target.value })} /></label>
        ))}
      </div>
      <div className="canvas-bottom">
        <div><strong>最小可行版本建议</strong><p>先做“读取资料 → 找出疑点 → 给出证据 → 人工复核”，暂时不要让它自动修改正式数据或对外发送。</p></div>
        <button onClick={copyCanvas}>{copied ? "已复制" : "复制设计画布"}</button>
      </div>
    </div>
  );
}

const quizItems = [
  { q: "机器学习与规则系统最核心的区别是什么？", options: ["机器学习一定更准确", "机器学习从案例中学习关系，而不是只执行人工规则", "机器学习不需要数据"], answer: 1 },
  { q: "深度学习在票据审计中的典型增量能力是？", options: ["自动批准报销", "从图片中学习版面、文字和修改痕迹", "保证所有结论正确"], answer: 1 },
  { q: "大模型生成流畅答案，是否代表事实已经核验？", options: ["是", "字数多时是", "不是，语言合理与事实可靠是两件事"], answer: 2 },
  { q: "一个聊天网页什么时候更接近智能体？", options: ["界面很好看", "能围绕目标调用工具，并依据反馈继续行动", "回答速度很快"], answer: 1 },
  { q: "审计智能体发现高风险事项后，最合适的动作是？", options: ["直接认定舞弊", "删除交易", "保留证据与不确定性，提交人工复核"], answer: 2 },
];

function Quiz() {
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const score = Object.entries(answers).filter(([index, answer]) => quizItems[Number(index)].answer === answer).length;
  return (
    <div className="quiz">
      <div className="quiz-score"><span>结课检测</span><strong>{score}<small>/5</small></strong><p>{Object.keys(answers).length < 5 ? "完成五道题，检验是否真正抓住了主线。" : score === 5 ? "很好：已经掌握完整能力链。" : "回看标红题目，答案就在每章的一句话结论里。"}</p></div>
      <div className="quiz-items">
        {quizItems.map((item, index) => (
          <div className="quiz-item" key={item.q}>
            <p><span>0{index + 1}</span>{item.q}</p>
            <div>{item.options.map((option, optionIndex) => {
              const answered = answers[index] !== undefined;
              const className = answers[index] === optionIndex ? (optionIndex === item.answer ? "correct" : "wrong") : answered && optionIndex === item.answer ? "answer" : "";
              return <button className={className} key={option} onClick={() => setAnswers({ ...answers, [index]: optionIndex })}>{option}</button>;
            })}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function AppHeader({ speakerMode, setSpeakerMode }: { speakerMode: boolean; setSpeakerMode: (value: boolean) => void }) {
  const [timerOpen, setTimerOpen] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const update = () => {
      const height = document.documentElement.scrollHeight - window.innerHeight;
      setProgress(height > 0 ? Math.round((window.scrollY / height) * 100) : 0);
    };
    update();
    window.addEventListener("scroll", update, { passive: true });
    return () => window.removeEventListener("scroll", update);
  }, []);

  const fullscreen = () => {
    if (!document.fullscreenElement) document.documentElement.requestFullscreen?.();
    else document.exitFullscreen?.();
  };
  return (
    <>
      <header className="app-header">
        <a className="brand" href="#top"><span>AI</span><b>审计智能体课</b></a>
        <div className="header-progress"><span style={{ width: `${progress}%` }} /></div>
        <div className="header-actions">
          <button onClick={() => setSpeakerMode(!speakerMode)} className={speakerMode ? "active" : ""}>{speakerMode ? "隐藏讲师提示" : "讲师提示"}</button>
          <button onClick={() => setTimerOpen(!timerOpen)}>计时器</button>
          <button onClick={fullscreen}>全屏授课</button>
        </div>
      </header>
      {timerOpen && <Timer onClose={() => setTimerOpen(false)} />}
    </>
  );
}

export default function Home() {
  const [speakerMode, setSpeakerMode] = useState(false);
  return (
    <main id="top" className={speakerMode ? "speaker-mode" : ""}>
      <AppHeader speakerMode={speakerMode} setSpeakerMode={setSpeakerMode} />
      <aside className="side-nav">
        <div className="side-nav-title"><span>120分钟</span><strong>课程路线</strong></div>
        <nav>{navigation.map(([id, label, time], index) => <a key={id} href={`#${id}`}><i>{String(index + 1).padStart(2, "0")}</i><span>{label}</span><small>{time}</small></a>)}</nav>
      </aside>

      <div className="page-shell">
        <section className="hero" aria-labelledby="course-title">
          <div className="hero-grid">
            <div className="hero-copy">
              <p className="eyebrow">AUDIT × AI · 2小时互动课程</p>
              <h1 id="course-title">从<span>“会预测”</span><br />到<span>“会办事”</span></h1>
              <p className="hero-subtitle">零基础看懂机器学习、大模型与智能体<br />并亲手设计第一个审计智能体</p>
              <div className="hero-actions"><a href="#opening" className="primary-cta">开始课程 ↓</a><button onClick={() => window.print()}>打印讲义</button></div>
            </div>
            <div className="hero-path" aria-label="课程五阶段">
              {stages.map((stage, index) => <div key={stage.key} style={{ "--stage-color": stage.color } as React.CSSProperties}><span>0{index + 1}</span><strong>{stage.short}</strong><small>{stage.verb}</small></div>)}
              <p>同一个审计案例<br /><strong>五次能力升级</strong></p>
            </div>
          </div>
          <div className="hero-objectives">
            <span>学完你将能够</span>
            <div><b>01</b>解释ML、深度学习与大模型</div>
            <div><b>02</b>判断一个产品是否具备智能体能力</div>
            <div><b>03</b>设计可控、可查、可复核的审计智能体</div>
          </div>
        </section>

        <section id="opening" className="course-section opening-section">
          <SectionHead eyebrow="00 · 开场 / 5分钟" title="不是来背概念，而是来解决一个任务" summary="先把学员带进一个真实感足够强的审计现场，再带着问题学习技术。" />
          <OpeningChallenge />
          <SpeakerNote>先让大家举手选择，不急着公布答案。追问：“如果报警很多但大多是误报，对审计真的有帮助吗？”把课程目标从“找异常”提升为“找到值得核查的真实问题”。</SpeakerNote>
        </section>

        <section id="map" className="course-section">
          <SectionHead eyebrow="01 · 总览 / 5分钟" title="一张图看懂能力如何升级" summary="规则、机器学习、深度学习、大模型和智能体，不是五个孤立名词，而是一条从执行到行动的能力链。" />
          <CapabilityMap />
          <div className="definition-strip">
            <div><span>人工智能</span><p>让计算机表现出识别、预测、理解、生成、决策或行动等能力的总称。</p></div>
            <div><span>包含关系</span><p>机器学习属于人工智能；深度学习属于机器学习；大语言模型通常建立在深度学习之上。</p></div>
            <div><span>系统关系</span><p>智能体处于应用系统层，把模型与工具、数据、记忆、流程和控制机制组合起来。</p></div>
          </div>
          <SpeakerNote>板书五个动词：执行、归纳、感知、理解、行动。这五个词是整堂课的记忆锚点，后面每章都回到它们。</SpeakerNote>
        </section>

        <section id="rule" className="course-section">
          <SectionHead eyebrow="02 · 规则系统 / 10分钟" title="人总结规律，机器严格执行" summary="规则系统并不“低级”。对于金额计算、日期比较、重复号码等确定性任务，它往往最简单、可靠、容易复现。" />
          <div className="rule-example">
            <div className="code-card"><span>审计规则</span><code><b>如果</b> 住宿金额 &gt; 员工住宿标准<br /><b>并且</b> 不存在特殊审批<br /><b>那么</b> 标记为待核查</code></div>
            <div className="rule-anatomy"><div><i>输入</i><strong>金额、标准、审批状态</strong></div><span>→</span><div><i>判断</i><strong>人预先写好的条件</strong></div><span>→</span><div><i>输出</i><strong>命中 / 未命中</strong></div></div>
          </div>
          <RuleLab />
          <div className="pros-cons"><div><h3>规则系统擅长</h3><ul><li>条件明确、口径稳定</li><li>结果确定、容易解释</li><li>计算快、成本低</li></ul></div><div><h3>规则系统容易遗漏</h3><ul><li>阈值规避和组合模式</li><li>图片、文本中的复杂信息</li><li>合理例外与业务语境</li></ul></div></div>
          <SpeakerNote>不要把规则讲成“过时技术”。强调成熟审计智能体仍然大量使用规则。让学员把金额调到1,980元、笔数调到4笔，观察规则为什么放过而ML风险骤升。</SpeakerNote>
        </section>

        <section id="ml" className="course-section">
          <SectionHead eyebrow="03 · 机器学习 / 12分钟" title="不给机器每条答案，让它从案例里找规律" summary="机器学习的关键变化：人不再把所有判断逻辑逐条写死，而是提供历史数据、特征和结果，让模型学习它们之间的关系。" />
          <div className="learning-pipeline">
            <div><span>01</span><b>历史案例</b><p>正常报销<br />异常报销</p></div><i>→</i><div><span>02</span><b>提取特征</b><p>金额、时间<br />商户、频率</p></div><i>→</i><div><span>03</span><b>训练模型</b><p>寻找输入与<br />结果的关系</p></div><i>→</i><div><span>04</span><b>预测新数据</b><p>异常概率<br />风险排名</p></div>
          </div>
          <div className="split-story">
            <div className="threshold-chart">
              <div className="threshold-line"><span>审批阈值 ¥2,000</span></div>
              {[1960, 1980, 1950, 1990].map((value, index) => <div className="bar-row" key={value}><span>第{index + 1}笔</span><i style={{ width: `${value / 22}%` }} /><strong>¥{value}</strong></div>)}
            </div>
            <div className="risk-explain"><p className="mini-label">事项 C · 拆分报销</p><h3>每笔都合规，组合起来却很可疑</h3><ul><li>两天内、同一商户、同一项目</li><li>金额均距离审批阈值不到3%</li><li>四段报销说明高度相似</li><li>该员工过去没有类似消费习惯</li></ul><div><strong>模型风险评分 92</strong><span>但风险评分不是违规证据</span></div></div>
          </div>
          <div className="ml-types"><div><span>监督学习</span><strong>有历史答案</strong><p>用已确认的正常/异常案例训练分类器。</p></div><div><span>无监督学习</span><strong>没有标准答案</strong><p>从群体中寻找异常点、聚类和新模式。</p></div><div><span>模型评价</span><strong>不能只看准确率</strong><p>审计还要关注真实问题召回率和误报率。</p></div></div>
          <SpeakerNote>用“老师批过的历史作业”解释监督学习，用“在人群中找行为特别不同的人”解释无监督学习。强调模型输出是线索排序，不是审计定性。</SpeakerNote>
        </section>

        <section id="dl" className="course-section">
          <SectionHead eyebrow="04 · 深度学习 / 12分钟" title="从人工设计特征，到机器逐层学习特征" summary="当输入变成图片、声音和复杂文本时，人很难事先列出全部特征。深度学习用多层神经网络，从原始数据中逐层学习表示。" />
          <div className="layer-story"><div><span>原始图片</span><b>像素</b></div><i>→</i><div><span>浅层特征</span><b>边缘、线条</b></div><i>→</i><div><span>中层特征</span><b>数字、印章</b></div><i>→</i><div><span>高层特征</span><b>金额与版面</b></div><i>→</i><div><span>任务结果</span><b>异常概率</b></div></div>
          <DeepLearningDemo />
          <div className="compare-table" role="table"><div className="table-row header"><span>比较维度</span><span>传统机器学习</span><span>深度学习</span></div>{[["特征", "经常由人设计", "可以自动学习"], ["擅长数据", "结构化表格", "文本、图片、声音"], ["资源需求", "相对较少", "通常更多"], ["解释难度", "相对容易", "通常更困难"]].map((row) => <div className="table-row" key={row[0]}>{row.map((cell) => <span key={cell}>{cell}</span>)}</div>)}</div>
          <SpeakerNote>明确说明动画是思想模型，不是对真实神经网络规模的还原。深度学习能提示图片异常，但“疑似修改”仍需原始电子票据或平台查验来证明。</SpeakerNote>
        </section>

        <section id="llm" className="course-section">
          <SectionHead eyebrow="05 · 大语言模型 / 18分钟" title="从“下一个词”开始，长出理解与生成能力" summary="大语言模型用海量文本训练，通过不断预测下一个Token，学习语言结构、知识模式和上下文关系。" />
          <TokenDemo />
          <div className="why-capable">
            <div className="why-title"><span>为什么它看起来“懂了”？</span><h3>规模 + 上下文 + 指令训练</h3></div>
            <div><b>大量数据</b><p>见过丰富的语言、知识表达和任务模式。</p></div><div><b>大量参数</b><p>形成复杂的数值关系与表示能力。</p></div><div><b>上下文</b><p>能够根据当前资料调整回答。</p></div><div><b>指令训练</b><p>学会按照人的要求组织输出。</p></div>
          </div>
          <div className="hallucination-block">
            <div><p className="mini-label">必须讲清的边界</p><h3>“听起来合理”不等于“已经核验”</h3><p>大模型的生成目标首先是给出语言上合理的后续内容，它不是天然从权威数据库中提取事实。</p></div>
            <div className="truth-ladder"><span>语言流畅</span><i>≠</i><span>事实正确</span><i>≠</i><span>证据充分</span><i>≠</i><span>审计结论</span></div>
          </div>
          <LlmBoundary />
          <div className="case-b-comparison"><div><span>只有规则时</span><strong>住宿720元 &gt; 标准600元</strong><b>结论：超标准预警</b></div><i>＋ 大模型阅读上下文 →</i><div><span>读取制度与审批后</span><strong>展会补充通知 + 事前特殊审批</strong><b className="clear">结论：合理例外，排除误报</b></div></div>
          <SpeakerNote>先让学员亲手选Token，再说明真实模型不是词语接龙玩具，而是在极大规模下学会了复杂表示。讲事项B时突出“大模型不仅帮我们找问题，也能帮助减少误报”。</SpeakerNote>
        </section>

        <section id="agent" className="course-section">
          <SectionHead eyebrow="06 · 智能体 / 15分钟" title="大模型会“想和说”，智能体开始“查和做”" summary="智能体能够感知当前状态，围绕目标进行决策，调用工具采取行动，并根据行动结果继续调整。" />
          <div className="agent-definition"><div className="quote-mark">“</div><p>智能体是一个能够<strong>感知环境</strong>、围绕<strong>目标</strong>进行决策、调用<strong>工具</strong>采取行动，并根据<strong>反馈</strong>继续调整的系统。</p></div>
          <div className="agent-components">
            {[['目标', '最终要完成什么'], ['大模型', '理解、规划与推理'], ['工具', '查询、计算与执行'], ['记忆 / 状态', '记住已经发生什么'], ['控制机制', '权限、停止与人工审批']].map((item, index) => <div key={item[0]}><span>0{index + 1}</span><strong>{item[0]}</strong><p>{item[1]}</p></div>)}
          </div>
          <AgentLoop />
          <div className="is-agent">
            <div><p className="mini-label">课堂判断题</p><h3>网页版大模型一定是智能体吗？</h3></div>
            <div className="agent-answer"><span>仅仅输入文字、输出文字</span><strong>更准确地说是大模型聊天应用</strong></div>
            <div className="agent-answer positive"><span>能调用工具，并依据反馈继续行动</span><strong>具备智能体能力</strong></div>
            <p>判断关键不在于“有没有网页”，而在于是否形成<strong>目标 → 行动 → 反馈 → 再行动</strong>的闭环。</p>
          </div>
          <SpeakerNote>这里不要陷入产品标签争论。强调“智能体能力是程度问题”：自主性有高有低。在审计场景，有限自主、全程留痕、关键节点人工审批通常比完全自主更合适。</SpeakerNote>
        </section>

        <section id="lab" className="course-section lab-section">
          <SectionHead eyebrow="07 · 完整案例 / 20分钟" title="同一个案件，五次能力升级" summary="开启不同能力，观察系统能看到什么、能发现什么、为什么误报，以及什么时候必须主动跨系统核验。" />
          <AuditCaseLab />
          <InvestigationConsole />
          <div className="finding-draft">
            <div className="draft-head"><span>智能体输出 · 审计事项草稿</span><b>等待人工复核</b></div>
            <div className="draft-grid"><div><span>审计疑点</span><p>出租车费报销用途与实际行程不一致。</p></div><div><span>已核事实</span><p>报销称上海至苏州，员工当日实际位于南京。</p></div><div><span>证据来源</span><p>航班、酒店、拜访、发票查验四类独立记录。</p></div><div><span>不确定性</span><p>尚未取得员工解释和原始支付记录。</p></div><div><span>风险表述</span><p>可能存在使用无关票据报销的情况。</p></div><div><span>建议步骤</span><p>访谈员工，检查支付流水和原始行程。</p></div></div>
          </div>
          <SpeakerNote>建议先手动逐步运行控制台。每调用一次工具就停下来问：“如果工具返回相反结果，智能体下一步应该改变吗？”最后用三句话收口：异常不是错误，风险不是舞弊，输出不是结论。</SpeakerNote>
        </section>

        <section id="build" className="course-section">
          <SectionHead eyebrow="08 · 设计工作坊 / 18分钟" title="把“想做一个智能体”变成可执行方案" summary="第一步不是选择模型，而是界定场景、数据、工具、证据、权限、人工节点和评价指标。" />
          <div className="maturity-roadmap">
            {[['L1', '知识助手', '查询制度、解释术语'], ['L2', '文档审阅', '提取条款、对比文本'], ['L3', '数据分析', '运行分析、解释异常'], ['L4', '流程智能体', '多工具协作、形成底稿'], ['L5', '多智能体', '分工协作、质量复核']].map((item, index) => <div key={item[0]} className={index === 0 ? "start" : index === 3 ? "target" : ""}><span>{item[0]}</span><strong>{item[1]}</strong><p>{item[2]}</p>{index === 0 && <i>建议起点</i>}{index === 3 && <i>中期目标</i>}</div>)}
          </div>
          <DesignCanvas />
          <div className="architecture">
            <div className="arch-user">审计人员<span>提出目标 / 审核结论</span></div><i>→</i><div className="arch-agent"><strong>审计智能体</strong><div><span>大模型</span><span>任务状态</span><span>控制机制</span></div></div><i>↔</i><div className="arch-tools"><strong>受控工具区</strong><div><span>制度知识库</span><span>业务数据库</span><span>分析程序</span><span>文档系统</span></div></div>
          </div>
          <SpeakerNote>让三到四组学员各选一个场景，填写目标、输入、工具和人工节点。点评时先问“证据从哪里来”和“哪一步必须由人确认”，不要先讨论模型品牌。</SpeakerNote>
        </section>

        <section id="governance" className="course-section governance-section">
          <SectionHead eyebrow="09 · 风险与治理 / 7分钟" title="能力越强，控制越要走在前面" summary="审计智能体的可信，不来自“模型从不犯错”，而来自权限受控、过程留痕、证据可查、结果可复核。" />
          <div className="risk-grid">
            {[['幻觉', '编造不存在的制度、事实或来源'], ['数据泄露', '敏感资料进入未授权环境'], ['权限过大', '读取、写入或对外发送超出需要'], ['依据过期', '使用错误版本的法规和制度'], ['工具错误', '查询口径、计算逻辑或参数错误'], ['无法追溯', '结论找不到原始证据'], ['过度信任', '把模型建议当作正式判断']].map((item, index) => <div key={item[0]}><span>{String(index + 1).padStart(2, "0")}</span><strong>{item[0]}</strong><p>{item[1]}</p></div>)}
          </div>
          <div className="red-lines"><p>审计智能体六条控制线</p><ol><li>没有证据，不形成确定性结论</li><li>没有授权，不访问数据</li><li>没有复核，不输出正式审计结论</li><li>高风险操作必须人工审批</li><li>所有工具调用必须留痕</li><li>模型建议不能代替职业判断</li></ol></div>
          <SpeakerNote>用“刹车不是为了让车开不动，而是为了让车能够安全地开快”解释治理。提醒学员：真正的生产系统还需结合本单位数据分级、网络安全、保密和审计质量控制制度。</SpeakerNote>
        </section>

        <section id="recap" className="course-section recap-section">
          <SectionHead eyebrow="10 · 总结 / 5分钟" title="记住五个动词，就记住了整堂课" summary="执行、归纳、感知、理解、行动——不同技术解决不同层次的问题，最终在受控系统中组合起来。" />
          <div className="memory-line">{stages.map((stage, index) => <div key={stage.key} style={{ "--stage-color": stage.color } as React.CSSProperties}><span>0{index + 1}</span><strong>{stage.short}</strong><b>{stage.verb}</b></div>)}</div>
          <Quiz />
          <div className="final-message"><p>审计智能体最重要的价值，不是替代审计人员。</p><h3>让机器承担大量查找、比对、整理和初步分析，<br />让人把精力放在<strong>职业判断、沟通、核实与决策</strong>。</h3><div><span>权限可控</span><span>过程留痕</span><span>证据可查</span><span>结论可复核</span></div></div>
          <SpeakerNote>结尾不要停在技术炫酷。请大家写下一个最希望被智能体减轻的重复性任务，作为本单位智能体需求池的第一批输入。</SpeakerNote>
        </section>

        <footer><span>《从“会预测”到“会办事”》</span><p>审计人员的机器学习、大模型与智能体入门课</p><a href="#top">回到顶部 ↑</a></footer>
      </div>
    </main>
  );
}
