# Co-Invest for Perplexity

Version **1.0.2**. Connector display name: **Co-Invest**.

Co-Invest for Perplexity connects Perplexity to Liquid's standard Co-Invest MCP endpoint, `https://coinvest.liquid.trade/mcp`, so you can research markets, review your Liquid portfolio, and place trades you approve in chat. The package contains one connector configuration, a manifest and Liquid's logo. It bundles no skill and adds no local code.

## Install and connect

1. In Perplexity, open Plugins > Add custom > Import plugin from GitHub.
2. Paste `https://github.com/LiquidMax-dev/liquid-plugin/tree/main/plugins/co-invest-perplexity`.
3. Open the imported plugin and choose Connect.
4. Sign in to Liquid when the consent page opens. Do not paste tokens into chat or configuration.

An order is placed only after you approve its exact terms in chat. Signing in grants Liquid's normal `read` and `trade` permission.

## Verification status

Verified on 2026-11-16 on a Perplexity Free plan with this folder: GitHub import succeeded with no warnings, `plugin.json` gave the title and description, `mcp.json` gave one connector named Co-Invest, and no skill was added. Connect registered an OAuth client and reached the Liquid consent page with redirect `https://www.perplexity.ai/rest/connections/oauth_callback`, scope `read trade` and resource `https://coinvest.liquid.trade/mcp`.

Not yet verified: tool calls inside Perplexity, because consent was not approved.

Perplexity could not import from a branch whose name contains a slash (`tree/feat/...` returned "No public GitHub repository, branch, or directory found"). Use `main` or a branch name without a slash.

## Links

- [Liquid Co-Invest](https://liquid.trade/coinvest)
- [Liquid app](https://app.liquid.trade)
- [Privacy policy](https://liquid.trade/privacy)
- [Terms of service](https://liquid.trade/termsofservice)
- [Source repository](https://github.com/LiquidMax-dev/liquid-plugin)

## License

MIT. See [LICENSE](LICENSE). The Liquid name and logo are trademarks of Liquid and are not licensed under the MIT License.
