/* ═══════════════════════════════════════════
   মাদরাসাতুল মদীনা — khedmat-api.js
   খেদমতে খালক মডিউলের ডেটা লজিক
   ═══════════════════════════════════════════ */

const KhAPI = (() => {

  const KEYS = {
    beneficiaries:  'mm_kh_beneficiaries',
    activities:     'mm_kh_activities',
    activity_types: 'mm_kh_activity_types',
    daily_logs:     'mm_kh_daily_logs',
    finance:        'mm_kh_finance',
  };

  const uid   = () => Date.now().toString(36) + Math.random().toString(36).slice(2,5);
  const today = () => new Date().toISOString().split('T')[0];
  const esc   = s => String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');

  function load(key) { try { return JSON.parse(localStorage.getItem(key))||[]; } catch { return []; } }
  function save(key, data) { localStorage.setItem(key, JSON.stringify(data)); }
  function purgeKnownSampleData() {
    const sample = row => /^(bn|act|lg|fn|at)_\d+$/.test(String(row && row.id || '')) ||
      /^(bn|act)_\d+$/.test(String(row && (row.beneficiary_id || row.activity_id) || ''));
    [KEYS.beneficiaries, KEYS.activity_types, KEYS.activities, KEYS.daily_logs, KEYS.finance].forEach(key => {
      const rows = load(key);
      const next = rows.filter(row => !sample(row));
      if (next.length !== rows.length) save(key, next);
    });
  }

  /* ── SEED ── */
  function seedIfEmpty() {
    if (load(KEYS.beneficiaries).length) return;
    save(KEYS.beneficiaries, []);
  }

  /* ── BENEFICIARIES ── */
  const Beneficiaries = {
    getAll:  () => load(KEYS.beneficiaries).sort((a,b)=>b.first_contact.localeCompare(a.first_contact)),
    getById: id => load(KEYS.beneficiaries).find(b=>b.id===id),
    add(data) {
      const list = load(KEYS.beneficiaries);
      const b = { id:'bn_'+uid(), first_contact:today(), ...data };
      list.push(b);
      save(KEYS.beneficiaries, list);
      return b;
    },
    update(id, data) {
      save(KEYS.beneficiaries, load(KEYS.beneficiaries).map(b=>b.id===id?{...b,...data}:b));
    },
  };

  /* ── ACTIVITY TYPES ── */
  const ActivityTypes = {
    getAll: () => load(KEYS.activity_types).filter(t=>t.is_active),
    getById: id => load(KEYS.activity_types).find(t=>t.id===id),
    add(data) {
      const list = load(KEYS.activity_types);
      const t = { id:'at_'+uid(), is_active:true, emoji:'🤝', ...data };
      list.push(t);
      save(KEYS.activity_types, list);
      return t;
    },
  };

  /* ── ACTIVITIES ── */
  const Activities = {
    getAll:           () => load(KEYS.activities).sort((a,b)=>b.date.localeCompare(a.date)),
    getByBeneficiary: id => load(KEYS.activities).filter(a=>a.beneficiary_id===id).sort((a,b)=>b.date.localeCompare(a.date)),
    getThisMonth() {
      const m = new Date().toISOString().slice(0,7);
      return load(KEYS.activities).filter(a=>a.date.startsWith(m));
    },
    add(data) {
      const list = load(KEYS.activities);
      const a = { id:'act_'+uid(), date:today(), images:[], ...data };
      list.push(a);
      save(KEYS.activities, list);
      return a;
    },
    addImages(activityId, imageBase64Arr) {
      const list = load(KEYS.activities);
      const act = list.find(a => a.id === activityId);
      if (act) {
        if (!act.images) act.images = [];
        act.images.push(...imageBase64Arr);
        save(KEYS.activities, list);
      }
      return act;
    },
    getSummaryByType() {
      const acts  = load(KEYS.activities);
      const types = load(KEYS.activity_types);
      return types.map(t => ({
        ...t,
        count: acts.filter(a=>a.type_id===t.id).length,
        total: acts.filter(a=>a.type_id===t.id).reduce((s,a)=>s+(a.amount||0),0),
      }));
    },
  };

  /* ── DAILY LOGS ── */
  const DailyLogs = {
    getAll:   () => load(KEYS.daily_logs).sort((a,b)=>b.date.localeCompare(a.date)),
    getLatest:()  => load(KEYS.daily_logs).sort((a,b)=>b.date.localeCompare(a.date))[0] || null,
    add(content, by) {
      const list = load(KEYS.daily_logs);
      const l = { id:'lg_'+uid(), content, by, date:today() };
      list.push(l);
      save(KEYS.daily_logs, list);
      return l;
    },
  };

  /* ── FINANCE ── */
  const Finance = {
    getAll: () => load(KEYS.finance).sort((a,b)=>b.date.localeCompare(a.date)),
    add(data) {
      const list = load(KEYS.finance);
      const f = { id:'fn_'+uid(), date:today(), activity_id:null, source:null, ...data };
      list.push(f);
      save(KEYS.finance, list);
      return f;
    },
    getSummary(month) {
      const txns = month
        ? load(KEYS.finance).filter(f=>f.date.startsWith(month))
        : load(KEYS.finance);
      const income  = txns.filter(f=>f.type==='income') .reduce((s,f)=>s+f.amount,0);
      const expense = txns.filter(f=>f.type==='expense').reduce((s,f)=>s+f.amount,0);
      return { income, expense, balance: income-expense };
    },

    /* ── একাউন্টিং ফাংশন ── */
    getBalanceBefore(dateStr) {
      const all = load(KEYS.finance);
      const income  = all.filter(f=>f.type==='income'  && f.date < dateStr).reduce((s,f)=>s+f.amount,0);
      const expense = all.filter(f=>f.type==='expense' && f.date < dateStr).reduce((s,f)=>s+f.amount,0);
      return income - expense;
    },
    getForDay(dateStr) {
      return load(KEYS.finance).filter(f=>f.date===dateStr).sort((a,b)=>a.date.localeCompare(b.date));
    },
    getForMonth(yearMonth) {
      return load(KEYS.finance).filter(f=>f.date.startsWith(yearMonth)).sort((a,b)=>a.date.localeCompare(b.date));
    },
    getForYear(year) {
      return load(KEYS.finance).filter(f=>f.date.startsWith(year)).sort((a,b)=>a.date.localeCompare(b.date));
    },
    getDailySummary(yearMonth) {
      const all = load(KEYS.finance).filter(f=>f.date.startsWith(yearMonth));
      const days = {};
      all.forEach(f => {
        const d = f.date;
        if (!days[d]) days[d] = { date:d, income:0, expense:0 };
        if (f.type==='income') days[d].income += f.amount;
        else days[d].expense += f.amount;
      });
      return Object.values(days)
        .map(d => ({ ...d, net: d.income - d.expense }))
        .sort((a,b) => a.date.localeCompare(b.date));
    },
    getMonthlySummary(year) {
      const all = load(KEYS.finance).filter(f=>f.date.startsWith(year));
      const months = {};
      all.forEach(f => {
        const m = f.date.substring(0,7);
        if (!months[m]) months[m] = { month:m, income:0, expense:0 };
        if (f.type==='income') months[m].income += f.amount;
        else months[m].expense += f.amount;
      });
      return Object.values(months)
        .map(m => ({ ...m, net: m.income - m.expense }))
        .sort((a,b) => a.month.localeCompare(b.month));
    },
    getYearlySummary() {
      const all = load(KEYS.finance);
      const years = {};
      all.forEach(f => {
        const y = f.date.substring(0,4);
        if (!years[y]) years[y] = { year:y, income:0, expense:0 };
        if (f.type==='income') years[y].income += f.amount;
        else years[y].expense += f.amount;
      });
      return Object.values(years)
        .map(y => ({ ...y, net: y.income - y.expense }))
        .sort((a,b) => a.year.localeCompare(b.year));
    },
  };

  seedIfEmpty();
  purgeKnownSampleData();
  return { Beneficiaries, ActivityTypes, Activities, DailyLogs, Finance, uid, today, esc };

})();
