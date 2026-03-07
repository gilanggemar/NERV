# Project Constitution (gemini.md)

## 1. Data Schemas

### Source of Truth (`openclaw.json`)
Structure for Agent Configuration:
```json
{
  "agents": {
    "list": [
      { "id": "string", "workspace": "string", "default": "boolean" }
    ],
    "defaults": {
      "model": { "primary": "string" },
      "workspace": "string",
      "maxConcurrent": "number"
    }
  },
  "auth": { "profiles": { "provider:id": { "mode": "string", "key": "string" } } }
}
```

### Dashboard Logic Schemas

#### **Agent State** (Runtime)
```typescript
interface AgentState {
  id: string; // e.g., "daisy-slack"
  name: string; // e.g., "Daisy"
  status: 'ONLINE' | 'WORKING' | 'THINKING' | 'QUEUED' | 'OFFLINE' | 'IN_SUMMIT' | 'PAUSED';
  currentModel: string;
  currentTask: string | null;
  uptime: number; // seconds
  tokenUsage: { input: number; output: number };
}
```

#### **Task**
```typescript
interface Task {
  id: string;
  agentId: string; // Assigned agent
  description: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  subtasks: { name: string; status: 'PENDING' | 'DONE' | 'FAILED' }[];
  logs: string[]; // Streamed thought process
  createdAt: number;
  startedAt?: number;
  completedAt?: number;
}
```

#### **Summit** (Multi-Agent Deliberation)
```typescript
interface Summit {
  id: string;
  topic: string;
  status: 'ACTIVE' | 'RESOLVED' | 'ARCHIVED';
  participants: string[]; // Agent IDs
  rounds: {
    roundNumber: number;
    messages: { agentId: string; content: string; sentiment: 'AGREE' | 'DISAGREE' | 'PROPOSE' }[];
  }[];
  outcome?: string; // Final agreed plan
  createdAt: number;
}
```

## 2. Behavioral Rules
- **Data-First:** No coding until Schema is defined (DONE).
- **Self-Annealing:** Analyze -> Patch -> Test -> Update Architecture.
- **Reliability > Speed:** Deterministic flows for business logic.
- **UI/UX:** "Premium Minimalist" aesthetic (shadcn/ui, Tailwind, Framer Motion).
- **No Ghosts:** Check `.RPG_Map.md` before importing.

## 3. Architectural Invariants
- **Frontend**: Next.js 15 (App Router) + Tailwind CSS v4 + shadcn/ui.
- **State**: Zustand (Client) + SQLite (Local DB).
- **Comms**: WebSocket (Real-time).
- **Backend**: OpenClaw Gateway (localhost:18789).
- **Directory Structure:**
  - `architecture/`: SOPs.
  - `tools/`: Python/Node scripts.
  - `.tmp/`: Intermediate files.

## 4. Maintenance Log
- [2026-02-19]: Project Initialized. Schemas defined.
