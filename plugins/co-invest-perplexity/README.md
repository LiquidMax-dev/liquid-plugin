# Co-Invest for Perplexity

Version **1.0.3**. Connector display name: **Co-Invest**.

Co-Invest for Perplexity connects Perplexity to Liquid's Co-Invest Computer endpoint, `https://coinvest-computer.liquid.trade/mcp`, so you can research markets, review your Liquid portfolio, and place trades you ask for in chat. Computer returns text results, which suits Perplexity because it does not render Co-Invest widgets. The package contains one connector configuration, the `coinvest` skill (a synced copy of `skills/coinvest`), a manifest and Liquid's logo. It adds no local code. Perplexity shows the plugin as `co-invest`.

## Install and connect

1. In Perplexity, open Plugins > Add custom > Import plugin from GitHub.
2. Paste `https://github.com/LiquidMax-dev/liquid-plugin/tree/main/plugins/co-invest-perplexity`.
3. Open the imported plugin and choose Connect.
4. Sign in to Liquid when the consent page opens. Do not paste tokens into chat or configuration.

Computer places an order when the assistant calls the trading tool; there is no separate confirmation step, and the bundled skill tells the assistant to act only on an explicit request naming the asset, side and size. Signing in grants Liquid's normal `read` and `trade` permission.

## Try asking

Example requests that use tools Co-Invest Computer serves today. Computer places an order when the assistant calls the tool, with no separate confirmation step, so ask to see the terms first when you want to review them. Paper mode applies to your wallet across Liquid connectors; ask to switch back to live trading to leave it.

- Compare NVDA, TSLA and BTC: price, funding, positioning and the latest news. No trade.
- Which companies report earnings this week, and what are NVDA's market cap and P/E?
- Show my Liquid portfolio, open orders and my last 10 trades.
- Show me the terms for an ETH long with $50 notional at 2x and a 5% stop loss, and place it once I approve.
- Set a trailing stop on my SOL position that gives back 20% of margin, and show its trigger price.
- Which prediction markets are open on Bitcoin and on upcoming Premier League matches? Show the odds.
- How much USDC do I have in Earn, and what is my staked HYPE earning?
- Switch to paper trading and plan a moderate-risk portfolio across crypto, stocks and gold.

## Verification status

Verified on 2026-11-16 on a Perplexity Free plan with this folder: GitHub import succeeded with no warnings, `plugin.json` gave the title `co-invest` and the description, `mcp.json` gave one connector named Co-Invest, and the `coinvest` skill was imported. Connect registered an OAuth client and reached Liquid's authorization step with redirect `https://www.perplexity.ai/rest/connections/oauth_callback`, scope `read trade` and resource `https://coinvest-computer.liquid.trade/mcp`.

Not verified by the agent: tool calls inside Perplexity.

Perplexity could not import from a branch whose name contains a slash (`tree/feat/...` returned "No public GitHub repository, branch, or directory found"). Use `main` or a branch name without a slash.

## Links

- [Liquid Co-Invest](https://liquid.trade/coinvest)
- [Liquid app](https://app.liquid.trade)
- [Privacy policy](https://liquid.trade/privacy)
- [Terms of service](https://liquid.trade/termsofservice)
- [Source repository](https://github.com/LiquidMax-dev/liquid-plugin)

## License

MIT. See [LICENSE](LICENSE). The Liquid name and logo are trademarks of Liquid and are not licensed under the MIT License.
