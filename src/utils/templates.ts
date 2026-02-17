// =============================================================================
// Template Loading + File Generation
// =============================================================================

import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { AGENT_DEFINITIONS, AGENT_FILES, buildVars, replacePlaceholders } from './config';
import { check, warn } from '../wizard/ui';
import type { CompanyProfile, GenerateOptions, OpenClawConfig, OpenClawAgent, TemplateVars } from '../types';

export function getTemplateDir(): string {
  return path.resolve(__dirname, '..', '..', 'templates');
}

/**
 * Generate an OpenClaw instance.
 */
export function generate(company: CompanyProfile, agents: string[], outputDir: string, opts: GenerateOptions = {}): { agentCount: number } {
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

  return { agentCount: agents.length };
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
