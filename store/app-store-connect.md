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
| Screenshots | Phone frames already captured are **1320×2868** (large Dynamic Island). Upload those through View All Sizes, not the medium slot. Medium only accepts 1179×2556 or 1206×2622. iPad 13" 2064×2752 or 2048×2732 is still required. No transparency. Order: chart, landing, role picker. |
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

Answer yes for user-to-user messaging and for shared location: job chat exists between a captain and the assigned technician, and an SOS or service call sends the vessel position to the other party. Passage notes can be submitted and stay unpublished until an admin approves them. Abuse contact is support@thalvo.org.

On the age-rating Features step, **Social Media is No** and **Social Media Disabled for Users Under 13 is also No**. Yes on the under-13 row while Social Media is No makes Connect demand Age Assurance, which this app does not have. The exact grid and the saved 4+ result are in section 10.

Do not mark the app as Made for Kids. Do not override the calculated rating.

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

## 10. Already entered on the live listing

Recorded so a later pass does not undo the App Store Connect session.

The app record exists. Apple ID `6833150085`. Name `Thalvo MarineOS`. Primary language Turkish. Bundle ID `com.thalvo.marineos`. SKU `thalvo-marineos`.

The version page already has the Turkish description, the keyword string, Support URL `https://thalvo.org`, Marketing URL `https://thalvo.org`, and Copyright `2026 Ismail Tolga Isler`. Game Center stays off. Routing coverage, App Clip and iMessage stay empty. Choose **Manually release this version**.

The version field on that page was still `1.0` when last seen. Set it to `1.0.5` before the build can attach. Do not upload an encryption document. Leave both App Store Server Notification URLs empty.

China mainland showed a security-assessment banner and an AI-generated-content banner. Turn China mainland off in Pricing and Availability for this release. Hong Kong, Macau and Taiwan can stay off with it.

Subtitle typed in that session (30 characters): `Deniz haritası ve tekne desteği`. Section 3 also lists `Ege ve Akdeniz deniz haritası`. Keep the one already saved.

Content rights were confirmed for Esri and OpenSeaMap tiles plus captain-written passage notes and boat listings.

Screenshot frames accepted for content, with no Safari chrome, in this order:

1. Chart, Aegean pins
2. Landing, Canlı haritayı aç
3. Role picker: Kaptan, Teknisyen, Bayi

Those files measure **1320×2868**. Connect rejected them in “iPhone with Dynamic Island (medium display)”. Open **View All Sizes in Media Manager** and drop the original files in the large Dynamic Island size. Do not resize them. iPad 13-inch frames were not captured yet.

Age Ratings, as clicked. On that form the left column is No / None and the right column is Yes.

| Step | Answer |
| --- | --- |
| Parental Controls | No |
| Age Assurance | No |
| Unrestricted Web Access | No |
| User-Generated Content | Yes |
| Messaging and Chat | Yes |
| Shared Location | Yes |
| Advertising | No |
| Social Media | No |
| Social Media Disabled for Users Under 13 | No |
| Profanity, horror, alcohol | None |
| Dating and Relationships | No |
| Medical or Treatment Information | None |
| Health or Wellness Topics | No |
| Mature, sexual and graphic sexual content | None |
| Cartoon, realistic and graphic violence, weapons | None |
| Age override | Not Applicable |
| Age Suitability URL | Empty |

After the under-13 row was set back to No, Connect saved **4+** for 172 countries, with separate cards for Brazil, Korea and Vietnam. Leave that. Do not pick Override to Higher Age Rating.

Review contact was still empty: first name Ismail, last name Isler, email support@thalvo.org, phone from the Apple ID. The demo captain login was still empty. Create it, confirm the email, add one vessel, then paste it into Sign-In Information and the notes.
