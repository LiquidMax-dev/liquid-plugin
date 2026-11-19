# SPEC-perplexity-plugin-20261116

Status: implemented; changed 2026-11-16 after the first release (see "Changes after first merge"). Gates: validate OK, 48 of 48 tests. Perplexity import of the changed package: 0 warnings, title `co-invest`, one connector, the `coinvest` skill, authorization step reached for resource `https://coinvest-computer.liquid.trade/mcp`. Not done by the agent: tool calls inside Perplexity, the owner's form submission.

## Changes after first merge (owner decisions, 2026-11-16)

These supersede the matching statements below, which describe the first merged version (#16).

- **Endpoint:** Co-Invest Computer, `https://coinvest-computer.liquid.trade/mcp`, replaces the standard endpoint. Reason: Perplexity does not render Co-Invest widgets; Computer returns text.
- **Skill:** the package bundles `skills/coinvest` through `scripts/sync-skills.mjs` (`SKILL_SYNC_MAP`), like the Cursor package. The validator allows exactly the canonical skill's files under `skills/coinvest/`.
- **Name:** `co-invest` (was `co-invest-perplexity`); see the `plugin.json` note below.
- **Description:** expanded; it is the text Perplexity shows under the title. **Corrected 2026-11-19 by SPEC-listing-descriptions-prompts-20261119:** the description, tagline and README no longer say orders are previewed and placed only after approval. Computer runs perpetual orders when called (no `confirmed` argument), so every such statement below is wrong for this package.
- **Publisher line:** Perplexity shows "by LiquidMax-dev", the GitHub organization. `author`, `publisher` and `owner` keys in `plugin.json` do not change it (measured).
- **Form:** the draft and the live form name the Computer endpoint; the live form carries the reviewer test login by the owner's direction.

## TLDR

Add `plugins/co-invest-perplexity`, a connector-only plugin package that Perplexity imports from this public repository, pointing at the standard Co-Invest endpoint `https://coinvest.liquid.trade/mcp`. Add its validator and test, and a filled draft of Perplexity's connector proposal form. The owner submits the form.

## Problem

Perplexity added plugins with remote MCP connectors. Its "Add MCP connector" dialog needs a Pro plan, but "Add custom > Import plugin from GitHub" works on Free and takes a public folder URL. The only folder importable today, `plugins/co-invest`, targets Co-Invest Computer, bundles the Computer skill and describes itself as a Cursor plugin.

Requirement (owner, 2026-11-16): submit a Perplexity connector proposal "similar to Muse", and give the landing pages a Perplexity entry. Owner decisions the same day: one Perplexity folder on the standard endpoint; the proposal names the standard endpoint; Claude fills the form and the owner submits it.

## Measured (2026-11-16, Perplexity Free plan)

- Import of `https://github.com/LiquidMax-dev/liquid-plugin/tree/main/plugins/co-invest` succeeded: root `plugin.json` gave the title (`co-invest`) and description, `mcp.json` gave one connector named Co-Invest, `skills/coinvest` gave one skill. No icon was taken from the package.
- Connect registered an OAuth client and reached the Liquid consent page with redirect `https://www.perplexity.ai/rest/connections/oauth_callback`, scope `read trade`, resource `https://coinvest-computer.liquid.trade/mcp`. Consent was not approved, so tool calls inside Perplexity are unverified.
- Perplexity's help article: connectors come from `mcp.json` (or `.mcp.json`) at the package root, each with an HTTPS address and type `streamable-http`, `http` or `sse`; a plugin needs at least one skill or connector; `plugin.json` needs a `name`.

## Solution

### Slice P1: package, validator, test, README

New folder `plugins/co-invest-perplexity/`:

- `plugin.json`:
  ```json
  {
    "$schema": "https://agent-plugins.org/schemas/1.0.0/plugin.schema.json",
    "name": "co-invest",
    "version": "1.0.2",
    "description": "Co-Invest connects Perplexity to your Liquid account. Research crypto, equities, commodities, indices and prediction markets with live prices, funding, positioning and news. Review your portfolio, open orders and history. Ask for a trade and Co-Invest previews the exact terms first; orders are placed only after you approve them in chat. Includes a paper-trading mode with simulated funds.",
    "author": { "name": "Liquid", "url": "https://liquid.trade" },
    "homepage": "https://liquid.trade/coinvest",
    "repository": "https://github.com/LiquidMax-dev/liquid-plugin",
    "license": "MIT",
    "keywords": ["liquid", "Co-Invest", "trading", "portfolio", "markets", "perpetuals", "prediction markets", "mcp"]
  }
  ```
  `name` is `co-invest` (owner decision, 2026-11-16): Perplexity shows it as the plugin title, accepts only lowercase letters, numbers and hyphens, and ignores `display_name`, `displayName` and `title` keys (measured). `validateMusePackage` discovers every `plugins/*` folder with a root `plugin.json` and rejects a repeated name; this package is exempt from that one check because the Cursor package also uses `co-invest`. The "Agent Plugins packages" count is 3.
- `mcp.json`: one server `"Co-Invest"`, `"type": "streamable-http"`, `"url": "https://coinvest.liquid.trade/mcp"`, with the same `$schema` line as `plugins/co-invest/mcp.json`.
- `LICENSE` and `assets/logo.svg`: byte copies of the `plugins/co-invest-muse` files.
- `CHANGELOG.md`: `## 1.0.2` with one bullet: initial Perplexity package for the standard Co-Invest endpoint; GitHub import path; marketplace proposal drafted, not submitted.
- `README.md`: what it is; install steps (Perplexity > Plugins > Add custom > Import plugin from GitHub > paste `https://github.com/LiquidMax-dev/liquid-plugin/tree/main/plugins/co-invest-perplexity` > open the plugin > Connect > sign in to Liquid); that orders need the user's approval of exact terms in chat; that OAuth grants the normal Liquid `read` and `trade` permission; that no skill is bundled; the import and consent facts verified for this folder on 2026-11-16, and that tool calls inside Perplexity are not yet verified; links as in the Muse README.
- No `skills/`, no `.cursor-plugin/`, no other files.

`scripts/perplexity-package.mjs` exports `PERPLEXITY_ENDPOINT` and `validatePerplexityPackage(repoRoot)` returning `{ errors: string[], packageCount }` where each error is `"<repo-relative path>: <message>"`, the shape `validateMusePackage` returns and `validate-plugins.mjs` splits on `": "`. `scripts/muse-paper-only.mjs` changes only by the duplicate-name exemption above. No secret or path scanning. Checks:

- the folder's file set is exactly `CHANGELOG.md`, `LICENSE`, `README.md`, `assets/logo.svg`, `mcp.json`, `plugin.json`, with no symlinks and no other directories;
- `plugin.json` validates against `schemas/agent-plugins/plugin.schema.json`, `name === "co-invest"`, `version === "1.0.2"`;
- `mcp.json` validates against `schemas/agent-plugins/mcp.schema.json` and `mcpServers` deep-equals `{ "Co-Invest": { "type": "streamable-http", "url": PERPLEXITY_ENDPOINT } }` (so extra servers, headers or another URL fail);
- `CHANGELOG.md` has a `## 1.0.2` heading.

Wire it into `scripts/validate-plugins.mjs` next to the Muse call (same error reporting), and extend the final OK line with `${perplexityResult.packageCount} Perplexity package`.

`test/perplexity-package.test.mjs` (`node:test`): call `validatePerplexityPackage` directly (not the CLI): the real repo validates clean; then, on a temp copy of the repo's `schemas/` and `plugins/co-invest-perplexity/` (absolute temp paths, never mutate the worktree), each of these makes validation fail with a message naming the problem: url with `?profile=all`, url on `coinvest-computer.liquid.trade`, a second server, an added `skills/x/SKILL.md`, `name` changed, `version` changed.

Root `README.md`: add a Plugins table row `| [Co-Invest](plugins/co-invest-perplexity) | Perplexity (GitHub import) | https://coinvest.liquid.trade/mcp | Trades you approve in chat; marketplace proposal drafted, not submitted |`, add the folder to the repository layout tree, and add one sentence to the second intro paragraph stating the Perplexity package exists, how it installs, and what was verified on 2026-11-16. Do not change other packages' text.

### Slice P2: proposal form draft

New `docs/perplexity-submission-form.md`, one `###` per form field in the order listed in the appendix, grouped under the form's section names. Each field has the answer text ready to paste, or the line `OWNER: <what is needed>` when the fact is not in this repository or liquid-mcp. Never invent a fact; never include an email address other than the public `support@liquid.trade` and `customer-support@liquid.trade`.

Sources, in priority order: `docs/muse-submission-form-1.0.2.md`, `plugins/co-invest-muse/submission.md`, `plugins/co-invest-muse/tools.md`, `README.md`, and `/Users/mw/liquid/liquid-mcp` on `origin/main` (read with `git -C /Users/mw/liquid/liquid-mcp show origin/main:<path>`; `README.md`, `src/auth/oauth.ts`, `generated/` contracts) for protocol version, transport, token behaviour and the tool inventory of the default profile. The Muse material describes the paper-only profile; this proposal is for the standard endpoint, so every statement about simulation must be rechecked and rewritten for live trading with in-chat approval. Mark anything taken from Muse material and not rechecked as `UNVERIFIED:`.

Fixed answers:

- Company name: Liquid. Legal entity: LiquidX AI, Inc. Website: https://www.liquid.trade.
- Production MCP endpoint: https://coinvest.liquid.trade/mcp. Authentication: OAuth 2.1; DCR; PKCE S256. Transport: Streamable HTTP. Endpoint model: universal.
- Callback allowlisting: No (DCR accepted `https://www.perplexity.ai/rest/connections/oauth_callback` on 2026-11-16 for the standard endpoint, Verification step 2).
- Scopes: `read`, `trade`. Authorization: per-user.
- MCP implementation documentation link and user-facing setup documentation: https://github.com/LiquidMax-dev/liquid-plugin/tree/main/plugins/co-invest-perplexity.
- Connector display name: Co-Invest. Privacy: https://www.liquid.trade/privacy. Terms: https://www.liquid.trade/termsofservice. Support URL: https://liquid.trade/support. Support contact: support@liquid.trade.
- Data categories: Financial, User profiles.
- Sandbox: the `paper-only` profile at `https://coinvest.liquid.trade/mcp?profile=paper-only` and paper mode on the standard endpoint.
- Short tagline (80 characters maximum, count it): "Research markets and place trades you approve on Liquid".
- OWNER fields: company stage, headquarters country, submitter name, role, work email, active user base, geographic availability, all named contacts, support and incident commitments, security certifications, brand asset folder, the three confirmations.

End the file with a short "Owner review" section stating that the agent fills the form and the owner reviews, completes the OWNER fields and submits.

## Architecture

Static files plus one validator module. No runtime code, no liquid-mcp change. The landing page links to the folder URL on `main` (liquid-landing-page SPEC-coinvest-perplexity-muse-connect), so this PR merges first.

## Analytics

None in this repository. Connector sessions appear in liquid-mcp's existing `mcp.session.initialized` logs by client name.

## Risks

- The standard endpoint with no `profile` is the full profile with live execution. Perplexity Computer is an autonomous agent; the order gate is the server's exact-terms approval in chat, the same gate the Grok package relies on.
- Perplexity may change its manifest rules; the validator pins only what was measured.
- The proposal form holds owner-only facts; the draft marks them and the owner submits.

## Verification

1. `npm run validate`, `node scripts/sync-skills.mjs --check`, `npm test` green; the new test fails for each mutation.
2. After the branch is pushed: import `https://github.com/LiquidMax-dev/liquid-plugin/tree/<branch>/plugins/co-invest-perplexity` in Perplexity; the plugin shows the new description, one connector, no skill; Connect reaches the Liquid consent page with resource `https://coinvest.liquid.trade/mcp`. Stop before approving.
3. Not verified here: tool calls inside Perplexity (needs the owner to approve consent on their account).

## Appendix: form fields in order

Company: Company name; Legal entity name; Company website; Company and product description; Company stage; Headquarters country; Submitter name; Role or title; Work email; Authorized to submit (Yes/No).

Customer value: Primary user segments (Consumer / Small business or team / Enterprise / Developer); Approximate active user base; Top user workflows (up to three: goal, data or action, outcome); Example queries (three to five); Required customer account or plan; Geographic availability.

Remote MCP server: Production MCP endpoint; MCP implementation documentation link; Authentication method; OAuth client registration method; Service status page; Supported transport; MCP protocol version; Endpoint model; Tenant endpoint discovery or URL pattern; Rate limits, timeouts, and retry guidance; Versioning and deprecation policy.

Authentication: Authentication documentation link; Does the Perplexity callback URL need to be allowlisted; Required scopes and rationale; Authorization requirements; Token refresh, revocation, and expiry behavior; Production approval requirements.

Tools and data: Key tools and capabilities (tool, what it does, scope, read or write); Data categories accessed; Data storage, logging, retention, and deletion; Hosting regions and data-residency options; Privacy policy; Security or trust center; Relevant security certifications.

Validation and operations: Sandbox or test environment; Synthetic data and test roles available; Secure test-access method; Known limitations or differences from production; Answer-quality evaluation materials available; Evaluation materials link; Technical owner name and email; OAuth or platform owner name and email; Security or incident contact; Business owner name and email; Production support contact or portal; Support and incident-response commitments.

Catalog listing: Connector display name; Short tagline; Catalog description; Brand asset folder; User-facing setup documentation; Terms of service; Support URL; Listing-use consent; Accuracy confirmation; No-secrets confirmation; Additional context.
