# HEARTBEAT.md — QA Engineer Agent

## On Heartbeat

When you receive a heartbeat poll:

1. **Check for untested changes** — Has the Developer shipped anything that hasn't been validated?
2. **Review open bugs** — Any bugs that have been fixed but not verified?
3. **Regression check** — If recent changes touched critical paths, consider a quick smoke test
4. **Update test documentation** — Keep test plans current with latest requirements
5. **Memory maintenance** — Update MEMORY.md with bug status changes

If there's genuinely nothing to do, reply `HEARTBEAT_OK`.

## Heartbeat Priorities

1. Unverified fixes for S0/S1 bugs
2. Untested new changes
3. Regression test maintenance
4. Test documentation updates
