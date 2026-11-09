---
name: coinvest-trade
description: "Place and manage Liquid perpetual trades the user explicitly requests through Co-Invest Computer: market or limit orders, batches, take-profit and stop-loss, closes, cancels, and leverage changes, in live or paper mode. Triggers on: buy, sell, long, short, open a position, close my BTC, set a stop loss, cancel my order, change leverage."
license: MIT
---

# Co-Invest trade

Co-Invest Computer's trade tools execute when called; there is no
confirmation card. This skill is the check that happens before each call.

## Pre-trade checklist

Complete every step before a state-changing call.

1. **Explicit request.** The user asked for this action in this conversation.
   Research, a plan, or a pick is not a request to trade.
2. **Mode.** Read `paper_trading_status`. Live or paper is account state, not
   an order field. If the mode is not what the user intends, stop and ask; do
   not toggle it.
3. **Account.** Use the identity the connection exposes. Ask if it differs
   from the account the user means or cannot be told.
4. **Order terms.** Have asset, side, and size from the user. Then:
   - `side`: `buy` opens or adds to a long; `sell` opens or adds to a short.
   - `size` is notional USD, which is margin times leverage. If the user gave
     a dollar amount, ask whether it is notional or margin unless they said.
   - `quantity`, in coin units, is an alternative to `size` only where the
     live schema offers it.
   - Leverage: use the user's value. If the schema requires leverage and the
     user gave none, ask. Do not pick one.
   - Type defaults to market. A limit order needs the user's price.
   - TP/SL are optional; add them only when the user gave them.
5. **Context reads.** Call `get_portfolio` when sizing depends on balance or
   an existing position, and before `close_position`, `execute_tpsl`, or
   `update_leverage`.
6. **State the order** in one line, mode included, then call the tool.

## Tools

- One order: `execute_order`. Several legs: one `execute_orders_batch` call.
- TP/SL on an open position: `execute_tpsl`. Keep stops short of the
  liquidation price.
- Close: `close_position`. It closes fully by default; a partial `size` is in
  coin units, not USD.
- Resting orders: `view_open_orders`, then `cancel_order` with the returned id.
- Leverage on a position: `update_leverage`.
- First-time setup: `enable_trading` returns a link the user opens to enable
  trading. It does not enable trading itself.

Use names and fields from the live schema. The full catalog adds fields such
as `reduceOnly` and `idempotencyKey`; the support catalog does not have them.

## After the call

- Report the returned status as given. Accepted, resting, or partial is not
  filled.
- If the result is an error, timeout, or unknown, read `view_open_orders` and
  `get_portfolio` before anything else. Do not resubmit while the first
  outcome is uncertain.
- Pass backend denials and sign-in handoffs to the user. Never switch
  endpoints or modes to get around a denial.

## Automation

Orders placed by an active automation policy follow that policy, not this
checklist's explicit-request step; see the `coinvest-automation` skill. Without
a current, active policy that covers the order, every trade needs the user's
explicit request.

## Defaults

- Endpoint: Co-Invest Computer, `https://coinvest-computer.liquid.trade/mcp`.
- Prediction markets are separate: use their own tools, never perp tools.

## If Co-Invest is unavailable

- No Computer connection: say so and guide the user to connect
  `https://coinvest-computer.liquid.trade/mcp` with Liquid OAuth. Do not
  place the trade through another endpoint.
- A needed tool is missing: say this connection cannot do it.
