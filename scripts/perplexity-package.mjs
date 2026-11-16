import { existsSync, lstatSync, readFileSync, readdirSync } from "node:fs";
import { join, relative, resolve, sep } from "node:path";
import Ajv2020 from "ajv/dist/2020.js";

export const PERPLEXITY_ENDPOINT = "https://coinvest-computer.liquid.trade/mcp";
const PACKAGE_NAME = "co-invest-perplexity";
const PLUGIN_NAME = "co-invest";
const PACKAGE_VERSION = "1.0.2";
const BASE_FILES = ["CHANGELOG.md", "LICENSE", "README.md", "assets/logo.svg", "mcp.json", "plugin.json"];
const SKILL = "skills/coinvest";

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

export function validatePerplexityPackage(repoRootInput) {
  const repoRoot = resolve(repoRootInput);
  const dir = join(repoRoot, "plugins", PACKAGE_NAME);
  const errors = [];
  const report = (path, message) => errors.push(`${relative(repoRoot, path).split(sep).join("/")}: ${message}`);
  if (!existsSync(dir)) return { errors: ["plugins/co-invest-perplexity: package folder is missing"], packageCount: 0 };

  const compile = (file) => new Ajv2020({ allErrors: true, strict: false }).compile(JSON.parse(readFileSync(join(repoRoot, "schemas/agent-plugins", file), "utf8")));
  const validateManifest = compile("plugin.schema.json");
  const validateMcp = compile("mcp.schema.json");

  const PACKAGE_FILES = new Set(BASE_FILES);
  const PACKAGE_DIRS = new Set(["assets", "skills", SKILL]);
  const skillSource = join(repoRoot, SKILL);
  if (existsSync(skillSource)) {
    walkPackage(skillSource, (path, _abs, stat) => (stat.isDirectory() ? PACKAGE_DIRS : PACKAGE_FILES).add(`${SKILL}/${path}`));
  } else {
    errors.push(`${SKILL}: canonical skill is missing`);
  }

  const actualFiles = new Set();
  walkPackage(dir, (path, abs, stat) => {
    if (stat.isSymbolicLink()) report(abs, "symlinks are not allowed in the connector package");
    else if (stat.isFile()) actualFiles.add(path);
    else if (stat.isDirectory() && !PACKAGE_DIRS.has(path)) report(abs, "directory is outside the reviewed Perplexity package scope");
    else if (!stat.isDirectory()) report(abs, "package entries must be regular files or directories");
  });
  for (const path of actualFiles) {
    if (!PACKAGE_FILES.has(path)) report(join(dir, path), "file is outside the reviewed Perplexity package scope");
  }
  for (const expected of PACKAGE_FILES) {
    if (!actualFiles.has(expected)) report(join(dir, expected), "required Perplexity package file is missing");
  }

  const manifestPath = join(dir, "plugin.json");
  if (actualFiles.has("plugin.json")) {
    try {
      const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
      if (!validateManifest(manifest)) {
        for (const issue of validateManifest.errors ?? []) report(manifestPath, `${issue.instancePath || "(root)"} ${issue.message}`);
      }
      if (!isRecord(manifest) || manifest.name !== PLUGIN_NAME) report(manifestPath, `name must be "${PLUGIN_NAME}"`);
      if (!isRecord(manifest) || manifest.version !== PACKAGE_VERSION) report(manifestPath, `version must be "${PACKAGE_VERSION}"`);
    } catch (err) {
      report(manifestPath, `cannot parse Agent Plugins manifest (${err.message})`);
    }
  }

  const mcpPath = join(dir, "mcp.json");
  if (actualFiles.has("mcp.json")) {
    try {
      const mcp = JSON.parse(readFileSync(mcpPath, "utf8"));
      if (!validateMcp(mcp)) {
        for (const issue of validateMcp.errors ?? []) report(mcpPath, `${issue.instancePath || "(root)"} ${issue.message}`);
      }
      const expected = { "Co-Invest": { type: "streamable-http", url: PERPLEXITY_ENDPOINT } };
      if (!isRecord(mcp) || !sameValue(mcp.mcpServers, expected)) {
        report(mcpPath, `mcpServers must contain only the streamable-http endpoint ${PERPLEXITY_ENDPOINT}`);
      }
    } catch (err) {
      report(mcpPath, `cannot parse MCP configuration (${err.message})`);
    }
  }

  const changelogPath = join(dir, "CHANGELOG.md");
  if (actualFiles.has("CHANGELOG.md") && !new RegExp(`^##\\s+${PACKAGE_VERSION.replaceAll(".", "\\.")}\\s*$`, "m").test(readFileSync(changelogPath, "utf8"))) {
    report(changelogPath, `missing "## ${PACKAGE_VERSION}" heading`);
  }

  return { errors, packageCount: 1 };
}
