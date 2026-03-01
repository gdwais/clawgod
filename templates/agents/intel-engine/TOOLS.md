# TOOLS.md — Intel Engine

## Built-in Tools (no setup needed)

- `web_search` — Brave Search API. Use for competitor monitoring, news scanning, lead research.
- `web_fetch` — Extract readable content from URLs. Use for deep-diving articles, company pages, job postings.

## APIs to Configure

### Apollo.io (Lead Enrichment)
- Base URL: https://api.apollo.io/v1
- Auth: API key in header (`x-api-key`)
- API Key: REPLACE_ME
- Key endpoints:
  - POST /people/match — Enrich a person (email, phone, company data)
  - POST /organizations/enrich — Enrich a company
  - POST /mixed_people/search — Search people by criteria (title, company size, industry)
- Free tier: 100 credits/month

### Crunchbase (Company Intel)
- Base URL: https://api.crunchbase.com/api/v4
- Auth: `user_key` query parameter
- API Key: REPLACE_ME
- Use for: funding rounds, company profiles, investor data

### BuiltWith (Tech Stack Intel)
- Base URL: https://api.builtwith.com/v21
- Auth: `KEY` query parameter
- API Key: REPLACE_ME
- Use for: identifying what tech prospects use (find legacy systems to replace)

### Free Sources (no API key needed)
- SEC EDGAR: https://efts.sec.gov/LATEST/search-index?q= — financial filings
- LinkedIn (manual): search + note findings in databases
- Job postings: signal for company priorities and tech stack
- Press releases: company newsrooms, PRNewswire, BusinessWire

## Research Patterns

### Competitor Scan
```
web_search("[competitor name] + launch OR funding OR pricing OR hire") for each competitor
→ Filter for last 7 days
→ Summarize findings
→ Save to shared/intel/reports/
```

### Lead Research
```
Apollo search by ICP criteria
→ Enrich top matches
→ Score for fit (1-10)
→ Save to shared/pipeline/leads.json
```

### Industry News
```
web_search("[industry] + regulation OR trend OR report")
→ web_fetch top 3-5 results for detail
→ Extract actionable signals
→ Save to shared/intel/daily-scan.md
```
