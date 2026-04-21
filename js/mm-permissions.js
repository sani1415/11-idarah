/**
 * প্রোটোটাইপ অনুমতি — MMSession + API.Teachers। ভবিষ্যতে Supabase রোলের সাথে মিলিয়ে নেওয়া হবে।
 */
(function (global) {
  'use strict';

  function session() {
    return global.MMSession;
  }

  function getApi() {
    return typeof API !== 'undefined' ? API : null;
  }

  function getRole() {
    var S = session();
    return S && S.getRole ? S.getRole() : null;
  }

  function isAdmin() {
    return getRole() === 'admin';
  }

  function teacherRecord() {
    var S = session();
    var A = getApi();
    if (!S || !S.getTeacherId || !A || !A.Teachers) return null;
    var tid = S.getTeacherId();
    return tid ? A.Teachers.getById(tid) : null;
  }

  /** মুহতামিম বা সংশ্লিষ্ট বর্ষের দায়িত্বশীল */
  function canEditClass(classId) {
    if (!classId) return false;
    if (isAdmin()) return true;
    var t = teacherRecord();
    return !!(t && t.class_id === classId);
  }

  /** মাদ্রাসা বর্ষ ওয়ার্কস্পেস — মুহতামিম বা নিজ বর্ষের শিক্ষক */
  function canOpenMadrasaAdmin() {
    if (isAdmin()) return true;
    if (getRole() !== 'teacher') return false;
    var t = teacherRecord();
    return !!(t && t.class_id);
  }

  /** দফতর/শিক্ষক — সীমিত মডিউল */
  function canViewMadrasaExams() {
    var r = getRole();
    return r === 'admin' || r === 'teacher' || r === 'daftar';
  }

  /**
   * পেজ গার্ড — প্রয়োজনে রিডাইরেক্ট
   * @param {string} need 'madrasa_admin' | 'exams'
   * @param {string} fallbackUrl
   */
  function guardPage(need, fallbackUrl) {
    var ok = false;
    if (need === 'madrasa_admin') ok = canOpenMadrasaAdmin();
    else if (need === 'exams') ok = canViewMadrasaExams();
    else ok = !!getRole();
    if (!ok && fallbackUrl) {
      global.location.href = fallbackUrl;
    }
    return ok;
  }

  global.MMPermissions = {
    getRole: getRole,
    isAdmin: isAdmin,
    canEditClass: canEditClass,
    canOpenMadrasaAdmin: canOpenMadrasaAdmin,
    canViewMadrasaExams: canViewMadrasaExams,
    guardPage: guardPage
  };
})(typeof window !== 'undefined' ? window : globalThis);
