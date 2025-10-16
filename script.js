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

// --- KIỂM TRA THẮNG CHÍNH XÁC TUYỆT ĐỐI ---
function checkWin(player) {
  const dirs = [[1,0],[0,1],[1,1],[1,-1]];
  
  for (let i = 0; i < boardSize; i++) {
    for (let j = 0; j < boardSize; j++) {
      if (board[i][j] !== player) continue;
      
      for (let [dx, dy] of dirs) {
        let count = 1;
        // Đếm liên tiếp
        for (let k = 1; k <= 4; k++) {
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

// --- AI THẦN THÁNH ---
function aiMove() {
  if (gameOver || aiThinking) return;
  
  aiThinking = true;
  statusEl.textContent = "🤖 AI đang tính toán thế cờ...";
  
  setTimeout(() => {
    let move;
    
    const moveCount = getMoveCount();
    
    if (moveCount === 0) {
      // Nước đầu: luôn đánh trung tâm
      move = { i: Math.floor(boardSize/2), j: Math.floor(boardSize/2) };
    } else if (moveCount === 1) {
      // Nước thứ 2: đánh chéo trung tâm
      move = findBestSecondMove();
    } else if (moveCount <= 6) {
      // Giai đoạn khai cuộc: sử dụng sách khai cuộc
      move = findOpeningBookMove();
    } else {
      // Giai đoạn trung cuộc và tàn cuộc: Minimax sâu
      move = findBestMoveWithMinimax(3);
    }
    
    // Fallback: nếu không tìm được nước đi tối ưu
    if (!move) {
      move = findCriticalMove();
    }
    
    if (move) {
      executeMove(move);
    }
    
    aiThinking = false;
  }, 150);
}

// --- SÁCH KHAI CUỘC ---
function findOpeningBookMove() {
  const center = Math.floor(boardSize / 2);
  const moves = [];
  
  // Pattern phòng thủ tấn công
  const patterns = [
    // Chặn các thế cờ nguy hiểm
    { condition: () => findImmediateThreat("X"), response: findWinningMove("O") || findWinningMove("X") },
    // Tạo thế tấn công
    { condition: () => findDoubleThreeThreat("O"), response: findDoubleThreeThreat("O") },
    // Phòng thủ chủ động
    { condition: () => findDoubleThreeThreat("X"), response: findDoubleThreeThreat("X") },
    // Đánh vào vị trí chiến lược
    { condition: () => true, response: findStrategicMove() }
  ];
  
  for (let pattern of patterns) {
    const move = pattern.condition();
    if (move) return move;
  }
  
  return findStrategicMove();
}

// --- TÌM NƯỚC ĐI CHIẾN LƯỢC ---
function findStrategicMove() {
  // Ưu tiên theo thứ tự: thắng -> chặn thắng -> tạo đe dọa kép -> phòng thủ -> tấn công
  let move = findWinningMove("O");
  if (move) return move;
  
  move = findWinningMove("X");
  if (move) return move;
  
  move = findDoubleThreat("O");
  if (move) return move;
  
  move = findDoubleThreat("X");
  if (move) return move;
  
  move = findThreeThreeThreat("O");
  if (move) return move;
  
  move = findThreeThreeThreat("X");
  if (move) return move;
  
  move = findFourThreeThreat("O");
  if (move) return move;
  
  move = findFourThreeThreat("X");
  if (move) return move;
  
  return findHighestScoredMove();
}

// --- TÌM MỐI ĐE DỌA 3-3 (CỰC KỲ NGUY HIỂM) ---
function findThreeThreeThreat(player) {
  for (let i = 0; i < boardSize; i++) {
    for (let j = 0; j < boardSize; j++) {
      if (board[i][j] === "" && hasNeighbor(i, j)) {
        board[i][j] = player;
        const threeCount = countThreeInRow(player);
        board[i][j] = "";
        if (threeCount >= 2) {
          return { i, j };
        }
      }
    }
  }
  return null;
}

// --- TÌM MỐI ĐE DỌA 4-3 ---
function findFourThreeThreat(player) {
  for (let i = 0; i < boardSize; i++) {
    for (let j = 0; j < boardSize; j++) {
      if (board[i][j] === "" && hasNeighbor(i, j)) {
        board[i][j] = player;
        const hasFour = hasOpenFour(player);
        const threeCount = countThreeInRow(player);
        board[i][j] = "";
        if (hasFour && threeCount >= 1) {
          return { i, j };
        }
      }
    }
  }
  return null;
}

// --- ĐẾM SỐ HÀNG 3 MỞ ---
function countThreeInRow(player) {
  let count = 0;
  const dirs = [[1,0],[0,1],[1,1],[1,-1]];
  
  for (let i = 0; i < boardSize; i++) {
    for (let j = 0; j < boardSize; j++) {
      if (board[i][j] === player) {
        for (let [dx, dy] of dirs) {
          if (isOpenThree(i, j, dx, dy, player)) {
            count++;
          }
        }
      }
    }
  }
  return count;
}

// --- KIỂM TRA HÀNG 3 MỞ ---
function isOpenThree(x, y, dx, dy, player) {
  let count = 1;
  let openEnds = 0;
  
  // Kiểm tra hướng thuận
  for (let k = 1; k <= 3; k++) {
    const nx = x + dx * k;
    const ny = y + dy * k;
    if (nx < 0 || ny < 0 || nx >= boardSize || ny >= boardSize) break;
    if (board[nx][ny] === player) count++;
    else if (board[nx][ny] === "") { openEnds++; break; }
    else break;
  }
  
  // Kiểm tra hướng nghịch
  for (let k = 1; k <= 3; k++) {
    const nx = x - dx * k;
    const ny = y - dy * k;
    if (nx < 0 || ny < 0 || nx >= boardSize || ny >= boardSize) break;
    if (board[nx][ny] === player) count++;
    else if (board[nx][ny] === "") { openEnds++; break; }
    else break;
  }
  
  return count === 3 && openEnds === 2;
}

// --- KIỂM TRA HÀNG 4 MỞ ---
function hasOpenFour(player) {
  for (let i = 0; i < boardSize; i++) {
    for (let j = 0; j < boardSize; j++) {
      if (board[i][j] === player) {
        const dirs = [[1,0],[0,1],[1,1],[1,-1]];
        for (let [dx, dy] of dirs) {
          if (isOpenFour(i, j, dx, dy, player)) {
            return true;
          }
        }
      }
    }
  }
  return false;
}

function isOpenFour(x, y, dx, dy, player) {
  let count = 1;
  let openEnds = 0;
  
  for (let k = 1; k <= 4; k++) {
    const nx = x + dx * k;
    const ny = y + dy * k;
    if (nx < 0 || ny < 0 || nx >= boardSize || ny >= boardSize) break;
    if (board[nx][ny] === player) count++;
    else if (board[nx][ny] === "") { openEnds++; break; }
    else break;
  }
  
  for (let k = 1; k <= 4; k++) {
    const nx = x - dx * k;
    const ny = y - dy * k;
    if (nx < 0 || ny < 0 || nx >= boardSize || ny >= boardSize) break;
    if (board[nx][ny] === player) count++;
    else if (board[nx][ny] === "") { openEnds++; break; }
    else break;
  }
  
  return count === 4 && openEnds >= 1;
}

// --- MINIMAX NÂNG CAO ---
function findBestMoveWithMinimax(depth) {
  let bestScore = -Infinity;
  let bestMove = null;
  let alpha = -Infinity;
  let beta = Infinity;
  
  const possibleMoves = getPriorityMoves();
  
  for (let move of possibleMoves) {
    board[move.i][move.j] = "O";
    const score = minimax(depth - 1, alpha, beta, false, -Infinity, Infinity);
    board[move.i][move.j] = "";
    
    if (score > bestScore) {
      bestScore = score;
      bestMove = move;
    }
    
    alpha = Math.max(alpha, bestScore);
    if (beta <= alpha) break;
  }
  
  return bestMove;
}

function minimax(depth, alpha, beta, isMaximizing, worstCase, bestCase) {
  if (depth === 0) {
    return evaluateBoardAdvanced();
  }
  
  if (checkWin("O")) return 1000000 - (3 - depth); // Ưu tiên thắng sớm
  if (checkWin("X")) return -1000000 + (3 - depth); // Tránh thua sớm
  
  const possibleMoves = getPriorityMoves();
  if (possibleMoves.length === 0) return 0;
  
  if (isMaximizing) {
    let maxScore = -Infinity;
    for (let move of possibleMoves) {
      board[move.i][move.j] = "O";
      const score = minimax(depth - 1, alpha, beta, false, worstCase, bestCase);
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
      const score = minimax(depth - 1, alpha, beta, true, worstCase, bestCase);
      board[move.i][move.j] = "";
      minScore = Math.min(minScore, score);
      beta = Math.min(beta, score);
      if (beta <= alpha) break;
    }
    return minScore;
  }
}

// --- LẤY NƯỚC ĐI ƯU TIÊN ---
function getPriorityMoves() {
  const moves = [];
  const urgentMoves = [];
  
  // Tìm các nước đi khẩn cấp trước
  for (let i = 0; i < boardSize; i++) {
    for (let j = 0; j < boardSize; j++) {
      if (board[i][j] === "" && hasNeighbor(i, j, 3)) {
        const score = evaluatePositionAdvanced(i, j);
        
        // Phân loại độ ưu tiên
        if (score > 50000) {
          urgentMoves.unshift({ i, j, score }); // Cực kỳ khẩn cấp
        } else if (score > 10000) {
          urgentMoves.push({ i, j, score }); // Khẩn cấp
        } else {
          moves.push({ i, j, score });
        }
      }
    }
  }
  
  // Kết hợp và sắp xếp
  const allMoves = [...urgentMoves, ...moves];
  allMoves.sort((a, b) => b.score - a.score);
  
  return allMoves.slice(0, 8); // Giới hạn để tối ưu
}

// --- ĐÁNH GIÁ BÀN CỜ NÂNG CAO ---
function evaluateBoardAdvanced() {
  let score = 0;
  
  for (let i = 0; i < boardSize; i++) {
    for (let j = 0; j < boardSize; j++) {
      if (board[i][j] === "O") {
        score += evaluatePositionAdvanced(i, j, "O");
      } else if (board[i][j] === "X") {
        score -= evaluatePositionAdvanced(i, j, "X") * 1.1; // Phòng thủ nghiêm ngặt hơn
      }
    }
  }
  
  return score;
}

// --- ĐÁNH GIÁ VỊ TRÍ SIÊU CHI TIẾT ---
function evaluatePositionAdvanced(x, y, player = "O") {
  if (player === "X") {
    // Đánh giá phòng thủ nghiêm ngặt hơn
    return evaluatePositionAdvanced(x, y, "O") * 1.2;
  }
  
  let totalScore = 0;
  const dirs = [[1,0],[0,1],[1,1],[1,-1]];
  
  for (let [dx, dy] of dirs) {
    const pattern = getPattern(x, y, dx, dy, 4);
    totalScore += evaluatePattern(pattern, player);
  }
  
  // Thêm điểm chiến lược
  totalScore += getStrategicValue(x, y);
  
  return totalScore;
}

function getPattern(x, y, dx, dy, radius) {
  let pattern = "";
  for (let k = -radius; k <= radius; k++) {
    const ni = x + dx * k;
    const nj = y + dy * k;
    
    if (ni < 0 || nj < 0 || ni >= boardSize || nj >= boardSize) {
      pattern += "#"; // Biên
    } else if (ni === x && nj === y) {
      pattern += "C"; // Vị trí trung tâm
    } else {
      pattern += board[ni][nj] === "" ? "." : board[ni][nj];
    }
  }
  return pattern;
}

function evaluatePattern(pattern, player) {
  const opponent = player === "O" ? "X" : "O";
  
  // Thay thế ký tự để dễ so khớp
  const centerPattern = pattern.replace("C", player);
  
  const patterns = {
    // Chiến thắng
    "OOOOO": 1000000,
    // Hàng 4 mở
    ".OOOO.": 50000,
    // Hàng 4 nửa mở
    "XOOOO.": 10000,
    ".OOOOX": 10000,
    // Hàng 3 mở
    ".OOO.": 5000,
    // Hàng 3 nửa mở
    "XOOO.": 1000,
    ".OOOX": 1000,
    // Đe dọa kép
    "OO.OO": 8000,
    "O.OO.O": 6000,
    // Phòng thủ cực mạnh
    [`${opponent}${opponent}${opponent}${opponent}.`]: 40000,
    [`.${opponent}${opponent}${opponent}${opponent}`]: 40000,
    [`${opponent}${opponent}${opponent}.${opponent}`]: 30000,
  };
  
  let score = 0;
  for (let [key, value] of Object.entries(patterns)) {
    if (centerPattern.includes(key)) {
      score += value;
    }
  }
  
  return score;
}

function getStrategicValue(x, y) {
  // Ưu tiên trung tâm và các vị trí chiến lược
  const center = boardSize / 2;
  const distanceFromCenter = Math.abs(x - center) + Math.abs(y - center);
  
  // Điểm trung tâm cao nhất, giảm dần ra biên
  return (boardSize - distanceFromCenter) * 10;
}

// --- CÁC HÀM HỖ TRỢ ---
function findBestSecondMove() {
  const center = Math.floor(boardSize / 2);
  const moves = [
    {i: center-1, j: center-1}, {i: center-1, j: center+1},
    {i: center+1, j: center-1}, {i: center+1, j: center+1}
  ].filter(move => 
    isValidMove(move.i, move.j) && board[move.i][move.j] === ""
  );
  
  return moves.length > 0 ? moves[Math.floor(Math.random() * moves.length)] : findStrategicMove();
}

function findCriticalMove() {
  // Tìm nước đi quan trọng nhất trong tình huống khẩn cấp
  const moves = [
    () => findWinningMove("O"),
    () => findWinningMove("X"),
    () => findDoubleThreat("O"),
    () => findDoubleThreat("X"),
    () => findHighestScoredMove(),
    () => findAnyMove()
  ];
  
  for (let moveFinder of moves) {
    const move = moveFinder();
    if (move) return move;
  }
  
  return null;
}

function findDoubleThreat(player) {
  for (let i = 0; i < boardSize; i++) {
    for (let j = 0; j < boardSize; j++) {
      if (board[i][j] === "" && hasNeighbor(i, j)) {
        board[i][j] = player;
        const threats = countImmediateThreats(player);
        board[i][j] = "";
        if (threats >= 2) {
          return { i, j };
        }
      }
    }
  }
  return null;
}

function countImmediateThreats(player) {
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

function findWinningMove(player) {
  for (let i = 0; i < boardSize; i++) {
    for (let j = 0; j < boardSize; j++) {
      if (board[i][j] === "" && hasNeighbor(i, j)) {
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

function findHighestScoredMove() {
  let bestScore = -Infinity;
  let bestMoves = [];
  
  for (let i = 0; i < boardSize; i++) {
    for (let j = 0; j < boardSize; j++) {
      if (board[i][j] === "" && hasNeighbor(i, j, 3)) {
        const score = evaluatePositionAdvanced(i, j);
        if (score > bestScore) {
          bestScore = score;
          bestMoves = [{ i, j }];
        } else if (score === bestScore) {
          bestMoves.push({ i, j });
        }
      }
    }
  }
  
  return bestMoves.length > 0 ? bestMoves[Math.floor(Math.random() * bestMoves.length)] : findAnyMove();
}

function findAnyMove() {
  const center = Math.floor(boardSize / 2);
  if (isValidMove(center, center) && board[center][center] === "") {
    return { i: center, j: center };
  }
  
  for (let i = 0; i < boardSize; i++) {
    for (let j = 0; j < boardSize; j++) {
      if (board[i][j] === "") return { i, j };
    }
  }
  return null;
}

function hasNeighbor(i, j, distance = 2) {
  for (let dx = -distance; dx <= distance; dx++) {
    for (let dy = -distance; dy <= distance; dy++) {
      if (dx === 0 && dy === 0) continue;
      const ni = i + dx;
      const nj = j + dy;
      if (isValidMove(ni, nj) && board[ni][nj] !== "") {
        return true;
      }
    }
  }
  return false;
}

function isValidMove(i, j) {
  return i >= 0 && j >= 0 && i < boardSize && j < boardSize;
}

function getMoveCount() {
  let count = 0;
  for (let i = 0; i < boardSize; i++) {
    for (let j = 0; j < boardSize; j++) {
      if (board[i][j] !== "") count++;
    }
  }
  return count;
}

function executeMove(move) {
  document.querySelectorAll(".ai-highlight").forEach(c => c.classList.remove("ai-highlight"));
  board[move.i][move.j] = "O";
  lastAIMove = move;
  render();
  
  if (checkWin("O")) {
    statusEl.textContent = "🤖 AI thắng! Trí tuệ nhân tạo là bất khả chiến bại!";
    gameOver = true;
    loseAudio.currentTime = 0;
    loseAudio.play();
  } else {
    statusEl.textContent = "Lượt của bạn!";
  }
}

// --- HIỂN THỊ VÀ XỬ LÝ SỰ KIỆN ---
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
        statusEl.textContent = "🎉 Bạn thắng! (Đây là điều không tưởng!)";
        gameOver = true;
        return;
      }
      
      setTimeout(aiMove, 100);
    }
  });
});

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