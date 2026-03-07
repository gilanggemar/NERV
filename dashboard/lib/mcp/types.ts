// ─── MCP (Model Context Protocol) Types ──────────────────────────────────────

export type MCPServerStatus = 'connected' | 'disconnected' | 'error' | 'testing';
export type MCPTransport = 'stdio' | 'sse' | 'http';

export interface MCPServer {
    id: string;
    name: string;
    url: string;
    transport: MCPTransport;
    status: MCPServerStatus;
    description?: string;
    apiKey?: string;
    tools: MCPTool[];
    assignedAgents: string[];     // agent IDs
    lastConnectedAt?: number;
    createdAt: number;
    updatedAt: number;
}

export interface MCPTool {
    name: string;
    description?: string;
    inputSchema?: Record<string, unknown>;
}

export interface MCPToolExecution {
    toolName: string;
    serverId: string;
    agentId: string;
    input: Record<string, unknown>;
    output?: unknown;
    status: 'running' | 'completed' | 'failed';
    startedAt: number;
    completedAt?: number;
    error?: string;
}

export const PRESET_SERVERS: { name: string; url: string; transport: MCPTransport; description: string }[] = [
    { name: 'Filesystem', url: 'npx -y @modelcontextprotocol/server-filesystem', transport: 'stdio', description: 'Read/write local files and directories' },
    { name: 'GitHub', url: 'npx -y @modelcontextprotocol/server-github', transport: 'stdio', description: 'GitHub API: repos, issues, PRs, actions' },
    { name: 'SQLite', url: 'npx -y @modelcontextprotocol/server-sqlite', transport: 'stdio', description: 'Query and manage SQLite databases' },
    { name: 'Web Fetch', url: 'npx -y @modelcontextprotocol/server-fetch', transport: 'stdio', description: 'Fetch and parse web pages' },
    { name: 'Memory', url: 'npx -y @modelcontextprotocol/server-memory', transport: 'stdio', description: 'Persistent key-value memory store' },
    { name: 'Brave Search', url: 'npx -y @modelcontextprotocol/server-brave-search', transport: 'stdio', description: 'Web search via Brave Search API' },
];
