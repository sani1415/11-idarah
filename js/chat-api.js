/* ═══════════════════════════════════════════
   মারকাযুল মদীনা — chat-api.js
   শুধুমাত্র স্টাফ ↔ মুহতামিম (অ্যাডমিন)।
   স্টাফদের মধ্যে থ্রেড বা সরাসরি যোগাযোগ নেই।
   ═══════════════════════════════════════════ */

const ChatAPI = (() => {

  const KEY = 'mm_chat_messages';

  const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2,5);
  const esc = s => String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');

  function load() { try { return JSON.parse(localStorage.getItem(KEY))||[]; } catch { return []; } }
  function save(data) { localStorage.setItem(KEY, JSON.stringify(data)); }

  const THREAD_LABELS = {
    daftar:  { name:'দফতর দায়িত্বশীল',      icon:'📋' },
    hifz:    { name:'হিফজ দায়িত্বশীল',       icon:'📿' },
    library: { name:'লাইব্রেরি দায়িত্বশীল',  icon:'📚' },
    alumni:  { name:'পুরনো ছাত্র দায়িত্বশীল', icon:'🎓' },
    khedmat: { name:'খেদমত দায়িত্বশীল',      icon:'🤝' },
  };

  function getLabel(thread_id) {
    if (THREAD_LABELS[thread_id]) return THREAD_LABELS[thread_id];
    if (thread_id.startsWith('teacher-')) return { name:'বর্ষ দায়িত্বশীল', icon:'📖' };
    if (thread_id.startsWith('dept-'))    return { name:'বিভাগ দায়িত্বশীল', icon:'🏢' };
    return { name:thread_id, icon:'👤' };
  }

  /* ── SEED ── */
  function seedIfEmpty() {
    if (load().length) return;

    const ago = h => new Date(Date.now() - h * 3600000).toISOString();
    const msg = (thread_id, from_role, from_name, text, h) => ({
      id: uid(), thread_id, from_role, from_name, text,
      ts: ago(h),
      read_admin: true,
      read_staff: true,
    });

    const seed = [
      /* ── দফতর ── */
      msg('daftar','daftar','দফতর দায়িত্বশীল',
        'আজকের উপস্থিতি সম্পন্ন হয়েছে। মোট উপস্থিত: ৪৫ জন, অনুপস্থিত: ৭ জন।', 52),
      msg('daftar','admin','মুহতামিম',
        'ঠিক আছে। অনুপস্থিতদের মধ্যে কেউ কি অসুস্থ? অভিভাবকদের জানানো হয়েছে কি?', 51),
      msg('daftar','daftar','দফতর দায়িত্বশীল',
        '২ জন অসুস্থ বলে জানিয়েছেন। বাকিদের অভিভাবকদের সাথে যোগাযোগ করা হচ্ছে।', 27),
      msg('daftar','admin','মুহতামিম',
        'ভালো। নিয়মিত আপডেট দেবেন। অনুপস্থিতির হার বেশি মনে হচ্ছে।', 26),
      msg('daftar','daftar','দফতর দায়িত্বশীল',
        'জি, ব্যাপারটা নজরে রাখছি। কাল বিস্তারিত প্রতিবেদন দেব।', 2),

      /* ── হিফজ ── */
      msg('hifz','hifz','হিফজ দায়িত্বশীল',
        'গ্রুপ ১ আজ পারা ১৮ এর শেষ পর্যন্ত পৌঁছেছে। আলহামদুলিল্লাহ।', 28),
      msg('hifz','admin','মুহতামিম',
        'মাশাআল্লাহ! তাদের উৎসাহিত করুন। পরের মাসের মধ্যে পারা ২০ লক্ষ্য রাখুন।', 27),
      msg('hifz','hifz','হিফজ দায়িত্বশীল',
        'জি, তাদের জানিয়ে দিয়েছি। তবে গ্রুপ ২ একটু পিছিয়ে আছে, তারা পারা ১৫ তে আছে।', 26),
      msg('hifz','admin','মুহতামিম',
        'গ্রুপ ২ এর জন্য বাড়তি সময় দিন। প্রয়োজনে আমি একদিন দেখতে আসব।', 3),

      /* ── খেদমত ── */
      msg('khedmat','khedmat','খেদমত দায়িত্বশীল',
        'আজ ৩ জন নতুন উপকারভোগী নিবন্ধন করা হয়েছে। তাদের মধ্যে একজনের জরুরি চিকিৎসার প্রয়োজন।', 50),
      msg('khedmat','admin','মুহতামিম',
        'তহবিল থেকে সহায়তা দিন। বিস্তারিত তথ্য সিস্টেমে এন্ট্রি করুন এবং পরিচয় যাচাই করুন।', 49),
      msg('khedmat','khedmat','খেদমত দায়িত্বশীল',
        'এন্ট্রি করা হয়েছে। এ মাসে মোট ৫ জনকে সহায়তা দেওয়া হয়েছে। মোট ব্যয়: ৳৩,৫০০।', 5),
      msg('khedmat','admin','মুহতামিম',
        'চমৎকার কাজ। মাসিক প্রতিবেদন তৈরি রাখুন।', 4),

      /* ── বর্ষ দায়িত্বশীল (৩য় বর্ষ) ── */
      msg('teacher-tch_4','teacher','মাওলানা আবুল কাসেম',
        '৩য় বর্ষের হেদায়াতুন নাহু ৪৫ পৃষ্ঠা পর্যন্ত শেষ হয়েছে। ছাত্ররা ভালো সাড়া দিচ্ছে।', 26),
      msg('teacher-tch_4','admin','মুহতামিম',
        'আলহামদুলিল্লাহ। পরীক্ষার আগে ৬০ পৃষ্ঠা লক্ষ্য রাখবেন। দুর্বল ছাত্রদের বিষয়ে সতর্ক থাকবেন।', 25),
      msg('teacher-tch_4','teacher','মাওলানা আবুল কাসেম',
        'জি হুযুর। একজন ছাত্র কিছুটা পিছিয়ে আছে, তার জন্য বাড়তি মনোযোগ দেওয়া হচ্ছে।', 4),
      msg('teacher-tch_4','admin','মুহতামিম',
        'ভালো উদ্যোগ। প্রয়োজনে আমাকে জানাবেন।', 3),

      /* ── লাইব্রেরি ── */
      msg('library','library','লাইব্রেরি দায়িত্বশীল',
        'এই সপ্তাহে ১২টি বই ইস্যু করা হয়েছে। ৩টি বই ফেরত দেওয়ার মেয়াদ পেরিয়ে গেছে।', 75),
      msg('library','admin','মুহতামিম',
        'সংশ্লিষ্ট ছাত্রদের মনে করিয়ে দিন। প্রয়োজনে তাদের বর্ষ দায়িত্বশীলকে জানান।', 74),
      msg('library','library','লাইব্রেরি দায়িত্বশীল',
        'ইতিমধ্যে জানানো হয়েছে। একজন বলেছেন আগামীকাল ফেরত দেবেন।', 50),

      /* ── পুরনো ছাত্র ── */
      msg('alumni','alumni','পুরনো ছাত্র দায়িত্বশীল',
        'এই মাসে ৫ জন পুরনো ছাত্রের সাথে যোগাযোগ করা হয়েছে। ২ জন ইমামতি করছেন, ৩ জন মাদ্রাসায় পড়াচ্ছেন।', 100),
      msg('alumni','admin','মুহতামিম',
        'চমৎকার! তাদের সাথে নিয়মিত যোগাযোগ রাখুন। আগামী বছর একটি পুনর্মিলনী আয়োজনের কথা ভাবছি।', 99),
      msg('alumni','alumni','পুরনো ছাত্র দায়িত্বশীল',
        'অবশ্যই হুযুর। আমি সবার যোগাযোগ নম্বর আপডেট করে রাখছি।', 72),
    ];

    save(seed);
  }

  /* ── API ── */

  function getThreads() {
    const msgs = load();
    const threads = {};
    msgs.forEach(m => {
      if (!threads[m.thread_id]) threads[m.thread_id] = { thread_id:m.thread_id, staff_name:'', msgs:[] };
      if (m.from_role !== 'admin' && m.from_name) threads[m.thread_id].staff_name = m.from_name;
      threads[m.thread_id].msgs.push(m);
    });
    return Object.values(threads).map(t => ({
      thread_id:  t.thread_id,
      staff_name: t.staff_name || getLabel(t.thread_id).name,
      label:      getLabel(t.thread_id),
      last_msg:   t.msgs[t.msgs.length-1],
      unread:     t.msgs.filter(m => m.from_role !== 'admin' && !m.read_admin).length,
    })).sort((a,b) => (b.last_msg?.ts||'').localeCompare(a.last_msg?.ts||''));
  }

  function getThread(thread_id) {
    return load().filter(m => m.thread_id === thread_id).sort((a,b) => a.ts.localeCompare(b.ts));
  }

  function send(thread_id, from_role, from_name, text) {
    const msgs = load();
    const m = {
      id: uid(), thread_id, from_role, from_name, text,
      ts: new Date().toISOString(),
      read_admin: from_role === 'admin',
      read_staff: from_role === 'admin',
    };
    msgs.push(m);
    save(msgs);
    return m;
  }

  function markReadAdmin(thread_id) {
    save(load().map(m => m.thread_id===thread_id && m.from_role!=='admin' ? {...m,read_admin:true} : m));
  }

  function markReadStaff(thread_id) {
    save(load().map(m => m.thread_id===thread_id && m.from_role==='admin' ? {...m,read_staff:true} : m));
  }

  function countUnreadStaff(thread_id) {
    return load().filter(m => m.thread_id===thread_id && m.from_role==='admin' && !m.read_staff).length;
  }

  function countUnreadAdmin() {
    return load().filter(m => m.from_role!=='admin' && !m.read_admin).length;
  }

  seedIfEmpty();
  return { getThreads, getThread, send, markReadAdmin, markReadStaff, countUnreadStaff, countUnreadAdmin, getLabel, esc };

})();
