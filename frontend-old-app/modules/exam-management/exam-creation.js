// exam-creation.js

import { t } from '../../translations.js';
import { availableEducationalYears, currentExamSession, saveExamSession, getExamSessionKey } from './exam-management-core.js';
import { openResultEntryInterface } from './exam-results.js';

// Store selected books for the current exam creation
let selectedBooksForExam = [];

// Create new exam for the current class
function createNewClassExam(className) {
    console.log(`🆕 Creating new exam for class: ${className}`);
    
    // Reset selected books for new exam
    selectedBooksForExam = [];
    
    // Open exam creation modal or redirect to exam creation page
    // For now, we'll use a simple modal approach
    showExamCreationModal(className);
}

// Show exam creation modal
function showExamCreationModal(className) {
    const modal = document.createElement('div');
    modal.id = 'exam-creation-modal';
    modal.className = 'modal-backdrop justify-center items-center';
    modal.style.display = 'flex';
    
    const availableTerms = ['Term I', 'Term II'];
    
    modal.innerHTML = `
        <div class="modal-content bg-white rounded-lg shadow-2xl w-11/12 md:w-4/5 lg:w-3/4 xl:w-2/3 max-w-4xl">
            <!-- Header -->
            <div class="px-8 py-6 border-b bg-gradient-to-r from-blue-50 to-indigo-50 rounded-t-lg">
                <div class="flex justify-between items-center">
                    <div>
                        <h3 class="text-2xl font-bold text-gray-800 mb-1">${t('createExamTitle')}</h3>
                        <p class="text-sm text-gray-600">${t('createExamSubtitle')} ${className}</p>
                    </div>
                    <button onclick="closeExamCreationModal()" class="text-gray-400 hover:text-gray-600 text-2xl p-2 rounded-full hover:bg-gray-200 transition-all">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
            </div>
            
            <!-- Content -->
            <div class="p-8">
                <div class="space-y-6">
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label for="new-exam-year" class="block text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                                <i class="fas fa-calendar text-blue-500"></i>
                                ${t('educationalYear')}
                            </label>
                            <select id="new-exam-year" class="w-full border-2 border-gray-300 rounded-lg shadow-sm p-3 text-base focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all">
                                ${availableEducationalYears.map(year => `<option value="${year.id}">${year.name}</option>`).join('')}
                            </select>
                        </div>
                        <div>
                            <label for="new-exam-term" class="block text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                                <i class="fas fa-book text-green-500"></i>
                                ${t('termSemester')}
                            </label>
                            <select id="new-exam-term" class="w-full border-2 border-gray-300 rounded-lg shadow-sm p-3 text-base focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all">
                                ${availableTerms.map(term => `<option value="${term}">${term}</option>`).join('')}
                            </select>
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
                                <input type="checkbox" id="include-score-checkbox" class="w-5 h-5 text-purple-600 border-gray-300 rounded focus:ring-purple-500">
                                <label for="include-score-checkbox" class="text-sm font-medium text-gray-700 cursor-pointer">
                                    ${t('addScoreToExam')}
                                </label>
                            </div>
                            <div id="score-marks-container" class="hidden">
                                <label for="score-total-marks" class="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                                    <i class="fas fa-calculator text-purple-500"></i>
                                    ${t('scoreTotalMarks')}
                                </label>
                                <input type="number" id="score-total-marks" value="100" min="1" max="1000" 
                                       class="w-full border-2 border-gray-300 rounded-lg shadow-sm p-3 text-base focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all">
                                <p class="text-xs text-gray-500 mt-1">${t('scoreDescription')}</p>
                            </div>
                        </div>
                    </div>
                    <div>
                            <label for="new-exam-name" class="block text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                                <i class="fas fa-edit text-purple-500"></i>
                                ${t('examName')}
                            </label>
                        <input type="text" id="new-exam-name" class="w-full border-2 border-gray-300 rounded-lg shadow-sm p-3 text-base focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all" placeholder="${t('examNamePlaceholder')}">
                    </div>
                </div>
            </div>
            
            <!-- Footer -->
            <div class="px-8 py-6 bg-gray-50 rounded-b-lg border-t border-gray-200">
                <div class="flex justify-between items-center">
                    <div class="text-sm text-gray-600">
                        <i class="fas fa-info-circle mr-1"></i>
                        ${t('examCreationNote')}
                    </div>
                    <div class="flex gap-3">
                        <button onclick="closeExamCreationModal()" class="bg-gray-600 hover:bg-gray-700 text-white px-6 py-2.5 rounded-lg font-medium transition-colors flex items-center gap-2">
                            <i class="fas fa-times"></i>
                            ${t('cancel')}
                        </button>
                        <button onclick="proceedToBookSelection('${className}')" class="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-lg font-medium transition-colors flex items-center gap-2">
                            <i class="fas fa-arrow-right"></i>
                            ${t('nextBookSelection')}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
}

// Close exam creation modal
function closeExamCreationModal() {
    const modal = document.getElementById('exam-creation-modal');
    if (modal) {
        modal.remove();
    }
}

// Proceed to book selection step
async function proceedToBookSelection(className) {
    const educationalYearId = document.getElementById('new-exam-year').value;
    const term = document.getElementById('new-exam-term').value;
    const examName = document.getElementById('new-exam-name').value.trim();
    
    if (!examName) {
        alert(t('pleaseEnterExamName'));
        return;
    }
    
    if (!educationalYearId) {
        alert(t('pleaseSelectEducationalYear'));
        return;
    }
    
    // Find the selected educational year
    const selectedEducationalYear = availableEducationalYears.find(year => year.id == educationalYearId);
    if (!selectedEducationalYear) {
        alert(t('pleaseSelectValidEducationalYear'));
        return;
    }
    
    // Get score settings
    const includeScore = document.getElementById('include-score-checkbox').checked;
    const scoreTotalMarks = includeScore ? parseInt(document.getElementById('score-total-marks').value) || 100 : 100;
    
    // Create new exam session object
    const newExamSession = {
        id: 'EX' + Date.now().toString(36).toUpperCase(),
        year: selectedEducationalYear.name, // Keep year for backward compatibility
        educational_year_id: parseInt(educationalYearId),
        term,
        class: className,
        name: examName,
        exam_type: 'written', // Default exam type
        selectedBooks: [],
        include_score: includeScore,
        score_total_marks: scoreTotalMarks,
        status: 'draft',
        createdDate: new Date().toISOString(),
        createdBy: window.currentUser ? window.currentUser.username : 'system'
    };
    
    console.log(`🔍 Created new exam session:`, newExamSession);
    console.log(`🔍 Educational year ID set to:`, newExamSession.educational_year_id);
    
    // Close current modal and open book selection
    closeExamCreationModal();
    await showBookSelectionModal(newExamSession);
}

// Show book selection modal
async function showBookSelectionModal(examSession) {
    const modal = document.createElement('div');
    modal.id = 'book-selection-modal';
    modal.className = 'modal-backdrop justify-center items-center';
    modal.style.display = 'flex';
    
    // Load books from API
    let allBooks = [];
    try {
        console.log('📚 Loading books from API for exam...');
        const response = await fetch('/api/books', {
            credentials: 'include'
        });
        if (response.ok) {
            allBooks = await response.json();
            console.log(`✅ Loaded ${allBooks.length} total books from API:`, allBooks);
        } else {
            console.error('❌ Failed to load books from API');
        }
    } catch (error) {
        console.error('❌ Error loading books:', error);
    }
    
    // Fallback to window.books if API fails
    if (allBooks.length === 0) {
        allBooks = window.books || [
            { id: 'B01', book_name: 'কায়দা', class_id: null },
            { id: 'B02', book_name: 'আমপারা', class_id: null },
            { id: 'B03', book_name: 'আখলাক', class_id: null },
            { id: 'B04', book_name: 'নাজেরা', class_id: null },
            { id: 'B05', book_name: 'মাসনুন দোয়া', class_id: null }
        ];
        console.log(`📚 Using fallback books: ${allBooks.length} books`);
    }
    
    // Get class ID for filtering (using existing function from settings.js)
    const currentClassId = window.getClassIdByName ? window.getClassIdByName(examSession.class) : null;
    console.log(`🔍 Current class: ${examSession.class}, Class ID: ${currentClassId}`);
    
    // Filter books for this specific class
    // Show books that are either:
    // 1. Assigned to this specific class (class_id matches)
    // 2. Available to all classes (class_id is null)
    const availableBooks = allBooks.filter(book => {
        const isForThisClass = book.class_id === currentClassId;
        const isForAllClasses = book.class_id === null || book.class_id === '';
        
        console.log(`📖 Book: ${book.book_name}, class_id: ${book.class_id}, isForThisClass: ${isForThisClass}, isForAllClasses: ${isForAllClasses}`);
        
        return isForThisClass || isForAllClasses;
    });
    
    console.log(`📚 Filtered books for class ${examSession.class} (ID: ${currentClassId}): ${availableBooks.length} books`);
    console.log(`📋 Available book names:`, availableBooks.map(b => b.book_name));
    
    // If no books found for this class, show a helpful message
    if (availableBooks.length === 0) {
        console.warn(`⚠️ No books found for class ${examSession.class}. Available books:`, allBooks.map(b => `${b.book_name} (class_id: ${b.class_id})`));
    }
    
    modal.innerHTML = `
        <div class="modal-content bg-white rounded-lg shadow-xl w-11/12 md:w-3/4 lg:w-2/3">
            <div class="p-6 border-b flex justify-between items-center">
                <h3 class="text-xl font-semibold text-gray-800">${t('bookSelection')} - ${examSession.name}</h3>
                <button onclick="closeBookSelectionModal()" class="text-gray-500 hover:text-gray-800 text-2xl">&times;</button>
            </div>
            <div class="p-6">
                <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <!-- Available Books -->
                    <div>
                        <h4 class="font-semibold text-gray-700 mb-3">
                            ${t('availableBooks')} ${examSession.class} (${availableBooks.length}টি)
                        </h4>
                        <div class="space-y-2 max-h-80 overflow-y-auto">
                            ${examSession.include_score ? `
                                <!-- Score Option (Always First) -->
                                <div class="border-2 border-purple-300 rounded-lg p-3 bg-gradient-to-r from-purple-50 to-pink-50 hover:from-purple-100 hover:to-pink-100">
                                    <div class="flex justify-between items-center">
                                        <div class="flex-1">
                                            <div class="flex items-center gap-2">
                                                <i class="fas fa-star text-purple-500"></i>
                                                <span class="font-semibold text-purple-800">${t('score')}</span>
                                                <span class="text-sm text-purple-600">(সর্বোচ্চ ${examSession.score_total_marks} নম্বর)</span>
                                            </div>
                                        </div>
                                        <div class="flex items-center gap-3">
                                            <span class="px-2 py-1 text-xs rounded-full bg-purple-100 text-purple-800 font-medium">${t('mandatory')}</span>
                                            <button onclick="selectScoreForExam()" class="text-purple-600 hover:text-purple-800 font-medium">
                                                <i class="fas fa-plus-circle"></i>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ` : ''}
                            ${availableBooks.length > 0 ? availableBooks.map(book => `
                                <div class="border border-gray-200 rounded-lg p-3 hover:bg-gray-50">
                                    <div class="flex justify-between items-center">
                                        <div class="flex-1">
                                            <span class="font-medium">${book.book_name}</span>
                                            <div class="text-xs text-gray-500">
                                                ${book.class_id ? t('classSpecificBook') : t('allClasses')}
                                            </div>
                                        </div>
                                        <div class="flex items-center gap-3">
                                            <label class="flex items-center gap-2 text-sm text-gray-600">
                                                <input type="checkbox" id="viva-${book.id}" class="rounded border-gray-300 text-blue-600 focus:ring-blue-500">
                                                ${t('viva')}
                                            </label>
                                            <button onclick="selectBookForExam('${book.id}', '${book.book_name}', document.getElementById('viva-${book.id}').checked)" class="text-blue-600 hover:text-blue-800">
                                                <i class="fas fa-plus-circle"></i>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            `).join('') : `
                                <div class="text-center py-8 text-gray-500">
                                    <i class="fas fa-book text-4xl mb-3"></i>
                                    <p class="font-medium">${t('noBooksAvailable')} ${examSession.class}</p>
                                    <p class="text-sm">${t('addBooksInstruction')}</p>
                                    <button onclick="closeBookSelectionModal(); alert(t('addBooksInstruction'))" 
                                            class="mt-3 bg-blue-600 text-white px-4 py-2 rounded-md text-sm">
                                        <i class="fas fa-plus"></i> ${t('goToAddBooks')}
                                    </button>
                                </div>
                            `}
                        </div>
                    </div>
                    
                    <!-- Selected Books -->
                    <div>
                        <h4 class="font-semibold text-gray-700 mb-3">
                            ${t('selectedBooksForExam')}
                            <span class="text-sm font-normal text-gray-500" id="selected-books-count">(০টি)</span>
                        </h4>
                        <div id="selected-books-for-exam" class="space-y-2 max-h-80 overflow-y-auto">
                            <p class="text-gray-500 text-center py-8">${t('noBooksSelected')}</p>
                        </div>
                    </div>
                </div>
            </div>
            <div class="px-6 py-4 bg-gray-50 flex justify-end gap-3">
                <button onclick="closeBookSelectionModal()" class="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700">${t('cancel')}</button>
                <button onclick="createExamWithBooks('${examSession.id}')" class="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700">${t('createExam')}</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Store the current exam session for book selection
    window.currentExamSession = examSession;
    
    // Update the selected books display immediately (for editing mode)
    updateSelectedBooksDisplay();
    
    // Add event listener for score checkbox
    const scoreCheckbox = document.getElementById('include-score-checkbox');
    const scoreMarksContainer = document.getElementById('score-marks-container');
    
    if (scoreCheckbox && scoreMarksContainer) {
        scoreCheckbox.addEventListener('change', function() {
            if (this.checked) {
                scoreMarksContainer.classList.remove('hidden');
            } else {
                scoreMarksContainer.classList.add('hidden');
            }
        });
    }
}

function createExamWithBooks(examId) {
    if (selectedBooksForExam.length === 0) {
        alert(t('pleaseSelectAtLeastOneBook'));
        return;
    }
    
    // Get the exam session from window
    const examSession = window.currentExamSession;
    if (!examSession) {
        alert(t('examSessionNotFound'));
        return;
    }
    
    // Add selected books to exam session (exclude score books from backend data)
    examSession.selectedBooks = selectedBooksForExam.filter(book => !book.isScore && book.id !== 'SCORE');
    
    // Handle score book separately for frontend display only
    if (examSession.include_score) {
        const scoreBook = {
            id: 'SCORE',
            name: 'হুসনুল খুলুক',
            examType: 'score',
            displayName: 'হুসনুল খুলুক',
            totalMarks: examSession.score_total_marks || 100,
            isScore: true
        };
        // Add score book to the beginning for frontend display
        examSession.selectedBooks.unshift(scoreBook);
        console.log('⭐ Added score book for frontend display');
    }
    
    // Save exam session
    saveExamSession(examSession);
    
    // Close modal and open result entry interface
    closeBookSelectionModal();
    openResultEntryInterface(examSession);
}

function updateSelectedBooksDisplay() {
    const selectedBooksElement = document.getElementById('selected-books-for-exam');
    const countElement = document.getElementById('selected-books-count');
    
    if (!selectedBooksElement) return;
    
    // Update count
    if (countElement) {
        countElement.textContent = `(${selectedBooksForExam.length}টি)`;
    }
    
    if (selectedBooksForExam.length === 0) {
        selectedBooksElement.innerHTML = '<p class="text-gray-500 text-center py-8">কোন বই নির্বাচিত হয়নি</p>';
        return;
    }
    
    selectedBooksElement.innerHTML = selectedBooksForExam.map(book => `
        <div class="border ${book.isScore ? 'border-purple-300 bg-gradient-to-r from-purple-50 to-pink-50' : 'border-blue-200 bg-blue-50'} rounded-lg p-3">
            <div class="flex justify-between items-center">
                <div class="flex-1">
                    <div class="flex items-center gap-2 mb-1">
                        ${book.isScore ? '<i class="fas fa-star text-purple-500"></i>' : ''}
                        <h5 class="font-semibold ${book.isScore ? 'text-purple-800' : 'text-gray-800'}">${book.displayName || book.name}</h5>
                        ${book.examType === 'viva' ? '<span class="px-2 py-1 text-xs rounded-full bg-orange-100 text-orange-800">মৌখিক</span>' : ''}
                        ${book.isScore ? `<span class="px-2 py-1 text-xs rounded-full bg-purple-100 text-purple-800">${t('score')}</span>` : ''}
                    </div>
                    <div class="flex items-center gap-4 mt-2">
                        <div class="flex items-center gap-2">
                            <label class="text-sm text-gray-600">মোট নম্বর:</label>
                            <input type="number" value="${book.totalMarks}" 
                                   onchange="updateBookMarksInSelection('${book.id}', '${book.examType}', this.value)"
                                   class="w-20 border-gray-300 rounded-md text-center text-sm" 
                                   min="1" max="1000">
                        </div>
                    </div>
                </div>
                ${book.isScore ? '' : `<button onclick="removeBookFromExamWithConfirmation('${book.id}', '${book.displayName || book.name}', '${book.examType}')" 
                        class="text-red-600 hover:text-red-800 ml-3" 
                        title="এই বই পরীক্ষা থেকে সরিয়ে দিন">
                    <i class="fas fa-times-circle text-xl"></i>
                </button>`}
            </div>
        </div>
    `).join('');
}

function updateBookMarksInSelection(bookId, examType, newMarks) {
    const book = selectedBooksForExam.find(b => b.id === bookId && b.examType === examType);
    if (book) {
        book.totalMarks = parseInt(newMarks) || 100;
        console.log(`📝 Updated marks for ${book.displayName || book.name}: ${book.totalMarks}`);
    }
}

function removeBookFromSelection(bookId, examType) {
    selectedBooksForExam = selectedBooksForExam.filter(b => !(b.id === bookId && b.examType === examType));
    updateSelectedBooksDisplay();
}

function removeBookFromExamWithConfirmation(bookId, bookName, examType) {
    const currentExamSession = window.currentExamSession;
    
    // Check if this is an existing exam with results
    let hasResults = false;
    if (currentExamSession) {
        const sessionKey = getExamSessionKey(currentExamSession);
        const allExamResults = JSON.parse(localStorage.getItem('examResults')) || {};
        const sessionResults = allExamResults[sessionKey] || {};
        
        // Check if any student has marks for this book with this exam type
        hasResults = Object.values(sessionResults).some(studentResults => 
            studentResults[`${bookId}_${examType}`] !== undefined && studentResults[`${bookId}_${examType}`] !== null
        );
    }
    
    const typeText = examType === 'viva' ? ' (মৌখিক)' : '';
    let confirmMessage = `আপনি কি নিশ্চিত যে "${bookName}${typeText}" বই পরীক্ষা থেকে সরিয়ে দিতে চান?`;
    
    if (hasResults) {
        confirmMessage += `\n\n⚠️ সতর্কতা: এই বইয়ের জন্য ইতিমধ্যে কিছু ছাত্রের নম্বর দেওয়া হয়েছে।\nবই সরিয়ে দিলে সেই নম্বর সমূহ স্থায়ীভাবে মুছে যাবে।`;
    }
    
    if (!confirm(confirmMessage)) {
        return;
    }
    
    // Remove from selected books
    selectedBooksForExam = selectedBooksForExam.filter(b => !(b.id === bookId && b.examType === examType));
    updateSelectedBooksDisplay();
    
    // If this is an existing exam, update the exam session and remove results
    if (currentExamSession) {
        // Update exam session
        currentExamSession.selectedBooks = [...selectedBooksForExam];
        
        // Remove results for this book from all students
        if (hasResults) {
            const sessionKey = getExamSessionKey(currentExamSession);
            let allExamResults = JSON.parse(localStorage.getItem('examResults')) || {};
            const sessionResults = allExamResults[sessionKey] || {};
            
            // Remove this book's marks from all students
            Object.keys(sessionResults).forEach(studentId => {
                if (sessionResults[studentId][bookId] !== undefined) {
                    delete sessionResults[studentId][bookId];
                }
            });
            
            // Save updated results
            allExamResults[sessionKey] = sessionResults;
            localStorage.setItem('examResults', JSON.stringify(allExamResults));
        }
        
        // Save updated exam session
        saveExamSession(currentExamSession);
        
        alert(`"${bookName}" ${t('removeBookFromExam')}${hasResults ? ' ' + t('removeBookWithResults') : ''}`);
    }
}

function selectScoreForExam() {
    console.log(`⭐ Selecting score for exam`);
    
    const examSession = window.currentExamSession;
    if (!examSession || !examSession.include_score) {
        alert('হুসনুল খুলুক ক্যাটাগরি সক্রিয় নেই।');
        return;
    }
    
    // Check if score is already selected
    if (selectedBooksForExam.find(b => b.id === 'SCORE')) {
        alert('হুসনুল খুলুক ইতিমধ্যে নির্বাচিত হয়েছে।');
        return;
    }
    
    // Add score as first item
    const scoreBook = {
        id: 'SCORE',
        name: 'হুসনুল খুলুক',
        examType: 'score',
        displayName: 'হুসনুল খুলুক',
        totalMarks: examSession.score_total_marks,
        isScore: true
    };
    
    selectedBooksForExam.unshift(scoreBook); // Add to beginning
    updateSelectedBooksDisplay();
}

function selectBookForExam(bookId, bookName, isViva = false) {
    console.log(`📚 Selecting book: ${bookName} (${bookId}) - Type: ${isViva ? 'Viva' : 'Written'}`);
    
    const examType = isViva ? 'viva' : 'written';
    const displayName = isViva ? `${bookName} (মৌখিক)` : bookName;
    
    // Check if book with same type is already selected
    if (selectedBooksForExam.find(b => b.id === bookId && b.examType === examType)) {
        alert(`${displayName} ইতিমধ্যে নির্বাচিত হয়েছে।`);
        return;
    }
    
    // Add book with exam type and default marks
    const newBook = {
        id: bookId,
        name: bookName,
        examType: examType,
        displayName: displayName,
        totalMarks: 100 // Default marks: Both Viva and Written=100
    };
    
    selectedBooksForExam.push(newBook);
    updateSelectedBooksDisplay();
}

function closeBookSelectionModal() {
    const modal = document.getElementById('book-selection-modal');
    if (modal) {
        modal.remove();
        selectedBooksForExam = []; // Reset selection
    }
}

export {
    createNewClassExam,
    showExamCreationModal,
    closeExamCreationModal,
    proceedToBookSelection,
    showBookSelectionModal,
    createExamWithBooks,
    updateSelectedBooksDisplay,
    updateBookMarksInSelection,
    removeBookFromSelection,
    removeBookFromExamWithConfirmation,
    selectScoreForExam,
    selectBookForExam,
    closeBookSelectionModal
};
