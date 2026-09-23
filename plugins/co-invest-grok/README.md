# Co-Invest

Co-Invest connects Grok to Liquid's trading MCP. Research markets, review your Liquid portfolio, and prepare trades to review and place in Liquid.

Live trade suggestions include a prefilled Liquid review link, and you review and confirm the order in Liquid. Co-Invest does not place live orders from chat.

Grok Bot shows results as text. Cards and charts render only in clients that support MCP Apps.

## Install

### Grok Bot

Not yet available in Grok Bot's plugin catalog. Until then, ask Grok Bot in a chat to add a custom MCP connector named "Co-Invest" with the URL `https://coinvest-chat.liquid.trade/mcp`, then sign in with your Liquid account if prompted.

### Grok Build

Not yet available in Grok Build's marketplace. Until then, clone `https://github.com/LiquidMax-dev/liquid-plugin` and copy `plugins/co-invest-grok` into `~/.grok/plugins/`.

## MCP configuration

```json
{
  "mcpServers": {
    "Co-Invest": {
      "type": "http",
      "url": "https://coinvest-chat.liquid.trade/mcp"
    }
  }
}
```

## Sign-in

Sign-in uses OAuth with your Liquid account. The client starts the OAuth flow the first time it connects to Co-Invest, so there's no API key or client ID to configure. Liquid's OAuth server offers the `read` and `trade` scopes.

Removing the plugin or connector stops your client from using Co-Invest.

## How trading works

When Co-Invest suggests a live trade, the result includes a prefilled Liquid review link instead of placing the order. Open the link, check the account mode and order details, and confirm it in Liquid.

Paper trading uses virtual funds and never places live orders or moves real funds. Placing a new paper order from chat uses a confirmation card, which needs a client that renders MCP Apps. Grok Bot doesn't render cards, so there you ask for a paper order review link and confirm it in Liquid. Managing existing paper positions, such as closing a position, setting take-profit / stop-loss, changing leverage or cancelling an order, works in chat after you confirm.

## What agents can do

### Markets

- Opinionated analysis on any market — price, positioning, funding, whale activity, and smart money vs crowd.
- Find the most crowded long-heavy and short-heavy markets.
- Five news-driven trade ideas with catalysts and reasoning.
- Compare price, funding, and positioning across multiple assets in one widget.
- Browse or filter every tradeable market by symbol or asset class.
- Browse HIP-4 prediction markets and outcome probabilities.
- View bids and asks for a prediction-market outcome.
- Your open or historical prediction-market orders.
- Your active limit, trigger, and take-profit / stop-loss orders.
- Your account balance, positions, and live p&l.
- Your recent transaction history — trades, deposits, withdrawals, transfers, and prediction activity.
- Recent perpetual position history with entry, exit, gross realized PnL, and fees.
- Recent market headlines mapped to assets and themes.

### Trades

- Propose a live trade to review in Liquid, or confirm a paper trade.
- Prepare a paper-only order review link in Liquid.
- Propose a basket with Liquid review links, or confirm paper trades.
- Build a multi-trade portfolio plan from your prefs, then surface every trade in one Place-All basket.

### Data

- Render a full dashboard of every tradeable market.
- Show live bid/ask depth for a specific market.
- Show a candlestick and volume chart for a market.
- Compute RSI, MACD, moving averages, and other technical indicators for a market.
- Your open prediction-market positions.
- Render a pie chart of your position allocation.
- Rank Liquid traders by PnL, volume, points, or streak over any window.
- Check where a trader — or you — sits on the Liquid leaderboard.
- Read the content of a web link — X/Twitter posts get author, age and full text; other pages return title, description and article text.
- Add, remove, or set symbols on one of your watchlists.

### Funding

- Check and complete the account setup needed before trading.
- Fund your account by credit card, other apps, or wallet transfer.
- Your HYPE staking — staked balance, validators, predicted APR, rewards and the unstaking queue.

### Paper

- Enable simulated trading for this wallet in the MCP connector; the Liquid web app is unaffected.
- Disable this wallet's paper trading in the MCP connector and return to live account data.
- Reset the simulated account to a fresh default balance.
- Check this wallet's paper trading mode in the MCP connector; the Liquid web app is unaffected.
- Close or partially reduce a paper position.
- Close all paper positions or a specified subset.
- Set or update TP/SL on a paper position.
- Update leverage on a paper position.
- Cancel an open paper order.

### Sharing

- Show your referral link, share card, and referral stats.

## Network and data

This plugin contains only configuration: a manifest, the MCP endpoint, and this documentation. It has no local code, hooks, or scripts.

Tool requests go to `https://coinvest-chat.liquid.trade/mcp`, which Liquid operates. Sign-in opens Liquid's account sign-in page in your browser. Liquid's privacy policy, linked below, describes how Liquid handles your data.

## Risk

Trading involves risk, including the risk of loss of funds. Review every trade before you confirm it.

## Links

- [Co-Invest](https://liquid.trade/coinvest)
- [Liquid app](https://app.liquid.trade)
- [Privacy policy](https://liquid.trade/privacy)
- [Terms of service](https://liquid.trade/termsofservice)
- [Source repository](https://github.com/LiquidMax-dev/liquid-plugin)

## License

MIT. See [LICENSE](LICENSE).

The Liquid name and logo are trademarks of Liquid and are not licensed under the MIT License.
