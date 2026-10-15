---
name: liquid-position-guard
description: "Move your stop to break-even after a set gain and trail it behind price; confirms the rules with you first."
license: MIT
---

# Position Guard

Move your stop to break-even after a set gain and trail it behind price; confirms the rules with you first.

## Core capabilities

- Moves your stop to break-even once the position gains a set amount
- Trails the stop behind price at a distance you choose
- Only ever tightens the stop and confirms the rules before it starts

## Just say to your agent

- "Watch my BTC-PERP long: move the stop to break-even after a 2% gain, then trail 1.5% behind price."
- "Guard my ETH-PERP short with a 3% trail, checking every 2 minutes."

## When to use

The user asks the agent to protect an open position by moving its stop to break-even and trailing it.

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
import time
last_stop = 104000.0                    # the stop the user says is set now
while True:
    pos = next((p for p in client.get_positions() if p.symbol == "BTC-PERP"), None)
    if pos is None:
        break                            # position closed: stop the guard
    mark = client.get_ticker(pos.symbol).mark_price
    # long: gain = mark / entry - 1; new_stop = max(entry, mark * (1 - trail))
    # short: gain = 1 - mark / entry; new_stop = min(entry, mark * (1 + trail))
    # move only if new_stop is better than last_stop
    # result = client.set_tp_sl("BTC-PERP", sl=new_stop)
    # if result.sl is None or result.sl.get("status") != "set":
    #     raise RuntimeError(f"Stop update was not confirmed: {result.sl}")
    # last_stop = new_stop
    time.sleep(60)
```

## Present the result

Before starting, confirm with the user the markets, the trigger gain, the trail distance, the interval (default 60 s, never under 10 s) and the current stop. The SDK does not return the stop currently set, so the guard keeps the last stop it set (or the one the user states) and only sends a new stop that is better for the position: higher for a long, lower for a short. It never widens or removes a stop and never touches the take-profit. State the cost: each check reads positions once and the ticker once per guarded market, so one market costs 2 requests per check, 2,880 per day at 60 s, and the Free 1,000 requests last about 8 hours. On the Free plan's 10 requests a minute, guard one market at an interval of 12 s or more. Stop when the position is gone, when the user says stop, or after 3 failed checks in a row; a check fails on a 5xx, a timeout or a connection error, and a 5xx is not charged. On `RATE_LIMIT_EXCEEDED` wait for `Retry-After`; on `API_QUOTA_EXCEEDED` or any other 4xx stop and tell the user. If a stop update is not confirmed (`sl.status` is not `set`) or raises, stop the guard and tell the user that the stop may still be at the old level.

## Before every call

Restate the order (symbol, side, USD size, leverage, order type, TP/SL) and get the user's explicit confirmation before each call. Never invent a size, price, leverage or level; if the user did not give one, ask.

## If a call times out or fails on the network

Never resend an order call after a timeout or a network error (`TimeoutError`, `ConnectionError`): the order may have been placed. Read open orders (`client.get_open_orders()`) and positions (`client.get_positions()`) first and report what actually happened.

## Request cost

One `get_positions` request per check, plus one `get_ticker` request per guarded market, plus one `set_tp_sl` request each time a stop moves. At the default 60 s interval one market costs at least 2,880 requests per day. Every request counts against the account's allowance, trades included; a request that fails with a 5xx is not charged. Free plan: 1,000 requests once, 10 a minute, three keys; paid plans raise the requests and the per-minute limit. All keys share the account's limits.

- `429 RATE_LIMIT_EXCEEDED`: wait for `Retry-After` (`RateLimitError.retry_after`), then try again once.
- `429 API_QUOTA_EXCEEDED`: stop and tell the user the allowance is used up.
- Do not loop on errors.
