import assert from "node:assert/strict";
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

test("READ+TRADE skills carry the confirmation rule and the no-resend rule", () => {
  assert.equal(tradeRows.length, 8);
  for (const row of tradeRows) {
    const { body } = load(row.slug);
    assert.match(body, /explicit confirmation before each call/, `${row.slug}: confirmation rule`);
    assert.match(body, /Never resend an order call after a timeout or a network error/, `${row.slug}: no-resend rule`);
    assert.match(body, /get_open_orders\(\)/, `${row.slug}: reads open orders`);
  }
});

test("READ skills do not call trade methods", () => {
  for (const row of rows.filter((r) => r.scope === "READ")) {
    assert.doesNotMatch(load(row.slug).body, /place_order\(|close_position\(|set_tp_sl\(|cancel_order\(|cancel_all_orders\(|update_leverage\(|update_margin\(/, row.slug);
  }
});

test("order skills state USD notional, and close-position states coin units", () => {
  for (const slug of orderSlugs) {
    assert.match(load(slug).body, /USD notional/, slug);
  }
  const close = load("liquid-close-position").body;
  assert.match(close, /coin units/);
  assert.match(close, /never a USD amount/);
});

test("monitor skills state the cost, the 10 s floor and the Free allowance", () => {
  for (const slug of ["liquid-price-alert", "liquid-position-guard"]) {
    const { body } = load(slug);
    assert.match(body, /under 10 s/, slug);
    assert.match(body, /Retry-After/, slug);
  }
  const alert = load("liquid-price-alert").body;
  assert.match(alert, /1,440 (requests )?(per day|a day)/);
  assert.match(alert, /about 16 hours/);
  assert.doesNotMatch(alert, /250 x interval/);
  assert.match(alert, /remaining requests x interval/);
  const guard = load("liquid-position-guard").body;
  assert.match(guard, /2,880/);
  assert.match(guard, /about 8 hours/);
  assert.match(guard, /if pos is None:[\s\S]*?client\.get_ticker\(pos\.symbol\)\.mark_price/);
  assert.match(guard, /get\("status"\) != "set"[\s\S]*?last_stop = new_stop/);
  assert.match(guard, /never widens or removes a stop/);
  assert.match(guard, /confirm with the user/);
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
