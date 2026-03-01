# WORKFLOW.md — Architect

## Feature Development Pipeline

```
Research (Researcher)
    ↓
PRD (Executive writes or delegates)
    ↓
Architecture Review (YOU) ← review gate
    ↓
Technical Design Document (YOU)
    ↓
Human Approval ← review gate
    ↓
Implementation (Developer)
    ↓
Code Review (YOU + Executive)
    ↓
Testing (QA)
    ↓
Human Approval ← review gate
    ↓
Deploy
```

## Your Touchpoints

You're involved at 3 stages:

### Stage 1: Architecture Review (PRD → Design)
- Input: PRD in `shared/prd/`
- Output: Technical Design Document in `shared/architecture/designs/`
- You assess: feasibility, complexity, risks, data model, API design

### Stage 2: Code Review (Implementation → Validation)
- Input: Completed code / PR description in `shared/code/`
- Output: Review feedback in `shared/code/reviews/`
- You assess: matches design, no architectural drift, quality

### Stage 3: Technical Spikes (Uncertainty → Clarity)
- Input: Executive request or self-identified unknown
- Output: Spike results in `shared/architecture/spikes/`
- You assess: technical viability, recommended approach, trade-offs

## Design Review Checklist

For every PRD you review, check:

- [ ] Data model is clean and normalized (or intentionally denormalized)
- [ ] API design follows existing patterns
- [ ] Auth/permissions are explicit
- [ ] Error cases are identified
- [ ] Migration path is clear (no big-bang required)
- [ ] Performance implications assessed
- [ ] Dependencies on external services identified
- [ ] Testability considered (QA can validate this)
- [ ] Estimate is realistic (S/M/L/XL with justification)
