export function getTileKey(row, col) {
  return `${row}-${col}`;
}

export function isInsideGrid(grid, row, col) {
  return (
    row >= 0 &&
    row < grid.length &&
    col >= 0 &&
    col < grid[0].length
  );
}

export function isWall(grid, row, col) {
  return grid[row][col] === "wall";
}

export function getNextPosition(position, direction) {
  const moves = {
    UP: { row: -1, col: 0 },
    DOWN: { row: 1, col: 0 },
    LEFT: { row: 0, col: -1 },
    RIGHT: { row: 0, col: 1 },
  };

  return {
    row: position.row + moves[direction].row,
    col: position.col + moves[direction].col,
  };
}