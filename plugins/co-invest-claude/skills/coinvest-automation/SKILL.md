---
name: coinvest-automation
description: "Save, read and clear a Co-Invest automated trading policy: a per-order notional cap and an expiry the user sets. Explains whether this connection lets in-policy orders run without asking, or only stores the policy. Triggers on: trade for me, automate my strategy, let the agent trade, autopilot, automation status, stop automated trading."
license: MIT
---

# Co-Invest automated trading

A saved policy holds a per-order notional cap and an expiry the user chose. What it authorizes depends on this connection, so read the tool descriptions and say plainly which case applies before relying on it.

## Workflow

1. Read `automated_trading_status` and `paper_trading_status`.
2. Read the description of `enable_automated_trading` on this connection and decide the case:
   - Case A: the description says that after enabling, order tools may be used for in-policy orders without another approval per order, and the order tools take no `confirmed` argument.
   - Case B: the description says the policy is saved data only, or the order tools take `confirmed`. Then every order still needs its own preview and approval.
   - If unclear, treat it as Case B.
3. Get the user's numbers. The cap in USD per order is required: if they did not give one, ask. Expiry is 1 to 10080 minutes (7 days, the default); use their duration. A request to save a policy with a cap is the approval to save it.
4. Call `enable_automated_trading`, then read `automated_trading_status` back and report the cap and expiry it returns. Tell the user which case applies and what it means.
5. To stop, call `disable_automated_trading`, read the status back and report it.

## Tools

- `automated_trading_status`: the saved policy. Where its description says so, it also reports whether paper trading is on, in which case executions are simulated. In Case B it reports saved data only.
- `enable_automated_trading`: save the cap and expiry; takes `maxOrderNotional` and `expiresInMinutes`.
- `disable_automated_trading`: clear the policy. In Case A this ends in-policy orders without a per-order request. In Case B its description says it does not change order behavior or cancel accepted orders.
- `paper_trading_status`: whether paper mode is on, so you can label what runs under the policy.

## Rules

- A saved policy never supplies `confirmed=true`. Where order tools take `confirmed`, preview first, show the exact terms, and send `confirmed=true` only after the user approves those terms in chat. An order tool whose description says it is internal or called only by a confirmation control is never called directly: the change happens only when the user confirms the returned proposal with its own confirmation control, and a typed "yes" in chat does not place it. If the host shows no confirmation control, say this connection cannot place it from chat.
- Case A only: an order may run without a per-order request only while `automated_trading_status` shows the policy active, unexpired and covering it. Keep every order, including each leg of a batch, inside the cap, and place one only when current data supports a clear thesis; otherwise do nothing and say why.
- Case B: say that saving the policy does not start a scheduler, authorize automated orders or bypass the order approval flow.
- Never infer or widen a cap, expiry or strategy. Never create a policy from a vague request.
- The policy is not a scheduler. Do not promise monitoring or action between turns.
- A running process may keep an older local policy until its status refreshes; report the status you read.
- Installing this skill is not consent to automation. Never promise profit.

## If something is missing

- No Co-Invest connection, or the status read fails: do not act autonomously. Say so and point the user to the host's Co-Invest connector settings.
- A tool is absent from the live list: say this connection cannot do that, and do not switch endpoints or modes.
