# Agent Handoff Protocol

## Handoff Format

When completing a task, output:

```yaml
handoff:
  from: XX-agent-name
  to: XX-agent-name
  status: complete | needs_review | blocked
  outputs:
    files:
      - path/to/file.ext
    decisions:
      - "Decision made: X"
  context:
    key_info: "Information next agent needs"
  blockers: [] # If status is blocked
```

## Guardian Agent Veto

Guardian agents (03, 07, 09, 10, 11, 17) can VETO and return to sender:

```yaml
veto:
  from: 03-performance-guardian
  to: 19-landing-generator
  reason: "JS bundle exceeds 100KB limit"
  requirement: "Reduce bundle size before proceeding"
  specific_issues:
    - file: src/components/Hero.astro
      issue: "client:load not justified"
```

## Veto Resolution

1. Sender agent attempts to fix issues
2. If unable to fix, escalate to 04-orchestrator
3. Orchestrator makes final decision
4. Decision documented in _PROJECT-STATE.md

## Parallel Execution

These agents can run in parallel:
- 01-market-intelligence + 05-discovery
- 02-copy + 14-template-architecture
- 22-schema + 23-internal-linking + 24-llm-optimization
- 03-performance-guardian + 09-security

## Sequential Dependencies

```
05-discovery
    ↓
06-content-strategy
    ↓
├── 14-template-architecture
│       ↓
│   15-ux-ui-architecture
│       ↓
│   13-implementation
│
├── 02-copy
│       ↓
│   19-landing-generator
│
└── 21-calculator-configurator
        ↓
    [merge point]
        ↓
    20-seo-cluster-generator
        ↓
    ├── 22-schema
    ├── 23-internal-linking
    └── 24-llm-optimization
        ↓
    [merge point]
        ↓
    03-performance-guardian
        ↓
    09-security
        ↓
    11-qa
        ↓
    12-analytics-sanity
```

## Context Preservation

Each handoff must include:
1. **Files created/modified** — List with paths
2. **Decisions made** — Choices that affect downstream work
3. **Constraints discovered** — Limitations found during work
4. **Open questions** — Unresolved items for next agent

## Emergency Escalation

Escalate immediately to 04-orchestrator if:
- Two guardians veto each other
- Circular dependency detected
- HARD-RULES violation discovered
- Client requirements conflict with constraints
