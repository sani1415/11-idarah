/* Bridge: Supabase dept_departments ↔ local mm_dept_departments cache. */
(function (global) {
  'use strict';

  var DEPT_LS_KEY = 'mm_dept_departments';

  function mapDept(d) {
    return {
      id: d.code,          // code used as local id (login-flow compatibility)
      db_id: String(d.id), // actual Supabase UUID for save/update calls
      name: d.name || '',
      emoji: d.emoji || '🏢',
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

  global.DeptSync = { bootstrap: bootstrap, saveDepartment: saveDepartment, toggleDepartment: toggleDepartment };
})(typeof window !== 'undefined' ? window : globalThis);
