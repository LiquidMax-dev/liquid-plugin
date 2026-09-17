# Connect Co-Invest

The skill is portable instructions. It does not register an MCP server or carry
credentials. Add a server through the host's native MCP settings, then complete
Liquid's OAuth flow in that host. Never paste a private key, access token, or
refresh token into chat or a configuration snippet.

## Recommended fresh setup

For a fresh setup, connect Computer first. It is the recommended endpoint for
headless hosts because its discovered reads and direct executors do not depend
on rendered widgets. Use the endpoint that matches the requested workflow:

| Endpoint | Use | Authority boundary |
| --- | --- | --- |
| `https://coinvest-computer.liquid.trade/mcp` | Computer's text/direct tools for terminal-friendly execution | Direct execution is available only for tools and policies returned by this server. |
| `https://coinvest.liquid.trade/mcp` | Main interactive research, account context, proposals, and widget-mediated actions | The server's discovered schemas and widget confirmation flow govern behavior. |
| `https://coinvest-chat.liquid.trade/mcp` | Restricted review-link behavior | Do not substitute it with a direct executor or silently upgrade its permissions. |

Reuse an already-connected suitable server. Prefer Computer when both it and
Main are available, unless the user explicitly selected Main or Restricted.
Respect that selection and ask before adding or switching a connection when the
change could alter whether an action is interactive, direct, paper, or live. A
connection name, shared tool name, or OAuth success does not establish
capability parity between servers.

After connecting, discover the server's current tools and inspect the candidate
tool's live schema, annotations, and approval behavior. If discovery does not
expose a requested capability, report that boundary instead of deriving an HTTP
route or inventing a tool. If a headless host has only Main, explain that a
widget-only write cannot be completed there and recommend connecting Computer;
do not claim that the widget executed.
