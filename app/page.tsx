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
import { FacePredictLab } from "./face-predict-lab";
import {
  AgentArchitectureExplorer,
  AgentChapterRoute,
  AgentControlLab,
  AgentFitLab,
  AgentStateExplorer,
  AskDataLab,
  AuditCapabilityMap,
  AuditChapterRoute,
  AuditEvaluationLab,
  AuditEvidenceMap,
  AuditResponsibilityLab,
  AuditScenarioSelector,
  EvidencePackageLab,
  ReportGenerationLab,
  ToolContractLab,
} from "./agent-audit-interactives";
import { CrossEntropyPlot, ReluPlot, SigmoidPlot } from "./math-plots";
import { NetworkComparePanel } from "./nn-diagrams";
import {
  AnnLlmSideBySide,
  AnnToLlmGapDiagram,
  AttentionHeatmapDiagram,
  CapabilityBoundaryStrip,
  ContextWindowDiagram,
  GenerationLoopDiagram,
  LlmLifecycleDiagram,
  TokenizeDiagram,
  TransformerStackDiagram,
  WhyNextTokenDiagram,
} from "./llm-diagrams";
import { TeX } from "./tex";

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
  { key: "code", name: "通俗逻辑与规则", question: "条件是否满足？", ability: "用人写清的逻辑批量、稳定地判断", limit: "只会处理事先写出的情况", sees: "结构化字段与明确阈值" },
  { key: "ml", name: "特征拟合（ML）", question: "它像不像历史异常？", ability: "用少量人工特征拟合历史规律", limit: "特征靠人设计；看不见原始像素与长文本", sees: "表格特征组合" },
  { key: "nn", name: "人工神经网络", question: "高维原始输入里有什么？", ability: "在超多特征上自动学习表示", limit: "识别内容不等于理解制度与业务", sees: "像素、波形等高维信号" },
  { key: "llm", name: "大语言模型", question: "这些信息合起来意味着什么？", ability: "在语言序列上做大规模 ANN 预测与生成", limit: "可能幻觉；不会天然访问业务系统", sees: "制度、说明与多文档上下文" },
  { key: "agent", name: "Agent + LLM", question: "下一步该调用什么、如何停？", ability: "用 LLM 决策，用工具行动，用状态闭环", limit: "必须受权限、证据和人工复核约束", sees: "目标、工具结果与运行状态" },
];

const nav = [
  ["problem", "导言", "5′"],
  ["code", "基于任务逻辑的编程", "8′"],
  ["ml", "经典机器学习", "10′"],
  ["nn", "ANN", "12′"],
  ["llm", "从 ANN 到 LLM", "20′"],
  ["agent", "从回答到任务", "8′"],
  ["agent-architecture", "Agent怎样运行", "14′"],
  ["agent-control", "Agent怎样受控", "8′"],
  ["agent-evaluation", "Agent怎样落地", "5′"],
  ["audit", "定义审计功能", "5′"],
  ["audit-architecture", "智能问数", "7′"],
  ["audit-evidence", "智能报告生成", "7′"],
  ["audit-rollout", "底座、治理与上线", "6′"],
];

type CoursePage = {
  id: string;
  title: string;
  group: "intro" | "foundation" | "agent" | "audit";
  label: string;
};

const coursePages: CoursePage[] = [
  { id: "cover", title: "课程封面", group: "intro", label: "首页" },
  { id: "problem", title: "导言", group: "intro", label: "导言" },
  { id: "part-1", title: "技术基础路线", group: "foundation", label: "第一部分" },
  { id: "code", title: "基于任务逻辑的编程", group: "foundation", label: "02" },
  { id: "ml", title: "经典机器学习", group: "foundation", label: "03" },
  { id: "nn", title: "ANN", group: "foundation", label: "04" },
  { id: "llm", title: "从 ANN 到 LLM", group: "foundation", label: "05" },
  { id: "part-2", title: "Agent基础与架构路线", group: "agent", label: "第二部分" },
  { id: "agent", title: "从回答到任务", group: "agent", label: "06" },
  { id: "agent-architecture", title: "Agent怎样运行", group: "agent", label: "07" },
  { id: "agent-control", title: "Agent怎样受控", group: "agent", label: "08" },
  { id: "agent-evaluation", title: "Agent怎样落地", group: "agent", label: "09" },
  { id: "part-3", title: "审计应用路线", group: "audit", label: "第三部分" },
  { id: "audit", title: "定义审计功能", group: "audit", label: "10" },
  { id: "audit-architecture", title: "智能问数", group: "audit", label: "11" },
  { id: "audit-evidence", title: "智能报告生成", group: "audit", label: "12" },
  { id: "audit-rollout", title: "底座、治理与上线", group: "audit", label: "13" },
];

const courseParts = [
  {
    no: "第一部分",
    title: "大模型和智能体的技术基础",
    range: "02—05",
    href: "#part-1",
    description: "从问题出发，讲清规则、ML、ANN和LLM为什么逐层出现。",
  },
  {
    no: "第二部分 · 核心",
    title: "Agent基础与架构",
    range: "06—09",
    href: "#part-2",
    description: "集中讲Agent的定义、区别、模块、工具反馈循环、规范、价值与边界。",
  },
  {
    no: "第三部分 · 核心",
    title: "Agent在审计中的应用",
    range: "10—13",
    href: "#part-3",
    description: "用智能问数、报告生成等功能，讲清审计智能体怎样受控落地。",
  },
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

function SectionTitle({ no, time, title, intro }: { no: string; time: string; title?: string; intro?: string }) {
  return (
    <header className="section-title">
      <div>
        <span>{no}</span>
        <small className="section-time">{time}</small>
      </div>
      {(title || intro) && (
        <div>
          {title ? <h2>{title}</h2> : null}
          {intro ? <p>{intro}</p> : null}
        </div>
      )}
    </header>
  );
}

function PartTitle({
  id,
  no,
  title,
  lead,
  chapters,
}: {
  id: string;
  no: string;
  title: string;
  lead: string;
  chapters: string;
}) {
  return (
    <header id={id} className="part-title">
      <div className="part-title-meta">
        <span>{no}</span>
        <small>{chapters}</small>
      </div>
      <div className="part-title-body">
        <h2>{title}</h2>
        <p>{lead}</p>
      </div>
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

function Bridge({ from, problem, to, lead = "所以，我们需要引入：" }: { from: string; problem: string; to: string; lead?: string }) {
  return (
    <div className="bridge">
      <span>{from}</span><p>{problem}</p><strong>{lead}{to} →</strong>
    </div>
  );
}

type ViewMode = "student" | "teacher" | "appendix";

function Header({ mode, setMode, progressOverride, onHome, sidebarOpen, onToggleSidebar }: { mode: ViewMode; setMode: (v: ViewMode) => void; progressOverride?: number; onHome?: () => void; sidebarOpen?: boolean; onToggleSidebar?: () => void }) {
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
        <a href="#top" className="brand" onClick={onHome ? (event) => { event.preventDefault(); onHome(); } : undefined}>LLM · Agent · 审计应用</a>
        <div className="top-progress"><i style={{ width: `${progressOverride ?? progress}%` }} /></div>
        <div className="top-actions">
          {onToggleSidebar && <button className="sidebar-toggle" type="button" onClick={onToggleSidebar} aria-expanded={sidebarOpen} aria-controls="course-sidebar"><span aria-hidden="true">☰</span><b>{sidebarOpen ? "隐藏侧栏" : "显示侧栏"}</b></button>}
          <button className={`view-mode-button view-mode-student ${mode === "student" ? "on" : ""}`} onClick={() => setMode("student")}>学员视图</button>
          <button className={`view-mode-button ${mode === "teacher" ? "on" : ""}`} onClick={() => setMode("teacher")}>讲师视图</button>
          <button className={`view-mode-button ${mode === "appendix" ? "on" : ""}`} onClick={() => setMode("appendix")}>附录视图</button>
          <button onClick={() => setTimerOpen(!timerOpen)}>计时</button>
          <button onClick={() => document.fullscreenElement ? document.exitFullscreen() : document.documentElement.requestFullscreen?.()}>全屏</button>
        </div>
      </header>
      {timerOpen && <div className="timer"><button className="timer-x" onClick={() => setTimerOpen(false)}>×</button><span>课堂计时</span><strong>{String(Math.floor(seconds / 60)).padStart(2, "0")}:{String(seconds % 60).padStart(2, "0")}</strong><div><button onClick={() => setRunning(!running)}>{running ? "暂停" : "开始"}</button><button onClick={() => { setSeconds(0); setRunning(false); }}>归零</button></div></div>}
    </>
  );
}

function CoursePager({ activeIndex, onChange }: { activeIndex: number; onChange: (index: number) => void }) {
  const [outlineOpen, setOutlineOpen] = useState(false);
  const current = coursePages[activeIndex];
  const previous = coursePages[activeIndex - 1];
  const next = coursePages[activeIndex + 1];
  const choose = (index: number) => {
    setOutlineOpen(false);
    onChange(index);
  };

  return (
    <nav className="course-pager" aria-label="课件翻页">
      {outlineOpen && (
        <div className="pager-outline" role="dialog" aria-label="课件目录">
          <div><span>课件目录</span><button type="button" onClick={() => setOutlineOpen(false)} aria-label="关闭目录">×</button></div>
          <section>{coursePages.map((page, index) => <button type="button" key={page.id} className={index === activeIndex ? "active" : ""} onClick={() => choose(index)}><small>{page.label}</small><strong>{page.title}</strong></button>)}</section>
        </div>
      )}
      <button type="button" className="pager-direction previous" disabled={!previous} onClick={() => previous && onChange(activeIndex - 1)} aria-label={previous ? `上一页：${previous.title}` : "已经是第一页"}>
        <span>←</span><div><small>上一页</small><strong>{previous?.title ?? "首页"}</strong></div>
      </button>
      <button type="button" className="pager-current" onClick={() => setOutlineOpen(value => !value)} aria-expanded={outlineOpen}>
        <span>{String(activeIndex + 1).padStart(2, "0")} / {String(coursePages.length).padStart(2, "0")}</span>
        <strong>{current.title}</strong>
        <small>{outlineOpen ? "收起目录" : "打开目录"}</small>
      </button>
      <button type="button" className="pager-direction next" disabled={!next} onClick={() => next && onChange(activeIndex + 1)} aria-label={next ? `下一页：${next.title}` : "已经是最后一页"}>
        <div><small>下一页</small><strong>{next?.title ?? "课程结束"}</strong></div><span>→</span>
      </button>
    </nav>
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
  return <div className="dataset-anchor"><span>本章难度案例</span><strong>情形 {caseId} · {claimIds}</strong><p>{task}</p><div>{files.map(file => <code key={file}>{file}</code>)}</div></div>;
}

function ExcelSheet({
  name,
  columns,
  rows,
  highlightRows,
  encodeToggle = false,
}: {
  name: string;
  columns: string[];
  rows: string[][];
  highlightRows?: number[];
  /** 显示「编码」按钮：是/否 ↔ 1/0；正常/确认异常 ↔ 0/1 */
  encodeToggle?: boolean;
}) {
  const [encoded, setEncoded] = useState(false);
  const marked = new Set(highlightRows ?? []);

  const displayCell = (cell: string) => {
    if (!encoded) return cell;
    if (cell === "是") return "1";
    if (cell === "否") return "0";
    if (cell === "正常") return "0";
    if (cell === "确认异常") return "1";
    return cell;
  };

  return (
    <div className="excel-sheet">
      <div className="excel-sheet-bar">
        <div className="excel-sheet-tab">{name}</div>
        {encodeToggle && (
          <button
            type="button"
            className={`excel-encode-btn${encoded ? " on" : ""}`}
            onClick={() => setEncoded((v) => !v)}
          >
            {encoded ? "还原" : "编码"}
          </button>
        )}
      </div>
      <table className="excel-table">
        <thead>
          <tr>
            <th className="excel-index" />
            {columns.map((column, index) => (
              <th key={column}>
                <span>{String.fromCharCode(65 + index)}</span>
                {column}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, rowIndex) => (
            <tr key={`${name}-${rowIndex}`} className={marked.has(rowIndex) ? "highlight" : undefined}>
              <th className="excel-index">{rowIndex + 1}</th>
              {row.map((cell, cellIndex) => (
                <td key={`${rowIndex}-${cellIndex}`}>{displayCell(cell)}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function TaskLogicDemo() {
  return (
    <div className="task-logic-demo">
      <p className="task-logic-problem">
        <span>审计问题</span>
        给出报销明细和发票台账，检查报销单上的金额，是否与发票台账里的开票金额一致。
      </p>
      <div className="excel-pair">
        <ExcelSheet
          name="报销明细.xlsx"
          columns={["报销号", "员工", "发票号", "报销金额", "日期"]}
          rows={[
            ["BX-42306", "E1004", "INV-Q-286", "286", "2026-05-21"],
            ["BX-41004", "E1002", "INV-41004", "420", "2026-05-07"],
            ["BX-41610", "E1001", "INV-77821", "1280", "2026-05-16"],
          ]}
          highlightRows={[0]}
        />
        <ExcelSheet
          name="发票台账.xlsx"
          columns={["发票号", "开票金额", "开票日期", "状态"]}
          rows={[
            ["INV-Q-286", "86", "2026-05-21", "有效"],
            ["INV-41004", "420", "2026-05-07", "有效"],
            ["INV-77821", "1280", "2026-05-16", "有效"],
          ]}
          highlightRows={[0]}
        />
      </div>
      <div className="task-logic-map">
        <span>映射键</span>
        <code>发票号</code>
        <span>判断</span>
        <strong>映射成功后：报销金额 ≠ 开票金额 → 疑点（本例：286 vs 86）</strong>
      </div>
    </div>
  );
}

function FeatureFittingDemo() {
  return (
    <div className="task-logic-demo">
      <p className="task-logic-problem">
        <span>审计问题</span>
        根据已经核实过的历史报销，估计新单 NEW 是否更值得重点核查。
      </p>
      <ExcelSheet
        name="历史核实样本.xlsx"
        encodeToggle
        columns={["单号", "贴近审批线", "首次合作商户", "周末发生", "整数金额", "核实结果"]}
        rows={[
          ["H01", "否", "否", "否", "否", "正常"],
          ["H02", "否", "是", "是", "是", "确认异常"],
          ["H03", "否", "否", "否", "是", "正常"],
          ["H04", "是", "否", "是", "是", "确认异常"],
          ["H05", "否", "否", "是", "否", "正常"],
          ["H06", "是", "是", "否", "否", "确认异常"],
          ["H07", "否", "是", "否", "否", "正常"],
          ["H08", "是", "是", "否", "是", "确认异常"],
          ["H09", "是", "否", "否", "否", "正常"],
          ["H10", "是", "是", "是", "否", "确认异常"],
          ["H11", "否", "否", "是", "是", "正常"],
          ["H12", "否", "是", "是", "否", "正常"],
          ["NEW", "是", "否", "否", "是", "？"],
        ]}
        highlightRows={[12]}
      />

      <div className="task-logic-map">
        <span>为何上 ML</span>
        <strong>四列二元特征共 16 种组合；这里用 12 条已核实样本学习，再估计未出现过的 NEW。</strong>
      </div>

      <div className="math-explain lecture-board">
        <div className="math-explain-head">
          <span>课堂板书</span>
          <h3>逻辑回归：三步走</h3>
        </div>

        <section>
          <h4>① 编码</h4>
          <p>
            「是/否」→ 0/1；核实结果 → <TeX math="y\in\{0,1\}" />（1=异常）。
            一行样本变成 <TeX math="x=(x_1,x_2,x_3,x_4)" />。
          </p>
        </section>

        <section>
          <h4>② 先打分，再变概率</h4>
          <TeX display ariaLabel="线性得分" math="z = w^{\top}x + b" />
          <TeX display ariaLabel="sigmoid" math="p=\sigma(z)=\dfrac{1}{1+e^{-z}}\in(0,1)" />
          <p className="board-line">
            <TeX math="z" /> 大 → 更像异常；<TeX math="p" /> 当作 <TeX math="P(y=1\mid x)" />。
          </p>
          <SigmoidPlot />
        </section>

        <section>
          <h4>③ Loss：跟历史标签对齐</h4>
          <TeX display ariaLabel="bernoulli" math="P(y\mid x)=p^{y}(1-p)^{1-y}" />
          <p className="board-line">极大似然 → 取负对数 → 交叉熵：</p>
          <TeX
            display
            ariaLabel="nll"
            math="\ell(p,y)=-\bigl[y\log p+(1-y)\log(1-p)\bigr]"
          />
          <CrossEntropyPlot />
          <p className="board-line">整表平均：</p>
          <TeX
            display
            ariaLabel="mean loss"
            math="L(w,b)=\dfrac{1}{n}\sum_{i=1}^{n}\ell(p_i,y_i),\quad p_i=\sigma(w^{\top}x_i+b)"
          />
          <p className="board-line">
            调 <TeX math="w,b" /> 让 <TeX math="L" /> 下降，再给 NEW 出分——<b>只用于排队</b>。
          </p>
        </section>
      </div>

      <div className="task-logic-map">
        <span>板书收束</span>
        <code>x → z → p=σ(z) → 最小化 L → NEW 的 p</code>
        <span>提醒</span>
        <strong>概率 ≠ 审计结论</strong>
      </div>
    </div>
  );
}

function NewSampleInferenceBoard() {
  return (
    <div className="inference-board">
      <div className="inference-board-head">
        <span>代入 NEW</span>
        <strong>把训好的参数填进 σ，算出核查概率</strong>
      </div>
      <div className="inference-steps">
        <div>
          <span>1 · 12 条历史样本训练得到的参数</span>
          <TeX display math="w=[7.191,\ 6.348,\ 1.010,\ 5.848],\quad b=-10.252" />
        </div>
        <div>
          <span>2 · NEW 的特征（未出现在上面 12 条中）</span>
          <TeX display math="x_{\mathrm{NEW}}=(1,0,0,1)" />
          <p className="inference-feature-note">贴近审批线=是，首次合作商户=否，周末发生=否，整数金额=是</p>
        </div>
        <div>
          <span>3 · 先算线性得分</span>
          <TeX
            display
            math="z=w^{\top}x+b=7.191\cdot 1+6.348\cdot 0+1.010\cdot 0+5.848\cdot 1-10.252=2.787"
          />
        </div>
        <div>
          <span>4 · 再过 Sigmoid</span>
          <TeX display math="p=\sigma(z)=\dfrac{1}{1+e^{-2.787}}\approx 0.942" />
        </div>
      </div>
      <div className="inference-result">
        <div>
          <small>NEW 样本异常概率</small>
          <strong>94.2%</strong>
        </div>
        <p>课堂读法：NEW 是训练集没见过的组合；模型仍给出高排队分——只用于优先核查，不是定性。</p>
      </div>
    </div>
  );
}

function ReceiptImageInbox() {
  const receipts = [
    { id: "BX-42306", tip: "出租车票 · 金额区", focus: true },
    { id: "BX-41004", tip: "餐饮小票 · 金额区", focus: false },
    { id: "BX-41610", tip: "交通票 · 金额区", focus: false },
    { id: "BX-41881", tip: "住宿发票 · 金额区", focus: false },
    { id: "…", tip: "还有大量扫描件", focus: false },
  ];
  return (
    <div className="receipt-inbox">
      <div className="receipt-inbox-bar">
        <span>receipts/</span>
        <strong>待识别票据图片（扫描件 / 拍照件）</strong>
        <em>不是 Excel 数字表</em>
      </div>
      <div className="receipt-inbox-grid">
        {receipts.map((item) => (
          <article key={item.id} className={item.focus ? "focus" : ""}>
            <div className="receipt-thumb" aria-hidden>
              <i />
              <i />
              <b className="receipt-amount-zone">
                {item.focus ? (
                  <>
                    <span>2</span>
                    <span>8</span>
                    <span>6</span>
                  </>
                ) : (
                  <span>···</span>
                )}
              </b>
              <small>金额在这里</small>
            </div>
            <strong>{item.id}</strong>
            <p>{item.tip}</p>
            <em>{item.focus ? "重点样例" : "待识别"}</em>
          </article>
        ))}
      </div>
      <div className="receipt-inbox-pain">
        <div>
          <span>人来看</span>
          <strong>一张一张读数字</strong>
          <p>慢，且容易看错、看漏。</p>
        </div>
        <i>→</i>
        <div>
          <span>希望计算机做</span>
          <strong>从图片像素迅速认出金额数字</strong>
          <p>例如先认出 2、8、6，拼成票面 286。</p>
        </div>
      </div>
    </div>
  );
}

function AnnPixelDemo() {
  return (
    <div className="task-logic-demo">
      <p className="task-logic-problem">
        <span>审计问题</span>
        手里是一堆票据图片。金额数字藏在图里；人一张一张看很慢，希望用计算机迅速识别其中的数字。
      </p>

      <ReceiptImageInbox />

      <DigitsImageLab />

      <div className="math-explain lecture-board">
        <div className="math-explain-head">
          <span>课堂板书</span>
          <h3>神经网络：结构 · 计算 · 训练</h3>
        </div>

        <section>
          <h4>① 它是什么</h4>
          <p>
            神经网络把「输入 → 预测」拆成很多层：每一层都是加权求和再加一点非线性。
            参数（权重）一开始是随机的；用带标签的样本训练，让预测越来越接近正确答案。
          </p>
          <NetworkComparePanel />
        </section>

        <section>
          <h4>② 编码：像素变成向量</h4>
          <p>
            上方示意用 16×16 图：每个格子亮度 0—16，整图拉成
            <TeX math="x\in\mathbb{R}^{256}" />。
            输入里没有「这是数字 2」这个概念，只有 256 个数。
          </p>
        </section>

        <section>
          <h4>③ 多层：先表示，再分类</h4>
          <TeX display ariaLabel="hidden" math="h^{(\ell)}=\mathrm{ReLU}\!\left(W^{(\ell)} h^{(\ell-1)}+b^{(\ell)}\right),\quad \ell=1,\ldots,L" />
          <TeX display ariaLabel="softmax" math="p=\mathrm{softmax}\!\left(W^{(L+1)} h^{(L)}+b^{(L+1)}\right)\in\mathbb{R}^{10}" />
          <p className="board-line">
            结构对齐：<b>256 → 隐藏层×L → 10</b>。隐藏层学笔画组合；输出是数字 0—9 的概率。可切换 CNN，对比「保留邻域」与「一次拉平」。
          </p>
          <ReluPlot />
        </section>

        <section>
          <h4>④ Loss：跟标签对齐</h4>
          <TeX display ariaLabel="ce" math="\ell=-\log p_y" />
          <p className="board-line">整表平均后，反向传播微调各层权重，让正确类别的概率升高。</p>
          <p className="board-line">
            下方 Python 为便于当场跑通，用更小的 8×8（64→24→10）子集；层数逻辑与上面示意相同。
          </p>
        </section>
      </div>

      <div className="task-logic-map">
        <span>板书收束</span>
        <code>16×16（256）→ 隐藏层×L → Softmax（10）</code>
        <span>提醒</span>
        <strong>看见数字 ≠ 理解制度</strong>
      </div>
    </div>
  );
}

function ContextEvidenceInbox() {
  const cards = [
    { src: "报销说明", text: "周日接待重要客户", tone: "claim" },
    { src: "小票 OCR", text: "儿童套餐 · 生日蛋糕", tone: "warn" },
    { src: "CRM", text: "当天无客户拜访", tone: "warn" },
    { src: "员工日历", text: "家属生日聚餐", tone: "warn" },
  ];
  return (
    <div className="context-inbox">
      <div className="context-inbox-bar">
        <span>BX-42519</span>
        <strong>同一笔招待：多段文字证据</strong>
        <em>单看任一字段都不够</em>
      </div>
      <div className="context-inbox-grid">
        {cards.map((card) => (
          <article key={card.src} className={card.tone}>
            <span>{card.src}</span>
            <strong>{card.text}</strong>
          </article>
        ))}
      </div>
      <div className="context-inbox-pain">
        <div>
          <span>ANN 能做的</span>
          <strong>认出小票上的字</strong>
          <p>「儿童套餐」「生日蛋糕」可以被读出来。</p>
        </div>
        <i>→</i>
        <div>
          <span>还缺的</span>
          <strong>把多段文字放在业务语境里对照</strong>
          <p>说明、小票、CRM、日历合起来是否自洽。</p>
        </div>
      </div>
    </div>
  );
}

function LlmChapterRoute() {
  const steps = [
    ["01", "它是什么", "先从 ANN 连续推出 LLM"],
    ["02", "文字怎样进去", "Token、编号、向量、位置"],
    ["03", "网络怎样读写", "Attention、Transformer、逐 Token 生成"],
    ["04", "怎样训练", "数据、Loss、反向传播、对齐"],
    ["05", "训练后剩什么", "配置、Tokenizer、权重张量"],
    ["06", "怎样调用", "请求、推理服务、响应"],
    ["07", "会什么、不会什么", "能力、幻觉、Agent 缺口"],
  ];
  return (
    <div className="llm-route" aria-label="本章七步学习路线">
      <div className="llm-route-head"><span>本章路线</span><strong>不是记名词，而是从上一章的 ANN 亲手搭出一个 LLM</strong></div>
      <div>{steps.map(([no, title, detail]) => <article key={no}><b>{no}</b><strong>{title}</strong><p>{detail}</p></article>)}</div>
    </div>
  );
}

function LlmTrainingWorkbench() {
  const [stage, setStage] = useState(0);
  const states = [
    { name: "随机初始化", batch: "epoch 0", loss: "3.69", target: "发票", top: "40 个候选接近均匀", note: "权重还是随机数，模型几乎在乱猜。" },
    { name: "训练开始", batch: "epoch 10", loss: "3.24", target: "发票", top: "正确 Token 的概率开始上升", note: "反向传播已经改变参数，但预测仍不稳定。" },
    { name: "训练进行中", batch: "epoch 150", loss: "0.59", target: "发票", top: "正确序列已成为高概率候选", note: "总体 Loss 明显下降，但仍需独立评估。" },
    { name: "形成检查点", batch: "epoch 300", loss: "0.34", target: "发票", top: "参数固定，可用于新输入推理", note: "保存结构、Tokenizer 与训练后的参数；推理时不再改权重。" },
  ];
  const current = states[stage];
  const loop = ["取一批 Token", "前向预测", "计算 Loss", "反向传播", "优化器更新参数", "换下一批"];
  return (
    <div className="llm-training-workbench">
      <div className="training-workbench-head">
        <div><span>互动 · 训练工作台</span><h3>点击“训练一步”，观察真正改变的是什么</h3></div>
        <div><button type="button" onClick={() => setStage(0)}>重置</button><button className="primary" type="button" onClick={() => setStage(Math.min(states.length - 1, stage + 1))} disabled={stage === states.length - 1}>训练一步 →</button></div>
      </div>
      <div className="training-loop-strip">{loop.map((item, i) => <div key={item} className={i === Math.min(stage + 1, 4) ? "active" : ""}><b>{String(i + 1).padStart(2, "0")}</b><span>{item}</span></div>)}</div>
      <div className="training-workbench-body">
        <div><span>训练状态</span><strong>{current.name}</strong><small>{current.batch}</small></div>
        <div><span>训练样本</span><code>制度规定：报销金额必须与 → ?</code><p>真实答案：<b>{current.target}</b></p></div>
        <div><span>模型当前预测</span><strong>{current.top}</strong><p>{current.note}</p></div>
        <div className="loss-meter"><span>总体 Loss</span><strong>{current.loss}</strong><i><b style={{ width: `${18 + (states.length - 1 - stage) * 24}%` }} /></i><small>Loss 下降只说明更贴近训练目标，不自动证明事实可靠。</small></div>
      </div>
      <p className="training-workbench-footnote">Loss 数值与下方 Python 教学模型的训练日志保持一致；候选文字用于解释方向，不代表真实生产模型概率。</p>
    </div>
  );
}

function LlmCallLab() {
  const [step, setStep] = useState(0);
  const [sent, setSent] = useState(false);
  const steps = [
    { title: "应用组织输入", body: "程序把系统要求、用户问题和本案材料整理成 messages。它不是把整台数据库塞进模型。" },
    { title: "发送一次请求", body: "应用通过 HTTPS 把模型名、messages 和生成参数发给推理服务。密钥应保存在后端，不应写进静态 HTML。" },
    { title: "服务执行推理", body: "服务加载检查点，Tokenizer 编码文字，Transformer 反复预测下一个 Token；推理阶段通常不更新权重。" },
    { title: "返回结构化响应", body: "服务返回文本、模型标识、Token 用量和停止原因。应用再显示、保存或交给下一段程序。" },
  ];
  const request = `{
  "model": "enterprise-llm",
  "messages": [
    {"role": "system", "content": "只列疑点，不下审计结论"},
    {"role": "user", "content": "说明：周日客户招待；小票：儿童套餐、生日蛋糕；CRM：无拜访"}
  ],
  "temperature": 0.2,
  "max_output_tokens": 300,
  "response_format": "json"
}`;
  const response = `{
  "output": {
    "status": "建议人工复核",
    "conflicts": ["客户招待与小票内容不一致", "CRM无当天拜访"],
    "missing_evidence": ["客户名单", "审批附件"]
  },
  "usage": {"input_tokens": 92, "output_tokens": 47},
  "stop_reason": "end"
}`;
  return (
    <div className="llm-call-lab">
      <div className="llm-call-head"><div><span>互动 · 模型调用实验室</span><h3>网页里的“发送”按钮，背后只是一次程序请求</h3></div><button type="button" className="primary" onClick={() => { setSent(true); setStep(3); }}>发送一次请求</button></div>
      <div className="llm-call-steps">{steps.map((item, i) => <button type="button" key={item.title} className={step === i ? "active" : ""} onClick={() => setStep(i)}><b>0{i + 1}</b><strong>{item.title}</strong></button>)}</div>
      <div className="llm-call-detail"><span>当前步骤</span><h4>{steps[step].title}</h4><p>{steps[step].body}</p></div>
      <div className="llm-call-payloads">
        <div><span>请求 Request</span><pre>{request}</pre></div>
        <i>HTTPS →</i>
        <div className={sent ? "returned" : "waiting"}><span>响应 Response</span><pre>{sent ? response : "点击“发送一次请求”查看返回结果"}</pre></div>
      </div>
      <p className="llm-call-note"><b>三种常见部署方式：</b>调用云端模型 API、调用企业内部模型平台、在本机/服务器加载开源模型。对调用方而言，核心都可抽象为“输入请求 → 推理 → 输出响应”。</p>
    </div>
  );
}

function LlmContextDemo() {
  return (
    <div className="task-logic-demo llm-lesson-rich">
      <p className="task-logic-problem">
        <span>审计问题</span>
        报销说明写着「周日接待重要客户」，但小票、CRM、日历放在一起读，语义互相打架。
        上一章的 ANN 可以把小票上的字认出来；这一章只追问一件事：怎样把这些文字放进神经网络，让它联系上下文并生成说明？
      </p>

      <ContextEvidenceInbox />
      <LlmChapterRoute />

      <section className="llm-step-section">
        <div className="llm-step-title"><span>5.1 · 它是什么</span><h3>从 ANN 连续地走到 LLM</h3><p>不是新物种，而是把神经网络改造成通用的语言预测器。</p></div>
        <AnnToLlmGapDiagram />
        <div className="llm-upgrade-grid">
          <article><span>保持不变</span><strong>仍然是神经网络</strong><p>仍有层、权重、偏置、前向计算、Loss、反向传播和推理。</p></article>
          <article><span>改进 01</span><strong>输入改成 Token 序列</strong><p>Tokenizer、Embedding 和位置信息，让文字能够进入网络。</p></article>
          <article><span>改进 02</span><strong>骨干改成 Transformer</strong><p>Self-Attention 让序列中的每个位置按需要参考其他位置。</p></article>
          <article><span>改进 03</span><strong>输出改成开放式序列</strong><p>每一步在大词表中预测下一个 Token，循环后形成任意长度文字。</p></article>
          <article><span>改进 04</span><strong>规模与训练方式扩大</strong><p>海量语料、大量参数、预训练和指令对齐，使一个模型获得多任务能力。</p></article>
        </div>
        <AnnLlmSideBySide />
        <Definition
          term="大语言模型（LLM）"
          simple="把文字切成 Token，利用大型神经网络根据上下文不断预测下一个 Token，从而理解和生成语言的模型。"
          precise="当代主流 LLM 是以 Transformer 为骨干、在大规模 Token 序列上进行自回归预训练，并常经过指令微调和偏好对齐的参数化条件概率模型。"
        />
        <div className="llm-memory-line"><strong>本节必须记住</strong><code>LLM = 神经网络底座 + Token 序列 + Transformer + 下一 Token 目标 + 大规模预训练</code></div>
      </section>

      <section className="llm-step-section">
        <div className="llm-step-title"><span>5.2 · 文字怎样进去</span><h3>计算机不认识“文字”，先把它变成数字</h3><p>切分 → 编号 → 查向量表 → 加入位置信息。</p></div>
        <TokenizeDiagram />
        <div className="llm-three-concepts">
          <article><span>Tokenizer</span><strong>切分并编号</strong><p>把文字切成词、字或子词 Token；同一 Token 对应稳定编号。它是编码规则，不负责理解。</p></article>
          <article><span>Embedding</span><strong>把编号查成向量</strong><p>向量表是可训练参数。模型训练时，相关 Token 的表示逐渐形成可用关系。</p></article>
          <article><span>Position</span><strong>告诉模型先后顺序</strong><p>“客户招待并非私人聚餐”和“私人聚餐并非客户招待”Token 相近，顺序却改变含义。</p></article>
        </div>
        <div className="llm-memory-line"><strong>本节必须记住</strong><code>文字 → Token → Token ID → Embedding 向量 + 位置信息</code></div>
      </section>

      <section className="llm-step-section">
        <div className="llm-step-title"><span>5.3 · 网络怎样读写</span><h3>Transformer 联系上下文，再逐 Token 写出答案</h3><p>Attention 负责“当前应该重点参考哪里”；Transformer Block 负责反复整合与变换；LM Head 负责给整个词表打分。</p></div>
        <AttentionHeatmapDiagram />
        <AttentionLab />
        <TransformerStackDiagram />
        <LlmPipeline />
        <div className="math-explain lecture-board compact-board">
          <div className="math-explain-head"><span>唯一需要记住的公式</span><h3>给定上文，预测下一个 Token</h3></div>
          <section><TeX display ariaLabel="next token" math="P(t_{n+1}\mid t_1,t_2,\ldots,t_n)" /><p className="board-line">模型输出的不是一个“答案字符串”，而是词表中每个候选 Token 的概率。选出一个，把它追加到上下文，再运行一次。</p></section>
        </div>
        <GenerationLoopDiagram />
        <TokenLab />
        <div className="llm-memory-line"><strong>本节必须记住</strong><code>读：Attention 联系上下文　｜　写：预测一个 Token，再循环</code></div>
      </section>

      <section className="llm-step-section">
        <div className="llm-step-title"><span>5.4 · 怎样训练</span><h3>训练不是灌入答案，而是不断修正预测误差</h3><p>先讲预训练的一次循环，再区分预训练、指令微调/对齐和日常推理。</p></div>
        <div className="llm-training-data">
          <article><b>01</b><strong>收集与治理语料</strong><p>授权文本、网页、书籍、代码等；清洗、去重、过滤并切分。</p></article>
          <article><b>02</b><strong>自动构造训练答案</strong><p>同一序列错开一位：前面的 Token 是输入，后一个 Token 就是目标。</p></article>
          <article><b>03</b><strong>前向计算与 Loss</strong><p>模型给候选词概率；用交叉熵衡量真实下一个 Token 得到的概率是否足够高。</p></article>
          <article><b>04</b><strong>反向传播与优化</strong><p>梯度告诉每个参数怎样微调才能降低 Loss；优化器更新权重。</p></article>
          <article><b>05</b><strong>重复并保存检查点</strong><p>在大量批次上重复，定期验证、评估并保存模型参数。</p></article>
        </div>
        <LanguageTrainingShift />
        <LlmTrainingWorkbench />
        <LlmLifecycleDiagram />
        <InlinePythonLab example="language" guide="先看初始Loss，再看训练中Loss下降和权重变化，最后看检查点包含什么。这个微型神经语言模型只复现训练逻辑；真实LLM把简单权重矩阵换成多层Transformer。" />
        <div className="llm-memory-line"><strong>本节必须记住</strong><code>预测 → 算 Loss → 反向传播 → 更新参数 → 重复；训练改变的是参数</code></div>
      </section>

      <section className="llm-step-section">
        <div className="llm-step-title"><span>5.5 · 训练后剩什么</span><h3>训练成品不是规则库，而是一组文件和巨大矩阵</h3><p>“学会了语言”最终必须落到可保存、可加载的工程制品上。</p></div>
        <LlmCheckpointExplorer />
        <div className="llm-product-facts">
          <article><strong>结构不会消失</strong><p>config 说明层数、隐藏维度、注意力头和词表大小。</p></article>
          <article><strong>知识没有变成中文规则</strong><p>训练结果分布在 Embedding、Q/K/V、MLP、Norm、LM Head 等大量张量中。</p></article>
          <article><strong>使用前必须加载</strong><p>推理服务把配置、Tokenizer 和权重载入 CPU/GPU，并开放本地接口或网络 API。</p></article>
          <article><strong>推理通常不改权重</strong><p>本次提示词只进入上下文窗口；它不会因为一次聊天自动完成新的模型训练。</p></article>
        </div>
        <div className="llm-memory-line"><strong>本节必须记住</strong><code>训练成品 = Tokenizer + 模型结构配置 + 训练后权重张量（+ 生成默认设置）</code></div>
      </section>

      <section className="llm-step-section">
        <div className="llm-step-title"><span>5.6 · 怎样调用</span><h3>业务程序并不“进入模型”，而是向推理服务发送请求</h3><p>模型先被部署成服务。你的网页、Python 或审计系统提交输入，服务运行推理并返回输出。</p></div>
        <LlmCallLab />
        <ContextWindowDiagram />
        <div className="llm-call-guardrail"><strong>静态 HTML 的关键安全边界</strong><p>教学页面可以演示请求结构，但生产环境的模型密钥不能直接写在浏览器代码里；否则任何打开网页的人都可能读取密钥。真实系统应由受控后端代为调用，并记录访问、输入和输出。</p></div>
        <InlinePythonLab example="llm_call" guide="运行后依次看 request、模型服务内部四步和 response。这个教学模拟器不访问外部模型，因此无需密钥；真实调用只需把 model_server 函数替换为企业模型平台或云端API。" />
        <div className="llm-memory-line"><strong>本节必须记住</strong><code>应用 → 请求(messages + 参数) → 推理服务 → Tokenizer/模型生成 → 响应</code></div>
      </section>

      <section className="llm-step-section">
        <div className="llm-step-title"><span>5.7 · 会什么、不会什么</span><h3>能力与边界来自同一个预测目标</h3><p>下一 Token 训练迫使模型学习语言结构、常见知识关联和长程依赖；规模扩大后表现出通用能力。</p></div>
        <WhyNextTokenDiagram />
        <CapabilityBoundaryStrip />
        <div className="llm-case-output">
          <div><span>输入给模型的材料</span><p>报销说明 + 小票 OCR + CRM 摘录 + 日历标题 + 相关制度</p></div>
          <i>→</i>
          <div><span>LLM 可以输出</span><p>矛盾点、缺失证据、建议核对事项和结构化疑点草稿</p></div>
          <i>≠</i>
          <div className="limit"><span>不能直接输出</span><p>已经核验的事实、违规认定、舞弊定性或最终审计结论</p></div>
        </div>
        <div className="hallucination">
          <div>
            <strong>为什么会幻觉</strong>
            <p>目标函数奖励的是「统计上像那么回事的后续 Token」，不是「每句都有系统可核验来源」。资料不足或冲突时，模型仍可能生成语法完美、语气笃定的段落。</p>
          </div>
          <div>
            <span>语言流畅</span><i>≠</i><span>事实正确</span><i>≠</i><span>证据充分</span><i>≠</i><span>审计结论</span>
          </div>
        </div>
        <CapabilityBoundary
          method="大语言模型（LLM）"
          input="提示词 + 上下文中的 Token 序列（制度、说明、多段证据）"
          unique="在语言空间里做大规模条件生成与语境对照"
          output="解释、摘要、疑点草稿、核对清单（文本）"
          limit="可能幻觉；不会天然访问业务系统；不能替代职业判断"
        />
        <div className="task-logic-map">
          <span>板书收束</span>
          <code>Token 化 → 条件概率 P(下一 Token) → Attention 联语境 → 逐 Token 生成</code>
          <span>提醒</span>
          <strong>流畅 ≠ 审计结论；窗口外 = 未知</strong>
        </div>
        <LessonTakeaway>
          LLM 是以 Transformer 为骨干、在海量 Token 序列上训练的大型神经网络：训练时通过下一 Token 误差更新权重，使用时由推理服务接收上下文并逐 Token 生成；它能理解和生成已提供的语言材料，但不会天然主动取数，也不能替代事实核验与审计判断。
        </LessonTakeaway>
      </section>
    </div>
  );
}

function CourseArchitecture() {
  return <div className="course-architecture">
    <div className="course-architecture-head"><span>整堂课的顶层结构</span><h3>先理解技术，再理解Agent，最后讨论审计应用</h3><p>三部分是课程骨架。递进案例只是第一部分用于解释技术演进的教学方法，不能取代这套总体架构。</p></div>
    <div className="course-architecture-parts">{courseParts.map(part => <a href={part.href} key={part.no}><span>{part.no}</span><small>章节 {part.range}</small><h4>{part.title}</h4><p>{part.description}</p></a>)}</div>
  </div>;
}

function FoundationCaseLadder() {
  const cases = [
    { no: "01", method: "规则", title: "同一张发票，被报销两次", detail: "号码、金额和日期完全一致", why: "判断条件可以完整写出", claim: "BX-41610 / BX-41902" },
    { no: "02", method: "ML", title: "四笔都低于2,000元，却集中发生", detail: "同员工、同商户、两天内、说明相似", why: "需要组合多个弱信号", claim: "BX-41881—84" },
    { no: "03", method: "ANN", title: "票面286元，平台实际86元", detail: "异常可能藏在数字“2”的像素里", why: "需要直接处理高维图像", claim: "BX-42306" },
    { no: "04", method: "LLM", title: "客户招待，却出现儿童餐和生日蛋糕", detail: "周日、CRM无拜访、日历为家属生日", why: "需要理解语言和业务语境", claim: "BX-42519" },
  ];
  return <div className="case-ladder">
    <div className="case-ladder-head"><div><span>第一部分内部的教学线索</span><h3>问题逐渐变难，技术基础逐层出现</h3><p>规则、ML、ANN和LLM分别对应一种新的问题困难。这条案例线只服务于“技术基础”的讲解；Agent将在第二部分作为独立核心系统展开。</p></div><strong>第一部分 · 01—05</strong></div>
    <div className="case-ladder-list">{cases.map(item => <article key={item.no}><b>{item.no}</b><div><span>{item.method} · {item.claim}</span><h4>{item.title}</h4><p>{item.detail}</p></div><small>{item.why}</small></article>)}</div>
    <div className="case-ladder-rule"><strong>第一部分组织原则</strong><p>每一章先提出上一种方法解决不了的具体问题，再引入一个新概念。讲到LLM为止，只回答“模型怎样理解和生成”；Agent的系统架构、工具循环与控制机制留到第二部分集中讲。</p></div>
  </div>;
}

function CapabilityBoundary({ method, input, output, unique, limit }: { method: string; input: string; output: string; unique: string; limit: string }) {
  return <div className="capability-boundary"><div><span>方法</span><strong>{method}</strong></div><div><span>输入</span><strong>{input}</strong></div><div><span>它独有的增量能力</span><strong>{unique}</strong></div><div><span>这一步的输出</span><strong>{output}</strong></div><div className="limit"><span>仍然做不到</span><strong>{limit}</strong></div></div>;
}

function CapabilityChain() {
  const rows = [
    ["规则", "完全重复的发票字段", "精确执行人已知条件", "发现同票重复报销", "写不尽弱信号组合"],
    ["机器学习", "表格特征+历史标签", "拟合多个弱信号的组合", "提高拆分事项优先级", "概率不是证据"],
    ["神经网络", "票据原始像素", "学习笔画、数字与图像特征", "识别票面286", "看见不等于理解"],
    ["大模型", "票据文字+业务上下文", "联系语言、制度与语境", "解释招待目的矛盾", "不会天然主动取数"],
    ["智能体", "目标+多系统工具反馈", "按证据缺口选择下一行动", "形成行程矛盾证据包", "不应自动定性"],
  ];
  return <div className="capability-chain"><div className="capability-chain-head"><span>先看全貌</span><h3>五种方法不是替代关系，而是在不同难度上各司其职</h3></div><div className="capability-chain-table"><div className="chain-row chain-header"><span>方法</span><span>看什么</span><span>新能力</span><span>本章案例结果</span><span>边界</span></div>{rows.map(row => <div className="chain-row" key={row[0]}>{row.map((cell, i) => i === 0 ? <strong key={cell}>{cell}</strong> : <span key={cell}>{cell}</span>)}</div>)}</div></div>;
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
    label: "用12条历史核实样本拟合 NEW",
    code: `# 四列二元特征共16种组合；这里用12条带标签样本训练，估计未见过的 NEW
import math

# 特征顺序：贴近审批线, 首次合作商户, 周末发生, 整数金额
history = [
    ([0, 0, 0, 0], 0),  # H01 正常
    ([0, 1, 1, 1], 1),  # H02 确认异常
    ([0, 0, 0, 1], 0),  # H03 正常
    ([1, 0, 1, 1], 1),  # H04 确认异常
    ([0, 0, 1, 0], 0),  # H05 正常
    ([1, 1, 0, 0], 1),  # H06 确认异常
    ([0, 1, 0, 0], 0),  # H07 正常
    ([1, 1, 0, 1], 1),  # H08 确认异常
    ([1, 0, 0, 0], 0),  # H09 正常
    ([1, 1, 1, 0], 1),  # H10 确认异常
    ([0, 0, 1, 1], 0),  # H11 正常
    ([0, 1, 1, 0], 0),  # H12 正常
]

def sigmoid(z):
    return 1 / (1 + math.exp(-max(-30, min(30, z))))

weights, bias, lr = [0.0] * 4, 0.0, 1.1
for epoch in range(800):
    preds = [sigmoid(sum(w * x for w, x in zip(weights, xv)) + bias) for xv, _ in history]
    loss = sum(-(y * math.log(p + 1e-9) + (1 - y) * math.log(1 - p + 1e-9)) for p, (_, y) in zip(preds, history)) / len(history)
    if epoch in (0, 100, 300, 799):
        print(f"epoch={epoch:3d}  loss={loss:.4f}")
    grads = [sum((p - y) * xv[j] for p, (xv, y) in zip(preds, history)) / len(history) for j in range(4)]
    weights = [w - lr * g for w, g in zip(weights, grads)]
    bias -= lr * sum(p - y for p, (_, y) in zip(preds, history)) / len(history)

# NEW：贴近审批线=是, 首次商户=否, 周末=否, 整数金额=是（不在上面12条中）
new_case = [1, 0, 0, 1]
z = sum(w * x for w, x in zip(weights, new_case)) + bias
risk = sigmoid(z)
print("训练后参数：", [round(w, 3) for w in weights], "bias=", round(bias, 3))
print("NEW 特征 x =", new_case, "  z =", round(z, 3))
print("NEW 样本异常概率：", f"{risk:.1%}")
print("提醒：概率用于排序排队，不是违规证据。")
`,
  },
  neural: {
    label: "用 1,300 张 8×8 像素训练数字网络",
    code: `# 真实运行：从64个像素学习识别0—9（对应票面金额数字）
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
print("拼出票面金额 286；金额是否与平台一致，仍交给规则判断。")
print("提醒：看见数字 ≠ 理解制度，更不是审计结论。")`,
  },
  language: {
    label: "训练一个微型神经语言模型",
    code: `# 真实运行：用梯度下降训练“根据当前字符预测下一个字符”的神经语言模型
# 它不是Transformer，但完整保留：Token化 → 前向 → 交叉熵Loss → 反向传播 → 更新权重 → 检查点
import numpy as np
np.random.seed(7)

corpus = ("报销金额必须与发票查验平台金额一致。不一致时应转人工复核。"
          "审计结论需要原始证据。报销说明应与业务事实一致。") * 20
tokens = sorted(set(corpus))
token_to_id = {token: i for i, token in enumerate(tokens)}
id_to_token = {i: token for token, i in token_to_id.items()}
V = len(tokens)

# 训练样本：当前位置x，真实的下一个位置y
x = np.array([token_to_id[c] for c in corpus[:-1]])
y = np.array([token_to_id[c] for c in corpus[1:]])

# 参数矩阵W：每一行给出“当前Token → 所有下一个Token”的分数
W = np.random.normal(0, 0.02, (V, V))
learning_rate = 2.0

def forward_and_loss(W):
    logits = W[x]
    logits = logits - logits.max(axis=1, keepdims=True)
    probs = np.exp(logits)
    probs /= probs.sum(axis=1, keepdims=True)
    loss = -np.log(probs[np.arange(len(y)), y] + 1e-12).mean()
    return probs, loss

print("词表大小 V =", V)
print("初始参数 W shape =", W.shape)
for epoch in range(301):
    probs, loss = forward_and_loss(W)
    if epoch in (0, 1, 10, 50, 150, 300):
        print(f"epoch={epoch:3d}  loss={loss:.4f}")

    # 交叉熵 + Softmax 的梯度；只更新本批样本涉及的行
    grad_logits = probs.copy()
    grad_logits[np.arange(len(y)), y] -= 1
    grad_logits /= len(y)
    grad_W = np.zeros_like(W)
    np.add.at(grad_W, x, grad_logits)
    W -= learning_rate * grad_W

checkpoint = {
    "config": {"model_type": "teaching_bigram_nn", "vocab_size": V},
    "tokenizer": token_to_id,
    "model.weight": W.copy(),
}
print("\\n训练后保存：config + tokenizer + model.weight", checkpoint["model.weight"].shape)
print("权重预览：", np.round(W[:2, :6], 3))

# 推理：参数固定，反复预测概率最高的下一个Token
text = "报"
for _ in range(18):
    current_id = token_to_id[text[-1]]
    next_id = int(np.argmax(W[current_id]))
    text += id_to_token[next_id]
print("生成结果：", text)
print("提醒：真实LLM把W换成Embedding、多层Attention/MLP和LM Head等大量张量。")`,
  },
  llm_call: {
    label: "模拟一次完整的大模型调用",
    code: `# 教学模拟：请求格式与真实模型服务同构，但不访问外网、不需要API密钥
import json

request = {
    "model": "enterprise-llm",
    "messages": [
        {"role": "system", "content": "只列疑点，不下审计结论；返回JSON。"},
        {"role": "user", "content": "说明：周日客户招待；小票：儿童套餐、生日蛋糕；CRM：当天无客户拜访。"},
    ],
    "temperature": 0.2,
    "max_output_tokens": 300,
}

def model_server(payload):
    # 真实服务在这里：鉴权 → Tokenizer → 加载的模型权重 → 逐Token生成 → 解码
    print("[服务端 1/4] 鉴权并校验请求")
    context = "\\n".join(m["content"] for m in payload["messages"])
    tokens = list(context)  # 教学版Tokenizer：按字符切分
    print(f"[服务端 2/4] Tokenizer编码：{len(tokens)}个输入Token（教学口径）")
    print("[服务端 3/4] 已加载的Transformer权重执行前向计算并逐Token生成")

    # 教学版固定输出：只用于观察响应结构，不冒充真实LLM
    output = {
        "status": "建议人工复核",
        "conflicts": ["客户招待与小票内容不一致", "CRM无当天拜访"],
        "missing_evidence": ["客户名单", "审批附件"],
        "audit_conclusion": None,
    }
    print("[服务端 4/4] 解码并封装响应")
    return {
        "model": payload["model"],
        "output": output,
        "usage": {"input_tokens": len(tokens), "output_tokens": 47},
        "stop_reason": "end",
    }

print("=== 应用发送的REQUEST ===")
print(json.dumps(request, ensure_ascii=False, indent=2))
response = model_server(request)
print("\\n=== 服务返回的RESPONSE ===")
print(json.dumps(response, ensure_ascii=False, indent=2))
print("\\n生产提示：API密钥应放在受控后端，不能写进静态HTML。")`,
  },
  attention: {
    label: "计算一次微型Attention",
    code: `# 真实运行：不用第三方库，计算一次单头Attention
import math

tokens = ["周日", "客户招待", "儿童套餐", "生日蛋糕", "CRM无拜访"]
# 每个Token先被表示成一个很小的向量；真实模型的维度会大得多
Q = [0.8, 0.4, 0.9]
keys = [
    [0.5, 0.2, 0.4],
    [0.3, 0.8, 0.5],
    [0.8, 0.2, 0.8],
    [0.9, 0.1, 0.9],
    [0.7, 0.7, 0.8],
]
values = [
    [0.8, 0.1],
    [0.3, 0.4],
    [0.1, 0.9],
    [0.2, 1.0],
    [0.7, 0.8],
]

scores = [sum(q*k for q, k in zip(Q, key)) / math.sqrt(len(Q)) for key in keys]
largest = max(scores)
exp_scores = [math.exp(score - largest) for score in scores]
weights = [value / sum(exp_scores) for value in exp_scores]
context = [sum(weight * value[i] for weight, value in zip(weights, values)) for i in range(2)]

print("当前Query：判断客户招待目的是否需要进一步核实")
for token, score, weight in zip(tokens, scores, weights):
    print(f"{token:6s}  原始分数={score:.3f}  注意力权重={weight:.1%}")
print("加权汇总后的上下文向量：", [round(v, 3) for v in context])
print("提醒：权重表示当前计算中的信息关联，不是事实证明或因果关系。")`,
  },
  agent: {
    label: "运行智能体循环",
    code: `# 真实运行：BX-42017，根据工具反馈选择下一步
goal = "核验BX-42017声称的苏州客户行程，形成可复核证据包"
tools = {
    "claim": {"status":"ok", "route":"上海机场→苏州客户", "trip_id":"T2017", "source":"expense_claims.csv / BX-42017"},
    "flight": {"status":"ok", "arrival_city":"南京", "source":"flight_records.csv / T2017"},
    "hotel": {"status":"ok", "city":"南京", "source":"hotel_records.csv / T2017"},
    "crm": {"status":"ok", "suzhou_visit":False, "source":"customer_visits.csv / E1004"},
    "calendar": {"status":"ok", "event":"南京项目内部会议", "source":"employee_calendar.csv / E1004"},
}
state = {"evidence": {}, "failures": [], "calls": 0, "max_calls": 5}

def choose_next_action(state):
    evidence = state["evidence"]
    if state["failures"]:
        return "stop_error"
    if all(name in evidence for name in ("claim", "flight", "hotel", "crm", "calendar")):
        return "stop_review"
    if state["calls"] >= state["max_calls"]:
        return "stop_budget"
    if "claim" not in evidence: return "claim"
    if "flight" not in evidence: return "flight"
    # 只有航班落地城市与报销说明矛盾时，才扩大到酒店与业务记录
    city_mismatch = evidence["flight"]["arrival_city"] not in evidence["claim"]["route"]
    if not city_mismatch: return "stop_consistent"
    if "hotel" not in evidence: return "hotel"
    if "crm" not in evidence: return "crm"
    if "calendar" not in evidence: return "calendar"
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
  audit_pipeline: {
    label: "运行一条受控的审计智能体流水线",
    code: `# 教学版端到端流程：规则校验 → 语义整理 → 动态取证 → 证据包 → 人工关口
# 全部数据均为课堂Toy Example；semantic_extract用确定性代码模拟LLM结构化输出。
import json

claim = {
    "claim_id": "BX-42017", "employee_id": "E1004", "trip_id": "T2017",
    "amount": 468, "description": "上海机场前往苏州客户",
}
policy = {
    "policy_id": "TRAVEL-2026-04",
    "criterion": "差旅费用应与真实业务行程一致；异常事项需补充说明和审批。",
}
tools = {
    "flight": {"status":"ok", "arrival_city":"南京", "source":"flight_records.csv/T2017"},
    "hotel": {"status":"ok", "city":"南京", "source":"hotel_records.csv/T2017"},
    "crm": {"status":"ok", "suzhou_visit":False, "source":"customer_visits.csv/E1004"},
    "calendar": {"status":"ok", "event":"南京项目内部会议", "source":"employee_calendar.csv/E1004"},
}

# 1) 确定性规则：字段完整性、金额类型等应先由普通代码完成
required = ["claim_id", "employee_id", "trip_id", "amount", "description"]
missing_fields = [field for field in required if claim.get(field) in (None, "")]
assert not missing_fields, f"缺少必填字段：{missing_fields}"
print("[1/5 规则] 必填字段完整；进入语义整理。")

# 2) 教学模拟LLM：把自然语言整理为结构化主张；真实系统应调用受控模型服务
def semantic_extract(text):
    return {"claimed_origin":"上海机场", "claimed_destination":"苏州客户", "raw_text":text}

claim_semantics = semantic_extract(claim["description"])
print("[2/5 LLM] 结构化主张：", claim_semantics)

# 3) Agent：只有航班返回矛盾后，才扩大到酒店、CRM和日历
state = {"evidence": {}, "failures": [], "calls": 0, "max_calls": 4}
def choose_next(state):
    evidence = state["evidence"]
    if all(name in evidence for name in ("flight", "hotel", "crm", "calendar")): return "stop_review"
    if state["failures"] or state["calls"] >= state["max_calls"]: return "stop_manual"
    if "flight" not in evidence: return "flight"
    if evidence["flight"]["arrival_city"] != "上海":
        for name in ("hotel", "crm", "calendar"):
            if name not in evidence: return name
    return "stop_review"

while True:
    action = choose_next(state)
    if action.startswith("stop_"):
        stop_reason = action
        break
    result = tools[action]
    state["calls"] += 1
    if result["status"] == "ok": state["evidence"][action] = result
    else: state["failures"].append({"tool":action, "result":result})
    print(f"[3/5 Agent] 调用 {action}：{result}")

# 4) 形成五字段证据包；事实和推断分开
evidence_pack = {
    "case_id": claim["claim_id"],
    "facts": {
        "claim": claim_semantics,
        "tool_results": state["evidence"],
    },
    "criteria": policy,
    "evidence_sources": [row["source"] for row in state["evidence"].values()],
    "uncertainty": ["尚未取得员工解释", "不能排除临时改签或记录缺失"],
    "recommended_action": "转审计人员复核并补充行程变更说明",
    "stop_reason": stop_reason,
    "audit_conclusion": None,
}
print("[4/5 证据包]")
print(json.dumps(evidence_pack, ensure_ascii=False, indent=2))

# 5) 人工关口：系统只能提交疑点，不能自行定性
print("[5/5 人工关口] 状态=等待审计人员复核；未生成违规、错报或舞弊结论。")`,
  },
  audit_ask_data: {
    label: "运行一次受控智能问数",
    code: `# 教学版智能问数：问题 → 口径契约 → 权限 → 确定性计算 → 证据化回答
# 真实系统中，数据来自认证语义层和只读查询网关；这里用小数据演示责任分工。
question = "2026年二季度华东区差旅费同比增长多少？"
user_scopes = {"expense.aggregate.read"}

semantic_contract = {
    "metric": "travel_expense_cny_v3",
    "region": "华东",
    "period_current": "2026Q2",
    "period_compare": "2025Q2",
    "exclude_reversal": True,
}

rows = [
    {"region":"华东", "quarter":"2025Q2", "amount":1060, "reversal":False},
    {"region":"华东", "quarter":"2026Q2", "amount":1100, "reversal":False},
    {"region":"华东", "quarter":"2026Q2", "amount":148,  "reversal":False},
    {"region":"华东", "quarter":"2026Q2", "amount":20,   "reversal":True},
    {"region":"华南", "quarter":"2026Q2", "amount":900,  "reversal":False},
]

required_scope = "expense.aggregate.read"
if required_scope not in user_scopes:
    raise PermissionError("无汇总费用查询权限")

def certified_total(quarter):
    return sum(
        row["amount"] for row in rows
        if row["region"] == semantic_contract["region"]
        and row["quarter"] == quarter
        and (not semantic_contract["exclude_reversal"] or not row["reversal"])
    )

current = certified_total(semantic_contract["period_current"])
compare = certified_total(semantic_contract["period_compare"])
yoy = (current - compare) / compare

# 确定性校验：本例要求比较期不为0、结果能按明细复算
assert compare != 0
assert current == 1248 and compare == 1060

print("问题：", question)
print("口径契约：", semantic_contract)
print(f"回答：2026Q2为{current}万元，2025Q2为{compare}万元，同比增长{yoy:.1%}。")
print("来源：certified_expense_fact / 快照2026-07-15 08:00")
print("查询ID：AQ-2026-0715-042；校验状态：passed")
print("边界：该数字只代表已授权数据和上述口径，不自动构成审计结论。")`,
  },
  audit_report: {
    label: "运行报告生成前质量门",
    code: `# 教学版报告生成：只允许已确认字段进入草稿；缺失留占位，冲突则阻断
finding = {
    "finding_id": "F-TRAVEL-03",
    "condition": "BX-42017报销说明称前往苏州客户，但航班和酒店记录显示员工在南京。",
    "criteria": "差旅费用信息应与真实业务行程一致（制度P-04）。",
    "cause": None,  # 尚未访谈确认，绝不能由模型猜测
    "effect": None, # 尚未完成影响评价
    "recommendation": "核实行程变更原因，并评估是否增加目的地一致性校验。",
    "evidence_ids": ["E-17", "E-18"],
    "management_response": None,
    "amounts": {"evidence_pack": 468, "finding_register": 468},
    "status": "reviewed",
}

def quality_gate(item):
    errors, gaps = [], []
    if item["status"] != "reviewed": errors.append("发现尚未复核")
    if len(set(item["amounts"].values())) != 1: errors.append("金额来源冲突")
    if not item["evidence_ids"]: errors.append("没有证据引用")
    for field in ("cause", "effect", "management_response"):
        if not item[field]: gaps.append(field)
    return errors, gaps

errors, gaps = quality_gate(finding)
print("发现：", finding["finding_id"])
print("生成前错误：", errors or "无")
print("尚缺字段：", gaps or "无")

if errors:
    print("状态：BLOCKED，禁止生成；由审计人员修复来源后重新冻结。")
else:
    parts = [
        f"{finding['condition']}〔证据{'、'.join(finding['evidence_ids'])}〕",
        finding["criteria"],
        finding["cause"] or "【原因待确认】",
        finding["effect"] or "【影响待评价】",
        f"建议：{finding['recommendation']}",
        finding["management_response"] or "【管理层回应待取得】",
    ]
    draft = "".join(parts)
    print("状态：DRAFT_WITH_GAPS，只生成带占位符草稿。")
    print("草稿：", draft)
    print("下一步：访谈、影响评价、取得回应，再由审计人员逐句复核和批准。")`,
  },
  rule: {
    label: "两表映射与逻辑判断",
    code: `# 场景：报销金额是否与发票台账一致？
# 只看报销明细，每笔都“看起来正常”；必须映射到台账后才能发现差额。

claims = [
    {"claim_id": "BX-42306", "emp": "E1004", "invoice_no": "INV-Q-286", "claim_amount": 286, "date": "2026-05-21"},
    {"claim_id": "BX-41004", "emp": "E1002", "invoice_no": "INV-41004", "claim_amount": 420, "date": "2026-05-07"},
    {"claim_id": "BX-41610", "emp": "E1001", "invoice_no": "INV-77821", "claim_amount": 1280, "date": "2026-05-16"},
]
invoices = [
    {"invoice_no": "INV-Q-286", "invoice_amount": 86, "date": "2026-05-21", "status": "有效"},
    {"invoice_no": "INV-41004", "invoice_amount": 420, "date": "2026-05-07", "status": "有效"},
    {"invoice_no": "INV-77821", "invoice_amount": 1280, "date": "2026-05-16", "status": "有效"},
]

# 1) 映射：用发票号把报销单接到发票台账
invoice_by_no = {row["invoice_no"]: row for row in invoices}

# 2) 判断：映射成功后，比较报销金额与开票金额
print("规则：按发票号映射；报销金额 ≠ 开票金额 → 疑点")
for claim in claims:
    inv = invoice_by_no.get(claim["invoice_no"])
    if inv is None:
        print(f"疑点：{claim['claim_id']} 发票 {claim['invoice_no']} 在台账中不存在")
        continue
    if claim["claim_amount"] != inv["invoice_amount"]:
        print(
            f"疑点：{claim['claim_id']} 报销金额={claim['claim_amount']}，"
            f"台账开票金额={inv['invoice_amount']}（发票号={claim['invoice_no']}）"
        )
`,
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
    ["LLM与Agent最核心的区别？", ["Agent参数更多", "Agent把模型置于目标、工具、状态、循环和控制组成的运行系统中", "LLM只能输出英文"], 1],
    ["工具调用超时后，可靠的Agent首先应当？", ["假定查询无异常", "记录失败状态，并按策略重试或转人工", "无限重复调用"], 1],
    ["状态、长期记忆和运行轨迹的关系？", ["三者完全相同", "状态服务当前任务，记忆跨任务复用，轨迹用于还原运行过程", "只有长期记忆需要治理"], 1],
    ["可信的智能问数答案至少还要带什么？", ["只要数字即可", "口径、查询、来源、校验状态和限制", "模型的思考过程"], 1],
    ["报告发现的原因尚未确认时，系统应当？", ["按经验补全原因", "保留占位符并创建补充任务", "删除这条发现"], 1],
    ["审计智能体的可复核证据包应包含？", ["一个风险分", "一段流畅结论", "事实、标准、证据、不确定性和下一步"], 2],
    ["审计智能体更稳妥的上线顺序？", ["全面自动执行", "离线测试→影子运行→小范围试点→受控扩大", "先写入业务系统再补测试"], 1],
  ] as const;
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const score = Object.entries(answers).filter(([i, a]) => qs[Number(i)][2] === a).length;
  return <div className="quiz"><div className="quiz-score"><span>结课自测</span><strong>{score}<small>/{qs.length}</small></strong><p>{Object.keys(answers).length === qs.length ? score === qs.length ? "已经掌握技术基础、Agent架构与审计落地三条主线。" : "查看标出的正确答案，再回顾相应章节。" : `完成全部题目，检查关键边界是否真正说清楚（${Object.keys(answers).length}/${qs.length}）。`}</p></div><div>{qs.map((q, i) => <section key={q[0]}><p><span>{String(i + 1).padStart(2, "0")}</span>{q[0]}</p><div>{q[1].map((a, j) => { const answered = answers[i] !== undefined; const cls = answers[i] === j ? (q[2] === j ? "correct" : "wrong") : answered && q[2] === j ? "answer" : ""; return <button className={cls} key={a} onClick={() => setAnswers({ ...answers, [i]: j })}>{a}</button>; })}</div></section>)}</div></div>;
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
  const [activePage, setActivePage] = useState(0);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const activeCoursePage = coursePages[activePage];
  const goToPage = useCallback((index: number) => {
    const bounded = Math.max(0, Math.min(coursePages.length - 1, index));
    setActivePage(bounded);
    const page = coursePages[bounded];
    history.replaceState(null, "", page.id === "cover" ? "#top" : `#${page.id}`);
    document.querySelector<HTMLElement>(".paginated-course .page")?.scrollTo({ top: 0, behavior: "auto" });
    window.scrollTo({ top: 0, behavior: "auto" });
    if (matchMedia("(max-width: 760px)").matches) setSidebarOpen(false);
  }, []);

  useEffect(() => {
    const requested = location.hash.replace("#", "");
    const index = coursePages.findIndex(page => page.id === requested);
    if (index >= 0) setActivePage(index);
    if (matchMedia("(max-width: 760px)").matches) setSidebarOpen(false);
  }, []);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && sidebarOpen) {
        setSidebarOpen(false);
        return;
      }
      const target = event.target as HTMLElement | null;
      if (target?.closest("input, textarea, select, button, [contenteditable='true']")) return;
      if (["ArrowRight", "PageDown"].includes(event.key)) {
        event.preventDefault();
        goToPage(activePage + 1);
      }
      if (["ArrowLeft", "PageUp"].includes(event.key)) {
        event.preventDefault();
        goToPage(activePage - 1);
      }
      if (event.key === "Home") {
        event.preventDefault();
        goToPage(0);
      }
      if (event.key === "End") {
        event.preventDefault();
        goToPage(coursePages.length - 1);
      }
    };
    addEventListener("keydown", onKeyDown);
    return () => removeEventListener("keydown", onKeyDown);
  }, [activePage, goToPage, sidebarOpen]);

  const goToId = (id: string) => {
    const index = coursePages.findIndex(page => page.id === id);
    if (index >= 0) goToPage(index);
  };

  return <PythonKernelProvider>
    <main id="top" className={`paginated-course page-group-${activeCoursePage.group} ${sidebarOpen ? "sidebar-open" : "sidebar-collapsed"} view-${mode} ${mode !== "student" ? "show-notes" : ""}`}>
      <Header mode={mode} setMode={setMode} progressOverride={Math.round(activePage / (coursePages.length - 1) * 100)} onHome={() => goToPage(0)} sidebarOpen={sidebarOpen} onToggleSidebar={() => setSidebarOpen(value => !value)} />
      {sidebarOpen && <button type="button" className="sidebar-scrim" aria-label="关闭章节侧栏" onClick={() => setSidebarOpen(false)} />}
      <aside id="course-sidebar" className="sidenav" aria-hidden={!sidebarOpen}><div><span>约2小时 · 三部分</span><strong>LLM · Agent · 审计</strong></div><nav>
        <button type="button" className={activeCoursePage.id === nav[0][0] ? "active" : ""} onClick={() => goToId(nav[0][0])}><span>01</span><b>{nav[0][1]}</b><small className="nav-time">{nav[0][2]}</small></button>
        <p className="nav-part"><span>第一部分</span>技术基础</p>
        {nav.slice(1, 5).map((x, i) => <button type="button" className={activeCoursePage.id === x[0] ? "active" : ""} onClick={() => goToId(x[0])} key={x[0]}><span>{String(i + 2).padStart(2, "0")}</span><b>{x[1]}</b><small className="nav-time">{x[2]}</small></button>)}
        <p className="nav-part core"><span>第二部分</span>Agent基础与架构</p>
        {nav.slice(5, 9).map((x, i) => <button type="button" className={activeCoursePage.id === x[0] ? "active" : ""} onClick={() => goToId(x[0])} key={x[0]}><span>{String(i + 6).padStart(2, "0")}</span><b>{x[1]}</b><small className="nav-time">{x[2]}</small></button>)}
        <p className="nav-part"><span>第三部分</span>审计应用</p>
        {nav.slice(9, 13).map((x, i) => <button type="button" className={activeCoursePage.id === x[0] ? "active" : ""} onClick={() => goToId(x[0])} key={x[0]}><span>{String(i + 10).padStart(2, "0")}</span><b>{x[1]}</b><small className="nav-time">{x[2]}</small></button>)}
      </nav></aside>
      <div className="page">
        <section className="hero course-slide" hidden={activeCoursePage.id !== "cover"}>
          <div className="hero-head">
            <h1>LLM 与 Agent：基础、架构及审计应用</h1>
          </div>
          <div className="hero-path three-parts">{courseParts.map((part, index) => <a key={part.no} href={part.href} onClick={(event) => { event.preventDefault(); goToId(part.href.slice(1)); }}><span>0{index + 1}</span><strong>{part.title}</strong><small>{part.no}</small><p>{part.description}</p></a>)}</div>
        </section>

        <section id="problem" className="lesson course-slide" hidden={activeCoursePage.id !== "problem"}>
          <SectionTitle no="01" time="导言 · 约5分钟" title="导言" />
          <div className="lesson-abstract">
            <span>Abstract</span>
            <p>本课讨论大语言模型（LLM）与智能体（Agent）的基础概念、系统架构，以及它们在审计工作中的可能用法。课程分为三部分：</p>
            <ul className="abstract-parts">
              <li><b>第一部分 · 技术基础</b><span>从规则、机器学习、神经网络到大模型，说明这些技术为何会逐层出现。</span></li>
              <li><b>第二部分 · Agent 基础与架构</b><span>讲清 Agent 是什么、由哪些模块组成、如何与工具形成受控闭环。</span></li>
              <li><b>第三部分 · 审计应用</b><span>讨论如何把上述能力落到审计智能体场景。</span></li>
            </ul>
          </div>
          <CourseArchitecture />
          <div className="content-block lesson-takeaways">
            <h3>主要收获</h3>
            <ol className="takeaway-grid">
              <li><b>01</b><span>能按问题类型选择方法，并分清：基于任务逻辑的编程、经典机器学习、神经网络与大模型——各自能解决什么、解决不了什么。</span></li>
              <li><b>02</b><span>分得清 LLM 与 Agent：前者擅长理解与生成；后者围绕目标调用工具、根据反馈决策并受控停止。</span></li>
              <li><b>03</b><span>理解 Agent 的运行逻辑：能说出基本模块与工具反馈循环，并对权限、日志、人在回路等落地约束有初步了解。</span></li>
              <li><b>04</b><span>独立思考在审计场景下，自己该如何针对性地构建智能体。</span></li>
            </ol>
          </div>
          <Bridge
            from="导言之后"
            problem="许多审计场景里，风险点我们已经想清楚，也可以用简单的逻辑判断、字段匹配等方法直接得到结果。这时不必急着上模型，基于任务逻辑的编程就够用了。"
            lead="所以，我们首先介绍："
            to="基于任务逻辑的编程"
          />
          <TeacherNote
            time="5分钟"
            question="学完这堂课，你最想带走的是一张技术名词表，还是一套选方法的判断习惯？"
            misconception="导言不是要把三部分讲完；只是建立地图，细节在后续章节展开。"
            mustSay="三部分分工清楚；主要收获里要分清经典机器学习与神经网络；证据与复核优先于黑箱分数。"
            canSkip="具体案例编号，后面章节会逐一出现。"
          />
        </section>

        <div className="part-overview course-slide" hidden={activeCoursePage.id !== "part-1"}>
          <PartTitle
            id="part-1"
            no="第一部分"
            title="大模型和智能体的技术基础"
            chapters="章节 02—05"
            lead="从规则、机器学习、神经网络到大模型，说明这些技术为何会逐层出现，各自解决什么问题、卡在哪里。"
          />
          <FoundationCaseLadder />
        </div>

        <section id="code" className="lesson course-slide" hidden={activeCoursePage.id !== "code"}>
          <SectionTitle no="02" time="第一部分 · 约8分钟" title="基于任务逻辑的编程" />
          <TaskLogicDemo />
          <InlinePythonLab
            example="rule"
            guide="先按发票号把报销单映射到台账，再比较金额。只看报销明细时 286 元看不出问题；映射后才能发现台账是 86 元。"
          />
          <Bridge from="任务逻辑编程的边界" problem="若每个字段单独看都既可能正常也可能异常，需要借助历史上已经核实过的结果，学习哪些特征组合更值得优先核查。" to="经典机器学习" />
          <TeacherNote time="8分钟" question="只看报销明细，你能发现 BX-42306 的问题吗？还缺哪张表？" misconception="能写清的判断不必先上模型；程序只执行人事先写明的逻辑。" mustSay="必须先按发票号映射到台账，再比较金额；单看报销表发现不了 286 vs 86。" canSkip="语法细节。" />
        </section>

        <section id="ml" className="lesson course-slide" hidden={activeCoursePage.id !== "ml"}>
          <SectionTitle no="03" time="第一部分 · 约10分钟" title="经典机器学习" />
          <FeatureFittingDemo />
          <InlinePythonLab
            example="ml"
            guide="表中 H01—H12 是训练集；NEW 是未见过的第 13 种组合。运行后对照下方代入板书。"
          />
          <NewSampleInferenceBoard />
          <Bridge from="经典机器学习的边界" problem="下一笔报销的表格特征看起来正常，真正异常却藏在票据图片里：金额数字的像素可能被改过。人工造几个表格特征已经不够。" to="人工神经网络（ANN）" />
          <TeacherNote time="10分钟" question="模型给出 80% 核查概率，这是证据吗？" misconception="机器学习不是自动发现真相；Loss 下降也不等于可以直接定性。" mustSay="弱信号单独定不了性；用历史核实结果拟合组合权重，给新单排序。" canSkip="梯度公式细节。" />
        </section>

        <section id="nn" className="lesson course-slide" hidden={activeCoursePage.id !== "nn"}>
          <SectionTitle no="04" time="第一部分 · 约12分钟" title="ANN" />
          <AnnPixelDemo />
          <InlinePythonLab
            example="neural"
            guide="读入 1,300 张 8×8 数字图：1,000 张训练 64→24→10 网络，再用 300 张独立测试集看准确率。"
          />
          <div className="fun-demo-frame">
            <div>
              <span>趣味支线 · 5—7分钟</span>
              <h3>同一种底层机制，为什么也能识别人脸？</h3>
              <p>
                审计主线是「像素→数字→286」。下面用真实 ResNet34 展示「像素→面部特征→分类概率」。
                只帮助理解神经网络，不作为审计案例证据。
              </p>
            </div>
            <FacePredictLab />
            <small>教学边界：置信度高不等于事实正确；真实人脸识别还涉及训练偏差、隐私、授权与使用范围。</small>
          </div>
          <Bridge
            from="ANN 的边界"
            problem="视觉网络也能从另一张小票识别出「儿童套餐」和「生日蛋糕」，但它不会自然理解这些词为什么与「周日客户招待」、CRM 无拜访和家属生日相互矛盾。"
            to="大语言模型（LLM）"
          />
          <TeacherNote
            time="12分钟"
            question="识别出 286 后，网络知道这笔报销有问题吗？"
            misconception="识别内容不等于理解业务；ANN 不是电子大脑。"
            mustSay="强调：超多特征 → ANN；ANN 仍属机器学习；人脸实验是趣味支线。"
            canSkip="反向传播推导；时间紧时人脸演示只跑一次。"
          />
        </section>

        <section id="llm" className="lesson course-slide" hidden={activeCoursePage.id !== "llm"}>
          <SectionTitle no="05" time="第一部分 · 约20分钟" title="从 ANN 到 LLM" />
          <LlmContextDemo />
          <Bridge
            from="LLM 的边界"
            problem="模型可以建议核对航班、酒店和 CRM，也可以把已提供的文字证据整理成疑点草稿；但关键资料分散在不同系统，下一步该查什么还取决于刚刚查到的结果——这超出了「只在窗口里生成文字」的能力。"
            to="Agent + LLM"
          />
          <TeacherNote
            time="主线20分钟；附录内容可课后展开"
            question="请学员不用术语复述：一段文字怎样进入模型、怎样训练、训练后留下什么、程序又怎样调用它？"
            misconception="LLM不是另一种魔法；训练不是把答案存进数据库；一次聊天不是重新训练；Attention权重不是证据。"
            mustSay="按七步路线讲：定义→数字化→Transformer→训练→检查点→调用→能力边界；每一步结束都复述绿色记忆条。"
            canSkip="时间紧时可跳过AttentionLab的数值细节和Python训练日志，但不能跳过检查点解剖与调用流程——它们正是初学者建立完整心智模型的关键。"
          />
        </section>

        <div className="part-overview course-slide" hidden={activeCoursePage.id !== "part-2"}>
          <PartTitle
            id="part-2"
            no="第二部分 · 核心"
            title="Agent基础与架构"
            chapters="章节 06—09 · 主线约35分钟"
            lead="LLM能够理解和生成，但不能独自完成跨系统任务。下面依次回答：什么是Agent、Agent怎样运行、怎样控制、怎样评价。"
          />
          <div className="part-route-wrap"><AgentChapterRoute /></div>
        </div>

        <section id="agent" className="lesson course-slide" hidden={activeCoursePage.id !== "agent"}>
          <SectionTitle no="06" time="第二部分 · 约8分钟" title="Agent：从回答问题到完成任务" />
          <section className="chapter-step"><div className="chapter-step-head"><span>6.1 · LLM留下的缺口</span><h3>“建议查询航班”不等于已经查到航班</h3><p>LLM完成一次输入与输出；任务系统还要执行查询、保存结果并决定下一步。</p></div>
            <div className="model-system"><div><span>LLM调用</span><strong>一次输入，一次输出</strong><p>可以解释、计划、生成工具参数；默认不会自己进入系统。</p></div><i>+</i><div><span>运行系统</span><strong>工具、状态、循环、控制</strong><p>把语言决策变成受控行动，并把结果送回下一轮。</p></div></div>
          </section>

          <section className="chapter-step"><div className="chapter-step-head"><span>6.2 · 定义</span><h3>Agent围绕目标形成行动—反馈闭环</h3><p>它根据当前状态选择行动，读取工具结果，再继续、改道或停止。</p></div>
            <Definition term="智能体（Agent）" simple="围绕目标选择下一步、调用工具、读取结果、更新状态并继续，直到成功、失败或触发人工关口的软件系统。" precise="Agent由决策模块（常为LLM）、工具接口、工作状态/记忆、编排循环与控制策略共同组成；模型只是其中的理解与决策部件。" />
            <div className="concept-grid four"><div><span>普通程序</span><strong>逻辑固定</strong><p>同样输入通常走同样代码路径。</p></div><div><span>工作流</span><strong>路径预设</strong><p>多系统连接，但分支主要由人预先画好。</p></div><div><span>LLM应用</span><strong>生成一次</strong><p>基于当前上下文回答或生成结构化指令。</p></div><div><span>Agent</span><strong>反馈闭环</strong><p>观察工具结果，再决定继续、改道或停止。</p></div></div>
          </section>

          <section className="chapter-step"><div className="chapter-step-head"><span>6.3 · 适用条件</span><h3>只有新观察会改变后续路径时，才需要Agent</h3><p>路径固定用程序或工作流；只需理解与生成用LLM应用。</p></div>
            <AgentFitLab />
            <div className="agent-decision-rule"><span>四问判定法</span><div><b>1</b><p>目标是否明确，成功与失败能否判断？</p></div><div><b>2</b><p>步骤能否预先写成固定流程？</p></div><div><b>3</b><p>新观察是否会改变下一步行动？</p></div><div><b>4</b><p>风险是否允许系统自主选择行动？</p></div></div>
          </section>
          <LessonTakeaway>Agent = 目标 + 行动选择 + 工具反馈 + 状态更新 + 受控停止。带聊天框、接入API或调用一次工具，都不足以构成Agent。</LessonTakeaway>
          <TeacherNote time="8分钟" question="固定顺序查询五个系统的程序，是Agent吗？如果航班结果会改变后续查询呢？" misconception="带聊天框、联网、调用一次工具或模型参数更多，都不自动等于Agent。" mustSay="Agent的本质是围绕目标，根据观察动态选择行动并受控停止。" canSkip="时间紧时只切换Agent判定练习中的工作流和调查任务。" />
        </section>

        <section id="agent-architecture" className="lesson course-slide" hidden={activeCoursePage.id !== "agent-architecture"}>
          <SectionTitle no="07" time="第二部分 · 约14分钟" title="Agent怎样运行" />
          <section className="chapter-step"><div className="chapter-step-head"><span>7.1 · 组成</span><h3>六个模块构成完整运行系统</h3><p>目标、决策、工具、状态、编排、控制分别承担不同责任。</p></div>
            <AgentArchitectureExplorer />
          </section>

          <section className="chapter-step"><div className="chapter-step-head"><span>7.2 · 工具</span><h3>每个工具都要有明确的输入、输出和错误</h3><p>模型选择工具；编排器校验参数与权限；工具返回事实或错误。</p></div>
            <ToolContractLab />
            <div className="tool-responsibility-row"><div><span>模型负责</span><strong>从白名单中选工具并填写参数</strong></div><i>→</i><div><span>编排器负责</span><strong>校验参数、权限、预算和调用策略</strong></div><i>→</i><div><span>工具负责</span><strong>执行确定性操作并返回原始结果</strong></div></div>
          </section>

          <section className="chapter-step"><div className="chapter-step-head"><span>7.3 · 状态与反馈</span><h3>航班结果不同，后续调查路径就不同</h3><p>状态保存证据、缺口、失败与预算；每次观察后重新选择行动。</p></div>
            <AgentStateExplorer />
            <DatasetAnchor caseId="F · 行程矛盾" claimIds="BX-42017" files={["expense_claims.csv", "flight_records.csv", "hotel_records.csv", "customer_visits.csv", "employee_calendar.csv"]} task="先查航班。若抵达上海则减少调查；若抵达南京则扩展查询酒店、CRM和日历；若工具失败则记录失败并转人工。" />
            <AgentBranchLab />
          </section>

          <section className="chapter-step"><div className="chapter-step-head"><span>7.4 · 单Agent与多Agent</span><h3>按职责、权限和上下文拆分</h3><p>窄任务先用单Agent；确需角色隔离或并行处理时再拆分。</p></div>
            <div className="agent-topology"><div><span>单Agent</span><strong>一个决策核 + 多个工具</strong><ul><li>适合目标单一、路径不长的任务</li><li>状态集中，测试和追责较简单</li><li>应作为大多数场景的起点</li></ul></div><div><span>多Agent</span><strong>多个受限角色相互协作</strong><ul><li>适合权限、专业角色或上下文必须隔离</li><li>每个角色要有独立目标、工具和停止条件</li><li>需要防止互相循环、意见漂移和成本失控</li></ul></div></div>
          </section>
          <LessonTakeaway>Agent运行循环：目标 → 决策 → 行动 → 观察 → 更新状态 → 再决策或停止。控制与可观测贯穿每一步。</LessonTakeaway>
          <TeacherNote time="14分钟" question="请学员指出：模型、编排器和工具分别对哪一段结果负责？" misconception="工具返回内容不是模型记忆；固定for循环不是动态Agent；多Agent也不天然更强。" mustSay="六块架构、工具错误语义、状态更新和停止条件必须完整走通。" canSkip="可跳过多Agent的第三条风险，但不要跳过BX-42017三分支。" />
        </section>

        <section id="agent-control" className="lesson course-slide" hidden={activeCoursePage.id !== "agent-control"}>
          <SectionTitle no="08" time="第二部分 · 约8分钟" title="Agent怎样受控运行" />
          <section className="chapter-step"><div className="chapter-step-head"><span>8.1 · 风险面</span><h3>错误可能发生在目标、模型、工具、状态和控制五个环节</h3><p>Agent会连续行动，任何一环失效都可能影响后续步骤。</p></div>
            <div className="agent-risk-surface"><div><b>01</b><strong>目标风险</strong><p>目标模糊、范围扩张、成功标准不可判断。</p></div><div><b>02</b><strong>模型风险</strong><p>误解意图、选错工具、编造参数、过度自信。</p></div><div><b>03</b><strong>工具风险</strong><p>超时、脏数据、返回结构变化、重复执行。</p></div><div><b>04</b><strong>状态风险</strong><p>过期记忆、事实与推测混淆、上下文污染。</p></div><div><b>05</b><strong>控制风险</strong><p>越权、无限循环、静默失败、日志缺失。</p></div></div>
          </section>

          <section className="chapter-step"><div className="chapter-step-head"><span>8.2 · 自主度</span><h3>建议、只读调查、受控执行对应不同权限</h3><p>写入、外发和重大判断设置人工审批或永久禁止。</p></div>
            <AgentControlLab />
            <div className="control-lines"><ol><li><strong>最小权限</strong><span>默认只读；工具和数据范围使用白名单。</span></li><li><strong>人在回路</strong><span>扩围、写入、外发和重大结论由人批准。</span></li><li><strong>可观测</strong><span>保存提示、工具参数、原始返回、决定与停止原因。</span></li><li><strong>资源边界</strong><span>限制Token、时间、工具次数、重试次数和费用。</span></li><li><strong>失败语义</strong><span>无结果、超时、无权限与“正常”严格区分。</span></li><li><strong>数据治理</strong><span>授权、脱敏、留存、隔离和删除规则事先确定。</span></li></ol></div>
          </section>

          <section className="chapter-step"><div className="chapter-step-head"><span>8.3 · 控制生命周期</span><h3>运行前定边界，运行中强制，运行后可复盘</h3><p>权限、预算、审批、日志和停止条件由系统执行。</p></div>
            <div className="control-lifecycle"><div><span>运行前</span><strong>把边界定义清楚</strong><ul><li>目标、输入和成功标准</li><li>工具与数据白名单</li><li>动作风险分级与人工关口</li><li>测试集和禁止行为</li></ul></div><div><span>运行中</span><strong>由系统强制约束</strong><ul><li>身份校验与最小权限</li><li>参数验证、预算和超时</li><li>敏感动作暂停审批</li><li>异常、冲突和失败升级</li></ul></div><div><span>运行后</span><strong>能还原、评价、追责</strong><ul><li>输入、模型与工具版本</li><li>原始返回和每步决定</li><li>人工批准与最终结果</li><li>事故复盘、回滚和改进</li></ul></div></div>
            <div className="incident-response"><span>失败处置闭环</span><b>检测异常</b><i>→</i><b>安全停止</b><i>→</i><b>保留现场</b><i>→</i><b>人工接管</b><i>→</i><b>修复并回归测试</b></div>
          </section>
          <LessonTakeaway>提示词只能引导模型；权限、预算、审批、日志和停止条件必须由系统强制执行。</LessonTakeaway>
          <TeacherNote time="8分钟" question="如果模型提示词写着“不要越权”，是否已经构成权限控制？" misconception="可靠性不只是提高模型准确率；日志也不是事后可有可无的记录。" mustSay="控制要覆盖运行前、运行中、运行后；无结果、失败和正常必须严格区分。" canSkip="风险卡片可快速扫过，但自主度三档和控制生命周期不能省。" />
        </section>

        <section id="agent-evaluation" className="lesson course-slide" hidden={activeCoursePage.id !== "agent-evaluation"}>
          <SectionTitle no="09" time="第二部分 · 约5分钟" title="Agent的价值、评价与建设" />
          <section className="chapter-step"><div className="chapter-step-head"><span>9.1 · 价值</span><h3>减少跨系统协调成本，提高任务闭环率</h3><p>系统持续追踪证据缺口，把需要判断的事项交还给人。</p></div>
            <div className="agent-value-grid"><div><span>覆盖</span><strong>看得更多</strong><p>批量处理人无法逐项浏览的任务。</p></div><div><span>连续性</span><strong>少漏步骤</strong><p>状态持续记录已做与未做事项。</p></div><div><span>协调</span><strong>少切系统</strong><p>用统一目标组织多工具查询。</p></div><div><span>可追溯</span><strong>过程可还原</strong><p>保留工具参数、返回与停止原因。</p></div><div><span>人机分工</span><strong>把时间还给判断</strong><p>机器处理查找整理，人负责高价值决策。</p></div></div>
          </section>

          <section className="chapter-step"><div className="chapter-step-head"><span>9.2 · 评价</span><h3>与现有人工或工作流比较结果、过程、成本和风险</h3><p>评价集覆盖正常、异常、缺失、冲突、工具失败和越权请求。</p></div>
            <div className="agent-eval-board"><div><span>结果质量</span><ul><li>任务完成率</li><li>关键步骤遗漏率</li><li>事实与结构化字段正确率</li></ul></div><div><span>过程质量</span><ul><li>工具成功与错误升级率</li><li>停止原因正确率</li><li>轨迹完整与可复盘性</li></ul></div><div><span>资源效率</span><ul><li>耗时、Token与工具次数</li><li>单任务成本</li><li>人工接管与改写率</li></ul></div><div><span>风险控制</span><ul><li>越权和敏感数据事件</li><li>静默失败率</li><li>不当动作与回滚能力</li></ul></div></div>
          </section>

          <section className="chapter-step"><div className="chapter-step-head"><span>9.3 · 建设</span><h3>从窄任务、离线评价和只读工具开始</h3><p>先验证正确性与失败处理，再扩大范围和自主度。</p></div>
            <div className="generic-agent-lifecycle"><div><b>01</b><strong>任务定义</strong><p>目标、输入、输出、失败与禁止事项。</p></div><div><b>02</b><strong>最小原型</strong><p>一个Agent、少量只读工具、明确状态。</p></div><div><b>03</b><strong>离线评价</strong><p>正常、边界、失败、攻击与重复测试。</p></div><div><b>04</b><strong>影子运行</strong><p>读取真实任务，不影响正式流程。</p></div><div><b>05</b><strong>受控试点</strong><p>小范围、人审批、随时回退。</p></div><div><b>06</b><strong>持续运营</strong><p>监控、复盘、版本治理与再评价。</p></div></div>
            <CapabilityBoundary method="通用Agent系统" input="目标 + 工具契约 + 当前状态 + 控制策略" unique="根据观察动态选择行动，并在成功、失败或风险条件下停止" output="任务结果 + 运行轨迹 + 失败/不确定性" limit="不知道审计证据标准、职业判断责任和组织治理要求，不能直接等同于审计智能体" />
          </section>
          <LessonTakeaway>Agent的价值必须相对现有基线衡量；建设顺序是任务定义 → 最小原型 → 离线评价 → 影子运行 → 受控试点 → 持续运营。</LessonTakeaway>
          <Bridge from="通用Agent能力" problem="现在系统已经会选择工具、读取反馈并受控停止。但要进入审计，还必须把任务目标改写为审计交付，把每条事实绑定原始证据，并明确职业判断和责任边界。" to="Agent在审计中的应用" />
          <TeacherNote time="5分钟" question="如果任务完成率提高，但越权事件和单笔成本同时上升，这个Agent算成功吗？" misconception="展示效果好不等于业务价值；准确率也不是唯一指标。" mustSay="必须有基线、覆盖失败场景，并同时衡量质量、过程、成本和风险。" canSkip="六阶段建设路径可快速讲，但必须讲清先只读、后扩权。" />
        </section>

        <div className="part-overview course-slide" hidden={activeCoursePage.id !== "part-3"}>
          <PartTitle
            id="part-3"
            no="第三部分 · 核心"
            title="Agent在审计中的应用"
            chapters="章节 10—13 · 主线约25分钟"
            lead="先确定审计工作产品，再设计智能问数和报告生成，最后建设统一的数据、证据、权限与治理底座。"
          />
          <div className="part-route-wrap"><AuditChapterRoute /></div>
        </div>

        <section id="audit" className="lesson course-slide" hidden={activeCoursePage.id !== "audit"}>
          <SectionTitle no="10" time="第三部分 · 约5分钟" title="先定义审计功能" />

          <section className="chapter-step"><div className="chapter-step-head"><span>10.1 · 工作产品</span><h3>先回答系统要交付什么</h3><p>问数答案、疑点队列、证据包、底稿和报告对应不同输入与控制。</p></div>
            <AuditCapabilityMap />
          </section>

          <section className="chapter-step"><div className="chapter-step-head"><span>10.2 · 能力组合</span><h3>规则、模型、LLM和Agent各自承担一段任务</h3><p>确定性计算、语言理解、工具行动与审计控制共同形成工作产品。</p></div>
            <CapabilityChain />
            <div className="audit-function-lanes"><div><span>查明数据</span><strong>智能问数</strong><p>LLM理解问题，语义层定义口径，SQL工具计算，校验器核对。</p></div><i>→</i><div><span>找出问题</span><strong>风险筛查</strong><p>规则发现确定异常，ML/ANN排序复杂模式。</p></div><i>→</i><div><span>补齐事实</span><strong>Agent取证</strong><p>按证据缺口调用只读工具并保存来源。</p></div><i>→</i><div><span>形成工作产品</span><strong>底稿与报告</strong><p>LLM依据已确认发现起草，校验器与人共同把关。</p></div></div>
            <DeepDive title="展开：六类事项的技术分工"><CaseMatrix /></DeepDive>
          </section>

          <section className="chapter-step"><div className="chapter-step-head"><span>10.3 · 首个场景</span><h3>选择高频、边界清楚、数据可得、结果可复核的窄任务</h3><p>问数从认证指标开始；报告从已确认发现的固定章节开始。</p></div>
            <AuditScenarioSelector />
            <DeepDive title="展开：用六步画布定义自己的第一个审计功能"><AuditAgentCanvas /></DeepDive>
          </section>
          <LessonTakeaway>先定义审计工作产品，再选择规则、模型、工具与Agent。功能不同，架构与控制也不同。</LessonTakeaway>
          <TeacherNote time="5分钟" question="智能问数、风险筛查和报告生成，能否使用同一套提示词直接解决？为什么？" misconception="一个聊天框不等于一个完整审计平台；功能名称相似也不代表数据、控制和交付相同。" mustSay="先定功能和工作产品，再决定规则、模型、工具与Agent。" canSkip="能力矩阵可折叠，但六类功能全景和场景选择不能跳过。" />
        </section>

        <section id="audit-architecture" className="lesson course-slide" hidden={activeCoursePage.id !== "audit-architecture"}>
          <SectionTitle no="11" time="第三部分 · 约7分钟" title="智能问数：从问题到可信数字" />

          <section className="chapter-step"><div className="chapter-step-head"><span>11.1 · 交付标准</span><h3>数字、口径、查询、来源和限制缺一不可</h3><p>期间、组织范围、指标定义和比较方式来自认证口径或用户确认。</p></div>
            <Definition term="智能问数（审计场景）" simple="让审计人员用自然语言提出数据问题，系统在权限和认证口径内完成查询、校验与解释，并返回可以追溯的数字。" precise="核心由问题语义化、指标/维度语义层、元数据检索、权限策略、安全查询生成与执行、结果校验、证据化回答和追问状态共同组成；LLM只负责其中的语言理解、计划与解释。" />
            <div className="ask-data-deliverable"><div><span>Answer</span><strong>数字与简明解释</strong></div><div><span>Definition</span><strong>指标、范围与比较口径</strong></div><div><span>Query</span><strong>可审阅查询或语义计划</strong></div><div><span>Source</span><strong>数据快照、表与字段血缘</strong></div><div><span>Caveat</span><strong>缺失、权限与适用限制</strong></div></div>
          </section>

          <section className="chapter-step"><div className="chapter-step-head"><span>11.2 · 流程与架构</span><h3>口径先于查询，权限先于执行，校验先于回答</h3><p>LLM生成语义计划；受控系统完成权限检查、查询执行和结果复算。</p></div>
            <div className="ask-data-flow"><div><b>01</b><strong>问题受理</strong><p>识别用户、目的与会话上下文。</p></div><i>→</i><div><b>02</b><strong>口径契约</strong><p>期间、主体、指标、比较和币种。</p></div><i>→</i><div><b>03</b><strong>目录与语义层</strong><p>认证指标、维度、关联和数据血缘。</p></div><i>→</i><div><b>04</b><strong>权限检查</strong><p>表、行、列和敏感字段策略。</p></div><i>→</i><div><b>05</b><strong>安全查询</strong><p>只读SQL、白名单、行数和成本限制。</p></div><i>→</i><div><b>06</b><strong>结果校验</strong><p>勾稽、数量级、空值、重复与复算。</p></div><i>→</i><div><b>07</b><strong>证据化回答</strong><p>数字、口径、来源、查询与限制。</p></div></div>
            <div className="ask-data-architecture"><div className="ask-channel"><span>交互层</span><strong>审计问数工作台</strong><p>问题、澄清、追问、结果和导出。</p></div><i>↓</i><div className="ask-orchestrator"><span>理解与编排层</span><strong>LLM + 问数Agent</strong><p>识别意图、补齐契约、检索元数据、生成语义计划；不直接持有数据库权限。</p></div><i>↓</i><div className="ask-control"><span>可信控制层</span><div><b>指标语义层</b><b>权限引擎</b><b>SQL验证器</b><b>结果校验器</b></div></div><i>↓</i><div className="ask-tools"><span>工具与数据层</span><div><b>元数据目录</b><b>只读查询网关</b><b>数据仓库/湖</b><b>查询与血缘日志</b></div></div></div>
          </section>

          <section className="chapter-step"><div className="chapter-step-head"><span>11.3 · 四种处理结果</span><h3>回答、追问、澄清、拒绝</h3><p>系统行为由口径完整性、权限和查询结果决定。</p></div>
            <AskDataLab />
          </section>

          <section className="chapter-step"><div className="chapter-step-head"><span>11.4 · 技术分工</span><h3>LLM处理语言，确定性系统处理数字与权限</h3><p>语言理解可以灵活；查询、计算、校验和留痕必须稳定。</p></div>
            <div className="two-col"><div><strong>LLM / Agent适合</strong><ul><li>识别问题中的指标、维度、时间和比较意图</li><li>发现口径缺失并提出澄清问题</li><li>根据元数据生成语义计划和候选查询</li><li>用审计人员熟悉的语言解释结果</li><li>管理连续追问中的已确认上下文</li></ul></div><div><strong>确定性系统必须负责</strong><ul><li>身份、行列权限和敏感字段阻断</li><li>认证指标口径、关联键和历史组织归属</li><li>只读SQL校验、成本限制和执行</li><li>同比、汇总、抽样复算和勾稽</li><li>数据快照、查询ID、血缘与日志</li></ul></div></div>
          </section>
          <LessonTakeaway>智能问数：自然语言 → 口径契约 → 受控查询 → 结果校验 → 数字、口径、来源与限制。LLM不直接计算审计数字。</LessonTakeaway>
          <TeacherNote time="主线7分钟；完整演示约10分钟" question="用户问“华东最近差旅怎么样”，系统应该立即给数还是先问问题？为什么？" misconception="生成SQL正确不代表口径正确；数据库返回结果也不代表数字已经经过审计校验。" mustSay="智能问数必须能澄清和拒绝；答案至少同时包含数字、口径、来源、查询和限制。" canSkip="时间紧时互动只切换“指标查询”和“口径不清”。" />
        </section>

        <section id="audit-evidence" className="lesson course-slide" hidden={activeCoursePage.id !== "audit-evidence"}>
          <SectionTitle no="12" time="第三部分 · 约7分钟" title="智能生成审计报告：从发现到草稿" />

          <section className="chapter-step"><div className="chapter-step-head"><span>12.1 · 输入</span><h3>报告起草从已确认、已冻结的发现开始</h3><p>输入来自发现登记库、证据库、管理层回应和报告模板。</p></div>
            <div className="report-input-contract"><div><span>范围与方法</span><strong>审计对象、期间、目标和程序</strong></div><div><span>冻结发现</span><strong>事实、标准、原因、影响、建议</strong></div><div><span>证据引用</span><strong>证据ID、来源、版本和复核状态</strong></div><div><span>管理层回应</span><strong>回应原文、责任人和整改日期</strong></div><div><span>报告规范</span><strong>模板、语气、评级规则和审批流程</strong></div></div>
            <div className="report-prohibited"><strong>模型不得自行补写</strong><span>未确认原因</span><span>未量化影响</span><span>风险评级</span><span>管理层回应</span><span>审计结论</span></div>
          </section>

          <section className="chapter-step"><div className="chapter-step-head"><span>12.2 · 流程</span><h3>先冻结和检查，再起草和校验，最后人工审批</h3><p>每个节点保留输入版本、处理状态与责任人。</p></div>
            <div className="report-flow"><div><b>01</b><strong>冻结发现</strong><p>锁定本轮发现与证据版本。</p></div><i>→</i><div><b>02</b><strong>完整性检查</strong><p>事实、标准、原因、影响、回应。</p></div><i>→</i><div><b>03</b><strong>生成提纲</strong><p>按主题、重要性和模板编排。</p></div><i>→</i><div><b>04</b><strong>分节起草</strong><p>严格引用发现字段，不扩写事实。</p></div><i>→</i><div><b>05</b><strong>引用绑定</strong><p>每个事实句连接证据ID。</p></div><i>→</i><div><b>06</b><strong>一致性校验</strong><p>金额、数量、名称、评级与图表。</p></div><i>→</i><div><b>07</b><strong>人工审阅</strong><p>逐句确认、修订、退回和批准。</p></div><i>→</i><div><b>08</b><strong>渲染归档</strong><p>模板输出、版本、签署和留痕。</p></div></div>
          </section>

          <section className="chapter-step"><div className="chapter-step-head"><span>12.3 · 架构</span><h3>可信输入 → 生成编排 → 校验审批 → 受控输出</h3><p>LLM只负责提纲与表达；事实、数字、引用和批准由外部系统控制。</p></div>
            <div className="report-architecture"><div className="report-source"><span>可信输入层</span><div><b>发现登记库</b><b>证据对象库</b><b>制度与模板</b><b>管理层回应</b></div><p>只读取已批准版本；每个对象都有ID、状态和责任人。</p></div><i>↓</i><div className="report-orchestration"><span>生成编排层</span><div><b>完整性门</b><b>提纲规划</b><b>LLM分节起草</b><b>引用绑定</b></div><p>提示模板固定，生成范围受发现字段约束，缺失字段保留占位符。</p></div><i>↓</i><div className="report-validation"><span>校验与审批层</span><div><b>数字勾稽</b><b>事实引用</b><b>术语/评级规则</b><b>人工审批流</b></div><p>校验不通过即阻断；人批准后才交给文档渲染与归档。</p></div><i>↓</i><div className="report-output"><span>受控输出层</span><div><b>报告草稿</b><b>图表附件</b><b>修订对比</b><b>正式归档件</b></div></div></div>
          </section>

          <section className="chapter-step"><div className="chapter-step-head"><span>12.4 · 三种处理结果</span><h3>证据完整则起草，字段缺失则留空，数字冲突则阻断</h3><p>质量门先于文字生成。</p></div>
            <ReportGenerationLab />
          </section>

          <section className="chapter-step"><div className="chapter-step-head"><span>12.5 · 人机责任</span><h3>模型起草，审计人员评价证据并签发</h3><p>报告草稿引用底稿；模型生成文字不能成为底稿证据。</p></div>
            <AuditResponsibilityLab />
            <div className="working-paper-flow"><div><span>证据与底稿</span><strong>审计人员确认的事实基础</strong><p>证据包、程序结果、访谈记录和发现登记。</p></div><i>→</i><div><span>机器草稿</span><strong>带引用、带缺口、可比较</strong><p>保留模型、提示、输入版本和生成时间。</p></div><i>→</i><div><span>正式报告</span><strong>逐句复核并履行审批</strong><p>报告责任不转移给模型或系统。</p></div></div>
            <div className="reproducibility-check"><strong>必须保留</strong><span>发现冻结版本</span><span>证据ID与引用</span><span>模型和提示版本</span><span>校验结果</span><span>人工修订与批准记录</span></div>
          </section>
          <LessonTakeaway>智能报告生成是基于已确认发现的受控起草。缺失不补写、冲突要阻断、评级与签发由审计人员负责。</LessonTakeaway>
          <TeacherNote time="主线7分钟；完整演示约10分钟" question="原因尚未取得时，模型应该根据经验补一段合理原因吗？数字冲突时能否选择多数来源？" misconception="语言通顺不等于发现完整；引用存在不等于证据充分；自动排版也不等于自动签发。" mustSay="上游必须是冻结发现库；缺失留占位、冲突要阻断；评级与最终责任由人。" canSkip="时间紧时人机责任互动只查看“证据评价”和“定性与报告”。" />
        </section>

        <section id="audit-rollout" className="lesson course-slide" hidden={activeCoursePage.id !== "audit-rollout"}>
          <SectionTitle no="13" time="第三部分 · 约6分钟" title="共性底座、治理与上线" />

          <section className="chapter-step"><div className="chapter-step-head"><span>13.1 · 六层底座</span><h3>不同功能共享数据、工具、模型、编排、证据和应用层</h3><p>指标口径、身份权限、对象ID和运行日志在平台内统一管理。</p></div>
            <div className="audit-layer-stack"><div><b>06</b><strong>审计应用层</strong><p>智能问数、风险筛查、取证、底稿、报告与监控。</p></div><div><b>05</b><strong>工作产品与证据层</strong><p>问数答案、疑点证据包、发现登记、底稿与报告版本。</p></div><div><b>04</b><strong>Agent与工作流编排层</strong><p>目标、状态、任务、行动、审批、停止、预算与升级。</p></div><div><b>03</b><strong>规则与模型能力层</strong><p>指标语义、规则、ML、ANN、LLM、RAG和确定性校验。</p></div><div><b>02</b><strong>受控工具与安全层</strong><p>查询网关、文档检索、权限、脱敏、日志、监控和回滚。</p></div><div><b>01</b><strong>数据、制度与模板来源层</strong><p>业务系统、数据仓库、原始凭证、制度、底稿与报告模板。</p></div></div>
            <AuditEvidenceMap />
          </section>

          <section className="chapter-step"><div className="chapter-step-head"><span>13.2 · 统一证据链</span><h3>数据快照、问数结果、证据、发现和报告逐级关联</h3><p>每个对象记录ID、版本、状态和责任人。</p></div>
            <div className="evidence-lineage"><div><span>数据快照</span><strong>D-20260715</strong><p>原始表、时间、口径</p></div><i>→</i><div><span>问数结果</span><strong>Q-AQ042</strong><p>查询、数字、校验</p></div><i>→</i><div><span>证据对象</span><strong>E-17 / E-18</strong><p>来源、关联、状态</p></div><i>→</i><div><span>审计发现</span><strong>F-TRAVEL-03</strong><p>事实、标准、原因、影响</p></div><i>→</i><div><span>报告段落</span><strong>R-2.3-v4</strong><p>引用、修订、批准</p></div></div>
            <DeepDive title="展开：检查BX-42017的五字段证据包"><EvidencePackageLab /></DeepDive>
          </section>

          <section className="chapter-step"><div className="chapter-step-head"><span>13.3 · 治理</span><h3>控制模型、数据、工具、证据与签发风险</h3><p>权限、来源和责任边界写入系统与流程。</p></div>
            <div className="audit-governance-grid"><div><span>风险01</span><strong>提示注入</strong><p>票据或外部文档可能夹带“忽略规则”等恶意指令；业务材料只能作为数据，不能覆盖系统策略。</p></div><div><span>风险02</span><strong>隐私与保密</strong><p>最小化传输、字段脱敏、环境隔离、留存周期和模型供应商条款必须明确。</p></div><div><span>风险03</span><strong>越权工具</strong><p>工具白名单、最小权限和人工审批必须由编排器强制执行，不能只写在提示词里。</p></div><div><span>风险04</span><strong>事实幻觉</strong><p>模型生成内容不得冒充工具结果；证据字段只接受可追溯来源。</p></div><div><span>风险05</span><strong>职责混淆</strong><p>开发、运行、复核与批准角色分离；重大判断保留明确责任人。</p></div><div><span>风险06</span><strong>版本与漂移</strong><p>记录模型、提示、制度和数据版本；变更后重新评价，不默认为持续有效。</p></div></div>
          </section>

          <section className="chapter-step"><div className="chapter-step-head"><span>13.4 · 评价</span><h3>问数评价口径与数字，报告评价忠实度与引用</h3><p>每项功能分别设置质量、风险、效率和人工接管指标。</p></div>
            <div className="feature-evaluation"><div><span>智能问数</span><ul><li>问题理解与澄清正确率</li><li>指标口径选择正确率</li><li>SQL安全与执行成功率</li><li>数字复算一致率</li><li>来源/查询可追溯率</li><li>越权请求阻断率</li></ul></div><div><span>智能报告</span><ul><li>对冻结发现的忠实度</li><li>事实句引用覆盖率</li><li>数字与图表一致率</li><li>缺失字段保留率</li><li>人工修改与退回率</li><li>误生成/误签发事件</li></ul></div><div><span>共同经营指标</span><ul><li>处理时长与单任务成本</li><li>人工节省与接管率</li><li>用户满意与实际采用率</li><li>稳定性和系统可用性</li><li>安全、隐私与权限事件</li><li>模型/口径漂移告警</li></ul></div></div>
            <AuditEvaluationLab />
          </section>

          <section className="chapter-step"><div className="chapter-step-head"><span>13.5 · 最小可行试点</span><h3>限定数据、指标、模板、权限和交付</h3><p>范围小到可以逐条验证，同时保留真实业务价值。</p></div>
            <div className="audit-mvp-blueprints"><div><span>MVP A · 智能问数</span><h4>差旅费认证指标问答</h4><dl><dt>范围</dt><dd>一个审计主题；已认证的金额、笔数、同比、预算偏差等指标；期间、主体、部门、费用类型等有限维度。</dd><dt>能力</dt><dd>口径澄清、汇总问数、连续追问、来源与查询展示、CSV结果导出。</dd><dt>暂不做</dt><dd>任意明细查询、高敏个人信息、写回业务系统、跨域任意SQL。</dd><dt>放行门槛</dt><dd>基准问题逐项复算通过；权限阻断无遗漏；答案均有口径、来源和查询ID。</dd></dl></div><div><span>MVP B · 智能报告</span><h4>已确认发现的章节草稿</h4><dl><dt>范围</dt><dd>一种报告模板；仅使用状态为“已复核”的发现、证据引用和管理层回应。</dd><dt>能力</dt><dd>完整性检查、提纲编排、分节起草、引用绑定、数字校验、修订对比和Word草稿。</dd><dt>暂不做</dt><dd>自动发现、自动原因分析、自动评级、自动采纳回应、自动签发。</dd><dt>放行门槛</dt><dd>事实句均可回到发现与证据；冲突全部阻断；缺失不被补写；人工批准链完整。</dd></dl></div></div>
          </section>

          <section className="chapter-step"><div className="chapter-step-head"><span>13.6 · 责任</span><h3>审计、流程、数据、技术和安全共同建设</h3><p>指标定义、数据质量、工具运行、上线审批和事故处置均有明确责任人。</p></div>
            <div className="audit-ownership-grid"><div><span>审计负责人</span><strong>目标与最终责任</strong><p>定义交付、判断标准、人工关口并批准使用。</p></div><div><span>产品 / 流程负责人</span><strong>需求与运营</strong><p>把审计任务转成流程、指标、反馈和版本计划。</p></div><div><span>数据负责人</span><strong>来源与质量</strong><p>授权、口径、关联键、更新、留存和异常修复。</p></div><div><span>技术与模型团队</span><strong>能力与工程</strong><p>模型、工具、编排、测试、监控与回滚。</p></div><div><span>安全与合规</span><strong>独立控制</strong><p>权限、隐私、供应商、攻击测试和事件处置。</p></div></div>
          </section>

          <LessonTakeaway>统一底座连接问数、证据、发现、底稿与报告；先证明结果正确且可回查，再证明效率，最后扩大范围。</LessonTakeaway>

          <div className="summary-chain">{stages.map((s, i) => <div key={s.key}><span>0{i + 1}</span><strong>{s.name}</strong><p>{s.question}</p><small>{s.ability}</small></div>)}</div>
          <Quiz />
          <div className="closing"><p>规则、ML、ANN、LLM与Agent不是替代关系，而是一套可以被审计目标和证据标准组织起来的能力栈。</p><h3>让机器扩大覆盖、完成比对和受控取证；<br />让审计人员负责证据评价、沟通、定性与责任。</h3><div><span>目标明确</span><span>权限可控</span><span>过程留痕</span><span>证据可查</span><span>结论可复核</span></div></div>
          <TeacherNote time="主线6分钟；完整展开约9分钟" question="智能问数算出的数字，怎样沿证据链进入一条发现，再进入报告段落？中间哪些节点必须由人确认？" misconception="共用模型不等于共用底座；试点成功也不等于可以自动扩围。" mustSay="统一对象ID和版本贯穿问数、证据、发现、底稿和报告；分功能评价，四阶段上线。" canSkip="责任分工可快速带过，但证据链、治理风险和分功能指标不能省。" />
        </section>

        <footer hidden={activeCoursePage.id !== "audit-rollout"}><strong>LLM 与 Agent：基础、架构及审计应用</strong><span>从问题出发的能力链：规则 → ML → ANN → LLM → Agent</span><button type="button" onClick={() => goToPage(0)}>回到首页 ↑</button></footer>
      </div>
      <CoursePager activeIndex={activePage} onChange={goToPage} />
    </main>
  </PythonKernelProvider>;
}
