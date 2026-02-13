# Boot Checklist

On startup, run through these steps:

## 1. Notion Board Setup

Check if `notion-board.json` exists in your workspace.

**If it exists:** Load the `database_id`. Verify the board is accessible by querying it. If the query fails, warn the user.

**If it doesn't exist:** Create the board.

1. Read the Notion API key from `~/.config/notion/api_key`
2. Search Notion for a database named "Agent Board" (or the company name + "Board")
3. If found, save its `database_id` to `notion-board.json`
4. If not found, create it under the workspace's Notion page:

```bash
curl -X POST 'https://api.notion.com/v1/databases' \
  -H 'Authorization: Bearer NOTION_API_KEY' \
  -H 'Notion-Version: 2025-09-03' \
  -H 'Content-Type: application/json' \
  -d '{
    "parent": { "type": "page_id", "page_id": "PARENT_PAGE_ID" },
    "title": [{ "type": "text", "text": { "content": "Agent Board" } }],
    "properties": {
      "Name": { "title": {} },
      "Status": { "select": { "options": [
        { "name": "Inbox", "color": "gray" },
        { "name": "In Progress", "color": "yellow" },
        { "name": "Review", "color": "purple" },
        { "name": "Done", "color": "green" },
        { "name": "Blocked", "color": "red" }
      ]}},
      "Priority": { "select": { "options": [
        { "name": "Critical", "color": "red" },
        { "name": "High", "color": "orange" },
        { "name": "Medium", "color": "yellow" },
        { "name": "Low", "color": "gray" }
      ]}},
      "Type": { "select": { "options": [
        { "name": "Feature", "color": "blue" },
        { "name": "Content", "color": "green" },
        { "name": "Research", "color": "purple" },
        { "name": "Bug", "color": "red" },
        { "name": "Chore", "color": "gray" }
      ]}},
      "Owner": { "select": { "options": [
        { "name": "Executive", "color": "blue" },
        { "name": "Researcher", "color": "purple" },
        { "name": "Developer", "color": "orange" },
        { "name": "Copywriter", "color": "green" },
        { "name": "PM", "color": "yellow" },
        { "name": "QA", "color": "pink" },
        { "name": "Human", "color": "gray" }
      ]}},
      "Labels": { "multi_select": { "options": [] } },
      "Due": { "date": {} },
      "Agent Log": { "rich_text": {} }
    }
  }'
```

5. Save the returned `id` as `database_id` in `notion-board.json`:
```json
{
  "database_id": "...",
  "name": "Agent Board",
  "created_at": "2026-02-13T..."
}
```

6. Notify the user that the board was created and share the Notion URL.

**Important:** If you don't have a `PARENT_PAGE_ID`, ask the user for the Notion page where the board should live. Don't guess.

## 2. Board Health Check

Query the board for any Blocked tickets or tickets without an Owner. Report them.

## 3. Inbox Check

Query for tickets in Inbox status. Triage any that haven't been assigned.
