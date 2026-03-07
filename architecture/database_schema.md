# SOP: sqlite_schema

## Overview
We use **SQLite** (via `better-sqlite3` and `drizzle-orm`) for local persistence of data that transcends a single session but isn't stored in the OpenClaw Gateway.

## Tables

### 1. `tasks`
Stores the history and current state of tasks assigned to agents.

```sql
CREATE TABLE tasks (
    id TEXT PRIMARY KEY,           -- UUID
    title TEXT NOT NULL,
    description TEXT,
    agent_id TEXT NOT NULL,        -- 'daisy-slack', etc.
    status TEXT NOT NULL,          -- 'PENDING', 'IN_PROGRESS', 'DONE', 'FAILED'
    priority TEXT DEFAULT 'MEDIUM',
    created_at INTEGER NOT NULL,   -- Unix Timestamp
    completed_at INTEGER
);
```

### 2. `task_logs`
Streaming logs/thoughts associated with a task.

```sql
CREATE TABLE task_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    task_id TEXT NOT NULL,
    content TEXT NOT NULL,
    timestamp INTEGER NOT NULL,
    FOREIGN KEY(task_id) REFERENCES tasks(id)
);
```

### 3. `summits`
Records of multi-agent deliberation sessions.

```sql
CREATE TABLE summits (
    id TEXT PRIMARY KEY,
    topic TEXT NOT NULL,
    status TEXT NOT NULL,          -- 'ACTIVE', 'RESOLVED'
    consensus_plan TEXT,           -- Markdown of final plan
    created_at INTEGER NOT NULL
);
```

### 4. `summit_messages`
The transcript of the summit.

```sql
CREATE TABLE summit_messages (
    id TEXT PRIMARY KEY,
    summit_id TEXT NOT NULL,
    agent_id TEXT NOT NULL,
    content TEXT NOT NULL,
    round_number INTEGER NOT NULL,
    sentiment TEXT,                -- 'AGREE', 'DISAGREE', 'PROPOSE'
    timestamp INTEGER NOT NULL,
    FOREIGN KEY(summit_id) REFERENCES summits(id)
);
```

## Migration Strategy
- Use **Drizzle Kit** for migrations.
- Store migrations in `drizzle/`.
- Run migrations on app startup.
