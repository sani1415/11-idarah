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
    extra_fields:  'mm_dept_extra_fields',
    products:      'mm_dept_products',
  };

  const CACHE = {};
  const clone = value => JSON.parse(JSON.stringify(value));
  const uid  = () => Date.now().toString(36) + Math.random().toString(36).slice(2,5);
  const today = () => new Date().toISOString().split('T')[0];
  const esc  = s => String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');

  function load(key) {
    const value = CACHE[key];
    return Array.isArray(value) ? clone(value) : [];
  }
  function loadObj(key) {
    const value = CACHE[key];
    return value && typeof value === 'object' && !Array.isArray(value) ? clone(value) : {};
  }
  function save(key, data) { CACHE[key] = clone(data || []); }
  function saveObj(key, data) { CACHE[key] = clone(data || {}); }
  function cacheGet(key, fallback) {
    return CACHE[key] === undefined ? clone(fallback) : clone(CACHE[key]);
  }
  function cacheSet(key, value) { CACHE[key] = clone(value); }
  function deptIcon(id, emoji) {
    if (id === 'dept_4' && (!emoji || emoji === '🧵')) return '✂️';
    return emoji || '🏢';
  }
  function purgeKnownSampleData() {
    const sample = row => /^(dept|txn|inv)_\d+$/.test(String(row && row.id || ''));
    [KEYS.departments, KEYS.transactions, KEYS.inventory].forEach(key => {
      const rows = load(key);
      const next = rows.filter(row => !sample(row));
      if (next.length !== rows.length) save(key, next);
    });
  }

  /* ── SEED ── */
  function seedIfEmpty() {
    const existing = load(KEYS.departments);
    const defaultDepts = [
      { id:'dept_1', name:'কৃষি বিভাগ', emoji:'🌾', pin:'0000', is_active:true },
      { id:'dept_2', name:'মধু বিভাগ', emoji:'🍯', pin:'0000', is_active:true },
      { id:'dept_3', name:'বেকারি বিভাগ', emoji:'🍞', pin:'0000', is_active:true },
      { id:'dept_4', name:'সেলাই বিভাগ', emoji:'✂️', pin:'0000', is_active:true },
      { id:'dept_5', name:'স্টোর', emoji:'📦', pin:'0000', is_active:true },
      { id:'dept_6', name:'রান্নাঘর', emoji:'🍽️', pin:'0000', is_active:true },
      { id:'dept_7', name:'বই বিতরণ', emoji:'📚', pin:'0000', is_active:true },
    ];
    if (existing.length) {
      /* migration: নতুন বিভাগ যোগ হলে শুধু সেটা ঢুকিয়ে দাও */
      let changed = false;
      defaultDepts.forEach(nd => {
        if (!existing.find(d => d.id === nd.id)) { existing.push(nd); changed = true; }
      });
      existing.forEach(d => {
        const nextEmoji = deptIcon(d.id, d.emoji);
        if (d.emoji !== nextEmoji) { d.emoji = nextEmoji; changed = true; }
      });
      if (changed) save(KEYS.departments, existing);
      return;
    }
    save(KEYS.departments, defaultDepts);
  }

  /* ── DEPARTMENTS ── */
  const Departments = {
    getAll:   () => load(KEYS.departments).filter(d => d.is_active !== false),
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

  /* ── Legacy default field definitions, kept only for reference. DB data is authoritative. ── */
  const SUBDEPT_EXTRA_FIELDS_DEFAULT = {
    dept_1: [{ key:'plot',      label:'জমি / প্লট রেফারেন্স',  type:'text',   optional:true }],
    dept_2: [{ key:'hives',     label:'মৌচাক সংখ্যা (ঐন)',     type:'number', optional:true }],
    dept_3: [{ key:'batch',     label:'ব্যাচ / লট',             type:'text',   optional:true }],
    dept_4: [{ key:'item_type', label:'পণ্যের ধরন',             type:'text',   optional:true }],
  };

  function _loadExtraFields() {
    return loadObj(KEYS.extra_fields);
  }

  /* ── ExtraFields — প্রতিটি বিভাগের অতিরিক্ত ইনপুট ক্ষেত্র ── */
  const ExtraFields = {
    get(dept_id) {
      const stored = _loadExtraFields();
      return stored[dept_id] !== undefined ? stored[dept_id] : [];
    },
    set(dept_id, fields) {
      const all = _loadExtraFields();
      all[dept_id] = fields;
      saveObj(KEYS.extra_fields, all);
    },
    add(dept_id, field) {
      const fields = this.get(dept_id);
      if (!field.key || fields.find(f => f.key === field.key)) return false;
      this.set(dept_id, [...fields, field]);
      return true;
    },
    remove(dept_id, key) {
      this.set(dept_id, this.get(dept_id).filter(f => f.key !== key));
    },
  };

  function getSubdeptFields(dept_id) { return ExtraFields.get(dept_id); }

  /* ── TRANSACTIONS ── */
  const Transactions = {
    getByDept: id => load(KEYS.transactions)
      .filter(t => t.dept_id===id)
      .sort((a,b) => String(b.date||b.txn_date||'').localeCompare(String(a.date||a.txn_date||''))),
    getByMonth(id, month) {
      return load(KEYS.transactions).filter(t => {
        const d = String(t.date || t.txn_date || '');
        return t.dept_id===id && d.startsWith(month);
      });
    },
    getAll: () => load(KEYS.transactions).sort((a,b)=>String(b.date||b.txn_date||'').localeCompare(String(a.date||a.txn_date||''))),
    add(data) {
      const list = load(KEYS.transactions);
      const dateVal = data.date || data.txn_date || today();
      const { txn_date, metadata: metaIn, ...rest } = data;
      const meta = (metaIn && typeof metaIn === 'object') ? { ...metaIn } : {};
      const t = {
        id:'txn_'+uid(),
        created_at: new Date().toISOString(),
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
    remove(id) {
      save(KEYS.transactions, load(KEYS.transactions).filter(t => String(t.id) !== String(id)));
    },
  };

  /* ── INVENTORY ── */
  const Inventory = {
    getByDept: id => load(KEYS.inventory).filter(i => i.dept_id===id),
    add(data) {
      const list = load(KEYS.inventory);
      const name = data.item_name || data.product || '';
      const existing = list.findIndex(i =>
        i.dept_id===data.dept_id &&
        String(i.product_id || '') === String(data.product_id || '') &&
        String(i.item_name || i.product || '').toLowerCase() === String(name).toLowerCase()
      );
      const item = { id:'inv_'+uid(), date_updated:today(), ...data, item_name:name };
      if (existing >= 0) {
        const nextQty = Number(list[existing].quantity || 0) + Number(data.quantity || 0);
        list[existing] = { ...list[existing], ...item, id:list[existing].id, quantity:nextQty };
      }
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

  /* ── PRODUCTS (পণ্য তালিকা) ── */
  const Products = {
    getByDept: id => load(KEYS.products).filter(p => p.dept_id === id && p.is_active !== false),
    getAll: () => load(KEYS.products),
    getById: id => load(KEYS.products).find(p => p.id === id),
    add(data) {
      const list = load(KEYS.products);
      const p = { id: 'prd_' + uid(), is_active: true, unit: 'পিস', price: 0, ...data };
      list.push(p);
      save(KEYS.products, list);
      return p;
    },
    update(id, data) {
      save(KEYS.products, load(KEYS.products).map(p => p.id === id ? { ...p, ...data } : p));
    },
    remove(id) {
      save(KEYS.products, load(KEYS.products).map(p => p.id === id ? { ...p, is_active: false } : p));
    },
  };

  return {
    Departments,
    Transactions,
    Inventory,
    EditRequests,
    ExtraFields,
    Products,
    getSubdeptFields,
    uid,
    today,
    esc,
    __cacheGet: cacheGet,
    __cacheSet: cacheSet,
    __keys: KEYS,
  };

})();
