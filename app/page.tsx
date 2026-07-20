"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import {
  AgentBranchLab,
  AttentionLab,
  AuditAgentCanvas,
  ConfusionMatrixLab,
  DeepDive,
  DigitsImageLab,
  FunctionFittingLab,
  KnownUnknownBridge,
  LanguageTrainingShift,
  LessonTakeaway,
  NeuronContinuityLab,
  TrainingLifecycle,
} from "./course-interactives";

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
  ["problem", "一笔审计问题", "12′"],
  ["code", "普通代码与规则", "12′"],
  ["ml", "机器学习与拟合", "22′"],
  ["nn", "神经网络", "21′"],
  ["llm", "大语言模型", "23′"],
  ["agent", "智能体", "18′"],
  ["build", "审计智能体落地", "9′"],
  ["summary", "总结与检查", "3′"],
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

function TeacherNote({ time, question, misconception, mustSay, canSkip, children }: { time?: string; question?: string; misconception?: string; mustSay?: string; canSkip?: string; children?: React.ReactNode }) {
  return <aside className="teacher-note"><strong>讲师提示</strong><div>{time && <p><b>预计时间：</b>{time}</p>}{question && <p><b>现场提问：</b>{question}</p>}{misconception && <p><b>常见误解：</b>{misconception}</p>}{mustSay && <p><b>必须讲出：</b>{mustSay}</p>}{canSkip && <p><b>时间不足可跳过：</b>{canSkip}</p>}{children && <p>{children}</p>}</div></aside>;
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

type ViewMode = "student" | "teacher" | "appendix";

function Header({ mode, setMode }: { mode: ViewMode; setMode: (v: ViewMode) => void }) {
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
          <button className={mode === "student" ? "on" : ""} onClick={() => setMode("student")}>学员视图</button>
          <button className={mode === "teacher" ? "on" : ""} onClick={() => setMode("teacher")}>讲师视图</button>
          <button className={mode === "appendix" ? "on" : ""} onClick={() => setMode("appendix")}>附录视图</button>
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
  { id: "BX-42519", date: "05-24", type: "客户招待", amount: "¥988", description: "客户沟通", issue: true, truth: "周日小票含儿童套餐和生日蛋糕，客户系统无拜访记录。" },
  { id: "BX-42702", date: "05-27", type: "机票", amount: "¥5,480", description: "海外会议转国内返程", issue: false, truth: "金额较高，但行程、项目日程和审批均一致。" },
] as const;

const toyDataFiles = [
  { file: "expense_claims.csv", label: "报销明细", count: "26笔", key: "claim_id", role: "整个案例的核心事实表，记录金额、商户、说明、行程号、发票号和审批号。", columns: ["claim_id", "date", "type", "amount", "description"], rows: [["BX-41002", "05-14", "住宿", "720", "参加工业博览会"], ["BX-42017", "05-18", "出租车", "468", "上海机场至苏州客户"], ["BX-42306", "05-23", "出租车", "286", "市内交通"]] },
  { file: "employees.csv", label: "员工主数据", count: "8人", key: "employee_id", role: "提供员工、部门、常驻城市和管理者关系。", columns: ["employee_id", "name", "department", "home_city"], rows: [["E1001", "张伟", "销售一部", "上海"], ["E1004", "陈宇", "销售二部", "北京"], ["E1007", "孙杰", "运营部", "成都"]] },
  { file: "invoice_registry.csv", label: "发票查验库", count: "26条", key: "invoice_no", role: "提供发票平台金额、真伪状态和内外部重复使用线索。", columns: ["claim_id", "invoice_no", "amount", "duplicate_scope"], rows: [["BX-41610", "INV-O-77821", "1280", "本公司跨报销单"], ["BX-41902", "INV-O-77821", "1280", "本公司跨报销单"], ["BX-42017", "INV-T-42017", "468", "第三方发票平台"]] },
  { file: "approvals.csv", label: "审批记录", count: "10条", key: "approval_id", role: "用于区分真正超标与已获得事前审批的合理例外。", columns: ["approval_id", "claim_id", "type", "limit"], rows: [["AP-SPECIAL-017", "BX-41002", "会展期住宿例外", "800"], ["AP-42017", "BX-42017", "差旅申请", "600"], ["AP-42519", "BX-42519", "客户招待", "1200"]] },
  { file: "flight_records.csv", label: "航班行程", count: "6条", key: "trip_id", role: "提供员工真实出发地和抵达地，用于核对报销行程。", columns: ["trip_id", "employee", "date", "origin", "destination"], rows: [["T1002", "E1003", "05-13", "北京", "上海"], ["T2017", "E1004", "05-18", "北京", "南京"], ["T2027", "E1008", "05-27", "法兰克福", "北京"]] },
  { file: "hotel_records.csv", label: "酒店入住", count: "6条", key: "trip_id", role: "提供员工入住城市、日期和房价，可与航班和报销交叉验证。", columns: ["trip_id", "employee", "city", "check_in", "rate"], rows: [["T1002", "E1003", "上海", "05-13", "720"], ["T2017", "E1004", "南京", "05-18", "560"], ["T2026", "E1003", "苏州", "05-24", "560"]] },
  { file: "customer_visits.csv", label: "客户拜访CRM", count: "6条", key: "trip_id", role: "用于验证声称的客户、商务目的和联系人状态。", columns: ["trip_id", "employee", "city", "visit_status", "contact"], rows: [["T1004", "E1001", "杭州", "已完成", "在岗"], ["T2017", "E1004", "苏州", "无登记", "休假"], ["T2025", "E1001", "上海", "无登记", "休假"]] },
  { file: "receipt_ocr.csv", label: "票据OCR与图像检查", count: "7条", key: "claim_id", role: "表示从票据图片中提取的文字、金额、二维码结果、明细和图像完整性分数。", columns: ["claim_id", "printed", "QR", "integrity", "items"], rows: [["BX-42306", "286", "86", "96%", "数字2字体异常"], ["BX-42519", "988", "988", "3%", "儿童套餐|生日蛋糕"], ["BX-42017", "468", "468", "1%", "运输服务"]] },
  { file: "employee_calendar.csv", label: "员工日历", count: "4条", key: "employee_id + date", role: "用于核对当天是否存在业务日程，以及员工当时所在地点。", columns: ["employee", "date", "event_type", "event", "location"], rows: [["E1004", "05-18", "内部会议", "南京区域销售复盘", "南京"], ["E1001", "05-24", "个人日程", "家人生日聚餐", "上海"], ["E1003", "05-25", "供应商审查", "苏州精工质量审查", "苏州"]] },
  { file: "ml_training_examples.csv", label: "历史标注训练集", count: "300条", key: "sample_id", role: "独立于本期待审数据的虚构历史案例：240条训练、60条验证，用于解释拟合、泛化、阈值和数据泄漏。", columns: ["sample_id", "split", "amount_ratio", "claims_48h", "label"], rows: [["HIST-0001", "train", "0.83", "4", "1"], ["HIST-0121", "train", "0.46", "1", "0"], ["HIST-0261", "validation", "0.91", "5", "1"]] },
] as const;

function ToyDatasetExplorer() {
  const [selected, setSelected] = useState(0);
  const item = toyDataFiles[selected];
  return (
    <div className="dataset-explorer">
      <div className="dataset-head"><div><span>本课程的统一Toy Data Pack</span><h3>9张本期待审表 + 1份历史训练集 + 2份制度文档</h3><p>本期待审数据用于发现问题；历史标注数据单独用于训练和验证，避免把答案泄漏给模型。</p></div><div><a href="/toy_audit_case/toy_audit_case.xlsx" download>下载Excel工作簿</a><a className="primary" href="/toy_audit_case_download.zip" download>下载完整数据包</a></div></div>
      <div className="dataset-layout"><div className="dataset-files">{toyDataFiles.map((file, index) => <button key={file.file} className={selected === index ? "active" : ""} onClick={() => setSelected(index)}><span>{String(index + 1).padStart(2, "0")}</span><p><strong>{file.label}</strong><small>{file.file}</small></p><b>{file.count}</b></button>)}</div><div className="dataset-preview"><div className="dataset-file-meta"><span>当前文件</span><h4>{item.file}</h4><p>{item.role}</p><small>主要关联键：<code>{item.key}</code></small></div><div className="mini-data-table"><div>{item.columns.map(column => <strong key={column}>{column}</strong>)}</div>{item.rows.map((row, rowIndex) => <div key={rowIndex}>{row.map((cell, cellIndex) => <span key={cellIndex}>{cell}</span>)}</div>)}</div><div className="policy-files"><span>同时提供的非结构化资料</span><code>expense_policy.md</code><code>special_event_notice.md</code><p>一份常规制度，一份会展期补充通知。</p></div></div></div>
    </div>
  );
}

function DatasetAnchor({ caseId, claimIds, files, task }: { caseId: string; claimIds: string; files: string[]; task: string }) {
  return <div className="dataset-anchor"><span>本章回到贯穿数据</span><strong>情形 {caseId} · {claimIds}</strong><p>{task}</p><div>{files.map(file => <code key={file}>{file}</code>)}</div></div>;
}

function SingleCaseProject() {
  const [revealed, setRevealed] = useState(false);
  return <div className="single-case-project">
    <div className="single-case-head"><div><span>整堂课只审这一笔</span><h3>BX-42306 · 出租车费</h3><p>任务：判断是否需要转人工核查，并说清“为什么”。</p></div><button onClick={() => setRevealed(!revealed)}>{revealed ? "收起后续证据" : "查看后续证据"}</button></div>
    <div className="single-case-facts"><div><span>报销表</span><strong>286元</strong><p>摘要：市内交通</p></div><div><span>现有规则</span><strong>上限300元</strong><p>低于阈值可通过</p></div><div className={revealed ? "revealed" : "covered"}><span>票面图片</span><strong>{revealed ? "看起来是 286" : "尚未查看"}</strong><p>{revealed ? "数字2的笔画可疑" : "原始图像在另一系统"}</p></div><div className={revealed ? "revealed" : "covered"}><span>查验平台</span><strong>{revealed ? "金额 86元" : "尚未查询"}</strong><p>{revealed ? "与报销额差200元" : "需要调用查验工具"}</p></div></div>
    <div className="single-case-question"><span>课堂问题</span><strong>为什么“286 &lt; 300”的规则没错，但它还是没能解决这笔报销？</strong><p>答案不是“规则落后”，而是它只能使用人事先写进程序的字段和条件。</p></div>
  </div>;
}

function SingleCaseAnchor({ step, reads, task }: { step: string; reads: string; task: string }) {
  return <div className="single-case-anchor"><span>同一笔 BX-42306 · {step}</span><strong>这一步能看见：{reads}</strong><p>{task}</p></div>;
}

function CapabilityBoundary({ method, input, output, unique, limit }: { method: string; input: string; output: string; unique: string; limit: string }) {
  return <div className="capability-boundary"><div><span>方法</span><strong>{method}</strong></div><div><span>输入</span><strong>{input}</strong></div><div><span>它独有的增量能力</span><strong>{unique}</strong></div><div><span>这一步的输出</span><strong>{output}</strong></div><div className="limit"><span>仍然做不到</span><strong>{limit}</strong></div></div>;
}

function CapabilityChain() {
  const rows = [
    ["规则", "报销表", "精确执行人已知条件", "286<300，通过", "不会看图片"],
    ["机器学习", "表格特征+历史标签", "学会多个弱信号的组合", "提高核查优先级", "概率不是证据"],
    ["神经网络", "票面像素", "从原始图像学习笔画和数字", "识别票面286", "不懂制度意义"],
    ["大模型", "识别结果+制度文字", "综合语言与上下文", "说明286与86的矛盾", "不会天然进企业系统"],
    ["智能体", "目标+工具反馈", "主动取数、根据结果继续", "形成证据包并转人工", "不应自动定性"],
  ];
  return <div className="capability-chain"><div className="capability-chain-head"><span>先看全貌</span><h3>五种方法不是替代关系，而是每次多一种能力</h3></div><div className="capability-chain-table"><div className="chain-row chain-header"><span>方法</span><span>看什么</span><span>新能力</span><span>对本案例的输出</span><span>边界</span></div>{rows.map(row => <div className="chain-row" key={row[0]}>{row.map((cell, i) => i === 0 ? <strong key={cell}>{cell}</strong> : <span key={cell}>{cell}</span>)}</div>)}</div></div>;
}

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
        <div className="brief-stats"><div><strong>42,000</strong><span>笔报销</span></div><div><strong>4</strong><span>名审计人员</span></div><div><strong>10</strong><span>个工作日</span></div><div><strong>9+2</strong><span>张数据表 + 制度文档</span></div></div>
        <div className="brief-deliverable"><span>必须交付</span><strong>不是一万条“可能异常”的报警</strong><p>而是一份按风险排序的疑点清单：每项包含事实、适用标准、原始证据、不确定性和下一步核查建议。</p></div>
      </div>

      <ToyDatasetExplorer />
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
    label: "用12笔历史出租车费训练模型",
    code: `# 真实运行：一个最小的逻辑分类模型
import math

# 与上方动态图相同的7个历史点：x压缩表示“组合异常程度”
demo = [(0.12,0),(0.24,0),(0.39,0),(0.52,0),(0.63,1),(0.77,1),(0.91,1)]
demo_w = demo_b = 0.0
for epoch in range(61):
    demo_p = [1/(1+math.exp(-(demo_w*x+demo_b))) for x,y in demo]
    demo_loss = sum(-(y*math.log(p+1e-9)+(1-y)*math.log(1-p+1e-9)) for p,(x,y) in zip(demo_p,demo))/len(demo)
    if epoch in (0,10,60):
        print(f"动态图 epoch={epoch:2d} w={demo_w:.2f} b={demo_b:.2f} loss={demo_loss:.3f}")
    demo_w -= 2.0 * sum((p-y)*x for p,(x,y) in zip(demo_p,demo))/len(demo)
    demo_b -= 2.0 * sum(p-y for p,(x,y) in zip(demo_p,demo))/len(demo)

print("\\n--- 现在用三个可解释特征训练同一类任务 ---")

# X的三列：金额/上限、摘要是否笼统、是否缺少行程号
# y：历史上是否最终被确认为需要重点核查
history = [
    ([.22,0,0],0), ([.35,0,0],0), ([.48,1,0],0), ([.52,0,1],0),
    ([.61,0,0],0), ([.67,1,0],0), ([.71,0,1],0), ([.78,1,1],1),
    ([.84,1,0],1), ([.88,0,1],1), ([.93,1,1],1), ([.98,1,1],1),
]

def sigmoid(z):
    return 1 / (1 + math.exp(-max(-30, min(30, z))))

weights, bias, lr = [0.0, 0.0, 0.0], 0.0, 1.2
print("初始参数：", weights, "bias=", bias)
for epoch in range(501):
    predictions = [sigmoid(sum(w*v for w,v in zip(weights,x)) + bias) for x,y in history]
    loss = sum(-(y*math.log(p+1e-9)+(1-y)*math.log(1-p+1e-9)) for p,(x,y) in zip(predictions,history))/len(history)
    if epoch in (0, 10, 50, 200, 500):
        print(f"epoch={epoch:3d} loss={loss:.4f}")
    for j in range(3):
        weights[j] -= lr * sum((p-y)*x[j] for p,(x,y) in zip(predictions,history))/len(history)
    bias -= lr * sum(p-y for p,(x,y) in zip(predictions,history))/len(history)

case = [.953, 1, 1]  # BX-42306：286/300，摘要笼统，缺行程号
risk = sigmoid(sum(w*v for w,v in zip(weights,case)) + bias)
print("\\n训练后参数：", [round(w,3) for w in weights], "bias=", round(bias,3))
print("BX-42306 重点核查概率：", f"{risk:.1%}")
print("模型增加了什么：它能组合多个弱信号。")
print("模型没有什么：它没看票据图片，概率也不是违规结论。")`,
  },
  neural: {
    label: "训练8×8手写数字识别网络",
    code: `# 真实运行：从64个像素学习识别0—9
import csv
from pathlib import Path
import numpy as np

path = Path("/data/digits_8x8_subset.csv")
if not path.exists():
    path = Path("public/simple_audit_demo/digits_8x8_subset.csv")
rows = list(csv.DictReader(path.open(encoding="utf-8")))
X = np.array([[float(row[f"pixel_{i:02d}"]) for i in range(64)] for row in rows]) / 16.0
y = np.array([int(row["label"]) for row in rows])
train = np.array([row["split"] == "train" for row in rows])
test = ~train
X_train, y_train, X_test, y_test = X[train], y[train], X[test], y[test]

# 网络结构：64个像素 → 24个隐藏神经元 → 10个数字类别
rng = np.random.default_rng(7)
W1 = rng.normal(0, .18, (64, 24)); b1 = np.zeros(24)
W2 = rng.normal(0, .18, (24, 10)); b2 = np.zeros(10)
learning_rate = .35

for epoch in range(301):
    hidden = np.maximum(0, X_train @ W1 + b1)
    logits = hidden @ W2 + b2
    logits -= logits.max(axis=1, keepdims=True)
    probs = np.exp(logits); probs /= probs.sum(axis=1, keepdims=True)
    loss = -np.log(probs[np.arange(len(y_train)), y_train] + 1e-9).mean()
    if epoch in (0, 10, 50, 150, 300):
        print(f"epoch={epoch:3d} loss={loss:.4f}")
    grad = probs.copy(); grad[np.arange(len(y_train)), y_train] -= 1; grad /= len(y_train)
    gW2 = hidden.T @ grad; gb2 = grad.sum(axis=0)
    hidden_grad = (grad @ W2.T) * (hidden > 0)
    gW1 = X_train.T @ hidden_grad; gb1 = hidden_grad.sum(axis=0)
    W1 -= learning_rate*gW1; b1 -= learning_rate*gb1
    W2 -= learning_rate*gW2; b2 -= learning_rate*gb2

test_hidden = np.maximum(0, X_test @ W1 + b1)
predictions = (test_hidden @ W2 + b2).argmax(axis=1)
print("\\n独立测试集准确率：", f"{(predictions==y_test).mean():.1%}")
print("训练完保存的东西：W1", W1.shape, "b1", b1.shape, "W2", W2.shape, "b2", b2.shape)
for digit in (2, 8, 6):
    index = np.where(y_test == digit)[0][0]
    print(f"票面样本 {digit} → 模型识别为 {predictions[index]}")
print("这一步只识别出票面数字286；它还不知道“金额不一致”在制度上意味什么。")`,
  },
  language: {
    label: "训练极小语言模型",
    code: `# 真实运行：训练一个极小的“下一个字符”语言模型
# 它不是Transformer，但能展示Tokenizer、训练、权重和生成的基本链条
import random
random.seed(3)

corpus = "报销金额必须与发票查验平台金额一致。不一致时应转人工复核。审计结论需要原始证据。"
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

text = "报"
for _ in range(18):
    row = weights[token_to_id[text[-1]]]
    next_token = random.choices(tokens, weights=row, k=1)[0]
    text += next_token
print("\\n生成结果：", text)
print("\\n真实LLM用多层Transformer张量替代这张简单概率表。")`,
  },
  attention: {
    label: "计算一次微型Attention",
    code: `# 真实运行：不用第三方库，计算一次单头Attention
import math

tokens = ["报销金额286", "票面286", "平台86", "金额不一致"]
# 每个Token先被表示成一个很小的向量；真实模型的维度会大得多
Q = [0.9, 0.2, 0.7]
keys = [
    [0.5, 0.1, 0.2],
    [0.6, 0.2, 0.5],
    [0.9, 0.1, 0.8],
    [0.8, 0.2, 0.9],
]
values = [
    [0.8, 0.1],
    [0.3, 0.4],
    [0.1, 0.9],
    [0.2, 1.0],
]

scores = [sum(q*k for q, k in zip(Q, key)) / math.sqrt(len(Q)) for key in keys]
largest = max(scores)
exp_scores = [math.exp(score - largest) for score in scores]
weights = [value / sum(exp_scores) for value in exp_scores]
context = [sum(weight * value[i] for weight, value in zip(weights, values)) for i in range(2)]

print("当前Query：判断是否应转人工复核")
for token, score, weight in zip(tokens, scores, weights):
    print(f"{token:6s}  原始分数={score:.3f}  注意力权重={weight:.1%}")
print("加权汇总后的上下文向量：", [round(v, 3) for v in context])
print("提醒：权重表示当前计算中的信息关联，不是事实证明或因果关系。")`,
  },
  agent: {
    label: "运行智能体循环",
    code: `# 真实运行：同一笔BX-42306，根据工具反馈选择下一步
goal = "核验BX-42306的286元出租车费，形成可复核证据包"
tools = {
    "claim": {"status":"ok", "amount":286, "limit":300, "source":"expense_claims.csv / BX-42306"},
    "read_receipt": {"status":"ok", "recognized_amount":286, "source":"receipt_image / neural-network"},
    "verify_platform": {"status":"ok", "verified_amount":86, "source":"invoice_registry / INV-T-42306"},
    "policy": {"status":"ok", "rule":"报销金额必须与查验平台一致", "source":"expense_policy.md / 第12条"},
}
state = {"evidence": {}, "failures": [], "calls": 0, "max_calls": 4}

def choose_next_action(state):
    evidence = state["evidence"]
    if state["failures"]:
        return "stop_error"
    if "policy" in evidence:
        return "stop_review"
    if state["calls"] >= state["max_calls"]:
        return "stop_budget"
    if "claim" not in evidence: return "claim"
    if "read_receipt" not in evidence: return "read_receipt"
    if "verify_platform" not in evidence: return "verify_platform"
    mismatch = evidence["read_receipt"]["recognized_amount"] != evidence["verify_platform"]["verified_amount"]
    if not mismatch: return "stop_consistent"
    if "policy" not in evidence: return "policy"
    return "stop_review"

print("目标：", goal)
while True:
    action = choose_next_action(state)
    if action.startswith("stop"):
        print("\\n停止动作：", action)
        break
    state["calls"] += 1
    result = tools[action]
    print(f"\\n第{state['calls']}步：调用 {action}")
    print("工具返回：", result)
    if result["status"] != "ok":
        state["failures"].append({"tool": action, "result": result})
    else:
        state["evidence"][action] = result
    print("下一步将依据当前state重新选择，而不是执行固定列表。")

print("已取得证据：", list(state["evidence"]))
print("工具失败：", state["failures"] or "无")
print("系统动作：保留来源与不确定性，提交审计人员复核。")
print("系统禁止：自动认定违规、错报或舞弊。")`,
  },
  rule: {
    label: "运行普通规则",
    code: `# 真实运行：规则只检查人事先写出的条件
claim = {"claim_id":"BX-42306", "type":"出租车", "amount":286, "description":"市内交通"}
taxi_limit = 300

result = "待核查" if claim["amount"] > taxi_limit else "通过"
print("输入：", claim)
print("规则：金额 > 300元则报警")
print("输出：", result)
print("规则做对了什么：精确执行286 < 300。")
print("规则没做什么：它没读取票据图片，也没查询平台金额86元。")`,
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
    // Worker initialization is the external synchronization performed by this effect.
    // eslint-disable-next-line react-hooks/set-state-in-effect
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
      // Reflect an external worker status transition in the editor output.
      // eslint-disable-next-line react-hooks/set-state-in-effect
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
  ["读取expense_claims.csv", "employee_id=E1004，trip_id=T2017，报销称“上海机场至苏州客户”，金额468元。"],
  ["模型判断", "缺少真实抵达城市、入住地点、客户拜访、当天日历和发票重复状态。"],
  ["读取flight_records.csv", "T2017：E1004当天航班是北京→南京，09:51抵达。"],
  ["读取hotel_records.csv", "T2017：E1004当晚入住南京江宁商务酒店。"],
  ["读取customer_visits.csv", "T2017：苏州无拜访登记，对应联系人处于休假。"],
  ["读取employee_calendar.csv", "E1004当天14:00在南京参加区域销售复盘。"],
  ["读取invoice_registry.csv", "INV-T-42017为真发票，但在第三方平台存在重复引用EXT-COMPANY-7781。"],
  ["控制规则", "证据达到升级阈值；不能自行定性，提交审计人员复核。"],
] as const;

function AgentTrace() {
  const [visible, setVisible] = useState(0);
  const [auto, setAuto] = useState(false);
  const box = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!auto) return;
    if (visible >= agentTraceSteps.length) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
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

// Kept temporarily as a content migration reference until the next cleanup pass.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function LegacyHome() {
  const [notes, setNotes] = useState(false);
  return (
    <PythonKernelProvider>
    <main id="top" className={notes ? "show-notes" : ""}>
      <Header mode={notes ? "teacher" : "student"} setMode={(next) => setNotes(next !== "student")} />
      <aside className="sidenav"><div><span>2小时课程</span><strong>从规则到智能体</strong></div><nav>{nav.map((x, i) => <a href={`#${x[0]}`} key={x[0]}><span>{String(i + 1).padStart(2, "0")}</span><b>{x[1]}</b><small>{x[2]}</small></a>)}</nav></aside>
      <div className="page">
        <section className="hero">
          <p>面向审计人员的2小时人工智能基础课</p>
          <h1>42,000笔报销，4名审计人员，10个工作日。<br />怎样找到真正值得核查的问题？</h1>
          <div className="hero-lead">我们先不谈AI、模型或智能体。先把审计目标、数据、时间限制和应交付的证据说清楚，再一步步引入技术。</div>
          <div className="hero-scenario"><div><span>数据规模</span><strong>42,000笔</strong><small>差旅及招待费报销</small></div><div><span>人力限制</span><strong>4人 × 10天</strong><small>不可能靠人工逐笔深查</small></div><div><span>证据分布</span><strong>9张表 + 2文档</strong><small>通过报销号、行程号和发票号关联</small></div><div><span>最终交付</span><strong>可复核疑点</strong><small>不是笼统的“AI风险分”</small></div></div>
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
          <DatasetAnchor caseId="A / B" claimIds="BX-41610、BX-41902 / BX-41002" files={["expense_claims.csv", "invoice_registry.csv", "approvals.csv", "special_event_notice.md"]} task="先用确定性规则查出相同发票号；再观察“住宿费 > 600”为什么会把有月度通知和事前审批的BX-41002误报。" />
          <div className="concept-grid four"><div><span>变量</span><strong>保存数据</strong><p>例如金额、日期、审批状态。</p></div><div><span>条件</span><strong>进行判断</strong><p>如果金额超标，就进入下一步。</p></div><div><span>循环</span><strong>重复处理</strong><p>对42,000笔报销逐笔执行。</p></div><div><span>函数</span><strong>封装步骤</strong><p>把“检查住宿标准”写成可复用模块。</p></div></div>
          <CodeLab />
          <InlinePythonLab example="rule" guide="代码先只读expense_claims.csv中BX-41002的720元，因超过600元而报警；加入approvals.csv和会展通知后，再按明确条件排除误报。" />
          <div className="content-block"><h3>规则系统的本质</h3><p>规则系统把业务人员已经知道的判断逻辑写成代码。审计人员先定义“什么情况值得检查”，程序再批量执行。它是自动化，但不一定属于机器学习。</p><div className="two-col"><div><strong>它非常擅长</strong><ul><li>金额、日期和数量的精确比较</li><li>发票号码完全重复</li><li>审批缺失、字段为空</li><li>确定性强、必须一致执行的制度条件</li></ul></div><div><strong>它无法自己做到</strong><ul><li>从历史案例中总结新的规律</li><li>理解图片和自然语言</li><li>发现没有预先写出的组合模式</li><li>自动理解制度中的复杂例外</li></ul></div></div></div>
          <div className="important"><strong>必须记住</strong><p>代码不是AI的反义词。机器学习、大模型和智能体最终也都由代码运行；区别在于，一部分判断逻辑不再由程序员逐条写出，而是由模型从数据中学习得到。</p></div>
          <Bridge from="规则系统的瓶颈" problem="四笔费用分别是1,960、1,980、1,950、1,990元，全部低于2,000元审批阈值。单笔规则全部放过，但组合起来很可疑。" to="机器学习" />
          <TeacherNote>逐行解释互动代码。强调 specialPeriod 按钮不会改变结果，因为代码根本没有使用这个变量。计算机不会因为“人觉得有关系”就自动理解。</TeacherNote>
        </section>

        <section id="ml" className="lesson">
          <SectionTitle no="03" time="16分钟" title="第二步：什么是机器学习" intro="当人很难把所有模式写成规则时，可以给机器历史案例，让模型从数据中学习输入和结果之间的统计关系。" />
          <Definition term="机器学习（Machine Learning）" simple="不给计算机写出每一条判断规则，而是给它许多案例，让它自己总结哪些输入通常对应哪些结果。" precise="机器学习使用数据和算法估计模型参数，使模型能够对训练时没有见过的新数据进行预测、分类或排序。" />
          <DatasetAnchor caseId="C" claimIds="BX-41881 — BX-41884" files={["expense_claims.csv", "expense_policy.md"]} task="四笔报销分别是1,960、1,980、1,950和1,990元，同员工、同商户、两天内合计7,880元。单笔均没有越过2,000元阈值，但组合模式明显异常。" />
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
          <DatasetAnchor caseId="D" claimIds="BX-42306" files={["expense_claims.csv", "invoice_registry.csv", "receipt_ocr.csv"]} task="报销金额和图上可见字样都是286元，但二维码与发票平台都是86元，图像完整性分数为96%。问题来自原始图像而不是表格字段。" />
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
          <DatasetAnchor caseId="B / E" claimIds="BX-41002 / BX-42519" files={["expense_policy.md", "special_event_notice.md", "receipt_ocr.csv", "customer_visits.csv", "employee_calendar.csv"]} task="大模型需要理解制度例外，也需要综合“周日、儿童套餐、生日蛋糕、CRM无拜访、家人生日”这组语义证据。" />
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
          <DatasetAnchor caseId="F" claimIds="BX-42017" files={["expense_claims.csv", "flight_records.csv", "hotel_records.csv", "customer_visits.csv", "employee_calendar.csv", "invoice_registry.csv"]} task="从报销表出发，利用trip_id=T2017和employee_id=E1004主动调用多个数据工具，逐步证明上海→苏州的声称与南京行程相互矛盾。" />
          <div className="model-system"><div><span>大模型</span><strong>一个模型</strong><p>输入上下文，输出文字或结构化指令。</p><small>擅长：理解、归纳、生成、规划建议</small></div><i>≠</i><div><span>智能体</span><strong>一个运行系统</strong><p>模型 + 目标 + 工具 + 状态 + 控制机制。</p><small>擅长：围绕目标持续完成多步骤任务</small></div></div>
          <div className="agent-loop"><span>智能体的基本循环</span>{["接收目标", "观察现状", "判断缺口", "选择工具", "执行行动", "读取反馈", "继续或停止"].map((x, i) => <div key={x}><b>{i + 1}</b><p>{x}</p></div>)}</div>
          <AgentTrace />
          <InlinePythonLab example="agent" guide="代码围绕BX-42017，按计划调用航班、酒店、CRM、日历和发票五个数据工具，把每次观察放入evidence，达到停止条件后交由审计人员复核。" />
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

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function ComplexHome() {
  const [mode, setMode] = useState<ViewMode>("student");
  return (
    <PythonKernelProvider>
      <main id="top" className={`view-${mode} ${mode !== "student" ? "show-notes" : ""}`}>
        <Header mode={mode} setMode={setMode} />
        <aside className="sidenav"><div><span>2小时课程</span><strong>从规则到智能体</strong></div><nav>{nav.map((x, i) => <a href={`#${x[0]}`} key={x[0]}><span>{String(i + 1).padStart(2, "0")}</span><b>{x[1]}</b><small>{x[2]}</small></a>)}</nav></aside>
        <div className="page">
          <section className="hero">
            <p>面向审计人员的2小时人工智能基础课</p>
            <h1>42,000笔报销，4名审计人员，10个工作日。<br />怎样找到真正值得核查的问题？</h1>
            <div className="hero-lead">我们不从术语开始，而从一个完整审计任务开始。每引入一种技术，只回答：它为什么出现、解决了什么、还解决不了什么。</div>
            <div className="hero-scenario"><div><span>数据规模</span><strong>42,000笔</strong><small>差旅及招待费报销</small></div><div><span>人力限制</span><strong>4人 × 10天</strong><small>不可能靠人工逐笔深查</small></div><div><span>证据分布</span><strong>9表 + 历史集 + 2文档</strong><small>训练数据与本期待审数据严格分离</small></div><div><span>最终交付</span><strong>可复核疑点</strong><small>不是笼统的“AI风险分”</small></div></div>
            <div className="hero-path">{stages.map((stage, index) => <a key={stage.key} href={`#${stage.key}`}><span>0{index + 1}</span><strong>{stage.name}</strong><small>{stage.question}</small></a>)}</div>
            <a className="hero-start" href="#problem">先进入这个审计任务 <span>↓</span></a>
          </section>

          <section id="problem" className="lesson">
            <SectionTitle no="01" time="0—12分钟" title="第一步不是选技术，而是把审计问题说清楚" intro="先亲手做一次筛查，再看一笔报销的证据怎样散落在不同系统中，最后定义什么才算真正解决。" />
            <ProblemSection />
            <LessonTakeaway>技术的目标不是生成一个风险分，而是帮助审计人员形成可追溯、可解释、可复核的疑点。</LessonTakeaway>
            <Bridge from="人工逐笔检查的瓶颈" problem="人看不完42,000笔记录，但大量确定性检查其实可以被准确描述并重复执行。" to="普通代码与规则" />
            <TeacherNote time="12分钟" question="你刚才判断错了，还是当时根本没有足够信息？" misconception="异常、疑点、错报和舞弊不是同一个概念。" mustSay="本课程的交付目标是可复核疑点，不是AI分数。" canSkip="数据文件逐项预览可在课后展开。" />
          </section>

          <section id="code" className="lesson">
            <SectionTitle no="02" time="12—24分钟" title="普通代码与规则：把已经知道的判断写出来" intro="当判断关系明确时，不需要模型。人把步骤和条件写清楚，计算机机械、快速、准确地执行。" />
            <Definition term="计算机程序" simple="一组明确的指令，告诉计算机先做什么、后做什么，以及遇到不同条件时怎么办。" precise="程序由变量、条件、循环、函数等结构组成；同样的输入和同样的代码，通常得到同样的输出。" />
            <DatasetAnchor caseId="A / B" claimIds="BX-41610、BX-41902 / BX-41002" files={["expense_claims.csv", "invoice_registry.csv", "approvals.csv", "special_event_notice.md"]} task="先用确定性规则查出相同发票号；再观察“住宿费 > 600”为什么会把有月度通知和事前审批的BX-41002误报。" />
            <div className="concept-grid four"><div><span>变量</span><strong>保存数据</strong><p>例如金额、日期、审批状态。</p></div><div><span>条件</span><strong>进行判断</strong><p>如果金额超标，就进入下一步。</p></div><div><span>循环</span><strong>重复处理</strong><p>对42,000笔报销逐笔执行。</p></div><div><span>函数</span><strong>封装步骤</strong><p>把“检查住宿标准”写成可复用模块。</p></div></div>
            <CodeLab />
            <InlinePythonLab example="rule" guide="代码先只读expense_claims.csv中BX-41002的720元，因超过600元而报警；加入approvals.csv和会展通知后，再按明确条件排除误报。" />
            <div className="content-block"><h3>规则系统的本质</h3><p>规则把业务人员已经知道的判断逻辑写成代码。它是自动化，但不一定属于机器学习。</p><div className="two-col"><div><strong>它非常擅长</strong><ul><li>金额、日期和数量的精确比较</li><li>发票号码完全重复</li><li>审批缺失、字段为空</li><li>必须一致执行的制度条件</li></ul></div><div><strong>它无法自己做到</strong><ul><li>从案例中总结新规律</li><li>理解图片和自然语言</li><li>发现没有预先写出的组合模式</li><li>自动理解复杂例外</li></ul></div></div></div>
            <LessonTakeaway>规则不是落后的技术；边界明确、必须一致执行的检查，规则通常更可靠、更便宜、更容易解释。</LessonTakeaway>
            <Bridge from="规则系统的瓶颈" problem="四笔费用分别是1,960、1,980、1,950、1,990元，全部低于2,000元审批阈值。单笔规则全部放过，但组合起来很可疑。" to="机器学习" />
            <TeacherNote time="12分钟" question="specialPeriod变量已经存在，为什么程序结果没有变化？" misconception="代码不是AI的反义词；模型和智能体最终也由代码运行。" mustSay="人写判断逻辑，计算机只执行被明确表达的逻辑。" canSkip="函数封装的技术语法。" />
          </section>

          <section id="ml" className="lesson">
            <SectionTitle no="03" time="24—46分钟" title="机器学习：把“学习”还原成函数拟合" intro="当关系无法完整写成规则、但存在历史案例时，可以选择一个带参数的函数，让程序通过最小化误差寻找较合适的参数。" />
            <KnownUnknownBridge />
            <Definition term="机器学习（Machine Learning）" simple="给模型许多带答案的历史案例，让它寻找一个能够近似输入与结果关系的函数。" precise="机器学习通过优化算法估计参数θ，使参数化函数fθ在训练数据上的总体损失较小，并期待它能泛化到未见数据。" />
            <DatasetAnchor caseId="C" claimIds="BX-41881 — BX-41884" files={["classroom_training/ml_training_examples.csv", "expense_claims.csv", "expense_policy.md"]} task="300条历史标注案例只用于训练和验证；训练完成后，再把四笔本期待审报销作为新数据输入模型。" />
            <div className="notation"><div><span>输入 X</span><strong>特征</strong><p>金额比例、48小时笔数、商户集中、说明相似度。</p></div><i>→</i><div><span>函数 fθ</span><strong>带参数的模型</strong><p>训练改变参数θ，从而改变函数形状。</p></div><i>→</i><div><span>输出 ŷ</span><strong>预测</strong><p>重点核查概率，不是违规结论。</p></div><div className="label"><span>训练时还需要</span><strong>真实标签 y</strong><p>历史上经过审计确认的结果。</p></div></div>
            <FunctionFittingLab />
            <TrainingLifecycle />
            <InlinePythonLab example="ml" guide="代码读取300条独立历史案例，前240条训练、后60条验证。依次找出特征X、标签y、参数、Loss、验证集结果和事项C预测；注意Loss下降不等于模型已经可靠。" />
            <ConfusionMatrixLab />
            <div className="content-block"><h3>监督学习和无监督学习</h3><div className="two-col"><div><strong>监督学习：有历史答案</strong><p>用经过确认的正常和疑点案例训练分类模型。</p></div><div><strong>无监督学习：没有标准答案</strong><p>按照相似性分组或寻找离群点，发现未知模式。</p></div></div></div>
            <DeepDive title="解析解、梯度、交叉熵与过拟合"><p><b>解析解不是机器学习的分界线。</b>线性回归在一些条件下可以直接求出最优参数；复杂模型通常使用数值优化逐步逼近。梯度表示Loss增大最快的方向，训练沿相反方向调整参数。分类模型常用交叉熵惩罚“自信但错误”的预测。过拟合则意味着训练题表现很好，新题表现很差。</p></DeepDive>
            <LessonTakeaway>机器学习不是自己产生真理，而是从历史案例中找到一个能近似输入与结果关系的函数。</LessonTakeaway>
            <Bridge from="机器学习的瓶颈" problem="表格里只写着“出租车费286元”。真正的异常藏在票据图片中：数字2的字体不一致，二维码金额其实是86元。" to="神经网络与深度学习" />
            <TeacherNote time="22分钟" question="Loss下降能否证明模型已经适合上线？为什么？" misconception="机器学习不等于没有解析解，也不等于模型自动发现真相。" mustSay="训练是寻找参数；验证是检查未见数据；推理时参数固定。" canSkip="附录中的交叉熵和梯度解释。" />
          </section>

          <section id="nn" className="lesson">
            <SectionTitle no="04" time="46—67分钟" title="神经网络：把被拟合的函数变得更有表达能力" intro="神经网络没有跳出机器学习。它仍然通过Loss训练，只是把函数变成由很多层、很多参数组成的复杂结构。" />
            <Definition term="人工神经网络" simple="许多简单计算单元连接成层，输入经过一层层加权和非线性变换，最后产生预测结果。" precise="神经网络是可微分的参数化函数；训练通过损失函数衡量错误，再用反向传播和优化算法调整大量权重。" />
            <DatasetAnchor caseId="D" claimIds="BX-42306" files={["expense_claims.csv", "invoice_registry.csv", "receipt_ocr.csv"]} task="报销金额和图上可见字样都是286元，但二维码与发票平台都是86元，图像完整性分数为96%。问题来自原始图像而不是表格字段。" />
            <div className="equation"><span>从上一章继续</span><strong>把“加权求和 + 非线性变换”连接成多层函数</strong><code>output = activation(w₁x₁ + w₂x₂ + … + bias)</code><p>训练目标没有改变：仍然是调整参数、降低Loss。</p></div>
            <NeuronContinuityLab />
            <NeuralCheckpointExplorer />
            <InlinePythonLab example="neural" guide="代码中W1、b1、W2、b2就是训练后保存的参数。先看Loss下降，再把训练轮数改成10，比较参数和预测概率。" />
            <div className="training-loop"><span>一次训练循环</span>{[["1", "做预测"], ["2", "与答案比较"], ["3", "计算Loss"], ["4", "反向传播"], ["5", "微调权重"], ["6", "重复多轮"]].map((x, i) => <div key={x[0]}><b>{x[0]}</b><p>{x[1]}</p>{i < 5 && <i>→</i>}</div>)}</div>
            <DeepDive title="反向传播到底做什么"><p>反向传播高效计算每个参数对Loss影响有多大，优化器再据此做小幅调整。课堂不推导链式法则，只要求理解：预测错了以后，系统能够知道每个参数应往哪个方向改一点。</p><NeuralNetworkLab /></DeepDive>
            <LessonTakeaway>神经网络仍然是机器学习；它只是把被拟合的函数变成了多层、非线性、拥有大量参数的复杂函数。</LessonTakeaway>
            <Bridge from="深度学习的瓶颈" problem="视觉模型识别出了“儿童套餐”和“生日蛋糕”，但怎样把这些词与客户招待目的、日期和制度联系起来？" to="大语言模型" />
            <TeacherNote time="21分钟" question="神经网络与上一章的机器学习，训练目标有什么不同？" misconception="神经网络不是电子大脑，也不会因为层数多就自动理解业务。" mustSay="变化的是函数结构和参数规模，不变的是用Loss训练参数。" canSkip="反向传播附录和旧版网络拆解互动。" />
          </section>

          <section id="llm" className="lesson">
            <SectionTitle no="05" time="67—90分钟" title="大语言模型：用神经网络学习Token序列" intro="大语言模型是在大规模Token序列上训练、通常采用Transformer架构的深度神经网络。" />
            <Definition term="大语言模型（LLM）" simple="一个根据前文不断预测下一个Token，并由此生成语言的大型神经网络。" precise="大语言模型通过预训练最小化Token序列预测损失，再经过指令微调和偏好对齐形成更适合问答与任务执行的行为。" />
            <DatasetAnchor caseId="B / E" claimIds="BX-41002 / BX-42519" files={["expense_policy.md", "special_event_notice.md", "receipt_ocr.csv", "customer_visits.csv", "employee_calendar.csv"]} task="大模型需要理解制度例外，也需要综合“周日、儿童套餐、生日蛋糕、CRM无拜访、家人生日”这组语义证据。" />
            <LanguageTrainingShift />
            <TokenLab />
            <LlmPipeline />
            <AttentionLab />
            <LlmCheckpointExplorer />
            <InlinePythonLab example="language" guide="先看Tokenizer如何把字符映射成编号，再看训练如何得到bigram.weight，最后看模型怎样逐个生成字符。真实LLM用多层Transformer张量完成同类预测。" />
            <div className="three-stages"><div><span>阶段1</span><strong>预训练</strong><p>在海量文本上反复预测下一个Token。</p></div><div><span>阶段2</span><strong>指令训练与对齐</strong><p>学习按照人的指令回答并遵守约束。</p></div><div><span>阶段3</span><strong>推理使用</strong><p>参数固定，模型逐Token生成当前回答。</p></div></div>
            <div className="llm-addons"><div><span>提示词</span><strong>把任务讲清楚</strong><p>规定角色、目标和输出格式。</p></div><div><span>上下文</span><strong>提供当前资料</strong><p>合同、制度和底稿。</p></div><div><span>RAG</span><strong>先检索再回答</strong><p>找到相关制度并保留出处。</p></div><div><span>工具</span><strong>让模型能查和算</strong><p>数据库、程序和发票服务。</p></div></div>
            <div className="hallucination"><div><strong>为什么会幻觉</strong><p>模型首先生成统计上合理的后续文字，而不是天然从权威系统提取经核验的事实。</p></div><div><span>语言流畅</span><i>≠</i><span>事实正确</span><i>≠</i><span>证据充分</span><i>≠</i><span>审计结论</span></div></div>
            <DeepDive title="用纯Python查看一次微型Attention计算"><InlinePythonLab example="attention" guide="观察Query、Key、Value怎样形成注意力权重。重点理解相关信息被加权汇总，不要把权重当作因果关系或事实证明。" /></DeepDive>
            <LessonTakeaway>大模型不是装满答案的数据库，而是一个根据上下文预测后续Token的大型神经网络。</LessonTakeaway>
            <Bridge from="大模型的瓶颈" problem="模型可以建议核对航班和酒店，但不会天然进入企业系统，也不会自己根据查询结果继续调查。" to="智能体" />
            <TeacherNote time="23分钟" question="一段非常流畅的制度解释，能否直接进入审计底稿？" misconception="大模型不是数据库；Attention关联也不是事实核验。" mustSay="LLM仍使用同一训练循环，只是数据、网络和参数规模巨大。" canSkip="微型Attention代码和部分张量目录。" />
          </section>

          <section id="agent" className="lesson">
            <SectionTitle no="06" time="90—108分钟" title="智能体：把模型放进目标—行动—反馈循环" intro="系统围绕目标选择行动、调用工具、读取反馈、更新状态并受控停止，才从回答走向完成任务。" />
            <Definition term="智能体（Agent）" simple="让大模型不只回答问题，还能为了完成目标，判断下一步、调用工具、读取结果并继续行动。" precise="智能体是能够感知环境状态、根据目标选择行动、通过工具影响或查询环境，并依据反馈更新状态的受控软件系统。" />
            <DatasetAnchor caseId="F" claimIds="BX-42017" files={["expense_claims.csv", "flight_records.csv", "hotel_records.csv", "customer_visits.csv", "employee_calendar.csv", "invoice_registry.csv"]} task="从报销表出发，利用trip_id=T2017和employee_id=E1004主动调用多个数据工具，逐步形成南京行程与报销说明矛盾的证据链。" />
            <div className="concept-grid four"><div><span>普通程序</span><strong>步骤明确</strong><p>执行人预先写好的逻辑。</p></div><div><span>工作流</span><strong>流程固定</strong><p>连接系统，但路径主要预先确定。</p></div><div><span>大模型</span><strong>生成决策</strong><p>根据上下文输出文字或指令。</p></div><div><span>智能体</span><strong>反馈闭环</strong><p>根据工具结果决定下一步。</p></div></div>
            <div className="model-system"><div><span>大模型</span><strong>一个模型</strong><p>输入上下文，输出文字或结构化指令。</p></div><i>≠</i><div><span>智能体</span><strong>一个运行系统</strong><p>模型 + 目标 + 工具 + 状态 + 控制。</p></div></div>
            <AgentBranchLab />
            <InlinePythonLab example="agent" guide="代码不再使用写死的工具列表。找到choose_next_action：它根据证据缺口、城市矛盾、工具失败和调用预算选择下一步，并在满足停止条件后转人工。" />
            <div className="chat-agent"><div><span>单次输入输出</span><strong>聊天应用</strong><p>用户提问 → 模型回答 → 结束。</p></div><div><span>目标—行动—反馈闭环</span><strong>具备智能体能力</strong><p>选择工具 → 读取结果 → 决定下一步。</p></div><p>网页只是界面。能调用工具并根据结果继续行动，才具有智能体能力。</p></div>
            <div className="autonomy"><h3>审计场景不追求“越自主越好”</h3><div><span>可以自动</span><p>读取、检索、计算、比对和整理。</p></div><div><span>需要审批</span><p>扩大数据范围、写入和对外发送。</p></div><div><span>必须由人判断</span><p>证据评价、重大定性和审计意见。</p></div></div>
            <LessonTakeaway>大模型是智能体中的理解与决策部件；智能体是包含模型、工具、状态、循环和控制机制的完整系统。</LessonTakeaway>
            <TeacherNote time="18分钟" question="如果航班工具失败，智能体应该继续猜、直接通过，还是受控停止？" misconception="网页不等于智能体；固定for循环也不等于依据反馈行动。" mustSay="智能体必须有工具、状态、反馈和停止条件，审计定性仍由人负责。" canSkip="行程一致分支，可只演示矛盾与工具失败。" />
          </section>

          <section id="build" className="lesson">
            <SectionTitle no="07" time="108—117分钟" title="落地：我们自己的审计智能体应该怎样建设" intro="先回看五种技术各自增加的能力，再用设计画布定义一个窄场景、明确证据和人工关口。" />
            <CaseMatrix />
            <div className="stack"><span>一个成熟审计智能体的能力栈</span><div>{stages.map((s, i) => <section key={s.key}><b>0{i + 1}</b><strong>{s.name}</strong><p>{s.ability}</p></section>)}</div><blockquote>规则负责确定性检查；机器学习负责统计模式；神经网络负责复杂感知；大模型负责语言与上下文；智能体把这些能力组织成受控流程。</blockquote></div>
            <AuditAgentCanvas />
            <div className="control-lines"><h3>上线前必须回答的六个问题</h3><ol><li><strong>依据对吗？</strong><span>使用的是哪个版本的制度？</span></li><li><strong>数据能用吗？</strong><span>是否授权、完整、准确和保密？</span></li><li><strong>工具可控吗？</strong><span>能读什么、能写什么、失败怎么办？</span></li><li><strong>证据可追溯吗？</strong><span>能否回到原始记录和计算过程？</span></li><li><strong>人在回路吗？</strong><span>关键结论由谁审批？</span></li><li><strong>效果可衡量吗？</strong><span>召回、误报、稳定性和节省时间？</span></li></ol></div>
            <LessonTakeaway>不要从“万能审计智能体”开始；从一个窄任务、明确证据、只读工具和人工复核节点开始。</LessonTakeaway>
            <TeacherNote time="9分钟" question="你当前最耗时、最重复、又有明确人工复核节点的任务是什么？" misconception="新技术不会把旧技术全部淘汰，成熟系统一定是组合能力。" mustSay="先影子运行，再小范围试点，最后逐步扩大。" canSkip="案例矩阵可只切换事项B与F。" />
          </section>

          <section id="summary" className="lesson summary">
            <SectionTitle no="08" time="117—120分钟" title="总结：五个问题，串起整堂课" intro="能不能执行规则？能不能从案例学习？能不能表达复杂函数？能不能处理语言？能不能围绕目标行动？" />
            <div className="summary-chain">{stages.map((s, i) => <div key={s.key}><span>0{i + 1}</span><strong>{s.name}</strong><p>{s.question}</p><small>{s.ability}</small></div>)}</div>
            <Quiz />
            <div className="closing"><p>审计智能体的价值，不是替代审计人员作出职业判断。</p><h3>让机器承担查找、比对、计算和整理，<br />让人专注于证据评价、沟通、核实与决策。</h3><div><span>权限可控</span><span>过程留痕</span><span>证据可查</span><span>结论可复核</span></div></div>
            <TeacherNote time="3分钟" question="请不用术语，用自己的话说出从规则到智能体的能力链。" mustSay="风险不是结论，模型不是审计人员，智能体必须受控。" canSkip="若时间不足，自测可作为课后练习。" />
          </section>
          <footer><strong>从普通代码到审计智能体</strong><span>面向审计人员的2小时人工智能基础课</span><a href="#top">回到顶部 ↑</a></footer>
        </div>
      </main>
    </PythonKernelProvider>
  );
}

export default function Home() {
  const [mode, setMode] = useState<ViewMode>("student");
  return <PythonKernelProvider>
    <main id="top" className={`view-${mode} ${mode !== "student" ? "show-notes" : ""}`}>
      <Header mode={mode} setMode={setMode} />
      <aside className="sidenav"><div><span>2小时课程</span><strong>从规则到智能体</strong></div><nav>{nav.map((x, i) => <a href={`#${x[0]}`} key={x[0]}><span>{String(i + 1).padStart(2, "0")}</span><b>{x[1]}</b><small>{x[2]}</small></a>)}</nav></aside>
      <div className="page">
        <section className="hero">
          <p>面向审计人员的2小时人工智能基础课</p>
          <h1>今天只审一笔报销：<br />出租车费 286 元。</h1>
          <div className="hero-lead">用同一笔 BX-42306，看清规则、机器学习、神经网络、大模型和智能体分别多做了哪一步。</div>
          <div className="hero-scenario"><div><span>报销金额</span><strong>286元</strong><small>出租车费，摘要“市内交通”</small></div><div><span>明确规则</span><strong>上限300元</strong><small>单看报销表会通过</small></div><div><span>票面图片</span><strong>看起来是286</strong><small>需要从像素识别数字</small></div><div><span>查验平台</span><strong>实际是86元</strong><small>最终形成矛盾证据</small></div></div>
          <div className="hero-path">{stages.map((stage, index) => <a key={stage.key} href={`#${stage.key}`}><span>0{index + 1}</span><strong>{stage.name}</strong><small>{stage.question}</small></a>)}</div>
          <a className="hero-start" href="#problem">先把这一笔说清楚 <span>↓</span></a>
        </section>

        <section id="problem" className="lesson">
          <SectionTitle no="01" time="0—12分钟" title="我们究竟要解决什么？" intro="不是判断286是大还是小，而是判断这笔报销是否需要转人工核查，并形成可追溯的理由。" />
          <SingleCaseProject />
          <CapabilityChain />
          <LessonTakeaway>技术的目标不是生成一个风险分，而是帮助审计人员形成可追溯、可解释、可复核的疑点。</LessonTakeaway>
          <Bridge from="人工处理的起点" problem="其中有些判断已经非常明确：例如金额是否超过300元。这种关系可以直接写进程序。" to="普通代码与规则" />
          <TeacherNote time="12分钟" question="只看报销表，你会放行吗？" misconception="异常、疑点、违规和舞弊不是同一个概念。" mustSay="整堂课始终只问BX-42306的下一步。" canSkip="先不展开多表数据包。" />
        </section>

        <section id="code" className="lesson">
          <SectionTitle no="02" time="12—24分钟" title="普通代码与规则：把已经知道的判断写出来" intro="当关系已经明确时，人写逻辑，计算机批量执行。" />
          <Definition term="计算机程序" simple="一组明确的指令，告诉计算机什么情况下做什么。" precise="程序由变量、条件、循环和函数等结构组成；同样的输入和代码通常产生同样的输出。" />
          <SingleCaseAnchor step="规则" reads="报销类型和金额" task="人明确写出：出租车费超过300元才报警。BX-42306的286元因此被放行。" />
          <div className="concept-grid four"><div><span>变量</span><strong>保存数据</strong><p>金额286、上限300。</p></div><div><span>条件</span><strong>进行判断</strong><p>如果286 &gt; 300，则报警。</p></div><div><span>循环</span><strong>重复处理</strong><p>用于每笔报销。</p></div><div><span>函数</span><strong>封装步骤</strong><p>复用“检查上限”。</p></div></div>
          <InlinePythonLab example="rule" guide="运行后必须得到“通过”。这不是程序算错，而是它的输入里根本没有票面图像和平台金额。" />
          <CapabilityBoundary method="规则" input="报销金额286、上限300" unique="对明确条件进行稳定、可解释、零随机的批量检查" output="286<300，通过" limit="不会看图片；不会发现没写出的关系" />
          <LessonTakeaway>规则不是落后的技术；边界明确的检查，它通常更可靠、更便宜、更容易解释。</LessonTakeaway>
          <Bridge from="规则的瓶颈" problem="金额接近上限、摘要笼统、缺少行程号都是弱信号。人很难写尽它们的所有组合。" to="机器学习" />
          <TeacherNote time="12分钟" question="这条规则的结果错了吗？" misconception="规则通过只代表已写出的条件未命中。" mustSay="规则的逻辑来自人。" canSkip="技术语法细节。" />
        </section>

        <section id="ml" className="lesson">
          <SectionTitle no="03" time="24—46分钟" title="机器学习：把“学习”还原成函数拟合" intro="关系无法完整写出、但有历史案例时，让程序通过最小化预测误差寻找参数。" />
          <KnownUnknownBridge />
          <Definition term="机器学习（Machine Learning）" simple="给模型带答案的历史案例，让它寻找输入与结果之间的近似函数。" precise="通过优化算法估计参数θ，使fθ在训练数上的总体损失较小，并检查它能否泛化到新数据。" />
          <SingleCaseAnchor step="机器学习" reads="三个表格特征 + 12笔历史结果" task="输入金额/上限、摘要是否笼统、是否缺少行程号，学习这些组合与历史核查结果的近似关系。" />
          <div className="notation"><div><span>输入 X</span><strong>三个特征</strong><p>0.953、摘要笼统=1、缺行程=1。</p></div><i>→</i><div><span>函数 fθ</span><strong>带参数的模型</strong><p>训练改变θ。</p></div><i>→</i><div><span>输出 ŷ</span><strong>核查概率</strong><p>用于排序，不是结论。</p></div><div className="label"><span>训练答案</span><strong>历史标签 y</strong><p>过去是否需重点核查。</p></div></div>
          <FunctionFittingLab />
          <InlinePythonLab example="ml" guide="先找history里的12道“带答案的题”，再看weights从0变成训练后的数值，最后对BX-42306预测。" />
          <ConfusionMatrixLab />
          <CapabilityBoundary method="机器学习" input="表格特征 + 历史标签" unique="不需要人写尽每个组合；从案例中拟合出近似关系" output="BX-42306的重点核查概率" limit="仍然没有看票据像素；概率不构成证据" />
          <DeepDive title="解析解、梯度、交叉熵和过拟合"><p><b>解析解不是机器学习的分界线。</b>有些模型可以直接求参数，复杂模型通常用数值优化逐步逼近。</p><TrainingLifecycle /></DeepDive>
          <LessonTakeaway>机器学习不是产生真理，而是从历史案例中找到近似关系的函数。</LessonTakeaway>
          <Bridge from="机器学习的瓶颈" problem="表格只写着“出租车费286元”。真正异常藏在票据图片里，而模型还没看过像素。" to="神经网络" />
          <TeacherNote time="22分钟" question="模型给出80%概率，这是证据吗？" misconception="机器学习不是自动发现真相。" mustSay="训练改变的是参数。" canSkip="梯度和交叉熵。" />
        </section>

        <section id="nn" className="lesson">
          <SectionTitle no="04" time="46—67分钟" title="神经网络：让模型从像素识别数字" intro="神经网络仍属于机器学习；只是被拟合的函数变得多层、非线性、更有表达能力。" />
          <Definition term="人工神经网络" simple="许多简单计算单元连成层，输入经过逐层加权和非线性变换，最后产生预测。" precise="反向传播计算每个参数对Loss的影响，优化器据此调整权重。" />
          <SingleCaseAnchor step="神经网络" reads="票据图片的64个像素" task="先用经典8×8手写数字数据集训练“看数字”的能力，再理解票据OCR如何识别出286。" />
          <div className="equation"><span>从上一章继续</span><strong>神经网络仍是带参数的函数</strong><code>64个像素 → 24个隐藏神经元 → 10个数字概率</code><p>训练仍是调整权重，让预测与正确标签的差距更小。</p></div>
          <DigitsImageLab />
          <InlinePythonLab example="neural" guide="代码真正读入1,300张8×8数字图像：1,000张训练64→24→10网络，再用300张未参与训练的图片测试。" />
          <div className="training-loop"><span>一次训练循环</span>{[["1", "做预测"], ["2", "与答案比较"], ["3", "计算Loss"], ["4", "反向传播"], ["5", "微调权重"], ["6", "重复多轮"]].map((x, i) => <div key={x[0]}><b>{x[0]}</b><p>{x[1]}</p>{i < 5 && <i>→</i>}</div>)}</div>
          <div className="content-block"><h3>训练完后到底留下什么？</h3><p>网络结构和四组数字矩阵：<code>W1[64,24]</code>、<code>b1[24]</code>、<code>W2[24,10]</code>、<code>b2[10]</code>。新图片的64个像素流过这些矩阵，得到10个数字概率。</p></div>
          <CapabilityBoundary method="神经网络" input="原始8×8像素" unique="直接从图像学习笔画、轮廓和数字形状，不需要人先写“2长什么样”" output="票面金额识别为286" limit="只是“看见”数字，还不理解制度和业务意义" />
          <DeepDive title="反向传播与小网络解剖"><p>反向传播高效计算每个参数对Loss的影响，优化器再据此调整。</p><NeuronContinuityLab /><NeuralCheckpointExplorer /><NeuralNetworkLab /></DeepDive>
          <LessonTakeaway>神经网络没有跳出机器学习；它只是更复杂的参数化函数。</LessonTakeaway>
          <Bridge from="图像识别的瓶颈" problem="网络识别出“286”，平台返回“86”。但“金额不一致应如何处理”是语言和制度问题。" to="大语言模型" />
          <TeacherNote time="21分钟" question="识别出286后，网络知道这笔报销有问题吗？" misconception="识别内容不等于理解业务。" mustSay="神经网络属于机器学习。" canSkip="反向传播推导。" />
        </section>

        <section id="llm" className="lesson">
          <SectionTitle no="05" time="67—90分钟" title="大语言模型：用神经网络学习Token序列" intro="大模型是在大规模Token序列上训练、通常采用Transformer的深度神经网络。" />
          <Definition term="大语言模型（LLM）" simple="一个根据前文不断预测下一个Token，并由此生成语言的大型神经网络。" precise="通过预训练最小化Token预测损失，再经过指令微调和对齐形成更适合任务的行为。" />
          <SingleCaseAnchor step="大模型" reads="金额比较结果 + 制度文字" task="输入“报销286、票面286、平台86”和制度第12条，要求模型说明事实、标准、不确定性和建议。" />
          <LanguageTrainingShift />
          <LlmPipeline />
          <AttentionLab />
          <InlinePythonLab example="language" guide="这个极小字符模型只负责把“下一个Token预测”运行出来。真实LLM使用巨大的Transformer神经网络。" />
          <div className="hallucination"><div><strong>为什么会幻觉</strong><p>模型首先生成统计上合理的文字，而不是天然从权威系统取得经核验的事实。</p></div><div><span>语言流畅</span><i>≠</i><span>事实正确</span><i>≠</i><span>证据充分</span><i>≠</i><span>审计结论</span></div></div>
          <CapabilityBoundary method="大模型" input="识别结果 + 制度与指令" unique="处理语言、联系上下文、生成结构化解释" output="“票面286与平台86不一致，按第12条转人工复核”" limit="不会天然进入企业系统主动取数" />
          <DeepDive title="Token体验、模型张量和微型Attention代码"><TokenLab /><LlmCheckpointExplorer /><InlinePythonLab example="attention" guide="观察Query、Key、Value形成注意力权重，不要把权重当作事实证明。" /></DeepDive>
          <LessonTakeaway>大模型不是装满答案的数据库，而是根据上下文预测后续Token的大型神经网络。</LessonTakeaway>
          <Bridge from="大模型的瓶颈" problem="手工把286、86和制度复制给模型，它会解释；但它不会自己去三个系统取回这些东西。" to="智能体" />
          <TeacherNote time="23分钟" question="如果不把86元告诉模型，它能凭语言能力知道吗？" misconception="语言流畅不是证据。" mustSay="LLM仍是神经网络。" canSkip="Attention数学代码。" />
        </section>

        <section id="agent" className="lesson">
          <SectionTitle no="06" time="90—108分钟" title="智能体：把模型放进目标—行动—反馈循环" intro="系统围绕目标选择行动、调用工具、读取反馈、更新状态并受控停止。" />
          <Definition term="智能体（Agent）" simple="让大模型不只回答，还能为了目标判断下一步、调用工具、读取结果并继续。" precise="智能体是包含模型或决策模块、工具、状态、循环和控制机制的软件系统。" />
          <SingleCaseAnchor step="智能体" reads="目标、工具返回结果、当前状态" task="从报销号开始，选择读报销、识别票面、查平台、检索制度；每步根据上一步反馈决定。" />
          <div className="concept-grid four"><div><span>普通程序</span><strong>步骤明确</strong><p>执行预先写好的逻辑。</p></div><div><span>工作流</span><strong>流程固定</strong><p>连接系统，路径主要预定。</p></div><div><span>大模型</span><strong>生成决策</strong><p>根据上下文输出指令。</p></div><div><span>智能体</span><strong>反馈闭环</strong><p>根据工具结果继续。</p></div></div>
          <div className="model-system"><div><span>大模型</span><strong>一个模型</strong><p>输入上下文，输出文字或指令。</p></div><i>≠</i><div><span>智能体</span><strong>一个运行系统</strong><p>模型 + 目标 + 工具 + 状态 + 控制。</p></div></div>
          <AgentBranchLab />
          <InlinePythonLab example="agent" guide="找到choose_next_action：它不是遍历固定列表，而是检查state里还缺哪块证据、金额是否矛盾，再选择工具。" />
          <CapabilityBoundary method="智能体" input="目标 + 可调用工具 + 运行状态" unique="主动取数，把工具反馈放回上下文，并选择下一步" output="含事实、制度来源、不确定性和建议的证据包" limit="不应自动认定违规、舞弊或审计结论" />
          <LessonTakeaway>大模型是智能体中的理解与决策部件；智能体是包含模型、工具、状态、循环和控制的完整系统。</LessonTakeaway>
          <TeacherNote time="18分钟" question="票据工具失败时，智能体能否猜一个金额继续？" misconception="网页不等于智能体；固定for循环也不等于依据反馈行动。" mustSay="智能体必须有工具、状态、反馈和停止条件。" canSkip="金额一致分支。" />
        </section>

        <section id="build" className="lesson">
          <SectionTitle no="07" time="108—117分钟" title="落地：我们自己的审计智能体应该怎样建设" intro="先回看五种技术增加的能力，再定义一个窄场景、明确证据和人工关口。" />
          <CapabilityChain />
          <AuditAgentCanvas />
          <DeepDive title="高级案例：26笔报销、9张表和跨系统证据链"><p>理解单笔主线后，再用完整Toy Data Pack练习重复发票、例外审批、拆分报销和行程矛盾。</p><ToyDatasetExplorer /><CaseMatrix /></DeepDive>
          <LessonTakeaway>不要从“万能审计智能体”开始；从一个窄任务、明确证据、只读工具和人工复核节点开始。</LessonTakeaway>
          <TeacherNote time="9分钟" question="你能把第一个场景缩小到“一类单据的一个核查目标”吗？" misconception="新技术不会把旧技术全部淘汰。" mustSay="先影子运行，再小范围试点。" canSkip="高级多表案例。" />
        </section>

        <section id="summary" className="lesson summary">
          <SectionTitle no="08" time="117—120分钟" title="总结：五个问题，串起整堂课" intro="能不能执行规则？能不能从案例学习？能不能看图片？能不能处理语言？能不能围绕目标行动？" />
          <div className="summary-chain">{stages.map((s, i) => <div key={s.key}><span>0{i + 1}</span><strong>{s.name}</strong><p>{s.question}</p><small>{s.ability}</small></div>)}</div>
          <Quiz />
          <div className="closing"><p>从同一笔286元报销回看整条能力链。</p><h3>规则检查已知条件；模型学习案例和像素；<br />大模型理解语言；智能体去取证并受控停止。</h3><div><span>286&lt;300</span><span>票面286</span><span>平台86</span><span>转人工复核</span></div></div>
          <TeacherNote time="3分钟" question="为什么五种方法不能相互替代？" mustSay="每一层增加一种能力，也留下新的边界。" canSkip="自测可作为课后练习。" />
        </section>
        <footer><strong>从普通代码到审计智能体</strong><span>用同一笔286元报销讲清五种能力</span><a href="#top">回到顶部 ↑</a></footer>
      </div>
    </main>
  </PythonKernelProvider>;
}
