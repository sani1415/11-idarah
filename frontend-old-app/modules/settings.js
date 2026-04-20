// Global variables for books
let books = [];
// Note: classes, students, and holidays are now global variables from State module
// let classes = []; // Removed - using global classes from State
// let students = []; // Removed - using global students from State  
// let holidays = []; // Removed - using global holidays from State

// Helper function to save data to localStorage
function saveData() {
    // Note: classes are now managed through the database API
    if (window.students) {
        localStorage.setItem('madaniMaktabStudents', JSON.stringify(window.students));
    }
    if (window.holidays) {
        localStorage.setItem('madaniMaktabHolidays', JSON.stringify(window.holidays));
    }
    console.log('💾 Data saved to localStorage');
}

// Class management functions
function updateClassDropdowns() {
    const dropdownIds = [
        'studentClass', 'classFilter', 'reportClass', 'bookClass', 'editBookClass', 'newBookClass', 'educationClassFilter'
    ];

    // Check if classes are loaded
    if (!window.classes || window.classes.length === 0) {
        console.log('⚠️ Classes not loaded yet, skipping dropdown update');
        return;
    }

    dropdownIds.forEach(id => {
        const dropdown = document.getElementById(id);
        if (dropdown) {
            const currentValue = dropdown.value;
            // Preserve the first option (e.g., "All Classes" or "Select Class")
            const firstOption = dropdown.options[0] ? dropdown.options[0].outerHTML : '';
            dropdown.innerHTML = firstOption;

            window.classes.forEach(cls => {
                // Student registration/edit and class filters must store the class name, not the class id.
                if (id === 'classFilter' || id === 'studentClass') {
                    dropdown.options.add(new Option(cls.name, cls.name));
                } else {
                    // Other dropdowns may still depend on class ids.
                    dropdown.options.add(new Option(cls.name, cls.id));
                }
            });

            // Try to restore the previously selected value
            dropdown.value = currentValue;
        }
    });
    
    console.log('✅ Class dropdowns updated successfully');
    populatePromotionClassSelects();
}

async function addClass() {
    const newClassName = document.getElementById('newClassName').value.trim();
    if (!newClassName) {
        showModal(t('error'), t('pleaseEnterClassName'));
        return;
    }

    try {
        const response = await fetch('/api/classes', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: newClassName })
        });

        const result = await response.json();
        if (response.ok) {
            showModal(t('success'), `"${newClassName}" ${t('classAddedSuccessfully')}`);
            document.getElementById('newClassName').value = '';
            await refreshClasses(); // Refresh global class list and UI
        } else {
            showModal(t('error'), result.error || t('failedToAddClass'));
        }
    } catch (error) {
        showModal(t('error'), t('networkErrorOccurred'));
    }
}

async function deleteClass(classId, className) {
    if (confirm(t('confirmDeleteClassWithStudents').replace('{name}', className))) {
        try {
            const response = await fetch(`/api/classes/${classId}`, { method: 'DELETE' });

            if (response.ok) {
                showModal(t('success'), `"${className}" ${t('classDeletedSuccessfully')}`);
                await refreshClasses(); // Refresh global class list and UI
            } else {
                const result = await response.json();
                showModal(t('error'), result.error || t('failedToDeleteClass'));
            }
        } catch (error) {
            showModal(t('error'), t('networkErrorOccurred'));
        }
    }
}

function displayClasses() {
    const classesList = document.getElementById('classesList');
    if (!classesList) return;

    if (!window.classes || window.classes.length === 0) {
        classesList.innerHTML = '<p>No classes added yet</p>';
        return;
    }

    const hasPromotionOrder = window.classes.some(c => c.hasOwnProperty('promotion_order'));
    classesList.innerHTML = window.classes.map(cls => `
        <div class="list-item">
            <div class="list-item-info">
                <strong>${cls.name}</strong>
                ${hasPromotionOrder ? `
                <span class="promotion-order-wrap" style="margin-left: 8px;">
                    <label for="promo-${cls.id}" style="font-size: 0.85em; color: #666;">${typeof t === 'function' ? t('promotionOrder') : 'Order'}:</label>
                    <input type="number" id="promo-${cls.id}" value="${cls.promotion_order != null ? cls.promotion_order : ''}" min="1" step="1" style="width: 48px; margin-left: 4px; padding: 2px 4px;" title="${typeof t === 'function' ? t('promotionOrderHelp') : 'Promotion sequence (1 = first)'}">
                    <button type="button" onclick="saveClassPromotionOrder(${cls.id})" class="btn btn-small btn-secondary" style="margin-left: 4px;" title="${typeof t === 'function' ? t('save') : 'Save'}">
                        <i class="fas fa-check"></i>
                    </button>
                </span>
                ` : ''}
            </div>
            <div>
                <button onclick="editClass(${cls.id}, '${cls.name}')" class="btn btn-secondary btn-small" title="${t('editClassTitle')}">
                    <i class="fas fa-edit"></i>
                </button>
                <button onclick="deleteClass(${cls.id}, '${cls.name}')" class="btn btn-danger btn-small" title="${t('deleteClassTitle')}">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        </div>
    `).join('');
}

async function saveClassPromotionOrder(classId) {
    const input = document.getElementById('promo-' + classId);
    if (!input) return;
    const raw = input.value.trim();
    const promotionOrder = raw === '' ? null : parseInt(raw, 10);
    if (raw !== '' && (isNaN(promotionOrder) || promotionOrder < 1)) {
        showModal(typeof t === 'function' ? t('error') : 'Error', typeof t === 'function' ? t('promotionOrderInvalid') : 'Enter a number 1 or greater.');
        return;
    }
    try {
        const response = await fetch('/api/classes/' + classId, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ promotion_order: promotionOrder })
        });
        const result = await response.json();
        if (response.ok) {
            showModal(typeof t === 'function' ? t('success') : 'Success', typeof t === 'function' ? t('promotionOrderSaved') : 'Promotion order saved.');
            await refreshClasses();
        } else {
            showModal(typeof t === 'function' ? t('error') : 'Error', result.error || t('failedToSave'));
        }
    } catch (e) {
        showModal(typeof t === 'function' ? t('error') : 'Error', t('networkError'));
    }
}

async function editClass(classId, oldClassName) {
    const newClassName = prompt(t('editClassPrompt').replace('{name}', oldClassName), oldClassName);

    if (newClassName && newClassName.trim() !== oldClassName) {
        try {
            const response = await fetch(`/api/classes/${classId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: newClassName.trim() })
            });

            const result = await response.json();
            if (response.ok) {
                showModal(t('success'), t('classUpdatedSuccessfully'));
                await refreshClasses(); // Refresh global class list and UI
            } else {
                showModal(t('error'), result.error || t('failedToUpdateClass'));
            }
        } catch (error) {
            showModal(t('error'), t('networkErrorOccurred'));
        }
    }
}


// Note: loadEducationProgress function removed - Education Progress is now handled in Teachers Corner

// Note: displayBooksList function removed - Education Progress is now handled in Teachers Corner

// Note: showAddBookForm and hideAddBookForm removed - Education Progress is now handled in Teachers Corner

// Note: addBookProgress function removed - Progress tracking is now handled in Teachers Corner

// Note: updateBookProgress and deleteBookProgress functions removed - Progress tracking is now handled in Teachers Corner

// Note: filterBooksByClass function removed - Education Progress is now handled in Teachers Corner

// Note: editBookDetails, closeEditBookModal, and updateBookDetails functions removed - Education Progress is now handled in Teachers Corner

// Note: showDeleteAllEducationModal and deleteAllEducationData functions removed - Education Progress is now handled in Teachers Corner

// Book management functions
async function loadBooks() {
    try {
        console.log('Loading books...');
        console.log('Current master books array before loading:', books);
        const response = await fetch('/api/books?scope=master', {
            credentials: 'include'
        });
        console.log('Response status:', response.status);
        
        if (response.ok) {
            const booksData = await response.json();
            console.log('📚 Books data received from API:', booksData);
            console.log('📊 Number of books received:', booksData.length);
            
            books = booksData;
            window.masterBooks = booksData;
            
            console.log('💾 Master books array after assignment:', books);
            console.log('📈 Master books array length:', books ? books.length : 'undefined');
            
            // Log each book with its details
            if (books && books.length > 0) {
                console.log('📖 Individual book details:');
                books.forEach((book, index) => {
                    console.log(`  Book ${index + 1}:`, {
                        id: book.id,
                        name: book.book_name,
                        class_id: book.class_id,
                        class_name: getClassNameById(book.class_id)
                    });
                });
            }
            
            displayBooks();
            updateBookDropdowns();
            console.log('✅ Books display and dropdowns updated');
        } else {
            console.error('❌ Failed to load books, status:', response.status);
        }
    } catch (error) {
        console.error('Error loading books:', error);
    }
}

function displayBooks() {
    const settingsBooksList = document.getElementById('settingsBooksList');
    if (settingsBooksList) {
        console.log('Displaying master books in settings:', books);
        console.log('Books count:', books ? books.length : 'undefined');
        
        if (!books || books.length === 0) {
            settingsBooksList.innerHTML = '<p class="no-data">No books added yet. Add your first book above.</p>';
        } else {
            // Group books by class
            const booksByClass = {};
            const booksForAllClasses = [];
            
            books.forEach(book => {
                if (!book.class_id || book.class_id === null) {
                    booksForAllClasses.push(book);
                } else {
                    const className = getClassNameById(book.class_id);
                    if (!booksByClass[className]) {
                        booksByClass[className] = [];
                    }
                    booksByClass[className].push(book);
                }
            });
            
            // Build the HTML
            let html = '';
            
            // Display books for all classes first if any exist
            if (booksForAllClasses.length > 0) {
                html += `
                    <div style="margin-bottom: 20px;">
                        <h4 style="background: #f0f0f0; padding: 8px 10px; margin: 0 0 10px 0; border-radius: 4px; font-size: 14px; color: #555;">
                            <i class="fas fa-book"></i> All Classes (${booksForAllClasses.length})
                        </h4>
                        ${booksForAllClasses.map(book => `
                            <div class="list-item" data-book-id="${book.id}">
                                <div class="list-item-info">
                                    <strong>${book.book_name}</strong>
                                    <span style="color: #999; font-size: 0.9em;">All Classes</span>
                                </div>
                                <div>
                                    <button onclick="editBook(${book.id})" class="btn btn-secondary btn-small">
                                        <i class="fas fa-edit"></i> Edit
                                    </button>
                                    <button onclick="deleteBook(${book.id})" class="btn btn-danger btn-small">
                                        <i class="fas fa-trash"></i> Delete
                                    </button>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                `;
            }
            
            // Display books grouped by class
            const sortedClassNames = Object.keys(booksByClass).sort();
            sortedClassNames.forEach(className => {
                const classBooks = booksByClass[className];
                html += `
                    <div style="margin-bottom: 20px;">
                        <h4 style="background: #e8f5e9; padding: 8px 10px; margin: 0 0 10px 0; border-radius: 4px; font-size: 14px; color: #2e7d32;">
                            <i class="fas fa-graduation-cap"></i> ${className} (${classBooks.length})
                        </h4>
                        ${classBooks.map(book => `
                            <div class="list-item" data-book-id="${book.id}">
                                <div class="list-item-info">
                                    <strong>${book.book_name}</strong>
                                    <span style="color: #999; font-size: 0.9em;">${book.total_pages ? book.total_pages + ' pages' : ''}</span>
                                </div>
                                <div>
                                    <button onclick="editBook(${book.id})" class="btn btn-secondary btn-small">
                                        <i class="fas fa-edit"></i> Edit
                                    </button>
                                    <button onclick="deleteBook(${book.id})" class="btn btn-danger btn-small">
                                        <i class="fas fa-trash"></i> Delete
                                    </button>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                `;
            });
            
            settingsBooksList.innerHTML = html;
        }
    } else {
        console.error('settingsBooksList element not found');
    }
}

function getClassNameById(classId) {
    console.log('getClassNameById called with classId:', classId);
    console.log('window.classes:', window.classes);
    
    if (!window.classes || !classId) {
        console.log('No classes or classId, returning "All Classes"');
        return 'All Classes';
    }
    
    const classObj = window.classes.find(cls => cls.id == classId);
    console.log('Found class object:', classObj);
    
    if (classObj) {
        console.log('Returning class name:', classObj.name);
        return classObj.name;
    } else {
        console.log('Class not found, returning "Unknown Class"');
        return 'Unknown Class';
    }
}

function getClassIdByName(className) {
    if (!window.classes || !className) return null;
    
    const classObj = window.classes.find(cls => cls.name === className);
    return classObj ? classObj.id : null;
}

async function addBook() {
    const bookName = document.getElementById('newBookName').value.trim();
    const classId = document.getElementById('newBookClass').value || null;
    const totalPages = parseInt(document.getElementById('newBookPages').value) || null;
    const description = document.getElementById('newBookDescription').value.trim() || null;
    
    if (!bookName) {
        showModal(t('error'), t('pleaseEnterBookName'));
        return;
    }
    
    if (!totalPages || totalPages <= 0) {
        showModal(t('error'), t('pleaseEnterValidNumberOfTotalPages'));
        return;
    }
    
    try {
        const response = await fetch('/api/books', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                book_name: bookName,
                class_id: classId,
                total_pages: totalPages,
                description: description
            })
        });
        
        if (response.ok) {
            const result = await response.json();
            console.log('✅ Book added successfully! API Response:', result);
            showModal(t('success'), t('bookAddedSuccessfully'));
            document.getElementById('newBookName').value = '';
            document.getElementById('newBookClass').value = '';
            document.getElementById('newBookPages').value = '';
            document.getElementById('newBookDescription').value = '';
            
            console.log('🔄 Reloading books to refresh display...');
            await loadBooks();
            updateBookDropdowns();
            console.log('✅ Book list refreshed after adding new book');
        } else {
            const error = await response.json();
            console.error('❌ Failed to add book. API Error:', error);
            showModal(t('error'), error.error || t('failedToAddBook'));
        }
    } catch (error) {
        console.error('Error adding book:', error);
        showModal(t('error'), t('failedToAddBook'));
    }
}

async function editBook(bookId) {
    console.log('Edit book called with ID:', bookId);
    const book = books ? books.find(b => b.id === bookId) : null;
    if (!book) {
        console.error('Book not found with ID:', bookId);
        return;
    }
    
    console.log('Found book:', book);
    
    const editBookId = document.getElementById('bookManagementEditId');
    const editBookName = document.getElementById('bookManagementEditName');
    const editBookClass = document.getElementById('editBookClass');
    const editBookModal = document.getElementById('bookManagementEditModal');
    
    if (!editBookId || !editBookName || !editBookClass || !editBookModal) {
        console.error('Edit modal elements not found');
        return;
    }
    
    editBookId.value = book.id;
    editBookName.value = book.book_name;
    editBookClass.value = book.class_id || '';
    
    // Set total pages if available
    const editBookTotalPages = document.getElementById('editBookTotalPages');
    if (editBookTotalPages) {
        editBookTotalPages.value = book.total_pages || '';
    }
    
    // Set description if available
    const editBookDescription = document.getElementById('editBookDescription');
    if (editBookDescription) {
        editBookDescription.value = book.description || '';
    }
    
    console.log('Populated form with:', {
        id: editBookId.value,
        name: editBookName.value,
        class: editBookClass.value
    });
    
    editBookModal.style.display = 'block';
    console.log('Modal should be visible now');
}

function closeBookManagementEditModal() {
    document.getElementById('bookManagementEditModal').style.display = 'none';
    document.getElementById('bookManagementEditForm').reset();
}

async function updateBook() {
    console.log('Update book function called');
    
    const bookId = document.getElementById('bookManagementEditId').value;
    const bookName = document.getElementById('bookManagementEditName').value.trim();
    const classId = document.getElementById('editBookClass').value || null;
    const totalPages = parseInt(document.getElementById('editBookTotalPages').value) || null;
    const description = document.getElementById('editBookDescription').value.trim() || null;
    
    console.log('Form values:', { bookId, bookName, classId, totalPages, description });
    
    if (!bookName) {
        showModal(t('error'), t('pleaseEnterBookName'));
        return;
    }
    
    try {
        const response = await fetch(`/api/books/${bookId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                book_name: bookName,
                class_id: classId,
                total_pages: totalPages,
                description: description
            })
        });
        
        if (response.ok) {
            showModal(t('success'), t('bookUpdatedSuccessfully'));
            closeBookManagementEditModal();
            await loadBooks();
            updateBookDropdowns();
        } else {
            const error = await response.json();
            showModal(t('error'), error.error || t('failedToUpdateBook'));
        }
    } catch (error) {
        console.error('Error updating book:', error);
        showModal(t('error'), t('failedToUpdateBook'));
    }
}

async function deleteBook(bookId) {
    const confirmed = confirm(t('confirmDeleteBookFull'));
    if (!confirmed) return;
    
    try {
        const response = await fetch(`/api/books/${bookId}`, {
            method: 'DELETE'
        });
        
        if (response.ok) {
            showModal(t('success'), t('bookDeletedSuccessfully'));
            await loadBooks();
            updateBookDropdowns();
        } else {
            const error = await response.json();
            showModal(t('error'), error.error || t('failedToDeleteBook'));
        }
    } catch (error) {
        console.error('Error deleting book:', error);
        showModal(t('error'), t('failedToDeleteBook'));
    }
}

function updateBookDropdowns() {
    console.log('updateBookDropdowns called');
    console.log('master books array in updateBookDropdowns:', books);
    console.log('master books length in updateBookDropdowns:', books ? books.length : 'undefined');
    
    // Only update dropdowns that actually exist in the current UI
    // These dropdowns were for the old Education Progress system that was removed
    
    // Update class dropdowns in the Book Management forms
    updateClassDropdowns();
    
    console.log('✅ Book dropdowns updated (only existing ones)');
}

async function loadBooksForClass(classId) {
    try {
        const url = classId ? `/api/books/class/${classId}?scope=master` : '/api/books?scope=master';
        const response = await fetch(url);
        if (response.ok) {
            const classBooks = await response.json();
            return classBooks;
        }
        return [];
    } catch (error) {
        console.error('Error loading books for class:', error);
        return [];
    }
}

async function updateBookDropdownForClass(classId) {
    const bookDropdown = document.getElementById('bookName');
    if (!bookDropdown) return;
    
    const classBooks = await loadBooksForClass(classId);
    bookDropdown.innerHTML = '<option value="">Select Book</option>' + 
        classBooks.map(book => `<option value="${book.id}">${book.book_name}</option>`).join('');
}

// Academic year functions
async function saveAcademicYearStart() {
    const academicYearStartInput = document.getElementById('academicYearStartInput');
    const startDate = academicYearStartInput.value;
    
    if (!startDate) {
        showModal(t('error'), t('pleaseSelectAcademicYearStartDate'));
        return;
    }
    
    try {
        const response = await fetch('/api/settings/academicYearStart', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                value: startDate,
                description: 'Academic year start date'
            })
        });
        
        if (response.ok) {
    window.academicYearStartDate = startDate;
            // Also save to localStorage as backup
    localStorage.setItem('madaniMaktabAcademicYearStart', startDate);
    
    updateDateRestrictions();
    showModal(t('success'), t('academicYearStartDateUpdatedSuccessfully'));
        } else {
            console.error('Failed to save academic year start to database');
            // Fallback to localStorage only
            window.academicYearStartDate = startDate;
            localStorage.setItem('madaniMaktabAcademicYearStart', startDate);
            updateDateRestrictions();
            showModal(t('success'), t('academicYearStartDateSavedLocally'));
        }
    } catch (error) {
        console.error('Error saving academic year start:', error);
        // Fallback to localStorage only
        window.academicYearStartDate = startDate;
        localStorage.setItem('madaniMaktabAcademicYearStart', startDate);
        updateDateRestrictions();
        showModal(t('success'), t('academicYearStartDateSavedLocally'));
    }
    
    academicYearStartInput.value = '';
    displayAcademicYearStart();
}

async function clearAcademicYearStart() {
    if (confirm(t('confirmClearAcademicYear'))) {
        try {
            const response = await fetch('/api/settings/academicYearStart', {
            method: 'DELETE',
            credentials: 'include'
        });
            
            if (response.ok) {
        window.academicYearStartDate = null;
        localStorage.removeItem('madaniMaktabAcademicYearStart');
        
        clearDateRestrictions();
        displayAcademicYearStart();
        
        showModal(t('success'), t('academicYearStartDateClearedSuccessfully'));
            } else {
                console.error('Failed to clear academic year start from database');
                // Fallback to localStorage only
                window.academicYearStartDate = null;
                localStorage.removeItem('madaniMaktabAcademicYearStart');
                clearDateRestrictions();
                displayAcademicYearStart();
                showModal(t('success'), t('academicYearStartDateClearedLocally'));
            }
        } catch (error) {
            console.error('Error clearing academic year start:', error);
            // Fallback to localStorage only
            window.academicYearStartDate = null;
            localStorage.removeItem('madaniMaktabAcademicYearStart');
            clearDateRestrictions();
            displayAcademicYearStart();
            showModal(t('success'), t('academicYearStartDateClearedLocally'));
        }
    }
}

async function initializeAcademicYearStart() {
    try {
        const response = await fetch('/api/settings/academicYearStart', {
            credentials: 'include'
        });
        if (response.ok) {
            const data = await response.json();
            const savedStartDate = data.value;
            if (savedStartDate) {
                window.academicYearStartDate = savedStartDate;
                console.log('Loaded academic year start date from database:', window.academicYearStartDate);
            }
        } else {
            const savedStartDate = localStorage.getItem('madaniMaktabAcademicYearStart');
            if (savedStartDate) {
                window.academicYearStartDate = savedStartDate;
                console.log('Loaded academic year start date from localStorage:', window.academicYearStartDate);
            }
        }
        // When an active educational year exists, it overrides the legacy setting (single source of truth)
        if (window.currentEducationalYear && window.currentEducationalYear.start_date) {
            window.academicYearStartDate = normalizeEducationalYearDate(window.currentEducationalYear.start_date);
        }
        updateDateRestrictions();
        displayAcademicYearStart();
    } catch (error) {
        console.error('Error loading academic year start from database:', error);
        const savedStartDate = localStorage.getItem('madaniMaktabAcademicYearStart');
        if (savedStartDate) {
            window.academicYearStartDate = savedStartDate;
            console.log('Loaded academic year start date from localStorage:', window.academicYearStartDate);
        }
        if (window.currentEducationalYear && window.currentEducationalYear.start_date) {
            window.academicYearStartDate = normalizeEducationalYearDate(window.currentEducationalYear.start_date);
        }
        updateDateRestrictions();
        displayAcademicYearStart();
    }
}

function displayAcademicYearStart() {
    const academicYearStartInput = document.getElementById('academicYearStartInput');
    const displaySpan = document.getElementById('academicYearStartDisplay');
    const displayContainer = document.getElementById('currentAcademicYearDisplay');
    const fromYearNote = document.getElementById('academicYearStartSourceNote');
    const hasActiveYear = window.currentEducationalYear && window.currentEducationalYear.start_date;
    const effectiveStart = window.academicYearStartDate;

    if (academicYearStartInput) {
        academicYearStartInput.value = effectiveStart || '';
    }

    if (displaySpan) {
        displaySpan.textContent = effectiveStart || (typeof t === 'function' ? t('notSet') : 'Not set');
    }

    if (displayContainer) {
        displayContainer.style.display = effectiveStart ? 'block' : 'none';
    }

    // Show note when start date comes from active educational year (so user knows to change it there)
    if (fromYearNote) {
        if (hasActiveYear && effectiveStart) {
            const yearName = window.currentEducationalYear.name || '';
            fromYearNote.textContent = (typeof t === 'function' ? t('fromActiveEducationalYear') : 'From active educational year') + (yearName ? `: ${yearName}` : '');
            fromYearNote.style.display = 'block';
        } else {
            fromYearNote.style.display = 'none';
        }
    }
}

function updateDateRestrictions() {
    // Prefer active educational year start date (backend truth); fall back to legacy academic year start
    const coverage = window.currentEducationalYear ? getEducationalYearCoverageStatus(window.currentEducationalYear) : null;
    const effectiveMinDate = (coverage && coverage.startDate) ? coverage.startDate : window.academicYearStartDate;

    if (!effectiveMinDate) {
        clearDateRestrictions();
        return;
    }

    console.log('Updating date restrictions from', window.currentEducationalYear ? 'active educational year' : 'academic year start', ':', effectiveMinDate);

    const dateInputIds = [
        'reportStartDate',
        'reportEndDate',
        'attendanceDate',
        'holidayStartDate',
        'holidayEndDate'
    ];

    dateInputIds.forEach(inputId => {
        const dateInput = document.getElementById(inputId);
        if (dateInput) {
            dateInput.min = effectiveMinDate;

            if (dateInput.value && dateInput.value < effectiveMinDate) {
                dateInput.value = '';
                console.log(`Cleared ${inputId} as it was before effective year start`);
            }
        }
    });

    const academicYearStartInput = document.getElementById('academicYearStartInput');
    if (academicYearStartInput) {
        academicYearStartInput.value = window.academicYearStartDate || '';
    }
}

function clearDateRestrictions() {
    const dateInputIds = [
        'reportStartDate',
        'reportEndDate',
        'attendanceDate',
        'holidayStartDate',
        'holidayEndDate'
    ];
    
    dateInputIds.forEach(inputId => {
        const dateInput = document.getElementById(inputId);
        if (dateInput) {
            dateInput.min = '';
            console.log(`Cleared minimum date restriction for ${inputId}`);
        }
    });
    
    const academicYearStartInput = document.getElementById('academicYearStartInput');
    if (academicYearStartInput) {
        academicYearStartInput.value = '';
    }
}

// App name functions
async function saveAppName() {
    const appNameInput = document.getElementById('appNameInput');
    const newAppName = appNameInput.value.trim();
    
    if (!newAppName) {
        showModal(t('error'), t('enterAppName'));
        return;
    }
    
    try {
        const response = await fetch('/api/settings/appName', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                value: newAppName,
                description: 'Application name'
            })
        });
        
        if (response.ok) {
            // Also save to localStorage as backup
    localStorage.setItem('madaniMaktabAppName', newAppName);
    document.title = newAppName;
    
    const appNameDisplay = document.getElementById('appNameDisplay');
    if (appNameDisplay) {
        appNameDisplay.textContent = newAppName;
    }
            
            // Update all header texts to reflect the new app name
            if (typeof updateHeaderTexts === 'function') {
                updateHeaderTexts();
    }
    
    showModal(t('success'), t('appNameUpdated'));
        } else {
            console.error('Failed to save app name to database');
            // Fallback to localStorage only
            localStorage.setItem('madaniMaktabAppName', newAppName);
            document.title = newAppName;
            
            const appNameDisplay = document.getElementById('appNameDisplay');
            if (appNameDisplay) {
                appNameDisplay.textContent = newAppName;
            }
            
            // Update all header texts to reflect the new app name
            if (typeof updateHeaderTexts === 'function') {
                updateHeaderTexts();
            }
            
            showModal(t('success'), t('appNameSavedLocally'));
        }
    } catch (error) {
        console.error('Error saving app name:', error);
        // Fallback to localStorage only
        localStorage.setItem('madaniMaktabAppName', newAppName);
        document.title = newAppName;
        
        const appNameDisplay = document.getElementById('appNameDisplay');
        if (appNameDisplay) {
            appNameDisplay.textContent = newAppName;
        }
        
        // Update all header texts to reflect the new app name
        if (typeof updateHeaderTexts === 'function') {
            updateHeaderTexts();
        }
        
        showModal(t('success'), t('appNameSavedLocally'));
    }
    
    appNameInput.value = '';
}

// Short name functions
async function loadAppShortName() {
    try {
        const response = await fetch('/api/settings/appShortName');
        if (response.ok) {
            const data = await response.json();
            const shortNameInput = document.getElementById('appShortNameInput');
            if (shortNameInput) {
                shortNameInput.value = data.value || '';
            }
        }
    } catch (error) {
        console.error('Error loading short name:', error);
    }
}

// Load app name when settings section is opened
async function loadAppName() {
    try {
        const response = await fetch('/api/settings/appName');
        if (response.ok) {
            const data = await response.json();
            const appNameInput = document.getElementById('appNameInput');
            if (appNameInput) {
                appNameInput.value = data.value || '';
            }
        }
        // Also load short name
        await loadAppShortName();
        // Load dev mode toggle (only shows on localhost)
        loadDevMode();
    } catch (error) {
        console.error('Error loading app name:', error);
    }
}

async function saveAppShortName() {
    const shortNameInput = document.getElementById('appShortNameInput');
    const newShortName = shortNameInput.value.trim();
    
    // Allow empty to use auto-generation
    try {
        const response = await fetch('/api/settings/appShortName', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                value: newShortName || '',
                description: 'Application short name for PWA display'
            })
        });
        
        if (response.ok) {
            showModal(t('success'), newShortName
                ? t('shortNameSaved').replace('{name}', newShortName)
                : t('shortNameCleared'));
        } else {
            showModal(t('error'), t('failedToSaveShortName'));
        }
    } catch (error) {
        console.error('Error saving short name:', error);
        showModal(t('error'), t('failedToSaveShortName'));
    }
}

// Development Mode Functions
function isLocalhost() {
    // Check if running on localhost
    const hostname = window.location.hostname;
    const port = window.location.port;
    return hostname === 'localhost' || 
           hostname === '127.0.0.1' || 
           hostname === '::1' ||
           port === '5001';
}

function loadDevMode() {
    // Only show on localhost
    const devModeSection = document.getElementById('devModeSection');
    if (devModeSection) {
        if (isLocalhost()) {
            devModeSection.style.display = 'block';
            // Load saved setting from localStorage
            const devMode = localStorage.getItem('devMode') === 'true';
            const toggle = document.getElementById('devModeToggle');
            if (toggle) {
                toggle.checked = devMode;
                updateDevModeStatus(devMode);
            }
        } else {
            devModeSection.style.display = 'none';
        }
    }
}

function toggleDevMode() {
    const toggle = document.getElementById('devModeToggle');
    if (!toggle) return;
    
    const enabled = toggle.checked;
    localStorage.setItem('devMode', enabled ? 'true' : 'false');
    updateDevModeStatus(enabled);
    
    if (enabled) {
        // Unregister service worker to disable caching
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.getRegistrations().then(registrations => {
                registrations.forEach(registration => {
                    registration.unregister().then(() => {
                        console.log('✅ Development Mode: Service Worker unregistered - caching disabled');
                        showModal(t('developmentMode'), t('developmentModeEnabledMessage'));
                    });
                });
            });
        }
        // Clear all caches
        if ('caches' in window) {
            caches.keys().then(cacheNames => {
                cacheNames.forEach(cacheName => {
                    caches.delete(cacheName);
                    console.log('✅ Development Mode: Cleared cache:', cacheName);
                });
            });
        }
    } else {
        // Re-register service worker
        if ('serviceWorker' in navigator) {
            window.location.reload();
        }
    }
}

function updateDevModeStatus(enabled) {
    const statusEl = document.getElementById('devModeStatus');
    if (statusEl) {
        if (enabled) {
            statusEl.textContent = `✅ ${t('developmentModeOnStatus')}`;
            statusEl.style.color = '#4CAF50';
        } else {
            statusEl.textContent = t('developmentModeOffStatus');
            statusEl.style.color = '#666';
        }
    }
}

function isDevModeEnabled() {
    // Check if dev mode is enabled (only on localhost)
    return isLocalhost() && localStorage.getItem('devMode') === 'true';
}

// Event listeners
document.addEventListener('DOMContentLoaded', function() {
    if (typeof loadBooks === 'function') {
        loadBooks();
    }
    
    if (typeof loadEducationalYears === 'function') {
        loadEducationalYears();
    }
    
    const bookManagementEditForm = document.getElementById('bookManagementEditForm');
    if (bookManagementEditForm) {
        console.log('Book management edit form found, adding event listener');
        bookManagementEditForm.addEventListener('submit', function(e) {
            e.preventDefault();
            console.log('Book management edit form submitted');
            updateBook();
        });
    } else {
        console.error('Book management edit form not found');
    }
    
    const bookClassSelect = document.getElementById('bookClass');
    if (bookClassSelect) {
        bookClassSelect.addEventListener('change', function() {
            const classId = getClassIdByName(this.value);
            updateBookDropdownForClass(classId);
        });
    }
    
    // Note: Old Education Progress form elements were removed
    // Book management is now handled through the Settings Book Management tab
});

// Helper to refresh classes from the server and update the UI
async function refreshClasses() {
    try {
        const response = await fetch('/api/classes', {
            credentials: 'include'
        });
        if (response.ok) {
            window.classes = await response.json();
            displayClasses();
            updateClassDropdowns();
            // If dashboard is active, refresh it
            if (document.getElementById('dashboard').classList.contains('active')) {
                window.updateDashboard();
            }
        }
    } catch (error) {
        console.error("Failed to refresh classes:", error);
    }
}

// User Management Functions
let allUsers = [];

async function loadUsers() {
    try {
        console.log('🔄 Loading users...');
        console.log('👤 Current user:', window.currentUser);
        
        const response = await fetch('/api/users', {
            credentials: 'include'
        });
        console.log('📡 Users API response status:', response.status);
        
        if (response.ok) {
            allUsers = await response.json();
            console.log('✅ Users loaded successfully:', allUsers.length);
            displayUsers();
            updateUserClassDropdowns();
        } else {
            const error = await response.json();
            console.error('❌ Failed to load users:', error);
            showModal(t('error'), error.error || t('failedToLoadUsers'));
        }
    } catch (error) {
        console.error('❌ Error loading users:', error);
        showModal(t('error'), t('failedToLoadUsers'));
    }
}

function displayUsers() {
    const usersList = document.getElementById('usersList');
    if (!usersList) return;

    if (!allUsers || allUsers.length === 0) {
        usersList.innerHTML = `<p class="no-data">${t('noUsersFound')}</p>`;
        return;
    }

    usersList.innerHTML = allUsers.map(user => {
        const lastLogin = user.last_login ? new Date(user.last_login).toLocaleString() : t('never');
        const status = user.is_active ? t('active') : t('inactive');
        const statusClass = user.is_active ? 'text-green-600' : 'text-red-600';
        const className = user.class_name || t('allClassesLabel');
        
        return `
            <div class="list-item">
                <div class="list-item-info">
                    <strong>${user.username}</strong>
                    <span class="user-details">
                        ${t('roleLabel')}: ${user.role} | ${t('classLabel')}: ${className} | 
                        ${t('statusLabel')}: <span class="${statusClass}">${status}</span> | 
                        ${t('lastLoginLabel')}: ${lastLogin}
                    </span>
                </div>
                <div class="list-item-actions">
                    ${user.role !== 'admin' ? `
                        <button onclick="showPermissionEditor(${user.id})" class="btn btn-primary btn-small" title="${t('editPermissions')}">
                            <i class="fas fa-key"></i> ${t('permissions')}
                        </button>
                    ` : ''}
                    <button onclick="editUser(${user.id})" class="btn btn-secondary btn-small" title="${t('editUserTitle')}">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button onclick="deleteUser(${user.id}, '${user.username}')" class="btn btn-danger btn-small" title="${t('deleteUserTitle')}">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `;
    }).join('');
}

function updateUserClassDropdowns() {
    const dropdownIds = ['createUserClass', 'editUserClass'];
    
    dropdownIds.forEach(id => {
        const dropdown = document.getElementById(id);
        if (dropdown && window.classes) {
            // Preserve the first option
            const firstOption = dropdown.options[0] ? dropdown.options[0].outerHTML : '';
            dropdown.innerHTML = firstOption;
            
            window.classes.forEach(cls => {
                dropdown.options.add(new Option(cls.name, cls.name));
            });
        }
    });
}

function showCreateUserModal() {
    const modal = document.getElementById('createUserModal');
    const form = document.getElementById('createUserForm');
    
    if (modal && form) {
        form.reset();
        updateUserClassDropdowns();
        // Load permission templates only if user has settings access
        if (typeof loadPermissionTemplates === 'function' && typeof window.checkPermission === 'function' && window.checkPermission('settings', 'edit')) {
            loadPermissionTemplates();
        }
        modal.style.display = 'block';
    }
}

function closeCreateUserModal() {
    const modal = document.getElementById('createUserModal');
    if (modal) {
        modal.style.display = 'none';
    }
}

function toggleCreateUserPermissions() {
    const role = document.getElementById('createRole').value;
    const templateSection = document.getElementById('createUserPermissionTemplate');
    
    if (templateSection) {
        // Show template selection only for regular users
        templateSection.style.display = role === 'user' ? 'block' : 'none';
    }
}

async function createUser(event) {
    event.preventDefault();
    
    const username = document.getElementById('createUsername').value.trim();
    const password = document.getElementById('createPassword').value;
    const role = document.getElementById('createRole').value;
    const className = document.getElementById('createUserClass').value || null;
    const templateName = document.getElementById('createPermissionTemplate')?.value || '';
    
    if (!username || !password || !role) {
        showModal(t('error'), t('fillAllFields'));
        return;
    }
    
    // Get permissions from template if selected
    let permissions = null;
    if (role === 'user' && templateName && permissionTemplates && permissionTemplates[templateName]) {
        permissions = permissionTemplates[templateName].permissions;
        
        // If template has empty classes array and user has a class, set it
        if (className && permissions.classes && permissions.classes.length === 0) {
            permissions.classes = [className];
        }
    }
    
    try {
        const response = await fetch('/api/users', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                username,
                password,
                role,
                class_name: className,
                display_name: username, // Default display name to username
                permissions
            })
        });
        
        const result = await response.json();
        if (response.ok) {
            showModal(t('success'), result.message + (templateName ? t('withPermissionsSuffix').replace('{name}', permissionTemplates[templateName].name) : ''));
            closeCreateUserModal();
            await loadUsers();
        } else {
            showModal(t('error'), result.error || t('failedToCreateUser'));
        }
    } catch (error) {
        console.error('Error creating user:', error);
        showModal(t('error'), t('failedToCreateUser'));
    }
}

function editUser(userId) {
    const user = allUsers.find(u => u.id === userId);
    if (!user) {
        showModal(t('error'), t('userNotFound'));
        return;
    }
    
    const modal = document.getElementById('editUserModal');
    if (!modal) return;
    
    document.getElementById('editUserId').value = user.id;
    document.getElementById('editUsername').value = user.username;
    document.getElementById('editRole').value = user.role;
    document.getElementById('editUserClass').value = user.class_name || '';
    document.getElementById('editUserStatus').value = user.is_active ? '1' : '0';
    
    updateUserClassDropdowns();
    modal.style.display = 'block';
}

function closeEditUserModal() {
    const modal = document.getElementById('editUserModal');
    if (modal) {
        modal.style.display = 'none';
    }
}

async function updateUser(event) {
    event.preventDefault();
    
    const userId = document.getElementById('editUserId').value;
    const username = document.getElementById('editUsername').value.trim();
    const role = document.getElementById('editRole').value;
    const className = document.getElementById('editUserClass').value || null;
    const isActive = document.getElementById('editUserStatus').value === '1';
    
    if (!username || !role) {
        showModal(t('error'), t('fillAllFields'));
        return;
    }
    
    try {
        console.log(`🔄 Updating user ${userId} with data:`, { username, role, class_name: className, is_active: isActive });
        
        const response = await fetch(`/api/users/${userId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                username,
                role,
                class_name: className,
                is_active: isActive
            })
        });
        
        console.log(`📡 Update user API response status: ${response.status}`);
        
        const result = await response.json();
        console.log('📄 Update user API response:', result);
        
        if (response.ok) {
            console.log('✅ User update successful, reloading users...');
            showModal(t('success'), result.message);
            closeEditUserModal();
            await loadUsers();
        } else {
            console.error('❌ User update failed:', result);
            showModal(t('error'), result.error || t('failedToUpdateUser'));
        }
    } catch (error) {
        console.error('❌ Error updating user:', error);
        showModal(t('error'), t('failedToUpdateUser'));
    }
}

async function deleteUser(userId, username) {
    if (!confirm(t('confirmDeleteUser').replace('{username}', username))) {
        return;
    }
    
    try {
        const response = await fetch(`/api/users/${userId}`, {
            method: 'DELETE'
        });
        
        const result = await response.json();
        if (response.ok) {
            showModal(t('success'), result.message);
            await loadUsers();
        } else {
            showModal(t('error'), result.error || t('failedToDeleteUser'));
        }
    } catch (error) {
        console.error('Error deleting user:', error);
        showModal(t('error'), t('failedToDeleteUser'));
    }
}

async function resetUserPassword() {
    const userId = document.getElementById('editUserId').value;
    const username = document.getElementById('editUsername').value;
    
    const newPassword = prompt(t('enterNewPasswordForUser').replace('{username}', username));
    if (!newPassword) return;
    
    if (newPassword.length < 4) {
        showModal(t('error'), t('passwordMustBeAtLeast4Characters'));
        return;
    }
    
    try {
        const response = await fetch(`/api/users/${userId}/reset-password`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ new_password: newPassword })
        });
        
        const result = await response.json();
        if (response.ok) {
            showModal(t('success'), result.message);
        } else {
            showModal(t('error'), result.error || t('failedToResetPassword'));
        }
    } catch (error) {
        console.error('Error resetting password:', error);
        showModal(t('error'), t('failedToResetPassword'));
    }
}

function refreshUsersList() {
    loadUsers();
}

// Event listeners for user management forms
document.addEventListener('DOMContentLoaded', function() {
    const createUserForm = document.getElementById('createUserForm');
    if (createUserForm) {
        createUserForm.addEventListener('submit', createUser);
    }
    
    const editUserForm = document.getElementById('editUserForm');
    if (editUserForm) {
        editUserForm.addEventListener('submit', updateUser);
    }
    
    // Only load users for admin users - wait for authentication check
    setTimeout(() => {
        if (window.currentUser && window.currentUser.role === 'admin' && typeof loadUsers === 'function') {
            loadUsers();
        }
    }, 1000);
});

// Data Reset Functions
function showResetStudentsModal() {
    showModal(t('deleteAllStudents'), `
        <div class="text-center">
            <i class="fas fa-users text-4xl text-danger mb-4"></i>
            <h3 class="text-xl font-semibold mb-4">${t('deleteAllStudents')}</h3>
            <p class="text-gray-600 mb-6">${t('thisWillPermanentlyDeleteAllStudentDataIncluding')}</p>
            <ul class="text-left text-gray-600 mb-6 space-y-2">
                <li>• ${t('studentPersonalInformation')}</li>
                <li>• ${t('allAttendanceRecords')}</li>
                <li>• ${t('allScoresAndProgress')}</li>
                <li>• ${t('allTeacherLogsForStudents')}</li>
            </ul>
            <div class="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                <p class="text-red-600 font-semibold mb-2">⚠️ ${t('warningThisActionIsIrreversible')}</p>
                <p class="text-red-600 text-sm">${t('completeStudentDatabaseResetWarning')}</p>
            </div>
            <div class="flex gap-3 justify-center">
                <button onclick="closeModal()" class="btn btn-secondary">${t('cancel')}</button>
                <button onclick="confirmResetStudents()" class="btn btn-danger">${t('deleteAllStudents')}</button>
            </div>
        </div>
    `);
}

function showResetScoresModal() {
    showModal(t('resetAllScoresTitle'), `
        <div class="text-center">
            <i class="fas fa-chart-line text-4xl text-warning mb-4"></i>
            <h3 class="text-xl font-semibold mb-4">${t('resetAllScoresTitle')}</h3>
            <p class="text-gray-600 mb-6">${t('thisWillResetAllStudentScoresToDefaultValues')}</p>
            <p class="text-red-600 font-semibold mb-4">${t('cannotUndo')}</p>
            <div class="flex gap-3 justify-center">
                <button onclick="closeModal()" class="btn btn-secondary">${t('cancel')}</button>
                <button onclick="confirmResetScores()" class="btn btn-danger">${t('resetAllScoresTitle')}</button>
            </div>
        </div>
    `);
}

function showResetProgressModal() {
    showModal(t('resetEducationProgressTitle'), `
        <div class="text-center">
            <i class="fas fa-book-open text-4xl text-warning mb-4"></i>
            <h3 class="text-xl font-semibold mb-4">${t('resetEducationProgressTitle')}</h3>
            <p class="text-gray-600 mb-6">${t('thisWillDeleteAllEducationProgressRecords')}</p>
            <p class="text-red-600 font-semibold mb-4">${t('cannotUndo')}</p>
            <div class="flex gap-3 justify-center">
                <button onclick="closeModal()" class="btn btn-secondary">${t('cancel')}</button>
                <button onclick="confirmResetProgress()" class="btn btn-danger">${t('resetProgress')}</button>
            </div>
        </div>
    `);
}


function showResetBooksModal() {
    showModal(t('resetAllBooksTitle'), `
        <div class="text-center">
            <i class="fas fa-books text-4xl text-warning mb-4"></i>
            <h3 class="text-xl font-semibold mb-4">${t('resetAllBooksTitle')}</h3>
            <p class="text-gray-600 mb-6">${t('thisWillDeleteAllBooksAndTheirProgressRecords')}</p>
            <p class="text-red-600 font-semibold mb-4">${t('cannotUndo')}</p>
            <div class="flex gap-3 justify-center">
                <button onclick="closeModal()" class="btn btn-secondary">${t('cancel')}</button>
                <button onclick="confirmResetBooks()" class="btn btn-danger">${t('resetAllBooksTitle')}</button>
            </div>
        </div>
    `);
}


function showResetLogsModal() {
    showModal(t('resetTeacherLogsTitle'), `
        <div class="text-center">
            <i class="fas fa-clipboard-list text-4xl text-warning mb-4"></i>
            <h3 class="text-xl font-semibold mb-4">${t('resetTeacherLogsTitle')}</h3>
            <p class="text-gray-600 mb-6">${t('thisWillDeleteAllTeacherLogbookEntries')}</p>
            <p class="text-red-600 font-semibold mb-4">${t('cannotUndo')}</p>
            <div class="flex gap-3 justify-center">
                <button onclick="closeModal()" class="btn btn-secondary">${t('cancel')}</button>
                <button onclick="confirmResetLogs()" class="btn btn-danger">${t('resetAllLogs')}</button>
            </div>
        </div>
    `);
}

function showResetUsersModal() {
    showModal(t('resetAllUsersTitle'), `
        <div class="text-center">
            <i class="fas fa-user-cog text-4xl text-warning mb-4"></i>
            <h3 class="text-xl font-semibold mb-4">${t('resetAllUsersTitle')}</h3>
            <p class="text-gray-600 mb-6">${t('thisWillDeleteAllUserAccountsExceptCurrentAdmin')}</p>
            <p class="text-red-600 font-semibold mb-4">${t('cannotUndo')}</p>
            <div class="flex gap-3 justify-center">
                <button onclick="closeModal()" class="btn btn-secondary">${t('cancel')}</button>
                <button onclick="confirmResetUsers()" class="btn btn-danger">${t('resetAllUsersTitle')}</button>
            </div>
        </div>
    `);
}

function showResetSettingsModal() {
    showModal(t('resetSettingsTitle'), `
        <div class="text-center">
            <i class="fas fa-cog text-4xl text-warning mb-4"></i>
            <h3 class="text-xl font-semibold mb-4">${t('resetSettingsTitle')}</h3>
            <p class="text-gray-600 mb-6">${t('thisWillResetAllApplicationSettingsToDefaultValues')}</p>
            <p class="text-red-600 font-semibold mb-4">${t('cannotUndo')}</p>
            <div class="flex gap-3 justify-center">
                <button onclick="closeModal()" class="btn btn-secondary">${t('cancel')}</button>
                <button onclick="confirmResetSettings()" class="btn btn-danger">${t('resetSettingsTitle')}</button>
            </div>
        </div>
    `);
}

function showCompleteResetModal() {
    showModal(t('completeResetTitle'), `
        <div class="text-center">
            <i class="fas fa-bomb text-6xl text-red-500 mb-4"></i>
            <h3 class="text-2xl font-bold text-red-600 mb-4">⚠️ ${t('completeResetHeading')} ⚠️</h3>
            <p class="text-gray-600 mb-6 text-lg">${t('thisWillDeleteAllDataAndResetEntireApplication')}</p>
            <div class="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                <h4 class="font-semibold text-red-800 mb-2">${t('thisWillDeleteLabel')}</h4>
                <ul class="text-left text-red-700 space-y-1">
                    <li>• ${t('allStudentsAndTheirData')}</li>
                    <li>• ${t('allAttendanceRecords')}</li>
                    <li>• ${t('allBooksAndClasses')}</li>
                    <li>• ${t('allTeacherLogs')}</li>
                    <li>• ${t('allUserAccountsExceptAdmin')}</li>
                    <li>• ${t('allSettingsAndPreferences')}</li>
                </ul>
            </div>
            <p class="text-red-600 font-bold text-lg mb-6">${t('thisActionCannotBeUndoneUpper')}</p>
            <div class="flex gap-3 justify-center">
                <button onclick="closeModal()" class="btn btn-secondary">${t('cancel')}</button>
                <button onclick="confirmCompleteReset()" class="btn btn-danger text-lg px-6 py-3">${t('resetEverything')}</button>
            </div>
        </div>
    `);
}

function showBackupModal() {
    showModal(t('createBackupTitle'), `
        <div class="text-center">
            <i class="fas fa-download text-4xl text-blue-500 mb-4"></i>
            <h3 class="text-xl font-semibold mb-4">${t('createDataBackup')}</h3>
            <p class="text-gray-600 mb-6">${t('downloadCompleteBackupOfAllData')}</p>
            <div class="flex gap-3 justify-center">
                <button onclick="closeModal()" class="btn btn-secondary">${t('cancel')}</button>
                <button onclick="createBackup()" class="btn btn-primary">${t('createBackupTitle')}</button>
            </div>
        </div>
    `);
}

// Confirmation functions (to be implemented)
async function confirmResetStudents() {
    // Check if students exist
    if (typeof window.students === 'undefined' || window.students.length === 0) {
        closeModal();
        showModal(t('noData'), t('noStudentsFoundToDelete'));
        return;
    }
    
    // First confirmation
    if (confirm(t('confirmDeleteAllStudentsFirst'))) {
        // Second confirmation with stronger warning
        if (confirm(t('confirmDeleteAllStudentsSecond'))) {
            try {
                const response = await fetch('/api/students', {
            method: 'DELETE',
            credentials: 'include'
        });
                
                if (response.ok) {
                    // Get count before clearing
                    const deletedCount = window.students.length;
                    // Clear local array
                    window.students = [];
                    
                    // Refresh UI
                    if (typeof displayStudentsList === 'function') {
                        displayStudentsList();
                    }
                    if (typeof updateDashboard === 'function') {
                        updateDashboard();
                    }
                    
                    closeModal();
                    showModal(t('success'), t('allStudentsDeletedSuccessfully').replace('{count}', deletedCount));
                } else {
                    const error = await response.json();
                    closeModal();
                    showModal(t('error'), error.error || t('failedToDeleteAllStudents'));
                }
            } catch (error) {
                console.error('Delete all error:', error);
                closeModal();
                showModal(t('error'), t('networkErrorPleaseTryAgain'));
            }
        }
    }
}

async function confirmResetScores() {
    try {
        const response = await fetch('/api/student-scores/reset-all', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        const result = await response.json();
        if (response.ok) {
    closeModal();
            showModal(t('success'), result.message || t('allStudentScoresDeleted'));
            
            // Refresh any open Teachers Corner views
            if (typeof window.refreshTeachersCorner === 'function') {
                window.refreshTeachersCorner();
            }
        } else if (response.status === 401) {
            closeModal();
            showModal(t('error'), t('adminRequiredResetStudentScores'));
        } else {
            closeModal();
            showModal(t('error'), result.error || t('failedToDeleteAllScoreData'));
        }
    } catch (error) {
        console.error('Error resetting scores:', error);
        closeModal();
        showModal(t('error'), t('networkErrorPleaseTryAgain'));
    }
}

async function confirmResetProgress() {
    try {
    console.log('Resetting education progress...');
        console.log('Making API call to /api/education/all');
        
        const response = await fetch('/api/education/all', {
            method: 'DELETE',
            credentials: 'include'
        });
        
        console.log('Response received:', response.status, response.statusText);
        
        const result = await response.json();
        console.log('Response data:', result);
        
        if (response.ok) {
            console.log('Education progress reset successful');
    closeModal();
            showModal(t('success'), result.message || t('allEducationProgressDeletedSuccessfully'));
        } else if (response.status === 401) {
            console.log('Authentication required for education progress reset');
            closeModal();
            showModal(t('error'), t('adminRequiredResetEducationProgress'));
        } else {
            console.log('Education progress reset failed:', result.error);
            closeModal();
            showModal(t('error'), result.error || t('failedToDeleteEducationProgressData'));
        }
    } catch (error) {
        console.error('Error resetting education progress:', error);
    closeModal();
        showModal(t('error'), t('networkErrorPleaseTryAgain'));
    }
}


async function confirmResetBooks() {
    try {
        const response = await fetch('/api/books/all', {
            method: 'DELETE',
            credentials: 'include'
        });
        
        const result = await response.json();
        if (response.ok) {
    closeModal();
            showModal(t('success'), result.message || t('allBooksResetSuccessfully'));
            
            // Refresh books list if it exists
            if (typeof loadBooks === 'function') {
                await loadBooks();
            }
        } else {
    closeModal();
            showModal(t('error'), result.error || t('failedToResetAllBooks'));
        }
    } catch (error) {
        console.error('Error resetting books:', error);
        closeModal();
        showModal(t('error'), t('networkErrorPleaseTryAgain'));
    }
}


async function confirmResetLogs() {
    try {
        const response = await fetch('/api/teacher-logs/all', {
            method: 'DELETE',
            credentials: 'include'
        });
        
        const result = await response.json();
        if (response.ok) {
    closeModal();
            showModal(t('success'), result.message || t('allTeacherLogsResetSuccessfully'));
        } else {
            closeModal();
            showModal(t('error'), result.error || t('failedToResetAllTeacherLogs'));
        }
    } catch (error) {
        console.error('Error resetting teacher logs:', error);
        closeModal();
        showModal(t('error'), t('networkErrorPleaseTryAgain'));
    }
}

function confirmResetUsers() {
    console.log('Resetting all users...');
    closeModal();
    showModal(t('success'), t('allUsersResetSuccessfully'));
}

function confirmResetSettings() {
    console.log('Resetting settings...');
    closeModal();
    showModal(t('success'), t('settingsResetSuccessfully'));
}

function confirmCompleteReset() {
    console.log('Performing complete reset...');
    closeModal();
    showModal(t('success'), t('completeResetPerformedSuccessfully'));
}

function showBulkImport() {
    openDataSubtab(null, 'import');
    const bulkImportSection = document.getElementById('bulkImportSection');
    const bulkImportIntro = document.getElementById('bulkImportIntro');
    
    if (bulkImportSection) {
        if (bulkImportIntro) {
            bulkImportIntro.style.display = 'none';
        }
        bulkImportSection.style.display = 'block';
        
        // Setup file input listener
        const fileInput = document.getElementById('excelFile');
        if (fileInput) {
            fileInput.addEventListener('change', handleFileSelect);
        }
    }
}

function hideBulkImport() {
    const bulkImportSection = document.getElementById('bulkImportSection');
    const bulkImportIntro = document.getElementById('bulkImportIntro');
    
    if (bulkImportSection) {
        bulkImportSection.style.display = 'none';
        if (bulkImportIntro) {
            bulkImportIntro.style.display = 'block';
        }
        
        // Reset file input
        const fileInput = document.getElementById('excelFile');
        if (fileInput) {
            fileInput.value = '';
        }
        
        // Hide import results
        const importResults = document.getElementById('importResults');
        if (importResults) {
            importResults.style.display = 'none';
        }
    }
}

function downloadAllStudentsCSV() {
    // Export all students data as CSV in the exact format expected by import
    if (typeof window.students === 'undefined' || window.students.length === 0) {
        showModal(t('noData'), t('noStudentsFoundToExport'));
        return;
    }
    
    try {
        // Create CSV content with headers that match the import format exactly
        const headers = ['id', 'name', 'fathername', 'rollnumber', 'mobilenumber', 'district', 'upazila', 'class', 'registrationdate'];
        const csvContent = [
            headers.join(','),
            ...window.students.map(student => [
                student.id || '',
                `"${student.name || ''}"`,
                `"${student.fatherName || ''}"`,
                student.rollNumber || '',
                student.mobileNumber || '',
                `"${student.district || ''}"`,
                `"${student.upazila || ''}"`,
                `"${student.class || ''}"`,
                student.registrationDate || ''
            ].join(','))
        ].join('\n');
        
        // Download CSV file with UTF-8 BOM for proper Bengali text support
        const BOM = '\uFEFF';
        const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `students_export_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        showModal(t('success'), t('studentsDataExportedSuccessfully'));
    } catch (error) {
        console.error('Export error:', error);
        showModal(t('exportError'), t('failedToExportDataPleaseTryAgain'));
    }
}

function createBackup() {
    console.log('Creating backup...');
    closeModal();
    showModal(t('success'), t('backupCreatedSuccessfully'));
}

// Bulk import helper functions (imported from registration.js functionality)
function handleFileSelect(event) {
    const file = event.target.files[0];
    const uploadBtn = document.getElementById('uploadBtn');
    
    if (file) {
        updateUploadZone(file.name);
        if (uploadBtn) {
            uploadBtn.disabled = false;
        }
    } else {
        resetUploadZone();
        if (uploadBtn) {
            uploadBtn.disabled = true;
        }
    }
}

function updateUploadZone(fileName) {
    const dropZone = document.querySelector('.upload-drop-zone');
    if (dropZone) {
        dropZone.innerHTML = `
            <i class="fas fa-file-csv text-success"></i>
            <p><strong>${t('selectedLabel')}</strong> ${fileName}</p>
            <p class="file-types">${t('clickToSelectDifferentFile')}</p>
        `;
    }
}

function resetUploadZone() {
    const dropZone = document.querySelector('.upload-drop-zone');
    if (dropZone) {
        dropZone.innerHTML = `
            <i class="fas fa-cloud-upload-alt"></i>
            <p>${t('clickToSelectCsvFile')}</p>
            <p class="file-types">${t('supportsCsvFilesExcelSavedAsCsv')}</p>
        `;
    }
}

// Import the bulk import functions from registration.js
async function processExcelFile() {
    const fileInput = document.getElementById('excelFile');
    const file = fileInput.files[0];
    
    if (!file) {
        showModal(t('error'), t('pleaseSelectCsvFileFirst'));
        return;
    }
    
    // Show progress
    showImportProgress();
    
    try {
        // Read Excel file
        const studentsData = await readExcelFile(file);
        
        if (studentsData.length === 0) {
            showModal(t('error'), t('noStudentDataFoundInCsv'));
            hideImportProgress();
            return;
        }
        
        // Validate and import students
        await importStudentsBatch(studentsData);
        
    } catch (error) {
        console.error('Import error:', error);
        hideImportProgress();
        
        // Show better error message for encoding issues
        if (error.message.includes('এনকোডিং') || error.message.includes('encoding')) {
            showEncodingErrorModal(error.message);
        } else {
            showModal(t('importError'), error.message);
        }
    }
}

function showImportProgress() {
    const resultsDiv = document.getElementById('importResults');
    if (resultsDiv) {
        resultsDiv.style.display = 'block';
        resultsDiv.innerHTML = `
            <div class="import-progress">
                <h4>📤 ${t('processingCsvFile')}</h4>
                <div class="progress-bar">
                    <div class="progress-fill" id="progressFill" style="width: 0%"></div>
                </div>
                <p id="progressText">${t('preparingToReadFile')}</p>
            </div>
        `;
    }
}

function updateProgress(percentage, text) {
    const progressFill = document.getElementById('progressFill');
    const progressText = document.getElementById('progressText');
    
    if (progressFill) progressFill.style.width = percentage + '%';
    if (progressText) progressText.textContent = text;
}

function hideImportProgress() {
    const progressDiv = document.querySelector('.import-progress');
    if (progressDiv) {
        progressDiv.style.display = 'none';
    }
}

async function readExcelFile(file) {
    updateProgress(10, t('readingCsvFile'));
    
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        
        reader.onload = function(e) {
            try {
                updateProgress(30, t('parsingCsvData'));
                
                const text = e.target.result;
                
                // Split into lines and remove empty lines
                const lines = text.split('\n').filter(line => line.trim() !== '');
                
                if (lines.length < 2) {
                    reject(new Error(t('csvNeedsHeaderAndDataRow')));
                    return;
                }
                
                // Parse header row
                const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
                
                // Expected headers
                const expectedHeaders = ['id', 'name', 'fathername', 'rollnumber', 'mobilenumber', 'district', 'upazila', 'class', 'registrationdate'];
                
                // Check if all required headers are present
                const missingHeaders = expectedHeaders.filter(h => !headers.includes(h));
                if (missingHeaders.length > 0) {
                    reject(new Error(t('missingRequiredHeaders').replace('{headers}', missingHeaders.join(', '))));
                    return;
                }
                
                // Parse data rows
                const fileStudents = [];
                for (let i = 1; i < lines.length; i++) {
                    const values = lines[i].split(',').map(v => v.trim().replace(/^"|"$/g, ''));
                    
                    if (values.length !== headers.length) {
                        console.warn(`Row ${i + 1} has ${values.length} columns but expected ${headers.length}. Skipping.`);
                        continue;
                    }
                    
                    const student = {};
                    headers.forEach((header, index) => {
                        student[header] = values[index] || '';
                    });
                    
                    // Validate required fields
                    if (!student.name || !student.fathername || !student.rollnumber || !student.class) {
                        console.warn(`Row ${i + 1} is missing required fields. Skipping.`);
                        continue;
                    }
                    
                    fileStudents.push(student);
                }
                
                updateProgress(50, `Found ${fileStudents.length} students in file`);
                resolve(fileStudents);
                
            } catch (error) {
                reject(new Error(t('errorParsingCsvFile').replace('{error}', error.message)));
            }
        };
        
        reader.onerror = function() {
            reject(new Error(t('errorReadingFile')));
        };
        
        reader.readAsText(file, 'UTF-8');
    });
}

async function importStudentsBatch(studentsData) {
    const total = studentsData.length;
    updateProgress(60, t('uploadingStudentsForValidation').replace('{count}', total));
    
    // We need to map the headers from the CSV (lowercase) to the database schema (camelCase)
    const formattedStudentsData = studentsData.map(student => ({
        id: student.id || generateStudentId(), // Assign new ID if missing
        name: student.name,
        fatherName: student.fathername,
        rollNumber: student.rollnumber,
        mobileNumber: student.mobilenumber,
        district: student.district,
        upazila: student.upazila,
        class: student.class,
        registrationDate: student.registrationdate || new Date().toISOString().split('T')[0]
    }));

    try {
        const response = await fetch('/api/students/bulk-import', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formattedStudentsData)
        });

        const result = await response.json();

        if (response.ok) {
            updateProgress(100, t('importComplete'));
            showImportResults(total, total, 0, 0, 0, []); // Simplified results
            
            // Refresh local student data
            const studentsResponse = await fetch('/api/students', {
            credentials: 'include'
        });
            if (studentsResponse.ok) {
                window.students = await studentsResponse.json();
            }
        } else {
            // Handle the specific class validation error
            if (response.status === 400 && result.invalid_classes) {
                const errorMessage = `${result.error}: ${result.invalid_classes.join(', ')}. ${t('pleaseAddClassesBeforeUploading')}`;
                showModal(t('uploadFailed'), errorMessage);
            } else {
                showModal(t('importError'), result.error || t('unknownErrorOccurred'));
            }
            
            // Reset progress on failure
            document.getElementById('importResults').style.display = 'none';
        }
    } catch (error) {
        console.error('Bulk import error:', error);
        showModal(t('error'), t('networkErrorDuringUpload'));
        document.getElementById('importResults').style.display = 'none';
    } finally {
        hideImportProgress();
        
        // Refresh the student list and dashboard regardless of outcome
        if (typeof displayStudentsList === 'function') {
            displayStudentsList();
        }
        if (typeof updateDashboard === 'function') {
            updateDashboard();
        }
    }
}

function showImportResults(total, successful, failed, updated, duplicateRolls, errors) {
    const resultsDiv = document.getElementById('importResults');
    if (!resultsDiv) return;
    
    const summaryHTML = `
        <div class="import-summary">
            <div class="summary-item success">
                <h4>${successful}</h4>
                <p>${t('successfullyImported')}</p>
            </div>
            <div class="summary-item error">
                <h4>${failed}</h4>
                <p>${t('failed')}</p>
            </div>
            <div class="summary-item info">
                <h4>${updated}</h4>
                <p>${t('updated')}</p>
            </div>
            <div class="summary-item warning">
                <h4>${duplicateRolls}</h4>
                <p>${t('duplicateRollNumbers')}</p>
            </div>
        </div>
    `;
    
    resultsDiv.innerHTML = `
        <div class="import-results-content">
            <h4>📊 ${t('importResults')}</h4>
            ${summaryHTML}
            <div style="margin-top: 20px; text-align: center;">
                <button onclick="hideBulkImport()" class="btn btn-primary">
                    <i class="fas fa-list"></i> ${t('backToDataManagement')}
                </button>
                <button onclick="resetBulkImport()" class="btn btn-secondary">
                    <i class="fas fa-upload"></i> ${t('importAnotherFile')}
                </button>
            </div>
        </div>
    `;
}

function resetBulkImport() {
    // Reset the form
    const fileInput = document.getElementById('excelFile');
    const uploadBtn = document.getElementById('uploadBtn');
    const importResults = document.getElementById('importResults');
    
    if (fileInput) fileInput.value = '';
    if (uploadBtn) uploadBtn.disabled = true;
    if (importResults) importResults.style.display = 'none';
    
    resetUploadZone();
}

function generateStudentId() {
    return 'ST' + String(Date.now()).slice(-6);
}

function showEncodingErrorModal(message) {
    showModal(t('encodingError'), `
        <div style="text-align: left;">
            <p><strong>${t('bengaliUnicodeIssueDetected')}</strong></p>
            <p>${message}</p>
            <div style="background: #e3f2fd; padding: 15px; border-radius: 8px; margin: 15px 0; border-left: 4px solid #2196f3;">
                <p style="margin: 0; color: #1565c0; font-weight: 600;">💡 ${t('solution')}</p>
                <p style="margin: 5px 0 0 0; color: #1565c0;">${t('saveExcelAsCsvUtf8')}</p>
            </div>
            <p><strong>${t('steps')}</strong></p>
            <ol style="text-align: left; margin: 10px 0;">
                <li>${t('openYourExcelFile')}</li>
                <li>${t('goToFileSaveAs')}</li>
                <li>${t('chooseCsvUtf8Format')}</li>
                <li>${t('saveAndTryUploadingAgain')}</li>
            </ol>
        </div>
    `);
}

// ===== EDUCATIONAL YEAR MANAGEMENT FUNCTIONS =====

let educationalYears = [];
let currentEducationalYear = null;
let yearSetupStudents = [];
let yearEnrollments = [];
let yearClassBooks = [];
let yearTeacherAssignments = [];
let currentAcademicSubtab = 'overview';
let currentDataSubtab = 'backup-export';
let currentUsersSubtab = 'directory';

function setScopedSettingsSubtab(buttonSelector, panelSelector, buttonDataKey, panelDataKey, tabName) {
    const buttons = document.querySelectorAll(buttonSelector);
    const panels = document.querySelectorAll(panelSelector);

    buttons.forEach(button => {
        button.classList.toggle('active', button.dataset[buttonDataKey] === tabName);
    });

    panels.forEach(panel => {
        panel.classList.toggle('active', panel.dataset[panelDataKey] === tabName);
    });
}

function openAcademicSubtab(event, tabName = 'overview') {
    currentAcademicSubtab = tabName;
    setScopedSettingsSubtab(
        '#academic .academic-subtab-button',
        '#academic .academic-subtab-panel',
        'academicTab',
        'academicPanel',
        tabName
    );

    if (event?.currentTarget) {
        event.currentTarget.classList.add('active');
    }

    if (tabName === 'overview') {
        renderAcademicOverview();
    }
}

function openDataSubtab(event, tabName = 'backup-export') {
    currentDataSubtab = tabName;
    setScopedSettingsSubtab(
        '#data .settings-subtab-button',
        '#data .settings-subtab-panel',
        'dataTab',
        'dataPanel',
        tabName
    );

    if (event?.currentTarget) {
        event.currentTarget.classList.add('active');
    }
}

function openUsersSubtab(event, tabName = 'directory') {
    currentUsersSubtab = tabName;
    setScopedSettingsSubtab(
        '#users .settings-subtab-button',
        '#users .settings-subtab-panel',
        'usersTab',
        'usersPanel',
        tabName
    );

    if (event?.currentTarget) {
        event.currentTarget.classList.add('active');
    }
}

function renderAcademicOverview() {
    const container = document.getElementById('academicOverviewCards');
    if (!container) return;

    const coverage = getEducationalYearCoverageStatus();
    const activeYearName = currentEducationalYear ? currentEducationalYear.name : (typeof t === 'function' ? t('noActiveYearShort') : 'No active year');
    const coverageLabel = coverage.label || (typeof t === 'function' ? t('notReady') : 'Not ready');
    const setupCount = yearEnrollments.length + yearClassBooks.length + yearTeacherAssignments.length;

    const cards = [
        {
            label: typeof t === 'function' ? t('activeEducationalYearLabel') : 'Active Educational Year',
            value: activeYearName,
            note: currentEducationalYear
                ? `${normalizeEducationalYearDate(currentEducationalYear.start_date) || currentEducationalYear.start_date} to ${normalizeEducationalYearDate(currentEducationalYear.end_date) || currentEducationalYear.end_date}`
                : (typeof t === 'function' ? t('chooseActiveEducationalYearHelp') : 'Choose an active educational year to unlock year-based workflows.'),
            tone: currentEducationalYear ? 'success' : 'warning'
        },
        {
            label: typeof t === 'function' ? t('coverageStatus') : 'Coverage Status',
            value: coverageLabel,
            note: coverage.isCurrent
                ? (typeof t === 'function' ? t('coverageGood') : 'Today is covered by the active educational year.')
                : (typeof t === 'function' ? t('coverageNeedsAttention') : 'Review the active year dates before entering new academic data.'),
            tone: coverage.isCurrent ? 'success' : 'danger'
        },
        {
            label: typeof t === 'function' ? t('yearSetupWorkspace') : 'Year Setup',
            value: `${yearEnrollments.length} / ${yearClassBooks.length} / ${yearTeacherAssignments.length}`,
            note: typeof t === 'function'
                ? t('yearSetupCountsHelp')
                : 'Enrollments / class books / teacher assignments loaded for the active year.',
            tone: currentEducationalYear ? 'neutral' : 'warning'
        },
        {
            label: typeof t === 'function' ? t('setupReadiness') : 'Setup Readiness',
            value: currentEducationalYear ? `${setupCount}` : '--',
            note: currentEducationalYear
                ? (typeof t === 'function' ? t('setupItemsLoaded') : 'Total year-setup records currently loaded.')
                : (typeof t === 'function' ? t('setupNeedsActiveYear') : 'Select an active educational year to load year setup data.'),
            tone: currentEducationalYear && setupCount > 0 ? 'success' : 'neutral'
        }
    ];

    container.innerHTML = cards.map(card => `
        <div class="academic-overview-card academic-overview-${card.tone}">
            <span class="academic-overview-label">${card.label}</span>
            <strong>${card.value}</strong>
            <p>${card.note}</p>
        </div>
    `).join('');
}

function getVisibleEducationalYears() {
    return educationalYears.filter(year => !year.is_archived);
}

function getArchivedEducationalYears() {
    return educationalYears.filter(year => !!year.is_archived);
}

function normalizeEducationalYearDate(value) {
    if (!value) return null;
    if (typeof value === 'string' && value.match(/^\d{4}-\d{2}-\d{2}$/)) {
        return value;
    }

    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) {
        return null;
    }

    return `${parsed.getUTCFullYear()}-${String(parsed.getUTCMonth() + 1).padStart(2, '0')}-${String(parsed.getUTCDate()).padStart(2, '0')}`;
}

function getEducationalYearCoverageStatus(year = currentEducationalYear) {
    if (!year) {
        return { status: 'missing', label: 'No active year', isCurrent: false };
    }

    const startDate = normalizeEducationalYearDate(year.start_date);
    const endDate = normalizeEducationalYearDate(year.end_date);
    const today = new Date();
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

    if (!startDate || !endDate) {
        return { status: 'invalid', label: 'Invalid dates', isCurrent: false, startDate, endDate, todayStr };
    }

    if (todayStr < startDate) {
        return { status: 'upcoming', label: 'Upcoming', isCurrent: false, startDate, endDate, todayStr };
    }

    if (todayStr > endDate) {
        return { status: 'expired', label: 'Ended', isCurrent: false, startDate, endDate, todayStr };
    }

    return { status: 'current', label: 'Active', isCurrent: true, startDate, endDate, todayStr };
}

function getCurrentEducationalYearId() {
    return currentEducationalYear ? parseInt(currentEducationalYear.id, 10) : null;
}

function getCurrentEducationalYear() {
    return currentEducationalYear;
}

function getClassDisplayName(classItem) {
    return classItem?.name || classItem?.class_name || classItem?.className || '';
}

function getStudentRollValue(student) {
    return student?.rollNumber || student?.roll_number || student?.rollNumber || '';
}

function getStudentStatusValue(student) {
    return student?.status || 'active';
}

function getUserDisplayName(user) {
    return user?.display_name || user?.username || 'Unknown User';
}

function getStudentNameById(studentId) {
    const student = yearSetupStudents.find(item => item.id === studentId);
    return student ? student.name : studentId;
}

function syncEducationalYearSelectors(selectedValue) {
    const settingsSelector = document.getElementById('settingsEducationalYearSelector');

    if (settingsSelector && selectedValue !== undefined) {
        settingsSelector.value = selectedValue;
    }
}

function renderHeaderEducationalYearDisplay() {
    const yearText = document.getElementById('currentEducationalYearText');
    const yearTextMobile = document.getElementById('currentEducationalYearTextMobile');
    const headerYearText = document.getElementById('headerYearText');
    const targets = [yearText, yearTextMobile, headerYearText].filter(Boolean);
    if (targets.length === 0) return;

    const coverage = getEducationalYearCoverageStatus();
    const display = !currentEducationalYear
        ? 'No active year'
        : (coverage.isCurrent
            ? currentEducationalYear.name
            : `${currentEducationalYear.name} (${coverage.label})`);
    targets.forEach(el => { el.textContent = display; });
}

function populateEducationalYearSelectors() {
    const settingsSelector = document.getElementById('settingsEducationalYearSelector');
    const copySourceSelector = document.getElementById('copySourceEducationalYear');
    const activeYearId = getCurrentEducationalYearId();
    const visibleYears = getVisibleEducationalYears();

    const optionsHtml = visibleYears.map(year => `
        <option value="${year.id}" ${year.id == activeYearId ? 'selected' : ''}>${year.name}</option>
    `).join('');

    if (settingsSelector) {
        settingsSelector.innerHTML = `
            <option value="">Select educational year</option>
            ${optionsHtml}
        `;
        if (activeYearId) {
            settingsSelector.value = String(activeYearId);
        }
    }

    if (copySourceSelector) {
        const copyOptions = visibleYears
            .filter(year => year.id != activeYearId)
            .map(year => `<option value="${year.id}">${year.name}</option>`)
            .join('');

        copySourceSelector.innerHTML = `
            <option value="">Select source year</option>
            ${copyOptions}
        `;
    }

    const promotionSource = document.getElementById('promotionSourceYear');
    const promotionTarget = document.getElementById('promotionTargetYear');
    if (promotionSource) {
        promotionSource.innerHTML = '<option value="">Source year</option>' +
            visibleYears.map(y => `<option value="${y.id}">${y.name}</option>`).join('');
    }
    if (promotionTarget) {
        promotionTarget.innerHTML = '<option value="">Target year</option>' +
            visibleYears.map(y => `<option value="${y.id}">${y.name}</option>`).join('');
    }
    populatePromotionClassSelects();
}

function renderCurrentEducationalYearSummary() {
    const summary = document.getElementById('currentEducationalYearSummary');
    if (!summary) return;

    if (!currentEducationalYear) {
        summary.innerHTML = '<p class="no-data">No active educational year selected.</p>';
        return;
    }

    const coverage = getEducationalYearCoverageStatus();
    const statusClass = coverage.isCurrent ? 'text-green-600' : 'text-red-600';

    summary.innerHTML = `
        <div class="list-item">
            <div class="list-item-info">
                <strong>${currentEducationalYear.name}</strong>
                <span>
                    ${normalizeEducationalYearDate(currentEducationalYear.start_date) || currentEducationalYear.start_date}
                    to
                    ${normalizeEducationalYearDate(currentEducationalYear.end_date) || currentEducationalYear.end_date}
                    |
                    Status: <span class="${statusClass}">${coverage.label}</span>
                </span>
            </div>
        </div>
    `;
}

function showEducationalYearCoverageWarningIfNeeded() {
    const coverage = getEducationalYearCoverageStatus();
    if (coverage.isCurrent || typeof showModal !== 'function') {
        return;
    }

    const warningKey = currentEducationalYear
        ? `madaniMaktabYearWarning:${currentEducationalYear.id}:${coverage.status}`
        : 'madaniMaktabYearWarning:none';

    if (sessionStorage.getItem(warningKey) === 'shown') {
        return;
    }

    let message = 'No active educational year is selected. Create or activate an educational year before entering new data.';
    if (currentEducationalYear && coverage.status === 'expired') {
        message = `The active educational year "${currentEducationalYear.name}" ended on ${coverage.endDate}. Create or activate a new educational year covering today before entering new data.`;
    } else if (currentEducationalYear && coverage.status === 'upcoming') {
        message = `The active educational year "${currentEducationalYear.name}" starts on ${coverage.startDate}. Create or activate an educational year covering today before entering new data.`;
    } else if (currentEducationalYear && coverage.status === 'invalid') {
        message = `The active educational year "${currentEducationalYear.name}" has invalid dates. Fix its date range before entering new data.`;
    }

    sessionStorage.setItem(warningKey, 'shown');
    showModal('Warning', message);
}

async function loadCurrentEducationalYear() {
    try {
        const response = await fetch('/api/educational-years/current', {
            credentials: 'include'
        });

        if (response.ok) {
            currentEducationalYear = await response.json();
        } else {
            currentEducationalYear = educationalYears.find(year => year.is_active) || null;
        }
    } catch (error) {
        console.error('❌ Error loading current educational year:', error);
        currentEducationalYear = educationalYears.find(year => year.is_active) || null;
    }

    window.currentEducationalYear = currentEducationalYear;

    // Keep academic year start date in sync: use active educational year start when available
    if (currentEducationalYear && currentEducationalYear.start_date) {
        window.academicYearStartDate = normalizeEducationalYearDate(currentEducationalYear.start_date);
    } else {
        // No active year: leave window.academicYearStartDate as set by initializeAcademicYearStart (legacy setting)
        // So calendar and date restrictions use legacy value when no educational year is active
    }

    populateEducationalYearSelectors();
    renderCurrentEducationalYearSummary();
    renderHeaderEducationalYearDisplay();
    renderAcademicOverview();
    showEducationalYearCoverageWarningIfNeeded();
    syncEducationalYearSelectors(currentEducationalYear ? String(currentEducationalYear.id) : '');
    updateDateRestrictions();
    if (typeof displayAcademicYearStart === 'function') {
        displayAcademicYearStart();
    }
    return currentEducationalYear;
}

async function ensureYearSetupMasterDataLoaded() {
    try {
        if (!window.classes || window.classes.length === 0) {
            await refreshClasses();
        }
    } catch (error) {
        console.error('❌ Error ensuring classes are loaded:', error);
    }

    try {
        if (!books || books.length === 0) {
            await loadBooks();
        }
    } catch (error) {
        console.error('❌ Error ensuring books are loaded:', error);
    }

    try {
        if (!allUsers || allUsers.length === 0) {
            const usersResponse = await fetch('/api/users', {
                credentials: 'include'
            });
            if (usersResponse.ok) {
                allUsers = await usersResponse.json();
            }
        }
    } catch (error) {
        console.error('❌ Error ensuring users are loaded:', error);
    }

    try {
        if (!yearSetupStudents || yearSetupStudents.length === 0) {
            const response = await fetch('/api/students?scope=master', {
                credentials: 'include'
            });
            if (response.ok) {
                yearSetupStudents = await response.json();
            }
        }
    } catch (error) {
        console.error('❌ Error ensuring students are loaded for year setup:', error);
    }

    populateYearSetupDropdowns();
}

function populateYearSetupDropdowns() {
    const studentSelect = document.getElementById('yearEnrollmentStudent');
    const classSelectIds = ['yearEnrollmentClass', 'yearClassBookClass', 'yearTeacherClass'];
    const bookSelect = document.getElementById('yearClassBookBook');
    const userSelect = document.getElementById('yearTeacherUser');

    if (studentSelect) {
        studentSelect.innerHTML = `
            <option value="">Select student</option>
            ${yearSetupStudents.map(student => `
                <option value="${student.id}">
                    ${student.name} (${student.id}${getStudentRollValue(student) ? ` | Roll: ${getStudentRollValue(student)}` : ''})
                </option>
            `).join('')}
        `;
    }

    const classOptions = (window.classes || []).map(cls => {
        const className = getClassDisplayName(cls);
        return `<option value="${className}">${className}</option>`;
    }).join('');

    classSelectIds.forEach(id => {
        const select = document.getElementById(id);
        if (select) {
            const placeholder = select.options[0] ? select.options[0].textContent : 'Select class';
            select.innerHTML = `<option value="">${placeholder}</option>${classOptions}`;
        }
    });

    if (bookSelect) {
        bookSelect.innerHTML = `
            <option value="">Select book</option>
            ${(books || []).map(book => `
                <option value="${book.id}">${book.book_name}</option>
            `).join('')}
        `;
    }

    if (userSelect) {
        const eligibleUsers = (allUsers || []).filter(user => user.is_active !== false);
        userSelect.innerHTML = `
            <option value="">Select teacher/user</option>
            ${eligibleUsers.map(user => `
                <option value="${user.id}">${getUserDisplayName(user)} (${user.username})</option>
            `).join('')}
        `;
    }
}

function getEducationalYearNameById(yearId) {
    const year = educationalYears.find(item => String(item.id) === String(yearId));
    return year ? year.name : `ID ${yearId}`;
}

function formatYearOperationCounts(counts = {}) {
    const labels = {
        enrollments: typeof t === 'function' ? t('yearSetupEnrollmentsLabel') : 'Enrollments',
        class_books: typeof t === 'function' ? t('yearSetupClassBooksLabel') : 'Class books',
        teacher_assignments: typeof t === 'function' ? t('yearSetupTeacherAssignmentsLabel') : 'Teacher assignments',
        attendance: typeof t === 'function' ? t('attendanceDataCategory') : 'Attendance',
        education_progress_history: typeof t === 'function' ? t('educationProgressHistoryLabel') : 'Education progress history',
        education_progress: typeof t === 'function' ? t('educationProgressLabel') : 'Education progress',
        score_change_history: typeof t === 'function' ? t('scoreChangeHistoryLabel') : 'Score change history',
        teacher_logs: typeof t === 'function' ? t('teacherLogsLabel') : 'Teacher logs',
        exam_results: typeof t === 'function' ? t('examResultsLabel') : 'Exam results',
        exam_sessions: typeof t === 'function' ? t('examSessionsLabel') : 'Exam sessions',
        promotion_history: typeof t === 'function' ? t('promotionHistoryLabel') : 'Promotion history'
    };

    return Object.entries(labels)
        .map(([key, label]) => `${label}: ${counts[key] || 0}`)
        .join('\n');
}

function buildCopySetupWarningMessage(preflight) {
    const sourceName = preflight?.source_year?.name || 'Unknown';
    const targetName = preflight?.target_year?.name || 'Unknown';
    const intro = typeof t === 'function'
        ? t('copySetupWarningIntro').replace('{source}', sourceName).replace('{target}', targetName)
        : `You are copying setup from "${sourceName}" into "${targetName}".`;
    const countsLabel = typeof t === 'function' ? t('targetYearCurrentData') : 'Target year currently contains:';
    const phraseLabel = typeof t === 'function' ? t('typeConfirmationPhrase') : 'Type this confirmation phrase exactly to continue:';

    return `${intro}\n\n${countsLabel}\n${formatYearOperationCounts(preflight?.target_setup_counts || {})}\n\n${phraseLabel}\n${preflight?.confirmation_phrase || ''}`;
}

function buildPurgePreviewMessage(preview) {
    const yearName = preview?.year?.name || 'Unknown';
    const intro = typeof t === 'function'
        ? t('purgeSampleYearWarningIntro').replace('{name}', yearName)
        : `You are about to purge year-scoped data for "${yearName}".`;
    const countsLabel = typeof t === 'function' ? t('purgeWillRemoveCounts') : 'This purge will remove:';
    const phraseLabel = typeof t === 'function' ? t('typeConfirmationPhrase') : 'Type this confirmation phrase exactly to continue:';

    return `${intro}\n\n${countsLabel}\n${formatYearOperationCounts(preview?.counts || {})}\n\n${phraseLabel}\n${preview?.confirmation_phrase || ''}`;
}

function buildPurgeResultMessage(summary = {}) {
    const deletedCounts = formatYearOperationCounts(summary.deleted_counts || {});
    const outcome = summary.year_deleted
        ? (typeof t === 'function' ? t('purgeDeletedYearRecord') : 'The year record was hard-deleted because it became empty.')
        : (typeof t === 'function' ? t('purgeArchivedYearRecord') : 'The year record was archived because it could not be hard-deleted safely.');

    return `${summary.message || ''}\n\n${typeof t === 'function' ? t('purgeRemovedCounts') : 'Removed records:'}\n${deletedCounts}\n\n${outcome}`;
}

function escapeYearModalHtml(value) {
    return String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

async function copyTextToClipboard(text) {
    if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
        return true;
    }

    const tempInput = document.createElement('textarea');
    tempInput.value = text;
    tempInput.setAttribute('readonly', 'readonly');
    tempInput.style.position = 'absolute';
    tempInput.style.left = '-9999px';
    document.body.appendChild(tempInput);
    tempInput.select();
    const copied = document.execCommand('copy');
    document.body.removeChild(tempInput);
    return copied;
}

function requestTypedYearConfirmation({ title, detailsText, confirmationPhrase, confirmLabel }) {
    return new Promise((resolve) => {
        const modal = document.getElementById('modal');
        const closeButton = modal?.querySelector('.close');
        const safeTitle = escapeYearModalHtml(title);
        const safeDetails = escapeYearModalHtml(detailsText);
        const safePhrase = escapeYearModalHtml(confirmationPhrase);
        const safeConfirmLabel = escapeYearModalHtml(confirmLabel);
        let settled = false;

        const cleanup = () => {
            if (closeButton) {
                closeButton.removeEventListener('click', handleClose);
            }
            copyButton?.removeEventListener('click', handleCopy);
            cancelButton?.removeEventListener('click', handleCancel);
            confirmButton?.removeEventListener('click', handleConfirm);
            typedInput?.removeEventListener('input', handleInput);
        };

        const settle = (value) => {
            if (settled) {
                return;
            }
            settled = true;
            cleanup();
            resolve(value);
        };

        const handleClose = () => settle(null);
        const handleCancel = () => {
            closeModal();
            settle(null);
        };
        const handleConfirm = () => {
            closeModal();
            settle(typedInput.value.trim());
        };
        const handleInput = () => {
            const matches = typedInput.value.trim() === confirmationPhrase;
            confirmButton.disabled = !matches;
            statusText.textContent = matches
                ? (typeof t === 'function' ? t('confirmationPhraseMatches') : 'Confirmation phrase matches.')
                : (typeof t === 'function' ? t('pasteConfirmationPhraseHelp') : 'Paste or type the confirmation phrase exactly to enable continue.');
            statusText.style.color = matches ? '#1a7f37' : '#6b7280';
        };
        const handleCopy = async () => {
            try {
                const copied = await copyTextToClipboard(confirmationPhrase);
                if (copied) {
                    statusText.textContent = typeof t === 'function' ? t('confirmationPhraseCopied') : 'Confirmation phrase copied.';
                    statusText.style.color = '#1d4ed8';
                }
            } catch (error) {
                console.error('Failed to copy confirmation phrase:', error);
                statusText.textContent = typeof t === 'function' ? t('confirmationPhraseCopyFailed') : 'Could not copy automatically. Please select the phrase manually.';
                statusText.style.color = '#b45309';
            }
        };

        showModal('', `
            <div class="year-confirmation-modal" style="text-align: left;">
                <h3 style="margin-top: 0; margin-bottom: 14px;">${safeTitle}</h3>
                <div style="background: #f8fafc; border: 1px solid #dbe4f0; border-radius: 8px; padding: 14px; white-space: pre-line; line-height: 1.6; color: #334155; margin-bottom: 14px;">${safeDetails}</div>
                <label for="yearOperationConfirmationPhrase" style="display: block; font-weight: 600; margin-bottom: 8px;">${typeof t === 'function' ? escapeYearModalHtml(t('copyThisPhrase')) : 'Copy this phrase'}</label>
                <div style="display: flex; gap: 8px; align-items: stretch; margin-bottom: 14px; flex-wrap: wrap;">
                    <textarea id="yearOperationConfirmationPhrase" readonly style="flex: 1; min-height: 70px; resize: vertical; padding: 10px; border: 1px solid #cbd5e1; border-radius: 6px; font-family: monospace; background: #ffffff;">${safePhrase}</textarea>
                    <button id="yearOperationCopyPhraseBtn" class="btn btn-secondary" type="button" style="align-self: flex-start;">
                        <i class="fas fa-copy"></i> ${typeof t === 'function' ? escapeYearModalHtml(t('copy')) : 'Copy'}
                    </button>
                </div>
                <label for="yearOperationTypedInput" style="display: block; font-weight: 600; margin-bottom: 8px;">${typeof t === 'function' ? escapeYearModalHtml(t('pasteConfirmationPhrase')) : 'Paste the confirmation phrase here'}</label>
                <input id="yearOperationTypedInput" type="text" autocomplete="off" spellcheck="false" style="width: 100%; margin-bottom: 10px;" placeholder="${typeof t === 'function' ? escapeYearModalHtml(t('pasteConfirmationPhrasePlaceholder')) : 'Paste the phrase exactly as shown'}">
                <p id="yearOperationConfirmationStatus" style="margin: 0 0 16px; font-size: 0.92em; color: #6b7280;">${typeof t === 'function' ? escapeYearModalHtml(t('pasteConfirmationPhraseHelp')) : 'Paste or type the confirmation phrase exactly to enable continue.'}</p>
                <div class="modal-buttons">
                    <button id="yearOperationConfirmBtn" class="btn btn-danger" type="button" disabled>${safeConfirmLabel}</button>
                    <button id="yearOperationCancelBtn" class="btn btn-secondary" type="button">${typeof t === 'function' ? escapeYearModalHtml(t('cancel')) : 'Cancel'}</button>
                </div>
            </div>
        `, true);

        const typedInput = document.getElementById('yearOperationTypedInput');
        const copyButton = document.getElementById('yearOperationCopyPhraseBtn');
        const cancelButton = document.getElementById('yearOperationCancelBtn');
        const confirmButton = document.getElementById('yearOperationConfirmBtn');
        const statusText = document.getElementById('yearOperationConfirmationStatus');

        if (!modal || !closeButton || !typedInput || !copyButton || !cancelButton || !confirmButton || !statusText) {
            closeModal();
            settle(null);
            return;
        }

        closeButton.addEventListener('click', handleClose);
        copyButton.addEventListener('click', handleCopy);
        cancelButton.addEventListener('click', handleCancel);
        confirmButton.addEventListener('click', handleConfirm);
        typedInput.addEventListener('input', handleInput);
        typedInput.focus();
    });
}

async function loadEducationalYears() {
    try {
        console.log('🔄 Loading educational years...');
        const response = await fetch('/api/educational-years?include_archived=true', {
            credentials: 'include'
        });
        
        if (response.ok) {
            educationalYears = await response.json();
            console.log('✅ Educational years loaded successfully:', educationalYears.length);
            await loadCurrentEducationalYear();
            displayEducationalYears();
            await ensureYearSetupMasterDataLoaded();
            await loadYearSetupData();
        } else {
            const error = await response.json();
            console.error('❌ Failed to load educational years:', error);
            showModal('Error', error.error || 'Failed to load educational years');
        }
    } catch (error) {
        console.error('❌ Error loading educational years:', error);
        showModal('Error', 'Failed to load educational years');
    }
}

function displayEducationalYears() {
    const educationalYearsList = document.getElementById('educationalYearsList');
    if (!educationalYearsList) return;

    const visibleYears = getVisibleEducationalYears();
    const archivedYears = getArchivedEducationalYears();

    if ((!visibleYears || visibleYears.length === 0) && (!archivedYears || archivedYears.length === 0)) {
        educationalYearsList.innerHTML = '<p class="no-data">No educational years added yet. Add your first educational year above.</p>';
        return;
    }

    const renderYearCard = (year, { archived = false } = {}) => {
        const statusClass = archived
            ? 'text-gray-500'
            : (year.is_active ? 'text-green-600' : 'text-gray-500');
        const statusText = archived
            ? (typeof t === 'function' ? t('archivedEducationalYears') : 'Archived')
            : (year.is_active
                ? (typeof t === 'function' ? t('educationalYearActive') : 'Active')
                : (typeof t === 'function' ? t('educationalYearInactive') : 'Inactive'));
        
        return `
            <div class="list-item">
                <div class="list-item-info">
                    <strong>${year.name}</strong>
                    <span class="educational-year-details">
                        ${year.start_date} to ${year.end_date} | 
                        Status: <span class="${statusClass}">${statusText}</span>
                    </span>
                </div>
                <div class="list-item-actions">
                    ${(!archived && !year.is_active) ? `
                        <button onclick="setEducationalYearAsActive(${year.id})" class="btn btn-primary btn-small" title="${typeof t === 'function' ? t('setActiveEducationalYear') : 'Set Active Educational Year'}">
                            <i class="fas fa-check-circle"></i>
                        </button>
                    ` : ''}
                    <button onclick="editEducationalYear(${year.id})" class="btn btn-secondary btn-small" title="${typeof t === 'function' ? t('editEducationalYear') : 'Edit Educational Year'}">
                        <i class="fas fa-edit"></i>
                    </button>
                    ${!year.is_active ? `
                        <button onclick="purgeSampleEducationalYear(${year.id})" class="btn btn-danger btn-small" title="${typeof t === 'function' ? t('purgeSampleYear') : 'Purge Sample Year'}">
                            <i class="fas fa-broom"></i>
                        </button>
                    ` : ''}
                    ${!archived ? `
                        <button onclick="deleteEducationalYear(${year.id})" class="btn btn-danger btn-small" title="${typeof t === 'function' ? t('archiveEducationalYear') : 'Archive Educational Year'}">
                            <i class="fas fa-trash"></i>
                        </button>
                    ` : ''}
                </div>
            </div>
        `;
    };

    const activeSectionHtml = `
        <div class="settings-subsection">
            <h4>${typeof t === 'function' ? t('currentEducationalYears') : 'Current Educational Years'}</h4>
            ${visibleYears.length > 0
                ? visibleYears.map(year => renderYearCard(year)).join('')
                : `<p class="no-data">${typeof t === 'function' ? t('noCurrentEducationalYears') : 'No active or inactive educational years available.'}</p>`}
        </div>
    `;

    const archivedSectionHtml = `
        <div class="settings-subsection" style="margin-top: 20px;">
            <h4>${typeof t === 'function' ? t('archivedEducationalYears') : 'Archived Educational Years'}</h4>
            <p class="help-text">${typeof t === 'function' ? t('archivedEducationalYearsHelp') : 'Archived years stay hidden from normal selectors, but you can still rename them here to free up an old name for reuse.'}</p>
            ${archivedYears.length > 0
                ? archivedYears.map(year => renderYearCard(year, { archived: true })).join('')
                : `<p class="no-data">${typeof t === 'function' ? t('noArchivedEducationalYears') : 'No archived educational years.'}</p>`}
        </div>
    `;

    educationalYearsList.innerHTML = activeSectionHtml + archivedSectionHtml;
}

async function createEducationalYear() {
    const name = document.getElementById('newEducationalYearName').value.trim();
    const startDate = document.getElementById('newEducationalYearStartDate').value;
    const endDate = document.getElementById('newEducationalYearEndDate').value;
    
    if (!name || !startDate || !endDate) {
        showModal(t('error'), t('pleaseFillAllFields'));
        return;
    }
    
    if (startDate >= endDate) {
        showModal(t('error'), t('startDateMustBeBeforeEndDate'));
        return;
    }
    
    try {
        const response = await fetch('/api/educational-years', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                name: name,
                start_date: startDate,
                end_date: endDate,
                is_active: true
            })
        });
        
        const result = await response.json();
        if (response.ok) {
            showModal(t('success'), t('educationalYearCreated'));
            // Clear form
            document.getElementById('newEducationalYearName').value = '';
            document.getElementById('newEducationalYearStartDate').value = '';
            document.getElementById('newEducationalYearEndDate').value = '';
            // Reload educational years
            await loadEducationalYears();
            if (result.educational_year_id) {
                syncEducationalYearSelectors(String(result.educational_year_id));
            }
        } else {
            showModal(t('error'), result.error || t('failedToCreateEducationalYear'));
        }
    } catch (error) {
        console.error('Error creating educational year:', error);
        showModal(t('error'), t('failedToCreateEducationalYear'));
    }
}

function editEducationalYear(educationalYearId) {
    const year = educationalYears.find(y => y.id === educationalYearId);
    if (!year) {
        showModal(t('error'), t('educationalYearNotFound'));
        return;
    }
    
    const newNameInput = prompt(t('editEducationalYear'), year.name);
    if (newNameInput === null) {
        return;
    }

    const newName = newNameInput.trim();
    if (!newName) {
        showModal(t('error'), t('educationalYearNameCannotBeEmpty'));
        return;
    }
    
    const currentStartDate = normalizeEducationalYearDate(year.start_date);
    const currentEndDate = normalizeEducationalYearDate(year.end_date);

    if (!currentStartDate || !currentEndDate) {
        showModal(t('error'), t('educationalYearDatesCouldNotBeParsed'));
        return;
    }

    const newStartDateInput = prompt(t('educationalYearStartDate'), currentStartDate);
    if (newStartDateInput === null) {
        return;
    }

    const newStartDate = newStartDateInput.trim();
    if (!newStartDate) {
        showModal(t('error'), t('startDateCannotBeEmpty'));
        return;
    }
    
    const newEndDateInput = prompt(t('educationalYearEndDate'), currentEndDate);
    if (newEndDateInput === null) {
        return;
    }

    const newEndDate = newEndDateInput.trim();
    if (!newEndDate) {
        showModal(t('error'), t('endDateCannotBeEmpty'));
        return;
    }

    const hasChanges =
        newName !== year.name ||
        newStartDate !== currentStartDate ||
        newEndDate !== currentEndDate;

    if (!hasChanges) {
        showModal(t('info'), t('noEducationalYearChangesDetected'));
        return;
    }
    
    let isActive = !!year.is_active;
    if (!year.is_archived) {
        const isCurrentlyActive = !!year.is_active;
        isActive = confirm(
            `${t('shouldEducationalYearBeActive')}\n\n` +
            `${t('currentStatus')} ${isCurrentlyActive ? t('educationalYearActive') : t('educationalYearInactive')}\n` +
            `${t('clickOkForActiveCancelForInactive')}`
        );
    }
    
    updateEducationalYear(educationalYearId, newName, newStartDate, newEndDate, isActive);
}

async function updateEducationalYear(educationalYearId, name, startDate, endDate, isActive) {
    try {
        if (!name || !startDate || !endDate) {
            showModal(t('error'), t('educationalYearRequiredFields'));
            return;
        }

        if (startDate >= endDate) {
            showModal(t('error'), t('startDateMustBeBeforeEndDate'));
            return;
        }

        const response = await fetch(`/api/educational-years/${educationalYearId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify({
                name: name,
                start_date: startDate,
                end_date: endDate,
                is_active: isActive
            })
        });
        
        const result = await response.json();
        if (response.ok) {
            showModal(t('success'), t('educationalYearUpdated'));
            await loadEducationalYears();
        } else {
            showModal(t('error'), result.error || t('failedToUpdateEducationalYear'));
        }
    } catch (error) {
        console.error('Error updating educational year:', error);
        showModal(t('error'), t('failedToUpdateEducationalYear'));
    }
}

async function setEducationalYearAsActive(educationalYearId) {
    const year = educationalYears.find(y => y.id === educationalYearId);
    if (!year) {
        showModal(t('error'), t('educationalYearNotFound'));
        return;
    }

    try {
        const response = await fetch('/api/educational-years/current', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify({
                educational_year_id: educationalYearId
            })
        });

        const result = await response.json();
        if (response.ok) {
            showModal(t('success'), t('activeEducationalYearChanged').replace('{name}', year.name));
            setTimeout(() => window.location.reload(), 700);
        } else {
            showModal(t('error'), result.error || t('failedToSetActiveEducationalYear'));
        }
    } catch (error) {
        console.error('Error setting active educational year:', error);
        showModal(t('error'), t('failedToSetActiveEducationalYear'));
    }
}

async function deleteEducationalYear(educationalYearId) {
    const year = educationalYears.find(y => y.id === educationalYearId);
    const name = year ? year.name : `ID ${educationalYearId}`;
    const confirmMsg = typeof t === 'function' ? t('confirmArchiveEducationalYear').replace('{name}', name) : `Are you sure you want to archive the educational year "${name}"? It will be hidden from the list but data is kept.`;
    if (!confirm(confirmMsg)) {
        return;
    }
    try {
        const response = await fetch(`/api/educational-years/${educationalYearId}`, {
            method: 'DELETE'
        });
        const result = await response.json();
        if (response.ok) {
            showModal(t('success'), t('educationalYearArchived'));
            await loadEducationalYears();
        } else {
            showModal(t('error'), result.error || t('failedToArchiveEducationalYear'));
        }
    } catch (error) {
        console.error('Error archiving educational year:', error);
        showModal(t('error'), t('failedToArchiveEducationalYear'));
    }
}

async function purgeSampleEducationalYear(educationalYearId) {
    const year = educationalYears.find(y => y.id === educationalYearId);
    if (!year) {
        showModal(t('error'), t('educationalYearNotFound'));
        return;
    }

    try {
        const previewResponse = await fetch(`/api/educational-years/${educationalYearId}/purge`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ preview_only: true })
        });
        const previewResult = await previewResponse.json();
        if (!previewResponse.ok) {
            showModal(t('error'), previewResult.error || t('failedToPurgeSampleYear'));
            return;
        }

        const preview = previewResult.preview || {};
        const confirmationText = await requestTypedYearConfirmation({
            title: typeof t === 'function' ? t('purgeSampleYear') : 'Purge Sample Year',
            detailsText: buildPurgePreviewMessage(preview),
            confirmationPhrase: preview.confirmation_phrase,
            confirmLabel: typeof t === 'function' ? t('purgeSampleYear') : 'Purge Sample Year'
        });
        if (confirmationText === null) {
            return;
        }
        if (confirmationText !== preview.confirmation_phrase) {
            showModal(t('error'), t('confirmationTextMismatch'));
            return;
        }

        const response = await fetch(`/api/educational-years/${educationalYearId}/purge`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ confirmation_text: confirmationText })
        });
        const result = await response.json();
        if (response.ok) {
            showModal(t('success'), buildPurgeResultMessage(result.summary || {}));
            await loadEducationalYears();
        } else {
            showModal(t('error'), result.error || t('failedToPurgeSampleYear'));
        }
    } catch (error) {
        console.error('Error purging sample educational year:', error);
        showModal(t('error'), t('failedToPurgeSampleYear'));
    }
}

function handleEducationalYearSelectionChange() {
    const settingsSelector = document.getElementById('settingsEducationalYearSelector');
    const selectedValue = settingsSelector?.value;

    if (selectedValue) {
        syncEducationalYearSelectors(selectedValue);
    }
}

async function applySelectedEducationalYear() {
    const settingsSelector = document.getElementById('settingsEducationalYearSelector');
    const selectedValue = settingsSelector?.value;

    if (!selectedValue) {
        showModal(t('error'), t('selectEducationalYear'));
        return;
    }

    if (currentEducationalYear && String(currentEducationalYear.id) === String(selectedValue)) {
        showModal(t('info'), t('educationalYearAlreadyActive'));
        return;
    }

    await setEducationalYearAsActive(parseInt(selectedValue, 10));
}

async function loadYearSetupData() {
    const activeYearId = getCurrentEducationalYearId();

    if (!activeYearId) {
        yearEnrollments = [];
        yearClassBooks = [];
        yearTeacherAssignments = [];
        renderYearSetupLists();
        renderAcademicOverview();
        return;
    }

    try {
        const [enrollmentsResponse, classBooksResponse, teacherAssignmentsResponse] = await Promise.all([
            fetch(`/api/educational-years/${activeYearId}/enrollments`, { credentials: 'include' }),
            fetch(`/api/educational-years/${activeYearId}/class-books`, { credentials: 'include' }),
            fetch(`/api/educational-years/${activeYearId}/teacher-assignments`, { credentials: 'include' })
        ]);

        yearEnrollments = enrollmentsResponse.ok ? await enrollmentsResponse.json() : [];
        yearClassBooks = classBooksResponse.ok ? await classBooksResponse.json() : [];
        yearTeacherAssignments = teacherAssignmentsResponse.ok ? await teacherAssignmentsResponse.json() : [];
        renderYearSetupLists();
        renderAcademicOverview();
    } catch (error) {
        console.error('❌ Error loading year setup data:', error);
        yearEnrollments = [];
        yearClassBooks = [];
        yearTeacherAssignments = [];
        renderYearSetupLists();
        renderAcademicOverview();
    }
}

function renderYearSetupLists() {
    renderYearEnrollments();
    renderYearClassBooks();
    renderYearTeacherAssignments();
}

function renderYearEnrollments() {
    const container = document.getElementById('yearEnrollmentsList');
    if (!container) return;

    if (!currentEducationalYear) {
        container.innerHTML = '<p class="no-data">Select or create an active educational year to manage enrollments.</p>';
        return;
    }

    if (!yearEnrollments || yearEnrollments.length === 0) {
        container.innerHTML = '<p class="no-data">No student enrollments added for this year yet.</p>';
        return;
    }

    container.innerHTML = yearEnrollments.map(enrollment => `
        <div class="list-item">
            <div class="list-item-info">
                <strong>${enrollment.name || getStudentNameById(enrollment.student_id)}</strong>
                <span>
                    Class: ${enrollment.class_name} |
                    Roll: ${enrollment.roll_number || 'N/A'} |
                    Status: ${enrollment.status || 'active'}
                </span>
            </div>
            <div class="list-item-actions">
                <button onclick="deleteYearEnrollment(${enrollment.id})" class="btn btn-danger btn-small" title="Delete Enrollment For This Year">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        </div>
    `).join('');
}

function renderYearClassBooks() {
    const container = document.getElementById('yearClassBooksList');
    if (!container) return;

    if (!currentEducationalYear) {
        container.innerHTML = '<p class="no-data">Select or create an active educational year to manage class books.</p>';
        return;
    }

    if (!yearClassBooks || yearClassBooks.length === 0) {
        container.innerHTML = '<p class="no-data">No class-book mappings added for this year yet.</p>';
        return;
    }

    container.innerHTML = yearClassBooks.map(item => `
        <div class="list-item">
            <div class="list-item-info">
                <strong>${item.book_name}</strong>
                <span>
                    Class: ${item.class_name} |
                    Order: ${item.display_order || 0}
                </span>
            </div>
            <div class="list-item-actions">
                <button onclick="deleteYearClassBook(${item.id})" class="btn btn-danger btn-small" title="Delete Book Link For This Year">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        </div>
    `).join('');
}

function renderYearTeacherAssignments() {
    const container = document.getElementById('yearTeacherAssignmentsList');
    if (!container) return;

    if (!currentEducationalYear) {
        container.innerHTML = '<p class="no-data">Select or create an active educational year to manage teacher assignments.</p>';
        return;
    }

    if (!yearTeacherAssignments || yearTeacherAssignments.length === 0) {
        container.innerHTML = '<p class="no-data">No teacher assignments added for this year yet.</p>';
        return;
    }

    container.innerHTML = yearTeacherAssignments.map(item => `
        <div class="list-item">
            <div class="list-item-info">
                <strong>${item.display_name || item.username}</strong>
                <span>
                    Class: ${item.class_name} |
                    User: ${item.username}
                </span>
            </div>
            <div class="list-item-actions">
                <button onclick="deleteYearTeacherAssignment(${item.id})" class="btn btn-danger btn-small" title="Delete Assignment For This Year">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        </div>
    `).join('');
}

// ============================================================
// Roll Assignment Manager
// ============================================================
let rollAssignmentEnrollments = [];

async function loadRollAssignmentTable() {
    const activeYearId = getCurrentEducationalYearId();
    if (!activeYearId) {
        showModal(typeof t === 'function' ? t('error') : 'Error',
            typeof t === 'function' ? t('noActiveYearSelected') : 'No active educational year selected.');
        return;
    }
    const classFilter = document.getElementById('rollAssignmentClassFilter')?.value || '';
    const container = document.getElementById('rollAssignmentContainer');
    const empty = document.getElementById('rollAssignmentEmpty');
    const tbody = document.getElementById('rollAssignmentBody');
    if (!tbody) return;

    // Populate class filter dropdown from window.classes
    const classFilterEl = document.getElementById('rollAssignmentClassFilter');
    if (classFilterEl && window.classes && classFilterEl.options.length <= 1) {
        window.classes.forEach(cls => {
            const opt = document.createElement('option');
            opt.value = cls.name;
            opt.textContent = cls.name;
            classFilterEl.appendChild(opt);
        });
        classFilterEl.value = classFilter;
    }

    try {
        let url = `/api/educational-years/${activeYearId}/enrollments`;
        if (classFilter) url += `?class_name=${encodeURIComponent(classFilter)}`;
        const res = await fetch(url, { credentials: 'include' });
        if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || 'Failed to load');
        rollAssignmentEnrollments = await res.json();

        if (!rollAssignmentEnrollments.length) {
            if (container) container.style.display = 'none';
            if (empty) empty.style.display = 'block';
            return;
        }
        if (empty) empty.style.display = 'none';
        if (container) container.style.display = 'block';

        tbody.innerHTML = rollAssignmentEnrollments.map((e, idx) => `
            <tr data-enrollment-id="${e.id}">
                <td>${(e.student_name || e.student_id || '').replace(/</g, '&lt;')}</td>
                <td>${(e.class_name || '').replace(/</g, '&lt;')}</td>
                <td>
                    <input type="text" class="roll-input" value="${(e.roll_number || '').toString().replace(/"/g, '&quot;')}"
                        style="width: 90px; padding: 3px 6px;"
                        onkeydown="if(event.key==='Enter') saveRollAssignment(${e.id}, this)">
                </td>
                <td><span class="status-badge status-${e.status || 'active'}">${e.status || 'active'}</span></td>
                <td>
                    <button class="btn btn-primary btn-small" onclick="saveRollAssignment(${e.id}, this.closest('tr').querySelector('.roll-input'))">
                        <i class="fas fa-check"></i> ${typeof t === 'function' ? t('save') : 'Save'}
                    </button>
                </td>
            </tr>
        `).join('');
    } catch (err) {
        showModal(typeof t === 'function' ? t('error') : 'Error', err.message || 'Failed to load enrollments');
    }
}

async function saveRollAssignment(enrollmentId, inputEl) {
    if (!inputEl) return;
    const newRoll = inputEl.value.trim();
    if (!newRoll) {
        showModal(typeof t === 'function' ? t('error') : 'Error',
            typeof t === 'function' ? t('rollNumberRequired') : 'Roll number cannot be empty.');
        return;
    }
    try {
        const res = await fetch(`/api/enrollments/${enrollmentId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ roll_number: newRoll })
        });
        const result = await res.json();
        if (res.ok) {
            // Briefly highlight the row green
            const row = inputEl.closest('tr');
            if (row) { row.style.background = '#d1fae5'; setTimeout(() => row.style.background = '', 1500); }
        } else if (res.status === 409) {
            showModal(typeof t === 'function' ? t('error') : 'Error', result.error);
        } else {
            showModal(typeof t === 'function' ? t('error') : 'Error', result.error || 'Failed to save roll');
        }
    } catch (err) {
        showModal(typeof t === 'function' ? t('error') : 'Error', 'Network error');
    }
}

async function saveYearEnrollment() {
    const activeYearId = getCurrentEducationalYearId();
    const studentId = document.getElementById('yearEnrollmentStudent')?.value;
    const className = document.getElementById('yearEnrollmentClass')?.value;
    const rollNumber = document.getElementById('yearEnrollmentRoll')?.value.trim();
    const status = document.getElementById('yearEnrollmentStatus')?.value || 'active';

    if (!activeYearId) {
        showModal('Error', 'Please set an active educational year first');
        return;
    }
    if (!studentId || !className) {
        showModal('Error', 'Please select both student and class');
        return;
    }

    try {
        const response = await fetch(`/api/educational-years/${activeYearId}/enrollments`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({
                student_id: studentId,
                class_name: className,
                roll_number: rollNumber || null,
                status
            })
        });
        const result = await response.json();
        if (response.ok) {
            showModal('Success', 'Student enrollment saved successfully');
            await loadYearSetupData();
        } else {
            showModal('Error', result.error || 'Failed to save student enrollment');
        }
    } catch (error) {
        console.error('❌ Error saving year enrollment:', error);
        showModal('Error', 'Failed to save student enrollment');
    }
}

async function deleteYearEnrollment(enrollmentId) {
    if (!confirm('Delete this enrollment only for the active educational year?')) {
        return;
    }

    try {
        const response = await fetch(`/api/enrollments/${enrollmentId}`, {
            method: 'DELETE',
            credentials: 'include'
        });
        const result = await response.json();
        if (response.ok) {
            showModal('Success', 'Enrollment deleted successfully');
            await loadYearSetupData();
        } else {
            showModal('Error', result.error || 'Failed to delete enrollment');
        }
    } catch (error) {
        console.error('❌ Error deleting year enrollment:', error);
        showModal('Error', 'Failed to delete enrollment');
    }
}

async function saveYearClassBook() {
    const activeYearId = getCurrentEducationalYearId();
    const className = document.getElementById('yearClassBookClass')?.value;
    const bookId = document.getElementById('yearClassBookBook')?.value;
    const displayOrder = document.getElementById('yearClassBookOrder')?.value || '0';

    if (!activeYearId) {
        showModal('Error', 'Please set an active educational year first');
        return;
    }
    if (!className || !bookId) {
        showModal('Error', 'Please select both class and book');
        return;
    }

    try {
        const response = await fetch(`/api/educational-years/${activeYearId}/class-books`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({
                class_name: className,
                book_id: parseInt(bookId, 10),
                display_order: parseInt(displayOrder, 10) || 0
            })
        });
        const result = await response.json();
        if (response.ok) {
            showModal('Success', 'Class book saved successfully');
            await loadYearSetupData();
        } else {
            showModal('Error', result.error || 'Failed to save class book');
        }
    } catch (error) {
        console.error('❌ Error saving year class book:', error);
        showModal('Error', 'Failed to save class book');
    }
}

async function deleteYearClassBook(classBookId) {
    if (!confirm('Delete this class-book link only for the active educational year?')) {
        return;
    }

    try {
        const response = await fetch(`/api/class-books/${classBookId}`, {
            method: 'DELETE',
            credentials: 'include'
        });
        const result = await response.json();
        if (response.ok) {
            showModal('Success', 'Class book mapping deleted successfully');
            await loadYearSetupData();
        } else {
            showModal('Error', result.error || 'Failed to delete class book mapping');
        }
    } catch (error) {
        console.error('❌ Error deleting year class book:', error);
        showModal('Error', 'Failed to delete class book mapping');
    }
}

async function saveYearTeacherAssignment() {
    const activeYearId = getCurrentEducationalYearId();
    const userId = document.getElementById('yearTeacherUser')?.value;
    const className = document.getElementById('yearTeacherClass')?.value;

    if (!activeYearId) {
        showModal('Error', 'Please set an active educational year first');
        return;
    }
    if (!userId || !className) {
        showModal('Error', 'Please select both teacher/user and class');
        return;
    }

    try {
        const response = await fetch(`/api/educational-years/${activeYearId}/teacher-assignments`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({
                user_id: parseInt(userId, 10),
                class_name: className
            })
        });
        const result = await response.json();
        if (response.ok) {
            showModal('Success', 'Teacher assignment saved successfully');
            await loadYearSetupData();
        } else {
            showModal('Error', result.error || 'Failed to save teacher assignment');
        }
    } catch (error) {
        console.error('❌ Error saving teacher assignment:', error);
        showModal('Error', 'Failed to save teacher assignment');
    }
}

async function deleteYearTeacherAssignment(assignmentId) {
    if (!confirm('Delete this teacher assignment only for the active educational year?')) {
        return;
    }

    try {
        const response = await fetch(`/api/teacher-assignments/${assignmentId}`, {
            method: 'DELETE',
            credentials: 'include'
        });
        const result = await response.json();
        if (response.ok) {
            showModal('Success', 'Teacher assignment deleted successfully');
            await loadYearSetupData();
        } else {
            showModal('Error', result.error || 'Failed to delete teacher assignment');
        }
    } catch (error) {
        console.error('❌ Error deleting year teacher assignment:', error);
        showModal('Error', 'Failed to delete teacher assignment');
    }
}

async function copyEducationalYearSetup() {
    const activeYearId = getCurrentEducationalYearId();
    const sourceYearId = document.getElementById('copySourceEducationalYear')?.value;
    const sourceYearName = getEducationalYearNameById(sourceYearId);
    const targetYearName = getEducationalYearNameById(activeYearId);

    if (!activeYearId) {
        showModal('Error', 'Please set an active educational year first');
        return;
    }
    if (!sourceYearId) {
        showModal('Error', 'Please select a source educational year');
        return;
    }
    if (String(sourceYearId) === String(activeYearId)) {
        showModal('Error', 'Please select a different source year');
        return;
    }

    const initialConfirmMessage = typeof t === 'function'
        ? t('copySetupInitialConfirm').replace('{source}', sourceYearName).replace('{target}', targetYearName)
        : `Copy enrollments, class books, and teacher assignments from "${sourceYearName}" into "${targetYearName}"?`;
    if (!confirm(initialConfirmMessage)) {
        return;
    }

    await submitCopyEducationalYearSetup(parseInt(sourceYearId, 10), activeYearId);
}

async function submitCopyEducationalYearSetup(sourceYearId, targetYearId, extraPayload = {}) {
    try {
        const response = await fetch(`/api/educational-years/${targetYearId}/copy-setup`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({
                source_educational_year_id: parseInt(sourceYearId, 10),
                copy_enrollments: true,
                copy_class_books: true,
                copy_teacher_assignments: true,
                ...extraPayload
            })
        });
        const result = await response.json();
        if (response.ok) {
            const summary = result.summary || {};
            showModal(
                'Success',
                `${typeof t === 'function' ? t('copySetupSuccess') : 'Setup copied successfully.'}\n\n${typeof t === 'function' ? t('yearSetupEnrollmentsLabel') : 'Enrollments'}: ${summary.copied_enrollments || 0}\n${typeof t === 'function' ? t('copyUpdatedExistingEnrollments') : 'Updated existing enrollments'}: ${summary.updated_enrollments || 0}\n${typeof t === 'function' ? t('copyInsertedNewEnrollments') : 'Inserted new enrollments'}: ${summary.inserted_enrollments || 0}\n${typeof t === 'function' ? t('yearSetupClassBooksLabel') : 'Class books'}: ${summary.copied_class_books || 0}\n${typeof t === 'function' ? t('yearSetupTeacherAssignmentsLabel') : 'Teacher assignments'}: ${summary.copied_teacher_assignments || 0}`
            );
            await loadYearSetupData();
        } else if (response.status === 409 && result.requires_confirmation && result.preflight) {
            const confirmationText = await requestTypedYearConfirmation({
                title: typeof t === 'function' ? t('copySetup') : 'Copy Setup',
                detailsText: buildCopySetupWarningMessage(result.preflight),
                confirmationPhrase: result.preflight.confirmation_phrase,
                confirmLabel: typeof t === 'function' ? t('copySetup') : 'Copy Setup'
            });
            if (confirmationText === null) {
                return;
            }
            if (confirmationText !== result.preflight.confirmation_phrase) {
                showModal('Error', typeof t === 'function' ? t('confirmationTextMismatch') : 'Confirmation text did not match.');
                return;
            }

            await submitCopyEducationalYearSetup(sourceYearId, targetYearId, {
                force_overwrite: true,
                confirmation_text: confirmationText
            });
        } else {
            showModal('Error', result.error || 'Failed to copy educational year setup');
        }
    } catch (error) {
        console.error('❌ Error copying educational year setup:', error);
        showModal('Error', 'Failed to copy educational year setup');
    }
}

// ============================================================
// Promotion — redesigned: bulk class transfer + inline roll edit
// ============================================================
let promotionEnrollmentsList = [];
let promotionNextClassMap = {};

function _classOptions(selectedValue) {
    return (window.classes || [])
        .map(c => c.name || c.class_name)
        .filter(Boolean)
        .map(n => `<option value="${n}" ${n === selectedValue ? 'selected' : ''}>${n}</option>`)
        .join('');
}

function populatePromotionClassSelects() {
    const srcEl = document.getElementById('promotionSourceClass');
    const tgtEl = document.getElementById('promotionTargetClass');
    if (!srcEl || !tgtEl) return;
    const currentSrc = srcEl.value;
    const currentTgt = tgtEl.value;
    const opts = _classOptions('');
    srcEl.innerHTML = `<option value="">${typeof t === 'function' ? t('selectSourceClass') : 'Select source class'}</option>` + opts;
    tgtEl.innerHTML = `<option value="">${typeof t === 'function' ? t('selectTargetClass') : 'Select target class'}</option>` + opts;
    if (currentSrc) srcEl.value = currentSrc;
    if (currentTgt) tgtEl.value = currentTgt;
}

async function updateBulkTargetClass() {
    const srcClass = document.getElementById('promotionSourceClass')?.value;
    if (!srcClass) return;
    try {
        const r = await fetch(`/api/classes/next?current_class_name=${encodeURIComponent(srcClass)}`, { credentials: 'include' });
        if (r.ok) {
            const data = await r.json();
            const tgtEl = document.getElementById('promotionTargetClass');
            if (tgtEl && data.next_class_name) tgtEl.value = data.next_class_name;
        }
    } catch (_) {}
}

async function loadPromotionEnrollments() {
    const sourceId = document.getElementById('promotionSourceYear')?.value;
    const targetId = document.getElementById('promotionTargetYear')?.value;
    const sourceClass = document.getElementById('promotionSourceClass')?.value;
    const targetClass = document.getElementById('promotionTargetClass')?.value;

    if (!sourceId || !targetId) {
        showModal(typeof t === 'function' ? t('error') : 'Error', 'Please select both source and target educational years');
        return;
    }
    if (String(sourceId) === String(targetId)) {
        showModal(typeof t === 'function' ? t('error') : 'Error', 'Source and target year must be different');
        return;
    }
    if (!sourceClass) {
        showModal(typeof t === 'function' ? t('error') : 'Error', typeof t === 'function' ? t('selectSourceClass') : 'Please select a source class');
        return;
    }
    if (!targetClass) {
        showModal(typeof t === 'function' ? t('error') : 'Error', typeof t === 'function' ? t('selectTargetClass') : 'Please select a target class');
        return;
    }

    try {
        const response = await fetch(
            `/api/promotion/source-enrollments?source_educational_year_id=${encodeURIComponent(sourceId)}&class_name=${encodeURIComponent(sourceClass)}`,
            { credentials: 'include' }
        );
        if (!response.ok) {
            const err = await response.json().catch(() => ({}));
            showModal(typeof t === 'function' ? t('error') : 'Error', err.error || 'Failed to load enrollments');
            return;
        }
        promotionEnrollmentsList = await response.json();

        // Hide result panel if visible from previous run
        const resultContainer = document.getElementById('promotionResultContainer');
        if (resultContainer) resultContainer.style.display = 'none';

        const tbody = document.getElementById('promotionEnrollmentsBody');
        const container = document.getElementById('promotionEnrollmentsContainer');
        if (!tbody || !container) return;

        if (!promotionEnrollmentsList.length) {
            showModal(typeof t === 'function' ? t('error') : 'Error', `No active students found in "${sourceClass}" for the selected source year.`);
            return;
        }

        const classOpts = _classOptions(targetClass);

        tbody.innerHTML = promotionEnrollmentsList.map((e, idx) => {
            const safeClass = (e.class_name || '').replace(/"/g, '&quot;');
            const safeName = (e.name || e.student_id || '').replace(/</g, '&lt;');
            const safeOldRoll = (e.roll_number || '').toString().replace(/</g, '&lt;');
            return `
                <tr data-student-id="${e.student_id}" data-enrollment-id="${e.id}" data-source-class="${safeClass}">
                    <td>${safeName}</td>
                    <td style="color:#888;">${safeOldRoll || '—'}</td>
                    <td>
                        <input type="text" class="promo-roll-input" placeholder="${typeof t === 'function' ? t('enterRoll') : 'Enter roll'}"
                            style="width:80px; padding:3px 6px; border:1px solid #d1d5db; border-radius:4px;"
                            oninput="validatePromotionRolls()" />
                    </td>
                    <td>
                        <select class="promo-exception" onchange="updatePromotionTargetCell(this)">
                            <option value="transfer" selected>${typeof t === 'function' ? t('transferToTarget') : 'Transfer (to target)'}</option>
                            <option value="repeat">${typeof t === 'function' ? t('repeat') : 'Repeat same class'}</option>
                            <option value="pass_out">${typeof t === 'function' ? t('passOut') : 'Pass out'}</option>
                            <option value="inactive">${typeof t === 'function' ? t('inactive') : 'Inactive'}</option>
                        </select>
                    </td>
                    <td class="promo-target-cell">${targetClass}</td>
                </tr>`;
        }).join('');

        // Reset run button — user must assign rolls first
        const runBtn = document.getElementById('promotionRunBtn');
        if (runBtn) runBtn.disabled = true;
        const warning = document.getElementById('promotionRollDuplicateWarning');
        if (warning) warning.style.display = 'none';

        container.style.display = 'block';
        validatePromotionRolls();
    } catch (error) {
        console.error('Error loading promotion enrollments:', error);
        showModal(typeof t === 'function' ? t('error') : 'Error', 'Failed to load promotion enrollments');
    }
}

function updatePromotionTargetCell(selectEl) {
    const row = selectEl.closest('tr');
    if (!row) return;
    const targetCell = row.querySelector('.promo-target-cell');
    if (!targetCell) return;
    const action = selectEl.value;
    const sourceClass = row.getAttribute('data-source-class') || '';
    const targetClass = document.getElementById('promotionTargetClass')?.value || '';

    if (action === 'transfer') {
        targetCell.textContent = targetClass;
    } else if (action === 'repeat') {
        targetCell.textContent = sourceClass;
    } else {
        // pass_out / inactive — no class, no roll needed
        targetCell.textContent = '—';
    }
    validatePromotionRolls();
}

function validatePromotionRolls() {
    const rows = document.querySelectorAll('#promotionEnrollmentsBody tr');
    const runBtn = document.getElementById('promotionRunBtn');
    const warning = document.getElementById('promotionRollDuplicateWarning');

    // Only rows that actually get a new enrollment need a roll
    const activeRolls = [];
    let hasMissing = false;
    let hasDuplicate = false;

    rows.forEach(row => {
        const exceptionEl = row.querySelector('.promo-exception');
        const rollInput = row.querySelector('.promo-roll-input');
        const action = exceptionEl ? exceptionEl.value : 'transfer';

        // pass_out and inactive don't need a roll
        if (action === 'pass_out' || action === 'inactive') {
            if (rollInput) {
                rollInput.style.border = '1px solid #d1d5db';
                rollInput.disabled = true;
                rollInput.placeholder = '—';
            }
            return;
        }

        if (rollInput) {
            rollInput.disabled = false;
            rollInput.placeholder = typeof t === 'function' ? t('enterRoll') : 'Enter roll';
            const val = rollInput.value.trim();
            if (!val) {
                hasMissing = true;
                rollInput.style.border = '1px solid #f59e0b';
            } else {
                activeRolls.push({ val, input: rollInput });
            }
        }
    });

    // Check duplicates among filled rolls
    const seen = {};
    activeRolls.forEach(({ val, input }) => {
        if (seen[val]) {
            hasDuplicate = true;
            input.style.border = '2px solid #dc2626';
            seen[val].style.border = '2px solid #dc2626';
        } else {
            seen[val] = input;
            if (input.style.border !== '2px solid #dc2626') {
                input.style.border = '1px solid #10b981';
            }
        }
    });

    const canRun = !hasMissing && !hasDuplicate;
    if (runBtn) runBtn.disabled = !canRun;
    if (warning) warning.style.display = hasDuplicate ? 'block' : 'none';
}

async function runPromotion() {
    const sourceId = document.getElementById('promotionSourceYear')?.value;
    const targetId = document.getElementById('promotionTargetYear')?.value;
    const targetClass = document.getElementById('promotionTargetClass')?.value;
    const sourceYearName = getEducationalYearNameById(sourceId);
    const targetYearName = getEducationalYearNameById(targetId);

    if (!sourceId || !targetId || String(sourceId) === String(targetId)) {
        showModal(typeof t === 'function' ? t('error') : 'Error', 'Please select different source and target years');
        return;
    }

    const decisions = [];
    document.querySelectorAll('#promotionEnrollmentsBody tr').forEach(tr => {
        const studentId = tr.getAttribute('data-student-id');
        const enrollmentId = tr.getAttribute('data-enrollment-id');
        const sourceClass = tr.getAttribute('data-source-class');
        const exceptionSelect = tr.querySelector('.promo-exception');
        const rollInput = tr.querySelector('.promo-roll-input');
        const action = exceptionSelect ? exceptionSelect.value : 'transfer';
        const newRoll = rollInput && !rollInput.disabled ? rollInput.value.trim() : null;

        let targetClassName = null;
        if (action === 'transfer') {
            targetClassName = targetClass;
        } else if (action === 'repeat') {
            targetClassName = sourceClass;
        }

        decisions.push({
            student_id: studentId,
            source_enrollment_id: parseInt(enrollmentId, 10),
            action,
            target_class_name: targetClassName || undefined,
            new_roll_number: newRoll || undefined,
            remarks: null
        });
    });

    if (!decisions.length) {
        showModal(typeof t === 'function' ? t('error') : 'Error', 'No students loaded. Please load students first.');
        return;
    }

    const transferCount = decisions.filter(d => d.action === 'transfer').length;
    const confirmMessage = `Transfer ${transferCount} student(s) from source class → "${targetClass}" in "${targetYearName}"?\n\n` +
        decisions.filter(d => d.action !== 'transfer').map(d => {
            const e = promotionEnrollmentsList.find(x => x.student_id === d.student_id);
            return `• ${e?.name || d.student_id}: ${d.action}`;
        }).join('\n') || '';

    if (!confirm(confirmMessage)) return;

    try {
        const response = await fetch('/api/promotion/run', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({
                source_educational_year_id: parseInt(sourceId, 10),
                target_educational_year_id: parseInt(targetId, 10),
                decisions
            })
        });
        const result = await response.json();
        if (response.ok) {
            // Hide planning table
            const container = document.getElementById('promotionEnrollmentsContainer');
            if (container) container.style.display = 'none';

            // Show success summary
            _showPromotionSuccessSummary(result.summary);
        } else {
            showModal(typeof t === 'function' ? t('error') : 'Error', result.error || 'Promotion failed');
        }
    } catch (error) {
        console.error('Error running promotion:', error);
        showModal(typeof t === 'function' ? t('error') : 'Error', 'Failed to run promotion');
    }
}

function _showPromotionSuccessSummary(summary) {
    const s = summary || {};
    const resultContainer = document.getElementById('promotionResultContainer');
    const summaryEl = document.getElementById('promotionResultSummary');
    if (!resultContainer || !summaryEl) {
        showModal(
            typeof t === 'function' ? t('success') : 'Success',
            `✅ Transfer: ${s.transfer || 0} | Repeat: ${s.repeated || 0} | Pass out: ${s.pass_out || 0} | Inactive: ${s.inactive || 0}`
        );
        return;
    }
    summaryEl.innerHTML = `
        <div style="background:#ecfdf5; border:1px solid #6ee7b7; border-radius:8px; padding:16px;">
            <p style="margin:0 0 8px; color:#059669; font-weight:700; font-size:1em;">
                ✅ ${typeof t === 'function' ? t('transferComplete') : 'Transfer complete!'}
            </p>
            <div style="display:flex; gap:20px; flex-wrap:wrap; font-size:0.9em; color:#374151;">
                <span>🔀 ${typeof t === 'function' ? t('transferred') : 'Transferred'}: <strong>${s.transfer || 0}</strong></span>
                <span>🔁 ${typeof t === 'function' ? t('repeated') : 'Repeated'}: <strong>${s.repeated || 0}</strong></span>
                <span>🎓 ${typeof t === 'function' ? t('passedOut') : 'Passed out'}: <strong>${s.pass_out || 0}</strong></span>
                <span>💤 ${typeof t === 'function' ? t('inactived') : 'Inactive'}: <strong>${s.inactive || 0}</strong></span>
            </div>
        </div>`;
    resultContainer.style.display = 'block';
    resultContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
    promotionEnrollmentsList = [];
}

// ===== PERMISSION MANAGEMENT FUNCTIONS =====

// Store current user being edited
let currentPermissionUserId = null;
let permissionTemplates = null;

// Load permission templates from backend
async function loadPermissionTemplates() {
    try {
        const response = await fetch('/api/permission-templates', {
            credentials: 'include'
        });
        if (response.ok) {
            const data = await response.json();
            permissionTemplates = data.templates;
            console.log('✅ Permission templates loaded:', permissionTemplates);
        }
    } catch (error) {
        console.error('❌ Error loading permission templates:', error);
    }
}

// Show permission editor modal
async function showPermissionEditor(userId) {
    // Load templates if not loaded and user has settings access
    if (!permissionTemplates && typeof window.checkPermission === 'function' && window.checkPermission('settings', 'edit')) {
        await loadPermissionTemplates();
    }
    
    // Find user in current list
    let user = allUsers.find(u => u.id === userId);
    if (!user) {
        showModal(t('error'), t('userNotFound'));
        return;
    }
    
    // 🔧 FIX: Fetch fresh user data from database to get latest permissions
    try {
        console.log(`🔄 Fetching fresh user data for ID ${userId}...`);
        const response = await fetch(`/api/users/${userId}`, {
            credentials: 'include'
        });
        
        if (response.ok) {
            const freshUserData = await response.json();
            console.log('✅ Fresh user data loaded:', freshUserData);
            user = freshUserData; // Use fresh data instead of stale data
            
            // Update the user in allUsers array for consistency
            const userIndex = allUsers.findIndex(u => u.id === userId);
            if (userIndex !== -1) {
                allUsers[userIndex] = freshUserData;
            }
        } else {
            console.warn('⚠️ Failed to fetch fresh user data, using cached data');
        }
    } catch (error) {
        console.error('❌ Error fetching fresh user data:', error);
        console.warn('⚠️ Using cached user data');
    }
    
    currentPermissionUserId = userId;
    
    // Update modal title
    document.getElementById('permissionUsername').textContent = user.username;
    
    // Load current permissions
    let permissions = user.permissions || {
        sections: {},
        classes: ['all']
    };
    
    // Parse permissions if it's a JSON string
    if (typeof permissions === 'string') {
        try {
            permissions = JSON.parse(permissions);
            console.log('🔐 Parsed permissions from JSON string:', permissions);
        } catch (e) {
            console.warn('🔐 Failed to parse permissions JSON:', e);
            permissions = { sections: {}, classes: ['all'] };
        }
    }
    
    console.log('🔐 Loading permissions for user:', {
        userId: userId,
        username: user.username,
        permissions: permissions
    });
    
    // Set checkboxes based on current permissions
    setPermissionCheckboxes(permissions);
    
    // Populate class checkboxes
    populateClassCheckboxes(permissions.classes);
    
    // Setup class access radio listeners
    setupClassAccessListeners();
    
    // Show modal
    document.getElementById('permissionEditorModal').style.display = 'block';
}

// Close permission editor
function closePermissionEditor() {
    document.getElementById('permissionEditorModal').style.display = 'none';
    currentPermissionUserId = null;
}

// Set checkboxes based on permissions object
function setPermissionCheckboxes(permissions) {
    const sections = permissions.sections || {};
    
    console.log('🔐 Setting permission checkboxes for:', sections);
    
    // Clear all checkboxes first
    const allCheckboxes = document.querySelectorAll('.perm-checkbox');
    console.log(`🔐 Found ${allCheckboxes.length} permission checkboxes`);
    allCheckboxes.forEach(cb => cb.checked = false);
    
    // Set checkboxes based on permissions
    Object.entries(sections).forEach(([section, perms]) => {
        console.log(`🔐 Processing section: ${section}`, perms);
        
        if (perms.view) {
            const viewCheckbox = document.querySelector(`input[name="perm-${section}-view"]`);
            console.log(`🔐 View checkbox for ${section}:`, viewCheckbox);
            if (viewCheckbox) {
                viewCheckbox.checked = true;
                console.log(`✅ Checked ${section} view checkbox`);
            } else {
                console.warn(`⚠️ View checkbox not found for ${section}`);
            }
        }
        if (perms.edit) {
            const editCheckbox = document.querySelector(`input[name="perm-${section}-edit"]`);
            console.log(`🔐 Edit checkbox for ${section}:`, editCheckbox);
            if (editCheckbox) {
                editCheckbox.checked = true;
                console.log(`✅ Checked ${section} edit checkbox`);
            } else {
                console.warn(`⚠️ Edit checkbox not found for ${section}`);
            }
        }
    });
    
    console.log('🔐 Permission checkboxes set complete');
}

// Populate class checkboxes
function populateClassCheckboxes(allowedClasses) {
    const container = document.getElementById('classCheckboxes');
    if (!container) return;
    
    // Get all classes
    const classes = window.classes || [];
    
    if (classes.length === 0) {
        container.innerHTML = '<p class="help-text">No classes available</p>';
        return;
    }
    
    container.innerHTML = classes.map(cls => {
        const isChecked = allowedClasses && allowedClasses.includes(cls.name);
        return `
            <label>
                <input type="checkbox" name="class-${cls.id}" value="${cls.name}" ${isChecked ? 'checked' : ''}>
                ${cls.name}
            </label>
        `;
    }).join('');
    
    // Set radio button based on current selection
    if (allowedClasses && allowedClasses.includes('all')) {
        document.querySelector('input[name="class-access-type"][value="all"]').checked = true;
        document.getElementById('specificClassesContainer').style.display = 'none';
    } else {
        document.querySelector('input[name="class-access-type"][value="specific"]').checked = true;
        document.getElementById('specificClassesContainer').style.display = 'block';
    }
}

// Setup class access radio listeners
function setupClassAccessListeners() {
    const radios = document.querySelectorAll('input[name="class-access-type"]');
    radios.forEach(radio => {
        radio.addEventListener('change', function() {
            const container = document.getElementById('specificClassesContainer');
            if (this.value === 'specific') {
                container.style.display = 'block';
            } else {
                container.style.display = 'none';
            }
        });
    });
}

// Apply permission template
function applyPermissionTemplate(templateName) {
    if (!permissionTemplates || !permissionTemplates[templateName]) {
        showModal('Error', 'Template not found');
        return;
    }
    
    const template = permissionTemplates[templateName];
    const permissions = template.permissions;
    
    // Set checkboxes
    setPermissionCheckboxes(permissions);
    
    // Set class access
    populateClassCheckboxes(permissions.classes);
    
    showModal('Template Applied', `"${template.name}" template has been applied. You can customize it further or save.`);
}

// Save user permissions
async function saveUserPermissions() {
    if (!currentPermissionUserId) return;
    
    // Gather permissions from checkboxes
    const permissions = {
        sections: {},
        classes: []
    };
    
    // Get section permissions
    const sections = ['dashboard', 'registration', 'attendance', 'reports', 'teachers-corner', 'settings', 'messages'];
    sections.forEach(section => {
        const viewCheckbox = document.querySelector(`input[name="perm-${section}-view"]`);
        const editCheckbox = document.querySelector(`input[name="perm-${section}-edit"]`);
        
        permissions.sections[section] = {
            view: viewCheckbox ? viewCheckbox.checked : false,
            edit: editCheckbox ? editCheckbox.checked : false
        };
    });
    
    // Get class access
    const classAccessType = document.querySelector('input[name="class-access-type"]:checked').value;
    if (classAccessType === 'all') {
        permissions.classes = ['all'];
    } else {
        // Get selected classes
        const selectedClasses = [];
        document.querySelectorAll('#classCheckboxes input[type="checkbox"]:checked').forEach(cb => {
            selectedClasses.push(cb.value);
        });
        permissions.classes = selectedClasses;
    }
    
    // Save to backend
    try {
        const response = await fetch(`/api/users/${currentPermissionUserId}/permissions`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ permissions })
        });
        
        if (response.ok) {
            showModal('Success', 'Permissions updated successfully');
            closePermissionEditor();
            loadUsers(); // Refresh user list
        } else {
            const error = await response.json();
            showModal('Error', error.error || 'Failed to update permissions');
        }
    } catch (error) {
        console.error('❌ Error saving permissions:', error);
        showModal('Error', 'Failed to save permissions');
    }
}

// Export all functions
export { 
    books, 
    updateClassDropdowns, 
    addClass, 
    deleteClass,
    displayClasses,
    editClass,
    saveClassPromotionOrder,
    closeBookManagementEditModal, 
    displayBooks, 
    getClassNameById, 
    getClassIdByName, 
    addBook, 
    editBook, 
    deleteBook, 
    updateBookDropdowns, 
    initializeAcademicYearStart, 
    saveAcademicYearStart, 
    clearAcademicYearStart, 
    displayAcademicYearStart, 
    updateDateRestrictions, 
    clearDateRestrictions, 
    saveAppName,
    loadAppName,
    loadAppShortName,
    saveAppShortName,
    loadDevMode,
    toggleDevMode,
    isDevModeEnabled,
    isLocalhost,
    loadBooks,
    refreshClasses,
    // User management functions
    loadUsers,
    displayUsers,
    showCreateUserModal,
    closeCreateUserModal,
    editUser,
    closeEditUserModal,
    deleteUser,
    resetUserPassword,
    refreshUsersList,
    // Permission management functions
    showPermissionEditor,
    closePermissionEditor,
    applyPermissionTemplate,
    saveUserPermissions,
    loadPermissionTemplates,
    toggleCreateUserPermissions,
    // Data reset functions
    showResetStudentsModal,
    showResetScoresModal,
    showResetProgressModal,
    showResetBooksModal,
    showResetLogsModal,
    showResetUsersModal,
    showResetSettingsModal,
    showCompleteResetModal,
    showBackupModal,
    showBulkImport,
    hideBulkImport,
    downloadAllStudentsCSV,
    createBackup,
    handleFileSelect,
    updateUploadZone,
    resetUploadZone,
    processExcelFile,
    showImportProgress,
    updateProgress,
    hideImportProgress,
    readExcelFile,
    importStudentsBatch,
    showImportResults,
    resetBulkImport,
    generateStudentId,
    showEncodingErrorModal,
    // Confirmation functions
    confirmResetStudents,
    confirmResetScores,
    confirmResetProgress,
    confirmResetBooks,
    confirmResetLogs,
    confirmResetUsers,
    confirmResetSettings,
    confirmCompleteReset,
    // Educational year management functions
    loadEducationalYears,
    loadCurrentEducationalYear,
    openAcademicSubtab,
    openDataSubtab,
    openUsersSubtab,
    displayEducationalYears,
    renderHeaderEducationalYearDisplay,
    handleEducationalYearSelectionChange,
    applySelectedEducationalYear,
    createEducationalYear,
    editEducationalYear,
    updateEducationalYear,
    deleteEducationalYear,
    purgeSampleEducationalYear,
    setEducationalYearAsActive,
    getCurrentEducationalYear,
    getCurrentEducationalYearId,
    getEducationalYearCoverageStatus,
    copyEducationalYearSetup,
    saveYearEnrollment,
    deleteYearEnrollment,
    saveYearClassBook,
    deleteYearClassBook,
    saveYearTeacherAssignment,
    deleteYearTeacherAssignment,
    // Year-end promotion (bulk transfer)
    populatePromotionClassSelects,
    updateBulkTargetClass,
    loadPromotionEnrollments,
    updatePromotionTargetCell,
    validatePromotionRolls,
    runPromotion,
    // Roll assignment
    loadRollAssignmentTable,
    saveRollAssignment
}
