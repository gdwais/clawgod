// =============================================================================
// clawgod deploy — Deploy to remote host via SSH
// =============================================================================

import * as path from 'path';
import { header, bold, cyan, dim, yellow, green } from '../wizard/ui';
import { createRL } from '../wizard/prompts';
import type { DeployArgs } from '../types';

function parseArgs(argv: string[]): DeployArgs {
  const args: DeployArgs = { host: null, user: null, dir: './output' };
  for (let i = 0; i < argv.length; i++) {
    switch (argv[i]) {
      case '--host':   args.host = argv[++i]; break;
      case '--user':   args.user = argv[++i]; break;
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
  ${bold('clawgod deploy')} — Deploy an instance to a remote host

  ${bold('Usage:')}  clawgod deploy [options]

  ${bold('Options:')}
    ${cyan('--host <hostname>')}   Remote host (IP or Tailscale hostname)
    ${cyan('--user <user>')}       SSH user ${dim('(default: current user)')}
    ${cyan('--dir <path>')}        Local instance directory ${dim('(default: ./output)')}
    ${cyan('--help, -h')}          Show this help

  ${bold('Examples:')}
    ${dim('$')} clawgod deploy --host thor-mini-1 --user admin --dir ./output
`);
}

export default async function deploy(argv: string[]): Promise<void> {
  const args = parseArgs(argv);

  let { host, user, dir } = args;

  if (!host || !user) {
    const rl = createRL();
    try {
      header('🚀 Deploy Instance');

      if (!host) {
        host = await new Promise<string>((resolve) => {
          rl.question(`  ${cyan('?')} Remote host: `, (a: string) => resolve(a.trim()));
        });
        if (!host) throw new Error('Host is required');
      }
      if (!user) {
        const defaultUser = process.env.USER || 'admin';
        user = await new Promise<string>((resolve) => {
          rl.question(`  ${cyan('?')} SSH user ${dim(`[${defaultUser}]`)}: `, (a: string) => resolve(a.trim() || defaultUser));
        });
      }
    } finally {
      rl.close();
    }
  }

  const resolvedDir = path.resolve(dir);
  const remote = `${user}@${host}`;

  header('🚀 Deploy Commands');
  console.log(`  ${dim('Run these commands to deploy your instance:')}\n`);

  const commands = [
    `# 1. Copy files to remote host`,
    `scp -r ${resolvedDir}/openclaw.json ${remote}:~/.config/openclaw/openclaw.json`,
    `scp -r ${resolvedDir}/workspaces ${remote}:~/.config/openclaw/workspaces`,
    ``,
    `# 2. SSH into the remote host`,
    `ssh ${remote}`,
    ``,
    `# 3. On the remote host, install OpenClaw if needed`,
    `npm install -g openclaw`,
    ``,
    `# 4. Set your Anthropic API key`,
    `export ANTHROPIC_API_KEY="sk-ant-..."`,
    ``,
    `# 5. Start the gateway`,
    `openclaw gateway start`,
    `openclaw gateway status`,
  ];

  for (const line of commands) {
    if (line.startsWith('#')) {
      console.log(`  ${green(line)}`);
    } else if (line === '') {
      console.log('');
    } else {
      console.log(`  ${yellow('$')} ${line}`);
    }
  }

  console.log(`\n  ${dim('Automated deployment coming in a future release.')}\n`);
}
