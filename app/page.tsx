"use client";

import { createContext, Fragment, useCallback, useContext, useEffect, useRef, useState } from "react";
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
import { AnnToLlmJourney } from "./ann-to-llm-journey";
import {
  AgentArchitectureMap,
  AgentLoopSimulator,
  AgentPartRoute,
  AgentTypeSwitcher,
  CombinedContractCaseLab,
  PlanningAdjustmentLab,
} from "./agent-lecture-journey";
import {
  AuditApplicationRoute,
  AuditChainChallenge,
  AuditCollaborationLab,
  AuditDesignWorkbench,
  AuditGovernanceDashboard,
  DocumentParsingLab,
  EvidenceConflictBoard,
  ReportArchitectureBoard,
  ReportGenerationStudio,
  SecureQueryLab,
} from "./audit-application-journey";
import {
  FoundationChapterRoute,
} from "./agent-audit-interactives";
import { CrossEntropyPlot, SigmoidPlot } from "./math-plots";
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
  { key: "ml", name: "特征拟合（机器学习）", question: "它像不像历史异常？", ability: "用少量人工特征拟合历史规律", limit: "特征靠人设计；看不见原始像素与长文本", sees: "表格特征组合" },
  { key: "nn", name: "人工神经网络", question: "高维原始输入里有什么？", ability: "在超多特征上自动学习表示", limit: "识别内容不等于理解制度与业务", sees: "像素、波形等高维信号" },
  { key: "llm", name: "大语言模型", question: "我真正想问什么，又该如何权衡？", ability: "在语言序列上做大规模神经网络预测与生成", limit: "可能幻觉；不会天然访问业务系统", sees: "问题背景、目标、顾虑与对话历史" },
  { key: "agent", name: "智能体 + 大语言模型", question: "下一步该调用什么、如何停？", ability: "用大语言模型决策，用工具行动，用状态闭环", limit: "必须受权限、证据和人工复核约束", sees: "目标、工具结果与运行状态" },
];

const nav = [
  ["problem", "导言", "5′"],
  ["code", "基于任务逻辑的编程", "8′"],
  ["ml", "经典机器学习", "10′"],
  ["nn", "神经网络", "15′"],
  ["llm", "从神经网络到大语言模型", "27′"],
  ["agent", "为什么仅有大语言模型还不够", "5′"],
  ["agent-definition", "什么是智能体", "6′"],
  ["agent-loop", "智能体是怎样工作的", "7′"],
  ["agent-knowledge", "知识型智能体", "5′"],
  ["agent-task", "任务型智能体", "5′"],
  ["agent-planning", "规划型智能体", "7′"],
  ["agent-case", "完整组合应用", "7′"],
  ["agent-value", "价值与边界", "5′"],
  ["audit", "从审计工作链理解三个智能体", "6′"],
  ["audit-documents", "异构审计资料解析", "12′"],
  ["audit-data", "智能问数与数据分析", "12′"],
  ["audit-report", "智能生成审计报告", "15′"],
  ["audit-collaboration", "三个智能体协作系统", "7′"],
  ["audit-governance", "效果、评估与治理", "8′"],
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
  { id: "nn", title: "神经网络", group: "foundation", label: "04" },
  { id: "llm", title: "从神经网络到大语言模型", group: "foundation", label: "05" },
  { id: "part-2", title: "智能体基础与架构路线", group: "agent", label: "第二部分" },
  { id: "agent", title: "为什么仅有大语言模型还不够", group: "agent", label: "06" },
  { id: "agent-definition", title: "什么是智能体", group: "agent", label: "07" },
  { id: "agent-loop", title: "智能体是怎样工作的", group: "agent", label: "08" },
  { id: "agent-knowledge", title: "知识型智能体", group: "agent", label: "09" },
  { id: "agent-task", title: "任务型智能体", group: "agent", label: "10" },
  { id: "agent-planning", title: "规划型智能体", group: "agent", label: "11" },
  { id: "agent-case", title: "完整组合应用", group: "agent", label: "12" },
  { id: "agent-value", title: "价值与边界", group: "agent", label: "13" },
  { id: "part-3", title: "审计应用路线", group: "audit", label: "第三部分" },
  { id: "audit", title: "从审计工作链理解三个智能体", group: "audit", label: "14" },
  { id: "audit-documents", title: "异构审计资料解析", group: "audit", label: "15" },
  { id: "audit-data", title: "智能问数与数据分析", group: "audit", label: "16" },
  { id: "audit-report", title: "智能生成审计报告", group: "audit", label: "17" },
  { id: "audit-collaboration", title: "三个智能体协作系统", group: "audit", label: "18" },
  { id: "audit-governance", title: "效果、评估与治理", group: "audit", label: "19" },
];

const courseParts = [
  {
    no: "第一部分",
    title: "大模型和智能体的技术基础",
    range: "02—05",
    href: "#part-1",
    description: "从问题出发，讲清规则、机器学习、神经网络和大语言模型为什么逐层出现。",
  },
  {
    no: "第二部分 · 核心",
    title: "智能体基础与架构",
    range: "06—13",
    href: "#part-2",
    description: "从行动缺口出发，讲清系统结构、运行循环、三类智能体、组合应用与治理边界。",
  },
  {
    no: "第三部分 · 核心",
    title: "智能体在审计中的应用",
    range: "14—19",
    href: "#part-3",
    description: "用资料解析、智能问数和报告生成三个案例，串起审计证据、权限、协作与治理。",
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

function Header({ progressOverride, onHome, sidebarOpen, onToggleSidebar }: { progressOverride?: number; onHome?: () => void; sidebarOpen?: boolean; onToggleSidebar?: () => void }) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const onScroll = () => {
      const total = document.documentElement.scrollHeight - innerHeight;
      setProgress(total ? Math.round(scrollY / total * 100) : 0);
    };
    onScroll(); addEventListener("scroll", onScroll, { passive: true });
    return () => removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header className="topbar">
      <a href="#top" className="brand" onClick={onHome ? (event) => { event.preventDefault(); onHome(); } : undefined}>大语言模型 · 智能体 · 审计应用</a>
      <div className="top-progress"><i style={{ width: `${progressOverride ?? progress}%` }} /></div>
      <div className="top-actions">
        {onToggleSidebar && <button className="sidebar-toggle" type="button" onClick={onToggleSidebar} aria-expanded={sidebarOpen} aria-controls="course-sidebar"><span aria-hidden="true">☰</span><b>{sidebarOpen ? "隐藏侧栏" : "显示侧栏"}</b></button>}
        <button onClick={() => document.fullscreenElement ? document.exitFullscreen() : document.documentElement.requestFullscreen?.()}>全屏</button>
      </div>
    </header>
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
  { file: "customer_visits.csv", label: "客户关系管理系统拜访记录", count: "6条", key: "trip_id", role: "用于验证声称的客户、商务目的和联系人状态。", columns: ["trip_id", "employee", "city", "visit_status", "contact"], rows: [["T1004", "E1001", "杭州", "已完成", "在岗"], ["T2017", "E1004", "苏州", "无登记", "休假"], ["T2025", "E1001", "上海", "无登记", "休假"]] },
  { file: "receipt_ocr.csv", label: "票据光学字符识别与图像检查", count: "7条", key: "claim_id", role: "表示从票据图片中提取的文字、金额、二维码结果、明细和图像完整性分数。", columns: ["claim_id", "printed", "二维码", "integrity", "items"], rows: [["BX-42306", "286", "86", "96%", "数字2字体异常"], ["BX-42519", "988", "988", "3%", "儿童套餐|生日蛋糕"], ["BX-42017", "468", "468", "1%", "运输服务"]] },
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
        <span>为何使用机器学习</span>
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
      </div>
    </div>
  );
}

function LlmChapterRoute() {
  const steps = [
    ["01", "为什么需要它", "先把“能讨论、能接住追问”的需求说清楚"],
    ["02", "它到底是什么", "再看一条相关回应怎样由下一 Token 预测生成"],
    ["03", "具体怎样构造", "打开黑箱：文字怎样进入 Transformer 并联系上下文"],
    ["04", "怎样完成预训练", "解释这种能力怎样从原始文本和误差修正中长出来"],
    ["05", "模型长什么样", "训练结束后，能力怎样留在可加载的文件与权重中"],
    ["06", "怎样多轮交互", "回到应用：怎样把历史组织成 messages 继续对话"],
    ["07", "会什么、不会什么", "最后划清相关反馈、事实正确与实际行动的边界"],
  ];
  return (
    <div className="llm-route" aria-label="本章七步学习路线">
      <div className="llm-route-head"><span>本章路线</span><strong>沿着同一个问题，从对话需求追到模型内部，再回到对话界面</strong></div>
      <div>{steps.map(([no, title, detail]) => <article key={no}><b>{no}</b><strong>{title}</strong><p>{detail}</p></article>)}</div>
    </div>
  );
}

function LlmConstructionExplorer() {
  const [selected, setSelected] = useState(0);
  const parts = [
    { name: "Tokenizer", shape: "文本 → input_ids [B, T]", role: "使用词表和切分规则把文字变成 Token 编号。", question: "“这份报告还缺两处证据”先被切成可计算的离散符号。" },
    { name: "Token + Position Embedding", shape: "[B, T] → [B, T, d]", role: "一张可训练向量表表示 Token，另一张表示先后位置。", question: "同一个词在不同位置会得到不同的组合表示。" },
    { name: "Decoder Block × N", shape: "[B, T, d] → [B, T, d]", role: "Masked Self-Attention 联系已出现的上下文，前馈神经网络在每个位置继续变换表示。", question: "追问中的“其中一处”可以回看前文的“两处证据”，不能看未来 Token。" },
    { name: "最终归一化层 + 语言模型输出层", shape: "[B, T, d] → [B, T, |V|]", role: "把每个位置的隐藏向量投影成整个词表的候选分数 logits。", question: "最后一个位置可能给“证据”“待补充”“需要”等 Token 不同分数。" },
  ];
  const item = parts[selected];
  return (
    <div className="llm-construction-explorer">
      <div className="construction-head"><div><span>构造图 · 仅解码器大语言模型</span><h3>一个能继续对话的大语言模型，运行时由哪些部件接起来？</h3></div><small>点击部件查看形状与职责</small></div>
      <div className="construction-parts">{parts.map((part, index) => <button type="button" key={part.name} className={selected === index ? "active" : ""} onClick={() => setSelected(index)}><b>{String(index + 1).padStart(2, "0")}</b><strong>{part.name}</strong></button>)}</div>
      <div className="construction-detail"><div><span>当前部件</span><h4>{item.name}</h4><code>{item.shape}</code></div><div><span>它负责什么</span><p>{item.role}</p></div><div><span>回到本章问题</span><p>{item.question}</p></div></div>
      <div className="construction-equation"><code>输入编号 → Embedding → Decoder Blocks × N → 语言模型输出层 → 下一个 Token 候选分数</code><b>模型选出一个 Token，追加到上文，再重复这条通路</b></div>
    </div>
  );
}

function Gpt2PretrainingLab() {
  const [stage, setStage] = useState(0);
  const stages = [
    {
      label: "01 加载小模型",
      title: "先把一个真实 GPT-2 检查点加载到内存",
      code: `from transformers import AutoTokenizer, AutoModelForCausalLM

MODEL_ID = "sshleifer/tiny-gpt2"
tokenizer = AutoTokenizer.from_pretrained(MODEL_ID)
tokenizer.pad_token = tokenizer.eos_token
model = AutoModelForCausalLM.from_pretrained(MODEL_ID)

print(model)
print("parameters =", sum(p.numel() for p in model.parameters()))`,
      output: `GPT2LMHeadModel(
  transformer.wte: [50257, 2]
  transformer.wpe: [1024, 2]
  transformer.h: 2 个 GPT2Block
  transformer.ln_f
  lm_head: [50257, 2]
)
parameters = 102714`,
      note: "tiny-gpt2 故意把隐藏维度压到 2，便于快速看清加载、前向、Loss 和保存流程；它不代表可用的中文对话质量。",
    },
    {
      label: "02 准备原始文本",
      title: "预训练不需要人工类别标签，文本自己提供下一 Token 答案",
      code: `from datasets import Dataset
from transformers import DataCollatorForLanguageModeling

texts = [
  "A report draft is missing two pieces of evidence.",
  "Unknown information must be marked as pending, not invented.",
  "In dialogue, pronouns must be understood from earlier context.",
  "A useful answer should distinguish known facts from assumptions.",
] * 64

dataset = Dataset.from_dict({"text": texts})
tokenized = dataset.map(
  lambda batch: tokenizer(batch["text"], truncation=True, max_length=128),
  batched=True, remove_columns=["text"]
)
collator = DataCollatorForLanguageModeling(
  tokenizer=tokenizer, mlm=False
)`,
      output: `input_ids: [A, report, draft, is, missing, ...]
labels:    [A, report, draft, is, missing, ...]

模型内部比较：
A → report
report → draft
draft → is
...`,
      note: "`mlm=False` 表示因果语言建模。labels 在表面上与 input_ids 相同，GPT2LMHeadModel 计算 Loss 时会在内部错开一位。",
    },
    {
      label: "03 选择训练起点",
      title: "从随机权重开始叫从零预训练；从现有检查点开始叫继续预训练",
      code: `from transformers import GPT2Config, GPT2LMHeadModel

# A. 教学用：随机初始化，从零预训练
scratch_config = GPT2Config(
  vocab_size=tokenizer.vocab_size,
  n_positions=128, n_ctx=128,
  n_embd=64, n_layer=2, n_head=2,
)
scratch_model = GPT2LMHeadModel(scratch_config)

# B. 实用常见：从 tiny-gpt2 权重继续预训练
continued_model = AutoModelForCausalLM.from_pretrained(MODEL_ID)

# 本例选 B：展示“已学会一些语言 → 再学本领域文本”
model = continued_model`,
      output: `A. scratch_model
   权重：随机数
   需要：大量语料与训练算力

B. continued_model
   权重：已预训练检查点
   需要：更小学习率、领域语料与独立评估`,
      note: "几句话只能让课堂看到训练机制，不可能从零训出可对话的模型。这个区分必须在课上明说。",
    },
    {
      label: "04 运行继续预训练",
      title: "Trainer 只是把同一个训练循环工程化",
      code: `from transformers import TrainingArguments, Trainer

args = TrainingArguments(
  output_dir="discussion-tiny-gpt2",
  num_train_epochs=3,
  per_device_train_batch_size=8,
  learning_rate=5e-5,
  weight_decay=0.01,
  logging_steps=5,
  save_strategy="epoch",
  report_to="none",
)

trainer = Trainer(
  model=model,
  args=args,
  train_dataset=tokenized,
  data_collator=collator,
  processing_class=tokenizer,
)
trainer.train()
trainer.save_model("discussion-tiny-gpt2")
tokenizer.save_pretrained("discussion-tiny-gpt2")`,
      output: `每一批都在做：
1. input_ids 进入 GPT-2
2. 语言模型输出层生成全词表候选分数
3. 错一位 labels 计算交叉熵 Loss
4. loss.backward() 求梯度
5. optimizer.step() 更新权重
6. 定期评估并保存 checkpoint`,
      note: "训练 Loss 下降只说明更贴近这批语料。还要使用未参与训练的验证集检查过拟合、能力退化与不安全输出。",
    },
    {
      label: "05 训练后生成",
      title: "加载新检查点，再用同一套下一 Token 机制生成",
      code: `prompt = "Question: A report is missing evidence. What should I do?\nAnswer:"
inputs = tokenizer(prompt, return_tensors="pt")

output_ids = model.generate(
  **inputs,
  max_new_tokens=40,
  do_sample=True,
  temperature=0.8,
  top_p=0.9,
  pad_token_id=tokenizer.eos_token_id,
)
print(tokenizer.decode(output_ids[0], skip_special_tokens=True))`,
      output: `输入 prompt
  ↓ Tokenizer
input_ids
  ↓ GPT-2 反复前向计算
next token → 追加 → next token → …
  ↓ decode
生成文本`,
      note: "tiny-gpt2 的输出可能不连贯，因为它是极小测试模型。本例要验证的是“加载—训练—保存—再加载—生成”链路，不是结果的语言水平。",
    },
  ];
  const current = stages[stage];
  return (
    <div className="gpt2-pretraining-lab">
      <div className="gpt2-lab-head"><div><span>真实代码案例 · GPT-2</span><h3>用 102,714 参数的 tiny-gpt2 看完整训练链</h3><p>小模型用于看清机制；高质量对话能力来自更大模型、更大语料和后续对齐。</p></div><div><b>2</b><span>Transformer Blocks</span><b>2</b><span>Hidden Size</span><b>50,257</b><span>Vocabulary</span></div></div>
      <div className="gpt2-stage-tabs">{stages.map((item, index) => <button type="button" key={item.label} className={stage === index ? "active" : ""} onClick={() => setStage(index)}>{item.label}</button>)}</div>
      <div className="gpt2-workbench">
        <div><span>Python · 需本地/Colab 的 PyTorch 环境</span><pre>{current.code}</pre></div>
        <aside><span>运行时会看到什么</span><h4>{current.title}</h4><pre>{current.output}</pre><p>{current.note}</p></aside>
      </div>
      <div className="gpt2-lab-foot"><strong>为什么不直接在课件浏览器内运行？</strong><p>这段真实 Transformers 代码需要下载检查点并使用 PyTorch；课件内置的 Python 环境保持轻量和离线。下方可运行的 NumPy 微型模型用于现场观察 Loss 和权重更新；两者分工而不冒充。</p><div><a href="https://huggingface.co/sshleifer/tiny-gpt2" target="_blank" rel="noreferrer">tiny-gpt2 模型文件 ↗</a><a href="https://huggingface.co/docs/transformers/tasks/language_modeling" target="_blank" rel="noreferrer">因果语言建模指南 ↗</a></div></div>
    </div>
  );
}

function LlmTrainingWorkbench() {
  const [stage, setStage] = useState(0);
  const states = [
    { name: "随机初始化", batch: "epoch 0", loss: "3.69", target: "证据", top: "40 个候选接近均匀", note: "权重还是随机数，模型几乎在乱猜。" },
    { name: "训练开始", batch: "epoch 10", loss: "3.24", target: "证据", top: "正确 Token 的概率开始上升", note: "反向传播已经改变参数，但预测仍不稳定。" },
    { name: "训练进行中", batch: "epoch 150", loss: "0.59", target: "证据", top: "正确序列已成为高概率候选", note: "总体 Loss 明显下降，但仍需独立评估。" },
    { name: "形成检查点", batch: "epoch 300", loss: "0.34", target: "证据", top: "参数固定，可用于新输入推理", note: "保存结构、Tokenizer 与训练后的参数；推理时不再改权重。" },
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
        <div><span>训练样本</span><code>报告草稿还缺两处 → ?</code><p>真实答案：<b>{current.target}</b></p></div>
        <div><span>模型当前预测</span><strong>{current.top}</strong><p>{current.note}</p></div>
        <div className="loss-meter"><span>总体 Loss</span><strong>{current.loss}</strong><i><b style={{ width: `${18 + (states.length - 1 - stage) * 24}%` }} /></i><small>Loss 下降只说明更贴近训练目标，不自动证明事实可靠。</small></div>
      </div>
      <p className="training-workbench-footnote">Loss 数值与下方 Python 教学模型的训练日志保持一致；候选文字用于解释方向，不代表真实生产模型概率。</p>
    </div>
  );
}

function LlmCallLab() {
  const [step, setStep] = useState(0);
  const [turn, setTurn] = useState<1 | 2>(1);
  const steps = [
    { title: "应用组织 messages", body: "system 规定回答方式；user 放问题；assistant 的上一轮回答也必须放回历史，后续追问才有可参考的前文。" },
    { title: "发送一次请求", body: "应用通过加密网络连接把模型名、messages 和生成参数发给推理服务。密钥应保存在后端，不应写进静态网页代码。" },
    { title: "服务执行推理", body: "服务加载检查点，Tokenizer 编码文字，Transformer 反复预测下一个 Token；推理阶段通常不更新权重。" },
    { title: "返回并记入历史", body: "服务返回文本、Token 用量和停止原因。应用显示结果，并在下一轮将这段 assistant 回答与新 user 追问一起重新提交。" },
  ];
  const systemMessage = "根据对话上下文回答；区分已知事实与待补充信息。";
  const firstQuestion = "报告草稿还缺两处证据。我应该先做什么？";
  const firstAnswer = "先确认缺失的是哪两处证据，并补齐可取得的材料；不要把尚未证实的信息写入草稿。";
  const followUp = "如果其中一处暂时拿不到呢？";
  const followUpAnswer = "把它明确标记为待补充，并说明对结论的影响；可完成其余部分，但不能把假设当成事实。";
  const messages = [
    { role: "system", content: systemMessage },
    { role: "user", content: firstQuestion },
    ...(turn === 2 ? [{ role: "assistant", content: firstAnswer }, { role: "user", content: followUp }] : []),
  ];
  const currentAnswer = turn === 1 ? firstAnswer : followUpAnswer;
  const request = JSON.stringify({ model: "enterprise-llm", messages, temperature: 0.2, max_output_tokens: 300 }, null, 2);
  const response = JSON.stringify({ output_text: currentAnswer, usage: { input_tokens: turn === 1 ? 76 : 151, output_tokens: turn === 1 ? 62 : 49 }, stop_reason: "end" }, null, 2);
  return (
    <div className="llm-call-lab">
      <div className="llm-call-head"><div><span>互动 · 两轮真实对话</span><h3>模型不会“自动记住”：应用要把对话历史重新放进 messages</h3></div><div><button type="button" className={turn === 1 ? "primary" : ""} onClick={() => { setTurn(1); setStep(0); }}>第一轮</button><button type="button" className={turn === 2 ? "primary" : ""} onClick={() => { setTurn(2); setStep(3); }}>加入追问 →</button></div></div>
      <div className="llm-call-steps">{steps.map((item, i) => <button type="button" key={item.title} className={step === i ? "active" : ""} onClick={() => setStep(i)}><b>0{i + 1}</b><strong>{item.title}</strong></button>)}</div>
      <div className="llm-call-detail"><span>当前步骤</span><h4>{steps[step].title}</h4><p>{steps[step].body}</p></div>
      <div className="llm-chat-transcript">
        <div className="user"><span>user · 第一轮</span><p>{firstQuestion}</p></div>
        <div className="assistant"><span>assistant</span><p>{firstAnswer}</p></div>
        {turn === 2 && <><div className="user"><span>user · 追问</span><p>{followUp}</p></div><div className="assistant"><span>assistant · 针对前文继续</span><p>{followUpAnswer}</p></div></>}
      </div>
      <div className="llm-call-payloads">
        <div><span>请求 Request · 当前是第 {turn} 轮</span><pre>{request}</pre></div>
        <i>加密网络连接 →</i>
        <div className="returned"><span>响应 Response</span><pre>{response}</pre></div>
      </div>
      <p className="llm-call-note"><b>记忆的工程真相：</b>大多数调用是无状态的。第二轮之所以能理解“其中一处”指向什么，是因为程序重新发送了 system 要求、第一轮 user 问题、第一轮 assistant 回答和新的 user 追问。</p>
    </div>
  );
}

// 备用详稿：保留供课后展开；当前 Home 的 05 使用 AnnToLlmJourney。
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function LlmContextDemo() {
  return (
    <div className="task-logic-demo llm-lesson-rich">
      <p className="task-logic-problem">
        <span>现在的问题</span>
        如何让大模型具备理解语义和连续对话的功能？
        这一章不讨论某个具体业务决策，而是追踪：模型怎样把文字和对话历史变成上下文，并据此生成相关回应。
      </p>

      <LlmChapterRoute />
      <div className="llm-memory-line"><strong>本章只追一条线</strong><code>语义与对话功能 → 根据上文生成 → 文字进入 Transformer → 训练与保存 → 多轮 messages → 能力边界</code></div>

      <section className="llm-step-section">
        <div className="llm-step-title"><span>5.1 · 为什么需要它</span><h3>先把问题说清楚：怎样让模型联系语义，并接住后一句话</h3><p>固定分类器只能把固定输入映射为固定标签；语义理解与对话要求模型联系词语关系、句子顺序和此前说过的内容，再生成开放回应。</p></div>
        <AnnToLlmGapDiagram />
        <div className="llm-memory-line"><strong>本节必须记住</strong><code>专用神经网络：固定特征 → 固定答案　｜　讨论型任务：可变上下文 → 开放反馈</code></div>
      </section>

      <section className="llm-step-section">
        <div className="llm-step-title"><span>5.2 · 它到底是什么</span><h3>先解释一条相关回应怎样生成：根据上文续写下一个 Token</h3><p>大语言模型仍是神经网络，只是被训练成了通用语言预测器。它反复根据已有上下文预测下一个 Token，于是可以逐步生成一段回应。</p></div>
        <div className="llm-upgrade-grid">
          <article><span>保持不变</span><strong>仍然是神经网络</strong><p>仍有层、权重、偏置、前向计算、Loss、反向传播和推理。</p></article>
          <article><span>改进 01</span><strong>输入改成 Token 序列</strong><p>Tokenizer、Embedding 和位置信息，让文字能够进入网络。</p></article>
          <article><span>改进 02</span><strong>骨干改成 Transformer</strong><p>Self-Attention 让序列中的每个位置按需要参考其他位置。</p></article>
          <article><span>改进 03</span><strong>输出改成开放式序列</strong><p>每一步在大词表中预测下一个 Token，循环后形成任意长度文字。</p></article>
          <article><span>改进 04</span><strong>规模与训练方式扩大</strong><p>海量语料、大量参数、预训练和指令对齐，使一个模型获得多任务能力。</p></article>
        </div>
        <AnnLlmSideBySide />
        <Definition
          term="大语言模型"
          simple="把文字切成 Token，利用大型神经网络根据上下文不断预测下一个 Token，从而理解和生成语言的模型。"
          precise="当代主流大语言模型以 Transformer 为骨干，在大规模 Token 序列上进行自回归预训练，并常经过指令微调和偏好对齐。"
        />
        <div className="math-explain lecture-board compact-board">
          <div className="math-explain-head"><span>唯一需要记住的公式</span><h3>给定上文，预测下一个 Token</h3></div>
          <section><TeX display ariaLabel="next token" math="P(t_{n+1}\mid t_1,t_2,\ldots,t_n)" /><p className="board-line">模型输出的不是一个“答案字符串”，而是词表中每个候选 Token 的概率。选出一个，把它追加到上下文，再运行一次。</p></section>
        </div>
        <GenerationLoopDiagram />
        <TokenLab />
        <div className="llm-memory-line"><strong>本节必须记住</strong><code>大语言模型 = Token 序列 + Transformer 神经网络 + 下一 Token 目标 + 大规模预训练</code></div>
      </section>

      <section className="llm-step-section">
        <div className="llm-step-title"><span>5.3 · 具体怎样构造</span><h3>打开黑箱：文字怎样变成带语境的下一 Token 预测</h3><p>先让文字变成带顺序的数字，再让 Transformer 联系前文，最后由语言模型输出层给整个词表打分。</p></div>
        <TokenizeDiagram />
        <div className="llm-three-concepts">
          <article><span>Tokenizer</span><strong>切分并编号</strong><p>把文字切成词、字或子词 Token；同一 Token 对应稳定编号。它是编码规则，不负责理解。</p></article>
          <article><span>Embedding</span><strong>把编号查成向量</strong><p>向量表是可训练参数。模型训练时，相关 Token 的表示逐渐形成可用关系。</p></article>
          <article><span>Position</span><strong>告诉模型先后顺序</strong><p>“证据还没有取得”和“已经取得证据”Token 相近，顺序却改变含义。</p></article>
        </div>
        <LlmConstructionExplorer />
        <AttentionHeatmapDiagram />
        <AttentionLab />
        <TransformerStackDiagram />
        <TransformerReferenceFigure />
        <LlmPipeline />
        <div className="llm-memory-line"><strong>本节必须记住</strong><code>输入编号 → Embedding → Decoder Blocks × N → 语言模型输出层 → 全词表候选分数</code></div>
      </section>

      <section className="llm-step-section">
        <div className="llm-step-title"><span>5.4 · 怎样完成预训练</span><h3>能力不是被灌进去的，而是在预测误差中一点点长出来的</h3><p>原始文本自动提供下一 Token 答案；模型用因果语言模型损失计算预测误差，再反向传播并更新权重。之后再区分从零预训练、继续预训练、对齐和推理。</p></div>
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
        <DeepDive title="实作展开：用 tiny-gpt2 走完加载、继续预训练、保存与生成">
          <Gpt2PretrainingLab />
        </DeepDive>
        <InlinePythonLab example="language" guide="先看初始损失，再看训练中损失下降和权重变化，最后看检查点包含什么。这个微型神经语言模型只复现训练逻辑；真实大语言模型把简单权重矩阵换成多层Transformer。" />
        <div className="llm-memory-line"><strong>本节必须记住</strong><code>预测 → 算 Loss → 反向传播 → 更新参数 → 重复；训练改变的是参数</code></div>
      </section>

      <section className="llm-step-section">
        <div className="llm-step-title"><span>5.5 · 模型长什么样</span><h3>训练结束后，能力没有变成规则，而是留在一组可加载的制品里</h3><p>先看这组制品分别负责什么；需要时再打开真实 tiny-gpt2 的文件和张量名称。</p></div>
        <div className="llm-product-facts">
          <article><strong>结构不会消失</strong><p>config 说明层数、隐藏维度、注意力头和词表大小。</p></article>
          <article><strong>知识没有变成中文规则</strong><p>训练结果分布在 Embedding、查询/键/值投影、前馈神经网络、归一化层、语言模型输出层等大量张量中。</p></article>
          <article><strong>使用前必须加载</strong><p>推理服务把配置、Tokenizer 和权重载入中央处理器或图形处理器，并开放本地接口或网络调用接口。</p></article>
          <article><strong>推理通常不改权重</strong><p>本次提示词只进入上下文窗口；它不会因为一次聊天自动完成新的模型训练。</p></article>
        </div>
        <DeepDive title="展开：打开真实 tiny-gpt2 的配置、Tokenizer 与权重张量">
          <LlmCheckpointExplorer />
        </DeepDive>
        <div className="llm-memory-line"><strong>本节必须记住</strong><code>训练成品 = Tokenizer + 模型结构配置 + 训练后权重张量（+ 生成默认设置）</code></div>
      </section>

      <section className="llm-step-section">
        <div className="llm-step-title"><span>5.6 · 怎样多轮交互</span><h3>回到对话界面：应用把历史交给模型，模型才接得住追问</h3><p>模型先被部署成推理服务。第二轮若要理解“其中一处”指向什么，应用必须把第一轮问题、回答与新追问一起提交。</p></div>
        <LlmCallLab />
        <ContextWindowDiagram />
        <div className="llm-call-guardrail"><strong>静态网页的关键安全边界</strong><p>教学页面可以演示请求结构，但生产环境的模型密钥不能直接写在浏览器代码里；否则任何打开网页的人都可能读取密钥。真实系统应由受控后端代为调用，并记录访问、输入和输出。</p></div>
        <InlinePythonLab example="llm_call" guide="运行后依次看请求、模型服务内部四步和响应。这个教学模拟器不访问外部模型，因此无需密钥；真实调用只需把模型服务函数替换为企业模型平台或云端调用接口。" />
        <div className="llm-memory-line"><strong>本节必须记住</strong><code>应用 → 请求(messages + 参数) → 推理服务 → Tokenizer/模型生成 → 响应</code></div>
      </section>

      <section className="llm-step-section">
        <div className="llm-step-title"><span>5.7 · 会什么、不会什么</span><h3>最后把三件事分开：相关反馈、事实正确与实际行动</h3><p>下一 Token 训练迫使模型学习语言结构、常见知识关联和长程依赖；规模扩大后表现出通用能力，但不自动保证事实、责任或行动。</p></div>
        <WhyNextTokenDiagram />
        <CapabilityBoundaryStrip />
        <div className="llm-case-output">
          <div><span>输入给模型的材料</span><p>问题背景 + 目标 + 已知约束 + 对话历史 + 当前追问</p></div>
          <i>→</i>
          <div><span>大语言模型可以输出</span><p>对问题的理解、方案权衡、针对追问的反馈和待补充信息</p></div>
          <i>≠</i>
          <div className="limit"><span>不能自动保证</span><p>真正读取了未提供的事实、建议一定正确，或已经代替你做出决策</p></div>
        </div>
        <div className="hallucination">
          <div>
            <strong>为什么会幻觉</strong>
            <p>目标函数奖励的是「统计上像那么回事的后续 Token」，不是「每句都有系统可核验来源」。资料不足或冲突时，模型仍可能生成语法完美、语气笃定的段落。</p>
          </div>
          <div>
            <span>语言流畅</span><i>≠</i><span>真正理解</span><i>≠</i><span>建议正确</span><i>≠</i><span>代替你决策</span>
          </div>
        </div>
        <CapabilityBoundary
          method="大语言模型"
          input="提示词 + 上下文中的 Token 序列（问题、背景、约束、对话历史）"
          unique="在语言空间里联系上下文，根据当前追问进行条件生成"
          output="问题理解、方案权衡、针对性反馈、补充问题（文本）"
          limit="可能幻觉或误解；窗口外信息不可见；不能替代用户做决策"
        />
        <div className="task-logic-map">
          <span>板书收束</span>
          <code>Token 化 → 条件概率 P(下一 Token) → Attention 联语境 → 逐 Token 生成</code>
          <span>提醒</span>
          <strong>相关反馈 ≠ 一定正确；窗口外 = 未知</strong>
        </div>
        <LessonTakeaway>
          大语言模型是以 Transformer 为骨干、在海量 Token 序列上训练的大型神经网络：训练时通过下一 Token 误差更新权重，使用时根据问题、背景和对话历史逐 Token 生成回应；因此它可以理解开放式问题并针对追问反馈，但仍可能误解或幻觉，也不会天然获得窗口外的信息。
        </LessonTakeaway>
      </section>
    </div>
  );
}

function TransformerReferenceFigure() {
  return (
    <figure className="transformer-reference-figure">
      <header>
        <div>
          <span>论文原图 · 2017</span>
          <h4>把简化图放回完整 Transformer 架构</h4>
        </div>
        <p>不要求记住每个方框。沿着输入到输出看一遍，抓住 Attention、前馈网络和层层堆叠三件事。</p>
      </header>
      <div className="transformer-reference-body">
        <div className="transformer-reference-media">
          {/* The source image has fixed scholarly artwork; keep it unmodified and locally cached. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/images/transformer-encoder-decoder-architecture.png"
            alt="Attention Is All You Need 论文中的 Transformer 编码器—解码器完整架构图"
          />
        </div>
        <ol className="transformer-reading-guide">
          <li>
            <b>01</b>
            <div><strong>先看左边：Encoder 读输入</strong><p>输入 Token 变成向量并加入位置信息，再经过多层 Self-Attention 与前馈网络。</p></div>
          </li>
          <li>
            <b>02</b>
            <div><strong>再看右边：Decoder 逐步写输出</strong><p>生成到当前位置时只能参考已经出现的 Token，因此要使用 Masked Self-Attention。</p></div>
          </li>
          <li>
            <b>03</b>
            <div><strong>看重复模块：同一种 Block 堆叠很多层</strong><p>每层都包含 Attention、Feed Forward、残差连接与归一化；训练改变的是其中的参数。</p></div>
          </li>
          <li>
            <b>04</b>
            <div><strong>联系今天的大语言模型</strong><p>原图用于机器翻译；许多生成式大语言模型采用仅解码器结构：保留带掩码自注意力的自回归生成骨架，不再设置左侧独立编码器与跨注意力层。</p></div>
          </li>
        </ol>
      </div>
      <figcaption>
        图源：Vaswani 等，
        <a href="https://arxiv.org/abs/1706.03762" target="_blank" rel="noreferrer">《Attention Is All You Need》</a>
        （2017），经
        <a href="https://commons.wikimedia.org/wiki/File:Attention_Is_All_You_Need_-_Encoder-decoder_Architecture.png" target="_blank" rel="noreferrer"> Wikimedia Commons</a>
        提供；原图未修改，许可为
        <a href="https://creativecommons.org/licenses/by-sa/4.0/" target="_blank" rel="noreferrer"> CC BY-SA 4.0</a>。
      </figcaption>
    </figure>
  );
}

function CourseArchitecture() {
  return <div className="course-architecture">
    <div className="course-architecture-head"><p>本课讨论大语言模型与智能体的基础概念、架构，以及它们在审计工作中的可能用法。课程分为三部分：</p></div>
    <div className="course-architecture-parts">{courseParts.map(part => <a href={part.href} key={part.no}><span>{part.no}</span><small>章节 {part.range}</small><h4>{part.title}</h4><p>{part.description}</p></a>)}</div>
  </div>;
}

function CapabilityBoundary({ method, input, output, unique, limit }: { method: string; input: string; output: string; unique: string; limit: string }) {
  return <div className="capability-boundary"><div><span>方法</span><strong>{method}</strong></div><div><span>输入</span><strong>{input}</strong></div><div><span>它独有的增量能力</span><strong>{unique}</strong></div><div><span>这一步的输出</span><strong>{output}</strong></div><div className="limit"><span>仍然做不到</span><strong>{limit}</strong></div></div>;
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
    { name: "客户关系管理系统", fact: "当天没有苏州客户拜访登记，对应联系人正在休假。", meaning: "声称的业务目的缺少业务记录支持。" },
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
    [["证据", 54], ["结论", 26], ["流程", 14]],
    [["。", 62], ["，", 18], ["还", 11]],
    [["因此", 45], ["但是", 27], ["如果", 16]],
    [["需要先补齐", 52], ["可以忽略", 19], ["已经完成", 13]],
  ];
  return (
    <div className="interactive token-lab">
      <div className="interactive-head"><div><span>互动 04</span><h3>亲手完成四次“下一个Token预测”</h3></div><button onClick={() => setTokens([])}>重置</button></div>
      <div className="sentence">报告草稿还缺两处 {tokens.map((t, i) => <mark key={`${t}${i}`}>{t}</mark>)}<i /></div>
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
  { name: "transformer.wte.weight", shape: "[50257, 2]", role: "tiny-gpt2 的 Token Embedding：把 50,257 个词表项映射为 2 维向量", preview: [[0.018, -0.042], [-0.011, 0.064]] },
  { name: "transformer.wpe.weight", shape: "[1024, 2]", role: "位置 Embedding：为上下文中 0—1023 位置提供可训练向量", preview: [[-0.007, 0.052], [0.028, -0.014]] },
  { name: "transformer.h.0.attn.c_attn.weight", shape: "[2, 6]", role: "第 1 个 GPT2Block 将 2 维隐藏表示一次投影为 Q、K、V 三组向量", preview: [[0.023, -0.016, 0.041, 0.008], [0.004, 0.037, -0.029, 0.012]] },
  { name: "transformer.h.0.attn.c_proj.weight", shape: "[2, 2]", role: "把多头注意力的输出投影回隐藏维度", preview: [[0.031, 0.009], [-0.026, 0.043]] },
  { name: "transformer.h.0.mlp.c_fc.weight", shape: "[2, 8]", role: "GPT-2 前馈网络的扩展层：2 维先扩到 8 维", preview: [[0.012, -0.008, 0.037, 0.021], [0.044, 0.005, -0.018, 0.029]] },
  { name: "transformer.h.0.mlp.c_proj.weight", shape: "[8, 2]", role: "GPT-2 前馈网络的回投影层：8 维再压回 2 维", preview: [[0.017, 0.039], [-0.035, 0.011]] },
  { name: "transformer.ln_f.weight", shape: "[2]", role: "最后一层 LayerNorm 的可训练缩放参数", preview: [[0.96, 1.03]] },
  { name: "lm_head.weight", shape: "[50257, 2]", role: "输出头：把隐藏向量转成 50,257 个候选 Token 分数；GPT-2 与 wte 共享这组权重", preview: [[0.018, -0.042], [-0.011, 0.064]] },
];

function LlmCheckpointExplorer() {
  const [selected, setSelected] = useState(0);
  const tensor = tinyLlmTensors[selected];
  return (
    <div className="model-explorer llm-explorer">
      <div className="model-explorer-head"><div><span>模型解剖台 02 · sshleifer/tiny-gpt2</span><h3>真实的 GPT-2 检查点加载后，在磁盘和内存里长什么样？</h3></div><small>2 层 · 2 维隐藏表示 · 102,714 参数</small></div>
      <div className="llm-files">
        <div><span>config.json</span><strong>结构说明</strong><p>层数、隐藏维度、注意力头数、词表大小。</p></div>
        <div><span>词表文件 + 合并规则文件</span><strong>第二代生成式预训练模型的切词器</strong><p>词表与字节对编码合并规则，决定文字怎样变成编号。</p></div>
        <div className="main-file"><span>pytorch_model.bin</span><strong>102,714 个训练后参数</strong><p>这个小检查点使用 PyTorch 权重文件；现代模型也常用 safetensors 分片。</p></div>
        <div><span>tokenizer_config.json</span><strong>特殊 Token 与默认行为</strong><p>记录 Tokenizer 类型、开始/结束 Token 等配置。</p></div>
      </div>
      <div className="tensor-browser">
        <div className="tensor-list"><span>state_dict · 真实 GPT-2 张量名称</span>{tinyLlmTensors.map((item, i) => <button type="button" key={item.name} className={selected === i ? "active" : ""} onClick={() => setSelected(i)}><strong>{item.name}</strong><small>{item.shape}</small></button>)}</div>
        <div className="tensor-detail"><span>选中的张量</span><h3>{tensor.name}</h3><p>{tensor.role}</p><div className="tensor-values">{tensor.preview.map((row, i) => <p key={i}>{row.map((value, j) => <b key={j}>{value.toFixed(2)}</b>)}</p>)}</div><small>这里只展示左上角少量数值；完整张量形状为 {tensor.shape}。</small></div>
        <div className="transformer-stack"><span>一次前向计算</span>{["Token 编号", "Embedding", "Attention", "前馈神经网络", "重复多个Block", "归一化层", "语言模型输出层", "下一个Token概率"].map((item, i) => <div key={item}><b>{String(i + 1).padStart(2, "0")}</b><p>{item}</p></div>)}</div>
      </div>
      <div className="scale-note"><strong>微型生成式预训练模型示例是“真结构、极小尺寸”；第二代生成式预训练模型的最小正式版本有1.24亿参数。</strong><p>两者都是仅解码器 Transformer，都有 Token/Position Embedding、Transformer Block、最终归一化层和语言模型输出层。规模放大后，张量名称与流程仍是同一类；模型能力来自更宽、更深的网络和大量语料学到的分布式权重。</p></div>
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
    code: `# 真实运行：从 64 个像素学习识别 0—9（对应票面金额数字）
# 网络：输入 64 → 隐藏层 24（ReLU）→ 输出 10（Softmax + 交叉熵）
import csv
from pathlib import Path
import numpy as np

path = Path("/data/digits_8x8_subset.csv")
if not path.exists():
    path = Path("public/simple_audit_demo/digits_8x8_subset.csv")

rows = list(csv.DictReader(path.open(encoding="utf-8")))
X = np.array([[float(row[f"pixel_{i:02d}"]) for i in range(64)] for row in rows]) / 16.0
y = np.array([int(row["label"]) for row in rows])
train_mask = np.array([row["split"] == "train" for row in rows])
X_train, y_train = X[train_mask], y[train_mask]
X_test, y_test = X[~train_mask], y[~train_mask]

print(f"数据：训练 {len(y_train)} 张 / 测试 {len(y_test)} 张；每张 8×8=64 像素")
print("结构：64 → 24(ReLU) → 10(Softmax)")
print("-" * 48)

EPOCHS = 400
LOG_AT = {0, 1, 2, 5, 10, 15, 20, 30, 45, 60, 80, 100, 140, 190, 250, 320, 400}
rng = np.random.default_rng(7)
W1 = rng.normal(0, 0.18, (64, 24)); b1 = np.zeros(24)
W2 = rng.normal(0, 0.18, (24, 10)); b2 = np.zeros(10)
learning_rate = 0.35

def forward(X, W1, b1, W2, b2):
    hidden = np.maximum(0, X @ W1 + b1)          # ReLU
    logits = hidden @ W2 + b2
    logits = logits - logits.max(axis=1, keepdims=True)
    probs = np.exp(logits)
    probs /= probs.sum(axis=1, keepdims=True)    # Softmax
    return hidden, probs

def batch_loss(probs, labels):
    return -np.log(probs[np.arange(len(labels)), labels] + 1e-9).mean()

def batch_acc(probs, labels):
    return float((probs.argmax(axis=1) == labels).mean())

for epoch in range(EPOCHS + 1):
    hidden, probs = forward(X_train, W1, b1, W2, b2)
    loss = batch_loss(probs, y_train)

    if epoch in LOG_AT:
        train_acc = batch_acc(probs, y_train)
        # TRAIN_LOG 供右侧进度条解析；下一行给人看
        print(f"TRAIN_LOG epoch={epoch} loss={loss:.4f} train_acc={train_acc:.4f}")
        bar = "#" * (epoch * 20 // EPOCHS) + "." * (20 - epoch * 20 // EPOCHS)
        print(f"  [{bar}] epoch {epoch:3d}/{EPOCHS}  loss={loss:.4f}  train_acc={train_acc:.1%}")

    if epoch == EPOCHS:
        break

    # 反向传播：交叉熵对 Softmax 的梯度
    grad = probs.copy()
    grad[np.arange(len(y_train)), y_train] -= 1
    grad /= len(y_train)
    gW2 = hidden.T @ grad; gb2 = grad.sum(axis=0)
    hidden_grad = (grad @ W2.T) * (hidden > 0)
    gW1 = X_train.T @ hidden_grad; gb1 = hidden_grad.sum(axis=0)
    W1 -= learning_rate * gW1; b1 -= learning_rate * gb1
    W2 -= learning_rate * gW2; b2 -= learning_rate * gb2

print("-" * 48)
_, test_probs = forward(X_test, W1, b1, W2, b2)
test_pred = test_probs.argmax(axis=1)
test_acc = (test_pred == y_test).mean()
print(f"独立测试集准确率：{test_acc:.1%}")
print("训练完保存的参数：W1", W1.shape, "b1", b1.shape, "W2", W2.shape, "b2", b2.shape)

for digit in (2, 8, 6):
    index = np.where(y_test == digit)[0][0]
    print(f"票面样本 {digit} → 模型识别为 {test_pred[index]}（置信度 {test_probs[index, test_pred[index]]:.1%}）")
`,
  },
  language: {
    label: "训练一个微型神经语言模型",
    code: `# 真实运行：用梯度下降训练“根据当前字符预测下一个字符”的神经语言模型
# 它不是Transformer，但完整保留：Token化 → 前向 → 交叉熵Loss → 反向传播 → 更新权重 → 检查点
import numpy as np
np.random.seed(7)

corpus = ("报告草稿还缺两处证据。"
          "未知信息必须标记为待补充。对话中的代词需要联系前文理解。") * 20
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
print("提醒：真实大语言模型把权重矩阵换成Embedding、多层Attention、前馈神经网络和语言模型输出层等大量张量。")`,
  },
  llm_call: {
    label: "模拟一次完整的大模型调用",
    code: `# 教学模拟：请求格式与真实模型服务同构，但不访问外网、不需要接口密钥
import json

request = {
    "model": "enterprise-llm",
    "messages": [
        {"role": "system", "content": "根据对话上下文回答；区分已知事实与待补充信息；返回JSON。"},
        {"role": "user", "content": "报告草稿还缺两处证据。我应该先做什么？"},
        {"role": "assistant", "content": "先确认缺失的是哪两处证据，并补齐可取得的材料；不要把尚未证实的信息写入草稿。"},
        {"role": "user", "content": "如果其中一处暂时拿不到呢？"},
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

    # 教学版固定输出：只用于观察响应结构，不冒充真实大语言模型
    output = {
        "understanding": "用户询问如何处理缺失证据",
        "feedback": "先补齐可取得的材料，未取得部分标为待补充",
        "questions": ["缺失的是哪两处证据？", "缺失会影响哪项结论？"],
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
print("\\n为什么追问能接上：第二次请求重新发送了第一轮user、assistant和新的user消息。")
print("\\n生产提示：接口密钥应放在受控后端，不能写进静态网页代码。")`,
  },
  attention: {
    label: "计算一次微型Attention",
    code: `# 真实运行：不用第三方库，计算一次单头Attention
import math

tokens = ["报告草稿", "两处证据", "先补齐", "暂时拿不到", "待补充", "不能补写"]
# 每个Token先被表示成一个很小的向量；真实模型的维度会大得多
Q = [0.8, 0.4, 0.9]
keys = [
    [0.5, 0.2, 0.4],
    [0.3, 0.8, 0.5],
    [0.8, 0.2, 0.8],
    [0.9, 0.1, 0.9],
    [0.7, 0.7, 0.8],
    [0.6, 0.7, 0.9],
]
values = [
    [0.8, 0.1],
    [0.3, 0.4],
    [0.1, 0.9],
    [0.2, 1.0],
    [0.7, 0.8],
    [0.8, 0.9],
]

scores = [sum(q*k for q, k in zip(Q, key)) / math.sqrt(len(Q)) for key in keys]
largest = max(scores)
exp_scores = [math.exp(score - largest) for score in scores]
weights = [value / sum(exp_scores) for value in exp_scores]
context = [sum(weight * value[i] for weight, value in zip(weights, values)) for i in range(2)]

print("当前Query：其中一处证据暂时拿不到，应怎样处理？")
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
# 全部数据均为课堂示例；semantic_extract用确定性代码模拟大语言模型结构化输出。
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

# 2) 教学模拟大语言模型：把自然语言整理为结构化主张；真实系统应调用受控模型服务
def semantic_extract(text):
    return {"claimed_origin":"上海机场", "claimed_destination":"苏州客户", "raw_text":text}

claim_semantics = semantic_extract(claim["description"])
print("[2/5 大语言模型] 结构化主张：", claim_semantics)

# 3) 智能体：只有航班返回矛盾后，才扩大到酒店、客户关系管理系统和日历
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
    print(f"[3/5 智能体] 调用 {action}：{result}")

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
print("查询编号：AQ-2026-0715-042；校验状态：通过")
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

type TrainLogPoint = { epoch: number; loss: number; trainAcc?: number };

function parseTrainLog(text: string): TrainLogPoint[] {
  const points: TrainLogPoint[] = [];
  for (const line of text.split("\n")) {
    const match = line.match(/TRAIN_LOG\s+epoch=(\d+)\s+loss=([\d.]+)(?:\s+train_acc=([\d.]+))?/);
    if (!match) continue;
    points.push({
      epoch: Number(match[1]),
      loss: Number(match[2]),
      trainAcc: match[3] ? Number(match[3]) : undefined,
    });
  }
  return points;
}

function stripTrainLogLines(text: string) {
  return text
    .split("\n")
    .filter(line => !line.startsWith("TRAIN_LOG "))
    .join("\n")
    .trim();
}

function LossSparkline({ points, peakLoss }: { points: TrainLogPoint[]; peakLoss: number }) {
  const width = 360;
  const height = 132;
  const padX = 10;
  const padY = 14;
  if (points.length === 0) {
    return (
      <div className="neural-spark-empty">
        <span>Loss 曲线</span>
        <p>运行后在这里回放下降过程</p>
      </div>
    );
  }
  const maxX = Math.max(points.length - 1, 1);
  const coords = points.map((point, index) => {
    const x = padX + (index / maxX) * (width - padX * 2);
    const y = padY + (1 - point.loss / peakLoss) * (height - padY * 2);
    return [x, y] as const;
  });
  const line = coords.map(([x, y], index) => `${index === 0 ? "M" : "L"}${x.toFixed(1)} ${y.toFixed(1)}`).join(" ");
  const area = `${line} L${coords[coords.length - 1][0].toFixed(1)} ${(height - 4).toFixed(1)} L${coords[0][0].toFixed(1)} ${(height - 4).toFixed(1)} Z`;
  const last = coords[coords.length - 1];
  const first = points[0];
  const current = points[points.length - 1];
  return (
    <div className="neural-spark">
      <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Loss 随 epoch 变化曲线">
        <line x1={padX} x2={width - padX} y1={height / 2} y2={height / 2} className="neural-spark-grid" />
        <path d={area} className="neural-spark-area" />
        <path d={line} className="neural-spark-line" />
        <circle cx={last[0]} cy={last[1]} r="4.5" className="neural-spark-dot" />
      </svg>
      <div className="neural-spark-legend">
        <span>起点 {first.loss.toFixed(2)}</span>
        <span>当前 {current.loss.toFixed(2)} · epoch {current.epoch}</span>
      </div>
    </div>
  );
}

function NeuralTrainMonitor({ points, running, maxEpoch = 400 }: { points: TrainLogPoint[]; running: boolean; maxEpoch?: number }) {
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (running || points.length === 0) {
      /* eslint-disable react-hooks/set-state-in-effect -- reset playback when a new run starts */
      setStep(0);
      /* eslint-enable react-hooks/set-state-in-effect */
      return;
    }
    let index = 0;
    const id = window.setInterval(() => {
      setStep(Math.min(index, points.length - 1));
      index += 1;
      if (index >= points.length) window.clearInterval(id);
    }, 580);
    return () => window.clearInterval(id);
  }, [points, running]);

  const visible = points.slice(0, step + 1);
  const current = visible[visible.length - 1];
  const firstLoss = points[0]?.loss ?? 1;
  const peakLoss = Math.max(...points.map(point => point.loss), firstLoss, 0.01);
  const progress = running ? 18 : current ? Math.min(100, (current.epoch / maxEpoch) * 100) : 0;
  const lossDrop = current && firstLoss > 0 ? ((firstLoss - current.loss) / firstLoss) * 100 : 0;
  const status = running ? "running" : current ? "playing" : "idle";

  return (
    <section className={`neural-dash neural-dash-${status}`}>
      <div className="neural-dash-top">
        <div>
          <span>训练监控</span>
          <strong>
            {running ? "正在训练网络…" : current ? `Epoch ${current.epoch}` : "等待运行"}
            {!running && current && <em>/ {maxEpoch}</em>}
          </strong>
        </div>
        <b>{running ? "…" : `${Math.round(progress)}%`}</b>
      </div>

      <div className="neural-dash-bar" aria-label="训练进度">
        <i><b style={{ width: `${progress}%` }} /></i>
      </div>
      <p className="neural-dash-caption">
        {running
          ? "前向 → Loss → 反向传播；结束后自动回放曲线"
          : current
            ? `回放中 · 第 ${current.epoch} / ${maxEpoch} 轮 · 采样 ${visible.length}/${points.length}`
            : "点击左侧「运行代码」后，这里显示进度与 Loss"}
      </p>

      <div className="neural-dash-stats">
        <div>
          <span>Loss</span>
          <strong>{running || !current ? "—" : current.loss.toFixed(4)}</strong>
          <small>{current ? `较起点 ${lossDrop >= 0 ? "↓" : "↑"} ${Math.abs(lossDrop).toFixed(0)}%` : "交叉熵损失"}</small>
        </div>
        <div>
          <span>训练准确率</span>
          <strong>{running || current?.trainAcc == null ? "—" : `${(current.trainAcc * 100).toFixed(1)}%`}</strong>
          <small>{points[0] ? `起点 Loss ${points[0].loss.toFixed(4)}` : "正确类别占比"}</small>
        </div>
      </div>

      <LossSparkline points={running ? [] : visible} peakLoss={peakLoss} />
    </section>
  );
}

function InlinePythonLab({ example, guide }: { example: keyof typeof kernelExamples; guide: string }) {
  const item = kernelExamples[example];
  const kernel = useContext(PythonKernelContext);
  const [code, setCode] = useState<string>(item.code);
  const [output, setOutput] = useState("Python环境正在加载。首次打开需要下载浏览器运行时……");
  const [trainPoints, setTrainPoints] = useState<TrainLogPoint[]>([]);
  const [trainRunning, setTrainRunning] = useState(false);
  const showTrainMonitor = example === "neural";

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
    setTrainPoints([]);
    if (showTrainMonitor) setTrainRunning(true);
    const result = await kernel.run(code);
    const parts = [result.stdout, result.stderr, result.value ? `返回值：${result.value}` : "", result.error].filter(Boolean);
    const raw = parts.join("\n") || "代码运行完成，没有输出。";
    if (showTrainMonitor) {
      setTrainPoints(parseTrainLog(raw));
      setTrainRunning(false);
      setOutput(stripTrainLogLines(raw) || "代码运行完成，没有输出。");
    } else {
      setOutput(raw);
    }
  };

  const restart = () => {
    setOutput("正在重启Python Kernel并清空全部变量……");
    setTrainPoints([]);
    setTrainRunning(false);
    kernel.restart();
  };

  return (
    <div className={`python-lab inline-python${showTrainMonitor ? " has-train-monitor" : ""}`}>
      <div className="python-head"><div><span>本节可运行代码</span><h3>{item.label}</h3></div><div className={`kernel-status ${kernel.status}`}><i />{kernel.status === "loading" ? "加载中" : kernel.status === "ready" ? "已就绪" : kernel.status === "running" ? "运行中" : "发生错误"}</div></div>
      <div className="python-workspace">
        <div className="editor-pane"><div><span>Python代码</span><small>可直接修改后重新运行</small></div><textarea spellCheck={false} value={code} onChange={(event) => setCode(event.target.value)} aria-label={`${item.label}Python代码编辑器`} /><footer><button className="run" disabled={kernel.status !== "ready"} onClick={runCode}>▶ 运行代码</button><button onClick={() => { setCode(item.code); setTrainPoints([]); setTrainRunning(false); }}>恢复示例</button><button onClick={restart}>重启内核</button></footer></div>
        <div className="output-pane">
          <div><span>运行输出</span><small>{showTrainMonitor ? "进度 · Loss · stdout" : "stdout / stderr"}</small></div>
          {showTrainMonitor && <NeuralTrainMonitor points={trainPoints} running={trainRunning} maxEpoch={400} />}
          <pre>{output}</pre>
        </div>
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
    A: { code: "三个字段完全一致，精确规则已经足够可靠。", ml: "重复字段也是极强的风险特征。", nn: "光学字符识别可从不同图片中提取相同要素。", llm: "能解释重复原因，但没有必要替代简单规则。", agent: "调用重复检测工具并并列展示原始凭证。" },
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
    ["普通代码与机器学习最核心的区别？", ["代码更快", "代码执行人写的逻辑，机器学习从案例中学习参数", "机器学习不需要人参与"], 1],
    ["神经网络的“训练”主要在做什么？", ["不断调整权重以减小预测误差", "把全部答案存在数据库", "让计算机运行更快"], 0],
    ["大语言模型与智能体最核心的区别？", ["智能体参数更多", "智能体把模型置于目标、工具、状态、循环和控制组成的运行系统中", "大语言模型只能输出英文"], 1],
    ["工具调用超时后，可靠的智能体首先应当？", ["假定查询无异常", "记录失败状态，并按策略重试或转人工", "无限重复调用"], 1],
    ["状态、长期记忆和运行轨迹的关系？", ["三者完全相同", "状态服务当前任务，记忆跨任务复用，轨迹用于还原运行过程", "只有长期记忆需要治理"], 1],
    ["可信的智能问数答案至少还要带什么？", ["只要数字即可", "口径、查询、来源、校验状态和限制", "模型的思考过程"], 1],
    ["报告发现的原因尚未确认时，系统应当？", ["按经验补全原因", "保留占位符并创建补充任务", "删除这条发现"], 1],
    ["审计智能体的可复核证据包应包含？", ["一个风险分", "一段流畅结论", "事实、标准、证据、不确定性和下一步"], 2],
    ["审计智能体更稳妥的上线顺序？", ["全面自动执行", "离线测试→影子运行→小范围试点→受控扩大", "先写入业务系统再补测试"], 1],
  ] as const;
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const score = Object.entries(answers).filter(([i, a]) => qs[Number(i)][2] === a).length;
  return <div className="quiz"><div className="quiz-score"><span>结课自测</span><strong>{score}<small>/{qs.length}</small></strong><p>{Object.keys(answers).length === qs.length ? score === qs.length ? "已经掌握技术基础、智能体架构与审计落地三条主线。" : "查看标出的正确答案，再回顾相应章节。" : `完成全部题目，检查关键边界是否真正说清楚（${Object.keys(answers).length}/${qs.length}）。`}</p></div><div>{qs.map((q, i) => <section key={q[0]}><p><span>{String(i + 1).padStart(2, "0")}</span>{q[0]}</p><div>{q[1].map((a, j) => { const answered = answers[i] !== undefined; const cls = answers[i] === j ? (q[2] === j ? "correct" : "wrong") : answered && q[2] === j ? "answer" : ""; return <button className={cls} key={a} onClick={() => setAnswers({ ...answers, [i]: j })}>{a}</button>; })}</div></section>)}</div></div>;
}

// Kept temporarily as a content migration reference until the next cleanup pass.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function LegacyHome() {
  return (
    <PythonKernelProvider>
    <main id="top" className="view-student">
      <Header />
      <aside className="sidenav"><div><span>2小时课程</span><strong>从规则到智能体</strong></div><nav>{nav.map((x, i) => <a href={`#${x[0]}`} key={x[0]}><span>{String(i + 1).padStart(2, "0")}</span><b>{x[1]}</b><small>{x[2]}</small></a>)}</nav></aside>
      <div className="page">
        <section className="hero">
          <p>面向审计人员的2小时人工智能基础课</p>
          <h1>42,000笔报销，4名审计人员，10个工作日。<br />怎样找到真正值得核查的问题？</h1>
          <div className="hero-lead">我们先不谈人工智能、模型或智能体。先把审计目标、数据、时间限制和应交付的证据说清楚，再一步步引入技术。</div>
          <div className="hero-scenario"><div><span>数据规模</span><strong>42,000笔</strong><small>差旅及招待费报销</small></div><div><span>人力限制</span><strong>4人 × 10天</strong><small>不可能靠人工逐笔深查</small></div><div><span>证据分布</span><strong>9张表 + 2文档</strong><small>通过报销号、行程号和发票号关联</small></div><div><span>最终交付</span><strong>可复核疑点</strong><small>不是笼统的“人工智能风险分”</small></div></div>
          <a className="hero-start" href="#problem">先进入这个审计任务 <span>↓</span></a>
        </section>

        <section id="problem" className="lesson">
          <SectionTitle no="01" time="15分钟" title="开始之前，完整面对我们要解决的问题" intro="技术不是起点。先亲手做一次筛查，再看一笔报销的证据如何散落在不同系统中，最后定义什么才算把问题解决。" />
          <ProblemSection />
          <TeacherNote>先不讲任何技术名称。给学员1分钟完成筛查挑战，让大家为自己的选择说理由；揭示证据后追问：“你是判断错了，还是当时根本没有足够信息？”再逐一打开BX-42017的五类数据，把“筛查—取证—复核”的完整任务讲清楚。</TeacherNote>
        </section>

        <section id="code" className="lesson">
          <SectionTitle no="02" time="16分钟" title="第一步：普通代码和规则系统是什么" intro="在谈人工智能之前，先理解最传统的计算机程序：人把步骤和条件写清楚，计算机机械、快速、准确地执行。" />
          <Definition term="计算机程序" simple="一组明确的指令，告诉计算机先做什么、后做什么，以及遇到不同条件时怎么办。" precise="程序由变量、条件、循环、函数等结构组成；同样的输入和同样的代码，通常得到同样的输出。" />
          <DatasetAnchor caseId="A / B" claimIds="BX-41610、BX-41902 / BX-41002" files={["expense_claims.csv", "invoice_registry.csv", "approvals.csv", "special_event_notice.md"]} task="先用确定性规则查出相同发票号；再观察“住宿费 > 600”为什么会把有月度通知和事前审批的BX-41002误报。" />
          <div className="concept-grid four"><div><span>变量</span><strong>保存数据</strong><p>例如金额、日期、审批状态。</p></div><div><span>条件</span><strong>进行判断</strong><p>如果金额超标，就进入下一步。</p></div><div><span>循环</span><strong>重复处理</strong><p>对42,000笔报销逐笔执行。</p></div><div><span>函数</span><strong>封装步骤</strong><p>把“检查住宿标准”写成可复用模块。</p></div></div>
          <CodeLab />
          <InlinePythonLab example="rule" guide="代码先只读expense_claims.csv中BX-41002的720元，因超过600元而报警；加入approvals.csv和会展通知后，再按明确条件排除误报。" />
          <div className="content-block"><h3>规则系统的本质</h3><p>规则系统把业务人员已经知道的判断逻辑写成代码。审计人员先定义“什么情况值得检查”，程序再批量执行。它是自动化，但不一定属于机器学习。</p><div className="two-col"><div><strong>它非常擅长</strong><ul><li>金额、日期和数量的精确比较</li><li>发票号码完全重复</li><li>审批缺失、字段为空</li><li>确定性强、必须一致执行的制度条件</li></ul></div><div><strong>它无法自己做到</strong><ul><li>从历史案例中总结新的规律</li><li>理解图片和自然语言</li><li>发现没有预先写出的组合模式</li><li>自动理解制度中的复杂例外</li></ul></div></div></div>
          <div className="important"><strong>必须记住</strong><p>代码不是人工智能的反义词。机器学习、大模型和智能体最终也都由代码运行；区别在于，一部分判断逻辑不再由程序员逐条写出，而是由模型从数据中学习得到。</p></div>
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
          <Definition term="大语言模型" simple="一个读过海量文字、能够根据上下文继续生成文字的神经网络。" precise="大语言模型通过预训练学习Token序列的概率分布，并在指令微调、偏好对齐等阶段形成更适合问答和任务执行的行为。" />
          <DatasetAnchor caseId="B / E" claimIds="BX-41002 / BX-42519" files={["expense_policy.md", "special_event_notice.md", "receipt_ocr.csv", "customer_visits.csv", "employee_calendar.csv"]} task="大模型需要理解制度例外，也需要综合“周日、儿童套餐、生日蛋糕、客户关系管理系统无拜访、家人生日”这组语义证据。" />
          <TokenLab />
          <LlmPipeline />
          <LlmCheckpointExplorer />
          <InlinePythonLab example="language" guide="先看 Tokenizer 如何把字符映射成编号，再看训练如何得到 bigram.weight，最后看模型怎样逐个生成字符。这是用于讲原理的微型模型；真实大语言模型用多层Transformer张量完成更复杂的下一Token预测。" />
          <div className="three-stages"><div><span>阶段 1</span><strong>预训练</strong><p>在海量文本上反复预测下一个Token，学习语言、知识表达和关系模式。</p></div><div><span>阶段 2</span><strong>指令训练与对齐</strong><p>学习按照人的指令回答，减少有害或明显不合适的输出。</p></div><div><span>阶段 3</span><strong>推理使用</strong><p>用户给出提示词和上下文，模型逐Token生成当前回答。</p></div></div>
          <div className="content-block"><h3>为什么“预测下一个Token”能表现出这么多能力</h3><p>要准确预测大量复杂文本的后续内容，模型必须学习词语关系、语法结构、常见知识表达、文档格式和许多任务模式。当模型、数据和训练规模足够大时，连续预测就会表现为总结、翻译、问答、写作、代码生成和一定程度的推理能力。</p><p>但这不意味着模型像数据库一样保存并核验每个事实，也不意味着它真正理解世界的方式与人完全相同。</p></div>
          <div className="attention-box"><span>Transformer里的关键思想：Attention</span><h3>理解一句话时，当前词应该重点参考前文中的哪些词？</h3><p>注意力机制为上下文中的Token计算相关程度。例如理解“这笔住宿超标，但已经取得特殊审批”时，“但”后面的信息会显著改变最终判断。</p></div>
          <div className="llm-addons"><div><span>提示词</span><strong>把任务讲清楚</strong><p>规定角色、目标、约束和输出格式。</p></div><div><span>上下文</span><strong>把当前资料给模型</strong><p>合同、制度、底稿、访谈记录。</p></div><div><span>检索增强生成知识库</span><strong>先检索，再回答</strong><p>找出相关制度片段，并保留出处。</p></div><div><span>工具</span><strong>让模型能查和算</strong><p>数据库、程序、发票查验服务。</p></div></div>
          <div className="hallucination"><div><strong>为什么会幻觉</strong><p>模型首先生成“统计上合理的后续文字”，而不是天然从权威系统提取经核验的事实。当资料不足时，它仍可能生成听起来完整的回答。</p></div><div><span>语言流畅</span><i>≠</i><span>事实正确</span><i>≠</i><span>证据充分</span><i>≠</i><span>审计结论</span></div></div>
          <Bridge from="大模型的瓶颈" problem="大模型能够告诉你“应该核对航班、酒店、拜访记录和发票状态”，但它不会天然进入企业系统查询，也不会自动根据查询结果继续下一步。" to="智能体" />
          <TeacherNote>一定把“大模型是神经网络”讲清楚。Token实验后说明真实模型词表、层数和参数规模巨大。讲Attention时只讲“相关性与信息选择”，不进入矩阵公式。</TeacherNote>
        </section>

        <section id="agent" className="lesson">
          <SectionTitle no="06" time="14分钟" title="第五步：大模型怎样变成智能体" intro="大模型是负责理解和生成的模型；智能体是围绕目标运行的系统。关键变化不是回答更长，而是能够使用工具并形成行动闭环。" />
          <Definition term="智能体" simple="让大模型不只回答问题，还能为了完成目标，判断下一步、调用工具、读取结果并继续行动。" precise="智能体是能够感知环境状态、根据目标选择行动、通过工具影响或查询环境，并依据反馈更新状态的受控软件系统。" />
          <DatasetAnchor caseId="F" claimIds="BX-42017" files={["expense_claims.csv", "flight_records.csv", "hotel_records.csv", "customer_visits.csv", "employee_calendar.csv", "invoice_registry.csv"]} task="从报销表出发，利用trip_id=T2017和employee_id=E1004主动调用多个数据工具，逐步证明上海→苏州的声称与南京行程相互矛盾。" />
          <div className="model-system"><div><span>大模型</span><strong>一个模型</strong><p>输入上下文，输出文字或结构化指令。</p><small>擅长：理解、归纳、生成、规划建议</small></div><i>≠</i><div><span>智能体</span><strong>一个运行系统</strong><p>模型 + 目标 + 工具 + 状态 + 控制机制。</p><small>擅长：围绕目标持续完成多步骤任务</small></div></div>
          <div className="agent-loop"><span>智能体的基本循环</span>{["接收目标", "观察现状", "判断缺口", "选择工具", "执行行动", "读取反馈", "继续或停止"].map((x, i) => <div key={x}><b>{i + 1}</b><p>{x}</p></div>)}</div>
          <AgentTrace />
          <InlinePythonLab example="agent" guide="代码围绕BX-42017，按计划调用航班、酒店、客户关系管理系统、日历和发票五个数据工具，把每次观察放入证据状态，达到停止条件后交由审计人员复核。" />
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
  return (
    <PythonKernelProvider>
      <main id="top" className="view-student">
        <Header />
        <aside className="sidenav"><div><span>2小时课程</span><strong>从规则到智能体</strong></div><nav>{nav.map((x, i) => <a href={`#${x[0]}`} key={x[0]}><span>{String(i + 1).padStart(2, "0")}</span><b>{x[1]}</b><small>{x[2]}</small></a>)}</nav></aside>
        <div className="page">
          <section className="hero">
            <p>面向审计人员的2小时人工智能基础课</p>
            <h1>42,000笔报销，4名审计人员，10个工作日。<br />怎样找到真正值得核查的问题？</h1>
            <div className="hero-lead">我们不从术语开始，而从一个完整审计任务开始。每引入一种技术，只回答：它为什么出现、解决了什么、还解决不了什么。</div>
            <div className="hero-scenario"><div><span>数据规模</span><strong>42,000笔</strong><small>差旅及招待费报销</small></div><div><span>人力限制</span><strong>4人 × 10天</strong><small>不可能靠人工逐笔深查</small></div><div><span>证据分布</span><strong>9表 + 历史集 + 2文档</strong><small>训练数据与本期待审数据严格分离</small></div><div><span>最终交付</span><strong>可复核疑点</strong><small>不是笼统的“人工智能风险分”</small></div></div>
            <div className="hero-path">{stages.map((stage, index) => <a key={stage.key} href={`#${stage.key}`}><span>0{index + 1}</span><strong>{stage.name}</strong><small>{stage.question}</small></a>)}</div>
            <a className="hero-start" href="#problem">先进入这个审计任务 <span>↓</span></a>
          </section>

          <section id="problem" className="lesson">
            <SectionTitle no="01" time="0—12分钟" title="第一步不是选技术，而是把审计问题说清楚" intro="先亲手做一次筛查，再看一笔报销的证据怎样散落在不同系统中，最后定义什么才算真正解决。" />
            <ProblemSection />
            <LessonTakeaway>技术的目标不是生成一个风险分，而是帮助审计人员形成可追溯、可解释、可复核的疑点。</LessonTakeaway>
            <Bridge from="人工逐笔检查的瓶颈" problem="人看不完42,000笔记录，但大量确定性检查其实可以被准确描述并重复执行。" to="普通代码与规则" />
            <TeacherNote time="12分钟" question="你刚才判断错了，还是当时根本没有足够信息？" misconception="异常、疑点、错报和舞弊不是同一个概念。" mustSay="本课程的交付目标是可复核疑点，不是人工智能分数。" canSkip="数据文件逐项预览可在课后展开。" />
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
            <TeacherNote time="12分钟" question="specialPeriod变量已经存在，为什么程序结果没有变化？" misconception="代码不是人工智能的反义词；模型和智能体最终也由代码运行。" mustSay="人写判断逻辑，计算机只执行被明确表达的逻辑。" canSkip="函数封装的技术语法。" />
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
            <Definition term="大语言模型" simple="一个根据前文不断预测下一个Token，并由此生成语言的大型神经网络。" precise="大语言模型通过预训练最小化Token序列预测损失，再经过指令微调和偏好对齐形成更适合问答与任务执行的行为。" />
            <DatasetAnchor caseId="B / E" claimIds="BX-41002 / BX-42519" files={["expense_policy.md", "special_event_notice.md", "receipt_ocr.csv", "customer_visits.csv", "employee_calendar.csv"]} task="大模型需要理解制度例外，也需要综合“周日、儿童套餐、生日蛋糕、客户关系管理系统无拜访、家人生日”这组语义证据。" />
            <LanguageTrainingShift />
            <TokenLab />
            <LlmPipeline />
            <AttentionLab />
            <LlmCheckpointExplorer />
            <InlinePythonLab example="language" guide="先看Tokenizer如何把字符映射成编号，再看训练如何得到bigram.weight，最后看模型怎样逐个生成字符。真实大语言模型用多层Transformer张量完成同类预测。" />
            <div className="three-stages"><div><span>阶段1</span><strong>预训练</strong><p>在海量文本上反复预测下一个Token。</p></div><div><span>阶段2</span><strong>指令训练与对齐</strong><p>学习按照人的指令回答并遵守约束。</p></div><div><span>阶段3</span><strong>推理使用</strong><p>参数固定，模型逐Token生成当前回答。</p></div></div>
            <div className="llm-addons"><div><span>提示词</span><strong>把任务讲清楚</strong><p>规定角色、目标和输出格式。</p></div><div><span>上下文</span><strong>提供当前资料</strong><p>合同、制度和底稿。</p></div><div><span>检索增强生成</span><strong>先检索再回答</strong><p>找到相关制度并保留出处。</p></div><div><span>工具</span><strong>让模型能查和算</strong><p>数据库、程序和发票服务。</p></div></div>
            <div className="hallucination"><div><strong>为什么会幻觉</strong><p>模型首先生成统计上合理的后续文字，而不是天然从权威系统提取经核验的事实。</p></div><div><span>语言流畅</span><i>≠</i><span>事实正确</span><i>≠</i><span>证据充分</span><i>≠</i><span>审计结论</span></div></div>
            <DeepDive title="用纯Python查看一次微型Attention计算"><InlinePythonLab example="attention" guide="观察Query、Key、Value怎样形成注意力权重。重点理解相关信息被加权汇总，不要把权重当作因果关系或事实证明。" /></DeepDive>
            <LessonTakeaway>大模型不是装满答案的数据库，而是一个根据上下文预测后续Token的大型神经网络。</LessonTakeaway>
            <Bridge from="大模型的瓶颈" problem="模型可以建议核对航班和酒店，但不会天然进入企业系统，也不会自己根据查询结果继续调查。" to="智能体" />
            <TeacherNote time="23分钟" question="一段非常流畅的制度解释，能否直接进入审计底稿？" misconception="大模型不是数据库；Attention关联也不是事实核验。" mustSay="大语言模型仍使用同一训练循环，只是数据、网络和参数规模巨大。" canSkip="微型Attention代码和部分张量目录。" />
          </section>

          <section id="agent" className="lesson">
            <SectionTitle no="06" time="90—108分钟" title="智能体：把模型放进目标—行动—反馈循环" intro="系统围绕目标选择行动、调用工具、读取反馈、更新状态并受控停止，才从回答走向完成任务。" />
            <Definition term="智能体" simple="让大模型不只回答问题，还能为了完成目标，判断下一步、调用工具、读取结果并继续行动。" precise="智能体是能够感知环境状态、根据目标选择行动、通过工具影响或查询环境，并依据反馈更新状态的受控软件系统。" />
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
    // 挂载后根据 URL hash / 视口同步一次；replaceState 不会触发 hashchange。
    /* eslint-disable react-hooks/set-state-in-effect */
    if (index >= 0) setActivePage(index);
    if (matchMedia("(max-width: 760px)").matches) setSidebarOpen(false);
    /* eslint-enable react-hooks/set-state-in-effect */
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
    <main id="top" className={`paginated-course page-group-${activeCoursePage.group} ${sidebarOpen ? "sidebar-open" : "sidebar-collapsed"} view-student`}>
      <Header progressOverride={Math.round(activePage / (coursePages.length - 1) * 100)} onHome={() => goToPage(0)} sidebarOpen={sidebarOpen} onToggleSidebar={() => setSidebarOpen(value => !value)} />
      {sidebarOpen && <button type="button" className="sidebar-scrim" aria-label="关闭章节侧栏" onClick={() => setSidebarOpen(false)} />}
      <aside id="course-sidebar" className="sidenav" aria-hidden={!sidebarOpen}><div><span></span><strong>大语言模型 · 智能体 · 审计</strong></div><nav>
        <button type="button" className={activeCoursePage.id === nav[0][0] ? "active" : ""} onClick={() => goToId(nav[0][0])}><span>01</span><b>{nav[0][1]}</b><small className="nav-time">{nav[0][2]}</small></button>
        <p className="nav-part"><span>第一部分</span>技术基础</p>
        {nav.slice(1, 5).map((x, i) => <button type="button" className={activeCoursePage.id === x[0] ? "active" : ""} onClick={() => goToId(x[0])} key={x[0]}><span>{String(i + 2).padStart(2, "0")}</span><b>{x[1]}</b><small className="nav-time">{x[2]}</small></button>)}
        <p className="nav-part core"><span>第二部分</span>智能体基础与架构</p>
        {nav.slice(5, 13).map((x, i) => <button type="button" className={activeCoursePage.id === x[0] ? "active" : ""} onClick={() => goToId(x[0])} key={x[0]}><span>{String(i + 6).padStart(2, "0")}</span><b>{x[1]}</b><small className="nav-time">{x[2]}</small></button>)}
        <p className="nav-part"><span>第三部分</span>审计应用</p>
        {nav.slice(13, 19).map((x, i) => <button type="button" className={activeCoursePage.id === x[0] ? "active" : ""} onClick={() => goToId(x[0])} key={x[0]}><span>{String(i + 14).padStart(2, "0")}</span><b>{x[1]}</b><small className="nav-time">{x[2]}</small></button>)}
      </nav></aside>
      <div className="page">
        <section className="hero course-slide" hidden={activeCoursePage.id !== "cover"}>
          <div className="hero-head">
            <h1>大语言模型与智能体：基础、架构及审计应用</h1>
          </div>
          <div className="hero-path three-parts">{courseParts.map((part, index) => <a key={part.no} href={part.href} onClick={(event) => { event.preventDefault(); goToId(part.href.slice(1)); }}><span>0{index + 1}</span><strong>{part.title}</strong><small>{part.no}</small><p>{part.description}</p></a>)}</div>
        </section>

        <section id="problem" className="lesson course-slide" hidden={activeCoursePage.id !== "problem"}>
          <SectionTitle no="01" time="导言 · 约5分钟" title="导言" />
          <CourseArchitecture />
          <div className="content-block lesson-takeaways">
            <h3>主要收获</h3>
            <ol className="takeaway-grid">
              <li><span>能按问题类型选择方法，并分清：基于任务逻辑的编程、经典机器学习、神经网络与大模型——各自能解决什么、解决不了什么。</span></li>
              <li><span>分得清大语言模型与智能体：前者擅长理解与生成；后者围绕目标调用工具、根据反馈决策并受控停止。</span></li>
              <li><span>理解智能体的运行逻辑：能说出基本模块与工具反馈循环，并对权限、日志、人在回路等落地约束有初步了解。</span></li>
              <li><span>独立思考在审计场景下，自己该如何针对性地构建智能体。</span></li>
            </ol>
          </div>
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
          <div className="part-route-wrap"><FoundationChapterRoute onSelect={goToId} /></div>
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
          <Bridge from="经典机器学习的边界" problem="下一笔报销的表格特征看起来正常，真正异常却藏在票据图片里：金额数字的像素可能被改过。人工造几个表格特征已经不够。" to="人工神经网络" />
          <TeacherNote time="10分钟" question="模型给出 80% 核查概率，这是证据吗？" misconception="机器学习不是自动发现真相；Loss 下降也不等于可以直接定性。" mustSay="弱信号单独定不了性；用历史核实结果拟合组合权重，给新单排序。" canSkip="梯度公式细节。" />
        </section>

        <section id="nn" className="lesson course-slide" hidden={activeCoursePage.id !== "nn"}>
          <SectionTitle no="04" time="第一部分 · 约15分钟" title="神经网络" />
          <AnnPixelDemo />
          <InlinePythonLab
            example="neural"
            guide="先看右侧训练进度：epoch 推进时 Loss 下降、训练准确率上升。跑完后对照测试集准确率与票面 2/8/6 识别结果；参数 W1/b1/W2/b2 就是训练后要保存的东西。"
          />
          <div className="fun-demo-frame">
            <FacePredictLab />
          </div>
          <Bridge
            from="神经网络的边界"
            problem="通过这一章我们学习到，神经网络可以从高维输入中识别数字或类别，但现在我想用自然语言描述一个开放式问题：让模型读懂目标、背景与顾虑，并随着追问给出针对性反馈。我们可以通过训练某种神经网络来实现这个目标吗？"
            to="大语言模型"
          />
          <TeacherNote
            time="15分钟（主线约9分钟；室友人脸门禁案例5—7分钟）"
            question="识别出 286 后，网络知道这笔报销有问题吗？"
            misconception="识别内容不等于理解业务；神经网络不是电子大脑。"
            mustSay="强调：超多特征 → 神经网络；神经网络仍属机器学习；室友门禁案例要分清模型分类与开门规则：笑雨/骐源达到阈值才模拟开门，其他或低置信度保持关闭；真实门禁还需活体检测和备用开门方式。"
            canSkip="反向传播推导；时间紧时跳过现场照片上传，只运行笑雨照片测试一次。"
          />
        </section>

        <section id="llm" className="lesson course-slide" hidden={activeCoursePage.id !== "llm"}>
          <SectionTitle no="05" time="第一部分 · 约27分钟" title="从神经网络到大语言模型" />
          <AnnToLlmJourney />
          <Bridge
            from="大语言模型的边界"
            problem="大语言模型可以理解和生成语言，但仅靠它通常还不能持续保存状态、调用外部工具并执行现实任务。要把“会说、会分析”变成“能受控地完成任务”，还需要在它周围加入记忆、规划、工具、行动和反馈机制。"
            to="智能体 + 大语言模型"
          />
          <TeacherNote
            time="主线约27分钟（其中生成机制补充5—8分钟）"
            question="请学员不用术语复述：Transformer与普通神经网络是什么关系、在大语言模型中位于哪里？用户的一句话怎样变成完整上下文，又怎样逐Token形成回答？"
            misconception="Transformer不是外挂、不是整个大语言模型产品、也不等于Attention；Tokenizer在神经网络外；Transformer一次前向计算不会先写好整段回答；大语言模型不等于完整的智能体。"
            mustSay="沿五段主线讲；5.3必须按整体神经网络→完整大语言模型→单个Block→Attention示例→多层堆叠→语言模型输出层走完；5.5必须讲清完整上下文、Prefill、逐Token Decode和模型外生成循环。"
            canSkip="时间紧时减少架构点击次数，但不跳过Transformer位置和逐Token生成；不展开Q/K/V、分词算法、鉴权、计费、部署或厂商差异。"
          />
        </section>

        <div className="part-overview course-slide" hidden={activeCoursePage.id !== "part-2"}>
          <PartTitle id="part-2" no="第二部分 · 核心" title="从大语言模型到智能体" chapters="章节 06—13 · 主线约47分钟" lead="从一次模型调用留下的行动缺口出发，并以“主合同甲的转分包风险识别”为贯穿案例，逐步加入目标、知识、工具、状态、动态计划、权限和人工监督。" />
          <div className="part-route-wrap"><AgentPartRoute onSelect={goToId} /></div>
        </div>

        <section id="agent" className="lesson course-slide" hidden={activeCoursePage.id !== "agent"}>
          <SectionTitle no="06" time="第二部分 · 约5分钟" title="为什么仅有大语言模型还不够" />
          <section className="chapter-step"><div className="chapter-step-head"><span>6.1 · 承接第一部分</span><h3>会回答一个问题，不等于能够完成一项工作</h3><p>模型能给出合理建议，但没有真正获取合同、查询系统、比较证据或提交成果。</p></div>
            <div className="answer-work-gap"><div className="answer-sample"><span>用户</span><p>请检查这份合同是否存在转分包风险。</p><span>大语言模型</span><p>可能需要结合合同工作范围、签约主体、时间和金额进行综合判断。</p></div><div className="work-gap-list"><strong>这段回答没有完成</strong>{["获取合同与正文", "查询企业合同数据库", "搜索潜在关联合同", "调用企业判断规则", "比较工作内容与交付物", "保存分析过程", "形成报告并提交复核"].map(item => <span key={item}>{item}</span>)}</div></div>
          </section>
          <section className="chapter-step"><div className="chapter-step-head"><span>6.2 · 贯穿第二部分的案例</span><h3>接下来，用“合同甲的转分包风险识别”智能体为例，梳理智能体的架构</h3><p>用户要检查合同甲是否存在转分包风险，交付带有证据、判断依据、不确定项和复核建议的可复核的初步分析报告，而不是一句聊天回答。一次模型调用无法自行取得资料、执行查询并保存完整过程，这正是后续要补上的行动缺口。</p></div>
            <div className="call-task-compare">
              <article className="call-once-panel">
                <span>一句模型回答</span>
                <ol className="call-once-flow" aria-label="单次模型调用">
                  <li><b>01</b><strong>输入</strong></li>
                  <li aria-hidden="true"><i>↓</i></li>
                  <li><b>02</b><strong>大语言模型</strong></li>
                  <li aria-hidden="true"><i>↓</i></li>
                  <li><b>03</b><strong>文本输出</strong></li>
                </ol>
                <p>一次调用，到文字就结束。</p>
              </article>
              <article className="call-cycle-panel">
                <span>贯穿案例任务</span>
                <div className="call-cycle-track" aria-label="智能体任务步骤">
                  {[[
                    ["接收目标", "明确要检查什么"],
                    ["理解任务", "拆出范围与交付"],
                    ["获取资料", "读取合同与正文"],
                    ["调用工具", "查询、检索、比对"],
                  ], [
                    ["分析结果", "形成中间判断"],
                    ["判断是否继续", "依据反馈改道"],
                    ["执行下一步", "继续受控行动"],
                    ["形成最终产出", "可复核初步报告"],
                  ]].map((row, rowIndex) => (
                    <div key={rowIndex} className="call-cycle-block">
                      {rowIndex > 0 && <div className="call-cycle-turn" aria-hidden="true"><i>↓</i></div>}
                      <ol className="call-cycle-row">
                        {row.map(([title, detail], index) => {
                          const no = String(rowIndex * 4 + index + 1).padStart(2, "0");
                          return (
                            <Fragment key={title}>
                              <li>
                                <b>{no}</b>
                                <strong>{title}</strong>
                                <small>{detail}</small>
                              </li>
                              {index < row.length - 1 && <li aria-hidden="true"><i>→</i></li>}
                            </Fragment>
                          );
                        })}
                      </ol>
                    </div>
                  ))}
                </div>
                <p>不是一次生成，而是沿目标持续行动，直到可交付或转人工。</p>
              </article>
            </div>
          </section>
          <LessonTakeaway>大语言模型提供语言理解、内容生成和推理能力；完成现实任务还需要连接外部世界并持续运行的系统。</LessonTakeaway>
          <TeacherNote time="5分钟" question="这段模型回答里，哪一件真实工作已经被执行了？" misconception="回答看起来专业，不代表任务已经完成。" mustSay="先明确贯穿案例的任务与可复核交付物；再说明会回答不等于会完成工作，合同、工具、状态和正式产出仍有缺口。" />
        </section>

        <section id="agent-definition" className="lesson course-slide" hidden={activeCoursePage.id !== "agent-definition"}>
          <SectionTitle no="07" time="第二部分 · 约6分钟" title="什么是智能体" />
          <section className="chapter-step"><div className="chapter-step-head"><span>7.1 · 定义</span><h3>智能体不是单一模型，而是一套运行系统</h3><p>它围绕目标获取信息、作出判断、调用工具、执行动作，并根据结果继续工作。</p></div>
            <Definition term="智能体" simple="一套能够围绕目标获取信息、作出判断、调用工具、执行动作，并根据执行结果继续工作的人工智能系统。" precise="智能体通常以大语言模型作为理解和推理核心，并由上下文、知识、状态、工具、权限、运行机制和人工监督共同组成；不同系统具有不同自主程度。" />
            <div className="agent-boundary-strip"><div><span>大语言模型</span><strong>能力核心</strong><p>理解上下文，输出文字、判断或行动请求。</p></div><div><span>应用程序</span><strong>运行与执行</strong><p>校验权限、调用工具、保存状态并控制循环。</p></div><div><span>智能体</span><strong>完整系统</strong><p>依据反馈继续、改道或停止。</p></div><div><span>人工</span><strong>监督与责任</strong><p>确认高风险操作并承担最终专业判断。</p></div></div>
          </section>
          <section className="chapter-step"><div className="chapter-step-head"><span>7.2 · 系统组成</span><h3>在模型周围加入知识、工具、状态、权限与运行机制</h3></div><AgentArchitectureMap /></section>
          <section className="chapter-step"><div className="chapter-step-head"><span>7.3 · 边界</span><h3>聊天网页、检索问答和一次工具调用都不等价于智能体</h3><p>关键是系统能否围绕目标读取反馈，更新状态，并受控选择下一步。</p></div>
            <div className="agent-definition-boundaries">{[["聊天网页", "只是交互界面。"], ["固定工作流", "路径主要预先确定，可以与智能体组合。"], ["知识检索问答", "有知识能力不等于具备完整行动循环。"], ["一次工具调用", "还要看反馈是否改变后续路径。"], ["对话历史", "由应用保存、筛选并重新提供，不等于永久记忆。"], ["完全自主", "不是智能体的必要条件。"]].map(([title, detail]) => <div key={title}><strong>{title}</strong><p>{detail}</p></div>)}</div>
          </section>
          <LessonTakeaway>模型提出工具请求，应用程序校验身份、参数和权限后真正执行，再把结果送回智能体状态。</LessonTakeaway>
          <TeacherNote time="6分钟" question="模型生成“查询合同甲”的请求后，谁有权真正进入合同系统？" misconception="模型不是业务系统执行者；智能体也不意味着完全自主。" mustSay="讲清目标、模型、知识、状态、工具、权限和运行机制。" />
        </section>

        <section id="agent-loop" className="lesson course-slide" hidden={activeCoursePage.id !== "agent-loop"}>
          <SectionTitle no="08" time="第二部分 · 约7分钟" title="智能体是怎样工作的" />
          <section className="chapter-step"><div className="chapter-step-head"><span>8.1 · 完整运行</span><h3>沿用同一任务，逐步观察目标、工具、状态和判断怎样变化</h3><p>下面继续运行 06 提出的主合同甲任务；每一步展示当前目标、工具输入、工具输出和下一步判断，数据均为前端教学模拟。</p></div><AgentLoopSimulator /></section>
          <section className="chapter-step"><div className="chapter-step-head"><span>8.2 · 核心循环</span><h3>任务没有完成，就依据新观察继续行动</h3><p>完成、失败、证据不足、权限阻断或触发人工关口时停止。</p></div>
            <div className="agent-core-loop">
              <div className="agent-core-loop-steps" aria-label="核心循环六步">
                {["目标", "判断下一步", "调用工具", "获得结果", "更新状态", "是否完成"].map((item, index) => (
                  <div key={item}>
                    <b>{String(index + 1).padStart(2, "0")}</b>
                    <strong>{item}</strong>
                    {index < 5 && <i aria-hidden="true">→</i>}
                  </div>
                ))}
              </div>
              <div className="agent-core-loop-branch" aria-label="是否完成的分支">
                <section>
                  <span>否</span>
                  <strong>带着新状态继续</strong>
                  <small>回到「判断下一步」</small>
                </section>
                <section>
                  <span>是</span>
                  <strong>输出并保存轨迹</strong>
                  <small>安全停止</small>
                </section>
              </div>
            </div>
          </section>
          <LessonTakeaway>智能体与普通聊天调用最重要的区别，不是回答更长，而是在目标尚未完成时，根据执行结果继续采取下一步行动。</LessonTakeaway>
          <TeacherNote time="7分钟" question="为什么取得主合同后不能直接生成结论？" misconception="静态步骤清单不等于智能体循环；无结果也不能当作没有风险。" mustSay="模型选择工具，运行层执行，观察进入状态，系统继续、停止或转人工。" />
        </section>

        <section id="agent-knowledge" className="lesson course-slide" hidden={activeCoursePage.id !== "agent-knowledge"}>
          <SectionTitle no="09" time="第二部分 · 约5分钟" title="知识型智能体" />
          <section className="chapter-step"><div className="chapter-step-head"><span>9.1 · 定义与结构</span><h3>检索、理解、归纳知识，并给出有依据的回答</h3><p>回答受知识版本、检索结果和访问权限约束。</p></div><AgentTypeSwitcher initial="knowledge" /></section>
          <section className="chapter-step"><div className="chapter-step-head"><span>9.2 · 制度知识助手</span><h3>答案之外，还要展示条款位置、生效时间与限制</h3><p>制度冲突或材料不全时提示核实，不补出一个确定答案。</p></div>
            <div className="knowledge-case">
              <section className="knowledge-case-ask">
                <span>用户问题</span>
                <strong>金额超过标准的服务采购需要哪些审批？</strong>
                <ol className="knowledge-case-flow" aria-label="制度知识助手步骤">
                  {["识别金额标准与审批流程", "检索现行采购制度", "找到分级条款和权限表", "核对版本与生效日期", "综合回答并绑定来源"].map((item, index) => (
                    <li key={item}>
                      <b>{String(index + 1).padStart(2, "0")}</b>
                      <span>{item}</span>
                    </li>
                  ))}
                </ol>
              </section>
              <section className="knowledge-case-answer">
                <span>回答示例</span>
                <p className="knowledge-case-reply">该金额区间需依次经过部门负责人、采购管理部门和分管领导审批。</p>
                <div className="knowledge-case-source">
                  <span>依据与定位</span>
                  <strong>第四章第十二条</strong>
                  <strong>附件二《采购审批权限表》</strong>
                </div>
                <aside className="knowledge-case-caveat">
                  <span>限制提示</span>
                  <p>紧急采购或单一来源采购还需适用专项程序。</p>
                </aside>
              </section>
            </div>
          </section>
          <LessonTakeaway>知识型智能体让模型更好地“知道”：答案要有来源，材料不足要说不足，用户只能看到被授权的知识。</LessonTakeaway>
          <TeacherNote time="5分钟" question="检索不到制度原文时，系统应该凭模型常识回答吗？" misconception="知识库接入不代表知识永远正确。" mustSay="这是海能智能体平台的业务分类，不是唯一行业标准；重要判断仍需核实。" />
        </section>

        <section id="agent-task" className="lesson course-slide" hidden={activeCoursePage.id !== "agent-task"}>
          <SectionTitle no="10" time="第二部分 · 约5分钟" title="任务型智能体" />
          <section className="chapter-step"><div className="chapter-step-head"><span>10.1 · 定义与结构</span><h3>按照相对明确的流程，调用工具完成具体任务</h3><p>如果系统只按固定条件机械执行，不需要模型理解非结构化信息，它更接近传统自动化流程。</p></div><AgentTypeSwitcher initial="task" /></section>
          <section className="chapter-step"><div className="chapter-step-head"><span>10.2 · 案例：会议纪要录音批量结构化入湖</span><h3>将会议的录音材料转化为结构化纪要，再按流程写入任务系统</h3><p>当负责人或截止时间缺失时，暂停并请求人工补充。</p></div>
            <div className="task-case-flow">{["获取录音和材料", "语音转换为文字", "识别人员与议题", "提取决定和待办", "识别负责人和时间", "生成结构化纪要", "写入任务系统", "发送确认"].map((item, index) => <div key={item}><b>{String(index + 1).padStart(2, "0")}</b><strong>{item}</strong>{index < 7 && <i>→</i>}</div>)}</div>
            <div className="task-meeting-case">
              <section className="meeting-case-context"><span>输入 · 非结构化材料</span><h4>会议录音，外加议程与参会名单</h4><p>讨论内容还散落在口语和附件里。系统要先转写成文字，再抽出议题、决定、待办、负责人和时间，才能进入任务系统。</p><ul className="meeting-input-list"><li>会议录音（口头决定、口头分工）</li><li>议程草稿与参会名单</li><li>会前说明材料</li></ul></section>
              <section className="meeting-case-extraction"><span>模型理解 · 结构化结果</span><dl><dt>议题</dt><dd>合同审计智能体试点</dd><dt>决定</dt><dd>先验证转分包识别</dd><dt>待办</dt><dd>准备脱敏合同样本；形成试点评估表</dd><dt>负责人</dt><dd>张某 <em className="confirmed">已确认</em></dd><dt>截止时间</dt><dd>“8 月中旬前” <em className="pending">表述含糊</em></dd></dl></section>
              <section className="meeting-case-control"><span>应用校验 · 受控写入</span><h4>日期不明确，先暂停写入</h4><p>系统不能把“8 月中旬前”猜成某一天，而是请求会议主持人补充具体日期。</p><ol className="meeting-control-flow" aria-label="受控写入校验">{[["01", "确认负责人和具体截止日期"], ["02", "校验任务系统写入权限"], ["03", "发送前确认接收人与内容"]].map(([no, text], index, list) => (
                <Fragment key={no}>
                  <li><b>{no}</b><span>{text}</span></li>
                  {index < list.length - 1 && <li aria-hidden="true"><i>↓</i></li>}
                </Fragment>
              ))}</ol><div className="meeting-write-result"><small>人工补充并通过校验后</small><strong>生成结构化会议纪要 → 写入两项待办 → 保存写入回执与通知结果</strong></div></section>
            </div>
          </section>
          <LessonTakeaway>任务型智能体让模型按流程“去做”；高风险操作必须审批，工具结果必须校验，模型不能绕过业务权限。</LessonTakeaway>
          <TeacherNote time="5分钟" question="固定规则已经能处理的流程，加入模型会增加什么风险？" misconception="跨多个系统不自动等于智能体。" mustSay="总体流程预设，关键节点由模型处理；写入和通知前要有权限与确认。" />
        </section>

        <section id="agent-planning" className="lesson course-slide" hidden={activeCoursePage.id !== "agent-planning"}>
          <SectionTitle no="11" time="第二部分 · 约7分钟" title="规划型智能体" />
          <section className="chapter-step"><div className="chapter-step-head"><span>11.1 · 定义与区别</span><h3>拆分复杂目标，并根据结果调整后续计划</h3><p></p></div>
            <AgentTypeSwitcher initial="planning" />
            <div className="task-planning-compare">
              <div>
                <span>任务型</span>
                <div className="task-planning-flow">
                  <strong>明确任务</strong><i>→</i><strong>固定流程</strong><i>→</i><strong>节点判断</strong><i>→</i><strong>输出</strong>
                </div>
              </div>
              <div>
                <span>规划型</span>
                <div className="task-planning-flow">
                  <strong>复杂目标</strong><i>→</i><strong>初步计划</strong><i>→</i><strong>执行与观察</strong><i>→</i><strong>修改计划</strong><i>→</i><strong>完成</strong>
                </div>
              </div>
            </div>
          </section>
          <section className="chapter-step"><div className="chapter-step-head"><span>11.2 · 案例：近一年核心系统故障根因专项排查</span></div><PlanningAdjustmentLab /></section>
          <section className="chapter-step"><div className="chapter-step-head"><span>11.3 · 运行边界</span><h3>规划能力越强，权限、资源、停止与接管越重要</h3><p>不能无限循环、绕过审批或在没有证据时形成最终结论。</p></div><div className="planning-guardrails">{["最大执行步骤", "时间与资源限制", "工具白名单", "数据访问权限", "高风险操作审批", "运行日志", "异常中止", "人工接管", "结果复核"].map(item => <span key={item}>{item}</span>)}</div></section>
          <LessonTakeaway>规划型智能体让模型决定“先做什么、再做什么”；它通常更难稳定实施，也必须在受控范围内运行。</LessonTakeaway>
          <TeacherNote time="7分钟" question="标题完全不同、现象却相同的故障被遗漏时，系统怎样调整？" misconception="规划型不代表完全自主，动态计划也不能动态扩大权限。" mustSay="计划可以改，权限不能由模型自己扩大。" />
        </section>

        <section id="agent-case" className="lesson course-slide" hidden={activeCoursePage.id !== "agent-case"}>
          <SectionTitle no="12" time="第二部分 · 约7分钟" title="一个完整的组合型智能体应用" />
          <section className="chapter-step"><div className="chapter-step-head"><span>12.1 · 转分包风险识别</span><h3>规划、知识与任务执行能力围绕同一目标协同</h3><p>沿时间线查看合同获取、规则检索、候选召回、证据比较、人工确认和报告生成。</p></div><CombinedContractCaseLab /></section>
          <section className="chapter-step"><div className="chapter-step-head"><span>12.2 · 能力组合</span><h3>三类能力是同一应用中的不同职责</h3><p>规划决定下一步，知识提供依据，任务能力受控执行工具。</p></div>
            <div className="combined-capabilities"><div><span>规划能力</span><strong>决定检查路径</strong><p>获取主合同、搜索候选、判断证据强度。</p></div><div><span>知识能力</span><strong>提供专业依据</strong><p>检索制度、案例和风险标准。</p></div><div><span>任务能力</span><strong>调用工具完成动作</strong><p>查询、读取、检索、分析和生成报告。</p></div><div><span>人工监督</span><strong>把守高风险节点</strong><p>处理冲突、敏感访问、正式结论和外发。</p></div></div>
          </section>
          <LessonTakeaway>完整交付不是一个风险标签，而是结论、证据、推理依据、不确定性、后续建议和人工确认记录。</LessonTakeaway>
          <TeacherNote time="7分钟" question="时间线上哪一步体现知识、规划和人工责任？" misconception="三类智能体不是互斥产品，风险分也不是审计结论。" mustSay="走到证据链、不确定性、人工确认和安全停止。" />
        </section>

        <section id="agent-value" className="lesson course-slide" hidden={activeCoursePage.id !== "agent-value"}>
          <SectionTitle no="13" time="第二部分 · 约5分钟" title="智能体带来的价值与边界" />
          <section className="chapter-step"><div className="chapter-step-head"><span>13.1 · 工作方式变化</span><h3>价值不只是节省成本，而是任务怎样被重新组织</h3><p>系统扩大覆盖、串联信息和保留过程；人转向关键判断、异常处理和最终决策。</p></div>
            <div className="agent-value-shifts">{[["从问答到任务", "人查资料、操作系统、整理结果", "用户提出目标，系统协助完成中间过程"], ["从信息分散到统一调用", "制度、合同和案例分散", "按权限检索并组织相关信息"], ["从逐份检查到穿透分析", "人工抽样有限合同", "系统全量初筛，人工复核重点"], ["从固定流程到处理异常", "材料缺失时停止", "调整步骤或请求人工"], ["从黑盒到可追溯", "只看到风险标签", "保留资料、工具、理由与人工决定"]].map(([title, before, after]) => <div key={title}><strong>{title}</strong><p><span>以前</span>{before}</p><p><span>现在</span>{after}</p></div>)}</div>
          </section>
          <section className="chapter-step"><div className="chapter-step-head"><span>13.2 · 风险与治理</span><h3>工具行动会放大错误影响，权限要比文字生成更谨慎</h3><p>模型和工具都可能出错；无结果、错误结果和权限拒绝不能被改写成正常。</p></div>
            <div className="agent-risk-governance"><div><span>可能出错</span>{["误解任务", "忽略证据", "选择错误工具", "错误解释结果"].map(item => <b key={item}>{item}</b>)}</div><div><span>行动放大影响</span>{["错误写入", "错误通知", "错误提交", "数据泄露"].map(item => <b key={item}>{item}</b>)}</div><div><span>必须治理</span>{["身份与权限", "工具白名单", "输入输出校验", "操作日志", "人工审批", "资源限制", "异常中止", "结果复核", "责任边界"].map(item => <b key={item}>{item}</b>)}</div></div>
          </section>
          <section className="chapter-step"><div className="chapter-step-head"><span>13.3 · 总结</span><h3>模型是能力核心，企业智能体是完整运行系统</h3><p>逐步加入知识、工具、状态、计划、权限、流程和人工监督。</p></div>
            <div className="agent-evolution-chain">{["大语言模型", "加入企业知识", "知识型智能体", "加入工具与流程", "任务型智能体", "加入状态与动态计划", "规划型智能体", "企业智能体系统"].map((item, index) => <div key={item}><b>{String(index + 1).padStart(2, "0")}</b><strong>{item}</strong>{index < 7 && <i>→</i>}</div>)}</div>
            <blockquote className="agent-closing-quote">第一部分中，大语言模型是理解语言并生成回答的能力核心。第二部分中，我们在它周围加入知识、工具、状态、规划、行动、反馈、权限和人工监督，使系统开始在明确边界内协助人完成真实工作。</blockquote>
          </section>
          <LessonTakeaway>智能体能力越强、可以采取的行动越多，就越需要清晰的权限、规则、监督和责任机制。</LessonTakeaway>
          <Bridge from="通用企业智能体" problem="进入审计后，还要把目标改写为审计工作产品，并将职业判断、复核与签发责任明确留给审计人员。" to="智能体在审计中的应用" />
          <TeacherNote time="5分钟" question="任务更快但越权和错误写入增加，能否算成功？" misconception="智能体价值不是取消人工；全量初筛也不等于自动定性。" mustSay="用工作方式变化讲价值，用错误放大效应讲边界。" />
        </section>

        <div className="part-overview course-slide" hidden={activeCoursePage.id !== "part-3"}>
          <PartTitle id="part-3" no="第三部分 · 核心" title="智能体如何进入审计工作" chapters="章节 14—19 · 主线约60分钟" lead="用资料解析、智能问数与数据分析、审计报告生成三个完整案例，带领学习者从业务问题逐步构思知识、工具、权限、证据和人工关口。" />
          <div className="part-route-wrap"><AuditApplicationRoute onSelect={goToId} /></div>
        </div>

        <section id="audit" className="lesson course-slide" hidden={activeCoursePage.id !== "audit"}>
          <SectionTitle no="14" time="第三部分 · 约6分钟" title="从审计工作链理解三个智能体" />
          <section className="chapter-step"><div className="chapter-step-head"><span>14.1 · 真实任务</span><h3>数百份异构资料的集成、平台数据智能取数和分析以及审计报告的智能撰写，不能一次交给模型解决</h3><p>文件格式、证据定位、业务口径、数据权限、报告类型与人工责任界定等都需要专门系统处理。</p></div><AuditChainChallenge /></section>
          <section className="chapter-step"><div className="chapter-step-head"><span>14.2 · 三个智能体案例</span><h3>资料进入、可信分析和成果形成组成完整审计工作链</h3><p>三个智能体可以单独工作，也通过统一证据、权限、任务状态和人工审批串联。</p></div>
            <div className="audit-three-chain"><div><span>资料</span><strong>异构审计资料解析</strong><p>识别格式、调用解析工具、恢复结构、定位来源并形成证据。</p></div><div><span>数据</span><strong>智能问数与分析</strong><p>理解业务问题、匹配指标口径、强制权限、安全查询并分析。</p></div><div><span>成果</span><strong>智能生成审计报告</strong><p>依据已确认发现、证据、制度和模板形成可审核草稿。</p></div></div>
          </section>
          <section className="chapter-step"><div className="chapter-step-head"><span>14.3 · 统一设计问题</span><h3>先问目标、输入、知识、工具、权限和验证，再考虑模型</h3></div><AuditDesignWorkbench /></section>
          <LessonTakeaway>三个智能体分别解决资料、数据和成果环节；它们共享证据与权限体系，但任何正式结论都要由审计人员确认。</LessonTakeaway>
          <TeacherNote time="6分钟" question="把全部文件、平台数据和历史报告一次交给模型，最先失去的是格式、权限还是证据定位？" misconception="一个模型调用不能同时替代文件解析、数据库权限和报告审批。" mustSay="先让学员选择，再揭示三类系统；六个设计问题贯穿第三部分。" />
        </section>

        <section id="audit-documents" className="lesson course-slide" hidden={activeCoursePage.id !== "audit-documents"}>
          <SectionTitle no="15" time="第三部分 · 约12分钟" title="案例一：怎样让智能体读懂各种审计资料" />
          <section className="chapter-step"><div className="chapter-step-head"><span>15.1 · 文件路由</span><h3>先识别文件类型、可读性和安全状态，再选择专门工具</h3><p>便携式文档、图片和自由文本通常是非结构化或半结构化资料；电子表格通常是结构化或半结构化数据；文字处理文档本身具有标题、表格和批注等结构。</p></div><DocumentParsingLab /></section>
          <section className="chapter-step"><div className="chapter-step-head"><span>15.2 · 从解析结果到证据</span><h3>识别出文字只是开始，还要恢复结构、校验质量并保留原始位置</h3><p>智能体选择工具和组织分析；页面拆分、文字识别、表格读取与文档结构恢复由专门程序或模型完成。</p></div>
            <div className="document-evidence-flow">{["安全与权限检查", "文件类型识别", "解析工具路由", "统一文档模型", "字段与实体提取", "跨文档关联", "冲突与异常检测", "证据索引", "人工复核"].map((item, index) => <div key={item}><b>{String(index + 1).padStart(2, "0")}</b><strong>{item}</strong>{index < 8 && <i>→</i>}</div>)}</div>
            <EvidenceConflictBoard />
          </section>
          <section className="chapter-step"><div className="chapter-step-head"><span>15.3 · 跨文档关联</span><h3>语义相似帮助发现关系，确定性字段优先完成校验</h3><p>合同编号、主体代码、金额和日期采用规则精确匹配；项目名称和工作范围可用语义相似发现候选关系。</p></div>
            <div className="document-link-map"><div><span>合同扫描件</span><strong>合同编号甲-2025-0312</strong><small>金额860万元 · 供应商某技术服务公司</small></div><div><span>付款台账</span><strong>相同合同编号</strong><small>累计830万元 · 汇总表!D8</small></div><div><span>会议纪要</span><strong>相同项目与供应商</strong><small>启动日期早于合同签订日</small></div><div><span>现场照片</span><strong>相同项目名称</strong><small>印章主体低置信度</small></div><section><span>证据关系图</span><b>合同编号精确关联</b><b>供应商代码精确关联</b><b>项目名称语义候选</b><b>日期和金额规则校验</b></section></div>
          </section>
          <section className="chapter-step"><div className="chapter-step-head"><span>15.4 · 结果与评价</span><h3>目标不是把文件变成一大段文字，而是形成可追溯、可关联、可验证的证据</h3><p>所有数量均为教学模拟。</p></div>
            <div className="document-output-card"><div><span>解析概况</span><strong>7份文件 · 42页 · 3个工作表 · 2张图片</strong><p>提取合同金额860万元、签订日期2025年3月12日、供应商和工作范围。</p></div><div><span>发现异常</span><ol><li>付款台账与合同金额相差30万元。</li><li>会议纪要中的启动日期早于合同签订日期。</li><li>一份附件签章页识别置信度较低。</li></ol></div><div><span>评估指标</span><p>解析成功率 · 文字准确率 · 表格结构还原 · 字段提取 · 来源定位覆盖 · 冲突召回 · 人工修正率 · 平均处理时间</p></div></div>
          </section>
          <LessonTakeaway>异构资料解析智能体把不同格式转换为统一证据对象；低置信度、结构异常和跨文件冲突必须保留来源并转人工核实。</LessonTakeaway>
          <TeacherNote time="12分钟" question="扫描金额识别成“捌佰陆拾万无整”，能否直接用于报告？电子表格汇总和明细不同又该相信谁？" misconception="模型不天然精确解析所有文件；电子表格也不是普通长文本。" mustSay="专门工具、置信度、页码/单元格、冲突保留和人工复核。" canSkip="文件路由可只切换扫描件与电子表格，但必须展示文字处理文档结构边界。" />
        </section>

        <section id="audit-data" className="lesson course-slide" hidden={activeCoursePage.id !== "audit-data"}>
          <SectionTitle no="16" time="第三部分 · 约12分钟" title="案例二：怎样用自然语言安全查询审计数据" />
          <section className="chapter-step"><div className="chapter-step-head"><span>16.1 · 业务问题</span><h3>模型不能根据常识猜审计数字，必须通过受控工具查询真实数据</h3><p>同一个问题在总部、分公司和项目组身份下应得到不同授权范围的结果。</p></div><SecureQueryLab /></section>
          <section className="chapter-step"><div className="chapter-step-head"><span>16.2 · 权限与语义</span><h3>数据库字段说明数据在哪里，语义层说明业务指标是什么意思</h3><p>权限由身份认证、权限服务、查询网关和数据策略强制执行，不能只提醒模型“不要越权”。</p></div>
            <div className="query-control-architecture"><div><span>用户身份</span><strong>角色、组织、项目</strong><p>认证谁在提问。</p></div><i>↓</i><div><span>业务语义层</span><strong>指标、口径、关系、同义词</strong><p>把“单一来源采购金额”定义为相应合同金额合计。</p></div><i>↓</i><div><span>权限服务</span><strong>表、字段、行、项目和时间范围</strong><p>生成模型不可修改的数据范围。</p></div><i>↓</i><div><span>安全查询服务</span><strong>只读、白名单、超时、脱敏、日志</strong><p>前端不直接连接数据库。</p></div><i>↓</i><div><span>结果分析</span><strong>复算、同比、排名、趋势和贡献因素</strong><p>模型只分析已经过滤和校验的结果。</p></div></div>
          </section>
          <section className="chapter-step"><div className="chapter-step-head"><span>16.3 · 异常处理</span><h3>空结果、语句失败和敏感问题都有明确处理分支</h3><p>不能把“无权限”“数据未更新”或“查询失败”改写成“没有数据”。</p></div>
            <div className="query-exception-grid">{[["口径不明确", "确认合同金额还是付款金额、时间范围、税口径和采购类型。"], ["结果为空", "检查权限、时间、指标、数据更新时间和字段映射。"], ["语句失败", "读取错误、修正后重新校验；限制最大重试，仍失败转技术人员。"], ["敏感信息", "拒绝、聚合、脱敏或要求额外审批。"], ["数据异常", "保留原始结果，执行复算、勾稽和数量级检查。"], ["资源风险", "先检查执行计划，限制扫描范围、返回行数和超时。"]].map(([title, detail]) => <div key={title}><strong>{title}</strong><p>{detail}</p></div>)}</div>
          </section>
          <LessonTakeaway>智能问数不是单纯把自然语言转换为查询语句，而是语义、身份权限、安全执行、结果校验、统计分析和可追溯记录的组合系统。</LessonTakeaway>
          <TeacherNote time="12分钟" question="只读查询是否一定安全？同一问题为什么三个角色看到的单位数量不同？" misconception="模型不能决定用户权限；前端不得连接生产数据库；数据库返回也不等于数字已校验。" mustSay="语义层、权限注入、安全校验、只读环境、分析和追溯必须完整。" canSkip="查询步骤可点击到权限注入与执行，至少切换总部和分公司两个身份。" />
        </section>

        <section id="audit-report" className="lesson course-slide" hidden={activeCoursePage.id !== "audit-report"}>
          <SectionTitle no="17" time="第三部分 · 约15分钟" title="案例三：怎样生成真正可用的审计报告" />
          <section className="chapter-step"><div className="chapter-step-head"><span>17.1 · 先看失败方式</span><h3>“写得像报告”不等于结构正确、事实准确、证据充分</h3><p>简单要求模型根据现有资料写报告，会混淆类型、范围、金额和证据状态，也可能引用不存在或失效的制度。</p></div>
            <div className="report-failure-board"><div><span>简单指令</span><strong>“根据现有资料帮我写一份审计报告。”</strong></div><i>→</i><div><span>表面结果</span><strong>文字正式、结构似乎完整</strong></div><i>→</i><div><span>真实风险</span>{["不知道报告类型与读者", "未确认事实被写成结论", "合同金额和付款金额混淆", "制度引用可能不存在", "句子无法回到证据", "不符合审批与模板"].map(item => <b key={item}>{item}</b>)}</div></div>
          </section>
          <section className="chapter-step"><div className="chapter-step-head"><span>17.2 · 三层架构与技术路线</span><h3>先事实证据，再审计分析，最后报告表达</h3><p>历史报告需要分类、版本、批准状态和保密等级；个人风格转成可查看、可编辑、可确认的规则。</p></div><ReportArchitectureBoard /></section>
          <section className="chapter-step"><div className="chapter-step-head"><span>17.3 · 生成与审核工作台</span><h3>选择类型与范围 → 导入发现 → 检查证据 → 确认提纲 → 分段生成 → 人工审核</h3><p>尝试切换报告类型、风格，调整提纲顺序，并接受或退回当前段落。</p></div><ReportGenerationStudio /></section>
          <section className="chapter-step"><div className="chapter-step-head"><span>17.4 · 质量门与版本记录</span><h3>事实、数字、制度、证据、模板和风格逐项检查</h3><p>表达层不能修改事实；证据不足时保留不确定性并阻断确定性结论。</p></div>
            <div className="report-quality-gates">{[["数字一致", "金额、合计、百分比、时间范围和单位统一"], ["事实一致", "主体、项目、日期、合同编号和结论状态"], ["证据覆盖", "关键事实、数字和制度引用均可回查"], ["不确定性", "已确认、高概率、待核实和建议检查严格区分"], ["模板合规", "必填章节、标题层级、附件、审批和保密标识"], ["风格一致", "句式、术语、语气、篇幅、建议与禁止词"]].map(([title, detail]) => <div key={title}><strong>{title}</strong><p>{detail}</p></div>)}</div>
            <div className="report-version-log"><span>每次人工修改保留</span><b>修改人员</b><b>修改时间</b><b>修改前内容</b><b>修改后内容</b><b>修改原因</b><b>证据版本</b><b>审批状态</b></div>
          </section>
          <LessonTakeaway>报告生成必须从证据向报告生成，而不是从语言向事实倒推；先确认提纲、再分段生成、逐句复核，正式报告责任仍由审计人员承担。</LessonTakeaway>
          <TeacherNote time="15分钟" question="历史报告越多，直接混进同一知识库是否越好？为什么先提纲后正文比一次生成全文可靠？" misconception="检索增强生成不是全部方案；微调不能替代证据检索、事实校验、权限和人工复核。" mustSay="历史报告分类质量筛选、六层知识、结构化发现、三层架构、提纲确认、质量门和人工审核。" canSkip="风格可只切换两项，但不能跳过提纲编辑和接受/退回动作。" />
        </section>

        <section id="audit-collaboration" className="lesson course-slide" hidden={activeCoursePage.id !== "audit-collaboration"}>
          <SectionTitle no="18" time="第三部分 · 约7分钟" title="构想：智能体协作完成审计任务" />
          <section className="chapter-step"><div className="chapter-step-head"><span>18.1 · 完整演示任务</span><h3>审计任务：对项目甲做采购与合同初步分析</h3><p>项目组交来合同扫描件、付款台账、供应商材料，以及平台采购宽表。需要核对合同金额与台账是否一致，查清近三年供应商趋势和单一来源是否异常，并形成供项目组讨论的报告草稿；正式定性仍由审计人员复核。</p></div><AuditCollaborationLab /></section>
          <section className="chapter-step"><div className="chapter-step-head"><span>18.2 · 统一底座</span><h3>三个智能体不能各建一套数据、权限和日志</h3><p>统一证据对象、查询结果对象、审计发现对象和报告对象，让每条报告句子可以回到数据或文件。</p></div>
            <div className="audit-shared-stack"><div><strong>审计人员与审批</strong><p>确认事实、判断风险、审核报告并承担责任。</p></div><div><strong>三个智能体与任务状态</strong><p>资料解析、智能问数、报告生成共享项目目标。</p></div><div><strong>证据、查询、发现和报告对象</strong><p>统一编号、版本、权限范围、状态和责任人。</p></div><div><strong>工具、知识与权限服务</strong><p>文件解析、只读查询、制度检索、质量校验和人工关口。</p></div><div><strong>文件、审计宽表与制度来源</strong><p>只访问项目与组织已授权的数据和资料。</p></div></div>
          </section>
          <LessonTakeaway>三个智能体通过统一身份、权限、证据编号、任务状态和审核记录串成系统；报告中的事实可以逐级回到发现、查询结果和原始资料。</LessonTakeaway>
          <TeacherNote time="7分钟" question="如果资料解析、智能问数和报告生成分别使用不同证据编号，最后会发生什么？" misconception="共享同一个模型不等于共享证据和权限底座。" mustSay="沿十二步演示完整任务；四类对象接口与统一底座是串联关键。" />
        </section>

        <section id="audit-governance" className="lesson course-slide" hidden={activeCoursePage.id !== "audit-governance"}>
          <SectionTitle no="19" time="第三部分 · 约8分钟" title="审计智能体的效果、评估和治理边界" />
          <section className="chapter-step"><div className="chapter-step-head"><span>19.1 · 效果与指标</span><h3>不只说提质增效，要说明工作方式怎样变化、结果怎样评价</h3><p>切换具体效果、评估指标和治理边界，观察三个案例分别需要什么证据。</p></div><AuditGovernanceDashboard /></section>
          <section className="chapter-step"><div className="chapter-step-head"><span>19.2 · 事实与责任分层</span><h3>智能体建议不能自动成为正式审计结论</h3><p>从原始资料到正式成果，每一层都有来源、状态和责任人。</p></div>
            <div className="audit-responsibility-chain">{["原始证据", "工具提取事实", "系统分析结果", "智能体建议", "审计人员确认", "正式审计结论"].map((item, index) => <div key={item}><b>{String(index + 1).padStart(2, "0")}</b><strong>{item}</strong>{index < 5 && <i>→</i>}</div>)}</div>
            <div className="audit-security-matrix">{[["数据安全", "不越权、脱敏、加密、批准的模型服务、最小日志"], ["权限安全", "身份、组织、项目、行、字段、工具、审批、导出权限"], ["查询安全", "只读、白名单、权限注入、扫描限制、脱敏、超时和日志"], ["报告安全", "不虚构事实制度、不隐去不确定性、人工审核、版本追踪"], ["操作安全", "高风险动作暂停、人工确认、异常中止和可回退"], ["责任安全", "模型输出有内部记录，审计人员负责证据评价、定性和签发"]].map(([title, detail]) => <div key={title}><strong>{title}</strong><p>{detail}</p></div>)}</div>
          </section>
          <section className="chapter-step"><div className="chapter-step-head"><span>19.3 · 全课收束</span><h3>让机器承担解析、查询、比对、整理和草拟，让人负责证据、判断与责任</h3><p>规则、模型、工具、工作流和智能体各自承担合适的任务，不把确定性程序包装成模型能力。</p></div>
            <div className="closing"><p>审计智能体的价值，不是替代审计人员作出职业判断。</p><h3>资料可解析，数字可复算，证据可回查，过程可审核；<br />正式结论由审计人员确认并承担责任。</h3><div><span>身份明确</span><span>权限可控</span><span>数据可信</span><span>证据可查</span><span>版本可追</span><span>人工复核</span></div></div>
            <Quiz />
          </section>
          <LessonTakeaway>审计智能体必须同时证明结果可靠、权限没有被绕过、过程可以复盘、责任边界清晰；效率提升只是评价的一部分。</LessonTakeaway>
          <TeacherNote time="8分钟" question="系统解析正确、查询快速、报告流畅，但证据无法回查，能否进入正式流程？" misconception="自动化覆盖越高不等于风险越低；智能体输出不等于审计证据或结论。" mustSay="具体效果、分功能指标、数据/权限/事实/查询/报告安全和正式责任。" />
        </section>

        <footer hidden={activeCoursePage.id !== "audit-governance"}><strong>大语言模型与智能体：基础、架构及审计应用</strong><span>从问题出发的能力链：规则 → 机器学习 → 神经网络 → 大语言模型 → 智能体</span><button type="button" onClick={() => goToPage(0)}>回到首页 ↑</button></footer>
      </div>
      <CoursePager activeIndex={activePage} onChange={goToPage} />
    </main>
  </PythonKernelProvider>;
}
