// UI rendering and dashboard logic for Teachers Corner. This module
// depends on shared state, data loaders, and class mapping utilities.
// It reimplements the major UI functions from the original file,
// replacing references to global variables with the unified `state`
// object where possible.

import {
  state,
  getTodayString,
  updateElementText,
  updateElementHTML,
  clearElementCache,
  saveSelectedClass,
  ALERT_CONFIG,
} from './teachers-corner-state.js';
import {
  loadStudentsFromMainApp,
  loadAttendanceFromMainApp,
  loadBooksForClass,
  loadProgressHistoryForBook,
  loadTeacherLogsFromDatabase,
  loadStudentScoresFromDatabase,
  getHusnulKhulukScore,
  checkFifteenDayReminder,
} from './teachers-corner-data.js';
import {
  loadClassMapping,
  getClassIdFromName,
} from './teachers-corner-mapping.js';
import {
  showTeachersCornerNav,
  hideTeachersCornerNav,
  initTeachersCornerNav,
  switchTeachersCornerTab,
} from './teachers-corner-nav.js';

/**
 * Combine 3 attendance cards into ONE horizontal row on mobile
 * Only runs on mobile screens (≤ 768px)
 * Desktop remains unchanged
 */
function combineAttendanceCardsForMobile() {
  try {
    // Get the 3 attendance cards
    const presentCard = document.querySelector('#teachers-corner-section .stat-card:has(#class-present-today)');
    const absentCard = document.querySelector('#teachers-corner-section .stat-card:has(#class-absent-today)');
    const percentageCard = document.querySelector('#teachers-corner-section .stat-card:has(#class-attendance-rate)');
    
    if (!presentCard || !absentCard || !percentageCard) return;
    
    // Get the values
    const presentValue = document.getElementById('class-present-today')?.textContent || '0';
    const absentValue = document.getElementById('class-absent-today')?.textContent || '0';
    const percentageValue = document.getElementById('class-attendance-rate')?.textContent || '0%';
    
    // Get the icon from present card
    const icon = presentCard.querySelector('i');
    
    // Create new combined structure (similar to performance card)
    presentCard.innerHTML = `
      ${icon ? icon.outerHTML : '<i class="fas fa-calendar-check"></i>'}
      <div class="attendance-values-mobile">
        <div class="attendance-value-item">
          <span class="attendance-number">${presentValue}</span>
          <span class="attendance-label">present</span>
        </div>
        <div class="attendance-value-item">
          <span class="attendance-number">${absentValue}</span>
          <span class="attendance-label">absent</span>
        </div>
        <div class="attendance-value-item">
          <span class="attendance-number">${percentageValue}</span>
          <span class="attendance-label">%</span>
        </div>
      </div>
    `;
    
    // Add special class to identify combined card
    presentCard.classList.add('attendance-combined-mobile');
    
    // Hide the other 2 cards
    absentCard.style.display = 'none';
    percentageCard.style.display = 'none';
    
  } catch (error) {
    console.error('Error combining attendance cards:', error);
  }
}

// Initialize the Teachers Corner section when the DOM is ready. This
// function inserts the necessary HTML skeleton and loads initial data
// (classes, students, attendance) before displaying the dashboard.
export async function initTeachersCorner() {
  console.log('🚀 Initializing Teachers Corner section...');
  
  // Prevent multiple initializations
  if (window._teachersCornerInitialized) {
    console.log('⏭️ Teachers Corner already initialized, skipping...');
    return;
  }
  
  const section = document.getElementById('teachers-corner-section');
  if (!section) {
    console.error('❌ teachers-corner-section element not found');
    return;
  }
  
  // Load initial data
  await loadStudentsFromMainApp();
  await loadAttendanceFromMainApp();
  
  // Check if user has "all classes" permission OR is admin before auto-loading saved class
  let userCanAutoLoad = false;
  if (window.currentUser) {
    // Admins can auto-load any class
    if (window.currentUser.role === 'admin') {
      userCanAutoLoad = true;
      console.log('🔐 User is admin - can auto-load saved class');
    } else if (window.currentUser.permissions) {
      let permissions = window.currentUser.permissions;
      // Parse permissions if it's a JSON string
      if (typeof permissions === 'string') {
        try {
          permissions = JSON.parse(permissions);
          console.log('🔐 Parsed Teachers Corner permissions:', permissions);
        } catch (e) {
          console.warn('Failed to parse user permissions in Teachers Corner:', e);
          permissions = {};
        }
      }
      userCanAutoLoad = permissions.classes && permissions.classes.includes('all');
      console.log('🔐 User has all classes permission:', userCanAutoLoad);
    }
  }
  
  // Only auto-load from localStorage if user has permission
  if (userCanAutoLoad) {
    const savedClass = localStorage.getItem('teachersCornerSelectedClass');
    if (savedClass) {
      state.currentClass = savedClass;
      console.log(`🔄 User can auto-load - loading saved class: ${savedClass}`);
      // Automatically load the dashboard for the saved class
      setTimeout(async () => {
        await showClassDashboard(savedClass);
      }, 100);
    } else {
      console.log('🔄 User can auto-load but no saved class - showing blank dashboard');
      resetDashboard();
    }
  } else {
    console.log('🔄 User cannot auto-load - showing blank dashboard (will load when class is selected)');
    // Don't clear localStorage - just show blank dashboard
    state.currentClass = null;
    resetDashboard();
  }
  
  // Mark as initialized
  window._teachersCornerInitialized = true;
  
  // Clear DOM cache for title element to ensure fresh lookup
  clearElementCache('class-dashboard-title');
  
  // Insert the dashboard skeleton if it doesn't exist yet
  const existingTitle = document.getElementById('class-dashboard-title');
  console.log('🔍 Checking if dashboard title exists:', !!existingTitle);
  if (!existingTitle) {
    console.log('🔧 Inserting new dashboard HTML skeleton...');
    const titleText = state.currentClass ? `${state.currentClass} - Teachers Corner` : 'শ্রেণী নির্বাচন করুন';
    section.innerHTML = `
      <h2 id="class-dashboard-title" class="text-2xl font-bold mb-6 pb-2">${titleText}</h2>
      <!-- Today's Summary - Redesigned Layout -->
      <!-- Row 1: 2 cards side by side -->
      <div class="grid grid-cols-2 gap-4 mb-4" id="tc-stats-row-1">
        <div class="stat-card"><i class="fas fa-users text-4xl text-blue-500 mb-4"></i><h3 id="class-total-students" class="text-4xl font-bold text-gray-800">0</h3><p class="text-gray-500" data-translate="totalStudents">মোট ছাত্র</p></div>
        <div class="stat-card" onclick="showInactiveStudentsModal()" style="cursor: pointer;"><i class="fas fa-user-slash text-4xl text-orange-500 mb-4"></i><h3 id="class-inactive-students" class="text-4xl font-bold text-gray-800">0</h3><p class="text-gray-500" data-translate="inactiveStudents">বিদায়ী ছাত্র</p></div>
      </div>
      
      <!-- Row 2: 1 full-width attendance card -->
      <div class="mb-4" id="tc-stats-row-2">
        <div class="stat-card attendance-combined-card">
          <div class="performance-tiers">
            <div class="tier present-tier">
              <span class="tier-count" id="class-present-today">0</span>
              <span class="tier-label" data-translate="present">Present</span>
            </div>
            <div class="tier absent-tier">
              <span class="tier-count" id="class-absent-today">0</span>
              <span class="tier-label" data-translate="absent">Absent</span>
            </div>
            <div class="tier percentage-tier">
              <span class="tier-count" id="class-attendance-rate">0%</span>
              <span class="tier-label" data-translate="percentage">Percentage</span>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Row 3: 2 cards side by side (Messages + Performance Tiers) -->
      <div class="grid grid-cols-2 gap-4 mb-8" id="tc-stats-row-3">
        <div class="stat-card" onclick="if(typeof openCommunicationsWindow === 'function') openCommunicationsWindow(); else if(typeof openTeachersCornerMessaging === 'function') openTeachersCornerMessaging();" style="cursor: pointer;">
          <i class="fas fa-comments text-4xl text-indigo-500 mb-4"></i>
          <h3 id="tc-messages-count" class="text-4xl font-bold text-gray-800">0</h3>
          <p class="text-gray-500" data-translate="messages">Messages</p>
        </div>
        <div class="stat-card performance-card">
          <div class="performance-tiers">
            <div class="tier mustaid" onclick="event.stopPropagation(); filterStudentsByTier('mustaid')">
              <span class="tier-count" id="tc-mustaid-count">0</span>
              <span class="tier-label" data-translate="mustaid">Mustaid</span>
            </div>
            <div class="tier mutawassit" onclick="event.stopPropagation(); filterStudentsByTier('mutawassit')">
              <span class="tier-count" id="tc-mutawassit-count">0</span>
              <span class="tier-label" data-translate="mutawassit">Mutawassit</span>
            </div>
            <div class="tier mujtahid" onclick="event.stopPropagation(); filterStudentsByTier('mujtahid')">
              <span class="tier-count" id="tc-mujtahid-count">0</span>
              <span class="tier-label" data-translate="mujtahid">Mujtahid</span>
            </div>
          </div>
        </div>
      </div>

      
      <!-- Dashboard alerts -->
      <div id="dashboard-alerts" class="mb-8 bg-white p-6 rounded-lg shadow-md">
        <h3 class="text-xl font-semibold mb-4 text-gray-700 flex items-center gap-2">
          <i class="fas fa-exclamation-triangle text-yellow-500"></i>
          এক নজরে সতর্কতা
        </h3>
        <div id="alerts-content" class="space-y-3"></div>
      </div>
      <!-- Teacher's logbook -->
      <div class="bg-white p-6 rounded-lg shadow-md mb-8">
          <div class="flex justify-between items-center mb-4">
            <h3 class="text-xl font-semibold text-gray-700">📔 শিক্ষকের পাতা</h3>
            <button onclick="showAddLogModal()" class="btn-success text-white px-3 py-1 rounded-md text-sm font-semibold flex items-center gap-2"><i class="fas fa-plus"></i> নতুন বিবরণ</button>
          </div>
          <div class="logbook-tabs border-b border-gray-200 mb-4">
            <button onclick="switchLogTab('class')" class="tab-button py-2 px-4 text-gray-500 font-semibold active">শ্রেণী বিবরণ</button>
            <button onclick="switchLogTab('student')" class="tab-button py-2 px-4 text-gray-500 font-semibold">ছাত্র বিবরণ</button>
          </div>
          <div id="logbook-display" class="space-y-4 max-h-[400px] overflow-y-auto pr-2"></div>
        </div>
      </div>
      <!-- Student List & Education Progress -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div class="bg-white p-6 rounded-lg shadow-md">
          <div class="flex justify-between items-center mb-4">
            <h3 class="text-xl font-semibold text-gray-700">ছাত্রদের তালিকা</h3>
            <button onclick="clearStudentFilter()" class="text-sm text-blue-600 hover:text-blue-800 underline">সব ছাত্র দেখুন</button>
          </div>
          <div class="max-h-80 overflow-y-auto student-list-container">
            <table class="w-full text-sm text-left text-gray-600">
              <thead class="text-xs text-gray-700 uppercase bg-gray-50 sticky top-0">
                <tr>
                  <th class="px-3 py-2 text-center">হুসনুল খুলুক</th>
                  <th class="px-3 py-2">পরিচিতি</th>
                  <th class="px-3 py-2">নাম</th>
                </tr>
              </thead>
              <tbody id="class-student-list"></tbody>
            </table>
          </div>
        </div>
        <div class="bg-white p-6 rounded-lg shadow-md">
          <div class="flex justify-between items-center mb-4">
            <h3 class="text-xl font-semibold text-gray-700">দরসের পরিমাণ</h3>
            <div class="flex gap-2">
              <button onclick="showBookModal()" class="text-gray-500 hover:text-blue-500" title="নতুন বই যোগ করুন"><i class="fas fa-plus"></i></button>
            </div>
          </div>
          <div id="class-education-progress" class="space-y-3 max-h-80 overflow-y-auto"></div>
        </div>
      </div>
      
      <!-- Exam Management Section -->
      <div id="class-exam-management-section" class="mt-6">
        <!-- Exam management content will be inserted here -->
      </div>
    `;
    console.log('✅ Dashboard HTML skeleton inserted successfully');
  } else {
    console.log('⚠️ Dashboard HTML already exists, skipping insertion');
    console.log('🔍 Checking if messaging widget container exists in existing HTML...');
    const existingMessagingContainer = document.getElementById('teachersMessagingWidgetContainer');
    console.log('🔍 Messaging container exists:', !!existingMessagingContainer);
    
    console.log('🔍 Checking if exam section exists in existing HTML...');
    const existingExamSection = document.getElementById('class-exam-management-section');
    console.log('🔍 Exam section exists:', !!existingExamSection);
    
    if (!existingMessagingContainer || !existingExamSection) {
      console.log('⚠️ Missing required containers, forcing HTML refresh...');
      // Force refresh the HTML
      const titleText = state.currentClass ? `${state.currentClass} - Teachers Corner` : 'শ্রেণী নির্বাচন করুন';
      section.innerHTML = `
        <h2 id="class-dashboard-title" class="text-2xl font-bold mb-6 pb-2">${titleText}</h2>
        <!-- Today's Summary - Redesigned Layout -->
        <!-- Row 1: 2 cards side by side -->
        <div class="grid grid-cols-2 gap-4 mb-4" id="tc-stats-row-1">
          <div class="stat-card"><i class="fas fa-users text-4xl text-blue-500 mb-4"></i><h3 id="class-total-students" class="text-4xl font-bold text-gray-800">0</h3><p class="text-gray-500" data-translate="totalStudents">মোট ছাত্র</p></div>
          <div class="stat-card" onclick="showInactiveStudentsModal()" style="cursor: pointer;"><i class="fas fa-user-slash text-4xl text-orange-500 mb-4"></i><h3 id="class-inactive-students" class="text-4xl font-bold text-gray-800">0</h3><p class="text-gray-500" data-translate="inactiveStudents">বিদায়ী ছাত্র</p></div>
        </div>
        
        <!-- Row 2: 1 full-width attendance card -->
        <div class="mb-4" id="tc-stats-row-2">
          <div class="stat-card attendance-combined-card">
            <div class="performance-tiers">
              <div class="tier present-tier">
                <span class="tier-count" id="class-present-today">0</span>
                <span class="tier-label" data-translate="present">Present</span>
              </div>
              <div class="tier absent-tier">
                <span class="tier-count" id="class-absent-today">0</span>
                <span class="tier-label" data-translate="absent">Absent</span>
              </div>
              <div class="tier percentage-tier">
                <span class="tier-count" id="class-attendance-rate">0%</span>
                <span class="tier-label" data-translate="percentage">Percentage</span>
              </div>
            </div>
          </div>
        </div>
        
        <!-- Row 3: 2 cards side by side (Messages + Performance Tiers) -->
        <div class="grid grid-cols-2 gap-4 mb-8" id="tc-stats-row-3">
          <div class="stat-card" onclick="if(typeof openCommunicationsWindow === 'function') openCommunicationsWindow(); else if(typeof openTeachersCornerMessaging === 'function') openTeachersCornerMessaging();" style="cursor: pointer;">
            <i class="fas fa-comments text-4xl text-indigo-500 mb-4"></i>
            <h3 id="tc-messages-count" class="text-4xl font-bold text-gray-800">0</h3>
            <p class="text-gray-500" data-translate="messages">Messages</p>
          </div>
          <div class="stat-card performance-card">
            <div class="performance-tiers">
              <div class="tier mustaid" onclick="event.stopPropagation(); filterStudentsByTier('mustaid')">
                <span class="tier-count" id="tc-mustaid-count">0</span>
                <span class="tier-label" data-translate="mustaid">Mustaid</span>
              </div>
              <div class="tier mutawassit" onclick="event.stopPropagation(); filterStudentsByTier('mutawassit')">
                <span class="tier-count" id="tc-mutawassit-count">0</span>
                <span class="tier-label" data-translate="mutawassit">Mutawassit</span>
              </div>
              <div class="tier mujtahid" onclick="event.stopPropagation(); filterStudentsByTier('mujtahid')">
                <span class="tier-count" id="tc-mujtahid-count">0</span>
                <span class="tier-label" data-translate="mujtahid">Mujtahid</span>
              </div>
            </div>
          </div>
        </div>

        
        <!-- Dashboard alerts -->
        <div id="dashboard-alerts" class="mb-8 bg-white p-6 rounded-lg shadow-md">
          <h3 class="text-xl font-semibold mb-4 text-gray-700 flex items-center gap-2">
            <i class="fas fa-exclamation-triangle text-yellow-500"></i>
            এক নজরে সতর্কতা
          </h3>
          <div id="alerts-content" class="space-y-3"></div>
        </div>
        <!-- Teacher's logbook -->
        <div class="bg-white p-6 rounded-lg shadow-md mb-8">
          <div class="flex justify-between items-center mb-4">
            <h3 class="text-xl font-semibold text-gray-700">📔 শিক্ষকের পাতা</h3>
            <button onclick="showAddLogModal()" class="btn-success text-white px-3 py-1 rounded-md text-sm font-semibold flex items-center gap-2"><i class="fas fa-plus"></i> নতুন বিবরণ</button>
          </div>
          <div class="logbook-tabs border-b border-gray-200 mb-4">
            <button onclick="switchLogTab('class')" class="tab-button py-2 px-4 text-gray-500 font-semibold active">শ্রেণী বিবরণ</button>
            <button onclick="switchLogTab('student')" class="tab-button py-2 px-4 text-gray-500 font-semibold">ছাত্র বিবরণ</button>
          </div>
          <div id="logbook-display" class="space-y-4 max-h-[400px] overflow-y-auto pr-2"></div>
        </div>
      </div>
      <!-- Student List & Education Progress -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div class="bg-white p-6 rounded-lg shadow-md">
          <div class="flex justify-between items-center mb-4">
            <h3 class="text-xl font-semibold text-gray-700">ছাত্রদের তালিকা</h3>
            <button onclick="clearStudentFilter()" class="text-sm text-blue-600 hover:text-blue-800 underline">সব ছাত্র দেখুন</button>
          </div>
          <div class="max-h-80 overflow-y-auto student-list-container">
            <table class="w-full text-sm text-left text-gray-600">
              <thead class="text-xs text-gray-700 uppercase bg-gray-50 sticky top-0">
                <tr>
                  <th class="px-3 py-2 text-center">হুসনুল খুলুক</th>
                  <th class="px-3 py-2">পরিচিতি</th>
                  <th class="px-3 py-2">নাম</th>
                </tr>
              </thead>
              <tbody id="class-student-list"></tbody>
            </table>
          </div>
        </div>
        <div class="bg-white p-6 rounded-lg shadow-md">
          <div class="flex justify-between items-center mb-4">
            <h3 class="text-xl font-semibold text-gray-700">দরসের পরিমাণ</h3>
            <div class="flex gap-2">
              <button onclick="showBookModal()" class="text-gray-500 hover:text-blue-500" title="নতুন বই যোগ করুন"><i class="fas fa-plus"></i></button>
            </div>
          </div>
          <div id="class-education-progress" class="space-y-3 max-h-80 overflow-y-auto"></div>
        </div>
      </div>
      
      <!-- Exam Management Section -->
      <div id="class-exam-management-section" class="mt-6">
        <!-- Exam management content will be inserted here -->
      </div>
      `;
      console.log('✅ Forced HTML refresh completed');
    }
  }
  // Load data once the HTML skeleton is ready
  await loadClassMapping();
  await loadStudentsFromMainApp();
  await loadAttendanceFromMainApp();
  
  // Set ready flag AFTER all data is loaded
  state.teachersCornerHtmlReady = true;
  console.log('✅ Initial data loaded; Teachers Corner ready for use');
  
  // Initialize messaging system to start updating unread count
  setTimeout(() => {
    if (typeof window.initializeTeachersMessaging === 'function') {
      window.initializeTeachersMessaging();
      console.log('📱 Teachers messaging system initialized for unread count updates');
    }
  }, 500);
  
  // Initialize Teachers Corner bottom navigation (only for normal users)
  setTimeout(() => {
    const isNormalUser = window.currentUser && window.currentUser.role === 'user';
    if (isNormalUser && window.innerWidth <= 768) {
      initTeachersCornerNav();
      console.log('📱 Teachers Corner navigation initialized (normal user)');
    } else if (!isNormalUser) {
      // For admins, ensure TC nav is hidden
      const tcNav = document.getElementById('teachers-corner-bottom-nav');
      if (tcNav) {
        tcNav.style.display = 'none';
      }
      console.log('📱 Teachers Corner navigation NOT initialized (admin user)');
    }
  }, 300);
}

// Display the dashboard for a particular class. This orchestrates
// loading books, logs, scores and then calls the rendering functions.
export async function showClassDashboard(className) {
  // Wait until the skeleton has been inserted and data loaded
  if (!state.teachersCornerHtmlReady) {
    console.log('⏳ Teachers Corner initialization not complete; waiting...');
    let tries = 0;
    const maxTries = 50; // Increased timeout for data loading
    while (!state.teachersCornerHtmlReady && tries < maxTries) {
      await new Promise((res) => setTimeout(res, 100));
      tries++;
      if (tries % 10 === 0) {
        console.log(`⏳ Still waiting for Teachers Corner initialization... (${tries}/${maxTries})`);
      }
    }
    if (!state.teachersCornerHtmlReady) {
      console.error('❌ Teachers Corner initialization timed out after 5 seconds');
      console.log('🔍 Attempting to initialize Teachers Corner manually...');
      await initTeachersCorner();
      if (!state.teachersCornerHtmlReady) {
        console.error('❌ Manual initialization also failed');
      return;
      }
    }
  }
  state.currentClass = className;
  saveSelectedClass(className); // Save to localStorage for persistence
  console.log(`🎯 Setting current class to: ${className}`);
  
  // Update dashboard title directly (bypass cache to ensure it works)
  const titleElement = document.getElementById('class-dashboard-title');
  if (titleElement) {
    titleElement.textContent = `${className} - Teachers Corner`;
    console.log(`✅ Updated dashboard title to: ${className} - Teachers Corner`);
  } else {
    console.error('❌ Could not find class-dashboard-title element');
  }
  // Filter students for this class
  const activeStudents = state.allStudents.filter((s) => s.class === className && s.status !== 'inactive');
  const inactiveStudents = state.allStudents.filter((s) => s.class === className && s.status === 'inactive');
  // Load books and convert them into progress objects
  const books = await loadBooksForClass(className);
  const existingProgress = [];
  try {
    const progressResponse = await fetch(`/api/education?class_name=${encodeURIComponent(className)}`);
    if (progressResponse.ok) {
      const progressList = await progressResponse.json();
      existingProgress.push(...progressList);
    }
  } catch (e) {
    console.error('Error loading existing progress:', e);
  }
  // Build allEducationProgress for this class
  state.allEducationProgress = await Promise.all(
    books.map(async (book) => {
      const existing = existingProgress.find((p) => p.book_id === book.id);
      const history = await loadProgressHistoryForBook(book.id, className);
      return {
        id: book.id,
        book_name: book.book_name,
        class_id: book.class_id,
        class_name: className,
        total_pages: book.total_pages || 100,
        completed_pages: existing ? existing.completed_pages : 0,
        notes: existing ? existing.notes : '',
        description: book.description || '',
        progressHistory: history,
        progress_record_id: existing ? existing.id : null,
      };
    }),
  );
  // Load teacher logs and scores
  await loadTeacherLogsFromDatabase(className);
  await loadStudentScoresFromDatabase(className);
  // Render the dashboard components
  renderTodaySummary(activeStudents);
  renderClassStudentList(activeStudents);
  renderClassEducationProgress(className);
  renderClassOverview(activeStudents);
  renderTeachersLogbook();
  renderDashboardAlerts(activeStudents);
  
  // Initialize and render exam management for this class
  console.log('🔄 Initializing exam management for class:', className);
  if (typeof window.initClassExamManagement === 'function') {
    await window.initClassExamManagement(className);
    
    // Insert exam management HTML into the designated section
    const examSectionElement = document.getElementById('class-exam-management-section');
    console.log('🔍 Exam section element found:', !!examSectionElement);
    console.log('🔍 renderClassExamSection function available:', typeof window.renderClassExamSection === 'function');
    
    if (examSectionElement && typeof window.renderClassExamSection === 'function') {
      const examHTML = window.renderClassExamSection(className);
      console.log('🔍 Exam HTML generated:', examHTML ? 'Yes' : 'No', examHTML ? `(${examHTML.length} chars)` : '');
      examSectionElement.innerHTML = examHTML;
      
      // Update exam statistics and list
      if (typeof window.updateClassExamStats === 'function') {
        window.updateClassExamStats(className);
      }
      if (typeof window.renderClassExamList === 'function') {
        window.renderClassExamList(className);
      }
      console.log('✅ Exam section rendered successfully');
    } else {
      console.warn('⚠️ Exam section element or renderClassExamSection function not available');
      console.log('🔍 Available elements with "exam" in ID:', Array.from(document.querySelectorAll('[id*="exam"]')).map(el => el.id));
      console.log('🔍 Available elements with "class" in ID:', Array.from(document.querySelectorAll('[id*="class"]')).map(el => el.id));
    }
  } else {
    console.warn('⚠️ window.initClassExamManagement function not available');
  }
  
  // Render messaging widget for teachers (with delay to ensure DOM is ready)
   console.log('🔄 Dashboard loaded successfully');
  
  // Update inactive students count
  updateElementText('class-inactive-students', inactiveStudents.length.toString());
  
  // Final title update to ensure it's set correctly after all operations
  const finalTitleElement = document.getElementById('class-dashboard-title');
  if (finalTitleElement && state.currentClass) {
    finalTitleElement.textContent = `${state.currentClass} - Teachers Corner`;
    console.log(`🎯 Final title update: ${state.currentClass} - Teachers Corner`);
  }
  
  // Show Teachers Corner bottom navigation when class is selected (mobile only, normal users only)
  // Admins keep their main navigation
  const isNormalUser = window.currentUser && window.currentUser.role === 'user';
  if (isNormalUser && window.innerWidth <= 768 && className) {
    showTeachersCornerNav();
    // Set dashboard as active tab
    setTimeout(() => {
      switchTeachersCornerTab('dashboard');
    }, 200);
  } else if (!isNormalUser) {
    // For admins, ensure main nav is visible
    const mainNav = document.querySelector('.mobile-bottom-nav');
    if (mainNav && window.innerWidth <= 768) {
      mainNav.style.display = 'flex';
    }
    // Hide TC nav
    const tcNav = document.getElementById('teachers-corner-bottom-nav');
    if (tcNav) {
      tcNav.style.display = 'none';
    }
  }
}

// Render the summary cards for today: total students, present, absent and attendance rate.
export function renderTodaySummary(students) {
  // Only update if we have a current class selected
  if (!state.currentClass) {
    console.log('⚠️ No class selected, skipping dashboard update');
    return;
  }
  
  const total = students.length;
  const today = getTodayString();
  let present = 0;
  let absent = 0;
  const attendanceData = state.attendance && state.attendance[today] ? state.attendance[today] : {};
  
  students.forEach((student) => {
    const record = attendanceData[student.id];
    if (record) {
      if (record.status === 'present') {
        present++;
      } else if (record.status === 'absent') {
        absent++;
      }
    }
  });
  
  const rate = (present + absent) > 0 ? Math.round((present / (present + absent)) * 100) : 0;
  
  // Update elements only if they exist
  const totalEl = document.getElementById('class-total-students');
  const presentEl = document.getElementById('class-present-today');
  const absentEl = document.getElementById('class-absent-today');
  const rateEl = document.getElementById('class-attendance-rate');
  
  if (totalEl) totalEl.textContent = total.toString();
  if (presentEl) presentEl.textContent = present.toString();
  if (absentEl) absentEl.textContent = absent.toString();
  if (rateEl) {
    rateEl.textContent = `${rate}%`;
    rateEl.classList.remove('attendance-high', 'attendance-medium', 'attendance-low');
    if (rate >= 80) rateEl.classList.add('attendance-high');
    else if (rate >= 60) rateEl.classList.add('attendance-medium');
    else rateEl.classList.add('attendance-low');
  }
  
  console.log(`✅ Updated dashboard for ${state.currentClass}: ${total} students, ${present} present, ${absent} absent, ${rate}% rate`);
  
  // Mobile only: Combine attendance cards into one horizontal row (≤ 768px)
  if (window.innerWidth <= 768) {
    // Disabled - using new performance-tiers structure instead
    // setTimeout(() => combineAttendanceCardsForMobile(), 100);
  }
}

// Reset dashboard when no class is selected
export function resetDashboard() {
  const totalEl = document.getElementById('class-total-students');
  const presentEl = document.getElementById('class-present-today');
  const absentEl = document.getElementById('class-absent-today');
  const rateEl = document.getElementById('class-attendance-rate');
  const inactiveEl = document.getElementById('class-inactive-students');
  const mustaidEl = document.getElementById('class-mustaid-count') || document.getElementById('tc-mustaid-count');
  const mutawassitEl = document.getElementById('class-mutawassit-count') || document.getElementById('tc-mutawassit-count');
  const mujtahidEl = document.getElementById('class-mujtahid-count') || document.getElementById('tc-mujtahid-count');
  
  if (totalEl) totalEl.textContent = '0';
  if (presentEl) presentEl.textContent = '0';
  if (absentEl) absentEl.textContent = '0';
  if (rateEl) rateEl.textContent = '0%';
  if (inactiveEl) inactiveEl.textContent = '0';
  if (mustaidEl) mustaidEl.textContent = '0';
  if (mutawassitEl) mutawassitEl.textContent = '0';
  if (mujtahidEl) mujtahidEl.textContent = '0';
  
  // Clear all alerts
  state.currentAlerts = [];
  window.currentAlerts = [];
  const alertsContent = document.getElementById('alerts-content');
  if (alertsContent) {
    alertsContent.innerHTML = `<p class="text-sm text-gray-500 text-center py-4">কোনো সতর্কতা নেই</p>`;
  }
  
  // Hide Teachers Corner nav when no class is selected (mobile only, normal users only)
  const isNormalUser = window.currentUser && window.currentUser.role === 'user';
  if (isNormalUser && window.innerWidth <= 768 && typeof hideTeachersCornerNav === 'function') {
    hideTeachersCornerNav();
  }
  
  console.log('🔄 Dashboard reset - no class selected');
}

// Update messages count in the dashboard card
export function updateMessagesCount(count = 0) {
  console.log('🔄 updateMessagesCount called with count:', count);
  const countElement = document.getElementById('class-messages-count') || document.getElementById('tc-messages-count');
  if (countElement) {
    countElement.textContent = count.toString();
    
    // Set color based on count: red if unread, black if no unread
    if (count > 0) {
      countElement.className = 'text-4xl font-bold text-red-500'; // Red for unread messages
      countElement.style.color = '#ef4444'; // Force red color with inline style
      console.log('✅ Set messages count to RED for count:', count);
      console.log('🔍 Element classes after update:', countElement.className);
    } else {
      countElement.className = 'text-4xl font-bold text-gray-800'; // Black for no unread messages
      countElement.style.color = '#1f2937'; // Force black color with inline style
      console.log('✅ Set messages count to BLACK for count:', count);
      console.log('🔍 Element classes after update:', countElement.className);
    }
  } else {
    console.log('❌ class-messages-count element not found');
  }
}

// Open teachers corner messaging interface - DIRECT CONVERSATION WINDOW
export function openTeachersCornerMessaging() {
  console.log('💬 Opening direct conversation window');
  
  // Check if conversation window is already open
  let conversationWindow = document.getElementById('direct-conversation-window');
  
  if (conversationWindow) {
    conversationWindow.style.display = 'flex';
    return;
  }
  
  // Create direct conversation window
  conversationWindow = document.createElement('div');
  conversationWindow.id = 'direct-conversation-window';
  conversationWindow.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center';
  conversationWindow.style.zIndex = '9999'; // Higher than navigation (100) and other elements
  conversationWindow.innerHTML = `
    <div class="bg-white rounded-lg shadow-2xl w-full max-w-5xl" style="height: 600px; max-height: 80vh;">
      <!-- Header -->
      <div class="flex justify-between items-center p-3 border-b bg-indigo-50 rounded-t-lg" style="height: 60px; flex-shrink: 0;">
        <h2 class="text-xl font-bold text-gray-800 flex items-center">
          <i class="fas fa-comments text-indigo-500 mr-2"></i>
          Conversation
        </h2>
        <button onclick="closeDirectConversation()" class="text-gray-500 hover:text-gray-700 text-xl p-2 hover:bg-gray-100 rounded-full transition-colors">
          <i class="fas fa-times"></i>
        </button>
      </div>
      
      <!-- Conversation Interface -->
      <div style="height: calc(100% - 60px); overflow: hidden;">
        <div id="teachersMessagingWidget" class="messaging-widget expanded" style="height: 100%; padding: 0; margin: 0;">
          <div class="loading-state">
            <div class="spinner-container">
              <i class="fas fa-spinner fa-spin"></i>
            </div>
            <p>Loading conversation...</p>
          </div>
        </div>
      </div>
    </div>
  `;
  
  document.body.appendChild(conversationWindow);
  
  // Add custom CSS to remove extra spacing
  const style = document.createElement('style');
  style.textContent = `
    #direct-conversation-window .inline-chat-container {
      height: 100% !important;
      padding: 0 !important;
      margin: 0 !important;
      display: flex !important;
      flex-direction: column !important;
    }
    #direct-conversation-window .inline-chat-header {
      padding: 6px 12px !important;
      margin: 0 !important;
      flex-shrink: 0 !important;
      height: auto !important;
    }
    #direct-conversation-window .inline-chat-messages {
      padding: 6px 12px !important;
      margin: 0 !important;
      flex: 1 !important;
      overflow-y: auto !important;
      max-height: none !important;
    }
    #direct-conversation-window .inline-chat-input {
      padding: 6px 12px !important;
      margin: 0 !important;
      flex-shrink: 0 !important;
    }
    #direct-conversation-window .start-conversation-content {
      padding: 6px 12px !important;
      margin: 0 !important;
      flex: 1 !important;
      display: flex !important;
      flex-direction: column !important;
      justify-content: center !important;
    }
    #direct-conversation-window .messaging-widget {
      height: 100% !important;
      display: flex !important;
      flex-direction: column !important;
    }
  `;
  document.head.appendChild(style);
  
  // Initialize messaging system and load conversation directly
  setTimeout(() => {
    if (typeof window.initializeTeachersMessaging === 'function') {
      window.initializeTeachersMessaging();
      
      // Load the conversation interface directly
      setTimeout(() => {
        if (typeof window.loadInlineMessagingInterface === 'function') {
          window.loadInlineMessagingInterface();
        }
      }, 200);
    }
  }, 100);
}

// Close direct conversation window
export function closeDirectConversation() {
  console.log('💬 Closing direct conversation window');
  const conversationWindow = document.getElementById('direct-conversation-window');
  if (conversationWindow) {
    conversationWindow.remove();
  }
  
  // Clean up custom styles
  const customStyles = document.querySelectorAll('style');
  customStyles.forEach(style => {
    if (style.textContent && style.textContent.includes('#direct-conversation-window')) {
      style.remove();
    }
  });
}

// Legacy functions - keeping for compatibility
export function closeInlineMessaging() {
  closeDirectConversation();
}

export function closeFloatingMessaging() {
  closeDirectConversation();
}

// Render the class overview and recent logs.
export function renderClassOverview(students) {
  // Categorize students by Husnul Khuluk score
  const performance = { mustaid: 0, mutawassit: 0, mujtahid: 0 };
  students.forEach((s) => {
    const score = state.studentScores[s.id] || 0;
    if (score >= 80) performance.mustaid++;
    else if (score >= 60) performance.mutawassit++;
    else performance.mujtahid++;
  });
  
  // Update the performance card with tier counts
  const mustaidEl = document.getElementById('class-mustaid-count');
  const mutawassitEl = document.getElementById('class-mutawassit-count');
  const mujtahidEl = document.getElementById('class-mujtahid-count');
  
  // Update both old and new IDs for compatibility
  const tcMustaidEl = document.getElementById('tc-mustaid-count');
  const tcMutawassitEl = document.getElementById('tc-mutawassit-count');
  const tcMujtahidEl = document.getElementById('tc-mujtahid-count');
  
  if (mustaidEl) mustaidEl.textContent = performance.mustaid;
  if (mutawassitEl) mutawassitEl.textContent = performance.mutawassit;
  if (mujtahidEl) mujtahidEl.textContent = performance.mujtahid;
  
  // Also update new IDs in Row 3
  if (tcMustaidEl) tcMustaidEl.textContent = performance.mustaid;
  if (tcMutawassitEl) tcMutawassitEl.textContent = performance.mutawassit;
  if (tcMujtahidEl) tcMujtahidEl.textContent = performance.mujtahid;
}

// Filter students by performance tier (mustaid, mutawassit, mujtahid) and
// update the student list and dashboard title accordingly. This function
// is attached to the window object in the main file.
export function filterStudentsByTier(tier) {
  const studentsInClass = state.allStudents.filter((s) => s.class === state.currentClass);
  let filtered = [];
  switch (tier) {
    case 'mustaid':
      filtered = studentsInClass.filter((s) => (state.studentScores[s.id] || 0) >= 80);
      break;
    case 'mutawassit':
      filtered = studentsInClass.filter((s) => {
        const score = state.studentScores[s.id] || 0;
        return score >= 60 && score < 80;
      });
      break;
    case 'mujtahid':
      filtered = studentsInClass.filter((s) => (state.studentScores[s.id] || 0) < 60);
      break;
    default:
      filtered = studentsInClass;
  }
  renderClassStudentList(filtered);
  const tierLabels = {
    mustaid: 'মুস্তাইদ (مستعد)',
    mutawassit: 'মুতাওয়াসসিত (متوسط)',
    mujtahid: 'মুজতাহিদ (مجتهد)',
  };
  if (tier !== 'all') {
    const titleHTML = `${state.currentClass} - Teachers Corner <span class="text-lg font-normal text-gray-600">(${tierLabels[tier]} - ${filtered.length} জন)</span> <button onclick="clearStudentFilter()" class="ml-2 text-sm text-blue-600 hover:text-blue-800 underline">সব ছাত্র দেখুন</button>`;
    updateElementHTML('class-dashboard-title', titleHTML);
  }
}

// Clear any performance filter and show all students in the list.
export function clearStudentFilter() {
  const studentsInClass = state.allStudents.filter((s) => s.class === state.currentClass);
  renderClassStudentList(studentsInClass);
  // Update dashboard title directly
  const titleElement = document.getElementById('class-dashboard-title');
  if (titleElement && state.currentClass) {
    titleElement.textContent = `${state.currentClass} - Teachers Corner`;
    console.log(`✅ Updated dashboard title to: ${state.currentClass} - Teachers Corner`);
  }
}

// Render alerts summarizing issues in the class (low scores, no progress, low attendance).
export function renderDashboardAlerts(students) {
  const alerts = [];
  
  // Low score alert
    const lowScoreStudents = students.filter((s) => (state.studentScores[s.id] || 0) < ALERT_CONFIG.LOW_SCORE_THRESHOLD);
    if (lowScoreStudents.length > 0) {
      alerts.push({
        type: 'warning',
        icon: 'fas fa-user-times',
        title: 'হুসনুল খুলুক কম',
        message: `${lowScoreStudents.length} জন ছাত্রের হুসনুল খুলুক ${ALERT_CONFIG.LOW_SCORE_THRESHOLD} এর নিচে।`,
        action: 'হুসনুল খুলুক দেখুন',
        onClick: () => showLowScoreStudents(lowScoreStudents),
      });
    }
  
  // Critical score alert
  const criticalScoreStudents = students.filter((s) => (state.studentScores[s.id] || 0) < ALERT_CONFIG.CRITICAL_SCORE_THRESHOLD);
  if (criticalScoreStudents.length > 0) {
    alerts.push({
      type: 'danger',
      icon: 'fas fa-exclamation-triangle',
      title: 'হুসনুল খুলুক খুবই কম',
      message: `${criticalScoreStudents.length} জন ছাত্রের হুসনুল খুলুক ${ALERT_CONFIG.CRITICAL_SCORE_THRESHOLD} এর নিচে।`,
      action: 'তাত্ক্ষণিক পদক্ষেপ',
      onClick: () => showCriticalScoreStudents(criticalScoreStudents),
    });
  }
  
  // No progress alert
  const classProgress = state.allEducationProgress.filter(p => p.class_name === state.currentClass);
  const studentsWithNoProgress = students.filter(s => {
    const hasProgress = classProgress.some(p => {
      const progress = p.completed_pages || 0;
      const total = p.total_pages || 100;
      return progress > 0 && (progress / total) > 0.1; // At least 10% progress
    });
    return !hasProgress;
  });
  
  if (studentsWithNoProgress.length > 0) {
    alerts.push({
      type: 'info',
      icon: 'fas fa-book-open',
      title: 'অগ্রগতি নেই',
      message: `${studentsWithNoProgress.length} জন ছাত্রের কোনো শিক্ষার অগ্রগতি নেই।`,
      action: 'অগ্রগতি দেখুন',
      onClick: () => showStudentsWithNoProgress(studentsWithNoProgress),
    });
  }
  
  // Low attendance alert
  const today = new Date().toISOString().split('T')[0];
  const todayAttendance = state.attendance && state.attendance[today] ? state.attendance[today] : {};
  const lowAttendanceStudents = students.filter(s => {
    const attendance = todayAttendance[s.id];
    return attendance && attendance.status === 'absent';
  });
  
  if (lowAttendanceStudents.length > 0) {
    alerts.push({
      type: 'warning',
      icon: 'fas fa-user-times',
      title: 'আজ অনুপস্থিত',
      message: `${lowAttendanceStudents.length} জন ছাত্র আজ অনুপস্থিত।`,
      action: 'উপস্থিতি দেখুন',
      onClick: () => showAbsentStudentsAlert(lowAttendanceStudents),
    });
  }

  // 15-day class log reminder alert
  if (state.currentClass) {
    checkFifteenDayReminder(state.currentClass);
  }
  const alertsContent = document.getElementById('alerts-content');
  if (!alertsContent) return;
  
  // Store alerts globally for click handling (initialize with current alerts)
  state.currentAlerts = alerts;
  window.currentAlerts = alerts;
  
  if (alerts.length === 0) {
    alertsContent.innerHTML = `<p class="text-sm text-gray-500 text-center py-4">কোনো সতর্কতা নেই</p>`;
  } else {
    alertsContent.innerHTML = alerts
      .map((alert, idx) => {
        const config = ALERT_CONFIG.ALERT_TYPES[alert.type] || {};
        return `<div class="flex items-center justify-between p-3 rounded-lg ${config.bg || ''} ${config.border || ''}">
          <div class="flex items-center gap-3">
            <i class="${alert.icon} ${config.icon || ''}"></i>
            <div>
              <div class="font-semibold text-sm ${config.text || ''}">${alert.title}</div>
              <div class="text-xs ${(config.text || '').replace('800', '600')}">${alert.message}</div>
            </div>
          </div>
          <button onclick="handleAlertClick(${idx})" class="text-xs px-3 py-1 rounded ${(config.bg || '').replace('50', '100')} ${(config.text || '').replace('800', '700')} hover:${(config.bg || '').replace('50', '200')}">${alert.action}</button>
        </div>`;
      })
      .join('');
  }
}

// Render the student list for the current class or a filtered subset.
export function renderClassStudentList(students) {
  const listEl = document.getElementById('class-student-list');
  if (!listEl) return;
  if (students.length === 0) {
    listEl.innerHTML = `<tr><td colspan="3" class="text-center p-4">কোনো ছাত্র নেই</td></tr>`;
    return;
  }
  listEl.innerHTML = students
    .map((s) => {
      const score = state.studentScores[s.id] || 0;
      let scoreClass = 'score-attention';
      if (score >= 80) scoreClass = 'score-good';
      else if (score >= 60) scoreClass = 'score-average';
      return `<tr class="border-b hover:bg-gray-50"><td class="px-4 py-2 text-center"><span onclick="editHusnulKhuluk('${s.id}', ${score})" class="score-badge ${scoreClass}" title="হুসনুল খুলুক পরিবর্তন করুন">${score}</span></td><td class="px-4 py-2 font-medium">${s.rollNumber}</td><td onclick="showStudentDetail('${s.id}', 'teachers-corner')" class="px-4 py-2 text-blue-600 hover:underline cursor-pointer">${s.name}</td></tr>`;
    })
    .join('');
}

// Render the education progress list for the selected class. It
// transforms each book into a progress widget with a progress bar and
// optional notes.
export function renderClassEducationProgress(className) {
  const progressEl = document.getElementById('class-education-progress');
  if (!progressEl) return;
  const classProgress = state.allEducationProgress.filter((p) => p.class_name === className);
  if (classProgress.length === 0) {
    progressEl.innerHTML = `<p class="text-sm text-gray-500">এই শ্রেণীতে এখনও কোনো বই যোগ করা হয়নি।</p>`;
    return;
  }
  progressEl.innerHTML = classProgress
    .map((p) => {
      const completed = p.completed_pages || 0;
      const total = p.total_pages || 0;
      const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
      const remaining = total - completed;
      const lastUpdate = p.progressHistory && p.progressHistory.length > 0 ? p.progressHistory[p.progressHistory.length - 1] : null;
      return `<div class="mb-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
        <div class="flex justify-between items-start mb-2">
          <span onclick="showBookModal('${p.id}')" class="text-sm font-medium text-gray-700 hover:text-blue-500 cursor-pointer" title="বই সম্পাদনা করুন">${p.book_name}</span>
          <span class="text-xs text-gray-500">${completed}/${total} পৃষ্ঠা</span>
        </div>
        <div class="w-full bg-gray-200 rounded-full h-2.5 mb-2"><div class="bg-blue-500 h-2.5 rounded-full transition-all duration-300" style="width: ${percentage}%"></div></div>
        <div class="flex justify-between items-center text-xs text-gray-600">
          <span>অগ্রগতি: ${percentage}% (${remaining} পৃষ্ঠা বাকি)</span>
          ${lastUpdate ? `<span class="text-gray-500"><i class="fas fa-clock mr-1"></i>${new Date(lastUpdate.date).toLocaleDateString('bn-BD')}</span>` : ''}
        </div>
        ${p.notes ? `<div class="mt-2 p-2 bg-white rounded border-l-2 border-green-300"><div class="text-xs text-gray-600 italic"><i class="fas fa-sticky-note mr-1 text-green-500"></i><strong>নোট:</strong> ${p.notes}</div></div>` : ''}
      </div>`;
    })
    .join('');
}

// Render the teacher logbook for the current class. This uses the
// state.teachersLogbook data and respects the current log tab (class or
// student). The actual editing and deletion of logs is handled by
// functions in the logbook module.
export function renderTeachersLogbook() {
  const displayEl = document.getElementById('logbook-display');
  if (!displayEl) return;
  const book = state.teachersLogbook[state.currentClass] || { class_logs: [], student_logs: {} };
  let logsToShow = [];
  let logTitle = '';
  if (state.currentLogTab === 'class') {
    logsToShow = book.class_logs || [];
    logTitle = 'শ্রেণী বিবরণ';
  } else {
    Object.values(book.student_logs || {}).forEach((studentLogs) => {
      logsToShow.push(...studentLogs);
    });
    logTitle = 'ছাত্র বিবরণ';
  }
  logsToShow.sort((a, b) => new Date(b.date) - new Date(a.date));
  if (logsToShow.length === 0) {
    displayEl.innerHTML = `<div class="text-center text-sm text-gray-500 p-4"><i class="fas fa-info-circle text-2xl mb-2"></i><p>কোনো ${logTitle} পাওয়া যায়নি।</p><p class="text-xs mt-1">নতুন বিবরণ যোগ করতে উপরের "নতুন বিবরণ" বোতামে ক্লিক করুন।</p></div>`;
    return;
  }
  if (state.currentLogTab === 'student') {
    // Group logs by student and show only the latest log for each student
    const studentLatestLogs = {};
    
    // Group all logs by student ID and find the latest log for each
    logsToShow.forEach((log) => {
      const studentId = log.studentId;
      if (!studentLatestLogs[studentId]) {
        studentLatestLogs[studentId] = {
          latestLog: log,
          allLogs: book.student_logs[studentId] || []
        };
      }
    });
    
    // Convert to array and sort by latest log date (most recent first)
    const studentsArray = Object.entries(studentLatestLogs).map(([studentId, data]) => {
      return {
        studentId: studentId,
        latestLog: data.latestLog,
        allLogs: data.allLogs.sort((a, b) => new Date(b.date) - new Date(a.date))
      };
    }).sort((a, b) => new Date(b.latestLog.date) - new Date(a.latestLog.date));
    
    // Render each student's latest log with expandable older logs
    displayEl.innerHTML = studentsArray.map((studentData) => {
      const log = studentData.latestLog;
      const student = state.allStudents.find((s) => s.id === studentData.studentId);
      const studentName = student ? student.name : 'Unknown Student';
      const isExpanded = state.expandedStudents.has(studentName);
      
      // Get older logs (excluding the latest one)
      const olderLogs = studentData.allLogs.filter(l => l.id !== log.id);
      const hasOlderLogs = olderLogs.length > 0;
      
      const studentRoll = student ? student.rollNumber || student.roll || '' : '';
      
      return `
        <div class="mb-3">
          <div class="bg-gray-50 p-3 rounded-md border-l-4 ${log.isImportant ? 'border-red-500' : 'border-blue-500'}">
            <div class="flex justify-between items-start mb-2">
              <div class="flex-1">
                <div class="flex items-center gap-2 flex-wrap mb-1">
                  <span class="font-semibold text-gray-800">${studentName}</span>
                  ${studentRoll ? `<span class="text-xs text-gray-600">(পরিচিতি: ${studentRoll})</span>` : ''}
                  ${log.isImportant ? '<span class="bg-red-100 text-red-800 text-xs px-2 py-1 rounded">গুরুত্বপূর্ণ</span>' : ''}
                  ${log.needsFollowup ? '<span class="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded">অনুসরণ প্রয়োজন</span>' : ''}
                  <span class="text-xs text-gray-500">- ${new Date(log.date).toLocaleDateString('bn-BD')}</span>
                </div>
                <p class="text-sm text-gray-800">${log.details}</p>
              </div>
              <div class="log-actions flex gap-2 text-gray-500">
                <button onclick="editLog('${log.id}')" class="hover:text-blue-500" title="সম্পাদনা করুন"><i class="fas fa-edit text-xs"></i></button>
                <button onclick="deleteLog('${log.id}')" class="hover:text-red-500" title="মুছুন"><i class="fas fa-trash text-xs"></i></button>
              </div>
            </div>
            ${hasOlderLogs ? `
              <div class="mt-2 pt-2 border-t border-gray-200">
                <button onclick="toggleStudentExpansion('${studentName}')" 
                        class="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center gap-1">
                  <i class="fas fa-${isExpanded ? 'chevron-down' : 'chevron-right'} text-xs"></i>
                  <span>${olderLogs.length} টি পুরাতন বিবরণ দেখুন</span>
                </button>
              </div>
            ` : ''}
          </div>
          ${isExpanded && hasOlderLogs ? `
            <div class="ml-4 mt-2 space-y-2">
              ${olderLogs.map(olderLog => `
                <div class="bg-blue-50 p-3 rounded-md border-l-4 border-blue-400">
                  <div class="flex justify-between items-start mb-2">
                    <div class="flex-1">
                      <div class="flex items-center gap-2 flex-wrap mb-1">
                        <span class="font-semibold text-gray-700">${studentName}</span>
                        ${studentRoll ? `<span class="text-xs text-gray-600">(পরিচিতি: ${studentRoll})</span>` : ''}
                        ${olderLog.isImportant ? '<span class="bg-red-100 text-red-800 text-xs px-2 py-1 rounded">গুরুত্বপূর্ণ</span>' : ''}
                        ${olderLog.needsFollowup ? '<span class="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded">অনুসরণ প্রয়োজন</span>' : ''}
                        <span class="text-xs text-gray-500">- ${new Date(olderLog.date).toLocaleDateString('bn-BD')}</span>
                      </div>
                      <p class="text-sm text-gray-800">${olderLog.details}</p>
                    </div>
                    <div class="log-actions flex gap-2 text-gray-500">
                      <button onclick="editLog('${olderLog.id}')" class="hover:text-blue-500" title="সম্পাদনা করুন"><i class="fas fa-edit text-xs"></i></button>
                      <button onclick="deleteLog('${olderLog.id}')" class="hover:text-red-500" title="মুছুন"><i class="fas fa-trash text-xs"></i></button>
                    </div>
                  </div>
                </div>
              `).join('')}
            </div>
          ` : ''}
        </div>
      `;
    }).join('');
  } else {
    displayEl.innerHTML = logsToShow.map((log) => renderLogEntry(log, false)).join('');
  }
}

// Render a single log entry. The `isStudentLog` flag determines
// whether to include the student name in the header. Priority flags
// (important, needs follow-up) are added as needed.
export function renderLogEntry(log, isStudentLog) {
  const student = log.studentId ? state.allStudents.find((s) => s.id === log.studentId) : null;
  const priorityFlags = [];
  if (log.isImportant) priorityFlags.push('<span class="bg-red-100 text-red-800 text-xs px-2 py-1 rounded">গুরুত্বপূর্ণ</span>');
  if (log.needsFollowup) priorityFlags.push('<span class="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded">অনুসরণ প্রয়োজন</span>');
  const logTypeLabel = isStudentLog ? `ছাত্র বিবরণ` : `শ্রেণী বিবরণ`;
  const studentInfo = student ? ` (${student.name})` : '';
  
  // Calculate delay for class-level logs
  // Delay indicator should only show for logs that were delayed when CREATED
  // (i.e., created more than 15 days after the previous log)
  let delayIndicator = '';
  if (!isStudentLog && state.currentClass) {
    const classLogs = state.teachersLogbook[state.currentClass]?.class_logs || [];
    
    // Helper function to get date from log (normalize to date-only for comparison)
    const getLogDate = (logEntry) => {
      const dateStr = logEntry.date || logEntry.created_at || logEntry.log_date;
      if (!dateStr) return null;
      try {
        const date = new Date(dateStr);
        // Check if date is valid
        if (isNaN(date.getTime())) return null;
        // Normalize to midnight to avoid time component issues
        date.setHours(0, 0, 0, 0);
        return date;
      } catch (e) {
        console.error(`❌ Invalid date for log ${logEntry.id}:`, dateStr);
        return null;
      }
    };
    
    const currentLogDate = getLogDate(log);
    if (!currentLogDate) {
      console.log(`⚠️ Could not get date for log ${log.id}, skipping delay calculation`);
    } else if (classLogs.length <= 1) {
      // First log or only log - no previous log to compare, so no delay
      console.log(`✅ Log ${log.id} is the first log (no delay indicator)`);
    } else {
      // Helper function to get full timestamp (not just date) for ordering logs created on same day
      const getLogTimestamp = (logEntry) => {
        const dateStr = logEntry.date || logEntry.created_at || logEntry.log_date;
        if (!dateStr) return null;
        try {
          const date = new Date(dateStr);
          if (isNaN(date.getTime())) return null;
          return date.getTime();
        } catch (e) {
          return null;
        }
      };
      
      const currentLogTimestamp = getLogTimestamp(log);
      
      // Find all logs created BEFORE this log (by full timestamp, excluding current log)
      // This handles same-day logs correctly - logs created earlier on the same day will be found
      const previousLogs = classLogs.filter(l => {
        // Exclude current log by ID comparison
        if (String(l.id) === String(log.id)) return false;
        const logTimestamp = getLogTimestamp(l);
        if (!logTimestamp || !currentLogTimestamp || isNaN(logTimestamp) || isNaN(currentLogTimestamp)) return false;
        // Use strict timestamp comparison (less than) to find logs created BEFORE this one
        // This includes logs created earlier on the same day
        return logTimestamp < currentLogTimestamp;
      });
      
      // Debug: Log all previous logs found
      if (previousLogs.length > 0) {
        console.log(`🔍 Previous logs for ${log.id}:`, previousLogs.map(l => ({
          id: l.id,
          date: (l.date || l.created_at || l.log_date),
          timestamp: getLogTimestamp(l)
        })));
      }
      
      if (previousLogs.length === 0) {
        // No previous logs found - this is likely the earliest log, no delay
        console.log(`✅ Log ${log.id} has no previous logs (no delay indicator)`);
      } else {
        // Find the most recent previous log (the one right before this log was created)
        // Sort by full timestamp to handle same-day logs correctly - most recent first
        const sortedPreviousLogs = [...previousLogs].sort((a, b) => {
          const timestampA = getLogTimestamp(a);
          const timestampB = getLogTimestamp(b);
          if (!timestampA || !timestampB) return 0;
          return timestampB - timestampA; // Most recent first
        });
        
        // The FIRST log in sortedPreviousLogs is the immediately previous log (by timestamp)
        const previousLog = sortedPreviousLogs[0];
        const previousLogDate = getLogDate(previousLog);
        const previousLogTimestamp = getLogTimestamp(previousLog);
        
        console.log(`🔍 Selected previous log for ${log.id}: ${previousLog.id} (date: ${previousLogDate?.toLocaleDateString()}, timestamp: ${previousLogTimestamp})`);
        
        if (previousLogDate && previousLogTimestamp) {
          // Calculate days between when THIS log was created and when the PREVIOUS log was created
          // First check if they're on the same day by comparing normalized dates
          let daysSincePreviousLog;
          
          // Check if both logs are on the same calendar day (normalized to midnight)
          const currentLogDateNormalized = currentLogDate.getTime();
          const previousLogDateNormalized = previousLogDate.getTime();
          
          console.log(`📅 Date comparison for ${log.id}: Current=${currentLogDateNormalized} (${currentLogDate.toLocaleDateString()}), Previous=${previousLogDateNormalized} (${previousLogDate.toLocaleDateString()})`);
          
          if (currentLogDateNormalized === previousLogDateNormalized) {
            // Same day - no delay (0 days)
            daysSincePreviousLog = 0;
            console.log(`✅ Log ${log.id} and previous log ${previousLog.id} are on the same day (${currentLogDate.toLocaleDateString()}) - 0 days, NO DELAY`);
          } else {
            // Different days - calculate days difference using normalized dates
            const timeDiff = currentLogDateNormalized - previousLogDateNormalized;
            daysSincePreviousLog = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
            
            // Additional check: if daysSincePreviousLog is 0 or negative, something is wrong
            if (daysSincePreviousLog <= 0) {
              console.warn(`⚠️ Unexpected: Log ${log.id} has ${daysSincePreviousLog} days since previous log, but dates are different. Current: ${currentLogDate.toLocaleDateString()}, Previous: ${previousLogDate.toLocaleDateString()}`);
              daysSincePreviousLog = 0; // Treat as same day to avoid showing incorrect delay
            }
            
            console.log(`📊 Log ${log.id}: ${daysSincePreviousLog} days since previous log ${previousLog.id} (${currentLogDate.toLocaleDateString()} vs ${previousLogDate.toLocaleDateString()})`);
          }
          
          // If this log was created more than 15 days after the previous log,
          // it means it was delayed when created - show delay indicator
          if (daysSincePreviousLog > 15) {
            const delayDays = daysSincePreviousLog - 15;
            delayIndicator = `<span class="bg-orange-100 text-orange-800 text-xs px-2 py-1 rounded ml-2 font-semibold">Delay: ${delayDays} days</span>`;
            console.log(`📅 ✅ Delay indicator for log ${log.id}: ${delayDays} days (created ${daysSincePreviousLog} days after previous log)`);
          } else {
            // Log was created on time (within 15 days) - no delay indicator
            // This includes logs created on the same day as the previous log (0 days)
            console.log(`✅ Log ${log.id} was created on time (${daysSincePreviousLog} days after previous log, NO DELAY INDICATOR)`);
          }
        } else {
          console.log(`⚠️ Could not get date for previous log ${previousLog.id}`);
        }
      }
    }
  }
  
  return `<div class="log-entry bg-gray-50 p-3 rounded-md relative ${log.isImportant ? 'border-l-4 border-red-500' : 'border-l-4 border-blue-500'}"><div class="flex justify-between items-start"><div class="flex-1"><div class="text-xs text-gray-500 mb-1"><span><strong>${logTypeLabel}${studentInfo}</strong></span> - <span>${new Date(log.date || log.created_at || log.log_date).toLocaleDateString('bn-BD')}</span>${delayIndicator}${
    priorityFlags.length > 0 ? `<div class="mt-1 flex gap-1">${priorityFlags.join('')}</div>` : ''
  }</div><p class="text-sm text-gray-800">${log.details}</p></div><div class="log-actions flex gap-2 text-gray-500"><button onclick="editLog('${log.id}')" class="hover:text-blue-500" title="সম্পাদনা করুন"><i class="fas fa-edit text-xs"></i></button><button onclick="deleteLog('${log.id}')" class="hover:text-red-500" title="মুছুন"><i class="fas fa-trash text-xs"></i></button></div></div></div>`;
}

// Generate a print-friendly view of a student's profile. The
// implementation from the original teachers-corner.js is very long and
// can be migrated here when ready. This stub will call an existing
// global implementation if it exists.
export function generateStudentDetailPrint(student, attendanceStats, studentLogs, scoreHistory) {
  if (typeof window.generateStudentDetailPrint === 'function') {
    return window.generateStudentDetailPrint(student, attendanceStats, studentLogs, scoreHistory);
  }
  console.warn('generateStudentDetailPrint is not implemented in the modular version yet');
  return '';
}

// Show student photo in popup modal
export function showStudentPhotoPopup(photoPath) {
    console.log('🖼️ showStudentPhotoPopup called with:', photoPath);
    if (!photoPath) {
        console.warn('⚠️ No photo path provided');
        return;
    }
    
    // Create modal overlay
    const modal = document.createElement('div');
    modal.id = 'student-photo-popup-modal';
    modal.className = 'fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center';
    modal.style.cssText = 'position: fixed !important; top: 0 !important; left: 0 !important; width: 100% !important; height: 100% !important; background: rgba(0,0,0,0.9) !important; display: flex !important; align-items: center !important; justify-content: center !important; z-index: 99999 !important; visibility: visible !important; opacity: 1 !important;';
    
    modal.innerHTML = `
        <div style="position: relative; width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; padding: 20px;">
            <img src="/${photoPath}" alt="Student Photo" style="max-width: 95vw !important; max-height: 90vh !important; width: auto !important; height: auto !important; min-width: 300px !important; min-height: 300px !important; object-fit: contain !important; border-radius: 8px; box-shadow: 0 4px 20px rgba(0,0,0,0.5);">
            <button onclick="window.closeStudentPhotoPopup()" style="position: absolute; top: 20px; right: 20px; background: rgba(255,255,255,0.3); color: white; border: 2px solid rgba(255,255,255,0.5); width: 44px; height: 44px; border-radius: 50%; font-size: 28px; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all 0.2s; z-index: 100000;" 
                    onmouseover="this.style.background='rgba(255,255,255,0.3)'" 
                    onmouseout="this.style.background='rgba(255,255,255,0.2)'"
                    title="বন্ধ করুন">
                &times;
            </button>
        </div>
    `;
    
    // Close on background click
    modal.addEventListener('click', function(e) {
        if (e.target === modal) {
            window.closeStudentPhotoPopup();
        }
    });
    
    // Close on Escape key
    const escapeHandler = function(e) {
        if (e.key === 'Escape') {
            window.closeStudentPhotoPopup();
            document.removeEventListener('keydown', escapeHandler);
        }
    };
    document.addEventListener('keydown', escapeHandler);
    
    // Append to body, but ensure it's on top of everything
    document.body.appendChild(modal);
    document.body.style.overflow = 'hidden'; // Prevent background scrolling
    
    // Force display and verify it's visible
    modal.style.display = 'flex';
    modal.style.visibility = 'visible';
    modal.style.opacity = '1';
    modal.style.zIndex = '99999'; // Higher than student profile modal
    
    console.log('✅ Photo popup modal created and appended');
    console.log('🔍 Modal element:', modal);
    console.log('🔍 Modal computed styles:', {
        display: window.getComputedStyle(modal).display,
        visibility: window.getComputedStyle(modal).visibility,
        zIndex: window.getComputedStyle(modal).zIndex,
        position: window.getComputedStyle(modal).position,
        opacity: window.getComputedStyle(modal).opacity
    });
}

// Close student photo popup
export function closeStudentPhotoPopup() {
    const modal = document.getElementById('student-photo-popup-modal');
    if (modal) {
        modal.remove();
        document.body.style.overflow = ''; // Restore scrolling
    }
}

export function updateStudentPhotoDisplay(studentId, photoPath) {
    const photoDisplay = document.getElementById('student-photo-display');
    const photoPlaceholder = document.getElementById('student-photo-placeholder');
    const uploadButton = document.querySelector('button[onclick*="student-photo-upload"]');
    const deleteButton = document.querySelector('button[onclick*="deleteStudentPhoto"]');
    
    console.log('🔄 Updating photo display:', { studentId, photoPath, photoDisplay: !!photoDisplay, photoPlaceholder: !!photoPlaceholder });
    
    if (photoPath) {
        // Show photo
        if (photoDisplay) {
            // Force image reload by adding timestamp
            // Add click event listener for popup
            photoDisplay.removeEventListener('click', photoDisplay._photoPopupHandler); // Remove old listener if exists
            photoDisplay._photoPopupHandler = function(e) {
                e.stopPropagation();
                console.log('🖼️ Photo clicked, calling showStudentPhotoPopup with:', photoPath);
                if (window.showStudentPhotoPopup) {
                    window.showStudentPhotoPopup(photoPath);
                } else {
                    console.error('❌ showStudentPhotoPopup not found on window object');
                }
            };
            photoDisplay.addEventListener('click', photoDisplay._photoPopupHandler);
            photoDisplay.style.cursor = 'pointer';
            photoDisplay.title = 'ছবি বড় করে দেখুন';
            const timestamp = new Date().getTime();
            photoDisplay.src = `/${photoPath}?t=${timestamp}`;
            photoDisplay.style.display = 'block';
            
            // Handle image load error
            photoDisplay.onerror = function() {
                console.log('❌ Image failed to load, retrying...');
                photoDisplay.src = `/${photoPath}`;
            };
            
            // Handle successful load
            photoDisplay.onload = function() {
                console.log('✅ Photo loaded successfully:', photoPath);
            };
            
            console.log('✅ Photo displayed:', photoPath);
        }
        if (photoPlaceholder) {
            photoPlaceholder.style.display = 'none';
        }
        if (uploadButton) {
            uploadButton.title = 'ছবি পরিবর্তন করুন';
        }
        if (deleteButton) {
            deleteButton.style.display = 'inline-block';
        }
    } else {
        // Show placeholder
        if (photoDisplay) {
            photoDisplay.style.display = 'none';
        }
        if (photoPlaceholder) {
            photoPlaceholder.style.display = 'flex';
            console.log('✅ Placeholder displayed');
        }
        if (uploadButton) {
            uploadButton.title = 'ছবি আপলোড করুন';
        }
        if (deleteButton) {
            deleteButton.style.display = 'none';
        }
    }
}

// --- EDUCATION PROGRESS LOGIC ---
export function showBookModal(bookId = null) {
    const modal = document.getElementById('book-modal');
    const title = document.getElementById('book-modal-title');
    const deleteBtn = document.getElementById('delete-book-btn');
    const progressSection = document.getElementById('book-progress-section');
    const historySection = document.getElementById('book-progress-history-section');
    
    if (bookId) {
        const book = state.allEducationProgress.find(b => b.id == bookId);
        
        if (!book) {
            console.error(`❌ Book not found! bookId: ${bookId}`);
            alert('বইটি পাওয়া যায়নি। অনুগ্রহ করে পৃষ্ঠাটি রিফ্রেশ করুন।');
            return;
        }
        
        if (title) title.innerText = "বই সম্পাদনা ও অগ্রগতি";
        
        const bookIdElement = document.getElementById('book-id');
        const bookNameElement = document.getElementById('book-name');
        const bookTotalPagesElement = document.getElementById('book-total-pages');
        const bookDescriptionElement = document.getElementById('book-description');
        const bookCompletedPagesElement = document.getElementById('book-completed-pages');
        
        if (bookIdElement) bookIdElement.value = book.id;
        if (bookNameElement) bookNameElement.value = book.book_name || book.book || '';
        if (bookTotalPagesElement) bookTotalPagesElement.value = book.total_pages || book.total || '';
        if (bookDescriptionElement) bookDescriptionElement.value = book.description || '';
        
        const completedPages = book.completed_pages || 0;
        if (bookCompletedPagesElement) bookCompletedPagesElement.value = completedPages;
        
        const historyList = document.getElementById('progress-history-list');
        if (book.progressHistory && book.progressHistory.length > 0) {
            const sortedHistory = book.progressHistory.sort((a, b) => 
                new Date(b.date) - new Date(a.date)
            );
            
            historyList.innerHTML = sortedHistory.map(h => {
                const date = new Date(h.date);
                const formattedDate = date.toLocaleDateString('bn-BD', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                });
                
                return `
                    <li class="mb-3 p-2 bg-gray-50 rounded-md border-l-4 border-blue-500">
                        <div class="flex justify-between items-start mb-1">
                            <div class="text-sm font-medium text-gray-700">
                                ${h.completed} পৃষ্ঠা সম্পন্ন
                            </div>
                            <div class="text-xs text-gray-500">
                                ${formattedDate}
                            </div>
                        </div>
                        ${h.note ? `
                            <div class="text-xs text-gray-600 italic bg-white p-2 rounded border">
                                <i class="fas fa-sticky-note mr-1"></i>${h.note}
                            </div>
                        ` : ''}
                    </li>
                `;
            }).join('');
        } else {
            const currentDate = new Date().toLocaleDateString('bn-BD', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
            
            historyList.innerHTML = `
                <li class="mb-3 p-2 bg-blue-50 rounded-md border-l-4 border-blue-400">
                    <div class="flex justify-between items-start mb-1">
                        <div class="text-sm font-medium text-blue-700">
                            বর্তমান অগ্রগতি: ${completedPages} পৃষ্ঠা
                        </div>
                        <div class="text-xs text-blue-500">
                            ${currentDate}
                        </div>
                    </div>
                    ${book.notes ? `
                        <div class="text-xs text-blue-600 italic bg-white p-2 rounded border">
                            <i class="fas fa-sticky-note mr-1"></i>${book.notes}
                        </div>
                    ` : ''}
                </li>
                <li class="text-center p-3">
                    <div class="text-xs text-gray-500 bg-gray-100 p-2 rounded-md">
                        <i class="fas fa-info-circle mr-1"></i>
                        অগ্রগতির ইতিহাস ডেটাবেসে সংরক্ষিত হবে
                    </div>
                </li>
            `;
        }

        deleteBtn.style.display = 'block';
        progressSection.style.display = 'block';
        historySection.style.display = 'block';
    } else {
        title.innerText = "নতুন বই যোগ করুন";
        const bookIdElement = document.getElementById('book-id');
        const bookNameElement = document.getElementById('book-name');
        const bookTotalPagesElement = document.getElementById('book-total-pages');
        const bookProgressNoteElement = document.getElementById('book-progress-note');
        
        if (bookIdElement) bookIdElement.value = '';
        if (bookNameElement) bookNameElement.value = '';
        if (bookTotalPagesElement) bookTotalPagesElement.value = '';
        if (deleteBtn) deleteBtn.style.display = 'none';
        if (progressSection) progressSection.style.display = 'none';
        if (historySection) historySection.style.display = 'none';
        if (bookProgressNoteElement) bookProgressNoteElement.value = '';
    }
    modal.style.display = 'flex';
}

export function closeBookModal() { 
    const bookModal = document.getElementById('book-modal');
    if (bookModal) bookModal.style.display = 'none';
}

// --- STUDENT PROFILE LOGIC (UNIFIED VIEW) ---
export async function showStudentProfile(studentId, defaultTab = 'overview') {
    const isMobile = window.innerWidth < 768;
    const modal = document.getElementById('student-profile-modal');
    const modalContent = modal?.querySelector('.student-profile-modal-content');
    
    // Show loading state
    const loadingEl = document.getElementById('student-profile-loading');
    if (loadingEl) {
        loadingEl.classList.remove('hidden');
        loadingEl.style.display = 'flex';
    }
    
    state.currentStudentIdForProfile = studentId;
    
    // Ensure students are loaded - try multiple sources
    if (!state.allStudents || state.allStudents.length === 0) {
        console.warn('⚠️ No students in state.allStudents, attempting to load...');
        
        // Try to load from main app
        if (typeof window.loadStudentsFromMainApp === 'function') {
            console.log('🔄 Calling loadStudentsFromMainApp...');
            await window.loadStudentsFromMainApp();
        }
        
        // If still empty, try to get from global students array
        if ((!state.allStudents || state.allStudents.length === 0) && typeof window.students !== 'undefined' && window.students && window.students.length > 0) {
            console.log('🔄 Using window.students array, count:', window.students.length);
            state.allStudents = window.students;
        }
        
        // If still empty, try to fetch from API
        if (!state.allStudents || state.allStudents.length === 0) {
            console.log('🔄 Fetching students from API...');
            try {
                const response = await fetch('/api/students', { credentials: 'include' });
                if (response.ok) {
                    const studentsData = await response.json();
                    state.allStudents = studentsData;
                    console.log('✅ Loaded', studentsData.length, 'students from API');
                } else {
                    console.error('❌ Failed to fetch students:', response.status);
                }
            } catch (error) {
                console.error('❌ Error fetching students:', error);
            }
        }
    }
    
    const student = state.allStudents.find(s => s.id === studentId);
    if (!student) {
        console.error('❌ Student not found:', studentId);
        console.log('Available students:', state.allStudents.map(s => ({ id: s.id, name: s.name })));
        if (loadingEl) {
            loadingEl.innerHTML = `
                <div class="text-center py-8">
                    <i class="fas fa-exclamation-triangle text-3xl text-red-500 mb-4"></i>
                    <p class="text-red-600 font-semibold">Student not found</p>
                    <p class="text-gray-500 text-sm mt-2">Student ID: ${studentId}</p>
                </div>
            `;
            // Keep loading visible for error message
            loadingEl.classList.remove('hidden');
        }
        return;
    }
    
    console.log('✅ Student found:', student.name, 'Class:', student.class);
    
    console.log('🔄 Loading student data...');
    try {
        await loadStudentScoresFromDatabase(student.class);
        console.log('✅ Student scores loaded');
    } catch (error) {
        console.error('❌ Error loading student scores:', error);
    }
    
    try {
        await loadTeacherLogsFromDatabase(student.class);
        console.log('✅ Teacher logs loaded');
    } catch (error) {
        console.error('❌ Error loading teacher logs:', error);
    }
    
    try {
        await loadScoreHistoryFromDatabase(studentId);
        console.log('✅ Score history loaded');
    } catch (error) {
        console.error('❌ Error loading score history:', error);
    }
    
    // Update desktop header content
    const headerContent = document.getElementById('student-header-content');
    if (headerContent) {
        headerContent.innerHTML = `
            <div class="bg-white border border-gray-200 rounded-lg p-3 mb-4">
                <div class="flex items-center justify-between">
                    <!-- Left: Photo + Name + Details -->
                    <div class="flex items-center space-x-4">
                        <div class="relative">
                            ${student.photo_path ? 
                                `<img src="/${student.photo_path}" alt="Student Photo" class="w-24 h-24 rounded-full object-cover border-2 border-gray-200 shadow-sm cursor-pointer hover:opacity-80 transition-opacity" id="student-photo-display" data-photo-path="${student.photo_path}" title="ছবি বড় করে দেখুন">` : 
                                `<div class="w-24 h-24 rounded-full bg-gray-200 border-2 border-gray-300 flex items-center justify-center text-gray-500 text-sm" id="student-photo-placeholder">কোন ছবি নেই</div>`
                            }
                            <div class="flex justify-center space-x-1 mt-1">
                                <input type="file" id="student-photo-upload" accept="image/jpeg,image/png" class="hidden">
                                <button onclick="document.getElementById('student-photo-upload').click()" class="text-blue-500 hover:text-blue-700 text-xs" title="${student.photo_path ? 'ছবি পরিবর্তন করুন' : 'ছবি আপলোড করুন'}">
                                    📷
                                </button>
                                ${student.photo_path ? 
                                    `<button onclick="deleteStudentPhotoHandler('${student.id}')" class="text-red-500 hover:text-red-700 text-xs" title="ছবি মুছুন">🗑️</button>` : 
                                    ''
                                }
                            </div>
                        </div>
                        <div>
                            <h2 class="text-xl font-bold text-gray-800">${student.name} বিন ${student.fatherName}</h2>
                            <p class="text-sm text-gray-600">পরিচিতি: ${student.rollNumber || 'N/A'} | শ্রেণী: ${student.class}</p>
                        </div>
                    </div>
                    
                    <!-- Right: Print buttons (Desktop) -->
                    <div class="flex space-x-2 student-profile-desktop-actions">
                        <button id="print-student-detail-btn" class="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-md text-sm font-semibold flex items-center gap-2 transition-colors">
                            <i class="fas fa-print"></i> 
                            <span>সম্পূর্ণ প্রিন্ট</span>
                        </button>
                        <button id="show-custom-print-modal-btn" class="bg-purple-600 hover:bg-purple-700 text-white px-3 py-2 rounded-md text-sm font-semibold flex items-center gap-2 transition-colors">
                            <i class="fas fa-cog"></i>
                            <span>কাস্টম প্রিন্ট</span>
                        </button>
                    </div>
                </div>
            </div>
        `;
    }
    
    // Update mobile header content
    const mobileHeaderInfo = document.getElementById('student-profile-mobile-header-info');
    if (mobileHeaderInfo) {
        mobileHeaderInfo.innerHTML = `
            <div class="flex items-center space-x-3">
                <div class="relative">
                    ${student.photo_path ? 
                        `<img src="/${student.photo_path}" alt="Student Photo" class="w-12 h-12 rounded-full object-cover border-2 border-white shadow-md" id="student-photo-display-mobile" data-photo-path="${student.photo_path}">` : 
                        `<div class="w-12 h-12 rounded-full bg-gray-200 border-2 border-white flex items-center justify-center text-gray-500 text-xs" id="student-photo-placeholder-mobile">ছবি নেই</div>`
                    }
                </div>
                <div class="flex-1 min-w-0">
                    <h3 class="text-base font-bold text-white truncate" title="${student.name} বিন ${student.fatherName}">${student.name} বিন ${student.fatherName}</h3>
                    <p class="text-xs text-white opacity-90 truncate" title="পরিচিতি: ${student.rollNumber || 'N/A'} | ${student.class}">পরিচিতি: ${student.rollNumber || 'N/A'} | ${student.class}</p>
                </div>
            </div>
        `;
        
        // Add photo click handler for mobile
        const photoDisplayMobile = document.getElementById('student-photo-display-mobile');
        if (photoDisplayMobile && student.photo_path) {
            photoDisplayMobile.addEventListener('click', function(e) {
                e.stopPropagation();
                if (window.showStudentPhotoPopup) {
                    window.showStudentPhotoPopup(student.photo_path);
                }
            });
            photoDisplayMobile.style.cursor = 'pointer';
        }
    }
    
    // Setup desktop header button handlers
    document.getElementById('print-student-detail-btn')?.addEventListener('click', () => printStudentDetail(student.id));
    document.getElementById('show-custom-print-modal-btn')?.addEventListener('click', () => showCustomPrintModal(student.id));
    document.getElementById('student-photo-upload')?.addEventListener('change', () => handleStudentPhotoUploadHandler(student.id));
    
    // Add click event listener to student photo (desktop)
    const photoDisplay = document.getElementById('student-photo-display');
    if (photoDisplay && student.photo_path) {
        photoDisplay.addEventListener('click', function(e) {
            e.stopPropagation();
            console.log('🖼️ Photo clicked, calling showStudentPhotoPopup with:', student.photo_path);
            if (window.showStudentPhotoPopup) {
                window.showStudentPhotoPopup(student.photo_path);
            } else {
                console.error('❌ showStudentPhotoPopup not found on window object');
            }
        });
        photoDisplay.style.cursor = 'pointer';
    }
    const score = getHusnulKhulukScore(studentId);
    const studentLogs = (state.teachersLogbook[student.class]?.student_logs[studentId] || []).sort((a, b) => new Date(b.date) - new Date(a.date));
    const scoreHistory = state.scoreChangeHistory[studentId] || [];
    
    const attendanceStats = await calculateAttendanceStats(student);
    
    const profileContent = `<div class="space-y-6 student-profile-tabs-container">
        <!-- Desktop Tab Navigation (Hidden on mobile) -->
        <div class="border-b border-gray-200 student-profile-desktop-tabs">
            <div class="flex justify-between items-center">
            <nav class="flex space-x-8">
                <button onclick="if(typeof window.switchStudentProfileTab==='function'){window.switchStudentProfileTab('overview')}" class="profile-tab active py-2 px-1 border-b-2 border-blue-500 text-sm font-medium text-blue-600">এক নজরে</button>
                <button onclick="if(typeof window.switchStudentProfileTab==='function'){window.switchStudentProfileTab('personal')}" class="profile-tab py-2 px-1 border-b-2 border-transparent text-sm font-medium text-gray-500 hover:text-gray-700">ব্যক্তিগত তথ্য</button>
                <button onclick="if(typeof window.switchStudentProfileTab==='function'){window.switchStudentProfileTab('attendance')}" class="profile-tab py-2 px-1 border-b-2 border-transparent text-sm font-medium text-gray-500 hover:text-gray-700">উপস্থিতি</button>
                <button onclick="if(typeof window.switchStudentProfileTab==='function'){window.switchStudentProfileTab('exams')}" class="profile-tab py-2 px-1 border-b-2 border-transparent text-sm font-medium text-gray-500 hover:text-gray-700">পরীক্ষা</button>
                <button onclick="if(typeof window.switchStudentProfileTab==='function'){window.switchStudentProfileTab('logs')}" class="profile-tab py-2 px-1 border-b-2 border-transparent text-sm font-medium text-gray-500 hover:text-gray-700">শিক্ষকের বিবরণ</button>
                <button onclick="if(typeof window.switchStudentProfileTab==='function'){window.switchStudentProfileTab('score-history')}" class="profile-tab py-2 px-1 border-b-2 border-transparent text-sm font-medium text-gray-500 hover:text-gray-700">হুসনুল খুলুক ইতিহাস</button>
            </nav>
            </div>
        </div>
        
        <!-- Swipeable Content Container -->
        <div class="student-profile-swipe-container" data-swipe-active-tab="overview">
        
        <div id="profile-overview" class="profile-tab-content active" data-tab="overview">
            <!-- Stats Cards Grid -->
            <div class="bg-white p-4 rounded-lg mb-4 shadow-sm border border-gray-200">
                <div class="mb-3">
                    <h4 class="font-semibold text-gray-700 text-base">এক নজরে</h4>
                </div>
                <div class="grid grid-cols-2 gap-3">
                    <div class="bg-green-50 p-3 rounded-lg text-center border border-green-200">
                        <div class="text-lg font-bold text-green-600">${attendanceStats.attendanceRate}%</div>
                        <div class="text-xs text-gray-600 mt-1">উপস্থিতি</div>
                    </div>
                    <div class="bg-blue-50 p-3 rounded-lg text-center border border-blue-200">
                        <div class="text-lg font-bold text-blue-600">${score}</div>
                        <div class="text-xs text-gray-600 mt-1">হুসনুল খুলুক</div>
                    </div>
                    <div class="bg-purple-50 p-3 rounded-lg text-center border border-purple-200">
                        <div class="text-lg font-bold text-purple-600">${studentLogs.length}</div>
                        <div class="text-xs text-gray-600 mt-1">বিবরণ সংখ্যা</div>
                    </div>
                    <div class="bg-gray-50 p-3 rounded-lg text-center border border-gray-200">
                        <div class="text-sm font-bold text-gray-700">${student.class}</div>
                        <div class="text-xs text-gray-600 mt-1">শ্রেণী</div>
                    </div>
                </div>
            </div>
            
            <!-- Info Cards -->
            <div class="space-y-4">
                <div class="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                    <h4 class="font-semibold text-gray-700 mb-3 text-base">মৌলিক তথ্য</h4>
                    <div class="space-y-2 text-sm text-gray-600">
                        <p class="flex items-center gap-2"><i class="fas fa-user text-blue-500 text-xs"></i><strong>নাম:</strong> ${student.name} বিন ${student.fatherName}</p>
                        <p class="flex items-center gap-2"><i class="fas fa-id-card text-blue-500 text-xs"></i><strong>পরিচিতি:</strong> ${student.rollNumber || 'N/A'}</p>
                        <p class="flex items-center gap-2"><i class="fas fa-graduation-cap text-blue-500 text-xs"></i><strong>শ্রেণী:</strong> ${student.class}</p>
                        <p class="flex items-center gap-2"><i class="fas fa-phone text-blue-500 text-xs"></i><strong>মোবাইল:</strong> ${student.mobileNumber || student.mobile || 'N/A'}</p>
                        <p class="flex items-center gap-2"><i class="fas fa-map-marker-alt text-blue-500 text-xs"></i><strong>ঠিকানা:</strong> ${student.upazila}, ${student.district}</p>
                        <p class="flex items-center gap-2"><i class="fas fa-calendar text-blue-500 text-xs"></i><strong>নিবন্ধনের তারিখ:</strong> ${student.registrationDate || 'N/A'}</p>
                        <p class="flex items-center gap-2"><i class="fas fa-circle text-${student.status === 'inactive' ? 'red' : 'green'}-500 text-xs"></i><strong>অবস্থা:</strong> 
                            <span class="${student.status === 'inactive' ? 'text-red-600 font-semibold' : 'text-green-600 font-semibold'}">
                                ${student.status === 'inactive' ? 'বিদায়ী' : 'সক্রিয়'}
                                ${student.status === 'inactive' && student.inactivationDate ? ` (${student.inactivationDate} থেকে)` : ''}
                            </span>
                        </p>
                    </div>
                </div>
                <div class="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                    <h4 class="font-semibold text-gray-700 mb-3 text-base">উপস্থিতি সারসংক্ষেপ</h4>
                    <div class="space-y-2 text-sm text-gray-600">
                        <p class="flex items-center gap-2"><i class="fas fa-check-circle text-green-500 text-xs"></i><strong>মোট উপস্থিত:</strong> ${attendanceStats.present} দিন</p>
                        <p class="flex items-center gap-2"><i class="fas fa-times-circle text-red-500 text-xs"></i><strong>মোট অনুপস্থিত:</strong> ${attendanceStats.absent} দিন</p>
                        <p class="flex items-center gap-2"><i class="fas fa-calendar-day text-yellow-500 text-xs"></i><strong>ছুটির দিন:</strong> ${attendanceStats.leave} দিন</p>
                        <p class="flex items-center gap-2"><i class="fas fa-percentage text-blue-500 text-xs"></i><strong>উপস্থিতির হার:</strong> ${attendanceStats.attendanceRate}%</p>
                    </div>
                </div>
            </div>
        </div>
        <div id="profile-personal" class="profile-tab-content hidden" data-tab="personal">
            <div class="space-y-4">
                <div>
                    <h4 class="font-semibold text-gray-700 mb-3 text-base">ব্যক্তিগত তথ্য</h4>
                    <div class="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                        <div class="space-y-3 text-sm">
                            <div class="flex items-start gap-3 pb-2 border-b border-gray-100">
                                <i class="fas fa-user text-blue-500 mt-1"></i>
                                <div class="flex-1">
                                    <p class="text-gray-500 text-xs mb-1">পূর্ণ নাম</p>
                                    <p class="text-gray-800 font-medium">${student.name} বিন ${student.fatherName}</p>
                                </div>
                            </div>
                            <div class="flex items-start gap-3 pb-2 border-b border-gray-100">
                                <i class="fas fa-id-card text-blue-500 mt-1"></i>
                                <div class="flex-1">
                                    <p class="text-gray-500 text-xs mb-1">পরিচিতি নং</p>
                                    <p class="text-gray-800 font-medium">${student.rollNumber || 'N/A'}</p>
                                </div>
                            </div>
                            <div class="flex items-start gap-3 pb-2 border-b border-gray-100">
                                <i class="fas fa-graduation-cap text-blue-500 mt-1"></i>
                                <div class="flex-1">
                                    <p class="text-gray-500 text-xs mb-1">শ্রেণী</p>
                                    <p class="text-gray-800 font-medium">${student.class}</p>
                                </div>
                            </div>
                            <div class="flex items-start gap-3 pb-2 border-b border-gray-100">
                                <i class="fas fa-phone text-blue-500 mt-1"></i>
                                <div class="flex-1">
                                    <p class="text-gray-500 text-xs mb-1">মোবাইল নম্বর</p>
                                    <p class="text-gray-800 font-medium">${student.mobileNumber || student.mobile || 'N/A'}</p>
                                </div>
                            </div>
                            <div class="flex items-start gap-3 pb-2 border-b border-gray-100">
                                <i class="fas fa-map-marker-alt text-blue-500 mt-1"></i>
                                <div class="flex-1">
                                    <p class="text-gray-500 text-xs mb-1">ঠিকানা</p>
                                    <p class="text-gray-800 font-medium">${student.upazila}, ${student.district}</p>
                                </div>
                            </div>
                            <div class="flex items-start gap-3 pb-2 border-b border-gray-100">
                                <i class="fas fa-calendar text-blue-500 mt-1"></i>
                                <div class="flex-1">
                                    <p class="text-gray-500 text-xs mb-1">নিবন্ধনের তারিখ</p>
                                    <p class="text-gray-800 font-medium">${student.registrationDate || 'N/A'}</p>
                                </div>
                            </div>
                            <div class="flex items-start gap-3">
                                <i class="fas fa-circle text-${student.status === 'inactive' ? 'red' : 'green'}-500 mt-1"></i>
                                <div class="flex-1">
                                    <p class="text-gray-500 text-xs mb-1">অবস্থা</p>
                                    <p class="${student.status === 'inactive' ? 'text-red-600' : 'text-green-600'} font-semibold">
                                        ${student.status === 'inactive' ? 'বিদায়ী' : 'সক্রিয়'}
                                        ${student.status === 'inactive' && student.inactivationDate ? ` (${student.inactivationDate} থেকে)` : ''}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        <div id="profile-attendance" class="profile-tab-content hidden" data-tab="attendance">
            <div class="space-y-4">
                <div>
                    <h4 class="font-semibold text-gray-700 mb-3 text-base">উপস্থিতি তথ্য</h4>
                    <div class="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                        <div class="grid grid-cols-2 gap-3 mb-4">
                            <div class="bg-green-50 p-4 rounded-lg border border-green-200 text-center">
                                <div class="text-2xl font-bold text-green-600 mb-1">${attendanceStats.present}</div>
                                <div class="text-xs text-gray-600">উপস্থিত</div>
                            </div>
                            <div class="bg-red-50 p-4 rounded-lg border border-red-200 text-center">
                                <div class="text-2xl font-bold text-red-600 mb-1">${attendanceStats.absent}</div>
                                <div class="text-xs text-gray-600">অনুপস্থিত</div>
                            </div>
                            <div class="bg-yellow-50 p-4 rounded-lg border border-yellow-200 text-center">
                                <div class="text-2xl font-bold text-yellow-600 mb-1">${attendanceStats.leave}</div>
                                <div class="text-xs text-gray-600">ছুটি</div>
                            </div>
                            <div class="bg-blue-50 p-4 rounded-lg border border-blue-200 text-center">
                                <div class="text-2xl font-bold text-blue-600 mb-1">${attendanceStats.attendanceRate}%</div>
                                <div class="text-xs text-gray-600">উপস্থিতির হার</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        <div id="profile-exams" class="profile-tab-content hidden" data-tab="exams">
            <div class="space-y-4">
                <div>
                    <h4 class="font-semibold text-gray-700 mb-3 text-base">পরীক্ষার ফলাফল</h4>
                    <div id="student-exam-results-container">
                        <div class="text-center py-8 text-gray-500">
                            <i class="fas fa-spinner fa-spin text-2xl mb-2"></i>
                            <p>পরীক্ষার ফলাফল লোড হচ্ছে...</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        <div id="profile-logs" class="profile-tab-content hidden" data-tab="logs">
            <div class="space-y-4">
                <div>
                    <h4 class="font-semibold text-gray-700 mb-3 text-base">শিক্ষকের বিবরণ</h4>
                    <div class="space-y-3">
                        ${studentLogs.length > 0 ? 
                            studentLogs.map(log => {
                                const priorityFlags = [];
                                if (log.isImportant) priorityFlags.push('<span class="bg-red-100 text-red-800 text-xs px-2 py-1 rounded-full">গুরুত্বপূর্ণ</span>');
                                if (log.needsFollowup) priorityFlags.push('<span class="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded-full">অনুসরণ প্রয়োজন</span>');
                                
                                return `<div class="bg-white p-4 rounded-lg shadow-sm border-l-4 ${log.isImportant ? 'border-red-500' : 'border-blue-500'} transition-all">
                                    <div class="flex justify-between items-start mb-2">
                                        <div class="flex-1">
                                            <div class="flex items-center gap-2 mb-2 flex-wrap">
                                                <span class="text-sm font-medium text-gray-700">${new Date(log.date).toLocaleDateString('bn-BD')}</span>
                                                <span class="text-xs px-2 py-1 rounded-full ${log.isImportant ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'}">${log.type}</span>
                                                ${priorityFlags.length > 0 ? `<div class="flex gap-1">${priorityFlags.join('')}</div>` : ''}
                                            </div>
                                            <p class="text-sm text-gray-700 leading-relaxed">${log.details}</p>
                                        </div>
                                    </div>
                                </div>`;
                            }).join('') :
                            '<div class="bg-white p-8 rounded-lg text-center text-gray-500 border border-gray-200"><i class="fas fa-clipboard-list text-4xl mb-3 opacity-30"></i><p>কোন বিবরণ নেই</p></div>'
                        }
                    </div>
                </div>
            </div>
        </div>
        <div id="profile-score-history" class="profile-tab-content hidden" data-tab="score-history">
            <div class="space-y-4">
                <div>
                    <h4 class="font-semibold text-gray-700 mb-3 text-base">হুসনুল খুলুক পরিবর্তনের ইতিহাস</h4>
                    <div class="space-y-3">
                        ${scoreHistory.length > 0 ? 
                            scoreHistory.map(entry => `
                                <div class="bg-white p-4 rounded-lg shadow-sm border-l-4 border-green-500 transition-all">
                                    <div class="flex justify-between items-start">
                                        <div class="flex-1">
                                            <div class="flex items-center gap-2 mb-2">
                                                <span class="text-sm font-medium text-gray-700">${new Date(entry.date).toLocaleDateString('bn-BD')}</span>
                                                <span class="text-xs px-2 py-1 rounded-full bg-green-100 text-green-800">হুসনুল খুলুক পরিবর্তন</span>
                                            </div>
                                            <p class="text-sm text-gray-700 mb-2">
                                                <span class="inline-block bg-gray-100 px-2 py-1 rounded text-gray-600">${entry.oldScore}</span>
                                                <i class="fas fa-arrow-right text-gray-400 mx-2"></i>
                                                <span class="inline-block bg-green-100 px-2 py-1 rounded text-green-700 font-semibold">${entry.newScore}</span>
                                            </p>
                                            <p class="text-xs text-gray-500 mb-1"><i class="fas fa-user text-gray-400"></i> পরিবর্তন করেছেন: ${entry.changedBy}</p>
                                            ${entry.reason ? `<p class="text-xs text-gray-600 mt-2 bg-gray-50 p-2 rounded"><strong>কারণ:</strong> ${entry.reason}</p>` : ''}
                                        </div>
                                    </div>
                                </div>
                            `).join('') :
                            '<div class="bg-white p-8 rounded-lg text-center text-gray-500 border border-gray-200"><i class="fas fa-star text-4xl mb-3 opacity-30"></i><p>কোন হুসনুল খুলুক পরিবর্তনের ইতিহাস নেই</p></div>'
                        }
                    </div>
                </div>
            </div>
        </div>
        </div>
        <!-- End Swipeable Container -->
    </div>`;
    const studentProfileContent = document.getElementById('student-profile-content');
    if (studentProfileContent) {
        console.log('✅ Setting student profile content...');
        studentProfileContent.innerHTML = profileContent;
        console.log('✅ Profile content set, length:', profileContent.length);
        
        // Hide loading IMMEDIATELY after content is set
        // Use class-based hiding to override CSS !important
        if (loadingEl) {
            loadingEl.style.display = 'none';
            loadingEl.classList.add('hidden');
            console.log('✅ Loading spinner hidden');
        }
        
        // Load exam results
        console.log('🔄 Loading exam results for student:', studentId);
        if (typeof window.loadStudentExamResults === 'function') {
            // Ensure exam data is loaded for this student's class first
            if (typeof window.initClassExamManagement === 'function') {
                console.log('🔄 Initializing exam management for class:', student.class);
                try {
                    await window.initClassExamManagement(student.class);
                    console.log('✅ Exam management initialized');
                } catch (error) {
                    console.error('❌ Error initializing exam management:', error);
                }
            }
            console.log('🔄 Calling loadStudentExamResults...');
            try {
                window.loadStudentExamResults(studentId);
            } catch (error) {
                console.error('❌ Error loading student exam results:', error);
            }
        } else {
            console.warn('⚠️ window.loadStudentExamResults function not available');
        }
        
        if (defaultTab !== 'overview') {
            setTimeout(() => {
                if (typeof window.switchStudentProfileTab === 'function') {
                    window.switchStudentProfileTab(defaultTab);
                } else if (typeof switchStudentProfileTab === 'function') {
                    switchStudentProfileTab(defaultTab);
                } else {
                    console.warn('⚠️ switchStudentProfileTab not available');
                }
            }, 100);
        }
    } else {
        console.error('❌ student-profile-content element not found!');
        // Still hide loading even if content element not found
        if (loadingEl) {
            loadingEl.style.display = 'none';
            loadingEl.classList.add('hidden');
        }
    }
    
    const studentProfileModal = document.getElementById('student-profile-modal');
    if (studentProfileModal) {
        // Update mobile state
        studentProfileModal.setAttribute('data-is-mobile', isMobile ? 'true' : 'false');
        
        // Show/hide mobile vs desktop elements
        const mobileHeader = document.getElementById('student-profile-mobile-header');
        const desktopHeader = studentProfileModal.querySelector('.student-profile-desktop-header');
        const bottomTabs = document.getElementById('student-profile-bottom-tabs');
        const desktopTabs = studentProfileModal.querySelector('.student-profile-desktop-tabs');
        
        if (isMobile) {
            if (mobileHeader) mobileHeader.style.display = 'flex';
            if (desktopHeader) desktopHeader.style.display = 'none';
            if (bottomTabs) bottomTabs.style.display = 'flex';
            if (desktopTabs) desktopTabs.style.display = 'none';
        } else {
            if (mobileHeader) mobileHeader.style.display = 'none';
            if (desktopHeader) desktopHeader.style.display = 'block';
            if (bottomTabs) bottomTabs.style.display = 'none';
            if (desktopTabs) desktopTabs.style.display = 'block';
        }
        
        // Ensure loading is hidden (double-check)
        if (loadingEl) {
            loadingEl.style.display = 'none';
            loadingEl.classList.add('hidden');
        }
        
        // Show modal with animation
        studentProfileModal.style.display = 'flex';
        studentProfileModal.classList.remove('closing');
        
        // Switch to default tab - use window function to ensure it's available
        if (defaultTab !== 'overview') {
            setTimeout(() => {
                if (typeof window.switchStudentProfileTab === 'function') {
                    window.switchStudentProfileTab(defaultTab);
                } else {
                    console.warn('⚠️ switchStudentProfileTab not available, trying local function');
                    if (typeof switchStudentProfileTab === 'function') {
                        switchStudentProfileTab(defaultTab);
                    }
                }
            }, 100);
        } else {
            if (typeof window.switchStudentProfileTab === 'function') {
                window.switchStudentProfileTab('overview');
            } else if (typeof switchStudentProfileTab === 'function') {
                switchStudentProfileTab('overview');
            }
        }
        
        // Prevent body scroll when modal is open
        document.body.style.overflow = 'hidden';
        
        // Add swipe gesture support for mobile
        if (isMobile) {
            setupStudentProfileSwipeGestures();
        }
        
        // Add window resize handler
        setupStudentProfileResizeHandler();
        
        // Add orientation change handler
        setupStudentProfileOrientationHandler();
        
        // Setup FAB for mobile
        if (isMobile) {
            setupStudentProfileFAB();
        }
    }
}

// Floating Action Button (FAB) for mobile
function setupStudentProfileFAB() {
    const fab = document.getElementById('student-profile-fab');
    const fabMenu = document.getElementById('student-profile-fab-menu');
    
    if (fab) {
        fab.style.display = 'flex';
    }
}

// Toggle FAB menu (already exposed in teachers-corner.js, but keeping here for reference)
// window.toggleStudentProfileFAB is exposed early in teachers-corner.js

// Close FAB menu when clicking outside
document.addEventListener('click', (e) => {
    const fab = document.getElementById('student-profile-fab');
    const fabMenu = document.getElementById('student-profile-fab-menu');
    
    if (fabMenu && fabMenu.classList.contains('show')) {
        if (!fabMenu.contains(e.target) && !fab?.contains(e.target)) {
            fabMenu.classList.remove('show');
        }
    }
});

// Keyboard navigation for desktop
function setupStudentProfileKeyboardNavigation() {
    const modal = document.getElementById('student-profile-modal');
    if (!modal) return;
    
    modal.addEventListener('keydown', (e) => {
        // Only handle if modal is visible
        if (modal.style.display === 'none') return;
        
        // Only on desktop
        if (window.innerWidth < 768) return;
        
        const tabs = ['overview', 'personal', 'attendance', 'exams', 'logs', 'score-history'];
        const currentTab = document.querySelector('.student-profile-desktop-tabs .profile-tab.active')?.getAttribute('onclick');
        const currentTabName = currentTab ? currentTab.match(/'(\w+)'/)?.[1] : 'overview';
        const currentIndex = tabs.indexOf(currentTabName);
        
        if (e.key === 'ArrowLeft' && currentIndex > 0) {
            e.preventDefault();
            switchStudentProfileTab(tabs[currentIndex - 1]);
        } else if (e.key === 'ArrowRight' && currentIndex < tabs.length - 1) {
            e.preventDefault();
            switchStudentProfileTab(tabs[currentIndex + 1]);
        } else if (e.key === 'Escape') {
            e.preventDefault();
            closeStudentProfileModal();
        }
    });
}

// Setup keyboard navigation when modal opens
const originalShowStudentProfile = window.showStudentProfile;
if (originalShowStudentProfile) {
    window.showStudentProfile = async function(...args) {
        await originalShowStudentProfile.apply(this, args);
        setTimeout(() => {
            setupStudentProfileKeyboardNavigation();
        }, 100);
    };
}

// Swipe gesture setup for student profile tabs
function setupStudentProfileSwipeGestures() {
    const swipeContainer = document.querySelector('.student-profile-swipe-container');
    if (!swipeContainer) return;
    
    let touchStartX = 0;
    let touchEndX = 0;
    let isSwiping = false;
    
    const handleTouchStart = (e) => {
        touchStartX = e.touches[0].clientX;
        isSwiping = false;
    };
    
    const handleTouchMove = (e) => {
        if (touchStartX === 0) return;
        const diff = Math.abs(e.touches[0].clientX - touchStartX);
        if (diff > 10) {
            isSwiping = true;
        }
    };
    
    const handleTouchEnd = (e) => {
        if (!isSwiping || touchStartX === 0) return;
        
        touchEndX = e.changedTouches[0].clientX;
        const swipeDistance = touchEndX - touchStartX;
        const swipeThreshold = 50; // Minimum distance for swipe
        
        if (Math.abs(swipeDistance) > swipeThreshold) {
            const currentTab = swipeContainer.getAttribute('data-swipe-active-tab');
            const tabs = ['overview', 'personal', 'attendance', 'exams', 'logs', 'score-history'];
            const currentIndex = tabs.indexOf(currentTab);
            
            if (swipeDistance > 0 && currentIndex > 0) {
                // Swipe right - go to previous tab
                switchStudentProfileTab(tabs[currentIndex - 1]);
            } else if (swipeDistance < 0 && currentIndex < tabs.length - 1) {
                // Swipe left - go to next tab
                switchStudentProfileTab(tabs[currentIndex + 1]);
            }
        }
        
        touchStartX = 0;
        touchEndX = 0;
        isSwiping = false;
    };
    
    swipeContainer.addEventListener('touchstart', handleTouchStart, { passive: true });
    swipeContainer.addEventListener('touchmove', handleTouchMove, { passive: true });
    swipeContainer.addEventListener('touchend', handleTouchEnd, { passive: true });
}

// Window resize handler
let studentProfileResizeTimeout;
function setupStudentProfileResizeHandler() {
    // Remove existing listener if any
    window.removeEventListener('resize', handleStudentProfileResize);
    window.addEventListener('resize', handleStudentProfileResize);
}

function handleStudentProfileResize() {
    clearTimeout(studentProfileResizeTimeout);
    studentProfileResizeTimeout = setTimeout(() => {
        const modal = document.getElementById('student-profile-modal');
        if (!modal || modal.style.display === 'none') return;
        
        const isMobile = window.innerWidth < 768;
        const wasMobile = modal.getAttribute('data-is-mobile') === 'true';
        
        if (isMobile !== wasMobile) {
            // Viewport changed - update layout
            modal.setAttribute('data-is-mobile', isMobile ? 'true' : 'false');
            
            const mobileHeader = document.getElementById('student-profile-mobile-header');
            const desktopHeader = modal.querySelector('.student-profile-desktop-header');
            const bottomTabs = document.getElementById('student-profile-bottom-tabs');
            const desktopTabs = modal.querySelector('.student-profile-desktop-tabs');
            
            if (isMobile) {
                if (mobileHeader) mobileHeader.style.display = 'flex';
                if (desktopHeader) desktopHeader.style.display = 'none';
                if (bottomTabs) bottomTabs.style.display = 'flex';
                if (desktopTabs) desktopTabs.style.display = 'none';
            } else {
                if (mobileHeader) mobileHeader.style.display = 'none';
                if (desktopHeader) desktopHeader.style.display = 'block';
                if (bottomTabs) bottomTabs.style.display = 'none';
                if (desktopTabs) desktopTabs.style.display = 'block';
            }
        }
    }, 250);
}

// Orientation change handler
function setupStudentProfileOrientationHandler() {
    window.addEventListener('orientationchange', () => {
        setTimeout(() => {
            handleStudentProfileResize();
        }, 300);
    });
}

export function closeStudentProfileModal() {
    const studentProfileModal = document.getElementById('student-profile-modal');
    if (studentProfileModal) {
        // Add closing animation class
        studentProfileModal.classList.add('closing');
        
        // Hide modal after animation
        setTimeout(() => {
            studentProfileModal.style.display = 'none';
            studentProfileModal.classList.remove('closing');
            
            // Restore body scroll
            document.body.style.overflow = '';
        }, 300);
    }
}

// Helper function to detect mobile viewport
function isStudentProfileMobileViewport() {
    return window.innerWidth < 768;
}

// Global variable to track tab switching (for debouncing)
let studentProfileTabSwitching = false;

// Switch profile tab (works for both mobile and desktop)
export function switchStudentProfileTab(tabName) {
    // Prevent rapid tab switching
    if (studentProfileTabSwitching) {
        return;
    }
    studentProfileTabSwitching = true;
    
    // Hide all tab content
    document.querySelectorAll('.profile-tab-content').forEach(content => {
        content.classList.remove('active');
        content.classList.add('hidden');
    });
    
    // Update desktop tabs
    document.querySelectorAll('.profile-tab').forEach(tab => {
        tab.classList.remove('active', 'border-blue-500', 'text-blue-600');
        tab.classList.add('border-transparent', 'text-gray-500');
    });
    
    // Update bottom tabs (mobile)
    document.querySelectorAll('.student-profile-bottom-tab').forEach(tab => {
        tab.classList.remove('active');
    });
    
    // Show selected tab content
    const selectedContent = document.getElementById(`profile-${tabName}`);
    if (selectedContent) {
        selectedContent.classList.remove('hidden');
        selectedContent.classList.add('active');
    }
    
    // Update desktop tab active state
    const desktopTab = document.querySelector(`.profile-tab[onclick*="'${tabName}'"]`);
    if (desktopTab) {
        desktopTab.classList.add('active', 'border-blue-500', 'text-blue-600');
        desktopTab.classList.remove('border-transparent', 'text-gray-500');
    }
    
    // Update bottom tab active state (mobile)
    const bottomTab = document.querySelector(`.student-profile-bottom-tab[data-tab="${tabName}"]`);
    if (bottomTab) {
        bottomTab.classList.add('active');
    }
    
    // Update swipe container active tab
    const swipeContainer = document.querySelector('.student-profile-swipe-container');
    if (swipeContainer) {
        swipeContainer.setAttribute('data-swipe-active-tab', tabName);
    }
    
    // Reset debounce flag
    setTimeout(() => {
        studentProfileTabSwitching = false;
    }, 300);
    
    // Keep old function name for backward compatibility
    if (typeof window.switchProfileTab === 'undefined') {
        window.switchProfileTab = switchStudentProfileTab;
    }
}

export function switchProfileTab(tabName) {
    switchStudentProfileTab(tabName);
}

export function showAddStudentLogModal(studentId) {
    const student = state.allStudents.find(s => s.id === studentId);
    if (!student) return;
    
    closeStudentProfileModal();
    
    const logId = document.getElementById('log-id');
    const logModalTitle = document.getElementById('log-modal-title');
    const logDetails = document.getElementById('log-details');
    const logType = document.getElementById('log-type');
    const logStudentSelect = document.getElementById('log-student-select');
    const logStudentId = document.getElementById('log-student-id');
    const logImportant = document.getElementById('log-important');
    const logFollowup = document.getElementById('log-followup');
    const logModal = document.getElementById('log-modal');
    
    if (logId) logId.value = '';
    if (logDetails) logDetails.value = '';
    if (logType) logType.value = 'শিক্ষামূলক';
    if (logImportant) logImportant.checked = false;
    if (logFollowup) logFollowup.checked = false;
    
    if (logModalTitle) logModalTitle.innerText = `"${student.name}" এর জন্য নতুন বিবরণ`;
    if (logStudentId) logStudentId.value = studentId;
    
    if (logStudentSelect) {
        const studentSelectContainer = logStudentSelect.parentElement;
        if (studentSelectContainer) {
            studentSelectContainer.innerHTML = `
                <label class="block text-sm font-medium text-gray-700 mb-1">ছাত্র নির্বাচন</label>
                <div class="w-full p-3 bg-blue-50 border border-blue-200 rounded-md shadow-sm">
                    <div class="flex items-center gap-2">
                        <i class="fas fa-user text-blue-500"></i>
                        <span class="text-sm font-medium text-blue-700">${student.name} (${student.rollNumber})</span>
                        <span class="text-xs text-blue-600 bg-blue-100 px-2 py-1 rounded">শ্রেণী: ${student.class}</span>
                    </div>
                </div>
                <input type="hidden" id="log-student-id" value="${studentId}">
            `;
        }
    }
    
    if (logModal) logModal.style.display = 'flex';
}

export async function handleStudentPhotoUploadHandler(studentId) {
    console.log('🔄 handleStudentPhotoUploadHandler called for student:', studentId);
    const photoPath = await handleStudentPhotoUpload(studentId);
    console.log('🔄 Upload result:', photoPath);
    if (photoPath) {
        updateStudentPhotoDisplay(studentId, photoPath);
        console.log('✅ Photo display updated after upload');
    }
}

export async function deleteStudentPhotoHandler(studentId) {
    console.log('🔄 deleteStudentPhotoHandler called for student:', studentId);
    const success = await deleteStudentPhoto(studentId);
    console.log('🔄 Delete result:', success);
    if (success) {
        updateStudentPhotoDisplay(studentId, null);
        console.log('✅ Photo display updated after deletion');
    }
}

// --- ALERT & MODAL FUNCTIONS ---
export function showLowScoreStudents(students) {
    const studentList = students.map(s => {
        const score = getHusnulKhulukScore(s.id);
        return `<div class="flex justify-between items-center p-3 bg-yellow-50 border-l-4 border-yellow-400 mb-2">
            <div>
                <div class="font-semibold text-gray-800">${s.name}</div>
                <div class="text-sm text-gray-600">পরিচিতি: ${s.rollNumber || 'N/A'}</div>
            </div>
            <div class="text-right">
                <div class="text-lg font-bold text-red-600">${score}</div>
                <div class="text-xs text-gray-500">হুসনুল খুলুক</div>
            </div>
        </div>`;
    }).join('');
    
    showModal('নিম্ন হুসনুল খুলুকের ছাত্ররা', `
        <div class="max-h-96 overflow-y-auto">
            ${studentList}
        </div>
        <div class="mt-4 text-sm text-gray-600">
            <i class="fas fa-info-circle mr-1"></i>
            এই ছাত্রদের হুসনুল খুলুক ${ALERT_CONFIG.LOW_SCORE_THRESHOLD} এর নিচে। হুসনুল খুলুক উন্নতির জন্য পদক্ষেপ নিন।
        </div>
    `);
}

export function showCriticalScoreStudents(students) {
    const studentList = students.map(s => {
        const score = getHusnulKhulukScore(s.id);
        return `<div class="flex justify-between items-center p-3 bg-red-50 border-l-4 border-red-400 mb-2">
            <div>
                <div class="font-semibold text-gray-800">${s.name}</div>
                <div class="text-sm text-gray-600">পরিচিতি: ${s.rollNumber || 'N/A'}</div>
            </div>
            <div class="text-right">
                <div class="text-lg font-bold text-red-700">${score}</div>
                <div class="text-xs text-gray-500">হুসনুল খুলুক</div>
            </div>
        </div>`;
    }).join('');
    
    showModal('ঝুঁকিপূর্ণ হুসনুল খুলুকের ছাত্ররা', `
        <div class="max-h-96 overflow-y-auto">
            ${studentList}
        </div>
        <div class="mt-4 text-sm text-red-600">
            <i class="fas fa-exclamation-triangle mr-1"></i>
            এই ছাত্রদের হুসনুল খুলুক খুবই কম (${ALERT_CONFIG.CRITICAL_SCORE_THRESHOLD} এর নিচে)। অবিলম্বে পদক্ষেপ প্রয়োজন।
        </div>
    `);
}

export function showStudentsWithNoProgress(students) {
    const studentList = students.map(s => `
        <div class="flex justify-between items-center p-3 bg-blue-50 border-l-4 border-blue-400 mb-2">
            <div>
                <div class="font-semibold text-gray-800">${s.name}</div>
                <div class="text-sm text-gray-600">পরিচিতি: ${s.rollNumber || 'N/A'}</div>
            </div>
            <div class="text-right">
                <div class="text-sm text-blue-600">
                    <i class="fas fa-book mr-1"></i>
                    অগ্রগতি নেই
                </div>
            </div>
        </div>
    `).join('');
    
    showModal('অগ্রগতি নেই এমন ছাত্ররা', `
        <div class="max-h-96 overflow-y-auto">
            ${studentList}
        </div>
        <div class="mt-4 text-sm text-blue-600">
            <i class="fas fa-info-circle mr-1"></i>
            এই ছাত্রদের শিক্ষার অগ্রগতি রেকর্ড করা হয়নি। শিক্ষার অগ্রগতি সেকশনে গিয়ে রেকর্ড করুন।
        </div>
    `);
}

export function showAbsentStudentsAlert(students) {
    const today = new Date().toLocaleDateString('bn-BD');
    const studentList = students.map(s => `
        <div class="flex justify-between items-center p-3 bg-orange-50 border-l-4 border-orange-400 mb-2">
            <div>
                <div class="font-semibold text-gray-800">${s.name}</div>
                <div class="text-sm text-gray-600">পরিচিতি: ${s.rollNumber || 'N/A'}</div>
            </div>
            <div class="text-right">
                <div class="text-sm text-orange-600">
                    <i class="fas fa-calendar-times mr-1"></i>
                    অনুপস্থিত
                </div>
            </div>
        </div>
    `).join('');
    
    showModal(`আজ (${today}) অনুপস্থিত ছাত্ররা`, `
        <div class="max-h-96 overflow-y-auto">
            ${studentList}
        </div>
        <div class="mt-4 text-sm text-orange-600">
            <i class="fas fa-info-circle mr-1"></i>
            এই ছাত্ররা আজ অনুপস্থিত। উপস্থিতি সেকশনে গিয়ে কারণ রেকর্ড করুন।
        </div>
    `);
}

export function showImportantLogs(logs) {
    const logList = logs.map(log => {
        let logDate = 'তারিখ নেই';
        let dateField = log.date || log.created_at;
        
        if (dateField) {
            try {
                const date = new Date(dateField);
                logDate = date.toLocaleDateString('bn-BD');
            } catch (e) {
                console.warn('Error formatting date:', e);
                logDate = 'তারিখ নেই';
            }
        }
        
        const studentName = log.student_id ? getStudentNameById(log.student_id) : 'শ্রেণী বিবরণ';
        return `<div class="p-3 bg-red-50 border-l-4 border-red-400 mb-2">
            <div class="flex justify-between items-start mb-2">
                <div class="font-semibold text-gray-800">${studentName}</div>
                <div class="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                    <i class="fas fa-calendar mr-1"></i>
                    ${logDate}
                </div>
            </div>
            <div class="text-sm text-gray-700 mb-2">${log.details}</div>
            <div class="text-xs text-red-600">
                <i class="fas fa-exclamation-circle mr-1"></i>
                অনুসরণ প্রয়োজন
            </div>
        </div>`;
    }).join('');
    
    showModal('গুরুত্বপূর্ণ বিবরণ (অনুসরণ প্রয়োজন)', `
        <div class="max-h-96 overflow-y-auto">
            ${logList}
        </div>
        <div class="mt-4 text-sm text-red-600">
            <i class="fas fa-info-circle mr-1"></i>
            এই বিবরণগুলো অনুসরণের অপেক্ষায়। শিক্ষকের পাতােয় গিয়ে অনুসরণ সম্পন্ন করুন।
        </div>
    `);
}

export function showAttendanceModal() {
    const attendanceLink = document.querySelector('a[onclick*="attendance"]');
    if (attendanceLink) {
        attendanceLink.click();
    } else {
        showModal('উপস্থিতি দেখুন', 'উপস্থিতি সেকশনে যান নেভিগেশন মেনু থেকে।');
    }
}

export function showClassAnalysis() {
    const performanceCard = document.querySelector('.performance-card');
    if (performanceCard) {
        performanceCard.scrollIntoView({ behavior: 'smooth' });
        performanceCard.style.border = '2px solid #3b82f6';
        setTimeout(() => {
            performanceCard.style.border = '';
        }, 3000);
    }
}

export function showTeachersLogbook() {
    const logbookSection = document.getElementById('logbook-display');
    if (logbookSection) {
        logbookSection.scrollIntoView({ behavior: 'smooth' });
        logbookSection.style.border = '2px solid #3b82f6';
        setTimeout(() => {
            logbookSection.style.border = '';
        }, 3000);
    }
}

export function showModal(title, message) {
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center';
    modal.style.zIndex = '9999'; // Higher than navigation (100) and other elements
    modal.innerHTML = `
        <div class="bg-white p-6 rounded-lg max-w-md mx-4">
            <h3 class="text-lg font-semibold mb-4">${title}</h3>
            <p class="text-gray-600 mb-6">${message}</p>
            <button onclick="this.closest('.fixed').remove()" class="w-full bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600">
                বন্ধ করুন
            </button>
        </div>
    `;
    document.body.appendChild(modal);
}

export function renderTeachersMessagingWidget() {
  console.log('🔄 renderTeachersMessagingWidget called');
  
  const container = document.getElementById('teachersMessagingWidgetContainer');
  console.log('🔍 Container found:', !!container);
  if (container) {
        container.innerHTML = `
            <div class="messaging-widget-container">
                <div class="widget-header">
                    <h3><i class="fas fa-comments"></i> Quick Messaging</h3>
                </div>
                <div id="teachersMessagingWidget" class="messaging-widget-content">
                    <div class="loading-state">
                        <div class="spinner-container">
                            <i class="fas fa-spinner fa-spin"></i>
                        </div>
                        <p>Loading messages...</p>
                        <div class="loading-dots">
                            <span>.</span><span>.</span><span>.</span>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        if (typeof window.initializeTeachersMessaging === 'function') {
            setTimeout(() => {
                window.initializeTeachersMessaging();
                
                // Auto-expand the messaging widget to show the interface directly
                setTimeout(() => {
                    const messagingWidget = document.getElementById('teachersMessagingWidget');
                    if (messagingWidget && !messagingWidget.classList.contains('expanded')) {
                        messagingWidget.classList.add('expanded');
                        
                        // Load the inline messaging interface directly
                        if (typeof window.loadInlineMessagingInterface === 'function') {
                            window.loadInlineMessagingInterface();
                        }
                    }
                }, 500);
            }, 300);
        } else {
            const widgetContent = document.getElementById('teachersMessagingWidget');
            if (widgetContent) {
                widgetContent.innerHTML = `
                    <div class="messaging-widget">
                        <div class="widget-header">
                            <h4><i class="fas fa-comments"></i> Messages</h4>
                        </div>
                        <div class="widget-content">
                            <div class="conversation-info">
                                <p>Messaging system loading...</p>
                                <p>Please refresh the page if this persists.</p>
                            </div>
                            <div class="widget-actions">
                                <button onclick="location.reload()" class="btn btn-primary btn-sm">
                                    <i class="fas fa-refresh"></i> Refresh Page
                                </button>
                            </div>
                        </div>
                    </div>
                `;
            }
        }
    } else {
        console.log('⚠️ teachersMessagingWidgetContainer not found (may not be rendered yet)');
        console.log('🔍 Available elements with "messaging" in ID:', Array.from(document.querySelectorAll('[id*="messaging"]')).map(el => el.id));
        console.log('🔍 Available elements with "teacher" in ID:', Array.from(document.querySelectorAll('[id*="teacher"]')).map(el => el.id));
        console.log('🔍 Teachers Corner section active:', document.getElementById('teachers-corner-section')?.classList.contains('active'));
        // Silently skip - this is normal if Teachers Corner HTML hasn't been fully rendered yet
    }
}