# Liquid Co-Invest plugins

Liquid Co-Invest is Liquid's multi-asset trading MCP, covering equities, commodities, indices, crypto, and other supported Liquid markets. These plugins bring Co-Invest's market research and portfolio review into Cursor and Grok, with trading through Liquid's non-custodial wallet model.

The Cursor plugin proposes trades and asks for your confirmation before placing them. The Grok plugin doesn't place live orders from chat: live trade suggestions include a prefilled Liquid review link, and you confirm the order in Liquid.

## Plugins

| Plugin | Clients | Endpoint | Trading |
| --- | --- | --- | --- |
| [Co-Invest](plugins/co-invest) | Cursor | https://coinvest.liquid.trade | Trades proposed for your confirmation in chat |
| [Co-Invest](plugins/co-invest-grok) | Grok Bot, Grok Build | https://coinvest-computer.liquid.trade | Automated Trading |

<!-- coinvest-skill:start -->
## Install the Co-Invest skill

Install with:

```text
npx skills add LiquidMax-dev/liquid-plugin --skill coinvest
```

This installs portable guidance only. Configure the MCP connection separately in
your host's native MCP settings and complete Liquid OAuth there. For a fresh
setup, [connect the recommended Computer MCP first](skills/coinvest/references/connect.md#recommended-fresh-setup).
Use Main for an explicitly selected interactive workflow or Restricted for
review-link behavior; the skill installer does not register any server or grant
trading access.
<!-- coinvest-skill:end -->

## How this repository is maintained

This repository is generated from Liquid's MCP server catalog. Do not edit it by hand — changes are overwritten.

## Links

- [Co-Invest](https://liquid.trade/coinvest)
- [Liquid app](https://app.liquid.trade)
- [Privacy policy](https://liquid.trade/privacy)
- [Terms of service](https://liquid.trade/termsofservice)
- [Source repository](https://github.com/LiquidMax-dev/liquid-plugin)

## License

MIT. See [LICENSE](LICENSE).

The Liquid name and logo are trademarks of Liquid and are not licensed under the MIT License.
