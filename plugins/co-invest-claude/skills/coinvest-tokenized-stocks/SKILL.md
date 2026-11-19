---
name: coinvest-tokenized-stocks
description: "Buy or sell tokenized stock spot tokens such as EQAAPL or EQNVDA at 1x, and tell them apart from equity perpetuals. Applies only where execute_spot_order is in the live tool list. Triggers on: tokenized stock, tokenized equity, spot stock, buy EQAAPL, sell EQNVDA, EQ token, own the stock without leverage."
license: MIT
---

Use this skill only where `execute_spot_order` is in the live tool list; if it is not there, this connection cannot trade tokenized stocks and the skill does not apply. It covers EQX spot tokens (for example EQAAPL, EQNVDA), which are owned at 1x, and keeps them separate from equity perpetuals.

## Workflow

1. Settle which instrument the user means. A tokenized stock spot token is `EQAAPL`: owned 1x, no leverage, no shorting, live only. An equity perpetual is `AAPL` or `xyz:AAPL`: leveraged, and it belongs to the perpetual order tools, not this skill. If the user's words fit either, ask which they mean before doing anything.
2. Use the EQX symbol for the stock (for example `EQAAPL`) as `symbol`. `search_markets` lists perpetual markets; never take an `AAPL` or `xyz:AAPL` result as the spot symbol, and use `get_asset_profile` for fundamentals if asked.
3. Check mode with `paper_trading_status`. Tokenized stocks are live only and are refused in paper mode, so say so if paper mode is on.
4. For a sell, read `get_portfolio` first so the size matches what the user holds.
5. Call `execute_spot_order` without `confirmed` to get the preview, with exactly one of `size`, `quantity` or `sellAll`. Show the exact returned terms, including slippage.
6. After the user approves those unchanged terms, call it again with `confirmed=true`.

## Tools

- `execute_spot_order`: preview or place a market IOC order on an EQX spot token.
- `search_markets`: lists perpetual markets; use it to tell a perpetual apart from the EQX token, not to pick the spot symbol.
- `get_portfolio`: balances, account mode and positions before a sell.
- `get_asset_profile`: fundamentals for a ticker, read only.
- `paper_trading_status`: whether paper mode is on for this wallet.

## Rules

- Approval: `execute_spot_order` takes `confirmed`. A call without it, or with it false, returns a preview and places nothing. Call with `confirmed=true` only after the user approves the unchanged preview in chat. A changed term needs a new preview. Copy the returned `executionMode` unchanged.
- Pass exactly one of `size` (USD notional, minimum $10), `quantity` (tokens, sell only) or `sellAll` (sell only).
- `maxSlippageBps` is optional, 1 to 500, and defaults to 500. State the slippage in the preview. Orders are market IOC, so a fill can differ from the quote within that limit.
- A retry with the same `idempotencyKey` is rejected as a duplicate, not placed twice. Use one key per confirmed order.
- Never raise a size to meet the minimum without asking. Do not call these tokens leveraged or shortable.
- After the order, report the returned status and any remainder the result names. Do not call a sell-all position closed unless the result says so. On an error or unknown result, do not retry; check `get_portfolio` and retry only on a new request.
- Do not use `execute_spot_order` for `AAPL` or `xyz:AAPL`.

## If something is missing

- If no Co-Invest connection is available, say so and point the user to the host's Co-Invest connector settings.
- If `execute_spot_order` is not in the live tool list, say this connection cannot trade tokenized stocks. Do not switch endpoints or modes, and do not offer the perpetual as a substitute unless the user asks for it.
- If another tool is absent, say this connection cannot do that step.
