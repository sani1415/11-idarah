/* ═══════════════════════════════════════════════════════════
   mm-sample-data.js
   সব নমুনা / প্রথম-সিড ডেটা শুধু এখানে — অন্য কোনো জায়গায়
   হার্ডকোড নমুনা নেই (api, khedmat-api, dept-api, chat-api শুধু পড়ে)।
   লোড: <script src=".../mm-sample-data.js"></script> <script src=".../api.js">
   ═══════════════════════════════════════════════════════════ */
(function (g) {
  'use strict';

  const defaultSettings = {
    institution: 'মাদরাসাতুল মদীনা',
    hijri_year: '১৪৪৭',
    admin_pin: '0000',
  };

  function padAttendanceExtra(today, base) {
    const out = base.slice();
    const t = new Date(today + 'T12:00:00');
    let n = 0;
    let na = 0;
    for (let i = 1; i <= 14; i++) {
      const d = new Date(t);
      d.setDate(d.getDate() - i);
      const date = d.toISOString().slice(0, 10);
      if (i % 2 === 0) out.push({ id: 'mm_ex_lv_' + ++n, student_id: 'std_1', date, status: 'leave' });
      if (i % 3 === 0) out.push({ id: 'mm_ex_lv_' + ++n, student_id: 'std_2', date, status: 'leave' });
      if (i % 4 === 0) out.push({ id: 'mm_ex_lv_' + ++n, student_id: 'std_4', date, status: 'leave' });
      if (i % 5 === 0) out.push({ id: 'mm_ex_lv_' + ++n, student_id: 'std_3', date, status: 'leave' });
    }
    for (let i = 1; i <= 14; i++) {
      const d = new Date(t);
      d.setDate(d.getDate() - i);
      const date = d.toISOString().slice(0, 10);
      if (i % 2 === 0) out.push({ id: 'mm_ex_ab_' + ++na, student_id: 'std_3', date, status: 'absent' });
      else if (i % 3 === 0) out.push({ id: 'mm_ex_ab_' + ++na, student_id: 'std_2', date, status: 'absent' });
      else if (i % 5 === 0) out.push({ id: 'mm_ex_ab_' + ++na, student_id: 'std_4', date, status: 'absent' });
    }
    return out;
  }

  function getLegacyExamsForMigration() {
    return {
      exams: [
        {
          id: 'exam_1',
          class_id: 'cls_k3',
          name: 'ষান্মাসিক পরীক্ষা ১৪৪৭',
          type: 'half_yearly',
          subjects: [
            { name: 'নাহু', max: 100 },
            { name: 'ফিকহ', max: 100 },
            { name: 'উসুল', max: 100 },
          ],
          created: '2026-01-15',
        },
        {
          id: 'exam_2',
          class_id: 'cls_m1',
          name: 'বার্ষিক মূল্যায়ন ১৪৪৭ (মক্তব ১ম)',
          type: 'annual',
          subjects: [
            { name: 'নূরানী', max: 50 },
            { name: 'আখলাক', max: 50 },
          ],
          created: '2026-01-10',
        },
        {
          id: 'exam_3',
          class_id: 'cls_k4',
          name: 'অর্ধবার্ষিক ১৪৪৭ (৪র্থ কিতাব)',
          type: 'half_yearly',
          subjects: [
            { name: 'ফিকহ', max: 50 },
            { name: 'হাদীস', max: 50 },
          ],
          created: '2026-01-12',
        },
      ],
      results: [
        { id: 'r1', exam_id: 'exam_1', student_id: 'std_1', subjects: [{ name: 'নাহু', max: 100, marks: 82 }, { name: 'ফিকহ', max: 100, marks: 75 }, { name: 'উসুল', max: 100, marks: 68 }], total: 225, max_total: 300, percentage: 75, grade: 'جيد', date: '2026-01-20' },
        { id: 'r2', exam_id: 'exam_1', student_id: 'std_2', subjects: [{ name: 'নাহু', max: 100, marks: 92 }, { name: 'ফিকহ', max: 100, marks: 88 }, { name: 'উসুল', max: 100, marks: 85 }], total: 265, max_total: 300, percentage: 88.3, grade: 'جيد جداً', date: '2026-01-20' },
        { id: 'r3', exam_id: 'exam_1', student_id: 'std_3', subjects: [{ name: 'নাহু', max: 100, marks: 95 }, { name: 'ফিকহ', max: 100, marks: 91 }, { name: 'উসুল', max: 100, marks: 93 }], total: 279, max_total: 300, percentage: 93, grade: 'ممتاز', date: '2026-01-20' },
        { id: 'r4', exam_id: 'exam_1', student_id: 'std_4', subjects: [{ name: 'নাহу', max: 100, marks: 55 }, { name: 'ফিকহ', max: 100, marks: 62 }, { name: 'উসুল', max: 100, marks: 48 }], total: 165, max_total: 300, percentage: 55, grade: 'راسب', date: '2026-01-20' },
        { id: 'r5', exam_id: 'exam_1', student_id: 'std_9', subjects: [{ name: 'নাহু', max: 100, marks: 70 }, { name: 'ফিকহ', max: 100, marks: 65 }, { name: 'উসুল', max: 100, marks: 72 }], total: 207, max_total: 300, percentage: 69, grade: 'جيد', date: '2026-01-20' },
        { id: 'r6', exam_id: 'exam_2', student_id: 'std_22', subjects: [{ name: 'নূরানী', max: 50, marks: 44 }, { name: 'আখলাক', max: 50, marks: 46 }], total: 90, max_total: 100, percentage: 90, grade: 'ممتاز', date: '2026-01-15' },
        { id: 'r7', exam_id: 'exam_2', student_id: 'std_23', subjects: [{ name: 'নূরানী', max: 50, marks: 38 }, { name: 'আখলাক', max: 50, marks: 40 }], total: 78, max_total: 100, percentage: 78, grade: 'جيد جداً', date: '2026-01-15' },
        { id: 'r8', exam_id: 'exam_3', student_id: 'std_12', subjects: [{ name: 'ফিকহ', max: 50, marks: 40 }, { name: 'হাদীস', max: 50, marks: 42 }], total: 82, max_total: 100, percentage: 82, grade: 'جيد جداً', date: '2026-01-18' },
        { id: 'r9', exam_id: 'exam_3', student_id: 'std_13', subjects: [{ name: 'ফিকহ', max: 50, marks: 35 }, { name: 'হাদীস', max: 50, marks: 36 }], total: 71, max_total: 100, percentage: 71, grade: 'جيد', date: '2026-01-18' },
      ],
    };
  }

  function getLegacyExtraTeachers() {
    return [
      { id: 'tch_5', name: 'উস্তায উমর', class_id: 'cls_k4', pin: '0000' },
      { id: 'tch_6', name: 'উস্তায হাসান', class_id: 'cls_k5', pin: '0000' },
      { id: 'tch_7', name: 'উস্তায হুসাইন', class_id: 'cls_k6', pin: '0000' },
      { id: 'tch_8', name: 'উস্তায খালিদ', class_id: 'cls_k7', pin: '0000' },
      { id: 'tch_9', name: 'উস্তায বিলাল', class_id: 'cls_k8', pin: '0000' },
      { id: 'tch_10', name: 'উস্তায আনাস', class_id: 'cls_m1', pin: '0000' },
      { id: 'tch_11', name: 'উস্তায মুআয', class_id: 'cls_m2', pin: '0000' },
      { id: 'tch_12', name: 'উস্তায সালমান', class_id: 'cls_m3', pin: '0000' },
      { id: 'tch_13', name: 'উস্তায আবু বকর', class_id: 'cls_m4', pin: '0000' },
      { id: 'tch_14', name: 'উস্তায উসমান', class_id: 'cls_m5', pin: '0000' },
      { id: 'usr_hifz', name: 'হিফজ দায়িত্বশীল', class_id: null, pin: '0000', role: 'hifz' },
      { id: 'usr_lib', name: 'মাকতাবা দায়িত্বশীল', class_id: null, pin: '0000', role: 'library' },
      { id: 'usr_alumni', name: 'পুরনো ছাত্র দায়িত্বশীল', class_id: null, pin: '0000', role: 'alumni' },
    ];
  }

  function buildMadrasaSample(today) {
    const L = getLegacyExamsForMigration();
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
    const teacherProfile = (name, add, ph, sal, note) => ({
      father_name: name.replace(/^উস্তায /, 'মৌলানা ') + ' (পিতা)',
      address: add,
      phone: ph,
      salary: sal,
      admin_note: note,
      salary_history: [{ date: '2025-01-01', amount: Math.round(sal * 0.9), note: 'পূর্ববর্তী স্কেল' }, { date: '2025-04-01', amount: sal, note: 'বর্তমান মাসিক' }],
    });
    const teachers = [
      { id: 'tch_1', name: 'উস্তায মুহাম্মাদ', class_id: 'cls_k1', pin: '0000', father_name: 'হাবিবুর রহমান', address: 'বয়ালী মুখর, মাদরাসা সড়ক', phone: '০১৭১১-১১১১১১', salary: 28000, admin_note: 'নিয়মিত মেধাবী। তাদরীব সপ্তাহে উপস্থিত থাকেন।', salary_history: [{ date: '2025-01-01', amount: 24000, note: 'নতুন বছর নিয়মিত বৃদ্ধি' }, { date: '2025-04-01', amount: 28000, note: 'মাসিক ওয়াযিফা স্কেল' }], mm_ex_teacher_patch: true },
      { id: 'tch_2', name: 'উস্তায ইবরাহীম', class_id: 'cls_ky', pin: '0000', ...teacherProfile('উস্তায ইবরাহীম', 'ইয়াদা কক্ষ সংলগ্ন', '০১৭১২-২২২২২২', 24500, 'ইয়াদা বর্ষ—আরবি ঠিকঠাক মনোযোগ।') },
      { id: 'tch_3', name: 'উস্তায আব্দুল্লাহ', class_id: 'cls_k2', pin: '0000', ...teacherProfile('উস্তায আব্দুল্লাহ', 'মসজিদ রোড ২', '০১৭১৩-৩৩৩৩৩৩', 25200, 'দ্বিতীয় বর্ষ—আত্তাহিয়্যাহ ভালো পড়াচ্ছেন।') },
      { id: 'tch_4', name: 'উস্তায ইউসুফ', class_id: 'cls_k3', pin: '0000', ...teacherProfile('উস্তায ইউসুফ', 'দক্ষিণ পাড়া', '০১৭১৪-৪৪৪৪৪৪', 26500, 'তৃতীয় বর্ষ—কিতাব অগ্রগতি ঠিকঠাক।') },
      { id: 'tch_5', name: 'উস্তায উমর', class_id: 'cls_k4', pin: '0000', ...teacherProfile('উস্তায উমর', 'হাটের পাড়', '০১৭১৫-৫৫৫৫৫৫', 26800, 'চতুর্থ বর্ষ—হেদায়া ধারাবাহিক।') },
      { id: 'tch_6', name: 'উস্তায হাসান', class_id: 'cls_k5', pin: '0000', ...teacherProfile('উস্তায হাসান', 'রেললাইন পাশ', '০১৭১৬-৬৬৬৬৬৬', 27000, 'পঞ্চম বর্ষ—আকাবির রেওয়ায়েত সন্তোষজনক।') },
      { id: 'tch_7', name: 'উস্তায হুসাইন', class_id: 'cls_k6', pin: '0000', ...teacherProfile('উস্তায হুসাইন', 'বাজার সড়ক ৫', '০১৭১৭-৭৭৭৭৭৭', 27200, 'ষষ্ঠ বর্ষ—তাকরীর ও নসীহা ভালো।') },
      { id: 'tch_8', name: 'উস্তায খালিদ', class_id: 'cls_k7', pin: '0000', ...teacherProfile('উস্তায খালিদ', 'পশ্চিম গ্রাম', '০১৭১৮-৮৮৮৮৮৮', 27500, 'সপ্তম বর্ষ—মিশকাত ধারাবাহিক।') },
      { id: 'tch_9', name: 'উস্তায বিলাল', class_id: 'cls_k8', pin: '0000', ...teacherProfile('উস্তায বিলাল', 'উত্তর বিল', '০১৭১৯-৯৯৯৯৯৯', 27800, 'অষ্টম বর্ষ—দাওরায়ে হাদীস প্রস্তুতি।') },
      { id: 'tch_10', name: 'উস্তায আনাস', class_id: 'cls_m1', pin: '0000', father_name: 'করিম উদ্দিন', address: 'পূর্ব পাড়া', phone: '০১৮২২-২২২২২২', salary: 22000, admin_note: 'মক্তব বিভাগের দায়িত্বে সন্তোষজনক।', salary_history: [{ date: '2025-04-01', amount: 22000, note: 'মক্তব স্কেল' }], mm_ex_teacher_patch: true },
      { id: 'tch_11', name: 'উস্তায মুআয', class_id: 'cls_m2', pin: '0000', ...teacherProfile('উস্তায মুআয', 'মক্তব কমপ্লেক্স', '০১৮২৩-২৩২৩২৩', 22100, 'দ্বিতীয় শ্রেণি—নূরানী ভাল পড়া হচ্ছে।') },
      { id: 'tch_12', name: 'উস্তায সালমান', class_id: 'cls_m3', pin: '0000', ...teacherProfile('উস্তায সালমান', 'মক্তব কমপ্লেক্স', '০১৮২৪-২৪২৪২৪', 22200, 'তৃতীয় শ্রেণি—সাবাক জোরে দিচ্ছে।') },
      { id: 'tch_13', name: 'উস্তায আবু বকর', class_id: 'cls_m4', pin: '0000', ...teacherProfile('উস্তায আবু বকর', 'স্কুল রোড ১', '০১৮২৫-২৫২৫২৫', 22300, 'চতুর্থ শ্রেণি—মেধাবী বেশি।') },
      { id: 'tch_14', name: 'উস্তায উসমান', class_id: 'cls_m5', pin: '0000', ...teacherProfile('উস্তায উসমান', 'স্কুল রোড ২', '০১৮২৬-২৬২৬২৬', 22400, 'পঞ্চম শ্রেণি—পাঠ ঠিকঠাক।') },
      { id: 'daftar', name: 'দফতর দায়িত্বশীল', class_id: null, pin: '0000', role: 'daftar', father_name: '—', address: 'দফতর কক্ষ', phone: '০১৭০০-০০০০০১', salary: 30000, admin_note: 'দৈনন্দিন কাজকর্ম', salary_history: [{ date: '2025-04-01', amount: 30000, note: 'সুপারভাইজরি' }] },
      { id: 'usr_hifz', name: 'হিফজ দায়িত্বশীল', class_id: null, pin: '0000', role: 'hifz', address: 'হিফজ বিভাগ', phone: '০১৭০১-০১০১০১' },
      { id: 'usr_lib', name: 'মাকতাবা দায়িত্বশীল', class_id: null, pin: '0000', role: 'library', address: 'মাকতাবা', phone: '০১৭০২-০২০২০২' },
      { id: 'usr_alumni', name: 'পুরনো ছাত্র দায়িত্বশীল', class_id: null, pin: '0000', role: 'alumni', address: 'অফিস', phone: '০১৭০৩-০৩০৩০৩' },
      { id: 'usr_khedmat', name: 'খেদমত দায়িত্বশীল', class_id: null, pin: '0000', role: 'khedmat', address: 'খেদমত কক্ষ', phone: '০১৭০৪-০৪০৪০৪' },
    ];
    const students = [
      { id: 'std_1', permanent_id: '৪৭০০১', name: 'মুহাম্মাদ আলী', class_id: 'cls_k3', roll: '৩০১', guardian: 'আলী হোসেন', guardian_job: 'কৃষক', phone: '০১৭১১-১১১১১১', address: 'উত্তর পাড়া', admitted: '১৪৪৭', active: true, hifz: false, class_history: [{ from: 'cls_k2', to: 'cls_k3', date: '2025-10-10' }] },
      { id: 'std_2', permanent_id: '৪৭০০২', name: 'আব্দুল কাদের', class_id: 'cls_k3', roll: '৩০২', guardian: 'কাদের মিয়া', guardian_job: 'ব্যবসায়ী', phone: '০১৮২২-২২২২২২', address: 'দক্ষিণ পাড়া', admitted: '১৪৪৭', active: true, hifz: true, special_watch: true },
      { id: 'std_3', permanent_id: '৪৭০০৩', name: 'ইউসুফ আহমাদ', class_id: 'cls_k3', roll: '৩০৩', guardian: 'আহমাদ উল্লাহ', guardian_job: 'শিক্ষক', phone: '০১৯৩৩-৩৩৩৩৩৩', address: 'পূর্ব পাড়া', admitted: '১৪৪৭', active: true, hifz: false },
      { id: 'std_4', permanent_id: '৪৭০০৪', name: 'উমর ফারুক', class_id: 'cls_k3', roll: '৩০৪', guardian: 'ফারুক আহমেদ', guardian_job: 'চাকরিজীবী', phone: '০১৬৪৪-৪৪৪৪৪৪', address: 'পশ্চিম পাড়া', admitted: '১৪৪৭', active: true, hifz: true, special_watch: true },
      { id: 'std_5', permanent_id: '৪৬০০১', name: 'আব্দুর রহমান', class_id: 'cls_k2', roll: '২০১', guardian: 'রহমান মিয়া', guardian_job: 'কৃষক', phone: '০১৫৫৫-৫৫৫৫৫৫', address: 'উত্তর পাড়া', admitted: '১৪৪৬', active: true, hifz: false },
      { id: 'std_6', permanent_id: '৪৬০০২', name: 'হাসান মাহমুদ', class_id: 'cls_k2', roll: '২০২', guardian: 'মাহমুদ আলী', guardian_job: 'ব্যবসায়ী', phone: '০১৬৬৬-৬৬৬৬৬৬', address: 'দক্ষিণ পাড়া', admitted: '১৪৪৬', active: true, hifz: false },
      { id: 'std_7', permanent_id: '৪৫০০১', name: 'জাকারিয়া হোসেন', class_id: 'cls_k1', roll: '১০১', guardian: 'হোসেন আলী', guardian_job: 'দোকানদার', phone: '০১৭৭৭-৭৭৭৭৭৭', address: 'মাঠ পাড়া', admitted: '১৪৪৭', active: true, hifz: false },
      { id: 'std_8', permanent_id: '৪৫০০২', name: 'ইবরাহীম খান', class_id: 'cls_k1', roll: '১০২', guardian: 'খান সাহেব', guardian_job: 'কৃষক', phone: '০১৮৮৮-৮৮৮৮৮৮', address: 'বাজার রোড', admitted: '১৪৪৭', active: true, hifz: false },
      { id: 'std_9', permanent_id: '৪৭০০৫', name: "সা'দ বিন মালিক", class_id: 'cls_k3', roll: '৩০৫', guardian: 'মালিক হোসেন', guardian_job: 'ব্যবসায়ী', phone: '০১৯৯৯-৯৯৯৯৯৯', address: 'নদীর পাড়', admitted: '১৪৪৭', active: true, hifz: false },
      { id: 'std_10', permanent_id: '৪৪১০১', name: 'তামিম আনোয়ার', class_id: 'cls_ky', roll: 'ই১', guardian: 'আনোয়ার হোসেন', guardian_job: 'কৃষক', phone: '০১৭২০-১১১১১১', address: 'ইয়াদা কক্ষ গেট', admitted: '১৪৪৭', active: true, hifz: false },
      { id: 'std_11', permanent_id: '৪৪১০২', name: 'রায়হান', class_id: 'cls_ky', roll: 'ই২', guardian: 'আব্দুস সাত্তার', guardian_job: 'দোকান', phone: '০১৭২১-২২২২২২', address: 'বাজার পাড়', admitted: '১৪৪৭', active: true, hifz: false },
      { id: 'std_12', permanent_id: '৪৪১১', name: 'সাকিবুল ইসলাম', class_id: 'cls_k4', roll: '৪০১', guardian: 'ইসলাম উদ্দিন', guardian_job: 'রিকশাচালক', phone: '০১৭২২-৩৩৩৩৩৩', address: 'স্টেশন রোড', admitted: '১৪৪৭', active: true, hifz: false },
      { id: 'std_13', permanent_id: '৪৪১২', name: 'নোমান হাসান', class_id: 'cls_k4', roll: '৪০২', guardian: 'হাসান মোল্লা', guardian_job: 'মুদি', phone: '০১৭২৩-৪৪৪৪৪৪', address: 'বটতলা', admitted: '১৪৪৭', active: true, hifz: false },
      { id: 'std_14', permanent_id: '৪৪২১', name: 'শাহাদাত হুসেন', class_id: 'cls_k5', roll: '৫০১', guardian: 'হুসেন আলী', guardian_job: 'দিনমজুর', phone: '০১৭২৪-৫৫৫৫৫৫', address: 'পূর্ব পাড়', admitted: '১৪৪৭', active: true, hifz: false },
      { id: 'std_15', permanent_id: '৪৪২২', name: 'রাব্বানী', class_id: 'cls_k5', roll: '৫০২', guardian: 'কেরামত আলী', guardian_job: 'রাজমিস্ত্রি', phone: '০১৭২৫-৬৬৬৬৬৬', address: 'রেলগেট', admitted: '১৪৪৭', active: true, hifz: true },
      { id: 'std_16', permanent_id: '৪৪৩১', name: 'হামজা', class_id: 'cls_k6', roll: '৬০১', guardian: 'আরিফা বেগম', guardian_job: 'গৃহিণী', phone: '০১৭২৬-৭৭৭৭৭৭', address: 'আমতলা', admitted: '১৪৪৭', active: true, hifz: false },
      { id: 'std_17', permanent_id: '৪৪৩২', name: 'আরিফজ্জামান', class_id: 'cls_k6', roll: '৬০২', guardian: 'শফিকুল', guardian_job: 'কৃষক', phone: '০১৭২৭-৮৮৮৮৮৮', address: 'নিচু পাড়', admitted: '১৪৪৭', active: true, hifz: false },
      { id: 'std_18', permanent_id: '৪৪৪১', name: 'মিকাইল', class_id: 'cls_k7', roll: '৭০১', guardian: 'আরশাদ', guardian_job: 'কামার', phone: '০১৭২৮-৯৯৯৯৯৯', address: 'বাজার', admitted: '১৪৪৭', active: true, hifz: false },
      { id: 'std_19', permanent_id: '৪৪৪২', name: 'ইয়াহইয়া', class_id: 'cls_k7', roll: '৭০২', guardian: 'আনিসুর রহমান', guardian_job: 'টেক্সি', phone: '০১৭২৯-১০১০১০', address: 'স্টেশন', admitted: '১৪৪৭', active: true, hifz: false },
      { id: 'std_20', permanent_id: '৪৪৫১', name: 'রাহাত করিম', class_id: 'cls_k8', roll: '৮০১', guardian: 'আব্দুল করিম', guardian_job: 'রাজমিস্ত্রি', phone: '০১৭৩০-১১১২১১', address: 'হাট', admitted: '১৪৪৭', active: true, hifz: false },
      { id: 'std_21', permanent_id: '৪৪৫২', name: 'যশিন পারভেজ', class_id: 'cls_k8', roll: '৮০২', guardian: 'সিরাজুল ইসলাম', guardian_job: 'রাজনীতিক', phone: '০১৭৩১-১২১৩১২', address: 'পল্লী', admitted: '১৪৪৭', active: true, hifz: true },
      { id: 'std_22', permanent_id: 'ম৪৭১০১', name: 'আব্দুল্লাহ (ম.)', class_id: 'cls_m1', roll: 'ম১-১', guardian: 'নুর আলম', guardian_job: 'কৃষক', phone: '০১৭৪১-৪৪৪৪৪', address: 'মক্তব ১', admitted: '১৪৪৭', active: true, hifz: false },
      { id: 'std_23', permanent_id: 'ম৪৭১০২', name: 'আবু বকর (ম.)', class_id: 'cls_m1', roll: 'ম১-২', guardian: 'বকর সাহেব', guardian_job: 'রংমিস্ত্রি', phone: '০১৭৪২-৪৪৪৪৫', address: 'মক্তব ১', admitted: '১৪৪৭', active: true, hifz: false },
      { id: 'std_24', permanent_id: 'ম৪৭২০১', name: 'সুফিয়ান (ম.)', class_id: 'cls_m2', roll: 'ম২-১', guardian: 'সুহেল আহমেদ', guardian_job: 'কৃষক', phone: '০১৭৪৩-৪৪৪৪৬', address: 'মক্তব ২', admitted: '১৪৪৭', active: true, hifz: false },
      { id: 'std_25', permanent_id: 'ম৪৭২০২', name: 'সাবরিনা (ম.)', class_id: 'cls_m2', roll: 'ম২-২', guardian: 'নুরজাহান', guardian_job: '—', phone: '০১৭৪৪-৪৪৪৪৭', address: 'মক্তব ২', admitted: '১৪৪৭', active: true, hifz: false },
      { id: 'std_26', permanent_id: 'ম৪৭৩০১', name: 'আরমান (ম.)', class_id: 'cls_m3', roll: 'ম৩-১', guardian: 'আরিফ', guardian_job: 'সেলুন', phone: '০১৭৪৫-৪৪৪৪৮', address: 'মক্তব ৩', admitted: '১৪৪৭', active: true, hifz: false },
      { id: 'std_27', permanent_id: 'ম৪৭৩০২', name: 'আরোশ (ম.)', class_id: 'cls_m3', roll: 'ম৩-২', guardian: 'রোকেয়া', guardian_job: '—', phone: '০১৭৪৬-৪৪৪৪৯', address: 'মক্তব ৩', admitted: '১৪৪৭', active: true, hifz: false },
      { id: 'std_28', permanent_id: 'ম৪৭৪০১', name: 'তাওহীদ (ম.)', class_id: 'cls_m4', roll: 'ম৪-১', guardian: 'তানভীর', guardian_job: 'কৃষক', phone: '০১৭৪৭-৪৪৪৫০', address: 'মক্তব ৪', admitted: '১৪৪৭', active: true, hifz: false },
      { id: 'std_29', permanent_id: 'ম৪৭৪০২', name: 'তাওফিক (ম.)', class_id: 'cls_m4', roll: 'ম৪-২', guardian: 'তৌহিদ', guardian_job: 'রাজমিস্ত্রি', phone: '০১৭৪৮-৪৪৪৫১', address: 'মক্তব ৪', admitted: '১৪৪৭', active: true, hifz: false },
      { id: 'std_30', permanent_id: 'ম৪৭৫০১', name: 'আরিফ (ম.)', class_id: 'cls_m5', roll: 'ম৫-১', guardian: 'আরিফ', guardian_job: 'রাজনীতি', phone: '০১৭৪৯-৪৪৪৫২', address: 'মক্তব ৫', admitted: '১৪৪৭', active: true, hifz: false },
      { id: 'std_31', permanent_id: 'ম৪৭৫০২', name: 'আরমান (ম.)', class_id: 'cls_m5', roll: 'ম৫-২', guardian: 'আরিফ', guardian_job: 'ব্যবসা', phone: '০১৭৫০-৪৪৪৫৩', address: 'মক্তব ৫', admitted: '১৪৪৭', active: true, hifz: false },
    ];
    const kitabs = [
      { id: 'ktb_1', name: 'হেদায়াতুন নাহু', class_id: 'cls_k3', total_pages: 120 },
      { id: 'ktb_2', name: 'নূরুল ইযাহ', class_id: 'cls_k3', total_pages: 200 },
      { id: 'ktb_3', name: 'মিশকাতুল মাসাবিহ', class_id: 'cls_k3', total_pages: 600 },
      { id: 'ktb_4', name: 'আল-হেদায়া', class_id: 'cls_k2', total_pages: 400 },
      { id: 'ktb_5', name: 'আরবি প্রথম', class_id: 'cls_k1', total_pages: 150 },
      { id: 'ktb_6', name: 'কুরআন শিক্ষা', class_id: 'cls_k1', total_pages: 604 },
      { id: 'ktb_7', name: 'আল-আজুরুমিয়্যাহ', class_id: 'cls_ky', total_pages: 120 },
      { id: 'ktb_8', name: 'হিদায়াতুন হিদায়া (চৎ.)', class_id: 'cls_k4', total_pages: 400 },
      { id: 'ktb_9', name: 'তাফসীরে জালালাইন (১ম খণ্ড)', class_id: 'cls_k5', total_pages: 400 },
      { id: 'ktb_10', name: 'কানযুল উম্মাল (নির্বাচিত)', class_id: 'cls_k6', total_pages: 500 },
      { id: 'ktb_11', name: 'মুআত্তা ইমাম মুহম্মাদ', class_id: 'cls_k7', total_pages: 300 },
      { id: 'ktb_12', name: 'সুনান আবি দাউদ', class_id: 'cls_k8', total_pages: 450 },
      { id: 'ktb_13', name: 'নূরানী কায়দা', class_id: 'cls_m1', total_pages: 80 },
      { id: 'ktb_14', name: 'আম পারা', class_id: 'cls_m2', total_pages: 100 },
      { id: 'ktb_15', name: 'কুরআন (আলোকিত)', class_id: 'cls_m3', total_pages: 200 },
      { id: 'ktb_16', name: 'সরল বাংলা (ম.)', class_id: 'cls_m4', total_pages: 150 },
      { id: 'ktb_17', name: 'সাধারণ জ্ঞান (ম.)', class_id: 'cls_m5', total_pages: 120 },
    ];
    const kitab_progress = [
      { id: 'kp_1', kitab_id: 'ktb_1', class_id: 'cls_k3', date: today, pages_done: 45, note: '' },
      { id: 'kp_2', kitab_id: 'ktb_2', class_id: 'cls_k3', date: today, pages_done: 32, note: '' },
      { id: 'kp_3', kitab_id: 'ktb_3', class_id: 'cls_k3', date: today, pages_done: 180, note: '' },
      { id: 'kp_4', kitab_id: 'ktb_4', class_id: 'cls_k2', date: '2025-12-10', pages_done: 90, note: 'পরীক্ষার্থী' },
      { id: 'kp_5', kitab_id: 'ktb_5', class_id: 'cls_k1', date: today, pages_done: 20, note: '' },
      { id: 'kp_6', kitab_id: 'ktb_6', class_id: 'cls_k1', date: today, pages_done: 48, note: '' },
      { id: 'kp_7', kitab_id: 'ktb_7', class_id: 'cls_ky', date: today, pages_done: 35, note: 'ইয়াদা' },
      { id: 'kp_8', kitab_id: 'ktb_8', class_id: 'cls_k4', date: today, pages_done: 55, note: '' },
      { id: 'kp_9', kitab_id: 'ktb_9', class_id: 'cls_k5', date: today, pages_done: 40, note: '' },
      { id: 'kp_10', kitab_id: 'ktb_10', class_id: 'cls_k6', date: today, pages_done: 60, note: '' },
      { id: 'kp_11', kitab_id: 'ktb_11', class_id: 'cls_k7', date: today, pages_done: 50, note: '' },
      { id: 'kp_12', kitab_id: 'ktb_12', class_id: 'cls_k8', date: today, pages_done: 90, note: '' },
      { id: 'kp_13', kitab_id: 'ktb_13', class_id: 'cls_m1', date: today, pages_done: 12, note: 'মক্তব' },
      { id: 'kp_14', kitab_id: 'ktb_14', class_id: 'cls_m2', date: today, pages_done: 18, note: 'মক্তব' },
      { id: 'kp_15', kitab_id: 'ktb_15', class_id: 'cls_m3', date: today, pages_done: 25, note: 'মক্তব' },
      { id: 'kp_16', kitab_id: 'ktb_16', class_id: 'cls_m4', date: today, pages_done: 30, note: 'মক্তব' },
      { id: 'kp_17', kitab_id: 'ktb_17', class_id: 'cls_m5', date: today, pages_done: 28, note: 'মক্তব' },
    ];
    const khuluk = [
      { id: 'kh_1', student_id: 'std_1', score: 75, reason: 'সাধারণভাবে ভালো আচরণ', date: '2025-01-15', by: 'উস্তায ইউসুফ' },
      { id: 'kh_2', student_id: 'std_1', score: 80, reason: 'উল্লেখযোগ্য উন্নতি দেখা গেছে', date: '2025-03-01', by: 'উস্তায ইউসুফ' },
      { id: 'kh_3', student_id: 'std_2', score: 65, reason: 'নামাজে মাঝেমধ্যে অমনোযোগী', date: '2025-01-15', by: 'উস্তায ইউসুফ' },
      { id: 'kh_4', student_id: 'std_3', score: 90, reason: 'অত্যন্ত আদবের সাথে চলে', date: '2025-01-15', by: 'উস্তায ইউসুফ' },
      { id: 'kh_5', student_id: 'std_4', score: 55, reason: 'সাথীদের সাথে বিবাদে জড়িয়েছে', date: '2025-03-10', by: 'উস্তায ইউসুফ' },
      { id: 'kh_6', student_id: 'std_5', score: 72, reason: 'নিয়মিত সময়ে আসে', date: '2025-02-01', by: 'উস্তায আব্দুল্লাহ' },
      { id: 'kh_7', student_id: 'std_6', score: 78, reason: 'নিয়মিত হাজিরা, উত্তর দেয়া ঠিকঠাক', date: '2025-02-15', by: 'উস্তায আব্দুল্লাহ' },
      { id: 'kh_8', student_id: 'std_7', score: 70, reason: 'প্রথম বর্ষ—আদব মেনে চলে', date: '2025-12-20', by: 'উস্তায মুহাম্মাদ' },
      { id: 'kh_9', student_id: 'std_8', score: 68, reason: 'ক্লাসে সক্রিয়', date: '2025-12-20', by: 'উস্তায মুহাম্মাদ' },
      { id: 'kh_10', student_id: 'std_10', score: 85, reason: 'ইয়াদা—আরবি উচ্চারণে মনোযোগী', date: '2025-01-20', by: 'উস্তায ইবরাহীম' },
      { id: 'kh_11', student_id: 'std_12', score: 74, reason: 'চতুর্থ বর্ষ—সঙ্গতি ভাল', date: '2025-02-05', by: 'উস্তায উমর' },
      { id: 'kh_12', student_id: 'std_14', score: 77, reason: 'পঞ্চম বর্ষ—নিয়মিত', date: '2025-01-10', by: 'উস্তায হাসান' },
      { id: 'kh_13', student_id: 'std_16', score: 69, reason: 'ষষ্ঠ বর্ষ—আর একটু ধৈর্য দরকার', date: '2025-03-05', by: 'উস্তায হুসাইন' },
      { id: 'kh_14', student_id: 'std_20', score: 82, reason: 'অষ্টম বর্ষ—নিয়মকানুন মানে', date: '2025-01-18', by: 'উস্তায বিলাল' },
      { id: 'kh_15', student_id: 'std_22', score: 88, reason: 'মক্তব—আলেকুমেসলাম উন্নত', date: '2025-11-20', by: 'উস্তায আনাস' },
      { id: 'kh_16', student_id: 'std_25', score: 84, reason: 'মেয়ে দিবস—আলাদা সারিতে ঠিকঠাক', date: '2025-10-10', by: 'উস্তায মুআয' },
      { id: 'kh_17', student_id: 'std_28', score: 79, reason: 'চতুর্থ শ্রেণি—অংকে আগ্রহ', date: '2025-02-20', by: 'উস্তায আবু বকর' },
    ];
    const attBase = students.map(function (s, i) {
      return {
        id: 'att_d_' + (i + 1),
        student_id: s.id,
        date: today,
        status: s.id === 'std_3' ? 'absent' : 'present',
      };
    });
    const logs = [
      { id: 'log_1', type: 'class', ref_id: 'cls_k3', text: 'আজ হেদায়াতুন নাহুর ৪৫ পৃষ্ঠা পর্যন্ত পড়ানো হয়েছে। ছাত্রদের মনোযোগ ভালো ছিল।', date: today, by: 'উস্তায ইউসুফ' },
      { id: 'log_2', type: 'student', ref_id: 'std_1', text: 'আজ মুহাম্মাদ আলী বিশেষ মনোযোগ দিয়ে পড়েছে। উন্নতি লক্ষ্যণীয়।', date: today, by: 'উস্তায ইউসুফ' },
      { id: 'log_3', type: 'class', ref_id: 'cls_k1', text: 'আরবি মৌলিক শব্দ—পুনরাবৃত্তি।', date: '2025-12-20', by: 'উস্তায মুহাম্মাদ' },
      { id: 'log_4', type: 'student', ref_id: 'std_5', text: 'আলেকুমেসলাম জবাব দেয়া উন্নত।', date: '2025-11-10', by: 'উস্তায আব্দুল্লাহ' },
      { id: 'log_5', type: 'class', ref_id: 'cls_k2', text: 'আল-হেদায়া: নুজুম সমাপ্ত। পরীক্ষার্থীদের সাবাক ঠিকঠাক।', date: '2025-12-18', by: 'উস্তায আব্দুল্লাহ' },
      { id: 'log_6', type: 'class', ref_id: 'cls_ky', text: 'ইয়াদা: আল-আজুরুমিয়্যাহ ৩৫ কিতাব—বাব নাহু ধরে পড়ানো হয়েছে।', date: today, by: 'উস্তায ইবরাহীম' },
      { id: 'log_7', type: 'class', ref_id: 'cls_k4', text: 'হিদায়া: নতুন পাঠ—সাবাক ও তিলাওয়াত শোধা হয়েছে।', date: '2025-12-12', by: 'উস্তায উমর' },
      { id: 'log_8', type: 'class', ref_id: 'cls_k5', text: 'জালালাইন: তাফসীরের ভূমিকা—ছাত্ররা কুরআন খুলে অনুসরণ।', date: '2025-12-10', by: 'উস্তায হাসান' },
      { id: 'log_9', type: 'class', ref_id: 'cls_m1', text: 'নূরানী: আম-জুজ-টু এ পর্যন্ত—সর্বশিক্ষার্থী উপস্থিত।', date: today, by: 'উস্তায আনাস' },
      { id: 'log_10', type: 'student', ref_id: 'std_10', text: 'তামিম আনোয়ার ইয়াদায় আরবি নাম ঠিকঠাক লিখতে পারে।', date: '2025-11-15', by: 'উস্তায ইবরাহীম' },
      { id: 'log_11', type: 'student', ref_id: 'std_15', text: 'রাব্বানী—হিফজ গ্রুপ: পারা ২৯ শিখছে।', date: '2025-10-01', by: 'উস্তায হাসান' },
      { id: 'log_12', type: 'student', ref_id: 'std_22', text: 'আব্দুল্লাহ (ম.): নমাজের সময় মেনে চলে।', date: '2025-12-22', by: 'উস্তায আনাস' },
      { id: 'log_13', type: 'student', ref_id: 'std_30', text: 'আরিফ (ম.): স্কুল হোম ওয়ার্ক—অভিভাবক সহায়তা সন্তোষজনক।', date: '2025-12-15', by: 'উস্তায উসমান' },
      { id: 'mm_ex_tlog_1', type: 'teacher', ref_id: 'tch_1', text: 'শ্রেণিকক্ষে সময়মতো উপস্থিত; ছাত্রদের সাথে আচরণ সদাচারণীয়।', date: today, by: 'জিম্মাদার' },
      { id: 'mm_ex_tlog_2', type: 'teacher', ref_id: 'tch_1', text: 'মাসিক পাঠ পরিকল্পনা জমা দিয়েছেন।', date: '2025-03-10', by: 'জিম্মাদার' },
      { id: 'mm_ex_tlog_3', type: 'teacher', ref_id: 'tch_2', text: 'ইয়াদা কক্ষ পরিচ্ছন্ন; ছাত্রদের স্বাস্থ্য ঠিকঠাক।', date: today, by: 'জিম্মাদার' },
      { id: 'mm_ex_tlog_4', type: 'teacher', ref_id: 'tch_4', text: 'তৃতীয় বর্ষের বার্ষিক সভায় উপস্থিত।', date: '2025-04-10', by: 'জিম্মাদার' },
      { id: 'mm_ex_tlog_5', type: 'teacher', ref_id: 'tch_10', text: 'মক্তব অভিভাবক সভায় ঠিকঠাক উপস্থিতি।', date: '2025-05-20', by: 'জিম্মাদার' },
    ];
    const fees = [
      { id: 'fee_1', month: '2025-04', class_id: 'cls_k3', total: 5, paid: 4, unpaid: 1, arrear: 500, late_payers: ['std_4'], note: '', date: today },
      { id: 'fee_2', month: '2025-04', class_id: 'cls_k2', total: 2, paid: 2, unpaid: 0, arrear: 0, late_payers: [], note: 'সকল পরিশোধ', date: today },
      { id: 'fee_3', month: '2025-04', class_id: 'cls_k1', total: 2, paid: 2, unpaid: 0, arrear: 0, late_payers: [], note: 'পরিশোধ নিয়মিত', date: today },
      { id: 'fee_4', month: '2025-04', class_id: 'cls_k4', total: 2, paid: 1, unpaid: 1, arrear: 300, late_payers: ['std_13'], note: '১ জন বকেয়া', date: today },
      { id: 'fee_5', month: '2025-04', class_id: 'cls_m2', total: 2, paid: 2, unpaid: 0, arrear: 0, late_payers: [], note: 'মক্তব ২', date: today },
    ];
    return {
      mm_classes: classes,
      mm_teachers: teachers,
      mm_students: students,
      mm_kitabs: kitabs,
      mm_kitab_progress: kitab_progress,
      mm_khuluk: khuluk,
      mm_exams: L.exams,
      mm_results: L.results,
      mm_logs: logs,
      mm_fees: fees,
      mm_attendance: padAttendanceExtra(today, attBase),
      mm_settings: { ...defaultSettings },
    };
  }

  function buildKhedmatSample() {
    const today = new Date().toISOString().split('T')[0];
    return {
      mm_kh_activity_types: [
        { id: 'at_1', name: 'চিকিৎসা সহায়তা', emoji: '🏥', is_active: true },
        { id: 'at_2', name: 'খাদ্য সহায়তা', emoji: '🍚', is_active: true },
        { id: 'at_3', name: 'আর্থিক সহায়তা', emoji: '💵', is_active: true },
        { id: 'at_4', name: 'অন্যান্য সেবা', emoji: '🤝', is_active: true },
        { id: 'at_5', name: 'পোশাক সহায়তা', emoji: '👔', is_active: true },
        { id: 'at_6', name: 'শিক্ষা সহায়তা', emoji: '📖', is_active: true },
      ],
      mm_kh_beneficiaries: [
        { id: 'bn_1', name: 'আব্দুর রহিম', address: 'পশ্চিম পাড়া', phone: '০১৭১১-০০০০০০', family_info: 'স্ত্রী ও ৩ সন্তান', first_contact: '2026-01-15', notes: 'নিয়মিত সেবাগ্রহীতা' },
        { id: 'bn_2', name: 'ফাতেমা বেগম', address: 'উত্তর পাড়া', phone: '', family_info: 'বিধবা, ২ সন্তান', first_contact: '2026-02-01', notes: 'চিকিৎসার জন্য এসেছেন' },
        { id: 'bn_3', name: 'আনোয়ার হোসেন', address: 'পূর্ব বাজার', phone: '০১৮৪৪-৪৪৪৪৪৪', family_info: '৪ সদস্য', first_contact: '2026-02-10', notes: 'মাসিক অনুসন্ধান' },
        { id: 'bn_4', name: 'রোকেয়া', address: 'মাদরাসা গেট', phone: '০১৬৬৬-৬৬৬৬৬৬', family_info: 'বৃদ্ধ মা', first_contact: '2026-02-20', notes: 'খাদ্য' },
        { id: 'bn_5', name: 'সেলিম রেজা', address: 'নদীর ধার', phone: '০১৯৯৯-৯৯৯৯৯৯', family_info: 'কর্মহীন, ২ সন্তান', first_contact: '2026-03-01', notes: 'অস্থায়ী সহায়তা' },
        { id: 'bn_6', name: 'মরিয়ম খাতুন', address: 'দক্ষিণ গ্রাম', phone: '০১৪৪৪-৪৪৪৪৪৪', family_info: 'তিন সন্তান', first_contact: '2026-03-05', notes: 'চিকিৎসা' },
      ],
      mm_kh_activities: [
        { id: 'act_1', beneficiary_id: 'bn_1', type_id: 'at_2', title: 'মাসিক খাদ্য সহায়তা', description: 'মার্চ মাসের জন্য চাল, ডাল ও তেল প্রদান করা হয়েছে।', amount: 1500, date: '2026-03-15' },
        { id: 'act_2', beneficiary_id: 'bn_2', type_id: 'at_1', title: 'চিকিৎসা সহায়তা', description: 'ডাক্তার ফি ও ওষুধের জন্য অর্থ প্রদান।', amount: 2000, date: '2026-03-20' },
        { id: 'act_3', beneficiary_id: 'bn_3', type_id: 'at_3', title: 'নগদ সহায়তা', description: 'বাড়ি ভাড়া।', amount: 3000, date: '2026-03-22' },
        { id: 'act_4', beneficiary_id: 'bn_4', type_id: 'at_2', title: 'রমজান প্যাকেজ', description: 'খাদ্য প্যাকেজ', amount: 1200, date: '2026-03-10' },
        { id: 'act_5', beneficiary_id: 'bn_5', type_id: 'at_4', title: 'ট্রাভেল', description: 'অসুস্থ স্বামী—হাসপাতাল।', amount: 800, date: '2026-04-01' },
        { id: 'act_6', beneficiary_id: 'bn_6', type_id: 'at_1', title: 'ওষুধ', description: 'ডায়াবেটিস', amount: 900, date: '2026-04-02' },
      ],
      mm_kh_daily_logs: [
        { id: 'lg_1', content: 'আজ ২ জন উপকারভোগীর সাথে কথা হয়েছে। আব্দুর রহিমের পরিবারের অবস্থা কিছুটা ভালো হয়েছে।', date: today, by: 'খেদমত দায়িত্বশীল' },
        { id: 'lg_2', content: 'নতুন নিবন্ধন বুক পর্যালোচনা।', date: '2026-04-10', by: 'খেদমত দায়িত্বশীল' },
        { id: 'lg_3', content: 'মাসিক প্রতিবেদন খসড়া।', date: '2026-04-05', by: 'খেদমত দায়িত্বশীল' },
      ],
      mm_kh_finance: [
        { id: 'fn_1', type: 'income', amount: 5000, source: 'মাদ্রাসা তহবিল', description: 'মাসিক বরাদ্দ', activity_id: null, date: '2026-04-01' },
        { id: 'fn_2', type: 'expense', amount: 1500, source: null, description: 'আব্দুর রহিম — খাদ্য সহায়তা', activity_id: 'act_1', date: '2026-03-15' },
        { id: 'fn_3', type: 'expense', amount: 2000, source: null, description: 'ফাতেমা বেগম — চিকিৎসা', activity_id: 'act_2', date: '2026-03-20' },
        { id: 'fn_4', type: 'income', amount: 2000, source: 'দান', description: 'শুক্রবার', activity_id: null, date: '2026-04-05' },
        { id: 'fn_5', type: 'expense', amount: 800, source: null, description: 'সেলিম রেজা — যাতায়াত', activity_id: 'act_5', date: '2026-04-01' },
        { id: 'fn_6', type: 'expense', amount: 900, source: null, description: 'মরিয়ম — ওষুধ', activity_id: 'act_6', date: '2026-04-02' },
      ],
    };
  }

  function buildDeptSample() {
    return {
      mm_dept_departments: [
        { id: 'dept_1', name: 'কৃষি বিভাগ', emoji: '🌾', pin: '0000', is_active: true },
        { id: 'dept_2', name: 'মধু বিভাগ', emoji: '🍯', pin: '0000', is_active: true },
        { id: 'dept_3', name: 'বেকারি বিভাগ', emoji: '🍞', pin: '0000', is_active: true },
        { id: 'dept_4', name: 'সেলাই বিভাগ', emoji: '🧵', pin: '0000', is_active: true },
        { id: 'dept_4', name: 'স্টোর', emoji: '📦', pin: '0000', is_active: true },
        { id: 'dept_5', name: 'রান্নাঘর', emoji: '🍽️', pin: '0000', is_active: true },
        { id: 'dept_6', name: 'বই বিতরণ', emoji: '📚', pin: '0000', is_active: true },
      ],
      mm_dept_transactions: [
        { id: 'txn_1', dept_id: 'dept_1', type: 'income', amount: 5000, description: 'ধান বিক্রয়', date: '2026-04-01', proof_note: '', locked: true, metadata: { plot: 'প্লট-ক' } },
        { id: 'txn_2', dept_id: 'dept_1', type: 'expense', amount: 800, description: 'সার ক্রয়', date: '2026-04-05', proof_note: '', locked: false, metadata: {} },
        { id: 'txn_3', dept_id: 'dept_2', type: 'income', amount: 3200, description: 'মধু বিক্রয়', date: '2026-04-03', proof_note: '', locked: true, metadata: { hives: 12 } },
        { id: 'txn_4', dept_id: 'dept_3', type: 'income', amount: 2500, description: 'রুটি বিক্রয়', date: '2026-04-10', proof_note: '', locked: false, metadata: { batch: 'ব্যাচ ৩' } },
        { id: 'txn_5', dept_id: 'dept_3', type: 'expense', amount: 1200, description: 'আটা ও মসলা', date: '2026-04-10', proof_note: '', locked: false, metadata: {} },
        { id: 'txn_6', dept_id: 'dept_4', type: 'income', amount: 3500, description: 'পোশাক বিক্রয়', date: '2026-04-12', proof_note: '', locked: false, metadata: { item_type: 'পাঞ্জাবি' } },
        { id: 'txn_7', dept_id: 'dept_4', type: 'expense', amount: 900, description: 'কাপড় ও সুতা ক্রয়', date: '2026-04-12', proof_note: '', locked: false, metadata: {} },
        { id: 'txn_6', dept_id: 'dept_6', type: 'income', amount: 900, description: 'বই বিক্রয়', date: '2026-04-12', proof_note: '', locked: false, metadata: {} },
      ],
      mm_dept_inventory: [
        { id: 'inv_1', dept_id: 'dept_1', product: 'ধান', quantity: 250, unit: 'কেজি', date_updated: '2026-04-01' },
        { id: 'inv_2', dept_id: 'dept_2', product: 'মধু', quantity: 15, unit: 'কেজি', date_updated: '2026-04-03' },
        { id: 'inv_3', dept_id: 'dept_3', product: 'আটা', quantity: 50, unit: 'কেজি', date_updated: '2026-04-10' },
        { id: 'inv_4', dept_id: 'dept_3', product: 'চিনি', quantity: 20, unit: 'কেজি', date_updated: '2026-04-10' },
        { id: 'inv_5', dept_id: 'dept_4', product: 'কাপড়', quantity: 80, unit: 'গজ', date_updated: '2026-04-12' },
        { id: 'inv_6', dept_id: 'dept_4', product: 'সুতা', quantity: 30, unit: 'রিল', date_updated: '2026-04-12' },
        { id: 'inv_5', dept_id: 'dept_4', product: 'নোটবুক', quantity: 120, unit: 'কপি', date_updated: '2026-04-11' },
        { id: 'inv_6', dept_id: 'dept_5', product: 'চাল', quantity: 200, unit: 'কেজি', date_updated: '2026-04-01' },
      ],
    };
  }

  function buildChatSample() {
    const now = Date.now();
    const ago = function (h) { return new Date(now - h * 3600000).toISOString(); };
    const msg = function (id, thread_id, from_role, from_name, text, h) {
      return {
        id, thread_id, from_role, from_name, text,
        ts: ago(h),
        read_admin: true,
        read_staff: true,
      };
    };
    return [
      msg('ch_01', 'daftar', 'daftar', 'দফতর দায়িত্বশীল', 'আজকের উপস্থিতি সম্পন্ন হয়েছে। মোট উপস্থিত: ৪৫ জন, অনুপস্থিত: ৭ জন।', 52),
      msg('ch_02', 'daftar', 'admin', 'জিম্মাদার', 'ঠিক আছে। অনুপস্থিতদের মধ্যে কেউ কি অসুস্থ? অভিভাবকদের জানানো হয়েছে কি?', 51),
      msg('ch_03', 'daftar', 'daftar', 'দফতর দায়িত্বশীল', '২ জন অসুস্থ বলে জানিয়েছেন। বাকিদের অভিভাবকদের সাথে যোগাযোগ করা হচ্ছে।', 27),
      msg('ch_04', 'hifz', 'hifz', 'হিফজ দায়িত্বশীল', 'গ্রুপ ১ আজ পারা ১৮ এর শেষ পর্যন্ত পৌঁছেছে। আলহামদুলিল্লাহ।', 28),
      msg('ch_05', 'hifz', 'admin', 'জিম্মাদার', 'মাশাআল্লাহ! তাদের উৎসাহিত করুন।', 27),
      msg('ch_06', 'khedmat', 'khedmat', 'খেদমত দায়িত্বশীল', 'আজ ৩ জন নতুন উপকারভোগী নিবন্ধন করা হয়েছে।', 50),
      msg('ch_07', 'khedmat', 'admin', 'জিম্মাদার', 'তহবিল থেকে সহায়তা দিন।', 49),
      msg('ch_08', 'teacher-tch_4', 'teacher', 'উস্তায ইউসুফ', '৩য় বর্ষের হেদায়াতুন নাহু ৪৫ পৃষ্ঠা পর্যন্ত শেষ হয়েছে।', 26),
      msg('ch_09', 'teacher-tch_4', 'admin', 'জিম্মাদার', 'আলহামদুলিল্লাহ। পরীক্ষার আগে ৬০ পৃষ্ঠা লক্ষ্য রাখবেন।', 25),
      msg('ch_10', 'library', 'library', 'মাকতাবা দায়িত্বশীল', 'এই সপ্তাহে ১২টি বই ইস্যু করা হয়েছে।', 75),
      msg('ch_11', 'alumni', 'alumni', 'পুরনো ছাত্র দায়িত্বশীল', 'এই মাসে ৫ জন পুরনো ছাত্রের সাথে যোগাযোগ করা হয়েছে।', 100),
      msg('ch_12', 'alumni', 'admin', 'জিম্মাদার', 'চমৎকার! তাদের সাথে নিয়মিত যোগাযোগ রাখুন।', 99),
    ];
  }

  g.MMSampleData = {
    version: 1,
    defaultSettings,
    getLegacyExamsForMigration,
    getLegacyExtraTeachers,
    buildMadrasaSample,
    buildKhedmatSample,
    buildDeptSample,
    buildChatSample,
  };
})(typeof globalThis !== 'undefined' ? globalThis : this);
