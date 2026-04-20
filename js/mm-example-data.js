/**
 * নমুনা উপস্থিতি (ছুটি) ডেটা — প্রোডাকশনে সরান:
 *   ১) এই ফাইল ডিলিট করুন
 *   ২) admin-hub.html / madrasa-leave-students.html থেকে স্ক্রিপ্ট ট্যাগ সরান
 *   ৩) অথবা লোডের আগে window.MM_USE_EXAMPLE = false;
 *
 * রেকর্ড id 'mm_ex_' দিয়ে শুরু — পরিষ্কার করতে চাইলে localStorage mm_attendance থেকে ফিল্টার করুন।
 */
(function () {
  if (typeof window !== 'undefined' && window.MM_USE_EXAMPLE === false) return;

  const KEY = 'mm_attendance';
  let list;
  try {
    list = JSON.parse(localStorage.getItem(KEY) || '[]');
  } catch {
    list = [];
  }
  if (list.some((r) => r && String(r.id).startsWith('mm_ex_'))) return;

  const t = new Date();
  const extra = [];
  let n = 0;
  for (let i = 1; i <= 21; i++) {
    const d = new Date(t);
    d.setDate(d.getDate() - i);
    const date = d.toISOString().slice(0, 10);
    if (i % 2 === 0) extra.push({ id: 'mm_ex_lv_' + ++n, student_id: 'std_1', date, status: 'leave' });
    if (i % 3 === 0) extra.push({ id: 'mm_ex_lv_' + ++n, student_id: 'std_2', date, status: 'leave' });
    if (i % 4 === 0) extra.push({ id: 'mm_ex_lv_' + ++n, student_id: 'std_4', date, status: 'leave' });
    if (i % 5 === 0) extra.push({ id: 'mm_ex_lv_' + ++n, student_id: 'std_3', date, status: 'leave' });
  }

  localStorage.setItem(KEY, JSON.stringify(list.concat(extra)));
})();

/**
 * নমুনা শিক্ষক বিস্তারিত ও লগ — প্রোডাকশনে উপরের মতো সরান। id: mm_ex_tlog_*
 */
(function patchTeacherProfileExample() {
  if (typeof window !== 'undefined' && window.MM_USE_EXAMPLE === false) return;

  const TKEY = 'mm_teachers';
  let tlist;
  try {
    tlist = JSON.parse(localStorage.getItem(TKEY) || '[]');
  } catch {
    tlist = [];
  }
  if (tlist.length && tlist.some((t) => t && t.mm_ex_teacher_patch)) {
    /* already patched */
  } else if (tlist.length) {
    const patch = (id, extra) => {
      const i = tlist.findIndex((x) => x.id === id);
      if (i < 0) return;
      tlist[i] = { ...tlist[i], ...extra, mm_ex_teacher_patch: true };
    };
    patch('tch_1', {
      father_name: 'হাবিবুর রহমান',
      address: 'বয়ালী মুখর, মাদরাসা সড়ক',
      phone: '০১৭১১-১১১১১১',
      salary: 28000,
      admin_note: 'নিয়মিত মেধাবী। তাদরীব সপ্তাহে উপস্থিত থাকেন।',
      salary_history: [
        { date: '2025-01-01', amount: 24000, note: 'নতুন বছর নিয়মিত বৃদ্ধি' },
        { date: '2025-04-01', amount: 28000, note: 'মাসিক বেতন স্কেল' },
      ],
    });
    patch('tch_10', {
      father_name: 'করিম উদ্দিন',
      address: 'পূর্ব পাড়া',
      phone: '০১৮২২-২২২২২২',
      salary: 22000,
      admin_note: 'মক্তব বিভাগের দায়িত্বে সন্তোষজনক।',
      salary_history: [{ date: '2025-04-01', amount: 22000, note: '' }],
    });
    localStorage.setItem(TKEY, JSON.stringify(tlist));
  }

  const LKEY = 'mm_logs';
  let logs;
  try {
    logs = JSON.parse(localStorage.getItem(LKEY) || '[]');
  } catch {
    logs = [];
  }
  if (logs.some((l) => l && String(l.id).startsWith('mm_ex_tlog_'))) return;

  const today = new Date().toISOString().slice(0, 10);
  logs.push(
    {
      id: 'mm_ex_tlog_1',
      type: 'teacher',
      ref_id: 'tch_1',
      text: 'শ্রেণিকক্ষে সময়মতো উপস্থিত; ছাত্রদের সাথে আচরণ সদাচারণীয়।',
      date: today,
      by: 'মুহতামিম',
    },
    {
      id: 'mm_ex_tlog_2',
      type: 'teacher',
      ref_id: 'tch_1',
      text: 'মাসিক পাঠ পরিকল্পনা জমা দিয়েছেন।',
      date: '2025-03-10',
      by: 'মুহতামিম',
    }
  );
  localStorage.setItem(LKEY, JSON.stringify(logs));
})();
