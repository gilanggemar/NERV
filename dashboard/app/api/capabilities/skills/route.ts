import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getAuthUserId } from '@/lib/auth';

// GET /api/capabilities/skills - List all skills with optional filters
export async function GET(request: Request) {
    const userId = await getAuthUserId();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });


    try {
        const { searchParams } = new URL(request.url);
        const status = searchParams.get('status');
        const category = searchParams.get('category');

        let query = db.from('capability_skills').select('*').eq('user_id', userId);
        if (status) {
            query = query.eq('status', status);
        }
        if (category) {
            query = query.eq('category', category);
        }

        const { data, error } = await query.order('created_at', { ascending: false });
        if (error) throw error;

        // Parse JSON fields
        const skills = (data || []).map((row: any) => ({
            ...row,
            tags: typeof row.tags === 'string' ? JSON.parse(row.tags) : row.tags,
            config_json: typeof row.config_json === 'string' ? JSON.parse(row.config_json) : row.config_json,
        }));

        return NextResponse.json({ data: skills });
    } catch (error: unknown) {
        console.error('Failed to list skills:', error);
        return NextResponse.json({ error: 'Failed to list skills' }, { status: 500 });
    }
}

// POST /api/capabilities/skills - Create a new skill
export async function POST(request: Request) {
    const userId = await getAuthUserId();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });


    try {
        const body = await request.json();
        const {
            name,
            description,
            content,
            version = '1.0.0',
            category = 'general',
            icon,
            tags = [],
            config_json = {},
        } = body;

        if (!name || !content) {
            return NextResponse.json({ error: 'name and content are required' }, { status: 400 });
        }

        const id = crypto.randomUUID();
        const now = new Date().toISOString();

        const { error } = await db.from('capability_skills').insert({ user_id: userId,
            id,
            name,
            description,
            content,
            version,
            status: 'active',
            category,
            icon,
            tags: JSON.stringify(tags),
            config_json: JSON.stringify(config_json),
            author: 'user',
            created_at: now,
            updated_at: now,
        });

        if (error) throw error;

        return NextResponse.json({
            data: {
                id,
                name,
                description,
                content,
                version,
                status: 'active',
                category,
                icon,
                tags,
                config_json,
                author: 'user',
                created_at: now,
                updated_at: now,
            },
        }, { status: 201 });
    } catch (error: unknown) {
        console.error('Failed to create skill:', error);
        return NextResponse.json({ error: 'Failed to create skill' }, { status: 500 });
    }
}
