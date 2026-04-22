/**
 * হিজরী (Umm al-Qura) + বাংলা গ্রিগরিয়ান — পুরো অ্যাপে পুনঃব্যবহারযোগ্য।
 * ব্রাউজারে Intl islamic-umalqura সাপোর্ট না থাকলে গ্রিগরিয়ান বাংলায় ফলব্যাক।
 */
(function (global) {
  const BN_DIG = ['০','১','২','৩','৪','৫','৬','৭','৮','৯'];
  const GR_MONTHS = ['জানুয়ারি','ফেব্রুয়ারি','মার্চ','এপ্রিল','মে','জুন','জুলাই','আগস্ট','সেপ্টেম্বর','অক্টোবর','নভেম্বর','ডিসেম্বর'];
  const BN_DOW = ['রবিবার','সোমবার','মঙ্গলবার','বুধবার','বৃহস্পতিবার','শুক্রবার','শনিবার'];

  function toBn(n) { return String(n).replace(/[0-9]/g, d => BN_DIG[d]); }
  function gregorianLongBn(iso) {
    const d = new Date(iso + 'T12:00:00');
    return toBn(d.getDate()) + ' ' + GR_MONTHS[d.getMonth()] + ' ' + toBn(d.getFullYear());
  }
  function weekdayBn(iso) { return BN_DOW[new Date(iso + 'T12:00:00').getDay()]; }

  /** প্রধান: হিজরী (বাংলা সংখ্যা) — Umm al-Qura */
  function hijriUmmalquraLongBn(iso) {
    if (!iso) return null;
    try {
      const d = new Date(iso + 'T12:00:00');
      if (isNaN(d.getTime())) return null;
      return new Intl.DateTimeFormat('bn-BD', {
        calendar: 'islamic-umalqura',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        numberingSystem: 'beng',
      }).format(d);
    } catch (e) {
      return null;
    }
  }

  function hijriOrFallback(iso) {
    const h = hijriUmmalquraLongBn(iso);
    if (h) return h;
    try {
      const d = new Date(iso + 'T12:00:00');
      return new Intl.DateTimeFormat('bn-BD', {
        calendar: 'islamic',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        numberingSystem: 'beng',
      }).format(d);
    } catch (e) {
      return null;
    }
  }

  /**
   * @returns {{ primary: string, secondary: string, hijriOk: boolean, weekday: string }}
   * primary  = হিজরী (বা ফলব্যাকে বাংলা গ্রিগরিয়ান)
   * secondary= ছোট লাইন: গ্রিগরিয়ান (বাংলা) — “গ্রিগরিয়ান: …”
   */
  function dualLine(iso) {
    const weekday = weekdayBn(iso);
    const h = hijriOrFallback(iso);
    const g = gregorianLongBn(iso);
    if (h) {
      return { primary: h, secondary: 'গ্রিগরিয়ান: ' + g, hijriOk: true, weekday };
    }
    return { primary: g, secondary: '', hijriOk: false, weekday };
  }

  global.MMHijri = { toBn, gregorianLongBn, weekdayBn, hijriUmmalquraLongBn, dualLine, hijriOrFallback };
})(typeof window !== 'undefined' ? window : this);
