# PARADOX — Implementation Tasks

Priority order: P0 = must ship, P1 = should ship, P2 = nice to have.
Each task is self-contained and can be reviewed independently.

---

## P0 — Correctness & clean repo

### T-01 Delete dead files
Remove `app/page.js`, `data/levels.js`, `lib/gameLogic.js`, and all four empty stubs
under `component/`.
- No code changes required in `app/page.tsx` (nothing imports these files).
- Verify `npm run build` still passes after deletion.

**Files changed:** `app/page.js` (deleted), `data/levels.js` (deleted),
`lib/gameLogic.js` (deleted), `component/CluePanel.jsx` (deleted),
`component/GameBoard.jsx` (deleted), `component/GameHeader.jsx` (deleted),
`component/GameOverlay.jsx` (deleted)

---

### T-02 Fix move-on-death bug
In the `move` callback in `app/page.tsx`, reorder logic so that `setMoves` and the
movement `setLastEvent`/`setDecisionTrace` calls are skipped when the target tile is
a danger tile.

See design.md §B-01 for the exact before/after.

**Files changed:** `app/page.tsx`

---

### T-03 Fix keyboard leak through Level Map modal
Add `|| showLevelSelect` to the early-return guard at the top of the `move` callback.

```ts
if (status !== "playing" || showBriefing || showLevelSelect) return;
```

**Files changed:** `app/page.tsx`

---

### T-04 Fix timer running during Level Map modal
Add `showLevelSelect` to the timer `useEffect` condition and dependency array.

```ts
if (status !== "playing" || showBriefing || showLevelSelect) return;
```

**Files changed:** `app/page.tsx`

---

### T-05 Fix signal banner message not surfacing
In the signal tile `onClick`, change `setLastEvent("movement")` to
`setLastEvent("none")` so `eventText` falls through to the `message` state, which
already holds the correct signal-specific string.

**Files changed:** `app/page.tsx`

---

### T-06 Fix missing `signalInspected` reset in Enter Chamber button
The "ENTER CHAMBER →" button calls `setShowBriefing(false)` but does not reset
`signalInspected`. This means inspecting a signal on level N, navigating back to the
map, and re-entering level N shows "SIGNAL INSPECTED" immediately.

Add `setSignalInspected(false)` to the Enter Chamber `onClick`.

**Files changed:** `app/page.tsx`

---

### T-07 Update metadata in layout.tsx
Replace the generic create-next-app metadata with game-specific title and description.

See design.md §Metadata design.

**Files changed:** `app/layout.tsx`

---

## P0 — CSS cleanup

### T-08 Deduplicate globals.css
The stylesheet currently contains:
- `.event-banner.lie / .truth / .blocked` defined twice
- `@media (prefers-reduced-motion: reduce)` defined three times
- Duplicate `.board` transition rule
- Duplicate `prefers-reduced-motion` suppression for `.board-pulse`

Consolidate every selector to a single declaration block. Keep the final (override)
values. Add section comments for maintainability.

This task is purely CSS — zero behaviour change.

**Files changed:** `app/globals.css`

---

## P1 — UX polish

### T-09 Mobile controls visible on all touch devices
Change the `.mobile-controls` display from `@media (max-width: 480px)` only to
`@media (pointer: coarse), (max-width: 768px)`.

Ensure tap targets are at minimum 44 × 44 px.

**Files changed:** `app/globals.css`

---

### T-10 Modal focus trap
When any modal opens, move focus to the first focusable element inside it.
When the modal closes, return focus to the element that opened it.

Implementation: a `useEffect` in `app/page.tsx` watching `showBriefing`,
`showLevelSelect`, and `status`. Use `useRef` on each modal's primary action button.

```ts
const briefingRef = useRef<HTMLButtonElement>(null);
const levelMapRef = useRef<HTMLButtonElement>(null);

useEffect(() => {
  if (showBriefing) briefingRef.current?.focus();
}, [showBriefing]);

useEffect(() => {
  if (showLevelSelect) levelMapRef.current?.focus();
}, [showLevelSelect]);
```

Attach the refs to the "ENTER CHAMBER →" button and the first level-map card
respectively.

**Files changed:** `app/page.tsx`

---

### T-11 Keyboard shortcut footer update
Add `?` (hint) and `↗` (level map) shortcut hints to the controls bar. Also wire `?`
as a keyboard shortcut for toggling the hint.

```tsx
<span>
  <b>?</b> <em>hint · </em>
  <b>R</b> <em>reset</em>
</span>
```

Add to `handleKeyDown`:
```ts
if (event.key === "?" || event.key === "/") {
  setShowHint(v => !v);
}
```

**Files changed:** `app/page.tsx`

---

### T-12 `aria-disabled` on locked Level Map cards
Replace `disabled={!unlocked}` with `aria-disabled={!unlocked}` and
`tabIndex={unlocked ? 0 : -1}` so screen-reader users can discover sealed chambers.
Guard the `onClick` with an `if (!unlocked) return` check (already present).

**Files changed:** `app/page.tsx`

---

### T-13 `mint-dot` CSS class missing from legend
The `.green-dot` class is defined in globals.css but the legend JSX uses `.mint-dot`.
The EXIT dot therefore renders as an unstyled element. Either add `.mint-dot` as an
alias or rename the JSX to use `.green-dot`.

Simplest fix — add to globals.css:
```css
.mint-dot {
  background: var(--success-mint);
}
```

**Files changed:** `app/globals.css`

---

## P1 — Content

### T-14 Update README.md
Replace the create-next-app template content with a real game description covering:
what PARADOX is, how to play, how to run locally, tech stack, and level list.

**Files changed:** `README.md`

---

## P2 — Nice to have

### T-15 Add `map-progress` CSS for active/completed state on level map cards
The `.map-progress` span is rendered in JSX but the active/completed colour variants
are in a late-appended block that only partially covers all states. Consolidate into
the main level-map section of globals.css (covered by T-08, listed separately for
clarity).

### T-16 Win screen — show time taken
The result modal shows MOVES and TRUST but not time. Adding `TIME {time}` to
`.result-data` would round out the stats without any new state.

### T-17 Board — `cursor: pointer` on signal tiles only
Currently `.tile:not(.tile-wall):hover` applies a lift effect on every non-wall tile,
implying every tile is interactive. Signal tiles have `cursor: pointer` via the late
CSS block, but non-signal tiles should use `cursor: default`. Add
`.tile:not(.tile-signal) { cursor: default; }` and remove the generic hover lift from
non-signal, non-goal tiles.

---

## Task execution order

```
T-01  → T-02 → T-03 → T-04 → T-05 → T-06   (P0 correctness, sequential)
T-07                                          (P0 metadata, independent)
T-08                                          (P0 CSS, independent)
T-09 → T-13                                   (P1 CSS, after T-08)
T-10 → T-11 → T-12 → T-14                    (P1 UX + content, after P0)
T-15 → T-16 → T-17                           (P2, last)
```

Estimated effort: T-01 through T-14 (everything P0 + P1) is roughly 2–3 hours of
focused implementation. P2 items are each under 20 minutes.
