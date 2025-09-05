// Index page specific functionality

let validWordsWithFrequency = [];

// Load valid words data from CSV with frequencies
async function loadWords() {
    try {
        const csvText = await DataLoader.loadText('data/valid_words_frequencies.csv');
        validWordsWithFrequency = parseCsvToWordsFrequencies(csvText);
        console.log(`Loaded ${validWordsWithFrequency.length} words with frequencies`);
    } catch (error) {
        console.error('Failed to load valid words with frequencies:', error);
        // Fallback to JSON if CSV fails
        try {
            const words = await DataLoader.loadJSON('data/valid_words.json');
            validWordsWithFrequency = words.map(word => ({ word, frequency: 0 }));
            console.log(`Fallback: Loaded ${validWordsWithFrequency.length} words without frequencies`);
        } catch (fallbackError) {
            console.error('Failed to load fallback word list:', fallbackError);
        }
    }
}

// Parse CSV text into array of {word, frequency} objects
function parseCsvToWordsFrequencies(csvText) {
    const lines = csvText.trim().split('\n');
    const wordsWithFreq = [];
    
    for (const line of lines) {
        const [word, frequencyStr] = line.split(',');
        if (word && frequencyStr) {
            const frequency = parseFloat(frequencyStr);
            wordsWithFreq.push({ 
                word: word.toLowerCase().trim(), 
                frequency: frequency || 0 
            });
        }
    }
    
    // Sort by frequency (highest first)
    return wordsWithFreq.sort((a, b) => b.frequency - a.frequency);
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

    const results = validWordsWithFrequency.filter(wordObj => {
        const word = wordObj.word;
        
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
    // Try to get from hidden input first (mobile-friendly)
    const input = document.getElementById(`yellowInput${index}`);
    if (input && input.value) {
        return input.value.toLowerCase().replace(/[^a-z]/g, '');
    }
    
    // Fallback to dataset for desktop
    const tile = document.getElementById(`yellow${index}`);
    return tile.dataset.chars || '';
}

// Update yellow tile display
function updateYellowTileDisplay(index) {
    const tile = document.getElementById(`yellow${index}`);
    const input = document.getElementById(`yellowInput${index}`);
    const chars = tile.dataset.chars || '';
    const cursorPos = parseInt(tile.dataset.cursorPos || '0');
    const isMobile = isMobileDevice();
    
    // Clear the tile
    tile.innerHTML = '';
    
    // Create grid structure with cursor support
    // On mobile, show cursor if hidden input is focused; on desktop, show if tile is focused
    const showCursor = isMobile ? (input && document.activeElement === input) : (document.activeElement === tile);
    
    // Fill grid positions (4 positions total in 2x2 grid)
    for (let i = 0; i < 4; i++) {
        const cellDiv = document.createElement('div');
        
        if (i < chars.length) {
            // Position has a character
            cellDiv.className = 'yellow-char';
            
            // If cursor is right before this character, show cursor then character
            if (showCursor && i === cursorPos) {
                cellDiv.innerHTML = `<span class="inline-cursor">|</span>${chars[i].toUpperCase()}`;
            } else {
                cellDiv.textContent = chars[i].toUpperCase();
            }
        } else if (showCursor && i === cursorPos) {
            // Empty position with cursor (cursor at end)
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
        resultsContainer.innerHTML = '<div class="no-results">No matching words found.</div>';
    } else {
        // Calculate frequency statistics for visualization
        const maxFreq = Math.max(...results.map(w => w.frequency));
        const minFreq = Math.min(...results.map(w => w.frequency));
        const avgFreq = results.reduce((sum, w) => sum + w.frequency, 0) / results.length;
        
        // Create frequency distribution data
        const distribution = createFrequencyDistribution(results, maxFreq, minFreq);
        
        // Add results header with frequency stats and mini chart
        const resultsHeader = `<div class="results-header">
            <div class="results-info">
                <span class="results-count">${results.length} word${results.length !== 1 ? 's' : ''} found</span>
                <span class="results-sort">• sorted by frequency</span>
            </div>
            <div class="frequency-stats">
                <div class="frequency-legend">
                    <span class="legend-item"><span class="legend-color high"></span>High (${distribution.high})</span>
                    <span class="legend-item"><span class="legend-color medium"></span>Medium (${distribution.medium})</span>
                    <span class="legend-item"><span class="legend-color low"></span>Low (${distribution.low})</span>
                </div>
                <div class="frequency-distribution">
                    ${createDistributionBars(distribution, results.length)}
                </div>
            </div>
        </div>`;
        
        // Results are already sorted by frequency (highest first) from the filter
        const resultsHtml = results
            .map((wordObj, index) => {
                const frequencyPercent = maxFreq > 0 ? (wordObj.frequency / maxFreq) * 100 : 0;
                const frequencyTier = getFrequencyTier(wordObj.frequency, maxFreq, minFreq);
                const rank = index + 1;
                
                const rankDisplay = rank <= 10 ? `<span class="rank">#${rank}</span>` : '';
                const frequencyDisplay = wordObj.frequency > 0 
                    ? `<span class="frequency">${wordObj.frequency.toFixed(1)}</span>`
                    : '';
                    
                const relativeFreqText = getRelativeFrequencyText(wordObj.frequency, avgFreq);
                const tooltip = `Frequency: ${wordObj.frequency.toFixed(1)} (${relativeFreqText})`;
                
                return `<div class="word ${frequencyTier}" title="${tooltip}">
                    <div class="word-content">
                        ${rankDisplay}
                        <span class="word-text">${wordObj.word.toUpperCase()}</span>
                        ${frequencyDisplay}
                    </div>
                    <div class="frequency-bar" style="width: ${frequencyPercent}%"></div>
                </div>`;
            })
            .join('');
            
        resultsContainer.innerHTML = resultsHeader + '<div class="results-grid">' + resultsHtml + '</div>';
    }
}

// Determine frequency tier for color coding
function getFrequencyTier(frequency, maxFreq, minFreq) {
    const range = maxFreq - minFreq;
    const highThreshold = minFreq + (range * 0.7);
    const mediumThreshold = minFreq + (range * 0.3);
    
    if (frequency >= highThreshold) return 'high-freq';
    if (frequency >= mediumThreshold) return 'medium-freq';
    return 'low-freq';
}

// Get relative frequency description
function getRelativeFrequencyText(frequency, avgFreq) {
    const ratio = frequency / avgFreq;
    if (ratio > 2) return 'much more common than average';
    if (ratio > 1.5) return 'more common than average';
    if (ratio > 0.7) return 'about average';
    if (ratio > 0.3) return 'less common than average';
    return 'much less common than average';
}

// Create frequency distribution data
function createFrequencyDistribution(results, maxFreq, minFreq) {
    const range = maxFreq - minFreq;
    const highThreshold = minFreq + (range * 0.7);
    const mediumThreshold = minFreq + (range * 0.3);
    
    let high = 0, medium = 0, low = 0;
    
    results.forEach(wordObj => {
        if (wordObj.frequency >= highThreshold) high++;
        else if (wordObj.frequency >= mediumThreshold) medium++;
        else low++;
    });
    
    return { high, medium, low };
}

// Create mini distribution bar chart
function createDistributionBars(distribution, total) {
    const highPercent = (distribution.high / total) * 100;
    const mediumPercent = (distribution.medium / total) * 100;
    const lowPercent = (distribution.low / total) * 100;
    
    return `
        <div class="distribution-bar high" style="width: ${highPercent}%" title="${distribution.high} high-frequency words (${highPercent.toFixed(1)}%)"></div>
        <div class="distribution-bar medium" style="width: ${mediumPercent}%" title="${distribution.medium} medium-frequency words (${mediumPercent.toFixed(1)}%)"></div>
        <div class="distribution-bar low" style="width: ${lowPercent}%" title="${distribution.low} low-frequency words (${lowPercent.toFixed(1)}%)"></div>
    `;
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

// Utility function to detect mobile devices
function isMobileDevice() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || 
           ('ontouchstart' in window) || 
           (window.innerWidth <= 768 && window.innerHeight <= 1024);
}

// Handle yellow tile input and display
function setupYellowTileHandlers() {
    const isMobile = isMobileDevice();
    
    for (let i = 0; i < 5; i++) {
        const tile = document.getElementById(`yellow${i}`);
        const input = document.getElementById(`yellowInput${i}`);
        
        // Set up initial state
        tile.dataset.chars = '';
        tile.dataset.cursorPos = '0';
        
        // Mobile input handler
        if (input) {
            input.addEventListener('input', (event) => {
                const value = event.target.value.toLowerCase().replace(/[^a-z]/g, '').slice(0, 4);
                event.target.value = value;
                
                // Sync with visual tile
                tile.dataset.chars = value;
                tile.dataset.cursorPos = value.length.toString();
                updateYellowTileDisplay(i);
            });
            
            input.addEventListener('focus', () => {
                // Focus the visual tile too for consistent styling
                if (!isMobile) {
                    tile.focus();
                }
                updateYellowTileDisplay(i);
            });
            
            input.addEventListener('blur', () => {
                updateYellowTileDisplay(i);
            });
        }
        
        // Mobile-first touch handling
        if (isMobile && input) {
            // For mobile: prioritize hidden input
            tile.addEventListener('touchstart', (event) => {
                event.preventDefault();
                input.focus();
            }, { passive: false });
            
            tile.addEventListener('click', (event) => {
                event.preventDefault();
                input.focus();
            });
        } else {
            // Desktop click handling with advanced cursor positioning
            tile.addEventListener('click', (event) => {
                const rect = tile.getBoundingClientRect();
                const x = event.clientX - rect.left;
                const y = event.clientY - rect.top;
                
                const col = x < rect.width / 2 ? 0 : 1;
                const row = y < rect.height / 2 ? 0 : 1;
                const gridPos = row * 2 + col;
                
                const currentChars = tile.dataset.chars || '';
                tile.dataset.cursorPos = Math.min(gridPos, currentChars.length).toString();
                updateYellowTileDisplay(i);
            });
        }
        
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
                // Move cursor left or to previous tile
                if (cursorPos > 0) {
                    tile.dataset.cursorPos = Math.max(0, cursorPos - 1).toString();
                    updateYellowTileDisplay(i);
                } else if (i > 0) {
                    // Move to previous yellow tile
                    const prevTile = document.getElementById(`yellow${i - 1}`);
                    const prevChars = prevTile.dataset.chars || '';
                    prevTile.dataset.cursorPos = prevChars.length.toString();
                    prevTile.focus();
                }
            } else if (event.key === 'ArrowRight') {
                // Move cursor right or to next tile
                if (cursorPos < currentChars.length) {
                    tile.dataset.cursorPos = Math.min(currentChars.length, cursorPos + 1).toString();
                    updateYellowTileDisplay(i);
                } else if (i < 4) {
                    // Move to next yellow tile
                    const nextTile = document.getElementById(`yellow${i + 1}`);
                    nextTile.dataset.cursorPos = '0';
                    nextTile.focus();
                }
            } else if (event.key === 'Home') {
                // Move cursor to start
                tile.dataset.cursorPos = '0';
                updateYellowTileDisplay(i);
            } else if (event.key === 'End') {
                // Move cursor to end
                tile.dataset.cursorPos = currentChars.length.toString();
                updateYellowTileDisplay(i);
            } else if (event.key === 'Tab') {
                // Handle Tab navigation between tiles
                if (event.shiftKey) {
                    // Shift+Tab - go to previous tile
                    if (i > 0) {
                        const prevTile = document.getElementById(`yellow${i - 1}`);
                        const prevChars = prevTile.dataset.chars || '';
                        prevTile.dataset.cursorPos = prevChars.length.toString();
                        prevTile.focus();
                    } else {
                        // Allow default tab behavior to move to previous focusable element
                        event.preventDefault = false;
                        return;
                    }
                } else {
                    // Tab - go to next tile
                    if (i < 4) {
                        const nextTile = document.getElementById(`yellow${i + 1}`);
                        nextTile.dataset.cursorPos = '0';
                        nextTile.focus();
                    } else {
                        // Allow default tab behavior to move to next focusable element
                        event.preventDefault = false;
                        return;
                    }
                }
            } else if (event.key.length === 1 && event.key.match(/[a-zA-Z]/)) {
                // Insert character at cursor position
                if (currentChars.length < 4) {
                    const newChars = currentChars.slice(0, cursorPos) + event.key.toLowerCase() + currentChars.slice(cursorPos);
                    tile.dataset.chars = newChars;
                    tile.dataset.cursorPos = (cursorPos + 1).toString();
                    // Sync with hidden input
                    if (input) {
                        input.value = newChars;
                    }
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
