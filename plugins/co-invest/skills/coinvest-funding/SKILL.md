---
name: coinvest-funding
description: "Get a Liquid account funded and ready through Co-Invest: the deposit link, a deposit address for a named token and chain, a card or app on-ramp, the trading setup link, the user's payment link and referral link. Triggers on: deposit, fund my account, add money, deposit address, on-ramp, buy with card, enable trading, set up trading, payment link, get paid, referral, refer a friend, invite friends."
license: MIT
---

# Co-Invest funding

Moves a user from no balance to ready to trade, and shares their payment and referral links. None of these tools trades; they return links, addresses or deposit options for the user to act on.

## Workflow

1. To fund the account, call `show_deposit` and show what it returns plainly. It does not move funds.
2. If the user names both a token and a chain, call `generate_deposit_address`. If either is missing, use `show_deposit` instead. Show the returned address, chain and the `direct` flag as given.
3. If the user asks to deposit a specific fiat amount by card or app and `create_onramp_session` is a normal tool on this connection, call it with the amount (2 to 1,000,000) and method, then show the returned URL plainly. Follow that tool's own description on this connection. If it is marked INTERNAL or do not call directly, do not call it; use `show_deposit` and let the user pick in the deposit view.
4. If trading is blocked by setup, or the user asks to enable trading, call `enable_trading` and show the returned link. It does not enable trading by itself; the user finishes setup in Liquid. Where its description says this connection cannot execute live trades, say that setup does not change that.
5. For a payment link call `payment_link`; for a referral link and stats call `refer`. Report what they return.

## Tools

- `show_deposit`: the deposit link or options for funding by card, other apps or wallet transfer.
- `generate_deposit_address`: one address for one token on one chain. Tokens are USDC, USDT, BTC, ETH, SOL on a chain from the schema's `chain` list; where the description lists chains per token, follow it. Other tokens or chains are refused.
- `create_onramp_session`: a hosted on-ramp URL for a fiat amount, where this connection allows calling it directly.
- `enable_trading`: checks account readiness and returns the setup link.
- `get_account`: the public address of the trading account, for identification only.
- `payment_link`: the user's public Liquid profile link where others can send them USDC.
- `refer`: the user's referral link and referral statistics.

## Rules

- Never present the trading account address from `get_account` as a deposit address. It is not a deposit or bridge destination.
- Do not guess a token or chain, and do not call `generate_deposit_address` for a general "how do I deposit" question.
- A deposit into the Earn vault is not funding; the yield skill owns that.
- Before sharing a payment link, say that it opens the user's public profile page, which also shows their trading activity.
- Addresses with `direct` false are bridge addresses. Say so and do not describe them as the user's own wallet.
- These tools take no order approval, but never call one the user did not ask for, and do not retry on an error without a new request.
- Do not state deposit times, fees or limits that the tool results do not return.

## If something is missing

- No Co-Invest connection: say so and point to the host's Co-Invest connector settings.
- A tool is absent from the live tool list: say this connection cannot do it, offer what the remaining tools return, and do not switch endpoints or modes.
