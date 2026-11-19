---
name: liquid-open-orders
description: "List resting orders with symbol, side, size and price."
license: MIT
---

# Open Orders

List resting orders with symbol, side, size and price.

## Core capabilities

- Lists every resting order on the account
- Shows symbol, side, size and limit price for each
- Gives the order id you need to cancel or look up an order

## Just say to your agent

- "What orders do I have resting on Liquid?"
- "Do I still have an open order on BTC-PERP?"

## When to use

The user asks which orders are resting, or the agent must check what is open (for example after a failed order call).

## Setup

1. Install the SDK: `pip install liquidtrading-python` (PyPI 0.1.3).
2. Create an API key at https://app.liquid.trade/?api_access=open (Settings → API Access). This skill needs scope READ.
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
orders = client.get_open_orders()
# each: order_id, symbol, side, size, price, timestamp
```

## Present the result

Table of order id, symbol, side, size and price, grouped by symbol. Show `timestamp` as returned. An empty list means nothing is resting. To cancel, use the `liquid-cancel-orders` skill.

## Request cost

One request per call to `get_open_orders`. Every request counts against the account's allowance, trades included; a request that fails with a 5xx is not charged. Free plan: 1,000 requests once, 10 a minute, three keys; paid plans raise the requests and the per-minute limit. All keys share the account's limits.

- `429 RATE_LIMIT_EXCEEDED`: wait for `Retry-After` (`RateLimitError.retry_after`), then try again once.
- `429 API_QUOTA_EXCEEDED`: stop and tell the user the allowance is used up.
- Do not loop on errors.
