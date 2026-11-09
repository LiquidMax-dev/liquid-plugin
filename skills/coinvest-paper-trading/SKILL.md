---
name: coinvest-paper-trading
description: "Practice on Liquid with Co-Invest paper trading: check the mode, switch paper mode on or off, reset the simulated account, and trade with virtual funds. Triggers on: paper trade, practice, simulate, try without real money, test my strategy, reset paper account, go back to live."
license: MIT
---

# Co-Invest paper trading

Paper mode routes every Co-Invest tool on this connection to Liquid's paper
simulator: orders, closes, TP/SL, positions, and balances are simulated.

## Workflow

1. Read `paper_trading_status` first.
2. Change the mode only on the user's explicit request:
   - "paper trade", "practice", "simulate": `enable_paper_trading`.
   - "go live", "turn off paper": `disable_paper_trading`. Before calling it,
     say that later orders will use real funds.
   - "reset my paper account": `reset_paper_account`. It closes every paper
     position, cancels paper orders, clears paper history, and restores the
     default balance. It cannot be undone; say so before calling it. It runs
     only while paper mode is on.
3. Read `paper_trading_status` again and report the mode it returns.
4. Trade with the same pre-trade checks as live (the `coinvest-trade` skill
   when installed), and label every result as paper.

## Defaults

- Endpoint: Co-Invest Computer, `https://coinvest-computer.liquid.trade/mcp`.
- Mode: unchanged unless the user asks. A paper request while the account is
  live is a question to confirm, not permission to switch silently.

## Scope of the setting

- Paper mode is keyed to the wallet on this MCP connector and can be shared by
  that wallet's other sessions on it.
- It does not switch the Liquid web app or another MCP endpoint. Do not tell
  the user it does.

## If Co-Invest is unavailable

- No Computer connection: say so and guide the user to connect
  `https://coinvest-computer.liquid.trade/mcp` with Liquid OAuth.
- The status read fails: do not place any order until the mode is known.

## Guardrails

- Never toggle or reset paper mode as a side effect of another task.
- Never report a paper balance or PnL as real.
