import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

interface RouteParams {
    params: Promise<{ id: string }>;
}

// POST /api/capabilities/mcps/[id]/health - Perform health check on MCP
export async function POST(request: Request, { params }: RouteParams) {
    try {
        const { id } = await params;

        // Get the MCP
        const { data: mcp, error: fetchError } = await db
            .from('capability_mcps')
            .select('*')
            .eq('id', id)
            .single();

        if (fetchError || !mcp) {
            return NextResponse.json({ error: 'MCP not found' }, { status: 404 });
        }

        let healthStatus = 'unknown';
        let healthMessage = '';

        // For stdio transport, we check if the command looks valid
        if (mcp.transport === 'stdio') {
            // Basic validation for stdio commands
            if (mcp.server_url.startsWith('npx ') || mcp.server_url.startsWith('node ')) {
                healthStatus = 'healthy';
                healthMessage = 'Stdio command appears valid';
            } else {
                healthStatus = 'unknown';
                healthMessage = 'Stdio command format not recognized';
            }
        } else if (mcp.transport === 'sse' || mcp.transport === 'streamable-http') {
            // For SSE/HTTP, attempt a connection (simplified check)
            try {
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 5000);

                const response = await fetch(mcp.server_url, {
                    method: 'GET',
                    signal: controller.signal,
                });
                clearTimeout(timeoutId);

                if (response.ok || response.status === 405) {
                    // 405 is acceptable - means server exists but doesn't accept GET
                    healthStatus = 'healthy';
                    healthMessage = `Server responded with status ${response.status}`;
                } else {
                    healthStatus = 'unhealthy';
                    healthMessage = `Server responded with status ${response.status}`;
                }
            } catch (fetchErr: any) {
                if (fetchErr.name === 'AbortError') {
                    healthStatus = 'unhealthy';
                    healthMessage = 'Connection timeout';
                } else {
                    healthStatus = 'unhealthy';
                    healthMessage = fetchErr.message || 'Connection failed';
                }
            }
        }

        // Update the MCP with health check results
        const now = new Date().toISOString();
        const { error: updateError } = await db
            .from('capability_mcps')
            .update({
                last_health_check: now,
                last_health_status: healthStatus,
                updated_at: now,
            })
            .eq('id', id);

        if (updateError) {
            console.error('Failed to update health status:', updateError);
        }

        return NextResponse.json({
            id,
            status: healthStatus,
            message: healthMessage,
            checked_at: now,
        });
    } catch (error: unknown) {
        console.error('Failed to health check MCP:', error);
        return NextResponse.json({ error: 'Failed to health check MCP' }, { status: 500 });
    }
}
