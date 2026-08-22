"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";



type Tile =
  | "start"
  | "empty"
  | "wall"
  | "safe"
  | "danger"
  | "goal"
  | "signal"
  | "switch"
  | "gate";

type Position = {
  row: number;
  col: number;
};

type ClueType = "truth" | "lie" | "unknown" | "conditional";

type Clue = {
  id: string;
  label: string;
  text: string;
  type: ClueType;
  explanation: string;
  evidence: string;
};

type Level = {
  id: number;
  code: string;
  title: string;
  subtitle: string;
  grid: Tile[][];
  start: Position;
  goal: Position;
  danger: string[];
  clues: Clue[];
  insight: string;
  hint: string;
};

type Direction = "UP" | "DOWN" | "LEFT" | "RIGHT";
type GameStatus = "playing" | "won" | "failed";
type LastEvent = "none" | "movement" | "lie" | "truth" | "blocked";

const levels: Level[] = [
  {
    id: 1,
    code: "ENTRY_01",
    title: "The Helpful Machine",
    subtitle: "The first message appears harmless.",
    grid: [
      ["start", "empty", "safe", "wall", "wall"],
      ["wall", "empty", "safe", "empty", "empty"],
      ["wall", "wall", "safe", "empty", "wall"],
      ["wall", "wall", "safe", "goal", "wall"],
    ],
    start: { row: 0, col: 0 },
    goal: { row: 3, col: 3 },
    danger: [],
    clues: [
      {
        id: "clue-1",
        label: "DIRECTIVE",
        text: "The luminous route will not harm you.",
        type: "truth",
        explanation: "This time, the system is telling the truth.",
        evidence: "The luminous route connects continuously to the exit.",
      },
    ],
    insight:
      "Trust is not always foolish. It is foolish when it is never tested.",
    hint: "Move right, then follow the luminous route downward.",
  },
  {
    id: 2,
    code: "ENTRY_02",
    title: "First Lie",
    subtitle: "The system has noticed that you follow instructions.",
    grid: [
      ["start", "empty", "signal", "wall", "wall"],
      ["wall", "empty", "danger", "empty", "empty"],
      ["wall", "wall", "empty", "empty", "wall"],
      ["wall", "wall", "empty", "goal", "wall"],
    ],
    start: { row: 0, col: 0 },
    goal: { row: 3, col: 3 },
    danger: ["1-2"],
    clues: [
      {
        id: "clue-2",
        label: "DIRECTIVE",
        text: "The marked tile is safe.",
        type: "lie",
        explanation: "The marked tile was bait. The system lied.",
        evidence: "The marked tile leads directly into an unstable zone.",
      },
    ],
    insight:
      "A confident message is not the same thing as reliable evidence.",
    hint: "Do not follow the marked signal. Use the open route.",
  },
  {
    id: 3,
    code: "ENTRY_03",
    title: "The Word Trap",
    subtitle: "The wording itself contains a warning.",
    grid: [
      ["start", "signal", "empty", "wall", "wall"],
      ["wall", "empty", "danger", "empty", "empty"],
      ["wall", "wall", "empty", "empty", "wall"],
      ["wall", "wall", "empty", "goal", "wall"],
    ],
    start: { row: 0, col: 0 },
    goal: { row: 3, col: 3 },
    danger: ["1-2"],
    clues: [
      {
        id: "clue-3a",
        label: "META DIRECTIVE",
        text: "Every clue containing a colour word is unreliable.",
        type: "truth",
        explanation: "The wording itself is a system trigger.",
        evidence: "Colour-based instructions have failed verification before.",
      },
      {
        id: "clue-3b",
        label: "CORRUPTED SIGNAL",
        text: "The marked tile is safe.",
        type: "lie",
        explanation: "The trigger word exposes this clue as unreliable.",
        evidence: "The marked signal overlaps with an unstable route.",
      },
    ],
    insight:
      "Sometimes a clue describes how to read the other clues.",
    hint: "Treat colour-based promises as compromised information.",
  },
  {
    id: 4,
    code: "ENTRY_04",
    title: "Half-Truth",
    subtitle: "A statement can be true only at the right moment.",
    grid: [
      ["start", "empty", "signal", "wall", "wall"],
      ["wall", "empty", "empty", "danger", "empty"],
      ["wall", "wall", "empty", "empty", "wall"],
      ["wall", "wall", "empty", "goal", "wall"],
    ],
    start: { row: 0, col: 0 },
    goal: { row: 3, col: 3 },
    danger: ["1-3"],
    clues: [
      {
        id: "clue-4",
        label: "CONDITIONAL MESSAGE",
        text: "The amber tile is safe only after a downward move.",
        type: "conditional",
        explanation: "The statement has a condition attached to it.",
        evidence:
          "Without the required previous action, this clue cannot be trusted.",
      },
    ],
    insight: "Context can change the meaning of a true statement.",
    hint: "Avoid the amber signal and use the central open route.",
  },
  {
    id: 5,
    code: "ENTRY_05",
    title: "Visual Conflict",
    subtitle: "The interface can speak louder than the narrator.",
    grid: [
      ["start", "empty", "signal", "wall", "wall"],
      ["wall", "empty", "danger", "empty", "empty"],
      ["wall", "wall", "empty", "empty", "wall"],
      ["wall", "wall", "empty", "goal", "wall"],
    ],
    start: { row: 0, col: 0 },
    goal: { row: 3, col: 3 },
    danger: ["1-2"],
    clues: [
      {
        id: "clue-5a",
        label: "NARRATOR",
        text: "The marked signal is safe.",
        type: "lie",
        explanation: "The narrator points toward the unstable tile.",
        evidence:
          "The warning marker conflicts with the narrator's claim.",
      },
      {
        id: "clue-5b",
        label: "BOARD TELEMETRY",
        text: "Broken borders indicate unstable tiles.",
        type: "truth",
        explanation: "The board provides the more reliable signal.",
        evidence:
          "The broken border appears consistently around danger zones.",
      },
    ],
    insight:
      "Trust must be earned by consistent evidence, not authoritative language.",
    hint: "Observe the tile treatment instead of following the narrator.",
  },
  {
    id: 6,
    code: "ENTRY_06",
    title: "Exactly One",
    subtitle: "Logic survives where trust does not.",
    grid: [
      ["start", "empty", "signal", "wall", "wall"],
      ["wall", "empty", "danger", "empty", "empty"],
      ["wall", "wall", "empty", "empty", "wall"],
      ["wall", "wall", "empty", "goal", "wall"],
    ],
    start: { row: 0, col: 0 },
    goal: { row: 3, col: 3 },
    danger: ["1-2"],
    clues: [
      {
        id: "clue-6a",
        label: "STATEMENT A",
        text: "The marked tile is safe.",
        type: "lie",
        explanation: "Statement A is false.",
        evidence: "The marked tile enters the unstable route.",
      },
      {
        id: "clue-6b",
        label: "STATEMENT B",
        text: "Exactly one statement in this chamber is true.",
        type: "truth",
        explanation: "The contradiction is intentional.",
        evidence: "The room is built around a one-truth constraint.",
      },
    ],
    insight:
      "A lie can reveal the shape of the truth if you understand the system.",
    hint: "The marked tile is dangerous. Follow the route you can verify.",
  },
  {
    id: 7,
    code: "ENTRY_07",
    title: "Memory Trace",
    subtitle: "The system remembers what you trusted before.",
    grid: [
      ["start", "empty", "signal", "wall", "wall"],
      ["wall", "empty", "danger", "empty", "empty"],
      ["wall", "wall", "empty", "empty", "wall"],
      ["wall", "wall", "empty", "goal", "wall"],
    ],
    start: { row: 0, col: 0 },
    goal: { row: 3, col: 3 },
    danger: ["1-2"],
    clues: [
      {
        id: "clue-7",
        label: "MEMORY MESSAGE",
        text: "The system records which signals attract you.",
        type: "unknown",
        explanation: "Your past behaviour is now part of the puzzle.",
        evidence:
          "Repeated decisions influence the chamber's confidence model.",
      },
    ],
    insight:
      "A good puzzle remembers what the player learns—and what the player ignores.",
    hint: "Do not repeat the instinct that led you toward the signal.",
  },
  {
    id: 8,
    code: "FINAL_08",
    title: "The Last Question",
    subtitle: "You are not escaping the board. You are escaping the lie.",
    grid: [
      ["start", "empty", "signal", "wall", "wall"],
      ["wall", "empty", "danger", "empty", "empty"],
      ["wall", "wall", "empty", "empty", "wall"],
      ["wall", "wall", "empty", "goal", "wall"],
    ],
    start: { row: 0, col: 0 },
    goal: { row: 3, col: 3 },
    danger: ["1-2"],
    clues: [
      {
        id: "clue-8a",
        label: "STATEMENT A",
        text: "The marked tile is safe.",
        type: "lie",
        explanation: "The marked tile is the final bait.",
        evidence: "Its signal is attractive, but its route is unstable.",
      },
      {
        id: "clue-8b",
        label: "STATEMENT B",
        text: "The first statement is a lie.",
        type: "truth",
        explanation: "The system accidentally reveals its contradiction.",
        evidence: "The board confirms that the marked route is unsafe.",
      },
      {
        id: "clue-8c",
        label: "SYSTEM INSIGHT",
        text: "The safest path is the one you can justify.",
        type: "truth",
        explanation: "Verification beats obedience.",
        evidence: "The neutral path is the only consistently verified route.",
      },
    ],
    insight:
      "The final answer is not trust. The final answer is verification.",
    hint: "Ignore the attractive signal and follow the route you can prove.",
  },
];

// Per-level contextual safe-step messages.
// These reinforce each chamber's epistemic theme through the existing event-banner UI.
// No new state or failure modes are introduced.
//
// Mechanics that cannot be implemented fairly with the current data model:
//   Level 4 (conditional): enforcing "safe only after a downward move" requires a
//     lastMoveDirection state and a new failure mode not described by the grid —
//     this would be a hidden rule. Documented here; not implemented.
//   Level 7 (memory): the decisionTrace resets on every level. True cross-level
//     memory would require persistence (localStorage or server). Faking it with
//     a flag would be dishonest. The clue text already conveys the theme; no
//     mechanical change is added.
//   Cross-level progression tracking beyond highestLevel: out of scope for the
//     current single-component architecture.
const levelMessages: Record<number, string> = {
  1: "Safe route confirmed. The luminous path holds.",
  2: "Step recorded. The signal remains unverified.",
  3: "Decision logged. Colour-coded claims carry no guarantee.",
  4: "Move accepted. Conditional statements require their conditions to be met.",
  5: "Observation recorded. The board's evidence outranks the narrator's claim.",
  6: "Step valid. Exactly one statement in this chamber can be true.",
  7: "Pattern recorded. The system is watching which signals you approach.",
  8: "Path accepted. The only safe route is the one you can justify.",
};

const directionDelta: Record<Direction, Position> = {
  UP: { row: -1, col: 0 },
  DOWN: { row: 1, col: 0 },
  LEFT: { row: 0, col: -1 },
  RIGHT: { row: 0, col: 1 },
};

function positionKey(position: Position) {
  return `${position.row}-${position.col}`;
}

function samePosition(first: Position, second: Position) {
  return first.row === second.row && first.col === second.col;
}

export default function Home() {
  const [levelIndex, setLevelIndex] = useState(0);
  const [highestLevel, setHighestLevel] = useState(() => {
    if (typeof window === "undefined") return 0;
    const saved = window.localStorage.getItem("paradox-highest-level");
    const parsed = Number(saved);
    return Number.isInteger(parsed) &&
      parsed >= 0 &&
      parsed < levels.length
      ? parsed
      : 0;
  });
  const [player, setPlayer] = useState<Position>(levels[0].start);
  const [status, setStatus] = useState<GameStatus>("playing");
  const [lastEvent, setLastEvent] = useState<LastEvent>("none");
  const [decisionTrace, setDecisionTrace] = useState<string[]>([]);
  const [boardPulse, setBoardPulse] = useState(false);
  const [moves, setMoves] = useState(0);
  const [mistakes, setMistakes] = useState(0);
  const [seconds, setSeconds] = useState(0);
  const [showBriefing, setShowBriefing] = useState(true);
  const [showHint, setShowHint] = useState(false);
  const [showLevelSelect, setShowLevelSelect] = useState(false);
  const [analyzedClues, setAnalyzedClues] = useState<string[]>([]);
  const [signalInspected, setSignalInspected] = useState(false);
  const [message, setMessage] = useState(
    "The chamber is waiting for a decision."
  );

  // Refs for focus management
  // levelMapTriggerRef  — the "LEVEL MAP ↗" button that opens the map modal
  // levelMapCloseRef    — the "×" close button inside the map modal (focus-on-open)
  // enterChamberRef     — the "ENTER CHAMBER →" button (focus-on-open for briefing)
  // tryAgainRef         — the "TRY AGAIN" button (focus-on-open for result modal)
  const levelMapTriggerRef = useRef<HTMLButtonElement>(null);
  const levelMapCloseRef = useRef<HTMLButtonElement>(null);
  const enterChamberRef = useRef<HTMLButtonElement>(null);
  const tryAgainRef = useRef<HTMLButtonElement>(null);

  // --- Audio system ---
  // soundEnabled is OFF by default. AudioContext is never created until the user
  // explicitly turns sound ON (an explicit user gesture, satisfying browser policy).
  const [soundEnabled, setSoundEnabled] = useState(false);
  const audioCtxRef = useRef<AudioContext | null>(null);

  // Cue types map to distinct timbres so each event is clearly distinguishable.
  type SoundCue = "movement" | "blocked" | "danger" | "win";

  const playSound = useCallback((cue: SoundCue): void => {
    if (!soundEnabled) return;
    try {
      // Reuse the existing context; create one only if absent or closed.
      if (!audioCtxRef.current || audioCtxRef.current.state === "closed") {
        audioCtxRef.current = new AudioContext();
      }
      const ctx = audioCtxRef.current;
      if (ctx.state === "suspended") {
        void ctx.resume();
      }

      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      // Keep volume low and non-annoying across all cues.
      const BASE_GAIN = 0.07;

      switch (cue) {
        case "movement": {
          // Soft high blip — short sine, quick fade
          osc.type = "sine";
          osc.frequency.setValueAtTime(880, now);
          gain.gain.setValueAtTime(BASE_GAIN, now);
          gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.08);
          osc.start(now);
          osc.stop(now + 0.08);
          break;
        }
        case "blocked": {
          // Low short click — triangle, very brief
          osc.type = "triangle";
          osc.frequency.setValueAtTime(110, now);
          gain.gain.setValueAtTime(BASE_GAIN, now);
          gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.06);
          osc.start(now);
          osc.stop(now + 0.06);
          break;
        }
        case "danger": {
          // Short descending tone — sawtooth sweep down
          osc.type = "sawtooth";
          osc.frequency.setValueAtTime(440, now);
          osc.frequency.exponentialRampToValueAtTime(110, now + 0.25);
          gain.gain.setValueAtTime(BASE_GAIN, now);
          gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.25);
          osc.start(now);
          osc.stop(now + 0.25);
          break;
        }
        case "win": {
          // Two-tone confirmation — two sine notes, staggered
          const osc2 = ctx.createOscillator();
          const gain2 = ctx.createGain();
          osc2.connect(gain2);
          gain2.connect(ctx.destination);

          osc.type = "sine";
          osc.frequency.setValueAtTime(523, now);         // C5
          gain.gain.setValueAtTime(BASE_GAIN, now);
          gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.15);
          osc.start(now);
          osc.stop(now + 0.15);

          osc2.type = "sine";
          osc2.frequency.setValueAtTime(784, now + 0.12); // G5
          gain2.gain.setValueAtTime(BASE_GAIN, now + 0.12);
          gain2.gain.exponentialRampToValueAtTime(0.0001, now + 0.32);
          osc2.start(now + 0.12);
          osc2.stop(now + 0.32);
          break;
        }
      }
    } catch {
      // Web Audio unavailable or blocked — gameplay continues unaffected.
    }
  }, [soundEnabled]);

  const level = levels[levelIndex];

  const trust = useMemo(() => {
    const penalty = mistakes * 24 + Math.max(0, moves - 8) * 2;
    return Math.max(20, 100 - penalty);
  }, [mistakes, moves]);

 const resetLevel = useCallback(() => {
  setPlayer(level.start);
  setStatus("playing");
  setLastEvent("none");
  setDecisionTrace([]);
  setMoves(0);
  setMistakes(0);
  setSeconds(0);
  setShowBriefing(false);
  setShowHint(false);
  setAnalyzedClues([]);
  setSignalInspected(false);
  setMessage("The chamber reset. Your memory did not.");
}, [level]);

  const nextLevel = useCallback(() => {
    const nextIndex = levelIndex + 1;
    if (nextIndex > highestLevel + 1) {
  setMessage("This sequence is still sealed.");
  return;
}

    if (nextIndex >= levels.length) {
      setMessage("All available chambers have been verified.");
      return;
    }

    setLevelIndex(nextIndex);
    setHighestLevel((current) => {
  const nextHighest = Math.max(current, nextIndex);

  window.localStorage.setItem(
    "paradox-highest-level",
    String(nextHighest)
  );

  return nextHighest;
});
    setPlayer(levels[nextIndex].start);
    setStatus("playing");
setLastEvent("none");
setDecisionTrace([]);
setMoves(0);
    setMistakes(0);
    setSeconds(0);
    setShowBriefing(true);
    setShowHint(false);
    setAnalyzedClues([]);
    setSignalInspected(false);
    setMessage("New chamber detected. Do not assume continuity.");
  }, [highestLevel, levelIndex]);

  const move = useCallback(
    (direction: Direction) => {
      if (status !== "playing" || showBriefing || showLevelSelect) return;

      const delta = directionDelta[direction];
      const next = {
        row: player.row + delta.row,
        col: player.col + delta.col,
      };

      const outside =
        next.row < 0 ||
        next.row >= level.grid.length ||
        next.col < 0 ||
        next.col >= level.grid[0].length;

      if (outside) {
        setLastEvent("blocked");
        setMessage("Boundary rejected. There is no chamber beyond it.");
        playSound("blocked");
        return;
      }

      if (level.grid[next.row][next.col] === "wall") {
        setLastEvent("blocked");
        setMessage("Blocked. The board refuses that decision.");
        playSound("blocked");
        return;
      }

      const nextKey = positionKey(next);

      // Check outcome before committing any movement state.
      if (level.danger.includes(nextKey)) {
        setPlayer(next);
        setLastEvent("lie");
        setMistakes((value) => value + 1);
        setStatus("failed");
        setMessage("PARADOX DETECTED: the statement was false.");
        playSound("danger");
        return;
      }

      if (samePosition(next, level.goal)) {
        setPlayer(next);
        setLastEvent("truth");
        setStatus("won");

        setHighestLevel((current) => {
          const nextHighest = Math.max(current, levelIndex);

          window.localStorage.setItem(
            "paradox-highest-level",
            String(nextHighest)
          );

          return nextHighest;
        });

        setMessage("Verification complete. You found the exit.");
        playSound("win");
        return;
      }

      // Safe tile — record the step.
      setPlayer(next);
      setMoves((value) => value + 1);
      setLastEvent("movement");
      setBoardPulse(true);
      window.setTimeout(() => setBoardPulse(false), 180);
      setDecisionTrace((current) => [
        ...current.slice(-5),
        `${direction} → ${nextKey}`,
      ]);
      const baseMessage =
        levelMessages[level.id] ??
        "Decision recorded. Continue without surrendering judgment.";
      const nudge =
        (level.id === 6 || level.id === 8) && analyzedClues.length === 0
          ? " Inspect the clues before committing to a route."
          : "";
      setMessage(baseMessage + nudge);
      playSound("movement");
    },
   [analyzedClues.length, level, levelIndex, player, playSound, showBriefing, showLevelSelect, status]
  );

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      const controls: Record<string, Direction> = {
        ArrowUp: "UP",
        ArrowDown: "DOWN",
        ArrowLeft: "LEFT",
        ArrowRight: "RIGHT",
        w: "UP",
        W: "UP",
        a: "LEFT",
        A: "LEFT",
        s: "DOWN",
        S: "DOWN",
        d: "RIGHT",
        D: "RIGHT",
      };

      const direction = controls[event.key];

      if (direction) {
        event.preventDefault();
        move(direction);
      }

      if (event.key === "r" || event.key === "R") {
        resetLevel();
      }

      // Escape closes only the Level Map modal.
      // Briefing and result modals are intentionally non-dismissible.
      if (event.key === "Escape" && showLevelSelect) {
        setShowLevelSelect(false);
        levelMapTriggerRef.current?.focus();
      }
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [levelMapTriggerRef, move, resetLevel, showLevelSelect]);

  useEffect(() => {
    if (status !== "playing" || showBriefing) return;

    const timer = window.setInterval(() => {
      setSeconds((value) => value + 1);
    }, 1000);

    return () => window.clearInterval(timer);
  }, [showBriefing, showLevelSelect, status]);

  // Focus management: move focus into the modal when it opens.
  // Level Map — focus the close button (first meaningful action).
  useEffect(() => {
    if (showLevelSelect) {
      levelMapCloseRef.current?.focus();
    }
  }, [showLevelSelect]);

  // Briefing — focus "ENTER CHAMBER →" when the briefing appears.
  // Fires on initial page load and on every new chamber briefing.
  useEffect(() => {
    if (showBriefing) {
      enterChamberRef.current?.focus();
    }
  }, [showBriefing]);

  // Result (won / failed) — focus "TRY AGAIN" so keyboard users can act immediately.
  useEffect(() => {
    if (status !== "playing") {
      tryAgainRef.current?.focus();
    }
  }, [status]);

  // Close AudioContext on unmount to release OS audio resources.
  useEffect(() => {
    return () => {
      if (audioCtxRef.current && audioCtxRef.current.state !== "closed") {
        void audioCtxRef.current.close();
      }
    };
  }, []);

  function analyzeClue(clue: Clue) {
    setAnalyzedClues((current) =>
      current.includes(clue.id) ? current : [...current, clue.id]
    );
  }

  function tileClass(tile: Tile, position: Position) {
    const classes = ["tile", `tile-${tile}`];
    if (tile === "signal") {
  classes.push("tile-signal");
}

    if (samePosition(player, position)) classes.push("tile-player");
    if (samePosition(level.goal, position)) classes.push("tile-goal");
    if (level.danger.includes(positionKey(position))) {
      classes.push("tile-danger");
    }

    return classes.join(" ");
  }

 function tileSymbol(tile: Tile, position: Position) {
  if (samePosition(player, position)) return "◆";
  if (samePosition(level.goal, position)) return "✦";
  if (tile === "wall") return "▦";

  if (level.danger.includes(positionKey(position))) {
    return "!";
  }

  if (tile === "signal") return "◉";

  return "";
}

  const time = `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(
    seconds % 60
  ).padStart(2, "0")}`;

  // Performance rating — derived only from existing state, no hidden rules.
  // S: perfect run, 6 moves or fewer
  // A: no mistakes, 8 moves or fewer
  // B: no mistakes, more than 8 moves
  // C: one or more mistakes
  const rating: "S" | "A" | "B" | "C" =
    mistakes === 0 && moves <= 6
      ? "S"
      : mistakes === 0 && moves <= 8
      ? "A"
      : mistakes === 0
      ? "B"
      : "C";

  // Show special ending copy only when the final chamber is won.
  const isFinalWin = status === "won" && levelIndex === levels.length - 1;

  const eventText =
    lastEvent === "lie"
      ? "The statement failed verification."
      : lastEvent === "truth"
      ? "The route has been verified."
      : lastEvent === "blocked"
      ? "Movement rejected by chamber geometry."
      : lastEvent === "movement"
      ? "Decision recorded. The chamber is watching."
      : message;

  const eventSymbol =
    lastEvent === "lie"
      ? "!"
      : lastEvent === "truth"
      ? "✓"
      : lastEvent === "blocked"
      ? "×"
      : lastEvent === "movement"
      ? "·"
      : "○";

  const signalStatus = signalInspected
    ? "SIGNAL INSPECTED"
    : "SIGNAL UNVERIFIED";

  return (
    <main className="paradox-app">
      <div className="noise" />

      <div
        className="app-frame"
        {...((showBriefing || showLevelSelect || status !== "playing") ? { inert: true } : {})}
      >
       <header className="header">
  <div className="logo-group">
    <div className="logo">P</div>
    <div>
      <div className="overline cyan">COGNITIVE SECURITY SYSTEM</div>
      <h1>PARADOX</h1>
    </div>
  </div>

  <div className="header-actions">
    <div className="live-status">
      <span className="live-dot" />
      LIVE INSTANCE
      <span className="slash">/</span>
      SUBJECT 001
    </div>

    <button
      className={`sound-toggle ${soundEnabled ? "sound-on" : ""}`}
      aria-pressed={soundEnabled}
      aria-label={soundEnabled ? "Disable sound" : "Enable sound"}
      onClick={() => {
        const next = !soundEnabled;
        setSoundEnabled(next);
        if (next) {
          // Create or resume AudioContext on this explicit user gesture.
          try {
            if (
              !audioCtxRef.current ||
              audioCtxRef.current.state === "closed"
            ) {
              audioCtxRef.current = new AudioContext();
            } else if (audioCtxRef.current.state === "suspended") {
              void audioCtxRef.current.resume();
            }
          } catch {
            // AudioContext unavailable — sound simply stays silent.
          }
        }
      }}
    >
      SOUND: {soundEnabled ? "ON" : "OFF"}
    </button>

    <button
      className="level-select-trigger"
      ref={levelMapTriggerRef}
      onClick={() => setShowLevelSelect(true)}
    >
      LEVEL MAP <span>↗</span>
    </button>
  </div>
</header>

        <section className="intro">
          <div>
            <div className="overline magenta">THE PUZZLE THAT LIES TO YOU</div>
            <h2>
              The board gives answers.
              <br />
              Your job is to question them.
            </h2>
          </div>

          <div className="sequence">
            <span>SEQUENCE</span>
            <strong>
              {String(level.id).padStart(2, "0")}
              <small>
  {" "}
  / {String(levels.length).padStart(2, "0")}
</small>  
            </strong>
            <span className="progress-label">
  {Math.min(highestLevel + 1, levels.length)} CHAMBERS UNLOCKED
</span>
          </div>
        </section>

        <section className="game-grid">
          <div className="board-panel panel">
            <div className="panel-header">
              <div>
                <div className="overline">ACTIVE CHAMBER</div>
                <h3>{level.code}</h3>
              </div>

              <div className="timer">
                <span>ELAPSED</span>
                <strong>{time}</strong>
              </div>
            </div>

            <div className="board-area">
              <div
               className={`board ${boardPulse ? "board-pulse" : ""}`}
                role="grid"
                aria-label={`${level.code} puzzle board. Player position ${player.row + 1}, ${player.col + 1}.`}
                style={{
                  gridTemplateColumns: `repeat(${level.grid[0].length}, 1fr)`,
                }}
              >
                {level.grid.map((row, rowIndex) =>
                  row.map((tile, colIndex) => {
                    const position = {
                      row: rowIndex,
                      col: colIndex,
                    };

                    return (
                      <div
                        key={`${rowIndex}-${colIndex}`}
                        className={tileClass(tile, position)}
                        role="gridcell"
                        onClick={() => {
                          if (tile !== "signal") return;

                          setSignalInspected(true);
                          setLastEvent("movement");
                          setMessage(
                            "Signal inspected. Attractive information is not verified information."
                          );
                        }}
                        aria-label={
                          samePosition(player, position)
                            ? "Your current position"
                            : samePosition(level.goal, position)
                            ? "Exit"
                            : tile === "wall"
                            ? "Blocked wall"
                            : level.danger.includes(positionKey(position))
                            ? "Unstable danger tile"
                            : tile === "signal"
                            ? "Signal tile. Verify before trusting."
                            : "Open tile"
                        }
                      >
                        {tileSymbol(tile, position)}
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            <div className="board-bottom">
              <div className="legend">
                <span>
                  <i className="dot white-dot" /> YOU
                </span>
                <span>
                  <i className="dot mint-dot" /> EXIT
                </span>
                <span>
                  <i className="dot amber-dot" /> SIGNAL
                </span>
              </div>

              <span className="position">
                POS {player.row + 1}:{player.col + 1}
              </span>
            </div>

            <div className="signal-status" aria-live="polite">
              <span className="overline amber">SIGNAL STATUS</span>
              <strong>{signalStatus}</strong>
            </div>

            <div
  className={`event-banner ${lastEvent}`}
  role="status"
  aria-live="polite"
  aria-atomic="true"
>
              <span>{eventSymbol}</span>
              <p>{eventText}</p>
            </div>

            <div
              className="mobile-controls"
              aria-label="Movement controls"
              role="group"
            >
              <button onClick={() => move("UP")} aria-label="Move up">
                ↑
              </button>

              <div>
                <button onClick={() => move("LEFT")} aria-label="Move left">
                  ←
                </button>
                <button onClick={() => move("DOWN")} aria-label="Move down">
                  ↓
                </button>
                <button onClick={() => move("RIGHT")} aria-label="Move right">
                  →
                </button>
              </div>
            </div>
          </div>

          <aside className="intel-panel panel">
            <div className="panel-header">
              <div>
                <div className="overline cyan">INTELLIGENCE FEED</div>
                <h3>Evidence Log</h3>
              </div>

              <span className="rec">● REC</span>
            </div>

            <div className="objective">
              <div className="overline">CURRENT OBJECTIVE</div>
              <p>{level.subtitle}</p>
              <div className="objective-note">
                ✦ Reach the exit without accepting a false premise.
              </div>
            </div>
            {decisionTrace.length > 0 && (
  <div className="decision-trace">
    <div className="overline amber">DECISION TRACE</div>

    {decisionTrace.map((entry, index) => (
      <div className="trace-entry" key={`${entry}-${index}`}>
        <span>{String(index + 1).padStart(2, "0")}</span>
        <strong>{entry}</strong>
      </div>
    ))}
  </div>
)}

            <div className="clues">
              {level.clues.map((clue) => {
                const analyzed = analyzedClues.includes(clue.id);

                return (
                  <button
                    className={`clue ${analyzed ? "analyzed" : ""}`}
                    key={clue.id}
                    onClick={() => analyzeClue(clue)}
                  >
                    <div className="clue-top">
                      <span>{clue.label}</span>
                      <span>{analyzed ? "VERIFIED" : "INSPECT ↗"}</span>
                    </div>

                    <p>“{clue.text}”</p>

                    {analyzed && (
                      <div className="clue-analysis">
                        <small>{clue.explanation}</small>

                        <span className={`truth-badge ${clue.type}`}>
                          {clue.type === "truth"
                            ? "TRUTH VERIFIED"
                            : clue.type === "lie"
                            ? "LIE CONFIRMED"
                            : clue.type === "conditional"
                            ? "CONDITIONAL"
                            : "STATUS UNKNOWN"}
                        </span>

                        <em>{clue.evidence}</em>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>

            <div className="trust">
              <div className="trust-heading">
                <span>TRUST INDEX</span>
                <strong>{trust}%</strong>
              </div>

              <div className="trust-bar">
                <div style={{ width: `${trust}%` }} />
              </div>

              <p>
                {trust > 70
                  ? "Confidence can be exploited."
                  : "Suspicion is keeping you alive."}
              </p>
            </div>

            <div className="actions">
              <button className="secondary" onClick={resetLevel}>
                ↻ RESET [R]
              </button>

              <button
                className="secondary"
                onClick={() => setShowHint((value) => !value)}
              >
                ? {showHint ? "HIDE" : "REQUEST"} HINT
              </button>
            </div>

            {showHint && (
              <div className="hint">
                <div className="overline amber">LOW CONFIDENCE CHANNEL</div>
                <p>{level.hint}</p>
              </div>
            )}
          </aside>
        </section>

        <section className="footer-grid">
          <div className="insight panel">
            <div className="overline cyan">SYSTEM INSIGHT</div>
            <p>{level.insight}</p>
          </div>

          <div className="telemetry panel">
            <div>
              <span>MOVES</span>
              <strong>{String(moves).padStart(2, "0")}</strong>
            </div>

            <div>
              <span>ERRORS</span>
              <strong className={mistakes > 0 ? "danger-text" : ""}>
                {String(mistakes).padStart(2, "0")}
              </strong>
            </div>

            <div>
              <span>STATUS</span>
              <strong>{status.toUpperCase()}</strong>
            </div>
          </div>
        </section>

        <footer className="controls">
          <span>
            <b>W</b>
            <b>A</b>
            <b>S</b>
            <b>D</b>{" "}
            <em>navigate the chamber · press R to reset</em>
          </span>

          <span>PROTOCOL: VERIFY_BEFORE_TRUST</span>
        </footer>
      </div>

      <div className={`modal-layer ${showBriefing ? "active" : ""}`}>
        <div
            className="modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="briefing-title"
            aria-describedby="briefing-desc"
          >
          <div className="modal-mark">P</div>
          {levelIndex === 0 && highestLevel > 0 && (
  <button
    className="secondary continue-button"
    onClick={() => {
  const safeLevel = Math.min(
    Math.max(highestLevel, 0),
    levels.length - 1
  );

  setLevelIndex(safeLevel);
  setPlayer(levels[safeLevel].start);
  setShowBriefing(false);
  setStatus("playing");
  setMoves(0);
  setMistakes(0);
  setSeconds(0);
  setLastEvent("none");
  setDecisionTrace([]);
  setAnalyzedClues([]);
  setSignalInspected(false);
  setShowHint(false);
  setMessage("Saved sequence restored. The system remembers.");
}}
  >
    CONTINUE FROM SEQUENCE {String(highestLevel + 1).padStart(2, "0")}
  </button>
)}
          <div className="overline cyan">INCOMING TRANSMISSION</div>
          <h2 id="briefing-title">{level.title}</h2>
          <p id="briefing-desc">{level.subtitle}</p>

          <div className="modal-warning">
            The system may provide information.
            <br />
            It does not promise truth.
          </div>

          <button
            className="primary"
            ref={enterChamberRef}
            onClick={() => {
              setShowBriefing(false);
              setSignalInspected(false);
            }}
          >
            ENTER CHAMBER →
          </button>
        </div>
      </div>

      <div className={`modal-layer ${status !== "playing" ? "active" : ""}`}>
        <div
            className={`modal result ${status}`}
            role="dialog"
            aria-modal="true"
            aria-labelledby="result-title"
            aria-describedby="result-desc"
          >
          <div className="result-mark">{status === "won" ? "✦" : "!"}</div>

          <div className="overline">
            {status === "won"
              ? "VERIFICATION COMPLETE"
              : "SYSTEM INTERRUPTION"}
          </div>

          <h2 id="result-title">{status === "won" ? "Paradox Solved" : "The Game Lied"}</h2>
          <p id="result-desc">{message}</p>

          <div className="result-data">
            <span>
              MOVES <strong>{moves}</strong>
            </span>
            <span>
              ERRORS <strong className={mistakes > 0 ? "danger-text" : ""}>{mistakes}</strong>
            </span>
            <span>
              TRUST <strong>{trust}%</strong>
            </span>
            <span>
              TIME <strong>{time}</strong>
            </span>
            <span>
              CLUES <strong>{analyzedClues.length}</strong>
            </span>
          </div>

          <div className="result-rating" aria-label={`Performance rating: ${rating}`}>
            <span className="overline">PERFORMANCE</span>
            <strong className={`rating-badge rating-${rating.toLowerCase()}`}>
              {rating}
            </strong>
            <span className="rating-label">
              {rating === "S"
                ? "Flawless verification"
                : rating === "A"
                ? "Verified without error"
                : rating === "B"
                ? "Verified — excess steps"
                : "Verification compromised"}
            </span>
          </div>

          {isFinalWin && (
            <div className="result-ending" aria-label="Final chamber message">
              <p>&ldquo;You did not escape the board.&rdquo;</p>
              <p>&ldquo;You escaped the assumption that the board was telling the truth.&rdquo;</p>
              <p className="overline cyan">PROTOCOL COMPLETE: VERIFY_BEFORE_TRUST</p>
            </div>
          )}

          <div className="result-actions">
            <button className="secondary" ref={tryAgainRef} onClick={resetLevel}>
              ↻ TRY AGAIN
            </button>

            {status === "won" && levelIndex < levels.length - 1 && (
              <button className="primary" onClick={nextLevel}>
                NEXT SEQUENCE →
              </button>
            )}

            {status === "won" && levelIndex === levels.length - 1 && (
              <button className="primary" onClick={resetLevel}>
                REPLAY PARADOX →
              </button>
            )}
          </div>
        </div>
      </div>
      <div className={`modal-layer ${showLevelSelect ? "active" : ""}`}>
  <div
      className="modal level-map-modal"
      role="dialog"
      aria-modal="true"
      aria-labelledby="levelmap-title"
    >
    <div className="modal-topline">
      <div>
        <div className="overline cyan">NAVIGATION SYSTEM</div>
        <h2 id="levelmap-title">Level Map</h2>
      </div>

      <button
        className="modal-close"
        ref={levelMapCloseRef}
        onClick={() => setShowLevelSelect(false)}
        aria-label="Close level map"
      >
        ×
      </button>
    </div>

    <p className="level-map-description">
      Select any chamber that has been verified.
    </p>

    <div className="level-map-grid">
      {levels.map((mapLevel, index) => {
        const unlocked = index <= highestLevel;
        const completed = index < highestLevel;
        const active = index === levelIndex;

        return (
          <button
            key={mapLevel.id}
            disabled={!unlocked}
            className={[
              "level-map-card",
              active ? "active-level" : "",
              completed ? "completed-level" : "",
              !unlocked ? "locked-level" : "",
            ]
              .filter(Boolean)
              .join(" ")}
            onClick={() => {
              if (!unlocked) return;

              setLevelIndex(index);
setPlayer(levels[index].start);
setStatus("playing");
setDecisionTrace([]);
setDecisionTrace([]);
setMoves(0);
              setMistakes(0);
              setSeconds(0);
              setAnalyzedClues([]);
              setSignalInspected(false);
              setShowHint(false);
              setShowLevelSelect(false);
              setShowBriefing(true);
              setMessage("Chamber selected. Evidence is not transferable.");
            }}
          >
            <span className="map-number">
              {unlocked ? String(mapLevel.id).padStart(2, "0") : "×"}
            </span>

            <span className="map-details">
              <strong>{mapLevel.code}</strong>
             <small>
  {completed
    ? "VERIFIED"
    : active
    ? "CURRENT"
    : unlocked
    ? "AVAILABLE"
    : "SEALED"}
</small>

{unlocked && (
  <span className="map-progress">
    {completed ? "✓" : active ? "●" : "○"}
  </span>
)}
            </span>

            <span className="map-arrow">
              {unlocked ? "→" : "·"}
            </span>
          </button>
        );
      })}
    </div>
  </div>
</div>
    </main>
  );
}