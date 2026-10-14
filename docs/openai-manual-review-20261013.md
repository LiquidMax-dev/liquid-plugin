# Co-Invest MCP manual-review appeal — 2026-10-13

Status: submitted at the owner's request. The portal confirmed Appeal submitted and the entire saved note was read back. This covers the current 44-tool scan, not the planned Earn addition.

Please manually review all 11 findings for Co-Invest's existing MCP at https://coinvest-chat.liquid.trade/. The latest scan gives each tool the same further-review hold without a specific failed field. The explanations below describe the currently served restricted connection, not capabilities of other deployments. Authenticated account data requires the user's connected Liquid account.

1. suggest_trade: reads market/account context and returns one trade proposal with a prefilled Liquid review link. It does not place an order. Paper proposals are labelled and link to paper mode; opening a link is not execution.

2. suggest_trades_batch: validates a basket of 2-8 proposals and combined margin, then returns a Liquid basket review link (or individual paper review links). It does not execute any leg.

3. plan_portfolio: reads account balance and market research after collecting risk tolerance, horizon and asset-class preferences. It returns research and allocation guidance for a subsequent proposal; it neither moves funds nor places trades.

4. search_prediction_markets: reads event-market listings, outcomes and probabilities. It does not place a bet/order. Its shared description references execute_prediction_order, but that tool is absent from this connection; that wording does not confer execution capability.

5. show_prediction_orderbook: reads bid/ask prices and quantities for a selected prediction-market outcome. It creates or modifies no order.

6. view_prediction_positions: reads the authenticated user's prediction-market holdings and exposure. It does not open, close or change a position.

7. view_prediction_orders: reads the user's prediction-market order history/open orders. It does not cancel orders. Its shared description references cancel_prediction_order, which is not exposed on this connection.

8. enable_trading: retains its existing identifier/title for compatibility. Here its handler only checks account readiness and renders Liquid account-setup guidance. It cannot enable trading execution on this MCP, submit an order or grant trading permission. Account setup is completed separately in Liquid. This read-only behavior is stated in the held description and annotations; please assess it in this restricted context.

9. edit_watchlist: intentionally groups three operations on one resource: the authenticated user's named watchlist. The required action enum is add/remove/set, with explicit symbols and an optional list name. Add/remove merge with existing entries; set replaces them, and an empty set clears the list. Empty add/remove inputs are rejected. It is correctly marked readOnlyHint=false and destructiveHint=true because replacement/removal changes stored preferences. It does not trade or move funds. Please retain this existing tool and assess the explicit operation schema rather than requiring a renamed or split interface.

10. leaderboard_data: reads Liquid trader rankings by PnL, volume, points or streak, with window/asset filters and a limit of 1-50. It provides rankings and historical performance data, not copy-trading or execution.

11. leaderboard_rank: reads one trader's standing by wallet, display name or handle, or the signed-in user's rank when omitted. It reports unranked/unavailable results explicitly and changes no account state.

The proposal, research, prediction-read, readiness and leaderboard tools are annotated read-only. Live order execution and cancellation tools are not exposed; existing simulated account-management tools are separate. Please approve eligible definitions or identify the specific field/behavior that still requires correction. This appeal covers the current 44-tool scan; the proposed read-only Earn addition has not been deployed and is not claimed available here.

