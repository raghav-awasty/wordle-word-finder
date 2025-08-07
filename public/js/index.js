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
    const cursorPos = parseInt(tile.dataset.cursorPos || '0');
    
    // Clear the tile
    tile.innerHTML = '';
    
    // Create grid structure with cursor support
    const showCursor = document.activeElement === tile;
    
    // Fill grid positions (4 positions total in 2x2 grid)
    for (let i = 0; i < 4; i++) {
        const cellDiv = document.createElement('div');
        
        if (i < chars.length) {
            // Position has a character
            cellDiv.className = 'yellow-char';
            
            // If cursor is at this position, show character with cursor
            if (showCursor && i === cursorPos) {
                cellDiv.innerHTML = `${chars[i].toUpperCase()}<span class="inline-cursor">|</span>`;
            } else {
                cellDiv.textContent = chars[i].toUpperCase();
            }
        } else if (showCursor && i === cursorPos) {
            // Empty position with cursor
            cellDiv.className = 'yellow-cursor';
            cellDiv.textContent = '|';
        } else {
            // Empty position (no cursor)
            cellDiv.className = 'yellow-char empty';
        }
        
        tile.appendChild(cellDiv);
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
        tile.dataset.cursorPos = '0';
        
        tile.addEventListener('keydown', (event) => {
            const currentChars = tile.dataset.chars || '';
            const cursorPos = parseInt(tile.dataset.cursorPos || '0');
            
            event.preventDefault(); // Prevent all default behavior
            
            if (event.key === 'Backspace') {
                if (cursorPos > 0) {
                    // Delete character before cursor
                    const newChars = currentChars.slice(0, cursorPos - 1) + currentChars.slice(cursorPos);
                    tile.dataset.chars = newChars;
                    tile.dataset.cursorPos = Math.max(0, cursorPos - 1).toString();
                    updateYellowTileDisplay(i);
                }
            } else if (event.key === 'Delete') {
                if (cursorPos < currentChars.length) {
                    // Delete character at cursor
                    const newChars = currentChars.slice(0, cursorPos) + currentChars.slice(cursorPos + 1);
                    tile.dataset.chars = newChars;
                    updateYellowTileDisplay(i);
                }
            } else if (event.key === 'ArrowLeft') {
                // Move cursor left
                tile.dataset.cursorPos = Math.max(0, cursorPos - 1).toString();
                updateYellowTileDisplay(i);
            } else if (event.key === 'ArrowRight') {
                // Move cursor right
                tile.dataset.cursorPos = Math.min(currentChars.length, cursorPos + 1).toString();
                updateYellowTileDisplay(i);
            } else if (event.key === 'Home') {
                // Move cursor to start
                tile.dataset.cursorPos = '0';
                updateYellowTileDisplay(i);
            } else if (event.key === 'End') {
                // Move cursor to end
                tile.dataset.cursorPos = currentChars.length.toString();
                updateYellowTileDisplay(i);
            } else if (event.key.length === 1 && event.key.match(/[a-zA-Z]/)) {
                // Insert character at cursor position
                if (currentChars.length < 4) {
                    const newChars = currentChars.slice(0, cursorPos) + event.key.toLowerCase() + currentChars.slice(cursorPos);
                    tile.dataset.chars = newChars;
                    tile.dataset.cursorPos = (cursorPos + 1).toString();
                    updateYellowTileDisplay(i);
                }
            }
        });
        
        tile.addEventListener('paste', (event) => {
            event.preventDefault();
            const currentChars = tile.dataset.chars || '';
            const cursorPos = parseInt(tile.dataset.cursorPos || '0');
            
            const paste = (event.clipboardData || window.clipboardData).getData('text');
            const cleanPaste = paste.toLowerCase().replace(/[^a-z]/g, '');
            
            // Insert pasted text at cursor, respecting 4-character limit
            const beforeCursor = currentChars.slice(0, cursorPos);
            const afterCursor = currentChars.slice(cursorPos);
            const newChars = (beforeCursor + cleanPaste + afterCursor).slice(0, 4);
            
            tile.dataset.chars = newChars;
            tile.dataset.cursorPos = Math.min(cursorPos + cleanPaste.length, newChars.length).toString();
            updateYellowTileDisplay(i);
        });
        
        // Handle focus
        tile.addEventListener('focus', () => {
            // Set cursor to end if not already set
            const currentChars = tile.dataset.chars || '';
            if (!tile.dataset.cursorPos) {
                tile.dataset.cursorPos = currentChars.length.toString();
            }
            updateYellowTileDisplay(i);
        });
        
        // Handle blur
        tile.addEventListener('blur', () => {
            updateYellowTileDisplay(i);
        });
        
        // Handle mouse clicks on character positions
        tile.addEventListener('click', (event) => {
            // Calculate which grid position was clicked
            const rect = tile.getBoundingClientRect();
            const x = event.clientX - rect.left;
            const y = event.clientY - rect.top;
            
            // Simple grid position calculation (2x2 grid)
            const col = x < rect.width / 2 ? 0 : 1;
            const row = y < rect.height / 2 ? 0 : 1;
            const gridPos = row * 2 + col;
            
            const currentChars = tile.dataset.chars || '';
            tile.dataset.cursorPos = Math.min(gridPos, currentChars.length).toString();
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
