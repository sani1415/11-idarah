/* Client session (PIN / role) until replaced by server auth. Key names live here only. */
(function (global) {
  'use strict';

  var K = {
    role: 'mm_role',
    name: 'mm_name',
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
    K.role, K.name, K.teacherId, K.adminUserId, K.adminPin, K.adminPerms,
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
    getTeacherId: function () { return sessionStorage.getItem(K.teacherId); },
    getAdminUserId: function () { return sessionStorage.getItem(K.adminUserId); },
    getAdminPin: function () { return sessionStorage.getItem(K.adminPin); },
    getAdminPerms: readPerms,
    getDeptRole: function () { return sessionStorage.getItem(K.deptRole); },
    getDeptId: function () { return sessionStorage.getItem(K.deptId); },
    getDeptName: function () { return sessionStorage.getItem(K.deptName); },
    getDeptEmoji: function () { return sessionStorage.getItem(K.deptEmoji); },

    setRole: function (v) { sessionStorage.setItem(K.role, v); },
    setName: function (v) { sessionStorage.setItem(K.name, v); },
    setTeacherId: function (v) { sessionStorage.setItem(K.teacherId, v); },
    setAdminSession: function (name, perms, userId, pin) {
      sessionStorage.setItem(K.role, 'admin');
      sessionStorage.setItem(K.name, name || 'জিম্মাদার');
      if (userId) sessionStorage.setItem(K.adminUserId, userId);
      else sessionStorage.removeItem(K.adminUserId);
      if (pin) sessionStorage.setItem(K.adminPin, pin);
      else sessionStorage.removeItem(K.adminPin);
      if (perms) sessionStorage.setItem(K.adminPerms, JSON.stringify(perms));
      else sessionStorage.removeItem(K.adminPerms);
    },

    setDeptSession: function (id, name, emoji) {
      sessionStorage.setItem(K.deptRole, 'dept');
      sessionStorage.setItem(K.deptId, id);
      sessionStorage.setItem(K.deptName, name);
      sessionStorage.setItem(K.deptEmoji, emoji);
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
  function autoRestrictNav() { if (global.MMSession) global.MMSession.applyAdminNavRestrictions(); }
  if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', autoRestrictNav);
    else setTimeout(autoRestrictNav, 0);
  }
})(typeof window !== 'undefined' ? window : globalThis);
