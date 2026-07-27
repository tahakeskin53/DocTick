---
tier: core
decided_at: 2026-07-21T14:59:05
id: dec-2026-07-21-install-memkraft-in-project-venv-not-globally
linked_incidents: []
recorded_at: 2026-07-21T14:59:05
source: seed
status: accepted
tags: ["environment"]
title: Install memkraft in project venv, not globally
type: decision
valid_from: 2026-07-21T14:59:05
valid_to: null
---
# Install memkraft in project venv, not globally

## What
Install memkraft in project venv, not globally

## Why
User wanted project-specific ('global değil'). Keeps global Python clean.

## How
python -m venv .venv; .venv/Scripts/pip install memkraft.

## Outcome

## Linked Incidents
