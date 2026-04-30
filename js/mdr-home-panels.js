(function (global) {
  'use strict';

  const KHADIMIN_KEY = 'mm_khadimin';
  const LEAVES_KEY = 'mm_khadimin_leaves';
  let helpers = { toBn: (n) => String(n), showToast: () => {} };

  const uid = () => 'kh_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  const today = () => new Date().toISOString().slice(0, 10);
  const esc = (s) => global.API && API.esc ? API.esc(s) : String(s || '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  function loadArr(key) {
    if (global.API && API.persistLoadArr) return API.persistLoadArr(key);
    try { return JSON.parse(localStorage.getItem(key)) || []; } catch (e) { return []; }
  }

  function saveArr(key, rows) {
    if (global.API && API.persistSaveArr) API.persistSaveArr(key, rows);
    else localStorage.setItem(key, JSON.stringify(rows || []));
  }

  function injectOnce() {
    if (document.getElementById('mdr-home-panels-style')) return;
    const style = document.createElement('style');
    style.id = 'mdr-home-panels-style';
    style.textContent = `
      #modal-khadimin.modal-bg,#modal-absent-home.modal-bg{align-items:center;justify-content:center;padding:16px}
      #modal-khadimin .modal,#modal-absent-home .modal{width:min(760px,calc(100vw - 32px));height:min(760px,calc(100vh - 32px));max-height:calc(100vh - 32px);border-radius:22px;padding:18px;box-sizing:border-box;overflow:hidden;display:flex;flex-direction:column}
      .kh-panel{flex:1;overflow-y:auto;min-height:0}
      .kh-panel-form{display:none}.kh-panel-form.active{display:block}
      .kh-panel-list{display:block}.kh-panel-list.hidden{display:none}
      .kh-modal-head{display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;flex-shrink:0}
      .kh-modal-title{font-family:'Noto Serif Bengali',serif;font-size:17px;font-weight:800;color:var(--ink)}
      .kh-add-btn{border:none;background:var(--ink);color:var(--gold2);border-radius:10px;padding:8px 14px;font-family:'Noto Sans Bengali',sans-serif;font-size:12px;font-weight:900;cursor:pointer;white-space:nowrap}
      .kh-back-btn{border:1px solid var(--cream3);background:#fff;color:var(--ink2);border-radius:10px;padding:7px 12px;font-family:'Noto Sans Bengali',sans-serif;font-size:12px;font-weight:800;cursor:pointer}
      .kh-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}
      .kh-card,.abs-row-home{background:#fff;border:1px solid rgba(26,18,8,.07);border-radius:14px;box-shadow:0 5px 14px rgba(26,18,8,.06);padding:12px;margin-bottom:8px}
      .kh-name{font-family:'Noto Serif Bengali',serif;font-size:15px;font-weight:800;color:var(--ink)}
      .kh-meta,.kh-note,.abs-meta-home{font-size:11px;color:var(--ink3);line-height:1.6;margin-top:3px}
      .kh-pill{display:inline-block;background:var(--cream2);border-radius:20px;padding:2px 8px;font-size:10px;color:var(--ink3);margin:5px 5px 0 0}
      .kh-actions{display:grid;grid-template-columns:1fr 1fr;gap:7px;margin-top:9px}
      .kh-mini-btn{border:1px solid var(--cream3);background:#fff;border-radius:10px;padding:8px;font-family:'Noto Sans Bengali',sans-serif;font-size:11px;font-weight:800;color:var(--ink2);cursor:pointer}
      .kh-mini-btn.gold{background:var(--ink);color:var(--gold2);border-color:var(--ink)}
      .kh-subtitle{font-size:13px;font-weight:900;color:var(--ink2);margin:14px 0 8px}
      .kh-detail{display:none;background:#fffaf2;border-radius:12px;padding:10px;margin-top:9px}
      .kh-detail.open{display:block}
      .kh-detail input,.kh-detail textarea,.kh-grid input,.kh-grid select,.kh-grid textarea{width:100%;box-sizing:border-box}
      .kh-leave-row{display:flex;justify-content:space-between;gap:8px;border-top:1px solid var(--cream2);padding-top:7px;margin-top:7px;font-size:11px;color:var(--ink2)}
      .abs-row-home{display:flex;align-items:center;gap:12px}
      .abs-rank-home{font-family:'Noto Serif Bengali',serif;font-size:18px;font-weight:800;color:var(--gold);min-width:34px;text-align:center}
      .abs-info-home{flex:1;min-width:0}.abs-name-home{font-size:14px;font-weight:700;color:var(--ink)}
      .abs-days-home{font-family:'Noto Serif Bengali',serif;font-size:17px;font-weight:800;color:var(--red);white-space:nowrap}
      @media(max-width:520px){.kh-grid{grid-template-columns:1fr}.kh-actions{grid-template-columns:1fr}}
    `;
    document.head.appendChild(style);

    const kh = document.createElement('div');
    kh.className = 'modal-bg';
    kh.id = 'modal-khadimin';
    kh.innerHTML = `<div class="modal">
      <!-- তালিকা প্যানেল -->
      <div class="kh-panel kh-panel-list" id="kh-panel-list">
        <div class="kh-modal-head">
          <div class="kh-modal-title">★ খাদিমিন</div>
          <div style="display:flex;gap:8px;align-items:center">
            <button type="button" class="kh-add-btn" onclick="MDRHomePanels.showAddForm()">+ নতুন খাদেম</button>
            <button class="modal-close" onclick="MDRHomePanels.closeKhadimin()">✕</button>
          </div>
        </div>
        <div id="kh-list"></div>
      </div>
      <!-- ফর্ম প্যানেল (লুকানো) -->
      <div class="kh-panel kh-panel-form" id="kh-panel-form">
        <div class="kh-modal-head">
          <button type="button" class="kh-back-btn" onclick="MDRHomePanels.showList()">← তালিকায় ফিরুন</button>
          <span id="kh-form-title" style="font-size:13px;font-weight:800;color:var(--ink)">নতুন খাদেম</span>
          <button class="modal-close" onclick="MDRHomePanels.closeKhadimin()">✕</button>
        </div>
        <input type="hidden" id="kh-id">
        <div class="kh-grid">
          <div class="form-group"><label class="form-label">নাম <span style="color:var(--red)">*</span></label><input class="form-input" id="kh-name" placeholder="খাদেমের নাম"></div>
          <div class="form-group"><label class="form-label">মোবাইল</label><input class="form-input" id="kh-phone" placeholder="০১৭XX-XXXXXX"></div>
          <div class="form-group"><label class="form-label">দায়িত্ব</label><input class="form-input" id="kh-duty" placeholder="রান্নাঘর, পরিষ্কার, দারোয়ান…"></div>
          <div class="form-group"><label class="form-label">যোগদানের তারিখ</label><input class="form-input" id="kh-join" type="date"></div>
          <div class="form-group"><label class="form-label">অবস্থা</label><select class="form-input form-select" id="kh-status"><option value="active">সক্রিয়</option><option value="away">ছুটিতে</option><option value="inactive">নিষ্ক্রিয়</option></select></div>
          <div class="form-group"><label class="form-label">ঠিকানা</label><input class="form-input" id="kh-address" placeholder="ঠিকানা"></div>
          <div class="form-group" style="grid-column:1/-1"><label class="form-label">পূর্ণাঙ্গ বিবরণ</label><textarea class="form-input" id="kh-details" rows="3" placeholder="পরিবার, পরিচয়, জরুরি তথ্য…"></textarea></div>
        </div>
        <button class="submit-btn gold" onclick="MDRHomePanels.saveKhadim()">সংরক্ষণ করুন</button>
      </div>
    </div>`;
    document.body.appendChild(kh);

    const abs = document.createElement('div');
    abs.className = 'modal-bg';
    abs.id = 'modal-absent-home';
    abs.innerHTML = `<div class="modal">
      <div class="modal-title">অনুপস্থিত তালিকা <button class="modal-close" onclick="MDRHomePanels.closeAbsent()">✕</button></div>
      <div class="kh-meta" style="margin-bottom:12px">যাদের কমপক্ষে এক দিন অনুপস্থিত রেকর্ড আছে। বেশি দিন থেকে কম — সাজানো।</div>
      <div id="abs-home-list"></div>
    </div>`;
    document.body.appendChild(abs);
  }

  function getKhadimin() {
    return loadArr(KHADIMIN_KEY);
  }

  function getLeaves() {
    return loadArr(LEAVES_KEY);
  }

  function saveKhadim() {
    const name = document.getElementById('kh-name').value.trim();
    if (!name) { helpers.showToast('নাম লিখুন'); return; }
    const id = document.getElementById('kh-id').value || uid();
    const rows = getKhadimin();
    const row = {
      id,
      name,
      phone: document.getElementById('kh-phone').value.trim(),
      duty: document.getElementById('kh-duty').value.trim(),
      join_date: document.getElementById('kh-join').value,
      status: document.getElementById('kh-status').value,
      address: document.getElementById('kh-address').value.trim(),
      details: document.getElementById('kh-details').value.trim(),
      notes: (rows.find((x) => x.id === id) || {}).notes || [],
    };
    const idx = rows.findIndex((x) => x.id === id);
    if (idx >= 0) rows[idx] = row;
    else rows.push(row);
    saveArr(KHADIMIN_KEY, rows);
    renderKhadimin();
    updateCards();
    showList();
    helpers.showToast('খাদেমের তথ্য সংরক্ষণ হয়েছে ✓');
  }

  function showList() {
    document.getElementById('kh-panel-list').classList.remove('hidden');
    document.getElementById('kh-panel-form').classList.remove('active');
  }

  function showAddForm() {
    clearKhadimForm();
    const t = document.getElementById('kh-form-title');
    if (t) t.textContent = 'নতুন খাদেম';
    document.getElementById('kh-panel-list').classList.add('hidden');
    document.getElementById('kh-panel-form').classList.add('active');
    document.getElementById('kh-panel-form').scrollTop = 0;
  }

  function clearKhadimForm() {
    ['kh-id', 'kh-name', 'kh-phone', 'kh-duty', 'kh-join', 'kh-address', 'kh-details'].forEach((id) => { document.getElementById(id).value = ''; });
    document.getElementById('kh-status').value = 'active';
  }

  function editKhadim(id) {
    const k = getKhadimin().find((x) => x.id === id);
    if (!k) return;
    document.getElementById('kh-id').value = k.id;
    document.getElementById('kh-name').value = k.name || '';
    document.getElementById('kh-phone').value = k.phone || '';
    document.getElementById('kh-duty').value = k.duty || '';
    document.getElementById('kh-join').value = k.join_date || '';
    document.getElementById('kh-status').value = k.status || 'active';
    document.getElementById('kh-address').value = k.address || '';
    document.getElementById('kh-details').value = k.details || '';
    const t = document.getElementById('kh-form-title');
    if (t) t.textContent = esc(k.name) + ' — সম্পাদনা';
    document.getElementById('kh-panel-list').classList.add('hidden');
    document.getElementById('kh-panel-form').classList.add('active');
    document.getElementById('kh-panel-form').scrollTop = 0;
  }

  function daysBetween(from, to) {
    const a = new Date((from || '') + 'T12:00:00');
    const b = new Date((to || from || '') + 'T12:00:00');
    if (Number.isNaN(a.getTime()) || Number.isNaN(b.getTime())) return 0;
    return Math.max(1, Math.round((b - a) / 86400000) + 1);
  }

  function addNote(id) {
    const el = document.getElementById('kh-note-' + id);
    const text = el && el.value.trim();
    if (!text) { helpers.showToast('ঘটনা/নোট লিখুন'); return; }
    const rows = getKhadimin().map((k) => k.id === id ? { ...k, notes: [{ date: today(), text }].concat(k.notes || []) } : k);
    saveArr(KHADIMIN_KEY, rows);
    renderKhadimin();
  }

  function addLeave(id) {
    const from = document.getElementById('kh-leave-from-' + id).value;
    const to = document.getElementById('kh-leave-to-' + id).value || from;
    const reason = document.getElementById('kh-leave-reason-' + id).value.trim();
    if (!from) { helpers.showToast('ছুটি যাওয়ার তারিখ দিন'); return; }
    const leaves = getLeaves();
    leaves.unshift({ id: uid(), khadim_id: id, from, to, reason, days: daysBetween(from, to) });
    saveArr(LEAVES_KEY, leaves);
    renderKhadimin();
    helpers.showToast('ছুটির হিসাব যোগ হয়েছে ✓');
  }

  function renderKhadimin() {
    const rows = getKhadimin();
    const leaves = getLeaves();
    const el = document.getElementById('kh-list');
    if (!el) return;
    if (!rows.length) {
      el.innerHTML = '<div class="empty-state"><span class="empty-icon">🤲</span><div class="empty-text">এখনো কোনো খাদেম যোগ করা হয়নি</div></div>';
      return;
    }
    el.innerHTML = rows.map((k) => {
      const kLeaves = leaves.filter((l) => l.khadim_id === k.id);
      const totalDays = kLeaves.reduce((sum, l) => sum + (Number(l.days) || 0), 0);
      const notes = (k.notes || []).slice(0, 4).map((n) => `<div class="kh-note">${esc(n.date)} — ${esc(n.text)}</div>`).join('') || '<div class="kh-note">কোনো ঘটনা/নোট নেই</div>';
      const leaveRows = kLeaves.slice(0, 6).map((l) => `<div class="kh-leave-row"><span>${esc(l.from)} → ${esc(l.to || l.from)}${l.reason ? ' · ' + esc(l.reason) : ''}</span><strong>${helpers.toBn(l.days)} দিন</strong></div>`).join('') || '<div class="kh-note">কোনো ছুটির রেকর্ড নেই</div>';
      return `<div class="kh-card">
        <div class="kh-name">${esc(k.name)}</div>
        <div class="kh-meta">${esc(k.duty || 'দায়িত্ব লেখা নেই')} · ${esc(k.phone || 'ফোন নেই')}</div>
        <span class="kh-pill">${statusLabel(k.status)}</span><span class="kh-pill">মোট ছুটি ${helpers.toBn(totalDays)} দিন</span>
        <div class="kh-meta">${esc(k.address || 'ঠিকানা নেই')}</div>
        <div class="kh-note">${esc(k.details || 'বিস্তারিত তথ্য নেই')}</div>
        <div class="kh-actions">
          <button class="kh-mini-btn" onclick="MDRHomePanels.editKhadim('${k.id}')">সম্পাদনা</button>
          <button class="kh-mini-btn gold" onclick="MDRHomePanels.toggleDetail('${k.id}')">ঘটনা / ছুটি</button>
        </div>
        <div class="kh-detail" id="kh-detail-${k.id}">
          <div class="kh-subtitle">ঘটনা / অবস্থা</div>
          ${notes}
          <textarea class="form-input" id="kh-note-${k.id}" rows="2" placeholder="নতুন ঘটনা বা অবস্থা লিখুন"></textarea>
          <button class="kh-mini-btn gold" onclick="MDRHomePanels.addNote('${k.id}')">ঘটনা যোগ করুন</button>
          <div class="kh-subtitle">ছুটির হিসাব</div>
          ${leaveRows}
          <div class="kh-grid" style="margin-top:8px">
            <input class="form-input" id="kh-leave-from-${k.id}" type="date" title="গেল">
            <input class="form-input" id="kh-leave-to-${k.id}" type="date" title="এলো">
            <input class="form-input" id="kh-leave-reason-${k.id}" placeholder="কারণ" style="grid-column:1/-1">
          </div>
          <button class="kh-mini-btn gold" onclick="MDRHomePanels.addLeave('${k.id}')">ছুটি যোগ করুন</button>
        </div>
      </div>`;
    }).join('');
  }

  function statusLabel(status) {
    return status === 'away' ? 'ছুটিতে' : status === 'inactive' ? 'নিষ্ক্রিয়' : 'সক্রিয়';
  }

  function toggleDetail(id) {
    const el = document.getElementById('kh-detail-' + id);
    if (el) el.classList.toggle('open');
  }

  function scopeDepts() {
    if (global.MMSession && MMSession.getAllowedMadrasaDepts) {
      const allowed = MMSession.getAllowedMadrasaDepts();
      if (allowed && allowed.length) return allowed;
    }
    return ['kitab', 'maktab'];
  }

  function absentRows() {
    const depts = scopeDepts();
    return depts
      .flatMap((dept) => API.Attendance.getStudentsWithAbsentSortedByDept(dept).map((x) => ({ ...x, dept })))
      .sort((a, b) => (b.absentDays || 0) - (a.absentDays || 0));
  }

  function renderAbsent() {
    const rows = absentRows();
    const el = document.getElementById('abs-home-list');
    if (!el) return;
    if (!rows.length) {
      el.innerHTML = '<div class="empty-state"><span class="empty-icon">✓</span><div class="empty-text">কোনো ছাত্রের অনুপস্থিত রেকর্ড নেই</div></div>';
      return;
    }
    el.innerHTML = rows.map((x, i) => {
      const cls = API.Classes.getById(x.student.class_id);
      const deptLabel = x.dept === 'maktab' ? 'মক্তব বিভাগ' : 'কিতাব বিভাগ';
      return `<div class="abs-row-home">
        <div class="abs-rank-home">${helpers.toBn(i + 1)}</div>
        <div class="abs-info-home">
          <div class="abs-name-home"><button type="button" class="s-name-btn" style="font-size:14px;font-weight:600" onclick="MMStudentModal.open('${x.student.id}')">${esc(x.student.name)}</button></div>
          <div class="abs-meta-home">${esc(cls ? cls.name : '—')} · ${esc(deptLabel)} · রোল ${esc(x.student.roll || '—')}</div>
        </div>
        <div class="abs-days-home">${helpers.toBn(x.absentDays)} দিন</div>
      </div>`;
    }).join('');
  }

  function updateCards() {
    const kh = document.getElementById('m-khadimin');
    const ab = document.getElementById('m-absent-list');
    if (kh) kh.textContent = helpers.toBn(getKhadimin().filter((k) => k.status !== 'inactive').length);
    if (ab && global.API && API.Attendance) ab.textContent = helpers.toBn(absentRows().length);
  }

  function openKhadimin() {
    injectOnce();
    renderKhadimin();
    showList();
    document.getElementById('modal-khadimin').classList.add('open');
  }

  function closeKhadimin() {
    document.getElementById('modal-khadimin').classList.remove('open');
  }

  function openAbsent() {
    injectOnce();
    renderAbsent();
    document.getElementById('modal-absent-home').classList.add('open');
  }

  function closeAbsent() {
    document.getElementById('modal-absent-home').classList.remove('open');
  }

  function init(opts) {
    helpers = { ...helpers, ...(opts || {}) };
    injectOnce();
    updateCards();
  }

  global.MDRHomePanels = {
    init,
    updateCards,
    openKhadimin,
    closeKhadimin,
    showList,
    showAddForm,
    saveKhadim,
    editKhadim,
    toggleDetail,
    addNote,
    addLeave,
    openAbsent,
    closeAbsent,
  };
})(typeof window !== 'undefined' ? window : globalThis);
