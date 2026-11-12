---
name: liquid-price
description: "Current mark price for any Liquid market, plus 24h change, volume and funding when available."
license: MIT
---

# Price Check

Current mark price for any Liquid market, plus 24h change, volume and funding when available.

## Core capabilities

- Returns the current mark price for any Liquid market
- Adds 24h change and 24h volume when the market reports them
- Adds the funding rate when available and says so when it is not

## Just say to your agent

- "What is the BTC price on Liquid right now?"
- "Give me the mark price, 24h change and funding for ETH-PERP."

## When to use

The user asks for the current price, 24h move, volume or funding of a market.

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
t = client.get_ticker("BTC-PERP")
# t.mark_price, t.volume_24h, t.change_24h, t.funding_rate
```

## Present the result

Lead with `mark_price`. `volume_24h`, `change_24h` and `funding_rate` can be `None`: print "unavailable" for them, never estimate. State the unit you are showing for change and funding exactly as the API returns it; do not reformat it as a percentage unless you know the scale. A `SymbolNotFoundError` means the symbol is wrong: run the `liquid-markets` skill once to find it instead of guessing.

## Request cost

One request per symbol checked. Every request counts against the account's allowance, trades included; a request that fails with a 5xx is not charged. Free plan: 1,000 requests once, 10 a minute, three keys; paid plans raise the requests and the per-minute limit. All keys share the account's limits.

- `429 RATE_LIMIT_EXCEEDED`: wait for `Retry-After` (`RateLimitError.retry_after`), then try again once.
- `429 API_QUOTA_EXCEEDED`: stop and tell the user the allowance is used up.
- Do not loop on errors.
