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
import { CrossEntropyPlot, ReluPlot, SigmoidPlot } from "./math-plots";
import { NetworkComparePanel } from "./nn-diagrams";
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
  ["code", "基于任务逻辑的编程", "10′"],
  ["ml", "经典机器学习", "15′"],
  ["nn", "ANN", "15′"],
  ["llm", "从 ANN 到 LLM", "18′"],
  ["agent", "Agent + LLM", "40′"],
  ["audit", "审计智能体", "10′"],
];

const courseParts = [
  {
    no: "第一部分",
    title: "大模型和智能体的技术基础",
    range: "02—05",
    href: "#part-1",
    description: "讲清规则、ML、ANN和LLM为什么逐层出现。",
  },
  {
    no: "第二部分 · 核心",
    title: "Agent基础与架构",
    range: "06",
    href: "#part-2",
    description: "集中讲Agent的定义、架构、工具循环与规范。",
  },
  {
    no: "第三部分 · 待设计",
    title: "Agent在审计中的应用",
    range: "07",
    href: "#part-3",
    description: "落到审计智能体。",
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
        <a href="#top" className="brand">LLM · Agent · 审计应用</a>
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

function LlmContextDemo() {
  return (
    <div className="task-logic-demo">
      <p className="task-logic-problem">
        <span>审计问题</span>
        报销说明写着「周日接待重要客户」，但小票、CRM、日历放在一起读，语义互相打架。这不是像素识别，而是语言与业务语境。
      </p>

      <ContextEvidenceInbox />
      <LanguageTrainingShift />

      <div className="math-explain lecture-board">
        <div className="math-explain-head">
          <span>课堂板书</span>
          <h3>LLM：仍是 ANN，对象换成 Token 序列</h3>
        </div>

        <section>
          <h4>① 连续关系</h4>
          <p>
            ML 拟合表格特征 → ANN 拟合高维像素 → LLM 用超大 ANN 拟合语言序列。
            不变的是：用损失训练参数，再用参数做预测。
          </p>
        </section>

        <section>
          <h4>② 训练任务：预测下一个 Token</h4>
          <TeX display ariaLabel="next token" math="P(t_{n+1}\mid t_1,\ldots,t_n)" />
          <p className="board-line">
            上文已知时，模型给词表里每个候选一个概率；选一个写下去，再继续——生成就是反复做这件事。
          </p>
        </section>

        <section>
          <h4>③ 读语境时在看什么</h4>
          <p className="board-line">
            Attention 让模型在生成或判断时，重点参考上下文里更相关的 Token（如「儿童套餐」「家属生日」），而不是平均对待每一个词。
          </p>
          <AttentionLab />
        </section>

        <section>
          <h4>④ 边界</h4>
          <p className="board-line">
            语言流畅 <b>≠</b> 事实正确 <b>≠</b> 证据充分。模型不会天然进入企业系统取数；没贴进提示词的 CRM/日历，它并不「知道」。
          </p>
        </section>
      </div>

      <div className="task-logic-map">
        <span>板书收束</span>
        <code>Token 序列 → 预测下一个 → 生成解释</code>
        <span>提醒</span>
        <strong>流畅 ≠ 审计结论</strong>
      </div>
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
      <aside className="sidenav"><div><span>约2小时 · 三部分</span><strong>LLM · Agent · 审计</strong></div><nav>
        <a href={`#${nav[0][0]}`}><span>01</span><b>{nav[0][1]}</b><small className="nav-time">{nav[0][2]}</small></a>
        <p className="nav-part"><span>第一部分</span>技术基础</p>
        {nav.slice(1, 5).map((x, i) => <a href={`#${x[0]}`} key={x[0]}><span>{String(i + 2).padStart(2, "0")}</span><b>{x[1]}</b><small className="nav-time">{x[2]}</small></a>)}
        <p className="nav-part core"><span>第二部分</span>Agent基础与架构</p>
        <a href="#agent"><span>06</span><b>{nav[5][1]}</b><small className="nav-time">{nav[5][2]}</small></a>
        <p className="nav-part"><span>第三部分</span>审计应用</p>
        <a href="#audit"><span>07</span><b>{nav[6][1]}</b><small className="nav-time">{nav[6][2]}</small></a>
      </nav></aside>
      <div className="page">
        <section className="hero">
          <div className="hero-head">
            <h1>LLM 与 Agent：基础、架构及审计应用</h1>
          </div>
          <div className="hero-path three-parts">{courseParts.map((part, index) => <a key={part.no} href={part.href}><span>0{index + 1}</span><strong>{part.title}</strong><small>{part.no}</small><p>{part.description}</p></a>)}</div>
        </section>

        <section id="problem" className="lesson">
          <SectionTitle
            no="01"
            time="导言 · 约5分钟"
            title="导言"
          />
          <div className="lesson-abstract">
            <span>Abstract</span>
            <p>
              本课讨论大语言模型（LLM）与智能体（Agent）的基础概念、系统架构，以及它们在审计工作中的可能用法。课程分为三部分：
            </p>
            <ul className="abstract-parts">
              <li>
                <b>第一部分 · 技术基础</b>
                <span>从规则、机器学习、神经网络到大模型，说明这些技术为何会逐层出现。</span>
              </li>
              <li>
                <b>第二部分 · Agent 基础与架构</b>
                <span>讲清 Agent 是什么、由哪些模块组成、如何与工具形成受控闭环。</span>
              </li>
              <li>
                <b>第三部分 · 审计应用</b>
                <span>讨论如何把上述能力落到审计智能体场景。</span>
              </li>
            </ul>
          </div>
          <div className="content-block lesson-takeaways">
            <h3>主要收获</h3>
            <ol className="takeaway-grid">
              <li>
                <b>01</b>
                <span>能按问题类型选择方法，并分清：基于任务逻辑的编程、经典机器学习、神经网络与大模型——各自能解决什么、解决不了什么。</span>
              </li>
              <li>
                <b>02</b>
                <span>分得清 LLM 与 Agent：前者擅长理解与生成；后者围绕目标调用工具、根据反馈决策并受控停止。</span>
              </li>
              <li>
                <b>03</b>
                <span>理解 Agent 的运行逻辑：能说出基本模块与工具反馈循环，并对权限、日志、人在回路等落地约束有初步了解。</span>
              </li>
              <li>
                <b>04</b>
                <span>独立思考在审计场景下，自己该如何针对性地构建智能体。</span>
              </li>
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

        <PartTitle
          id="part-1"
          no="第一部分"
          title="大模型和智能体的技术基础"
          chapters="章节 02—05"
          lead="从规则、机器学习、神经网络到大模型，说明这些技术为何会逐层出现，各自解决什么问题、卡在哪里。"
        />

        <section id="code" className="lesson">
          <SectionTitle no="02" time="第一部分 · 约10分钟" title="基于任务逻辑的编程" />
          <TaskLogicDemo />
          <InlinePythonLab
            example="rule"
            guide="先按发票号把报销单映射到台账，再比较金额。只看报销明细时 286 元看不出问题；映射后才能发现台账是 86 元。"
          />
          <Bridge from="任务逻辑编程的边界" problem="若每个字段单独看都既可能正常也可能异常，需要借助历史上已经核实过的结果，学习哪些特征组合更值得优先核查。" to="经典机器学习" />
          <TeacherNote time="10分钟" question="只看报销明细，你能发现 BX-42306 的问题吗？还缺哪张表？" misconception="能写清的判断不必先上模型；程序只执行人事先写明的逻辑。" mustSay="必须先按发票号映射到台账，再比较金额；单看报销表发现不了 286 vs 86。" canSkip="语法细节。" />
        </section>

        <section id="ml" className="lesson">
          <SectionTitle no="03" time="第一部分 · 约15分钟" title="经典机器学习" />
          <FeatureFittingDemo />
          <InlinePythonLab
            example="ml"
            guide="表中 H01—H12 是训练集；NEW 是未见过的第 13 种组合。运行后对照下方代入板书。"
          />
          <NewSampleInferenceBoard />
          <Bridge from="经典机器学习的边界" problem="下一笔报销的表格特征看起来正常，真正异常却藏在票据图片里：金额数字的像素可能被改过。人工造几个表格特征已经不够。" to="人工神经网络（ANN）" />
          <TeacherNote time="15分钟" question="模型给出 80% 核查概率，这是证据吗？" misconception="机器学习不是自动发现真相；Loss 下降也不等于可以直接定性。" mustSay="弱信号单独定不了性；用历史核实结果拟合组合权重，给新单排序。" canSkip="梯度公式细节。" />
        </section>

        <section id="nn" className="lesson">
          <SectionTitle no="04" time="第一部分 · 约15分钟" title="ANN" />
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
                审计主线是「像素→数字→286」。下面用真实 ResNet18 展示「像素→面部特征→分类概率」。
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
            time="15分钟"
            question="识别出 286 后，网络知道这笔报销有问题吗？"
            misconception="识别内容不等于理解业务；ANN 不是电子大脑。"
            mustSay="强调：超多特征 → ANN；ANN 仍属机器学习；人脸实验是趣味支线。"
            canSkip="反向传播推导；时间紧时人脸演示只跑一次。"
          />
        </section>

        <section id="llm" className="lesson">
          <SectionTitle no="05" time="第一部分 · 约18分钟" title="从 ANN 到 LLM" />
          <LlmContextDemo />
          <InlinePythonLab
            example="language"
            guide="极小字符模型：把「下一个 Token 预测」跑出来。真实 LLM 是同一思路的超大规模 Transformer。"
          />
          <Bridge
            from="LLM 的边界"
            problem="模型可以建议核对航班、酒店和 CRM，但关键资料分散在不同系统，下一步该查什么还取决于刚刚查到的结果。"
            to="Agent + LLM"
          />
          <TeacherNote
            time="18分钟"
            question="如果不把 CRM 和日历资料提供给模型，它能凭语言能力知道吗？"
            misconception="语言流畅不是证据；LLM 不是数据库。"
            mustSay="明确说：LLM = 大规模 ANN；它能解释已提供上下文，但不会天然主动取数。"
            canSkip="Attention 数学细节；时间紧时 Python 只演示生成几步。"
          />
        </section>

        <PartTitle
          id="part-2"
          no="第二部分 · 核心"
          title="Agent基础与架构"
          chapters="章节 06 · 约40分钟"
          lead="第一部分回答了模型怎样理解和生成；本部分集中回答 Agent 是什么、由哪些模块组成、怎样与工具形成受控闭环。"
        />

        <section id="agent" className="lesson">
          <SectionTitle no="06" time="第二部分 · 约40分钟" title="Agent + LLM" intro="这一章不只是演示一个审计案例，而是建立可迁移到各种行业和任务的 Agent 通用框架。" />

          <div className="part-mandate"><span>本章路线</span><strong>定义 → LLM与Agent的区别 → 模块组成 → 工具与反馈循环 → 行业规范 → 使用价值 → 自主运行边界。</strong><p>规范与架构不是附加题，而是能不能上线的前提。</p></div>

          <div className="content-block"><h3>6.1 什么是 Agent？</h3><p>聊天窗口里“问一句答一句”通常只是 LLM 应用；当系统能够<strong>围绕目标选择下一步、调用工具、读取结果、更新状态并在条件满足时停止</strong>，才具备 Agent 能力。</p></div>
          <Definition term="智能体（Agent）" simple="让 LLM 不只回答，还能为了目标判断下一步、调用工具、读取结果并继续，直到达成目标或触发停止条件。" precise="Agent 是包含决策模块（常为 LLM）、工具接口、状态/记忆、编排循环与控制策略的软件系统；LLM 是其中的理解与规划部件，不是系统的全部。" />
          <div className="concept-grid four"><div><span>普通程序</span><strong>步骤明确</strong><p>执行预先写好的逻辑。</p></div><div><span>工作流</span><strong>流程固定</strong><p>连接系统，路径主要预定。</p></div><div><span>大模型</span><strong>生成决策</strong><p>根据上下文输出文字或指令。</p></div><div><span>Agent</span><strong>反馈闭环</strong><p>根据工具结果决定下一步。</p></div></div>
          <div className="model-system"><div><span>LLM</span><strong>一个模型</strong><p>输入上下文，输出文字或结构化指令。</p></div><i>≠</i><div><span>Agent</span><strong>一个运行系统</strong><p>模型 + 目标 + 工具 + 状态 + 控制。</p></div></div>

          <div className="content-block"><h3>6.2 行业里常见的规范与底线</h3><p>不同厂商名词不同，但成熟落地几乎都会约定这些“非可选”约束——审计场景尤其严格。</p><div className="control-lines"><ol><li><strong>最小权限</strong><span>默认只读；写入、外发、扩权必须审批。</span></li><li><strong>人在回路</strong><span>重大定性、对外结论由人确认；Agent 产出疑点与证据包。</span></li><li><strong>工具边界清晰</strong><span>每个工具有输入输出契约、超时与失败语义；禁止“查不到就当没有问题”。</span></li><li><strong>全程可观测</strong><span>记录提示、工具调用、返回与决策理由，便于复盘与追责。</span></li><li><strong>停止条件明确</strong><span>证据齐全、预算耗尽、工具失败、置信不足时必须停止或升级。</span></li><li><strong>数据与合规</strong><span>授权范围、脱敏、留存周期与模型侧数据外泄风险要事先设计。</span></li></ol></div></div>

          <div className="content-block"><h3>6.3 参考架构：Agent 由哪些块组成？</h3><p>课堂用一张“积木图”记忆即可：缺任何一块，都容易退化成“会说话但不会办事”的聊天框，或“会乱跑的脚本”。</p></div>
          <div className="stack"><span>Agent 参考架构（教学版）</span><div>
            <section><b>01</b><strong>目标与策略</strong><p>任务目标、成功标准、禁止事项、升级规则。</p></section>
            <section><b>02</b><strong>LLM 决策核</strong><p>理解上下文，选择下一步行动或产出结构化计划。</p></section>
            <section><b>03</b><strong>工具层</strong><p>检索、数据库、OCR、发票查验、计算器等可调用能力。</p></section>
            <section><b>04</b><strong>状态与记忆</strong><p>已获证据、缺口、失败记录、对话/工作记忆。</p></section>
            <section><b>05</b><strong>编排循环</strong><p>感知→决策→行动→观察→更新；可 ReAct / 计划-执行等模式。</p></section>
            <section><b>06</b><strong>控制与护栏</strong><p>权限、配额、审计日志、人工关口、安全策略。</p></section>
          </div><blockquote>行业实践里常见模式：ReAct（推理与行动交错）、Plan-and-Execute（先计划再执行）、以及带人工审批节点的 Human-in-the-loop。审计落地更强调后两者中的“可控停”。</blockquote></div>

          <div className="content-block"><h3>6.4 使用 Agent 带来的好处（以及别神话）</h3><div className="two-col"><div><strong>好处</strong><ul><li>把多系统取证从“人手粘贴”变成可重复流程</li><li>按证据缺口动态选下一步，减少固定清单漏项</li><li>工具失败可显式记录并升级，而不是静默放过</li><li>输出证据包，便于复核与底稿衔接</li><li>同一套护栏可服务多类窄场景复用</li></ul></div><div><strong>不要神话</strong><ul><li>不会自动等于“更准的审计意见”</li><li>工具质量差，Agent 只会更快地做错</li><li>缺少日志与权限，风险比单次聊天更大</li><li>场景过宽、目标含糊时成本与失控风险上升</li></ul></div></div></div>

          <div className="autonomy"><h3>自主度：审计场景不追求“越自动越好”</h3><div><span>可以自动</span><p>读取、检索、计算、比对和整理。</p></div><div><span>需要审批</span><p>扩大数据范围、写入和对外发送。</p></div><div><span>必须由人判断</span><p>证据评价、重大定性和审计意见。</p></div></div>

          <div className="content-block"><h3>6.5 最难的一关：让调查路径由证据反馈决定</h3></div>
          <DatasetAnchor caseId="F · 行程矛盾" claimIds="BX-42017" files={["expense_claims.csv", "flight_records.csv", "hotel_records.csv", "customer_visits.csv", "employee_calendar.csv"]} task="报销只写着“上海机场前往苏州客户”。系统先查航班，发现员工落地南京；因为城市矛盾，才继续查酒店、CRM和日历，最终形成证据包。" />
          <AgentBranchLab />
          <InlinePythonLab example="agent" guide="找到choose_next_action：它先读取报销和航班；只有发现目的地矛盾，才继续查询酒店、CRM和日历。每一步都重新读取state，而不是遍历固定工具列表。" />
          <CapabilityBoundary method="Agent + LLM" input="目标 + 可调用工具 + 运行状态" unique="主动取数，把工具反馈放回上下文，并选择下一步" output="含事实、制度来源、不确定性和建议的证据包" limit="不应自动认定违规、舞弊或审计结论" />
          <LessonTakeaway>Agent = LLM + 工具 + 状态 + 循环 + 控制。规范与架构不是附加题，而是能不能上线的前提。</LessonTakeaway>
          <Bridge from="通用 Agent 能力" problem="我们已经有了 Agent + LLM 的通用积木。审计场景还要回答：审什么单据、连哪些系统、证据标准是什么、人工关口设在哪。" to="审计智能体（专题占位）" />
          <TeacherNote time="40分钟" question="航班工具失败时，Agent能否把“查不到”当作行程一致？" misconception="网页不等于Agent；固定for循环也不等于依据反馈行动。" mustSay="本章是全课核心：定义、LLM与Agent区别、六条规范、六块架构、价值与边界缺一不可。" canSkip="行程一致分支可略讲，但不能压缩Agent定义与架构。" />
        </section>

        <PartTitle
          id="part-3"
          no="第三部分 · 待设计"
          title="Agent在审计中的应用"
          chapters="章节 07"
          lead="把前两部分的通用技术与 Agent 架构组合成审计智能体。当前保留设计边界，具体内容由后续逐节确定。"
        />

        <section id="audit" className="lesson">
          <SectionTitle no="07" time="第三部分 · 约10分钟" title="审计智能体（内容占位）" intro="后续将逐项设计场景、数据与工具连接、可复核证据、自动化边界、人工判断与试点评价。" />
          <div className="content-block" style={{ borderStyle: "dashed" }}>
            <h3>🚧 本章建设中</h3>
            <p>后续将逐项设计：审计智能体要解决什么问题、怎样选择落地场景、如何连接数据制度与工具、怎样形成可复核证据、哪些步骤可自动执行、哪些判断必须由审计人员完成，以及如何试点和评价。</p>
            <p><b>暂时保留的思考锚点（非正式定稿）：</b></p>
            <ul>
              <li>交付物仍是可复核疑点，不是自动审计意见</li>
              <li>确定性检查优先规则；模式与感知用模型；调查闭环用 Agent</li>
              <li>先影子运行，再小范围试点</li>
            </ul>
          </div>
          <DeepDive title="（可选预习）多表 Toy Data 与能力矩阵"><p>五级案例使用同一数据包，但分别突出确定性、统计组合、图像、语义和行动反馈。正式「审计智能体」章节定稿后，将把这些能力组合成受控系统。</p><ToyDatasetExplorer /><CaseMatrix /><AuditAgentCanvas /></DeepDive>
          <div className="summary-chain">{stages.map((s, i) => <div key={s.key}><span>0{i + 1}</span><strong>{s.name}</strong><p>{s.question}</p><small>{s.ability}</small></div>)}</div>
          <Quiz />
          <div className="closing"><p>回看难度阶梯：完全重复 → 弱信号组合 → 图像像素 → 语言语境 → 多系统动态取证。</p><h3>问题增加一种困难，技术才增加一种能力；<br />Agent让LLM能办事，审计仍由人收口。</h3><div><span>规则</span><span>ML</span><span>ANN</span><span>LLM</span><span>Agent</span></div></div>
          <TeacherNote time="10分钟" question="你最想用 Agent 自动化的审计子任务是什么？" mustSay="本章仅为第三部分占位；具体场景、证据、权限和评价方法将在后续逐节确定。" canSkip="Toy Data 预习。" />
        </section>

        <footer><strong>LLM 与 Agent：基础、架构及审计应用</strong><span>从问题出发的能力链：规则 → ML → ANN → LLM → Agent</span><a href="#top">回到顶部 ↑</a></footer>
      </div>
    </main>
  </PythonKernelProvider>;
}
