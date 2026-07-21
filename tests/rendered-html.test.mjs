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
  assert.match(html, /贯穿全课的不是一笔报销，而是一项审计任务/);
  assert.match(html, /BX-41610/);
  assert.match(html, /BX-41881/);
  assert.match(html, /BX-42306/);
  assert.match(html, /BX-42519/);
  assert.match(html, /BX-42017/);
  assert.match(html, /特征拟合（ML）：让多个弱信号共同说话/);
  assert.match(html, /64个像素/);
  assert.match(html, /趣味支线/);
  assert.match(html, /从 ANN 到 LLM：理解语言与业务语境/);
  assert.match(html, /目标—行动—反馈/);
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
