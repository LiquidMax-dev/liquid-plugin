---
name: liquid-leverage
description: "Change a market's leverage or add or remove isolated margin on a position."
license: MIT
---

# Leverage and Margin

Change a market's leverage or add or remove isolated margin on a position.

## Core capabilities

- Changes a market's leverage between 1x and 200x
- Updates leverage on a market with an open position while preserving its confirmed margin mode
- Adds or removes isolated margin and shows the new liquidation price

## Just say to your agent

- "Set BTC-PERP leverage to 5x on my existing isolated position."
- "Add 50 USD of margin to my ETH-PERP position."

## When to use

The user explicitly asks to change leverage on an open position or adjust its isolated margin. This skill cannot switch margin mode.

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
pos = next((p for p in positions if p.symbol == "BTC-PERP"), None)
if pos is None:
    raise ValueError("No open BTC-PERP position; no leverage update was sent.")
confirmed_is_cross = False  # ask the user to confirm the position's existing mode; positions do not report it
client.update_leverage("BTC-PERP", leverage=5, is_cross=confirmed_is_cross)
margin_pos = next((p for p in positions if p.symbol == "ETH-PERP"), None)
if margin_pos is None:
    raise ValueError("No open ETH-PERP position; no margin update was sent.")
client.update_margin("ETH-PERP", amount=50.0)    # positive adds, negative removes
```

## Present the result

Before `update_leverage`, require an open position and ask the user to confirm its existing cross/isolated mode; positions do not expose that mode, and changing it is unsupported. For a new position, pass leverage to `place_order`. Check `max_leverage` with `get_markets` before raising leverage. `update_margin` adjusts isolated margin only; it also needs an open position. A negative amount removes margin and moves the liquidation price closer, so say so before confirming. Afterwards read positions and show the new `liquidation_price` when available. Report `leverage`, `is_cross` or `margin_adjusted` as returned.

## Before every call

Restate the order (symbol, side, USD size, leverage, order type, TP/SL) and get the user's explicit confirmation before each call. Never invent a size, price, leverage or level; if the user did not give one, ask.

## If a call times out or fails on the network

Never resend a mutation after a timeout, network error, or any 5xx response, including a transient error message that says to retry: the outcome may be unknown and the request may have taken effect. Reconcile with read-only calls such as `client.get_open_orders()` and `client.get_positions()` and report the evidence. If those reads do not settle the outcome, say it remains unknown and do not resend.

## Request cost

One request per change, plus one to read the position or market limits. Every request counts against the account's allowance, trades included; a request that fails with a 5xx is not charged. Free plan: 1,000 requests once, 10 a minute, three keys; paid plans raise the requests and the per-minute limit. All keys share the account's limits.

- `429 RATE_LIMIT_EXCEEDED`: wait for `Retry-After` (`RateLimitError.retry_after`), then try again once.
- `429 API_QUOTA_EXCEEDED`: stop and tell the user the allowance is used up.
- Do not loop on errors.
