// Index page: Wordle-style guess grid + constraint solver.
//
// Input model
// -----------
// Constraints are captured PER GUESS rather than as one merged pile of
// green/yellow/gray letters. That distinction matters for repeated letters:
// two yellow E's in a single guess prove the answer holds at least two E's,
// whereas a yellow E in two separate guesses proves only that it holds one.
// A flat model cannot tell those apart; this one can.

const ROWS = 6;
const COLS = 5;

// Tile states, in the order clicking cycles through them.
const STATES = ['absent', 'present', 'correct'];

const MAX_RENDERED_RESULTS = 300;

let validWordsWithFrequency = [];

// guesses[row][col] = { letter: 'a'-'z' or '', state: one of STATES }
const guesses = Array.from({ length: ROWS }, () =>
    Array.from({ length: COLS }, () => ({ letter: '', state: 'absent' }))
);

// Cursor position for typing.
let cursor = { row: 0, col: 0 };

// ---------------------------------------------------------------------------
// Word list
// ---------------------------------------------------------------------------

async function loadWords() {
    try {
        const csvText = await DataLoader.loadText('data/valid_words_frequencies.csv');
        validWordsWithFrequency = parseCsvToWordsFrequencies(csvText);
        console.log(`Loaded ${validWordsWithFrequency.length} words with frequencies`);
        runSearch();
    } catch (error) {
        console.error('Failed to load valid words with frequencies:', error);
        const resultsContainer = document.getElementById('results');
        if (resultsContainer) {
            resultsContainer.innerHTML =
                '<div class="no-results">⚠️ Unable to load word database. Please refresh the page.</div>';
        }
    }
}

function parseCsvToWordsFrequencies(csvText) {
    const lines = csvText.trim().split('\n');
    const wordsWithFreq = [];

    for (const line of lines) {
        const [word, frequencyStr] = line.split(',');
        if (word && frequencyStr) {
            wordsWithFreq.push({
                word: word.toLowerCase().trim(),
                frequency: parseFloat(frequencyStr) || 0
            });
        }
    }

    return wordsWithFreq.sort((a, b) => b.frequency - a.frequency);
}

// ---------------------------------------------------------------------------
// Constraint derivation
// ---------------------------------------------------------------------------

/**
 * Turn the filled guess rows into a set of constraints.
 *
 * Per guess, for each distinct letter:
 *   - `known` = how many times it is marked green or yellow
 *   - if it is ALSO marked grey somewhere in that same guess, Wordle has told
 *     us the answer contains exactly `known` of it (the extras came back grey
 *     precisely because the supply ran out)
 *   - otherwise the answer contains at least `known`
 *
 * Across guesses, minimums take the strongest (highest) value and any exact
 * count wins outright.
 */
function deriveConstraints(rows) {
    const fixed = new Array(COLS).fill(null);
    const excluded = Array.from({ length: COLS }, () => new Set());
    const minCount = new Map();
    const exactCount = new Map();
    let hasAnyConstraint = false;

    for (const row of rows) {
        const filled = row
            .map((tile, index) => ({ ...tile, index }))
            .filter(tile => tile.letter);

        if (filled.length === 0) continue;
        hasAnyConstraint = true;

        // Count green/yellow occurrences per letter within THIS guess.
        const known = new Map();
        const greyed = new Set();

        for (const tile of filled) {
            if (tile.state === 'correct' || tile.state === 'present') {
                known.set(tile.letter, (known.get(tile.letter) || 0) + 1);
            } else {
                greyed.add(tile.letter);
            }
        }

        for (const tile of filled) {
            if (tile.state === 'correct') {
                fixed[tile.index] = tile.letter;
            } else if (tile.state === 'present') {
                // In the word, but demonstrably not here.
                excluded[tile.index].add(tile.letter);
            } else if (known.has(tile.letter)) {
                // Grey, but the letter is confirmed elsewhere in this guess.
                // Had the answer carried this letter at this position it would
                // have come back green, so the position is still ruled out.
                excluded[tile.index].add(tile.letter);
            }
        }

        for (const [letter, count] of known) {
            minCount.set(letter, Math.max(minCount.get(letter) || 0, count));
            if (greyed.has(letter)) {
                exactCount.set(letter, count);
            }
        }

        // A letter marked grey with no green/yellow twin is simply absent.
        for (const letter of greyed) {
            if (!known.has(letter)) {
                exactCount.set(letter, 0);
            }
        }
    }

    return { fixed, excluded, minCount, exactCount, hasAnyConstraint };
}

function matchesConstraints(word, constraints) {
    const { fixed, excluded, minCount, exactCount } = constraints;

    for (let i = 0; i < COLS; i++) {
        if (fixed[i] && word[i] !== fixed[i]) return false;
        if (excluded[i].has(word[i])) return false;
    }

    const counts = new Map();
    for (const char of word) {
        counts.set(char, (counts.get(char) || 0) + 1);
    }

    for (const [letter, n] of minCount) {
        if ((counts.get(letter) || 0) < n) return false;
    }

    for (const [letter, n] of exactCount) {
        if ((counts.get(letter) || 0) !== n) return false;
    }

    return true;
}

function runSearch() {
    if (validWordsWithFrequency.length === 0) return;

    const constraints = deriveConstraints(guesses);

    if (!constraints.hasAnyConstraint) {
        document.getElementById('results').innerHTML =
            '<div class="no-results">Enter a guess above to filter the word list.</div>';
        return;
    }

    displayResults(
        validWordsWithFrequency.filter(entry => matchesConstraints(entry.word, constraints))
    );
}

// ---------------------------------------------------------------------------
// Grid rendering and interaction
// ---------------------------------------------------------------------------

function buildGrid() {
    const grid = document.getElementById('guessGrid');
    grid.innerHTML = '';

    for (let row = 0; row < ROWS; row++) {
        const rowEl = createElement('div', 'guess-row');
        for (let col = 0; col < COLS; col++) {
            const tile = createElement('div', 'guess-tile');
            tile.dataset.row = row;
            tile.dataset.col = col;
            tile.setAttribute('role', 'button');
            tile.setAttribute('tabindex', '-1');
            rowEl.appendChild(tile);
        }
        grid.appendChild(rowEl);
    }

    grid.addEventListener('click', onGridClick);
    renderGrid();
}

function renderGrid() {
    document.querySelectorAll('.guess-tile').forEach(tile => {
        const row = Number(tile.dataset.row);
        const col = Number(tile.dataset.col);
        const { letter, state } = guesses[row][col];

        tile.textContent = letter.toUpperCase();

        const classes = ['guess-tile'];
        if (letter) {
            classes.push(state);
        } else {
            classes.push('empty');
        }
        if (row === cursor.row && col === cursor.col) {
            classes.push('cursor');
        }
        tile.className = classes.join(' ');

        tile.setAttribute(
            'aria-label',
            letter ? `Row ${row + 1} position ${col + 1}: ${letter.toUpperCase()}, ${state}`
                   : `Row ${row + 1} position ${col + 1}: empty`
        );
    });
}

function onGridClick(event) {
    const tile = event.target.closest('.guess-tile');
    if (!tile) return;

    const row = Number(tile.dataset.row);
    const col = Number(tile.dataset.col);
    const cell = guesses[row][col];

    if (cell.letter) {
        // Filled tile: cycle its colour.
        const next = (STATES.indexOf(cell.state) + 1) % STATES.length;
        cell.state = STATES[next];
        update();
    } else {
        // Empty tile: move the typing cursor here.
        cursor = { row, col };
        renderGrid();
    }

    focusKeyboardProxy();
}

function typeLetter(letter) {
    guesses[cursor.row][cursor.col] = { letter, state: 'absent' };
    advanceCursor();
    update();
}

function advanceCursor() {
    if (cursor.col < COLS - 1) {
        cursor.col++;
    } else if (cursor.row < ROWS - 1) {
        cursor = { row: cursor.row + 1, col: 0 };
    }
}

function retreatCursor() {
    if (cursor.col > 0) {
        cursor.col--;
    } else if (cursor.row > 0) {
        cursor = { row: cursor.row - 1, col: COLS - 1 };
    }
}

function handleBackspace() {
    const current = guesses[cursor.row][cursor.col];
    if (current.letter) {
        // Clear in place.
        current.letter = '';
        current.state = 'absent';
    } else {
        retreatCursor();
        const previous = guesses[cursor.row][cursor.col];
        previous.letter = '';
        previous.state = 'absent';
    }
    update();
}

function cycleCurrentTile(direction) {
    const cell = guesses[cursor.row][cursor.col];
    if (!cell.letter) return;
    const offset = direction === 'back' ? STATES.length - 1 : 1;
    cell.state = STATES[(STATES.indexOf(cell.state) + offset) % STATES.length];
    update();
}

function onKeyDown(event) {
    if (event.metaKey || event.ctrlKey || event.altKey) return;

    const key = event.key;

    if (/^[a-zA-Z]$/.test(key)) {
        event.preventDefault();
        typeLetter(key.toLowerCase());
    } else if (key === 'Backspace') {
        event.preventDefault();
        handleBackspace();
    } else if (key === 'ArrowLeft') {
        event.preventDefault();
        retreatCursor();
        renderGrid();
    } else if (key === 'ArrowRight') {
        event.preventDefault();
        advanceCursor();
        renderGrid();
    } else if (key === 'ArrowUp' && cursor.row > 0) {
        event.preventDefault();
        cursor.row--;
        renderGrid();
    } else if (key === 'ArrowDown' && cursor.row < ROWS - 1) {
        event.preventDefault();
        cursor.row++;
        renderGrid();
    } else if (key === ' ' || key === 'Enter') {
        // Space/Enter recolours the tile under the cursor -- keyboard parity
        // with clicking it.
        event.preventDefault();
        cycleCurrentTile(event.shiftKey ? 'back' : 'forward');
    }
}

function clearGrid() {
    for (let row = 0; row < ROWS; row++) {
        for (let col = 0; col < COLS; col++) {
            guesses[row][col] = { letter: '', state: 'absent' };
        }
    }
    cursor = { row: 0, col: 0 };
    update();
}

// Re-render and re-filter together; every mutation routes through here.
function update() {
    renderGrid();
    runSearch();
}

// The proxy input exists purely to summon the on-screen keyboard on mobile.
// It is never read from -- keystrokes are handled by the document listener.
function focusKeyboardProxy() {
    const proxy = document.getElementById('keyboardProxy');
    if (proxy && document.activeElement !== proxy) {
        proxy.focus({ preventScroll: true });
    }
}

// ---------------------------------------------------------------------------
// Results
// ---------------------------------------------------------------------------

function displayResults(results) {
    const resultsContainer = document.getElementById('results');

    if (results.length === 0) {
        resultsContainer.innerHTML = '<div class="no-results">No matching words found.</div>';
        return;
    }

    const maxFreq = Math.max(...results.map(w => w.frequency));
    const minFreq = Math.min(...results.map(w => w.frequency));
    const avgFreq = results.reduce((sum, w) => sum + w.frequency, 0) / results.length;

    const distribution = createFrequencyDistribution(results, maxFreq, minFreq);
    const shown = results.slice(0, MAX_RENDERED_RESULTS);
    const truncated = results.length - shown.length;

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

    const resultsHtml = shown
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

    const footer = truncated > 0
        ? `<div class="results-truncated">Showing the ${MAX_RENDERED_RESULTS} most common — ${truncated} more match. Add another guess to narrow it down.</div>`
        : '';

    resultsContainer.innerHTML =
        resultsHeader + '<div class="results-grid">' + resultsHtml + '</div>' + footer;
}

function getFrequencyTier(frequency, maxFreq, minFreq) {
    const range = maxFreq - minFreq;
    const highThreshold = minFreq + (range * 0.7);
    const mediumThreshold = minFreq + (range * 0.3);

    if (frequency >= highThreshold) return 'high-freq';
    if (frequency >= mediumThreshold) return 'medium-freq';
    return 'low-freq';
}

function getRelativeFrequencyText(frequency, avgFreq) {
    const ratio = frequency / avgFreq;
    if (ratio > 2) return 'much more common than average';
    if (ratio > 1.5) return 'more common than average';
    if (ratio > 0.7) return 'about average';
    if (ratio > 0.3) return 'less common than average';
    return 'much less common than average';
}

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

// ---------------------------------------------------------------------------
// Init
// ---------------------------------------------------------------------------

function initializeIndexPage() {
    buildGrid();
    document.addEventListener('keydown', onKeyDown);
    document.getElementById('clearButton').addEventListener('click', () => {
        clearGrid();
        focusKeyboardProxy();
    });
    loadWords();
}

// Exported for the Node test harness; harmless in the browser.
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { deriveConstraints, matchesConstraints, STATES };
}

if (typeof document !== 'undefined') {
    document.addEventListener('DOMContentLoaded', initializeIndexPage);
}
