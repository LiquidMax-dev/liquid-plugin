---
name: coinvest-allocate
description: "Build a multi-position allocation on Liquid with plan_portfolio: collect risk tolerance, time horizon and asset classes, then present one sized basket and place it or hand over a review link as this connection allows. Triggers on: build me a portfolio, plan a portfolio, how should I deploy my balance, allocate my balance, balanced book across stocks gold and crypto. Places nothing without an explicit request."
license: MIT
---

# Co-Invest allocation

Turn an allocation request into one proposed basket from `plan_portfolio`, then stop for the user's decision. A single trade is not an allocation; use the trade workflow for that.

## Workflow

1. Read `paper_trading_status` so the plan is labeled live or paper, and `get_portfolio` for the balance and existing positions.
2. Collect three answers the way the `plan_portfolio` description requires: where it requires the host's native question UI, use it and never a numbered list in chat; where it allows chat, ask in chat:
   - risk tolerance: `conservative`, `moderate` or `aggressive`;
   - time horizon: `intraday`, `swing_week` or `position_long_term`;
   - asset classes, one or more of `crypto`, `equities`, `commodities`, `indices`, `fx`.

   Do not ask about the balance.
3. Call `plan_portfolio` once with those answers, plus any leverage cap, themes and a one-line `user_intent` the user gave.
4. Write a short thesis, then prepare the basket. If the description of `plan_portfolio` names `suggest_trades_batch`, call it once with the thesis and every leg. Present each leg's asset, side, notional and leverage, and a short risk summary. Keep current holdings apart from proposed legs.
5. End by asking whether to place the basket. Branch on the live tool list:
   - `execute_orders_batch` is described as internal or called by a confirmation control: never call it. The basket is placed only when the user confirms the returned `suggest_trades_batch` proposal with its own confirmation control; a typed "yes" in chat does not place it and the agent must not call the executor after one. If the host shows no confirmation control, say this connection cannot place it from chat.
   - `execute_orders_batch` takes `confirmed`: place it only after the user approves the exact returned legs and execution mode, with `confirmed=true`.
   - `execute_orders_batch` has no `confirmed`: it runs when called, so call it once only after an explicit yes to placing this basket.
   - No executor: the review link from `suggest_trades_batch` is the result. The user finishes in Liquid.

## Tools

- `plan_portfolio`: research bundle and sizing rules from the three answers. It has no amount input and assumes the whole available balance. Say so when presenting the plan.
- `suggest_trades_batch`: one basket proposal of 2 to 8 legs (the schema limit). Scaling a leg changes the terms and needs a new proposal.
- `execute_orders_batch`: place the reviewed basket. Where it takes `confirmed`, copy the returned legs, `executionMode` and thesis unchanged, generate one stable `idempotencyKey` for this basket and reuse it for reconciliation, and add no proposal-only fields such as `requestedLeverage`.
- `get_portfolio`: balance, mode and current positions before and after.
- `paper_trading_status`: live or paper, read before the plan and before placing.

## Rules

- A plan is a proposal, not an order. Never describe it as executed.
- A tool whose description marks it internal or do-not-call is called only as that description allows; the basket then needs the user's confirmation through the returned proposal's own control, never a typed "yes" followed by an executor call.
- Where `execute_orders_batch` takes `confirmed`, `confirmed=true` follows the user's approval of the exact basket in chat. A changed leg, size or leverage needs a new proposal and a new approval.
- Place a basket with one `execute_orders_batch` call, never one order per leg.
- A saved automation policy never supplies `confirmed=true`.
- Never silently raise a size; follow any minimum the tool reports.
- Report each leg's returned outcome. Accepted or pending is not filled. On an error, timeout or unknown result, read `get_portfolio` and open orders, and retry only on a new user request.
- Never switch live or paper mode to run a plan.
- Do not promise charts or visuals. Report the returned data.

## If something is missing

- No Co-Invest connection: say so and point the user to the host's Co-Invest connector settings.
- The description requires a native question UI and the host has none: say this workflow is unavailable here and stop. Do not invent the answers.
- `plan_portfolio` is absent or fails: report it. Do not present a hand-made allocation as the tool's output. A missing executor means the review link is the result; do not switch endpoints or modes.
