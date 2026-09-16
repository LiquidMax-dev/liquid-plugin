# Co-Invest

Co-Invest connects Cursor to Liquid's trading MCP. Research markets, review your Liquid portfolio, and confirm trades without leaving Cursor.

Co-Invest proposes trades in chat and asks for your confirmation before placing them. You can also practice with paper trading using virtual funds.

## Install

### Cursor

Not yet available in Cursor's marketplace. Until then, add the MCP configuration below to `~/.cursor/mcp.json`.

## MCP configuration

```json
{
  "mcpServers": {
    "Co-Invest": {
      "type": "http",
      "url": "https://coinvest.liquid.trade/mcp"
    }
  }
}
```

## Sign-in

Sign-in uses OAuth with your Liquid account. The client starts the OAuth flow the first time it connects to Co-Invest, so there's no API key or client ID to configure. Liquid's OAuth server offers the `read` and `trade` scopes.

Removing the plugin or connector stops your client from using Co-Invest.

## How trading works

Trades are proposed first, and Co-Invest's trading tools ask for your confirmation before placing anything. New orders and take-profit / stop-loss changes appear as a confirmation card. Position closes, leverage changes, and prediction-market orders and cancellations show a preview in chat and are placed after you confirm there. Actions you ask for directly, such as cancelling an order, switching paper trading on or off, or editing a watchlist, run when you request them.

Review every proposal before you confirm. Trading runs through Liquid's non-custodial wallet model, so your funds stay under your control.

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
- Recent market headlines mapped to assets and themes.

### Trades

- Propose a trade with a one-click confirm/cancel card.
- Prepare a paper-only order review link in Liquid.
- Change the size or side of an open position.
- Close one, some, or all open positions after explicit confirmation.
- Propose a basket of trades with one Place-all confirmation widget.
- Build a multi-trade portfolio plan from your prefs, then surface every trade in one Place-All basket.
- Place a HIP-4 prediction-market order.
- Close all or part of a prediction-market position.
- Cancel a resting prediction-market order.
- Adjust leverage on a market before or after a trade.
- Cancel a resting or pending order by order id.

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
- Convert between USDC and USDH when a balance needs the other quote token.

### Paper

- Enable simulated trading for this wallet in the MCP connector; the Liquid web app is unaffected.
- Disable this wallet's paper trading in the MCP connector and return to live account data.
- Reset the simulated account to a fresh default balance.
- Check this wallet's paper trading mode in the MCP connector; the Liquid web app is unaffected.

### Sharing

- Show your referral link, share card, and referral stats.

## Network and data

This plugin contains only configuration: a manifest, the MCP endpoint, and this documentation. It has no local code, hooks, or scripts.

Tool requests go to `https://coinvest.liquid.trade/mcp`, which Liquid operates. Sign-in opens Liquid's account sign-in page in your browser. Liquid's privacy policy, linked below, describes how Liquid handles your data.

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
