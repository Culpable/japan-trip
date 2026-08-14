# UI verification

## Scope and design authority

- Scope: the itinerary, Today and Tomorrow briefing, timeline, bookings and hotels, dialogs, local-name controls, maps, weather, auth gate, Pikachu companion, PWA prompts, and responsive layouts in `index.html`.
- Visual and interaction authority: `DESIGN.md`.

## Browser and server

- Primary browser tool: read and use the available `dev-browser` skill for rendered interaction, screenshots, console inspection, and viewport changes.
- Fallback: use `agent-browser` only when `dev-browser` is unavailable or explicitly requested.
- Health check: `curl -fsS http://127.0.0.1:4173/ >/dev/null` must succeed before navigation.
- Start with `python3 -m http.server 4173 --bind 127.0.0.1 --directory /Users/sacino/japan-trip`. Reuse only a known healthy project server. Close the task-owned browser and stop the task-owned server before completion.

## Identities and fixtures

- Begin with the locked state when auth-gate layout or access behaviour changed.
- For itinerary work, unlock with user-authorised access already available to the task. Never place the password, auth hash, or stored grant in documentation, commands, screenshots, or reports.
- Use `?date=<ISO timestamp>` for deterministic pre-trip, in-trip, tomorrow, and post-trip states. This query changes display state only.

## Routes and states

| Route or journey | Identity | State | Expected outcome |
| --- | --- | --- | --- |
| `/?date=2026-07-25T12:00:00+09:00` | Authorised local traveller | Pre-trip | Countdown, checklist, first stay, and full route render without stale in-trip state |
| `/?date=2026-08-06T12:00:00+09:00` | Authorised local traveller | In-trip | Today is the default, Tomorrow is visible, elapsed and upcoming moments are correct, and the next booking is current |
| `/?date=2026-08-14T15:00:00+09:00` | Authorised local traveller | Transfer day | Today and Tomorrow expose the relevant Narita and airport guides; guide actions open the shared dialogs |
| `/?date=2026-08-16T12:00:00+09:00` | Authorised local traveller | Post-trip | The full route returns and no stale Today-only view remains |
| Bookings action | Authorised local traveller | Wallet open | Upcoming moments precede past moments; stays, local names, maps, check-out times, reservations, and guide actions remain usable |
| Any journey-guide action | Authorised local traveller | Long dialog open | Header and close action remain visible; body scrolls; steps, translations, sources, and fallback are readable; the page behind stays locked |

Use a date relevant to the changed day instead of the examples when it gives stronger evidence.

## Viewports and interactions

- Desktop: 1280 by 900.
- Portrait phone: 390 by 844.
- Landscape phone: 844 by 390.
- Verify no page or dialog horizontal overflow, clipped text, hidden last step, accidental font zoom after rotation, or content under the notch or sticky controls.
- Open and close dialogs with the visible close control, backdrop, and Escape when the change touches dialog behaviour. Confirm the dialog reopens at its intended scroll position.
- Scroll every changed long dialog from first step to final sources. Confirm Pikachu moves into reserved compact-layout space and never covers text or controls.
- Toggle at least one local place to local text and back to English. Confirm every visible instance updates and the button label remains English.
- Verify action icons, labels, hover or active state, focus visibility, minimum touch target, and colour contrast.
- For Today or Tomorrow changes, advance the `?date=` time across the relevant milestone and confirm complete, current, next, and upcoming states change automatically.

## Evidence

- Capture screenshots of the changed state at desktop, portrait, and landscape sizes when appearance or layout changed. Use task-owned temporary paths, not repository assets.
- Inspect browser console and page errors after load, interaction, resize, rotation, and dialog close. Inspect failed requests when they affect the changed feature.
- Return the page or dialog to its intended starting position before full-frame evidence after locator-driven scrolling.

## Cleanup and completion

- Close the task-owned browser. Stop the server only if the task started it. Leave other browser and server sessions untouched.
- Do not commit screenshots, browser profiles, service-worker storage, or temporary test artefacts.
- Report each route, viewport, interaction, and error check. State any skipped check and the residual risk.
