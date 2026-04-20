import { getTodayString } from './utils.js';

const MOBILE_BREAKPOINT = 768;
let isAttendanceMobileView = window.innerWidth <= MOBILE_BREAKPOINT;
let attendanceResizeDebounce;
let attendanceSaveInProgress = false;
let attendanceCatchUpState = {
    required: false,
    missingDates: [],
    currentRequiredDate: null,
    startDate: null,
    coverageStatus: null
};

function getSaveAttendanceButtons() {
    return [...document.querySelectorAll('.btn-save-attendance, .mobile-save-btn')];
}

function setSaveButtonsSaving(saving) {
    const buttons = getSaveAttendanceButtons();
    const label = typeof t !== 'undefined' && t('savingInProgress') ? t('savingInProgress') : 'Saving...';
    buttons.forEach(btn => {
        if (!btn) return;
        btn.disabled = saving;
        if (saving) {
            btn.innerHTML = `<i class="fas fa-spinner fa-spin"></i> <span>${label}</span>`;
        } else {
            btn.style.background = '';
            btn.innerHTML = '<i class="fas fa-save"></i> <span>' + (typeof t !== 'undefined' && t('saveAttendance') ? t('saveAttendance') : 'Save Attendance') + '</span>';
        }
    });
}

function onAttendanceSaveBeforeUnload(e) {
    if (attendanceSaveInProgress) {
        e.preventDefault();
        e.returnValue = '';
    }
}

function normalizeLocalDateString(value) {
    if (!value) return null;
    if (typeof value === 'string' && value.match(/^\d{4}-\d{2}-\d{2}$/)) {
        return value;
    }

    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) {
        return null;
    }

    return `${parsed.getFullYear()}-${String(parsed.getMonth() + 1).padStart(2, '0')}-${String(parsed.getDate()).padStart(2, '0')}`;
}

function formatAttendanceDateLabel(dateStr) {
    if (!dateStr) return '';
    const parsed = new Date(`${dateStr}T00:00:00`);
    if (Number.isNaN(parsed.getTime())) {
        return dateStr;
    }

    return parsed.toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

function setAttendanceDateInputs(dateStr) {
    const desktopDateInput = document.getElementById('attendanceDate');
    const mobileDateInput = document.getElementById('mobileAttendanceDate');

    if (desktopDateInput) {
        desktopDateInput.value = dateStr;
        desktopDateInput.max = getTodayString();
    }
    if (mobileDateInput) {
        mobileDateInput.value = dateStr;
        mobileDateInput.max = getTodayString();
    }
}

function getStudentsForAttendanceDate(selectedDate, selectedClass = '', options = {}) {
    const { ignoreClassFilter = false } = options;

    function parseInactivationDate(inactivationDate) {
        if (!inactivationDate) return null;

        if (typeof inactivationDate === 'string' && inactivationDate.match(/^\d{4}-\d{2}-\d{2}$/)) {
            return inactivationDate;
        }

        if (typeof inactivationDate === 'string') {
            try {
                const date = new Date(inactivationDate);
                if (!Number.isNaN(date.getTime())) {
                    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
                }
            } catch (error) {
                console.warn('Failed to parse inactivation date:', inactivationDate, error);
            }
        }

        return null;
    }

    let permissionFilteredStudents = students;
    if (typeof window.getUserAllowedClasses === 'function') {
        const allowedClasses = window.getUserAllowedClasses();
        if (allowedClasses && !allowedClasses.includes('all')) {
            permissionFilteredStudents = students.filter(student =>
                allowedClasses.includes(student.class)
            );
        }
    }

    const dateFilteredStudents = permissionFilteredStudents.filter(student => {
        if (student.status === 'active') {
            return true;
        }

        if (student.status === 'inactive' && student.inactivationDate) {
            const parsedInactivationDate = parseInactivationDate(student.inactivationDate);
            if (parsedInactivationDate) {
                return selectedDate < parsedInactivationDate;
            }
        }

        return false;
    });

    if (ignoreClassFilter || !selectedClass || selectedClass.trim() === '') {
        return dateFilteredStudents;
    }

    return dateFilteredStudents.filter(student => student.class === selectedClass);
}

function getCompletionTargetStudentsForDate(selectedDate) {
    return getStudentsForAttendanceDate(selectedDate, '', { ignoreClassFilter: true });
}

function getIncompleteAttendanceStudents(selectedDate, targetStudents) {
    const dateAttendance = attendance[selectedDate] || {};

    return targetStudents
        .filter(student => {
            const record = dateAttendance[student.id];
            if (!record || !record.status || record.status === 'neutral') {
                return true;
            }

            if (record.status === 'absent' && (!record.reason || !record.reason.trim())) {
                return true;
            }

            return false;
        })
        .map(student => student.name || student.id);
}

function getAttendanceCatchUpMessage() {
    if (!attendanceCatchUpState.required || !attendanceCatchUpState.currentRequiredDate) {
        return '';
    }

    const dateLabel = formatAttendanceDateLabel(attendanceCatchUpState.currentRequiredDate);
    const remainingCount = attendanceCatchUpState.missingDates.length;
    return `${t('attendanceCatchUpDescription')} ${t('attendanceCatchUpNextDate')} ${dateLabel}. ${t('attendanceCatchUpRemaining')} ${remainingCount}.`;
}

function isAttendanceCatchUpRequired() {
    return attendanceCatchUpState.required;
}

function renderAttendanceCatchUpBanner() {
    const attendanceSection = document.getElementById('attendance');
    if (!attendanceSection) {
        return;
    }

    let banner = document.getElementById('attendanceCatchUpBanner');
    if (!attendanceCatchUpState.required) {
        if (banner) {
            banner.remove();
        }

        const desktopDateInput = document.getElementById('attendanceDate');
        const mobileDateInput = document.getElementById('mobileAttendanceDate');
        if (desktopDateInput) desktopDateInput.disabled = false;
        if (mobileDateInput) mobileDateInput.disabled = false;
        return;
    }

    if (!banner) {
        banner = document.createElement('div');
        banner.id = 'attendanceCatchUpBanner';
        banner.style.cssText = 'margin: 16px 0; padding: 14px 16px; border-left: 4px solid #e67e22; background: #fff7ec; border-radius: 8px; color: #7a4b00;';
        const attendanceHeader = attendanceSection.querySelector('.attendance-header');
        if (attendanceHeader && attendanceHeader.nextSibling) {
            attendanceSection.insertBefore(banner, attendanceHeader.nextSibling);
        } else {
            attendanceSection.prepend(banner);
        }
    }

    banner.innerHTML = `
        <strong>${t('attendanceCatchUpRequired')}</strong>
        <div style="margin-top: 6px;">${getAttendanceCatchUpMessage()}</div>
    `;

    // Reminder-only: do not lock date inputs; admin can pick any date
}

async function focusAttendanceCatchUpDate(showDialog = false) {
    if (!attendanceCatchUpState.required || !attendanceCatchUpState.currentRequiredDate) {
        return;
    }

    setAttendanceDateInputs(attendanceCatchUpState.currentRequiredDate);
    renderAttendanceCatchUpBanner();

    if (showDialog && typeof showModal === 'function') {
        showModal(t('attendanceCatchUpRequired'), getAttendanceCatchUpMessage());
    }

    if (window.location.hash !== '#attendance') {
        window.location.hash = '#attendance';
    }

    if (typeof window.showSection === 'function') {
        await window.showSection('attendance');
    }
}

function enforceAttendanceCatchUpNavigation(sectionId) {
    // Reminder-only: do not block navigation; admin can use the app freely
    return false;
}

async function refreshAttendanceCatchUpState(options = {}) {
    const { showDialog = false, afterSave = false } = options;

    if (!window.currentUser || window.currentUser.role !== 'admin') {
        attendanceCatchUpState = {
            required: false,
            missingDates: [],
            currentRequiredDate: null,
            startDate: null,
            coverageStatus: attendanceCatchUpState.coverageStatus
        };
        renderAttendanceCatchUpBanner();
        return attendanceCatchUpState;
    }

    if (!attendanceCatchUpState.coverageStatus?.isCurrent) {
        attendanceCatchUpState = {
            required: false,
            missingDates: [],
            currentRequiredDate: null,
            startDate: null,
            coverageStatus: attendanceCatchUpState.coverageStatus
        };
        renderAttendanceCatchUpBanner();
        return attendanceCatchUpState;
    }

    const today = getTodayString();
    const startDate = attendanceCatchUpState.startDate || normalizeLocalDateString(window.currentEducationalYear?.start_date) || normalizeLocalDateString(window.academicYearStartDate);
    if (!startDate || startDate > today) {
        attendanceCatchUpState = {
            required: false,
            missingDates: [],
            currentRequiredDate: null,
            startDate,
            coverageStatus: attendanceCatchUpState.coverageStatus
        };
        renderAttendanceCatchUpBanner();
        return attendanceCatchUpState;
    }

    const missingDates = [];
    const currentDate = new Date(`${startDate}T00:00:00`);
    const todayDate = new Date(`${today}T00:00:00`);

    while (currentDate <= todayDate) {
        const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(currentDate.getDate()).padStart(2, '0')}`;
        const targetStudents = getCompletionTargetStudentsForDate(dateStr);
        if (targetStudents.length > 0) {
            const incompleteStudents = getIncompleteAttendanceStudents(dateStr, targetStudents);
            if (incompleteStudents.length > 0) {
                missingDates.push(dateStr);
            }
        }
        currentDate.setDate(currentDate.getDate() + 1);
    }

    attendanceCatchUpState = {
        ...attendanceCatchUpState,
        required: missingDates.length > 0,
        missingDates,
        currentRequiredDate: missingDates[0] || null,
        startDate
    };

    renderAttendanceCatchUpBanner();

    if (attendanceCatchUpState.required) {
        // Reminder-only: at startup show a reminder modal; do not force redirect or lock
        if (showDialog && typeof showModal === 'function') {
            showModal(t('attendanceCatchUpRequired'), t('attendanceCatchUpReminder'));
        }
        if (afterSave) {
            // After saving a date, still advance state; no forced redirect
        }
    } else if (afterSave && typeof showModal === 'function') {
        showModal(t('success'), t('attendanceCatchUpCompleted'));
    }

    return attendanceCatchUpState;
}

async function initializeAttendanceCatchUp(options = {}) {
    attendanceCatchUpState.startDate = normalizeLocalDateString(options.currentEducationalYear?.start_date) || normalizeLocalDateString(window.currentEducationalYear?.start_date) || normalizeLocalDateString(window.academicYearStartDate);
    attendanceCatchUpState.coverageStatus = options.coverageStatus || attendanceCatchUpState.coverageStatus || { isCurrent: false };
    return refreshAttendanceCatchUpState({ showDialog: true });
}

function handleAttendanceResponsiveResize() {
    const attendanceListElement = document.getElementById('attendanceList');
    if (!attendanceListElement) {
        return;
    }

    const isMobileNow = window.innerWidth <= MOBILE_BREAKPOINT;
    if (isMobileNow === isAttendanceMobileView) {
        return;
    }

    isAttendanceMobileView = isMobileNow;

    const selectedDate = document.getElementById('attendanceDate')?.value ||
        document.getElementById('mobileAttendanceDate')?.value ||
        getTodayString();

    if (!attendance[selectedDate]) {
        attendance[selectedDate] = {};
    }

    if (isMobileNow) {
        const filteredStudents = getFilteredStudents();
        generateMobileAttendanceHTML(selectedDate, filteredStudents);
    } else {
        loadAttendanceForDate();
    }
}

window.addEventListener('resize', () => {
    if (attendanceResizeDebounce) {
        clearTimeout(attendanceResizeDebounce);
    }
    attendanceResizeDebounce = setTimeout(handleAttendanceResponsiveResize, 150);
});

function initializeTodayAttendance() {
    const todayStr = getTodayString();
    if (!attendance[todayStr]) {
        attendance[todayStr] = {};
    }
    
    // Only initialize empty attendance structure, don't auto-mark anyone as present
    students.forEach(student => {
        if (!attendance[today][student.id]) {
            attendance[today][student.id] = {
                status: 'unmarked', // Change from 'present' to 'unmarked'
                reason: ''
            };
        }
    });
    
    saveData();
}

async function loadTodayAttendance() {
    const todayStr = getTodayString();
    const attendanceDateInput = document.getElementById('attendanceDate');
    attendanceDateInput.value = todayStr;
    attendanceDateInput.max = todayStr; // Set max date to today
    await loadAttendanceForDate();
}

function updateDateInputMax() {
    // Use local date methods to avoid timezone issues
    const todayStr = getTodayString();
    const attendanceDateInput = document.getElementById('attendanceDate');
    if (attendanceDateInput) {
        attendanceDateInput.max = todayStr;
    }
}

async function autoCopyAttendanceIfNeeded(date) {
    /**
     * Auto-copy attendance from the most recent previous date if no attendance exists
     */
    try {
        // Get current user ID
        const userId = window.currentUser ? window.currentUser.id : null;
        
        console.log(`🔄 Attempting to auto-copy attendance for ${date}...`);
        
        const response = await fetch('/api/attendance/auto-copy', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                date: date,
                user_id: userId
            })
        });
        
        if (!response.ok) {
            console.warn(`⚠️ Auto-copy API returned ${response.status}`);
            return;
        }
        
        const result = await response.json();
        
        if (result.success) {
            console.log(`✅ Auto-copied ${result.copied_count} records from ${result.source_date} to ${date}`);
            
            // Reload attendance from database to get the auto-copied data
            const attendanceResponse = await fetch('/api/attendance', {
            credentials: 'include'
        });
            if (attendanceResponse.ok) {
                const attendanceData = await attendanceResponse.json();
                window.attendance = attendanceData;
                console.log('✅ Refreshed attendance data from database');
                
                // Show notification to user
                showNotification(`📋 Attendance auto-copied from ${result.source_date}`, 'info');
            }
        } else if (result.exists) {
            console.log(`ℹ️ Attendance already exists for ${date}`);
        } else {
            console.log(`ℹ️ No previous attendance available to copy: ${result.message}`);
        }
        
    } catch (error) {
        console.error('❌ Error auto-copying attendance:', error);
        // Don't show error to user - just log it and continue
    }
}

function showNotification(message, type = 'info') {
    /**
     * Show a temporary notification to the user
     */
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 20px;
        background: ${type === 'info' ? '#2196F3' : type === 'success' ? '#4CAF50' : '#f44336'};
        color: white;
        border-radius: 8px;
        box-shadow: 0 4px 6px rgba(0,0,0,0.2);
        z-index: 10000;
        animation: slideIn 0.3s ease;
    `;
    
    document.body.appendChild(notification);
    
    // Remove after 3 seconds
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

async function loadAttendanceForDate() {
    let selectedDate = document.getElementById('attendanceDate')?.value || document.getElementById('mobileAttendanceDate')?.value;
    const attendanceList = document.getElementById('attendanceList');
    
    // Only populate class filter if it's empty (first time load)
    if (typeof populateAttendanceClassFilter === 'function') {
        const classFilter = document.getElementById('classFilter');
        if (classFilter && classFilter.options.length <= 1) {
        setTimeout(() => {
            populateAttendanceClassFilter();
            populateMobileClassFilter();
            }, 100);
        }
    }
    
    // Sync mobile class filter with desktop
    const desktopClassFilter = document.getElementById('classFilter');
    const mobileClassFilter = document.getElementById('mobileClassFilter');
    if (desktopClassFilter && mobileClassFilter) {
        populateMobileClassFilter();
        if (desktopClassFilter.value !== mobileClassFilter.value) {
            mobileClassFilter.value = desktopClassFilter.value;
        }
    }
    
    // If no date is selected, automatically set today's date
    if (!selectedDate) {
        selectedDate = getTodayString();
        const desktopDateInput = document.getElementById('attendanceDate');
        const mobileDateInput = document.getElementById('mobileAttendanceDate');
        if (desktopDateInput) desktopDateInput.value = selectedDate;
        if (mobileDateInput) mobileDateInput.value = selectedDate;
    }
    
    // Sync date inputs
    const desktopDateInput = document.getElementById('attendanceDate');
    const mobileDateInput = document.getElementById('mobileAttendanceDate');
    if (desktopDateInput && mobileDateInput && desktopDateInput.value !== mobileDateInput.value) {
        mobileDateInput.value = desktopDateInput.value;
        selectedDate = desktopDateInput.value;
    } else if (desktopDateInput && selectedDate) {
        desktopDateInput.value = selectedDate;
    } else if (mobileDateInput && selectedDate) {
        mobileDateInput.value = selectedDate;
    }

    // Reminder-only: admin can pick any date; no forcing to current required date

    // Update max date for mobile input
    if (mobileDateInput) {
        mobileDateInput.max = getTodayString();
    }
    
    // Check if selected date is in the future
    const todayStr = getTodayString();
    
    // Debug: Log date comparison
    console.log('Selected date:', selectedDate);
    console.log('Today string:', todayStr);
    console.log('Date comparison:', selectedDate, '>', todayStr, '=', selectedDate > todayStr);
    
    // Compare dates as strings to avoid timezone issues
    if (selectedDate > todayStr) {
        showModal(t('error'), t('cannotTakeAttendanceForFutureDate'));
        return;
    }
    
    // REMOVED: Auto-copy now happens on app startup, not on page load
    // The autoCopyAttendanceIfNeeded() function is still available for manual "Copy from Previous Day" button
    renderAttendanceCatchUpBanner();
    
    // Initialize attendance record for the day if it doesn't exist
    if (!attendance[selectedDate]) {
        attendance[selectedDate] = {};
    }
    
    let filteredStudents = getFilteredStudents();
    
    // Debug: Log students data (reduced logging)
    console.log(`Loading ${filteredStudents.length} students for ${selectedDate}`);
    
    // Sort students by class and then roll number
    filteredStudents.sort((a, b) => {
        const classA = getClassNumber(a.class);
        const classB = getClassNumber(b.class);
        if (classA !== classB) return classA - classB;
        return parseRollNumber(a.rollNumber) - parseRollNumber(b.rollNumber);
    });
    
    updateFilteredStudentCount(filteredStudents.length);
    
    // Update filter status indicator
    updateFilterStatus();
    
    if (filteredStudents.length === 0) {
        attendanceList.innerHTML = `<p>${t('noStudentsFound')}</p>`;
        console.log('No students found - showing empty message');
        return;
    }
    
    // Generate mobile attendance HTML structure
    generateMobileAttendanceHTML(selectedDate, filteredStudents);
    
    // Generating HTML for students (desktop version)
    attendanceList.innerHTML = filteredStudents.map(student => {
        const studentAttendance = attendance[selectedDate][student.id] || { status: 'neutral', reason: '' };
        const status = studentAttendance.status;
        const isAbsent = status === 'absent';
        const isPresent = status === 'present';
        const isHoliday = status === 'holiday';
        const isNeutral = status === 'neutral' || !status;
        
        // Set toggle appearance and next status based on current status
        let toggleClass, nextStatus;
        if (isNeutral) {
            toggleClass = 'neutral';
            nextStatus = 'present';
        } else if (isPresent) {
            toggleClass = 'present';
            nextStatus = 'absent';
        } else if (isAbsent) {
            toggleClass = 'absent';
            nextStatus = 'holiday';
        } else if (isHoliday) {
            toggleClass = 'holiday';
            nextStatus = 'neutral';
        }
        
        // Get status text for display
        const statusTexts = {
            'present': t('present') || 'Present',
            'absent': t('absent') || 'Absent',
            'holiday': t('holiday') || 'Holiday',
            'neutral': t('clear') || 'Clear',
            'clear': t('clear') || 'Clear'
        };
        
        const currentStatusText = statusTexts[status] || statusTexts['neutral'];
        
        return `
            <div class="student-row">
                <div class="student-info-with-toggle">
                    <div class="student-info">
                        <h4>Roll: ${student.rollNumber || 'N/A'} - <span class="clickable-name" onclick="showStudentDetail('${student.id}')">${student.name} বিন ${student.fatherName}</span>
                        ${isAbsent ? `
                            <span class="inline-reason-input">
                                <input type="text" 
                                       placeholder="${t('reasonForAbsence')}"
                                       value="${studentAttendance.reason || ''}"
                                       onchange="updateAbsenceReason('${student.id}', '${selectedDate}', this.value)"
                                       class="reason-input-inline">
                            </span>
                        ` : ''}
                        ${isAbsent && studentAttendance.reason ? `
                            <span class="reason-display">(${studentAttendance.reason})</span>
                        ` : ''}
                        </h4>
                    </div>
                    <div class="attendance-toggle">
                        <div class="attendance-dropdown">
                            <div class="dropdown-toggle ${status}" onclick="toggleAttendanceDropdown('${student.id}', '${selectedDate}')">
                                <span>${currentStatusText}</span>
                                <span>▼</span>
                        </div>
                            <div class="dropdown-menu" id="dropdown-${student.id}">
                                <div class="dropdown-item" onclick="selectAttendanceStatus('${student.id}', '${selectedDate}', 'present')">
                                    <div class="status-dot present"></div>
                                    <span>${t('present') || 'Present'}</span>
                    </div>
                                <div class="dropdown-item" onclick="selectAttendanceStatus('${student.id}', '${selectedDate}', 'absent')">
                                    <div class="status-dot absent"></div>
                                    <span>${t('absent') || 'Absent'}</span>
                                </div>
                                <div class="dropdown-item" onclick="selectAttendanceStatus('${student.id}', '${selectedDate}', 'holiday')">
                                    <div class="status-dot holiday"></div>
                                    <span>${t('holiday') || 'Holiday'}</span>
                                </div>
                                <div class="dropdown-item" onclick="selectAttendanceStatus('${student.id}', '${selectedDate}', 'neutral')">
                                    <div class="status-dot neutral"></div>
                                    <span>${t('clear') || 'Clear'}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }).join('');
    
    // Refresh attendance calendar if it's visible to show current date status
    refreshAttendanceCalendarIfVisible();
    
    // Update Hijri date for attendance page
    if (typeof updateAttendancePageHijri === 'function') {
        updateAttendancePageHijri();
    }
    
    console.log(`✅ Attendance loaded: ${filteredStudents.length} students`);
}

async function copyPreviousDayAttendance() {
    const selectedDate = document.getElementById('attendanceDate')?.value || document.getElementById('mobileAttendanceDate')?.value;
    if (!selectedDate) {
        showModal(t('error'), t('pleaseSelectDate'));
        return;
    }

    const selectedDateObj = new Date(selectedDate);
    selectedDateObj.setDate(selectedDateObj.getDate() - 1);
    const previousDate = selectedDateObj.toISOString().split('T')[0];

    if (attendance[previousDate] && Object.keys(attendance[previousDate]).length > 0) {
        // Deep copy the attendance data
        attendance[selectedDate] = JSON.parse(JSON.stringify(attendance[previousDate]));
        
        // Refresh the attendance list to show the copied data
        await loadAttendanceForDate();
        
        showModal(t('success'), t('successfullyCopiedAttendance'));

        // Show visual indication that changes are pending
        const saveButton = document.querySelector('.btn-save-attendance');
        if (saveButton) {
            saveButton.style.background = '#e67e22';
            saveButton.textContent = 'Save Changes*';
        }
    } else {
        showModal(t('error'), t('noAttendanceDataForPreviousDay'));
    }
}

// New dropdown functions
function toggleAttendanceDropdown(studentId, date) {
    // Close all other dropdowns first
    document.querySelectorAll('.dropdown-menu').forEach(menu => {
        menu.classList.remove('show');
    });
    
    // Toggle current dropdown
    const dropdown = document.getElementById(`dropdown-${studentId}`);
    if (dropdown) {
        dropdown.classList.toggle('show');
    }
}

function selectAttendanceStatus(studentId, date, status) {
    // Close the dropdown
    const dropdown = document.getElementById(`dropdown-${studentId}`);
    if (dropdown) {
        dropdown.classList.remove('show');
    }
    
    // Update attendance directly without full refresh
    updateAttendanceStatus(studentId, date, status);
}

// Optimized function to update only the specific student row
async function updateAttendanceStatus(studentId, date, status) {
    // Holiday status is now allowed - no restrictions
    
    if (!attendance[date]) {
        attendance[date] = {};
    }
    
    // Update attendance data
    if (status === 'neutral') {
        delete attendance[date][studentId];
    } else {
        attendance[date][studentId] = {
            status: status || 'neutral',
            reason: status === 'present' || status === 'neutral' ? '' : (attendance[date][studentId]?.reason || '')
        };
    }
    
    // Update only the specific student row instead of regenerating everything
    updateStudentRow(studentId, date, status);
    
    // Update student count display (important for UI consistency)
    const filteredStudents = getFilteredStudents();
    updateFilteredStudentCount(filteredStudents.length);
    
    // Update filter status indicator
    updateFilterStatus();
    
    // Show visual indication that changes are pending
    const saveButton = document.querySelector('.btn-save-attendance');
    if (saveButton) {
        saveButton.style.background = '#e67e22';
        saveButton.innerHTML = '<i class="fas fa-save"></i> Save Changes*';
    }
    
    // Only refresh calendar if it's visible (minimal update)
    refreshAttendanceCalendarIfVisible();
}

// Function to update only a specific student row
function updateStudentRow(studentId, date, status) {
    const student = students.find(s => s.id === studentId);
    if (!student) return;
    
    const studentAttendance = attendance[date][studentId] || { status: 'neutral', reason: '' };
    const isAbsent = status === 'absent';
    const isPresent = status === 'present';
    const isHoliday = status === 'holiday';
    const isNeutral = status === 'neutral' || !status;
    
    // Get status text for display
    const statusTexts = {
        'present': t('present') || 'Present',
        'absent': t('absent') || 'Absent',
        'holiday': t('holiday') || 'Holiday',
        'neutral': t('clear') || 'Clear',
        'clear': t('clear') || 'Clear'
    };
    
    const currentStatusText = statusTexts[status] || statusTexts['neutral'];
    
    // Find the student row and update it
    const studentRows = document.querySelectorAll('.student-row');
    studentRows.forEach(row => {
        const nameElement = row.querySelector('.clickable-name');
        if (nameElement && nameElement.getAttribute('onclick').includes(studentId)) {
            // Update the dropdown toggle
            const dropdownToggle = row.querySelector('.dropdown-toggle');
            if (dropdownToggle) {
                dropdownToggle.className = `dropdown-toggle ${status}`;
                const textSpan = dropdownToggle.querySelector('span:first-child');
                if (textSpan) {
                    textSpan.textContent = currentStatusText;
                }
            }
            
            // Update reason input visibility
            const reasonInput = row.querySelector('.inline-reason-input');
            const reasonDisplay = row.querySelector('.reason-display');
            
            if (isAbsent) {
                if (!reasonInput) {
                    // Add reason input
                    const h4 = row.querySelector('h4');
                    if (h4) {
                        h4.innerHTML += `
                            <span class="inline-reason-input">
                                <input type="text" 
                                       placeholder="${t('reasonForAbsence')}"
                                       value="${studentAttendance.reason || ''}"
                                       onchange="updateAbsenceReason('${studentId}', '${date}', this.value)"
                                       class="reason-input-inline">
                            </span>
                        `;
                    }
                }
                if (reasonDisplay) {
                    reasonDisplay.textContent = studentAttendance.reason ? `(${studentAttendance.reason})` : '';
                }
            } else if (isHoliday) {
                // Holiday status - no reason input needed
                if (reasonInput) reasonInput.remove();
                if (reasonDisplay) reasonDisplay.remove();
            } else {
                // Remove reason input and display
                if (reasonInput) reasonInput.remove();
                if (reasonDisplay) reasonDisplay.remove();
            }
        }
    });
}

// Close dropdowns when clicking outside
document.addEventListener('click', function(e) {
    // Close desktop dropdowns
    if (!e.target.closest('.attendance-dropdown')) {
        document.querySelectorAll('.dropdown-menu').forEach(menu => {
            menu.classList.remove('show');
        });
    }
    
    // Close mobile dropdowns
    if (!e.target.closest('.mobile-attendance-dropdown')) {
        document.querySelectorAll('.mobile-dropdown-menu').forEach(menu => {
            menu.classList.remove('show');
        });
        document.querySelectorAll('.mobile-student-card').forEach(card => {
            card.classList.remove('dropdown-open');
        });
    }
});

// Make functions globally accessible
window.toggleAttendanceDropdown = toggleAttendanceDropdown;
window.selectAttendanceStatus = selectAttendanceStatus;

async function toggleAttendance(studentId, date, status) {
    // Holiday status is now allowed - no restrictions
    
    if (!attendance[date]) {
        attendance[date] = {};
    }
    
    // Only update in memory, don't save to database yet
    if (status === 'neutral') {
        // Remove the student from attendance record if setting to neutral
        delete attendance[date][studentId];
    } else {
        attendance[date][studentId] = {
            status: status || 'neutral',
            reason: status === 'present' || status === 'neutral' ? '' : (attendance[date][studentId]?.reason || '')
        };
        
        // No modal needed - reason input will appear inline
    }
    
    // Refresh the display without saving to database
    await loadAttendanceForDate();
    
    // Show visual indication that changes are pending
    const saveButton = document.querySelector('.btn-save-attendance');
    if (saveButton) {
        saveButton.style.background = '#e67e22';
        saveButton.innerHTML = '<i class="fas fa-save"></i> Save Changes*';
    }
    
    // Only refresh calendar if it's visible (minimal update)
    refreshAttendanceCalendarIfVisible();
}

function updateAbsenceReason(studentId, date, reason) {
    if (!attendance[date]) {
        attendance[date] = {};
    }
    
    if (!attendance[date][studentId]) {
        attendance[date][studentId] = { status: 'absent', reason: '' };
    }
    
    // Only update in memory, don't save to database yet
    attendance[date][studentId].reason = reason;
    
    // Show visual indication that changes are pending
    const saveButton = document.querySelector('.btn-save-attendance');
    if (saveButton) {
        saveButton.style.background = '#e67e22';
        saveButton.innerHTML = '<i class="fas fa-save"></i> Save Changes*';
    }
}

async function saveAttendance() {
    const selectedDate = document.getElementById('attendanceDate')?.value || document.getElementById('mobileAttendanceDate')?.value;
    
    console.log('Saving attendance for date:', selectedDate);
    
    // Holiday status is now allowed - no restrictions
    
    // Initialize attendance record for the day if it doesn't exist
    if (!attendance[selectedDate]) {
        attendance[selectedDate] = {};
    }
    
    // Get all filtered students for the current date
    const filteredStudents = getFilteredStudents();
    
    // Only save attendance for students who have been explicitly marked (not neutral)
    // Remove neutral/unset students from the attendance record
    filteredStudents.forEach(student => {
        if (attendance[selectedDate][student.id]?.status === 'neutral') {
            delete attendance[selectedDate][student.id];
        }
    });
    
    // Count present and absent students
    let presentCount = 0;
    let absentCount = 0;
    
    // Check if any absent students don't have a reason
    const absentStudentsWithoutReason = [];
    
    Object.entries(attendance[selectedDate]).forEach(([studentId, record]) => {
        if (record.status === 'present') {
            presentCount++;
        } else if (record.status === 'absent') {
            absentCount++;
            // Check if absent student has no reason
            if (!record.reason || record.reason.trim() === '') {
                const student = students.find(s => s.id === studentId);
                absentStudentsWithoutReason.push(student ? student.name : studentId);
            }
        }
    });
    
    const completionTargetStudents = attendanceCatchUpState.required && window.currentUser?.role === 'admin'
        ? getCompletionTargetStudentsForDate(selectedDate)
        : filteredStudents;
    const incompleteStudents = getIncompleteAttendanceStudents(selectedDate, completionTargetStudents);

    if (incompleteStudents.length > 0) {
        const preview = incompleteStudents.slice(0, 10).join(', ');
        const moreCount = incompleteStudents.length > 10 ? ` ${t('andMoreStudents')} ${incompleteStudents.length - 10}` : '';
        showModal(
            t('attendanceCatchUpRequired'),
            `${t('attendanceMustMarkAllStudents')} ${t('attendanceIncompleteStudents')} ${preview}${moreCount}`
        );
        return;
    }

    // If there are absent students without reasons, show error and prevent saving
    if (absentStudentsWithoutReason.length > 0) {
        const studentNames = absentStudentsWithoutReason.join(', ');
        showModal(t('error'), `Please provide absence reasons for: ${studentNames}`);
        return;
    }
    
    console.log(`Saving attendance: ${presentCount} present, ${absentCount} absent (${filteredStudents.length} total)`);
    
    console.log('Current attendance object before save:', attendance);
    
    let saveSucceeded = false;
    attendanceSaveInProgress = true;
    window.addEventListener('beforeunload', onAttendanceSaveBeforeUnload);
    setSaveButtonsSaving(true);
    
    try {
        // Save to database via API
        const response = await fetch('/api/attendance', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(attendance),
            credentials: 'include'
        });
        
        if (response.ok) {
        saveSucceeded = true;
        console.log('Attendance saved successfully to database');
        
        // Mark this date as saved
        savedAttendanceDates.add(selectedDate);
        console.log(`Added ${selectedDate} to savedAttendanceDates, total saved dates: ${savedAttendanceDates.size}`);
        
        // Note: Removed automatic sticky attendance to future dates
        // Users can manually use "Copy Previous Day" feature if needed
        
        // Clean up any existing sticky attendance data
        await cleanupStickyAttendanceData();
        
        // Reset save button appearance (both desktop and mobile)
        const savedLabel = typeof t !== 'undefined' && t('saved') ? t('saved') : 'Saved!';
        const saveLabel = typeof t !== 'undefined' && t('saveAttendance') ? t('saveAttendance') : 'Save Attendance';
        getSaveAttendanceButtons().forEach(btn => {
            if (btn) {
                btn.disabled = false;
                btn.style.background = '#27ae60';
                btn.innerHTML = `<i class="fas fa-check"></i> <span>${savedLabel}</span>`;
            }
        });
        setTimeout(() => {
            getSaveAttendanceButtons().forEach(btn => {
                if (btn) {
                    btn.style.background = '';
                    btn.innerHTML = '<i class="fas fa-save"></i> <span>' + saveLabel + '</span>';
                }
            });
        }, 2000);
        
        // Force dashboard update after saving attendance
        if (typeof forceUpdateDashboard === 'function') {
            forceUpdateDashboard();
        } else {
            // Force refresh attendance data from server before updating dashboard
            if (typeof refreshAttendanceData === 'function') {
                await refreshAttendanceData();
            }
            updateDashboard();
        }
        
            const successMessage = `${t('attendanceSavedSuccessfully')} ${presentCount} ${t('present')}, ${absentCount} ${t('absent')} (${filteredStudents.length} ${t('total')}).`;
            
            // Refresh attendance calendar if it's visible to show updated attendance data
            refreshAttendanceCalendarIfVisible();
            
            // Force refresh the calendar after a short delay to ensure data is updated
            setTimeout(() => {
                refreshAttendanceCalendarIfVisible();
                forceRefreshAttendanceCalendar();
            }, 500);

            if (attendanceCatchUpState.required && window.currentUser?.role === 'admin') {
                await refreshAttendanceCatchUpState({ afterSave: true });
                if (!attendanceCatchUpState.required) {
                    showModal(t('success'), `${successMessage} ${t('attendanceCatchUpCompleted')}`);
                }
            } else {
                showModal(t('success'), successMessage);
            }
        } else {
            const error = await response.json();
            throw new Error(error.error || 'Failed to save attendance');
        }
    } catch (error) {
        console.error('Error saving attendance:', error);
        setSaveButtonsSaving(false);
        // Network/connection errors (no internet, server unreachable, DNS failure)
        const isNetworkError = error.name === 'TypeError' && (error.message === 'Failed to fetch' || error.message.includes('NetworkError'));
        const message = isNetworkError
            ? (t('failedToSaveAttendance') + ' ' + t('checkConnection'))
            : (error.message || t('failedToSaveAttendance'));
        showModal(t('error'), message);
    } finally {
        attendanceSaveInProgress = false;
        window.removeEventListener('beforeunload', onAttendanceSaveBeforeUnload);
        if (!saveSucceeded) {
            setSaveButtonsSaving(false);
        }
    }
}

async function applyStickyAttendanceToFuture(savedDate) {
    console.log('Applying sticky attendance to future dates from:', savedDate);
    
    const today = new Date();
    const savedDateObj = new Date(savedDate);
    
    // Only apply to future dates, not past dates
    if (savedDateObj < today) {
        console.log('Saved date is in the past, not applying to future');
        return;
    }
    
    // Get the attendance for the saved date
    const savedAttendance = attendance[savedDate];
    if (!savedAttendance) {
        console.log('No attendance found for saved date');
        return;
    }
    
    // Find all future dates (up to 30 days ahead) and apply the same attendance
    const futureDates = [];
    for (let i = 1; i <= 30; i++) {
        const futureDate = new Date(savedDateObj);
        futureDate.setDate(savedDateObj.getDate() + i);
        const futureDateStr = futureDate.toISOString().split('T')[0];
        
        // Include all dates (holiday status is handled in attendance data)
            futureDates.push(futureDateStr);
    }
    
    console.log(`Found ${futureDates.length} future dates to apply sticky attendance to`);
    
    // Apply the saved attendance to all future dates
    futureDates.forEach(futureDate => {
        // Only apply if there's no existing attendance for this date
        if (!attendance[futureDate] || Object.keys(attendance[futureDate]).length === 0) {
            attendance[futureDate] = {};
            
            // Copy each student's attendance status
            Object.keys(savedAttendance).forEach(studentId => {
                attendance[futureDate][studentId] = {
                    status: savedAttendance[studentId].status,
                    reason: savedAttendance[studentId].reason || ''
                };
            });
        }
    });
    
    // Save the updated attendance to the database
    try {
        const response = await fetch('/api/attendance', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(attendance)
        });
        
                 if (response.ok) {
             console.log('Sticky attendance applied to future dates successfully');
             
             // Mark all future dates as saved
             futureDates.forEach(futureDate => {
                 if (attendance[futureDate] && Object.keys(attendance[futureDate]).length > 0) {
                     savedAttendanceDates.add(futureDate);
                 }
             });
             
             // Refresh attendance calendar if it's visible to show updated attendance data
             refreshAttendanceCalendarIfVisible();
         } else {
             console.error('Failed to save sticky attendance to database');
         }
    } catch (error) {
        console.error('Error applying sticky attendance to future:', error);
    }
}

async function cleanupStickyAttendanceData() {
    console.log('Cleaning up sticky attendance data...');
    
    const todayStr = getTodayString();
    
    // Get all dates that have attendance data
    const attendanceDates = Object.keys(attendance);
    const datesToRemove = [];
    
    // Find dates that are in the future and were automatically applied
    attendanceDates.forEach(dateStr => {
        if (dateStr > todayStr) {
            // Check if this date has the same attendance pattern as today
            const todayAttendance = attendance[todayStr];
            const futureAttendance = attendance[dateStr];
            
            if (todayAttendance && futureAttendance) {
                // Compare if the attendance patterns are identical (indicating auto-application)
                const todayKeys = Object.keys(todayAttendance);
                const futureKeys = Object.keys(futureAttendance);
                
                if (todayKeys.length === futureKeys.length) {
                    let isIdentical = true;
                    for (const studentId of todayKeys) {
                        if (!futureAttendance[studentId] || 
                            futureAttendance[studentId].status !== todayAttendance[studentId].status) {
                            isIdentical = false;
                            break;
                        }
                    }
                    
                    if (isIdentical) {
                        datesToRemove.push(dateStr);
                    }
                }
            }
        }
    });
    
    // Remove the automatically applied future dates
    datesToRemove.forEach(dateStr => {
        delete attendance[dateStr];
        savedAttendanceDates.delete(dateStr);
        console.log(`Removed auto-applied attendance for date: ${dateStr}`);
    });
    
    if (datesToRemove.length > 0) {
        console.log(`Cleaned up ${datesToRemove.length} auto-applied future dates`);
        
        // Save the cleaned attendance data to database
        try {
            const response = await fetch('/api/attendance', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(attendance)
            });
            
            if (response.ok) {
                console.log('Cleaned attendance data saved to database');
                // Refresh attendance calendar if it's visible
                refreshAttendanceCalendarIfVisible();
            } else {
                console.error('Failed to save cleaned attendance data');
            }
        } catch (error) {
            console.error('Error saving cleaned attendance data:', error);
        }
    } else {
        console.log('No auto-applied future dates found to clean up');
    }
}

function updateFilteredStudentCount(count) {
    const countElement = document.getElementById('filteredStudentCount');
    if (countElement) {
        countElement.textContent = count;
    }
    // Also update mobile count - Compact format (just number)
    const mobileCountElement = document.getElementById('mobileFilteredStudentCount');
    if (mobileCountElement) {
        mobileCountElement.textContent = count;
    }
}

// Function to update filter status indicator
function updateFilterStatus() {
    const classFilter = document.getElementById('classFilter');
    const resetButton = document.querySelector('.class-filter button[onclick*="resetAttendanceClassFilter"]');
    
    if (classFilter && resetButton) {
        const selectedClass = classFilter.value;
        
        if (selectedClass && selectedClass.trim() !== '') {
            // A class is selected - show active state
            resetButton.style.display = 'inline-block';
            resetButton.style.opacity = '1';
            resetButton.title = `Reset to All Classes (currently showing: ${selectedClass})`;
            
            // Add visual indicator to the class filter
            classFilter.style.borderColor = '#3498db';
            classFilter.style.backgroundColor = '#f8f9fa';
        } else {
            // No class selected - show inactive state
            resetButton.style.display = 'inline-block';
            resetButton.style.opacity = '0.6';
            resetButton.title = 'Reset to All Classes';
            
            // Remove visual indicator from the class filter
            classFilter.style.borderColor = '';
            classFilter.style.backgroundColor = '';
        }
    }
}

function getFilteredStudents() {
    const selectedDate = document.getElementById('attendanceDate')?.value || document.getElementById('mobileAttendanceDate')?.value;
    const selectedClass = document.getElementById('classFilter')?.value || document.getElementById('mobileClassFilter')?.value || '';
    let finalFilteredStudents = getStudentsForAttendanceDate(selectedDate, selectedClass);
    if (selectedClass && selectedClass.trim() !== '') {
        console.log('🔍 getFilteredStudents - Filtering by class:', selectedClass);
        console.log('🔍 getFilteredStudents - students for selected date before class filter:', getStudentsForAttendanceDate(selectedDate, '', { ignoreClassFilter: true }).length);
        
        // Debug: Show sample student class data
        console.log('🔍 getFilteredStudents - Sample student classes:', finalFilteredStudents.slice(0, 5).map(s => ({ name: s.name, class: s.class })));
        console.log('🔍 getFilteredStudents - finalFilteredStudents after class filter:', finalFilteredStudents.length);
        
        // If no matches found, show more debugging
        if (finalFilteredStudents.length === 0) {
            console.warn('⚠️ No students found for class:', selectedClass);
            console.warn('⚠️ Available classes in student data:', [...new Set(getStudentsForAttendanceDate(selectedDate, '', { ignoreClassFilter: true }).map(s => s.class))]);
            console.warn('⚠️ Selected class:', selectedClass);
        }
    } else {
        console.log('🔍 getFilteredStudents - No class selected or "All Classes" selected, showing all students');
    }
    return finalFilteredStudents;
}

async function markAllPresent() {
    const selectedDate = document.getElementById('attendanceDate')?.value || document.getElementById('mobileAttendanceDate')?.value;
    if (!selectedDate) {
        showModal(t('error'), t('pleaseSelectDate'));
        return;
    }
    
    // Holiday status is now allowed - no restrictions
    
    const filteredStudents = getFilteredStudents();
    if (filteredStudents.length === 0) {
        showModal(t('error'), t('noStudentsFound'));
        return;
    }
    
    // Initialize attendance for the date if it doesn't exist
    if (!attendance[selectedDate]) {
        attendance[selectedDate] = {};
    }
    
    // Mark all filtered students as present
    filteredStudents.forEach(student => {
        attendance[selectedDate][student.id] = {
            status: 'present',
            reason: ''
        };
    });
    
    // Refresh display without saving to database
    await loadAttendanceForDate();
    
    // Show visual indication that changes are pending
    const saveButton = document.querySelector('.btn-save-attendance') || document.querySelector('.mobile-save-btn');
    if (saveButton) {
        saveButton.style.background = '#e67e22';
        saveButton.innerHTML = '<i class="fas fa-save"></i> <span>Save Changes*</span>';
    }
    
    // Refresh attendance calendar if it's visible to show updated status
    refreshAttendanceCalendarIfVisible();
    
    // Also try force refresh as backup (for debugging)
    setTimeout(() => forceRefreshAttendanceCalendar(), 100);
    
    // Update dashboard to reflect the changes
    if (typeof updateDashboard === 'function') {
        updateDashboard();
    }
    
    showModal(t('success'), `${filteredStudents.length} ${t('studentsConfirmedPresent')}`);
}

function showMarkAllAbsentModal() {
    const selectedDate = document.getElementById('attendanceDate')?.value || document.getElementById('mobileAttendanceDate')?.value;
    if (!selectedDate) {
        showModal(t('error'), t('pleaseSelectDate'));
        return;
    }
    
    const filteredStudents = getFilteredStudents();
    if (filteredStudents.length === 0) {
        showModal(t('error'), t('noStudentsFound'));
        return;
    }
    
    // Clear previous reason
    document.getElementById('bulkAbsentReason').value = '';
    
    // Show modal
    document.getElementById('bulkAbsentModal').style.display = 'block';
}

function closeBulkAbsentModal() {
    document.getElementById('bulkAbsentModal').style.display = 'none';
}

async function confirmMarkAllAbsent() {
    const selectedDate = document.getElementById('attendanceDate')?.value || document.getElementById('mobileAttendanceDate')?.value;
    const reason = document.getElementById('bulkAbsentReason').value.trim();
    
    if (!reason) {
        showModal(t('error'), t('pleaseProvideReason'));
        return;
    }
    
    // Note: Holiday status is now handled in attendance data, not blocked here
    
    const filteredStudents = getFilteredStudents();
    
    // Initialize attendance for the date if it doesn't exist
    if (!attendance[selectedDate]) {
        attendance[selectedDate] = {};
    }
    
    // Mark all filtered students as absent with the provided reason
    filteredStudents.forEach(student => {
        attendance[selectedDate][student.id] = {
            status: 'absent',
            reason: reason
        };
    });
    
    // Refresh display without saving to database
    await loadAttendanceForDate();
    closeBulkAbsentModal();
    
    // Show visual indication that changes are pending
    const saveButton = document.querySelector('.btn-save-attendance') || document.querySelector('.mobile-save-btn');
    if (saveButton) {
        saveButton.style.background = '#e67e22';
        saveButton.innerHTML = '<i class="fas fa-save"></i> <span>Save Changes*</span>';
    }
    
    // Refresh attendance calendar if it's visible to show updated status
    refreshAttendanceCalendarIfVisible();
    
    // Update dashboard to reflect the changes
    if (typeof updateDashboard === 'function') {
        updateDashboard();
    }
    
    showModal(t('success'), `${filteredStudents.length} ${t('studentsMarkedAbsent')}`);
}

async function markAllNeutral() {
    const selectedDate = document.getElementById('attendanceDate')?.value || document.getElementById('mobileAttendanceDate')?.value;
    if (!selectedDate) {
        showModal(t('error'), t('pleaseSelectDate'));
        return;
    }
    
    // Holiday status is now allowed - no restrictions
    
    const filteredStudents = getFilteredStudents();
    if (filteredStudents.length === 0) {
        showModal(t('error'), t('noStudentsFound'));
        return;
    }
    
    // Initialize attendance for the date if it doesn't exist
    if (!attendance[selectedDate]) {
        attendance[selectedDate] = {};
    }
    
    // Remove all filtered students from attendance record (set to neutral)
    filteredStudents.forEach(student => {
        if (attendance[selectedDate][student.id]) {
            delete attendance[selectedDate][student.id];
        }
    });
    
    // Refresh display without saving to database
    await loadAttendanceForDate();
    
    // Show visual indication that changes are pending
    const saveButton = document.querySelector('.btn-save-attendance') || document.querySelector('.mobile-save-btn');
    if (saveButton) {
        saveButton.style.background = '#e67e22';
        saveButton.innerHTML = '<i class="fas fa-save"></i> <span>Save Changes*</span>';
    }
    
    // Refresh attendance calendar if it's visible to show updated status
    refreshAttendanceCalendarIfVisible();
    
    // Update dashboard to reflect the cleared attendance
    if (typeof updateDashboard === 'function') {
        updateDashboard();
    }
    
    showModal(t('success'), `${filteredStudents.length} ${t('studentsMarkedNeutral')}`);
}

async function markAllHoliday() {
    const selectedDate = document.getElementById('attendanceDate')?.value || document.getElementById('mobileAttendanceDate')?.value;
    if (!selectedDate) {
        showModal(t('error'), t('pleaseSelectDate'));
        return;
    }
    
    const filteredStudents = getFilteredStudents();
    if (filteredStudents.length === 0) {
        showModal(t('error'), t('noStudentsFound'));
        return;
    }
    
    if (!confirm(`${t('confirmMarkAllHoliday')} ${filteredStudents.length} ${t('students')}?`)) {
        return;
    }
    
    // Initialize attendance record for the day if it doesn't exist
    if (!attendance[selectedDate]) {
        attendance[selectedDate] = {};
    }
    
    // Mark all filtered students as holiday
    filteredStudents.forEach(student => {
        attendance[selectedDate][student.id] = {
            status: 'holiday',
            reason: ''
        };
    });
    
    // Refresh display without saving to database
    await loadAttendanceForDate();
    
    // Show visual indication that changes are pending
    const saveButton = document.querySelector('.btn-save-attendance') || document.querySelector('.mobile-save-btn');
    if (saveButton) {
        saveButton.style.background = '#e67e22';
        saveButton.innerHTML = '<i class="fas fa-save"></i> <span>Save Changes*</span>';
    }
    
    // Refresh attendance calendar if it's visible to show updated status
    refreshAttendanceCalendarIfVisible();
    
    // Update dashboard to reflect the changes
    if (typeof updateDashboard === 'function') {
        updateDashboard();
    }
    
    showModal(t('success'), `${filteredStudents.length} ${t('studentsMarkedHoliday')}`);
}

// REMOVED: autoCopyFromPreviousDay() function (dead code - never called)
// Auto-copy now happens on app startup via backend

let studentDetailSource = 'attendance'; // Track where student detail was opened from

async function showStudentDetail(studentId, source = 'attendance') {
    let student = students.find(s => s.id === studentId);

    if (!student) {
        // If student not found in local array, fetch from backend
        try {
            const response = await fetch(`/api/students/${studentId}`);
            if (response.ok) {
                student = await response.json();
            } else if (response.status === 404) {
                showModal(t('error'), t('studentNotFound'));
                return;
            } else {
                console.error(`Error fetching student ${studentId}:`, response.statusText);
                showModal(t('error'), t('failedToFetchStudent'));
                return;
            }
        } catch (error) {
            console.error(`Network error fetching student ${studentId}:`, error);
            showModal(t('error'), t('networkError'));
            return;
        }
    }

    if (!student) {
        showModal(t('error'), t('studentNotFound'));
        return;
    }
    
    // Store the source for navigation back
    studentDetailSource = source;
    
    // Use the unified student profile modal instead of separate page
    if (typeof window.showStudentProfile === 'function') {
        // Ensure Teachers Corner has the latest student data loaded
        if (typeof window.loadStudentsFromMainApp === 'function') {
            await window.loadStudentsFromMainApp();
        }
        // Call the Teachers Corner profile function
        await window.showStudentProfile(studentId);
        } else {
        // Fallback to basic modal if Teachers Corner function not available
        const photoHtml = student.photo_path ? 
            `<div class="text-center mb-4">
                <img src="/${student.photo_path}" alt="Student Photo" style="width: 150px; height: 150px; border-radius: 50%; object-fit: cover; border: 3px solid #e5e7eb;">
            </div>` : 
            `<div class="text-center mb-4">
                <div style="width: 150px; height: 150px; border-radius: 50%; background: #f3f4f6; border: 3px solid #e5e7eb; display: flex; align-items: center; justify-content: center; margin: 0 auto; color: #9ca3af; font-size: 14px;">No Photo</div>
            </div>`;
        
        showModal(t('studentDetails'), `
            <div class="space-y-4">
                ${photoHtml}
                <div><strong>${t('name')}:</strong> ${student.name} বিন ${student.fatherName}</div>
                <div><strong>${t('rollNumber')}:</strong> ${student.rollNumber || 'N/A'}</div>
                <div><strong>${t('class')}:</strong> ${student.class}</div>
                <div><strong>${t('mobile')}:</strong> ${student.mobileNumber || student.mobile || 'N/A'}</div>
                <div><strong>${t('address')}:</strong> ${student.upazila}, ${student.district}</div>
                    </div>
        `);
    }
}





















function showResetAttendanceModal() {
    document.getElementById('resetAttendanceModal').style.display = 'block';
    document.getElementById('resetConfirmationInput').value = '';
    document.getElementById('confirmResetBtn').disabled = true;
}

function closeResetAttendanceModal() {
    document.getElementById('resetAttendanceModal').style.display = 'none';
    document.getElementById('resetConfirmationInput').value = '';
    document.getElementById('confirmResetBtn').disabled = true;
}

async function confirmResetAttendance() {
    const confirmationInput = document.getElementById('resetConfirmationInput');
    const confirmationText = confirmationInput.value.trim().toUpperCase();
    
    if (confirmationText !== 'RESET') {
        showModal(t('error'), t('attendanceResetPleaseTypeReset'));
        return;
    }
    
    // Show loading state
    const confirmBtn = document.getElementById('confirmResetBtn');
    const originalText = confirmBtn.innerHTML;
    confirmBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Resetting...';
    confirmBtn.disabled = true;
    
    try {
        // Reset attendance in database by sending null instead of empty object
        const response = await fetch('/api/attendance', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(null) // Send null to reset attendance
        });
        
        if (response.ok) {
            // Clear local data
            attendance = {};
            savedAttendanceDates.clear();
            
            // Close modal
            closeResetAttendanceModal();
            
            // Update UI
            updateDashboard();
            refreshAttendanceCalendarIfVisible();
            
            // Reset attendance table if currently viewing
            await loadAttendanceForDate();
            
            showModal(t('success'), t('attendanceResetSuccess'));
            
            console.log('Attendance history reset successfully');
        } else {
            const errorData = await response.text();
            console.error('Server response:', errorData);
            throw new Error('Failed to reset attendance in database');
        }
    } catch (error) {
        console.error('Error resetting attendance:', error);
        showModal(t('error'), t('attendanceResetFailed'));
        
        // Reset button state
        confirmBtn.innerHTML = originalText;
        confirmBtn.disabled = false;
    }
}


// Function to populate the attendance class filter with available classes
function populateAttendanceClassFilter() {
    console.log('🔄 populateAttendanceClassFilter called');
    
    const classFilter = document.getElementById('classFilter');
    if (!classFilter) {
        console.warn('⚠️ classFilter element not found');
        return;
    }
    
    console.log('✅ Found classFilter element:', classFilter);
    
    // Preserve the current selection before clearing
    const currentValue = classFilter.value;
    console.log('🔍 Current selected value before repopulating:', currentValue);
    
    // Clear existing options and add "All Classes" option
    classFilter.innerHTML = '<option value="">All Classes</option>';
    console.log('✅ Cleared existing options, current options:', Array.from(classFilter.options).map(opt => ({ value: opt.value, text: opt.textContent })));
    
    // Get classes from window.classes (populated by main app)
    console.log('🔍 window.classes:', window.classes);
    console.log('🔍 typeof window.classes:', typeof window.classes);
    console.log('🔍 window.classes.length:', window.classes ? window.classes.length : 'undefined');
    
    if (window.classes && window.classes.length > 0) {
        console.log('✅ Populating attendance class filter with classes:', window.classes);
        console.log('✅ Class names to add:', window.classes.map(cls => cls.name));
        
        window.classes.forEach((cls, index) => {
            console.log(`🔄 Processing class ${index + 1}:`, cls);
            const option = document.createElement('option');
            option.value = cls.name;
            option.textContent = cls.name;
            classFilter.appendChild(option);
            console.log(`✅ Added class option: ${cls.name}`);
        });
        console.log(`✅ Added ${window.classes.length} class options to attendance filter`);
        
        // Restore the previous selection if it exists
        if (currentValue && currentValue.trim() !== '') {
            classFilter.value = currentValue;
            console.log('✅ Restored previous selection:', currentValue);
        } else {
            // Only set to empty if no previous selection
            classFilter.value = '';
            console.log('✅ Set to "All Classes" (no previous selection)');
        }
        
        // Debug: Show what's actually in the dropdown
        console.log('🔍 Final class filter options:', Array.from(classFilter.options).map(opt => ({ value: opt.value, text: opt.textContent })));
        console.log('🔍 Final selected value:', classFilter.value);
        
        // Also check for potential class name mismatches
        if (window.students && window.students.length > 0) {
            const studentClasses = [...new Set(window.students.map(s => s.class))];
            console.log('🔍 Student classes found:', studentClasses);
            console.log('🔍 Database classes:', window.classes.map(cls => cls.name));
            
            // Check for mismatches
            const mismatches = studentClasses.filter(studentClass => 
                !window.classes.some(dbClass => dbClass.name === studentClass)
            );
            if (mismatches.length > 0) {
                console.warn('⚠️ Class name mismatches found:', mismatches);
                console.warn('⚠️ These student classes are not in the database classes');
            }
        }
    } else {
        console.warn('⚠️ No classes available for attendance filter');
        console.warn('🔍 window.classes:', window.classes);
        
        // Try to wait for classes to be loaded
        if (!window.classes) {
            console.log('⏳ Classes not loaded yet, waiting...');
            setTimeout(() => {
                console.log('🔄 Retrying populateAttendanceClassFilter after delay...');
                populateAttendanceClassFilter();
            }, 1000);
        }
    }
}

// Manual function to refresh class filter (can be called from console for debugging)
function refreshAttendanceClassFilter() {
    console.log('🔄 Manual refresh of attendance class filter called');
    populateAttendanceClassFilter();
}

// Function to reset class filter to "All Classes"
function resetAttendanceClassFilter() {
    console.log('🔄 Resetting attendance class filter to "All Classes"');
    const classFilter = document.getElementById('classFilter');
    if (classFilter) {
        classFilter.value = '';
        // Trigger the change event to refresh the student list
        loadAttendanceForDate();
    }
}

// Generate mobile attendance HTML structure
function generateMobileAttendanceHTML(selectedDate, filteredStudents) {
    // Check if we're on mobile
    console.log('🔍 Mobile attendance check:', { innerWidth: window.innerWidth, isMobile: window.innerWidth <= 768 });
    if (window.innerWidth > 768) {
        console.log('📱 Skipping mobile attendance - screen too wide');
        return;
    }

    if (!attendance[selectedDate]) {
        attendance[selectedDate] = {};
    }
    
    console.log('📱 Generating mobile attendance HTML for', filteredStudents.length, 'students');
    
    // Get current date info
    const today = new Date();
    const dateStr = new Date(selectedDate).toLocaleDateString('en-US', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
    });
    
    // Get class filter value
    const classFilter = document.getElementById('classFilter');
    const selectedClass = classFilter ? classFilter.value : '';
    const classText = selectedClass ? selectedClass : 'All Classes';
    
    // Find attendance section
    const attendanceSection = document.getElementById('attendance');
    if (!attendanceSection) return;
    
    // Remove existing mobile structure if any - Complete cleanup
    const existingMobile = attendanceSection.querySelector('.mobile-attendance-header');
    if (existingMobile) {
        existingMobile.remove();
    }
    
    // Also remove any old student-count elements that might exist
    const oldStudentCount = attendanceSection.querySelector('.student-count:not(.student-count-compact)');
    if (oldStudentCount) {
        oldStudentCount.remove();
    }
    
    const existingActions = attendanceSection.querySelector('.mobile-attendance-actions');
    if (existingActions) {
        existingActions.remove();
    }
    
    const existingList = attendanceSection.querySelector('.mobile-attendance-list');
    if (existingList) {
        existingList.remove();
    }
    
    // Remove any bottom bar (should not exist in new version, but clean up old versions)
    const existingBottom = attendanceSection.querySelector('.mobile-attendance-bottom');
    if (existingBottom) {
        existingBottom.remove();
    }
    
    // Also check for any mobile-bottom-btn elements that might be orphaned
    const orphanedButtons = attendanceSection.querySelectorAll('.mobile-bottom-btn');
    orphanedButtons.forEach(btn => btn.remove());
    
    // Create mobile header - Ultra Compact version
    const mobileHeader = document.createElement('div');
    mobileHeader.className = 'mobile-attendance-header';
    mobileHeader.innerHTML = `
        <div class="header-top">
            <button class="back-btn" onclick="showSection('dashboard')">
                <i class="fas fa-arrow-left"></i>
            </button>
            <div class="header-title">Attendance</div>
            <div class="student-count-compact">
                <i class="fas fa-users count-icon"></i>
                <span id="mobileFilteredStudentCount">${filteredStudents.length}</span>
            </div>
            <button class="menu-btn" onclick="toggleMobileMenu()">
                <i class="fas fa-bars"></i>
            </button>
        </div>
        
        <div class="header-filters">
            <div class="date-info-mobile">
                <i class="fas fa-calendar-alt date-icon"></i>
                <input type="date" id="mobileAttendanceDate" value="${selectedDate}" max="${getTodayString()}" onchange="handleMobileDateChange(this.value)">
            </div>
            
            <div class="class-selector-mobile">
                <i class="fas fa-graduation-cap class-icon"></i>
                <select id="mobileClassFilter" onchange="handleMobileClassFilterChange(this.value)">
                    <option value="">All Classes</option>
                    ${window.classes && window.classes.length > 0 ? window.classes.map(cls => 
                        `<option value="${cls.name}" ${selectedClass === cls.name ? 'selected' : ''}>${cls.name}</option>`
                    ).join('') : ''}
                </select>
            </div>
        </div>
    `;
    
    // Create quick actions - Ultra Compact version with all 6 buttons (horizontal scroll)
    const mobileActions = document.createElement('div');
    mobileActions.className = 'mobile-attendance-actions';
    mobileActions.innerHTML = `
        <div class="actions-title">Quick Actions</div>
        <div class="actions-grid">
            <button class="action-btn present-btn" onclick="markAllPresent()">
                <i class="fas fa-check"></i>
                <span>Present</span>
            </button>
            <button class="action-btn absent-btn" onclick="showMarkAllAbsentModal()">
                <i class="fas fa-times"></i>
                <span>Absent</span>
            </button>
            <button class="action-btn holiday-btn" onclick="markAllHoliday()">
                <i class="fas fa-calendar"></i>
                <span>Holiday</span>
            </button>
            <button class="action-btn clear-btn" onclick="markAllNeutral()">
                <i class="fas fa-eraser"></i>
                <span>Clear</span>
            </button>
            <button class="action-btn copy-btn" onclick="copyPreviousDayAttendance()">
                <i class="fas fa-copy"></i>
                <span>Copy</span>
            </button>
            <button class="action-btn save-btn" onclick="saveAttendance()">
                <i class="fas fa-save"></i>
                <span>Save</span>
            </button>
        </div>
    `;
    
    // Create student list
    const mobileList = document.createElement('div');
    mobileList.className = 'mobile-attendance-list';
    
    const studentCards = filteredStudents.map(student => {
        const studentAttendance = attendance[selectedDate][student.id] || { status: 'neutral', reason: '' };
        const status = studentAttendance.status;
        const isAbsent = status === 'absent';
        
        // Get status class and text
        let statusClass, statusText, statusIcon;
        switch(status) {
            case 'present':
                statusClass = 'mobile-status-present';
                statusText = 'Present';
                statusIcon = 'fas fa-check';
                break;
            case 'absent':
                statusClass = 'mobile-status-absent';
                statusText = 'Absent';
                statusIcon = 'fas fa-times';
                break;
            case 'holiday':
                statusClass = 'mobile-status-holiday';
                statusText = 'Holiday';
                statusIcon = 'fas fa-calendar';
                break;
            default:
                statusClass = 'mobile-status-neutral';
                statusText = 'Not Set';
                statusIcon = 'fas fa-minus';
                break;
        }
        
        return `
            <div class="mobile-student-card">
                <div class="student-info">
                    <div class="student-name-row">
                        <div class="student-name">${student.name} বিন ${student.fatherName}</div>
                        <div class="student-roll-compact">${student.rollNumber || student.roll || 'N/A'}</div>
                    </div>
                    ${isAbsent && studentAttendance.reason ? `
                        <div class="student-reason">Reason: ${studentAttendance.reason}</div>
                    ` : ''}
                    ${isAbsent ? `
                        <div class="reason-input-mobile">
                            <input type="text" 
                                   placeholder="${t('reasonForAbsence')}"
                                   value="${studentAttendance.reason || ''}"
                                   onchange="updateMobileAbsenceReason('${student.id}', '${selectedDate}', this.value)"
                                   class="mobile-reason-input">
                        </div>
                    ` : ''}
                </div>
                <div class="mobile-attendance-right">
                    <div class="mobile-attendance-dropdown">
                        <div class="mobile-dropdown-toggle ${statusClass}" onclick="toggleMobileAttendanceDropdown('${student.id}', '${selectedDate}')">
                            <i class="${statusIcon}"></i>
                            <span>${statusText}</span>
                            <i class="fas fa-chevron-down mobile-status-arrow"></i>
                        </div>
                        <div class="mobile-dropdown-menu" id="mobile-dropdown-${student.id}">
                            <div class="mobile-dropdown-item" onclick="selectMobileAttendanceStatus('${student.id}', '${selectedDate}', 'present')">
                                <div class="status-dot present"></div>
                                <span>${t('present') || 'Present'}</span>
                            </div>
                            <div class="mobile-dropdown-item" onclick="selectMobileAttendanceStatus('${student.id}', '${selectedDate}', 'absent')">
                                <div class="status-dot absent"></div>
                                <span>${t('absent') || 'Absent'}</span>
                            </div>
                            <div class="mobile-dropdown-item" onclick="selectMobileAttendanceStatus('${student.id}', '${selectedDate}', 'holiday')">
                                <div class="status-dot holiday"></div>
                                <span>${t('holiday') || 'Holiday'}</span>
                            </div>
                            <div class="mobile-dropdown-item" onclick="selectMobileAttendanceStatus('${student.id}', '${selectedDate}', 'neutral')">
                                <div class="status-dot neutral"></div>
                                <span>${t('clear') || 'Clear'}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }).join('');
    
    mobileList.innerHTML = studentCards;
    
    // Insert mobile elements (buttons are in quick actions now - no separate bottom bar)
    attendanceSection.insertBefore(mobileHeader, attendanceSection.firstChild);
    attendanceSection.appendChild(mobileActions);
    attendanceSection.appendChild(mobileList);
    
    console.log('✅ Mobile attendance HTML generated successfully');
}

// Mobile attendance dropdown toggle function
function toggleMobileAttendanceDropdown(studentId, date) {
    // Close all other dropdowns first
    document.querySelectorAll('.mobile-dropdown-menu').forEach(menu => {
        menu.classList.remove('show');
    });
    
    // Remove show class from all cards
    document.querySelectorAll('.mobile-student-card').forEach(card => {
        card.classList.remove('dropdown-open');
    });
    
    // Toggle current dropdown
    const dropdown = document.getElementById(`mobile-dropdown-${studentId}`);
    const card = dropdown?.closest('.mobile-student-card');
    if (dropdown) {
        dropdown.classList.toggle('show');
        if (dropdown.classList.contains('show')) {
            if (card) card.classList.add('dropdown-open');
        } else {
            if (card) card.classList.remove('dropdown-open');
        }
    }
}

// Mobile attendance status selection function
function selectMobileAttendanceStatus(studentId, date, status) {
    // Close the dropdown
    const dropdown = document.getElementById(`mobile-dropdown-${studentId}`);
    const card = dropdown?.closest('.mobile-student-card');
    if (dropdown) {
        dropdown.classList.remove('show');
    }
    if (card) {
        card.classList.remove('dropdown-open');
    }
    
    // Update attendance directly
    updateMobileAttendanceStatus(studentId, date, status);
}

// Mobile attendance status update function
function updateMobileAttendanceStatus(studentId, date, status) {
    if (!attendance[date]) {
        attendance[date] = {};
    }
    
    // Update attendance data
    if (status === 'neutral') {
        delete attendance[date][studentId];
    } else {
        const currentReason = attendance[date][studentId]?.reason || '';
        attendance[date][studentId] = {
            status: status,
            reason: status === 'absent' ? currentReason : ''
        };
    }
    
    // If absent, show reason input if not already there
    if (status === 'absent') {
        // Check if reason input exists, if not, we'll need to regenerate the card
        const card = document.querySelector(`#mobile-dropdown-${studentId}`)?.closest('.mobile-student-card');
        if (card && !card.querySelector('.reason-input-mobile')) {
            const studentInfo = card.querySelector('.student-info');
            const reasonInput = document.createElement('div');
            reasonInput.className = 'reason-input-mobile';
            reasonInput.innerHTML = `
                <input type="text" 
                       placeholder="${t('reasonForAbsence')}"
                       value="${attendance[date][studentId]?.reason || ''}"
                       onchange="updateMobileAbsenceReason('${studentId}', '${date}', this.value)"
                       class="mobile-reason-input"
                       style="width: 100%; padding: 8px; margin-top: 8px; border: 1px solid #ddd; border-radius: 6px; font-size: 13px;">
            `;
            studentInfo.appendChild(reasonInput);
        }
    } else {
        // Remove reason input if status is not absent
        const card = document.querySelector(`#mobile-dropdown-${studentId}`)?.closest('.mobile-student-card');
        if (card) {
            const reasonInput = card.querySelector('.reason-input-mobile');
            if (reasonInput) {
                reasonInput.remove();
            }
            const reasonDisplay = card.querySelector('.student-reason');
            if (reasonDisplay) {
                reasonDisplay.remove();
            }
        }
    }
    
    // Update the badge immediately
    updateMobileAttendanceBadge(studentId, status);
    
    // Show visual indication that changes are pending
    const saveButton = document.querySelector('.mobile-save-btn');
    if (saveButton) {
        saveButton.style.background = '#e67e22';
        saveButton.innerHTML = '<i class="fas fa-save"></i> <span>Save Changes*</span>';
    }
}

// Mobile absence reason update function
function updateMobileAbsenceReason(studentId, date, reason) {
    if (!attendance[date]) {
        attendance[date] = {};
    }
    
    if (!attendance[date][studentId]) {
        attendance[date][studentId] = { status: 'absent', reason: '' };
    }
    
    attendance[date][studentId].reason = reason;
    
    // Update the reason display
    const card = document.querySelector(`#mobile-dropdown-${studentId}`)?.closest('.mobile-student-card');
    if (card) {
        let reasonDisplay = card.querySelector('.student-reason');
        if (reason && reason.trim()) {
            if (!reasonDisplay) {
                reasonDisplay = document.createElement('div');
                reasonDisplay.className = 'student-reason';
                reasonDisplay.style.cssText = 'font-size: 12px; color: #666; margin-top: 4px;';
                card.querySelector('.student-info').appendChild(reasonDisplay);
            }
            reasonDisplay.textContent = `Reason: ${reason}`;
        } else if (reasonDisplay) {
            reasonDisplay.remove();
        }
    }
    
    // Show visual indication that changes are pending
    const saveButton = document.querySelector('.mobile-save-btn');
    if (saveButton) {
        saveButton.style.background = '#e67e22';
        saveButton.innerHTML = '<i class="fas fa-save"></i> <span>Save Changes*</span>';
    }
}

// Legacy function for backward compatibility (cycles through statuses)
function toggleMobileAttendance(studentId, date) {
    const studentAttendance = attendance[date][studentId] || { status: 'neutral', reason: '' };
    const currentStatus = studentAttendance.status;
    
    // Cycle through statuses
    let nextStatus;
    switch(currentStatus) {
        case 'neutral':
        case 'clear':
            nextStatus = 'present';
            break;
        case 'present':
            nextStatus = 'absent';
            break;
        case 'absent':
            nextStatus = 'holiday';
            break;
        case 'holiday':
            nextStatus = 'neutral';
            break;
        default:
            nextStatus = 'present';
            break;
    }
    
    // Update attendance data
    updateMobileAttendanceStatus(studentId, date, nextStatus);
}

// Update mobile attendance badge
function updateMobileAttendanceBadge(studentId, status) {
    // Find the card first
    const card = document.querySelector(`#mobile-dropdown-${studentId}`)?.closest('.mobile-student-card');
    if (!card) return;
    
    const dropdown = document.getElementById(`mobile-dropdown-${studentId}`);
    if (!dropdown) return;
    
    const badge = dropdown.previousElementSibling;
    if (!badge || !badge.classList.contains('mobile-dropdown-toggle')) return;
    
    let statusClass, statusText, statusIcon;
    switch(status) {
        case 'present':
            statusClass = 'mobile-status-present';
            statusText = 'Present';
            statusIcon = 'fas fa-check';
            break;
        case 'absent':
            statusClass = 'mobile-status-absent';
            statusText = 'Absent';
            statusIcon = 'fas fa-times';
            break;
        case 'holiday':
            statusClass = 'mobile-status-holiday';
            statusText = 'Holiday';
            statusIcon = 'fas fa-calendar';
            break;
        default:
            statusClass = 'mobile-status-neutral';
            statusText = 'Not Set';
            statusIcon = 'fas fa-minus';
            break;
    }
    
    // Update badge
    badge.className = `mobile-dropdown-toggle ${statusClass}`;
    badge.innerHTML = `
        <i class="${statusIcon}"></i>
        <span>${statusText}</span>
        <i class="fas fa-chevron-down mobile-status-arrow"></i>
    `;
    
    // Add animation
    badge.classList.add('mobile-status-changing');
    setTimeout(() => {
        badge.classList.remove('mobile-status-changing');
    }, 500);
}

// Mobile date change handler
function handleMobileDateChange(newDate) {
    const desktopDateInput = document.getElementById('attendanceDate');
    if (desktopDateInput) {
        desktopDateInput.value = newDate;
    }
    // Update max date
    updateDateInputMax();
    loadAttendanceForDate();
}

// Mobile class filter change handler
function handleMobileClassFilterChange(selectedClass) {
    const desktopClassFilter = document.getElementById('classFilter');
    if (desktopClassFilter) {
        desktopClassFilter.value = selectedClass;
    }
    loadAttendanceForDate();
}

// Populate mobile class filter when classes are loaded
function populateMobileClassFilter() {
    const mobileClassFilter = document.getElementById('mobileClassFilter');
    if (!mobileClassFilter || !window.classes || window.classes.length === 0) {
        return;
    }
    
    // Get current selection
    const currentValue = mobileClassFilter.value;
    
    // Clear and repopulate
    mobileClassFilter.innerHTML = '<option value="">All Classes</option>';
    
    window.classes.forEach(cls => {
        const option = document.createElement('option');
        option.value = cls.name;
        option.textContent = cls.name;
        if (cls.name === currentValue) {
            option.selected = true;
        }
        mobileClassFilter.appendChild(option);
    });
}

export { studentDetailSource, initializeTodayAttendance, updateDateInputMax, updateAbsenceReason, updateFilteredStudentCount, updateFilterStatus, getFilteredStudents, showMarkAllAbsentModal, closeBulkAbsentModal, showStudentDetail, showResetAttendanceModal, closeResetAttendanceModal, markAllPresent, markAllNeutral, markAllHoliday, copyPreviousDayAttendance, saveAttendance, loadAttendanceForDate, confirmMarkAllAbsent, confirmResetAttendance, toggleAttendance, populateAttendanceClassFilter, refreshAttendanceClassFilter, resetAttendanceClassFilter, generateMobileAttendanceHTML, toggleMobileAttendance, toggleMobileAttendanceDropdown, selectMobileAttendanceStatus, updateMobileAttendanceStatus, updateMobileAbsenceReason, updateMobileAttendanceBadge, handleMobileDateChange, handleMobileClassFilterChange, populateMobileClassFilter, initializeAttendanceCatchUp, isAttendanceCatchUpRequired, getAttendanceCatchUpMessage, enforceAttendanceCatchUpNavigation, refreshAttendanceCatchUpState }
