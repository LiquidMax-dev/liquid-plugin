---
name: coinvest-paper-trading
description: "Practice on Liquid with Co-Invest paper trading: check whether paper mode is on, switch it on or off, and reset the simulated account. Triggers on: paper trade, practice mode, simulate, try without real money, reset my paper account, fresh paper balance, go back to live, am I paper trading."
license: MIT
---

# Co-Invest paper trading

Paper mode makes this connection's account reads and trading actions use Liquid's paper simulator instead of real funds. This skill checks and changes that mode only when the user asks.

## Workflow

1. Read `paper_trading_status` first and report the mode it returns.
2. Change the mode only on an explicit request:
   - "paper trade", "practice", "simulate": `enable_paper_trading`.
   - "go live", "stop paper trading": `disable_paper_trading`. Say first that later orders may use real funds; where its description says this connection places no live orders, say live orders are placed only in Liquid.
   - "reset my paper account", "start over": `reset_paper_account`. Say first what its description lists it clears (positions, orders, fills, and the balance; where stated, funding history, leverage overrides and a reset to 10,000 USD), that it cannot be undone, and follow any separate host approval it asks for. It runs only while paper mode is on.
3. Read `paper_trading_status` again and report the mode it now shows.
4. Label every later number as paper while the mode is on.

## Tools

- `paper_trading_status`: whether paper mode is on for this wallet.
- `enable_paper_trading`: turn paper mode on for this wallet; calling it twice keeps it on. On a permanently paper-only connection it only confirms that and changes no wallet setting.
- `disable_paper_trading`: return to live account data; calling it when paper is off does nothing.
- `reset_paper_account`: restore the simulated account to its starting state; refuses in live mode.

## Rules

- These are direct tools and take no `confirmed` argument: the user's explicit request is the approval, so call each once per request and never as a side effect of another task.
- Where the descriptions say so, the paper account is keyed by wallet on a shared simulator: enabling, disabling or resetting here also applies wherever else this wallet trades paper, including other Liquid MCP connectors. A reset always applies to the wallet's shared paper account and also wipes paper positions and orders open elsewhere.
- Paper mode does not switch the Liquid web app; orders placed there may use real funds. Say so if the user assumes otherwise.
- Some live-only actions, such as spot orders, are refused in paper mode. Report the refusal as given.
- A request for a paper trade while the account is live is not a request to switch modes: ask whether to turn paper mode on, and switch only on a yes. A request to switch to paper mode is the approval.
- Never report a paper balance or PnL as real, and never reuse live figures as paper figures.
- On a connection that is permanently paper-only, `paper_trading_status` says so and there is no way to go live from here; report that instead of trying to switch.

## If something is missing

- No Co-Invest connection: say so and point the user to the host's Co-Invest connector settings.
- `disable_paper_trading` is absent from the live list: this connection cannot leave paper mode. Say so and do not switch endpoints.
- The status read fails: do not place any order until the mode is known.
- Any other tool is absent: say this connection cannot do that, and do not switch endpoints or modes.
