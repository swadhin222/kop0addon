// State
let selectedIntervals = [];

// DOM Elements
const elements = {
  chatId: document.getElementById('chatId'),
  botToken: document.getElementById('botToken'),
  finalMinutes: document.getElementById('finalMinutes'),
  finalSeconds: document.getElementById('finalSeconds'),
  tagsContainer: document.getElementById('tagsContainer'),
  emptyState: document.getElementById('emptyState'),
  quickAdd: document.getElementById('quickAdd'),
  customInterval: document.getElementById('customInterval'),
  addIntervalBtn: document.getElementById('addIntervalBtn'),
  userName: document.getElementById('userName'),
  apiKey: document.getElementById('apiKey'),
  apiValue: document.getElementById('apiValue'),
  saveBtn: document.getElementById('saveBtn'),
  saveBtnText: document.getElementById('saveBtnText'),
  statusDot: document.getElementById('statusDot'),
  statusText: document.getElementById('statusText'),
  toast: document.getElementById('toast')
};

// Tab Navigation
const navTabs = document.querySelectorAll('.nav-tab');
const tabContents = document.querySelectorAll('.tab-content');

navTabs.forEach(tab => {
  tab.addEventListener('click', () => {
    // Remove active from all tabs
    navTabs.forEach(t => t.classList.remove('active'));
    tabContents.forEach(c => c.classList.remove('active'));
    
    // Add active to clicked tab
    tab.classList.add('active');
    const tabId = tab.getAttribute('data-tab');
    document.getElementById('tab-' + tabId).classList.add('active');
  });
});

// Show toast notification
function showToast(message, isError = false) {
  elements.toast.textContent = message;
  elements.toast.classList.toggle('error', isError);
  elements.toast.classList.add('show');
  setTimeout(() => {
    elements.toast.classList.remove('show');
  }, 2500);
}


// Update empty state visibility
function updateEmptyState() {
  elements.emptyState.style.display = selectedIntervals.length === 0 ? 'inline' : 'none';
}

// Add interval tag
function addInterval(value) {
  const num = parseFloat(value);
  if (isNaN(num) || num <= 0 || num > 10) {
    showToast('⚠️ Enter a value between 0.5 and 10', true);
    return false;
  }

  if (selectedIntervals.includes(num)) {
    showToast('⚠️ Already added!', true);
    return false;
  }

  selectedIntervals.push(num);
  selectedIntervals.sort((a, b) => a - b);
  renderTags();
  updateQuickButtons();
  return true;
}

// Remove interval tag
function removeInterval(value) {
  const num = parseFloat(value);
  selectedIntervals = selectedIntervals.filter(v => v !== num);
  renderTags();
  updateQuickButtons();
}

// Render tags
function renderTags() {
  // Remove existing tags (keep empty state)
  const existingTags = elements.tagsContainer.querySelectorAll('.tag');
  existingTags.forEach(tag => tag.remove());

  // Add new tags
  selectedIntervals.forEach(val => {
    const tag = document.createElement('span');
    tag.className = 'tag';
    tag.innerHTML = `
      ${val} min
      <button class="tag-remove" data-value="${val}">×</button>
    `;
    elements.tagsContainer.insertBefore(tag, elements.emptyState);
  });

  updateEmptyState();
}

// Update quick add button states
function updateQuickButtons() {
  const quickBtns = elements.quickAdd.querySelectorAll('.quick-btn');
  quickBtns.forEach(btn => {
    const val = parseFloat(btn.dataset.value);
    btn.classList.toggle('active', selectedIntervals.includes(val));
  });
}

// Load settings from chrome.storage.local
function loadSettings() {
  if (typeof chrome !== 'undefined' && chrome.storage) {
    chrome.storage.local.get(['RECPlusSetId'], (data) => {
      const settings = data.RECPlusSetId || {};

      elements.chatId.value = settings.chatId || '';
      elements.botToken.value = settings.botToken || '';
      elements.userName.value = settings.name || '';
      elements.apiKey.value = settings.key || 'sp1_status';
      elements.apiValue.value = settings.value || '0';

      // Final alert time (stored as decimal minutes)
      if (settings.finalAlertTime) {
        const totalSeconds = Math.round(settings.finalAlertTime * 60);
        elements.finalMinutes.value = Math.floor(totalSeconds / 60);
        elements.finalSeconds.value = totalSeconds % 60;
      }

      // Interval alerts
      if (settings.intervals && Array.isArray(settings.intervals)) {
        selectedIntervals = [...settings.intervals];
        renderTags();
        updateQuickButtons();
      }
    });
  }
}

// Save settings to chrome.storage.local
function saveSettings() {
  const minutes = parseInt(elements.finalMinutes.value) || 9;
  const seconds = parseInt(elements.finalSeconds.value) || 40;
  const finalAlertTime = minutes + (seconds / 60);

  const settings = {
    chatId: elements.chatId.value.trim(),
    botToken: elements.botToken.value.trim(),
    name: elements.userName.value.trim(),
    key: elements.apiKey.value.trim() || 'sp1_status',
    value: elements.apiValue.value.trim() || '0',
    finalAlertTime: finalAlertTime,
    intervals: [...selectedIntervals]
  };

  if (typeof chrome !== 'undefined' && chrome.storage) {
    chrome.storage.local.set({ RECPlusSetId: settings }, () => {
      // Animate save button
      elements.saveBtn.classList.add('saved');
      elements.saveBtnText.textContent = 'Saved!';

      setTimeout(() => {
        elements.saveBtn.classList.remove('saved');
        elements.saveBtnText.textContent = 'Save Settings';
      }, 2000);

      showToast('✓ Settings saved successfully!');

      if (settings.chatId && settings.botToken) {
        updateStatus(true, 'Settings saved • Active');
      } else {
        updateStatus(false, 'Missing Telegram credentials');
      }
    });
  } else {
    // For testing outside extension
    console.log('Settings to save:', settings);
    showToast('⚠️ Chrome storage not available', true);
  }
}

// Event Listeners

// Quick add buttons
elements.quickAdd.addEventListener('click', (e) => {
  if (e.target.classList.contains('quick-btn')) {
    const value = parseFloat(e.target.dataset.value);
    if (selectedIntervals.includes(value)) {
      removeInterval(value);
    } else {
      addInterval(value);
    }
  }
});

// Custom add button
elements.addIntervalBtn.addEventListener('click', () => {
  const value = elements.customInterval.value;
  if (addInterval(value)) {
    elements.customInterval.value = '';
  }
});

// Enter key on custom input
elements.customInterval.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') {
    const value = elements.customInterval.value;
    if (addInterval(value)) {
      elements.customInterval.value = '';
    }
  }
});

// Remove tag buttons (event delegation)
elements.tagsContainer.addEventListener('click', (e) => {
  if (e.target.classList.contains('tag-remove')) {
    const value = e.target.dataset.value;
    removeInterval(value);
  }
});

// Save button
elements.saveBtn.addEventListener('click', saveSettings);

// Initialize
document.addEventListener('DOMContentLoaded', loadSettings);