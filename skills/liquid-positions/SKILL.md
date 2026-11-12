---
name: liquid-positions
description: "Open positions with side, size, entry, mark, leverage, unrealized P&L and distance to liquidation."
license: MIT
---

# Positions and P&L

Open positions with side, size, entry, mark, leverage, unrealized P&L and distance to liquidation.

## Core capabilities

- Lists every open position with side, size, entry and mark price
- Shows leverage and unrealized P&L per position and in total
- Computes the distance to liquidation for each position

## Just say to your agent

- "Show my open positions and my unrealized P&L."
- "Which of my positions is closest to liquidation?"

## When to use

The user asks what they hold, how a position is doing or how far it is from liquidation.

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
from liquidtrading import SymbolNotFoundError

positions = client.get_positions()
# each: symbol, side, size, entry_price, leverage, unrealized_pnl,
#       mark_price, liquidation_price, margin_used  (the last three can be None)
# get_positions returns no mark (mark_price is None), so read it from the ticker
marks = {}
for p in positions:
    try:
        marks[p.symbol] = client.get_ticker(p.symbol).mark_price
    except SymbolNotFoundError:
        marks[p.symbol] = None           # show this position's mark and distance as unavailable
```

## Present the result

Table of symbol, side, size (coin units), entry, mark, leverage and unrealized P&L, with the total P&L underneath. The mark comes from `get_ticker(symbol).mark_price`, because `get_positions` returns none. Distance to liquidation = `abs(mark - liquidation_price) / mark`; when either value is `None`, or the ticker for that symbol is not found, show that position's mark and distance as unavailable and keep the other positions. Sort by smallest distance first. An empty list means no open positions.

## Request cost

One `get_positions` request plus one `get_ticker` request per open position, so 1 + N requests per read. On the Free plan (10 a minute) more than nine open positions cannot all be read within one minute; say so and read the rest after the wait. Every request counts against the account's allowance, trades included; a request that fails with a 5xx is not charged. Free plan: 1,000 requests once, 10 a minute, three keys; paid plans raise the requests and the per-minute limit. All keys share the account's limits.

- `429 RATE_LIMIT_EXCEEDED`: wait for `Retry-After` (`RateLimitError.retry_after`), then try again once.
- `429 API_QUOTA_EXCEEDED`: stop and tell the user the allowance is used up.
- Do not loop on errors.
