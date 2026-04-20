// exam-results.js

import { t } from '../../translations.js';
import { currentClassExamResults, currentExamSession, initializeUnsavedChangesTracking, markAsChanged, markAsSaved, hasUnsavedChanges, saveExamSession, getExamSessionKey, getCurrentExamSession } from './exam-management-core.js';
import { getEducationalYearName } from './exam-management-core.js';
import { getResultCellColor, getGradeColorClass, getRankHTML } from './exam-management-ui.js';

// Result Entry Interface
function openResultEntryInterface(examSession) {
    console.log(`📝 Opening result entry for: ${examSession.name}`);
    
    // Initialize unsaved changes tracking
    initializeUnsavedChangesTracking(examSession);
    
    const modal = document.createElement('div');
    modal.id = 'result-entry-modal';
    modal.className = 'modal-backdrop justify-center items-center';
    modal.style.display = 'flex';
    
    // Get students for this class
    const studentsInClass = window.students ? window.students.filter(s => 
        s.class === examSession.class && s.status === 'active'
    ) : [];
    
    console.log(`👥 Found ${studentsInClass.length} active students for class: ${examSession.class}`);
    console.log(`📚 Total students available: ${window.students ? window.students.length : 0}`);
    
    if (studentsInClass.length === 0) {
        console.warn(`⚠️ No students found for class ${examSession.class}. Available classes:`, 
            window.students ? [...new Set(window.students.map(s => s.class))] : []);
    }
    
    // Calculate dynamic width based on number of books
    const baseWidth = 75; // Base width percentage
    const widthPerBook = 3; // Additional width per book
    const maxWidth = 85; // Maximum width percentage
    const maxHeight = 85; // Maximum height percentage
    const dynamicWidth = Math.min(baseWidth + (examSession.selectedBooks.length * widthPerBook), maxWidth);
    
    console.log(`📐 Dynamic modal sizing: ${examSession.selectedBooks.length} books → ${dynamicWidth}% width, ${maxHeight}% height`);

    modal.innerHTML = `
        <div class="modal-content bg-white rounded-lg shadow-xl" style="width: ${dynamicWidth}vw; height: ${maxHeight}vh; max-width: none; max-height: none;">
            <!-- Modal Header -->
            <div class="px-6 py-4 border-b bg-gradient-to-r from-blue-50 to-indigo-50">
                <div class="flex justify-between items-center">
                    <div>
                        <h3 class="text-xl font-bold text-gray-800">${examSession.name} - ফলাফল এন্ট্রি</h3>
                        <p class="text-sm text-gray-600 mt-1">${getEducationalYearName(examSession)} - ${examSession.term} - ${examSession.class}</p>
                        <div class="flex items-center gap-4 mt-2">
                            <span class="text-xs text-blue-600 bg-blue-100 px-2 py-1 rounded-full">
                                <i class="fas fa-book mr-1"></i>${examSession.selectedBooks.length} বই
                            </span>
                            <span class="text-xs text-green-600 bg-green-100 px-2 py-1 rounded-full">
                                <i class="fas fa-users mr-1"></i>${studentsInClass.length} ছাত্র
                            </span>
                        </div>
                    </div>
                    <button onclick="closeResultEntryModal()" class="text-gray-400 hover:text-gray-600 text-2xl p-2 rounded-full hover:bg-gray-200 transition-all">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
            </div>
            
            <!-- Modal Body -->
            <div class="flex-1 overflow-y-auto" style="height: calc(85vh - 160px);">
                <div class="p-6">
                    <!-- Quick Stats -->
                    <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                        <div class="bg-blue-50 p-4 rounded-lg text-center border-l-4 border-blue-400">
                            <div class="text-2xl font-bold text-blue-600">${studentsInClass.length}</div>
                            <div class="text-sm text-blue-700">মোট ছাত্র</div>
                        </div>
                        <div class="bg-green-50 p-4 rounded-lg text-center border-l-4 border-green-400">
                            <div class="text-2xl font-bold text-green-600">${examSession.selectedBooks.length}</div>
                            <div class="text-sm text-green-700">পরীক্ষার বই</div>
                        </div>
                        <div class="bg-yellow-50 p-4 rounded-lg text-center border-l-4 border-yellow-400">
                            <div class="text-2xl font-bold text-yellow-600" id="completed-results-count">0</div>
                            <div class="text-sm text-yellow-700">সম্পূর্ণ ফলাফল</div>
                        </div>
                        <div class="bg-purple-50 p-4 rounded-lg text-center border-l-4 border-purple-400">
                            <div class="text-2xl font-bold text-purple-600" id="class-average-display">0%</div>
                            <div class="text-sm text-purple-700">শ্রেণীর গড়</div>
                        </div>
                    </div>
                    
                    <!-- Results Entry Table -->
                    <div class="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-lg">
                        <div class="overflow-x-auto">
                            <table class="w-full text-base">
                                <thead class="bg-gray-100 sticky top-0 z-10">
                                    <tr>
                                        <th class="px-4 py-4 text-left font-semibold text-gray-700 border-r" style="min-width: 200px;">ছাত্রের নাম</th>
                                        <th class="px-3 py-4 text-center font-semibold text-gray-700 border-r" style="width: 80px;">পরিচিতি</th>
                                        ${examSession.selectedBooks.map(book => 
                                            `<th class="px-4 py-4 text-center font-semibold text-gray-700 border-r ${book.isScore ? 'bg-gradient-to-r from-purple-100 to-pink-100' : ''}" style="min-width: 140px;">
                                                <div class="text-base ${book.isScore ? 'text-purple-800 font-bold' : ''}">
                                                    ${book.isScore ? '<i class="fas fa-star text-purple-500 mr-1"></i>' : ''}${book.name}
                                                </div>
                                                ${book.examType === 'viva' ? '<div class="text-xs text-orange-600 font-medium">মৌখিক</div>' : ''}
                                                ${book.isScore ? `<div class="text-xs text-purple-600 font-medium">${t('score')}</div>` : ''}
                                                <div class="text-xs text-gray-500 font-normal">(মোট: ${book.totalMarks})</div>
                                            </th>`
                                        ).join('')}
                                        <th class="px-3 py-4 text-center font-semibold text-gray-700 border-r" style="width: 90px;">মোট</th>
                                        <th class="px-3 py-4 text-center font-semibold text-gray-700 border-r" style="width: 80px;">%</th>
                                        <th class="px-3 py-4 text-center font-semibold text-gray-700 border-r" style="width: 80px;">গ্রেড</th>
                                        <th class="px-3 py-4 text-center font-semibold text-gray-700" style="width: 80px;">র‍্যাঙ্ক</th>
                                    </tr>
                                </thead>
                                <tbody id="result-entry-table-body">
                                    ${studentsInClass.map(student => {
                                        return renderStudentResultRow(student, examSession);
                                    }).join('')}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
                
                <!-- Action Buttons Footer - Sticky at bottom of modal -->
                <div class="sticky bottom-0 left-0 right-0 px-6 py-4 bg-gray-50 border-t border-gray-200 z-30 shadow-lg">
                    <div class="grid grid-cols-2 md:grid-cols-4 gap-3 max-w-4xl mx-auto">
                        <!-- Utility Actions -->
                        <button onclick="clearAllResults('${examSession.id}')" class="bg-red-500 hover:bg-red-600 text-white px-4 py-2.5 rounded-md text-sm font-medium transition-colors flex items-center justify-center gap-2">
                            <i class="fas fa-eraser"></i>
                            <span>সব মুছুন</span>
                        </button>
                        <button onclick="importResultsCSV('${examSession.id}')" class="bg-indigo-500 hover:bg-indigo-600 text-white px-4 py-2.5 rounded-md text-sm font-medium transition-colors flex items-center justify-center gap-2">
                            <i class="fas fa-upload"></i>
                            <span>CSV ইম্পোর্ট</span>
                        </button>
                        
                        <!-- Primary Actions -->
                        <button onclick="publishResults('${examSession.id}')" class="bg-green-500 hover:bg-green-600 text-white px-4 py-2.5 rounded-md text-sm font-semibold transition-colors flex items-center justify-center gap-2">
                            <i class="fas fa-check-circle"></i>
                            <span>ফলাফল প্রকাশ</span>
                        </button>
                    </div>
                </div>
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Initialize result calculations
    calculateAllResults(examSession);
}

function renderStudentResultRow(student, examSession) {
    // Get existing results if any (try from API-loaded cache first)
    let studentResults = {};
    
    if (currentClassExamResults[examSession.id]?.[student.id]) {
        // Use API-loaded results from cache
        studentResults = currentClassExamResults[examSession.id][student.id];
    } else {
        // Fallback to localStorage
        const allExamResults = JSON.parse(localStorage.getItem('examResults')) || {};
        const sessionKey = getExamSessionKey(examSession);
        studentResults = allExamResults[sessionKey]?.[student.id] || {};
    }
    
    let rowHTML = `
        <tr class="border-b hover:bg-gray-50" style="height: 60px;">
            <td class="px-4 py-3 font-medium text-blue-600 cursor-pointer border-r" onclick="showStudentDetail('${student.id}', 'exam-results')">${student.name}</td>
            <td class="px-3 py-3 text-center border-r">${student.rollNumber}</td>
    `;
    
    // Add input fields for each book
    examSession.selectedBooks.forEach(book => {
        const resultKey = `${book.id}_${book.examType}`;
        const mark = studentResults[resultKey] || '';
        const colorClass = getResultCellColor(mark, book.totalMarks);
        const isScore = book.isScore || false;
        
        rowHTML += `
            <td class="px-4 py-3 text-center border-r ${colorClass} ${isScore ? 'bg-gradient-to-r from-purple-50 to-pink-50' : ''}">
                <input type="number" 
                       value="${mark}" 
                       data-student-id="${student.id}"
                       data-book-id="${book.id}"
                       data-exam-type="${book.examType}"
                       onchange="updateStudentMark('${student.id}', '${book.id}', '${book.examType}', this.value, '${examSession.id}')"
                       class="w-20 h-10 text-center text-base border ${isScore ? 'border-purple-300 focus:border-purple-500 focus:ring-purple-200' : 'border-gray-300 focus:border-blue-500 focus:ring-blue-200'} rounded-md p-2 font-medium"
                       min="0" 
                       max="${book.totalMarks}"
                       placeholder="0"
                       ${isScore ? 'style="background-color: #faf5ff;"' : ''}>
            </td>
        `;
    });
    
    // Calculate totals for this student
    const { total, percentage, grade } = calculateStudentExamTotals(student.id, examSession, studentResults);
    
    rowHTML += `
        <td class="px-3 py-3 text-center font-bold text-base border-r" id="total-${student.id}">${total}</td>
        <td class="px-3 py-3 text-center font-bold text-base border-r" id="percentage-${student.id}">${percentage}%</td>
        <td class="px-3 py-3 text-center font-bold text-lg border-r ${getGradeColorClass(grade)}" id="grade-${student.id}">${grade}</td>
        <td class="px-3 py-3 text-center font-semibold text-base" id="rank-${student.id}">-</td>
    </tr>`;
    
    return rowHTML;
}

function updateStudentMark(studentId, bookId, examType, value, examId) {
    const mark = value === '' ? null : parseInt(value);
    const examSession = getCurrentExamSession(examId);
    if (!examSession) return;
    
    // Update local cache only (no database calls)
    if (!currentClassExamResults[examSession.id]) currentClassExamResults[examSession.id] = {};
    if (!currentClassExamResults[examSession.id][studentId]) currentClassExamResults[examSession.id][studentId] = {};
    const resultKey = `${bookId}_${examType}`;
    currentClassExamResults[examSession.id][studentId][resultKey] = mark;
    
    // Mark as changed for unsaved changes tracking
    markAsChanged();

        // Recalculate and update this student's totals
    const studentResults = currentClassExamResults[examSession.id][studentId];
    const { total, percentage, grade } = calculateStudentExamTotals(studentId, examSession, studentResults);
    
    // Update DOM elements
    const totalElement = document.getElementById(`total-${studentId}`);
    const percentageElement = document.getElementById(`percentage-${studentId}`);
    const gradeElement = document.getElementById(`grade-${studentId}`);
    
    if (totalElement) totalElement.textContent = total;
    if (percentageElement) percentageElement.textContent = percentage;
    if (gradeElement) {
        gradeElement.textContent = grade;
        gradeElement.className = `px-3 py-3 text-center font-bold text-lg border-r ${getGradeColorClass(grade)}`;
    }
    
    // Update cell color
    const book = examSession.selectedBooks.find(b => b.id === bookId);
    const inputElement = document.querySelector(`input[data-student-id="${studentId}"][data-book-id="${bookId}"]`);
    if (inputElement && book) {
    const cellElement = inputElement.parentElement;
        const totalMarks = book.totalMarks || 100; // Default to 100 if totalMarks is undefined
        cellElement.className = `px-4 py-3 text-center border-r ${getResultCellColor(mark, totalMarks)}`;
    }
    
    // Recalculate ranks for all students
    updateAllRanks(examSession);
    
    // Update class statistics
    updateClassStatistics(examSession);
    
    // Mark updated locally
}

function calculateStudentExamTotals(studentId, examSession, studentResults) {
    let totalObtained = 0;
    let totalPossibleMarks = 0;
    
    examSession.selectedBooks.forEach(book => {
        const resultKey = `${book.id}_${book.examType}`;
        const obtainedMarks = studentResults[resultKey] || 0;
        totalObtained += obtainedMarks;
        // Only count towards total if student has marks for this book
        if (obtainedMarks > 0 || studentResults[resultKey] === 0) {
            totalPossibleMarks += book.totalMarks;
        }
    });
    
    const percentage = totalPossibleMarks > 0 ? Math.round((totalObtained / totalPossibleMarks) * 100) : 0;
    const grade = getExamGrade(percentage);
    return { total: totalObtained, percentage, grade, totalPossible: totalPossibleMarks };
}

function updateAllRanks(examSession) {
    const studentsInClass = window.students ? window.students.filter(s => 
        s.class === examSession.class && s.status === 'active'
    ) : [];
    
    // Calculate ranks
    const studentRanks = calculateExamClassRanks(examSession, examSession.id, studentsInClass);
    
    // Update rank display for all students
    Object.keys(studentRanks).forEach(studentId => {
        const rankElement = document.getElementById(`rank-${studentId}`);
        if (rankElement) {
            const rank = studentRanks[studentId];
            rankElement.innerHTML = getRankHTML(rank);
        }
    });
}

function calculateExamClassRanks(examSession, examId, studentsInClass) {
    // Use the new data structure with examSession.id
    const sessionResults = currentClassExamResults[examId] || {};
    
    const studentTotals = studentsInClass.map(student => {
        const studentResults = sessionResults[student.id] || {};
        const { total } = calculateStudentExamTotals(student.id, examSession, studentResults);
        return { id: student.id, total };
    });
    
    // Sort by total marks (highest first)
    studentTotals.sort((a, b) => b.total - a.total);
    
    // Assign ranks
    const ranks = {};
    let currentRank = 1;
    for (let i = 0; i < studentTotals.length; i++) {
        if (i > 0 && studentTotals[i].total < studentTotals[i - 1].total) {
            currentRank = i + 1;
        }
        ranks[studentTotals[i].id] = currentRank;
    }
    
    return ranks;
}

function updateClassStatistics(examSession) {
    const studentsInClass = window.students ? window.students.filter(s => 
        s.class === examSession.class && s.status === 'active'
    ) : [];
    
    // Use the new data structure
    const sessionResults = currentClassExamResults[examSession.id] || {};
    
    // Count completed results
    let completedCount = 0;
    let totalPercentage = 0;
    let validResults = 0;
    
    studentsInClass.forEach(student => {
        const studentResults = sessionResults[student.id] || {};
        const hasAllMarks = examSession.selectedBooks.every(book => {
            const resultKey = `${book.id}_${book.examType}`;
            return studentResults[resultKey] !== undefined && studentResults[resultKey] !== null && studentResults[resultKey] !== '';
        });
        
        if (hasAllMarks) {
            completedCount++;
        }
        
        // Calculate percentage for average
        const { percentage } = calculateStudentExamTotals(student.id, examSession, studentResults);
        if (percentage > 0) {
            totalPercentage += percentage;
            validResults++;
        }
    });
    
    const classAverage = validResults > 0 ? Math.round(totalPercentage / validResults) : 0;
    
    // Update display elements
    const completedElement = document.getElementById('completed-results-count');
    const averageElement = document.getElementById('class-average-display');
    
    if (completedElement) completedElement.textContent = completedCount;
    if (averageElement) averageElement.textContent = classAverage + '%';
}

function calculateAllResults(examSession) {
    // Recalculate all student results and update display
    updateAllRanks(examSession);
    updateClassStatistics(examSession);
}

async function publishResults(examId) {
    const examSession = getCurrentExamSession(examId);
    if (!examSession) return;
    
    if (!confirm('আপনি কি নিশ্চিত যে ফলাফল প্রকাশ করতে চান? প্রকাশের পর সম্পাদনা সীমিত হবে।')) {
        return;
    }
    
    try {
        // Show loading state
        const publishButton = document.querySelector('button[onclick*="publishResults"]');
        if (publishButton) {
            publishButton.disabled = true;
            publishButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i><span>সংরক্ষণ হচ্ছে...</span>';
        }
        
        // First, ensure the exam session is saved to the database
        console.log('💾 Ensuring exam session is saved to database...');
        await saveExamSession(examSession);
        
        // Collect all marks from current results
        const allMarks = currentClassExamResults[examSession.id] || {};
        
        console.log('💾 Publishing exam results with marks:', Object.keys(allMarks).length, 'students');
        console.log('💾 Exam ID:', examSession.id);
        console.log('💾 Available results keys:', Object.keys(currentClassExamResults));
        
        // Save all student marks to database
        let savedCount = 0;
        let totalStudents = Object.keys(allMarks).length;
        
        for (const [studentId, studentMarks] of Object.entries(allMarks)) {
            try {
                // Skip invalid student IDs (should start with 'ST')
                if (!studentId.startsWith('ST')) {
                    console.log(`⚠️ Skipping invalid student ID: ${studentId}`);
                    continue;
                }
                
        const resultData = {};
        for (const [bookKey, mark] of Object.entries(studentMarks)) {
                    if (mark !== null && mark !== undefined) {
                        // Parse bookKey to get bookId and examType
                        let bookId, examType;
                        if (bookKey.includes('_')) {
                            [bookId, examType] = bookKey.split('_', 2);
                        } else {
                            bookId = bookKey;
                            examType = 'written'; // Default for backward compatibility
                        }
                        
                        // Handle both numeric book IDs and special IDs like 'SCORE'
                            const book = examSession.selectedBooks.find(b => b.id == bookId && b.examType === examType);
                        if (book) {
                            const resultKey = `${bookId}_${examType}`;
                            resultData[resultKey] = {
                                marks_obtained: parseInt(mark),
                                total_marks: book?.totalMarks || 100,
                                exam_type: examType,
                                entered_by: window.currentUser ? window.currentUser.username : 'system'
                            };
                        } else {
                            console.error(`❌ Book not found: ${bookId} (${examType})`);
                        }
                    }
                }
                
                if (Object.keys(resultData).length > 0) {
                    const response = await fetch(`/api/exams/${examSession.id}/results/${studentId}`, {
                        method: 'PUT',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify(resultData)
                    });
                    
                    if (response.ok) {
                        savedCount++;
                    } else {
                        const errorText = await response.text();
                        console.error(`❌ Failed to save marks for student ${studentId}:`, response.status, errorText);
                    }
                }
            } catch (error) {
                console.error(`❌ Error saving marks for student ${studentId}:`, error);
            }
        }
        
        // Update exam session status
        examSession.status = 'published';
        examSession.publishedDate = new Date().toISOString();
        await saveExamSession(examSession);
        
        // Update the exam in currentClassExams array immediately
        const examIndex = currentClassExams.findIndex(exam => exam.id === examSession.id);
        if (examIndex !== -1) {
            currentClassExams[examIndex].status = 'published';
            currentClassExams[examIndex].publishedDate = examSession.publishedDate;
        }
        
        // Mark as saved
        markAsSaved();
        
        // Calculate proper statistics
        const studentsInClass = window.students ? window.students.filter(s => 
            s.class === examSession.class && s.status === 'active'
        ) : [];
        
        const totalStudentsInClass = studentsInClass.length;
        const completedStudents = Object.keys(allMarks).filter(studentId => {
            const studentMarks = allMarks[studentId];
            return examSession.selectedBooks.every(book => 
                studentMarks[`${book.id}_${book.examType}`] !== null && studentMarks[`${book.id}_${book.examType}`] !== undefined && studentMarks[`${book.id}_${book.examType}`] > 0
            );
        }).length;
        
        showQuickNotification(
            `✅ ফলাফল সফলভাবে প্রকাশ করা হয়েছে! ${completedStudents}/${totalStudentsInClass} শিক্ষার্থীর তথ্য সম্পূর্ণ`, 
            'success'
        );
        
        
        // Force UI refresh to show updated status
        renderClassExamList(examSession.class);
        
        // Update comparison matrix if it's open
        const comparisonModal = document.getElementById('results-comparison-modal');
        if (comparisonModal && comparisonModal.style.display !== 'none') {
            updateComparisonMatrix(examSession.class);
        }
        
        // Also refresh the Teachers Corner exam list
        if (window.currentClass && typeof window.loadClassExams === 'function') {
            setTimeout(() => {
                window.loadClassExams(window.currentClass);
            }, 500);
        }
        
    closeResultEntryModal();
        
    } catch (error) {
        console.error('❌ Error publishing results:', error);
        showQuickNotification('❌ ফলাফল প্রকাশ করতে সমস্যা হয়েছে', 'error');
        
        // Reset button state
        const publishButton = document.querySelector('button[onclick*="publishResults"]');
        if (publishButton) {
            publishButton.disabled = false;
            updateSaveButtonState();
        }
    }
}

async function clearAllResults(examId) {
    if (!confirm('আপনি কি নিশ্চিত যে সব ফলাফল মুছে দিতে চান?')) {
        return;
    }
    
    const examSession = getCurrentExamSession(examId);
    if (!examSession) return;
    
    try {
        // Clear results via API
        const response = await fetch(`/api/exams/${examId}/results`, {
            method: 'DELETE'
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error(`❌ Clear results API Error ${response.status}:`, errorText);
            throw new Error(`Failed to clear results: ${response.status} ${response.statusText}`);
        }

        const result = await response.json();
        console.log(`✅ Successfully cleared all results for exam: ${examId}`);

        // Clear from local cache
        if (currentClassExamResults[examSession.id]) {
            delete currentClassExamResults[examSession.id];
        }

        // Refresh the interface
        closeResultEntryModal();
        openResultEntryInterface(examSession);
        
        alert('সব ফলাফল মুছে ফেলা হয়েছে।');

    } catch (error) {
        console.error('❌ Error clearing results:', error);
        
        // Fallback to localStorage
        console.log('🔄 Falling back to localStorage for clearing results...');
        const sessionKey = getExamSessionKey(examSession);
        let allExamResults = JSON.parse(localStorage.getItem('examResults')) || {};
        
        // Clear results for this session
        delete allExamResults[sessionKey];
        localStorage.setItem('examResults', JSON.stringify(allExamResults));
        
        // Refresh the interface
        closeResultEntryModal();
        openResultEntryInterface(examSession);
        
        alert('সব ফলাফল মুছে ফেলা হয়েছে।');
    }
}

function getExamGrade(percentage) {
    if (percentage >= 80) return 'A+';
    if (percentage >= 70) return 'A';
    if (percentage >= 60) return 'A-';
    if (percentage >= 50) return 'B';
    if (percentage >= 40) return 'C';
    if (percentage >= 33) return 'D';
    return 'F';
}

function closeResultEntryModal() {
    // Check for unsaved changes before closing
    if (hasUnsavedChanges) {
        if (!confirm('আপনার অসম্পূর্ণ কাজ আছে। আপনি কি নিশ্চিত যে আপনি এই মডেল বন্ধ করতে চান?')) {
            return; // Don't close if user cancels
        }
    }
    
    const modal = document.getElementById('result-entry-modal');
    if (modal) {
        modal.remove();
    }
    
    // Reset unsaved changes tracking
    markAsSaved();
    // Note: currentExamSession is managed by the core module
    
    // Refresh the Teachers Corner exam list
    if (window.currentClass && typeof window.loadClassExams === 'function') {
        window.loadClassExams(window.currentClass);
        // Also refresh the exam list display
        if (typeof window.renderClassExamList === 'function') {
            window.renderClassExamList(window.currentClass);
        }
    }
}

export {
    openResultEntryInterface,
    renderStudentResultRow,
    updateStudentMark,
    calculateStudentExamTotals,
    updateAllRanks,
    calculateExamClassRanks,
    updateClassStatistics,
    calculateAllResults,
    publishResults,
    clearAllResults,
    getExamGrade,
    closeResultEntryModal
};