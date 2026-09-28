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
- **Trading:** preparing and previewing a trade, then placing, closing, or adjusting perpetual orders once you approve the exact terms, such as `suggest_trade`, `execute_order`, and `close_position`. Cancelling a resting order with `cancel_order` runs when you ask.
- **Prediction markets:** searching HIP-4 markets, checking your positions and orders, and placing, closing, or cancelling a prediction order after you approve it, such as `search_prediction_markets`, `execute_prediction_order`, and `cancel_prediction_order`.
- **Paper:** the same preview-and-approve flow as live trading, run against Liquid's shared paper simulator, plus turning paper mode on or off and resetting it, such as `enable_paper_trading`, `paper_trading_status`, and `reset_paper_account`.
- **Funding:** checking account setup, funding your account, and reviewing your HYPE staking, such as `enable_trading`, `show_deposit`, and `get_staking`.
- **Automation policy:** saving, reading, or clearing a per-order automation limit, such as `enable_automated_trading`, `automated_trading_status`, and `disable_automated_trading`. These tools only manage that saved record: they don't place orders, and a saved policy never authorizes a chat trade.
- **Sharing:** your referral link and your payment link, such as `refer` and `payment_link`.

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
