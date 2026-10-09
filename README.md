![Co-Invest](skills/coinvest/assets/logo.svg)

# Liquid Co-Invest plugins

Liquid Co-Invest is free AI trading you control: research markets, size positions, and trade crypto, stocks, commodities, and FX inside Claude or ChatGPT. [Co-Invest Computer](https://www.liquid.trade/coinvest-computer) exposes Liquid as an MCP server, so agents in Codex, Claude Code, Cursor, Hermes, or any MCP client can research markets, watch for entries, and trade through Liquid. There is no subscription; executed trades pay standard Liquid trading fees.

Liquid Co-Invest is Liquid's multi-asset trading MCP, covering equities, commodities, indices, crypto, and other supported Liquid markets. The Cursor and Grok packages expose the workflows described below. A separate Muse package is being prepared for platform review against a paper-only endpoint; it is not yet accepted or connected to a deployed endpoint.

The Cursor plugin connects to Co-Invest Computer, whose direct trading tools place orders you explicitly request in chat, with no widget confirmation cards, and it bundles the Co-Invest skill. The Grok plugin connects to liquid-mcp's `all` profile: it returns text results, and an order is placed only after you approve its exact terms in chat.

## Plugins

| Plugin | Clients | Endpoint | Trading |
| --- | --- | --- | --- |
| [Co-Invest](plugins/co-invest) | Cursor | https://coinvest-computer.liquid.trade/mcp | Direct trades you authorize in chat |
| [Co-Invest](plugins/co-invest-grok) | Grok Bot, Grok Build | https://coinvest.liquid.trade/mcp?profile=all | Trades you approve in chat |
| [Co-Invest Paper](plugins/co-invest-muse) | Muse Connector Platform (submission prepared; review pending) | https://coinvest.liquid.trade/mcp?profile=paper-only | Orders through this connector are simulated; sign-in grants a normal Liquid permission, not a practice-only one; endpoint deployment and platform eligibility pending |

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
└── plugins/co-invest-muse/
    ├── plugin.json
    ├── mcp.json
    ├── paper-only.contract.json
    ├── paper-only.examples.json
    ├── paper-only.source.json
    ├── assets/logo.svg
    ├── submission.md
    ├── tools.md
    ├── CHANGELOG.md
    └── LICENSE
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
Plugins 1.0.0 manifest and MCP configuration format. Muse acceptance, OAuth
connection, and deployment of its paper-only endpoint are pending; the package
does not add an entry to the Cursor marketplace.

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

Changes are made by hand in this repository. `npm ci` then `npm run validate`
checks manifests against Cursor's and Agent Plugins' published schemas, the
skill copies, the Muse paper-only contract snapshot and generated reference,
and Cursor's submission checklist. `npm test` runs negative checks for the
hosted Muse package, and CI runs both commands on every pull request. Refresh
the Muse snapshot only from an explicit liquid-mcp checkout and source revision
with `npm run sync:muse-paper-only -- --mcp-root <path> --source-revision <sha>`.
liquid-mcp's `generate-plugin.mjs --out` predates this layout and deletes
`skills/` and `docs/`, so do not run it against this repository.

## Links

- [Co-Invest](https://liquid.trade/coinvest)
- [Liquid app](https://app.liquid.trade)
- [Privacy policy](https://liquid.trade/privacy)
- [Terms of service](https://liquid.trade/termsofservice)
- [Source repository](https://github.com/LiquidMax-dev/liquid-plugin)

## License

MIT. See [LICENSE](LICENSE).

The Liquid name and logo are trademarks of Liquid and are not licensed under the MIT License.
