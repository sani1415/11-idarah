import * as Messaging from './messaging.js';

let currentCalendarMonth = new Date().getMonth();
let currentCalendarYear = new Date().getFullYear();

function toggleMobileMenu() {
    const navList = document.getElementById('navList');
    const toggleButton = document.querySelector('.mobile-menu-toggle i');
    
    navList.classList.toggle('active');
    
    // Change icon
    if (navList.classList.contains('active')) {
        toggleButton.className = 'fas fa-times';
    } else {
        toggleButton.className = 'fas fa-bars';
    }
}

// Navigation state tracking
const navigationState = {
    lastVisited: {},
    isInitialized: false,
    cacheTimeout: 30000 // 30 seconds cache
};

// Function to clear navigation cache (call when data changes)
function clearNavigationCache(sectionId = null) {
    if (sectionId) {
        delete navigationState.lastVisited[sectionId];
        console.log(`🗑️ Cleared cache for ${sectionId}`);
    } else {
        navigationState.lastVisited = {};
        console.log('🗑️ Cleared all navigation cache');
    }
}

// Make cache clearing function globally accessible
window.clearNavigationCache = clearNavigationCache;

async function showSection(sectionId, event) {
    console.log('🔍 showSection called with:', sectionId);
    console.log('🔍 window.currentUser:', window.currentUser);

    // Keep scroll fixed first so the view never jumps or zigzags
    window.scrollTo(0, 0);
    const mainEl = document.querySelector('.app-layout .main');
    if (mainEl) mainEl.scrollTop = 0;

    // Permission-based access control
    if (typeof window.canAccessSection === 'function') {
        const hasAccess = window.canAccessSection(sectionId);
        console.log(`🔍 Permission check for ${sectionId}:`, hasAccess);
        
        if (!hasAccess) {
            console.log('❌ Access denied to section:', sectionId);
            
            // Show error message
            if (typeof showModal === 'function') {
                showModal('Access Denied', 
                    'You do not have permission to access this section. Please contact your administrator if you need access.');
            }
            
            // Redirect to first allowed section
            if (typeof window.getFirstAllowedSection === 'function') {
                const firstAllowedSection = window.getFirstAllowedSection();
                if (firstAllowedSection && firstAllowedSection !== sectionId) {
                    window.location.hash = firstAllowedSection;
                    return;
                }
            }
            
            return; // Stop here - no access
        }
        console.log('✅ Access granted to section:', sectionId);
    }

    if (typeof window.enforceAttendanceCatchUpNavigation === 'function' &&
        window.enforceAttendanceCatchUpNavigation(sectionId)) {
        console.log('⛔ Navigation blocked by attendance catch-up lock:', sectionId);
        return;
    }
    
    // Hide all sections
    const sections = document.querySelectorAll('.section');
    sections.forEach(section => {
        section.classList.remove('active');
    });
    
    // Remove active class from nav links
    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => link.classList.remove('active'));
    
    // Handle Teachers Corner navigation visibility
    // IMPORTANT: TC nav only for normal users, admins always use main nav
    if (sectionId === 'teachers-corner-section') {
        // Check if user is normal user (not admin)
        const isNormalUser = window.currentUser && window.currentUser.role === 'user';
        
        if (isNormalUser && window.innerWidth <= 768 && typeof window.showTeachersCornerNav === 'function') {
            // Only show TC nav for normal users on mobile
            setTimeout(() => {
                window.showTeachersCornerNav();
            }, 100);
        } else if (!isNormalUser) {
            // For admins, ensure main nav is visible
            const mainNav = document.querySelector('.mobile-bottom-nav');
            if (mainNav && window.innerWidth <= 768) {
                mainNav.style.display = 'flex';
            }
            // Hide TC nav if it's showing
            const tcNav = document.getElementById('teachers-corner-bottom-nav');
            if (tcNav) {
                tcNav.style.display = 'none';
            }
        }
    } else {
        // Hide Teachers Corner nav, show main nav (mobile only)
        // This works for both admin and normal users
        if (window.innerWidth <= 768 && typeof window.hideTeachersCornerNav === 'function') {
            window.hideTeachersCornerNav();
        }
    }
    
    // Show selected section
    const targetSection = document.getElementById(sectionId);
    if (targetSection) {
        console.log(`✅ Found section: ${sectionId}, adding active class`);
        targetSection.classList.add('active');
        console.log(`✅ Section ${sectionId} is now active`);
    } else {
        console.error(`❌ Section with id '${sectionId}' not found!`);
    }
    
    // Add active class to clicked nav link (or the one matching current section)
    if (event && event.target && event.target.classList && event.target.classList.contains('nav-link')) {
        event.target.classList.add('active');
    } else {
        const link = document.querySelector(`.nav-link[href="#${sectionId}"]`);
        if (link) link.classList.add('active');
    }

    // Close mobile menu on mobile devices
    const navList = document.getElementById('navList');
    const toggleButton = document.querySelector('.mobile-menu-toggle i');
    if (window.innerWidth <= 768) {
        navList.classList.remove('active');
        toggleButton.className = 'fas fa-bars';
    }
    
    // Update content based on section (optimized with smart caching)
    if (sectionId === 'dashboard') {
        // Smart caching: only update if not recently visited or data is stale
        const now = Date.now();
        const lastVisit = navigationState.lastVisited.dashboard || 0;
        const shouldUpdate = !navigationState.lastVisited.dashboard || 
                           (now - lastVisit) > navigationState.cacheTimeout;
        
        if (typeof updateDashboard === 'function') {
            if (shouldUpdate) {
                console.log('🔄 Dashboard: Loading fresh data...');
                setTimeout(() => {
                    updateDashboard();
                    navigationState.lastVisited.dashboard = now;
                }, 0);
            } else {
                console.log('⚡ Dashboard: Using cached data (instant)');
            }
        }
    } else if (sectionId === 'attendance') {
        // Set today's date automatically when attendance section is shown
        const attendanceDateInput = document.getElementById('attendanceDate');
        if (attendanceDateInput && !attendanceDateInput.value) {
            const today = new Date();
            attendanceDateInput.value = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
        }
        
        // Update date input max to prevent future dates
        if (typeof updateDateInputMax === 'function') {
            updateDateInputMax();
        }
        
        // Smart caching for attendance: only load if not recently visited
        const now = Date.now();
        const lastVisit = navigationState.lastVisited.attendance || 0;
        const shouldUpdate = !navigationState.lastVisited.attendance || 
                           (now - lastVisit) > navigationState.cacheTimeout;
        
        if (typeof loadAttendanceForDate === 'function') {
            if (shouldUpdate) {
                console.log('🔄 Attendance: Loading fresh data...');
                setTimeout(async () => {
                    await loadAttendanceForDate();
                    navigationState.lastVisited.attendance = now;
                }, 0);
            } else {
                console.log('⚡ Attendance: Using cached data (instant)');
            }
        }
    } else if (sectionId === 'registration') {
        // Always clear filters and show full list when opening Register Student
        if (typeof window.clearStudentFilters === 'function') {
            window.clearStudentFilters();
        }
        const now = Date.now();
        const lastVisit = navigationState.lastVisited.registration || 0;
        const shouldUpdate = !navigationState.lastVisited.registration ||
                           (now - lastVisit) > navigationState.cacheTimeout;

        if (typeof displayStudentsList === 'function') {
            if (shouldUpdate) {
                console.log('🔄 Registration: Loading fresh data...');
                setTimeout(() => {
                    displayStudentsList();
                    navigationState.lastVisited.registration = now;
                }, 0);
            } else {
                console.log('⚡ Registration: Using cached data (instant)');
            }
        }
        // Force clear filters and re-render full list after section is visible (avoids showing filtered list on open)
        setTimeout(() => {
            if (typeof window.clearStudentFilters === 'function') {
                window.clearStudentFilters();
            }
        }, 50);

        // Update class dropdowns when registration section is shown
        if (typeof updateClassDropdowns === 'function') {
            setTimeout(() => {
                updateClassDropdowns();
            }, 0);
        }
        // Show student list by default, hide form
        const studentsListContainer = document.getElementById('studentsListContainer');
        const studentRegistrationForm = document.getElementById('studentRegistrationForm');
        if (studentsListContainer && studentRegistrationForm) {
            studentsListContainer.style.display = 'block';
            studentRegistrationForm.style.display = 'none';
        }
    } else if (sectionId === 'teachers-corner-section') {
        console.log('🎓 Teachers Corner section activated');
        
        // Initialize teachers corner with proper timing
        if (typeof window.initTeachersCorner === 'function') {
            // Use a small delay to ensure DOM is ready (critical for Teachers Corner)
            setTimeout(() => {
                try {
                    window.initTeachersCorner();
                    console.log('✅ Teachers Corner initialized successfully');
                } catch (error) {
                    console.error('❌ Error in initTeachersCorner:', error);
                }
            }, 50); // Keep small delay for DOM readiness
        }
        
        // Ensure section is visible
        const teachersCornerSection = document.getElementById('teachers-corner-section');
        if (teachersCornerSection && !teachersCornerSection.classList.contains('active')) {
            teachersCornerSection.classList.add('active');
        }
        
        console.log('✅ Teachers Corner section setup completed');
    } else if (sectionId === 'education') {
        console.log('🔄 Education tab selected, loading data...');
        console.log('🔍 Checking available functions...');
        console.log('🔍 typeof loadEducationProgress:', typeof loadEducationProgress);
        console.log('🔍 typeof loadBooks:', typeof loadBooks);
        console.log('🔍 typeof updateBookDropdowns:', typeof updateBookDropdowns);
        console.log('🔍 window.loadEducationProgress:', window.loadEducationProgress);
        console.log('🔍 window.loadBooks:', window.loadBooks);
        console.log('🔍 window.updateBookDropdowns:', window.updateBookDropdowns);
        
        // Access education functions through global scope
        if (typeof loadEducationProgress === 'function') {
            console.log('✅ loadEducationProgress function found, calling...');
            await loadEducationProgress();
            console.log('✅ loadEducationProgress completed');
        } else {
            console.error('❌ loadEducationProgress function not found');
            // Try to access through window object
            if (typeof window.loadEducationProgress === 'function') {
                console.log('✅ loadEducationProgress found in window, calling...');
                await window.loadEducationProgress();
                console.log('✅ window.loadEducationProgress completed');
            } else {
                console.error('❌ loadEducationProgress not found in window either');
            }
        }
        // Also load books to populate the dropdown
        if (typeof loadBooks === 'function') {
            console.log('✅ loadBooks function found, calling...');
            await loadBooks();
            console.log('✅ loadBooks completed');
        } else {
            console.error('❌ loadBooks function not found');
            // Try to access through window object
            if (typeof window.loadBooks === 'function') {
                console.log('✅ loadBooks found in window, calling...');
                await window.loadBooks();
                console.log('✅ window.loadBooks completed');
            } else {
                console.error('❌ loadBooks not found in window either');
            }
        }
        // Update book dropdowns
        if (typeof updateBookDropdowns === 'function') {
            console.log('✅ updateBookDropdowns function found, calling...');
            updateBookDropdowns();
            console.log('✅ updateBookDropdowns completed');
        } else {
            console.error('❌ updateBookDropdowns function not found');
            // Try to access through window object
            if (typeof window.updateBookDropdowns === 'function') {
                console.log('✅ updateBookDropdowns found in window, calling...');
                window.updateBookDropdowns();
                console.log('✅ window.updateBookDropdowns completed');
            } else {
                console.error('❌ updateBookDropdowns not found in window either');
            }
        }
        console.log('✅ Education tab data loading completed');
    } else if (sectionId === 'settings') {
        console.log('🔄 Settings section selected, loading data...');
        
        // Load app name and short name when settings section is opened
        if (typeof window.loadAppName === 'function') {
            console.log('✅ loadAppName function found, calling...');
            window.loadAppName();
            console.log('✅ loadAppName completed');
        }
        
        // Load Development Mode toggle (only on localhost)
        if (typeof window.loadDevMode === 'function') {
            window.loadDevMode();
        }
        
        // Load alert settings
        if (typeof loadSettingsData === 'function') {
            console.log('✅ loadSettingsData function found, calling...');
            loadSettingsData();
            console.log('✅ loadSettingsData completed');
        } else if (typeof window.loadSettingsData === 'function') {
            console.log('✅ loadSettingsData found in window, calling...');
            window.loadSettingsData();
            console.log('✅ window.loadSettingsData completed');
        }
        
        // Access settings functions through global scope
        if (typeof displayClasses === 'function') {
            console.log('✅ displayClasses function found, calling...');
            displayClasses();
            console.log('✅ displayClasses completed');
        } else {
            console.error('❌ displayClasses function not found');
            // Try to access through window object
            if (typeof window.displayClasses === 'function') {
                console.log('✅ displayClasses found in window, calling...');
                window.displayClasses();
                console.log('✅ window.displayClasses completed');
            } else {
                console.error('❌ displayClasses not found in window either');
            }
        }
        
        // Holiday management removed - no longer needed
        
        if (typeof loadBooks === 'function') {
            console.log('✅ loadBooks function found, calling...');
            await loadBooks();
            console.log('✅ loadBooks completed');
        } else {
            console.error('❌ loadBooks function not found');
            // Try to access through window object
            if (typeof window.loadBooks === 'function') {
                console.log('✅ loadBooks found in window, calling...');
                window.loadBooks();
                console.log('✅ window.loadBooks completed');
            } else {
                console.error('❌ loadBooks not found in window either');
            }
        }
        
        // Update class dropdowns to show real database classes
        if (typeof updateClassDropdowns === 'function') {
            console.log('✅ updateClassDropdowns function found, calling...');
            updateClassDropdowns();
            console.log('✅ updateClassDropdowns completed');
        } else {
            console.error('❌ updateClassDropdowns function not found');
        }
        
        // Update book dropdowns to show real database books
        if (typeof updateBookDropdowns === 'function') {
            console.log('✅ updateBookDropdowns function found, calling...');
            updateBookDropdowns();
            console.log('✅ updateBookDropdowns completed');
        } else {
            console.error('❌ updateBookDropdowns function not found');
        }
        
        console.log('✅ Settings section data loading completed');
    } else if (sectionId === 'messages') {
        console.log('🔄 Messages section selected, initializing messaging...');
        console.log('🔍 Messaging module check:', typeof Messaging);
        console.log('🔍 Messaging.initializeMessaging check:', typeof Messaging?.initializeMessaging);
        
        // Initialize messaging system
        if (typeof Messaging !== 'undefined' && typeof Messaging.initializeMessaging === 'function') {
            console.log('✅ Messaging module found, initializing...');
            await Messaging.initializeMessaging();
            console.log('✅ Messaging initialization completed');
            
            // Check if Messages section is visible after initialization
            const messagesSection = document.getElementById('messages');
            if (messagesSection) {
                console.log('🔍 Messages section found, checking visibility...');
                console.log('🔍 Messages section classes:', messagesSection.className);
                console.log('🔍 Messages section display:', window.getComputedStyle(messagesSection).display);
            }
        } else {
            console.error('❌ Messaging module not found');
            // Try to access through window object
            if (typeof window.initializeMessaging === 'function') {
                console.log('✅ initializeMessaging found in window, calling...');
                await window.initializeMessaging();
                console.log('✅ window.initializeMessaging completed');
            } else {
                console.error('❌ initializeMessaging not found in window either');
            }
        }
        
        console.log('✅ Messages section initialization completed');
    }
}



function testCalendarRefresh() {
    console.log('=== Testing Calendar Refresh ===');
    console.log('Current attendance data:', attendance);
    console.log('Saved attendance dates:', Array.from(savedAttendanceDates));
    refreshAttendanceCalendarIfVisible();
    forceRefreshAttendanceCalendar();
    console.log('=== Test Complete ===');
}

function debugSavedDates() {
    console.log('=== DEBUG SAVED DATES ===');
    console.log('savedAttendanceDates:', Array.from(savedAttendanceDates));
    console.log('Total saved dates:', savedAttendanceDates.size);
    console.log('Current attendance object keys:', Object.keys(attendance));
    console.log('Current attendance object:', attendance);
    console.log('========================');
}


function showAttendanceCalendar() {
    try {
        console.log('Starting showAttendanceCalendar function...');
        
        const reportsSection = document.getElementById('reports');
        if (!reportsSection) {
            console.error('Reports section not found');
            return;
        }
        
        const existingCalendar = reportsSection.querySelector('.attendance-tracking-section');
        const toggleButton = reportsSection.querySelector('.calendar-toggle button');
        
        if (!toggleButton) {
            console.error('Toggle button not found');
            return;
        }
        
        if (existingCalendar) {
            // If calendar exists, toggle its visibility
            console.log('Calendar exists, toggling visibility...');
            if (existingCalendar.style.display === 'none') {
                existingCalendar.style.display = 'block';
                toggleButton.innerHTML = `📅 ${t('hideAttendanceTrackingCalendar')}`;
                console.log('Calendar shown');
            } else {
                existingCalendar.style.display = 'none';
                toggleButton.innerHTML = `📅 ${t('showAttendanceTrackingCalendar')}`;
                console.log('Calendar hidden');
            }
        } else {
            // Create new calendar
            console.log('Creating new calendar...');
            console.log('Attendance data:', Object.keys(attendance).length, 'dates');
            console.log('Holidays data:', holidays.length, 'holidays');
            
            const calendarHTML = typeof generateAttendanceTrackingCalendar === 'function' ? generateAttendanceTrackingCalendar() : '';
            const calendarToggle = reportsSection.querySelector('.calendar-toggle');
            
            if (calendarToggle) {
                calendarToggle.insertAdjacentHTML('afterend', calendarHTML);
                toggleButton.innerHTML = `📅 ${t('hideAttendanceTrackingCalendar')}`;
                console.log('Calendar created and inserted successfully');
            } else {
                console.error('Calendar toggle section not found');
            }
        }
    } catch (error) {
        console.error('Error in showAttendanceCalendar:', error);
        showModal('Error', 'Failed to load attendance calendar. Please try again.');
    }
}

function generateFromBeginningReport() {
    console.log("Generating from beginning report...");
    
    if (!academicYearStartDate) {
        showModal(t('error'), t('noAcademicYearSet'));
        return;
    }
    
    const startDate = academicYearStartDate;
    const endDate = new Date().toISOString().split('T')[0]; // Today's date
    const reportResults = document.getElementById('reportResults');
    const reportClassElement = document.getElementById('reportClass');
    const selectedClass = reportClassElement ? reportClassElement.value : '';
    
    console.log(`From Beginning Date Range: ${startDate} to ${endDate}, Class: ${selectedClass || 'All'}`);
    
    generateReportWithDates(startDate, endDate, selectedClass, true);
}

function generateReport() {
    console.log("Generating report...");
    const startDate = document.getElementById('reportStartDate').value;
    const endDate = document.getElementById('reportEndDate').value;
    const reportResults = document.getElementById('reportResults');
    const reportClassElement = document.getElementById('reportClass');
    const selectedClass = reportClassElement ? reportClassElement.value : '';
    
    console.log(`Date Range: ${startDate} to ${endDate}, Class: ${selectedClass || 'All'}`);
    
    if (!startDate || !endDate) {
        showModal(t('error'), 'Please select both a start and end date.');
        return;
    }
    
    generateReportWithDates(startDate, endDate, selectedClass, false);
}

function generateReportWithDates(startDate, endDate, selectedClass, fromBeginning) {
    const reportResults = document.getElementById('reportResults');
    
        reportResults.innerHTML = '<p><i class="fas fa-spinner fa-spin"></i> Generating report...</p>';
    
    // Use a short timeout to allow the UI to update before processing
    setTimeout(() => {
        try {
            console.log("Filtering students...");
            // MODIFICATION: Start with only active students
            let filteredStudents = students.filter(student => student.status !== 'inactive');
            
            if (selectedClass) {
                // This now filters the already-active list
                filteredStudents = filteredStudents.filter(student => student.class === selectedClass);
            }
            console.log(`${filteredStudents.length} students to process.`);
            
            const reportData = filteredStudents.map(student => {
                // Simple attendance calculation for reports
                let present = 0, absent = 0, leave = 0, totalSchoolDays = 0;
                const start = new Date(startDate);
                const end = new Date(endDate);
                
                for (let d = start; d <= end; d.setDate(d.getDate() + 1)) {
                    const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
                    
                    // Holiday status is now handled in attendance data, not blocked here
                    if (!attendance[dateStr] || Object.keys(attendance[dateStr]).length === 0) continue;
                    
                    const record = attendance[dateStr] ? attendance[dateStr][student.id] : null;
                    
                    if (record) {
                        if (record.status === 'present') {
                            present++;
                            totalSchoolDays++;
                        } else if (record.status === 'absent') {
                            absent++;
                            totalSchoolDays++;
                        } else if (record.status === 'leave') {
                            leave++;
                            totalSchoolDays++;
                        }
                        // Note: 'holiday' status is not counted in totalSchoolDays or attendance calculations
                    } else {
                        absent++;
                        totalSchoolDays++;
                    }
                }
                
                const attendanceRate = totalSchoolDays > 0 ? Math.round((present / (totalSchoolDays - leave)) * 100) : 0;
                
        return {
                    ...student,
                    presentDays: present,
                    absentDays: absent,
                    leaveDays: leave,
                    attendanceRate: isNaN(attendanceRate) ? 0 : attendanceRate
                };
            }).sort((a, b) => {
                const classA = getClassNumber(a.class);
                const classB = getClassNumber(b.class);
                if (classA !== classB) return classA - classB;
                return parseRollNumber(a.rollNumber) - parseRollNumber(b.rollNumber);
            });
            
            console.log("Report data calculated:", reportData);

            if (reportData.length === 0) {
                reportResults.innerHTML = '<p>No attendance data found for the selected criteria.</p>';
                return;
            }
            
            const reportTitle = fromBeginning ? t('fromBeginningReport') : t('attendanceReport');
            
    reportResults.innerHTML = `
                <div class="report-header">
                    <h4>${reportTitle} (${formatDate(startDate)} ${t('to')} ${formatDate(endDate)})</h4>
                    ${fromBeginning ? '<p style="color: #27ae60; font-weight: bold;">📚 Academic Year Report - From Beginning</p>' : ''}
                </div>
        <div class="report-table-container">
                    <table class="report-table">
                <thead>
                    <tr>
                                <th>${t('roll')}</th>
                                <th>${t('name')}</th>
                                <th>${t('class')}</th>
                                <th>${t('present')}</th>
                                <th>${t('absent')}</th>
                                <th>${t('leaveDays')}</th>
                                <th>${t('rate')}</th>
                    </tr>
                </thead>
                <tbody>
                            ${reportData.map(data => `
                        <tr>
                                    <td>${data.rollNumber}</td>
                                    <td><span class="clickable-name" onclick="showStudentDetail('${data.id}')">${data.name} বিন ${data.fatherName}</span></td>
                                    <td>${data.class}</td>
                            <td class="status-present">${data.presentDays}</td>
                            <td class="status-absent">${data.absentDays}</td>
                                    <td>${data.leaveDays}</td>
                                    <td><strong>${data.attendanceRate}%</strong></td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
    `;
            
            // Add Hijri date to the report
            addHijriToReports(startDate, endDate);
            console.log("Report display updated.");
        } catch (error) {
            console.error("Error generating report:", error);
            reportResults.innerHTML = '<p class="text-danger">An error occurred while generating the report. Please check the console for details.</p>';
            }
        }, 50);
}


function saveData() {
    // Database-only approach - data is automatically saved to database via API calls
    // No localStorage saving needed
    console.log('Data saved to database via API calls');
}

function showModal(title, message, isHTML = false) {
    const modal = document.getElementById('modal');
    const modalBody = document.getElementById('modalBody');
    
    if (isHTML) {
        // For HTML content, use the message directly
        modalBody.innerHTML = message;
    } else {
        // For simple text messages
        modalBody.innerHTML = `
            <h3>${title}</h3>
            <p>${message}</p>
            <button onclick="closeModal()" class="btn btn-primary">${t('ok')}</button>
        `;
    }
    
    modal.style.display = 'block';
}

function closeModal() {
    document.getElementById('modal').style.display = 'none';
}

function showEncodingErrorModal(message) {
    const modal = document.getElementById('modal');
    const modalBody = document.getElementById('modalBody');
    
    modalBody.innerHTML = `
        <h3 style="color: #e74c3c;">🔤 Bengali Text Encoding Error</h3>
        <div style="
            background: #fff3cd; 
            border: 1px solid #ffeaa7; 
            border-radius: 8px; 
            padding: 15px; 
            margin: 15px 0;
            white-space: pre-line;
            line-height: 1.6;
            text-align: left;
            font-size: 14px;
            color: #856404;
        ">${message}</div>
        <button onclick="closeModal()" class="btn btn-primary">${t('ok')}</button>
    `;
    
    modal.style.display = 'block';
}

function debugClassNames() {
    console.log("=== CLASS NAME DEBUG ===");
    console.log("Predefined classes:");
    if (window.classes && Array.isArray(window.classes)) {
        window.classes.forEach((cls, index) => {
            console.log(`${index + 1}. "${cls.name}" (Length: ${cls.name.length})`);
        });
    } else {
        console.log("No classes loaded yet");
    }
    
    console.log("\nClasses found in student data:");
    const studentClasses = [...new Set(students.map(s => s.class))];
    studentClasses.forEach((className, index) => {
        const isMatching = window.classes && window.classes.some(cls => cls.name === className);
        console.log(`${index + 1}. "${className}" (Length: ${className.length}) - ${isMatching ? '✅ MATCHES' : '❌ NO MATCH'}`);
        
        if (!isMatching) {
            console.log(`   Character codes: ${Array.from(className).map(c => c.charCodeAt(0)).join(', ')}`);
        }
    });
    
    console.log("\nPredefined class character codes:");
    if (window.classes && Array.isArray(window.classes)) {
        window.classes.forEach((cls, index) => {
            console.log(`${index + 1}. "${cls.name}" - ${Array.from(cls.name).map(c => c.charCodeAt(0)).join(', ')}`);
        });
    }
}

function addHijriToReports(startDate, endDate) {
    // This function can be called when generating reports to include Hijri dates
    const reportResults = document.getElementById('reportResults');
    if (reportResults && window.hijriCalendar) {
        // Add Hijri date information to report headers if needed
        const currentLang = localStorage.getItem('language') || 'en';
        
        if (startDate && endDate) {
            const startHijri = hijriCalendar.getHijriForDate(startDate);
            const endHijri = hijriCalendar.getHijriForDate(endDate);
            
            let reportHeader = document.getElementById('reportHijriHeader');
            if (!reportHeader) {
                reportHeader = document.createElement('div');
                reportHeader.id = 'reportHijriHeader';
                reportHeader.className = 'report-hijri-header';
                reportResults.insertBefore(reportHeader, reportResults.firstChild);
            }
            
            const startHijriStr = hijriCalendar.formatHijriDate(startHijri, currentLang);
            const endHijriStr = hijriCalendar.formatHijriDate(endHijri, currentLang);
            
            reportHeader.innerHTML = `
                <div class="hijri-date-range" style="margin-bottom: 15px; padding: 10px; background: #f8f9fa; border-radius: 5px; text-align: center;">
                    <i class="fas fa-moon"></i>
                    <span><strong>হিজরি তারিখ:</strong> ${startHijriStr} - ${endHijriStr}</span>
                </div>
            `;
        }
    }
}

document.addEventListener('DOMContentLoaded', function() {
    const confirmationInput = document.getElementById('resetConfirmationInput');
    if (confirmationInput) {
        confirmationInput.addEventListener('input', function() {
            const confirmBtn = document.getElementById('confirmResetBtn');
            const inputValue = this.value.trim().toUpperCase();
            confirmBtn.disabled = inputValue !== 'RESET';
        });
    }
});


// Settings tab switching function
function openSettingsTab(evt, tabName) {
    // Load app name when general tab is opened
    if (tabName === 'general' && typeof window.loadAppName === 'function') {
        window.loadAppName();
    }
    // Get all elements with class="tab-content" and hide them
    const tabcontent = document.querySelectorAll(".tab-content");
    tabcontent.forEach(tc => tc.style.display = "none");

    // Get all elements with class="tab-button" and remove the class "active"
    const tablinks = document.querySelectorAll(".tab-button");
    tablinks.forEach(tl => tl.classList.remove("active"));

    // Show the current tab, and add an "active" class to the button that opened the tab
    document.getElementById(tabName).style.display = "block";
    evt.currentTarget.classList.add("active");
}

export { currentCalendarMonth, currentCalendarYear, toggleMobileMenu, showSection, testCalendarRefresh, debugSavedDates, showAttendanceCalendar, generateFromBeginningReport, generateReport, generateReportWithDates, saveData, showModal, closeModal, showEncodingErrorModal, debugClassNames, addHijriToReports, openSettingsTab }

// Make showSection globally available for HTML onclick handlers
window.showSection = showSection;
