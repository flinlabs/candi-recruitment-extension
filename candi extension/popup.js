document.addEventListener('DOMContentLoaded', function() {
    const analyzeBtn = document.getElementById('analyzeBtn');
    const jobDescTextarea = document.getElementById('jobDesc');
    const errorDiv = document.getElementById('error');
    const resultsDiv = document.getElementById('results');
    const loadingDiv = document.getElementById('loading');
    const inputSection = document.getElementById('input-section');

    chrome.storage.local.get(['jobDescription'], function(result) {
        if (result.jobDescription) {
            jobDescTextarea.value = result.jobDescription;
        }
    });

    analyzeBtn.addEventListener('click', async function() {
        const jobDescription = jobDescTextarea.value.trim();

        if(!jobDescription) {
            errorDiv.textContent = 'Please enter a job description.';
            return;
        }
        errorDiv.textContent = '';

        chrome.storage.local.set({jobDescription: jobDescription});

        const [tab] = await chrome.tabs.query({active: true, currentWindow: true});

        if (!tab.url || !tab.url.includes('linkedin.com/in/')) {
            errorDiv.textContent = 'Please navigate to a LinkedIn profile. Current URL: ' + tab.url;
            return;
        }

    }
)
}
)