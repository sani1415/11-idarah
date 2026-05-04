/* Bridge Supabase madrasa students into the prototype API cache. */
(function (global) {
  'use strict';

  var CLASS_CODE_TO_LOCAL_ID = {
    kitab_y1: 'cls_k1',
    kitab_iyada: 'cls_ky',
    kitab_y2: 'cls_k2',
    kitab_y3: 'cls_k3',
    kitab_y4: 'cls_k4',
    kitab_y5: 'cls_k5',
    kitab_y6: 'cls_k6',
    kitab_y7: 'cls_k7',
    maktab_y1: 'cls_m1',
    maktab_y2: 'cls_m2',
    maktab_y3: 'cls_m3',
    maktab_y4: 'cls_m4',
    maktab_y5: 'cls_m5',
  };

  var LOCAL_ID_TO_CLASS_CODE = {};
  Object.keys(CLASS_CODE_TO_LOCAL_ID).forEach(function (code) {
    LOCAL_ID_TO_CLASS_CODE[CLASS_CODE_TO_LOCAL_ID[code]] = code;
  });

  var SUPA_ROLE_TO_LOCAL = {
    madrasa_teacher: 'teacher',
    daftar: 'daftar',
    hifz: 'hifz',
    library: 'library',
    alumni_tracker: 'alumni',
    khedmat: 'khedmat',
    restricted_admin: 'restricted_admin',
  };

  function toLocalStudent(row) {
    return {
      id: String(row.id || row.student_id || ''),
      permanent_id: row.student_id || '',
      name: row.name || '',
      class_id: row.class_code === 'kitab_hifz' ? '' : (CLASS_CODE_TO_LOCAL_ID[row.class_code] || row.class_code || ''),
      roll: row.current_roll || '',
      guardian: row.guardian_name || '',
      guardian_job: '',
      phone: row.guardian_phone || '',
      district: row.district || '',
      upazila: row.upazila || '',
      status: row.status || 'active',
      active: row.status !== 'dropped' && row.status !== 'alumni',
      hifz: !!row.is_hifz || row.class_code === 'kitab_hifz',
      special_watch: !!row.special_watch,
      alhamdulillah: !!row.alhamdulillah,
      left_date: row.left_date || '',
      left_reason: row.left_reason || '',
      supabase_id: row.id || '',
    };
  }

  function syncAlumniRows(rows) {
    var withdrawals = [];
    var alumni = [];
    var existingAlumni = API.persistLoadArr ? API.persistLoadArr('mm_alumni') : [];
    var existingById = {};
    existingAlumni.forEach(function (row) {
      existingById[String(row.id || row.student_id || '')] = row;
    });
    (rows || []).forEach(function (r) {
      var id = String(r.id || r.student_id || '');
      var prev = existingById[id] || {};
      withdrawals.push({
        id: id,
        student_id: String(r.student_id || ''),
        student_name: r.name || '',
        permanent_id: r.permanent_id || '',
        last_class_id: CLASS_CODE_TO_LOCAL_ID[r.class_code] || r.class_code || '',
        reason: r.left_reason || (r.left_type === 'completed' ? 'পড়া শেষ' : 'মাঝপথে বিদায়'),
        note: r.left_reason || '',
        date: String(r.left_date || ''),
      });
      alumni.push(Object.assign({}, prev, {
        id: id,
        student_id: String(r.student_id || ''),
        name: r.name || '',
        permanent_id: r.permanent_id || '',
        phone: r.phone || prev.phone || '',
        year: String(r.left_date || '').slice(0, 4) || prev.year || '',
        reason: r.left_reason || prev.reason || '',
        location: prev.location || '',
        latest_verified_status: prev.latest_verified_status || '',
        status: r.status || (r.left_type === 'completed' ? 'সম্পন্ন' : 'মাঝপথে'),
        source_type: 'current_student',
        left_date: r.left_date || '',
        left_type: r.left_type || '',
        class_code: r.class_code || '',
        class_name: r.class_name || '',
      }));
    });
    if (API.persistSaveArr) {
      API.persistSaveArr('mm_withdrawals', withdrawals);
      var incomingIds = {};
      alumni.forEach(function (row) { incomingIds[String(row.id || '')] = true; });
      var keep = existingAlumni.filter(function (row) {
        var id = String(row.id || row.student_id || '');
        return !incomingIds[id] && row.source_type !== 'current_student';
      });
      API.persistSaveArr('mm_alumni', keep.concat(alumni));
    }
  }

  function mergeScopedArray(storageKey, scopeFn, incoming) {
    if (!API.persistLoadArr || !API.persistSaveArr) return;
    var keep = API.persistLoadArr(storageKey).filter(function (row) {
      return !scopeFn(row);
    });
    API.persistSaveArr(storageKey, keep.concat(incoming || []));
  }

  function syncTeacherExtras(res, classId) {
    if (!res || !classId || !global.API) return;
    var classCode = LOCAL_ID_TO_CLASS_CODE[classId] || '';
    var studentIds = {};
    API.Students.getByClass(classId).forEach(function (s) {
      studentIds[String(s.id)] = true;
      if (s.supabase_id) studentIds[String(s.supabase_id)] = true;
    });

    var books = (res.books || []).map(function (b) {
      return {
        id: String(b.id || ''),
        name: b.name || '',
        class_id: CLASS_CODE_TO_LOCAL_ID[b.class_code] || b.class_code || classId,
        total_pages: b.total_pages,
        sort_order: b.sort_order || 0,
      };
    });
    mergeScopedArray('mm_kitabs', function (b) { return b.class_id === classId; }, books);

    var progress = [];
    (res.books || []).forEach(function (b) {
      if (b.pages_done == null) return;
      progress.push({
        id: String(b.id || '') + '_current',
        kitab_id: String(b.id || ''),
        class_id: CLASS_CODE_TO_LOCAL_ID[b.class_code] || b.class_code || classId,
        date: String(b.updated_at || '').slice(0, 10) || API.today(),
        pages_done: Number(b.pages_done) || 0,
        note: b.notes || '',
      });
    });
    (res.book_progress_history || []).forEach(function (h) {
      progress.push({
        id: String(h.id || ''),
        kitab_id: String(h.book_id || ''),
        class_id: CLASS_CODE_TO_LOCAL_ID[h.class_code] || h.class_code || classId,
        date: String(h.date || '').slice(0, 10) || API.today(),
        pages_done: Number(h.pages_done) || 0,
        note: h.note || '',
        by: h.by || '',
      });
    });
    mergeScopedArray('mm_kitab_progress', function (p) { return p.class_id === classId; }, progress);

    var akhlaq = (res.akhlaq || []).map(function (a) {
      return {
        id: String(a.id || ''),
        student_id: String(a.student_id || ''),
        score: Number(a.score) || 0,
        reason: a.reason || '',
        date: String(a.date || '').slice(0, 10) || API.today(),
        by: a.by || '',
      };
    });
    mergeScopedArray('mm_khuluk', function (k) { return studentIds[String(k.student_id)]; }, akhlaq);

    var logs = (res.logs || []).map(function (l) {
      var isStudent = l.type === 'student';
      return {
        id: String(l.id || ''),
        type: isStudent ? 'student' : 'class',
        ref_id: isStudent ? String(l.student_id || '') : (CLASS_CODE_TO_LOCAL_ID[l.class_code] || l.class_code || classId),
        text: l.content || '',
        date: String(l.date || '').slice(0, 10) || API.today(),
        by: l.by || '',
        tag: 'normal',
      };
    });
    mergeScopedArray('mm_logs', function (l) {
      return (l.type === 'class' && l.ref_id === classId) || (l.type === 'student' && studentIds[String(l.ref_id)]);
    }, logs);
  }

  async function syncAdminStudents() {
    if (!global.MMSession || !global.MMMadrasaAPI || !global.API) return false;
    var pin = MMSession.getAdminPin && MMSession.getAdminPin();
    if (!pin) return false;
    var res = await MMMadrasaAPI.adminStudents(pin);
    API.Students.replaceAll((res.students || []).map(toLocalStudent));
    return true;
  }

  async function syncAdminUsers() {
    if (!global.MMSession || !global.MMSharedAPI || !global.API || !API.Teachers) return false;
    var pin = MMSession.getAdminPin && MMSession.getAdminPin();
    if (!pin) return false;
    var res = await MMSharedAPI.adminUsers(pin);
    if (!res || !res.ok) return false;
    var users = (res.users || []).map(function (u) {
      return {
        id: String(u.id || ''),
        name: u.name || '',
        login_id: u.login_id || '',
        class_id: CLASS_CODE_TO_LOCAL_ID[u.class_code] || '',
        class_code: u.class_code || '',
        pin: u.pin || '',
        role: SUPA_ROLE_TO_LOCAL[u.role] || u.role,
        admin_perms: u.admin_perms || {},
        is_active: u.is_active !== false,
      };
    }).filter(function (u) { return u.id; });
    if (API.Teachers.replaceAll) API.Teachers.replaceAll(users);
    else {
      try { localStorage.setItem('mm_teachers', JSON.stringify(users)); } catch (e) {}
    }
    return true;
  }

  async function syncTeacherClass() {
    if (!global.MMSession || !global.MMSharedAPI || !global.API) return false;
    var actorId = MMSession.getStaffUserId && MMSession.getStaffUserId();
    var pin = MMSession.getStaffPin && MMSession.getStaffPin();
    if (!actorId || !pin) return false;
    var res = await MMSharedAPI.teacherClassBootstrap(actorId, pin);
    if (!res || !res.ok) return false;
    var incoming = (res.students || []).map(toLocalStudent);
    var incomingIds = {};
    incoming.forEach(function (s) { incomingIds[s.id] = true; });
    var keep = API.Students.getAll().filter(function (s) { return !incomingIds[s.id]; });
    API.Students.replaceAll(keep.concat(incoming));
    var classId = incoming.length ? incoming[0].class_id : '';
    if (classId) syncTeacherExtras(res, classId);
    return true;
  }

  async function syncAlumni(actorId, pin) {
    if (!global.MMSharedAPI || !global.API || !actorId || !pin) return false;
    var res = await MMSharedAPI.alumniBootstrap(actorId, pin);
    if (!res || !res.ok) return false;
    syncAlumniRows(res.alumni || []);
    return true;
  }

  global.MDRSupabaseSync = {
    syncAdminStudents: syncAdminStudents,
    syncAdminUsers: syncAdminUsers,
    syncTeacherClass: syncTeacherClass,
    syncAlumni: syncAlumni,
    syncTeacherExtras: syncTeacherExtras,
    toLocalStudent: toLocalStudent,
  };
})(typeof window !== 'undefined' ? window : globalThis);
