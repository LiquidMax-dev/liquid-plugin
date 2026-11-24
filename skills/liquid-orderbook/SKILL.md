---
name: liquid-orderbook
description: "Spread, best bid and ask, depth within 0.5% and 1% of mid, and bid/ask imbalance for a market."
license: MIT
---

# Order Book Depth

Spread, best bid and ask, depth within 0.5% and 1% of mid, and bid/ask imbalance for a market.

## Core capabilities

- Shows the best bid, best ask and the spread
- Measures depth within 0.5% and 1% of the mid price on each side
- Reports bid/ask imbalance so you can see which side is thicker

## Just say to your agent

- "How deep is the BTC-PERP order book within 1% of the mid price?"
- "Is the ETH-PERP book bid-heavy or ask-heavy right now?"

## When to use

The user asks about liquidity, spread, slippage for a size, or which side of the book is heavier.

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
book = client.get_orderbook("BTC-PERP", depth=50)
# book.bids and book.asks: tuples of levels with price, size, count (size is in coin units)
```

## Present the result

Compute from the levels returned: best bid and ask, mid = (best bid + best ask) / 2, spread = ask - bid (also as a share of mid), depth within 0.5% and 1% of mid as the sum of `price * size` per side in USD, and imbalance = (bid depth - ask depth) / (bid depth + ask depth). If the returned levels do not reach 1% from mid, say the depth is a lower bound and suggest a larger `depth`. Never extrapolate.

## Request cost

One request per order book read. Every request counts against the account's allowance, trades included; a request that fails with a 5xx is not charged. Free plan: 1,000 requests once, 10 a minute, three keys; paid plans raise the requests and the per-minute limit. All keys share the account's limits.

- `429 RATE_LIMIT_EXCEEDED`: wait for `Retry-After` (`RateLimitError.retry_after`), then try again once.
- `429 API_QUOTA_EXCEEDED`: stop and tell the user the allowance is used up.
- Do not loop on errors.
