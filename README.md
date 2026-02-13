# OpenClaw Setup — Mac Mini Fleet

End-to-end tooling for provisioning a Mac Mini with Tailscale and deploying a multi-agent OpenClaw instance.

## What's Inside

| File | Purpose |
|---|---|
| `scripts/tailscale-setup.sh` | Provisions a fresh Mac Mini with Tailscale + SSH |
| `scripts/generate-instance.js` | Interactive wizard to generate an OpenClaw config with up to 6 specialized agents |
| `scripts/create-notion-board.js` | Creates the shared Notion kanban board with full agent workflow schema |
| `templates/` | Agent workspace templates, config template, and workflow specs |
| `examples/` | Sample profile for demo/testing |

## Quick Start

```bash
# Interactive wizard — guided setup
npm run generate

# With a pre-filled profile — review and confirm
node scripts/generate-instance.js --profile examples/demo-profile.json

# Fully automated — no prompts
node scripts/generate-instance.js --profile examples/demo-profile.json --non-interactive

# Demo mode
npm run generate:demo
```

## Usage Modes

### 1. Interactive (default)

```bash
node scripts/generate-instance.js [--output ./output]
```

Walks you through:
1. **Company Profile** — name, domain, audience, tech stack, brand voice, etc.
2. **Agent Selection** — toggle each of 6 agents on/off
3. **Summary & Confirm** — review before generating

### 2. Profile-based

```bash
node scripts/generate-instance.js --profile path/to/profile.json [--output ./output]
```

Loads a pre-filled profile and shows it for confirmation. You can still adjust agent selection interactively.

### 3. Non-interactive

```bash
node scripts/generate-instance.js --profile path/to/profile.json --non-interactive [--output ./output]
```

Uses the profile as-is without any prompts. Perfect for CI/automation.

### Example Profile

```json
{
  "company": {
    "name": "ThorUX",
    "domain": "Content creation and distribution",
    "targetAudience": "Tech companies, B2B SaaS",
    "products": "AI-powered content workflows",
    "stage": "growth",
    "teamSize": "5-10",
    "competitors": ["Jasper", "Copy.ai", "Contently"],
    "brandVoice": "Bold, technical, no-BS",
    "contentChannels": ["LinkedIn", "Twitter", "Blog"],
    "techStack": ["Next.js", "Python", "OpenAI APIs"],
    "positioning": "AI agents that own the full content lifecycle"
  },
  "agents": ["executive", "researcher", "developer", "copywriter"]
}
```

## Agent Architecture

```
┌─────────────────────────────────────────────┐
│                   Human                      │
│              (via Telegram)                   │
└──────────────────┬──────────────────────────┘
                   │
          ┌────────▼────────┐
          │    Executive     │
          │  (orchestrator)  │
          └─┬───┬───┬───┬─┬─┘
            │   │   │   │ │
   ┌────────▼┐┌─▼──┐┌──▼─▼──┐┌──▼──┐┌──▼──┐
   │Researcher││Dev ││Copywrt││ PM  ││ QA  │
   └─────────┘└────┘└───────┘└─────┘└─────┘
```

### Available Agents (6)

| Agent | ID | Default | Description |
|---|---|---|---|
| **Executive** | `executive` | ✅ ON | Orchestrator — delegation, decision-making, synthesis |
| **Researcher** | `researcher` | ✅ ON | Market analysis, competitive intel, sourcing, fact-checking |
| **Developer** | `developer` | ✅ ON | Code, technical implementation, debugging, architecture |
| **Copywriter** | `copywriter` | ✅ ON | Content, brand voice, social copy, design briefs |
| **Project Manager** | `pm` | ⬜ OFF | PRDs, roadmaps, sprint planning, stakeholder updates |
| **QA Engineer** | `qa` | ⬜ OFF | Testing, validation, quality gates, edge cases |

## Full Workflow: Fresh Mac Mini → Running OpenClaw

### Prerequisites

- A Mac Mini (Apple Silicon, macOS 13+)
- An Anthropic API key
- A Tailscale account with an auth key ([generate one here](https://login.tailscale.com/admin/settings/keys))
- Telegram bots (one per selected agent — create via [@BotFather](https://t.me/BotFather))
- Your Telegram user ID (get via [@userinfobot](https://t.me/userinfobot))
- A Brave Search API key ([get one here](https://brave.com/search/api/))

### Step 1: Set Up Tailscale (on the Mac Mini)

```bash
git clone <your-repo-url> ~/clawgod
cd ~/clawgod
chmod +x scripts/tailscale-setup.sh

./scripts/tailscale-setup.sh \
  --authkey tskey-auth-your-key-here \
  --hostname thor-mini-1
```

After this, SSH from any device on your tailnet:
```bash
ssh thor-mini-1
```

### Step 2: Generate the OpenClaw Instance

```bash
cd ~/clawgod
npm run generate
```

Follow the interactive wizard. This creates:
```
output/
├── openclaw.json              # Main config (needs credentials)
├── company-profile.json       # Saved profile (reusable)
└── workspaces/
    ├── executive/             # Orchestrator agent workspace
    ├── researcher/            # Research agent workspace
    ├── developer/             # Developer agent workspace
    ├── copywriter/            # Content agent workspace
    ├── pm/                    # Project manager workspace (if selected)
    └── qa/                    # QA engineer workspace (if selected)
```

### Step 3: Configure Credentials

Edit `output/openclaw.json` and replace all `REPLACE_ME` values:

| Placeholder | Where to Get It |
|---|---|
| `REPLACE_ME_*_BOT_TOKEN` | @BotFather → create bot → copy token |
| `REPLACE_ME_YOUR_TELEGRAM_USER_ID` | @userinfobot on Telegram (numeric ID) |
| `REPLACE_ME_BRAVE_SEARCH_API_KEY` | brave.com/search/api |
| `REPLACE_ME_NOTION_API_KEY` | notion.so/my-integrations (optional) |

### Step 4: Install OpenClaw & Deploy

```bash
npm install -g openclaw
export ANTHROPIC_API_KEY="sk-ant-..."

cp output/openclaw.json ~/.config/openclaw/openclaw.json
cp -r output/workspaces ~/.config/openclaw/workspaces

openclaw gateway start
openclaw gateway status
```

### Step 5: Test Your Agents

Open Telegram and message each bot. The Executive agent is your primary interface — it can delegate to all others.

## Notion Kanban Board

Agents coordinate through a shared Notion board.

### Setup

```bash
# Create the board
node scripts/create-notion-board.js --parent-page <NOTION_PAGE_ID>

# Re-run generator to distribute notion-board.json to agents
node scripts/generate-instance.js --profile output/company-profile.json --non-interactive
```

### Workflow

```
Inbox → In Progress → Review → Done
          ↑              |
          └── Rejected ──┘
```

| Status | Who | What |
|---|---|---|
| Inbox | Executive | Triage — set priority, type, assign owner |
| In Progress | Dev / Copy / Researcher / PM | Do the work |
| Review | **Human** | Approve → Done, or reject → back to In Progress |
| Done | — | Complete |
| Blocked | Anyone | Stuck (with explanation in Agent Log) |

**Properties:** Name, Status, Priority, Type, Owner, Labels, Due, Agent Log.

**Human review gate:** Agents move finished work to Review. Only humans move tickets to Done. This keeps you in the loop without over-engineering the process.

### Customizing

Edit `templates/WORKFLOW.md` (shared) or `templates/agents/<agent>/WORKFLOW.md` (per-agent), then re-run the generator.

## Customization

### Adding More Agents

1. Create a new template directory in `templates/agents/<agent-id>/`
2. Add the 6 workspace files (AGENTS.md, SOUL.md, USER.md, IDENTITY.md, TOOLS.md, HEARTBEAT.md)
3. Add the agent to `AGENT_DEFINITIONS` in `scripts/generate-instance.js`
4. Add entries in `templates/openclaw.json.template`
5. Re-run the generator

### Reusing a Profile

After generating, `company-profile.json` is saved in the output directory. Use it to regenerate:
```bash
node scripts/generate-instance.js --profile output/company-profile.json --output ./new-output
```

### Multiple Mac Minis

Run `tailscale-setup.sh` on each Mini with a unique hostname. Each can run its own OpenClaw instance.

## Troubleshooting

| Problem | Solution |
|---|---|
| Tailscale won't connect | Check your auth key hasn't expired |
| Bot not responding | Check bot token, verify gateway is running (`openclaw gateway logs`) |
| Agent can't find workspace | Ensure workspace paths in openclaw.json match actual directories |

## Requirements

- **macOS** 13+ (Ventura or later)
- **Node.js** 18+
- **Zero npm dependencies** — uses only Node built-ins
