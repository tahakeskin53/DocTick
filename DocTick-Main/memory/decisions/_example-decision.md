---
tier: recall
type: decision
date: 2026-01-01
---

# Decision: Use MemKraft for compound memory

## Context
We needed a zero-dependency, file-native memory layer for AI agents.

## Decision
Adopt MemKraft as the durable memory substrate.

## Why
- Markdown-first (human-readable + diffable)
- Zero DB requirements for the core features
- Works with Claude Code, Cursor, OpenAI, MCP

## Alternatives considered
- Pure vector DB (too heavy, no human-readable surface)
- Plain text notes (no structure, no search)
