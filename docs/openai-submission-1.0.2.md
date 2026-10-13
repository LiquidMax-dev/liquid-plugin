# OpenAI Co-Invest 1.0.2 submission

The owner-uploaded `Co-Invest-1.0.2-skills.zip` passed draft checks. The 1.0.2 draft is not submitted; 1.0.0 remains published. The checked upload preserves the published identity, listing fields and original PNG logos, uses the exact registered MCP URL, and adds three research skills. The current local portfolio-planning skill was corrected after upload, so its source differs from the checked artifact and must be rebuilt and rechecked before submission.

## Published metadata

| Field | Preserved value |
| --- | --- |
| Display name | Co-Invest |
| Package name | `app-6a20e26c6ab8819191519e2811e03522` |
| New version | `1.0.2` |
| Author / developer | Liquid |
| Short description | Research global markets 24/7 |
| Website | https://coinvest.ai |
| Support | https://liquid.trade/support |
| Privacy | https://liquid.trade/privacy |
| Terms | https://liquid.trade/termsofservice |

All published listing fields remain unchanged, including both long descriptions, the default prompt and empty capabilities array. The only manifest differences from the published baseline are `version` (`1.0.2`), `mcpServers`, and `skills`. Both original 256×256 PNG logos are byte-identical. The complete source manifest is pinned in `schemas/openai/published-plugin-1.0.0.json`.

## Build the update

With Node.js 20 or newer and Python 3:

```sh
npm ci
npm run validate
npm test
npm run package:openai -- --out /absolute/path/Co-Invest-1.0.2.zip
```

The destination must be a new absolute path outside the package directory. The archive has seven paths:

```text
.codex-plugin/plugin.json
.mcp.json
assets/logo.png
assets/logo-dark.png
skills/coinvest-market-research/SKILL.md
skills/coinvest-portfolio-planning/SKILL.md
skills/coinvest-earn-vaults/SKILL.md
```

The manifest declares `skills: "./skills/"` and points to `.mcp.json`, which declares the existing connection as:

```json
{
  "mcpServers": {
    "co-invest": {
      "url": "https://coinvest-chat.liquid.trade"
    }
  }
}
```

The registered URL is the exact string without a trailing slash. The portal UI displays a normalized slash, but the stored URL has none; use the stored value. `/mcp` remains the separate direct probe and catalog route documented below. The existing portal OAuth authorization remains in place. The `co-invest` declaration passed draft checks; the portal UI still shows the MCP key as “Not specified.” Repository documentation, the original manifest baseline, changelog, license and tool reference stay outside the archive.

The three self-contained skills cover market research, portfolio planning and Earn/vault research. They use only tools available through this Co-Invest connection, never switch endpoints or call raw APIs, and do not perform deposits, withdrawals or fund movements. Each skill reports a missing tool as unavailable rather than inventing a capability.

## Current tool reference

The public reference is maintained on the repository's main branch:

- [Human-readable tool names, descriptions and schemas](https://github.com/LiquidMax-dev/liquid-plugin/blob/main/docs/openai/tools.md)
- [Machine-readable tool catalog](https://github.com/LiquidMax-dev/liquid-plugin/blob/main/docs/openai/tools.json)

The OpenAI scan listed 44 tools: 34 current live, eight `previous_definition`, and two leaderboard tools marked `not_live`. Nine tools have a generic further-review reason: `suggest_trade`, `suggest_trades_batch`, `plan_portfolio`, `search_prediction_markets`, `show_prediction_orderbook`, `view_prediction_positions`, `view_prediction_orders`, `leaderboard_data`, and `leaderboard_rank`. The `enable_trading` name is unclear. The `edit_watchlist` finding is deferred at the owner's request; no split implementation is in scope. No direct-execution or Earn tools have been deployed through this ZIP; broader trade-links-only catalog work remains separate. The 44-definition reference was observed from `https://coinvest-chat.liquid.trade/mcp` on 2026-10-13; its timestamp and hash identify that snapshot, not portal approval. Tool documentation stays outside the ZIP.

The configured endpoint is `interactive-v1` / `trading-disabled-links-only`: market research, portfolio reads and review links for new trade suggestions, plus existing simulated account and position management. Liquid sign-in is required. The OAuth consent grants normal Liquid read and trade permissions, which are broader than the tools this endpoint exposes.

OpenAI reads tool definitions and descriptions from the hosted MCP server, separately from the plugin ZIP. Eligible MCP changes can propagate through automatic checks. Request a fresh check from **MCPs → server → Issues → Rescan** and inspect the resulting tool list and issues. Adding a tool catalog to the ZIP does not register tools. See [OpenAI's MCP update instructions](https://developers.openai.com/plugins/deploy/submission#update-to-your-mcp-server).

## Portal status

The owner-uploaded `Co-Invest-1.0.2-skills.zip` has SHA-256 `774f1a720a2a8d80db0e9f4a3d608c761aa53fd31e4330e60b41b8a2fa7d6c86`. All three skills show Checks passed, metadata shows No findings, and the MCP is Authorized with its domain verified. The `co-invest` declaration passed; the UI MCP key remains “Not specified.” The draft is Not submitted, and 1.0.0 remains published.

The local `coinvest-portfolio-planning/SKILL.md` has since been corrected and differs from the uploaded artifact. The verified replacement `Co-Invest-1.0.2-reviewed.zip` has seven files, 16,854 bytes and SHA-256 `d3d528313ac30ac250ddfdb8d8cd20adad9de8b7729d0a6dd1868f5cd802fad2`. Upload it and confirm its skill checks before submitting. The existing OAuth authorization and exact MCP URL remain unchanged. All 39 repository tests and validation pass. See [the complete finding review and draft explanation](openai-review-20261013.md).

The accepted upload's draft checks do not establish runtime skill behavior, submission, review approval or publication, and do not apply to the corrected local portfolio skill. Follow [OpenAI's published-plugin update workflow](https://developers.openai.com/plugins/deploy/submission#update-your-published-plugin) for submission. See [OpenAI's skills documentation](https://developers.openai.com/plugins/build/skills) for the host skill format.
