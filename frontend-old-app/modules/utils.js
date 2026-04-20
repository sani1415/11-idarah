// Global variables that need to be exported
const bengaliToEnglish = {
    '০': '0', '১': '1', '২': '2', '৩': '3', '৪': '4',
    '৫': '5', '৬': '6', '৭': '7', '৮': '8', '৯': '9'
};

const bengaliClassMap = {
    'প্রথম শ্রেণি': 1,
    'দ্বিতীয় শ্রেণি': 2,
    'তৃতীয় শ্রেণি': 3,
    'চতুর্থ শ্রেণি': 4,
    'পঞ্চম শ্রেণি': 5
};

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB');
}

function convertBengaliToEnglishNumbers(str) {
    if (!str) return str;
    return str.toString().replace(/[০-৯]/g, match => bengaliToEnglish[match]);
}

function parseRollNumber(rollNumber) {
    if (!rollNumber) return 0;
    const englishNumber = convertBengaliToEnglishNumbers(rollNumber);
    return parseInt(englishNumber) || 0;
}

function getClassNumber(className) {
    if (!className) return 0;
    
    if (bengaliClassMap[className]) {
        return bengaliClassMap[className];
    }
    
    // Fallback to extracting number from class name
    const match = className.match(/(\d+)/);
    return match ? parseInt(match[1]) : 0;
}

// Helper functions that might be needed
function englishNumber(str) {
    return convertBengaliToEnglishNumbers(str);
}

function date(dateString) {
    return formatDate(dateString);
}

function match(str, pattern) {
    return str.match(pattern);
}

// Utility function to get today's date in YYYY-MM-DD format using local timezone
function getTodayString() {
    const today = new Date();
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
}

// Helper function to parse inactivation date
function parseInactivationDate(inactivationDate) {
    if (!inactivationDate) return null;
    
    // If it's already in YYYY-MM-DD format, return as is
    if (typeof inactivationDate === 'string' && inactivationDate.match(/^\d{4}-\d{2}-\d{2}$/)) {
        return inactivationDate;
    }
    
    // If it's a datetime string, extract the date part
    if (typeof inactivationDate === 'string') {
        try {
            const date = new Date(inactivationDate);
            if (!isNaN(date.getTime())) {
                return date.toISOString().split('T')[0]; // Extract YYYY-MM-DD
            }
        } catch (e) {
            console.warn('Failed to parse inactivation date:', inactivationDate);
        }
    }
    
    return null;
}

// ===== PERMISSION CHECKING FUNCTIONS =====

function canAccessSection(sectionId) {
    /**
     * Check if current user can access a section
     * @param {string} sectionId - Section ID (e.g., 'dashboard', 'registration')
     * @returns {boolean} - True if user can access
     */
    const user = window.currentUser;
    if (!user) return false;
    
    // Admin bypass - full access
    if (user.role === 'admin') return true;
    
    // Parse permissions if it's a JSON string
    let permissions = user.permissions;
    if (typeof permissions === 'string') {
        try {
            permissions = JSON.parse(permissions);
        } catch (e) {
            console.warn('Failed to parse user permissions in canAccessSection:', e);
            return false;
        }
    }
    
    // Check permissions for regular users
    const sections = permissions?.sections || {};
    
    // Normalize section ID (remove '-section' suffix)
    const normalizedSection = sectionId.replace('-section', '').replace('teachers-corner-section', 'teachers-corner');
    
    return sections[normalizedSection]?.view === true;
}

function checkPermission(section, action = 'view') {
    /**
     * Check if current user has specific permission for a section
     * @param {string} section - Section name (e.g., 'registration')
     * @param {string} action - Action type ('view' or 'edit')
     * @returns {boolean} - True if user has permission
     */
    const user = window.currentUser;
    if (!user) return false;
    
    // Admin bypass
    if (user.role === 'admin') return true;
    
    // Check permissions
    const permissions = user.permissions?.sections || {};
    const sectionPerms = permissions[section] || {};
    
    return sectionPerms[action] === true;
}

function getFirstAllowedSection() {
    /**
     * Get the first section the user has access to
     * @returns {string|null} - Section ID or null
     */
    const user = window.currentUser;
    if (!user) return null;
    
    const sections = ['dashboard', 'registration', 'attendance', 'reports', 'teachers-corner', 'settings', 'messages'];
    
    for (const section of sections) {
        if (canAccessSection(section)) {
            // Return the actual section ID used in HTML
            if (section === 'teachers-corner') {
                return 'teachers-corner-section';
            }
            return section;
        }
    }
    
    return null;
}

function checkUserHasAnyAccess() {
    /**
     * Check if user has access to at least one section
     * @returns {boolean} - True if user has any access
     */
    const user = window.currentUser;
    if (!user) return false;
    
    if (user.role === 'admin') return true;
    
    const permissions = user.permissions?.sections || {};
    return Object.values(permissions).some(p => p.view === true);
}

function updateNavigationMenu() {
    /**
     * Hide/show navigation items based on user permissions
     * Updates BOTH desktop navigation AND mobile bottom navigation
     */
    const user = window.currentUser;
    if (!user) return;
    
    console.log('🔐 Updating navigation menu for user:', user.username, 'Role:', user.role);
    
    // Map of section IDs to navigation links (DESKTOP NAVIGATION)
    const navMap = {
        'dashboard': document.querySelector('a[href="#dashboard"]')?.parentElement,
        'registration': document.querySelector('a[href="#registration"]')?.parentElement,
        'attendance': document.querySelector('a[href="#attendance"]')?.parentElement,
        'reports': document.querySelector('a[href="#reports"]')?.parentElement,
        'teachers-corner-section': document.querySelector('.nav-item.dropdown'),
        'settings': document.querySelector('a[href="#settings"]')?.parentElement,
        'messages': null // Messages link doesn't exist in navigation
    };
    
    // Map of section IDs to mobile bottom navigation items
    const mobileNavMap = {
        'dashboard': document.querySelector('.mobile-bottom-nav a[href="#dashboard"]'),
        'registration': document.querySelector('.mobile-bottom-nav a[href="#registration"]'),
        'attendance': document.querySelector('.mobile-bottom-nav a[href="#attendance"]'),
        'teachers-corner': document.querySelector('#mobile-teachers-nav'),
        'reports': document.querySelector('.mobile-bottom-nav a[href="#reports"]'),
        'settings': document.querySelector('.mobile-bottom-nav a[href="#settings"]')
    };
    
    console.log('🔐 Found navigation elements:', {
        dashboard: !!navMap.dashboard,
        registration: !!navMap.registration,
        attendance: !!navMap.attendance,
        reports: !!navMap.reports,
        teachersCorner: !!navMap['teachers-corner-section'],
        settings: !!navMap.settings,
        messages: !!navMap.messages
    });
    
    console.log('🔐 Found mobile navigation elements:', {
        dashboard: !!mobileNavMap.dashboard,
        registration: !!mobileNavMap.registration,
        attendance: !!mobileNavMap.attendance,
        teachersCorner: !!mobileNavMap['teachers-corner'],
        more: !!mobileNavMap.messages,
        reports: !!mobileNavMap.reports,
        settings: !!mobileNavMap.settings
    });
    
    // Admin sees everything
    if (user.role === 'admin') {
        console.log('🔐 Admin user - showing all navigation items');
        // Show all desktop navigation items
        Object.entries(navMap).forEach(([section, el]) => {
            if (el) {
                console.log(`🔐 Admin: Showing desktop nav item: ${section}`);
                el.style.display = '';
            } else {
                console.log(`🔐 Admin: Desktop nav item NOT found: ${section}`);
            }
        });
        // Show all mobile navigation items
        Object.entries(mobileNavMap).forEach(([section, el]) => {
            if (el) {
                console.log(`🔐 Admin: Showing mobile nav item: ${section}`);
                // Force display to flex with !important to override any conflicting styles
                el.style.setProperty('display', 'flex', 'important');
            } else {
                console.log(`🔐 Admin: Mobile nav item NOT found: ${section}`);
            }
        });
        
        // Re-initialize mobile nav handlers after showing elements (ensure handlers are attached)
        setTimeout(() => {
            if (typeof window.MobileNav !== 'undefined' && typeof window.MobileNav.init === 'function') {
                console.log('🔐 Re-initializing mobile nav handlers after showing elements...');
                const moreNav = document.getElementById('mobile-more-nav');
                const teachersNav = document.getElementById('mobile-teachers-nav');
                if (moreNav || teachersNav) {
                    window.MobileNav.init();
                } else {
                    console.warn('🔐 Mobile nav elements still not found after delay');
                }
            }
        }, 200);
        
        return;
    }
    
    // Parse permissions if it's a JSON string
    let permissions = user.permissions;
    if (typeof permissions === 'string') {
        try {
            permissions = JSON.parse(permissions);
            console.log('🔐 Parsed permissions for navigation:', permissions);
        } catch (e) {
            console.warn('🔐 Failed to parse user permissions in updateNavigationMenu:', e);
            permissions = {};
        }
    }
    
    // For other users, check permissions
    const sections = permissions?.sections || {};
    console.log('🔐 User permissions sections:', sections);
    
    // Update desktop navigation
    Object.entries(navMap).forEach(([section, element]) => {
        if (!element) {
            console.log(`🔐 Section ${section}: element not found`);
            return;
        }
        
        const sectionKey = section.replace('-section', '');
        const canView = sections[sectionKey]?.view === true;
        
        console.log(`🔐 Section ${sectionKey}: canView=${canView}, element found: ${!!element}`);
        
        // Hide if no permission
        element.style.display = canView ? '' : 'none';
        
        // Additional logging for settings specifically
        if (sectionKey === 'settings') {
            console.log(`🔐 SETTINGS DEBUG: canView=${canView}, sections[settings]=${JSON.stringify(sections.settings)}`);
        }
    });
    
    // Update mobile bottom navigation
    Object.entries(mobileNavMap).forEach(([section, element]) => {
        if (!element) {
            console.log(`🔐 Mobile section ${section}: element not found`);
            return;
        }
        
        // Special handling for "More" menu
        if (section === 'messages') {
            // Check if user has access to Reports or Settings (which are in More menu)
            const canViewReports = sections['reports']?.view === true;
            const canViewSettings = sections['settings']?.view === true;
            const canViewMoreMenu = canViewReports || canViewSettings;
            
            console.log(`🔐 Mobile More menu: canView=${canViewMoreMenu} (Reports: ${canViewReports}, Settings: ${canViewSettings})`);
            element.style.setProperty('display', canViewMoreMenu ? 'flex' : 'none', 'important');
            return;
        }
        
        const sectionKey = section.replace('-section', '');
        const canView = sections[sectionKey]?.view === true;
        
        console.log(`🔐 Mobile section ${sectionKey}: canView=${canView}, element found: ${!!element}`);
        
        // Hide if no permission
        element.style.setProperty('display', canView ? 'flex' : 'none', 'important');
    });
    
    // Re-initialize mobile nav handlers after updating visibility (ensure handlers are attached)
    setTimeout(() => {
        if (typeof window.MobileNav !== 'undefined' && typeof window.MobileNav.init === 'function') {
            console.log('🔐 Re-initializing mobile nav handlers after permission update...');
            const moreNav = document.getElementById('mobile-more-nav');
            const teachersNav = document.getElementById('mobile-teachers-nav');
            if (moreNav || teachersNav) {
                window.MobileNav.init();
            } else {
                console.warn('🔐 Mobile nav elements still not found after permission update');
            }
        }
    }, 200);
    
    console.log('✅ Navigation menu updated for both desktop and mobile');
}

function getUserAllowedClasses() {
    /**
     * Get list of classes the current user can access
     * @returns {Array} - Array of class names or ['all']
     */
    const user = window.currentUser;
    if (!user) return [];
    
    // Admin sees all
    if (user.role === 'admin') return ['all'];
    
    // Parse permissions if it's a JSON string
    let permissions = user.permissions;
    if (typeof permissions === 'string') {
        try {
            permissions = JSON.parse(permissions);
        } catch (e) {
            console.warn('Failed to parse user permissions in getUserAllowedClasses:', e);
            return [];
        }
    }
    
    if (!permissions) return [];
    
    return permissions.classes || [];
}

export { 
    bengaliClassMap, 
    bengaliToEnglish, 
    convertBengaliToEnglishNumbers, 
    date, 
    englishNumber, 
    formatDate, 
    getClassNumber, 
    match, 
    parseRollNumber, 
    getTodayString, 
    parseInactivationDate,
    canAccessSection,
    checkPermission,
    getFirstAllowedSection,
    checkUserHasAnyAccess,
    updateNavigationMenu,
    getUserAllowedClasses
}
