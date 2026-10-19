import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { readdirSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import test from "node:test";
import { parse } from "yaml";

const repoRoot = resolve(import.meta.dirname, "..");
const skillsDir = join(repoRoot, "skills");
const spec = readFileSync(join(repoRoot, "docs/specs/SPEC-api-skills-20261014.md"), "utf8");

function catalog() {
  const rows = [];
  for (const line of spec.split("\n")) {
    const cells = line.split("|").map((c) => c.trim());
    if (cells.length < 8 || !/^liquid-[a-z-]+$/.test(cells[1])) continue;
    rows.push({ slug: cells[1], scope: cells[4], description: cells[6] });
  }
  return rows;
}

function load(slug) {
  const text = readFileSync(join(skillsDir, slug, "SKILL.md"), "utf8");
  const match = text.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  assert.ok(match, `${slug}: front matter`);
  return { text, front: parse(match[1]), body: match[2] };
}

function section(body, heading) {
  const match = body.match(new RegExp(`^## ${heading}\\n\\n([\\s\\S]*?)(?=\\n## |(?![\\s\\S]))`, "m"));
  assert.ok(match, `missing section ${heading}`);
  return match[1].trim();
}

function pythonExample(slug, heading) {
  const { body } = load(slug);
  const text = section(body, heading);
  const match = text.match(/```python\n([\s\S]*?)\n```/);
  assert.ok(match, `${slug}: Python example in ${heading}`);
  return match[1];
}

const runGuardHarness = String.raw`
import ast, json, re, sys, types

source = sys.stdin.read()
case = json.loads(sys.argv[1])
source = re.sub(r"(?m)^last_stop = [^#]+(?=#)", f"last_stop = {case['last_stop']}", source, count=1)
source = re.sub(r"(?m)^trigger_gain = [^#]+(?=#)", f"trigger_gain = {case.get('trigger_gain', 0.0)}", source, count=1)
tree = ast.parse(source)

events = {"prompts": [], "mutations": [], "reads": 0, "tickers": 0, "sleep_stops": []}
answers = iter(case["answers"])
class Position:
    symbol = "BTC-PERP"
    side = case["side"]
    entry_price = case["entry"]
class Client:
    def get_positions(self):
        events["reads"] += 1
        return [Position()] if events["reads"] == 1 else []
    def get_ticker(self, symbol):
        events["tickers"] += 1
        return types.SimpleNamespace(mark_price=case["mark"])
    def set_tp_sl(self, symbol, *, sl):
        events["mutations"].append({"symbol": symbol, "sl": sl})
        if case.get("outcome") == "timeout":
            raise TimeoutError("synthetic unknown outcome")
        return types.SimpleNamespace(sl={"status": case.get("status", "set")})
class FakeTime:
    @staticmethod
    def sleep(_seconds):
        events["sleep_stops"].append(namespace.get("last_stop"))
fake_time = types.ModuleType("time")
fake_time.sleep = FakeTime.sleep
sys.modules["time"] = fake_time
namespace = {
    "client": Client(),
    "input": lambda prompt="": (events["prompts"].append(prompt), next(answers))[1],
}
error = None
try:
    exec(compile(tree, "position-guard-example.py", "exec"), namespace)
except Exception as exc:
    error = f"{type(exc).__name__}: {exc}"
print(json.dumps({**events, "error": error, "last_stop": namespace.get("last_stop")}))
`;

function runGuard(source, scenario) {
  const result = spawnSync("python3", ["-c", runGuardHarness, JSON.stringify(scenario)], {
    encoding: "utf8",
    input: source,
  });
  assert.equal(result.status, 0, `Python guard harness failed: ${result.stderr || result.stdout}`);
  return JSON.parse(result.stdout.trim());
}

const rows = catalog();
const tradeRows = rows.filter((r) => r.scope === "READ+TRADE");
const orderSlugs = ["liquid-market-order", "liquid-limit-order", "liquid-bracket-order", "liquid-close-position"];

test("the spec catalog lists 16 skills", () => {
  assert.equal(rows.length, 16);
});

test("skill directories match the catalog slugs", () => {
  const dirs = readdirSync(skillsDir).filter((d) => d.startsWith("liquid-")).sort();
  assert.deepEqual(dirs, rows.map((r) => r.slug).sort());
});

test("front matter matches the coinvest keys, slug and catalog description", () => {
  const coinvestKeys = Object.keys(load("coinvest").front).sort();
  for (const row of rows) {
    const { front } = load(row.slug);
    assert.deepEqual(Object.keys(front).sort(), coinvestKeys, row.slug);
    assert.equal(front.name, row.slug);
    assert.match(front.name, /^[a-z0-9]+(-[a-z0-9]+)*$/);
    assert.ok(front.description.length <= 155, `${row.slug}: description is ${front.description.length} characters`);
    assert.equal(front.description, row.description);
    assert.equal(front.license, load("coinvest").front.license);
  }
});

test("every skill carries the shared setup and request-cost text", () => {
  const setups = new Set();
  for (const row of rows) {
    const { body } = load(row.slug);
    for (const needle of ["api-public.liquidmax.xyz", "LIQUID_API_KEY", "LIQUID_API_SECRET", "max_retries=0", "pip install liquidtrading-python", "https://app.liquid.trade/?api_access=open", "RATE_LIMIT_EXCEEDED", "API_QUOTA_EXCEEDED", "Retry-After"]) {
      assert.ok(body.includes(needle), `${row.slug}: missing ${needle}`);
    }
    setups.add(section(body, "Setup").replace(/needs scope \S+\./, "needs scope X."));
  }
  assert.equal(setups.size, 1, "setup text differs between skills");
});

test("every skill has three capabilities and two examples", () => {
  for (const row of rows) {
    const { body } = load(row.slug);
    const caps = section(body, "Core capabilities").split("\n").filter((l) => l.startsWith("- "));
    const examples = section(body, "Just say to your agent").split("\n").filter((l) => /^- ".+"$/.test(l));
    assert.equal(caps.length, 3, row.slug);
    assert.equal(examples.length, 2, row.slug);
  }
});

test("the scope in the setup matches the catalog", () => {
  for (const row of rows) {
    assert.ok(section(load(row.slug).body, "Setup").includes(`needs scope ${row.scope}.`), row.slug);
  }
});

test("READ+TRADE skills carry the confirmation rule and fail closed on unknown mutations", () => {
  assert.equal(tradeRows.length, 8);
  for (const row of tradeRows) {
    const { body } = load(row.slug);
    assert.match(body, /explicit confirmation before each call/, `${row.slug}: confirmation rule`);
    assert.match(body, /Never resend a mutation after a timeout, network error, or any 5xx response/, `${row.slug}: no-resend rule`);
    assert.match(body, /read-only calls/ , `${row.slug}: reconciliation is read-only`);
    assert.match(body, /do not resend/, `${row.slug}: unresolved outcomes stay blocked`);
  }
});

test("READ skills do not call trade methods", () => {
  for (const row of rows.filter((r) => r.scope === "READ")) {
    assert.doesNotMatch(load(row.slug).body, /place_order\(|close_position\(|set_tp_sl\(|cancel_order\(|cancel_all_orders\(|update_leverage\(|update_margin\(/, row.slug);
  }
});

test("orders convert notional into USD margin, and closes use rounded coin units", () => {
  for (const slug of orderSlugs.filter((name) => name !== "liquid-close-position")) {
    assert.match(load(slug).body, /USD margin/, slug);
    assert.match(load(slug).body, /(?:resulting )?notional is `size \* leverage`/, slug);
    assert.match(load(slug).body, /divide(?: it)? by (?:the )?confirmed leverage/, slug);
    assert.match(load(slug).body, /Restate the order \(symbol, side, USD margin, USD notional, leverage, order type, TP\/SL\) and get the user's explicit confirmation/, slug);
  }
  const close = load("liquid-close-position").body;
  assert.match(close, /coin units/);
  assert.match(close, /never a USD amount/);
  assert.match(close, /get_ticker\(pos\.symbol\)\.mark_price/);
  assert.match(close, /ROUND_DOWN/);
  assert.match(close, /close_size <= 0/);
  assert.match(close, /estimated_usd/);
});

test("leverage and protection examples enforce their venue contracts", () => {
  const leverage = load("liquid-leverage").body;
  assert.match(leverage, /No open BTC-PERP position/);
  assert.match(leverage, /confirmed_is_cross/);
  assert.match(leverage, /cannot switch margin mode/i);
  assert.match(leverage, /For a new position, pass leverage to `place_order`/);

  const bracket = load("liquid-bracket-order").body;
  assert.match(bracket, /order\.tp is None or order\.sl is None/);
  assert.match(bracket, /position as live without that protection/);
  const tpSl = load("liquid-tp-sl").body;
  assert.match(tpSl, /result\.sl is None or result\.sl\.get\("status"\) != "set"/);
  assert.match(tpSl, /every requested leg/);
  assert.match(tpSl, /do not blindly resend/);
});

test("monitor skills state the cost, interval floors and the Free allowance", () => {
  const alertBody = load("liquid-price-alert").body;
  const guardBody = load("liquid-position-guard").body;
  assert.match(alertBody, /under 10 s/);
  assert.match(guardBody, /On Free, use at least 20 s/);
  for (const body of [alertBody, guardBody]) assert.match(body, /Retry-After/);
  const alert = alertBody;
  assert.match(alert, /1,440 (requests )?(per day|a day)/);
  assert.match(alert, /about 16 hours/);
  assert.doesNotMatch(alert, /250 x interval/);
  assert.match(alert, /remaining requests x interval/);
  const guard = guardBody;
  assert.match(guard, /2,880/);
  assert.match(guard, /about 8 hours/);
  assert.match(guard, /if pos is None:[\s\S]*?client\.get_ticker\(pos\.symbol\)\.mark_price/);
  assert.match(guard, /result\.sl\.get\("status"\) != "set"[\s\S]*?return new_stop/);
  assert.match(guard, /last_stop = update_guard_stop\(client, pos, mark, last_stop, trigger_gain, trail, confirm_stop_update\)/);
  assert.match(guard, /tightens the stop relative to the explicitly confirmed current stop while the user maintains exclusive control/i);
  assert.match(guard, /not an API lock or atomic protection/);
  assert.match(guard, /confirm with the user/);
  assert.match(guard, /gain < trigger_gain/);
  assert.match(guard, /proposed < mark/);
  assert.match(guard, /proposed > mark/);
  assert.match(guard, /never under 10 s/);
  assert.match(guard, /On Free, use at least 20 s/);
  assert.match(guard, /Setup and all other skills and keys share/);
});

test("Position Guard executes baseline and exclusivity checks before writing a stop", () => {
  const source = pythonExample("liquid-position-guard", "SDK call");
  const cases = [
    {
      side: "long", entry: 100000, mark: 111000, last_stop: 104000,
      answers: ["y", "n"], expected_baseline: "104000", expected_proposal: 109335,
    },
    {
      side: "short", entry: 110000, mark: 103000, last_stop: 110000,
      answers: ["y", "n"], expected_baseline: "110000", expected_proposal: 104545,
    },
  ];

  for (const scenario of cases) {
    const result = runGuard(source, scenario);
    assert.match(result.error, /Stop update was not confirmed/);
    assert.equal(result.mutations.length, 0, `${scenario.side}: stale baseline refusal must not write`);
    assert.match(result.prompts[0], new RegExp(scenario.expected_baseline));
    assert.match(result.prompts[0], /no other guard is active/i);
    assert.match(result.prompts[1], new RegExp(scenario.expected_baseline));
    const promptedProposal = result.prompts[1].match(/move it to ([0-9.]+)/);
    assert.ok(promptedProposal, `${scenario.side}: prompt must show the replacement stop`);
    assert.ok(Math.abs(Number(promptedProposal[1]) - scenario.expected_proposal) < 0.001);
    assert.match(result.prompts[1], /exclusive control/i);
    assert.match(result.prompts[1], /If the stop changed or control is shared, answer no/i);
  }

  const noProposal = runGuard(source, {
    side: "long", entry: 100000, mark: 100500, last_stop: 104000, answers: ["n"],
  });
  assert.match(noProposal.error, /startup was not confirmed/);
  assert.equal(noProposal.prompts.length, 1, "startup must be confirmed even when this cycle has no proposal");
  assert.match(noProposal.prompts[0], /104000/);
  assert.match(noProposal.prompts[0], /no other guard is active/i);
  assert.equal(noProposal.tickers, 0);
  assert.equal(noProposal.mutations.length, 0);

  const unknownBaseline = runGuard(source, {
    side: "long", entry: 100000, mark: 100500, last_stop: "None", answers: ["y"],
  });
  assert.match(unknownBaseline.error, /numeric current stop is required/);
  assert.equal(unknownBaseline.prompts.length, 0);
  assert.equal(unknownBaseline.mutations.length, 0);
});

test("Position Guard advances its baseline only after a confirmed set result", () => {
  const source = pythonExample("liquid-position-guard", "SDK call");
  for (const scenario of [
    { side: "long", entry: 100000, mark: 111000, last_stop: 104000, expected: 109335 },
    { side: "short", entry: 110000, mark: 103000, last_stop: 110000, expected: 104545 },
  ]) {
    const result = runGuard(source, { ...scenario, answers: ["y", "y"] });
    assert.equal(result.error, null);
    assert.equal(result.mutations.length, 1);
    assert.ok(Math.abs(result.mutations[0].sl - scenario.expected) < 0.001);
    assert.equal(result.sleep_stops.length, 1);
    assert.ok(Math.abs(result.sleep_stops[0] - scenario.expected) < 0.001);
    assert.ok(Math.abs(result.last_stop - scenario.expected) < 0.001);
  }

  const rejected = runGuard(source, {
    side: "long", entry: 100000, mark: 111000, last_stop: 104000,
    answers: ["y", "y"], status: "rejected",
  });
  assert.match(rejected.error, /Stop update was not confirmed/);
  assert.equal(rejected.mutations.length, 1);
  assert.equal(rejected.last_stop, 104000);
  assert.deepEqual(rejected.sleep_stops, []);

  const unknown = runGuard(source, {
    side: "long", entry: 100000, mark: 111000, last_stop: 104000,
    answers: ["y", "y"], outcome: "timeout",
  });
  assert.match(unknown.error, /synthetic unknown outcome/);
  assert.equal(unknown.mutations.length, 1, "unknown write outcomes stop without retrying");
  assert.deepEqual(unknown.sleep_stops, []);
});

test("positions skill reads the mark from the ticker and states the per-position cost", () => {
  const { body } = load("liquid-positions");
  assert.match(body, /client\.get_positions\(\)[\s\S]*?client\.get_ticker\(p\.symbol\)\.mark_price/);
  assert.match(body, /one `get_ticker` request per open position/);
  assert.match(body, /1 \+ N/);
});

test("no skill contains a key- or secret-looking literal", () => {
  for (const row of rows) {
    const { text } = load(row.slug);
    assert.doesNotMatch(text, /\b(lq|sk)_[A-Za-z0-9]{8,}/, row.slug);
    assert.doesNotMatch(text, /[A-Fa-f0-9]{40,}/, row.slug);
  }
});

test("no skill uses an em dash", () => {
  for (const row of rows) assert.ok(!load(row.slug).text.includes("—"), row.slug);
});
