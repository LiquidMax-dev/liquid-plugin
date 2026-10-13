# Superseded metadata-only OpenAI package

**Superseded 2026-10-13 by [SPEC-openai-mcp-preservation-20261013](SPEC-openai-mcp-preservation-20261013.md).** The owner uploaded the three-file ZIP and OpenAI rejected it because the existing MCP declaration was missing. The export was incomplete for an update. The replacement adds `mcpServers: "./.mcp.json"` and the existing registered root URL, preserving listing fields and logos. The original local-verification record below is historical; its three-file archive must not be used.

Historical status: locally verified, then rejected by portal import.

## TLDR

Prepare Co-Invest 1.0.2 from the owner's published 1.0.0 ZIP, preserving every listing field and both original PNG logos. Update liquid-plugin accordingly and document the current Restricted tool definitions from the live server. This task prepares an upload artifact; it does not submit or publish it.

## Problem

The provisional package in SPEC-openai-plugin-1.0.2-20261012 used a guessed machine name, new listing copy, a different logo format and new OAuth configuration. The owner supplied the actual live export on 2026-10-13. Its machine name is `app-6a20e26c6ab8819191519e2811e03522`, its format is `.codex-plugin/plugin.json`, and it contains only that manifest plus `assets/logo.png` and `assets/logo-dark.png`. The published description, prompts and URLs must be preserved.

## Solution

- Replace the provisional portable manifest/MCP file/SVG with the exported Codex manifest and exact PNG bytes. Change only manifest.version to 1.0.2. Keep a public baseline copy of the original manifest in schemas/openai/published-plugin-1.0.0.json and verify semantic equality after excluding version. Pin both logo hashes in validation.
- Build a deterministic ZIP with exactly the same three paths as the live export. README, changelog, license and tool-reference documentation remain in the repository and outside this upload archive.
- Do not add an MCP declaration to an export that lacks one, invent a new OAuth client, or copy any credentials. The existing hosted MCP connection is managed in OpenAI's portal. Tools/descriptions update through hosted MCP scans; eligible changes may propagate automatically, and Rescan requests a fresh check. They are not imported from arbitrary fields or files in a plugin ZIP.
- Record the latest read-only tools/list catalog from https://coinvest-chat.liquid.trade/mcp in docs/openai/tools.json and render docs/openai/tools.md from it. Only publish name/title/description/inputSchema/outputSchema/annotations; no initialize instructions, private client/session IDs, account data, tokens, operational logs or full tool responses. Include endpoint, profile, mode, observed timestamp and contract hash as public source metadata. Do not claim which tools are new relative to 1.0.0: the export has no historical catalog.

## Architecture

The existing focused validator now checks the Codex manifest against the exported public baseline, version 1.0.2, original PNG hashes and file paths. Preserve strict unknown-file, malformed-JSON, credential and symlink checks. The builder archives only three upload files but permits the existing repository README/CHANGELOG/LICENSE alongside them, without packing those documentation files. Keep OpenAI outside the Cursor marketplace.

Tool-reference generation is deterministic from the sanitized JSON snapshot and checked during repository validation. Do not publish raw MCP initialize output. The live server's public tool schemas are documentation, not declarations that OpenAI imports from this ZIP.

## Phases

1. Independent spec review before implementation.
2. Five non-overlapping roles: package/baseline/assets; validator/builder; tool-reference generation; regression tests; independent review/docs. Root integrates README/submission notes and existing spec corrections.
3. Run repository gates, build the real archive and compare it independently with the owner-supplied ZIP. Commit once and open a PR from current main; the previous PR is already merged. Routine verified branch pushes are authorized; no merge is implied.

## Data models and API contracts

No server/runtime contract changes. The archive's only metadata difference is version 1.0.0 -> 1.0.2. The package name, author object, description, complete interface object and both image bytes stay unchanged. The absence of an MCP file in the legacy export does not establish a skills-only plugin; retain the existing portal connection.

The repository tool snapshot has formatVersion 1, endpoint, observedAt, profile, tradingMode, contractHash and tools. Each tool contains only the allowlisted MCP definition fields above. All tool names must be unique, descriptions nonempty, input schemas object-valued; deterministic Markdown includes every name and exact description with its schema.

## Risks

The ZIP cannot approve tools or prove the portal's current scan result. Submission instructions must make the separate scan step clear. The current Codex documentation requires composerIcon, but the published export lacks it; preserve the exact export as requested and record portal acceptance as unverified. Do not invent metadata defaults or add support email/homepage fields. The local catalog may later drift from the server; date and contract hash identify the measured snapshot.

## Verification

- Independent archive comparison: same three names, original logos byte-identical, parsed manifest difference exactly version 1.0.0 -> 1.0.2, no symlinks/private files.
- Validate manifest baseline and PNG hashes; reject wrong identity, changed metadata/logo, malformed JSON, credentials, unexpected package files and symlinks. Builder rejects existing output and destinations within the package, including aliases; deterministic output.
- Read-only live health + authenticated initialize/tools/list and a market read. No account mutations or trades. Confirm endpoint remains interactive-v1 / trading-disabled-links-only. Keep tokens in memory and reports outside the repository.
- npm ci, npm run validate, npm test, skill-copy check and syntax/whitespace checks. No standalone typecheck/linter exists. Verify other platform package bytes unchanged.
- Compare generated tool docs with the captured live catalog, scan committed text for confidential data, then inspect actual ZIP bytes again after final integration.
- OpenAI upload/scan/acceptance is outside this preparation task; no claim that it was tested in OpenAI.

## Executed results — 2026-10-13

- Independent advisor completed before implementation; five package, build, catalog, test and review roles completed. Final independent review found no blockers.
- `npm ci`, `npm run validate`, all 33 tests, `node scripts/sync-skills.mjs --check`, script syntax checks and `git diff --check` passed. The repository has no standalone typecheck or lint command.
- Built the real 14,483-byte archive and independently compared it with the owner's export: exactly the same three regular-file paths, both logos byte-identical, and only manifest.version changed. The independent reviewer reproduced SHA-256 `a435261a324eae7dc64694833f81ab83a8cb412b20987618f7029a3591718854`.
- Live health, authenticated initialize/tools/list and BTC market read passed. The Restricted endpoint reported 44 tools and contract hash `a7242af0dae02ac0e1f993d96c9169bc437281cc24346f34d71e61f86b107655`. No account writes or trades were performed.
- The repository JSON exactly matches the sanitized live capture. Generated Markdown covers all 44 definitions; credential and private-data scans passed. Other platform package files and existing schemas are unchanged.
- No portal upload, MCP rescan, OpenAI host execution or submission was performed. The legacy missing composerIcon field remains preserved and portal acceptance is unverified.

Sources: owner-provided published 1.0.0 ZIP (SHA-256 c97922571c5ba7cdc946b0a709bb52f0cb80145c10c96f3193a747751ea2b2b5), [OpenAI update workflow](https://developers.openai.com/plugins/deploy/submission#update-your-published-plugin) and [MCP scans](https://developers.openai.com/plugins/deploy/submission#update-to-your-mcp-server), checked 2026-10-13.
