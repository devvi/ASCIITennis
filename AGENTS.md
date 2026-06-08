# ASCIITennis — Agent Guide

## Planning Workflow

All work follows a strict three-phase process:

### /research
Analyze the issue/request.
Outputs:
- `docs/PRD/<issue-number>-<feature-name>.md` — product requirements, feature list, acceptance criteria
- `docs/TASKS/<issue-number>-<feature-name>.md` — related modules, impacts, summary

### /plan
Using the research doc, create a phased plan.
Outputs:
- `docs/DESIGN/<issue-number>-<feature-name>.md` — architecture, data structures, module design
- Append phases to `docs/TASKS/<issue-number>-<feature-name>.md`

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

1. `opencode research this` — research & save to docs/PRD/ and docs/TASKS/
2. `opencode plan this` — create design & phased plan
3. `opencode implement this` — execute per plan

## Commands

- `opencode research <request>` — analyze and document
- `opencode plan <request>` — create phased plan
- `opencode implement <request>` — execute per plan
- `opencode test <request>` — write/run tests
- `opencode review <request>` — review code

## CI: Automated PR Review

Every pull request is automatically reviewed by opencode:
- Opens a PR review with code quality, bug, and security feedback
- Reviewer can comment `/oc fix <suggestion>` to request changes
- opencode will implement the fix and commit to the same PR

## Setup

No setup required. Initialize the project from scratch.

## Architecture

ASCIITennis: an ASCII-art tennis game. No code yet.
