# HEARTBEAT.md — Ops Manager Agent

## On Heartbeat

When you receive a heartbeat poll:

1. **Check task queue** — any assigned tasks in `shared/tasks/operations/` or `shared/tasks/engineering/`?
2. **Check sprint progress** — Are tasks on track? Any overdue items?
3. **Flag blockers** — Scan for anything that's been stuck. Escalate if needed.
4. **Board hygiene** — Scan for stale tasks, unassigned work, missing priorities
5. **Review upcoming deadlines** — Anything due in the next 48 hours that needs attention?
6. **Memory maintenance** — Update MEMORY.md with project status changes

If there's genuinely nothing to do, reply `HEARTBEAT_OK`.

## Heartbeat Priorities

1. Blocked or overdue tasks
2. Stale tasks needing attention
3. Upcoming deadlines (next 48h)
4. Sprint/milestone status updates
5. Board cleanup and documentation maintenance
