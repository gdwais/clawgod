// =============================================================================
// Config Generation Logic
// =============================================================================

import * as fs from 'fs';
import * as path from 'path';
import type { AgentDefinition, CompanyProfile, ProfileData, TemplateVars } from '../types';

export const AGENT_DEFINITIONS: AgentDefinition[] = [
  { id: 'executive',            name: 'Executive',            desc: 'Orchestrator — delegation, decision-making, synthesis',                       defaultOn: true,  department: ['operations'] },
  { id: 'researcher',           name: 'Researcher',           desc: 'Market analysis, competitive intel, sourcing, fact-checking',                 defaultOn: true,  department: ['content', 'growth'] },
  { id: 'developer',            name: 'Developer',            desc: 'Code, technical implementation, debugging, architecture',                     defaultOn: true,  department: ['engineering'] },
  { id: 'content-creator',      name: 'Content Creator',      desc: 'Blog posts, articles, email sequences, whitepapers, scripts, ad copy',       defaultOn: true,  department: ['content'] },
  { id: 'brand-manager',        name: 'Brand Manager',        desc: 'Brand governance, voice consistency, content review',                         defaultOn: false, department: ['content'] },
  { id: 'distribution-manager', name: 'Distribution Manager', desc: 'Multi-channel distribution — social, email, community, forums',              defaultOn: false, department: ['content', 'growth'] },
  { id: 'ops-manager',          name: 'Ops Manager',          desc: 'Board hygiene, sprint management, task tracking, status reports',             defaultOn: false, department: ['engineering', 'operations'] },
  { id: 'qa',                   name: 'QA Engineer',          desc: 'Testing, validation, quality gates, edge cases',                              defaultOn: false, department: ['engineering'] },
  { id: 'data-analyst',         name: 'Data Analyst',         desc: 'KPIs, campaign measurement, performance reports, feedback loop',              defaultOn: false, department: ['growth'] },
  { id: 'seo-specialist',       name: 'SEO Specialist',       desc: 'Keyword research, content optimization, technical SEO, SERP tracking',       defaultOn: false, department: ['content'] },
  { id: 'customer-success',     name: 'Customer Success',     desc: 'Support triage, FAQ maintenance, onboarding docs, feedback collection',      defaultOn: false, department: ['operations'] },
];

export const AGENT_FILES: string[] = ['AGENTS.md', 'SOUL.md', 'USER.md', 'IDENTITY.md', 'TOOLS.md', 'HEARTBEAT.md', 'WORKFLOW.md'];

export function buildVars(company: CompanyProfile): TemplateVars {
  return {
    COMPANY_NAME:     company.name || '',
    DOMAIN_INFO:      company.domain || '',
    TARGET_AUDIENCE:  company.targetAudience || '',
    COMPETITORS:      Array.isArray(company.competitors) ? company.competitors.join(', ') : (company.competitors || ''),
    BRAND_VOICE:      company.brandVoice || '',
    CONTENT_CHANNELS: Array.isArray(company.contentChannels) ? company.contentChannels.join(', ') : (company.contentChannels || ''),
    TECH_STACK:       Array.isArray(company.techStack) ? company.techStack.join(', ') : (company.techStack || ''),
    PRODUCTS_SERVICES: company.products || '',
    POSITIONING:      company.positioning || '',
    COMPANY_STAGE:    company.stage || '',
    TEAM_SIZE:        company.teamSize || '',
    GENERATED_AT:     new Date().toISOString(),
  };
}

export function replacePlaceholders(content: string, vars: TemplateVars): string {
  let result = content;
  for (const [key, value] of Object.entries(vars)) {
    result = result.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), value);
  }
  return result;
}

export function loadProfile(profilePath: string): ProfileData {
  const raw = fs.readFileSync(path.resolve(profilePath), 'utf-8');
  const data = JSON.parse(raw);
  if (data.company && typeof data.company === 'object') {
    return data as ProfileData;
  }
  return {
    company: {
      name: data.company || data.name || '',
      domain: data.domain || '',
      targetAudience: data.targetAudience || '',
      products: data.products || '',
      stage: data.stage || 'growth',
      teamSize: data.teamSize || '',
      competitors: data.competitors || [],
      brandVoice: data.brandVoice || '',
      contentChannels: data.contentChannels || [],
      techStack: data.techStack || [],
      positioning: data.positioning || '',
    },
    agents: data.agents || ['executive', 'researcher', 'developer', 'content-creator'],
  };
}
