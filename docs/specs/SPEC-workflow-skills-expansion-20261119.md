# SPEC-workflow-skills-expansion-20261119

Status: implemented 2026-11-19. Gates: validate OK, 89 of 89 tests with `LIQUID_MCP_ROOT` (88 plus the optional catalog comparison). Not verified: skill loading or triggering inside any host; any call on the `all`, `interactive-v1`, links-only or paper-only endpoints. Nothing was uploaded or submitted to a store. Extends SPEC-bundled-workflow-skills-20261109 (PR #14), which bundled six Computer-only workflow skills with the Cursor plugin.

## TLDR

One skill set, defined once in root `skills/`, written to work on any Co-Invest connection, and copied automatically into every platform package whose endpoint serves the tools a skill needs: Cursor, Perplexity, Grok, ChatGPT/Codex, Muse and a new Claude plugin. 13 workflow skills plus the existing `coinvest` base skill.

## Problem

Owner, 2026-11-19: "rebase it, improve and merge" (PR #14, the authority for merging this PR); "Port the 6 command skills" (Grok bot into the Grok plugin); "we should have as many skills as we want, so it can be 10/12"; "ensure we include tokenized spots/equities and all the new stuff that was added to mcp"; "skills should be defined in one place and available for all platform plugins".

- PR #14's six skills hard-code Co-Invest Computer ("trade tools execute when called"). On the Grok connection the same tools need a preview and `confirmed=true`, and a saved automation policy authorizes nothing, so those skills would be wrong there.
- No skill covers the tools added since 12 October (`execute_spot_order` #837; `set_trailing_stop`, `view_trailing_stop`, `remove_trailing_stop` #826; `get_asset_profile`, `upcoming_earnings` #791) or prediction orders, Earn, staking and funding.
- Skills live in three unrelated places: root `skills/coinvest`, three OpenAI-only skills, and the Grok bot repository.

## Measured (liquid-mcp `82d1e73a`)

Five catalogs, 69 distinct tool names. Per-tool gate (`approval`, and whether the input schema has `confirmed`) for all five is in the lane input `gates.md`. The differences that matter:

| Tools | `computer-v1-full` | `all`, `paper-only` | `interactive-v1-links-only` |
| --- | --- | --- | --- |
| `execute_order`, `execute_orders_batch`, `execute_tpsl`, `close_position`, `update_leverage` | run when called, no `confirmed` | `confirmed`; `execute_order`, the batch and `execute_tpsl` have no preview mode | absent |
| prediction writes, trailing-stop writes, `close_positions_batch` | `confirmed` | `confirmed` (trailing stops absent on `paper-only`) | absent |
| `execute_spot_order` | absent | `confirmed` (absent on `paper-only`) | absent |
| `suggest_trade`, `suggest_trades_batch`, `suggest_order`, `modify_position`, `market_picks` | proposal only | proposal only | proposal only (review links; no `modify_position`) |
| same five on `interactive-v1` (Claude apps) | n/a | `execute_order`, `execute_orders_batch`, `execute_tpsl`, `close_position` take `confirmed` but are described as INTERNAL, called only by the proposal's confirmation control: the model must never call them (review finding, 2026-11-19) | n/a |
| paper position tools `close_paper_position`, `set_paper_tp_sl`, ... | absent | absent | present |

## Solution

### The gate rule (every skill that can change state)

A skill never uses an endpoint name as the reason for its behavior. It reads the live tool list and schemas:

1. **Tool with a `confirmed` argument.** Preview first: with the proposal tool when the executor's description names one (`suggest_trade`, `suggest_trades_batch`, `modify_position`), otherwise by calling the tool with `confirmed` omitted or false and no execute-phase field. Show the exact returned terms. Call with `confirmed=true` only after the user approves those unchanged terms in chat. A changed term needs a new preview. Copy `executionMode` and other returned executor fields unchanged; send only fields the executor's description lists.
2. **State-changing tool without `confirmed`.** It runs when called. Call it only for an explicit user request in this conversation that names what to change, state the action in one line first, and never call it to preview. Calls its description marks read-only (for example `update_leverage` without a target) are allowed.
3. **Proposal tool.** Called only as the preview of a write the user asked for, or as its description's flow requires. Read-only skills never call one. Where no executor exists, the proposal's review link is the result: the user finishes in Liquid.
4. **Automation.** A saved policy can stand in for the user's request only for a tool under rule 2, and only while `automated_trading_status` shows it active and covering the order. It never supplies `confirmed=true`. Where order tools take `confirmed`, saving a policy only stores data.
5. **Do-not-call tools.** A tool whose description says INTERNAL or do not call directly is called only as that description allows. This is checked before rule 1: an executor described that way is never called even though its schema has `confirmed`; the change happens only when the user confirms the returned proposal with its own control, and a typed yes does not place it.
6. **After any write.** Report the returned status as given. No automatic retry: on an error, timeout or unknown result, reconcile from account, order or balance state, and retry only on a new user request. Reuse one idempotency key for an action and its reconciliation.

### Skills

| Skill | Source | Workflow | Bundled when the endpoint has |
| --- | --- | --- | --- |
| `coinvest` | main; unchanged rules, Computer default | Connection, discovery, safety | Computer endpoint packages only (explicit list) |
| `coinvest-research` | #14 revised, absorbs the bot's `/analyze` | One asset or a comparison; `read_link` | `analyze_market` |
| `coinvest-portfolio-review` | #14 revised, absorbs `/portfolio` | Balances, positions, orders, history, allocation, account | `get_portfolio` |
| `coinvest-allocate` | #14 revised | `plan_portfolio`, one proposed batch, execute or review link | `plan_portfolio` |
| `coinvest-trade` | #14 revised for the gate rule | Perp orders, TP/SL, closes, cancels, leverage; review links where no executor | `suggest_trade` |
| `coinvest-paper-trading` | #14 revised | Paper status, enable, disable, reset; shared by wallet | `paper_trading_status` |
| `coinvest-automation` | #14 revised | Save, read, clear the policy; what it does and does not authorize | `automated_trading_status` |
| `coinvest-market-scan` | new, from `/markets`, `/signal`, `/suggest`, `/leaderboard` | What is moving, signals, ideas, leaderboard, watchlist | `show_market_overview` |
| `coinvest-prediction-markets` | new | Search, order book, positions, orders, buy, close, cancel | `search_prediction_markets` |
| `coinvest-trailing-stops` | new | Set, view, remove | `set_trailing_stop` |
| `coinvest-earnings` | new | Earnings calendar and fundamentals | `upcoming_earnings` |
| `coinvest-yield` | new | Earn vault and HYPE staking | `get_earn_balance` |
| `coinvest-funding` | new | Setup, deposit, on-ramp, payment and referral links | `show_deposit` |
| `coinvest-tokenized-stocks` | new | EQX spot tokens | `execute_spot_order` |

The OpenAI package's three own skills (`coinvest-market-research`, `coinvest-portfolio-planning`, `coinvest-earn-vaults`) are removed in favor of the shared set.

**Coverage:** every tool a package's endpoint serves is named by at least one skill bundled with that package, `help` excepted. Tools without a row of their own: `read_link` in research; `get_account`, `get_transaction_history`, `get_position_history`, `show_portfolio_chart`, `view_open_orders` in portfolio-review; `edit_watchlist`, `leaderboard_data`, `leaderboard_rank`, `market_picks`, `search_markets`, `get_positioning_pulse` in market-scan; `close_positions_batch`, `modify_position`, `suggest_order`, `cancel_order`, `update_leverage`, `enable_trading` and the links-only paper position tools in trade; `suggest_trades_batch`, `execute_orders_batch` in allocate; `_earn_pending_status`, `get_staking` in yield; `refer`, `payment_link`, `generate_deposit_address`, `create_onramp_session` in funding.

### Skill format

- Frontmatter: `name` (equal to the folder), `description` (what it does, then `Triggers on:` with user phrases; 250 to 600 characters; hard limit 1024), `license: MIT`.
- Body, 1,800 to 4,500 characters, sections in this order: a two-sentence opening; `## Workflow` (numbered); `## Tools` (a bullet list, each item starting with the backticked tool name, then what it is for); `## Rules`; `## If something is missing` (no connection: say so and point to the host's Co-Invest connector settings; a tool is absent from the live list: say this connection cannot do it and do not switch endpoints or modes).
- Not allowed: endpoint URLs or host names; "Computer", "Main", "Grok", "Cursor", "ChatGPT" or other host names; tool counts; promises of charts, cards or widgets (report returned data); U+2014; claims the tool descriptions do not make. Units and limits are quoted from the descriptions. Facts to include per skill are in the lane input `facts.md`.
- Trigger phrases must not collide: research owns one named asset ("what is NVDA doing"); earnings owns "what does NVDA do", "who reports"; market-scan owns market-wide phrases ("what's moving", "top setups", "leaderboard"); trade owns perp verbs and "stop loss"; trailing-stops owns "trailing"; prediction-markets owns "bet", "odds", "prediction"; tokenized-stocks owns "tokenized", "spot stock", "EQ" symbols; allocate owns "build/plan a portfolio"; yield owns "earn", "vault", "staking"; funding owns "deposit", "fund my account", "on-ramp", "referral".
- Self-contained: no skill requires another to be installed.

### Bundling: computed, not hand-listed

`scripts/sync-skills.mjs` holds `SKILL_REQUIRES` (the right-hand column above) and `PACKAGE_PLATFORM`; `SKILL_SYNC_MAP` is computed from them and the per-platform tool lists in `docs/listing-prompts.json`: a package gets every skill whose required tool its platform serves. `coinvest` is bundled by an explicit list (`co-invest`, `co-invest-perplexity`) because its default is the Computer endpoint.

| Package | Platform key | Endpoint | Result today |
| --- | --- | --- | --- |
| `co-invest` (Cursor) | `cursor` | Computer | `coinvest` + 12 (no tokenized-stocks) |
| `co-invest-perplexity` | `perplexity` | Computer | same |
| `co-invest-claude` (new) | `claude` | Main (`https://coinvest.liquid.trade/mcp`) | all 13 workflow skills, no `coinvest` |
| `co-invest-grok` | `grok` | `all` | all 13 workflow skills |
| `co-invest-openai` | `chatgpt` | links-only | those whose required tool is in the pinned 44-tool snapshot |
| `co-invest-muse` | `muse` | paper-only | those whose required tool is in the pinned 45-tool contract |

ChatGPT and Muse use the pinned snapshots already in this repository, so `coinvest-earnings` (and `coinvest-yield` on ChatGPT) join those packages only when the snapshots are refreshed.

### Packages

- **Claude (new `plugins/co-invest-claude`):** `.claude-plugin/plugin.json`, `.mcp.json` pointing at Main, `https://coinvest.liquid.trade/mcp` (the only endpoints with `execute_spot_order`; owner asked for tokenized stocks on Claude), bundled skills, README, CHANGELOG, LICENSE, logo; root `.claude-plugin/marketplace.json` listing it; `scripts/claude-package.mjs` validator and `test/claude-package.test.mjs`. Version 1.1.0. Claude apps (claude.ai) keep the custom connector; `npm run package:claude-skills -- --out <dir>` writes one ZIP per skill for manual upload there, from the root skills (all 13 workflow skills, since that connector serves `execute_spot_order`).
- **OpenAI:** `scripts/openai-package.mjs`, `scripts/package-openai.py` and tests take the skill list from `SKILL_SYNC_MAP["co-invest-openai"]` instead of three fixed names; version 1.1.0; listing fields unchanged from PR #18. Upload and review stay with the owner.
- **Muse:** `scripts/muse-paper-only.mjs` allows the mapped skills' files; README lists them; version 1.1.0. Whether Muse reads skills from a hosted connector is not verified.
- **Cursor, Perplexity, Grok:** version 1.1.0, changelog, README skill table and duplicate-install warning.

### Tests

- `test/sync-skills.test.mjs`: the computed map; every root skill is bundled somewhere; `coinvest` only in the explicit list; copies match.
- `test/skills-content.test.mjs`: format rules above; coverage per package; in `## Tools`, the leading backticked name of every item is a tool in at least one catalog (from lane input committed as `docs/skill-gates.json`) ; anywhere in a skill, a backticked token that is a known tool name must be served by at least one package the skill is bundled with; any skill naming a tool that has `confirmed` in some catalog must contain `confirmed=true`; banned words; a skill whose table row has no writes names no executor tool.
- `test/skill-triggers.test.mjs`: about 30 user phrases, each mapped to exactly one skill by a keyword match on the `Triggers on:` text.

## Architecture

Markdown skills in one folder, a computed copy map, per-package validators. No server or tool change.

## Phases

1. Spec; independent advisor read (done 2026-11-19; its findings are folded into the gate rule, `facts.md` and the tests).
2. Session: computed sync map, `docs/skill-gates.json`.
3. Nine implementer lanes, no file overlap. Lanes write only the files listed, with Write or Edit, never run `git` write commands, `git stash`, or `npm run sync:skills`, and never edit `plugins/*/skills/`.
   - L1 `skills/coinvest-trade`, `skills/coinvest-allocate`
   - L2 `skills/coinvest-research`, `skills/coinvest-portfolio-review`, `skills/coinvest-paper-trading`, `skills/coinvest-automation`
   - L3 `skills/coinvest-market-scan`
   - L4 `skills/coinvest-prediction-markets`, `skills/coinvest-tokenized-stocks`
   - L5 `skills/coinvest-trailing-stops`, `skills/coinvest-earnings`
   - L6 `skills/coinvest-yield`, `skills/coinvest-funding`
   - L7 Claude package: `plugins/co-invest-claude/**` except `skills/`, `.claude-plugin/marketplace.json`, `scripts/claude-package.mjs`, `scripts/package-claude-skills.mjs`, `test/claude-package.test.mjs`
   - L8 OpenAI package: `scripts/openai-package.mjs`, `scripts/package-openai.py`, `test/openai-package.test.mjs`, `plugins/co-invest-openai/**` except `skills/` copies of shared skills (it deletes the three old skills), `docs/openai-submission-1.0.2.md`
   - L9 Muse package: `scripts/muse-paper-only.mjs`, `test/muse-paper-only.test.mjs`, `plugins/co-invest-muse/README.md`, `plugins/co-invest-muse/CHANGELOG.md`, `plugins/co-invest-muse/plugin.json`
   Lane inputs (read-only): `/Users/mw/liquid/tmp/liquid-plugin-skills-20261119/` (`tooldefs.json`, `gates.md`, `gates.json`, `facts.md`, `bot/*.md`).
4. Session: sync, `validate-plugins.mjs` wiring, content and trigger tests, READMEs, changelogs, versions, `coinvest` list. Then an adversarial review lane checks every skill sentence against the tool definitions.
5. Gates, one commit on PR #14's branch, merge (owner's instruction above).

## Data models and API contracts

None change.

## Analytics

No events: static skill text. Use shows in existing MCP per-client tool-call counts.

## Risks

- A wrong unit, limit or gate in a skill causes a wrong order. Mitigation: `facts.md`, the review lane, the content test.
- One skill text for five catalogs can describe a path a connection lacks; every skill's last section covers the missing-tool case and the content test enforces the gate wording.
- Catalog drift after `82d1e73a`.
- The same skill name installed twice (plugin plus `npx skills add`) loads twice; READMEs warn.
- OpenAI needs a new upload and review; Muse reviewers read this folder during an open review.

## Review (executed 2026-11-19)

Two independent reviewers checked every skill sentence against `tooldefs.json` for all five catalogs: 2 P0, 4 P1 and 51 P2 findings, all applied. The P0s: on `interactive-v1` the order executors are reserved for the proposal's own confirmation control, so a skill that called them after a typed yes could place an order or basket twice; trade and allocate now check for that description first. Other fixes: partial batch closes resend sizes, not symbols; allocation follows the question method the tool description requires; exact field names for prediction closes and cancels; equity perpetual versus tokenized stock versus company shares in research.

## Verification

- `npm run validate`, `npm test`, `node scripts/sync-skills.mjs --check`, `git diff --check`.
- Mutation checks of the content and trigger tests.
- Review lane report with fixes applied.
- `npm run package:openai` and `npm run package:claude-skills` build their archives.
- Read-only live calls on Computer for two new skills' read workflows.
- Executed: validate OK; 89 of 89 tests; sync check clean; `git diff --check` clean; the content test carries its own mutation cases (missing section, unknown tool, missing `confirmed=true`, URL, host name, missing triggers); OpenAI ZIP and Claude skill ZIPs built.
- Not verified: skill loading or triggering inside any host; preview calls on any endpoint other than the tool definitions in source; the Claude Code plugin install flow (`/plugin marketplace add`) was not run.
