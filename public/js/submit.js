// Submit page specific functionality

function submitWordViaIssue() {
    const word = document.getElementById('word').value.toUpperCase();

    if (word.length !== 5 || !/^[A-Z]+$/.test(word)) {
        showStatus('Error: Please enter a valid 5-letter word.', 'error');
        return;
    }

    // Open the pre-filled issue creation page directly
    openWordSubmission(word);

    // Clear the word input
    document.getElementById('word').value = '';
    
    // Show success message
    showStatus(`Creating issue for word: ${word}. Click "Create" to complete.`, 'success');
}


// Initialize the submit page
function initializeSubmitPage() {
    addEnterKeyHandler(submitWordViaIssue);
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', initializeSubmitPage);
