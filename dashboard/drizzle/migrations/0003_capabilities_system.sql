-- Capabilities System Tables

CREATE TABLE IF NOT EXISTS capability_mcps (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  server_url TEXT NOT NULL,
  transport TEXT NOT NULL DEFAULT 'sse',
  status TEXT NOT NULL DEFAULT 'active',
  auth_type TEXT DEFAULT 'none',
  encrypted_credentials TEXT,
  tools JSONB DEFAULT '[]'::jsonb,
  icon TEXT,
  category TEXT DEFAULT 'general',
  config_json JSONB DEFAULT '{}'::jsonb,
  last_health_check TIMESTAMPTZ,
  last_health_status TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS capability_skills (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  content TEXT NOT NULL,
  version TEXT DEFAULT '1.0.0',
  status TEXT NOT NULL DEFAULT 'active',
  category TEXT DEFAULT 'general',
  icon TEXT,
  tags JSONB DEFAULT '[]'::jsonb,
  config_json JSONB DEFAULT '{}'::jsonb,
  author TEXT DEFAULT 'user',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS agent_capability_assignments (
  id TEXT PRIMARY KEY,
  agent_id TEXT NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  capability_type TEXT NOT NULL,
  capability_id TEXT NOT NULL,
  is_enabled BOOLEAN NOT NULL DEFAULT true,
  config_overrides JSONB DEFAULT '{}'::jsonb,
  assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- RLS (open policies, matching existing pattern)
ALTER TABLE capability_mcps ENABLE ROW LEVEL SECURITY;
ALTER TABLE capability_skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_capability_assignments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all on capability_mcps" ON capability_mcps FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on capability_skills" ON capability_skills FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on agent_capability_assignments" ON agent_capability_assignments FOR ALL USING (true) WITH CHECK (true);

-- Index for fast agent lookups
CREATE INDEX idx_agent_capability_agent_id ON agent_capability_assignments(agent_id);
CREATE INDEX idx_agent_capability_type ON agent_capability_assignments(capability_type);
