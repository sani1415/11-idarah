/* খাদিমিন তালিকা — Supabase RPC (দফতর / এডমিন) */
(function (global) {
  'use strict';

  var _cached = {
    khadimin: [],
    leaves: [],
    session_start_date: null,
    hijri_year: null,
  };

  function actor() {
    if (!global.MMSession) return null;
    if (MMSession.isAdmin && MMSession.isAdmin()) {
      return { id: MMSession.getAdminUserId && MMSession.getAdminUserId(), pin: MMSession.getAdminPin && MMSession.getAdminPin() };
    }
    return { id: MMSession.getStaffUserId && MMSession.getStaffUserId(), pin: MMSession.getStaffPin && MMSession.getStaffPin() };
  }

  function normalizeKhadim(k) {
    if (!k) return null;
    var id = k.id != null ? String(k.id) : '';
    var jd = k.join_date != null ? String(k.join_date).slice(0, 10) : '';
    return {
      id: id,
      name: k.name || '',
      phone: k.phone || '',
      duty: k.duty || '',
      join_date: jd || '',
      status: k.status || 'active',
      address: k.address || '',
      details: k.details || '',
      notes: Array.isArray(k.notes) ? k.notes : [],
    };
  }

  function normalizeLeave(row) {
    if (!row) return null;
    return {
      id: String(row.id || ''),
      khadim_id: String(row.khadim_id || ''),
      from: String(row.from || '').slice(0, 10),
      to: String(row.to || row.from || '').slice(0, 10),
      reason: row.reason || '',
      days: Number(row.days) || 0,
    };
  }

  async function sync() {
    if (!global.MMSharedAPI) return false;
    var a = actor();
    if (!a || !a.id || !a.pin) return false;
    var res = await MMSharedAPI.khadiminList(a.id, a.pin);
    if (!res || res.ok !== true) return false;
    _cached.khadimin = (res.khadimin || []).map(normalizeKhadim).filter(Boolean);
    _cached.leaves = (res.leaves || []).map(normalizeLeave).filter(Boolean);
    _cached.session_start_date = res.session_start_date
      ? String(res.session_start_date).slice(0, 10)
      : null;
    _cached.hijri_year = res.hijri_year != null ? String(res.hijri_year) : null;
    return true;
  }

  function getKhadimin() {
    return _cached.khadimin.slice();
  }

  function getLeaves() {
    return _cached.leaves.slice();
  }

  function sessionStartIso() {
    return _cached.session_start_date;
  }

  function todayIso() {
    return new Date().toISOString().slice(0, 10);
  }

  function daysBetweenInclusive(from, to) {
    var a = new Date((from || '') + 'T12:00:00');
    var b = new Date((to || from || '') + 'T12:00:00');
    if (Number.isNaN(a.getTime()) || Number.isNaN(b.getTime())) return 0;
    return Math.max(1, Math.round((b - a) / 86400000) + 1);
  }

  function academicYearBounds() {
    var start = _cached.session_start_date;
    if (!start && global.API && API.Settings && API.Settings.get) {
      start = (API.Settings.get().session_start_date || '').trim() || null;
    }
    return { start: start || null, end: todayIso() };
  }

  function overlappingLeaveDays(leaveFrom, leaveTo, winStart, winEnd) {
    var lf = leaveFrom <= leaveTo ? leaveFrom : leaveTo;
    var ht = leaveFrom <= leaveTo ? leaveTo : leaveFrom;
    var ax = lf > winStart ? lf : winStart;
    var bx = ht < winEnd ? ht : winEnd;
    if (!ax || !bx || ax > bx) return 0;
    return daysBetweenInclusive(ax, bx);
  }

  function leaveDaysYearToDateForKhadim(khadimId, leaves, bounds) {
    if (!bounds || !bounds.start) return null;
    var start = bounds.start;
    var end = bounds.end;
    return leaves
      .filter(function (l) { return l.khadim_id === khadimId; })
      .reduce(function (sum, l) { return sum + overlappingLeaveDays(l.from, l.to || l.from, start, end); }, 0);
  }

  function leavesInAcademicWindow(leaves, khadimId, bounds) {
    if (!bounds || !bounds.start) return leaves.filter(function (l) { return l.khadim_id === khadimId; });
    var start = bounds.start;
    var end = bounds.end;
    return leaves.filter(function (l) {
      if (l.khadim_id !== khadimId) return false;
      var lf = l.from <= l.to ? l.from : l.to;
      var ht = l.from <= l.to ? l.to : l.from;
      return lf <= end && ht >= start;
    });
  }

  async function upsertKhadim(payload) {
    var a = actor();
    if (!a || !a.id || !a.pin) throw new Error('no_actor');
    var res = await MMSharedAPI.khadiminUpsert(a.id, a.pin, payload || {});
    if (!res || res.ok !== true) throw new Error((res && res.error) || 'upsert_failed');
    await sync();
    return res.id ? String(res.id) : null;
  }

  async function addNote(khadimId, text) {
    var a = actor();
    if (!a || !a.id || !a.pin) throw new Error('no_actor');
    var res = await MMSharedAPI.khadiminAddNote(a.id, a.pin, khadimId, text);
    if (!res || res.ok !== true) throw new Error((res && res.error) || 'note_failed');
    await sync();
  }

  async function addLeave(khadimId, fromIso, toIso, reason) {
    var a = actor();
    if (!a || !a.id || !a.pin) throw new Error('no_actor');
    var res = await MMSharedAPI.khadiminAddLeave(a.id, a.pin, khadimId, fromIso, toIso, reason || null);
    if (!res || res.ok !== true) throw new Error((res && res.error) || 'leave_failed');
    await sync();
  }

  global.MDRKhadiminSupabase = {
    sync: sync,
    getKhadimin: getKhadimin,
    getLeaves: getLeaves,
    sessionStartIso: sessionStartIso,
    academicYearBounds: academicYearBounds,
    leaveDaysYearToDateForKhadim: leaveDaysYearToDateForKhadim,
    leavesInAcademicWindow: leavesInAcademicWindow,
    upsertKhadim: upsertKhadim,
    addNote: addNote,
    addLeave: addLeave,
    actor: actor,
  };
})(typeof window !== 'undefined' ? window : globalThis);
