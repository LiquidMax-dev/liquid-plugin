---
name: coinvest-yield
description: "Read and manage a Liquid Earn vault position and HYPE staking through Co-Invest: vault balance, APY, pending requests, deposits into the Earn vault, withdrawals from it, and staking balances, validators and rewards. Triggers on: earn vault, vault, earn balance, deposit into earn, withdraw from earn, redeem vault, yield, APY on my USDC, staking, staking rewards, validators, how much HYPE am I staking."
license: MIT
---

# Co-Invest yield

Reads the user's Earn vault position and HYPE staking, and creates Earn deposit or withdrawal requests that the user signs in Liquid. Earn and staking balances are separate from the trading balance.

## Workflow

1. For a balance, APY or "did my deposit land" question, call `get_earn_balance`. For staking, rewards or validators, call `get_staking`. Report the returned fields as given.
2. For a deposit into Earn, confirm the user explicitly asked for it and named the USDC amount. The amount is exact, minimum 1, at most 6 decimals. State the action in one line, then call `deposit_earn`. Do not check or move balances beforehand: the signing page handles a shortfall.
3. For a withdrawal from Earn, confirm the user asked and named either an exact USDC amount or the whole position. Pass exactly one of `amount` or `all: true`. State the action in one line, then call `withdraw_earn`.
4. Both writes only create a request. Give the user the returned Liquid link to open and approve; Co-Invest cannot sign. Do not say the deposit or withdrawal happened until the status is `submitted`, and `submitted` means broadcast, not settled.
5. When the user asks for an update on a request, read `get_earn_balance`, and use `_earn_pending_status` only with a `pending_id` returned in this conversation.

## Tools

- `get_earn_balance`: read-only Earn holdings, pending deposit or withdrawal, total committed, deposit lock, and the vault's APY and TVL.
- `deposit_earn`: create a deposit request for an exact USDC amount into the Earn vault. This vault deposit belongs to this skill, not to the funding skill.
- `withdraw_earn`: create a request to redeem USDC from the Earn vault back to the user's own Arbitrum wallet, not off Liquid.
- `_earn_pending_status`: internal status of one request. Call it only with a `pending_id` returned by a deposit or withdrawal in this conversation, and only when the user asks for an update. Never construct or guess an id.
- `get_staking`: read-only HYPE staking view: balances, per-validator delegations, rewards, pending unstaking. It cannot stake, unstake or redelegate.

## Rules

- Earn is a Gauntlet-managed USDC vault on Arbitrum. It is not part of the trading portfolio, and vault activity is not in the transaction history.
- Call a write only for an explicit request in this conversation that names the amount. A saved automation policy never authorizes it. If a write's schema takes `confirmed`, preview first and send `confirmed=true` only after the user approves the unchanged terms.
- Never retry automatically. On an error, timeout or unknown result, read `get_earn_balance` to reconcile and ask before calling again. An expired request cannot be resumed; a new one needs a new user request.
- A failed preparation can still leave USDC moved to the user's Arbitrum wallet by a top-up, so say what the status returned and nothing more.
- Withdrawals can settle after they are submitted. Do not promise a time.
- Say nothing about how paper mode affects Earn unless the tool description states it; where `get_earn_balance` says it reports real holdings regardless of paper mode, say Earn amounts are real.
- Do not recommend a deposit size or promise a return; quote the APY returned.

## If something is missing

- No Co-Invest connection: say so and point to the host's Co-Invest connector settings.
- A tool is absent from the live tool list, for example the deposit and withdrawal tools: say this connection cannot do it, offer the read tools that exist, and do not switch endpoints or modes.
