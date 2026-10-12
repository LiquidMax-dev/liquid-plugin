# Co-Invest 1.0.2 — Muse form draft

Filled on 2026-10-12 for owner review. No submission was performed by the agent. This records public form fields. Private submitter identity and work-email values are intentionally omitted, alongside reviewer credentials, access tokens, account data and infrastructure identifiers.

## Overview

### Connector name

Co-Invest

### Company or developer

LiquidX AI, Inc.

### Product website

https://liquid.trade/coinvest

### Example prompts

Research BTC and ETH and compare their market data without placing a trade.
Preview a small simulated perpetual trade. After I approve its exact terms, place it and verify the paper order and position.
Preview closing my simulated position, then close only the approved quantity and verify the result.
Show my simulated transaction history and portfolio allocation; distinguish them from public trader rankings.

### Your name

Entered privately by the owner in the portal.

### Work email

Entered privately by the owner in the portal.

### Support email or URL

support@liquid.trade

### Privacy policy

https://www.liquid.trade/privacy

### Terms of service

https://www.liquid.trade/termsofservice

### Anything else?

Version 1.0.2. Paper-only server profile with 45 tools. It cannot place live orders, fund accounts, withdraw funds, change automation authority, or switch to a live profile. Simulated account state is shared by wallet across Liquid connectors. Watchlist edits affect real shared preferences; referrals and public leaderboards are actual account/public data. Reset is a sensitive write that clears shared simulated state. OAuth uses the existing Liquid read/trade grant, which is broader than paper trading; the endpoint enforces the simulation boundary. The existing public privacy policy permits indefinite retention; we do not claim a connector-specific deletion SLA or compliance with guideline 4.2. Support, security and maintenance: support@liquid.trade. Published privacy/deletion contact: customer-support@liquid.trade.

### Connector icon

The existing [Liquid logo](../plugins/co-invest-muse/assets/logo.svg), exported at 512×512 with its original viewBox. The owner approved it.

### Payments

My connector does not accept payments.

## Technical specs

### Hosted MCP endpoint

https://coinvest.liquid.trade/mcp?profile=paper-only

### API or MCP documentation

https://github.com/LiquidMax-dev/liquid-plugin/tree/main/plugins/co-invest-muse

### Access requirements

Requires a Liquid account and OAuth sign-in. Uses the existing read and trade scopes; a read-only grant is not offered by the current consent flow. Paper-only execution is enforced by the server profile. Ages 18+; account eligibility, regional and sanctions restrictions in Liquid Terms apply. Market availability depends on supported venues/providers. Shared simulated balances, positions and history persist across Liquid connectors; this connector does not accept payments or move real funds. Live trading, funding, withdrawals and automation-authority changes are unavailable. Sensitive reset affects shared simulated state and requires explicit confirmation. Provider/service rate limits may return retryable errors; a contractual per-user numeric quota is not promised. Unknown write outcomes must be reconciled before retrying. Reviewer access can be supplied through the secure review process.

### Connection type and authentication

Existing MCP; OAuth with PKCE.

## Final owner review

The final screen asks the submitter to confirm authority to submit the connector and brand assets, acknowledge review/distribution terms, and agree to the Muse Connector Terms. The owner controls those confirmations and the final Submit for review action. The agent has not performed submission or accepted terms on the owner's behalf.
