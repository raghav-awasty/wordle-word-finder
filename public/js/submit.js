// Submit page specific functionality

// Loaded so the page can catch the two rejections the workflow would otherwise
// only report after an issue has been created: a word already used, and a day
// that already has an entry.
let wotdHistory = null;

function submitWordViaIssue() {
    const input = document.getElementById('word');
    const word = input.value.toUpperCase();

    if (word.length !== 5 || !/^[A-Z]+$/.test(word)) {
        showStatus('Error: Please enter a valid 5-letter word.', 'error');
        return;
    }

    // Only checked when the history actually loaded -- a failed fetch should
    // never block a submission, since the workflow validates it regardless.
    if (wotdHistory) {
        const previous = WordHistory.findWord(wotdHistory, word);
        if (previous) {
            const when = DateUtils.toISODateString(previous.date);
            showStatus(
                `${word} was already used on ${when}. Wordle never repeats an answer, so this is probably a typo.`,
                'error'
            );
            return;
        }

        const todayEntry = WordHistory.entryForToday(wotdHistory);
        if (todayEntry) {
            showStatus(
                `Today is already recorded as ${todayEntry.word.toUpperCase()}. Submitting again will be rejected.`,
                'error'
            );
            return;
        }
    }

    openWordSubmission(word);
    input.value = '';

    showStatus(`Creating issue for word: ${word}. Click "Create" to complete.`, 'success');
}

// Tell the user up front if the day is already done, rather than after they
// have typed a word and opened an issue.
async function loadHistoryForChecks() {
    try {
        wotdHistory = await WordHistory.load('../data/word_otd.json');
    } catch (error) {
        console.error('Could not load word history for duplicate checks:', error);
        return;
    }

    renderStreakBadge(wotdHistory);

    const todayEntry = WordHistory.entryForToday(wotdHistory);
    if (todayEntry) {
        showStatus(
            `Today's word is already recorded: ${todayEntry.word.toUpperCase()}.`,
            'info'
        );
    }
}

// Initialize the submit page
function initializeSubmitPage() {
    addEnterKeyHandler(submitWordViaIssue);

    const button = document.getElementById('submitButton');
    if (button) button.addEventListener('click', submitWordViaIssue);

    loadHistoryForChecks();
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', initializeSubmitPage);
