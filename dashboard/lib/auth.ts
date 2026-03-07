import { createClient } from '@/lib/supabase/server'

/**
 * Extracts the authenticated user's ID from the session cookie.
 * Returns the user_id (UUID string) or null if not authenticated.
 *
 * Usage in any API route:
 *   const userId = await getAuthUserId()
 *   if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
 */
export async function getAuthUserId(): Promise<string | null> {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()
        console.log("[AUTH DEBUG] getAuthUserId called. Extracted ID:", user?.id);
        return user?.id ?? null
    } catch (e) {
        console.error("[AUTH DEBUG] getAuthUserId error:", e);
        return null
    }
}
