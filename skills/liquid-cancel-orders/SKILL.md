---
name: liquid-cancel-orders
description: "Cancel one resting order by id, or all of them."
license: MIT
---

# Cancel Orders

Cancel one resting order by id, or all of them.

## Core capabilities

- Cancels one resting order by its id
- Cancels every open order in one request
- Lists what will be cancelled before you confirm

## Just say to your agent

- "Cancel my resting BTC-PERP limit order."
- "Cancel all my open orders on Liquid."

## When to use

The user explicitly asks to cancel one order or all orders.

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
orders = client.get_open_orders()       # show these to the user first
client.cancel_order("ORDER_ID")         # returns True
count = client.cancel_all_orders()      # returns the number cancelled
```

## Present the result

Show the orders that will be cancelled (id, symbol, side, size, price) before the call. Report `True` or the cancelled count. `NotFoundError` on a single cancel usually means the order already filled or was cancelled: read open orders and positions to say which.

## Before every call

Restate the order (symbol, side, USD size, leverage, order type, TP/SL) and get the user's explicit confirmation before each call. Never invent a size, price, leverage or level; if the user did not give one, ask.

## If a call times out or fails on the network

Never resend a mutation after a timeout, network error, or any 5xx response, including a transient error message that says to retry: the outcome may be unknown and the request may have taken effect. Reconcile with read-only calls such as `client.get_open_orders()` and `client.get_positions()` and report the evidence. If those reads do not settle the outcome, say it remains unknown and do not resend.

## Request cost

One request to list orders, one per cancel (`cancel_all_orders` is a single request). Every request counts against the account's allowance, trades included; a request that fails with a 5xx is not charged. Free plan: 1,000 requests once, 10 a minute, three keys; paid plans raise the requests and the per-minute limit. All keys share the account's limits.

- `429 RATE_LIMIT_EXCEEDED`: wait for `Retry-After` (`RateLimitError.retry_after`), then try again once.
- `429 API_QUOTA_EXCEEDED`: stop and tell the user the allowance is used up.
- Do not loop on errors.
