# Apple App Privacy (App Store Connect questionnaire)

Product behaviour source: https://thalvo.org/privacy  
Tracking: **No** (no third-party advertising / ATT tracking).

## Data linked to the user (account holders)

| Type | Examples | Purpose | Linked to user | Used for tracking |
| --- | --- | --- | --- | --- |
| Contact Info | Name, email, phone | Account, support, job contact | Yes | No |
| Location | Precise location (when in use) | Chart position, SOS / service calls | Yes | No |
| User Content | Photos (damage / boat), chat messages | Support jobs, boat passport | Yes | No |
| Identifiers | User ID (Supabase auth) | Account | Yes | No |
| Purchases | Simulated ledger records only | Product history (not live PSP) | Yes | No |
| Product Interaction | App feature usage as needed for ops | App functionality | Yes | No |

## Data not collected for browse-only (signed out)

Public chart / landing does not request location and does not share live boat or technician pins.

## Permissions copy (already in Info.plist)

- Location When In Use — chart + seamanship safety  
- Camera — SOS / support damage photos  
- Photo Library — attach boat / fault photos  

## Export compliance

Uses only standard HTTPS / OS cryptography → answer **No** to non-exempt encryption (plist key set).
