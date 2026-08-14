# Jalena Japan Trip Repository Instructions

- These instructions apply to `/Users/sacino/japan-trip`; paths are repository-relative unless stated otherwise.
- Read a linked reference only when its listed trigger matches the current task.

<container_guidelines>

<content_safety>
- GitHub Pages serves committed files publicly. Never add passwords, QR or pickup codes, booking IDs, card or passport data, or private screenshots. The local gate is not server authentication.
- Preserve `noindex, nofollow, noarchive, nosnippet` unless the user changes the publication boundary.
- Verify volatile routes, times, terminals, fares, entry rules, opening hours, and booking instructions against current first-party sources. Link the evidence in the guide.
</content_safety>

<code_standards>
- Read [code-standards.md](documents/AGENTS/code-standards.md) before changing application, test, PWA, script, or generated-asset code. It governs source ownership, data, icons, assets, and focused edits; do not implement until its rules are identified.
- Mechanical enforcement: `git diff --check` and `for test_file in tests/*.test.js; do node "$test_file" || exit 1; done`.
- `index.html::tripData` is the itinerary source of truth. Do not introduce parallel day, transit, booking, hotel, or local-name datasets.
</code_standards>

</container_guidelines>

<container_information>

<description>
This private, date-aware static travel companion combines itinerary, stays, bookings, maps, weather, local text, offline access, and door-to-door guides. It is not a booking engine, general translator, or secure vault.
</description>

<travel_product_requirements>
- Give each destination, stay, transit leg, and moment its useful local name and address: Simplified Chinese in mainland China, Traditional Chinese in Hong Kong, and Japanese in Japan. Keep controls in English with one-click English/local switching.
- Use shared icons with English labels; never make an important action icon-only.
- During the trip, default to a clock-derived Today view with Tomorrow in the same briefing. Require no manual progress updates.
- Keep confirmed moments and stays in the Bookings modal with status, time, local name, map, reservation, check-out, and relevant guide actions.
- Give every hotel, city, province, country, flight, and border transfer a door-to-door guide. Cover stops, exits, booking, payment, luggage, gates, local phrases, maps, fallbacks, and first-party sources. Expose it on relevant day and booking surfaces.
</travel_product_requirements>

<design_documentation>

| Area | Source | Read when |
| --- | --- | --- |
| Travel experience and reusable design system | [`DESIGN.md`](DESIGN.md) | Read before itinerary, translation, icon, Today/Tomorrow, booking, guide, map, responsive, visual, interaction, or future travel-repo work. It governs the product contract; do not approve the design until it is applied. |

</design_documentation>

<environments>
- Development: serve static files with `python3 -m http.server 4173 --directory /Users/sacino/japan-trip` at `http://127.0.0.1:4173/`; storage is local and weather may call the Hong Kong Observatory.
- Test: standalone Node tests use local source and built-in mocks; no database, credentials, install, or production service.
- Production: GitHub Pages publishes `main` at `https://culpable.github.io/japan-trip/`. It is public and must not validate unpublished changes.
</environments>

<technology_stack>
This is a dependency-free HTML, CSS, and browser-JavaScript PWA with shell image generation and Node tests. Authorities: `index.html` for runtime and UI; `manifest.webmanifest` and `sw.js` for PWA; `scripts/build-app-icons.sh` and `scripts/build-og-image.sh` for images; `README.md` and GitHub Pages settings for deployment.
</technology_stack>

<testing_rules>
- Default completion gate: `for test_file in tests/*.test.js; do node "$test_file" || exit 1; done`.
- Read [testing.md](documents/AGENTS/testing.md) before focused, full-suite, asset, PWA, or browser checks. It governs selection, server ownership, date fixtures, and proof; do not claim completion until applicable checks pass.
- Read [ui-verification.md](documents/AGENTS/ui-verification.md) before verifying UI, dialogs, responsive layout, orientation, gated states, or date-derived views. It governs routes, viewports, interactions, evidence, and cleanup; do not claim the UI looks correct until it is applied.
</testing_rules>

</container_information>
