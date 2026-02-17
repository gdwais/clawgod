#!/usr/bin/env node

// =============================================================================
// OpenClaw Instance Generator — Interactive Wizard
// Generates a complete openclaw.json config and agent workspace files
// No external dependencies — uses only Node built-ins
// =============================================================================

const fs = require('fs');
const path = require('path');
const readline = require('readline');

// -----------------------------------------------------------------------------
// Constants
// -----------------------------------------------------------------------------
const AGENT_DEFINITIONS = [
  { id: 'executive',  name: 'Executive',       desc: 'Orchestrator — delegation, decision-making, synthesis',     defaultOn: true },
  { id: 'researcher', name: 'Researcher',      desc: 'Market analysis, competitive intel, sourcing, fact-checking', defaultOn: true },
  { id: 'developer',  name: 'Developer',       desc: 'Code, technical implementation, debugging, architecture',   defaultOn: true },
  { id: 'content-creator', name: 'Content Creator',      desc: 'Blog posts, articles, email sequences, whitepapers, scripts, ad copy', defaultOn: true },
  { id: 'brand-manager',   name: 'Brand Manager',        desc: 'Brand governance, voice consistency, content review',                defaultOn: false },
  { id: 'social-media',    name: 'Social Media Manager', desc: 'Social media strategy, platform-specific content, distribution',     defaultOn: false },
  { id: 'pm',         name: 'Project Manager', desc: 'PRDs, roadmaps, sprint planning, stakeholder updates',      defaultOn: false },
  { id: 'qa',         name: 'QA Engineer',     desc: 'Testing, validation, quality gates, edge cases',            defaultOn: false },
];

const AGENT_FILES = ['AGENTS.md', 'SOUL.md', 'USER.md', 'IDENTITY.md', 'TOOLS.md', 'HEARTBEAT.md', 'WORKFLOW.md'];

// -----------------------------------------------------------------------------
// CLI argument parsing
// -----------------------------------------------------------------------------
function parseArgs(argv) {
  const args = { profile: null, output: './output', nonInteractive: false };
  for (let i = 2; i < argv.length; i++) {
    switch (argv[i]) {
      case '--profile':   args.profile = argv[++i]; break;
      case '--output':    args.output = argv[++i]; break;
      case '--non-interactive': args.nonInteractive = true; break;
      case '--help': case '-h': printUsage(); process.exit(0);
      default:
        console.error(`Unknown argument: ${argv[i]}`);
        printUsage();
        process.exit(1);
    }
  }
  return args;
}

function printUsage() {
  console.log(`
Usage: node generate-instance.js [options]

Options:
  --profile <path>     Load a pre-filled company profile JSON
  --output <dir>       Output directory (default: ./output)
  --non-interactive    Use profile without prompting (requires --profile)
  -h, --help           Show this help message

Modes:
  Interactive:       node generate-instance.js
  With profile:      node generate-instance.js --profile company-profile.json
  Fully automated:   node generate-instance.js --profile company-profile.json --non-interactive
`);
}

// -----------------------------------------------------------------------------
// Readline helpers
// -----------------------------------------------------------------------------
function createRL() {
  return readline.createInterface({ input: process.stdin, output: process.stdout });
}

function ask(rl, question, defaultVal) {
  return new Promise((resolve) => {
    const suffix = defaultVal !== undefined && defaultVal !== '' ? ` [${defaultVal}]` : '';
    rl.question(`  ${question}${suffix}: `, (answer) => {
      const trimmed = answer.trim();
      resolve(trimmed || (defaultVal !== undefined ? String(defaultVal) : ''));
    });
  });
}

function askRequired(rl, question) {
  return new Promise((resolve) => {
    const doAsk = () => {
      rl.question(`  ${question} (required): `, (answer) => {
        const trimmed = answer.trim();
        if (!trimmed) {
          console.log('    ⚠  This field is required.');
          doAsk();
        } else {
          resolve(trimmed);
        }
      });
    };
    doAsk();
  });
}

function askYN(rl, question, defaultYes) {
  return new Promise((resolve) => {
    const hint = defaultYes ? 'Y/n' : 'y/N';
    rl.question(`  ${question} [${hint}]: `, (answer) => {
      const a = answer.trim().toLowerCase();
      if (a === '') resolve(defaultYes);
      else resolve(a === 'y' || a === 'yes');
    });
  });
}

function parseCSV(str) {
  if (!str) return [];
  return str.split(',').map(s => s.trim()).filter(Boolean);
}

// -----------------------------------------------------------------------------
// Section display helpers
// -----------------------------------------------------------------------------
function header(title) {
  console.log('');
  console.log('━'.repeat(60));
  console.log(`  ${title}`);
  console.log('━'.repeat(60));
  console.log('');
}

function divider() {
  console.log('');
  console.log('  ' + '─'.repeat(50));
  console.log('');
}

// -----------------------------------------------------------------------------
// Interactive wizard
// -----------------------------------------------------------------------------
async function collectCompanyProfile(rl) {
  header('📋 Section 1: Company Profile');
  console.log('  Tell us about your company. This info shapes your agent team.\n');

  const company = {};
  company.name            = await askRequired(rl, 'Company name');
  company.domain          = await askRequired(rl, 'Industry/domain');
  company.targetAudience  = await ask(rl, 'Target audience', '');
  company.products        = await ask(rl, 'Core products/services', '');
  company.stage           = await ask(rl, 'Company stage (startup/growth/enterprise)', 'growth');
  company.teamSize        = await ask(rl, 'Team size', '');
  const competitorsStr    = await ask(rl, 'Key competitors (comma-separated)', '');
  company.competitors     = parseCSV(competitorsStr);
  company.brandVoice      = await ask(rl, 'Brand voice description', '');
  const channelsStr       = await ask(rl, 'Primary content channels (comma-separated)', '');
  company.contentChannels = parseCSV(channelsStr);
  const techStr           = await ask(rl, 'Tech stack (comma-separated)', '');
  company.techStack       = parseCSV(techStr);
  company.positioning     = await ask(rl, 'Unique positioning/differentiator', '');

  return company;
}

async function collectAgentSelection(rl) {
  header('🤖 Section 2: Agent Selection');
  console.log('  Choose which agents to include. Toggle each with y/n.\n');

  const selected = [];
  for (const agent of AGENT_DEFINITIONS) {
    const defaultLabel = agent.defaultOn ? 'ON' : 'OFF';
    console.log(`  ${agent.name} — ${agent.desc} (default: ${defaultLabel})`);
    const enabled = await askYN(rl, `  Include ${agent.name}?`, agent.defaultOn);
    if (enabled) selected.push(agent.id);
    console.log('');
  }
  return selected;
}

function showSummary(company, agents) {
  header('📝 Section 3: Summary');

  console.log(`  Company:        ${company.name}`);
  console.log(`  Domain:         ${company.domain}`);
  if (company.targetAudience) console.log(`  Audience:       ${company.targetAudience}`);
  if (company.products)       console.log(`  Products:       ${company.products}`);
  if (company.stage)          console.log(`  Stage:          ${company.stage}`);
  if (company.teamSize)       console.log(`  Team size:      ${company.teamSize}`);
  if (company.competitors.length)     console.log(`  Competitors:    ${company.competitors.join(', ')}`);
  if (company.brandVoice)     console.log(`  Brand voice:    ${company.brandVoice}`);
  if (company.contentChannels.length) console.log(`  Channels:       ${company.contentChannels.join(', ')}`);
  if (company.techStack.length)       console.log(`  Tech stack:     ${company.techStack.join(', ')}`);
  if (company.positioning)    console.log(`  Positioning:    ${company.positioning}`);

  divider();

  console.log(`  Agents (${agents.length}):`);
  for (const id of agents) {
    const def = AGENT_DEFINITIONS.find(a => a.id === id);
    console.log(`    ✅ ${def.name} — ${def.desc}`);
  }
  console.log('');
}

// -----------------------------------------------------------------------------
// Template processing
// -----------------------------------------------------------------------------
function buildVars(company) {
  return {
    COMPANY_NAME:     company.name || '',
    DOMAIN_INFO:      company.domain || '',
    TARGET_AUDIENCE:  company.targetAudience || '',
    COMPETITORS:      Array.isArray(company.competitors) ? company.competitors.join(', ') : (company.competitors || ''),
    BRAND_VOICE:      company.brandVoice || '',
    CONTENT_CHANNELS: Array.isArray(company.contentChannels) ? company.contentChannels.join(', ') : (company.contentChannels || ''),
    TECH_STACK:       Array.isArray(company.techStack) ? company.techStack.join(', ') : (company.techStack || ''),
    PRODUCTS_SERVICES: company.products || '',
    POSITIONING:      company.positioning || '',
    COMPANY_STAGE:    company.stage || '',
    TEAM_SIZE:        company.teamSize || '',
    GENERATED_AT:     new Date().toISOString(),
  };
}

function replacePlaceholders(content, vars) {
  let result = content;
  for (const [key, value] of Object.entries(vars)) {
    result = result.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), value);
  }
  return result;
}

// -----------------------------------------------------------------------------
// Generation
// -----------------------------------------------------------------------------
function generate(company, agents, outputDir) {
  const templateDir = path.resolve(__dirname, '..', 'templates');
  const vars = buildVars(company);

  console.log(`\n🔧 Generating OpenClaw instance...`);
  console.log(`   Output: ${outputDir}\n`);

  fs.mkdirSync(outputDir, { recursive: true });

  // --- Generate openclaw.json (only include selected agents) ---
  const configTemplate = JSON.parse(fs.readFileSync(path.join(templateDir, 'openclaw.json.template'), 'utf-8'));

  // Filter agents
  configTemplate.agents = configTemplate.agents.filter(a => agents.includes(a.id));

  // Filter telegram accounts to only selected agents
  const accountKeys = Object.keys(configTemplate.channels.telegram.accounts);
  for (const key of accountKeys) {
    const agentId = key.replace('tg-', '');
    if (!agents.includes(agentId)) {
      delete configTemplate.channels.telegram.accounts[key];
    }
  }

  // Set meta
  configTemplate.meta = {
    company: company.name,
    domain: company.domain,
    generatedAt: new Date().toISOString(),
  };

  fs.writeFileSync(
    path.join(outputDir, 'openclaw.json'),
    JSON.stringify(configTemplate, null, 2) + '\n',
    'utf-8'
  );
  console.log(`  ✅ openclaw.json`);

  // --- Generate agent workspaces ---
  for (const agentId of agents) {
    const agentTemplateDir = path.join(templateDir, 'agents', agentId);
    const agentOutputDir = path.join(outputDir, 'workspaces', agentId);
    const memoryDir = path.join(agentOutputDir, 'memory');

    fs.mkdirSync(agentOutputDir, { recursive: true });
    fs.mkdirSync(memoryDir, { recursive: true });
    fs.writeFileSync(path.join(memoryDir, '.gitkeep'), '', 'utf-8');

    for (const file of AGENT_FILES) {
      const srcPath = path.join(agentTemplateDir, file);
      if (!fs.existsSync(srcPath)) {
        // WORKFLOW.md is optional per-agent; fall back to shared template
        if (file === 'WORKFLOW.md') continue;
        console.warn(`  ⚠️  Template missing: ${agentId}/${file}`);
        continue;
      }
      const content = fs.readFileSync(srcPath, 'utf-8');
      fs.writeFileSync(path.join(agentOutputDir, file), replacePlaceholders(content, vars), 'utf-8');
    }

    // Copy shared WORKFLOW.md (the board-level workflow spec)
    const sharedWorkflow = path.join(templateDir, 'WORKFLOW.md');
    if (fs.existsSync(sharedWorkflow)) {
      const content = fs.readFileSync(sharedWorkflow, 'utf-8');
      fs.writeFileSync(path.join(agentOutputDir, 'BOARD-WORKFLOW.md'), replacePlaceholders(content, vars), 'utf-8');
    }

    // Copy BOOT.md if it exists for this agent (e.g., executive)
    const bootSrc = path.join(agentTemplateDir, 'BOOT.md');
    if (fs.existsSync(bootSrc)) {
      const content = fs.readFileSync(bootSrc, 'utf-8');
      fs.writeFileSync(path.join(agentOutputDir, 'BOOT.md'), replacePlaceholders(content, vars), 'utf-8');
    }

    console.log(`  ✅ workspaces/${agentId}/ (${AGENT_FILES.length} files + memory/)`);
  }

  // --- Save company profile ---
  const profile = {
    company,
    agents,
    generatedAt: new Date().toISOString(),
  };
  fs.writeFileSync(
    path.join(outputDir, 'company-profile.json'),
    JSON.stringify(profile, null, 2) + '\n',
    'utf-8'
  );
  console.log(`  ✅ company-profile.json`);

  // --- Summary ---
  const botCount = agents.length;
  console.log(`\n✨ Instance generated successfully!`);
  console.log(`\n📋 Next steps:`);
  console.log(`   1. Edit openclaw.json and replace all REPLACE_ME values:`);
  console.log(`      - Telegram bot tokens (${botCount} bots — one per agent)`);
  console.log(`      - Your Telegram user ID`);
  console.log(`      - Brave Search API key`);
  console.log(`      - Anthropic API key`);
  console.log(`      - Notion API key`);
  console.log(`   2. Install OpenClaw: npm install -g openclaw`);
  console.log(`   3. Copy openclaw.json to ~/.openclaw/`);
  console.log(`   4. Run: openclaw gateway start`);
  console.log(`   5. The Executive agent will create the Notion board on first boot`);
  console.log('');
}

// -----------------------------------------------------------------------------
// Profile loading
// -----------------------------------------------------------------------------
function loadProfile(profilePath) {
  const raw = fs.readFileSync(path.resolve(profilePath), 'utf-8');
  const data = JSON.parse(raw);
  // Support both flat and nested formats
  if (data.company && typeof data.company === 'object') {
    return data;
  }
  // Legacy flat format
  return {
    company: {
      name: data.company || data.name || '',
      domain: data.domain || '',
      targetAudience: data.targetAudience || '',
      products: data.products || '',
      stage: data.stage || 'growth',
      teamSize: data.teamSize || '',
      competitors: data.competitors || [],
      brandVoice: data.brandVoice || '',
      contentChannels: data.contentChannels || [],
      techStack: data.techStack || [],
      positioning: data.positioning || '',
    },
    agents: data.agents || ['executive', 'researcher', 'developer', 'content-creator'],
  };
}

// -----------------------------------------------------------------------------
// Main
// -----------------------------------------------------------------------------
async function main() {
  const args = parseArgs(process.argv);
  const outputDir = path.resolve(args.output);

  console.log('');
  console.log('  ╔══════════════════════════════════════════════╗');
  console.log('  ║       🦅 OpenClaw Instance Generator         ║');
  console.log('  ╚══════════════════════════════════════════════╝');

  // --- Non-interactive mode ---
  if (args.nonInteractive) {
    if (!args.profile) {
      console.error('\n  ❌ --non-interactive requires --profile\n');
      process.exit(1);
    }
    const data = loadProfile(args.profile);
    console.log(`\n  Loading profile: ${args.profile}`);
    generate(data.company, data.agents, outputDir);
    return;
  }

  // --- Profile mode (skip company questions, confirm agents) ---
  if (args.profile) {
    const data = loadProfile(args.profile);
    console.log(`\n  Loading profile: ${args.profile}`);

    const rl = createRL();
    try {
      showSummary(data.company, data.agents);
      const ok = await askYN(rl, 'Proceed with this configuration?', true);
      if (!ok) {
        // Let them adjust agents
        const agents = await collectAgentSelection(rl);
        showSummary(data.company, agents);
        const ok2 = await askYN(rl, 'Proceed?', true);
        if (!ok2) { console.log('\n  Cancelled.\n'); process.exit(0); }
        generate(data.company, agents, outputDir);
      } else {
        generate(data.company, data.agents, outputDir);
      }
    } finally {
      rl.close();
    }
    return;
  }

  // --- Full interactive mode ---
  const rl = createRL();
  try {
    const company = await collectCompanyProfile(rl);
    const agents = await collectAgentSelection(rl);

    showSummary(company, agents);

    const proceed = await askYN(rl, 'Generate this configuration?', true);
    if (!proceed) {
      console.log('\n  Cancelled. Run again to start over.\n');
      process.exit(0);
    }

    generate(company, agents, outputDir);
  } finally {
    rl.close();
  }
}

main().catch((err) => {
  console.error(`\n  ❌ Error: ${err.message}\n`);
  process.exit(1);
});
