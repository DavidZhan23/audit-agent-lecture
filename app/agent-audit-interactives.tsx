"use client";

import { useState } from "react";

type RouteItem = [string, string, string];

function ChapterRoute({ label, title, items }: { label: string; title: string; items: RouteItem[] }) {
  return <div className="focus-route"><div className="focus-route-head"><span>{label}</span><strong>{title}</strong></div><div>{items.map(([no, name, detail]) => <article key={no}><b>{no}</b><strong>{name}</strong><p>{detail}</p></article>)}</div></div>;
}

export function AgentChapterRoute() {
  return <ChapterRoute label="第二部分 · 学习路线" title="定义 → 运行 → 控制 → 建设" items={[
    ["06", "什么是Agent", "从一次回答到行动—反馈闭环"],
    ["07", "Agent怎样运行", "模块、工具、状态与反馈循环"],
    ["08", "Agent怎样受控", "风险、自主度与控制生命周期"],
    ["09", "Agent怎样落地", "价值、评价与建设顺序"],
  ]} />;
}

export function FoundationChapterRoute({ onSelect }: { onSelect?: (id: string) => void }) {
  const items = [
    { id: "code", no: "02", method: "规则", title: "基于任务逻辑的编程", detail: "判断条件写得清时，用确定性程序直接解决。" },
    { id: "ml", no: "03", method: "ML", title: "经典机器学习", detail: "多个弱信号难以穷举，从历史结果学习组合权重。" },
    { id: "nn", no: "04", method: "ANN", title: "ANN", detail: "异常藏在高维像素里，需要直接处理图像输入。" },
    { id: "llm", no: "05", method: "LLM", title: "从 ANN 到 LLM", detail: "矛盾藏在语言与业务语境中，需要理解与生成。" },
  ];
  return (
    <nav className="foundation-toc" aria-label="第一部分章节目录">
      <div className="foundation-toc-head">
        <span>第一部分 · 章节目录</span>
      </div>
      <ol className="foundation-toc-flow" aria-hidden="true">
        {items.map((item, index) => (
          <li key={item.method}>
            <span>{item.method}</span>
            {index < items.length - 1 && <i />}
          </li>
        ))}
      </ol>
      <div className="foundation-toc-grid">
        {items.map(item => (
          <button type="button" key={item.id} onClick={() => onSelect?.(item.id)}>
            <b>{item.no}</b>
            <span className="foundation-toc-method">{item.method}</span>
            <strong>{item.title}</strong>
            <p>{item.detail}</p>
          </button>
        ))}
      </div>
    </nav>
  );
}

type FitKey = "calculator" | "workflow" | "assistant" | "investigation";

export function AgentFitLab() {
  const [selected, setSelected] = useState<FitKey>("investigation");
  const tasks: Record<FitKey, { name: string; facts: string[]; verdict: string; reason: string; build: string }> = {
    calculator: { name: "差旅标准计算器", facts: ["公式明确", "路径固定", "不需要外部反馈"], verdict: "普通程序", reason: "输入与答案关系可以完整写出，用Agent只会增加成本和不确定性。", build: "函数 + 规则测试" },
    workflow: { name: "新员工入职办理", facts: ["步骤预先定义", "分支有限", "多系统串联"], verdict: "固定工作流", reason: "虽然连接多个系统，但下一步主要由事先设计的流程图决定。", build: "流程引擎 + API" },
    assistant: { name: "根据材料起草摘要", facts: ["一次输入输出", "不主动取数", "结果由人使用"], verdict: "LLM应用", reason: "模型只需理解已提供材料并生成文本，没有持续行动与反馈闭环。", build: "检索/提示 + LLM" },
    investigation: { name: "跨系统调查异常订单", facts: ["路径事前不完整", "查询结果改变下一步", "需要状态与停止条件"], verdict: "适合Agent", reason: "任务需要围绕目标动态选择工具、读取结果并决定继续、改道或停止。", build: "LLM决策 + 工具 + 状态 + 编排 + 控制" },
  };
  const item = tasks[selected];
  return <div className="agent-fit-lab"><div className="fit-options">{(Object.keys(tasks) as FitKey[]).map(key => <button type="button" key={key} className={selected === key ? "active" : ""} onClick={() => setSelected(key)}><strong>{tasks[key].name}</strong><span>{tasks[key].verdict}</span></button>)}</div><section><span>判断练习</span><h3>{item.name}</h3><div className="fit-facts">{item.facts.map(fact => <b key={fact}>{fact}</b>)}</div><p>{item.reason}</p><div><small>推荐实现</small><strong>{item.build}</strong></div><blockquote><b>判定依据：</b>新观察是否改变路径；是否需要持续状态与受控停止。</blockquote></section></div>;
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
  return <ChapterRoute label="第三部分 · 应用路线" title="定功能 → 做问数 → 写报告 → 建底座" items={[
    ["10", "定义审计功能", "先定工作产品，再选技术"],
    ["11", "智能问数", "问题 → 口径 → 查询 → 可信数字"],
    ["12", "智能报告", "冻结发现 → 草稿 → 校验 → 审批"],
    ["13", "底座与上线", "证据链、治理、评价与试点"],
  ]} />;
}

type CapabilityKey = "ask" | "screen" | "investigate" | "workpaper" | "report" | "monitor";

export function AuditCapabilityMap() {
  const [selected, setSelected] = useState<CapabilityKey>("ask");
  const items: Record<CapabilityKey, { name: string; question: string; input: string; output: string; stack: string; boundary: string }> = {
    ask: { name: "智能问数", question: "华东区二季度差旅费同比增长多少？", input: "自然语言问题 + 数据目录 + 指标口径", output: "数字、口径、查询、来源和限制", stack: "语义层 + SQL工具 + LLM解释 + 校验", boundary: "答案只代表获准数据与确定口径，不能自动成为审计结论。" },
    screen: { name: "智能风险筛查", question: "哪些报销最值得优先核查？", input: "规则、特征、历史标签和当期待审数据", output: "疑点队列、触发规则和风险信号", stack: "规则 + ML/ANN + 阈值策略", boundary: "概率用于排序，不能代替证据。" },
    investigate: { name: "智能取证调查", question: "该行程矛盾还缺哪些证据？", input: "明确目标 + 只读工具 + 当前证据状态", output: "来源可追溯的证据包和未决事项", stack: "Agent + 工具 + 状态 + 停止条件", boundary: "只能在批准范围内取数；访谈和扩围需要人工关口。" },
    workpaper: { name: "智能底稿助手", question: "怎样把证据整理成标准工作底稿？", input: "已复核证据、程序模板和审计记录", output: "带引用的底稿草稿和复核清单", stack: "模板引擎 + LLM + 引用校验", boundary: "机器草稿必须标记并保留人工修订链。" },
    report: { name: "智能报告生成", question: "怎样从已确认发现形成报告草稿？", input: "冻结发现库、证据、回应和报告模板", output: "带来源的章节草稿、图表和版本记录", stack: "发现数据模型 + LLM + 确定性校验 + 审批流", boundary: "不得补写原因、影响、评级或管理层回应。" },
    monitor: { name: "持续审计监控", question: "新交易何时触发预警并进入复核？", input: "事件流、规则模型、阈值和运行日历", output: "预警、趋势、任务和关闭记录", stack: "流处理 + 规则/模型 + 工单系统", boundary: "阈值、漂移、误报和责任人需要持续治理。" },
  };
  const item = items[selected];
  return <div className="audit-capability-map"><div className="capability-options">{(Object.keys(items) as CapabilityKey[]).map((key, index) => <button type="button" key={key} className={selected === key ? "active" : ""} onClick={() => setSelected(key)}><b>{String(index + 1).padStart(2, "0")}</b><span>{items[key].name}</span></button>)}</div><section><span>审计功能 {item.name}</span><h3>{item.question}</h3><div className="capability-io"><div><small>需要输入</small><p>{item.input}</p></div><i>→</i><div><small>形成输出</small><p>{item.output}</p></div></div><div className="capability-stack-line"><small>推荐能力组合</small><strong>{item.stack}</strong></div><blockquote>{item.boundary}</blockquote></section></div>;
}

type AskDataMode = "growth" | "risk" | "ambiguous" | "denied";

export function AskDataLab() {
  const [mode, setMode] = useState<AskDataMode>("growth");
  const cases: Record<AskDataMode, { label: string; question: string; status: string; state: "ok" | "clarify" | "denied"; contract: string[]; plan: string; query: string; answer: string; proof: string[] }> = {
    growth: { label: "指标查询", question: "2026年二季度华东区差旅费同比增长多少？", status: "已验证后回答", state: "ok", contract: ["期间：2026Q2 vs 2025Q2", "范围：华东区在册主体", "指标：已入账差旅费（不含冲销）", "币种：人民币本位币"], plan: "按法人和季度聚合差旅费；统一币种；排除冲销；计算同比。", query: "SELECT quarter, SUM(travel_amount_cny)\nFROM certified_expense_fact\nWHERE region='华东' AND quarter IN ('2025Q2','2026Q2')\n  AND reversal_flag=false\nGROUP BY quarter", answer: "2026Q2为1,248万元，较2025Q2的1,060万元增长17.7%。", proof: ["指标：finance.travel_expense_cny v3", "数据快照：2026-07-15 08:00", "校验：分法人合计=集团合计", "权限：east_region.read"] },
    risk: { label: "多表追问", question: "增长主要来自哪些部门？其中多少被规则标记为异常？", status: "多表查询并保留口径", state: "ok", contract: ["沿用上一问期间与区域", "贡献：同比增量金额", "异常：规则库v12任一规则命中", "部门：交易日组织归属"], plan: "连接费用事实、组织历史和规则命中表；按同比增量排序并统计异常金额。", query: "WITH growth AS (...)\nSELECT department, yoy_increase,\n       SUM(CASE WHEN rule_hit THEN amount ELSE 0 END) AS flagged_amount\nFROM growth JOIN org_history USING(employee_id, effective_date)\nGROUP BY department ORDER BY yoy_increase DESC", answer: "销售二部贡献增量96万元，其中规则标记金额21万元；渠道部贡献54万元，标记8万元。", proof: ["关联：employee_id + effective_date", "规则库：expense_rules v12", "查询ID：AQ-2026-0715-042", "提示：标记金额不是确认错报"] },
    ambiguous: { label: "口径不清", question: "最近华东差旅花得怎么样？", status: "暂停并请求澄清", state: "clarify", contract: ["“最近”未定义", "“华东”可能指主体或发生地", "“怎么样”缺少比较基准", "差旅费口径未确认"], plan: "不得猜测口径。先向提问人给出可选择的期间、组织范围、指标和比较方式。", query: "未生成查询：语义契约不完整", answer: "请确认：①最近是本月、季度还是12个月；②华东按公司归属还是消费发生地；③比较预算、同比还是环比？", proof: ["状态：needs_clarification", "未访问业务数据", "未消耗查询预算", "澄清后重新生成任务ID"] },
    denied: { label: "权限拒绝", question: "列出全部员工身份证号、工资和差旅明细。", status: "拒绝执行并留下日志", state: "denied", contract: ["请求包含高敏个人信息", "当前角色只有费用汇总权限", "目的与最小必要原则不匹配", "不存在已批准的数据扩围"], plan: "权限引擎在生成SQL前阻断；不得通过别名、分批查询或其他工具绕过。", query: "BLOCKED_BY_POLICY: pii.payroll.read 未授权", answer: "无法执行该查询。可以提供经脱敏、按部门汇总的差旅指标；如确有审计需要，请走数据扩围审批。", proof: ["策略：DATA-MIN-07", "所需权限：pii.payroll.read", "当前权限：expense.aggregate.read", "事件已写入安全日志"] },
  };
  const item = cases[mode];
  return <div className="ask-data-lab"><div className="ask-data-tabs">{(Object.keys(cases) as AskDataMode[]).map(key => <button type="button" key={key} className={mode === key ? "active" : ""} onClick={() => setMode(key)}><strong>{cases[key].label}</strong><span>{cases[key].state === "ok" ? "可执行" : cases[key].state === "clarify" ? "需澄清" : "被拒绝"}</span></button>)}</div><section><div className="ask-data-question"><span>审计人员提问</span><h3>“{item.question}”</h3><b className={item.state}>{item.status}</b></div><div className="ask-data-contract">{item.contract.map(value => <span key={value}>{value}</span>)}</div><div className="ask-data-plan"><small>语义计划</small><p>{item.plan}</p></div><pre className={`ask-data-query ${item.state}`}>{item.query}</pre><div className="ask-data-answer"><small>系统回答</small><strong>{item.answer}</strong></div><div className="ask-data-proof">{item.proof.map(value => <span key={value}>{value}</span>)}</div></section></div>;
}

type ReportMode = "ready" | "missing" | "conflict";

export function ReportGenerationLab() {
  const [mode, setMode] = useState<ReportMode>("ready");
  const cases: Record<ReportMode, { label: string; state: "ready" | "warning" | "blocked"; status: string; checks: Array<[string, string]>; draft: string; action: string }> = {
    ready: { label: "证据完整", state: "ready", status: "可生成草稿，仍需人工复核", checks: [["事实", "已确认"], ["标准", "已引用"], ["原因", "访谈确认"], ["影响", "已量化"], ["回应", "已取得"]], draft: "抽查发现，BX-42017报销说明记载“上海机场至苏州客户”，但航班及酒店记录显示员工当日抵达并入住南京〔证据E-17、E-18〕。该情况不符合差旅费用应与实际业务行程一致的要求〔制度P-04〕。经访谈确认，原因是行程变更后未同步更新报销说明〔访谈E-19〕，涉及金额468元。建议增加行程变更校验并由业务负责人复核异常目的地。管理层已同意整改，并计划于2026年9月上线校验规则〔回应M-03〕。", action: "进入审计人员逐句复核；确认评级、措辞、建议和管理层回应后送审批。" },
    missing: { label: "原因缺失", state: "warning", status: "允许生成带占位符草稿", checks: [["事实", "已确认"], ["标准", "已引用"], ["原因", "未取得"], ["影响", "待量化"], ["回应", "未取得"]], draft: "抽查发现，BX-42017报销说明与航班、酒店记录存在目的地不一致〔证据E-17、E-18〕，不符合差旅信息应与实际行程一致的要求〔制度P-04〕。【原因待访谈确认】【影响待审计人员评价】【管理层回应待取得】。", action: "不得补写看似合理的原因；创建访谈和影响量化任务，完成后重新生成。" },
    conflict: { label: "数字冲突", state: "blocked", status: "校验失败，禁止生成", checks: [["事实", "冲突"], ["标准", "已引用"], ["原因", "已确认"], ["影响", "金额不一致"], ["回应", "已取得"]], draft: "已阻断：证据包金额为468元，发现登记表为486元，报告汇总表为468元。任何正文与图表生成均暂停。", action: "由审计人员确认正确金额、修订来源记录并重新冻结发现版本。系统不得自行选择其中一个数字。" },
  };
  const item = cases[mode];
  return <div className="report-generation-lab"><div className="report-mode-tabs">{(Object.keys(cases) as ReportMode[]).map(key => <button type="button" key={key} className={mode === key ? "active" : ""} onClick={() => setMode(key)}><strong>{cases[key].label}</strong><span>{cases[key].state === "ready" ? "通过" : cases[key].state === "warning" ? "带缺口" : "阻断"}</span></button>)}</div><section><div className="report-status"><span>生成前质量门</span><h3>{item.status}</h3></div><div className="report-checks">{item.checks.map(([name, status]) => <div key={name}><span>{name}</span><b className={status === "已确认" || status === "已引用" || status === "已量化" || status === "已取得" || status === "访谈确认" ? "ok" : status === "冲突" || status === "金额不一致" ? "bad" : "warn"}>{status}</b></div>)}</div><article className={`report-draft ${item.state}`}><span>报告段落草稿</span><p>{item.draft}</p></article><div className="report-next"><small>下一动作</small><strong>{item.action}</strong></div></section></div>;
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

export function AuditResponsibilityLab() {
  const [active, setActive] = useState(0);
  const steps = [
    { name: "数据完整性检查", system: "自动检查字段、主键、日期范围和关联失败", human: "确认检查范围与容忍阈值", handoff: "异常数据清单 + 规则版本", reason: "判断逻辑明确、重复量大，适合确定性代码。" },
    { name: "疑点优先级排序", system: "规则与模型给出风险信号、概率和触发原因", human: "根据审计目标调整阈值与资源分配", handoff: "排序结果 + 模型版本 + 触发特征", reason: "模型可以帮助排序，但概率本身不是证据。" },
    { name: "跨系统取证", system: "Agent在白名单内查询航班、酒店、CRM和制度", human: "批准扩围、高敏数据和任何写操作", handoff: "原始返回 + 参数 + 时间 + 失败记录", reason: "动态查询适合Agent，但权限和范围必须由人预设。" },
    { name: "证据评价", system: "并列事实、冲突、来源和缺失项", human: "评价证据是否充分、适当、可靠并处理矛盾", handoff: "证据包 + 未解决问题", reason: "证据质量评价涉及专业标准与具体情境。" },
    { name: "访谈与沟通", system: "生成问题清单和资料请求草稿", human: "实施访谈、观察反应并开展追问", handoff: "经确认的访谈记录", reason: "沟通包含语境、责任和职业怀疑，不能由系统替代。" },
    { name: "定性与报告", system: "按模板整理事实与引用，不签发结论", human: "形成发现、判断影响、批准底稿与报告", handoff: "责任人签署的审计工作产品", reason: "重大职业判断和审计责任必须由具名人员承担。" },
  ];
  const item = steps[active];
  return <div className="audit-responsibility-lab"><div className="responsibility-steps">{steps.map((step, index) => <button type="button" key={step.name} className={active === index ? "active" : ""} onClick={() => setActive(index)}><b>{String(index + 1).padStart(2, "0")}</b><span>{step.name}</span></button>)}</div><section><span>人机协作步骤 {active + 1}/6</span><h3>{item.name}</h3><div className="responsibility-columns"><div><small>系统负责</small><p>{item.system}</p></div><div><small>审计人员负责</small><p>{item.human}</p></div></div><div className="responsibility-handoff"><small>交接时必须留下</small><strong>{item.handoff}</strong></div><blockquote>{item.reason}</blockquote><button type="button" onClick={() => setActive((active + 1) % steps.length)}>{active === steps.length - 1 ? "重新查看" : "下一环节 →"}</button></section></div>;
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
