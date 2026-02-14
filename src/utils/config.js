// =============================================================================
// Config Generation Logic
// =============================================================================

const AGENT_DEFINITIONS = [
  { id: 'executive',  name: 'Executive',       desc: 'Orchestrator — delegation, decision-making, synthesis',     defaultOn: true },
  { id: 'researcher', name: 'Researcher',      desc: 'Market analysis, competitive intel, sourcing, fact-checking', defaultOn: true },
  { id: 'developer',  name: 'Developer',       desc: 'Code, technical implementation, debugging, architecture',   defaultOn: true },
  { id: 'copywriter', name: 'Copywriter',      desc: 'Content, brand voice, social copy, design briefs',          defaultOn: true },
  { id: 'pm',         name: 'Project Manager', desc: 'PRDs, roadmaps, sprint planning, stakeholder updates',      defaultOn: false },
  { id: 'qa',         name: 'QA Engineer',     desc: 'Testing, validation, quality gates, edge cases',            defaultOn: false },
];

const AGENT_FILES = ['AGENTS.md', 'SOUL.md', 'USER.md', 'IDENTITY.md', 'TOOLS.md', 'HEARTBEAT.md', 'WORKFLOW.md'];

function buildVars(company) {
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

function replacePlaceholders(content, vars) {
  let result = content;
  for (const [key, value] of Object.entries(vars)) {
    result = result.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), value);
  }
  return result;
}

function loadProfile(profilePath) {
  const fs = require('fs');
  const path = require('path');
  const raw = fs.readFileSync(path.resolve(profilePath), 'utf-8');
  const data = JSON.parse(raw);
  if (data.company && typeof data.company === 'object') {
    return data;
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
    agents: data.agents || ['executive', 'researcher', 'developer', 'copywriter'],
  };
}

module.exports = { AGENT_DEFINITIONS, AGENT_FILES, buildVars, replacePlaceholders, loadProfile };
