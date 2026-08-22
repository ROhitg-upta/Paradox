export const levels = [
  {
    id: 1,
    title: "The Helpful Machine",
    description: "The system wants to help you.",
    grid: [
      ["start", "empty", "safe", "wall"],
      ["empty", "wall", "empty", "empty"],
      ["empty", "empty", "empty", "goal"],
    ],
    playerStart: { row: 0, col: 0 },
    goal: { row: 2, col: 3 },
    dangerTiles: [],
    clues: [
      {
        id: 1,
        text: "The green path is safe.",
        type: "truth",
        result: "true",
      },
    ],
  },
  {
    id: 2,
    title: "First Lie",
    description: "Not every message is trustworthy.",
    grid: [
      ["start", "empty", "blue", "wall"],
      ["empty", "wall", "danger", "empty"],
      ["empty", "empty", "empty", "goal"],
    ],
    playerStart: { row: 0, col: 0 },
    goal: { row: 2, col: 3 },
    dangerTiles: ["1-2"],
    clues: [
      {
        id: 1,
        text: "The blue tile is safe.",
        type: "lie",
        result: "false",
      },
    ],
  },
];