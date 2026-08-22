"use client";

import { useEffect, useState } from "react";
import { levels } from "@/data/levels";
import {
  getNextPosition,
  getTileKey,
  isInsideGrid,
  isWall,
} from "@/lib/gameLogic";

const initialPosition = levels[0].playerStart;

export default function Home() {
  const [levelIndex, setLevelIndex] = useState(0);
  const [player, setPlayer] = useState(initialPosition);
  const [status, setStatus] = useState("playing");
  const [moves, setMoves] = useState(0);

  const level = levels[levelIndex];

  function resetLevel() {
    setPlayer(level.playerStart);
    setStatus("playing");
    setMoves(0);
  }

  function movePlayer(direction) {
    if (status !== "playing") return;

    const next = getNextPosition(player, direction);

    if (!isInsideGrid(level.grid, next.row, next.col)) return;
    if (isWall(level.grid, next.row, next.col)) return;

    const nextKey = getTileKey(next.row, next.col);

    if (level.dangerTiles.includes(nextKey)) {
      setPlayer(next);
      setStatus("failed");
      return;
    }

    if (
      next.row === level.goal.row &&
      next.col === level.goal.col
    ) {
      setPlayer(next);
      setStatus("won");
      return;
    }

    setPlayer(next);
    setMoves((previous) => previous + 1);
  }

  useEffect(() => {
    function handleKeyDown(event) {
      const keyMap = {
        ArrowUp: "UP",
        w: "UP",
        W: "UP",
        ArrowDown: "DOWN",
        s: "DOWN",
        S: "DOWN",
        ArrowLeft: "LEFT",
        a: "LEFT",
        A: "LEFT",
        ArrowRight: "RIGHT",
        d: "RIGHT",
        D: "RIGHT",
      };

      const direction = keyMap[event.key];

      if (direction) {
        event.preventDefault();
        movePlayer(direction);
      }
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  });

  function goToNextLevel() {
    if (levelIndex >= levels.length - 1) return;

    const nextLevelIndex = levelIndex + 1;
    setLevelIndex(nextLevelIndex);
    setPlayer(levels[nextLevelIndex].playerStart);
    setStatus("playing");
    setMoves(0);
  }

  return (
    <main className="min-h-screen bg-[#080a12] px-4 py-8 text-white">
      <div className="mx-auto max-w-6xl">
        <header className="mb-8 flex items-center justify-between">
          <div>
            <p className="font-mono text-sm tracking-[0.4em] text-cyan-400">
              SYSTEM ACTIVE
            </p>
            <h1 className="mt-2 text-4xl font-black tracking-tight">
              PARADOX
            </h1>
            <p className="mt-1 text-sm text-slate-400">
              The puzzle that lies to you.
            </p>
          </div>

          <div className="text-right font-mono text-sm text-slate-400">
            <p>LEVEL {level.id}</p>
            <p>MOVES {moves}</p>
          </div>
        </header>

        <section className="grid gap-6 lg:grid-cols-[1fr_320px]">
          <div className="rounded-3xl border border-slate-800 bg-slate-950/70 p-5 shadow-2xl">
            <div
              className="mx-auto grid max-w-[520px] gap-2"
              style={{
                gridTemplateColumns: `repeat(${level.grid[0].length}, minmax(0, 1fr))`,
              }}
            >
              {level.grid.map((row, rowIndex) =>
                row.map((tile, colIndex) => {
                  const isPlayer =
                    player.row === rowIndex &&
                    player.col === colIndex;

                  const key = getTileKey(rowIndex, colIndex);
                  const isDanger = level.dangerTiles.includes(key);

                  return (
                    <div
                      key={key}
                      className={[
                        "flex aspect-square items-center justify-center rounded-xl border text-2xl transition-all",
                        tile === "wall"
                          ? "border-slate-800 bg-slate-900"
                          : "border-slate-700 bg-slate-800/80",
                        tile === "goal"
                          ? "border-emerald-400 bg-emerald-400/20"
                          : "",
                        tile === "safe"
                          ? "border-cyan-400/60 bg-cyan-400/10"
                          : "",
                        tile === "blue"
                          ? "border-blue-400 bg-blue-400/20"
                          : "",
                        isDanger
                          ? "border-red-500/40 bg-red-500/10"
                          : "",
                        isPlayer
                          ? "scale-105 border-white bg-white/20 shadow-lg shadow-cyan-500/30"
                          : "",
                      ].join(" ")}
                    >
                      {isPlayer
                        ? "◉"
                        : tile === "wall"
                        ? "▦"
                        : tile === "goal"
                        ? "✦"
                        : tile === "blue"
                        ? "●"
                        : ""}
                    </div>
                  );
                })
              )}
            </div>

            <div className="mt-6 text-center font-mono text-sm text-slate-500">
              Use Arrow Keys or W A S D to move
            </div>
          </div>

          <aside className="rounded-3xl border border-slate-800 bg-slate-950/70 p-5">
            <p className="font-mono text-xs tracking-[0.3em] text-cyan-400">
              SYSTEM CLUES
            </p>

            <div className="mt-5 space-y-3">
              {level.clues.map((clue) => (
                <div
                  key={clue.id}
                  className="rounded-2xl border border-slate-700 bg-slate-900 p-4 text-sm leading-6 text-slate-200"
                >
                  “{clue.text}”
                </div>
              ))}
            </div>

            <button
              onClick={resetLevel}
              className="mt-6 w-full rounded-xl border border-slate-700 px-4 py-3 font-semibold transition hover:border-cyan-400 hover:text-cyan-300"
            >
              Restart Level
            </button>

            {status === "failed" && (
              <div className="mt-5 rounded-2xl border border-red-500/40 bg-red-500/10 p-4">
                <p className="font-bold text-red-400">
                  STATEMENT STATUS: FALSE
                </p>
                <p className="mt-2 text-sm text-slate-300">
                  The game gave you information. You trusted it.
                </p>
              </div>
            )}

            {status === "won" && (
              <div className="mt-5 rounded-2xl border border-emerald-500/40 bg-emerald-500/10 p-4">
                <p className="font-bold text-emerald-400">
                  LEVEL SOLVED
                </p>
                <button
                  onClick={goToNextLevel}
                  className="mt-4 w-full rounded-xl bg-emerald-400 px-4 py-3 font-bold text-slate-950 transition hover:bg-emerald-300"
                >
                  Next Level
                </button>
              </div>
            )}
          </aside>
        </section>
      </div>
    </main>
  );
}