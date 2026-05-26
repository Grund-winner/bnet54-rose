const GAME_MODES = {
    easy: [1.1, 1.2, 1.3, 1.5, 1.8, 2, 2.5, 3, 4, 5.5, 7.5, 10],
    medium: [1.2, 1.5, 1.7, 2, 3, 4.5, 6, 8.5, 12],
    hard: [1.4, 2, 4, 8, 15],
    hardcore: [1.6, 2.5, 5, 10]
};
let currentGameMode = 'easy';
let gameInProgress = false;
let gameFinished = false;

// DOM Elements
const chicken = document.getElementById('chicken');
const getSignalBtn = document.getElementById('getSignalBtn');
const backBtn = document.getElementById('backBtn');
const modeButtons = document.querySelectorAll('.mode-btn');
const tunnel = document.querySelector('.tunnel');

// Mode selection
modeButtons.forEach(button => {
    button.addEventListener('click', () => {
        if (gameInProgress) return;

        modeButtons.forEach(btn => btn.classList.remove('active'));
        button.classList.add('active');
        currentGameMode = button.dataset.mode;

        if (gameFinished) {
            cleanupAllGameElements();
            gameFinished = false;
        }

        console.log(`Game mode changed to: ${currentGameMode}`);
    });
});

// Back button
backBtn.addEventListener('click', () => {
    window.history.back();
});

// Get Signal button
getSignalBtn.addEventListener('click', async () => {
    if (gameInProgress) return;

    gameInProgress = true;
    getSignalBtn.disabled = true;
    modeButtons.forEach(btn => btn.disabled = true);

    try {
        await cleanupAllGameElements();
        gameFinished = false;
        await playGameSequence();
    } catch (error) {
        console.error('Game error:', error);
        await cleanupAllGameElements();
    } finally {
        gameInProgress = false;
        getSignalBtn.disabled = false;
        modeButtons.forEach(btn => btn.disabled = false);
        gameFinished = true;
    }
});

// Clean up all dynamic game elements
function cleanupAllGameElements() {
    return new Promise(resolve => {
        const fireAnimations = document.querySelectorAll('.fire-animation');
        const deadChickenContainers = document.querySelectorAll('.dead-chicken-container');

        fireAnimations.forEach(element => element.remove());
        deadChickenContainers.forEach(element => element.remove());

        chicken.style.display = 'block';
        chicken.classList.remove('jumping');

        console.log('All game elements cleaned');
        resolve();
    });
}

// Main game sequence
async function playGameSequence() {
    console.log(`Starting game in mode: ${currentGameMode}`);

    // 1. Chicken jumps
    await chickenJump();

    // 2. Fire animation with transformation
    await playFireAnimationWithTransformation();

    console.log('Game finished - result stays until next game');
}

// Chicken jump animation
function chickenJump() {
    return new Promise(resolve => {
        chicken.classList.add('jumping');

        setTimeout(() => {
            chicken.classList.remove('jumping');
            resolve();
        }, 800);
    });
}

// Weighted random multiplier
function getWeightedMultiplier(mode) {
    const multipliers = GAME_MODES[mode];

    const weights = multipliers.map(value => {
        if (value <= 2) return 50;
        if (value <= 5) return 20;
        if (value <= 10) return 8;
        return 2;
    });

    const totalWeight = weights.reduce((a, b) => a + b, 0);
    let random = Math.random() * totalWeight;

    for (let i = 0; i < multipliers.length; i++) {
        if (random < weights[i]) {
            return multipliers[i];
        }
        random -= weights[i];
    }
}

// Fire animation with chicken transformation
function playFireAnimationWithTransformation() {
    return new Promise(resolve => {
        const fireContainer = document.createElement('div');
        fireContainer.className = 'fire-animation';

        const fireImg = document.createElement('img');
        fireContainer.appendChild(fireImg);

        tunnel.appendChild(fireContainer);

        let currentFrame = 0;
        const totalFrames = 22;
        const transformFrame = Math.floor(totalFrames / 2);

        function updateFrame() {
            fireImg.src = `../assets/chickenrun/fire_${currentFrame}.webp`;
            fireImg.onerror = () => {
                console.warn(`Frame fire_${currentFrame}.webp not found`);
                fireImg.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMSIgaGVpZ2h0PSIxIiB2aWV3Qm94PSIwIDAgMSAxIiBmaWxsPSJub25lIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjwvc3ZnPg==';
            };

            if (currentFrame === transformFrame) {
                transformChickenToDead();
            }

            currentFrame++;

            if (currentFrame < totalFrames) {
                setTimeout(updateFrame, 82);
            } else {
                fireContainer.remove();
                resolve();
            }
        }

        updateFrame();
    });
}

// Transform chicken to dead
function transformChickenToDead() {
    chicken.style.display = 'none';

    const deadChickenContainer = document.createElement('div');
    deadChickenContainer.className = 'dead-chicken-container';

    const deadChickenImg = document.createElement('img');
    deadChickenImg.src = '../assets/chickenrun/deadchicken.png';
    deadChickenImg.className = 'dead-chicken-img';
    deadChickenImg.alt = 'Dead Chicken';

    deadChickenImg.onerror = () => {
        console.warn('deadchicken.png not found, using fallback');
        deadChickenImg.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjIwIiBoZWlnaHQ9IjIyMCIgdmlld0JveD0iMCAwIDIyMCAyMjAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjIyMCIgaGVpZ2h0PSIyMjAiIGZpbGw9IiNmZjAwMDAiLz48dGV4dCB4PSIxMTAiIHk9IjExNSIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjQwIiBmaWxsPSJ3aGl0ZSIgdGV4dC1hbmNob3I9Im1pZGRsZSI+WDwvdGV4dD48L3N2Zz4=';
    };

    const multiplierElement = document.createElement('div');
    multiplierElement.className = 'dead-chicken-multiplier';

    const randomMultiplier = getWeightedMultiplier(currentGameMode);
    multiplierElement.textContent = `${randomMultiplier}x`;

    console.log(`Multiplier: ${randomMultiplier}x in mode ${currentGameMode}`);

    deadChickenContainer.appendChild(deadChickenImg);
    deadChickenContainer.appendChild(multiplierElement);

    tunnel.appendChild(deadChickenContainer);
}

// Initialize
console.log('Chicken Run Signal Game loaded!');
console.log(`Current mode: ${currentGameMode}`);
console.log('Available modes:', Object.keys(GAME_MODES));

document.addEventListener('DOMContentLoaded', () => {
    cleanupAllGameElements();
});
