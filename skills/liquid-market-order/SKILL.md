---
name: liquid-market-order
description: "Open a long or short at market by USD size and leverage, after you confirm the order."
license: MIT
---

# Market Order

Open a long or short at market by USD margin and leverage, after you confirm the order.

## Core capabilities

- Opens a long or short at market by USD margin and leverage
- Restates the full order and waits for your explicit confirmation
- Reports the order status and never resends after a timeout

## Just say to your agent

- "Use 200 USD margin for a BTC-PERP long at 5x (1,000 USD notional), at market."
- "Use 100 USD margin for an ETH-PERP short at 3x (300 USD notional), at market."

## When to use

The user explicitly asks to open a long or short at market and has given the symbol, side, USD margin or notional, and leverage.

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
usd_notional = 1000.0  # the user's requested notional
leverage = 5
usd_margin = usd_notional / leverage
order = client.place_order(
    symbol="BTC-PERP",
    side="buy",          # "buy" = long, "sell" = short
    type="market",
    size=usd_margin,     # USD margin; at 5x this opens about 1,000 USD notional
    leverage=leverage,   # 1 to 200
)
# order.order_id, order.status, order.size, order.price, order.leverage
```

## Present the result

`place_order.size` is USD margin and the resulting notional is `size * leverage`. If the user gives notional, divide it by the confirmed leverage to get margin, then restate both amounts before confirmation. Report `order_id`, `status`, the size and leverage exactly as returned. `InsufficientBalanceError` and `OrderRejectedError` mean the order did not go through: show the message and stop. Never reduce the size or raise the leverage on your own to make an order fit.

## Before every call

Restate the order (symbol, side, USD margin, USD notional, leverage, order type, TP/SL) and get the user's explicit confirmation before each call. Never invent a size, price, leverage or level; if the user did not give one, ask.

## If a call times out or fails on the network

Never resend a mutation after a timeout, network error, or any 5xx response, including a transient error message that says to retry: the outcome may be unknown and the request may have taken effect. Reconcile with read-only calls such as `client.get_open_orders()` and `client.get_positions()` and report the evidence. If those reads do not settle the outcome, say it remains unknown and do not resend.

## Request cost

One request for the order, plus one for the optional leverage check or price read. Every request counts against the account's allowance, trades included; a request that fails with a 5xx is not charged. Free plan: 1,000 requests once, 10 a minute, three keys; paid plans raise the requests and the per-minute limit. All keys share the account's limits.

- `429 RATE_LIMIT_EXCEEDED`: wait for `Retry-After` (`RateLimitError.retry_after`), then try again once.
- `429 API_QUOTA_EXCEEDED`: stop and tell the user the allowance is used up.
- Do not loop on errors.
