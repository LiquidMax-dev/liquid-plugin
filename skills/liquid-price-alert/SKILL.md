---
name: liquid-price-alert
description: "Watch a market and alert when price crosses your level; states how many requests the watch uses per day."
license: MIT
---

# Price Alert Watch

Watch a market and alert when price crosses your level; states how many requests the watch uses per day.

## Core capabilities

- Watches a market and alerts when price crosses your level
- States how many requests the watch uses per day before it starts
- Refuses intervals under 10 seconds and backs off on rate limits

## Just say to your agent

- "Tell me when BTC-PERP goes above 110,000."
- "Watch ETH-PERP and alert me if it drops below 2,300, checking every 2 minutes."

## When to use

The user asks to be told when a market crosses a price level.

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
import time
interval = 60      # seconds; never below 10
while True:
    t = client.get_ticker("BTC-PERP")
    if t.mark_price >= 110000.0:      # use <= for a drop below the level
        break                          # alert the user, then stop
    time.sleep(interval)
```

## Present the result

Before starting, ask for the market, the level, the direction and the interval (default 60 s) and state the cost: requests per day = 86,400 / interval per market (1,440 at 60 s). For one watched market, estimated lifetime in seconds = remaining requests x interval; a fresh Free allowance of 1,000 requests lasts about 16 hours at 60 s. Refuse an interval under 10 s. Stop after the alert fires, when the user says stop, or after 3 failed checks in a row. On `RATE_LIMIT_EXCEEDED` wait for `Retry-After`; on `API_QUOTA_EXCEEDED` or any other 4xx stop and tell the user. A 5xx is not charged: skip that check and continue.

## Request cost

One request per check. At the default 60 s interval that is 1,440 requests per day per market watched. Every request counts against the account's allowance, trades included; a request that fails with a 5xx is not charged. Free plan: 1,000 requests once, 10 a minute, three keys; paid plans raise the requests and the per-minute limit. All keys share the account's limits.

- `429 RATE_LIMIT_EXCEEDED`: wait for `Retry-After` (`RateLimitError.retry_after`), then try again once.
- `429 API_QUOTA_EXCEEDED`: stop and tell the user the allowance is used up.
- Do not loop on errors.
