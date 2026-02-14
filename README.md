
<div align="center">

```
   _____ _                 _____           _
  / ____| |               / ____|         | |
 | |    | | __ ___      _| |  __  ___   __| |
 | |    | |/ _` \ \ /\ / / | |_ |/ _ \ / _` |
 | |____| | (_| |\ V  V /| |__| | (_) | (_| |
  \_____|_|\__,_| \_/\_/  \_____|\___/ \__,_|
```

**Multi-Agent OpenClaw Instance Generator**

Generate, configure, and deploy a team of AI agents in minutes — not hours.

[![Node](https://img.shields.io/badge/node-%3E%3D18-brightgreen)]()
[![Dependencies](https://img.shields.io/badge/dependencies-0-blue)]()
[![License: MIT](https://img.shields.io/badge/license-MIT-yellow)]()

</div>

---

## Features

- 🧙 **Interactive wizard** — guided setup with company profiling and agent selection
- 🤖 **6 specialized agents** — Executive, Researcher, Developer, Copywriter, PM, QA
- 📁 **Direct OpenClaw integration** — writes to `~/.openclaw/` by default, ready to `openclaw gateway start`
- 🔀 **Smart merge** — detects existing installations, offers backup/merge/cancel
- 📋 **Profile-based generation** — save and reuse company profiles across instances
- 🚀 **Non-interactive mode** — fully automated for CI/scripting
- 📡 **Remote deployment** — deploy to Mac Minis via SSH + Tailscale
- 📦 **Zero dependencies** — pure Node.js built-ins only

---

## Quick Start

```bash
npm install -g clawgod
clawgod init
```

That's it. The wizard walks you through everything and writes directly to `~/.openclaw/`.

---

## Command Reference

### `clawgod init`

Generate a new multi-agent OpenClaw instance.

```bash
clawgod init [options]
```

| Flag | Description | Default |
|---|---|---|
| `--profile <path>` | Load a pre-filled company profile JSON | — |
| `--output <dir>` | Write to a custom directory instead of `~/.openclaw/` | `~/.openclaw/` |
| `--non-interactive` | No prompts — requires `--profile` | `false` |

**Examples:**

```bash
# Interactive wizard (recommended for first run)
clawgod init

# Load a profile, confirm interactively
clawgod init --profile company.json

# Fully automated — no prompts
clawgod init --profile company.json --non-interactive

# Dry run to a test directory
clawgod init --output ./test-run

# Automated to a custom location
clawgod init --profile company.json --non-interactive --output /opt/openclaw
```

---

### `clawgod add-agent`

Add a new agent to an existing instance.

```bash
clawgod add-agent [options]
```

| Flag | Description | Default |
|---|---|---|
| `--type <agent>` | Agent type to add (see [Agent Types](#agent-types)) | interactive |
| `--dir <path>` | Path to existing instance directory | `~/.openclaw/` |

**Examples:**

```bash
# Interactive — shows available agents, lets you pick
clawgod add-agent

# Add a specific agent
clawgod add-agent --type pm

# Add to a custom directory
clawgod add-agent --type qa --dir ./my-instance
```

This command:
1. Creates the agent workspace with all template files
2. Adds the agent entry to `openclaw.json`
3. Adds the Telegram bot account (you'll need to fill in the token)

---

### `clawgod validate`

Validate an OpenClaw instance — checks config, workspaces, and placeholders.

```bash
clawgod validate [dir]
```

| Argument | Description | Default |
|---|---|---|
| `dir` | Path to instance directory | `~/.openclaw/` |

**Examples:**

```bash
# Validate default installation
clawgod validate

# Validate a specific directory
clawgod validate ./test-run
```

**What it checks:**
- ✅ Directory exists
- ✅ `openclaw.json` is valid JSON
- ✅ No remaining `REPLACE_ME` placeholders
- ✅ Every agent has a workspace directory
- ✅ Workspace directories contain all required files

---

### `clawgod deploy`

Deploy an instance to a remote host via SSH.

```bash
clawgod deploy
```

> Requires Tailscale or direct SSH access to the target machine. See [Remote Setup](#remote-setup-tailscale).

---

## How It Works

### What Gets Generated

Running `clawgod init` creates this structure:

```
~/.openclaw/
├── openclaw.json              ← Main config (credentials go here)
├── company-profile.json       ← Saved profile (reusable for re-generation)
└── workspaces/
    ├── executive/
    │   ├── AGENTS.md           ← Agent behavior rules
    │   ├── SOUL.md             ← Personality and identity
    │   ├── USER.md             ← Info about the human operator
    │   ├── IDENTITY.md         ← Role-specific context
    │   ├── TOOLS.md            ← Tool configuration notes
    │   ├── HEARTBEAT.md        ← Proactive task scheduling
    │   ├── BOARD-WORKFLOW.md   ← Shared kanban workflow
    │   ├── BOOT.md             ← First-run bootstrap (if applicable)
    │   └── memory/             ← Agent memory (grows over time)
    ├── researcher/
    │   └── ...
    ├── developer/
    │   └── ...
    └── copywriter/
        └── ...
```

### Workspace Paths

Workspace paths in `openclaw.json` are **absolute** (e.g. `/Users/you/.openclaw/workspaces/executive`). OpenClaw resolves them regardless of your working directory.

When using `--output`, paths point into that directory instead:

```bash
clawgod init --output ./test-run
# Config:     ./test-run/openclaw.json
# Workspaces: ./test-run/workspaces/<agent>/
```

### Template Processing

Each agent workspace is generated from templates in `templates/agents/<id>/`. Company-specific placeholders like `{{COMPANY_NAME}}`, `{{DOMAIN_INFO}}`, and `{{BRAND_VOICE}}` are replaced with your profile data. The shared `WORKFLOW.md` template is copied to every agent as `BOARD-WORKFLOW.md`.

---

## Agent Architecture

```
┌──────────────────────────────────────────────┐
│                    Human                      │
│               (via Telegram)                  │
└───────────────────┬──────────────────────────┘
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

You talk to the **Executive** via Telegram. It delegates tasks to specialist agents, synthesizes their output, and reports back. Each agent has its own Telegram bot, workspace, and persistent memory.

---

## Agent Types

| Agent | ID | Default | Role |
|---|---|---|---|
| **Executive** | `executive` | ✅ ON | Central orchestrator. Routes tasks, makes decisions, delegates to specialists, synthesizes results. Your primary point of contact. |
| **Researcher** | `researcher` | ✅ ON | Deep research and analysis. Market intelligence, competitive analysis, fact-checking, sourcing, data synthesis. |
| **Developer** | `developer` | ✅ ON | Technical implementation. Code generation, debugging, architecture decisions, technical documentation. |
| **Copywriter** | `copywriter` | ✅ ON | Content creation. Brand voice, social media copy, blog posts, design briefs, messaging frameworks. |
| **Project Manager** | `pm` | ⬜ OFF | Project coordination. PRDs, roadmaps, sprint planning, stakeholder updates, progress tracking. |
| **QA Engineer** | `qa` | ⬜ OFF | Quality assurance. Testing strategies, validation, edge case identification, quality gates, bug tracking. |

Agents marked **ON** are selected by default in the wizard. You can toggle any combination during setup.

---

## Profile Format

Save a JSON profile to skip the wizard or reuse across instances:

```json
{
  "company": {
    "name": "Acme Corp",
    "domain": "Developer tools and APIs",
    "targetAudience": "Software engineers, DevOps teams",
    "products": "API gateway, SDK toolkit, monitoring dashboard",
    "stage": "growth",
    "teamSize": "25-50",
    "competitors": ["Postman", "Kong", "Apigee"],
    "brandVoice": "Technical, concise, developer-first",
    "contentChannels": ["Blog", "Twitter", "Dev.to", "YouTube"],
    "techStack": ["Go", "React", "PostgreSQL", "Kubernetes"],
    "positioning": "The API platform that developers actually enjoy using"
  },
  "agents": ["executive", "researcher", "developer", "copywriter", "pm"]
}
```

### Company Fields

| Field | Required | Description |
|---|---|---|
| `name` | ✅ | Company or project name |
| `domain` | ✅ | Industry or domain (e.g. "SaaS", "E-commerce") |
| `targetAudience` | | Who you're building for |
| `products` | | Core products or services |
| `stage` | | Company stage: `seed`, `early`, `growth`, `mature` |
| `teamSize` | | Approximate team size |
| `competitors` | | Array of competitor names |
| `brandVoice` | | How your brand sounds (e.g. "Bold, technical, no-BS") |
| `contentChannels` | | Array of channels (e.g. `["Blog", "Twitter"]`) |
| `techStack` | | Array of technologies |
| `positioning` | | Your unique differentiator |

### Agent Selection

The `agents` array takes agent IDs. Valid values:

```
executive, researcher, developer, copywriter, pm, qa
```

If omitted, defaults to `["executive", "researcher", "developer", "copywriter"]`.

---

## Existing Installation Handling

When `~/.openclaw/openclaw.json` already exists, ClawGod detects it and shows what's there:

```
  ⚠  Existing OpenClaw installation detected

  Current agents:
    • Executive (executive)
    • Researcher (researcher)
    • Developer (developer)

  Company: Acme Corp
  Generated: 2026-02-13T04:30:00.000Z

  ? What would you like to do?
    1) Back up existing config and create new
    2) Merge new agents into existing config
    3) Cancel
```

### Option 1: Backup & Overwrite

- Copies `openclaw.json` → `openclaw.json.2026-02-13-163042.bak`
- Generates a fresh config
- Workspace directories are **not** backed up (they accumulate memory over time)

### Option 2: Merge

- Adds new agents to `agents` list (skips if agent ID already exists)
- Adds new Telegram accounts (skips existing ones)
- Creates workspace directories only for new agents
- Preserves everything in the existing config

### Option 3: Cancel

Does nothing.

### Non-interactive Mode

In `--non-interactive` mode, ClawGod always backs up and overwrites — it never merges automatically.

---

## Notion Board Integration

Agents coordinate through a shared Notion kanban board for task tracking.

### Setup

```bash
# Create the Notion board
node scripts/create-notion-board.js --parent-page <NOTION_PAGE_ID>

# The board ID is saved and agents reference it via WORKFLOW.md
```

### Workflow

```
Inbox → In Progress → Review → Done
          ↑              │
          └── Rejected ──┘
```

| Status | Who | What |
|---|---|---|
| **Inbox** | Executive | Triage — set priority, type, assign owner |
| **In Progress** | Specialist agents | Do the work |
| **Review** | Human | Approve → Done, or reject → back to In Progress |
| **Done** | — | Complete |
| **Blocked** | Anyone | Stuck (with explanation in Agent Log) |

**Human review gate:** Agents move finished work to Review. Only humans move tickets to Done. This keeps you in the loop without bottlenecking the process.

### Board Properties

| Property | Type | Purpose |
|---|---|---|
| Name | Title | Task description |
| Status | Select | Workflow stage |
| Priority | Select | `P0` (critical) → `P3` (low) |
| Type | Select | `task`, `research`, `content`, `bug`, `feature` |
| Owner | Select | Assigned agent |
| Labels | Multi-select | Categorization tags |
| Due | Date | Deadline |
| Agent Log | Rich text | Agent notes and progress updates |

---

## Remote Setup (Tailscale)

For headless Mac Mini deployments with secure remote access.

### Step 1: Provision the Mac Mini

```bash
# On the Mac Mini
git clone <your-repo-url> ~/clawgod
cd ~/clawgod
chmod +x scripts/tailscale-setup.sh

./scripts/tailscale-setup.sh \
  --authkey tskey-auth-your-key-here \
  --hostname agent-mini-1
```

After this, SSH from any device on your tailnet:

```bash
ssh agent-mini-1
```

### Step 2: Install & Generate

```bash
# On the Mac Mini (via SSH)
npm install -g clawgod openclaw
clawgod init --profile company.json --non-interactive
```

### Step 3: Configure & Launch

```bash
# Edit credentials
nano ~/.openclaw/openclaw.json

# Set API key and start
export ANTHROPIC_API_KEY="sk-ant-..."
openclaw gateway start
```

### Multiple Machines

Run `tailscale-setup.sh` on each Mac Mini with a unique hostname. Each can run its own independent OpenClaw instance with different agent configurations.

---

## Configuration

After generating, edit `~/.openclaw/openclaw.json` and replace all `REPLACE_ME` placeholders:

### Telegram Bot Tokens

Each agent needs its own Telegram bot:

1. Open Telegram and message [@BotFather](https://t.me/BotFather)
2. Send `/newbot` and follow the prompts
3. Copy the bot token (format: `123456789:ABCdefGHIjklMNOpqrsTUVwxyz`)
4. Repeat for each agent

| Placeholder | Agent |
|---|---|
| `REPLACE_ME_EXECUTIVE_BOT_TOKEN` | Executive |
| `REPLACE_ME_RESEARCHER_BOT_TOKEN` | Researcher |
| `REPLACE_ME_DEVELOPER_BOT_TOKEN` | Developer |
| `REPLACE_ME_COPYWRITER_BOT_TOKEN` | Copywriter |
| `REPLACE_ME_PM_BOT_TOKEN` | Project Manager |
| `REPLACE_ME_QA_BOT_TOKEN` | QA Engineer |

### Telegram User ID

Your numeric Telegram user ID (not username):

1. Message [@userinfobot](https://t.me/userinfobot) on Telegram
2. It replies with your numeric ID
3. Replace all `REPLACE_ME_YOUR_TELEGRAM_USER_ID` values

This restricts bot access to only you.

### API Keys

| Placeholder | Where to Get It | Required |
|---|---|---|
| `REPLACE_ME_BRAVE_SEARCH_API_KEY` | [brave.com/search/api](https://brave.com/search/api/) | Yes |
| `REPLACE_ME_NOTION_API_KEY` | [notion.so/my-integrations](https://www.notion.so/my-integrations) | No |

### Anthropic API Key

Set as an environment variable (not stored in config):

```bash
export ANTHROPIC_API_KEY="sk-ant-api03-..."

# Or add to your shell profile
echo 'export ANTHROPIC_API_KEY="sk-ant-..."' >> ~/.zshrc
```

---

## FAQ & Troubleshooting

<details>
<summary><strong>Bot not responding on Telegram</strong></summary>

1. Verify the bot token is correct in `openclaw.json`
2. Check the gateway is running: `openclaw gateway status`
3. Check logs: `openclaw gateway logs`
4. Make sure your Telegram user ID matches `allowedUsers`
</details>

<details>
<summary><strong>Agent can't find its workspace</strong></summary>

Run `clawgod validate` to check all workspace paths. Ensure the paths in `openclaw.json` match actual directories. If you moved files, update the `workspace` field for each agent.
</details>

<details>
<summary><strong>Can I use this without Telegram?</strong></summary>

Telegram is the default channel, but OpenClaw supports Discord and other channels. Edit `openclaw.json` to configure alternative channels. The generated config includes a disabled Discord section you can enable.
</details>

<details>
<summary><strong>How do I update agent templates after generating?</strong></summary>

Edit the files directly in `~/.openclaw/workspaces/<agent>/`. The generated files are yours — ClawGod won't overwrite existing workspaces during a merge. To regenerate from scratch, use backup mode.
</details>

<details>
<summary><strong>Can I run multiple instances on one machine?</strong></summary>

Yes. Use `--output` to generate to different directories:

```bash
clawgod init --output ~/.openclaw-project-a
clawgod init --output ~/.openclaw-project-b
```

Each instance runs independently with its own gateway port (edit `gateway.port` in each config).
</details>

<details>
<summary><strong>What models are supported?</strong></summary>

The default config uses `anthropic/claude-sonnet-4-20250514`. You can change the model per-agent or globally in `openclaw.json`:

```json
{
  "models": {
    "default": "anthropic/claude-sonnet-4-20250514",
    "available": [
      "anthropic/claude-sonnet-4-20250514",
      "anthropic/claude-opus-4-20250514"
    ]
  }
}
```
</details>

<details>
<summary><strong>Tailscale won't connect</strong></summary>

- Check your auth key hasn't expired (they have a default TTL)
- Verify Tailscale is running: `tailscale status`
- Try re-authenticating: `tailscale up --authkey <new-key>`
</details>

<details>
<summary><strong>How do I remove an agent?</strong></summary>

1. Delete the agent entry from `agents` array in `openclaw.json`
2. Delete the Telegram account entry from `channels.telegram.accounts`
3. Optionally delete the workspace directory (but it contains memory — consider keeping it)
</details>

---

## Contributing

Contributions welcome! This project has zero external dependencies by design — please keep it that way.

```bash
# Clone and test
git clone <repo-url>
cd clawgod

# Run the wizard locally
node bin/clawgod.js init --output ./test-output

# Validate your output
node bin/clawgod.js validate ./test-output
```

### Adding a New Agent Type

1. Create `templates/agents/<agent-id>/` with workspace files:
   - `AGENTS.md` — behavior rules and constraints
   - `SOUL.md` — personality, voice, identity
   - `USER.md` — information about the human operator
   - `IDENTITY.md` — role-specific context and responsibilities
   - `TOOLS.md` — tool configuration and notes
   - `HEARTBEAT.md` — proactive task definitions
   - `BOOT.md` — (optional) first-run bootstrap instructions
2. Add the agent to `AGENT_DEFINITIONS` in `src/utils/config.js`
3. Add agent and Telegram account entries to `templates/openclaw.json.template`
4. Test with `clawgod init --output ./test` and `clawgod validate ./test`

### Project Structure

```
clawgod/
├── bin/
│   └── clawgod.js           ← CLI entry point
├── src/
│   ├── commands/
│   │   ├── init.js           ← Instance generation
│   │   ├── add-agent.js      ← Add agent to existing instance
│   │   ├── validate.js       ← Config validation
│   │   └── deploy.js         ← Remote deployment
│   ├── utils/
│   │   ├── config.js         ← Agent definitions, placeholder logic
│   │   └── templates.js      ← File generation, merge logic
│   └── wizard/
│       ├── ui.js             ← Colors, formatting, banner
│       └── prompts.js        ← Interactive input helpers
├── templates/
│   ├── openclaw.json.template
│   ├── WORKFLOW.md
│   └── agents/
│       ├── executive/
│       ├── researcher/
│       ├── developer/
│       ├── copywriter/
│       ├── pm/
│       └── qa/
└── examples/
    └── demo-profile.json
```

---

## License

MIT — do whatever you want with it.
