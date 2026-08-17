// Common JavaScript utilities

// Common constants
const GITHUB_USERNAME = "raghav-awasty";
const GITHUB_REPO = "wordle-word-finder";
const GIT_BRANCH = "main";

// Utility function to create DOM elements
function createElement(tagName, className, innerText) {
    const ele = document.createElement(tagName);
    if (className) {
        ele.className = className;
    }
    if (innerText) {
        ele.textContent = innerText;
    }
    return ele;
}

// Common keyboard event handler for Enter key
function addEnterKeyHandler(callback) {
    document.addEventListener('keydown', function(event) {
        if (event.key === 'Enter') {
            event.preventDefault();
            callback();
        }
    });
}

// Utility function to show status messages
function showStatus(message, type = 'info') {
    const statusDiv = document.getElementById('status');
    if (statusDiv) {
        statusDiv.textContent = message;
        
        // Set color based on type
        switch(type) {
            case 'success':
                statusDiv.style.color = '#6aaa64';
                break;
            case 'error':
                statusDiv.style.color = '#cf222e';
                break;
            case 'info':
            default:
                statusDiv.style.color = '#0969da';
                break;
        }
    }
}

// Word submission
//
// Submitting opens a pre-filled GitHub issue rather than calling the API, so
// GitHub handles authentication and no token is needed in the browser. Shared
// by the submit page and the tap-to-submit bar on the finder.
function buildWordSubmissionUrl(word) {
    const upper = word.toUpperCase();
    const title = `WOTD: ${upper}`;
    const body = `Automated submission for Word of the Day: **${upper}**\n\n` +
        `Submitted on: ${new Date().toLocaleDateString()}`;

    return `https://github.com/${GITHUB_USERNAME}/${GITHUB_REPO}/issues/new?` +
        `title=${encodeURIComponent(title)}&` +
        `body=${encodeURIComponent(body)}&` +
        `labels=word-submission`;
}

function openWordSubmission(word) {
    window.open(buildWordSubmissionUrl(word), '_blank', 'noopener');
}

// Date utility functions
const DateUtils = {
    sameDay: function(date1, date2) {
        return date1.getFullYear() === date2.getFullYear() &&
            date1.getMonth() === date2.getMonth() &&
            date1.getDate() === date2.getDate();
    },

    formatDate: function(date) {
        return date.toLocaleDateString('en-US', {
            month: 'long',
            year: 'numeric'
        });
    },

    // Parse a "YYYY-MM-DD" string as a LOCAL calendar date.
    // `new Date("2026-07-27")` parses as UTC midnight, which reads back as the
    // 26th for anyone west of UTC. Building from parts keeps the date stable
    // in every timezone.
    parseLocal: function(isoDateString) {
        const [year, month, day] = isoDateString.split('-').map(Number);
        return new Date(year, month - 1, day);
    },

    // Format a Date as "YYYY-MM-DD" using its local calendar fields.
    toISODateString: function(date) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    },

    // Convert a Date to a whole-day index for gap arithmetic.
    // Subtracting raw timestamps breaks across DST transitions, where a
    // "day" is 23 or 25 hours; normalising to UTC noon avoids that entirely.
    toDayIndex: function(date) {
        return Math.round(
            Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) / 86400000
        );
    }
};

// Data loading utilities
const DataLoader = {
    loadJSON: async function(url) {
        try {
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`Failed to load ${url}`);
            }
            return await response.json();
        } catch (error) {
            console.error('Error loading JSON data:', error);
            throw error;
        }
    },
    
    loadText: async function(url) {
        try {
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`Failed to load ${url}`);
            }
            return await response.text();
        } catch (error) {
            console.error('Error loading text data:', error);
            throw error;
        }
    }
};

