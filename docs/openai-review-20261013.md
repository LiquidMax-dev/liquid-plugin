# Co-Invest OpenAI submission review — 2026-10-13

**Updated 2026-10-13:** the owner authorized requesting manual review with explanations for every finding. The MCP appeal was submitted and the portal confirmed **Appeal submitted**. All 3,782 characters of the saved explanation were read back, covering the 11 findings. Automatic MCP scans are paused until a decision or withdrawal. The current portal header shows Publication Version 1.0.0 and Review status In review; that overall review state already existed before the agent submitted this separate MCP appeal.

**Earlier package checkpoint, superseded for review status by the update above:** version 1.0.2 was a draft, Not submitted. The owner-uploaded first skills archive passed metadata and all three skill checks. The existing MCP connection is Authorized and its domain is verified. A subsequent portfolio-skill correction exists locally and needs a replacement upload; passed checks apply to the uploaded archive only. The current package revision was not rechecked in this MCP appeal action.

## MCP findings

The portal scanned 44 tools: 34 current definitions live, eight previous definitions retained, and two new tools not live. Platform feedback was read for every flagged tool, including the full structured findings behind the panel. Repeated identical generic findings are grouped below.

| Tool | Availability | Feedback and disposition |
| --- | --- | --- |
| `suggest_trade` | Earlier definition live | Generic further-review hold. Read-only proposal with a Liquid review link; no execution claim. Prepare manual-review explanation. |
| `suggest_trades_batch` | Earlier definition live | Generic further-review hold. Basket proposal/review links; not a fill. Prepare manual-review explanation. |
| `plan_portfolio` | Earlier definition live | Generic further-review hold. Research bundle and allocation planning; uses `suggest_trades_batch` for review. Prepare manual-review explanation. |
| `search_prediction_markets` | Earlier definition live | Generic further-review hold. Read-only market search. Description refers to an executor absent from this restricted connection; flag that wording for a separate server correction. |
| `show_prediction_orderbook` | Earlier definition live | Generic further-review hold. Read-only orderbook. Prepare manual-review explanation. |
| `view_prediction_positions` | Earlier definition live | Generic further-review hold. Read-only authenticated positions. Prepare manual-review explanation. |
| `view_prediction_orders` | Earlier definition live | Generic further-review hold. Read-only orders. Description refers to a cancellation tool absent from this connection; flag that wording for a separate server correction. |
| `enable_trading` | Earlier definition live | Latest scan has the generic further-review hold. Earlier name-clarity feedback is superseded by this scan. Owner requires keeping the exact tool unchanged; appeal explains its read-only readiness check and separate Liquid setup flow. |
| `leaderboard_data` | Not live | Generic further-review hold. Read-only public trader rankings. Prepare manual-review explanation. |
| `leaderboard_rank` | Not live | Generic further-review hold. Read-only trader rank lookup. Prepare manual-review explanation. |
| `edit_watchlist` | Live | Latest scan has the generic further-review hold. Earlier operation-splitting feedback is superseded by this scan. Owner requires keeping the tool unchanged; appeal explains the required add/remove/set enum and destructive preference-write annotation. |

The latest scan contains 11 identical generic holds with no specific failed field, evidence, or actionable cause. All 11 received explanations in the submitted appeal. Do not infer that a wording change will clear them. Two additional source observations—the unavailable prediction-tool references and shared execution wording in proposal widget metadata—are our review findings, not reasons supplied by OpenAI. Any server correction must follow liquid-mcp's released-contract compatibility gates.

## Submitted explanation for manual review

The exact submitted text is in [openai-manual-review-20261013.md](openai-manual-review-20261013.md). It covers each named tool, distinguishes reads and proposals from execution, acknowledges the unavailable prediction executor/cancellation references, and does not claim Earn is deployed. Portal read-back verified the complete saved text.

### Superseded draft

This earlier grouped draft was replaced by the complete per-tool explanation above:

> Please review the held definitions for Co-Invest's existing restricted MCP connection. `suggest_trade` and `suggest_trades_batch` return proposals and Liquid review links, not live order execution. `plan_portfolio` provides research and allocation-planning context. The four prediction-market tools listed above read markets, orderbooks, positions or orders. `leaderboard_data` and `leaderboard_rank` read trader rankings. These tools are annotated read-only. The connection does not expose live trade execution or cancellation tools. Existing paper-account management tools remain separate. The generic findings do not identify a failed field or specific corrective action; please clarify any remaining concern or approve eligible definitions. `enable_trading` is a legacy identifier for checking account setup and displaying Liquid setup guidance, not permission to enable execution on this connection.

## Earn and vaults

The skill does not install tools. The restricted catalog currently exposes none of `get_earn_balance`, `deposit_earn`, `withdraw_earn` or `_earn_pending_status`. The owner selected Earn balances and vault data only: `get_earn_balance` is the missing capability, reading the Earn position and vault metrics. Deposit, withdrawal and pending-status tools remain outside this phase. Draft MCP PR #767 prepares the exact rollback prerequisite; draft PR #768 adds the read. Both are pushed for CI; neither is merged or deployed. After release, the new tool still needs a scan once the current appeal ends.

## Remaining validation

Upload the replacement skill archive when the portal allows it, confirm its checks, and run representative market, portfolio and missing-Earn requests in the host. Wait for the submitted MCP appeal decision before claiming held definitions are live. Final package publication remains separate from this authorized manual-review appeal.
