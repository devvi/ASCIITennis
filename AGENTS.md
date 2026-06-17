# ASCIITennis — Agent Guide

## Planning Workflow

All work follows a strict three-phase process:

### /research
Analyze the issue/request.
Outputs:
- `docs/PRD/<issue-number>-<feature-name>.md` — product requirements, feature list, acceptance criteria
- `docs/TASKS/<issue-number>-<feature-name>.md` — related modules, impacts, summary

**CRITICAL:** The research PR description, title, and commit messages MUST NEVER contain `Closes`, `Fixes`, or `Resolves` keywords referencing the parent issue. Parent issue must stay open for subsequent phases.

When creating the research PR via `gh pr create`, use:
```
gh pr create --title "Research: <feature-name> (parent #<parent-issue>)" \
  --body "Research analysis for parent issue #<parent-issue>.\nSee docs/PRD/<parent-issue>.md and docs/TASKS/<parent-issue>.md for details."
```

**Verification step:** After creating the PR, run `gh pr view <pr-number> --json title,body` and check that neither field contains `Closes`, `Fixes`, or `Resolves`. If found, edit the PR body with `gh pr edit <pr-number> --body '...'` to remove them.

### /plan
Using the research doc, create a phased plan.
Outputs:
- `docs/DESIGN/<issue-number>-<feature-name>.md` — architecture, data structures, module design
- Append phases to `docs/TASKS/<issue-number>-<feature-name>.md`
- Create **one consolidated plan issue** containing all phases as task lists (title: `[<issue-number>] Plan: <feature-name>`), labels: `phase`, parent issue in body

Format:
- Phase 1: Tests (write test cases first — TDD)
- Phase 2: Data structures
- Phase 3: Core logic
- Phase 4: UI/output

**Create one consolidated plan issue:**
After writing the DESIGN and TASKS docs, use `gh` to create a single issue:
```
gh issue create --title "[<parent-issue>] Plan: <feature-name>" \
  --label "phase" \
  --body "Parent: #<parent-issue>\nSee docs/DESIGN/<parent-issue>.md for design details.\n\n### Phase 1: Tests\n- [ ] Task 1\n\n### Phase 2: Data structures\n- [ ] Task 1\n\n### Phase 3: Core logic\n- [ ] Task 1\n\n### Phase 4: UI/output\n- [ ] Task 1"
```
Record the returned issue number as `PLAN_ISSUE` in `docs/TASKS/<issue-number>-<feature-name>.md`.

**You MUST run the `gh issue create` command above — do not just write it as documentation.**

**CRITICAL:** The plan issue body, title, and any associated PR/commit messages MUST NOT contain `Closes`/`Fixes`/`Resolves` for the parent issue — use `Parent:` only. Parent must stay open for the subsequent implement phase.

**Verification step:** After creating the plan issue, run `gh issue view <plan-issue-n> --json title,body` and check that neither field contains `Closes`, `Fixes`, or `Resolves`. If found, edit immediately with `gh issue edit <plan-issue-n> --body '...'` to remove them.

### /implement
Read the TASK file and execute strictly phase by phase.
**Rules:**
- No extra features beyond what's in the plan
- No scope creep
- **TDD is mandatory:** Phase 1 must write test cases first, before any implementation code. For phases 2-4, write tests alongside or before the code they test.

**Input test cases are mandatory:** Every test-writing phase MUST include test cases for the input module (`src/input.js`), covering at minimum:
- `pressed()`, `held()`, `released()` state management
- `get_movement()` returns correct dx/dz for directional keys
- `get_shot_type()` returns correct shot (flat/topspin/slice/lob) for combo inputs
- `get_serve()` returns true on BTN_B or BTN_A press
- Keyboard `keydown`/`keyup` events update virtual button states correctly
- Mouse `mousedown`/`mouseup` events set BTN_A and BTN_B correctly
- `update()` correctly snapshots previous frame state for pressed/released detection
- As each task within a phase is done, check it off in the plan issue body using `gh issue edit <plan-issue-n> --body '<updated body>'`
- After each completed phase, commit and push — commit message should mention progress but NOT close the plan issue
- After all phases done, create the final PR. PR description MUST include `Closes #<parent-issue>` and `Closes #<plan-issue>` to auto-close all generated issues on merge.

When creating the final PR via `gh pr create`, use:
```
gh pr create --title "<feature-name>" \
  --body "Closes #<parent-issue>\nCloses #<plan-issue>\n\n<summary of changes>"
```

**Verification step:** After creating the PR, run `gh pr view <pr-number> --json title,body` and confirm BOTH `Closes #<parent-issue>` and `Closes #<plan-issue>` are present in the body. If missing, edit with `gh pr edit <pr-number> --body '...'` to add them.

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

## Git Workflow

### Pushing
Always pull before push:
```bash
git pull --rebase && git push
```
This avoids rejected pushes due to remote changes.

## CI: Automated PR Review (Self-Healing)

Every pull request is automatically processed by opencode:
1. **Run tests** — if tests fail, opencode auto-fixes them and pushes (self-healing loop)
2. **Review & fix critical issues** — if tests pass, opencode checks for bugs/security/logic errors, fixes them, and pushes
3. **Post review** — if no critical issues found, opencode posts a normal code review
4. **Manual fix** — reviewer comments `/oc fix <suggestion>` and opencode applies the change

## Testing

Uses **Vitest** (Node.js). Tests live in `tests/*.test.js`.

```bash
npm test          # run once
npm run test:watch  # watch mode
```

**TDD is mandatory:** write tests before or alongside implementation code.

## Setup

```bash
npm install
```

## Architecture

ASCIITennis: an ASCII-art tennis game. No code yet.
