// Checks the question bank in js/questions.js. Run with `npm test` (Node 18+, no dependencies).
// Exits with code 1 and lists every problem found; on success prints the count per subject.
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import vm from "node:vm";

const SUBJECTS = [
  "Algebra",
  "Calculus",
  "Differential Equations",
  "Numerical Analysis",
  "Mathematical Analysis",
];

const file = fileURLToPath(new URL("../js/questions.js", import.meta.url));

// questions.js is a plain browser script (`const Q = [...]`), not a module, so run it in a
// sandbox and read Q back. A trailing expression statement is the script's return value.
let Q;
try {
  Q = vm.runInNewContext(readFileSync(file, "utf8") + "\n;Q", {}, { filename: file });
} catch (e) {
  console.error(`FAIL: could not load js/questions.js: ${e.message}`);
  process.exit(1);
}
if (!Array.isArray(Q) || Q.length === 0) {
  console.error("FAIL: js/questions.js must define `const Q = [...]` as a non-empty array.");
  process.exit(1);
}

const errors = [];
const seenText = new Map(); // normalised question text -> first question number
const isText = (v) => typeof v === "string" && v.trim() !== "";
const norm = (s) => s.trim().replace(/\s+/g, " ").toLowerCase();

Q.forEach((entry, i) => {
  const where = `Question #${i + 1}`;
  const fail = (msg) => errors.push(`${where}: ${msg}`);

  if (!Array.isArray(entry) || entry.length !== 5) {
    fail(
      `expected 5 fields [subject, question, options, correctIndex, explanation], got ` +
        (Array.isArray(entry) ? `${entry.length}` : typeof entry),
    );
    return;
  }
  const [subject, text, options, correct, explanation] = entry;
  const label = isText(text) ? `${where} ("${text.slice(0, 50)}${text.length > 50 ? "…" : ""}")` : where;
  const failQ = (msg) => errors.push(`${label}: ${msg}`);

  if (!SUBJECTS.includes(subject)) {
    failQ(`unknown subject ${JSON.stringify(subject)}; must be one of: ${SUBJECTS.join(", ")}`);
  }

  if (!isText(text)) {
    failQ("question text is empty");
  } else {
    const key = norm(text);
    if (seenText.has(key)) failQ(`duplicate question text (same as question #${seenText.get(key)})`);
    else seenText.set(key, i + 1);
  }

  if (!Array.isArray(options) || options.length !== 4) {
    failQ(`expected exactly 4 options, got ${Array.isArray(options) ? options.length : typeof options}`);
  } else {
    options.forEach((o, k) => {
      if (!isText(o)) failQ(`option ${"ABCD"[k]} is empty or not a string`);
    });
    const normed = options.filter(isText).map(norm);
    const dupes = normed.filter((o, k) => normed.indexOf(o) !== k);
    if (dupes.length) failQ(`duplicate options: ${[...new Set(dupes)].map((d) => JSON.stringify(d)).join(", ")}`);
  }

  if (!Number.isInteger(correct) || correct < 0 || correct > 3) {
    failQ(`correct index must be an integer 0–3, got ${JSON.stringify(correct)}`);
  }

  if (!isText(explanation)) failQ("explanation is empty");
});

if (errors.length) {
  console.error(`FAIL: ${errors.length} problem${errors.length > 1 ? "s" : ""} in js/questions.js\n`);
  for (const e of errors) console.error("  - " + e);
  process.exit(1);
}

console.log(`OK: ${Q.length} questions passed all checks.\n`);
for (const s of SUBJECTS) {
  const n = Q.filter((q) => q[0] === s).length;
  console.log(`  ${s.padEnd(24)}${String(n).padStart(3)}`);
}
