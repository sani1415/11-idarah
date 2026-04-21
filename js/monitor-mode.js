/* মুহতামিম = পর্যবেক্ষণ মোড (অপারেশনাল এডিট স্টাফ অ্যাকাউন্টে) */
(function () {
  'use strict';

  window.mmMonitorMsg = 'পর্যবেক্ষণ মোড';

  window.MM_MONITOR_ONLY = function () {
    if (window.MMSession && typeof window.MMSession.getRole === 'function') {
      return window.MMSession.getRole() === 'admin';
    }
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
    var topbar = document.querySelector('.topbar');
    if (topbar) {
      topbar.classList.add('mm-monitor-topbar');
      var lab = document.createElement('div');
      lab.id = 'mm-monitor-banner';
      lab.className = 'mm-monitor-topbar-label';
      lab.setAttribute('role', 'status');
      lab.textContent = 'পর্যবেক্ষণ মোড';
      topbar.appendChild(lab);
    } else {
      var bar = document.createElement('div');
      bar.id = 'mm-monitor-banner';
      bar.className = 'mm-monitor-banner mm-monitor-banner--fallback';
      bar.setAttribute('role', 'status');
      bar.textContent = 'পর্যবেক্ষণ মোড';
      document.body.insertBefore(bar, document.body.firstChild);
    }
    document.body.classList.add('mm-monitor-active');
  };
})();
