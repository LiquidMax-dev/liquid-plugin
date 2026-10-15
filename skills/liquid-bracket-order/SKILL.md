---
name: liquid-bracket-order
description: "Enter a position with a take-profit and a stop-loss attached in one request."
license: MIT
---

# Order with TP/SL

Enter a position with a take-profit and a stop-loss attached in one request.

## Core capabilities

- Enters a position with take-profit and stop-loss in one request
- Checks that the levels sit on the correct side of the entry price
- Restates entry, TP, SL and risk before you confirm

## Just say to your agent

- "Long 250 USD of BTC at 4x with take-profit at 112,000 and stop-loss at 104,000."
- "Short 100 USD of ETH-PERP at 3x, TP 2,200, SL 2,550, at market."

## When to use

The user explicitly asks to enter a position and attach a take-profit and a stop-loss, and has given both levels.

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
    symbol="BTC-PERP",
    side="buy",
    type="market",       # or "limit" with price=...
    size=250.0,          # USD notional, not coin units
    leverage=4,
    tp=112000.0,
    sl=104000.0,
)
# order.tp and order.sl echo the attached levels
```

## Present the result

Before sending, check against the entry or current mark price: for a buy, `sl` below entry and `tp` above; for a sell, `sl` above entry and `tp` below. If a level is on the wrong side, tell the user and do not send. After the call, report `order_id`, `status`, `tp` and `sl` as returned. `place_order.size` is USD notional.

## Before every call

Restate the order (symbol, side, USD size, leverage, order type, TP/SL) and get the user's explicit confirmation before each call. Never invent a size, price, leverage or level; if the user did not give one, ask.

## If a call times out or fails on the network

Never resend an order call after a timeout or a network error (`TimeoutError`, `ConnectionError`): the order may have been placed. Read open orders (`client.get_open_orders()`) and positions (`client.get_positions()`) first and report what actually happened.

## Request cost

One request for the order, plus one for the price read used to check the levels. Every request counts against the account's allowance, trades included; a request that fails with a 5xx is not charged. Free plan: 1,000 requests once, 10 a minute, three keys; paid plans raise the requests and the per-minute limit. All keys share the account's limits.

- `429 RATE_LIMIT_EXCEEDED`: wait for `Retry-After` (`RateLimitError.retry_after`), then try again once.
- `429 API_QUOTA_EXCEEDED`: stop and tell the user the allowance is used up.
- Do not loop on errors.
