// This module encapsulates all API calls used by Teachers Corner. Each
// function mutates the shared state object and returns any data that
// downstream callers might need. By separating network logic from UI
// rendering, the application becomes easier to maintain and test.

import { state } from './teachers-corner-state.js';
import { getClassIdByName, getClassIdFromName } from './teachers-corner-mapping.js';

// Fetch the full student list from the main application. On success the
// returned array is stored in state.allStudents. If a class is
// currently selected, you may re-render the dashboard afterwards.
export async function loadStudentsFromMainApp() {
  try {
    const response = await fetch('/api/students', {
      headers: { 'Cache-Control': 'no-cache' },
    });
    if (response.ok) {
      state.allStudents = await response.json();
      console.log('✅ Loaded students from main app:', state.allStudents.length);
      return state.allStudents;
    } else {
      console.error('❌ Failed to load students from main app');
      return [];
    }
  } catch (error) {
    console.error('❌ Error loading students:', error);
    return [];
  }
}

// Load attendance data for all students. The data is stored on
// state.attendance and also assigned to window.attendance for backwards
// compatibility with code that references the global. Passing the
// attendance through state allows future UI code to avoid referencing
// global variables directly.
export async function loadAttendanceFromMainApp() {
  try {
    const response = await fetch('/api/attendance', {
      headers: { 'Cache-Control': 'no-cache' },
    });
    if (response.ok) {
      const attendanceData = await response.json();
      console.log('✅ Loaded attendance data from main app');
      state.attendance = attendanceData;
      // Also expose globally for legacy code
      window.attendance = attendanceData;
      return attendanceData;
    } else {
      console.error('❌ Failed to load attendance data from main app');
      return {};
    }
  } catch (error) {
    console.error('❌ Error loading attendance data:', error);
    return {};
  }
}

// Fetch the books associated with a given class. The class name is
// converted into its numeric ID via getClassIdByName. If the mapping
// fails to find an ID, an empty array is returned.
export async function loadBooksForClass(className) {
  try {
    // Ensure we have a numeric class ID
    const classId = getClassIdByName(className);
    if (!classId) {
      console.error('❌ Invalid class name:', className);
      return [];
    }
    const response = await fetch(`/api/books/class/${classId}`, {
      headers: { 'Cache-Control': 'no-cache' },
    });
    if (response.ok) {
      const books = await response.json();
      console.log(`✅ Loaded ${books.length} books for class ${className} (ID: ${classId})`);
      return books;
    } else {
      console.error('❌ Failed to load books for class:', className);
      return [];
    }
  } catch (error) {
    console.error('❌ Error loading books for class:', error);
    return [];
  }
}

// Load the education progress history for a specific book and class.
// This helper converts the results into the shape expected by the
// rendering functions: an array of objects with date, completed, and note.
export async function loadProgressHistoryForBook(bookId, className) {
  try {
    const classId = getClassIdFromName(className);
    if (!classId) {
      console.error(`❌ Could not find class ID for class name: ${className}`);
      return [];
    }
    const response = await fetch(`/api/education/history/book/${bookId}/class/${classId}`, {
      headers: { 'Cache-Control': 'no-cache' },
    });
    if (response.ok) {
      const history = await response.json();
      return history.map((entry) => ({
        date: entry.change_date,
        completed: entry.completed_pages,
        note: entry.notes,
      }));
    } else {
      const errorText = await response.text();
      console.error('❌ Failed to load progress history for book', bookId, 'Status:', response.status, 'Error:', errorText);
      return [];
    }
  } catch (error) {
    console.error('❌ Error loading progress history for book', bookId, ':', error);
    return [];
  }
}

// Load teacher logs for the specified class and update state.teachersLogbook.
// The server returns a flat list of logs which we convert into the nested
// structure expected by the UI (class_logs and student_logs).
export async function loadTeacherLogsFromDatabase(className) {
  try {
    const response = await fetch(`/api/teacher-logs?class=${encodeURIComponent(className)}`, {
      headers: { 'Cache-Control': 'no-cache' },
    });
    if (response.ok) {
      const logs = await response.json();
      console.log(`✅ Loaded ${logs.length} teacher logs for class: ${className}`);
      state.teachersLogbook[className] = { class_logs: [], student_logs: {} };
      logs.forEach((log) => {
        if (log.student_id) {
          if (!state.teachersLogbook[className].student_logs[log.student_id]) {
            state.teachersLogbook[className].student_logs[log.student_id] = [];
          }
          state.teachersLogbook[className].student_logs[log.student_id].push({
            id: log.id,
            type: log.log_type,
            details: log.details,
            date: log.created_at,
            isImportant: log.is_important,
            needsFollowup: log.needs_followup,
            studentId: log.student_id,
            student_id: log.student_id,
          });
        } else {
          state.teachersLogbook[className].class_logs.push({
            id: log.id,
            type: log.log_type,
            details: log.details,
            date: log.created_at,
            isImportant: log.is_important,
            needsFollowup: log.needs_followup,
          });
        }
      });
      return true;
    } else {
      console.error('❌ Failed to load teacher logs from database');
      return false;
    }
  } catch (error) {
    console.error('❌ Error loading teacher logs:', error);
    return false;
  }
}

// Load scores for all students. The API returns an array of student
// objects with `current_score` and class names. We update
// state.studentScores accordingly.
export async function loadStudentScoresFromDatabase(className) {
  try {
    const response = await fetch('/api/students-with-scores', {
      headers: { 'Cache-Control': 'no-cache' },
    });
    if (response.ok) {
      const studentsWithScores = await response.json();
      console.log(`✅ Loaded ${studentsWithScores.length} student scores from all classes`);
      studentsWithScores.forEach((student) => {
        state.studentScores[student.id] = student.current_score || 0;
      });
      return true;
    } else {
      console.error('❌ Failed to load student scores from database');
      return false;
    }
  } catch (error) {
    console.error('❌ Error loading student scores:', error);
    return false;
  }
}

// Load score change history for a given student and update
// state.scoreChangeHistory. The server returns a list of changes with
// timestamps and scores; we convert them into a more user‑friendly
// structure.
export async function loadScoreHistoryFromDatabase(studentId) {
  try {
    const response = await fetch(`/api/student-scores/${studentId}/history`, {
      headers: { 'Cache-Control': 'no-cache' },
    });
    if (response.ok) {
      const history = await response.json();
      console.log(`✅ Loaded ${history.length} score changes for student: ${studentId}`);
      state.scoreChangeHistory[studentId] = history.map((change) => ({
        date: change.changed_at,
        oldScore: change.old_score,
        newScore: change.new_score,
        reason: change.change_reason || 'কোন কারণ উল্লেখ করা হয়নি',
        changedBy: 'শিক্ষক',
      }));
      return true;
    } else {
      console.error('❌ Failed to load score history from database');
      return false;
    }
  } catch (error) {
    console.error('❌ Error loading score history:', error);
    return false;
  }
}

// Update a student's Husnul Khuluk score. The request body includes the
// new score and the reason for the change. After a successful update
// the local score cache and score history are refreshed.
export async function updateScoreInDatabase(studentId, newScore, reason) {
  try {
    const response = await fetch(`/api/student-scores/${studentId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ new_score: newScore, reason: reason || 'কোন কারণ উল্লেখ করা হয়নি' }),
    });
    if (response.ok) {
      const result = await response.json();
      console.log('✅ Score updated successfully:', result);
      state.studentScores[studentId] = newScore;
      await loadScoreHistoryFromDatabase(studentId);
      return true;
    } else {
      const error = await response.json();
      console.error('❌ Failed to update score:', error);
      return false;
    }
  } catch (error) {
    console.error('❌ Error updating score:', error);
    return false;
  }
}

// Create a new log entry. The logData object should include class_name,
// student_id (optional), log_type, details, is_important, and
// needs_followup. After a successful save the logbook is reloaded.
export async function createLogInDatabase(logData) {
  try {
    const response = await fetch('/api/teacher-logs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(logData),
    });
    if (response.ok) {
      const result = await response.json();
      console.log('✅ Log created successfully:', result);
      await loadTeacherLogsFromDatabase(logData.class_name);
      return true;
    } else {
      const error = await response.json();
      console.error('❌ Failed to create log:', error);
      return false;
    }
  } catch (error) {
    console.error('❌ Error creating log:', error);
    return false;
  }
}

// Update an existing log entry by ID. After a successful update the
// logbook for the current class is reloaded. Passing the updated log
// data ensures the server receives the correct payload.
export async function updateLogInDatabase(logId, logData) {
  try {
    const response = await fetch(`/api/teacher-logs/${logId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(logData),
    });
    if (response.ok) {
      console.log('✅ Log updated successfully');
      await loadTeacherLogsFromDatabase(logData.class_name);
      return true;
    } else {
      const error = await response.json();
      console.error('❌ Failed to update log:', error);
      return false;
    }
  } catch (error) {
    console.error('❌ Error updating log:', error);
    return false;
  }
}

// Delete a log entry from the database. After deletion the logbook is
// reloaded for the current class.
export async function deleteLogFromDatabase(logId, className) {
  try {
    const response = await fetch(`/api/teacher-logs/${logId}`, {
      method: 'DELETE',
    });
    if (response.ok) {
      console.log('✅ Log deleted successfully');
      await loadTeacherLogsFromDatabase(className);
      return true;
    } else {
      const error = await response.json();
      console.error('❌ Failed to delete log:', error);
      return false;
    }
  } catch (error) {
    console.error('❌ Error deleting log:', error);
    return false;
  }
}

// Function to get active students for a class
export function getActiveStudentsForClass(className) {
    return state.allStudents.filter(student => 
        student.class === className && 
        student.status !== 'inactive'
    );
}

// Function to get inactive students for a class
export function getInactiveStudentsForClass(className) {
    return state.allStudents.filter(student => 
        student.class === className && 
        student.status === 'inactive'
    );
}

// --- DATA CALCULATION ---
export function getHusnulKhulukScore(studentId) {
    // Get score from local studentScores object (loaded from database)
    if (state.studentScores[studentId] !== undefined) {
    return state.studentScores[studentId];
}
    // Return default score if not loaded yet
    return 0;
}

// Calculate attendance statistics for student profile
export async function calculateAttendanceStats(student) {
    try {
        // Fetch real attendance data for this student
        const response = await fetch('/api/attendance', {
            headers: {
                'Cache-Control': 'no-cache'
            }
        });
        if (response.ok) {
            const allAttendance = await response.json();
            
            // The API returns data grouped by date: { "2025-08-18": { "ST001": { "status": "present" } } }
            let present = 0;
            let absent = 0;
            let leave = 0;
            
            // Iterate through all dates and find this student's attendance
            Object.values(allAttendance).forEach(dateAttendance => {
                if (dateAttendance[student.id]) {
                    const status = dateAttendance[student.id].status;
                    if (status === 'present') present++;
                    else if (status === 'absent') absent++;
                    else if (status === 'leave') leave++;
                }
            });
            
            const totalSchoolDays = present + absent + leave;
            const attendanceRate = totalSchoolDays > 0 ? Math.round((present / totalSchoolDays) * 100) : 0;
            
            console.log(`📊 Attendance stats for ${student.name}:`, { present, absent, leave, totalSchoolDays, attendanceRate });
            
            return {
                present,
                absent,
                leave,
                totalSchoolDays,
                attendanceRate
            };
        }
    } catch (error) {
        console.error('Error fetching attendance data:', error);
    }
    
    // Fallback to basic calculation if API fails
    return {
        present: 0,
        absent: 0,
        leave: 0,
        totalSchoolDays: 0,
        attendanceRate: 0
    };
}

// Helper function to get student name by ID
export function getStudentNameById(studentId) {
    const student = state.allStudents.find(s => s.id === studentId);
    return student ? student.name : 'Unknown Student';
}

// --- STUDENT PHOTO UPLOAD FUNCTIONS ---
export async function handleStudentPhotoUpload(studentId) {
    const fileInput = document.getElementById('student-photo-upload');
    const file = fileInput.files[0];
    
    if (!file) return;
    
    // Validate file
    if (file.size > 200 * 1024) {
        alert('ছবির আকার ২০০ কিলোবাইটের বেশি হতে পারবে না');
        return;
    }
    
    if (!file.type.match('image/(jpeg|jpg|png)')) {
        alert('শুধুমাত্র JPG এবং PNG ফরম্যাটের ছবি আপলোড করা যাবে');
        return;
    }
    
    try {
        const formData = new FormData();
        formData.append('photo', file);
        
        const response = await fetch(`/api/students/${studentId}/upload-photo`, {
            method: 'POST',
            body: formData
        });
        
            if (response.ok) {
                const result = await response.json();
                console.log('✅ Upload successful:', result);
                
                // Update the student data
                const student = state.allStudents.find(s => s.id === studentId);
                if (student) {
                    student.photo_path = result.photo_path;
                    console.log('✅ Student data updated:', student.photo_path);
                }
                
                alert('ছবি সফলভাবে আপলোড হয়েছে');
                
                // Update the display immediately with multiple attempts
                if (typeof window.updateStudentPhotoDisplay === 'function') {
                    window.updateStudentPhotoDisplay(studentId, result.photo_path);
                    setTimeout(() => {
                        window.updateStudentPhotoDisplay(studentId, result.photo_path);
                    }, 100);
                    setTimeout(() => {
                        window.updateStudentPhotoDisplay(studentId, result.photo_path);
                    }, 500);
                }
                
                return result.photo_path;
            } else {
                const error = await response.json();
                alert('ছবি আপলোড ব্যর্থ: ' + error.error);
            }
    } catch (error) {
        console.error('Photo upload error:', error);
        alert('ছবি আপলোডে সমস্যা হয়েছে');
    }
}

export async function deleteStudentPhoto(studentId) {
    if (!confirm('আপনি কি নিশ্চিত যে আপনি এই ছাত্রের ছবি মুছতে চান?')) {
        return;
    }
    
    try {
        const response = await fetch(`/api/students/${studentId}/photo`, {
            method: 'DELETE'
        });
        
            if (response.ok) {
                const result = await response.json();
                console.log('✅ Delete successful:', result);
                
                // Update the student data
                const student = state.allStudents.find(s => s.id === studentId);
                if (student) {
                    student.photo_path = null;
                    console.log('✅ Student data updated: photo removed');
                }
                
                alert('ছবি সফলভাবে মুছে ফেলা হয়েছে');
                return true;
            } else {
                const error = await response.json();
                alert('ছবি মুছতে ব্যর্থ: ' + error.error);
                return false;
            }
    } catch (error) {
        console.error('Photo delete error:', error);
        alert('ছবি মুছতে সমস্যা হয়েছে');
        return false;
    }
}

export async function saveBook() {
    const bookIdElement = document.getElementById('book-id');
    const bookNameElement = document.getElementById('book-name');
    const totalPagesElement = document.getElementById('book-total-pages');
    const bookDescriptionElement = document.getElementById('book-description');
    const completedPagesElement = document.getElementById('book-completed-pages');
    const progressNoteElement = document.getElementById('book-progress-note');
    
    if (!bookIdElement || !bookNameElement || !totalPagesElement || !completedPagesElement || !progressNoteElement) {
        console.error('❌ Required book elements not found');
        return false;
    }
    
    const bookId = bookIdElement.value;
    const bookName = bookNameElement.value;
    const totalPages = parseInt(totalPagesElement.value);
    const bookDescription = bookDescriptionElement ? bookDescriptionElement.value : '';
    const completedPages = parseInt(completedPagesElement.value);
    const progressNote = progressNoteElement.value;

    if (!bookName || isNaN(totalPages) || totalPages <= 0) { 
        alert("অনুগ্রহ করে সঠিক তথ্য দিন।"); 
        return false; 
    }
    
    if (bookId) { // Update existing book progress
        try {
            const bookIdNum = parseInt(bookId);
            const book = state.allEducationProgress.find(b => b.id === bookIdNum);
            
            if (!book) {
                console.error('❌ Book not found in saveBook function!');
                return false;
            }
            
            if (isNaN(completedPages) || completedPages < 0 || completedPages > totalPages) {
                alert(`অনুগ্রহ করে ০ থেকে ${totalPages} এর মধ্যে একটি নাম্বার দিন।`); 
                return false;
            }
            
            let progressRecordId = book.progress_record_id;
            
            if (!progressRecordId) {
                const createResponse = await fetch('/api/education', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        class_name: state.currentClass,
                        subject_name: 'General', // Default subject
                        book_id: bookId,
                        book_name: bookName,
                        total_pages: totalPages,
                        completed_pages: completedPages,
                        notes: progressNote || ''
                    })
                });
                
                if (createResponse.ok) {
                    const result = await createResponse.json();
                    progressRecordId = result.id;
                    book.progress_record_id = progressRecordId;
                } else {
                    const error = await createResponse.json();
                    console.error('❌ Failed to create education progress record:', error);
                    return false;
                }
            } else {
                const updateResponse = await fetch(`/api/education/${progressRecordId}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        completed_pages: completedPages,
                        notes: progressNote || ''
                    })
                });
                
                if (!updateResponse.ok) {
                    const error = await updateResponse.json();
                    console.error('❌ Failed to update education progress record:', error);
                    return false;
                }
            }
            
            // Update book information in database if changed
            const updateBookResponse = await fetch(`/api/books/${bookId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    book_name: bookName,
                    class_id: book.class_id,
                    total_pages: totalPages,
                    description: bookDescription || null
                })
            });
            
            if (!updateBookResponse.ok) {
                console.error('❌ Failed to update book information');
            }
            
            book.completed_pages = completedPages;
            book.notes = progressNote || '';
            book.total_pages = totalPages;
            book.book_name = bookName;
            book.description = bookDescription || '';
            
            book.progressHistory = await loadProgressHistoryForBook(book.id, state.currentClass);
            
            return true;
            
        } catch (error) {
            console.error('Error saving progress:', error);
            return false;
        }
    } else { // Add new book (this should be handled in main app settings)
        alert('নতুন বই যোগ করার জন্য অনুগ্রহ করে Settings ট্যাবে যান।');
        return false;
    }
}

export function deleteBook() {
    const bookIdElement = document.getElementById('book-id');
    if (!bookIdElement) {
        console.error('❌ Book ID element not found');
        return false;
    }
    
    const bookId = bookIdElement.value;
    if (confirm("আপনি কি এই বইটি মুছে ফেলতে নিশ্চিত?")) {
        state.allEducationProgress = state.allEducationProgress.filter(b => b.id !== bookId);
        return true;
    }
    return false;
}

// Check if a class needs a 15-day log reminder
export async function checkFifteenDayReminder(className) {
    try {
        const response = await fetch(`/api/teacher-logs/fifteen-day-reminder/${encodeURIComponent(className)}`);
        if (response.ok) {
            const data = await response.json();
            if (data.needs_reminder) {
                // Check if reminder already exists to prevent duplicates
                if (window.currentAlerts) {
                    const existingReminder = window.currentAlerts.find(alert => 
                        alert.title === '১৫ দিনের শ্রেণী বিবরণ প্রয়োজন'
                    );
                    
                    if (!existingReminder) {
                        // Add the reminder to the alerts only if it doesn't exist
                        const reminderAlert = {
                            type: 'warning',
                            icon: 'fas fa-calendar-exclamation',
                            title: '১৫ দিনের শ্রেণী বিবরণ প্রয়োজন',
                            message: data.message,
                            action: 'বিবরণ তৈরি করুন',
                            onClick: () => showAddLogModal(),
                        };
                        
                        window.currentAlerts.push(reminderAlert);
                        console.log('✅ Added 15-day reminder alert');
                        
                        // Re-render alerts
                        const alertsContent = document.getElementById('alerts-content');
                        if (alertsContent) {
                            renderAlertsContent(window.currentAlerts);
                        }
                    } else {
                        console.log('⚠️ 15-day reminder already exists, skipping duplicate');
                    }
                }
            }
            return data;
        } else {
            console.error('❌ Failed to check 15-day reminder');
            return null;
        }
    } catch (error) {
        console.error('❌ Error checking 15-day reminder:', error);
        return null;
    }
}

// Helper function to render alerts content
function renderAlertsContent(alerts) {
    const alertsContent = document.getElementById('alerts-content');
    if (!alertsContent) return;
    
    if (alerts.length === 0) {
        alertsContent.innerHTML = `<p class="text-sm text-gray-500 text-center py-4">কোনো সতর্কতা নেই</p>`;
    } else {
        alertsContent.innerHTML = alerts
            .map((alert, idx) => {
                const config = {
                    'warning': { bg: 'bg-yellow-50', border: 'border-l-4 border-yellow-400', icon: 'text-yellow-600', text: 'text-yellow-800' },
                    'danger': { bg: 'bg-red-50', border: 'border-l-4 border-red-400', icon: 'text-red-600', text: 'text-red-800' },
                    'info': { bg: 'bg-blue-50', border: 'border-l-4 border-blue-400', icon: 'text-blue-600', text: 'text-blue-800' }
                }[alert.type] || { bg: 'bg-gray-50', border: 'border-l-4 border-gray-400', icon: 'text-gray-600', text: 'text-gray-800' };
                
                return `<div class="flex items-center justify-between p-3 rounded-lg ${config.bg} ${config.border}">
                    <div class="flex items-center gap-3">
                        <i class="${alert.icon} ${config.icon}"></i>
                        <div>
                            <div class="font-semibold text-sm ${config.text}">${alert.title}</div>
                            <div class="text-xs ${config.text.replace('800', '600')}">${alert.message}</div>
                        </div>
                    </div>
                    <button onclick="handleAlertClick(${idx})" class="text-xs px-3 py-1 rounded ${config.bg.replace('50', '100')} ${config.text.replace('800', '700')} hover:${config.bg.replace('50', '200')}">${alert.action}</button>
                </div>`;
            })
            .join('');
    }
}