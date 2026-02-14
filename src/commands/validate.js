// =============================================================================
// clawgod validate — Validate a generated config
// =============================================================================

const fs = require('fs');
const os = require('os');
const path = require('path');
const { header, check, warn, fail, bold, cyan, dim, green, red, yellow } = require('../wizard/ui');
const { AGENT_FILES } = require('../utils/config');

const DEFAULT_OPENCLAW_DIR = path.join(os.homedir(), '.openclaw');

function showHelp() {
  console.log(`
  ${bold('clawgod validate')} — Validate a generated OpenClaw instance

  ${bold('Usage:')}  clawgod validate [dir]

  ${bold('Arguments:')}
    ${cyan('dir')}    Path to instance directory ${dim(`(default: ~/.openclaw/)`)}

  ${bold('Options:')}
    ${cyan('--help, -h')}   Show this help

  ${bold('Examples:')}
    ${dim('$')} clawgod validate
    ${dim('$')} clawgod validate ~/.openclaw
    ${dim('$')} clawgod validate ./custom-dir
`);
}

module.exports = async function validate(argv) {
  let dir = DEFAULT_OPENCLAW_DIR;
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--help' || argv[i] === '-h') { showHelp(); process.exit(0); }
    else if (!argv[i].startsWith('-')) dir = argv[i];
    else throw new Error(`Unknown option: ${argv[i]}`);
  }

  const resolvedDir = path.resolve(dir);
  header('🔍 Validating Instance');
  console.log(`  ${dim('Directory:')} ${resolvedDir}\n`);

  let errors = 0;
  let warnings = 0;

  // Check directory exists
  if (!fs.existsSync(resolvedDir)) {
    fail(`Directory not found: ${resolvedDir}`);
    process.exit(1);
  }
  check('Directory exists');

  // Check openclaw.json
  const configPath = path.join(resolvedDir, 'openclaw.json');
  let config = null;
  if (!fs.existsSync(configPath)) {
    fail('openclaw.json not found');
    errors++;
  } else {
    try {
      config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
      check('openclaw.json is valid JSON');
    } catch (e) {
      fail(`openclaw.json is invalid JSON: ${e.message}`);
      errors++;
    }
  }

  // Check for REPLACE_ME values
  if (config) {
    const raw = fs.readFileSync(configPath, 'utf-8');
    const matches = raw.match(/REPLACE_ME[A-Z_]*/g);
    if (matches) {
      const unique = [...new Set(matches)];
      warn(`${unique.length} REPLACE_ME placeholder(s) found:`);
      for (const m of unique) {
        console.log(`      ${yellow('•')} ${m}`);
      }
      warnings += unique.length;
    } else {
      check('No REPLACE_ME placeholders remaining');
    }

    // Check agents have workspaces
    if (config.agents) {
      console.log('');
      for (const agent of config.agents) {
        // Support both absolute workspace paths and relative paths
        const wsPath = path.isAbsolute(agent.workspace || '')
          ? agent.workspace
          : path.join(resolvedDir, 'workspaces', agent.id);
        if (!fs.existsSync(wsPath)) {
          fail(`Missing workspace for agent: ${agent.id}`);
          errors++;
        } else {
          // Check required files
          const missing = [];
          for (const file of AGENT_FILES) {
            if (!fs.existsSync(path.join(wsPath, file))) {
              // WORKFLOW.md is optional per-agent
              if (file !== 'WORKFLOW.md') missing.push(file);
            }
          }
          if (missing.length) {
            warn(`${agent.id}: missing files: ${missing.join(', ')}`);
            warnings += missing.length;
          } else {
            check(`${agent.id}/ — all files present`);
          }
        }
      }
    }
  }

  // Summary
  console.log('');
  if (errors === 0 && warnings === 0) {
    console.log(`  ${green(bold('✓ All checks passed!'))}\n`);
  } else if (errors === 0) {
    console.log(`  ${yellow(bold(`⚠ ${warnings} warning(s), no errors`))}\n`);
  } else {
    console.log(`  ${red(bold(`✗ ${errors} error(s), ${warnings} warning(s)`))}\n`);
    process.exit(1);
  }
};
