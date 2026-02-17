# HEARTBEAT.md — Executive Agent

## On Heartbeat

When you receive a heartbeat poll, run through this checklist:

### 1. Process Events
- Scan `shared/events/` for new event files (sorted by timestamp)
- For each event, look up the auto-transition in `shared/config/departments.json`
- Apply the transition: update task status, set new owner, append to history
- Delete or archive processed event files

### 2. Check Review Gates
- Scan all department task directories for tasks with `reviewGate: true`
- Check Notion boards (if configured) for human review decisions
- If a human has approved/rejected, apply the corresponding transition
- Notify the next owner via `sessions_send`

### 3. Detect Stale Tasks
- Scan all task files for tasks where `updatedAt` is older than `staleTaskHours` (default: 2 hours)
- Skip tasks in terminal states (`done`) or waiting on human (`reviewGate: true`)
- Send a reminder to the task owner via `sessions_send`
- Track reminder count — escalate after `maxReminders` (default: 3)

### 4. Sync Notion
- If Notion is configured, sync task statuses to Notion boards
- Update Notion cards with current status, owner, and latest history entry
- Pull any status changes made directly in Notion back to task files

### 5. Cross-Department Triggers
- Check processed events against `shared/config/workflow-rules.json`
- If a trigger matches, create a new task in the target department
- Link the new task back to the source via `crossDeptRef`

### 6. Daily Summary
- If significant activity has occurred today (>5 events or task state changes):
  - Generate a summary: tasks completed, tasks blocked, departments health
  - Save to `memory/` daily file
  - Optionally notify the human if there are items needing attention

### 7. Pending Delegated Tasks
- Follow up with agents if work is overdue
- Check for any tasks assigned to you that need action

### 8. Memory Maintenance
- Update MEMORY.md if daily notes have accumulated
- Clean up old event files (older than `eventRetentionDays`)

## Heartbeat Priorities

1. Process new events and apply transitions
2. Check review gates for human decisions
3. Detect and nudge stale tasks
4. Cross-department triggers
5. Notion sync
6. Daily summary and memory maintenance

If there's genuinely nothing to do, reply `HEARTBEAT_OK`.
