// ===== SUDOKU GAME ENGINE =====

(function () {
    "use strict";

    // --- State ---
    let board = [];          // current player board (9x9)
    let solution = [];       // full solution (9x9)
    let given = [];          // boolean 9x9: true if cell was pre-filled
    let notes = [];          // 9x9 array of Sets (pencil marks)
    let history = [];        // undo stack
    let selectedCell = null; // {row, col}
    let mistakeCount = 0;
    let maxMistakes = 3;
    let timerInterval = null;
    let seconds = 0;
    let notesMode = false;
    let hintsUsed = 0;
    let maxHints = 3;
    let gameActive = false;

    // --- DOM References ---
    const boardEl = document.getElementById("sudoku-board");
    const timerEl = document.getElementById("timer");
    const mistakesEl = document.getElementById("mistakes");
    const newGameBtn = document.getElementById("new-game-btn");
    const difficultyEl = document.getElementById("difficulty");
    const hintBtn = document.getElementById("hint-btn");
    const notesBtn = document.getElementById("notes-btn");
    const undoBtn = document.getElementById("undo-btn");
    const winModal = document.getElementById("win-modal");
    const winTimeEl = document.getElementById("win-time");
    const winMistakesEl = document.getElementById("win-mistakes");
    const playAgainBtn = document.getElementById("play-again-btn");
    const gameoverModal = document.getElementById("gameover-modal");
    const retryBtn = document.getElementById("retry-btn");
    const numBtns = document.querySelectorAll(".num-btn");

    // --- Sudoku Generator ---

    function createEmptyGrid() {
        return Array.from({ length: 9 }, () => Array(9).fill(0));
    }

    function isValidPlacement(grid, row, col, num) {
        for (let i = 0; i < 9; i++) {
            if (grid[row][i] === num) return false;
            if (grid[i][col] === num) return false;
        }
        const boxRow = Math.floor(row / 3) * 3;
        const boxCol = Math.floor(col / 3) * 3;
        for (let r = boxRow; r < boxRow + 3; r++) {
            for (let c = boxCol; c < boxCol + 3; c++) {
                if (grid[r][c] === num) return false;
            }
        }
        return true;
    }

    function shuffleArray(arr) {
        for (let i = arr.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [arr[i], arr[j]] = [arr[j], arr[i]];
        }
        return arr;
    }

    function solveSudoku(grid) {
        for (let row = 0; row < 9; row++) {
            for (let col = 0; col < 9; col++) {
                if (grid[row][col] === 0) {
                    const nums = shuffleArray([1, 2, 3, 4, 5, 6, 7, 8, 9]);
                    for (const num of nums) {
                        if (isValidPlacement(grid, row, col, num)) {
                            grid[row][col] = num;
                            if (solveSudoku(grid)) return true;
                            grid[row][col] = 0;
                        }
                    }
                    return false;
                }
            }
        }
        return true;
    }

    function generatePuzzle(difficulty) {
        // Generate a full solution
        const grid = createEmptyGrid();
        solveSudoku(grid);

        // Deep copy for solution
        const sol = grid.map(r => [...r]);

        // Remove cells based on difficulty
        let cellsToRemove;
        switch (difficulty) {
            case "easy": cellsToRemove = 35; break;
            case "medium": cellsToRemove = 45; break;
            case "hard": cellsToRemove = 55; break;
            default: cellsToRemove = 45;
        }

        const positions = [];
        for (let r = 0; r < 9; r++) {
            for (let c = 0; c < 9; c++) {
                positions.push([r, c]);
            }
        }
        shuffleArray(positions);

        let removed = 0;
        for (const [r, c] of positions) {
            if (removed >= cellsToRemove) break;
            grid[r][c] = 0;
            removed++;
        }

        return { puzzle: grid, solution: sol };
    }

    // --- Timer ---

    function startTimer() {
        stopTimer();
        seconds = 0;
        updateTimerDisplay();
        timerInterval = setInterval(() => {
            seconds++;
            updateTimerDisplay();
        }, 1000);
    }

    function stopTimer() {
        if (timerInterval) {
            clearInterval(timerInterval);
            timerInterval = null;
        }
    }

    function updateTimerDisplay() {
        const m = String(Math.floor(seconds / 60)).padStart(2, "0");
        const s = String(seconds % 60).padStart(2, "0");
        timerEl.textContent = m + ":" + s;
    }

    function formatTime(totalSec) {
        const m = Math.floor(totalSec / 60);
        const s = totalSec % 60;
        if (m > 0) return m + "m " + s + "s";
        return s + "s";
    }

    // --- Board Rendering ---

    function renderBoard() {
        boardEl.innerHTML = "";
        for (let row = 0; row < 9; row++) {
            for (let col = 0; col < 9; col++) {
                const cell = document.createElement("div");
                cell.classList.add("sudoku-cell");
                cell.dataset.row = row;
                cell.dataset.col = col;

                // 3x3 box borders
                if (col === 2 || col === 5) cell.classList.add("border-right");
                if (row === 2 || row === 5) cell.classList.add("border-bottom");

                if (given[row][col]) {
                    cell.classList.add("given");
                    cell.textContent = board[row][col];
                } else if (board[row][col] !== 0) {
                    cell.textContent = board[row][col];
                    // Check if it's wrong
                    if (board[row][col] !== solution[row][col]) {
                        cell.classList.add("error");
                    }
                } else if (notes[row][col] && notes[row][col].size > 0) {
                    // Show notes
                    const notesGrid = document.createElement("div");
                    notesGrid.classList.add("notes-grid");
                    for (let n = 1; n <= 9; n++) {
                        const span = document.createElement("span");
                        span.textContent = notes[row][col].has(n) ? n : "";
                        notesGrid.appendChild(span);
                    }
                    cell.appendChild(notesGrid);
                }

                // Click handler
                cell.addEventListener("click", () => selectCell(row, col));

                boardEl.appendChild(cell);
            }
        }
        highlightCells();
        updateNumberCounts();
    }

    function selectCell(row, col) {
        if (!gameActive) return;
        selectedCell = { row, col };
        highlightCells();
    }

    function highlightCells() {
        const cells = boardEl.querySelectorAll(".sudoku-cell");
        cells.forEach(cell => {
            cell.classList.remove("selected", "highlighted", "same-number");
        });

        if (!selectedCell) return;

        const { row, col } = selectedCell;
        const selectedNum = board[row][col];

        cells.forEach(cell => {
            const r = parseInt(cell.dataset.row);
            const c = parseInt(cell.dataset.col);

            if (r === row && c === col) {
                cell.classList.add("selected");
            } else if (r === row || c === col ||
                (Math.floor(r / 3) === Math.floor(row / 3) &&
                 Math.floor(c / 3) === Math.floor(col / 3))) {
                cell.classList.add("highlighted");
            }

            if (selectedNum !== 0 && board[r][c] === selectedNum && !(r === row && c === col)) {
                cell.classList.add("same-number");
            }
        });
    }

    function updateNumberCounts() {
        const counts = Array(10).fill(0);
        for (let r = 0; r < 9; r++) {
            for (let c = 0; c < 9; c++) {
                if (board[r][c] !== 0) counts[board[r][c]]++;
            }
        }
        numBtns.forEach(btn => {
            const num = parseInt(btn.dataset.num);
            if (num >= 1 && num <= 9 && counts[num] >= 9) {
                btn.classList.add("completed");
            } else {
                btn.classList.remove("completed");
            }
        });
    }

    // --- Input Handling ---

    function placeNumber(num) {
        if (!gameActive || !selectedCell) return;

        const { row, col } = selectedCell;
        if (given[row][col]) return;

        if (notesMode && num !== 0) {
            // Toggle note
            if (!notes[row][col]) notes[row][col] = new Set();
            history.push({ type: "note", row, col, num, had: notes[row][col].has(num) });
            if (notes[row][col].has(num)) {
                notes[row][col].delete(num);
            } else {
                notes[row][col].add(num);
            }
            // Clear the cell value if there was one
            if (board[row][col] !== 0) {
                history[history.length - 1].prevValue = board[row][col];
                board[row][col] = 0;
            }
            renderBoard();
            return;
        }

        // Erase
        if (num === 0) {
            if (board[row][col] !== 0) {
                history.push({ type: "erase", row, col, prevValue: board[row][col] });
                board[row][col] = 0;
            }
            renderBoard();
            return;
        }

        // Place number
        const prevValue = board[row][col];
        history.push({ type: "place", row, col, prevValue, num });

        // Clear notes for this cell
        notes[row][col] = new Set();

        board[row][col] = num;

        if (num !== solution[row][col]) {
            // Mistake!
            mistakeCount++;
            mistakesEl.textContent = "Mistakes: " + mistakeCount + "/" + maxMistakes;
            if (mistakeCount >= maxMistakes) {
                gameOver();
                return;
            }
        } else {
            // Remove this number from notes in same row/col/box
            clearNotesFor(row, col, num);
        }

        renderBoard();
        checkWin();
    }

    function clearNotesFor(row, col, num) {
        for (let i = 0; i < 9; i++) {
            if (notes[row][i]) notes[row][i].delete(num);
            if (notes[i][col]) notes[i][col].delete(num);
        }
        const boxRow = Math.floor(row / 3) * 3;
        const boxCol = Math.floor(col / 3) * 3;
        for (let r = boxRow; r < boxRow + 3; r++) {
            for (let c = boxCol; c < boxCol + 3; c++) {
                if (notes[r][c]) notes[r][c].delete(num);
            }
        }
    }

    function undo() {
        if (!gameActive || history.length === 0) return;
        const action = history.pop();

        if (action.type === "place" || action.type === "erase") {
            board[action.row][action.col] = action.prevValue;
            if (action.type === "place" && action.num !== solution[action.row][action.col]) {
                mistakeCount = Math.max(0, mistakeCount - 1);
                mistakesEl.textContent = "Mistakes: " + mistakeCount + "/" + maxMistakes;
            }
        } else if (action.type === "note") {
            if (action.had) {
                notes[action.row][action.col].add(action.num);
            } else {
                notes[action.row][action.col].delete(action.num);
            }
            if (action.prevValue) {
                board[action.row][action.col] = action.prevValue;
            }
        }

        renderBoard();
    }

    function giveHint() {
        if (!gameActive || hintsUsed >= maxHints) return;

        // Find an empty cell
        const emptyCells = [];
        for (let r = 0; r < 9; r++) {
            for (let c = 0; c < 9; c++) {
                if (board[r][c] === 0 || board[r][c] !== solution[r][c]) {
                    emptyCells.push([r, c]);
                }
            }
        }

        if (emptyCells.length === 0) return;

        // Pick a random empty cell (or the selected one if it's empty)
        let target;
        if (selectedCell && (board[selectedCell.row][selectedCell.col] === 0 ||
            board[selectedCell.row][selectedCell.col] !== solution[selectedCell.row][selectedCell.col])) {
            target = [selectedCell.row, selectedCell.col];
        } else {
            target = emptyCells[Math.floor(Math.random() * emptyCells.length)];
        }

        const [r, c] = target;
        board[r][c] = solution[r][c];
        given[r][c] = true; // Make it permanent
        notes[r][c] = new Set();
        hintsUsed++;
        hintBtn.innerHTML = '<i class="fas fa-lightbulb"></i> Hint (' + (maxHints - hintsUsed) + ')';

        renderBoard();

        // Flash the hint cell
        const cells = boardEl.querySelectorAll(".sudoku-cell");
        cells.forEach(cell => {
            if (parseInt(cell.dataset.row) === r && parseInt(cell.dataset.col) === c) {
                cell.classList.add("hint-cell");
                setTimeout(() => cell.classList.remove("hint-cell"), 600);
            }
        });

        checkWin();
    }

    // --- Win / Game Over ---

    function checkWin() {
        for (let r = 0; r < 9; r++) {
            for (let c = 0; c < 9; c++) {
                if (board[r][c] !== solution[r][c]) return;
            }
        }
        // Win!
        gameActive = false;
        stopTimer();
        winTimeEl.textContent = "Time: " + formatTime(seconds);
        winMistakesEl.textContent = "Mistakes: " + mistakeCount;
        winModal.classList.remove("hidden");
    }

    function gameOver() {
        gameActive = false;
        stopTimer();
        gameoverModal.classList.remove("hidden");
    }

    // --- New Game ---

    function startNewGame() {
        winModal.classList.add("hidden");
        gameoverModal.classList.add("hidden");

        const difficulty = difficultyEl.value;
        const { puzzle, solution: sol } = generatePuzzle(difficulty);

        board = puzzle.map(r => [...r]);
        solution = sol;
        given = puzzle.map(r => r.map(v => v !== 0));
        notes = Array.from({ length: 9 }, () => Array.from({ length: 9 }, () => new Set()));
        history = [];
        selectedCell = null;
        mistakeCount = 0;
        hintsUsed = 0;
        notesMode = false;
        gameActive = true;

        mistakesEl.textContent = "Mistakes: 0/" + maxMistakes;
        hintBtn.innerHTML = '<i class="fas fa-lightbulb"></i> Hint (' + maxHints + ')';
        notesBtn.classList.remove("active");

        startTimer();
        renderBoard();
    }

    // --- Keyboard Support ---

    document.addEventListener("keydown", function (e) {
        if (!gameActive) return;

        const key = e.key;
        if (key >= "1" && key <= "9") {
            placeNumber(parseInt(key));
        } else if (key === "Backspace" || key === "Delete" || key === "0") {
            placeNumber(0);
        } else if (key === "ArrowUp" && selectedCell) {
            selectedCell.row = Math.max(0, selectedCell.row - 1);
            highlightCells();
        } else if (key === "ArrowDown" && selectedCell) {
            selectedCell.row = Math.min(8, selectedCell.row + 1);
            highlightCells();
        } else if (key === "ArrowLeft" && selectedCell) {
            selectedCell.col = Math.max(0, selectedCell.col - 1);
            highlightCells();
        } else if (key === "ArrowRight" && selectedCell) {
            selectedCell.col = Math.min(8, selectedCell.col + 1);
            highlightCells();
        } else if (key === "n" || key === "N") {
            notesMode = !notesMode;
            notesBtn.classList.toggle("active", notesMode);
        } else if (key === "z" && (e.ctrlKey || e.metaKey)) {
            e.preventDefault();
            undo();
        } else if (key === "h" || key === "H") {
            giveHint();
        }
    });

    // --- Event Listeners ---

    newGameBtn.addEventListener("click", startNewGame);
    playAgainBtn.addEventListener("click", startNewGame);
    retryBtn.addEventListener("click", startNewGame);
    hintBtn.addEventListener("click", giveHint);
    undoBtn.addEventListener("click", undo);

    notesBtn.addEventListener("click", function () {
        notesMode = !notesMode;
        notesBtn.classList.toggle("active", notesMode);
    });

    numBtns.forEach(btn => {
        btn.addEventListener("click", function () {
            const num = parseInt(this.dataset.num);
            placeNumber(num);
        });
    });

    // --- Initialize ---
    startNewGame();

})();
