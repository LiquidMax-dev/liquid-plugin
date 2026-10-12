# Co-Invest for Muse

Version **1.0.2**. Connector display name: **Co-Invest**.

Co-Invest for Muse connects to Liquid's paper-only MCP profile for public market research and simulated trading. Orders placed through this connector's address are simulated: that endpoint never places a live order, adds funds, or switches to another Liquid connection. The production endpoint was enabled and directly verified on 2026-10-12. The hosted Muse submission is prepared for owner review; tool execution inside Muse remains unverified.

The package contains a portable Agent Plugins manifest, one MCP server configuration, Liquid's existing logo, the submission draft, and the generated [tool reference](tools.md). It adds no local code or telemetry. Liquid's MCP service still handles connection and request telemetry as described in the [submission data notes](submission.md#data-processing-and-retention).

## Install and connect

After the connector is accepted and published by Muse:

1. After Muse accepts and publishes it, add the hosted connector from its Muse listing. Self-service installation details are not documented here because the portal guidance is login-gated.
2. Sign in through Liquid's OAuth page when Muse opens it. This is the same Liquid account authorization that Liquid's other connectors use. The permission it grants is not limited to practice trading: asking for `read` returned `read trade`. The practice-only limit is enforced by Liquid's server for this connector's address, not by the permission itself. Within this connector, `read` covers research, account reads, and proposals, and `trade` is needed for simulated account changes and shared watchlist edits. Do not paste tokens into chat or configuration.
3. Start with `paper_trading_status` and verify the response explicitly reports simulated paper mode before requesting a simulated state change.

The repository's Agent Plugins files are portable examples for clients that support that format. They do not install the connector in Muse or prove Muse acceptance. The complete server catalog and representative request outcomes are in [tools.md](tools.md).

## What it supports

The package documents all 45 tools present in the pinned paper-only contract. Trading balances, positions, orders, transaction history, and portfolio allocation are simulated. Leaderboards show real public Liquid rankings and do not represent this paper account's performance. Watchlist edits change shared account preferences; referral links and statistics are actual shared account data. Automation status reads saved shared policy metadata and does not enable automation or authorize orders. Simulated order and position changes still require the exact previewed terms and the user's explicit approval. An unknown or pending result must be reconciled against account or order state before any retry.

`reset_paper_account` clears the wallet's shared simulated account and cancels its open paper orders. Use it only after the user explicitly asks for a reset. The simulator is shared by wallet across Liquid MCP connectors; changing its state can be visible in other connectors. This endpoint does not change the Liquid web app's selected trading mode.

The owner confirmed the simulated-trading scope for this submission. The Muse form has been filled for review and its terms accessed after sign-in. The agent has not submitted it or accepted terms on the owner's behalf. See the [complete form draft](../../docs/muse-submission-form-1.0.2.md).

## Files

- [submission.md](submission.md) contains the connector overview, review caveats, workflow, and questions requiring Liquid owner confirmation.
- [tools.md](tools.md) is generated from the pinned contract and tool-matrix examples.
- `paper-only.contract.json`, `paper-only.examples.json`, and `paper-only.source.json` preserve the reviewed contract, representative cases, and source hashes.

To refresh the checked-in snapshot from a liquid-mcp checkout, run:

```sh
node scripts/sync-muse-paper-only.mjs --mcp-root /path/to/liquid-mcp --source-revision <git-sha>
```

The command copies only `generated/paper-only.json` and `e2e/tool-matrix/paper-only/*.json` from that checkout, records hashes and revision, then regenerates `tools.md`. The validator checks the snapshot, examples, manifest, endpoint, and generated reference.

## Links

- [Liquid Co-Invest](https://liquid.trade/coinvest)
- [Liquid app](https://app.liquid.trade)
- [Privacy policy](https://liquid.trade/privacy)
- [Terms of service](https://liquid.trade/termsofservice)
- [Source repository](https://github.com/LiquidMax-dev/liquid-plugin)

## License

MIT. See [LICENSE](LICENSE). The Liquid name and logo are trademarks of Liquid and are not licensed under the MIT License.
