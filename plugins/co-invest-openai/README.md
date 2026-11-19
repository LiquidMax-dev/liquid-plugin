# Co-Invest

This directory contains the repository documentation and the files used to prepare the Co-Invest OpenAI plugin upload. The upload ZIP contains the manifest, the MCP map, the two logos and the shared skills bundled for this package (`skills/<name>/SKILL.md`, copied from the root `skills/` folder by `npm run sync:skills`):

- `.codex-plugin/plugin.json`
- `.mcp.json`
- `assets/logo.png`
- `assets/logo-dark.png`

Copies of the repository's root skills, bundled because this connection serves the tools they use:

| Skill | What it does |
| --- | --- |
| `coinvest-allocate` | A multi-position plan from `plan_portfolio`, proposed as one batch and placed only on your explicit yes. |
| `coinvest-funding` | Trading setup, deposit addresses, card on-ramp, payment and referral links. |
| `coinvest-market-scan` | What is moving, signals, ideas, the leaderboard and your watchlist. Places no trades. |
| `coinvest-paper-trading` | Paper mode status, switching and reset. |
| `coinvest-portfolio-review` | Balances, positions, open orders, history and allocation. Read-only. |
| `coinvest-prediction-markets` | Prediction markets: search, odds and order books, positions, buys, closes and cancels. |
| `coinvest-research` | One asset or a comparison: price, funding, positioning, technicals, order book, news. Read-only. |
| `coinvest-trade` | Perpetual orders, take-profit and stop-loss, closes, cancels and leverage, following this connection's approval step. |

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
