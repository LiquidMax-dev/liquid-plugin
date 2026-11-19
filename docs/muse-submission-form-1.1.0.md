# Co-Invest 1.1.0 Muse submission form (update draft)

Draft prepared on 2026-11-19 for an update submission of package version 1.1.0. It has not been submitted. On 2026-11-19 the Muse portal still showed the 1.0.2 submission at "Submitted" (business verification awaiting a decision; data processing questionnaire and technical details in review) and offered only "View" on each item, with no control to edit or send an update, so this draft waits until Muse opens one. The section structure and field names follow [the 1.0.2 record](muse-submission-form-1.0.2.md), which stays as the record of what was submitted on 2026-10-12 and 2026-10-23; fields marked "unchanged" are copied from it. This records public form fields. Private submitter identity and work-email values are intentionally omitted, alongside reviewer credentials, access tokens, account data and infrastructure identifiers.

What changed from 1.0.2: the version, the example prompts (now the list in `docs/listing-prompts.json`, also in the package README), and the bundled workflow skills (8 shared skills under `plugins/co-invest-muse/skills/`). The endpoint, the 45-tool paper-only contract and every disclosure are unchanged.

## Overview

### Connector name

Co-Invest

### Company or developer

LiquidX AI, Inc.

### Product website

https://liquid.trade/coinvest

### Example prompts

Compare BTC and ETH: price, funding, positioning and the latest news. No trade.
Summarize SOL's 4h price action and key technical indicators.
Show me the terms for a simulated BTC long with $100 notional at 2x, and place it once I approve.
Set a take-profit 10% above and a stop-loss 5% below the current price on my simulated BTC position.
Which prediction markets are open on Bitcoin and on upcoming Premier League matches? Show the odds.
Plan a moderate-risk simulated portfolio across crypto, stocks and gold.
Show my simulated portfolio, open orders and trade history.
Who are the top traders on Liquid's public leaderboard this week?

### Your name

Entered privately by the owner in the portal.

### Work email

Entered privately by the owner in the portal.

### Support email or URL

customer-support@liquid.trade

### Privacy policy

https://www.liquid.trade/privacy

### Terms of service

https://www.liquid.trade/termsofservice

### Anything else?

Version 1.1.0 (update to the submitted 1.0.2). Paper-only server profile with 45 tools; the endpoint and tools are unchanged. The package now also bundles 8 workflow skills under `skills/`: `coinvest-allocate`, `coinvest-automation`, `coinvest-market-scan`, `coinvest-paper-trading`, `coinvest-portfolio-review`, `coinvest-prediction-markets`, `coinvest-research` and `coinvest-trade`. They are plain Markdown instructions that add no code and no tools. OWNER: whether Muse loads skills from a hosted connector package is not verified; confirm whether the portal accepts them or ignores them. The connector cannot place live orders, fund accounts, withdraw funds, change automation authority, or switch to a live profile. Simulated account state is shared by wallet across Liquid connectors. Watchlist edits affect real shared preferences; referrals and public leaderboards are actual account/public data. Reset is a sensitive write that clears shared simulated state. OAuth uses the existing Liquid read/trade grant, which is broader than paper trading; the endpoint enforces the simulation boundary. The existing public privacy policy permits indefinite retention; we do not claim a connector-specific deletion SLA or compliance with guideline 4.2. Support, security and maintenance: customer-support@liquid.trade. Published privacy/deletion contact: customer-support@liquid.trade.

### Connector icon

The existing [Liquid logo](../plugins/co-invest-muse/assets/logo.svg), exported at 512×512 with its original viewBox. The owner approved it. Unchanged.

### Payments

My connector does not accept payments.

## Technical specs

### Hosted MCP endpoint

https://coinvest.liquid.trade/mcp?profile=paper-only

### API or MCP documentation

https://github.com/LiquidMax-dev/liquid-plugin/tree/main/plugins/co-invest-muse

### Access requirements

Requires a Liquid account and OAuth sign-in. Uses the existing read and trade scopes; a read-only grant is not offered by the current consent flow. Paper-only execution is enforced by the server profile. Ages 18+; account eligibility, regional and sanctions restrictions in Liquid Terms apply. Market availability depends on supported venues/providers. Shared simulated balances, positions and history persist across Liquid connectors; this connector does not accept payments or move real funds. Live trading, funding, withdrawals and automation-authority changes are unavailable. Sensitive reset affects shared simulated state and requires explicit confirmation. Provider/service rate limits may return retryable errors; a contractual per-user numeric quota is not promised. Unknown write outcomes must be reconciled before retrying. Reviewer access is supplied as a test user in the Integration credentials step.

### Connection type and authentication

Existing MCP; OAuth with PKCE.

## Integration credentials

Unchanged from 1.0.2 unless Muse asks again for an update.

- Authentication: OAuth with dynamic client registration (DCR) and PKCE. Muse registers its own client at `https://coinvest.liquid.trade/oauth/register`; its hosted callback `https://agent.meta.ai/api/hatch/oauth/callback` is on the server allowlist. No static client ID or secret is used, because registered clients expire after 30 days without use.
- Scopes: `read`, `trade`. The server supports S256 PKCE only.
- Environment: production, `https://coinvest.liquid.trade/mcp?profile=paper-only`.
- Test user: one dedicated Privy test login with a fixed email code, shared with the liquid-mcp nightly e2e. Its email and code are entered only in the portal. The reviewer notes cover the sign-in steps and paper-only behavior. They also warn that the nightly run may reset the simulated account around 07:00 UTC, and that `reset_paper_account` restores a clean account.

## Final owner review

Pending. The final screen asks the submitter to confirm authority to submit the connector and brand assets, acknowledge review/distribution terms, and agree to the Muse Connector Terms. The owner makes those confirmations and submits. The agent does not submit or accept terms on the owner's behalf. OWNER: the portal's update flow for an already submitted connector (resubmit, new version or edit in place) was not checked.
