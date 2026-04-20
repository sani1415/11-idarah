// exam-editing.js

import { t } from '../../translations.js';
import { availableEducationalYears, currentExamSession, saveExamSession, getCurrentExamSession } from './exam-management-core.js';
import { showQuickNotification } from './exam-management-ui.js';

// Store books for editing within the modal
let editModalSelectedBooks = [];

function editClassExam(examId, event) {
    event.stopPropagation();
    console.log(`✏️ Editing exam: ${examId}`);
    console.log(`🔍 Available exams:`, currentClassExams.map(e => e.id));
    
    const examSession = getCurrentExamSession(examId);
    console.log(`🔍 Exam session found:`, examSession);
    
    if (examSession) {
        showExamEditModal(examSession);
    } else {
        alert('পরীক্ষা পাওয়া যায়নি।');
    }
}

function showExamEditModal(examSession) {
    const modal = document.createElement('div');
    modal.id = 'exam-edit-modal';
    modal.className = 'modal-backdrop justify-center items-center';
    modal.style.display = 'flex';
    
    const availableTerms = ['Term I', 'Term II'];
    
    modal.innerHTML = `
        <div class="modal-content bg-white rounded-lg shadow-2xl w-11/12 md:w-4/5 lg:w-3/4 xl:w-2/3 max-w-5xl">
            <!-- Header -->
            <div class="px-8 py-6 border-b bg-gradient-to-r from-green-50 to-blue-50 rounded-t-lg">
                <div class="flex justify-between items-center">
                    <div>
                        <h3 class="text-2xl font-bold text-gray-800 mb-1">পরীক্ষা সম্পাদনা</h3>
                        <p class="text-sm text-gray-600">${examSession.class} শ্রেণীর ${examSession.name} পরীক্ষা সম্পাদনা করুন</p>
                    </div>
                    <button onclick="closeExamEditModal()" class="text-gray-400 hover:text-gray-600 text-2xl p-2 rounded-full hover:bg-gray-200 transition-all">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
            </div>
            
            <!-- Content -->
            <div class="p-8">
                <div class="space-y-8">
                    <!-- Basic Information -->
                    <div>
                        <h4 class="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                            <i class="fas fa-info-circle text-blue-500"></i>
                            মৌলিক তথ্য
                        </h4>
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label for="edit-exam-year" class="block text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                                    <i class="fas fa-calendar text-blue-500"></i>
                                    শিক্ষাবর্ষ
                                </label>
                                <select id="edit-exam-year" class="w-full border-2 border-gray-300 rounded-lg shadow-sm p-3 text-base focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all">
                                    ${availableEducationalYears.map(year => `<option value="${year.id}" ${year.id == examSession.educational_year_id ? 'selected' : ''}>${year.name}</option>`).join('')}
                                </select>
                            </div>
                            <div>
                                <label for="edit-exam-term" class="block text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                                    <i class="fas fa-book text-green-500"></i>
                                    টার্ম/সেমিস্টার
                                </label>
                                <select id="edit-exam-term" class="w-full border-2 border-gray-300 rounded-lg shadow-sm p-3 text-base focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all">
                                    ${availableTerms.map(term => `<option value="${term}" ${term === examSession.term ? 'selected' : ''}>${term}</option>`).join('')}
                                </select>
                            </div>
                        </div>
                        <div class="mt-6">
                            <label for="edit-exam-name" class="block text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                                <i class="fas fa-edit text-purple-500"></i>
                                পরীক্ষার নাম
                            </label>
                            <input type="text" id="edit-exam-name" value="${examSession.name}" class="w-full border-2 border-gray-300 rounded-lg shadow-sm p-3 text-base focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all" placeholder="যেমন: মাসিক পরীক্ষা, ত্রৈমাসিক পরীক্ষা">
                        </div>
                    </div>
                    
                    <!-- Score Configuration Section -->
                    <div class="bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg p-6 border border-purple-200">
                        <h4 class="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                            <i class="fas fa-star text-purple-500"></i>
                            ${t('scoreCategory')}
                        </h4>
                        <div class="space-y-4">
                            <div class="flex items-center gap-3">
                                <input type="checkbox" id="edit-include-score-checkbox" ${examSession.include_score ? 'checked' : ''} class="w-5 h-5 text-purple-600 border-gray-300 rounded focus:ring-purple-500">
                                <label for="edit-include-score-checkbox" class="text-sm font-medium text-gray-700 cursor-pointer">
                                    ${t('addScoreToExam')}
                                </label>
                            </div>
                            <div id="edit-score-marks-container" class="${examSession.include_score ? '' : 'hidden'}">
                                <label for="edit-score-total-marks" class="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                                    <i class="fas fa-calculator text-purple-500"></i>
                                    ${t('scoreTotalMarks')}
                                </label>
                                <input type="number" id="edit-score-total-marks" value="${examSession.score_total_marks || 100}" min="1" max="1000" 
                                       class="w-full border-2 border-gray-300 rounded-lg shadow-sm p-3 text-base focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all">
                                <p class="text-xs text-gray-500 mt-1">${t('scoreDescription')}</p>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Book Management Section -->
                    <div class="bg-gradient-to-r from-blue-50 to-indigo-50 p-8 rounded-xl border-2 border-blue-200">
                        <div class="flex justify-between items-center mb-6">
                            <h4 class="text-xl font-bold text-gray-800 flex items-center gap-2">
                                <i class="fas fa-books text-blue-500"></i>
                                নির্বাচিত বই সমূহ (<span id="edit-selected-books-count">${examSession.selectedBooks.length}</span>টি)
                            </h4>
                            <button onclick="toggleAvailableBooksInEdit('${examSession.class}')" id="toggle-books-btn" class="bg-green-600 hover:bg-green-700 text-white px-4 py-2.5 rounded-lg font-medium transition-colors flex items-center gap-2">
                                <i class="fas fa-plus"></i>
                                বই যোগ/বিয়োগ
                            </button>
                        </div>
                        
                        <!-- Selected Books List -->
                        <div id="edit-selected-books-list" class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                            ${examSession.selectedBooks.map(book => `
                                <div class="bg-white p-4 rounded-xl border-2 border-gray-200 hover:shadow-md transition-all" id="edit-book-${book.id}">
                                    <div class="flex justify-between items-center">
                                        <div class="flex-1">
                                            <div class="font-semibold text-lg text-gray-800 mb-2">${book.name}</div>
                                            <div class="flex items-center gap-3">
                                                <label class="text-sm font-medium text-gray-600">মোট নম্বর:</label>
                                                <input type="number" value="${book.totalMarks}" 
                                                       onchange="updateBookMarksInEdit('${book.id}', this.value)"
                                                       class="w-20 border-2 border-gray-300 rounded-lg text-center text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all" 
                                                       min="1" max="1000">
                                            </div>
                                        </div>
                                        <button onclick="removeBookFromEdit('${book.id}')" class="text-red-600 hover:text-red-800 p-2 rounded-full hover:bg-red-100 transition-all">
                                            <i class="fas fa-times-circle text-lg"></i>
                                        </button>
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                        
                        <!-- Available Books Section (Initially Hidden) -->
                        <div id="available-books-section" class="hidden">
                            <div class="border-t-2 border-blue-200 pt-6">
                                <h5 class="text-lg font-semibold text-gray-700 mb-4 flex items-center gap-2">
                                    <i class="fas fa-list text-green-500"></i>
                                    উপলব্ধ বই সমূহ
                                </h5>
                                <div id="available-books-list" class="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-60 overflow-y-auto">
                                    <!-- Available books will be loaded here -->
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- Footer -->
            <div class="px-8 py-6 bg-gray-50 rounded-b-lg border-t border-gray-200">
                <div class="flex justify-between items-center">
                    <div class="text-sm text-gray-600">
                        <i class="fas fa-info-circle mr-1"></i>
                        পরিবর্তন সংরক্ষণ করার পর ফলাফল আপডেট হবে
                    </div>
                    <div class="flex gap-3">
                        <button onclick="closeExamEditModal()" class="bg-gray-600 hover:bg-gray-700 text-white px-6 py-2.5 rounded-lg font-medium transition-colors flex items-center gap-2">
                            <i class="fas fa-times"></i>
                            বাতিল
                        </button>
                        <button onclick="saveExamEdits('${examSession.id}')" class="bg-green-600 hover:bg-green-700 text-white px-6 py-2.5 rounded-lg font-medium transition-colors flex items-center gap-2">
                            <i class="fas fa-save"></i>
                            সংরক্ষণ করুন
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Add event listener for score checkbox
    const scoreCheckbox = document.getElementById('edit-include-score-checkbox');
    const scoreMarksContainer = document.getElementById('edit-score-marks-container');
    
    if (scoreCheckbox && scoreMarksContainer) {
        scoreCheckbox.addEventListener('change', function() {
            if (this.checked) {
                scoreMarksContainer.classList.remove('hidden');
            } else {
                scoreMarksContainer.classList.add('hidden');
            }
        });
    }
    
    // Initialize edit modal selected books
    editModalSelectedBooks = examSession.selectedBooks.map(book => ({
        id: book.id,
        name: book.name,
        totalMarks: book.totalMarks
    }));
    
    // Store current exam session for book editing
    window.currentExamSession = examSession;
}

function closeExamEditModal() {
    const modal = document.getElementById('exam-edit-modal');
    if (modal) {
        modal.remove();
    }
}

async function toggleAvailableBooksInEdit(className) {
    const availableSection = document.getElementById('available-books-section');
    const toggleBtn = document.getElementById('toggle-books-btn');
    
    if (availableSection.classList.contains('hidden')) {
        // Show available books
        availableSection.classList.remove('hidden');
        toggleBtn.innerHTML = '<i class="fas fa-minus"></i> লুকান';
        
        // Load available books
        await loadAvailableBooksForEdit(className);
    } else {
        // Hide available books
        availableSection.classList.add('hidden');
        toggleBtn.innerHTML = '<i class="fas fa-plus"></i> বই যোগ/বিয়োগ';
    }
}

async function loadAvailableBooksForEdit(className) {
    const availableBooksList = document.getElementById('available-books-list');
    if (!availableBooksList) return;
    
    try {
        // Load books from API
        let allBooks = [];
        const response = await fetch('/api/books', {
            credentials: 'include'
        });
        if (response.ok) {
            allBooks = await response.json();
        } else {
            // Fallback to window.books
            allBooks = window.books || [];
        }
        
        // Filter books for this class
        const currentClassId = window.getClassIdByName ? window.getClassIdByName(className) : null;
        const availableBooks = allBooks.filter(book => 
            book.class_id === null || book.class_id === currentClassId
        );
        
        // Get currently selected book IDs
        const selectedBookIds = editModalSelectedBooks.map(b => b.id);
        
        // Show only books that are not already selected
        const unselectedBooks = availableBooks.filter(book => !selectedBookIds.includes(book.id));
        
        if (unselectedBooks.length === 0) {
            availableBooksList.innerHTML = `
                <div class="col-span-2 text-center py-4 text-gray-500">
                    <p class="text-sm">সব উপলব্ধ বই ইতিমধ্যে নির্বাচিত</p>
                </div>
            `;
        } else {
            availableBooksList.innerHTML = unselectedBooks.map(book => `
                <div class="bg-white p-2 rounded border cursor-pointer hover:bg-green-50">
                    <div class="flex justify-between items-center">
                        <div class="flex-1">
                            <div class="font-medium text-sm">${book.book_name}</div>
                            <div class="text-xs text-gray-500">${book.class_id ? 'শ্রেণী নির্দিষ্ট' : 'সকল শ্রেণী'}</div>
                        </div>
                        <div class="flex items-center gap-2">
                            <label class="flex items-center gap-1 text-xs text-gray-600">
                                <input type="checkbox" id="edit-viva-${book.id}" class="rounded border-gray-300 text-blue-600 focus:ring-blue-500">
                                মৌখিক
                            </label>
                            <button onclick="addBookToEdit('${book.id}', '${book.book_name}', document.getElementById('edit-viva-${book.id}').checked)" class="text-green-600 hover:text-green-800">
                                <i class="fas fa-plus-circle"></i>
                            </button>
                        </div>
                    </div>
                </div>
            `).join('');
        }
        
    } catch (error) {
        console.error('❌ Error loading books for edit:', error);
        availableBooksList.innerHTML = `
            <div class="col-span-2 text-center py-4 text-red-500">
                <p class="text-sm">বই লোড করতে সমস্যা হয়েছে</p>
            </div>
        `;
    }
}

function addBookToEdit(bookId, bookName, isViva = false) {
    const examType = isViva ? 'viva' : 'written';
    const displayName = isViva ? `${bookName} (মৌখিক)` : bookName;
    
    // Check if book with same type is already selected
    if (editModalSelectedBooks.find(b => b.id === bookId && b.examType === examType)) {
        return;
    }
    
    // Add book to selected list
    const newBook = {
        id: bookId,
        name: bookName,
        examType: examType,
        displayName: displayName,
        totalMarks: 100 // Default marks: Both Viva and Written=100
    };
    
    editModalSelectedBooks.push(newBook);
    updateEditSelectedBooksDisplay();
    
    // Refresh available books list
    const currentExamSession = window.currentExamSession;
    if (currentExamSession) {
        loadAvailableBooksForEdit(currentExamSession.class);
    }
}

function removeBookFromEdit(bookId, examType) {
    console.log(`🗑️ Removing book from edit: ${bookId} (${examType})`);
    console.log(`📚 Before removal - Selected books:`, editModalSelectedBooks.map(b => `${b.name} (${b.id})`));
    
    const initialCount = editModalSelectedBooks.length;
    editModalSelectedBooks = editModalSelectedBooks.filter(b => !(b.id == bookId && b.examType === examType));
    
    console.log(`📚 After removal - Selected books:`, editModalSelectedBooks.map(b => `${b.name} (${b.id})`));
    console.log(`📊 Books removed: ${initialCount - editModalSelectedBooks.length}`);
    
    updateEditSelectedBooksDisplay();
    
    // Refresh available books list
    const currentExamSession = window.currentExamSession;
    if (currentExamSession) {
        loadAvailableBooksForEdit(currentExamSession.class);
    }
}

function updateBookMarksInEdit(bookId, examType, newMarks) {
    const book = editModalSelectedBooks.find(b => b.id === bookId && b.examType === examType);
    if (book) {
        book.totalMarks = parseInt(newMarks) || 100;
    }
}

function updateEditSelectedBooksDisplay() {
    const selectedBooksList = document.getElementById('edit-selected-books-list');
    const countElement = document.getElementById('edit-selected-books-count');
    
    if (countElement) {
        countElement.textContent = editModalSelectedBooks.length;
    }
    
    if (!selectedBooksList) return;
    
    selectedBooksList.innerHTML = editModalSelectedBooks.map(book => `
        <div class="bg-white p-3 rounded border" id="edit-book-${book.id}-${book.examType}">
            <div class="flex justify-between items-center">
                <div class="flex-1">
                    <div class="flex items-center gap-2 mb-1">
                        <div class="font-medium">${book.displayName || book.name}</div>
                        ${book.examType === 'viva' ? '<span class="px-2 py-1 text-xs rounded-full bg-orange-100 text-orange-800">মৌখিক</span>' : ''}
                    </div>
                    <div class="flex items-center gap-2 mt-1">
                        <label class="text-xs text-gray-600">মোট নম্বর:</label>
                        <input type="number" value="${book.totalMarks}" 
                               onchange="updateBookMarksInEdit('${book.id}', '${book.examType}', this.value)"
                               class="w-16 border-gray-300 rounded text-center text-xs" 
                               min="1" max="1000">
                    </div>
                </div>
                <button onclick="removeBookFromEdit('${book.id}', '${book.examType}')" class="text-red-600 hover:text-red-800 ml-2">
                    <i class="fas fa-times-circle"></i>
                </button>
            </div>
        </div>
    `).join('');
}

function saveExamEdits(examId) {
    console.log(`💾 Saving exam edits for: ${examId}`);
    const examSession = getCurrentExamSession(examId);
    console.log(`🔍 Exam session found:`, examSession);
    
    if (!examSession) {
        alert('পরীক্ষা পাওয়া যায়নি।');
        return;
    }
    
    // Get updated values
    const newEducationalYearId = document.getElementById('edit-exam-year').value;
    const newTerm = document.getElementById('edit-exam-term').value;
    const newName = document.getElementById('edit-exam-name').value.trim();
    
    // Get score settings
    const includeScore = document.getElementById('edit-include-score-checkbox').checked;
    const scoreTotalMarks = includeScore ? parseInt(document.getElementById('edit-score-total-marks').value) || 100 : 100;
    
    if (!newName) {
        alert('অনুগ্রহ করে পরীক্ষার নাম দিন।');
        return;
    }
    
    if (!newEducationalYearId) {
        alert('অনুগ্রহ করে শিক্ষাবর্ষ নির্বাচন করুন।');
        return;
    }
    
    // Find the selected educational year
    const selectedEducationalYear = availableEducationalYears.find(year => year.id == newEducationalYearId);
    if (!selectedEducationalYear) {
        alert('অনুগ্রহ করে একটি বৈধ শিক্ষাবর্ষ নির্বাচন করুন।');
        return;
    }
    
    // Debug: Check class field before update
    console.log(`🔍 Before edit - examSession.class: ${examSession.class}, examSession.class_name: ${examSession.class_name}`);
    
    // Update exam session with new details
    examSession.year = selectedEducationalYear.name; // Keep year for backward compatibility
    examSession.educational_year_id = parseInt(newEducationalYearId);
    examSession.term = newTerm;
    examSession.name = newName;
    examSession.include_score = includeScore;
    examSession.score_total_marks = scoreTotalMarks;
    examSession.lastModified = new Date().toISOString();
    
    // Ensure class field is preserved (it might be class_name from database)
    if (!examSession.class && examSession.class_name) {
        examSession.class = examSession.class_name;
        console.log(`🔧 Fixed missing class field: ${examSession.class}`);
    }
    
    // Update selected books if they were modified (exclude score books from backend data)
    if (editModalSelectedBooks.length > 0) {
        examSession.selectedBooks = editModalSelectedBooks.filter(book => !book.isScore && book.id !== 'SCORE');
    }
    
    // Handle score book separately for frontend display only
    if (includeScore) {
        const scoreBook = {
            id: 'SCORE',
            name: 'হুসনুল খুলুক',
            examType: 'score',
            displayName: 'হুসনুল খুলুক',
            totalMarks: scoreTotalMarks,
            isScore: true
        };
        // Add score book to the beginning for frontend display
        examSession.selectedBooks.unshift(scoreBook);
        console.log('⭐ Added score book for frontend display in edit');
    }
    
    // Debug: Check class field after update
    console.log(`🔍 After edit - examSession.class: ${examSession.class}`);
    
    // Save the updated exam
    saveExamSession(examSession);
    
    // Close modal and reset edit state
    closeExamEditModal();
    editModalSelectedBooks = [];
    
    showQuickNotification(`✅ পরীক্ষা "${newName}" সফলভাবে আপডেট হয়েছে`, 'success');
}

export {
    editClassExam,
    showExamEditModal,
    closeExamEditModal,
    toggleAvailableBooksInEdit,
    loadAvailableBooksForEdit,
    addBookToEdit,
    removeBookFromEdit,
    updateBookMarksInEdit,
    updateEditSelectedBooksDisplay,
    saveExamEdits
};