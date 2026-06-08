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

opencode analyzes the request and writes `docs/TASKS/<issue-number>.md` with:

```markdown
## Related modules
- module A
- module B

## Impacts
- system X
- system Y

## Summary
Brief analysis of what's needed
```

### Phase 2: Plan

```
/opencode plan this
```

opencode reads the research doc and appends a phased plan:

```markdown
## Plan

### Phase 1: Data structures
### Phase 2: Core logic
### Phase 3: UI/output
### Phase 4: Testing
```

### Phase 3: Implement

```
/opencode implement this
```

opencode executes the plan **strictly phase by phase**:
- No extra features beyond the plan
- No scope creep
- Commit after each completed phase
- Final commit opens a PR

### Directory Structure

```
docs/
├── PRD/           # Product requirement docs
├── DESIGN/        # Design documents
└── TASKS/         # Task breakdowns (<issue-number>.md)
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
| `/opencode research this` | Issue comment | Analyze and document |
| `/opencode plan this` | Issue comment | Create phased plan |
| `/opencode implement this` | Issue comment | Execute plan, open PR |
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
