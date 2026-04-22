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

  /* ══════════════════════════════
     SEED DATA — প্রথম লোডে নমুনা ডেটা
     ══════════════════════════════ */
  function seedIfEmpty() {
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

    /* ── MIGRATION: exam — ডেটা: js/mm-sample-data.js ── */
    if (!load(KEYS.exams).length && load(KEYS.students).length) {
      const M = globalThis.MMSampleData && globalThis.MMSampleData.getLegacyExamsForMigration
        ? globalThis.MMSampleData.getLegacyExamsForMigration()
        : null;
      if (M) {
        save(KEYS.exams, M.exams);
        save(KEYS.results, M.results);
      }
    }

    /* ── MIGRATION: পুরনো সিডে অতিরিক্ত শিক্ষক — ডেটা: js/mm-sample-data.js ── */
    const existingTeachers = load(KEYS.teachers);
    if (existingTeachers.length && !existingTeachers.find(t => t.id === 'tch_5')) {
      const extraT = globalThis.MMSampleData && globalThis.MMSampleData.getLegacyExtraTeachers
        ? globalThis.MMSampleData.getLegacyExtraTeachers()
        : [];
      if (extraT.length) save(KEYS.teachers, [...existingTeachers, ...extraT]);
    }

    if (load(KEYS.classes).length) return;

    const buildM = globalThis.MMSampleData && globalThis.MMSampleData.buildMadrasaSample;
    if (!buildM) {
      console.warn('[MMSampleData] mm-sample-data.js api.js-এর আগে লোড করুন।');
      return;
    }
    const pack = buildM(today());
    if (!pack || !pack.mm_classes || !pack.mm_classes.length) return;
    Object.keys(pack).forEach((k) => {
      try {
        localStorage.setItem(k, JSON.stringify(pack[k]));
      } catch (e) {
        console.warn('seed ' + k, e);
      }
    });
  }

  /* ══════════════════════════════
     STUDENTS
     ══════════════════════════════ */
  const Students = {
    getAll: () => load(KEYS.students),
    getById: id => load(KEYS.students).find(s => s.id === id),
    getByClass: cid => load(KEYS.students).filter(s => s.class_id === cid && s.active),
    /** কিতাব বা মক্তব বিভাগের সক্রিয় ছাত্র সংখ্যা */
    countActiveByDept(dept) {
      const cids = new Set(load(KEYS.classes).filter((c) => c.dept === dept).map((c) => c.id));
      return load(KEYS.students).filter((s) => s.active && cids.has(s.class_id)).length;
    },
    add(data) {
      const list = load(KEYS.students);
      const s = { id: 'std_' + uid(), ...data, active: true, admitted: data.admitted || today() };
      list.push(s);
      save(KEYS.students, list);
      return s;
    },
    update(id, data) {
      const list = load(KEYS.students).map(s => s.id === id ? { ...s, ...data } : s);
      save(KEYS.students, list);
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
    getNextPermanentId(dept, hijriYear) {
      const prefix = dept === 'maktab' ? 'ম' : '';
      const yr = String(hijriYear).slice(-2);
      const existing = load(KEYS.students)
        .map(s => s.permanent_id)
        .filter(pid => pid && pid.startsWith(prefix + yr))
        .map(pid => parseInt(pid.slice((prefix + yr).length)) || 0);
      const next = existing.length ? Math.max(...existing) + 1 : 1;
      return prefix + yr + String(next).padStart(3, '0');
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
  };

  /* ══════════════════════════════
     CLASSES
     ══════════════════════════════ */
  const Classes = {
    getAll: () => load(KEYS.classes),
    getById: id => load(KEYS.classes).find(c => c.id === id),
    getByDept: dept => load(KEYS.classes).filter(c => c.dept === dept),
    getName: id => { const c = load(KEYS.classes).find(c => c.id === id); return c ? c.name : '—'; },
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
     ══════════════════════════════ */
  const Attendance = {
    statusOf(a) {
      if (!a) return 'present';
      if (a.status === 'present' || a.status === 'absent' || a.status === 'leave') return a.status;
      return a.present ? 'present' : 'absent';
    },
    getByDate: date => load(KEYS.attendance).filter(a => a.date === date),
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
     * @param statusIn 'present' | 'absent' | 'leave' | boolean (legacy)
     * @param absentReason শুধু status absent হলে — অনুপস্থিতির কারণ
     */
    save(student_id, date, statusIn, absentReason) {
      let status;
      if (statusIn === true || statusIn === 'present') status = 'present';
      else if (statusIn === false || statusIn === 'absent') status = 'absent';
      else if (statusIn === 'leave') status = 'leave';
      else status = 'absent';
      const list = load(KEYS.attendance);
      const idx = list.findIndex(a => a.student_id === student_id && a.date === date);
      const prev = idx >= 0 ? list[idx] : null;
      const id = prev ? prev.id : uid();
      const reasonIn =
        typeof absentReason === 'string' ? absentReason.trim() : (prev && prev.absent_reason) ? String(prev.absent_reason).trim() : '';
      const row = { id, student_id, date, status };
      if (status === 'absent') row.absent_reason = reasonIn;
      if (idx >= 0) list[idx] = row;
      else list.push(row);
      save(KEYS.attendance, list);
    },
    getSummary(cid, month) {
      const sids = Students.getByClass(cid).map(s => s.id);
      const records = load(KEYS.attendance).filter(a => sids.includes(a.student_id) && a.date.startsWith(month));
      const total = records.length;
      const present = records.filter(a => this.statusOf(a) === 'present').length;
      const absent = records.filter(a => this.statusOf(a) === 'absent').length;
      const leave = records.filter(a => this.statusOf(a) === 'leave').length;
      return { total, present, absent, leave, pct: total ? Math.round(present / total * 100) : 0 };
    },
    getTodaySummary() {
      return this.getDateSummary(today());
    },
    getDateSummary(date) {
      const all = load(KEYS.attendance).filter(a => a.date === date);
      const st = a => this.statusOf(a);
      return {
        present: all.filter(a => st(a) === 'present').length,
        absent: all.filter(a => st(a) === 'absent').length,
        leave: all.filter(a => st(a) === 'leave').length,
        total: all.length,
      };
    },
    /** ছাত্র প্রতি মোট ছুটির দিন (স্ট্যাটাস leave) */
    getLeaveStatsByStudent() {
      const byStudent = {};
      load(KEYS.attendance).forEach(a => {
        if (this.statusOf(a) !== 'leave') return;
        byStudent[a.student_id] = (byStudent[a.student_id] || 0) + 1;
      });
      return byStudent;
    },
    /** যে ছাত্রদের কমপক্ষে এক দিন ছুটির রেকর্ড আছে — ছুটির দিন বেশি থেকে কম */
    getStudentsWithLeaveSorted() {
      const by = this.getLeaveStatsByStudent();
      return Students.getAll()
        .filter(s => s.active)
        .map(s => ({ student: s, leaveDays: by[s.id] || 0 }))
        .filter(x => x.leaveDays > 0)
        .sort((a, b) => b.leaveDays - a.leaveDays);
    },
    countStudentsWithAnyLeave() {
      return this.getStudentsWithLeaveSorted().length;
    },
    getDateSummaryForDept(date, dept) {
      if (dept !== 'kitab' && dept !== 'maktab') return this.getDateSummary(date);
      const cids = new Set(Classes.getByDept(dept).map(c => c.id));
      const sidSet = new Set(
        Students.getAll().filter(s => s.active && cids.has(s.class_id)).map(s => s.id)
      );
      const all = load(KEYS.attendance).filter(a => a.date === date && sidSet.has(a.student_id));
      const st = (a) => this.statusOf(a);
      return {
        present: all.filter((a) => st(a) === 'present').length,
        absent: all.filter((a) => st(a) === 'absent').length,
        leave: all.filter((a) => st(a) === 'leave').length,
        total: all.length,
      };
    },
    getStudentsWithLeaveSortedByDept(dept) {
      if (dept !== 'kitab' && dept !== 'maktab') return this.getStudentsWithLeaveSorted();
      const cids = new Set(Classes.getByDept(dept).map((c) => c.id));
      const by = this.getLeaveStatsByStudent();
      return Students.getAll()
        .filter((s) => s.active && cids.has(s.class_id))
        .map((s) => ({ student: s, leaveDays: by[s.id] || 0 }))
        .filter((x) => x.leaveDays > 0)
        .sort((a, b) => b.leaveDays - a.leaveDays);
    },
    countStudentsWithAnyLeaveByDept(dept) {
      return this.getStudentsWithLeaveSortedByDept(dept).length;
    },
    /** ছাত্র প্রতি মোট অনুপস্থিত দিন (স্ট্যাটাস absent) */
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
    getClassAvg(cid) {
      const sids = Students.getByClass(cid).map(s => s.id);
      const scores = sids.map(sid => { const k = Khuluk.getLatest(sid); return k ? k.score : null; }).filter(s => s !== null);
      return scores.length ? Math.round(scores.reduce((a,b) => a+b, 0) / scores.length) : null;
    },
    /** সর্বশেষ স্কোর: ৮০+ মুজতাহিদ, ৬০–৮০ মুতাওয়াস্সিত, ৬০-এর নিচে মুসতায়িদ, রেকর্ড ছাড়া আলাদা */
    getClassKhulukBands(cid) {
      const sids = Students.getByClass(cid).map(s => s.id);
      const out = { high: 0, mid: 0, low: 0, none: 0, total: sids.length };
      sids.forEach((sid) => {
        const k = Khuluk.getLatest(sid);
        if (!k) { out.none++; return; }
        if (k.score > 80) out.high++;
        else if (k.score >= 60) out.mid++;
        else out.low++;
      });
      return out;
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
    if (!list.some(a => a.present !== undefined && !a.status)) return;
    save(KEYS.attendance, list.map(a => {
      if (a.status) return a;
      const status = a.present ? 'present' : 'absent';
      const { present, ...rest } = a;
      return { ...rest, status };
    }));
  }

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

  /* ── INIT ── */
  seedIfEmpty();
  migrateAttendanceStatus();
  migrateMaktabClassNames();

  /* ── PUBLIC API ── */
  return {
    Students, Classes, Teachers, Attendance, KitabProgress, Khuluk, Logs, Fees, Exams, Settings,
    persistLoadArr, persistSaveArr,
    uid, today, now, esc,
  };

})();

if (typeof globalThis !== 'undefined' && typeof API !== 'undefined') {
  globalThis.API = API;
}
