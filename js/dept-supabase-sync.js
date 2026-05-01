/* Bridge: Supabase dept_departments ↔ local mm_dept_departments cache. */
(function (global) {
  'use strict';

  var DEPT_LS_KEY = 'mm_dept_departments';
  var TXN_LS_KEY = 'mm_dept_transactions';
  var INV_LS_KEY = 'mm_dept_inventory';
  var PRODUCT_LS_KEY = 'mm_dept_products';

  function normalizeEmoji(code, emoji) {
    if (code === 'dept_4' && (!emoji || emoji === '🧵')) return '✂️';
    return emoji || '🏢';
  }

  function mapDept(d) {
    return {
      id: d.code,          // code used as local id (login-flow compatibility)
      db_id: String(d.id), // actual Supabase UUID for save/update calls
      name: d.name || '',
      emoji: normalizeEmoji(d.code, d.emoji),
      is_active: true,
      pin: '',             // pin is per-user in Supabase, not per-department
    };
  }

  async function bootstrap() {
    if (!global.MMSharedAPI) return false;
    try {
      var res = await MMSharedAPI.listDepartments();
      if (!res || !res.ok) return false;
      var depts = (res.departments || []).map(mapDept);
      localStorage.setItem(DEPT_LS_KEY, JSON.stringify(depts));
      return true;
    } catch (e) {
      console.warn('[DeptSync] bootstrap failed:', e);
      return false;
    }
  }

  async function saveDepartment(pin, dbId, name, emoji) {
    if (!global.MMSharedAPI) return null;
    var res = await MMSharedAPI.saveDepartment(pin, dbId || null, name, emoji || '🏢', null, true);
    if (!res || !res.ok) throw new Error((res && res.error) || 'save_failed');
    await bootstrap();
    return res.id;
  }

  async function toggleDepartment(pin, dbId, isActive) {
    if (!global.MMSharedAPI) return;
    var dept = (JSON.parse(localStorage.getItem(DEPT_LS_KEY) || '[]')).find(function (d) { return d.db_id === dbId; });
    var name = dept ? dept.name : '';
    var emoji = dept ? dept.emoji : '🏢';
    var res = await MMSharedAPI.saveDepartment(pin, dbId, name, emoji, null, isActive);
    if (!res || !res.ok) throw new Error((res && res.error) || 'update_failed');
    await bootstrap();
  }

  function replaceDeptRows(key, deptCode, rows) {
    var existing = [];
    try { existing = JSON.parse(localStorage.getItem(key) || '[]') || []; } catch (_) {}
    var next = existing.filter(function (row) { return row && row.dept_id !== deptCode; })
      .concat((rows || []).map(function (row) { return Object.assign({}, row, { dept_id: deptCode }); }));
    localStorage.setItem(key, JSON.stringify(next));
  }

  async function bootstrapData(actorId, pin, deptCode) {
    if (!global.MMSharedAPI || !actorId || !pin || !deptCode) return false;
    try {
      var res = await MMSharedAPI.deptBootstrap(actorId, pin, deptCode);
      if (!res || !res.ok) return false;
      replaceDeptRows(PRODUCT_LS_KEY, deptCode, res.products || []);
      replaceDeptRows(INV_LS_KEY, deptCode, res.inventory || []);
      replaceDeptRows(TXN_LS_KEY, deptCode, res.transactions || []);
      return true;
    } catch (e) {
      console.warn('[DeptSync] data bootstrap failed:', e);
      return false;
    }
  }

  async function saveProduct(actorId, pin, deptCode, product) {
    if (!global.MMSharedAPI) return null;
    var res = await MMSharedAPI.saveDeptProduct(actorId, pin, deptCode, product || {});
    if (!res || !res.ok) throw new Error((res && res.error) || 'save_product_failed');
    await bootstrapData(actorId, pin, deptCode);
    return res.id;
  }

  async function saveTransaction(actorId, pin, deptCode, txn) {
    if (!global.MMSharedAPI) return null;
    var res = await MMSharedAPI.saveDeptTransaction(actorId, pin, deptCode, txn || {});
    if (!res || !res.ok) throw new Error((res && res.error) || 'save_transaction_failed');
    await bootstrapData(actorId, pin, deptCode);
    return res.id;
  }

  async function updateTransaction(actorId, pin, deptCode, txnId, txn) {
    if (!global.MMSharedAPI) return null;
    var res = await MMSharedAPI.updateDeptTransaction(actorId, pin, deptCode, txnId, txn || {});
    if (!res || !res.ok) throw new Error((res && res.error) || 'update_transaction_failed');
    await bootstrapData(actorId, pin, deptCode);
    return res.id;
  }

  async function deleteTransaction(actorId, pin, deptCode, txnId) {
    if (!global.MMSharedAPI) return null;
    var res = await MMSharedAPI.deleteDeptTransaction(actorId, pin, deptCode, txnId);
    if (!res || !res.ok) throw new Error((res && res.error) || 'delete_transaction_failed');
    await bootstrapData(actorId, pin, deptCode);
    return res.id;
  }

  async function adjustInventory(actorId, pin, deptCode, item) {
    if (!global.MMSharedAPI) return null;
    var res = await MMSharedAPI.adjustDeptInventory(actorId, pin, deptCode, item || {});
    if (!res || !res.ok) throw new Error((res && res.error) || 'adjust_inventory_failed');
    await bootstrapData(actorId, pin, deptCode);
    return true;
  }

  global.DeptSync = {
    bootstrap: bootstrap,
    saveDepartment: saveDepartment,
    toggleDepartment: toggleDepartment,
    bootstrapData: bootstrapData,
    saveProduct: saveProduct,
    saveTransaction: saveTransaction,
    updateTransaction: updateTransaction,
    deleteTransaction: deleteTransaction,
    adjustInventory: adjustInventory
  };
})(typeof window !== 'undefined' ? window : globalThis);
