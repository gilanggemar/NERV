import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

interface RouteParams {
    params: Promise<{ agentId: string }>;
}

// GET /api/capabilities/agent/[agentId] - Get full capabilities summary for an agent
export async function GET(request: Request, { params }: RouteParams) {
    try {
        const { agentId } = await params;

        // Get all assignments for this agent
        const { data: assignments, error: assignError } = await db
            .from('agent_capability_assignments')
            .select('*')
            .eq('agent_id', agentId);

        if (assignError) throw assignError;

        const mcpAssignments = (assignments || []).filter((a: any) => a.capability_type === 'mcp');
        const skillAssignments = (assignments || []).filter((a: any) => a.capability_type === 'skill');

        // Get MCP details
        const mcpIds = mcpAssignments.map((a: any) => a.capability_id);
        let mcps: any[] = [];
        if (mcpIds.length > 0) {
            const { data: mcpData } = await db
                .from('capability_mcps')
                .select('*')
                .in('id', mcpIds);

            mcps = (mcpData || []).map((mcp: any) => {
                const assignment = mcpAssignments.find((a: any) => a.capability_id === mcp.id);
                return {
                    id: mcp.id,
                    name: mcp.name,
                    description: mcp.description,
                    status: mcp.status,
                    transport: mcp.transport,
                    icon: mcp.icon,
                    category: mcp.category,
                    tools: typeof mcp.tools === 'string' ? JSON.parse(mcp.tools) : mcp.tools,
                    is_enabled: assignment?.is_enabled ?? true,
                    last_health_status: mcp.last_health_status,
                };
            });
        }

        // Get Skill details
        const skillIds = skillAssignments.map((a: any) => a.capability_id);
        let skills: any[] = [];
        if (skillIds.length > 0) {
            const { data: skillData } = await db
                .from('capability_skills')
                .select('*')
                .in('id', skillIds);

            skills = (skillData || []).map((skill: any) => {
                const assignment = skillAssignments.find((a: any) => a.capability_id === skill.id);
                return {
                    id: skill.id,
                    name: skill.name,
                    description: skill.description,
                    status: skill.status,
                    icon: skill.icon,
                    category: skill.category,
                    version: skill.version,
                    author: skill.author,
                    tags: typeof skill.tags === 'string' ? JSON.parse(skill.tags) : skill.tags,
                    is_enabled: assignment?.is_enabled ?? true,
                };
            });
        }

        // Calculate totals
        const totalMcpTools = mcps.reduce((sum, mcp) => {
            const tools = Array.isArray(mcp.tools) ? mcp.tools : [];
            return sum + tools.length;
        }, 0);

        return NextResponse.json({
            agent_id: agentId,
            mcps,
            skills,
            total_mcp_tools: totalMcpTools,
            total_skills: skills.length,
        });
    } catch (error: unknown) {
        console.error('Failed to get agent capabilities:', error);
        return NextResponse.json({ error: 'Failed to get agent capabilities' }, { status: 500 });
    }
}
