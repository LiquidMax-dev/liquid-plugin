# Changelog

## 1.0.2

- Align the package version with the owner-selected release label. The Co-Invest
  Computer endpoint and tool behavior are unchanged.

## 2.0.0

- Moved the MCP server from Main (`https://coinvest.liquid.trade/mcp`) to
  Co-Invest Computer (`https://coinvest-computer.liquid.trade/mcp`): direct,
  text-only trading tools, no widget confirmation cards.
- Bundled the `coinvest` skill under `skills/coinvest` (a copy of the
  repository's `skills/coinvest`).
- Added an Agent Plugins 1.0.0 root `plugin.json` and made `mcp.json` follow
  the Agent Plugins MCP schema.
- Existing local installs must sign in to Liquid again because the server
  changed.

## 1.0.0

- Initial release: Main MCP server configuration.
