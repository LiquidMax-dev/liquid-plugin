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
- Tightens the stop relative to the explicitly confirmed current stop while the user maintains exclusive control

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
from math import isfinite
last_stop = 104000.0                    # the stop the user says is set now
trigger_gain = 0.02                     # explicitly confirmed; use 0.0 for a trail-only guard
trail = 0.015                           # explicitly confirmed fraction

def finite_number(value):
    return isinstance(value, (int, float)) and not isinstance(value, bool) and isfinite(value)

def candidate_stop(pos, mark, previous_stop, trigger_gain, trail):
    entry = pos.entry_price
    if not finite_number(entry) or entry <= 0:
        raise ValueError("A finite positive entry price is required.")
    if not finite_number(mark) or mark <= 0:
        raise ValueError("A finite positive current mark is required.")
    if not finite_number(trigger_gain) or trigger_gain < 0:
        raise ValueError("Trigger gain must be finite and nonnegative.")
    if not finite_number(trail) or trail < 0 or trail >= 1:
        raise ValueError("Trail distance must be finite and between 0 and 1.")
    if not finite_number(previous_stop):
        raise ValueError("A finite current stop is required.")
    if pos.side == "long":
        gain = mark / entry - 1
        proposed = max(entry, mark * (1 - trail))
        improves = proposed > previous_stop
        correct_side = proposed < mark
    elif pos.side == "short":
        gain = 1 - mark / entry
        proposed = min(entry, mark * (1 + trail))
        improves = proposed < previous_stop
        correct_side = proposed > mark
    else:
        raise ValueError(f"Unknown position side {pos.side!r}")
    if gain < trigger_gain or not improves or not correct_side:
        return None
    return proposed

def update_guard_stop(client, pos, mark, previous_stop, trigger_gain, trail, confirm):
    new_stop = candidate_stop(pos, mark, previous_stop, trigger_gain, trail)
    if new_stop is None:
        return previous_stop
    if not confirm(pos, previous_stop, new_stop):
        raise RuntimeError("Stop update was not confirmed; the existing stop remains unchanged.")
    result = client.set_tp_sl(pos.symbol, sl=new_stop)
    if result.sl is None or result.sl.get("status") != "set":
        raise RuntimeError(f"Stop update was not confirmed: {result.sl}")
    return new_stop

def confirm_guard_start(pos, current_stop):
    if not finite_number(current_stop):
        raise RuntimeError("A numeric current stop is required before the guard can start.")
    answer = input(
        f"Confirm {pos.symbol} current stop is {current_stop} and no other guard is active "
        "for this account and position, with no manual or other-agent stop edits while this guard runs? [y/N] "
    )
    return answer.strip().lower() == "y"

def confirm_stop_update(pos, previous_stop, new_stop):
    if not finite_number(previous_stop) or not finite_number(new_stop):
        return False
    answer = input(
        f"Confirm {pos.symbol} stop is still {previous_stop}, this guard still has exclusive control "
        f"with no other active guard or stop edits, and move it to {new_stop}? "
        "If the stop changed or control is shared, answer no and restart with a fresh baseline. [y/N] "
    )
    return answer.strip().lower() == "y"

pos = next((p for p in client.get_positions() if p.symbol == "BTC-PERP"), None)
if pos is None:
    raise RuntimeError("Position Guard cannot start because the position is not open.")
if not confirm_guard_start(pos, last_stop):
    raise RuntimeError("Position Guard startup was not confirmed; no updates were made.")

while pos is not None:
    mark = client.get_ticker(pos.symbol).mark_price
    last_stop = update_guard_stop(client, pos, mark, last_stop, trigger_gain, trail, confirm_stop_update)
    time.sleep(60)
    pos = next((p for p in client.get_positions() if p.symbol == "BTC-PERP"), None)
```

## Present the result

Before starting, confirm with the user the markets, the trigger gain, the trail distance, the interval (default 60 s, never under 10 s), and the numeric current stop. Allow at most one active guard per account and position. The executable example gets explicit startup confirmation that the displayed baseline is the current stop, all other guards are stopped, and no manual or other-agent stop edits will happen while it runs. If the stop is unknown or the user declines any part of this attestation, do not enter the loop. A trail-only guard uses a confirmed trigger gain of zero. On Free, use at least 20 s for one guarded market when there is no other traffic: two reads and a possible stop write make up to 9 requests per 60-second window. Setup and all other skills and keys share the same 10-request window, so account for those requests and use a longer interval when needed. The SDK does not return the stop currently set, so the guard keeps the last stop it set (or the numeric stop the user states and confirms) and proposes a new stop only when the gain threshold is met, the stop improves relative to that confirmed baseline (higher for a long, lower for a short), and it remains strictly below the current mark for a long or above it for a short. Validate entry and mark as finite positive numbers, and the trigger and trail as finite nonnegative fractions before calculating. Before each proposed update, show the remembered baseline and proposal; explicitly ask the user to confirm the baseline is still active and this guard still has exclusive control. Pass the remembered baseline to that confirmation callback. Unknown values or any non-affirmative response stop the guard without writing. If the user reports an outside stop edit or another active guard, stop and discard the baseline; restart only after the user confirms a fresh numeric baseline and exclusive control. These are user attestations and coordination requirements, not an API lock or atomic protection: the SDK cannot read the live stop or condition the write on its value, so an undisclosed outside edit or a write after confirmation can still race. Do not promise an unconditional never-widens guarantee. State the supported behavior as tightening relative to the explicitly confirmed baseline while exclusive control is maintained. The guard never removes a stop or touches the take-profit. State the cost: each check reads positions once and the ticker once per guarded market, and a moving stop adds one update, so one market costs 2 requests per check or 3 when it moves; at 60 s that is 2,880 reads per day, plus updates. The Free 1,000 requests last about 8 hours at 60 s before updates. Stop when the position is gone, when the user says stop, or after 3 failed checks in a row. On any mutation 5xx, timeout, or connection error, reconcile with read-only calls and never resend; if the outcome remains unknown, stop and report it. On `RATE_LIMIT_EXCEEDED` wait for `Retry-After`; on `API_QUOTA_EXCEEDED` or any other 4xx stop and tell the user. If a requested stop update is not confirmed (`sl.status` is not `set`) or raises, stop the guard and tell the user that the stop may still be at the old level.

## Before every call

Restate any order (symbol, side, USD margin, USD notional, leverage, order type, TP/SL) and get explicit confirmation before each call. For every guard stop proposal, state the market, side, current mark, remembered stop baseline, proposed stop and reason, then obtain explicit confirmation that the baseline is still active and exclusive control remains. Never invent a size, price, leverage or level; if the user did not give one, ask.

## If a call times out or fails on the network

Never resend a mutation after a timeout, network error, or any 5xx response, including a transient error message that says to retry: the outcome may be unknown and the request may have taken effect. Reconcile with read-only calls such as `client.get_open_orders()` and `client.get_positions()` and report the evidence. If those reads do not settle the outcome, say it remains unknown and do not resend.

## Request cost

One `get_positions` request per check, plus one `get_ticker` request per guarded market, plus one `set_tp_sl` request each time a stop moves. At the default 60 s interval one market costs 2,880 read requests per day plus stop updates. Every request counts against the account's allowance, trades included; a request that fails with a 5xx is not charged. On Free, use at least 20 s for one market with no other traffic (at most 9 requests per 60-second window if each check moves the stop); setup, other skills and all keys share the 10-request window, so use a longer interval when that traffic requires it. Free plan: 1,000 requests once, 10 a minute, three keys; paid plans raise the requests and the per-minute limit. All keys share the account's limits.

- `429 RATE_LIMIT_EXCEEDED`: wait for `Retry-After` (`RateLimitError.retry_after`), then try again once.
- `429 API_QUOTA_EXCEEDED`: stop and tell the user the allowance is used up.
- Do not loop on errors.
