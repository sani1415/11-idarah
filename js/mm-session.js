/* Client session (PIN / role) until replaced by server auth. Key names live here only. */
(function (global) {
  'use strict';

  var K = {
    role: 'mm_role',
    name: 'mm_name',
    staffUserId: 'mm_staff_user_id',
    staffPin: 'mm_staff_pin',
    teacherId: 'mm_teacher_id',
    adminUserId: 'mm_admin_user_id',
    adminPin: 'mm_admin_pin',
    adminPerms: 'mm_admin_perms',
    deptRole: 'mm_dept_role',
    deptId: 'mm_dept_id',
    deptName: 'mm_dept_name',
    deptEmoji: 'mm_dept_emoji',
  };

  var ALL_APP_KEYS = [
    K.role, K.name, K.staffUserId, K.staffPin, K.teacherId, K.adminUserId, K.adminPin, K.adminPerms,
    K.deptRole, K.deptId, K.deptName, K.deptEmoji,
  ];

  function readPerms() {
    try {
      var raw = sessionStorage.getItem(K.adminPerms);
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      return null;
    }
  }

  function isSuperAdminPerms(perms) {
    return !!(perms && perms.super_admin === true);
  }

  function isUuid(v) {
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(String(v || ''));
  }

  function sessionErrorMessage(error) {
    if (error === 'invalid_current_pin' || error === 'invalid_pin') return 'বর্তমান PIN ভুল';
    if (error === 'invalid_new_pin' || error === 'pin_too_short') return 'নতুন PIN ৪ সংখ্যার হতে হবে';
    if (error === 'same_pin') return 'নতুন PIN আগের PIN থেকে আলাদা দিন';
    if (error === 'missing_user') return 'ব্যবহারকারী পাওয়া যায়নি';
    return 'PIN পরিবর্তন হয়নি';
  }

  var MMSession = {
    K: K,

    get: function (key) { return sessionStorage.getItem(key); },
    set: function (key, val) { sessionStorage.setItem(key, val); },
    remove: function (key) { sessionStorage.removeItem(key); },

    getRole: function () { return sessionStorage.getItem(K.role); },
    getName: function () { return sessionStorage.getItem(K.name); },
    getStaffUserId: function () { return sessionStorage.getItem(K.staffUserId); },
    getStaffPin: function () { return sessionStorage.getItem(K.staffPin); },
    getTeacherId: function () { return sessionStorage.getItem(K.teacherId); },
    getAdminUserId: function () { return sessionStorage.getItem(K.adminUserId); },
    getAdminPin: function () { return sessionStorage.getItem(K.adminPin); },
    getAdminPerms: readPerms,
    getDeptRole: function () { return sessionStorage.getItem(K.deptRole); },
    getDeptId: function () { return sessionStorage.getItem(K.deptId); },
    getDeptName: function () { return sessionStorage.getItem(K.deptName); },
    getDeptEmoji: function () { return sessionStorage.getItem(K.deptEmoji); },
    getChatActorId: function () {
      return this.isAdmin() ? this.getAdminUserId() : this.getStaffUserId();
    },
    getChatPin: function () {
      return this.isAdmin() ? this.getAdminPin() : this.getStaffPin();
    },
    getChatThread: function () {
      if (this.getDeptRole() === 'dept') return 'dept-' + (this.getDeptId() || 'x');
      var role = this.getRole();
      if (role === 'teacher') return 'teacher-' + (this.getTeacherId() || 'x');
      if (['daftar', 'hifz', 'library', 'alumni', 'khedmat'].indexOf(role) >= 0) return role;
      return null;
    },

    setRole: function (v) { sessionStorage.setItem(K.role, v); },
    setName: function (v) { sessionStorage.setItem(K.name, v); },
    setStaffSession: function (role, name, userId, pin) {
      sessionStorage.setItem(K.role, role);
      sessionStorage.setItem(K.name, name || '');
      if (userId) sessionStorage.setItem(K.staffUserId, userId);
      else sessionStorage.removeItem(K.staffUserId);
      if (pin) sessionStorage.setItem(K.staffPin, pin);
      else sessionStorage.removeItem(K.staffPin);
      if (role !== 'teacher') sessionStorage.removeItem(K.teacherId);
      sessionStorage.removeItem(K.adminUserId);
      sessionStorage.removeItem(K.adminPin);
      sessionStorage.removeItem(K.adminPerms);
    },
    setTeacherId: function (v) { sessionStorage.setItem(K.teacherId, v); },
    setAdminSession: function (name, perms, userId, pin) {
      sessionStorage.setItem(K.role, 'admin');
      sessionStorage.setItem(K.name, name || 'জিম্মাদার');
      sessionStorage.removeItem(K.staffUserId);
      sessionStorage.removeItem(K.staffPin);
      sessionStorage.removeItem(K.teacherId);
      if (userId) sessionStorage.setItem(K.adminUserId, userId);
      else sessionStorage.removeItem(K.adminUserId);
      if (pin) sessionStorage.setItem(K.adminPin, pin);
      else sessionStorage.removeItem(K.adminPin);
      if (perms) sessionStorage.setItem(K.adminPerms, JSON.stringify(perms));
      else sessionStorage.removeItem(K.adminPerms);
    },

    setDeptSession: function (id, name, emoji, userId, pin) {
      sessionStorage.setItem(K.deptRole, 'dept');
      sessionStorage.setItem(K.deptId, id);
      sessionStorage.setItem(K.deptName, name);
      sessionStorage.setItem(K.deptEmoji, emoji);
      sessionStorage.setItem(K.role, 'dept_head');
      sessionStorage.setItem(K.name, name || 'বিভাগ দায়িত্বশীল');
      if (userId) sessionStorage.setItem(K.staffUserId, userId);
      else sessionStorage.removeItem(K.staffUserId);
      if (pin) sessionStorage.setItem(K.staffPin, pin);
      else sessionStorage.removeItem(K.staffPin);
      sessionStorage.removeItem(K.adminUserId);
      sessionStorage.removeItem(K.adminPin);
      sessionStorage.removeItem(K.adminPerms);
    },
    changeStaffPin: async function (currentPin, newPin, localChangeFn) {
      var uid = this.getStaffUserId();
      if (!uid) return { ok: false, error: 'missing_user' };
      var hasRemote = !!(global.MMSharedAPI && global.MMSharedAPI.supabaseClient && global.MMSharedAPI.staffChangeOwnPin && isUuid(uid));
      if (hasRemote) {
        try {
          var res = await global.MMSharedAPI.staffChangeOwnPin(uid, currentPin, newPin);
          if (!res || res.ok !== true) return { ok: false, error: (res && res.error) || 'pin_change_failed' };
          if (typeof localChangeFn === 'function') {
            try { localChangeFn(uid, currentPin, newPin); } catch (e) {}
          }
          this.setStaffSession(this.getRole(), this.getName(), uid, newPin);
          return { ok: true, source: 'database' };
        } catch (e2) {
          return { ok: false, error: 'database_failed' };
        }
      }
      if (typeof localChangeFn === 'function' && localChangeFn(uid, currentPin, newPin)) {
        this.setStaffSession(this.getRole(), this.getName(), uid, newPin);
        return { ok: true, source: 'local' };
      }
      return { ok: false, error: 'invalid_current_pin' };
    },
    pinChangeErrorMessage: sessionErrorMessage,

    isAdmin: function () { return sessionStorage.getItem(K.role) === 'admin'; },
    isRestrictedAdmin: function () {
      var p = readPerms();
      return this.isAdmin() && !!p && !isSuperAdminPerms(p);
    },
    isMainAdmin: function () {
      var p = readPerms();
      return this.isAdmin() && (!p || isSuperAdminPerms(p));
    },
    getAllowedMadrasaDepts: function () {
      var p = readPerms();
      if (!p || !p.scope || !Array.isArray(p.scope.madrasa_depts) || !p.scope.madrasa_depts.length) {
        return ['kitab', 'maktab'];
      }
      return p.scope.madrasa_depts.filter(function (d) { return d === 'kitab' || d === 'maktab'; });
    },
    canUseMadrasaDept: function (dept) {
      return this.getAllowedMadrasaDepts().indexOf(dept) >= 0;
    },
    canAdmin: function (permKey) {
      var p = readPerms();
      if (!p) return true;
      if (isSuperAdminPerms(p)) return true;
      if (!permKey) return true;
      if (permKey === 'dashboard') return true;
      if (p.permissions && Object.prototype.hasOwnProperty.call(p.permissions, permKey)) {
        return !!p.permissions[permKey];
      }
      if (permKey === 'messages' || permKey === 'recent') return true;
      return false;
    },
    requireAdminPerm: function (permKey, fallbackHref) {
      if (!this.isAdmin()) {
        location.href = fallbackHref || 'main-admin-madrasa.html';
        return false;
      }
      if (!this.canAdmin(permKey)) {
        location.href = fallbackHref || 'main-admin-madrasa.html';
        return false;
      }
      return true;
    },
    requireStaffRoleOrAdminPerm: function (roles, permKey, fallbackHref) {
      var allowedRoles = Array.isArray(roles) ? roles : [roles];
      var role = this.getRole();
      if (this.isAdmin()) return this.requireAdminPerm(permKey, fallbackHref);
      if (allowedRoles.indexOf(role) >= 0) return true;
      location.href = fallbackHref || '../index.html';
      return false;
    },
    applyAdminNavRestrictions: function () {
      if (!this.isRestrictedAdmin()) return;
      var firstDept = this.getAllowedMadrasaDepts()[0] || 'kitab';
      var deptQuery = '?dept=' + encodeURIComponent(firstDept);
      document.querySelectorAll('a[href*="main-admin-madrasa.html"]').forEach(function (a) {
        var href = a.getAttribute('href') || '';
        a.setAttribute('href', href.split('?')[0] + deptQuery);
      });
      document.querySelectorAll('a[href*="main-admin-dept.html"], a[href*="main-admin-khedmat.html"]').forEach(function (a) {
        a.style.display = 'none';
      });
      if (!this.canAdmin('messages')) {
        document.querySelectorAll('a[href*="chat.html"]').forEach(function (a) { a.style.display = 'none'; });
      }
      if (!this.canAdmin('recent')) {
        document.querySelectorAll('a[href*="main-admin-recent.html"]').forEach(function (a) { a.style.display = 'none'; });
      }
    },

    clearDeptSession: function () {
      sessionStorage.removeItem(K.deptRole);
      sessionStorage.removeItem(K.deptId);
      sessionStorage.removeItem(K.deptName);
      sessionStorage.removeItem(K.deptEmoji);
    },

    clearAppSession: function () {
      ALL_APP_KEYS.forEach(function (k) { sessionStorage.removeItem(k); });
    },

    /** Clear app session then go to role selection (use from madrasa/*, khedmat staff, etc.). */
    logoutToIndex: function (href) {
      this.clearAppSession();
      location.href = href;
    },

    /**
     * Top bar: #topbar-hub → main admin (only if isAdmin). #topbar-lockout → session clear + index (staff).
     * Hub button should start hidden (style="display:none") so staff never see admin PIN by mistake.
     */
    configureTopbarHubAndLockout: function () {
      var hub = document.getElementById('topbar-hub');
      var lock = document.getElementById('topbar-lockout');
      if (!hub && !lock) return;
      if (this.isAdmin()) {
        if (hub) hub.style.removeProperty('display');
        if (lock) lock.style.display = 'none';
      } else {
        if (hub) hub.style.display = 'none';
        if (lock) lock.style.removeProperty('display');
      }
    },
  };

  global.MMSession = MMSession;
  (function clearStaleSessionOnFreshEntry() {
    if (typeof document === 'undefined' || typeof location === 'undefined') return;
    var path = String(location.pathname || '').replace(/\\/g, '/');
    var isIndex = !path || /(^|\/)(index\.html)?$/.test(path);
    if (isIndex) return;
    var navType = '';
    try {
      var nav = performance.getEntriesByType && performance.getEntriesByType('navigation')[0];
      navType = nav && nav.type ? nav.type : '';
    } catch (e) {}
    if (navType === 'reload') return;
    var sameOriginReferrer = false;
    try {
      sameOriginReferrer = !!document.referrer && new URL(document.referrer, location.href).origin === location.origin;
    } catch (e2) {}
    if (!sameOriginReferrer) MMSession.clearAppSession();
  })();
  var chatUnreadCount = 0;
  function readChatUnreadCount() { return chatUnreadCount; }
  function bnNum(n) {
    return String(n || 0).replace(/[0-9]/g, function (d) { return '০১২৩৪৫৬৭৮৯'[d]; });
  }
  function applyChatBadges() {
    if (typeof document === 'undefined') return;
    var count = readChatUnreadCount();
    var nodes = document.querySelectorAll('a[href$="chat.html"], a[href*="/chat.html"], [onclick*="chat.html"]');
    nodes.forEach(function (node) {
      var badge = node.querySelector('.mm-chat-badge');
      if (!count) {
        if (badge) badge.remove();
        return;
      }
      if (!badge) {
        badge = document.createElement('span');
        badge.className = 'mm-chat-badge';
        badge.setAttribute('aria-label', 'অপঠিত বার্তা');
        node.appendChild(badge);
      }
      badge.textContent = count > 99 ? '৯৯+' : bnNum(count);
    });
  }
  async function syncChatBadgeRemote() {
    if (!global.MMSharedAPI || !MMSession.getChatPin()) {
      chatUnreadCount = 0;
      applyChatBadges();
      return false;
    }
    try {
      var res = await MMSharedAPI.chatBootstrap(MMSession.getChatActorId() || null, MMSession.getChatPin(), MMSession.isAdmin());
      if (!res || !res.ok) throw new Error((res && res.error) || 'chat_bootstrap_failed');
      chatUnreadCount = MMSession.isAdmin() ? Number(res.unread_admin || 0) : Number(res.unread_staff || 0);
      applyChatBadges();
      return true;
    } catch (e) {
      chatUnreadCount = 0;
      applyChatBadges();
      return false;
    }
  }
  global.MMRefreshChatBadges = applyChatBadges;
  global.MMSyncChatBadges = syncChatBadgeRemote;
  global.addEventListener && global.addEventListener('mm-chat-updated', applyChatBadges);

  var settingsSyncInFlight = false;

  function readCurrentAcademicYear() {
    var settings = null;
    try {
      var raw = localStorage.getItem('mm_settings');
      settings = raw ? JSON.parse(raw) : null;
    } catch (e) {
      settings = null;
    }
    if (!settings && global.API && global.API.Settings) {
      try { settings = global.API.Settings.get(); } catch (e2) { settings = null; }
    }
    if (!settings && global.MMSampleData && global.MMSampleData.defaultSettings) {
      settings = global.MMSampleData.defaultSettings;
    }
    var year = settings && settings.hijri_year != null ? String(settings.hijri_year).trim() : '';
    if (!year || year === '-' || year === '\u2014') return '';
    return year.replace(/[0-9]/g, function (d) { return '\u09e6\u09e7\u09e8\u09e9\u09ea\u09eb\u09ec\u09ed\u09ee\u09ef'[d]; });
  }

  function renderCurrentAcademicYear() {
    if (typeof document === 'undefined') return;
    var topbars = document.querySelectorAll('.topbar, .inbox-topbar, .chat-topbar');
    if (!topbars || !topbars.length) return;
    var year = readCurrentAcademicYear();
    topbars.forEach(function (topbar) {
      var label = topbar.querySelector('.mm-monitor-topbar-label');
      if (!year) {
        if (label) label.remove();
        topbar.classList.remove('mm-monitor-topbar');
        return;
      }
      topbar.classList.add('mm-monitor-topbar');
      if (!label) {
        label = document.createElement('div');
        label.className = 'mm-monitor-topbar-label';
        topbar.appendChild(label);
      }
      label.textContent = year + ' \u09b9\u09bf\u099c\u09b0\u09c0 \u09b6\u09bf\u0995\u09cd\u09b7\u09be\u09ac\u09b0\u09cd\u09b7';
    });
  }

  function mergeAcademicSettings(settings) {
    if (!settings || (!settings.institution && !settings.hijri_year && !settings.session_start_date && settings.hijri_offset_days == null)) {
      return false;
    }
    var local = {};
    try {
      var raw = localStorage.getItem('mm_settings');
      local = raw ? JSON.parse(raw) : {};
    } catch (e) {
      local = {};
    }
    var next = {
      institution: settings.institution || local.institution,
      hijri_year: settings.hijri_year || local.hijri_year,
      session_start_date: settings.session_start_date || local.session_start_date,
      hijri_offset_days: settings.hijri_offset_days != null
        ? Number(settings.hijri_offset_days) || 0
        : Number(local.hijri_offset_days) || 0,
    };
    try {
      localStorage.setItem('mm_settings', JSON.stringify(Object.assign({}, local, next)));
    } catch (e2) {}
    if (global.MMHijri && next.hijri_offset_days != null) {
      try { global.MMHijri.setOffsetDays(next.hijri_offset_days); } catch (e3) {}
    }
    renderCurrentAcademicYear();
    return true;
  }

  async function syncCurrentAcademicYearSettings() {
    if (settingsSyncInFlight || !global.MMSharedAPI || !global.MMSharedAPI.publicSettings) return false;
    settingsSyncInFlight = true;
    try {
      var res = await global.MMSharedAPI.publicSettings();
      if (!res || res.ok !== true) return false;
      return mergeAcademicSettings(res.settings || {});
    } catch (e) {
      return false;
    } finally {
      settingsSyncInFlight = false;
    }
  }

  global.MMRenderCurrentAcademicYear = renderCurrentAcademicYear;
  global.MMSyncCurrentAcademicYearSettings = syncCurrentAcademicYearSettings;
  function autoRestrictNav() { if (global.MMSession) global.MMSession.applyAdminNavRestrictions(); }
  if (typeof document !== 'undefined') {
    var onReady = function () { autoRestrictNav(); renderCurrentAcademicYear(); syncCurrentAcademicYearSettings(); syncChatBadgeRemote(); };
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', onReady);
    else setTimeout(onReady, 0);
    document.addEventListener('visibilitychange', function () {
      if (!document.hidden) {
        renderCurrentAcademicYear();
        syncCurrentAcademicYearSettings();
      }
    });
    global.addEventListener && global.addEventListener('storage', function (event) {
      if (!event || event.key === 'mm_settings') renderCurrentAcademicYear();
    });
    global.addEventListener && global.addEventListener('mm-settings-updated', renderCurrentAcademicYear);
    global.setInterval && global.setInterval(renderCurrentAcademicYear, 3000);
  }
})(typeof window !== 'undefined' ? window : globalThis);
