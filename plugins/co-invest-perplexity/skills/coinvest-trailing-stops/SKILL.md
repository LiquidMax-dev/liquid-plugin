---
name: coinvest-trailing-stops
description: "Set, check, update or remove a native trailing stop-loss on an open Hyperliquid perp position with Co-Invest, previewing the exact trigger price before anything is placed. Triggers on: trailing stop, trailing stop loss, trail my position, set a trailing stop, is my trailing stop running, update trailing stop, remove trailing stop, cancel trailing stop."
license: MIT
---

# Co-Invest trailing stops

Use this skill to place, read, change or remove a trailing stop on an open Hyperliquid perp position, live or paper according to the connection's current trading mode. The percent the user gives is a share of margin, not a price move, so every preview must show the resulting trigger price before approval.

## Workflow

1. Read the position with `get_portfolio` to get the market, side, entry and leverage. The market must be an open Hyperliquid perp, including HIP-3 markets such as `xyz:BTC`; other venues are refused.
2. Ask only for what is missing: the market, `percent`, and optionally `sizePercent` and `activationPrice`.
3. Explain the unit in one line: `percent` is the equity (return on margin) retracement the user will give back. The price retracement is `percent` divided by leverage, fixed at placement. Example from the tool description: entry 100, 10x leverage, `percent` 20 is a 2% price retracement, so the stop sits at 98, and at 107.8 once price has reached 110.
4. Call `set_trailing_stop` with `confirmed` omitted or false to get the preview. Show the position, mark, price retracement, trigger price at the start price and quantity to close exactly as returned, and state the trigger price in your own words before asking for approval.
5. After the user approves those unchanged terms, call again with the same arguments, `confirmed=true` and the `executionMode` copied from the preview. A changed term needs a new preview.
6. Confirm the final state with `view_trailing_stop` and report what it returns.
7. To remove, call `remove_trailing_stop` without `confirmed` to show what would be removed, then with the same symbol, `confirmed=true` and the `executionMode` from the preview after approval, then check with `view_trailing_stop`.

## Tools

- `get_portfolio`: open positions, side, entry, leverage and balances before choosing a stop.
- `set_trailing_stop`: set or update a stop. Preview first, then `confirmed=true`.
- `view_trailing_stop`: read-only state: phase (waiting_activation, active or none), equity percent, price retracement, quantity, activation price, best price, trigger price, order id.
- `remove_trailing_stop`: remove the stop. Preview first, then `confirmed=true`.

## Rules

- Approval: `set_trailing_stop` and `remove_trailing_stop` change state only with `confirmed=true`, sent only after the user approves the unchanged preview in chat. If a connection's tool has no `confirmed` argument, it runs when called, so call it only for an explicit request that names the change, and state the action in one line first.
- `percent` must be above 0 and below 100. Never change it silently; report a rejection as given.
- `sizePercent` defaults to 100 on a new stop and is fixed as a quantity at placement; a partial stop must be at least $10 notional. On an update, an omitted `sizePercent` keeps the current quantity.
- `activationPrice`: omit it to keep an activation not yet reached, pass null to clear it, or a number to set it. A different activation is refused once tracking has started.
- An update places the new stop and then cancels the old one, and tracking restarts from the current mark.
- Removal cancels every trailing stop order on the market, including one placed in Hyperliquid's own app. Say so before asking for approval.
- A live stop keeps working if the trading approval later expires, but changing or removing it needs a valid approval.
- On an error, timeout or unknown result, read `view_trailing_stop` and `get_portfolio` before saying what happened. Do not retry unless the user asks again.
- Label every result as live or paper using the returned `executionMode`.

## If something is missing

- No Co-Invest connection: say so and point the user to the host's Co-Invest connector settings.
- A trailing-stop tool is absent from the live tool list: say this connection cannot do it. Do not switch endpoints or modes, and do not simulate a trailing stop with other orders.
- No open position on the market: say so and stop. Opening one is a separate request.
