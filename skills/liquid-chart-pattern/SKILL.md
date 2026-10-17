---
name: liquid-chart-pattern
description: "Fetch OHLCV candles, name the pattern (trend, range, breakout, breakdown) and score it 0-100 with its measurements."
license: MIT
---

# Chart Pattern Read

Fetch OHLCV candles, name the pattern (trend, range, breakout, breakdown) and score it 0-100 with its measurements.

## Core capabilities

- Fetches OHLCV candles for any market and interval
- Names the pattern: trend, range, breakout or breakdown
- Scores it 0-100 and shows the measurements behind the score

## Just say to your agent

- "Read the 4h chart for ETH-PERP and tell me which pattern it shows."
- "Is BTC-PERP breaking out on the 1h chart? Score it and show your numbers."

## When to use

The user asks what a chart is doing, whether a market is trending, ranging or breaking out, or wants a pattern read from price history.

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
candles = client.get_candles("ETH-PERP", interval="4h", limit=100)
# interval is one of 1m, 5m, 15m, 30m, 1h, 4h, 1d
# each candle: timestamp, open, high, low, close, volume
```

## Present the result

Classify from the candles you fetched and show the numbers: trend if a linear fit of closes has a clear slope and a high R-squared; range if closes stay inside a band narrower than a few average candle ranges; breakout or breakdown if the last close is beyond the previous 20-candle high or low and volume is above its average. Score 0-100 as how many of these checks agree, weighting them equally, and list each measurement (slope, R-squared, band width, prior high or low, volume ratio) next to the score. This is a description of past prices, not a prediction or advice.

## Request cost

One request per candle fetch (up to 100 candles by default). Every request counts against the account's allowance, trades included; a request that fails with a 5xx is not charged. Free plan: 1,000 requests once, 10 a minute, three keys; paid plans raise the requests and the per-minute limit. All keys share the account's limits.

- `429 RATE_LIMIT_EXCEEDED`: wait for `Retry-After` (`RateLimitError.retry_after`), then try again once.
- `429 API_QUOTA_EXCEEDED`: stop and tell the user the allowance is used up.
- Do not loop on errors.
