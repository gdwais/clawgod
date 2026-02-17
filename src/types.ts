// =============================================================================
// Shared Types
// =============================================================================

export interface CompanyProfile {
  name: string;
  domain: string;
  targetAudience?: string;
  products?: string;
  stage?: string;
  teamSize?: string;
  competitors?: string[];
  brandVoice?: string;
  contentChannels?: string[];
  techStack?: string[];
  positioning?: string;
}

export interface AgentDefinition {
  id: string;
  name: string;
  desc: string;
  defaultOn: boolean;
  department?: string[];
}

export interface ProfileData {
  company: CompanyProfile;
  agents: string[];
  generatedAt?: string;
}

export interface GenerateOptions {
  mode?: 'overwrite' | 'merge';
}

export interface InitArgs {
  profile: string | null;
  output: string | null;
  nonInteractive: boolean;
}

export interface AddAgentArgs {
  type: string | null;
  dir: string | null;
}

export interface DeployArgs {
  host: string | null;
  user: string | null;
  dir: string;
}

export interface SelectOption {
  value: string;
  label: string;
  desc?: string;
}

export interface TemplateVars {
  [key: string]: string;
}

export interface OpenClawAgent {
  id: string;
  name?: string;
  workspace?: string;
  [key: string]: unknown;
}

export interface OpenClawConfig {
  agents: OpenClawAgent[];
  channels?: {
    telegram?: {
      accounts?: Record<string, unknown>;
    };
  };
  meta?: {
    company?: string;
    domain?: string;
    generatedAt?: string;
  };
  [key: string]: unknown;
}

export interface AskOptions {
  required?: boolean;
}

// =============================================================================
// Coordination System Types
// =============================================================================

export interface AutoTransition {
  from: string;
  to: string;
  assignTo: string;
}

export interface DepartmentConfig {
  name: string;
  notionBoardId: string | null;
  agents: string[];
  statuses: string[];
  reviewGates: string[];
  taskTypes: string[];
  autoTransitions: Record<string, AutoTransition>;
}

export interface DepartmentSettings {
  heartbeatMinutes: number;
  staleTaskHours: number;
  maxReminders: number;
  maxIterations: number;
  eventRetentionDays: number;
}

export interface DepartmentsFile {
  departments: Record<string, DepartmentConfig>;
  settings: DepartmentSettings;
}

export interface TaskContext {
  brief: string;
  references: string[];
  targetChannels: string[];
  audience: string;
}

export interface TaskHistoryEntry {
  timestamp: string;
  agent: string;
  action: string;
  note: string;
}

export interface TaskSchema {
  $schema: string;
  id: string;
  department: string;
  title: string;
  type: string;
  status: string;
  priority: string;
  owner: string | null;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  dueAt: string | null;
  context: TaskContext;
  artifacts: string[];
  history: TaskHistoryEntry[];
  reviewGate: boolean;
  iterationCount: number;
  maxIterations: number;
  crossDeptRef: string | null;
  notionPageId: string | null;
}

export interface EventSchema {
  event: string;
  taskId: string;
  agent: string;
  timestamp: string;
  details: Record<string, unknown>;
}

export interface CrossDepartmentTrigger {
  sourceEvent: string;
  sourceDept: string;
  targetDept: string;
  condition?: string;
  createTask: {
    type: string;
    titleTemplate: string;
    status: string;
    priority: string;
  };
}

export interface WorkflowRules {
  crossDepartmentTriggers: CrossDepartmentTrigger[];
}
