/**
 * উপস্থিতি UI সহায়ক — চিহ্নিত নয় গণনা, ক্যাচ-আপ বার্তা (প্রোটোটাইপ)।
 */
(function (global) {
  'use strict';

  function api() {
    return global.API;
  }

  /**
   * attData: { [studentId]: 'present'|'absent'|'leave'|'not_marked' }
   */
  function countNotMarked(studentIds, attData) {
    var n = 0;
    for (var i = 0; i < studentIds.length; i++) {
      var id = studentIds[i];
      var v = attData[id];
      if (v === undefined || v === 'not_marked') n++;
    }
    return n;
  }

  function shouldWarnCatchUp(isoDate, todayIso, notMarkedCount) {
    return isoDate === todayIso && notMarkedCount > 0;
  }

  /** বার্তা HTML (ইনলাইন স্টাইল সহ) */
  function catchUpBannerHtml(notMarkedCount, toBn) {
    var bn = toBn ? toBn(notMarkedCount) : String(notMarkedCount);
    return (
      '<div class="att-catchup-banner" style="background:linear-gradient(90deg,#fdf3dc,#fff9ed);border:1px solid rgba(201,149,42,0.35);border-radius:10px;padding:10px 12px;margin-bottom:10px;font-size:12px;color:var(--ink2);line-height:1.45;">' +
      '<strong style="color:#a67c00;">⚠ উপস্থিতি সম্পূর্ণ করুন</strong> — ' +
      bn + ' জন ছাত্রের অবস্থা এখনো চিহ্নিত নয়। সংরক্ষণ করুন অথবা «আগের দিন কপি» ব্যবহার করুন।' +
      '</div>'
    );
  }

  /** তারিখ সারির নিচে হিজরী এক লাইন */
  function hijriSublineHtml(isoDate, HijriUtils) {
    if (!HijriUtils || !HijriUtils.formatLong) return '';
    var line = HijriUtils.formatLong(isoDate, { bengaliDigits: true });
    if (!line) return '';
    return '<div class="att-hijri-line" style="font-size:0.75rem;color:var(--ink3);text-align:center;margin-top:4px;">' + line + '</div>';
  }

  global.MadrasaAttendanceUI = {
    countNotMarked: countNotMarked,
    shouldWarnCatchUp: shouldWarnCatchUp,
    catchUpBannerHtml: catchUpBannerHtml,
    hijriSublineHtml: hijriSublineHtml
  };
})(typeof window !== 'undefined' ? window : globalThis);
