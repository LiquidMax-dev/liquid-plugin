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

Version 2.0.0 moved the server from Main (`https://coinvest.liquid.trade/mcp`) to Co-Invest Computer. If you have an earlier local install, you'll need to sign in again. See the [changelog](CHANGELOG.md).

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

- **Research:** market analysis, technical indicators, order books, charts, and news, such as `analyze_market`, `get_technical_indicators`, `show_orderbook`, and `get_news`.
- **Account:** balances, positions, open orders, and history, such as `get_portfolio`, `view_open_orders`, and `get_position_history`.
- **Trading:** direct order placement and management, such as `execute_order`, `execute_tpsl`, `close_position`, `cancel_order`, and `update_leverage`.
- **Paper trading:** simulated trading with virtual funds, such as `paper_trading_status`, `enable_paper_trading`, and `reset_paper_account`.
- **Automation:** bounded autonomous trading, such as `automated_trading_status`, `enable_automated_trading`, and `disable_automated_trading`.

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
