---
name: coinvest-earnings
description: "Read-only earnings calendar and company fundamentals for companies tradeable on Liquid, with optional market context for a named company. Triggers on: earnings, earnings this week, earnings this month, who reports, who reports this week, upcoming earnings, earnings calendar, what does NVDA do, market cap, P/E, company fundamentals, recent earnings results."
license: MIT
---

# Co-Invest earnings

Use this skill to show which tradeable companies report soon and what a company's fundamentals look like. It only reads data: it never places or proposes an order, and an earnings date is a catalyst to know about, not a recommendation.

## Workflow

1. For the calendar ("who reports this week?"), call `upcoming_earnings`. `window` is `week` (default, next 7 days) or `month` (next 30). Use `month` only when the user asks for it.
2. Report the returned days in order, grouped by the pre-market, post-market and unspecified buckets, with each company's symbol, name, EPS forecast and market cap as returned.
3. For fundamentals on a named company ("what does NVDA do", market cap, P/E, recent results), call `get_asset_profile` with a bare ticker or a venue-prefixed symbol such as `xyz:NVDA`. Equities carry the full profile; crypto and other asset classes may only have a description and circulating supply, so say what is missing instead of filling it in.
4. If the user wants market context for one company, call `analyze_market` with its symbol (see Rules), and optionally `get_news`, which returns the current curated set for all markets: quote only headlines that name the company, and say when none do.
5. Present the data as returned. Do not predict the result of a report.

## Tools

- `upcoming_earnings`: earnings calendar from the Nasdaq calendar for companies tradeable on Liquid; `window` week or month; each company's `markets[]` lists the `prefixed_symbol`.
- `get_asset_profile`: fundamentals: name, asset class, description, sector and industry, market cap, trailing P/E, circulating supply, last four quarters of revenue and net income. Not for upcoming dates.
- `analyze_market`: price, funding, open interest and positioning for one named market, using its exact symbol.
- `get_news`: recent headlines with source links and an unusual-activity section.

## Rules

- Read-only skill. Never call a proposal or order tool from here. If the user then asks to trade, that is a separate request and a separate skill.
- When the company came from the calendar, use a `prefixed_symbol` from its `markets[]` for `analyze_market`; if there is more than one, name them and ask which. Otherwise use the ticker the user gave. If the result asks for an asset choice, ask which candidate the user means and retry with that exact symbol.
- The calendar's `prefixed_symbol` markets (for example `xyz:NVDA`) are perpetual contracts on HIP-3 stock dexes, not company shares; say so when you show their market context.
- `get_asset_profile` is for fundamentals and past results; `upcoming_earnings` is for dates. Do not use one for the other.
- Quote figures only as returned, with their units. If a field is absent, say it is absent.
- Do not call an earnings date a trade signal, and do not say a company will beat or miss.

## If something is missing

- No Co-Invest connection: say so and point the user to the host's Co-Invest connector settings.
- A tool is absent from the live tool list: say this connection cannot do it. Do not switch endpoints or modes.
- The calendar returns no companies, or the company is not listed: say so plainly. A ticker that is not tradeable on Liquid may not appear in the calendar.
