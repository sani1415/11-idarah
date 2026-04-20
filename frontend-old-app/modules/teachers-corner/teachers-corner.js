
// Main orchestrator for Teachers Corner. This module imports all
// supporting modules and exposes their public functions on the global
// window object so that they can be referenced from HTML attributes
// (onclick, etc.). It also ensures that the Teachers Corner is
// initialized after the DOM has loaded.

import { state, getCurrentStudentId } from './teachers-corner-state.js';
import * as mapping from './teachers-corner-mapping.js';
import * as data from './teachers-corner-data.js';
import * as ui from './teachers-corner-ui.js';
import * as logbook from './teachers-corner-logbook.js';
import * as print from './teachers-corner-print.js';
import * as nav from './teachers-corner-nav.js';

// Expose critical functions immediately (before Promise) so they're available for HTML onclick handlers
// IMPORTANT: These must be exposed synchronously, not in a Promise, so HTML onclick handlers can use them
try {
    // Check if functions are available from ui module
    if (ui && typeof ui.switchStudentProfileTab === 'function') {
        window.switchStudentProfileTab = ui.switchStudentProfileTab;
        window.switchProfileTab = ui.switchProfileTab;
        window.showStudentProfile = ui.showStudentProfile;
        window.closeStudentProfileModal = ui.closeStudentProfileModal;
        console.log('✅ Student Profile functions exposed to global scope from ui module');
    } else {
        console.warn('⚠️ ui module functions not available yet, creating placeholder functions');
        // Create placeholder functions that will be replaced when module loads
        window.switchStudentProfileTab = function(tabName) {
            console.warn('⚠️ switchStudentProfileTab called before module loaded, tab:', tabName);
            // Try to find the function again
            if (ui && typeof ui.switchStudentProfileTab === 'function') {
                window.switchStudentProfileTab = ui.switchStudentProfileTab;
                return ui.switchStudentProfileTab(tabName);
            }
        };
        window.switchProfileTab = window.switchStudentProfileTab;
        window.showStudentProfile = async function(studentId, defaultTab) {
            console.warn('⚠️ showStudentProfile called before module loaded');
            if (ui && typeof ui.showStudentProfile === 'function') {
                window.showStudentProfile = ui.showStudentProfile;
                return ui.showStudentProfile(studentId, defaultTab);
            }
        };
        window.closeStudentProfileModal = function() {
            if (ui && typeof ui.closeStudentProfileModal === 'function') {
                window.closeStudentProfileModal = ui.closeStudentProfileModal;
                return ui.closeStudentProfileModal();
            }
        };
    }
    
    // Expose FAB toggle function early (always available)
    window.toggleStudentProfileFAB = function() {
        const fabMenu = document.getElementById('student-profile-fab-menu');
        if (fabMenu) {
            fabMenu.classList.toggle('show');
        }
    };
    
    console.log('✅ Student Profile functions setup complete');
} catch (error) {
    console.error('❌ Error exposing Student Profile functions:', error);
    // Create fallback functions even on error
    window.switchStudentProfileTab = window.switchStudentProfileTab || function(tabName) {
        console.error('❌ switchStudentProfileTab not available:', tabName);
    };
    window.toggleStudentProfileFAB = window.toggleStudentProfileFAB || function() {
        const fabMenu = document.getElementById('student-profile-fab-menu');
        if (fabMenu) fabMenu.classList.toggle('show');
    };
}

window.teachersCornerReady = new Promise(resolve => {
    // Expose state for debugging (optional)
    window.TCState = state;

    // Expose state functions
    window.getCurrentStudentId = getCurrentStudentId;

    // Expose mapping functions
    window.loadClassMapping = mapping.loadClassMapping;
    window.normalizeClassName = mapping.normalizeClassName;
    window.getClassIdByName = mapping.getClassIdByName;
    window.getClassIdFromName = mapping.getClassIdFromName;

    // Expose data loaders and functions
    window.loadStudentsFromMainApp = data.loadStudentsFromMainApp;
    window.loadAttendanceFromMainApp = data.loadAttendanceFromMainApp;
    window.loadBooksForClass = data.loadBooksForClass;
    window.loadProgressHistoryForBook = data.loadProgressHistoryForBook;
    window.loadTeacherLogsFromDatabase = data.loadTeacherLogsFromDatabase;
    window.loadStudentScoresFromDatabase = data.loadStudentScoresFromDatabase;
    window.loadScoreHistoryFromDatabase = data.loadScoreHistoryFromDatabase;
    window.updateScoreInDatabase = data.updateScoreInDatabase;
    window.createLogInDatabase = data.createLogInDatabase;
    window.updateLogInDatabase = data.updateLogInDatabase;
    window.deleteLogFromDatabase = data.deleteLogFromDatabase;
    window.getActiveStudentsForClass = data.getActiveStudentsForClass;
    window.getInactiveStudentsForClass = data.getInactiveStudentsForClass;
    window.getHusnulKhulukScore = data.getHusnulKhulukScore;
    window.calculateAttendanceStats = data.calculateAttendanceStats;
    window.getStudentNameById = data.getStudentNameById;
    window.handleStudentPhotoUpload = data.handleStudentPhotoUpload;
    window.deleteStudentPhoto = data.deleteStudentPhoto;
    window.saveBook = data.saveBook;
    window.deleteBook = data.deleteBook;
    window.checkFifteenDayReminder = data.checkFifteenDayReminder;

    // Expose UI functions
    window.initTeachersCorner = ui.initTeachersCorner;
    window.showClassDashboard = ui.showClassDashboard;
    window.renderTodaySummary = ui.renderTodaySummary;
    window.resetDashboard = ui.resetDashboard;
    window.renderClassOverview = ui.renderClassOverview;
    window.filterStudentsByTier = ui.filterStudentsByTier;
    window.clearStudentFilter = ui.clearStudentFilter;
    window.renderDashboardAlerts = ui.renderDashboardAlerts;
    window.renderClassStudentList = ui.renderClassStudentList;
    window.renderClassEducationProgress = ui.renderClassEducationProgress;
    window.renderTeachersLogbook = ui.renderTeachersLogbook;
    window.renderLogEntry = ui.renderLogEntry;
    window.updateStudentPhotoDisplay = ui.updateStudentPhotoDisplay;
    window.showBookModal = ui.showBookModal;
    window.closeBookModal = ui.closeBookModal;
    // Critical functions already exposed above (before Promise)
    // window.showStudentProfile = ui.showStudentProfile; // Already exposed
    // window.closeStudentProfileModal = ui.closeStudentProfileModal; // Already exposed
    // window.switchStudentProfileTab = ui.switchStudentProfileTab; // Already exposed
    // window.switchProfileTab = ui.switchProfileTab; // Already exposed
    // window.toggleStudentProfileFAB is also exposed above
    window.showStudentPhotoPopup = ui.showStudentPhotoPopup;
    window.closeStudentPhotoPopup = ui.closeStudentPhotoPopup;
    window.showAddStudentLogModal = ui.showAddStudentLogModal;
    window.showLowScoreStudents = ui.showLowScoreStudents;
    window.showCriticalScoreStudents = ui.showCriticalScoreStudents;
    window.showStudentsWithNoProgress = ui.showStudentsWithNoProgress;
    window.showAbsentStudentsAlert = ui.showAbsentStudentsAlert;
    window.showImportantLogs = ui.showImportantLogs;
    window.showAttendanceModal = ui.showAttendanceModal;
    window.showClassAnalysis = ui.showClassAnalysis;
    window.showTeachersLogbook = ui.showTeachersLogbook;
    window.showModal = ui.showModal;
    // renderTeachersMessagingWidget removed - using direct interface now
    window.handleStudentPhotoUploadHandler = ui.handleStudentPhotoUploadHandler;
    window.deleteStudentPhotoHandler = ui.deleteStudentPhotoHandler;

    // Expose logbook functions
    window.switchLogTab = logbook.switchLogTab;
    window.toggleStudentExpansion = logbook.toggleStudentExpansion;
    window.showAddLogModal = logbook.showAddLogModal;
    window.closeLogModal = logbook.closeLogModal;
    window.saveLogEntry = logbook.saveLogEntry;
    window.editHusnulKhuluk = logbook.editHusnulKhuluk;
    window.closeScoreModal = logbook.closeScoreModal;
    window.saveNewScore = logbook.saveNewScore;
    window.showInactiveStudentsModal = logbook.showInactiveStudentsModal;
    window.closeInactiveStudentsModal = logbook.closeInactiveStudentsModal;
    window.editLog = logbook.editLog;
    window.deleteLog = logbook.deleteLog;
    window.handleAlertClick = logbook.handleAlertClick;
    
    // Expose messaging functions
    window.openTeachersCornerMessaging = ui.openTeachersCornerMessaging;
    window.closeDirectConversation = ui.closeDirectConversation;
    window.closeInlineMessaging = ui.closeInlineMessaging;
    window.closeFloatingMessaging = ui.closeFloatingMessaging;
    window.updateMessagesCount = ui.updateMessagesCount;

    // Expose print functions
    window.printStudentDetail = print.printStudentDetail;
    window.showCustomPrintModal = print.showCustomPrintModal;
    window.generateCustomPrint = print.generateCustomPrint;
    window.generateStudentDetailPrint = print.generateStudentDetailPrint;

    // Expose navigation functions
    window.showTeachersCornerNav = nav.showTeachersCornerNav;
    window.hideTeachersCornerNav = nav.hideTeachersCornerNav;
    window.switchTeachersCornerTab = nav.switchTeachersCornerTab;
    window.initTeachersCornerNav = nav.initTeachersCornerNav;
    window.updateTeachersCornerNavState = nav.updateTeachersCornerNavState;
    window.ensureProperNavState = nav.ensureProperNavState;

    resolve();
});

// Initialize Teachers Corner once the DOM has fully loaded. This sets
// up the dashboard skeleton and loads initial data. Additional
// application-specific initialization can be added here if needed.
document.addEventListener('DOMContentLoaded', () => {
  ui.initTeachersCorner();
});
