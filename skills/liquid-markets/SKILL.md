---
name: liquid-markets
description: "List the perpetual markets you can trade on Liquid with their symbol and maximum leverage."
license: MIT
---

# Liquid Markets

List the perpetual markets you can trade on Liquid with their symbol and maximum leverage.

## Core capabilities

- Lists every market the API can trade, with its symbol and ticker
- Shows each market's maximum leverage and size decimals
- Filters and sorts by name or leverage so you find a market fast

## Just say to your agent

- "Which markets can I trade on Liquid with at least 20x leverage?"
- "Is there a SOL market on Liquid, and what is its maximum leverage?"

## When to use

The user asks which markets exist, whether a symbol is listed, or what leverage a market allows. Also use it to look up the exact symbol (for example `BTC-PERP`) before another skill needs one.

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
markets = client.get_markets()
# each item is a dict: symbol, ticker, exchange, max_leverage, sz_decimals
```

## Present the result

Show a compact table of symbol, ticker and `max_leverage`. `max_leverage` and `sz_decimals` can be `None`; show them as unavailable. Filter locally, never with extra requests. Cache the list for the session instead of calling again.

## Request cost

One request per call to `get_markets`. Every request counts against the account's allowance, trades included; a request that fails with a 5xx is not charged. Free plan: 1,000 requests once, 10 a minute, three keys; paid plans raise the requests and the per-minute limit. All keys share the account's limits.

- `429 RATE_LIMIT_EXCEEDED`: wait for `Retry-After` (`RateLimitError.retry_after`), then try again once.
- `429 API_QUOTA_EXCEEDED`: stop and tell the user the allowance is used up.
- Do not loop on errors.
