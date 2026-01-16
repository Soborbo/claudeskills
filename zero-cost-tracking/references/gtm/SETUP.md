# GTM Setup Guide

Step-by-step Google Tag Manager configuration for Zero-Cost Tracking v2.

## Prerequisites

- Google Tag Manager account
- GA4 property
- Google Ads account (for conversions)
- CookieYes account (for consent)

## 1. Container Setup

### Create Container

```
GTM → Admin → Create Container
├── Name: [your-site-name]
├── Target platform: Web
└── Create
```

### Enable Consent Mode

```
GTM → Admin → Container Settings
├── Enable consent overview: ✅
└── Enable consent mode: ✅
```

## 2. Variables (20)

Create these Data Layer Variables:

### Standard Variables

| Name | Type | Data Layer Variable Name |
|------|------|--------------------------|
| DLV - event | Data Layer Variable | event |
| DLV - value | Data Layer Variable | value |
| DLV - currency | Data Layer Variable | currency |
| DLV - lead_id | Data Layer Variable | lead_id |
| DLV - session_id | Data Layer Variable | session_id |
| DLV - step | Data Layer Variable | step |
| DLV - field | Data Layer Variable | field |
| DLV - last_field | Data Layer Variable | last_field |
| DLV - form_id | Data Layer Variable | form_id |
| DLV - user_email | Data Layer Variable | user_email |
| DLV - user_phone | Data Layer Variable | user_phone |
| DLV - device | Data Layer Variable | device |
| DLV - page_url | Data Layer Variable | page_url |

### Attribution Variables

| Name | Type | Data Layer Variable Name |
|------|------|--------------------------|
| DLV - first_utm_source | Data Layer Variable | first_utm_source |
| DLV - first_utm_medium | Data Layer Variable | first_utm_medium |
| DLV - first_utm_campaign | Data Layer Variable | first_utm_campaign |
| DLV - first_gclid | Data Layer Variable | first_gclid |
| DLV - last_utm_source | Data Layer Variable | last_utm_source |
| DLV - last_utm_medium | Data Layer Variable | last_utm_medium |
| DLV - last_gclid | Data Layer Variable | last_gclid |

### User-Provided Data Variable

```
GTM → Variables → New → User-Defined Variable
├── Type: User-Provided Data
├── Type: Manual Configuration
├── Email: {{DLV - user_email}}
└── Phone: {{DLV - user_phone}}
```

## 3. Triggers (8)

Create Custom Event triggers:

| Trigger Name | Event Name | Fires on |
|--------------|------------|----------|
| CE - phone_click | phone_click | All Custom Events |
| CE - callback_request | callback_request | All Custom Events |
| CE - quote_request | quote_request | All Custom Events |
| CE - contact_form | contact_form | All Custom Events |
| CE - calculator_start | calculator_start | All Custom Events |
| CE - calculator_step | calculator_step | All Custom Events |
| CE - calculator_option | calculator_option | All Custom Events |
| CE - form_abandon | form_abandon | All Custom Events |

### Creating a Trigger

```
GTM → Triggers → New
├── Trigger Type: Custom Event
├── Event name: [event_name]
├── This trigger fires on: All Custom Events
└── Save
```

## 4. Tags

### 4.1 CookieYes CMP Tag

```
GTM → Tags → New
├── Tag Type: CookieYes (from Community Templates)
├── CookieYes Banner ID: [your-banner-id]
├── Triggering: Consent Initialization - All Pages
└── Save
```

### 4.2 Conversion Linker

```
GTM → Tags → New
├── Tag Type: Conversion Linker
├── Link across domains: (optional)
├── Consent Settings:
│   └── Require additional consent: ad_storage
├── Triggering: Initialization - All Pages
└── Save
```

### 4.3 Google Tag (GA4 Config)

```
GTM → Tags → New
├── Tag Type: Google Tag
├── Tag ID: G-XXXXXXXXXX (your GA4 Measurement ID)
├── Configuration Settings:
│   └── (leave defaults)
├── Consent Settings:
│   └── Require additional consent: analytics_storage
├── Triggering: All Pages
└── Save
```

### 4.4 GA4 Event Tags

Create for each event:

#### GA4 - phone_click

```
GTM → Tags → New
├── Tag Type: Google Analytics: GA4 Event
├── Measurement ID: G-XXXXXXXXXX
├── Event Name: phone_click
├── Event Parameters:
│   ├── value: {{DLV - value}}
│   ├── currency: {{DLV - currency}}
│   ├── session_id: {{DLV - session_id}}
│   └── device: {{DLV - device}}
├── Consent Settings:
│   └── Require additional consent: analytics_storage
├── Triggering: CE - phone_click
└── Save
```

#### GA4 - quote_request (and similar for callback_request, contact_form)

```
GTM → Tags → New
├── Tag Type: Google Analytics: GA4 Event
├── Measurement ID: G-XXXXXXXXXX
├── Event Name: quote_request
├── Event Parameters:
│   ├── lead_id: {{DLV - lead_id}}
│   ├── value: {{DLV - value}}
│   ├── currency: {{DLV - currency}}
│   ├── session_id: {{DLV - session_id}}
│   ├── device: {{DLV - device}}
│   ├── first_utm_source: {{DLV - first_utm_source}}
│   ├── first_utm_medium: {{DLV - first_utm_medium}}
│   ├── first_utm_campaign: {{DLV - first_utm_campaign}}
│   ├── last_utm_source: {{DLV - last_utm_source}}
│   └── last_utm_medium: {{DLV - last_utm_medium}}
├── Consent Settings:
│   └── Require additional consent: analytics_storage
├── Triggering: CE - quote_request
└── Save
```

#### GA4 - calculator_start

```
GTM → Tags → New
├── Tag Type: Google Analytics: GA4 Event
├── Event Name: calculator_start
├── Event Parameters:
│   └── session_id: {{DLV - session_id}}
├── Consent Settings:
│   └── Require additional consent: analytics_storage
├── Triggering: CE - calculator_start
└── Save
```

#### GA4 - calculator_step

```
GTM → Tags → New
├── Tag Type: Google Analytics: GA4 Event
├── Event Name: calculator_step
├── Event Parameters:
│   ├── step: {{DLV - step}}
│   └── session_id: {{DLV - session_id}}
├── Consent Settings:
│   └── Require additional consent: analytics_storage
├── Triggering: CE - calculator_step
└── Save
```

#### GA4 - calculator_option

```
GTM → Tags → New
├── Tag Type: Google Analytics: GA4 Event
├── Event Name: calculator_option
├── Event Parameters:
│   ├── field: {{DLV - field}}
│   ├── value: {{DLV - value}}
│   └── session_id: {{DLV - session_id}}
├── Consent Settings:
│   └── Require additional consent: analytics_storage
├── Triggering: CE - calculator_option
└── Save
```

#### GA4 - form_abandon

```
GTM → Tags → New
├── Tag Type: Google Analytics: GA4 Event
├── Event Name: form_abandon
├── Event Parameters:
│   ├── form_id: {{DLV - form_id}}
│   ├── last_field: {{DLV - last_field}}
│   └── session_id: {{DLV - session_id}}
├── Consent Settings:
│   └── Require additional consent: analytics_storage
├── Triggering: CE - form_abandon
└── Save
```

### 4.5 Google Ads Conversion Tags

Create for conversion events (phone_click, quote_request, callback_request, contact_form):

#### GAds - quote_request

```
GTM → Tags → New
├── Tag Type: Google Ads Conversion Tracking
├── Conversion ID: AW-XXXXXXXXX (from Google Ads)
├── Conversion Label: XXXXXXXXX (from Google Ads)
├── Conversion Value: {{DLV - value}}
├── Currency Code: {{DLV - currency}}
├── Transaction ID: {{DLV - lead_id}}
├── Include user-provided data: ✅
├── User-provided data variable: {{User-Provided Data}}
├── Consent Settings:
│   ├── Require additional consent: ad_storage
│   └── Require additional consent: ad_user_data
├── Triggering: CE - quote_request
└── Save
```

Repeat for: phone_click, callback_request, contact_form

## 5. Testing

### Preview Mode

```
GTM → Preview
├── Enter your site URL
├── Click Connect
└── Verify events fire correctly
```

### Checklist

- [ ] Consent banner appears
- [ ] Tags wait for consent
- [ ] phone_click fires with correct value
- [ ] quote_request includes attribution data
- [ ] User-provided data shows in tag
- [ ] No duplicate tags firing

## 6. Publish

```
GTM → Submit
├── Version Name: "Zero-Cost Tracking v2.0"
├── Version Description: "Initial setup with GA4 + GAds"
└── Publish
```

## Troubleshooting

### Tags not firing

1. Check consent - tags require consent first
2. Check trigger - event name must match exactly
3. Check Preview mode for errors

### Missing attribution data

1. Check dataLayer - are first_* fields present?
2. Check localStorage - is sb_first_touch stored?
3. Check consent - was marketing consent granted?

### Enhanced Conversions not working

1. Wait 24-48 hours for Google to process
2. Check Google Ads → Tools → Conversions → Diagnostics
3. Verify user_email and user_phone are hashed correctly
