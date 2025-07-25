// Submit page specific functionality

async function triggerWorkflow() {
    const word = document.getElementById('word').value.toUpperCase();
    const token = document.getElementById('pat').value;

    if (word.length !== 5 || !/^[A-Z]+$/.test(word)) {
        showStatus('Error: Please enter a valid 5-letter word.', 'error');
        return;
    }
    if (!token) {
        showStatus('Error: Please enter your Personal Access Token.', 'error');
        return;
    }

    showStatus('Triggering workflow...', 'info');

    try {
        const response = await fetch(`https://api.github.com/repos/${GITHUB_USERNAME}/${GITHUB_REPO}/actions/workflows/${WORKFLOW_FILE_NAME}/dispatches`, {
            method: 'POST',
            headers: {
                'Accept': 'application/vnd.github.v3+json',
                'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify({
                ref: GIT_BRANCH,
                inputs: {
                    word: word
                }
            })
        });

        if (response.ok) {
            showStatus(`Success! Workflow triggered with word: ${word}`, 'success');
        } else {
            const error = await response.json();
            showStatus(`Error: ${error.message}`, 'error');
        }
    } catch (error) {
        showStatus(`Error: ${error.message}`, 'error');
    }
}

// Initialize the submit page
function initializeSubmitPage() {
    addEnterKeyHandler(triggerWorkflow);
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', initializeSubmitPage);
