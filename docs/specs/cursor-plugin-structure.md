# Cursor plugin structure

Status: implemented, 2026-09-28, including the D8 amendment (QA needed: the authenticated Cursor leg and a Grok Bot connector check). The advisor review was applied: it
found a missing-copy blocker, unconditional Agent Plugins MCP validation,
Cursor's MCP merge model, symlink and metadata-equality checks, the verbatim
README snippet, a runnable external-validator procedure and the sync
interface.
Spec ID: SPEC-cursor-plugin-structure-20260928.
Tracker: [LIQ-5114](https://linear.app/liquidmax/issue/LIQ-5114).
Reference: https://cursor.com/docs/reference/plugins (read in full 2026-09-28),
`cursor/plugin-template` `4621607`, `cursor/plugins` `adf3218`,
Agent Plugins 1.0.0 (https://agent-plugins.org).

## TLDR

Rebuild the Cursor plugin `plugins/co-invest` to the documented Cursor Plugin
layout. It keeps its `.cursor-plugin/plugin.json`, and it gains three things:

- the `coinvest` skill under `skills/`;
- an Agent Plugins root `plugin.json`, whose `mcp.json` both formats share;
- a `CHANGELOG.md`.

Its MCP server moves from Main to Computer
(`https://coinvest-computer.liquid.trade/mcp`), so the bundled skill and the
server agree. A dependency-light validator checks the repository against
Cursor's and Agent Plugins' published schemas plus the checks in Cursor's
submission checklist. It runs locally and in CI.

**Amended 2026-09-28 (D8):** the Grok plugin `co-invest-grok` moves from
Restricted (`coinvest-chat`, links only) to liquid-mcp Main with the `all`
profile, `https://coinvest.liquid.trade/mcp?profile=all`: text-only results,
with trades placed after an explicit approval in chat. It goes to 2.0.0.

## Problem

- The Cursor plugin ships only an MCP server. The documented structure bundles
  skills with it. Our `coinvest` skill lives only at the repo root, so Cursor
  users who install the plugin don't get it.
- The plugin connects Main (`coinvest.liquid.trade/mcp`, widget confirmation
  cards). The skill tells every host to default to Computer and not to use Main
  just because it is installed. Bundling the skill unchanged would contradict
  the plugin's own server.
- Nothing validates the repo. The liquid-mcp generator that used to render it
  has failed on every run since `797fdfa` (Sep 15). The user's Sep 22 decision
  is "for now: sync manually". Hand edits by several admins go unchecked, and
  the Cursor submission checklist (valid manifests, frontmatter, relative
  paths, unique names) is not enforced anywhere.
- The Agent Plugins open format, which Cursor also loads, is absent.

## Decisions

- **D1, endpoint (user, 2026-09-28: "let's use computer profile").** The
  plugin's server is Computer at `https://coinvest-computer.liquid.trade/mcp`.
  liquid-mcp's `computer-v1` profile is not an alternative today:
  - it is not enabled on Main: live `/health` at 2026-09-28 lists only `all`
    and `interactive-v1`, and `src/catalog/unified.ts` throws
    `COMPUTER_PROFILE_GAP` for it;
  - its design (liquid-mcp `docs/specs/computer-v1-profile-20260925.md`) takes
    over this same hostname at cutover.

  So this URL is the Computer profile's address before and after
  consolidation. The server key stays `Co-Invest`. The URL change already
  forces a fresh OAuth, and a longer key could push Cursor tool names
  (`mcp_plugin-co-invest-<key>_<tool>`) past the 64-character cap. That cap
  comes from the Sep 15 research on the 3.20.10 bundle and was not re-found in
  3.22.7.
- **D2, open format (user, 2026-09-28: "Yes, add root plugin.json").** Add an
  Agent Plugins 1.0.0 root manifest. Cursor 3.22.7 walks the manifests in the
  order `.cursor-plugin/plugin.json`, `.claude-plugin/plugin.json`,
  `plugin.json` (cursor-agent-host constant `D`).
  - The local loader (`Nu`) takes the first manifest that has components or
    metadata, and merges identity-only ones.
  - Marketplace loads (`Fu`) take the first manifest that parses.

  Either way, the Cursor manifest, with `minClientVersions` and the logo, wins
  in Cursor.
- **D3, one shared `mcp.json`.** The file uses the Agent Plugins schema
  (`$schema` plus `"type": "streamable-http"`). Cursor never reads `type`.
  Its plugin `mcp.json` zod object is non-strict and has no `type` key, so it
  strips `type` and `$schema`. The mapping then turns a `url` into
  `streamableHttp` and a `command` into `stdio` (cursor-agent-host `Ne()`).
  The Cursor manifest drops `"mcpServers": "./mcp.json"` and relies on default
  discovery, as the docs direct. Cursor merges every MCP source it finds:
  - `.mcp.json`, then `mcp.json`, with the first definition of a server key
    winning;
  - then the manifest's `mcpServers`, which overrides per key.

  This plugin ships only `mcp.json`. Agent Plugins' `streamable-http` entry
  forbids extra keys, so Cursor's static OAuth `auth` block can't be used.
  Computer serves dynamic client registration metadata, so none is needed.
- **D4, skill placement.** The root `skills/coinvest/` stays canonical:
  - `npx skills add LiquidMax-dev/liquid-plugin --skill coinvest` and skills.sh
    discover it there;
  - the skills CLI scans the `skills/` container and recurses only when it
    finds nothing.

  `plugins/co-invest/skills/coinvest/` is a byte-identical copy written by
  `npm run sync:skills`. The validator fails when the copy is missing or has
  drifted.

  Symlinks are not used, and the validator rejects them for three reasons:
  - GitHub serves a symlink as its target path;
  - Cursor's reader throws `Refusing to read symlink`;
  - the Agent Plugins spec forbids them for escaping the package.

  The skill text doesn't change, because its Computer default now matches the
  plugin. Cursor discovers the immediate children of `skills/` that contain a
  `SKILL.md`, taking each skill's name from its frontmatter.
- **D5, version.** `co-invest` goes from 1.0.0 to 2.0.0: new server, new tool
  set and a fresh sign-in. It was never listed in Cursor's marketplace
  (`listed.cursor: false` in liquid-mcp `plugin/config.json`), so only local
  installs are affected.
- **D6, scope.** **Superseded 2026-09-28 by D8.** `co-invest-grok` now
  changes too, and the root README's Grok row is corrected. The original text
  follows. `co-invest-grok` files stay unchanged, and the validator must
  pass on them as they are. The root README's Grok row, a Sep 15 admin edit,
  names Computer while that plugin's `mcp.json` connects `coinvest-chat`. That
  mismatch is out of scope and is reported, not fixed.
- **D8, Grok endpoint (user, 2026-09-28: "imo: we should use liquid-mcp url
  with profile 'all'").** `co-invest-grok` connects to
  `https://coinvest.liquid.trade/mcp?profile=all`.
  - Main `/health` at 2026-09-28 reports `"profile":"all"`, profiles `all`
    and `interactive-v1`, and `"tradingMode":"enabled"`.
  - The Grok Bot template already uses this exact URL in production (v20;
    Grok PR3). The user confirmed that trading works there.
  - liquid-mcp's `all` contract (`generated/all.json` at `main` `baee1359`,
    54 tools, contract hash
    `8461b1951210cfee9229d470e3abd02cf6600521abaebecd654fc1fda5b9d31a`, equal
    to live `/health` at 18:51 UTC) strips widgets for every client. Its
    approval classes are:
    - `confirmed-argument` (9), which run only with `confirmed=true` after
      the user approves the exact previewed action in chat:
      `execute_order`, `execute_orders_batch`, `execute_tpsl`,
      `close_position`, `close_positions_batch`, `update_leverage`,
      `execute_prediction_order`, `close_prediction_position` and
      `cancel_prediction_order`.
    - `direct-request` (9), which run when the user asks: `cancel_order`,
      `enable_paper_trading`, `disable_paper_trading`,
      `reset_paper_account`, `edit_watchlist`, `generate_deposit_address`,
      `create_onramp_session`, `enable_automated_trading` and
      `disable_automated_trading`.
    - `proposal-only` (7), which return previews, text or links only:
      `suggest_order`, `suggest_trade`, `suggest_trades_batch`,
      `modify_position`, `market_picks`, `show_deposit` and `enable_trading`.
    - `none` (29): reads.
  - Paper orders use the same preview, chat approval and executor path as
    live orders, with the paper execution mode. `suggest_order` only prepares
    a paper review link. Paper mode is keyed by wallet on Liquid's shared
    paper simulator, so toggling it here applies to other Liquid MCP
    connectors too. The Liquid web app is unaffected.
  - The automation tools only save, read or clear a policy record. They
    don't place orders, and a saved policy never authorizes a chat trade.
  - The query is safe:
    - `?profile=` takes precedence over liquid-mcp's client-id and
      client-name maps (`src/profiles/selection.ts`).
    - A session binds its profile, so a later request that drops the query
      still runs under `all`.
    - Main's default profile for a Grok client is also `all`.
    - The OAuth challenge advertises the resource without the query, and
      Liquid's authorization server doesn't reject a resource that carries it.
    - Grok Build's listed `getsentry/plugin-grok` uses `"type": "http"` with a
      query-string URL.
  - Grok Build would re-pin a future catalog listing only when the
    `plugin.json` version changes, so both Grok manifests go from 1.0.0 to
    2.0.0. The plugin is not in `xai-org/plugin-marketplace` yet.
  - Grok Bot install uses its "Add MCP Server" JSON dialog with the plugin's
    `mcp.json` block. Adding a connector by chat with a query-string URL is
    unverified. Users of 1.0.0 remove the old "Co-Invest" connector
    (`coinvest-chat`) first; the new host needs a fresh sign-in.
  - The server key stays `Co-Invest`.
  - The plugin doesn't bundle the skill (Grok Bot has no local skills
    directory). The skill's "Main only when explicitly selected" rule is met,
    because installing this plugin is that explicit selection.
- **D7, no new components.** No rules, agents, commands, hooks or variables
  are added: none has content that the skill doesn't already carry. OAuth
  needs no variables. The validator still checks those component types if
  they appear later.

## Architecture

```text
liquid-plugin/
├── .cursor-plugin/marketplace.json      # both entry descriptions updated
├── .github/workflows/validate-plugins.yml
├── .gitignore                           # node_modules/
├── package.json / package-lock.json     # private; ajv, ajv-formats, yaml (dev only)
├── docs/specs/cursor-plugin-structure.md
├── schemas/                             # vendored, pinned
│   ├── README.md                        # source URL, upstream pin, sha256 per file
│   ├── cursor/{plugin,marketplace}.schema.json
│   └── agent-plugins/{plugin,mcp}.schema.json
├── scripts/validate-plugins.mjs
├── scripts/sync-skills.mjs
├── skills/coinvest/                     # canonical skill (unchanged)
├── plugins/co-invest/
│   ├── .cursor-plugin/plugin.json       # Cursor manifest, 2.0.0
│   ├── plugin.json                      # Agent Plugins manifest, 2.0.0
│   ├── mcp.json                         # Agent Plugins schema, Computer URL
│   ├── skills/coinvest/                 # generated copy of skills/coinvest
│   ├── assets/logo.svg  LICENSE
│   ├── CHANGELOG.md
│   └── README.md                        # rewritten for Computer
└── plugins/co-invest-grok/              # D8: all profile, 2.0.0, CHANGELOG.md added
```

## Data models

`plugins/co-invest/.cursor-plugin/plugin.json`: the current file with these
changes:

- `version` becomes `2.0.0`;
- `description` becomes the text below;
- the `mcpServers` key is removed.

Key order and every other field stay as they are.

> Research markets, review your Liquid portfolio, and place trades you authorize without leaving Cursor.

`plugins/co-invest/plugin.json`:

```json
{
  "$schema": "https://agent-plugins.org/schemas/1.0.0/plugin.schema.json",
  "name": "co-invest",
  "version": "2.0.0",
  "description": "Research markets, review your Liquid portfolio, and place trades you authorize without leaving Cursor.",
  "author": { "name": "Liquid", "url": "https://liquid.trade" },
  "homepage": "https://liquid.trade/coinvest",
  "repository": "https://github.com/LiquidMax-dev/liquid-plugin",
  "license": "MIT",
  "keywords": ["liquid", "Co-Invest", "trading", "portfolio", "markets", "perpetuals", "prediction markets", "mcp"]
}
```

`plugins/co-invest/mcp.json`:

```json
{
  "$schema": "https://agent-plugins.org/schemas/1.0.0/mcp.schema.json",
  "mcpServers": {
    "Co-Invest": {
      "type": "streamable-http",
      "url": "https://coinvest-computer.liquid.trade/mcp"
    }
  }
}
```

In the `.cursor-plugin/marketplace.json` `co-invest` entry, `description`
becomes the same text as the manifests. Everything else in that file stays.

**D8 Grok data models.**

- `plugins/co-invest-grok/mcp.json` and `.mcp.json` must stay byte-identical.
  Each keeps its current shape: `mcpServers.Co-Invest` with `"type": "http"`
  (Grok Build and Claude-style clients read `type`) and `"url":
  "https://coinvest.liquid.trade/mcp?profile=all"`.
- In `.cursor-plugin/plugin.json` and `.grok-plugin/plugin.json`, only
  `version` (`2.0.0`) and `description` change. Key order and all other
  fields stay.
- The marketplace `co-invest-grok` entry `description` changes to the same
  text:

> Research markets, review your Liquid portfolio, and place trades you approve in chat from Grok.

## Validator contract (`npm run validate`)

`node scripts/validate-plugins.mjs [repoRoot]`. It prints one `ERROR: <path>:
<reason>` line per failure and exits 1 on any failure. It prints `OK: <n>
plugins, <m> skills` and exits 0 when clean. It checks:

1. The marketplace is valid against `schemas/cursor/marketplace.schema.json`.
   Plugin names are unique. Each `source` is relative, contains no `..`,
   exists, and contains `.cursor-plugin/plugin.json` whose `name` equals the
   entry name.
2. Each `.cursor-plugin/plugin.json` is valid against
   `schemas/cursor/plugin.schema.json` (draft-07, `ajv-formats`). Every
   manifest path (`logo`, `mcpServers`, `skills`, `rules`, `agents`,
   `commands`, `hooks`) is relative, has no `..`, and exists. Absolute
   `http(s)` logo URLs are allowed.
3. Every MCP source a plugin has is read and parsed, matching Cursor's merge:
   `.mcp.json`, `mcp.json`, and the manifest's `mcpServers` (a path, an inline
   object, or an array of either).
   - A server key defined in more than one source with different content is
     an error. Identical duplicates pass, as in `co-invest-grok`.
   - Each server has a `url` or a `command`, and remote URLs use `https`.
   - Every `${VAR}` other than `CURSOR_PLUGIN_ROOT`, `CLAUDE_PLUGIN_ROOT` and
     `env:*` must be declared in the manifest's `variables.properties`.
4. When a root `plugin.json` exists:
   - it is valid against `schemas/agent-plugins/plugin.schema.json`
     (draft 2020-12, `ajv/dist/2020`);
   - that plugin's `mcp.json`, if present, is valid against
     `schemas/agent-plugins/mcp.schema.json` unconditionally, so `$schema` is
     required;
   - that plugin has no `.mcp.json`, because Agent Plugins doesn't define it
     and Cursor would merge it;
   - `name`, `version`, `description`, `homepage`, `repository`, `license` and
     `keywords` equal the Cursor manifest's.

   Every plugin's marketplace entry `description`, if set, must equal its
   Cursor manifest `description`.
5. Every `skills/<dir>/SKILL.md`, at the repo root and in each plugin, has YAML
   frontmatter:
   - `name` equals `<dir>` and matches `^[a-z0-9]+(-[a-z0-9]+)*$`, at most 64
     characters;
   - `description` is a non-empty string of at most 1024 characters.

   Rules need a `description`. Agents and commands need a `name` and a
   `description`.
6. Every entry in `SKILL_SYNC_MAP` (`{ "co-invest": ["coinvest"] }`) has
   `plugins/<plugin>/skills/<name>/` present. Its relative file list and bytes
   equal those of `skills/<name>/`. A missing copy, a missing or extra file, or
   a byte difference is an error that names the path and tells the reader to
   run `npm run sync:skills`.
7. No symlink exists anywhere under `plugins/**` or `skills/**` (checked with
   `lstat`).
8. When a `CHANGELOG.md` exists in a plugin, it has a `## <version>` heading
   for the Cursor manifest's version.
9. (D8) When a plugin has `.grok-plugin/plugin.json`, it parses as an object,
   and its `name`, `version` and `description` equal the Cursor manifest's.
   When a plugin has both `.mcp.json` and `mcp.json`, the two files are
   byte-identical.

`scripts/sync-skills.mjs` has this interface, and L2 codes against it:

```js
export const SKILL_SYNC_MAP = Object.freeze({ "co-invest": ["coinvest"] });
// Resolves to [] when all copies match. Otherwise resolves to entries such as
// { path: "plugins/co-invest/skills/coinvest/SKILL.md", reason: "differs" }.
// reason is one of "missing copy", "missing file", "extra file", "differs",
// "symlink". path is repo-relative with forward slashes. Never writes.
export async function diffSkillCopies(repoRoot, map = SKILL_SYNC_MAP) {}
// Replaces each target dir with a fresh byte copy of skills/<name>/.
export async function syncSkillCopies(repoRoot, map = SKILL_SYNC_MAP) {}
```

- `node scripts/sync-skills.mjs` (`npm run sync:skills`) calls
  `syncSkillCopies`.
- `node scripts/sync-skills.mjs --check` prints the diff and exits 1 on drift.
- The CLI runs only when the file is executed directly, so importing it has no
  side effects.

`schemas/README.md` records each file's source URL, the upstream commit or
date, and its sha256.

## CI

`.github/workflows/validate-plugins.yml` runs on `pull_request`, on `push`
to `main` and on `workflow_dispatch`, with `permissions: contents: read`. The
job uses `actions/checkout@v4` and `actions/setup-node@v4` with Node 22, then
runs `npm ci --ignore-scripts`, `npm run validate` and
`node scripts/sync-skills.mjs --check`.

`package.json` has `"private": true`, `"type": "module"`,
`"engines": { "node": ">=20" }` and these scripts:

- `validate`: `node scripts/validate-plugins.mjs`;
- `sync:skills`: `node scripts/sync-skills.mjs`.

## Docs

- `plugins/co-invest/README.md` is rewritten for Computer. It keeps the
  existing section order and the Links, License and trademark sections as they
  are.
  - Intro: direct, text-only trading with no widgets, plus the bundled skill.
  - Install: the Cursor marketplace listing doesn't exist yet.
    - For a local install, copy `plugins/co-invest` to
      `~/.cursor/plugins/local/co-invest` and restart Cursor.
    - Alternatively, add this Cursor-format snippet verbatim to
      `~/.cursor/mcp.json`. It has no `$schema` and no `type`, and that route
      skips the skill:
      `{"mcpServers":{"Co-Invest":{"url":"https://coinvest-computer.liquid.trade/mcp"}}}`,
      pretty-printed.
    - Warn that users who installed the plugin should not also run
      `npx skills add ... -a cursor`, because Cursor would load two skills
      named `coinvest`.
  - "What's included": the MCP server and the `coinvest` skill.
  - Sign-in: Liquid OAuth, scopes `read` and `trade`.
  - How trading works: direct executors run when called, and the skill
    requires an explicit request with asset, side and size; paper mode;
    automation bounds.
  - Capabilities: grouped from `skills/coinvest/references/tools.md`, with a
    link to it and no fixed tool count.
  - Network and data: configuration plus a markdown skill, no local code,
    hooks or scripts; requests go to the Computer URL.
- `plugins/co-invest/CHANGELOG.md` gets a `## 2.0.0` entry covering the
  server move, the bundled skill, the open-format manifest and re-auth, and a
  `## 1.0.0` entry for the initial release.
- Root `README.md`:
  - The Cursor row moves to the Computer endpoint, with the trading column
    reading "Direct trades you authorize in chat".
  - The intro sentence about the Cursor plugin's trade confirmations changes
    to match.
  - Add a "Repository layout" section: the tree above, the two manifest
    formats, and the skill copy rule.
  - "How this repository is maintained" says that changes are made by hand
    here and checked by `npm run validate` in CI. It also says that liquid-mcp's
    `generate-plugin.mjs --out` doesn't know this layout and must not be run
    against this repository, because it deletes `skills/` and `docs/`.
  - The skill-install block stays unchanged. The table shows full MCP URLs
    for both rows:
    - Cursor: `https://coinvest-computer.liquid.trade/mcp`;
    - Grok: `https://coinvest.liquid.trade/mcp?profile=all`, with the
      trading column reading "Trades you approve in chat".
  - The Grok intro sentence says the plugin connects liquid-mcp's `all`
    profile: text results, with an order placed only after you approve its
    exact terms in chat.
- `plugins/co-invest-grok/README.md` is rewritten for the `all` profile. It
  keeps the section order and the Risk, Links, License and trademark text.
  - Intro: connects Grok to liquid-mcp's `all` profile; text results; orders
    are placed only after you approve their exact terms in chat. The old
    "prefilled Liquid review link" and "does not place live orders from chat"
    sentences go.
  - No widget wording anywhere: no card, widget, render, dashboard, pie chart
    or "Place-All basket". `show_*`, `show_deposit` and `enable_trading`
    return text, structured data or links.
  - Grok Bot install: open "Add MCP Server" and paste the MCP configuration
    block; sign in when prompted. If you added the 1.0.0 connector
    (`coinvest-chat`), remove it first.
  - Grok Build install text stays, with the MCP snippet updated.
  - "How trading works" follows D8's approval classes and the confirmation
    rules in `ALL_PROFILE_INSTRUCTIONS`: preview, exact terms, explicit chat
    approval for that unchanged action, then execution; changed terms need a
    fresh approval; reconcile before retrying. Cancelling a regular order is
    a direct request; cancelling a prediction order needs approval.
  - Paper: same preview and approval flow with the paper execution mode;
    `suggest_order` can instead prepare a paper-only review link confirmed in
    Liquid; keyed by wallet on Liquid's shared simulator, so it also applies
    to other Liquid MCP connectors; the web app is unaffected.
  - Capabilities are grouped from the D8 catalog (Research, Account, Trading,
    Prediction markets, Paper, Funding, Automation policy, Sharing), with tool
    names as examples and no fixed count. Automation tools only save a policy,
    don't place orders, and never authorize a chat trade.
  - "Network and data" names the new URL.
- `plugins/co-invest-grok/CHANGELOG.md` is new, with `## 2.0.0` (endpoint
  move, trading in chat, re-auth and removing the old connector, and "a future
  Grok Build catalog re-pin requires a version change") and `## 1.0.0`
  (initial release, links only).

## Phases

1. Spec, advisor review and corrections.
2. Five parallel implementation lanes. File sets are disjoint:
   - L1: the `co-invest` manifests, `mcp.json`, `CHANGELOG.md` and the
     marketplace entry;
   - L2: `package.json`, the lockfile, `scripts/validate-plugins.mjs`,
     `schemas/**` and `.gitignore`;
   - L3: `scripts/sync-skills.mjs` and the generated skill copy;
   - L4: the CI workflow and the root `README.md`;
   - L5: `plugins/co-invest/README.md`.
3. Integration, validator mutation checks, external validators and adversarial
   review.
4. Real Cursor load e2e and the PR. A human merges.
5. D8 lanes, file sets disjoint:
   - G1: both Grok manifests, `mcp.json`, `.mcp.json`, the new
     `CHANGELOG.md` and the marketplace `co-invest-grok` entry;
   - G2: `plugins/co-invest-grok/README.md`;
   - G3: root `README.md`;
   - G4: validator rule 9 in `scripts/validate-plugins.mjs`;
   - G5 (after G1 to G4): gates, mutations and adversarial review.

## Risks

- A second manifest at the plugin root could shadow Cursor fields in a future
  Cursor build. The e2e checks which version and logo Cursor reports.
- The skill copy drifts after a hand edit of the root skill. The validator and
  CI fail with the sync command.
- Computer changes its hostname at the computer-v1 cutover. The URL is the one
  that design keeps.
- Any existing local install of 1.0.0 loses its Main session and needs a new
  OAuth sign-in.
- A liquid-mcp `--out` render would revert all of this. That is documented in
  the README. The sync stays off by the user's Sep 22 decision.
- `minClientVersions.cursor` stays at `3.13.0` on purpose. Only 3.22.7 is
  tested with the `$schema`-bearing `mcp.json` and the missing manifest
  `mcpServers`, and older builds' zod strictness is unknown. There is no
  number for 3.13 to 3.22, so this is a known gap, not a claim.
- Out of scope, server side: Computer returns 404 for
  `/.well-known/oauth-protected-resource/mcp`. Its `WWW-Authenticate` header
  points to the root form, so Cursor is unaffected.

## Analytics

The plugin has no runtime, so it emits no events. Adoption and use are read
from Computer's existing per-client MCP tool-call logs (Cursor's client name)
and its OAuth client registrations. No new instrumentation is claimed.

## Verification

1. `npm ci && npm run validate` is green on the final tree. The validator is
   also run against a `git archive` of `origin/main` `ab25efa`. It must be red
   there with "missing copy" for `plugins/co-invest/skills/coinvest`.
2. Mutation checks run on scratch copies and never on the worktree. Each must
   fail with the expected message:
   - one byte changed in the plugin skill copy;
   - the plugin skill copy deleted;
   - a symlink in the skill copy;
   - uppercase plugin `name`;
   - `logo: "../x.svg"`;
   - `"type": "http"` in the Agent Plugins `mcp.json`;
   - `$schema` removed from `mcp.json`;
   - a `.mcp.json` added beside a root `plugin.json`;
   - a conflicting server key across `.mcp.json` and `mcp.json` in the Grok
     plugin;
   - a version mismatch between the two manifests;
   - a description mismatch in the marketplace;
   - a marketplace name that differs from the manifest;
   - a skill `name` that differs from its directory;
   - an undeclared `${TOKEN}` in `mcp.json`;
   - a missing CHANGELOG heading.
3. External validators run on a scratch copy of the tree:
   - Cursor's own `cursor/plugins` `scripts/validate-plugins.mjs` plus its
     `schemas/{marketplace,plugin}.schema.json`, placed at the copy's
     `scripts/` and `schemas/` (it resolves the root as `..` of its own
     directory), with `ajv` and `ajv-formats` installed there. It must pass.
   - `cursor/plugin-template` `scripts/validate-template.mjs`, run with the
     repo root as the working directory. It must pass or have every finding
     explained; missing `hooks/hooks.json` warnings are expected.
4. Skills CLI discovery: `DISABLE_TELEMETRY=1 npx skills add <worktree> --list`
   finds exactly one `coinvest`, from the root `skills/`.
5. Real Cursor 3.22.7 e2e:
   1. Back up `~/.cursor/plugins/local/co-invest`, install the new
      `plugins/co-invest` in its place, and launch Cursor.
   2. The "Cursor Plugins" log shows `loadUserLocalPlugin co-invest loaded`,
      and contains neither `declares an unrecognized $schema` nor a
      `$schema ... disagrees` warning.
   3. Cursor reports version 2.0.0, which proves the Cursor manifest won.
   4. MCP server `plugin-co-invest-Co-Invest` targets the Computer URL and
      reaches OAuth `needsAuth`.
   5. Exactly one `coinvest` skill is listed for the plugin.
   6. Screenshot the plugin detail view by window id.
   7. With the user's OAuth sign-in, one read-only prompt ("show my Liquid
      portfolio") returns a Computer tool result. No order is placed.
   8. Quit the Cursor instance that was started, and restore the backup.

   Without the sign-in, the authenticated path is reported as QA needed.
6. `git diff --stat origin/main` contains only the files in Architecture and
   this spec. `skills/**` is untouched.
7. D8, Grok:
   - `npm run validate` is green. The Grok `.mcp.json` and `mcp.json` are
     byte-identical.
   - New mutations fail with the expected rule-9 message: the
     `.grok-plugin` version changed, its description changed, and one
     whitespace byte added to the Grok `.mcp.json`.
   - The Grok README, snippet, manifests and changelog name
     `https://coinvest.liquid.trade/mcp?profile=all`. No `coinvest-chat`
     remains in `plugins/co-invest-grok/**` or the root `README.md` outside
     CHANGELOG history and the "remove the old connector" note. The skill's
     Restricted row in `skills/**` is legitimate and untouched.
   - No widget, card, render, dashboard, pie chart or basket wording remains
     in the Grok README.
   - The live `/health` still lists `all` with trading enabled, and its
     `contractHash` equals the hash in D8.
   - A local plugin-load e2e is impossible: Grok Bot has no local plugin
     directory and there is no Grok Build CLI on this machine. The endpoint's
     production use by the Grok Bot template is the runtime evidence. A Grok
     Bot check by the user is QA needed: add the connector through "Add MCP
     Server", confirm the saved URL keeps `?profile=all`, and run one
     read-only prompt.

## Verification record (2026-09-28 18:34 UTC)

1. **Clean install.** On `npm ci --ignore-scripts`, `npm run validate`
   printed `OK: 2 plugins, 2 skills` (exit 0), and
   `node scripts/sync-skills.mjs --check` exited 0. Against `origin/main`
   `ab25efa`, the only error was `plugins/co-invest/skills/coinvest: missing
   copy`.
2. **Mutation checks.** All 15 mutations fail with the expected line.
   Adversarial review added these cases:
   - glob manifest paths: `rules/*.mdc` passes and `nope/*.mdc` fails;
   - a malformed manifest reports once;
   - backslash paths are rejected;
   - `sync-skills` now rejects unsafe map entries (`..`, `../x`, `a/b`)
     before any I/O.
3. **External validators.**
   - Cursor's `cursor/plugins` `validate-plugins.mjs` (`adf3218`) passes.
   - `cursor/plugin-template` `validate-template.mjs` passes, with the
     expected "no hooks/hooks.json" warnings only.
   - Freshly downloaded Agent Plugins schemas validate `plugin.json` and
     `mcp.json`.
   - `npx skills-ref validate` reports the skill as valid.

   Agent Plugins publishes no official validator CLI.
4. **Skills CLI.** `skills add <tree> --list` (telemetry off, isolated HOME)
   found one skill, `coinvest`. With `--full-depth` it also found one.
5. **Cursor 3.22.7 local e2e**, run without typing into Cursor.
   - `loadUserLocalPlugin co-invest loaded` appears, with no `$schema`
     warnings.
   - `connecting streamableHttp for "Co-Invest" (plugin-co-invest-Co-Invest)`
     reaches origin `https://coinvest-computer.liquid.trade`.
   - Cursor completed dynamic client registration with Computer's OAuth server
     (redirect `https://www.cursor.com/agents/mcp/oauth/callback`), then logged
     `MCP OAuth needsAuth (v2)`.
   - A/B relaunch: with 1.0.0 installed, `CursorPluginsAgentSkillsService`
     counted skillCount 47 and ruleCount 49. With 2.0.0 it counted 48 and 50,
     so exactly one skill was added.
   - The Customize > Plugins screenshot shows "Co Invest (Local)" with its
     logo.
   - Cursor shows no version in the logs or UI. That the Cursor manifest wins
     rests on the loader code (`D` order, `Nu`) plus the logo, which only the
     Cursor manifest declares.
6. **Pending: QA needed.** The authenticated leg needs the user's Liquid OAuth
   sign-in in Cursor and one read-only prompt returning a Computer tool result.

## D8 verification record (2026-09-28 19:07 UTC)

1. **Gates.** `npm run validate` printed `OK: 2 plugins, 2 skills` (exit 0).
   `sync-skills --check` exited 0. The Grok `mcp.json` and `.mcp.json` are
   byte-identical.
2. **Harness.** `scratchpad/e2e/d8-verify.sh` passed 27 of 27 cases. These
   cover the baseline, the 15 original mutations, the 3 D8 mutations (Grok
   version, Grok description, a trailing byte in `.mcp.json`), 6 content
   checks and live `/health`. `/health` returned `all`, trading `enabled`
   and contract hash `8461b195…d31a`.
3. **Rule 9 edge cases.** Name, version and description mismatches each
   report once. Invalid JSON, `[]` and `null` report once. A directory in
   place of the manifest reports `cannot read file`. Missing `mcp.json`,
   CRLF and a BOM don't crash, and neither does a broken Cursor manifest
   alongside the Grok one.
4. **External validators.** On the final tree, Cursor's `cursor/plugins`
   validator passes. `plugin-template` passes, with only the "no
   hooks/hooks.json" warnings.
5. **Endpoint.** An unauthenticated `initialize` to `?profile=all` returns
   401. Its `WWW-Authenticate` points at the resource metadata without the
   query.
6. **Adversarial review.** It found no P0.
   - P1s, both fixed: the README implied every order is approved in chat,
     though `suggest_order` makes a paper review link; and `cancel_order`
     sat among the approval-gated examples.
   - One P2, fixed: a read error was labelled invalid JSON.
7. **QA needed.** There is no local Grok plugin loader. The Grok Bot check
   (add through "Add MCP Server", keep `?profile=all`, run one read-only
   prompt) is the user's.
