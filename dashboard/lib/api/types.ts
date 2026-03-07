// ─── API Types ───────────────────────────────────────────────────────────────

export interface ApiKey {
    id: string;
    name: string;
    key: string;          // hashed, prefix shown only
    prefix: string;       // first 8 chars for display
    permissions: ApiPermission[];
    lastUsedAt?: number;
    createdAt: number;
    expiresAt?: number;
}

export type ApiPermission = 'read' | 'write' | 'admin';

export interface ApiEndpoint {
    method: 'GET' | 'POST' | 'PUT' | 'DELETE';
    path: string;
    description: string;
    auth: boolean;
    params?: { name: string; type: string; required: boolean; description: string }[];
    response: string;
}

export const API_ENDPOINTS: ApiEndpoint[] = [
    // Status
    { method: 'GET', path: '/api/v1/status', description: 'System health and agent status overview', auth: true, response: '{ agents: Agent[], uptime: number, version: string }' },
    // Agents
    { method: 'GET', path: '/api/v1/agents', description: 'List all agents with current status', auth: true, response: '{ agents: Agent[] }' },
    { method: 'GET', path: '/api/v1/agents/:id', description: 'Get agent details', auth: true, params: [{ name: 'id', type: 'string', required: true, description: 'Agent ID' }], response: '{ agent: Agent }' },
    // Tasks
    { method: 'GET', path: '/api/v1/tasks', description: 'List all tasks (filterable by agent)', auth: true, params: [{ name: 'agentId', type: 'string', required: false, description: 'Filter by agent' }], response: '{ tasks: Task[] }' },
    { method: 'POST', path: '/api/v1/tasks', description: 'Create a new task', auth: true, params: [{ name: 'agentId', type: 'string', required: true, description: 'Assigned agent' }, { name: 'description', type: 'string', required: true, description: 'Task description' }], response: '{ task: Task }' },
    // Workflows
    { method: 'GET', path: '/api/v1/workflows', description: 'List all workflows', auth: true, response: '{ workflows: Workflow[] }' },
    { method: 'POST', path: '/api/v1/workflows/:id/run', description: 'Trigger a workflow run', auth: true, params: [{ name: 'id', type: 'string', required: true, description: 'Workflow ID' }], response: '{ runId: string }' },
    // Notifications
    { method: 'GET', path: '/api/v1/notifications', description: 'Get notifications', auth: true, response: '{ notifications: Notification[], unreadCount: number }' },
    // Schedules
    { method: 'GET', path: '/api/v1/schedules', description: 'List scheduled tasks', auth: true, response: '{ schedules: ScheduledTask[] }' },
    { method: 'POST', path: '/api/v1/schedules', description: 'Create a scheduled task', auth: true, params: [{ name: 'agentId', type: 'string', required: true, description: 'Agent ID' }, { name: 'cronExpression', type: 'string', required: true, description: 'Cron expression' }, { name: 'description', type: 'string', required: true, description: 'Task description' }], response: '{ id: string }' },
];
