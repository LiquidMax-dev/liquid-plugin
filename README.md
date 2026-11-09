![Co-Invest](skills/coinvest/assets/logo.svg)

# Liquid Co-Invest plugins

Liquid Co-Invest helps you research markets, size positions, and trade crypto, stocks, commodities, and FX through supported AI clients. [Co-Invest Computer](https://www.liquid.trade/coinvest-computer) exposes Liquid as an MCP server, so agents in Codex, Claude Code, Cursor, Hermes, or any MCP client can research markets, watch for entries, and use the trading tools exposed by their configured connection. There is no subscription; executed trades pay standard Liquid trading fees.

Liquid Co-Invest is Liquid's multi-asset MCP, covering equities, commodities, indices, crypto, and other supported Liquid markets. The Cursor and Grok packages expose the workflows described below. The Muse package connects to the production paper-only endpoint, verified on 2026-10-12; its platform submission is in review after owner submission. The OpenAI package uses the Restricted endpoint for research, portfolio reads and review links for new trade suggestions; its existing simulated account and position management tools are also available. Its OAuth consent uses normal Liquid read and trade permissions. The owner-uploaded OpenAI 1.0.2 ZIP passed draft checks, but has not been submitted; 1.0.0 remains published. The current local portfolio-planning skill differs from that checked upload. The Perplexity package connects to Co-Invest Computer, bundles the same skill as the Cursor package and installs through Perplexity's "Import plugin from GitHub"; on 2026-11-16 that import and the Liquid authorization step were verified with this package, while tool calls inside Perplexity were not verified by the agent. All repository plugin packages use version **1.0.3**, which changes listing text only; the Muse and OpenAI submissions described here were made with 1.0.2.

The Cursor plugin connects to Co-Invest Computer, whose direct trading tools place orders you explicitly request in chat, with no widget confirmation cards, and it bundles seven Co-Invest skills: the `coinvest` connection and safety skill plus workflow skills for research, portfolio review, allocation, trading, paper trading, and automation. The Grok plugin connects to liquid-mcp's `all` profile: it returns text results, and an order is placed only after you approve its exact terms in chat.

## Plugins

| Plugin | Clients | Endpoint | Trading |
| --- | --- | --- | --- |
| [Co-Invest](plugins/co-invest) | Cursor | https://coinvest-computer.liquid.trade/mcp | Direct trades you authorize in chat |
| [Co-Invest](plugins/co-invest-grok) | Grok Bot, Grok Build | https://coinvest.liquid.trade/mcp?profile=all | Trades you approve in chat |
| [Co-Invest](plugins/co-invest-muse) | Muse Connector Platform (in review) | https://coinvest.liquid.trade/mcp?profile=paper-only | Orders through this connector are simulated; sign-in grants a normal Liquid permission, not a practice-only one; production endpoint verified; Muse review pending |
| [Co-Invest](plugins/co-invest-perplexity) | Perplexity (GitHub import) | https://coinvest-computer.liquid.trade/mcp | Direct trades you authorize in chat; marketplace proposal drafted, not submitted |
| [Co-Invest](plugins/co-invest-openai) | OpenAI | https://coinvest-chat.liquid.trade | Market research, portfolio reads and review links for new trade suggestions; simulated account and position management tools |
| [Co-Invest](#claude) | Claude (custom connector, no package) | https://coinvest.liquid.trade | Trades you confirm on a card or in chat |

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
├── skills/coinvest-*/          (six workflow skills)
├── plugins/co-invest/
│   ├── .cursor-plugin/plugin.json
│   ├── plugin.json
│   ├── mcp.json
│   ├── skills/coinvest*/       (copies of the seven root skills)
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
├── plugins/co-invest-perplexity/
│   ├── plugin.json
│   ├── mcp.json
│   ├── assets/logo.svg
│   ├── CHANGELOG.md
│   ├── LICENSE
│   └── README.md
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
`.mcp.json` are identical copies. The root `skills/` directories are canonical, and
`plugins/co-invest/skills/` holds copies of all seven, kept identical by
`npm run sync:skills` (`SKILL_SYNC_MAP` in `scripts/sync-skills.mjs`). Edit the
root copy, then run that command. A new root skill must be added to that map;
`npm test` fails when the plugin does not bundle every root skill.

`co-invest-muse` is a hosted connector submission package using the Agent
Plugins 1.0.0 manifest and MCP configuration format. The paper-only endpoint is enabled and directly verified. Muse acceptance and
authenticated host execution remain separate review steps; the package does not
add an entry to the Cursor marketplace.

`co-invest-openai` keeps the published OpenAI identity, short description,
links and both original PNG logos. Its 1.0.3 manifest changes the version,
declares the existing MCP connection through `.mcp.json`, points to three
bundled research skills, and since 2026-11-19 carries a rewritten long
description and three starter prompts that have not been uploaded to OpenAI. The exact registered MCP URL has no trailing slash. The
uploaded ZIP passed metadata and skill checks, while the local
portfolio-planning skill has since been corrected and has not yet been
rechecked in a rebuilt ZIP. The portal's existing OAuth authorization remains
in place, and hosted tools are updated through MCP scans. Skills cannot add
tools to the server; no direct-execution or Earn tool deployment is claimed.
This package is outside the Cursor marketplace.
See the [OpenAI submission notes](docs/openai-submission-1.0.2.md) for the
package workflow and official OpenAI references.

## Claude

Claude connects to Co-Invest as a custom connector, so this repository has no Claude package. In the Claude apps (web, desktop, mobile), open Settings, then Connectors, choose Add custom connector, name it Co-Invest, paste `https://coinvest.liquid.trade` and sign in to Liquid. Research and perpetual trades come back as Co-Invest cards, and a trade is placed only after you confirm its card; tokenized-stock orders and trailing stops are placed after you confirm their preview in chat. Claude Code at the same address gets text results with chat confirmation; the `coinvest` skill's default for Claude Code is Co-Invest Computer.

Example requests that use tools this connection serves today. Tokenized stocks trade live only. Paper mode applies to your wallet across Liquid connectors; ask to switch back to live trading to leave it.

- Compare NVDA, TSLA and BTC: price, funding, positioning and the latest news. No trade.
- Show a 4h BTC chart, then its RSI and MACD and the order book.
- Which companies report earnings this week, and what are NVDA's market cap and P/E?
- Show my Liquid portfolio and open orders, then chart my allocation.
- Suggest an ETH long with $50 notional at 2x and a stop loss 5% below entry, as a card I can confirm.
- Buy $25 of tokenized Apple stock (EQAAPL) with no leverage. Show me the preview first.
- Set a trailing stop on my SOL position that gives back 20% of margin, and show its trigger price.
- Which prediction markets are open on Bitcoin and on upcoming Premier League matches? Show the odds.
- Switch to paper trading and plan a moderate-risk portfolio across crypto, stocks and gold.

Each plugin's README has its own list, because the endpoints serve different tools: tokenized stocks are available on the Claude and Grok connections only, and no connection has options. The lists and the tools behind each prompt are in [docs/listing-prompts.json](docs/listing-prompts.json).

<!-- coinvest-skill:start -->
## Install the Co-Invest skills

Install all seven skills with:

```text
npx skills add LiquidMax-dev/liquid-plugin
```

or one skill with `--skill <name>`, for example
`npx skills add LiquidMax-dev/liquid-plugin --skill coinvest`. The skills are
`coinvest` (connection and safety rules), `coinvest-research`,
`coinvest-portfolio-review`, `coinvest-allocate`, `coinvest-trade`,
`coinvest-paper-trading`, and `coinvest-automation`.

This installs portable guidance only. Configure the MCP connection separately in
your host's native MCP settings and complete Liquid OAuth there. By default,
[connect Computer](skills/coinvest/references/connect.md#default-connection)
for reads and user-authorized direct trades. Use Main or Restricted only when
explicitly selected; the skill installer does not register any server or grant
trading access. The Cursor plugin already bundles these skills.
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
npm run package:openai -- --out /absolute/path/Co-Invest-1.0.3.zip
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
