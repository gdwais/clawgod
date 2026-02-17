// =============================================================================
// Reusable Prompt Helpers — readline-based, zero dependencies
// =============================================================================

import * as readline from 'readline';
import { cyan, dim, yellow, green, bold } from './ui';
import type { SelectOption, AgentDefinition, AskOptions } from '../types';

export function createRL(): readline.Interface {
  return readline.createInterface({ input: process.stdin, output: process.stdout });
}

export function ask(rl: readline.Interface, label: string, defaultVal: string, opts: AskOptions = {}): Promise<string> {
  return new Promise((resolve) => {
    const defHint = defaultVal !== undefined && defaultVal !== '' ? ` ${dim(`[${defaultVal}`)}${dim(']')}` : '';
    const reqTag = opts.required ? ` ${yellow('*')}` : '';
    rl.question(`  ${cyan('?')} ${label}${reqTag}${defHint}: `, (answer: string) => {
      const trimmed = answer.trim();
      if (opts.required && !trimmed && !defaultVal) {
        console.log(`    ${yellow('⚠')}  This field is required.`);
        return ask(rl, label, defaultVal, opts).then(resolve);
      }
      resolve(trimmed || (defaultVal !== undefined ? String(defaultVal) : ''));
    });
  });
}

export function confirm(rl: readline.Interface, question: string, defaultYes: boolean = true): Promise<boolean> {
  return new Promise((resolve) => {
    const hint = defaultYes ? `${green('Y')}/${dim('n')}` : `${dim('y')}/${green('N')}`;
    rl.question(`  ${cyan('?')} ${question} [${hint}]: `, (answer: string) => {
      const a = answer.trim().toLowerCase();
      if (a === '') resolve(defaultYes);
      else resolve(a === 'y' || a === 'yes');
    });
  });
}

export function select(rl: readline.Interface, label: string, options: SelectOption[]): Promise<string> {
  // options: [{ value, label, desc }]
  return new Promise((resolve) => {
    console.log(`  ${cyan('?')} ${bold(label)}`);
    options.forEach((opt, i) => {
      console.log(`    ${dim(`${i + 1})`)} ${opt.label}${opt.desc ? ` ${dim('—')} ${dim(opt.desc)}` : ''}`);
    });
    rl.question(`  ${dim('Enter number')}: `, (answer: string) => {
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

export function multiSelect(rl: readline.Interface, items: AgentDefinition[]): Promise<string[]> {
  // items: [{ id, name, desc, defaultOn }]
  // Returns array of selected ids via sequential y/n
  return new Promise(async (resolve) => {
    const selected: string[] = [];
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

export function parseCSV(str: string): string[] {
  if (!str) return [];
  return str.split(',').map(s => s.trim()).filter(Boolean);
}
