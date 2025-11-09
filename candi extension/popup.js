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

        //inputSection.style.display = 'none';
        //resultsDiv.style.display = 'none';
        //loadingDiv.style.display = 'block';

        try {
            const response = await chrome.tabs.sendMessage(tab.id, {action: 'extractProfile'});

            if(response && response.success) {                
                const profileData = response.data;
                console.log('headline: ' + profileData.headline);
                console.log('education: ' + profileData.education);

                return;
                //displayResults(profileData);
            } else {
                throw new Error('Failed to extract profile data');
            }
        } catch (error) {
            loadingDiv.style.display = 'none';
            inputSection.style.display = 'block';
            errorDiv.textContent = 'Error: ' + error.message + '. Try refreshing the LinkedIn page.';
            return;
        }
    });
})

/*function displayResults(analysis) {
    const loadingDiv = document.getElementById('loading');
    const resultsDiv = document.getElementById('results');
    const scoreDiv = document.getElementById('score');
    const explanationDiv = document.getElementById ('explanation');

    loadingDiv.style.display = 'none';
    resultsDiv.style.display = 'block';


}*/