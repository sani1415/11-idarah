/**
 * দফতর দায়িত্বশীল — শিক্ষাবর্ষে বাকি দিনের হাজিরা শেষ না হলে অন্য মেনু বন্ধ।
 * হাজিরা পেজে (madrasa-daftar.html) ক্যালেন্ডার/মার্ক/সেভ — সব খোলা; এক এক দিন করে সম্পন্ন।
 */
(function (global) {
  'use strict';

  var BANNER_ID = 'mm-daftar-att-gate-banner';
  var OVERLAY_ID = 'mm-daftar-att-gate-overlay';
  var STYLE_ID = 'mm-daftar-att-gate-css';
  var BODY_ON_PAGE = 'mm-daftar-gate-on-page';
  var enforcing = false;
  var lastNotifyAt = 0;

  function isDaftarUser() {
    return !!(global.MMSession && MMSession.getRole && MMSession.getRole() === 'daftar');
  }

  function isUuid(v) {
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(String(v || ''));
  }

  function attendanceStudents() {
    if (!global.API || !API.Students || !API.Classes) return [];
    var classIds = {};
    API.Classes.getAll().forEach(function (c) {
      if (c && c.id) classIds[String(c.id)] = true;
    });
    var requireRemoteId = !!(global.MDRDaftarSupabase && global.MMSharedAPI);
    return API.Students.getAll().filter(function (s) {
      if (!s || !s.active || !classIds[String(s.class_id || '')]) return false;
      return !requireRemoteId || isUuid(s.supabase_id || s.id);
    });
  }

  function getSessionStartISO() {
    try {
      if (API.Settings && API.Settings.get) {
        var s = API.Settings.get();
        var fromSet = s && s.session_start_date != null && String(s.session_start_date).trim() !== ''
          ? String(s.session_start_date).trim() : '';
        if (fromSet) return fromSet.slice(0, 10);
      }
    } catch (e) {}
    try {
      if (API.Sessions && API.Sessions.getCurrent) {
        var cur = API.Sessions.getCurrent();
        if (cur && cur.start_date) return String(cur.start_date).slice(0, 10);
      }
    } catch (e2) {}
    return null;
  }

  function isoAddDays(iso, delta) {
    var d = new Date(iso + 'T12:00:00');
    d.setDate(d.getDate() + delta);
    return d.toISOString().split('T')[0];
  }

  function hasAnyForDate(iso) {
    if (API.Attendance && API.Attendance.hasAnyForDate) return API.Attendance.hasAnyForDate(iso);
    return API.Attendance.getByDate(iso).length > 0;
  }

  function missingAttendanceDays() {
    if (!global.API || !API.today) return [];
    var start = getSessionStartISO();
    var today = API.today();
    if (!start || start > today) return [];
    var missing = [];
    for (var cur = start; cur <= today; cur = isoAddDays(cur, 1)) {
      if (!hasAnyForDate(cur)) missing.push(cur);
    }
    return missing;
  }

  function firstMissingDay() {
    var days = missingAttendanceDays();
    return days.length ? days[0] : null;
  }

  function isGateActive() {
    if (!isDaftarUser()) return false;
    if (!attendanceStudents().length) return false;
    return missingAttendanceDays().length > 0;
  }

  function toBn(n) {
    if (global.API && API.toBn) return API.toBn(n);
    return String(n).replace(/[0-9]/g, function (d) { return '০১২৩৪৫৬৭৮৯'[Number(d)]; });
  }

  function notify(msg) {
    var now = Date.now();
    if (now - lastNotifyAt < 2500) return;
    lastNotifyAt = now;
    if (typeof global.showToast === 'function') {
      global.showToast(msg);
      return;
    }
    try {
      global.dispatchEvent(new CustomEvent('mm-daftar-gate-notify', { detail: msg }));
    } catch (e) {}
  }

  /** URL থেকে হাজিরা পেজ কিনা */
  function onDaftarPageUrl() {
    var path = String(global.location.pathname || '').replace(/\\/g, '/');
    var href = String(global.location.href || '').replace(/\\/g, '/');
    return /(?:^|\/)madrasa-daftar(?:\.html)?\/?(?:$|[?#])/i.test(path) ||
      /(?:^|\/)madrasa-daftar(?:\.html)?\/?(?:$|[?#])/i.test(href);
  }

  /**
   * প্রকৃত হাজিরা কাজের পেজ — madrasa-daftar.html (#att-list আছে)।
   * লগইনের পর এখানেই থাকলে মডাল নয়, শুধু ব্যানার।
   */
  function isOnHajiraWorkPage() {
    try {
      if (global.document && global.document.getElementById('att-list')) return true;
    } catch (e) {}
    return onDaftarPageUrl();
  }

  function absoluteDaftarPageUrl() {
    var origin = String(global.location.origin || '');
    var path = String(global.location.pathname || '').replace(/\\/g, '/');
    if (/(^|\/)madrasa\//.test(path)) {
      var dir = path.replace(/\/[^/]*$/, '/');
      return origin + dir + 'madrasa-daftar.html';
    }
    return origin + '/madrasa/madrasa-daftar.html';
  }

  function isHajiraWorkHref(href) {
    var t = String(href || '').trim();
    if (!t) return true;
    if (t === '#accounts' || t === '#fees') return false;
    if (/^#/.test(t)) return true;
    if (/madrasa-daftar(?:\.html)?(?:[?#]|$)/i.test(t) && !/(?:#|\/)(accounts|fees)(?:$|[?#])/i.test(t)) return true;
    return false;
  }

  function formatDayBn(iso) {
    if (!iso) return '';
    var d = new Date(iso + 'T12:00:00');
    var dd = String(d.getDate()).padStart(2, '0');
    var mm = String(d.getMonth() + 1).padStart(2, '0');
    return toBn(dd) + '/' + toBn(mm);
  }

  function gateMessageHtml() {
    var days = missingAttendanceDays();
    var n = days.length;
    var first = days[0] || '';
    if (!n) return '';
    return 'বাকি <strong>' + toBn(n) + '</strong> দিন' +
      (first ? ', প্রথম ' + formatDayBn(first) : '') +
      ' · এক এক দিন করে সেভ করুন · অন্য মেনু বন্ধ';
  }

  function injectStyles() {
    if (global.document.getElementById(STYLE_ID)) return;
    var st = global.document.createElement('style');
    st.id = STYLE_ID;
    st.textContent =
      'body.mm-daftar-gate-active .bottom-nav .nav-item:not([data-gate-allow="1"]){opacity:.42;pointer-events:none}' +
      'body.mm-daftar-gate-active .madrasa-tab:not([data-gate-allow="1"]){opacity:.42;pointer-events:none}' +
      'body.mm-daftar-gate-active .topbar-btn:not(#topbar-lockout){opacity:.42;pointer-events:none}' +
      'body.mm-daftar-gate-on-page #mm-daftar-att-gate-overlay{display:none!important;pointer-events:none!important}' +
      '.mm-daftar-att-gate-banner{background:linear-gradient(135deg,#7a1f1f,#a93226);color:#fff;border-radius:10px;padding:7px 11px;margin:0 0 8px;font-size:11px;line-height:1.35;box-shadow:0 4px 14px rgba(122,31,31,.2)}' +
      '.mm-daftar-att-gate-banner strong{font-weight:700}' +
      '#mm-daftar-att-gate-overlay{position:fixed;inset:0;z-index:500;background:rgba(26,18,8,.55);display:flex;align-items:center;justify-content:center;padding:20px;box-sizing:border-box}' +
      '#mm-daftar-att-gate-overlay .mm-dg-card{max-width:360px;width:100%;background:#fff;border-radius:18px;padding:20px 18px;box-shadow:0 18px 50px rgba(26,18,8,.25);text-align:center;font-family:"Tiro Bangla",serif}' +
      '#mm-daftar-att-gate-overlay .mm-dg-title{font-size:17px;font-weight:700;color:var(--ink2,#1a1208);margin:0 0 8px}' +
      '#mm-daftar-att-gate-overlay .mm-dg-sub{font-size:12px;color:var(--ink3,#6b5c48);line-height:1.5;margin:0 0 14px}' +
      '#mm-daftar-att-gate-overlay .mm-dg-btn{display:block;width:100%;border:none;border-radius:12px;padding:12px;font-family:inherit;font-size:14px;font-weight:700;cursor:pointer;background:var(--ink,#1a1208);color:var(--gold2,#e8c872)}' +
      '#mm-daftar-att-gate-overlay .mm-dg-btn:active{transform:scale(.98)}';
    (global.document.head || global.document.documentElement).appendChild(st);
  }

  function updateBanner() {
    if (!isOnHajiraWorkPage()) return;
    injectStyles();
    var host = global.document.querySelector('.content') || global.document.body;
    var el = global.document.getElementById(BANNER_ID);
    if (!isGateActive()) {
      if (el) el.remove();
      return;
    }
    var html = 'হাজিরা বাকি — ' + gateMessageHtml();
    if (!el) {
      el = global.document.createElement('div');
      el.id = BANNER_ID;
      el.className = 'mm-daftar-att-gate-banner';
      el.setAttribute('role', 'status');
      host.insertBefore(el, host.firstChild);
    }
    el.innerHTML = html;
  }

  function goHajiraPage() {
    hideShellOverlay();
    if (isOnHajiraWorkPage()) {
      if (isGateActive()) applyPageLocks();
      else clearPageLocks();
      return;
    }
    global.location.href = absoluteDaftarPageUrl();
  }

  function showShellOverlay() {
    if (isOnHajiraWorkPage()) {
      hideShellOverlay();
      if (isGateActive()) applyPageLocks();
      return;
    }
    if (!isGateActive()) {
      hideShellOverlay();
      return;
    }
    injectStyles();
    var existing = global.document.getElementById(OVERLAY_ID);
    var body = gateMessageHtml();
    if (existing) {
      var sub = existing.querySelector('.mm-dg-sub');
      if (sub) sub.innerHTML = body + ' হাজিরা পেজে গিয়ে এক এক দিন করে সেভ করুন।';
      return;
    }
    var wrap = global.document.createElement('div');
    wrap.id = OVERLAY_ID;
    wrap.setAttribute('role', 'dialog');
    wrap.setAttribute('aria-modal', 'true');
    wrap.innerHTML =
      '<div class="mm-dg-card">' +
      '<p class="mm-dg-title">হাজিরা বাকি</p>' +
      '<p class="mm-dg-sub">' + body + ' হাজিরা পেজে গিয়ে এক এক দিন করে সেভ করুন।</p>' +
      '<button type="button" class="mm-dg-btn" id="mm-daftar-gate-go">হাজিরা পেজে যান</button>' +
      '</div>';
    global.document.body.appendChild(wrap);
    var btn = global.document.getElementById('mm-daftar-gate-go');
    if (btn) {
      btn.addEventListener('click', goHajiraPage);
    }
  }

  function hideShellOverlay() {
    var el = global.document.getElementById(OVERLAY_ID);
    if (el) el.remove();
  }

  function markAllowedControls() {
    global.document.querySelectorAll('#madrasa-tabs .madrasa-tab').forEach(function (tab) {
      var allow = tab.id === 'mtab-home';
      if (allow) tab.setAttribute('data-gate-allow', '1');
      else tab.removeAttribute('data-gate-allow');
    });
    global.document.querySelectorAll('#daftar-nav-root .nav-item, #daftar-nav-root a.nav-item').forEach(function (item) {
      var href = item.getAttribute('href') || '';
      var oc = item.getAttribute('onclick') || '';
      var allow = item.id === 'nav-madrasa' ||
        /madrasa-daftar/i.test(href) ||
        /switchMadrasaTab\s*\(\s*['"]home['"]\s*\)/.test(oc);
      if (allow) item.setAttribute('data-gate-allow', '1');
      else item.removeAttribute('data-gate-allow');
    });
  }

  function applyPageLocks() {
    if (!isOnHajiraWorkPage()) return;
    hideShellOverlay();
    injectStyles();
    global.document.body.classList.add('mm-daftar-gate-active', BODY_ON_PAGE);
    markAllowedControls();
    updateBanner();
    var homePanel = global.document.getElementById('panel-home');
    var onHome = homePanel && homePanel.classList.contains('active');
    if (!onHome && typeof global.switchPanel === 'function') {
      global.switchPanel('home');
    }
    try {
      var hash = String(global.location.hash || '');
      if (hash && (hash === '#fees' || hash === '#accounts') && global.history && global.history.replaceState) {
        global.history.replaceState(null, '', global.location.pathname + global.location.search);
      }
    } catch (e) {}
  }

  function clearPageLocks() {
    global.document.body.classList.remove('mm-daftar-gate-active', BODY_ON_PAGE);
    global.document.querySelectorAll('[data-gate-allow]').forEach(function (el) {
      el.removeAttribute('data-gate-allow');
    });
    var el = global.document.getElementById(BANNER_ID);
    if (el) el.remove();
    hideShellOverlay();
  }

  function refresh() {
    if (!isDaftarUser()) {
      clearPageLocks();
      return false;
    }
    if (isOnHajiraWorkPage()) hideShellOverlay();
    if (isGateActive()) {
      if (isOnHajiraWorkPage()) applyPageLocks();
      else showShellOverlay();
      return true;
    }
    clearPageLocks();
    return false;
  }

  function enforceAfterBootstrap() {
    if (enforcing) return false;
    if (!isDaftarUser()) {
      clearPageLocks();
      return false;
    }
    if (isOnHajiraWorkPage()) hideShellOverlay();
    if (!isGateActive()) {
      clearPageLocks();
      return false;
    }
    enforcing = true;
    try {
      if (isOnHajiraWorkPage()) {
        applyPageLocks();
        return true;
      }
      showShellOverlay();
      return true;
    } finally {
      enforcing = false;
    }
  }

  function blockNavigation(href) {
    if (!isGateActive()) return false;
    if (isHajiraWorkHref(href)) return false;
    if (isOnHajiraWorkPage()) {
      notify('আগে বাকি হাজিরা সম্পন্ন করুন — এক এক দিন করে সেভ করুন');
      return true;
    }
    notify('হাজিরা সম্পন্ন করুন — তারপর অন্য মেনু খুলতে পারবেন');
    showShellOverlay();
    return true;
  }

  function blockTab(name) {
    if (!isGateActive()) return false;
    if (!name || name === 'home') return false;
    if (isOnHajiraWorkPage()) return true;
    notify('হাজিরা সম্পন্ন করুন — তারপর এই ট্যাব খুলতে পারবেন');
    return true;
  }

  function blockAccounts() {
    if (!isGateActive()) return false;
    if (isOnHajiraWorkPage()) return true;
    notify('হাজিরা সম্পন্ন করুন — তারপর হিসাব মেনু খুলতে পারবেন');
    return true;
  }

  global.MDRDaftarAttendanceGate = {
    isGateActive: isGateActive,
    missingDays: missingAttendanceDays,
    firstMissingDay: firstMissingDay,
    enforceAfterBootstrap: enforceAfterBootstrap,
    refresh: refresh,
    blockNavigation: blockNavigation,
    blockTab: blockTab,
    blockAccounts: blockAccounts,
    goHajiraPage: goHajiraPage,
  };

  function earlyHideOverlayOnHajiraPage() {
    if (!isOnHajiraWorkPage()) return;
    hideShellOverlay();
    global.document.body.classList.add(BODY_ON_PAGE);
  }

  if (global.document) {
    if (global.document.readyState === 'loading') {
      global.document.addEventListener('DOMContentLoaded', earlyHideOverlayOnHajiraPage);
    } else {
      earlyHideOverlayOnHajiraPage();
    }
  }
})(typeof window !== 'undefined' ? window : globalThis);
