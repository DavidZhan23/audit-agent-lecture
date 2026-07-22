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
  assert.match(html, /从 ANN 到 LLM/);
  assert.match(html, /同一笔招待：多段文字证据/);
  assert.match(html, /下一个Token/);
  assert.match(html, /LLM：仍是 ANN/);
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
