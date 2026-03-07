# NERV.OS — Multi-Tenant Authentication System

> **OBJECTIVE:** Add user authentication (signup + login) to NERV.OS so that every user gets their own isolated dashboard. All existing functionality must continue working exactly as-is. We are ADDING a layer on top — not rewriting anything.

---

## CRITICAL RULES (READ BEFORE EXECUTING ANYTHING)

1. **Do NOT delete or rewrite any existing component, page, store, or API route.** You are ADDING auth logic to them.
2. **Do NOT remove any existing database columns or tables.** You are ADDING a `user_id` column to existing tables.
3. **Do NOT change the visual design or layout of any existing page.** The only new UI is the login/signup page.
4. **Test after EVERY phase.** If the app breaks, stop and fix before continuing.
5. **The existing Supabase project URL and keys are already configured** in `lib/config.ts` and `.env.local`. Do NOT create a new Supabase project.
6. **Antigravity has Supabase MCP installed.** Use it for any Supabase dashboard operations (enabling auth providers, running SQL in the SQL editor, etc.).
7. **All file paths are relative to `dashboard/`** unless explicitly stated otherwise.

---

## ARCHITECTURE OVERVIEW (Read — Do Not Execute)

Here is what we are building and why:

```
BEFORE (single-operator):
  Browser → API Routes → Drizzle → Supabase DB (all data shared, no auth)

AFTER (multi-tenant):
  Browser → Login/Signup (Supabase Auth) → Session Cookie
  Browser → Middleware (checks session, redirects to /login if missing)
  Browser → API Routes (extract user_id from session) → Drizzle (WHERE user_id = ?) → Supabase DB
  Supabase DB → RLS Policies (safety net: even if API forgets filter, DB blocks cross-user access)
```

The key changes are:
- **Supabase Auth** handles signup/login/session (email + password)
- **Next.js Middleware** protects all routes except `/login` and `/signup`
- **Every API route** extracts the authenticated user's ID and filters all queries by it
- **Every database table** gets a `user_id` column (UUID referencing `auth.users`)
- **Row Level Security (RLS)** on every table ensures data isolation at the database level
- **A new Zustand store** (`useAuthStore`) manages client-side auth state

---

## PHASE 1 — Install Dependencies

Run this in the `dashboard/` directory:

```bash
npm install @supabase/supabase-js @supabase/ssr
```

These are the official Supabase libraries for:
- `@supabase/supabase-js` — Core Supabase client (you may already have this — `npm install` will skip if so)
- `@supabase/ssr` — Server-side rendering helpers for Next.js App Router (cookie-based session management)

**Do NOT install `@supabase/auth-helpers-nextjs`** — that is the old deprecated package. `@supabase/ssr` is the replacement.

---

## PHASE 2 — Enable Supabase Auth (Email/Password)

Using the **Supabase MCP** or the **Supabase Dashboard** (https://supabase.com/dashboard):

1. Go to your NERV.OS Supabase project.
2. Navigate to **Authentication → Providers**.
3. Ensure **Email** provider is **enabled**.
4. Set these settings:
   - **Enable Email Signup:** ON
   - **Confirm email:** OFF (disable email confirmation for now — we want instant access after signup. This can be turned on later for production.)
   - **Secure email change:** ON
   - **Minimum password length:** 6

This is a Supabase Dashboard configuration step, NOT a code change. If using Supabase MCP, the equivalent is enabling the email auth provider.

---

## PHASE 3 — Create Supabase Client Utilities

Create THREE new files. These are the foundation for all auth operations.

### File 1: `lib/supabase/client.ts`

**Purpose:** Browser-side Supabase client. Used by React components and Zustand stores.

```typescript
import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
```

### File 2: `lib/supabase/server.ts`

**Purpose:** Server-side Supabase client for API routes and Server Components. Reads session from cookies.

```typescript
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // The `setAll` method is called from a Server Component.
            // This can be ignored if you have middleware refreshing sessions.
          }
        },
      },
    }
  )
}
```

### File 3: `lib/supabase/middleware.ts`

**Purpose:** Session refresh logic used by Next.js middleware. Keeps auth cookies fresh.

```typescript
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // IMPORTANT: Do NOT remove this line. It refreshes the session.
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // If user is NOT authenticated and is NOT on the login or signup page, redirect to login
  if (
    !user &&
    !request.nextUrl.pathname.startsWith('/login') &&
    !request.nextUrl.pathname.startsWith('/signup') &&
    !request.nextUrl.pathname.startsWith('/api/') &&
    !request.nextUrl.pathname.startsWith('/_next/')
  ) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  // If user IS authenticated and is on login or signup page, redirect to dashboard
  if (
    user &&
    (request.nextUrl.pathname.startsWith('/login') ||
     request.nextUrl.pathname.startsWith('/signup'))
  ) {
    const url = request.nextUrl.clone()
    url.pathname = '/dashboard'
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}
```

---

## PHASE 4 — Create Next.js Middleware

Create this file at the **root of the dashboard folder** (NOT inside `app/`):

### File: `middleware.ts` (at `dashboard/middleware.ts`)

```typescript
import { updateSession } from '@/lib/supabase/middleware'
import { type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  return await updateSession(request)
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico (favicon)
     * - public folder files (images, etc.)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
```

**What this does:** Every page request passes through this middleware. It checks if the user has a valid session. If not, they get redirected to `/login`. API routes and static files are excluded.

---

## PHASE 5 — Create the Auth Store

### File: `store/useAuthStore.ts`

```typescript
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
```

---

## PHASE 6 — Create Login & Signup Pages

### File: `app/login/page.tsx`

Create a login page with these requirements:

- **Route:** `/login`
- **Design:** Match the existing NERV.OS dark theme aesthetic. Use the same color palette, fonts (Inter + JetBrains Mono), and dark background used throughout the app.
- **Layout:** Centered card on a dark background. Include:
  - The NERV.OS logo or title text at the top
  - Email input field
  - Password input field
  - "Sign In" button
  - A link at the bottom: "Don't have an account? Sign up" that navigates to `/signup`
  - Error message display area (shows auth errors like "Invalid credentials")
  - Loading state on the button while auth is in progress
- **Functionality:**
  - Import `useAuthStore` and call `signIn(email, password)`
  - On successful sign-in, redirect to `/dashboard` using `next/navigation` `useRouter().push('/dashboard')` and also call `router.refresh()` to update the server-side session
  - On error, display the error message returned by `signIn`
  - If the user is already authenticated (check on mount via `useAuthStore.initialize()`), redirect to `/dashboard` immediately
- **Use existing shadcn/ui components:** `Input`, `Button`, `Card`, `CardHeader`, `CardContent` from `@/components/ui/`
- **Do NOT use `<form>` tags with `action`.** Use `onClick` handler on the button or `onSubmit` on a div with role="form".
- **Do NOT add any layout.tsx for the login route.** It should use the root layout.

### File: `app/signup/page.tsx`

Create a signup page with these requirements:

- **Route:** `/signup`
- **Design:** Identical style to the login page.
- **Layout:** Centered card with:
  - NERV.OS logo or title
  - Display Name input field (optional — defaults to email prefix if empty)
  - Email input field
  - Password input field
  - Confirm Password input field
  - "Create Account" button
  - A link: "Already have an account? Sign in" that navigates to `/login`
  - Error message display area
  - Loading state on button
- **Functionality:**
  - Validate that password and confirm password match BEFORE calling the API. If they don't match, show error "Passwords do not match" without making an API call.
  - Validate password is at least 6 characters. If not, show error "Password must be at least 6 characters".
  - Import `useAuthStore` and call `signUp(email, password, displayName)`
  - On success, redirect to `/dashboard` using `router.push('/dashboard')` and `router.refresh()`
  - On error, display the error message
- **Use existing shadcn/ui components** — same as login page.

### IMPORTANT — Update Root `page.tsx`

The current `app/page.tsx` redirects to `/dashboard`. This must still work, but now the middleware handles the auth check. **Do NOT modify `app/page.tsx`** — the middleware will catch unauthenticated users and redirect them to `/login` before they ever reach the root page redirect.

---

## PHASE 7 — Add Sign Out to the Sidebar

Modify `components/DashboardSidebar.tsx` (or whatever the main sidebar component is named):

1. Import `useAuthStore` from `@/store/useAuthStore`
2. Import `useRouter` from `next/navigation`
3. Add a "Sign Out" button in the sidebar footer area (near the existing theme toggle).
4. The Sign Out button should:
   - Call `useAuthStore.getState().signOut()`
   - Then call `router.push('/login')` and `router.refresh()`
5. Optionally display the user's email or display name in the sidebar footer, pulled from `useAuthStore.getState().user?.email` or `user?.user_metadata?.display_name`.
6. **Do NOT remove or rearrange any existing sidebar items.** Just add the sign-out button and optionally the user info.

---

## PHASE 8 — Initialize Auth in Root Layout

Modify `app/layout.tsx`:

1. Create a small client component called `AuthInitializer` (can be in its own file at `components/AuthInitializer.tsx` or inline in layout):

```typescript
'use client'

import { useEffect } from 'react'
import { useAuthStore } from '@/store/useAuthStore'

export function AuthInitializer({ children }: { children: React.ReactNode }) {
  const initialize = useAuthStore((s) => s.initialize)

  useEffect(() => {
    initialize()
  }, [initialize])

  return <>{children}</>
}
```

2. Wrap the existing layout children with `<AuthInitializer>`:
   - Find the current layout's return statement
   - Wrap `{children}` with `<AuthInitializer>{children}</AuthInitializer>`
   - Place it INSIDE the existing provider hierarchy (ThemeProvider → SidebarProvider → etc.) — do NOT change the existing provider order
   - Import `AuthInitializer` at the top of the file

**Do NOT change anything else in the layout.** Do not remove ThemeProvider, SidebarProvider, TooltipProvider, or any other existing wrapper.

---

## PHASE 9 — Create the API Auth Helper

### File: `lib/auth.ts`

This is the single function that ALL API routes will use to get the authenticated user's ID.

```typescript
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
    return user?.id ?? null
  } catch {
    return null
  }
}
```

---

## PHASE 10 — Add `user_id` Column to ALL Database Tables

This is the most critical database change. Every table that stores user-specific data needs a `user_id` column.

### 10A — Update Drizzle Schema

Open `drizzle/schema.ts` and add a `userId` column to EVERY table listed below. The column definition is the same for all tables:

```typescript
userId: uuid('user_id').notNull()
```

**Do NOT add a foreign key reference to `auth.users`** in Drizzle — Supabase's `auth` schema is managed separately and Drizzle doesn't have visibility into it. We will add the foreign key constraint via raw SQL in Phase 11.

**Do NOT add `.defaultRandom()` or any default value.** The `user_id` is always explicitly set by the API route from the authenticated session.

Add `userId` to these tables (this is EVERY table in the schema):

**Agent System:**
1. `agents` — add `userId: uuid('user_id').notNull()`
2. `hero_images` — add `userId: uuid('user_id').notNull()`
3. `agent_provider_config` — add `userId: uuid('user_id').notNull()`
4. `agent_xp` — add `userId: uuid('user_id').notNull()`

**Task & Summit System:**
5. `tasks` — add `userId: uuid('user_id').notNull()`
6. `task_logs` — add `userId: uuid('user_id').notNull()`
7. `summits` — add `userId: uuid('user_id').notNull()`
8. `summit_messages` — add `userId: uuid('user_id').notNull()`

**Provider System:**
9. `providers` — add `userId: uuid('user_id').notNull()`
10. `provider_models` — add `userId: uuid('user_id').notNull()`

**Telemetry & Audit:**
11. `telemetry_logs` — add `userId: uuid('user_id').notNull()`
12. `audit_logs` — add `userId: uuid('user_id').notNull()`

**Memory System:**
13. `conversations` — add `userId: uuid('user_id').notNull()`
14. `conversation_messages` — add `userId: uuid('user_id').notNull()`
15. `knowledge_fragments` — add `userId: uuid('user_id').notNull()`
16. `knowledge_documents` — add `userId: uuid('user_id').notNull()`

**Workflow System:**
17. `workflows` — add `userId: uuid('user_id').notNull()`
18. `workflow_runs` — add `userId: uuid('user_id').notNull()`
19. `workflow_templates` — add `userId: uuid('user_id').notNull()`

**Notifications & Alerts:**
20. `notifications` — add `userId: uuid('user_id').notNull()`
21. `alert_rules` — add `userId: uuid('user_id').notNull()`

**Scheduler & Webhooks:**
22. `scheduled_tasks` — add `userId: uuid('user_id').notNull()`
23. `scheduler_events` — add `userId: uuid('user_id').notNull()`
24. `webhook_configs` — add `userId: uuid('user_id').notNull()`

**Platform Integrations:**
25. `mcp_servers` — add `userId: uuid('user_id').notNull()`
26. `platform_bridges` — add `userId: uuid('user_id').notNull()`
27. `api_keys` — add `userId: uuid('user_id').notNull()`

**War Room:**
28. `war_room_sessions` — add `userId: uuid('user_id').notNull()`
29. `war_room_events` — add `userId: uuid('user_id').notNull()`

**Prompt Chunks:**
30. `prompt_chunks` — add `userId: uuid('user_id').notNull()`

**Connection & Security:**
31. `connection_secrets` — add `userId: uuid('user_id').notNull()`
32. `connection_profiles` — add `userId: uuid('user_id').notNull()`

**Gamification:**
33. `xp_events` — add `userId: uuid('user_id').notNull()`
34. `daily_missions` — add `userId: uuid('user_id').notNull()`
35. `achievements` — add `userId: uuid('user_id').notNull()`
36. `unlocked_achievements` — add `userId: uuid('user_id').notNull()`
37. `operations_streak` — add `userId: uuid('user_id').notNull()`

**Capabilities:**
38. `capability_mcps` — add `userId: uuid('user_id').notNull()`
39. `capability_skills` — add `userId: uuid('user_id').notNull()`
40. `agent_capability_assignments` — add `userId: uuid('user_id').notNull()`

**IMPORTANT:** Make sure to import `uuid` from `drizzle-orm/pg-core` if it's not already imported at the top of the schema file. It should already be there since the schema uses UUIDs for primary keys, but verify.

### 10B — Generate the Migration

```bash
cd dashboard
npx drizzle-kit generate
```

This will create a new migration file in `drizzle/migrations/`.

### 10C — Review the Migration

Open the newly generated migration SQL file and verify it contains `ALTER TABLE ... ADD COLUMN "user_id" uuid NOT NULL` for every table listed above. If any table is missing, go back to the schema and fix it.

### 10D — Handle Existing Data

Before applying the migration, existing rows in the database will not have a `user_id` and the `NOT NULL` constraint will fail. You have two options:

**Option A (Recommended if this is dev/staging data you don't need):**

Wipe the database before applying the migration. You already have a `wipe-db` API endpoint. Call it, or run this SQL in Supabase SQL Editor:

```sql
-- WARNING: This deletes ALL data from ALL NERV.OS tables. Only do this if the current data is development/test data.
DO $$ 
DECLARE 
  r RECORD;
BEGIN
  FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname = 'public') LOOP
    EXECUTE 'TRUNCATE TABLE public.' || quote_ident(r.tablename) || ' CASCADE';
  END LOOP;
END $$;
```

Then apply the migration:

```bash
npx drizzle-kit push
```

**Option B (If you want to preserve existing data):**

Temporarily modify the generated migration SQL file. For EACH `ALTER TABLE` statement, change it from:
```sql
ALTER TABLE "table_name" ADD COLUMN "user_id" uuid NOT NULL;
```
To:
```sql
ALTER TABLE "table_name" ADD COLUMN "user_id" uuid;
```

Then apply the migration:
```bash
npx drizzle-kit push
```

Then after migrating, you will need to manually assign a user_id to all existing rows (using the first user you create after signup). We will address this in Phase 14.

---

## PHASE 11 — Enable Row Level Security (RLS)

Run this SQL in the **Supabase SQL Editor** (via MCP or Dashboard). This enables RLS on every table and creates policies that only allow users to see and modify their own data.

**IMPORTANT:** This SQL must be run AFTER Phase 10 (the `user_id` column must exist on all tables).

```sql
-- ============================================
-- NERV.OS — Row Level Security Policies
-- ============================================
-- This script enables RLS on all NERV.OS tables and creates
-- policies that restrict access to rows matching the authenticated user's ID.
-- ============================================

-- Helper: list of all NERV.OS tables
-- We process each one individually for clarity.

-- 1. agents
ALTER TABLE public.agents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can only access their own agents" ON public.agents
  FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- 2. hero_images
ALTER TABLE public.hero_images ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can only access their own hero_images" ON public.hero_images
  FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- 3. agent_provider_config
ALTER TABLE public.agent_provider_config ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can only access their own agent_provider_config" ON public.agent_provider_config
  FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- 4. agent_xp
ALTER TABLE public.agent_xp ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can only access their own agent_xp" ON public.agent_xp
  FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- 5. tasks
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can only access their own tasks" ON public.tasks
  FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- 6. task_logs
ALTER TABLE public.task_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can only access their own task_logs" ON public.task_logs
  FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- 7. summits
ALTER TABLE public.summits ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can only access their own summits" ON public.summits
  FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- 8. summit_messages
ALTER TABLE public.summit_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can only access their own summit_messages" ON public.summit_messages
  FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- 9. providers
ALTER TABLE public.providers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can only access their own providers" ON public.providers
  FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- 10. provider_models
ALTER TABLE public.provider_models ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can only access their own provider_models" ON public.provider_models
  FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- 11. telemetry_logs
ALTER TABLE public.telemetry_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can only access their own telemetry_logs" ON public.telemetry_logs
  FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- 12. audit_logs
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can only access their own audit_logs" ON public.audit_logs
  FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- 13. conversations
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can only access their own conversations" ON public.conversations
  FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- 14. conversation_messages
ALTER TABLE public.conversation_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can only access their own conversation_messages" ON public.conversation_messages
  FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- 15. knowledge_fragments
ALTER TABLE public.knowledge_fragments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can only access their own knowledge_fragments" ON public.knowledge_fragments
  FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- 16. knowledge_documents
ALTER TABLE public.knowledge_documents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can only access their own knowledge_documents" ON public.knowledge_documents
  FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- 17. workflows
ALTER TABLE public.workflows ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can only access their own workflows" ON public.workflows
  FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- 18. workflow_runs
ALTER TABLE public.workflow_runs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can only access their own workflow_runs" ON public.workflow_runs
  FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- 19. workflow_templates
ALTER TABLE public.workflow_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can only access their own workflow_templates" ON public.workflow_templates
  FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- 20. notifications
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can only access their own notifications" ON public.notifications
  FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- 21. alert_rules
ALTER TABLE public.alert_rules ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can only access their own alert_rules" ON public.alert_rules
  FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- 22. scheduled_tasks
ALTER TABLE public.scheduled_tasks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can only access their own scheduled_tasks" ON public.scheduled_tasks
  FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- 23. scheduler_events
ALTER TABLE public.scheduler_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can only access their own scheduler_events" ON public.scheduler_events
  FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- 24. webhook_configs
ALTER TABLE public.webhook_configs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can only access their own webhook_configs" ON public.webhook_configs
  FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- 25. mcp_servers
ALTER TABLE public.mcp_servers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can only access their own mcp_servers" ON public.mcp_servers
  FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- 26. platform_bridges
ALTER TABLE public.platform_bridges ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can only access their own platform_bridges" ON public.platform_bridges
  FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- 27. api_keys
ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can only access their own api_keys" ON public.api_keys
  FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- 28. war_room_sessions
ALTER TABLE public.war_room_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can only access their own war_room_sessions" ON public.war_room_sessions
  FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- 29. war_room_events
ALTER TABLE public.war_room_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can only access their own war_room_events" ON public.war_room_events
  FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- 30. prompt_chunks
ALTER TABLE public.prompt_chunks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can only access their own prompt_chunks" ON public.prompt_chunks
  FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- 31. connection_secrets
ALTER TABLE public.connection_secrets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can only access their own connection_secrets" ON public.connection_secrets
  FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- 32. connection_profiles
ALTER TABLE public.connection_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can only access their own connection_profiles" ON public.connection_profiles
  FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- 33. xp_events
ALTER TABLE public.xp_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can only access their own xp_events" ON public.xp_events
  FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- 34. daily_missions
ALTER TABLE public.daily_missions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can only access their own daily_missions" ON public.daily_missions
  FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- 35. achievements
ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can only access their own achievements" ON public.achievements
  FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- 36. unlocked_achievements
ALTER TABLE public.unlocked_achievements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can only access their own unlocked_achievements" ON public.unlocked_achievements
  FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- 37. operations_streak
ALTER TABLE public.operations_streak ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can only access their own operations_streak" ON public.operations_streak
  FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- 38. capability_mcps
ALTER TABLE public.capability_mcps ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can only access their own capability_mcps" ON public.capability_mcps
  FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- 39. capability_skills
ALTER TABLE public.capability_skills ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can only access their own capability_skills" ON public.capability_skills
  FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- 40. agent_capability_assignments
ALTER TABLE public.agent_capability_assignments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can only access their own agent_capability_assignments" ON public.agent_capability_assignments
  FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- ============================================
-- IMPORTANT: Service role key BYPASSES RLS.
-- Since API routes use the service role key via Drizzle,
-- RLS acts as a SAFETY NET, not the primary filter.
-- The primary filter is the WHERE user_id = ? clause
-- added in Phase 12.
-- ============================================
```

**CRITICAL NOTE:** Since the existing API routes use the `SUPABASE_SERVICE_ROLE_KEY` (which bypasses RLS), the RLS policies serve as a defense-in-depth safety net. The PRIMARY enforcement is the `WHERE user_id = ?` clause added to every Drizzle query in Phase 12. If you later switch API routes to use the anon key with user sessions, RLS becomes the primary enforcement.

---

## PHASE 12 — Update ALL API Routes to Be User-Scoped

This is the largest phase. Every API route that reads or writes data must:

1. **Import** `getAuthUserId` from `@/lib/auth`
2. **Call it** at the top of every handler: `const userId = await getAuthUserId()`
3. **Return 401** if null: `if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })`
4. **Add `userId` to every INSERT** operation (when creating new rows)
5. **Add `WHERE userId = ?` to every SELECT, UPDATE, and DELETE** operation

### THE PATTERN

Here is the exact pattern to apply to EVERY route handler. This example shows a typical GET and POST:

```typescript
// BEFORE (no auth):
import { db } from '@/lib/db'
import { agents } from '@/drizzle/schema'
import { NextResponse } from 'next/server'
import { eq } from 'drizzle-orm'

export async function GET() {
  const result = await db.select().from(agents)
  return NextResponse.json(result)
}

export async function POST(req: Request) {
  const body = await req.json()
  const result = await db.insert(agents).values({ ...body }).returning()
  return NextResponse.json(result[0])
}

// AFTER (with auth):
import { db } from '@/lib/db'
import { agents } from '@/drizzle/schema'
import { NextResponse } from 'next/server'
import { eq, and } from 'drizzle-orm'             // ← add 'and' import
import { getAuthUserId } from '@/lib/auth'          // ← add this import

export async function GET() {
  const userId = await getAuthUserId()                         // ← add
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) // ← add

  const result = await db.select().from(agents)
    .where(eq(agents.userId, userId))                          // ← add WHERE filter
  return NextResponse.json(result)
}

export async function POST(req: Request) {
  const userId = await getAuthUserId()                         // ← add
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) // ← add

  const body = await req.json()
  const result = await db.insert(agents)
    .values({ ...body, userId })                               // ← add userId to insert
    .returning()
  return NextResponse.json(result[0])
}
```

For UPDATE and DELETE operations that target a specific row by ID:

```typescript
// BEFORE:
await db.update(agents).set({ name: body.name }).where(eq(agents.id, id))
await db.delete(agents).where(eq(agents.id, id))

// AFTER (use 'and' to combine conditions):
await db.update(agents).set({ name: body.name }).where(and(eq(agents.id, id), eq(agents.userId, userId)))
await db.delete(agents).where(and(eq(agents.id, id), eq(agents.userId, userId)))
```

### APPLY THIS PATTERN TO EVERY ROUTE GROUP

Apply the pattern above to every file in every route group listed below. Each file may contain GET, POST, PUT, PATCH, DELETE handlers — update ALL of them.

**Route groups to update (25 groups, ~75 files total):**

| # | Route Group Path | Files | What to Scope |
|---|---|---|---|
| 1 | `app/api/agents/` | 2 files | All agent CRUD + hero images — scope by userId |
| 2 | `app/api/alerts/` | 2 files | Alert rules — scope by userId |
| 3 | `app/api/api-keys/` | 1 file | API keys — scope by userId |
| 4 | `app/api/audit/` | 2 files | Audit logs — scope by userId on both read and write |
| 5 | `app/api/bridges/` | 2 files | Platform bridges — scope by userId |
| 6 | `app/api/capabilities/` | 9 files | MCPs, skills, assignments — scope all by userId |
| 7 | `app/api/connection-profiles/` | 7 files | Connection profiles + secrets — scope by userId |
| 8 | `app/api/gamification/` | 7 files | XP, missions, achievements, streaks — scope by userId |
| 9 | `app/api/mcp/` | 3 files | MCP servers — scope by userId |
| 10 | `app/api/memory/` | 5 files | Conversations, messages, knowledge — scope by userId |
| 11 | `app/api/notifications/` | 1 file | Notifications — scope by userId |
| 12 | `app/api/prompt-chunks/` | 2 files | Prompt chunks — scope by userId |
| 13 | `app/api/providers/` | 4 files | Providers + models — scope by userId |
| 14 | `app/api/scheduler/` | 5 files | Scheduled tasks + events — scope by userId |
| 15 | `app/api/settings/` | 1 file | Settings — scope by userId |
| 16 | `app/api/storage/` | 1 file | Image upload — add userId to path or metadata |
| 17 | `app/api/telemetry/` | 2 files | Telemetry logs — scope by userId |
| 18 | `app/api/war-room/` | 3 files | Sessions + events — scope by userId |
| 19 | `app/api/webhooks/` | 2 files | Webhook configs — scope by userId |
| 20 | `app/api/workflows/` | 6 files | Workflows + runs + templates — scope by userId |
| 21 | `app/api/synthesize/` | 1 file | Add auth check (userId extraction) |
| 22 | `app/api/wipe-db/` | 1 file | **Scope the wipe to only the authenticated user's data** — do NOT allow one user to wipe another's data. Change all DELETE statements to include `WHERE user_id = userId`. |

**Special cases:**

| Route | Special Handling |
|---|---|
| `app/api/agent-zero/` (8 files) | These are proxies to an external service. Add the auth check (`getAuthUserId()` + 401 return) at the top of each handler to prevent unauthenticated access, but the actual data filtering happens at the Agent Zero service level. |
| `app/api/openclaw-proxy/` (1 file) | Same as agent-zero — add auth check but this proxies to OpenClaw. |
| `app/api/v1/` (3 files) | These are public API endpoints. They should authenticate via API key (from the `api_keys` table) instead of session. Add a check that validates the API key in the `Authorization` header, looks it up in the `api_keys` table (scoped by the key owner's userId), and uses that userId for data access. |
| `app/api/storage/` (1 file) | When uploading images, prefix the storage path with the userId to keep each user's images isolated: `${userId}/${originalPath}` |

---

## PHASE 13 — Update Zustand Stores (Add userId to Create/Fetch Calls)

The Zustand stores call API routes via `fetch()`. Since the API routes now extract userId from the session cookie (which is automatically sent with every `fetch()` call from the browser), **the stores do NOT need to explicitly pass userId**. The cookie is sent automatically.

**HOWEVER**, verify that ALL `fetch()` calls in the stores include `credentials: 'include'` or `credentials: 'same-origin'` (which is the default for same-origin requests in Next.js). If any store is using a custom fetch wrapper that strips cookies, fix it.

**Stores to verify (all 20):**
1. `useAgentStore` — verify fetch calls send cookies
2. `useAgentZeroStore` — verify
3. `useAuditStore` — verify
4. `useBridgesStore` — verify
5. `useCapabilitiesStore` — verify
6. `useConnectionStore` — verify
7. `useGamificationStore` — verify
8. `useMCPStore` — verify
9. `useMemoryStore` — verify
10. `useNotificationStore` — verify
11. `useOpenClawStore` — verify
12. `usePromptChunkStore` — verify
13. `useProviderStore` — verify
14. `useSchedulerStore` — verify
15. `useTaskStore` — verify
16. `useTelemetryStore` — verify
17. `useThemeStore` — no API calls, skip
18. `useWarRoomStore` — verify
19. `useWorkflowBuilderStore` — no API calls (local canvas state), skip
20. `useWorkflowStore` — verify

For each store, check every `fetch('/api/...')` call. If any call has `credentials: 'omit'`, change it to `credentials: 'same-origin'`. If none specify credentials at all, they're fine — same-origin is the default.

---

## PHASE 14 — Handle Existing Data Migration (If You Chose Option B in Phase 10)

If you wiped the database (Option A), skip this phase entirely.

If you kept existing data (Option B), you need to assign all existing rows to your user account:

1. Create your account by visiting `/signup` and registering.
2. Get your user ID from Supabase Dashboard → Authentication → Users → copy your user's UUID.
3. Run this SQL in Supabase SQL Editor, replacing `YOUR_USER_UUID_HERE` with your actual UUID:

```sql
-- Assign all existing unassigned data to your user account
DO $$
DECLARE
  target_user_id uuid := 'YOUR_USER_UUID_HERE';
  r RECORD;
BEGIN
  FOR r IN (
    SELECT table_name 
    FROM information_schema.columns 
    WHERE column_name = 'user_id' 
    AND table_schema = 'public'
  ) LOOP
    EXECUTE format(
      'UPDATE public.%I SET user_id = $1 WHERE user_id IS NULL',
      r.table_name
    ) USING target_user_id;
  END LOOP;
END $$;
```

4. After running this, add the NOT NULL constraint back:

```sql
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN (
    SELECT table_name 
    FROM information_schema.columns 
    WHERE column_name = 'user_id' 
    AND table_schema = 'public'
    AND is_nullable = 'YES'
  ) LOOP
    EXECUTE format(
      'ALTER TABLE public.%I ALTER COLUMN user_id SET NOT NULL',
      r.table_name
    );
  END LOOP;
END $$;
```

---

## PHASE 15 — Supabase Storage Isolation

Currently, agent hero images are stored in the `nerv-images` bucket. For multi-tenancy, we need each user's images isolated.

### 15A — Update the upload path

In `lib/supabaseStorage.ts`, modify the `uploadImage` function:

**BEFORE:**
```typescript
const filePath = `${path}`  // or however the path is currently constructed
```

**AFTER:**
```typescript
// The userId should be passed as a parameter to uploadImage
const filePath = `${userId}/${path}`
```

Update the function signature to accept `userId: string` as the first parameter.

### 15B — Update all callers of `uploadImage`

Search the codebase for all calls to `uploadImage`. In each case, pass the authenticated user's ID as the first argument. The API routes that call this function already have access to `userId` from Phase 12.

### 15C — Add Storage RLS (via Supabase Dashboard or SQL)

Run this SQL to restrict storage access per user:

```sql
-- Storage policies for nerv-images bucket
-- Users can only access files in their own folder (userId prefix)
CREATE POLICY "Users can upload their own images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'nerv-images' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can view their own images"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'nerv-images' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can delete their own images"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'nerv-images' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);
```

---

## PHASE 16 — New User Onboarding (Seed Data)

When a brand new user signs up, their dashboard will be completely empty — no agents, no workflows, no prompt chunks, nothing. This is correct behavior (each user starts fresh). However, for a good first experience, you may want to seed some default data.

### Create an onboarding API route: `app/api/onboarding/route.ts`

This route should:

1. Be called ONCE after a successful signup (from the signup page, after `signUp()` succeeds).
2. Check if the user already has any agents. If yes, return early (prevents duplicate seeding).
3. If no agents exist, create default seed data for the user:
   - 1-3 starter agents with default names, roles, and avatars
   - Default achievement definitions (from `lib/gamification/seed.ts`)
   - A default connection profile
   - A welcome notification

```typescript
import { db } from '@/lib/db'
import { agents, achievements, connectionProfiles, notifications } from '@/drizzle/schema'
import { getAuthUserId } from '@/lib/auth'
import { NextResponse } from 'next/server'
import { eq } from 'drizzle-orm'
import { ACHIEVEMENT_SEEDS } from '@/lib/gamification/seed'

export async function POST() {
  const userId = await getAuthUserId()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Check if user already has agents (already onboarded)
  const existingAgents = await db.select().from(agents).where(eq(agents.userId, userId)).limit(1)
  if (existingAgents.length > 0) {
    return NextResponse.json({ message: 'Already onboarded' })
  }

  // Seed achievements for this user
  // (Adapt this based on the actual shape of ACHIEVEMENT_SEEDS and your schema)
  for (const achievement of ACHIEVEMENT_SEEDS) {
    await db.insert(achievements).values({ ...achievement, userId })
  }

  // Seed a default connection profile
  await db.insert(connectionProfiles).values({
    name: 'Default',
    isActive: true,
    openclawEnabled: false,
    agentZeroEnabled: false,
    userId,
  })

  // Seed a welcome notification
  await db.insert(notifications).values({
    type: 'system',
    title: 'Welcome to NERV.OS',
    message: 'Your dashboard is ready. Start by creating your first agent in the Command Center.',
    isRead: false,
    userId,
  })

  return NextResponse.json({ message: 'Onboarding complete' })
}
```

Then in `app/signup/page.tsx`, after a successful `signUp()` call, add:

```typescript
// After successful signup, trigger onboarding
await fetch('/api/onboarding', { method: 'POST' })
```

---

## PHASE 17 — Testing Checklist

After completing all phases, test the following scenarios IN ORDER:

### 17A — Auth Flow
1. Start the app: `npm run dev`
2. Visit `http://localhost:3000` — should redirect to `/login`
3. Click "Sign up" link — should navigate to `/signup`
4. Create a new account with email + password — should redirect to `/dashboard`
5. Verify the dashboard loads with empty state (no agents, etc.)
6. Click "Sign Out" in sidebar — should redirect to `/login`
7. Log back in with the same credentials — should load the dashboard
8. Open a new incognito window and visit `http://localhost:3000` — should redirect to `/login` (separate session)

### 17B — Data Isolation
1. Create User A: sign up with email `usera@test.com`
2. As User A: create an agent, add a prompt chunk, create a workflow
3. Sign out
4. Create User B: sign up with email `userb@test.com`
5. As User B: verify the dashboard is EMPTY — no agents, no prompt chunks, no workflows from User A
6. As User B: create different agents and data
7. Sign out, sign back in as User A
8. Verify User A only sees their own data — nothing from User B

### 17C — Existing Features Still Work
Test each of these features to confirm they work correctly with auth:
- [ ] Agent CRUD (create, edit, delete agents)
- [ ] Hero image upload and display
- [ ] Chat (send messages, view history)
- [ ] Workflow builder (create, save, run workflows)
- [ ] Scheduler (create events, view calendar)
- [ ] Prompt chunks (create, edit, drag into chat)
- [ ] Provider management (add/edit providers)
- [ ] Notifications (appear and can be dismissed)
- [ ] Settings page (all tabs load)
- [ ] Observability (telemetry data displays)
- [ ] Memory (knowledge fragments and documents)
- [ ] War Room (create session, add events)
- [ ] Gamification (XP awards, achievements display)
- [ ] Audit trail (logs appear)

### 17D — Security
1. Open browser dev tools → Application → Cookies
2. Verify Supabase auth cookies exist (names starting with `sb-`)
3. Try calling an API route directly without being logged in (e.g., `curl http://localhost:3000/api/agents`) — should return `401 Unauthorized`
4. Try calling an API route with User A's session but requesting User B's agent ID — should return empty result or 404

---

## FILE SUMMARY — New & Modified Files

### New Files Created:
| File | Phase | Purpose |
|---|---|---|
| `lib/supabase/client.ts` | 3 | Browser Supabase client |
| `lib/supabase/server.ts` | 3 | Server Supabase client |
| `lib/supabase/middleware.ts` | 3 | Session refresh logic |
| `middleware.ts` | 4 | Next.js route protection middleware |
| `store/useAuthStore.ts` | 5 | Auth state management |
| `app/login/page.tsx` | 6 | Login page |
| `app/signup/page.tsx` | 6 | Signup page |
| `components/AuthInitializer.tsx` | 8 | Auth session initializer |
| `lib/auth.ts` | 9 | API route auth helper |
| `app/api/onboarding/route.ts` | 16 | New user seed data |

### Modified Files:
| File | Phase | Change |
|---|---|---|
| `drizzle/schema.ts` | 10 | Added `userId` column to all 40 tables |
| `drizzle/migrations/` | 10 | New migration file generated |
| `app/layout.tsx` | 8 | Wrapped children with `AuthInitializer` |
| `components/DashboardSidebar.tsx` | 7 | Added sign-out button + user display |
| `lib/supabaseStorage.ts` | 15 | Added userId prefix to upload paths |
| All 75 API route files | 12 | Added auth check + userId scoping |

### Supabase Changes (via SQL Editor / MCP):
| Change | Phase |
|---|---|
| Email auth provider enabled | 2 |
| `user_id` column on all tables (via migration) | 10 |
| RLS enabled + policies on all 40 tables | 11 |
| Storage policies on `nerv-images` bucket | 15 |

---

## EMERGENCY ROLLBACK

If something goes catastrophically wrong:

1. **Auth not working:** Delete `middleware.ts` — this removes all route protection and the app becomes accessible without login (back to original state).
2. **API routes broken:** Revert the auth check additions in API routes (remove the `getAuthUserId()` calls and userId WHERE clauses).
3. **Database migration broke:** Run `npx drizzle-kit push` after fixing schema, or restore from Supabase backup.
4. **RLS blocking all queries:** Run `ALTER TABLE public.TABLE_NAME DISABLE ROW LEVEL SECURITY;` for each affected table.

None of these rollback steps affect your existing source code or data — auth is a layer on top.
