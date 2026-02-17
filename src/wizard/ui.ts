// =============================================================================
// Terminal UI Helpers — Colors, Banner, Sections
// Zero dependencies — ANSI escape codes only
// =============================================================================

const ESC = '\x1b[';

// --- Colors ---
const color = (code: string) => (str: string): string => `${ESC}${code}m${str}${ESC}0m`;

export const green   = color('32');
export const red     = color('31');
export const yellow  = color('33');
export const blue    = color('34');
export const cyan    = color('36');
export const magenta = color('35');
export const bold    = color('1');
export const dim     = color('2');
export const reset   = (str: string): string => `${ESC}0m${str}`;

// --- Strip ANSI codes for length calculation ---
export function stripAnsi(str: string): string {
  return str.replace(/\x1b\[[0-9;]*m/g, '');
}

// --- Banner ---
export function banner(): void {
  const art = `
   ${cyan('_____ _               ____           _')} 
  ${cyan('/ ____| |             / ___|  ___   __| |')}
 ${cyan('| |    | | __ ___      | |  _ / _ \\ / _` |')}
 ${cyan('| |    | |/ _` \\ \\ /\\ / / |_| | (_) | (_| |')}
 ${cyan('| |____|  | (_| |\\ V  V /\\____|\\___/ \\__,_|')}
  ${cyan('\\_____|\\_|\\__,_| \\_/\\_/')}
`;
  console.log(art);
  console.log(`  ${dim('Multi-Agent OpenClaw Instance Generator')}`);
  console.log('');
}

// --- Section Headers ---
export function header(title: string): void {
  console.log('');
  console.log(`  ${cyan('┌')}${'─'.repeat(56)}${cyan('┐')}`);
  console.log(`  ${cyan('│')}  ${bold(title)}${' '.repeat(Math.max(0, 54 - stripAnsi(title).length))}${cyan('│')}`);
  console.log(`  ${cyan('└')}${'─'.repeat(56)}${cyan('┘')}`);
  console.log('');
}

export function divider(): void {
  console.log('');
  console.log(`  ${dim('─'.repeat(50))}`);
  console.log('');
}

// --- Summary Box ---
export function box(lines: string[]): void {
  const maxLen = Math.max(...lines.map(l => stripAnsi(l).length), 0);
  const w = maxLen + 4;
  console.log(`  ${green('╔')}${'═'.repeat(w)}${green('╗')}`);
  for (const line of lines) {
    const pad = w - stripAnsi(line).length - 2;
    console.log(`  ${green('║')}  ${line}${' '.repeat(Math.max(pad, 0))}${green('║')}`);
  }
  console.log(`  ${green('╚')}${'═'.repeat(w)}${green('╝')}`);
}

// --- Progress ---
export function check(msg: string): void {
  console.log(`  ${green('✓')} ${msg}`);
}

export function warn(msg: string): void {
  console.log(`  ${yellow('⚠')} ${msg}`);
}

export function fail(msg: string): void {
  console.log(`  ${red('✗')} ${msg}`);
}
