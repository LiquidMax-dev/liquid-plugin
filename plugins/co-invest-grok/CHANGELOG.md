# Changelog

## 2.0.0

- Moved the MCP server from Restricted (`https://coinvest-chat.liquid.trade/mcp`,
  links only) to liquid-mcp Main with the `all` profile
  (`https://coinvest.liquid.trade/mcp?profile=all`).
- Trades are placed after you approve their exact terms in chat. Results are
  text only, with no widgets or cards.
- Existing installs must sign in to Liquid again because the server changed.
- If you added the 1.0.0 connector (`coinvest-chat`), remove it before adding
  this one.
- The version moves because a future Grok Build catalog re-pin only happens
  when `plugin.json`'s version changes.

## 1.0.0

- Initial release: links-only trading through Liquid review links.
