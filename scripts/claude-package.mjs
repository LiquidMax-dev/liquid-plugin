import { existsSync, lstatSync, readFileSync, readdirSync } from "node:fs";
import { join, relative, resolve, sep } from "node:path";
import { SKILL_SYNC_MAP } from "./sync-skills.mjs";

export const CLAUDE_ENDPOINT = "https://coinvest.liquid.trade/mcp";
const PACKAGE_NAME = "co-invest-claude";
const PLUGIN_NAME = "co-invest";
const PACKAGE_VERSION = "1.1.0";
const BASE_FILES = [".claude-plugin/plugin.json", ".mcp.json", "CHANGELOG.md", "LICENSE", "README.md", "assets/logo.svg"];
const SKILLS = SKILL_SYNC_MAP[PACKAGE_NAME].map((name) => `skills/${name}`);

function isRecord(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function stable(value) {
  if (Array.isArray(value)) return value.map(stable);
  if (isRecord(value)) return Object.fromEntries(Object.keys(value).sort().map((key) => [key, stable(value[key])]));
  return value;
}

function sameValue(left, right) {
  return JSON.stringify(stable(left)) === JSON.stringify(stable(right));
}

function walkPackage(root, onEntry, prefix = "") {
  for (const entry of readdirSync(root, { withFileTypes: true })) {
    const abs = join(root, entry.name);
    const rel = prefix ? `${prefix}/${entry.name}` : entry.name;
    const stat = lstatSync(abs);
    onEntry(rel, abs, stat);
    if (stat.isDirectory()) walkPackage(abs, onEntry, rel);
  }
}

function readJson(path, errors, report, label) {
  try {
    return JSON.parse(readFileSync(path, "utf8"));
  } catch (err) {
    report(path, `cannot parse ${label} (${err.message})`);
    return undefined;
  }
}

export function validateClaudePackage(repoRootInput) {
  const repoRoot = resolve(repoRootInput);
  const dir = join(repoRoot, "plugins", PACKAGE_NAME);
  const errors = [];
  const report = (path, message) => errors.push(`${relative(repoRoot, path).split(sep).join("/")}: ${message}`);
  if (!existsSync(dir)) return { errors: [`plugins/${PACKAGE_NAME}: package folder is missing`], packageCount: 0 };

  const PACKAGE_FILES = new Set(BASE_FILES);
  const PACKAGE_DIRS = new Set([".claude-plugin", "assets", "skills", ...SKILLS]);
  for (const skill of SKILLS) {
    const skillSource = join(repoRoot, skill);
    if (existsSync(skillSource)) {
      walkPackage(skillSource, (path, _abs, stat) => (stat.isDirectory() ? PACKAGE_DIRS : PACKAGE_FILES).add(`${skill}/${path}`));
    } else {
      errors.push(`${skill}: canonical skill is missing`);
    }
  }

  const actualFiles = new Set();
  walkPackage(dir, (path, abs, stat) => {
    if (stat.isSymbolicLink()) report(abs, "symlinks are not allowed in the Claude package");
    else if (stat.isFile()) actualFiles.add(path);
    else if (stat.isDirectory() && !PACKAGE_DIRS.has(path)) report(abs, "directory is outside the reviewed Claude package scope");
    else if (!stat.isDirectory()) report(abs, "package entries must be regular files or directories");
  });
  for (const path of actualFiles) {
    if (!PACKAGE_FILES.has(path)) report(join(dir, path), "file is outside the reviewed Claude package scope");
  }
  for (const expected of PACKAGE_FILES) {
    if (!actualFiles.has(expected)) report(join(dir, expected), "required Claude package file is missing");
  }

  let manifest;
  const manifestPath = join(dir, ".claude-plugin/plugin.json");
  if (actualFiles.has(".claude-plugin/plugin.json")) {
    manifest = readJson(manifestPath, errors, report, "Claude plugin manifest");
    if (manifest !== undefined) {
      if (!isRecord(manifest) || manifest.name !== PLUGIN_NAME) report(manifestPath, `name must be "${PLUGIN_NAME}"`);
      if (!isRecord(manifest) || manifest.version !== PACKAGE_VERSION) report(manifestPath, `version must be "${PACKAGE_VERSION}"`);
    }
  }

  const mcpPath = join(dir, ".mcp.json");
  if (actualFiles.has(".mcp.json")) {
    const mcp = readJson(mcpPath, errors, report, "MCP configuration");
    if (mcp !== undefined) {
      const expected = { "co-invest": { type: "http", url: CLAUDE_ENDPOINT } };
      if (!isRecord(mcp) || !sameValue(mcp.mcpServers, expected)) {
        report(mcpPath, `mcpServers must contain only the http endpoint ${CLAUDE_ENDPOINT}`);
      }
    }
  }

  const marketplacePath = join(repoRoot, ".claude-plugin/marketplace.json");
  if (!existsSync(marketplacePath)) {
    report(marketplacePath, "Claude marketplace file is missing");
  } else {
    const marketplace = readJson(marketplacePath, errors, report, "Claude marketplace");
    if (marketplace !== undefined) {
      const entry = isRecord(marketplace) && Array.isArray(marketplace.plugins) ? marketplace.plugins.find((p) => isRecord(p) && p.name === PLUGIN_NAME) : undefined;
      if (!entry) {
        report(marketplacePath, `no plugin named "${PLUGIN_NAME}"`);
      } else {
        if (typeof entry.source !== "string" || !existsSync(resolve(repoRoot, entry.source))) report(marketplacePath, "plugin source path does not exist");
        else if (resolve(repoRoot, entry.source) !== dir) report(marketplacePath, `plugin source must be ./plugins/${PACKAGE_NAME}`);
        if (entry.version !== PACKAGE_VERSION) report(marketplacePath, `version must be "${PACKAGE_VERSION}"`);
        if (isRecord(manifest) && entry.description !== manifest.description) report(marketplacePath, "description must equal the plugin manifest description");
      }
    }
  }

  const changelogPath = join(dir, "CHANGELOG.md");
  if (actualFiles.has("CHANGELOG.md") && !new RegExp(`^##\\s+${PACKAGE_VERSION.replaceAll(".", "\\.")}\\s*$`, "m").test(readFileSync(changelogPath, "utf8"))) {
    report(changelogPath, `missing "## ${PACKAGE_VERSION}" heading`);
  }

  return { errors, packageCount: 1 };
}
