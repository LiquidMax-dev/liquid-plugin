# Co-Invest

Co-Invest connects Grok to Liquid's MCP server with the `all` profile. Research markets, review your Liquid portfolio, and place orders only after you approve their exact terms in chat: results come back as text, structured data, or links.

## Install

### Grok Bot

Not yet in Grok Bot's plugin catalog. Open Grok Bot's "Add MCP Server" dialog and paste the MCP configuration block below, then sign in with your Liquid account when prompted. If you added the 1.0.0 connector (`https://coinvest-chat.liquid.trade/mcp`), remove it first.

### Grok Build

Not yet available in Grok Build's marketplace. Until then, clone `https://github.com/LiquidMax-dev/liquid-plugin` and copy `plugins/co-invest-grok` into `~/.grok/plugins/`.

## MCP configuration

```json
{
  "mcpServers": {
    "Co-Invest": {
      "type": "http",
      "url": "https://coinvest.liquid.trade/mcp?profile=all"
    }
  }
}
```

## Sign-in

Sign-in uses OAuth with your Liquid account. The client starts the OAuth flow the first time it connects to Co-Invest, so there's no API key or client ID to configure. Liquid's OAuth server offers the `read` and `trade` scopes.

Removing the plugin or connector stops your client from using Co-Invest.

## How trading works

Before placing any order from chat, the agent gets a preview and shows you its exact terms: asset, side, size, order type, price, time in force, leverage, take-profit / stop-loss, and whether it's live or paper. The order is placed only after you explicitly approve that unchanged action. Changing any term needs a fresh preview and a fresh approval. If an order's outcome is uncertain, the agent checks your orders and account before retrying instead of repeating the action blind.

Cancelling a resting order runs as soon as you ask for it. Cancelling a prediction-market order needs the same preview-and-approval step as any other prediction order.

Paper trading follows the same preview and approval flow, using the paper execution mode instead of your live account. The agent can also prepare a paper-only review link (`suggest_order`) that you open and confirm in Liquid instead of in chat. Paper mode is keyed by your wallet on Liquid's shared paper simulator, so turning it on or off here also turns it on or off for every other Liquid MCP connector using that wallet. The Liquid web app is unaffected either way.

## What agents can do

The connected server groups its tools by what they do. The names below are examples: the connected server's live tool list is authoritative, and this plugin doesn't pin a fixed number of tools.

- **Research:** market analysis, positioning and crowd-bias reads, technical indicators, order books, price history, a market overview, leaderboard rankings, and news, such as `analyze_market`, `show_chart`, `get_news`, and `leaderboard_data`.
- **Account:** balances, positions, open orders, your position allocation, and transaction or position history, such as `get_portfolio`, `view_open_orders`, `get_account`, and `get_transaction_history`.
- **Trading:** preparing and previewing a trade, then placing, closing, or adjusting perpetual orders once you approve the exact terms, such as `suggest_trade`, `execute_order`, `set_trailing_stop`, and `close_position`. Cancelling a resting order with `cancel_order` runs when you ask.
- **Tokenized stocks:** buying or selling EQX spot tokens such as EQAAPL at 1x after you approve the preview, with `execute_spot_order`. Live only; paper trading does not cover them.
- **Prediction markets:** searching HIP-4 markets, checking your positions and orders, and placing, closing, or cancelling a prediction order after you approve it, such as `search_prediction_markets`, `execute_prediction_order`, and `cancel_prediction_order`.
- **Paper:** the same preview-and-approve flow as live trading, run against Liquid's shared paper simulator, plus turning paper mode on or off and resetting it, such as `enable_paper_trading`, `paper_trading_status`, and `reset_paper_account`.
- **Funding:** checking account setup, funding your account, and reviewing your HYPE staking, such as `enable_trading`, `show_deposit`, and `get_staking`.
- **Automation policy:** saving, reading, or clearing a per-order automation limit, such as `enable_automated_trading`, `automated_trading_status`, and `disable_automated_trading`. These tools only manage that saved record: they don't place orders, and a saved policy never authorizes a chat trade.
- **Sharing:** your referral link and your payment link, such as `refer` and `payment_link`.

## Bundled skills

Copies of the repository's root skills, bundled because this connection serves the tools they use:

| Skill | What it does |
| --- | --- |
| `coinvest-allocate` | A multi-position plan from `plan_portfolio`, proposed as one batch and placed only on your explicit yes. |
| `coinvest-automation` | The automated-trading policy: your per-order cap and expiry, and what it does and does not authorize. |
| `coinvest-earnings` | Earnings calendar and company fundamentals. Read-only. |
| `coinvest-funding` | Trading setup, deposit addresses, card on-ramp, payment and referral links. |
| `coinvest-market-scan` | What is moving, signals, ideas, the leaderboard and your watchlist. Places no trades. |
| `coinvest-paper-trading` | Paper mode status, switching and reset. |
| `coinvest-portfolio-review` | Balances, positions, open orders, history and allocation. Read-only. |
| `coinvest-prediction-markets` | Prediction markets: search, odds and order books, positions, buys, closes and cancels. |
| `coinvest-research` | One asset or a comparison: price, funding, positioning, technicals, order book, news. Read-only. |
| `coinvest-tokenized-stocks` | Buy and sell tokenized stock spot tokens such as EQAAPL: 1x, no shorting, live only. |
| `coinvest-trade` | Perpetual orders, take-profit and stop-loss, closes, cancels and leverage, following this connection's approval step. |
| `coinvest-trailing-stops` | Set, view and remove trailing stops, with the trigger price stated before you approve. |
| `coinvest-yield` | Earn vault balance, deposit and withdrawal requests you sign in Liquid, and HYPE staking reads. |

If you copy this folder into Grok Build, do not also install the same skills with `npx skills add`, or they load twice. Whether Grok Bot loads a package's `skills/` folder is not confirmed.

## Try asking

Example requests that use tools this connection serves today. Trading requests return a preview first and run only after you approve it. Tokenized stocks trade live only. Paper mode applies to your wallet across Liquid connectors; ask to switch back to live trading to leave it.

- Compare NVDA, TSLA and BTC: price, funding, positioning and the latest news. No trade.
- Which companies report earnings this week, and what are NVDA's market cap and P/E?
- Show my Liquid portfolio, open orders and my last 10 trades.
- Show me the terms for an ETH long with $50 notional at 2x and a 5% stop loss, and place it once I approve.
- Buy $25 of tokenized Apple stock (EQAAPL) with no leverage. Show me the preview first.
- Set a trailing stop on my SOL position that gives back 20% of margin, and show its trigger price.
- Which prediction markets are open on Bitcoin and on upcoming Premier League matches? Show the odds.
- How much USDC do I have in Earn, and what is my staked HYPE earning?
- Switch to paper trading and plan a moderate-risk portfolio across crypto, stocks and gold.

## Network and data

This plugin contains two manifests (`.cursor-plugin/plugin.json` and `.grok-plugin/plugin.json`), two copies of the MCP configuration (`mcp.json` and `.mcp.json`), a logo, a changelog, a license, and this documentation. It has no local code, hooks, or scripts.

Tool requests go to `https://coinvest.liquid.trade/mcp?profile=all`, which Liquid operates. Sign-in opens Liquid's account sign-in page in your browser. Liquid's privacy policy, linked below, describes how Liquid handles your data.

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
