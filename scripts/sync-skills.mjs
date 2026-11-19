import { readFileSync } from "node:fs";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const moduleDir = path.dirname(fileURLToPath(import.meta.url));

// A skill is bundled with every package whose platform serves this tool.
export const SKILL_REQUIRES = Object.freeze({
  "coinvest-research": "analyze_market",
  "coinvest-portfolio-review": "get_portfolio",
  "coinvest-allocate": "plan_portfolio",
  "coinvest-trade": "suggest_trade",
  "coinvest-paper-trading": "paper_trading_status",
  "coinvest-automation": "automated_trading_status",
  "coinvest-market-scan": "show_market_overview",
  "coinvest-prediction-markets": "search_prediction_markets",
  "coinvest-trailing-stops": "set_trailing_stop",
  "coinvest-earnings": "upcoming_earnings",
  "coinvest-yield": "get_earn_balance",
  "coinvest-funding": "show_deposit",
  "coinvest-tokenized-stocks": "execute_spot_order",
});

// Package folder to its platform key in docs/listing-prompts.json.
export const PACKAGE_PLATFORM = Object.freeze({
  "co-invest": "cursor",
  "co-invest-perplexity": "perplexity",
  "co-invest-claude": "claude",
  "co-invest-grok": "grok",
  "co-invest-openai": "chatgpt",
  "co-invest-muse": "muse",
});

// The base skill defaults to the Computer endpoint, so it is listed by hand.
export const BASE_SKILL_PACKAGES = Object.freeze(["co-invest", "co-invest-perplexity"]);

export function computeSkillSyncMap(platforms, packagePlatform = PACKAGE_PLATFORM, basePackages = BASE_SKILL_PACKAGES) {
  const map = {};
  for (const [pkg, platform] of Object.entries(packagePlatform)) {
    const tools = new Set(platforms[platform].tools);
    const skills = Object.entries(SKILL_REQUIRES).filter(([, tool]) => tools.has(tool)).map(([name]) => name);
    if (basePackages.includes(pkg)) skills.unshift("coinvest");
    map[pkg] = Object.freeze(skills.sort());
  }
  return Object.freeze(map);
}

export const SKILL_SYNC_MAP = computeSkillSyncMap(
  JSON.parse(readFileSync(path.join(moduleDir, "..", "docs", "listing-prompts.json"), "utf8")).platforms,
);

function toPosix(relPath) {
  return relPath.split(path.sep).join("/");
}

function comparePaths(a, b) {
  return a < b ? -1 : a > b ? 1 : 0;
}

const SAFE_NAME_RE = /^[a-z0-9]([a-z0-9.-]*[a-z0-9])?$/;

function assertSafeName(name, kind) {
  if (typeof name !== "string" || !SAFE_NAME_RE.test(name) || name.includes("..")) {
    throw new Error(`unsafe ${kind} name: ${JSON.stringify(name)}`);
  }
}

function assertContained(childDir, parentDir, label) {
  const rel = path.relative(parentDir, childDir);
  if (rel === "" || rel.startsWith("..") || path.isAbsolute(rel)) {
    throw new Error(`unsafe ${label}: ${childDir} is not inside ${parentDir}`);
  }
}

function resolveSafePair(repoRoot, plugin, skillName) {
  assertSafeName(plugin, "plugin");
  assertSafeName(skillName, "skill");

  const skillsRoot = path.join(repoRoot, "skills");
  const pluginSkillsRoot = path.join(repoRoot, "plugins", plugin, "skills");
  const sourceDir = path.join(skillsRoot, skillName);
  const targetDir = path.join(pluginSkillsRoot, skillName);

  assertContained(sourceDir, skillsRoot, `source dir for plugin "${plugin}" skill "${skillName}"`);
  assertContained(targetDir, pluginSkillsRoot, `target dir for plugin "${plugin}" skill "${skillName}"`);

  return { plugin, skillName, sourceDir, targetDir };
}

function resolvePairs(repoRoot, map) {
  const pairs = [];
  for (const [plugin, skillNames] of Object.entries(map)) {
    for (const skillName of skillNames) {
      pairs.push(resolveSafePair(repoRoot, plugin, skillName));
    }
  }
  return pairs;
}

async function walkTree(rootDir) {
  const files = [];
  const symlinks = [];
  let rootStat;
  try {
    rootStat = await fs.lstat(rootDir);
  } catch (err) {
    if (err.code === "ENOENT") return { files, symlinks, missing: true };
    throw err;
  }
  if (rootStat.isSymbolicLink()) {
    symlinks.push("");
    return { files, symlinks, missing: false };
  }

  async function recurse(currentDir, relPrefix) {
    const names = (await fs.readdir(currentDir)).sort(comparePaths);
    for (const name of names) {
      const abs = path.join(currentDir, name);
      const rel = relPrefix ? `${relPrefix}/${name}` : name;
      const st = await fs.lstat(abs);
      if (st.isSymbolicLink()) {
        symlinks.push(rel);
      } else if (st.isDirectory()) {
        await recurse(abs, rel);
      } else if (st.isFile()) {
        files.push(rel);
      }
    }
  }
  await recurse(rootDir, "");
  return { files, symlinks, missing: false };
}

export async function diffSkillCopies(repoRoot, map = SKILL_SYNC_MAP) {
  const pairs = resolvePairs(repoRoot, map);
  const entries = [];
  for (const { sourceDir, targetDir } of pairs) {
    const sourceWalk = await walkTree(sourceDir);
    const targetWalk = await walkTree(targetDir);

    if (targetWalk.missing) {
      entries.push({ path: toPosix(path.relative(repoRoot, targetDir)), reason: "missing copy" });
      continue;
    }

    for (const rel of sourceWalk.symlinks) {
      const abs = rel === "" ? sourceDir : path.join(sourceDir, rel);
      entries.push({ path: toPosix(path.relative(repoRoot, abs)), reason: "symlink" });
    }
    for (const rel of targetWalk.symlinks) {
      const abs = rel === "" ? targetDir : path.join(targetDir, rel);
      entries.push({ path: toPosix(path.relative(repoRoot, abs)), reason: "symlink" });
    }

    if (sourceWalk.symlinks.includes("") || targetWalk.symlinks.includes("")) {
      continue;
    }

    const sourceFiles = new Set(sourceWalk.files);
    const targetFiles = new Set(targetWalk.files);
    const sourceSymlinkPaths = new Set(sourceWalk.symlinks);
    const targetSymlinkPaths = new Set(targetWalk.symlinks);

    for (const rel of sourceWalk.files) {
      if (!targetFiles.has(rel) && !targetSymlinkPaths.has(rel)) {
        entries.push({ path: toPosix(path.relative(repoRoot, path.join(targetDir, rel))), reason: "missing file" });
      }
    }
    for (const rel of targetWalk.files) {
      if (!sourceFiles.has(rel) && !sourceSymlinkPaths.has(rel)) {
        entries.push({ path: toPosix(path.relative(repoRoot, path.join(targetDir, rel))), reason: "extra file" });
      }
    }
    for (const rel of sourceWalk.files) {
      if (!targetFiles.has(rel)) continue;
      const [a, b] = await Promise.all([
        fs.readFile(path.join(sourceDir, rel)),
        fs.readFile(path.join(targetDir, rel)),
      ]);
      if (!a.equals(b)) {
        entries.push({ path: toPosix(path.relative(repoRoot, path.join(targetDir, rel))), reason: "differs" });
      }
    }
  }
  entries.sort((a, b) => comparePaths(a.path, b.path));
  return entries;
}

export async function syncSkillCopies(repoRoot, map = SKILL_SYNC_MAP) {
  const pairs = resolvePairs(repoRoot, map);
  const written = [];
  for (const { sourceDir, targetDir } of pairs) {
    const sourceWalk = await walkTree(sourceDir);
    if (sourceWalk.missing) {
      throw new Error(`missing source skill: ${toPosix(path.relative(repoRoot, sourceDir))}`);
    }
    if (sourceWalk.symlinks.length > 0) {
      const rel = sourceWalk.symlinks[0];
      const abs = rel === "" ? sourceDir : path.join(sourceDir, rel);
      throw new Error(`refusing to copy symlink: ${toPosix(path.relative(repoRoot, abs))}`);
    }
    await fs.rm(targetDir, { recursive: true, force: true });
    await fs.mkdir(targetDir, { recursive: true });
    for (const rel of sourceWalk.files.sort(comparePaths)) {
      const from = path.join(sourceDir, rel);
      const to = path.join(targetDir, rel);
      await fs.mkdir(path.dirname(to), { recursive: true });
      await fs.copyFile(from, to);
      written.push(toPosix(path.relative(repoRoot, to)));
    }
  }
  return written.sort(comparePaths);
}

const isCliInvocation =
  process.argv[1] !== undefined && import.meta.url === pathToFileURL(process.argv[1]).href;

if (isCliInvocation) {
  const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
  const checkOnly = process.argv.includes("--check");

  if (checkOnly) {
    const diffs = await diffSkillCopies(repoRoot);
    if (diffs.length === 0) {
      console.log("OK: skill copies match");
    } else {
      for (const { path: diffPath, reason } of diffs) {
        console.log(`DRIFT: ${diffPath}: ${reason}`);
      }
      process.exit(1);
    }
  } else {
    const written = await syncSkillCopies(repoRoot);
    for (const writtenPath of written) {
      console.log(`SYNCED: ${writtenPath}`);
    }
    console.log(`OK: ${written.length} file(s) written`);
  }
}
