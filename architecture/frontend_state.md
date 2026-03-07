# SOP: Frontend State Management

## Overview
We use **Zustand** for global client-side state. The state is divided into logical slices to manage agents, tasks, and chat sessions independently.

## Stores

### 1. Agent Store (`useAgentStore`)
**Purpose**: Tracks live status of all agents.
**Source of Truth**: `openclaw.json` (static config) + WebSocket `agent` events (dynamic status).

```typescript
type AgentStatus = 'ONLINE' | 'WORKING' | 'THINKING' | 'QUEUED' | 'OFFLINE' | 'IN_SUMMIT' | 'PAUSED';

interface Agent {
  id: string;        // e.g., "daisy-slack"
  name: string;      // e.g., "Daisy"
  avatar: string;    // URL or local path
  model: string;     // Current model ID
  status: AgentStatus;
  currentTask: string | null;
  workspacePath: string;
}

interface AgentState {
  agents: Record<string, Agent>;
  
  // Actions
  upsertAgent: (agent: Agent) => void;
  updateStatus: (id: string, status: AgentStatus) => void;
  setAgentModel: (id: string, model: string) => void;
}
```

### 2. Task Store (`useTaskStore`)
**Purpose**: Manages the Kanban/Pipeline view of tasks.
**Persistence**: Synced with SQLite (via API).

```typescript
interface Task {
  id: string;
  title: string;
  agentId: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'DONE' | 'FAILED';
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  logs: string[]; // Live streaming logs
  updatedAt: number;
}

interface TaskState {
  tasks: Record<string, Task>;
  
  // Actions
  addTask: (task: Task) => void;
  updateTask: (id: string, updates: Partial<Task>) => void;
  appendLog: (taskId: string, log: string) => void;
}
```

### 3. Chat Store (`useChatStore`)
**Purpose**: Manages active chat sessions and multi-agent "Summits".

```typescript
interface Message {
  id: string;
  senderId: string; // Agent ID or 'user'
  content: string;
  timestamp: number;
  sentiment?: 'AGREE' | 'DISAGREE' | 'NEUTRAL'; // For Summits
}

interface ChatSession {
  id: string;
  participants: string[]; // Agent IDs
  messages: Message[];
  isSummit: boolean;
  topic?: string;
}

interface ChatState {
  sessions: Record<string, ChatSession>;
  activeSessionId: string | null;
  
  // Actions
  setActiveSession: (id: string) => void;
  addMessage: (sessionId: string, message: Message) => void;
  addParticipant: (sessionId: string, agentId: string) => void;
}
```

## Invariants
1. **No Derived State in Store**: Keep stores minimal. Use selectors for derived data (e.g., `activeAgents`).
2. **Optimistic Updates**: UI updates immediately; revert on WebSocket error.
3. **Immutability**: Always use spread or Immer (via Zustand middleware) for updates.
