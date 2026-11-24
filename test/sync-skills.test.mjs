import assert from "node:assert/strict";
import { existsSync, readdirSync } from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import { SKILL_SYNC_MAP, computeSkillSyncMap, diffSkillCopies } from "../scripts/sync-skills.mjs";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function rootSkillNames() {
  return readdirSync(path.join(repoRoot, "skills"), { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && existsSync(path.join(repoRoot, "skills", entry.name, "SKILL.md")))
    .map((entry) => entry.name)
    .sort();
}

test("every SKILL_SYNC_MAP entry names a root skill", () => {
  const rootSkills = new Set(rootSkillNames());
  for (const [plugin, skills] of Object.entries(SKILL_SYNC_MAP)) {
    assert.ok(existsSync(path.join(repoRoot, "plugins", plugin)), `missing plugin ${plugin}`);
    for (const skill of skills) {
      assert.ok(rootSkills.has(skill), `${plugin} maps ${skill}, which has no skills/${skill}/SKILL.md`);
    }
  }
});

test("every root skill is bundled by at least one package", () => {
  const bundled = new Set(Object.values(SKILL_SYNC_MAP).flat());
  assert.deepEqual([...bundled].sort(), rootSkillNames());
});

test("a package gets exactly the skills whose required tool its platform serves", () => {
  const platforms = { a: { tools: ["analyze_market", "execute_spot_order"] }, b: { tools: ["analyze_market"] } };
  const map = computeSkillSyncMap(platforms, { "pkg-a": "a", "pkg-b": "b" }, ["pkg-b"]);
  assert.deepEqual(map, { "pkg-a": ["coinvest-research", "coinvest-tokenized-stocks"], "pkg-b": ["coinvest", "coinvest-research"] });
});

test("a store's refused skill is left out of that package only", () => {
  const platforms = { a: { tools: ["search_prediction_markets"] }, b: { tools: ["search_prediction_markets"] } };
  const map = computeSkillSyncMap(platforms, { "pkg-a": "a", "pkg-b": "b" }, [], { "pkg-a": ["coinvest-prediction-markets"] });
  assert.deepEqual(map, { "pkg-a": [], "pkg-b": ["coinvest-prediction-markets"] });
  assert.ok(!SKILL_SYNC_MAP["co-invest-openai"].includes("coinvest-prediction-markets"));
  assert.ok(SKILL_SYNC_MAP["co-invest-muse"].includes("coinvest-prediction-markets") || SKILL_SYNC_MAP["co-invest-grok"].includes("coinvest-prediction-markets"));
});

test("the tokenized-stocks skill ships only where execute_spot_order is served", () => {
  const withSkill = Object.entries(SKILL_SYNC_MAP).filter(([, names]) => names.includes("coinvest-tokenized-stocks")).map(([pkg]) => pkg).sort();
  assert.deepEqual(withSkill, ["co-invest-claude", "co-invest-grok"]);
});

test("bundled skill copies match the root skills", async () => {
  assert.deepEqual(await diffSkillCopies(repoRoot), []);
});
