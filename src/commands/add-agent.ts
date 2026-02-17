// =============================================================================
// clawgod add-agent — Add an agent to an existing instance
// =============================================================================

import * as os from 'os';
import * as path from 'path';
import * as fs from 'fs';
import { header, check, bold, cyan, dim, green, red, yellow } from '../wizard/ui';
import { createRL, select, confirm } from '../wizard/prompts';
import { AGENT_DEFINITIONS } from '../utils/config';
import { generateSingleAgent } from '../utils/templates';
import type { AddAgentArgs } from '../types';

const DEFAULT_OPENCLAW_DIR = path.join(os.homedir(), '.openclaw');

function parseArgs(argv: string[]): AddAgentArgs {
  const args: AddAgentArgs = { type: null, dir: null };
  for (let i = 0; i < argv.length; i++) {
    switch (argv[i]) {
      case '--type':   args.type = argv[++i]; break;
      case '--dir':    args.dir = argv[++i]; break;
      case '--help': case '-h': showHelp(); process.exit(0);
      default:
        throw new Error(`Unknown option: ${argv[i]}`);
    }
  }
  return args;
}

function showHelp(): void {
  console.log(`
  ${bold('clawgod add-agent')} — Add an agent to an existing instance

  ${bold('Usage:')}  clawgod add-agent [options]

  ${bold('Options:')}
    ${cyan('--type <agent>')}   Agent type: ${AGENT_DEFINITIONS.map(a => a.id).join(', ')}
    ${cyan('--dir <path>')}     Path to instance directory ${dim(`(default: ~/.openclaw/)`)}
    ${cyan('--help, -h')}       Show this help

  ${bold('Examples:')}
    ${dim('$')} clawgod add-agent --type researcher
    ${dim('$')} clawgod add-agent --type pm --dir ./custom-dir
    ${dim('$')} clawgod add-agent ${dim('(interactive)')}
`);
}

export default async function addAgent(argv: string[]): Promise<void> {
  const args = parseArgs(argv);

  let agentType = args.type;
  let dir = args.dir || DEFAULT_OPENCLAW_DIR;

  // Interactive if missing flags
  if (!agentType) {
    const rl = createRL();
    try {
      header('🤖 Add Agent');

      if (!args.dir) {
        dir = await new Promise<string>((resolve) => {
          const defaultDisplay = DEFAULT_OPENCLAW_DIR.replace(os.homedir(), '~');
          rl.question(`  ${cyan('?')} Instance directory ${dim(`[${defaultDisplay}]`)}: `, (answer: string) => {
            const trimmed = answer.trim();
            if (!trimmed) resolve(DEFAULT_OPENCLAW_DIR);
            else resolve(trimmed.replace(/^~/, os.homedir()));
          });
        });
      }

      // Check which agents already exist
      const existingAgents: string[] = [];
      const wsDir = path.join(path.resolve(dir), 'workspaces');
      if (fs.existsSync(wsDir)) {
        for (const d of fs.readdirSync(wsDir)) {
          if (fs.statSync(path.join(wsDir, d)).isDirectory()) existingAgents.push(d);
        }
      }

      const available = AGENT_DEFINITIONS.filter(a => !existingAgents.includes(a.id));
      if (available.length === 0) {
        console.log(`\n  ${yellow('All agent types are already present in this instance.')}\n`);
        process.exit(0);
      }

      console.log('');
      if (existingAgents.length) {
        console.log(`  ${dim('Existing agents:')} ${existingAgents.join(', ')}`);
        console.log('');
      }

      agentType = await select(rl, 'Select agent to add:', available.map(a => ({
        value: a.id,
        label: a.name,
        desc: a.desc,
      })));

      const def = AGENT_DEFINITIONS.find(a => a.id === agentType);
      console.log('');
      const displayDir = dir.replace(os.homedir(), '~');
      const ok = await confirm(rl, `Add ${bold(def!.name)} to ${displayDir}?`, true);
      if (!ok) { console.log('\n  Cancelled.\n'); process.exit(0); }
    } finally {
      rl.close();
    }
  }

  // Validate
  const resolvedDir = path.resolve(dir);
  if (!fs.existsSync(resolvedDir)) {
    throw new Error(`Directory not found: ${resolvedDir}`);
  }

  const def = AGENT_DEFINITIONS.find(a => a.id === agentType);
  if (!def) {
    throw new Error(`Unknown agent type: ${agentType}. Available: ${AGENT_DEFINITIONS.map(a => a.id).join(', ')}`);
  }

  const wsDir = path.join(resolvedDir, 'workspaces', agentType!);
  if (fs.existsSync(wsDir)) {
    throw new Error(`Agent workspace already exists: ${wsDir}`);
  }

  // Generate
  console.log('');
  generateSingleAgent(agentType!, resolvedDir);
  check(`Added ${bold(def.name)} to ${dir.replace(os.homedir(), '~')}`);
  check(`Workspace: workspaces/${agentType}/`);
  check('Updated openclaw.json');
  console.log(`\n  ${dim('Remember to add the Telegram bot token for this agent in openclaw.json')}\n`);
}
