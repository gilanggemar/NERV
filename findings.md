# Findings

## Research & Discoveries
- [2026-02-19]: Initialized project memory.
- [2026-02-19]: **North Star**: Single/Multi-agent command dashboard (NERV. Center) replacing Slack.
- [2026-02-19]: **Stack**: Next.js 15, Tailwind, shadcn/ui, WebSocket, SQLite, OpenClaw Gateway.
- [2026-02-19]: **Agents**: Daisy, Ivy, Celia, Thalia (running locally).
- [2026-02-19]: **Key Features**: Task Manager, Multi-Agent Chat, Summit (Deliberation), Agent Config.
- [2026-02-19]: **Gateway Protocol**: OpenClaw uses WebSocket JSON-RPC at `ws://127.0.0.1:18789`.
    - Handshake required (`connect` method).
    - Authentication via token in handshake.
    - Role `operator` is valid. `admin` is invalid.
    - `agent.list` method exists but requires `operator.admin` scope (which we lack).
    - `chat.send` is the primary command method.

## Constraints
- Strict adherence to B.L.A.S.T. protocol.
- Local-first architecture (SQLite, localhost gateway).
- "Premium Minimalist" UI aesthetic.
