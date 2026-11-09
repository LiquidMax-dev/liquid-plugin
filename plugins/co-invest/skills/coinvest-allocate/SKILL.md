---
name: coinvest-allocate
description: "Build a multi-position allocation on Liquid with Co-Invest's plan_portfolio: collect risk tolerance, time horizon, and asset classes, then present a sized basket. Triggers on: build me a portfolio, how should I deploy my balance, suggest a few trades, balanced book across stocks gold and crypto. Places nothing without an explicit request."
license: MIT
---

# Co-Invest allocation

Turn an allocation request into one sized plan from `plan_portfolio`, then
stop for the user's decision.

## Workflow

1. Confirm the request is a multi-position allocation. A single trade goes to
   the trade workflow instead.
2. Read `paper_trading_status` so the plan is labeled live or paper.
3. Collect three answers through the host's native structured question UI:
   - risk tolerance: `conservative`, `moderate`, or `aggressive`;
   - time horizon: `intraday`, `swing_week`, or `position_long_term`;
   - asset classes, one or more of `crypto`, `equities`, `commodities`,
     `indices`, `fx`.

   Do not ask about the balance; the tool reads it.
4. Call `plan_portfolio` once with those answers, plus any leverage cap,
   themes, and a one-line `user_intent` the user gave.
5. Present the basket: a short thesis, each leg with asset, side, notional,
   and leverage, and a short risk summary. Keep current holdings separate
   from proposed legs.
6. End by asking whether to place the basket. Place it only after an
   explicit yes, through one `execute_orders_batch` call, following the trade
   workflow's pre-trade checks.

## Defaults

- Endpoint: Co-Invest Computer, `https://coinvest-computer.liquid.trade/mcp`.
- Capital: `plan_portfolio` plans to deploy the full available balance. Say
  so when presenting the plan. A smaller amount is an override the user must
  state; then scale every leg and show the new notionals before placing.
- Leverage: the plan's values, capped by any limit the user gave.

## If the host has no native question UI

`plan_portfolio` requires the three answers from a native structured question
UI and forbids asking them as a numbered list in chat. If the host has no such
UI, say that this workflow is unavailable in this host and stop. Do not invent
the answers or call the tool without them.

## If Co-Invest is unavailable

- No Co-Invest server connected: say so and guide the user to connect
  `https://coinvest-computer.liquid.trade/mcp` with Liquid OAuth.
- `plan_portfolio` missing or failing: report it. Do not replace it with a
  hand-made allocation presented as the tool's output.

## Guardrails

- A plan is a proposal, not an order. Never describe it as executed.
- Never switch live or paper mode to run a plan.
