# Pricing Analysis Schema

## Full Schema

```yaml
pricing:
  transparency: hidden | teaser | full
  
  displayed_prices:
    - service: "1 bed flat move"
      price: "from £299"
      context: "local, weekday"
    - service: "2-3 bed house"
      price: "from £449"
      context: "local"
    # OR
    displayed_prices:
      not_found: true
      
  pricing_model: fixed | hourly | quote-only | hybrid
  
  price_anchoring:
    lowest_shown: "£199"
    context: "studio flat, local move"
    # OR
    price_anchoring:
      not_found: true
      
  discounts_offered:
    - "10% off online booking"
    - "Free boxes with full service"
    # OR
    discounts_offered:
      not_found: true
      
  payment_terms:
    deposit_required: true | false
    deposit_amount: "20%" | "£50" | not_found: true
    payment_methods:
      - "Card"
      - "Bank transfer"
      - "Cash"
```

## Transparency Classification

| Level | Meaning |
|-------|---------|
| hidden | No prices anywhere, "call for quote" only |
| teaser | "From £X" shown but no full pricing |
| full | Complete price list or calculator |

## Pricing Model Classification

| Model | Indicators |
|-------|------------|
| fixed | Set prices per service/property size |
| hourly | "£X per hour" pricing |
| quote-only | No prices, quote request only |
| hybrid | Mix of fixed + custom quotes |

## Example Output

```yaml
pricing:
  transparency: teaser
  
  displayed_prices:
    - service: "Studio/1 bed"
      price: "from £249"
      context: "local Bristol"
    - service: "2-3 bed house"
      price: "from £399"
      context: "local Bristol"
      
  pricing_model: hybrid
  
  price_anchoring:
    lowest_shown: "£249"
    context: "studio flat, under 5 miles"
    
  discounts_offered:
    - "10% online discount"
    - "Free quote, no obligation"
    
  payment_terms:
    deposit_required: true
    deposit_amount: "25%"
    payment_methods:
      - "Card"
      - "Bank transfer"
```

---

# CTA Analysis Schema

## Full Schema

```yaml
ctas:
  primary:
    text: "Get Free Quote"  # Exact button text
    placement:
      - "hero"
      - "sticky header"
      - "final section"
    style: "button"
    color: "orange"  # or describe
    
  secondary:
    text: "Call Now"
    phone_displayed: true
    phone_number: "0117 123 4567"
    placement:
      - "header"
      - "footer"
      - "mobile bar"
    # OR
    secondary:
      not_found: true
      
  form:
    fields_count: 4
    required_fields:
      - "name"
      - "email"
      - "phone"
      - "postcode"
    optional_fields:
      - "move date"
      - "message"
    # OR
    form:
      not_found: true
      
  urgency_tactics:
    - "Limited availability this week"
    - "Book today, save 10%"
    # OR
    urgency_tactics:
      not_found: true
      
  phone_prominence: high | medium | low | none
  
  whatsapp:
    available: true | false
    placement: "floating button" | "header" | not_found: true
    
  mobile_sticky_cta:
    present: true | false
    buttons:
      - "Call"
      - "Quote"
```

## Phone Prominence Classification

| Level | Indicators |
|-------|------------|
| high | Large, hero area, click-to-call prominent |
| medium | Header visible, not dominant |
| low | Footer only or small text |
| none | No phone number visible |

## Example Output

```yaml
ctas:
  primary:
    text: "Get Your Free Quote"
    placement:
      - "hero"
      - "sticky header"
      - "after reviews"
      - "final section"
    style: "button"
    color: "orange/coral"
    
  secondary:
    text: "Call Us Now"
    phone_displayed: true
    phone_number: "0117 456 7890"
    placement:
      - "header"
      - "footer"
      
  form:
    fields_count: 5
    required_fields:
      - "name"
      - "email"
      - "phone"
    optional_fields:
      - "move date"
      - "from postcode"
      - "to postcode"
      
  urgency_tactics:
    not_found: true
    
  phone_prominence: high
  
  whatsapp:
    available: true
    placement: "floating button bottom-right"
    
  mobile_sticky_cta:
    present: true
    buttons:
      - "Call"
      - "Free Quote"
```
