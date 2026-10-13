# Preserve the existing OpenAI MCP connection

Status: superseded by SPEC-openai-skills-and-exact-url-20261013.

**Corrected 2026-10-13:** The four-file archive below was rejected because the UI normalizes the MCP URL with a slash, while the registered string has none. Preserve `https://coinvest-chat.liquid.trade` exactly. The seven-file skills archive was subsequently accepted as a 1.0.2 draft, and metadata plus all three skills passed checks. The historical account below describes the rejected artifact, not the current package.

## TLDR

Restore the existing Restricted MCP declaration to the Co-Invest 1.0.2 update. Preserve the published identity, listing fields and logos. The user's portal rejected the three-file export-derived ZIP because removing the existing MCP is unsupported.

## Problem

SPEC-openai-live-metadata-20261013 inferred that a metadata-only export could preserve a portal-managed connection without declaring it. The portal disproved that assumption: "Keep the existing MCP connection" on `.codex-plugin/plugin.json`.

## Solution and architecture

Use the existing Codex format. Add `mcpServers: "./.mcp.json"` to the manifest and root `.mcp.json` with exactly one named server, `co-invest`, whose only property is the existing HTTPS URL. The authenticated portal was inspected on 2026-10-13: its registered URL is exactly `https://coinvest-chat.liquid.trade/`, authentication is Authorized, domain is verified, and MCP key is Not specified. Preserve that root URL exactly; `/mcp` was only the direct verification/catalog route. Do not introduce a new OAuth client, auth overrides, credentials or server URL. Listing metadata remains identical to the source export apart from version and the required MCP declaration. Both PNGs remain byte-identical.

The builder now emits four files, adding `.mcp.json`. Validation requires the declaration, exact URL and server map. Reject missing, malformed, changed or extra connections, headers and credentials. Keep existing archive/path/symlink safeguards. The 44-tool catalog remains repository documentation; hosted MCP scanning supplies tools.

## Phases

Independent advisor reviews this correction; implementation roles cover package, validator/builder, tests, docs and independent verification. Root integrates, builds, runs the gates and updates the existing PR as one feature commit using an explicit force-with-lease if still open. No merge or public submission is implied.

## Data models and API contracts

Manifest gains one string field. Root MCP JSON is `{ "mcpServers": { "co-invest": { "url": "https://coinvest-chat.liquid.trade/" } } }`. No server/runtime changes. OAuth remains managed by the existing portal connection.

## Risks

A downloaded export can omit a required declaration. Local integrity checks alone cannot establish portal compatibility. Portal import must prove the MCP-removal finding is gone; do not publish or submit. The existing root URL is authoritative; do not replace it with the separately probed `/mcp` route. The portal exposes no existing MCP key, so `co-invest` is the package declaration key, not a claim about a prior registered key. Preserve the original export and rejected ZIP; build a clearly named corrected ZIP.

## Verification

- Confirm existing endpoint in the authenticated Liquid-profile portal; record no secrets.
- Regression: local regression rejects a missing MCP declaration, then test required declaration, exact endpoint/map, malformed JSON, extra auth/header/server and four-file deterministic ZIP.
- Compare corrected ZIP to published export: same metadata except version and required declaration; exact logo bytes; no credentials or unrelated files.
- Run repo validation, all tests, skill-copy check, syntax and whitespace checks. No separate typecheck/linter exists.
- Reupload corrected package as a draft and inspect actual portal findings, without Submit/Publish or reconnecting OAuth. This is a reversible correction of the user's failed upload, not publication. If browser automation cannot set a file input safely, provide the tested ZIP and ask the owner to reupload.

Sources: user's portal error (2026-10-13), OpenAI submission documentation https://developers.openai.com/plugins/deploy/submission (Codex MCP declaration and root `.mcp.json` example, checked 2026-10-13).

## Executed verification

The authenticated portal confirmed the existing root URL, Authorized authentication and verified domain. The corrected archive restores the declaration without OAuth overrides. All 36 repository tests, package/catalog validation, skill-copy, syntax and whitespace checks passed. Independent review verified the four paths, exact MCP map, preserved listing metadata and identical logos. ZIP SHA-256: `0c588da4589a1ff51f633a27f435f4f8b23332e3e01b6b96b78ea54e91b4b1be`.

Draft reupload was not performed: the Liquid browser bridge rejected `DOM.setFileInputFiles` as an unsupported command. The corrected ZIP is provided to the owner; the old MCP-removal finding must be confirmed absent after reupload. No submission, publication, reconnect or OAuth change was performed.
