# Deployment Guide: Financial Services Profile

Step-by-step guide to deploying a 4-agent OpenClaw instance using the `financial-services` profile. By the end, you'll have an Executive (COO), Growth Engine, Intel Engine, and PR Engine running on Telegram with 22 scheduled cron jobs.

**Time estimate:** 30-45 minutes

**Prerequisites:**
- macOS or Linux machine (or VPS)
- Node.js 22+ installed
- Telegram account
- Anthropic API key (Claude)

---

## 1. Install OpenClaw

```bash
npm install -g openclaw
```

Verify:
```bash
openclaw --version
```

## 2. Install ClawGod

```bash
cd ~/Development/clawgod
npm install
npm run build
```

Or if published to npm:
```bash
npx clawgod --help
```

## 3. Generate the Instance

```bash
clawgod init --profile profiles/financial-services.json --output ~/.openclaw
```

This creates:
```
~/.openclaw/
├── openclaw.json              ← main config (edit this)
├── company-profile.json       ← saved profile data
├── scripts/
│   └── setup-cron.sh          ← cron job installer (run later)
├── workspaces/
│   ├── executive/             ← COO agent workspace
│   ├── growth-engine/         ← content + campaigns
│   ├── intel-engine/          ← research + leads
│   └── pr-engine/             ← media + PR
└── shared/
    ├── VOICE.md               ← ⚠️ MUST FILL IN (founder voice samples)
    ├── COMPANY-FACTS.md       ← ⚠️ MUST FILL IN (company details)
    ├── config/                ← coordination configs
    ├── content/drafts/        ← agent content output
    ├── intel/                 ← research output
    ├── pipeline/              ← lead pipeline
    ├── pr/                    ← PR tracking
    └── growth/                ← campaign data
```

## 4. Create Telegram Bots

You need **4 Telegram bots** — one per agent. Open Telegram and message [@BotFather](https://t.me/BotFather):

### Bot 1: Executive
```
/newbot
Name: [Company] Executive
Username: companyname_exec_bot
```
Copy the token. Repeat for the other 3:

### Bot 2: Growth Engine
```
/newbot
Name: [Company] Growth
Username: companyname_growth_bot
```

### Bot 3: Intel Engine
```
/newbot
Name: [Company] Intel
Username: companyname_intel_bot
```

### Bot 4: PR Engine
```
/newbot
Name: [Company] PR
Username: companyname_pr_bot
```

You now have 4 bot tokens. Keep them handy.

## 5. Get Your Telegram User ID

Message [@userinfobot](https://t.me/userinfobot) on Telegram. It replies with your user ID (a number like `700033557`). You'll use this for the `allowedUsers` field so only you can talk to the bots.

## 6. Configure openclaw.json

Open `~/.openclaw/openclaw.json` and fill in the values:

### Set the Anthropic API Key

```bash
export ANTHROPIC_API_KEY="sk-ant-your-key-here"
```

Add this to your shell profile (`~/.zshrc` or `~/.bashrc`) so it persists.

### Set Bot Tokens

Find the `channels.telegram.accounts` section and replace each `REPLACE_ME` token:

```json
"channels": {
  "telegram": {
    "accounts": {
      "tg-executive": {
        "botToken": "paste-executive-bot-token-here",
        "allowedUsers": ["your-telegram-user-id"]
      },
      "tg-growth-engine": {
        "botToken": "paste-growth-bot-token-here",
        "allowedUsers": ["your-telegram-user-id"]
      },
      "tg-intel-engine": {
        "botToken": "paste-intel-bot-token-here",
        "allowedUsers": ["your-telegram-user-id"]
      },
      "tg-pr-engine": {
        "botToken": "paste-pr-bot-token-here",
        "allowedUsers": ["your-telegram-user-id"]
      }
    }
  }
}
```

### Set Brave Search API Key

Get a free key at [brave.com/search/api](https://brave.com/search/api/):

```json
"skills": {
  "brave-search": {
    "type": "brave-search",
    "apiKey": "your-brave-api-key"
  }
}
```

### Verify Agent Models

The profile sets:
- `executive` → `anthropic/claude-opus-4` (better judgment, orchestration)
- `growth-engine` → `anthropic/claude-sonnet-4` (high volume, cost efficient)
- `intel-engine` → `anthropic/claude-sonnet-4`
- `pr-engine` → `anthropic/claude-sonnet-4`

Adjust if needed. Sonnet for all 4 is fine for testing.

## 7. Fill In VOICE.md (Critical)

This is the single most important step for content quality. Open:

```bash
nano ~/.openclaw/shared/VOICE.md
```

**Paste 5-10 real examples of the founder's writing.** LinkedIn posts, emails, tweets — anything that shows how they naturally communicate. Without this, all content will sound generic.

Also fill in:
- Words the founder uses
- Words the founder never uses
- Tone per channel

## 8. Fill In COMPANY-FACTS.md

```bash
nano ~/.openclaw/shared/COMPANY-FACTS.md
```

Fill in all `REPLACE_ME` fields:
- Product details, pricing, demo URL
- ICP (ideal customer profile) details
- Competitor analysis (what they do well, where they fall short)
- Differentiators
- Compliance/regulatory notes
- Brand assets

This file is referenced by all agents for consistent messaging.

## 9. Start the Gateway

```bash
openclaw gateway start
```

Verify it's running:
```bash
openclaw gateway status
```

You should see the gateway running with all 4 agents loaded.

## 10. Pair Each Bot on Telegram

Message each bot on Telegram. The first message triggers a pairing code.

### Pair the Executive bot:
1. Open Telegram, find your Executive bot, send any message (e.g., "hello")
2. You'll get a pairing code back (8 characters, like `ABCD1234`)
3. In your terminal:

```bash
openclaw pairing list telegram
openclaw pairing approve telegram ABCD1234
```

### Repeat for each bot:
```bash
# After messaging Growth bot on Telegram:
openclaw pairing approve telegram [GROWTH-CODE]

# After messaging Intel bot on Telegram:
openclaw pairing approve telegram [INTEL-CODE]

# After messaging PR bot on Telegram:
openclaw pairing approve telegram [PR-CODE]
```

**Verify all pairings:**
```bash
openclaw pairing list telegram
```

You should see 4 approved entries.

## 11. Test Each Agent

Send a test message to each bot on Telegram:

**Executive:**
> "Give me a status check — what do you know about the company and team so far?"

**Growth Engine:**
> "Draft a LinkedIn post about why legacy financial software is holding firms back."

**Intel Engine:**
> "Run a quick competitor scan. What's happening in [your niche] this week?"

**PR Engine:**
> "Find 5 fintech podcasts that accept guest pitches. Show me the list."

Each should respond using their SOUL.md personality and reference shared files.

## 12. Register Cron Jobs

Once agents are responding correctly:

```bash
chmod +x ~/.openclaw/scripts/setup-cron.sh
~/.openclaw/scripts/setup-cron.sh
```

This registers all 22 scheduled jobs:

| Count | Agent | Jobs |
|-------|-------|------|
| 2 | Executive | Morning briefing (8 AM), EOD summary (6 PM), weekly rollup (Fri 5 PM) |
| 6 | Growth Engine | LinkedIn draft, Instagram draft, 4x Twitter batches, weekly content batch, email review |
| 4 | Intel Engine | News scan, lead enrichment, weekly competitor report, weekly lead list, weekly summary |
| 4 | PR Engine | HARO scan, podcast pitches, conference scan, award scan, journalist outreach, weekly summary |

**Verify:**
```bash
openclaw cron list
```

All 22 jobs should appear with their next run times.

## 13. Configure API Integrations (Optional)

Each agent's `TOOLS.md` has `REPLACE_ME` placeholders for third-party APIs. Fill these in as you set up each service. **Agents work without these** — they fall back to web_search and save drafts for manual action.

### Priority Order

**Week 1 — Start here:**
1. Brave Search API (free) — already configured above, powers all research
2. That's it. Agents can operate on web_search alone.

**Week 2 — Growth:**
3. X/Twitter API — [developer.twitter.com](https://developer.twitter.com) (free Essential tier)
4. LinkedIn — either direct API (requires OAuth app approval) or Expandi

**Week 3 — Intel:**
5. Apollo.io — [apollo.io](https://apollo.io) (free tier: 100 credits/mo)
6. Crunchbase — [crunchbase.com/api](https://crunchbase.com/partners/api)

**Week 4 — PR:**
7. Connectively (HARO) — [connectively.us](https://connectively.us) (free account)
8. Listen Notes — [listennotes.com/api](https://listennotes.com/api) (free tier)

### Where to Add Keys

Edit the agent's TOOLS.md:
```bash
# Growth Engine integrations
nano ~/.openclaw/workspaces/growth-engine/TOOLS.md

# Intel Engine integrations
nano ~/.openclaw/workspaces/intel-engine/TOOLS.md

# PR Engine integrations
nano ~/.openclaw/workspaces/pr-engine/TOOLS.md
```

Replace `REPLACE_ME` with actual API keys. The agent will pick them up on next session.

## 14. Ongoing Operations

### Daily (first 2 weeks)
- Review agent outputs in Telegram — tune VOICE.md if content doesn't sound right
- Approve/reject content drafts in `shared/content/drafts/`
- Check `shared/intel/daily-scan.md` for overnight findings

### Weekly
- Review Growth Engine's email campaign performance report
- Review Intel Engine's competitor report and lead list
- Review PR Engine's pipeline summary
- Adjust cron schedules if timing doesn't work:

```bash
# Disable a job
openclaw cron edit <job-id> --disable

# Change schedule
openclaw cron edit <job-id> --cron "30 8 * * *"

# Remove a job
openclaw cron remove <job-id>
```

### Monthly
- Update COMPANY-FACTS.md with new metrics, wins, positioning changes
- Update VOICE.md if the founder's style evolves
- Review API spend and adjust model selection if needed

---

## Troubleshooting

### "pairing required" error
The gateway is running but no bots are connected. Make sure you:
1. Set bot tokens in `openclaw.json`
2. Messaged each bot on Telegram
3. Approved each pairing code

### Agent doesn't respond
```bash
openclaw status
openclaw gateway status
```
Check logs:
```bash
tail -f /tmp/openclaw/openclaw-$(date +%Y-%m-%d).log
```

### Cron jobs not firing
```bash
openclaw cron list
```
Check that jobs are `enabled: true` and next run time is correct. Verify timezone.

### Content sounds generic
VOICE.md isn't calibrated. Add more real writing samples. The more examples, the better the voice matching.

### API rate limits
Agents fall back gracefully. If Apollo is rate-limited, Intel Engine uses web_search. If Twitter API is down, Growth Engine saves drafts. No action needed.

---

## Cost Estimate

| Item | Monthly Cost |
|------|-------------|
| Claude API (Opus for Executive, Sonnet for 3 workers) | $50-150 |
| Brave Search API | Free (2K queries/mo) |
| Apollo.io (leads) | $0-49 (free tier exists) |
| Listen Notes (podcasts) | Free tier |
| X/Twitter API | Free (Essential tier) |
| Instantly.ai (if using cold email) | $30-97 |
| Expandi (if using LinkedIn automation) | $99 |
| **Total** | **$50-400/mo** |

---

## Quick Reference

| Command | What it does |
|---------|-------------|
| `openclaw gateway start` | Start the gateway |
| `openclaw gateway stop` | Stop the gateway |
| `openclaw gateway status` | Check status |
| `openclaw pairing list telegram` | List pairing requests |
| `openclaw pairing approve telegram CODE` | Approve a bot pairing |
| `openclaw cron list` | List all cron jobs |
| `openclaw cron run JOB_ID` | Manually trigger a job |
| `openclaw cron edit JOB_ID --disable` | Disable a job |
| `openclaw status` | Full system status |
