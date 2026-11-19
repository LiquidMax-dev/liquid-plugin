---
name: coinvest-research
description: "Research one named market or compare a few with Co-Invest: price, funding, open interest, smart-money positioning, technical indicators, order book, candles, and headlines for crypto, equity perpetuals, commodities, indices and other Liquid markets. Triggers on: analyze BTC, what is NVDA doing, how are traders positioned on gold, compare ETH and SOL, RSI for SOL, news on TSLA, read this link. Read-only."
license: MIT
---

# Co-Invest market research

Answer questions about one named asset, or a short comparison, with data returned by the connected Co-Invest tools. This skill is read-only: it never previews, proposes, places or changes anything.

## Workflow

1. Identify the asset or assets and the question: outlook, positioning, technicals, depth, news, or a pasted link.
2. Read the live tool list and schemas. Use only tools this connection exposes.
3. Call the narrowest tool that answers the question:
   - One known asset: `analyze_market` with its Liquid market symbol (for example `BTC`, `GOLD`, `NVDA`; keep a venue prefix such as `xyz:` exactly as given). If the user gave a name rather than a symbol, find the symbol with `search_markets` first. If no asset is clear, ask one short question. If the result asks for an asset choice, ask which candidate the user means and retry with that exact symbol.
   - Two to ten assets: one `analyze_markets_batch` call, not repeated single calls.
   - An unknown or partial name, or "can Liquid trade X": `search_markets` with that name as `query`. The no-query result lists only the top markets by volume, so absence there does not mean Liquid cannot trade it.
   - RSI, MACD, moving averages and similar: `get_technical_indicators`.
   - Depth, spread or candles, only on an explicit request: `show_orderbook`, `show_chart`.
   - Headlines: `get_news`. It takes no symbol and returns the current curated set for all markets, so report only headlines that name the asset and say when none do. A user-supplied URL: `read_link`.
4. Report what the tools returned, with the units, time or period they give. Keep returned data apart from your own interpretation, and name the instrument the result shows: an equity market such as `NVDA` or `xyz:NVDA` is a perpetual contract on the stock, not company shares; a commodity, index or crypto perpetual is not a stock; an `EQ` symbol such as `EQNVDA` is a tokenized-stock spot token.
5. Where the tool description asks for it, you may offer in one line to turn the analysis into a trade. Never call a proposal or order tool here; treat a yes as a separate trade request.

## Tools

- `analyze_market`: price, funding, open interest and positioning for one asset, including the smart-money versus losing-crowd split when available. Primary tool for a known asset.
- `analyze_markets_batch`: side-by-side price, funding and positioning for 2 to 10 symbols; an optional `thesis` frames the comparison.
- `get_technical_indicators`: indicator values from candles for one market; `interval` defaults to 1h.
- `show_chart`: candles and volume for one asset; `interval` is required (`1m`, `5m`, `15m`, `30m`, `1h`, `4h` or `1d`, no default), and `limit` defaults to 100, max 200.
- `show_orderbook`: bid and ask depth and spread for one asset.
- `get_news`: curated headlines with source links and an unusual-activity section (symbols with anomalously high last-hour volume).
- `read_link`: title and main text of a page the user supplied, or an X post if the server can read it; not for Liquid market or account data.
- `search_markets`: find a symbol or browse the top markets by volume.

## Rules

- Do not use `search_markets` for a symbol you already know.
- Re-fetch prices, funding and positioning for each new question; never reuse earlier numbers as current.
- Report returned data in text. Do not promise a chart or any visual; say what the result contained.
- Positioning describes positioning, not order book depth. Claim depth only from an order book result.
- If a headline quote and the market quote differ, say so rather than claiming they agree.
- Research is not advice. Never state a forecast or return as fact.
- This skill never calls a tool that proposes or places a trade, even when the analysis suggests one.

## If something is missing

- No Co-Invest connection: say so and point the user to the host's Co-Invest connector settings to add it and sign in. Do not answer with remembered or invented prices.
- A tool is absent from the live list: say this connection cannot do that, and do not switch endpoints or modes to fill the gap.
- A call fails or returns partial data: report what is missing and hold back conclusions that depend on it.
