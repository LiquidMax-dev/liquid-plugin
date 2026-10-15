---
name: liquid-account
description: "Equity, margin used, available balance and margin usage for your Liquid account, flagged when usage is high."
license: MIT
---

# Account Health

Equity, margin used, available balance and margin usage for your Liquid account, flagged when usage is high.

## Core capabilities

- Shows equity, margin used and available balance
- Computes margin usage as a share of account value
- Flags high margin usage

## Just say to your agent

- "How healthy is my Liquid account right now?"
- "How much margin am I using, and how much can I still open?"

## When to use

The user asks about balance, equity, margin, buying power or how close the account is to trouble.

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
acct = client.get_account()    # equity, margin_used, available_balance, account_value
```

## Present the result

Show equity, margin used and available balance. Margin usage = `margin_used / account_value` (say it is unavailable if `account_value` is 0). Flag usage above 80% as high; that threshold is this skill's default and the user may change it.

## Request cost

One request per check (`get_account`). Every request counts against the account's allowance, trades included; a request that fails with a 5xx is not charged. Free plan: 1,000 requests once, 10 a minute, three keys; paid plans raise the requests and the per-minute limit. All keys share the account's limits.

- `429 RATE_LIMIT_EXCEEDED`: wait for `Retry-After` (`RateLimitError.retry_after`), then try again once.
- `429 API_QUOTA_EXCEEDED`: stop and tell the user the allowance is used up.
- Do not loop on errors.
