# ASCIITennis — Agent Guide

## Planning Workflow

All work follows a strict three-phase process:

### /research
Analyze the issue/request.
Outputs:
- `docs/PRD/<issue-number>-<feature-name>.md` — product requirements, feature list, acceptance criteria
- `docs/TASKS/<issue-number>-<feature-name>.md` — related modules, impacts, summary

**IMPORTANT:** If creating a PR to merge research docs, the PR description MUST NOT include any closing keywords (Closes/Fixes/Resolves) referencing the parent issue. Parent issue stays open for subsequent phases.

### /plan
Using the research doc, create a phased plan.
Outputs:
- `docs/DESIGN/<issue-number>-<feature-name>.md` — architecture, data structures, module design
- Append phases to `docs/TASKS/<issue-number>-<feature-name>.md`
- Create a GitHub Issue for each phase (title: `[<issue-number>] Phase N: <name>`), labels: `phase`, parent issue in body

Format:
- Phase 1: Tests (write test cases first — TDD)
- Phase 2: Data structures
- Phase 3: Core logic
- Phase 4: UI/output

**Create GitHub Issues for each phase:**
After writing the DESIGN and TASKS docs, use `gh` to create one issue per phase:
```
gh issue create --title "[<parent-issue>] Phase <N>: <name>" \
  --label "phase" \
  --body "Parent: #<parent-issue>\nSee docs/DESIGN/<parent-issue>.md for design details.\n\n### Tasks\n- [ ] Task 1\n- [ ] Task 2"
```
Record the returned issue numbers in `docs/TASKS/<issue-number>-<feature-name>.md` under each phase.

**You MUST run the `gh issue create` commands above — do not just write them as documentation.**

**IMPORTANT:** Do NOT include closing keywords for the parent issue in the plan PR/commit. Parent stays open.

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
- As each task within a phase is done, check it off in the phase issue body using `gh issue edit <phase-issue-n> --body '<updated body>'`
- After each completed phase, commit and push, with `Closes #<phase-issue-n>` in the commit message to close that phase issue on merge
- After all phases done, create the final PR — PR description MUST include `Closes #<parent-issue>` plus `Closes #<phase-1>, Closes #<phase-2>, ...` to auto-close the parent and all phase issues on merge

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
