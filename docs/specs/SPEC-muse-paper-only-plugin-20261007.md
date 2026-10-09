# SPEC-muse-paper-only-plugin-20261007

Status: 45-tool package implemented; expanded verification below (hosted target). Endpoint release and Muse QA pending. Date: 2026-10-07. Baseline: main 7ebb4bd.
Tracker: LIQ-5530. Depends on liquid-mcp SPEC-paper-only-profile-20261007.

**Corrected 2026-10-07 by the user's platform links:** target is the hosted Muse Connector Platform at https://muse.ai/platform, following https://muse.ai/platform/docs. The previous Muse Code native-plugin/settings design is superseded and must not be implemented.

## TLDR

Prepare `plugins/co-invest-muse` as a hosted paper-only MCP connector submission package. Endpoint: https://coinvest.liquid.trade/mcp?profile=paper-only. Include an open Agent Plugins manifest/MCP configuration for repository portability plus a complete submission draft and tool reference, not a Muse Code installer. No portal submission, acceptance of terms or deployment in this task.

## Problem

Muse requires a hosted connector that completes its advertised workflows, with accurate tool/permission and OAuth documentation. Its current finance policy does not approve new live money movement or financial trade tools. Our proposed scope is simulation using the enforced paper-only profile; the guidelines do not explicitly promise a simulation exemption, so approval eligibility must be disclosed rather than assumed.

## Solution

- Add plugins/co-invest-muse/plugin.json and mcp.json following the repository's pinned Agent Plugins schemas, name co-invest-muse/version1.0.0, exact endpoint above, no secrets. These are portable packaging; the portal does not document a required plugin manifest upload.
- Add README, CHANGELOG, LICENSE and authorized existing Liquid logo copy.
- Add submission.md: factual overview, simulation-only workflows/value, financial-policy caveat, OAuth resource discovery and scopes from actual server, business/contact/data-processing fields with explicit owner-confirmation markers wherever facts cannot be established, environment/release status, dedicated reviewer account checklist and demo steps.
- **Superseded 2026-10-07 by the 45-tool expansion:** the tool count and referral/automation-read exclusions in the original requirement below. Document all 45 tools, including simulator-only history, allocation, public rankings, shared preferences/referrals and read-only automation status; only live financial operations and authority mutations remain excluded.
- Add tools.md generated deterministically from a pinned copy of generated/paper-only.json: complete 38-tool documentation with input/output schemas, annotations, Read/Write/Sensitive write classification, approval and side effects, error/outcome/status semantics and measured/documented limits. Simulated execution tools are described as simulated state changes; irreversible shared-account reset is sensitive. No live trade, funding, account ledger, referral or automation tools.
- Reviewer demo: paper mode first call; paper portfolio; exact proposal and approval; simulated open and receipt; inspect orders; cancel/update/close; prediction paper flags; blocked live/disable; external wallet toggle cannot change this session. Never claim a pending/unknown outcome succeeded or retry it blindly.
- Validator discovers Agent Plugins packages independently from Cursor marketplace; preserve existing Cursor/Grok bytes. Strictly validate manifests and exact paper-only URL, absence of credentials/extra query/modes, tool-reference completeness, classifications and pinned contract integrity. No Muse native directories, installation settings, skill or CLI needed.

## Architecture

plugins/co-invest-muse/{plugin.json,mcp.json,README.md,CHANGELOG.md,LICENSE,assets/logo.svg,submission.md,tools.md,paper-only.contract.json,paper-only.examples.json,paper-only.source.json}. A deterministic repository script copies the contract and representative matrix examples and generates the tool reference from both. Separate source metadata pins the feature revision and contract/examples digests without machine paths. The copied contract records its source revision and hash separately; copying has no runtime registration effect. CI runs validation and Node negative tests. No new runtime dependencies or plugin telemetry.

## Phases

Independent advisor reviews this revised spec; author resolves findings; D resumes implementation. E reviews package; author executes validation and runtime MCP qualification and updates specs/tracker. One feature commit/PR per repo; user submits after live endpoint, reviewer access and owner answers are ready.

## Data models

**Corrected 2026-10-07 by the 45-tool expansion:** the copied catalog has 45 tools; the original 38-tool count in the paragraph below is superseded.

Agent Plugins 1.0.0 root manifest fields follow existing co-invest package conventions, with name/version/description for simulated practice. mcp.json has schema and mcpServers.Co-Invest={type:streamable-http,url:<exact endpoint>}. Submission draft is documentation, not an invented portal API. Contract snapshot and tool doc must match the final 38-tool MCP catalog, canonical hash and source revision; no copying old all tools.

## API contracts

Stateful MCP initialization pins paper-only and identity; later calls stay simulated without the URL query. OAuth uses the existing protected-resource/authorization-server discovery and approved hosted callback; requests need the documented read/trade scopes. Confirm read-only scope capability in code before claiming it is offered. The connector never switches modes, grants live automation, or sends the user away to complete an advertised supported simulated action.

## Risks

Eligibility for simulated trading is a platform review decision; no claim of automatic compliance or guaranteed acceptance. Portal form and Connector Terms are login-gated in this session, so precise intake fields and terms review remain owner prerequisites. Company contacts, retention and deletion answers cannot be fabricated from defaults. Reviewer credentials stay outside git and are supplied only through the portal's secure instructions. Public endpoint does not yet serve this profile; feature release and compatible rollback qualification precede submission.

## Verification

npm ci --ignore-scripts; npm run validate; existing skill-copy check; new Node negative tests for absent/malformed manifest, wrong/all endpoint, URL credentials/fragment/extra query, secrets, missing tool docs and mutated contract/classes; deterministic tool-doc regeneration diff. Existing plugins unchanged. MCP runtime/tool matrix verifies the same copied contract and paper routes; no actual Muse host success or portal submission claimed until authenticated review. User-facing surface is hosted tools; no new widgets/screens.

## Sources

https://muse.ai/platform/docs (read 2026-10-07); https://muse.ai/platform/terms (login required); https://muse.ai/platform (submission redirects to login). Local AGENT Plugins schemas and actual MCP catalog are the API authority.

## Advisor decisions (accepted before implementation)

- Advertised read/trade scopes are separate from verified authorization behavior. Companion MCP spec now adds verified `trade`-scope enforcement for paper-only bearer writes, tested with read-only and missing-scope tokens. Do not claim backend read-only grant issuance is proven unless checked.
- Document existing MCP /v1/tool-calls telemetry (arguments, outputs, user intent, session/client IDs), Redis binding state, simulator storage and external research queries. Plugin itself adds no telemetry; connector still has existing telemetry. Retention/deletion/business claims need owner confirmation.
- Explicit proposed classification per tool: preview+execution is Write; reset is Sensitive write. Chat confirmation and Muse HITL are distinct. New terms need fresh approval; actual Muse controls remain QA pending.
- Include representative input/expected outcome for EVERY submitted tool, plus denial/expired auth/partial batch/unknown-outcome reconciliation scenarios. Use final tool-matrix cases as the truthful basis, not a generic success checklist.
- Eligibility is not promised. Portal/terms and reviewer credentials use secure logged-in intake; do not write secrets into submission drafts.


## Initial 38-tool verification and owner choices (2026-10-07)

**Superseded 2026-10-07 by the 45-tool expansion below:** the initial tool count, pinned source/contract and exclusions of paper history and non-trading utilities. Historical verification results below refer to the initial version.

Node 22.22.2: npm run validate passed (two Cursor marketplace plugins, two Agent Plugins packages, two skills); npm test passed all 16 negative/validation cases; canonical skill-copy check, deterministic Muse snapshot check and git diff whitespace check passed. Existing Cursor and Grok packages plus marketplace remain byte-identical. Contract and examples copied from the verified MCP feature revision 888afbfe42af4330d5f404d497aefbe2d9836ba4 contain all 38 tools/cases. Canonical contract hash is c72f147156e0dec84272c6252f4c0e1a2e370e42e9e143548b8fea3d1a7cfbef; copied-file digest is ffa7212c9385603fe18abf6f0923330cb44b52d0661c30032491281be8998939. Companion built-server runtime passed 23 assertions and tool matrix 38/38 plus 12 stateful replays.

Use LiquidX AI, Inc. company data from current public terms. Owner selected the support address from product code for support, security and maintenance: support@liquid.trade. The published privacy/deletion mailbox remains customer-support@liquid.trade. Owner explicitly requested keeping the existing privacy policy; the draft accurately records its Muse-guideline comparison without changing the policy or promising compliance. **Corrected 2026-10-07:** owner subsequently supplied a Privy test account through an image. Isolated-browser email/OTP sign-in reached the authenticated Liquid OAuth consent view, verified by nine assertions. Testing stopped before approval; no OAuth token was minted or trading key provisioned by this test. No credential material is stored in this package; Muse delivery still uses secure intake.

Production profile release, exact new-profile rollback support, complete OAuth approval and authenticated Muse QA remain outside this preparation. The portal/Connector Terms were not accessible while logged out, were not accepted, and no submission occurred. Registration evidence, connector-specific processor/deletion/residency answers and authorized submitter details are clear owner fields in the draft rather than invented facts.

**Corrected 2026-10-07:** deployed discovery and PKCE session creation were executed. A request for only `read` returned `read trade`, matching backend source scope normalization. Existing consent approval can provision a live trading agent. The MCP paper-only execution boundary is verified separately and does not make the OAuth grant paper-only. A dedicated paper-only authorization path is a release decision; the submission draft now records the measured broader grant rather than leaving read-only issuance unverified. The public health catalog still exposes only `all` and `interactive-v1`.

## 45-tool expansion (2026-10-07)

User requested every paper-compatible tool. Follow the companion MCP spec's expanded-coverage amendment, which supersedes the original 38-tool catalog requirement in this document. Restore paper-only transaction history and portfolio allocation, public leaderboard_data/leaderboard_rank, shared edit_watchlist/refer utilities and read-only automated_trading_status. Trading balances/history are simulated; public rankings, referral statistics, preferences and saved-policy metadata retain their actual meaning. Watchlist edits are Write and require verified write scope; policy inspection stays Read and grants no trading authority. Live funding, Earn/staking holdings, payment links and automation-policy mutations stay excluded.

Update validator allowlist/count and approved hashes only after the reviewed MCP contract is generated. Copy all 45 examples and regenerate tool reference/source pin from the final verified MCP commit. Submission/README/demo must describe the distinction between simulated trading data and public/shared non-trading utilities. Preserve existing privacy policy, contacts, secure reviewer handling and measured OAuth limitations. Verification: all validator tests, new restored-tool classification checks where meaningful, deterministic source/docs sync, exact set of 45 examples and companion runtime results; existing packages stay byte-identical. Root owns spec edits and final source pin; plugin implementer owns package/scripts/tests only.


## Expanded 45-tool executed verification (2026-10-08)

The package is implemented and pinned to verified liquid-mcp commit f2a0ed5969dfa64787dceaaecc4d9aed6342300b. It contains all 45 tools and their recorded matrix examples. Canonical contract hash: dfebda6cbed7fcf447727792ee5b3da4e2549310b2c4eb793f1af84cea73b157; copied contract SHA-256: 9c6aa7ae21e9aa81fd886e7bc73805b759629358eb7dc4959dd1978eb90a2a2e; examples SHA-256: 6a76a0a72287bcc74228413ad64b948fb780cfdf9f4875d273dfb1609cc91a50.

On Node 22.22.2, npm run validate passed (two Cursor marketplace plugins, two Agent Plugins packages, two skills), all 17 tests passed, and the skill-copy, deterministic Muse snapshot and whitespace checks passed. Existing Cursor/Grok packages and marketplace are unchanged. The final companion MCP passed 3,872 unit tests with four existing skips, all 45 paper-only matrix cases plus 13 stateful replays, and 32 actual built-server HTTP assertions on the pinned Node version. Its six existing profile contracts remain byte-identical and retained history remains append-only. Paid model evaluations were not run.

Submission documentation now distinguishes simulated trading history/allocation from public real rankings, shared watchlist preferences, actual referral statistics and read-only automation policy metadata. Verified trade scope is required for watchlist writes as well as simulator writes. The user's company/contact/privacy choices and secure reviewer handling remain unchanged. The measured broader OAuth grant and release prerequisites are disclosed. Both companion PRs are ready for review, not drafts; no deployment, terms acceptance, OAuth approval or Muse portal submission was performed.

## Owner decisions on review feedback (2026-10-08, liquid-plugin #7)

**Risk 2026-10-08, endpoint selection by query parameter:** `?profile=paper-only` is the whole selection surface. A host that normalizes the stored URL, or a redirect that rebuilds the target without the query, reaches `https://coinvest.liquid.trade/mcp` with no `profile`, which is the full profile with live execution. The owner accepted this and chose not to add a path route: paper-only stays a custom URL used only by this Muse plugin. The validator pins the exact URL including the query, and a test fails a package whose URL lost it.

**Wording 2026-10-08:** user-facing text states what sign-in really grants: orders through this connector are simulated and its endpoint never places a live order; sign-in uses the normal Liquid account authorization shared with Liquid's other connectors, a permission not limited to practice trading (`read` returned `read trade`); the paper-only limit is enforced by Liquid's server for this connector's address, not by the permission. No new authorization path.
