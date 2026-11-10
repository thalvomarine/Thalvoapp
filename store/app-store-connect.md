# App Store Connect — paste sheet

Version in the Xcode project: **1.0.5** (build **6**).  
Bundle ID: `com.thalvo.marineos`  
SKU: `thalvo-marineos` (cannot be changed later)

## 1. Register the Bundle ID first

Certificates, Identifiers & Profiles → Identifiers → **+** → App IDs → App.

| Field | Value |
| --- | --- |
| Description | Thalvo MarineOS |
| Bundle ID | Explicit · `com.thalvo.marineos` |
| Capabilities | None |

Push, Sign in with Apple and Associated Domains are not used. Location, camera and photo library are Info.plist purpose strings, not capabilities.

## 2. New App

| Field | Value |
| --- | --- |
| Platforms | iOS only |
| Name | Thalvo MarineOS |
| Primary language | Turkish |
| Bundle ID | com.thalvo.marineos |
| SKU | thalvo-marineos |
| User Access | Full Access |

## 3. App Information

| Field | Value |
| --- | --- |
| Name | Thalvo MarineOS |
| Subtitle | Ege ve Akdeniz deniz haritası |
| Primary category | Navigation |
| Secondary category | Lifestyle |
| Content rights | The chart draws Esri World Dark Gray and OpenSeaMap. Keep the existing map attribution. Tick the rights box only if those tile terms cover this commercial app. |
| Age rating | See section 6 |
| Privacy Policy URL | https://thalvo.org/privacy |
| Copyright | 2026 İsmail Tolga İşler |

English localization (add after the Turkish primary):

| Field | Value |
| --- | --- |
| Name | Thalvo MarineOS |
| Subtitle | Aegean and Med coast chart |
| Keywords | marine,navigation,boat,marina,chart,cockpit,Aegean,Mediterranean,SOS,captain |
| Description | `store/listing.en.md` |
| Support URL | https://thalvo.org/about |
| Marketing URL | https://thalvo.org |

Turkish keywords: `deniz,navigasyon,tekne,marina,harita,cockpit,Ege,Akdeniz,SOS,kaptan`  
Turkish description and the payment-simulation sentence: `store/listing.tr.md`.

## 4. Pricing and availability

Free. No in-app purchases. Simulated ledger amounts are not App Store products.

## 5. Version 1.0.5

| Field | Value |
| --- | --- |
| Screenshots | iPhone 1179×2556 or 1206×2622, and iPad 13" 2064×2752 or 2048×2732. No transparency. Chart, cockpit, sign-in. |
| Promotional text | Ege ve Akdeniz için deniz haritası, cockpit ve tekne desteği. Ödeme tutarları bu sürümde simülasyondur. |
| Description | `store/listing.tr.md` |
| Keywords | deniz,navigasyon,tekne,marina,harita,cockpit,Ege,Akdeniz,SOS,kaptan |
| Support URL | https://thalvo.org/about |
| Marketing URL | https://thalvo.org |
| Version | 1.0.5 |
| Copyright | 2026 İsmail Tolga İşler |
| Routing app coverage file | Leave empty. This is a coast chart, not a turn-by-turn routing app. |

Sign-in is email and password only, so Sign in with Apple is not required.

## 6. Age rating

Answer none / no for violence, sexual content, profanity, horror, gambling, alcohol, drugs, medical treatment, contests and unrestricted web access.

Answer yes for user-to-user messaging: job chat exists between a captain and the assigned technician, and passage notes can be submitted. Chat is filtered; passage notes stay unpublished until an admin approves them. Abuse contact is support@thalvo.org.

Do not mark the app as Made for Kids.

## 7. App Privacy

Follow `store/apple-app-privacy.md`. Tracking: No. Data listed there is linked to the user and not used to track.

## 8. App Review information

| Field | Value |
| --- | --- |
| Sign-in required | Yes |
| Demo account | Create a captain, confirm the email, add one vessel, paste the login into the review notes |
| Contact | support@thalvo.org and the phone on the Apple ID |
| Notes | Paste `store/review-notes.md` |

Review path to account deletion: account menu → Profile → Account settings → Delete account → type the account email.

## 9. Build

On a Mac, after `git pull`:

```bash
npm ci
npm run build:mobile
npm run store:preflight
npx cap open ios
```

Signing team must be the Individual team. The project file currently names `V3PL686UYB`. If Membership shows a different Team ID, pick the Membership team in Xcode before Archive.

Product → Archive → App Store Connect. Export compliance: **No**, the app uses standard HTTPS only.

`delete_own_account` is on the live database. The review binary must include this commit or the delete button returns an error.
