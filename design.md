# PARADOX — Design

## Architecture overview

```
app/
  layout.tsx        ← metadata, font setup, root HTML shell
  page.tsx          ← entire game (single client component, stays monolithic for now)
  globals.css       ← all styles (deduplicated, organised by concern)
  favicon.ico

public/             ← static assets (SVGs only, none game-critical)
```

`app/page.js`, `data/`, `lib/`, and `component/` are deleted — they belong to an
abandoned prototype and are not imported by anything in the live app.

### Why stay monolithic for now

Extracting components (GameBoard, CluePanel, etc.) is the correct long-term move, but
splitting a 1 000-line client component mid-hackathon introduces refactor risk with
little user-visible benefit. The empty stub files in `component/` are deleted as dead
weight; the real split is a post-hackathon task.

---

## State model

All state lives in the single `Home` component. The table below is the canonical
reference after fixes are applied.

| State | Type | Reset surfaces |
|---|---|---|
| `levelIndex` | `number` | Level Map, Continue |
| `highestLevel` | `number` | localStorage hydration, win handler |
| `player` | `Position` | All resets |
| `status` | `GameStatus` | All resets |
| `lastEvent` | `LastEvent` | All resets |
| `decisionTrace` | `string[]` | All resets |
| `boardPulse` | `boolean` | Auto-clears via setTimeout |
| `moves` | `number` | All resets |
| `mistakes` | `number` | All resets |
| `seconds` | `number` | All resets |
| `showBriefing` | `boolean` | Enters chamber, Level Map, Continue |
| `showHint` | `boolean` | All resets |
| `showLevelSelect` | `boolean` | Level Map close, card click |
| `analyzedClues` | `string[]` | All resets |
| `signalInspected` | `boolean` | All resets |
| `message` | `string` | All resets + event handlers |

"All resets" means: `resetLevel`, `nextLevel`, Level Map card click, Continue button.

---

## Bug designs

### B-01 Move-on-death (F-02)

Current code path:
```
setMoves(v => v + 1)        ← always runs
setLastEvent("movement")    ← always runs
...
if (danger) { setStatus("failed"); return; }
```

Fix: add an early return before the move/event state updates when the next tile is
a danger tile.

```
if (level.danger.includes(nextKey)) {
  setPlayer(next);
  setLastEvent("lie");
  setMistakes(v => v + 1);
  setStatus("failed");
  setMessage("PARADOX DETECTED: the statement was false.");
  return;
}
// only reach here on a safe step
setMoves(v => v + 1);
setLastEvent("movement");
...
```

### B-02 Modal keyboard leak (F-04)

The `move` callback already guards on `showBriefing`. Add guards for the result modal
and the level-map modal:

```ts
if (status !== "playing" || showBriefing || showLevelSelect) return;
```

The result modal (`status !== "playing"`) is already blocked by the first guard, so
only `showLevelSelect` needs to be added.

### B-03 Timer leak (F-05)

Add `showLevelSelect` to the timer effect dependency and condition:

```ts
if (status !== "playing" || showBriefing || showLevelSelect) return;
```

### B-04 Signal message not surfacing (F-08)

`signalInspected` is set to `true` and a specific `message` string is set, but
`lastEvent` is also set to `"movement"`, which causes `eventText` to resolve to the
generic movement string and overwrite `message`.

Fix: introduce a new `LastEvent` value `"signal"` or handle it by checking
`signalInspected` inside `eventText`. Simplest safe fix:

```ts
const eventText =
  lastEvent === "lie"      ? "The statement failed verification."
  : lastEvent === "truth"  ? "The route has been verified."
  : lastEvent === "blocked"? "Movement rejected by chamber geometry."
  : lastEvent === "movement"? "Decision recorded. The chamber is watching."
  : message;   // "none" falls through to message, which holds the signal text
```

Change signal tile onClick to set `lastEvent("none")` instead of `"movement"` so the
message falls through to the `message` state string, which already contains the correct
signal-specific text. This requires no new event type.

### B-05 Win handler highestLevel race (F-09)

The win handler inside `move`:
```ts
setHighestLevel(current => Math.max(current, levelIndex));
```

`levelIndex` is captured in the `move` closure correctly via the dependency array.
However `nextLevel` also uses `levelIndex` from closure. The real risk is navigating
backward via Level Map (setting `levelIndex` to a lower value) and winning — in that
case `Math.max(current, levelIndex)` would not raise the ceiling. This is already
correct because `current` holds the prior high-water mark. No code change needed here,
but the logic should be documented with a comment.

---

## CSS deduplication design

`globals.css` currently has:
- `.event-banner.lie / .truth / .blocked` rules defined **twice** (once in the main
  block, once appended later with slightly different values — the second wins due to
  cascade order).
- `@media (prefers-reduced-motion: reduce)` block appears **three times**.
- The `.board` transition rule appears in a second appended block that may conflict
  with the first.

Resolution: consolidate into a single block per selector. Keep the final (winning)
values. Remove all duplicate declarations. Organise sections with comments:

```
/* 1. Design tokens */
/* 2. Reset & base */
/* 3. Layout */
/* 4. Board */
/* 5. Tiles */
/* 6. Intel panel */
/* 7. Modals */
/* 8. Event banner */
/* 9. Signal status */
/* 10. Decision trace */
/* 11. Mobile controls */
/* 12. Responsive */
/* 13. Reduced motion */
```

---

## Metadata design (F-06)

`app/layout.tsx`:

```ts
export const metadata: Metadata = {
  title: "PARADOX — The Puzzle That Lies to You",
  description:
    "An 8-level logic puzzle where the board gives you information and you decide whether to trust it.",
};
```

---

## Mobile controls design (F-07)

`.mobile-controls` currently has no explicit display rule in the base styles — it
relies on an `@media (max-width: 480px)` block to show itself. On mid-range touch
devices (481–768 px) the controls are invisible.

Fix: show the controls on all touch-capable viewports. Use `@media (pointer: coarse)`
as the condition, with a fallback to `max-width: 768px`:

```css
@media (pointer: coarse), (max-width: 768px) {
  .mobile-controls {
    display: flex;
  }
}
```

Ensure minimum tap target:
```css
.mobile-controls button {
  min-height: 44px;
  min-width: 44px;
}
```

---

## Accessibility design (NF-01)

Already in place (from recent sessions):
- `role="grid"` + `aria-label` on board
- `role="gridcell"` + `aria-label` on every tile
- `role="group"` + `aria-label` on mobile controls
- `role="status"` + `aria-live="polite"` + `aria-atomic="true"` on event banner
- `aria-live="polite"` on signal status

Remaining gaps:
- **Focus trap in modals**: when a modal opens, `document.querySelector` the first
  focusable element inside it and call `.focus()`. On close, return focus to the
  trigger. Implement with a `useEffect` keyed to modal visibility.
- **Legend dot colour**: the legend uses colour-only dots. Add short text labels
  (already present: "YOU", "EXIT", "SIGNAL") — these are sufficient.
- **`aria-disabled`** on locked Level Map cards: currently uses the `disabled` HTML
  attribute which removes them from the tab order entirely. Prefer
  `aria-disabled="true"` + `tabIndex={0}` so screen-reader users know sealed chambers
  exist.

---

## README design (NF-05)

Replace the create-next-app boilerplate with a concise game description:

- What the game is (one paragraph)
- How to play (keys, objective)
- How to run locally (`npm install && npm run dev`)
- How to build (`npm run build`)
- Tech stack (Next.js 16, React 19, pure CSS)
- Level list (brief, no spoilers)
