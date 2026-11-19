# Changelog

## 1.1.0

- Bundled skills replaced: the three package-specific skills are removed and the shared Co-Invest skill set is bundled instead (allocate, funding, market scan, paper trading, portfolio review, prediction markets, research, trade). Listing copy, endpoint and tools are unchanged. Needs a new upload to OpenAI.

## 1.0.3

- Long description rewritten and three starter prompts set in the manifest; example prompts added to the README. Not yet uploaded to OpenAI; 1.0.0 remains published. Endpoint and tools are unchanged.

## 1.0.2

- Preserve the published Co-Invest listing metadata and prompt while updating the package version.
- Preserve the exact existing MCP endpoint and portal-managed authentication; tools and descriptions are provided through MCP scans.
- Add three research skills that use only currently exposed tools and do not perform fund movements.
- Package only the manifest, MCP map, two original logos, and three skill files in the upload ZIP.
