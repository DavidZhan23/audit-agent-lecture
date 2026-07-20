import fs from "node:fs/promises";
import path from "node:path";

const output = path.resolve("public/toy_audit_case/classroom_training/ml_training_examples.csv");

let seed = 20260720;
function random() {
  seed = (seed * 1664525 + 1013904223) >>> 0;
  return seed / 4294967296;
}

function rounded(value, digits = 2) {
  return Number(value.toFixed(digits));
}

const rows = [];
for (let index = 1; index <= 300; index += 1) {
  const amountRatio = rounded(0.35 + random() * 0.72);
  const claims48h = 1 + Math.floor(random() * 6);
  const sameVendorShare = rounded(0.15 + random() * 0.85);
  const descriptionSimilarity = rounded(random());
  const validException = random() < 0.14 ? 1 : 0;
  const latentScore =
    2.1 * (amountRatio - 0.78) +
    0.55 * (claims48h - 2) +
    1.35 * (sameVendorShare - 0.55) +
    1.2 * (descriptionSimilarity - 0.55) -
    3.1 * validException +
    (random() - 0.5) * 1.1;
  const label = latentScore > 0.35 ? 1 : 0;
  rows.push([
    `HIST-${String(index).padStart(4, "0")}`,
    index <= 240 ? "train" : "validation",
    amountRatio,
    claims48h,
    sameVendorShare,
    descriptionSimilarity,
    validException,
    label,
  ]);
}

const header = [
  "sample_id",
  "split",
  "amount_ratio_to_threshold",
  "claims_48h",
  "same_vendor_share",
  "description_similarity",
  "valid_exception_approval",
  "confirmed_focus_review",
];

await fs.mkdir(path.dirname(output), { recursive: true });
await fs.writeFile(output, [header, ...rows].map((row) => row.join(",")).join("\n") + "\n", "utf8");
console.log(`generated ${rows.length} rows at ${output}`);
