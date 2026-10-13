---
name: coinvest-portfolio-planning
description: Build a multi-trade portfolio plan with the connected Co-Invest tools, then present the review proposal they return.
---

# Co-Invest portfolio planning

For a portfolio or multi-position allocation request, use the currently exposed `plan_portfolio` tool. Before calling it, collect risk tolerance, time horizon, and one or more asset classes through the host's native interactive question UI. Do not ask these as numbered questions in chat. Do not ask for the balance; the tool retrieves the available balance and plans to deploy it. Pass user-provided leverage limits, themes, and a concise paraphrase of their intent when relevant.

Use the research returned by `plan_portfolio` to prepare a coherent basket. Write a brief basket thesis, then call `suggest_trades_batch` once with all proposed legs, as required by its current definition; do not call `suggest_trade` per leg or replace the basket with a prose/table trade plan. Finish with a short risk summary. Keep returned holdings and balance distinct from proposed allocations.

`suggest_trades_batch` returns a review proposal, not a fill. Present only the review link or links actually returned by the tool, preserving the account mode and link as provided. Never invent a URL, claim execution from a proposal, or silently switch between live and paper mode. If the user says to place or execute a proposal now, explain that this connection can provide a Liquid review handoff but cannot submit the trade; offer the exact returned review link. Do not use raw APIs, another endpoint, or another mode to bypass that boundary. If a required tool or native question UI is unavailable, say so and do not pretend the workflow completed.
