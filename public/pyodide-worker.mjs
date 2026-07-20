import { loadPyodide } from "https://cdn.jsdelivr.net/pyodide/v0.28.2/full/pyodide.mjs";

let runtime;

const ready = (async () => {
  try {
    runtime = await loadPyodide({
      indexURL: "https://cdn.jsdelivr.net/pyodide/v0.28.2/full/",
    });
    self.postMessage({ type: "ready" });
  } catch (error) {
    self.postMessage({
      type: "init-error",
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
})();

self.onmessage = async (event) => {
  if (event.data?.type !== "run") return;

  await ready;
  const stdout = [];
  const stderr = [];
  runtime.setStdout({ batched: (text) => stdout.push(text) });
  runtime.setStderr({ batched: (text) => stderr.push(text) });

  try {
    const result = await runtime.runPythonAsync(event.data.code);
    let value = "";
    if (result !== undefined && result !== null) {
      value = String(result);
      if (typeof result.destroy === "function") result.destroy();
    }
    self.postMessage({
      type: "result",
      stdout: stdout.join("\n"),
      stderr: stderr.join("\n"),
      value,
    });
  } catch (error) {
    self.postMessage({
      type: "run-error",
      stdout: stdout.join("\n"),
      stderr: stderr.join("\n"),
      error: error instanceof Error ? error.message : String(error),
    });
  }
};
