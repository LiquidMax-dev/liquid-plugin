---
name: coinvest-portfolio-review
description: "Review a Liquid account with Co-Invest: balance, equity, margin, open positions, PnL, resting orders, and recent position history, in live or paper mode. Triggers on: show my portfolio, what are my positions, how am I doing, open orders, my PnL, trade history, closed positions. Read-only."
license: MIT
---

# Co-Invest portfolio review

Summarize the user's Liquid account from the connected Co-Invest server. This
skill never changes an account.

## Workflow

1. Read the account mode first with `paper_trading_status`, so every number
   is labeled live or paper.
2. Call only what the question needs:
   - Balance, equity, margin, positions, PnL, TP/SL: `get_portfolio`.
   - Resting or pending orders: `view_open_orders`. Orders are not positions.
   - Closed or past trades: `get_position_history`. It returns closed
     lifecycles by default; ask for `open` or `all` explicitly.
   - Deposits, withdrawals, and transfers: `get_transaction_history`, present
     only on the full catalog.
   - A visual: `show_portfolio_chart`.
3. Present positions with side, size, entry, mark, unrealized PnL, leverage,
   and liquidation price where returned. Keep holdings and orders in separate
   lists.

## Defaults

- Endpoint: Co-Invest Computer, `https://coinvest-computer.liquid.trade/mcp`.
- Mode: whatever `paper_trading_status` reports. Never switch it from this
  skill.
- Freshness: re-read the portfolio when the user asks for an update. Do not
  repeat earlier balances as current.

## Reading history correctly

- `get_position_history` reconstructs recent lifecycles from a bounded window
  of fills. Report the coverage it states; it is not an all-time ledger.
- Its realized PnL is gross, before fees and funding. Fees are listed
  separately in their own tokens.
- A lifecycle marked `unknown` or with an incomplete entry stays unknown. Do
  not invent its opening or close.
- An `open` result means open at the last observed fill. Use `get_portfolio`
  for the current position.
- Its `symbol` filter is exact and case-sensitive, including prefixes such as
  `xyz:BTC`.

## If Co-Invest is unavailable

- No Co-Invest server connected: say so and guide the user to connect
  `https://coinvest-computer.liquid.trade/mcp` with Liquid OAuth.
- Sign-in or account errors: report them as returned. Do not ask the user for
  a private key, token, or wallet secret.
- A tool is missing: say this connection does not offer it.

## Guardrails

- Paper values are simulated. Label them as paper every time.
- Do not give a closing, hedging, or rebalancing instruction as fact. Offer
  it, and use the trade workflow only on the user's explicit request.
