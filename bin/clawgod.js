#!/usr/bin/env node

// =============================================================================
// ClawGod CLI — Multi-Agent OpenClaw Instance Generator
// =============================================================================

const path = require('path');
const { bold, cyan, red, dim } = require('../src/wizard/ui');

const COMMANDS = {
  init:     { mod: '../src/commands/init',      desc: 'Generate a new OpenClaw multi-agent instance' },
  'add-agent': { mod: '../src/commands/add-agent', desc: 'Add an agent to an existing instance' },
  validate: { mod: '../src/commands/validate',  desc: 'Validate a generated config' },
  deploy:   { mod: '../src/commands/deploy',    desc: 'Deploy to a remote host via SSH' },
};

function showHelp() {
  console.log('');
  console.log(`  ${bold('clawgod')} — Multi-Agent OpenClaw Instance Generator`);
  console.log('');
  console.log(`  ${bold('Usage:')}  clawgod <command> [options]`);
  console.log('');
  console.log(`  ${bold('Commands:')}`);
  for (const [name, { desc }] of Object.entries(COMMANDS)) {
    console.log(`    ${cyan(name.padEnd(14))} ${desc}`);
  }
  console.log('');
  console.log(`  ${bold('Options:')}`);
  console.log(`    ${dim('--help, -h')}     Show help for a command`);
  console.log(`    ${dim('--version, -v')}  Show version`);
  console.log('');
  console.log(`  ${dim('Run')} clawgod <command> --help ${dim('for command-specific options.')}`);
  console.log('');
}

function showVersion() {
  const pkg = require('../package.json');
  console.log(`clawgod v${pkg.version}`);
}

// --- Main ---
const args = process.argv.slice(2);
const command = args[0];

if (!command || command === '--help' || command === '-h' || command === 'help') {
  showHelp();
  process.exit(0);
}

if (command === '--version' || command === '-v') {
  showVersion();
  process.exit(0);
}

if (!COMMANDS[command]) {
  console.error(`\n  ${red('Error:')} Unknown command "${command}"\n`);
  showHelp();
  process.exit(1);
}

// Forward to command module
const cmd = require(COMMANDS[command].mod);
cmd(args.slice(1)).catch((err) => {
  console.error(`\n  ${red('Error:')} ${err.message}\n`);
  process.exit(1);
});
