// Combine the per-version matrix artifacts into one scenario x version table
// of pass / diverge. Prints markdown to stdout (the CI job redirects it to
// REPORT.md). Each input JSON is a run.ts ScenarioResult; we use 3 fields.
//
// Input layout (from download-artifact `pattern: results-*`):
//   <root>/results-<version>/results/<scenario>.json
//
// Usage: aggregate.ts <root>  |  aggregate.ts --selfcheck
import assert from "node:assert";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

type Row = { scenario: string; title: string; pass: boolean };
type Leg = { version: string; rows: Row[] };

const read = (root: string): Leg[] =>
  readdirSync(root)
    .filter((d) => d.startsWith("results-"))
    .sort()
    .map((d) => {
      const dir = join(root, d, "results");
      const rows = readdirSync(dir)
        .filter((f) => f.endsWith(".json"))
        .map((f) => JSON.parse(readFileSync(join(dir, f), "utf8")) as Row);
      return { version: d.slice("results-".length), rows };
    });

function table(legs: Leg[]): string {
  const versions = legs.map((l) => l.version);
  const scenarios = [...new Map(legs.flatMap((l) => l.rows).map((r) => [r.scenario, r])).values()]
    .sort((a, b) => a.scenario.localeCompare(b.scenario));
  const cell = (v: string, s: string): string => {
    const r = legs.find((l) => l.version === v)?.rows.find((x) => x.scenario === s);
    return !r ? "–" : r.pass ? "✅ pass" : "⚠️ diverge";
  };
  return [
    "# Incident matrix — cross-version results",
    "",
    "`✅ pass` = behaves as expected; `⚠️ diverge` = this version behaves differently. Detail: `results/<version>/`.",
    "",
    `| Scenario | ${versions.join(" | ")} |`,
    `| --- | ${versions.map(() => "---").join(" | ")} |`,
    ...scenarios.map((s) => `| \`${s.scenario}\` — ${s.title} | ${versions.map((v) => cell(v, s.scenario)).join(" | ")} |`),
    "",
  ].join("\n");
}

const arg = process.argv[2];
if (arg === "--selfcheck") {
  const t = table([
    { version: "4.14.1", rows: [{ scenario: "s1", title: "Baseline", pass: true }, { scenario: "s2", title: "Incident", pass: false }] },
    { version: "4.19.0", rows: [{ scenario: "s1", title: "Baseline", pass: true }, { scenario: "s2", title: "Incident", pass: true }] },
  ]);
  assert(t.includes("| Scenario | 4.14.1 | 4.19.0 |"), "header");
  assert(t.includes("| `s2` — Incident | ⚠️ diverge | ✅ pass |"), "diverge cell");
  console.error("selfcheck ok");
} else if (arg) {
  process.stdout.write(table(read(arg)));
} else {
  console.error("usage: aggregate.ts <root> | --selfcheck");
  process.exit(2);
}
