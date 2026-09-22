# CoInvest skill: position history

Status: implemented (QA needed for live surfaces).
Spec ID: SPEC-position-history-surfaces-20260922, section C.
Parent: `docs/specs/SPEC-position-history-surfaces-20260922.md` in liquid-mcp PR #555
and coinvest-computer PR #65 (LIQ-4937).

## TLDR

Document `get_position_history` in the hand-maintained CoInvest skill, so agents
on Cursor, Claude Code hosts, and the Grok bot discover it and describe it
correctly, and record the matching bullet the generator would add to both
plugin READMEs once #555 merges.

## Problem

`skills/coinvest/references/tools.md` named `get_transaction_history` but not
`get_position_history`, so agents never discovered or explained the new tool.
The plugin READMEs that describe the same capabilities are normally rendered
from `liquid-mcp/generated/interactive-v1*.json` by `sync-plugin.yml`, but that
workflow has failed at "Select sync credential mode" on every run since
`797fdfa` (2026-09-15), and its renderer (`scripts/plugin/tree.mjs`
`writeTree`) deletes every path it does not generate, including `skills/`,
`docs/`, and the hand-maintained root and plugin READMEs. So the READMEs will
not update on their own, and a full render would also revert real, unrelated
hand edits (the logo, the skill-install block, endpoint text) that predate the
generator's current contract data.

## Change

- `skills/coinvest/references/tools.md`, `## Account and preferences`: added
  `get_position_history` to the account-tools list and a new paragraph
  explaining its scope (bounded recent-fills window, live/paper mode, the
  `unknown`/incomplete-lifecycle caveat, default `closed` status with `open`
  treated as open-at-last-fill, and the exact case-sensitive `symbol` filter).
  Applied byte-for-byte from the spec's final text block, including the
  2026-09-22 L4 correction hedging `get_transaction_history` with "where
  offered" (Computer does not expose that tool).
- `plugins/co-invest/README.md` and `plugins/co-invest-grok/README.md`: added
  one bullet each, taken verbatim from a scratch render of liquid-mcp PR #555
  (`node scripts/generate-plugin.mjs --out <scratch-copy>`), at the position
  the generator placed it — under `### Markets`, between the "recent
  transaction history" bullet and "Recent market headlines...":

  `- Recent perpetual position history with entry, exit, gross realized PnL, and fees.`

  No other rendered change was applied: not the root `README.md` reverts (it
  would drop the logo, the `<!-- coinvest-skill:start/end -->` install block,
  and the current endpoint URLs), not the Trades/Data/Funding/Paper wording
  rewrites or the new "Sharing" USDC-profile-link bullet in the same READMEs,
  and not the three `plugin.json` version bumps (1.0.0 -> 1.0.1). Those are
  drift between the generator's stale contract inputs and hand-maintained
  content, unrelated to this change.
- `SKILL.md` is unchanged; no plugin scripts or workflows exist in this repo.

## Verification

- `git diff --stat` is exactly `tools.md`, the two plugin READMEs, and this
  spec doc.
- Relative links in the changed files resolve (`[trading guidance](trading.md)`
  in `tools.md` is unchanged and present).
- The first paragraph (tool-name list) and the final second paragraph of the
  `tools.md` change are byte-identical to the spec's blocks, checked with a
  small script comparing exact line ranges.
- `sha256(skills/coinvest/references/tools.md)` recorded in the commit report.

## Risk carried forward

The sync's ownership conflict (the `tree.mjs` preserve list vs. adopting hand
edits into `plugin/copy` vs. retiring the sync) and its missing credential are
user decisions the parent spec does not resolve. Until decided, `skills/`,
`docs/`, and the two README lines above stay exposed to being deleted or
reverted by a first successful sync run after #555 merges.
