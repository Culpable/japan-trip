# Travel companion design system

This document owns the product and interaction patterns that make this itinerary useful during travel. Reuse the patterns for future private travel repositories, then replace the trip-specific dates, places, brand details, and data.

## Product promise

The traveller should be able to open the site under time pressure and answer five questions without searching elsewhere:

1. Where are we now?
2. What happens next and tomorrow?
3. What has been booked?
4. How do we complete the next journey door to door?
5. What local text can we show a driver, station worker, hotel, or venue?

The interface must stay useful without manual progress updates. The clock and structured itinerary determine the active day, completed moments, the next confirmed booking, the current hotel, and the Tomorrow briefing.

## Reusable product patterns

### Local names and translations

- Every day, hotel, transit leg, activity, and confirmed booking must have `localName`, `localLanguage`, and `localLang` data.
- Add `localAddress` when it helps a driver, station worker, hotel, venue, or map search.
- Use Simplified Chinese (`zh-Hans`) in mainland China, Traditional Chinese (`zh-Hant`) in Hong Kong, and Japanese (`ja`) in Japan. For a cross-border leg, preserve the correct script for each place.
- Keep buttons and navigation in English. The control says **Show local name** and changes to **Show English** after activation.
- Switching a place in one surface must update every rendered instance through `index.html::localPlaceIndex` and `index.html::toggleLocalPlace`.
- Translation is task-specific support, not a full-page translation mode. Show the exact name, address, destination, or phrase the traveller needs.

### Iconography and actions

- Use the shared SVGs in `index.html::actionIcons` for maps, language, weather, routes, tickets, check-out, and other repeated actions. Hydrate static action slots through `index.html::hydrateActionIcons`.
- Pair every action icon with a short English label such as **Open map**, **Show local name**, **Arrival guide**, or **Reservation**.
- Keep action meaning consistent across Today, Tomorrow, day dialogs, bookings, and hotel rows.
- Use emoji as decorative identity for a stay or booking, not as the only explanation of an action.
- Keep touch targets at least 44px and preserve visible focus, contrast, and disabled states.

### Today and Tomorrow briefing

- During the trip, `index.html::showTodayMode` is the default view. It hides the full route and opens the live command centre.
- Today shows the current location, time zones, current stay, the latest relevant moment, the next moments, booking state, maps, weather, local-name actions, and applicable guides.
- `index.html::renderTomorrowPreview` keeps tomorrow visible on the same screen. It must show the next day's title, departure cue, transit summary, key moments, local name, map, and applicable guides.
- Derive state from `index.html::tripClock`, machine-readable `instant` values, durations, and `leaveBy`. Do not add manual completion controls for normal trip progress.
- Keep date-preview support through the `?date=` query for local verification of pre-trip, in-trip, tomorrow, and post-trip states.

### Bookings modal

- The Bookings action opens one travel-wallet dialog containing confirmed moments and every stay.
- `index.html::renderWallets` sorts upcoming confirmed moments before elapsed ones and marks past rows without removing them.
- A confirmed moment shows its date and time, status, local-name toggle, map, reservation link when available, and a related pass or journey guide when applicable.
- A stay shows dates, address, local name, map, check-out time, and the arrival or border guide that leads to it.
- Reset the wallet scroll position when it opens. The hotel shortcut may scroll the dialog body to the stay section, not the page behind it.
- Never store or display QR values, pickup codes, card details, passport data, or booking identifiers.

### Door-to-door travel guides

A detailed guide is mandatory for:

- a move between hotels;
- a move between cities, provinces, countries, or islands;
- a border crossing;
- a flight, airport transfer, or airside connection;
- any journey where reserved transport, multiple operators, luggage, gates, or unfamiliar payment could cause a missed connection.

Each guide must include:

1. A route overview from the current hotel or starting address to the next hotel or final destination.
2. The intended departure, arrival target, realistic buffers, total journey shape, and transport cost where known.
3. Every walking, taxi, train, bus, shuttle, flight, and transfer step in order.
4. The exact station, terminal, platform, exit, bus stop, direction, train service, and **where to get off**. Visually distinguish the service from the destination.
5. Whether to book, what is already booked, seat or carriage details when safe, how to pay, and whether to use an IC card, QR ticket, paper ticket, or staffed counter.
6. Gate and QR actions, including when to scan, tap, retain a slip, remain inside a paid area, or avoid exiting during a transfer.
7. Luggage handling, check-in or check-out context, and hotel arrival steps.
8. Useful local-language names and full phrases with plain-English meanings.
9. A primary plan plus practical fallback options and a clear decision point for switching.
10. Direct map actions and first-party source links for schedules, terminals, fares, closures, and booking rules.

Expose one shared guide dialog through flags on the relevant `tripData` day, transit, activity, booking, or stay. The same guide must be reachable from Today, Tomorrow, the day quick view, the timeline, and the booking or hotel wallet wherever that surface is relevant. Add a focused regression test named for the day or route.

### Maps, weather, and live context

- A traveller-facing place with a useful address gets a map action. Day-level maps use `mapQuery`; place maps use the English address accepted by the map provider.
- Weather cards must identify the destination and link to the same provider or station that supplies the displayed reading.
- Show timestamps for live observations. Do not present a stale or forecast value as the current temperature.
- Keep the trip time zone and Perth time visible when they help the travellers coordinate.

### Responsive dialogs and the companion

- Treat portrait phone, landscape phone, and desktop as first-class layouts.
- Dialog headers stay visible while `.dialog-body` owns scrolling. The page behind an open dialog stays locked.
- Long routes stack into readable cards on narrow screens. Tables must not force horizontal page scrolling.
- Pikachu is a private-site companion and may remain part of the identity. On compact screens, move it into reserved page or dialog docks so it never covers content or controls.
- Preserve stable text sizing across orientation changes and honour safe-area insets.

### Offline and privacy boundaries

- Keep core route, hotel, booking, translation, and guide text in local source so it remains available offline.
- Treat `sw.js::CORE_ASSETS` as the offline shell list. Update it when a required asset is added or removed.
- Keep the site `noindex`. The local 45-day gate is a convenience layer only because GitHub Pages still serves the source publicly.
- Link to live external data only when stale local data would be unsafe or misleading. Keep a useful offline fallback where practical.

## Visual language

- Use a warm paper background, dark ink, deep green, restrained red, and gold accents from the CSS custom properties in `index.html`.
- Use compact rounded cards, light borders, small shadows, strong typographic hierarchy, and generous whitespace.
- Use colour to show regions, state, and priority. Do not let decoration compete with times, destinations, warnings, or booking status.
- Keep warnings explicit and action-led. Use a clear fallback callout for cancellations, full services, or missed connections.
- Preserve the Japanese-inspired details as background atmosphere. The itinerary and live travel controls remain the main event.

## Structured data contract

`index.html::tripData` is the source of truth. A day contains its date, region, English and local identity, map and weather targets, stay, transit, ordered activities, notes, and feature flags. Bookings and hotels are derived from this model.

When adding or changing a trip item:

1. Update the existing day, transit, activity, booking, or stay record instead of creating a parallel dataset.
2. Add correct local-language fields and useful address data.
3. Add machine-readable `instant`, `durationMinutes`, and `leaveBy` values when the UI needs time state.
4. Add guide flags and one shared dialog when the mandatory journey criteria apply.
5. Update focused tests for the structured record, local language, Today/Tomorrow entry points, booking wallet, guide content, and mobile safety.

## Future travel repository checklist

When using this project as a base:

1. Replace trip title, dates, travellers, regions, stays, itinerary data, sources, maps, weather locations, metadata, and social images.
2. Keep the structured `tripData` flow, clock-derived Today and Tomorrow briefing, local-name index, bookings wallet, action icon system, and shared journey-guide entry pattern.
3. Define the correct local script and language code for every country or region before entering itinerary data.
4. Create a door-to-door guide for every mandatory journey class above before calling the itinerary complete.
5. Replace the private-site gate details without committing secrets. Preserve `noindex` unless the new site is intentionally public.
6. Replace cached assets and bump or revise the service-worker cache when the offline shell changes.
7. Run focused data and guide tests, the full Node suite, and desktop plus portrait and landscape browser checks.

## Canonical implementation map

| Concern | Implementation | Regression evidence |
| --- | --- | --- |
| Structured itinerary | `index.html::tripData` | `tests/structured-itinerary-model.test.js` |
| Local names | `index.html::localPlaceIndex`, `localPlaceAction`, `toggleLocalPlace` | `tests/local-place-toggle.test.js` |
| Shared icons | `index.html::actionIcons`, `hydrateActionIcons` | `tests/today-first-mode.test.js`, `tests/run-sheet-map-actions.test.js` |
| Today and Tomorrow | `showTodayMode`, `renderTodayView`, `renderTomorrowPreview` | `tests/today-first-mode.test.js`, `tests/today-preview-context.test.js` |
| Bookings and stays | `renderWallets`, `bookingDialog` | `tests/booking-wallet-order.test.js`, `tests/hotel-checkout-times.test.js` |
| Journey guides | guide dialogs, feature flags, and `open*Guide` functions in `index.html` | `tests/day-*-guide.test.js`, `tests/usj-express-pass-guide.test.js` |
| Responsive dialogs | dialog CSS, `showModalDialog`, `syncCompanionPlacement` | `tests/dialog-scroll-lock.test.js`, `tests/mobile-layout-safety.test.js` |
| Offline PWA | `manifest.webmanifest`, `sw.js` | `tests/sw-cache-strategy.test.js`, `tests/pwa-install-prompt.test.js` |
