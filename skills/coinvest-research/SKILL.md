---
name: coinvest-research
description: "Research a Liquid market with Co-Invest: price, positioning, funding, technicals, order book, charts, and news for crypto, stocks, commodities, indices, and FX. Triggers on: analyze BTC, what is NVDA doing, how are traders positioned on gold, compare ETH and SOL, market overview, crypto news, top setups. Read-only."
license: MIT
---

# Co-Invest market research

Answer market questions with data from the connected Co-Invest server. This
skill never changes an account.

## Workflow

1. Identify the asset or assets and the question: outlook, positioning,
   technicals, news, or a broad overview.
2. Inspect the host's current tool list. Use only tools the connected server
   exposes, with their live schemas.
3. Call the narrowest tool that answers the question:
   - One known asset: `analyze_market`. Do not use `search_markets` for a
     symbol you already know.
   - Two or more assets: one `analyze_markets_batch` call, not repeated
     single calls.
   - An unknown or partial name: `search_markets`, then analyze the match.
   - Crowded trades across the market: `get_positioning_pulse`.
   - Indicators such as RSI or moving averages: `get_technical_indicators`.
   - Depth, a chart, or the whole market: `show_orderbook`, `show_chart`,
     `show_market_overview`. Their text results are usable without a widget.
   - Headlines: `get_news`. Earnings dates: `upcoming_earnings`, present only
     on the full catalog.
   - Ranked ideas: `market_picks`. Its picks are proposals, not orders.
4. Report what the tools returned, with the source and time or period they
   give. Keep reported data separate from your interpretation.

## Defaults

- Endpoint: Co-Invest Computer, `https://coinvest-computer.liquid.trade/mcp`.
  Use Main or Restricted only when the user selected it.
- Symbols: Liquid market symbols as the user wrote them, such as `BTC`, `GOLD`
  or `NVDA`. Pass venue prefixes such as `xyz:BTC` exactly.
- Freshness: re-fetch prices, funding, and positioning for every new question.
  Do not reuse earlier numbers when the user asks for current data.

## If Co-Invest is unavailable

- No Co-Invest server connected: say so, and guide the user to add
  `https://coinvest-computer.liquid.trade/mcp` in the host's MCP settings and
  sign in with Liquid OAuth. Do not answer with remembered or invented prices.
- A tool is missing from the current list: say that this connection does not
  offer it. Do not call raw APIs or another endpoint to fill the gap.
- A call fails or returns partial data: report what is missing and stop
  short of conclusions that depend on it.

## Guardrails

- Research is not advice and not a trade. If the user then asks to trade,
  hand off to the trade workflow (the `coinvest-trade` skill when installed)
  and require its pre-trade checks.
- Do not promise returns or present an estimate as a fact.
