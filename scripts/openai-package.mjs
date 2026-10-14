import { createHash } from "node:crypto";
import { existsSync, lstatSync, readFileSync, readdirSync } from "node:fs";
import { dirname, join, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { parse as parseYaml } from "yaml";

const BASELINE_SHA256 = "c7a7590179b778f2335f4c9fb35f8dd00f05c4f11bafa7d666fe6e39fbde9077";
const LOGO_HASHES = new Map([
  ["assets/logo.png", "2f1b172ae3b87c066ccab9a517e9c303cd88df6b6ca1835e865f6fd38a704506"],
  ["assets/logo-dark.png", "29bb7e1a2ba39baf4811246ecfecdfeb1d6d4f9277588587b3bd1b8cb151488a"],
]);
const REQUIRED_FILES = new Set([
  ".codex-plugin/plugin.json",
  ".mcp.json",
  "assets/logo.png",
  "assets/logo-dark.png",
  "skills/coinvest-market-research/SKILL.md",
  "skills/coinvest-portfolio-planning/SKILL.md",
  "skills/coinvest-earn-vaults/SKILL.md",
]);
const ALLOWED_FILES = new Set([
  ...REQUIRED_FILES,
  "CHANGELOG.md",
  "LICENSE",
  "README.md",
]);
const SKILL_NAMES = ["coinvest-market-research", "coinvest-portfolio-planning", "coinvest-earn-vaults"];
const EXPECTED_DIRS = new Set([
  ".codex-plugin",
  "assets",
  "skills",
  ...SKILL_NAMES.map((name) => `skills/${name}`),
]);
const CREDENTIAL_RE = /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----|\b(?:ghp|github_pat|sk_live|sk_test)_[A-Za-z0-9_-]{12,}|\bBearer\s+[A-Za-z0-9._~+/-]{16,}|\b(?:api[_-]?key|client[_-]?secret|access[_-]?token|refresh[_-]?token)["']?\s*[:=]\s*["']?[A-Za-z0-9._~+/-]{12,}/i;

function isRecord(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function sameValue(left, right) {
  if (left === right) return true;
  if (Array.isArray(left) || Array.isArray(right)) {
    return Array.isArray(left) && Array.isArray(right) && left.length === right.length && left.every((value, index) => sameValue(value, right[index]));
  }
  if (!isRecord(left) || !isRecord(right)) return false;
  const leftKeys = Object.keys(left).sort();
  const rightKeys = Object.keys(right).sort();
  return leftKeys.length === rightKeys.length && leftKeys.every((key, index) => key === rightKeys[index] && sameValue(left[key], right[key]));
}

function sha256(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

function sourceRel(root, path) {
  return relative(root, path).split(sep).join("/");
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

function checkPathAncestry(repoRoot, packageDir, report) {
  let valid = true;
  const rootStat = lstatSync(repoRoot);
  if (rootStat.isSymbolicLink() || !rootStat.isDirectory()) {
    report(repoRoot, "repository root must be a real directory, not a symlink");
    return false;
  }
  let current = repoRoot;
  for (const part of relative(repoRoot, packageDir).split(sep).filter(Boolean)) {
    current = join(current, part);
    let stat;
    try {
      stat = lstatSync(current);
    } catch (error) {
      if (error.code === "ENOENT") continue;
      report(current, "package path cannot be inspected");
      return false;
    }
    if (stat.isSymbolicLink()) {
      report(current, "symlink is not allowed in package path ancestry");
      valid = false;
    } else if (!stat.isDirectory()) {
      report(current, "package path ancestry must contain directories");
      valid = false;
    }
  }
  return valid;
}

function parseJson(path, report) {
  try {
    return JSON.parse(readFileSync(path, "utf8"));
  } catch {
    report(path, "cannot read valid JSON");
    return null;
  }
}

function manifestWithoutAllowedChanges(manifest) {
  if (!isRecord(manifest)) return manifest;
  const copy = structuredClone(manifest);
  delete copy.version;
  delete copy.mcpServers;
  delete copy.skills;
  return copy;
}

function validateSkill(path, folderName, pluginName, report) {
  let source;
  try {
    source = readFileSync(path, "utf8");
  } catch {
    report(path, "skill file cannot be read");
    return;
  }
  const frontmatter = source.match(/^---\s*\r?\n([\s\S]*?)\r?\n---\s*(?:\r?\n|$)([\s\S]*)$/);
  if (!frontmatter) {
    report(path, "skill must start with valid YAML frontmatter and a body");
    return;
  }
  let metadata;
  try {
    metadata = parseYaml(frontmatter[1]);
  } catch {
    report(path, "skill frontmatter must be valid YAML");
    return;
  }
  if (!isRecord(metadata)) {
    report(path, "skill frontmatter must be a YAML object");
    return;
  }
  if (metadata.name !== folderName) report(path, "skill frontmatter name must match its directory");
  if (typeof metadata.description !== "string" || !metadata.description.trim()) {
    report(path, "skill frontmatter description must be non-empty");
  } else if (/^(?:TODO|TBD|FIXME)(?:\s*[:\-].*)?$|^\[(?:TODO|TBD|FIXME)\]$/i.test(metadata.description.trim())) {
    report(path, "skill frontmatter description must not be a scaffold placeholder");
  }
  if (typeof pluginName === "string" && pluginName.length + 1 + folderName.length > 64) report(path, "combined plugin and skill name must be at most 64 characters");
  if (!frontmatter[2].trim()) report(path, "skill body must be non-empty");
  if (/^\s*(?:TODO|TBD|FIXME)(?:\s*[:\-]|\s*$)|^\s*\[(?:TODO|TBD|FIXME)\]\s*$/im.test(source)) {
    report(path, "skill body must not contain scaffold placeholders");
  }
}

function validatePng(path, rel, report) {
  let bytes;
  try {
    bytes = readFileSync(path);
  } catch {
    report(path, "logo asset cannot be read");
    return;
  }
  if (sha256(bytes) !== LOGO_HASHES.get(rel)) report(path, "logo bytes do not match the published asset");
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  if (bytes.length < 24 || !bytes.subarray(0, 8).equals(signature) || bytes.toString("ascii", 12, 16) !== "IHDR") {
    report(path, "logo must be a valid PNG image");
    return;
  }
  if (bytes.readUInt32BE(16) !== 256 || bytes.readUInt32BE(20) !== 256) report(path, "logo must be 256 by 256 pixels");
}

export function validateOpenaiPackage(repoRootInput) {
  const repoRoot = resolve(repoRootInput);
  const errors = [];
  const report = (path, message) => errors.push(`${sourceRel(repoRoot, path)}: ${message}`);
  const packageDir = join(repoRoot, "plugins/co-invest-openai");
  if (!checkPathAncestry(repoRoot, packageDir, report)) return { errors, packageCount: 0 };
  if (!existsSync(packageDir)) {
    report(packageDir, "OpenAI package directory does not exist");
    return { errors, packageCount: 0 };
  }

  const actualFiles = new Set();
  let hasSymlink = false;
  try {
    walkPackage(packageDir, (path, abs, stat) => {
      if (stat.isSymbolicLink()) {
        report(abs, "symlinks are not allowed in the OpenAI package");
        hasSymlink = true;
      } else if (stat.isFile()) {
        actualFiles.add(path);
      } else if (stat.isDirectory()) {
        if (!EXPECTED_DIRS.has(path)) report(abs, "directory is outside the reviewed OpenAI package scope");
      } else {
        report(abs, "package entries must be regular files or directories");
      }
    });
  } catch {
    report(packageDir, "package contents cannot be inspected");
    return { errors, packageCount: 0 };
  }
  for (const path of actualFiles) {
    if (!ALLOWED_FILES.has(path)) report(join(packageDir, path), "file is outside the reviewed OpenAI package scope");
  }
  for (const expected of REQUIRED_FILES) {
    if (!actualFiles.has(expected)) report(join(packageDir, expected), "required OpenAI package file is missing");
  }
  const packageCount = actualFiles.has(".codex-plugin/plugin.json") ? 1 : 0;
  if (hasSymlink) return { errors, packageCount };

  const baselinePath = join(repoRoot, "schemas/openai/published-plugin-1.0.0.json");
  let baseline;
  try {
    const bytes = readFileSync(baselinePath);
    if (sha256(bytes) !== BASELINE_SHA256) report(baselinePath, "published manifest baseline bytes do not match the pinned export");
    baseline = JSON.parse(bytes.toString("utf8"));
  } catch {
    report(baselinePath, "published manifest baseline cannot be read as valid JSON");
  }

  const manifestPath = join(packageDir, ".codex-plugin/plugin.json");
  const manifest = parseJson(manifestPath, report);
  if (!isRecord(manifest)) {
    report(manifestPath, "manifest must be a JSON object");
  } else {
    if (manifest.version !== "1.0.2") report(manifestPath, 'version must be "1.0.2"');
    if (manifest.mcpServers !== "./.mcp.json") report(manifestPath, 'mcpServers must be "./.mcp.json"');
    if (manifest.skills !== "./skills/") report(manifestPath, 'skills must be "./skills/"');
    if (isRecord(baseline) && !sameValue(manifestWithoutAllowedChanges(manifest), manifestWithoutAllowedChanges(baseline))) {
      report(manifestPath, "manifest must match the published 1.0.0 export except for version, mcpServers and skills");
    }
  }

  const mcpPath = join(packageDir, ".mcp.json");
  const mcp = parseJson(mcpPath, report);
  const expectedMcp = { mcpServers: { "co-invest": { url: "https://coinvest-chat.liquid.trade" } } };
  if (!sameValue(mcp, expectedMcp)) report(mcpPath, 'MCP configuration must contain only co-invest at "https://coinvest-chat.liquid.trade"');

  for (const name of SKILL_NAMES) {
    validateSkill(join(packageDir, `skills/${name}/SKILL.md`), name, manifest?.name, report);
  }

  for (const [path, hash] of LOGO_HASHES) {
    if (actualFiles.has(path)) validatePng(join(packageDir, path), path, report);
  }
  for (const path of actualFiles) {
    if (!/\.(?:md|txt|json)$/i.test(path)) continue;
    try {
      if (CREDENTIAL_RE.test(readFileSync(join(packageDir, path), "utf8"))) report(join(packageDir, path), "possible credential or private key detected");
    } catch {
      report(join(packageDir, path), "package file cannot be read");
    }
  }
  return { errors, packageCount };
}

const invokedPath = process.argv[1] ? resolve(process.argv[1]) : "";
if (invokedPath === fileURLToPath(import.meta.url)) {
  const repoRoot = process.argv[2] ? resolve(process.cwd(), process.argv[2]) : dirname(dirname(fileURLToPath(import.meta.url)));
  const result = validateOpenaiPackage(repoRoot);
  if (result.errors.length) {
    for (const error of result.errors) console.log(`ERROR: ${error}`);
    process.exitCode = 1;
  } else {
    console.log(`OK: ${result.packageCount} OpenAI package`);
  }
}
