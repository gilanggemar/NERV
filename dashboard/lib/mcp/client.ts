// ─── MCP Client Engine ───────────────────────────────────────────────────────

import { db } from '@/lib/db';
import type { MCPServer, MCPTool, MCPServerStatus, MCPTransport } from './types';

// ─── Server CRUD ─────────────────────────────────────────────────────────────

export async function addMCPServer(
    name: string, url: string, transport: MCPTransport,
    description?: string, apiKey?: string
): Promise<string> {
    const id = crypto.randomUUID();
    await db.from('mcp_servers').insert({
        id, name, url, transport, description: description || null,
        api_key: apiKey || null,
        status: 'disconnected',
        tools: [], // jsonb
        assigned_agents: [], // jsonb
    });
    return id;
}

export async function getMCPServers(): Promise<MCPServer[]> {
    const { data } = await db.from('mcp_servers').select('*').order('created_at', { ascending: false });
    return (data || []).map((row: any) => ({
        ...row,
        status: row.status as MCPServerStatus,
        transport: row.transport as MCPTransport,
        tools: row.tools || [],
        assignedAgents: row.assigned_agents || [],
        description: row.description ?? undefined,
        apiKey: row.api_key ?? undefined,
        lastConnectedAt: row.last_connected_at ?? undefined,
    }));
}

export async function getMCPServer(id: string): Promise<MCPServer | null> {
    const { data: row } = await db.from('mcp_servers').select('*').eq('id', id).single();
    if (!row) return null;
    return {
        ...row,
        status: row.status as MCPServerStatus,
        transport: row.transport as MCPTransport,
        tools: row.tools || [],
        assignedAgents: row.assigned_agents || [],
        description: row.description ?? undefined,
        apiKey: row.api_key ?? undefined,
        lastConnectedAt: row.last_connected_at ?? undefined,
    };
}

export async function updateMCPServer(id: string, updates: Partial<MCPServer>): Promise<void> {
    const set: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (updates.name !== undefined) set.name = updates.name;
    if (updates.url !== undefined) set.url = updates.url;
    if (updates.transport !== undefined) set.transport = updates.transport;
    if (updates.description !== undefined) set.description = updates.description;
    if (updates.apiKey !== undefined) set.api_key = updates.apiKey;
    if (updates.status !== undefined) set.status = updates.status;
    if (updates.tools !== undefined) set.tools = updates.tools; // jsonb
    if (updates.assignedAgents !== undefined) set.assigned_agents = updates.assignedAgents; // jsonb
    if (updates.lastConnectedAt !== undefined) set.last_connected_at = updates.lastConnectedAt;
    await db.from('mcp_servers').update(set).eq('id', id);
}

export async function deleteMCPServer(id: string): Promise<void> {
    await db.from('mcp_servers').delete().eq('id', id);
}

export async function assignAgentToServer(serverId: string, agentId: string): Promise<void> {
    const server = await getMCPServer(serverId);
    if (!server) return;
    const agents = new Set(server.assignedAgents);
    agents.add(agentId);
    await updateMCPServer(serverId, { assignedAgents: Array.from(agents) });
}

export async function unassignAgentFromServer(serverId: string, agentId: string): Promise<void> {
    const server = await getMCPServer(serverId);
    if (!server) return;
    const agents = server.assignedAgents.filter((a: string) => a !== agentId);
    await updateMCPServer(serverId, { assignedAgents: agents });
}

export async function getAgentTools(agentId: string): Promise<{ server: string; tools: MCPTool[] }[]> {
    const servers = await getMCPServers();
    return servers
        .filter((s) => s.assignedAgents.includes(agentId) && s.status === 'connected')
        .map((s) => ({ server: s.name, tools: s.tools }));
}

/**
 * Test connection to an MCP server (simulated).
 */
export async function testConnection(id: string): Promise<{ success: boolean; tools: MCPTool[] }> {
    const server = await getMCPServer(id);
    if (!server) return { success: false, tools: [] };

    const simulatedTools: MCPTool[] = [
        { name: 'read_file', description: 'Read contents of a file' },
        { name: 'write_file', description: 'Write contents to a file' },
        { name: 'list_directory', description: 'List directory contents' },
        { name: 'search', description: 'Search for content' },
    ];

    await updateMCPServer(id, {
        status: 'connected',
        tools: simulatedTools,
        lastConnectedAt: Date.now(),
    });

    return { success: true, tools: simulatedTools };
}
