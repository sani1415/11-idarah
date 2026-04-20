// Functions related to class name normalization and ID resolution. These
// utilities encapsulate the Bengali class name handling logic from the
// original teachers-corner.js. They mutate the shared `state.classMapping`
// object imported from teachers-corner-state.js.

import { state } from './teachers-corner-state.js';

// Fetch class definitions from the server and build a mapping of
// class name → class ID. The result is stored in state.classMapping.
export async function loadClassMapping() {
  try {
    const response = await fetch('/api/classes', {
      headers: { 'Cache-Control': 'no-cache' },
    });
    if (response.ok) {
      const classes = await response.json();
      state.classMapping = {};
      classes.forEach((cls) => {
        state.classMapping[cls.name] = cls.id;
      });
      console.log('✅ Class mapping loaded:', state.classMapping);
    } else {
      console.error('❌ Failed to load classes for mapping');
    }
  } catch (error) {
    console.error('❌ Error loading class mapping:', error);
  }
}

// Normalize Bengali class names by trimming whitespace and using NFC
// normalization. If no className is provided, an empty string is returned.
export function normalizeClassName(className) {
  if (!className) return '';
  return className.normalize('NFC').trim();
}

// Convert a Bengali class name into its numeric ID. This function first
// attempts to find the class in the dynamically loaded mapping. If not
// found, it falls back to a hardcoded mapping used in the original code.
export function getClassIdByName(className) {
  const normalized = normalizeClassName(className);
  // Search dynamic mapping. We normalize keys to account for Unicode
  // variations that may otherwise cause lookup failures.
  if (Object.keys(state.classMapping).length > 0) {
    for (const [name, id] of Object.entries(state.classMapping)) {
      if (normalizeClassName(name) === normalized) {
        return id;
      }
    }
    // Fallback to hardcoded map if not found after normalization
    console.warn(`⚠️ Class name "${normalized}" not found in database mapping after normalization`);
  }
  // Hardcoded Bengali class mapping – preserves backwards compatibility
  const fallbackMap = {
    'প্রথম শ্রেণী': 1,
    'প্রথম শ্রেণি': 1,
    'দ্বিতীয় শ্রেণী': 2,
    'দ্বিতীয় শ্রেণি': 2,
    'তৃতীয় শ্রেণী': 3,
    'তৃতীয় শ্রেণি': 3,
    'চতুর্থ শ্রেণী': 4,
    'চতুর্থ শ্রেণি': 4,
    'পঞ্চম শ্রেণী': 5,
    'পঞ্চম শ্রেণি': 5,
  };
  for (const [name, id] of Object.entries(fallbackMap)) {
    if (normalizeClassName(name) === normalized) {
      return id;
    }
  }
  return null;
}

// Alternative helper to retrieve a class ID from a class name using the
// globally loaded class list (when available). This mirrors
// getClassIdFromName from the original file. It expects a `window.classes`
// array to be populated by other parts of the application.
export function getClassIdFromName(className) {
  if (!window.classes) {
    console.warn(`⚠️ Classes not loaded yet, cannot get ID for: "${className}"`);
    return null;
  }
  const classObj = window.classes.find((c) => c.name === className);
  if (classObj) {
    return classObj.id;
  } else {
    console.warn(`⚠️ No class ID found for class name: "${className}"`);
    return null;
  }
}