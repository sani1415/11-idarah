/* Madrasa accounting API: localStorage now, Supabase later. */
const MdrAccounts = (() => {
  const KEYS = {
    incomes: 'mm_accounts_incomes',
    expenses: 'mm_accounts_expenses',
    dues: 'mm_accounts_dues',
    duePayments: 'mm_accounts_due_payments',
    seeded: 'mm_accounts_seeded_v1',
  };
  const labels = {
    all: 'সব হিসাব',
    general: 'সাধারণ',
    matbakh: 'মাতবাখ',
    madrasa: 'মাদরাসা',
    tamirat: 'তামিরাত',
    fees: 'ওয়াযিফা',
  };
  const uid = (prefix) => `${prefix}-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
  const num = (value) => Number(value) || 0;
  const load = (key) => {
    try { return JSON.parse(localStorage.getItem(key)) || []; } catch { return []; }
  };
  const save = (key, rows) => localStorage.setItem(key, JSON.stringify(rows));
  const cloneRows = (rows) => rows.map((row) => ({ ...row }));

  function ensureSeeded() {
    const seed = window.MM_ACCOUNTS_SEED;
    if (!seed) return;
    const version = String(seed.version || 1);
    if (localStorage.getItem(KEYS.seeded) === version) return;
    save(KEYS.incomes, cloneRows(seed.incomes || []));
    save(KEYS.expenses, cloneRows(seed.expenses || []));
    save(KEYS.dues, cloneRows(seed.dues || []));
    save(KEYS.duePayments, cloneRows(seed.duePayments || []));
    localStorage.setItem(KEYS.seeded, version);
  }

  function getIncomes() { ensureSeeded(); return load(KEYS.incomes); }
  function getExpenses() { ensureSeeded(); return load(KEYS.expenses); }
  function getDues() { ensureSeeded(); return load(KEYS.dues); }
  function getDuePayments() { ensureSeeded(); return load(KEYS.duePayments); }

  function matches(row, filters = {}) {
    const account = filters.account || 'all';
    const query = String(filters.query || '').trim().toLowerCase();
    const month = filters.month || 'all';
    if (account !== 'all' && row.account !== account) return false;
    if (month !== 'all' && row.month !== month) return false;
    if (!query) return true;
    return [
      row.month, row.date, row.day, row.category, row.project, row.description,
      row.supplier, row.receipt, row.paymentMethod, row.note, row.sourceFile,
    ].some((value) => String(value || '').toLowerCase().includes(query));
  }

  function filterExpenses(filters = {}) {
    return getExpenses().filter((row) => matches(row, filters));
  }
  function filterIncomes(filters = {}) {
    return getIncomes().filter((row) => matches(row, filters));
  }
  function months() {
    const set = new Set();
    [...getIncomes(), ...getExpenses()].forEach((row) => { if (row.month) set.add(row.month); });
    return [...set];
  }

  function groupSum(rows, field) {
    const map = new Map();
    rows.forEach((row) => {
      const key = row[field] || 'অনির্ধারিত';
      const current = map.get(key) || { name: key, amount: 0, quantity: 0, count: 0 };
      current.amount += num(row.amount);
      current.quantity += num(row.quantity);
      current.count += 1;
      map.set(key, current);
    });
    return [...map.values()].sort((a, b) => b.amount - a.amount);
  }

  function summary(filters = {}) {
    const expenses = filterExpenses(filters);
    const incomes = filterIncomes(filters);
    const account = filters.account || 'all';
    const dues = getDues().filter((row) => account === 'all' || row.account === account);
    const incomeTotal = incomes.reduce((sum, row) => sum + num(row.amount), 0);
    const expenseTotal = expenses.reduce((sum, row) => sum + num(row.amount), 0);
    const dueTotal = dues.reduce((sum, row) => sum + num(row.due), 0);
    return {
      incomeTotal,
      expenseTotal,
      balance: incomeTotal - expenseTotal,
      dueTotal,
      expenseCount: expenses.length,
      incomeCount: incomes.length,
      byAccount: groupSum(expenses, 'account'),
      byCategory: groupSum(expenses, 'category'),
      bySupplier: groupSum(expenses, 'supplier'),
      byItem: groupSum(expenses, 'description'),
      byMonth: groupSum(expenses, 'month'),
    };
  }

  function addIncome(data) {
    const rows = getIncomes();
    const entry = { id: uid('inc'), account: 'general', month: '', date: '', amount: 0, note: '', ...data };
    rows.push(entry);
    save(KEYS.incomes, rows);
    return entry;
  }
  function addExpense(data) {
    const rows = getExpenses();
    const entry = {
      id: uid('exp'), account: 'madrasa', project: '', month: '', date: '', day: '',
      category: '', description: '', quantity: '', unit: '', unitPrice: '',
      amount: 0, supplier: '', receipt: '', paymentMethod: '', ...data,
    };
    rows.push(entry);
    save(KEYS.expenses, rows);
    return entry;
  }
  function addDuePayment(data) {
    const rows = getDuePayments();
    const entry = { id: uid('pay'), account: 'madrasa', date: '', amount: 0, supplier: '', receipt: '', ...data };
    rows.push(entry);
    save(KEYS.duePayments, rows);
    return entry;
  }

  return {
    labels,
    ensureSeeded,
    getIncomes,
    getExpenses,
    getDues,
    getDuePayments,
    filterExpenses,
    filterIncomes,
    months,
    summary,
    addIncome,
    addExpense,
    addDuePayment,
  };
})();
