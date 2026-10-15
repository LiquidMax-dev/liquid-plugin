---
name: liquid-tp-sl
description: "Add or move the take-profit and stop-loss on an open position."
license: MIT
---

# Set TP/SL

Add or move the take-profit and stop-loss on an open position.

## Core capabilities

- Adds a take-profit, a stop-loss or both to an open position
- Moves existing levels and leaves the one you do not name unchanged
- Checks that the levels sit on the correct side of the position

## Just say to your agent

- "Set a stop-loss at 2,300 on my ETH-PERP position."
- "Move the take-profit on BTC-PERP to 115,000 and keep the stop."

## When to use

The user explicitly asks to add or change a take-profit or stop-loss on a position that is already open.

## Setup

1. Install the SDK: `pip install liquidtrading-python` (PyPI 0.1.3).
2. Create an API key at https://app.liquid.trade/?api_access=open (Settings → API Access). This skill needs scope READ+TRADE.
3. Export `LIQUID_API_KEY` and `LIQUID_API_SECRET` in the environment. Never print, log or echo the secret.
4. Install all Liquid API skills: `npx skills add LiquidMax-dev/liquid-plugin --skill liquid-markets liquid-price liquid-orderbook liquid-chart-pattern liquid-account liquid-positions liquid-open-orders liquid-market-order liquid-limit-order liquid-bracket-order liquid-tp-sl liquid-close-position liquid-cancel-orders liquid-leverage liquid-price-alert liquid-position-guard -y`
5. Create the client with the edge URL and no retries:

```python
import os
from liquidtrading import LiquidClient

client = LiquidClient(
    api_key=os.environ["LIQUID_API_KEY"],
    api_secret=os.environ["LIQUID_API_SECRET"],
    base_url="https://api-public.liquidmax.xyz",
    max_retries=0,
)
```

## SDK call

```python
positions = client.get_positions()   # confirm the position and its side first
result = client.set_tp_sl("ETH-PERP", sl=2300.0)   # tp=None leaves the take-profit unchanged
# result.tp and result.sl are dicts (or None)
```

## Present the result

At least one of `tp` or `sl` must be given. For a long, `sl` must be below the mark price and `tp` above; reverse for a short. The SDK does not return the levels currently set, so ask the user for the old level if they want to compare. `NotFoundError` means there is no open position for that symbol. Report the returned `tp` and `sl`.

## Before every call

Restate the order (symbol, side, USD size, leverage, order type, TP/SL) and get the user's explicit confirmation before each call. Never invent a size, price, leverage or level; if the user did not give one, ask.

## If a call times out or fails on the network

Never resend an order call after a timeout or a network error (`TimeoutError`, `ConnectionError`): the order may have been placed. Read open orders (`client.get_open_orders()`) and positions (`client.get_positions()`) first and report what actually happened.

## Request cost

One request to read the position, one for the update. Every request counts against the account's allowance, trades included; a request that fails with a 5xx is not charged. Free plan: 1,000 requests once, 10 a minute, three keys; paid plans raise the requests and the per-minute limit. All keys share the account's limits.

- `429 RATE_LIMIT_EXCEEDED`: wait for `Retry-After` (`RateLimitError.retry_after`), then try again once.
- `429 API_QUOTA_EXCEEDED`: stop and tell the user the allowance is used up.
- Do not loop on errors.
