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

        inputSection.style.display = 'none';
        resultsDiv.style.display = 'none';
        loadingDiv.style.display = 'block';

        try {
            const response = await chrome.tabs.sendMessage(tab.id, {action: 'extractProfile'});

            if(response && response.success) {                
                const profileData = response.data;
                console.log('headline: ' + profileData.headline);
                console.log('education: ' + profileData.education);

                const analysis = analyzeMatch(profileData, jobDescription);
                displayResults(analysis);
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

function analyzeMatch(profile, jobDescription) {
    const jobDescLower = jobDescription.toLowerCase();

    const profileText = `
    ${profile.headline}
    ${profile.about}
    ${profile.experience.map(e => `${e.title} ${e.company} ${e.description}`).join(' ')}
    ${profile.education.map(e => `${e.school} ${e.degree}`).join(' ')}
    ${profile.skills.join(' ')}
    `.toLowerCase();

    const commonSkills = [
        'python', 'javascript', 'java', 'react', 'node', 'sql', 'aws', 'docker', 
        'kubernetes', 'git', 'agile', 'machine learning', 'data analysis', 'excel',
        'leadership', 'project management', 'communication', 'teamwork', 'problem solving'
    ];

    const requiredSkills = commonSkills.filter(skill => jobDescLower.includes(skill));
    const matchedSkills = requiredSkills.filter(skill =>profileText.includes(skill));

    const experienceYears = profile.experience.length;
    let experienceMatch = false;

    console.log("Processing experience");

    if(jobDescLower.includes('entry level') || jobDescLower.includes('junior')) {
        experienceMatch = experienceYears <= 3;
    } else if (jobDescLower.includes('senior') || jobDescLower.includes('lead')) {
        experienceMatch = experienceYears >= 5;
    } else if (jobDescLower.includes('mid level') || jobDescLower.includes('intermediate')) {
        experienceMatch = experienceYEars >= 2 && experienceYears <= 5;
    } else {
        experienceMatch = experienceYears >= 1;
    }

    const hasRelevantEducation = profile.education.length > 0;
    const requiresDegree = jobDescLower.includes('bachelor') || jobDescLower.includes('degree') || jobDescLower.includes('bs') || jobDescLower.includes('ba');

    let score = 0;
    const factors = [];

    if(requiredSkills.length > 0) {
        const skillsScore = (matchedSkills.length / requiredSkills.length) * 40;
        score += skillsScore;
        factors.push({
            category: 'Skills Match',
            score: Math.round(skillsScore),
            details: `${matchedSkills.length} of ${requiredSkills.length} key skills found: ${matchedSkills.join(', ') || 'none'}`
        });
    } else {
        score += 35;
        factors.push({
            category: 'Skills Match',
            score: 35,
            details: 'Unable to identify specific required skills from job description'
        });
    }

    if (experienceMatch) {
        score += 30;
        factors.push({
            category: 'Experience Level',
            score: 30,
            details: `${experienceYears} role(s) listed, appears to match requirements`,
        });
    } else {
        score += 15;
        factors.push({
            category: 'Experience Level',
            score: 15,
            details: `${experienceYears} role(s) listed, may not fully align with requirements`
        });
    }

    if (requiresDegree && hasRelevantEducation) {
        score += 15;
        factors.push({
            category: 'Education',
            score: 15,
            details: 'Education requirements appear to be met'
        });
    } else if (!requiresDegree) {
        score += 15;
        factors.push({
            category: 'Education',
            score: 15,
            details: 'No specific education requirements identified'
        });
    } else {
        score += 5;
        factors.push({ 
            category: 'Education',
            score: 5,
            details: 'Education information may not meet requirements'
        });
    }

    const completeness = [
        profile.headline,
        profile.about,
        profile.experience.length > 0,
        profile.education.length > 0,
        profile.skills.length > 0
    ].filter(Boolean).length;

    const completenessScore = (completeness / 5) * 15;
    score += completenessScore;
    factors.push({
        category: 'Profile Completeness',
        score: Math.round(completenessScore),
        details: `Profile is ${Math.round((completeness / 5) * 100)}% complete`
    });

    return {
        score: Math.round(score),
        factors: factors,
        suggestions: generateSuggestions(matchedSkills, requiredSkills, profile)
    };
}

function generateSuggestions(matchedSkills, requiredSkills, profile) {
    const suggestions = [];
    const missingSkills = requiredSkills.filter(skill => !matchedSkills.includes(skill));

    if(missingSkills.length > 0) {
        suggestions.push(`Consider highlighting experience with: ${missingSkills.slice(0, 5).join(', ')}`);
    }
    if (!profile.about || profile.about.length < 100) {
        suggestions.push('Add or expand the About section to showcase relevant experience');
    }

    if (profile.skills.length < 5) {
        suggestions.push('Add more skills to your profile to improve visibility');
    }
    return suggestions;
}

function displayResults(analysis) {
    const loadingDiv = document.getElementById('loading');
    const resultsDiv = document.getElementById('results');
    const scoreDiv = document.getElementById('score');
    const explanationDiv = document.getElementById ('explanation');

    loadingDiv.style.display = 'none';
    resultsDiv.style.display = 'block';

    scoreDiv.textContent = analysis.score + '%';
    if (analysis.score >= 80) {
        scoreDiv.style.color = '#2e7d32';
    } else if (analysis.score >= 60) {
        scoreDiv.style.color = '#f57c00';
    } else {
        scoreDiv.style.color = '#d32f2f';
    }

    let html = '<h3>Score Breakdown:</h3><ul>';
    analysis.factors.forEach(factor => {
        html += `<li><strong>${factor.category}:</strong> ${factor.score}% - ${factor.details}</li>`;
    });
    html += '</ul>';

    if (analysis.suggestions.length > 0) {
        html += '<h3>Suggestions:</h3><ul>';
        analysis.suggestions.forEach(suggestion => {
            html += `<li>${suggestion}</li>`;
        });
        html += '</ul>';
    }

    explanationDiv.innerHTML = html;
}