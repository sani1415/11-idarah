// Teachers Corner Bottom Navigation Module
// Handles bottom navigation for normal users within Teachers Corner section

// Import state to check if class is selected
import { state } from './teachers-corner-state.js';

// Debounce timer to prevent rapid show/hide flickering
let navShowHideTimer = null;
let lastNavState = { shown: false, timestamp: 0 };

/**
 * Check if current user is a normal user (not admin)
 * @returns {boolean} True if user is normal user, false if admin
 */
function isNormalUser() {
  const currentUser = window.currentUser;
  if (!currentUser) {
    console.warn('⚠️ [TC Nav] No current user found, defaulting to hide TC nav');
    return false;
  }
  
  // Only show TC nav for normal users (role === 'user'), not for admins
  const isUser = currentUser.role === 'user';
  console.log(`🔍 [TC Nav] User role: ${currentUser.role}, isNormalUser: ${isUser}`);
  return isUser;
}

/**
 * Show Teachers Corner bottom navigation
 * Hides main navigation and shows Teachers Corner nav
 * ONLY FOR NORMAL USERS - Admins keep their main navigation
 */
export function showTeachersCornerNav() {
  // Clear any pending hide/show operations to prevent flickering
  if (navShowHideTimer) {
    clearTimeout(navShowHideTimer);
  }
  
  // Debounce: Only show if not recently hidden (prevents flickering)
  const now = Date.now();
  if (lastNavState.shown === false && (now - lastNavState.timestamp) < 500) {
    console.log('⏸️ [TC Nav] Debouncing - nav was recently hidden, skipping show');
    return;
  }
  
  console.log('📱 [TC Nav] Showing Teachers Corner bottom navigation');
  
  // CRITICAL CHECK FIRST: Never show for admins
  const currentUser = window.currentUser;
  if (currentUser && currentUser.role === 'admin') {
    console.log('🚫 [TC Nav] BLOCKED - Admin user detected, TC nav will NOT be shown');
    const tcNav = document.getElementById('teachers-corner-bottom-nav');
    if (tcNav) {
      tcNav.style.display = 'none';
      tcNav.style.setProperty('display', 'none', 'important');
      tcNav.classList.add('admin-hidden');
    }
    // Ensure main nav is visible for admins
    const mainNav = document.querySelector('.mobile-bottom-nav');
    if (mainNav && window.innerWidth <= 768) {
      mainNav.style.display = 'flex';
      mainNav.style.setProperty('display', 'flex', 'important');
    }
    return; // EXIT IMMEDIATELY - don't proceed
  }
  
  // CRITICAL: Only show for normal users, not admins
  if (!isNormalUser()) {
    console.log('🚫 [TC Nav] Admin user detected - keeping main navigation, hiding TC nav');
    const tcNav = document.getElementById('teachers-corner-bottom-nav');
    if (tcNav) {
      tcNav.style.display = 'none';
      tcNav.style.setProperty('display', 'none', 'important');
      tcNav.classList.add('admin-hidden');
    }
    // Ensure main nav is visible for admins
    const mainNav = document.querySelector('.mobile-bottom-nav');
    if (mainNav && window.innerWidth <= 768) {
      mainNav.style.display = 'flex';
      mainNav.style.setProperty('display', 'flex', 'important');
    }
    return; // EXIT IMMEDIATELY
  }
  
  // Debounce: Execute after small delay to prevent rapid changes
  navShowHideTimer = setTimeout(() => {
    const tcNav = document.getElementById('teachers-corner-bottom-nav');
    const mainNav = document.querySelector('.mobile-bottom-nav');
    
    if (tcNav) {
      // Only show on mobile devices
      if (window.innerWidth <= 768) {
        tcNav.style.display = 'flex';
        lastNavState = { shown: true, timestamp: Date.now() };
        console.log('✅ [TC Nav] Teachers Corner nav displayed (normal user)');
      } else {
        tcNav.style.display = 'none';
        console.log('📱 [TC Nav] Desktop view - Teachers Corner nav hidden');
      }
    } else {
      console.warn('⚠️ [TC Nav] Teachers Corner nav element not found');
    }
    
    // Hide main navigation to avoid double nav (only for normal users)
    if (mainNav && window.innerWidth <= 768) {
      mainNav.style.display = 'none';
      console.log('✅ [TC Nav] Main nav hidden (normal user)');
    }
    
    navShowHideTimer = null;
  }, 100); // 100ms debounce
}

/**
 * Hide Teachers Corner bottom navigation
 * Shows main navigation when leaving Teachers Corner
 */
export function hideTeachersCornerNav() {
  // Clear any pending show operations
  if (navShowHideTimer) {
    clearTimeout(navShowHideTimer);
    navShowHideTimer = null;
  }
  
  // Debounce: Only hide if not recently shown (prevents flickering)
  const now = Date.now();
  if (lastNavState.shown === true && (now - lastNavState.timestamp) < 500) {
    console.log('⏸️ [TC Nav] Debouncing - nav was recently shown, skipping hide');
    return;
  }
  
  console.log('📱 [TC Nav] Hiding Teachers Corner bottom navigation');
  
  const tcNav = document.getElementById('teachers-corner-bottom-nav');
  const mainNav = document.querySelector('.mobile-bottom-nav');
  
  if (tcNav) {
    tcNav.style.display = 'none';
    lastNavState = { shown: false, timestamp: Date.now() };
    console.log('✅ [TC Nav] Teachers Corner nav hidden');
  }
  
  // Restore main navigation if on mobile (for both admin and normal users)
  if (mainNav && window.innerWidth <= 768) {
    mainNav.style.display = 'flex';
    console.log('✅ [TC Nav] Main nav restored');
  }
}

/**
 * Switch to a specific Teachers Corner tab
 * @param {string} tabName - Tab name: 'dashboard', 'students', 'progress', 'logbook', 'exams'
 */
export function switchTeachersCornerTab(tabName) {
  console.log(`🔄 [TC Nav] Switching to Teachers Corner tab: ${tabName}`);
  
  // Update active state
  const navItems = document.querySelectorAll('.teachers-corner-bottom-nav .tc-nav-item');
  navItems.forEach(item => {
    const itemTab = item.getAttribute('data-tc-tab');
    if (itemTab === tabName) {
      item.classList.add('active');
      console.log(`✅ [TC Nav] ${itemTab} tab activated`);
    } else {
      item.classList.remove('active');
    }
  });
  
  // Haptic feedback on mobile
  if (window.MobileUI && window.MobileUI.isMobile() && navigator.vibrate) {
    navigator.vibrate(10);
    console.log('📳 [TC Nav] Haptic feedback triggered');
  }
  
  // Scroll to the appropriate section
  scrollToTeachersCornerSection(tabName);
  
  console.log(`✅ [TC Nav] Successfully switched to ${tabName} tab`);
}

/**
 * Scroll to the appropriate section within Teachers Corner
 * @param {string} tabName - Tab name to scroll to
 */
function scrollToTeachersCornerSection(tabName) {
  const section = document.getElementById('teachers-corner-section');
  if (!section || !section.classList.contains('active')) {
    console.warn('⚠️ Teachers Corner section not active');
    return;
  }
  
  let targetElement = null;
  
  switch (tabName) {
    case 'dashboard':
      // Scroll to top of Teachers Corner section
      targetElement = document.getElementById('class-dashboard-title');
      if (!targetElement) {
        targetElement = section;
      }
      break;
      
    case 'students':
      // Scroll to student list
      targetElement = document.getElementById('class-student-list');
      if (!targetElement) {
        // Try to find parent container
        targetElement = document.querySelector('#teachers-corner-section .student-list-container');
      }
      break;
      
    case 'progress':
      // Scroll to education progress
      targetElement = document.getElementById('class-education-progress');
      if (!targetElement) {
        targetElement = document.querySelector('#teachers-corner-section .bg-white');
      }
      break;
      
    case 'logbook':
      // Scroll to logbook
      targetElement = document.getElementById('logbook-display');
      break;
      
    case 'exams':
      // Scroll to exam management section
      targetElement = document.getElementById('class-exam-management-section');
      break;
      
    default:
      targetElement = section;
  }
  
  if (targetElement) {
    // Smooth scroll to element
    setTimeout(() => {
      targetElement.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'start',
        inline: 'nearest'
      });
      
      // Add padding offset for fixed nav
      const navHeight = 65;
      const elementPosition = targetElement.getBoundingClientRect().top + window.pageYOffset;
      const offsetPosition = elementPosition - navHeight - 20; // 20px extra padding
      
      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
      
      console.log(`✅ Scrolled to ${tabName} section`);
    }, 100);
  } else {
    console.warn(`⚠️ Target element not found for tab: ${tabName}`);
  }
}

/**
 * Initialize Teachers Corner navigation
 * Sets up event handlers and initial state
 */
export function initTeachersCornerNav() {
  console.log('🚀 Initializing Teachers Corner navigation...');
  
  const navItems = document.querySelectorAll('.teachers-corner-bottom-nav .tc-nav-item');
  
  navItems.forEach(item => {
    // Remove any existing listeners
    const newItem = item.cloneNode(true);
    item.parentNode.replaceChild(newItem, item);
    
    // Add click handler
    newItem.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      
      const tabName = newItem.getAttribute('data-tc-tab');
      if (tabName) {
        switchTeachersCornerTab(tabName);
      }
    });
  });
  
  // Set initial active state to dashboard
  switchTeachersCornerTab('dashboard');
  
  console.log('✅ Teachers Corner navigation initialized');
}

/**
 * Update active tab indicator based on scroll position or content state
 * This can be called when content changes to keep nav in sync
 */
export function updateTeachersCornerNavState() {
  const section = document.getElementById('teachers-corner-section');
  if (!section || !section.classList.contains('active')) {
    return;
  }
  
  // Check which section is currently visible (basic implementation)
  // Could be enhanced with Intersection Observer API for more accuracy
  const scrollY = window.scrollY || window.pageYOffset;
  const sectionTop = section.offsetTop;
  const sectionHeight = section.offsetHeight;
  
  // Simple heuristic: if scrolled to top, show dashboard
  if (scrollY < sectionTop + 300) {
    switchTeachersCornerTab('dashboard');
  }
  // Could add more logic here to detect other sections
}

/**
 * Ensure proper navigation state on page load
 * Hides TC nav for admins, shows main nav
 * This is a STRICT enforcement that runs continuously
 */
export function ensureProperNavState() {
  const currentUser = window.currentUser;
  const tcNav = document.getElementById('teachers-corner-bottom-nav');
  const mainNav = document.querySelector('.mobile-bottom-nav');
  
  if (!currentUser) {
    // User not loaded yet, wait a bit and check again
    setTimeout(ensureProperNavState, 500);
    return;
  }
  
  const isAdmin = currentUser.role === 'admin';
  const isNormalUser = currentUser.role === 'user';
  
  if (isAdmin) {
    // FOR ADMINS ONLY: ALWAYS hide TC nav, ALWAYS show main nav
    if (tcNav) {
      tcNav.style.display = 'none';
      tcNav.style.setProperty('display', 'none', 'important');
      tcNav.classList.add('admin-hidden');
    }
    if (mainNav && window.innerWidth <= 768) {
      mainNav.style.display = 'flex';
      mainNav.style.setProperty('display', 'flex', 'important');
    }
    // Only log occasionally to avoid spam
    if (Math.random() < 0.1) {
      console.log('✅ [TC Nav] ADMIN - TC nav hidden, main nav visible');
    }
  } else if (isNormalUser) {
    // FOR NORMAL USERS: Let the nav show/hide naturally based on TC section state
    // Don't force hide - only check if we're in TC section
    const tcSection = document.getElementById('teachers-corner-section');
    const isInTCTab = tcSection && tcSection.classList.contains('active');
    const hasClassSelected = state && state.currentClass;
    
    // Only enforce if we're NOT in TC section or no class selected
    if (!isInTCTab && tcNav) {
      // Not in TC section, hide TC nav and show main nav
      const computedDisplay = window.getComputedStyle(tcNav).display;
      if (computedDisplay !== 'none') {
        tcNav.style.display = 'none';
        if (mainNav && window.innerWidth <= 768) {
          mainNav.style.display = 'flex';
        }
      }
    } else if (isInTCTab && hasClassSelected && tcNav) {
      // In TC section with class selected - nav should be visible
      // Don't interfere if it's already showing
      if (window.innerWidth <= 768) {
        const computedDisplay = window.getComputedStyle(tcNav).display;
        if (computedDisplay === 'none') {
          // Nav should be visible but isn't - let showTeachersCornerNav handle it
          // Don't force it here to avoid conflicts
        }
      }
    }
  }
}

// STRICT: MutationObserver to watch for any TC nav display changes
let navObserver = null;

function setupNavObserver() {
  const tcNav = document.getElementById('teachers-corner-bottom-nav');
  if (!tcNav) {
    setTimeout(setupNavObserver, 500);
    return;
  }
  
  // Watch for any changes to the TC nav element - ONLY for admins
  navObserver = new MutationObserver((mutations) => {
    const currentUser = window.currentUser;
    if (!currentUser) return;
    
    const isAdmin = currentUser.role === 'admin';
    if (isAdmin) {
      // FORCE HIDE for admins - override any display changes
      const computedDisplay = window.getComputedStyle(tcNav).display;
      if (computedDisplay !== 'none') {
        console.warn('🚫 [TC Nav Observer] Admin detected - FORCING TC nav to hide');
        tcNav.style.display = 'none';
        tcNav.style.setProperty('display', 'none', 'important');
        tcNav.classList.add('admin-hidden');
      }
    }
    // For normal users, don't interfere - let natural show/hide logic work
  });
  
  // Observe the TC nav element for style changes
  navObserver.observe(tcNav, {
    attributes: true,
    attributeFilter: ['style', 'class'],
    attributeOldValue: true
  });
  
  console.log('✅ [TC Nav] MutationObserver setup complete (watching for admins only)');
}

// STRICT: Run immediately and repeatedly to ensure state (but only enforce for admins)
function enforceNavState() {
  ensureProperNavState();
  
  // Setup MutationObserver (only watches for admins)
  setupNavObserver();
  
  // Run every 3 seconds to catch any state changes (less frequent to avoid conflicts)
  // Only enforce for admins - normal users nav state is managed by show/hide functions
  setInterval(() => {
    const currentUser = window.currentUser;
    if (currentUser && currentUser.role === 'admin') {
      // Only run strict enforcement for admins
      ensureProperNavState();
    }
  }, 3000);
}

// Auto-check on page load
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    setTimeout(enforceNavState, 500); // Start checking immediately
  });
} else {
  setTimeout(enforceNavState, 500);
}

// Export all functions for use in other modules
export default {
  showTeachersCornerNav,
  hideTeachersCornerNav,
  switchTeachersCornerTab,
  initTeachersCornerNav,
  updateTeachersCornerNavState,
  ensureProperNavState
};

