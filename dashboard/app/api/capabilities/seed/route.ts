import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getAuthUserId } from '@/lib/auth';

export async function POST() {
    const userId = await getAuthUserId();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });


    try {
        // Check if already seeded
        const { data: existingMcps } = await db
            .from('capability_mcps')
            .select('id')
            .limit(1);

        if (existingMcps && existingMcps.length > 0) {
            return NextResponse.json({ message: 'Already seeded' }, { status: 200 });
        }

        // Seed default MCPs
        const defaultMcps = [
            {
                id: crypto.randomUUID(),
                name: 'Filesystem',
                description: 'Read, write, and manage files on the server filesystem. Provides tools for file CRUD, directory listing, and file search.',
                server_url: 'npx -y @modelcontextprotocol/server-filesystem',
                transport: 'stdio',
                status: 'active',
                auth_type: 'none',
                tools: JSON.stringify([
                    { name: 'read_file', description: 'Read contents of a file' },
                    { name: 'write_file', description: 'Write content to a file' },
                    { name: 'list_directory', description: 'List files in a directory' },
                    { name: 'search_files', description: 'Search for files by pattern' },
                    { name: 'create_directory', description: 'Create a new directory' },
                    { name: 'move_file', description: 'Move or rename a file' },
                    { name: 'get_file_info', description: 'Get file metadata' },
                ]),
                icon: 'FolderOpen',
                category: 'general',
                config_json: JSON.stringify({ allowedPaths: ['/workspace'] }),
            },
            {
                id: crypto.randomUUID(),
                name: 'Web Search',
                description: 'Search the web and fetch webpage content. Provides tools for web search queries and URL content extraction.',
                server_url: 'npx -y @modelcontextprotocol/server-brave-search',
                transport: 'stdio',
                status: 'inactive',
                auth_type: 'api_key',
                tools: JSON.stringify([
                    { name: 'brave_web_search', description: 'Search the web using Brave Search' },
                    { name: 'brave_local_search', description: 'Search for local businesses and places' },
                ]),
                icon: 'Search',
                category: 'data',
                config_json: JSON.stringify({ note: 'Requires BRAVE_API_KEY in encrypted credentials' }),
            },
            {
                id: crypto.randomUUID(),
                name: 'GitHub',
                description: 'Interact with GitHub repositories. Create issues, PRs, search code, manage repos and branches.',
                server_url: 'npx -y @modelcontextprotocol/server-github',
                transport: 'stdio',
                status: 'inactive',
                auth_type: 'bearer',
                tools: JSON.stringify([
                    { name: 'create_issue', description: 'Create a GitHub issue' },
                    { name: 'create_pull_request', description: 'Create a pull request' },
                    { name: 'search_repositories', description: 'Search GitHub repositories' },
                    { name: 'get_file_contents', description: 'Get file contents from a repo' },
                    { name: 'list_commits', description: 'List recent commits' },
                    { name: 'create_branch', description: 'Create a new branch' },
                ]),
                icon: 'GitBranch',
                category: 'code',
                config_json: JSON.stringify({ note: 'Requires GITHUB_PERSONAL_ACCESS_TOKEN in encrypted credentials' }),
            },
            {
                id: crypto.randomUUID(),
                name: 'Memory (Knowledge Graph)',
                description: 'Persistent memory via knowledge graph. Agents can store and recall entities, relations, and observations across sessions.',
                server_url: 'npx -y @modelcontextprotocol/server-memory',
                transport: 'stdio',
                status: 'active',
                auth_type: 'none',
                tools: JSON.stringify([
                    { name: 'create_entities', description: 'Create new entities in the knowledge graph' },
                    { name: 'create_relations', description: 'Create relations between entities' },
                    { name: 'add_observations', description: 'Add observations to existing entities' },
                    { name: 'search_nodes', description: 'Search for nodes in the knowledge graph' },
                    { name: 'open_nodes', description: 'Open specific nodes by name' },
                    { name: 'delete_entities', description: 'Delete entities from the graph' },
                ]),
                icon: 'Brain',
                category: 'general',
                config_json: JSON.stringify({}),
            },
            {
                id: crypto.randomUUID(),
                name: 'Fetch (HTTP)',
                description: 'Fetch content from any URL. Retrieve web pages, APIs, and online resources. Returns clean markdown content.',
                server_url: 'npx -y @modelcontextprotocol/server-fetch',
                transport: 'stdio',
                status: 'active',
                auth_type: 'none',
                tools: JSON.stringify([
                    { name: 'fetch', description: 'Fetch a URL and return content as markdown' },
                ]),
                icon: 'Globe',
                category: 'data',
                config_json: JSON.stringify({}),
            },
        ];

        // Seed default Skills
        const defaultSkills = [
            {
                id: crypto.randomUUID(),
                name: 'Chain-of-Thought Reasoning',
                description: 'Forces the agent to break down complex problems step-by-step before answering.',
                content: `# Chain-of-Thought Reasoning Skill

When facing any complex question, analysis, or multi-step problem:

1. **Decompose**: Break the problem into discrete sub-problems
2. **Sequence**: Identify the logical order of operations
3. **Execute step-by-step**: Solve each sub-problem, showing your work
4. **Cross-check**: Verify each step's output before proceeding
5. **Synthesize**: Combine sub-results into the final answer
6. **Sanity check**: Does the final answer make sense given the original question?

Always show your reasoning chain explicitly. Never jump to conclusions.`,
                version: '1.0.0',
                status: 'active',
                category: 'analysis',
                icon: 'Workflow',
                tags: JSON.stringify(['reasoning', 'analysis', 'problem-solving']),
                author: 'system',
            },
            {
                id: crypto.randomUUID(),
                name: 'Code Review Protocol',
                description: 'Systematic code review checklist - security, performance, readability, and maintainability.',
                content: `# Code Review Protocol Skill

When reviewing any code, systematically evaluate in this order:

## 1. Security
- Input validation and sanitization
- SQL injection / XSS / CSRF vulnerabilities
- Secret/key exposure
- Auth/authz boundary checks

## 2. Correctness
- Does it handle edge cases? (null, empty, overflow, concurrent)
- Error handling completeness
- Type safety

## 3. Performance
- O(n) complexity - any unnecessary loops or re-renders?
- Memory leaks (event listeners, intervals, subscriptions)
- Database query efficiency (N+1, missing indexes)

## 4. Readability
- Clear naming conventions
- Function length (>30 lines = split candidate)
- Comments explain "why", not "what"

## 5. Maintainability
- DRY violations
- Proper separation of concerns
- Test coverage gaps

Output format: List findings by severity (CRITICAL > WARNING > SUGGESTION).`,
                version: '1.0.0',
                status: 'active',
                category: 'code',
                icon: 'ShieldCheck',
                tags: JSON.stringify(['code', 'review', 'security', 'quality']),
                author: 'system',
            },
            {
                id: crypto.randomUUID(),
                name: 'Structured Output Enforcer',
                description: 'Ensures agent responses follow a strict JSON/structured format when requested.',
                content: `# Structured Output Enforcer Skill

When the user or system requests structured output:

1. **Identify the schema**: Determine the exact JSON structure expected
2. **Validate before responding**: Mentally verify your output matches the schema
3. **Rules**:
   - Always return valid JSON (no trailing commas, proper quoting)
   - Never wrap JSON in markdown code fences unless explicitly asked
   - Include all required fields, even if the value is null
   - Use consistent types (don't mix string "true" with boolean true)
   - Arrays should be homogeneous
4. **If the schema is ambiguous**: Ask for clarification before generating
5. **On error**: Return a JSON error object: { "error": true, "message": "..." }`,
                version: '1.0.0',
                status: 'active',
                category: 'general',
                icon: 'Braces',
                tags: JSON.stringify(['json', 'structured', 'output', 'format']),
                author: 'system',
            },
            {
                id: crypto.randomUUID(),
                name: 'Research & Summarization',
                description: 'Systematic research methodology - gather, evaluate sources, synthesize findings into actionable summaries.',
                content: `# Research & Summarization Skill

When conducting research on any topic:

## Phase 1: Scope
- Define the specific question or objective
- Identify what "good enough" looks like
- Set boundaries (time period, domain, depth)

## Phase 2: Gather
- Use available tools (web search, file access, memory) to collect information
- Prioritize primary sources over secondary
- Note conflicting information explicitly

## Phase 3: Evaluate
- Cross-reference claims across multiple sources
- Assess source credibility and recency
- Flag unverified claims clearly

## Phase 4: Synthesize
- Lead with the key finding / answer
- Support with evidence (cite sources)
- Provide nuance and caveats
- End with actionable next steps or recommendations

Output format:
**TL;DR**: [1-2 sentence answer]
**Key Findings**: [Bullet points]
**Sources**: [List with credibility notes]
**Recommended Actions**: [What to do with this info]`,
                version: '1.0.0',
                status: 'active',
                category: 'research',
                icon: 'BookOpen',
                tags: JSON.stringify(['research', 'summary', 'analysis']),
                author: 'system',
            },
            {
                id: crypto.randomUUID(),
                name: 'NERV Operations Protocol',
                description: 'Dashboard-specific operational protocol - how agents should behave within the NERV ecosystem.',
                content: `# NERV Operations Protocol

You are an agent operating within the NERV.OS orchestration dashboard. Follow these operational guidelines:

## Identity
- You have a name, codename, role, and specialty assigned in the NERV system
- Respect your role boundaries - defer to other agents for tasks outside your specialty
- Your status is tracked (STANDBY, ACTIVE, BUSY, ERROR, OFFLINE)

## Communication
- In Summit sessions: be concise, opinionated, and constructive
- In War Room sessions: focus on problem resolution, propose concrete action items
- In direct chat: be helpful and thorough
- Always reference task IDs when discussing tracked work

## Tool Usage
- Check available MCP tools before attempting tasks manually
- Log significant actions for audit trail
- Report errors clearly with context

## Collaboration
- When a task requires another agent's expertise, recommend delegation
- In multi-agent sessions, avoid repeating what others have said
- Build on previous agent contributions rather than starting from scratch`,
                version: '1.0.0',
                status: 'active',
                category: 'general',
                icon: 'Shield',
                tags: JSON.stringify(['nerv', 'protocol', 'operations', 'system']),
                author: 'system',
            },
        ];

        // Insert MCPs
        const { error: mcpError } = await db
            .from('capability_mcps')
            .insert(defaultMcps);

        if (mcpError) throw mcpError;

        // Insert Skills
        const { error: skillError } = await db
            .from('capability_skills')
            .insert(defaultSkills);

        if (skillError) throw skillError;

        // Auto-assign all active MCPs and skills to all existing agents
        const { data: agents } = await db.from('agents').select('id').eq('user_id', userId);
        const { data: mcps } = await db.from('capability_mcps').select('id').eq('user_id', userId).eq('status', 'active');
        const { data: skills } = await db.from('capability_skills').select('id').eq('user_id', userId).eq('status', 'active');

        const assignments: Array<{
            id: string;
            agent_id: string;
            capability_type: string;
            capability_id: string;
            is_enabled: boolean;
        }> = [];

        for (const agent of (agents || [])) {
            for (const mcp of (mcps || [])) {
                assignments.push({
                    id: crypto.randomUUID(),
                    agent_id: agent.id,
                    capability_type: 'mcp',
                    capability_id: mcp.id,
                    is_enabled: true,
                });
            }
            for (const skill of (skills || [])) {
                assignments.push({
                    id: crypto.randomUUID(),
                    agent_id: agent.id,
                    capability_type: 'skill',
                    capability_id: skill.id,
                    is_enabled: true,
                });
            }
        }

        if (assignments.length > 0) {
            const { error: assignError } = await db
                .from('agent_capability_assignments')
                .insert(assignments);
            if (assignError) throw assignError;
        }

        return NextResponse.json({
            message: 'Seeded successfully',
            mcps: defaultMcps.length,
            skills: defaultSkills.length,
            assignments: assignments.length,
        });
    } catch (error: unknown) {
        console.error('Failed to seed capabilities:', error);
        return NextResponse.json({ error: (error as Error).message }, { status: 500 });
    }
}
