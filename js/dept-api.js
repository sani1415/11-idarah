/* ═══════════════════════════════════════════
   মাদরাসাতুল মদীনা — dept-api.js
   বিভাগ মডিউলের ডেটা লজিক
   ═══════════════════════════════════════════ */

const DeptAPI = (() => {

  const KEYS = {
    departments:   'mm_dept_departments',
    transactions:  'mm_dept_transactions',
    inventory:     'mm_dept_inventory',
    edit_requests: 'mm_dept_edit_requests',
  };

  const uid  = () => Date.now().toString(36) + Math.random().toString(36).slice(2,5);
  const today = () => new Date().toISOString().split('T')[0];
  const esc  = s => String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');

  function load(key) { try { return JSON.parse(localStorage.getItem(key))||[]; } catch { return []; } }
  function save(key, data) { localStorage.setItem(key, JSON.stringify(data)); }

  /* ── SEED ── */
  function seedIfEmpty() {
    if (load(KEYS.departments).length) return;

    save(KEYS.departments, [
      { id:'dept_1', name:'কৃষি বিভাগ',   emoji:'🌾', pin:'0000', is_active:true },
      { id:'dept_2', name:'মধু বিভাগ',    emoji:'🍯', pin:'0000', is_active:true },
      { id:'dept_3', name:'বেকারি বিভাগ', emoji:'🍞', pin:'0000', is_active:true },
      { id:'dept_4', name:'স্টোর',        emoji:'📦', pin:'0000', is_active:true },
      { id:'dept_5', name:'রান্নাঘর',     emoji:'🍽️', pin:'0000', is_active:true },
      { id:'dept_6', name:'বই বিতরণ',     emoji:'📚', pin:'0000', is_active:true },
    ]);

    save(KEYS.transactions, [
      { id:'txn_1', dept_id:'dept_1', type:'income',  amount:5000, description:'ধান বিক্রয়',    date:'2026-04-01', proof_note:'', locked:true,  metadata:{ plot:'প্লট-ক' } },
      { id:'txn_2', dept_id:'dept_1', type:'expense', amount:800,  description:'সার ক্রয়',       date:'2026-04-05', proof_note:'', locked:false, metadata:{} },
      { id:'txn_3', dept_id:'dept_2', type:'income',  amount:3200, description:'মধু বিক্রয়',   date:'2026-04-03', proof_note:'', locked:true,  metadata:{ hives:12 } },
      { id:'txn_4', dept_id:'dept_3', type:'income',  amount:2500, description:'রুটি বিক্রয়',  date:'2026-04-10', proof_note:'', locked:false, metadata:{ batch:'ব্যাচ ৩' } },
      { id:'txn_5', dept_id:'dept_3', type:'expense', amount:1200, description:'আটা ও মসলা',   date:'2026-04-10', proof_note:'', locked:false, metadata:{} },
    ]);

    save(KEYS.inventory, [
      { id:'inv_1', dept_id:'dept_1', product:'ধান',  quantity:250, unit:'কেজি',  date_updated:'2026-04-01' },
      { id:'inv_2', dept_id:'dept_2', product:'মধু',  quantity:15,  unit:'কেজি',  date_updated:'2026-04-03' },
      { id:'inv_3', dept_id:'dept_3', product:'আটা',  quantity:50,  unit:'কেজি',  date_updated:'2026-04-10' },
      { id:'inv_4', dept_id:'dept_3', product:'চিনি', quantity:20,  unit:'কেজি',  date_updated:'2026-04-10' },
    ]);
  }

  /* ── DEPARTMENTS ── */
  const Departments = {
    getAll:   () => load(KEYS.departments).filter(d => d.is_active),
    getAll_:  () => load(KEYS.departments),
    getById:  id => load(KEYS.departments).find(d => d.id === id),
    verifyPin(id, pin) {
      const d = load(KEYS.departments).find(d => d.id === id);
      return d && d.pin === pin;
    },
    add(data) {
      const list = load(KEYS.departments);
      const d = { id:'dept_'+uid(), is_active:true, pin:'0000', ...data };
      list.push(d);
      save(KEYS.departments, list);
      return d;
    },
    update(id, data) {
      save(KEYS.departments, load(KEYS.departments).map(d => d.id===id ? {...d,...data} : d));
    },
  };

  /* ── Per–sub-department extra fields (keyed by department id)
      Add rows here when a বিভাগ needs ১–২ extra inputs on top of shared amount/description/date.
      UI reads this to build the form; values live on each transaction under `metadata`. */
  const SUBDEPT_EXTRA_FIELDS = {
    dept_1: [
      { key:'plot', label:'জমি / প্লট রেফারেন্স', type:'text', placeholder:'যেমন: প্লট-ক', optional:true },
    ],
    dept_2: [
      { key:'hives', label:'মৌচাক সংখ্যা (ঐন)', type:'number', placeholder:'১২', optional:true },
    ],
    dept_3: [
      { key:'batch', label:'ব্যাচ / লট', type:'text', placeholder:'যেমন: ব্যাচ ১২', optional:true },
    ],
  };

  function getSubdeptFields(dept_id) {
    return SUBDEPT_EXTRA_FIELDS[dept_id] ? SUBDEPT_EXTRA_FIELDS[dept_id].slice() : [];
  }

  /* ── TRANSACTIONS ── */
  const Transactions = {
    getByDept: id => load(KEYS.transactions)
      .filter(t => t.dept_id===id)
      .sort((a,b) => b.date.localeCompare(a.date)),
    getByMonth(id, month) {
      return load(KEYS.transactions).filter(t => t.dept_id===id && t.date.startsWith(month));
    },
    getAll: () => load(KEYS.transactions).sort((a,b)=>b.date.localeCompare(a.date)),
    add(data) {
      const list = load(KEYS.transactions);
      const dateVal = data.date || data.txn_date || today();
      const { txn_date, metadata: metaIn, ...rest } = data;
      const meta = (metaIn && typeof metaIn === 'object') ? { ...metaIn } : {};
      const t = {
        id:'txn_'+uid(),
        locked:false,
        proof_note: data.proof_note ?? '',
        ...rest,
        date: dateVal,
        metadata: meta,
      };
      list.push(t);
      save(KEYS.transactions, list);
      return t;
    },
    update(id, data) {
      save(KEYS.transactions, load(KEYS.transactions).map(t => t.id===id ? {...t,...data} : t));
    },
    lock(id)   { this.update(id, { locked:true  }); },
    unlock(id) { this.update(id, { locked:false }); },
    getSummary(dept_id, month) {
      const txns = month ? this.getByMonth(dept_id, month) : this.getByDept(dept_id);
      const income  = txns.filter(t=>t.type==='income') .reduce((a,t)=>a+t.amount,0);
      const expense = txns.filter(t=>t.type==='expense').reduce((a,t)=>a+t.amount,0);
      return { income, expense, net: income-expense };
    },
    getAllSummary(month) {
      return load(KEYS.departments).filter(d=>d.is_active).map(d => ({
        ...d, ...this.getSummary(d.id, month)
      }));
    },
  };

  /* ── INVENTORY ── */
  const Inventory = {
    getByDept: id => load(KEYS.inventory).filter(i => i.dept_id===id),
    add(data) {
      const list = load(KEYS.inventory);
      const existing = list.findIndex(i => i.dept_id===data.dept_id && i.product===data.product);
      const item = { id:'inv_'+uid(), date_updated:today(), ...data };
      if (existing >= 0) list[existing] = { ...list[existing], ...item, id:list[existing].id };
      else list.push(item);
      save(KEYS.inventory, list);
      return item;
    },
    update(id, data) {
      save(KEYS.inventory, load(KEYS.inventory).map(i => i.id===id ? {...i,...data,date_updated:today()} : i));
    },
    remove(id) {
      save(KEYS.inventory, load(KEYS.inventory).filter(i => i.id!==id));
    },
  };

  /* ── EDIT REQUESTS ── */
  const EditRequests = {
    getByDept:  dept_id => load(KEYS.edit_requests).filter(r=>r.dept_id===dept_id),
    getPending: ()      => load(KEYS.edit_requests).filter(r=>r.status==='pending'),
    getAll:     ()      => load(KEYS.edit_requests).sort((a,b)=>b.created.localeCompare(a.created)),
    add(data) {
      const list = load(KEYS.edit_requests);
      const r = { id:'er_'+uid(), status:'pending', created:today(), ...data };
      list.push(r);
      save(KEYS.edit_requests, list);
      return r;
    },
    approve(id) {
      save(KEYS.edit_requests, load(KEYS.edit_requests).map(r=>r.id===id?{...r,status:'approved'}:r));
    },
    reject(id) {
      save(KEYS.edit_requests, load(KEYS.edit_requests).map(r=>r.id===id?{...r,status:'rejected'}:r));
    },
  };

  seedIfEmpty();
  return { Departments, Transactions, Inventory, EditRequests, getSubdeptFields, uid, today, esc };

})();
