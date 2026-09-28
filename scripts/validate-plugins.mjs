#!/usr/bin/env node
import { existsSync, lstatSync, readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, join, posix, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
import Ajv from "ajv";
import Ajv2020 from "ajv/dist/2020.js";
import addFormats from "ajv-formats";
import { parse as parseYaml } from "yaml";
import { SKILL_SYNC_MAP, diffSkillCopies } from "./sync-skills.mjs";

const scriptsDir = dirname(fileURLToPath(import.meta.url));
const repoRoot = process.argv[2] ? resolve(process.cwd(), process.argv[2]) : dirname(scriptsDir);

const errors = [];
function addError(path, reason) {
  errors.push(`ERROR: ${path}: ${reason}`);
}

function relOf(absPath) {
  return relative(repoRoot, absPath).split(sep).join("/");
}

function readJson(absPath) {
  return JSON.parse(readFileSync(absPath, "utf8"));
}

// Cached by absolute path so a manifest referenced from more than one check
// (e.g. a plugin's mcp.json from both the merge check and the root-manifest
// check) is read and, on failure, reported exactly once.
const jsonCache = new Map();
function tryReadJson(absPath, relPath) {
  if (jsonCache.has(absPath)) return jsonCache.get(absPath);
  let text;
  try {
    text = readFileSync(absPath, "utf8");
  } catch (err) {
    addError(relPath, `cannot read file: ${err.message}`);
    jsonCache.set(absPath, null);
    return null;
  }
  try {
    const parsed = JSON.parse(text);
    jsonCache.set(absPath, parsed);
    return parsed;
  } catch (err) {
    addError(relPath, `invalid JSON: ${err.message}`);
    jsonCache.set(absPath, null);
    return null;
  }
}

function formatAjvError(err) {
  return `${err.instancePath || "(root)"} ${err.message}`;
}

const NOT_RELATIVE = 'must be a relative path with no ".."';

// Returns null when value is a valid relative, forward-slash path with no
// segment that escapes the base directory, or a reason string otherwise.
function pathIssue(value) {
  if (typeof value !== "string" || value.length === 0) return NOT_RELATIVE;
  if (value.includes("\\")) return "must use forward slashes";
  if (value.startsWith("/")) return NOT_RELATIVE;
  const normalized = posix.normalize(value);
  if (normalized === ".." || normalized.startsWith("../")) return NOT_RELATIVE;
  return null;
}

function deepEqual(a, b) {
  if (a === b) return true;
  if (Array.isArray(a) || Array.isArray(b)) {
    if (!Array.isArray(a) || !Array.isArray(b) || a.length !== b.length) return false;
    return a.every((v, i) => deepEqual(v, b[i]));
  }
  if (a && b && typeof a === "object" && typeof b === "object") {
    const aKeys = Object.keys(a).sort();
    const bKeys = Object.keys(b).sort();
    if (aKeys.length !== bKeys.length || aKeys.some((k, i) => k !== bKeys[i])) return false;
    return aKeys.every((k) => deepEqual(a[k], b[k]));
  }
  return false;
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

const ajv7 = new Ajv({ allErrors: true, strict: false });
addFormats(ajv7);
const validateCursorMarketplace = ajv7.compile(readJson(join(repoRoot, "schemas/cursor/marketplace.schema.json")));
const validateCursorPlugin = ajv7.compile(readJson(join(repoRoot, "schemas/cursor/plugin.schema.json")));

const ajv2020 = new Ajv2020({ allErrors: true, strict: false });
addFormats(ajv2020);
const validateApPlugin = ajv2020.compile(readJson(join(repoRoot, "schemas/agent-plugins/plugin.schema.json")));
const validateApMcp = ajv2020.compile(readJson(join(repoRoot, "schemas/agent-plugins/mcp.schema.json")));

const PATH_FIELDS = ["logo", "mcpServers", "skills", "rules", "agents", "commands", "hooks"];
const GLOB_FIELDS = new Set(["skills", "rules", "agents", "commands"]);
const GLOB_CHARS = /[*?[\]{}]/;

// The path segments before the first one containing a glob metacharacter,
// i.e. the directory a glob pattern is rooted under.
function staticPrefixDir(pluginDirAbs, pattern) {
  const segments = pattern.split("/");
  const idx = segments.findIndex((s) => GLOB_CHARS.test(s));
  const prefixSegments = idx === -1 ? segments : segments.slice(0, idx);
  return prefixSegments.length === 0 ? pluginDirAbs : join(pluginDirAbs, ...prefixSegments);
}

function checkManifestPathField(pluginDirAbs, manifestRelPath, fieldName, fieldValue) {
  if (fieldValue === undefined) return;
  const values = Array.isArray(fieldValue) ? fieldValue : [fieldValue];
  for (const value of values) {
    if (typeof value !== "string") continue;
    if (fieldName === "logo" && /^https?:\/\//.test(value)) continue;
    const issue = pathIssue(value);
    if (issue) {
      addError(manifestRelPath, `${fieldName} "${value}" ${issue}`);
      continue;
    }
    if (GLOB_FIELDS.has(fieldName) && GLOB_CHARS.test(value)) {
      if (!existsSync(staticPrefixDir(pluginDirAbs, value))) {
        addError(manifestRelPath, `${fieldName} "${value}" static prefix directory does not exist`);
      }
      continue;
    }
    if (!existsSync(join(pluginDirAbs, value))) {
      addError(manifestRelPath, `${fieldName} "${value}" does not exist`);
    }
  }
}

function collectStrings(value, out) {
  if (typeof value === "string") out.push(value);
  else if (Array.isArray(value)) value.forEach((v) => collectStrings(v, out));
  else if (value && typeof value === "object") Object.values(value).forEach((v) => collectStrings(v, out));
}

const VAR_RE = /\$\{([^}]+)\}/g;

function scanVariables(label, servers, declaredVars) {
  const strings = [];
  collectStrings(servers, strings);
  for (const str of strings) {
    for (const match of str.matchAll(VAR_RE)) {
      const name = match[1];
      if (name === "CURSOR_PLUGIN_ROOT" || name === "CLAUDE_PLUGIN_ROOT" || name.startsWith("env:")) continue;
      if (!declaredVars.has(name)) {
        addError(label, `undeclared variable "\${${name}}"`);
      }
    }
  }
}

function validateServerDef(label, key, def) {
  if (!def || typeof def !== "object") {
    addError(label, `MCP server "${key}" is not an object`);
    return;
  }
  if (typeof def.url !== "string" && typeof def.command !== "string") {
    addError(label, `MCP server "${key}" has neither "url" nor "command"`);
    return;
  }
  if (typeof def.url === "string" && !/^https:\/\//.test(def.url)) {
    addError(label, `MCP server "${key}" url "${def.url}" must use https`);
  }
}

function resolveMcpServersField(pluginDirAbs, cursorManifestRelPath, fieldValue) {
  if (fieldValue === undefined) return [];
  const items = Array.isArray(fieldValue) ? fieldValue : [fieldValue];
  const sources = [];
  for (const item of items) {
    if (typeof item === "string") {
      const abs = join(pluginDirAbs, item);
      if (!existsSync(abs)) continue;
      const parsed = tryReadJson(abs, relOf(abs));
      if (!parsed) continue;
      const servers = parsed.mcpServers && typeof parsed.mcpServers === "object" ? parsed.mcpServers : parsed;
      sources.push({ label: relOf(abs), servers: servers && typeof servers === "object" ? servers : {} });
    } else if (item && typeof item === "object") {
      sources.push({ label: `${cursorManifestRelPath}#mcpServers`, servers: item });
    }
  }
  return sources;
}

// Cursor merges MCP sources in this order: .mcp.json, then mcp.json, with the
// first definition of a key winning between the two, then the manifest's own
// mcpServers, which overrides per key.
function checkMcpMerge(pluginDirAbs, cursorManifest, cursorManifestRelPath) {
  const sources = [];
  for (const filename of [".mcp.json", "mcp.json"]) {
    const abs = join(pluginDirAbs, filename);
    if (!existsSync(abs)) continue;
    const parsed = tryReadJson(abs, relOf(abs));
    if (!parsed) continue;
    const servers = parsed.mcpServers && typeof parsed.mcpServers === "object" ? parsed.mcpServers : {};
    sources.push({ label: relOf(abs), servers });
  }
  sources.push(...resolveMcpServersField(pluginDirAbs, cursorManifestRelPath, cursorManifest.mcpServers));

  const byKey = new Map();
  for (const source of sources) {
    for (const [key, def] of Object.entries(source.servers)) {
      if (!byKey.has(key)) byKey.set(key, []);
      byKey.get(key).push({ label: source.label, def });
    }
  }

  for (const [key, defs] of byKey) {
    for (let i = 1; i < defs.length; i++) {
      if (!deepEqual(defs[0].def, defs[i].def)) {
        addError(defs[i].label, `MCP server "${key}" conflicts with its definition in ${defs[0].label}`);
      }
    }
    const seen = [];
    for (const { label, def } of defs) {
      if (seen.some((s) => deepEqual(s, def))) continue;
      seen.push(def);
      validateServerDef(label, key, def);
    }
  }

  const declaredVars = new Set(Object.keys(cursorManifest.variables?.properties ?? {}));
  for (const source of sources) {
    scanVariables(source.label, source.servers, declaredVars);
  }
}

function checkRootPluginJson(pluginDirAbs, cursorManifest) {
  const rootPluginPath = join(pluginDirAbs, "plugin.json");
  if (!existsSync(rootPluginPath)) return;
  const rootRel = relOf(rootPluginPath);
  const rootPlugin = tryReadJson(rootPluginPath, rootRel);
  if (rootPlugin) {
    if (!validateApPlugin(rootPlugin)) {
      for (const err of validateApPlugin.errors) addError(rootRel, formatAjvError(err));
    }
  }

  const dotMcpPath = join(pluginDirAbs, ".mcp.json");
  if (existsSync(dotMcpPath)) {
    addError(relOf(dotMcpPath), "must not exist alongside a root plugin.json (Agent Plugins has no .mcp.json, and Cursor would merge it)");
  }

  const mcpPath = join(pluginDirAbs, "mcp.json");
  if (existsSync(mcpPath)) {
    const mcpRel = relOf(mcpPath);
    const mcpJson = tryReadJson(mcpPath, mcpRel);
    if (mcpJson && !validateApMcp(mcpJson)) {
      for (const err of validateApMcp.errors) addError(mcpRel, formatAjvError(err));
    }
  }

  if (!rootPlugin) return;
  for (const field of ["name", "version", "description", "homepage", "repository", "license"]) {
    if (rootPlugin[field] !== cursorManifest[field]) {
      addError(rootRel, `${field} "${rootPlugin[field]}" does not match the Cursor manifest's "${cursorManifest[field]}"`);
    }
  }
  if (!deepEqual(rootPlugin.keywords, cursorManifest.keywords)) {
    addError(rootRel, "keywords do not match the Cursor manifest's");
  }
}

function checkChangelog(pluginDirAbs, cursorManifest) {
  const changelogPath = join(pluginDirAbs, "CHANGELOG.md");
  if (!existsSync(changelogPath)) return;
  const version = cursorManifest.version;
  if (typeof version !== "string") return;
  const text = readFileSync(changelogPath, "utf8");
  const headingRe = new RegExp(`^##\\s+${escapeRegExp(version)}\\s*$`, "m");
  if (!headingRe.test(text)) {
    addError(relOf(changelogPath), `missing "## ${version}" heading`);
  }
}

// Parsed directly: jsonCache returns null for both a failed parse and a literal null.
function checkGrokPlugin(pluginDirAbs, cursorManifest) {
  const grokPath = join(pluginDirAbs, ".grok-plugin/plugin.json");
  if (!existsSync(grokPath)) return;
  const grokRel = relOf(grokPath);
  let text;
  try {
    text = readFileSync(grokPath, "utf8");
  } catch (err) {
    addError(grokRel, `cannot read file: ${err.message}`);
    return;
  }
  let grok;
  try {
    grok = JSON.parse(text);
  } catch (err) {
    addError(grokRel, `invalid JSON: ${err.message}`);
    return;
  }
  if (!grok || typeof grok !== "object" || Array.isArray(grok)) {
    addError(grokRel, "must parse as an object");
    return;
  }
  for (const field of ["name", "version", "description"]) {
    if (grok[field] !== cursorManifest[field]) {
      addError(grokRel, `${field} "${grok[field]}" must equal .cursor-plugin/plugin.json ${field} "${cursorManifest[field]}"`);
    }
  }
}

function checkMcpByteIdentity(pluginDirAbs) {
  const mcpPath = join(pluginDirAbs, "mcp.json");
  const dotMcpPath = join(pluginDirAbs, ".mcp.json");
  if (!existsSync(mcpPath) || !existsSync(dotMcpPath)) return;
  if (!readFileSync(mcpPath).equals(readFileSync(dotMcpPath))) {
    addError(relOf(dotMcpPath), "must be byte-identical to mcp.json");
  }
}

function parseFrontmatter(fileAbs) {
  const text = readFileSync(fileAbs, "utf8");
  const match = text.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n/);
  if (!match) return null;
  try {
    return parseYaml(match[1]) ?? {};
  } catch {
    return undefined;
  }
}

function checkFrontmatterPresent(rel, fm) {
  if (fm === null) {
    addError(rel, "missing YAML frontmatter");
    return false;
  }
  if (fm === undefined) {
    addError(rel, "invalid YAML frontmatter");
    return false;
  }
  return true;
}

const SKILL_NAME_RE = /^[a-z0-9]+(-[a-z0-9]+)*$/;

function checkSkillFrontmatter(rel, dirName, fm) {
  if (!checkFrontmatterPresent(rel, fm)) return;
  if (fm.name !== dirName) {
    addError(rel, `frontmatter name "${fm.name}" does not match directory "${dirName}"`);
  }
  if (typeof fm.name !== "string" || !SKILL_NAME_RE.test(fm.name) || fm.name.length > 64) {
    addError(rel, `frontmatter name "${fm.name}" must match ^[a-z0-9]+(-[a-z0-9]+)*$ and be at most 64 characters`);
  }
  if (typeof fm.description !== "string" || fm.description.length === 0 || fm.description.length > 1024) {
    addError(rel, "frontmatter description must be a non-empty string of at most 1024 characters");
  }
}

function discoverSkills(skillsRootAbs) {
  if (!existsSync(skillsRootAbs)) return [];
  const results = [];
  for (const entry of readdirSync(skillsRootAbs, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const skillMdAbs = join(skillsRootAbs, entry.name, "SKILL.md");
    if (existsSync(skillMdAbs) && statSync(skillMdAbs).isFile()) {
      results.push({ dirName: entry.name, skillMdAbs });
    }
  }
  return results;
}

function listMarkdownFiles(dirAbs) {
  const out = [];
  for (const entry of readdirSync(dirAbs, { withFileTypes: true })) {
    const abs = join(dirAbs, entry.name);
    if (entry.isDirectory()) out.push(...listMarkdownFiles(abs));
    else if (entry.isFile() && abs.endsWith(".md")) out.push(abs);
  }
  return out;
}

// A glob-declared field is walked one directory deep (the static prefix)
// for files with a matching extension, since there is no glob-matching
// dependency available; a literal path is checked exactly as declared.
function checkComponentField(pluginDirAbs, fieldValue, requiredKeys, extensions) {
  if (fieldValue === undefined) return;
  const values = Array.isArray(fieldValue) ? fieldValue : [fieldValue];
  for (const value of values) {
    if (typeof value !== "string") continue;
    let files;
    if (GLOB_CHARS.test(value)) {
      const prefixDir = staticPrefixDir(pluginDirAbs, value);
      if (!existsSync(prefixDir) || !statSync(prefixDir).isDirectory()) continue;
      files = readdirSync(prefixDir, { withFileTypes: true })
        .filter((entry) => entry.isFile() && extensions.some((ext) => entry.name.endsWith(ext)))
        .map((entry) => join(prefixDir, entry.name));
    } else {
      const abs = join(pluginDirAbs, value);
      if (!existsSync(abs)) continue;
      files = statSync(abs).isDirectory() ? listMarkdownFiles(abs) : [abs];
    }
    for (const file of files) {
      const rel = relOf(file);
      const fm = parseFrontmatter(file);
      if (!checkFrontmatterPresent(rel, fm)) continue;
      for (const key of requiredKeys) {
        if (typeof fm[key] !== "string" || fm[key].length === 0) {
          addError(rel, `frontmatter ${key} is required`);
        }
      }
    }
  }
}

const RULE_EXTENSIONS = [".md", ".mdc", ".markdown"];
const COMMAND_EXTENSIONS = [".md", ".mdc", ".markdown", ".txt"];

function checkComponentFrontmatter(pluginDirAbs, cursorManifest) {
  checkComponentField(pluginDirAbs, cursorManifest.rules, ["description"], RULE_EXTENSIONS);
  checkComponentField(pluginDirAbs, cursorManifest.agents, ["name", "description"], RULE_EXTENSIONS);
  checkComponentField(pluginDirAbs, cursorManifest.commands, ["name", "description"], COMMAND_EXTENSIONS);
}

function checkNoSymlinks(rootDirs) {
  const walk = (dirAbs) => {
    for (const entry of readdirSync(dirAbs, { withFileTypes: true })) {
      const abs = join(dirAbs, entry.name);
      const stat = lstatSync(abs);
      if (stat.isSymbolicLink()) {
        addError(relOf(abs), "symlink is not allowed");
        continue;
      }
      if (stat.isDirectory()) walk(abs);
    }
  };
  for (const dir of rootDirs) {
    if (existsSync(dir)) walk(dir);
  }
}

async function main() {
  const marketplacePath = join(repoRoot, ".cursor-plugin/marketplace.json");
  const marketplaceRel = relOf(marketplacePath);
  let marketplace = null;
  if (!existsSync(marketplacePath)) {
    addError(marketplaceRel, "does not exist");
  } else {
    marketplace = tryReadJson(marketplacePath, marketplaceRel);
    if (marketplace && !validateCursorMarketplace(marketplace)) {
      for (const err of validateCursorMarketplace.errors) addError(marketplaceRel, formatAjvError(err));
    }
  }

  const plugins = [];
  if (marketplace && Array.isArray(marketplace.plugins)) {
    const seenNames = new Set();
    for (const entry of marketplace.plugins) {
      if (typeof entry.name === "string") {
        if (seenNames.has(entry.name)) addError(marketplaceRel, `duplicate plugin name "${entry.name}"`);
        seenNames.add(entry.name);
      }
      if (typeof entry.source !== "string") continue;
      const sourceIssue = pathIssue(entry.source);
      if (sourceIssue) {
        addError(marketplaceRel, `plugin "${entry.name}" source "${entry.source}" ${sourceIssue}`);
        continue;
      }
      const dirAbs = join(repoRoot, entry.source);
      if (!existsSync(dirAbs)) {
        addError(marketplaceRel, `plugin "${entry.name}" source "${entry.source}" does not exist`);
        continue;
      }
      const manifestAbs = join(dirAbs, ".cursor-plugin/plugin.json");
      if (!existsSync(manifestAbs)) {
        addError(marketplaceRel, `plugin "${entry.name}" source "${entry.source}" has no .cursor-plugin/plugin.json`);
        continue;
      }
      const manifest = tryReadJson(manifestAbs, relOf(manifestAbs));
      if (manifest && manifest.name !== entry.name) {
        addError(marketplaceRel, `plugin "${entry.name}" source manifest name "${manifest.name}" does not match the marketplace entry name`);
      }
      plugins.push({ entry, dirAbs });
    }
  }

  let skillCount = 0;
  for (const skill of discoverSkills(join(repoRoot, "skills"))) {
    skillCount++;
    checkSkillFrontmatter(relOf(skill.skillMdAbs), skill.dirName, parseFrontmatter(skill.skillMdAbs));
  }

  for (const plugin of plugins) {
    const cursorManifestPath = join(plugin.dirAbs, ".cursor-plugin/plugin.json");
    const cursorManifestRel = relOf(cursorManifestPath);
    const cursorManifest = tryReadJson(cursorManifestPath, cursorManifestRel);
    if (!cursorManifest) continue;
    if (!validateCursorPlugin(cursorManifest)) {
      for (const err of validateCursorPlugin.errors) addError(cursorManifestRel, formatAjvError(err));
    }

    for (const field of PATH_FIELDS) {
      checkManifestPathField(plugin.dirAbs, cursorManifestRel, field, cursorManifest[field]);
    }

    checkMcpMerge(plugin.dirAbs, cursorManifest, cursorManifestRel);
    checkRootPluginJson(plugin.dirAbs, cursorManifest);
    checkChangelog(plugin.dirAbs, cursorManifest);
    checkGrokPlugin(plugin.dirAbs, cursorManifest);
    checkMcpByteIdentity(plugin.dirAbs);
    checkComponentFrontmatter(plugin.dirAbs, cursorManifest);

    if (typeof plugin.entry.description === "string" && plugin.entry.description !== cursorManifest.description) {
      addError(marketplaceRel, `plugin "${plugin.entry.name}" marketplace description does not match its Cursor manifest description`);
    }

    for (const skill of discoverSkills(join(plugin.dirAbs, "skills"))) {
      skillCount++;
      checkSkillFrontmatter(relOf(skill.skillMdAbs), skill.dirName, parseFrontmatter(skill.skillMdAbs));
    }
  }

  for (const diff of await diffSkillCopies(repoRoot, SKILL_SYNC_MAP)) {
    addError(diff.path, `${diff.reason} (run npm run sync:skills)`);
  }

  checkNoSymlinks([join(repoRoot, "plugins"), join(repoRoot, "skills")]);

  if (errors.length > 0) {
    for (const line of errors) console.log(line);
    process.exitCode = 1;
    return;
  }
  console.log(`OK: ${plugins.length} plugins, ${skillCount} skills`);
}

main().catch((err) => {
  console.log(`ERROR: internal: ${err.stack || err.message}`);
  process.exitCode = 1;
});
