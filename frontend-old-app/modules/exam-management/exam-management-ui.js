// exam-management-ui.js

import { t } from '../../translations.js';
// Note: These functions are imported dynamically to avoid circular dependencies
import { getEducationalYearName, currentClassExams, currentClassExamResults } from './exam-management-core.js';

// Render the exam management section in Teachers Corner
function renderClassExamSection(className) {
    const examSectionHTML = `
        <!-- Class Exam Management Section -->
        <div class="bg-white p-6 rounded-lg shadow-md mt-6">
            <div class="flex justify-between items-center mb-6">
                <h3 class="text-xl font-semibold text-gray-700">
                    <i class="fas fa-graduation-cap text-blue-500"></i> ${className} - ${t('examManagement')}
                </h3>
                <button onclick="createNewClassExam('${className}')" class="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 flex items-center gap-2">
                    <i class="fas fa-plus"></i> ${t('createNewExam')}
                </button>
            </div>
            
            <!-- Exam List -->
            <div class="mb-6">
                <h4 class="font-semibold text-gray-600 mb-3">${t('recentExams')}</h4>
                <div id="class-exam-list" class="space-y-3 max-h-80 overflow-y-auto">
                    <!-- Exam list will be rendered here -->
                </div>
            </div>
            
            <!-- Quick Actions -->
            <div class="flex flex-wrap gap-3">
                <button onclick="viewAllClassExams('${className}')" class="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 flex items-center gap-2 text-sm">
                    <i class="fas fa-list"></i> ${t('viewAllExams')}
                </button>
                <button onclick="exportClassResults('${className}')" class="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 flex items-center gap-2 text-sm">
                    <i class="fas fa-download"></i> ${t('exportResults')}
                </button>
                <button onclick="classExamAnalytics('${className}')" class="bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700 flex items-center gap-2 text-sm">
                    <i class="fas fa-chart-bar"></i> ${t('viewAnalysis')}
                </button>
            </div>
        </div>
    `;
    
    
    return examSectionHTML;
}


// Render the list of exams for the current class
function renderClassExamList(className) {
    const examListElement = document.getElementById('class-exam-list');
    if (!examListElement) return;
    
    if (currentClassExams.length === 0) {
        examListElement.innerHTML = `
            <div class="text-center py-8 text-gray-500 bg-gray-50 rounded-lg">
                <i class="fas fa-clipboard-list text-4xl mb-3"></i>
                <p class="font-medium">${t('noExamsCreated')}</p>
                <p class="text-sm">${t('createExamInstruction')}</p>
            </div>
        `;
        return;
    }
    
    // Sort exams by date (newest first)
    const sortedExams = [...currentClassExams].sort((a, b) => 
        new Date(b.createdDate) - new Date(a.createdDate)
    );
    
    examListElement.innerHTML = sortedExams.map(exam => {
        const results = currentClassExamResults[exam.id] || {};
        const studentsInClass = window.students ? window.students.filter(s => s.class === className && s.status === 'active') : [];
        
        // Count students with ALL subjects completed (marks > 0 for all books)
        const completedResults = Object.keys(results).filter(studentId => {
            const studentMarks = results[studentId];
            return exam.selectedBooks.every(book => 
                studentMarks[`${book.id}_${book.examType}`] !== null && studentMarks[`${book.id}_${book.examType}`] !== undefined && studentMarks[`${book.id}_${book.examType}`] > 0
            );
        }).length;
        
        const progressPercentage = studentsInClass.length > 0 ? Math.round((completedResults / studentsInClass.length) * 100) : 0;
        
        return `
            <div class="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-all cursor-pointer" onclick="openClassExam('${exam.id}')">
                <div class="flex justify-between items-start">
                    <div class="flex-1">
                        <h5 class="font-semibold text-gray-800">${exam.name}</h5>
                        <p class="text-sm text-gray-600">${getEducationalYearName(exam)} - ${exam.term}</p>
                        <p class="text-xs text-gray-500 mt-1">
                            <i class="fas fa-calendar mr-1"></i>
                            ${new Date(exam.createdDate).toLocaleDateString('bn-BD')}
                        </p>
                        <div class="flex items-center gap-4 mt-2">
                            <span class="text-xs text-gray-600">
                                <i class="fas fa-book mr-1"></i>
                                ${exam.selectedBooks.length} ${t('books')}
                            </span>
                            <span class="text-xs text-gray-600">
                                <i class="fas fa-users mr-1"></i>
                                ${studentsInClass.length} ${t('students')}
                            </span>
                        </div>
                    </div>
                    <div class="text-right">
                        <span class="inline-block px-2 py-1 rounded-full text-xs font-semibold ${getExamStatusClass(exam.status)}">
                            ${getExamStatusText(exam.status)}
                        </span>
                        <div class="mt-2 text-sm">
                            <div class="text-gray-600">${t('resultEntry')}</div>
                            <div class="font-semibold ${progressPercentage === 100 ? 'text-green-600' : 'text-yellow-600'}">
                                ${completedResults}/${studentsInClass.length} (${progressPercentage}%)
                            </div>
                        </div>
                    </div>
                </div>
                
                <!-- Progress Bar -->
                <div class="mt-3">
                    <div class="w-full bg-gray-200 rounded-full h-2">
                        <div class="bg-blue-500 h-2 rounded-full transition-all duration-300" style="width: ${progressPercentage}%"></div>
                    </div>
                </div>
                
                <!-- Quick Actions -->
                <div class="flex gap-2 mt-3">
                    <button onclick="editClassExam('${exam.id}', event)" class="text-blue-600 hover:text-blue-800 text-xs px-2 py-1 rounded" title="${t('editTooltip')}">
                        <i class="fas fa-edit"></i> ${t('edit')}
                    </button>
                    <button onclick="viewClassExamResults('${exam.id}', event)" class="text-green-600 hover:text-green-800 text-xs px-2 py-1 rounded" title="${t('resultsTooltip')}">
                        <i class="fas fa-chart-bar"></i> ${t('results')}
                    </button>
                    <button onclick="duplicateClassExam('${exam.id}', event)" class="text-purple-600 hover:text-purple-800 text-xs px-2 py-1 rounded" title="${t('copyTooltip')}">
                        <i class="fas fa-copy"></i> ${t('copy')}
                    </button>
                    <button onclick="deleteClassExam('${exam.id}', event)" class="text-red-600 hover:text-red-800 text-xs px-2 py-1 rounded" title="${t('deleteTooltip')}">
                        <i class="fas fa-trash"></i> ${t('delete')}
                    </button>
                </div>
            </div>
        `;
    }).join('');
}

// Quick notification system
function showQuickNotification(message, type = 'info') {
    // Remove any existing notification
    const existingNotification = document.getElementById('quick-notification');
    if (existingNotification) {
        existingNotification.remove();
    }
    
    const notification = document.createElement('div');
    notification.id = 'quick-notification';
    notification.className = `fixed top-4 right-4 z-50 px-4 py-2 rounded-lg shadow-lg text-white text-sm font-medium transition-all duration-300`;
    
    // Set color based on type
    if (type === 'success') {
        notification.classList.add('bg-green-500');
    } else if (type === 'error') {
        notification.classList.add('bg-red-500');
    } else {
        notification.classList.add('bg-blue-500');
    }
    
    notification.textContent = message;
    notification.style.transform = 'translateX(100%)';
    
    document.body.appendChild(notification);
    
    // Animate in
    setTimeout(() => {
        notification.style.transform = 'translateX(0)';
    }, 10);
    
    // Auto remove after 3 seconds
    setTimeout(() => {
        notification.style.transform = 'translateX(100%)';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 300);
    }, 3000);
}

// Helper functions for exam status
function getExamStatusClass(status) {
    const statusClasses = {
        'draft': 'bg-yellow-100 text-yellow-800',
        'published': 'bg-green-100 text-green-800',
        'completed': 'bg-blue-100 text-blue-800'
    };
    return statusClasses[status] || 'bg-gray-100 text-gray-800';
}

function getExamStatusText(status) {
    const statusTexts = {
        'draft': t('draft'),
        'published': t('published'),
        'completed': t('completed')
    };
    return statusTexts[status] || status;
}

function getResultCellColor(mark, totalMarks) {
    if (mark === null || mark === '' || mark === undefined) return '';
    const percentage = (mark / totalMarks) * 100;
    if (percentage >= 80) return 'bg-green-100';
    if (percentage >= 60) return 'bg-blue-100';
    if (percentage >= 40) return 'bg-yellow-100';
    return 'bg-red-100';
}

function getGradeColorClass(grade) {
    const gradeColors = {
        'A+': 'text-green-600',
        'A': 'text-blue-600',
        'A-': 'text-indigo-600',
        'B': 'text-yellow-600',
        'C': 'text-orange-600',
        'D': 'text-red-600',
        'F': 'text-red-800'
    };
    return gradeColors[grade] || 'text-gray-600';
}

// Helper function for rank display
function getRankHTML(rank) {
    if (!rank) return '-';
    if (rank <= 3) {
        const colors = { 1: '#f1c40f', 2: '#bdc3c7', 3: '#d35400' };
        return `<span style="background: ${colors[rank]}; color: white; padding: 2px 8px; border-radius: 4px; font-weight: bold;">${rank}</span>`;
    }
    return rank;
}

export {
    renderClassExamSection,
    renderClassExamList,
    showQuickNotification,
    getExamStatusClass,
    getExamStatusText,
    getResultCellColor,
    getGradeColorClass,
    getRankHTML
};