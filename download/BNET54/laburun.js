/* ========================================
   Labu Run - Signal Prediction Script
   ======================================== */

// Game mode multiplier ranges
// Each difficulty has realistic crash coefficient ranges
// Higher difficulty = riskier multipliers (bigger potential but lower probability)
const GAME_MODES = {
    easy: {
        multipliers: [1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.8, 2.0, 2.3, 2.5, 3.0, 3.5, 4.0, 5.0],
        weights:     [60,   55,  50,  45,  40,  35,  25,  20,  15,  12,   8,   5,   3,   1]
    },
    medium: {
        multipliers: [1.2, 1.5, 1.7, 2.0, 2.5, 3.0, 4.0, 5.5, 7.0, 9.0, 12.0],
        weights:     [50,   45,  40,  30,  22,  15,  10,   6,   3,   2,    1]
    },
    hard: {
        multipliers: [1.5, 2.0, 3.0, 5.0, 8.0, 12.0, 20.0, 35.0],
        weights:     [40,  30,  20,  12,   6,    3,    1,   0.5]
    },
    hardcore: {
        multipliers: [2.0, 3.0, 5.0, 10.0, 20.0, 50.0, 100.0],
        weights:     [35,  22,  10,    4,    1.5,  0.4,   0.1]
    }
};

let currentGameMode = 'easy';
let gameInProgress = false;
let gameFinished = false;

// DOM Elements
const labu = document.getElementById('labu');
const labuImg = document.getElementById('labu-img');
const getSignalBtn = document.getElementById('getSignalBtn');
const backBtn = document.getElementById('backBtn');
const modeButtons = document.querySelectorAll('.mode-btn');
const coefficientDisplay = document.getElementById('coefficientDisplay');
const coefficientText = document.getElementById('coefficientText');

// ========================================
// Mode Selection
// ========================================
modeButtons.forEach(button => {
    button.addEventListener('click', () => {
        if (gameInProgress) return;

        // Remove active class from all buttons
        modeButtons.forEach(btn => btn.classList.remove('active'));

        // Add active class to clicked button
        button.classList.add('active');

        // Set new mode
        currentGameMode = button.dataset.mode;

        // Reset if game was finished
        if (gameFinished) {
            cleanupGame();
            gameFinished = false;
        }
    });
});

// ========================================
// Back Button
// ========================================
backBtn.addEventListener('click', () => {
    window.location.href = 'index.html';
});

// ========================================
// Predict Button
// ========================================
getSignalBtn.addEventListener('click', async () => {
    if (gameInProgress) return;

    gameInProgress = true;
    getSignalBtn.disabled = true;

    // Disable mode buttons during prediction
    modeButtons.forEach(btn => btn.disabled = true);

    try {
        cleanupGame();
        gameFinished = false;

        await playPredictionSequence();
    } catch (error) {
        console.error('Prediction error:', error);
        cleanupGame();
    } finally {
        gameInProgress = false;
        getSignalBtn.disabled = false;
        modeButtons.forEach(btn => btn.disabled = false);
        gameFinished = true;
    }
});

// ========================================
// Game Cleanup
// ========================================
function cleanupGame() {
    // Hide coefficient display
    coefficientDisplay.classList.remove('visible', 'easy', 'medium', 'hard', 'hardcore');

    // Reset rabbit
    labu.classList.remove('jumping', 'landed');
    labuImg.src = 'assets/laburun/labu_standing.png';

    // Re-add idle animation
    labu.classList.add('idle');
}

// ========================================
// Main Prediction Sequence
// ========================================
async function playPredictionSequence() {
    // 1. Rabbit prepares (stops idle, shows excitement)
    labu.classList.remove('idle');
    labuImg.src = 'assets/laburun/labu_excited.png';

    await wait(400);

    // 2. Rabbit jumps
    labu.classList.add('jumping');
    await wait(1200);
    labu.classList.remove('jumping');

    // 3. Rabbit lands with bounce
    labu.classList.add('landed');
    labuImg.src = 'assets/laburun/labu_standing.png';

    await wait(300);

    // 4. Calculate and display coefficient
    const multiplier = getWeightedMultiplier(currentGameMode);

    // Show coefficient above rabbit's head
    coefficientText.textContent = multiplier + 'x';
    coefficientDisplay.classList.add('visible', currentGameMode);

    // Re-add idle after landing settles
    await wait(500);
    labu.classList.remove('landed');
    labu.classList.add('idle');
}

// ========================================
// Weighted Random Multiplier
// ========================================
function getWeightedMultiplier(mode) {
    const modeData = GAME_MODES[mode];
    const multipliers = modeData.multipliers;
    const weights = modeData.weights;

    // Calculate total weight
    const totalWeight = weights.reduce(function (a, b) { return a + b; }, 0);

    // Generate random number within weight range
    var random = Math.random() * totalWeight;

    // Select multiplier based on weights
    for (var i = 0; i < multipliers.length; i++) {
        if (random < weights[i]) {
            return multipliers[i];
        }
        random -= weights[i];
    }

    // Fallback (should never reach here)
    return multipliers[0];
}

// ========================================
// Utility
// ========================================
function wait(ms) {
    return new Promise(function (resolve) { setTimeout(resolve, ms); });
}

// ========================================
// Anti-zoom
// ========================================
(function () {
    var pz = function (e) { if (e.touches && e.touches.length > 1) e.preventDefault(); };
    document.addEventListener('touchstart', pz, { passive: false });
    document.addEventListener('touchmove', pz, { passive: false });
    var lockVp = function () {
        var vp = document.querySelector('meta[name="viewport"]');
        if (vp) vp.setAttribute('content', 'width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no,viewport-fit=cover');
    };
    window.addEventListener('resize', lockVp);
    setTimeout(lockVp, 500);
})();

// ========================================
// Initialize
// ========================================
document.addEventListener('DOMContentLoaded', function () {
    // Start idle animation
    labu.classList.add('idle');
});
