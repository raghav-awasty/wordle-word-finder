// Index page specific functionality

let validWords = [];

// Load valid words data
async function loadWords() {
    try {
        validWords = await DataLoader.loadJSON('../../data/valid_words.json');
    } catch (error) {
        console.error('Failed to load valid words:', error);
    }
}

// Main search function
function searchWords() {
    const yellowInput = document.getElementById('yellowInput').value.toLowerCase().replace(/[^a-z]/g, '');
    const grayLetters = document.getElementById('grayInput').value.toLowerCase();

    const yellowSet = new Set(yellowInput);
    const graySet = new Set(grayLetters);

    // Read green-tile characters by position
    const greenPositions = [];
    for (let i = 0; i < 5; i++) {
        const char = document.getElementById(`pos${i}`).value.toLowerCase();
        greenPositions[i] = (char >= 'a' && char <= 'z') ? char : null;
    }

    const results = validWords.filter(word => {
        // Check green-tile matches (fixed positions)
        for (let i = 0; i < 5; i++) {
            if (greenPositions[i] && word[i] !== greenPositions[i]) {
                return false;
            }
        }

        // Check that all yellow characters are in the word (any position)
        for (let ch of yellowSet) {
            if (!word.includes(ch)) {
                return false;
            }
        }

        // Check grey characters with special logic for characters that also appear in green/yellow
        const greenSet = new Set(greenPositions.filter(char => char !== null));
        const greenYellowSet = new Set([...greenSet, ...yellowSet]);
        
        for (let ch of graySet) {
            if (greenYellowSet.has(ch)) {
                // If character appears in both green/yellow and grey, check occurrence count
                const occurrences = (word.match(new RegExp(ch, 'g')) || []).length;
                if (occurrences > 1) {
                    return false; // Remove words with more than one occurrence
                }
            } else {
                // If character only appears in grey, exclude words containing it
                if (word.includes(ch)) {
                    return false;
                }
            }
        }

        return true;
    });

    displayResults(results);
}

// Display search results
function displayResults(results) {
    const resultsContainer = document.getElementById('results');
    if (results.length === 0) {
        resultsContainer.innerText = 'No matching words found.';
    } else {
        resultsContainer.innerHTML = results.map(word => `<span class="word">${word}</span>`).join('');
    }
}

// Handle tile navigation and input
function setupTileHandlers() {
    document.querySelectorAll('.tile').forEach((tile, index, tiles) => {
        tile.addEventListener('input', () => {
            if (tile.value && index < tiles.length - 1) {
                tiles[index + 1].focus();
            }
        });

        tile.addEventListener('keydown', (event) => {
            switch(event.key) {
                case 'Backspace':
                    if (!tile.value && index > 0) {
                        tiles[index - 1].focus();
                    }
                    break;
                case 'ArrowLeft':
                    if (index > 0) {
                        tiles[index - 1].focus();
                        event.preventDefault();
                    }
                    break;
                case 'ArrowRight':
                    if (index < tiles.length - 1) {
                        tiles[index + 1].focus();
                        event.preventDefault();
                    }
                    break;
            }
        });
    });
}

// Initialize the page
function initializeIndexPage() {
    loadWords();
    setupTileHandlers();
    addEnterKeyHandler(searchWords);
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', initializeIndexPage);
