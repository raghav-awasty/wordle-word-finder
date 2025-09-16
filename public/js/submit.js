// Submit page specific functionality

function submitWordViaIssue() {
    const word = document.getElementById('word').value.toUpperCase();

    if (word.length !== 5 || !/^[A-Z]+$/.test(word)) {
        showStatus('Error: Please enter a valid 5-letter word.', 'error');
        return;
    }

    // Create pre-filled GitHub issue URL and open it directly
    const issueTitle = `WOTD: ${word}`;
    const issueBody = `Automated submission for Word of the Day: **${word}**\n\nSubmitted on: ${new Date().toLocaleDateString()}\n\n*.*`;
    
    const issueUrl = `https://github.com/${GITHUB_USERNAME}/${GITHUB_REPO}/issues/new?` +
        `title=${encodeURIComponent(issueTitle)}&` +
        `body=${encodeURIComponent(issueBody)}&` +
        `labels=word-submission`;
    
    // Open the pre-filled issue creation page directly
    window.open(issueUrl, '_blank', 'noopener');
    
    // Clear the word input
    document.getElementById('word').value = '';
    
    // Show success message
    showStatus(`Opened issue creation for word: ${word}. Click "Submit new issue" to complete.`, 'success');
}


// Initialize the submit page
function initializeSubmitPage() {
    addEnterKeyHandler(submitWordViaIssue);
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', initializeSubmitPage);
