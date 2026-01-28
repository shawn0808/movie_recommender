// Game state
let targetNumber;
let attempts = 0;
let gameWon = false;

// DOM elements
const guessInput = document.getElementById('guessInput');
const submitBtn = document.getElementById('submitBtn');
const resetBtn = document.getElementById('resetBtn');
const feedback = document.getElementById('feedback');
const attemptsDisplay = document.getElementById('attempts');

// Initialize game on page load
function initGame() {
    targetNumber = Math.floor(Math.random() * 100) + 1;
    attempts = 0;
    gameWon = false;
    
    // Reset UI
    guessInput.value = '';
    guessInput.disabled = false;
    submitBtn.disabled = false;
    feedback.textContent = '';
    feedback.className = 'feedback default';
    attemptsDisplay.textContent = 'Attempts: 0';
    
    // Focus on input
    guessInput.focus();
    
    console.log('Target number:', targetNumber); // For debugging (remove in production)
}

// Validate input
function validateInput(value) {
    const num = parseInt(value);
    
    if (isNaN(num)) {
        return { valid: false, message: 'Please enter a valid number.' };
    }
    
    if (num < 1 || num > 100) {
        return { valid: false, message: 'Please enter a number between 1 and 100.' };
    }
    
    return { valid: true, value: num };
}

// Handle guess submission
function handleGuess() {
    if (gameWon) {
        return;
    }
    
    const validation = validateInput(guessInput.value);
    
    if (!validation.valid) {
        feedback.textContent = validation.message;
        feedback.className = 'feedback error';
        return;
    }
    
    const guess = validation.value;
    attempts++;
    attemptsDisplay.textContent = `Attempts: ${attempts}`;
    
    // Compare guess to target
    if (guess === targetNumber) {
        gameWon = true;
        feedback.textContent = `🎉 Correct! You guessed it in ${attempts} ${attempts === 1 ? 'attempt' : 'attempts'}!`;
        feedback.className = 'feedback correct';
        guessInput.disabled = true;
        submitBtn.disabled = true;
    } else if (guess > targetNumber) {
        feedback.textContent = 'Too high! Try again.';
        feedback.className = 'feedback too-high';
    } else {
        feedback.textContent = 'Too low! Try again.';
        feedback.className = 'feedback too-low';
    }
    
    // Clear input and focus
    guessInput.value = '';
    guessInput.focus();
}

// Event listeners
submitBtn.addEventListener('click', handleGuess);

guessInput.addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
        handleGuess();
    }
});

resetBtn.addEventListener('click', initGame);

// Initialize game when page loads
initGame();
