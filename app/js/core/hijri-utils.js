/**
 * হিজরী তারিখ — প্রোটোটাইপ। ব্রাউজারে Islamic ক্যালেন্ডার (Intl) থাকলে সেটি ব্যবহার,
 * নইলে খুব আনুমানিক ফallback (শুধু প্রদর্শনের জন্য)।
 */
(function (global) {
  'use strict';

  var MONTHS_BN = [
    'মুহাররম', 'সফর', 'রবিউল আওয়াল', 'রবিউস সানি', 'জুমাদাল উলা', 'জুমাদাল উখরা',
    'রজব', 'শাবান', 'রমজান', 'শাওয়াল', 'জিলকদ', 'জিলহজ'
  ];

  function toBnDigits(str) {
    return String(str).replace(/[0-9]/g, function (d) { return '০১২৩৪৫৬৭৮৯'[d]; });
  }

  /**
   * @param {string} iso YYYY-MM-DD
   * @returns {{ y: number, m: number, d: number } | null}
   */
  function fromISODate(iso) {
    if (!iso || typeof iso !== 'string') return null;
    var d = new Date(iso + 'T12:00:00');
    if (Number.isNaN(d.getTime())) return null;
    try {
      var fmt = new Intl.DateTimeFormat('en', {
        calendar: 'islamic',
        year: 'numeric',
        month: 'numeric',
        day: 'numeric'
      });
      var parts = fmt.formatToParts(d);
      var o = {};
      for (var i = 0; i < parts.length; i++) {
        var p = parts[i];
        if (p.type === 'year') o.y = parseInt(p.value, 10);
        if (p.type === 'month') o.m = parseInt(p.value, 10);
        if (p.type === 'day') o.d = parseInt(p.value, 10);
      }
      if (o.y && o.m && o.d) return o;
    } catch (e) { /* ignore */ }
    return fallbackApprox(d);
  }

  function fallbackApprox(d) {
    var epoch = Date.UTC(622, 6, 16);
    var dayMs = 86400000;
    var days = Math.floor((d.getTime() - epoch) / dayMs);
    var cycle = 354.366;
    var hy = Math.floor(days / cycle) + 1;
    var rem = days - Math.floor((hy - 1) * cycle);
    var hm = Math.min(12, Math.floor(rem / 29.5) + 1);
    var hd = Math.min(30, Math.floor(rem % 29.5) + 1);
    return { y: hy, m: hm, d: hd };
  }

  /**
   * @param {string} iso
   * @param {{ bengaliDigits?: boolean }} opt
   */
  function formatLong(iso, opt) {
    var h = fromISODate(iso);
    if (!h) return '';
    var mo = MONTHS_BN[(h.m - 1) % 12] || '';
    var bn = opt && opt.bengaliDigits;
    var ys = bn ? toBnDigits(h.y) : String(h.y);
    var ds = bn ? toBnDigits(h.d) : String(h.d);
    return ds + ' ' + mo + ' ' + ys + ' হিজরি';
  }

  global.HijriUtils = {
    MONTHS_BN: MONTHS_BN,
    fromISODate: fromISODate,
    formatLong: formatLong,
    toBnDigits: toBnDigits
  };
})(typeof window !== 'undefined' ? window : globalThis);
