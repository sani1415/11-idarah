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
    kitab_hifz: 'cls_kh',
    maktab_y1: 'cls_m1',
    maktab_y2: 'cls_m2',
    maktab_y3: 'cls_m3',
    maktab_y4: 'cls_m4',
    maktab_y5: 'cls_m5',
  };

  function toLocalStudent(row) {
    return {
      id: String(row.id || row.student_id || ''),
      permanent_id: row.student_id || '',
      name: row.name || '',
      class_id: CLASS_CODE_TO_LOCAL_ID[row.class_code] || row.class_code || '',
      roll: row.current_roll || '',
      guardian: row.guardian_name || '',
      guardian_job: '',
      phone: row.guardian_phone || '',
      district: row.district || '',
      upazila: row.upazila || '',
      active: row.status !== 'dropped' && row.status !== 'alumni',
      hifz: !!row.is_hifz,
      supabase_id: row.id || '',
    };
  }

  async function syncAdminStudents() {
    if (!global.MMSession || !global.MMMadrasaAPI || !global.API) return false;
    var pin = MMSession.getAdminPin && MMSession.getAdminPin();
    if (!pin) return false;
    var res = await MMMadrasaAPI.adminStudents(pin);
    API.Students.replaceAll((res.students || []).map(toLocalStudent));
    return true;
  }

  global.MDRSupabaseSync = {
    syncAdminStudents: syncAdminStudents,
    toLocalStudent: toLocalStudent,
  };
})(typeof window !== 'undefined' ? window : globalThis);
