// =============================================================================
// Reusable Prompt Helpers — readline-based, zero dependencies
// =============================================================================

const readline = require('readline');
const { cyan, dim, yellow, green, bold } = require('./ui');

function createRL() {
  return readline.createInterface({ input: process.stdin, output: process.stdout });
}

function ask(rl, label, defaultVal, opts = {}) {
  return new Promise((resolve) => {
    const defHint = defaultVal !== undefined && defaultVal !== '' ? ` ${dim(`[${defaultVal}`)}${dim(']')}` : '';
    const reqTag = opts.required ? ` ${yellow('*')}` : '';
    rl.question(`  ${cyan('?')} ${label}${reqTag}${defHint}: `, (answer) => {
      const trimmed = answer.trim();
      if (opts.required && !trimmed && !defaultVal) {
        console.log(`    ${yellow('⚠')}  This field is required.`);
        return ask(rl, label, defaultVal, opts).then(resolve);
      }
      resolve(trimmed || (defaultVal !== undefined ? String(defaultVal) : ''));
    });
  });
}

function confirm(rl, question, defaultYes = true) {
  return new Promise((resolve) => {
    const hint = defaultYes ? `${green('Y')}/${dim('n')}` : `${dim('y')}/${green('N')}`;
    rl.question(`  ${cyan('?')} ${question} [${hint}]: `, (answer) => {
      const a = answer.trim().toLowerCase();
      if (a === '') resolve(defaultYes);
      else resolve(a === 'y' || a === 'yes');
    });
  });
}

function select(rl, label, options) {
  // options: [{ value, label, desc }]
  return new Promise((resolve) => {
    console.log(`  ${cyan('?')} ${bold(label)}`);
    options.forEach((opt, i) => {
      console.log(`    ${dim(`${i + 1})`)} ${opt.label}${opt.desc ? ` ${dim('—')} ${dim(opt.desc)}` : ''}`);
    });
    rl.question(`  ${dim('Enter number')}: `, (answer) => {
      const idx = parseInt(answer.trim(), 10) - 1;
      if (idx >= 0 && idx < options.length) {
        resolve(options[idx].value);
      } else {
        console.log(`    ${yellow('⚠')}  Invalid selection. Try again.`);
        return select(rl, label, options).then(resolve);
      }
    });
  });
}

function multiSelect(rl, items) {
  // items: [{ id, name, desc, defaultOn }]
  // Returns array of selected ids via sequential y/n
  return new Promise(async (resolve) => {
    const selected = [];
    for (const item of items) {
      const defaultLabel = item.defaultOn ? 'ON' : 'OFF';
      console.log(`  ${bold(item.name)} ${dim('—')} ${item.desc} ${dim(`(default: ${defaultLabel})`)}`);
      const enabled = await confirm(rl, `Include ${item.name}?`, item.defaultOn);
      if (enabled) selected.push(item.id);
      console.log('');
    }
    resolve(selected);
  });
}

function parseCSV(str) {
  if (!str) return [];
  return str.split(',').map(s => s.trim()).filter(Boolean);
}

module.exports = { createRL, ask, confirm, select, multiSelect, parseCSV };
