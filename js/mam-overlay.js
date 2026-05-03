/* mam-overlay.js — বর্ষের বিস্তারিত overlay (সব admin পেজে shared) */
'use strict';

/* overlay-কে compositor layer-এ রাখতে will-change inject করা */
(function() {
  const s = document.createElement('style');
  s.textContent = '.cls-overlay{will-change:transform;}.kh-overlay{will-change:transform;}' +
    '.ov-s-name--btn{display:block;width:100%;text-align:left;background:none;border:none;font:inherit;padding:0;margin:0;cursor:pointer;color:inherit;font-size:13px;font-family:"Tiro Bangla",serif;}' +
    '.ov-s-name--btn:hover{text-decoration:underline;color:var(--blue);}';
  document.head.appendChild(s);
})();

/**
 * বর্ষ ওভারলেতে ছাত্রের নামে ক্লিক — MMStudentModal থাকলে প্রোফাইল খোলে।
 * @param {string} sid
 */
function openOvStudent(sid) {
  if (typeof MMStudentModal !== 'undefined' && MMStudentModal && typeof MMStudentModal.open === 'function') {
    MMStudentModal.open(sid);
  }
}
if (typeof window !== 'undefined') window.openOvStudent = openOvStudent;

function _ovNameHtml(sid, nameEsc) {
  if (typeof MMStudentModal !== 'undefined' && MMStudentModal && typeof MMStudentModal.open === 'function') {
    return (
      '<button type="button" class="ov-s-name ov-s-name--btn" onclick="openOvStudent(\'' +
      String(sid).replace(/\\/g, '\\\\').replace(/'/g, "\\'") +
      '\')">' +
      nameEsc +
      '</button>'
    );
  }
  return '<div class="ov-s-name">' + nameEsc + '</div>';
}

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

  _renderOvTab('students');

  /* kh-overlay যদি open থাকে বন্ধ করো */
  const khOv = document.getElementById('kh-overlay');
  if (khOv) { khOv.classList.remove('is-open'); khOv.style.willChange = ''; }

  const overlay = document.getElementById('cls-overlay');
  overlay.style.willChange = 'transform';
  /* double rAF: ensures initial translateX(100%) is painted before transition fires */
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      overlay.classList.add('is-open');
      document.body.style.overflow = 'hidden';
    });
  });
}

function closeClassOverlay() {
  const overlay = document.getElementById('cls-overlay');
  overlay.classList.remove('is-open');
  overlay.style.willChange = '';
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
      <div style="font-family:'Tiro Bangla',serif;font-size:18px;font-weight:700;color:var(--ink);">${_toBn(totalCount)}</div>
    </div>
    <div style="flex:1;background:#fff;border-radius:10px;padding:10px;text-align:center;box-shadow:0 1px 4px rgba(0,0,0,.06);">
      <div style="font-size:10px;color:var(--ink3);">উপস্থিত</div>
      <div style="font-family:'Tiro Bangla',serif;font-size:18px;font-weight:700;color:var(--green);">${_toBn(presentCount)}</div>
    </div>
    <div style="flex:1;background:#fff;border-radius:10px;padding:10px;text-align:center;box-shadow:0 1px 4px rgba(0,0,0,.06);">
      <div style="font-size:10px;color:var(--ink3);">অনুপস্থিত</div>
      <div style="font-family:'Tiro Bangla',serif;font-size:18px;font-weight:700;color:var(--red);">${_toBn(absentCount)}</div>
    </div>
  </div>`;

  const rows = students.map(s => {
    const status = attMap[s.id] || null;
    const label  = status ? _STATUS_LABEL[status] : '—';
    const color  = status ? _STATUS_COLOR[status]  : 'var(--ink3)';
    return `<div class="ov-student-row">
      <div class="ov-s-id">${API.escBn(s.permanent_id || s.roll || '—')}</div>
      ${_ovNameHtml(s.id, API.esc(s.name))}
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
        <div style="font-size:10px;color:var(--ink3);">বর্ষের গড় হুসনুল খুলুক</div>
        <div style="font-family:'Tiro Bangla',serif;font-size:24px;font-weight:700;color:#7c3aed;">${_toBn(avg)}</div>
       </div>`
    : '';

  const rows = students.map(s => {
    const k     = API.Khuluk.getLatest(s.id);
    const score = k ? k.score : null;
    const scn = score === null ? null : Number(score);
    const color = scn === null || Number.isNaN(scn) ? 'var(--ink3)' : (scn >= 81 ? 'var(--green)' : scn >= 60 ? 'var(--gold)' : 'var(--red)');
    const label = score !== null ? _toBn(score) : '—';
    return `<div class="ov-student-row">
      <div class="ov-s-id">${API.escBn(s.permanent_id || s.roll || '—')}</div>
      ${_ovNameHtml(s.id, API.esc(s.name))}
      <div class="ov-s-status" style="color:${color};">${label}</div>
    </div>`;
  }).join('');
  body.innerHTML = avgBanner + `<div class="ov-list">${rows}</div>`;
}

function _renderOvLogs(body) {
  const classPart = API.Logs.getByClass(_ovClassId).map((l) => ({ kind: 'class', l }));
  const students = API.Students.getByClass(_ovClassId);
  const stuPart = [];
  students.forEach((s) => {
    API.Logs.getByStudent(s.id).forEach((l) => {
      stuPart.push({ kind: 'student', l, student: s });
    });
  });
  const merged = classPart.concat(stuPart).sort((a, b) => b.l.date.localeCompare(a.l.date));
  if (!merged.length) {
    body.innerHTML = '<p class="ov-empty">কোনো লগ নেই</p>';
    return;
  }
  const rows = merged
    .map((item) => {
      if (item.kind === 'class') {
        const l = item.l;
        return (
          '<div class="ov-log-row" style="border-left:3px solid var(--gold)">' +
          '<div class="ov-log-date">' +
          API.esc(l.date) +
          ' · ' +
          API.esc(l.by || '') +
          ' <span style="color:var(--ink3);font-size:9px">(বর্ষ)</span></div>' +
          '<div class="ov-log-text">' +
          API.esc(l.text) +
          '</div></div>'
        );
      }
      const l = item.l;
      const sn = item.student && item.student.name ? item.student.name : '—';
      return (
        '<div class="ov-log-row" style="border-left:3px solid #0ea5e9">' +
        '<div class="ov-log-date">' +
        API.esc(l.date) +
        ' · ' +
        API.esc(l.by || '') +
        ' · ' +
        API.esc(sn) +
        ' <span style="color:var(--ink3);font-size:9px">(ছাত্র)</span></div>' +
        '<div class="ov-log-text">' +
        API.esc(l.text) +
        '</div></div>'
      );
    })
    .join('');
  body.innerHTML = `<div class="ov-list">${rows}</div>`;
}

/* ESC key দিয়ে overlay বন্ধ করা */
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') closeClassOverlay();
});
