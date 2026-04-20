/**
 * Hijri Calendar System for Madani Maktab
 * Combined module containing core calculations and UI integration
 * Based on Tabular Islamic Calendar with local adjustment support
 */

import { t } from '../translations.js';

class HijriCalendar {
    constructor() {
        // Hijri month names in Arabic and Bengali
        this.monthNames = {
            en: [
                'Muharram', 'Safar', 'Rabi al-Awwal', 'Rabi al-Thani',
                'Jumada al-Awwal', 'Jumada al-Thani', 'Rajab', 'Shaban',
                'Ramadan', 'Shawwal', 'Dhu al-Qidah', 'Dhu al-Hijjah'
            ],
            bn: [
                'মুহাররম', 'সফর', 'রবিউল আউয়াল', 'রবিউস সানি',
                'জমাদিউল আউয়াল', 'জমাদিউস সানি', 'রজব', 'শাবান',
                'রমজান', 'শাওয়াল', 'জিলকদ', 'জিলহজ'
            ]
        };
        
        // Load adjustment from database with localStorage fallback
        this.adjustment = 0; // Will be loaded asynchronously
        this.loadAdjustment();
        
        // Islamic calendar epoch (July 16, 622 CE in Julian calendar)
        this.islamicEpoch = 1948085; // Julian Day Number
    }

    /**
     * Convert Gregorian date to Hijri date
     * Using Islamic calendar calculation based on Tabular Islamic Calendar
     */
    gregorianToHijri(gregorianDate) {
        const date = new Date(gregorianDate);
        
        // Get Julian Day Number
        const jd = this.gregorianToJulianDay(date);
        
        // Convert Julian Day to Islamic date
        const hijriData = this.julianDayToHijri(jd);
        
        // Apply local adjustment
        const adjustedDate = this.applyAdjustment(hijriData.year, hijriData.month, hijriData.day);
        
        return adjustedDate;
    }

    /**
     * Convert Gregorian date to Julian Day Number
     */
    gregorianToJulianDay(date) {
        const year = date.getFullYear();
        const month = date.getMonth() + 1;
        const day = date.getDate();
        
        let a = Math.floor((14 - month) / 12);
        let y = year - a;
        let m = month + 12 * a - 3;
        
        return day + Math.floor((153 * m + 2) / 5) + 365 * y + 
               Math.floor(y / 4) - Math.floor(y / 100) + 
               Math.floor(y / 400) + 1721119;
    }

    /**
     * Convert Julian Day Number to Islamic date
     * Using simplified Tabular Islamic Calendar
     */
    julianDayToHijri(jd) {
        if (jd < this.islamicEpoch) {
            return { year: 1, month: 1, day: 1 };
        }
        
        const daysSinceEpoch = jd - this.islamicEpoch;
        
        // Calculate approximate year (30-year cycle with 11 leap years)
        const cycleLength = 10631; // Days in 30-year cycle
        const cycle = Math.floor(daysSinceEpoch / cycleLength);
        const cycleDay = daysSinceEpoch % cycleLength;
        
        // Find year within cycle
        let yearInCycle = Math.floor(cycleDay / 354.36667);
        if (yearInCycle >= 30) yearInCycle = 29;
        
        let year = cycle * 30 + yearInCycle + 1;
        
        // Calculate start of this year
        let yearStart = this.calculateYearStart(year);
        
        // Adjust if calculation is off
        while (jd < yearStart) {
            year--;
            yearStart = this.calculateYearStart(year);
        }
        
        const nextYearStart = this.calculateYearStart(year + 1);
        while (jd >= nextYearStart) {
            year++;
            yearStart = nextYearStart;
        }
        
        const dayOfYear = jd - yearStart + 1;
        
        // Find month and day
        let month = 1;
        let day = dayOfYear;
        
        for (let m = 1; m <= 12; m++) {
            const monthLength = this.getHijriMonthLength(year, m);
            if (day <= monthLength) {
                month = m;
                break;
            }
            day -= monthLength;
        }
        
        // Adjust year to match local observation (1447 instead of 1448)
        return { year: year - 1, month, day };
    }

    /**
     * Calculate start of Hijri year in Julian Day Number
     */
    calculateYearStart(hijriYear) {
        const yearsSinceEpoch = hijriYear - 1;
        const cycles = Math.floor(yearsSinceEpoch / 30);
        const yearInCycle = yearsSinceEpoch % 30;
        
        // Count leap years
        const leapYears = Math.floor(yearInCycle * 11 / 30);
        
        return this.islamicEpoch + cycles * 10631 + yearInCycle * 354 + leapYears;
    }

    /**
     * Get Julian Day for start of Hijri year
     */
    getHijriYearStart(hijriYear) {
        const islamicEpoch = 1948085;
        return Math.floor((hijriYear - 1) * 354.367) + islamicEpoch;
    }

    /**
     * Apply local adjustment (+1 or -1 day)
     */
    applyAdjustment(year, month, day) {
        if (this.adjustment === 0) {
            return { year, month, day };
        }
        
        let adjustedDay = day + this.adjustment;
        let adjustedMonth = month;
        let adjustedYear = year;
        
        if (adjustedDay <= 0) {
            // Go to previous month
            adjustedMonth--;
            if (adjustedMonth <= 0) {
                adjustedMonth = 12;
                adjustedYear--;
            }
            adjustedDay = this.getHijriMonthLength(adjustedYear, adjustedMonth) + adjustedDay;
        } else {
            const monthLength = this.getHijriMonthLength(adjustedYear, adjustedMonth);
            if (adjustedDay > monthLength) {
                // Go to next month
                adjustedDay = adjustedDay - monthLength;
                adjustedMonth++;
                if (adjustedMonth > 12) {
                    adjustedMonth = 1;
                    adjustedYear++;
                }
            }
        }
        
        return { 
            year: adjustedYear, 
            month: adjustedMonth, 
            day: adjustedDay 
        };
    }

    /**
     * Get length of Hijri month (29 or 30 days)
     */
    getHijriMonthLength(year, month) {
        // Simplified: odd months have 30 days, even months have 29 days
        // In leap years, the 12th month has 30 days instead of 29
        if (month % 2 === 1) {
            return 30; // Odd months
        } else if (month === 12 && this.isHijriLeapYear(year)) {
            return 30; // 12th month in leap year
        } else {
            return 29; // Even months
        }
    }

    /**
     * Check if Hijri year is leap year
     */
    isHijriLeapYear(year) {
        return (year * 11 + 14) % 30 < 11;
    }

    /**
     * Format Hijri date as string
     */
    formatHijriDate(hijriDate, language = 'en') {
        const { year, month, day } = hijriDate;
        const monthName = this.monthNames[language][month - 1];
        
        if (language === 'bn') {
            return `${day} ${monthName} ${year} হিজরি`;
        } else {
            return `${day} ${monthName} ${year} AH`;
        }
    }

    /**
     * Get current Hijri date
     */
    getCurrentHijriDate() {
        return this.gregorianToHijri(new Date());
    }

    /**
     * Load adjustment from database with localStorage fallback
     */
    async loadAdjustment() {
        try {
            const response = await fetch('/api/settings/hijriAdjustment', {
            credentials: 'include'
        });
            if (response.ok) {
                const data = await response.json();
                this.adjustment = parseInt(data.value || '0');
            } else {
                // Fallback to localStorage
                this.adjustment = parseInt(localStorage.getItem('hijriAdjustment') || '0');
            }
        } catch (error) {
            console.error('Error loading hijri adjustment from database:', error);
            // Fallback to localStorage
            this.adjustment = parseInt(localStorage.getItem('hijriAdjustment') || '0');
        }
    }

    /**
     * Set adjustment value
     */
    async setAdjustment(value) {
        this.adjustment = parseInt(value);
        
        try {
            const response = await fetch('/api/settings/hijriAdjustment', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    value: this.adjustment.toString(),
                    description: 'Hijri calendar adjustment in days'
                })
            });
            
            if (response.ok) {
                // Also save to localStorage as backup
                localStorage.setItem('hijriAdjustment', this.adjustment.toString());
            } else {
                console.error('Failed to save hijri adjustment to database');
                // Fallback to localStorage only
                localStorage.setItem('hijriAdjustment', this.adjustment.toString());
            }
        } catch (error) {
            console.error('Error saving hijri adjustment:', error);
            // Fallback to localStorage only
            localStorage.setItem('hijriAdjustment', this.adjustment.toString());
        }
    }

    /**
     * Get current adjustment value
     */
    getAdjustment() {
        return this.adjustment;
    }

    /**
     * Get Hijri date for specific Gregorian date
     */
    getHijriForDate(gregorianDateString) {
        return this.gregorianToHijri(new Date(gregorianDateString));
    }

    /**
     * Get formatted date with both Gregorian and Hijri
     */
    getFullDateString(gregorianDate, language = 'en') {
        const gDate = new Date(gregorianDate);
        const hijriDate = this.gregorianToHijri(gDate);
        
        const gregorianStr = gDate.toLocaleDateString(language === 'bn' ? 'bn-BD' : 'en-GB');
        const hijriStr = this.formatHijriDate(hijriDate, language);
        
        if (language === 'bn') {
            return `${gregorianStr} (${hijriStr})`;
        } else {
            return `${gregorianStr} (${hijriStr})`;
        }
    }
}

// Create global instance
window.hijriCalendar = new HijriCalendar();

// UI Integration Functions

function initializeHijriSettings() {
    console.log('Initializing Hijri settings...');
    const hijriSelect = document.getElementById('hijriAdjustment');
    
    if (!window.hijriCalendar) {
        console.error('Hijri calendar not loaded');
        return;
    }
    
    if (!hijriSelect) {
        console.error('Hijri select element not found');
        return;
    }
    
    try {
        // Load saved adjustment value
        const savedAdjustment = hijriCalendar.getAdjustment();
        hijriSelect.value = savedAdjustment;
        console.log('Hijri adjustment loaded:', savedAdjustment);
        
        // Update preview
        updateHijriPreview();
        
        // Add Hijri dates to dashboard and other sections
        updateDashboardWithHijri();
        updateAttendancePageHijri();
        
        console.log('Hijri settings initialized successfully');
    } catch (error) {
        console.error('Error initializing Hijri settings:', error);
    }
}

function updateHijriAdjustment() {
    const hijriSelect = document.getElementById('hijriAdjustment');
    if (hijriSelect && window.hijriCalendar) {
        const adjustment = parseInt(hijriSelect.value);
        hijriCalendar.setAdjustment(adjustment);
        updateHijriPreview();
        
        // Update all displays with new Hijri dates
        updateDashboardWithHijri();
        updateAttendancePageHijri();
        
        showModal(t('success'), 'Hijri date adjustment updated successfully');
    }
}

function updateHijriPreview() {
    console.log('Updating Hijri preview...');
    const previewElement = document.getElementById('hijriPreview');
    
    if (!previewElement) {
        console.error('Hijri preview element not found');
        return;
    }
    
    if (!window.hijriCalendar) {
        console.error('Hijri calendar not available');
        return;
    }
    
    try {
        const currentLang = localStorage.getItem('language') || 'en';
        const hijriDate = hijriCalendar.getCurrentHijriDate();
        console.log('Current Hijri date:', hijriDate);
        
        const hijriString = hijriCalendar.formatHijriDate(hijriDate, currentLang);
        console.log('Formatted Hijri string:', hijriString);
        
        const today = new Date();
        const gregorianString = today.toLocaleDateString(currentLang === 'bn' ? 'bn-BD' : 'en-GB');
        
        if (currentLang === 'bn') {
            previewElement.innerHTML = `
                <div><strong>${t('gregorian')}:</strong> ${gregorianString}</div>
                <div><strong>${t('hijri')}:</strong> ${hijriString}</div>
            `;
        } else {
            previewElement.innerHTML = `
                <div><strong>${t('gregorian')}:</strong> ${gregorianString}</div>
                <div><strong>${t('hijri')}:</strong> ${hijriString}</div>
            `;
        }
        
        console.log('Hijri preview updated successfully');
    } catch (error) {
        console.error('Error updating Hijri preview:', error);
        previewElement.innerHTML = '<div style="color: red;">Error loading Hijri date</div>';
    }
}

function updateDashboardWithHijri() {
    console.log('Updating dashboard with Hijri date...');
    
    // Add Hijri date to dashboard header
    const dashboardSection = document.querySelector('#dashboard');
    if (!dashboardSection) {
        console.error('Dashboard section not found');
        return;
    }
    
    if (!window.hijriCalendar) {
        console.error('Hijri calendar not available for dashboard');
        return;
    }
    
    try {
        const currentLang = localStorage.getItem('language') || 'en';
        let hijriDateElement = document.getElementById('hijriDateDisplay');
        
        if (!hijriDateElement) {
            hijriDateElement = document.createElement('div');
            hijriDateElement.id = 'hijriDateDisplay';
            hijriDateElement.className = 'hijri-date-dashboard';
            
            // Insert after header (for mobile: under header bar with same width)
            const header = document.querySelector('.header');
            if (header && header.parentNode) {
                header.parentNode.insertBefore(hijriDateElement, header.nextSibling);
            } else {
                const titleElement = dashboardSection.querySelector('h2');
                if (titleElement) {
                    titleElement.parentNode.insertBefore(hijriDateElement, titleElement.nextSibling);
                } else {
                    dashboardSection.insertBefore(hijriDateElement, dashboardSection.firstChild);
                }
            }
            console.log('Created new Hijri date element after header');
        }
        
        const hijriDate = hijriCalendar.getCurrentHijriDate();
        const hijriString = hijriCalendar.formatHijriDate(hijriDate, currentLang);
        
        const today = new Date();
        const gregorianString = today.toLocaleDateString(currentLang === 'bn' ? 'bn-BD' : 'en-GB');
        
        // One line: year (filled by settings) · hijri date · gregorian date
        hijriDateElement.innerHTML = `<div class="header-year-date-line"><span id="headerYearText" class="header-year-part"></span><span class="header-date-sep"> · </span><span class="header-date-part"><i class="fas fa-moon"></i> ${hijriString}</span><span class="header-date-sep"> · </span><span class="header-gregorian-part">${gregorianString}</span></div>`;
        
        // If renderHeaderEducationalYearDisplay exists, run it to fill headerYearText
        if (typeof window.renderHeaderEducationalYearDisplay === 'function') {
            window.renderHeaderEducationalYearDisplay();
        }
        
        console.log('Dashboard Hijri date updated successfully');
    } catch (error) {
        console.error('Error updating dashboard with Hijri date:', error);
    }
}

function updateAttendancePageHijri() {
    // Add Hijri date display to attendance controls
    const attendanceControls = document.querySelector('.attendance-controls');
    if (attendanceControls && window.hijriCalendar) {
        const currentLang = localStorage.getItem('language') || 'en';
        let hijriElement = document.getElementById('attendanceHijriDate');
        
        if (!hijriElement) {
            hijriElement = document.createElement('div');
            hijriElement.id = 'attendanceHijriDate';
            hijriElement.className = 'hijri-date-attendance';
            
            // Insert after controls-row
            const controlsRow = attendanceControls.querySelector('.controls-row');
            if (controlsRow) {
                controlsRow.parentNode.insertBefore(hijriElement, controlsRow.nextSibling);
            }
        }
        
        // Get selected date or today
        const selectedDate = document.getElementById('attendanceDate')?.value || new Date().toISOString().split('T')[0];
        const hijriDate = hijriCalendar.getHijriForDate(selectedDate);
        const hijriString = hijriCalendar.formatHijriDate(hijriDate, currentLang);
        
        hijriElement.innerHTML = `
            <div class="hijri-date-info">
                <i class="fas fa-moon"></i>
                <span>${hijriString}</span>
            </div>
        `;
    }
}

// Export functions for module system
export { 
    HijriCalendar,
    initializeHijriSettings, 
    updateHijriAdjustment, 
    updateHijriPreview, 
    updateDashboardWithHijri, 
    updateAttendancePageHijri 
};
