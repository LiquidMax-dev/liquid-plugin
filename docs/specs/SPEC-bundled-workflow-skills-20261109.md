# Bundled Co-Invest workflow skills

Status: implemented, 2026-11-09 (QA needed: a local Cursor install that loads
all seven skills and a trigger check per skill).
Spec ID: SPEC-bundled-workflow-skills-20261109.
Request: Slack, 2026-11-09: "add skills that come pre-packaged with installing
co-invest? Study AWS".

## TLDR

Installing the Cursor plugin `plugins/co-invest` now brings seven skills
instead of one: the existing `coinvest` connection and safety skill plus six
narrow workflow skills. The pattern follows Agent Plugins for AWS.

## What AWS does

Read 2026-11-09: `awslabs/agent-plugins` README and
`docs/DESIGN_GUIDELINES.md`, and `plugins/deploy-on-aws/skills/deploy/SKILL.md`.

- A plugin bundles MCP server configuration with several skills, each one
  workflow (for example aws-serverless ships four).
- A skill's description says what it does and when to use it, with trigger
  phrases, in at most 1024 characters.
- `SKILL.md` stays short: numbered workflow steps, explicit defaults with the
  phrases that override them, and the failure handling for each MCP
  dependency (tell the user; do not continue silently).
- Detail goes in `references/`; no backstory or filler.

## Change

- Six root skills, each self-contained so it works when installed alone with
  `npx skills add ... --skill <name>`:

  | Skill | Workflow | Writes |
  | --- | --- | --- |
  | `coinvest-research` | Asset analysis, batches, positioning, technicals, charts, news, picks | None |
  | `coinvest-portfolio-review` | Portfolio, open orders, position history | None |
  | `coinvest-allocate` | `plan_portfolio` via the host's native question UI, then one batch only on an explicit yes | Batch order on request |
  | `coinvest-trade` | Pre-trade checklist, orders, TP/SL, closes, cancels, leverage | Perp writes |
  | `coinvest-paper-trading` | Paper status, enable, disable, reset | Paper mode |
  | `coinvest-automation` | Policy with a user-given per-order notional cap and an agreed expiry | Automation policy |

- `coinvest-allocate` avoids a near-collision with the OpenAI package's
  `coinvest-portfolio-planning`, which targets the Restricted endpoint.
- `coinvest`'s description is narrowed to connection, discovery, and safety
  rules, so it no longer shares every trigger with the workflow skills. It
  gains a "Workflow skills" list. Its rules and references are unchanged.
- `SKILL_SYNC_MAP` maps `co-invest` to all seven. `test/sync-skills.test.mjs`
  checks that every mapped name exists, that the plugin bundles every root
  skill, and that the copies match.
- READMEs and the plugin changelog describe the bundle. The manifest version
  stays 1.0.2 (owner-selected); the plugin is not listed in Cursor's
  marketplace, so only local installs see the change.

## Sources for tool behavior

liquid-mcp `generated/computer-v1.json` (support catalog, 34 tools) and
`generated/computer-v1-full.json` (full catalog), which production
Co-Invest Computer serves (`coinvest-computer` is deprecated as of
2026-10-02). Facts the skills rely on:

- `execute_order` is direct-request. `size` is notional USD. The support
  catalog requires `symbol`, `side`, `size`, and `leverage`; the full catalog
  requires only `symbol` and `side` and adds `quantity`, `reduceOnly`, and
  `idempotencyKey`. The skills defer to the live schema.
- `close_position` closes fully by default; a partial `size` is in coin units.
- `enable_trading` is proposal-only and returns a setup link.
- `plan_portfolio` requires risk tolerance, time horizon, and asset classes
  from the host's native question UI and deploys the full available balance.
- `reset_paper_account` runs only in paper mode and cannot be undone.
- `enable_automated_trading` requires `maxOrderNotional`; `expiresInMinutes`
  defaults to and caps at 10080 (7 days). After it is enabled, in-policy
  orders run without per-order approval, and the server checks each order
  against the policy.
- `upcoming_earnings` and `get_transaction_history` exist only in the full
  catalog; the skills say so.

## Not in scope

- Grok, Muse, and OpenAI packages are unchanged. Grok Bot has no local skills
  directory; the OpenAI package has its own skills for its endpoint.
- A Claude Code manifest (`.claude-plugin/plugin.json` and marketplace), as
  AWS ships, would let Claude Code users install the same bundle. It is left
  for a follow-up because Cursor also reads `.claude-plugin/plugin.json` when
  it loads this plugin (see D2 in
  [cursor-plugin-structure](cursor-plugin-structure.md)).

## Verification

`npm ci --ignore-scripts`, `npm run validate`, `npm test`, and
`node scripts/sync-skills.mjs --check` pass.
