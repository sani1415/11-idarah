/* mam-overlay.js — বর্ষের বিস্তারিত overlay (main-admin-madrasa) */
'use strict';

let _ovClassId = null;

const _toBn = n => String(n).replace(/[0-9]/g, d => '০১২৩৪৫৬৭৮৯'[d]);

const _STATUS_LABEL = { present: 'উপস্থিত', absent: 'অনুপস্থিত', leave: 'ছুটি' };
const _STATUS_COLOR = { present: 'var(--green)', absent: 'var(--red)', leave: 'var(--gold)' };

function openClassOverlay(classId) {
  _ovClassId = classId;
  const cls     = API.Classes.getById(classId);
  const teacher = API.Teachers.getByClassId(classId);

  document.getElementById('cls-ov-title').textContent   = cls     ? cls.name      : '—';
  document.getElementById('cls-ov-teacher').textContent = teacher ? teacher.name  : '(শিক্ষক নেই)';

  document.querySelectorAll('.cls-ov-tab').forEach(btn =>
    btn.classList.toggle('active', btn.dataset.tab === 'students')
  );

  document.getElementById('cls-overlay').classList.add('is-open');
  document.body.style.overflow = 'hidden';
  _renderOvTab('students');
}

function closeClassOverlay() {
  document.getElementById('cls-overlay').classList.remove('is-open');
  document.body.style.overflow = '';
}

function switchOvTab(tab) {
  document.querySelectorAll('.cls-ov-tab').forEach(btn =>
    btn.classList.toggle('active', btn.dataset.tab === tab)
  );
  _renderOvTab(tab);
  document.getElementById('cls-ov-body').scrollTop = 0;
}

function _renderOvTab(tab) {
  const body = document.getElementById('cls-ov-body');
  if (!_ovClassId) { body.innerHTML = '<p class="ov-empty">বর্ষ নির্বাচিত হয়নি</p>'; return; }
  switch (tab) {
    case 'students': _renderOvStudents(body); break;
    case 'kitab':    _renderOvKitab(body);    break;
    case 'khuluk':   _renderOvKhuluk(body);   break;
    case 'logs':     _renderOvLogs(body);     break;
    default:         body.innerHTML = '';
  }
}

function _renderOvStudents(body) {
  const iso      = new Date().toISOString().split('T')[0];
  const students = API.Students.getByClass(_ovClassId);
  if (!students.length) {
    body.innerHTML = '<p class="ov-empty">কোনো ছাত্র নেই</p>'; return;
  }
  const attRecs = API.Attendance.getByClassDate(_ovClassId, iso);
  const attMap  = {};
  attRecs.forEach(a => { attMap[a.student_id] = API.Attendance.statusOf(a); });

  const totalCount   = students.length;
  const presentCount = Object.values(attMap).filter(s => s === 'present').length;
  const absentCount  = Object.values(attMap).filter(s => s === 'absent').length;

  const summary = `<div style="display:flex;gap:10px;margin-bottom:12px;">
    <div style="flex:1;background:#fff;border-radius:10px;padding:10px;text-align:center;box-shadow:0 1px 4px rgba(0,0,0,.06);">
      <div style="font-size:10px;color:var(--ink3);">মোট</div>
      <div style="font-family:'Noto Serif Bengali',serif;font-size:18px;font-weight:700;color:var(--ink);">${_toBn(totalCount)}</div>
    </div>
    <div style="flex:1;background:#fff;border-radius:10px;padding:10px;text-align:center;box-shadow:0 1px 4px rgba(0,0,0,.06);">
      <div style="font-size:10px;color:var(--ink3);">উপস্থিত</div>
      <div style="font-family:'Noto Serif Bengali',serif;font-size:18px;font-weight:700;color:var(--green);">${_toBn(presentCount)}</div>
    </div>
    <div style="flex:1;background:#fff;border-radius:10px;padding:10px;text-align:center;box-shadow:0 1px 4px rgba(0,0,0,.06);">
      <div style="font-size:10px;color:var(--ink3);">অনুপস্থিত</div>
      <div style="font-family:'Noto Serif Bengali',serif;font-size:18px;font-weight:700;color:var(--red);">${_toBn(absentCount)}</div>
    </div>
  </div>`;

  const rows = students.map(s => {
    const status = attMap[s.id] || null;
    const label  = status ? _STATUS_LABEL[status] : '—';
    const color  = status ? _STATUS_COLOR[status]  : 'var(--ink3)';
    return `<div class="ov-student-row">
      <div class="ov-s-id">${API.esc(s.roll || s.permanent_id || '—')}</div>
      <div class="ov-s-name">${API.esc(s.name)}</div>
      <div class="ov-s-status" style="color:${color};">${label}</div>
    </div>`;
  }).join('');

  body.innerHTML = summary + `<div class="ov-list">${rows}</div>`;
}

function _renderOvKitab(body) {
  const kitabs = API.KitabProgress.getByClass(_ovClassId);
  if (!kitabs.length) {
    body.innerHTML = '<p class="ov-empty">কোনো কিতাব নেই</p>'; return;
  }
  const rows = kitabs.map(k => {
    const pct     = k.total_pages ? Math.round(k.pages_done / k.total_pages * 100) : 0;
    const pctStr  = k.total_pages ? `${_toBn(k.pages_done)} / ${_toBn(k.total_pages)} পৃষ্ঠা (${_toBn(pct)}%)` : `${_toBn(k.pages_done)} পৃষ্ঠা সম্পন্ন`;
    const barHtml = k.total_pages
      ? `<div class="ov-k-bar"><div class="ov-k-fill" style="width:${pct}%;"></div></div>`
      : '';
    return `<div class="ov-kitab-row">
      <div class="ov-k-name">${API.esc(k.name)}</div>
      <div class="ov-k-pct">${pctStr}</div>
      ${barHtml}
    </div>`;
  }).join('');
  body.innerHTML = `<div class="ov-list">${rows}</div>`;
}

function _renderOvKhuluk(body) {
  const students = API.Students.getByClass(_ovClassId);
  if (!students.length) {
    body.innerHTML = '<p class="ov-empty">কোনো ছাত্র নেই</p>'; return;
  }
  const avg = API.Khuluk.getClassAvg(_ovClassId);
  const avgBanner = avg !== null
    ? `<div style="background:#fff;border-radius:10px;padding:12px;text-align:center;margin-bottom:12px;box-shadow:0 1px 4px rgba(0,0,0,.06);">
        <div style="font-size:10px;color:var(--ink3);">বর্ষের গড় স্কোর</div>
        <div style="font-family:'Noto Serif Bengali',serif;font-size:24px;font-weight:700;color:#7c3aed;">${_toBn(avg)}</div>
       </div>`
    : '';

  const rows = students.map(s => {
    const k     = API.Khuluk.getLatest(s.id);
    const score = k ? k.score : null;
    const color = score === null ? 'var(--ink3)' : (score > 80 ? 'var(--green)' : score >= 60 ? 'var(--gold)' : 'var(--red)');
    const label = score !== null ? _toBn(score) : '—';
    return `<div class="ov-student-row">
      <div class="ov-s-id">${API.esc(s.roll || s.permanent_id || '—')}</div>
      <div class="ov-s-name">${API.esc(s.name)}</div>
      <div class="ov-s-status" style="color:${color};">${label}</div>
    </div>`;
  }).join('');
  body.innerHTML = avgBanner + `<div class="ov-list">${rows}</div>`;
}

function _renderOvLogs(body) {
  const logs = API.Logs.getByClass(_ovClassId);
  if (!logs.length) {
    body.innerHTML = '<p class="ov-empty">কোনো লগ নেই</p>'; return;
  }
  const rows = logs.map(l => `<div class="ov-log-row">
    <div class="ov-log-date">${API.esc(l.date)}</div>
    <div class="ov-log-text">${API.esc(l.text)}</div>
  </div>`).join('');
  body.innerHTML = `<div class="ov-list">${rows}</div>`;
}

/* ESC key দিয়ে overlay বন্ধ করা */
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') closeClassOverlay();
});
