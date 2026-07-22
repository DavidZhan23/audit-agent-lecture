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
  assert.match(html, /大模型和智能体的技术基础/);
  assert.match(html, /id="part-1"/);
  assert.match(html, /id="part-2"/);
  assert.match(html, /id="part-3"/);
  assert.match(html, /Agent基础与架构/);
  assert.match(html, /Agent \+ LLM/);
  assert.match(html, /审计智能体（内容占位）/);
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
  assert.match(html, /工具与反馈循环/);
  assert.doesNotMatch(html, /Your site is taking shape|codex-preview/);
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
