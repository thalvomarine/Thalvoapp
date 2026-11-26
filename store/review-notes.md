# App Review / Play review notes

## What the app is

Thalvo MarineOS is a maritime chart and boat-ops cockpit for the Turkish Aegean and Mediterranean coast. Captains use the chart and cockpit; dealers and service providers use approved desks after admin review.

## Demo / test account

Create a captain login, confirm the email in Supabase Auth, add one vessel, and paste it here before submit:

- Email: _(fill before submit)_
- Password: _(fill before submit)_

Signed-out review still reaches the public chart at the first screen. The cockpit, boat passport and account deletion need this login.

## Account deletion (Guideline 5.1.1)

Signed in → account menu → Profile → Account settings → Delete account. The reviewer types the account email and confirms. The account, profile, vessels, opened calls and uploaded files for that account are removed. No card number is stored.

## Important — payments

In-app amounts and payment ledger entries are **simulated**. No live card processor is connected. UI that shows money is labelled as simulation. There are no consumable IAP digital goods in this release; marina parts / service flows are ops tooling, not App Store digital content unlocks.

## Messages

Job chat is only between the captain and the assigned technician on that call. Phone numbers, payment asks and off-platform contact are filtered. Passage notes on the chart stay hidden until an admin approves them. Abuse reports: support@thalvo.org.

## Location & camera

Location is used when the user allows it, to place the vessel on the chart and for SOS / service call context. Camera / photos are optional for damage and boat documentation.

## Capgo / OTA

Native builds ship with CapacitorUpdater `autoUpdate=false`. Reviewers get the binary web bundle only.

## Support

support@thalvo.org · https://thalvo.org/privacy
