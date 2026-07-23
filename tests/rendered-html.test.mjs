import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";

async function render() {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);
  return worker.fetch(
    new Request("http://localhost/", { headers: { accept: "text/html" } }),
    { ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) } },
    { waitUntil() {}, passThroughOnException() {} },
  );
}

test("server-renders the complete audit AI course", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);
  const html = await response.text();
  assert.match(html, /aria-label="课件翻页"/);
  assert.match(html, /aria-controls="course-sidebar"/);
  assert.match(html, /隐藏侧栏/);
  assert.match(html, /id="course-sidebar"/);
  assert.match(html, /sidebar-open/);
  assert.match(html, /01<!-- --> \/ <!-- -->17/);
  assert.match(html, /上一页/);
  assert.match(html, /下一页/);
  assert.match(html, /打开目录/);
  assert.match(html, /class="hero course-slide"/);
  assert.match(html, /id="problem" class="lesson course-slide" hidden/);
  assert.match(html, /大模型和智能体的技术基础/);
  assert.match(html, /id="part-1"/);
  assert.match(html, /id="part-2"/);
  assert.match(html, /id="part-3"/);
  assert.match(html, /Agent基础与架构/);
  assert.match(html, /Agent在审计中的应用/);
  assert.doesNotMatch(html, /内容占位|本章建设中/);
  assert.match(html, /基于任务逻辑的编程/);
  assert.match(html, /经典机器学习/);
  assert.match(html, /历史核实样本\.xlsx/);
  assert.match(html, /报销明细\.xlsx/);
  assert.match(html, /发票台账\.xlsx/);
  assert.match(html, /开票金额/);
  assert.match(html, /BX-41610/);
  assert.match(html, /BX-42306/);
  assert.match(html, /BX-42519/);
  assert.match(html, /BX-42017/);
  assert.match(html, /16×16/);
  assert.match(html, /趣味支线/);
  assert.match(html, /整堂课的顶层结构/);
  assert.match(html, /第一部分.*大模型和智能体的技术基础/s);
  assert.match(html, /第二部分.*Agent基础与架构/s);
  assert.match(html, /第三部分.*Agent在审计中的应用/s);
  assert.match(html, /问题逐渐变难，技术基础逐层出现/);
  assert.doesNotMatch(html, /整堂课只审这一笔/);
  assert.match(html, /从 ANN 到 LLM/);
  assert.match(html, /同一笔招待：多段文字证据/);
  assert.match(html, /它是什么.*文字怎样进去.*网络怎样读写.*怎样训练.*训练后剩什么.*怎样调用.*会什么、不会什么/s);
  assert.match(html, /LLM = 神经网络底座.*Token 序列.*Transformer.*下一 Token/s);
  assert.match(html, /下一个Token|下一 Token|P\(t_\{n\+1\}/);
  assert.match(html, /LLM：仍是 ANN|大规模 ANN|条件概率/);
  assert.match(html, /Attention|Transformer/);
  assert.match(html, /把简化图放回完整 Transformer 架构/);
  assert.match(html, /transformer-encoder-decoder-architecture\.png/);
  assert.match(html, /Attention Is All You Need/);
  assert.match(html, /CC BY-SA 4\.0/);
  assert.match(html, /随机初始化/);
  assert.match(html, /反向传播/);
  assert.match(html, /config\.json/);
  assert.match(html, /tokenizer\.json/);
  assert.match(html, /model\.safetensors/);
  assert.match(html, /应用组织输入/);
  assert.match(html, /发送一次请求/);
  assert.match(html, /推理服务/);
  assert.match(html, /模型密钥不能直接写在浏览器代码里|API密钥应放在受控后端/);
  assert.match(html, /语言流畅/);
  assert.match(html, /工具反馈循环/);
  assert.match(html, /LLM留下的缺口/);
  assert.match(html, /id="agent"/);
  assert.match(html, /id="agent-architecture"/);
  assert.match(html, /id="agent-control"/);
  assert.match(html, /id="agent-evaluation"/);
  assert.match(html, /Agent：从回答问题到完成任务/);
  assert.match(html, /Agent怎样运行/);
  assert.match(html, /Agent怎样受控运行/);
  assert.match(html, /Agent的价值、评价与建设/);
  assert.match(html, /路径固定用程序或工作流.*只需理解与生成用LLM应用/s);
  assert.match(html, /目标与策略.*LLM决策核.*工具.*状态.*编排循环.*控制与可观测/s);
  assert.match(html, /每个工具都要有明确的输入、输出和错误/);
  assert.match(html, /状态、长期记忆和运行轨迹/);
  assert.match(html, /单Agent与多Agent/);
  assert.match(html, /自主度是风险配置/);
  assert.match(html, /运行前.*运行中.*运行后/s);
  assert.match(html, /结果质量.*过程质量.*资源效率.*风险控制/s);
  assert.match(html, /任务定义.*最小原型.*离线评价.*影子运行.*受控试点.*持续运营/s);
  assert.match(html, /id="audit"/);
  assert.match(html, /id="audit-architecture"/);
  assert.match(html, /id="audit-evidence"/);
  assert.match(html, /id="audit-rollout"/);
  assert.match(html, /先定义审计功能/);
  assert.match(html, /智能问数：从问题到可信数字/);
  assert.match(html, /智能生成审计报告：从发现到草稿/);
  assert.match(html, /共性底座、治理与上线/);
  assert.match(html, /智能问数.*智能风险筛查.*智能取证调查.*智能底稿助手.*智能报告生成.*持续审计监控/s);
  assert.match(html, /数字与简明解释.*指标、范围与比较口径.*可审阅查询或语义计划.*数据快照、表与字段血缘.*缺失、权限与适用限制/s);
  assert.match(html, /问题受理.*口径契约.*目录与语义层.*权限检查.*安全查询.*结果校验.*证据化回答/s);
  assert.match(html, /指标查询.*多表追问.*口径不清.*权限拒绝/s);
  assert.match(html, /LLM不直接计算审计数字/);
  assert.match(html, /范围与方法.*冻结发现.*证据引用.*管理层回应.*报告规范/s);
  assert.match(html, /冻结发现.*完整性检查.*生成提纲.*分节起草.*引用绑定.*一致性校验.*人工审阅.*渲染归档/s);
  assert.match(html, /证据完整.*原因缺失.*数字冲突/s);
  assert.match(html, /审计应用层.*工作产品与证据层.*Agent与工作流编排层.*规则与模型能力层.*受控工具与安全层.*数据、制度与模板来源层/s);
  assert.match(html, /数据快照.*问数结果.*证据对象.*审计发现.*报告段落/s);
  assert.match(html, /MVP A · 智能问数.*差旅费认证指标问答.*MVP B · 智能报告.*已确认发现的章节草稿/s);
  assert.match(html, /数据完整性检查.*疑点优先级排序.*跨系统取证.*证据评价.*访谈与沟通.*定性与报告/s);
  assert.match(html, /证据与底稿.*机器草稿.*正式报告/s);
  assert.match(html, /提示注入/);
  assert.match(html, /离线基准.*影子运行.*小范围试点.*受控扩围/s);
  assert.match(html, /审计负责人.*产品 \/ 流程负责人.*数据负责人.*技术与模型团队.*安全与合规/s);
  assert.doesNotMatch(html, /运行一次受控智能问数|运行报告生成前质量门|运行完整审计流水线/);
  assert.doesNotMatch(html, /Your site is taking shape|codex-preview/);
});

test("supports direct and keyboard lecture pagination", async () => {
  const root = new URL("../", import.meta.url);
  const source = await readFile(new URL("app/page.tsx", root), "utf8");
  const styles = await readFile(new URL("app/globals.css", root), "utf8");
  assert.match(source, /const coursePages:[\s\S]*id: "audit-rollout"/);
  assert.match(source, /"ArrowRight", "PageDown"/);
  assert.match(source, /"ArrowLeft", "PageUp"/);
  assert.match(source, /event\.key === "Home"/);
  assert.match(source, /event\.key === "End"/);
  assert.match(source, /event\.key === "Escape"/);
  assert.match(source, /setSidebarOpen\(value => !value\)/);
  assert.match(source, /matchMedia\("\(max-width: 760px\)"\)/);
  assert.match(source, /<CoursePager activeIndex=\{activePage\} onChange=\{goToPage\}/);
  assert.match(source, /querySelector<HTMLElement>\("\.paginated-course \.page"\)\?\.scrollTo/);
  assert.match(styles, /\.paginated-course \.page \{[\s\S]*height: calc\(100vh - 128px\);[\s\S]*overflow-y: auto;/);
  assert.match(styles, /\.course-pager \{[\s\S]*bottom: 12px;[\s\S]*height: 54px;/);
});

test("ships the independent training data and downloadable workbook", async () => {
  const root = new URL("../", import.meta.url);
  const csvUrl = new URL("public/toy_audit_case/classroom_training/ml_training_examples.csv", root);
  await Promise.all([
    access(csvUrl),
    access(new URL("public/toy_audit_case/toy_audit_case.xlsx", root)),
    access(new URL("public/toy_audit_case_download.zip", root)),
  ]);
  const rows = (await readFile(csvUrl, "utf8")).trim().split(/\r?\n/);
  assert.equal(rows.length, 301);
  assert.equal(rows.filter((row) => row.includes(",train,")).length, 240);
  assert.equal(rows.filter((row) => row.includes(",validation,")).length, 60);
});

test("ships the classic handwritten digits teaching subset", async () => {
  const csvUrl = new URL("../public/simple_audit_demo/digits_8x8_subset.csv", import.meta.url);
  const rows = (await readFile(csvUrl, "utf8")).trim().split(/\r?\n/);
  assert.equal(rows.length, 1301);
  assert.equal(rows.filter((row) => row.includes(",train,")).length, 1000);
  assert.equal(rows.filter((row) => row.includes(",test,")).length, 300);
  assert.match(rows[0], /pixel_00.*pixel_63/);
});

test("ships the locally cached Transformer reference figure", async () => {
  const imageUrl = new URL("../public/images/transformer-encoder-decoder-architecture.png", import.meta.url);
  const image = await readFile(imageUrl);
  assert.ok(image.byteLength > 100_000);
  assert.deepEqual([...image.subarray(0, 8)], [137, 80, 78, 71, 13, 10, 26, 10]);
});
