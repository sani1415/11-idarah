'use strict';
/* global localStorage, window */

const MdrAccAPI = (() => {
  const SV_KEY  = 'mdr_acc_sv';
  const INC_KEY = 'mdr_acc_inc';
  const EXP_KEY = 'mdr_acc_exp';
  const DUE_KEY = 'mdr_acc_due';
  const CAT_KEY = 'mdr_acc_cats';

  /* MONTHS in academic-year order (Ramadan = start) */
  const MONTHS = ['রামাযান','শাওয়াল','যিলকদ','যিলহাজ','মুহাররম','সফর',
    'রবিউল আঃ','রবিউস সানিঃ','জুমাদাল উলা','জুমাদাল আখেরা','রজব','শাবান'];
  const HIJRI_MONTHS = ['মুহাররম','সফর','রবিউল আঃ','রবিউস সানিঃ','জুমাদাল উলা','জুমাদাল আখেরা','রজব','শাবান','রামাযান','শাওয়াল','যিলকদ','যিলহাজ'];
  const MONTH_ALIAS = { 'শাওয়াল':'শাওয়াল', 'জিলকাদ':'যিলকদ', 'যিলক্বদ':'যিলকদ', 'মুহার্রম':'মুহাররম' };

  /* Islamic calendar month index: Intl month 1–12 → MONTHS index
     Intl 9=Ramadan → idx 0; formula: (intlMonth + 3) % 12 */
  const INTL_TO_IDX = [4,5,6,7,8,9,10,11,0,1,2,3]; /* index: intlMonth-1 */

  const ACCOUNT_LABELS = {
    matbakh:'মাতবাখ', madrasa:'মাদরাসা', tamirat:'তামিরাত', general:'সাধারণ',
  };
  const OFFSET_KEY = 'mdr_acc_hijri_offset_days';

  const DEFAULT_CATS = [
    'বড় বাজার','কাঁচা বাজার','দস্তরখান ভবন','রান্নাঘর সরবরাহ',
    'বিদ্যুৎ','গ্যাস/জ্বালানি','শিক্ষা উপকরণ','বেতন',
    'রক্ষণাবেক্ষণ','পরিবহন','চিকিৎসা','অন্যান্য',
  ];

  const uid   = (p) => p + Date.now().toString(36) + Math.random().toString(36).slice(2,5);
  const num   = (v) => Number(v) || 0;
  const load  = (k) => { try { return JSON.parse(localStorage.getItem(k) || '[]'); } catch { return []; } };
  const store = (k,a) => localStorage.setItem(k, JSON.stringify(a));
  const monthKey = (m) => MONTH_ALIAS[String(m || '').trim()] || String(m || '').trim();
  const monthNo = (m) => Math.max(0, HIJRI_MONTHS.indexOf(monthKey(m))) + 1;
  const monthFromNo = (m) => HIJRI_MONTHS[Math.max(1, Math.min(12, num(m))) - 1] || '';
  const systemHijriYear = () => {
    try {
      const settings = window.API && window.API.Settings && window.API.Settings.get ? window.API.Settings.get() : null;
      const y = num(en(settings && settings.hijri_year));
      if (y) return y;
    } catch (e) {}
    return todayHijri().year;
  };
  const dateYear = (year, month) => year ? num(en(year)) : (monthNo(month) <= 8 ? systemHijriYear() + 1 : systemHijriYear());
  const dateKey = (year, month, day) => String(dateYear(year, month)).padStart(4,'0') + '-' + String(monthNo(month)).padStart(2,'0') + '-' + String(num(day)).padStart(2,'0');
  const norm = (r) => ({ ...r, month: monthKey(r.month), hijriYear: String(dateYear(r.hijriYear || r.year, r.month)), dateKey: dateKey(r.hijriYear || r.year, r.month, r.day) });
  const bn = (s) => String(s || '').replace(/[0-9]/g, d => '০১২৩৪৫৬৭৮৯'[d]);
  const en = (s) => String(s || '').replace(/[০-৯٠-٩۰-۹]/g, d => {
    const b = '০১২৩৪৫৬৭৮৯'.indexOf(d); if (b >= 0) return b;
    const a = '٠١٢٣٤٥٦٧٨٩'.indexOf(d); if (a >= 0) return a;
    return '۰۱۲۳۴۵۶۷۸۹'.indexOf(d);
  });
  const dateLabel = (r) => bn((r.dateKey || dateKey(r.hijriYear, r.month, r.day))) + (!r.day ? ' (দিন নেই)' : '');
  const parseDateInput = (v) => { const p = en(v).trim().split(/[-/\\.]/).map(num); return p.length === 3 ? { year:p[0], month:monthFromNo(p[1]), day:p[2] } : null; };
  const toDateKey = (v) => {
    if (!v || v === 'all') return 'all';
    const p = parseDateInput(v);
    return p ? dateKey(p.year, p.month, p.day) : 'all';
  };
  const inRange = (r, from, to) => {
    from = toDateKey(from); to = toDateKey(to);
    if (from !== 'all' && to !== 'all' && from > to) { const x = from; from = to; to = x; }
    return (from === 'all' || r.dateKey >= from) && (to === 'all' || r.dateKey <= to);
  };

  /* ── Seed loader ── */
  function ensureSeed() {
    const seed = window.MM_ACCOUNTS_SEED;
    if (!seed) return;
    const sv = parseInt(localStorage.getItem(SV_KEY) || '0');
    if (sv >= seed.version) return;

    const incs = load(INC_KEY);
    const incIds = new Set(incs.map(x => x.id));
    (seed.incomes || []).forEach(r => { if (!incIds.has(r.id)) incs.push({ ...r }); });
    store(INC_KEY, incs);

    const exps = load(EXP_KEY);
    const expIds = new Set(exps.map(x => x.id));
    (seed.expenses || []).forEach(r => { if (!expIds.has(r.id)) exps.push({ ...r }); });
    store(EXP_KEY, exps);

    const dues = load(DUE_KEY);
    const dueIds = new Set(dues.map(x => x.id));
    (seed.dues || []).forEach(r => { if (!dueIds.has(r.id)) dues.push({ ...r }); });
    store(DUE_KEY, dues);

    localStorage.setItem(SV_KEY, String(seed.version));
  }

  /* ── Categories ── */
  const Categories = {
    getAll()        { const c = load(CAT_KEY); return [...DEFAULT_CATS, ...c.filter(x => !DEFAULT_CATS.includes(x))]; },
    add(name)       { const a = load(CAT_KEY); if (!a.includes(name) && !DEFAULT_CATS.includes(name)) { a.push(name); store(CAT_KEY, a); } },
    del(name)       { store(CAT_KEY, load(CAT_KEY).filter(c => c !== name)); },
    isDefault(name) { return DEFAULT_CATS.includes(name); },
  };

  /* ── Income ── */
  const Income = {
    getAll()          { return load(INC_KEY).map(norm); },
    getByAccount(acc) { return load(INC_KEY).filter(x => x.account === acc); },
    getByMonth(m)     { const mm = monthKey(m); return load(INC_KEY).filter(x => monthKey(x.month) === mm); },
    total()           { return Income.getAll().reduce((s,x) => s + num(x.amount), 0); },
    add(data)         { const a = load(INC_KEY); const e = norm({ id: uid('inc-'), ...data, _at: Date.now() }); a.push(e); store(INC_KEY, a); return e; },
    del(id)           { store(INC_KEY, load(INC_KEY).filter(x => x.id !== id)); },
    months()          { return [...new Set(load(INC_KEY).map(x => monthKey(x.month)).filter(Boolean))]; },
  };

  /* ── Expense ── */
  const Expense = {
    getAll()            { return load(EXP_KEY).map(norm); },
    getByAccount(acc)   { return load(EXP_KEY).filter(x => x.account === acc); },
    getByMonth(m)       { const mm = monthKey(m); return load(EXP_KEY).filter(x => monthKey(x.month) === mm); },
    getByItem(desc)     { return load(EXP_KEY).filter(x => x.description === desc); },
    total()             { return Expense.getAll().reduce((s,x) => s + num(x.amount), 0); },
    totalByAccount(acc) { return Expense.getByAccount(acc).reduce((s,x) => s + num(x.amount), 0); },
    add(data)           { const a = load(EXP_KEY); const e = norm({ id: uid('exp-'), ...data, _at: Date.now() }); a.push(e); store(EXP_KEY, a); return e; },
    del(id)             { store(EXP_KEY, load(EXP_KEY).filter(x => x.id !== id)); },
    itemNames()         { const nm = new Set(); load(EXP_KEY).forEach(x => { if (x.description && num(x.quantity) > 0) nm.add(x.description); }); return [...nm].sort((a,b) => a.localeCompare(b,'bn')); },
    months()            { return [...new Set(load(EXP_KEY).map(x => monthKey(x.month)).filter(Boolean))]; },
    categories()        { return [...new Set(load(EXP_KEY).map(x => x.category).filter(Boolean))]; },
    suppliers()         { return [...new Set(load(EXP_KEY).map(x => x.supplier).filter(Boolean))]; },
  };

  /* ── Supplier Dues ── */
  const Dues = {
    getAll()   { return load(DUE_KEY); },
    withDue()  { return load(DUE_KEY).filter(x => num(x.due) !== 0); },
    totalDue() { return load(DUE_KEY).reduce((s,x) => s + Math.max(0, num(x.due)), 0); },
    recordPayment(id, amt) {
      const arr = load(DUE_KEY);
      const d = arr.find(x => x.id === id);
      if (!d) return;
      d.paid = num(d.paid) + amt;
      d.due  = num(d.total) - num(d.paid);
      store(DUE_KEY, arr);
    },
    addOrUpdate(supplier, account, purchaseAmt) {
      const arr = load(DUE_KEY);
      let d = arr.find(x => x.supplier === supplier && x.account === account);
      if (!d) { d = { id: uid('due-'), supplier, account, total: 0, paid: 0, due: 0 }; arr.push(d); }
      d.total = num(d.total) + purchaseAmt;
      d.due   = num(d.total) - num(d.paid);
      store(DUE_KEY, arr);
    },
  };

  /* ── Hijri date settings ── */
  const Settings = {
    getHijriOffsetDays() { return num(localStorage.getItem(OFFSET_KEY)); },
    setHijriOffsetDays(days) { localStorage.setItem(OFFSET_KEY, String(Math.max(-3, Math.min(3, num(days))))); },
  };

  /* ── Summary ── */
  const Summary = {
    get(filterMonth) {
      const accs = Object.keys(ACCOUNT_LABELS);
      const allInc = filterMonth ? Income.getByMonth(filterMonth) : Income.getAll();
      const allExp = filterMonth ? Expense.getByMonth(filterMonth) : Expense.getAll();
      const byAcc = {};
      accs.forEach(a => {
        const incs = allInc.filter(x=>x.account===a);
        const exps = allExp.filter(x=>x.account===a);
        const inc = incs.reduce((s,x)=>s+num(x.amount),0);
        const exp = exps.reduce((s,x)=>s+num(x.amount),0);
        byAcc[a] = { inc, exp, bal: inc - exp };
      });
      const ti = allInc.reduce((s,x)=>s+num(x.amount),0);
      const te = allExp.reduce((s,x)=>s+num(x.amount),0);
      const td = Dues.totalDue();
      return { ti, te, bal: ti - te, td, byAcc };
    },
  };

  /* ── Public format helpers ── */
  function esc(s) { const d = document.createElement('div'); d.textContent = String(s || ''); return d.innerHTML; }
  function fa(n)  { return String(Math.round(num(n))).replace(/\B(?=(\d{3})+(?!\d))/g, ','); }
  function clean(s, fallback) {
    const v = String(s || '').trim();
    return /�|\?{2,}/.test(v) ? (fallback || '') : v;
  }

  /* Today's hijri month name and day number */
  function todayHijri() {
    try {
      const d = new Date();
      d.setDate(d.getDate() + Settings.getHijriOffsetDays());
      const parts = new Intl.DateTimeFormat('en-u-ca-islamic-umalqura', { year:'numeric', month:'numeric', day:'numeric' }).formatToParts(d);
      const year = parseInt(parts.find(p=>p.type==='year').value);
      const m   = parseInt(parts.find(p=>p.type==='month').value);
      const day = parseInt(parts.find(p=>p.type==='day').value);
      return { year, month: monthFromNo(m), monthNo: m, day };
    } catch {
      const y = new Date().getFullYear();
      return { year: Math.max(1440, y - 579), month: monthFromNo(10), monthNo: 10, day: 1 };
    }
  }

  return { ensureSeed, Income, Expense, Dues, Summary, Categories, Settings, MONTHS, HIJRI_MONTHS, ACCOUNT_LABELS, esc, fa, clean, monthKey, monthFromNo, monthNo, dateKey, dateLabel, parseDateInput, toDateKey, inRange, num, todayHijri };
})();
