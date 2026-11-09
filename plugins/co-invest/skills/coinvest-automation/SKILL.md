---
name: coinvest-automation
description: "Set up, check, and stop Co-Invest Computer's bounded automated trading on Liquid: a per-order notional cap and an expiry the user sets, inside which the agent may place orders without asking each time. Triggers on: trade for me, automate my strategy, let the agent trade, automation status, stop automated trading."
license: MIT
---

# Co-Invest automated trading

Automation lets the agent place orders without a per-order request, only
inside a policy the user set explicitly on Co-Invest Computer.

## Enable

1. Read `automated_trading_status` and `paper_trading_status`.
2. Get the bounds from the user. Do not infer them from a vague request:
   - **Maximum notional per order**, in USD. Required. If the user did not
     give a number, ask.
   - **Expiry.** The tool defaults to 7 days (10080 minutes), which is also
     the maximum. State the expiry and get the user's agreement to it.
   - The strategy: the user's rules, or an explicit delegation such as
     "entry and exit logic is up to you".
3. Restate the policy in one line, with the mode, then call
   `enable_automated_trading` with `maxOrderNotional` and
   `expiresInMinutes`.
4. Read `automated_trading_status` back and report the active bounds and
   expiry it returns.

## Acting under a policy

- Before each materially different action, read `automated_trading_status`.
  Act only when the policy is active, unexpired, and covers the order.
- Place an order only when current tool data supports a clear thesis.
  Otherwise do nothing and say why.
- Stay inside the notional cap on every order, including each leg of a
  batch.
- Follow the trade skill's order-term, mode, and outcome rules (the
  `coinvest-trade` skill when installed).

## Stop

On "stop", "pause", or "turn off automation", call
`disable_automated_trading`, then read `automated_trading_status` back and
report it.

## Defaults

- Endpoint: Co-Invest Computer, `https://coinvest-computer.liquid.trade/mcp`.
  Main's tools do not provide Computer automation.
- Scheduling: the policy bounds orders the agent places; it is not itself a
  scheduler. Do not infer one, and do not promise monitoring the host does
  not run.
- Enforcement: the server checks every order against the active policy before
  execution. Still check the bounds yourself before each call.

## If Co-Invest is unavailable

- No Computer connection, or the status read fails: do not act autonomously.
  Say so and guide the user to connect
  `https://coinvest-computer.liquid.trade/mcp` with Liquid OAuth.

## Guardrails

- Installing this skill is not consent to automation.
- Never create or widen a policy without the user's explicit numbers.
- Never promise profit.
