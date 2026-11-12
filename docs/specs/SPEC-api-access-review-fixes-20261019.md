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

## Twenty-round follow-up: stale guard stop (2026-10-19)

Status: implemented and locally verified; published-head CI is tracked in the PR. This correction supersedes the Position Guard's unconditional never-widens claim when another guard or manual edit changes the live stop. The accepted requirement remains that guard updates only tighten the user's current stop.

### Problem and evidence

The SDK does not expose the live stop and the update endpoint has no expected-stop precondition. A running long guard remembering 104000 can propose 109335 at mark111000 after an outside actor already tightened the live stop to110000. The old confirmation names only the proposed stop, so confirmation does not establish that the remembered baseline is still current. Two guards can create the same stale-baseline failure.

### Solution and architecture

Keep this an agent instruction and example correction. Permit one active guard per account and position, with exclusive control of its stop. The executable example must ask for explicit confirmation of the numeric baseline and absence of other writers before entering the loop, including cycles that produce no proposal. Refusal terminates the guard. Before starting, require confirmation that other guards are stopped and there will be no manual or other-agent stop edits while it runs. If exclusivity cannot be established, do not start a guard. Before every proposal, show the remembered current stop as well as the proposed stop and require explicit confirmation that this baseline is still the active stop and no other writer is active. Pass the remembered baseline to the example's confirmation callback; refuse to write when it is unknown, changed or not confirmed. On any outside change, stop and discard the previous baseline; restart only after the user confirms the new current stop and exclusive ownership. Do not describe this human coordination as an API lock or atomic concurrency protection. Preserve existing gain/side/improvement arithmetic, cadence, quotas, per-update consent and unknown-outcome stopping behavior.

### Phases, data models and API contracts

Root authors this addition, independent advisor reviews it, then implementation changes only Position Guard instructions/example and meaningful regression coverage. No service, API, persistence, dependency, distributed lock or automatic live-stop discovery is introduced. The example callback gains the remembered stop as an argument; existing SDK calls and wire contracts remain unchanged. Verification and publication follow the master sweep spec, preserving one feature commit and the backend-first launch hold.

### Risks and verification

A dishonest or stale user confirmation cannot provide atomic enforcement against unrelated clients; state this limit explicitly instead of promising safety under concurrent writes. Reproduce the old stale-stop scenario with a synthetic SDK transport and current example. Verify disclosed long and short stale baselines and competing guards are refused through the actual prompt, unknown baseline/exclusivity refuses startup or update, and a correctly confirmed exclusive baseline permits a tightening update. Verify the actual interactive prompt names the baseline and exclusivity and treats any non-affirmative response as refusal. An independent skill-following agent receives realistic requests and raw skills without the desired answer. Run repository validate, sync check, tests, skill validation, Python compile and the existing actual SDK synthetic scenarios with intentional callback adaptation recorded. No live trade, API mutation, merge or deployment.

Advisor clarification accepted before implementation: update Core capabilities and Present the result to promise tightening relative to the explicitly confirmed baseline under exclusive control, not an unconditional never-widens guarantee. Confirmation is a user attestation, not a live stop read; an undisclosed outside edit or a write after confirmation remains a race. Retain an explicit characterization of that limitation. The short regression uses remembered110000, live104000, entry110000, mark103000 and proposed104545. No atomic protection is claimed. Advisor evidence: workspace sweep `plugin11/advisor-followup.md`.

Executed follow-up verification: 55 repository tests, validate, skill sync, Skill Creator validation, and compilation of all 32 Python examples pass. The actual old guard writes under its baseline-free prompt and fails the new refusal regression. Published SDK 0.1.3 with synthetic signed HTTP passes 122 scenarios and 221 signature checks, including actual startup/update prompts, disclosed stale long/short refusal, exclusive confirmed writes and incorrect-attestation limitation. All 16 current skill hashes and current backend signing equivalence were checked. An independent raw-skill forward trial handled three realistic transcripts, refusing the two disclosed coordination conflicts and performing one synthetic confirmed update. Root plus advisor and five implementation/verification roles reviewed the correction. No live API/trade or deployment; existing launch hold remains. Evidence: workspace sweep plugin11/gates/post-fix-report.md, runtime/post-guard-correction/, forward-test/.
