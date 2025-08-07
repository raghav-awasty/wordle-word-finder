// Common JavaScript utilities

// Common constants
const GITHUB_USERNAME = "raghav-awasty";
const GITHUB_REPO = "wordle-word-finder";
const WORKFLOW_FILE_NAME = "update_word_otd.yml";
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
            console.error('Error loading data:', error);
            throw error;
        }
    }
};

