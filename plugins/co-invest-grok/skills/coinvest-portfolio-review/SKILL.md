---
name: coinvest-portfolio-review
description: "Review a Liquid account with Co-Invest: balances, account mode, open positions with TP/SL, resting orders, prediction positions, past trades and transfers, and allocation, in live or paper mode. Triggers on: show my portfolio, what are my positions, how am I doing, open orders, my PnL, trade history, recent activity, my account address. Read-only."
license: MIT
---

# Co-Invest portfolio review

Summarize the user's Liquid account from the connected Co-Invest tools, labeling every trading figure live or paper. Referral figures, and any balance whose description says it is real regardless of paper mode, are real account data. This skill is read-only and never switches mode, places or cancels anything.

## Workflow

1. Read the mode first with `paper_trading_status`, so every figure is labeled live or paper.
2. Call only what the question needs:
   - Balances, positions and TP/SL coverage: `get_portfolio`. Report each holding as the result types it: a position on `NVDA` or `xyz:NVDA` is a perpetual, not company shares, and an `EQ` token such as `EQNVDA` is a spot token. If the user asks about tokenized-stock tokens and the result does not list them, say the result did not show them, not that the user holds none.
   - Resting orders and TP/SL triggers: `view_open_orders`. Orders are not positions.
   - Prediction-market holdings: `view_prediction_positions`, unless `get_portfolio` already listed them; do not list a holding twice.
   - Past perpetual positions: `get_position_history`.
   - Trades, deposits, withdrawals and transfers as one timeline: `get_transaction_history`.
   - Allocation by notional, only when asked for a chart or breakdown: `show_portfolio_chart`.
   - The trading account address: `get_account`.
3. Present positions with side, size, entry, mark, unrealized PnL, leverage and liquidation price where returned. Keep holdings and orders in separate lists.

## Tools

- `get_portfolio`: current balances, account mode, positions and TP/SL coverage. Earn and staking balances are outside it.
- `view_open_orders`: resting perpetual limit orders and position-level TP/SL triggers. Where its description says so, it adds a protection-coverage readback and excludes prediction orders. For resting prediction orders, use `view_prediction_orders` with `status=open`.
- `get_position_history`: recent perpetual position lifecycles from a bounded fill window; `status` defaults to closed, `limit` 1 to 50 (default 10), `includeFills` adds up to 100 fills.
- `get_transaction_history`: newest-first timeline of fills, deposits, withdrawals, transfers and prediction trades; `limit` defaults to 10, max 100; `type` filters to trades, transfers or predictions.
- `show_portfolio_chart`: allocation by notional value.
- `view_prediction_positions`: prediction-market positions and outcome quantities.
- `paper_trading_status`: whether paper mode is on for this wallet or, where its description says so, that this connection is permanently paper-only.
- `get_account`: the public trading account address. It is not a deposit or bridge destination.
- `get_earn_balance`: Earn vault holdings, pending requests, APY and TVL, read-only, when the user asks about Earn.
- `get_staking`: HYPE staking balance and delegations, read-only, when the user asks what is staked.
- `refer`: the user's referral link and statistics, only when they ask for them.

## Rules

- Earn and staking balances are not in `get_portfolio`, and `get_transaction_history` does not list Earn vault activity. Read them with `get_earn_balance` and `get_staking` when the user asks and those tools are listed.
- History is recent coverage, not all-time. Say what window the result states. An `open` lifecycle means open at the last observed fill; use `get_portfolio` for the current position.
- While paper mode is on, trade and prediction rows are simulated. Deposit, withdrawal and transfer rows, where the result has them, are real wallet activity. If the tool description says transfers have no paper ledger, an empty transfer result says nothing about real deposits or withdrawals; say this connection cannot read them.
- Do not say whether realized PnL is net or gross unless the result says.
- `get_position_history` takes an optional `symbol` that is exact and case-sensitive, including prefixes such as `xyz:`. `get_transaction_history` has no symbol filter, only `type`.
- A genuinely empty result, partial coverage and a failed read are different; say which one you saw.
- Do not give closing, hedging or rebalancing as an instruction. Offer it, and treat any resulting trade as a separate request.
- Never ask the user for a key, token or wallet secret.

## If something is missing

- No Co-Invest connection: say so and point the user to the host's Co-Invest connector settings.
- Sign-in or account errors: report them as returned.
- A tool is absent from the live list: say this connection cannot do that, and do not switch endpoints or modes.
