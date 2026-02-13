# Agent Workflow — Notion Board

Board `database_id` is in `notion-board.json`.

## Statuses

```
Inbox → In Progress → Review → Done
          ↑              |
          └── Rejected ──┘
```

**Blocked** — any agent, any time. Add a note to Agent Log explaining why.

| Status | Who | What happens |
|---|---|---|
| **Inbox** | Executive | Triage: set Priority, Type, Owner. Route forward. |
| **In Progress** | Developer / Copywriter / Researcher / PM | Do the work. Log progress. |
| **Review** | Human | Human approves → Done. Rejects → back to In Progress with notes. |
| **Done** | — | Complete. |
| **Blocked** | Anyone | Stuck. Explain in Agent Log. |

## Rules

1. **Only pick up tickets where you're the Owner.**
2. **Log changes:** `[Agent - YYYY-MM-DD HH:mm] What you did.`
3. **Don't skip Review.** Humans approve work before it's Done.
4. **Hand off cleanly.** Change Owner when moving tickets.
5. **Executive can override** any assignment.

## Properties

| Property | Purpose |
|---|---|
| Name | What the ticket is |
| Status | Where it is in the flow |
| Priority | Critical / High / Medium / Low |
| Type | Feature / Content / Research / Bug / Chore |
| Owner | Which agent owns it right now |
| Labels | Tags (flexible) |
| Due | Deadline |
| Agent Log | Running log of agent actions |

## API Patterns

API version `2025-09-03`. Databases are queried via `/v1/data_sources/`.

### Query your tickets

```bash
curl -X POST 'https://api.notion.com/v1/data_sources/DATABASE_ID/query' \
  -H 'Authorization: Bearer NOTION_API_KEY' \
  -H 'Notion-Version: 2025-09-03' \
  -H 'Content-Type: application/json' \
  -d '{"filter":{"and":[
    {"property":"Owner","select":{"equals":"YOUR_AGENT"}},
    {"property":"Status","select":{"equals":"TARGET_STATUS"}}
  ]}}'
```

### Move a ticket

```bash
curl -X PATCH 'https://api.notion.com/v1/pages/PAGE_ID' \
  -H 'Authorization: Bearer NOTION_API_KEY' \
  -H 'Notion-Version: 2025-09-03' \
  -H 'Content-Type: application/json' \
  -d '{"properties":{
    "Status":{"select":{"name":"Review"}},
    "Owner":{"select":{"name":"Human"}}
  }}'
```

### Append to Agent Log

Read current value first, then update with appended text:

```bash
curl -X PATCH 'https://api.notion.com/v1/pages/PAGE_ID' \
  -H 'Authorization: Bearer NOTION_API_KEY' \
  -H 'Notion-Version: 2025-09-03' \
  -H 'Content-Type: application/json' \
  -d '{"properties":{
    "Agent Log":{"rich_text":[{"type":"text","text":{"content":"EXISTING\n[Agent - 2026-02-13 14:30] New entry."}}]}
  }}'
```

### Create a ticket

```bash
curl -X POST 'https://api.notion.com/v1/pages' \
  -H 'Authorization: Bearer NOTION_API_KEY' \
  -H 'Notion-Version: 2025-09-03' \
  -H 'Content-Type: application/json' \
  -d '{"parent":{"database_id":"DATABASE_ID"},"properties":{
    "Name":{"title":[{"type":"text","text":{"content":"Ticket title"}}]},
    "Status":{"select":{"name":"Inbox"}},
    "Priority":{"select":{"name":"Medium"}},
    "Type":{"select":{"name":"Feature"}},
    "Owner":{"select":{"name":"Executive"}}
  }}'
```
