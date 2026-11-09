import assert from "node:assert/strict";
import { existsSync, readdirSync } from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import { SKILL_SYNC_MAP, diffSkillCopies } from "../scripts/sync-skills.mjs";

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

test("the co-invest plugin bundles every root skill", () => {
  assert.deepEqual([...SKILL_SYNC_MAP["co-invest"]].sort(), rootSkillNames());
});

test("bundled skill copies match the root skills", async () => {
  assert.deepEqual(await diffSkillCopies(repoRoot), []);
});
