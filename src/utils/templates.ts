// =============================================================================
// Template Loading + File Generation
// =============================================================================

import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { AGENT_DEFINITIONS, AGENT_FILES, buildVars, replacePlaceholders } from './config';
import { check, warn } from '../wizard/ui';
import type { CompanyProfile, CronSchedule, GenerateOptions, OpenClawConfig, OpenClawAgent, ProfileData, TemplateVars } from '../types';

export function getTemplateDir(): string {
  return path.resolve(__dirname, '..', '..', 'templates');
}

/**
 * Generate an OpenClaw instance.
 */
export function generate(company: CompanyProfile, agents: string[], outputDir: string, opts: GenerateOptions = {}, profileData?: ProfileData): { agentCount: number } {
  const mode = opts.mode || 'overwrite';
  const templateDir = getTemplateDir();
  const vars = buildVars(company);
  const workspacesDir = path.join(outputDir, 'workspaces');

  fs.mkdirSync(outputDir, { recursive: true });

  // --- Generate openclaw.json ---
  const configTemplate: OpenClawConfig = JSON.parse(fs.readFileSync(path.join(templateDir, 'openclaw.json.template'), 'utf-8'));

  // Filter template to selected agents
  const newAgents = configTemplate.agents.filter(a => agents.includes(a.id));
  const newAccounts: Record<string, unknown> = {};
  for (const [key, val] of Object.entries(configTemplate.channels?.telegram?.accounts || {})) {
    const agentId = key.replace('tg-', '');
    if (agents.includes(agentId)) newAccounts[key] = val;
  }

  // Set absolute workspace paths
  for (const agent of newAgents) {
    agent.workspace = path.join(outputDir, 'workspaces', agent.id);
  }

  const configPath = path.join(outputDir, 'openclaw.json');

  if (mode === 'merge' && fs.existsSync(configPath)) {
    // Merge into existing config
    const existing: OpenClawConfig = JSON.parse(fs.readFileSync(configPath, 'utf-8'));

    let addedCount = 0;
    for (const agent of newAgents) {
      if (!existing.agents.find(a => a.id === agent.id)) {
        existing.agents.push(agent);
        addedCount++;
      }
    }

    if (!existing.channels) existing.channels = {};
    if (!existing.channels.telegram) existing.channels.telegram = { accounts: {} };
    if (!existing.channels.telegram.accounts) existing.channels.telegram.accounts = {};
    for (const [key, val] of Object.entries(newAccounts)) {
      if (!existing.channels.telegram.accounts[key]) {
        existing.channels.telegram.accounts[key] = val;
      }
    }

    fs.writeFileSync(configPath, JSON.stringify(existing, null, 2) + '\n', 'utf-8');
    check(`openclaw.json (merged ${addedCount} new agent(s))`);
  } else {
    // Apply per-agent model overrides from profile
    const agentModels = profileData?.agentModels || {};
    for (const agent of newAgents) {
      if (agentModels[agent.id]) {
        (agent as any).model = agentModels[agent.id];
      }
    }

    // Fresh write
    const newConfig: OpenClawConfig = {
      ...configTemplate,
      agents: newAgents,
      channels: {
        ...configTemplate.channels,
        telegram: {
          ...configTemplate.channels?.telegram,
          accounts: newAccounts,
        },
      },
      meta: {
        company: company.name,
        domain: company.domain,
        generatedAt: new Date().toISOString(),
      },
    };

    // Enable cron if profile has a schedule
    if (profileData?.cronSchedule) {
      (newConfig as any).cron = { enabled: true, maxConcurrentRuns: 2 };
    }

    fs.writeFileSync(configPath, JSON.stringify(newConfig, null, 2) + '\n', 'utf-8');
    check('openclaw.json');
  }

  // --- Generate agent workspaces ---
  for (const agentId of agents) {
    const agentTemplateDir = path.join(templateDir, 'agents', agentId);
    const agentOutputDir = path.join(workspacesDir, agentId);
    const memoryDir = path.join(agentOutputDir, 'memory');

    // In merge mode, skip existing workspaces
    if (mode === 'merge' && fs.existsSync(agentOutputDir)) {
      continue;
    }

    fs.mkdirSync(agentOutputDir, { recursive: true });
    fs.mkdirSync(memoryDir, { recursive: true });
    fs.writeFileSync(path.join(memoryDir, '.gitkeep'), '', 'utf-8');

    let fileCount = 0;
    for (const file of AGENT_FILES) {
      const srcPath = path.join(agentTemplateDir, file);
      if (!fs.existsSync(srcPath)) {
        if (file === 'WORKFLOW.md') continue;
        warn(`Template missing: ${agentId}/${file}`);
        continue;
      }
      const content = fs.readFileSync(srcPath, 'utf-8');
      fs.writeFileSync(path.join(agentOutputDir, file), replacePlaceholders(content, vars), 'utf-8');
      fileCount++;
    }

    // Shared WORKFLOW.md
    const sharedWorkflow = path.join(templateDir, 'WORKFLOW.md');
    if (fs.existsSync(sharedWorkflow)) {
      const content = fs.readFileSync(sharedWorkflow, 'utf-8');
      fs.writeFileSync(path.join(agentOutputDir, 'BOARD-WORKFLOW.md'), replacePlaceholders(content, vars), 'utf-8');
      fileCount++;
    }

    // BOOT.md if exists
    const bootSrc = path.join(agentTemplateDir, 'BOOT.md');
    if (fs.existsSync(bootSrc)) {
      const content = fs.readFileSync(bootSrc, 'utf-8');
      fs.writeFileSync(path.join(agentOutputDir, 'BOOT.md'), replacePlaceholders(content, vars), 'utf-8');
      fileCount++;
    }

    check(`workspaces/${agentId}/ (${fileCount} files + memory/)`);
  }

  // --- Generate shared/ directory structure ---
  const sharedDir = path.join(outputDir, 'shared');
  const sharedDirs = [
    path.join(sharedDir, 'tasks', 'content'),
    path.join(sharedDir, 'tasks', 'engineering'),
    path.join(sharedDir, 'tasks', 'growth'),
    path.join(sharedDir, 'tasks', 'operations'),
    path.join(sharedDir, 'events'),
    path.join(sharedDir, 'knowledge'),
    path.join(sharedDir, 'config'),
  ];
  for (const d of sharedDirs) {
    fs.mkdirSync(d, { recursive: true });
    const gitkeep = path.join(d, '.gitkeep');
    if (!fs.existsSync(gitkeep)) {
      fs.writeFileSync(gitkeep, '', 'utf-8');
    }
  }

  // Copy coordination configs to shared/config/
  const coordinationDir = path.join(templateDir, 'coordination');
  const coordFiles = ['departments.json', 'workflow-rules.json'];
  for (const file of coordFiles) {
    const srcPath = path.join(coordinationDir, file);
    if (fs.existsSync(srcPath)) {
      const content = fs.readFileSync(srcPath, 'utf-8');
      fs.writeFileSync(path.join(sharedDir, 'config', file), replacePlaceholders(content, vars), 'utf-8');
    }
  }

  // Copy task-schema.json as reference
  const taskSchemaPath = path.join(coordinationDir, 'task-schema.json');
  if (fs.existsSync(taskSchemaPath)) {
    fs.copyFileSync(taskSchemaPath, path.join(sharedDir, 'config', 'task-schema.json'));
  }

  // Copy shared template files (VOICE.md, COMPANY-FACTS.md, etc.)
  const sharedTemplateDir = path.join(templateDir, 'shared');
  if (fs.existsSync(sharedTemplateDir)) {
    const sharedFiles = fs.readdirSync(sharedTemplateDir).filter(f => f.endsWith('.md'));
    for (const file of sharedFiles) {
      const content = fs.readFileSync(path.join(sharedTemplateDir, file), 'utf-8');
      fs.writeFileSync(path.join(sharedDir, file), replacePlaceholders(content, vars), 'utf-8');
    }
  }

  // Create profile-specific shared directories based on which agents are selected
  const profileSharedDirs: string[] = [];

  // Growth / content directories
  if (agents.includes('growth-engine') || agents.includes('content-creator') || agents.includes('distribution-manager')) {
    profileSharedDirs.push(
      path.join(sharedDir, 'content', 'drafts', 'linkedin'),
      path.join(sharedDir, 'content', 'drafts', 'x'),
      path.join(sharedDir, 'content', 'drafts', 'instagram'),
      path.join(sharedDir, 'content', 'drafts', 'email'),
      path.join(sharedDir, 'content', 'published'),
      path.join(sharedDir, 'growth', 'campaigns'),
      path.join(sharedDir, 'growth', 'reports'),
    );
  }

  // Intel directories
  if (agents.includes('intel-engine') || agents.includes('researcher')) {
    profileSharedDirs.push(
      path.join(sharedDir, 'intel', 'reports'),
      path.join(sharedDir, 'intel', 'databases'),
      path.join(sharedDir, 'pipeline'),
    );
  }

  // PR directories
  if (agents.includes('pr-engine')) {
    profileSharedDirs.push(
      path.join(sharedDir, 'pr', 'databases'),
      path.join(sharedDir, 'pr', 'tracking'),
      path.join(sharedDir, 'pr', 'drafts'),
      path.join(sharedDir, 'pr', 'haro-responses'),
      path.join(sharedDir, 'pr', 'reports'),
    );
  }

  // Research directories
  if (agents.includes('researcher')) {
    profileSharedDirs.push(
      path.join(sharedDir, 'research', 'reports'),
      path.join(sharedDir, 'research', 'spikes'),
    );
  }

  // Engineering / architecture directories
  if (agents.includes('architect') || agents.includes('developer')) {
    profileSharedDirs.push(
      path.join(sharedDir, 'prd'),
      path.join(sharedDir, 'architecture', 'designs'),
      path.join(sharedDir, 'architecture', 'reviews'),
      path.join(sharedDir, 'architecture', 'spikes'),
      path.join(sharedDir, 'architecture', 'adrs'),
      path.join(sharedDir, 'code', 'reviews'),
      path.join(sharedDir, 'sprints'),
    );
  }

  // QA / testing directories
  if (agents.includes('qa')) {
    profileSharedDirs.push(
      path.join(sharedDir, 'testing', 'plans'),
      path.join(sharedDir, 'testing', 'results'),
      path.join(sharedDir, 'testing', 'reports'),
    );
  }
  for (const d of profileSharedDirs) {
    fs.mkdirSync(d, { recursive: true });
    const gitkeep = path.join(d, '.gitkeep');
    if (!fs.existsSync(gitkeep)) {
      fs.writeFileSync(gitkeep, '', 'utf-8');
    }
  }

  check('shared/ (tasks, events, knowledge, config)');

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
  check('company-profile.json');

  // Copy company profile to shared/knowledge/
  const knowledgeProfilePath = path.join(sharedDir, 'knowledge', 'company-profile.json');
  fs.writeFileSync(knowledgeProfilePath, JSON.stringify(profile, null, 2) + '\n', 'utf-8');

  // --- Generate cron setup script ---
  if (profileData?.cronSchedule) {
    const cronScript = generateCronSetupScript(profileData.cronSchedule, agents);
    const scriptsDir = path.join(outputDir, 'scripts');
    fs.mkdirSync(scriptsDir, { recursive: true });
    const scriptPath = path.join(scriptsDir, 'setup-cron.sh');
    fs.writeFileSync(scriptPath, cronScript, { mode: 0o755 });
    check('scripts/setup-cron.sh (cron job installer)');
  }

  return { agentCount: agents.length };
}

/**
 * Convert a time string like "06:00" and optional day to a cron expression.
 */
function timeToCron(time: string, day?: string): string {
  const [hour, minute] = time.split(':').map(Number);
  const dayMap: Record<string, number> = {
    sunday: 0, monday: 1, tuesday: 2, wednesday: 3,
    thursday: 4, friday: 5, saturday: 6,
  };
  if (day) {
    const dow = dayMap[day.toLowerCase()];
    return `${minute} ${hour} * * ${dow}`;
  }
  return `${minute} ${hour} * * *`;
}

/**
 * Generate a shell script that registers all cron jobs via `openclaw cron add`.
 */
function generateCronSetupScript(schedule: CronSchedule, agents: string[]): string {
  const tz = schedule.timezone || 'America/New_York';
  const lines: string[] = [
    '#!/usr/bin/env bash',
    '#',
    '# setup-cron.sh — Register all scheduled cron jobs with OpenClaw',
    '#',
    '# Generated by ClawGod. Run once after first gateway start.',
    '# Re-running is safe — job names are unique, duplicates will error harmlessly.',
    '#',
    '# Usage: ./scripts/setup-cron.sh',
    '#',
    '',
    'set -e',
    '',
    'echo "Registering cron jobs..."',
    'echo ""',
    '',
  ];

  let jobCount = 0;

  // Daily jobs
  for (const job of schedule.daily) {
    if (!agents.includes(job.agent)) continue;
    const cronExpr = timeToCron(job.time);
    const name = `daily-${job.agent}-${job.time.replace(':', '')}`;
    const escapedMsg = job.task.replace(/'/g, "'\\''");
    lines.push(`# ${job.time} — ${job.agent}`);
    lines.push(`openclaw cron add \\`);
    lines.push(`  --name "${name}" \\`);
    lines.push(`  --cron "${cronExpr}" \\`);
    lines.push(`  --tz "${tz}" \\`);
    lines.push(`  --session isolated \\`);
    lines.push(`  --agent ${job.agent} \\`);
    lines.push(`  --message '${escapedMsg}' \\`);
    lines.push(`  --announce \\`);
    lines.push(`  --wake next-heartbeat`);
    lines.push(`echo "  ✓ ${name}"`);
    lines.push('');
    jobCount++;
  }

  // Weekly jobs
  for (const job of schedule.weekly) {
    if (!agents.includes(job.agent)) continue;
    const cronExpr = timeToCron(job.time, job.day);
    const dayLabel = job.day ? job.day.charAt(0).toUpperCase() + job.day.slice(1) : '';
    const name = `weekly-${job.agent}-${dayLabel.toLowerCase()}-${job.time.replace(':', '')}`;
    const escapedMsg = job.task.replace(/'/g, "'\\''");
    lines.push(`# ${dayLabel} ${job.time} — ${job.agent}`);
    lines.push(`openclaw cron add \\`);
    lines.push(`  --name "${name}" \\`);
    lines.push(`  --cron "${cronExpr}" \\`);
    lines.push(`  --tz "${tz}" \\`);
    lines.push(`  --session isolated \\`);
    lines.push(`  --agent ${job.agent} \\`);
    lines.push(`  --message '${escapedMsg}' \\`);
    lines.push(`  --announce \\`);
    lines.push(`  --wake next-heartbeat`);
    lines.push(`echo "  ✓ ${name}"`);
    lines.push('');
    jobCount++;
  }

  lines.push(`echo ""`);
  lines.push(`echo "Done. ${jobCount} cron jobs registered."`);
  lines.push(`echo "Run 'openclaw cron list' to verify."`);
  lines.push('');

  return lines.join('\n');
}

export function generateSingleAgent(agentId: string, outputDir: string): void {
  const templateDir = getTemplateDir();
  const agentTemplateDir = path.join(templateDir, 'agents', agentId);

  if (!fs.existsSync(agentTemplateDir)) {
    throw new Error(`No template found for agent type: ${agentId}`);
  }

  // Read existing config to get company info for vars
  const configPath = path.join(outputDir, 'openclaw.json');
  const profilePath = path.join(outputDir, 'company-profile.json');
  let vars: TemplateVars = { GENERATED_AT: new Date().toISOString() };

  if (fs.existsSync(profilePath)) {
    const profile = JSON.parse(fs.readFileSync(profilePath, 'utf-8'));
    if (profile.company) vars = buildVars(profile.company);
  }

  const agentOutputDir = path.join(outputDir, 'workspaces', agentId);
  const memoryDir = path.join(agentOutputDir, 'memory');

  fs.mkdirSync(agentOutputDir, { recursive: true });
  fs.mkdirSync(memoryDir, { recursive: true });
  fs.writeFileSync(path.join(memoryDir, '.gitkeep'), '', 'utf-8');

  for (const file of AGENT_FILES) {
    const srcPath = path.join(agentTemplateDir, file);
    if (!fs.existsSync(srcPath)) {
      if (file === 'WORKFLOW.md') continue;
      continue;
    }
    const content = fs.readFileSync(srcPath, 'utf-8');
    fs.writeFileSync(path.join(agentOutputDir, file), replacePlaceholders(content, vars), 'utf-8');
  }

  const sharedWorkflow = path.join(templateDir, 'WORKFLOW.md');
  if (fs.existsSync(sharedWorkflow)) {
    const content = fs.readFileSync(sharedWorkflow, 'utf-8');
    fs.writeFileSync(path.join(agentOutputDir, 'BOARD-WORKFLOW.md'), replacePlaceholders(content, vars), 'utf-8');
  }

  const bootSrc = path.join(agentTemplateDir, 'BOOT.md');
  if (fs.existsSync(bootSrc)) {
    const content = fs.readFileSync(bootSrc, 'utf-8');
    fs.writeFileSync(path.join(agentOutputDir, 'BOOT.md'), replacePlaceholders(content, vars), 'utf-8');
  }

  // Update openclaw.json if it exists
  if (fs.existsSync(configPath)) {
    const config: OpenClawConfig = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
    const configTemplateRaw: OpenClawConfig = JSON.parse(fs.readFileSync(path.join(templateDir, 'openclaw.json.template'), 'utf-8'));

    // Add agent definition if not present
    if (!config.agents.find(a => a.id === agentId)) {
      const templateAgent = configTemplateRaw.agents.find(a => a.id === agentId);
      if (templateAgent) {
        templateAgent.workspace = path.join(outputDir, 'workspaces', agentId);
        config.agents.push(templateAgent);
      }
    }

    // Add telegram account if not present
    const tgKey = `tg-${agentId}`;
    if (!config.channels?.telegram?.accounts?.[tgKey]) {
      const templateAccount = configTemplateRaw.channels?.telegram?.accounts?.[tgKey];
      if (templateAccount) {
        if (!config.channels) config.channels = {};
        if (!config.channels.telegram) config.channels.telegram = { accounts: {} };
        if (!config.channels.telegram.accounts) config.channels.telegram.accounts = {};
        config.channels.telegram.accounts[tgKey] = templateAccount;
      }
    }

    fs.writeFileSync(configPath, JSON.stringify(config, null, 2) + '\n', 'utf-8');
  }
}
