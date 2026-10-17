# SPEC-api-access-review-fixes-20261019

Status: implemented and locally verified (2026-10-19). Tracker: LIQ-5621.

## TLDR

Resolve the outstanding P1/P2 review findings on plugin11 as requested by the owner on October 19. Keep the existing feature scope and release holds.

## Problem

Current review findings identify discrepancies between documented or displayed behavior and the implemented API contract. The acceptance criteria below are the narrow correction scope.

## Solution

Use ticker mark for USD partial closes; market sz_decimals for coin rounding (round down to avoid exceeding requested size, fail if zero), confirm rounded coin amount and estimate. Treat all mutation 5xx as unknown outcomes, reconcile read-only, never blindly resend or infer absence from a single read. Remove unsupported margin-mode switching; leverage updates need an open position and explicitly confirmed existing mode, new-position leverage belongs in place_order. Guard checks confirmed gain threshold (zero for trail-only), strict correct side of current mark, and improving stop, including long/short; update last_stop only for confirmed status=set. Free moving guard minimum 20 seconds for 2 reads + 1 write, default60 retained, shared/setup traffic consumes the same budget. TP/SL and bracket results must confirm each requested leg before reporting protection; report partial failure and prohibit blind retry. Correct the same margin/notional defect in all affected skill examples.

## Architecture

Use the existing modules and contracts. No new service, persistence, telemetry, provider operation or rollout is introduced. The session author owns this specification and integration; independent advisor review precedes implementation and separate implementer/verification roles execute the evidence.

## Phases

1. Reproduce findings against the exact reviewed head and verify source contracts.
2. Make the minimum correction and meaningful regressions.
3. Run the repository gates and the verification below; publish one amended feature commit with an explicit expected-head lease.
4. Reconcile review threads, PR description and LIQ-5621; no merge or deployment.

## Data models

Preserve existing schemas, limits, flags and identity isolation. Synthetic data and credentials only in fixtures and artifacts. Secrets remain transient and are never logged or persisted. Preserve prior feature decisions; an unresolved optional request to remove SDK documentation does not authorize removing implementation.

## API contracts

Order size is USD margin, notional=size*leverage; close size is base-asset units. HTTP200 alone does not prove requested protection was set. Mutation 5xx/transport failures can be unknown financial outcomes and must not trigger blind resends. Server behavior is pinned to #3047 initial head 3a532f90d02c73287a938ad5644e5a6c213074fe and rechecked against its final revision. SDK public method/error contracts and default retries remain unchanged except the specified bounded retry correction.

## Risks

Concurrent branch updates require inspection before retrying a failed lease. Synthetic HTTP/browser evidence is not live-provider qualification. Keep existing launch/administrator holds. Never merge or deploy these PRs in this task.

## Verification

Plugin: repository validate/sync/tests, Python compile and actual SDK calls intercepted. Long/short partial close conversion/precision/zero, losing/threshold/equal/wrong-side/non-improving stops, stop rejected with200, TP-only/SL-only/both/partial bracket failures, mutation accepted then503/504 and no resend, missing position/margin-mode constraints, shared request budget. Independent skill-following verification receives realistic prompts and skills rather than desired answers. Preserve old plugin directories byte-for-byte.

Final diff and exact-head checks must pass. Record executed commands and outcomes, distinguish unexecuted live launch gates, and resolve only findings supported by final-source evidence.

Executed: all 53 repository tests, validate and skill sync passed. All 32 Python examples compile; 50 scenarios passed using the real published SDK 0.1.3 with a synthetic signed HTTP transport. An independent agent using only the skills produced reference flows; execution passed nine assertions for sizing, unknown 504 outcomes, guard and partial-protection handling. These are synthetic scenarios, not live financial qualification. Legacy plugin directories remain unchanged. Evidence is under qa-artifacts/api-access-p1p2-20261019-01a153d4/plugin in the workspace.
