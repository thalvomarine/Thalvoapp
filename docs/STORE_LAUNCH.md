# Thalvo MarineOS — App Store & Google Play launch

Bundle ID / applicationId: `com.thalvo.marineos`  
Current native version: **1.0.5** (build / versionCode **6**)  
Privacy: https://thalvo.org/privacy  
Terms: https://thalvo.org/terms  
Support: https://thalvo.org · support@thalvo.org  
Marketing: https://thalvo.org

Paste-ready listing copy, privacy answers, and review notes live under `store/`.

## Blockers (human / console — not fixable in this repo alone)

| Gate | Status to reach before submit |
| --- | --- |
| Apple Developer Program | Membership **Active** (confirmed). Create the app record, then archive from a Mac |
| Google Play Console | Developer account paid + identity verified |
| iOS signing team | Xcode → Signing & Capabilities → your **Individual** team (replace any old `DEVELOPMENT_TEAM`) |
| Android upload key | Create once, back up; see `android/keystore.properties.example` |
| Store screenshots | Capture on real device / simulator; drop into `store/assets/screenshots/` |
| Legal | Privacy/terms say they need KVKK legal review before treating copy as final |

Payments in-app remain **simulated** — say so in App Review notes and Play “About this app” / review reply. Do not claim real card charging until a PSP is live.

## Shared prep (run on your machine)

```bash
git pull
npm ci
npm run store:preflight
npm run build:mobile
```

- `store:preflight` checks iOS + Android ids, Capgo `autoUpdate=false`, privacy URLs, and store asset files.
- `build:mobile` regenerates branded icons/splash and syncs Capacitor `dist/` into both shells.

Keep Capgo `autoUpdate: false` until a production OTA bundle is verified (see `scripts/ios-release-checklist.mjs`).

## Apple App Store / TestFlight

1. App Store Connect → My Apps → **+** → iOS app. Field-by-field answers: `store/app-store-connect.md`.
   - Name: Thalvo MarineOS
   - Bundle ID: `com.thalvo.marineos` (register in Certificates, Identifiers & Profiles if the menu is empty)
   - SKU: `thalvo-marineos` (immutable)
   - User Access: Full Access
2. On a Mac: `npm run build:mobile && npm run store:preflight && npx cap open ios`
3. Signing & Capabilities → the Individual team whose Team ID matches Membership (the project currently has `V3PL686UYB`). Any iOS Device → **Product → Archive** → Distribute → **App Store Connect**.
4. Fill listing from `store/listing.tr.md` (primary) and `store/listing.en.md`.
5. App Privacy: follow `store/apple-app-privacy.md`.
6. Export compliance: standard HTTPS only — Info.plist sets `ITSAppUsesNonExemptEncryption=false`.
7. Screenshots: at least one **1179×2556 or 1206×2622** iPhone frame, and one **2064×2752 or 2048×2732** iPad frame. The target includes iPad (`TARGETED_DEVICE_FAMILY = 1,2`).
8. Review notes: paste `store/review-notes.md` and add a confirmed captain login before submit.
9. Account deletion is in the binary: Profile → Account settings → Delete account. It calls `delete_own_account`.
10. TestFlight internal, then **Submit for Review**.

Primary category: **Navigation** (secondary: Lifestyle).  
Age rating: no violence, sexual content, gambling, or general web browser. Job chat is user-to-user, so the computed rating can sit above 4+. Answers are in `store/app-store-connect.md`.

## Google Play

1. Play Console → Create app → Thalvo MarineOS → Free → declarations.
2. Generate upload keystore (once):

```bash
keytool -genkeypair -v -keystore thalvo-upload.jks -keyalg RSA -keysize 2048 -validity 10000 -alias thalvo
```

Copy `android/keystore.properties.example` → `android/keystore.properties` (gitignored) and point `storeFile` at the `.jks`.

3. Build AAB:

```bash
npm run build:mobile
npm run android:bundle
```

Output: `android/app/build/outputs/bundle/release/app-release.aab`

4. Play Console → Production (or Closed testing first) → upload AAB.
5. Store listing: `store/listing.tr.md` / `store/listing.en.md`.
6. Data safety: `store/google-data-safety.md`.
7. Content rating questionnaire: answer for navigation / lifestyle; no user-generated dating, no violence focus.
8. Target audience: 18+ recommended (boat ops) even if content is low maturity.
9. Privacy policy URL: https://thalvo.org/privacy

## Asset checklist

| Asset | Spec | Path / action |
| --- | --- | --- |
| App icon (Play) | 512×512 PNG | `npm run cap:assets` → `store/assets/icon-512.png` |
| App icon (Apple) | 1024×1024 in AppIcon set | generated into iOS AppIcon catalog |
| Feature graphic (Play) | 1024×500 | `store/assets/feature-graphic.png` |
| Phone screenshots | iPhone Dynamic Island medium: 1179×2556 or 1206×2622 | `store/assets/screenshots/` |
| iPad screenshots | 13": 2064×2752 or 2048×2732 (required — app runs on iPad) | `store/assets/screenshots/` |

## After both stores are live

- Prefer closed testing (Play) + TestFlight before production.
- Bump `versionName` / `MARKETING_VERSION` and `versionCode` / `CURRENT_PROJECT_VERSION` together on every store upload.
- Only then consider Capgo `autoUpdate: true` for JS-only hotfixes.
