# NERV.OS — Comprehensive Application Overview

> **Last Updated:** 2026-03-07  
> **Purpose:** Audit-ready reference for all systems, features, and architectural decisions.

---

## 1. Technology Stack

### Frontend
| Layer | Technology | Version |
|---|---|---|
| **Framework** | Next.js (App Router, Turbopack) | 16.1.6 |
| **Language** | TypeScript | ^5 |
| **React** | React + React DOM | 19.2.3 |
| **Styling** | Tailwind CSS v4 + `tw-animate-css` | ^4 |
| **UI Library** | shadcn/ui (28 components) | ^3.8.5 |
| **State Management** | Zustand (20 stores) | ^5.0.11 |
| **Animation** | Framer Motion / Motion | ^12.34.3 |
| **Charts** | Recharts | ^3.7.0 |
| **Flow/Graph** | @xyflow/react (React Flow) | ^12.10.1 |
| **Force Graph** | react-force-graph-2d + d3-force | ^1.29.1 |
| **Particles** | @tsparticles/react + slim | ^3.0.0 |
| **Icons** | Lucide React + Tabler Icons | ^0.575.0 / ^3.37.1 |
| **Markdown** | react-markdown + remark-gfm + rehype-highlight | ^10.1.0 |
| **Drag & Drop** | @dnd-kit (core, sortable, utilities) | ^6.3.1 |
| **Image Crop** | react-easy-crop + react-image-crop | ^5.5.6 |
| **Date Utils** | date-fns | ^4.1.0 |
| **Notifications** | Sonner (toast) | ^2.0.7 |
| **Themes** | next-themes | ^0.4.6 |
| **Command Palette** | cmdk | ^1.1.1 |

### Backend
| Layer | Technology | Details |
|---|---|---|
| **Runtime** | Next.js API Routes (App Router) | Server-side handlers in `app/api/` |
| **Database** | Supabase (PostgreSQL) | Cloud-hosted, accessed via service role key |
| **ORM** | Drizzle ORM (PostgreSQL dialect) | ^0.45.1, schema in `drizzle/schema.ts` |
| **Migrations** | Drizzle Kit | ^0.31.9, output to `drizzle/migrations/` |
| **File Storage** | Supabase Storage | Bucket: `nerv-images` |
| **Real-time Comms** | WebSocket (native) + Socket.io Client | OpenClaw Gateway protocol |
| **AI SDK** | @anthropic-ai/sdk | ^0.78.0 (for Agent Zero) |
| **Encryption** | Web Crypto API (ECDSA P-256) | Device identity + challenge signing |

### External Integrations
| Service | Role |
|---|---|
| **OpenClaw Gateway** | Primary agent orchestration backend (WebSocket, custom protocol) |
| **Agent Zero** | External AI agent (REST + optional WebSocket) |
| **Supabase** | Database (PostgreSQL) + Storage (images) |

---

## 2. Project Structure

```
NERV.OS/
├── dashboard/                    ← Main application
│   ├── app/                      ← Next.js App Router
│   │   ├── layout.tsx            ← Root layout (ThemeProvider → SidebarProvider → TooltipProvider)
│   │   ├── page.tsx              ← Root redirect
│   │   ├── globals.css           ← Global styles (~27KB)
│   │   ├── api/                  ← 25 API route groups (see §5)
│   │   ├── dashboard/            ← 9 dashboard sub-pages (see §3)
│   │   ├── agents/               ← Task-Ops page
│   │   ├── chat/                 ← Chat interface
│   │   ├── console/              ← Console/terminal view
│   │   ├── summit/               ← Summit (multi-agent deliberation)
│   │   ├── settings/             ← Settings (providers, bridges, MCP)
│   │   └── api-reference/        ← API reference page
│   ├── components/               ← 133 component files
│   │   ├── ui/                   ← 28 shadcn/ui primitives
│   │   ├── command-center/       ← 11 overview/HQ components
│   │   ├── workflow-builder/     ← 21 files (canvas, nodes, edges, config)
│   │   ├── agent-showcase/       ← 6 agent identity/stat components
│   │   ├── chat/                 ← 5 chat components
│   │   ├── scheduler/            ← 7 scheduler components
│   │   ├── war-room/             ← 4 war room components
│   │   ├── prompt-chunks/        ← 7 prompt-chunk components
│   │   ├── overview/             ← 4 overview widgets
│   │   ├── observability/        ← 1 observability component
│   │   ├── agents/               ← 2 agent management components
│   │   ├── agent-zero/           ← 2 Agent Zero-specific components
│   │   ├── settings/             ← 2 settings components
│   │   └── [29 standalone feature components]
│   ├── store/                    ← 20 Zustand stores (see §6)
│   ├── hooks/                    ← 6 custom hooks
│   ├── lib/                      ← 73 files: services, utils, engines
│   │   ├── providers/            ← 10 LLM provider adapters + crypto + manager
│   │   ├── gamification/         ← XP engine, missions, achievements, seeds
│   │   ├── telemetry/            ← Cost calculator, logger, types
│   │   ├── memory/               ← Context builder, knowledge manager
│   │   ├── workflows/            ← Workflow execution engine
│   │   ├── scheduler/            ← Scheduler engine
│   │   ├── war-room/             ← War room engine
│   │   ├── bridges/              ← Platform bridge engine
│   │   ├── mcp/                  ← MCP client
│   │   ├── notifications/        ← Notification engine
│   │   └── [core services: supabase, db, config, gateway, etc.]
│   ├── drizzle/                  ← Schema + 8 migration files
│   └── public/                   ← Static assets (5 files)
├── architecture/                 ← 3 SOP documents
├── tools/                        ← 6 utility scripts
└── gemini.md                     ← Project constitution
```

---

## 3. Frontend Pages & Navigation

The sidebar (`DashboardSidebar.tsx`) organizes navigation into **3 groups** plus a standalone Settings link:

### PRIMARY
| Route | Page | Description |
|---|---|---|
| `/dashboard` | **Agents (Command Center)** | Full-screen agent showcase with particle background, nebula atmosphere, agent hero portrait, XP/level/rank display, fleet stats, and agent carousel dock at the bottom |
| `/chat` | **Chat** | AI chat interface with message renderer, thinking panel, process tree, prompt-chunk injection, and conversation history sidebar |
| `/summit` | **The Summit** | Multi-agent deliberation system for collaborative decision-making |
| `/dashboard/war-room` | **The War Room** | Critical issue room with consensus heatmap, debate graph, reasoning panel, and timeline scrubber |
| `/dashboard/constellation` | **Constellation** | Force-directed graph visualization of inter-agent relationships |
| `/console` | **Console** | Log terminal with console filters |

### OPERATIONS
| Route | Page | Description |
|---|---|---|
| `/agents` | **Task-Ops** | Task management with agent task cards, task reveal, and activity feed |
| `/dashboard/workflows` | **Workflows** | Visual workflow builder (React Flow canvas), node palette, execution log, favorites |
| `/dashboard/scheduler` | **Scheduler** | Calendar timeline with date columns, event creation modal, event detail panel, task card tray, and drag-and-drop |
| `/dashboard/notifications` | **Notifications** | Notification center |

### INTELLIGENCE
| Route | Page | Description |
|---|---|---|
| `/dashboard/capabilities` | **Capabilities** | Management of MCP servers and Skills assigned to agents |
| `/dashboard/observability` | **Observability** | Telemetry dashboards with charts, cost tracking |
| `/dashboard/memory` | **Memory** | Knowledge fragment and document management per agent |
| `/dashboard/audit` | **Audit Trail** | Chronological audit log viewer |

### STANDALONE
| Route | Page | Description |
|---|---|---|
| `/settings` | **Settings** | Provider management (add/edit/delete LLM providers), API key encryption, MCP server configuration, platform bridge setup |

---

## 4. Database Schema (Supabase / PostgreSQL)

The database is defined via Drizzle ORM in [schema.ts](file:///d:/AI%20Model/2-Antigravity%20Projects/NERV.OS/dashboard/drizzle/schema.ts) with **33 tables** organized into **14 subsystems**:

### 4.1 — Agent System (4 tables)
| Table | Purpose | Key Columns |
|---|---|---|
| `agents` | Core agent registry | `id`, `name`, `codename`, `role`, `avatar`, `heroImage`, `specialty` (JSONB), `temperature`, `status`, `activeHeroIndex` |
| `hero_images` | Gallery of hero images per agent | `agentId` → `agents.id`, `imageData` (Storage URL), `sortOrder` |
| `agent_provider_config` | Per-agent LLM provider assignment | `agentId` PK, `primaryProviderId`, `backupProviderId`, `modelId`, `configJson` |
| `agent_xp` | Agent XP/level/rank tracking | `agentId` PK, `totalXp`, `level`, `xpToNextLevel`, `rank` |

### 4.2 — Task & Summit System (4 tables)
| Table | Purpose | Key Columns |
|---|---|---|
| `tasks` | Task registry | `id`, `agentId`, `title`, `description`, `status`, `priority`, `completedAt` |
| `task_logs` | Streaming thought-process logs per task | `taskId` → `tasks.id`, `content`, `timestamp` |
| `summits` | Multi-agent deliberation sessions | `id`, `topic`, `status`, `consensusPlan`, `participatingAgents` (JSONB) |
| `summit_messages` | Round-based messages in summits | `summitId` → `summits.id`, `agentId`, `content`, `roundNumber`, `sentiment` |

### 4.3 — Provider System (2 tables)
| Table | Purpose | Key Columns |
|---|---|---|
| `providers` | LLM provider registry | `id`, `name`, `type`, `encryptedApiKey`, `baseUrl`, `isActive` |
| `provider_models` | Models per provider | `providerId` → `providers.id`, `modelId`, `displayName`, `contextWindow`, `pricingInput`, `pricingOutput`, `supportsVision`, `supportsTools` |

### 4.4 — Telemetry & Audit (2 tables)
| Table | Purpose | Key Columns |
|---|---|---|
| `telemetry_logs` | Per-request token/cost/latency tracking | `agentId`, `provider`, `model`, `inputTokens`, `outputTokens`, `costUsd`, `latencyMs`, `sessionId` |
| `audit_logs` | System-wide audit trail | `agentId`, `action`, `details`, `diffPayload`, `sessionId`, `summitId` |

### 4.5 — Memory System (4 tables)
| Table | Purpose | Key Columns |
|---|---|---|
| `conversations` | Conversation threads | `id`, `agentId`, `title`, `messageCount` |
| `conversation_messages` | Individual messages | `conversationId`, `role`, `content`, `tokenCount` |
| `knowledge_fragments` | Atomic knowledge pieces | `agentId`, `content`, `source`, `tags` (JSONB), `importance` |
| `knowledge_documents` | Uploaded documents | `agentId`, `fileName`, `fileType`, `content`, `sizeBytes`, `indexed` |

### 4.6 — Workflow System (3 tables)
| Table | Purpose | Key Columns |
|---|---|---|
| `workflows` | Workflow definitions | `id`, `name`, `description`, `steps` (JSONB), `schedule` (JSONB), `status` |
| `workflow_runs` | Execution history | `workflowId`, `status`, `stepResults` (JSONB), `triggeredBy`, `error` |
| `workflow_templates` | Reusable workflow templates | `id`, `name`, `category`, `steps` (JSONB) |

### 4.7 — Notifications & Alerts (2 tables)
| Table | Purpose | Key Columns |
|---|---|---|
| `notifications` | In-app notifications | `type`, `title`, `message`, `agentId`, `isRead`, `actionUrl` |
| `alert_rules` | Configurable alert triggers | `name`, `condition`, `threshold`, `severity`, `channels` (JSONB), `cooldownMs`, `isActive` |

### 4.8 — Scheduler & Webhooks (3 tables)
| Table | Purpose | Key Columns |
|---|---|---|
| `scheduled_tasks` | Cron-based scheduled tasks | `agentId`, `cronExpression`, `status`, `lastRunAt`, `nextRunAt` |
| `scheduler_events` | Calendar events | `agentId`, `title`, `scheduledDate`, `scheduledTime`, `durationMinutes`, `recurrenceType`, `priority`, `color` |
| `webhook_configs` | Inbound webhook configuration | `source`, `agentId`, `eventFilter`, `secret`, `isActive` |

### 4.9 — Platform Integrations (3 tables)
| Table | Purpose | Key Columns |
|---|---|---|
| `mcp_servers` | MCP server registry | `name`, `url`, `transport`, `tools` (JSONB), `assignedAgents` (JSONB), `status` |
| `platform_bridges` | External platform connections (Slack, Discord, etc.) | `platform`, `name`, `apiKey`, `webhookUrl`, `settings` (JSONB), `assignedAgents` (JSONB) |
| `api_keys` | Dashboard API key management | `name`, `keyHash`, `prefix`, `permissions` (JSONB), `expiresAt` |

### 4.10 — War Room (2 tables)
| Table | Purpose | Key Columns |
|---|---|---|
| `war_room_sessions` | Critical sessions | `topic`, `status`, `decision`, `actionItems` (JSONB), `linkedTasks` (JSONB), `participatingAgents` (JSONB) |
| `war_room_events` | Timestamped events in sessions | `sessionId`, `type`, `agentId`, `content`, `metadata` (JSONB) |

### 4.11 — Prompt Chunks (1 table)
| Table | Purpose | Key Columns |
|---|---|---|
| `prompt_chunks` | Reusable prompt fragments | `name`, `content`, `color`, `category`, `order` |

### 4.12 — Connection & Security (2 tables)
| Table | Purpose | Key Columns |
|---|---|---|
| `connection_secrets` | Encrypted secrets per service | `service`, `key`, `encryptedValue` |
| `connection_profiles` | Multi-profile connection configs | `name`, `isActive`, `openclawEnabled`, `openclawWsUrl`, `openclawHttpUrl`, `openclawAuthMode`, `agentZeroEnabled`, `agentZeroUrl`, `agentZeroTransport` |

### 4.13 — Gamification (5 tables)
| Table | Purpose | Key Columns |
|---|---|---|
| `xp_events` | XP transaction log | `agentId`, `amount`, `reason`, `sourceId` |
| `daily_missions` | Daily objectives | `date`, `title`, `type`, `target`, `current`, `xpReward`, `difficulty`, `isCompleted` |
| `achievements` | Achievement definitions | `name`, `description`, `icon`, `condition`, `xpReward`, `rarity` |
| `unlocked_achievements` | Which agent unlocked which achievement | `achievementId`, `agentId`, `unlockedAt` |
| `operations_streak` | Daily activity streak | `currentStreak`, `longestStreak`, `lastActiveDate`, `streakHistory` (JSONB) |

### 4.14 — Capabilities System (3 tables)
| Table | Purpose | Key Columns |
|---|---|---|
| `capability_mcps` | MCP capability definitions | `name`, `serverUrl`, `transport`, `tools` (JSONB), `authType`, `icon`, `category` |
| `capability_skills` | Skill definitions (reusable prompts/procedures) | `name`, `content`, `version`, `tags` (JSONB), `author` |
| `agent_capability_assignments` | Agent ↔ Capability binding | `agentId`, `capabilityType`, `capabilityId`, `isEnabled`, `configOverrides` |

---

## 5. API Routes (Backend)

All API routes live under `app/api/` and use Next.js App Router route handlers. They communicate with Supabase via the service-role key.

| Route Group | Endpoints | Purpose |
|---|---|---|
| `agent-zero/` | 8 files | Agent Zero proxy: chat, health, actions, contexts, sessions, messages |
| `agents/` | 2 files | CRUD for agents, hero images |
| `alerts/` | 2 files | Alert rule CRUD + trigger evaluation |
| `api-keys/` | 1 file | API key generation, listing, deletion |
| `audit/` | 2 files | Audit log query + creation |
| `bridges/` | 2 files | Platform bridge CRUD |
| `capabilities/` | 9 files | MCP capabilities, skills, agent assignments |
| `connection-profiles/` | 7 files | Connection profile CRUD, secrets, health checks |
| `gamification/` | 7 files | XP events, agents XP, missions, achievements, streaks |
| `mcp/` | 3 files | MCP server management |
| `memory/` | 5 files | Conversations, messages, knowledge fragments, documents |
| `notifications/` | 1 file | Notification CRUD + read/unread |
| `openclaw-proxy/` | 1 file | HTTP proxy to OpenClaw backend |
| `prompt-chunks/` | 2 files | Prompt chunk CRUD + reordering |
| `providers/` | 4 files | Provider + model CRUD with API key encryption |
| `scheduler/` | 5 files | Scheduled tasks, calendar events CRUD |
| `settings/` | 1 file | App-level settings |
| `storage/` | 1 file | Image upload/delete via Supabase Storage |
| `synthesize/` | — | AI synthesis endpoint |
| `telemetry/` | 2 files | Telemetry log ingest + query |
| `v1/` | 3 files | Public API v1 (external consumption) |
| `war-room/` | 3 files | War room sessions, events CRUD |
| `webhooks/` | 2 files | Inbound webhook receiver |
| `wipe-db/` | 1 file | Database wipe endpoint (dev only) |
| `workflows/` | 6 files | Workflow CRUD, runs, templates, execution |

---

## 6. State Management (Zustand Stores)

All stores are in `store/` and follow the `use[Name]Store.ts` pattern:

| Store | Purpose |
|---|---|
| `useAgentStore` | Agent list state, CRUD, active selection |
| `useAgentZeroStore` | Agent Zero integration state (sessions, messages, health) |
| `useAuditStore` | Audit log fetching and display |
| `useBridgesStore` | Platform bridges state |
| `useCapabilitiesStore` | MCP capabilities + skill management |
| `useConnectionStore` | Connection profiles, active connection, health status |
| `useGamificationStore` | XP, levels, missions, achievements, streaks |
| `useMCPStore` | MCP server connection state |
| `useMemoryStore` | Knowledge fragments + documents |
| `useNotificationStore` | In-app notification state |
| `useOpenClawStore` | OpenClaw Gateway connection, agent roster, chat events |
| `usePromptChunkStore` | Prompt chunk library |
| `useProviderStore` | LLM provider list + model catalog |
| `useSchedulerStore` | Calendar events, scheduled tasks |
| `useTaskStore` | Task list + active task |
| `useTelemetryStore` | Telemetry data fetching |
| `useThemeStore` | Theme preference (dark/light) |
| `useWarRoomStore` | War room sessions + events |
| `useWorkflowBuilderStore` | React Flow canvas state (nodes, edges, selection, undo/redo) |
| `useWorkflowStore` | Workflow definitions + runs |

---

## 7. Core Lib Services

### 7.1 — OpenClaw Gateway ([openclawGateway.ts](file:///d:/AI%20Model/2-Antigravity%20Projects/NERV.OS/dashboard/lib/openclawGateway.ts))
- **Native WebSocket** client (NOT Socket.io) implementing the OpenClaw protocol
- **Challenge-response handshake**: server sends `connect.challenge` → client signs nonce with ECDSA P-256 private key → sends `connect` frame with device identity
- **Device identity persistence** via `localStorage` (keypair + device ID)
- **Request/response correlation** with UUIDs and configurable timeouts
- **Auto-reconnect** with configurable delay
- **Event system** with subscribe/unsubscribe

### 7.2 — LLM Provider System ([lib/providers/](file:///d:/AI%20Model/2-Antigravity%20Projects/NERV.OS/dashboard/lib/providers))
10 provider adapters with a unified interface:
- **OpenAI** (`openai.ts`)
- **Anthropic** (`anthropic.ts`)
- **Google** (`google.ts`)
- **Groq** (`groq.ts`)
- **Mistral** (`mistral.ts`)
- **DeepSeek** (`deepseek.ts`)
- **Ollama** (`ollama.ts`) — local models
- **xAI** (`xai.ts`)
- **Together AI** (`together.ts`)
- **OpenClaw** (`openclaw.ts`)

Managed by `manager.ts` (provider lifecycle), `registry.ts` (adapter registration), `crypto.ts` (API key encryption/decryption), and `types.ts` (shared interfaces).

### 7.3 — Gamification Engine ([lib/gamification/](file:///d:/AI%20Model/2-Antigravity%20Projects/NERV.OS/dashboard/lib/gamification))
- `xpEngine.ts` — XP award/deduction logic with level-up calculation
- `xpRules.ts` — XP amounts per action type
- `missionGenerator.ts` — Daily mission generation logic
- `achievementChecker.ts` — Condition evaluation for unlocking achievements
- `seed.ts` — Default achievement definitions for initial setup

### 7.4 — Other Engines
| Engine | Files | Role |
|---|---|---|
| **Telemetry** | `costs.ts`, `logger.ts`, `types.ts` | Token cost calculation, telemetry logging |
| **Memory** | `context.ts`, `knowledge.ts`, `types.ts` | Conversation context builder, knowledge retrieval |
| **Workflows** | `engine.ts`, `scheduler.ts`, `types.ts` | Workflow step execution, cron scheduling |
| **Scheduler** | `engine.ts`, `types.ts` | Calendar event scheduling + recurrence |
| **War Room** | `engine.ts`, `types.ts` | Session lifecycle, event processing |
| **Bridges** | `engine.ts`, `types.ts` | Platform bridge connection + message routing |
| **MCP** | `client.ts`, `types.ts` | MCP protocol client for tool discovery |
| **Notifications** | `engine.ts`, `types.ts` | Notification creation, deduplication, delivery |

---

## 8. Workflow Builder

The visual workflow builder uses **React Flow** (@xyflow/react) and supports **11 node types**:

| Node | File | Purpose |
|---|---|---|
| `BaseNode` | 5.6 KB | Shared node shell with ports, styling |
| `TriggerNode` | 7.9 KB | Workflow entry point (webhook, cron, manual, event) |
| `AgentNode` | 1.2 KB | Assign work to a specific agent |
| `PromptNode` | 1.5 KB | LLM prompt step with template support |
| `ConditionNode` | 4.5 KB | Branching logic (if/else) |
| `DelayNode` | 3.4 KB | Timed wait step |
| `GroupNode` | 4.5 KB | Group sub-workflows |
| `SummitNode` | 5.0 KB | Trigger a multi-agent summit |
| `ToolNode` | 0.6 KB | Execute an MCP tool |
| `TransformNode` | 1.7 KB | Data transformation step |
| `OutputNode` | 0.7 KB | Workflow output/return step |

Supporting components: `WorkflowCanvas.tsx`, `NodePalette.tsx`, `NodeConfigPanel.tsx` (23.7 KB — extensive config UI), `CanvasToolbar.tsx`, `ExecutionLog.tsx`, `FavoritesModal.tsx`, plus custom edge types.

---

## 9. Chat System

| Component | Size | Purpose |
|---|---|---|
| `MessageRenderer.tsx` | 10 KB | Markdown rendering with syntax highlighting, code blocks |
| `ChatInputWithChunks.tsx` | 14.7 KB | Chat input with prompt-chunk insertion, hotkeys |
| `ChatHistorySidebar.tsx` | 8.9 KB | Conversation list + search |
| `UnifiedProcessTree.tsx` | 17.2 KB | Tool call and reasoning process visualization tree |
| `ThinkingPanel.tsx` | 3.3 KB | AI "thinking" indicator with streaming dots |
| `AgentZeroMessageCard.tsx` | 4.7 KB | Agent Zero-specific message formatting |

**Prompt Chunks** (7 components) allow users to create, color-code, categorize, and drag-inject reusable prompt fragments into the chat input.

---

## 10. Environment Configuration

Configuration is centralized in [lib/config.ts](file:///d:/AI%20Model/2-Antigravity%20Projects/NERV.OS/dashboard/lib/config.ts):

| Variable | Scope | Default | Purpose |
|---|---|---|---|
| `NEXT_PUBLIC_OPENCLAW_WS_URL` | Client | `ws://127.0.0.1:18789` | OpenClaw WebSocket endpoint |
| `NEXT_PUBLIC_OPENCLAW_HTTP_URL` | Client | `http://127.0.0.1:18789` | OpenClaw HTTP endpoint |
| `NEXT_PUBLIC_AGENT_ZERO_BASE_URL` | Client | `http://127.0.0.1:80` | Agent Zero base URL |
| `OPENCLAW_AUTH_TOKEN` | Server | — | Gateway auth token |
| `AGENT_ZERO_API_KEY` | Server | — | Agent Zero API key |
| `NEXT_PUBLIC_SUPABASE_URL` | Client | — | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Client | — | Supabase anonymous key |
| `SUPABASE_SERVICE_ROLE_KEY` | Server | — | Supabase service role key |
| `DATABASE_URL` | Server | — | PostgreSQL connection string (for Drizzle Kit) |

Remote detection logic (`IS_REMOTE_OPENCLAW`, `IS_REMOTE_AGENT_ZERO`) automatically adapts behavior based on whether the backend is localhost or a VPS.

---

## 11. Build & Performance Optimization

- **Turbopack** enabled for dev server (`next dev --turbopack`)
- **Server Actions** body size limit: `50MB` (for large image uploads)
- **Webpack chunk splitting** isolates heavy libs into dedicated chunks:
  - `xyflow` (React Flow)
  - `recharts` + d3 scale
  - `forcegraph` + d3 force
  - `tsparticles`
  - `highlightjs`
  - `markdown` (react-markdown + remark + rehype + unified + micromark)
- **React Strict Mode** is **disabled** (`reactStrictMode: false`)

---

## 12. File Storage (Supabase Storage)

Managed via [supabaseStorage.ts](file:///d:/AI%20Model/2-Antigravity%20Projects/NERV.OS/dashboard/lib/supabaseStorage.ts):

| Function | Purpose |
|---|---|
| `uploadImage(base64DataUri, path)` | Convert base64 → buffer → upload to `nerv-images` bucket → return public URL |
| `deleteImage(path)` | Remove file from storage |
| `isBase64DataUri(str)` | Detect if a string is a base64 data URI |
| `isStorageUrl(str)` | Detect if a string is a Supabase storage URL |
| `extractStoragePath(url)` | Extract the relative path from a public URL |

Used primarily for **agent hero images** and **avatar uploads**.

---

## 13. Authentication & Security

| Feature | Implementation |
|---|---|
| **Database access** | Supabase service-role key (server-only) — no RLS currently enforced |
| **API key encryption** | Provider API keys encrypted before storage, decrypted at runtime via `lib/providers/crypto.ts` |
| **OpenClaw device pairing** | ECDSA P-256 keypair generated in browser, persisted in `localStorage`, public key must be added to gateway's `paired.json` |
| **Connection secrets** | Stored encrypted in `connection_secrets` table |
| **No user auth** | The dashboard does not implement user authentication — it's designed as a single-operator tool |

---

## 14. Fonts & Theming

| Setting | Value |
|---|---|
| **Sans font** | Inter (Google Fonts) — `--font-geist-sans` |
| **Mono font** | JetBrains Mono (Google Fonts) — `--font-geist-mono` |
| **Default theme** | Dark (`className="dark"` on `<html>`) |
| **Theme toggle** | `ThemeToggle` component in sidebar footer |
| **Theme system** | `next-themes` via `ThemeProvider` |

---

## 15. Feature Completeness Checklist (for Audit)

| Feature | Frontend | API Routes | DB Tables | Store | Engine/Lib | Status |
|---|---|---|---|---|---|---|
| Agent Management | ✅ | ✅ | ✅ | ✅ | — | **Complete** |
| Agent Hero Images | ✅ | ✅ | ✅ | ✅ | ✅ Storage | **Complete** |
| Chat (OpenClaw) | ✅ | ✅ proxy | — | ✅ | ✅ Gateway | **Complete** |
| Chat (Agent Zero) | ✅ | ✅ | — | ✅ | ✅ Service | **Complete** |
| Summit | ✅ | ✅ | ✅ | — | — | **Partial** |
| War Room | ✅ | ✅ | ✅ | ✅ | ✅ | **Complete** |
| Constellation | ✅ | — | — | — | — | **Frontend only** |
| Console | ✅ | — | — | — | — | **Frontend only** |
| Task-Ops | ✅ | — | ✅ | ✅ | — | **Partial** |
| Workflows | ✅ | ✅ | ✅ | ✅ | ✅ | **Complete** |
| Scheduler | ✅ | ✅ | ✅ | ✅ | ✅ | **Complete** |
| Notifications | ✅ | ✅ | ✅ | ✅ | ✅ | **Complete** |
| Alerts | — | ✅ | ✅ | — | — | **Backend only** |
| Capabilities | ✅ | ✅ | ✅ | ✅ | — | **Complete** |
| Observability | ✅ | ✅ | ✅ | ✅ | ✅ | **Complete** |
| Memory | ✅ | ✅ | ✅ | ✅ | ✅ | **Complete** |
| Audit Trail | ✅ | ✅ | ✅ | ✅ | — | **Complete** |
| Providers | ✅ | ✅ | ✅ | ✅ | ✅ | **Complete** |
| Gamification | ✅ | ✅ | ✅ | ✅ | ✅ | **Complete** |
| Prompt Chunks | ✅ | ✅ | ✅ | ✅ | — | **Complete** |
| Connection Profiles | — | ✅ | ✅ | ✅ | — | **No dedicated page** |
| Bridges | — | ✅ | ✅ | ✅ | ✅ | **Settings sub-tab** |
| MCP Servers | — | ✅ | ✅ | ✅ | ✅ | **Settings sub-tab** |
| Webhooks | — | ✅ | ✅ | — | — | **Backend only** |
| API Keys | — | ✅ | ✅ | — | — | **Backend only** |
| API v1 (Public) | — | ✅ | — | — | — | **3 endpoints** |

---

> **Use this document to audit each feature end-to-end: check if the frontend, API, DB, store, and engine layers are all wired up correctly and match expected behavior.**
