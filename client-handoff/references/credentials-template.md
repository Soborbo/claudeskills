# Access Credentials Template

Copy and customize for each project. Client fills in their own passwords.

```markdown
# [Business Name] - Access Credentials

⚠️ CONFIDENTIAL - Store securely and do not share.

## Website Hosting (Cloudflare)

- URL: dash.cloudflare.com
- Email: [client email]
- Password: [CLIENT SETS THIS]
- 2FA: Enabled (recommended)

## Domain Registrar

- Provider: [GoDaddy/Namecheap/etc]
- URL: [login URL]
- Email: [client email]
- Password: [CLIENT SETS THIS]

## Google Analytics (GA4)

- Property: [Property name]
- Property ID: G-XXXXXXX
- Access: [client email] (Admin)
- URL: analytics.google.com

## Google Search Console

- Property: [domain.com]
- Access: [client email] (Owner)
- URL: search.google.com/search-console

## Google Tag Manager (GTM)

- Container: GTM-XXXXXXX
- Access: [client email] (Admin)
- URL: tagmanager.google.com

## Form Submissions (Google Sheets)

- Sheet name: [name]
- URL: [sheet URL]
- Access: [client email] (Editor)

## CookieYes (Cookie Banner)

- URL: app.cookieyes.com
- Email: [client email]
- Password: [CLIENT SETS THIS]
```

## Important Rules

| Rule | Reason |
|------|--------|
| Client sets all passwords | Developer never stores passwords |
| Use client's email | They own the accounts |
| GA4 = Admin access | Full analytics control |
| Search Console = Owner | Full SEO control |
| Store securely | 1Password, Bitwarden, etc. |

## Password Fields

Mark with `[CLIENT SETS THIS]` — developer does NOT fill these in.

During handoff meeting, client creates accounts and sets passwords while sharing screen.
