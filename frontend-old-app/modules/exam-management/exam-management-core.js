// exam-management-core.js

// Global variables for exam management
let currentClassExams = [];
let currentClassExamResults = {};
let examGradeChart = null;
let availableEducationalYears = [];

// Unsaved changes tracking system
let hasUnsavedChanges = false;
let originalMarks = {};
let currentExamSession = null;

// Unsaved changes management functions
function initializeUnsavedChangesTracking(examSession) {
    currentExamSession = examSession;
    hasUnsavedChanges = false;
    originalMarks = {};
    
    // Store original marks state
    if (currentClassExamResults[examSession.id]) {
        originalMarks = JSON.parse(JSON.stringify(currentClassExamResults[examSession.id]));
    }
    
    console.log('📝 Initialized unsaved changes tracking for exam:', examSession.name);
}

function updateSaveButtonState() {
    // Update save button states based on unsaved changes
    const saveButtons = document.querySelectorAll('[data-action="save-exam-session"]');
    const publishButtons = document.querySelectorAll('[data-action="publish-results"]');
    
    saveButtons.forEach(button => {
        if (hasUnsavedChanges) {
            button.classList.add('bg-orange-500', 'hover:bg-orange-600');
            button.classList.remove('bg-green-500', 'hover:bg-green-600');
            button.textContent = button.textContent.replace('সেভ', 'সেভ করুন');
        } else {
            button.classList.add('bg-green-500', 'hover:bg-green-600');
            button.classList.remove('bg-orange-500', 'hover:bg-orange-600');
            button.textContent = button.textContent.replace('সেভ করুন', 'সেভ');
        }
    });
    
    publishButtons.forEach(button => {
        if (hasUnsavedChanges) {
            button.disabled = true;
            button.classList.add('opacity-50', 'cursor-not-allowed');
            button.title = 'দয়া করে প্রথমে ফলাফল সেভ করুন';
        } else {
            button.disabled = false;
            button.classList.remove('opacity-50', 'cursor-not-allowed');
            button.title = 'ফলাফল প্রকাশ করুন';
        }
    });
}

function markAsChanged() {
    hasUnsavedChanges = true;
    updateSaveButtonState();
    console.log('📝 Marked as changed - unsaved changes detected');
}

function markAsSaved() {
    hasUnsavedChanges = false;
    updateSaveButtonState();
    
    // Update original marks to current state
    if (currentExamSession) {
        if (currentClassExamResults[currentExamSession.id]) {
            originalMarks = JSON.parse(JSON.stringify(currentClassExamResults[currentExamSession.id]));
        }
    }
    
    console.log('✅ Marked as saved - all changes saved');
}

function hasUnsavedChangesInExam() {
    return hasUnsavedChanges;
}

// Window close protection
function setupWindowCloseProtection() {
    window.addEventListener('beforeunload', function(event) {
        if (hasUnsavedChanges) {
            const message = 'আপনার অসম্পূর্ণ কাজ আছে। আপনি কি নিশ্চিত যে আপনি এই পেজ ছেড়ে যেতে চান?';
            event.preventDefault();
            event.returnValue = message;
            return message;
        }
    });
    
    // Also protect against navigation within the app
    document.addEventListener('click', function(event) {
        if (hasUnsavedChanges) {
            const target = event.target;
            if (target.tagName === 'A' || target.closest('a')) {
                const href = target.href || target.closest('a').href;
                if (href && !href.includes('#')) {
                    event.preventDefault();
                    if (confirm('আপনার অসম্পূর্ণ কাজ আছে। আপনি কি নিশ্চিত যে আপনি এই পেজ ছেড়ে যেতে চান?')) {
                        window.location.href = href;
                    }
                }
            }
        }
    });
}

// Load educational years from API
async function loadEducationalYears() {
    try {
        console.log('🔄 Loading educational years for exam management...');
        const response = await fetch('/api/educational-years/active', {
            credentials: 'include'
        });
        
        if (response.ok) {
            availableEducationalYears = await response.json();
            console.log('✅ Educational years loaded successfully:', availableEducationalYears.length);
        } else {
            console.error('❌ Failed to load educational years, using fallback');
            // Fallback to current year if API fails
            const currentYear = new Date().getFullYear();
            availableEducationalYears = [
                { id: currentYear, name: currentYear.toString(), start_date: `${currentYear}-01-01`, end_date: `${currentYear}-12-31`, is_active: true }
            ];
        }
    } catch (error) {
        console.error('❌ Error loading educational years:', error);
        // Fallback to current year if API fails
        const currentYear = new Date().getFullYear();
        availableEducationalYears = [
            { id: currentYear, name: currentYear.toString(), start_date: `${currentYear}-01-01`, end_date: `${currentYear}-12-31`, is_active: true }
        ];
    }
}

// Helper function to get educational year name
function getEducationalYearName(exam) {
    // If exam has educational_year_id, find the corresponding educational year
    if (exam.educational_year_id) {
        const educationalYear = availableEducationalYears.find(year => year.id == exam.educational_year_id);
        if (educationalYear) {
            return educationalYear.name;
        }
    }
    
    // Fallback to the year field for backward compatibility
    return exam.year || 'Unknown Year';
}

// Initialize exam management for a specific class
async function initClassExamManagement(className) {
    console.log(`🎓 Initializing exam management for class: ${className}`);
    
    try {
        // Load educational years first
        await loadEducationalYears();
        
        // Load existing exams for this class from database/localStorage
        await loadClassExams(className);
        
        // Render the exam management section
        renderClassExamSection(className);
        
        console.log(`✅ Exam management initialized for class: ${className}`);
    } catch (error) {
        console.error(`❌ Error initializing exam management for class ${className}:`, error);
    }
}

// Load all exams for a specific class
async function loadClassExams(className) {
    try {
        console.log(`📚 Loading exams for class: '${className}'...`);
        console.log(`🔍 Encoded class name: '${encodeURIComponent(className)}'`);
        
        // Make API call to get class exams
        const response = await fetch(`/api/exams/${encodeURIComponent(className)}`);
        if (!response.ok) {
            const errorText = await response.text();
            console.error(`❌ Load API Error ${response.status}:`, errorText);
            throw new Error(`Failed to load exams: ${response.status} ${response.statusText} - ${errorText}`);
        }
        
        const exams = await response.json();
        console.log(`🔍 Raw API response:`, exams);
        
        // Update global variables AND expose to window for cross-module access
        currentClassExams = exams || [];
        window.currentClassExams = currentClassExams; // Expose to window
        console.log(`🔍 Updated currentClassExams:`, currentClassExams);
        
        // Load exam results for each exam
        currentClassExamResults = {};
        window.currentClassExamResults = currentClassExamResults; // Expose to window
        for (const exam of currentClassExams) {
            try {
                const resultsResponse = await fetch(`/api/exams/${exam.id}/results`);
                if (resultsResponse.ok) {
                    const results = await resultsResponse.json();
                    // Convert array results to object format expected by updateStudentMark
                    const resultsObject = {};
                    if (Array.isArray(results)) {
                        for (const result of results) {
                            if (!resultsObject[result.student_id]) {
                                resultsObject[result.student_id] = {};
                            }
                            // Handle score books - check if book name contains 'হুসনুল খুলুক' or 'Husnul Khuluq'
                            const bookId = (result.book_name && (result.book_name.includes('হুসনুল খুলুক') || result.book_name.includes('Husnul Khuluq'))) ? 'SCORE' : result.book_id;
                            const resultKey = `${bookId}_${result.exam_type || 'written'}`;
                            resultsObject[result.student_id][resultKey] = result.marks_obtained;
                        }
                    }
                    currentClassExamResults[exam.id] = resultsObject;
                    window.currentClassExamResults = currentClassExamResults; // Update window reference
                }
            } catch (resultsError) {
                console.warn(`⚠️ Could not load results for exam ${exam.id}:`, resultsError);
                currentClassExamResults[exam.id] = {};
                window.currentClassExamResults = currentClassExamResults; // Update window reference
            }
        }
        
        console.log(`✅ Loaded ${currentClassExams.length} exams for class: ${className}`);
        console.log(`📊 Loaded results for ${Object.keys(currentClassExamResults).length} exam sessions`);
        console.log(`🌍 window.currentClassExams set to:`, window.currentClassExams);
        console.log(`🌍 window.currentClassExamResults set to:`, window.currentClassExamResults);
        
    } catch (error) {
        console.error(`❌ Error loading exams for class ${className}:`, error);
        
        // Show user-friendly error notification  
        showQuickNotification('⚠️ ' + t('databaseLoadError'), 'warning');
        
        // Fallback to localStorage if API fails
        console.log('🔄 Falling back to localStorage...');
        try {
            const allExamSessions = JSON.parse(localStorage.getItem('examSessions')) || [];
            const allExamResults = JSON.parse(localStorage.getItem('examResults')) || {};
            
            currentClassExams = allExamSessions.filter(session => session.class === className);
            
            currentClassExamResults = {};
            // Convert localStorage data to new format using examSession.id
            Object.keys(allExamResults).forEach(sessionKey => {
                if (sessionKey.includes(className)) {
                    // Extract exam ID from sessionKey format: "year-term-class-examId"
                    const parts = sessionKey.split('-');
                    if (parts.length >= 4) {
                        const examId = parts.slice(3).join('-'); // Handle exam IDs with hyphens
                        currentClassExamResults[examId] = allExamResults[sessionKey];
                    }
                }
            });
            
            console.log(`📦 Fallback: Loaded ${currentClassExams.length} exams from localStorage`);
            console.log(`📦 Fallback: Loaded results for ${Object.keys(currentClassExamResults).length} exam sessions`);
            
        } catch (fallbackError) {
            console.error('❌ Fallback also failed:', fallbackError);
            currentClassExams = [];
            currentClassExamResults = {};
        }
    }
}

function getExamSessionKey(examSession) {
    return `${examSession.year}-${examSession.term}-${examSession.class}-${examSession.id}`;
}

function getCurrentExamSession(examId) {
    console.log(`🔍 getCurrentExamSession(${examId}): Searching...`);
    console.log(`🔍 Available exams in currentClassExams:`, currentClassExams.map(e => ({id: e.id, name: e.name, class: e.class})));
    
    // First try to find in current loaded exams (from database)
    let exam = currentClassExams.find(session => session.id === examId);
    
    if (exam) {
        console.log(`🔍 Found in currentClassExams:`, exam);
        return exam;
    }
    
    // Fallback to localStorage for backward compatibility
    const examSessions = JSON.parse(localStorage.getItem('examSessions')) || [];
    console.log(`🔍 Checking localStorage, found ${examSessions.length} sessions`);
    exam = examSessions.find(session => session.id === examId);
    
    console.log(`🔍 getCurrentExamSession(${examId}): ${exam ? 'Found in localStorage' : 'Not found anywhere'}`);
    return exam;
}

async function refreshExamSectionInstantly(className, isNewExam = false) {
    console.log(`🔄 Instantly refreshing exam section for: ${className}`);
    
    try {
        // Reload class exams data
        await loadClassExams(className);
        
        // Update all UI components instantly
        renderClassExamList(className);
        
        // Show success notification
        if (isNewExam) {
            showQuickNotification('✅ ' + t('newExamCreated'), 'success');
        } else {
            showQuickNotification('✅ ' + t('examUpdated'), 'success');
        }
        
        console.log('✅ Exam section refreshed instantly');
    } catch (error) {
        console.error('❌ Error refreshing exam section:', error);
    }
}

// Save exam session to backend or localStorage
async function saveExamSession(examSession) {
    try {
        console.log(`💾 Saving exam session: ${examSession.name}...`);
        
        // Create a copy for backend that excludes score books
        const backendData = {
            ...examSession,
            selectedBooks: examSession.selectedBooks.filter(book => !book.isScore && book.id !== 'SCORE')
        };
        
        console.log(`🔍 Exam session data being sent:`, backendData);
        console.log(`🔍 Educational year ID:`, backendData.educational_year_id);
        console.log(`🔍 Class name being sent: '${backendData.class}' (class_name: '${backendData.class_name}')`);
        console.log(`🔍 Selected books for backend:`, backendData.selectedBooks);
        
        // Check if this is an update or create operation
        const isExistingExam = currentClassExams.some(exam => exam.id === examSession.id);
        const isNewExam = !isExistingExam;
        
        let response;
        if (isExistingExam) {
            // Update existing exam
            response = await fetch(`/api/exams/${examSession.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(backendData)
            });
        } else {
            // Create new exam
            response = await fetch('/api/exams', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(backendData)
            });
        }
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error(`❌ API Error ${response.status}:`, errorText);
            throw new Error(`Failed to save exam: ${response.status} ${response.statusText} - ${errorText}`);
        }
        
        const result = await response.json();
        console.log(`✅ Successfully saved exam session: ${examSession.name}`, result);
        
        // Instant UI updates
        refreshExamSectionInstantly(examSession.class, isNewExam);
        
    } catch (error) {
        console.error('❌ Error saving exam session:', error);
        
        // Show user-friendly error notification
        if (typeof window.showQuickNotification === 'function') {
            window.showQuickNotification('⚠️ Database connection error', 'warning');
        }
        
        // Fallback to localStorage
        console.log('🔄 Falling back to localStorage...');
        try {
            let examSessions = JSON.parse(localStorage.getItem('examSessions')) || [];
            
            const existingIndex = examSessions.findIndex(session => session.id === examSession.id);
            const isNewExam = existingIndex < 0;
            
            if (existingIndex >= 0) {
                examSessions[existingIndex] = examSession;
            } else {
                examSessions.push(examSession);
            }
            
            localStorage.setItem('examSessions', JSON.stringify(examSessions));
            console.log(`📦 Fallback: Saved exam session to localStorage`);
            
            // Instant UI updates
            refreshExamSectionInstantly(examSession.class, isNewExam);
            
        } catch (fallbackError) {
            console.error('❌ Fallback also failed:', fallbackError);
            alert('Exam save error');
        }
    }
}

export {
    currentClassExams,
    currentClassExamResults,
    examGradeChart,
    availableEducationalYears,
    hasUnsavedChanges,
    originalMarks,
    currentExamSession,
    initializeUnsavedChangesTracking,
    updateSaveButtonState,
    markAsChanged,
    markAsSaved,
    hasUnsavedChangesInExam,
    setupWindowCloseProtection,
    loadEducationalYears,
    getEducationalYearName,
    initClassExamManagement,
    loadClassExams,
    getExamSessionKey,
    getCurrentExamSession,
    refreshExamSectionInstantly,
    saveExamSession
};