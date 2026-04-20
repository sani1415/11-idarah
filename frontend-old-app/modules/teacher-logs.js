/**
 * Teacher Logs Notification System
 * Manages teacher log notifications and displays them in a modal window
 */

// State management
const teacherLogsState = {
    selectedClass: null,
    logs: {},
    unreadCounts: {},
    totalUnread: 0,
    isWindowOpen: false
};

/**
 * Initialize teacher logs system on dashboard load
 */
export async function initTeacherLogs() {
    console.log('Initializing Teacher Logs system...');
    await loadUnreadCounts();
}

/**
 * Load unread counts from backend
 */
async function loadUnreadCounts() {
    try {
        const response = await fetch('/api/teacher-logs/notifications', {
            credentials: 'include'
        });
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        teacherLogsState.unreadCounts = data.classes || {};
        teacherLogsState.totalUnread = data.total_unread || 0;
        
        updateDashboardCount();
        console.log('Teacher logs unread counts loaded:', teacherLogsState.totalUnread);
    } catch (error) {
        console.error('Error loading teacher logs counts:', error);
        updateDashboardCount(true); // Show error state
    }
}

/**
 * Update the dashboard card count
 */
function updateDashboardCount(isError = false) {
    const countElement = document.getElementById('teacherLogsUnreadCount');
    if (!countElement) return;
    
    if (isError) {
        countElement.innerHTML = '<i class="fas fa-exclamation-triangle text-red-500" style="font-size: 1.5rem;"></i>';
        return;
    }
    
    if (teacherLogsState.totalUnread > 0) {
        countElement.innerHTML = `
            <span class="relative">
                ${teacherLogsState.totalUnread}
                <span class="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center animate-pulse">
                    ${teacherLogsState.totalUnread}
                </span>
            </span>
        `;
    } else {
        countElement.textContent = '0';
    }
}

/**
 * Open the Teacher Logs window
 */
export async function openTeacherLogsWindow() {
    if (teacherLogsState.isWindowOpen) return;
    
    teacherLogsState.isWindowOpen = true;
    
    // Create modal window
    const modal = document.createElement('div');
    modal.id = 'teacherLogsModal';
    modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center';
    modal.style.zIndex = '9999';
    
    modal.innerHTML = `
        <div class="bg-white rounded-lg shadow-2xl w-11/12 h-5/6 max-w-7xl flex flex-col">
            <!-- Header -->
            <div class="bg-gradient-to-r from-purple-600 to-purple-800 text-white p-6 rounded-t-lg flex justify-between items-center">
                <div>
                    <h2 class="text-2xl font-bold" data-translate="teacherLogs">Teacher Logs</h2>
                    <p class="text-purple-100 text-sm mt-1">View and manage teacher submitted logs</p>
                </div>
                <button onclick="closeTeacherLogsWindow()" class="text-white hover:text-purple-200 transition-colors">
                    <i class="fas fa-times text-3xl"></i>
                </button>
            </div>
            
            <!-- Summary Section -->
            <div id="teacherLogsSummary" class="bg-purple-50 p-4 border-b border-purple-200">
                <div class="flex justify-around text-center">
                    <div>
                        <div class="text-2xl font-bold text-purple-600" id="summaryTotal">
                            <i class="fas fa-spinner fa-spin"></i>
                        </div>
                        <div class="text-sm text-gray-600">Total Logs</div>
                    </div>
                    <div>
                        <div class="text-2xl font-bold text-red-600" id="summaryUnread">
                            <i class="fas fa-spinner fa-spin"></i>
                        </div>
                        <div class="text-sm text-gray-600">Unread</div>
                    </div>
                    <div>
                        <div class="text-2xl font-bold text-green-600" id="summaryRead">
                            <i class="fas fa-spinner fa-spin"></i>
                        </div>
                        <div class="text-sm text-gray-600">Read</div>
                    </div>
                </div>
            </div>
            
            <!-- Main Content: Sidebar + Logs -->
            <div class="flex flex-1 overflow-hidden">
                <!-- Left Sidebar: Classes List -->
                <div class="w-1/4 bg-gray-50 border-r border-gray-200 overflow-y-auto">
                    <div class="p-4">
                        <h3 class="text-lg font-semibold text-gray-700 mb-4">Classes</h3>
                        <div id="teacherLogsClassesList" class="space-y-2">
                            <div class="text-center py-8">
                                <i class="fas fa-spinner fa-spin text-3xl text-gray-400"></i>
                                <p class="text-gray-500 mt-2">Loading classes...</p>
                            </div>
                        </div>
                    </div>
                </div>
                
                <!-- Right Main Content: Logs Display -->
                <div class="flex-1 flex flex-col overflow-hidden">
                    <div class="p-6 border-b border-gray-200">
                        <h3 id="selectedClassName" class="text-xl font-semibold text-gray-700">
                            Select a class to view logs
                        </h3>
                    </div>
                    <div id="teacherLogsContent" class="flex-1 overflow-y-auto p-6">
                        <div class="text-center py-16">
                            <i class="fas fa-clipboard-list text-6xl text-gray-300 mb-4"></i>
                            <p class="text-gray-500 text-lg">Select a class from the sidebar to view teacher logs</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Load summary and classes
    await loadSummary();
    await loadClassesList();
    
    // Add keyboard navigation
    document.addEventListener('keydown', handleKeyboardNavigation);
}

/**
 * Close the Teacher Logs window
 */
export function closeTeacherLogsWindow() {
    const modal = document.getElementById('teacherLogsModal');
    if (modal) {
        modal.remove();
    }
    teacherLogsState.isWindowOpen = false;
    teacherLogsState.selectedClass = null;
    
    // Remove keyboard listener
    document.removeEventListener('keydown', handleKeyboardNavigation);
    
    // Refresh dashboard counts
    loadUnreadCounts();
}

/**
 * Handle keyboard navigation
 */
function handleKeyboardNavigation(event) {
    if (event.key === 'Escape') {
        closeTeacherLogsWindow();
    }
}

/**
 * Load summary statistics
 */
async function loadSummary() {
    try {
        const response = await fetch('/api/teacher-logs/summary', {
            credentials: 'include'
        });
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        
        document.getElementById('summaryTotal').textContent = data.total || 0;
        document.getElementById('summaryUnread').textContent = data.unread || 0;
        document.getElementById('summaryRead').textContent = data.read || 0;
    } catch (error) {
        console.error('Error loading summary:', error);
        document.getElementById('summaryTotal').innerHTML = '<i class="fas fa-exclamation-triangle text-red-500"></i>';
        document.getElementById('summaryUnread').innerHTML = '<i class="fas fa-exclamation-triangle text-red-500"></i>';
        document.getElementById('summaryRead').innerHTML = '<i class="fas fa-exclamation-triangle text-red-500"></i>';
    }
}

/**
 * Load classes list with unread counts
 */
async function loadClassesList() {
    const container = document.getElementById('teacherLogsClassesList');
    
    try {
        const response = await fetch('/api/teacher-logs/notifications', {
            credentials: 'include'
        });
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        const classes = data.classes || {};
        
        if (Object.keys(classes).length === 0) {
            container.innerHTML = `
                <div class="text-center py-8">
                    <i class="fas fa-inbox text-4xl text-gray-300 mb-2"></i>
                    <p class="text-gray-500">No logs found</p>
                </div>
            `;
            return;
        }
        
        // Sort classes by unread count (highest first)
        const sortedClasses = Object.entries(classes).sort((a, b) => b[1] - a[1]);
        
        container.innerHTML = sortedClasses.map(([className, unreadCount]) => `
            <div class="class-item relative p-3 rounded-lg cursor-pointer transition-all hover:bg-purple-100 border border-transparent hover:border-purple-300"
                 onclick="selectClass('${className}')"
                 data-class="${className}">
                <div class="flex justify-between items-center">
                    <div class="flex items-center space-x-2">
                        ${unreadCount > 0 ? '<span class="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>' : ''}
                        <span class="font-medium text-gray-700">${className}</span>
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
        console.error('Error loading classes list:', error);
        container.innerHTML = `
            <div class="text-center py-8">
                <i class="fas fa-exclamation-triangle text-4xl text-red-500 mb-2"></i>
                <p class="text-gray-500">Error loading classes</p>
            </div>
        `;
    }
}

/**
 * Select a class and load its logs
 */
export async function selectClass(className) {
    teacherLogsState.selectedClass = className;
    
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
    await loadClassLogs(className);
}

/**
 * Load logs for a specific class
 */
async function loadClassLogs(className) {
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
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
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
        
        // Store logs in state
        teacherLogsState.logs[className] = logs;
        
        // Display logs
        container.innerHTML = `
            <div class="space-y-4">
                ${logs.map(log => createLogCard(log)).join('')}
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

/**
 * Create a log card HTML
 */
function createLogCard(log) {
    const isUnread = log.status === 'unread';
    const isImportant = log.is_important;
    const needsFollowup = log.needs_followup;
    
    return `
        <div class="log-card bg-white border-2 ${isUnread ? 'border-purple-300 bg-purple-50' : 'border-gray-200'} rounded-lg p-5 shadow-sm hover:shadow-md transition-all cursor-pointer"
             onclick="markLogAsRead(${log.id})"
             data-log-id="${log.id}">
            <div class="flex justify-between items-start mb-3">
                <div class="flex items-center space-x-3">
                    <i class="fas fa-user-circle text-3xl text-gray-400"></i>
                    <div>
                        <div class="font-semibold text-gray-800">${log.teacher_name || 'Unknown Teacher'}</div>
                        <div class="text-sm text-gray-500">${formatDate(log.created_at)}</div>
                    </div>
                </div>
                <div class="flex items-center space-x-2">
                    ${isImportant ? '<span class="bg-red-500 text-white text-xs font-bold px-3 py-1 rounded-full"><i class="fas fa-exclamation-circle"></i> Important</span>' : ''}
                    ${needsFollowup ? '<span class="bg-orange-500 text-white text-xs font-bold px-3 py-1 rounded-full"><i class="fas fa-bell"></i> Follow-up</span>' : ''}
                </div>
            </div>
            
            <div class="mb-3">
                <div class="text-sm font-medium text-gray-600 mb-1">
                    ${log.log_type === 'general' ? 'General Log' : log.log_type === 'behavior' ? 'Behavior' : log.log_type === 'academic' ? 'Academic' : log.log_type}
                </div>
                ${log.student_id ? `<div class="text-sm text-gray-500">Student ID: ${log.student_id}</div>` : ''}
            </div>
            
            <div class="text-gray-700 leading-relaxed">
                ${log.details || 'No details provided'}
            </div>
            
            ${isUnread ? `
                <div class="mt-4 pt-4 border-t border-purple-200 text-sm text-purple-600 flex items-center">
                    <i class="fas fa-hand-pointer mr-2"></i>
                    Click to mark as read
                </div>
            ` : ''}
        </div>
    `;
}

/**
 * Format date for display
 */
function formatDate(dateString) {
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

/**
 * Mark a log as read
 */
export async function markLogAsRead(logId) {
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
        
        console.log(`Log ${logId} marked as read`);
        
        // Update UI
        const logCard = document.querySelector(`[data-log-id="${logId}"]`);
        if (logCard) {
            logCard.classList.remove('border-purple-300', 'bg-purple-50');
            logCard.classList.add('border-gray-200');
            
            
            // Remove click to read message
            const readMessage = logCard.querySelector('.border-purple-200');
            if (readMessage && readMessage.parentElement) {
                readMessage.parentElement.remove();
            }
        }
        
        // Refresh counts
        await loadSummary();
        await loadClassesList();
        await loadUnreadCounts();
        
    } catch (error) {
        console.error('Error marking log as read:', error);
        alert('Failed to mark log as read. Please try again.');
    }
}

// Expose functions to global scope for HTML onclick handlers
window.openTeacherLogsWindow = openTeacherLogsWindow;
window.closeTeacherLogsWindow = closeTeacherLogsWindow;
window.selectClass = selectClass;
window.markLogAsRead = markLogAsRead;

