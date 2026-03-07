// ─── Workflow Automation Types ───────────────────────────────────────────────

export type WorkflowStatus = 'draft' | 'active' | 'paused' | 'archived';
export type RunStatus = 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
export type StepStatus = 'pending' | 'running' | 'completed' | 'failed' | 'skipped';
export type ScheduleType = 'manual' | 'cron' | 'interval';

export interface WorkflowStep {
    id: string;
    title: string;
    agentId: string;
    description?: string;
    dependsOn: string[];      // Step IDs that must complete first
    config?: Record<string, unknown>;
    timeoutMs?: number;
}

export interface ScheduleConfig {
    type: ScheduleType;
    cronExpr?: string;         // e.g., '0 9 * * 1-5' (weekdays at 9am)
    intervalMs?: number;       // e.g., 3600000 (every hour)
}

export interface Workflow {
    id: string;
    name: string;
    description?: string;
    steps: WorkflowStep[];
    schedule?: ScheduleConfig;
    status: WorkflowStatus;
    lastRunAt?: number;
    createdAt: number;
    updatedAt: number;
}

export interface StepResult {
    stepId: string;
    status: StepStatus;
    output?: string;
    error?: string;
    startedAt?: number;
    completedAt?: number;
}

export interface WorkflowRun {
    id: string;
    workflowId: string;
    workflowName?: string;
    status: RunStatus;
    stepResults: StepResult[];
    triggeredBy: 'manual' | 'schedule';
    startedAt: number;
    completedAt?: number;
}

export interface WorkflowTemplate {
    id: string;
    name: string;
    description: string;
    category: string;
    steps: Omit<WorkflowStep, 'id'>[];
}

// ─── Built-in Templates ─────────────────────────────────────────────────────

export const WORKFLOW_TEMPLATES: WorkflowTemplate[] = [
    {
        id: 'code-review',
        name: 'Code Review Pipeline',
        description: 'Automated code review: lint → test → review → report',
        category: 'Development',
        steps: [
            { title: 'Run Linter', agentId: '', dependsOn: [], description: 'Run linting checks on the codebase' },
            { title: 'Run Tests', agentId: '', dependsOn: [], description: 'Execute test suite' },
            { title: 'Code Review', agentId: '', dependsOn: ['step-0', 'step-1'], description: 'AI-powered code review' },
            { title: 'Generate Report', agentId: '', dependsOn: ['step-2'], description: 'Compile review report' },
        ],
    },
    {
        id: 'deploy',
        name: 'Deploy Pipeline',
        description: 'Build → test → stage → deploy with approval gates',
        category: 'DevOps',
        steps: [
            { title: 'Build', agentId: '', dependsOn: [], description: 'Build production artifacts' },
            { title: 'Test', agentId: '', dependsOn: ['step-0'], description: 'Run integration tests' },
            { title: 'Stage', agentId: '', dependsOn: ['step-1'], description: 'Deploy to staging' },
            { title: 'Deploy', agentId: '', dependsOn: ['step-2'], description: 'Deploy to production' },
        ],
    },
    {
        id: 'research',
        name: 'Research Pipeline',
        description: 'Gather → analyze → summarize → present findings',
        category: 'Research',
        steps: [
            { title: 'Gather Sources', agentId: '', dependsOn: [], description: 'Collect information from multiple sources' },
            { title: 'Analyze Data', agentId: '', dependsOn: ['step-0'], description: 'Process and analyze collected data' },
            { title: 'Summarize', agentId: '', dependsOn: ['step-1'], description: 'Create summary of findings' },
            { title: 'Present', agentId: '', dependsOn: ['step-2'], description: 'Format final presentation' },
        ],
    },
];
