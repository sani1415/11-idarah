// Translation data for the Madani Maktab application
const translations = {
    en: {
        // Header
        appTitle: "Madani Maktab",
        appSubtitle: "Student Management System",
        
        // Navigation
        dashboard: "Dashboard",
        registerStudent: "Register Student",
        dailyAttendance: "Daily Attendance",
        reports: "Reports",
        teachersCorner: "Teachers Corner",
        messages: "Messages",
        settings: "Settings",
        
        // Dashboard
        totalStudents: "Total Students",
        presentToday: "Present Today",
        absentToday: "Absent Today",
        attendanceRate: "Attendance Rate",
        todaysAttendance: "Today's Attendance",
        present: "Present",
        absent: "Absent",
        percentage: "Percentage",
        inactiveStudents: "Inactive Students",
        showingInactiveStudentsOnly: "Showing inactive students only. Use Clear Filters to return to the full list.",
        yearSetupNeededTitle: "No students are enrolled in this educational year yet.",
        yearSetupNeededDesc: " Go to Settings → Academic → Year Setup to copy data from the previous year, or register new students.",
        goToYearSetup: "Open Year Setup",
        performanceStudents: "Performance Students",
        studentPerformanceBreakdown: "Student Performance Breakdown",
        studentsWithAbsences: "Students with Absences",
        teacherLogs: "Teacher Logs",
        absenceSummary: "Absence Summary",
        totalStudentsWithAbsences: "Total students with absences",
        noStudentsWithAbsences: "No students with absences found",
        totalAbsences: "Total Absences",
        day: "day",
        days: "days",
        fullPrint: "Full Print",
        customPrint: "Custom Print",
        alerts: "Alerts",
        alertsOverview: "Alerts Overview",
        everythingIsFine: "Everything is working perfectly!",
        close: "Close",
        viewDetails: "View Details",
        classOverallStatus: "Class Overall Status",
        studentLevels: "Student Levels",
        recentClassLog: "Recent Class Log",
        teacherLogbook: "📔 Teacher's Logbook",
        addNewNote: "Add New Note",
        classLog: "Class Log",
        studentLog: "Student Log",
        studentList: "Student List",
        viewAllStudents: "View All Students",
        husnulKhuluk: "Husnul Khuluk",
        markAsActive: "Mark as Active",
        markAsInactive: "Mark as Inactive",
        todayAttendanceOverview: "Today's Attendance Overview",
        noAttendanceData: "No attendance data for today yet.",
        
        // Teachers Corner
        selectClass: "Select Class",
        selectClassFromTeachersCorner: "Please select a class from Teachers Corner.",
        noAlerts: "No alerts. Everything is fine! 🎉",
        noStudentsInClass: "No students in this class.",
        noBooksAddedForClass: "No books have been added for this class.",
        everyoneClassLog: "Everyone (Class Log)",
        noStudentsRegistered: "No students registered yet.",
        noAttendanceDataAvailable: "No attendance data available.",
        present: "Present",
        absent: "Absent",
        absentStudents: "Absent Students:",
        noReasonProvided: "No reason provided",
        
        // Dashboard Alerts and Tables
        institution_alerts: "Institution Alerts",
        class_wise_information: "Class-wise Information",
        loading_class_statistics: "Loading class statistics...",
        class: "Class",
        total: "Total",
        rate: "Rate",
        avg_score: "Avg Score",
        mustaid: "Mustaid",
        mutawassit: "Mutawassit",
        mujtahid: "Mujtahid",
        roll: "Roll",
        name: "Name",
        score: "Husnul Khuluq",
        action: "Action",
        reason: "Reason",
        view_details: "View Details",
        critical_students: "Critical Students",
        low_score_students: "Low Score Students",
        students_have_scores_below: "students have scores below",
        
        // Student Registration
        studentRegistration: "Student Registration",
        studentPhoto: "Student Photo",
        uploadPhoto: "Upload Photo",
        photoUploaded: "Photo uploaded successfully",
        photoUploadError: "Photo upload failed",
        noPhoto: "No photo available",
        allRegisteredStudents: "All Registered Students",
        registerNewStudent: "Register New Student",
        studentName: "Student Name",
        fatherName: "Father's Name",
        rollNumber: "Roll Number",
        address: "Address",
        district: "District",
        subDistrict: "Sub-district (Upazila)",
        mobileNumber: "Mobile Number",
        class: "Class",
        uniqueId: "Unique ID Number",
        selectClass: "Select Class",
        registerStudentBtn: "Register Student",
        required: "*",
        rollno: "Roll No",
        fullname: "Full Name",
        mobile: "Mobile",
        actions: "Actions",
        
        // Daily Attendance
        dailyAttendanceTitle: "Daily Attendance",
        present: "Present",
        absent: "Absent",
        holiday: "Holiday",
        clear: "Clear",
        date: "Date:",
        filterByClass: "Filter by Class:",
        allClasses: "All Classes",
        markAllPresent: "Mark All Present",
        markAllAbsent: "Mark All Absent", 
        markAllHoliday: "Mark All Holiday",
        markAllNeutral: "Mark All Neutral",
        copyPreviousDay: "Copy Previous Day",
        saveAttendance: "Save Attendance",
        students: "students",
        progress: "Progress",
        logbook: "Logbook",
        exams: "Exams",
        pleaseSelectDate: "Please select a date.",
        noStudentsFound: "No students found for the selected criteria.",
        noStudentsFoundRegister: "No students found. Please register students first.",
        reasonForAbsence: "Reason for absence",
        
        // Reports
        attendanceReports: "Attendance Reports",
        fromDate: "From Date:",
        toDate: "To Date:",
        to: "to",
        generateReport: "Generate Report",
        fromBeginningReport: "From Beginning Report",
        fromBeginningReportDesc: "Generate report from academic year start to today",
        showAttendanceTrackingCalendar: "Show Attendance Tracking Calendar",
        viewAttendanceStatistics: "View Attendance Statistics",
        selectDateRangeToGenerate: "Select date range to generate report",
        attendanceReport: "Attendance Report",
        period: "Period:",
        studentNameCol: "Student Name",
        classCol: "Class",
        idNumberCol: "ID Number",
        presentDays: "Present Days",
        absentDays: "Absent Days",
        attendancePercent: "Attendance %",
        clickToViewDetails: "Click to view details",
        noAbsentDays: "No absent days in this period",
        totalAbsentDays: "Total Absent Days",
        reason: "Reason",
        cannotTakeAttendanceForFutureDate: "Cannot take attendance for future dates. Please select today's date or a past date.",
        selectDateRange: "Select date range and click \"Generate Report\" to view attendance data.",
        selectBothDates: "Please select both start and end dates.",
        startDateAfterEnd: "Start date cannot be after end date.",
        noAcademicYearSet: "No academic year start date set. Please set it in Settings first.",
        
        // Settings
        settingsTitle: "Settings",
        general: "General",
        academic: "Academic", 
        bookManagement: "Book Management",
        alerts: "Alerts",
        dataManagement: "Data Management",
        userManagement: "User Management",
        welcome: "Welcome",
        logout: "Logout",
        hijriDateAdjustment: "Hijri Date Adjustment",
        hijriDateAdjustmentDesc: "Adjust the calculated Hijri date for local moon sightings.",
        day: "Day",
        behind: "Behind",
        ahead: "Ahead",
        currentDatePreview: "Current Date Preview:",
        gregorian: "Gregorian:",
        hijri: "Hijri:",
        academicYearSettings: "Academic Year Settings",
        academicYearStartDate: "Academic Year Start Date",
        academicYearStartDateDesc: "Select the starting date for your academic year",
        setAcademicYearStartBtn: "Set Academic Year Start",
        clearAcademicYearStartBtn: "Clear",
        selectAcademicYearStart: "Please select the academic year start date.",
        academicYearStartUpdated: "Academic year start date updated successfully.",
        academicYearStartCleared: "Academic year start date cleared successfully. All date restrictions have been removed.",
        confirmClearAcademicYear: "Are you sure you want to clear the academic year start date? This will remove all date restrictions.",
        fromActiveEducationalYear: "From active educational year",
        confirmAction: "Are you sure?",
        dateRestrictionNotice: "Date selection is restricted to academic year period",
        dateRestrictionNoticeFrom: "Date selection is restricted to academic year period (from {date})",
        beforeAcademicYear: "Before Academic Year",
        
        // Educational Year Management
        educationalYearManagement: "Educational Year Management",
        educationalYearManagementDesc: "Create and manage educational years for organizing exams and academic periods.",
        educationalYearName: "Educational Year Name",
        educationalYearNamePlaceholder: "Educational Year Name (e.g., 2024-2025)",
        educationalYearStartDate: "Start Date",
        educationalYearEndDate: "End Date",
        educationalYearStatus: "Status",
        educationalYearActive: "Active",
        educationalYearInactive: "Inactive",
        addEducationalYear: "Add Educational Year",
        editEducationalYear: "Edit Educational Year",
        deleteEducationalYear: "Delete Educational Year",
        archiveEducationalYear: "Archive Educational Year",
        confirmArchiveEducationalYear: "Are you sure you want to archive the educational year \"{name}\"? It will be hidden from the list but data is kept.",
        educationalYearArchived: "Educational year archived successfully",
        educationalYearCreated: "Educational year created successfully",
        educationalYearUpdated: "Educational year updated successfully",
        currentEducationalYears: "Current Educational Years",
        archivedEducationalYears: "Archived Educational Years",
        archivedEducationalYearsHelp: "Archived years stay hidden from normal selectors, but you can still rename them here to free up an old name for reuse.",
        noCurrentEducationalYears: "No active or inactive educational years available.",
        noArchivedEducationalYears: "No archived educational years.",
        setActiveEducationalYear: "Set Active Educational Year",
        educationalYearNotFound: "Educational year not found",
        educationalYearNameCannotBeEmpty: "Educational year name cannot be empty",
        educationalYearDatesCouldNotBeParsed: "Could not parse the existing educational year dates.",
        startDateCannotBeEmpty: "Start date cannot be empty",
        endDateCannotBeEmpty: "End date cannot be empty",
        noEducationalYearChangesDetected: "No changes detected for this educational year.",
        educationalYearRequiredFields: "Name, start date, and end date are required",
        shouldEducationalYearBeActive: "Should this educational year be active?",
        currentStatus: "Current status:",
        clickOkForActiveCancelForInactive: "Click OK for Active, Cancel for Inactive.",
        activeEducationalYearChanged: "Active educational year changed to \"{name}\". Reloading to refresh all year-based data...",
        failedToSetActiveEducationalYear: "Failed to set active educational year",
        failedToArchiveEducationalYear: "Failed to archive educational year",
        educationalYearAlreadyActive: "This educational year is already active.",
        educationalYearDeleted: "Educational year deleted successfully",
        educationalYearNameRequired: "Please enter educational year name",
        educationalYearStartDateRequired: "Please select start date",
        educationalYearEndDateRequired: "Please select end date",
        educationalYearEndDateAfterStart: "End date must be after start date",
        educationalYearNameExists: "Educational year with this name already exists",
        educationalYearHasExams: "Cannot delete educational year that has associated exams",
        confirmDeleteEducationalYear: "Are you sure you want to delete this educational year?",
        educationalYearFilter: "Educational Year",
        selectEducationalYear: "Please select an educational year",
        selectValidEducationalYear: "Please select a valid educational year",
        
        hijriSettings: "Hijri Date Settings",
        hijriAdjustment: "Hijri Date Adjustment",
        hijriAdjustmentDesc: "Adjust Hijri date for local observation",
        hijriNoAdjustment: "No Adjustment (Default)",
        hijriPlusOne: "+1 Day (Ahead)",
        hijriMinusOne: "-1 Day (Behind)",
        academicManagement: "Academic Management",
        academicWorkspaceDescription: "Organize year control, setup, promotion, and class management from focused academic workspaces.",
        academicOverview: "Academic Overview",
        academicOverviewHelp: "See the active year, coverage status, and setup readiness before opening a detailed workspace.",
        usedForReportsAndDateRestrictions: "Used for reports and date restrictions.",
        setStartDate: "Set Start Date",
        currentAcademicYearStartsFrom: "Current academic year starts from:",
        activeEducationalYearOverridesLegacyDate: "When an active educational year is set, its start date is used for reports and date restrictions. Otherwise the date above is used.",
        overview: "Overview",
        yearSetupWorkspace: "Year Setup",
        quickActions: "Quick Actions",
        academicQuickActionsHelp: "Jump directly to the academic workspace you need instead of scrolling through one long page.",
        manageYears: "Manage Years",
        openYearSetup: "Open Year Setup",
        openPromotionWorkspace: "Open Promotion",
        coverageStatus: "Coverage Status",
        setupReadiness: "Setup Readiness",
        coverageGood: "Today is covered by the active educational year.",
        coverageNeedsAttention: "Review the active year dates before entering new academic data.",
        yearSetupCountsHelp: "Enrollments / class books / teacher assignments loaded for the active year.",
        setupItemsLoaded: "Total year-setup records currently loaded.",
        setupNeedsActiveYear: "Select an active educational year to load year setup data.",
        noActiveYearShort: "No active year",
        notReady: "Not ready",
        activeEducationalYearLabel: "Active Educational Year",
        chooseActiveEducationalYearHelp: "Choose which educational year the application should use for year-based data entry and reports.",
        setActiveYear: "Set Active Year",
        noActiveEducationalYearSelected: "No active educational year selected.",
        copySetupFromPreviousYear: "Copy Setup From Previous Year",
        copySetupFromPreviousYearHelp: "Copy student enrollments, class books, and teacher assignments into the currently active educational year.",
        copySetupRiskNotice: "If the target year already contains setup data, the system will stop and ask for typed confirmation before anything is overwritten.",
        selectSourceYear: "Select source year",
        copySetup: "Copy Setup",
        copySetupInitialConfirm: "Copy enrollments, class books, and teacher assignments from \"{source}\" into \"{target}\"?",
        copySetupWarningIntro: "The target year \"{target}\" already contains setup data. Review the counts below before copying from \"{source}\".",
        copySetupSuccess: "Setup copied successfully.",
        copyUpdatedExistingEnrollments: "Updated existing enrollments",
        copyInsertedNewEnrollments: "Inserted new enrollments",
        yearEndPromotion: "Year-end Promotion",
        yearEndPromotionHelp: "Promote students from a source year into a target year. Choose source and target years, load enrollments, set each student's action (Promote, Repeat, Pass out, Transfer, Inactive), then run. Source and target must be different.",
        promotionWorkflowHelp: "Select source and target years, pick a class, then bulk-transfer all its students. Override exceptions (repeat, pass out, inactive) per student if needed.",
        promotionSafetyNotice: "Promotion now validates the full request before writing anything, so stale or mismatched decisions are blocked early.",
        sourceYear: "Source year",
        targetYear: "Target year",
        loadEnrollments: "Load Enrollments",
        loadStudents: "Load Students",
        runPromotion: "Run Transfer",
        runPromotionConfirm: "Run promotion for {count} student(s) from \"{source}\" to \"{target}\"? Invalid or stale decisions will be blocked before any changes are written.",
        studentLabel: "Student",
        actionLabel: "Action",
        targetClass: "Target class",
        bulkClassTransfer: "Bulk Class Transfer",
        bulkClassTransferHelp: "Pick a source class and a destination class, load students, then run. Override individual exceptions if needed.",
        selectSourceClass: "Select source class",
        selectTargetClass: "Select target class",
        studentsInClass: "Students in Class",
        exceptionAction: "Exception",
        transferToTarget: "Transfer (to target)",
        repeat: "Repeat same class",
        passOut: "Pass out",
        inactive: "Inactive",
        promotionResultRollEdit: "Transfer Done",
        promotionResultRollEditHelp: "Transfer completed successfully.",
        assignRollsBeforeTransfer: "Assign new roll numbers before running the transfer. Duplicates are highlighted in red.",
        duplicateRollsBlocked: "Duplicate roll numbers detected — fix them before running.",
        newRoll: "New Roll",
        enterRoll: "Enter roll",
        transferComplete: "Transfer complete!",
        transferred: "Transferred",
        repeated: "Repeated",
        passedOut: "Passed out",
        inactived: "Inactive",
        purgeSampleYear: "Purge Sample Year",
        purgeSampleYearHelp: "Use Purge Sample Year only for practice or sample years. The system will show affected record counts and require typed confirmation.",
        purgeSampleYearWarningIntro: "You are about to purge year-scoped data for \"{name}\".",
        failedToPurgeSampleYear: "Failed to purge sample year",
        targetYearCurrentData: "Target year currently contains:",
        typeConfirmationPhrase: "Type this confirmation phrase exactly to continue:",
        purgeWillRemoveCounts: "This purge will remove:",
        purgeRemovedCounts: "Removed records:",
        purgeDeletedYearRecord: "The year record was hard-deleted because it became empty.",
        purgeArchivedYearRecord: "The year record was archived because it could not be hard-deleted safely.",
        confirmationTextMismatch: "Confirmation text did not match.",
        yearSetupEnrollmentsLabel: "Enrollments",
        yearSetupClassBooksLabel: "Class books",
        yearSetupTeacherAssignmentsLabel: "Teacher assignments",
        educationProgressHistoryLabel: "Education progress history",
        educationProgressLabel: "Education progress",
        scoreChangeHistoryLabel: "Score change history",
        teacherLogsLabel: "Teacher logs",
        examResultsLabel: "Exam results",
        examSessionsLabel: "Exam sessions",
        promotionHistoryLabel: "Promotion history",
        studentEnrollmentsForActiveYear: "Student Enrollments For Active Year",
        studentEnrollmentsForActiveYearHelp: "Master students stay shared. Use this area to decide which students belong to which class in the currently active year.",
        selectStudent: "Select student",
        rollNumberPlaceholder: "Roll number",
        passedOut: "Passed Out",
        saveEnrollment: "Save Enrollment",
        rollAssignment: "Roll Assignment",
        rollAssignmentHelp: "View and edit roll numbers for each enrolled student. Duplicate rolls are blocked automatically.",
        noEnrollmentsForActiveYear: "No enrollments found for the active year.",
        rollNumberRequired: "Roll number cannot be empty.",
        selectOrCreateActiveYearToManageEnrollments: "Select or create an active educational year to manage enrollments.",
        classBooksForActiveYear: "Class Books For Active Year",
        classBooksForActiveYearHelp: "Choose which books are used by each class for the active educational year. Removing a row here only affects this year.",
        selectBook: "Select book",
        orderPlaceholder: "Order",
        saveBookLink: "Save Book Link",
        noClassBookSetupLoadedYet: "No class-book setup loaded for the active year yet.",
        teacherAssignmentsForActiveYear: "Teacher Assignments For Active Year",
        teacherAssignmentsForActiveYearHelp: "Assign teachers to classes for the active educational year only.",
        selectTeacherUser: "Select teacher/user",
        saveAssignment: "Save Assignment",
        noTeacherAssignmentsLoadedYet: "No teacher assignments loaded for the active year yet.",
        addOrRemoveClassesHelp: "Add or remove classes from the system.",
        allClassesLabelText: "All Classes",
        addBooksStudentsWillStudyHelp: "Add books that students will study.",
        enterNewBookName: "Enter new book name",
        applicationSettings: "Application Settings",
        generalWorkspaceTitle: "General Workspace",
        generalWorkspaceDescription: "Manage application branding, development behavior, and Hijri date preferences from two focused cards.",
        brandingAndExperienceHelp: "Control the app name, home-screen short name, and local development experience.",
        calendarControlHelp: "Adjust Hijri date behavior for local usage and verify the current preview instantly.",
        applicationName: "Application Name",
        save: "Save",
        appNamePlaceholder: "Enter application name",
        appNameDescription: "Change the name displayed in the header and title.",
        updateAppNameBtn: "Update Name",
        enterAppName: "Please enter an application name.",
        appNameUpdated: "Application name updated successfully.",
        pleaseFillAllFields: "Please fill in all fields",
        startDateMustBeBeforeEndDate: "Start date must be before end date",
        failedToCreateEducationalYear: "Failed to create educational year",
        failedToUpdateEducationalYear: "Failed to update educational year",
        shortNamePwaDisplay: "Short Name (PWA Display)",
        shortNameDescription: "Short name for Android home screen (max 20 characters). Leave empty to auto-generate from full name.",
        shortNamePlaceholder: "Enter short name (optional)",
        saveShortNameBtn: "Save Short Name",
        shortNameSaved: "Short name \"{name}\" saved successfully",
        shortNameCleared: "Short name cleared - will auto-generate from full name",
        failedToSaveShortName: "Failed to save short name",
        developmentMode: "Development Mode",
        developmentModeDescription: "Disable caching to see code changes instantly. Only works on localhost. Your MySQL database will work normally.",
        enableDevelopmentModeNoCaching: "Enable Development Mode (No Caching)",
        developmentModeEnabledMessage: "Caching disabled. Refresh page to see changes instantly.",
        developmentModeOnStatus: "Development Mode: ON - Caching disabled, changes visible instantly",
        developmentModeOffStatus: "Development Mode: OFF - Normal caching enabled",
        manageClasses: "Manage Classes",
        addBook: "Add Book",
        bookLibrary: "Book Library",
        bookLibraryHelp: "Review all books by class and use the existing actions to edit or delete items when needed.",
        booksWorkspaceDescription: "Add new books and manage the full book library from one focused workspace.",
        alertSystemSettings: "Alert System Settings",
        alertWorkspaceDescription: "Configure all alert thresholds together and save them as one shared alert policy.",
        systemAlerts: "System Alerts",
        alertsThresholdGroupHelp: "These thresholds work together. Update all three levels, then save once.",
        lowScoreAlertThreshold: "Low Score Alert Threshold",
        lowScoreAlertThresholdHelp: "Set the minimum score below which students will be flagged in dashboard alerts.",
        criticalScoreAlertThreshold: "Critical Score Alert Threshold",
        criticalScoreAlertThresholdHelp: "Set the critical score below which students will be flagged with higher urgency.",
        lowClassAverageThresholdLabel: "Low Class Average Threshold",
        lowClassAverageThresholdHelp: "Set the minimum class average score below which the whole class will be flagged.",
        saveAlertThresholds: "Save Alert Thresholds",
        enterNewClassName: "Enter new class name",
        enterClassName: "Please enter a class name.",
        addClass: "Add Class",
        delete: "Delete",
        reset: "Reset",
        backupAndExport: "Backup & Export",
        backupAndExportHelp: "Use these actions for safer data operations before running major resets or imports.",
        exportAllData: "Export All Data",
        exportAllDataHelp: "Download student data in a reusable CSV format.",
        importWorkspace: "Import",
        importWorkspaceHelp: "Use the guided bulk import workflow for CSV-based student imports.",
        bulkImportStudents: "Bulk Import Students",
        bulkImportStudentsHelp: "Open the import guide, file format instructions, and upload workflow.",
        resetWorkspace: "Reset",
        resetWorkspaceHelp: "These actions are destructive. Review carefully before opening a reset flow.",
        dataWorkspaceDescription: "Separate safe export tasks, import flows, and destructive resets into focused workspaces.",
        studentDataCategory: "Student Data",
        deleteAllStudents: "Delete All Students",
        deleteAllStudentsHelp: "Permanently delete all student information, attendance, scores, and progress.",
        resetAllScores: "Reset All Scores",
        resetAllScoresHelp: "Clear all student scores back to their default values.",
        resetEducationProgress: "Reset Education Progress",
        resetEducationProgressHelp: "Delete all education progress records.",
        attendanceDataCategory: "Attendance Data",
        resetAttendanceHistoryHelp: "Clear all attendance records.",
        academicDataCategory: "Academic Data",
        resetAllBooks: "Reset All Books",
        resetAllBooksHelp: "Delete all books and their progress records.",
        resetTeacherLogs: "Reset Teacher Logs",
        resetTeacherLogsHelp: "Delete all teacher logbook entries.",
        systemDataCategory: "System Data",
        resetAllUsers: "Reset All Users",
        resetAllUsersHelp: "Delete all user accounts except the current admin.",
        resetSettingsHelp: "Reset all application settings to their default values.",
        completeResetDangerHelp: "This will delete all data and reset the entire application to its initial state. This action cannot be undone.",
        userAccountManagement: "User Account Management",
        usersWorkspaceDescription: "Separate user-directory work from your own account and password controls.",
        userDirectory: "User Directory",
        userDirectoryHelp: "Create, refresh, and manage system users from one directory view.",
        myAccount: "My Account",
        createNewUser: "Create New User",
        refreshList: "Refresh List",
        changeAdminPassword: "Change Admin Password",
        changeAdminPasswordHelp: "Update your admin account password for security.",
        currentPasswordLabel: "Current Password",
        newPasswordLabel: "New Password",
        confirmNewPasswordLabel: "Confirm New Password",
        changePasswordBtn: "Change Password",
        accountInformation: "Account Information",
        accountInformationHelp: "Review your current account details here.",
        usernameLabel: "Username:",
        roleLabelSimple: "Role:",
        lastLoginLabelSimple: "Last Login:",
        accountCreatedLabel: "Account Created:",
        noClassesAdded: "No classes added yet.",
        confirmDeleteClass: "Are you sure you want to delete the class",
        cannotUndo: "This action cannot be undone.",
        confirmDeleteClassFinal: "Are you absolutely sure you want to delete the class",
        finalDeleteClassWarning: "This will also delete all students in this class and their attendance records. This action is permanent and cannot be undone.",
        classExists: "This class already exists.",
        classAdded: "class has been added successfully.",
        classDeleted: "class has been deleted successfully.",
        promotionOrder: "Order",
        promotionOrderHelp: "Promotion sequence (1 = first class, 2 = second, etc.)",
        promotionOrderInvalid: "Enter a number 1 or greater.",
        promotionOrderSaved: "Promotion order saved.",
        failedToSave: "Failed to save.",
        editClassPrompt: "Enter the new name for \"{name}\":",
        editClassTitle: "Edit Class",
        deleteClassTitle: "Delete Class",
        confirmDeleteClassWithStudents: "Are you sure you want to delete \"{name}\"? This will remove the class from all associated students.",

        // Education
        EducationProgressTracking: "Education Progress Tracking",
        bookProgressManagement: "Book Progress Management",
        addNewBook: "Add New Book",
        deleteAllData: "Delete All Data",
        addNewBookProgress: "Add New Book Progress",
        backToList: "Back to List",
        bookClass: "Class",
        bookSubject: "Subject",
        bookName: "Book Name",
        totalPages: "Total Pages",
        completedPages: "Completed Pages",
        bookNotes: "Notes",
        saveBookProgress: "Save Book Progress",
        editBookDetails: "Edit Book Details",
        noBooksAddedYet: "No books added yet. Click \"Add New Book\" to get started.",
        editDetails: "Edit Details",
        updateProgress: "Update Progress",
        deleteBook: "Delete",
        confirmDeleteBook: "Are you sure you want to delete",
        bookDeletedSuccessfully: "Book progress deleted successfully!",
        failedToDeleteBook: "Failed to delete book progress",
        deleteAllEducationData: "Delete All Education Data",
        deleteAllEducationWarning: "This action will permanently delete all education progress data including:",
        yesDeleteAllData: "Yes, Delete All Data",
        allEducationDataDeleted: "All education data has been deleted successfully!",
        failedToDeleteAllEducation: "Failed to delete all education data",
        
        // Common buttons and actions
        ok: "OK",
        save: "Save",
        cancel: "Cancel",
        edit: "Edit",
        add: "Add",
        
        // Messages
        success: "Success",
        error: "Error",
        info: "Info",
        fillAllFields: "Please fill in all required fields.",
        duplicateId: "A student with this ID number already exists.",
        duplicateRollNumber: "A student with this roll number already exists.",
        studentRegistered: "has been registered successfully.",
        attendanceSaved: "Attendance has been saved successfully.",
        
        // Bulk Actions
        markAllPresent: "Mark All Present",
        markAllAbsent: "Mark All Absent",
        copyPreviousDay: "Copy Previous Day",
        studentsShown: "students shown",
        bulkAbsentTitle: "Mark All Students Absent",
        bulkAbsentReason: "Reason for absence (applies to all students):",
        bulkAbsentPlaceholder: "e.g., School holiday, Strike, etc.",
        bulkAbsentConfirm: "Mark All Absent",
        cancel: "Cancel",
        pleaseProvideReason: "Please provide a reason for the absence",
        confirmMarkAllHoliday: "Are you sure you want to mark all filtered students as holiday?",
        studentsMarkedPresent: "students marked as present",
        studentsMarkedAbsent: "students marked as absent",
        studentsMarkedHoliday: "students marked as holiday",
        studentsMarkedNeutral: "students cleared to neutral",
        markAllNeutral: "Clear All",
        noAttendanceDataFound: "No attendance data found for",
        attendanceCopiedFrom: "Attendance copied from",
        
        // Student Detail
        studentDetails: "Student Details",
        backToReports: "Back to Attendance",
        
        // Holiday Management
        holidayManagement: "Holiday Management",
        addHoliday: "Add Holiday",
        holidayDate: "Holiday Date",
        holidayStartDate: "From Date",
        holidayEndDate: "To Date",
        holidayName: "Holiday Name",
        studentManagement: "Student Management",
        
        // Dashboard Labels
        totalStudentsLabel: "Total Students",
        presentLabel: "Present",
        absentLabel: "Absent",
        classWiseInformation: "Class-wise Information",
        personalInformation: "Personal Information",
        contactInformation: "Contact Information",
        academicInformation: "Academic Information",
        attendanceSummary: "Attendance Summary",
        totalPresent: "Total Present",
        totalAbsent: "Total Absent",
        attendanceRate: "Attendance Rate",
        totalDays: "Total Days",
        recentAttendance: "Recent Attendance (Last 30 Days)",
        attendanceCalendar: "Attendance Calendar",
        registrationDate: "Registration Date",
        studentNotFound: "Student not found",
        attendanceLabel: "Attendance",
        backToRegistration: "Back to Registration",
        failedToFetchStudent: "Failed to fetch student details. Please try again.",
        networkError: "Network error. Please check your internet connection and try again.",
        
        // Student List and Management
        rollNo: "Roll No.",
        fullName: "Full Name",
        actions: "Actions",
        allRegisteredStudents: "All Registered Students",
        registerNewStudent: "Register New Student",
        bulkImport: "Bulk Import",
        editStudent: "Edit Student",
        updateStudent: "Update Student",
        deleteStudent: "Delete Student",
        noStudentsRegisteredYet: "No students registered yet. Click \"Register New Student\" to add students.",
        backToList: "Back to List",
        leaveDays: "Leave Days",
        
        // Report Table Headers
        roll: "Roll",
        name: "Name",
        rate: "Rate",
        
        // Confirmation Messages
        confirmDeleteStudent: "Are you sure you want to delete",
        actionCannotBeUndone: "This action cannot be undone.",
        confirmDeleteStudentFinal: "Are you absolutely sure you want to delete this student?",
        finalDeleteWarning: "This action is permanent and cannot be undone. All attendance records for this student will also be deleted.",
        deleteAllStudents: "Delete All Students",
        confirmDeleteAllStudents: "Are you sure you want to delete ALL students?",
        confirmDeleteAllStudentsFinal: "Are you absolutely sure you want to delete ALL students?",
        finalDeleteAllWarning: "This will permanently delete ALL students and their attendance records. This action is irreversible and will completely reset your student database.",
        
        // Reset Attendance
        dataManagement: "Data Management",
        dangerZone: "Danger Zone",
        dangerZoneWarning: "These actions cannot be undone. Please be careful.",
        resetAttendanceHistory: "Reset Attendance History",
        resetAttendanceDescription: "This will permanently delete all attendance records for all students. This action cannot be undone!",
        resetAllAttendance: "Reset All Attendance",
        resetAttendanceConfirm: "This will permanently delete all attendance records for all students. This action cannot be undone!",
        resetAttendanceWarning: "Warning: This action cannot be undone!",
        resetAttendanceList: "This will permanently delete:",
        resetAttendanceListItem1: "All attendance records for all students",
        resetAttendanceListItem2: "All saved attendance dates",
        resetAttendanceListItem3: "All attendance history from the calendar",
        typeResetToConfirm: "Type RESET to confirm:",
        typeResetPlaceholder: "Type RESET to confirm",
        attendanceResetSuccess: "All attendance history has been reset successfully.",
        attendanceResetFailed: "Failed to reset attendance. Please try again.",
        attendanceResetPleaseTypeReset: "Please type \"RESET\" to confirm the action.",
        clearAllFilters: "Clear all filters",
        searchRoll: "Search roll...",
        searchName: "Search name...",
        searchMobile: "Search mobile...",
        
        // Mobile Table Headers (for responsive)
        mobile: "Mobile",
        
        // Missing Error/Success Messages
        cannotSaveAttendanceOnHolidays: "Cannot save attendance on holidays",
        cannotMarkAttendanceOnHolidays: "Cannot mark attendance on holidays", 
        failedToSaveAttendance: "Failed to save attendance. Please try again.",
        checkConnection: "Check your internet connection and try again.",
        noAttendanceDataForPreviousDay: "No attendance data available for the previous day.",
        successfullyCopiedAttendance: "Successfully copied attendance from the previous day.",
        attendanceSavedSuccessfully: "Attendance saved successfully!",
        attendanceCatchUpRequired: "Attendance catch-up required",
        attendanceCatchUpDescription: "Complete and save each missing date one by one until you reach today.",
        attendanceCatchUpNextDate: "Current required date:",
        attendanceCatchUpRemaining: "Remaining missing dates:",
        attendanceCatchUpCompleted: "Attendance catch-up completed. The app is now unlocked.",
        attendanceCatchUpReminder: "You have missing attendance for some past days. You can fill them from the Attendance section when convenient.",
        attendanceMustMarkAllStudents: "You must mark every student before this date can be saved.",
        attendanceIncompleteStudents: "Students still empty:",
        andMoreStudents: "and more:",
        studentsConfirmedPresent: "students confirmed present",
        studentsMarkedPresent: "students marked as present",
        studentsMarkedAbsent: "students marked as absent",
        studentsMarkedHoliday: "students marked as holiday",
        rememberToSaveAttendance: "Remember to save attendance after making changes!",
        selectDateRangeToGenerate: "Select date range and click \"Generate Report\" to view attendance data.",
        showAttendanceTrackingCalendar: "Show Attendance Tracking Calendar",
        viewAttendanceStatistics: "View which days attendance was taken vs missed this month with summary statistics",
        hideAttendanceTrackingCalendar: "Hide Attendance Tracking Calendar",
        stickyAttendanceApplied: "Sticky attendance applied!",
        stillAbsentFromLastTime: "still absent from last time. Change any student's status as needed.",
        allStudentsPresent: "All students present. Change any student's status as needed.",
        present: "present",
        absent: "absent",
        total: "total",
        
        // Student Detail Summary Options
        last30Days: "Last 30 Days",
        fromBeginning: "From Beginning",
        summaryPeriod: "Summary Period",
        
        // Attendance Status
        notSet: "Not Set",
        neutral: "Not Set",
        
        // Missing Modal Messages
        pleaseEnterClassName: "Please enter a class name",
        classAddedSuccessfully: "class added successfully",
        failedToAddClass: "Failed to add class",
        networkErrorOccurred: "A network error occurred",
        classDeletedSuccessfully: "class deleted successfully",
        failedToDeleteClass: "Failed to delete class",
        classUpdatedSuccessfully: "Class updated successfully",
        failedToUpdateClass: "Failed to update class",
        pleaseEnterHolidayStartDateAndName: "Please enter holiday start date and name",
        startDateCannotBeAfterEndDate: "Start date cannot be after end date",
        holidayDatesConflictWithExisting: "Holiday dates conflict with existing holiday:",
        holidayAddedSuccessfully: "Holiday added successfully",
        failedToAddHoliday: "Failed to add holiday:",
        holidayNotFound: "Holiday not found",
        holidayDeletedSuccessfully: "Holiday deleted successfully",
        failedToDeleteHoliday: "Failed to delete holiday:",
        pleaseEnterBookName: "Please enter a book name",
        pleaseEnterValidNumberOfTotalPages: "Please enter a valid number of total pages",
        bookAddedSuccessfully: "Book added successfully",
        failedToAddBook: "Failed to add book",
        bookUpdatedSuccessfully: "Book updated successfully",
        failedToUpdateBook: "Failed to update book",
        bookDeletedSuccessfully: "Book deleted successfully",
        failedToDeleteBook: "Failed to delete book",
        confirmDeleteBookFull: "Are you sure you want to delete this book? This action cannot be undone.",
        pleaseSelectAcademicYearStartDate: "Please select an academic year start date",
        academicYearStartDateUpdatedSuccessfully: "Academic year start date updated successfully",
        academicYearStartDateSavedLocally: "Academic year start date saved locally",
        academicYearStartDateClearedSuccessfully: "Academic year start date cleared successfully",
        academicYearStartDateClearedLocally: "Academic year start date cleared locally",
        pleaseEnterAppName: "Please enter an app name",
        appNameUpdatedSuccessfully: "App name updated successfully",
        appNameSavedLocally: "App name saved locally",
        failedToLoadUsers: "Failed to load users",
        userNotFound: "User not found",
        failedToCreateUser: "Failed to create user",
        failedToUpdateUser: "Failed to update user",
        failedToDeleteUser: "Failed to delete user",
        passwordMustBeAtLeast4Characters: "Password must be at least 4 characters long",
        failedToResetPassword: "Failed to reset password",
        noUsersFound: "No users found.",
        never: "Never",
        active: "Active",
        inactive: "Inactive",
        allClassesLabel: "All Classes",
        roleLabel: "Role",
        classLabel: "Class",
        statusLabel: "Status",
        lastLoginLabel: "Last Login",
        editPermissions: "Edit Permissions",
        permissions: "Permissions",
        editUserTitle: "Edit User",
        deleteUserTitle: "Delete User",
        confirmDeleteUser: "Are you sure you want to delete user \"{username}\"? This action cannot be undone.",
        enterNewPasswordForUser: "Enter new password for user \"{username}\":",
        withPermissionsSuffix: " with {name} permissions",
        alertThresholdsSavedSuccessfully: "Alert thresholds saved successfully!",
        alertThresholdsSavedLocally: "Alert thresholds saved locally!",
        
        // Missing Text Content
        notSet: "Not set",
        na: "N/A",
        hideDetails: "Hide Details",
        viewDetails: "View Details",
        saveChanges: "Save Changes*",
        never: "Never",
        unknown: "Unknown",
        noClassAssigned: "No class assigned",
        noClassesAvailable: "No classes available",
        noClassesAddedYet: "No classes added yet",
        noHolidaysConfigured: "No holidays configured.",
        noBooksAddedYetAddFirst: "No books added yet. Add your first book above.",
        selectBook: "Select Book",
        noUsersFound: "No users found.",
        noAlertsEverythingFine: "No alerts. Everything is fine! 🎉",
        noStudentsInThisClass: "No students in this class.",
        noBooksAddedForThisClass: "No books added for this class.",
        
        // Missing Placeholders
        enterRollNumberPlaceholder: "Enter roll number (e.g., 101, 201)",
        enterNewClassNamePlaceholder: "Enter new class name",
        holidayNamePlaceholder: "Holiday Name (e.g., Eid-ul-Fitr)",
        enterNewBookNamePlaceholder: "Enter new book name",
        totalPagesPlaceholder: "Total pages",
        enterCurrentPasswordPlaceholder: "Enter current password",
        enterNewPasswordPlaceholder: "Enter new password",
        confirmNewPasswordPlaceholder: "Confirm new password",
        writeNotesHerePlaceholder: "Write notes here...",
        writeProgressNotesPlaceholder: "Write progress notes...",
        writeScoreChangeReasonPlaceholder: "Write reason for score change...",
        schoolHolidayStrikePlaceholder: "e.g., School holiday, Strike, etc.",
        typeResetToConfirmPlaceholder: "Type RESET to confirm",
        enterTotalPagesPlaceholder: "Enter total pages",
        
        // Missing Alert Messages
        pleaseProvideReasonForAbsence: "Please provide a reason for {name}'s absence before saving.",
        pleaseProvideAbsenceReasonsFor: "Please provide absence reasons for:",
        pleaseSelectValidCsvFile: "Please select a valid CSV file. Save your Excel file as CSV first.",
        pleaseSelectCsvFileFirst: "Please select a CSV file first",
        noStudentDataFoundInCsv: "No student data found in the CSV file. Please check the format.",
        uploadFailed: "Upload Failed",
        importError: "Import Error",
        networkErrorDuringUpload: "Could not connect to the server.",
        csvDownloaded: "CSV Downloaded",
        selectedLabel: "Selected:",
        clickToSelectDifferentFile: "Click to select a different file",
        clickToSelectCsvFile: "Click to select CSV file",
        supportsCsvFilesExcelSavedAsCsv: "Supports .csv files (Excel saved as CSV)",
        importError: "Import Error",
        processingCsvFile: "Processing CSV File...",
        preparingToReadFile: "Preparing to read file...",
        readingCsvFile: "Reading CSV file...",
        parsingCsvData: "Parsing CSV data...",
        csvNeedsHeaderAndDataRow: "CSV file must have at least a header row and one data row",
        missingRequiredHeaders: "Missing required headers: {headers}. Please check your CSV format.",
        errorParsingCsvFile: "Error parsing CSV file: {error}",
        errorReadingFile: "Error reading file. Please make sure the file is not corrupted and try again.",
        uploadingStudentsForValidation: "Uploading {count} students for validation...",
        importComplete: "Import complete!",
        pleaseAddClassesBeforeUploading: "Please add them in Settings before uploading.",
        unknownErrorOccurred: "An unknown error occurred.",
        successfullyImported: "Successfully Imported",
        failed: "Failed",
        updated: "Updated",
        duplicateRollNumbers: "Duplicate Roll Numbers",
        importResults: "Import Results",
        backToDataManagement: "Back to Data Management",
        importAnotherFile: "Import Another File",
        encodingError: "Encoding Error",
        bengaliUnicodeIssueDetected: "Bengali/Unicode Text Issue Detected:",
        solution: "Solution:",
        saveExcelAsCsvUtf8: "Save your Excel file as \"CSV UTF-8 (Comma delimited) (*.csv)\" format",
        steps: "Steps:",
        openYourExcelFile: "Open your Excel file",
        goToFileSaveAs: "Go to File -> Save As",
        chooseCsvUtf8Format: "Choose \"CSV UTF-8 (Comma delimited) (*.csv)\"",
        saveAndTryUploadingAgain: "Save and try uploading again",
        hijriDateAdjustmentUpdatedSuccessfully: "Hijri date adjustment updated successfully",
        pleaseSelectBothStartAndEndDate: "Please select both a start and end date.",
        failedToLoadAttendanceCalendar: "Failed to load attendance calendar. Please try again.",
        rollNumberAlreadyExists: "Roll number {rollNumber} already exists. Please choose a different roll number.",
        registrationFailed: "Registration failed",
        networkErrorPleaseTryAgain: "Network error. Please try again.",
        studentUpdatedSuccessfully: "Student updated successfully",
        updateFailed: "Update failed",
        deletionFailed: "Deletion failed",
        noStudentsToDelete: "No students to delete.",
        allStudentsDeletedSuccessfully: "All {count} students have been deleted successfully.",
        failedToDeleteAllStudents: "Failed to delete all students",
        resetAllScoresTitle: "Reset All Scores",
        resetEducationProgressTitle: "Reset Education Progress",
        resetAllBooksTitle: "Reset All Books",
        resetTeacherLogsTitle: "Reset Teacher Logs",
        resetAllUsersTitle: "Reset All Users",
        resetSettingsTitle: "Reset Settings",
        completeResetTitle: "Complete Reset",
        createBackupTitle: "Create Backup",
        thisWillPermanentlyDeleteAllStudentDataIncluding: "This will permanently delete all student data including:",
        studentPersonalInformation: "Student personal information",
        allAttendanceRecords: "All attendance records",
        allScoresAndProgress: "All scores and progress",
        allTeacherLogsForStudents: "All teacher logs for students",
        warningThisActionIsIrreversible: "WARNING: This action is irreversible!",
        completeStudentDatabaseResetWarning: "This will completely reset your student database. All data will be permanently lost.",
        thisWillResetAllStudentScoresToDefaultValues: "This will reset all student scores to default values.",
        thisWillDeleteAllEducationProgressRecords: "This will delete all education progress records.",
        resetProgress: "Reset Progress",
        thisWillDeleteAllBooksAndTheirProgressRecords: "This will delete all books and their progress records.",
        thisWillDeleteAllTeacherLogbookEntries: "This will delete all teacher logbook entries.",
        resetAllLogs: "Reset All Logs",
        thisWillDeleteAllUserAccountsExceptCurrentAdmin: "This will delete all user accounts except the current admin.",
        thisWillResetAllApplicationSettingsToDefaultValues: "This will reset all application settings to default values.",
        completeResetHeading: "COMPLETE RESET",
        thisWillDeleteAllDataAndResetEntireApplication: "This will delete ALL data and reset the entire application to its initial state.",
        thisWillDeleteLabel: "This will delete:",
        allStudentsAndTheirData: "All students and their data",
        allBooksAndClasses: "All books and classes",
        allUserAccountsExceptAdmin: "All user accounts (except admin)",
        allSettingsAndPreferences: "All settings and preferences",
        thisActionCannotBeUndoneUpper: "THIS ACTION CANNOT BE UNDONE!",
        resetEverything: "RESET EVERYTHING",
        createDataBackup: "Create Data Backup",
        downloadCompleteBackupOfAllData: "Download a complete backup of all your data.",
        noData: "No Data",
        noStudentsFoundToDelete: "No students found to delete.",
        confirmDeleteAllStudentsFirst: "Are you sure you want to delete ALL students?\n\nThis action cannot be undone.",
        confirmDeleteAllStudentsSecond: "Are you absolutely sure you want to delete ALL students?\n\nThis will permanently delete ALL students and their attendance records. This action is irreversible and will completely reset your student database.",
        allStudentScoresDeleted: "All student scores and score history have been deleted from the database.",
        adminRequiredResetStudentScores: "You must be logged in as an admin to reset student scores.",
        failedToDeleteAllScoreData: "Failed to delete all score data",
        allEducationProgressDeletedSuccessfully: "All education progress data has been deleted successfully.",
        adminRequiredResetEducationProgress: "You must be logged in as an admin to reset education progress data.",
        failedToDeleteEducationProgressData: "Failed to delete education progress data",
        allBooksResetSuccessfully: "All books have been reset successfully.",
        failedToResetAllBooks: "Failed to reset all books",
        allTeacherLogsResetSuccessfully: "All teacher logs have been reset successfully.",
        failedToResetAllTeacherLogs: "Failed to reset all teacher logs",
        allUsersResetSuccessfully: "All users have been reset successfully.",
        settingsResetSuccessfully: "Settings have been reset successfully.",
        completeResetPerformedSuccessfully: "Complete reset has been performed successfully.",
        noStudentsFoundToExport: "No students found to export.",
        studentsDataExportedSuccessfully: "Students data exported successfully! The file is ready for re-import.",
        exportError: "Export Error",
        failedToExportDataPleaseTryAgain: "Failed to export data. Please try again.",
        backupCreatedSuccessfully: "Backup created successfully.",
        logoutFailedPleaseTryAgain: "Logout failed. Please try again.",
        networkErrorDuringLogout: "Network error during logout. Please try again.",
        
        // Teachers Corner Alert Messages
        pleaseEnterNumberBetween0And100: "Please enter a number between 0 and 100.",
        scoreUpdatedSuccessfully: "Score updated successfully.",
        problemUpdatingScore: "Problem updating score.",
        connectionProblemPleaseTryAgain: "Connection problem. Please try again.",
        pleaseWriteDetails: "Please write details.",
        noteSavedSuccessfully: "Note saved successfully.",
        problemSavingNote: "Problem saving note.",
        noteUpdatedSuccessfully: "Note updated successfully.",
        problemUpdatingNote: "Problem updating note.",
        noteDeletedSuccessfully: "Note deleted successfully.",
        problemDeletingNote: "Problem deleting note.",
        bookNotFoundPleaseRefresh: "Book not found. Please refresh the page.",
        pleaseProvideCorrectInformation: "Please provide correct information.",
        bookNotFound: "Book not found.",
        problemCreatingProgressRecord: "Problem creating progress record.",
        problemUpdatingProgress: "Problem updating progress.",
        bookProgressSaved: "Book progress saved.",
        pleaseGoToSettingsToAddNewBook: "Please go to Settings to add new book.",
        bookDeletedFromLocalDisplay: "Book deleted. (from local display)",
        tarbiyahGoalsSaved: "Tarbiyah goals saved.",
        
        // Modal Titles
        scoreManagement: "Score Management",
        viewAttendance: "View Attendance",
        classAnalysis: "Class Analysis",
        teacherLogbook: "Teacher's Logbook",
        
        // Exam Management System
        examManagement: "Exam Management",
        createNewExam: "Create New Exam",
        createExam: "Create Exam",
        recentExams: "Recent Exams",
        viewAllExams: "View All Exams",
        exportResults: "Export Results",
        viewAnalysis: "View Analysis",
        noExamsCreated: "No exams created for this class yet",
        createExamInstruction: "Use the button above to create a new exam",
        books: "Books",
        students: "Students",
        resultEntry: "Result Entry:",
        edit: "Edit",
        results: "Results",
        copy: "Copy",
        copyThisPhrase: "Copy this phrase",
        pasteConfirmationPhrase: "Paste the confirmation phrase here",
        pasteConfirmationPhrasePlaceholder: "Paste the phrase exactly as shown",
        pasteConfirmationPhraseHelp: "Paste or type the confirmation phrase exactly to enable continue.",
        confirmationPhraseMatches: "Confirmation phrase matches.",
        confirmationPhraseCopied: "Confirmation phrase copied.",
        confirmationPhraseCopyFailed: "Could not copy automatically. Please select the phrase manually.",
        delete: "Delete",
        editTooltip: "Edit",
        resultsTooltip: "View Results",
        copyTooltip: "Copy",
        deleteTooltip: "Delete",
        
        // Exam Creation Modal
        createExamTitle: "Create New Exam",
        createExamSubtitle: "Create a new exam for the class",
        educationalYear: "Educational Year",
        termSemester: "Term/Semester",
        examName: "Exam Name",
        examNamePlaceholder: "e.g., Monthly Exam, Quarterly Exam",
        examCreationNote: "You can select books after creating the exam",
        cancel: "Cancel",
        nextBookSelection: "Next: Book Selection",
        
        // Score Category
        scoreCategory: "Husnul Khuluq Category",
        addScoreToExam: "Add Husnul Khuluq category to exam",
        scoreTotalMarks: "Husnul Khuluq Total Marks",
        scoreDescription: "Husnul Khuluq category will appear as the first column",
        score: "Husnul Khuluq",
        mandatory: "Mandatory",
        
        // Validation Messages
        pleaseEnterExamName: "Please enter exam name.",
        pleaseSelectEducationalYear: "Please select educational year.",
        pleaseSelectValidEducationalYear: "Please select a valid educational year.",
        
        // Book Selection
        bookSelection: "Book Selection",
        availableBooks: "Available Books for Class",
        selectedBooksForExam: "Selected Books for Exam",
        classSpecificBook: "Class Specific Book",
        allClasses: "For All Classes",
        viva: "Oral",
        noBooksAvailable: "No books available for this class",
        addBooksInstruction: "Add books for this class from Settings → Book Management",
        goToAddBooks: "Go to Add Books",
        removeBookTooltip: "Remove this book from exam",
        
        // Exam Status
        draft: "Draft",
        published: "Published",
        completed: "Completed",
        
        // Book Management
        noBooksSelected: "No books selected",
        removeBookFromExam: "Book removed from exam.",
        removeBookWithResults: "Related marks have also been deleted.",
        pleaseSelectAtLeastOneBook: "Please select at least one book.",
        examSessionNotFound: "Exam session not found.",
        
        // Database Messages
        databaseLoadError: "Database load error - using local data",
        databaseConnectionError: "Database connection error - using local storage",
        examSaveError: "Error saving exam.",
        newExamCreated: "New exam created",
        examUpdated: "Exam updated",
        
        // Confirmation Messages
        unsavedWorkConfirm: "You have unsaved work. Are you sure you want to leave this page?",
        closeModalConfirm: "You have unsaved work. Are you sure you want to close this modal?",
        publishResultsConfirm: "Are you sure you want to publish results? Editing will be limited after publishing.",
        savingInProgress: "Saving...",
        saved: "Saved!",
        publishResultsError: "Error publishing results",
        clearAllResultsConfirm: "Are you sure you want to clear all results?",
        allResultsCleared: "All results cleared.",
        examNotFound: "Exam not found.",
        
        // Book Management in Edit Modal
        hideBooks: "Hide",
        showAddRemoveBooks: "Add/Remove Books",
        classSpecific: "Class Specific",
        allClasses: "All Classes",
        
        // Duplicate Exam
        originalExamNotFound: "Original exam not found.",
        examCopySuffix: " (Copy)",
        
        // Comparison System
        maxFiveExams: "You can select maximum 5 exams.",
        selectAtLeastOneForExport: "Please select at least one exam for comparison export.",
        studentName: "Student Name",
        rollNumber: "Roll Number",
        average: "Average",
        trend: "Trend",
        rank: "Rank",
        stable: "Stable",
        improvement: "Improvement",
        decline: "Decline",
        chartFeatureComingSoon: "Chart feature coming soon.",
        noPublishedExams: "No published exam results for this class.",
        noActiveStudents: "No active students in this class.",
        totalMarks: "Total Marks",
        percentage: "Percentage",
        grade: "Grade",
        analysisExportComingSoon: "Analysis report export feature coming soon.",
        studentDataNotFound: "Student data not found.",
        examOrStudentNotFound: "Exam or student data not found."
    },
    
    bn: {
        // Header
        appTitle: "মাদানী মক্তব",
        appSubtitle: "ছাত্র ব্যবস্থাপনা সিস্টেম",
        success: "সফল",
        error: "ত্রুটি",
        info: "তথ্য",
        
        // Navigation
        dashboard: "ড্যাশবোর্ড",
        registerStudent: "ছাত্র নিবন্ধন",
        dailyAttendance: "দৈনিক উপস্থিতি",
        reports: "রিপোর্ট",
        teachersCorner: "শিক্ষক-বাতায়ন",
        messages: "বার্তা",
        communications: "যোগাযোগ",
        settings: "সেটিংস",
        education: "শিক্ষা",
        
        // Dashboard
        totalStudents: "মোট ছাত্র",
        presentToday: "আজ উপস্থিত",
        absentToday: "আজ অনুপস্থিত",
        attendanceRate: "উপস্থিতির হার",
        todaysAttendance: "আজকের উপস্থিতি",
        present: "উপস্থিত",
        absent: "অনুপস্থিত",
        percentage: "শতাংশ",
        inactiveStudents: "বিদায়ী ছাত্র",
        showingInactiveStudentsOnly: "শুধু inactive ছাত্র দেখানো হচ্ছে। পুরো তালিকায় ফিরতে Clear Filters ব্যবহার করুন।",
        yearSetupNeededTitle: "এই শিক্ষাবর্ষে এখনো কোনো শিক্ষার্থী enroll করা হয়নি।",
        yearSetupNeededDesc: " Settings → Academic → Year Setup থেকে আগের বর্ষের তথ্য কপি করুন অথবা নতুন করে শিক্ষার্থী যোগ করুন।",
        goToYearSetup: "Year Setup খুলুন",
        performanceStudents: "কর্মক্ষম ছাত্র",
        studentPerformanceBreakdown: "ছাত্রদের কর্মক্ষমতার বিস্তারিত",
        studentsWithAbsences: "অনুপস্থিত ছাত্রদের তালিকা",
        teacherLogs: "শিক্ষকের বিবরণ",
        absenceSummary: "অনুপস্থিতির সারাংশ",
        totalStudentsWithAbsences: "মোট অনুপস্থিত ছাত্র",
        noStudentsWithAbsences: "কোনো অনুপস্থিত ছাত্র পাওয়া যায়নি",
        totalAbsences: "মোট অনুপস্থিতি",
        day: "দিন",
        days: "দিন",
        fullPrint: "সম্পূর্ণ প্রিন্ট",
        customPrint: "কাস্টম প্রিন্ট",
        alerts: "সতর্কতা",
        alertsOverview: "এক নজরে সতর্কতা",
        everythingIsFine: "সবকিছু ঠিকঠাক চলছে!",
        close: "বন্ধ করুন",
        viewDetails: "বিস্তারিত দেখুন",
        classOverallStatus: "শ্রেণীর সার্বিক অবস্থা",
        studentLevels: "ছাত্রদের স্তর",
        recentClassLog: "সাম্প্রতিক শ্রেণী বিবরণ",
        teacherLogbook: "📔 শিক্ষকের পাতা",
        addNewNote: "নতুন বিবরণ",
        classLog: "শ্রেণী বিবরণ",
        studentLog: "ছাত্র বিবরণ",
        studentList: "ছাত্রদের তালিকা",
        viewAllStudents: "সব ছাত্র দেখুন",
        husnulKhuluk: "হুসনুল খুলুক",
        markAsActive: "সক্রিয় হিসেবে চিহ্নিত করুন",
        markAsInactive: "বিদায়ী হিসেবে চিহ্নিত করুন",
        todayAttendanceOverview: "আজকের উপস্থিতির সংক্ষিপ্ত বিবরণ",
        noAttendanceData: "আজকের জন্য এখনো কোন উপস্থিতির তথ্য নেই।",
        
        // Teachers Corner
        selectClass: "শ্রেণী নির্বাচন করুন",
        selectClassFromTeachersCorner: "Teachers Corner থেকে একটি শ্রেণী নির্বাচন করুন।",
        noAlerts: "কোনো সতর্কতা নেই। সবকিছু ঠিক আছে! 🎉",
        noStudentsInClass: "এই শ্রেণীতে কোন ছাত্র নেই।",
        noBooksAddedForClass: "এই শ্রেণীর জন্য কোন বই যুক্ত করা হয়নি।",
        everyoneClassLog: "সবাই (শ্রেণী বিবরণ)",
        noStudentsRegistered: "এখনো কোন ছাত্র নিবন্ধিত হয়নি।",
        noAttendanceDataAvailable: "কোন উপস্থিতির তথ্য উপলব্ধ নেই।",
        attendanceCatchUpRequired: "উপস্থিতি পূরণ করা আবশ্যক",
        attendanceCatchUpDescription: "আজ পর্যন্ত পৌঁছানো পর্যন্ত প্রতিটি অনুপস্থিত তারিখ একে একে পূরণ করে সংরক্ষণ করুন।",
        attendanceCatchUpNextDate: "এখন যে তারিখটি পূরণ করতে হবে:",
        attendanceCatchUpRemaining: "এখনও বাকি অনুপস্থিত তারিখ:",
        attendanceCatchUpCompleted: "উপস্থিতি পূরণ সম্পন্ন হয়েছে। এখন অ্যাপ আনলক হয়েছে।",
        attendanceCatchUpReminder: "কিছু অতীত দিনের উপস্থিতি বাকি আছে। সুবিধামতো উপস্থিতি বিভাগ থেকে পূরণ করতে পারবেন।",
        attendanceMustMarkAllStudents: "এই তারিখ সংরক্ষণ করার আগে প্রত্যেক ছাত্রকে অবশ্যই চিহ্নিত করতে হবে।",
        attendanceIncompleteStudents: "যে ছাত্ররা এখনও খালি আছে:",
        andMoreStudents: "এবং আরও:",
        present: "উপস্থিত",
        absent: "অনুপস্থিত",
        absentStudents: "অনুপস্থিত ছাত্রগণ:",
        noReasonProvided: "কোন কারণ দেওয়া হয়নি",
        
        // Dashboard Alerts and Tables
        institution_alerts: "প্রতিষ্ঠানের সতর্কতা",
        class_wise_information: "শ্রেণীভিত্তিক তথ্য",
        loading_class_statistics: "শ্রেণীর পরিসংখ্যান লোড হচ্ছে...",
        class: "শ্রেণী",
        total: "মোট",
        rate: "হার",
        avg_score: "গড় হুসনুল খুলুক",
        mustaid: "মুস্তায়িদ",
        mutawassit: "মুতাওয়াসসিত",
        mujtahid: "মুজতাহিদ",
        roll: "পরিচিতি",
        name: "নাম",
        score: "হুসনুল খুলুক",
        action: "কর্ম",
        reason: "কারণ",
        view_details: "বিস্তারিত দেখুন",
        critical_students: "জরুরি",
        low_score_students: "জরুরি",
        students_have_scores_below: "ছাত্রের হুসনুল খুলুক এর নিচে",
        inactive: "বিদায়ী",
        
        // Student Registration
        studentRegistration: "ছাত্র নিবন্ধন",
        studentPhoto: "ছাত্রের ছবি",
        uploadPhoto: "ছবি আপলোড করুন",
        photoUploaded: "ছবি সফলভাবে আপলোড হয়েছে",
        photoUploadError: "ছবি আপলোড ব্যর্থ",
        noPhoto: "কোন ছবি নেই",
        studentName: "ছাত্রের নাম",
        fatherName: "পিতার নাম",
        rollNumber: "পরিচিতি নং",
        address: "ঠিকানা",
        district: "জেলা",
        subDistrict: "উপজেলা",
        mobileNumber: "মোবাইল নম্বর",
        class: "শ্রেণী",
        uniqueId: "অনন্য পরিচয় নম্বর",
        selectClass: "শ্রেণী নির্বাচন করুন",
        registerStudentBtn: "ছাত্র নিবন্ধন করুন",
        required: "*",
        allRegisteredStudents: "সকল নিবন্ধিত ছাত্র",
        registerNewStudent: "নতুন ছাত্র নিবন্ধন",
        rollno: "পরিচিতি নং",
        fullname: "পূর্ণ নাম",
        mobile: "মোবাইল",
        actions: "কর্ম",
        
        // Daily Attendance
        dailyAttendanceTitle: "দৈনিক উপস্থিতি",
        present: "উপস্থিত",
        absent: "অনুপস্থিত",
        holiday: "ছুটি",
        clear: "মুছে ফেলুন",
        date: "তারিখ:",
        filterByClass: "শ্রেণী অনুযায়ী ফিল্টার:",
        allClasses: "সকল শ্রেণী",
        markAllPresent: "সবাইকে উপস্থিত চিহ্নিত করুন",
        markAllAbsent: "সবাইকে অনুপস্থিত চিহ্নিত করুন",
        markAllHoliday: "সবাইকে ছুটি চিহ্নিত করুন",
        markAllNeutral: "সবাইকে নিরপেক্ষ চিহ্নিত করুন",
        copyPreviousDay: "পূর্ববর্তী দিন কপি করুন",
        saveAttendance: "উপস্থিতি সংরক্ষণ করুন",
        students: "ছাত্র",
        progress: "অগ্রগতি",
        logbook: "বিবরণ",
        exams: "পরীক্ষা",
        pleaseSelectDate: "অনুগ্রহ করে একটি তারিখ নির্বাচন করুন।",
        noStudentsFound: "নির্বাচিত মানদণ্ডের জন্য কোন ছাত্র পাওয়া যায়নি।",
        noStudentsFoundRegister: "কোন ছাত্র পাওয়া যায়নি। অনুগ্রহ করে প্রথমে ছাত্র নিবন্ধন করুন।",
        reasonForAbsence: "অনুপস্থিতির কারণ",
        confirmMarkAllHoliday: "আপনি কি নিশ্চিত যে সব ফিল্টার করা ছাত্রদের ছুটি হিসেবে চিহ্নিত করতে চান?",
        studentsMarkedHoliday: "ছাত্রদের ছুটি হিসেবে চিহ্নিত করা হয়েছে",
        
        // Reports
        attendanceReports: "উপস্থিতির রিপোর্ট",
        fromDate: "শুরুর তারিখ:",
        toDate: "শেষের তারিখ:",
        to: "থেকে",
        generateReport: "রিপোর্ট তৈরি করুন",
        fromBeginningReport: "শুরু থেকে রিপোর্ট",
        fromBeginningReportDesc: "শিক্ষাবর্ষের শুরু থেকে আজ পর্যন্ত রিপোর্ট তৈরি করুন",
        showAttendanceTrackingCalendar: "উপস্থিতি ট্র্যাকিং ক্যালেন্ডার দেখান",
        viewAttendanceStatistics: "উপস্থিতির পরিসংখ্যান দেখুন",
        selectDateRangeToGenerate: "রিপোর্ট তৈরি করতে তারিখের পরিসর নির্বাচন করুন",
        attendanceReport: "উপস্থিতির রিপোর্ট",
        period: "সময়কাল:",
        studentNameCol: "ছাত্রের নাম",
        classCol: "শ্রেণী",
        idNumberCol: "পরিচয় নম্বর",
        presentDays: "উপস্থিত দিন",
        absentDays: "অনুপস্থিত দিন",
        attendancePercent: "উপস্থিতির %",
        clickToViewDetails: "বিস্তারিত দেখতে ক্লিক করুন",
        noAbsentDays: "এই সময়কালে কোন অনুপস্থিত দিন নেই",
        totalAbsentDays: "মোট অনুপস্থিত দিন",
        reason: "কারণ",
        cannotTakeAttendanceForFutureDate: "ভবিষ্যতের তারিখের জন্য উপস্থিতি নেওয়া যাবে না। অনুগ্রহ করে আজকের তারিখ বা অতীতের তারিখ নির্বাচন করুন।",
        selectDateRange: "তারিখের পরিসর নির্বাচন করুন এবং উপস্থিতির তথ্য দেখার জন্য \"রিপোর্ট তৈরি করুন\" ক্লিক করুন।",
        selectBothDates: "অনুগ্রহ করে শুরু এবং শেষ উভয় তারিখ নির্বাচন করুন।",
        startDateAfterEnd: "শুরুর তারিখ শেষের তারিখের পরে হতে পারে না।",
        noAcademicYearSet: "শিক্ষাবর্ষের শুরুর তারিখ সেট করা হয়নি। অনুগ্রহ করে প্রথমে সেটিংসে এটি সেট করুন।",
        
        // Settings
        settingsTitle: "সেটিংস",
        general: "সাধারণ",
        academic: "শিক্ষাবিষয়ক",
        bookManagement: "বই ব্যবস্থাপনা",
        alerts: "সতর্কতা",
        dataManagement: "তথ্য ব্যবস্থাপনা",
        userManagement: "ব্যবহারকারী ব্যবস্থাপনা",
        welcome: "স্বাগতম",
        logout: "বিদায়",
        hijriDateAdjustment: "হিজরি তারিখ সমন্বয়",
        hijriDateAdjustmentDesc: "স্থানীয় চাঁদ দেখা অনুযায়ী গণনা করা হিজরি তারিখ সমন্বয় করুন।",
        day: "দিন",
        behind: "পিছনে",
        ahead: "এগিয়ে",
        currentDatePreview: "বর্তমান তারিখের পূর্বরূপ:",
        gregorian: "গ্রেগরিয়ান:",
        hijri: "হিজরি:",
        academicYearSettings: "শিক্ষাবর্ষের সেটিংস",
        academicYearStartDate: "শিক্ষাবর্ষের শুরুর তারিখ",
        academicYearStartDateDesc: "আপনার শিক্ষাবর্ষের শুরুর তারিখ নির্বাচন করুন",
        setAcademicYearStartBtn: "শিক্ষাবর্ষের শুরু সেট করুন",
        clearAcademicYearStartBtn: "মুছে ফেলুন",
        selectAcademicYearStart: "অনুগ্রহ করে শিক্ষাবর্ষের শুরুর তারিখ নির্বাচন করুন।",
        academicYearStartUpdated: "শিক্ষাবর্ষের শুরুর তারিখ সফলভাবে আপডেট করা হয়েছে।",
        academicYearStartCleared: "শিক্ষাবর্ষের শুরুর তারিখ সফলভাবে মুছে ফেলা হয়েছে। সমস্ত তারিখের সীমাবদ্ধতা সরানো হয়েছে।",
        confirmClearAcademicYear: "আপনি কি নিশ্চিত যে শিক্ষাবর্ষের শুরুর তারিখ মুছে ফেলতে চান? এটি সমস্ত তারিখের সীমাবদ্ধতা সরিয়ে দেবে।",
        fromActiveEducationalYear: "সক্রিয় শিক্ষাবর্ষ থেকে",
        confirmAction: "আপনি কি নিশ্চিত?",
        dateRestrictionNotice: "তারিখ নির্বাচন শিক্ষাবর্ষের সময়কালে সীমাবদ্ধ",
        dateRestrictionNoticeFrom: "তারিখ নির্বাচন শিক্ষাবর্ষের সময়কালে সীমাবদ্ধ ({date} থেকে)",
        beforeAcademicYear: "শিক্ষাবর্ষের আগে",
        
        // Educational Year Management
        educationalYearManagement: "শিক্ষাবর্ষ ব্যবস্থাপনা",
        educationalYearManagementDesc: "পরীক্ষা এবং শিক্ষাগত সময়কাল সংগঠিত করার জন্য শিক্ষাবর্ষ তৈরি এবং পরিচালনা করুন।",
        educationalYearName: "শিক্ষাবর্ষের নাম",
        educationalYearNamePlaceholder: "শিক্ষাবর্ষের নাম (যেমন, ২০২৪-২০২৫)",
        educationalYearStartDate: "শুরুর তারিখ",
        educationalYearEndDate: "শেষের তারিখ",
        educationalYearStatus: "স্ট্যাটাস",
        educationalYearActive: "সক্রিয়",
        educationalYearInactive: "বিদায়ী",
        addEducationalYear: "শিক্ষাবর্ষ যোগ করুন",
        editEducationalYear: "শিক্ষাবর্ষ সম্পাদনা করুন",
        deleteEducationalYear: "শিক্ষাবর্ষ মুছুন",
        archiveEducationalYear: "শিক্ষাবর্ষ আর্কাইভ করুন",
        confirmArchiveEducationalYear: "আপনি কি নিশ্চিত যে \"{name}\" শিক্ষাবর্ষ আর্কাইভ করতে চান? এটি তালিকা থেকে লুকানো হবে তবে ডেটা সংরক্ষিত থাকবে।",
        educationalYearArchived: "শিক্ষাবর্ষ সফলভাবে আর্কাইভ হয়েছে",
        educationalYearCreated: "শিক্ষাবর্ষ সফলভাবে তৈরি হয়েছে",
        educationalYearUpdated: "শিক্ষাবর্ষ সফলভাবে আপডেট হয়েছে",
        currentEducationalYears: "বর্তমান শিক্ষাবর্ষসমূহ",
        archivedEducationalYears: "আর্কাইভকৃত শিক্ষাবর্ষসমূহ",
        archivedEducationalYearsHelp: "আর্কাইভকৃত বছরগুলো সাধারণ নির্বাচন তালিকায় লুকানো থাকবে, তবে পুরোনো নাম আবার ব্যবহার করতে চাইলে এখানে সেগুলোর নাম পরিবর্তন করতে পারবেন।",
        noCurrentEducationalYears: "কোন সক্রিয় বা নিষ্ক্রিয় শিক্ষাবর্ষ উপলব্ধ নেই।",
        noArchivedEducationalYears: "কোন আর্কাইভকৃত শিক্ষাবর্ষ নেই।",
        setActiveEducationalYear: "সক্রিয় শিক্ষাবর্ষ নির্ধারণ করুন",
        educationalYearNotFound: "শিক্ষাবর্ষ পাওয়া যায়নি",
        educationalYearNameCannotBeEmpty: "শিক্ষাবর্ষের নাম খালি রাখা যাবে না",
        educationalYearDatesCouldNotBeParsed: "বিদ্যমান শিক্ষাবর্ষের তারিখগুলো পড়া যায়নি।",
        startDateCannotBeEmpty: "শুরুর তারিখ খালি রাখা যাবে না",
        endDateCannotBeEmpty: "শেষের তারিখ খালি রাখা যাবে না",
        noEducationalYearChangesDetected: "এই শিক্ষাবর্ষের জন্য কোন পরিবর্তন পাওয়া যায়নি।",
        educationalYearRequiredFields: "নাম, শুরুর তারিখ এবং শেষের তারিখ প্রয়োজন",
        shouldEducationalYearBeActive: "এই শিক্ষাবর্ষ কি সক্রিয় হবে?",
        currentStatus: "বর্তমান অবস্থা:",
        clickOkForActiveCancelForInactive: "সক্রিয় করতে OK চাপুন, নিষ্ক্রিয় রাখতে Cancel চাপুন।",
        activeEducationalYearChanged: "সক্রিয় শিক্ষাবর্ষ \"{name}\" এ পরিবর্তন করা হয়েছে। বছরভিত্তিক তথ্য রিফ্রেশ করতে পেজ পুনরায় লোড হচ্ছে...",
        failedToSetActiveEducationalYear: "সক্রিয় শিক্ষাবর্ষ নির্ধারণ করতে ব্যর্থ হয়েছে",
        failedToArchiveEducationalYear: "শিক্ষাবর্ষ আর্কাইভ করতে ব্যর্থ হয়েছে",
        educationalYearAlreadyActive: "এই শিক্ষাবর্ষ ইতিমধ্যে সক্রিয় আছে।",
        educationalYearDeleted: "শিক্ষাবর্ষ সফলভাবে মুছে ফেলা হয়েছে",
        educationalYearNameRequired: "অনুগ্রহ করে শিক্ষাবর্ষের নাম দিন",
        educationalYearStartDateRequired: "অনুগ্রহ করে শুরুর তারিখ নির্বাচন করুন",
        educationalYearEndDateRequired: "অনুগ্রহ করে শেষের তারিখ নির্বাচন করুন",
        educationalYearEndDateAfterStart: "শেষের তারিখ শুরুর তারিখের পরে হতে হবে",
        educationalYearNameExists: "এই নামের শিক্ষাবর্ষ ইতিমধ্যে বিদ্যমান",
        educationalYearHasExams: "যে শিক্ষাবর্ষের সাথে পরীক্ষা যুক্ত আছে তা মুছতে পারবেন না",
        confirmDeleteEducationalYear: "আপনি কি নিশ্চিত যে এই শিক্ষাবর্ষ মুছতে চান?",
        educationalYearFilter: "শিক্ষাবর্ষ",
        selectEducationalYear: "অনুগ্রহ করে একটি শিক্ষাবর্ষ নির্বাচন করুন",
        selectValidEducationalYear: "অনুগ্রহ করে একটি বৈধ শিক্ষাবর্ষ নির্বাচন করুন",
        
        hijriSettings: "হিজরি তারিখ সেটিংস",
        hijriAdjustment: "হিজরি তারিখ সমন্বয়",
        hijriAdjustmentDesc: "স্থানীয় পর্যবেক্ষণের জন্য হিজরি তারিখ সমন্বয় করুন",
        hijriNoAdjustment: "কোন সমন্বয় নেই (ডিফল্ট)",
        hijriPlusOne: "+১ দিন (এগিয়ে)",
        hijriMinusOne: "-১ দিন (পিছিয়ে)",
        academicManagement: "শিক্ষাবিষয়ক ব্যবস্থাপনা",
        academicWorkspaceDescription: "বছর নিয়ন্ত্রণ, সেটআপ, প্রমোশন এবং শ্রেণী ব্যবস্থাপনাকে আলাদা কাজের জায়গায় সাজান।",
        academicOverview: "শিক্ষাবর্ষ সারসংক্ষেপ",
        academicOverviewHelp: "বিস্তারিত workspace খোলার আগে সক্রিয় বছর, coverage status এবং setup readiness দেখুন।",
        usedForReportsAndDateRestrictions: "রিপোর্ট এবং তারিখ সীমাবদ্ধতার জন্য ব্যবহৃত হয়।",
        setStartDate: "শুরুর তারিখ নির্ধারণ করুন",
        currentAcademicYearStartsFrom: "বর্তমান শিক্ষাবর্ষ শুরু হয়েছে:",
        activeEducationalYearOverridesLegacyDate: "সক্রিয় শিক্ষাবর্ষ নির্ধারণ করা থাকলে তার শুরুর তারিখ রিপোর্ট ও তারিখ সীমাবদ্ধতার জন্য ব্যবহৃত হবে। অন্যথায় উপরের তারিখটি ব্যবহৃত হবে।",
        overview: "সারসংক্ষেপ",
        yearSetupWorkspace: "বছরের সেটআপ",
        quickActions: "দ্রুত কাজ",
        academicQuickActionsHelp: "একটি দীর্ঘ পেজ স্ক্রল না করে সরাসরি প্রয়োজনীয় academic workspace-এ যান।",
        manageYears: "বছর পরিচালনা",
        openYearSetup: "বছরের সেটআপ খুলুন",
        openPromotionWorkspace: "প্রমোশন খুলুন",
        coverageStatus: "কভারেজ অবস্থা",
        setupReadiness: "সেটআপ প্রস্তুতি",
        coverageGood: "আজকের তারিখ সক্রিয় শিক্ষাবর্ষের মধ্যে রয়েছে।",
        coverageNeedsAttention: "নতুন academic data দেওয়ার আগে সক্রিয় বছরের তারিখগুলো পরীক্ষা করুন।",
        yearSetupCountsHelp: "সক্রিয় বছরের enrollments / class books / teacher assignments লোড হয়েছে।",
        setupItemsLoaded: "বর্তমানে লোড হওয়া year-setup records-এর মোট সংখ্যা।",
        setupNeedsActiveYear: "year setup data লোড করতে একটি সক্রিয় শিক্ষাবর্ষ নির্বাচন করুন।",
        noActiveYearShort: "কোন সক্রিয় বছর নেই",
        notReady: "প্রস্তুত নয়",
        activeEducationalYearLabel: "সক্রিয় শিক্ষাবর্ষ",
        chooseActiveEducationalYearHelp: "বছরভিত্তিক তথ্য এন্ট্রি ও রিপোর্টের জন্য অ্যাপ্লিকেশন কোন শিক্ষাবর্ষ ব্যবহার করবে তা নির্বাচন করুন।",
        setActiveYear: "সক্রিয় বছর নির্ধারণ করুন",
        noActiveEducationalYearSelected: "কোন সক্রিয় শিক্ষাবর্ষ নির্বাচন করা হয়নি।",
        copySetupFromPreviousYear: "পূর্ববর্তী বছর থেকে সেটআপ কপি করুন",
        copySetupFromPreviousYearHelp: "বর্তমানে সক্রিয় শিক্ষাবর্ষে ছাত্র তালিকাভুক্তি, শ্রেণীর বই এবং শিক্ষক নিয়োগ কপি করুন।",
        copySetupRiskNotice: "target year-এ আগে থেকেই setup data থাকলে system থেমে যাবে এবং overwrite-এর আগে typed confirmation চাইবে।",
        selectSourceYear: "উৎস বছর নির্বাচন করুন",
        copySetup: "সেটআপ কপি করুন",
        copySetupInitialConfirm: "\"{source}\" থেকে \"{target}\"-এ enrollment, class book এবং teacher assignment কপি করতে চান?",
        copySetupWarningIntro: "target year \"{target}\"-এ আগে থেকেই setup data আছে। \"{source}\" থেকে copy করার আগে নিচের countগুলো দেখুন।",
        copySetupSuccess: "সেটআপ সফলভাবে কপি হয়েছে।",
        copyUpdatedExistingEnrollments: "আগের enrollment আপডেট হয়েছে",
        copyInsertedNewEnrollments: "নতুন enrollment যোগ হয়েছে",
        yearEndPromotion: "বছরশেষ ট্রান্সফার",
        yearEndPromotionHelp: "উৎস বছর থেকে লক্ষ্য বছরে ছাত্রদের ট্রান্সফার করুন। উৎস ও লক্ষ্য বছর নির্বাচন করুন, শ্রেণী নির্বাচন করুন, ছাত্র লোড করুন, ব্যতিক্রম নির্ধারণ করুন, তারপর চালান।",
        promotionWorkflowHelp: "উৎস ও লক্ষ্য বছর নির্বাচন করুন, একটি শ্রেণী বেছে নিন, তারপর সেই শ্রেণীর সব ছাত্র bulk transfer করুন। প্রয়োজনে ব্যক্তিগতভাবে ব্যতিক্রম সেট করুন।",
        promotionSafetyNotice: "Transfer এখন write শুরুর আগে পুরো request validate করে, তাই stale বা mismatch decision আগে থেকেই block হবে।",
        sourceYear: "উৎস বছর",
        targetYear: "লক্ষ্য বছর",
        loadEnrollments: "তালিকাভুক্তি লোড করুন",
        loadStudents: "ছাত্র লোড করুন",
        runPromotion: "ট্রান্সফার চালান",
        runPromotionConfirm: "\"{source}\" থেকে \"{target}\"-এ {count} জন ছাত্রের transfer চালাতে চান? invalid বা stale decision থাকলে write শুরু হওয়ার আগেই block হবে।",
        studentLabel: "ছাত্র",
        actionLabel: "কর্ম",
        targetClass: "লক্ষ্য শ্রেণী",
        bulkClassTransfer: "বাল্ক শ্রেণী ট্রান্সফার",
        bulkClassTransferHelp: "উৎস শ্রেণী ও গন্তব্য শ্রেণী বেছে নিন, ছাত্র লোড করুন, তারপর চালান। প্রয়োজনে ব্যক্তিগত ব্যতিক্রম সেট করুন।",
        selectSourceClass: "উৎস শ্রেণী নির্বাচন করুন",
        selectTargetClass: "লক্ষ্য শ্রেণী নির্বাচন করুন",
        studentsInClass: "শ্রেণীর ছাত্রগণ",
        exceptionAction: "ব্যতিক্রম",
        transferToTarget: "ট্রান্সফার (লক্ষ্য শ্রেণীতে)",
        repeat: "পুনরাবৃত্তি (একই শ্রেণী)",
        passOut: "পাস আউট",
        inactive: "নিষ্ক্রিয়",
        promotionResultRollEdit: "ট্রান্সফার সম্পন্ন",
        promotionResultRollEditHelp: "ট্রান্সফার সফলভাবে সম্পন্ন হয়েছে।",
        assignRollsBeforeTransfer: "ট্রান্সফার চালানোর আগে নিচে নতুন রোল নম্বর নির্ধারণ করুন। ডুপ্লিকেট থাকলে লাল রঙে দেখাবে।",
        duplicateRollsBlocked: "ডুপ্লিকেট রোল নম্বর পাওয়া গেছে — চালানোর আগে ঠিক করুন।",
        newRoll: "নতুন রোল",
        enterRoll: "রোল দিন",
        transferComplete: "ট্রান্সফার সম্পন্ন!",
        transferred: "ট্রান্সফার হয়েছে",
        repeated: "পুনরাবৃত্তি",
        passedOut: "পাস আউট",
        inactived: "নিষ্ক্রিয়",
        purgeSampleYear: "স্যাম্পল বছর পার্জ",
        purgeSampleYearHelp: "শুধু practice বা sample year-এর জন্য Purge Sample Year ব্যবহার করুন। system আগে affected record count দেখাবে এবং typed confirmation চাইবে।",
        purgeSampleYearWarningIntro: "আপনি \"{name}\"-এর year-scoped data purge করতে যাচ্ছেন।",
        failedToPurgeSampleYear: "sample year purge করতে ব্যর্থ হয়েছে",
        targetYearCurrentData: "target year-এ বর্তমানে আছে:",
        typeConfirmationPhrase: "চালিয়ে যেতে এই confirmation phrase হুবহু লিখুন:",
        purgeWillRemoveCounts: "এই purge যেগুলো মুছে দেবে:",
        purgeRemovedCounts: "মুছে দেওয়া record:",
        purgeDeletedYearRecord: "year record empty হয়ে যাওয়ায় hard-delete করা হয়েছে।",
        purgeArchivedYearRecord: "year record নিরাপদে hard-delete করা যায়নি, তাই archive করা হয়েছে।",
        confirmationTextMismatch: "confirmation text মেলেনি।",
        yearSetupEnrollmentsLabel: "Enrollment",
        yearSetupClassBooksLabel: "Class book",
        yearSetupTeacherAssignmentsLabel: "Teacher assignment",
        educationProgressHistoryLabel: "Education progress history",
        educationProgressLabel: "Education progress",
        scoreChangeHistoryLabel: "Score change history",
        teacherLogsLabel: "Teacher log",
        examResultsLabel: "Exam result",
        examSessionsLabel: "Exam session",
        promotionHistoryLabel: "Promotion history",
        studentEnrollmentsForActiveYear: "সক্রিয় বছরের ছাত্র তালিকাভুক্তি",
        studentEnrollmentsForActiveYearHelp: "মূল ছাত্র তালিকা সবার জন্য একই থাকে। বর্তমানে সক্রিয় বছরে কোন ছাত্র কোন শ্রেণীতে থাকবে তা এখানে নির্ধারণ করুন।",
        selectStudent: "ছাত্র নির্বাচন করুন",
        rollNumberPlaceholder: "পরিচিতি নং",
        passedOut: "পাস আউট",
        saveEnrollment: "তালিকাভুক্তি সংরক্ষণ করুন",
        rollAssignment: "রোল নম্বর নির্ধারণ",
        rollAssignmentHelp: "প্রতিটি ভর্তি শিক্ষার্থীর রোল নম্বর দেখুন ও পরিবর্তন করুন। একই রোল দুজনকে দেওয়া যাবে না।",
        noEnrollmentsForActiveYear: "এই শিক্ষাবর্ষে কোনো ভর্তি পাওয়া যায়নি।",
        rollNumberRequired: "রোল নম্বর খালি রাখা যাবে না।",
        selectOrCreateActiveYearToManageEnrollments: "তালিকাভুক্তি ব্যবস্থাপনার জন্য একটি সক্রিয় শিক্ষাবর্ষ নির্বাচন করুন বা তৈরি করুন।",
        classBooksForActiveYear: "সক্রিয় বছরের শ্রেণীভিত্তিক বই",
        classBooksForActiveYearHelp: "সক্রিয় শিক্ষাবর্ষে প্রতিটি শ্রেণীর জন্য কোন বই ব্যবহৃত হবে তা নির্বাচন করুন। এখান থেকে কোনো সারি সরালে তা শুধু এই বছরের ওপর প্রভাব ফেলবে।",
        selectBook: "বই নির্বাচন করুন",
        orderPlaceholder: "ক্রম",
        saveBookLink: "বই সংযোগ সংরক্ষণ করুন",
        noClassBookSetupLoadedYet: "সক্রিয় বছরের জন্য এখনো কোন শ্রেণী-বই সেটআপ লোড হয়নি।",
        teacherAssignmentsForActiveYear: "সক্রিয় বছরের শিক্ষক নিয়োগ",
        teacherAssignmentsForActiveYearHelp: "শুধুমাত্র সক্রিয় শিক্ষাবর্ষের জন্য শিক্ষকদের শ্রেণীতে নিয়োগ দিন।",
        selectTeacherUser: "শিক্ষক/ব্যবহারকারী নির্বাচন করুন",
        saveAssignment: "নিয়োগ সংরক্ষণ করুন",
        noTeacherAssignmentsLoadedYet: "সক্রিয় বছরের জন্য এখনো কোন শিক্ষক নিয়োগ লোড হয়নি।",
        addOrRemoveClassesHelp: "সিস্টেমে শ্রেণী যোগ বা অপসারণ করুন।",
        allClassesLabelText: "সকল শ্রেণী",
        addBooksStudentsWillStudyHelp: "ছাত্ররা যে বইগুলো পড়বে সেগুলো যোগ করুন।",
        enterNewBookName: "নতুন বইয়ের নাম লিখুন",
        applicationSettings: "অ্যাপ সেটিংস",
        generalWorkspaceTitle: "সাধারণ ওয়ার্কস্পেস",
        generalWorkspaceDescription: "অ্যাপের branding, development behavior এবং হিজরি সেটিংসকে দুটি পরিষ্কার কার্ডে পরিচালনা করুন।",
        brandingAndExperienceHelp: "অ্যাপের নাম, home-screen short name এবং local development behavior নিয়ন্ত্রণ করুন।",
        calendarControlHelp: "স্থানীয় ব্যবহারের জন্য হিজরি তারিখের আচরণ ঠিক করুন এবং সঙ্গে সঙ্গে preview দেখুন।",
        applicationName: "অ্যাপের নাম",
        save: "সংরক্ষণ করুন",
        appNamePlaceholder: "অ্যাপের নাম লিখুন",
        appNameDescription: "হেডার এবং শিরোনামে প্রদর্শিত নাম পরিবর্তন করুন।",
        updateAppNameBtn: "নাম আপডেট করুন",
        enterAppName: "অনুগ্রহ করে অ্যাপের নাম লিখুন।",
        appNameUpdated: "অ্যাপের নাম সফলভাবে আপডেট করা হয়েছে।",
        pleaseFillAllFields: "অনুগ্রহ করে সব ঘর পূরণ করুন",
        startDateMustBeBeforeEndDate: "শুরুর তারিখ শেষের তারিখের আগে হতে হবে",
        failedToCreateEducationalYear: "শিক্ষাবর্ষ তৈরি করতে ব্যর্থ হয়েছে",
        failedToUpdateEducationalYear: "শিক্ষাবর্ষ আপডেট করতে ব্যর্থ হয়েছে",
        shortNamePwaDisplay: "সংক্ষিপ্ত নাম (PWA প্রদর্শন)",
        shortNameDescription: "অ্যান্ড্রয়েড হোম স্ক্রিনের জন্য সংক্ষিপ্ত নাম (সর্বোচ্চ ২০ অক্ষর)। খালি রাখলে পূর্ণ নাম থেকে স্বয়ংক্রিয়ভাবে তৈরি হবে।",
        shortNamePlaceholder: "সংক্ষিপ্ত নাম লিখুন (ঐচ্ছিক)",
        saveShortNameBtn: "সংক্ষিপ্ত নাম সংরক্ষণ করুন",
        shortNameSaved: "সংক্ষিপ্ত নাম \"{name}\" সফলভাবে সংরক্ষণ করা হয়েছে",
        shortNameCleared: "সংক্ষিপ্ত নাম মুছে ফেলা হয়েছে - পূর্ণ নাম থেকে স্বয়ংক্রিয়ভাবে তৈরি হবে",
        failedToSaveShortName: "সংক্ষিপ্ত নাম সংরক্ষণ করতে ব্যর্থ হয়েছে",
        developmentMode: "ডেভেলপমেন্ট মোড",
        developmentModeDescription: "কোড পরিবর্তন সঙ্গে সঙ্গে দেখতে ক্যাশিং বন্ধ করুন। এটি শুধু localhost-এ কাজ করে। আপনার MySQL ডাটাবেস স্বাভাবিকভাবে কাজ করবে।",
        enableDevelopmentModeNoCaching: "ডেভেলপমেন্ট মোড চালু করুন (ক্যাশিং নেই)",
        developmentModeEnabledMessage: "ক্যাশিং বন্ধ করা হয়েছে। পরিবর্তন দেখতে পেজ রিফ্রেশ করুন।",
        developmentModeOnStatus: "ডেভেলপমেন্ট মোড: চালু - ক্যাশিং বন্ধ, পরিবর্তন সঙ্গে সঙ্গে দেখা যাবে",
        developmentModeOffStatus: "ডেভেলপমেন্ট মোড: বন্ধ - স্বাভাবিক ক্যাশিং চালু আছে",
        manageClasses: "শ্রেণী ব্যবস্থাপনা",
        addBook: "বই যোগ করুন",
        bookLibrary: "বইয়ের লাইব্রেরি",
        bookLibraryHelp: "শ্রেণীভিত্তিক সব বই দেখুন এবং প্রয়োজন হলে edit বা delete action ব্যবহার করুন।",
        booksWorkspaceDescription: "একটি পরিষ্কার workspace থেকে নতুন বই যোগ করুন এবং সম্পূর্ণ বইয়ের তালিকা পরিচালনা করুন।",
        alertSystemSettings: "অ্যালার্ট সিস্টেম সেটিংস",
        alertWorkspaceDescription: "সব alert threshold একসাথে সেট করুন এবং একবারে save করুন।",
        systemAlerts: "সিস্টেম অ্যালার্ট",
        alertsThresholdGroupHelp: "এই threshold গুলো একসাথে কাজ করে। তিনটি মান ঠিক করে একবারে save করুন।",
        lowScoreAlertThreshold: "নিম্ন স্কোর অ্যালার্ট সীমা",
        lowScoreAlertThresholdHelp: "এর নিচে নামলে dashboard-এ ছাত্র low score alert হিসেবে দেখাবে।",
        criticalScoreAlertThreshold: "গুরুতর স্কোর অ্যালার্ট সীমা",
        criticalScoreAlertThresholdHelp: "এর নিচে নামলে ছাত্রকে বেশি গুরুত্বের alert হিসেবে দেখাবে।",
        lowClassAverageThresholdLabel: "নিম্ন শ্রেণী গড় সীমা",
        lowClassAverageThresholdHelp: "এর নিচে নামলে পুরো শ্রেণীকে low average হিসেবে চিহ্নিত করা হবে।",
        saveAlertThresholds: "অ্যালার্ট সীমা সংরক্ষণ করুন",
        enterNewClassName: "নতুন শ্রেণীর নাম লিখুন",
        enterClassName: "অনুগ্রহ করে একটি শ্রেণীর নাম লিখুন।",
        addClass: "শ্রেণী যোগ করুন",
        delete: "মুছুন",
        reset: "রিসেট",
        backupAndExport: "ব্যাকআপ ও এক্সপোর্ট",
        backupAndExportHelp: "বড় reset বা import-এর আগে নিরাপদ data operation-এর জন্য এই action গুলো ব্যবহার করুন।",
        exportAllData: "সব ডেটা এক্সপোর্ট করুন",
        exportAllDataHelp: "CSV ফরম্যাটে ছাত্রদের ডেটা ডাউনলোড করুন।",
        importWorkspace: "ইমপোর্ট",
        importWorkspaceHelp: "CSV-ভিত্তিক student import-এর জন্য guided import workflow ব্যবহার করুন।",
        bulkImportStudents: "বাল্ক ইমপোর্ট ছাত্র",
        bulkImportStudentsHelp: "ইমপোর্ট গাইড, ফাইল ফরম্যাট নির্দেশনা এবং upload workflow খুলুন।",
        resetWorkspace: "রিসেট",
        resetWorkspaceHelp: "এই action গুলো destructive। reset flow খোলার আগে ভালোভাবে যাচাই করুন।",
        dataWorkspaceDescription: "নিরাপদ export, import, এবং destructive reset action-গুলোকে আলাদা workspace-এ সাজান।",
        studentDataCategory: "ছাত্র ডেটা",
        deleteAllStudents: "সব ছাত্র মুছুন",
        deleteAllStudentsHelp: "সব ছাত্র তথ্য, attendance, score এবং progress স্থায়ীভাবে মুছে দিন।",
        resetAllScores: "সব স্কোর রিসেট",
        resetAllScoresHelp: "সব ছাত্রের স্কোর ডিফল্ট অবস্থায় ফেরত নিন।",
        resetEducationProgress: "শিক্ষা অগ্রগতি রিসেট",
        resetEducationProgressHelp: "সব education progress record মুছে দিন।",
        attendanceDataCategory: "উপস্থিতি ডেটা",
        resetAttendanceHistoryHelp: "সব attendance record মুছে দিন।",
        academicDataCategory: "শিক্ষাবিষয়ক ডেটা",
        resetAllBooks: "সব বই রিসেট",
        resetAllBooksHelp: "সব বই এবং তাদের progress record মুছে দিন।",
        resetTeacherLogs: "শিক্ষক লগ রিসেট",
        resetTeacherLogsHelp: "সব teacher logbook entry মুছে দিন।",
        systemDataCategory: "সিস্টেম ডেটা",
        resetAllUsers: "সব ইউজার রিসেট",
        resetAllUsersHelp: "বর্তমান admin ছাড়া সব user account মুছে দিন।",
        resetSettingsHelp: "সব application setting ডিফল্ট অবস্থায় ফেরত নিন।",
        completeResetDangerHelp: "এটি সব data মুছে দিয়ে পুরো application-কে প্রাথমিক অবস্থায় ফেরত নেবে। এই কাজটি আর ফেরানো যাবে না।",
        userAccountManagement: "ইউজার অ্যাকাউন্ট ব্যবস্থাপনা",
        usersWorkspaceDescription: "user directory-এর কাজ এবং নিজের account control আলাদা workspace-এ রাখুন।",
        userDirectory: "ইউজার ডিরেক্টরি",
        userDirectoryHelp: "একটি directory view থেকে system user তৈরি, refresh এবং পরিচালনা করুন।",
        myAccount: "আমার অ্যাকাউন্ট",
        createNewUser: "নতুন ইউজার তৈরি করুন",
        refreshList: "তালিকা রিফ্রেশ করুন",
        changeAdminPassword: "অ্যাডমিন পাসওয়ার্ড পরিবর্তন",
        changeAdminPasswordHelp: "নিরাপত্তার জন্য আপনার admin account password আপডেট করুন।",
        currentPasswordLabel: "বর্তমান পাসওয়ার্ড",
        newPasswordLabel: "নতুন পাসওয়ার্ড",
        confirmNewPasswordLabel: "নতুন পাসওয়ার্ড নিশ্চিত করুন",
        changePasswordBtn: "পাসওয়ার্ড পরিবর্তন করুন",
        accountInformation: "অ্যাকাউন্ট তথ্য",
        accountInformationHelp: "এখানে আপনার বর্তমান account detail দেখুন।",
        usernameLabel: "ইউজারনেম:",
        roleLabelSimple: "ভূমিকা:",
        lastLoginLabelSimple: "সর্বশেষ লগইন:",
        accountCreatedLabel: "অ্যাকাউন্ট তৈরি:",
        noClassesAdded: "এখনো কোন শ্রেণী যোগ করা হয়নি।",
        confirmDeleteClass: "আপনি কি নিশ্চিত যে আপনি শ্রেণী মুছে দিতে চান",
        cannotUndo: "এই কাজটি পূর্বাবস্থায় ফেরানো যাবে না।",
        confirmDeleteClassFinal: "আপনি কি সম্পূর্ণ নিশ্চিত যে আপনি শ্রেণী মুছে দিতে চান",
        finalDeleteClassWarning: "এটি এই শ্রেণীর সব ছাত্র এবং তাদের উপস্থিতি রেকর্ডও মুছে দেবে। এই কাজটি স্থায়ী এবং অপরিবর্তনীয়।",
        classExists: "এই শ্রেণী ইতিমধ্যে বিদ্যমান।",
        classAdded: "শ্রেণী সফলভাবে যোগ করা হয়েছে।",
        classDeleted: "শ্রেণী সফলভাবে মুছে দেওয়া হয়েছে।",
        promotionOrder: "ক্রম",
        promotionOrderHelp: "প্রমোশন ক্রম (১ = প্রথম শ্রেণী, ২ = দ্বিতীয়, ইত্যাদি)",
        promotionOrderInvalid: "১ বা তার বেশি একটি সংখ্যা লিখুন।",
        promotionOrderSaved: "প্রমোশন ক্রম সংরক্ষিত হয়েছে।",
        failedToSave: "সংরক্ষণ করতে ব্যর্থ হয়েছে।",
        editClassPrompt: "\"{name}\"-এর নতুন নাম লিখুন:",
        editClassTitle: "শ্রেণী সম্পাদনা করুন",
        deleteClassTitle: "শ্রেণী মুছুন",
        confirmDeleteClassWithStudents: "আপনি কি নিশ্চিত যে \"{name}\" মুছতে চান? এটি সংশ্লিষ্ট সব ছাত্র থেকে শ্রেণীটি সরিয়ে দেবে।",

        // Education
        EducationProgressTracking: "শিক্ষা প্রগতি ট্র্যাকিং",
        bookProgressManagement: "বই প্রগতি ব্যবস্থাপনা",
        addNewBook: "নতুন বই যোগ করুন",
        deleteAllData: "সব ডেটা মুছুন",
        addNewBookProgress: "নতুন বই প্রগতি যোগ করুন",
        backToList: "তালিকায় ফিরে যান",
        bookClass: "শ্রেণী",
        bookSubject: "বিষয়",
        bookName: "বইয়ের নাম",
        totalPages: "মোট পাতা",
        completedPages: "সম্পন্ন পাতা",
        bookNotes: "বিবরণ",
        saveBookProgress: "বই প্রগতি সংরক্ষণ করুন",
        editBookDetails: "বই বিবরণ সম্পাদনা করুন",
        noBooksAddedYet: "এখনো কোন বই যোগ করা হয়নি। শুরু করতে \"নতুন বই যোগ করুন\" ক্লিক করুন।",
        editDetails: "বিবরণ সম্পাদনা করুন",
        updateProgress: "প্রগতি আপডেট করুন",
        deleteBook: "মুছুন",
        confirmDeleteBook: "আপনি কি নিশ্চিত যে আপনি বই প্রগতি মুছে দিতে চান",
        bookDeletedSuccessfully: "বই প্রগতি সফলভাবে মুছে দেওয়া হয়েছে!",
        failedToDeleteBook: "বই প্রগতি মুছতে ব্যর্থ হয়েছে",
        deleteAllEducationData: "সব শিক্ষা ডেটা মুছুন",
        deleteAllEducationWarning: "এই কাজটি স্থায়ীভাবে সব শিক্ষা প্রগতি ডেটা মুছে দেবে যার মধ্যে রয়েছে:",
        yesDeleteAllData: "হ্যাঁ, সব ডেটা মুছুন",
        allEducationDataDeleted: "সব শিক্ষা ডেটা সফলভাবে মুছে দেওয়া হয়েছে!",
        failedToDeleteAllEducation: "সব শিক্ষা ডেটা মুছতে ব্যর্থ হয়েছে",
        
        // Holiday Management
        holidayManagement: "ছুটির দিন ব্যবস্থাপনা",
        addHoliday: "ছুটির দিন যোগ করুন",
        holidayDate: "ছুটির তারিখ",
        holidayStartDate: "শুরুর তারিখ",
        holidayEndDate: "শেষের তারিখ",
        holidayName: "ছুটির নাম",
        studentManagement: "ছাত্র ব্যবস্থাপনা",
        
        // Dashboard Labels
        totalStudentsLabel: "মোট ছাত্র",
        presentLabel: "উপস্থিত",
        absentLabel: "অনুপস্থিত",
        classWiseInformation: "শ্রেণীভিত্তিক তথ্য",
        personalInformation: "ব্যক্তিগত তথ্য",
        contactInformation: "যোগাযোগের তথ্য",
        academicInformation: "একাডেমিক তথ্য",
        attendanceSummary: "উপস্থিতির সারসংক্ষেপ",
        totalPresent: "মোট উপস্থিত",
        totalAbsent: "মোট অনুপস্থিত",
        attendanceRate: "উপস্থিতির হার",
        totalDays: "মোট দিন",
        recentAttendance: "সাম্প্রতিক উপস্থিতি (গত ৩০ দিন)",
        attendanceCalendar: "উপস্থিতি ক্যালেন্ডার",
        studentDetails: "ছাত্রের বিবরণ",
        backToReports: "উপস্থিতিতে ফিরে যান",
        registrationDate: "নিবন্ধনের তারিখ",
        studentNotFound: "ছাত্র পাওয়া যায়নি",
        attendanceLabel: "উপস্থিতি",
        backToRegistration: "নিবন্ধনে ফিরে যান",
        failedToFetchStudent: "ছাত্রের বিবরণ আনতে ব্যর্থ হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন।",
        networkError: "নেটওয়ার্ক ত্রুটি। অনুগ্রহ করে আপনার ইন্টারনেট সংযোগ পরীক্ষা করুন এবং আবার চেষ্টা করুন।",
        
        // Missing Modal Messages
        pleaseEnterClassName: "অনুগ্রহ করে একটি শ্রেণীর নাম দিন",
        classAddedSuccessfully: "শ্রেণী সফলভাবে যোগ করা হয়েছে",
        failedToAddClass: "শ্রেণী যোগ করতে ব্যর্থ",
        networkErrorOccurred: "নেটওয়ার্ক ত্রুটি ঘটেছে",
        classDeletedSuccessfully: "শ্রেণী সফলভাবে মুছে ফেলা হয়েছে",
        failedToDeleteClass: "শ্রেণী মুছতে ব্যর্থ",
        classUpdatedSuccessfully: "শ্রেণী সফলভাবে আপডেট হয়েছে",
        failedToUpdateClass: "শ্রেণী আপডেট করতে ব্যর্থ",
        pleaseEnterHolidayStartDateAndName: "অনুগ্রহ করে ছুটির শুরুর তারিখ এবং নাম দিন",
        startDateCannotBeAfterEndDate: "শুরুর তারিখ শেষের তারিখের পরে হতে পারে না",
        holidayDatesConflictWithExisting: "ছুটির তারিখ বিদ্যমান ছুটির সাথে সাংঘর্ষিক:",
        holidayAddedSuccessfully: "ছুটি সফলভাবে যোগ করা হয়েছে",
        failedToAddHoliday: "ছুটি যোগ করতে ব্যর্থ:",
        holidayNotFound: "ছুটি পাওয়া যায়নি",
        holidayDeletedSuccessfully: "ছুটি সফলভাবে মুছে ফেলা হয়েছে",
        failedToDeleteHoliday: "ছুটি মুছতে ব্যর্থ:",
        pleaseEnterBookName: "অনুগ্রহ করে একটি বইয়ের নাম দিন",
        pleaseEnterValidNumberOfTotalPages: "অনুগ্রহ করে মোট পৃষ্ঠার একটি বৈধ সংখ্যা দিন",
        bookAddedSuccessfully: "বই সফলভাবে যোগ করা হয়েছে",
        failedToAddBook: "বই যোগ করতে ব্যর্থ",
        bookUpdatedSuccessfully: "বই সফলভাবে আপডেট হয়েছে",
        failedToUpdateBook: "বই আপডেট করতে ব্যর্থ",
        bookDeletedSuccessfully: "বই সফলভাবে মুছে ফেলা হয়েছে",
        failedToDeleteBook: "বই মুছতে ব্যর্থ",
        confirmDeleteBookFull: "আপনি কি নিশ্চিত যে এই বইটি মুছতে চান? এই কাজটি পূর্বাবস্থায় ফেরানো যাবে না।",
        pleaseSelectAcademicYearStartDate: "অনুগ্রহ করে শিক্ষাবর্ষের শুরুর তারিখ নির্বাচন করুন",
        academicYearStartDateUpdatedSuccessfully: "শিক্ষাবর্ষের শুরুর তারিখ সফলভাবে আপডেট হয়েছে",
        academicYearStartDateSavedLocally: "শিক্ষাবর্ষের শুরুর তারিখ স্থানীয়ভাবে সংরক্ষিত হয়েছে",
        academicYearStartDateClearedSuccessfully: "শিক্ষাবর্ষের শুরুর তারিখ সফলভাবে মুছে ফেলা হয়েছে",
        academicYearStartDateClearedLocally: "শিক্ষাবর্ষের শুরুর তারিখ স্থানীয়ভাবে মুছে ফেলা হয়েছে",
        pleaseEnterAppName: "অনুগ্রহ করে একটি অ্যাপের নাম দিন",
        appNameUpdatedSuccessfully: "অ্যাপের নাম সফলভাবে আপডেট হয়েছে",
        appNameSavedLocally: "অ্যাপের নাম স্থানীয়ভাবে সংরক্ষিত হয়েছে",
        failedToLoadUsers: "ব্যবহারকারীদের লোড করতে ব্যর্থ",
        userNotFound: "ব্যবহারকারী পাওয়া যায়নি",
        failedToCreateUser: "ব্যবহারকারী তৈরি করতে ব্যর্থ",
        failedToUpdateUser: "ব্যবহারকারী আপডেট করতে ব্যর্থ",
        failedToDeleteUser: "ব্যবহারকারী মুছতে ব্যর্থ",
        passwordMustBeAtLeast4Characters: "পাসওয়ার্ড কমপক্ষে ৪ অক্ষরের হতে হবে",
        failedToResetPassword: "পাসওয়ার্ড রিসেট করতে ব্যর্থ",
        noUsersFound: "কোন ব্যবহারকারী পাওয়া যায়নি।",
        never: "কখনও নয়",
        active: "সক্রিয়",
        inactive: "নিষ্ক্রিয়",
        allClassesLabel: "সকল শ্রেণী",
        roleLabel: "ভূমিকা",
        classLabel: "শ্রেণী",
        statusLabel: "অবস্থা",
        lastLoginLabel: "সর্বশেষ লগইন",
        editPermissions: "অনুমতি সম্পাদনা করুন",
        permissions: "অনুমতিসমূহ",
        editUserTitle: "ব্যবহারকারী সম্পাদনা করুন",
        deleteUserTitle: "ব্যবহারকারী মুছুন",
        confirmDeleteUser: "আপনি কি নিশ্চিত যে \"{username}\" ব্যবহারকারীকে মুছতে চান? এই কাজটি পূর্বাবস্থায় ফেরানো যাবে না।",
        enterNewPasswordForUser: "\"{username}\" ব্যবহারকারীর নতুন পাসওয়ার্ড লিখুন:",
        withPermissionsSuffix: " {name} অনুমতিসহ",
        alertThresholdsSavedSuccessfully: "সতর্কতা থ্রেশহোল্ড সফলভাবে সংরক্ষিত হয়েছে!",
        alertThresholdsSavedLocally: "সতর্কতা থ্রেশহোল্ড স্থানীয়ভাবে সংরক্ষিত হয়েছে!",
        
        // Missing Text Content
        notSet: "সেট করা হয়নি",
        na: "N/A",
        hideDetails: "বিস্তারিত লুকান",
        viewDetails: "বিস্তারিত দেখুন",
        saveChanges: "পরিবর্তন সংরক্ষণ করুন*",
        never: "কখনো না",
        unknown: "অজানা",
        noClassAssigned: "কোন শ্রেণী বরাদ্দ করা হয়নি",
        noClassesAvailable: "কোন শ্রেণী উপলব্ধ নেই",
        noClassesAddedYet: "এখনো কোন শ্রেণী যোগ করা হয়নি",
        noHolidaysConfigured: "কোন ছুটি কনফিগার করা হয়নি।",
        noBooksAddedYetAddFirst: "এখনো কোন বই যোগ করা হয়নি। উপরে আপনার প্রথম বই যোগ করুন।",
        selectBook: "বই নির্বাচন করুন",
        noUsersFound: "কোন ব্যবহারকারী পাওয়া যায়নি।",
        noAlertsEverythingFine: "কোন সতর্কতা নেই। সবকিছু ঠিক আছে! 🎉",
        noStudentsInThisClass: "এই শ্রেণীতে কোন ছাত্র নেই।",
        noBooksAddedForThisClass: "এই শ্রেণীর জন্য কোন বই যোগ করা হয়নি।",
        
        // Missing Placeholders
        enterRollNumberPlaceholder: "পরিচিতি নং দিন (যেমন: ১০১, ২০১)",
        enterNewClassNamePlaceholder: "নতুন শ্রেণীর নাম দিন",
        holidayNamePlaceholder: "ছুটির নাম (যেমন: ঈদ-উল-ফিতর)",
        enterNewBookNamePlaceholder: "নতুন বইয়ের নাম দিন",
        totalPagesPlaceholder: "মোট পৃষ্ঠা",
        enterCurrentPasswordPlaceholder: "বর্তমান পাসওয়ার্ড দিন",
        enterNewPasswordPlaceholder: "নতুন পাসওয়ার্ড দিন",
        confirmNewPasswordPlaceholder: "নতুন পাসওয়ার্ড নিশ্চিত করুন",
        writeNotesHerePlaceholder: "এখানে বিবরণ লিখুন...",
        writeProgressNotesPlaceholder: "অগ্রগতির বিষয়ে বিবরণ লিখুন...",
        writeScoreChangeReasonPlaceholder: "হুসনুল খুলুক পরিবর্তনের কারণ লিখুন...",
        schoolHolidayStrikePlaceholder: "যেমন: স্কুল ছুটি, ধর্মঘট, ইত্যাদি",
        typeResetToConfirmPlaceholder: "নিশ্চিত করতে RESET টাইপ করুন",
        enterTotalPagesPlaceholder: "মোট পৃষ্ঠা দিন",
        
        // Missing Alert Messages
        pleaseProvideReasonForAbsence: "সংরক্ষণের আগে {name}-এর অনুপস্থিতির কারণ দিন।",
        pleaseProvideAbsenceReasonsFor: "অনুপস্থিতির কারণ দিন:",
        pleaseSelectValidCsvFile: "অনুগ্রহ করে একটি বৈধ CSV ফাইল নির্বাচন করুন। প্রথমে আপনার Excel ফাইলটি CSV হিসাবে সংরক্ষণ করুন।",
        pleaseSelectCsvFileFirst: "অনুগ্রহ করে প্রথমে একটি CSV ফাইল নির্বাচন করুন",
        noStudentDataFoundInCsv: "CSV ফাইলে কোন ছাত্রের তথ্য পাওয়া যায়নি। অনুগ্রহ করে ফরম্যাট পরীক্ষা করুন।",
        uploadFailed: "আপলোড ব্যর্থ",
        importError: "আমদানি ত্রুটি",
        networkErrorDuringUpload: "সার্ভারের সাথে সংযোগ স্থাপন করা যায়নি।",
        csvDownloaded: "CSV ডাউনলোড হয়েছে",
        selectedLabel: "নির্বাচিত:",
        clickToSelectDifferentFile: "অন্য ফাইল নির্বাচন করতে ক্লিক করুন",
        clickToSelectCsvFile: "CSV ফাইল নির্বাচন করতে ক্লিক করুন",
        supportsCsvFilesExcelSavedAsCsv: ".csv ফাইল সমর্থন করে (Excel থেকে CSV হিসেবে সংরক্ষিত)",
        importError: "আমদানি ত্রুটি",
        processingCsvFile: "CSV ফাইল প্রক্রিয়াকরণ করা হচ্ছে...",
        preparingToReadFile: "ফাইল পড়ার প্রস্তুতি নেওয়া হচ্ছে...",
        readingCsvFile: "CSV ফাইল পড়া হচ্ছে...",
        parsingCsvData: "CSV ডেটা বিশ্লেষণ করা হচ্ছে...",
        csvNeedsHeaderAndDataRow: "CSV ফাইলে অন্তত একটি হেডার সারি এবং একটি ডেটা সারি থাকতে হবে",
        missingRequiredHeaders: "প্রয়োজনীয় হেডার অনুপস্থিত: {headers}। অনুগ্রহ করে আপনার CSV ফরম্যাট পরীক্ষা করুন।",
        errorParsingCsvFile: "CSV ফাইল বিশ্লেষণে ত্রুটি: {error}",
        errorReadingFile: "ফাইল পড়তে ত্রুটি হয়েছে। অনুগ্রহ করে নিশ্চিত করুন যে ফাইলটি নষ্ট নয় এবং আবার চেষ্টা করুন।",
        uploadingStudentsForValidation: "যাচাইয়ের জন্য {count} জন ছাত্র আপলোড করা হচ্ছে...",
        importComplete: "আমদানি সম্পন্ন হয়েছে!",
        pleaseAddClassesBeforeUploading: "আপলোডের আগে সেটিংসে সেগুলো যোগ করুন।",
        unknownErrorOccurred: "একটি অজানা ত্রুটি ঘটেছে।",
        successfullyImported: "সফলভাবে আমদানি হয়েছে",
        failed: "ব্যর্থ",
        updated: "আপডেট হয়েছে",
        duplicateRollNumbers: "ডুপ্লিকেট পরিচিতি নম্বর",
        importResults: "আমদানির ফলাফল",
        backToDataManagement: "ডেটা ব্যবস্থাপনায় ফিরে যান",
        importAnotherFile: "আরেকটি ফাইল আমদানি করুন",
        encodingError: "এনকোডিং ত্রুটি",
        bengaliUnicodeIssueDetected: "বাংলা/ইউনিকোড টেক্সট সমস্যা সনাক্ত হয়েছে:",
        solution: "সমাধান:",
        saveExcelAsCsvUtf8: "আপনার Excel ফাইলটি \"CSV UTF-8 (Comma delimited) (*.csv)\" ফরম্যাটে সংরক্ষণ করুন",
        steps: "ধাপসমূহ:",
        openYourExcelFile: "আপনার Excel ফাইলটি খুলুন",
        goToFileSaveAs: "File -> Save As এ যান",
        chooseCsvUtf8Format: "\"CSV UTF-8 (Comma delimited) (*.csv)\" নির্বাচন করুন",
        saveAndTryUploadingAgain: "সংরক্ষণ করুন এবং আবার আপলোড করে দেখুন",
        hijriDateAdjustmentUpdatedSuccessfully: "হিজরি তারিখ সমন্বয় সফলভাবে আপডেট হয়েছে",
        pleaseSelectBothStartAndEndDate: "অনুগ্রহ করে শুরু এবং শেষ উভয় তারিখ নির্বাচন করুন।",
        failedToLoadAttendanceCalendar: "উপস্থিতি ক্যালেন্ডার লোড করতে ব্যর্থ। অনুগ্রহ করে আবার চেষ্টা করুন।",
        rollNumberAlreadyExists: "পরিচিতি নং {rollNumber} ইতিমধ্যে বিদ্যমান। অনুগ্রহ করে একটি ভিন্ন পরিচিতি নম্বর নির্বাচন করুন।",
        registrationFailed: "নিবন্ধন ব্যর্থ",
        networkErrorPleaseTryAgain: "নেটওয়ার্ক ত্রুটি। অনুগ্রহ করে আবার চেষ্টা করুন।",
        studentUpdatedSuccessfully: "ছাত্র সফলভাবে আপডেট হয়েছে",
        updateFailed: "আপডেট ব্যর্থ",
        deletionFailed: "মুছে ফেলায় ব্যর্থ",
        noStudentsToDelete: "মুছে ফেলার জন্য কোন ছাত্র নেই।",
        allStudentsDeletedSuccessfully: "সব {count} ছাত্র সফলভাবে মুছে ফেলা হয়েছে।",
        failedToDeleteAllStudents: "সব ছাত্র মুছতে ব্যর্থ",
        resetAllScoresTitle: "সব স্কোর রিসেট করুন",
        resetEducationProgressTitle: "শিক্ষা অগ্রগতি রিসেট করুন",
        resetAllBooksTitle: "সব বই রিসেট করুন",
        resetTeacherLogsTitle: "শিক্ষক লগসমূহ রিসেট করুন",
        resetAllUsersTitle: "সব ব্যবহারকারী রিসেট করুন",
        resetSettingsTitle: "সেটিংস রিসেট করুন",
        completeResetTitle: "সম্পূর্ণ রিসেট",
        createBackupTitle: "ব্যাকআপ তৈরি করুন",
        thisWillPermanentlyDeleteAllStudentDataIncluding: "এটি স্থায়ীভাবে সব ছাত্রের তথ্য মুছে দেবে, যার মধ্যে রয়েছে:",
        studentPersonalInformation: "ছাত্রের ব্যক্তিগত তথ্য",
        allAttendanceRecords: "সব উপস্থিতির রেকর্ড",
        allScoresAndProgress: "সব স্কোর ও অগ্রগতি",
        allTeacherLogsForStudents: "ছাত্রদের সব শিক্ষক লগ",
        warningThisActionIsIrreversible: "সতর্কতা: এই কাজটি অপরিবর্তনীয়!",
        completeStudentDatabaseResetWarning: "এটি আপনার ছাত্র ডাটাবেস সম্পূর্ণ রিসেট করবে। সব তথ্য স্থায়ীভাবে হারিয়ে যাবে।",
        thisWillResetAllStudentScoresToDefaultValues: "এটি সব ছাত্রের স্কোর ডিফল্ট মানে রিসেট করবে।",
        thisWillDeleteAllEducationProgressRecords: "এটি সব শিক্ষা অগ্রগতি রেকর্ড মুছে দেবে।",
        resetProgress: "অগ্রগতি রিসেট করুন",
        thisWillDeleteAllBooksAndTheirProgressRecords: "এটি সব বই এবং তাদের অগ্রগতি রেকর্ড মুছে দেবে।",
        thisWillDeleteAllTeacherLogbookEntries: "এটি সব শিক্ষক লগবুক এন্ট্রি মুছে দেবে।",
        resetAllLogs: "সব লগ রিসেট করুন",
        thisWillDeleteAllUserAccountsExceptCurrentAdmin: "এটি বর্তমান অ্যাডমিন ছাড়া সব ব্যবহারকারী অ্যাকাউন্ট মুছে দেবে।",
        thisWillResetAllApplicationSettingsToDefaultValues: "এটি সব অ্যাপ্লিকেশন সেটিংস ডিফল্ট মানে রিসেট করবে।",
        completeResetHeading: "সম্পূর্ণ রিসেট",
        thisWillDeleteAllDataAndResetEntireApplication: "এটি সব তথ্য মুছে দিয়ে পুরো অ্যাপ্লিকেশনকে প্রাথমিক অবস্থায় ফিরিয়ে দেবে।",
        thisWillDeleteLabel: "এতে যা মুছে যাবে:",
        allStudentsAndTheirData: "সব ছাত্র ও তাদের তথ্য",
        allBooksAndClasses: "সব বই ও শ্রেণী",
        allUserAccountsExceptAdmin: "সব ব্যবহারকারী অ্যাকাউন্ট (অ্যাডমিন ছাড়া)",
        allSettingsAndPreferences: "সব সেটিংস ও পছন্দসমূহ",
        thisActionCannotBeUndoneUpper: "এই কাজটি পূর্বাবস্থায় ফেরানো যাবে না!",
        resetEverything: "সবকিছু রিসেট করুন",
        createDataBackup: "ডেটা ব্যাকআপ তৈরি করুন",
        downloadCompleteBackupOfAllData: "আপনার সব তথ্যের একটি পূর্ণ ব্যাকআপ ডাউনলোড করুন।",
        noData: "কোন তথ্য নেই",
        noStudentsFoundToDelete: "মুছে ফেলার জন্য কোন ছাত্র পাওয়া যায়নি।",
        confirmDeleteAllStudentsFirst: "আপনি কি নিশ্চিত যে আপনি সব ছাত্র মুছতে চান?\n\nএই কাজটি পূর্বাবস্থায় ফেরানো যাবে না।",
        confirmDeleteAllStudentsSecond: "আপনি কি পুরোপুরি নিশ্চিত যে আপনি সব ছাত্র মুছতে চান?\n\nএটি স্থায়ীভাবে সব ছাত্র ও তাদের উপস্থিতির রেকর্ড মুছে দেবে। এই কাজটি অপরিবর্তনীয় এবং আপনার ছাত্র ডাটাবেস সম্পূর্ণ রিসেট করবে।",
        allStudentScoresDeleted: "সব ছাত্রের স্কোর এবং স্কোর ইতিহাস ডাটাবেস থেকে মুছে ফেলা হয়েছে।",
        adminRequiredResetStudentScores: "ছাত্রদের স্কোর রিসেট করতে আপনাকে অ্যাডমিন হিসেবে লগইন থাকতে হবে।",
        failedToDeleteAllScoreData: "সব স্কোর তথ্য মুছতে ব্যর্থ হয়েছে",
        allEducationProgressDeletedSuccessfully: "সব শিক্ষা অগ্রগতি তথ্য সফলভাবে মুছে ফেলা হয়েছে।",
        adminRequiredResetEducationProgress: "শিক্ষা অগ্রগতি তথ্য রিসেট করতে আপনাকে অ্যাডমিন হিসেবে লগইন থাকতে হবে।",
        failedToDeleteEducationProgressData: "শিক্ষা অগ্রগতি তথ্য মুছতে ব্যর্থ হয়েছে",
        allBooksResetSuccessfully: "সব বই সফলভাবে রিসেট হয়েছে।",
        failedToResetAllBooks: "সব বই রিসেট করতে ব্যর্থ হয়েছে",
        allTeacherLogsResetSuccessfully: "সব শিক্ষক লগ সফলভাবে রিসেট হয়েছে।",
        failedToResetAllTeacherLogs: "সব শিক্ষক লগ রিসেট করতে ব্যর্থ হয়েছে",
        allUsersResetSuccessfully: "সব ব্যবহারকারী সফলভাবে রিসেট হয়েছে।",
        settingsResetSuccessfully: "সেটিংস সফলভাবে রিসেট হয়েছে।",
        completeResetPerformedSuccessfully: "সম্পূর্ণ রিসেট সফলভাবে সম্পন্ন হয়েছে।",
        noStudentsFoundToExport: "রপ্তানি করার জন্য কোন ছাত্র পাওয়া যায়নি।",
        studentsDataExportedSuccessfully: "ছাত্রদের তথ্য সফলভাবে রপ্তানি হয়েছে! ফাইলটি পুনরায় আমদানির জন্য প্রস্তুত।",
        exportError: "রপ্তানি ত্রুটি",
        failedToExportDataPleaseTryAgain: "তথ্য রপ্তানি করতে ব্যর্থ হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন।",
        backupCreatedSuccessfully: "ব্যাকআপ সফলভাবে তৈরি হয়েছে।",
        logoutFailedPleaseTryAgain: "বিদায় ব্যর্থ। অনুগ্রহ করে আবার চেষ্টা করুন।",
        networkErrorDuringLogout: "বিদায়ের সময় নেটওয়ার্ক ত্রুটি। অনুগ্রহ করে আবার চেষ্টা করুন।",
        
        // Teachers Corner Alert Messages
        pleaseEnterNumberBetween0And100: "অনুগ্রহ করে ০ থেকে ১০০ এর মধ্যে একটি নাম্বার দিন।",
        scoreUpdatedSuccessfully: "হুসনুল খুলুক সফলভাবে আপডেট হয়েছে।",
        problemUpdatingScore: "হুসনুল খুলুক আপডেট করতে সমস্যা হয়েছে।",
        connectionProblemPleaseTryAgain: "সংযোগে সমস্যা হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন।",
        pleaseWriteDetails: "অনুগ্রহ করে বিস্তারিত লিখুন।",
        noteSavedSuccessfully: "বিবরণ সফলভাবে সংরক্ষিত হয়েছে।",
        problemSavingNote: "বিবরণ সংরক্ষণ করতে সমস্যা হয়েছে।",
        noteUpdatedSuccessfully: "বিবরণ সফলভাবে আপডেট হয়েছে।",
        problemUpdatingNote: "বিবরণ আপডেট করতে সমস্যা হয়েছে।",
        noteDeletedSuccessfully: "বিবরণ সফলভাবে মুছে ফেলা হয়েছে।",
        problemDeletingNote: "বিবরণ মুছতে সমস্যা হয়েছে।",
        bookNotFoundPleaseRefresh: "বইটি পাওয়া যায়নি। অনুগ্রহ করে পৃষ্ঠাটি রিফ্রেশ করুন।",
        pleaseProvideCorrectInformation: "অনুগ্রহ করে সঠিক তথ্য দিন।",
        bookNotFound: "বইটি পাওয়া যায়নি।",
        problemCreatingProgressRecord: "অগ্রগতি রেকর্ড তৈরি করতে সমস্যা হয়েছে।",
        problemUpdatingProgress: "অগ্রগতি আপডেট করতে সমস্যা হয়েছে।",
        bookProgressSaved: "বইয়ের অগ্রগতি সংরক্ষিত হয়েছে।",
        pleaseGoToSettingsToAddNewBook: "নতুন বই যোগ করার জন্য অনুগ্রহ করে Settings ট্যাবে যান।",
        bookDeletedFromLocalDisplay: "বইটি মুছে ফেলা হয়েছে। (স্থানীয় প্রদর্শন থেকে)",
        tarbiyahGoalsSaved: "তরবিয়াহ লক্ষ্যগুলি সংরক্ষিত হয়েছে।",
        
        // Modal Titles
        scoreManagement: "হুসনুল খুলুক ব্যবস্থাপনা",
        viewAttendance: "উপস্থিতি দেখুন",
        classAnalysis: "শ্রেণী বিশ্লেষণ",
        teacherLogbook: "শিক্ষকের পাতা",
        
        // Exam Management System
        examManagement: "পরীক্ষা ব্যবস্থাপনা",
        createNewExam: "নতুন পরীক্ষা তৈরি করুন",
        createExam: "পরীক্ষা তৈরি করুন",
        recentExams: "সাম্প্রতিক পরীক্ষা সমূহ",
        viewAllExams: "সকল পরীক্ষা দেখুন",
        exportResults: "ফলাফল এক্সপোর্ট",
        viewAnalysis: "বিশ্লেষণ দেখুন",
        noExamsCreated: "এই শ্রেণীর জন্য কোন পরীক্ষা তৈরি করা হয়নি",
        createExamInstruction: "নতুন পরীক্ষা তৈরি করতে উপরের বোতাম ব্যবহার করুন",
        books: "বই",
        students: "ছাত্র",
        resultEntry: "ফলাফল এন্ট্রি:",
        edit: "সম্পাদনা",
        results: "ফলাফল",
        copy: "কপি",
        copyThisPhrase: "এই phrase কপি করুন",
        pasteConfirmationPhrase: "confirmation phrase এখানে paste করুন",
        pasteConfirmationPhrasePlaceholder: "যেমন দেখানো হয়েছে ঠিক তেমন paste করুন",
        pasteConfirmationPhraseHelp: "continue চালু করতে confirmation phrase হুবহু paste বা type করুন।",
        confirmationPhraseMatches: "confirmation phrase মিলে গেছে।",
        confirmationPhraseCopied: "confirmation phrase কপি হয়েছে।",
        confirmationPhraseCopyFailed: "স্বয়ংক্রিয়ভাবে কপি করা যায়নি। অনুগ্রহ করে phrase manually select করুন।",
        delete: "মুছুন",
        editTooltip: "সম্পাদনা করুন",
        resultsTooltip: "ফলাফল দেখুন",
        copyTooltip: "কপি করুন",
        deleteTooltip: "মুছে ফেলুন",
        
        // Exam Creation Modal
        createExamTitle: "নতুন পরীক্ষা তৈরি করুন",
        createExamSubtitle: "শ্রেণীর জন্য নতুন পরীক্ষা তৈরি করুন",
        educationalYear: "শিক্ষাবর্ষ",
        termSemester: "টার্ম/সেমিস্টার",
        examName: "পরীক্ষার নাম",
        examNamePlaceholder: "যেমন: মাসিক পরীক্ষা, ত্রৈমাসিক পরীক্ষা",
        examCreationNote: "পরীক্ষা তৈরি করার পর বই নির্বাচন করতে পারবেন",
        cancel: "বাতিল",
        nextBookSelection: "পরবর্তী: বই নির্বাচন",
        
        // Score Category
        scoreCategory: "হুসনুল খুলুক ক্যাটাগরি",
        addScoreToExam: "পরীক্ষায় হুসনুল খুলুক ক্যাটাগরি যোগ করুন",
        scoreTotalMarks: "হুসনুল খুলুকের সর্বোচ্চ নম্বর",
        scoreDescription: "হুসনুল খুলুক ক্যাটাগরিটি প্রথম কলাম হিসেবে দেখাবে",
        score: "হুসনুল খুলুক",
        mandatory: "বাধ্যতামূলক",
        
        // Validation Messages
        pleaseEnterExamName: "অনুগ্রহ করে পরীক্ষার নাম দিন।",
        pleaseSelectEducationalYear: "অনুগ্রহ করে শিক্ষাবর্ষ নির্বাচন করুন।",
        pleaseSelectValidEducationalYear: "অনুগ্রহ করে একটি বৈধ শিক্ষাবর্ষ নির্বাচন করুন।",
        
        // Book Selection
        bookSelection: "বই নির্বাচন",
        availableBooks: "শ্রেণীর উপলব্ধ বই",
        selectedBooksForExam: "পরীক্ষায় নির্বাচিত বই সমূহ",
        classSpecificBook: "শ্রেণী নির্দিষ্ট বই",
        allClasses: "সকল শ্রেণীর জন্য",
        viva: "মৌখিক",
        noBooksAvailable: "শ্রেণীর জন্য কোন বই পাওয়া যায়নি",
        addBooksInstruction: "সেটিংস → বই ব্যবস্থাপনা থেকে এই শ্রেণীর জন্য বই যোগ করুন",
        goToAddBooks: "বই যোগ করতে যান",
        removeBookTooltip: "এই বই পরীক্ষা থেকে সরিয়ে দিন",
        
        // Exam Status
        draft: "খসড়া",
        published: "প্রকাশিত",
        completed: "সম্পন্ন",
        
        // Book Management
        noBooksSelected: "কোন বই নির্বাচিত হয়নি",
        removeBookFromExam: "বই পরীক্ষা থেকে সরিয়ে দেওয়া হয়েছে।",
        removeBookWithResults: "সংশ্লিষ্ট নম্বর সমূহও মুছে ফেলা হয়েছে।",
        pleaseSelectAtLeastOneBook: "অনুগ্রহ করে কমপক্ষে একটি বই নির্বাচন করুন।",
        examSessionNotFound: "পরীক্ষা সেশন পাওয়া যায়নি।",
        
        // Database Messages
        databaseLoadError: "ডাটাবেস থেকে ডেটা লোড করতে সমস্যা - স্থানীয় ডেটা ব্যবহার করা হচ্ছে",
        databaseConnectionError: "ডাটাবেস সংযোগ সমস্যা - স্থানীয় সংরক্ষণ ব্যবহার করা হচ্ছে",
        examSaveError: "পরীক্ষা সংরক্ষণে সমস্যা হয়েছে।",
        newExamCreated: "নতুন পরীক্ষা তৈরি হয়েছে",
        examUpdated: "পরীক্ষা আপডেট হয়েছে",
        
        // Confirmation Messages
        unsavedWorkConfirm: "আপনার অসম্পূর্ণ কাজ আছে। আপনি কি নিশ্চিত যে আপনি এই পেজ ছেড়ে যেতে চান?",
        closeModalConfirm: "আপনার অসম্পূর্ণ কাজ আছে। আপনি কি নিশ্চিত যে আপনি এই মডেল বন্ধ করতে চান?",
        publishResultsConfirm: "আপনি কি নিশ্চিত যে ফলাফল প্রকাশ করতে চান? প্রকাশের পর সম্পাদনা সীমিত হবে।",
        savingInProgress: "সংরক্ষণ হচ্ছে...",
        saved: "সংরক্ষিত!",
        publishResultsError: "ফলাফল প্রকাশ করতে সমস্যা হয়েছে",
        clearAllResultsConfirm: "আপনি কি নিশ্চিত যে সব ফলাফল মুছে দিতে চান?",
        allResultsCleared: "সব ফলাফল মুছে ফেলা হয়েছে।",
        examNotFound: "পরীক্ষা পাওয়া যায়নি।",
        
        // Book Management in Edit Modal
        hideBooks: "লুকান",
        showAddRemoveBooks: "বই যোগ/বিয়োগ",
        classSpecific: "শ্রেণী নির্দিষ্ট",
        allClasses: "সকল শ্রেণী",
        
        // Duplicate Exam
        originalExamNotFound: "মূল পরীক্ষা পাওয়া যায়নি।",
        examCopySuffix: " (কপি)",
        
        // Comparison System
        maxFiveExams: "সর্বোচ্চ ৫টি পরীক্ষা নির্বাচন করতে পারেন।",
        selectAtLeastOneForExport: "তুলনা এক্সপোর্ট করার জন্য কমপক্ষে একটি পরীক্ষা নির্বাচন করুন।",
        studentName: "ছাত্রের নাম",
        rollNumber: "পরিচিতি নং",
        average: "গড়",
        trend: "ট্রেন্ড",
        rank: "র‍্যাঙ্ক",
        stable: "স্থিতিশীল",
        improvement: "উন্নতি",
        decline: "অবনতি",
        chartFeatureComingSoon: "চার্ট ফিচার শীঘ্রই যোগ করা হবে।",
        noPublishedExams: "এই শ্রেণীর জন্য কোন প্রকাশিত পরীক্ষার ফলাফল নেই।",
        noActiveStudents: "এই শ্রেণীতে কোন সক্রিয় ছাত্র নেই।",
        totalMarks: "মোট নম্বর",
        percentage: "শতকরা",
        grade: "গ্রেড",
        analysisExportComingSoon: "বিশ্লেষণ রিপোর্ট এক্সপোর্ট ফিচার শীঘ্রই যোগ করা হবে।",
        studentDataNotFound: "ছাত্রের তথ্য পাওয়া যায়নি।",
        examOrStudentNotFound: "পরীক্ষা বা ছাত্রের তথ্য পাওয়া যায়নি।"
    }
};

// Current language
let currentLanguage = 'en';

// Translation function
function t(key) {
    return translations[currentLanguage][key] || key;
}

// Change language function
function changeLanguage(lang) {
    currentLanguage = lang;
    const sel = document.getElementById('languageSelector');
    const selDesktop = document.getElementById('languageSelectorDesktop');
    if (sel) sel.value = lang;
    if (selDesktop) selDesktop.value = lang;
    updateAllTexts();

    // Save language preference
    localStorage.setItem('madaniMaktabLanguage', lang);
}

// Initialize language on page load
function initializeLanguage() {
    const savedLanguage = localStorage.getItem('madaniMaktabLanguage') || 'en';
    currentLanguage = savedLanguage;
    const sel = document.getElementById('languageSelector');
    const selDesktop = document.getElementById('languageSelectorDesktop');
    if (sel) sel.value = savedLanguage;
    if (selDesktop) selDesktop.value = savedLanguage;
    updateAllTexts();
}

// Update all texts in the application
function updateAllTexts() {
    updateHeaderTexts();
    updateNavigationTexts();
    updateDashboardTexts();
    updateRegistrationTexts();
    updateAttendanceTexts();
    updateReportsTexts();
    updateSettingsTexts();
    updateStudentListTexts();
    updateTeachersCornerTexts();
    updateDashboardTableTexts();
    updateExamManagementTexts();
    updateWelcomeText();
    
    // Update Hijri preview if available
    if (window.updateHijriPreview) {
        window.updateHijriPreview();
    }
}

// Update header texts
async function updateHeaderTexts() {
    let savedName = 'Student Management System'; // Generic fallback
    
    try {
        const response = await fetch('/api/settings/appName');
        if (response.ok) {
            const data = await response.json();
            savedName = data.value || 'Student Management System';
        } else {
            // Fallback to localStorage
            savedName = localStorage.getItem('madaniMaktabAppName') || 'Student Management System';
        }
    } catch (error) {
        console.error('Error loading app name from database:', error);
        // Fallback to localStorage
        savedName = localStorage.getItem('madaniMaktabAppName') || 'Student Management System';
    }
    
    // Update main header
    const headerAppName = document.getElementById('headerAppName');
    if (headerAppName) {
        headerAppName.textContent = savedName;
    } else {
        // Fallback for old structure
        document.querySelector('.header h1').innerHTML = `<i class="fas fa-graduation-cap"></i> ${savedName}`;
    }
    
    document.querySelector('.header p').textContent = t('appSubtitle');
    
    // Update page title
    const pageTitle = document.getElementById('pageTitle');
    if (pageTitle) {
        pageTitle.textContent = `${savedName} - ${t('appSubtitle')}`;
    } else {
        document.title = `${savedName} - ${t('appSubtitle')}`;
    }
    
    // Update footer
    const footerAppName = document.getElementById('footerAppName');
    if (footerAppName) {
        footerAppName.textContent = savedName;
    } else {
        const footer = document.querySelector('.footer p');
        if (footer) {
            footer.innerHTML = `&copy; 2024 ${savedName}. All rights reserved.`;
        }
    }
    
    // Update loading screen
    const loadingAppName = document.getElementById('loadingAppName');
    if (loadingAppName) {
        loadingAppName.textContent = savedName;
    }
    
    // Update welcome text if user is logged in
    updateWelcomeText();
}

function updateWelcomeText() {
    const welcomeText = window.currentUser ? t('welcome') : '';
    const text = window.currentUser ? `${welcomeText}, ${window.currentUser.username}` : '';
    const el = document.getElementById('currentUser');
    const elMobile = document.getElementById('currentUserMobile');
    if (el) el.textContent = text;
    if (elMobile) elMobile.textContent = text;
}

// Update navigation texts
function updateNavigationTexts() {
    const navLinks = document.querySelectorAll('.nav-link');
    const navTexts = ['dashboard', 'registerStudent', 'dailyAttendance', 'reports', 'teachersCorner', 'settings'];
    
    navLinks.forEach((link, index) => {
        const icon = link.querySelector('i').outerHTML;
        link.innerHTML = `${icon} ${t(navTexts[index])}`;
    });
}

// Update dashboard texts
function updateDashboardTexts() {
    document.querySelector('#dashboard h2').textContent = t('dashboard');
    
    const statCards = document.querySelectorAll('.stat-card p');
    const statTexts = ['totalStudents', 'presentToday', 'absentToday', 'attendanceRate'];
    
    statCards.forEach((card, index) => {
        card.textContent = t(statTexts[index]);
    });
    
    const overviewTitle = document.querySelector('.recent-activity h3');
    if (overviewTitle) {
        overviewTitle.textContent = t('todayAttendanceOverview');
    }
    
    // Update class-wise stats title
    const classWiseTitle = document.querySelector('.class-wise-stats h3');
    if (classWiseTitle) {
        classWiseTitle.textContent = t('classWiseInformation');
    }
}

// Update registration texts
function updateRegistrationTexts() {
    document.querySelector('#registration h2').textContent = t('studentManagement');
    
    const labels = document.querySelectorAll('#registration label');
    const labelMap = {
        studentName: 'studentName',
        fatherName: 'fatherName',
        rollNumber: 'rollNumber',
        studentClass: 'class',
        district: 'district',
        upazila: 'subDistrict',
        mobile: 'mobileNumber',
        studentPhoto: 'studentPhoto'
    };

    labels.forEach((label) => {
        const key = label.getAttribute('for');
        if (!key || !labelMap[key]) {
            return;
        }

        const required = label.textContent.includes('*') ? ' *' : '';
        label.textContent = t(labelMap[key]) + required;
    });
    
    const submitBtn = document.querySelector('#studentForm button');
    if (submitBtn) {
        submitBtn.innerHTML = `<i class="fas fa-plus"></i> ${t('registerStudentBtn')}`;
    }
    
    const selectOption = document.querySelector('#studentClass option[value=""]');
    if (selectOption) {
        selectOption.textContent = t('selectClass');
    }
}

// Update attendance texts
function updateAttendanceTexts() {
    document.querySelector('#attendance h2').textContent = t('dailyAttendanceTitle');
    
    const dateLabel = document.querySelector('.date-selector label');
    if (dateLabel) {
        dateLabel.textContent = t('date');
    }
    
    const classLabel = document.querySelector('.class-filter label');
    if (classLabel) {
        classLabel.textContent = t('filterByClass');
    }
    
    const saveBtn = document.querySelector('#attendance .btn-save-attendance');
    if (saveBtn) {
        saveBtn.innerHTML = `<i class="fas fa-save"></i> ${t('saveAttendance')}`;
    }
    
    const allClassesOption = document.querySelector('#educationClassFilter option[value=""]');
    if (allClassesOption) {
        allClassesOption.textContent = t('allClasses');
    }
    
    // Update bulk action buttons
    const bulkButtons = document.querySelectorAll('.bulk-actions .btn');
    if (bulkButtons.length >= 5) {
        bulkButtons[0].innerHTML = `<i class="fas fa-check-double"></i> ${t('markAllPresent')}`;
        bulkButtons[1].innerHTML = `<i class="fas fa-user-slash"></i> ${t('markAllAbsent')}`;
        bulkButtons[2].innerHTML = `<i class="fas fa-calendar-day"></i> ${t('markAllHoliday')}`;
        bulkButtons[3].innerHTML = `<i class="fas fa-eraser"></i> ${t('markAllNeutral')}`;
        bulkButtons[4].innerHTML = `<i class="fas fa-copy"></i> ${t('copyPreviousDay')}`;
    }
    
    // Update bulk absent modal
    const modalTitle = document.querySelector('#bulkAbsentModal h3');
    if (modalTitle) {
        modalTitle.textContent = t('bulkAbsentTitle');
    }
    
    const modalLabel = document.querySelector('#bulkAbsentModal label');
    if (modalLabel) {
        modalLabel.textContent = t('bulkAbsentReason');
    }
    
    const modalInput = document.getElementById('bulkAbsentReason');
    if (modalInput) {
        modalInput.placeholder = t('bulkAbsentPlaceholder');
    }
    
    const modalButtons = document.querySelectorAll('#bulkAbsentModal .modal-buttons .btn');
    if (modalButtons.length >= 2) {
        modalButtons[0].innerHTML = `<i class="fas fa-times-circle"></i> ${t('bulkAbsentConfirm')}`;
        modalButtons[1].innerHTML = `<i class="fas fa-times"></i> ${t('cancel')}`;
    }
    
    // Update elements with data-translate attributes
    const translateElements = document.querySelectorAll('[data-translate]');
    translateElements.forEach(element => {
        const key = element.getAttribute('data-translate');
        if (key && t(key) !== key) {
            element.textContent = t(key);
        }
    });
}

// Update reports texts 
function updateReportsTexts() {
    document.querySelector('#reports h2').textContent = t('attendanceReports');
    
    const reportLabels = document.querySelectorAll('#reports .form-group label');
    const reportLabelTexts = ['fromDate', 'toDate'];
    
    reportLabels.forEach((label, index) => {
        if (reportLabelTexts[index]) {
            label.textContent = t(reportLabelTexts[index]);
        }
    });
    
    const generateBtn = document.querySelector('#reports .btn-primary');
    if (generateBtn) {
        generateBtn.innerHTML = `<i class="fas fa-chart-bar"></i> ${t('generateReport')}`;
    }
}

// Update settings texts
function updateSettingsTexts() {
    document.querySelector('#settings h2').textContent = t('settingsTitle');
    
    const settingsTitles = document.querySelectorAll('#settings h3');
    if (settingsTitles.length >= 1) {
        settingsTitles[0].textContent = t('applicationSettings');
    }
    if (settingsTitles.length >= 2) {
        settingsTitles[1].textContent = t('manageClasses');
    }
    if (settingsTitles.length >= 3) {
        settingsTitles[2].textContent = t('hijriSettings');
    }
    if (settingsTitles.length >= 4) {
        settingsTitles[3].textContent = t('holidayManagement');
    }
    if (settingsTitles.length >= 5) {
        settingsTitles[4].textContent = t('dataManagement');
    }

    
    const classNameInput = document.getElementById('newClassName');
    if (classNameInput) {
        classNameInput.placeholder = t('enterNewClassName');
    }

    const appNameInput = document.getElementById('appNameInput');
    if (appNameInput) {
        appNameInput.placeholder = t('appNamePlaceholder');
    }
    const appShortNameInput = document.getElementById('appShortNameInput');
    if (appShortNameInput) {
        appShortNameInput.placeholder = t('shortNamePlaceholder');
    }
    const appNameLabel = document.querySelector('label[for="appNameInput"]');
    if (appNameLabel) {
        appNameLabel.textContent = t('applicationName') + ':';
    }
    const updateAppNameBtn = document.getElementById('saveAppNameBtn');
    if (updateAppNameBtn) {
        updateAppNameBtn.innerHTML = `<i class="fas fa-save"></i> ${t('updateAppNameBtn')}`;
    }
    const saveAppShortNameBtn = document.getElementById('saveAppShortNameBtn');
    if (saveAppShortNameBtn) {
        saveAppShortNameBtn.innerHTML = `<i class="fas fa-save"></i> ${t('saveShortNameBtn')}`;
    }
    
    const holidayStartDateLabel = document.querySelector('label[for="holidayStartDate"]');
    if (holidayStartDateLabel) {
        holidayStartDateLabel.textContent = t('holidayStartDate') + ':';
    }
    
    const holidayEndDateLabel = document.querySelector('label[for="holidayEndDate"]');
    if (holidayEndDateLabel) {
        holidayEndDateLabel.textContent = t('holidayEndDate') + ':';
    }
    
    const holidayNameLabel = document.querySelector('label[for="holidayName"]');
    if (holidayNameLabel) {
        holidayNameLabel.textContent = t('holidayName') + ':';
    }
    
    const addClassBtn = document.querySelector('.add-class .btn');
    if (addClassBtn) {
        addClassBtn.innerHTML = `<i class="fas fa-plus"></i> ${t('addClass')}`;
    }
    
    // Holiday management removed - no longer needed
    
    // Update data management section texts
    const dataTranslateElements = document.querySelectorAll('[data-translate]');
    dataTranslateElements.forEach(element => {
        const key = element.getAttribute('data-translate');
        if (translations[currentLanguage][key]) {
            element.textContent = t(key);
        }
    });
}

// Update teachers corner texts
function updateTeachersCornerTexts() {
    const educationTitle = document.querySelector('#education h2');
    if (educationTitle) {
        educationTitle.textContent = t('EducationProgressTracking');
    }
    
    const bookProgressTitle = document.querySelector('#education .education-header h3');
    if (bookProgressTitle) {
        bookProgressTitle.textContent = t('bookProgressManagement');
    }
    
    const addBookBtn = document.querySelector('#education .education-actions .btn-primary');
    if (addBookBtn) {
        addBookBtn.innerHTML = `<i class="fas fa-plus"></i> ${t('addNewBook')}`;
    }
    
    const deleteAllBtn = document.querySelector('#education .education-actions .btn-danger');
    if (deleteAllBtn) {
        deleteAllBtn.innerHTML = `<i class="fas fa-trash-alt"></i> ${t('deleteAllData')}`;
    }
    
    // Update form elements
    const formTitle = document.querySelector('#addBookForm .form-header h3');
    if (formTitle) {
        formTitle.textContent = t('addNewBookProgress');
    }
    
    const backBtn = document.querySelector('#addBookForm .form-header .btn');
    if (backBtn) {
        backBtn.innerHTML = `<i class="fas fa-arrow-left"></i> ${t('backToList')}`;
    }
    
    // Update form labels
    const formLabels = document.querySelectorAll('#addBookForm label');
    const labelTexts = ['bookClass', 'bookSubject', 'bookName', 'totalPages', 'completedPages', 'bookNotes'];
    
    formLabels.forEach((label, index) => {
        if (labelTexts[index]) {
            const required = label.textContent.includes('*') ? ' *' : '';
            label.textContent = t(labelTexts[index]) + required;
        }
    });
    
    const saveBookBtn = document.querySelector('#bookForm button[type="submit"]');
    if (saveBookBtn) {
        saveBookBtn.innerHTML = `<i class="fas fa-save"></i> ${t('saveBookProgress')}`;
    }
    
    // Update edit modal
    const editModalTitle = document.querySelector('#editBookModal .modal-header h3');
    if (editModalTitle) {
        editModalTitle.textContent = t('editBookDetails');
    }
    
    const closeEditBtn = document.querySelector('#editBookModal .modal-header .btn');
    if (closeEditBtn) {
        closeEditBtn.innerHTML = `<i class="fas fa-times"></i>`;
    }
    
    // Update edit form labels
    const editFormLabels = document.querySelectorAll('#editBookForm label');
    editFormLabels.forEach((label, index) => {
        if (labelTexts[index]) {
            const required = label.textContent.includes('*') ? ' *' : '';
            label.textContent = t(labelTexts[index]) + required;
        }
    });
    
    // Refresh the books list to update dynamically generated content
    if (typeof displayBooksList === 'function') {
        displayBooksList();
    }
    
    // Also update exam management texts if exam section is visible
    updateExamManagementTexts();
    
    // Update Teachers Corner initial content if visible
    const teachersCornerSection = document.getElementById('teachers-corner-section');
    if (teachersCornerSection && teachersCornerSection.style.display !== 'none') {
        // Check if it's showing the initial class selection screen
        const classSelectionDiv = teachersCornerSection.querySelector('.text-center.p-8');
        if (classSelectionDiv) {
            const title = classSelectionDiv.querySelector('h2');
            const subtitle = classSelectionDiv.querySelector('p');
            if (title) title.textContent = t('selectClass');
            if (subtitle) subtitle.textContent = t('selectClassFromTeachersCorner');
        }
        
        // Update dynamic content in Teachers Corner
        updateTeachersCornerDynamicContent();
    }
}

// Update Teachers Corner dynamic content
function updateTeachersCornerDynamicContent() {
    // Update statistic card descriptions
    const statCards = document.querySelectorAll('#teachers-corner-section .stat-card p[data-translate]');
    statCards.forEach(card => {
        const key = card.getAttribute('data-translate');
        card.textContent = t(key);
    });
    
    // Update alerts content
    const alertsContent = document.querySelector('#alerts-content');
    if (alertsContent) {
        const noAlertsText = alertsContent.querySelector('p.text-sm.text-gray-500.text-center.py-4');
        if (noAlertsText && noAlertsText.textContent.includes('🎉')) {
            noAlertsText.textContent = t('noAlerts');
        }
    }
    
    // Update student list content
    const studentListTable = document.querySelector('#class-student-list tbody');
    if (studentListTable) {
        const noStudentsRow = studentListTable.querySelector('tr td[colspan="3"]');
        if (noStudentsRow && noStudentsRow.textContent.includes('শ্রেণীতে')) {
            noStudentsRow.textContent = t('noStudentsInClass');
        }
    }
    
    // Update education progress content
    const progressElements = document.querySelectorAll('#class-education-progress p.text-sm.text-gray-500');
    progressElements.forEach(element => {
        if (element.textContent.includes('বই যুক্ত')) {
            element.textContent = t('noBooksAddedForClass');
        }
    });
    
    // Update log student select
    const logStudentSelect = document.getElementById('log-student-select');
    if (logStudentSelect) {
        const firstOption = logStudentSelect.querySelector('option[value=""]');
        if (firstOption && firstOption.textContent.includes('সবাই')) {
            firstOption.textContent = t('everyoneClassLog');
        }
    }
}
    
// Update student list texts
function updateStudentListTexts() {
    // This will be called when the student list is displayed
    // The actual translation happens in displayStudentsList function
}

// Update student detail texts
function updateStudentDetailTexts() {
    const studentDetailTitle = document.querySelector('#student-detail h2');
    if (studentDetailTitle && studentDetailTitle.textContent.includes(' - ')) {
        const parts = studentDetailTitle.textContent.split(' - ');
        studentDetailTitle.textContent = `${parts[0]} - ${t('studentDetails')}`;
    }
    
    const backBtn = document.querySelector('#student-detail .btn-secondary');
    if (backBtn) {
        backBtn.innerHTML = `<i class="fas fa-arrow-left"></i> ${t('backToReports')}`;
    }
}

// Update section content when switching sections
function updateSectionContent(sectionId) {
    switch(sectionId) {
        case 'dashboard':
            updateDashboardTexts();
            break;
        case 'registration':
            updateRegistrationTexts();
            break;
        case 'attendance':
            updateAttendanceTexts();
            break;
        case 'reports':
            updateReportsTexts();
            break;
        case 'teachersCorner':
            updateTeachersCornerTexts();
            break;
        case 'settings':
            updateSettingsTexts();
            break;
        case 'student-detail':
            updateStudentDetailTexts();
            break;
    }
}

// Update dashboard table texts
function updateDashboardTableTexts() {
    // Update elements with data-translate attributes
    const elements = document.querySelectorAll('[data-translate]');
    elements.forEach(element => {
        const key = element.getAttribute('data-translate');
        element.textContent = t(key);
    });
}

// Update exam management texts
function updateExamManagementTexts() {
    // Update elements with data-translate attributes (already handled by updateDashboardTableTexts)
    // But we also need to refresh the exam management section if it's currently visible
    const examSection = document.getElementById('teachers-corner-section');
    if (examSection && examSection.style.display !== 'none') {
        // Check if exam management is currently loaded
        const examManagementDiv = examSection.querySelector('.bg-white.p-6.rounded-lg.shadow-md.mt-6');
        if (examManagementDiv) {
            // Get the current class name from the exam management section
            const classTitle = document.getElementById('class-dashboard-title');
            if (classTitle && classTitle.textContent) {
                const className = classTitle.textContent.trim();
                // Re-render the exam management section with new translations
                if (window.renderClassExamSection) {
                    window.renderClassExamSection(className);
                }
            }
        }
    }
    
    // Also update any open modals that might contain exam management content
    updateExamModals();
}

// Update exam-related modals
function updateExamModals() {
    // Update exam creation modal
    const examCreationModal = document.getElementById('exam-creation-modal');
    if (examCreationModal) {
        const title = examCreationModal.querySelector('h3');
        if (title) title.textContent = t('createExamTitle');
        
        const subtitle = examCreationModal.querySelector('p');
        if (subtitle) subtitle.textContent = t('createExamSubtitle') + ' ' + (subtitle.textContent.split(' ').pop() || '');
        
        // Update form labels
        const yearLabel = examCreationModal.querySelector('label[for="new-exam-year"]');
        if (yearLabel) yearLabel.innerHTML = `<i class="fas fa-calendar text-blue-500"></i> ${t('educationalYear')}`;
        
        const termLabel = examCreationModal.querySelector('label[for="new-exam-term"]');
        if (termLabel) termLabel.innerHTML = `<i class="fas fa-book text-green-500"></i> ${t('termSemester')}`;
        
        const nameLabel = examCreationModal.querySelector('label[for="new-exam-name"]');
        if (nameLabel) nameLabel.innerHTML = `<i class="fas fa-edit text-purple-500"></i> ${t('examName')}`;
        
        // Update placeholders
        const nameInput = examCreationModal.querySelector('#new-exam-name');
        if (nameInput) nameInput.placeholder = t('examNamePlaceholder');
        
        // Update buttons
        const cancelBtn = examCreationModal.querySelector('button[onclick*="closeExamCreationModal"]');
        if (cancelBtn) cancelBtn.innerHTML = `<i class="fas fa-times"></i> ${t('cancel')}`;
        
        const nextBtn = examCreationModal.querySelector('button[onclick*="proceedToBookSelection"]');
        if (nextBtn) nextBtn.innerHTML = `<i class="fas fa-arrow-right"></i> ${t('nextBookSelection')}`;
    }
    
    // Update book selection modal
    const bookSelectionModal = document.getElementById('book-selection-modal');
    if (bookSelectionModal) {
        const title = bookSelectionModal.querySelector('h3');
        if (title) title.textContent = t('bookSelection') + ' - ' + (title.textContent.split(' - ').pop() || '');
        
        // Update section headers
        const availableBooksHeader = bookSelectionModal.querySelector('h4');
        if (availableBooksHeader) {
            const classInfo = availableBooksHeader.textContent.match(/\([^)]+\)/);
            availableBooksHeader.textContent = t('availableBooks') + ' ' + (classInfo ? classInfo[0] : '');
        }
        
        const selectedBooksHeader = bookSelectionModal.querySelectorAll('h4')[1];
        if (selectedBooksHeader) {
            const countInfo = selectedBooksHeader.textContent.match(/\([^)]+\)/);
            selectedBooksHeader.innerHTML = t('selectedBooksForExam') + ' ' + (countInfo ? countInfo[0] : '');
        }
        
        // Update buttons
        const cancelBtn = bookSelectionModal.querySelector('button[onclick*="closeBookSelectionModal"]');
        if (cancelBtn) cancelBtn.textContent = t('cancel');
        
        const createBtn = bookSelectionModal.querySelector('button[onclick*="createExamWithBooks"]');
        if (createBtn) createBtn.textContent = t('createExam');
    }
}

// Export the translation function
export { t, changeLanguage, initializeLanguage, updateAllTexts };