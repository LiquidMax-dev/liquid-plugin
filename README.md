![Co-Invest](skills/coinvest/assets/logo.svg)

# Liquid Co-Invest plugins

Liquid Co-Invest helps you research markets, size positions, and trade crypto, stocks, commodities, and FX through supported AI clients. [Co-Invest Computer](https://www.liquid.trade/coinvest-computer) exposes Liquid as an MCP server, so agents in Codex, Claude Code, Cursor, Hermes, or any MCP client can research markets, watch for entries, and use the trading tools exposed by their configured connection. There is no subscription; executed trades pay standard Liquid trading fees.

Liquid Co-Invest is Liquid's multi-asset MCP, covering equities, commodities, indices, crypto, and other supported Liquid markets. The Cursor and Grok packages expose the workflows described below. The Muse package connects to the production paper-only endpoint, verified on 2026-10-12; its platform submission is in review after owner submission. The OpenAI package uses the Restricted endpoint for research, portfolio reads and review links for new trade suggestions; its existing simulated account and position management tools are also available. Its OAuth consent uses normal Liquid read and trade permissions. The owner-uploaded OpenAI 1.0.2 ZIP passed draft checks, but has not been submitted; 1.0.0 remains published. The current local portfolio-planning skill differs from that checked upload. All repository plugin packages use version **1.0.2**.

The Cursor plugin connects to Co-Invest Computer, whose direct trading tools place orders you explicitly request in chat, with no widget confirmation cards, and it bundles the Co-Invest skill. The Grok plugin connects to liquid-mcp's `all` profile: it returns text results, and an order is placed only after you approve its exact terms in chat.

## Plugins

| Plugin | Clients | Endpoint | Trading |
| --- | --- | --- | --- |
| [Co-Invest](plugins/co-invest) | Cursor | https://coinvest-computer.liquid.trade/mcp | Direct trades you authorize in chat |
| [Co-Invest](plugins/co-invest-grok) | Grok Bot, Grok Build | https://coinvest.liquid.trade/mcp?profile=all | Trades you approve in chat |
| [Co-Invest](plugins/co-invest-muse) | Muse Connector Platform (in review) | https://coinvest.liquid.trade/mcp?profile=paper-only | Orders through this connector are simulated; sign-in grants a normal Liquid permission, not a practice-only one; production endpoint verified; Muse review pending |
| [Co-Invest](plugins/co-invest-openai) | OpenAI | https://coinvest-chat.liquid.trade | Market research, portfolio reads and review links for new trade suggestions; simulated account and position management tools |

## Repository layout

```text
liquid-plugin/
├── .cursor-plugin/marketplace.json
├── .github/workflows/validate-plugins.yml
├── package.json
├── schemas/
├── scripts/validate-plugins.mjs
├── scripts/sync-skills.mjs
├── skills/coinvest/
├── plugins/co-invest/
│   ├── .cursor-plugin/plugin.json
│   ├── plugin.json
│   ├── mcp.json
│   ├── skills/coinvest/
│   ├── CHANGELOG.md
│   └── README.md
├── plugins/co-invest-grok/
│   ├── .cursor-plugin/plugin.json
│   ├── .grok-plugin/plugin.json
│   ├── mcp.json
│   ├── .mcp.json
│   ├── CHANGELOG.md
│   └── README.md
├── plugins/co-invest-muse/
│   ├── plugin.json
│   ├── mcp.json
│   ├── paper-only.contract.json
│   ├── paper-only.examples.json
│   ├── paper-only.source.json
│   ├── assets/logo.svg
│   ├── submission.md
│   ├── tools.md
│   ├── CHANGELOG.md
│   └── LICENSE
├── plugins/co-invest-openai/
│   ├── .codex-plugin/plugin.json
│   ├── .mcp.json
│   ├── assets/logo.png
│   ├── assets/logo-dark.png
│   ├── CHANGELOG.md
│   ├── LICENSE
│   ├── README.md
│   └── skills/
│       ├── coinvest-market-research/SKILL.md
│       ├── coinvest-portfolio-planning/SKILL.md
│       └── coinvest-earn-vaults/SKILL.md
├── docs/openai/tools.json
├── docs/openai/tools.md
└── docs/openai-submission-1.0.2.md
```

The `co-invest` and `co-invest-grok` packages are Cursor Plugins with their own
`.cursor-plugin/plugin.json` (see
[Cursor's plugin reference](https://cursor.com/docs/reference/plugins)).
`co-invest` also carries an Agent Plugins manifest (`plugin.json`, see
[agent-plugins.org](https://agent-plugins.org)), and its `mcp.json` follows
the Agent Plugins MCP schema. Cursor reads `.cursor-plugin/plugin.json`
first. `co-invest-grok` also carries `.grok-plugin/plugin.json` for Grok
Build, with the same name, version and description, and its `mcp.json` and
`.mcp.json` are identical copies. `skills/coinvest` is the canonical skill, and
`plugins/co-invest/skills/coinvest` is a copy kept identical by
`npm run sync:skills`. Edit the root copy, then run that command.

`co-invest-muse` is a hosted connector submission package using the Agent
Plugins 1.0.0 manifest and MCP configuration format. The paper-only endpoint is enabled and directly verified. Muse acceptance and
authenticated host execution remain separate review steps; the package does not
add an entry to the Cursor marketplace.

`co-invest-openai` preserves the published OpenAI listing metadata and both
original PNG logos. Its 1.0.2 manifest changes the version, declares the
existing MCP connection through `.mcp.json`, and points to three bundled
research skills. The exact registered MCP URL has no trailing slash. The
uploaded ZIP passed metadata and skill checks, while the local
portfolio-planning skill has since been corrected and has not yet been
rechecked in a rebuilt ZIP. The portal's existing OAuth authorization remains
in place, and hosted tools are updated through MCP scans. Skills cannot add
tools to the server; no direct-execution or Earn tool deployment is claimed.
This package is outside the Cursor marketplace.
See the [OpenAI submission notes](docs/openai-submission-1.0.2.md) for the
package workflow and official OpenAI references.

<!-- coinvest-skill:start -->
## Install the Co-Invest skill

Install with:

```text
npx skills add LiquidMax-dev/liquid-plugin --skill coinvest
```

This installs portable guidance only. Configure the MCP connection separately in
your host's native MCP settings and complete Liquid OAuth there. By default,
[connect Computer](skills/coinvest/references/connect.md#default-connection)
for reads and user-authorized direct trades. Use Main or Restricted only when
explicitly selected; the skill installer does not register any server or grant
trading access.
<!-- coinvest-skill:end -->

## How this repository is maintained

Changes are made by hand in this repository. Use Node.js 20 or newer and Python
3. `npm ci` then `npm run validate` checks manifests against Cursor's and Agent
Plugins' published schemas, the skill copies, the Muse paper-only contract
snapshot and generated reference, Cursor's submission checklist, and the
OpenAI published metadata/logo baseline and generated tool reference. `npm test` runs negative checks
for the hosted Muse and OpenAI packages, and CI runs both commands on every
pull request. Refresh
the Muse snapshot only from an explicit liquid-mcp checkout and source revision
with `npm run sync:muse-paper-only -- --mcp-root <path> --source-revision <sha>`.
liquid-mcp's `generate-plugin.mjs --out` predates this layout and deletes
`skills/` and `docs/`, so do not run it against this repository.

Build the OpenAI ZIP to an explicit absolute output path that does not already
exist and is outside the package directory:

```sh
npm run package:openai -- --out /absolute/path/Co-Invest-1.0.2.zip
```

The build validates the OpenAI package and archives seven files: the manifest,
`.mcp.json`, both PNG logos, and the three `skills/*/SKILL.md` files. The
[OpenAI tool reference](https://github.com/LiquidMax-dev/liquid-plugin/blob/main/docs/openai/tools.md)
and its JSON snapshot stay in the repository, outside the ZIP. After replacing
the snapshot with a sanitized public tools/list result, run
`npm run sync:openai-tools`; validation detects generated-document drift.
OpenAI scans tool definitions from the hosted MCP server; adding tool JSON to
the ZIP does not register them. Publishing or updating a listing is a separate
OpenAI dashboard action.

## Links

- [Co-Invest](https://liquid.trade/coinvest)
- [Liquid app](https://app.liquid.trade)
- [Privacy policy](https://liquid.trade/privacy)
- [Terms of service](https://liquid.trade/termsofservice)
- [Source repository](https://github.com/LiquidMax-dev/liquid-plugin)

## License

MIT. See [LICENSE](LICENSE).

The Liquid name and logo are trademarks of Liquid and are not licensed under the MIT License.
