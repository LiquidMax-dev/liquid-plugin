# CoInvest skill: Computer default

Status: implemented.
Spec ID: SPEC-coinvest-computer-default-20260917.

## TLDR

Maintain the skill directly in this public repository. Default to
`https://coinvest-computer.liquid.trade/mcp` for research, account reads and
user-authorized direct trading on every host.

## Problem

The published instructions describe Computer as preferred for headless or fresh
setups, leaving ambiguity when a host supports widgets or already has Main.
The skill must have one explicit default and be maintained alongside its public
installation instructions in this repository.

## Solution

Name Computer as the default in the description, entrypoint and references.
If Computer is missing, guide its connection and Liquid OAuth setup. Use Main or
Restricted only when the user explicitly selects that workflow. Installing the
skill does not configure MCP, authenticate the account or authorize trades.

## Architecture

The maintained files are `skills/coinvest/SKILL.md` and its three references.
Root README installation and maintenance text describes that ownership. Existing
plugin manifests and MCP configurations keep their current behavior. No copied
skill source or generator changes in another repository are part of this change.

## Phases

1. Clarify the default and public ownership.
2. Validate formatting, references, install behavior and endpoint selection.
3. Publish a review branch; a human merges it.

## Data models

The standard skill frontmatter retains name `coinvest`, a plain description and
MIT license. No new runtime state or analytics are introduced.

## API contracts

Computer tool definitions and account policy remain authoritative. Its direct
executors handle explicitly requested live or paper trades in the verified mode.
Defaulting to Computer neither enables autonomous trading nor changes paper/live
mode. Preserve explicit endpoint/account selections, backend denials, actual
confirmation flows and uncertain-write retry protection. Main widgets and
Restricted review links retain their distinct behavior when explicitly selected.

## Risks

Existing plugin publishing automation can replace files in this repository. Its
ownership must be reconciled separately so future plugin synchronization preserves
the authored skill. This documentation change does not alter that automation or
claim that overwrite protection has been implemented.

## Verification

- Run the skill format validator and resolve all local references/README anchors.
- Install the actual skill with the official skills CLI in an isolated project
  for Claude Code and Cursor; compare all four installed files byte-for-byte.
- Check synthetic endpoint selection: a widget-capable host with both endpoints
  uses Computer only; missing Computer without an explicit alternative makes zero
  Main/Restricted calls and provides connection/OAuth guidance; explicit Main uses
  Main. A paper/live mismatch makes zero writes and requests clarification.
- A complete, explicit one-off trade with an available direct executor produces
  exactly one captured direct write without enabling or changing autonomous
  policy. A known policy denial before execution produces zero executor calls;
  denial from the executor produces one attempt with no fallback or retry.
  No financial calls are needed for these synthetic checks.
- Verify all existing plugin configuration, asset and license bytes are preserved.
- Inspect real GitHub rendering and retain screenshots/video after publishing the
  branch; repeat CLI installation against the public commit.

Local verification passed on 2026-09-17: skill format validation, eight local
references, official CLI installation for Claude Code and Cursor with exact
four-file parity, preservation of all 14 unrelated public files, and synthetic
review of all seven routing/denial scenarios plus uncertain-write reconciliation.
The synthetic review made no financial calls. Public commit installation and
recorded GitHub rendering are release checks reported on the review branch.
