import { createHash } from "node:crypto";
import { lstatSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { deflateRawSync } from "node:zlib";
import { SKILL_SYNC_MAP } from "./sync-skills.mjs";

const PACKAGE_NAME = "co-invest-claude";
const DOS_TIME = 0;
const DOS_DATE = (0 << 9) | (1 << 5) | 1; // 1980-01-01
const FILE_MODE = (0o100644 << 16) >>> 0;

const CRC_TABLE = Array.from({ length: 256 }, (_, n) => {
  let c = n;
  for (let k = 0; k < 8; k += 1) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});

function crc32(buf) {
  let c = 0xffffffff;
  for (const byte of buf) c = CRC_TABLE[(c ^ byte) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function listFiles(root, prefix = "") {
  const out = [];
  for (const entry of readdirSync(root, { withFileTypes: true })) {
    const rel = prefix ? `${prefix}/${entry.name}` : entry.name;
    const abs = join(root, entry.name);
    const stat = lstatSync(abs);
    if (stat.isSymbolicLink()) throw new Error(`${abs}: symlinks are not allowed`);
    if (stat.isDirectory()) out.push(...listFiles(abs, rel));
    else if (stat.isFile()) out.push(rel);
  }
  return out;
}

function compare(a, b) {
  return a < b ? -1 : a > b ? 1 : 0;
}

// entries: [{ name, data: Buffer }]; deterministic: sorted, fixed timestamps and modes.
export function buildZip(entries) {
  const sorted = [...entries].sort((a, b) => compare(a.name, b.name));
  const locals = [];
  const centrals = [];
  let offset = 0;
  for (const { name, data } of sorted) {
    const nameBuf = Buffer.from(name, "utf8");
    const compressed = deflateRawSync(data, { level: 9 });
    const crc = crc32(data);
    const local = Buffer.alloc(30);
    local.writeUInt32LE(0x04034b50, 0);
    local.writeUInt16LE(20, 4);
    local.writeUInt16LE(0x0800, 6);
    local.writeUInt16LE(8, 8);
    local.writeUInt16LE(DOS_TIME, 10);
    local.writeUInt16LE(DOS_DATE, 12);
    local.writeUInt32LE(crc, 14);
    local.writeUInt32LE(compressed.length, 18);
    local.writeUInt32LE(data.length, 22);
    local.writeUInt16LE(nameBuf.length, 26);
    local.writeUInt16LE(0, 28);
    const central = Buffer.alloc(46);
    central.writeUInt32LE(0x02014b50, 0);
    central.writeUInt16LE((3 << 8) | 20, 4);
    central.writeUInt16LE(20, 6);
    central.writeUInt16LE(0x0800, 8);
    central.writeUInt16LE(8, 10);
    central.writeUInt16LE(DOS_TIME, 12);
    central.writeUInt16LE(DOS_DATE, 14);
    central.writeUInt32LE(crc, 16);
    central.writeUInt32LE(compressed.length, 20);
    central.writeUInt32LE(data.length, 24);
    central.writeUInt16LE(nameBuf.length, 28);
    central.writeUInt32LE(FILE_MODE, 38);
    central.writeUInt32LE(offset, 42);
    locals.push(local, nameBuf, compressed);
    centrals.push(central, nameBuf);
    offset += local.length + nameBuf.length + compressed.length;
  }
  const centralBuf = Buffer.concat(centrals);
  const end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0);
  end.writeUInt16LE(sorted.length, 8);
  end.writeUInt16LE(sorted.length, 10);
  end.writeUInt32LE(centralBuf.length, 12);
  end.writeUInt32LE(offset, 16);
  return Buffer.concat([...locals, centralBuf, end]);
}

export function buildSkillZips(repoRootInput) {
  const repoRoot = resolve(repoRootInput);
  return SKILL_SYNC_MAP[PACKAGE_NAME].map((skill) => {
    const dir = join(repoRoot, "skills", skill);
    const entries = listFiles(dir).map((rel) => ({ name: `${skill}/${rel}`, data: readFileSync(join(dir, rel)) }));
    return { name: `${skill}.zip`, data: buildZip(entries) };
  });
}

export function writeSkillZips(repoRoot, outDir) {
  const out = resolve(outDir);
  mkdirSync(out, { recursive: true });
  return buildSkillZips(repoRoot).map(({ name, data }) => {
    writeFileSync(join(out, name), data);
    return { name, bytes: data.length, sha256: createHash("sha256").update(data).digest("hex") };
  });
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  const idx = process.argv.indexOf("--out");
  const outDir = idx > 0 ? process.argv[idx + 1] : undefined;
  if (!outDir) {
    console.error("usage: node scripts/package-claude-skills.mjs --out <dir>");
    process.exit(2);
  }
  const repoRoot = resolve(import.meta.dirname, "..");
  for (const { name, bytes, sha256 } of writeSkillZips(repoRoot, outDir)) console.log(`${name} ${bytes} ${sha256}`);
}
