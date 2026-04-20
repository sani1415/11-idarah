// exam-analytics.js

import { t } from '../../translations.js';
import { currentClassExams, currentClassExamResults, getCurrentExamSession } from './exam-management-core.js';
import { getEducationalYearName } from './exam-management-core.js';
import { getRankHTML } from './exam-management-ui.js';
import { calculateStudentExamTotals } from './exam-results.js';

function classExamAnalytics(className) {
    console.log(`📈 Showing analytics for class: ${className}`);
    
    const modal = document.createElement('div');
    modal.id = 'class-analytics-modal';
    modal.className = 'modal-backdrop justify-center items-center';
    modal.style.display = 'flex';
    
    // Get all published exams for this class
    const publishedExams = currentClassExams.filter(exam => exam.status === 'published') || [];
    const studentsInClass = window.students ? window.students.filter(s => s.class === className && s.status === 'active') : [];
    
    if (publishedExams.length === 0) {
        modal.innerHTML = `
            <div class="modal-content bg-white rounded-lg shadow-xl w-11/12 md:w-2/3 lg:w-1/2">
                <div class="p-6 border-b">
                    <div class="flex justify-between items-center">
                        <h3 class="text-xl font-bold text-gray-800">${className} - পরীক্ষার বিশ্লেষণ</h3>
                        <button onclick="closeClassAnalyticsModal()" class="text-gray-400 hover:text-gray-600 text-xl">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                </div>
                <div class="p-6 text-center">
                    <i class="fas fa-chart-bar text-6xl text-gray-300 mb-4"></i>
                    <p class="text-lg font-medium text-gray-600">কোন প্রকাশিত পরীক্ষার ফলাফল নেই</p>
                    <p class="text-sm text-gray-500 mt-2">বিশ্লেষণের জন্য কমপক্ষে একটি পরীক্ষার ফলাফল প্রকাশ করুন</p>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
        return;
    }
    
    // Calculate comprehensive analytics
    const analytics = calculateClassAnalytics(className, publishedExams, studentsInClass);
    
    modal.innerHTML = `
        <div class="modal-content bg-white rounded-lg shadow-xl flex flex-col" style="width: 95vw; max-width: 1400px; height: 90vh; max-height: 800px;">
            <!-- Modal Header -->
            <div class="px-6 py-4 border-b bg-gradient-to-r from-purple-50 to-indigo-50 flex-shrink-0">
                <div class="flex justify-between items-center">
                    <div>
                        <h3 class="text-xl font-bold text-gray-800">${className} - পরীক্ষার বিশ্লেষণ</h3>
                        <p class="text-sm text-gray-600 mt-1">${publishedExams.length}টি প্রকাশিত পরীক্ষার ডেটা বিশ্লেষণ</p>
                    </div>
                    <button onclick="closeClassAnalyticsModal()" class="text-gray-400 hover:text-gray-600 text-2xl p-2 rounded-full hover:bg-gray-200 transition-all">
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
                    <!-- Overall Performance Summary -->
                    <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div class="bg-blue-50 p-4 rounded-lg border-l-4 border-blue-400">
                            <div class="text-2xl font-bold text-blue-600">${analytics.overallStats.totalStudents}</div>
                            <div class="text-sm text-blue-700">মোট ছাত্র</div>
                        </div>
                        <div class="bg-green-50 p-4 rounded-lg border-l-4 border-green-400">
                            <div class="text-2xl font-bold text-green-600">${analytics.overallStats.averagePerformance}%</div>
                            <div class="text-sm text-green-700">শ্রেণীর গড় পারফরম্যান্স</div>
                        </div>
                        <div class="bg-yellow-50 p-4 rounded-lg border-l-4 border-yellow-400">
                            <div class="text-2xl font-bold text-yellow-600">${analytics.overallStats.topPerformers}</div>
                            <div class="text-sm text-yellow-700">A+ গ্রেড প্রাপ্ত</div>
                        </div>
                        <div class="bg-red-50 p-4 rounded-lg border-l-4 border-red-400">
                            <div class="text-2xl font-bold text-red-600">${analytics.overallStats.needsAttention}</div>
                            <div class="text-sm text-red-700">উন্নতি প্রয়োজন</div>
                        </div>
                    </div>
                    
                    <!-- Performance Trends -->
                    <div class="bg-white border border-gray-200 rounded-lg p-6">
                        <h4 class="font-semibold text-gray-700 mb-4">পারফরম্যান্স ট্রেন্ড</h4>
                        <div class="space-y-3">
                            ${analytics.examPerformance.map(exam => `
                                <div class="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                    <div>
                                        <div class="font-medium text-gray-800">${exam.name}</div>
                                        <div class="text-sm text-gray-500">${getEducationalYearName(exam)} - ${exam.term}</div>
                                    </div>
                                    <div class="text-right">
                                        <div class="font-bold text-lg">${exam.averagePercentage}%</div>
                                        <div class="w-24 bg-gray-200 rounded-full h-2 mt-1">
                                            <div class="bg-blue-500 h-2 rounded-full" style="width: ${exam.averagePercentage}%"></div>
                                        </div>
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                    
                    <!-- Top Performers & Need Attention -->
                    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <!-- Top Performers -->
                        <div class="bg-green-50 border border-green-200 rounded-lg p-6">
                            <h4 class="font-semibold text-green-800 mb-4 flex items-center gap-2">
                                <i class="fas fa-trophy text-yellow-500"></i>
                                শীর্ষ পারফরমার (${analytics.topPerformers.length} জন)
                            </h4>
                            <div class="space-y-3">
                                ${analytics.topPerformers.map((student, index) => `
                                    <div class="flex items-center justify-between p-3 bg-white rounded-lg">
                                        <div class="flex items-center gap-3">
                                            <div class="text-2xl">${index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : '🏆'}</div>
                                            <div>
                                                <div class="font-medium text-gray-800">${student.name}</div>
                                                <div class="text-sm text-gray-500">পরিচিতি: ${student.rollNumber}</div>
                                            </div>
                                        </div>
                                        <div class="text-right">
                                            <div class="font-bold text-green-600">${student.averagePercentage}%</div>
                                        </div>
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                        
                        <!-- Students Needing Attention -->
                        <div class="bg-red-50 border border-red-200 rounded-lg p-6">
                            <h4 class="font-semibold text-red-800 mb-4 flex items-center gap-2">
                                <i class="fas fa-exclamation-triangle text-red-500"></i>
                                উন্নতি প্রয়োজন (${analytics.needsAttention.length} জন)
                            </h4>
                            <div class="space-y-3">
                                ${analytics.needsAttention.length > 0 ? analytics.needsAttention.map(student => `
                                    <div class="flex items-center justify-between p-3 bg-white rounded-lg">
                                        <div>
                                            <div class="font-medium text-gray-800">${student.name}</div>
                                            <div class="text-sm text-gray-500">পরিচিতি: ${student.rollNumber}</div>
                                        </div>
                                        <div class="text-right">
                                            <div class="font-bold text-red-600">${student.averagePercentage}%</div>
                                        </div>
                                    </div>
                                `).join('') : `
                                    <div class="text-center py-6 text-gray-500">
                                        <i class="fas fa-smile text-4xl mb-2"></i>
                                        <p class="font-medium">সবাই ভালো করছে!</p>
                                        <p class="text-sm">কোন ছাত্রের বিশেষ মনোযোগের প্রয়োজন নেই</p>
                                    </div>
                                `}
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
                    <button onclick="exportAnalyticsReport('${className}')" class="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-md text-sm font-semibold transition-colors flex items-center gap-2 min-w-[140px]">
                        <i class="fas fa-download"></i>
                        <span>বিশ্লেষণ এক্সপোর্ট</span>
                    </button>
                    <button onclick="printAnalyticsReport('${className}')" class="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-semibold transition-colors flex items-center gap-2 min-w-[140px]">
                        <i class="fas fa-print"></i>
                        <span>প্রিন্ট করুন</span>
                    </button>
                    <button onclick="closeClassAnalyticsModal()" class="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2 min-w-[140px]">
                        <i class="fas fa-times"></i>
                        <span>বন্ধ করুন</span>
                    </button>
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
}

function calculateClassAnalytics(className, publishedExams, studentsInClass) {
    const analytics = {
        overallStats: {
            totalStudents: studentsInClass.length,
            averagePerformance: 0,
            topPerformers: 0,
            needsAttention: 0
        },
        examPerformance: [],
        gradeDistribution: {},
        subjectAnalysis: [],
        topPerformers: [],
        needsAttention: []
    };
    
    // Calculate exam-wise performance
    let totalClassPerformance = 0;
    let totalExamCount = 0;
    
    publishedExams.forEach(exam => {
        const sessionResults = currentClassExamResults[exam.id] || {};
        
        let examTotalPercentage = 0;
        let examStudentCount = 0;
        
        studentsInClass.forEach(student => {
            const studentResults = sessionResults[student.id] || {};
            if (Object.keys(studentResults).length > 0) {
                const { percentage } = calculateStudentExamTotals(student.id, exam, studentResults);
                examTotalPercentage += percentage;
                examStudentCount++;
            }
        });
        
        const averagePercentage = examStudentCount > 0 ? Math.round(examTotalPercentage / examStudentCount) : 0;
        
        analytics.examPerformance.push({
            name: exam.name,
            year: getEducationalYearName(exam),
            term: exam.term,
            averagePercentage,
            studentCount: examStudentCount
        });
        
        if (examStudentCount > 0) {
            totalClassPerformance += averagePercentage;
            totalExamCount++;
        }
    });
    
    // Overall class performance
    analytics.overallStats.averagePerformance = totalExamCount > 0 ? Math.round(totalClassPerformance / totalExamCount) : 0;
    
    // Calculate student-wise analytics for latest exam
    if (publishedExams.length > 0) {
        const latestExam = publishedExams.sort((a, b) => new Date(b.createdDate) - new Date(a.createdDate))[0];
        const latestResults = currentClassExamResults[latestExam.id] || {};
        
        const studentPerformances = [];
        const gradeCount = { 'A+': 0, 'A': 0, 'A-': 0, 'B': 0, 'C': 0, 'D': 0, 'F': 0 };
        
        studentsInClass.forEach(student => {
            const studentResults = latestResults[student.id] || {};
            if (Object.keys(studentResults).length > 0) {
                const { percentage, grade } = calculateStudentExamTotals(student.id, latestExam, studentResults);
                
                studentPerformances.push({
                    ...student,
                    averagePercentage: percentage,
                    examCount: 1
                });
                
                gradeCount[grade] = (gradeCount[grade] || 0) + 1;
                
                if (percentage >= 80) analytics.overallStats.topPerformers++;
                if (percentage < 60) analytics.overallStats.needsAttention++;
            }
        });
        
        analytics.gradeDistribution = gradeCount;
        
        // Top 5 performers
        analytics.topPerformers = studentPerformances
            .sort((a, b) => b.averagePercentage - a.averagePercentage)
            .slice(0, 5);
        
        // Students needing attention (below 60%)
        analytics.needsAttention = studentPerformances
            .filter(s => s.averagePercentage < 60)
            .sort((a, b) => a.averagePercentage - b.averagePercentage)
            .slice(0, 10);
    }
    
    return analytics;
}

function closeClassAnalyticsModal() {
    const modal = document.getElementById('class-analytics-modal');
    if (modal) {
        modal.remove();
    }
}

function exportAnalyticsReport(className) {
    alert('বিশ্লেষণ রিপোর্ট এক্সপোর্ট ফিচার শীঘ্রই যোগ করা হবে।');
}

function printAnalyticsReport(className) {
    window.print();
}

function updateComparisonMatrix(className) {
    const selectedExams = Array.from(document.querySelectorAll('.exam-checkbox:checked')).map(cb => cb.value);
    document.getElementById('selected-exam-count').textContent = selectedExams.length;
    
    // Limit to 5 exams
    if (selectedExams.length > 5) {
        alert('সর্বোচ্চ ৫টি পরীক্ষা নির্বাচন করতে পারেন।');
        return;
    }
    
    if (selectedExams.length === 0) {
        document.getElementById('comparison-matrix-container').innerHTML = `
            <div class="text-center py-12 text-gray-500">
                <i class="fas fa-chart-bar text-6xl mb-4"></i>
                <p class="text-lg font-medium">তুলনা করার জন্য কমপক্ষে একটি পরীক্ষা নির্বাচন করুন</p>
            </div>
        `;
        return;
    }
    
    renderComparisonMatrix(className, selectedExams);
}

function renderComparisonMatrix(className, selectedExamIds) {
    const selectedExams = selectedExamIds.map(id => getCurrentExamSession(id)).filter(exam => exam);
    const studentsInClass = window.students ? window.students.filter(s => s.class === className && s.status === 'active') : [];
    
    if (studentsInClass.length === 0) {
        document.getElementById('comparison-matrix-container').innerHTML = `
            <div class="text-center py-12 text-gray-500">
                <p class="text-lg font-medium">এই শ্রেণীতে কোন সক্রিয় ছাত্র নেই</p>
            </div>
        `;
        return;
    }
    
    // Calculate results for all students across all selected exams
    const studentsWithResults = studentsInClass.map(student => {
        const examResults = selectedExams.map(exam => {
            // Use exam.id directly instead of sessionKey
            const studentResults = currentClassExamResults[exam.id]?.[student.id] || {};
            const { total, percentage, grade } = calculateStudentExamTotals(student.id, exam, studentResults);
            
            return {
                examId: exam.id,
                examName: exam.name,
                total,
                percentage,
                grade,
                hasResults: Object.keys(studentResults).length > 0
            };
        });
        
        // Calculate average and trend
        const validPercentages = examResults.filter(r => r.hasResults).map(r => r.percentage);
        const average = validPercentages.length > 0 ? Math.round(validPercentages.reduce((sum, p) => sum + p, 0) / validPercentages.length) : 0;
        
        // Simple trend calculation (comparing first and last valid results)
        let trend = '➖';
        if (validPercentages.length >= 2) {
            const firstResult = validPercentages[0];
            const lastResult = validPercentages[validPercentages.length - 1];
            if (lastResult > firstResult + 5) trend = '📈';
            else if (lastResult < firstResult - 5) trend = '📉';
            else trend = '➡️';
        }
        
        return {
            ...student,
            examResults,
            average,
            trend,
            validResultsCount: validPercentages.length
        };
    });
    
    // Sort by average percentage (descending)
    studentsWithResults.sort((a, b) => b.average - a.average);
    
    const container = document.getElementById('comparison-matrix-container');
    container.innerHTML = `
        <div class="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-lg">
            <div class="overflow-x-auto">
                <table class="w-full text-sm">
                    <thead class="bg-gray-100 sticky top-0 z-10">
                        <tr>
                            <th class="px-4 py-3 text-left font-semibold text-gray-700 border-r" style="min-width: 200px;">ছাত্রের নাম</th>
                            <th class="px-3 py-3 text-center font-semibold text-gray-700 border-r" style="width: 80px;">পরিচিতি</th>
                            ${selectedExams.map(exam => 
                                `<th class="px-4 py-3 text-center font-semibold text-gray-700 border-r" style="min-width: 120px;">
                                    <div class="text-sm">${exam.name}</div>
                                    <div class="text-xs text-gray-500 font-normal">${getEducationalYearName(exam)} - ${exam.term}</div>
                                </th>`
                            ).join('')}
                            <th class="px-3 py-3 text-center font-semibold text-gray-700 border-r" style="width: 80px;">গড়</th>
                            <th class="px-3 py-3 text-center font-semibold text-gray-700 border-r" style="width: 80px;">ট্রেন্ড</th>
                            <th class="px-3 py-3 text-center font-semibold text-gray-700" style="width: 80px;">র‍্যাঙ্ক</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${studentsWithResults.map((student, index) => `
                            <tr class="border-b hover:bg-gray-50" style="height: 50px;">
                                <td class="px-4 py-3 font-medium text-gray-800 border-r">${student.name}</td>
                                <td class="px-3 py-3 text-center border-r">${student.rollNumber}</td>
                                ${student.examResults.map(result => {
                                    const bgColor = result.hasResults ? getComparisonCellColor(result.percentage) : 'bg-gray-100';
                                    const textColor = result.hasResults ? 'text-gray-800' : 'text-gray-400';
                                    return `
                                        <td class="px-4 py-3 text-center border-r ${bgColor}">
                                            <div class="font-semibold ${textColor}">
                                                ${result.hasResults ? result.percentage + '%' : 'N/A'}
                                            </div>
                                            <div class="text-xs text-gray-500">
                                                ${result.hasResults ? result.grade : '-'}
                                            </div>
                                        </td>
                                    `;
                                }).join('')}
                                <td class="px-3 py-3 text-center font-bold text-base border-r">
                                    <div class="text-lg">${student.average}%</div>
                                    <div class="text-xs text-gray-500">${student.validResultsCount}/${selectedExams.length}</div>
                                </td>
                                <td class="px-3 py-3 text-center text-2xl border-r">${student.trend}</td>
                                <td class="px-3 py-3 text-center font-bold text-lg">
                                    ${getRankHTML(index + 1)}
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        </div>
        
        <!-- Summary Stats -->
        <div class="mt-6 grid grid-cols-1 md:grid-cols-4 gap-4">
            <div class="bg-blue-50 p-4 rounded-lg border-l-4 border-blue-400">
                <div class="text-2xl font-bold text-blue-600">${studentsWithResults.length}</div>
                <div class="text-sm text-blue-700">মোট ছাত্র</div>
            </div>
            <div class="bg-green-50 p-4 rounded-lg border-l-4 border-green-400">
                <div class="text-2xl font-bold text-green-600">${selectedExams.length}</div>
                <div class="text-sm text-green-700">তুলনাকৃত পরীক্ষা</div>
            </div>
            <div class="bg-yellow-50 p-4 rounded-lg border-l-4 border-yellow-400">
                <div class="text-2xl font-bold text-yellow-600">
                    ${Math.round(studentsWithResults.reduce((sum, s) => sum + s.average, 0) / studentsWithResults.length) || 0}%
                </div>
                <div class="text-sm text-yellow-700">শ্রেণীর গড়</div>
            </div>
            <div class="bg-purple-50 p-4 rounded-lg border-l-4 border-purple-400">
                <div class="text-2xl font-bold text-purple-600">
                    ${studentsWithResults.filter(s => s.trend === '📈').length}
                </div>
                <div class="text-sm text-purple-700">উন্নতি দেখাচ্ছে</div>
            </div>
        </div>
    `;
}

function getComparisonCellColor(percentage) {
    if (percentage >= 90) return 'bg-green-100';
    if (percentage >= 80) return 'bg-blue-100';
    if (percentage >= 70) return 'bg-yellow-100';
    if (percentage >= 60) return 'bg-orange-100';
    return 'bg-red-100';
}

function selectAllExams(className) {
    const checkboxes = document.querySelectorAll('.exam-checkbox');
    const maxSelections = Math.min(5, checkboxes.length);
    
    checkboxes.forEach((cb, index) => {
        cb.checked = index < maxSelections;
    });
    
    updateComparisonMatrix(className);
}

function showComparisonChart(className) {
    alert('চার্ট ফিচার শীঘ্রই যোগ করা হবে।');
}

function closeResultsComparisonModal() {
    const modal = document.getElementById('results-comparison-modal');
    if (modal) {
        modal.remove();
    }
}

// Alias for compatibility with main.js
function exportComparisonMatrix(className) {
    console.log(`📊 Exporting comparison matrix for class: ${className}`);
    exportAnalyticsReport(className);
}

export {
    classExamAnalytics,
    calculateClassAnalytics,
    closeClassAnalyticsModal,
    exportAnalyticsReport,
    printAnalyticsReport,
    updateComparisonMatrix,
    renderComparisonMatrix,
    getComparisonCellColor,
    selectAllExams,
    showComparisonChart,
    closeResultsComparisonModal,
    exportComparisonMatrix
};