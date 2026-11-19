import assert from "node:assert/strict";
import { resolve } from "node:path";
import test from "node:test";
import { SKILL_REQUIRES } from "../scripts/sync-skills.mjs";
import { readSkill } from "./skills-content.test.mjs";

const repoRoot = resolve(import.meta.dirname, "..");

function triggers(description) {
  return description.split("Triggers on:")[1].split(".")[0].split(",").map((phrase) => phrase.trim().toLowerCase()).filter(Boolean);
}

const table = Object.keys(SKILL_REQUIRES).map((name) => ({ name, phrases: triggers(readSkill(repoRoot, name).meta.description) }));

// The skill whose longest trigger phrase occurs in the request wins; a tie is a collision.
export function route(request, skills = table) {
  const text = request.toLowerCase();
  let best = { length: 0, names: [] };
  for (const { name, phrases } of skills) {
    const length = Math.max(0, ...phrases.filter((phrase) => text.includes(phrase)).map((phrase) => phrase.length));
    if (length > best.length) best = { length, names: [name] };
    else if (length === best.length && length > 0) best.names.push(name);
  }
  return best.names;
}

const CASES = [
  ["Analyze BTC for me", "coinvest-research"],
  ["What is NVDA doing today?", "coinvest-research"],
  ["Compare ETH and SOL", "coinvest-research"],
  ["What does NVDA do and what is its P/E?", "coinvest-earnings"],
  ["Who reports this week?", "coinvest-earnings"],
  ["Show the earnings calendar", "coinvest-earnings"],
  ["What's moving right now?", "coinvest-market-scan"],
  ["Give me a market overview", "coinvest-market-scan"],
  ["Who tops the leaderboard?", "coinvest-market-scan"],
  ["Any signals worth a look? Give me ideas", "coinvest-market-scan"],
  ["Show my portfolio", "coinvest-portfolio-review"],
  ["What are my positions and open orders?", "coinvest-portfolio-review"],
  ["Plan a portfolio across crypto, stocks and gold", "coinvest-allocate"],
  ["Build me a portfolio", "coinvest-allocate"],
  ["Long ETH with $50 at 2x", "coinvest-trade"],
  ["Set a stop loss on my BTC", "coinvest-trade"],
  ["Cancel my order on SOL", "coinvest-trade"],
  ["Change leverage on ETH to 3x", "coinvest-trade"],
  ["Set a trailing stop on my SOL position", "coinvest-trailing-stops"],
  ["Remove trailing stop on ETH", "coinvest-trailing-stops"],
  ["Is there a prediction market on Bitcoin?", "coinvest-prediction-markets"],
  ["What are the odds for Arsenal this weekend?", "coinvest-prediction-markets"],
  ["Cancel my bet", "coinvest-prediction-markets"],
  ["Buy EQAAPL for $25", "coinvest-tokenized-stocks"],
  ["I want a tokenized stock, not a perp", "coinvest-tokenized-stocks"],
  ["Switch to paper trade mode", "coinvest-paper-trading"],
  ["Reset my paper account", "coinvest-paper-trading"],
  ["Trade for me with a $50 cap", "coinvest-automation"],
  ["Stop automated trading", "coinvest-automation"],
  ["What is my Earn balance?", "coinvest-yield"],
  ["Deposit into Earn 100 USDC", "coinvest-yield"],
  ["Deposit 100 USDC into the Earn vault", "coinvest-yield"],
  ["Analyze NVDA ahead of earnings", "coinvest-earnings"],
  ["How much HYPE am I staking?", "coinvest-yield"],
  ["I want to deposit USDC", "coinvest-funding"],
  ["Give me a deposit address for USDC on Arbitrum", "coinvest-funding"],
  ["Show my referral link", "coinvest-funding"],
];

test("each request phrase routes to exactly one skill", () => {
  for (const [request, expected] of CASES) assert.deepEqual(route(request), [expected], request);
});

test("no trigger phrase is shared by two skills", () => {
  const owners = new Map();
  for (const { name, phrases } of table) {
    for (const phrase of phrases) {
      assert.ok(!owners.has(phrase), `"${phrase}" is a trigger of ${owners.get(phrase)} and ${name}`);
      owners.set(phrase, name);
    }
  }
});

test("the router reports a collision", () => {
  const clash = [{ name: "a", phrases: ["deposit"] }, { name: "b", phrases: ["deposit"] }];
  assert.deepEqual(route("deposit now", clash), ["a", "b"]);
});
