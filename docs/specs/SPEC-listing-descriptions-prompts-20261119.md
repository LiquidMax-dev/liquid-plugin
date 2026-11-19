# SPEC-listing-descriptions-prompts-20261119

Status: implemented 2026-11-19. Gates: validate OK, 57 of 57 tests (56 plus the catalog comparison, which runs only with `LIQUID_MCP_ROOT`). Not done by the agent: any store upload or submission, tool calls from ChatGPT, Grok, Claude, Muse or Perplexity.

## TLDR

Rewrite each package's listing description so it names what the connected endpoint can do today, and give every platform 8 or 9 example prompts built only from tools that platform's endpoint serves. Add Claude, which connects without a package, to the root README. No endpoint, tool or skill changes; every package moves to 1.0.3.

## Problem

Requirement (owner, 2026-11-19): "Improve our liquid plugin for ChatGPT, Claude, Grok etc. improve description and add 6-10 based on tools available per platform with things like tokenized equities added recently, option (if available already) etc".

- Descriptions are generic ("Research markets, review your Liquid portfolio, and place trades...") and predate tokenized stocks, trailing stops, earnings and fundamentals, Earn and staking reads.
- Only the OpenAI manifest carries a prompt, one: "NVDA last 24h". The other packages have none.
- The endpoints serve different catalogs, so one shared prompt list would promise tools a platform does not have.

## Measured (2026-11-19)

Tool names per endpoint, from liquid-mcp `generated/*.json` at `origin/main` `82d1e73a`:

| Platform | Endpoint | Catalog | Tools |
| --- | --- | --- | --- |
| Cursor, Perplexity | `https://coinvest-computer.liquid.trade/mcp` | `computer-v1-full` | 63 |
| Grok | `https://coinvest.liquid.trade/mcp?profile=all` | `all` | 64 |
| Claude (custom connector) | `https://coinvest.liquid.trade` | `interactive-v1` | 64 |
| ChatGPT | `https://coinvest-chat.liquid.trade` | `interactive-v1-links-only` | 47 |
| Muse | `https://coinvest.liquid.trade/mcp?profile=paper-only` | `paper-only` | 47 |

- Computer: the 63 names equal the tool list of a live Computer connection read the same day. The other four rows were not read live; they are the source catalogs.
- **Tokenized stocks:** `execute_spot_order` (EQX spot tokens such as EQAAPL, 1x, live only) exists in `all` and `interactive-v1` only. Not on Computer, ChatGPT or Muse.
- **Options:** no catalog has an options tool. Nothing here mentions options.
- **Order gate:** on Computer `execute_order`, `execute_tpsl`, `close_position` and `update_leverage` are `direct-request` with no `confirmed` argument; they run when called. On `all`, `interactive-v1` and `paper-only` every order write takes `confirmed`. The Perplexity package has said "placed only after you approve" since it moved to Computer (#17); that was wrong and is corrected here.
- **Prediction markets** open today are crypto price thresholds and sports (NFL, NBA, Premier League, Champions League). A search for "Fed rate decision" returned nothing on Computer; "Bitcoin" and "Premier League" each returned open markets.
- Trailing stops (`set_trailing_stop`, `view_trailing_stop`, `remove_trailing_stop`) and Earn writes: Computer, `all`, `interactive-v1`. Earn and staking reads also on ChatGPT. `upcoming_earnings` and `get_asset_profile`: every current catalog, but absent from this repository's pinned ChatGPT (44 tools, 2026-10-13) and Muse (45 tools) snapshots, so ChatGPT and Muse prompts avoid them.
- Prompt fields: Cursor and Agent Plugins manifests have none (`additionalProperties: false`). OpenAI `interface.defaultPrompt` takes at most 3 prompts of at most 128 characters; `shortDescription` at most 30; long description at most 4000 ([OpenAI submission page](https://developers.openai.com/plugins/deploy/submission), read 2026-11-19).

## Solution

1. **One data file, `docs/listing-prompts.json`:** per platform its endpoint, catalog, liquid-mcp source revision, tool names, order gate and 8 or 9 prompts, each with the tools it relies on.
2. **READMEs:** a "Try asking" section with that platform's prompts in `plugins/co-invest`, `co-invest-grok`, `co-invest-perplexity`, `co-invest-openai`, `co-invest-muse`. The root README gains a Claude row in the Plugins table and a "Claude" section with the connector steps and its 8 prompts.
3. **Descriptions:** new text in the Cursor, Grok and Perplexity manifests (and the marketplace entries, which must equal them). The Perplexity text, README, tagline and form draft drop the approval-step claim. **Muse:** the description gains the asset classes and keeps both disclosure sentences; `scripts/muse-paper-only.mjs` pins the same string. The submission form points reviewers at `main/plugins/co-invest-muse`, so the text they fetch now differs from the 1.0.2 form record (owner decision, 2026-11-19: apply now).
4. **OpenAI manifest:** new `description` and `interface.longDescription` (kept equal), and 3 `defaultPrompt` entries taken from the ChatGPT list. Everything else still has to equal the published 1.0.0 export. The validator's allowed differences grow by exactly these three fields, with checks: description equals long description, at most 4000 characters, 1 to 3 unique prompts of at most 128 characters with no @mention. This replaces "preserve every listing field" from SPEC-openai-live-metadata-20261013 for these three fields only (owner requirement above).
5. **Perplexity form draft:** example queries and catalog description updated; the form is not submitted yet. The Muse form record stays as submitted.
6. **Version 1.0.3 for every package** (owner decision, 2026-11-19), with a 1.0.3 changelog entry each; the OpenAI and Perplexity validators pin 1.0.3.

### Copy

Descriptions:

- **Cursor:** "Research and trade crypto, equities, commodities, indices and prediction markets on Liquid without leaving Cursor. Live prices, positioning, news, earnings and fundamentals; your portfolio, orders and history; trailing stops and paper trading. Orders are placed when you ask for them, or within an automation limit you set."
- **Grok:** "Research and trade crypto, equities, tokenized stocks, commodities, indices and prediction markets on Liquid from Grok. Live prices, positioning, news, earnings and fundamentals; your portfolio, orders and history; trailing stops and paper trading. Every order is previewed and placed only after you approve it in chat."
- **Perplexity:** "Co-Invest connects Perplexity to your Liquid account. Research crypto, equities, commodities, indices and prediction markets with live prices, funding, positioning, news, earnings dates and company fundamentals. Review your portfolio, open orders and history. Orders are placed when you ask for them in chat, with no separate confirmation step, so name the asset, side and size you want. Protect positions with take-profit, stop-loss and trailing stops, or practice in paper-trading mode with simulated funds."
- **Muse:** "Research crypto, equities, commodities, indices and prediction markets, and practice simulated trading with Liquid Co-Invest in Muse." followed by the two existing disclosure sentences.
- **ChatGPT:** "Co-Invest brings Liquid market research and portfolio planning into ChatGPT.\n\nAsk about crypto, equities, commodities, indices and prediction markets and get live prices, funding, positioning, technical indicators, charts and news. Review your Liquid portfolio, open orders and history, and model an allocation that fits your risk and time horizon.\n\nWhen you want to act, Co-Invest prepares the trade and opens Liquid, our brokerage, with the idea ready for your final review; live orders are not placed from ChatGPT. A paper account with simulated funds lets you practice and manage simulated positions.\n\nDesigned for traders who want sharper context, faster planning, and a more connected way to navigate Liquid markets."

Prompts are in `docs/listing-prompts.json`. ChatGPT `defaultPrompt`: "What moved NVDA in the last 24 hours?", "Plan a moderate-risk portfolio across crypto, stocks and gold", "Which prediction markets are open on Bitcoin and on upcoming Premier League matches? Show the odds.".

## Architecture

Data and documentation only. `test/listing-prompts.test.mjs` reads the data file and asserts, per platform: 6 to 10 unique prompts; every tool a prompt relies on is in that platform's tool list; every prompt appears verbatim in that platform's README; no prompt or description in the repository mentions options; "tokenized" appears only for platforms whose tool list has `execute_spot_order`; the ChatGPT and Muse tool lists are subsets of the pinned snapshots in this repository; a platform whose gate is `direct` has no "preview" or "only after you approve" in its description; the OpenAI `defaultPrompt` entries come from the ChatGPT list. With `LIQUID_MCP_ROOT` set to a liquid-mcp checkout, every tool list is also compared with `generated/<catalog>.json` at the recorded revision (skipped otherwise, and in CI).

## Phases

One change, one commit, one PR. Spec, independent advisor read, implementation, gates.

## Data models

`docs/listing-prompts.json`: `{ formatVersion: 1, sourceRepository, sourceRevision, observedOn, platforms: { <id>: { endpoint, catalog, orderGate, readme, tools: string[], prompts: [{ text, tools: string[] }] } } }`.

## API contracts

None change. The OpenAI package validator accepts three more differing manifest fields, as stated above.

## Analytics

No events: this changes static listing text. Uptake is read from existing MCP per-client call counts.

## Risks

- Catalog drift: a later liquid-mcp change can remove a tool a prompt names. The data file records the source revision; refresh it with the catalogs.
- Four of five tool lists come from source, not a live `tools/list`. A deployment behind `82d1e73a` could lack a tool; ChatGPT and Muse prompts are limited to the older pinned snapshots for that reason.
- OpenAI listing text changes need a new ZIP and OpenAI review; the published 1.0.0 listing is unchanged until the owner uploads and submits.
- Published Cursor and Grok catalog entries change only after those stores re-review; a store pinned to a version may wait for a version bump.

## Advisor read (2026-11-19)

An independent read before the final copy changed: the Perplexity approval claim (removed), tool lists for the Grok and Muse order prompts (`suggest_trade` first), "$50" as notional, the trailing-stop percent as margin given back, no dollar amount on `plan_portfolio` (it has no amount input), paper mode shared by wallet (README line, paper prompt last), the prediction prompt, the Claude section (apps versus Claude Code, card versus chat confirmation), the Muse description (first held, then applied on the owner's decision), the @mention check and the optional catalog comparison. The Claude client mapping (`claude-ai`, `claude`, `claude-ios`, `claudeandroid` get `interactive-v1`; `claude-code` keeps the default) is from liquid-mcp `src/profiles/selection.ts`.

## Verification (executed 2026-11-19)

- `npm ci`, `npm run validate` OK; `npm test` 57 of 57 with `LIQUID_MCP_ROOT`, 56 passed and 1 skipped without it; `git diff --check` clean.
- Mutation checks in a scratch copy, each failing with the named assertion and passing again after restore: a prompt relying on a tool outside its platform; "tokenized" in a Perplexity prompt; "options" in a Muse prompt; a prompt removed from the Grok README; a fourth OpenAI starter prompt; a starter prompt not in the list; a ChatGPT tool outside the pinned snapshot.
- `npm run package:openai` built a seven-file ZIP whose manifest carries the new description (equal in both fields) and 3 prompts.
- Live, read-only, on Computer: `upcoming_earnings` (week) returned ZM and DELL; `get_asset_profile` NVDA returned market cap and P/E; `get_earn_balance` returned the vault; `search_prediction_markets` returned open markets for "Bitcoin" and "Premier League" and none for "Fed rate decision". No trades.
- Not verified: a live `tools/list` on Main (`all`, `interactive-v1`), ChatGPT or Muse, so `execute_spot_order` and the other Main-only tools are from the source catalog; Claude rendering cards today; rendering of the new text in any store.
