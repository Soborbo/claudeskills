# Business Intake Checklist

## Required Information

Collect ALL of these before creating legal pages.

### Business Details

| Field | Required | Example |
|-------|----------|---------|
| Registered business name | ✅ | "ABC Removals Ltd" |
| Trading name | If different | "Quick Move Bristol" |
| Country | ✅ | UK / HU |
| Company number | If Ltd/Kft | "12345678" |
| Registered address | ✅ | "123 High Street, Bristol, BS1 1AA" |
| Contact email | ✅ | "hello@quickmove.co.uk" |
| Contact phone | ✅ | "+44 117 123 4567" |
| VAT number | If VAT registered | "GB123456789" |

### For Hungarian Businesses

| Field | Required | Example |
|-------|----------|---------|
| Cégnév | ✅ | "ABC Költöztetés Kft." |
| Cégjegyzékszám | If Kft/Bt | "01-09-123456" |
| Székhely | ✅ | "1111 Budapest, Fő utca 1." |
| Adószám | ✅ | "12345678-2-41" |
| E-mail | ✅ | "info@abckoltoztetes.hu" |
| Telefon | ✅ | "+36 1 234 5678" |

### Website Details

| Field | Required | Notes |
|-------|----------|-------|
| Domain | ✅ | quickmove.co.uk |
| Language | ✅ | en / hu |
| Form fields collected | ✅ | name, email, phone, message |

### Cookie/Tracking Setup

| Question | Answer |
|----------|--------|
| Using Google Analytics? | Yes / No |
| Using Facebook Pixel? | Yes / No |
| Using Google Ads conversion? | Yes / No |
| Using other analytics? | Specify |

**If ANY analytics/marketing = Cookie Policy REQUIRED**

## Intake Form Template

```markdown
# Legal Information Request

Please provide the following for your legal pages:

## Business Details

- Business name: 
- Trading name (if different): 
- Company number: 
- Registered address: 
- Contact email: 
- Contact phone: 
- VAT number (if applicable): 

## Website

- Country: UK / HU
- Language: English / Hungarian
- Domain: 

## Form Data Collected

Which fields does your contact form collect?
- [ ] Name
- [ ] Email
- [ ] Phone
- [ ] Address
- [ ] Message
- [ ] Other: ___________

## Analytics & Marketing

- [ ] Google Analytics (GA4)
- [ ] Facebook Pixel
- [ ] Google Ads
- [ ] Other: ___________

## Confirmation

- [ ] I confirm these details are accurate
- [ ] I understand I am responsible for reviewing the final legal pages

Signed: ___________
Date: ___________
```

## Blocking Conditions

| Missing Field | Result |
|---------------|--------|
| Business name | ❌ STOP |
| Address | ❌ STOP |
| Email | ❌ STOP |
| Country | ❌ STOP |
| Phone | ⚠️ Warning only |
| Company number | ⚠️ Warning if Ltd/Kft |

## Validation Rules

| Field | UK Format | HU Format |
|-------|-----------|-----------|
| Phone | +44 XXXX XXXXXX | +36 X XXX XXXX |
| Postcode | BS1 1AA | 1234 |
| Company No. | 8 digits | XX-XX-XXXXXX |
| VAT | GB + 9 digits | 8 digits |
