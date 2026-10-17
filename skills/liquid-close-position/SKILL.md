---
name: liquid-close-position
description: "Close a position fully or partly at market."
license: MIT
---

# Close Position

Close a position fully or partly at market.

## Core capabilities

- Closes a position fully at market
- Closes a share of a position by converting to coin units
- Shows the realized result and confirms the position is gone or reduced

## Just say to your agent

- "Close my entire BTC-PERP position."
- "Close half of my ETH-PERP position at market."

## When to use

The user explicitly asks to close a position, fully or partly.

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
positions = client.get_positions()
pos = next(p for p in positions if p.symbol == "ETH-PERP")
client.close_position("ETH-PERP")                       # full close
client.close_position("ETH-PERP", size=abs(pos.size) / 2)  # partial close, coin units
```

## Present the result

`close_position.size` is in coin units, the same unit as `position.size`. It is never a USD amount (USD notional is what `place_order.size` takes, not this call): if the user gives USD, divide by the mark price to get coin units, round to the market's size decimals (see `liquid-markets`) and restate the converted size before confirming. Omit `size` for a full close. `NotFoundError` means there is no open position for that symbol. After the call report `status` and `message`, then read positions once to show what remains.

## Before every call

Restate the order (symbol, side, USD size, leverage, order type, TP/SL) and get the user's explicit confirmation before each call. Never invent a size, price, leverage or level; if the user did not give one, ask.

## If a call times out or fails on the network

Never resend an order call after a timeout or a network error (`TimeoutError`, `ConnectionError`): the order may have been placed. Read open orders (`client.get_open_orders()`) and positions (`client.get_positions()`) first and report what actually happened.

## Request cost

One request to read positions, one for the close, one to verify afterwards. Every request counts against the account's allowance, trades included; a request that fails with a 5xx is not charged. Free plan: 1,000 requests once, 10 a minute, three keys; paid plans raise the requests and the per-minute limit. All keys share the account's limits.

- `429 RATE_LIMIT_EXCEEDED`: wait for `Retry-After` (`RateLimitError.retry_after`), then try again once.
- `429 API_QUOTA_EXCEEDED`: stop and tell the user the allowance is used up.
- Do not loop on errors.
