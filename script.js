// Game pool - all available games
const ALL_GAMES = [
    {
        id: 'number',
        name: 'Huske spil',
        description: 'Husk tallet og skriv det!',
        instruction: 'Se tallet i 4 sekunder. Skriv det derefter. Nå 5 runder for at vinde!',
        initFunc: 'initNumberMemoryGame'
    },
    {
        id: 'vendes',
        name: 'Vendespil',
        description: 'Find alle de matchende par!',
        instruction: 'Vend to kort ad gangen og find alle par. Når du har fundet alle par, er spillet klaret!',
        initFunc: 'initVendeSpilGame'
    },
    {
        id: 'tictac',
        name: 'Kryds og bolle',
        description: 'Spil Kryds og bolle mod computeren!',
        instruction: 'Du er O, computeren er X',
        initFunc: 'initTicTacToeGame'
    },
    {
        id: 'visualmemory',
        name: 'Visuel hukommelse',
        description: 'Husk de oplyste felter!',
        instruction: 'Se hvilke felter der lyser op, og klik derefter på dem alle. Du har 3 liv.',
        initFunc: 'initVisualMemoryGame'
    }
];

// Today's selected games (3 random games)
let todayGames = [];
let gameCompletions = {
    game1: false,
    game2: false,
    game3: false
};

// Track timeouts/intervals per game so we can clean them up when modals close
const activeTimers = {};

function addTimer(gameNumber, timerId) {
    if (!activeTimers[gameNumber]) activeTimers[gameNumber] = [];
    activeTimers[gameNumber].push(timerId);
}

function clearTimers(gameNumber) {
    if (!activeTimers[gameNumber]) return;
    activeTimers[gameNumber].forEach(id => clearTimeout(id));
    activeTimers[gameNumber] = [];
}

// Get today's date as a seed for consistent daily selection
function getDailySeed() {
    const today = new Date();
    return today.getFullYear() * 10000 + today.getMonth() * 100 + today.getDate();
}

// Select 3 random games for today (consistent per day)
function selectDailyGames() {
    const seed = getDailySeed();
    const saved = localStorage.getItem('dailyGamesSelection');
    
    if (saved) {
        const data = JSON.parse(saved);
        const today = new Date().toDateString();
        
        if (data.date === today && data.games) {
            // Check if all saved games still exist in ALL_GAMES
            const allGamesExist = data.games.every(savedGame => 
                ALL_GAMES.some(game => game.id === savedGame.id)
            );
            
            if (allGamesExist) {
                todayGames = data.games;
                return;
            }
            // If some games were removed, generate new selection
        }
    }
    
    // Select 3 random games, but ensure Tic-Tac-Toe is included
    const shuffled = [...ALL_GAMES].sort(() => Math.random() - 0.5);
    const tictacGame = ALL_GAMES.find(game => game.id === 'tictac');
    const otherGames = ALL_GAMES.filter(game => game.id !== 'tictac');
    const shuffledOthers = otherGames.sort(() => Math.random() - 0.5);
    todayGames = [tictacGame, ...shuffledOthers.slice(0, 2)];
    
    // Save selection for today
    localStorage.setItem('dailyGamesSelection', JSON.stringify({
        date: new Date().toDateString(),
        games: todayGames
    }));
}

// Load saved progress from localStorage
function loadProgress() {
    const saved = localStorage.getItem('dailyGamesProgress');
    const today = new Date().toDateString();
    
    if (saved) {
        const data = JSON.parse(saved);
        // Reset if it's a new day
        if (data.date === today) {
            gameCompletions = data.completions || {
                game1: false,
                game2: false,
                game3: false
            };
        } else {
            gameCompletions = { game1: false, game2: false, game3: false };
        }
    } else {
        gameCompletions = { game1: false, game2: false, game3: false };
    }
}

// Save progress to localStorage
function saveProgress() {
    const data = {
        date: new Date().toDateString(),
        completions: gameCompletions
    };
    localStorage.setItem('dailyGamesProgress', JSON.stringify(data));
}

// Render game cards
function renderGameCards() {
    const gamesGrid = document.getElementById('games-grid');
    gamesGrid.innerHTML = '';
    
    todayGames.forEach((game, index) => {
        const gameNumber = index + 1;
        const card = document.createElement('div');
        card.className = 'game-card';
        card.id = `game${gameNumber}-card`;
        
        card.innerHTML = `
            <div class="game-status" id="game${gameNumber}-status">
                <span class="status-icon">⭕</span>
            </div>
            <h3>${game.name}</h3>
            <p>${game.description}</p>
            <button class="play-button" onclick="startGame(${gameNumber})">Start spil ${gameNumber}</button>
        `;
        
        gamesGrid.appendChild(card);
    });
}

// Render game modals
function renderGameModals() {
    const modalsContainer = document.getElementById('game-modals-container');
    modalsContainer.innerHTML = '';
    
    todayGames.forEach((game, index) => {
        const gameNumber = index + 1;
        const modal = document.createElement('div');
        modal.className = 'game-modal';
        modal.id = `game${gameNumber}-modal`;
        
        modal.innerHTML = `
            <div class="modal-content">
                <button class="close-button" onclick="closeGame(${gameNumber})">✕</button>
                <h2>${game.name}</h2>
                <p class="game-instructions">${game.instruction}</p>
                <div id="game${gameNumber}-content"></div>
            </div>
        `;
        
        modalsContainer.appendChild(modal);
    });
}

// Update UI based on completion status
function updateUI() {
    // Update progress circles
    const progressItems = document.querySelectorAll('.progress-item');
    const completedCount = Object.values(gameCompletions).filter(v => v).length;
    
    progressItems.forEach((item, index) => {
        if (index < completedCount) {
            item.classList.add('completed');
        } else {
            item.classList.remove('completed');
        }
    });

    // Update game cards
    for (let i = 1; i <= 3; i++) {
        const card = document.getElementById(`game${i}-card`);
        if (!card) continue;
        
        const status = document.getElementById(`game${i}-status`);
        const button = card.querySelector('.play-button');
        
        if (gameCompletions[`game${i}`]) {
            card.classList.add('completed');
            status.classList.add('completed');
            status.querySelector('.status-icon').textContent = '✓';
            button.disabled = true;
            button.textContent = 'Fuldført!';
        } else {
            card.classList.remove('completed');
            status.classList.remove('completed');
            status.querySelector('.status-icon').textContent = '⭕';
            button.disabled = false;
            button.textContent = `Start spil ${i}`;
        }
    }

    // Update flame
    const flame = document.getElementById('flame');
    if (completedCount === 3) {
        flame.classList.add('active');
    } else {
        flame.classList.remove('active');
    }

    saveProgress();
}

// Start a game
function startGame(gameNumber) {
    const game = todayGames[gameNumber - 1];
    if (!game) return;
    
    const modal = document.getElementById(`game${gameNumber}-modal`);
    modal.classList.add('active');
    
    // Initialize the game
    clearTimers(gameNumber);
    window[game.initFunc](gameNumber);
}

// Close a game
function closeGame(gameNumber) {
    clearTimers(gameNumber);
    const modal = document.getElementById(`game${gameNumber}-modal`);
    modal.classList.remove('active');
}

// Game 1: Memory Match
// Game 2 (replaced): Number Memory (your game)
function initNumberMemoryGame(gameNumber) {
    const content = document.getElementById(`game${gameNumber}-content`);
    content.innerHTML = `
        <div class="number-memory-area">
            <div class="number-display" id="number-display-${gameNumber}"></div>
            <input class="number-input" id="number-input-${gameNumber}" type="text" inputmode="numeric" autocomplete="off" style="display:none;" />
            <button class="play-button" id="number-submit-${gameNumber}" style="display:none;">OK</button>
            <div class="number-result" id="number-result-${gameNumber}"></div>
            <button class="play-button number-restart" id="number-restart-${gameNumber}" style="display:none;">Restart</button>
            <button class="play-button number-finish" id="number-finish-${gameNumber}" style="display:none;">Stop</button>
        </div>
        <div class="game-stats">
            <p>Runde: <span id="number-round-${gameNumber}">1</span></p>
        </div>
    `;

    const displayEl = document.getElementById(`number-display-${gameNumber}`);
    const inputEl = document.getElementById(`number-input-${gameNumber}`);
    const submitBtn = document.getElementById(`number-submit-${gameNumber}`);
    const resultEl = document.getElementById(`number-result-${gameNumber}`);
    const restartBtn = document.getElementById(`number-restart-${gameNumber}`);
    const finishBtn = document.getElementById(`number-finish-${gameNumber}`);
    const roundEl = document.getElementById(`number-round-${gameNumber}`);

    let length = 1;
    let currentNumber = '';
    const WIN_ROUNDS = 5;
    const SHOW_MS = 4000;

    function generateNumber(len) {
        let num = '';
        for (let i = 0; i < len; i++) num += Math.floor(Math.random() * 10);
        return num;
    }

    function resetUIForShow() {
        inputEl.style.display = 'none';
        submitBtn.style.display = 'none';
        restartBtn.style.display = 'none';
        finishBtn.style.display = 'none';
        resultEl.textContent = '';
        resultEl.classList.remove('wrong');
        inputEl.value = '';
    }

    function showInput() {
        inputEl.style.display = 'block';
        submitBtn.style.display = 'inline-block';
        inputEl.focus();
    }

    function startRound() {
        clearTimers(gameNumber);
        resetUIForShow();
        roundEl.textContent = String(length);

        currentNumber = generateNumber(length);
        displayEl.textContent = currentNumber;

        addTimer(gameNumber, setTimeout(() => {
            displayEl.textContent = '';
            showInput();
        }, SHOW_MS));
    }

    function checkAnswer() {
        const input = inputEl.value.trim();
        if (input === currentNumber) {
            resultEl.textContent = 'Korrekt!';
            resultEl.classList.remove('wrong');
            length++;

            if (length > WIN_ROUNDS) {
                // Stop the game after 5 rounds. Let the user press "Stop" to finish.
                clearTimers(gameNumber);
                // Count this daily game as completed immediately (so replay still counts for the flame).
                completeGame(gameNumber);
                displayEl.textContent = '';
                inputEl.style.display = 'none';
                submitBtn.style.display = 'none';
                restartBtn.style.display = 'inline-block';
                restartBtn.textContent = 'Spil igen';
                finishBtn.style.display = 'inline-block';
                resultEl.textContent = 'Færdig! Du gennemførte 5 runder.';
                resultEl.classList.remove('wrong');
                return;
            }

            addTimer(gameNumber, setTimeout(() => {
                startRound();
            }, 800));
        } else {
            resultEl.textContent = `Forkert! Tallet var ${currentNumber}`;
            resultEl.classList.add('wrong');
            restartBtn.style.display = 'inline-block';
            restartBtn.textContent = 'Genstart';
            finishBtn.style.display = 'none';
        }
    }

    submitBtn.addEventListener('click', checkAnswer);
    inputEl.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') checkAnswer();
    });

    restartBtn.addEventListener('click', () => {
        // If "Play Again" after completing 5 rounds, continue from current length
        // If "Restart" after wrong answer, reset to 1
        if (restartBtn.textContent === 'Spil igen') {
            // Continue with bigger numbers - don't reset length
            startRound();
        } else {
            // Reset to round 1 after wrong answer
            length = 1;
            restartBtn.textContent = 'Genstart';
            startRound();
        }
    });

    finishBtn.addEventListener('click', () => {
        // Mark this daily game as completed and close the modal.
        completeGame(gameNumber);
        closeGame(gameNumber);
    });

    startRound();
}

// Game 3: Color Match
// Game 4: Word Find

function initShapeGame(gameNumber) {
    const shapes = ['●', '■', '▲', '★', '◆', '♥'];
    const targetShape = shapes[Math.floor(Math.random() * shapes.length)];
    
    const content = document.getElementById(`game${gameNumber}-content`);
    content.innerHTML = `
        <div class="shape-game-area">
            <div class="target-shape" id="target-shape-${gameNumber}">${targetShape}</div>
            <p class="shape-label">Find denne figur:</p>
            <div class="shape-options" id="shape-options-${gameNumber}"></div>
        </div>
        <div class="game-stats">
            <p>Korrekt: <span id="shape-score-${gameNumber}">0</span> / 5</p>
        </div>
    `;
    
    const optionsContainer = document.getElementById(`shape-options-${gameNumber}`);
    const shuffled = [...shapes].sort(() => Math.random() - 0.5);
    let correctMatches = 0;
    const shapeScore = document.getElementById(`shape-score-${gameNumber}`);
    let currentTarget = targetShape;
    const targetShapeEl = document.getElementById(`target-shape-${gameNumber}`);
    
    shuffled.forEach((shape, index) => {
        const option = document.createElement('div');
        option.className = 'shape-option';
        option.textContent = shape;
        option.dataset.shape = shape;
        
        option.addEventListener('click', function() {
            if (this.classList.contains('correct') || this.classList.contains('wrong')) return;
            
            if (this.dataset.shape === currentTarget) {
                this.classList.add('correct');
                correctMatches++;
                shapeScore.textContent = correctMatches;
                
                if (correctMatches < 5) {
                    setTimeout(() => {
                        const remaining = shuffled.filter(s => 
                            !document.querySelector(`#shape-options-${gameNumber} [data-shape="${s}"].correct`)
                        );
                        if (remaining.length > 0) {
                            currentTarget = remaining[Math.floor(Math.random() * remaining.length)];
                            targetShapeEl.textContent = currentTarget;
                            document.querySelectorAll(`#shape-options-${gameNumber} .shape-option.wrong`).forEach(el => {
                                el.classList.remove('wrong');
                            });
                        }
                    }, 1000);
                } else {
                    setTimeout(() => {
                        completeGame(gameNumber);
                        closeGame(gameNumber);
                    }, 1000);
                }
            } else {
                this.classList.add('wrong');
                setTimeout(() => {
                    this.classList.remove('wrong');
                }, 1000);
            }
        });
        
        optionsContainer.appendChild(option);
    });
}


function initPatternGame(gameNumber) {
    const content = document.getElementById(`game${gameNumber}-content`);
    content.innerHTML = `
        <div class="pattern-game-area">
            <div class="pattern-board" id="pattern-board-${gameNumber}"></div>
            <div class="pattern-controls">
                <button id="show-pattern-${gameNumber}" class="pattern-button">Vis mønster</button>
            </div>
            <div class="game-stats">
                <p>Mønsterlængde: <span id="pattern-length-${gameNumber}">3</span></p>
            </div>
        </div>
    `;
    
    const board = document.getElementById(`pattern-board-${gameNumber}`);
    const showButton = document.getElementById(`show-pattern-${gameNumber}`);
    const patternLength = document.getElementById(`pattern-length-${gameNumber}`);
    let pattern = [];
    let playerSequence = [];
    let level = 3;
    
   
    
    colors.forEach((color, index) => {
        const button = document.createElement('div');
        button.className = 'pattern-button-item';
        button.textContent = color;
        button.dataset.color = color;
        button.dataset.index = index;
        board.appendChild(button);
    });
    
    function generatePattern() {
        pattern = [];
        for (let i = 0; i < level; i++) {
            pattern.push(colors[Math.floor(Math.random() * colors.length)]);
        }
        patternLength.textContent = level;
    }
    
    function showPattern() {
        const buttons = board.querySelectorAll('.pattern-button-item');
        buttons.forEach(btn => btn.classList.remove('active'));
        showButton.disabled = true;
        
        pattern.forEach((color, index) => {
            setTimeout(() => {
                const btn = Array.from(buttons).find(b => b.textContent === color);
                if (btn) {
                    btn.classList.add('active');
                    setTimeout(() => {
                        btn.classList.remove('active');
                    }, 600);
                }
            }, index * 700);
        });
        
        setTimeout(() => {
            showButton.disabled = false;
            showButton.textContent = 'Prøv igen';
        }, pattern.length * 700 + 500);
    }
    
    board.querySelectorAll('.pattern-button-item').forEach(button => {
        button.addEventListener('click', function() {
            if (showButton.disabled) return;
            
            playerSequence.push(this.textContent);
            this.classList.add('clicked');
            setTimeout(() => {
                this.classList.remove('clicked');
            }, 300);
            
            if (playerSequence.length === pattern.length) {
                if (JSON.stringify(playerSequence) === JSON.stringify(pattern)) {
                    level++;
                    playerSequence = [];
                    generatePattern();
                    showPattern();
                    
                    if (level > 5) {
                        setTimeout(() => {
                            completeGame(gameNumber);
                            closeGame(gameNumber);
                        }, 1000);
                    }
                } else {
                    playerSequence = [];
                    alert('Prøv igen!');
                    showPattern();
                }
            }
        });
    });
    
    showButton.addEventListener('click', () => {
        playerSequence = [];
        showPattern();
    });
    
    generatePattern();
    showPattern();
}


function initMathGame(gameNumber) {
    const content = document.getElementById(`game${gameNumber}-content`);
    content.innerHTML = `
        <div class="math-game-area">
            <div class="math-problem" id="math-problem-${gameNumber}"></div>
            <div class="math-options" id="math-options-${gameNumber}"></div>
        </div>
        <div class="game-stats">
            <p>Korrekt: <span id="math-score-${gameNumber}">0</span> / 5</p>
        </div>
    `;
    
    const problemEl = document.getElementById(`math-problem-${gameNumber}`);
    const optionsEl = document.getElementById(`math-options-${gameNumber}`);
    const mathScore = document.getElementById(`math-score-${gameNumber}`);
    let correctCount = 0;
    
    function generateProblem() {
        const num1 = Math.floor(Math.random() * 10) + 1;
        const num2 = Math.floor(Math.random() * 10) + 1;
        const answer = num1 + num2;
        
        problemEl.textContent = `${num1} + ${num2} = ?`;
        problemEl.dataset.answer = answer;
        
        optionsEl.innerHTML = '';
        const options = [answer, answer + 1, answer - 1, answer + 2].sort(() => Math.random() - 0.5);
        
        options.forEach(option => {
            const button = document.createElement('div');
            button.className = 'math-option';
            button.textContent = option;
            button.dataset.value = option;
            
            button.addEventListener('click', function() {
                if (this.classList.contains('correct') || this.classList.contains('wrong')) return;
                
                if (parseInt(this.dataset.value) === answer) {
                    this.classList.add('correct');
                    correctCount++;
                    mathScore.textContent = correctCount;
                    
                    if (correctCount < 5) {
                        setTimeout(() => {
                            generateProblem();
                        }, 1000);
                    } else {
                        setTimeout(() => {
                            completeGame(gameNumber);
                            closeGame(gameNumber);
                        }, 1000);
                    }
                } else {
                    this.classList.add('wrong');
                    setTimeout(() => {
                        this.classList.remove('wrong');
                    }, 1000);
                }
            });
            
            optionsEl.appendChild(button);
        });
    }
    
    generateProblem();
}

// Game: Vendespil (Memory / pairs)
function initVendeSpilGame(gameNumber) {
    const content = document.getElementById(`game${gameNumber}-content`);
    content.innerHTML = `
        <div class="vende-area">
            <div class="vende-grid" id="vende-grid-${gameNumber}"></div>
            <div class="vende-footer">
                <div class="vende-score">Forsøg: <span id="vende-score-${gameNumber}">0</span></div>
                <button class="play-button vende-restart" id="vende-restart-${gameNumber}">Genstart</button>
            </div>
        </div>
    `;

    const grid = document.getElementById(`vende-grid-${gameNumber}`);
    const scoreEl = document.getElementById(`vende-score-${gameNumber}`);
    const restartBtn = document.getElementById(`vende-restart-${gameNumber}`);

    // Use image assets (same set as your original game)
    const cardsData = [
        { image: './assets/chili.png', name: 'chili' },
        { image: './assets/grapes.png', name: 'grapes' },
        { image: './assets/lemon.png', name: 'lemon' },
        { image: './assets/orange.png', name: 'orange' },
        { image: './assets/pineapple.png', name: 'pineapple' },
        { image: './assets/strawberry.png', name: 'strawberry' },
        { image: './assets/tomato.png', name: 'tomato' },
        { image: './assets/watermelon.png', name: 'watermelon' },
        { image: './assets/cherries.png', name: 'cherries' }
    ];
    let cards = [];
    let firstCard = null;
    let secondCard = null;
    let lockBoard = false;
    let tries = 0;
    let matchedPairs = 0;

    function shuffle(array) {
        const arr = [...array];
        let currentIndex = arr.length;
        while (currentIndex !== 0) {
            const randomIndex = Math.floor(Math.random() * currentIndex);
            currentIndex -= 1;
            const temp = arr[currentIndex];
            arr[currentIndex] = arr[randomIndex];
            arr[randomIndex] = temp;
        }
        return arr;
    }

    function resetBoard() {
        firstCard = null;
        secondCard = null;
        lockBoard = false;
    }

    function buildDeck() {
        // 9 pairs = 18 cards
        cards = shuffle([...cardsData, ...cardsData]).map((card, idx) => ({
            id: `${card.name}-${idx}`,
            name: card.name,
            image: card.image
        }));
    }

    function render() {
        grid.innerHTML = '';
        cards.forEach((card) => {
            const el = document.createElement('button');
            el.type = 'button';
            el.className = 'vende-card';
            el.setAttribute('aria-label', 'Kort');
            el.dataset.name = card.name;
            el.dataset.id = card.id;

            el.innerHTML = `
                <div class="vende-inner">
                    <div class="vende-front">
                        <img class="vende-front-image" src="${card.image}" alt="${card.name}" />
                    </div>
                    <div class="vende-back"></div>
                </div>
            `;

            el.addEventListener('click', () => flipCard(el));
            grid.appendChild(el);
        });
    }

    function flipCard(cardEl) {
        if (lockBoard) return;
        if (cardEl.classList.contains('matched')) return;
        if (cardEl === firstCard) return;

        cardEl.classList.add('flipped');

        if (!firstCard) {
            firstCard = cardEl;
            return;
        }

        secondCard = cardEl;
        tries += 1;
        scoreEl.textContent = String(tries);
        lockBoard = true;

        const isMatch = firstCard.dataset.name === secondCard.dataset.name;
        if (isMatch) {
            firstCard.classList.add('matched');
            secondCard.classList.add('matched');
            matchedPairs += 1;
            resetBoard();

            // All pairs found => complete this daily game
            if (matchedPairs === cardsData.length) {
                addTimer(gameNumber, setTimeout(() => {
                    completeGame(gameNumber);
                    closeGame(gameNumber);
                }, 700));
            }
        } else {
            addTimer(gameNumber, setTimeout(() => {
                firstCard.classList.remove('flipped');
                secondCard.classList.remove('flipped');
                resetBoard();
            }, 900));
        }
    }

    function restart() {
        clearTimers(gameNumber);
        tries = 0;
        matchedPairs = 0;
        scoreEl.textContent = '0';
        resetBoard();
        buildDeck();
        render();
    }

    restartBtn.addEventListener('click', restart);

    restart();
}

// Game: Tic Tac Toe
function initTicTacToeGame(gameNumber) {
    const content = document.getElementById(`game${gameNumber}-content`);
    content.innerHTML = `
        <div class="tictac-area">
            <div class="tictac-board" id="tictac-board-${gameNumber}">
                ${Array.from({ length: 9 }, (_, i) => `<button class="tictac-square" data-index="${i}" type="button" aria-label="Felt ${i + 1}"></button>`).join('')}
            </div>
            <div class="tictac-status" id="tictac-status-${gameNumber}">Du må spille først</div>
            <button class="play-button tictac-reset" id="tictac-reset-${gameNumber}">Reset</button>
        </div>
    `;

    const boardEl = document.getElementById(`tictac-board-${gameNumber}`);
    const squares = Array.from(boardEl.querySelectorAll('.tictac-square'));
    const statusEl = document.getElementById(`tictac-status-${gameNumber}`);
    const resetBtn = document.getElementById(`tictac-reset-${gameNumber}`);

    let currentPlayer = 'circle'; // 'circle' = O (player), 'cross' = X (AI)
    let gameActive = true;
    const gameState = Array(9).fill(null);
    let lastWinnerPlayer = true; // true if player won last, false if AI

    const winningConditions = [
        [0, 1, 2],
        [3, 4, 5],
        [6, 7, 8],
        [0, 3, 6],
        [1, 4, 7],
        [2, 5, 8],
        [0, 4, 8],
        [2, 4, 6]
    ];

    function sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    function updateStatus() {
        if (!gameActive) return;
        if (currentPlayer === 'circle') {
            statusEl.textContent = "Din tur";
        } else {
            statusEl.textContent = "Computerens tur";
        }
    }

    function handleSquareClick(event) {
        if (!gameActive || currentPlayer !== 'circle') return;
        const square = event.currentTarget;
        const index = parseInt(square.getAttribute('data-index'), 10);

        if (gameState[index] !== null) {
            return;
        }

        gameState[index] = currentPlayer;
        square.classList.add(currentPlayer);

        if (checkWin()) {
            gameActive = false;
            statusEl.textContent = "Du vinder";
            lastWinnerPlayer = true;
            addTimer(gameNumber, setTimeout(() => {
                completeGame(gameNumber);
                closeGame(gameNumber);
            }, 800));
            return;
        }

        if (gameState.every(cell => cell !== null)) {
            gameActive = false;
            statusEl.textContent = 'Uafgjort';
            addTimer(gameNumber, setTimeout(() => {
                closeGame(gameNumber);
            }, 800));
            return;
        }

        currentPlayer = 'cross';
        updateStatus();
        aiBot();
    }

    function checkWin() {
        return winningConditions.some(condition =>
            condition.every(index => gameState[index] === currentPlayer)
        );
    }

    function aiBot() {
        if (!gameActive) return;

        const emptyIndices = gameState.map((cell, index) => cell === null ? index : null).filter(index => index !== null);
        if (emptyIndices.length === 0) return;

        const randomIndex = emptyIndices[Math.floor(Math.random() * emptyIndices.length)];
        gameState[randomIndex] = 'cross';
        squares[randomIndex].classList.add('cross');

        if (checkWin()) {
            gameActive = false;
            statusEl.textContent = "Ai vinder";
            lastWinnerPlayer = false;
            addTimer(gameNumber, setTimeout(() => {
                closeGame(gameNumber);
            }, 800));
            return;
        }

        if (gameState.every(cell => cell !== null)) {
            gameActive = false;
            statusEl.textContent = 'Uafgjort';
            addTimer(gameNumber, setTimeout(() => {
                closeGame(gameNumber);
            }, 800));
            return;
        }

        currentPlayer = 'circle';
        updateStatus();
    }

    function resetGame() {
        for (let i = 0; i < gameState.length; i++) {
            gameState[i] = null;
        }
        squares.forEach(square => {
            square.classList.remove('circle', 'cross');
        });
        gameActive = true;
        currentPlayer = 'circle';
        statusEl.textContent = "Du må spille først";
    }

    squares.forEach(square => {
        square.addEventListener('click', handleSquareClick);
    });

    resetBtn.addEventListener('click', resetGame);

    // Initial setup
    const aiStarts = !lastWinnerPlayer;
    if (aiStarts) {
        statusEl.textContent = "Ai's tur til at starte";
        currentPlayer = 'cross';
        aiBot();
    } else {
        statusEl.textContent = "Du må spille først";
        currentPlayer = 'circle';
    }
}

// Complete a game
function completeGame(gameNumber) {
    gameCompletions[`game${gameNumber}`] = true;
    updateUI();
}

// Visual Memory Game
function initVisualMemoryGame(gameNumber) {
    const content = document.getElementById(`game${gameNumber}-content`);
    content.innerHTML = `
        <div class="visual-memory-area">
            <div id="visual-info-${gameNumber}" class="visual-info">
                Level: <span id="visual-level-${gameNumber}">1</span> |
                Lives: <span id="visual-lives-${gameNumber}">3</span> |
                Grid: <span id="visual-grid-size-${gameNumber}">3×3</span>
            </div>
            <button class="play-button" id="visual-start-${gameNumber}">Start Game</button>
            <div id="visual-grid-${gameNumber}" class="visual-grid"></div>
        </div>
    `;

    const gridEl = document.getElementById(`visual-grid-${gameNumber}`);
    const levelEl = document.getElementById(`visual-level-${gameNumber}`);
    const livesEl = document.getElementById(`visual-lives-${gameNumber}`);
    const gridSizeEl = document.getElementById(`visual-grid-size-${gameNumber}`);
    const startBtn = document.getElementById(`visual-start-${gameNumber}`);

    let level = 1;
    let lives = 3;
    let gridSize = 3;
    let targets = new Set();
    let found = new Set();
    let clickable = false;

    startBtn.addEventListener('click', startGame);

    function startGame() {
        level = 1;
        lives = 3;
        gridSize = 3;
        buildGrid();
        nextLevel();
    }

    function buildGrid() {
        gridEl.innerHTML = "";
        gridEl.style.gridTemplateColumns = `repeat(${gridSize}, 70px)`;
        gridSizeEl.textContent = `${gridSize}×${gridSize}`;

        const total = gridSize * gridSize;

        for (let i = 0; i < total; i++) {
            const tile = document.createElement("div");
            tile.className = "visual-tile";
            tile.dataset.index = i;
            tile.addEventListener('click', () => clickTile(i, tile));
            gridEl.appendChild(tile);
        }
    }

    function nextLevel() {
        clickable = false;
        found.clear();
        targets.clear();
        clearTiles();

        // Every 4 levels, increase grid size
        if ((level - 1) % 4 === 0 && level !== 1) {
            gridSize++;
            buildGrid();
        }

        levelEl.textContent = level;
        livesEl.textContent = lives;

        const totalTiles = gridSize * gridSize;

        while (targets.size < level) {
            targets.add(Math.floor(Math.random() * totalTiles));
        }

        // Show correct tiles
        targets.forEach(i => {
            document.querySelector(`[data-index='${i}']`).classList.add("active");
        });

        addTimer(gameNumber, setTimeout(() => {
            clearTiles();
            clickable = true;
        }, 1200));
    }

    function clearTiles() {
        document.querySelectorAll(".visual-tile").forEach(t => {
            t.classList.remove("active", "correct");
        });
    }

    function clickTile(index, tile) {
        if (!clickable || found.has(index)) return;

        if (targets.has(index)) {
            tile.classList.add("correct");
            found.add(index);

            if (found.size === targets.size) {
                level++;
                if (level > 5) { // Win condition - reach level 5
                    completeGame(gameNumber);
                    closeGame(gameNumber);
                    return;
                }
                addTimer(gameNumber, setTimeout(nextLevel, 600));
            }
        } else {
            lives--;
            livesEl.textContent = lives;
            clickable = false;

            if (lives === 0) {
                // Game over
                completeGame(gameNumber);
                closeGame(gameNumber);
                return;
            }

            addTimer(gameNumber, setTimeout(nextLevel, 600));
        }
    }
}

// Admin: Reset daily games (select 3 new random games)
function resetDailyGames() {
    // Clear saved selection
    localStorage.removeItem('dailyGamesSelection');
    
    // Select 3 new random games, but ensure Tic-Tac-Toe is included
    const shuffled = [...ALL_GAMES].sort(() => Math.random() - 0.5);
    const tictacGame = ALL_GAMES.find(game => game.id === 'tictac');
    const otherGames = ALL_GAMES.filter(game => game.id !== 'tictac');
    const shuffledOthers = otherGames.sort(() => Math.random() - 0.5);
    todayGames = [tictacGame, ...shuffledOthers.slice(0, 2)];
    
    // Save new selection for today
    localStorage.setItem('dailyGamesSelection', JSON.stringify({
        date: new Date().toDateString(),
        games: todayGames
    }));
    
    // Reset progress
    gameCompletions = { game1: false, game2: false, game3: false };
    saveProgress();
    
    // Re-render everything
    renderGameCards();
    renderGameModals();
    updateUI();
    
    // Show confirmation and reload page
    alert('Spil nulstillet! Du har nu 3 nye spil at spille.');
    location.reload();
}

// Close modal when clicking outside
window.addEventListener('click', function(event) {
    const modals = document.querySelectorAll('.game-modal');
    modals.forEach(modal => {
        if (event.target === modal) {
            modal.classList.remove('active');
        }
    });
});

// Initialize on load
document.addEventListener('DOMContentLoaded', function() {
    selectDailyGames();
    loadProgress();
    renderGameCards();
    renderGameModals();
    updateUI();
});
