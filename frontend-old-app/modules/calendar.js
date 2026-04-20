function navigateCalendar(direction) {
    const proposedMonth = currentCalendarMonth + direction;
    const proposedYear = currentCalendarYear;
    
    if (proposedMonth > 11) {
        const nextMonth = 0;
        const nextYear = currentCalendarYear + 1;
        
        currentCalendarMonth = nextMonth;
        currentCalendarYear = nextYear;
    } else if (proposedMonth < 0) {
        const prevMonth = 11;
        const prevYear = currentCalendarYear - 1;
        
        // Check if this would go before academic year start
        if (academicYearStartDate && !canNavigateToMonth(prevMonth, prevYear)) {
            console.log('Cannot navigate to month before academic year start');
            return; // Don't navigate
        }
        
        currentCalendarMonth = prevMonth;
        currentCalendarYear = prevYear;
    } else {
        // Check if this would go before academic year start
        if (academicYearStartDate && !canNavigateToMonth(proposedMonth, proposedYear)) {
            console.log('Cannot navigate to month before academic year start');
            return; // Don't navigate
        }
        
        currentCalendarMonth = proposedMonth;
        currentCalendarYear = proposedYear;
    }
    
    refreshCalendar();
}

function canNavigateToMonth(month, year) {
    if (!academicYearStartDate) {
        return true; // No restrictions if no academic year start date
    }
    
    const academicYearStart = new Date(academicYearStartDate);
    const academicYearStartMonth = academicYearStart.getMonth();
    const academicYearStartYear = academicYearStart.getFullYear();
    
    // Check if the proposed month/year is before the academic year start
    if (year < academicYearStartYear) {
        return false;
    } else if (year === academicYearStartYear && month < academicYearStartMonth) {
        return false;
    }
    
    return true;
}

function changeCalendarMonth() {
    const monthSelector = document.getElementById('monthSelector');
    if (monthSelector) {
        const proposedMonth = parseInt(monthSelector.value);
        
        if (academicYearStartDate && !canNavigateToMonth(proposedMonth, currentCalendarYear)) {
            console.log('Cannot navigate to month before academic year start');
            // Reset to current month
            monthSelector.value = currentCalendarMonth;
            return;
        }
        
        currentCalendarMonth = proposedMonth;
        refreshCalendar();
    }
}

function changeCalendarYear() {
    const yearSelector = document.getElementById('yearSelector');
    if (yearSelector) {
        const proposedYear = parseInt(yearSelector.value);
        
        if (academicYearStartDate && !canNavigateToMonth(currentCalendarMonth, proposedYear)) {
            console.log('Cannot navigate to year before academic year start');
            // Reset to current year
            yearSelector.value = currentCalendarYear;
            return;
        }
        
        currentCalendarYear = proposedYear;
        refreshCalendar();
    }
}

function refreshCalendar() {
    const calendarSection = document.querySelector('.attendance-tracking-section');
    if (calendarSection) {
        console.log('Refreshing calendar for month:', currentCalendarMonth + 1, 'year:', currentCalendarYear);
        const newCalendarHTML = generateAttendanceTrackingCalendar(currentCalendarMonth, currentCalendarYear);
        calendarSection.outerHTML = newCalendarHTML;
        console.log('Calendar refreshed successfully');
    } else {
        console.log('Calendar section not found for refresh');
    }
}

function forceRefreshAttendanceCalendar() {
    // Force refresh regardless of visibility - useful for debugging
    const calendarSection = document.querySelector('.attendance-tracking-section');
    console.log('Force refreshing calendar...', calendarSection ? 'Found calendar' : 'Calendar not found');
    
    if (calendarSection) {
        refreshCalendar();
        console.log('Force refresh completed');
    }
}

window.forceRefreshAttendanceCalendar = forceRefreshAttendanceCalendar;

function refreshAttendanceCalendarIfVisible() {
    // Check if attendance calendar exists and refresh it
    const calendarSection = document.querySelector('.attendance-tracking-section');
    console.log('Checking calendar visibility...', calendarSection ? 'Calendar exists' : 'Calendar not found');
    
    if (calendarSection) {
        // Always refresh the calendar when it exists, regardless of visibility
        // This ensures it has updated data when shown later
        const computedStyle = window.getComputedStyle(calendarSection);
        const isVisible = computedStyle.display !== 'none' && calendarSection.offsetHeight > 0;
        
        console.log('Calendar visibility check:', {
            display: computedStyle.display,
            offsetHeight: calendarSection.offsetHeight,
            isVisible: isVisible
        });
        
        console.log('Refreshing attendance calendar with updated data...');
        console.log('Current savedAttendanceDates:', Array.from(savedAttendanceDates));
        
        // Force refresh the calendar
        refreshCalendar();
        
        // Also update the attendance summary
        const summaryElement = document.getElementById('attendanceSummary');
        if (summaryElement) {
            summaryElement.innerHTML = generateAttendanceSummary(currentCalendarYear, currentCalendarMonth);
        }
    }
}

function goToCurrentMonth() {
    const today = new Date();
    let targetMonth = today.getMonth();
    let targetYear = today.getFullYear();
    
    // If academic year start date is set and today is before it, start from academic year start
    if (academicYearStartDate) {
        const academicYearStart = new Date(academicYearStartDate);
        const todayStr = today.toISOString().split('T')[0];
        
        if (todayStr < academicYearStartDate) {
            targetMonth = academicYearStart.getMonth();
            targetYear = academicYearStart.getFullYear();
            console.log('Starting calendar from academic year start date instead of today');
        }
    }
    
    currentCalendarMonth = targetMonth;
    currentCalendarYear = targetYear;
    refreshCalendar();
}

function generateCalendarDays(year, month, startDayOfWeek, daysInMonth) {
    let calendarHTML = '';
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    
    // Ensure global variables are initialized
    if (!window.attendance) {
        window.attendance = {};
    }
    if (!window.holidays) {
        window.holidays = [];
    }
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startDayOfWeek; i++) {
        calendarHTML += '<div class="calendar-day empty"></div>';
    }
    
    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
        const date = new Date(year, month, day);
        // Use local date to avoid timezone issues with toISOString()
        const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
        const dayOfWeek = date.getDay(); // 0 = Sunday, 6 = Saturday
        
        let dayClass = 'calendar-day';
        let dayTitle = dateStr;
        
        // Check if date is before academic year start
        if (academicYearStartDate && dateStr < academicYearStartDate) {
            dayClass += ' before-academic-year';
            dayTitle = `Before academic year start (${formatDate(academicYearStartDate)})`;
        }
        // Check if attendance was auto-copied (show orange)
        else if (autoCopiedAttendanceDates && autoCopiedAttendanceDates.has(dateStr)) {
            dayClass += ' attendance-auto-copied';
            dayTitle = `Attendance auto-copied on ${dateStr}`;
            console.log(`Date ${dateStr} marked as auto-copied`);
        }
        // Check if attendance was manually saved (show green)
        else if (savedAttendanceDates.has(dateStr)) {
            dayClass += ' attendance-taken';
            dayTitle = `Attendance manually saved on ${dateStr}`;
            console.log(`Date ${dateStr} marked as manually taken`);
        }
        // Check if it's a future date (after checking attendance status)
        else if (date > today) {
            dayClass += ' future-day disabled';
            dayTitle = 'Future date - Cannot take attendance';
        }
        // School day but no attendance taken
        else {
            dayClass += ' attendance-missed';
            dayTitle = `Attendance NOT taken on ${dateStr}`;
        }
        
        // Add click handler for non-empty, non-future dates
        const isClickable = !dayClass.includes('empty') && !dayClass.includes('future-day') && !dayClass.includes('before-academic-year');
        const clickHandler = isClickable ? `onclick="selectCalendarDate('${dateStr}')"` : '';
        
        calendarHTML += `
            <div class="${dayClass}" title="${dayTitle}" ${clickHandler} style="${isClickable ? 'cursor: pointer;' : ''}">
                <span class="day-number">${day}</span>
            </div>
        `;
    }
    
    return calendarHTML;
}

function generateAttendanceSummary(year, month) {
    const summaryDiv = document.getElementById('attendance-summary');
    if (!summaryDiv) return;

    const startDate = new Date(year, month, 1);
    const endDate = new Date(year, month + 1, 0);

    let totalTaken = 0;
    let totalMissed = 0;
    let holidaysCount = 0;
    const missedDates = [];

    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
        const dateString = d.toISOString().split('T')[0];
        const dayOfWeek = d.getDay();
        const isWeekend = dayOfWeek === 5; // Assuming Friday is the weekend

        // Note: Holiday status is now handled in attendance data, not counted here
        if (!isWeekend) {
            if (attendance[dateString] && Object.keys(attendance[dateString]).length > 0) {
                totalTaken++;
        } else {
                if (d < new Date()) { // Only count missed days in the past
                    totalMissed++;
                    missedDates.push(new Date(d));
                }
            }
        }
    }

    const totalDays = totalTaken + totalMissed;
    const takenPercentage = totalDays > 0 ? ((totalTaken / totalDays) * 100).toFixed(0) : 0;
    const missedPercentage = totalDays > 0 ? ((totalMissed / totalDays) * 100).toFixed(0) : 0;
    
    const monthName = startDate.toLocaleString('default', { month: 'long', year: 'numeric' });

    summaryDiv.innerHTML = `
        <div class="summary-header">
            <h4>Attendance Summary for ${monthName}</h4>
        </div>
        <div class="summary-stats">
            <div class="stat-item">
                <span class="stat-value">${totalTaken}</span>
                <span class="stat-label">Days Taken</span>
                </div>
            <div class="stat-item">
                <span class="stat-value">${totalMissed}</span>
                <span class="stat-label">Days Missed</span>
                </div>
            <div class="stat-item">
                <span class="stat-value">${holidaysCount}</span>
                <span class="stat-label">Holidays</span>
                </div>
                </div>
        <div class="summary-chart">
            <div class="progress-bar-container">
                <div class="progress-bar" style="width: ${takenPercentage}%; background-color: #28a745;" title="Taken: ${takenPercentage}%"></div>
                <div class="progress-bar" style="width: ${missedPercentage}%; background-color: #dc3545;" title="Missed: ${missedPercentage}%"></div>
            </div>
            </div>
        ${missedDates.length > 0 ? `
            <div class="missed-dates">
                <h5><i class="fas fa-exclamation-triangle"></i> Missed Attendance Dates:</h5>
                <ul>
                    ${missedDates.map(date => {
                        const dateString = date.toISOString().split('T')[0];
                        const hijriDate = getHijriDate(dateString, hijriAdjustment);
                        return `<li>${date.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'short' })} 
                                    <span class="hijri-date-small">${hijriDate.day} ${hijriDate.monthName}, ${hijriDate.year}</span></li>`;
                    }).join('')}
                </ul>
        </div>
        ` : `
            <div class="no-missed-dates">
                <p><i class="fas fa-check-circle"></i> Great job! No missed attendance this month.</p>
            </div>
        `}
    `;
}


async function selectCalendarDate(dateStr) {
    console.log('Calendar date selected:', dateStr);
    
    // Set the attendance date input to the selected date
    const attendanceDateInput = document.getElementById('attendanceDate');
    if (attendanceDateInput) {
        attendanceDateInput.value = dateStr;
        console.log('Set attendance date input to:', dateStr);
    }
    
    // Switch to attendance section first
    if (typeof showSection === 'function') {
        await showSection('attendance');
        console.log('Switched to attendance section');
    }
    
    // Wait a moment for the section to be visible, then load attendance
    setTimeout(async () => {
        if (typeof loadAttendanceForDate === 'function') {
            console.log('Loading attendance for date:', dateStr);
            await loadAttendanceForDate();
            console.log('Attendance loaded for date:', dateStr);
        }
    }, 100);
}

export { navigateCalendar, canNavigateToMonth, changeCalendarMonth, changeCalendarYear, refreshCalendar, forceRefreshAttendanceCalendar, refreshAttendanceCalendarIfVisible, goToCurrentMonth, generateCalendarDays, generateAttendanceSummary, selectCalendarDate }
