import { create } from 'zustand'
import { createClient } from '@/lib/supabase/client'
import type { User, Session } from '@supabase/supabase-js'

interface AuthState {
    user: User | null
    session: Session | null
    loading: boolean
    initialized: boolean

    initialize: () => Promise<void>
    signUp: (email: string, password: string, displayName?: string) => Promise<{ error: string | null }>
    signIn: (email: string, password: string) => Promise<{ error: string | null }>
    signOut: () => Promise<void>
}

export const useAuthStore = create<AuthState>((set, get) => ({
    user: null,
    session: null,
    loading: true,
    initialized: false,

    initialize: async () => {
        if (get().initialized) return

        const supabase = createClient()

        // Get initial session
        const { data: { session } } = await supabase.auth.getSession()
        set({
            session,
            user: session?.user ?? null,
            loading: false,
            initialized: true,
        })

        // Listen for auth state changes (login, logout, token refresh)
        supabase.auth.onAuthStateChange((_event, session) => {
            set({
                session,
                user: session?.user ?? null,
                loading: false,
            })
        })
    },

    signUp: async (email, password, displayName) => {
        const supabase = createClient()
        set({ loading: true })

        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    display_name: displayName || email.split('@')[0],
                },
            },
        })

        if (error) {
            set({ loading: false })
            return { error: error.message }
        }

        set({
            user: data.user,
            session: data.session,
            loading: false,
        })

        return { error: null }
    },

    signIn: async (email, password) => {
        const supabase = createClient()
        set({ loading: true })

        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
        })

        if (error) {
            set({ loading: false })
            return { error: error.message }
        }

        set({
            user: data.user,
            session: data.session,
            loading: false,
        })

        return { error: null }
    },

    signOut: async () => {
        const supabase = createClient()
        await supabase.auth.signOut()
        set({ user: null, session: null, loading: false })
    },
}))
