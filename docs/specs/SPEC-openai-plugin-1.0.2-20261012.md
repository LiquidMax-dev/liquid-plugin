# Superseded provisional OpenAI Co-Invest 1.0.2 package

**Superseded 2026-10-13 by [SPEC-openai-live-metadata-20261013](SPEC-openai-live-metadata-20261013.md).** The owner supplied the published ZIP. Its stable name, Codex manifest and two PNG logos replace this spec's provisional identity, portable manifest, SVG and new OAuth declaration. The original record below is preserved as historical context; its six-file archive must not be used for the existing listing update.

Status: partial — local package implemented and verified; publisher access and release comparison pending.

## TLDR

Create a separate OpenAI ZIP for Co-Invest 1.0.2 using the existing Restricted endpoint, `https://coinvest-chat.liquid.trade/mcp`. Keep the Computer, Grok and Muse packages unchanged. The owner authorized the OpenAI update and selected this endpoint. Cloudflare currently prevents publisher login; do not automate or bypass its challenge.

## Problem

OpenAI now accepts plugin ZIP updates. The existing `plugins/co-invest` package connects to Computer and bundles Computer guidance, so it cannot be uploaded for the requested Restricted connection. The published release ZIP is unavailable until publisher login succeeds. Its stable manifest name, retained components and saved OAuth client must be compared before uploading this draft to the existing listing.

## Solution

Add `plugins/co-invest-openai` with a portable manifest, MCP configuration, the approved existing logo, LICENSE, README and changelog. Display name is always Co-Invest; author Liquid; support email support@liquid.trade; version 1.0.2. Use provisional machine name `co-invest`, with the release comparison explicitly required before upload. No new skills are invented or copied from Computer. No listing is created by the build.

Listing copy covers market research, connected portfolio reads, Liquid review links for new trade suggestions, and the existing simulated account/position management tools. Do not call this endpoint read-only, paper-only, or claim it executes live trades. Normal Liquid OAuth permissions are broader than the endpoint restriction. Login is required. The public HTTPS support page is https://www.liquid.trade/support; policy URLs use the existing www.liquid.trade pages.

## Architecture

- Portable root plugin.json with extensions.com.openai.interface and publication.release_notes; no apps, hooks, reviewer secrets, test cases or demo URL overrides. Omission preserves existing saved review data; the dashboard still needs review.
- One streamable-http server named Co-Invest at the exact Restricted URL. OpenAI per-server auth extension declares OAuth DCR and baseScopes read/trade, as advertised by current discovery. Confirm the existing registration before upload; do not change a locked client silently.
- A focused JS validator checks this package alongside current validation. Validate portable metadata using the pinned schemas, then OpenAI's required interface fields, supported category, four HTTPS URLs, submission text limits and square logo/composer icon of at least 48 pixels. The pinned MCP schema predates per-server OpenAI extensions: validate the known auth extension separately, then validate a clone without that one extension. Never relax the shared schema or ignore arbitrary extension keys. Export validateOpenaiPackage(repoRoot) returning {errors, packageCount}; also support a direct CLI check with an optional repo-root argument.
- A Python 3 standard-library builder uses an explicit file allowlist (plugin.json, mcp.json, assets/logo.svg, LICENSE, README.md, CHANGELOG.md), validates first through Node, rejects symbolic links in the package or path ancestry, and writes a deterministic ZIP with fixed metadata and sorted root-relative paths. Reject unexpected package files rather than silently excluding a future component. Require an explicit output path outside the package directory, and fail if it exists. Emit archive SHA-256 and file count, no environment or secrets. Never recursively archive the repo or qa-artifacts.
- Keep OpenAI out of the Cursor marketplace. Public submission notes explain secure reviewer access, comparison, upload and scan workflow. Public docs link to main, and omit account identifiers, credentials, private logs and infrastructure configuration.
- Exclude this exact OpenAI package directory from the Muse validator's generic discovery; the dedicated OpenAI validator owns its client-specific namespace and auth extension. This permits the existing listing name to match the Cursor variant without weakening duplicate-name checks for other portable packages.

## Phases

1. Independent spec review; incorporate concrete concerns.
2. Package files; validator/builder; public submission docs; negative tests; independent review and runtime verification. Assign at least five implementation/verification roles with non-overlapping write scopes.
3. Integrate, run gates, build and inspect the actual ZIP. Commit once after verification and open a PR. No merge or deploy is required for the ZIP.
4. After owner resolves publisher login: download existing release, preserve its identity/components/registration and saved review materials. Verify the existing MCP URL already equals the Restricted URL: OpenAI does not support changing existing MCP URLs in this update flow; a mismatch requires their support. Verify retained review cases still describe this endpoint, run required cases, check walkthrough accessibility and static reviewer login. Upload the matching draft, inspect scans, enter reviewer credentials privately and submit the authorized update. Do not claim this phase complete from local validation.

## Data models and API contracts

No new server data model or runtime change. The package declares one existing HTTPS MCP connection and public presentation metadata. Credentials live only in OpenAI's secure review form. Existing live sessions and contracts remain unchanged.

The server currently reports interactive-v1 / trading-disabled-links-only. Auth discovery advertises read/trade, authorization-code/refresh grants, DCR and S256. Treat endpoint state as a measured snapshot, not a permanent guarantee. A read-only runtime probe checks health, discovery, missing-authorization rejection and, when a suitable existing token is available, initialize/tools/list plus a market read; do not create trades, reset paper state or change the account mode.

## Risks

The existing listing may have a different stable name or additional components. No upload until release comparison resolves that. Local schemas do not prove portal acceptance. Existing review/test materials may require updating after the portal imports the package. The shared test account is not exclusive and no credentials belong in public files. No runtime service configuration changes are in scope.

## Verification

- npm ci, npm run validate and npm test; no independent typecheck or linter exists in this JS/content repository.
- Meaningful negative tests reject a wrong endpoint, embedded headers/client secrets, unexpected package files and symlinked input; a real builder run confirms root layout, exact allowlist and deterministic bytes. Keep fixtures temporary.
- Inspect the actual archive and included text for credentials/private artifacts; verify image dimensions and public URLs.
- Read-only production health, OAuth discovery and unauthenticated MCP rejection. Authenticated MCP reads when existing safe test authorization is available; otherwise record the gap without relabeling unauthenticated checks as e2e.
- Preserve all prior package gates, versions, endpoints and skill copies.
- OpenAI-host installation, scans and submission remain QA needed until publisher access succeeds and those steps actually run.

Sources: [OpenAI package reference](https://developers.openai.com/plugins/build/plugins), [submission](https://developers.openai.com/plugins/deploy/submission), [validation errors](https://developers.openai.com/plugins/deploy/submission-errors), consulted 2026-10-12.

## Verification results — 2026-10-12

- Dependency installation, package validation, skill-copy check and all 27 tests passed. No separate typecheck or lint command is defined; JS/Python syntax checks and git whitespace checks passed.
- Actual deterministic archive inspected: six root-relative allowlisted files, 4,216 bytes, SHA-256 `5cedbe8853fbd39a9b44a6157f5973713c874d6a3ab9fe55dc71384d9c1e95d7`. Existing packages and shared schema files are unchanged.
- Review found and fixed malformed-but-valid JSON bypasses in the new validator; regression coverage rejects invalid manifest/MCP shapes before archive creation. Existing discovery now routes the OpenAI directory to its dedicated validator.
- Production health reported interactive-v1 / trading-disabled-links-only. OAuth discovery advertises DCR, S256 and read/trade. An unauthenticated initialize returned 401.
- Authenticated initialize, tools/list and BTC analyze_market passed: 44 tools, expected suggestion tools present, live order executors absent. No account/trading mutations were tested. The connection was stateless, so cleanup had no retained session to delete.
- Approved logo is unchanged and square at 800 by 800. All four public listing URLs returned HTTP 200.
- OpenAI publisher access remains blocked by a Cloudflare challenge. The current release ZIP, stable identity, bundled components and saved client have not been compared; OpenAI-host installation, scans, reviewer workflow and submission remain QA needed. No new listing or release has been submitted.
