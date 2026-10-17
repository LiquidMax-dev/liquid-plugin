---
name: liquid-limit-order
description: "Rest a buy or sell at your price; it fills only if the market trades there."
license: MIT
---

# Limit Order

Rest a buy or sell at your price; it fills only if the market trades there.

## Core capabilities

- Rests a buy or sell at the price you choose
- Fills only if the market trades at that price, otherwise stays open
- Supports good-til-cancelled and immediate-or-cancel orders

## Just say to your agent

- "Buy 300 USD of ETH-PERP at 2,400, 3x leverage, good til cancelled."
- "Place a sell limit for 150 USD of SOL-PERP at 210, 2x."

## When to use

The user explicitly asks for an order at a specific price and has given the symbol, side, USD size, leverage and limit price.

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
order = client.place_order(
    symbol="ETH-PERP",
    side="buy",
    type="limit",
    size=300.0,          # USD notional, not coin units
    leverage=3,
    price=2400.0,        # required for limit orders
    time_in_force="gtc", # "gtc" rests; "ioc" cancels what does not fill at once
)
```

## Present the result

Report `order_id`, `status` and the price. Explain that a resting limit order may never fill, and that an `ioc` order that does not fill immediately is cancelled. `place_order.size` is USD notional. Use `reduce_only=True` only when the user asks for it. To see or cancel the order later use `liquid-open-orders` and `liquid-cancel-orders`.

## Before every call

Restate the order (symbol, side, USD size, leverage, order type, TP/SL) and get the user's explicit confirmation before each call. Never invent a size, price, leverage or level; if the user did not give one, ask.

## If a call times out or fails on the network

Never resend an order call after a timeout or a network error (`TimeoutError`, `ConnectionError`): the order may have been placed. Read open orders (`client.get_open_orders()`) and positions (`client.get_positions()`) first and report what actually happened.

## Request cost

One request for the order, plus one for an optional price read. Every request counts against the account's allowance, trades included; a request that fails with a 5xx is not charged. Free plan: 1,000 requests once, 10 a minute, three keys; paid plans raise the requests and the per-minute limit. All keys share the account's limits.

- `429 RATE_LIMIT_EXCEEDED`: wait for `Retry-After` (`RateLimitError.retry_after`), then try again once.
- `429 API_QUOTA_EXCEEDED`: stop and tell the user the allowance is used up.
- Do not loop on errors.
