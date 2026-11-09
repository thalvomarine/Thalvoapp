# App Review / Play review notes

## What the app is

Thalvo MarineOS is a maritime chart and boat-ops cockpit for the Turkish Aegean and Mediterranean coast. Captains use the chart and cockpit; dealers and service providers use approved desks after admin review.

## Demo / test account

Provide a captain test login in App Store Connect / Play Console when you create one, for example:

- Email: _(fill before submit)_
- Password: _(fill before submit)_

Pre-seed the account with a boat profile so reviewers reach the cockpit after email confirmation.

Email confirmation is required (Supabase). If the review build cannot receive mail, temporarily confirm the reviewer account in Supabase Auth before submit.

## Important — payments

In-app amounts and payment ledger entries are **simulated**. No live card processor is connected. UI that shows money is labelled as simulation. There are no consumable IAP digital goods in this release; marina parts / service flows are ops tooling, not App Store digital content unlocks.

## Location & camera

Location is used when the user allows it, to place the vessel on the chart and for SOS / service call context. Camera / photos are optional for damage and boat documentation.

## Capgo / OTA

Native builds ship with CapacitorUpdater `autoUpdate=false`. Reviewers get the binary web bundle only.

## Support

support@thalvo.org · https://thalvo.org/privacy
