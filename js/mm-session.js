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
    if (!year || year === '-') return '';
    return year.replace(/[0-9]/g, function (d) { return '০১২৩৪৫৬৭৮৯'[d]; });
  }

  function renderCurrentAcademicYear() {
    if (typeof document === 'undefined' || !global.MMSession || !global.MMSession.isAdmin()) return;
    var topbar = document.querySelector('.topbar');
    if (!topbar) return;
    var year = readCurrentAcademicYear();
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
    label.textContent = year + ' হিজরী শিক্ষাবর্ষ';
  }

  global.MMRenderCurrentAcademicYear = renderCurrentAcademicYear;
  function autoRestrictNav() { if (global.MMSession) global.MMSession.applyAdminNavRestrictions(); }
  if (typeof document !== 'undefined') {
    var onReady = function () { autoRestrictNav(); renderCurrentAcademicYear(); syncChatBadgeRemote(); };
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', onReady);
    else setTimeout(onReady, 0);
    document.addEventListener('visibilitychange', function () {
      if (!document.hidden) renderCurrentAcademicYear();
    });
    global.addEventListener && global.addEventListener('storage', function (event) {
      if (!event || event.key === 'mm_settings') renderCurrentAcademicYear();
    });
    global.setInterval && global.setInterval(renderCurrentAcademicYear, 3000);
  }
})(typeof window !== 'undefined' ? window : globalThis);
