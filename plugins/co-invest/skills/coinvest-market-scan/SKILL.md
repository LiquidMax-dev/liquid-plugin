---
name: coinvest-market-scan
description: "Scan the whole Liquid market with Co-Invest: what is moving and why, crowded trades, a short list of ideas, the trader leaderboard and your own rank, and changes to your watchlist. Triggers on: what's moving, market overview, market briefing, what's crowded, top setups, any signals, give me ideas, who tops the leaderboard, my leaderboard rank, edit my watchlist."
license: MIT
---

# Co-Invest market scan

Answer market-wide questions with data from the connected Co-Invest server: what is moving, where traders are crowded, which ideas are worth a look, and who leads the leaderboard. It places no trades; acting on an idea is a separate request.

## Workflow

1. Market overview: call `get_news` and `search_markets` (and `show_market_overview` only if the user asks to see all markets), then `get_positioning_pulse`. The no-query `search_markets` result is only the top markets by volume. Where equity themes matter, you may add `upcoming_earnings` (`window` week) to name earnings catalysts. If `search_prediction_markets` returns relevant markets, you may mention two or three with the probability of the specific outcome returned; do not call one leg of a multi-outcome market the leader without the full outcome list. Tie each theme to returned headlines and cite the links. Say what is moving and why, from the returned data only.
2. Signals: `get_news` for the unusual-activity section and `get_positioning_pulse` for crowded long and short buckets. Report a few of the clearest observations with their evidence and a counterpoint. If no setup is verified, say so plainly. Do not claim to monitor markets between turns.
3. Ideas: first run the overview reads (`get_news`, `search_markets` with no query, `get_positioning_pulse`). As the final step you may call `market_picks` with picks grounded in those results, using the count its description asks for (five on some connections unless fewer catalysts qualify). Without it, give a short written list of up to three. For a shortlist you want to compare, use `analyze_markets_batch`. Never invent prices, levels, sizes or leverage.
4. Leaderboard: `leaderboard_data` for the board, `leaderboard_rank` for one trader or the user's own rank. Default to the top three and report only what is returned: ranks, PnL, bias and biggest position, with `duration` as the ranking window, not the time a position was held. A rank-only result has no positions; do not infer them. Leaderboard figures are public Liquid rankings, never the user's paper results. Never suggest copying or mirroring another trader; offer research on the asset instead.
5. Watchlist: `edit_watchlist` only on an explicit request to add, remove, set or clear symbols. No tool reads the watchlist; never call `edit_watchlist` to view it. If the user asks to see it, say this connection can only change it.

## Tools

- `show_market_overview`: the whole multi-asset market; only when the user asks to see all markets. Not for one asset.
- `search_markets`: browse or find tradeable markets; omit the query for the top markets by volume.
- `get_news`: headlines with source links plus an unusual-activity section.
- `get_positioning_pulse`: crowded long-heavy and short-heavy markets; `limit` is rows per bucket, 1 to 20, default 5.
- `market_picks`: 1 to 5 news-driven picks, proposal only. Set `asset` to the exact symbol a tool returned, `displayName` to the user-facing name, `catalyst` to a headline `get_news` returned and `side` to long or short; never show internal ids to the user. Call it ONLY as the final step of the ideas flow in step 3, after `get_news`, `search_markets` and `get_positioning_pulse`. Never for one asset. After it, ask which pick the user wants; do not draft a trade proposal until they choose. A chosen pick becomes a separate trade request that still needs the size (and leverage) from the user before any proposal.
- `analyze_markets_batch`: compare 2 to 10 markets side by side.
- `leaderboard_data`: `metric` pnl, volume, points or streak; `duration` 24H, 7D, 30D or all_time (default all_time; points and streak ignore it); `limit` 1 to 50, default 10; `asset` keeps traders whose biggest position is in that market.
- `leaderboard_rank`: one trader's standing (wallet, name or handle; omit for the user). Full stats in the top 50, rank only for 51 to 100, and it says when unranked.
- `edit_watchlist`: `action` add, remove or set, with a required `symbols` array (empty only with `set`, which clears the list); `set` replaces the list; `list` names the watchlist, default `Watchlist`. It changes saved account preferences.

## Rules

- This is a public scan: do not read private balances or positions unless the user asks for their own account.
- Use the instrument type actually returned: a perpetual on a commodity or index is not a stock, and an equity market such as `xyz:NVDA` is a perpetual on the stock, not company shares.
- Keep reported data separate from your interpretation. A headline near a price move is not proof of cause.
- `edit_watchlist` runs when called and has no preview: call it only for an explicit request that names the change, and state it in one line first. If the live schema shows a `confirmed` argument, preview first and send `confirmed=true` only after the user approves the unchanged terms.
- Report returned data as text; do not promise charts or any visual.

## If something is missing

If there is no Co-Invest connection, say so and point the user to their host's Co-Invest connector settings. If a tool is absent from the live tool list, say this connection cannot do it; do not switch endpoints or modes.
