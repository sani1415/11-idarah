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

    /* ── MIGRATION: seed exams if empty ── */
    if (!load(KEYS.exams).length && load(KEYS.students).length) {
      save(KEYS.exams, [{ id:'exam_1', class_id:'cls_k3', name:'ষান্মাসিক পরীক্ষা ১৪৪৭', type:'half_yearly',
        subjects:[{name:'নাহু',max:100},{name:'ফিকহ',max:100},{name:'উসুল',max:100}], created:'2026-01-15' }]);
      save(KEYS.results, [
        { id:'r1', exam_id:'exam_1', student_id:'std_1', subjects:[{name:'নাহু',max:100,marks:82},{name:'ফিকহ',max:100,marks:75},{name:'উসুল',max:100,marks:68}], total:225, max_total:300, percentage:75, grade:'جيد', date:'2026-01-20' },
        { id:'r2', exam_id:'exam_1', student_id:'std_2', subjects:[{name:'নাহু',max:100,marks:92},{name:'ফিকহ',max:100,marks:88},{name:'উসুল',max:100,marks:85}], total:265, max_total:300, percentage:88.3, grade:'جيد جداً', date:'2026-01-20' },
        { id:'r3', exam_id:'exam_1', student_id:'std_3', subjects:[{name:'নাহু',max:100,marks:95},{name:'ফিকহ',max:100,marks:91},{name:'উসুল',max:100,marks:93}], total:279, max_total:300, percentage:93, grade:'ممتاز', date:'2026-01-20' },
        { id:'r4', exam_id:'exam_1', student_id:'std_4', subjects:[{name:'নাহু',max:100,marks:55},{name:'ফিকহ',max:100,marks:62},{name:'উসুল',max:100,marks:48}], total:165, max_total:300, percentage:55, grade:'راسب', date:'2026-01-20' },
      ]);
    }

    /* ── MIGRATION: add teachers missing from initial seed ── */
    const existingTeachers = load(KEYS.teachers);
    if (existingTeachers.length && !existingTeachers.find(t => t.id === 'tch_5')) {
      const migrTeachers = [
        { id: 'tch_5',      name: 'উস্তায উমর',             class_id: 'cls_k4', pin: '0000' },
        { id: 'tch_6',      name: 'উস্তায হাসান',            class_id: 'cls_k5', pin: '0000' },
        { id: 'tch_7',      name: 'উস্তায হুসাইন',           class_id: 'cls_k6', pin: '0000' },
        { id: 'tch_8',      name: 'উস্তায খালিদ',            class_id: 'cls_k7', pin: '0000' },
        { id: 'tch_9',      name: 'উস্তায বিলাল',            class_id: 'cls_k8', pin: '0000' },
        { id: 'tch_10',     name: 'উস্তায আনাস',             class_id: 'cls_m1', pin: '0000' },
        { id: 'tch_11',     name: 'উস্তায মুআয',             class_id: 'cls_m2', pin: '0000' },
        { id: 'tch_12',     name: 'উস্তায সালমান',           class_id: 'cls_m3', pin: '0000' },
        { id: 'tch_13',     name: 'উস্তায আবু বকর',          class_id: 'cls_m4', pin: '0000' },
        { id: 'tch_14',     name: 'উস্তায উসমান',            class_id: 'cls_m5', pin: '0000' },
        { id: 'usr_hifz',   name: 'হিফজ দায়িত্বশীল',        class_id: null,     pin: '0000', role: 'hifz' },
        { id: 'usr_lib',    name: 'মাকতাবা দায়িত্বশীল',   class_id: null,     pin: '0000', role: 'library' },
        { id: 'usr_alumni', name: 'পুরনো ছাত্র দায়িত্বশীল', class_id: null,     pin: '0000', role: 'alumni' },
      ];
      save(KEYS.teachers, [...existingTeachers, ...migrTeachers]);
    }

    if (load(KEYS.classes).length) return; // already seeded

    /* Classes */
    const classes = [
      { id: 'cls_k1', dept: 'kitab', year: 1, name: '১ম বর্ষ', roll_prefix: '100', teacher_id: 'tch_1' },
      { id: 'cls_ky', dept: 'kitab', year: 'iyada', name: 'ইয়াদা বর্ষ', roll_prefix: 'ই', teacher_id: 'tch_2' },
      { id: 'cls_k2', dept: 'kitab', year: 2, name: '২য় বর্ষ', roll_prefix: '200', teacher_id: 'tch_3' },
      { id: 'cls_k3', dept: 'kitab', year: 3, name: '৩য় বর্ষ', roll_prefix: '300', teacher_id: 'tch_4' },
      { id: 'cls_k4', dept: 'kitab', year: 4, name: '৪র্থ বর্ষ', roll_prefix: '400', teacher_id: 'tch_5' },
      { id: 'cls_k5', dept: 'kitab', year: 5, name: '৫ম বর্ষ', roll_prefix: '500', teacher_id: 'tch_6' },
      { id: 'cls_k6', dept: 'kitab', year: 6, name: '৬ষ্ঠ বর্ষ', roll_prefix: '600', teacher_id: 'tch_7' },
      { id: 'cls_k7', dept: 'kitab', year: 7, name: '৭ম বর্ষ', roll_prefix: '700', teacher_id: 'tch_8' },
      { id: 'cls_k8', dept: 'kitab', year: 8, name: '৮ম বর্ষ', roll_prefix: '800', teacher_id: 'tch_9' },
      { id: 'cls_m1', dept: 'maktab', year: 1, name: 'প্রথম শ্রেণি', roll_prefix: 'ম১', teacher_id: 'tch_10' },
      { id: 'cls_m2', dept: 'maktab', year: 2, name: 'দ্বিতীয় শ্রেণি', roll_prefix: 'ম২', teacher_id: 'tch_11' },
      { id: 'cls_m3', dept: 'maktab', year: 3, name: 'তৃতীয় শ্রেণি', roll_prefix: 'ম৩', teacher_id: 'tch_12' },
      { id: 'cls_m4', dept: 'maktab', year: 4, name: 'চতুর্থ শ্রেণি', roll_prefix: 'ম৪', teacher_id: 'tch_13' },
      { id: 'cls_m5', dept: 'maktab', year: 5, name: 'পঞ্চম শ্রেণি', roll_prefix: 'ম৫', teacher_id: 'tch_14' },
    ];
    save(KEYS.classes, classes);

    /* Teachers */
    const teachers = [
      { id: 'tch_1',      name: 'উস্তায মুহাম্মাদ',       class_id: 'cls_k1', pin: '0000' },
      { id: 'tch_2',      name: 'উস্তায ইবরাহীম',         class_id: 'cls_ky', pin: '0000' },
      { id: 'tch_3',      name: 'উস্তায আব্দুল্লাহ',      class_id: 'cls_k2', pin: '0000' },
      { id: 'tch_4',      name: 'উস্তায ইউসুফ',           class_id: 'cls_k3', pin: '0000' },
      { id: 'tch_5',      name: 'উস্তায উমর',             class_id: 'cls_k4', pin: '0000' },
      { id: 'tch_6',      name: 'উস্তায হাসান',           class_id: 'cls_k5', pin: '0000' },
      { id: 'tch_7',      name: 'উস্তায হুসাইন',          class_id: 'cls_k6', pin: '0000' },
      { id: 'tch_8',      name: 'উস্তায খালিদ',           class_id: 'cls_k7', pin: '0000' },
      { id: 'tch_9',      name: 'উস্তায বিলাল',           class_id: 'cls_k8', pin: '0000' },
      { id: 'tch_10',     name: 'উস্তায আনাস',            class_id: 'cls_m1', pin: '0000' },
      { id: 'tch_11',     name: 'উস্তায মুআয',            class_id: 'cls_m2', pin: '0000' },
      { id: 'tch_12',     name: 'উস্তায সালমান',          class_id: 'cls_m3', pin: '0000' },
      { id: 'tch_13',     name: 'উস্তায আবু বকর',         class_id: 'cls_m4', pin: '0000' },
      { id: 'tch_14',     name: 'উস্তায উসমান',           class_id: 'cls_m5', pin: '0000' },
      { id: 'daftar',     name: 'দফতর দায়িত্বশীল',       class_id: null,     pin: '0000', role: 'daftar' },
      { id: 'usr_hifz',   name: 'হিফজ দায়িত্বশীল',       class_id: null,     pin: '0000', role: 'hifz' },
      { id: 'usr_lib',    name: 'মাকতাবা দায়িত্বশীল',  class_id: null,     pin: '0000', role: 'library' },
      { id: 'usr_alumni',   name: 'পুরনো ছাত্র দায়িত্বশীল', class_id: null,  pin: '0000', role: 'alumni'   },
      { id: 'usr_khedmat', name: 'খেদমত দায়িত্বশীল',       class_id: null,  pin: '0000', role: 'khedmat'  },
    ];
    save(KEYS.teachers, teachers);

    /* Students */
    const students = [
      { id: 'std_1', permanent_id: '৪৭০০১', name: 'মুহাম্মাদ আলী', class_id: 'cls_k3', roll: '৩০১', guardian: 'আলী হোসেন', guardian_job: 'কৃষক', phone: '০১৭১১-১১১১১১', address: 'উত্তর পাড়া', admitted: '১৪৪৭', active: true, hifz: false },
      { id: 'std_2', permanent_id: '৪৭০০২', name: 'আব্দুল কাদের',  class_id: 'cls_k3', roll: '৩০২', guardian: 'কাদের মিয়া',  guardian_job: 'ব্যবসায়ী', phone: '০১৮২২-২২২২২২', address: 'দক্ষিণ পাড়া', admitted: '১৪৪৭', active: true, hifz: true, special_watch: true },
      { id: 'std_3', permanent_id: '৪৭০০৩', name: 'ইউসুফ আহমাদ',  class_id: 'cls_k3', roll: '৩০৩', guardian: 'আহমাদ উল্লাহ', guardian_job: 'শিক্ষক', phone: '০১৯৩৩-৩৩৩৩৩৩', address: 'পূর্ব পাড়া', admitted: '১৪৪৭', active: true, hifz: false },
      { id: 'std_4', permanent_id: '৪৭০০৪', name: 'উমর ফারুক',    class_id: 'cls_k3', roll: '৩০৪', guardian: 'ফারুক আহমেদ',  guardian_job: 'চাকরিজীবী', phone: '০১৬৪৪-৪৪৪৪৪৪', address: 'পশ্চিম পাড়া', admitted: '১৪৪৭', active: true, hifz: true, special_watch: true },
      { id: 'std_5', permanent_id: '৪৬০০১', name: 'আব্দুর রহমান', class_id: 'cls_k2', roll: '২০১', guardian: 'রহমান মিয়া',  guardian_job: 'কৃষক', phone: '০১৫৫৫-৫৫৫৫৫৫', address: 'উত্তর পাড়া', admitted: '১৪৪৬', active: true, hifz: false },
      { id: 'std_6', permanent_id: '৪৬০০২', name: 'হাসান মাহমুদ', class_id: 'cls_k2', roll: '২০২', guardian: 'মাহমুদ আলী',  guardian_job: 'ব্যবসায়ী', phone: '০১৬৬৬-৬৬৬৬৬৬', address: 'দক্ষিণ পাড়া', admitted: '১৪৪৬', active: true, hifz: false },
    ];
    save(KEYS.students, students);

    /* Kitabs */
    const kitabs = [
      { id: 'ktb_1', name: 'হেদায়াতুন নাহু', class_id: 'cls_k3', total_pages: 120 },
      { id: 'ktb_2', name: 'নূরুল ইযাহ',     class_id: 'cls_k3', total_pages: 200 },
      { id: 'ktb_3', name: 'মিশকাতুল মাসাবিহ', class_id: 'cls_k3', total_pages: 600 },
      { id: 'ktb_4', name: 'আল-হেদায়া',      class_id: 'cls_k2', total_pages: 400 },
    ];
    save(KEYS.kitabs, kitabs);

    /* Kitab Progress */
    const kprog = [
      { id: uid(), kitab_id: 'ktb_1', class_id: 'cls_k3', date: today(), pages_done: 45, note: '' },
      { id: uid(), kitab_id: 'ktb_2', class_id: 'cls_k3', date: today(), pages_done: 32, note: '' },
      { id: uid(), kitab_id: 'ktb_3', class_id: 'cls_k3', date: today(), pages_done: 180, note: '' },
    ];
    save(KEYS.kitab_prog, kprog);

    /* Khuluk scores */
    const khuluk = [
      { id: uid(), student_id: 'std_1', score: 75, reason: 'সাধারণভাবে ভালো আচরণ', date: '2025-01-15', by: 'উস্তায ইউসুফ' },
      { id: uid(), student_id: 'std_1', score: 80, reason: 'উল্লেখযোগ্য উন্নতি দেখা গেছে', date: '2025-03-01', by: 'উস্তায ইউসুফ' },
      { id: uid(), student_id: 'std_2', score: 65, reason: 'নামাজে মাঝেমধ্যে অমনোযোগী', date: '2025-01-15', by: 'উস্তায ইউসুফ' },
      { id: uid(), student_id: 'std_3', score: 90, reason: 'অত্যন্ত আদবের সাথে চলে', date: '2025-01-15', by: 'উস্তায ইউসুফ' },
      { id: uid(), student_id: 'std_4', score: 55, reason: 'সাথীদের সাথে বিবাদে জড়িয়েছে', date: '2025-03-10', by: 'উস্তায ইউসুফ' },
    ];
    save(KEYS.khuluk, khuluk);

    /* Attendance — today */
    const att = [
      { id: uid(), student_id: 'std_1', date: today(), status: 'present' },
      { id: uid(), student_id: 'std_2', date: today(), status: 'present' },
      { id: uid(), student_id: 'std_3', date: today(), status: 'absent' },
      { id: uid(), student_id: 'std_4', date: today(), status: 'present' },
      { id: uid(), student_id: 'std_5', date: today(), status: 'present' },
      { id: uid(), student_id: 'std_6', date: today(), status: 'present' },
    ];
    save(KEYS.attendance, att);

    /* Logs */
    const logs = [
      { id: uid(), type: 'class', ref_id: 'cls_k3', text: 'আজ হেদায়াতুন নাহুর ৪৫ পৃষ্ঠা পর্যন্ত পড়ানো হয়েছে। ছাত্রদের মনোযোগ ভালো ছিল।', date: today(), by: 'উস্তায ইউসুফ' },
      { id: uid(), type: 'student', ref_id: 'std_1', text: 'আজ মুহাম্মাদ আলী বিশেষ মনোযোগ দিয়ে পড়েছে। উন্নতি লক্ষ্যণীয়।', date: today(), by: 'উস্তায ইউসুফ' },
    ];
    save(KEYS.logs, logs);

    /* Fees summary */
    const fees = [
      { id: uid(), month: '2025-04', class_id: 'cls_k3', total: 4, paid: 3, unpaid: 1, arrear: 500, late_payers: ['std_4'], note: '', date: today() },
    ];
    save(KEYS.fees, fees);
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
    getByStudentDate: (sid, date) => load(KEYS.attendance).find(a => a.student_id === sid && a.date === date),
    getByClassDate(cid, date) {
      const sids = Students.getByClass(cid).map(s => s.id);
      return load(KEYS.attendance).filter(a => a.date === date && sids.includes(a.student_id));
    },
    save(student_id, date, statusIn) {
      let status;
      if (statusIn === true || statusIn === 'present') status = 'present';
      else if (statusIn === false || statusIn === 'absent') status = 'absent';
      else if (statusIn === 'leave') status = 'leave';
      else status = 'absent';
      const list = load(KEYS.attendance);
      const idx = list.findIndex(a => a.student_id === student_id && a.date === date);
      const row = { id: idx >= 0 ? list[idx].id : uid(), student_id, date, status };
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
    }
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
    get: () => loadObj(KEYS.settings, { institution: 'মাদরাসাতুল মদীনা', hijri_year: '১৪৪৭', admin_pin: '0000' }),
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
