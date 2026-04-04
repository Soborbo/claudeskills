# Messaging Analysis Schema

## Full Schema

```yaml
messaging:
  headline:
    text: "Exact H1 text copied verbatim"
    pattern: benefit | feature | question | statement
    includes_location: true | false
    includes_price: true | false
    
  value_proposition:
    primary: "Main promise in one sentence"
    supporting:
      - "Secondary point 1"
      - "Secondary point 2"
    # OR
    supporting:
      not_found: true
      
  tone:
    formality: formal | professional | casual | friendly
    personality: corporate | personal | expert | local
    urgency_level: high | medium | low | none
    
  unique_claims:
    - "Exact claim 1 as written"
    - "Exact claim 2 as written"
    # OR
    unique_claims:
      not_found: true
      
  pain_points_addressed:
    - "Pain point mentioned on page"
    # OR
    pain_points_addressed:
      not_found: true
      
  benefits_highlighted:
    - benefit: "Exact benefit text"
      proof: "Supporting proof if present"
    # OR  
    benefits_highlighted:
      not_found: true
```

## Pattern Classification

| Pattern | Example | Indicators |
|---------|---------|------------|
| benefit | "Stress-Free Moving" | Outcome-focused, emotional |
| feature | "24/7 Service Available" | What they do, factual |
| question | "Need a Reliable Mover?" | Ends with "?" |
| statement | "Bristol's #1 Removal Company" | Claim or position |

## Tone Classification

### Formality Scale

| Level | Indicators |
|-------|------------|
| formal | "We endeavour to provide", full sentences, no contractions |
| professional | "We provide", clear but not stiff |
| casual | "We'll help you", contractions, simpler words |
| friendly | "Hey!", exclamation marks, first names |

### Personality Scale

| Type | Indicators |
|------|------------|
| corporate | Stock photos, "our team", no names |
| personal | Founder name, "I/my", personal story |
| expert | Credentials, technical terms, authority |
| local | Area references, "your local", community |

## Example Output

```yaml
messaging:
  headline:
    text: "House Removals Bristol - Professional & Reliable"
    pattern: feature
    includes_location: true
    includes_price: false
    
  value_proposition:
    primary: "Stress-free house moves with fully trained staff"
    supporting:
      - "Fully insured"
      - "Fixed prices"
      
  tone:
    formality: professional
    personality: local
    urgency_level: low
    
  unique_claims:
    - "Over 20 years experience"
    - "Family-run business"
    
  pain_points_addressed:
    - "Stressful moving experience"
    - "Hidden costs"
    
  benefits_highlighted:
    - benefit: "Fixed prices"
      proof: "No hidden fees guarantee"
    - benefit: "Fully insured"
      proof: "£1m cover"
```
