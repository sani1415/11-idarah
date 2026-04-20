import { getTodayString, parseInactivationDate } from './utils.js';
import { t } from '../translations.js';
import * as Messaging from './messaging.js';
import * as TeacherLogs from './teacher-logs.js';

async function updateDashboard() {
    // Use local date methods to avoid timezone issues (same as attendance module)
    const today = getTodayString();
    
    // NEW: Fetch counts from the health endpoint for accuracy
    try {
        const response = await fetch('/api/health', {
            credentials: 'include'
        });
        if (response.ok) {
            const healthData = await response.json();
            document.getElementById('inactiveStudents').textContent = healthData.inactive_students_count || 0;

            // Show/hide year setup banner
            const banner = document.getElementById('yearSetupBanner');
            if (banner) {
                if (healthData.year_needs_setup) {
                    // Translate banner texts if i18n is ready
                    const titleEl = document.getElementById('yearSetupBannerTitle');
                    const descEl = document.getElementById('yearSetupBannerDesc');
                    const btnEl = banner.querySelector('.year-setup-banner-btn');
                    if (titleEl && typeof t === 'function') titleEl.textContent = t('yearSetupNeededTitle');
                    if (descEl && typeof t === 'function') descEl.textContent = t('yearSetupNeededDesc');
                    if (btnEl && typeof t === 'function') btnEl.textContent = t('goToYearSetup');
                    banner.style.display = 'flex';
                } else {
                    banner.style.display = 'none';
                }
            }
        } else {
            // Fallback for safety
            document.getElementById('inactiveStudents').textContent = t('na');
        }
    } catch (error) {
        console.error("Failed to fetch dashboard stats:", error);
        document.getElementById('inactiveStudents').textContent = t('na');
    }
    
    console.log('Updating dashboard for date:', today);
    console.log('Total students in database:', students.length);
    console.log('Today attendance data:', attendance[today]);
    
    // Holiday notice removed - holidays are now handled as attendance status
    const holidayNotice = document.getElementById('holidayNotice');
    if (holidayNotice) {
        holidayNotice.style.display = 'none';
    }
    
    const todayAttendance = attendance[today] || {};
    console.log('Processing attendance for today:', todayAttendance);
    
    // Use date-aware filtering to get students who were active on today's date
    const activeStudentsForToday = students.filter(student => {
        // If student is currently active, always include them
        if (student.status === 'active') {
            return true;
        }
        
        // If student is inactive, check if they were active on today's date
        if (student.status === 'inactive' && student.inactivationDate) {
            const parsedInactivationDate = parseInactivationDate(student.inactivationDate);
            // Include if today is before the inactivation date
            // This means the student was still active today
            return parsedInactivationDate ? today < parsedInactivationDate : false;
        }
        
        // If student is inactive but has no inactivation date, exclude them
        return false;
    });
    
    let presentCount = 0;
    let absentCount = 0;
    
    // Count attendance properly for active students only
    for (const studentId in todayAttendance) {
        // Only count if this student was active for today
        const student = students.find(s => s.id === studentId);
        if (student) {
            const isActiveForToday = student.status === 'active' || 
                (student.status === 'inactive' && student.inactivationDate && 
                 (() => {
                     const parsedDate = parseInactivationDate(student.inactivationDate);
                     return parsedDate ? today < parsedDate : false;
                 })());
            
            if (isActiveForToday) {
                const att = todayAttendance[studentId];
                if (att && att.status === 'present') {
                    presentCount++;
                } else if (att && att.status === 'absent') {
                    absentCount++;
                }
                // Note: Holiday status is not counted in present/absent for attendance rate calculation
            }
        }
    }
    
    const unmarkedCount = activeStudentsForToday.length - presentCount - absentCount;
    
    console.log('Active students for today:', activeStudentsForToday.length);
    console.log('Attendance counts - Present:', presentCount, 'Absent:', absentCount, 'Unmarked:', unmarkedCount);
    
    // Force update DOM elements with immediate value changes
    const presentElement = document.getElementById('presentToday');
    const absentElement = document.getElementById('absentToday');
    const rateElement = document.getElementById('attendanceRate');
    const totalElement = document.getElementById('totalStudents');
    
    if (totalElement) {
        totalElement.textContent = activeStudentsForToday.length;
        totalElement.style.color = '#2c3e50';
    }
    
    if (presentElement) {
        presentElement.textContent = presentCount;
        presentElement.style.color = '#27ae60';
    }
    
    if (absentElement) {
        absentElement.textContent = absentCount;
        absentElement.style.color = '#e74c3c';
    }
    
    // Calculate attendance rate
    let attendanceRate;
    if (presentCount + absentCount === 0) {
        attendanceRate = 0;
    } else {
        attendanceRate = Math.round((presentCount / (presentCount + absentCount)) * 100);
    }
    
    console.log('Final dashboard values - Total:', activeStudentsForToday.length, 'Present:', presentCount, 'Absent:', absentCount, 'Rate:', attendanceRate + '%');
    
    if (rateElement) {
        rateElement.textContent = `${attendanceRate}%`;
        rateElement.style.color = attendanceRate >= 80 ? '#27ae60' : attendanceRate >= 60 ? '#f39c12' : '#e74c3c';
    }
    
    // Update class-wise information
    updateClassWiseStats();
    
    // Update performance metrics
    updatePerformanceMetrics();
    
    // Update main dashboard alerts
    updateMainDashboardAlerts();
    
    // Update students with absences count
    updateStudentsWithAbsences();
    
    // Load book progress summary
    loadBookProgressSummary();
    
    // Update Hijri date display
    if (typeof updateDashboardWithHijri === 'function') {
        updateDashboardWithHijri();
    }
}

function updateTodayOverview() {
    // Use local date methods to avoid timezone issues (same as attendance module)
    const today = getTodayString();
    const todayAttendance = attendance[today] || {};
    const overviewDiv = document.getElementById('todayOverview');
    
    // Use date-aware filtering to get students who were active on today's date
    const activeStudentsForToday = students.filter(student => {
        // If student is currently active, always include them
        if (student.status === 'active') {
            return true;
        }
        
        // If student is inactive, check if they were active on today's date
        if (student.status === 'inactive' && student.inactivationDate) {
            const parsedInactivationDate = parseInactivationDate(student.inactivationDate);
            // Include if today is before the inactivation date
            // This means the student was still active today
            return parsedInactivationDate ? today < parsedInactivationDate : false;
        }
        
        // If student is inactive but has no inactivation date, exclude them
        return false;
    });
    
    if (activeStudentsForToday.length === 0) {
        overviewDiv.innerHTML = `<p>${t('noStudentsRegistered')}</p>`;
        return;
    }
    
    if (Object.keys(todayAttendance).length === 0) {
        overviewDiv.innerHTML = `<p>${t('noAttendanceData')}</p>`;
        return;
    }
    
    const presentStudents = activeStudentsForToday.filter(student => 
        todayAttendance[student.id] && todayAttendance[student.id].status === 'present'
    );
    
    const absentStudents = activeStudentsForToday.filter(student => 
        todayAttendance[student.id] && todayAttendance[student.id].status === 'absent'
    );
    
    let html = `
        <div class="attendance-summary">
            <p><strong>${t('present')}:</strong> ${presentStudents.length}</p>
            <p><strong>${t('absent')}:</strong> ${absentStudents.length}</p>
        </div>
    `;
    
    if (absentStudents.length > 0) {
        html += `
            <div class="absent-details">
                <h4>${t('absentStudents')}</h4>
                <ul>
        `;
        
        absentStudents.forEach(student => {
            const reason = todayAttendance[student.id].reason || t('noReasonProvided');
            const displayRoll = student.rollNumber || 'N/A';
            html += `<li>Roll: ${displayRoll} - ${student.name} বিন ${student.fatherName} - ${reason}</li>`;
        });
        
        html += `
                </ul>
            </div>
        `;
    }
    
    overviewDiv.innerHTML = html;
}

async function updateClassWiseStats() {
    try {
        console.log('🔄 Updating class-wise stats...');
        
        // Use local date methods to avoid timezone issues (same as attendance module)
        const today = getTodayString();
        const todayAttendance = attendance[today] || {};
    
    // Use date-aware filtering to get students who were active on today's date
    const activeStudentsForToday = students.filter(student => {
        // If student is currently active, always include them
        if (student.status === 'active') {
            return true;
        }
        
        // If student is inactive, check if they were active on today's date
        if (student.status === 'inactive' && student.inactivationDate) {
            const parsedInactivationDate = parseInactivationDate(student.inactivationDate);
            // Include if today is before the inactivation date
            // This means the student was still active today
            return parsedInactivationDate ? today < parsedInactivationDate : false;
        }
        
        // If student is inactive but has no inactivation date, exclude them
        return false;
    });

    const classSummary = {};

    // Build a set of valid class names from window.classes to filter out ghost/stale entries
    const validClassNames = new Set(
        (window.classes && Array.isArray(window.classes))
            ? window.classes.map(cls => cls.name)
            : []
    );

    // Helper to normalize a student's class value using the same logic as registration.js
    function _normalizeClassForDashboard(classValue) {
        if (!classValue) return '';
        const raw = String(classValue).trim();
        if (!raw) return '';
        if (!window.classes || !Array.isArray(window.classes) || window.classes.length === 0) return raw;
        const exactMatch = window.classes.find(cls => cls.name === raw);
        if (exactMatch) return exactMatch.name;
        const idMatch = window.classes.find(cls => String(cls.id) === raw);
        if (idMatch) return idMatch.name;
        return raw;
    }

    // Use ALL students to initialize the summary object — only for valid/known class names
    students.forEach(student => {
        const normalizedClass = _normalizeClassForDashboard(student.class);
        if (normalizedClass && validClassNames.has(normalizedClass) && !classSummary[normalizedClass]) {
            classSummary[normalizedClass] = {
                total: 0,
                present: 0,
                absent: 0,
                inactive: 0,
                rate: 0,
                averageScore: 0,
                mustaidCount: 0,
                mutawassitCount: 0,
                mujtahidCount: 0
            };
        }
    });
    
    // Also add predefined classes (in case they have no students yet)
    if (window.classes && Array.isArray(window.classes)) {
        window.classes.forEach(cls => {
            if (!classSummary[cls.name]) {
                classSummary[cls.name] = {
                    total: 0,
                    present: 0,
                    absent: 0,
                    inactive: 0,
                    rate: 0,
                    averageScore: 0,
                    mustaidCount: 0,
                    mutawassitCount: 0,
                    mujtahidCount: 0
                };
            }
        });
    }
    
    // Count ACTIVE students for total, present, and absent (using date-aware filtering)
    activeStudentsForToday.forEach(student => {
        const normalizedClass = _normalizeClassForDashboard(student.class);
        if (normalizedClass && classSummary[normalizedClass]) {
            classSummary[normalizedClass].total++;
            
            if (todayAttendance[student.id]) {
                if (todayAttendance[student.id].status === 'present') {
                    classSummary[normalizedClass].present++;
                } else if (todayAttendance[student.id].status === 'absent') {
                    classSummary[normalizedClass].absent++;
                }
            }
        }
    });

    // NEW: Count INACTIVE students
    const inactiveStudents = students.filter(student => student.status === 'inactive');
    inactiveStudents.forEach(student => {
        const normalizedClass = _normalizeClassForDashboard(student.class);
        if (normalizedClass && classSummary[normalizedClass]) {
            classSummary[normalizedClass].inactive++;
        }
    });
    
    // Calculate rates based on ACTIVE students
    Object.keys(classSummary).forEach(className => {
        const classData = classSummary[className];
        if (classData.total > 0) { // total here refers to active students
            classData.rate = Math.round((classData.present / classData.total) * 100);
        }
    });

    // Fetch all student scores in one batch API call
    console.log('🔄 Fetching all student scores in batch...');
    try {
        const response = await fetch('/api/all-student-scores', {
            credentials: 'include'
        });
        if (response.ok) {
            const scoresData = await response.json();
            const allScores = scoresData.scores || {};
            
            console.log(`✅ Fetched scores for ${scoresData.scores_fetched} students in batch`);
            
            // Calculate performance metrics for each class using batch data
            Object.keys(classSummary).forEach(className => {
                const classStudents = students.filter(student => 
                    _normalizeClassForDashboard(student.class) === className && student.status === 'active'
                );
                
                if (classStudents.length > 0) {
                    const classScores = [];
                    
                    // Get scores for students in this class from batch data
                    classStudents.forEach(student => {
                        const studentScoreData = allScores[student.id];
                        if (studentScoreData && studentScoreData.score > 0) {
                            classScores.push(studentScoreData.score);
                        }
                    });
                    
                    if (classScores.length > 0) {
                        // Calculate average score
                        const totalScore = classScores.reduce((sum, score) => sum + score, 0);
                        classSummary[className].averageScore = Math.round(totalScore / classScores.length);
                        
                        // Categorize students into performance tiers
                        classScores.forEach(score => {
                            if (score >= 80) {
                                classSummary[className].mustaidCount++;
                            } else if (score >= 60) {
                                classSummary[className].mutawassitCount++;
                            } else {
                                classSummary[className].mujtahidCount++;
                            }
                        });
                    }
                }
            });
        } else {
            console.error('❌ Failed to fetch batch scores:', response.status);
        }
    } catch (error) {
        console.error('❌ Error fetching batch scores:', error);
    }
    
    // Sort classes by name for consistent display
    const sortedClasses = Object.keys(classSummary).sort((a, b) => {
        const classA = getClassNumber(a);
        const classB = getClassNumber(b);
        if (classA !== classB) return classA - classB;
        return a.localeCompare(b);
    });
    
        // Show table and hide loading indicator
        const loadingIndicator = document.getElementById('classStatsLoading');
        const statsTable = document.getElementById('classStatsTable');
        
        if (loadingIndicator) loadingIndicator.style.display = 'none';
        if (statsTable) statsTable.style.display = 'table';
        
        // Render class-wise stats table
        const tableBody = document.getElementById('classWiseTableBody');
        if (tableBody) {
            tableBody.innerHTML = sortedClasses
                .filter(className => classSummary[className].total > 0)
                .map(className => {
                    const data = classSummary[className];
                    
                    // Determine attendance rate color class
                    let rateColorClass = 'attendance-low';
                    if (data.rate >= 80) rateColorClass = 'attendance-high';
                    else if (data.rate >= 60) rateColorClass = 'attendance-medium';
                    
                    // Determine score color class
                    let scoreColorClass = 'score-poor';
                    if (data.averageScore >= 80) scoreColorClass = 'score-excellent';
                    else if (data.averageScore >= 60) scoreColorClass = 'score-average';
                    
                    // Debug logging for average score
                    console.log(`Class: ${className}, Average Score: ${data.averageScore}, Valid: ${data.averageScore > 0}, Type: ${typeof data.averageScore}`);
                    
                    // Also log the entire data object for debugging
                    console.log(`Class ${className} data:`, data);
                    
                    return `
                        <tr>
                            <td>${className}</td>
                            <td>${data.total}</td>
                            <td style="color: #27ae60;">${data.present}</td>
                            <td style="color: #e74c3c;">${data.absent}</td>
                            <td class="${rateColorClass}">${data.rate}%</td>
                            <td style="color: #f39c12;">${data.inactive}</td>
                            <td class="${scoreColorClass}">${data.averageScore > 0 ? data.averageScore : 'N/A'}</td>
                            <td style="color: #27ae60;">${data.mustaidCount}</td>
                            <td style="color: #f39c12;">${data.mutawassitCount}</td>
                            <td style="color: #e74c3c;">${data.mujtahidCount}</td>
                        </tr>
                    `;
                }).join('');
        }
        
        console.log('✅ Class-wise stats updated successfully');
        
    } catch (error) {
        console.error('❌ Error updating class-wise stats:', error);
    }
}

// Calculate and display students with absences
function updateStudentsWithAbsences() {
    try {
        console.log('🔄 Calculating students with absences...');
        
        // Get only active students
        const activeStudents = students.filter(student => student.status === 'active');
        
        // Calculate absence count for each student
        const studentsAbsenceData = [];
        
        activeStudents.forEach(student => {
            let absenceCount = 0;
            
            // Count absences across all dates in attendance data
            Object.keys(attendance).forEach(date => {
                const dayAttendance = attendance[date];
                if (dayAttendance[student.id] && dayAttendance[student.id].status === 'absent') {
                    absenceCount++;
                }
            });
            
            // Only include students with at least 1 absence
            if (absenceCount > 0) {
                studentsAbsenceData.push({
                    id: student.id,
                    name: student.name,
                    rollNumber: student.rollNumber || 'N/A',
                    class: student.class || 'N/A',
                    absenceCount: absenceCount
                });
            }
        });
        
        // Sort by absence count (highest to lowest)
        studentsAbsenceData.sort((a, b) => b.absenceCount - a.absenceCount);
        
        // Store globally for modal
        window.studentsAbsenceData = studentsAbsenceData;
        
        // Update card count
        const countElement = document.getElementById('studentsWithAbsences');
        if (countElement) {
            countElement.textContent = studentsAbsenceData.length;
        }
        
        console.log(`✅ Found ${studentsAbsenceData.length} students with absences`);
        
    } catch (error) {
        console.error('❌ Error calculating students with absences:', error);
    }
}

let currentReportData = [];
let sortDirection = {};
let columnFilters = {};

function generateAttendanceTrackingCalendar(month = null, year = null) {
    console.log('Generating attendance tracking calendar...');
    
    // Use provided month/year or current values
    const displayMonth = month !== null ? month : currentCalendarMonth;
    const displayYear = year !== null ? year : currentCalendarYear;
    
    console.log('Display date:', displayMonth + 1, displayYear);
    
    // Generate calendar for specified month
    const firstDay = new Date(displayYear, displayMonth, 1);
    const lastDay = new Date(displayYear, displayMonth + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startDayOfWeek = firstDay.getDay(); // 0 = Sunday
    
    console.log('Days in month:', daysInMonth, 'Start day of week:', startDayOfWeek);
    
    const monthNames = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
    ];
    
    const calendarHTML = `
        <div class="attendance-tracking-section">
            <h3>📅 Attendance Tracking Calendar</h3>
            
            <!-- Month Navigation -->
            <div class="calendar-navigation">
                <button onclick="navigateCalendar(-1)" class="nav-btn" title="Previous Month">
                    <i class="fas fa-chevron-left"></i>
                </button>
                <div class="month-year-display">
                    <select id="monthSelector" onchange="changeCalendarMonth()" class="month-selector">
                        ${monthNames.map((month, index) => 
                            `<option value="${index}" ${index === displayMonth ? 'selected' : ''}>${month}</option>`
                        ).join('')}
                    </select>
                    <input type="number" id="yearSelector" value="${displayYear}" min="2020" max="2030" 
                           onchange="changeCalendarYear()" class="year-selector">
                </div>
                <button onclick="navigateCalendar(1)" class="nav-btn" title="Next Month">
                    <i class="fas fa-chevron-right"></i>
                </button>
                <button onclick="goToCurrentMonth()" class="nav-btn today-btn" title="Go to Current Month">
                    <i class="fas fa-calendar-day"></i>
                </button>
            </div>
            
            <div class="calendar-container">
                <div class="calendar-grid">
                    <div class="calendar-header">Sun</div>
                    <div class="calendar-header">Mon</div>
                    <div class="calendar-header">Tue</div>
                    <div class="calendar-header">Wed</div>
                    <div class="calendar-header">Thu</div>
                    <div class="calendar-header">Fri</div>
                    <div class="calendar-header">Sat</div>
                    ${generateCalendarDays(displayYear, displayMonth, startDayOfWeek, daysInMonth)}
                </div>
            </div>
            <div class="calendar-legend">
                <div class="legend-item">
                    <span class="legend-color attendance-taken"></span>
                    <span>Manually Taken</span>
                </div>
                <div class="legend-item">
                    <span class="legend-color attendance-auto-copied"></span>
                    <span>Auto-Copied</span>
                </div>
                <div class="legend-item">
                    <span class="legend-color attendance-missed"></span>
                    <span>NOT Taken</span>
                </div>
                <div class="legend-item">
                    <span class="legend-color holiday-day"></span>
                    <span>Holiday</span>
                </div>
                <div class="legend-item">
                    <span class="legend-color future-day"></span>
                    <span>Future Date</span>
                </div>
                ${academicYearStartDate ? `
                <div class="legend-item">
                    <span class="legend-color before-academic-year"></span>
                    <span>${t('beforeAcademicYear')}</span>
                </div>` : ''}
            </div>
            <div class="attendance-summary" id="attendanceSummary">
                ${generateAttendanceSummary(displayYear, displayMonth)}
            </div>
        </div>
    `;
    
    return calendarHTML;
}


// Function to refresh attendance data from server
async function refreshAttendanceData() {
    try {
        console.log('🔄 Refreshing attendance data from server...');
        const response = await fetch('/api/attendance', {
            credentials: 'include'
        });
        if (response.ok) {
            const newAttendanceData = await response.json();
            // Update the global attendance object
            Object.assign(attendance, newAttendanceData);
            console.log('✅ Attendance data refreshed successfully');
        } else {
            console.error('❌ Failed to refresh attendance data');
        }
    } catch (error) {
        console.error('❌ Error refreshing attendance data:', error);
    }
}

// Function to update performance metrics (overall average score and tier distribution)
async function updatePerformanceMetrics() {
    try {
        console.log('🔄 Updating performance metrics...');
        
        // Get all active students
        const activeStudents = students.filter(student => student.status === 'active');
        
        if (activeStudents.length === 0) {
            console.log('⚠️ No active students found for performance metrics');
            return;
        }
        
        // Fetch scores for all active students
        const scorePromises = activeStudents.map(async (student) => {
            try {
                const response = await fetch(`/api/student-scores/${student.id}`);
                if (response.ok) {
                    const data = await response.json();
                    return data.score || 0;
                }
                return 0;
            } catch (error) {
                console.error(`❌ Error fetching score for student ${student.id}:`, error);
                return 0;
            }
        });
        
        const scores = await Promise.all(scorePromises);
        const validScores = scores.filter(score => score > 0);
        
        if (validScores.length === 0) {
            console.log('⚠️ No valid scores found for performance metrics');
            return;
        }
        
        // Categorize students into performance tiers
        let mustaidCount = 0;    // ≥80: Excellent (Green)
        let mutawassitCount = 0; // 60-79: Average (Orange)
        let mujtahidCount = 0;   // <60: Needs Improvement (Red)
        
        validScores.forEach(score => {
            if (score >= 80) {
                mustaidCount++;
            } else if (score >= 60) {
                mutawassitCount++;
            } else {
                mujtahidCount++;
            }
        });
        
        // Update DOM elements
        const mustaidElement = document.getElementById('mustaidCount');
        const mutawassitElement = document.getElementById('mutawassitCount');
        const mujtahidElement = document.getElementById('mujtahidCount');
        
        if (mustaidElement) mustaidElement.textContent = mustaidCount;
        if (mutawassitElement) mutawassitElement.textContent = mutawassitCount;
        if (mujtahidElement) mujtahidElement.textContent = mujtahidCount;
        
        console.log('✅ Performance metrics updated successfully:', {
            mustaidCount,
            mutawassitCount,
            mujtahidCount,
            totalStudents: validScores.length
        });
        
    } catch (error) {
        console.error('❌ Error updating performance metrics:', error);
    }
}

// Function to update main dashboard alerts
async function updateMainDashboardAlerts() {
    try {
        console.log('🔄 Updating main dashboard alerts...');
        
        const alertsContainer = document.getElementById('main-dashboard-alerts');
        const alertsContent = document.getElementById('main-alerts-content');
        
        if (!alertsContainer || !alertsContent) {
            console.error('❌ Alert containers not found');
            return;
        }
        
        // Get alert configuration from database with localStorage fallback
        let alertConfig = {
            LOW_SCORE_THRESHOLD: 60,
            CRITICAL_SCORE_THRESHOLD: 50,
            LOW_CLASS_AVERAGE_THRESHOLD: 70
        };
        
        try {
            const response = await fetch('/api/settings/alertConfig', {
            credentials: 'include'
        });
            if (response.ok) {
                const data = await response.json();
                const savedConfig = JSON.parse(data.value || '{}');
                alertConfig = { ...alertConfig, ...savedConfig };
            } else {
                // Fallback to localStorage
                const saved = localStorage.getItem('alertConfig');
                if (saved) {
                    const savedConfig = JSON.parse(saved);
                    alertConfig = { ...alertConfig, ...savedConfig };
                }
            }
        } catch (error) {
            console.error('Error loading alert config from database:', error);
            // Fallback to localStorage
            const saved = localStorage.getItem('alertConfig');
            if (saved) {
                try {
                    const savedConfig = JSON.parse(saved);
                    alertConfig = { ...alertConfig, ...savedConfig };
                } catch (e) {
                    console.error('Error loading alert config from localStorage:', e);
                }
            }
        }
        
        // Get all active students
        const activeStudents = students.filter(student => student.status === 'active');
        
        if (activeStudents.length === 0) {
            alertsContainer.style.display = 'none';
            return;
        }
        
        const alerts = [];
        
        // Check for students with low scores across all classes
        const lowScoreStudents = [];
        const criticalScoreStudents = [];
        
        // Fetch scores for all active students
        for (const student of activeStudents) {
            try {
                const response = await fetch(`/api/student-scores/${student.id}`);
                if (response.ok) {
                    const data = await response.json();
                    const score = data.score || 0;
                    
                    if (score > 0) {
                        if (score < alertConfig.CRITICAL_SCORE_THRESHOLD) {
                            criticalScoreStudents.push({ ...student, score });
                        } else if (score < alertConfig.LOW_SCORE_THRESHOLD) {
                            lowScoreStudents.push({ ...student, score });
                        }
                    }
                }
            } catch (error) {
                console.error(`❌ Error fetching score for student ${student.id}:`, error);
            }
        }
        
        // Add critical score alert
        if (criticalScoreStudents.length > 0) {
            alerts.push({
                type: 'danger',
                icon: 'fas fa-exclamation-triangle',
                title: t('critical_students'),
                message: `${criticalScoreStudents.length} ${t('students_have_scores_below')} ${alertConfig.CRITICAL_SCORE_THRESHOLD}`,
                action: t('view_details'),
                students: criticalScoreStudents,
                alertType: 'critical'
            });
        }
        
        // Add low score alert
        if (lowScoreStudents.length > 0) {
            alerts.push({
                type: 'warning',
                icon: 'fas fa-user-times',
                title: t('low_score_students'),
                message: `${lowScoreStudents.length} ${t('students_have_scores_below')} ${alertConfig.LOW_SCORE_THRESHOLD}`,
                action: t('view_details'),
                students: lowScoreStudents,
                alertType: 'low'
            });
        }
        
        // Check for today's absent students
        const today = getTodayString();
        const todayAttendance = attendance[today] || {};
        
        // Get active students for today
        const activeStudentsForToday = students.filter(student => {
            if (student.status === 'active') {
                return true;
            }
            if (student.status === 'inactive' && student.inactivationDate) {
                const parsedInactivationDate = parseInactivationDate(student.inactivationDate);
                return parsedInactivationDate ? today < parsedInactivationDate : false;
            }
            return false;
        });
        
        const absentStudents = activeStudentsForToday.filter(student => 
            todayAttendance[student.id] && todayAttendance[student.id].status === 'absent'
        );
        
        // Add absent students alert
        if (absentStudents.length > 0) {
            alerts.push({
                type: 'info',
                icon: 'fas fa-user-clock',
                title: 'Today\'s Absent Students',
                message: `${absentStudents.length} students are absent today`,
                action: 'View Details',
                students: absentStudents,
                alertType: 'absent',
                todayAttendance: todayAttendance
            });
        }
        
        // Check for important teacher logs across all classes
        try {
            // Get all unique classes from students
            const allClasses = [...new Set(students.map(student => student.class))];
            const allLogs = [];
            
            // Fetch logs from each class
            for (const className of allClasses) {
                try {
                    const logsResponse = await fetch(`/api/teacher-logs?class=${encodeURIComponent(className)}`);
                    if (logsResponse.ok) {
                        const classLogs = await logsResponse.json();
                        allLogs.push(...classLogs);
                    }
                } catch (classError) {
                    console.error(`❌ Error fetching logs for class ${className}:`, classError);
                }
            }
            
            // Filter for important logs
            const importantLogs = allLogs.filter(log => log.is_important && !log.needs_followup);
            const followupLogs = allLogs.filter(log => log.needs_followup);
            
            // Add important logs alert
            if (importantLogs.length > 0) {
                alerts.push({
                    type: 'danger',
                    icon: 'fas fa-exclamation-circle',
                    title: 'Important Teacher Logs',
                    message: `${importantLogs.length} important logs require attention`,
                    action: 'View Logs',
                    logs: importantLogs,
                    alertType: 'important_logs'
                });
            }
            
            // Add follow-up required logs alert
            if (followupLogs.length > 0) {
                alerts.push({
                    type: 'warning',
                    icon: 'fas fa-tasks',
                    title: 'Logs Needing Follow-up',
                    message: `${followupLogs.length} logs require follow-up action`,
                    action: 'View Logs',
                    logs: followupLogs,
                    alertType: 'followup_logs'
                });
            }
        } catch (error) {
            console.error('❌ Error fetching teacher logs for alerts:', error);
        }
        
        // Update alert card count
        const alertsCountElement = document.getElementById('alerts-count');
        const alertsCard = document.getElementById('alerts-card');
        
        if (alertsCountElement) {
            alertsCountElement.textContent = alerts.length;
        }
        
        
        // Update alert card content (no color coding, plain like other cards)
        if (alertsCard) {
            const alertsPreview = document.getElementById('alerts-preview');
            const alertsCountElement = document.getElementById('alerts-count');
            const alertsIcon = document.getElementById('alerts-icon');
            
            // Update count (remove loading spinner)
            if (alertsCountElement) {
                alertsCountElement.innerHTML = alerts.length;
            }
            
            // Show alert icon only after data loads
            if (alertsIcon) {
                alertsIcon.style.display = 'block';
            }
            
            // Remove all color classes
            alertsCard.classList.remove('alert-success', 'alert-warning', 'alert-danger');
            
        if (alerts.length === 0) {
                if (alertsPreview) {
                    alertsPreview.innerHTML = '<div class="text-center text-xs text-gray-500">No alerts</div>';
                }
        } else {
                if (alertsPreview) {
                    alertsPreview.innerHTML = alerts.slice(0, 3).map(alert => `
                        <div class="alert-item-compact">
                            <i class="${alert.icon} alert-icon-compact text-gray-500"></i>
                            <div class="alert-text-compact">${alert.title}</div>
                        </div>
                    `).join('') + (alerts.length > 3 ? `<div class="alert-item-compact text-center text-gray-500">+${alerts.length - 3} more</div>` : '');
                }
            }
        }
        
        // Hide old alert section completely - alerts now shown in card
        if (alertsContainer) {
            alertsContainer.style.display = 'none';
        }
        
        // Store alerts data globally for access (for modal functionality)
        window.currentAlerts = alerts;
        
        console.log('✅ Main dashboard alerts updated successfully');
        
    } catch (error) {
        console.error('❌ Error updating main dashboard alerts:', error);
    }
}

// Function to render alert details
function renderAlertDetails(alert) {
    if (alert.alertType === 'critical' || alert.alertType === 'low') {
        const color = alert.alertType === 'critical' ? '#ef4444' : '#f59e0b';
        return `
            <div class="alert-students-table">
                <table class="w-full text-sm">
                    <thead class="bg-gray-50">
                        <tr>
                            <th class="px-4 py-2 text-left">${t('roll')}</th>
                            <th class="px-4 py-2 text-left">${t('name')}</th>
                            <th class="px-4 py-2 text-left">${t('class')}</th>
                            <th class="px-4 py-2 text-center">${t('score')}</th>
                            <th class="px-4 py-2 text-center">${t('action')}</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${alert.students.map(student => `
                            <tr class="border-b hover:bg-gray-50">
                                <td class="px-4 py-2">${student.rollNumber || 'N/A'}</td>
                                <td class="px-4 py-2">${student.name} বিন ${student.fatherName}</td>
                                <td class="px-4 py-2">${student.class || 'N/A'}</td>
                                <td class="px-4 py-2 text-center">
                                    <span class="font-bold" style="color: ${color};">${student.score}</span>
                                </td>
                                <td class="px-4 py-2 text-center">
                                    <button onclick="window.showStudentProfile('${student.id}')" class="text-blue-600 hover:text-blue-800 underline text-sm">
                                        ${t('view_details')}
                                    </button>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;
    } else if (alert.alertType === 'absent') {
        return `
            <div class="alert-students-table">
                <table class="w-full text-sm">
                    <thead class="bg-gray-50">
                        <tr>
                            <th class="px-4 py-2 text-left">Roll</th>
                            <th class="px-4 py-2 text-left">Name</th>
                            <th class="px-4 py-2 text-left">Class</th>
                            <th class="px-4 py-2 text-left">${t('reason')}</th>
                            <th class="px-4 py-2 text-center">Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${alert.students.map(student => {
                            const attendance = alert.todayAttendance[student.id];
                            const reason = attendance && attendance.reason ? attendance.reason : 'No reason provided';
                            return `
                                <tr class="border-b hover:bg-gray-50">
                                    <td class="px-4 py-2">${student.rollNumber || 'N/A'}</td>
                                    <td class="px-4 py-2">${student.name} বিন ${student.fatherName}</td>
                                    <td class="px-4 py-2">${student.class || 'N/A'}</td>
                                    <td class="px-4 py-2 text-gray-600">${reason}</td>
                                    <td class="px-4 py-2 text-center">
                                        <button onclick="window.showStudentProfile('${student.id}')" class="text-blue-600 hover:text-blue-800 underline text-sm">
                                            ${t('view_details')}
                                        </button>
                                    </td>
                                </tr>
                            `;
                        }).join('')}
                    </tbody>
                </table>
            </div>
        `;
    } else if (alert.alertType === 'important_logs' || alert.alertType === 'followup_logs') {
        const color = alert.alertType === 'important_logs' ? '#ef4444' : '#f59e0b';
        const bgColor = alert.alertType === 'important_logs' ? '#fef2f2' : '#fffbeb';
        const borderColor = alert.alertType === 'important_logs' ? '#fecaca' : '#fed7aa';
        
        return `
            <div class="alert-logs-table">
                <table class="w-full text-sm">
                    <thead class="bg-gray-50">
                        <tr>
                            <th class="px-4 py-2 text-left">Date</th>
                            <th class="px-4 py-2 text-left">Student</th>
                            <th class="px-4 py-2 text-left">Details</th>
                            <th class="px-4 py-2 text-center">Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${alert.logs.map(log => {
                            const logDate = new Date(log.created_at).toLocaleDateString('bn-BD');
                            const logClass = log.class_name || 'N/A';
                            const logDetails = log.details ? (log.details.length > 60 ? log.details.substring(0, 60) + '...' : log.details) : 'No details';
                            
                            // Get student name and roll number
                            let studentInfo = 'Class Log';
                            if (log.student_id) {
                                // Find student in the students array
                                const student = students.find(s => s.id === log.student_id);
                                if (student) {
                                    const rollNumber = student.rollNumber || student.roll || 'N/A';
                                    studentInfo = `${student.name} (পরিচিতি: ${rollNumber})`;
                                } else {
                                    studentInfo = `Student ID: ${log.student_id}`;
                                }
                            }
                            
                            return `
                                <tr class="border-b hover:bg-gray-50">
                                    <td class="px-4 py-2 text-gray-600">${logDate}</td>
                                    <td class="px-4 py-2">
                                        <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                            ${studentInfo}
                                        </span>
                                    </td>
                                    <td class="px-4 py-2 text-gray-700">${logDetails}</td>
                                    <td class="px-4 py-2 text-center">
                                        ${log.student_id ? 
                                            `<button onclick="showStudentLogsModal('${log.student_id}', '${studentInfo.replace(/'/g, "\\'")}', '${logClass}')" class="text-blue-600 hover:text-blue-800 underline text-sm">
                                                View Student Logs
                                            </button>` :
                                            `<button onclick="showTeachersCornerForClass('${logClass}')" class="text-blue-600 hover:text-blue-800 underline text-sm">
                                                View in Teachers Corner
                                            </button>`
                                        }
                                    </td>
                                </tr>
                            `;
                        }).join('')}
                    </tbody>
                </table>
            </div>
        `;
    }
    return '';
}

// Function to toggle alert details
function toggleAlertDetails(index) {
    const detailsElement = document.getElementById(`alert-details-${index}`);
    const button = detailsElement.previousElementSibling.querySelector('.alert-btn');
    
    if (detailsElement.style.display === 'none') {
        detailsElement.style.display = 'block';
        button.textContent = t('hideDetails');
        button.classList.remove('primary');
        button.classList.add('secondary');
    } else {
        detailsElement.style.display = 'none';
        button.textContent = t('viewDetails');
        button.classList.remove('secondary');
        button.classList.add('primary');
    }
}

// Function to show Teachers Corner for a specific class
function showTeachersCornerForClass(className) {
    // Navigate to Teachers Corner section
    if (typeof navigateToSection === 'function') {
        navigateToSection('teachers-corner');
    } else if (typeof showSection === 'function') {
        window.location.hash = '#teachers-corner';
        showSection('teachers-corner-section');
    }
    
    // If Teachers Corner is available, show the specific class dashboard
    if (typeof window.showClassDashboard === 'function') {
        // Small delay to ensure the section is visible
        setTimeout(() => {
            window.showClassDashboard(className);
        }, 100);
    }
}

// Function to show student logs in a modal
async function showStudentLogsModal(studentId, studentInfo, className) {
    try {
        // Fetch student's logs from API
        const response = await fetch(`/api/teacher-logs?class=${encodeURIComponent(className)}&student_id=${studentId}`);
        if (!response.ok) {
            throw new Error('Failed to fetch student logs');
        }
        
        const studentLogs = await response.json();
        
        // Find student details
        const student = students.find(s => s.id === studentId);
        const studentName = student ? student.name : 'Unknown Student';
        const rollNumber = student ? (student.rollNumber || student.roll || 'N/A') : 'N/A';
        
        // Create modal HTML
        const modalHTML = `
            <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center" style="z-index: 9999;" onclick="this.remove()">
                <div class="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden" onclick="event.stopPropagation()">
                    <!-- Modal Header -->
                    <div class="bg-blue-600 text-white px-6 py-4 flex justify-between items-center">
                        <div>
                            <h3 class="text-xl font-semibold">${studentName} - Student Logs</h3>
                            <p class="text-blue-100 text-sm">পরিচিতি: ${rollNumber} | শ্রেণী: ${className}</p>
                        </div>
                        <button onclick="this.closest('.fixed').remove()" class="text-white hover:text-blue-200 text-2xl font-bold">
                            ×
                        </button>
                    </div>
                    
                    <!-- Modal Content -->
                    <div class="p-6 max-h-[calc(90vh-120px)] overflow-y-auto">
                        ${studentLogs.length === 0 ? `
                            <div class="text-center py-8">
                                <i class="fas fa-clipboard-list text-4xl text-gray-400 mb-4"></i>
                                <p class="text-gray-600 text-lg">No logs found for this student</p>
                                <p class="text-gray-500 text-sm mt-2">Logs will appear here when teachers add notes for this student.</p>
                            </div>
                        ` : `
                            <div class="space-y-4">
                                ${studentLogs.map(log => {
                                    const logDate = new Date(log.created_at).toLocaleDateString('bn-BD');
                                    const logTime = new Date(log.created_at).toLocaleTimeString('bn-BD', { 
                                        hour: '2-digit', 
                                        minute: '2-digit' 
                                    });
                                    const logType = log.log_type || 'General';
                                    const isImportant = log.is_important;
                                    const needsFollowup = log.needs_followup;
                                    
                                    return `
                                        <div class="border border-gray-200 rounded-lg p-4 ${isImportant ? 'border-l-4 border-l-red-500 bg-red-50' : 'bg-gray-50'}">
                                            <div class="flex justify-between items-start mb-3">
                                                <div class="flex items-center gap-2">
                                                    <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                                        ${logType}
                                                    </span>
                                                    ${isImportant ? '<span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">গুরুত্বপূর্ণ</span>' : ''}
                                                    ${needsFollowup ? '<span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">অনুসরণ প্রয়োজন</span>' : ''}
                                                </div>
                                                <div class="text-right">
                                                    <div class="text-sm font-medium text-gray-900">${logDate}</div>
                                                    <div class="text-xs text-gray-500">${logTime}</div>
                                                </div>
                                            </div>
                                            <div class="text-gray-700 leading-relaxed">
                                                ${log.details || 'No details provided'}
                                            </div>
                                        </div>
                                    `;
                                }).join('')}
                            </div>
                        `}
                    </div>
                    
                    <!-- Modal Footer -->
                    <div class="bg-gray-50 px-6 py-4 flex justify-end gap-3">
                        <button onclick="showTeachersCornerForClass('${className}')" class="px-4 py-2 text-blue-600 border border-blue-300 rounded-md hover:bg-blue-50">
                            <i class="fas fa-external-link-alt mr-2"></i>Open in Teachers Corner
                        </button>
                        <button onclick="this.closest('.fixed').remove()" class="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700">
                            Close
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        // Add modal to page
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        
    } catch (error) {
        console.error('❌ Error showing student logs modal:', error);
        
        // Show error modal
        const errorModal = `
            <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center" style="z-index: 9999;" onclick="this.remove()">
                <div class="bg-white rounded-lg shadow-xl max-w-md w-full mx-4" onclick="event.stopPropagation()">
                    <div class="p-6 text-center">
                        <i class="fas fa-exclamation-triangle text-4xl text-red-500 mb-4"></i>
                        <h3 class="text-lg font-semibold text-gray-900 mb-2">Error Loading Logs</h3>
                        <p class="text-gray-600 mb-4">Failed to load student logs. Please try again.</p>
                        <button onclick="this.closest('.fixed').remove()" class="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700">
                            Close
                        </button>
                    </div>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', errorModal);
    }
}

// Function to show low score students modal
function showLowScoreStudents(students, type) {
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center';
    modal.style.zIndex = '9999'; // Higher than navigation (100) and other elements
    
    const title = type === 'critical' ? t('critical_students') : t('low_score_students');
    const color = type === 'critical' ? '#ef4444' : '#f59e0b';
    
    modal.innerHTML = `
        <div class="bg-white p-6 rounded-lg max-w-4xl mx-4 max-h-[80vh] overflow-y-auto">
            <div class="flex justify-between items-center mb-6">
                <h3 class="text-xl font-semibold" style="color: ${color};">${title}</h3>
                <button onclick="this.closest('.fixed').remove()" class="text-gray-500 hover:text-gray-700">
                    <i class="fas fa-times text-xl"></i>
                </button>
            </div>
            
            <div class="overflow-x-auto">
                <table class="w-full text-sm">
                    <thead class="bg-gray-50">
                        <tr>
                            <th class="px-4 py-2 text-left">${t('roll')}</th>
                            <th class="px-4 py-2 text-left">${t('name')}</th>
                            <th class="px-4 py-2 text-left">${t('class')}</th>
                            <th class="px-4 py-2 text-center">${t('score')}</th>
                            <th class="px-4 py-2 text-center">${t('action')}</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${students.map(student => `
                            <tr class="border-b hover:bg-gray-50">
                                <td class="px-4 py-2">${student.rollNumber || 'N/A'}</td>
                                <td class="px-4 py-2">${student.name} বিন ${student.fatherName}</td>
                                <td class="px-4 py-2">${student.class || 'N/A'}</td>
                                <td class="px-4 py-2 text-center">
                                    <span class="font-bold" style="color: ${color};">${student.score}</span>
                                </td>
                                <td class="px-4 py-2 text-center">
                                    <button onclick="window.showStudentProfile('${student.id}')" class="text-blue-600 hover:text-blue-800 underline">
                                        ${t('view_details')}
                                    </button>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
            
            <div class="flex justify-end gap-3 mt-6 pt-4 border-t">
                <button onclick="this.closest('.fixed').remove()" class="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50">
                    Close
                </button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
}

// Function to show absent students modal
function showAbsentStudents(students, todayAttendance) {
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center';
    modal.style.zIndex = '9999'; // Higher than navigation (100) and other elements
    
    modal.innerHTML = `
        <div class="bg-white p-6 rounded-lg max-w-4xl mx-4 max-h-[80vh] overflow-y-auto">
            <div class="flex justify-between items-center mb-6">
                <h3 class="text-xl font-semibold text-blue-600">Today's Absent Students</h3>
                <button onclick="this.closest('.fixed').remove()" class="text-gray-500 hover:text-gray-700">
                    <i class="fas fa-times text-xl"></i>
                </button>
            </div>
            
            <div class="overflow-x-auto">
                <table class="w-full text-sm">
                    <thead class="bg-gray-50">
                        <tr>
                            <th class="px-4 py-2 text-left">Roll</th>
                            <th class="px-4 py-2 text-left">Name</th>
                            <th class="px-4 py-2 text-left">Class</th>
                            <th class="px-4 py-2 text-left">${t('reason')}</th>
                            <th class="px-4 py-2 text-center">Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${students.map(student => {
                            const attendance = todayAttendance[student.id];
                            const reason = attendance && attendance.reason ? attendance.reason : 'No reason provided';
                            return `
                                <tr class="border-b hover:bg-gray-50">
                                    <td class="px-4 py-2">${student.rollNumber || 'N/A'}</td>
                                    <td class="px-4 py-2">${student.name} বিন ${student.fatherName}</td>
                                    <td class="px-4 py-2">${student.class || 'N/A'}</td>
                                    <td class="px-4 py-2 text-gray-600">${reason}</td>
                                    <td class="px-4 py-2 text-center">
                                        <button onclick="window.showStudentProfile('${student.id}')" class="text-blue-600 hover:text-blue-800 underline">
                                            ${t('view_details')}
                                        </button>
                                    </td>
                                </tr>
                            `;
                        }).join('')}
                    </tbody>
                </table>
            </div>
            
            <div class="flex justify-end gap-3 mt-6 pt-4 border-t">
                <button onclick="this.closest('.fixed').remove()" class="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50">
                    Close
                </button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
}

// Show alerts modal when alert card is clicked
export function showAlertsModal() {
    if (!window.currentAlerts || window.currentAlerts.length === 0) {
        // Show no alerts message
        const modal = document.createElement('div');
        modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center';
    modal.style.zIndex = '9999'; // Higher than navigation (100) and other elements
        modal.innerHTML = `
            <div class="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
                <div class="p-6 text-center">
                    <i class="fas fa-check-circle text-6xl text-green-500 mb-4"></i>
                    <h3 class="text-xl font-semibold text-gray-800 mb-2">${t('noAlerts')}</h3>
                    <p class="text-gray-600 mb-6">${t('everythingIsFine')}</p>
                    <button onclick="this.closest('.fixed').remove()" class="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
                        ${t('close')}
                    </button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
        return;
    }

    // Show alerts in modal
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center';
    modal.style.zIndex = '9999'; // Higher than navigation (100) and other elements
    modal.innerHTML = `
        <div class="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[80vh] overflow-hidden">
            <div class="p-6 border-b border-gray-200">
                <div class="flex items-center justify-between">
                    <h3 class="text-xl font-semibold text-gray-800 flex items-center gap-2">
                        <i class="fas fa-exclamation-triangle text-yellow-500"></i>
                        ${t('institution_alerts')} (${window.currentAlerts.length})
                    </h3>
                    <button onclick="this.closest('.fixed').remove()" class="text-gray-400 hover:text-gray-600">
                        <i class="fas fa-times text-xl"></i>
                    </button>
                </div>
            </div>
            
            <div class="p-6 overflow-y-auto max-h-[60vh]">
                <div class="space-y-4">
                    ${window.currentAlerts.map((alert, index) => `
                        <div class="alert-item ${alert.type} border rounded-lg p-4">
                            <div class="flex items-start gap-3">
                                <i class="${alert.icon} text-lg ${alert.type === 'danger' ? 'text-red-500' : alert.type === 'warning' ? 'text-yellow-500' : 'text-blue-500'} mt-1"></i>
                                <div class="flex-1">
                                    <div class="font-semibold text-gray-800 mb-1">${alert.title}</div>
                                    <div class="text-sm text-gray-600 mb-3">${alert.message}</div>
                                    <div class="flex gap-2">
                                        <button onclick="toggleAlertDetails(${index})" class="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700">
                                            ${alert.action}
                                        </button>
                                    </div>
                                    <div class="alert-details mt-3" id="alert-details-${index}" style="display: none;">
                                        <div class="bg-gray-50 rounded p-3 text-sm">
                                            ${renderAlertDetails(alert)}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
            
            <div class="p-6 border-t border-gray-200 bg-gray-50">
                <div class="flex justify-end">
                    <button onclick="this.closest('.fixed').remove()" class="px-6 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700">
                        ${t('close')}
                    </button>
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
}

// Show absence summary modal when absence card is clicked
export function showAbsenceSummaryModal() {
    const absenceData = window.studentsAbsenceData || [];
    
    if (absenceData.length === 0) {
        alert(t('noStudentsWithAbsences') || 'No students with absences found');
        return;
    }
    
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4';
    modal.style.zIndex = '9999'; // Higher than navigation (100) and other elements
    modal.innerHTML = `
        <div class="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div class="p-6 border-b border-gray-200">
                <h2 class="text-2xl font-bold text-gray-800">
                    <i class="fas fa-user-clock text-blue-500 mr-2"></i>
                    ${t('absenceSummary') || 'Absence Summary'}
                </h2>
                <p class="text-sm text-gray-600 mt-2">${t('totalStudentsWithAbsences') || 'Total students with absences'}: ${absenceData.length}</p>
            </div>
            <div class="flex-1 overflow-y-auto p-6">
                <table class="w-full text-sm">
                    <thead class="bg-gray-100 sticky top-0">
                        <tr>
                            <th class="px-4 py-3 text-left text-gray-700 font-semibold">#</th>
                            <th class="px-4 py-3 text-left text-gray-700 font-semibold">${t('studentName') || 'Student Name'}</th>
                            <th class="px-4 py-3 text-left text-gray-700 font-semibold">${t('rollNumber') || 'Roll Number'}</th>
                            <th class="px-4 py-3 text-left text-gray-700 font-semibold">${t('class') || 'Class'}</th>
                            <th class="px-4 py-3 text-center text-gray-700 font-semibold">${t('totalAbsences') || 'Total Absences'}</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${absenceData.map((student, index) => {
                            // Color code based on absence count
                            let badgeColor = 'bg-green-100 text-green-800';
                            if (student.absenceCount >= 10) {
                                badgeColor = 'bg-red-100 text-red-800';
                            } else if (student.absenceCount >= 5) {
                                badgeColor = 'bg-yellow-100 text-yellow-800';
                            }
                            
                            return `
                                <tr class="border-b hover:bg-gray-50 transition-colors">
                                    <td class="px-4 py-3 text-gray-600">${index + 1}</td>
                                    <td class="px-4 py-3">
                                        <span class="text-blue-600 hover:text-blue-800 cursor-pointer font-medium" 
                                              onclick="showStudentDetail('${student.id}', 'dashboard')">
                                            ${student.name}
                                        </span>
                                    </td>
                                    <td class="px-4 py-3 text-gray-700">${student.rollNumber}</td>
                                    <td class="px-4 py-3 text-gray-700">${student.class}</td>
                                    <td class="px-4 py-3 text-center">
                                        <span class="inline-block px-3 py-1 rounded-full text-sm font-semibold ${badgeColor}">
                                            ${student.absenceCount} ${student.absenceCount === 1 ? (t('day') || 'day') : (t('days') || 'days')}
                                        </span>
                                    </td>
                                </tr>
                            `;
                        }).join('')}
                    </tbody>
                </table>
            </div>
            <div class="p-6 border-t border-gray-200 flex justify-end gap-3">
                <button onclick="this.closest('.fixed').remove()" 
                        class="px-6 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors">
                    ${t('close') || 'Close'}
                </button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
}

// Show performance details modal when performance card is clicked
function showPerformanceDetails() {
    const mustaidCount = document.getElementById('mustaidCount')?.textContent || 0;
    const mutawassitCount = document.getElementById('mutawassitCount')?.textContent || 0;
    const mujtahidCount = document.getElementById('mujtahidCount')?.textContent || 0;
    
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center';
    modal.style.zIndex = '9999'; // Higher than navigation (100) and other elements
    modal.innerHTML = `
        <div class="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div class="p-6">
                <div class="text-center mb-6">
                    <i class="fas fa-star text-4xl text-yellow-500 mb-4"></i>
                    <h3 class="text-xl font-semibold text-gray-800 mb-2">${t('performanceStudents')}</h3>
                    <p class="text-gray-600">${t('studentPerformanceBreakdown')}</p>
                </div>
                
                <div class="space-y-4">
                    <div class="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                        <div class="flex items-center gap-3">
                            <i class="fas fa-star text-green-500"></i>
                            <span class="font-medium">${t('mustaid')}</span>
                        </div>
                        <span class="text-2xl font-bold text-green-600">${mustaidCount}</span>
                    </div>
                    
                    <div class="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                        <div class="flex items-center gap-3">
                            <i class="fas fa-star text-blue-500"></i>
                            <span class="font-medium">${t('mutawassit')}</span>
                        </div>
                        <span class="text-2xl font-bold text-blue-600">${mutawassitCount}</span>
                    </div>
                    
                    <div class="flex justify-between items-center p-3 bg-purple-50 rounded-lg">
                        <div class="flex items-center gap-3">
                            <i class="fas fa-star text-purple-500"></i>
                            <span class="font-medium">${t('mujtahid')}</span>
                        </div>
                        <span class="text-2xl font-bold text-purple-600">${mujtahidCount}</span>
                    </div>
                </div>
                
                <div class="mt-6 pt-4 border-t">
                    <div class="flex justify-between items-center">
                        <span class="font-semibold text-gray-700">${t('total')}:</span>
                        <span class="text-2xl font-bold text-gray-800">${parseInt(mustaidCount) + parseInt(mutawassitCount) + parseInt(mujtahidCount)}</span>
                    </div>
                </div>
                
                <div class="mt-6 flex justify-end">
                    <button onclick="this.closest('.fixed').remove()" class="px-6 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700">
                        ${t('close')}
                    </button>
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
}

// Open main dashboard messaging (floating window like Teachers Corner)
export function openMainDashboardMessaging() {
    console.log('💬 Opening main dashboard messaging floating window');
    
    // Check if messaging window is already open
    let messagingWindow = document.getElementById('main-dashboard-messaging-window');
    
    if (messagingWindow) {
        messagingWindow.style.display = 'flex';
        return;
    }
    
    // Create main dashboard messaging window
    messagingWindow = document.createElement('div');
    messagingWindow.id = 'main-dashboard-messaging-window';
    messagingWindow.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center';
    messagingWindow.style.zIndex = '9999'; // Higher than navigation (100) and other elements
    messagingWindow.innerHTML = `
        <div class="bg-white rounded-lg shadow-2xl w-full max-w-6xl" style="height: 700px; max-height: 85vh;">
            <!-- Header -->
            <div class="flex justify-between items-center p-4 border-b bg-blue-50 rounded-t-lg" style="height: 70px; flex-shrink: 0;">
                <h2 class="text-xl font-bold text-gray-800 flex items-center">
                    <i class="fas fa-comments text-blue-500 mr-2"></i>
                    Messages
                </h2>
                <button onclick="closeMainDashboardMessaging()" class="text-gray-500 hover:text-gray-700 text-xl p-2 hover:bg-gray-100 rounded-full transition-colors">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            
            <!-- Messages Interface -->
            <div style="height: calc(100% - 70px); overflow: hidden;">
                <div class="messages-container" style="height: 100%; display: flex;">
                    <div class="messages-sidebar" style="width: 400px; min-width: 350px; max-width: 500px; border-right: 1px solid #e5e7eb; background: #f9fafb;">
                        <div class="sidebar-header p-4 border-b">
                            <h3 class="font-semibold text-gray-700">Conversations</h3>
                        </div>
                        <div class="sidebar-content p-2">
                            <div id="mainDashboardConversationsList" class="conversation-list">
                                <div class="loading-state text-center py-8">
                                    <i class="fas fa-spinner fa-spin text-gray-400"></i>
                                    <p class="text-gray-500 mt-2">Loading conversations...</p>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="messages-main" style="flex: 1; display: flex; flex-direction: column;">
                        <div class="messages-header p-4 border-b bg-white">
                            <div class="conversation-header-info">
                                <h3 class="text-lg font-medium text-gray-800">Select a conversation</h3>
                                <p class="text-sm text-gray-500">Choose a conversation from the sidebar to start messaging</p>
                            </div>
                        </div>
                        
                        <div class="messages-content" style="flex: 1; display: flex; flex-direction: column;">
                            <div id="mainDashboardMessagesContainer" class="messages-list" style="flex: 1; padding: 1rem; overflow-y: auto;">
                                <div class="empty-messages text-center py-12">
                                    <i class="fas fa-comment-dots text-4xl text-gray-300 mb-4"></i>
                                    <p class="text-gray-500">Select a conversation to start messaging</p>
                                </div>
                            </div>
                            
                            <div class="messages-input-container p-4 border-t bg-white">
                                <div class="messages-input-wrapper flex items-end gap-2">
                                    <textarea 
                                        id="mainDashboardMessageInput" 
                                        placeholder="Type your message..." 
                                        rows="1"
                                        maxlength="1000"
                                        onkeypress="handleMainDashboardMessageKeyPress(event)"
                                        oninput="autoResizeMainDashboardTextarea(this)"
                                        class="flex-1 resize-none border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        style="min-height: 40px; max-height: 120px;"
                                    ></textarea>
                                    <button id="mainDashboardSendMessageBtn" onclick="sendMainDashboardMessage()" class="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors">
                                        <i class="fas fa-paper-plane"></i>
                                    </button>
                                </div>
                                <div class="message-counter text-xs text-gray-500 mt-1">
                                    <span id="mainDashboardMessageCounter">0/1000</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(messagingWindow);
    
    // Initialize the messaging interface
    setTimeout(() => {
        initializeMainDashboardMessaging();
    }, 100);
}

// Open unified Communications window with tabs for Messages and Teacher Logs
export function openCommunicationsWindow() {
    console.log('💬 Opening Communications window with tabs');
    
    // Check if window is already open
    let commWindow = document.getElementById('communications-window');
    
    if (commWindow) {
        commWindow.style.display = 'flex';
        return;
    }
    
    // Create unified Communications window with tabs
    commWindow = document.createElement('div');
    commWindow.id = 'communications-window';
    commWindow.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center';
    commWindow.style.zIndex = '9999';
    commWindow.innerHTML = `
        <style>
            /* Pulse Animation for unread indicators */
            @keyframes pulse {
                0%, 100% {
                    opacity: 1;
                }
                50% {
                    opacity: 0.5;
                }
            }
            
            /* Mobile Responsive Styles */
            @media (max-width: 768px) {
                .communications-window-content {
                    width: 100% !important;
                    max-width: 100% !important;
                    height: 100vh !important;
                    max-height: 100vh !important;
                    margin: 0 !important;
                    border-radius: 0 !important;
                }
                .messages-sidebar, .teacher-logs-sidebar {
                    width: 35% !important;
                    min-width: 120px !important;
                    max-width: 150px !important;
                }
                .messages-container, .teacher-logs-container {
                    flex-direction: row !important;
                }
                .sidebar-content {
                    padding: 0.5rem !important;
                }
                .conversation-item, .class-item {
                    padding: 8px !important;
                    margin-bottom: 4px !important;
                    font-size: 12px !important;
                }
                .conversation-name, .class-name {
                    font-size: 12px !important;
                    line-height: 1.2 !important;
                    margin-bottom: 2px !important;
                }
                .conversation-class {
                    font-size: 10px !important;
                    opacity: 0.8;
                }
                .sidebar-header {
                    padding: 0.75rem !important;
                }
                /* Ensure scroll area takes full height */
                .messages-sidebar .sidebar-content,
                .teacher-logs-sidebar .sidebar-content {
                    height: auto !important;
                    flex: 1 !important;
                    overflow-y: auto !important;
                }
            }
            
            /* Ensure sidebars always scroll properly */
            .sidebar-content {
                overflow-y: auto;
                -webkit-overflow-scrolling: touch; /* Smooth scrolling on iOS */
            }
        </style>
        <div class="communications-window-content bg-white rounded-lg shadow-2xl w-full max-w-6xl" style="height: 700px; max-height: 85vh;">
            <!-- Header -->
            <div class="comm-header flex justify-between items-center p-4 border-b bg-gradient-to-r from-indigo-50 to-purple-50 rounded-t-lg" style="height: 70px; flex-shrink: 0;">
                <div class="flex items-center gap-3">
                    <button id="comm-hamburger-btn" onclick="toggleCommSidebar()" class="comm-hamburger-btn text-gray-700 hover:text-gray-900 text-xl p-2 hover:bg-gray-100 rounded-full transition-colors" style="display: none;">
                        <i class="fas fa-bars"></i>
                    </button>
                    <h2 class="text-xl font-bold text-gray-800 flex items-center">
                        <i class="fas fa-comments text-indigo-500 mr-2"></i>
                        Communications
                    </h2>
                </div>
                <button onclick="closeCommunicationsWindow()" class="text-gray-500 hover:text-gray-700 text-xl p-2 hover:bg-gray-100 rounded-full transition-colors">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            
            <!-- Tab Bar -->
            <div class="tab-bar flex border-b bg-gray-50" style="height: 50px; flex-shrink: 0;">
                <button class="comm-tab active flex items-center gap-2 px-6 py-3 font-medium text-gray-700 border-b-2 border-indigo-500 bg-white" data-tab="messages" onclick="switchCommTab('messages')">
                    <i class="fas fa-envelope text-indigo-500"></i>
                    <span>Messages</span>
                    <span id="messages-tab-badge" class="badge ml-2 bg-indigo-500 text-white text-xs font-bold px-2 py-1 rounded-full" style="display: none;">0</span>
                </button>
                <button class="comm-tab flex items-center gap-2 px-6 py-3 font-medium text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors" data-tab="teacher-logs" onclick="switchCommTab('teacher-logs')">
                    <i class="fas fa-clipboard-list text-purple-500"></i>
                    <span>Teacher Logs</span>
                    <span id="teacher-logs-tab-badge" class="badge ml-2 bg-purple-500 text-white text-xs font-bold px-2 py-1 rounded-full" style="display: none;">0</span>
                </button>
            </div>
            
            <!-- Sidebar Backdrop Overlay -->
            <div id="comm-sidebar-backdrop" class="comm-backdrop" onclick="closeCommSidebar()"></div>
            
            <!-- Tab Content Container -->
            <div class="tab-content-container" style="height: calc(100% - 120px); overflow: hidden;">
                <!-- Messages Tab Content -->
                <div id="messages-tab-content" class="tab-content active" data-tab="messages" style="height: 100%;">
                            <div class="messages-container" style="height: 100%; display: flex; flex-direction: row; align-items: stretch;">
                                <div id="messages-sidebar" class="messages-sidebar" data-sidebar-type="messages" style="width: 400px; min-width: 350px; max-width: 500px; height: 100%; border-right: 1px solid #e5e7eb; background: #eff6ff; display: flex; flex-direction: column;">
                            <div class="sidebar-header p-4 border-b" style="flex-shrink: 0; display: flex; justify-content: space-between; align-items: center;">
                                <h3 class="font-semibold text-gray-700">Messages</h3>
                                <button onclick="closeCommSidebar()" class="sidebar-close-btn text-gray-500 hover:text-gray-700 text-lg p-1 hover:bg-gray-100 rounded transition-colors" style="display: none;">
                                    <i class="fas fa-times"></i>
                                </button>
                            </div>
                            <div class="sidebar-content p-2" style="flex: 1; overflow-y: auto; max-height: 100%;">
                                <!-- Summary Section -->
                                <div id="messagesSummary" class="bg-blue-50 p-3 mb-3 rounded-lg border border-blue-200">
                                    <div class="flex justify-around text-center text-xs">
                                        <div>
                                            <div class="text-lg font-bold text-gray-700" id="messagesSummaryTotal">
                                                <i class="fas fa-spinner fa-spin"></i>
                                            </div>
                                            <div class="text-gray-600">Total</div>
                                        </div>
                                        <div>
                                            <div class="text-lg font-bold text-blue-600" id="messagesSummaryUnread">
                                                <i class="fas fa-spinner fa-spin"></i>
                                            </div>
                                            <div class="text-gray-600">Unread</div>
                                        </div>
                                        <div>
                                            <div class="text-lg font-bold text-green-600" id="messagesSummaryRead">
                                                <i class="fas fa-spinner fa-spin"></i>
                                            </div>
                                            <div class="text-gray-600">Read</div>
                                        </div>
                                    </div>
                                </div>
                                
                                <div id="mainDashboardConversationsList" class="conversation-list">
                                    <div class="loading-state text-center py-8">
                                        <i class="fas fa-spinner fa-spin text-gray-400"></i>
                                        <p class="text-gray-500 mt-2">Loading conversations...</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <div class="messages-main" style="flex: 1; height: 100%; display: flex; flex-direction: column;">
                            <div class="messages-header p-4 border-b bg-white">
                                <div class="conversation-header-info">
                                    <h3 class="text-lg font-medium text-gray-800">Select a conversation</h3>
                                    <p class="text-sm text-gray-500">Choose a conversation from the sidebar to start messaging</p>
                                </div>
                            </div>
                            
                            <div class="messages-content" style="flex: 1; display: flex; flex-direction: column;">
                                <div id="mainDashboardMessagesContainer" class="messages-list" style="flex: 1; padding: 1rem; overflow-y: auto;">
                                    <div class="empty-messages text-center py-12">
                                        <i class="fas fa-comment-dots text-4xl text-gray-300 mb-4"></i>
                                        <p class="text-gray-500">Select a conversation to start messaging</p>
                                    </div>
                                </div>
                                
                                <div class="messages-input-container p-4 border-t bg-white">
                                    <div class="messages-input-wrapper flex items-end gap-2">
                                        <textarea 
                                            id="mainDashboardMessageInput" 
                                            placeholder="Type your message..." 
                                            rows="1"
                                            maxlength="1000"
                                            onkeypress="handleMainDashboardMessageKeyPress(event)"
                                            oninput="autoResizeMainDashboardTextarea(this)"
                                            class="flex-1 resize-none border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            style="min-height: 40px; max-height: 120px;"
                                        ></textarea>
                                        <button id="mainDashboardSendMessageBtn" onclick="sendMainDashboardMessage()" class="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors">
                                            <i class="fas fa-paper-plane"></i>
                                        </button>
                                    </div>
                                    <div class="message-counter text-xs text-gray-500 mt-1">
                                        <span id="mainDashboardMessageCounter">0/1000</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                
                <!-- Teacher Logs Tab Content -->
                <div id="teacher-logs-tab-content" class="tab-content" data-tab="teacher-logs" style="height: 100%; display: none;">
                    <div class="teacher-logs-container" style="height: 100%; display: flex; flex-direction: row; align-items: stretch;">
                        <!-- Teacher Logs Sidebar: Classes List -->
                        <div id="teacher-logs-sidebar" class="teacher-logs-sidebar" data-sidebar-type="teacher-logs" style="width: 400px; min-width: 350px; max-width: 500px; height: 100%; border-right: 1px solid #e5e7eb; background: #faf5ff; display: flex; flex-direction: column;">
                            <div class="sidebar-header p-4 border-b" style="flex-shrink: 0; display: flex; justify-content: space-between; align-items: center;">
                                <h3 class="font-semibold text-gray-700">Teacher Logs</h3>
                                <button onclick="closeCommSidebar()" class="sidebar-close-btn text-gray-500 hover:text-gray-700 text-lg p-1 hover:bg-gray-100 rounded transition-colors" style="display: none;">
                                    <i class="fas fa-times"></i>
                                </button>
                            </div>
                            <div class="sidebar-content p-2" style="flex: 1; overflow-y: auto; max-height: 100%;">
                                <!-- Summary Section -->
                                <div id="teacherLogsSummary" class="bg-purple-50 p-3 mb-3 rounded-lg border border-purple-200">
                                    <div class="flex justify-around text-center text-xs">
                                        <div>
                                            <div class="text-lg font-bold text-gray-700" id="summaryTotal">
                                                <i class="fas fa-spinner fa-spin"></i>
                                            </div>
                                            <div class="text-gray-600">Total</div>
                                        </div>
                                        <div>
                                            <div class="text-lg font-bold text-red-600" id="summaryUnread">
                                                <i class="fas fa-spinner fa-spin"></i>
                                            </div>
                                            <div class="text-gray-600">Unread</div>
                                        </div>
                                        <div>
                                            <div class="text-lg font-bold text-green-600" id="summaryRead">
                                                <i class="fas fa-spinner fa-spin"></i>
                                            </div>
                                            <div class="text-gray-600">Read</div>
                                        </div>
                                    </div>
                                </div>
                                
                                <div id="teacherLogsClassesList" class="space-y-2">
                                    <div class="text-center py-8">
                                        <i class="fas fa-spinner fa-spin text-3xl text-gray-400"></i>
                                        <p class="text-gray-500 mt-2 text-sm">Loading classes...</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <!-- Teacher Logs Main: Logs Display -->
                        <div class="teacher-logs-main" style="flex: 1; height: 100%; display: flex; flex-direction: column;">
                            <div class="logs-header p-4 border-b bg-white">
                                <h3 id="selectedClassName" class="text-lg font-medium text-gray-800">
                                    Select a class to view logs
                                </h3>
                            </div>
                            <div id="teacherLogsContent" class="logs-content" style="flex: 1; padding: 1rem; overflow-y: auto;">
                                <div class="empty-logs text-center py-16">
                                    <i class="fas fa-clipboard-list text-6xl text-gray-300 mb-4"></i>
                                    <p class="text-gray-500 text-lg">Select a class from the sidebar to view teacher logs</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(commWindow);
    
    // Initialize both tabs
    setTimeout(() => {
        // Initialize Messages tab
        initializeMainDashboardMessaging();
        
        // Initialize Teacher Logs tab (load counts and classes)
        loadTeacherLogsSummary();
        loadTeacherLogsClassesList();
        
        // Update tab badges
        updateCommTabBadges();
        
        // Handle window resize - close sidebar if switching from mobile to desktop
        let resizeTimeout;
        const handleResize = () => {
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(() => {
                if (!isMobileViewport()) {
                    // Desktop view - ensure sidebar is closed (mobile behavior disabled)
                    closeCommSidebar();
                }
            }, 250);
        };
        window.addEventListener('resize', handleResize);
        
        // Handle orientation change (mobile devices)
        window.addEventListener('orientationchange', () => {
            // Small delay to let orientation change complete
            setTimeout(() => {
                handleResize();
                // Ensure sidebar is properly positioned after orientation change
                if (isMobileViewport()) {
                    const activeTab = document.querySelector('.comm-tab.active')?.dataset.tab;
                    const sidebarId = activeTab === 'messages' ? 'messages-sidebar' : 'teacher-logs-sidebar';
                    const sidebar = document.getElementById(sidebarId);
                    if (sidebar && sidebar.classList.contains('sidebar-open')) {
                        // Re-apply sidebar-open class to ensure proper positioning
                        sidebar.classList.remove('sidebar-open');
                        setTimeout(() => {
                            sidebar.classList.add('sidebar-open');
                        }, 50);
                    }
                }
            }, 300);
        });
    }, 100);
}

// Helper function to detect mobile viewport
function isMobileViewport() {
    return window.innerWidth < 768;
}

// Auto-close sidebar on mobile after selection
function autoCloseSidebarIfMobile() {
    if (isMobileViewport()) {
        closeCommSidebar();
    }
}

// Open sidebar (mobile only)
function openCommSidebar() {
    if (!isMobileViewport()) {
        return; // Don't open on desktop
    }
    
    // Prevent multiple rapid calls
    if (window.commSidebarOpening) {
        return;
    }
    window.commSidebarOpening = true;
    
    const activeTab = document.querySelector('.comm-tab.active')?.dataset.tab;
    const sidebarId = activeTab === 'messages' ? 'messages-sidebar' : 'teacher-logs-sidebar';
    const sidebar = document.getElementById(sidebarId);
    const backdrop = document.getElementById('comm-sidebar-backdrop');
    
    if (sidebar && backdrop) {
        sidebar.classList.add('sidebar-open');
        backdrop.classList.add('show');
        // Prevent body scroll when sidebar is open
        document.body.style.overflow = 'hidden';
    }
    
    // Reset flag after animation completes
    setTimeout(() => {
        window.commSidebarOpening = false;
    }, 300);
}

// Close sidebar
function closeCommSidebar() {
    const sidebars = document.querySelectorAll('#messages-sidebar, #teacher-logs-sidebar');
    const backdrop = document.getElementById('comm-sidebar-backdrop');
    
    // Prevent multiple rapid calls
    if (window.commSidebarClosing) {
        return;
    }
    window.commSidebarClosing = true;
    
    sidebars.forEach(sidebar => {
        sidebar.classList.remove('sidebar-open');
    });
    
    if (backdrop) {
        backdrop.classList.remove('show');
    }
    
    // Restore body scroll
    document.body.style.overflow = '';
    
    // Reset flag after animation completes
    setTimeout(() => {
        window.commSidebarClosing = false;
    }, 300);
}

// Toggle sidebar (mobile only)
function toggleCommSidebar() {
    if (!isMobileViewport()) {
        return; // Don't toggle on desktop
    }
    
    const activeTab = document.querySelector('.comm-tab.active')?.dataset.tab;
    const sidebarId = activeTab === 'messages' ? 'messages-sidebar' : 'teacher-logs-sidebar';
    const sidebar = document.getElementById(sidebarId);
    
    if (sidebar && sidebar.classList.contains('sidebar-open')) {
        closeCommSidebar();
    } else {
        openCommSidebar();
    }
}

// Expose functions to global scope
window.toggleCommSidebar = toggleCommSidebar;
window.closeCommSidebar = closeCommSidebar;
window.openCommSidebar = openCommSidebar;

// Switch between tabs in Communications window
export function switchCommTab(tabName) {
    // Close sidebar when switching tabs (mobile)
    if (isMobileViewport()) {
        closeCommSidebar();
    }
    
    // Update tab buttons
    const tabs = document.querySelectorAll('.comm-tab');
    tabs.forEach(tab => {
        if (tab.dataset.tab === tabName) {
            tab.classList.add('active', 'border-indigo-500', 'bg-white');
            tab.classList.remove('text-gray-500');
        } else {
            tab.classList.remove('active', 'border-indigo-500', 'bg-white');
            tab.classList.add('text-gray-500');
        }
    });
    
    // Update tab content
    const messagesContent = document.getElementById('messages-tab-content');
    const logsContent = document.getElementById('teacher-logs-tab-content');
    
    if (tabName === 'messages') {
        messagesContent.style.display = 'block';
        logsContent.style.display = 'none';
    } else if (tabName === 'teacher-logs') {
        messagesContent.style.display = 'none';
        logsContent.style.display = 'block';
    }
}

// Update tab badges with current counts
export function updateCommTabBadges() {
    // Update Messages badge
    const messagesCount = document.getElementById('main-messages-count');
    const messagesBadge = document.getElementById('messages-tab-badge');
    if (messagesCount && messagesBadge) {
        const count = parseInt(messagesCount.textContent) || 0;
        if (count > 0) {
            messagesBadge.textContent = count;
            messagesBadge.style.display = 'inline-block';
        } else {
            messagesBadge.style.display = 'none';
        }
    }
    
    // Update Teacher Logs badge
    const logsCount = document.getElementById('main-teacher-logs-count');
    const logsBadge = document.getElementById('teacher-logs-tab-badge');
    if (logsCount && logsBadge) {
        const count = parseInt(logsCount.textContent) || 0;
        console.log('🔍 Updating Teacher Logs badge:', { count, countElement: logsCount, badgeElement: logsBadge });
        if (count > 0) {
            logsBadge.textContent = count;
            logsBadge.style.display = 'inline-block';
            console.log('✓ Teacher Logs badge shown with count:', count);
        } else {
            logsBadge.style.display = 'none';
            console.log('✓ Teacher Logs badge hidden (count is 0)');
        }
    } else {
        console.log('❌ Missing elements:', { logsCount: !!logsCount, logsBadge: !!logsBadge });
    }
}

// Close Communications window
export function closeCommunicationsWindow() {
    const commWindow = document.getElementById('communications-window');
    if (commWindow) {
        commWindow.style.display = 'none';
    }
}

// Keep old function for backwards compatibility
export function closeMainDashboardMessaging() {
    closeCommunicationsWindow();
}

// Teacher Logs Helper Functions for Communications Window

// Load Teacher Logs summary statistics
async function loadTeacherLogsSummary() {
    try {
        const response = await fetch('/api/teacher-logs/summary', {
            credentials: 'include'
        });
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        
        const data = await response.json();
        
        // API returns data under 'summary' key with specific field names
        const summary = data.summary || {};
        document.getElementById('summaryTotal').textContent = summary.total_logs || 0;
        document.getElementById('summaryUnread').textContent = summary.unread_logs || 0;
        document.getElementById('summaryRead').textContent = summary.read_logs || 0;
    } catch (error) {
        console.error('Error loading teacher logs summary:', error);
        document.getElementById('summaryTotal').innerHTML = '<i class="fas fa-exclamation-triangle text-red-500"></i>';
        document.getElementById('summaryUnread').innerHTML = '<i class="fas fa-exclamation-triangle text-red-500"></i>';
        document.getElementById('summaryRead').innerHTML = '<i class="fas fa-exclamation-triangle text-red-500"></i>';
    }
}

// Load Teacher Logs classes list with teacher names
async function loadTeacherLogsClassesList() {
    const container = document.getElementById('teacherLogsClassesList');
    
    try {
        // Fetch both teacher logs summary and users/teachers list
        const [logsResponse, usersResponse] = await Promise.all([
            fetch('/api/teacher-logs/summary', {
            credentials: 'include'
        }),
            fetch('/api/users', {
            credentials: 'include'
        })
        ]);
        
        if (!logsResponse.ok) throw new Error(`HTTP error! status: ${logsResponse.status}`);
        
        const logsData = await logsResponse.json();
        const classes = logsData.classes || {};
        
        // Get teachers data if available
        let teachers = [];
        if (usersResponse.ok) {
            const usersData = await usersResponse.json();
            teachers = usersData.filter(user => user.role === 'user' && user.class_name);
        }
        
        // Create a map of class to teacher names
        const classToTeachers = {};
        teachers.forEach(teacher => {
            if (teacher.class_name) {
                if (!classToTeachers[teacher.class_name]) {
                    classToTeachers[teacher.class_name] = [];
                }
                classToTeachers[teacher.class_name].push(teacher.username || teacher.name);
            }
        });
        
        if (Object.keys(classes).length === 0 && teachers.length === 0) {
            container.innerHTML = `
                <div class="text-center py-8">
                    <i class="fas fa-inbox text-4xl text-gray-300 mb-2"></i>
                    <p class="text-gray-500 text-sm">No logs found</p>
                </div>
            `;
            return;
        }
        
        // Get all unique classes (from logs and teachers)
        const allClasses = new Set([...Object.keys(classes), ...Object.keys(classToTeachers)]);
        
        // Sort classes by unread count (highest first)
        const sortedClasses = Array.from(allClasses).map(className => {
            const classData = classes[className];
            const unreadCount = classData ? classData.unread_logs : 0;
            return {
                className,
                unreadCount,
                teachers: classToTeachers[className] || []
            };
        }).sort((a, b) => b.unreadCount - a.unreadCount);
        
        container.innerHTML = sortedClasses.map(({className, unreadCount, teachers}) => `
            <div class="class-item relative p-3 rounded-lg cursor-pointer transition-all hover:bg-purple-100 border border-transparent hover:border-purple-300"
                 onclick="selectTeacherLogsClass('${className}')"
                 data-class="${className}">
                <div class="flex items-start justify-between">
                    <div class="flex-1">
                        <div class="flex items-center gap-2 mb-1">
                            <i class="fas fa-graduation-cap text-purple-600 text-sm"></i>
                            <span class="font-medium text-gray-700 text-sm">${className}</span>
                        </div>
                        ${teachers.length > 0 ? `
                            <div class="text-xs text-gray-500 ml-4">
                                ${teachers.map(t => `<span class="inline-block mr-1">${t}</span>`).join(', ')}
                            </div>
                        ` : ''}
                    </div>
                    ${unreadCount > 0 ? `
                        <span class="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                            ${unreadCount}
                        </span>
                    ` : ''}
                </div>
            </div>
        `).join('');
        
    } catch (error) {
        console.error('Error loading teacher logs classes list:', error);
        container.innerHTML = `
            <div class="text-center py-8">
                <i class="fas fa-exclamation-triangle text-4xl text-red-500 mb-2"></i>
                <p class="text-gray-500 text-sm">Error loading classes</p>
            </div>
        `;
    }
}

// Select a class and load its logs
export async function selectTeacherLogsClass(className) {
    // Auto-close sidebar on mobile after selection
    autoCloseSidebarIfMobile();
    
    // Update selected state in sidebar
    document.querySelectorAll('.class-item').forEach(item => {
        if (item.dataset.class === className) {
            item.classList.add('bg-purple-200', 'border-purple-400');
        } else {
            item.classList.remove('bg-purple-200', 'border-purple-400');
        }
    });
    
    // Update header
    document.getElementById('selectedClassName').textContent = `${className} - Teacher Logs`;
    
    // Load logs for this class
    await loadTeacherLogsForClass(className);
}

// Track expanded students in Communications Teacher Logs
const expandedStudentsInComm = new Set();

// Toggle expansion of a specific student's logs in Communications window
export function toggleCommStudentExpansion(studentKey) {
    // Toggle the expanded state
    if (expandedStudentsInComm.has(studentKey)) {
        expandedStudentsInComm.delete(studentKey);
    } else {
        expandedStudentsInComm.add(studentKey);
    }
    
    // Find the specific log card and toggle its older logs section
    const olderLogsSection = document.getElementById(`older-logs-${studentKey}`);
    const expandIcon = document.getElementById(`expand-icon-${studentKey}`);
    
    if (olderLogsSection && expandIcon) {
        if (expandedStudentsInComm.has(studentKey)) {
            // Expand smoothly - calculate actual height needed
            const height = olderLogsSection.scrollHeight;
            olderLogsSection.style.maxHeight = height + 'px';
            olderLogsSection.style.opacity = '1';
            olderLogsSection.style.marginTop = '12px';
            expandIcon.classList.remove('fa-chevron-right');
            expandIcon.classList.add('fa-chevron-down');
        } else {
            // Collapse smoothly
            olderLogsSection.style.maxHeight = '0';
            olderLogsSection.style.opacity = '0';
            olderLogsSection.style.marginTop = '0';
            expandIcon.classList.remove('fa-chevron-down');
            expandIcon.classList.add('fa-chevron-right');
        }
    }
}

// Load logs for a specific class
async function loadTeacherLogsForClass(className) {
    const container = document.getElementById('teacherLogsContent');
    
    // Show loading state
    container.innerHTML = `
        <div class="text-center py-16">
            <i class="fas fa-spinner fa-spin text-6xl text-gray-400 mb-4"></i>
            <p class="text-gray-500 text-lg">Loading logs...</p>
        </div>
    `;
    
    try {
        const response = await fetch(`/api/teacher-logs/class/${encodeURIComponent(className)}`);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        
        const data = await response.json();
        const logs = data.logs || [];
        
        if (logs.length === 0) {
            container.innerHTML = `
                <div class="text-center py-16">
                    <i class="fas fa-inbox text-6xl text-gray-300 mb-4"></i>
                    <p class="text-gray-500 text-lg">No logs found for this class</p>
                </div>
            `;
            return;
        }
        
        // Group student logs by student_id and get latest for each
        const studentLatestLogs = {};
        const studentLogs = logs.filter(log => log.student_id);
        
        studentLogs.forEach(log => {
            if (!studentLatestLogs[log.student_id]) {
                studentLatestLogs[log.student_id] = {
                    latestLog: log,
                    allLogs: studentLogs.filter(l => l.student_id === log.student_id).sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
                };
            }
        });
        
        // Create combined array with all logs (class logs as-is, student logs grouped)
        const combinedLogs = [];
        
        // Add class logs
        logs.filter(log => !log.student_id).forEach(log => {
            combinedLogs.push({
                type: 'class',
                log: log,
                date: new Date(log.created_at)
            });
        });
        
        // Add student logs (grouped - only latest per student)
        Object.values(studentLatestLogs).forEach(studentData => {
            combinedLogs.push({
                type: 'student',
                log: studentData.latestLog,
                allLogs: studentData.allLogs,
                date: new Date(studentData.latestLog.created_at)
            });
        });
        
        // Sort all logs chronologically (latest first)
        combinedLogs.sort((a, b) => b.date - a.date);
        
        // Display all logs chronologically with fade-in animation
        container.innerHTML = `
            <div class="space-y-4">
                ${combinedLogs.map((item, index) => {
                    const cardHtml = item.type === 'class' 
                        ? createTeacherLogCard(item.log, false)
                        : createTeacherLogCard(item.log, true, item.allLogs);
                    // Add animation delay for staggered effect
                    return cardHtml.replace('<div class="log-card', `<div class="log-card" style="animation-delay: ${index * 0.1}s;"`);
                }).join('')}
            </div>
        `;
        
    } catch (error) {
        console.error('Error loading class logs:', error);
        container.innerHTML = `
            <div class="text-center py-16">
                <i class="fas fa-exclamation-triangle text-6xl text-red-500 mb-4"></i>
                <p class="text-gray-500 text-lg">Error loading logs</p>
                <p class="text-gray-400 text-sm mt-2">${error.message}</p>
            </div>
        `;
    }
}

// Create a log card HTML (matching Teacher's Corner format)
function createTeacherLogCard(log, isStudentLog = false, allStudentLogs = []) {
    const isUnread = log.status === 'unread';
    const isImportant = log.is_important;
    const needsFollowup = log.needs_followup;
    
    // Get student info if this is a student log
    let studentInfo = '';
    let studentRoll = '';
    if (log.student_id && window.students) {
        const student = window.students.find(s => s.id === log.student_id);
        if (student) {
            studentRoll = student.rollNumber || student.roll || '';
            studentInfo = `${student.name} ${studentRoll ? `(পরিচিতি: ${studentRoll})` : ''}`;
        } else {
            studentInfo = `ছাত্র (ID: ${log.student_id})`;
        }
    }
    
    // Determine header text
    const headerText = isStudentLog ? studentInfo : 'শ্রেণী বিবরণ';
    
    // For student logs with multiple entries, check if expanded
    const studentKey = `${log.student_id}_${log.class_name}`;
    const isExpanded = expandedStudentsInComm.has(studentKey);
    const olderLogs = allStudentLogs.filter(l => l.id !== log.id);
    const hasOlderLogs = olderLogs.length > 0;
    
    return `
        <div class="log-card bg-white border-2 ${isUnread ? 'border-purple-300 bg-purple-50 cursor-pointer' : 'border-gray-200'} rounded-lg p-4 shadow-sm hover:shadow-md transition-all"
             data-log-id="${log.id}"
             data-status="${log.status}"
             ${isUnread ? `onclick="markTeacherLogAsRead(${log.id})"` : ''}>
            <div class="flex justify-between items-start mb-2">
                <div class="flex-1">
                    <div class="flex items-center gap-2 flex-wrap mb-1">
                        <span class="font-semibold text-gray-800">${headerText}</span>
                        ${isImportant ? '<span class="bg-red-100 text-red-800 text-xs px-2 py-1 rounded">গুরুত্বপূর্ণ</span>' : ''}
                        ${needsFollowup ? '<span class="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded">অনুসরণ প্রয়োজন</span>' : ''}
                        <span class="text-xs text-gray-500">- ${new Date(log.created_at).toLocaleDateString('bn-BD')}</span>
                    </div>
                    ${log.teacher_name ? `<div class="text-xs text-gray-500 mb-2">শিক্ষক: ${log.teacher_name}</div>` : ''}
                    <p class="text-sm text-gray-700 leading-relaxed">${log.details || 'No details provided'}</p>
                </div>
                <div class="flex gap-2 items-start">
                </div>
            </div>
            
            ${isStudentLog && hasOlderLogs ? `
                <div class="mt-3 pt-3 border-t border-gray-200">
                    <button id="expand-btn-${studentKey}" 
                            onclick="toggleCommStudentExpansion('${studentKey}')" 
                            class="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center gap-1">
                        <i id="expand-icon-${studentKey}" class="fas fa-${isExpanded ? 'chevron-down' : 'chevron-right'} text-xs"></i>
                        <span>${olderLogs.length} টি পুরাতন বিবরণ দেখুন</span>
                    </button>
                </div>
                <div id="older-logs-${studentKey}" class="ml-4 space-y-3" style="max-height: ${isExpanded ? '5000px' : '0'}; opacity: ${isExpanded ? '1' : '0'}; overflow: hidden; transition: max-height 0.4s ease, opacity 0.3s ease, margin-top 0.3s ease; margin-top: ${isExpanded ? '12px' : '0'};">
                    ${olderLogs.map(olderLog => {
                        const olderIsUnread = olderLog.status === 'unread';
                        const olderIsImportant = olderLog.is_important;
                        const olderNeedsFollowup = olderLog.needs_followup;
                        return `
                            <div class="bg-blue-50 p-3 rounded-md border-l-4 border-blue-400 ${olderIsUnread ? 'cursor-pointer' : ''}" 
                                 data-log-id="${olderLog.id}" 
                                 data-status="${olderLog.status}"
                                 ${olderIsUnread ? `onclick="markTeacherLogAsRead(${olderLog.id})"` : ''}>
                                <div class="flex justify-between items-start mb-2">
                                    <div class="flex-1">
                                        <div class="flex items-center gap-2 flex-wrap mb-1">
                                            <span class="font-semibold text-gray-700">${studentInfo}</span>
                                            ${olderIsImportant ? '<span class="bg-red-100 text-red-800 text-xs px-2 py-1 rounded">গুরুত্বপূর্ণ</span>' : ''}
                                            ${olderNeedsFollowup ? '<span class="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded">অনুসরণ প্রয়োজন</span>' : ''}
                                            <span class="text-xs text-gray-500">- ${new Date(olderLog.created_at).toLocaleDateString('bn-BD')}</span>
                                        </div>
                                        ${olderLog.teacher_name ? `<div class="text-xs text-gray-500 mb-2">শিক্ষক: ${olderLog.teacher_name}</div>` : ''}
                                        <p class="text-sm text-gray-700">${olderLog.details || 'No details provided'}</p>
                                    </div>
                                    <div class="flex gap-2 items-start">
                                    </div>
                                </div>
                            </div>
                        `;
                    }).join('')}
                </div>
            ` : ''}
        </div>
    `;
}

// Format date for display
function formatDateRelative(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
        return 'Today at ' + date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    } else if (diffDays === 1) {
        return 'Yesterday at ' + date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    } else if (diffDays < 7) {
        return diffDays + ' days ago';
    } else {
        return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
    }
}

// Mark a teacher log as read
export async function markTeacherLogAsRead(logId) {
    console.log(`Attempting to mark log ${logId} as read`);
    
    // Find the log card BEFORE making API call
    const logCard = document.querySelector(`[data-log-id="${logId}"]`);
    if (!logCard) {
        console.error(`Log card ${logId} not found in DOM`);
        return;
    }
    
    // Check if already read
    if (logCard.dataset.status === 'read') {
        console.log(`Log ${logId} is already marked as read`);
        return;
    }
    
    try {
        const response = await fetch(`/api/teacher-logs/${logId}/mark-read`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        console.log(`✓ Log ${logId} successfully marked as read in database`);
        
        // UPDATE UI IMMEDIATELY - Keep the log visible, just change its appearance
        
        // 1. Update data attribute
        logCard.dataset.status = 'read';
        
        // 2. Change border and background colors
        logCard.classList.remove('border-purple-300', 'bg-purple-50', 'cursor-pointer');
        logCard.classList.add('border-gray-200');
        
        // 3. Remove onclick handler
        logCard.removeAttribute('onclick');
        logCard.onclick = null;
        
        
        // 4. Remove "Click to mark as read" message
        const clickMsg = logCard.querySelector('.click-to-read-msg');
        if (clickMsg) {
            clickMsg.remove();
        }
        
        console.log(`✓ UI updated for log ${logId} - log remains visible`);
        
        // 6. Refresh counts only (don't reload logs list)
        await Promise.all([
            loadTeacherLogsSummary(),
            loadTeacherLogsClassesList(),
            updateMainTeacherLogsCount()
        ]);
        
        // 7. Update tab badges after counts are refreshed
        setTimeout(() => {
            updateCommTabBadges();
            console.log('✓ Tab badges updated after marking log as read');
        }, 100);
        
        console.log(`✓ All counts refreshed for log ${logId}`);
        
    } catch (error) {
        console.error(`Error marking log ${logId} as read:`, error);
        alert('Failed to mark log as read. Please try again.');
    }
}

// Update main dashboard Teacher Logs count
async function updateMainTeacherLogsCount() {
    try {
        const response = await fetch('/api/teacher-logs/notifications', {
            credentials: 'include'
        });
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        
        const data = await response.json();
        const totalUnread = data.total_unread || 0;
        
        // Hide loading spinner and show content
        const loadingElement = document.getElementById('communications-loading');
        const contentElement = document.getElementById('communications-content');
        if (loadingElement) loadingElement.style.display = 'none';
        if (contentElement) contentElement.style.display = 'flex';
        
        // Update the count
        const countElement = document.getElementById('main-teacher-logs-count');
        if (countElement) {
            countElement.textContent = totalUnread;
            console.log('✓ Updated main-teacher-logs-count to:', totalUnread);
        } else {
            console.log('❌ main-teacher-logs-count element not found');
        }
    } catch (error) {
        console.error('Error updating teacher logs count:', error);
        // Still show content even if there's an error, just with 0 counts
        const loadingElement = document.getElementById('communications-loading');
        const contentElement = document.getElementById('communications-content');
        if (loadingElement) loadingElement.style.display = 'none';
        if (contentElement) contentElement.style.display = 'flex';
    }
}

// Initialize main dashboard messaging interface
export function initializeMainDashboardMessaging() {
    console.log('🔄 Initializing main dashboard messaging interface');
    
    // Load both conversations and teachers (like the original system)
    loadMainDashboardConversations();
    loadMainDashboardTeachers();
    
    // Initialize message input handlers
    const messageInput = document.getElementById('mainDashboardMessageInput');
    if (messageInput) {
        messageInput.focus();
    }
}

// Initialize teacher logs system
export function initializeTeacherLogs() {
    console.log('Initializing teacher logs count on dashboard');
    // Load teacher logs count for Communications card
    updateMainTeacherLogsCount();
}

// Load conversations for main dashboard messaging
export async function loadMainDashboardConversations() {
    try {
        console.log('📱 Loading main dashboard conversations');
        
        const response = await fetch('/api/messages/conversations', {
            credentials: 'include'
        });
        if (response.ok) {
            const conversations = await response.json();
            window.mainDashboardConversations = conversations;
            renderMainDashboardSidebar();
        } else {
            console.error('❌ Failed to load conversations');
        }
    } catch (error) {
        console.error('❌ Error loading conversations:', error);
    }
}

// Load teachers for main dashboard messaging
export async function loadMainDashboardTeachers() {
    try {
        console.log('📱 Loading main dashboard teachers');
        
        const response = await fetch('/api/messages/teachers', {
            credentials: 'include'
        });
        if (response.ok) {
            const teachers = await response.json();
            window.mainDashboardTeachers = teachers;
            renderMainDashboardSidebar();
        } else {
            console.error('❌ Failed to load teachers');
        }
    } catch (error) {
        console.error('❌ Error loading teachers:', error);
    }
}

// Render sidebar with both conversations and teachers (like original messaging)
export function renderMainDashboardSidebar() {
    const conversationsList = document.getElementById('mainDashboardConversationsList');
    if (!conversationsList) return;
    
    const conversations = window.mainDashboardConversations || [];
    const teachers = window.mainDashboardTeachers || [];
    
    console.log('🔍 Rendering main dashboard sidebar:');
    console.log('  - Conversations:', conversations);
    console.log('  - Teachers:', teachers);
    console.log('  - Current user:', window.currentUser);
    
    // Update summary statistics
    updateMessagesSummary(teachers, conversations);
    
    // For admin users, show teachers list grouped by class
    if (window.currentUser && window.currentUser.role === 'admin') {
        if (teachers.length === 0) {
            conversationsList.innerHTML = `
                <div class="text-center py-8">
                    <i class="fas fa-users text-3xl text-gray-300 mb-2"></i>
                    <p class="text-gray-500 text-sm">No teachers available</p>
                </div>
            `;
            return;
        }
        
        // Group teachers by class
        const teachersByClass = {};
        const teachersWithoutClass = [];
        
        teachers.forEach(teacher => {
            if (teacher.class_name) {
                if (!teachersByClass[teacher.class_name]) {
                    teachersByClass[teacher.class_name] = [];
                }
                teachersByClass[teacher.class_name].push(teacher);
            } else {
                teachersWithoutClass.push(teacher);
            }
        });
        
        // Sort classes alphabetically
        const sortedClasses = Object.keys(teachersByClass).sort();
        
        // Build grouped HTML (similar to Teacher Logs sidebar style)
        let html = '';
        
        // Show teachers grouped by class
        sortedClasses.forEach(className => {
            const classTeachers = teachersByClass[className];
            const classUnreadCount = classTeachers.reduce((sum, t) => sum + (t.unread_count || 0), 0);
            
            html += `
                <div class="class-group mb-2">
                    <div class="class-header p-2 bg-blue-100 rounded-t-lg border-b border-blue-200">
                        <div class="flex items-center justify-between">
                            <div class="flex items-center gap-2">
                                ${classUnreadCount > 0 ? '<span class="w-2 h-2 bg-red-500 rounded-full animate-pulse flex-shrink-0"></span>' : ''}
                                <span class="font-semibold text-gray-700 text-sm">
                                    <i class="fas fa-graduation-cap text-blue-600"></i> ${className}
                                </span>
                            </div>
                            ${classUnreadCount > 0 ? `
                                <span class="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                                    ${classUnreadCount}
                                </span>
                            ` : ''}
                        </div>
                    </div>
                    <div class="class-teachers bg-white rounded-b-lg border border-blue-100 mb-3">
                        ${classTeachers.map(teacher => `
                            <div class="teacher-item p-3 border-b last:border-b-0 border-gray-100 hover:bg-blue-50 cursor-pointer transition-colors" 
                                 onclick="startMainDashboardConversationWithTeacher(${teacher.id}, '${teacher.username}')">
                                <div class="flex items-center justify-between">
                                    <div class="flex-1 ml-4">
                                        <div class="flex items-center gap-2">
                                            ${teacher.unread_count > 0 ? '<i class="fas fa-circle text-red-500 text-xs"></i>' : ''}
                                            <h4 class="font-medium text-gray-800 text-sm">${teacher.username}</h4>
                                        </div>
                                    </div>
                                    ${teacher.unread_count > 0 ? `
                                        <span class="bg-blue-500 text-white text-xs px-2 py-1 rounded-full">
                                            ${teacher.unread_count}
                                        </span>
                                    ` : ''}
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `;
        });
        
        // Show teachers without class at the end
        if (teachersWithoutClass.length > 0) {
            html += `
                <div class="class-group mb-2">
                    <div class="class-header p-2 bg-gray-100 rounded-t-lg border-b border-gray-200">
                        <span class="font-semibold text-gray-700 text-sm">
                            <i class="fas fa-users text-gray-600"></i> Other Teachers
                        </span>
                    </div>
                    <div class="class-teachers bg-white rounded-b-lg border border-gray-100">
                        ${teachersWithoutClass.map(teacher => `
                            <div class="teacher-item p-3 border-b last:border-b-0 border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors" 
                                 onclick="startMainDashboardConversationWithTeacher(${teacher.id}, '${teacher.username}')">
                                <div class="flex items-center justify-between">
                                    <div class="flex-1 ml-4">
                                        <div class="flex items-center gap-2">
                                            ${teacher.unread_count > 0 ? '<i class="fas fa-circle text-red-500 text-xs"></i>' : ''}
                                            <h4 class="font-medium text-gray-800 text-sm">${teacher.username}</h4>
                                        </div>
                                    </div>
                                    ${teacher.unread_count > 0 ? `
                                        <span class="bg-blue-500 text-white text-xs px-2 py-1 rounded-full">
                                            ${teacher.unread_count}
                                        </span>
                                    ` : ''}
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `;
        }
        
        conversationsList.innerHTML = html;
    } else {
        // For regular users, show conversations
        if (conversations.length === 0) {
            conversationsList.innerHTML = `
                <div class="text-center py-8">
                    <i class="fas fa-comments text-3xl text-gray-300 mb-2"></i>
                    <p class="text-gray-500 text-sm">No conversations yet</p>
                </div>
            `;
            return;
        }
        
        conversationsList.innerHTML = conversations.map(conv => `
            <div class="conversation-item p-3 border-b border-gray-100 hover:bg-blue-50 cursor-pointer transition-colors rounded-lg mb-2" 
                 onclick="selectMainDashboardConversation(${conv.id}, '${conv.teacher_username || conv.admin_username}')">
                <div class="flex items-center justify-between">
                    <div class="flex-1">
                        <div class="flex items-center gap-2">
                            ${conv.unread_count > 0 ? '<i class="fas fa-circle text-red-500 text-xs"></i>' : ''}
                            <h4 class="font-medium text-gray-800">${conv.teacher_username || conv.admin_username}</h4>
                        </div>
                        <p class="text-sm text-gray-500 ml-5">${conv.teacher_class || 'Admin'}</p>
                    </div>
                    ${conv.unread_count > 0 ? `<span class="bg-blue-500 text-white text-xs px-2 py-1 rounded-full">${conv.unread_count}</span>` : ''}
                </div>
            </div>
        `).join('');
    }
}

// Update messages summary statistics
function updateMessagesSummary(teachers, conversations) {
    const totalElement = document.getElementById('messagesSummaryTotal');
    const unreadElement = document.getElementById('messagesSummaryUnread');
    const readElement = document.getElementById('messagesSummaryRead');
    
    if (!totalElement || !unreadElement || !readElement) return;
    
    // For admin: count from teachers list
    if (window.currentUser && window.currentUser.role === 'admin') {
        const total = teachers.length;
        const unread = teachers.reduce((sum, t) => sum + (t.unread_count || 0), 0);
        const withUnread = teachers.filter(t => (t.unread_count || 0) > 0).length;
        
        totalElement.textContent = total;
        unreadElement.textContent = unread;
        readElement.textContent = Math.max(0, total - withUnread);
    } else {
        // For regular users: count from conversations
        const total = conversations.length;
        const unread = conversations.reduce((sum, c) => sum + (c.unread_count || 0), 0);
        const withUnread = conversations.filter(c => (c.unread_count || 0) > 0).length;
        
        totalElement.textContent = total;
        unreadElement.textContent = unread;
        readElement.textContent = Math.max(0, total - withUnread);
    }
}

// Start conversation with teacher (for admin users)
export function startMainDashboardConversationWithTeacher(teacherId, teacherName) {
    console.log(`💬 Starting conversation with teacher ${teacherName} (ID: ${teacherId})`);
    
    // Check if conversation already exists
    const conversations = window.mainDashboardConversations || [];
    console.log('🔍 Looking for conversation with teacher ID:', teacherId);
    console.log('🔍 Available conversations:', conversations);
    let conversation = conversations.find(c => c.teacher_id === teacherId);
    console.log('🔍 Found conversation:', conversation);
    
    if (conversation) {
        // Load existing conversation and messages
        console.log(`📱 Found existing conversation ${conversation.id} with ${teacherName}`);
        selectMainDashboardConversation(conversation.id, teacherName);
    } else {
        // Set up for new conversation
        console.log(`📱 No existing conversation found, setting up new conversation with ${teacherName}`);
        window.currentMainDashboardConversation = { teacherId, teacherName };
        
        // Update header
        const headerInfo = document.querySelector('#main-dashboard-messaging-window .conversation-header-info');
        if (headerInfo) {
            headerInfo.innerHTML = `
                <h3 class="text-lg font-medium text-gray-800">${teacherName}</h3>
                <p class="text-sm text-gray-500">Start new conversation</p>
            `;
        }
        
        // Clear messages area
        const messagesContainer = document.getElementById('mainDashboardMessagesContainer');
        if (messagesContainer) {
            messagesContainer.innerHTML = `
                <div class="empty-messages text-center py-12">
                    <i class="fas fa-comment-dots text-4xl text-gray-300 mb-4"></i>
                    <p class="text-gray-500">Start the conversation by sending a message</p>
                </div>
            `;
        }
    }
}

// Select conversation in main dashboard messaging
export function selectMainDashboardConversation(conversationId, userName) {
    console.log(`💬 Selecting conversation with ${userName} (ID: ${conversationId})`);
    
    // Auto-close sidebar on mobile after selection
    autoCloseSidebarIfMobile();
    
    // Track current conversation
    window.currentMainDashboardConversation = { conversationId, userName };
    
    // Update header in communications window
    const commHeader = document.querySelector('#communications-window .messages-header .conversation-header-info');
    if (commHeader) {
        commHeader.innerHTML = `
            <h3 class="text-lg font-medium text-gray-800">${userName}</h3>
            <p class="text-sm text-gray-500">Active conversation</p>
        `;
    }
    
    // Update header in old messaging window (for backward compatibility)
    const headerInfo = document.querySelector('#main-dashboard-messaging-window .conversation-header-info');
    if (headerInfo) {
        headerInfo.innerHTML = `
            <h3 class="text-lg font-medium text-gray-800">${userName}</h3>
            <p class="text-sm text-gray-500">Active conversation</p>
        `;
    }
    
    // Load messages for this conversation
    loadMainDashboardMessages(conversationId);
}

// Load messages for selected conversation
export async function loadMainDashboardMessages(conversationId) {
    try {
        console.log(`📱 Loading messages for conversation ${conversationId}`);
        
        const response = await fetch(`/api/messages/${conversationId}`);
        if (response.ok) {
            const messages = await response.json();
            renderMainDashboardMessages(messages);
        } else {
            console.error('❌ Failed to load messages');
        }
    } catch (error) {
        console.error('❌ Error loading messages:', error);
    }
}

// Render messages in main dashboard messaging
export function renderMainDashboardMessages(messages) {
    const messagesContainer = document.getElementById('mainDashboardMessagesContainer');
    if (!messagesContainer) return;
    
    if (messages.length === 0) {
        messagesContainer.innerHTML = `
            <div class="text-center py-12">
                <i class="fas fa-comment-dots text-4xl text-gray-300 mb-4"></i>
                <p class="text-gray-500">No messages yet. Start the conversation!</p>
            </div>
        `;
        return;
    }
    
    // Escape HTML to prevent XSS
    const escapeHtml = (text) => {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    };
    
    messagesContainer.innerHTML = messages.map((msg, index) => {
        const isOwnMessage = msg.sender_id === window.currentUser?.id;
        const messageTime = new Date(msg.created_at || msg.timestamp).toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
        });
        
        // Add fade-in delay for each message
        const delay = index * 0.05; // Staggered animation
        
        return `
            <div class="message mb-2 ${isOwnMessage ? 'own' : 'other'}" style="display: flex; ${isOwnMessage ? 'justify-content: flex-end;' : 'justify-content: flex-start;'} animation-delay: ${delay}s;">
                <div class="message-bubble ${isOwnMessage ? 'own' : 'other'}">
                    <div class="message-text">${escapeHtml(msg.content)}</div>
                    <div class="message-time">${messageTime}</div>
                </div>
            </div>
        `;
    }).join('');
    
    // Scroll to bottom smoothly
    setTimeout(() => {
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }, 100);
}

// Handle message key press in main dashboard
export function handleMainDashboardMessageKeyPress(event) {
    if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault();
        sendMainDashboardMessage();
    }
}

// Send message from main dashboard
export function sendMainDashboardMessage() {
    const messageInput = document.getElementById('mainDashboardMessageInput');
    const sendBtn = document.getElementById('mainDashboardSendMessageBtn');
    
    if (!messageInput || !sendBtn) return;
    
    const message = messageInput.value.trim();
    if (!message) return;
    
    // Disable input while sending
    sendBtn.disabled = true;
    sendBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
    
    // Get current conversation or teacher
    const currentConversationId = window.currentMainDashboardConversation?.conversationId;
    const currentTeacherId = window.currentMainDashboardConversation?.teacherId;
    
    if (!currentConversationId && !currentTeacherId) {
        console.error('❌ No conversation or teacher selected');
        sendBtn.disabled = false;
        sendBtn.innerHTML = '<i class="fas fa-paper-plane"></i>';
        return;
    }
    
    // Send message using the existing messaging API format
    const requestBody = {
        content: message.trim()
    };
    
    // Determine receiver_id based on current state
    let receiverId = null;
    
    if (currentConversationId) {
        // For existing conversations, find the receiver from the conversation
        const conversations = window.mainDashboardConversations || [];
        const conversation = conversations.find(c => c.id === currentConversationId);
        if (conversation) {
            // Determine who the receiver is (opposite of current user)
            receiverId = window.currentUser?.id === conversation.admin_id ? 
                conversation.teacher_id : conversation.admin_id;
        }
    } else if (currentTeacherId) {
        // For new conversations, use the teacher ID directly
        receiverId = currentTeacherId;
    }
    
    if (!receiverId) {
        console.error('❌ Could not determine receiver ID');
        sendBtn.disabled = false;
        sendBtn.innerHTML = '<i class="fas fa-paper-plane"></i>';
        return;
    }
    
    requestBody.receiver_id = receiverId;
    
    console.log('📤 Sending message with request body:', requestBody);
    
    fetch('/api/messages', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
    })
    .then(response => {
        console.log('📡 API response status:', response.status);
        return response.json();
    })
    .then(data => {
        console.log('📡 API response data:', data);
        if (data.success) {
            messageInput.value = '';
            messageInput.style.height = 'auto';
            
            // Update conversation tracking if this was a new conversation
            if (data.conversation_id && !currentConversationId) {
                window.currentMainDashboardConversation.conversationId = data.conversation_id;
            }
            
            // Reload conversations and messages
            loadMainDashboardConversations();
            if (currentConversationId || data.conversation_id) {
                loadMainDashboardMessages(currentConversationId || data.conversation_id);
            }
            
            // Update message counter
            const counter = document.getElementById('mainDashboardMessageCounter');
            if (counter) counter.textContent = '0/1000';
        }
    })
    .catch(error => {
        console.error('❌ Error sending message:', error);
    })
    .finally(() => {
        sendBtn.disabled = false;
        sendBtn.innerHTML = '<i class="fas fa-paper-plane"></i>';
        messageInput.focus();
    });
}

// Auto-resize textarea in main dashboard messaging
export function autoResizeMainDashboardTextarea(textarea) {
    textarea.style.height = 'auto';
    textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px';
    
    // Update character counter
    const counter = document.getElementById('mainDashboardMessageCounter');
    if (counter) {
        counter.textContent = textarea.value.length + '/1000';
    }
}

// Update main dashboard messages count
export function updateMainMessagesCount(count = 0) {
    console.log('🔄 updateMainMessagesCount called with count:', count);
    
    // Hide loading spinner and show content
    const loadingElement = document.getElementById('communications-loading');
    const contentElement = document.getElementById('communications-content');
    if (loadingElement) loadingElement.style.display = 'none';
    if (contentElement) contentElement.style.display = 'flex';
    
    // Update the count
    const countElement = document.getElementById('main-messages-count');
    if (countElement) {
        countElement.textContent = count.toString();
        console.log('✅ Updated main messages count to:', count);
    } else {
        console.log('❌ main-messages-count element not found');
    }
}

// ============================================
// BOOK PROGRESS FUNCTIONALITY
// ============================================

let bookProgressData = null;
let selectedBookProgressClass = null;

// Load and display Book Progress summary in dashboard card
async function loadBookProgressSummary() {
    try {
        console.log('📚 Loading book progress summary...');
        const loadingElement = document.getElementById('book-progress-loading');
        const contentElement = document.getElementById('book-progress-content');
        
        // Get all classes first
        const classesResponse = await fetch('/api/classes', {
            credentials: 'include'
        });
        if (!classesResponse.ok) throw new Error('Failed to fetch classes');
        const classes = await classesResponse.json();
        
        // Load books and progress for each class (same approach as Teachers Dashboard)
        const allProgressData = [];
        
        for (const classInfo of classes) {
            try {
                // Get books for this class
                const booksResponse = await fetch(`/api/books/class/${classInfo.id}`);
                if (!booksResponse.ok) continue;
                const books = await booksResponse.json();
                
                // Get existing progress for this class
                const progressResponse = await fetch(`/api/education?class_name=${encodeURIComponent(classInfo.name)}`);
                if (!progressResponse.ok) continue;
                const existingProgress = await progressResponse.json();
                
                // Combine books with their progress data
                books.forEach(book => {
                    const progress = existingProgress.find(p => p.book_id === book.id);
                    allProgressData.push({
                        id: book.id,
                        book_id: book.id,
                        book_name: book.book_name,
                        class_id: book.class_id,
                        class_name: classInfo.name,
                        total_pages: book.total_pages,
                        completed_pages: progress ? progress.completed_pages : 0,
                        notes: progress ? progress.notes : '',
                        last_updated: progress ? progress.last_updated : null,
                        subject_name: 'General'
                    });
                });
            } catch (error) {
                console.error(`Error loading data for class ${classInfo.name}:`, error);
            }
        }
        
        bookProgressData = allProgressData;
        console.log('📊 Book progress data (consistent with Teachers Dashboard):', bookProgressData);
        
        // Calculate overall statistics
        let totalCompleted = 0;
        let totalPages = 0;
        let totalBooks = bookProgressData.length;
        let completedBooks = 0;
        
        bookProgressData.forEach(book => {
            const completed = book.completed_pages || 0;
            const total = book.total_pages || 0;
            totalCompleted += completed;
            totalPages += total;
            if (completed >= total && total > 0) {
                completedBooks++;
            }
        });
        
        const overallPercentage = totalPages > 0 ? Math.round((totalCompleted / totalPages) * 100) : 0;
        const inProgressBooks = totalBooks - completedBooks;
        
        console.log(`📊 Stats: ${overallPercentage}% | ${totalBooks} books | ${completedBooks} completed`);
        
        // Update dashboard card
        const percentageElement = document.getElementById('book-progress-overall');
        const progressBarElement = document.getElementById('book-progress-bar');
        const statsElement = document.getElementById('book-progress-stats');
        
        if (percentageElement) percentageElement.textContent = `${overallPercentage}%`;
        if (progressBarElement) {
            progressBarElement.style.width = `${overallPercentage}%`;
            // Color code the progress bar
            const colorClass = overallPercentage >= 71 ? 'bg-green-500' : overallPercentage >= 31 ? 'bg-yellow-500' : 'bg-red-500';
            progressBarElement.className = `h-2 rounded-full transition-all duration-300 ${colorClass}`;
        }
        if (statsElement) {
            statsElement.textContent = `${totalBooks} Books | ✅ ${completedBooks} | 📖 ${inProgressBooks}`;
        }
        
        // Hide loading, show content
        if (loadingElement) loadingElement.style.display = 'none';
        if (contentElement) contentElement.style.display = 'flex';
        
        console.log('✅ Book progress summary loaded');
    } catch (error) {
        console.error('❌ Error loading book progress:', error);
        const loadingElement = document.getElementById('book-progress-loading');
        if (loadingElement) {
            loadingElement.innerHTML = '<i class="fas fa-exclamation-triangle text-red-400"></i>';
        }
    }
}

// Open Book Progress Modal
export async function openBookProgressWindow() {
    console.log('📖 Opening Book Progress modal...');
    const modal = document.getElementById('book-progress-modal');
    if (!modal) {
        console.error('❌ Book Progress modal not found');
        return;
    }
    
    // If data not loaded yet, load it
    if (!bookProgressData) {
        await loadBookProgressSummary();
    }
    
    // Group books by class
    const booksByClass = {};
    bookProgressData.forEach(book => {
        const className = book.class_name || 'Unknown';
        if (!booksByClass[className]) {
            booksByClass[className] = [];
        }
        booksByClass[className].push(book);
    });
    
    // Calculate class averages
    const classStats = {};
    Object.keys(booksByClass).forEach(className => {
        const books = booksByClass[className];
        let totalCompleted = 0;
        let totalPages = 0;
        books.forEach(book => {
            totalCompleted += book.completed_pages || 0;
            totalPages += book.total_pages || 0;
        });
        const percentage = totalPages > 0 ? Math.round((totalCompleted / totalPages) * 100) : 0;
        classStats[className] = { books, percentage };
    });
    
    // Render sidebar with classes
    renderBookProgressSidebar(classStats);
    
    // Select first class by default
    const firstClass = Object.keys(classStats)[0];
    if (firstClass) {
        selectBookProgressClass(firstClass, classStats);
    }
    
    // Prevent body scrolling and show modal
    document.body.classList.add('modal-open');
    modal.style.display = 'block';
    
    // Add click-outside-to-close functionality
    modal.onclick = function(event) {
        if (event.target === modal) {
            closeBookProgressModal();
        }
    };
    
    console.log('✅ Book Progress modal opened');
}

// Render the class sidebar
function renderBookProgressSidebar(classStats) {
    const sidebar = document.getElementById('book-progress-sidebar');
    if (!sidebar) return;
    
    const sortedClasses = Object.keys(classStats).sort();
    
    const html = sortedClasses.map(className => {
        const stats = classStats[className];
        const percentage = stats.percentage;
        const colorClass = percentage >= 71 ? 'high' : percentage >= 31 ? 'medium' : 'low';
        
        return `
            <div class="book-progress-class-item" onclick="selectBookProgressClass('${className.replace(/'/g, "\\'")}', window.bookProgressClassStats)">
                <div class="book-progress-class-name">${className}</div>
                <div class="book-progress-class-percentage ${colorClass}">${percentage}%</div>
            </div>
        `;
    }).join('');
    
    sidebar.innerHTML = html;
    
    // Store classStats globally for onclick handler
    window.bookProgressClassStats = classStats;
}

// Select a class and show its books
function selectBookProgressClass(className, classStats) {
    console.log(`📖 Selecting class: ${className}`);
    selectedBookProgressClass = className;
    
    // Update active class in sidebar
    const classItems = document.querySelectorAll('.book-progress-class-item');
    classItems.forEach(item => {
        const itemClassName = item.querySelector('.book-progress-class-name').textContent;
        if (itemClassName === className) {
            item.classList.add('active');
        } else {
            item.classList.remove('active');
        }
    });
    
    // Render books for selected class
    renderBookProgressBooks(classStats[className].books, className);
}

// Render books for selected class
function renderBookProgressBooks(books, className) {
    const detailsContainer = document.getElementById('book-progress-details');
    if (!detailsContainer) return;
    
    if (books.length === 0) {
        detailsContainer.innerHTML = `
            <div class="book-progress-empty">
                <i class="fas fa-book-open"></i>
                <p>এই শ্রেণীর জন্য কোনো বই নেই</p>
            </div>
        `;
        return;
    }
    
    // Calculate class total
    let classCompleted = 0;
    let classTotal = 0;
    books.forEach(book => {
        classCompleted += book.completed_pages || 0;
        classTotal += book.total_pages || 0;
    });
    const classPercentage = classTotal > 0 ? Math.round((classCompleted / classTotal) * 100) : 0;
    
    const booksHtml = books.map(book => {
        const completed = book.completed_pages || 0;
        const total = book.total_pages || 0;
        const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
        const colorClass = percentage >= 71 ? 'high' : percentage >= 31 ? 'medium' : 'low';
        const statusIcon = percentage === 100 ? '✓' : percentage >= 71 ? '📊' : percentage >= 31 ? '📊' : '⚠';
        
        return `
            <div class="book-progress-book-item">
                <div class="book-progress-book-title" onclick="toggleBookProgressHistory('${book.book_name.replace(/'/g, "\\'")}', '${book.id}')" style="cursor: pointer;">
                    <span>${statusIcon}</span>
                    <span>${book.book_name}</span>
                    <i class="fas fa-chevron-down" style="margin-left: auto; transition: transform 0.3s ease;" id="chevron-${book.id}"></i>
                </div>
                <div class="book-progress-book-stats">
                    <span>${completed}/${total} পৃষ্ঠা</span>
                    <span class="font-bold">${percentage}%</span>
                </div>
                <div class="book-progress-bar-container">
                    <div class="book-progress-bar-fill ${colorClass}" style="width: ${percentage}%"></div>
                </div>
                ${book.notes ? `<div class="book-progress-notes"><i class="fas fa-sticky-note mr-1"></i>${book.notes}</div>` : ''}
                <div class="book-progress-history" id="history-${book.id}">
                    <div class="book-progress-history-header">
                        <div class="book-progress-history-title">
                            <i class="fas fa-history mr-2"></i>${book.book_name} - অগ্রগতির ইতিহাস
                        </div>
                        <button class="book-progress-history-close" onclick="toggleBookProgressHistory('${book.book_name.replace(/'/g, "\\'")}', '${book.id}')">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                    <div class="book-progress-timeline" id="timeline-${book.id}">
                        <div class="book-progress-timeline-item">
                            <div class="book-progress-timeline-date">লোড হচ্ছে...</div>
                            <div class="book-progress-timeline-details">অগ্রগতির তথ্য আনতে হচ্ছে</div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }).join('');
    
    const html = `
        <div style="margin-bottom: 20px; padding-bottom: 20px; border-bottom: 2px solid #e5e7eb;">
            <h3 style="font-size: 1.25rem; font-weight: 600; color: #1f2937; margin-bottom: 10px;">
                ${className} - বইয়ের অগ্রগতি
            </h3>
            <div style="background: #f9fafb; padding: 15px; border-radius: 8px;">
                <div style="font-size: 0.875rem; color: #6b7280;">
                    <strong>সামগ্রিক অগ্রগতি:</strong> ${classCompleted}/${classTotal} পৃষ্ঠা (${classPercentage}%)
                </div>
            </div>
        </div>
        ${booksHtml}
    `;
    
    detailsContainer.innerHTML = html;
}

// Toggle Book Progress History
function toggleBookProgressHistory(bookName, bookId) {
    const historyElement = document.getElementById(`history-${bookId}`);
    const chevronElement = document.getElementById(`chevron-${bookId}`);
    const timelineElement = document.getElementById(`timeline-${bookId}`);
    
    if (!historyElement) return;
    
    if (historyElement.classList.contains('show')) {
        // Close history
        historyElement.classList.remove('show');
        chevronElement.style.transform = 'rotate(0deg)';
    } else {
        // Open history
        historyElement.classList.add('show');
        chevronElement.style.transform = 'rotate(180deg)';
        
        // Load history data if not loaded yet
        if (timelineElement.innerHTML.includes('লোড হচ্ছে...')) {
            loadBookProgressHistory(bookId, bookName);
        }
    }
}

// Load Book Progress History
async function loadBookProgressHistory(bookId, bookName) {
    const timelineElement = document.getElementById(`timeline-${bookId}`);
    if (!timelineElement) return;
    
    try {
        // Get the current class ID from the selected class
        const selectedClass = selectedBookProgressClass;
        if (!selectedClass) {
            timelineElement.innerHTML = `
                <div class="book-progress-timeline-item">
                    <div class="book-progress-timeline-date">ত্রুটি</div>
                    <div class="book-progress-timeline-details">শ্রেণী নির্বাচন করা হয়নি</div>
                </div>
            `;
            return;
        }
        
        // Get class ID from the class name
        const classId = await getClassIdByName(selectedClass);
        if (!classId) {
            timelineElement.innerHTML = `
                <div class="book-progress-timeline-item">
                    <div class="book-progress-timeline-date">ত্রুটি</div>
                    <div class="book-progress-timeline-details">শ্রেণীর তথ্য পাওয়া যায়নি</div>
                </div>
            `;
            return;
        }
        
        // Fetch real progress history from API
        const response = await fetch(`/api/education/history/book/${bookId}/class/${classId}`);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const historyData = await response.json();
        
        if (!historyData || historyData.length === 0) {
            timelineElement.innerHTML = `
                <div class="book-progress-timeline-item">
                    <div class="book-progress-timeline-date">কোনো তথ্য নেই</div>
                    <div class="book-progress-timeline-details">এই বইয়ের জন্য কোনো অগ্রগতির ইতিহাস পাওয়া যায়নি</div>
                </div>
            `;
            return;
        }
        
        // Format the real history data
        const timelineHtml = historyData.map(entry => {
            const date = new Date(entry.change_date);
            const formattedDate = date.toLocaleDateString('bn-BD', { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
            
            const totalPages = entry.total_pages || 100; // Fallback if not available
            const progressPercentage = totalPages > 0 ? Math.round((entry.completed_pages / totalPages) * 100) : 0;
            
            const description = entry.notes 
                ? `${entry.completed_pages} পৃষ্ঠা সম্পন্ন - ${entry.notes}`
                : `${entry.completed_pages} পৃষ্ঠা সম্পন্ন হয়েছে`;
            
            return `
                <div class="book-progress-timeline-item">
                    <div class="book-progress-timeline-date">${formattedDate}</div>
                    <div class="book-progress-timeline-details">${description}</div>
                    <div class="book-progress-timeline-progress">
                        <div class="book-progress-timeline-bar">
                            <div class="book-progress-timeline-bar-fill" style="width: ${progressPercentage}%"></div>
                        </div>
                        <div class="book-progress-timeline-percentage">${progressPercentage}%</div>
                    </div>
                </div>
            `;
        }).join('');
        
        timelineElement.innerHTML = timelineHtml;
        
    } catch (error) {
        console.error('Error loading book progress history:', error);
        timelineElement.innerHTML = `
            <div class="book-progress-timeline-item">
                <div class="book-progress-timeline-date">ত্রুটি</div>
                <div class="book-progress-timeline-details">অগ্রগতির তথ্য লোড করতে সমস্যা হয়েছে: ${error.message}</div>
            </div>
        `;
    }
}

// Helper function to get class ID by name
async function getClassIdByName(className) {
    try {
        const response = await fetch('/api/classes', {
            credentials: 'include'
        });
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const classes = await response.json();
        const foundClass = classes.find(cls => cls.name === className);
        return foundClass ? foundClass.id : null;
        
    } catch (error) {
        console.error('Error getting class ID by name:', error);
        return null;
    }
}

// Generate Mock Book Progress History (kept for fallback)
function generateMockBookProgressHistory(bookId, bookName) {
    const today = new Date();
    const history = [];
    
    // Generate some sample progress entries
    for (let i = 0; i < 5; i++) {
        const date = new Date(today);
        date.setDate(date.getDate() - (i * 7)); // Weekly entries
        
        const progress = Math.max(0, 100 - (i * 15)); // Decreasing progress going back in time
        const pagesCompleted = Math.floor(progress * 0.8); // Assuming max 80 pages
        
        history.push({
            date: date.toLocaleDateString('bn-BD', { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
            }),
            description: `${pagesCompleted} পৃষ্ঠা সম্পন্ন হয়েছে`,
            progress: progress
        });
    }
    
    return history;
}

// Close Book Progress Modal
function closeBookProgressModal() {
    const modal = document.getElementById('book-progress-modal');
    if (modal) {
        // Restore body scrolling and hide modal
        document.body.classList.remove('modal-open');
        modal.style.display = 'none';
    }
}

// Expose functions to global scope (legacy - these are now exported and exposed via main.js)
window.closeBookProgressModal = closeBookProgressModal;
window.selectBookProgressClass = selectBookProgressClass;
window.loadBookProgressSummary = loadBookProgressSummary;
window.toggleBookProgressHistory = toggleBookProgressHistory;
window.getClassIdByName = getClassIdByName;

export { currentReportData, sortDirection, columnFilters, generateAttendanceTrackingCalendar, updateClassWiseStats, updateDashboard, updateTodayOverview, refreshAttendanceData, updatePerformanceMetrics, updateMainDashboardAlerts, showLowScoreStudents, showAbsentStudents, toggleAlertDetails, renderAlertDetails, showTeachersCornerForClass, showStudentLogsModal, showPerformanceDetails, loadBookProgressSummary }
