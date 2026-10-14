# Co-Invest

This directory contains the repository documentation and the files used to prepare the Co-Invest OpenAI plugin upload. The upload ZIP contains exactly these seven files:

- `.codex-plugin/plugin.json`
- `.mcp.json`
- `assets/logo.png`
- `assets/logo-dark.png`
- `skills/coinvest-market-research/SKILL.md`
- `skills/coinvest-portfolio-planning/SKILL.md`
- `skills/coinvest-earn-vaults/SKILL.md`

The plugin manifest preserves the published listing and prompt and points to the existing Co-Invest MCP service at `https://coinvest-chat.liquid.trade`. Authentication remains managed by the existing OpenAI portal connection. Skills guide research using tools exposed by the current connection; they do not add server capabilities. Available tools and descriptions come from MCP scans, not from this ZIP. See [tool reference on main](https://github.com/LiquidMax-dev/liquid-plugin/blob/main/docs/openai/tools.md) for the current public tool reference.

## Links

- [Liquid Co-Invest](https://www.liquid.trade/coinvest)
- [Liquid app](https://app.liquid.trade)
- [Support](https://www.liquid.trade/support)
- [Privacy policy](https://liquid.trade/privacy)
- [Terms of service](https://liquid.trade/termsofservice)
- [Source repository](https://github.com/LiquidMax-dev/liquid-plugin)

## License

MIT. See [LICENSE](LICENSE). The Liquid name and logo are trademarks of Liquid and are not licensed under the MIT License.
