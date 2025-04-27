class Game {
    constructor(size, version) {
        this.size = size;
        this.version = version;
        this.board = this.generateRandomBoard(size);
        this.currentPlayer = 'Left'; // Left or Right
        this.selectedCells = [];
        this.gameOver = false;
        this.initializeBoard();
        this.setupEventListeners();
    }

    generateRandomBoard(size) {
        // Each cell has a 50% chance to have a dot
        return Array.from({ length: size }, () =>
            Array.from({ length: size }, () => Math.random() < 0.5)
        );
    }

    initializeBoard() {
        const boardElement = document.getElementById('game-board');
        boardElement.style.gridTemplateColumns = `repeat(${this.size}, 50px)`;
        boardElement.innerHTML = '';

        for (let i = 0; i < this.size; i++) {
            for (let j = 0; j < this.size; j++) {
                const cell = document.createElement('div');
                cell.className = 'cell';
                cell.dataset.row = i;
                cell.dataset.col = j;
                boardElement.appendChild(cell);
            }
        }
        this.updateBoard();
    }

    setupEventListeners() {
        // Game version selector
        document.getElementById('game-version-select').addEventListener('change', (e) => {
            const version = e.target.value;
            document.getElementById('all-small-rules').classList.toggle('hidden', version !== 'all-small');
            document.getElementById('non-all-small-rules').classList.toggle('hidden', version !== 'non-all-small');
        });

        document.getElementById('new-game').addEventListener('click', () => {
            document.getElementById('game-screen').classList.add('hidden');
            document.getElementById('welcome-screen').classList.remove('hidden');
        });

        document.getElementById('start-game').addEventListener('click', () => {
            const size = parseInt(document.getElementById('board-size').value);
            const version = document.getElementById('game-version-select').value;
            if (size >= 2 && size <= 10) {
                document.getElementById('welcome-screen').classList.add('hidden');
                document.getElementById('game-screen').classList.remove('hidden');
                document.getElementById('game-version-display').textContent = `Version: ${version === 'all-small' ? 'All Small' : 'Non-All Small'}`;
                this.resetGame(size, version);
            } else {
                alert('Please enter a board size between 2 and 10');
            }
        });

        document.getElementById('game-board').addEventListener('click', (e) => {
            if (this.gameOver) return;
            const cell = e.target.closest('.cell');
            if (!cell) return;
            const row = parseInt(cell.dataset.row);
            const col = parseInt(cell.dataset.col);
            if (!this.board[row][col]) return; // Only select if dot exists
            const idx = this.selectedCells.findIndex(([r, c]) => r === row && c === col);
            if (idx === -1) {
                this.selectedCells.push([row, col]);
            } else {
                this.selectedCells.splice(idx, 1);
            }
            this.updateBoard();
        });

        document.getElementById('confirm-move').addEventListener('click', () => {
            if (this.gameOver) return;
            if (this.selectedCells.length === 0) {
                this.showMoveMessage('Select at least one dot to remove.');
                return;
            }
            let valid = false;
            let allInSame = false;
            if (this.currentPlayer === 'Left') {
                // All in same column
                const col = this.selectedCells[0][1];
                allInSame = this.selectedCells.every(([r, c]) => c === col);
                if (allInSame) {
                    if (this.version === 'non-all-small') {
                        // Check if this would remove all dots from the column
                        const dotsInCol = this.board.filter(row => row[col]).length;
                        if (dotsInCol === this.selectedCells.length) {
                            this.showMoveMessage('Invalid move! Cannot remove all dots from a column in this variation.');
                            return;
                        }
                    }
                    valid = true;
                }
            } else {
                // All in same row
                const row = this.selectedCells[0][0];
                allInSame = this.selectedCells.every(([r, c]) => r === row);
                if (allInSame) {
                    if (this.version === 'non-all-small') {
                        // Check if this would remove all dots from the row
                        const dotsInRow = this.board[row].filter(cell => cell).length;
                        if (dotsInRow === this.selectedCells.length) {
                            this.showMoveMessage('Invalid move! Cannot remove all dots from a row in this variation.');
                            return;
                        }
                    }
                    valid = true;
                }
            }
            if (!valid) {
                this.showMoveMessage('Invalid move! All selected dots must be in the same ' + (this.currentPlayer === 'Left' ? 'column.' : 'row.'));
                return;
            }
            // Remove selected dots
            for (const [r, c] of this.selectedCells) {
                this.board[r][c] = false;
            }
            this.selectedCells = [];
            this.updateBoard();
            this.checkGameOver();
            if (!this.gameOver) {
                this.currentPlayer = this.currentPlayer === 'Left' ? 'Right' : 'Left';
                this.updateGameInfo();
                this.showMoveMessage('');
                // Check if next player has any valid moves
                if (!this.hasValidMoves(this.currentPlayer)) {
                    this.gameOver = true;
                    document.getElementById('game-status').textContent = `Game Over! ${this.currentPlayer} has no valid moves. ${this.currentPlayer === 'Left' ? 'Right' : 'Left'} wins!`;
                }
            }
        });
    }

    updateBoard() {
        const cells = document.querySelectorAll('.cell');
        cells.forEach(cell => {
            const row = parseInt(cell.dataset.row);
            const col = parseInt(cell.dataset.col);
            if (this.board[row][col]) {
                cell.classList.add('has-dot');
            } else {
                cell.classList.remove('has-dot');
            }
            // Highlight selected
            if (this.selectedCells.some(([r, c]) => r === row && c === col)) {
                cell.classList.add('selected');
            } else {
                cell.classList.remove('selected');
            }
        });
    }

    showMoveMessage(msg) {
        document.getElementById('move-message').textContent = msg;
    }

    checkGameOver() {
        const hasDots = this.board.some(row => row.some(cell => cell));
        if (!hasDots) {
            this.gameOver = true;
            document.getElementById('game-status').textContent = `Game Over! ${this.currentPlayer} wins!`;
        }
    }

    updateGameInfo() {
        document.getElementById('current-player').textContent = `Current Player: ${this.currentPlayer}`;
    }

    resetGame(size, version) {
        this.size = size;
        this.version = version;
        this.board = this.generateRandomBoard(size);
        this.currentPlayer = 'Left';
        this.selectedCells = [];
        this.gameOver = false;
        this.initializeBoard();
        document.getElementById('game-status').textContent = 'Game in progress';
        this.updateGameInfo();
        this.showMoveMessage('');
    }

    hasValidMoves(player) {
        if (player === 'Left') {
            for (let col = 0; col < this.size; col++) {
                // Get all rows with a dot in this column
                const rowsWithDot = [];
                for (let row = 0; row < this.size; row++) {
                    if (this.board[row][col]) rowsWithDot.push(row);
                }
                if (rowsWithDot.length === 0) continue;
                if (this.version === 'all-small') {
                    return true; // Can always remove at least one dot from a non-empty column
                } else {
                    // In non-all-small, must not remove all dots from the column
                    if (rowsWithDot.length > 1) return true;
                }
            }
        } else {
            for (let row = 0; row < this.size; row++) {
                // Get all columns with a dot in this row
                const colsWithDot = [];
                for (let col = 0; col < this.size; col++) {
                    if (this.board[row][col]) colsWithDot.push(col);
                }
                if (colsWithDot.length === 0) continue;
                if (this.version === 'all-small') {
                    return true; // Can always remove at least one dot from a non-empty row
                } else {
                    // In non-all-small, must not remove all dots from the row
                    if (colsWithDot.length > 1) return true;
                }
            }
        }
        return false;
    }
}

// Initialize the game with default 3x3 board and all-small version
const game = new Game(3, 'all-small'); 