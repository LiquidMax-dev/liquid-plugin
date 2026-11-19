# Co-Invest for Perplexity: connector proposal form draft

Drafted 2026-11-16, first for the standard endpoint and changed the same day to the Co-Invest Computer endpoint `https://coinvest-computer.liquid.trade/mcp` (owner decision: Perplexity does not render Co-Invest widgets, and Computer returns text results). Owner answers were added the same day. The owner reviews and submits; nothing here has been submitted.

**Corrected 2026-11-19 by SPEC-listing-descriptions-prompts-20261119:** Co-Invest Computer has no approval gate on perpetual orders. In its catalog (`computer-v1-full`) `execute_order`, `execute_tpsl`, `close_position` and `update_leverage` take no `confirmed` argument and run when called; the statements below that cite `generated/all.json` describe a different catalog. Only prediction orders and trailing stops keep a `confirmed` argument on Computer. The catalog description, tagline and example queries below are corrected; the workflow, authorization and additional-context answers are marked where they are wrong, and the live form still holds the earlier text until the owner updates it.

Conventions: `OWNER: ...` marks a fact only the owner knows. `UNVERIFIED:` marks a statement carried over from the Muse paper-only material (or from a Perplexity measurement on a different resource) that was not rechecked for the standard endpoint.

Scope note: the Muse documents describe the `paper-only` profile on the standard host. This proposal is for Co-Invest Computer, the endpoint the Cursor package and the bundled `coinvest` skill use. It can place live orders after the user approves the exact terms in chat. Tool names below come from `skills/coinvest/references/tools.md`; the live Computer catalog was not listed for this draft, so they are starting points, not a full inventory.

## Company

### Company name

Liquid

### Legal entity name

LiquidX AI, Inc.

### Company website

https://www.liquid.trade

### Company and product description

Liquid is a multi-asset trading platform covering crypto, equities, commodities, indices and prediction markets. Co-Invest is its MCP server. It lets an assistant research supported markets, read the user's own Liquid portfolio, orders and history, prepare trade proposals, and place trades. Every order or position change is previewed first. The assistant calls the execution tool only after the user approves the exact returned terms in chat. Trading is non-custodial: it runs through the user's own Liquid account.

Source: liquid-mcp `README.md` (opening sections; "Deployment trading mode"); `generated/all.json` tool descriptions (`execute_order`, `close_position`).

### Company stage

Private, 1–50 employees.

### Headquarters country

United States.

### Submitter name

Entered in the form by the owner's direction; personal contact details are not kept in this repository.

### Role or title

Entered in the form by the owner's direction; personal contact details are not kept in this repository.

### Work email

Entered in the form by the owner's direction; personal contact details are not kept in this repository.

### Authorized to submit (Yes/No)

Yes (owner's direction, 2026-11-16).

## Customer value

### Primary user segments

Consumer; Developer.

### Approximate active user base

Left blank (optional).

### Top user workflows

1. Goal: research a market before trading. Data or action: the assistant calls `analyze_market` and `get_news` for a symbol. Outcome: the user gets price, funding, open interest, positioning data and recent headlines in one answer. Source: `generated/all.json` (`analyze_market`, `get_news`).
2. Goal: review the user's own account. Data or action: `get_portfolio` and `view_open_orders`. Outcome: balances, positions, open orders and recent activity in one summary. Source: `generated/all.json`.
3. **Corrected 2026-11-19: on Computer `execute_order` and `close_position` have no `confirmed` argument; the order runs when the assistant calls the tool after the user asks for it.** Goal: place or close a trade with control. Data or action: the assistant states the exact terms; the user approves in chat; `execute_order` or `close_position` with `confirmed=true` places it. Outcome: an order or close the user approved, with a result to verify against open orders and positions. Source: `generated/all.json` (`execute_order`, `close_position` descriptions).

### Example queries

Changed 2026-11-19 to the list in `docs/listing-prompts.json`; the live form still holds the five earlier queries until the owner updates it.

- Compare NVDA, TSLA and BTC: price, funding, positioning and the latest news. No trade.
- Which companies report earnings this week, and what are NVDA's market cap and P/E?
- Show my Liquid portfolio, open orders and my last 10 trades.
- Preview a $50 ETH long at 2x with a stop loss 5% below entry, and place it after I approve the terms.
- Set a 20% trailing stop on my SOL position and show where it sits now.
- Which prediction markets are open on Bitcoin's price and this weekend's games? Show the odds.
- Switch to paper trading and plan a moderate-risk $1,000 portfolio across crypto, stocks and gold.
- How much USDC do I have in Earn, and what is my staked HYPE earning?

### Required customer account or plan

A Liquid account, signed in through OAuth. The account must be funded before live orders can fill. Eligibility and regional restrictions in the Liquid Terms apply.

### Geographic availability

Available globally, except regions restricted by the Liquid Terms of Service and sanctions rules.

## Remote MCP server

### Production MCP endpoint

https://coinvest-computer.liquid.trade/mcp

### MCP implementation documentation link

https://github.com/LiquidMax-dev/liquid-plugin/tree/main/plugins/co-invest-perplexity

### Authentication method

OAuth 2.1 with PKCE (S256).

Source: liquid-mcp `src/auth/oauth.ts` (authorization server metadata: `code_challenge_methods_supported: ["S256"]`, `grant_types_supported: ["authorization_code", "refresh_token"]`, `scopes_supported: ["read", "trade"]`); `README.md` ("MCP transport auth": bearer auth on `/mcp`, protected-resource metadata at `/.well-known/oauth-protected-resource/mcp`, authorization-server metadata at `/.well-known/oauth-authorization-server`).

### OAuth client registration method

Dynamic Client Registration (DCR) at `https://coinvest-computer.liquid.trade/oauth/register` (published authorization-server metadata, read 2026-11-16). No static client ID or secret is issued.

### Service status page

Left blank (optional).

### Supported transport

Streamable HTTP at `/mcp`. The server also dispatches `/sse` to `/mcp` (liquid-mcp `README.md`, "MCP transport auth").

### MCP protocol version

2025-06-18 (liquid-mcp `src/profiles/computer-v1-catalog-ca94644.json`; revisions from 2026-07-28 are refused by `src/modern-protocol-gate.ts`).

### Endpoint model

Universal. A single endpoint serves all users; the user is identified by the OAuth token.

### Tenant endpoint discovery or URL pattern

Not applicable. There are no per-tenant URLs; the user is identified by the OAuth token.

### Rate limits, timeouts, and retry guidance

No contractual per-user quota is published. Transient upstream failures can return retryable errors (429, 502, 503, 504). An unknown write outcome (timeout or pending) must be reconciled against open orders and positions before any retry; clients must not repeat an order blindly.

### Versioning and deprecation policy

Only additive changes are made on the stable endpoint URL. Breaking changes ship as a new profile or version, so existing connections keep working.

## Authentication

### Authentication documentation link

https://github.com/LiquidMax-dev/liquid-plugin/tree/main/plugins/co-invest-perplexity

### Does the Perplexity callback URL need to be allowlisted

No. On 2026-11-16 dynamic registration accepted `https://www.perplexity.ai/rest/connections/oauth_callback` for resource `https://coinvest-computer.liquid.trade/mcp` and the flow reached the Liquid consent page.

### Required scopes and rationale

`read`: market data, account reads and trade proposals. `trade`: live and simulated order placement, closes, order cancellation and other account changes. The Liquid consent flow grants both together; a read-only grant is not offered. Source: `src/auth/oauth.ts` (`scopes_supported`); `docs/muse-submission-form-1.0.2.md` ("Access requirements"). UNVERIFIED: the statement that a `trade` scope is enforced per write call comes from the paper-only profile section of liquid-mcp `README.md` and was not rechecked for the `all` profile.

### Authorization requirements

**Corrected 2026-11-19: the `confirmed` argument described here exists on Computer only for prediction orders and trailing stops; perpetual orders, closes, TP/SL and leverage changes run when called.** Per-user. Each user signs in to their own Liquid account and the token is bound to that user's wallet. Order and position changes also need the user's approval of exact terms in chat: the execution tools (`execute_order`, `close_position`, `execute_prediction_order` and similar) are annotated as destructive and take a `confirmed` argument that the assistant sets only after the user approves the previewed terms (`generated/all.json`, tool annotations and descriptions). This is a convention enforced by the tool contract and the assistant's behavior, not a server-issued confirmation token (liquid-mcp `generated/README.md`: "`caller-confirmation` does not claim a server-side confirmation token").

### Token refresh, revocation, and expiry behavior

Refresh tokens are supported (authorization_code and refresh_token grants, PKCE S256). The server introspects tokens and caches the result for at most 60 seconds, never beyond token expiry. Access tokens last 60 minutes and refresh tokens 30 days (liquidmax_server `public_api/v1/oauth.py` defaults; production values were not read). A user can disconnect the connector in Perplexity at any time.

### Production approval requirements

None beyond the user's OAuth sign-in and consent.

## Tools and data

### Key tools and capabilities

Names from `skills/coinvest/references/tools.md`; use a name only when the connected server exposes it.

- Research (scope `read`, read): `analyze_market`, `analyze_markets_batch`, `get_positioning_pulse`, `search_markets`, `get_news`, `get_technical_indicators`, `show_market_overview`, `show_orderbook`, `show_chart`, `plan_portfolio`.
- Account (scope `read`, read): `get_portfolio`, `view_open_orders`, `paper_trading_status`, `automated_trading_status`.
- Trading (scope `trade`, write; each needs the user's approval of exact terms in chat): `execute_order`, `execute_orders_batch`, `execute_tpsl`, `close_position`, `cancel_order`, `update_leverage`.
- Setup and mode (scope `trade`, write): `enable_trading`, `enable_paper_trading`, `disable_paper_trading`, `reset_paper_account`, `enable_automated_trading`, `disable_automated_trading`.

Owner decision, 2026-11-16: disclose the full catalog. A full tool list is available on request.

### Data categories accessed

Financial; User profiles.

### Data storage, logging, retention, and deletion

- Stored by the MCP service: session and connection state in Redis (session bindings have a default sliding 24-hour expiry), and tool-call telemetry. Telemetry can include arguments, outputs, user intent, and session and client identifiers. Source: `plugins/co-invest-muse/submission.md` ("Data processing and retention"). UNVERIFIED: carried over from the Muse draft dated 2026-10-12 and not rechecked against the current liquid-mcp.
- The Sentry configuration scrubs wallet addresses, tokens, emails and IPs and does not record tool inputs or outputs (liquid-mcp `README.md`, observability section). This covers Sentry events only, not the telemetry above.
- The plugin package itself adds no telemetry.
- Retention: Liquid's public privacy policy (https://www.liquid.trade/privacy) says information may be retained for an unlimited length of time. No connector-specific retention period is promised. OWNER: confirm any retention period by data class.
- Deletion: deletion requests go to customer-support@liquid.trade (published privacy contact). Revoking access or ending a session is not evidence that stored history has been erased. OWNER: confirm connector-specific deletion coverage and handling time.

### Hosting regions and data-residency options

The MCP service runs on AWS in Tokyo (ap-northeast-1). No data-residency options are offered. (Owner, 2026-11-16; this replaces the region list in the Muse draft.)

### Privacy policy

https://www.liquid.trade/privacy

### Security or trust center

Left blank (optional).

### Relevant security certifications

None.

## Validation and operations

### Sandbox or test environment

Yes. Paper trading on the same endpoint: `enable_paper_trading` switches the wallet to a simulator with simulated funds, `paper_trading_status` reports the mode, and `reset_paper_account` restores a clean simulated account.

### Synthetic data and test roles available

The paper simulator provides a simulated account with $10k of simulated funds; `reset_paper_account` restores a clean one. Leaderboards, referrals and watchlists in paper mode are real shared account data. A dedicated reviewer test account is already set up; an automated nightly test also uses it and may reset its simulated balance, positions and history.

### Secure test-access method

A dedicated Liquid test account (a Privy test login with a fixed 6-digit code) is available for reviewers. By the owner's direction the live form names the account and gives the code; neither is kept in this repository.

### Known limitations or differences from production

- Paper mode is shared by wallet within the connector.
- Leaderboards are real public rankings, not paper-account performance.
- `get_position_history` covers a bounded recent-fill window (up to 2,000 live fills or 100 paper fills), not all-time history (liquid-mcp `README.md`).
- Tool calls from inside Perplexity are unverified. On 2026-11-16 this connector reached the Liquid consent page from Perplexity; consent was not approved and no tool call was made.
- OAuth grants the normal Liquid `read` and `trade` permission, which is broader than any one workflow.
- Results are text; Co-Invest widgets are not rendered in Perplexity.

### Answer-quality evaluation materials available

Nothing available currently.

### Evaluation materials link

Left blank (optional).

### Technical owner name and email

Entered in the form by the owner's direction; personal contact details are not kept in this repository.

### OAuth or platform owner name and email

Entered in the form by the owner's direction; personal contact details are not kept in this repository.

### Security or incident contact

Entered in the form by the owner's direction; personal contact details are not kept in this repository.

### Business owner name and email

Entered in the form by the owner's direction; personal contact details are not kept in this repository.

### Production support contact or portal

https://liquid.trade/support and support@liquid.trade. Privacy and deletion requests: customer-support@liquid.trade.

### Support and incident-response commitments

No contractual SLA. Support and incident reports go to support@liquid.trade and are handled on a best-effort basis.

## Catalog listing

### Connector display name

Co-Invest

### Short tagline

Research markets and trade on Liquid from chat

(46 characters; limit 80. Changed 2026-11-19; was "Research markets and place trades you approve on Liquid".)

### Catalog description

Co-Invest connects Perplexity to your Liquid account. Research crypto, equities, commodities, indices and prediction markets with live prices, funding, positioning, news, earnings dates and company fundamentals. Review your portfolio, open orders and history. Orders are placed when you ask for them in chat, with no separate confirmation step, so name the asset, side and size you want. Protect positions with take-profit, stop-loss and trailing stops. Signing in grants Liquid's normal read and trade permission. A paper-trading mode with simulated funds is available for practice.

### Brand asset folder

https://github.com/LiquidMax-dev/liquid-plugin/tree/main/plugins/co-invest-perplexity/assets

### User-facing setup documentation

https://github.com/LiquidMax-dev/liquid-plugin/tree/main/plugins/co-invest-perplexity

### Terms of service

https://www.liquid.trade/termsofservice

### Support URL

https://liquid.trade/support

### Listing-use consent

Yes (owner's direction, 2026-11-16). The live form did not show the Catalog listing section; see Form status.

### Accuracy confirmation

Yes (owner's direction, 2026-11-16). The live form did not show the Catalog listing section; see Form status.

### No-secrets confirmation

Yes (owner's direction, 2026-11-16). The live form did not show the Catalog listing section; see Form status.

### Additional context

- Orders can be live. **Corrected 2026-11-19:** there is no server-side approval gate for perpetual orders on Computer; the control is the assistant acting only on an explicit request (the bundled skill's rule).
- Perplexity Computer is an autonomous agent. Users should be told that the connector can place live orders once they approve terms.
- Perplexity's GitHub import of `plugins/co-invest-perplexity` was verified on 2026-11-16; tool calls inside Perplexity are not yet verified.
- Support: support@liquid.trade. Privacy and deletion: customer-support@liquid.trade.

## Form status

On 2026-11-16 the agent filled the live form through its last visible page (Validation and operations) with the answers above and the owner's answers, and stopped before Submit. The live form showed six sections and no Catalog listing page, so those answers are kept here for a later step. A few long answers were shortened to fit the form's prefill link. The owner reviews the open form and submits it; the agent does not submit.
