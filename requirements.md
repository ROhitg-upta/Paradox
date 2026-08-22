# PARADOX — Requirements

## Project context

PARADOX is an 8-level browser puzzle game built in Next.js 16 / React 19. The player
navigates a grid, reads clues that may be true or false, and must reach an exit without
stepping on a danger tile. The thematic through-line is epistemic skepticism: verify
before trusting.

The visual identity (cosmic dark palette, DM Mono / Space Grotesk, glowing cyan
accents, magenta danger) must be fully preserved. All 8 existing levels must be
preserved exactly.

---

## Functional requirements

### F-01 Single authoritative entry point
The app must have exactly one active page entry point (`app/page.tsx`). `app/page.js`
is a stale prototype and must be deleted. `data/levels.js` and `lib/gameLogic.js` are
consumed only by the deleted prototype and must also be removed once `page.js` is gone.
The four empty stub files under `component/` must be deleted.

### F-02 Correct move accounting
Move count must increment once per successful tile step. Currently the `move` function
increments moves even when the player lands on a danger tile (setting status to
"failed" on the same render). The increment must be skipped on a fatal step.

### F-03 Signal click correctness
The `signalInspected` flag must also reset in the Continue-from-save flow (already
partially done) and in every other path that reaches a new chamber. Verify all six
reset surfaces: `resetLevel`, `nextLevel`, Level Map click, Continue button,
`setShowBriefing(false)` from the Enter Chamber button.

### F-04 Keyboard trap prevention
When a modal is open (briefing, result, level map) keyboard movement events must be
blocked. Currently pressing arrow keys during the briefing modal moves the player
through the wall-free start area, accumulating moves before the level "begins". The
`showBriefing` guard exists for directional keys but the level-map and result modals
have no such guard.

### F-05 Timer integrity
The timer must not run while any modal is visible. Currently it only checks
`showBriefing`; it must also halt when `showLevelSelect` is true.

### F-06 Metadata
`app/layout.tsx` still carries the default create-next-app metadata (`"Create Next App"`
title, generic description). The `<title>` must read "PARADOX" and the description
must match the game's premise.

### F-07 Mobile controls always reachable
Mobile arrow buttons (`.mobile-controls`) are rendered inside the board panel but
display only on narrow viewports via CSS. They must be visible and tap-targetable on
all touch screens (min 44 × 44 px hit targets per WCAG 2.5.5).

### F-08 Signal inspection feedback completeness
Clicking a signal tile sets `signalInspected` to true and changes the `lastEvent`
state, but the event-banner text resolves from `lastEvent === "movement"` and shows the
generic movement message instead of the signal-specific one. The signal message must
surface in the banner.

### F-09 Progress persistence correctness
`highestLevel` is written to localStorage on `nextLevel` and on a winning move. A
player who wins the last level and then refreshes correctly restores their position.
However, a player who navigates backward via the Level Map and then wins does not
update `highestLevel` to the current `levelIndex` because the win handler compares
against the stale index. The win handler must take `levelIndex` into account.

### F-10 Keyboard shortcut discoverability
The footer documents W/A/S/D and R but not the hint toggle (`?`) or level map
(`↗`). Add these to the controls bar.

---

## Non-functional requirements

### NF-01 Accessibility
- Every interactive element must be keyboard-reachable and have a visible focus ring.
- Modal overlays must trap focus and return focus to the trigger element on close.
- Live regions (`aria-live="polite"`) must cover the event banner and signal status.
- Color must not be the sole differentiator of game state.
- `prefers-reduced-motion` must suppress all CSS animations.

### NF-02 Mobile usability
- The layout must be fully usable on screens from 375 px wide.
- Touch targets must meet 44 × 44 px minimum.
- The board must not overflow its container at any breakpoint.

### NF-03 Performance
- No runtime errors in the browser console.
- No duplicate CSS rule blocks (currently `event-banner.lie/truth/blocked` rules appear
  twice in `globals.css`, and `prefers-reduced-motion` appears three times).
- Fonts are loaded from Google Fonts (external request); acceptable for hackathon scope.

### NF-04 Code quality
- No dead files in the repository.
- No TypeScript errors (`tsc --noEmit` passes cleanly).
- ESLint passes with zero errors.

### NF-05 Deployment readiness
- `npm run build` must complete without errors.
- `app/layout.tsx` must carry correct metadata.
- `README.md` must be updated to describe the actual game rather than the
  create-next-app template.

---

## Out of scope (not required for hackathon)

- Sound effects or music
- Animated tile transitions beyond the existing board-pulse
- Server-side state or backend of any kind
- User accounts or leaderboards
- Additional levels beyond the existing 8
- Internationalisation
