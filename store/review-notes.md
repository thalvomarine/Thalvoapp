# App Review / Play review notes

Do not paste this header into App Store Connect. Paste only the block between `BEGIN PASTE` and `END PASTE`.

The rejected binary is **1.0.5 (6)**. It does not contain in-app account deletion. Upload **1.0.7 (8)** from current `main`, attach the iPhone recording, paste the block, then resubmit.

## Before resubmit

1. On a Mac: `git pull`, then `npm ci && npm run build:mobile && npm run store:preflight && npx cap open ios`. Archive and upload **1.0.7 (8)**. Select that build on the version. Do not resubmit 1.0.5.
2. Install that build on a physical iPhone running the latest iOS.
3. Record from a cold launch. Keep `apple-review@thalvo.org`. Use `apple-review-delete@thalvo.org` only for the deletion step. If the phone is in Turkish, switch language to English on the sign-in screen first (the control is in the header).
4. Attach the recording in App Review Information, paste the block below into Notes, and send this Resolution Center reply:

> Notes and a physical-iPhone recording are attached. Please sign in with apple-review@thalvo.org. Account deletion is in build 1.0.7 (8): use apple-review-delete@thalvo.org for that step and keep the first account. Payments on screen are simulated. There is no in-app purchase.

### Recording script

1. Force-quit, then launch. The first screen is the public landing. Open the coast chart, then return.
2. Tap **Sign in**. The form opens on **Create account**. Tap the **Sign in** tab.
3. Sign in as `apple-review@thalvo.org` / `Marina-Chart-27`. The captain cockpit opens on the map.
4. Open **Vessel** and show **Review Tender**. Open **Missions** and come back. Do not send a live SOS.
5. Sign out from the account menu.
6. Sign in as `apple-review-delete@thalvo.org` / `Marina-Delete-27`.
7. Account icon → **Profile** → **Account settings** → **Delete account** → type `apple-review-delete@thalvo.org` → **Delete permanently**. Stop the recording on the signed-out landing.

Turkish labels if the language switch is missed: Giriş yap, Hesap oluştur, Harita, Görevler, Tekne, Profil, Hesap ayarları, Hesabı sil, Kalıcı olarak sil.

## BEGIN PASTE

Thalvo MarineOS is a coastal reference chart and boat-operations cockpit for captains on the Turkish Aegean and Mediterranean (Göcek, Marmaris, Bodrum and the surrounding coast). It helps a captain see the coast, keep a boat record, and request a technician. It is not a certified ECDIS and it does not replace official nautical charts.

Demo account (email already confirmed, one vessel already on the account):

- Email: apple-review@thalvo.org
- Password: Marina-Chart-27

Sign-in is email and password. There is no Sign in with Apple.

How to reach the main features:

1. Launch opens the public landing and coast chart with no account.
2. Tap Sign in. The form opens on Create account; tap the Sign in tab.
3. Sign in with the demo account. The cockpit opens on the map.
4. Vessel shows the boat already on the account: Review Tender.
5. Missions is the support-call desk. Please do not send a live SOS during review.
6. Account deletion is in this build (1.0.7): account icon → Profile → Account settings → Delete account → type the account email → Delete permanently. Please use the disposable account below for that step and keep apple-review@thalvo.org.
   - Disposable email: apple-review-delete@thalvo.org
   - Password: Marina-Delete-27
   Deletion removes that account, its profile, vessels, calls it opened, and files it uploaded. No card number is stored.

Screen recording: attached in App Review Information. Captured on a physical iPhone running the latest iOS. It starts at cold launch and shows the public chart, sign-in, the cockpit and vessel, then account deletion on apple-review-delete@thalvo.org.

User content: a captain may submit a chart note. It stays hidden until an admin approves it. Job chat exists only between the captain and the assigned technician on that call. Phone numbers, payment asks and off-platform contact are filtered. There is no public social graph and no follow model, so there is no separate block control. Abuse reports: support@thalvo.org.

Payments: amounts on screen are simulated and labelled. No card processor is connected. There is no in-app purchase and no paid digital unlock.

External services: Supabase (authentication, database, storage); Esri World Dark Gray basemap; OpenSeaMap seamark overlay, with attribution kept on the chart; Open-Meteo for weather, which is not an official meteorological bulletin; an optional OpenAI-compatible assistant gateway, with the app's own seamanship notes when that gateway is unreachable. No advertising SDK. The binary does not auto-update; reviewers get the shipped web bundle only.

Regions: the same features in every region. The chart coverage is the Turkish Aegean and Mediterranean coast. The app does not hide or change features by country.

Regulated use and third-party material: this is a reference coastal chart and boat-ops tool. We do not sell certified navigation, pilotage, or official hydrographic products. Map tiles are drawn from Esri and OpenSeaMap under their tile terms, with attribution on the chart. We do not redistribute those tiles as our own chart product.

Support: support@thalvo.org
Privacy: https://thalvo.org/privacy

## END PASTE
