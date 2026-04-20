// This module centralizes all global state and common utility functions used
// throughout the Teachers Corner feature. Importing modules should mutate
// properties on the exported `state` object rather than declaring their own
// globals. This ensures that data remains consistent across modules.

// Shared state container. Properties defined here mirror the top‑level
// variables from the original teachers-corner.js file. Mutating these
// properties will update the values globally when other modules import
// the same state object.
export const state = {
  // Real student data loaded from the main application
  allStudents: [],
  // Dynamic class mapping loaded from the database
  classMapping: {},
  // Attendance data keyed by date and student ID
  attendance: {},
  // Education progress data for the selected class
  allEducationProgress: [],
  // Teacher logbook keyed by class name
  teachersLogbook: {},
  // Current Husnul Khuluk scores keyed by student ID
  studentScores: {},
  // Score change history keyed by student ID
  scoreChangeHistory: {},
  // Currently selected class and UI state - will be set based on permissions
  currentClass: null, // Will be set based on user permissions
  currentLogTab: 'class',
  expandedStudents: new Set(), // Track which students are expanded in chronological view
  currentStudentIdForProfile: null,
  // Cache for DOM elements to avoid repeated queries
  domCache: {},
  // When set to true the Teachers Corner HTML skeleton has been inserted
  teachersCornerHtmlReady: false,
  // Used for alert management
  currentAlerts: [],
};

// Function to get current student ID from modal
export function getCurrentStudentId() {
    return state.currentStudentIdForProfile;
}

// Function to save the selected class to localStorage for persistence across refreshes
export function saveSelectedClass(className) {
    if (className) {
        localStorage.setItem('teachersCornerSelectedClass', className);
        console.log('💾 Saved selected class to localStorage:', className);
    } else {
        localStorage.removeItem('teachersCornerSelectedClass');
        console.log('🗑️ Cleared selected class from localStorage');
    }
}

// Utility: return today's date as YYYY-MM-DD. This helper keeps the
// implementation consistent with the original file and is imported
// wherever needed.
export function getTodayString() {
  const today = new Date();
  return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
}

// Utility: cache DOM elements by ID. Use this instead of repeatedly
// calling document.getElementById throughout your UI code.
export function getCachedElement(id) {
  if (!state.domCache[id]) {
    state.domCache[id] = document.getElementById(id);
  }
  return state.domCache[id];
}

// Utility: clear the DOM cache for a specific element or all elements
export function clearElementCache(id = null) {
  if (id) {
    delete state.domCache[id];
  } else {
    state.domCache = {};
  }
}

// Utility: update the textContent of an element if it differs. This
// minimizes unnecessary DOM mutations.
export function updateElementText(id, text) {
  const element = getCachedElement(id);
  if (element && element.textContent !== text) {
    element.textContent = text;
  }
}

// Utility: update the innerHTML of an element if it differs. Be cautious
// when using this – avoid injecting untrusted HTML.
export function updateElementHTML(id, html) {
  const element = getCachedElement(id);
  if (element && element.innerHTML !== html) {
    element.innerHTML = html;
  }
}

// Utility: debounce a function. The returned function will postpone its
// execution until after `wait` milliseconds have elapsed since the last
// time it was invoked. Used to prevent rapid repeated updates (e.g.,
// search boxes, scroll handlers).
export function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// Alert System Configuration
export const ALERT_CONFIG = {
    // Score thresholds (can be customized in settings)
    LOW_SCORE_THRESHOLD: 60,
    CRITICAL_SCORE_THRESHOLD: 50,
    LOW_CLASS_AVERAGE_THRESHOLD: 70,
    
    // Alert types and colors
    ALERT_TYPES: {
        danger: { bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-800', icon: 'text-red-500' },
        warning: { bg: 'bg-yellow-50', border: 'border-yellow-200', text: 'text-yellow-800', icon: 'text-yellow-500' },
        info: { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-800', icon: 'text-blue-500' }
    }
};