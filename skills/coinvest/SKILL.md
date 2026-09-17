---
name: coinvest
description: Research markets, inspect Liquid Co-Invest accounts, and execute or manage user-requested trades through a connected OAuth MCP, using live tool discovery and endpoint-specific safeguards.
license: MIT
---

# Liquid Co-Invest

Use this skill when the user wants Liquid market research, account information,
paper trading, or an explicitly requested trade. For a fresh setup, connect
Computer first: it is the preferred path for reads and direct execution in
hosts that cannot render UI. The skill supplies guidance; installing it does
not connect an MCP server, grant trading authority, or create an automation
policy.

Requires a host that supports remote HTTP MCP and Liquid OAuth.

Read the reference that matches the task before acting:

- [Connect and choose an endpoint](references/connect.md)
- [Discover public tools and capabilities](references/tools.md)
- [Research, trading, paper mode, and automation](references/trading.md)

At the start of a task, inspect the host-provided current tool list and the
schema and approval behavior of any candidate tool. If the host exposes a
discovery operation, use it; do not invent a discovery command or route. Current
host-provided definitions are sufficient when no discovery call exists. Treat
the live endpoint as the authority. Catalog names in the references are
starting points only; a shared name never proves that two endpoints have the
same schema, output, confirmation flow, or permission.

Keep the selected MCP connection as an authority boundary. Prefer Computer's
discovered reads and direct executors when it is connected and the user has not
chosen another endpoint. Main is an optional interactive, widget-oriented path;
its text reads can still help, but a headless host must not call a widget-only
executor or claim that a widget proposal executed. Restricted is for its
review-link behavior and must not be silently upgraded to direct execution.
Never switch endpoints to bypass a denial. If changing or adding a connection
would change execution behavior, explain that choice and get the user's
decision first.

For every state-changing request, follow the actual discovered approval flow.
For an order, require concrete asset, side, and size details, clarify notional
versus margin, and do not invent leverage, order type, price, or margin mode.
Distinguish an accepted or resting order from a filled order. If a write times
out or its result is unknown, inspect authoritative orders or history before
considering any retry.

Before a write, verify that the selected connection's account or wallet and
live/paper mode match the user's intended target using identity and context
actually exposed by the host or MCP. The selected connection context can be the
identity evidence; do not invent a wallet introspection call. Ask when either
identity or mode is different or unresolved. Paper mode can be shared by a
wallet's sessions on that MCP connector while remaining separate from the Liquid
web app and other endpoints;
never assume it propagates or change it silently. Autonomous trading requires a
fresh read of the current Computer policy/status and active bounds covering the
action. Do not infer a scheduler, create bounds from a vague request, or treat
skill installation as consent.
