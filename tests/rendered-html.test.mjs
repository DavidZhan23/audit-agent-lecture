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
  assert.match(html, /42,000笔报销/);
  assert.match(html, /机器学习：把“学习”还原成函数拟合/);
  assert.match(html, /大语言模型：用神经网络学习Token序列/);
  assert.match(html, /目标—行动—反馈循环/);
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
