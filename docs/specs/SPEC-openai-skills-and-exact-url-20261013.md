# OpenAI skills and exact registered MCP URL

Status: implemented and locally verified; all 39 tests pass. Uploaded draft checks passed for the first skills archive. The corrected portfolio skill requires replacement upload and host runtime QA. On 2026-10-13 the owner authorized the separate MCP appeal, now submitted with all 11 explanations. Portal publication remains 1.0.0; its header was already In review before this appeal.

## TLDR

Correct the MCP URL byte-for-byte and bundle three useful research skills in Co-Invest 1.0.2. Expand the hosted Restricted catalog toward the all profile separately, preserving trade-links-only behavior as the owner confirmed. Skills cannot make unexposed tools available.

## Problem

The portal normalizes the displayed MCP URL with a trailing slash. Its actual app data stores `https://coinvest-chat.liquid.trade` without a slash, so the first four-file correction was rejected as a URL change. The owner also requested skills and broader all-profile coverage, including Earn and vaults.

## Solution

Keep the exact stored URL in `.mcp.json`. Add manifest `skills: "./skills/"`. Package three short self-contained skills under `skills/coinvest-market-research`, `skills/coinvest-portfolio-planning`, and `skills/coinvest-earn-vaults`, each containing only SKILL.md with valid name/description frontmatter. Preserve listing fields, original logos, version 1.0.2 and existing OAuth; allowed manifest differences from the original baseline are precisely version, mcpServers and skills.

Each skill uses the existing Co-Invest connection, discovers current host tools, treats results as data, and never substitutes another endpoint or raw API to bypass the restricted surface. Market research grounds prices/news/technical context in tool results and reports freshness. Portfolio planning uses authorized account reads and explicit user constraints, distinguishes portfolio facts from suggested allocations, and returns review links actually supplied by the available tools for requested trades. Never invent a URL or claim a trade executed from a proposal/link. Earn/vault research uses available read-only yield/vault tools, compares the fees, liquidity/lockups, terms and historical or estimated yields actually returned; it neither claims guaranteed returns nor performs deposits, withdrawals or fund movements. Missing tools are reported as unavailable rather than invented. Do not require or reveal credentials in skills. Simulated writes remain outside these three research skills.

## Architecture

The strict archive allowlist expands to seven files: manifest, MCP map, two PNGs and three SKILL.md files. Keep existing docs outside the ZIP. Validator requires the exact skill directory declaration and paths, validates YAML frontmatter/nonempty bodies and skill name/path agreement, and preserves credential, unexpected-file, symlink and deterministic-build checks. No scripts or extra skill resources are needed.

The broader hosted catalog investigation is a separate liquid-mcp concern. Do not change the registered plugin URL to select a different profile. Server changes need their own source-pinned spec, compatibility qualification and release approval; do not label unavailable Earn/vault tools as shipped through this ZIP.

## Phases

Advisor review, then non-overlapping package/skills, validator-builder, regression tests, docs and independent behavior review roles. Root integrates and keeps the existing plugin PR as one feature commit. **Corrected 2026-10-13:** the owner subsequently authorized the MCP manual-review appeal; submit and verify that appeal only. Package publication is not authorized by this correction.

## Data models and API contracts

`.mcp.json` remains `{ "mcpServers": { "co-invest": { "url": "https://coinvest-chat.liquid.trade" } } }`. The missing trailing slash is mandatory because the platform compares the original stored string. No new OAuth client or permission changes. Skill frontmatter names match folder names; descriptions identify Co-Invest and each workflow. All three combined plugin-name/skill-name lengths must fit the documented 64-character limit.

## Risks

Skill instructions cannot override a server capability boundary or cause tools to pass platform review. Keep catalog expansion and MCP tool-review status explicit. The owner uploaded the first skills archive successfully; the browser bridge denies setting file inputs, so replacement uploads remain owner-driven. Draft checks are not host runtime execution or publication.

## Verification

- Strict tests reject missing/changed skills declarations, invalid frontmatter/path names, missing bodies, unexpected skill files and symlinks; preserve metadata/logo and exact URL assertions, including rejection of trailing slash and `/mcp` variants.
- Build seven-file ZIP; independently compare original metadata allowing only version+mcpServers+skills; original image bytes unchanged; no secrets.
- Run skill-creator quick_validate for every skill. Independent behavioral review uses requests for market news, portfolio allocation and vault comparison with absent tool scenarios, ensuring no endpoint switching or direct fund movements. This evaluates instruction quality, not runtime skill execution; actual skill runtime QA remains pending until owner import and representative host requests pass.
- Repository validation, full tests, skill-copy check, syntax and whitespace gates; update PR and run CI. Owner reupload must validate exact MCP preservation and the new skills before public submission.

Sources: authenticated portal app data `associated_apps[0].mcp_url` (2026-10-13); OpenAI submission documentation https://developers.openai.com/plugins/deploy/submission and skills documentation https://developers.openai.com/plugins/build/skills, checked 2026-10-13.

## Executed verification and review

The owner-uploaded seven-file archive `Co-Invest-1.0.2-skills.zip` (SHA-256 `774f1a720a2a8d80db0e9f4a3d608c761aa53fd31e4330e60b41b8a2fa7d6c86`) passed metadata and all three skill checks. The exact no-slash URL and `co-invest` declaration were accepted without changing OAuth. Version 1.0.2 is a draft, Not submitted; 1.0.0 remains published. The MCP is Authorized with a verified domain.

Independent behavioral review then corrected the portfolio skill to follow the available `plan_portfolio` native-question workflow and its required single `suggest_trades_batch` handoff. The replacement `Co-Invest-1.0.2-reviewed.zip` has seven files, 16,854 bytes and SHA-256 `d3d528313ac30ac250ddfdb8d8cd20adad9de8b7729d0a6dd1868f5cd802fad2`. Independent comparison with the published export verified identical logos, exact MCP URL, and only version/MCP/skills manifest changes. Repository validation, 39 tests, deterministic build, skills-copy and whitespace checks passed. All three skills passed the skill-creator validator; source review is not a host execution test. The replacement has not been uploaded.

All 44 scanned MCP definitions and all findings were read. There are 34 current live definitions, eight previous definitions retained, and two leaderboard tools not live. **Updated 2026-10-13:** the latest scan gives all 11 flagged tools a generic further-review reason, superseding the earlier name-clarity and operation-splitting findings. The owner requires keeping `enable_trading` and `edit_watchlist` unchanged and authorized explanations for all findings. The appeal is submitted and its full saved text verified. No Earn deployment or package publication was performed. See `docs/openai-review-20261013.md` and the exact appeal text for current disposition; scans remain paused while the appeal is pending.
