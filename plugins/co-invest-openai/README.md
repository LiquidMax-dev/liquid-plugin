# Co-Invest

This directory contains the repository documentation and the files used to prepare the Co-Invest OpenAI plugin upload. The upload ZIP contains exactly these seven files:

- `.codex-plugin/plugin.json`
- `.mcp.json`
- `assets/logo.png`
- `assets/logo-dark.png`
- `skills/coinvest-market-research/SKILL.md`
- `skills/coinvest-portfolio-planning/SKILL.md`
- `skills/coinvest-earn-vaults/SKILL.md`

The plugin manifest keeps the published identity, short description, links and logos, carries a rewritten long description and three starter prompts (not yet uploaded to OpenAI), and points to the existing Co-Invest MCP service at `https://coinvest-chat.liquid.trade`. Authentication remains managed by the existing OpenAI portal connection. Skills guide research using tools exposed by the current connection; they do not add server capabilities. Available tools and descriptions come from MCP scans, not from this ZIP. See [tool reference on main](https://github.com/LiquidMax-dev/liquid-plugin/blob/main/docs/openai/tools.md) for the current public tool reference.

## Try asking

Example requests that use tools this connection serves today. Live trade ideas open in Liquid for your review; they are not placed from ChatGPT. The first, third and fourth are the listing's starter prompts. Paper mode applies to your wallet across Liquid connectors; ask to switch back to live trading to leave it.

- What moved NVDA in the last 24 hours?
- Compare BTC, ETH and SOL: funding, positioning and key technical levels.
- Plan a moderate-risk portfolio across crypto, stocks and gold
- Which prediction markets are open on Bitcoin and on upcoming Premier League matches? Show the odds.
- Show my Liquid portfolio, open orders and my last 10 trades.
- Suggest a small ETH long with a stop loss and give me the link to review it in Liquid.
- Set a take-profit 10% above and a stop-loss 5% below the current price on my paper BTC position.
- Who are the top traders on Liquid this week, and where do I rank?

## Links

- [Liquid Co-Invest](https://www.liquid.trade/coinvest)
- [Liquid app](https://app.liquid.trade)
- [Support](https://www.liquid.trade/support)
- [Privacy policy](https://liquid.trade/privacy)
- [Terms of service](https://liquid.trade/termsofservice)
- [Source repository](https://github.com/LiquidMax-dev/liquid-plugin)

## License

MIT. See [LICENSE](LICENSE). The Liquid name and logo are trademarks of Liquid and are not licensed under the MIT License.
