/* Daftar accounting UI renderer. Depends on API and MdrAccounts. */
(function () {
  const state = { report: 'months', account: 'all', month: 'all', query: '', drill: null };
  const esc = (value) => API.esc(value == null ? '' : value);
  const money = (value) => `৳ ${toBn(Math.round(Number(value) || 0).toLocaleString('en-US'))}`;
  const plainNum = (value) => toBn(String(value || 0));
  const accountOptions = [['all', 'সব'], ['matbakh', 'মাতবাখ'], ['madrasa', 'মাদরাসা'], ['tamirat', 'তামিরাত']];
  const reports = [
    ['months', 'মাস'], ['categories', 'খাত'], ['items', 'পণ্য'],
    ['vendors', 'দোকান'], ['dues', 'বকেয়া'], ['income', 'আয়'], ['fees', 'ওয়াযিফা'],
  ];

  function fieldValue(id) { return document.getElementById(id)?.value || ''; }
  function rowsExpense() { return MdrAccounts.filterExpenses(state); }
  function rowsIncome() { return MdrAccounts.filterIncomes(state); }
  function groupRows(rows, keyFn) {
    const map = new Map();
    rows.forEach((row) => {
      const key = keyFn(row) || 'অনির্ধারিত';
      if (!map.has(key)) map.set(key, { key, rows: [], amount: 0, quantity: 0 });
      const item = map.get(key);
      item.rows.push(row);
      item.amount += Number(row.amount) || 0;
      item.quantity += Number(row.quantity) || 0;
    });
    return [...map.values()].sort((a, b) => b.amount - a.amount);
  }
  function metric(label, value, tone = '', action = '') {
    return `<button type="button" class="acct-metric ${tone}" ${action ? `onclick="${action}"` : ''}><span>${label}</span><strong>${value}</strong></button>`;
  }
  function smallCard(title, value, hint, action = '') {
    return `<button type="button" class="acct-report-card" ${action ? `onclick="${action}"` : ''}><strong>${title}</strong><span>${value}</span><em>${hint}</em></button>`;
  }
  function syncFilters() {
    state.account = fieldValue('acct-account') || state.account;
    state.month = fieldValue('acct-month') || state.month;
    state.query = fieldValue('acct-query');
  }
  function renderDashboard() {
    const s = MdrAccounts.summary({ account: 'all', month: 'all', query: '' });
    return `<div class="acct-dashboard">
      ${metric('হাতে আছে / ঘাটতি', money(s.balance), s.balance >= 0 ? 'good' : 'bad', "openAccountReport('months')")}
      ${metric('মোট জমা', money(s.incomeTotal), 'good', "openAccountReport('income')")}
      ${metric('মোট ব্যয়', money(s.expenseTotal), 'bad', "openAccountReport('months')")}
      ${metric('মোট বকেয়া', money(s.dueTotal), 'warn', "openAccountReport('dues')")}
    </div>`;
  }
  function renderActions() {
    return `<div class="acct-actions">
      <button type="button" class="acct-action primary" onclick="openAccountModal('expense')">নতুন ব্যয়</button>
      <button type="button" class="acct-action" onclick="openAccountModal('income')">নতুন আয়</button>
      <button type="button" class="acct-action" onclick="openAccountModal('due')">বকেয়া পরিশোধ</button>
    </div>`;
  }
  function renderReportCards() {
    const expenses = MdrAccounts.getExpenses();
    const income = MdrAccounts.getIncomes();
    const dues = MdrAccounts.getDues();
    const byMonth = groupRows(expenses, (r) => r.month);
    const byItem = groupRows(expenses, (r) => r.description).filter((r) => r.key !== 'অনির্ধারিত');
    const byVendor = groupRows(expenses, (r) => r.supplier);
    return `<div class="acct-section-title">রিপোর্ট</div><div class="acct-report-grid">
      ${smallCard('মাসভিত্তিক হিসাব', `${plainNum(byMonth.length)} মাস`, 'মাস → দিন → এন্ট্রি', "openAccountReport('months')")}
      ${smallCard('খাতভিত্তিক ব্যয়', `${plainNum(groupRows(expenses, (r) => r.category).length)} খাত`, 'মাতবাখ, মাদরাসা, তামিরাত', "openAccountReport('categories')")}
      ${smallCard('পণ্য হিসাব', `${plainNum(byItem.length)} পণ্য`, 'কতটুকু এসেছে, কত ব্যয়', "openAccountReport('items')")}
      ${smallCard('দোকান/সরবরাহকারী', `${plainNum(byVendor.length)} জন`, 'লেনদেন ও বকেয়া', "openAccountReport('vendors')")}
      ${smallCard('বকেয়া', money(dues.reduce((a, b) => a + Number(b.due || 0), 0)), 'কার কাছে কত বাকি', "openAccountReport('dues')")}
      ${smallCard('আয়/জমা', `${plainNum(income.length)} এন্ট্রি`, 'দফতর জমা ও তামিরাত আয়', "openAccountReport('income')")}
    </div>`;
  }
  function renderFilters() {
    return `<div class="acct-filters">
      <select class="form-input form-select" id="acct-account" onchange="refreshAccountDetails()">
        ${accountOptions.map(([id, label]) => `<option value="${id}" ${state.account === id ? 'selected' : ''}>${label}</option>`).join('')}
      </select>
      <select class="form-input form-select" id="acct-month" onchange="refreshAccountDetails()">
        <option value="all">সব মাস</option>
        ${MdrAccounts.months().map((m) => `<option value="${esc(m)}" ${state.month === m ? 'selected' : ''}>${esc(m)}</option>`).join('')}
      </select>
      <input class="form-input" id="acct-query" value="${esc(state.query)}" placeholder="পণ্য, খাত, দোকান বা রশিদ" oninput="refreshAccountDetails()">
    </div>`;
  }
  function renderTabs() {
    return `<div class="tab-bar acct-tabs">${reports.map(([id, label]) =>
      `<button type="button" class="tab-btn ${state.report === id ? 'active' : ''}" onclick="openAccountReport('${id}', true)">${label}</button>`).join('')}</div>`;
  }
  function renderMonthReport() {
    const groups = groupRows(rowsExpense(), (r) => r.month);
    return `<div class="acct-report-grid">${groups.map((g) =>
      smallCard(g.key, money(g.amount), `${plainNum(g.rows.length)}টি খরচ`, `openMonthDrill('${esc(g.key)}')`)).join('')}</div>`;
  }
  function renderMonthDrill(month) {
    const groups = groupRows(rowsExpense().filter((r) => r.month === month), (r) => r.day || r.date || 'তারিখ নেই')
      .sort((a, b) => String(a.key).localeCompare(String(b.key), undefined, { numeric: true }));
    return `<button type="button" class="acct-back" onclick="openAccountReport('months', true)">‹ মাসে ফিরুন</button>
      <div class="acct-report-grid">${groups.map((g) => smallCard(`${esc(month)} · ${esc(g.key)}`, money(g.amount), `${plainNum(g.rows.length)}টি এন্ট্রি`, `openDayDrill('${esc(month)}','${esc(g.key)}')`)).join('')}</div>`;
  }
  function renderEntries(rows) {
    if (!rows.length) return '<div class="empty-state"><div class="empty-text">তথ্য নেই</div></div>';
    return rows.map((row) => `<div class="acct-entry">
      <div><strong>${esc(row.description || row.category)}</strong><span>${esc(row.category)} · ${esc(row.supplier)}${row.quantity ? ' · পরিমাণ ' + plainNum(row.quantity) : ''}</span></div>
      <div class="acct-entry-side"><strong>${money(row.amount)}</strong><span>${esc(row.month)} ${row.day || row.date ? '· ' + esc(row.day || row.date) : ''}</span></div>
    </div>`).join('');
  }
  function renderDayDrill(month, day) {
    const rows = rowsExpense().filter((r) => r.month === month && String(r.day || r.date || 'তারিখ নেই') === String(day));
    return `<button type="button" class="acct-back" onclick="openMonthDrill('${esc(month)}')">‹ দিনে ফিরুন</button>${renderEntries(rows)}`;
  }
  function renderCategoryReport() {
    return `<div class="acct-report-grid">${groupRows(rowsExpense(), (r) => r.category).map((g) =>
      smallCard(g.key, money(g.amount), `${plainNum(g.rows.length)}টি এন্ট্রি`, `openEntryGroup('category','${esc(g.key)}')`)).join('')}</div>`;
  }
  function renderItemReport() {
    return `<div class="acct-report-grid">${groupRows(rowsExpense(), (r) => r.description).filter((g) => g.key !== 'অনির্ধারিত').slice(0, 80).map((g) =>
      smallCard(g.key, money(g.amount), `পরিমাণ ${plainNum(g.quantity)} · ${plainNum(g.rows.length)} বার`, `openEntryGroup('description','${esc(g.key)}')`)).join('')}</div>`;
  }
  function renderVendorReport() {
    return `<div class="acct-report-grid">${groupRows(rowsExpense(), (r) => r.supplier).map((g) =>
      smallCard(g.key, money(g.amount), `${plainNum(g.rows.length)}টি লেনদেন`, `openEntryGroup('supplier','${esc(g.key)}')`)).join('')}</div>`;
  }
  function renderDues() {
    const dues = MdrAccounts.getDues().filter((r) => state.account === 'all' || r.account === state.account);
    const payments = MdrAccounts.getDuePayments().filter((r) => state.account === 'all' || r.account === state.account);
    return `<div class="acct-report-grid">${dues.map((d) => smallCard(d.supplier, money(d.due), `মোট ${money(d.total)} · প্রদান ${money(d.paid)}`, '')).join('')}</div>
      <div class="acct-list-title">পরিশোধ ইতিহাস</div>${renderEntries(payments.map((p) => ({ ...p, description: p.supplier, category: 'বকেয়া পরিশোধ', amount: p.amount, month: '', supplier: p.receipt ? 'রশিদ ' + p.receipt : '' })))}`;
  }
  function renderIncome() {
    const rows = rowsIncome();
    return `<div class="acct-report-grid">${groupRows(rows, (r) => r.month).map((g) => smallCard(g.key, money(g.amount), `${plainNum(g.rows.length)}টি জমা`, '')).join('')}</div>${renderEntries(rows.map((r) => ({ ...r, description: r.note || 'অর্থ গ্রহণ', category: MdrAccounts.labels[r.account] || r.account, supplier: '' })))}`;
  }
  function renderFeesPanel() {
    const classes = API.Classes.getAll();
    const cid = fieldValue('fee-history-class') || classes[0]?.id || '';
    const rows = cid ? API.Fees.getByClass(cid) : [];
    return `<div class="form-group"><label class="form-label">বর্ষ</label><select class="form-input form-select" id="fee-history-class" onchange="refreshAccountDetails()">${classes.map((c) => `<option value="${c.id}" ${cid === c.id ? 'selected' : ''}>${esc(c.name)}</option>`).join('')}</select></div>
      <button class="add-btn" style="background:var(--gold);" onclick="openModal('add-fees')">＋ নতুন ওয়াযিফা সারসংক্ষেপ</button>${renderEntries(rows.map((f) => ({ ...f, description: f.month, category: `মোট ${plainNum(f.total)} · আদায় ${plainNum(f.paid)}`, amount: f.arrear || 0, supplier: f.note || '' })))}`;
  }
  function renderReportBody() {
    if (state.report === 'months' && state.drill?.type === 'month') return renderMonthDrill(state.drill.month);
    if (state.report === 'months' && state.drill?.type === 'day') return renderDayDrill(state.drill.month, state.drill.day);
    if (state.drill?.type === 'group') return `<button type="button" class="acct-back" onclick="openAccountReport('${state.report}', true)">‹ রিপোর্টে ফিরুন</button>${renderEntries(rowsExpense().filter((r) => String(r[state.drill.field] || 'অনির্ধারিত') === state.drill.value))}`;
    return { months: renderMonthReport, categories: renderCategoryReport, items: renderItemReport, vendors: renderVendorReport, dues: renderDues, income: renderIncome, fees: renderFeesPanel }[state.report]();
  }
  function reportTitle() {
    const base = (reports.find(([id]) => id === state.report) || ['', 'হিসাব'])[1];
    if (state.drill?.type === 'month') return `${state.drill.month} মাসের দিনভিত্তিক হিসাব`;
    if (state.drill?.type === 'day') return `${state.drill.month} · ${state.drill.day} দিনের খরচ`;
    return base;
  }
  window.openAccountReport = function (report, keepOpen) {
    state.report = report || state.report;
    state.drill = null;
    refreshAccountDetails();
    if (!keepOpen) document.getElementById('modal-account-details').classList.add('open');
  };
  window.openMonthDrill = function (month) {
    state.report = 'months'; state.drill = { type: 'month', month }; refreshAccountDetails();
  };
  window.openDayDrill = function (month, day) {
    state.report = 'months'; state.drill = { type: 'day', month, day }; refreshAccountDetails();
  };
  window.openEntryGroup = function (field, value) {
    state.drill = { type: 'group', field, value }; refreshAccountDetails();
  };
  window.refreshAccountDetails = function () {
    MdrAccounts.ensureSeeded();
    syncFilters();
    document.getElementById('account-details-title').textContent = reportTitle();
    document.getElementById('account-details-root').innerHTML = `${renderFilters()}${renderTabs()}${renderReportBody()}`;
  };
  window.setAccountTab = function (tab) { openAccountReport(tab); };

  window.openAccountModal = function (type) {
    if (typeof mmMutationBlocked === 'function' && mmMutationBlocked(showToast)) return;
    const isExpense = type === 'expense';
    const isDue = type === 'due';
    document.getElementById('account-entry-type').value = type;
    document.getElementById('account-modal-title').textContent = isExpense ? 'নতুন ব্যয়' : (isDue ? 'বকেয়া পরিশোধ' : 'নতুন আয়');
    document.getElementById('account-entry-desc-label').textContent = isExpense ? 'বিবরণ / পণ্য' : (isDue ? 'পরিশোধের বিবরণ' : 'মন্তব্য');
    document.querySelectorAll('.account-expense-field').forEach((el) => { el.style.display = isExpense ? '' : 'none'; });
    ['month', 'date', 'amount', 'category', 'description', 'qty', 'unit-price', 'supplier', 'receipt'].forEach((id) => {
      const input = document.getElementById(`account-entry-${id}`);
      if (input) input.value = '';
    });
    const photo = document.getElementById('account-entry-photo');
    if (photo) photo.value = '';
    document.getElementById('account-entry-account').value = state.account !== 'all' ? state.account : (isExpense ? 'madrasa' : 'general');
    openModal('account-entry');
  };

  function readReceiptImage() {
    const file = document.getElementById('account-entry-photo')?.files?.[0];
    if (!file) return Promise.resolve('');
    if (file.size > 700 * 1024) {
      showToast('ছবিটি বড় — ৭০০KB-এর কম দিন');
      return Promise.resolve(null);
    }
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = () => resolve('');
      reader.readAsDataURL(file);
    });
  }

  window.saveAccountEntry = async function () {
    if (typeof mmMutationBlocked === 'function' && mmMutationBlocked(showToast)) return;
    const type = fieldValue('account-entry-type');
    const account = fieldValue('account-entry-account') || 'general';
    const amount = Number(fieldValue('account-entry-amount')) || 0;
    if (!amount) { showToast('পরিমাণ লিখুন'); return; }
    const receiptImage = await readReceiptImage();
    if (receiptImage === null) return;
    const base = {
      account,
      month: fieldValue('account-entry-month'),
      date: fieldValue('account-entry-date'),
      amount,
      supplier: fieldValue('account-entry-supplier'),
      receipt: fieldValue('account-entry-receipt'),
      receiptImage,
    };
    if (type === 'income') {
      MdrAccounts.addIncome({ ...base, note: fieldValue('account-entry-description') });
    } else if (type === 'due') {
      MdrAccounts.addDuePayment(base);
    } else {
      MdrAccounts.addExpense({
        ...base,
        project: account,
        category: fieldValue('account-entry-category') || 'অনির্ধারিত',
        description: fieldValue('account-entry-description'),
        quantity: fieldValue('account-entry-qty'),
        unitPrice: fieldValue('account-entry-unit-price'),
      });
    }
    closeModal('account-entry');
    showToast('হিসাব সংরক্ষিত হয়েছে ✓');
    renderAccounts();
  };

  window.renderAccounts = function () {
    MdrAccounts.ensureSeeded();
    document.getElementById('accounts-root').innerHTML = `${renderDashboard()}${renderActions()}${renderReportCards()}`;
  };
})();
