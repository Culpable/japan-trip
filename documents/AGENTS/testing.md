# Testing and verification

## Test environments and isolation

- Tests run against local files with Node's built-in modules. They use `node:assert`, `node:vm`, and small DOM, storage, cache, fetch, or clock mocks.
- The suite has no database, package install, credentials, or writable external service.
- Use the local HTTP server for browser checks. Do not validate unpublished changes on GitHub Pages.

## Test selection

| Change | Required checks | Command |
| --- | --- | --- |
| Itinerary shape, activity, stay, booking, or local name | Structured model plus the closest feature test | `node tests/structured-itinerary-model.test.js && node tests/local-place-toggle.test.js` |
| Today, Tomorrow, progression, time, or next booking | Today and timeline tests | `node tests/today-first-mode.test.js && node tests/today-preview-context.test.js && node tests/timeline-progression-semantics.test.js` |
| Booking or hotel wallet | Wallet and stay tests | `node tests/booking-wallet-order.test.js && node tests/hotel-checkout-times.test.js` |
| Door-to-door guide | The route-specific `day-*-guide.test.js` or named guide test, then browser verification | Example: `node tests/day-10-kyoto-guide.test.js` |
| Dialog, compact layout, orientation, safe area, or Pikachu placement | Dialog and mobile safety tests, then three viewport checks | `node tests/dialog-scroll-lock.test.js && node tests/mobile-layout-safety.test.js && node tests/safe-area-insets.test.js` |
| Authentication or browser storage | Authentication and lock tests | `node tests/auth-storage-fallback.test.js && node tests/lock-closes-open-dialogs.test.js` |
| Manifest, service worker, install prompt, or offline asset | PWA and cache tests | `node tests/sw-cache-strategy.test.js && node tests/pwa-install-prompt.test.js` |
| Icon or social image | Matching metadata or footprint test plus visual inspection of every generated size | `node tests/favicon-metadata.test.js && node tests/favicon-character-footprint.test.js` |
| Any completed change | Full regression suite | `for test_file in tests/*.test.js; do node "$test_file" || exit 1; done` |

## Validation commands

- Default completion gate: `for test_file in tests/*.test.js; do node "$test_file" || exit 1; done`.
- Diff gate: `git diff --check`.
- Local health check: `curl -fsS http://127.0.0.1:4173/ >/dev/null` after starting the project server.

## Fixtures and identities

- Use the read-only `?date=` query to render a specific trip state, for example `?date=2026-08-14T15:00:00+09:00`.
- Use ISO timestamps with the destination's real UTC offset so Today, Tomorrow, elapsed bookings, and local time are deterministic.
- Do not add production credentials to tests. If a browser needs the gate unlocked, use access already supplied by the user or an authorised local browser profile without recording it in source, commands, screenshots, or reports.

## Database and external-service policy

- No database exists.
- Mock live weather, storage, service-worker caches, and network responses in automated tests. Browser verification may read public map, weather, or first-party travel pages but must not submit, cancel, purchase, message, or modify an external booking.

## Development-server ownership

- Health check: `curl -fsS http://127.0.0.1:4173/ >/dev/null` must return success.
- Start: `python3 -m http.server 4173 --bind 127.0.0.1 --directory /Users/sacino/japan-trip`.
- Reuse a healthy server only when its owner and served directory are known. If this task starts the server, retain the process id or tool session and stop it before completion.

## Browser verification

- Read `documents/AGENTS/ui-verification.md` before any visual or interaction claim.
- Verify the exact changed state, its adjacent state, and the main discovery path. A guide change normally requires Today or Tomorrow, its action, the open dialog, internal scrolling, close behaviour, and the booking or stay entry point.
- Check desktop, portrait phone, and landscape phone. Inspect horizontal overflow and make sure Pikachu, sticky controls, dialog headers, and safe areas do not cover content.

## Generated and compiled artifacts

- This project has no compiled application bundle.
- After running an image build script, inspect the generated dimensions and visuals, then run the matching metadata or footprint tests. Do not commit temporary render files.

## Completion evidence

- Report focused checks, the full-suite result, browser routes and viewports, skipped checks with reasons, and residual risk.
- For a bug fix, record the failing reproduction, the focused passing result after the fix, and the full regression result.
