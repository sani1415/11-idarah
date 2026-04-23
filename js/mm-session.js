/* Client session (PIN / role) until replaced by server auth. Key names live here only. */
(function (global) {
  'use strict';

  var K = {
    role: 'mm_role',
    name: 'mm_name',
    teacherId: 'mm_teacher_id',
    deptRole: 'mm_dept_role',
    deptId: 'mm_dept_id',
    deptName: 'mm_dept_name',
    deptEmoji: 'mm_dept_emoji',
  };

  var ALL_APP_KEYS = [
    K.role, K.name, K.teacherId,
    K.deptRole, K.deptId, K.deptName, K.deptEmoji,
  ];

  var MMSession = {
    K: K,

    get: function (key) { return sessionStorage.getItem(key); },
    set: function (key, val) { sessionStorage.setItem(key, val); },
    remove: function (key) { sessionStorage.removeItem(key); },

    getRole: function () { return sessionStorage.getItem(K.role); },
    getName: function () { return sessionStorage.getItem(K.name); },
    getTeacherId: function () { return sessionStorage.getItem(K.teacherId); },
    getDeptRole: function () { return sessionStorage.getItem(K.deptRole); },
    getDeptId: function () { return sessionStorage.getItem(K.deptId); },
    getDeptName: function () { return sessionStorage.getItem(K.deptName); },
    getDeptEmoji: function () { return sessionStorage.getItem(K.deptEmoji); },

    setRole: function (v) { sessionStorage.setItem(K.role, v); },
    setName: function (v) { sessionStorage.setItem(K.name, v); },
    setTeacherId: function (v) { sessionStorage.setItem(K.teacherId, v); },

    setDeptSession: function (id, name, emoji) {
      sessionStorage.setItem(K.deptRole, 'dept');
      sessionStorage.setItem(K.deptId, id);
      sessionStorage.setItem(K.deptName, name);
      sessionStorage.setItem(K.deptEmoji, emoji);
    },

    isAdmin: function () { return sessionStorage.getItem(K.role) === 'admin'; },

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
     * Top bar: #topbar-hub → admin-hub (only if isAdmin). #topbar-lockout → session clear + index (staff).
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
})(typeof window !== 'undefined' ? window : globalThis);
