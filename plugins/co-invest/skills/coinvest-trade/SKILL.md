---
name: coinvest-trade
description: "Place and manage Liquid perpetual trades the user explicitly asks for: market or limit orders, take-profit and stop-loss, closes, cancels and leverage changes, in live or paper mode, with a preview or a Liquid review link where this connection requires one. Triggers on: buy, sell, long, short, open a position, close my BTC, set a stop loss, set take profit, cancel my order, change leverage."
license: MIT
---

# Co-Invest trade

Turn an explicit perpetual-trade request into the right tool call for this connection. The live tool list and schemas decide how a write is gated.

## Workflow

1. Confirm the user asked for this action in this conversation, naming asset, side and size or the change. Research or a pick is not a request.
2. Read `paper_trading_status` and `get_portfolio` to label the order live or paper and size it against real balance and positions. Never toggle the mode for a trade.
3. Collect the terms. `size` is notional USD, which is margin times leverage; ask if a dollar amount is notional or margin. Leverage comes from the user. A limit order needs the user's price. Never raise a size silently.
4. Pick the path from the live schema:
   - **Executor whose description says it is internal or called only by a confirmation control:** never call it. Call the proposal tool it names (`suggest_trade`, `modify_position`, `get_portfolio` for a close) and report the returned terms. The change happens only when the user confirms the returned proposal with its own confirmation control; a typed "yes" in chat does not place it and the agent must not call the executor after one. With no such control shown, say this connection cannot place it from chat.
   - **Executor without `confirmed`:** it runs when called. State the action in one line, then call it once.
   - **Executor with `confirmed`:** preview, show the exact returned terms, and wait for the user's approval of those unchanged terms. Then call with `confirmed=true`.
   - **No executor in the tool list:** `suggest_trade` returns a review link. The user finishes in Liquid; nothing is placed from chat.
5. Report the returned status as given; accepted is not filled.

## Tools

- `suggest_trade`: proposal for one perpetual order, and the preview where `execute_order` has none. With no executor it returns a review link.
- `execute_order`: place the order. Where it takes `confirmed`, copy `executionMode` and the listed executor fields unchanged; never pass proposal-only fields such as `sizeBasis` or `markPrice`. Send `maxSlippageBps` (1 to 500) only where the schema has it and the description's executor field list does not omit it.
- `execute_tpsl`: set, update or remove TP/SL on an open position. Where it takes `confirmed`, preview with `modify_position`.
- `modify_position`: TP/SL proposal for an open position. Send the user's exact levels.
- `close_position`: close fully, or partially with `size` in coin units or, where the schema has it, `percent`. If it takes `confirmed`, preview first with it omitted or false, then resend the previewed coin size, or previewed percent when no size was returned. If its description says it is internal, never call it: call `get_portfolio` and point the user to its own controls, or say this connection cannot close from chat.
- `close_positions_batch`: close several positions. Preview first, then for partial closes resend `closes` with each returned `resolvedSize` (coin units) or previewed `percent`; for full closes send the exact previewed symbols (`symbols` always closes in full). Never send an empty selection: that means close every position.
- `cancel_order`: cancel a resting order by id from `view_open_orders`. One matching order: cancel it if the description says the request is the approval, else name it and cancel once the user approves. Several: ask which. Cancel once per request.
- `view_open_orders`: resting orders and TP/SL triggers. Prediction orders are not listed here.
- `update_leverage`: without `targetLeverage` it only returns leverage context. Where it takes `confirmed`, first get an integer target from the user, then preview with that target, `confirmed=false` and no `validationPhase`; `validationPhase='executetime'` executes like `confirmed=true`.
- `suggest_order`: paper-only review link, not a preview for `execute_order`.
- `enable_trading`: returns the account's setup status and step for the user. It does not enable trading itself; where its description says live trades cannot run here, setup does not change that.
- `paper_trading_status`: read live or paper mode before any write.
- `close_paper_position`, `close_all_paper_positions`, `cancel_paper_order`, `set_paper_tp_sl`, `update_paper_leverage`: paper position management where the tool list has them. Announce the action, call once; they never touch a live account. Pass `symbols` to `close_all_paper_positions` unless the user asked to close every paper position.

## Rules

- A tool that takes `confirmed` gets `confirmed=true` only after the user approves the exact previewed terms in chat. A changed term needs a new preview.
- A tool without `confirmed` is called only for an explicit request that names the change, never to preview. A saved policy can stand in for the request only if `automated_trading_status` shows it active and covering the order; it never supplies `confirmed=true`.
- Where the description names one, reuse a single `idempotencyKey` for an action and its reconciliation.
- Follow the stated opening-order minimum; collateral is notional divided by leverage.
- On an error, timeout or unknown result, read `view_open_orders` and `get_portfolio` before anything else. Retry only on a new user request.
- A tool whose description marks it internal or do-not-call is called only as that description allows. For such an executor a typed "yes" in chat does not place it and the agent must not call it after one; only the returned proposal's own confirmation control does. With none shown, say this connection cannot place it from chat.
- Prediction markets and tokenized stocks use their own tools.
- Do not promise charts or visuals. Report the returned data.

## If something is missing

- No Co-Invest connection: say so and point the user to the host's Co-Invest connector settings.
- A tool is absent from the live list: say this connection cannot do it. Do not switch endpoints or modes. Pass any sign-in or setup request to the user.
