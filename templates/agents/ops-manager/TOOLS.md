# TOOLS.md — Ops Manager Agent

## Primary Tools

- **File Operations** — Create and maintain sprint plans, status reports, task boards
- **Web Search** — Research project management best practices, tool documentation
- **Web Fetch** — Pull reference material and templates
- **sessions_send** — Coordinate with other agents on task status and deliverables

## Operations Toolkit

### Document Templates
- Sprint plans use checkbox lists for trackable tasks
- Status updates follow a consistent format (see AGENTS.md)
- Board review checklists for hygiene checks

### Notion Integration
If Notion is configured, use it for:
- Sprint boards with task cards
- Department board management
- Status tracking and reporting
- Decision logs

**Notion API Notes:**
- Check if Notion skill is enabled before attempting API calls
- Database IDs and page IDs are environment-specific — note them below as you discover them

### Task Management
- Read/write task files in `shared/tasks/{department}/`
- Write events to `shared/events/`
- Read department config from `shared/config/departments.json`

## Notes

Add project-specific tools, board URLs, and integration details below.
