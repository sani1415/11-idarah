/* Madrasa module: Khedmat-e-Khalq database cache and RPC wrappers. */

const KhAPI = (() => {
  const CACHE = {
    beneficiaries: [],
    activities: [],
    activity_types: [],
    daily_logs: [],
    finance: [],
  };

  const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 5);
  const today = () => new Date().toISOString().split('T')[0];
  const esc = s => String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

  function asArray(v) {
    return Array.isArray(v) ? v : [];
  }

  function asNumber(v) {
    const n = Number(v || 0);
    return Number.isFinite(n) ? n : 0;
  }

  function normalizeBeneficiary(row) {
    return {
      id: String(row && row.id || ''),
      name: row && row.name || '',
      address: row && row.address || '',
      phone: row && row.phone || '',
      family_info: row && row.family_info || '',
      notes: row && row.notes || '',
      first_contact: row && row.first_contact || today(),
    };
  }

  function normalizeType(row) {
    return {
      id: String(row && row.id || ''),
      name: row && row.name || '',
      emoji: row && row.emoji || '🤝',
      is_active: !row || row.is_active !== false,
      sort_order: Number(row && row.sort_order || 0),
    };
  }

  function normalizeActivity(row) {
    return {
      id: String(row && row.id || ''),
      beneficiary_id: row && row.beneficiary_id || '',
      type_id: row && row.type_id || '',
      title: row && row.title || '',
      description: row && row.description || '',
      amount: asNumber(row && row.amount),
      date: row && row.date || today(),
      images: asArray(row && row.images),
    };
  }

  function normalizeLog(row) {
    return {
      id: String(row && row.id || ''),
      content: row && row.content || '',
      by: row && row.by || '',
      date: row && row.date || today(),
    };
  }

  function normalizeFinance(row) {
    return {
      id: String(row && row.id || ''),
      type: row && row.type === 'income' ? 'income' : 'expense',
      amount: asNumber(row && row.amount),
      description: row && row.description || '',
      source: row && row.source || null,
      activity_id: row && row.activity_id || null,
      date: row && row.date || today(),
    };
  }

  function setCache(payload) {
    CACHE.beneficiaries = asArray(payload && payload.beneficiaries).map(normalizeBeneficiary);
    CACHE.activity_types = asArray(payload && payload.activity_types).map(normalizeType);
    CACHE.activities = asArray(payload && payload.activities).map(normalizeActivity);
    CACHE.daily_logs = asArray(payload && payload.daily_logs).map(normalizeLog);
    CACHE.finance = asArray(payload && payload.finance).map(normalizeFinance);
  }

  function replaceById(list, row) {
    const idx = list.findIndex(item => item.id === row.id);
    if (idx >= 0) list[idx] = row;
    else list.push(row);
    return row;
  }

  function removeById(list, id) {
    const idx = list.findIndex(item => item.id === id);
    if (idx >= 0) list.splice(idx, 1);
  }

  function requireSharedAPI() {
    if (!window.MMSharedAPI) throw new Error('Database API is not loaded');
    return window.MMSharedAPI;
  }

  function getActorId(actorId) {
    if (actorId) return actorId;
    if (window.MMSession && MMSession.getId) return MMSession.getId();
    return null;
  }

  function getPin(pin) {
    if (pin) return pin;
    if (window.MMSession && MMSession.getPin) return MMSession.getPin();
    return '';
  }

  function unwrap(res, key) {
    if (!res || res.ok !== true) throw new Error((res && res.error) || 'database_error');
    return res[key] || null;
  }

  async function bootstrapRemote(actorId, pin) {
    const res = await requireSharedAPI().khedmatBootstrap(getActorId(actorId), getPin(pin));
    if (!res || res.ok !== true) throw new Error((res && res.error) || 'khedmat_bootstrap_failed');
    setCache(res);
    return res;
  }

  const Beneficiaries = {
    getAll: () => CACHE.beneficiaries.slice().sort((a, b) => String(b.first_contact || '').localeCompare(String(a.first_contact || ''))),
    getById: id => CACHE.beneficiaries.find(b => b.id === id),
    async add(data, actorId, pin) {
      const payload = { id: 'bn_' + uid(), first_contact: today(), ...(data || {}) };
      const row = normalizeBeneficiary(unwrap(await requireSharedAPI().khedmatUpsertBeneficiary(getActorId(actorId), getPin(pin), payload), 'beneficiary'));
      return replaceById(CACHE.beneficiaries, row);
    },
    async update(id, data, actorId, pin) {
      const current = this.getById(id) || {};
      const payload = { ...current, ...(data || {}), id };
      const row = normalizeBeneficiary(unwrap(await requireSharedAPI().khedmatUpsertBeneficiary(getActorId(actorId), getPin(pin), payload), 'beneficiary'));
      return replaceById(CACHE.beneficiaries, row);
    },
    async delete(id, actorId, pin) {
      unwrap(await requireSharedAPI().khedmatDeleteBeneficiary(getActorId(actorId), getPin(pin), id), 'beneficiary');
      removeById(CACHE.beneficiaries, id);
      CACHE.activities = CACHE.activities.filter(a => a.beneficiary_id !== id);
    },
  };

  const ActivityTypes = {
    getAll: () => CACHE.activity_types.filter(t => t.is_active).sort((a, b) => a.sort_order - b.sort_order),
    getById: id => CACHE.activity_types.find(t => t.id === id),
    async add(data, actorId, pin) {
      const payload = { id: 'at_' + uid(), is_active: true, emoji: '🤝', ...(data || {}) };
      const row = normalizeType(unwrap(await requireSharedAPI().khedmatUpsertActivityType(getActorId(actorId), getPin(pin), payload), 'activity_type'));
      return replaceById(CACHE.activity_types, row);
    },
    async update(id, data, actorId, pin) {
      const current = this.getById(id) || {};
      const payload = { ...current, ...(data || {}), id };
      const row = normalizeType(unwrap(await requireSharedAPI().khedmatUpsertActivityType(getActorId(actorId), getPin(pin), payload), 'activity_type'));
      return replaceById(CACHE.activity_types, row);
    },
    async delete(id, actorId, pin) {
      return this.update(id, { is_active: false }, actorId, pin);
    },
  };

  const Activities = {
    getAll: () => CACHE.activities.slice().sort((a, b) => String(b.date || '').localeCompare(String(a.date || ''))),
    getByBeneficiary: id => CACHE.activities.filter(a => a.beneficiary_id === id).sort((a, b) => String(b.date || '').localeCompare(String(a.date || ''))),
    getThisMonth() {
      const m = new Date().toISOString().slice(0, 7);
      return CACHE.activities.filter(a => String(a.date || '').startsWith(m));
    },
    async add(data, actorId, pin) {
      const payload = { id: 'act_' + uid(), date: today(), images: [], ...(data || {}) };
      const row = normalizeActivity(unwrap(await requireSharedAPI().khedmatUpsertActivity(getActorId(actorId), getPin(pin), payload), 'activity'));
      return replaceById(CACHE.activities, row);
    },
    async update(id, data, actorId, pin) {
      const current = CACHE.activities.find(a => a.id === id) || {};
      const payload = { ...current, ...(data || {}), id };
      const row = normalizeActivity(unwrap(await requireSharedAPI().khedmatUpsertActivity(getActorId(actorId), getPin(pin), payload), 'activity'));
      return replaceById(CACHE.activities, row);
    },
    async addImages(activityId, imageBase64Arr, actorId, pin) {
      const row = normalizeActivity(unwrap(await requireSharedAPI().khedmatAddActivityImages(getActorId(actorId), getPin(pin), activityId, imageBase64Arr || []), 'activity'));
      return replaceById(CACHE.activities, row);
    },
    async delete(activityId, actorId, pin) {
      unwrap(await requireSharedAPI().khedmatDeleteActivity(getActorId(actorId), getPin(pin), activityId), 'activity');
      removeById(CACHE.activities, activityId);
      CACHE.finance.forEach(f => {
        if (f.activity_id === activityId) f.activity_id = null;
      });
    },
    getSummaryByType() {
      const acts = CACHE.activities;
      return CACHE.activity_types.map(t => ({
        ...t,
        count: acts.filter(a => a.type_id === t.id).length,
        total: acts.filter(a => a.type_id === t.id).reduce((s, a) => s + asNumber(a.amount), 0),
      }));
    },
  };

  const DailyLogs = {
    getAll: () => CACHE.daily_logs.slice().sort((a, b) => String(b.date || '').localeCompare(String(a.date || ''))),
    getLatest: () => DailyLogs.getAll()[0] || null,
    async add(content, by, actorId, pin, date) {
      const payload = { id: 'lg_' + uid(), content, by, date: date || today() };
      const row = normalizeLog(unwrap(await requireSharedAPI().khedmatUpsertDailyLog(getActorId(actorId), getPin(pin), payload), 'log'));
      return replaceById(CACHE.daily_logs, row);
    },
    async update(id, data, actorId, pin) {
      const current = CACHE.daily_logs.find(l => l.id === id) || {};
      const payload = { ...current, ...(data || {}), id };
      const row = normalizeLog(unwrap(await requireSharedAPI().khedmatUpsertDailyLog(getActorId(actorId), getPin(pin), payload), 'log'));
      return replaceById(CACHE.daily_logs, row);
    },
    async delete(id, actorId, pin) {
      unwrap(await requireSharedAPI().khedmatDeleteDailyLog(getActorId(actorId), getPin(pin), id), 'log');
      removeById(CACHE.daily_logs, id);
    },
  };

  const Finance = {
    getAll: () => CACHE.finance.slice().sort((a, b) => String(b.date || '').localeCompare(String(a.date || ''))),
    async add(data, actorId, pin) {
      const payload = { id: 'fn_' + uid(), date: today(), activity_id: null, source: null, ...(data || {}) };
      const row = normalizeFinance(unwrap(await requireSharedAPI().khedmatUpsertFinance(getActorId(actorId), getPin(pin), payload), 'finance'));
      return replaceById(CACHE.finance, row);
    },
    async update(id, data, actorId, pin) {
      const current = CACHE.finance.find(f => f.id === id) || {};
      const payload = { ...current, ...(data || {}), id };
      const row = normalizeFinance(unwrap(await requireSharedAPI().khedmatUpsertFinance(getActorId(actorId), getPin(pin), payload), 'finance'));
      return replaceById(CACHE.finance, row);
    },
    async delete(id, actorId, pin) {
      unwrap(await requireSharedAPI().khedmatDeleteFinance(getActorId(actorId), getPin(pin), id), 'finance');
      removeById(CACHE.finance, id);
    },
    getSummary(month) {
      const txns = month ? CACHE.finance.filter(f => String(f.date || '').startsWith(month)) : CACHE.finance;
      const income = txns.filter(f => f.type === 'income').reduce((s, f) => s + asNumber(f.amount), 0);
      const expense = txns.filter(f => f.type === 'expense').reduce((s, f) => s + asNumber(f.amount), 0);
      return { income, expense, balance: income - expense };
    },
    getBalanceBefore(dateStr) {
      const income = CACHE.finance.filter(f => f.type === 'income' && f.date < dateStr).reduce((s, f) => s + asNumber(f.amount), 0);
      const expense = CACHE.finance.filter(f => f.type === 'expense' && f.date < dateStr).reduce((s, f) => s + asNumber(f.amount), 0);
      return income - expense;
    },
    getForDay(dateStr) {
      return CACHE.finance.filter(f => f.date === dateStr).sort((a, b) => String(a.date || '').localeCompare(String(b.date || '')));
    },
    getForMonth(yearMonth) {
      return CACHE.finance.filter(f => String(f.date || '').startsWith(yearMonth)).sort((a, b) => String(a.date || '').localeCompare(String(b.date || '')));
    },
    getForYear(year) {
      return CACHE.finance.filter(f => String(f.date || '').startsWith(year)).sort((a, b) => String(a.date || '').localeCompare(String(b.date || '')));
    },
    getDailySummary(yearMonth) {
      const days = {};
      CACHE.finance.filter(f => String(f.date || '').startsWith(yearMonth)).forEach(f => {
        const d = f.date;
        if (!days[d]) days[d] = { date: d, income: 0, expense: 0 };
        if (f.type === 'income') days[d].income += asNumber(f.amount);
        else days[d].expense += asNumber(f.amount);
      });
      return Object.values(days).map(d => ({ ...d, net: d.income - d.expense })).sort((a, b) => a.date.localeCompare(b.date));
    },
    getMonthlySummary(year) {
      const months = {};
      CACHE.finance.filter(f => String(f.date || '').startsWith(year)).forEach(f => {
        const m = f.date.substring(0, 7);
        if (!months[m]) months[m] = { month: m, income: 0, expense: 0 };
        if (f.type === 'income') months[m].income += asNumber(f.amount);
        else months[m].expense += asNumber(f.amount);
      });
      return Object.values(months).map(m => ({ ...m, net: m.income - m.expense })).sort((a, b) => a.month.localeCompare(b.month));
    },
    getYearlySummary() {
      const years = {};
      CACHE.finance.forEach(f => {
        const y = String(f.date || '').substring(0, 4);
        if (!years[y]) years[y] = { year: y, income: 0, expense: 0 };
        if (f.type === 'income') years[y].income += asNumber(f.amount);
        else years[y].expense += asNumber(f.amount);
      });
      return Object.values(years).map(y => ({ ...y, net: y.income - y.expense })).sort((a, b) => a.year.localeCompare(b.year));
    },
  };

  return { bootstrapRemote, setCache, Beneficiaries, ActivityTypes, Activities, DailyLogs, Finance, uid, today, esc };
})();

if (typeof window !== 'undefined') {
  window.KhAPI = KhAPI;
}
