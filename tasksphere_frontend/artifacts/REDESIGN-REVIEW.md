# TaskSphere frontend redesign

Implemented a shared navy/teal visual system with restrained aurora lighting, responsive workspace navigation, consistent auth layouts, compact task rows, status/priority badges, skeletons, and accessible dialogs. Task details use a right-side drawer and a full-width mobile sheet. All seven existing pages were updated; no dependencies were added.

Shared components are in `src/components`. Design tokens are in `tailwind.config.js`; responsive, focus, motion, and component styles are in `src/index.css`. The unused starter `src/App.css` was removed. The broken starter favicon reference was replaced with a TaskSphere SVG.

## Verification

- Production Vite build passes.
- Browser review covered all seven routes at 1440, 768, 390, and 320 CSS pixels: no horizontal page overflow, unassociated form controls, or unnamed buttons in the rendered states.
- Account settings dialog: focus enters the dialog, forward/backward Tab wrap inside it, background is inert, Escape closes it, and focus returns to the trigger.
- Reduced-motion emulation disables dialog animation.
- Source comparison against a saved pre-edit baseline confirms 23 request calls and 26 handlers/selectors are unchanged. Routing (`src/App.jsx`) and the API helper (`src/lib/api.js`) are byte-for-byte unchanged. See `contracts-review.txt`.
- Browser results are recorded in `browser-review.json`; desktop/mobile screenshots are saved alongside this report.

## Validation limits

The backend at localhost:8080 was unavailable. Authenticated data, mutations, invitation delivery, comments, ownership transitions, archive/restore, and completed CAPTCHA verification therefore require a live-backend smoke test. No fabricated API data was introduced. The third-party CAPTCHA widget did not load in the isolated browser; its existing verification handlers and site key are unchanged, with dark/compact presentation props added.

The repository's baseline lint run had five errors and one warning. The redesigned source has three existing hook errors and one existing dependency warning: AcceptInvite's synchronous state update in an effect, Dashboard/ProjectView's fetch functions referenced before declaration, and ProjectView's fetch effect dependency. These request-lifecycle behaviors were preserved. The two unused-error-state lint failures were resolved by presenting error notices. No lint rules were suppressed.

This is targeted accessibility verification, not a claim of a complete WCAG conformance audit. Live populated states, screen-reader testing, and browser zoom should be checked with the backend available.
