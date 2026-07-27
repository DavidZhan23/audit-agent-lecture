"use client";

import { useState } from "react";

type DesignKey = "documents" | "data" | "report";
type FileKey = "scan" | "sheet" | "document" | "image";
type RoleKey = "headquarters" | "branch" | "project";

const auditRoute = [
  { id: "audit", no: "14", title: "从审计工作链理解三个智能体", detail: "资料、数据与成果三个环节" },
  { id: "audit-documents", no: "15", title: "异构审计资料解析智能体", detail: "格式路由、质量检查与证据定位" },
  { id: "audit-data", no: "16", title: "智能问数与数据分析智能体", detail: "语义层、权限、查询安全与分析" },
  { id: "audit-report", no: "17", title: "智能生成审计报告", detail: "知识体系、提纲、分段生成与审核" },
  { id: "audit-collaboration", no: "18", title: "完整审计协作系统", detail: "统一证据、权限、任务和数据接口" },
  { id: "audit-governance", no: "19", title: "效果、评估与治理边界", detail: "工作方式变化、指标与责任" },
] as const;

const designCases: Record<DesignKey, {
  label: string;
  goal: string;
  input: string;
  knowledge: string;
  tools: string;
  permission: string;
  validation: string;
}> = {
  documents: {
    label: "案例一 · 资料解析",
    goal: "解析异构、非标准化资料并形成可追溯证据。",
    input: "便携式文档、图片、电子表格、文字处理文档。",
    knowledge: "文档类型、字段规则、审计关注点与实体关系。",
    tools: "文字识别、版面解析、表格解析、文档解析、实体匹配。",
    permission: "项目文件权限、保密等级与解析服务使用范围。",
    validation: "解析置信度、字段核对、来源定位与人工复核。",
  },
  data: {
    label: "案例二 · 智能问数",
    goal: "根据自然语言安全查询审计数据并完成分析。",
    input: "用户问题、用户身份、审计宽表与项目范围。",
    knowledge: "数据字典、指标口径、组织结构与业务同义词。",
    tools: "查询计划、语句生成、安全校验、只读查询与统计分析。",
    permission: "组织级、项目级、行级、字段级与明细权限。",
    validation: "查询语句、业务口径、原始结果、数字复算与日志。",
  },
  report: {
    label: "案例三 · 报告生成",
    goal: "生成符合报告类型、证据状态和已确认风格的报告草稿。",
    input: "报告类型、结构化发现、证据、制度、模板和风格规则。",
    knowledge: "报告结构、有效制度、批准案例、术语和写作规范。",
    tools: "知识检索、提纲规划、分段生成、事实校验与文档渲染。",
    permission: "报告资料权限、制度权限、审批权限与导出权限。",
    validation: "事实、数字、证据、制度版本、模板、风格和人工审核。",
  },
};

const files: Record<FileKey, {
  name: string;
  category: string;
  state: string;
  route: string[];
  result: string;
  location: string;
  confidence: string;
  issue: string;
}> = {
  scan: {
    name: "主合同扫描件.便携式文档",
    category: "扫描文档 · 非结构化/半结构化",
    state: "无可复制文本，页面有轻微旋转",
    route: ["页面拆分", "方向纠正", "去噪清晰化", "文字识别", "版面重建", "质量检测"],
    result: "合同金额：人民币捌佰陆拾万无整",
    location: "第1页 · 合同首页 · 金额区域",
    confidence: "0.78 · 低于自动采用阈值",
    issue: "“元”被识别为“无”，需要金额规则与其他资料交叉校验。",
  },
  sheet: {
    name: "付款台账.电子表格",
    category: "结构化/半结构化数据",
    state: "3个工作表、2处合并单元格、1个隐藏行",
    route: ["识别工作表", "定位标题行", "处理合并单元格", "读取值与公式", "识别字段", "建立单元格来源"],
    result: "汇总表：830万元；付款明细求和：800万元",
    location: "汇总表!D8；付款明细!F2:F37",
    confidence: "公式读取成功 · 发现30万元差异",
    issue: "不能任选一个结果；检查公式范围、隐藏行、空值并保留两个来源。",
  },
  document: {
    name: "采购制度.文字处理文档",
    category: "具有结构的半结构化文档",
    state: "6级标题、4张表格、7条批注、2处修订",
    route: ["读取标题层级", "保留编号列表", "解析表格", "读取批注修订", "保存页眉页脚", "建立段落来源"],
    result: "第三章第十二条：单一来源采购应说明适用情形并履行审批。",
    location: "第三章 · 第十二条 · 第4页",
    confidence: "结构完整 · 版本有效至2026年12月",
    issue: "简单转成纯文本会丢失标题层次、表格关系、批注和修订状态。",
  },
  image: {
    name: "现场照片01.图片",
    category: "图像 · 非结构化资料",
    state: "横向拍摄，印章区域模糊",
    route: ["方向检测", "图像纠正", "文字识别", "视觉内容分析", "区域定位", "低置信度标记"],
    result: "识别到项目名称、日期牌和设备编号；印章主体无法确认。",
    location: "图片右下区域 · 坐标框[612,438,884,690]",
    confidence: "主体0.94；印章0.51",
    issue: "低置信度印章不得用于主体确认，必须查看原图或转人工。",
  },
};

const roleResults: Record<RoleKey, {
  label: string;
  scope: string;
  rows: Array<[string, string, string]>;
}> = {
  headquarters: {
    label: "总部审计人员",
    scope: "全部二级单位汇总；授权范围内可查看明细",
    rows: [["天津分公司", "4,280万元", "+32%"], ["上海分公司", "3,610万元", "+8%"], ["深圳分公司", "2,940万元", "-6%"], ["湛江分公司", "2,180万元", "+15%"], ["海南分公司", "1,760万元", "+4%"]],
  },
  branch: {
    label: "天津分公司审计人员",
    scope: "天津分公司及其已授权下属单位",
    rows: [["天津分公司本部", "2,940万元", "+26%"], ["天津下属单位甲", "890万元", "+48%"], ["天津下属单位乙", "450万元", "+11%"]],
  },
  project: {
    label: "当前项目组成员",
    scope: "采购专项项目已授权的数据集，仅含天津与湛江汇总",
    rows: [["天津分公司", "4,280万元", "+32%"], ["湛江分公司", "2,180万元", "+15%"]],
  },
};

const querySteps = ["确认身份权限", "识别指标口径", "检索语义目录", "生成查询计划", "生成语句草稿", "安全校验", "注入权限条件", "只读环境执行", "复算与分析"] as const;

const knowledgeLayers = [
  ["报告结构", "项目情况、范围方法、总体评价、主要问题、建议和附件"],
  ["类型模板", "每类报告的必填章节、可选章节、输入和审批流程"],
  ["问题表达", "事实、标准、差异、原因、影响、建议和证据"],
  ["制度依据", "条款、版本、生效失效日期、适用范围和原文位置"],
  ["批准案例", "按问题类型整理并完成脱敏、分类和质量筛选"],
  ["风格规则", "句式、篇幅、术语、语气强度、建议措辞和禁止表达"],
] as const;

const collaborationSteps = [
  ["解析项目资料包", "资料解析"], ["提取合同、付款和供应商", "资料解析"], ["发现合同与台账金额差异", "证据"],
  ["查询历史采购数据", "智能问数"], ["分析供应商三年趋势", "智能问数"], ["识别单一来源比例异常", "数据分析"],
  ["检索适用采购制度", "知识"], ["形成结构化审计发现", "人工确认"], ["生成报告提纲", "报告生成"],
  ["生成问题与建议草稿", "报告生成"], ["展示证据和查询语句", "追溯"], ["提交审计人员复核", "人工"],
] as const;

export function AuditApplicationRoute({ onSelect }: { onSelect: (id: string) => void }) {
  return <nav className="audit-app-route" aria-label="第三部分章节目录"><header><span>第三部分 · 学习路线</span><strong>资料进入 → 可信问数 → 报告形成 → 协作治理</strong></header><ol>{auditRoute.map(item => <li key={item.id}><button type="button" onClick={() => onSelect(item.id)}><b>{item.no}</b><strong>{item.title}</strong><span>{item.detail}</span></button></li>)}</ol></nav>;
}

export function AuditDesignWorkbench({ initial = "documents" }: { initial?: DesignKey }) {
  const [active, setActive] = useState<DesignKey>(initial);
  const item = designCases[active];
  const fields = [["01", "目标是什么？", item.goal], ["02", "输入是什么？", item.input], ["03", "需要什么知识？", item.knowledge], ["04", "可以调用什么工具？", item.tools], ["05", "权限和边界是什么？", item.permission], ["06", "输出怎样验证？", item.validation]];
  return <div className="audit-design-workbench"><div className="design-case-tabs">{(Object.keys(designCases) as DesignKey[]).map(key => <button type="button" key={key} className={active === key ? "active" : ""} onClick={() => setActive(key)}>{designCases[key].label}</button>)}</div><div className="design-six-grid" aria-live="polite">{fields.map(([no, question, answer]) => <article key={no}><b>{no}</b><strong>{question}</strong><p>{answer}</p></article>)}</div><blockquote>设计智能体的起点不是选择模型，而是先明确目标、输入、知识、工具、权限和验证方式。</blockquote></div>;
}

export function AuditChainChallenge() {
  const [choice, setChoice] = useState<"all" | "route" | "convert" | null>(null);
  const feedback = choice === "route" ? "可靠：先做安全、权限、类型和可读性检查，再按格式选择解析工具。" : choice === null ? "请选择一个方案，查看系统会发生什么。" : choice === "all" ? "不可靠：格式、长度、扫描质量、表格结构和证据定位都未处理。" : "不可靠：统一转图片会破坏电子表格公式、文字处理文档层级和可搜索文本。";
  return <div className="audit-chain-challenge"><div className="audit-material-pack"><span>采购与合同管理专项审计 · 资料入口</span>{["合同扫描件", "合同附件", "现场照片", "电子表格台账", "文字处理制度", "会议纪要", "系统导出数据", "历史批准报告", "整改材料"].map((item, index) => <b key={item}><i>{String(index + 1).padStart(2, "0")}</i>{item}</b>)}</div><section><span>启发式问题</span><h3>把全部资料一次性交给大语言模型，能否直接完成审计？</h3><p>请选择系统的第一步。</p><div>{[["all", "全部内容直接交给模型"], ["route", "先识别类型、可读性与安全状态"], ["convert", "把所有文件统一转换成图片"]].map(([key, label]) => <button type="button" key={key} className={choice === key ? "active" : ""} onClick={() => setChoice(key as "all" | "route" | "convert")}>{label}</button>)}</div><blockquote className={choice === "route" ? "ok" : ""}>{feedback}</blockquote><div className="three-agent-answer"><article><b>资料解析智能体</b><p>资料怎样进入系统并成为可靠证据？</p></article><article><b>智能问数与分析智能体</b><p>怎样安全、准确地找到数字并分析？</p></article><article><b>报告生成智能体</b><p>怎样把事实、证据和分析组织成报告？</p></article></div></section></div>;
}

export function DocumentParsingLab() {
  const [active, setActive] = useState<FileKey>("scan");
  const [decision, setDecision] = useState<"accept" | "verify" | "discard" | null>(null);
  const item = files[active];
  const answer = decision === "verify" ? "正确：结合置信度、格式规则、其他资料和原始位置交叉验证；无法确认则转人工。" : decision === null ? "请选择如何处理解析结果。" : decision === "accept" ? "风险：低置信度内容可能把合同金额或主体写错，并污染后续证据链。" : "风险：直接丢弃会造成证据遗漏；应保留原始结果、失败原因和人工任务。";
  return <div className="document-parsing-lab"><aside>{(Object.keys(files) as FileKey[]).map(key => <button type="button" key={key} className={active === key ? "active" : ""} onClick={() => { setActive(key); setDecision(null); }}><strong>{files[key].name}</strong><span>{files[key].category}</span></button>)}</aside><main><header><span>文件路由与中间结果</span><h3>{item.name}</h3><p>{item.state}</p></header><div className="parse-route">{item.route.map((step, index) => <div key={step}><b>{String(index + 1).padStart(2, "0")}</b><strong>{step}</strong>{index < item.route.length - 1 && <i>→</i>}</div>)}</div><div className="parse-result"><section><span>解析结果</span><strong>{item.result}</strong><small>{item.location}</small><small>{item.confidence}</small></section><section><span>发现的问题</span><p>{item.issue}</p></section></div><div className="parse-decision"><span>是否直接采用这个结果？</span><div>{[["accept", "直接采用"], ["verify", "校验并保留来源"], ["discard", "直接丢弃"]].map(([key, label]) => <button type="button" key={key} className={decision === key ? "active" : ""} onClick={() => setDecision(key as "accept" | "verify" | "discard")}>{label}</button>)}</div><blockquote className={decision === "verify" ? "ok" : ""}>{answer}</blockquote></div><div className="evidence-object"><span>统一证据对象</span><dl><dt>文档身份</dt><dd>资料-001 · {item.name}</dd><dt>权限范围</dt><dd>采购专项项目组</dd><dt>内容类型</dt><dd>{item.category}</dd><dt>原始定位</dt><dd>{item.location}</dd><dt>解析置信度</dt><dd>{item.confidence}</dd><dt>复核状态</dt><dd>{decision === "verify" ? "待交叉校验 / 人工确认" : "尚未作出可靠决定"}</dd></dl></div></main></div>;
}

export function EvidenceConflictBoard() {
  return <div className="evidence-conflict-board"><div><span>合同正文</span><strong>860万元</strong><small>第1页合同首页</small></div><i>≠</i><div><span>付款台账</span><strong>830万元</strong><small>汇总表!D8</small></div><i>≠</i><div><span>审批表</span><strong>860万元</strong><small>第2页审批金额</small></div><section><span>智能体输出</span><strong>发现合同金额不一致</strong><p>保留三个来源。建议核查付款台账金额是否表示“已支付金额”，而不是合同总金额。</p></section></div>;
}

export function SecureQueryLab() {
  const [role, setRole] = useState<RoleKey>("headquarters");
  const [step, setStep] = useState(0);
  const [decision, setDecision] = useState<"run" | "validate" | "select" | null>(null);
  const item = roleResults[role];
  const decisionText = decision === "validate" ? "正确：即使是只读查询，也要校验权限、语法、表字段白名单、扫描范围、敏感信息和资源成本。" : decision === null ? "模型生成查询语句后，是否立即执行？" : decision === "select" ? "不可靠：只读语句仍可能越权、扫描全库、暴露敏感信息或造成数据库压力。" : "不可靠：模型理解问题不代表它拥有数据权限，也不保证口径和语句安全。";
  const query = `SELECT company_name,
       SUM(contract_amount) AS total_amount
FROM fact_procurement_audit
WHERE purchase_method_name = '单一来源'
  AND contract_date >= '2025-01-01'
  AND contract_date < '2025-07-01'
  AND company_id IN (:授权单位范围)
GROUP BY company_name;`;
  return <div className="secure-query-lab"><header><div><span>教学模拟 · 不连接真实数据库</span><h3>2025年上半年，各单位单一来源采购金额和同比情况</h3></div><div className="role-tabs">{(Object.keys(roleResults) as RoleKey[]).map(key => <button type="button" key={key} className={role === key ? "active" : ""} onClick={() => setRole(key)}>{roleResults[key].label}</button>)}</div></header><div className="query-stepper">{querySteps.map((label, index) => <button type="button" key={label} className={index === step ? "active" : index < step ? "done" : ""} onClick={() => setStep(index)}><b>{String(index + 1).padStart(2, "0")}</b><span>{label}</span></button>)}</div><section className="query-workbench"><div><span>业务语义与查询计划</span><dl><dt>指标</dt><dd>单一来源采购金额</dd><dt>定义</dt><dd>采购方式为“单一来源”的合同金额合计</dd><dt>时间</dt><dd>合同签订日期 · 2025年上半年</dd><dt>分组</dt><dd>二级单位；同比；供应商下钻</dd><dt>权限</dt><dd>{item.scope}</dd></dl><small>数据库字段说明数据在哪里；语义层说明业务指标是什么意思。</small></div><div><span>结构化查询语句草稿</span><pre>{query}</pre><p><b>:授权单位范围</b>由权限服务提供，模型不得自行填写。</p></div><div><span>执行前决策</span><div className="query-decisions">{[["run", "直接执行"], ["validate", "校验并注入权限"], ["select", "只要只读就执行"]].map(([key, label]) => <button type="button" key={key} className={decision === key ? "active" : ""} onClick={() => setDecision(key as "run" | "validate" | "select")}>{label}</button>)}</div><blockquote className={decision === "validate" ? "ok" : ""}>{decisionText}</blockquote><ul>{["仅允许只读单语句", "表字段白名单", "组织/项目/行/字段权限", "扫描行数与超时限制", "敏感字段脱敏", "异常关联与危险函数检查", "完整查询日志"].map(rule => <li key={rule}>{rule}</li>)}</ul></div></section><div className="query-results" aria-live="polite"><div><span>当前身份</span><strong>{item.label}</strong><p>{item.scope}</p></div><table><thead><tr><th>单位</th><th>金额</th><th>同比</th></tr></thead><tbody>{item.rows.map(row => <tr key={row[0]}>{row.map(cell => <td key={cell}>{cell}</td>)}</tr>)}</tbody></table><div><span>自动分析</span><strong>{role === "headquarters" ? "天津分公司同比增长最高，为32%。" : `${item.rows[0][0]}在当前授权范围内金额最高。`}</strong><p>总部视图进一步拆分发现：某技术服务公司贡献新增金额620万元，占天津新增金额57%。建议检查连续单一来源采购、合同拆分和采购理由。</p></div></div><footer><span>可追溯记录</span><b>原始问题</b><b>指标口径</b><b>权限范围</b><b>数据表</b><b>执行语句</b><b>查询时间</b><b>数据更新时间</b><b>返回记录数</b><b>脱敏状态</b></footer></div>;
}

export function ReportGenerationStudio() {
  const [type, setType] = useState("专项审计报告");
  const [outline, setOutline] = useState(["项目基本情况", "审计范围与方法", "总体评价", "主要问题", "审计建议"]);
  const [style, setStyle] = useState("正式、客观、克制");
  const [review, setReview] = useState<"pending" | "accepted" | "returned">("pending");
  const move = (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= outline.length) return;
    const next = [...outline];
    [next[index], next[target]] = [next[target], next[index]];
    setOutline(next);
  };
  return <div className="report-generation-studio"><header><div><span>报告生成准备向导</span><h3>先确认类型、范围、发现、证据和风格，再生成正文</h3></div><div>{["专项审计报告", "审计问题段落", "审计调查报告", "整改报告"].map(item => <button type="button" key={item} className={type === item ? "active" : ""} onClick={() => setType(item)}>{item}</button>)}</div></header><div className="report-knowledge-layers">{knowledgeLayers.map(([name, detail], index) => <article key={name}><b>{String(index + 1).padStart(2, "0")}</b><strong>{name}</strong><p>{detail}</p></article>)}</div><section className="report-preparation"><div><span>任务范围</span><dl><dt>报告类型</dt><dd>{type}</dd><dt>审计对象</dt><dd>某分公司</dd><dt>审计期间</dt><dd>2023年1月至2025年12月</dd><dt>审计领域</dt><dd>数据治理项目管理</dd><dt>证据状态</dt><dd>两个发现已确认；一项范围待核实</dd></dl></div><div><span>结构化审计发现</span><strong>发现-001 · 部分历史数据存在重复治理</strong><p>事实绑定证据-101、证据-102、证据-201；制度条款绑定规则-001。</p><p><b>不确定性：</b>部分项目实际治理对象仍需进一步核实。</p></div><div><span>可编辑风格规则</span><div className="style-tabs">{["正式、客观、克制", "简洁、数字优先", "问题与建议并列"].map(item => <button type="button" key={item} className={style === item ? "active" : ""} onClick={() => setStyle(item)}>{item}</button>)}</div><p>重要结论后紧跟金额、时间和来源；证据不足写“尚需进一步核实”；禁止使用“显而易见”“完全证明”。</p></div></section><div className="outline-editor"><span>先确认提纲，再分章节生成</span>{outline.map((item, index) => <div key={item}><b>{index + 1}</b><strong>{item}</strong><button type="button" aria-label={`上移${item}`} disabled={index === 0} onClick={() => move(index, -1)}>↑</button><button type="button" aria-label={`下移${item}`} disabled={index === outline.length - 1} onClick={() => move(index, 1)}>↓</button></div>)}</div><section className="report-review-workbench"><aside><span>章节与问题</span>{outline.map((item, index) => <button type="button" key={item} className={item === "主要问题" ? "active" : ""}>{index + 1}. {item}</button>)}</aside><main><span>生成正文 · {style}</span><h4>（一）部分历史数据存在重复治理</h4><p>审计发现，部分历史数据存在重复治理情况。2017年12月至2020年6月，相关单位开展历史数据补建、清理、结构化采集和入湖归档；2021年底至2022年底，又面向相近范围开展数据清洗迁移。</p><p>上述项目在治理对象和工作内容方面存在一定重叠，一定程度上反映出项目统筹和范围审核机制不够健全。</p><div className={`review-state ${review}`}><strong>{review === "accepted" ? "段落已由审计人员接受并锁定" : review === "returned" ? "已退回：请保留不确定性并补充范围证据" : "等待审计人员审核"}</strong></div><div><button type="button" onClick={() => setReview("accepted")}>接受并锁定</button><button type="button" onClick={() => setReview("returned")}>退回修改</button><button type="button" onClick={() => setReview("pending")}>恢复待审</button></div></main><aside><span>证据与质量检查</span><b>证据-101：立项文件第3页</b><b>证据-102：验收报告第7页</b><b>证据-201：项目任务书第5页</b><b>规则-001：制度第三章第十二条</b>{["主体名称一致", "日期范围一致", "关键事实均有来源", "制度版本有效", "不确定性已保留", "模板与风格通过"].map(item => <small key={item}>✓ {item}</small>)}</aside></section></div>;
}

export function ReportArchitectureBoard() {
  return <div className="report-architecture-board"><div><span>第一层</span><strong>事实与证据</strong><p>确认发生了什么、数字是多少、证据在哪里；不足则阻断确定性结论。</p></div><i>↓</i><div><span>第二层</span><strong>审计分析</strong><p>事实 → 有效标准 → 差异 → 原因 → 影响 → 建议；制度不得由模型创造。</p></div><i>↓</i><div><span>第三层</span><strong>报告表达</strong><p>按类型、模板和已确认风格组织文字；不得修改事实与数字。</p></div><blockquote>初期优先：结构化模板 + 发现数据模型 + 证据绑定 + 检索增强生成 + 风格配置 + 分章节生成 + 规则校验 + 人工审核。微调不能替代证据检索和事实校验。</blockquote></div>;
}

export function AuditCollaborationLab() {
  const [active, setActive] = useState(0);
  const item = collaborationSteps[active];
  return <div className="audit-collaboration-lab"><div className="collaboration-timeline">{collaborationSteps.map(([name, owner], index) => <button type="button" key={name} className={active === index ? "active" : index < active ? "done" : ""} onClick={() => setActive(index)}><b>{String(index + 1).padStart(2, "0")}</b><strong>{name}</strong><span>{owner}</span></button>)}</div><section aria-live="polite"><span>完整任务 · 步骤 {active + 1}/{collaborationSteps.length}</span><h3>{item[0]}</h3><p>当前责任：{item[1]}。每一步都继承同一项目身份、权限范围、证据编号和运行日志。</p><button type="button" onClick={() => setActive((active + 1) % collaborationSteps.length)}>{active === collaborationSteps.length - 1 ? "重新运行" : "执行下一步 →"}</button></section><div className="shared-foundation"><span>三个智能体共享</span>{["用户身份", "组织与项目权限", "文件与数据权限", "统一证据编号", "审计知识库", "工具注册中心", "任务状态", "操作日志", "人工审批", "安全控制", "模型调用服务", "版本管理"].map(item => <b key={item}>{item}</b>)}</div><div className="audit-object-interfaces">{[["证据对象", "来源类型 · 原始位置 · 内容 · 置信度 · 权限"], ["查询结果对象", "问题 · 指标口径 · 查询语句 · 数据时间 · 结果 · 分析"], ["审计发现对象", "事实 · 标准 · 原因 · 影响 · 建议 · 证据 · 复核状态"], ["报告对象", "类型 · 范围 · 提纲 · 章节 · 发现 · 模板 · 风格 · 审核状态"]].map(([name, detail]) => <div key={name}><strong>{name}</strong><p>{detail}</p></div>)}</div></div>;
}

export function AuditGovernanceDashboard() {
  const [active, setActive] = useState<"effects" | "metrics" | "safety">("effects");
  const panels = {
    effects: { title: "工作方式怎样变化", groups: [["资料处理", "批量解析 → 提取字段 → 关联资料 → 标记证据 → 人工处理低置信度"], ["数据查询", "自然语言提问 → 匹配指标 → 安全查询 → 权限过滤 → 自动分析 → 展示口径"], ["报告编制", "选择类型 → 导入发现 → 确认提纲 → 按证据生成 → 自动校验 → 人工审核"]] },
    metrics: { title: "怎样证明系统真的可靠", groups: [["资料解析", "解析成功率、文字准确率、表格还原、来源覆盖、冲突召回、人工修正率"], ["智能问数", "意图和口径准确率、执行成功率、权限隔离、数字一致率、风险拦截率"], ["报告生成", "事实忠实度、数字一致率、证据覆盖率、制度版本正确率、人工退回率"]] },
    safety: { title: "哪些边界必须由系统强制", groups: [["数据与权限", "身份、组织、项目、行、字段、工具、审批和导出权限；敏感信息脱敏"], ["事实与查询", "原始证据、提取事实、系统分析、智能体建议、人工确认和正式结论严格分层"], ["报告与责任", "不虚构事实制度，不隐去不确定性，正式报告人工审核，版本和修改记录可追踪"]] },
  } as const;
  const panel = panels[active];
  return <div className="audit-governance-dashboard"><div className="governance-tabs"><button type="button" className={active === "effects" ? "active" : ""} onClick={() => setActive("effects")}>具体效果</button><button type="button" className={active === "metrics" ? "active" : ""} onClick={() => setActive("metrics")}>评估指标</button><button type="button" className={active === "safety" ? "active" : ""} onClick={() => setActive("safety")}>治理边界</button></div><section><span>{panel.title}</span><div>{panel.groups.map(([name, detail]) => <article key={name}><strong>{name}</strong><p>{detail}</p></article>)}</div><blockquote>智能体不替代审计人员。系统承担资料搬运、重复查询和格式整理；审计人员负责验证证据、判断风险和形成专业结论。</blockquote></section></div>;
}
