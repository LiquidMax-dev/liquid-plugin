![Co-Invest](skills/coinvest/assets/logo.svg)

# Liquid Co-Invest plugins

Liquid Co-Invest is free AI trading you control: research markets, size positions, and trade crypto, stocks, commodities, and FX inside Claude or ChatGPT. [Co-Invest Computer](https://www.liquid.trade/coinvest-computer) exposes Liquid as an MCP server, so agents in Codex, Claude Code, Cursor, Hermes, or any MCP client can research markets, watch for entries, and trade through Liquid. There is no subscription; executed trades pay standard Liquid trading fees.

Liquid Co-Invest is Liquid's multi-asset trading MCP, covering equities, commodities, indices, crypto, and other supported Liquid markets. These plugins bring Co-Invest's market research and portfolio review into Cursor and Grok, with trading through Liquid's non-custodial wallet model.

The Cursor plugin connects to Co-Invest Computer, whose direct trading tools place orders you explicitly request in chat, with no widget confirmation cards, and it bundles the Co-Invest skill. The Grok plugin connects to liquid-mcp's `all` profile: it returns text results, and an order is placed only after you approve its exact terms in chat.

## Plugins

| Plugin | Clients | Endpoint | Trading |
| --- | --- | --- | --- |
| [Co-Invest](plugins/co-invest) | Cursor | https://coinvest-computer.liquid.trade/mcp | Direct trades you authorize in chat |
| [Co-Invest](plugins/co-invest-grok) | Grok Bot, Grok Build | https://coinvest.liquid.trade/mcp?profile=all | Trades you approve in chat |

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
└── plugins/co-invest-grok/
    ├── .cursor-plugin/plugin.json
    ├── .grok-plugin/plugin.json
    ├── mcp.json
    ├── .mcp.json
    ├── CHANGELOG.md
    └── README.md
```

Each plugin is a Cursor Plugin with its own `.cursor-plugin/plugin.json` (see
[Cursor's plugin reference](https://cursor.com/docs/reference/plugins)).
`co-invest` also carries an Agent Plugins manifest (`plugin.json`, see
[agent-plugins.org](https://agent-plugins.org)), and its `mcp.json` follows
the Agent Plugins MCP schema. Cursor reads `.cursor-plugin/plugin.json`
first. `co-invest-grok` also carries `.grok-plugin/plugin.json` for Grok
Build, with the same name, version and description, and its `mcp.json` and
`.mcp.json` are identical copies. `skills/coinvest` is the canonical skill, and
`plugins/co-invest/skills/coinvest` is a copy kept identical by
`npm run sync:skills`. Edit the root copy, then run that command.

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
skill copies, and Cursor's submission checklist, and CI runs it on every pull
request. liquid-mcp's `generate-plugin.mjs --out` predates this layout and
deletes `skills/` and `docs/`, so do not run it against this repository.

## Links

- [Co-Invest](https://liquid.trade/coinvest)
- [Liquid app](https://app.liquid.trade)
- [Privacy policy](https://liquid.trade/privacy)
- [Terms of service](https://liquid.trade/termsofservice)
- [Source repository](https://github.com/LiquidMax-dev/liquid-plugin)

## License

MIT. See [LICENSE](LICENSE).

The Liquid name and logo are trademarks of Liquid and are not licensed under the MIT License.
