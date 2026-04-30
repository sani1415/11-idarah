/* ═══════════════════════════════════════════
   মাদরাসাতুল মদীনা — api.js
   সব ডেটা লজিক এখানে। localStorage ব্যবহার।
   ═══════════════════════════════════════════ */

const API = (() => {

  /* ── KEYS ── */
  const KEYS = {
    students:    'mm_students',
    classes:     'mm_classes',
    attendance:  'mm_attendance',
    kitabs:      'mm_kitabs',
    kitab_prog:  'mm_kitab_progress',
    khuluk:      'mm_khuluk',
    exams:       'mm_exams',
    results:     'mm_results',
    logs:        'mm_logs',
    fees:        'mm_fees',
    teachers:    'mm_teachers',
    users:       'mm_users',
    settings:    'mm_settings',
    sessions:    'mm_sessions',
    holidays:    'mm_holidays',
  };

  /* ── HELPERS ── */
  const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 5);
  const today = () => new Date().toISOString().split('T')[0];
  const now = () => new Date().toISOString();
  const esc = s => String(s || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');

  function load(key) {
    try { return JSON.parse(localStorage.getItem(key)) || []; } catch { return []; }
  }
  function loadObj(key, def = {}) {
    try { return JSON.parse(localStorage.getItem(key)) || def; } catch { return def; }
  }
  function save(key, data) {
    localStorage.setItem(key, JSON.stringify(data));
  }

  function purgeKnownSampleData() {
    const filterKey = (key, isSample) => {
      const rows = load(key);
      if (!rows.length) return;
      const next = rows.filter((row) => !isSample(row));
      if (next.length !== rows.length) save(key, next);
    };
    const sampleStudent = (row) => /^std_([1-9]|[12][0-9]|3[01])$/.test(String(row && row.id || '')) && !row.supabase_id;
    const sampleTeacher = (row) => /^(tch_([1-8]|1[0-4])|daftar|usr_(hifz|lib|alumni|khedmat))$/.test(String(row && row.id || '')) && !row.supabase_id;
    const sampleRef = (row) => {
      const id = String(row && row.id || '');
      return /^(att_d|mm_ex|exam_|r|ktb_|kp_|kh_|log_|fee_|bk_|grp_|al_)_?\d+/.test(id) ||
        /^mm_ex_/.test(id) ||
        sampleStudent({ id: row && row.student_id }) ||
        sampleStudent({ id: row && row.ref_id }) ||
        /^(ktb_|grp_|bk_|al_)\d+/.test(String(row && (row.kitab_id || row.book_id || row.group_id || row.alumni_id) || ''));
    };

    filterKey(KEYS.students, sampleStudent);
    filterKey(KEYS.teachers, sampleTeacher);
    [KEYS.attendance, KEYS.kitabs, KEYS.kitab_prog, KEYS.khuluk, KEYS.exams, KEYS.results, KEYS.logs, KEYS.fees].forEach((key) => filterKey(key, sampleRef));
    ['mm_lib_books', 'mm_lib_issues', 'mm_hifz_groups', 'mm_hifz_progress', 'mm_hifz_members', 'mm_hifz_activity', 'mm_alumni', 'mm_alumni_contacts'].forEach((key) => filterKey(key, sampleRef));
  }

  /** মক্তব: স্থায়ী আইডি digit-only, leading zero সহ; রোল/পরিচিতি `ম` দিয়ে শুরু */
  function bnDigitsToInt(str) {
    if (!str) return 0;
    const t = String(str).trim().replace(/[০-৯]/g, (ch) => {
      const i = '০১২৩৪৫৬৭৮৯'.indexOf(ch);
      return i < 0 ? ch : String(i);
    });
    const digits = t.replace(/[^0-9]/g, '');
    return parseInt(digits, 10) || 0;
  }
  function intToBnPadded(n, minLen) {
    const s = String(n).split('').map((c) => '০১২৩৪৫৬৭৮৯'[Number(c)]).join('');
    return s.length >= minLen ? s : '০'.repeat(minLen - s.length) + s;
  }
  function intToAsciiPadded(n, minLen) {
    return String(n || 0).padStart(minLen, '0');
  }
  function parseMaktabPermanentIdToInt(pid) {
    const s = String(pid || '').trim();
    if (!/^0[0-9০-৯]+$/.test(s)) return 0;
    return bnDigitsToInt(s);
  }

  /* ══════════════════════════════
     LEGACY LOCAL MIGRATIONS
     ══════════════════════════════ */
  function seedIfEmpty() {
    function defaultTeacherLoginId(t) {
      if (!t || !t.class_id) return t && t.login_id;
      const id = String(t.id || '').trim();
      const m = id.match(/^tch_(\d+)$/);
      if (m) return 't' + m[1];
      return id ? id.toLowerCase().replace(/[^a-z0-9_-]+/g, '-') : '';
    }

    /* ── MIGRATION: force all PINs to 0000 ── */
    const allT = load(KEYS.teachers);
    if (allT.length && allT.some(t => t.pin !== '0000')) {
      save(KEYS.teachers, allT.map(t => ({ ...t, pin: '0000' })));
    }
    const existingSettings = loadObj(KEYS.settings, {});
    if (existingSettings.admin_pin && existingSettings.admin_pin !== '0000') {
      save(KEYS.settings, { ...existingSettings, admin_pin: '0000' });
    }

    /* ── MIGRATION: add khedmat user if missing ── */
    const allT2 = load(KEYS.teachers);
    if (allT2.length && !allT2.find(t => t.id === 'usr_khedmat')) {
      save(KEYS.teachers, [...allT2, { id:'usr_khedmat', name:'খেদমত দায়িত্বশীল', class_id:null, pin:'0000', role:'khedmat' }]);
    }

    /* ── MIGRATION: বর্ষ দায়িত্বশীল direct login — login_id নিশ্চিত করুন ── */
    const allT3 = load(KEYS.teachers);
    if (allT3.length && allT3.some(t => t.class_id && !t.login_id)) {
      save(KEYS.teachers, allT3.map(t => t.class_id && !t.login_id ? { ...t, login_id: defaultTeacherLoginId(t) } : t));
    }

    /* ── MIGRATION: ছাত্র — ভর্তি_বছর সরান; একক ঠিকানা → জেলা+উপজেলা (পুরনো পুরো লাইন উপজেলায়) ── */
    {
      const stud = load(KEYS.students);
      if (stud.some((s) => s.admitted != null || s.address)) {
        save(
          KEYS.students,
          stud.map((s) => {
            const o = { ...s };
            if ('admitted' in o) delete o.admitted;
            if (o.address != null && String(o.address).trim() !== '' && o.district == null && o.upazila == null) {
              o.district = '';
              o.upazila = String(o.address).trim();
            }
            if ('address' in o) delete o.address;
            return o;
          })
        );
      }
    }

    if (load(KEYS.classes).length) return;

    const buildM = globalThis.MMSampleData && globalThis.MMSampleData.buildMadrasaSample;
    if (!buildM) {
      console.warn('[MMSampleData] mm-sample-data.js api.js-এর আগে লোড করুন।');
      return;
    }
    const pack = buildM(today());
    if (!pack || !pack.mm_classes || !pack.mm_classes.length) return;
    save(KEYS.classes, pack.mm_classes);
    if (!localStorage.getItem(KEYS.settings)) save(KEYS.settings, pack.mm_settings || {});
  }

  /* ══════════════════════════════
     STUDENTS
     ══════════════════════════════ */
  const Students = {
    getAll: () => load(KEYS.students),
    getById: id => load(KEYS.students).find(s => s.id === id),
    getByClass: cid => load(KEYS.students).filter(s => s.class_id === cid && s.active),
    replaceAll(list) {
      const existing = load(KEYS.students);
      const byId = new Map();
      existing.forEach((s) => {
        [s.id, s.supabase_id, s.permanent_id].filter(Boolean).forEach((k) => byId.set(String(k), s));
      });
      const next = (Array.isArray(list) ? list : []).map((s) => {
        const prev = byId.get(String(s.id || '')) || byId.get(String(s.supabase_id || '')) || byId.get(String(s.permanent_id || ''));
        return prev && prev.special_watch && s.special_watch == null ? { ...s, special_watch: true } : s;
      });
      save(KEYS.students, next);
    },
    /** কিতাব বা মক্তব বিভাগের সক্রিয় ছাত্র সংখ্যা */
    countActiveByDept(dept) {
      const cids = new Set(load(KEYS.classes).filter((c) => c.dept === dept).map((c) => c.id));
      return load(KEYS.students).filter((s) => s.active && cids.has(s.class_id)).length;
    },
    add(data) {
      const list = load(KEYS.students);
      const s = { id: 'std_' + uid(), ...data, active: true };
      list.push(s);
      save(KEYS.students, list);
      return s;
    },
    update(id, data) {
      const list = load(KEYS.students).map(s => s.id === id ? { ...s, ...data } : s);
      save(KEYS.students, list);
    },
    markInactive(id, reason, date) {
      const leftDate = date || today();
      const student = load(KEYS.students).find(s => s.id === id);
      if (!student) return null;
      this.update(id, { active: false, status: 'dropped', left_date: leftDate, left_reason: reason || '' });
      const withdrawals = persistLoadArr('mm_withdrawals');
      if (!withdrawals.some(w => w.student_id === id)) {
        withdrawals.push({
          id: 'wd_' + uid(),
          student_id: id,
          student_name: student.name,
          permanent_id: student.permanent_id,
          last_class_id: student.class_id,
          last_roll: student.roll,
          reason: reason || 'বিদায়',
          note: reason || '',
          date: leftDate,
        });
        persistSaveArr('mm_withdrawals', withdrawals);
      }
      const alumni = persistLoadArr('mm_alumni');
      if (!alumni.some(a => a.student_id === id || a.permanent_id === student.permanent_id)) {
        alumni.push({
          id: 'al_' + uid(),
          student_id: id,
          name: student.name,
          permanent_id: student.permanent_id,
          phone: student.phone,
          year: leftDate.slice(0, 4),
          reason: reason || 'মাঝপথে বিদায়',
          location: '',
          status: 'মাঝপথে',
        });
        persistSaveArr('mm_alumni', alumni);
      }
      return { ...student, active: false, status: 'dropped', left_date: leftDate, left_reason: reason || '' };
    },
    promoteClass(id, new_class_id) {
      const list = load(KEYS.students).map(s => {
        if (s.id !== id) return s;
        const history = s.class_history || [];
        history.push({ from: s.class_id, to: new_class_id, date: today() });
        return { ...s, class_id: new_class_id, class_history: history };
      });
      save(KEYS.students, list);
    },
    /**
     * বর্ষ উন্নীতকরণ — bulk year-end promotion
     * changes: [{id, new_class_id, new_roll, action: 'promote'|'repeat'|'alumni_pass'|'dropout'}]
     */
    bulkYearEnd(changes, newHijriYear) {
      const list = load(KEYS.students);
      const withdrawals = JSON.parse(localStorage.getItem('mm_withdrawals') || '[]');
      const updated = list.map(s => {
        const c = changes.find(ch => ch.id === s.id);
        if (!c) return s;
        if (c.action === 'alumni_pass' || c.action === 'dropout') {
          withdrawals.push({
            id: 'wd_' + uid(), student_id: s.id, name: s.name,
            permanent_id: s.permanent_id, last_class_id: s.class_id,
            last_roll: s.roll,
            reason: c.action === 'alumni_pass' ? 'পাস করেছেন' : 'মাঝপথে বিদায়',
            date: today(), hijri_year: newHijriYear,
          });
          return { ...s, active: false };
        }
        const history = s.class_history || [];
        history.push({ from: s.class_id, to: c.new_class_id, roll_from: s.roll, roll_to: c.new_roll, date: today(), hijri: newHijriYear });
        return { ...s, class_id: c.new_class_id, roll: c.new_roll, class_history: history };
      });
      save(KEYS.students, updated);
      localStorage.setItem('mm_withdrawals', JSON.stringify(withdrawals));
    },
    /**
     * স্থায়ী আইডি DB তে কারও আছে কিনা (অবস্থা স্বতন্ত্র)।
     */
    isPermanentIdTaken(permanentId) {
      const p = String(permanentId || '').trim();
      if (!p) return false;
      return load(KEYS.students).some((s) => String(s.permanent_id || '').trim() === p);
    },
    /**
     * একই ব্যাচে ইতোমধ্যে বরাদ্দ/ম্যানুয়াল ধরা আইডি (virtual) + DB = পরের ফাঁকা।
     * @param {Set<string>} virtualPids
     */
    getNextPermanentIdRespecting(virtualPids, dept, hijriYear) {
      if (dept === 'maktab') {
        const nums = [];
        const classMap = Object.fromEntries(load(KEYS.classes).map((c) => [c.id, c]));
        load(KEYS.students).forEach((s) => {
          if (s.permanent_id && classMap[s.class_id] && classMap[s.class_id].dept === 'maktab') {
            nums.push(parseMaktabPermanentIdToInt(s.permanent_id));
          }
        });
        if (virtualPids && virtualPids.forEach) {
          virtualPids.forEach((id) => nums.push(parseMaktabPermanentIdToInt(id)));
        }
        const next = nums.length ? Math.max(0, ...nums) + 1 : 1;
        return intToAsciiPadded(next, 6);
      }
      const yr = String(hijriYear).slice(-2);
      const head = yr;
      const takeNum = (pid) => {
        if (!pid || !String(pid).startsWith(head)) return 0;
        return parseInt(String(pid).slice(head.length), 10) || 0;
      };
      const nums = [];
      load(KEYS.students).forEach((s) => {
        if (s.permanent_id) nums.push(takeNum(s.permanent_id));
      });
      if (virtualPids && virtualPids.forEach) {
        virtualPids.forEach((id) => nums.push(takeNum(id)));
      }
      const next = nums.length ? Math.max(...nums) + 1 : 1;
      return head + String(next).padStart(3, '0');
    },
    getNextPermanentId(dept, hijriYear) {
      return Students.getNextPermanentIdRespecting(new Set(), dept, hijriYear);
    },
    /** শিক্ষক কর্তৃক চিহ্নিত বিশেষ পর্যবেক্ষণ */
    countSpecialWatchByDept(dept) {
      const cids = new Set(load(KEYS.classes).filter((c) => c.dept === dept).map((c) => c.id));
      return load(KEYS.students).filter(
        (s) => s.active && cids.has(s.class_id) && s.special_watch
      ).length;
    },
    getSpecialWatchByDeptSorted(dept) {
      const cids = new Set(load(KEYS.classes).filter((c) => c.dept === dept).map((c) => c.id));
      return load(KEYS.students)
        .filter((s) => s.active && cids.has(s.class_id) && s.special_watch)
        .sort((a, b) => String(a.name || '').localeCompare(String(b.name || ''), 'bn'));
    },
    /**
     * mm_withdrawals — বর্ষ শেষে বা ড্রপআউটে last_class_id অনুসারে।
     * @param {string} classId
     * @param {string|null|undefined} hijriYearFilter — API.Settings-এর hijri_year; null হলে সব
     */
    getWithdrawalsFromClass(classId, hijriYearFilter) {
      let w;
      try { w = JSON.parse(localStorage.getItem('mm_withdrawals') || '[]'); } catch { return []; }
      let list = w.filter((x) => x.last_class_id === classId);
      if (hijriYearFilter != null && String(hijriYearFilter).trim() !== '' && String(hijriYearFilter) !== '—') {
        const y = String(hijriYearFilter);
        list = list.filter((x) => String(x.hijri_year || '') === y);
      }
      return list.sort((a, b) => String(b.date || '').localeCompare(String(a.date || '')));
    },
  };

  /* ══════════════════════════════
     CLASSES
     ══════════════════════════════ */
  const DEFAULT_CLASS_NEXT = {
    cls_k1: 'cls_ky', cls_ky: 'cls_k2', cls_k2: 'cls_k3', cls_k3: 'cls_k4',
    cls_k4: 'cls_k5', cls_k5: 'cls_k6', cls_k6: 'cls_k7',
    cls_k7: 'alumni_pass',
    cls_m1: 'cls_m2', cls_m2: 'cls_m3', cls_m3: 'cls_m4', cls_m4: 'cls_m5',
    cls_m5: 'cls_k1',
  };
  const DEFAULT_CLASS_ORDER = {
    cls_k1: 10, cls_ky: 20, cls_k2: 30, cls_k3: 40, cls_k4: 50,
    cls_k5: 60, cls_k6: 70, cls_k7: 80,
    cls_m1: 10, cls_m2: 20, cls_m3: 30, cls_m4: 40, cls_m5: 50,
  };
  function normalizeClass(c) {
    if (!c) return c;
    return {
      active: c.active !== false,
      sort_order: c.sort_order != null ? Number(c.sort_order) : (DEFAULT_CLASS_ORDER[c.id] || Number(c.year) * 10 || 999),
      next_class_id: c.next_class_id || DEFAULT_CLASS_NEXT[c.id] || 'alumni_pass',
      ...c,
      active: c.active !== false,
    };
  }
  function sortClasses(list) {
    return list.map(normalizeClass).sort((a, b) =>
      (a.dept || '').localeCompare(b.dept || '') ||
      (Number(a.sort_order) || 999).toString().localeCompare((Number(b.sort_order) || 999).toString(), undefined, { numeric: true }) ||
      String(a.name || '').localeCompare(String(b.name || ''), 'bn')
    );
  }
  const Classes = {
    getAll: (includeInactive = false) => sortClasses(load(KEYS.classes).filter(c => includeInactive || c.active !== false)),
    getById: id => normalizeClass(load(KEYS.classes).find(c => c.id === id)),
    getByDept: (dept, includeInactive = false) => sortClasses(load(KEYS.classes).filter(c => c.dept === dept && (includeInactive || c.active !== false))),
    getName: id => { const c = load(KEYS.classes).find(c => c.id === id); return c ? c.name : '—'; },
    add(data) {
      const list = load(KEYS.classes);
      const id = data.id || 'cls_' + uid();
      const entry = normalizeClass({ active: true, sort_order: 999, next_class_id: 'alumni_pass', ...data, id });
      list.push(entry);
      save(KEYS.classes, list);
      return entry;
    },
    update(id, data) {
      save(KEYS.classes, load(KEYS.classes).map(c => c.id === id ? normalizeClass({ ...c, ...data, id: c.id }) : c));
    },
  };

  /* ══════════════════════════════
     TEACHERS
     ══════════════════════════════ */
  const Teachers = {
    getAll: () => load(KEYS.teachers),
    getById: id => load(KEYS.teachers).find(t => t.id === id),
    getByClassId: cid => load(KEYS.teachers).find(t => t.class_id === cid),
    /** ওই বিভাগের ক্লাসে নিয়োজিত শিক্ষক (ক্লাসবিহীন স্টাফ বাদ) */
    getByDept(dept) {
      const cids = new Set(Classes.getByDept(dept).map(c => c.id));
      return load(KEYS.teachers)
        .filter(t => t.class_id && cids.has(t.class_id))
        .sort((a, b) => {
          const classA = Classes.getById(a.class_id)?.name || '';
          const classB = Classes.getById(b.class_id)?.name || '';
          const byClass = classA.localeCompare(classB, 'bn');
          if (byClass !== 0) return byClass;
          return String(a.name || '').localeCompare(String(b.name || ''), 'bn');
        });
    },
    verifyPin(id, pin) { const t = load(KEYS.teachers).find(t => t.id === id); return t && t.pin === pin; },
    update(id, data) {
      save(KEYS.teachers, load(KEYS.teachers).map(t => t.id === id ? { ...t, ...data } : t));
    },
    add(data) {
      const list = load(KEYS.teachers);
      const t = { id: 'tch_' + uid(), ...data };
      list.push(t);
      save(KEYS.teachers, list);
      return t;
    },
  };

  /* ══════════════════════════════
     ATTENDANCE
     স্ট্যাটাস: 'present' | 'absent' | 'holiday'
     'leave' পুরনো ডেটায় থাকতে পারে — মাইগ্রেশনে absent হয়
     ══════════════════════════════ */
  const Attendance = {
    statusOf(a) {
      if (!a) return 'present';
      if (a.status === 'present' || a.status === 'absent' || a.status === 'holiday') return a.status;
      if (a.status === 'leave') return 'absent';
      return a.present ? 'present' : 'absent';
    },
    getByDate: date => load(KEYS.attendance).filter(a => a.date === date),
    replaceAll(list) {
      save(KEYS.attendance, Array.isArray(list) ? list : []);
    },
    /** ছাত্রের সকল হাজিরা রেকর্ড — নতুন থেকে পুরনো */
    getByStudent: sid =>
      load(KEYS.attendance)
        .filter(a => a.student_id === sid)
        .sort((a, b) => b.date.localeCompare(a.date)),
    getByStudentDate: (sid, date) => load(KEYS.attendance).find(a => a.student_id === sid && a.date === date),
    getByClassDate(cid, date) {
      const sids = Students.getByClass(cid).map(s => s.id);
      return load(KEYS.attendance).filter(a => a.date === date && sids.includes(a.student_id));
    },
    /**
     * @param statusIn 'present' | 'absent' | 'holiday' | boolean (legacy)
     * @param absentReason শুধু status absent হলে — অনুপস্থিতির কারণ
     */
    save(student_id, date, statusIn, absentReason) {
      let status;
      if (statusIn === true || statusIn === 'present') status = 'present';
      else if (statusIn === false || statusIn === 'absent' || statusIn === 'leave') status = 'absent';
      else if (statusIn === 'holiday') status = 'holiday';
      else status = 'absent';
      const hijri_year = (Settings.get().hijri_year || '').trim() || null;
      const list = load(KEYS.attendance);
      const idx = list.findIndex(a => a.student_id === student_id && a.date === date);
      const prev = idx >= 0 ? list[idx] : null;
      const id = prev ? prev.id : uid();
      const reasonIn =
        typeof absentReason === 'string' ? absentReason.trim() : (prev && prev.absent_reason) ? String(prev.absent_reason).trim() : '';
      const row = { id, student_id, date, status };
      if (hijri_year) row.hijri_year = hijri_year;
      if (status === 'absent') row.absent_reason = reasonIn;
      if (idx >= 0) list[idx] = row;
      else list.push(row);
      save(KEYS.attendance, list);
    },
    getSummary(cid, month) {
      const sids = Students.getByClass(cid).map(s => s.id);
      const records = load(KEYS.attendance).filter(a => sids.includes(a.student_id) && a.date.startsWith(month));
      const present = records.filter(a => this.statusOf(a) === 'present').length;
      const absent = records.filter(a => this.statusOf(a) === 'absent').length;
      const holiday = records.filter(a => this.statusOf(a) === 'holiday').length;
      const total = present + absent;
      return { total, present, absent, holiday, pct: total ? Math.round(present / total * 100) : 0 };
    },
    getTodaySummary() {
      return this.getDateSummary(today());
    },
    getDateSummary(date) {
      const all = load(KEYS.attendance).filter(a => a.date === date);
      const st = a => this.statusOf(a);
      const present = all.filter(a => st(a) === 'present').length;
      const absent = all.filter(a => st(a) === 'absent').length;
      const holiday = all.filter(a => st(a) === 'holiday').length;
      return { present, absent, holiday, total: present + absent };
    },
    getDateSummaryForDept(date, dept) {
      if (dept !== 'kitab' && dept !== 'maktab') return this.getDateSummary(date);
      const cids = new Set(Classes.getByDept(dept).map(c => c.id));
      const sidSet = new Set(
        Students.getAll().filter(s => s.active && cids.has(s.class_id)).map(s => s.id)
      );
      const all = load(KEYS.attendance).filter(a => a.date === date && sidSet.has(a.student_id));
      const st = (a) => this.statusOf(a);
      const present = all.filter((a) => st(a) === 'present').length;
      const absent = all.filter((a) => st(a) === 'absent').length;
      const holiday = all.filter((a) => st(a) === 'holiday').length;
      return { present, absent, holiday, total: present + absent };
    },
    /** ছাত্র প্রতি মোট অনুপস্থিত দিন (স্ট্যাটাস absent, holiday বাদ) */
    getAbsentStatsByStudent() {
      const byStudent = {};
      load(KEYS.attendance).forEach((a) => {
        if (this.statusOf(a) !== 'absent') return;
        byStudent[a.student_id] = (byStudent[a.student_id] || 0) + 1;
      });
      return byStudent;
    },
    /** যে ছাত্রদের কমপক্ষে এক দিন অনুপস্থিত রেকর্ড আছে — অনুপস্থিত দিন বেশি থেকে কম */
    getStudentsWithAbsentSorted() {
      const by = this.getAbsentStatsByStudent();
      return Students.getAll()
        .filter((s) => s.active)
        .map((s) => ({ student: s, absentDays: by[s.id] || 0 }))
        .filter((x) => x.absentDays > 0)
        .sort((a, b) => b.absentDays - a.absentDays);
    },
    getStudentsWithAbsentSortedByDept(dept) {
      if (dept !== 'kitab' && dept !== 'maktab') return this.getStudentsWithAbsentSorted();
      const cids = new Set(Classes.getByDept(dept).map((c) => c.id));
      const by = this.getAbsentStatsByStudent();
      return Students.getAll()
        .filter((s) => s.active && cids.has(s.class_id))
        .map((s) => ({ student: s, absentDays: by[s.id] || 0 }))
        .filter((x) => x.absentDays > 0)
        .sort((a, b) => b.absentDays - a.absentDays);
    },
    countStudentsWithAnyAbsentByDept(dept) {
      return this.getStudentsWithAbsentSortedByDept(dept).length;
    },
    /**
     * ছাত্রের নির্দিষ্ট শিক্ষাবর্ষের হাজিরার সারসংক্ষেপ।
     * holiday বাদে মোট পাঠদান দিন ভিত্তিতে হিসাব।
     */
    getStudentYearSummary(student_id, hijri_year) {
      let recs = load(KEYS.attendance).filter(a => a.student_id === student_id);
      if (hijri_year) recs = recs.filter(a => (a.hijri_year || '') === String(hijri_year));
      const present = recs.filter(a => this.statusOf(a) === 'present').length;
      const absent = recs.filter(a => this.statusOf(a) === 'absent').length;
      const holiday = recs.filter(a => this.statusOf(a) === 'holiday').length;
      const schoolDays = present + absent;
      return { present, absent, holiday, schoolDays, pct: schoolDays ? Math.round(present / schoolDays * 100) : null };
    },
  };

  /* ══════════════════════════════
     KITAB PROGRESS
     ══════════════════════════════ */
  const KitabProgress = {
    getByClass: cid => {
      const kitabs = load(KEYS.kitabs).filter(k => k.class_id === cid);
      const prog = load(KEYS.kitab_prog);
      return kitabs.map(k => {
        const entries = prog.filter(p => p.kitab_id === k.id).sort((a,b) => b.date.localeCompare(a.date));
        const latest = entries[0];
        return { ...k, pages_done: latest ? latest.pages_done : 0, last_updated: latest ? latest.date : null, history: entries };
      });
    },
    update(kitab_id, class_id, pages_done, note = '') {
      const list = load(KEYS.kitab_prog);
      list.push({ id: uid(), kitab_id, class_id, date: today(), pages_done, note });
      save(KEYS.kitab_prog, list);
    },
    addKitab(data) {
      const list = load(KEYS.kitabs);
      const k = { id: 'ktb_' + uid(), ...data };
      list.push(k);
      save(KEYS.kitabs, list);
      return k;
    },
    getKitabsByClass: cid => load(KEYS.kitabs).filter(k => k.class_id === cid),
    /** নতুন শিক্ষাবর্ষে সব progress রিসেট */
    resetAllProgress() { save(KEYS.kitab_prog, []); },
  };

  /* ══════════════════════════════
     KHULUK (হুসনুল খুলুক)
     ══════════════════════════════ */
  const Khuluk = {
    getByStudent: sid => load(KEYS.khuluk).filter(k => k.student_id === sid).sort((a,b) => b.date.localeCompare(a.date)),
    getLatest: sid => { const list = load(KEYS.khuluk).filter(k => k.student_id === sid).sort((a,b) => b.date.localeCompare(a.date)); return list[0] || null; },
    add(student_id, score, reason, by) {
      const list = load(KEYS.khuluk);
      const entry = { id: uid(), student_id, score: parseInt(score), reason, date: today(), by };
      list.push(entry);
      save(KEYS.khuluk, list);
      return entry;
    },
    update(id, data) {
      const list = load(KEYS.khuluk).map(k => k.id === id ? { ...k, ...data } : k);
      save(KEYS.khuluk, list);
    },
    getClassAvg(cid) {
      const sids = Students.getByClass(cid).map(s => s.id);
      const scores = sids.map(sid => { const k = Khuluk.getLatest(sid); return k ? k.score : null; }).filter(s => s !== null);
      return scores.length ? Math.round(scores.reduce((a,b) => a+b, 0) / scores.length) : null;
    },
    /** সর্বশেষ হুসনুল খুলুক: ৮১+ মুজতাহিদ, ৬০–৮০ মুতাওয়াস্সিত, ৬০-এর নিচে মুসতায়িদ, রেকর্ড ছাড়া আলাদা (মেইন এডমিন ও বর্ষ পেজ এক মাপ) */
    getClassKhulukBands(cid) {
      const sids = Students.getByClass(cid).map(s => s.id);
      const out = { high: 0, mid: 0, low: 0, none: 0, total: sids.length };
      sids.forEach((sid) => {
        const k = Khuluk.getLatest(sid);
        if (!k) { out.none++; return; }
        const sc = Number(k.score);
        if (Number.isNaN(sc)) { out.none++; return; }
        if (sc >= 81) out.high++;
        else if (sc >= 60) out.mid++;
        else out.low++;
      });
      return out;
    },
    /** বর্ষের সক্রিয় ছাত্রদের — সর্বশেষ খুলুক এন্ট্রি, তারিখ অনুসারে */
    getRecentByClass(classId, limit = 12) {
      const sids = new Set(Students.getByClass(classId).map((s) => s.id));
      return load(KEYS.khuluk)
        .filter((k) => sids.has(k.student_id))
        .sort((a, b) => b.date.localeCompare(a.date))
        .slice(0, limit);
    },
  };

  /* ══════════════════════════════
     LOGS
     ══════════════════════════════ */
  const Logs = {
    getByClass: cid => load(KEYS.logs).filter(l => l.type === 'class' && l.ref_id === cid).sort((a,b) => b.date.localeCompare(a.date)),
    getByStudent: sid => load(KEYS.logs).filter(l => l.type === 'student' && l.ref_id === sid).sort((a,b) => b.date.localeCompare(a.date)),
    getByTeacher: tid => load(KEYS.logs).filter(l => l.type === 'teacher' && l.ref_id === tid).sort((a,b) => b.date.localeCompare(a.date)),
    add(type, ref_id, text, by, tag = 'normal') {
      const list = load(KEYS.logs);
      const entry = { id: uid(), type, ref_id, text, date: today(), by, tag };
      list.push(entry);
      save(KEYS.logs, list);
      return entry;
    },
    update(id, data) {
      const list = load(KEYS.logs).map(l => l.id === id ? { ...l, ...data } : l);
      save(KEYS.logs, list);
    },
    getAll: () => load(KEYS.logs).sort((a,b) => b.date.localeCompare(a.date))
  };

  /* ══════════════════════════════
     FEES SUMMARY
     ══════════════════════════════ */
  const Fees = {
    getByClass: cid => load(KEYS.fees).filter(f => f.class_id === cid).sort((a,b) => b.month.localeCompare(a.month)),
    getLatest: cid => { const list = load(KEYS.fees).filter(f => f.class_id === cid).sort((a,b) => b.month.localeCompare(a.month)); return list[0] || null; },
    add(data) {
      const list = load(KEYS.fees);
      const entry = { id: uid(), date: today(), ...data };
      list.push(entry);
      save(KEYS.fees, list);
      return entry;
    }
  };

  /* ══════════════════════════════
     EXAMS & RESULTS
     ══════════════════════════════ */
  const Exams = {
    getAll: () => load(KEYS.exams),
    getByClass: cid => load(KEYS.exams).filter(e => e.class_id === cid),
    add(data) {
      const list = load(KEYS.exams);
      const e = { id: 'exam_' + uid(), ...data, created: today() };
      list.push(e);
      save(KEYS.exams, list);
      return e;
    },
    addResult(data) {
      const list = load(KEYS.results);
      const existing = list.findIndex(r => r.exam_id === data.exam_id && r.student_id === data.student_id);
      const entry = { id: uid(), date: today(), ...data };
      if (existing >= 0) list[existing] = entry;
      else list.push(entry);
      save(KEYS.results, list);
      return entry;
    },
    getResults: exam_id => load(KEYS.results).filter(r => r.exam_id === exam_id),
    getStudentResults: sid => load(KEYS.results).filter(r => r.student_id === sid),
  };

  /* ══════════════════════════════
     SETTINGS
     ══════════════════════════════ */
  const Settings = {
    get: () => loadObj(
      KEYS.settings,
      (globalThis.MMSampleData && globalThis.MMSampleData.defaultSettings)
        ? { ...globalThis.MMSampleData.defaultSettings }
        : { institution: '—', hijri_year: '—', admin_pin: '0000' }
    ),
    save: data => save(KEYS.settings, data),
  };

  /** Raw localStorage array helpers — used by feature pages until moved into domain APIs. */
  function persistLoadArr(storageKey) {
    try { return JSON.parse(localStorage.getItem(storageKey)) || []; } catch { return []; }
  }
  function persistSaveArr(storageKey, data) {
    localStorage.setItem(storageKey, JSON.stringify(data));
  }

  function migrateAttendanceStatus() {
    const list = load(KEYS.attendance);
    const needsMigration = list.some(a =>
      (a.present !== undefined && !a.status) || a.status === 'leave'
    );
    if (!needsMigration) return;
    save(KEYS.attendance, list.map(a => {
      const next = { ...a };
      if (!next.status && next.present !== undefined) {
        next.status = next.present ? 'present' : 'absent';
        delete next.present;
      }
      if (next.status === 'leave') next.status = 'absent';
      return next;
    }));
  }

  /* ══════════════════════════════
     SESSIONS — শিক্ষাবর্ষ সেশন
     { id, hijri_year, start_date, end_date|null }
     ══════════════════════════════ */
  const Sessions = {
    getAll: () => load(KEYS.sessions),
    getCurrent() {
      const s = Settings.get();
      return load(KEYS.sessions).find(s2 => !s2.end_date) || null;
    },
    /**
     * প্রথম সেটআপ বা নতুন বর্ষ শুরু করার সময় call করুন।
     * আগের open সেশন থাকলে সেটা end_date দিয়ে বন্ধ করে নতুনটা খোলে।
     */
    startNew(hijri_year, start_date) {
      const list = load(KEYS.sessions);
      const prev = list.find(s => !s.end_date);
      const today_ = today();
      if (prev) prev.end_date = today_;
      list.push({ id: uid(), hijri_year: String(hijri_year), start_date: start_date || today_, end_date: null });
      save(KEYS.sessions, list);
    },
    /** বর্তমান সেশন শেষ করুন (end_date সেট) */
    endCurrent(end_date) {
      const list = load(KEYS.sessions);
      const cur = list.find(s => !s.end_date);
      if (cur) { cur.end_date = end_date || today(); save(KEYS.sessions, list); }
    },
    /** চালু সেশনের start_date (সেটিংসে শিক্ষাবর্ষ শুরু) আপডেট */
    setCurrentStartDate(iso) {
      if (!iso) return;
      const list = load(KEYS.sessions);
      const cur = list.find(s2 => !s2.end_date);
      if (!cur) return;
      cur.start_date = String(iso).trim();
      save(KEYS.sessions, list);
    },
    ensureInitialized() {
      if (this.getCurrent()) return;
      const s = Settings.get();
      const sd = (s.session_start_date || '').trim();
      if (!sd) return;
      let hy = (s.hijri_year || '').trim();
      if (!hy || hy === '—') hy = '১৪৪৭';
      this.startNew(hy, sd);
    },
  };

  /* ══════════════════════════════
     HOLIDAYS — বিরতির দিন (শ্রেণিব্যাপী)
     { id, from_date, to_date, note }
     বিরতির দিনে সব ছাত্রের status='holiday' সংরক্ষণ হয়
     ══════════════════════════════ */
  const Holidays = {
    getAll: () => load(KEYS.holidays),
    /**
     * from_date থেকে to_date পর্যন্ত সব ছাত্রের হাজিরা 'holiday' হিসেবে save করে।
     * প্রতিটি তারিখে API.Attendance.save call করে।
     */
    markRange(from_date, to_date, note) {
      const d1 = new Date(from_date + 'T12:00:00');
      const d2 = new Date(to_date + 'T12:00:00');
      if (isNaN(d1) || isNaN(d2) || d1 > d2) return 0;
      const students = Students.getAll().filter(s => s.active);
      let days = 0;
      for (let d = new Date(d1); d <= d2; d.setDate(d.getDate() + 1)) {
        const iso = d.toISOString().split('T')[0];
        students.forEach(s => Attendance.save(s.id, iso, 'holiday'));
        days++;
      }
      const list = load(KEYS.holidays);
      list.push({ id: uid(), from_date, to_date, note: note || '', created_at: now() });
      save(KEYS.holidays, list);
      return days;
    },
    isHoliday(date) {
      return load(KEYS.holidays).some(h => date >= h.from_date && date <= h.to_date);
    },
    remove(id) {
      save(KEYS.holidays, load(KEYS.holidays).filter(h => h.id !== id));
    },
  };

  /** পুরনো ডেটায় মক্তব বর্ষের নাম: মক্তব ১ম → প্রথম শ্রেণি ইত্যাদি (কাস্টম নাম স্পর্শ করে না) */
  function migrateMaktabClassNames() {
    const nextName = {
      cls_m1: 'প্রথম শ্রেণি',
      cls_m2: 'দ্বিতীয় শ্রেণি',
      cls_m3: 'তৃতীয় শ্রেণি',
      cls_m4: 'চতুর্থ শ্রেণি',
      cls_m5: 'পঞ্চম শ্রেণি',
    };
    const oldName = {
      cls_m1: 'মক্তব ১ম',
      cls_m2: 'মক্তব ২য়',
      cls_m3: 'মক্তব ৩য়',
      cls_m4: 'মক্তব ৪র্থ',
      cls_m5: 'মক্তব ৫ম',
    };
    const list = load(KEYS.classes);
    let changed = false;
    const next = list.map((c) => {
      const nn = nextName[c.id];
      const on = oldName[c.id];
      if (!nn || !on) return c;
      if (c.name === nn) return c;
      if (c.name !== on) return c;
      changed = true;
      return { ...c, name: nn };
    });
    if (changed) save(KEYS.classes, next);
  }

  const OldMadrasaImport = {
    summarize(pack) {
      const data = pack || {};
      return {
        classes: Array.isArray(data.classes) ? data.classes.length : 0,
        students: Array.isArray(data.students) ? data.students.length : 0,
        kitabs: Array.isArray(data.kitabs) ? data.kitabs.length : 0,
      };
    },
    replaceCoreData(pack) {
      if (!pack || !Array.isArray(pack.classes) || !Array.isArray(pack.students) || !Array.isArray(pack.kitabs)) {
        throw new Error('invalid import pack');
      }
      save(KEYS.classes, pack.classes);
      save(KEYS.students, pack.students);
      save(KEYS.kitabs, pack.kitabs);
      save(KEYS.kitab_prog, Array.isArray(pack.kitab_progress) ? pack.kitab_progress : []);
      [KEYS.attendance, KEYS.khuluk, KEYS.logs, KEYS.fees, KEYS.exams, KEYS.results].forEach((key) => save(key, []));
      localStorage.removeItem('mm_withdrawals');
      return this.summarize(pack);
    },
  };

  /* ── INIT ── */
  seedIfEmpty();
  purgeKnownSampleData();
  migrateAttendanceStatus();
  migrateMaktabClassNames();
  Sessions.ensureInitialized();

  /* ── PUBLIC API ── */
  return {
    Students, Classes, Teachers, Attendance, KitabProgress, Khuluk, Logs, Fees, Exams,
    Settings, Sessions, Holidays,
    OldMadrasaImport,
    persistLoadArr, persistSaveArr,
    uid, today, now, esc,
  };

})();

if (typeof globalThis !== 'undefined' && typeof API !== 'undefined') {
  globalThis.API = API;
}
