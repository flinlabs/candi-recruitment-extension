// Extract LinkedIn profile data
function extractProfileData() {
  const data = {
    name: '',
    headline: '',
    about: '',
    experience: [],
    education: [],
    skills: []
  };

  // Extract name
  const nameElement = document.querySelector('h1.text-heading-xlarge');
  if (nameElement) {
    data.name = nameElement.textContent.trim();
  }

  // Extract headline
  const headlineElement = document.querySelector('.text-body-medium.break-words');
  if (headlineElement) {
    data.headline = headlineElement.textContent.trim();
  }

  // Extract about section
  const aboutSection = document.querySelector('#about');
  if (aboutSection) {
    const aboutContainer = aboutSection.closest('.artdeco-card');
    if (aboutContainer) {
      const aboutText = aboutContainer.querySelector('.inline-show-more-text');
      if (aboutText) {
        data.about = aboutText.textContent.trim();
      }
    }
  }

  // Extract experience
  const experienceSection = document.querySelector('#experience');
  if (experienceSection) {
    const experienceContainer = experienceSection.closest('.artdeco-card');
    if (experienceContainer) {
      const experienceItems = experienceContainer.querySelectorAll('li.artdeco-list__item');
      experienceItems.forEach(item => {
        const titleElement = item.querySelector('.t-bold span[aria-hidden="true"]');
        const companyElement = item.querySelector('.t-14.t-normal span[aria-hidden="true"]');
        const descriptionElement = item.querySelector('.inline-show-more-text');
        
        if (titleElement) {
          data.experience.push({
            title: titleElement.textContent.trim(),
            company: companyElement ? companyElement.textContent.trim() : '',
            description: descriptionElement ? descriptionElement.textContent.trim() : ''
          });
        }
      });
    }
  }

  // Extract education
  const educationSection = document.querySelector('#education');
  if (educationSection) {
    const educationContainer = educationSection.closest('.artdeco-card');
    if (educationContainer) {
      const educationItems = educationContainer.querySelectorAll('li.artdeco-list__item');
      educationItems.forEach(item => {
        const schoolElement = item.querySelector('.t-bold span[aria-hidden="true"]');
        const degreeElement = item.querySelector('.t-14.t-normal span[aria-hidden="true"]');
        
        if (schoolElement) {
          data.education.push({
            school: schoolElement.textContent.trim(),
            degree: degreeElement ? degreeElement.textContent.trim() : ''
          });
        }
      });
    }
  }

  // Extract skills
  const skillsSection = document.querySelector('#skills');
  if (skillsSection) {
    const skillsContainer = skillsSection.closest('.artdeco-card');
    if (skillsContainer) {
      const skillItems = skillsContainer.querySelectorAll('.hoverable-link-text span[aria-hidden="true"]');
      skillItems.forEach(skill => {
        data.skills.push(skill.textContent.trim());
      });
    }
  }

  return data;
}

// Listen for messages from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'extractProfile') {
    const profileData = extractProfileData();
    sendResponse({ success: true, data: profileData });
  }
  return true;
});