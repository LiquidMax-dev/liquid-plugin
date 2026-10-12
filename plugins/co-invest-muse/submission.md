# Muse connector submission draft

Version **1.0.2**. The Muse portal form has been populated for owner review on 2026-10-12. The agent has not submitted it or accepted terms on the owner's behalf. The Connector Terms are now accessible after sign-in. The public form fields are recorded in [the form draft](../../docs/muse-submission-form-1.0.2.md). Additional business and data-processing evidence may be requested during platform review; unknown facts below are not presented as guarantees.

## Connector overview

- **Name:** Co-Invest
- **Category:** Finance / market research and simulated trading
- **Description:** Research supported Liquid markets, inspect simulated paper activity and allocation, review public trader rankings, use shared account watchlist and referral utilities, and submit simulated changes after the user approves the exact terms.
- **Endpoint:** `https://coinvest.liquid.trade/mcp?profile=paper-only`
- **Environment:** Production endpoint enabled and directly tested on 2026-10-12. Muse portal draft prepared; authenticated tool execution inside Muse has not been tested.
- **Scope:** Public market research, paper-simulator operations, public leaderboard reads, and explicitly requested shared watchlist/referral utilities plus read-only automation-policy status. Through this connector's endpoint there is no live trading, funding, withdrawals, automation-policy changes, or alternate Liquid connector.
- **Review scope:** The owner confirmed simulated trading is the intended eligible scope on 2026-10-12. Further eligibility investigation is closed. Platform acceptance remains a separate review outcome.

## Authentication and requested scopes

The companion MCP implementation serves Protected Resource Metadata at `/.well-known/oauth-protected-resource/mcp` (path insertion for the `/mcp` resource) and `/.well-known/oauth-protected-resource`, plus Authorization Server Metadata at `/.well-known/oauth-authorization-server`. Deployed discovery advertises `read` and `trade`; the paper-only profile was enabled and verified on 2026-10-12. Within this profile, `read` permits market/account reads and proposals, while a verified `trade` scope is required for simulated account changes and shared watchlist edits. Missing or unverified write scope fails closed.

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

The tool matrix cases are representative fixture evidence. Direct authenticated production verification now includes paper status, portfolio/orders/history, a simulated perpetual open-and-close cycle, query-free session continuation, and denial probes. This does not establish Muse host-level confirmation behavior or a complete reviewer-account OAuth demo.

## Data processing and retention

The plugin package itself adds no telemetry. The Liquid MCP service records tool-call telemetry including arguments, outputs, user intent, session and client identifiers. The service also uses Redis for connection/binding state, the paper simulator for simulated account state, and external market/research providers for requested data.

Liquid's [public privacy policy](https://www.liquid.trade/privacy) says information may be retained for an unlimited length of time, describes use for marketing and analytics, and gives `customer-support@liquid.trade` for privacy questions and deletion requests. The public [Muse platform guidelines, section 4.2](https://muse.ai/platform/docs), limit retention to what is necessary for stated purposes. The public policy therefore does not establish that this connector's retention and marketing practices meet Muse's requirements. This mismatch is documented for the platform review; the public privacy policy remains unchanged, and this package does not claim compliance or a fixed retention period, no marketing/analytics use, or automatic deletion. The separate Connector Terms were accessed after owner sign-in on 2026-10-12; the agent has not accepted them on the owner's behalf.

- **Data controller/operator:** LiquidX AI, Inc., a Delaware C corporation, according to the [Terms of Service](https://www.liquid.trade/termsofservice). The registered address is not stated in the reviewed public pages; **Owner confirmation required**.
- **Subprocessors:** Railway hosts the MCP service and Redis. The request path also involves Liquid's API and simulator, storage services and requested market/research providers. Confirm the complete processor/data-purpose mapping, including the Muse host, during review. Do not treat every vendor listed in the general Privacy Policy as a connector subprocessor.
- **Retention periods by data class:** Session bindings have a default sliding 24-hour Redis expiry. This is separate from tool-call history, which can contain full inputs, outputs, intent and account/client attribution in database and object storage. The reviewed history implementation supplies no application-level expiry. Storage lifecycle, backups, simulator retention and manual deletion coverage remain unconfirmed; a fixed connector-wide retention period is not promised.
- **Deletion process:** The public policy directs deletion requests to `customer-support@liquid.trade`. Ending a transport session, revoking access, or deactivating an account is not evidence that stored tool history and backups have been erased. Connector-specific deletion coverage and handling times are **Owner confirmation required**.
- **Data residency and cross-border processing:** The MCP deployment uses US, European and Singapore regions. This does not establish residency for simulator data, database/object storage, backups or external providers; the complete mapping remains **Owner confirmation required**.
- **Privacy and deletion contact:** `customer-support@liquid.trade`, listed on the public privacy and terms pages.
- **Security intake:** `support@liquid.trade`, the support address shown in Liquid's existing product support surfaces; use this same address for security reports per owner direction.
- **Privacy notice and data-processing agreement:** The public privacy policy remains unchanged. The Muse Connector Terms were accessed after owner sign-in; the agent has not accepted them on the owner's behalf.

Do not replace these fields with guessed defaults or treat the existing public privacy policy as proof of service-specific retention or deletion behavior.

## Business and contact details

- **Legal entity:** LiquidX AI, Inc., Delaware C corporation, according to the [Terms of Service](https://www.liquid.trade/termsofservice).
- **Registered address:** **Owner confirmation required**; not listed on the reviewed public terms or privacy page.
- **Business support contact:** `support@liquid.trade`, used by the web app's bug-report link (`liquid-web/components/settings/SettingsSections.tsx`) and server support widget (`liquidmax_server/sphere-widget.html`). The separate published privacy/deletion contact remains `customer-support@liquid.trade`.
- **Form contact:** The owner supplies the submitter name and work email privately in the portal. Shared support, security and maintenance contact is `support@liquid.trade`. The owner controls the final authority and terms confirmations.
- **Maintainer:** LiquidX AI Co-Invest engineering; use `support@liquid.trade` as the contact address.
- **Public website:** https://liquid.trade/coinvest
- **Support and escalation URL:** https://www.liquid.trade/support.

## Release and review status

- All repository plugin manifests use **1.0.2**. The same version is the owner's target for future OpenAI and Grok submissions; those external submissions have not been performed here.
- Paper-only is enabled in production with all 45 tool names and schemas matching the pinned contract in `paper-only.source.json`. Existing `all` and `interactive-v1` contract hashes are unchanged.
- Direct production verification passed: original sessions continued query-free across the rollout; first-call paper status and simulated account reads passed; profile switching, live execution, missing/invalid authorization and unavailable disable tool were rejected. Old cached widget-resource addresses remain readable after the rebuild.
- A $12 requested-notional, 1x ETH paper order filled 0.0047 ETH and was closed after preview. Position and history reads confirmed both fills, no remaining test position, no open orders, and unchanged sizes/directions/leverage/protection of existing positions. The test used a shared operator account with instrument-level isolation; it did not reset account state or use real funds.
- Pinned-source runtime checks passed: 32 paper-only HTTP assertions, existing profile/session suites, and same-source restart continuation for all three profiles with complete binding equality and identity/profile mismatch refusal. Full Redis binding inspection in production was unavailable; live continuation is behavioral evidence. The companion release's paid model evaluation also passed on 2026-10-08.
- Recovery must keep all three profiles enabled on the compatible source. Restoring the former two-profile configuration would withdraw paper-only and is not a compatible rollback for its sessions.
- All 18 package tests, schema/metadata validation, skill-copy and deterministic contract checks passed. These do not prove a marketplace publication or host installation.
- Muse form: populated through Review, owner-approved logo, Co-Invest display name, support contact and version 1.0.2. No submission by the agent. The portal retains the exact `?profile=paper-only` URL in its review summary.
- Muse tool execution/approval controls and the complete dedicated reviewer-account OAuth flow remain unverified. Reviewer credentials belong in the secure review channel and are absent from the repository.
- The existing public privacy policy is unchanged; the retention/deletion limitations above remain disclosed rather than replaced with unsupported compliance claims.
