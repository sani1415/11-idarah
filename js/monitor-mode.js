/* মুহতামিম = পর্যবেক্ষণ মোড (অপারেশনাল এডিট স্টাফ অ্যাকাউন্টে) */
(function () {
  'use strict';

  window.mmMonitorMsg =
    'পর্যবেক্ষণ মোড — অপারেশনাল পরিবর্তনের জন্য সংশ্লিষ্ট স্টাফ অ্যাকাউন্ট ব্যবহার করুন। নীতি ও পিন: সেটিং।';

  window.MM_MONITOR_ONLY = function () {
    return sessionStorage.getItem('mm_role') === 'admin';
  };

  /** @returns {boolean} true if the action should be stopped (shows toast) */
  window.mmMutationBlocked = function (toastFn) {
    if (!window.MM_MONITOR_ONLY()) return false;
    var t = toastFn || function (m) { console.warn(m); };
    t(window.mmMonitorMsg);
    return true;
  };

  window.mmInsertMonitorBanner = function () {
    if (!window.MM_MONITOR_ONLY() || document.getElementById('mm-monitor-banner')) return;
    var bar = document.createElement('div');
    bar.id = 'mm-monitor-banner';
    bar.className = 'mm-monitor-banner';
    bar.setAttribute('role', 'status');
    bar.textContent = window.mmMonitorMsg;
    document.body.insertBefore(bar, document.body.firstChild);
    document.body.classList.add('mm-monitor-active');
  };
})();
