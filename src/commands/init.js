// =============================================================================
// clawgod init — Interactive Instance Generator
// =============================================================================

const fs = require('fs');
const os = require('os');
const path = require('path');
const { banner, header, divider, box, check, bold, cyan, dim, green, yellow, red } = require('../wizard/ui');
const { createRL, ask, confirm, select, multiSelect, parseCSV } = require('../wizard/prompts');
const { AGENT_DEFINITIONS, loadProfile } = require('../utils/config');
const { generate } = require('../utils/templates');

const DEFAULT_OPENCLAW_DIR = path.join(os.homedir(), '.openclaw');

function parseArgs(argv) {
  const args = { profile: null, output: null, nonInteractive: false };
  for (let i = 0; i < argv.length; i++) {
    switch (argv[i]) {
      case '--profile':        args.profile = argv[++i]; break;
      case '--output':         args.output = argv[++i]; break;
      case '--non-interactive': args.nonInteractive = true; break;
      case '--help': case '-h': showHelp(); process.exit(0);
      default:
        throw new Error(`Unknown option: ${argv[i]}`);
    }
  }
  return args;
}

function showHelp() {
  console.log(`
  ${bold('clawgod init')} — Generate a new OpenClaw multi-agent instance

  ${bold('Usage:')}  clawgod init [options]

  ${bold('Options:')}
    ${cyan('--profile <path>')}      Load a pre-filled company profile JSON
    ${cyan('--output <dir>')}        Output to custom directory instead of ~/.openclaw/
    ${cyan('--non-interactive')}     Use profile without prompting ${dim('(requires --profile)')}
    ${cyan('--help, -h')}            Show this help

  ${bold('Examples:')}
    ${dim('$')} clawgod init
    ${dim('$')} clawgod init --profile company.json
    ${dim('$')} clawgod init --profile company.json --non-interactive
    ${dim('$')} clawgod init --output ./test-run
`);
}

function getTimestamp() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}-${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`;
}

function detectExisting(outputDir) {
  const configPath = path.join(outputDir, 'openclaw.json');
  if (!fs.existsSync(configPath)) return null;
  try {
    const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
    return config;
  } catch {
    return null;
  }
}

function showExistingInfo(config) {
  console.log(`\n  ${yellow('⚠')}  ${bold('Existing OpenClaw installation detected')}\n`);
  if (config.agents && config.agents.length) {
    console.log(`  ${dim('Current agents:')}`);
    for (const agent of config.agents) {
      console.log(`    ${green('•')} ${bold(agent.name || agent.id)} ${dim(`(${agent.id})`)}`);
    }
    console.log('');
  }
  if (config.meta?.company) {
    console.log(`  ${dim('Company:')} ${config.meta.company}`);
  }
  if (config.meta?.generatedAt) {
    console.log(`  ${dim('Generated:')} ${config.meta.generatedAt}`);
  }
  console.log('');
}

function backupConfig(outputDir) {
  const configPath = path.join(outputDir, 'openclaw.json');
  const bakPath = path.join(outputDir, `openclaw.json.${getTimestamp()}.bak`);
  fs.copyFileSync(configPath, bakPath);
  check(`Backed up to ${bakPath.replace(os.homedir(), '~')}`);
  return bakPath;
}

function mergeConfigs(existingConfig, newConfig) {
  // Merge agents
  let addedAgents = 0;
  for (const agent of (newConfig.agents || [])) {
    if (!existingConfig.agents.find(a => a.id === agent.id)) {
      existingConfig.agents.push(agent);
      addedAgents++;
    }
  }

  // Merge telegram accounts
  if (newConfig.channels?.telegram?.accounts) {
    if (!existingConfig.channels) existingConfig.channels = {};
    if (!existingConfig.channels.telegram) existingConfig.channels.telegram = { accounts: {} };
    if (!existingConfig.channels.telegram.accounts) existingConfig.channels.telegram.accounts = {};

    for (const [key, val] of Object.entries(newConfig.channels.telegram.accounts)) {
      if (!existingConfig.channels.telegram.accounts[key]) {
        existingConfig.channels.telegram.accounts[key] = val;
      }
    }
  }

  return { merged: existingConfig, addedAgents };
}

async function handleExistingInstall(rl, outputDir, existingConfig, nonInteractive) {
  showExistingInfo(existingConfig);

  if (nonInteractive) {
    backupConfig(outputDir);
    return 'overwrite';
  }

  const choice = await select(rl, 'What would you like to do?', [
    { value: 'backup',  label: 'Back up existing config and create new', desc: 'saves .bak file' },
    { value: 'merge',   label: 'Merge new agents into existing config',  desc: 'keeps current agents' },
    { value: 'cancel',  label: 'Cancel',                                  desc: '' },
  ]);

  if (choice === 'cancel') {
    console.log('\n  Cancelled.\n');
    process.exit(0);
  }

  if (choice === 'backup') {
    backupConfig(outputDir);
    return 'overwrite';
  }

  return 'merge';
}

async function collectCompanyProfile(rl) {
  header('📋 Company Profile');
  console.log(`  ${dim('Tell us about your company. This info shapes your agent team.')}\n`);

  const company = {};
  company.name            = await ask(rl, 'Company name', '', { required: true });
  company.domain          = await ask(rl, 'Industry/domain', '', { required: true });
  company.targetAudience  = await ask(rl, 'Target audience', '');
  company.products        = await ask(rl, 'Core products/services', '');
  company.stage           = await ask(rl, 'Company stage', 'growth');
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

function showSummary(company, agents) {
  header('📝 Summary');

  const lines = [];
  lines.push(`${bold('Company:')}        ${company.name}`);
  lines.push(`${bold('Domain:')}         ${company.domain}`);
  if (company.targetAudience) lines.push(`${dim('Audience:')}       ${company.targetAudience}`);
  if (company.products)       lines.push(`${dim('Products:')}       ${company.products}`);
  if (company.stage)          lines.push(`${dim('Stage:')}          ${company.stage}`);
  if (company.teamSize)       lines.push(`${dim('Team size:')}      ${company.teamSize}`);
  if (company.competitors && company.competitors.length) lines.push(`${dim('Competitors:')}    ${company.competitors.join(', ')}`);
  if (company.brandVoice)     lines.push(`${dim('Brand voice:')}    ${company.brandVoice}`);
  if (company.contentChannels && company.contentChannels.length) lines.push(`${dim('Channels:')}       ${company.contentChannels.join(', ')}`);
  if (company.techStack && company.techStack.length) lines.push(`${dim('Tech stack:')}     ${company.techStack.join(', ')}`);
  if (company.positioning)    lines.push(`${dim('Positioning:')}    ${company.positioning}`);

  for (const line of lines) console.log(`  ${line}`);

  divider();

  console.log(`  ${bold(`Agents (${agents.length}):`)}`);
  for (const id of agents) {
    const def = AGENT_DEFINITIONS.find(a => a.id === id);
    console.log(`    ${green('✓')} ${bold(def.name)} ${dim('—')} ${def.desc}`);
  }
  console.log('');
}

function showNextSteps(outputDir, agents) {
  const displayDir = outputDir.replace(os.homedir(), '~');
  const wsLines = agents.slice(0, 3).map(id => `               ${displayDir}/workspaces/${id}/`);
  if (agents.length > 3) wsLines.push(`               ${dim('...')}`);

  console.log('');
  box([
    `${bold('✨ Instance generated!')}`,
    '',
    `  Config:      ${displayDir}/openclaw.json`,
    ...wsLines.map((l, i) => i === 0 ? `  Workspaces:  ${l.trim()}` : l),
    '',
    `${bold('📋 Next steps:')}`,
    `  1. Edit ${displayDir}/openclaw.json and replace ${yellow('REPLACE_ME')} values`,
    `  2. Set ${bold('ANTHROPIC_API_KEY')} in your environment`,
    `  3. Run: ${cyan('openclaw gateway start')}`,
  ]);
  console.log('');
}

async function runGenerate(company, agents, outputDir, mode) {
  const { agentCount, newAgentIds } = generate(company, agents, outputDir, { mode });
  return { agentCount, newAgentIds };
}

module.exports = async function init(argv) {
  const args = parseArgs(argv);
  const outputDir = args.output ? path.resolve(args.output) : DEFAULT_OPENCLAW_DIR;

  banner();

  // Check for existing installation
  const existingConfig = detectExisting(outputDir);
  let mode = 'overwrite'; // default for fresh installs

  // Non-interactive
  if (args.nonInteractive) {
    if (!args.profile) throw new Error('--non-interactive requires --profile');
    const data = loadProfile(args.profile);
    console.log(`  ${dim('Loading profile:')} ${args.profile}\n`);

    if (existingConfig) {
      showExistingInfo(existingConfig);
      backupConfig(outputDir);
    }

    header('🔧 Generating');
    console.log(`  ${dim(`Output: ${outputDir}`)}\n`);
    generate(data.company, data.agents, outputDir, { mode: 'overwrite' });
    showNextSteps(outputDir, data.agents);
    return;
  }

  const rl = createRL();
  try {
    if (existingConfig) {
      mode = await handleExistingInstall(rl, outputDir, existingConfig, false);
    }

    // Profile mode
    if (args.profile) {
      const data = loadProfile(args.profile);
      console.log(`  ${dim('Loading profile:')} ${args.profile}\n`);
      showSummary(data.company, data.agents);

      const ok = await confirm(rl, 'Proceed with this configuration?', true);
      if (!ok) {
        header('🤖 Agent Selection');
        const agents = await multiSelect(rl, AGENT_DEFINITIONS);
        showSummary(data.company, agents);
        const ok2 = await confirm(rl, 'Proceed?', true);
        if (!ok2) { console.log('\n  Cancelled.\n'); process.exit(0); }
        header('🔧 Generating');
        console.log(`  ${dim(`Output: ${outputDir}`)}\n`);
        generate(data.company, agents, outputDir, { mode });
        showNextSteps(outputDir, agents);
      } else {
        header('🔧 Generating');
        console.log(`  ${dim(`Output: ${outputDir}`)}\n`);
        generate(data.company, data.agents, outputDir, { mode });
        showNextSteps(outputDir, data.agents);
      }
      return;
    }

    // Full interactive
    const company = await collectCompanyProfile(rl);

    header('🤖 Agent Selection');
    console.log(`  ${dim('Choose which agents to include.')}\n`);
    const agents = await multiSelect(rl, AGENT_DEFINITIONS);

    showSummary(company, agents);

    const proceed = await confirm(rl, 'Generate this configuration?', true);
    if (!proceed) {
      console.log('\n  Cancelled.\n');
      process.exit(0);
    }

    header('🔧 Generating');
    console.log(`  ${dim(`Output: ${outputDir}`)}\n`);
    generate(company, agents, outputDir, { mode });
    showNextSteps(outputDir, agents);
  } finally {
    rl.close();
  }
};
