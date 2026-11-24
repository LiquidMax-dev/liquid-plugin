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
close_entire_position = False  # set from the user's request; execute exactly one confirmed branch
if close_entire_position:
    client.close_position("ETH-PERP")  # full close; omit size
else:
    from decimal import Decimal, ROUND_DOWN
    from math import isfinite

    close_usd = None  # set to the user's USD amount, or leave None for the requested coin amount
    markets = client.get_markets()
    sz_decimals = next(m["sz_decimals"] for m in markets if m["symbol"] == pos.symbol)
    coin_step = Decimal(1).scaleb(-sz_decimals)
    if close_usd is None:
        requested_coin_size = Decimal(str(abs(pos.size))) / 2
        mark = None
    else:
        mark = client.get_ticker(pos.symbol).mark_price
        if not isinstance(mark, (int, float)) or isinstance(mark, bool) or not isfinite(mark) or mark <= 0:
            raise ValueError("A finite positive current mark is required; no close was sent.")
        requested_coin_size = Decimal(str(close_usd)) / Decimal(str(mark))
    close_size = requested_coin_size.quantize(coin_step, rounding=ROUND_DOWN)
    if close_size <= 0:
        raise ValueError("Rounded close size is zero; no close was sent.")
    estimated_usd = float(close_size) * mark if mark is not None else None
    # Restate the rounded coin amount and, for a USD request, its estimated value; then get confirmation.
    client.close_position("ETH-PERP", size=float(close_size))  # partial close, coin units
```

## Present the result

`close_position.size` is in coin units, the same unit as `position.size`. It is never a USD amount. For a USD close request, read `client.get_ticker(pos.symbol).mark_price` (positions have no mark), divide USD by that mark, and round down to the market's `sz_decimals` from `get_markets`. Reject a zero rounded amount. Restate the rounded coin amount and its estimated USD value and get confirmation before calling. For a coin amount, round down to `sz_decimals`, reject zero, and confirm the rounded amount. Omit `size` for a full close. A partial close can raise `NotFoundError` when no position exists; a full close instead returns `status: "ok"` with a message saying no open position was found. After the call report `status` and `message`, then read positions once to show what remains.

## Before every call

Restate the order (symbol, side, rounded coin amount and estimated USD value for a partial close, leverage, order type, TP/SL) and get the user's explicit confirmation before each call. Never invent a size, price, leverage or level; if the user did not give one, ask.

## If a call times out or fails on the network

Never resend a mutation after a timeout, network error, or any 5xx response, including a transient error message that says to retry: the outcome may be unknown and the request may have taken effect. Reconcile with read-only calls such as `client.get_open_orders()` and `client.get_positions()` and report the evidence. If those reads do not settle the outcome, say it remains unknown and do not resend.

## Request cost

A full close uses three requests: positions, close, and a final positions read. A partial close adds a markets read for `sz_decimals` when it is not already cached; a USD partial close adds one ticker read, for up to five requests. Every request counts against the account's allowance, trades included. Free plan: 1,000 requests once, 10 a minute, three keys; paid plans raise the requests and the per-minute limit. All keys share the account's limits.

- `429 RATE_LIMIT_EXCEEDED`: wait for `Retry-After` (`RateLimitError.retry_after`), then try again once.
- `429 API_QUOTA_EXCEEDED`: stop and tell the user the allowance is used up.
- Do not loop on errors.
