// Logbook and score management for Teachers Corner. This module handles
// switching between class and student logs, opening and closing modals,
// saving logs, editing scores and managing inactive students. It relies on
// the shared state and data loader modules for persistence.

import { state } from './teachers-corner-state.js';
import {
  createLogInDatabase,
  updateLogInDatabase,
  deleteLogFromDatabase,
  updateScoreInDatabase,
  loadTeacherLogsFromDatabase,
  loadStudentScoresFromDatabase,
  loadScoreHistoryFromDatabase,
} from './teachers-corner-data.js';
import { renderTeachersLogbook, renderClassOverview, renderClassStudentList } from './teachers-corner-ui.js';

// Switch between the class log and student log tab. Update the active
// button styling and re-render the logbook.
export function switchLogTab(tab) {
  state.currentLogTab = tab;
  document.querySelectorAll('.logbook-tabs button').forEach((b) => b.classList.remove('active'));
  const btn = document.querySelector(`.logbook-tabs button[onclick="switchLogTab('${tab}')"]`);
  if (btn) btn.classList.add('active');
  renderTeachersLogbook();
}

// Toggle expansion of a specific student's logs in chronological view
export function toggleStudentExpansion(studentName) {
  if (state.expandedStudents.has(studentName)) {
    state.expandedStudents.delete(studentName);
  } else {
    state.expandedStudents.add(studentName);
  }
  renderTeachersLogbook();
}

// Show the modal for adding a new log or editing an existing one. If a
// logId is provided the form will be pre-filled with the existing data.
export function showAddLogModal(logId = '') {
  const modal = document.getElementById('log-modal');
  if (!modal) return;
  const logModalTitle = document.getElementById('log-modal-title');
  const detailsEl = document.getElementById('log-details');
  const typeEl = document.getElementById('log-type');
  const studentSelect = document.getElementById('log-student-select');
  const studentIdHidden = document.getElementById('log-student-id');
  const importantEl = document.getElementById('log-important');
  const followupEl = document.getElementById('log-followup');
  const idEl = document.getElementById('log-id');
  // Reset form
  if (idEl) idEl.value = logId;
  if (logModalTitle) logModalTitle.innerText = logId ? 'বিবরণ সম্পাদনা করুন' : `"${state.currentClass}" এর জন্য নতুন বিবরণ`;
  if (detailsEl) detailsEl.value = '';
  if (typeEl) typeEl.value = 'শিক্ষামূলক';
  if (studentIdHidden) studentIdHidden.value = '';
  if (importantEl) importantEl.checked = false;
  if (followupEl) followupEl.checked = false;
  // Populate student dropdown with active students from current class
  if (studentSelect) {
    studentSelect.innerHTML = '<option value="">সবাই (শ্রেণী বিবরণ)</option>';
    const students = state.allStudents.filter((s) => s.class === state.currentClass && s.status === 'active');
    students.forEach((student) => {
      const option = document.createElement('option');
      option.value = student.id;
      option.textContent = `${student.name} (${student.rollNumber})`;
      studentSelect.appendChild(option);
    });
  }
  // If editing, prefill fields
  if (logId) {
    console.log(`🔍 Looking for log with ID: ${logId}`);
    const allLogs = [];
    const logs = state.teachersLogbook[state.currentClass];
    console.log(`🔍 Logs for class ${state.currentClass}:`, logs);
    if (logs) {
      allLogs.push(...(logs.class_logs || []));
      Object.values(logs.student_logs || {}).forEach((l) => allLogs.push(...l));
    }
    console.log(`🔍 All logs found:`, allLogs);
    const existing = allLogs.find((l) => l.id == logId);
    console.log(`🔍 Existing log found:`, existing);
    if (existing) {
      if (detailsEl) detailsEl.value = existing.details;
      if (typeEl) typeEl.value = existing.type;
      if (importantEl) importantEl.checked = existing.isImportant;
      if (followupEl) followupEl.checked = existing.needsFollowup;
      if (existing.studentId && studentIdHidden) studentIdHidden.value = existing.studentId;
      if (existing.student_id && studentIdHidden) studentIdHidden.value = existing.student_id;
      if (existing.studentId && studentSelect) studentSelect.value = existing.studentId;
      if (existing.student_id && studentSelect) studentSelect.value = existing.student_id;
      console.log(`✅ Log data prefilled successfully`);
    } else {
      console.log(`❌ No existing log found with ID: ${logId}`);
    }
  }
  modal.style.display = 'flex';
}

// Close the log modal and reset its contents.
export function closeLogModal() {
  const modal = document.getElementById('log-modal');
  if (modal) modal.style.display = 'none';
}

// Save a log entry. If the hidden log-id field is populated the
// existing log will be updated; otherwise a new log is created.
export async function saveLogEntry() {
  const logIdEl = document.getElementById('log-id');
  const detailsEl = document.getElementById('log-details');
  const typeEl = document.getElementById('log-type');
  const studentSelect = document.getElementById('log-student-select');
  const studentIdHidden = document.getElementById('log-student-id');
  const importantEl = document.getElementById('log-important');
  const followupEl = document.getElementById('log-followup');
  if (!detailsEl || !typeEl || !importantEl || !followupEl) return;
  const logId = logIdEl ? logIdEl.value : '';
  const studentId = studentIdHidden && studentIdHidden.value ? studentIdHidden.value : studentSelect && studentSelect.value ? studentSelect.value : null;
  
  const logData = {
    class_name: state.currentClass,
    student_id: studentId,
    log_type: typeEl.value,
    details: detailsEl.value.trim(),
    is_important: importantEl.checked,
    needs_followup: followupEl.checked,
  };
  
  if (!logData.details.trim()) {
    alert('অনুগ্রহ করে বিস্তারিত লিখুন।');
    return;
  }
  let success;
  if (logId) {
    success = await updateLogInDatabase(logId, logData);
  } else {
    success = await createLogInDatabase(logData);
  }
  if (success) {
    await loadTeacherLogsFromDatabase(state.currentClass);
    renderTeachersLogbook();
    closeLogModal();
    alert(logId ? 'বিবরণ সফলভাবে আপডেট হয়েছে।' : 'বিবরণ সফলভাবে সংরক্ষিত হয়েছে।');
  } else {
    alert('বিবরণ সংরক্ষণ করতে সমস্যা হয়েছে।');
  }
}

// Open the score editing modal with the current score filled in.
// Loads and displays score history for the student.
export async function editHusnulKhuluk(studentId, currentScore) {
  const scoreModal = document.getElementById('score-modal');
  if (!scoreModal) return;
  const idEl = document.getElementById('score-student-id');
  const scoreEl = document.getElementById('new-score');
  const reasonEl = document.getElementById('score-change-reason');
  const historyList = document.getElementById('score-history-list');
  
  if (idEl) idEl.value = studentId;
  if (scoreEl) scoreEl.value = currentScore;
  if (reasonEl) reasonEl.value = '';
  
  // Load and display score history
  if (historyList) {
    historyList.innerHTML = '<div class="text-center text-gray-500 text-sm py-4">ইতিহাস লোড হচ্ছে...</div>';
    
    try {
      await loadScoreHistoryFromDatabase(studentId);
      const scoreHistory = state.scoreChangeHistory[studentId] || [];
      
      if (scoreHistory.length > 0) {
        historyList.innerHTML = scoreHistory.map(entry => `
          <div class="bg-white p-3 rounded border-l-4 border-green-500 text-sm">
            <div class="flex justify-between items-start mb-1">
              <span class="text-xs font-medium text-gray-700">${new Date(entry.date).toLocaleDateString('bn-BD')}</span>
              <span class="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-800">${entry.oldScore} → ${entry.newScore}</span>
            </div>
            ${entry.reason ? `<p class="text-xs text-gray-600 mt-1"><strong>কারণ:</strong> ${entry.reason}</p>` : ''}
            <p class="text-xs text-gray-500 mt-1">পরিবর্তন করেছেন: ${entry.changedBy}</p>
          </div>
        `).join('');
      } else {
        historyList.innerHTML = '<div class="text-center text-gray-500 text-sm py-4">কোন হুসনুল খুলুক পরিবর্তনের ইতিহাস নেই</div>';
      }
    } catch (error) {
      console.error('❌ Error loading score history:', error);
      historyList.innerHTML = '<div class="text-center text-red-500 text-sm py-4">ইতিহাস লোড করতে সমস্যা হয়েছে</div>';
    }
  }
  
  scoreModal.style.display = 'flex';
}

export function closeScoreModal() {
  const modal = document.getElementById('score-modal');
  if (modal) modal.style.display = 'none';
}

// Save a new score after validating the input. Calls the API and
// refreshes the score history and student list.
export async function saveNewScore() {
  const idEl = document.getElementById('score-student-id');
  const scoreEl = document.getElementById('new-score');
  const reasonEl = document.getElementById('score-change-reason');
  if (!idEl || !scoreEl || !reasonEl) return;
  const studentId = idEl.value;
  const newScore = parseInt(scoreEl.value, 10);
  const reason = reasonEl.value;
  if (isNaN(newScore) || newScore < 0 || newScore > 100) {
    alert('অনুগ্রহ করে ০ থেকে ১০০ এর মধ্যে একটি নাম্বার দিন।');
    return;
  }
  const success = await updateScoreInDatabase(studentId, newScore, reason);
  if (success) {
    await loadScoreHistoryFromDatabase(studentId);
    const activeStudents = state.allStudents.filter((s) => s.class === state.currentClass && s.status !== 'inactive');
    renderClassStudentList(activeStudents);
    renderClassOverview(activeStudents);
    closeScoreModal();
    alert('হুসনুল খুলুক সফলভাবে আপডেট হয়েছে।');
  } else {
    alert('হুসনুল খুলুক আপডেট করতে সমস্যা হয়েছে।');
  }
}

// Display a modal listing inactive students for the current class.
export function showInactiveStudentsModal() {
  const modal = document.getElementById('inactive-students-modal');
  const listContainer = document.getElementById('inactive-students-list');
  if (!modal || !listContainer || !state.currentClass) return;
  const inactive = state.allStudents.filter((s) => s.class === state.currentClass && s.status === 'inactive');
  if (inactive.length === 0) {
    listContainer.innerHTML = `<div class="text-center p-8 text-gray-500"><i class="fas fa-info-circle text-4xl mb-4"></i><p>এই শ্রেণীতে কোনো বিদায়ী ছাত্র নেই।</p></div>`;
  } else {
    listContainer.innerHTML = inactive
      .map((student) => {
        return `<div class="bg-gray-50 p-4 rounded-lg border-l-4 border-orange-500"><div class="flex justify-between items-start"><div class="flex-1"><h4 class="font-semibold text-gray-800"><span class="clickable-name" onclick="showStudentDetail('${student.id}', 'teachers-corner')" style="cursor: pointer; color: #3498db;">${student.name} বিন ${student.fatherName}</span></h4><div class="text-sm text-gray-600 mt-1"><span class="mr-4">পরিচিতি: ${student.rollNumber}</span><span class="mr-4">মোবাইল: ${student.mobileNumber}</span><span>জেলা: ${student.district}, ${student.upazila}</span></div><div class="text-xs text-orange-600 mt-2 font-medium"><i class="fas fa-exclamation-triangle"></i> বিদায়ী অবস্থায় ${student.inactivationDate ? ` (${student.inactivationDate} থেকে)` : ''}</div></div></div></div>`;
      })
      .join('');
  }
  modal.style.display = 'flex';
}

export function closeInactiveStudentsModal() {
  const modal = document.getElementById('inactive-students-modal');
  if (modal) modal.style.display = 'none';
}

// Edit an existing log by its ID. Prefills the modal and then calls
// showAddLogModal() with the ID so that saveLogEntry knows to update.
export function editLog(logId) {
  console.log(`🔧 editLog called with ID: ${logId}`);
  console.log(`🔍 Current class: ${state.currentClass}`);
  console.log(`🔍 Available logs:`, state.teachersLogbook[state.currentClass]);
  
  // Debug: Check if we have the right data structure
  if (state.currentClass && state.teachersLogbook[state.currentClass]) {
    const logs = state.teachersLogbook[state.currentClass];
    console.log(`🔍 Class logs count: ${logs.class_logs?.length || 0}`);
    console.log(`🔍 Student logs count: ${Object.keys(logs.student_logs || {}).length}`);
    
    // Check if the log exists in class_logs
    const classLog = logs.class_logs?.find(l => l.id == logId);
    if (classLog) {
      console.log(`✅ Found log in class_logs:`, classLog);
    } else {
      console.log(`❌ Log not found in class_logs`);
      
      // Check student_logs
      let foundInStudentLogs = false;
      for (const studentId in logs.student_logs) {
        const studentLog = logs.student_logs[studentId].find(l => l.id == logId);
        if (studentLog) {
          console.log(`✅ Found log in student_logs for student ${studentId}:`, studentLog);
          foundInStudentLogs = true;
          break;
        }
      }
      if (!foundInStudentLogs) {
        console.log(`❌ Log not found in student_logs either`);
      }
    }
  } else {
    console.log(`❌ No logs data available for class: ${state.currentClass}`);
  }
  
  showAddLogModal(logId);
}

// Delete a log and refresh the logbook. A confirmation prompt is
// displayed before deletion.
export async function deleteLog(logId) {
  if (!confirm('আপনি কি নিশ্চিত যে আপনি এই বিবরণটি মুছতে চান?')) return;
  const success = await deleteLogFromDatabase(logId, state.currentClass);
  if (success) {
    await loadTeacherLogsFromDatabase(state.currentClass);
    renderTeachersLogbook();
    alert('বিবরণ সফলভাবে মুছে ফেলা হয়েছে।');
  } else {
    alert('বিবরণ মুছতে সমস্যা হয়েছে।');
  }
}

// Handle clicks on alert actions. The alerts array is stored on
// window.currentAlerts by the UI module. This function calls the
// onClick handler associated with the alert at the given index.
export function handleAlertClick(index) {
  if (!Array.isArray(window.currentAlerts)) return;
  const alert = window.currentAlerts[index];
  if (alert && typeof alert.onClick === 'function') {
    alert.onClick();
  }
}