// Submit page specific functionality

async function submitWordViaIssue() {
    const word = document.getElementById('word').value.toUpperCase();

    if (word.length !== 5 || !/^[A-Z]+$/.test(word)) {
        showStatus('Error: Please enter a valid 5-letter word.', 'error');
        return;
    }

    showStatus('Creating submission...', 'info');

    try {
        // Create a GitHub issue to trigger the workflow
        const issueTitle = `WOTD: ${word}`;
        const issueBody = `Automated submission for Word of the Day: **${word}**\n\nSubmitted on: ${new Date().toLocaleDateString()}`;
        
        const response = await fetch(`https://api.github.com/repos/${GITHUB_USERNAME}/${GITHUB_REPO}/issues`, {
            method: 'POST',
            headers: {
                'Accept': 'application/vnd.github.v3+json',
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                title: issueTitle,
                body: issueBody,
                labels: ['word-submission']
            })
        });

        if (response.ok) {
            const issue = await response.json();
            showStatus(`Success! Word submission created. Check issue #${issue.number} for processing status.`, 'success');
            
            // Show link to the created issue
            const statusDiv = document.getElementById('status');
            const issueLink = document.createElement('div');
            issueLink.innerHTML = `<br><a href="${issue.html_url}" target="_blank" rel="noopener">View Issue #${issue.number}</a>`;
            issueLink.style.marginTop = '10px';
            statusDiv.appendChild(issueLink);
            
            // Clear the word input
            document.getElementById('word').value = '';
        } else if (response.status === 401) {
            showStatus('Error: This method requires you to be logged into GitHub and have repository access.', 'error');
            showFallbackInstructions(word);
        } else {
            const error = await response.json();
            showStatus(`Error: ${error.message}`, 'error');
            showFallbackInstructions(word);
        }
    } catch (error) {
        showStatus(`Error: ${error.message}`, 'error');
        showFallbackInstructions(word);
    }
}

function showFallbackInstructions(word) {
    const statusDiv = document.getElementById('status');
    const instructions = document.createElement('div');
    instructions.innerHTML = `
        <br><strong>Alternative: Create the issue manually</strong><br>
        <a href="https://github.com/${GITHUB_USERNAME}/${GITHUB_REPO}/issues/new?title=WOTD:%20${word}&body=Automated%20submission%20for%20Word%20of%20the%20Day:%20**${word}**&labels=word-submission" 
           target="_blank" rel="noopener" style="color: #0969da;">Click here to create the issue manually</a>
    `;
    instructions.style.marginTop = '10px';
    instructions.style.padding = '10px';
    instructions.style.backgroundColor = '#f6f8fa';
    instructions.style.border = '1px solid #d0d7de';
    instructions.style.borderRadius = '6px';
    statusDiv.appendChild(instructions);
}

// Initialize the submit page
function initializeSubmitPage() {
    addEnterKeyHandler(submitWordViaIssue);
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', initializeSubmitPage);
