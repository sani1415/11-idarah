/* ═══════════════════════════════════════════
   মাদরাসাতুল মদীনা — chat-api.js
   শুধুমাত্র স্টাফ ↔ জিম্মাদার (অ্যাডমিন)।
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
    library: { name:'মাকতাবা দায়িত্বশীল',  icon:'📚' },
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
    const b = globalThis.MMSampleData && globalThis.MMSampleData.buildChatSample;
    if (!b) { console.warn('[MMSampleData] mm-sample-data.js chat-api.js-এর আগে লোড করুন।'); return; }
    const seed = b();
    if (seed && seed.length) save(seed);
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

  async function syncRemote(actorId, pin, isAdmin) {
    if (!globalThis.MMSharedAPI || !pin) return false;
    const res = await MMSharedAPI.chatBootstrap(actorId || null, pin, !!isAdmin);
    if (!res || !res.ok) return false;
    save((res.messages || []).map(m => ({
      id: String(m.id || ''),
      thread_id: m.thread_id || '',
      from_role: m.from_role || '',
      from_name: m.from_name || '',
      text: m.text || '',
      ts: m.ts || new Date().toISOString(),
      read_admin: !!m.read_admin,
      read_staff: !!m.read_staff,
    })));
    return true;
  }

  async function sendRemote(actorId, pin, threadId, text, isAdmin) {
    if (!globalThis.MMSharedAPI || !pin) return null;
    return MMSharedAPI.chatSend(actorId || null, pin, threadId, text, !!isAdmin);
  }

  async function markReadRemote(actorId, pin, threadId, isAdmin) {
    if (!globalThis.MMSharedAPI || !pin || !threadId) return false;
    const res = await MMSharedAPI.chatMarkRead(actorId || null, pin, threadId, !!isAdmin);
    return !!(res && res.ok);
  }

  seedIfEmpty();
  return { getThreads, getThread, send, markReadAdmin, markReadStaff, countUnreadStaff, countUnreadAdmin, getLabel, esc, syncRemote, sendRemote, markReadRemote };

})();
