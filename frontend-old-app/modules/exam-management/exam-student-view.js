// exam-student-view.js

import { t } from '../../translations.js';
import { currentClassExams, currentClassExamResults, getExamSessionKey, getCurrentExamSession } from './exam-management-core.js';
import { getEducationalYearName } from './exam-management-core.js';
import { getExamStatusClass, getExamStatusText, getResultCellColor, getGradeColorClass } from './exam-management-ui.js';
import { calculateStudentExamTotals, calculateExamClassRanks } from './exam-results.js';

function loadStudentExamResults(studentId) {
    console.log(`📊 Loading exam results for student: ${studentId}`);
    
    const container = document.getElementById('student-exam-results-container');
    if (!container) return;
    
    // Get student info
    const student = window.students ? window.students.find(s => s.id === studentId) : null;
    if (!student) {
        container.innerHTML = '<p class="text-gray-500 text-center py-8">ছাত্রের তথ্য পাওয়া যায়নি।</p>';
        return;
    }
    
    // Get all exam sessions for this student's class (use API-loaded data)
    let studentClassExams = [];
    
    if (currentClassExams.length > 0 && currentClassExams[0].class_name === student.class) {
        // Use currently loaded exams if they match this student's class
        studentClassExams = currentClassExams;
        console.log(`📊 Using API-loaded exams for student's class: ${student.class}`);
    } else {
        // Fallback to localStorage
        console.log(`📦 Falling back to localStorage for student exam results`);
        const allExamSessions = JSON.parse(localStorage.getItem('examSessions')) || [];
        studentClassExams = allExamSessions.filter(session => session.class === student.class);
    }
    
    if (studentClassExams.length === 0) {
        container.innerHTML = `
            <div class="text-center py-12 text-gray-500">
                <i class="fas fa-graduation-cap text-6xl mb-4"></i>
                <p class="text-lg font-medium">এই ছাত্রের জন্য কোন পরীক্ষার তথ্য নেই</p>
                <p class="text-sm mt-2">${student.class} শ্রেণীতে এখনো কোন পরীক্ষা তৈরি করা হয়নি</p>
            </div>
        `;
        return;
    }
    
    // Get all exam results (try from API cache first)
    let allExamResults = {};
    if (Object.keys(currentClassExamResults).length > 0) {
        allExamResults = currentClassExamResults;
        console.log(`📊 Using API-loaded results for student: ${studentId}`);
    } else {
        // Fallback to localStorage
        console.log(`📦 Falling back to localStorage for results`);
        allExamResults = JSON.parse(localStorage.getItem('examResults')) || {};
    }
    
    // Filter and organize results by year and term
    const organizedResults = {};
    
    studentClassExams.forEach(exam => {
        // Try new data structure first, then fallback to localStorage
        let studentResults = currentClassExamResults[exam.id]?.[studentId] || {};
        if (Object.keys(studentResults).length === 0) {
        const sessionKey = getExamSessionKey(exam);
            studentResults = allExamResults[sessionKey]?.[studentId] || {};
        }
        
        const educationalYearName = getEducationalYearName(exam);
        if (!organizedResults[educationalYearName]) {
            organizedResults[educationalYearName] = {};
        }
        if (!organizedResults[educationalYearName][exam.term]) {
            organizedResults[educationalYearName][exam.term] = [];
        }
        
        // Calculate totals for this exam
        const { total, percentage, grade } = calculateStudentExamTotals(studentId, exam, studentResults);
        const hasResults = Object.keys(studentResults).length > 0;
        
        organizedResults[educationalYearName][exam.term].push({
            ...exam,
            studentResults,
            total,
            percentage,
            grade,
            hasResults
        });
    });
    
    // Create separate spreadsheet tables for each exam
    let resultsHTML = '';
    
    // Flatten all exams and sort by date (newest first)
    const allExams = [];
    Object.keys(organizedResults).forEach(year => {
        Object.keys(organizedResults[year]).forEach(term => {
            organizedResults[year][term].forEach(exam => {
                allExams.push(exam);
            });
        });
    });
    
    allExams.sort((a, b) => new Date(b.createdDate) - new Date(a.createdDate));
    
    if (allExams.length === 0) {
        resultsHTML = `
            <div class="text-center py-12 text-gray-500">
                <i class="fas fa-graduation-cap text-6xl mb-4"></i>
                <p class="text-lg font-medium">কোন পরীক্ষার ফলাফল পাওয়া যায়নি</p>
                <p class="text-sm">এই ছাত্রের জন্য এখনো কোন পরীক্ষা নেওয়া হয়নি</p>
            </div>
        `;
    } else {
        // Create a separate spreadsheet table for each exam
        allExams.forEach((exam, examIndex) => {
            resultsHTML += `
                <div class="mb-6">
                    <!-- Exam Header -->
                    <h5 class="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                        <i class="fas fa-clipboard-list text-blue-500"></i>
                        ${exam.name} 
                        <span class="text-sm font-normal text-gray-500">(${getEducationalYearName(exam)} - ${exam.term})</span>
                        <span class="inline-block px-2 py-1 rounded-full text-xs font-semibold ${getExamStatusClass(exam.status)}">
                            ${getExamStatusText(exam.status)}
                        </span>
                    </h5>
                    
                    ${exam.hasResults ? `
                        <!-- Spreadsheet Table for This Exam -->
                        <div class="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm">
                            <table class="w-full text-sm">
                                <!-- Book Names Row -->
                                <thead class="bg-gray-100">
                                    <tr>
                                        ${exam.selectedBooks.map(book => 
                                            `<th class="px-4 py-2 text-center font-semibold text-gray-700 border-r">
                                                <div>${book.name}</div>
                                                ${book.examType === 'viva' ? '<div class="text-xs font-normal text-orange-600">মৌখিক</div>' : ''}
                                            </th>`
                                        ).join('')}
                                        <th class="px-4 py-2 text-center font-semibold text-gray-700 border-r">মোট</th>
                                        <th class="px-4 py-2 text-center font-semibold text-gray-700">গ্রেড</th>
                                    </tr>
                                </thead>
                                <!-- Results Row -->
                                <tbody>
                                    <tr class="bg-white">
                                        ${exam.selectedBooks.map(book => {
                                            const mark = exam.studentResults[`${book.id}_${book.examType}`] || 0;
                                            const percentage = Math.round((mark / book.totalMarks) * 100);
                                            const colorClass = getResultCellColor(mark, book.totalMarks);
                                            
                                            return `
                                                <td class="px-4 py-3 text-center border-r ${colorClass}">
                                                    <div class="font-semibold text-base">${mark}/${book.totalMarks}</div>
                                                    <div class="text-xs text-gray-600">(${percentage}%)</div>
                                                </td>
                                            `;
                                        }).join('')}
                                        <td class="px-4 py-3 text-center font-bold text-base border-r">
                                            <div class="text-lg">${exam.total}/${exam.selectedBooks.reduce((sum, book) => sum + book.totalMarks, 0)}</div>
                                            <div class="text-sm text-gray-600">(${exam.percentage}%)</div>
                                        </td>
                                        <td class="px-4 py-3 text-center font-bold text-xl ${getGradeColorClass(exam.grade)}">
                                            ${exam.grade}
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    ` : `
                        <!-- No Results Yet -->
                        <div class="bg-gray-50 border border-gray-200 rounded-lg p-6 text-center">
                            <i class="fas fa-clock text-3xl text-gray-400 mb-3"></i>
                            <p class="font-medium text-gray-600">ফলাফল এখনো এন্ট্রি করা হয়নি</p>
                            <p class="text-sm text-gray-500">শিক্ষক এখনো এই পরীক্ষার ফলাফল দেননি</p>
                        </div>
                    `}
                </div>
            `;
        });
        
        // Overall Summary Stats
        resultsHTML += `
            <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-4 border-t border-gray-200">
                <div class="bg-blue-50 p-3 rounded-lg text-center">
                    <div class="text-lg font-bold text-blue-600">${allExams.length}</div>
                    <div class="text-xs text-blue-700">মোট পরীক্ষা</div>
                </div>
                <div class="bg-green-50 p-3 rounded-lg text-center">
                    <div class="text-lg font-bold text-green-600">${allExams.filter(e => e.hasResults).length}</div>
                    <div class="text-xs text-green-700">ফলাফল পাওয়া</div>
                </div>
                <div class="bg-yellow-50 p-3 rounded-lg text-center">
                    <div class="text-lg font-bold text-yellow-600">
                        ${allExams.filter(e => e.hasResults).length > 0 ? 
                            Math.round(allExams.filter(e => e.hasResults).reduce((sum, e) => sum + e.percentage, 0) / allExams.filter(e => e.hasResults).length) : 0}%
                    </div>
                    <div class="text-xs text-yellow-700">গড় পারফরম্যান্স</div>
                </div>
                <div class="bg-purple-50 p-3 rounded-lg text-center">
                    <div class="text-lg font-bold text-purple-600">
                        ${allExams.filter(e => e.hasResults && e.grade.includes('A')).length}
                    </div>
                    <div class="text-xs text-purple-700">A গ্রেড</div>
                </div>
            </div>
        `;
    }
    
    if (resultsHTML === '') {
        resultsHTML = `
            <div class="text-center py-12 text-gray-500">
                <i class="fas fa-graduation-cap text-6xl mb-4"></i>
                <p class="text-lg font-medium">কোন পরীক্ষার ফলাফল পাওয়া যায়নি</p>
                <p class="text-sm mt-2">এই ছাত্রের জন্য এখনো কোন পরীক্ষা নেওয়া হয়নি</p>
            </div>
        `;
    }
    
    container.innerHTML = resultsHTML;
}

function showExamDetailBreakdown(studentId, examId) {
    console.log(`📋 Showing detailed breakdown for student: ${studentId}, exam: ${examId}`);
    
    const examSession = getCurrentExamSession(examId);
    const student = window.students ? window.students.find(s => s.id === studentId) : null;
    
    if (!examSession || !student) {
        alert('পরীক্ষা বা ছাত্রের তথ্য পাওয়া যায়নি।');
        return;
    }
    
    // Try new data structure first, then fallback to localStorage
    let studentResults = currentClassExamResults[examSession.id]?.[studentId] || {};
    if (Object.keys(studentResults).length === 0) {
    const sessionKey = getExamSessionKey(examSession);
    const allExamResults = JSON.parse(localStorage.getItem('examResults')) || {};
        studentResults = allExamResults[sessionKey]?.[studentId] || {};
    }
    
    const modal = document.createElement('div');
    modal.id = 'exam-breakdown-modal';
    modal.className = 'modal-backdrop justify-center items-center';
    modal.style.display = 'flex';
    modal.style.zIndex = '1100'; // Higher than student profile modal
    
    modal.innerHTML = `
        <div class="modal-content bg-white rounded-lg shadow-xl" style="width: 95vw; max-width: 1200px; height: 90vh; max-height: 800px;">
            <!-- Modal Header -->
            <div class="px-6 py-4 border-b bg-gradient-to-r from-blue-50 to-indigo-50 flex-shrink-0">
                <div class="flex justify-between items-center">
                    <div>
                        <h3 class="text-xl font-bold text-gray-800">${student.name} - ${examSession.name}</h3>
                        <p class="text-sm text-gray-600 mt-1">${getEducationalYearName(examSession)} - ${examSession.term} - ${examSession.class}</p>
                        <div class="flex items-center gap-4 mt-2">
                            <span class="text-xs text-blue-600 bg-blue-100 px-2 py-1 rounded-full">
                                <i class="fas fa-eye mr-1"></i>ফলাফল বিস্তারিত
                            </span>
                            <span class="text-xs text-green-600 bg-green-100 px-2 py-1 rounded-full">
                                <i class="fas fa-book mr-1"></i>${examSession.selectedBooks.length} বই
                            </span>
                        </div>
                    </div>
                    <button onclick="closeExamBreakdownModal()" class="text-gray-400 hover:text-gray-600 text-2xl p-2 rounded-full hover:bg-gray-200 transition-all">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
            </div>
            
            <!-- Modal Body -->
            <div class="flex-1 overflow-hidden flex flex-col">
                <div class="p-4 flex-1 overflow-hidden">
                    <div class="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-lg h-full flex flex-col">
                        <div class="overflow-auto flex-1">
                            <div class="p-6 space-y-6">
                                <!-- Subject-wise Results -->
                                <div>
                                    <h4 class="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                                        <i class="fas fa-list-alt text-blue-500"></i>
                                        বিষয়ভিত্তিক ফলাফল
                                    </h4>
                                    <div class="grid gap-3">
                                        ${examSession.selectedBooks.map(book => {
                                            const mark = studentResults[`${book.id}_${book.examType}`] || 0;
                                            const percentage = Math.round((mark / book.totalMarks) * 100);
                                            const colorClass = getResultCellColor(mark, book.totalMarks);
                                            
                                            return `
                                                <div class="flex justify-between items-center p-4 rounded-lg border ${colorClass} hover:shadow-md transition-all">
                                                    <div class="flex items-center gap-3">
                                                        <div class="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-sm">
                                                            <i class="fas fa-book text-blue-500"></i>
                                                        </div>
                                                        <div>
                                                            <div class="font-semibold text-gray-800">${book.name}</div>
                                                            ${book.examType === 'viva' ? '<span class="text-xs bg-orange-100 text-orange-600 px-2 py-1 rounded-full font-medium">মৌখিক</span>' : ''}
                                                        </div>
                                                    </div>
                                                    <div class="text-right">
                                                        <div class="text-xl font-bold text-gray-800">${mark}/${book.totalMarks}</div>
                                                        <div class="text-sm text-gray-600 font-medium">${percentage}%</div>
                                                    </div>
                                                </div>
                                            `;
                                        }).join('')}
                                    </div>
                                </div>
                                
                                <!-- Overall Results -->
                                <div class="bg-gradient-to-r from-gray-50 to-blue-50 p-6 rounded-lg border border-gray-200">
                                    <h4 class="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                                        <i class="fas fa-chart-pie text-green-500"></i>
                                        সামগ্রিক ফলাফল
                                    </h4>
                                    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <div class="bg-white p-4 rounded-lg shadow-sm border border-gray-200 text-center">
                                            <div class="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                                                <i class="fas fa-trophy text-blue-500 text-lg"></i>
                                            </div>
                                            <div class="text-2xl font-bold text-blue-600 mb-1">${studentResults && Object.keys(studentResults).length > 0 ? calculateStudentExamTotals(studentId, examSession, studentResults).total : 0}</div>
                                            <div class="text-sm font-medium text-blue-700">মোট নম্বর</div>
                                        </div>
                                        <div class="bg-white p-4 rounded-lg shadow-sm border border-gray-200 text-center">
                                            <div class="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                                                <i class="fas fa-percentage text-green-500 text-lg"></i>
                                            </div>
                                            <div class="text-2xl font-bold text-green-600 mb-1">${studentResults && Object.keys(studentResults).length > 0 ? calculateStudentExamTotals(studentId, examSession, studentResults).percentage : 0}%</div>
                                            <div class="text-sm font-medium text-green-700">শতকরা</div>
                                        </div>
                                        <div class="bg-white p-4 rounded-lg shadow-sm border border-gray-200 text-center">
                                            <div class="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
                                                <i class="fas fa-star text-purple-500 text-lg"></i>
                                            </div>
                                            <div class="text-2xl font-bold ${getGradeColorClass(studentResults && Object.keys(studentResults).length > 0 ? calculateStudentExamTotals(studentId, examSession, studentResults).grade : 'F')} mb-1">${studentResults && Object.keys(studentResults).length > 0 ? calculateStudentExamTotals(studentId, examSession, studentResults).grade : 'F'}</div>
                                            <div class="text-sm font-medium text-gray-700">গ্রেড</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- Action Buttons Footer -->
            <div class="flex-shrink-0 px-4 py-3 bg-gray-50 border-t border-gray-200">
                <div class="flex flex-wrap justify-center gap-3">
                    <button onclick="window.print()" class="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-semibold transition-colors flex items-center gap-2 min-w-[120px]">
                        <i class="fas fa-print"></i>
                        <span>প্রিন্ট</span>
                    </button>
                    <button onclick="closeExamBreakdownModal()" class="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2 min-w-[120px]">
                        <i class="fas fa-times"></i>
                        <span>বন্ধ করুন</span>
                    </button>
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
}

function closeExamBreakdownModal() {
    const modal = document.getElementById('exam-breakdown-modal');
    if (modal) {
        modal.remove();
    }
}

function openResultsViewInterface(examSession) {
    console.log(`👁️ Opening results view for: ${examSession.name}`);
    
    const modal = document.createElement('div');
    modal.id = 'results-view-modal';
    modal.className = 'modal-backdrop justify-center items-center';
    modal.style.display = 'flex';
    
    // Get students for this class
    const studentsInClass = window.students ? window.students.filter(s => 
        s.class === examSession.class && s.status === 'active'
    ) : [];
    
    const sessionResults = currentClassExamResults[examSession.id] || {};
    console.log(`🔍 Results for exam ${examSession.id}:`, sessionResults);
    
    // Calculate ranks
    const studentRanks = calculateExamClassRanks(examSession, examSession.id, studentsInClass);
    
    // Sort students by rank
    const studentsWithResults = studentsInClass.map(student => {
        const studentResults = sessionResults[student.id] || {};
        const { total, percentage, grade } = calculateStudentExamTotals(student.id, examSession, studentResults);
        const rank = studentRanks[student.id] || '-';
        
        return {
            ...student,
            results: studentResults,
            total,
            percentage,
            grade,
            rank
        };
    }).sort((a, b) => {
        if (a.rank === '-') return 1;
        if (b.rank === '-') return -1;
        return a.rank - b.rank;
    });
    
    modal.innerHTML = `
        <div class="modal-content bg-white rounded-lg shadow-xl flex flex-col" style="width: 95vw; max-width: 1400px; height: 90vh; max-height: 800px;">
            <!-- Modal Header -->
            <div class="px-6 py-4 border-b bg-gradient-to-r from-green-50 to-emerald-50 flex-shrink-0">
                <div class="flex justify-between items-center">
                    <div>
                        <h3 class="text-xl font-bold text-gray-800">${examSession.name} - ফলাফল দেখুন</h3>
                        <p class="text-sm text-gray-600 mt-1">${getEducationalYearName(examSession)} - ${examSession.term} - ${examSession.class}</p>
                        <div class="flex items-center gap-4 mt-2">
                            <span class="text-xs text-green-600 bg-green-100 px-2 py-1 rounded-full">
                                <i class="fas fa-eye mr-1"></i>শুধুমাত্র দেখার জন্য
                            </span>
                            <span class="text-xs text-blue-600 bg-blue-100 px-2 py-1 rounded-full">
                                <i class="fas fa-users mr-1"></i>${studentsInClass.length} ছাত্র
                            </span>
                        </div>
                    </div>
                    <button onclick="closeResultsViewModal()" class="text-gray-400 hover:text-gray-600 text-2xl p-2 rounded-full hover:bg-gray-200 transition-all">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
            </div>
            
            <!-- Modal Body -->
            <div class="flex-1 overflow-hidden flex flex-col">
                <div class="p-4 flex-1 overflow-hidden">
                    <!-- Results Table -->
                    <div class="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-lg h-full flex flex-col">
                        <div class="overflow-auto flex-1">
                            <table class="w-full text-sm min-w-full">
                                <thead class="bg-gray-100 sticky top-0 z-10">
                                    <tr>
                                        <th class="px-3 py-3 text-center font-semibold text-gray-700 border-r whitespace-nowrap" style="width: 70px;">র‍্যাঙ্ক</th>
                                        <th class="px-3 py-3 text-left font-semibold text-gray-700 border-r whitespace-nowrap" style="min-width: 180px;">ছাত্রের নাম</th>
                                        <th class="px-2 py-3 text-center font-semibold text-gray-700 border-r whitespace-nowrap" style="width: 70px;">পরিচিতি</th>
                                        ${examSession.selectedBooks.map(book => 
                                            `<th class="px-2 py-3 text-center font-semibold text-gray-700 border-r whitespace-nowrap ${book.isScore ? 'bg-gradient-to-r from-purple-100 to-pink-100' : ''}" style="min-width: 100px;">
                                                <div class="text-sm leading-tight ${book.isScore ? 'text-purple-800 font-bold' : ''}">
                                                    ${book.isScore ? '<i class="fas fa-star text-purple-500 mr-1"></i>' : ''}${book.name.length > 15 ? book.name.substring(0, 15) + '...' : book.name}
                                                </div>
                                                ${book.isScore ? `<div class="text-xs text-purple-600 font-medium">${t('score')}</div>` : ''}
                                                <div class="text-xs text-gray-500 font-normal">(${book.totalMarks})</div>
                                            </th>`
                                        ).join('')}
                                        <th class="px-2 py-3 text-center font-semibold text-gray-700 border-r whitespace-nowrap" style="width: 70px;">মোট</th>
                                        <th class="px-2 py-3 text-center font-semibold text-gray-700 border-r whitespace-nowrap" style="width: 60px;">%</th>
                                        <th class="px-2 py-3 text-center font-semibold text-gray-700 whitespace-nowrap" style="width: 60px;">গ্রেড</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${studentsWithResults.map(student => `
                                        <tr class="border-b hover:bg-gray-50">
                                            <td class="px-3 py-2 text-center font-bold text-sm border-r">${getRankHTML(student.rank)}</td>
                                            <td class="px-3 py-2 font-medium text-gray-800 border-r text-sm">${student.name}</td>
                                            <td class="px-2 py-2 text-center border-r text-sm">${student.rollNumber}</td>
                                            ${examSession.selectedBooks.map(book => {
                                                const mark = student.results[`${book.id}_${book.examType}`] || 0;
                                                const colorClass = getResultCellColor(mark, book.totalMarks);
                                                const isScore = book.isScore || false;
                                                return `<td class="px-2 py-2 text-center border-r ${colorClass} ${isScore ? 'bg-gradient-to-r from-purple-50 to-pink-50' : ''} text-sm">
                                                    <span class="font-semibold ${isScore ? 'text-purple-800' : ''}">${mark}</span>
                                                </td>`;
                                            }).join('')}
                                            <td class="px-2 py-2 text-center font-bold text-sm border-r">${student.total}</td>
                                            <td class="px-2 py-2 text-center font-bold text-sm border-r">${student.percentage}%</td>
                                            <td class="px-2 py-2 text-center font-bold text-sm ${getGradeColorClass(student.grade)}">${student.grade}</td>
                                        </tr>
                                    `).join('')}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- Action Buttons Footer -->
            <div class="flex-shrink-0 px-4 py-3 bg-gray-50 border-t border-gray-200">
                <div class="flex flex-wrap justify-center gap-3">
                    <button onclick="exportSingleExamResults(getCurrentExamSession('${examSession.id}'), '${examSession.class}')" class="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-md text-sm font-semibold transition-colors flex items-center gap-2 min-w-[140px]">
                        <i class="fas fa-download"></i>
                        <span>এক্সপোর্ট করুন</span>
                    </button>
                    <button onclick="closeResultsViewModal(); openResultEntryInterface(getCurrentExamSession('${examSession.id}'))" class="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-semibold transition-colors flex items-center gap-2 min-w-[140px]">
                        <i class="fas fa-edit"></i>
                        <span>ফলাফল সম্পাদনা</span>
                    </button>
                    <button onclick="closeResultsViewModal()" class="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2 min-w-[140px]">
                        <i class="fas fa-times"></i>
                        <span>বন্ধ করুন</span>
                    </button>
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
}

function closeResultsViewModal() {
    const modal = document.getElementById('results-view-modal');
    if (modal) {
        modal.remove();
    }
}

// Alias for compatibility with main.js
function showStudentExamDetail(studentId, examId) {
    console.log(`📊 Showing exam detail for student: ${studentId}, exam: ${examId}`);
    showExamDetailBreakdown(studentId, examId);
}

export {
    loadStudentExamResults,
    showExamDetailBreakdown,
    closeExamBreakdownModal,
    openResultsViewInterface,
    closeResultsViewModal,
    showStudentExamDetail
};