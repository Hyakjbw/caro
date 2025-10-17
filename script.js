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

// --- AI THÔNG MINH NÂNG CẤP ---
function aiMove() {
  if (gameOver) return;

  let move = findWinningMove("O"); // Ưu tiên thắng
  if (!move) move = findWinningMove("X"); // Chặn người chơi thắng
  if (!move) move = findBestMove(); // Tìm nước đi tốt nhất
  
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

// --- TÌM NƯỚC ĐI THẮNG NGAY ---
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

// --- TÌM NƯỚC ĐI TỐT NHẤT ---
function findBestMove() {
  let bestScore = -Infinity;
  let bestMoves = [];
  
  // Tìm tất cả nước đi có thể và đánh giá
  for (let i = 0; i < boardSize; i++) {
    for (let j = 0; j < boardSize; j++) {
      if (board[i][j] === "" && hasNeighbor(i, j)) {
        const score = evaluateMove(i, j);
        if (score > bestScore) {
          bestScore = score;
          bestMoves = [{ i, j }];
        } else if (score === bestScore) {
          bestMoves.push({ i, j });
        }
      }
    }
  }
  
  // Nếu có nhiều nước đi cùng điểm, chọn ngẫu nhiên để tránh pattern
  if (bestMoves.length > 0) {
    return bestMoves[Math.floor(Math.random() * bestMoves.length)];
  }
  
  // Nếu không tìm thấy nước đi tốt, tìm bất kỳ nước đi nào
  return findAnyMove();
}

// --- KIỂM TRA Ô CÓ QUAN TRỌNG KHÔNG ---
function hasNeighbor(i, j, distance = 2) {
  for (let dx = -distance; dx <= distance; dx++) {
    for (let dy = -distance; dy <= distance; dy++) {
      if (dx === 0 && dy === 0) continue;
      const ni = i + dx;
      const nj = j + dy;
      if (ni >= 0 && ni < boardSize && nj >= 0 && nj < boardSize && board[ni][nj] !== "") {
        return true;
      }
    }
  }
  return false;
}

// --- ĐÁNH GIÁ NƯỚC ĐI ---
function evaluateMove(x, y) {
  let score = 0;
  
  // Đánh giá cho AI (O)
  score += evaluateLine(x, y, "O") * 10;
  
  // Đánh giá cho người chơi (X) - phòng thủ
  score += evaluateLine(x, y, "X") * 9;
  
  // Ưu tiên trung tâm
  const center = boardSize / 2;
  const distanceFromCenter = Math.sqrt(Math.pow(x - center, 2) + Math.pow(y - center, 2));
  score += (boardSize - distanceFromCenter) * 0.1;
  
  return score;
}

// --- ĐÁNH GIÁ THEO HƯỚNG ---
function evaluateLine(x, y, player) {
  const dirs = [[1,0],[0,1],[1,1],[1,-1]];
  let totalScore = 0;
  
  for (let [dx, dy] of dirs) {
    totalScore += evaluateDirection(x, y, dx, dy, player);
  }
  
  return totalScore;
}

// --- ĐÁNH GIÁ THEO HƯỚNG CỤ THỂ ---
function evaluateDirection(x, y, dx, dy, player) {
  let score = 0;
  let count = 0; // Số quân liên tiếp
  let openEnds = 0; // Số đầu mở
  
  // Đếm về phía trước
  for (let i = 1; i <= 4; i++) {
    const nx = x + dx * i;
    const ny = y + dy * i;
    if (nx < 0 || ny < 0 || nx >= boardSize || ny >= boardSize) break;
    
    if (board[nx][ny] === player) {
      count++;
    } else if (board[nx][ny] === "") {
      openEnds++;
      break;
    } else {
      break;
    }
  }
  
  // Đếm về phía sau
  for (let i = 1; i <= 4; i++) {
    const nx = x - dx * i;
    const ny = y - dy * i;
    if (nx < 0 || ny < 0 || nx >= boardSize || ny >= boardSize) break;
    
    if (board[nx][ny] === player) {
      count++;
    } else if (board[nx][ny] === "") {
      openEnds++;
      break;
    } else {
      break;
    }
  }
  
  // Đánh giá dựa trên số quân liên tiếp và đầu mở
  if (count >= 4) score += 100000; // 5 quân liên tiếp - chiến thắng
  else if (count === 3) {
    if (openEnds === 2) score += 10000; // 4 quân mở 2 đầu - cực kỳ nguy hiểm
    else if (openEnds === 1) score += 1000; // 4 quân mở 1 đầu - rất nguy hiểm
  } else if (count === 2) {
    if (openEnds === 2) score += 500; // 3 quân mở 2 đầu - nguy hiểm
    else if (openEnds === 1) score += 100; // 3 quân mở 1 đầu - tiềm năng
  } else if (count === 1) {
    if (openEnds === 2) score += 50; // 2 quân mở 2 đầu - có tiềm năng
    else if (openEnds === 1) score += 10; // 2 quân mở 1 đầu - ít giá trị
  }
  
  // Thêm điểm cho các mô hình đặc biệt
  if (player === "O") {
    // AI ưu tiên tấn công
    if (count === 2 && openEnds === 2) score += 200;
  } else {
    // Phòng thủ chống lại người chơi
    if (count === 2 && openEnds === 2) score += 300;
  }
  
  return score;
}

// --- TÌM NƯỚC ĐI BẤT KỲ ---
function findAnyMove() {
  // Ưu tiên trung tâm nếu bàn cờ trống
  if (isBoardEmpty()) {
    const center = Math.floor(boardSize / 2);
    return { i: center, j: center };
  }
  
  // Tìm ô trống bất kỳ
  for (let i = 0; i < boardSize; i++) {
    for (let j = 0; j < boardSize; j++) {
      if (board[i][j] === "") return { i, j };
    }
  }
  return null;
}

// --- KIỂM TRA BÀN CỜ TRỐNG ---
function isBoardEmpty() {
  for (let i = 0; i < boardSize; i++) {
    for (let j = 0; j < boardSize; j++) {
      if (board[i][j] !== "") return false;
    }
  }
  return true;
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
