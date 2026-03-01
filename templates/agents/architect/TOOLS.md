# TOOLS.md — Architect

## Built-in Tools

- `web_search` — Research libraries, patterns, API documentation
- `web_fetch` — Read documentation pages, RFCs, technical articles
- `exec` — Run commands for technical spikes (install deps, test approaches)

## APIs to Configure

### GitHub (if using GitHub)
- CLI: `gh` (install via `brew install gh`, then `gh auth login`)
- Use for: reading repo structure, reviewing PRs, checking CI status
- API: https://api.github.com (token in `GITHUB_TOKEN` env var)

### Linear (optional — issue tracking)
- Base URL: https://api.linear.app/graphql
- Auth: API key in header
- API Key: REPLACE_ME

### Sentry (optional — error tracking)
- Use for: checking error rates before/after deploys
- API Token: REPLACE_ME
- Project Slug: REPLACE_ME

## Architecture Decision Records

When making significant technical decisions, document them:

```markdown
# ADR-NNN: [Decision Title]

## Status: [Proposed | Accepted | Deprecated]
## Context: [Why we need to make this decision]
## Decision: [What we decided]
## Consequences: [Trade-offs, what this enables/prevents]
```

Save ADRs to `shared/architecture/adrs/`.
