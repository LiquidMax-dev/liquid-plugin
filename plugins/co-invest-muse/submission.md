# Muse connector submission draft

This document is an internal submission draft, not a completed portal submission. The portal intake has not been submitted and the Muse Connector Terms have not been accessed or accepted. The public Muse platform guidelines' section 4.2 is noted below for the retention review. Fields marked **Owner confirmation required** must be resolved in Muse's secure intake before submission.

## Connector overview

- **Name:** Liquid Co-Invest Paper
- **Category:** Finance / market research and simulated trading
- **Description:** Research supported Liquid markets, inspect simulated paper activity and allocation, review public trader rankings, use shared account watchlist and referral utilities, and submit simulated changes after the user approves the exact terms.
- **Endpoint:** `https://coinvest.liquid.trade/mcp?profile=paper-only`
- **Environment:** Prepared in code; not deployed or authenticated in Muse.
- **Scope:** Public market research, paper-simulator operations, public leaderboard reads, and explicitly requested shared watchlist/referral utilities plus read-only automation-policy status. Through this connector's endpoint there is no live trading, funding, withdrawals, automation-policy changes, or alternate Liquid connector.
- **Eligibility:** Muse's published finance policy does not clearly state whether simulated trading is exempt from its restrictions on financial trade tools. Approval must be confirmed by Muse; do not claim eligibility or acceptance.

## Authentication and requested scopes

The companion MCP implementation serves Protected Resource Metadata at `/.well-known/oauth-protected-resource/mcp` (path insertion for the `/mcp` resource) and `/.well-known/oauth-protected-resource`, plus Authorization Server Metadata at `/.well-known/oauth-authorization-server`. Deployed discovery was verified on 2026-10-07 and advertises `read` and `trade`; the paper-only profile itself is not deployed. Within the prepared profile, `read` permits market/account reads and proposals, while a verified `trade` scope is required for simulated account changes and shared watchlist edits. Missing or unverified write scope fails closed.

**What signing in grants (stated plainly for reviewers and users):** orders placed through this connector are simulated, and its endpoint never places a live order. Signing in uses the user's normal Liquid account authorization, the same one Liquid's other connectors use. That permission is not limited to practice trading: a deployed PKCE request for `read` returned `read trade`, and the existing approval path can provision a live trading agent. The practice-only limit is enforced by Liquid's server for this connector's address, not by the permission itself. This connector is not described as read-only or as unable to reach live funds through other Liquid connections. No client secret, token, or reviewer credential belongs in this repository.

## User workflow and approval

The connector starts in paper-only mode and must confirm `paper_trading_status` before stateful actions. The agent previews a proposed order or management change, states that it uses simulated funds, and asks the user to approve the exact unchanged terms. It then calls the execution tool only after that approval. A changed term requires a new preview and approval. Pending or unknown outcomes are reconciled against orders and positions before retrying.

The proposed classification for all 45 tools is in [tools.md](tools.md). Trading balances, positions, orders, transaction history, and portfolio allocation are simulated. Leaderboards are actual public Liquid rankings and are not based on the connected paper account. `edit_watchlist` changes shared account preferences and is **Write**; `refer` reads actual shared referral data; `automated_trading_status` reads saved shared policy metadata and cannot enable automation or authorize orders. Preview-and-execute tools are **Write**, and `reset_paper_account` is **Sensitive write** because it clears shared wallet paper state. These labels do not assert that Muse provides a particular approval prompt. Chat confirmation and any Muse host-level human-in-the-loop controls are separate; host behavior remains unverified.

## Reviewer demo plan

The owner supplied a Privy test account. Its email/OTP sign-in was verified on the deployed Liquid consent page on 2026-10-07; the account reached the authenticated consent view. Testing stopped before connection approval, so no OAuth token was minted or trading key provisioned by this test. Credentials remain outside this package and must be delivered through Muse's secure intake instructions. Confirm dedicated reviewer access and representative simulated state before the demo, and record that the test login was against the deployed Liquid environment.

1. Connect and call `paper_trading_status`; show explicit simulated mode.
2. Read the paper portfolio and open orders.
3. Read simulated transaction history and allocation, then compare a public leaderboard result. State clearly that leaderboard results are real public rankings and not paper-account performance.
4. Ask for a supported perpetual order, show the exact proposal, approve it, submit it, and verify the receipt and paper order state.
5. Demonstrate a management preview, then approve and verify one supported update, cancellation, or close.
6. If prediction markets are included in the deployed contract, show the simulator's `executionMode=paper` result and separate preview/confirmation flow.
7. On explicit request, demonstrate a shared watchlist edit and read the actual referral link/statistics. Read automation status as metadata only; do not enable or change automation.
8. In a separate Liquid MCP connector, change the wallet's paper toggle and verify the bound paper-only session still reports simulated mode.
9. Show that live-mode requests, missing/expired authorization, unavailable tools, and attempts to disable paper mode are denied or unavailable.
10. Demonstrate an item-level partial batch result and an unknown write result. Reconcile order/account state before retrying; do not repeat an action blindly.

The tool matrix cases are representative fixture evidence, not a successful live Muse demo. Finance simulation eligibility and the final deployed endpoint must be settled before this plan is performed.

## Data processing and retention

The plugin package itself adds no telemetry. The Liquid MCP service records tool-call telemetry including arguments, outputs, user intent, session and client identifiers. The service also uses Redis for connection/binding state, the paper simulator for simulated account state, and external market/research providers for requested data.

Liquid's [public privacy policy](https://www.liquid.trade/privacy) says information may be retained for an unlimited length of time, describes use for marketing and analytics, and gives `customer-support@liquid.trade` for privacy questions and deletion requests. The public [Muse platform guidelines, section 4.2](https://muse.ai/platform/docs), limit retention to what is necessary for stated purposes. The public policy therefore does not establish that this connector's retention and marketing practices meet Muse's requirements. This mismatch is documented for the platform review; the public privacy policy remains unchanged, and this package does not claim compliance or a fixed retention period, no marketing/analytics use, or automatic deletion. The separate Connector Terms remain inaccessible until logged in and have not been accepted.

- **Data controller/operator:** LiquidX AI, Inc., a Delaware C corporation, according to the [Terms of Service](https://www.liquid.trade/termsofservice). The registered address is not stated in the reviewed public pages; **Owner confirmation required**.
- **Subprocessors:** The public Privacy Policy lists service providers for on-ramp, Google, Cloudflare, Vercel, Coinbase, and AWS; confirm which apply to this connector and disclose any additional MCP, Redis, simulator, and research providers. **Owner confirmation required**.
- **Retention periods by data class:** The public policy currently permits unlimited retention. Connector-specific retention behavior is not documented here; the public policy remains unchanged and the Muse-guideline mismatch is recorded above.
- **Deletion process:** The public policy directs deletion requests to `customer-support@liquid.trade`; connector-specific deletion coverage and handling times are **Owner confirmation required**.
- **Data residency and cross-border processing:** **Owner confirmation required**.
- **Privacy and deletion contact:** `customer-support@liquid.trade`, listed on the public privacy and terms pages.
- **Security intake:** `support@liquid.trade`, the support address shown in Liquid's existing product support surfaces; use this same address for security reports per owner direction.
- **Privacy notice and data-processing agreement:** The public privacy policy remains unchanged. The separate Muse Connector Terms remain inaccessible until logged in and have not been accepted.

Do not replace these fields with guessed defaults or treat the existing public privacy policy as proof of service-specific retention or deletion behavior.

## Business and contact details

- **Legal entity:** LiquidX AI, Inc., Delaware C corporation, according to the [Terms of Service](https://www.liquid.trade/termsofservice).
- **Registered address:** **Owner confirmation required**; not listed on the reviewed public terms or privacy page.
- **Business support contact:** `support@liquid.trade`, used by the web app's bug-report link (`liquid-web/components/settings/SettingsSections.tsx`) and server support widget (`liquidmax_server/sphere-widget.html`). The separate published privacy/deletion contact remains `customer-support@liquid.trade`.
- **Authorized representative and review contact:** **Owner confirmation required**.
- **Maintainer:** LiquidX AI Co-Invest engineering; use `support@liquid.trade` as the contact address.
- **Public website:** https://liquid.trade/coinvest
- **Support and escalation URL:** https://www.liquid.trade/support.

## Release and review status

- Package and contract snapshot: prepared locally; source revision and hash are recorded in `paper-only.source.json`.
- Paper-only endpoint deployment and rollback qualification: pending companion MCP release.
- OAuth and real tool calls through Muse: unverified.
- Muse policy eligibility: requires platform decision.
- Portal submission: not submitted; the Connector Terms have not been accessed or accepted and the full review remains incomplete.
- Reviewer account sign-in: verified with the owner-provided Privy test account; complete OAuth approval and paper-only Muse demo remain unverified. Follow Muse's secure intake instructions and keep credentials outside the repository and email.
- Public policy versus Muse retention requirement: the mismatch is documented for review; the public privacy policy remains unchanged.
