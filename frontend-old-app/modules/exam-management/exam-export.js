// exam-export.js

import { t } from '../../translations.js';
import { currentClassExams, currentClassExamResults, getCurrentExamSession } from './exam-management-core.js';
import { getEducationalYearName } from './exam-management-core.js';
import { calculateStudentExamTotals, calculateExamClassRanks } from './exam-results.js';

function exportClassResults(className) {
    console.log(`📤 Exporting results for class: ${className}`);
    
    // Get all exams for this class
    const classExams = currentClassExams.filter(exam => exam.status === 'published');
    
    if (classExams.length === 0) {
        alert('এই শ্রেণীর জন্য কোন প্রকাশিত পরীক্ষার ফলাফল নেই।');
        return;
    }
    
    if (classExams.length === 1) {
        // If only one exam, export directly
        exportSingleExamResults(classExams[0], className);
    } else {
        // If multiple exams, show selection modal
        showExportSelectionModal(classExams, className);
    }
}

function showExportSelectionModal(classExams, className) {
    const modal = document.createElement('div');
    modal.id = 'export-selection-modal';
    modal.className = 'modal-backdrop justify-center items-center';
    modal.style.display = 'flex';
    
    modal.innerHTML = `
        <div class="modal-content bg-white rounded-lg shadow-xl w-11/12 md:w-2/3 lg:w-1/2">
            <div class="p-6 border-b flex justify-between items-center">
                <h3 class="text-xl font-semibold text-gray-800">ফলাফল এক্সপোর্ট করুন - ${className}</h3>
                <button onclick="closeExportSelectionModal()" class="text-gray-500 hover:text-gray-800 text-2xl">&times;</button>
            </div>
            <div class="p-6">
                <p class="text-gray-600 mb-4">কোন পরীক্ষার ফলাফল এক্সপোর্ট করতে চান?</p>
                <div class="space-y-3 max-h-80 overflow-y-auto">
                    <label class="flex items-center gap-3 p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                        <input type="radio" name="export-option" value="all" class="text-blue-600" checked>
                        <div>
                            <div class="font-semibold text-gray-800">সকল পরীক্ষার ফলাফল</div>
                            <div class="text-sm text-gray-500">সব প্রকাশিত পরীক্ষার ফলাফল একসাথে এক্সপোর্ট করুন</div>
                        </div>
                    </label>
                    ${classExams.map(exam => `
                        <label class="flex items-center gap-3 p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                            <input type="radio" name="export-option" value="${exam.id}" class="text-blue-600">
                            <div>
                                <div class="font-semibold text-gray-800">${exam.name}</div>
                                <div class="text-sm text-gray-500">${getEducationalYearName(exam)} - ${exam.term}</div>
                            </div>
                        </label>
                    `).join('')}
                </div>
            </div>
            <div class="px-6 py-4 bg-gray-50 flex justify-end gap-3">
                <button onclick="closeExportSelectionModal()" class="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700">বাতিল</button>
                <button onclick="proceedWithExport('${className}')" class="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700">
                    <i class="fas fa-download"></i> এক্সপোর্ট করুন
                </button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
}

function closeExportSelectionModal() {
    const modal = document.getElementById('export-selection-modal');
    if (modal) {
        modal.remove();
    }
}

function proceedWithExport(className) {
    const selectedOption = document.querySelector('input[name="export-option"]:checked').value;
    
    if (selectedOption === 'all') {
        // Export all exams
        exportAllExamResults(className);
    } else {
        // Export specific exam
        const examSession = getCurrentExamSession(selectedOption);
        if (examSession) {
            exportSingleExamResults(examSession, className);
        }
    }
    
    closeExportSelectionModal();
}

function exportSingleExamResults(examSession, className) {
    // Get students for this class
    const studentsInClass = window.students ? window.students.filter(s => 
        s.class === className && s.status === 'active'
    ) : [];
    
    if (studentsInClass.length === 0) {
        alert('এই শ্রেণীতে কোন সক্রিয় ছাত্র নেই।');
        return;
    }
    
    const sessionResults = currentClassExamResults[examSession.id] || {};
    
    // Create CSV content
    let csvContent = 'ছাত্রের নাম,পরিচিতি নং';
    
    // Add book headers
    examSession.selectedBooks.forEach(book => {
        const typeText = book.examType === 'viva' ? ' (মৌখিক)' : '';
        csvContent += `,${book.name}${typeText} (${book.totalMarks})`;
    });
    csvContent += ',মোট নম্বর,শতকরা,গ্রেড,র‍্যাঙ্ক\n';
    
    // Calculate ranks first
    const studentRanks = calculateExamClassRanks(examSession, examSession.id, studentsInClass);
    
    // Add student data
    studentsInClass.forEach(student => {
        const studentResults = sessionResults[student.id] || {};
        let row = `${student.name},${student.rollNumber}`;
        
        // Add marks for each book
        examSession.selectedBooks.forEach(book => {
            const resultKey = `${book.id}_${book.examType}`;
            const mark = studentResults[resultKey] || 0;
            row += `,${mark}`;
        });
        
        // Add totals
        const { total, percentage, grade } = calculateStudentExamTotals(student.id, examSession, studentResults);
        const rank = studentRanks[student.id] || '-';
        
        row += `,${total},${percentage}%,${grade},${rank}`;
        csvContent += row + '\n';
    });
    
    // Download CSV file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${examSession.name}_${className}_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    alert(`"${examSession.name}" পরীক্ষার ফলাফল সফলভাবে এক্সপোর্ট করা হয়েছে।`);
}

function exportAllExamResults(className) {
    const classExams = currentClassExams.filter(exam => exam.status === 'published');
    const studentsInClass = window.students ? window.students.filter(s => 
        s.class === className && s.status === 'active'
    ) : [];
    
    // Create CSV content
    let csvContent = 'ছাত্রের নাম,পরিচিতি নং';
    
    // Add exam headers
    classExams.forEach(exam => {
        csvContent += `,${exam.name} (মোট),${exam.name} (%),${exam.name} (গ্রেড)`;
    });
    csvContent += '\n';
    
    // Add student data
    studentsInClass.forEach(student => {
        let row = `${student.name},${student.rollNumber}`;
        
        classExams.forEach(exam => {
            const studentResults = currentClassExamResults[exam.id]?.[student.id] || {};
            const { total, percentage, grade } = calculateStudentExamTotals(student.id, exam, studentResults);
            
            row += `,${total},${percentage}%,${grade}`;
        });
        
        csvContent += row + '\n';
    });
    
    // Download CSV file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${className}_all_exam_results_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    alert(`${className} শ্রেণীর সকল পরীক্ষার ফলাফল সফলভাবে এক্সপোর্ট করা হয়েছে।`);
}

function importResultsCSV(examId) {
    console.log(`📥 Importing CSV results for exam: ${examId}`);
    // Implementation will be added in next phase
}

export {
    exportClassResults,
    showExportSelectionModal,
    closeExportSelectionModal,
    proceedWithExport,
    exportSingleExamResults,
    exportAllExamResults,
    importResultsCSV
};
