#!/usr/bin/env node
import { createHash } from "node:crypto";
import { existsSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { renderTools } from "./muse-paper-only.mjs";

const packageDir = join(dirname(dirname(fileURLToPath(import.meta.url))), "plugins/co-invest-muse");
const expectedContractHash = "dfebda6cbed7fcf447727792ee5b3da4e2549310b2c4eb793f1af84cea73b157";
const expectedContractFileSha = "9c6aa7ae21e9aa81fd886e7bc73805b759629358eb7dc4959dd1978eb90a2a2e";

function sha256(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

function ordered(value) {
  return JSON.stringify(value, null, 2) + "\n";
}

function parseArgs(args) {
  const parsed = { check: false, mcpRoot: null, sourceRevision: null };
  for (let index = 0; index < args.length; index++) {
    const arg = args[index];
    if (arg === "--check") parsed.check = true;
    else if (arg === "--mcp-root") parsed.mcpRoot = args[++index];
    else if (arg === "--source-revision") parsed.sourceRevision = args[++index];
    else throw new Error(`unknown argument: ${arg}`);
  }
  return parsed;
}

function loadCheckedIn() {
  return {
    contractBytes: readFileSync(join(packageDir, "paper-only.contract.json")),
    examples: JSON.parse(readFileSync(join(packageDir, "paper-only.examples.json"), "utf8")),
    source: JSON.parse(readFileSync(join(packageDir, "paper-only.source.json"), "utf8")),
  };
}

function render(contractBytes, examples, source) {
  const contract = JSON.parse(contractBytes.toString("utf8"));
  return renderTools(contract, examples, source);
}

function writeIfChanged(path, content) {
  const existing = existsSync(path) ? readFileSync(path, "utf8") : null;
  if (existing === content) return false;
  writeFileSync(path, content);
  return true;
}

function check() {
  const { contractBytes, examples, source } = loadCheckedIn();
  const docs = render(contractBytes, examples, source);
  const docsPath = join(packageDir, "tools.md");
  if (!existsSync(docsPath) || readFileSync(docsPath, "utf8") !== docs) {
    console.error("ERROR: plugins/co-invest-muse/tools.md differs from generated output");
    process.exitCode = 1;
    return;
  }
  const sha = sha256(contractBytes);
  if (sha !== source.contractSha256 || source.contractHash !== JSON.parse(contractBytes).contractHash) {
    console.error("ERROR: copied contract does not match paper-only.source.json");
    process.exitCode = 1;
    return;
  }
  console.log("OK: Muse paper-only contract and tool reference are reproducible");
}

function sync(mcpRootArg, revision) {
  if (!mcpRootArg || !/^[0-9a-f]{40}$/.test(revision ?? "")) {
    throw new Error("usage: node scripts/sync-muse-paper-only.mjs --mcp-root <liquid-mcp-checkout> --source-revision <full-git-sha>");
  }
  const mcpRoot = resolve(mcpRootArg);
  const contractSource = join(mcpRoot, "generated/paper-only.json");
  const matrixRoot = join(mcpRoot, "e2e/tool-matrix/paper-only");
  if (!existsSync(contractSource)) throw new Error(`missing ${contractSource}`);
  if (!existsSync(matrixRoot)) throw new Error(`missing ${matrixRoot}`);

  const contractBytes = readFileSync(contractSource);
  const contract = JSON.parse(contractBytes.toString("utf8"));
  if (contract.profile !== "paper-only" || contract.bindings?.length !== 45) throw new Error("source contract must be the complete 45-tool paper-only contract");
  const actualContractSha = sha256(contractBytes);
  if (contract.contractHash !== expectedContractHash) throw new Error(`source contract hash ${contract.contractHash} does not match approved profile hash ${expectedContractHash}`);
  if (actualContractSha !== expectedContractFileSha) throw new Error(`source contract file SHA-256 ${actualContractSha} does not match approved snapshot ${expectedContractFileSha}`);

  const examples = { formatVersion: 1, profile: "paper-only", tools: {} };
  const files = readdirSync(matrixRoot).filter((file) => file.endsWith(".json")).sort();
  for (const file of files) {
    const caseJson = JSON.parse(readFileSync(join(matrixRoot, file), "utf8"));
    if (caseJson.profile !== "paper-only" || typeof caseJson.tool !== "string") throw new Error(`${file} is not a paper-only tool-matrix case`);
    if (!caseJson.input || !caseJson.expected || typeof caseJson.expected.outcome !== "string" || !Array.isArray(caseJson.expected.assertions)) {
      throw new Error(`${file} is missing the representative input or expected outcome/assertions`);
    }
    if (Object.hasOwn(examples.tools, caseJson.tool)) throw new Error(`duplicate matrix case for ${caseJson.tool}`);
    examples.tools[caseJson.tool] = {
      input: caseJson.input,
      expected: {
        outcome: caseJson.expected?.outcome,
        assertions: caseJson.expected?.assertions,
      },
    };
  }
  const toolNames = new Set(contract.bindings.map((binding) => binding.definition.name));
  const exampleNames = new Set(Object.keys(examples.tools));
  if (files.length !== 45 || toolNames.size !== 45 || exampleNames.size !== toolNames.size || [...toolNames].some((name) => !exampleNames.has(name))) {
    throw new Error(`contract and matrix coverage differ: contract=${toolNames.size}, cases=${exampleNames.size}, files=${files.length}`);
  }

  const contractSha256 = actualContractSha;
  const examplesBytes = Buffer.from(ordered(examples));
  const source = {
    formatVersion: 1,
    sourceRevision: revision,
    contractHash: contract.contractHash,
    contractSha256,
    examplesSha256: sha256(examplesBytes),
  };
  const paths = {
    contract: join(packageDir, "paper-only.contract.json"),
    examples: join(packageDir, "paper-only.examples.json"),
    source: join(packageDir, "paper-only.source.json"),
    docs: join(packageDir, "tools.md"),
  };
  writeFileSync(paths.contract, contractBytes);
  writeFileSync(paths.examples, examplesBytes);
  writeFileSync(paths.source, ordered(source));
  const docs = renderTools(contract, examples, source);
  writeIfChanged(paths.docs, docs);
  console.log(`Synced ${contract.bindings.length} paper-only tools from ${revision}; contract sha256 ${contractSha256}`);
}

try {
  const args = parseArgs(process.argv.slice(2));
  if (args.check) check();
  else sync(args.mcpRoot, args.sourceRevision);
} catch (err) {
  console.error(`ERROR: ${err.message}`);
  process.exitCode = 1;
}
