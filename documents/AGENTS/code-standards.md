# Code standards

## Scope and authorities

- Scope: `index.html`, `sw.js`, `manifest.webmanifest`, `scripts/`, `tests/`, and generated image assets.
- There is no formatter, linter, type checker, package manifest, or dependency lockfile. Preserve the established formatting and rely on focused tests, the full test suite, and `git diff --check`.
- Product and interaction authority: `DESIGN.md`.
- Generated-file authorities: `assets/pikachu.png` plus `scripts/build-app-icons.sh` own the PWA icons; `assets/og-image.svg`, `assets/pikachu.png`, and `scripts/build-og-image.sh` own `og-image.png`.

## Formatting and language rules

- Make small, reviewable patches. Do not reformat the 300KB-plus `index.html` or reorder unrelated CSS, markup, data, or functions.
- Match the surrounding two-space HTML, CSS, and JavaScript indentation. Use semicolons and the local quote style.
- Keep displayed times explicit with a time-zone suffix when two time zones are present. Use ISO 8601 timestamps with an offset for `instant`.
- External links open in a new tab and include `rel="noopener noreferrer"`.

## Naming

- Use stable kebab-case ids for days, stays, transit legs, activities, dialogs, and `data-*` hooks.
- Name guide flags for the destination or journey, such as `kyotoTransferGuide` or `flightGuide`, and use the same term across data, DOM ids, open functions, and tests.
- Use `localName`, `localAddress`, `localLanguage`, and `localLang` consistently. Do not invent alternate translation fields.

## Module and architecture boundaries

- `index.html::tripData` owns days, stays, transit, activities, notes, bookings, local names, and guide flags. `bookings`, `hotels`, and `localPlaceIndex` must stay derived from it.
- Update the structured model before the rendered consumers. Do not add hard-coded copies to Today, Tomorrow, the wallet, or the timeline.
- Keep repeated action SVGs in `index.html::actionIcons`. Use `data-action-icon` with `hydrateActionIcons` for static slots and interpolate the same icon for generated actions.
- Use one dialog and one `open*Guide` path per journey. Connect it through data flags rather than cloning guide markup for each entry point.
- Keep `sw.js` free of itinerary facts. It owns caching only.

## Comments and documentation

- Comment non-obvious intent, invariants, travel safety decisions, browser workarounds, and edge cases. Do not restate syntax.
- Update `DESIGN.md` in the same task when a reusable travel pattern, interaction contract, or canonical implementation changes.
- Keep volatile travel details and their first-party source links in the applicable guide, not in AGENTS references.

## Traveller content and privacy

- Verify schedules, terminals, fares, opening hours, entry rules, and booking procedures against current first-party sources.
- Never commit passwords, QR values, pickup codes, booking identifiers, card details, passport data, or private booking screenshots.
- Every non-English itinerary object needs correct local-language data under the contract in `DESIGN.md`.
- Do not mention an obsolete route as a revision note. Present the current plan, then label only a genuinely available fallback or a live cancellation.

## Generated files and source-of-truth ownership

- Run `scripts/build-app-icons.sh` after changing the Pikachu source or app-icon recipe. Inspect all generated sizes on light and dark phone surfaces.
- Run `scripts/build-og-image.sh` after changing `assets/og-image.svg`, the Pikachu source, or the social-image composition. Confirm `og-image.png` remains 1200 by 630 without stretching.
- When adding or removing an offline-critical asset, update `sw.js::CORE_ASSETS`. Change `CACHE_NAME` when cache identity or migration behaviour must change.
- Never hand-edit a generated PNG when its source and build script can produce the change.

## Canonical examples

| Concern | Example | Why it is authoritative |
| --- | --- | --- |
| Itinerary object | `index.html::tripData` | Drives the timeline, day state, bookings, stays, maps, weather, and local names |
| Local-name control | `index.html::localPlaceAction` and `toggleLocalPlace` | Keeps the English control and every rendered instance in sync |
| Action icon | `index.html::actionIcons` and `hydrateActionIcons` | Keeps icon meaning and markup consistent across static and generated UI |
| Date-derived briefing | `index.html::renderTodayView` and `renderTomorrowPreview` | Implements the Today plus Tomorrow contract |
| Travel guide | `index.html::kyotoTransferGuideDialog` | Shows the expected door-to-door structure and shared entry pattern |
| Guide regression | `tests/day-10-kyoto-guide.test.js` | Proves route data, times, seats, local phrases, entry points, and sources |

## Exceptions

- The app intentionally remains a single static document so it works on GitHub Pages without a build step. Do not split it into a framework or module system unless the user explicitly changes that deployment and maintenance constraint.
- A focused source-level test may extract functions or declarations from `index.html` with `node:vm`. Keep the extraction boundary stable and test user-visible behaviour rather than formatting trivia.

## Enforcement and validation

- `git diff --check` - must report no whitespace errors.
- `node tests/<focused-test>.test.js` - must fail before a bug fix or prove the affected feature after a change.
- `for test_file in tests/*.test.js; do node "$test_file" || exit 1; done` - every test must pass before completion.
