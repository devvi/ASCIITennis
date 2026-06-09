# ASCIITennis — Workflow Instructions

## Overview

Two automated pipelines driven by opencode + GitHub Actions:

| Pipeline | Trigger | What happens |
|----------|---------|-------------|
| **Issue → Feature** | Create Issue, comment `/opencode research/plan/implement` | Research, plan, code, submit PR |
| **PR Review** | Open/update PR | Auto review, `/oc fix` applies changes |

---

## 1. Issue → Feature Pipeline

Three-phase execution on any GitHub issue.

### Phase 1: Research

Comment on the issue:

```
/opencode research this
```

opencode analyzes the request and writes two documents:

**`docs/PRD/<issue-number>.md`** — Product requirements:
```markdown
## Features
- feature 1
- feature 2

## Acceptance Criteria
- [ ] criterion 1
- [ ] criterion 2
```

**`docs/TASKS/<issue-number>.md`** — Initial analysis:
```markdown
## Related modules
- module A
- module B

## Impacts
- system X
- system Y
```

> **Important:** The research PR description must NOT include closing keywords (Closes/Fixes/Resolves) for the parent issue. Parent stays open for plan + implement.

### Phase 2: Plan

```
/opencode plan this
```

opencode reads the research doc and creates:

**`docs/DESIGN/<issue-number>.md`** — Technical design:
```markdown
## Architecture
- module layout
- data flow

## Data Structures
- struct definitions

## Module Design
- component interfaces
```

Then appends phases to **`docs/TASKS/<issue-number>.md>`**:
```markdown
## Plan

### Phase 1: Data structures
### Phase 2: Core logic
### Phase 3: UI/output
### Phase 4: Testing
```

Then creates one GitHub Issue per phase using `gh issue create` with label `phase`. The returned issue numbers are recorded in the TASKS doc.

### Phase 3: Implement

```
/opencode implement this
```

opencode executes the plan **strictly phase by phase**:
- No extra features beyond the plan
- No scope creep
- Commit after each completed phase, referencing its phase issue (`Closes #N`)
- After all phases, create the final PR with `Closes #parent-issue` + all phase issues
- All issues auto-close on merge

### Directory Structure

```
docs/
├── PRD/           # Product requirements (<issue-number>.md)
├── DESIGN/        # Technical design (<issue-number>.md)
└── TASKS/         # Task breakdowns & phases (<issue-number>.md)
```

---

## 2. PR Review Pipeline

Automatically triggered when a PR is opened or updated.

### Auto Review

opencode posts a PR review covering:
- Code quality and conventions
- Potential bugs and edge cases
- Security concerns
- Implementation vs intent
- Improvement suggestions

### Fix on Comment

Reviewer comments on a specific code line:

```
/oc add error handling here
```

opencode implements the fix and commits it to the same PR branch.

---

## 3. Quick Reference

| Command | Where | What it does |
|---------|-------|-------------|
| `/opencode research this` | Issue comment | Analyze and document (no close keywords for parent) |
| `/opencode plan this` | Issue comment | Create phased plan + `gh issue create` per phase |
| `/opencode implement this` | Issue comment | Execute phase by phase, each commit closes a phase issue; final PR closes parent |
| `/opencode explain this issue` | Issue comment | Explain the issue |
| `/oc <suggestion>` | PR review comment | Apply fix to PR |
| _(automatic)_ | PR opened/updated | Code review |

---

## 4. Workflow Files

```
.github/workflows/
├── opencode.yml          # Issue → Feature pipeline + interactive commands
└── opencode-review.yml   # Automated PR review
```

- `opencode.yml` — Triggered by `/opencode` and `/oc` in comments; also on issue/PR events
- `opencode-review.yml` — Triggered on PR open/sync/reopen; posts review automatically
