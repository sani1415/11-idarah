/* Bridge Supabase daftar attendance into the prototype API cache. */
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

  function actor() {
    if (!global.MMSession) return null;
    if (MMSession.isAdmin && MMSession.isAdmin()) {
      return { id: MMSession.getAdminUserId && MMSession.getAdminUserId(), pin: MMSession.getAdminPin && MMSession.getAdminPin() };
    }
    return { id: MMSession.getStaffUserId && MMSession.getStaffUserId(), pin: MMSession.getStaffPin && MMSession.getStaffPin() };
  }

  function toLocalStudent(row) {
    return {
      id: String(row.id || ''),
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

  function toLocalAttendance(row) {
    var out = {
      id: String(row.id || ''),
      student_id: String(row.student_id || ''),
      date: String(row.date || ''),
      status: row.status || 'present',
    };
    if (row.absent_reason) out.absent_reason = row.absent_reason;
    if (row.hijri_year) out.hijri_year = row.hijri_year;
    return out;
  }

  async function sync() {
    if (!global.MMSharedAPI || !global.API) return false;
    var a = actor();
    if (!a || !a.id || !a.pin) return false;
    var res = await MMSharedAPI.daftarBootstrap(a.id, a.pin);
    if (!res || !res.ok) return false;
    API.Students.replaceAll((res.students || []).map(toLocalStudent));
    if (API.Attendance && API.Attendance.replaceAll) {
      API.Attendance.replaceAll((res.attendance || []).map(toLocalAttendance));
    }
    return true;
  }

  async function saveDay(date, records, hijriYear) {
    if (!global.MMSharedAPI || !global.API) return false;
    var a = actor();
    if (!a || !a.id || !a.pin) return false;
    var res = await MMSharedAPI.saveAttendanceDay(a.id, a.pin, date, records || [], hijriYear || null);
    if (!res || !res.ok) throw new Error((res && res.error) || 'attendance_save_failed');
    if (API.Attendance && API.Attendance.replaceAll) {
      API.Attendance.replaceAll((res.attendance || []).map(toLocalAttendance));
    }
    return true;
  }

  global.MDRDaftarSupabase = {
    sync: sync,
    saveDay: saveDay,
  };
})(typeof window !== 'undefined' ? window : globalThis);
