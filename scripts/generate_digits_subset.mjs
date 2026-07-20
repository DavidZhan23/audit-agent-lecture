import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const projectRoot = process.cwd();
const sourceRoot = "/private/tmp/optdigits";

function parseRows(text, split) {
  return text.trim().split(/\r?\n/).map((line, sourceIndex) => {
    const values = line.split(",").map(Number);
    return { split, sourceIndex, pixels: values.slice(0, 64), label: values[64] };
  });
}

const train = parseRows(await readFile(path.join(sourceRoot, "optdigits.tra"), "utf8"), "train");
const test = parseRows(await readFile(path.join(sourceRoot, "optdigits.tes"), "utf8"), "test");

function shuffledPerDigit(rows, count, seed) {
  let state = seed >>> 0;
  const random = () => ((state = (1664525 * state + 1013904223) >>> 0) / 2 ** 32);
  const selected = [];
  for (let digit = 0; digit < 10; digit += 1) {
    const group = rows.filter((row) => row.label === digit);
    for (let index = group.length - 1; index > 0; index -= 1) {
      const swap = Math.floor(random() * (index + 1));
      [group[index], group[swap]] = [group[swap], group[index]];
    }
    selected.push(...group.slice(0, count));
  }
  return selected;
}

const subset = [...shuffledPerDigit(train, 100, 20260720), ...shuffledPerDigit(test, 30, 20260721)];
const header = ["sample_id", "split", "label", ...Array.from({ length: 64 }, (_, i) => `pixel_${String(i).padStart(2, "0")}`)];
const csv = [header.join(","), ...subset.map((row, index) => [
  `DIGIT-${String(index + 1).padStart(4, "0")}`,
  row.split,
  row.label,
  ...row.pixels,
].join(","))].join("\n") + "\n";

const samples = [2, 8, 6].map((digit) => {
  const row = subset.find((item) => item.split === "test" && item.label === digit);
  return { digit, pixels: row.pixels };
});

await mkdir(path.join(projectRoot, "public", "simple_audit_demo"), { recursive: true });
await writeFile(path.join(projectRoot, "public", "simple_audit_demo", "digits_8x8_subset.csv"), csv);
await writeFile(
  path.join(projectRoot, "app", "digit-samples.ts"),
  `// Generated from the UCI Optical Recognition of Handwritten Digits dataset.\nexport const digitSamples = ${JSON.stringify(samples)} as const;\n`,
);

console.log(`Wrote ${subset.length} rows: 1000 train + 300 test.`);
