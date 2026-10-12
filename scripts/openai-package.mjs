import { existsSync, lstatSync, readFileSync, readdirSync } from "node:fs";
import { dirname, join, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
import Ajv2020 from "ajv/dist/2020.js";
import addFormats from "ajv-formats";

export const OPENAI_ENDPOINT = "https://coinvest-chat.liquid.trade/mcp";
const PACKAGE_NAME = "co-invest";
const PACKAGE_VERSION = "1.0.2";
const OPENAI_NAMESPACE = "com.openai";
const EXPECTED_FILES = new Set([
  "CHANGELOG.md",
  "LICENSE",
  "README.md",
  "assets/logo.svg",
  "mcp.json",
  "plugin.json",
]);
const EXPECTED_DIRS = new Set(["assets"]);
const CREDENTIAL_RE = /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----|\b(?:ghp|github_pat|sk_live|sk_test)_[A-Za-z0-9_-]{12,}|\bBearer\s+[A-Za-z0-9._~+/-]{16,}|\b(?:api[_-]?key|client[_-]?secret|access[_-]?token|refresh[_-]?token)["']?\s*[:=]\s*["']?[A-Za-z0-9._~+/-]{12,}/i;
const PRIVATE_TEXT_RE = /(?:^|["\s])(?:\/Users\/|\/home\/)[^\s"']+/m;
const URL_RE = /^https:\/\/[^\s]+$/;

function isRecord(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function sortedKeys(value) {
  return isRecord(value) ? Object.keys(value).sort() : [];
}

function sameKeys(value, expected) {
  return isRecord(value) && sortedKeys(value).join("\0") === [...expected].sort().join("\0");
}

function sameValue(left, right) {
  if (left === right) return true;
  if (Array.isArray(left) || Array.isArray(right)) {
    return Array.isArray(left) && Array.isArray(right) && left.length === right.length && left.every((item, index) => sameValue(item, right[index]));
  }
  if (!isRecord(left) || !isRecord(right)) return false;
  const keys = sortedKeys(left);
  return keys.join("\0") === sortedKeys(right).join("\0") && keys.every((key) => sameValue(left[key], right[key]));
}

function readJson(path, report) {
  try {
    return JSON.parse(readFileSync(path, "utf8"));
  } catch {
    report(path, "cannot read valid JSON");
    return null;
  }
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
  const rel = relative(repoRoot, packageDir);
  let current = repoRoot;
  const rootStat = lstatSync(repoRoot);
  if (rootStat.isSymbolicLink() || !rootStat.isDirectory()) {
    report(repoRoot, "repository root must be a real directory, not a symlink");
    valid = false;
  }
  for (const part of rel.split(sep).filter(Boolean)) {
    current = join(current, part);
    let stat;
    try { stat = lstatSync(current); }
    catch (error) {
      if (error.code === "ENOENT") continue;
      throw error;
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

function validateInterface(interfaceValue, report, path) {
  if (!isRecord(interfaceValue)) {
    report(path, "extensions.com.openai.interface must be an object");
    return;
  }
  const interfaceFields = ["displayName", "shortDescription", "longDescription", "developerName", "category", "websiteURL", "supportURL", "privacyPolicyURL", "termsOfServiceURL", "logo", "composerIcon"];
  if (!sameKeys(interfaceValue, interfaceFields)) report(path, "interface contains missing or unsupported fields");
  const requiredText = ["displayName", "shortDescription", "longDescription", "developerName"];
  for (const key of requiredText) {
    if (typeof interfaceValue[key] !== "string" || interfaceValue[key].trim().length === 0) report(path, `interface.${key} must be a non-empty string`);
  }
  if (interfaceValue.displayName !== "Co-Invest") report(path, 'interface.displayName must be "Co-Invest"');
  if (interfaceValue.developerName !== "Liquid") report(path, 'interface.developerName must be "Liquid"');
  if (typeof interfaceValue.displayName === "string" && interfaceValue.displayName.length > 30) report(path, "interface.displayName must be at most 30 characters");
  if (typeof interfaceValue.developerName === "string" && interfaceValue.developerName.length > 80) report(path, "interface.developerName must be at most 80 characters");
  if (typeof interfaceValue.shortDescription === "string" && interfaceValue.shortDescription.length > 30) report(path, "interface.shortDescription must be at most 30 characters");
  if (typeof interfaceValue.longDescription === "string" && interfaceValue.longDescription.length > 4000) report(path, "interface.longDescription must be at most 4000 characters");
  for (const key of ["displayName", "shortDescription", "longDescription", "developerName"]) {
    if (typeof interfaceValue[key] === "string" && /[\r\n]/.test(interfaceValue[key])) report(path, `interface.${key} must not contain newlines`);
  }

  const urls = ["websiteURL", "privacyPolicyURL", "termsOfServiceURL", "supportURL"];
  for (const key of urls) {
    let valid = false;
    try {
      const url = new URL(interfaceValue[key]);
      valid = URL_RE.test(interfaceValue[key]) && url.protocol === "https:" && url.hostname === "www.liquid.trade" && !url.username && !url.password;
    } catch {}
    if (typeof interfaceValue[key] === "string" && interfaceValue[key].length > 1024) report(path, `interface.${key} must be at most 1024 characters`);
    if (!valid) report(path, `interface.${key} must be a public HTTPS URL on www.liquid.trade`);
  }
  if (interfaceValue.category !== "Finance") report(path, 'interface.category must be the supported "Finance" category');
  for (const key of ["logo", "composerIcon"]) {
    const icon = interfaceValue[key];
    if (icon !== "./assets/logo.svg") {
      report(path, `interface.${key} must reference the approved ./assets/logo.svg`);
      continue;
    }
  }
}

function validateOpenAiManifest(manifest, report, path) {
  if (!isRecord(manifest)) return;
  if (!sameKeys(manifest, ["$schema", "name", "version", "description", "author", "homepage", "repository", "license", "keywords", "extensions"])) {
    report(path, "manifest contains missing or unsupported fields (including apps/hooks or private submission data)");
  }
  if (manifest.name !== PACKAGE_NAME) report(path, `name must be "${PACKAGE_NAME}"`);
  if (manifest.version !== PACKAGE_VERSION) report(path, `version must be "${PACKAGE_VERSION}"`);
  if (!sameKeys(manifest.author, ["name", "email", "url"]) || manifest.author.name !== "Liquid" || manifest.author.email !== "support@liquid.trade") {
    report(path, 'author must identify Liquid with support email "support@liquid.trade"');
  }
  const extensions = manifest.extensions;
  if (!isRecord(extensions) || !sameKeys(extensions, [OPENAI_NAMESPACE])) {
    report(path, 'extensions must contain only "com.openai"');
  }
  const openai = extensions?.[OPENAI_NAMESPACE];
  if (!isRecord(openai) || !sameKeys(openai, ["interface", "publication"])) report(path, 'extensions.com.openai must contain only "interface" and "publication"');
  else {
    validateInterface(openai.interface, report, path);
    const publication = openai.publication;
    if (!isRecord(publication) || !sameKeys(publication, ["release_notes"]) || typeof publication.release_notes !== "string" || publication.release_notes.trim().length === 0) {
      report(path, 'extensions.com.openai.publication must contain only a non-empty "release_notes" string');
    } else if (publication.release_notes.length > 500) {
      report(path, "publication.release_notes must be at most 500 characters");
    }
  }
}

function validateOpenAiMcp(mcp, report, path, schemaValidator) {
  if (!isRecord(mcp) || !isRecord(mcp.mcpServers)) {
    report(path, "MCP configuration must be an object with an object-valued mcpServers");
    return;
  }
  if (!sameKeys(mcp.mcpServers, ["Co-Invest"])) report(path, 'mcpServers must contain only "Co-Invest"');
  const server = mcp.mcpServers["Co-Invest"];
  if (!isRecord(server)) {
    report(path, "Co-Invest MCP server must be an object");
    return;
  }
  if (server.type !== "streamable-http" || server.url !== OPENAI_ENDPOINT) report(path, `Co-Invest must use streamable-http at ${OPENAI_ENDPOINT}`);
  if (Object.hasOwn(server, "headers")) report(path, "headers are not allowed in the portable package");
  const openaiExtension = server.extensions?.[OPENAI_NAMESPACE];
  const knownAuth = {
    auth: {
      type: "oauth",
      client: { mode: "dcr" },
      baseScopes: ["read", "trade"],
    },
  };
  if (!sameValue(openaiExtension, knownAuth) || !sameKeys(server.extensions, [OPENAI_NAMESPACE])) report(path, 'Co-Invest may contain only the known OpenAI OAuth DCR auth extension with read and trade scopes');
  const schemaCandidate = structuredClone(mcp);
  delete schemaCandidate.mcpServers["Co-Invest"].extensions;
  if (!schemaValidator(schemaCandidate)) {
    for (const issue of schemaValidator.errors ?? []) report(path, `${issue.instancePath || "(root)"} ${issue.message}`);
  }
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
  walkPackage(packageDir, (path, abs, stat) => {
    if (stat.isSymbolicLink()) {
      report(abs, "symlinks are not allowed in the OpenAI package");
      hasSymlink = true;
    }
    if (stat.isFile()) actualFiles.add(path);
    else if (stat.isDirectory() && !EXPECTED_DIRS.has(path)) report(abs, "directory is outside the reviewed OpenAI package scope");
    else if (!stat.isDirectory()) report(abs, "package entries must be regular files or directories");
  });
  for (const path of actualFiles) {
    if (!EXPECTED_FILES.has(path)) report(join(packageDir, path), "file is outside the reviewed OpenAI package scope");
  }
  for (const expected of EXPECTED_FILES) {
    if (!actualFiles.has(expected)) report(join(packageDir, expected), "required OpenAI package file is missing");
  }
  if (hasSymlink) return { errors, packageCount: actualFiles.has("plugin.json") ? 1 : 0 };

  const pluginSchemaPath = join(repoRoot, "schemas/agent-plugins/plugin.schema.json");
  const mcpSchemaPath = join(repoRoot, "schemas/agent-plugins/mcp.schema.json");
  const ajv = new Ajv2020({ allErrors: true, strict: false });
  addFormats(ajv);
  const validateManifestSchema = ajv.compile(JSON.parse(readFileSync(pluginSchemaPath, "utf8")));
  const validateMcpSchema = ajv.compile(JSON.parse(readFileSync(mcpSchemaPath, "utf8")));

  const pluginPath = join(packageDir, "plugin.json");
  const manifest = readJson(pluginPath, report);
  if (!validateManifestSchema(manifest)) {
    for (const issue of validateManifestSchema.errors ?? []) report(pluginPath, `${issue.instancePath || "(root)"} ${issue.message}`);
  }
  validateOpenAiManifest(manifest, report, pluginPath);
  const mcpPath = join(packageDir, "mcp.json");
  const mcp = readJson(mcpPath, report);
  validateOpenAiMcp(mcp, report, mcpPath, validateMcpSchema);

  const manifestInterface = manifest?.extensions?.[OPENAI_NAMESPACE]?.interface;
  const logoValue = manifestInterface?.logo;
  const composerValue = manifestInterface?.composerIcon;
  const logoPath = logoValue === "./assets/logo.svg" ? join(packageDir, logoValue) : "";
  const composerPath = composerValue === "./assets/logo.svg" ? join(packageDir, composerValue) : "";
  const readSvgSize = (path, property) => {
    try {
      if (lstatSync(path).size > 5 * 1024 * 1024) {
        report(path, `${property} asset must be at most 5 MiB`);
        return;
      }
      const svg = readFileSync(path, "utf8");
      const match = svg.match(/<svg\b[^>]*\bwidth=["'](\d+(?:\.\d+)?)(?:px)?["'][^>]*\bheight=["'](\d+(?:\.\d+)?)(?:px)?["']/i);
      if (!match) {
        report(path, `${property} asset must declare explicit square dimensions`);
        return;
      }
      if (Number(match[1]) !== Number(match[2]) || Number(match[1]) < 48) report(path, `${property} asset must be square and at least 48 pixels`);
    } catch (error) {
      report(path || packageDir, `${property} asset cannot be read (${error.message})`);
    }
  };
  if (logoPath) readSvgSize(logoPath, "logo");
  if (composerPath && composerPath !== logoPath) readSvgSize(composerPath, "composerIcon");

  for (const path of actualFiles) {
    if (!EXPECTED_FILES.has(path)) continue;
    try {
      const text = readFileSync(join(packageDir, path), "utf8");
      if (CREDENTIAL_RE.test(text)) report(join(packageDir, path), "possible credential or private key detected");
      if (PRIVATE_TEXT_RE.test(text)) report(join(packageDir, path), "machine-specific absolute path is not allowed in the portable package");
    } catch {
      report(join(packageDir, path), "cannot read package file");
    }
  }
  return { errors, packageCount: existsSync(pluginPath) ? 1 : 0 };
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
