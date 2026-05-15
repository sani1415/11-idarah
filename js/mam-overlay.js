/* mam-overlay.js — বর্ষের বিস্তারিত overlay (সব admin পেজে shared) */
'use strict';

/* overlay-কে compositor layer-এ রাখতে will-change inject করা */
(function() {
  const s = document.createElement('style');
  s.textContent = '.cls-overlay{will-change:transform;}.kh-overlay{will-change:transform;}' +
    '.ov-s-name--btn{display:block;width:100%;text-align:left;background:none;border:none;font:inherit;padding:0;margin:0;cursor:pointer;color:inherit;font-size:13px;font-family:"Tiro Bangla",serif;}' +
    '.ov-s-name--btn:hover{text-decoration:underline;color:var(--blue);}' +
    '.ov-k-name--btn{display:block;width:100%;text-align:left;background:none;border:0;padding:0;margin:0;font:inherit;font-family:"Tiro Bangla",serif;font-weight:700;color:var(--ink2);cursor:pointer;}' +
    '.ov-k-name--btn:hover{text-decoration:underline;color:var(--blue);}' +
    '.ov-history-modal{position:fixed;inset:0;z-index:420;background:rgba(20,14,6,.38);display:none;align-items:center;justify-content:center;padding:18px;box-sizing:border-box;}' +
    '.ov-history-modal.open{display:flex;}' +
    '.ov-history-card{width:min(520px,100%);max-height:82vh;overflow:auto;background:var(--paper,#fff);border-radius:14px;box-shadow:0 24px 80px rgba(0,0,0,.24);padding:16px;box-sizing:border-box;}' +
    '.ov-history-head{display:flex;align-items:flex-start;justify-content:space-between;gap:12px;margin-bottom:12px;}' +
    '.ov-history-title{font-family:"Tiro Bangla",serif;font-size:17px;font-weight:700;color:var(--ink2);line-height:1.35;}' +
    '.ov-history-close{border:0;background:var(--cream2,#f6efe3);color:var(--ink2);border-radius:999px;width:32px;height:32px;cursor:pointer;font-size:18px;line-height:1;}' +
    '.ov-history-row{background:var(--cream,#faf6ef);border:1px solid rgba(26,18,8,.06);border-radius:10px;padding:10px 12px;margin-bottom:8px;}' +
    '.ov-history-date{font-size:11px;color:var(--ink3);margin-bottom:3px;}' +
    '.ov-history-main{font-size:13px;font-weight:700;color:var(--ink2);}' +
    '.ov-history-note{font-size:12px;color:var(--ink3);margin-top:4px;line-height:1.45;}' +
    '.ov-history-empty{font-size:13px;color:var(--ink3);text-align:center;padding:22px 8px;}';
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

function _ovJsArg(v) {
  return String(v || '').replace(/\\/g, '\\\\').replace(/'/g, "\\'");
}

function _ovFmtDate(d) {
  if (!d) return '';
  const p = String(d).slice(0, 10).split('-');
  return p.length === 3 ? p[2] + '/' + p[1] + '/' + p[0] : String(d);
}

function _ovBarPct(done, total) {
  const d = Number(done) || 0;
  const t = Number(total) || 0;
  if (!t) return d ? 100 : 0;
  return Math.max(0, Math.min(100, d / t * 100));
}

function _ensureOvDarsHistoryModal() {
  if (document.getElementById('ov-dars-history-modal')) return;
  document.body.insertAdjacentHTML('beforeend',
    '<div class="ov-history-modal" id="ov-dars-history-modal" onclick="if(event.target===this) closeOvBookHistory()">' +
      '<div class="ov-history-card" role="dialog" aria-modal="true" aria-labelledby="ov-dars-history-title">' +
        '<div class="ov-history-head">' +
          '<div class="ov-history-title" id="ov-dars-history-title">কিতাবের অগ্রগতি ইতিহাস</div>' +
          '<button type="button" class="ov-history-close" onclick="closeOvBookHistory()" aria-label="বন্ধ করুন">×</button>' +
        '</div>' +
        '<div id="ov-dars-history-body"></div>' +
      '</div>' +
    '</div>'
  );
}

function openOvBookHistory(bookId) {
  if (!_ovClassId) return;
  const book = API.KitabProgress.getByClass(_ovClassId).find(k => String(k.id) === String(bookId));
  if (!book) return;
  _ensureOvDarsHistoryModal();
  const total = Number(book.total_pages) || 0;
  document.getElementById('ov-dars-history-title').textContent = (book.name || 'কিতাব') + ' — অগ্রগতি ইতিহাস';
  const hist = Array.isArray(book.history) ? book.history.slice() : [];
  hist.sort((a, b) => String(b.date || '').localeCompare(String(a.date || '')) || String(b.id || '').localeCompare(String(a.id || '')));
  document.getElementById('ov-dars-history-body').innerHTML = hist.length ? hist.map(h => {
    const done = Number(h.pages_done) || 0;
    const pct = Math.round(_ovBarPct(done, total));
    return '<div class="ov-history-row">' +
      '<div class="ov-history-date">' + API.esc(_ovFmtDate(h.date)) + (h.by ? ' · ' + API.esc(h.by) : '') + '</div>' +
      '<div class="ov-history-main">' + _toBn(done) + ' পৃষ্ঠা' + (total ? ' / ' + _toBn(total) : '') + ' · ' + _toBn(pct) + '%</div>' +
      (h.note ? '<div class="ov-history-note">' + API.esc(h.note) + '</div>' : '') +
    '</div>';
  }).join('') : '<div class="ov-history-empty">এই কিতাবের কোনো অগ্রগতি ইতিহাস নেই।</div>';
  document.getElementById('ov-dars-history-modal').classList.add('open');
}

function closeOvBookHistory() {
  const modal = document.getElementById('ov-dars-history-modal');
  if (modal) modal.classList.remove('open');
}

if (typeof window !== 'undefined') {
  window.openOvBookHistory = openOvBookHistory;
  window.closeOvBookHistory = closeOvBookHistory;
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
  closeOvBookHistory();
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
    const kh = API.Khuluk.getLatest(s.id);
    const score = kh ? Number(kh.score) : null;
    const khColor = score === null || Number.isNaN(score) ? 'var(--ink3)' : (score >= 81 ? 'var(--green)' : score >= 60 ? 'var(--gold)' : 'var(--red)');
    const khLabel = score === null || Number.isNaN(score) ? '—' : _toBn(score);
    return `<div class="ov-student-row">
      <div class="ov-s-id">${API.escBn(s.permanent_id || s.roll || '—')}</div>
      ${_ovNameHtml(s.id, API.esc(s.name))}
      <div class="ov-s-status" style="color:${khColor};" title="হুসনুল খুলুক">${khLabel}</div>
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
      <button type="button" class="ov-k-name ov-k-name--btn" onclick="openOvBookHistory('${_ovJsArg(k.id)}')">${API.esc(k.name)}</button>
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
  if (e.key !== 'Escape') return;
  const hist = document.getElementById('ov-dars-history-modal');
  if (hist && hist.classList.contains('open')) {
    closeOvBookHistory();
    return;
  }
  closeClassOverlay();
});
