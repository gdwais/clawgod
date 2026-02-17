# HEARTBEAT.md — Data Analyst Agent

## On Heartbeat

When you receive a heartbeat poll:

1. **Check task queue** — any assigned tasks in `shared/tasks/growth/`?
2. **Review KPI dashboard** — any metrics moving significantly (up or down)?
3. **Check for completed campaigns** — any needing post-mortem analysis?
4. **Flag anomalies** — any unusual data patterns worth investigating?
5. **Update reports** — any scheduled reports due?

If there's genuinely nothing to do, reply `HEARTBEAT_OK`.
