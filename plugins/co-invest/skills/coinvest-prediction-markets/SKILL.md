---
name: coinvest-prediction-markets
description: "Search prediction markets, read odds and order books, view prediction positions and orders, and, where this connection has the write tools, buy, close or cancel with a preview first. Triggers on: bet on, odds, prediction market, will X win, yes or no market, fade a team, my prediction positions, cancel my bet, close my bet."
license: MIT
---

Use this skill for event-style prediction markets: finding a market, reading its odds, and managing bets. It reads the live tool list first, so it works on connections that can place bets and on connections that can only read.

## Workflow

1. Find the market with `search_prediction_markets`. For a sports match search by match or team names and, if useful, a category. A search can return nothing; say so and do not invent a market.
2. Note the numeric `marketID` and the `outcome_id` of the outcome the user wants to back. Pass the number as `market_id` with no `hip4:` prefix, and always pass `outcome_id`.
3. For depth, spread or a limit price only, call `show_prediction_orderbook` (`depth` 1 to 20). Do not call it just to place a market order.
4. To bet, call `execute_prediction_order` with `side=buy` and `size` in USD. Preview first (see Rules), show the exact returned terms, and wait for approval.
5. To bet against an outcome, buy the opposing outcome from the search results. `side=sell` only reduces contracts the user already holds and is rejected otherwise.
6. To exit, use `view_prediction_positions`, then `close_prediction_position` with the position's `market_id` and `outcome_id`. Omit `size` for a full close; a limit close needs `price`.
7. To cancel a resting order, use `view_prediction_orders` with `status=open`, then pass its `orderId` as `order_id`, plus its `provider`, to `cancel_prediction_order`.

## Tools

- `search_prediction_markets`: search or browse markets; returns each outcome's numeric marketID and outcome_id.
- `show_prediction_orderbook`: order book for one outcome, for depth, spread or limit pricing.
- `view_prediction_positions`: the user's prediction positions and outcome quantities.
- `view_prediction_orders`: prediction orders; `status=open` lists cancellable resting orders.
- `execute_prediction_order`: preview or place a prediction order.
- `close_prediction_position`: preview or close a prediction position, fully or partly.
- `cancel_prediction_order`: preview or cancel a resting prediction order.

## Rules

- Approval: every write tool here takes `confirmed`. Call it first with `confirmed` omitted or false to get a preview, show the exact terms, and call with `confirmed=true` only after the user approves those unchanged terms in chat. Copy the returned `executionMode` unchanged. A changed term needs a new preview.
- `size` on an order is USD notional. Prediction markets have no leverage. `price` must be strictly between 0 and 1, and is required for a limit order.
- On a close, `size` is USD converted to contracts at the execution price. A perpetual close uses coin units; a prediction close does not.
- `view_open_orders` excludes prediction orders. Use `view_prediction_orders` and `cancel_prediction_order` for them.
- Honor the outcome the user chose. Do not refuse or swap the bet because the odds look high or low.
- If a preview or order is rejected, for example for size, report the tool's message as given and never raise the size yourself.
- After a write, report the returned status as given. Do not retry on an error or unknown result; check `view_prediction_positions` and `view_prediction_orders` first and retry only on a new request from the user.
- Report returned odds and prices as data. Do not promise a chart or visual, and do not predict outcomes.

## If something is missing

- If no Co-Invest connection is available, say so and point the user to the host's Co-Invest connector settings.
- If this connection's tool list has only the read tools above, this skill is read-only: say orders cannot be placed, closed or cancelled from this connection, and offer search, odds, order book, positions and orders.
- If a tool is absent from the live list, say this connection cannot do it. Do not switch to another endpoint or mode.
