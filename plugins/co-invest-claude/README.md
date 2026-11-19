# Co-Invest for Claude

Research and trade crypto, equities, tokenized stocks, commodities, indices and prediction markets on Liquid from Claude. Every order is previewed and placed only after you approve it in chat.

## Install in Claude Code

```text
/plugin marketplace add LiquidMax-dev/liquid-plugin
/plugin install co-invest@liquid
```

Then run `/mcp`, choose `co-invest` and sign in to Liquid. The plugin connects to `https://coinvest.liquid.trade/mcp`.

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

## Try asking

Tokenized stocks trade live only. Paper mode applies to your wallet across Liquid connectors; ask to switch back to live trading to leave it.

- Compare NVDA, TSLA and BTC: price, funding, positioning and the latest news. No trade.
- Show a 4h BTC chart, then its RSI and MACD and the order book.
- Which companies report earnings this week, and what are NVDA's market cap and P/E?
- Show my Liquid portfolio and open orders, then chart my allocation.
- Suggest an ETH long with $50 notional at 2x and a stop loss 5% below entry, as a card I can confirm.
- Buy $25 of tokenized Apple stock (EQAAPL) with no leverage. Show me the preview first.
- Set a trailing stop on my SOL position that gives back 20% of margin, and show its trigger price.
- Which prediction markets are open on Bitcoin and on upcoming Premier League matches? Show the odds.
- Switch to paper trading and plan a moderate-risk portfolio across crypto, stocks and gold.

## Claude apps (claude.ai, desktop, mobile)

Plugins are a Claude Code feature. In the Claude apps, open Settings, then Connectors, and add the custom connector `https://coinvest.liquid.trade`. To add the skills there, build the ZIPs with `npm run package:claude-skills -- --out <dir>` and upload each one in Settings.

## Do not install the skills twice

This plugin already bundles the skills. Do not also install the same skills with `npx skills add`, or Claude will see duplicates.
