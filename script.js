class TypingGame {
    constructor() {
        this.words = [
            'cosmic', 'stellar', 'galaxy', 'nebula', 'planet', 'asteroid', 'comet', 'meteor',
            'universe', 'orbit', 'gravity', 'space', 'rocket', 'satellite', 'telescope', 'astronaut',
            'solar', 'lunar', 'eclipse', 'constellation', 'supernova', 'blackhole', 'quasar', 'pulsar',
            'photon', 'quantum', 'energy', 'matter', 'fusion', 'radiation', 'spectrum', 'velocity',
            'acceleration', 'trajectory', 'mission', 'exploration', 'discovery', 'science', 'technology',
            'innovation', 'future', 'infinity', 'dimension', 'parallel', 'wormhole', 'stargate',
            'alien', 'extraterrestrial', 'civilization', 'intelligence', 'communication', 'signal',
            'frequency', 'wavelength', 'amplitude', 'resonance', 'harmony', 'symphony', 'melody',
            'rhythm', 'tempo', 'beat', 'pulse', 'vibration', 'oscillation', 'wave', 'particle'
        ];
        
        this.gameState = {
            isPlaying: false,
            isPaused: false,
            score: 0,
            highScore: localStorage.getItem('typingGameHighScore') || 0,
            streak: 0,
            mode: 'easy',
            speed: 1,
            fallingWords: [],
            gameLoop: null,
            wordSpawnTimer: null
        };
        
        this.elements = {
            gameArea: document.getElementById('game-area'),
            fallingWordsContainer: document.getElementById('falling-words'),
            wordInput: document.getElementById('word-input'),
            currentScore: document.getElementById('current-score'),
            highScore: document.getElementById('high-score'),
            streak: document.getElementById('streak'),
            startBtn: document.getElementById('start-btn'),
            pauseBtn: document.getElementById('pause-btn'),
            resetBtn: document.getElementById('reset-btn'),
            gameStatus: document.getElementById('game-status'),
            gameOverModal: document.getElementById('game-over-modal'),
            finalScore: document.getElementById('final-score'),
            newHighScore: document.getElementById('new-high-score'),
            playAgainBtn: document.getElementById('play-again-btn'),
            modeButtons: document.querySelectorAll('.mode-btn')
        };
        
        this.init();
    }
    
    init() {
        this.updateDisplay();
        this.bindEvents();
        this.elements.wordInput.focus();
    }
    
    bindEvents() {
        // Game controls
        this.elements.startBtn.addEventListener('click', () => this.startGame());
        this.elements.pauseBtn.addEventListener('click', () => this.togglePause());
        this.elements.resetBtn.addEventListener('click', () => this.resetGame());
        this.elements.playAgainBtn.addEventListener('click', () => this.resetGame());
        
        // Input handling
        this.elements.wordInput.addEventListener('input', (e) => this.handleInput(e));
        this.elements.wordInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                this.checkWord();
            }
        });
        
        // Mode selection
        this.elements.modeButtons.forEach(btn => {
            btn.addEventListener('click', (e) => this.changeMode(e.target.dataset.mode));
        });
        
        // Prevent context menu on game area
        this.elements.gameArea.addEventListener('contextmenu', (e) => e.preventDefault());
    }
    
    changeMode(mode) {
        if (this.gameState.isPlaying) return;
        
        this.gameState.mode = mode;
        this.elements.modeButtons.forEach(btn => btn.classList.remove('active'));
        document.querySelector(`[data-mode="${mode}"]`).classList.add('active');
        
        this.updateGameStatus(`${this.getModeEmoji(mode)} ${mode.charAt(0).toUpperCase() + mode.slice(1)} mode selected!`);
    }
    
    getModeEmoji(mode) {
        const emojis = { easy: '🟢', medium: '🟡', hard: '🔴' };
        return emojis[mode] || '🟢';
    }
    
    startGame() {
        this.gameState.isPlaying = true;
        this.gameState.isPaused = false;
        this.gameState.score = 0;
        this.gameState.streak = 0;
        this.gameState.speed = 1;
        this.gameState.fallingWords = [];
        
        this.elements.startBtn.disabled = true;
        this.elements.pauseBtn.disabled = false;
        this.elements.wordInput.disabled = false;
        this.elements.wordInput.focus();
        
        this.clearFallingWords();
        this.updateDisplay();
        this.updateGameStatus(`${this.getModeEmoji(this.gameState.mode)} Game started! Type the falling words!`);
        
        this.startGameLoop();
        this.startWordSpawning();
    }
    
    togglePause() {
        if (!this.gameState.isPlaying) return;
        
        this.gameState.isPaused = !this.gameState.isPaused;
        
        if (this.gameState.isPaused) {
            this.pauseGame();
        } else {
            this.resumeGame();
        }
    }
    
    pauseGame() {
        clearInterval(this.gameState.gameLoop);
        clearInterval(this.gameState.wordSpawnTimer);
        
        this.gameState.fallingWords.forEach(word => {
            word.element.style.animationPlayState = 'paused';
        });
        
        this.elements.pauseBtn.textContent = '▶️ Resume';
        this.updateGameStatus('⏸️ Game paused. Click Resume to continue!');
    }
    
    resumeGame() {
        this.gameState.fallingWords.forEach(word => {
            word.element.style.animationPlayState = 'running';
        });
        
        this.startGameLoop();
        this.startWordSpawning();
        
        this.elements.pauseBtn.textContent = '⏸️ Pause';
        this.updateGameStatus(`${this.getModeEmoji(this.gameState.mode)} Game resumed! Keep typing!`);
    }
    
    resetGame() {
        this.gameState.isPlaying = false;
        this.gameState.isPaused = false;
        
        clearInterval(this.gameState.gameLoop);
        clearInterval(this.gameState.wordSpawnTimer);

        
        this.elements.startBtn.disabled = false;
        this.elements.pauseBtn.disabled = true;
        this.elements.pauseBtn.textContent = '⏸️ Pause';
        this.elements.wordInput.disabled = false;
        this.elements.wordInput.value = '';
        this.elements.gameOverModal.style.display = 'none';
        
        this.clearFallingWords();
        this.updateGameStatus('🚀 Ready to start your cosmic typing adventure!');
        this.elements.wordInput.focus();
    }
    
    startGameLoop() {
        this.gameState.gameLoop = setInterval(() => {
            if (!this.gameState.isPaused) {
                this.updateFallingWords();
                this.checkCollisions();
            }
        }, 50);
    }
    
    startWordSpawning() {
        const spawnWord = () => {
            if (!this.gameState.isPaused && this.gameState.isPlaying) {
                this.spawnWord();
            }
            
            // Adjust spawn rate based on mode and score (much reduced spawn rate)
            let baseSpawnRate = {
                easy: 4000,
                medium: 3000,
                hard: 2200
            };
            
            let spawnRate = Math.max(baseSpawnRate[this.gameState.mode] - (this.gameState.score * 10), 1500);
            
            this.gameState.wordSpawnTimer = setTimeout(spawnWord, spawnRate);
        };
        
        spawnWord();
    }
    
    spawnWord() {
        const word = this.getRandomWord();
        const wordElement = this.createWordElement(word);
        
        const wordObj = {
            text: word,
            element: wordElement,
            x: Math.random() * (this.elements.gameArea.offsetWidth - 100),
            y: -50,
            speed: this.calculateFallSpeed()
        };
        
        this.gameState.fallingWords.push(wordObj);
        this.elements.fallingWordsContainer.appendChild(wordElement);
        
        // Position the word with faster animation
        wordElement.style.left = wordObj.x + 'px';
        wordElement.style.animationDuration = (300 / wordObj.speed) + 's';
    }
    
    createWordElement(word) {
        const element = document.createElement('div');
        element.className = `falling-word ${this.gameState.mode}-mode`;
        element.textContent = word;
        return element;
    }
    
    calculateFallSpeed() {
        // Increased base speed for faster falling
        let speedMultiplier = {
            easy: 2.5,
            medium: 3.5,
            hard: 4.5
        };
        
        let baseSpeed = speedMultiplier[this.gameState.mode] + (this.gameState.score * 0.08);
        
        return Math.min(baseSpeed, 8);
    }
    
    getRandomWord() {
        return this.words[Math.floor(Math.random() * this.words.length)];
    }
    
    updateFallingWords() {
        this.gameState.fallingWords.forEach((word, index) => {
            const rect = word.element.getBoundingClientRect();
            const gameAreaRect = this.elements.gameArea.getBoundingClientRect();
            
            if (rect.top > gameAreaRect.bottom) {
                this.gameOver();
            }
        });
    }
    
    checkCollisions() {
        // This is handled by CSS animations and checkWord method
    }
    
    handleInput(e) {
        if (!this.gameState.isPlaying || this.gameState.isPaused) {
            e.target.value = '';
            return;
        }
    }
    
    checkWord() {
        const inputValue = this.elements.wordInput.value.trim().toLowerCase();
        if (!inputValue) return;
        
        const matchedWordIndex = this.gameState.fallingWords.findIndex(
            word => word.text.toLowerCase() === inputValue
        );
        
        if (matchedWordIndex !== -1) {
            this.wordMatched(matchedWordIndex);
        }
        
        this.elements.wordInput.value = '';
    }
    
    wordMatched(wordIndex) {
        const word = this.gameState.fallingWords[wordIndex];
        
        // Add matched animation
        word.element.classList.add('word-matched');
        
        // Remove word after animation
        setTimeout(() => {
            if (word.element.parentNode) {
                word.element.parentNode.removeChild(word.element);
            }
        }, 500);
        
        // Remove from array
        this.gameState.fallingWords.splice(wordIndex, 1);
        
        // Update score and streak
        this.gameState.score += 10;
        this.gameState.streak += 1;
        
        // Show streak effect for all modes
        if (this.gameState.streak % 5 === 0) {
            this.showStreakEffect();
        }
        
        this.updateDisplay();
        this.updateGameStatus(`🎯 Great! Score: ${this.gameState.score} | Streak: ${this.gameState.streak}`);
    }
    

    
    showStreakEffect() {
        const effect = document.createElement('div');
        effect.className = 'streak-effect';
        effect.textContent = `${this.gameState.streak} STREAK! 🔥`;
        
        this.elements.gameArea.appendChild(effect);
        
        setTimeout(() => {
            if (effect.parentNode) {
                effect.parentNode.removeChild(effect);
            }
        }, 1000);
    }
    
    gameOver() {
        this.gameState.isPlaying = false;
        
        clearInterval(this.gameState.gameLoop);
        clearInterval(this.gameState.wordSpawnTimer);
        clearTimeout(this.gameState.iceModePauseTimer);
        
        this.elements.startBtn.disabled = false;
        this.elements.pauseBtn.disabled = true;
        this.elements.wordInput.disabled = true;
        
        // Check for high score
        const isNewHighScore = this.gameState.score > this.gameState.highScore;
        if (isNewHighScore) {
            this.gameState.highScore = this.gameState.score;
            localStorage.setItem('typingGameHighScore', this.gameState.highScore);
            this.elements.newHighScore.classList.remove('hidden');
        } else {
            this.elements.newHighScore.classList.add('hidden');
        }
        
        this.elements.finalScore.textContent = this.gameState.score;
        this.elements.gameOverModal.style.display = 'flex';
        
        this.updateDisplay();
        this.updateGameStatus('💥 Game Over! A word reached the bottom!');
    }
    
    clearFallingWords() {
        this.gameState.fallingWords = [];
        this.elements.fallingWordsContainer.innerHTML = '';
    }
    
    updateDisplay() {
        this.elements.currentScore.textContent = this.gameState.score;
        this.elements.highScore.textContent = this.gameState.highScore;
        this.elements.streak.textContent = this.gameState.streak;
    }
    
    updateGameStatus(message) {
        this.elements.gameStatus.innerHTML = `<p>${message}</p>`;
    }
}

// Initialize the game when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new TypingGame();
});

// Add touch support for mobile devices
if ('ontouchstart' in window) {
    document.addEventListener('touchstart', (e) => {
        const wordInput = document.getElementById('word-input');
        if (e.target !== wordInput) {
            wordInput.focus();
        }
    });
}

// Prevent zoom on double tap for mobile
document.addEventListener('touchend', (e) => {
    const now = new Date().getTime();
    const timeSince = now - (window.lastTouchEnd || 0);
    
    if (timeSince < 300 && timeSince > 0) {
        e.preventDefault();
    }
    
    window.lastTouchEnd = now;
}, false);