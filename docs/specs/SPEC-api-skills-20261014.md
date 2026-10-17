# SPEC-api-skills-20261014

Status: **PR open, not merged** (corrected 2026-10-15: Marcin chose "Push skills now" so the skills get checked in GitHub CI before launch; superseded text: "draft, local only until launch"; 2026-10-14; LIQ-5621). Owner: Marcin. The API contract (personal keys, scopes, limits, errors) is owned by `liquidmax_server` `docs/specs/SPEC-api-self-service-access.md`; this file owns the skill files. The liquid.trade developers page (`liquid-landing-page` `docs/specs/SPEC-developers-page.md`) lists exactly this catalog.

## TLDR

Sixteen agent skills that use a personal Liquid API key through the Python SDK (`pip install liquidtrading-python`, PyPI 0.1.3): market data, portfolio checks, trading and two watch loops. One install (`npx skills add LiquidMax-dev/liquid-plugin`) adds them next to the existing `coinvest` (MCP) skill. Nothing is pushed until launch, because this repo is public and skills.sh indexes it.

## Requirements (owner, verbatim)

Marcin, Oct 14: "API should have own sub/page on marting website- we can copy this https://gmgn.ai/ai?chain=sol&tab=skills_market includin skills and see what skils we can include"; "everything should be behind feature flag of course"; Free plan "250 free, per minute 10, 1 key"; trading requests count against the allowance; our server errors do not.

## Solution

- Each skill is `skills/<slug>/SKILL.md` with YAML front matter mirroring `skills/coinvest/SKILL.md` (`name` = slug matching `^[a-z0-9]+(-[a-z0-9]+)*$`, `description` of at most 155 characters, the length skills.sh shows, and the same `license`), then: when to use it, setup, the SDK call, how to present the result, and the request cost. Skills stay at the repository root `skills/` and are not copied into any `plugins/*` package (`scripts/sync-skills.mjs` and `scripts/validate-plugins.mjs` must keep passing and must not start shipping them inside the MCP plugins).
- Shared setup text (identical in every skill, kept short): `pip install liquidtrading-python`; read `LIQUID_API_KEY` and `LIQUID_API_SECRET` from the environment and never print, log or echo the secret; create the key at `https://app.liquid.trade/?api_access=open` (Settings → API Access; READ for data and portfolio skills, READ+TRADE for trading skills); construct the client with `base_url="https://api-public.liquidmax.xyz"` (the SDK default is the bare origin, which bypasses the edge) and keep the default `max_retries=0`.
- Install command: `npx skills add LiquidMax-dev/liquid-plugin` plus whatever flags make it non-interactive and select every Liquid API skill, taken from `npx skills add --help` of the version tested (the README's coinvest install uses `--skill coinvest`); the developers page quotes this exact command. Verified 2026-10-15 with `skills@1.7.2`: `add --help` lists `-s, --skill <skills>` (several names, space separated) and `-y, --yes` (skip confirmation prompts); `npx -y skills@1.7.2 add <local liquid-plugin worktree> --skill liquid-price liquid-market-order -y` with stdin closed and telemetry off exited 0 without a prompt and installed both into `./.agents/skills/` (universal agents, symlinked for Claude Code). The GitHub-source run happens at launch, after the push.
- Every request, reads and trades alike, costs one request of the account's allowance; requests that fail with a 5xx are not charged. Free: 1,000 requests once, 10 a minute, three keys; paid plans raise the requests and the per-minute limit (**corrected 2026-10-15:** the owner set Free to 3 keys, the same as Starter, so "one key; paid plans raise all three" in every skill's cost line became false; Trader and Pro also allow more keys). All keys share the account's limits. On `429 RATE_LIMIT_EXCEEDED` wait for `Retry-After`; on `429 API_QUOTA_EXCEEDED` stop and tell the user the allowance is used up. Do not loop on errors.
- Trading skills (scope READ+TRADE) restate the order (symbol, side, USD size, leverage, order type, TP/SL) and get the user's explicit confirmation before each call. They never invent a size. `place_order` takes `size` as USD notional, `close_position` takes `size` in coin units (`client.py` 0.1.3); a partial close converts from the position's coin size and never passes a USD amount. After a timeout or a network error on an order call they must not resend: they read open orders and positions first and report what actually happened, because the order may have been placed.
- Method names, parameters and return shapes come from the SDK source (`liquidtrading/client.py` in PyPI 0.1.3), not from this spec; where the SDK lacks a field (for example funding on some markets), the skill says it is unavailable rather than guessing.

## Catalog

| slug | Title | Category | Scope | SDK calls | Description (skills.sh) |
| --- | --- | --- | --- | --- | --- |
| liquid-markets | Liquid Markets | Market Data | READ | `get_markets` | List the perpetual markets you can trade on Liquid with their symbol and maximum leverage. |
| liquid-price | Price Check | Market Data | READ | `get_ticker` | Current mark price for any Liquid market, plus 24h change, volume and funding when available. |
| liquid-orderbook | Order Book Depth | Market Data | READ | `get_orderbook` | Spread, best bid and ask, depth within 0.5% and 1% of mid, and bid/ask imbalance for a market. |
| liquid-chart-pattern | Chart Pattern Read | Market Data | READ | `get_candles` | Fetch OHLCV candles, name the pattern (trend, range, breakout, breakdown) and score it 0-100 with its measurements. |
| liquid-account | Account Health | Portfolio | READ | `get_account` | Equity, margin used, available balance and margin usage for your Liquid account, flagged when usage is high. |
| liquid-positions | Positions and P&L | Portfolio | READ | `get_positions`, `get_ticker` | Open positions with side, size, entry, mark, leverage, unrealized P&L and distance to liquidation. |
| liquid-open-orders | Open Orders | Portfolio | READ | `get_open_orders` | List resting orders with symbol, side, size and price. |
| liquid-market-order | Market Order | Trading | READ+TRADE | `place_order` (market) | Open a long or short at market by USD size and leverage, after you confirm the order. |
| liquid-limit-order | Limit Order | Trading | READ+TRADE | `place_order` (limit) | Rest a buy or sell at your price; it fills only if the market trades there. |
| liquid-bracket-order | Order with TP/SL | Trading | READ+TRADE | `place_order` with take-profit and stop-loss | Enter a position with a take-profit and a stop-loss attached in one request. |
| liquid-tp-sl | Set TP/SL | Trading | READ+TRADE | `set_tp_sl` | Add or move the take-profit and stop-loss on an open position. |
| liquid-close-position | Close Position | Trading | READ+TRADE | `close_position` | Close a position fully or partly at market. |
| liquid-cancel-orders | Cancel Orders | Trading | READ+TRADE | `cancel_order`, `cancel_all_orders` | Cancel one resting order by id, or all of them. |
| liquid-leverage | Leverage and Margin | Trading | READ+TRADE | `update_leverage`, `update_margin` | Change a market's leverage or add or remove isolated margin on a position. |
| liquid-price-alert | Price Alert Watch | Monitor | READ | `get_ticker` in a loop | Watch a market and alert when price crosses your level; states how many requests the watch uses per day. |
| liquid-position-guard | Position Guard | Monitor | READ+TRADE | `get_positions`, `get_ticker`, `set_tp_sl` in a loop | Move your stop to break-even after a set gain and trail it behind price; confirms the rules with you first. |

Each catalog row also carries two "Just say to your agent" examples and three "Core capabilities" lines, written in the skill file under those headings so the developers page can quote them.

Monitor skills: the default interval is 60 s; the skill states the daily request count for the chosen interval before it starts, refuses intervals under 10 s, waits for `Retry-After` on `RATE_LIMIT_EXCEEDED` and stops on any other 4xx. Price Alert costs 1,440 requests per day per market watched, so the Free 1,000 requests last about 16 hours at 60 s. Position Guard reads positions once and the ticker (`get_ticker(...).mark_price`, since `get_positions` returns no mark) once per guarded market on every check, so one market costs 2,880 requests per day and the Free 1,000 last about 8 hours (corrected 2026-10-16, review). Positions reads the mark the same way: one `get_positions` request, then `get_ticker(...).mark_price` once per open position (1 + N requests), since `get_positions` returns no mark (corrected 2026-10-17, review). Position Guard only ever moves a stop toward profit and never widens it, and it confirms its rules (trigger gain, trail distance, markets) with the user before starting.

Not included: prediction markets, Earn, convert and watchlists (the SDK has no methods for them), and anything needing the user's wallet signature.

## Verification

- `npm run validate`, `node scripts/sync-skills.mjs --check`, `npm test` pass; the `coinvest` skill and every `plugins/*` package are byte-identical to `origin/main`.
- A new `test/api-skills.test.mjs`: 16 skill directories match the catalog slugs; each front matter has `name` equal to the directory and a `description` of at most 155 characters equal to the catalog text; every skill mentions `api-public.liquidmax.xyz`, `LIQUID_API_KEY` and `LIQUID_API_SECRET`; READ+TRADE skills contain the confirmation rule and the no-resend rule; the order skills state the USD-notional versus coin-units sizes; front matter matches the coinvest skill's keys; no file contains a key- or secret-looking literal.
- Live check (local stack, see the backend spec): run each READ skill's SDK snippet with a READ key and each TRADE snippet's dry part (parameter building) without sending; the TRADE end-to-end run on mwdev uses `liquid-market-order` and `liquid-close-position`.
- Launch (owner): push the branch, open the PR, merge; then a telemetry-on `npx skills add` makes skills.sh list them.
