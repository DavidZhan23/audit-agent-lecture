"use client";

import { useEffect, useState } from "react";

type AgentTypeKey = "knowledge" | "task" | "planning";

const agentRoute = [
  { id: "agent", no: "06", title: "为什么仅有大语言模型还不够", detail: "从会回答到真正完成工作的行动缺口" },
  { id: "agent-definition", no: "07", title: "什么是智能体", detail: "定义、组成结构与清晰边界" },
  { id: "agent-loop", no: "08", title: "智能体是怎样工作的", detail: "目标—行动—观察—再判断循环" },
  { id: "agent-knowledge", no: "09", title: "知识型智能体", detail: "检索、阅读、综合回答与引用" },
  { id: "agent-task", no: "10", title: "任务型智能体", detail: "按相对明确流程调用工具完成任务" },
  { id: "agent-planning", no: "11", title: "规划型智能体", detail: "拆分复杂目标并根据结果调整计划" },
  { id: "agent-case", no: "12", title: "完整组合应用", detail: "转分包风险识别与审计分析" },
  { id: "agent-value", no: "13", title: "价值与边界", detail: "工作方式变化、治理与人工责任" },
] as const;

const architectureModules = [
  { name: "目标", role: "说明要完成什么，以及什么算完成。", input: "用户任务、范围、交付物", output: "当前目标与成功条件", risk: "目标模糊会让任务不断扩张。" },
  { name: "大语言模型", role: "理解要求、分析当前信息并提出下一步。", input: "目标、上下文、状态、工具说明", output: "回答、判断或结构化行动请求", risk: "可能误解任务、选错工具或过度自信。" },
  { name: "上下文", role: "承载本轮判断所需的问题、证据与约束。", input: "用户输入、检索材料、工具结果", output: "送入模型的本轮信息", risk: "内容过多、冲突或过期会影响判断。" },
  { name: "知识", role: "提供企业制度、业务文档、历史案例和专业规则。", input: "被授权的知识库与文件", output: "相关片段、版本与来源", risk: "检索不到或版本过期会导致依据不完整。" },
  { name: "记忆与状态", role: "记录已经做了什么、得到了什么、还缺什么。", input: "每一步行动、结果、失败和人工决定", output: "可继续执行的任务状态", risk: "对话历史不等于永久记忆，保存与重新提供都由系统负责。" },
  { name: "工具", role: "查询数据、读取文件、生成材料或操作业务系统。", input: "经过校验的工具名称与参数", output: "结构化结果、来源或错误", risk: "模型只提出调用请求，应用程序校验权限并真正执行。" },
  { name: "规则与权限", role: "限制可以访问什么、执行什么、何时必须请人确认。", input: "身份、白名单、风险级别和预算", output: "允许、阻断或暂停审批", risk: "不能只靠提示文字约束权限。" },
  { name: "运行机制", role: "组织模型判断、工具执行、状态更新和停止。", input: "目标、策略、当前状态和停止条件", output: "继续、改道、完成或转人工", risk: "必须限制步骤、时间、资源和重试次数。" },
] as const;

const loopSteps = [
  {
    title: "理解目标",
    status: "任务已受理",
    tool: "暂不调用工具",
    input: "检查主合同甲是否存在转分包风险，并形成初步分析报告。",
    output: "交付物需要包含风险等级、关联合同、证据、不确定项和复核建议。",
    decision: "先检索转分包判断规则，再获取主合同。",
  },
  {
    title: "检索制度",
    status: "已找到现行规则",
    tool: "企业知识检索",
    input: "关键词：转分包、工作范围承接、实际执行主体；仅检索现行版本。",
    output: "返回三条判断规则、制度版本、生效日期和原文位置。",
    decision: "已有判断标准，下一步获取主合同基本信息。",
  },
  {
    title: "查询合同",
    status: "已取得主合同信息",
    tool: "合同查询",
    input: "{ 合同编号：甲，字段：名称、金额、签约主体、工作范围、签订时间 }",
    output: "生产数据治理及质量提升；金额八百六十万元；范围包括清洗、标准化、质量检查和数据入湖。",
    decision: "需要正文和潜在关联合同，先获取合同文件。",
  },
  {
    title: "获取正文",
    status: "正文已解析",
    tool: "合同文件读取",
    input: "{ 合同编号：甲，文件类型：正文与附件，保留页码来源：是 }",
    output: "已取得正文和两份附件；提取交付成果、项目边界和禁止转包条款。",
    decision: "根据工作范围和交付成果搜索候选合同。",
  },
  {
    title: "语义匹配",
    status: "召回十八份候选",
    tool: "关联合同检索",
    input: "范围：主合同签订后两年；检索清洗、标准化、数据入湖及语义相近内容。",
    output: "十八份候选；其中五份工作范围高度相关，十三份仅名称或关键词相似。",
    decision: "优先读取五份高潜候选的正文并比较主体、时间和金额。",
  },
  {
    title: "分析候选",
    status: "两份高风险、一份材料不全",
    tool: "规则分析",
    input: "主合同与五份候选的工作范围、签约主体、时间、金额、交付成果和证据来源。",
    output: "候选乙、丙高度承接主合同核心工作；候选丁缺少任务分工附件。",
    decision: "证据强度不同，需先区分可判断项与待补充项。",
  },
  {
    title: "判断证据",
    status: "证据链已分级",
    tool: "证据完整性检查",
    input: "检查每条事实是否有原文页码、制度条款、工具来源和冲突说明。",
    output: "乙证据完整；丙存在合理业务解释待核；丁缺少关键附件，不能形成判断。",
    decision: "正式结论前必须由审计人员确认乙、丙，并决定是否补取丁的材料。",
  },
  {
    title: "人工确认",
    status: "等待审计人员决定",
    tool: "人工审批关口",
    input: "确认高风险候选、冲突解释和材料补充清单；禁止自动写入正式结论。",
    output: "教学模拟：人工同意将乙列为高风险，将丙、丁列入待核实事项。",
    decision: "可以生成初步报告，但必须保留不确定项和人工确认记录。",
  },
  {
    title: "生成报告",
    status: "任务完成并安全停止",
    tool: "报告生成",
    input: "已确认事实、证据编号、风险分级、不确定项、人工决定和模板。",
    output: "生成初步分析报告：一项高风险、两项待核实；附证据链、限制和后续建议。",
    decision: "达到成功条件；保存运行轨迹，停止继续调用工具。",
  },
] as const;

const agentTypes: Record<AgentTypeKey, {
  label: string;
  question: string;
  input: string;
  steps: string[];
  output: string;
  scenes: string;
  autonomy: string;
  human: string;
  structure: string[];
}> = {
  knowledge: {
    label: "知识型",
    question: "我应该根据哪些知识回答？",
    input: "自然语言问题 + 用户可访问的企业知识",
    steps: ["理解并改写问题", "检索现行制度", "筛选相关片段", "综合多份材料", "回答并绑定来源"],
    output: "答案、摘要、制度解释、引用来源与证据不足提示",
    scenes: "制度知识助手、产品资料问答、历史案例检索",
    autonomy: "较低：主要读取与回答，不直接改变业务数据。",
    human: "重要制度判断由人核实；冲突或无材料时明确升级。",
    structure: ["用户问题", "问题理解", "企业知识检索", "文档证据", "综合回答", "答案 + 引用"],
  },
  task: {
    label: "任务型",
    question: "怎样按照相对明确的流程完成任务？",
    input: "明确任务 + 清楚参数 + 预设流程",
    steps: ["理解任务参数", "获取材料", "执行预设流程", "在节点使用模型判断", "调用工具", "生成并提交结果"],
    output: "会议纪要、待办清单、报告、系统记录或通知结果",
    scenes: "会议纪要与任务分发、标准报告生成、表单办理",
    autonomy: "中等：流程相对固定，模型在少数节点处理非结构化信息。",
    human: "缺少负责人、时间或高风险动作时暂停确认。",
    structure: ["提交任务", "理解参数", "预设流程", "节点判断", "工具执行", "结果 / 审批"],
  },
  planning: {
    label: "规划型",
    question: "面对复杂目标，接下来应该做什么？",
    input: "复杂目标 + 约束 + 可用知识和工具",
    steps: ["分析目标", "拆分子任务", "形成初步计划", "执行一项", "观察结果", "调整计划", "汇总成果"],
    output: "多阶段执行结果、专项分析、完整解决方案与综合报告",
    scenes: "专项调查、跨系统分析、资料不完整的复杂研究任务",
    autonomy: "较高但受控：路径可动态变化，权限和停止机制更严格。",
    human: "证据不足、访问敏感系统、改变范围或形成正式结论前确认。",
    structure: ["复杂目标", "任务拆分", "动态计划", "工具执行", "观察反馈", "修改计划", "综合成果"],
  },
};

const planPhases = [
  { name: "理解目标", detail: "确定近三年、相关合同、风险识别、专项报告和权限范围。", result: "形成范围、交付物与禁止事项。" },
  { name: "制定初步计划", detail: "取清单、初筛、获取正文、深度分析、分级、汇总、生成报告。", result: "得到十项有依赖关系的子任务。" },
  { name: "全量初筛", detail: "对五千二百八十六份教学模拟合同进行规则与语义筛选。", result: "初步候选三百一十二份，高潜七十六份；二十五份缺少正文。" },
  { name: "发现并调整", detail: "合同名称差异过大，只有名称匹配会遗漏；部分台账没有正文。", result: "新增工作范围与交付成果的语义匹配，并增加材料补充任务。" },
  { name: "深度分析", detail: "比较工作承接、主体、时间、金额、交付物、证据完整性与合理解释。", result: "证据完整的高风险候选与材料不足候选分开处理。" },
  { name: "分级与交付", detail: "按证据强度分级，形成关系图、典型案例、材料清单和审计建议。", result: "正式结论仍由审计人员复核和批准。" },
] as const;

const combinedTimeline = [
  { title: "提交目标", kind: "规划", detail: "明确要分析主合同甲，并交付关联合同、依据和待核实事项。", state: "目标已登记" },
  { title: "获取主合同", kind: "任务", detail: "调用只读合同查询和文件读取工具，保存来源与页码。", state: "主合同已获取" },
  { title: "检索判断规则", kind: "知识", detail: "检索企业合同制度、历史审计案例和风险标准。", state: "现行规则三条" },
  { title: "全量搜索候选", kind: "规划", detail: "从名称匹配扩大到工作范围和交付成果语义匹配。", state: "召回十八份" },
  { title: "筛选并取正文", kind: "任务", detail: "筛出五份高潜候选，取得其中四份正文。", state: "一份缺附件" },
  { title: "比较证据", kind: "知识 + 任务", detail: "应用制度规则，比较范围、主体、时间、金额和交付成果。", state: "两份高风险" },
  { title: "人工确认", kind: "人工", detail: "证据冲突、缺附件与正式定性前暂停，由审计人员决定。", state: "一项转补充材料" },
  { title: "生成成果", kind: "任务", detail: "输出结论、证据、推理依据、不确定性和后续建议。", state: "初步报告完成" },
] as const;

export function AgentPartRoute({ onSelect }: { onSelect: (id: string) => void }) {
  return <nav className="agent-route" aria-label="第二部分章节目录">
    <div className="agent-route-head"><span>第二部分 · 学习路线</span><strong>发现缺口 → 搭建系统 → 运行循环 → 三类能力 → 组合应用 → 治理边界</strong></div>
    <ol>{agentRoute.map(item => <li key={item.id}><button type="button" onClick={() => onSelect(item.id)}><b>{item.no}</b><span><strong>{item.title}</strong><small>{item.detail}</small></span></button></li>)}</ol>
  </nav>;
}

export function AgentArchitectureMap() {
  const [active, setActive] = useState(0);
  const item = architectureModules[active];
  return <div className="agent-architecture-map">
    <div className="agent-architecture-flow" aria-label="智能体系统结构">
      <div className="architecture-goal"><span>用户目标</span><strong>检查合同并形成初步报告</strong></div>
      <i>↓</i>
      <div className="architecture-core"><span>智能体运行机制</span><strong>组织判断、行动、反馈与停止</strong></div>
      <i>↓</i>
      <div className="architecture-module-grid">{architectureModules.map((module, index) => <button type="button" key={module.name} className={active === index ? "active" : ""} onClick={() => setActive(index)}><b>{String(index + 1).padStart(2, "0")}</b><strong>{module.name}</strong></button>)}</div>
      <i>↓</i>
      <div className="architecture-feedback"><span>结果与外部反馈</span><strong>重新进入状态，供下一轮判断使用</strong></div>
    </div>
    <section aria-live="polite"><span>组成部分 {active + 1}/{architectureModules.length}</span><h3>{item.name}</h3><p>{item.role}</p><dl><dt>接收</dt><dd>{item.input}</dd><dt>产出</dt><dd>{item.output}</dd><dt>边界</dt><dd>{item.risk}</dd></dl><button type="button" onClick={() => setActive((active + 1) % architectureModules.length)}>查看下一部分 →</button></section>
  </div>;
}

export function AgentLoopSimulator() {
  const [active, setActive] = useState(0);
  const [running, setRunning] = useState(false);
  const item = loopSteps[active];

  useEffect(() => {
    if (!running || active >= loopSteps.length - 1) return;
    const timer = window.setTimeout(() => {
      if (active >= loopSteps.length - 2) {
        setActive(loopSteps.length - 1);
        setRunning(false);
      } else {
        setActive(active + 1);
      }
    }, 1200);
    return () => window.clearTimeout(timer);
  }, [active, running]);

  return <div className="agent-loop-simulator">
    <div className="loop-simulator-head"><div><span>前端教学模拟 · 不连接真实企业系统</span><h3>转分包风险检查：九步运行轨迹</h3></div><div><button type="button" onClick={() => { setRunning(false); setActive(0); }}>重置</button><button type="button" className="primary" onClick={() => { if (active === loopSteps.length - 1) setActive(0); setRunning(value => !value); }}>{running ? "暂停" : active === loopSteps.length - 1 ? "重新运行" : "自动运行"}</button></div></div>
    <div className="loop-stepper">{loopSteps.map((step, index) => <button type="button" key={step.title} className={index === active ? "active" : index < active ? "done" : ""} onClick={() => { setRunning(false); setActive(index); }}><b>{String(index + 1).padStart(2, "0")}</b><span>{step.title}</span></button>)}</div>
    <div className="loop-live" aria-live="polite">
      <section><span>当前目标</span><strong>检查主合同甲是否存在转分包风险，并形成初步分析报告。</strong><div className="loop-status"><small>当前步骤</small><b>{active + 1} / {loopSteps.length}</b><small>当前状态</small><b>{item.status}</b></div></section>
      <section><span>选择的工具</span><strong>{item.tool}</strong><small>工具输入</small><p>{item.input}</p><small>工具输出</small><p>{item.output}</p></section>
      <section className="loop-decision"><span>智能体下一步判断</span><strong>{item.decision}</strong><div><b>应用程序执行</b><p>参数、身份、权限和风险级别由运行层校验。</p></div></section>
    </div>
    <p className="simulation-note">核心信息始终可读；动画只帮助观察状态如何更新。页面中的数量与执行结果均为教学模拟。</p>
  </div>;
}

export function AgentTypeSwitcher({ initial = "knowledge" }: { initial?: AgentTypeKey }) {
  const [active, setActive] = useState<AgentTypeKey>(initial);
  const item = agentTypes[active];
  return <div className="agent-type-switcher">
    <div className="agent-type-tabs" role="tablist" aria-label="三类智能体切换">{(Object.keys(agentTypes) as AgentTypeKey[]).map(key => <button type="button" role="tab" aria-selected={active === key} key={key} className={active === key ? "active" : ""} onClick={() => setActive(key)}><strong>{agentTypes[key].label}</strong><span>{agentTypes[key].question}</span></button>)}</div>
    <div className="agent-type-flow" aria-label={`${item.label}结构图`}>{item.structure.map((node, index) => <div key={node}><span>{String(index + 1).padStart(2, "0")}</span><strong>{node}</strong>{index < item.structure.length - 1 && <i>→</i>}</div>)}</div>
    <div className="agent-type-detail" aria-live="polite"><section><span>典型输入</span><strong>{item.input}</strong><span>执行步骤</span><ol>{item.steps.map(step => <li key={step}>{step}</li>)}</ol></section><section><span>典型输出</span><strong>{item.output}</strong><span>适用场景</span><p>{item.scenes}</p><span>自主程度</span><p>{item.autonomy}</p></section><section><span>人工介入方式</span><strong>{item.human}</strong><blockquote>海能智能体平台当前采用的业务分类；三类并非互斥，也不是唯一行业标准。</blockquote></section></div>
  </div>;
}

export function PlanningAdjustmentLab() {
  const [active, setActive] = useState(0);
  const item = planPhases[active];
  return <div className="planning-adjustment-lab">
    <div className="planning-phase-list">{planPhases.map((phase, index) => <button type="button" key={phase.name} className={active === index ? "active" : ""} onClick={() => setActive(index)}><b>{String(index + 1).padStart(2, "0")}</b><span>{phase.name}</span></button>)}</div>
    <section aria-live="polite"><span>专项调查阶段 {active + 1}/{planPhases.length}</span><h3>{item.name}</h3><p>{item.detail}</p><div><small>本阶段结果</small><strong>{item.result}</strong></div>{active === 3 && <blockquote><b>计划发生变化：</b>不再只看合同名称；新增工作范围、服务内容和交付成果的语义匹配，并把缺少正文的合同加入材料补充清单。</blockquote>}<button type="button" onClick={() => setActive((active + 1) % planPhases.length)}>{active === planPhases.length - 1 ? "重新查看" : "执行下一阶段 →"}</button></section>
  </div>;
}

export function CombinedContractCaseLab() {
  const [active, setActive] = useState(0);
  const item = combinedTimeline[active];
  return <div className="combined-contract-case">
    <div className="combined-case-summary"><div><span>主合同</span><strong>生产数据治理及质量提升项目</strong><p>历史数据清洗、标准化、质量检查和数据入湖；金额八百六十万元。</p></div><i>⇄</i><div><span>高潜候选</span><strong>历史数据标准化及入湖技术服务</strong><p>清洗、映射、标准化及入湖；金额二百一十万元；主合同签订后三个月。</p></div></div>
    <div className="combined-timeline">{combinedTimeline.map((step, index) => <button type="button" key={step.title} className={active === index ? "active" : index < active ? "done" : ""} onClick={() => setActive(index)}><b>{String(index + 1).padStart(2, "0")}</b><span>{step.title}</span><small>{step.kind}</small></button>)}</div>
    <section aria-live="polite"><div><span>{item.kind}能力</span><h3>{item.title}</h3><p>{item.detail}</p><strong>{item.state}</strong></div><div className="combined-proof"><span>最终判断卡片</span><strong>关联程度：高</strong><ol><li>工作内容与主合同核心范围高度重合。</li><li>候选合同签订时间晚于主合同。</li><li>交付成果均涉及标准化数据与入湖成果。</li><li>候选合同可能承接主合同中的部分工作。</li></ol><p><b>不确定项：</b>尚未取得项目任务分工说明。</p><p><b>建议：</b>核实实际执行主体与内部审批材料。</p></div></section>
    <div className="human-gates"><span>必须暂停并请人确认</span>{["正文无法获取", "证据互相冲突", "访问高敏感系统", "形成正式审计结论", "向业务系统写入", "对外发送报告"].map(gate => <b key={gate}>{gate}</b>)}</div>
  </div>;
}
