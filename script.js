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

// --- KIỂM TRA THẮNG ---
function checkWin(player) {
  const dirs = [[1,0],[0,1],[1,1],[1,-1]];
  
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

// --- AI TẬP TRUNG PHÒNG THỦ ---
function aiMove() {
  if (gameOver || aiThinking) return;
  
  aiThinking = true;
  statusEl.textContent = "🤖 AI đang suy nghĩ...";
  
  setTimeout(() => {
    let move;
    
    // LUÔN LUÔN ƯU TIÊN PHÒNG THỦ TRƯỚC
    move = findDefensiveMove();
    
    // Nếu không có nước phòng thủ khẩn cấp, thì tấn công
    if (!move) {
      move = findOffensiveMove();
    }
    
    // Fallback: nếu không tìm được nước đi
    if (!move) {
      move = findAnyStrategicMove();
    }
    
    if (move) {
      executeMove(move);
    }
    
    aiThinking = false;
  }, 100);
}

// --- TÌM NƯỚC ĐI PHÒNG THỦ ---
function findDefensiveMove() {
  // 1. Chặn người chơi sắp thắng (4 quân liên tiếp)
  let move = blockImmediateWin();
  if (move) return move;
  
  // 2. Chặn hàng 3 mở 2 đầu (rất nguy hiểm)
  move = blockOpenThree();
  if (move) return move;
  
  // 3. Chặn hàng 3 mở 1 đầu
  move = blockHalfOpenThree();
  if (move) return move;
  
  // 4. Chặn hàng 2 mở 2 đầu
  move = blockOpenTwo();
  if (move) return move;
  
  // 5. Chặn các mô hình tấn công nguy hiểm
  move = blockAttackPatterns();
  if (move) return move;
  
  return null;
}

// --- CHẶN NGƯỜI CHƠI SẮP THẮNG ---
function blockImmediateWin() {
  // Kiểm tra nếu người chơi có 4 quân liên tiếp
  for (let i = 0; i < boardSize; i++) {
    for (let j = 0; j < boardSize; j++) {
      if (board[i][j] === "") {
        // Thử đánh X vào ô này xem có thắng không
        board[i][j] = "X";
        if (checkWin("X")) {
          board[i][j] = "";
          return { i, j }; // Chặn ngay!
        }
        board[i][j] = "";
      }
    }
  }
  return null;
}

// --- CHẶN HÀNG 3 MỞ 2 ĐẦU ---
function blockOpenThree() {
  const dirs = [[1,0],[0,1],[1,1],[1,-1]];
  
  for (let i = 0; i < boardSize; i++) {
    for (let j = 0; j < boardSize; j++) {
      if (board[i][j] === "X") {
        for (let [dx, dy] of dirs) {
          // Kiểm tra pattern " XXX " (3 quân mở 2 đầu)
          const pattern1 = checkPattern(i, j, dx, dy, ["", "X", "X", "X", ""]);
          const pattern2 = checkPattern(i, j, dx, dy, ["X", "X", "X", "", ""]);
          const pattern3 = checkPattern(i, j, dx, dy, ["", "", "X", "X", "X"]);
          
          if (pattern1) return pattern1;
          if (pattern2) return pattern2;
          if (pattern3) return pattern3;
        }
      }
    }
  }
  return null;
}

// --- CHẶN HÀNG 3 MỞ 1 ĐẦU ---
function blockHalfOpenThree() {
  const dirs = [[1,0],[0,1],[1,1],[1,-1]];
  
  for (let i = 0; i < boardSize; i++) {
    for (let j = 0; j < boardSize; j++) {
      if (board[i][j] === "X") {
        for (let [dx, dy] of dirs) {
          // Pattern " XXXO" hoặc "OXXX " với 1 đầu mở
          const patterns = [
            ["", "X", "X", "X", "O"],
            ["O", "X", "X", "X", ""],
            ["", "X", "X", "", "X"],
            ["X", "", "X", "X", ""]
          ];
          
          for (let pattern of patterns) {
            const move = checkPattern(i, j, dx, dy, pattern);
            if (move) return move;
          }
        }
      }
    }
  }
  return null;
}

// --- CHẶN HÀNG 2 MỞ 2 ĐẦU ---
function blockOpenTwo() {
  const dirs = [[1,0],[0,1],[1,1],[1,-1]];
  
  for (let i = 0; i < boardSize; i++) {
    for (let j = 0; j < boardSize; j++) {
      if (board[i][j] === "X") {
        for (let [dx, dy] of dirs) {
          // Pattern " XX " (2 quân mở 2 đầu)
          const pattern = checkPattern(i, j, dx, dy, ["", "X", "X", ""]);
          if (pattern) return pattern;
        }
      }
    }
  }
  return null;
}

// --- CHẶN CÁC MÔ HÌNH TẤN CÔNG KHÁC ---
function blockAttackPatterns() {
  const dirs = [[1,0],[0,1],[1,1],[1,-1]];
  
  for (let i = 0; i < boardSize; i++) {
    for (let j = 0; j < boardSize; j++) {
      if (board[i][j] === "X") {
        for (let [dx, dy] of dirs) {
          // Pattern " X X " (2 quân cách 1 ô)
          const pattern1 = checkPattern(i, j, dx, dy, ["", "X", "", "X", ""]);
          if (pattern1) return pattern1;
          
          // Pattern " XX " với ô trống quan trọng
          const pattern2 = checkPattern(i, j, dx, dy, ["", "X", "X", ""]);
          if (pattern2) return pattern2;
        }
      }
    }
  }
  return null;
}

// --- KIỂM TRA PATTERN ---
function checkPattern(x, y, dx, dy, expectedPattern) {
  for (let offset = 0; offset < expectedPattern.length; offset++) {
    let match = true;
    let emptyPositions = [];
    
    for (let k = 0; k < expectedPattern.length; k++) {
      const ni = x + dx * (k - offset);
      const nj = y + dy * (k - offset);
      
      if (ni < 0 || nj < 0 || ni >= boardSize || nj >= boardSize) {
        match = false;
        break;
      }
      
      const expected = expectedPattern[k];
      const actual = board[ni][nj];
      
      if (expected === "") {
        if (actual === "") {
          emptyPositions.push({ i: ni, j: nj });
        } else {
          match = false;
          break;
        }
      } else if (expected === "O") {
        if (actual !== "O") {
          match = false;
          break;
        }
      } else if (expected === "X") {
        if (actual !== "X") {
          match = false;
          break;
        }
      }
    }
    
    if (match && emptyPositions.length > 0) {
      // Trả về vị trí cần chặn (ưu tiên vị trí trung tâm trong pattern)
      const centerIndex = Math.floor(emptyPositions.length / 2);
      return emptyPositions[centerIndex];
    }
  }
  return null;
}

// --- TÌM NƯỚC ĐI TẤN CÔNG ---
function findOffensiveMove() {
  // 1. Thắng ngay nếu có thể
  let move = findWinningMove("O");
  if (move) return move;
  
  // 2. Tạo hàng 4 mở
  move = createOpenFour();
  if (move) return move;
  
  // 3. Tạo hàng 3 mở 2 đầu
  move = createOpenThree();
  if (move) return move;
  
  // 4. Tạo hàng 3 mở 1 đầu
  move = createHalfOpenThree();
  if (move) return move;
  
  // 5. Tấn công chiến lược
  move = findStrategicAttack();
  if (move) return move;
  
  return null;
}

// --- TÌM NƯỚC ĐI THẮNG ---
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

// --- TẠO HÀNG 4 MỞ ---
function createOpenFour() {
  for (let i = 0; i < boardSize; i++) {
    for (let j = 0; j < boardSize; j++) {
      if (board[i][j] === "" && hasNeighbor(i, j)) {
        board[i][j] = "O";
        // Kiểm tra xem có tạo được hàng 4 mở không
        if (hasOpenFour("O")) {
          board[i][j] = "";
          return { i, j };
        }
        board[i][j] = "";
      }
    }
  }
  return null;
}

// --- TẠO HÀNG 3 MỞ 2 ĐẦU ---
function createOpenThree() {
  for (let i = 0; i < boardSize; i++) {
    for (let j = 0; j < boardSize; j++) {
      if (board[i][j] === "" && hasNeighbor(i, j)) {
        board[i][j] = "O";
        if (hasOpenThree("O")) {
          board[i][j] = "";
          return { i, j };
        }
        board[i][j] = "";
      }
    }
  }
  return null;
}

// --- TẠO HÀNG 3 MỞ 1 ĐẦU ---
function createHalfOpenThree() {
  for (let i = 0; i < boardSize; i++) {
    for (let j = 0; j < boardSize; j++) {
      if (board[i][j] === "" && hasNeighbor(i, j)) {
        board[i][j] = "O";
        if (hasHalfOpenThree("O")) {
          board[i][j] = "";
          return { i, j };
        }
        board[i][j] = "";
      }
    }
  }
  return null;
}

// --- KIỂM TRA HÀNG 4 MỞ ---
function hasOpenFour(player) {
  const dirs = [[1,0],[0,1],[1,1],[1,-1]];
  
  for (let i = 0; i < boardSize; i++) {
    for (let j = 0; j < boardSize; j++) {
      if (board[i][j] === player) {
        for (let [dx, dy] of dirs) {
          let count = 1;
          let openEnds = 0;
          
          // Đếm về một phía
          for (let k = 1; k <= 4; k++) {
            const ni = i + dx * k;
            const nj = j + dy * k;
            if (ni < 0 || nj < 0 || ni >= boardSize || nj >= boardSize) break;
            if (board[ni][nj] === player) count++;
            else if (board[ni][nj] === "") { openEnds++; break; }
            else break;
          }
          
          // Đếm về phía ngược lại
          for (let k = 1; k <= 4; k++) {
            const ni = i - dx * k;
            const nj = j - dy * k;
            if (ni < 0 || nj < 0 || ni >= boardSize || nj >= boardSize) break;
            if (board[ni][nj] === player) count++;
            else if (board[ni][nj] === "") { openEnds++; break; }
            else break;
          }
          
          if (count >= 4 && openEnds >= 1) return true;
        }
      }
    }
  }
  return false;
}

// --- KIỂM TRA HÀNG 3 MỞ 2 ĐẦU ---
function hasOpenThree(player) {
  const dirs = [[1,0],[0,1],[1,1],[1,-1]];
  
  for (let i = 0; i < boardSize; i++) {
    for (let j = 0; j < boardSize; j++) {
      if (board[i][j] === player) {
        for (let [dx, dy] of dirs) {
          let count = 1;
          let openEnds = 0;
          
          for (let k = 1; k <= 3; k++) {
            const ni = i + dx * k;
            const nj = j + dy * k;
            if (ni < 0 || nj < 0 || ni >= boardSize || nj >= boardSize) break;
            if (board[ni][nj] === player) count++;
            else if (board[ni][nj] === "") { openEnds++; break; }
            else break;
          }
          
          for (let k = 1; k <= 3; k++) {
            const ni = i - dx * k;
            const nj = j - dy * k;
            if (ni < 0 || nj < 0 || ni >= boardSize || nj >= boardSize) break;
            if (board[ni][nj] === player) count++;
            else if (board[ni][nj] === "") { openEnds++; break; }
            else break;
          }
          
          if (count >= 3 && openEnds >= 2) return true;
        }
      }
    }
  }
  return false;
}

// --- KIỂM TRA HÀNG 3 MỞ 1 ĐẦU ---
function hasHalfOpenThree(player) {
  const dirs = [[1,0],[0,1],[1,1],[1,-1]];
  
  for (let i = 0; i < boardSize; i++) {
    for (let j = 0; j < boardSize; j++) {
      if (board[i][j] === player) {
        for (let [dx, dy] of dirs) {
          let count = 1;
          let openEnds = 0;
          
          for (let k = 1; k <= 3; k++) {
            const ni = i + dx * k;
            const nj = j + dy * k;
            if (ni < 0 || nj < 0 || ni >= boardSize || nj >= boardSize) break;
            if (board[ni][nj] === player) count++;
            else if (board[ni][nj] === "") { openEnds++; break; }
            else break;
          }
          
          for (let k = 1; k <= 3; k++) {
            const ni = i - dx * k;
            const nj = j - dy * k;
            if (ni < 0 || nj < 0 || ni >= boardSize || nj >= boardSize) break;
            if (board[ni][nj] === player) count++;
            else if (board[ni][nj] === "") { openEnds++; break; }
            else break;
          }
          
          if (count >= 3 && openEnds >= 1) return true;
        }
      }
    }
  }
  return false;
}

// --- TẤN CÔNG CHIẾN LƯỢC ---
function findStrategicAttack() {
  // Tìm nước đi tạo nhiều đe dọa cùng lúc
  let bestScore = -1;
  let bestMove = null;
  
  for (let i = 0; i < boardSize; i++) {
    for (let j = 0; j < boardSize; j++) {
      if (board[i][j] === "" && hasNeighbor(i, j)) {
        const score = evaluateAttackPotential(i, j);
        if (score > bestScore) {
          bestScore = score;
          bestMove = { i, j };
        }
      }
    }
  }
  
  return bestMove;
}

// --- ĐÁNH GIÁ TIỀM NĂNG TẤN CÔNG ---
function evaluateAttackPotential(x, y) {
  let score = 0;
  const dirs = [[1,0],[0,1],[1,1],[1,-1]];
  
  for (let [dx, dy] of dirs) {
    // Đánh giá theo từng hướng
    let potential = 0;
    
    // Kiểm tra số quân O liên tiếp có thể tạo
    for (let k = -4; k <= 4; k++) {
      const ni = x + dx * k;
      const nj = y + dy * k;
      if (ni < 0 || nj < 0 || ni >= boardSize || nj >= boardSize) continue;
      
      if (board[ni][nj] === "O") {
        potential++;
      } else if (board[ni][nj] === "X") {
        potential = 0; // Bị chặn
        break;
      }
    }
    
    score += potential * potential; // Ưu tiên các hướng có nhiều quân
  }
  
  return score;
}

// --- TÌM NƯỚC ĐI CHIẾN LƯỢC BẤT KỲ ---
function findAnyStrategicMove() {
  // Ưu tiên trung tâm và các vị trí gần quân đối phương
  const center = Math.floor(boardSize / 2);
  
  // Nếu bàn cờ trống, đánh trung tâm
  if (getMoveCount() === 0) {
    return { i: center, j: center };
  }
  
  // Tìm ô gần nhất với quân đối phương
  let bestDistance = Infinity;
  let bestMove = null;
  
  for (let i = 0; i < boardSize; i++) {
    for (let j = 0; j < boardSize; j++) {
      if (board[i][j] === "X") {
        // Tìm ô trống gần quân X nhất
        for (let di = -2; di <= 2; di++) {
          for (let dj = -2; dj <= 2; dj++) {
            const ni = i + di;
            const nj = j + dj;
            if (ni >= 0 && nj >= 0 && ni < boardSize && nj < boardSize && 
                board[ni][nj] === "") {
              const distance = Math.abs(di) + Math.abs(dj);
              if (distance < bestDistance) {
                bestDistance = distance;
                bestMove = { i: ni, j: nj };
              }
            }
          }
        }
      }
    }
  }
  
  return bestMove || findAnyMove();
}

// --- CÁC HÀM HỖ TRỢ ---
function hasNeighbor(i, j, distance = 2) {
  for (let dx = -distance; dx <= distance; dx++) {
    for (let dy = -distance; dy <= distance; dy++) {
      if (dx === 0 && dy === 0) continue;
      const ni = i + dx;
      const nj = j + dy;
      if (ni >= 0 && nj >= 0 && ni < boardSize && nj < boardSize && 
          board[ni][nj] !== "") {
        return true;
      }
    }
  }
  return false;
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

function executeMove(move) {
  document.querySelectorAll(".ai-highlight").forEach(c => c.classList.remove("ai-highlight"));
  board[move.i][move.j] = "O";
  lastAIMove = move;
  render();
  
  if (checkWin("O")) {
    statusEl.textContent = "🤖 AI thắng!";
    gameOver = true;
    loseAudio.currentTime = 0;
    loseAudio.play();
  } else {
    statusEl.textContent = "Lượt của bạn!";
  }
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