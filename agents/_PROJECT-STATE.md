# Project State

> Single source of truth. Only 04-orchestrator may MODIFY this file.
> All other agents may READ only.

## Project Identity

```yaml
project_name: ""
business_name: ""
business_type: ""  # e.g., "local-service", "ecommerce", "saas"
primary_location: ""
website_url: ""
gbp_url: ""  # Google Business Profile
```

## Locked Decisions

Once set, these cannot be changed without orchestrator approval:

```yaml
decisions:
  - decision: ""
    made_by: ""
    date: ""
    reason: ""
```

## Entity Definition

```yaml
entity:
  legal_name: ""
  trading_name: ""
  address: ""
  phone: ""
  email: ""
  vat_number: ""  # if applicable
```

## Current Phase

```yaml
phase: "discovery"  # discovery | architecture | implementation | seo | quality | launch
completed_phases: []
active_agents: []
blocked_agents: []
```

## Constraints

```yaml
constraints:
  budget: ""
  deadline: ""
  languages: ["en"]
  target_areas: []
  special_requirements: []
```

## Agent Notes

```yaml
notes:
  - agent: ""
    note: ""
    date: ""
```

## Blockers

```yaml
blockers:
  - blocker: ""
    reported_by: ""
    blocking: []  # agents blocked
    date: ""
```

## Completed Handoffs

```yaml
handoffs:
  - from: ""
    to: ""
    date: ""
    summary: ""
```
