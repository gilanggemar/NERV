import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

// For general database operations in API routes (server-side)
export const supabase = createClient(supabaseUrl, supabaseServiceKey)

// For client-side operations (if ever needed — currently all DB ops go through API routes)
export const supabaseClient = createClient(supabaseUrl, supabaseAnonKey)

// For Supabase Storage operations (images)
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
    auth: { persistSession: false }
})
