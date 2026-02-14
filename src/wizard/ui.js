// =============================================================================
// Terminal UI Helpers — Colors, Banner, Sections
// Zero dependencies — ANSI escape codes only
// =============================================================================

const ESC = '\x1b[';

// --- Colors ---
const color = (code) => (str) => `${ESC}${code}m${str}${ESC}0m`;

const green   = color('32');
const red     = color('31');
const yellow  = color('33');
const blue    = color('34');
const cyan    = color('36');
const magenta = color('35');
const bold    = color('1');
const dim     = color('2');
const reset   = (str) => `${ESC}0m${str}`;

// --- Banner ---
function banner() {
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
function header(title) {
  console.log('');
  console.log(`  ${cyan('┌')}${'─'.repeat(56)}${cyan('┐')}`);
  console.log(`  ${cyan('│')}  ${bold(title)}${' '.repeat(Math.max(0, 54 - stripAnsi(title).length))}${cyan('│')}`);
  console.log(`  ${cyan('└')}${'─'.repeat(56)}${cyan('┘')}`);
  console.log('');
}

function divider() {
  console.log('');
  console.log(`  ${dim('─'.repeat(50))}`);
  console.log('');
}

// --- Summary Box ---
function box(lines) {
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
function check(msg) {
  console.log(`  ${green('✓')} ${msg}`);
}

function warn(msg) {
  console.log(`  ${yellow('⚠')} ${msg}`);
}

function fail(msg) {
  console.log(`  ${red('✗')} ${msg}`);
}

// --- Strip ANSI codes for length calculation ---
function stripAnsi(str) {
  return str.replace(/\x1b\[[0-9;]*m/g, '');
}

module.exports = {
  green, red, yellow, blue, cyan, magenta, bold, dim, reset,
  banner, header, divider, box, check, warn, fail, stripAnsi,
};
