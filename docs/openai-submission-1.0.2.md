# OpenAI Co-Invest 1.0.2 submission notes

The OpenAI package is a local draft. It has not been uploaded or published.
It targets the existing Restricted MCP endpoint and is intended to update the
existing Co-Invest listing.

## Package details

- Listing name: **Co-Invest**
- Version: **1.0.2**
- Publisher: Liquid
- MCP endpoint: `https://coinvest-chat.liquid.trade/mcp`
- Support: [support@liquid.trade](mailto:support@liquid.trade) and
  [liquid.trade/support](https://www.liquid.trade/support)

The plugin supports market research, connected portfolio reads, and review
links for new trade suggestions. The endpoint also exposes existing simulated
account and position management tools. New trade suggestions are presented as
links; the plugin does not place live trades. Sign-in uses normal Liquid OAuth
read and trade permissions, while the Restricted endpoint limits the tools
available through this connection. Users must sign in to connect.

## Build

Use Node.js 20 or newer and Python 3. Install the repository dependencies and
write the ZIP to an absolute path outside the package directory that does not
already exist:

```sh
npm ci
npm run package:openai -- --out /absolute/path/Co-Invest-1.0.2.zip
```

The command validates the package and reports the archive SHA-256 and file
count. It only creates a local ZIP; it does not create or update a listing.

## Existing listing update

Before uploading, download the current release ZIP from the OpenAI dashboard and
compare it with the draft. Preserve the listing's stable manifest name, all
retained components, the existing OAuth registration, and the exact MCP URL.
The draft machine name `co-invest` is provisional until this comparison. Reconcile
the name and retained components with the downloaded release. The existing URL
must already be `https://coinvest-chat.liquid.trade/mcp`; OpenAI's update flow
does not allow changing an existing MCP URL. A URL mismatch requires OpenAI support.

After confirming the comparison, upload the matching ZIP to the existing
listing. Provide any reviewer access credentials only through OpenAI's secure
review form. Keep credentials out of the package, source repository, and public
documentation. The package omits test-case and demo overrides to preserve saved
review materials. Confirm those materials still describe Restricted behavior,
run the required cases, verify that the walkthrough is accessible, and test the
reviewer login. Inspect the dashboard's package scan results and resolve any
reported issues before submitting the listing update. Local validation does not
prove successful installation or execution inside OpenAI.

## OpenAI references

- [Build a plugin](https://developers.openai.com/plugins/build/plugins)
- [Submit a plugin](https://developers.openai.com/plugins/deploy/submission)
- [Submission validation errors](https://developers.openai.com/plugins/deploy/submission-errors)
