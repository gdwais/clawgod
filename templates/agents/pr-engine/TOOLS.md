# TOOLS.md — PR Engine

## Built-in Tools (no setup needed)

- `web_search` — Find conferences, podcasts, journalists, awards, speaking opportunities
- `web_fetch` — Deep-dive event pages, podcast show notes, journalist profiles

## Services to Monitor (manual or email alerts)

### HARO / Connectively
- URL: https://www.connectively.us
- Setup: Create account, set up email alerts for relevant beats
- Daily scan: Check for fintech, wealth management, financial planning queries
- Response time: Within 2-3 hours of query posting (journalists are on deadline)

### Qwoted
- URL: https://www.qwoted.com
- Free platform — journalists post queries, you respond
- Setup: Create account, set profile for financial services expertise

## APIs to Configure

### Listen Notes (Podcast Research)
- Base URL: https://listen-api.listennotes.com/api/v2
- Auth: X-ListenAPI-Key header
- API Key: REPLACE_ME
- Key endpoints:
  - GET /search — Search podcasts by keyword
  - GET /podcasts/{id} — Podcast details + episodes
- Free tier: 5 requests/minute

### Eventbrite (Conference Discovery)
- Base URL: https://www.eventbriteapi.com/v3
- Auth: Bearer token
- Token: REPLACE_ME

## Research Patterns

### Podcast Discovery
```
web_search("[industry] podcast + guest applications")
web_search("[industry] podcast + accepting guests")
Listen Notes search for [industry keywords]
→ Filter: audience size > 1K, relevant topic, accepts guests
→ Find host contact (LinkedIn, Twitter, show email)
→ Save to shared/pr/databases/podcasts.json
```

### Conference Discovery
```
web_search("[industry] conferences 2026")
web_search("fintech conferences speaking opportunities")
→ Filter: audience match, speaker quality, timing, cost
→ Find CFP deadlines and contacts
→ Save to shared/pr/databases/conferences.json
```

### Journalist Discovery
```
web_search("[topic] site:techcrunch.com OR site:bloomberg.com OR site:wealthmanagement.com")
→ Identify byline authors covering our space
→ Check recent articles for story angle alignment
→ Save to shared/pr/databases/journalists.json
```
