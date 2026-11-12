---
name: liquid-tp-sl
description: "Add or move the take-profit and stop-loss on an open position."
license: MIT
---

# Set TP/SL

Add or move the take-profit and stop-loss on an open position.

## Core capabilities

- Adds a take-profit, a stop-loss or both to an open position
- Moves existing levels and leaves the one you do not name unchanged
- Checks that the levels sit on the correct side of the position

## Just say to your agent

- "Set a stop-loss at 2,300 on my ETH-PERP position."
- "Move the take-profit on BTC-PERP to 115,000 and keep the stop."

## When to use

The user explicitly asks to add or change a take-profit or stop-loss on a position that is already open.

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
pos = next((p for p in positions if p.symbol == "ETH-PERP"), None)
if pos is None:
    raise ValueError("No open ETH-PERP position; no TP/SL update was sent.")

ticker = client.get_ticker(pos.symbol)
mark = ticker.mark_price
if mark is None:
    raise ValueError("Current mark price is unavailable; no TP/SL update was sent.")

tp = None   # set when a take-profit was requested
sl = 2300.0 # set when a stop-loss was requested
if tp is None and sl is None:
    raise ValueError("At least one TP or SL must be requested; no update was sent.")
if pos.side not in ("long", "short"):
    raise ValueError(f"Unknown position side {pos.side!r}; no TP/SL update was sent.")
if sl is not None:
    valid_sl = sl < mark if pos.side == "long" else sl > mark
    if not valid_sl:
        raise ValueError("Stop-loss must be strictly beyond the current mark; no update was sent.")
if tp is not None:
    valid_tp = tp > mark if pos.side == "long" else tp < mark
    if not valid_tp:
        raise ValueError("Take-profit must be strictly beyond the current mark; no update was sent.")

# Run this mutation only after the user explicitly confirms this TP/SL update.
result = client.set_tp_sl(pos.symbol, tp=tp, sl=sl)
# result.tp and result.sl are dicts (or None)
if tp is not None and (result.tp is None or result.tp.get("status") != "set"):
    raise RuntimeError(f"Take-profit was not confirmed as set: {result.tp}")
if sl is not None and (result.sl is None or result.sl.get("status") != "set"):
    raise RuntimeError(f"Stop-loss was not confirmed as set: {result.sl}")
```

## Present the result

At least one of `tp` or `sl` must be given. Validate every requested TP and SL against the ticker's current mark: for a long, SL must be below the mark and TP above; for a short, reverse the comparisons. Equality is invalid, and an unknown position side cannot be validated. Positions do not provide a current mark, so read the ticker after selecting the open position. If the position is absent or the ticker read fails or has no mark, stop without sending an update. The SDK does not return the levels currently set, so ask the user for the old level if they want to compare. `NotFoundError` means there is no open position for that symbol. HTTP 200 can still report a requested leg with `status: error`; require `status == "set"` for every requested leg before reporting protection. An omitted leg may be `None` because it was not requested; never treat that as a set leg. If a requested leg is missing or not set, report the partial failure and do not blindly resend the mutation.

## Before every call

Restate the order (symbol, side, USD size, leverage, order type, TP/SL) and get the user's explicit confirmation before each call. Never invent a size, price, leverage or level; if the user did not give one, ask.

## If a call times out or fails on the network

Never resend a mutation after a timeout, network error, or any 5xx response, including a transient error message that says to retry: the outcome may be unknown and the request may have taken effect. Reconcile with read-only calls such as `client.get_open_orders()` and `client.get_positions()` and report the evidence. If those reads do not settle the outcome, say it remains unknown and do not resend.

## Request cost

For a successful update, one request reads the position, one reads the ticker, and one sends the update. Missing positions, failed ticker reads, and invalid levels stop before the update. Every request counts against the account's allowance, trades included; a request that fails with a 5xx is not charged. Free plan: 1,000 requests once, 10 a minute, three keys; paid plans raise the requests and the per-minute limit. All keys share the account's limits.

- `429 RATE_LIMIT_EXCEEDED`: wait for `Retry-After` (`RateLimitError.retry_after`), then try again once.
- `429 API_QUOTA_EXCEEDED`: stop and tell the user the allowance is used up.
- Do not loop on errors.
