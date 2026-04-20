// Exam Management Module for Teachers Corner Integration
// This module handles all exam-related functionality for individual classes

import { initClassExamManagement, loadClassExams, currentClassExams, currentClassExamResults, getEducationalYearName, getCurrentExamSession, getExamSessionKey, hasUnsavedChangesInExam, refreshExamSectionInstantly, saveExamSession } from './exam-management-core.js';
import { renderClassExamSection, renderClassExamList, showQuickNotification, getExamStatusClass, getExamStatusText, getResultCellColor, getGradeColorClass, getRankHTML } from './exam-management-ui.js';
import { createNewClassExam, showExamCreationModal, closeExamCreationModal, proceedToBookSelection, showBookSelectionModal, createExamWithBooks, updateSelectedBooksDisplay, updateBookMarksInSelection, removeBookFromSelection, removeBookFromExamWithConfirmation, selectScoreForExam, selectBookForExam, closeBookSelectionModal } from './exam-creation.js';
import { editClassExam, showExamEditModal, closeExamEditModal, toggleAvailableBooksInEdit, loadAvailableBooksForEdit, addBookToEdit, removeBookFromEdit, updateBookMarksInEdit, updateEditSelectedBooksDisplay, saveExamEdits } from './exam-editing.js';
import { openResultEntryInterface, renderStudentResultRow, updateStudentMark, calculateStudentExamTotals, updateAllRanks, calculateExamClassRanks, updateClassStatistics, calculateAllResults, publishResults, clearAllResults, getExamGrade, closeResultEntryModal } from './exam-results.js';
import { classExamAnalytics, calculateClassAnalytics, closeClassAnalyticsModal, exportAnalyticsReport, printAnalyticsReport, updateComparisonMatrix, renderComparisonMatrix, getComparisonCellColor, selectAllExams, showComparisonChart, closeResultsComparisonModal, exportComparisonMatrix } from './exam-analytics.js';
import { exportClassResults, showExportSelectionModal, closeExportSelectionModal, proceedWithExport, exportSingleExamResults, exportAllExamResults, importResultsCSV } from './exam-export.js';
import { loadStudentExamResults, showExamDetailBreakdown, closeExamBreakdownModal, openResultsViewInterface, closeResultsViewModal, showStudentExamDetail } from './exam-student-view.js';

function duplicateClassExam(examId, event) {
    event.stopPropagation();
    console.log(`📋 Duplicating exam: ${examId}`);
    console.log(`🔍 Available exams:`, currentClassExams.map(e => e.id));
    
    const originalExam = getCurrentExamSession(examId);
    console.log(`🔍 Original exam found:`, originalExam);
    
    if (!originalExam) {
        alert('মূল পরীক্ষা পাওয়া যায়নি।');
        return;
    }
    
    // Create a new exam session with copied data
    const newExamSession = {
        ...originalExam,
        id: 'EX' + Date.now().toString(36).toUpperCase(),
        name: originalExam.name + ' (কপি)',
        status: 'draft',
        createdDate: new Date().toISOString(),
        publishedDate: null
    };
    
    console.log(`🔍 New exam session created:`, newExamSession);
    
    // Save the duplicated exam
    saveExamSession(newExamSession);
    
        // Instant refresh after duplication
        refreshExamSectionInstantly(originalExam.class, true);
        
        showQuickNotification(`✅ পরীক্ষা কপি হয়েছে: ${newExamSession.name}`, 'success');
}

async function deleteClassExam(examId, event) {
    event.stopPropagation();
    console.log(`🗑️ Deleting exam: ${examId}`);
    console.log(`🔍 Available exams:`, currentClassExams.map(e => e.id));
    
    const examSession = getCurrentExamSession(examId);
    console.log(`🔍 Exam session found:`, examSession);
    
    if (!examSession) {
        alert('পরীক্ষা পাওয়া যায়নি।');
        return;
    }
    
    // Confirm deletion
    if (!confirm(`আপনি কি নিশ্চিত যে "${examSession.name}" পরীক্ষা মুছে ফেলতে চান?

এটি স্থায়ীভাবে মুছে যাবে এবং সকল ফলাফল হারিয়ে যাবে।`)) {
        return;
    }
    
    try {
        // Delete via API
        const response = await fetch(`/api/exams/${examId}`, {
            method: 'DELETE'
        });
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error(`❌ Delete API Error ${response.status}:`, errorText);
            throw new Error(`Failed to delete exam: ${response.status} ${response.statusText} - ${errorText}`);
        }
        
        const result = await response.json();
        console.log(`✅ Successfully deleted exam: ${examSession.name}`, result);
        
        // Instant refresh after deletion
        refreshExamSectionInstantly(examSession.class);
        
        showQuickNotification(`✅ পরীক্ষা "${examSession.name}" মুছে ফেলা হয়েছে`, 'success');
        
    } catch (error) {
        console.error('❌ Error deleting exam:', error);
        
        // Fallback to localStorage
        console.log('🔄 Falling back to localStorage...');
        try {
            // Remove exam session
            let examSessions = JSON.parse(localStorage.getItem('examSessions')) || [];
            examSessions = examSessions.filter(session => session.id !== examId);
            localStorage.setItem('examSessions', JSON.stringify(examSessions));
            
            // Remove exam results
            const sessionKey = getExamSessionKey(examSession);
            let allExamResults = JSON.parse(localStorage.getItem('examResults')) || {};
            delete allExamResults[sessionKey];
            localStorage.setItem('examResults', JSON.stringify(allExamResults));
            
            // Also remove from current cache
            if (currentClassExamResults[examSession.id]) {
                delete currentClassExamResults[examSession.id];
            }
            
            console.log(`📦 Fallback: Deleted exam from localStorage`);
            
            // Instant refresh after deletion
            refreshExamSectionInstantly(examSession.class);
            
            showQuickNotification(`✅ পরীক্ষা "${examSession.name}" মুছে ফেলা হয়েছে`, 'success');
            
        } catch (fallbackError) {
            console.error('❌ Fallback also failed:', fallbackError);
            alert('পরীক্ষা মুছতে সমস্যা হয়েছে।');
        }
    }
}

function openClassExam(examId) {
    console.log(`📖 Opening exam: ${examId}`);
    const examSession = getCurrentExamSession(examId);
    if (examSession) {
        openResultEntryInterface(examSession);
    }
}

function viewClassExamResults(examId, event) {
    event.stopPropagation();
    console.log(`📊 Viewing results for exam: ${examId}`);
    console.log(`🔍 Available exams:`, currentClassExams.map(e => e.id));
    console.log(`🔍 Available results keys:`, Object.keys(currentClassExamResults));
    
    const examSession = getCurrentExamSession(examId);
    console.log(`🔍 Exam session found:`, examSession);
    
    if (examSession) {
        openResultsViewInterface(examSession);
    } else {
        alert('পরীক্ষা পাওয়া যায়নি।');
    }
}

function viewAllClassExams(className) {
    console.log(`📋 Viewing all exams for class: ${className}`);
    // This function can be expanded to show a modal with all exams
    // For now, it just logs the action
    alert(`All exams for ${className} - Feature coming soon!`);
}


function updateClassExamStats() {
    // This function is a placeholder.
    // The logic has been integrated into other functions.
}

function saveResultsDraft() {
    // This function is a placeholder.
    // The logic has been integrated into other functions.
}

export {
    initClassExamManagement,
    loadClassExams,
    renderClassExamSection,
    renderClassExamList,
    createNewClassExam,
    showExamCreationModal,
    closeExamCreationModal,
    proceedToBookSelection,
    showBookSelectionModal,
    createExamWithBooks,
    saveExamSession,
    refreshExamSectionInstantly,
    showQuickNotification,
    openResultEntryInterface,
    renderStudentResultRow,
    updateStudentMark,
    calculateStudentExamTotals,
    updateAllRanks,
    calculateExamClassRanks,
    updateClassStatistics,
    calculateAllResults,
    getResultCellColor,
    getGradeColorClass,
    getExamSessionKey,
    getCurrentExamSession,
    publishResults,
    clearAllResults,
    hasUnsavedChangesInExam,
    openClassExam,
    editClassExam,
    showExamEditModal,
    closeExamEditModal,
    toggleAvailableBooksInEdit,
    loadAvailableBooksForEdit,
    addBookToEdit,
    removeBookFromEdit,
    updateBookMarksInEdit,
    updateEditSelectedBooksDisplay,
    saveExamEdits,
    duplicateClassExam,
    deleteClassExam,
    exportClassResults,
    showExportSelectionModal,
    closeExportSelectionModal,
    proceedWithExport,
    exportSingleExamResults,
    exportAllExamResults,
    importResultsCSV,
    loadStudentExamResults,
    showExamDetailBreakdown,
    showStudentExamDetail,
    closeExamBreakdownModal,
    classExamAnalytics,
    calculateClassAnalytics,
    closeClassAnalyticsModal,
    exportAnalyticsReport,
    printAnalyticsReport,
    getRankHTML,
    getExamStatusClass,
    getExamStatusText,
    currentClassExams,
    currentClassExamResults,
    updateClassExamStats,
    saveResultsDraft,
    viewClassExamResults,
    viewAllClassExams,
    openResultsViewInterface,
    closeResultsViewModal,
    updateComparisonMatrix,
    renderComparisonMatrix,
    getComparisonCellColor,
    selectAllExams,
    exportComparisonMatrix,
    showComparisonChart,
    closeResultsComparisonModal,
    updateSelectedBooksDisplay,
    updateBookMarksInSelection,
    removeBookFromSelection,
    removeBookFromExamWithConfirmation,
    selectScoreForExam,
    selectBookForExam,
    closeBookSelectionModal,
    getExamGrade,
    closeResultEntryModal
};