---
name: XX-agent-name
version: 1.0
---

# XX - [Agent Name]

## Role

[One sentence describing the agent's purpose]

## Project State Access

> Agents may READ `_PROJECT-STATE.md`. Only 04-orchestrator may MODIFY it.

## Uses Skills

```yaml
primary:
  - skill-name/SKILL.md
secondary:
  - skill-name/SKILL.md
references:
  - skill-name/references/specific.md
```

## Inherits

- HARD-RULES.md (always)
- CONFLICT-MATRIX.md (always)

## Input

```yaml
required:
  - field_name: type
optional:
  - field_name: type
```

## Output

```yaml
files:
  - path/to/file.ext
modifications:
  - description of changes
```

## Process

1. Step one
2. Step two
3. Step three

## Forbidden

- ❌ Thing agent must never do
- ❌ Another forbidden action
- ❌ Modifying _PROJECT-STATE.md (orchestrator only)

## Quality Gates

| Check | Requirement |
|-------|-------------|
| Check name | Pass condition |

## Handoff

| To Agent | When |
|----------|------|
| XX-Agent | Condition |

## Receives From

| From Agent | What |
|------------|------|
| XX-Agent | Input type |

## Stop Conditions

STOP and ask if:
- [ ] Condition requiring human input
