// Import all modules as namespaces to avoid naming conflicts
import * as State from './state.js';
import * as Utils from './utils.js';
import * as Dashboard from './dashboard.js';
import * as Registration from './registration.js';
import * as Attendance from './attendance.js';
import * as Reports from './reports.js';
import * as Misc from './misc.js';
import * as Calendar from './calendar.js';
import * as Settings from './settings.js';
import * as Hijri from './hijri.js';
import * as ExamManagement from './exam-management/exam-management.js';
import * as Messaging from './messaging.js';
import * as TeachersMessaging from '../teachers-messaging.js';
import * as TeachersCorner from './teachers-corner/teachers-corner.js';
import { t, changeLanguage, initializeLanguage, updateAllTexts } from '../translations.js';

// Debug: Check if modules are loaded
console.log('🔍 Settings module loaded:', Settings);
console.log('🔍 Settings.loadBooks:', Settings.loadBooks);
console.log('🔍 Settings.updateBookDropdowns:', Settings.updateBookDropdowns);
console.log('🔍 TeachersMessaging module loaded:', TeachersMessaging);
console.log('🔍 TeachersMessaging.renderMessagingWidget:', TeachersMessaging.renderMessagingWidget);
console.log('🔍 typeof Settings.loadBooks:', typeof Settings.loadBooks);
console.log('🔍 typeof Settings.updateBookDropdowns:', typeof Settings.updateBookDropdowns);

// Expose translation function globally
window.t = t;
window.changeLanguage = changeLanguage;
window.initializeLanguage = initializeLanguage;
window.updateAllTexts = updateAllTexts;

// Expose all functions to global scope for HTML onclick handlers
// This is necessary because the HTML uses onclick handlers that expect global functions
// while the code is organized in ES6 modules

// Navigation functions
window.showSection = Misc.showSection;
window.openSettingsTab = Misc.openSettingsTab;

// Permission checking functions
window.canAccessSection = Utils.canAccessSection;
window.checkPermission = Utils.checkPermission;
window.getFirstAllowedSection = Utils.getFirstAllowedSection;
window.checkUserHasAnyAccess = Utils.checkUserHasAnyAccess;
window.updateNavigationMenu = Utils.updateNavigationMenu;
window.getUserAllowedClasses = Utils.getUserAllowedClasses;

// Debug: Check if functions are properly assigned
console.log('🔍 showSection assigned to window:', typeof window.showSection);
console.log('🔍 Misc.showSection:', typeof Misc.showSection);

// Registration functions
window.hideStudentRegistrationForm = Registration.hideStudentRegistrationForm;
window.displayStudentsList = Registration.displayStudentsList;
window.uploadStudentPhoto = Registration.uploadStudentPhoto;
window.showStudentRegistrationForm = Registration.showStudentRegistrationForm;
window.editStudent = Registration.editStudent;
window.deleteStudent = Registration.deleteStudent;
window.updateStudentStatus = Registration.updateStudentStatus;
window.updateStudentStatusWithBackdating = Registration.updateStudentStatusWithBackdating;
window.confirmBackdating = Registration.confirmBackdating;
window.closeBackdatingModal = Registration.closeBackdatingModal;
window.showInactiveStudentsList = Registration.showInactiveStudentsList; // <-- ADD THIS LINE
window.updateStudentFilter = Registration.updateStudentFilter;
window.clearStudentFilters = Registration.clearStudentFilters;

// Attendance functions
window.markAllPresent = Attendance.markAllPresent;
window.showMarkAllAbsentModal = Attendance.showMarkAllAbsentModal;
window.markAllNeutral = Attendance.markAllNeutral;
window.markAllHoliday = Attendance.markAllHoliday;
window.copyPreviousDayAttendance = Attendance.copyPreviousDayAttendance;
window.saveAttendance = Attendance.saveAttendance;
window.isAttendanceCatchUpRequired = Attendance.isAttendanceCatchUpRequired;
window.getAttendanceCatchUpMessage = Attendance.getAttendanceCatchUpMessage;
window.enforceAttendanceCatchUpNavigation = Attendance.enforceAttendanceCatchUpNavigation;
window.toggleAttendance = Attendance.toggleAttendance;
window.updateAbsenceReason = Attendance.updateAbsenceReason;
window.showAttendanceCalendar = Misc.showAttendanceCalendar;
window.loadAttendanceForDate = Attendance.loadAttendanceForDate;
window.showStudentDetail = Attendance.showStudentDetail;
window.updateDateInputMax = Attendance.updateDateInputMax;

window.populateAttendanceClassFilter = Attendance.populateAttendanceClassFilter;
window.refreshAttendanceClassFilter = Attendance.refreshAttendanceClassFilter;
window.resetAttendanceClassFilter = Attendance.resetAttendanceClassFilter;
window.updateFilterStatus = Attendance.updateFilterStatus;
window.generateMobileAttendanceHTML = Attendance.generateMobileAttendanceHTML;
window.toggleMobileAttendance = Attendance.toggleMobileAttendance;
window.toggleMobileAttendanceDropdown = Attendance.toggleMobileAttendanceDropdown;
window.selectMobileAttendanceStatus = Attendance.selectMobileAttendanceStatus;
window.updateMobileAbsenceReason = Attendance.updateMobileAbsenceReason;
window.updateMobileAttendanceBadge = Attendance.updateMobileAttendanceBadge;
window.handleMobileDateChange = Attendance.handleMobileDateChange;
window.handleMobileClassFilterChange = Attendance.handleMobileClassFilterChange;

// Report functions
window.generateReport = Misc.generateReport;
window.generateFromBeginningReport = Misc.generateFromBeginningReport;

window.addHijriToReports = Misc.addHijriToReports;

// Settings functions
window.showAddBookForm = Settings.showAddBookForm;
window.showDeleteAllEducationModal = Settings.showDeleteAllEducationModal;
window.deleteAllEducationData = Settings.deleteAllEducationData;
window.hideAddBookForm = Settings.hideAddBookForm;
window.closeEditBookModal = Settings.closeEditBookModal;
window.initializeAcademicYearStart = Settings.initializeAcademicYearStart;
window.saveAcademicYearStart = Settings.saveAcademicYearStart;
window.clearAcademicYearStart = Settings.clearAcademicYearStart;
window.saveAppName = Settings.saveAppName;
window.loadAppName = Settings.loadAppName;
window.loadAppShortName = Settings.loadAppShortName;
window.saveAppShortName = Settings.saveAppShortName;
window.loadDevMode = Settings.loadDevMode;
window.toggleDevMode = Settings.toggleDevMode;
window.isDevModeEnabled = Settings.isDevModeEnabled;
window.displayAcademicYearStart = Settings.displayAcademicYearStart;
window.updateDateRestrictions = Settings.updateDateRestrictions;
window.clearDateRestrictions = Settings.clearDateRestrictions;
window.addClass = Settings.addClass;
window.addBook = Settings.addBook;
// Holiday management functions removed
window.showResetAttendanceModal = Attendance.showResetAttendanceModal;
window.displayClasses = Settings.displayClasses;
// displayHolidays function removed
window.loadBooks = Settings.loadBooks;
window.updateClassFilterOptions = Registration.updateClassFilterOptions;
window.updateClassDropdowns = Settings.updateClassDropdowns;

// Dashboard functions
window.refreshAttendanceData = Dashboard.refreshAttendanceData;
window.refreshStudentsData = refreshStudentsData;
window.updateBookDropdowns = Settings.updateBookDropdowns;

// Debug: Check if functions are properly exposed
console.log('🔍 After exposing to window:');
console.log('🔍 window.loadBooks:', window.loadBooks);
console.log('🔍 window.updateBookDropdowns:', window.updateBookDropdowns);
console.log('🔍 typeof window.loadBooks:', typeof window.loadBooks);
console.log('🔍 typeof window.updateBookDropdowns:', typeof window.updateBookDropdowns);
// isHoliday function removed
window.editClass = Settings.editClass;
window.deleteClass = Settings.deleteClass;
window.saveClassPromotionOrder = Settings.saveClassPromotionOrder;
window.editBook = Settings.editBook;
window.deleteBook = Settings.deleteBook;
window.getClassIdByName = Settings.getClassIdByName;
window.getClassNameById = Settings.getClassNameById;

// Educational Year Management functions
window.loadEducationalYears = Settings.loadEducationalYears;
window.loadCurrentEducationalYear = Settings.loadCurrentEducationalYear;
window.openAcademicSubtab = Settings.openAcademicSubtab;
window.openDataSubtab = Settings.openDataSubtab;
window.openUsersSubtab = Settings.openUsersSubtab;
window.getCurrentEducationalYear = Settings.getCurrentEducationalYear;
window.getEducationalYearCoverageStatus = Settings.getEducationalYearCoverageStatus;
window.displayEducationalYears = Settings.displayEducationalYears;
window.handleEducationalYearSelectionChange = Settings.handleEducationalYearSelectionChange;
window.applySelectedEducationalYear = Settings.applySelectedEducationalYear;
window.createEducationalYear = Settings.createEducationalYear;
window.editEducationalYear = Settings.editEducationalYear;
window.updateEducationalYear = Settings.updateEducationalYear;
window.deleteEducationalYear = Settings.deleteEducationalYear;
window.purgeSampleEducationalYear = Settings.purgeSampleEducationalYear;
window.setEducationalYearAsActive = Settings.setEducationalYearAsActive;
window.copyEducationalYearSetup = Settings.copyEducationalYearSetup;
window.saveYearEnrollment = Settings.saveYearEnrollment;
window.deleteYearEnrollment = Settings.deleteYearEnrollment;
window.saveYearClassBook = Settings.saveYearClassBook;
window.deleteYearClassBook = Settings.deleteYearClassBook;
window.saveYearTeacherAssignment = Settings.saveYearTeacherAssignment;
window.deleteYearTeacherAssignment = Settings.deleteYearTeacherAssignment;
window.renderHeaderEducationalYearDisplay = Settings.renderHeaderEducationalYearDisplay;
window.populatePromotionClassSelects = Settings.populatePromotionClassSelects;
window.updateBulkTargetClass = Settings.updateBulkTargetClass;
window.loadPromotionEnrollments = Settings.loadPromotionEnrollments;
window.updatePromotionTargetCell = Settings.updatePromotionTargetCell;
window.validatePromotionRolls = Settings.validatePromotionRolls;
window.runPromotion = Settings.runPromotion;

// Roll Assignment functions
window.loadRollAssignmentTable = Settings.loadRollAssignmentTable;
window.saveRollAssignment = Settings.saveRollAssignment;
// Note: Education Progress functions removed - Progress tracking is now handled in Teachers Corner

// Exam Management functions
window.initClassExamManagement = ExamManagement.initClassExamManagement;
window.loadClassExams = ExamManagement.loadClassExams;
window.renderClassExamSection = ExamManagement.renderClassExamSection;
window.updateClassExamStats = ExamManagement.updateClassExamStats;
window.renderClassExamList = ExamManagement.renderClassExamList;
window.createNewClassExam = ExamManagement.createNewClassExam;
window.showExamCreationModal = ExamManagement.showExamCreationModal;
window.closeExamCreationModal = ExamManagement.closeExamCreationModal;
window.proceedToBookSelection = ExamManagement.proceedToBookSelection;
window.showBookSelectionModal = ExamManagement.showBookSelectionModal;
window.selectBookForExam = ExamManagement.selectBookForExam;
window.selectScoreForExam = ExamManagement.selectScoreForExam;
window.closeBookSelectionModal = ExamManagement.closeBookSelectionModal;
window.createExamWithBooks = ExamManagement.createExamWithBooks;
window.openClassExam = ExamManagement.openClassExam;
window.editClassExam = ExamManagement.editClassExam;
window.showExamEditModal = ExamManagement.showExamEditModal;
window.closeExamEditModal = ExamManagement.closeExamEditModal;
window.toggleAvailableBooksInEdit = ExamManagement.toggleAvailableBooksInEdit;
window.loadAvailableBooksForEdit = ExamManagement.loadAvailableBooksForEdit;
window.addBookToEdit = ExamManagement.addBookToEdit;
window.removeBookFromEdit = ExamManagement.removeBookFromEdit;
window.updateBookMarksInEdit = ExamManagement.updateBookMarksInEdit;
window.updateEditSelectedBooksDisplay = ExamManagement.updateEditSelectedBooksDisplay;
window.saveExamEdits = ExamManagement.saveExamEdits;
window.viewClassExamResults = ExamManagement.viewClassExamResults;
window.duplicateClassExam = ExamManagement.duplicateClassExam;

// Messaging functions
window.selectConversation = Messaging.selectConversation;
window.startConversation = Messaging.startConversation;
window.startConversationWithTeacher = Messaging.startConversationWithTeacher;
window.handleMessageKeyPress = Messaging.handleMessageKeyPress;
window.sendMessageFromInput = Messaging.sendMessageFromInput;

// Teachers messaging functions
window.openTeachersMessaging = TeachersMessaging.openTeachersMessaging;
window.loadInlineMessagingInterface = TeachersMessaging.loadInlineMessagingInterface;
window.markConversationAsRead = TeachersMessaging.markConversationAsRead;
window.renderMessagingWidget = TeachersMessaging.renderMessagingWidget;
window.initializeTeachersMessaging = TeachersMessaging.initializeTeachersMessaging;

// Navigation functions
window.showSection = Misc.showSection;
window.deleteClassExam = ExamManagement.deleteClassExam;
window.viewAllClassExams = ExamManagement.viewAllClassExams;
window.updateComparisonMatrix = ExamManagement.updateComparisonMatrix;
window.renderComparisonMatrix = ExamManagement.renderComparisonMatrix;
window.getComparisonCellColor = ExamManagement.getComparisonCellColor;
window.selectAllExams = ExamManagement.selectAllExams;
window.exportComparisonMatrix = ExamManagement.exportComparisonMatrix;
window.showComparisonChart = ExamManagement.showComparisonChart;
window.closeResultsComparisonModal = ExamManagement.closeResultsComparisonModal;
window.exportClassResults = ExamManagement.exportClassResults;
window.showExportSelectionModal = ExamManagement.showExportSelectionModal;
window.closeExportSelectionModal = ExamManagement.closeExportSelectionModal;
window.proceedWithExport = ExamManagement.proceedWithExport;
window.exportSingleExamResults = ExamManagement.exportSingleExamResults;
window.exportAllExamResults = ExamManagement.exportAllExamResults;
window.openResultsViewInterface = ExamManagement.openResultsViewInterface;
window.closeResultsViewModal = ExamManagement.closeResultsViewModal;
window.classExamAnalytics = ExamManagement.classExamAnalytics;
window.calculateClassAnalytics = ExamManagement.calculateClassAnalytics;
window.closeClassAnalyticsModal = ExamManagement.closeClassAnalyticsModal;
window.exportAnalyticsReport = ExamManagement.exportAnalyticsReport;
window.printAnalyticsReport = ExamManagement.printAnalyticsReport;
window.updateSelectedBooksDisplay = ExamManagement.updateSelectedBooksDisplay;
window.updateBookMarksInSelection = ExamManagement.updateBookMarksInSelection;
window.removeBookFromSelection = ExamManagement.removeBookFromSelection;
window.removeBookFromExamWithConfirmation = ExamManagement.removeBookFromExamWithConfirmation;
window.saveExamSession = ExamManagement.saveExamSession;
window.refreshExamSectionInstantly = ExamManagement.refreshExamSectionInstantly;
window.showQuickNotification = ExamManagement.showQuickNotification;
window.openResultEntryInterface = ExamManagement.openResultEntryInterface;
window.renderStudentResultRow = ExamManagement.renderStudentResultRow;
window.updateStudentMark = ExamManagement.updateStudentMark;
window.calculateStudentExamTotals = ExamManagement.calculateStudentExamTotals;
window.closeResultEntryModal = ExamManagement.closeResultEntryModal;
window.saveResultsDraft = ExamManagement.saveResultsDraft;
window.publishResults = ExamManagement.publishResults;
window.clearAllResults = ExamManagement.clearAllResults;
window.importResultsCSV = ExamManagement.importResultsCSV;
window.showStudentExamDetail = ExamManagement.showStudentExamDetail;
window.loadStudentExamResults = ExamManagement.loadStudentExamResults;

// Teachers Corner - Student Profile functions (backup exposure)
// These are primarily exposed in teachers-corner.js, but we add them here as a fallback
// to ensure they're available when HTML onclick handlers execute
if (typeof TeachersCorner !== 'undefined' && TeachersCorner.ui) {
    if (!window.switchStudentProfileTab && TeachersCorner.ui.switchStudentProfileTab) {
        window.switchStudentProfileTab = TeachersCorner.ui.switchStudentProfileTab;
    }
    if (!window.switchProfileTab && TeachersCorner.ui.switchProfileTab) {
        window.switchProfileTab = TeachersCorner.ui.switchProfileTab;
    }
    if (!window.showStudentProfile && TeachersCorner.ui.showStudentProfile) {
        window.showStudentProfile = TeachersCorner.ui.showStudentProfile;
    }
    if (!window.closeStudentProfileModal && TeachersCorner.ui.closeStudentProfileModal) {
        window.closeStudentProfileModal = TeachersCorner.ui.closeStudentProfileModal;
    }
}

// Fallback for toggleStudentProfileFAB if not already defined
if (!window.toggleStudentProfileFAB) {
    window.toggleStudentProfileFAB = function() {
        const fabMenu = document.getElementById('student-profile-fab-menu');
        if (fabMenu) {
            fabMenu.classList.toggle('show');
        }
    };
}
window.showExamDetailBreakdown = ExamManagement.showExamDetailBreakdown;

// Expose exam data globally for access from other modules (e.g., print functionality)
window.currentClassExams = ExamManagement.currentClassExams;
window.currentClassExamResults = ExamManagement.currentClassExamResults;
window.closeExamBreakdownModal = ExamManagement.closeExamBreakdownModal;
window.getRankHTML = ExamManagement.getRankHTML;

// User Management functions
window.loadUsers = Settings.loadUsers;
window.showCreateUserModal = Settings.showCreateUserModal;
window.closeCreateUserModal = Settings.closeCreateUserModal;
window.editUser = Settings.editUser;
window.closeEditUserModal = Settings.closeEditUserModal;
window.deleteUser = Settings.deleteUser;
window.resetUserPassword = Settings.resetUserPassword;
window.refreshUsersList = Settings.refreshUsersList;

// Permission Management functions
window.showPermissionEditor = Settings.showPermissionEditor;
window.closePermissionEditor = Settings.closePermissionEditor;
window.applyPermissionTemplate = Settings.applyPermissionTemplate;
window.saveUserPermissions = Settings.saveUserPermissions;
window.loadPermissionTemplates = Settings.loadPermissionTemplates;
window.toggleCreateUserPermissions = Settings.toggleCreateUserPermissions;

// Data Management functions
window.showResetStudentsModal = Settings.showResetStudentsModal;
window.showResetScoresModal = Settings.showResetScoresModal;
window.showResetProgressModal = Settings.showResetProgressModal;
window.showResetBooksModal = Settings.showResetBooksModal;
window.showResetLogsModal = Settings.showResetLogsModal;
window.showResetUsersModal = Settings.showResetUsersModal;
window.showResetSettingsModal = Settings.showResetSettingsModal;
window.showCompleteResetModal = Settings.showCompleteResetModal;
window.showBackupModal = Settings.showBackupModal;
window.showBulkImport = Settings.showBulkImport;
window.hideBulkImport = Settings.hideBulkImport;
window.downloadAllStudentsCSV = Settings.downloadAllStudentsCSV;
window.createBackup = Settings.createBackup;
window.processExcelFile = Settings.processExcelFile;
window.handleFileSelect = Settings.handleFileSelect;
window.updateUploadZone = Settings.updateUploadZone;
window.resetUploadZone = Settings.resetUploadZone;

// Data Management confirmation functions
window.confirmResetStudents = Settings.confirmResetStudents;
window.confirmResetScores = Settings.confirmResetScores;
window.confirmResetProgress = Settings.confirmResetProgress;
window.confirmResetBooks = Settings.confirmResetBooks;
window.confirmResetLogs = Settings.confirmResetLogs;
window.confirmResetUsers = Settings.confirmResetUsers;
window.confirmResetSettings = Settings.confirmResetSettings;
window.confirmCompleteReset = Settings.confirmCompleteReset;

// Note: testAddBookProgress function removed - Education Progress is now handled in Teachers Corner

// Modal functions
window.showModal = Misc.showModal;
window.closeModal = Misc.closeModal;
window.closeBulkAbsentModal = Attendance.closeBulkAbsentModal;
window.saveData = Misc.saveData;
window.confirmMarkAllAbsent = Attendance.confirmMarkAllAbsent;
window.closeResetAttendanceModal = Attendance.closeResetAttendanceModal;
window.confirmResetAttendance = Attendance.confirmResetAttendance;
window.cleanupStickyAttendanceData = Attendance.cleanupStickyAttendanceData;
window.closeBookManagementEditModal = Settings.closeBookManagementEditModal;

// Mobile menu
window.toggleMobileMenu = Misc.toggleMobileMenu;

// Calendar functions
window.testCalendarRefresh = Misc.testCalendarRefresh;
window.forceRefreshAttendanceCalendar = Calendar.forceRefreshAttendanceCalendar;
window.refreshAttendanceCalendarIfVisible = Calendar.refreshAttendanceCalendarIfVisible;
window.debugSavedDates = Misc.debugSavedDates;
window.generateCalendarDays = Calendar.generateCalendarDays;
window.generateAttendanceSummary = Calendar.generateAttendanceSummary;
window.selectCalendarDate = Calendar.selectCalendarDate;

// Hijri functions
window.updateDashboardWithHijri = Hijri.updateDashboardWithHijri;
window.updateAttendancePageHijri = Hijri.updateAttendancePageHijri;
window.initializeHijriSettings = Hijri.initializeHijriSettings;
window.updateHijriAdjustment = Hijri.updateHijriAdjustment;
window.updateHijriPreview = Hijri.updateHijriPreview;
window.navigateCalendar = Calendar.navigateCalendar;
window.canNavigateToMonth = Calendar.canNavigateToMonth;
window.changeCalendarMonth = Calendar.changeCalendarMonth;
window.changeCalendarYear = Calendar.changeCalendarYear;
window.refreshCalendar = Calendar.refreshCalendar;
window.goToCurrentMonth = Calendar.goToCurrentMonth;

// Dashboard functions
window.updateDashboard = Dashboard.updateDashboard;
window.updateTodayOverview = Dashboard.updateTodayOverview;
window.updateClassWiseStats = Dashboard.updateClassWiseStats;
window.generateAttendanceTrackingCalendar = Dashboard.generateAttendanceTrackingCalendar;
window.updatePerformanceMetrics = Dashboard.updatePerformanceMetrics;
window.updateMainDashboardAlerts = Dashboard.updateMainDashboardAlerts;
window.showLowScoreStudents = Dashboard.showLowScoreStudents;
window.showAbsentStudents = Dashboard.showAbsentStudents;
window.toggleAlertDetails = Dashboard.toggleAlertDetails;
window.renderAlertDetails = Dashboard.renderAlertDetails;
window.showTeachersCornerForClass = Dashboard.showTeachersCornerForClass;
window.showStudentLogsModal = Dashboard.showStudentLogsModal;
window.showAlertsModal = Dashboard.showAlertsModal;
window.showPerformanceDetails = Dashboard.showPerformanceDetails;
window.showAbsenceSummaryModal = Dashboard.showAbsenceSummaryModal;
window.openMainDashboardMessaging = Dashboard.openMainDashboardMessaging;
window.openCommunicationsWindow = Dashboard.openCommunicationsWindow;
window.openBookProgressWindow = Dashboard.openBookProgressWindow;
window.closeCommunicationsWindow = Dashboard.closeCommunicationsWindow;
window.switchCommTab = Dashboard.switchCommTab;
window.selectTeacherLogsClass = Dashboard.selectTeacherLogsClass;
window.markTeacherLogAsRead = Dashboard.markTeacherLogAsRead;
window.toggleCommStudentExpansion = Dashboard.toggleCommStudentExpansion;
window.updateMainMessagesCount = Dashboard.updateMainMessagesCount;
window.closeMainDashboardMessaging = Dashboard.closeMainDashboardMessaging;
window.initializeMainDashboardMessaging = Dashboard.initializeMainDashboardMessaging;
window.initializeTeacherLogs = Dashboard.initializeTeacherLogs;
window.loadMainDashboardConversations = Dashboard.loadMainDashboardConversations;
window.loadMainDashboardTeachers = Dashboard.loadMainDashboardTeachers;
window.renderMainDashboardSidebar = Dashboard.renderMainDashboardSidebar;
window.startMainDashboardConversationWithTeacher = Dashboard.startMainDashboardConversationWithTeacher;
window.selectMainDashboardConversation = Dashboard.selectMainDashboardConversation;
window.loadMainDashboardMessages = Dashboard.loadMainDashboardMessages;
window.renderMainDashboardMessages = Dashboard.renderMainDashboardMessages;
window.handleMainDashboardMessageKeyPress = Dashboard.handleMainDashboardMessageKeyPress;
window.sendMainDashboardMessage = Dashboard.sendMainDashboardMessage;
window.autoResizeMainDashboardTextarea = Dashboard.autoResizeMainDashboardTextarea;

// Make state variables globally accessible
window.students = State.students;
// window.classes will be loaded from database in initializeApp()
window.attendance = State.attendance;
window.holidays = State.holidays;
window.academicYearStartDate = State.academicYearStartDate;
window.savedAttendanceDates = State.savedAttendanceDates;
window.autoCopiedAttendanceDates = State.autoCopiedAttendanceDates;

// Debug: Check state variables
// console.log('🔍 State.classes:', State.classes); // Removed - classes now loaded from database
console.log('🔍 window.classes:', window.classes);
console.log('🔍 classes length:', window.classes ? window.classes.length : 'undefined');

// Make calendar variables globally accessible
window.currentCalendarMonth = Misc.currentCalendarMonth;
window.currentCalendarYear = Misc.currentCalendarYear;

// Make utility functions globally accessible
window.formatDate = Utils.formatDate;
window.getClassNumber = Utils.getClassNumber;
window.parseRollNumber = Utils.parseRollNumber;
window.convertBengaliToEnglishNumbers = Utils.convertBengaliToEnglishNumbers;
window.bengaliToEnglish = Utils.bengaliToEnglish;
window.englishNumber = Utils.englishNumber;
window.date = Utils.date;
window.match = Utils.match;
window.bengaliClassMap = Utils.bengaliClassMap;

// Make translation function globally accessible
window.t = t;

// Make currentUser globally accessible (will be set by authentication check)
window.currentUser = null;

// Add a function to refresh students data from server
async function refreshStudentsData() {
    try {
        console.log('🔄 Refreshing students data from server...');
        const studentsResponse = await fetch('/api/students', {
            credentials: 'include'  // Include session cookies
        });
        if (studentsResponse.ok) {
            const studentsData = await studentsResponse.json();
            // Update the global window variables directly
            window.students = studentsData;
            console.log(`✅ Students data refreshed successfully - ${studentsData.length} students`);
            return true;
        } else {
            console.error('❌ Failed to refresh students data');
            return false;
        }
    } catch (error) {
        console.error('❌ Error refreshing students data:', error);
        return false;
    }
}

async function refreshYearScopedBooksData() {
    try {
        console.log('🔄 Refreshing active-year books from server...');
        const booksResponse = await fetch('/api/books', {
            credentials: 'include'
        });
        if (booksResponse.ok) {
            const booksData = await booksResponse.json();
            window.books = booksData;
            console.log(`✅ Active-year books refreshed successfully - ${booksData.length} books`);
            return true;
        } else {
            console.error('❌ Failed to refresh active-year books');
            return false;
        }
    } catch (error) {
        console.error('❌ Error refreshing active-year books:', error);
        return false;
    }
}

// Hash Navigation System
function setupHashNavigation() {
    console.log('🔗 Setting up hash navigation...');
    
    // Map hash names to actual section IDs
    const hashToSection = {
        'dashboard': 'dashboard',
        'registration': 'registration', 
        'attendance': 'attendance',
        'reports': 'reports',
        'settings': 'settings',
        'teachers-corner': 'teachers-corner-section'
    };
    
    // Listen for hash changes
    window.addEventListener('hashchange', function() {
        const hash = window.location.hash.replace('#', '');
        console.log(`🔗 Hash changed to: ${hash}`);
        
        const sectionId = hashToSection[hash] || hash;
        if (sectionId && typeof showSection === 'function') {
            showSection(sectionId);
            
            // Section-specific initialization
            if (hash === 'attendance') {
                console.log('📊 Initializing attendance data after navigation...');
                if (typeof loadAttendanceForDate === 'function') {
                    setTimeout(() => loadAttendanceForDate(), 100);
                }
            } else if (hash === 'dashboard') {
                console.log('📊 Initializing dashboard data after navigation...');
                if (typeof updateDashboard === 'function') {
                    setTimeout(() => updateDashboard(), 100);
                }
            }
        }
    });
    
    // Handle initial page load with hash
    window.addEventListener('load', function() {
        const hash = window.location.hash.replace('#', '');
        console.log(`🔗 Page loaded with hash: ${hash}`);
        
        const sectionId = hashToSection[hash] || hash;
        if (sectionId && hash) {
            // Wait for app initialization to complete, then show section
            setTimeout(async () => {
                console.log(`🔗 Restoring section: ${hash} → ${sectionId}`);
                
                // Ensure app data is loaded first
                if (typeof showSection === 'function') {
                    await showSection(sectionId);
                    
                    // Additional initialization for specific sections
                    if (hash === 'attendance') {
                        console.log('📊 Initializing attendance data after hash restoration...');
                        if (typeof loadAttendanceForDate === 'function') {
                            setTimeout(() => loadAttendanceForDate(), 100);
                        }
                        if (typeof updateDateInputMax === 'function') {
                            updateDateInputMax();
                        }
                    } else if (hash === 'dashboard') {
                        console.log('📊 Initializing dashboard data after hash restoration...');
                        if (typeof updateDashboard === 'function') {
                            setTimeout(() => updateDashboard(), 100);
                        }
                    }
                }
            }, 1000); // Longer delay to ensure full app initialization
        }
    });
    
    console.log('✅ Hash navigation setup complete');
}

// Prevent sidebar/mobile nav hash links from triggering browser scroll-to-element; onclick still runs
function setupNavigationClickPrevention() {
    document.addEventListener('click', function(e) {
        const link = e.target.closest('.sidebar a.nav-link[href^="#"], .mobile-bottom-nav a.nav-item[href^="#"]');
        if (!link) return;
        const href = link.getAttribute('href');
        if (href === '#' || !href) return;
        e.preventDefault();
    }, true);
}

// Navigation helper function (use replaceState to avoid browser scroll-to-hash jump)
function navigateToSection(hashName) {
    const hashToSection = {
        'dashboard': 'dashboard',
        'registration': 'registration',
        'attendance': 'attendance',
        'reports': 'reports',
        'settings': 'settings',
        'teachers-corner': 'teachers-corner-section'
    };

    const hash = '#' + hashName;
    if (window.history && window.history.replaceState) {
        window.history.replaceState(null, '', hash);
    } else {
        window.location.hash = hash;
    }
    const actualSectionId = hashToSection[hashName] || hashName;

    if (typeof showSection === 'function') {
        showSection(actualSectionId);
    }
}

// Expose navigation functions globally
window.setupHashNavigation = setupHashNavigation;
window.navigateToSection = navigateToSection;
window.refreshYearScopedBooksData = refreshYearScopedBooksData;

// Initialize application data from database
async function initializeApp() {
    try {
        console.log('🔄 Initializing application data...');
        
        // Wait for authentication check first
        if (!window.currentUser) {
            console.log('⏳ Waiting for authentication check...');
            let attempts = 0;
            while (!window.currentUser && attempts < 20) {
                await new Promise(resolve => setTimeout(resolve, 100));
                attempts++;
            }
        }
        
        // Update navigation menu based on user permissions
        if (window.currentUser && typeof updateNavigationMenu === 'function') {
            console.log('🔐 Updating navigation menu based on user permissions...');
            updateNavigationMenu();
        }

        // Load educational year context early so the header label is correct
        // and users are warned if the active year no longer covers today.
        if (typeof Settings.loadEducationalYears === 'function') {
            await Settings.loadEducationalYears();
        }
        
        // Load data based on user role
        if (window.currentUser && window.currentUser.role === 'admin') {
            // Admin users: load all data
            console.log('👤 Admin user detected, loading all data');
        
        // Load students from database
        const studentsResponse = await fetch('/api/students', {
            credentials: 'include'  // Include session cookies
        });
        if (studentsResponse.ok) {
            const studentsData = await studentsResponse.json();
            // Update the global window variables directly
            window.students = studentsData;
            console.log(`✅ Loaded ${studentsData.length} students from database`);
        }
        
        // Load attendance from database
        const attendanceResponse = await fetch('/api/attendance', {
            credentials: 'include'
        });
        if (attendanceResponse.ok) {
            const attendanceData = await attendanceResponse.json();
            // Update the global window variables directly
            window.attendance = attendanceData;
            
                // Populate savedAttendanceDates and autoCopiedAttendanceDates
                if (attendanceData && typeof attendanceData === 'object') {
                    const savedDates = Object.keys(attendanceData).filter(date => {
                        const dateAttendance = attendanceData[date];
                        return dateAttendance && typeof dateAttendance === 'object' && Object.keys(dateAttendance).length > 0;
                    });
                    
                    // Clear and populate the savedAttendanceDates Set
                    window.savedAttendanceDates.clear();
                    window.autoCopiedAttendanceDates.clear();
                    
                    savedDates.forEach(date => {
                        window.savedAttendanceDates.add(date);
                        
                        // Check if this date was auto-copied
                        const dateAttendance = attendanceData[date];
                        const attendanceRecords = Object.values(dateAttendance);
                        // If ALL records for this date are auto_copied, mark the date as auto-copied
                        if (attendanceRecords.length > 0 && attendanceRecords.every(record => record.attendance_source === 'auto_copied')) {
                            window.autoCopiedAttendanceDates.add(date);
                        }
                    });
                    
                    console.log(`✅ Loaded attendance data from database`);
                    console.log(`✅ Populated savedAttendanceDates with ${savedDates.length} dates`);
                    console.log(`✅ Populated autoCopiedAttendanceDates with ${window.autoCopiedAttendanceDates.size} dates`);
                }
        }
        
        // Holidays system removed - no longer needed
        window.holidays = [];
        
        } else if (window.currentUser && window.currentUser.role === 'user') {
            // Regular users: load data based on their permissions
            console.log(`👤 Regular user detected, loading data based on permissions...`);
            
            // Get user's allowed classes from permissions
            const allowedClasses = typeof getUserAllowedClasses === 'function' ? getUserAllowedClasses() : [];
            console.log(`🔐 User allowed classes:`, allowedClasses);
            
            // Load students
            const studentsResponse = await fetch('/api/students', {
            credentials: 'include'  // Include session cookies
        });
            if (studentsResponse.ok) {
                const allStudentsData = await studentsResponse.json();
                
                // Filter students based on allowed classes
                let filteredStudents;
                if (allowedClasses.includes('all')) {
                    // User can see all classes
                    filteredStudents = allStudentsData;
                    console.log(`✅ User has access to ALL classes - Loaded ${filteredStudents.length} students`);
                } else if (allowedClasses.length > 0) {
                    // User can see specific classes
                    filteredStudents = allStudentsData.filter(student => 
                        allowedClasses.includes(student.class)
                    );
                    console.log(`✅ User has access to specific classes: ${allowedClasses.join(', ')} - Loaded ${filteredStudents.length} students`);
                } else if (window.currentUser.class_name) {
                    // Fallback: Use class_name if no permissions set (backward compatibility)
                    filteredStudents = allStudentsData.filter(student => 
                        student.class === window.currentUser.class_name && student.status === 'active'
                    );
                    console.log(`✅ Fallback to class_name: ${window.currentUser.class_name} - Loaded ${filteredStudents.length} students`);
                } else {
                    // No permissions and no class assigned
                    filteredStudents = [];
                    console.log(`⚠️ User has no class permissions - No students loaded`);
                }
                
                window.students = filteredStudents;
            }
            
            // Load attendance data (will be filtered later by Teachers Corner)
            const attendanceResponse = await fetch('/api/attendance', {
            credentials: 'include'
        });
            if (attendanceResponse.ok) {
                const attendanceData = await attendanceResponse.json();
                window.attendance = attendanceData;
                
                // Populate savedAttendanceDates and autoCopiedAttendanceDates
                if (attendanceData && typeof attendanceData === 'object') {
                    const savedDates = Object.keys(attendanceData).filter(date => {
                        const dateAttendance = attendanceData[date];
                        return dateAttendance && typeof dateAttendance === 'object' && Object.keys(dateAttendance).length > 0;
                    });
                    
                    // Clear and populate the Sets
                    window.savedAttendanceDates.clear();
                    window.autoCopiedAttendanceDates.clear();
                    
                    savedDates.forEach(date => {
                        window.savedAttendanceDates.add(date);
                        
                        // Check if this date was auto-copied
                        const dateAttendance = attendanceData[date];
                        const attendanceRecords = Object.values(dateAttendance);
                        if (attendanceRecords.length > 0 && attendanceRecords.every(record => record.attendance_source === 'auto_copied')) {
                            window.autoCopiedAttendanceDates.add(date);
                        }
                    });
                    
                    console.log(`✅ Loaded attendance data from database`);
                    console.log(`✅ Auto-copied dates: ${window.autoCopiedAttendanceDates.size}`);
                }
            }
            
            // Initialize holidays as empty for regular users
            window.holidays = [];
            window.savedAttendanceDates = window.savedAttendanceDates || new Set();
            window.autoCopiedAttendanceDates = window.autoCopiedAttendanceDates || new Set();
        } else {
            console.log('👤 User detected but no class assigned, initializing empty data');
            // Initialize empty data
            window.students = [];
            window.attendance = {};
            window.holidays = [];
            window.savedAttendanceDates = new Set();
            window.autoCopiedAttendanceDates = new Set();
        }
        
        // Load classes from database
        const classesResponse = await fetch('/api/classes', {
            credentials: 'include'
        });
        if (classesResponse.ok) {
            const classesData = await classesResponse.json();
            // Update the global window variables directly
            window.classes = classesData; // This will be an array of objects like [{id: 1, name: '...'}, ...]
            console.log(`✅ Loaded ${classesData.length} classes from database`);
        }
        
        // Load education progress and books from database
        // Note: loadEducationProgress removed - Education Progress is now handled in Teachers Corner
        
        if (typeof loadBooks === 'function') {
            await loadBooks();
            console.log('✅ Loaded master books for settings');
        }
        await refreshYearScopedBooksData();
        console.log('✅ Loaded active-year books for app screens');

        if (typeof Attendance.initializeAttendanceCatchUp === 'function') {
            await Attendance.initializeAttendanceCatchUp({
                currentEducationalYear: typeof Settings.getCurrentEducationalYear === 'function'
                    ? Settings.getCurrentEducationalYear()
                    : null,
                coverageStatus: typeof Settings.getEducationalYearCoverageStatus === 'function'
                    ? Settings.getEducationalYearCoverageStatus()
                    : null
            });
        }
        
        // Only initialize admin-specific features for admin users
        if (window.currentUser && window.currentUser.role === 'admin') {
        // Update class dropdowns after loading data
        if (typeof updateClassDropdowns === 'function') {
            updateClassDropdowns();
        }
            
            // Populate attendance class filter after classes are loaded
            if (typeof Attendance.populateAttendanceClassFilter === 'function') {
                Attendance.populateAttendanceClassFilter();
            }
        
        // Update book dropdowns after loading books
        if (typeof updateBookDropdowns === 'function') {
            updateBookDropdowns();
        }
        
            // Update dashboard - ONLY for admin users
        if (typeof updateDashboard === 'function') {
            updateDashboard();
        }
        
        // Initialize teacher logs system - ONLY for admin users
        if (typeof initializeTeacherLogs === 'function') {
            initializeTeacherLogs();
        }
        
        // Initialize academic year start date
        if (typeof initializeAcademicYearStart === 'function') {
            initializeAcademicYearStart();
        }
        
        // Initialize Hijri settings
        if (typeof initializeHijriSettings === 'function') {
            initializeHijriSettings();
            }
        } else {
            console.log('👤 Regular user detected, skipping admin-specific initialization');
        }
        
        // Clean up any auto-applied future attendance data
        if (typeof cleanupStickyAttendanceData === 'function') {
            await cleanupStickyAttendanceData();
        }
        
        // Add event listeners for attendance page
        const attendanceDateInput = document.getElementById('attendanceDate');
        const classFilterInput = document.getElementById('classFilter');
        
        if (attendanceDateInput) {
            attendanceDateInput.addEventListener('change', function() {
                loadAttendanceForDate();
                // Update Hijri date when attendance date changes
                if (typeof updateAttendancePageHijri === 'function') {
                    updateAttendancePageHijri();
                }
            });
        }
        
        if (classFilterInput) {
            classFilterInput.addEventListener('change', function() {
                loadAttendanceForDate();
                // Update filter status immediately after change
                if (typeof updateFilterStatus === 'function') {
                    updateFilterStatus();
                }
            });
        }
        
        // Load app name immediately to prevent flash
        await loadAppNameImmediately();
        
        // Initialize language system to load app name and other settings
        if (typeof initializeLanguage === 'function') {
            initializeLanguage();
        }
        
        console.log('✅ Application initialization completed');
        
        // Handle URL parameters for student details
        const urlParams = new URLSearchParams(window.location.search);
        const studentId = urlParams.get('student');
        const source = urlParams.get('source');
        
        if (studentId) {
            // Show student detail if student ID is provided in URL
            if (typeof showStudentDetail === 'function') {
                showStudentDetail(studentId, source || 'attendance');
            }
        }
        
    } catch (error) {
        console.error('❌ Error initializing application:', error);
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Setup hash navigation first
    setupHashNavigation();
    setupNavigationClickPrevention();

    // Then initialize app data
    initializeApp();
});

// Teachers Corner Dropdown Functions
function toggleTeachersCornerDropdown() {
    const dropdown = document.getElementById('teachersCornerDropdown');
    if (dropdown.style.display === 'none' || dropdown.style.display === '') {
        dropdown.style.display = 'block';
        populateTeachersCornerDropdown();
    } else {
        dropdown.style.display = 'none';
    }
}

function populateTeachersCornerDropdown() {
    const dropdown = document.getElementById('teachersCornerDropdown');
    
    // Get classes from your existing class data
    let classes = window.classes || [];
    
    // If user is not admin, filter to only their assigned class
    if (window.currentUser && window.currentUser.role === 'user' && window.currentUser.class_name) {
        classes = classes.filter(cls => cls.name === window.currentUser.class_name);
    }
    
    if (classes.length === 0) {
        if (window.currentUser && window.currentUser.role === 'user') {
            dropdown.innerHTML = '<a href="#" style="color: #6c757d; font-style: italic;">No class assigned</a>';
        } else {
            dropdown.innerHTML = '<a href="#" style="color: #6c757d; font-style: italic;">No classes available</a>';
        }
        return;
    }
    
    // Create class options
    const classOptions = classes.map(cls => `
        <a href="#" onclick="openTeachersCornerForClass('${cls.name}')">
            <i class="fas fa-graduation-cap"></i> ${cls.name}
        </a>
    `).join('');
    
    dropdown.innerHTML = classOptions;
}

// Expose immediately so it's available during initialization
window.openTeachersCornerForClass = async function openTeachersCornerForClass(className) {
    console.log(`🚀 Opening Teachers Corner for class: ${className}`);

    if (window.teachersCornerReady) {
        await window.teachersCornerReady;
    }
    
    // Check if showSection is available
    if (typeof showSection !== 'function') {
        console.error('❌ showSection function is not available!');
        console.log('🔍 Available global functions:', Object.keys(window).filter(key => 
            typeof window[key] === 'function' && key.includes('show')
        ));
        console.log('🔍 typeof showSection:', typeof showSection);
        console.log('🔍 window.showSection:', window.showSection);
        
        // Try to wait for it to be available
        let attempts = 0;
        const maxAttempts = 10;
        while (typeof showSection !== 'function' && attempts < maxAttempts) {
            console.log(`⏳ Waiting for showSection to be available... (attempt ${attempts + 1}/${maxAttempts})`);
            await new Promise(resolve => setTimeout(resolve, 100));
            attempts++;
        }
        
        if (typeof showSection !== 'function') {
            console.error('❌ showSection still not available after waiting');
            return;
        }
    }
    
    console.log('🔍 showSection function details:', {
        name: showSection.name,
        toString: showSection.toString().substring(0, 100) + '...',
        isAsync: showSection.constructor.name === 'AsyncFunction'
    });
    
    // Show integrated Teachers Corner section
    try {
        console.log('✅ Calling showSection...');
        console.log('🔍 Before showSection - teachers-corner-section element:', document.getElementById('teachers-corner-section'));
        console.log('🔍 Before showSection - all sections:', Array.from(document.querySelectorAll('.section')).map(s => ({ id: s.id, hasActive: s.classList.contains('active'), display: window.getComputedStyle(s).display })));
        
        await showSection('teachers-corner-section');
        console.log('✅ Teachers Corner section should now be visible');
        
        // Verify the section is actually visible
        const teachersCornerSection = document.getElementById('teachers-corner-section');
        if (teachersCornerSection) {
            console.log('🔍 Section visibility check:', {
                hasActiveClass: teachersCornerSection.classList.contains('active'),
                computedDisplay: window.getComputedStyle(teachersCornerSection).display,
                classes: teachersCornerSection.className,
                styleDisplay: teachersCornerSection.style.display
            });
            
            // Force the section to be visible if it's not
            if (!teachersCornerSection.classList.contains('active')) {
                console.warn('⚠️ Section not active after showSection, forcing activation...');
                teachersCornerSection.classList.add('active');
            }
            
            // Also force display if CSS is not working
            const computedDisplay = window.getComputedStyle(teachersCornerSection).display;
            if (computedDisplay === 'none') {
                console.warn('⚠️ CSS display is still none after showSection, forcing display...');
                teachersCornerSection.style.display = 'block';
            }
        }
        
        // Check all sections after showSection
        console.log('🔍 After showSection - all sections:', Array.from(document.querySelectorAll('.section')).map(s => ({ id: s.id, hasActive: s.classList.contains('active'), display: window.getComputedStyle(s).display })));
        
    } catch (error) {
        console.error('❌ Error showing teachers corner section:', error);
    }
    
    // Function to check if we can proceed
    const canProceed = () => {
        const requiredElements = [
            'class-dashboard-title',
            'class-student-list',
            'class-education-progress',
            'logbook-display'
        ];
        
        // Add comprehensive DOM debugging
        console.log('🔍 DOM Debugging Information:');
        console.log('🔍 document.readyState:', document.readyState);
        console.log('🔍 document.body.children.length:', document.body.children.length);
        console.log('🔍 All sections found:', Array.from(document.querySelectorAll('.section')).map(s => ({ id: s.id, classes: s.className })));
        console.log('🔍 teachers-corner-section element:', document.getElementById('teachers-corner-section'));
        
        // Check if the teachers corner section exists and what's inside it
        const teachersCornerSection = document.getElementById('teachers-corner-section');
        if (teachersCornerSection) {
            console.log('🔍 Teachers corner section content:', {
                innerHTML: teachersCornerSection.innerHTML.substring(0, 200) + '...',
                children: Array.from(teachersCornerSection.children).map(child => ({ 
                    id: child.id, 
                    tagName: child.tagName, 
                    className: child.className 
                }))
            });
            
            // Also check for elements by searching within the section
            console.log('🔍 Searching for elements within teachers corner section:');
            requiredElements.forEach(id => {
                const elementInSection = teachersCornerSection.querySelector(`#${id}`);
                console.log(`  🔍 ${id} in section: ${elementInSection ? 'FOUND' : 'MISSING'}`);
                if (elementInSection) {
                    console.log(`    ✅ Found ${id} within section:`, {
                        tagName: elementInSection.tagName,
                        className: elementInSection.className,
                        textContent: elementInSection.textContent.substring(0, 50) + '...'
                    });
                }
            });
            
            // Check if the section has any content at all
            console.log('🔍 Section content analysis:', {
                hasChildren: teachersCornerSection.children.length > 0,
                childrenCount: teachersCornerSection.children.length,
                textContent: teachersCornerSection.textContent.substring(0, 100) + '...',
                innerHTMLLength: teachersCornerSection.innerHTML.length
            });
        }
        
        const missingElements = requiredElements.filter(id => !document.getElementById(id));
        
        if (missingElements.length > 0) {
            console.warn('⚠️ Some required elements not found:', missingElements);
            
            // Add detailed debugging for each required element
            console.log('🔍 Detailed element status:');
            requiredElements.forEach(id => {
                const element = document.getElementById(id);
                if (element) {
                    console.log(`  ✅ ${id}: FOUND`, {
                        classes: element.className,
                        computedDisplay: window.getComputedStyle(element).display,
                        styleDisplay: element.style.display,
                        offsetParent: element.offsetParent,
                        clientHeight: element.clientHeight,
                        clientWidth: element.clientWidth
                    });
                } else {
                    console.log(`  ❌ ${id}: MISSING`);
                    
                    // Try to find it by other means
                    const byQuerySelector = document.querySelector(`#${id}`);
                    const byClassName = document.querySelector(`.${id}`);
                    const byTagName = document.querySelector(id);
                    
                    console.log(`    🔍 Search attempts for ${id}:`, {
                        byQuerySelector: !!byQuerySelector,
                        byClassName: !!byClassName,
                        byTagName: !!byTagName
                    });
                }
            });
            
            // Check if the teachers corner section itself is visible
            if (teachersCornerSection) {
                console.log('🔍 Teachers corner section status:', {
                    classes: teachersCornerSection.className,
                    computedDisplay: window.getComputedStyle(teachersCornerSection).display,
                    styleDisplay: teachersCornerSection.style.display,
                    offsetParent: teachersCornerSection.offsetParent,
                    clientHeight: teachersCornerSection.clientHeight,
                    clientWidth: teachersCornerSection.clientWidth
                });
            }
            
            return false;
        }
        
        if (typeof window.showClassDashboard !== 'function') {
            console.warn('⚠️ showClassDashboard function not available yet');
            return false;
        }
        
        console.log('✅ All required elements and functions found');
        return true;
    };
    
    // Function to attempt loading dashboard
    const attemptLoadDashboard = (attempt = 1, maxAttempts = 5) => {
        console.log(`🔄 Attempt ${attempt} to load dashboard for class: ${className}`);
        
        if (canProceed()) {
            try {
                console.log('✅ Proceeding with dashboard loading...');
                // Set hash for Teachers Corner
                window.location.hash = '#teachers-corner';
                window.showClassDashboard(className);
                return;
            } catch (error) {
                console.error('❌ Error calling showClassDashboard:', error);
            }
        }
        
        if (attempt < maxAttempts) {
            const delay = Math.min(200 * attempt, 1000); // Progressive delay: 200ms, 400ms, 600ms, 800ms, 1000ms
            console.log(`⏳ Retrying in ${delay}ms... (attempt ${attempt + 1}/${maxAttempts})`);
            setTimeout(() => attemptLoadDashboard(attempt + 1, maxAttempts), delay);
        } else {
            console.error('❌ Failed to load dashboard after maximum attempts');
            // Show user-friendly error message
            const dashboardTitle = document.getElementById('class-dashboard-title');
            if (dashboardTitle) {
                dashboardTitle.innerHTML = `
                    <div class="text-center p-8">
                        <h2 class="text-2xl font-bold mb-4 text-red-600">লোডিং সমস্যা</h2>
                        <p class="text-gray-600 mb-4">ড্যাশবোর্ড লোড করতে সমস্যা হয়েছে।</p>
                        <button onclick="openTeachersCornerForClass('${className}')" class="btn-primary text-white px-4 py-2 rounded-md">
                            আবার চেষ্টা করুন
                        </button>
                    </div>
                `;
            }
        }
    };
    
    // Start the loading process with initial delay
    setTimeout(() => attemptLoadDashboard(1), 100);
    
    // Close the dropdown
    const dropdown = document.getElementById('teachersCornerDropdown');
    if (dropdown) {
        dropdown.style.display = 'none';
    }
}

// Close dropdown when clicking outside
document.addEventListener('click', function(event) {
    const dropdown = document.getElementById('teachersCornerDropdown');
    const dropdownToggle = document.querySelector('.dropdown-toggle');
    
    if (dropdown && !dropdown.contains(event.target) && !dropdownToggle.contains(event.target)) {
        dropdown.style.display = 'none';
    }
});

// Expose Teachers Corner functions globally
window.toggleTeachersCornerDropdown = toggleTeachersCornerDropdown;
window.populateTeachersCornerDropdown = populateTeachersCornerDropdown;
// Already exposed above during function definition

// Alert Settings Functions
async function loadAlertSettings() {
    try {
        const response = await fetch('/api/settings/alertConfig', {
            credentials: 'include'
        });
        if (response.ok) {
            const data = await response.json();
            const config = JSON.parse(data.value || '{}');
            
            // Update input fields with saved values
            const lowScoreInput = document.getElementById('lowScoreThreshold');
            const criticalScoreInput = document.getElementById('criticalScoreThreshold');
            const lowClassAverageInput = document.getElementById('lowClassAverageThreshold');
            
            if (lowScoreInput) lowScoreInput.value = config.LOW_SCORE_THRESHOLD || 60;
            if (criticalScoreInput) criticalScoreInput.value = config.CRITICAL_SCORE_THRESHOLD || 50;
            if (lowClassAverageInput) lowClassAverageInput.value = config.LOW_CLASS_AVERAGE_THRESHOLD || 70;
        } else {
            // Fallback to localStorage if database fails
            const saved = localStorage.getItem('alertConfig');
            if (saved) {
                const config = JSON.parse(saved);
                const lowScoreInput = document.getElementById('lowScoreThreshold');
                const criticalScoreInput = document.getElementById('criticalScoreThreshold');
                const lowClassAverageInput = document.getElementById('lowClassAverageThreshold');
                
                if (lowScoreInput) lowScoreInput.value = config.LOW_SCORE_THRESHOLD || 60;
                if (criticalScoreInput) criticalScoreInput.value = config.CRITICAL_SCORE_THRESHOLD || 50;
                if (lowClassAverageInput) lowClassAverageInput.value = config.LOW_CLASS_AVERAGE_THRESHOLD || 70;
            }
        }
    } catch (error) {
        console.error('Error loading alert config:', error);
        // Fallback to localStorage
        const saved = localStorage.getItem('alertConfig');
        if (saved) {
            const config = JSON.parse(saved);
            const lowScoreInput = document.getElementById('lowScoreThreshold');
            const criticalScoreInput = document.getElementById('criticalScoreThreshold');
            const lowClassAverageInput = document.getElementById('lowClassAverageThreshold');
            
            if (lowScoreInput) lowScoreInput.value = config.LOW_SCORE_THRESHOLD || 60;
            if (criticalScoreInput) criticalScoreInput.value = config.CRITICAL_SCORE_THRESHOLD || 50;
            if (lowClassAverageInput) lowClassAverageInput.value = config.LOW_CLASS_AVERAGE_THRESHOLD || 70;
        }
    }
}

async function saveAlertThreshold() {
    const lowScoreThreshold = parseInt(document.getElementById('lowScoreThreshold').value) || 60;
    const criticalScoreThreshold = parseInt(document.getElementById('criticalScoreThreshold').value) || 50;
    const lowClassAverageThreshold = parseInt(document.getElementById('lowClassAverageThreshold').value) || 70;
    
    const config = {
        LOW_SCORE_THRESHOLD: lowScoreThreshold,
        CRITICAL_SCORE_THRESHOLD: criticalScoreThreshold,
        LOW_CLASS_AVERAGE_THRESHOLD: lowClassAverageThreshold
    };
    
    try {
        const response = await fetch('/api/settings/alertConfig', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                value: JSON.stringify(config),
                description: 'Alert configuration thresholds'
            })
        });
        
        if (response.ok) {
            // Also save to localStorage as backup
            localStorage.setItem('alertConfig', JSON.stringify(config));
            
            // Update global ALERT_CONFIG if it exists
            if (window.ALERT_CONFIG) {
                window.ALERT_CONFIG.LOW_SCORE_THRESHOLD = lowScoreThreshold;
                window.ALERT_CONFIG.CRITICAL_SCORE_THRESHOLD = criticalScoreThreshold;
                window.ALERT_CONFIG.LOW_CLASS_AVERAGE_THRESHOLD = lowClassAverageThreshold;
            }
            
            // Show success message
            showModal('Success', 'Alert thresholds saved successfully!');
            
            // Refresh alerts if dashboard is open
            if (typeof window.renderDashboardAlerts === 'function' && window.currentClass) {
                const activeStudents = window.getActiveStudentsForClass ? window.getActiveStudentsForClass(window.currentClass) : [];
                window.renderDashboardAlerts(activeStudents);
            }
        } else {
            console.error('Failed to save alert config to database');
            // Fallback to localStorage only
            localStorage.setItem('alertConfig', JSON.stringify(config));
            showModal('Warning', 'Alert thresholds saved locally!');
        }
    } catch (error) {
        console.error('Error saving alert config:', error);
        // Fallback to localStorage only
        localStorage.setItem('alertConfig', JSON.stringify(config));
        showModal('Warning', 'Alert thresholds saved locally!');
    }
}

// Load app name immediately to prevent flash
async function loadAppNameImmediately() {
    let appName = 'Student Management System'; // Generic fallback
    
    try {
        const response = await fetch('/api/settings/appName', {
            credentials: 'include'
        });
        if (response.ok) {
            const data = await response.json();
            appName = data.value || 'Student Management System';
        } else {
            // Try localStorage as backup
            appName = localStorage.getItem('madaniMaktabAppName') || 'Student Management System';
        }
    } catch (error) {
        console.log('Using fallback app name for immediate load');
        appName = localStorage.getItem('madaniMaktabAppName') || 'Student Management System';
    }
    
    // Update all app name elements immediately
    const elements = [
        'headerAppName',
        'loadingAppName', 
        'footerAppName',
        'pageTitle'
    ];
    
    elements.forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            if (id === 'pageTitle') {
                element.textContent = `${appName} - Student Management System`;
            } else {
                element.textContent = appName;
            }
        }
    });
    
    // Also save to localStorage for consistency
    localStorage.setItem('madaniMaktabAppName', appName);
}

// Load current app name into the input field
async function loadAppName() {
    try {
        const response = await fetch('/api/settings/appName', {
            credentials: 'include'
        });
        if (response.ok) {
            const data = await response.json();
            const appNameInput = document.getElementById('appNameInput');
            if (appNameInput && data.value) {
                appNameInput.value = data.value;
            }
        } else {
            // Fallback to localStorage
            const savedName = localStorage.getItem('madaniMaktabAppName');
            const appNameInput = document.getElementById('appNameInput');
            if (appNameInput && savedName) {
                appNameInput.value = savedName;
            }
        }
    } catch (error) {
        console.error('Error loading app name:', error);
        // Fallback to localStorage
        const savedName = localStorage.getItem('madaniMaktabAppName');
        const appNameInput = document.getElementById('appNameInput');
        if (appNameInput && savedName) {
            appNameInput.value = savedName;
        }
    }
}

// Load alert settings when settings tab is opened
function loadSettingsData() {
    loadAlertSettings();
    loadAppName();
}

// Make functions globally accessible
window.loadAlertSettings = loadAlertSettings;
window.saveAlertThreshold = saveAlertThreshold;
window.loadSettingsData = loadSettingsData;
window.updateMainDashboardAlerts = updateMainDashboardAlerts;
window.showLowScoreStudents = showLowScoreStudents;

// Expose messaging functions to window object
window.selectConversation = Messaging.selectConversation;
window.startConversation = Messaging.startConversation;
window.startConversationWithTeacher = Messaging.startConversationWithTeacher;
window.handleMessageKeyPress = Messaging.handleMessageKeyPress;
window.sendMessageFromInput = Messaging.sendMessageFromInput;

// Expose teachers messaging functions to window object
window.renderMessagingWidget = TeachersMessaging.renderMessagingWidget;
window.initializeTeachersMessaging = TeachersMessaging.initializeTeachersMessaging;
window.loadInlineMessagingInterface = TeachersMessaging.loadInlineMessagingInterface;
window.openTeachersMessaging = TeachersMessaging.openTeachersMessaging;
window.markConversationAsRead = TeachersMessaging.markConversationAsRead;

// Expose navigation function
window.showSection = Misc.showSection;

// ============================================================================
// PWA: Service Worker Registration for Progressive Web App
// ============================================================================
// Skip service worker registration if Development Mode is enabled
// Check dev mode from localStorage directly (faster than function call)
function checkDevModeEnabled() {
    const hostname = window.location.hostname;
    const port = window.location.port;
    const isLocal = hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '::1' || port === '5001';
    return isLocal && localStorage.getItem('devMode') === 'true';
}

if ('serviceWorker' in navigator && !checkDevModeEnabled()) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
            .then((registration) => {
                console.log('✅ PWA: Service Worker registered successfully', registration.scope);
                
                // Check for updates periodically
                registration.addEventListener('updatefound', () => {
                    const newWorker = registration.installing;
                    console.log('🔄 PWA: New Service Worker found, installing...');
                    
                    newWorker.addEventListener('statechange', () => {
                        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                            console.log('✅ PWA: New Service Worker installed, refresh to update');
                            // Optionally show a notification to user about update
                        }
                    });
                });
                
                // Check for updates every hour
                setInterval(() => {
                    registration.update();
                }, 3600000);
            })
            .catch((error) => {
                console.error('❌ PWA: Service Worker registration failed:', error);
            });
    });
    
    // Listen for messages from service worker
    navigator.serviceWorker.addEventListener('message', (event) => {
        console.log('📨 PWA: Message from Service Worker:', event.data);
    });
    
    // Handle when app comes back online
    window.addEventListener('online', () => {
        console.log('🌐 PWA: Back online');
    });
    
    // Handle when app goes offline
    window.addEventListener('offline', () => {
        console.log('📵 PWA: You are offline - some features may be limited');
    });
} else if (checkDevModeEnabled()) {
    console.log('🔧 Development Mode: Service Worker disabled - caching turned off');
    // Unregister any existing service workers
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.getRegistrations().then(registrations => {
            registrations.forEach(registration => {
                registration.unregister();
            });
        });
    }
} else {
    console.warn('⚠️ PWA: Service Workers not supported in this browser');
}