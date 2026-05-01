(function (global) {
  'use strict';

  const KHADIMIN_KEY = 'mm_khadimin';
  const LEAVES_KEY = 'mm_khadimin_leaves';
  let helpers = { toBn: (n) => String(n), showToast: () => {} };
  /** @type {Record<string, { vy: number, vm: number, a: string|null, b: string|null }>} */
  const leavePickState = {};

  const BN_MONTHS = ['জানুয়ারি', 'ফেব্রুয়ারি', 'মার্চ', 'এপ্রিল', 'মে', 'জুন', 'জুলাই', 'আগস্ট', 'সেপ্টেম্বর', 'অক্টোবর', 'নভেম্বর', 'ডিসেম্বর'];
  const BN_DOW = ['রবি', 'সোম', 'মঙ্গল', 'বুধ', 'বৃহ', 'শুক', 'শনি'];

  const uid = () => 'kh_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  const today = () => new Date().toISOString().slice(0, 10);
  const esc = (s) => global.API && API.esc ? API.esc(s) : String(s || '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  /** onclick="...('…')" এর জন্য — ডাবল কোট ভাঙ্গা এড়াতে (JSON.stringify এখানে ব্যবহার নয়) */
  function jsSingleQuote(s) {
    return String(s).replace(/\\/g, '\\\\').replace(/'/g, '\\\'');
  }

  function initialChar(name) {
    const s = String(name || '').trim();
    if (!s) return '?';
    const ch = s[0];
    return esc(ch);
  }

  function isoFromYmd(y, m0, d) {
    return `${y}-${String(m0 + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
  }

  function ensureLeavePick(id) {
    if (!leavePickState[id]) {
      const t = new Date();
      leavePickState[id] = { vy: t.getFullYear(), vm: t.getMonth(), a: null, b: null };
    }
    return leavePickState[id];
  }

  function syncLeaveHidden(id) {
    const st = ensureLeavePick(id);
    const fromEl = document.getElementById('kh-leave-from-' + id);
    const toEl = document.getElementById('kh-leave-to-' + id);
    if (!fromEl || !toEl) return;
    if (!st.a) { fromEl.value = ''; toEl.value = ''; return; }
    if (!st.b) { fromEl.value = st.a; toEl.value = st.a; return; }
    const lo = st.a <= st.b ? st.a : st.b;
    const hi = st.a <= st.b ? st.b : st.a;
    fromEl.value = lo;
    toEl.value = hi;
  }

  function leaveRangeLabel(id) {
    const st = ensureLeavePick(id);
    if (!st.a) return 'ক্যালেন্ডারে শুরুর দিন টোকা দিন; শেষ দিন আবার টোকা দিন। একদিন হলে দুবার একই দিন।';
    if (!st.b) return `${esc(st.a)} থেকে — শেষ তারিখ বেছে নিন (${helpers.toBn(daysBetween(st.a, st.a))} দিন)`;
    const lo = st.a <= st.b ? st.a : st.b;
    const hi = st.a <= st.b ? st.b : st.a;
    return `${esc(lo)} থেকে ${esc(hi)} — মোট ${helpers.toBn(daysBetween(lo, hi))} দিন`;
  }

  function buildCalInnerHtml(id) {
    const st = ensureLeavePick(id);
    const y = st.vy;
    const m = st.vm;
    const first = new Date(y, m, 1);
    const lastDate = new Date(y, m + 1, 0).getDate();
    const pad = first.getDay();
    const td = today();
    let lo = null; let hi = null;
    if (st.a) {
      lo = st.b ? (st.a <= st.b ? st.a : st.b) : st.a;
      hi = st.b ? (st.a <= st.b ? st.b : st.a) : st.a;
    }
    const inRange = (iso) => lo && hi && iso >= lo && iso <= hi;
    const parts = [];
    const qid = jsSingleQuote(id);
    parts.push(`<div class="kh-cal-head">`);
    parts.push(`<button type="button" class="kh-cal-nav" aria-label="আগের মাস" onclick="MDRHomePanels.leaveCalNav('${qid}',-1)">‹</button>`);
    parts.push(`<div class="kh-cal-mo">${esc(BN_MONTHS[m])} ${helpers.toBn(y)}</div>`);
    parts.push(`<button type="button" class="kh-cal-nav" aria-label="পরের মাস" onclick="MDRHomePanels.leaveCalNav('${qid}',1)">›</button>`);
    parts.push(`</div><div class="kh-cal-grid">`);
    for (let i = 0; i < 7; i++) parts.push(`<div class="kh-cal-dow">${esc(BN_DOW[i])}</div>`);
    for (let i = 0; i < pad; i++) parts.push('<div class="kh-cal-pad"></div>');
    for (let d = 1; d <= lastDate; d++) {
      const iso = isoFromYmd(y, m, d);
      const cls = ['kh-cal-day'];
      if (iso === td) cls.push('kh-cal-today');
      if (st.a && st.b) {
        if (inRange(iso)) cls.push('kh-cal-inrange');
        if (iso === lo || iso === hi) cls.push('kh-cal-edge');
      } else if (st.a && iso === st.a) cls.push('kh-cal-edge');
      parts.push(`<button type="button" class="${cls.join(' ')}" onclick="MDRHomePanels.pickLeaveDay('${qid}','${jsSingleQuote(iso)}')">${helpers.toBn(d)}</button>`);
    }
    parts.push('</div>');
    parts.push(`<p class="kh-cal-hint">${leaveRangeLabel(id)}</p>`);
    parts.push(`<div class="kh-cal-tools"><button type="button" class="kh-cal-clear" onclick="MDRHomePanels.clearLeavePick('${qid}')">নির্বাচন মুছুন</button></div>`);
    return parts.join('');
  }

  function redrawLeaveCal(id) {
    const host = document.getElementById('kh-cal-host-' + id);
    if (host) host.innerHTML = buildCalInnerHtml(id);
    syncLeaveHidden(id);
  }

  function loadArr(key) {
    if (global.API && API.persistLoadArr) return API.persistLoadArr(key);
    try { return JSON.parse(localStorage.getItem(key)) || []; } catch (e) { return []; }
  }

  function saveArr(key, rows) {
    if (global.API && API.persistSaveArr) API.persistSaveArr(key, rows);
    else localStorage.setItem(key, JSON.stringify(rows || []));
  }

  function injectOnce() {
    if (document.getElementById('mdr-home-panels-style')) return;
    const style = document.createElement('style');
    style.id = 'mdr-home-panels-style';
    style.textContent = `
      #modal-khadimin.modal-bg,#modal-absent-home.modal-bg{align-items:center;justify-content:center;padding:16px}
      #modal-khadimin .modal,#modal-absent-home .modal{width:min(760px,calc(100vw - 32px));height:min(760px,calc(100vh - 32px));max-height:calc(100vh - 32px);border-radius:22px;padding:18px;box-sizing:border-box;overflow:hidden;display:flex;flex-direction:column}
      .kh-panel{flex:1;overflow-y:auto;min-height:0}
      .kh-panel-form{display:none}.kh-panel-form.active{display:block}
      .kh-panel-list{display:block}.kh-panel-list.hidden{display:none}
      .kh-modal-head{display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;flex-shrink:0}
      .kh-modal-title{font-family:'Noto Serif Bengali',serif;font-size:17px;font-weight:800;color:var(--ink)}
      .kh-add-btn{border:none;background:var(--ink);color:var(--gold2);border-radius:10px;padding:8px 14px;font-family:'Noto Sans Bengali',sans-serif;font-size:12px;font-weight:900;cursor:pointer;white-space:nowrap}
      .kh-back-btn{border:1px solid var(--cream3);background:#fff;color:var(--ink2);border-radius:10px;padding:7px 12px;font-family:'Noto Sans Bengali',sans-serif;font-size:12px;font-weight:800;cursor:pointer}
      .kh-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}
      #kh-list{display:grid;grid-template-columns:repeat(auto-fill,minmax(292px,1fr));gap:8px;align-content:start}
      .kh-card-wrap{background:#fff;border:1px solid rgba(26,18,8,.07);border-radius:14px;box-shadow:0 4px 12px rgba(26,18,8,.05);overflow:hidden}
      .kh-compact{display:grid;grid-template-columns:1fr auto;gap:6px;align-items:stretch;padding:8px 8px 8px 10px}
      .kh-main-hit{border:none;margin:0;background:transparent;cursor:pointer;text-align:left;display:flex;align-items:flex-start;gap:10px;min-width:0;padding:4px 2px 4px 0;font:inherit;border-radius:10px;flex:1}
      .kh-main-hit:hover{background:rgba(201,149,42,.06)}
      .kh-main-hit:focus-visible{outline:2px solid var(--gold);outline-offset:2px}
      .kh-av{flex-shrink:0;width:40px;height:40px;border-radius:50%;background:var(--ink);color:var(--gold2);display:flex;align-items:center;justify-content:center;font-family:'Noto Serif Bengali',serif;font-size:16px;font-weight:800}
      .kh-row-text{flex:1;min-width:0}
      .kh-name{display:block;font-family:'Noto Serif Bengali',serif;font-size:14px;font-weight:800;color:var(--ink);line-height:1.25}
      .kh-meta,.kh-note,.abs-meta-home{font-size:11px;color:var(--ink3);line-height:1.45;margin-top:2px}
      .kh-meta--1l{white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:100%}
      .kh-row-side{display:flex;flex-direction:column;align-items:flex-end;gap:4px;flex-shrink:0}
      .kh-chev{font-size:10px;color:var(--ink3);margin-top:2px}
      .kh-pill{display:inline-block;background:var(--cream2);border-radius:20px;padding:2px 8px;font-size:10px;color:var(--ink3);white-space:nowrap}
      .kh-pill--away{background:rgba(180,120,40,.18);color:#6a4a12}
      .kh-pill--inactive{background:rgba(120,120,120,.15);color:var(--ink3)}
      .kh-pill--active{background:rgba(40,120,80,.12);color:#1d5c3a}
      .kh-edit{border:1px solid var(--cream3);background:#fff;border-radius:10px;padding:8px 9px;font-family:'Noto Sans Bengali',sans-serif;font-size:10px;font-weight:800;color:var(--ink2);cursor:pointer;align-self:center}
      .kh-mini-btn{border:1px solid var(--cream3);background:#fff;border-radius:10px;padding:8px;font-family:'Noto Sans Bengali',sans-serif;font-size:11px;font-weight:800;color:var(--ink2);cursor:pointer}
      .kh-mini-btn.gold{background:var(--ink);color:var(--gold2);border-color:var(--ink)}
      .kh-subtitle{font-size:12px;font-weight:900;color:var(--ink2);margin:10px 0 6px}
      .kh-detail{display:none;background:linear-gradient(180deg,#fffaf2 0%,#fff 100%);border-top:1px solid var(--cream2);padding:10px 10px 12px}
      .kh-detail.open{display:block}
      .kh-detail input,.kh-detail textarea,.kh-grid input,.kh-grid select,.kh-grid textarea{width:100%;box-sizing:border-box}
      .kh-leave-scroll{max-height:112px;overflow-y:auto;margin:4px 0 8px;padding-right:4px;border-radius:8px}
      .kh-leave-row{display:flex;justify-content:space-between;gap:8px;border-top:1px solid var(--cream2);padding:6px 0;font-size:11px;color:var(--ink2)}
      .kh-leave-row:first-child{border-top:none;padding-top:0}
      .kh-cal{border:1px solid rgba(26,18,8,.1);border-radius:14px;padding:8px 8px 6px;background:#fff;margin-top:6px}
      .kh-cal-head{display:flex;align-items:center;justify-content:space-between;margin-bottom:6px;padding:0 2px}
      .kh-cal-nav{border:none;background:var(--cream2);width:34px;height:34px;border-radius:10px;cursor:pointer;font-size:18px;line-height:1;color:var(--ink2)}
      .kh-cal-mo{font-size:13px;font-weight:800;color:var(--ink);font-family:'Noto Sans Bengali',sans-serif}
      .kh-cal-grid{display:grid;grid-template-columns:repeat(7,1fr);gap:3px;text-align:center}
      .kh-cal-dow{font-size:9px;color:var(--ink3);padding:4px 0;font-weight:700}
      .kh-cal-pad{min-height:32px}
      .kh-cal-day{min-height:32px;border:none;border-radius:9px;background:transparent;cursor:pointer;font-size:12px;font-family:inherit;color:var(--ink2);padding:0}
      .kh-cal-day:hover{background:var(--cream2)}
      .kh-cal-day.kh-cal-today{box-shadow:inset 0 0 0 1.5px var(--gold)}
      .kh-cal-day.kh-cal-inrange{background:rgba(201,149,42,.14)}
      .kh-cal-day.kh-cal-edge{background:var(--ink);color:var(--gold2);font-weight:800}
      .kh-cal-hint{font-size:10px;color:var(--ink3);line-height:1.45;margin:8px 2px 4px;min-height:2.8em}
      .kh-cal-tools{text-align:center}
      .kh-cal-clear{border:none;background:transparent;color:var(--blue);font-size:11px;cursor:pointer;text-decoration:underline;padding:2px;font-family:'Noto Sans Bengali',sans-serif}
      .abs-row-home{display:flex;align-items:center;gap:12px;background:#fff;border:1px solid rgba(26,18,8,.07);border-radius:14px;box-shadow:0 5px 14px rgba(26,18,8,.06);padding:12px;margin-bottom:8px}
      .abs-rank-home{font-family:'Noto Serif Bengali',serif;font-size:18px;font-weight:800;color:var(--gold);min-width:34px;text-align:center}
      .abs-info-home{flex:1;min-width:0}.abs-name-home{font-size:14px;font-weight:700;color:var(--ink)}
      .abs-days-home{font-family:'Noto Serif Bengali',serif;font-size:17px;font-weight:800;color:var(--red);white-space:nowrap}
      @media(max-width:520px){.kh-grid{grid-template-columns:1fr}#kh-list{grid-template-columns:1fr}}
      .kh-list-empty{grid-column:1/-1}
    `;
    document.head.appendChild(style);

    const kh = document.createElement('div');
    kh.className = 'modal-bg';
    kh.id = 'modal-khadimin';
    kh.innerHTML = `<div class="modal">
      <!-- তালিকা প্যানেল -->
      <div class="kh-panel kh-panel-list" id="kh-panel-list">
        <div class="kh-modal-head">
          <div class="kh-modal-title">★ খাদিমিন</div>
          <div style="display:flex;gap:8px;align-items:center">
            <button type="button" class="kh-add-btn" onclick="MDRHomePanels.showAddForm()">+ নতুন খাদেম</button>
            <button class="modal-close" onclick="MDRHomePanels.closeKhadimin()">✕</button>
          </div>
        </div>
        <div id="kh-list"></div>
      </div>
      <!-- ফর্ম প্যানেল (লুকানো) -->
      <div class="kh-panel kh-panel-form" id="kh-panel-form">
        <div class="kh-modal-head">
          <button type="button" class="kh-back-btn" onclick="MDRHomePanels.showList()">← তালিকায় ফিরুন</button>
          <span id="kh-form-title" style="font-size:13px;font-weight:800;color:var(--ink)">নতুন খাদেম</span>
          <button class="modal-close" onclick="MDRHomePanels.closeKhadimin()">✕</button>
        </div>
        <input type="hidden" id="kh-id">
        <div class="kh-grid">
          <div class="form-group"><label class="form-label">নাম <span style="color:var(--red)">*</span></label><input class="form-input" id="kh-name" placeholder="খাদেমের নাম"></div>
          <div class="form-group"><label class="form-label">মোবাইল</label><input class="form-input" id="kh-phone" placeholder="০১৭XX-XXXXXX"></div>
          <div class="form-group"><label class="form-label">দায়িত্ব</label><input class="form-input" id="kh-duty" placeholder="রান্নাঘর, পরিষ্কার, দারোয়ান…"></div>
          <div class="form-group"><label class="form-label">যোগদানের তারিখ</label><input class="form-input" id="kh-join" type="date"></div>
          <div class="form-group"><label class="form-label">অবস্থা</label><select class="form-input form-select" id="kh-status"><option value="active">সক্রিয়</option><option value="away">ছুটিতে</option><option value="inactive">নিষ্ক্রিয়</option></select></div>
          <div class="form-group"><label class="form-label">ঠিকানা</label><input class="form-input" id="kh-address" placeholder="ঠিকানা"></div>
          <div class="form-group" style="grid-column:1/-1"><label class="form-label">পূর্ণাঙ্গ বিবরণ</label><textarea class="form-input" id="kh-details" rows="3" placeholder="পরিবার, পরিচয়, জরুরি তথ্য…"></textarea></div>
        </div>
        <button class="submit-btn gold" onclick="MDRHomePanels.saveKhadim()">সংরক্ষণ করুন</button>
      </div>
    </div>`;
    document.body.appendChild(kh);

    const abs = document.createElement('div');
    abs.className = 'modal-bg';
    abs.id = 'modal-absent-home';
    abs.innerHTML = `<div class="modal">
      <div class="modal-title">অনুপস্থিত তালিকা <button class="modal-close" onclick="MDRHomePanels.closeAbsent()">✕</button></div>
      <div class="kh-meta" style="margin-bottom:12px">যাদের কমপক্ষে এক দিন অনুপস্থিত রেকর্ড আছে। বেশি দিন থেকে কম — সাজানো।</div>
      <div id="abs-home-list"></div>
    </div>`;
    document.body.appendChild(abs);
  }

  function getKhadimin() {
    return loadArr(KHADIMIN_KEY);
  }

  function getLeaves() {
    return loadArr(LEAVES_KEY);
  }

  function saveKhadim() {
    const name = document.getElementById('kh-name').value.trim();
    if (!name) { helpers.showToast('নাম লিখুন'); return; }
    const id = document.getElementById('kh-id').value || uid();
    const rows = getKhadimin();
    const row = {
      id,
      name,
      phone: document.getElementById('kh-phone').value.trim(),
      duty: document.getElementById('kh-duty').value.trim(),
      join_date: document.getElementById('kh-join').value,
      status: document.getElementById('kh-status').value,
      address: document.getElementById('kh-address').value.trim(),
      details: document.getElementById('kh-details').value.trim(),
      notes: (rows.find((x) => x.id === id) || {}).notes || [],
    };
    const idx = rows.findIndex((x) => x.id === id);
    if (idx >= 0) rows[idx] = row;
    else rows.push(row);
    saveArr(KHADIMIN_KEY, rows);
    renderKhadimin();
    updateCards();
    showList();
    helpers.showToast('খাদেমের তথ্য সংরক্ষণ হয়েছে ✓');
  }

  function showList() {
    document.getElementById('kh-panel-list').classList.remove('hidden');
    document.getElementById('kh-panel-form').classList.remove('active');
  }

  function showAddForm() {
    clearKhadimForm();
    const t = document.getElementById('kh-form-title');
    if (t) t.textContent = 'নতুন খাদেম';
    document.getElementById('kh-panel-list').classList.add('hidden');
    document.getElementById('kh-panel-form').classList.add('active');
    document.getElementById('kh-panel-form').scrollTop = 0;
  }

  function clearKhadimForm() {
    ['kh-id', 'kh-name', 'kh-phone', 'kh-duty', 'kh-join', 'kh-address', 'kh-details'].forEach((id) => { document.getElementById(id).value = ''; });
    document.getElementById('kh-status').value = 'active';
  }

  function editKhadim(id) {
    const k = getKhadimin().find((x) => x.id === id);
    if (!k) return;
    document.getElementById('kh-id').value = k.id;
    document.getElementById('kh-name').value = k.name || '';
    document.getElementById('kh-phone').value = k.phone || '';
    document.getElementById('kh-duty').value = k.duty || '';
    document.getElementById('kh-join').value = k.join_date || '';
    document.getElementById('kh-status').value = k.status || 'active';
    document.getElementById('kh-address').value = k.address || '';
    document.getElementById('kh-details').value = k.details || '';
    const t = document.getElementById('kh-form-title');
    if (t) t.textContent = esc(k.name) + ' — সম্পাদনা';
    document.getElementById('kh-panel-list').classList.add('hidden');
    document.getElementById('kh-panel-form').classList.add('active');
    document.getElementById('kh-panel-form').scrollTop = 0;
  }

  function daysBetween(from, to) {
    const a = new Date((from || '') + 'T12:00:00');
    const b = new Date((to || from || '') + 'T12:00:00');
    if (Number.isNaN(a.getTime()) || Number.isNaN(b.getTime())) return 0;
    return Math.max(1, Math.round((b - a) / 86400000) + 1);
  }

  function addNote(id) {
    const el = document.getElementById('kh-note-' + id);
    const text = el && el.value.trim();
    if (!text) { helpers.showToast('ঘটনা/নোট লিখুন'); return; }
    const rows = getKhadimin().map((k) => k.id === id ? { ...k, notes: [{ date: today(), text }].concat(k.notes || []) } : k);
    saveArr(KHADIMIN_KEY, rows);
    renderKhadimin();
  }

  function addLeave(id) {
    const from = document.getElementById('kh-leave-from-' + id).value;
    const to = document.getElementById('kh-leave-to-' + id).value || from;
    const reasonEl = document.getElementById('kh-leave-reason-' + id);
    const reason = reasonEl && reasonEl.value.trim();
    if (!from) { helpers.showToast('ক্যালেন্ডার থেকে ছুটির তারিখ বেছে নিন'); return; }
    const leaves = getLeaves();
    leaves.unshift({ id: uid(), khadim_id: id, from, to, reason, days: daysBetween(from, to) });
    saveArr(LEAVES_KEY, leaves);
    if (reasonEl) reasonEl.value = '';
    const t = new Date();
    const prev = document.getElementById('kh-detail-' + id);
    const wasOpen = prev && prev.classList.contains('open');
    leavePickState[id] = { vy: t.getFullYear(), vm: t.getMonth(), a: null, b: null };
    renderKhadimin();
    if (wasOpen) {
      const det = document.getElementById('kh-detail-' + id);
      if (det) det.classList.add('open');
      const hit = document.getElementById('kh-hit-' + id);
      if (hit) hit.setAttribute('aria-expanded', 'true');
      redrawLeaveCal(id);
    }
    helpers.showToast('ছুটির হিসাব যোগ হয়েছে ✓');
  }

  function pickLeaveDay(id, iso) {
    const st = ensureLeavePick(id);
    if (!st.a || (st.a && st.b)) {
      st.a = iso;
      st.b = null;
    } else if (iso < st.a) {
      st.b = st.a;
      st.a = iso;
    } else {
      st.b = iso;
    }
    redrawLeaveCal(id);
  }

  function leaveCalNav(id, delta) {
    const st = ensureLeavePick(id);
    let m = st.vm + delta;
    let y = st.vy;
    while (m < 0) { m += 12; y -= 1; }
    while (m > 11) { m -= 12; y += 1; }
    st.vm = m;
    st.vy = y;
    redrawLeaveCal(id);
  }

  function clearLeavePick(id) {
    const st = ensureLeavePick(id);
    st.a = null;
    st.b = null;
    redrawLeaveCal(id);
  }

  function renderKhadimin() {
    const rows = getKhadimin();
    const leaves = getLeaves();
    const el = document.getElementById('kh-list');
    if (!el) return;
    if (!rows.length) {
      el.innerHTML = '<div class="empty-state kh-list-empty"><span class="empty-icon">🤲</span><div class="empty-text">এখনো কোনো খাদেম যোগ করা হয়নি</div></div>';
      return;
    }
    el.innerHTML = rows.map((k) => {
      const qid = jsSingleQuote(k.id);
      const kLeaves = leaves.filter((l) => l.khadim_id === k.id);
      const totalDays = kLeaves.reduce((sum, l) => sum + (Number(l.days) || 0), 0);
      const notes = (k.notes || []).slice(0, 4).map((n) => `<div class="kh-note">${esc(n.date)} — ${esc(n.text)}</div>`).join('');
      const leaveRows = kLeaves.slice(0, 10).map((l) => `<div class="kh-leave-row"><span>${esc(l.from)} → ${esc(l.to || l.from)}${l.reason ? ' · ' + esc(l.reason) : ''}</span><strong>${helpers.toBn(l.days)} দিন</strong></div>`).join('');
      const st = k.status || 'active';
      const pcl = st === 'away' ? 'kh-pill--away' : st === 'inactive' ? 'kh-pill--inactive' : 'kh-pill--active';
      return `<article class="kh-card-wrap">
        <div class="kh-compact">
          <button type="button" class="kh-main-hit" id="kh-hit-${k.id}" onclick="MDRHomePanels.toggleDetail('${qid}')" aria-expanded="false">
            <div class="kh-av" aria-hidden="true">${initialChar(k.name)}</div>
            <div class="kh-row-text">
              <span class="kh-name">${esc(k.name)}</span>
              <div class="kh-meta kh-meta--1l">${esc(k.duty || 'দায়িত্ব —')} · ${esc(k.phone || 'ফোন নেই')}</div>
            </div>
            <div class="kh-row-side">
              <span class="kh-pill ${pcl}">${statusLabel(st)}</span>
              <span class="kh-pill">ছুটি ${helpers.toBn(totalDays)} দিন</span>
              <span class="kh-chev">▼</span>
            </div>
          </button>
          <button type="button" class="kh-edit" onclick="MDRHomePanels.editKhadim('${qid}')">সম্পাদনা</button>
        </div>
        <div class="kh-detail" id="kh-detail-${k.id}">
          <div class="kh-subtitle">ঘটনা / অবস্থা</div>
          ${notes || '<div class="kh-note">কোনো নোট নেই</div>'}
          <textarea class="form-input" id="kh-note-${k.id}" rows="2" placeholder="নতুন ঘটনা বা অবস্থা লিখুন"></textarea>
          <button type="button" class="kh-mini-btn gold" style="margin-top:6px" onclick="MDRHomePanels.addNote('${qid}')">ঘটনা যোগ করুন</button>
          <div class="kh-subtitle">আগের ছুটি</div>
          <div class="kh-leave-scroll">${leaveRows || '<div class="kh-note">কোনো ছুটির রেকর্ড নেই</div>'}</div>
          <div class="kh-subtitle">নতুন ছুটি — ক্যালেন্ডারে প্রথমে শুরুর দিন, তারপর শেষ দিন টোকা দিন (এক দিন হলে দুবার একই দিন)</div>
          <div class="kh-cal"><div id="kh-cal-host-${k.id}"></div></div>
          <input type="hidden" id="kh-leave-from-${k.id}" value="">
          <input type="hidden" id="kh-leave-to-${k.id}" value="">
          <input class="form-input" id="kh-leave-reason-${k.id}" placeholder="ছুটির কারণ" style="margin-top:8px">
          <button type="button" class="kh-mini-btn gold" style="margin-top:8px;width:100%" onclick="MDRHomePanels.addLeave('${qid}')">ছুটি সংরক্ষণ করুন</button>
        </div>
      </article>`;
    }).join('');
  }

  function statusLabel(status) {
    return status === 'away' ? 'ছুটিতে' : status === 'inactive' ? 'নিষ্ক্রিয়' : 'সক্রিয়';
  }

  function toggleDetail(id) {
    const el = document.getElementById('kh-detail-' + id);
    const hit = document.getElementById('kh-hit-' + id);
    if (!el) return;
    const opening = !el.classList.contains('open');
    el.classList.toggle('open');
    if (hit) hit.setAttribute('aria-expanded', opening ? 'true' : 'false');
    if (opening) {
      const t = new Date();
      leavePickState[id] = { vy: t.getFullYear(), vm: t.getMonth(), a: null, b: null };
      redrawLeaveCal(id);
    }
  }

  function scopeDepts() {
    if (global.MMSession && MMSession.getAllowedMadrasaDepts) {
      const allowed = MMSession.getAllowedMadrasaDepts();
      if (allowed && allowed.length) return allowed;
    }
    return ['kitab', 'maktab'];
  }

  function absentRows() {
    const depts = scopeDepts();
    return depts
      .flatMap((dept) => API.Attendance.getStudentsWithAbsentSortedByDept(dept).map((x) => ({ ...x, dept })))
      .sort((a, b) => (b.absentDays || 0) - (a.absentDays || 0));
  }

  function renderAbsent() {
    const rows = absentRows();
    const el = document.getElementById('abs-home-list');
    if (!el) return;
    if (!rows.length) {
      el.innerHTML = '<div class="empty-state"><span class="empty-icon">✓</span><div class="empty-text">কোনো ছাত্রের অনুপস্থিত রেকর্ড নেই</div></div>';
      return;
    }
    el.innerHTML = rows.map((x, i) => {
      const cls = API.Classes.getById(x.student.class_id);
      const deptLabel = x.dept === 'maktab' ? 'মক্তব বিভাগ' : 'কিতাব বিভাগ';
      return `<div class="abs-row-home">
        <div class="abs-rank-home">${helpers.toBn(i + 1)}</div>
        <div class="abs-info-home">
          <div class="abs-name-home"><button type="button" class="s-name-btn" style="font-size:14px;font-weight:600" onclick="MMStudentModal.open('${x.student.id}')">${esc(x.student.name)}</button></div>
          <div class="abs-meta-home">${esc(cls ? cls.name : '—')} · ${esc(deptLabel)} · রোল ${esc(x.student.roll || '—')}</div>
        </div>
        <div class="abs-days-home">${helpers.toBn(x.absentDays)} দিন</div>
      </div>`;
    }).join('');
  }

  function updateCards() {
    const kh = document.getElementById('m-khadimin');
    const ab = document.getElementById('m-absent-list');
    if (kh) kh.textContent = helpers.toBn(getKhadimin().filter((k) => k.status !== 'inactive').length);
    if (ab && global.API && API.Attendance) ab.textContent = helpers.toBn(absentRows().length);
  }

  function openKhadimin() {
    injectOnce();
    renderKhadimin();
    showList();
    document.getElementById('modal-khadimin').classList.add('open');
  }

  function closeKhadimin() {
    document.getElementById('modal-khadimin').classList.remove('open');
  }

  function openAbsent() {
    injectOnce();
    renderAbsent();
    document.getElementById('modal-absent-home').classList.add('open');
  }

  function closeAbsent() {
    document.getElementById('modal-absent-home').classList.remove('open');
  }

  /** প্রথম চালু: localStorage-এ `mm_khadimin` কখনো সেট হয়নি হলে MMSampleData থেকে নমুনা ভরে */
  function ensureKhadiminDemoSeed() {
    if (localStorage.getItem(KHADIMIN_KEY) !== null) return;
    const build = global.MMSampleData && typeof global.MMSampleData.buildKhadiminDemo === 'function'
      ? global.MMSampleData.buildKhadiminDemo
      : null;
    if (!build) return;
    const pack = build();
    if (!pack || !Array.isArray(pack.khadimin)) return;
    saveArr(KHADIMIN_KEY, pack.khadimin);
    if (Array.isArray(pack.khadimin_leaves)) saveArr(LEAVES_KEY, pack.khadimin_leaves);
  }

  function init(opts) {
    helpers = { ...helpers, ...(opts || {}) };
    ensureKhadiminDemoSeed();
    injectOnce();
    updateCards();
  }

  global.MDRHomePanels = {
    init,
    updateCards,
    openKhadimin,
    closeKhadimin,
    showList,
    showAddForm,
    saveKhadim,
    editKhadim,
    toggleDetail,
    addNote,
    addLeave,
    pickLeaveDay,
    leaveCalNav,
    clearLeavePick,
    openAbsent,
    closeAbsent,
  };
})(typeof window !== 'undefined' ? window : globalThis);
