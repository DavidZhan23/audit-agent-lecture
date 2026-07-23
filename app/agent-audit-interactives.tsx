"use client";

import { useState } from "react";

type RouteItem = [string, string, string];

function ChapterRoute({ label, title, items }: { label: string; title: string; items: RouteItem[] }) {
  return <div className="focus-route"><div className="focus-route-head"><span>{label}</span><strong>{title}</strong></div><div>{items.map(([no, name, detail]) => <article key={no}><b>{no}</b><strong>{name}</strong><p>{detail}</p></article>)}</div></div>;
}

export function AgentChapterRoute() {
  return <ChapterRoute label="第二部分学习路线" title="从一次模型回答，搭出可持续、可控制的行动系统" items={[
    ["01", "为什么还需要Agent", "LLM只基于当前上下文生成"],
    ["02", "Agent究竟是什么", "与程序、工作流、LLM分清"],
    ["03", "系统由什么组成", "目标、模型、工具、状态、循环、控制"],
    ["04", "工具怎样被调用", "Schema、参数、返回与错误"],
    ["05", "反馈怎样改变下一步", "状态更新、动态分支、停止"],
    ["06", "怎样防止失控", "权限、预算、日志与人工关口"],
    ["07", "怎样评价价值", "完成率、质量、成本与风险"],
  ]} />;
}

export function AgentArchitectureExplorer() {
  const [active, setActive] = useState(0);
  const modules = [
    { name: "目标与策略", question: "要完成什么、什么算完成？", input: "任务、成功标准、禁止事项", output: "当前目标与行动约束", risk: "目标含糊会让系统不断扩张任务范围" },
    { name: "LLM决策核", question: "基于当前状态，下一步是什么？", input: "目标、证据、工具说明、历史步骤", output: "回答、计划或结构化工具调用", risk: "可能选错工具、编造参数或过度自信" },
    { name: "工具层", question: "怎样读取事实或执行动作？", input: "名称、参数Schema、权限与超时", output: "结构化结果、来源或错误", risk: "工具返回错误时不能被模型改写成成功" },
    { name: "状态与记忆", question: "已经知道什么、还缺什么？", input: "证据、缺口、失败、调用预算", output: "下一轮可读取的工作状态", risk: "记忆可能过期、污染或把旧结论当新事实" },
    { name: "编排循环", question: "怎样让观察真正影响下一步？", input: "模型行动 + 工具观察", output: "更新状态、继续、停止或升级", risk: "固定for循环不是动态Agent；无限循环会失控" },
    { name: "控制与可观测", question: "谁能做什么，出了问题怎样追查？", input: "权限、预算、策略、人工审批", output: "允许/拒绝、日志、告警与停止", risk: "没有控制层，能力越强可能风险越大" },
  ];
  const item = modules[active];
  return <div className="architecture-explorer"><div className="architecture-list">{modules.map((module, index) => <button type="button" key={module.name} className={active === index ? "active" : ""} onClick={() => setActive(index)}><b>{String(index + 1).padStart(2, "0")}</b><span>{module.name}</span></button>)}</div><section><span>Agent系统模块 {active + 1}/6</span><h3>{item.name}</h3><strong>{item.question}</strong><div><small>读取</small><p>{item.input}</p></div><div><small>产出</small><p>{item.output}</p></div><blockquote><b>若设计不好</b><p>{item.risk}</p></blockquote><button type="button" onClick={() => setActive((active + 1) % modules.length)}>{active === modules.length - 1 ? "重新查看" : "下一块 →"}</button></section></div>;
}

type ToolMode = "ok" | "error" | "denied";

export function ToolContractLab() {
  const [mode, setMode] = useState<ToolMode>("ok");
  const results = {
    ok: { label: "查询成功", status: "ok", payload: "arrival_city: 南京\nsource: flight_records.csv / T2017", next: "城市与报销说明矛盾 → 继续查询酒店与CRM" },
    error: { label: "工具超时", status: "error", payload: "code: TIMEOUT\nretryable: true", next: "记录失败；在预算内重试一次，仍失败则转人工" },
    denied: { label: "权限拒绝", status: "denied", payload: "required_scope: travel.read\ngranted: false", next: "不得绕过权限；请求审批或受控停止" },
  } as const;
  const current = results[mode];
  return <div className="tool-contract-lab"><div className="tool-contract-head"><div><span>互动 · 工具契约</span><h3>Agent不是“会点按钮”，而是按契约调用函数</h3></div><div>{(Object.keys(results) as ToolMode[]).map(key => <button type="button" key={key} className={mode === key ? "active" : ""} onClick={() => setMode(key)}>{results[key].label}</button>)}</div></div><div className="tool-contract-grid"><div><span>工具说明 Schema</span><pre>{"name: query_flight\npurpose: 查询真实抵达城市\ninput: trip_id (required)\npermission: travel.read\ntimeout: 3s"}</pre></div><i>调用 →</i><div><span>模型生成的参数</span><pre>{'{\n  "trip_id": "T2017"\n}'}</pre></div><i>返回 →</i><div className={`result ${mode}`}><span>结构化结果</span><pre>{`status: ${current.status}\n${current.payload}`}</pre></div></div><div className="tool-next"><span>编排器下一步</span><strong>{current.next}</strong><p>工具结果是观察事实，不是模型的自由文本。成功、无结果、超时和无权限必须明确区分。</p></div></div>;
}

export function AgentStateExplorer() {
  const [active, setActive] = useState(0);
  const layers = [
    { name: "工作状态 State", value: "本次任务实时进展", detail: "目标、已取得证据、待核实缺口、工具失败、调用次数、下一候选行动。每轮循环都要更新。", example: "evidence.flight=南京；missing=酒店/CRM；calls=2/5" },
    { name: "长期记忆 Memory", value: "跨任务可复用的信息", detail: "经过治理的制度摘要、用户偏好或历史经验。它不是天然可靠的事实库，必须有来源、版本和过期规则。", example: "policy_version=2026-04；expires_at=2026-12-31" },
    { name: "运行轨迹 Trace", value: "完整、不可混淆的过程记录", detail: "保存每次模型输入、工具参数、原始返回、策略判断、人工批准和停止原因，用于复盘、评价和问责。", example: "step_03 tool=query_hotel result_id=H-T2017 decision=continue" },
  ];
  const stop = [["成功停止", "所需证据达到预定完整度"], ["预算停止", "工具次数、Token或时间达到上限"], ["失败停止", "关键工具不可用或权限不足"], ["风险停止", "证据冲突、低置信或触及禁止动作"], ["人工停止", "审批人决定终止、改道或扩围"]];
  const item = layers[active];
  return <div className="agent-state-explorer"><div className="state-tabs">{layers.map((layer, index) => <button type="button" key={layer.name} className={active === index ? "active" : ""} onClick={() => setActive(index)}><b>0{index + 1}</b><span>{layer.name}</span></button>)}</div><div className="state-detail"><span>{item.value}</span><h3>{item.name}</h3><p>{item.detail}</p><code>{item.example}</code></div><div className="stop-grid"><span>五类停止条件</span>{stop.map(([name, detail]) => <article key={name}><strong>{name}</strong><p>{detail}</p></article>)}</div></div>;
}

export function AgentControlLab() {
  const [level, setLevel] = useState(1);
  const levels = [
    { name: "建议模式", desc: "只生成建议，不调用业务工具", allowed: ["解释已有材料", "列出证据缺口"], approval: [] as string[], denied: ["查询系统", "写入底稿", "发送邮件"] },
    { name: "只读调查", desc: "允许在白名单内自动读取", allowed: ["查航班/酒店/CRM", "计算与比对", "形成证据包"], approval: ["扩大数据范围"], denied: ["修改源数据", "自动定性"] },
    { name: "受控执行", desc: "低风险写操作经过审批后执行", allowed: ["只读调查", "保存草稿"], approval: ["写入正式底稿", "外发通知"], denied: ["删除记录", "签发审计意见"] },
  ];
  const item = levels[level];
  return <div className="agent-control-lab"><div className="control-levels">{levels.map((entry, index) => <button type="button" key={entry.name} className={level === index ? "active" : ""} onClick={() => setLevel(index)}><b>级别 {index + 1}</b><strong>{entry.name}</strong><p>{entry.desc}</p></button>)}</div><div className="control-actions"><div className="allowed"><span>可自动</span>{item.allowed.map(x => <strong key={x}>{x}</strong>)}</div><div className="approval"><span>需人工批准</span>{item.approval.length ? item.approval.map(x => <strong key={x}>{x}</strong>) : <strong>无写操作权限</strong>}</div><div className="denied"><span>始终禁止</span>{item.denied.map(x => <strong key={x}>{x}</strong>)}</div></div><p><b>原则：</b>自主度是风险配置，不是能力排名。审计场景通常从建议模式或只读调查开始。</p></div>;
}

export function AuditChapterRoute() {
  return <ChapterRoute label="第三部分学习路线" title="从通用Agent，搭出证据可复核、责任不越界的审计智能体" items={[
    ["01", "定义审计交付", "先说清要形成什么、不允许形成什么"],
    ["02", "选择窄场景", "判断是否值得且适合使用Agent"],
    ["03", "组合技术能力", "规则、ML、ANN、LLM各司其职"],
    ["04", "连接数据与制度", "关联键、来源、版本与权限"],
    ["05", "设计端到端流程", "筛查、调查、取证、复核"],
    ["06", "形成证据包", "事实、标准、证据、不确定性、建议"],
    ["07", "建立治理控制", "权限、注入、隐私、日志与职责"],
    ["08", "评价并逐步上线", "影子运行、试点、门槛与扩围"],
  ]} />;
}

type SceneKey = "travel" | "opinion" | "duplicate" | "universal";

export function AuditScenarioSelector() {
  const [selected, setSelected] = useState<SceneKey>("travel");
  const scenes: Record<SceneKey, { name: string; verdict: string; scores: number[]; reason: string; route: string }> = {
    travel: { name: "差旅报销初审", verdict: "适合作为首个试点", scores: [5,5,4,5,5], reason: "高频、数据较齐、证据字段明确，并且天然有审计人员复核。", route: "规则筛查 + 模型理解 + Agent只读调查" },
    duplicate: { name: "重复发票检查", verdict: "值得做，但不必先用Agent", scores: [5,5,5,5,5], reason: "条件和路径高度确定，普通代码/工作流更便宜、更稳定、更易解释。", route: "优先规则与固定工作流" },
    opinion: { name: "自动签发审计意见", verdict: "不应自动化", scores: [1,2,1,1,1], reason: "涉及重大职业判断、责任承担和正式对外结论，不能交给Agent自主完成。", route: "只允许辅助整理，结论由人" },
    universal: { name: "万能审计智能体", verdict: "目标过宽，暂不立项", scores: [1,1,1,1,2], reason: "目标、数据、证据标准和权限边界都不清楚，无法可靠测试或治理。", route: "拆成多个窄任务再评估" },
  };
  const labels = ["任务边界", "数据可得", "证据可定义", "重复频率", "人工复核"];
  const item = scenes[selected];
  return <div className="audit-scene-selector"><div className="scene-list">{(Object.keys(scenes) as SceneKey[]).map(key => <button type="button" key={key} className={selected === key ? "active" : ""} onClick={() => setSelected(key)}><strong>{scenes[key].name}</strong><span>{scenes[key].verdict}</span></button>)}</div><section><span>场景适配诊断</span><h3>{item.name}</h3><div className="scene-scores">{labels.map((label, i) => <div key={label}><b>{label}</b><i><span style={{ width: `${item.scores[i] * 20}%` }} /></i><strong>{item.scores[i]}/5</strong></div>)}</div><blockquote>{item.reason}</blockquote><p><b>建议技术路线：</b>{item.route}</p></section></div>;
}

export function AuditEvidenceMap() {
  const sources = ["报销", "发票", "审批", "航班", "酒店", "CRM", "OCR", "日历", "员工主数据"];
  return <div className="audit-evidence-map"><div className="evidence-sources"><span>事实来源 · 9张表</span><div>{sources.map(source => <b key={source}>{source}</b>)}</div></div><i>通过 claim_id / invoice_no / trip_id / employee_id 关联</i><div className="evidence-policy"><span>适用标准 · 2份制度</span><strong>费用制度</strong><strong>特殊事项通知</strong><p>必须保存版本、生效日期和检索段落。</p></div><i>进入受控处理层</i><div className="evidence-processing"><span>能力组合</span><div><b>规则</b><b>ML</b><b>ANN</b><b>LLM</b><b>Agent</b></div><p>每个结果都携带来源、时间、关联键和处理记录。</p></div><i>形成</i><div className="evidence-output"><span>审计交付</span><strong>可复核疑点证据包</strong><p>不是单独一个风险分数，也不是模型自动定性。</p></div></div>;
}

export function EvidencePackageLab() {
  const [active, setActive] = useState(0);
  const parts = [
    { name: "事实 Facts", value: "报销称“上海机场→苏州客户”；航班实际抵达南京；当晚南京入住。", source: "expense_claims.csv / flight_records.csv / hotel_records.csv", check: "只写系统返回，不混入推测" },
    { name: "标准 Criteria", value: "差旅费用应与真实业务行程一致；异常事项需补充说明和审批。", source: "expense_policy.md · 生效版本2026-04", check: "保留制度版本、条款与适用日期" },
    { name: "证据 Evidence", value: "航班、酒店、CRM、日历四个来源共同指向南京，无苏州客户拜访。", source: "T2017 / E1004 的关联记录及查询时间", check: "证据要可回到原始记录重新核对" },
    { name: "不确定性 Uncertainty", value: "尚未取得员工解释；不能排除临时改签、代办或记录缺失。", source: "工具均成功，但人员访谈未完成", check: "明确缺口，不把“未发现”写成“不存在”" },
    { name: "建议 Action", value: "转人工复核；取得行程变更说明、客户证明和审批附件。", source: "Agent停止原因：证据矛盾达到升级阈值", check: "建议下一步，不自动认定违规或舞弊" },
  ];
  const item = parts[active];
  return <div className="evidence-package-lab"><div className="package-tabs">{parts.map((part, index) => <button type="button" key={part.name} className={active === index ? "active" : ""} onClick={() => setActive(index)}><b>0{index + 1}</b><span>{part.name}</span></button>)}</div><section><span>BX-42017 · 证据包 {active + 1}/5</span><h3>{item.name}</h3><strong>{item.value}</strong><div><small>来源/状态</small><p>{item.source}</p></div><blockquote><b>复核检查</b><p>{item.check}</p></blockquote><button type="button" onClick={() => setActive((active + 1) % parts.length)}>{active === parts.length - 1 ? "重新检查" : "检查下一项 →"}</button></section></div>;
}

export function AuditEvaluationLab() {
  const [stage, setStage] = useState(0);
  const stages = [
    { name: "离线基准", scope: "冻结样本，不接生产", gate: "事实与证据字段达到预定正确率", metrics: ["疑点召回率", "误报率", "证据引用正确率", "同输入稳定性"] },
    { name: "影子运行", scope: "读取真实数据，不影响人工流程", gate: "与人工结果对比，重大遗漏为零或可接受", metrics: ["人工覆盖率", "遗漏原因", "工具失败率", "平均处理时长"] },
    { name: "小范围试点", scope: "单部门/单费用类型，人工逐条批准", gate: "质量、效率和风险指标同时达标", metrics: ["复核通过率", "人工改写率", "单笔成本", "权限/安全事件"] },
    { name: "受控扩围", scope: "逐步增加数据与场景，不放松人工关口", gate: "持续监控、回滚方案和责任人已就位", metrics: ["分场景漂移", "系统可用性", "审计日志完整率", "实际节省工时"] },
  ];
  const item = stages[stage];
  return <div className="audit-evaluation-lab"><div className="evaluation-stages">{stages.map((entry, index) => <button type="button" key={entry.name} className={stage === index ? "active" : ""} onClick={() => setStage(index)}><b>0{index + 1}</b><strong>{entry.name}</strong></button>)}</div><section><span>上线阶段 {stage + 1}/4</span><h3>{item.name}</h3><div><small>运行范围</small><p>{item.scope}</p></div><div><small>进入下一阶段的门槛</small><p>{item.gate}</p></div><div className="evaluation-metrics">{item.metrics.map(metric => <strong key={metric}>{metric}</strong>)}</div><button type="button" onClick={() => setStage((stage + 1) % stages.length)}>{stage === stages.length - 1 ? "重新查看" : "下一阶段 →"}</button></section></div>;
}
