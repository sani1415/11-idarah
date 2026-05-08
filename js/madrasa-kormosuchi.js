/* ════════════════════════════════════════════
   কর্মসূচি হিসাব — madrasa-kormosuchi.js
   দফতর দায়িত্বশীলের বিশেষ কর্মসূচি আয়-ব্যয় ব্যবস্থাপনা
   ════════════════════════════════════════════ */

const PKEY = 'mm_programs_v1';

/* ── HELPERS ── */
const todayISO = () => new Date().toISOString().split('T')[0];
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
const bn = x => String(x ?? 0).replace(/[0-9]/g, d => '০১২৩৪৫৬৭৮৯'[d]);
const money = x => '৳' + bn(Number(x || 0).toLocaleString('en-US'));
const fmtDate = d => {
  if (!d) return '';
  const [y, m, dd] = d.split('-');
  return bn(dd) + '/' + bn(m) + '/' + bn(y.slice(2));
};

/* ── DEFAULT DATA ── */
const DEFAULTS = () => ({
  templates: {
    qurbani: {
      label: 'কোরবানি',
      note: 'পূর্ণ ভাগ ও আংশিক টাকার হিসাব।',
      incomeTypes: ['পূর্ণ ভাগ', 'আংশিক টাকা'],
      expenseTypes: ['গরু ক্রয়', 'পরিবহন', 'খাদ্য', 'কসাই / জবাই', 'অন্যান্য'],
    },
    mahfil: {
      label: 'মাহফিল',
      note: 'মাহফিলের অনুদান ও ব্যয়।',
      incomeTypes: ['অনুদান', 'কালেকশন', 'স্পন্সর'],
      expenseTypes: ['মাইক / সাউন্ড', 'খাবার', 'মেহমানদারি', 'স্টেজ', 'অন্যান্য'],
    },
    construction: {
      label: 'নির্মাণ',
      note: 'নির্মাণ ও মেরামতের আয়-ব্যয়।',
      incomeTypes: ['অনুদান', 'প্রতিশ্রুতি আদায়', 'বিশেষ ফান্ড'],
      expenseTypes: ['সিমেন্ট', 'বালু', 'ইট', 'রড', 'মিস্ত্রি / শ্রমিক', 'অন্যান্য'],
    },
    trip: {
      label: 'সফর',
      note: 'সফরের ফি ও ব্যয়।',
      incomeTypes: ['অংশগ্রহণ ফি', 'অনুদান'],
      expenseTypes: ['গাড়ি', 'খাবার', 'টিকিট', 'থাকা', 'অন্যান্য'],
    },
    custom: {
      label: 'কাস্টম',
      note: 'সাধারণ কর্মসূচির হিসাব।',
      incomeTypes: ['আয়', 'অনুদান', 'অন্যান্য'],
      expenseTypes: ['ব্যয়', 'অন্যান্য'],
    },
  },
  programs: [
    { id: 'q1', name: 'কোরবানি আয়োজন ১৪৪৭', template: 'qurbani', status: 'চলমান', date: '', note: 'প্রতি পূর্ণ ভাগ ১৭,০০০ টাকা।' },
    { id: 'm1', name: 'বার্ষিক মাহফিল ১৪৪৭', template: 'mahfil', status: 'পরিকল্পনা', date: '', note: '' },
  ],
  income: {
    q1: [
      { id: uid(), date: todayISO(), type: 'পূর্ণ ভাগ', personType: 'সাধারণ মানুষ', name: 'হাজী আবু বকর', share: 2, amount: 34000, ref: '017xx' },
      { id: uid(), date: todayISO(), type: 'আংশিক টাকা', personType: 'সাধারণ মানুষ', name: 'সাধারণ অনুদান', share: 0, amount: 3000, ref: 'নগদ' },
    ],
    m1: [],
  },
  expense: {
    q1: [
      { id: uid(), date: todayISO(), type: 'গরু ক্রয়', amount: 92000, note: '১টি গরু বুকিং' },
      { id: uid(), date: todayISO(), type: 'পরিবহন', amount: 3500, note: 'হাট থেকে আনা' },
    ],
    m1: [],
  },
});

/* ── STATE ── */
let db;
let active;
let activeTab = 'summary';
let rptRange  = 'all';
let _confirmCb = null;

/* ── DB ── */
function dbLoad() {
  try { db = JSON.parse(localStorage.getItem(PKEY)) || null; } catch { db = null; }
  if (!db || !Array.isArray(db.programs) || !db.programs.length) db = DEFAULTS();
  if (!db.income)    db.income = {};
  if (!db.expense)   db.expense = {};
  if (!db.templates) db.templates = DEFAULTS().templates;
  if (!active || !db.programs.find(p => p.id === active)) active = db.programs[0].id;
}
function dbSave() { localStorage.setItem(PKEY, JSON.stringify(db)); }

/* ── ACCESSORS ── */
function program()  { return db.programs.find(p => p.id === active) || db.programs[0]; }
function tmpl()     { return db.templates[program().template] || db.templates.custom; }
function incomes()  { return db.income[active]  || (db.income[active]  = []); }
function expenses() { return db.expense[active] || (db.expense[active] = []); }

function stats() {
  const inc = incomes(), exp = expenses();
  const income = inc.reduce((s, x) => s + Number(x.amount || 0), 0);
  const cost   = exp.reduce((s, x) => s + Number(x.amount || 0), 0);
  const shares = inc.reduce((s, x) => s + Number(x.share  || 0), 0);
  return { income, cost, balance: income - cost, shares, incCount: inc.length };
}

/* ══════════════════════════════════════════
   RENDER
══════════════════════════════════════════ */
function renderPage() {
  const p = program(), t = tmpl(), s = stats();
  const sel = document.getElementById('prog-select');
  sel.innerHTML = db.programs.map(x =>
    `<option value="${x.id}"${x.id === active ? ' selected' : ''}>${API.esc(x.name)}</option>`
  ).join('');

  document.getElementById('prog-title').textContent = p.name;
  document.getElementById('prog-note').textContent  = p.note || t.note;
  document.getElementById('prog-tag').textContent   = t.label + ' · ' + p.status + (p.date ? ' · ' + p.date : '');

  const isQ = p.template === 'qurbani';
  document.getElementById('kpi-grid').innerHTML = [
    ['মোট আয়',   money(s.income),  'g'],
    ['মোট ব্যয়', money(s.cost),    'r'],
    ['অবশিষ্ট',  money(s.balance), s.balance >= 0 ? 'g' : 'r'],
    [isQ ? 'পূর্ণ ভাগ' : 'আয় এন্ট্রি', isQ ? bn(s.shares) + ' ভাগ' : bn(s.incCount) + 'টি', 'o'],
  ].map(([lbl, val, cls]) =>
    `<div class="kpi-card"><span>${lbl}</span><b class="${cls}">${API.esc(val)}</b></div>`
  ).join('');

  renderRoot();
}

function renderRoot() {
  const el = document.getElementById('root');
  if      (activeTab === 'summary') el.innerHTML = renderSummary();
  else if (activeTab === 'income')  el.innerHTML = renderIncomeTab();
  else if (activeTab === 'expense') el.innerHTML = renderExpenseTab();
  else                               el.innerHTML = renderReport();
}

/* ── SUMMARY TAB ── */
function renderSummary() {
  const s = stats(), p = program();
  const rows = [
    ['মোট আয়',   'সব ধরনের আয় মিলিয়ে',  money(s.income),  ''],
    ['মোট ব্যয়', 'সব খরচ মিলিয়ে',        money(s.cost),    ''],
    ['অবশিষ্ট',  'আয় − ব্যয়',            money(s.balance), ''],
  ];
  if (p.template === 'qurbani') rows.push(['পূর্ণ ভাগ', 'শুধু পূর্ণ ভাগের হিসাব', bn(s.shares) + ' ভাগ', '']);
  return `<div class="stt-card">${rows.map(([ttl, sub, val]) =>
    `<div class="mini-row">
       <div><div class="mini-label">${ttl}</div><div class="mini-sub">${sub}</div></div>
       <b style="font-family:'Tiro Bangla',serif;font-size:15px;font-weight:800">${API.esc(val)}</b>
     </div>`
  ).join('')}</div>`;
}

/* ── INCOME TAB ── */
function renderIncomeTab() {
  const rows = incomes();
  if (!rows.length) return '<div class="empty-state"><span class="empty-icon">💰</span><div class="empty-text">এখনো কোনো আয় নেই</div></div>';
  return `<div class="tbl-wrap"><table class="tbl">
    <thead><tr>
      <th>তারিখ</th><th>ধরন</th><th>ব্যক্তি</th><th>নাম</th><th>ভাগ</th><th>টাকা</th><th>পরিচিতি</th><th></th>
    </tr></thead>
    <tbody>${rows.map(x => `<tr>
      <td style="color:var(--ink3)">${fmtDate(x.date)}</td>
      <td>${API.esc(x.type)}</td>
      <td style="color:var(--ink3)">${API.esc(x.personType || '')}</td>
      <td><b>${API.esc(x.name)}</b></td>
      <td style="text-align:center">${x.share ? bn(x.share) : '—'}</td>
      <td style="color:var(--green);font-weight:700">${money(x.amount)}</td>
      <td style="color:var(--ink3)">${API.esc(x.ref || '')}</td>
      <td><div class="act-btns">
        <button class="tbl-act" onclick="openIncome('${x.id}')">এডিট</button>
        <button class="tbl-del" onclick="askDel('income','${x.id}')">✕</button>
      </div></td>
    </tr>`).join('')}</tbody>
  </table></div>`;
}

/* ── EXPENSE TAB ── */
function renderExpenseTab() {
  const rows = expenses();
  if (!rows.length) return '<div class="empty-state"><span class="empty-icon">💸</span><div class="empty-text">এখনো কোনো ব্যয় নেই</div></div>';
  return `<div class="tbl-wrap"><table class="tbl">
    <thead><tr>
      <th>তারিখ</th><th>খাত</th><th>বিবরণ</th><th>টাকা</th><th></th>
    </tr></thead>
    <tbody>${rows.map(x => `<tr>
      <td style="color:var(--ink3)">${fmtDate(x.date)}</td>
      <td>${API.esc(x.type)}</td>
      <td style="color:var(--ink3)">${API.esc(x.note || '')}</td>
      <td style="color:var(--red);font-weight:700">${money(x.amount)}</td>
      <td><div class="act-btns">
        <button class="tbl-act" onclick="openExpense('${x.id}')">এডিট</button>
        <button class="tbl-del" onclick="askDel('expense','${x.id}')">✕</button>
      </div></td>
    </tr>`).join('')}</tbody>
  </table></div>`;
}

/* ── REPORT TAB ── */
function getReportWindow() {
  if (rptRange === 'month') {
    const d = new Date(), y = d.getFullYear(), m = String(d.getMonth() + 1).padStart(2, '0');
    return { from: y + '-' + m + '-01', to: todayISO() };
  }
  if (rptRange === 'custom') {
    const from = document.getElementById('rpt-from') ? document.getElementById('rpt-from').value : '';
    const to   = document.getElementById('rpt-to')   ? document.getElementById('rpt-to').value   : todayISO();
    return { from: from || todayISO().slice(0, 7) + '-01', to: to || todayISO() };
  }
  return null;
}

function renderReport() {
  const win = getReportWindow();
  let fInc = incomes().slice(), fExp = expenses().slice();
  if (win) {
    fInc = fInc.filter(x => x.date >= win.from && x.date <= win.to);
    fExp = fExp.filter(x => x.date >= win.from && x.date <= win.to);
  }
  const incTotal = fInc.reduce((s, x) => s + Number(x.amount || 0), 0);
  const expTotal = fExp.reduce((s, x) => s + Number(x.amount || 0), 0);
  const bal = incTotal - expTotal;

  const byInc = {}, byExp = {};
  fInc.forEach(x => { byInc[x.type] = (byInc[x.type] || 0) + Number(x.amount || 0); });
  fExp.forEach(x => { byExp[x.type] = (byExp[x.type] || 0) + Number(x.amount || 0); });

  const customRow = rptRange === 'custom' ? `
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:10px">
      <div class="form-group"><label class="form-label">শুরু</label><input class="form-input" type="date" id="rpt-from" onchange="renderRoot()"></div>
      <div class="form-group"><label class="form-label">শেষ</label><input class="form-input" type="date" id="rpt-to" onchange="renderRoot()"></div>
    </div>` : '';

  const barBtns = ['all', 'month', 'custom'].map(r =>
    `<button class="${r === rptRange ? 'active' : ''}" onclick="setRptRange('${r}')">${r === 'all' ? 'সব' : r === 'month' ? 'এই মাস' : 'কাস্টম'}</button>`
  ).join('');

  const incRows = Object.entries(byInc).sort((a, b) => b[1] - a[1]).map(([k, v]) =>
    `<div class="mini-row"><span style="font-size:13px">${API.esc(k)}</span><b style="font-family:'Tiro Bangla',serif;color:var(--green);font-weight:800">${money(v)}</b></div>`
  ).join('') || '<div style="color:var(--ink3);font-size:12px;text-align:center;padding:8px">এই সময়ে কোনো আয় নেই</div>';

  const expRows = Object.entries(byExp).sort((a, b) => b[1] - a[1]).map(([k, v]) =>
    `<div class="mini-row"><span style="font-size:13px">${API.esc(k)}</span><b style="font-family:'Tiro Bangla',serif;color:var(--red);font-weight:800">${money(v)}</b></div>`
  ).join('') || '<div style="color:var(--ink3);font-size:12px;text-align:center;padding:8px">এই সময়ে কোনো ব্যয় নেই</div>';

  return `
    <div class="rpt-bar">${barBtns}</div>
    ${customRow}
    <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-bottom:10px">
      <div class="kpi-card"><span>আয়</span><b class="g">${money(incTotal)}</b></div>
      <div class="kpi-card"><span>ব্যয়</span><b class="r">${money(expTotal)}</b></div>
      <div class="kpi-card"><span>অবশিষ্ট</span><b class="${bal >= 0 ? 'g' : 'r'}">${money(bal)}</b></div>
    </div>
    <div class="stt-card" style="margin-bottom:8px">
      <div style="font-size:12px;font-weight:700;color:var(--ink2);margin-bottom:8px">আয়ের ধরনভিত্তিক</div>
      ${incRows}
    </div>
    <div class="stt-card">
      <div style="font-size:12px;font-weight:700;color:var(--ink2);margin-bottom:8px">ব্যয়ের খাতভিত্তিক</div>
      ${expRows}
    </div>`;
}

/* ══════════════════════════════════════════
   PROGRAM MODAL
══════════════════════════════════════════ */
function populateTmplSelect(selId, selected) {
  document.getElementById(selId).innerHTML = Object.keys(db.templates).map(k =>
    `<option value="${k}"${k === selected ? ' selected' : ''}>${API.esc(db.templates[k].label)}</option>`
  ).join('');
}

function newProgram() {
  document.getElementById('prog-modal-title').textContent = 'নতুন কর্মসূচি';
  document.getElementById('prog-edit-id').value   = '';
  document.getElementById('prog-name').value      = '';
  document.getElementById('prog-status').value    = 'চলমান';
  document.getElementById('prog-date').value      = '';
  document.getElementById('prog-note-inp').value  = '';
  document.getElementById('prog-del-btn').style.display = 'none';
  populateTmplSelect('prog-tmpl', 'qurbani');
  openModal('program');
}

function editProgram() {
  const p = program();
  document.getElementById('prog-modal-title').textContent = 'কর্মসূচি এডিট';
  document.getElementById('prog-edit-id').value   = p.id;
  document.getElementById('prog-name').value      = p.name;
  document.getElementById('prog-status').value    = p.status;
  document.getElementById('prog-date').value      = p.date || '';
  document.getElementById('prog-note-inp').value  = p.note || '';
  document.getElementById('prog-del-btn').style.display = '';
  populateTmplSelect('prog-tmpl', p.template);
  openModal('program');
}

function onProgTmplChange() {
  if (!document.getElementById('prog-edit-id').value) {
    const key = document.getElementById('prog-tmpl').value;
    document.getElementById('prog-note-inp').value = (db.templates[key] || {}).note || '';
  }
}

function saveProgram() {
  const name = document.getElementById('prog-name').value.trim();
  if (!name) { showToast('কর্মসূচির নাম দিন'); return; }
  const id   = document.getElementById('prog-edit-id').value;
  const data = {
    name,
    template: document.getElementById('prog-tmpl').value,
    status:   document.getElementById('prog-status').value,
    date:     document.getElementById('prog-date').value,
    note:     document.getElementById('prog-note-inp').value,
  };
  if (id) {
    Object.assign(db.programs.find(p => p.id === id), data);
  } else {
    const nid = uid();
    db.programs.push({ id: nid, ...data });
    db.income[nid]  = [];
    db.expense[nid] = [];
    active = nid;
  }
  dbSave(); closeModal('program'); renderPage();
  showToast('কর্মসূচি সংরক্ষিত হয়েছে ✓');
}

function deleteProgram() {
  const id = document.getElementById('prog-edit-id').value;
  if (db.programs.length <= 1) { showToast('কমপক্ষে একটি কর্মসূচি থাকতে হবে'); return; }
  showConfirm('এই কর্মসূচি ও এর সব আয়-ব্যয় মুছে যাবে।', () => {
    db.programs = db.programs.filter(p => p.id !== id);
    delete db.income[id]; delete db.expense[id];
    active = db.programs[0].id;
    dbSave(); closeModal('program'); renderPage();
    showToast('কর্মসূচি মুছে গেছে');
  });
}

/* ══════════════════════════════════════════
   INCOME MODAL
══════════════════════════════════════════ */
function openIncome(editId = '') {
  const t = tmpl();
  document.getElementById('inc-type').innerHTML = t.incomeTypes.map(x =>
    `<option>${API.esc(x)}</option>`).join('');
  document.getElementById('inc-modal-title').textContent = editId ? 'আয় এডিট' : 'আয় যোগ';
  document.getElementById('inc-edit-id').value = editId;
  const r = editId ? incomes().find(x => x.id === editId) : null;
  document.getElementById('inc-date').value         = r ? (r.date || todayISO()) : todayISO();
  document.getElementById('inc-type').value         = r ? (r.type || t.incomeTypes[0]) : t.incomeTypes[0];
  document.getElementById('inc-person-type').value  = r ? (r.personType || 'সাধারণ মানুষ') : 'সাধারণ মানুষ';
  document.getElementById('inc-name').value         = r ? (r.name || '') : '';
  document.getElementById('inc-share').value        = r ? (r.share || 1) : 1;
  document.getElementById('inc-amount').value       = r ? (r.amount || '') : '';
  document.getElementById('inc-ref').value          = r ? (r.ref || '') : '';
  syncIncShareField();
  openModal('income');
}

function onIncTypeChange() { syncIncShareField(); }

function syncIncShareField() {
  const isQ = program().template === 'qurbani' &&
              document.getElementById('inc-type').value === 'পূর্ণ ভাগ';
  document.getElementById('inc-share-wrap').style.display = isQ ? '' : 'none';
}

function saveIncome() {
  const name   = document.getElementById('inc-name').value.trim();
  const amount = parseFloat(document.getElementById('inc-amount').value);
  if (!name)         { showToast('নাম দিন'); return; }
  if (!(amount > 0)) { showToast('সঠিক টাকার পরিমাণ দিন'); return; }
  const isQ = program().template === 'qurbani' &&
              document.getElementById('inc-type').value === 'পূর্ণ ভাগ';
  const row = {
    id:         document.getElementById('inc-edit-id').value || uid(),
    date:       document.getElementById('inc-date').value || todayISO(),
    type:       document.getElementById('inc-type').value,
    personType: document.getElementById('inc-person-type').value,
    name,
    share:  isQ ? (parseInt(document.getElementById('inc-share').value) || 1) : 0,
    amount,
    ref:    document.getElementById('inc-ref').value.trim(),
  };
  const list = incomes();
  const idx  = list.findIndex(x => x.id === row.id);
  if (idx >= 0) list[idx] = row; else list.push(row);
  dbSave(); closeModal('income');
  setTab('income'); renderPage();
  showToast('আয় সংরক্ষিত হয়েছে ✓');
}

/* ══════════════════════════════════════════
   EXPENSE MODAL
══════════════════════════════════════════ */
function openExpense(editId = '') {
  const t = tmpl();
  document.getElementById('exp-type').innerHTML = t.expenseTypes.map(x =>
    `<option>${API.esc(x)}</option>`).join('');
  document.getElementById('exp-modal-title').textContent = editId ? 'ব্যয় এডিট' : 'ব্যয় যোগ';
  document.getElementById('exp-edit-id').value = editId;
  const r = editId ? expenses().find(x => x.id === editId) : null;
  document.getElementById('exp-date').value   = r ? (r.date || todayISO()) : todayISO();
  document.getElementById('exp-type').value   = r ? (r.type || t.expenseTypes[0]) : t.expenseTypes[0];
  document.getElementById('exp-amount').value = r ? (r.amount || '') : '';
  document.getElementById('exp-note').value   = r ? (r.note || '') : '';
  openModal('expense');
}

function saveExpense() {
  const amount = parseFloat(document.getElementById('exp-amount').value);
  if (!(amount > 0)) { showToast('সঠিক টাকার পরিমাণ দিন'); return; }
  const row = {
    id:     document.getElementById('exp-edit-id').value || uid(),
    date:   document.getElementById('exp-date').value || todayISO(),
    type:   document.getElementById('exp-type').value,
    amount,
    note:   document.getElementById('exp-note').value.trim(),
  };
  const list = expenses();
  const idx  = list.findIndex(x => x.id === row.id);
  if (idx >= 0) list[idx] = row; else list.push(row);
  dbSave(); closeModal('expense');
  setTab('expense'); renderPage();
  showToast('ব্যয় সংরক্ষিত হয়েছে ✓');
}

/* ── DELETE (confirm modal) ── */
function askDel(kind, id) {
  showConfirm('এই এন্ট্রি মুছে ফেলবেন?', () => {
    if (kind === 'income')  db.income[active]  = incomes().filter(x => x.id !== id);
    else                    db.expense[active] = expenses().filter(x => x.id !== id);
    dbSave(); renderPage();
    showToast('মুছে গেছে');
  });
}

/* ══════════════════════════════════════════
   SETTINGS MODAL
══════════════════════════════════════════ */
function openSettings() {
  populateTmplSelect('set-tmpl', program().template);
  document.getElementById('new-tmpl-name').value = '';
  renderSettingsBody();
  openModal('settings');
}

function renderSettingsBody() {
  const key = document.getElementById('set-tmpl').value;
  const t   = db.templates[key];
  if (!t) return;
  document.getElementById('settings-body').innerHTML = `
    <div class="tmpl-card">
      <div class="tmpl-card-title">আয়ের ধরন</div>
      <div class="chip-list">${t.incomeTypes.map((x, i) =>
        `<div class="chip">${API.esc(x)}<button onclick="removeType('${key}','income',${i})" title="বাদ দিন">×</button></div>`
      ).join('')}</div>
      <div class="add-row">
        <input class="form-input" id="new-inc-type" placeholder="নতুন আয়ের ধরন">
        <button class="submit-btn" style="padding:10px 12px;background:var(--green-light);color:var(--green);border:1px solid var(--green2)" onclick="addType('${key}','income')">যোগ</button>
      </div>
    </div>
    <div class="tmpl-card">
      <div class="tmpl-card-title">ব্যয়ের খাত</div>
      <div class="chip-list">${t.expenseTypes.map((x, i) =>
        `<div class="chip">${API.esc(x)}<button onclick="removeType('${key}','expense',${i})" title="বাদ দিন">×</button></div>`
      ).join('')}</div>
      <div class="add-row">
        <input class="form-input" id="new-exp-type" placeholder="নতুন ব্যয়ের খাত">
        <button class="submit-btn" style="padding:10px 12px;background:var(--red-light);color:var(--red);border:1px solid var(--red)" onclick="addType('${key}','expense')">যোগ</button>
      </div>
    </div>`;
}

function addType(tKey, kind) {
  const inp = document.getElementById(kind === 'income' ? 'new-inc-type' : 'new-exp-type');
  const val = inp.value.trim();
  if (!val) { showToast('নাম দিন'); return; }
  const arr = kind === 'income' ? db.templates[tKey].incomeTypes : db.templates[tKey].expenseTypes;
  if (arr.includes(val)) { showToast('এই ধরনটি আগেই আছে'); return; }
  arr.push(val);
  inp.value = '';
  dbSave(); renderSettingsBody();
  showToast('যোগ হয়েছে ✓');
}

function removeType(tKey, kind, idx) {
  const arr = kind === 'income' ? db.templates[tKey].incomeTypes : db.templates[tKey].expenseTypes;
  if (arr.length <= 1) { showToast('কমপক্ষে একটি রাখতে হবে'); return; }
  arr.splice(idx, 1);
  dbSave(); renderSettingsBody();
}

function addTemplate() {
  const name = document.getElementById('new-tmpl-name').value.trim();
  if (!name) { showToast('Template-এর নাম দিন'); return; }
  const key = 'tmpl_' + Date.now();
  db.templates[key] = {
    label:        name,
    note:         '',
    incomeTypes:  ['আয়', 'অনুদান', 'অন্যান্য'],
    expenseTypes: ['ব্যয়', 'অন্যান্য'],
  };
  document.getElementById('new-tmpl-name').value = '';
  dbSave();
  populateTmplSelect('set-tmpl', key);
  renderSettingsBody();
  showToast('নতুন Template "' + API.esc(name) + '" তৈরি হয়েছে ✓');
}

function resetDemo() {
  showConfirm('সব ডেমো ডেটা রিসেট হবে। এগিয়ে যাব?', () => {
    localStorage.removeItem(PKEY);
    dbLoad(); closeModal('settings'); renderPage();
    showToast('ডেমো ডেটা রিসেট হয়েছে');
  });
}

/* ══════════════════════════════════════════
   UTILS
══════════════════════════════════════════ */
function changeProgram(id) {
  active = id; activeTab = 'summary';
  setTab('summary'); renderPage();
}

function setTab(x) {
  activeTab = x;
  document.querySelectorAll('.k-tab').forEach(b => b.classList.toggle('active', b.dataset.tab === x));
  renderRoot();
}

function setRptRange(r) { rptRange = r; renderRoot(); }

function openModal(x)  { document.getElementById('modal-' + x).classList.add('open'); }
function closeModal(x) { document.getElementById('modal-' + x).classList.remove('open'); }

function showToast(msg) {
  const t = document.getElementById('toast');
  if (!t) return;
  t.textContent = msg; t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 2200);
}

function showConfirm(msg, cb) {
  document.getElementById('confirm-msg').textContent = msg;
  _confirmCb = cb;
  openModal('confirm');
}

function confirmYes() {
  closeModal('confirm');
  if (_confirmCb) { _confirmCb(); _confirmCb = null; }
}

/* ── INIT ── */
dbLoad();
renderPage();
