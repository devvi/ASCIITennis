# ASCIITennis — Agent Guide

## Planning Workflow

All work follows a strict three-phase process:

**⚠️ PHASE GATE RULE: Each phase MUST be triggered independently. After completing one phase, STOP. Do NOT auto-advance to the next phase. The next phase may only start after the previous phase's output (PR or issue) has been reviewed and merged by a human.**

### /research
Analyze the issue/request.
Outputs:
- `docs/PRD/<issue-number>-<feature-name>.md` — product requirements, feature list, acceptance criteria
- `docs/TASKS/<issue-number>-<feature-name>.md` — related modules, impacts, summary

**CRITICAL:** The research PR description, title, and commit messages MUST NEVER contain `Closes`, `Fixes`, or `Resolves` keywords referencing the parent issue. Parent issue must stay open for subsequent phases.

Write the PR body with a detailed research summary (root cause, findings, proposed approach — same rich content as before). The only constraint: avoid `Closes`, `Fixes`, or `Resolves` for the parent issue.

When creating the research PR via `gh pr create`, write body to a temp file and sanitize it before submission:
```bash
# Write body to temp file
cat > /tmp/pr_body.md << 'BODY'
<detailed research summary — root cause, findings, proposed approach>
BODY
# Strip Closes/Fixes/Resolves lines referencing the parent issue
sed -i '/\(Closes\|Fixes\|Resolves\) #<parent-issue>/d' /tmp/pr_body.md
gh pr create --title "Research: <feature-name> (parent #<parent-issue>)" \
  --body-file /tmp/pr_body.md
```

**Verification step:** After creating the PR, run `gh pr view <pr-number> --json title,body` and check that neither field contains `Closes`, `Fixes`, or `Resolves` for the parent issue. If found, use `gh api` to fix (since `gh pr edit` may fail due to missing `read:org` scope):
```bash
gh api -X PATCH "repos/{owner}/{repo}/pulls/<pr-number>" \
  --field title="Research: <feature-name> (parent #<parent-issue>)" \
  --field body="Parent: #<parent-issue>\n\n<detailed research summary>"
```

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

**Verification step:** After creating the PR, run `gh pr view <pr-number> --json title,body` and confirm BOTH `Closes #<parent-issue>` and `Closes #<plan-issue>` are present in the body. If missing, use `gh api` to fix (since `gh pr edit` may fail due to missing `read:org` scope):
```bash
gh api -X PATCH "repos/{owner}/{repo}/pulls/<pr-number>" \
  --field body="Closes #<parent-issue>\nCloses #<plan-issue>\n\n<summary of changes>"
```

## Workflow

- `opencode research this` — research & save to docs/PRD/ and docs/TASKS/
- `opencode plan this` — create design & phased plan
- `opencode implement this` — execute per plan

Each command is an independent trigger. After any command, the CI MUST stop and wait for human review/merge before the next command can be issued.

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

## Deployment

GitHub Pages serves from `gh-pages` branch (not `main`).

| Branch | URL |
|--------|-----|
| `main` | `https://devvi.github.io/ASCIITennis/` (deployed by `.github/workflows/deploy-main.yml`) |
| `pr-<N>` | `https://devvi.github.io/ASCIITennis/pr-<N>/` (deployed by `.github/workflows/deploy-preview.yml`) |

PR previews are auto-deployed on open/sync. A comment with the preview URL is posted on each PR.

## Architecture

ASCIITennis: an ASCII-art tennis game. No code yet.
