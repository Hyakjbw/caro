// --- ÂM THANH KHI THUA ---
const loseAudio = new Audio("lose.mp3"); // hoặc link mp3 online
loseAudio.loop = false; // phát 1 lần

const boardSize = 20;
let board = Array(boardSize).fill().map(() => Array(boardSize).fill(""));
let gameOver = false;
let lastAIMove = null;

const boardEl = document.getElementById("board");
const statusEl = document.getElementById("status");
const resetBtn = document.getElementById("reset");

// --- TẠO BÀN CỜ ---
for (let i = 0; i < boardSize * boardSize; i++) {
  const cell = document.createElement("div");
  cell.classList.add("cell");
  cell.dataset.index = i;
  boardEl.appendChild(cell);
}

// --- KIỂM TRA THẮNG ---
function checkWin(player) {
  const dirs = [
    [1, 0],  // ngang
    [0, 1],  // dọc
    [1, 1],  // chéo xuống
    [1, -1]  // chéo lên
  ];

  for (let i = 0; i < boardSize; i++) {
    for (let j = 0; j < boardSize; j++) {
      if (board[i][j] !== player) continue;
      for (let [dx, dy] of dirs) {
        let count = 1;
        for (let k = 1; k < 5; k++) {
          const ni = i + dx * k;
          const nj = j + dy * k;
          if (ni < 0 || nj < 0 || ni >= boardSize || nj >= boardSize) break;
          if (board[ni][nj] === player) count++;
          else break;
        }
        if (count >= 5) return true;
      }
    }
  }
  return false;
}

// --- AI THÔNG MINH ---
function aiMove() {
  if (gameOver) return;

  let move = findSmartMove();
  if (!move) move = findNearPlayer();
  if (!move) move = findAnyMove();

  if (move) {
    document.querySelectorAll(".ai-highlight").forEach(c => c.classList.remove("ai-highlight"));
    board[move.i][move.j] = "O";
    lastAIMove = move;
    render();

    if (checkWin("O")) {
      statusEl.textContent = "🤖 AI thắng! Không thể chống lại trí tuệ nhân tạo!";
      gameOver = true;
      loseAudio.currentTime = 0;
      loseAudio.play();
    }
  }
}

// --- TÌM NƯỚC ĐI THÔNG MINH ---
function findSmartMove() {
  let bestMove = null;

  // 1️⃣ AI có thể thắng ngay => đánh luôn
  for (let i = 0; i < boardSize; i++) {
    for (let j = 0; j < boardSize; j++) {
      if (board[i][j] === "") {
        board[i][j] = "O";
        if (checkWin("O")) {
          board[i][j] = "";
          return { i, j };
        }
        board[i][j] = "";
      }
    }
  }

  // 2️⃣ Chặn người chơi nếu sắp thắng
  for (let i = 0; i < boardSize; i++) {
    for (let j = 0; j < boardSize; j++) {
      if (board[i][j] === "") {
        board[i][j] = "X";
        if (checkWin("X")) {
          board[i][j] = "";
          return { i, j };
        }
        board[i][j] = "";
      }
    }
  }

  // 3️⃣ Đánh nước tốt nhất
  let bestScore = -Infinity;
  for (let i = 0; i < boardSize; i++) {
    for (let j = 0; j < boardSize; j++) {
      if (board[i][j] === "") {
        const scoreO = evaluatePosition(i, j, "O");
        const scoreX = evaluatePosition(i, j, "X");
        const total = scoreO + scoreX * 0.9;
        if (total > bestScore) {
          bestScore = total;
          bestMove = { i, j };
        }
      }
    }
  }
  return bestMove;
}

// --- ĐÁNH GIÁ VỊ TRÍ ---
function evaluatePosition(x, y, player) {
  const dirs = [[1,0],[0,1],[1,1],[1,-1]];
  let score = 0;
  for (let [dx, dy] of dirs) {
    let count = 0, openEnds = 0;
    let i = 1;
    while (true) {
      const nx = x + dx * i, ny = y + dy * i;
      if (nx < 0 || ny < 0 || nx >= boardSize || ny >= boardSize) break;
      if (board[nx][ny] === player) count++;
      else if (board[nx][ny] === "") { openEnds++; break; }
      else break;
      i++;
    }
    i = 1;
    while (true) {
      const nx = x - dx * i, ny = y - dy * i;
      if (nx < 0 || ny < 0 || nx >= boardSize || ny >= boardSize) break;
      if (board[nx][ny] === player) count++;
      else if (board[nx][ny] === "") { openEnds++; break; }
      else break;
      i++;
    }
    if (count >= 4) score += 10000;
    else if (count === 3 && openEnds === 2) score += 1000;
    else if (count === 3 && openEnds === 1) score += 200;
    else if (count === 2 && openEnds === 2) score += 100;
    else if (count === 2 && openEnds === 1) score += 30;
    else if (count === 1 && openEnds === 2) score += 10;
  }
  return score;
}

// --- ĐÁNH GẦN NGƯỜI CHƠI ---
function findNearPlayer() {
  const last = getLastPlayerMove();
  if (!last) return null;
  const { x, y } = last;
  const range = 2;
  for (let r = 1; r <= range; r++) {
    for (let i = x - r; i <= x + r; i++) {
      for (let j = y - r; j <= y + r; j++) {
        if (i >= 0 && j >= 0 && i < boardSize && j < boardSize && board[i][j] === "")
          return { i, j };
      }
    }
  }
  return null;
}

function getLastPlayerMove() {
  for (let i = boardSize - 1; i >= 0; i--) {
    for (let j = boardSize - 1; j >= 0; j--) {
      if (board[i][j] === "X") return { x: i, y: j };
    }
  }
  return null;
}

function findAnyMove() {
  for (let i = 0; i < boardSize; i++) {
    for (let j = 0; j < boardSize; j++) {
      if (board[i][j] === "") return { i, j };
    }
  }
  return null;
}

// --- HIỂN THỊ ---
function render() {
  const cells = document.querySelectorAll(".cell");
  cells.forEach((cell, idx) => {
    const i = Math.floor(idx / boardSize);
    const j = idx % boardSize;
    cell.textContent = board[i][j];
    cell.className = `cell ${board[i][j].toLowerCase()}`;
    if (lastAIMove && i === lastAIMove.i && j === lastAIMove.j) {
      cell.classList.add("ai-highlight");
    }
  });
}

// --- NGƯỜI CHƠI ---
document.querySelectorAll(".cell").forEach(cell => {
  cell.addEventListener("click", () => {
    if (gameOver) return;
    const idx = parseInt(cell.dataset.index);
    const x = Math.floor(idx / boardSize);
    const y = idx % boardSize;
    if (board[x][y] === "") {
      board[x][y] = "X";
      render();
      if (checkWin("X")) {
        statusEl.textContent = "🎉 Bạn thắng!";
        gameOver = true;
        return;
      }
      setTimeout(aiMove, 300);
    }
  });
});

// --- NÚT CHƠI LẠI ---
resetBtn.addEventListener("click", () => {
  gameOver = false;
  statusEl.textContent = "Người chơi đi trước!";
  loseAudio.pause();
  loseAudio.currentTime = 0;
  lastAIMove = null;
  for (let i = 0; i < boardSize; i++) {
    for (let j = 0; j < boardSize; j++) board[i][j] = "";
  }
  render();
});

render();
