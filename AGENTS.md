# ASCIITennis — Agent Guide

## Planning Workflow

All work follows a strict three-phase process:

### /research
Analyze the issue/request, then write findings to `docs/TASKS/<issue-number>.md`.
Format:
- **Related modules**: list affected areas
- **Impacts**: systems that will be affected
- **Summary**: brief analysis of what's needed

### /plan
Using the research doc, create a phased implementation plan appended to `docs/TASKS/<issue-number>.md`.
Format:
- Phase 1: Data structures
- Phase 2: Core logic
- Phase 3: UI/output
- Phase 4: Testing

### /implement
Read the TASK file and execute strictly phase by phase.
**Rules:**
- No extra features beyond what's in the plan
- No scope creep
- Commit after each completed phase

## Workflow

1. `opencode research this` — research & save to docs/TASKS/
2. `opencode plan this` — create phased plan
3. `opencode implement this` — execute per plan

## Commands

- `opencode research <request>` — analyze and document
- `opencode plan <request>` — create phased plan
- `opencode implement <request>` — execute per plan
- `opencode test <request>` — write/run tests
- `opencode review <request>` — review code

## Setup

No setup required. Initialize the project from scratch.

## Architecture

ASCIITennis: an ASCII-art tennis game. No code yet.
