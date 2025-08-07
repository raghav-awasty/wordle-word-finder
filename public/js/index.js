// Index page specific functionality

let validWords = [];

// Load valid words data
async function loadWords() {
    try {
        validWords = await DataLoader.loadJSON('data/valid_words.json');
    } catch (error) {
        console.error('Failed to load valid words:', error);
    }
}

// Main search function
function searchWords() {
    const grayLetters = document.getElementById('grayInput').value.toLowerCase();
    const graySet = new Set(grayLetters);

    // Read green-tile characters by position
    const greenPositions = [];
    for (let i = 0; i < 5; i++) {
        const char = document.getElementById(`pos${i}`).value.toLowerCase();
        greenPositions[i] = (char >= 'a' && char <= 'z') ? char : null;
    }

    // Read yellow-tile characters by position (characters that should NOT be in these positions)
    const yellowPositions = [];
    const allYellowChars = new Set();
    for (let i = 0; i < 5; i++) {
        const chars = getYellowTileChars(i);
        yellowPositions[i] = new Set(chars);
        // Add all yellow characters to the overall set
        for (let char of chars) {
            allYellowChars.add(char);
        }
    }

    const results = validWords.filter(word => {
        // Check green-tile matches (fixed positions)
        for (let i = 0; i < 5; i++) {
            if (greenPositions[i] && word[i] !== greenPositions[i]) {
                return false;
            }
        }

        // Check yellow position constraints (characters that should NOT be in specific positions)
        for (let i = 0; i < 5; i++) {
            if (yellowPositions[i].has(word[i])) {
                return false; // Character is in a position where it shouldn't be
            }
        }

        // Check that all yellow position characters are actually in the word somewhere
        for (let ch of allYellowChars) {
            if (!word.includes(ch)) {
                return false;
            }
        }

        // Check grey characters with special logic for characters that also appear in green/yellow
        const greenSet = new Set(greenPositions.filter(char => char !== null));
        const greenYellowSet = new Set([...greenSet, ...allYellowChars]);
        
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

// Get characters from yellow tile
function getYellowTileChars(index) {
    const tile = document.getElementById(`yellow${index}`);
    return tile.dataset.chars || '';
}

// Update yellow tile display
function updateYellowTileDisplay(index) {
    const tile = document.getElementById(`yellow${index}`);
    const chars = tile.dataset.chars || '';
    
    // Clear the tile
    tile.innerHTML = '';
    
    // Add characters as grid items (max 4)
    const maxChars = Math.min(chars.length, 4);
    for (let i = 0; i < maxChars; i++) {
        const charDiv = document.createElement('div');
        charDiv.className = 'yellow-char';
        charDiv.textContent = chars[i].toUpperCase();
        tile.appendChild(charDiv);
    }
    
    // Add a cursor indicator if focused
    if (document.activeElement === tile && chars.length < 4) {
        const cursorDiv = document.createElement('div');
        cursorDiv.className = 'yellow-cursor';
        cursorDiv.textContent = '|';
        tile.appendChild(cursorDiv);
    }
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
    // Handle green tiles (input elements)
    document.querySelectorAll('#tileRow .tile').forEach((tile, index, tiles) => {
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

// Handle yellow tile input and display
function setupYellowTileHandlers() {
    for (let i = 0; i < 5; i++) {
        const tile = document.getElementById(`yellow${i}`);
        
        // Set up initial state
        tile.dataset.chars = '';
        
        tile.addEventListener('beforeinput', (event) => {
            // Prevent default behavior and handle input manually
            event.preventDefault();
            
            const currentChars = tile.dataset.chars || '';
            
            if (event.inputType === 'insertText' || event.inputType === 'insertCompositionText') {
                const newChar = event.data;
                if (newChar && newChar.match(/[a-zA-Z]/) && currentChars.length < 4) {
                    // Add new character
                    tile.dataset.chars = currentChars + newChar.toLowerCase();
                    updateYellowTileDisplay(i);
                }
            } else if (event.inputType === 'deleteContentBackward') {
                // Remove last character
                if (currentChars.length > 0) {
                    tile.dataset.chars = currentChars.slice(0, -1);
                    updateYellowTileDisplay(i);
                }
            } else if (event.inputType === 'deleteContentForward') {
                // Clear all content
                tile.dataset.chars = '';
                updateYellowTileDisplay(i);
            }
        });
        
        tile.addEventListener('keydown', (event) => {
            const currentChars = tile.dataset.chars || '';
            
            if (event.key === 'Backspace') {
                event.preventDefault();
                if (currentChars.length > 0) {
                    tile.dataset.chars = currentChars.slice(0, -1);
                    updateYellowTileDisplay(i);
                }
            } else if (event.key === 'Delete') {
                event.preventDefault();
                tile.dataset.chars = '';
                updateYellowTileDisplay(i);
            } else if (event.key.length === 1 && event.key.match(/[a-zA-Z]/)) {
                event.preventDefault();
                if (currentChars.length < 4) {
                    tile.dataset.chars = currentChars + event.key.toLowerCase();
                    updateYellowTileDisplay(i);
                }
            }
        });
        
        tile.addEventListener('paste', (event) => {
            event.preventDefault();
            const paste = (event.clipboardData || window.clipboardData).getData('text');
            const cleanPaste = paste.toLowerCase().replace(/[^a-z]/g, '').slice(0, 4);
            
            tile.dataset.chars = cleanPaste;
            updateYellowTileDisplay(i);
        });
        
        // Handle focus to position cursor properly
        tile.addEventListener('focus', () => {
            // Update display to show cursor
            updateYellowTileDisplay(i);
            
            // Clear any existing selection and position cursor at end
            setTimeout(() => {
                const range = document.createRange();
                const sel = window.getSelection();
                range.selectNodeContents(tile);
                range.collapse(false); // Collapse to end
                sel.removeAllRanges();
                sel.addRange(range);
            }, 0);
        });
        
        // Handle blur to hide cursor
        tile.addEventListener('blur', () => {
            // Update display to hide cursor
            updateYellowTileDisplay(i);
        });
        
        // Initialize display
        updateYellowTileDisplay(i);
    }
}

// Initialize the page
function initializeIndexPage() {
    loadWords();
    setupTileHandlers();
    setupYellowTileHandlers();
    addEnterKeyHandler(searchWords);
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', initializeIndexPage);
