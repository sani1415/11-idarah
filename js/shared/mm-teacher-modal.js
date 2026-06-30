/**
 * মেইন এডমিন: শিক্ষক প্রোফাইল — দপ্তরের ছাত্র মডাল (mm-student-modal) এর মতো
 * ট্যাব: সম্পূর্ণ তথ্য | বেতন | লগ | বর্ষ
 */
(function (global) {
  'use strict';

  var MODAL_ID = 'modal-teacher-detail';

  function getApi() {
    if (global.API && global.API.Teachers) return global.API;
    if (typeof API !== 'undefined' && API && API.Teachers) return API;
    return null;
  }

  function toBn(n) {
    if (typeof global.toBn === 'function') return global.toBn(n);
    return String(n).replace(/[0-9]/g, function (d) {
      return '০১২৩৪৫৬৭৮৯'[d];
    });
  }

  function initialChar(name) {
    if (!name || !String(name).trim()) return '?';
    var t = String(name).trim();
    if (typeof Array.from === 'function') {
      var arr = Array.from(t);
      return (arr[0] || '?');
    }
    return t[0] || '?';
  }

  function close() {
    var el = document.getElementById(MODAL_ID);
    if (el) el.classList.remove('open');
  }

  function switchTab(key) {
    var root = document.getElementById('mtch-tabs-wrap');
    if (!root) return;
    root.querySelectorAll('.st-tab').forEach(function (btn) {
      var on = btn.getAttribute('data-tab') === key;
      btn.classList.toggle('st-tab--on', on);
      btn.setAttribute('aria-selected', on ? 'true' : 'false');
    });
    root.querySelectorAll('.st-tab-panel').forEach(function (p) {
      p.classList.toggle('st-tab-panel--on', p.getAttribute('data-panel') === key);
    });
  }

  function ensureModal() {
    if (document.getElementById(MODAL_ID)) return;
    var wrap = document.createElement('div');
    wrap.id = MODAL_ID;
    wrap.className = 'modal-bg';
    wrap.innerHTML =
      '<div class="modal modal--student" id="mtch-inner">' +
      '<div class="st-modal-hd">' +
      '<div class="st-modal-hd-main">' +
      '<div class="st-avatar" id="mtch-avatar" aria-hidden="true">' +
      '<span class="st-avatar-ph" id="mtch-avatar-ph">?</span>' +
      '</div>' +
      '<div class="st-modal-texts">' +
      '<h2 id="mtch-title">শিক্ষক</h2>' +
      '<p class="st-modal-sub" id="mtch-sub">—</p>' +
      '</div></div>' +
      '<button type="button" class="modal-close" id="mtch-close" aria-label="বন্ধ">✕</button>' +
      '</div>' +
      '<div id="mtch-tabs-wrap"></div>' +
      '</div>';

    wrap.addEventListener('click', function (e) {
      if (e.target.id === MODAL_ID) close();
    });
    var inner = wrap.querySelector('#mtch-inner');
    if (inner) inner.addEventListener('click', function (e) { e.stopPropagation(); });
    var btn = wrap.querySelector('#mtch-close');
    if (btn) btn.addEventListener('click', function () { close(); });

    document.body.appendChild(wrap);
  }

  function kv(lbl, val) {
    return (
      '<div class="st-kv-item"><div class="st-kv-lbl">' + lbl + '</div><div class="st-kv-val">' + val + '</div></div>'
    );
  }

  function open(tid) {
    var API = getApi();
    if (!API) return;
    var t = API.Teachers.getById(tid);
    if (!t) {
      if (typeof global.showToast === 'function') global.showToast('শিক্ষক পাওয়া যায়নি');
      return;
    }
    ensureModal();

    var cls = t.class_id ? API.Classes.getById(t.class_id) : null;
    var cname = cls && cls.name ? cls.name : '—';
    var students = cls ? API.Students.getByClass(cls.id) : [];
    var stuN = students.length;
    var dept = cls && cls.dept === 'maktab' ? 'মক্তব' : cls && cls.dept === 'kitab' ? 'কিতাব' : '—';
    var sub = cname + ' · ' + toBn(stuN) + ' জন ছাত্র';

    var ph = document.getElementById('mtch-avatar-ph');
    if (ph) ph.textContent = initialChar(t.name);

    var titleEl = document.getElementById('mtch-title');
    var subEl = document.getElementById('mtch-sub');
    if (titleEl) titleEl.textContent = t.name || 'শিক্ষক';
    if (subEl) subEl.textContent = sub;

    var phone = t.phone || '—';
    var addr = t.address || '—';
    var father = t.father_name ? API.esc(t.father_name) : '—';
    var sal = t.salary != null ? '৳' + toBn(t.salary) : '—';
    var note = t.admin_note ? API.esc(t.admin_note) : '—';

    var infoBlock =
      '<div class="st-kv-grid">' +
      kv('বিভাগ', API.esc(dept)) +
      kv('আমন্ত্রিত বর্ষ / শ্রেণি', API.esc(cname)) +
      kv('যোগাযোগ (ফোন)', API.esc(phone)) +
      kv('ঠিকানা', API.esc(addr)) +
      kv('পিতার নাম', father) +
      kv('বেতন (সর্বশেষ)', sal) +
      kv('অ্যাডমিন নোট', note) +
      '</div>';

    var salHist = t.salary_history;
    var salPanel;
    if (Array.isArray(salHist) && salHist.length) {
      salPanel =
        '<div class="st-kv-grid" style="margin-bottom:8px">' +
        kv('সর্বশেষ বেতন', sal) +
        '</div>' +
        '<div class="st-block" style="margin-top:0;border-top:none;padding-top:0"><h4>বেতনের ইতিহাস</h4>' +
        salHist
          .map(function (h) {
            return (
              '<div class="st-logline">' +
              (h.amount != null ? '<strong>৳' + toBn(h.amount) + '</strong> · ' : '') +
              API.esc(h.note || '') +
              '<small>' +
              API.esc(h.date || '') +
              '</small></div>'
            );
          })
          .join('') +
        '</div>';
    } else {
      salPanel =
        '<div class="st-kv-grid">' + kv('বর্তমান স্কেল', sal) + '</div>' +
        '<div class="st-empty" style="margin-top:8px">কোনো পৃথক বেতন ইতিহাস সারি নেই।</div>';
    }

    var logs = API.Logs.getByTeacher(tid);
    var logsPanel;
    if (logs.length) {
      logsPanel = logs
        .slice(0, 20)
        .map(function (L) {
          return (
            '<div class="st-logline">' +
            API.esc(L.text) +
            '<small>' +
            API.esc(L.date) +
            (L.by ? ' · ' + API.esc(L.by) : '') +
            '</small></div>'
          );
        })
        .join('');
    } else {
      logsPanel = '<div class="st-empty">কোনো পর্যবেক্ষণ লগ নেই।</div>';
    }

    var classPanel;
    if (cls) {
      var preview = students
        .slice(0, 6)
        .map(function (s) {
          return '<li style="margin:4px 0;font-size:13px;">' + API.esc(s.name) + (s.roll ? ' <span style="color:var(--ink3);font-size:11px">· ' + API.escBn(String(s.roll)) + '</span>' : '') + '</li>';
        })
        .join('');
      classPanel =
        '<p style="font-size:13px;color:var(--ink2);line-height:1.5;margin:0 0 10px"><strong>' + API.esc(cname) + '</strong> · মোট ' + toBn(stuN) + ' জন</p>' +
        (preview ? '<ul style="margin:0 0 12px 18px;padding:0;list-style:disc;">' + preview + (students.length > 6 ? '<li style="color:var(--ink3)">… ও আরও</li>' : '') + '</ul>' : '<p class="st-empty" style="padding:8px 0">এ বর্ষে কোনো ছাত্র নেই।</p>') +
        '<button type="button" class="submit-btn" style="width:100%;padding:12px" onclick=\'MMTeacherModal.closeAndOpenClass(' + JSON.stringify(cls.id) + ')\'>বর্ষের সম্পূর্ণ প্যানেল</button>';
    } else {
      classPanel = '<div class="st-empty">কোনো বর্ষ নির্ধারিত নেই।</div>';
    }

    var escTab = 'MMTeacherModal.switchTab';
    var tw = document.getElementById('mtch-tabs-wrap');
    if (tw) {
      tw.innerHTML =
        '<div class="st-tabs" role="tablist">' +
        '<button type="button" class="st-tab st-tab--on" data-tab="info" role="tab" aria-selected="true" onclick="' + escTab + '(\'info\')">সম্পূর্ণ তথ্য</button>' +
        '<button type="button" class="st-tab" data-tab="sal" role="tab" aria-selected="false" onclick="' + escTab + '(\'sal\')">বেতন</button>' +
        '<button type="button" class="st-tab" data-tab="log" role="tab" aria-selected="false" onclick="' + escTab + '(\'log\')">লগ</button>' +
        '<button type="button" class="st-tab" data-tab="cls" role="tab" aria-selected="false" onclick="' + escTab + '(\'cls\')">বর্ষ</button>' +
        '</div><div class="st-tab-panels">' +
        '<div class="st-tab-panel st-tab-panel--on" data-panel="info" id="mtch-panel-info">' + infoBlock + '</div>' +
        '<div class="st-tab-panel" data-panel="sal" id="mtch-panel-sal">' + salPanel + '</div>' +
        '<div class="st-tab-panel" data-panel="log" id="mtch-panel-log">' + logsPanel + '</div>' +
        '<div class="st-tab-panel" data-panel="cls" id="mtch-panel-cls">' + classPanel + '</div>' +
        '</div>';
    }

    var modal = document.getElementById(MODAL_ID);
    if (modal) modal.classList.add('open');
  }

  function closeAndOpenClass(cid) {
    close();
    if (typeof global.openClassOverlay === 'function') {
      global.openClassOverlay(cid);
    }
  }

  global.MMTeacherModal = { open: open, close: close, switchTab: switchTab, closeAndOpenClass: closeAndOpenClass };
})(typeof window !== 'undefined' ? window : this);
