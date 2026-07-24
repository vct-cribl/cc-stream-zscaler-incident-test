// Combine the per-version matrix artifacts into one exec-facing REPORT.md:
// a plain-English verdict per Cribl version, then the full scenario x version
// detail. Prints markdown to stdout (the CI job redirects it to REPORT.md).
// Each input JSON is a run.ts ScenarioResult; we use 3 fields.
//
// Input layout (from download-artifact `pattern: results-*`):
//   <root>/results-<version>/results/<scenario>.json
//
// Usage: aggregate.ts <root>  |  aggregate.ts --selfcheck
import assert from "node:assert";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

const INCIDENT_VERSION = "4.14.1"; // where the incident was reported
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

const documented = (leg: Leg): boolean => leg.rows.every((r) => r.pass);

function report(legs: Leg[]): string {
  const versions = legs.map((l) => l.version);
  const differing = legs.filter((l) => !documented(l)).map((l) => l.version);
  const answer =
    differing.length === 0
      ? `✅ **Yes** — on all ${legs.length} versions tested, the Final flag behaved as documented and the reported data-loss issue did not reproduce.`
      : `⚠️ **Differences found** on: ${differing.join(", ")}. Every other version behaved as documented. See detail below.`;

  const scenarios = [...new Map(legs.flatMap((l) => l.rows).map((r) => [r.scenario, r])).values()]
    .sort((a, b) => a.scenario.localeCompare(b.scenario));
  const cell = (v: string, s: string): string => {
    const r = legs.find((l) => l.version === v)?.rows.find((x) => x.scenario === s);
    return !r ? "–" : r.pass ? "✅ pass" : "⚠️ diverge";
  };

  // Exec summary uses only headings/bold/lists — renders in Teams, Slack and
  // GitHub alike (tables and <details> do not render in Teams).
  const note = (v: string) => (v === INCIDENT_VERSION ? " (incident version)" : "");
  return [
    "# Cribl Final-flag incident — cross-version results",
    "",
    "**Question:** Does the Final flag in a Cribl route behave the way Cribl's documentation says?",
    "",
    `**Answer:** ${answer}`,
    "",
    "**Per version:**",
    "",
    ...legs.map(
      (l) =>
        `- ${documented(l) ? "✅" : "⚠️"} **${l.version}**${note(l.version)} — ${documented(l) ? "behaves as documented" : "differs, see detail below"}`,
    ),
    "",
    "## Full detail — every scenario on every version",
    "",
    `| Scenario | ${versions.join(" | ")} |`,
    `| --- | ${versions.map(() => "---").join(" | ")} |`,
    ...scenarios.map((s) => `| \`${s.scenario}\` — ${s.title} | ${versions.map((v) => cell(v, s.scenario)).join(" | ")} |`),
    "",
    "`✅ pass` = behaves as expected; `⚠️ diverge` = this version behaves differently.",
    "",
  ].join("\n");
}

const arg = process.argv[2];
if (arg === "--selfcheck") {
  const legs: Leg[] = [
    { version: "4.14.1", rows: [{ scenario: "s1", title: "Baseline", pass: true }, { scenario: "s2", title: "Incident", pass: true }] },
    { version: "4.19.0", rows: [{ scenario: "s1", title: "Baseline", pass: true }, { scenario: "s2", title: "Incident", pass: false }] },
  ];
  const t = report(legs);
  assert(t.includes("- ✅ **4.14.1** (incident version) — behaves as documented"), "incident version passes");
  assert(t.includes("- ⚠️ **4.19.0** — differs, see detail below"), "4.19.0 flagged");
  assert(t.includes("Differences found** on: 4.19.0"), "answer names the diverging version");
  assert(t.includes("| `s2` — Incident | ✅ pass | ⚠️ diverge |"), "detail cell");
  console.error("selfcheck ok");
} else if (arg) {
  process.stdout.write(report(read(arg)));
} else {
  console.error("usage: aggregate.ts <root> | --selfcheck");
  process.exit(2);
}
