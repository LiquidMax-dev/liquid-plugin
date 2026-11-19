# Co-Invest

Co-Invest connects Cursor to Co-Invest Computer, Liquid's trading MCP server. Research markets, review your Liquid portfolio, and trade directly from chat: Computer returns text and link results, and its trading tools execute when called, with no confirmation cards or other widgets. The plugin bundles the `coinvest` skill, which guides the agent on when and how to use those tools.

## What's included

- The Co-Invest MCP server, connected to Co-Invest Computer.
- The `coinvest` skill, bundled at `skills/coinvest/` in this plugin (a copy of the repository's root skill), which the agent reads for connection defaults, tool discovery, and trading rules.

## Install

Co-Invest isn't in Cursor's marketplace yet.

### Local install

Copy the `plugins/co-invest` folder to `~/.cursor/plugins/local/co-invest` and restart Cursor. Then connect the Co-Invest server in Cursor's MCP settings to sign in.

### Manual install

Alternatively, add the configuration below to `~/.cursor/mcp.json` directly. This route skips the bundled skill.

If you install the plugin, don't also run `npx skills add LiquidMax-dev/liquid-plugin --skill coinvest -a cursor`: Cursor would then load two skills named `coinvest`.

Version 1.0.3 rewrites the listing description and adds example prompts; 1.0.2 aligned the package version with the owner-selected release label. Co-Invest uses the Computer endpoint; earlier local installs connected to the Main endpoint and need to sign in again. See the [changelog](CHANGELOG.md).

## MCP configuration

```json
{
  "mcpServers": {
    "Co-Invest": {
      "url": "https://coinvest-computer.liquid.trade/mcp"
    }
  }
}
```

## Sign-in

Sign-in uses OAuth with your Liquid account. Cursor opens Liquid's sign-in page the first time it connects to Co-Invest, so there's no API key or client ID to configure. Computer's OAuth metadata advertises the `read` and `trade` scopes.

Removing the plugin or connector stops your client from using Co-Invest.

## How trading works

Co-Invest Computer's trading tools execute when the agent calls them; there's no separate confirmation card to approve first. The bundled skill sets the rules the agent follows instead: it acts only on an explicit request naming the asset, side, and size; it confirms your live or paper mode and account before making a change; it treats an accepted or resting order as different from a filled order; and it checks your orders or history before retrying anything uncertain.

For autonomous trading, the agent reads Computer's current automated-trading status and stays within the bounds you've set. Installing this plugin does not by itself grant any trading authority.

You can also practice with paper trading, which uses virtual funds instead of your live account.

## What agents can do

Computer groups its tools by what they do. The names below are examples: the connected server's live tool list is authoritative, and this plugin doesn't pin a fixed number of tools. See [the skill's tool reference](skills/coinvest/references/tools.md) for the current catalog and how each group behaves.

- **Research:** market analysis, technical indicators, order books, charts, news, earnings dates, and company fundamentals, such as `analyze_market`, `get_technical_indicators`, `show_orderbook`, `get_news`, `upcoming_earnings`, and `get_asset_profile`.
- **Account:** balances, positions, open orders, and history, such as `get_portfolio`, `view_open_orders`, and `get_position_history`.
- **Trading:** direct order placement and management, such as `execute_order`, `execute_tpsl`, `set_trailing_stop`, `close_position`, `cancel_order`, and `update_leverage`.
- **Prediction markets:** searching markets, reading order books, and placing or closing prediction orders, such as `search_prediction_markets`, `show_prediction_orderbook`, and `execute_prediction_order`.
- **Earn and staking:** reading your Earn vault balance and HYPE staking, such as `get_earn_balance` and `get_staking`.
- **Paper trading:** simulated trading with virtual funds, such as `paper_trading_status`, `enable_paper_trading`, and `reset_paper_account`.
- **Automation:** bounded autonomous trading, such as `automated_trading_status`, `enable_automated_trading`, and `disable_automated_trading`.

## Try asking

Example requests that use tools Co-Invest Computer serves today. A trading request runs when you make it, so name the asset, side and size you want. Paper mode applies to your wallet across Liquid connectors; ask to switch back to live trading to leave it.

- Compare NVDA, TSLA and BTC: price, funding, positioning and the latest news. No trade.
- Which companies report earnings this week, and what are NVDA's market cap and P/E?
- Show my Liquid portfolio, open orders and my last 10 trades.
- Long ETH with $50 notional at 2x and a stop loss 5% below the entry price.
- Set a trailing stop on my SOL position that gives back 20% of margin, and show its trigger price.
- Which prediction markets are open on Bitcoin and on upcoming Premier League matches? Show the odds.
- How much USDC do I have in Earn, and what is my staked HYPE earning?
- Switch to paper trading and plan a moderate-risk portfolio across crypto, stocks and gold.

## Network and data

This plugin contains configuration (two manifests and `mcp.json`), the `coinvest` skill as markdown, a logo, and this documentation. It has no local code, hooks, or scripts.

Tool requests go to `https://coinvest-computer.liquid.trade/mcp`, which Liquid operates. Sign-in opens Liquid's account sign-in page in your browser. Liquid's privacy policy, linked below, describes how Liquid handles your data.

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
