// --- ÂM THANH KHI THUA ---
const loseAudio = new Audio("lose.mp3");
loseAudio.loop = false;

const boardSize = 20;
let board = Array(boardSize).fill().map(() => Array(boardSize).fill(""));
let gameOver = false;
let lastAIMove = null;
let aiThinking = false;

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

// --- KIỂM TRA THẮNG NÂNG CẤP ---
function checkWin(player) {
  const dirs = [[1,0],[0,1],[1,1],[1,-1]];
  
  for (let i = 0; i < boardSize; i++) {
    for (let j = 0; j < boardSize; j++) {
      if (board[i][j] !== player) continue;
      
      for (let [dx, dy] of dirs) {
        let count = 1;
        // Kiểm tra 5 ô liên tiếp
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

// --- AI THÔNG MINH CẤP CAO ---
function aiMove() {
  if (gameOver || aiThinking) return;
  
  aiThinking = true;
  statusEl.textContent = "🤖 AI đang suy nghĩ...";
  
  // Sử dụng setTimeout để không block UI
  setTimeout(() => {
    let move;
    
    // Giai đoạn đầu game - đánh nhanh
    if (getMoveCount() < 4) {
      move = findOpeningMove();
    } else {
      // Giai đoạn giữa và cuối - sử dụng Minimax
      move = findBestMoveWithMinimax(2); // Độ sâu 2
    }
    
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
      } else {
        statusEl.textContent = "Lượt của bạn!";
      }
    }
    
    aiThinking = false;
  }, 100);
}

// --- ĐẾM SỐ NƯỚC ĐI ---
function getMoveCount() {
  let count = 0;
  for (let i = 0; i < boardSize; i++) {
    for (let j = 0; j < boardSize; j++) {
      if (board[i][j] !== "") count++;
    }
  }
  return count;
}

// --- NƯỚC ĐI KHAI CUỘC THÔNG MINH ---
function findOpeningMove() {
  const center = Math.floor(boardSize / 2);
  
  // Nếu bàn cờ trống, đánh trung tâm
  if (getMoveCount() === 0) {
    return { i: center, j: center };
  }
  
  // Nếu người chơi đánh trung tâm, đánh chéo
  if (board[center][center] === "X") {
    const moves = [
      {i: center-1, j: center-1}, {i: center-1, j: center+1},
      {i: center+1, j: center-1}, {i: center+1, j: center+1}
    ].filter(move => 
      move.i >= 0 && move.i < boardSize && 
      move.j >= 0 && move.j < boardSize && 
      board[move.i][move.j] === ""
    );
    if (moves.length > 0) return moves[Math.floor(Math.random() * moves.length)];
  }
  
  // Tìm nước đi tốt nhất trong khai cuộc
  return findBestMove();
}

// --- THUẬT TOÁN MINIMAX ---
function findBestMoveWithMinimax(depth) {
  let bestScore = -Infinity;
  let bestMove = null;
  
  const possibleMoves = getPossibleMoves();
  
  for (let move of possibleMoves) {
    board[move.i][move.j] = "O";
    const score = minimax(depth - 1, -Infinity, Infinity, false);
    board[move.i][move.j] = "";
    
    if (score > bestScore) {
      bestScore = score;
      bestMove = move;
    }
  }
  
  return bestMove || findBestMove();
}

function minimax(depth, alpha, beta, isMaximizing) {
  // Kiểm tra kết thúc game hoặc đạt độ sâu tối đa
  if (depth === 0) {
    return evaluateBoard();
  }
  
  if (checkWin("O")) return 100000;
  if (checkWin("X")) return -100000;
  
  const possibleMoves = getPossibleMoves();
  if (possibleMoves.length === 0) return 0;
  
  if (isMaximizing) {
    let maxScore = -Infinity;
    for (let move of possibleMoves) {
      board[move.i][move.j] = "O";
      const score = minimax(depth - 1, alpha, beta, false);
      board[move.i][move.j] = "";
      maxScore = Math.max(maxScore, score);
      alpha = Math.max(alpha, score);
      if (beta <= alpha) break;
    }
    return maxScore;
  } else {
    let minScore = Infinity;
    for (let move of possibleMoves) {
      board[move.i][move.j] = "X";
      const score = minimax(depth - 1, alpha, beta, true);
      board[move.i][move.j] = "";
      minScore = Math.min(minScore, score);
      beta = Math.min(beta, score);
      if (beta <= alpha) break;
    }
    return minScore;
  }
}

// --- LẤY CÁC NƯỚC ĐI CÓ THỂ ---
function getPossibleMoves() {
  const moves = [];
  const searchRadius = 2;
  
  for (let i = 0; i < boardSize; i++) {
    for (let j = 0; j < boardSize; j++) {
      if (board[i][j] === "" && hasNeighbor(i, j, searchRadius)) {
        moves.push({ i, j, score: evaluatePosition(i, j) });
      }
    }
  }
  
  // Sắp xếp theo điểm số để tối ưu alpha-beta pruning
  moves.sort((a, b) => b.score - a.score);
  return moves.slice(0, 10); // Giới hạn số nước đi xét
}

// --- ĐÁNH GIÁ BÀN CỜ ---
function evaluateBoard() {
  let score = 0;
  
  for (let i = 0; i < boardSize; i++) {
    for (let j = 0; j < boardSize; j++) {
      if (board[i][j] === "O") {
        score += evaluatePosition(i, j, "O");
      } else if (board[i][j] === "X") {
        score -= evaluatePosition(i, j, "X");
      }
    }
  }
  
  return score;
}

// --- TÌM NƯỚC ĐI TỐT NHẤT (DÙNG KHI MINIMAX KHÔNG ÁP DỤNG) ---
function findBestMove() {
  // 1. Thắng ngay nếu có thể
  let move = findWinningMove("O");
  if (move) return move;
  
  // 2. Chặn người chơi thắng
  move = findWinningMove("X");
  if (move) return move;
  
  // 3. Tạo cơ hội thắng kép
  move = findDoubleThreat("O");
  if (move) return move;
  
  // 4. Chặn cơ hội thắng kép của đối thủ
  move = findDoubleThreat("X");
  if (move) return move;
  
  // 5. Tìm nước đi có điểm số cao nhất
  return findHighestScoredMove();
}

// --- TÌM NƯỚC ĐI THẮNG ---
function findWinningMove(player) {
  for (let i = 0; i < boardSize; i++) {
    for (let j = 0; j < boardSize; j++) {
      if (board[i][j] === "") {
        board[i][j] = player;
        if (checkWin(player)) {
          board[i][j] = "";
          return { i, j };
        }
        board[i][j] = "";
      }
    }
  }
  return null;
}

// --- TÌM ĐE DỌA KÉP (DOUBLE THREAT) ---
function findDoubleThreat(player) {
  for (let i = 0; i < boardSize; i++) {
    for (let j = 0; j < boardSize; j++) {
      if (board[i][j] === "") {
        board[i][j] = player;
        const threatCount = countWinningThreats(player);
        board[i][j] = "";
        if (threatCount >= 2) {
          return { i, j };
        }
      }
    }
  }
  return null;
}

// --- ĐẾM SỐ ĐE DỌA THẮNG ---
function countWinningThreats(player) {
  let count = 0;
  for (let i = 0; i < boardSize; i++) {
    for (let j = 0; j < boardSize; j++) {
      if (board[i][j] === "") {
        board[i][j] = player;
        if (checkWin(player)) count++;
        board[i][j] = "";
      }
    }
  }
  return count;
}

// --- TÌM NƯỚC ĐI ĐIỂM CAO NHẤT ---
function findHighestScoredMove() {
  let bestScore = -Infinity;
  let bestMoves = [];
  
  for (let i = 0; i < boardSize; i++) {
    for (let j = 0; j < boardSize; j++) {
      if (board[i][j] === "" && hasNeighbor(i, j)) {
        const score = evaluatePosition(i, j);
        if (score > bestScore) {
          bestScore = score;
          bestMoves = [{ i, j }];
        } else if (score === bestScore) {
          bestMoves.push({ i, j });
        }
      }
    }
  }
  
  if (bestMoves.length > 0) {
    return bestMoves[Math.floor(Math.random() * bestMoves.length)];
  }
  
  return findAnyMove();
}

// --- ĐÁNH GIÁ VỊ TRÍ CHI TIẾT ---
function evaluatePosition(x, y, player = "O") {
  let totalScore = 0;
  const patterns = {
    "OOOOO": 100000, // 5 liên tiếp - thắng
    " OOOOO ": 100000,
    "XOOOO X": 5000,
    "X OOOO X": 5000,
    " OOOO ": 10000, // 4 mở 2 đầu
    "XOOOO ": 1000,  // 4 mở 1 đầu
    " OOOOX": 1000,
    " OOO ": 1000,   // 3 mở 2 đầu
    "XOOO ": 200,    // 3 mở 1 đầu
    " OOOX": 200,
    " OO ": 100,     // 2 mở 2 đầu
    "XOO ": 10,      // 2 mở 1 đầu
    " OOX": 10,
    " O ": 5         // 1 mở 2 đầu
  };
  
  const dirs = [[1,0],[0,1],[1,1],[1,-1]];
  
  for (let [dx, dy] of dirs) {
    let pattern = "";
    
    // Lấy pattern 9 ô theo hướng
    for (let k = -4; k <= 4; k++) {
      const ni = x + dx * k;
      const nj = y + dy * k;
      
      if (ni < 0 || nj < 0 || ni >= boardSize || nj >= boardSize) {
        pattern += "X"; // Biên
      } else if (ni === x && nj === y) {
        pattern += "O"; // Vị trí đang xét
      } else {
        pattern += board[ni][nj] === "" ? " " : board[ni][nj];
      }
    }
    
    // So khớp pattern
    for (let [key, value] of Object.entries(patterns)) {
      if (pattern.includes(key)) {
        totalScore += value;
        break;
      }
    }
  }
  
  return totalScore;
}

// --- KIỂM TRA Ô CÓ LÂN CẬN ---
function hasNeighbor(i, j, distance = 2) {
  for (let dx = -distance; dx <= distance; dx++) {
    for (let dy = -distance; dy <= distance; dy++) {
      if (dx === 0 && dy === 0) continue;
      const ni = i + dx;
      const nj = j + dy;
      if (ni >= 0 && ni < boardSize && nj >= 0 && nj < boardSize && 
          board[ni][nj] !== "") {
        return true;
      }
    }
  }
  return false;
}

// --- TÌM NƯỚC ĐI BẤT KỲ ---
function findAnyMove() {
  const center = Math.floor(boardSize / 2);
  if (board[center][center] === "") {
    return { i: center, j: center };
  }
  
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
    if (gameOver || aiThinking) return;
    
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
      
      setTimeout(aiMove, 100);
    }
  });
});

// --- NÚT CHƠI LẠI ---
resetBtn.addEventListener("click", () => {
  gameOver = false;
  aiThinking = false;
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