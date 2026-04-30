'use strict';
/* global MdrAccAPI, renderAccountsReports, openModal, closeModal, showToast */

/* ── global state (settable from inline onclick) ── */
var _tab      = 'summary';
var _accF     = 'all';
var _monF     = 'all';
var _dayF     = 'all';
var _sortF    = 'date_asc';
var _dueAccF  = 'all';
var _fromKey  = 'all';
var _toKey    = 'all';
var _sumMonth = 'all';
var _accDefaulted = false;

(function () {
  var A   = MdrAccAPI;
  var esc = function (s) { return A.esc(s); };
  var fa  = function (n) { return A.fa(n); };
  var bn  = function (s) { return String(s || '').replace(/[0-9]/g, function (d) { return '০১২৩৪৫৬৭৮৯'[d]; }); };

  /* ── inject CSS once ── */

  function ensureCurrentMonthDefault() {
    if (_accDefaulted) return;
    var current = A.todayHijri().month;
    _sumMonth = current || 'all';
    _monF = current || 'all';
    _accDefaulted = true;
  }

  if (!document.getElementById('acc-style')) {
    var cs = document.createElement('style');
    cs.id = 'acc-style';
    cs.textContent = `
.acc-shell{padding-top:2px}
.acc-add-btns{display:grid;grid-template-columns:1fr 1fr;gap:8px;padding:2px 12px 8px}
.acc-btn{position:relative;overflow:hidden;padding:10px 0;border:none;border-radius:14px;font-size:13px;font-weight:800;cursor:pointer;font-family:inherit;box-shadow:0 8px 18px rgba(26,18,8,.08)}
.acc-btn:active{transform:scale(.98)}
.acc-btn-inc{background:linear-gradient(135deg,#dcfce7,#bbf7d0);color:#065f46}
.acc-btn-exp{background:linear-gradient(135deg,#fee2e2,#fecaca);color:#991b1b}
.acc-tabs{display:flex;margin:0 12px 8px;padding:4px;gap:4px;overflow-x:auto;scrollbar-width:none;background:rgba(255,255,255,.72);border:1px solid rgba(26,18,8,.07);border-radius:16px;box-shadow:inset 0 1px 0 rgba(255,255,255,.7)}
.acc-tab-btn{padding:7px 11px;border:none;border-radius:12px;background:none;cursor:pointer;font-size:11px;color:var(--ink3);white-space:nowrap;font-family:inherit}
.acc-tab-btn.active{color:#fff;background:linear-gradient(135deg,var(--gold),#9a6a21);font-weight:800;box-shadow:0 6px 14px rgba(154,106,33,.23)}
.acc-content{padding:0 12px 12px}
.acc-dashboard{background:linear-gradient(160deg,#fffaf0,#f4eadb);border:1px solid rgba(154,106,33,.16);border-radius:20px;padding:12px;box-shadow:0 14px 34px rgba(26,18,8,.08);position:relative;overflow:hidden}
.acc-dashboard:before{content:"";position:absolute;inset:-60px -40px auto auto;width:140px;height:140px;border-radius:50%;background:rgba(184,134,45,.12)}
.acc-topline{display:flex;align-items:center;gap:8px;margin-bottom:10px;position:relative}
.acc-topline .acc-sel{max-width:180px;margin-left:auto;background:#fff}
.acc-period{font-size:11px;color:var(--ink3);font-weight:700}
.acc-metrics{display:grid;grid-template-columns:repeat(2,1fr);gap:7px;margin-bottom:10px;position:relative}
.acc-metric{background:rgba(255,255,255,.82);border:1px solid rgba(26,18,8,.06);border-radius:16px;padding:10px 9px;box-shadow:0 6px 16px rgba(26,18,8,.06)}
.acc-metric-lbl{font-size:10px;color:var(--ink3);margin-bottom:4px}
.acc-metric-val{font-family:'Noto Serif Bengali',serif;font-size:15px;font-weight:800;color:var(--ink2);white-space:nowrap}
.acc-metric.good .acc-metric-val{color:var(--green)}.acc-metric.bad .acc-metric-val{color:var(--red)}.acc-metric.warn .acc-metric-val{color:var(--gold)}
.acc-ledger-card{background:#fff;border:1px solid rgba(26,18,8,.07);border-radius:16px;overflow:hidden;position:relative}
.acc-ledger-title{display:flex;align-items:center;justify-content:space-between;padding:10px 11px;border-bottom:1px solid var(--cream2);font-size:12px;font-weight:800;color:var(--ink2)}
.acc-sum-tbl{width:100%;border-collapse:separate;border-spacing:0;font-size:12px}
.acc-sum-tbl th{background:#faf3e8;padding:8px 8px;text-align:right;font-weight:800;font-size:10px;color:var(--ink3)}
.acc-sum-tbl th:first-child{text-align:right}
.acc-sum-tbl td{padding:8px;border-bottom:1px solid rgba(26,18,8,.06);text-align:right;background:#fff}
.acc-sum-tbl tbody tr:nth-child(even) td{background:#fffaf2}
.acc-sum-tbl tfoot td{font-weight:800;border-top:1px solid var(--cream3);background:#f8eddc}
.acc-sum-row{cursor:pointer}
.acc-sum-row:hover td{background:#fff4d9}
.acc-sum-row:focus{outline:2px solid rgba(154,106,33,.32);outline-offset:-2px}
.acc-money-hero{background:linear-gradient(145deg,#fff,#fff4d9);border:1px solid rgba(184,134,45,.18);border-radius:22px;padding:14px;margin-bottom:10px;box-shadow:0 14px 32px rgba(154,106,33,.1);position:relative;overflow:hidden}
.acc-money-hero:after{content:"";position:absolute;left:-30px;top:-45px;width:120px;height:120px;border-radius:50%;background:rgba(184,134,45,.12)}
.acc-money-label{font-size:11px;color:var(--ink3);font-weight:800;position:relative}
.acc-money-main{font-family:'Noto Serif Bengali',serif;font-size:24px;font-weight:900;color:var(--ink2);position:relative;margin-top:3px}
.acc-money-main.good{color:var(--green)}.acc-money-main.bad{color:var(--red)}
.acc-break-row{display:grid;grid-template-columns:1.05fr .9fr .75fr .7fr;gap:0;align-items:center}
.acc-break-name{font-weight:900;color:var(--ink2)}
.acc-pct-track{height:7px;background:#f3eadc;border-radius:999px;overflow:hidden;margin-top:5px}
.acc-pct-fill{height:100%;background:linear-gradient(90deg,var(--gold),#d8aa55);border-radius:999px}
.acc-ledger-list{display:grid;gap:8px}
.acc-ledger-row{background:rgba(255,255,255,.92);border:1px solid rgba(26,18,8,.07);border-radius:16px;padding:10px 11px;box-shadow:0 7px 18px rgba(26,18,8,.055)}
.acc-ledger-grid{display:grid;grid-template-columns:74px 1fr auto;gap:9px;align-items:center}
.acc-ledger-date{font-size:11px;color:var(--ink3);font-weight:900;background:#fff8e8;border:1px solid rgba(154,106,33,.14);border-radius:12px;padding:7px 6px;text-align:center}
.acc-ledger-desc{font-size:13px;font-weight:900;color:var(--ink2);line-height:1.25}
.acc-ledger-meta{font-size:10px;color:var(--ink3);font-weight:700;margin-top:3px}
.acc-ledger-amt{font-family:'Noto Serif Bengali',serif;font-size:14px;font-weight:900;color:var(--red);white-space:nowrap}
.acc-ledger-table{margin-top:8px;border-top:1px dashed rgba(26,18,8,.12);padding-top:7px;display:grid;grid-template-columns:1fr 1fr;gap:4px 8px;font-size:10px;color:var(--ink3)}
.acc-ledger-table b{color:var(--ink2);font-size:11px}
.acc-table-wrap{overflow:auto;border:1px solid rgba(26,18,8,.07);border-radius:16px;background:#fff;max-height:58vh}
.acc-detail-head{display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:10px;flex-wrap:wrap}
.acc-detail-total{font-family:'Noto Serif Bengali',serif;font-weight:900;color:var(--red);background:#fff4d9;border:1px solid rgba(154,106,33,.16);border-radius:999px;padding:6px 10px;white-space:nowrap}
.acc-detail-table{width:100%;min-width:760px;border-collapse:separate;border-spacing:0;font-size:12px}
.acc-detail-table th{position:sticky;top:0;background:#faf3e8;color:var(--ink3);font-size:10px;font-weight:900;text-align:right;padding:9px 8px;border-bottom:1px solid rgba(26,18,8,.08);z-index:1}
.acc-detail-table td{padding:9px 8px;border-bottom:1px solid rgba(26,18,8,.06);white-space:nowrap;text-align:right;background:#fff}
.acc-detail-table tbody tr:nth-child(even) td{background:#fffaf2}
.acc-detail-table .acc-desc-cell{white-space:normal;min-width:170px;color:var(--ink2);font-weight:800}
.acc-expense-wrap{overflow:auto;border:1px solid rgba(26,18,8,.07);border-radius:17px;background:#fff;max-height:60vh;box-shadow:0 10px 24px rgba(26,18,8,.055)}
.acc-expense-table{width:100%;min-width:820px;border-collapse:separate;border-spacing:0;font-size:12px}
.acc-expense-table th{position:sticky;top:0;background:#faf3e8;color:var(--ink3);font-size:10px;font-weight:900;text-align:right;padding:9px 8px;border-bottom:1px solid rgba(26,18,8,.08);z-index:1}
.acc-expense-table td{padding:9px 8px;border-bottom:1px solid rgba(26,18,8,.06);white-space:nowrap;text-align:right;background:#fff}
.acc-expense-table tbody tr:nth-child(even) td{background:#fffaf2}
.acc-expense-table .acc-desc-cell{white-space:normal;min-width:170px;color:var(--ink2);font-weight:800}
.acc-expense-table .acc-ledger-amt{font-size:13px}
.acc-filter-bar{display:flex;gap:8px;margin-bottom:10px;flex-wrap:wrap}
.acc-sel{font-size:12px;border:1px solid var(--cream2);border-radius:8px;padding:6px 10px;background:#fff;color:var(--ink1);flex:1;min-width:90px;font-family:inherit}
.acc-list-item{background:#fff;border-radius:8px;padding:10px 12px;box-shadow:0 1px 3px rgba(0,0,0,.07);margin-bottom:6px}
.acc-list-top{display:flex;justify-content:space-between;align-items:flex-start;gap:4px}
.acc-list-desc{font-size:13px;font-weight:600;flex:1;line-height:1.3}
.acc-list-amt{font-weight:700;font-size:14px;white-space:nowrap}
.acc-list-amt.inc{color:var(--green)}.acc-list-amt.exp{color:var(--red)}
.acc-list-meta{font-size:11px;color:var(--ink3);margin-top:3px}
.acc-day-group{margin-bottom:10px;background:rgba(255,255,255,.55);border:1px solid rgba(26,18,8,.06);border-radius:14px;padding:8px}
.acc-day-head{display:flex;align-items:center;justify-content:space-between;font-size:12px;font-weight:800;color:var(--ink2);margin-bottom:7px}
.acc-day-head span:last-child{color:var(--red);font-family:'Noto Serif Bengali',serif}
.acc-date-btn{font-size:12px;border:1px solid var(--cream2);border-radius:10px;padding:7px 10px;background:#fff;color:var(--ink1);min-width:118px;cursor:pointer;font-family:inherit;text-align:right}
.acc-date-btn.is-on{border-color:rgba(184,134,45,.45);background:#fff8e8;box-shadow:0 4px 12px rgba(154,106,33,.12)}
.acc-date-clear{border:none;background:rgba(193,68,14,.08);color:var(--red);border-radius:10px;padding:7px 10px;font-size:12px;cursor:pointer;font-family:inherit}
.acc-toolbar{display:flex;align-items:center;gap:7px;margin-bottom:8px;flex-wrap:nowrap}
.acc-tool-btn{border:1px solid rgba(154,106,33,.18);background:rgba(255,255,255,.9);color:var(--ink2);border-radius:13px;padding:8px 11px;font-size:12px;font-weight:800;cursor:pointer;font-family:inherit;box-shadow:0 5px 14px rgba(26,18,8,.06);white-space:nowrap}
.acc-tool-btn.is-on{background:linear-gradient(135deg,#fff8e8,#f4eadb);border-color:rgba(154,106,33,.36);color:#7a5118}
.acc-sort-btn{width:38px;padding:8px 0;font-size:16px}
.acc-chipline{display:flex;gap:5px;overflow-x:auto;scrollbar-width:none;margin:-2px 0 8px}
.acc-chip{font-size:10px;color:var(--ink3);background:rgba(255,255,255,.72);border:1px solid rgba(26,18,8,.06);border-radius:999px;padding:4px 8px;white-space:nowrap}
.acc-sheet-backdrop{position:fixed;inset:0;background:rgba(26,18,8,.28);z-index:9997;display:flex;align-items:flex-end;justify-content:center;padding:12px}
.acc-sheet{width:min(430px,100%);background:#fffaf1;border:1px solid rgba(154,106,33,.2);border-radius:22px 22px 18px 18px;box-shadow:0 22px 64px rgba(26,18,8,.25);padding:12px;animation:accCalIn .16s ease-out}
.acc-sheet-head{display:flex;align-items:center;justify-content:space-between;margin-bottom:10px}
.acc-sheet-title{font-family:'Noto Serif Bengali',serif;font-size:15px;font-weight:800;color:var(--ink2)}
.acc-sheet-close{border:none;background:rgba(26,18,8,.06);border-radius:50%;width:30px;height:30px;cursor:pointer;color:var(--ink2)}
.acc-sheet-grid{display:grid;grid-template-columns:1fr;gap:9px}
.acc-sheet-field label{display:block;font-size:10px;color:var(--ink3);font-weight:800;margin:0 0 4px}
.acc-sort-list{display:grid;gap:7px}
.acc-sort-opt{border:1px solid rgba(26,18,8,.07);background:#fff;border-radius:12px;padding:10px;text-align:right;font-family:inherit;font-size:12px;cursor:pointer;color:var(--ink2)}
.acc-sort-opt.is-on{background:linear-gradient(135deg,var(--gold),#9a6a21);color:#fff;font-weight:800;border-color:transparent}
.acc-range-picks{display:grid;grid-template-columns:1fr 1fr;gap:7px;margin-bottom:10px}
.acc-range-pick{border:1px solid rgba(26,18,8,.08);background:#fff;border-radius:13px;padding:8px;font-family:inherit;text-align:right;color:var(--ink2);cursor:pointer}
.acc-range-pick small{display:block;color:var(--ink3);font-size:9px;margin-bottom:2px}.acc-range-pick.is-on{border-color:rgba(154,106,33,.45);background:#fff8e8}
.acc-cal-backdrop{position:fixed;inset:0;background:rgba(26,18,8,.32);z-index:9998;display:flex;align-items:flex-end;justify-content:center;padding:12px}
.acc-cal{width:min(430px,100%);background:#fffaf1;border:1px solid rgba(154,106,33,.22);border-radius:22px 22px 18px 18px;box-shadow:0 24px 70px rgba(26,18,8,.28);padding:12px;animation:accCalIn .16s ease-out}
.acc-cal-head{display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:10px}
.acc-cal-title{font-family:'Noto Serif Bengali',serif;font-weight:800;color:var(--ink2);font-size:15px}
.acc-cal-close{border:none;background:rgba(26,18,8,.06);border-radius:50%;width:30px;height:30px;cursor:pointer;color:var(--ink2)}
.acc-cal-year{display:flex;gap:8px;margin-bottom:10px}.acc-cal-year input{flex:1;text-align:center}
.acc-cal-months{display:grid;grid-template-columns:repeat(3,1fr);gap:6px;margin-bottom:10px}
.acc-cal-month,.acc-cal-day{border:1px solid rgba(26,18,8,.07);background:#fff;border-radius:11px;padding:8px 4px;font-family:inherit;cursor:pointer;color:var(--ink2)}
.acc-cal-month.is-on,.acc-cal-day.is-on{background:linear-gradient(135deg,var(--gold),#9a6a21);color:#fff;font-weight:800;border-color:transparent;box-shadow:0 7px 15px rgba(154,106,33,.2)}
.acc-cal-days{display:grid;grid-template-columns:repeat(6,1fr);gap:6px}
@keyframes accCalIn{from{transform:translateY(16px);opacity:.7}to{transform:none;opacity:1}}
.acc-del-btn{background:none;border:none;color:var(--ink3);cursor:pointer;font-size:14px;padding:0 4px;line-height:1}
.acc-pay-btn{font-size:11px;border:1px solid var(--gold);color:var(--gold);background:none;border-radius:6px;padding:3px 8px;cursor:pointer;font-family:inherit}
.acc-empty{text-align:center;padding:30px;color:var(--ink3);font-size:13px}
.acc-cat-row{display:flex;justify-content:space-between;align-items:center;padding:6px 10px;border-radius:6px;background:#fff;margin-bottom:4px;font-size:13px;box-shadow:0 1px 2px rgba(0,0,0,.05)}
.acc-item-row{background:var(--cream1);border-radius:8px;padding:8px;margin-bottom:6px;position:relative}
.acc-item-del{position:absolute;top:6px;right:6px;background:none;border:none;color:var(--red);cursor:pointer;font-size:13px;padding:0;line-height:1}
.acc-item-row .form-row{gap:4px;margin:0 0 4px}
.acc-item-row .form-group{margin:0}
.acc-item-row .form-input{font-size:12px;padding:6px 8px}
.acc-item-row select.form-input{padding:5px 8px}`;
    document.head.appendChild(cs);
  }

  /* ══════════════ EXPENSE ITEMS STATE ══════════════ */
  var _items = [];
  function _blank() { return { category: '', description: '', quantity: '', unit: 'কেজি', unitPrice: '', amount: '' }; }

  function _renderItems() {
    var c = document.getElementById('acc-items-container');
    if (!c) return;
    var cats = A.Categories.getAll();
    c.innerHTML = _items.map(function (item, i) {
      var catOpts = cats.map(function (cat) {
        return '<option value="' + esc(cat) + '"' + (item.category === cat ? ' selected' : '') + '>' + esc(cat) + '</option>';
      }).join('');
      return '<div class="acc-item-row">' +
        (_items.length > 1 ? '<button type="button" class="acc-item-del" onclick="removeAccItem(' + i + ')">✕</button>' : '') +
        '<div class="form-row">' +
          '<div class="form-group" style="flex:1.5"><select class="form-input form-select" onchange="updateAccItem(' + i + ',\'category\',this.value)"><option value="">— খাত —</option>' + catOpts + '</select></div>' +
          '<div class="form-group" style="flex:2"><input class="form-input" value="' + esc(item.description) + '" placeholder="পণ্য / বিবরণ" oninput="updateAccItem(' + i + ',\'description\',this.value)"></div>' +
        '</div>' +
        '<div class="form-row">' +
          '<div class="form-group"><input class="form-input" value="' + (item.quantity || '') + '" type="number" placeholder="পরিমাণ" min="0" oninput="updateAccItem(' + i + ',\'quantity\',this.value)" style="width:100%"></div>' +
          '<div class="form-group"><input class="form-input" value="' + esc(item.unit) + '" placeholder="মাপ" oninput="updateAccItem(' + i + ',\'unit\',this.value)" style="width:100%"></div>' +
          '<div class="form-group"><input class="form-input" value="' + (item.unitPrice || '') + '" type="number" placeholder="একক মূল্য" min="0" oninput="updateAccItem(' + i + ',\'unitPrice\',this.value)" style="width:100%"></div>' +
          '<div class="form-group"><input class="form-input acc-item-amt" value="' + (item.amount || '') + '" type="number" placeholder="মোট" id="acc-item-amt-' + i + '" oninput="updateAccItem(' + i + ',\'amount\',this.value)" style="width:100%"></div>' +
        '</div>' +
      '</div>';
    }).join('');
    _updateGrandTotal();
  }

  function _updateGrandTotal() {
    var total = _items.reduce(function (s, x) { return s + (parseFloat(x.amount) || 0); }, 0);
    var el = document.getElementById('acc-grand-total');
    if (el) el.textContent = fa(total);
  }

  window.addAccItem     = function () { _items.push(_blank()); _renderItems(); };
  window.removeAccItem  = function (i) { _items.splice(i, 1); if (!_items.length) _items.push(_blank()); _renderItems(); };
  window.updateAccItem  = function (i, field, val) {
    if (!_items[i]) return;
    _items[i][field] = val;
    if (field === 'quantity' || field === 'unitPrice') {
      var q = parseFloat(_items[i].quantity) || 0;
      var p = parseFloat(_items[i].unitPrice) || 0;
      if (q && p) { _items[i].amount = q * p; var el = document.getElementById('acc-item-amt-' + i); if (el) el.value = _items[i].amount; }
    }
    _updateGrandTotal();
  };

  /* ══════════════ HIJRI DATE PICKER ══════════════ */
  function _keyParts(key) {
    var p = A.parseDateInput(key);
    var hd = A.todayHijri();
    return p || { year: hd.year, month: A.monthFromNo(hd.monthNo), day: hd.day };
  }
  function _dateBtn(label, key, field) {
    var has = key && key !== 'all';
    var text = has ? A.dateLabel({ dateKey: A.toDateKey(key), day: 1 }) : label;
    return '<button type="button" class="acc-date-btn' + (has ? ' is-on' : '') + '" onclick="openAccDatePicker(\'' + field + '\')">' + esc(text) + '</button>';
  }
  function _setPickerPreview() {
    var y = document.getElementById('acc-cal-year');
    var m = document.querySelector('.acc-cal-month.is-on');
    if (!y || !m) return;
    var year = y.value;
    var monthNo = m.getAttribute('data-month');
    document.querySelectorAll('.acc-cal-day').forEach(function (btn) {
      var day = btn.getAttribute('data-day');
      btn.setAttribute('data-key', A.dateKey(year, A.monthFromNo(monthNo), day));
    });
  }
  window._setPickerPreview = _setPickerPreview;
  window.openAccDatePicker = function (field) {
    var old = document.getElementById('acc-date-picker');
    if (old) old.remove();
    var current = field === 'entry' ? (document.getElementById('acc-date') || {}).value : (field === 'from' ? _fromKey : _toKey);
    var parts = _keyParts(current);
    var activeMonth = A.monthNo(parts.month) || 10;
    var months = A.HIJRI_MONTHS.map(function (m, i) {
      var no = i + 1;
      return '<button type="button" class="acc-cal-month' + (no === activeMonth ? ' is-on' : '') + '" data-month="' + no + '" onclick="selectAccCalMonth(this)">' + esc(m) + '</button>';
    }).join('');
    var days = Array.from({ length: 30 }, function (_, i) {
      var d = i + 1;
      return '<button type="button" class="acc-cal-day' + (d === A.num(parts.day) ? ' is-on' : '') + '" data-day="' + d + '" onclick="selectAccCalDay(\'' + field + '\',this)">' + bn(d) + '</button>';
    }).join('');
    var el = document.createElement('div');
    el.id = 'acc-date-picker';
    el.className = 'acc-cal-backdrop';
    el.innerHTML = '<div class="acc-cal" onclick="event.stopPropagation()">' +
      '<div class="acc-cal-head"><div class="acc-cal-title">হিজরী তারিখ নির্বাচন</div><button type="button" class="acc-cal-close" onclick="closeAccDatePicker()">✕</button></div>' +
      '<div class="acc-cal-year"><button type="button" class="acc-cal-month" onclick="stepAccCalYear(-1)">−</button><input class="form-input" id="acc-cal-year" type="number" value="' + esc(parts.year) + '" oninput="_setPickerPreview()"><button type="button" class="acc-cal-month" onclick="stepAccCalYear(1)">＋</button></div>' +
      '<div class="acc-cal-months">' + months + '</div><div class="acc-cal-days">' + days + '</div>' +
      '</div>';
    el.onclick = window.closeAccDatePicker;
    document.body.appendChild(el);
    _setPickerPreview();
  };
  window.closeAccDatePicker = function () {
    var el = document.getElementById('acc-date-picker');
    if (el) el.remove();
  };
  window.selectAccCalMonth = function (btn) {
    document.querySelectorAll('.acc-cal-month[data-month]').forEach(function (b) { b.classList.remove('is-on'); });
    btn.classList.add('is-on');
    _setPickerPreview();
  };
  window.stepAccCalYear = function (delta) {
    var y = document.getElementById('acc-cal-year');
    if (!y) return;
    y.value = A.num(y.value) + delta;
    _setPickerPreview();
  };
  window.selectAccCalDay = function (field, btn) {
    var key = btn.getAttribute('data-key');
    if (field === 'entry') {
      var input = document.getElementById('acc-date');
      if (input) input.value = key;
    } else if (field === 'from') {
      _fromKey = key; _monF = 'all'; _dayF = 'all';
    } else if (field === 'to') {
      _toKey = key; _monF = 'all'; _dayF = 'all';
    }
    window.closeAccDatePicker();
    if (field !== 'entry') window.renderAccounts();
  };
  window.clearAccDateRange = function () {
    _fromKey = 'all'; _toKey = 'all';
    window.renderAccounts();
  };
  function _sheet(title, body) {
    var old = document.getElementById('acc-sheet');
    if (old) old.remove();
    var el = document.createElement('div');
    el.id = 'acc-sheet';
    el.className = 'acc-sheet-backdrop';
    el.innerHTML = '<div class="acc-sheet" onclick="event.stopPropagation()">' +
      '<div class="acc-sheet-head"><div class="acc-sheet-title">' + esc(title) + '</div><button type="button" class="acc-sheet-close" onclick="closeAccSheet()">✕</button></div>' +
      body + '</div>';
    el.onclick = window.closeAccSheet;
    document.body.appendChild(el);
  }
  window.closeAccSheet = function () {
    var el = document.getElementById('acc-sheet');
    if (el) el.remove();
  };
  window.setAccFilter = function (field, value) {
    if (field === 'month') { _monF = value; _dayF = 'all'; _fromKey = 'all'; _toKey = 'all'; }
    if (field === 'day') _dayF = value;
    if (field === 'account') _accF = value;
  };
  window.applyAccFilters = function () {
    window.closeAccSheet();
    window.renderAccounts();
  };
  window.resetAccFilters = function () {
    _monF = 'all'; _dayF = 'all'; _accF = 'all';
    window.applyAccFilters();
  };
  window.openAccFilterSheet = function () {
    var months = A.Expense.months();
    if (_monF !== 'all' && months.indexOf(_monF) < 0) months.push(_monF);
    var monOpts = '<option value="all">সব মাস</option>' + months.map(function (m) { return '<option value="' + esc(m) + '"' + (_monF === m ? ' selected' : '') + '>' + esc(m) + '</option>'; }).join('');
    var dayOpts = '<option value="all">সব দিন</option>' + Array.from({ length: 30 }, function (_, i) { var d = String(i + 1); return '<option value="' + d + '"' + (String(_dayF) === d ? ' selected' : '') + '>' + bn(d) + ' তারিখ</option>'; }).join('') +
      '<option value="__none"' + (_dayF === '__none' ? ' selected' : '') + '>দিন নেই</option>';
    var accOpts = '<option value="all">সব হিসাব</option>' + Object.entries(A.ACCOUNT_LABELS).map(function (e) { return '<option value="' + e[0] + '"' + (_accF === e[0] ? ' selected' : '') + '>' + esc(e[1]) + '</option>'; }).join('');
    _sheet('ফিল্টার নির্বাচন', '<div class="acc-sheet-grid">' +
      '<div class="acc-sheet-field"><label>মাস</label><select class="acc-sel" onchange="setAccFilter(\'month\',this.value)">' + monOpts + '</select></div>' +
      '<div class="acc-sheet-field"><label>দিন</label><select class="acc-sel" onchange="setAccFilter(\'day\',this.value)">' + dayOpts + '</select></div>' +
      '<div class="acc-sheet-field"><label>হিসাব বই</label><select class="acc-sel" onchange="setAccFilter(\'account\',this.value)">' + accOpts + '</select></div>' +
      '<div class="acc-filter-bar" style="margin:4px 0 0"><button type="button" class="acc-btn acc-btn-inc" onclick="applyAccFilters()" style="border-radius:10px;flex:2">প্রয়োগ</button><button type="button" class="acc-date-clear" onclick="resetAccFilters()" style="flex:1">রিসেট</button></div></div>');
  };
  window.setAccSort = function (value) {
    _sortF = value;
    window.closeAccSheet();
    window.renderAccounts();
  };
  window.openAccSortSheet = function () {
    var opts = [
      ['date_asc','তারিখ: পুরাতন আগে'], ['date_desc','তারিখ: নতুন আগে'],
      ['amount_desc','টাকা: বেশি আগে'], ['amount_asc','টাকা: কম আগে'],
      ['newest','এন্ট্রি: নতুন আগে'], ['oldest','এন্ট্রি: পুরাতন আগে'],
    ].map(function (s) {
      return '<button type="button" class="acc-sort-opt' + (_sortF === s[0] ? ' is-on' : '') + '" onclick="setAccSort(\'' + s[0] + '\')">' + s[1] + '</button>';
    }).join('');
    _sheet('সাজানোর ধরন', '<div class="acc-sort-list">' + opts + '</div>');
  };
  var _rangeFocus = 'from';
  window.openAccRangeSheet = function () {
    _rangeFocus = _fromKey !== 'all' ? 'to' : 'from';
    var body = '<div class="acc-range-picks">' +
      '<button type="button" id="acc-range-from" class="acc-range-pick" onclick="setAccRangeFocus(\'from\')"><small>শুরু</small><span>' + esc(_fromKey === 'all' ? 'নির্বাচন করুন' : A.dateLabel({ dateKey: _fromKey, day: 1 })) + '</span></button>' +
      '<button type="button" id="acc-range-to" class="acc-range-pick" onclick="setAccRangeFocus(\'to\')"><small>শেষ</small><span>' + esc(_toKey === 'all' ? 'নির্বাচন করুন' : A.dateLabel({ dateKey: _toKey, day: 1 })) + '</span></button>' +
      '</div><div id="acc-range-cal"></div>' +
      '<button type="button" class="acc-date-clear" onclick="clearAccDateRange();closeAccSheet()" style="width:100%;margin-top:10px">তারিখ পরিষ্কার</button>';
    _sheet('তারিখ সীমা', body);
    window.setAccRangeFocus(_rangeFocus);
  };
  window.setAccRangeFocus = function (field) {
    _rangeFocus = field;
    var f = document.getElementById('acc-range-from'), t = document.getElementById('acc-range-to');
    if (f) f.classList.toggle('is-on', field === 'from');
    if (t) t.classList.toggle('is-on', field === 'to');
    var key = field === 'from' ? _fromKey : _toKey;
    var parts = _keyParts(key);
    var monthNo = A.monthNo(parts.month) || 10;
    var months = A.HIJRI_MONTHS.map(function (m, i) {
      var no = i + 1;
      return '<button type="button" class="acc-cal-month' + (no === monthNo ? ' is-on' : '') + '" data-month="' + no + '" onclick="selectAccCalMonth(this)">' + esc(m) + '</button>';
    }).join('');
    var days = Array.from({ length: 30 }, function (_, i) {
      var d = i + 1;
      return '<button type="button" class="acc-cal-day' + (d === A.num(parts.day) ? ' is-on' : '') + '" data-day="' + d + '" onclick="selectAccRangeDay(this)">' + bn(d) + '</button>';
    }).join('');
    var cal = document.getElementById('acc-range-cal');
    if (cal) cal.innerHTML = '<div class="acc-cal-year"><button type="button" class="acc-cal-month" onclick="stepAccCalYear(-1)">−</button><input class="form-input" id="acc-cal-year" type="number" value="' + esc(parts.year) + '" oninput="_setPickerPreview()"><button type="button" class="acc-cal-month" onclick="stepAccCalYear(1)">＋</button></div><div class="acc-cal-months">' + months + '</div><div class="acc-cal-days">' + days + '</div>';
    _setPickerPreview();
  };
  window.selectAccRangeDay = function (btn) {
    var key = btn.getAttribute('data-key');
    if (_rangeFocus === 'from') { _fromKey = key; _rangeFocus = 'to'; }
    else _toKey = key;
    _monF = 'all'; _dayF = 'all';
    window.openAccRangeSheet();
    if (_fromKey !== 'all' && _toKey !== 'all') { window.closeAccSheet(); window.renderAccounts(); }
  };

  /* ══════════════ OPEN MODAL ══════════════ */
  window.openAccModal = function (type) {
    _items = [_blank()];
    var incF = document.getElementById('acc-income-fields');
    var expF = document.getElementById('acc-expense-fields');
    if (incF) incF.style.display = type === 'income' ? '' : 'none';
    if (expF) expF.style.display = type === 'expense' ? '' : 'none';
    var t = document.getElementById('account-modal-title');
    if (t) t.textContent = type === 'income' ? 'আয় এন্ট্রি' : 'ব্যয় এন্ট্রি';
    document.getElementById('account-entry-type').value = type;
    var hd = A.todayHijri();
    var dateEl = document.getElementById('acc-date');
    if (dateEl) {
      dateEl.value = A.dateKey(hd.year, A.monthFromNo(hd.monthNo), hd.day);
      dateEl.readOnly = true;
      dateEl.onclick = function () { window.openAccDatePicker('entry'); };
      dateEl.onfocus = dateEl.onclick;
      dateEl.style.cursor = 'pointer';
    }
    if (type === 'income') {
      var ae = document.getElementById('acc-inc-amount'); if (ae) ae.value = '';
      var ne = document.getElementById('acc-inc-note');   if (ne) ne.value = '';
    } else {
      var se = document.getElementById('acc-exp-supplier'); if (se) se.value = '';
      _renderItems();
    }
    openModal('account-entry');
  };

  /* ══════════════ SAVE ══════════════ */
  window.saveAccountEntry = function () {
    var type  = document.getElementById('account-entry-type').value;
    var parsed = A.parseDateInput((document.getElementById('acc-date') || {}).value);
    if (!parsed || !parsed.year || !parsed.month || !parsed.day) { showToast('তারিখ লিখুন: সন-মাস-দিন'); return; }
    if (type === 'income') {
      var amt  = parseFloat(document.getElementById('acc-inc-amount').value) || 0;
      var note = (document.getElementById('acc-inc-note').value || '').trim();
      if (!amt) { showToast('পরিমাণ লিখুন'); return; }
      A.Income.add({ hijriYear: parsed.year, month: parsed.month, day: parsed.day, amount: amt, note });
      showToast('আয় সংরক্ষিত ✓');
    } else {
      var account  = document.getElementById('acc-exp-account').value;
      var supplier = (document.getElementById('acc-exp-supplier').value || '').trim();
      var valid    = _items.filter(function (x) { return parseFloat(x.amount) > 0; });
      if (!valid.length) { showToast('কমপক্ষে একটি আইটেমের মোট টাকা দিন'); return; }
      valid.forEach(function (x) {
        var e = A.Expense.add({ account, hijriYear: parsed.year, month: parsed.month, day: parsed.day, category: x.category, description: x.description, quantity: x.quantity, unit: x.unit, unitPrice: x.unitPrice, amount: parseFloat(x.amount), supplier });
        if (supplier) A.Dues.addOrUpdate(supplier, account, parseFloat(x.amount));
      });
      showToast(valid.length + ' টি ব্যয় সংরক্ষিত ✓');
    }
    closeModal('account-entry');
    window.renderAccounts();
  };

  /* ══════════════ SUMMARY (Excel table + month filter) ══════════════ */
  function buildSummary() {
    var months = [];
    A.Income.months().concat(A.Expense.months()).forEach(function (m) { m = A.monthKey(m); if (months.indexOf(m) < 0) months.push(m); });
    if (_sumMonth !== 'all' && months.indexOf(_sumMonth) < 0) months.push(_sumMonth);
    var mo = A.MONTHS;
    months.sort(function (a, b) { return mo.indexOf(a) - mo.indexOf(b); });
    var monOpts = '<option value="all">সব মাস</option>' + months.map(function (m) {
      return '<option value="' + esc(m) + '"' + (_sumMonth === m ? ' selected' : '') + '>' + esc(m) + '</option>';
    }).join('');
    var AL   = A.ACCOUNT_LABELS;
    var accs = Object.keys(AL);
    var s    = A.Summary.get(_sumMonth === 'all' ? null : _sumMonth);
    var allExp = _sumMonth === 'all' ? A.Expense.getAll() : A.Expense.getByMonth(_sumMonth);
    var rows = accs.map(function (acc) {
      var accRows = allExp.filter(function (r) { return r.account === acc; });
      var exp = accRows.reduce(function (sum, r) { return sum + A.num(r.amount); }, 0);
      if (!exp) return null;
      return { id: acc, label: AL[acc], exp: exp, count: accRows.length, pct: s.te ? Math.round(exp / s.te * 100) : 0 };
    }).filter(Boolean);
    var tblRows = rows.map(function (r) {
      return '<tr class="acc-sum-row" role="button" tabindex="0" onclick="openAccAccountDetails(\'' + esc(r.id) + '\')" onkeydown="if(event.key===\'Enter\'||event.key===\' \'){event.preventDefault();openAccAccountDetails(\'' + esc(r.id) + '\')}"><td><div class="acc-break-name">' + esc(r.label) + '</div><div class="acc-pct-track"><div class="acc-pct-fill" style="width:' + r.pct + '%"></div></div></td>' +
        '<td style="color:var(--red);font-weight:800">৳' + fa(r.exp) + '</td>' +
        '<td>' + r.pct + '%</td>' +
        '<td>' + r.count + ' টি</td></tr>';
    }).join('');
    var tb = s.ti - s.te;
    var paid = Math.max(0, s.te - Math.max(0, s.td));
    var periodLabel = _sumMonth === 'all' ? 'সব মাসের হিসাব' : _sumMonth + ' মাস';
    var balCls = tb >= 0 ? 'good' : 'bad';
    var metrics = '<div class="acc-metrics">' +
      '<div class="acc-metric good"><div class="acc-metric-lbl">আয়</div><div class="acc-metric-val">৳' + fa(s.ti) + '</div></div>' +
      '<div class="acc-metric bad"><div class="acc-metric-lbl">ব্যয়</div><div class="acc-metric-val">৳' + fa(s.te) + '</div></div>' +
      '<div class="acc-metric good"><div class="acc-metric-lbl">পরিশোধ</div><div class="acc-metric-val">৳' + fa(paid) + '</div></div>' +
      '<div class="acc-metric warn"><div class="acc-metric-lbl">বকেয়া</div><div class="acc-metric-val">৳' + fa(s.td) + '</div></div>' +
      '</div>';
    var tfoot = '<tr><td><strong>সর্বমোট</strong></td>' +
      '<td style="color:var(--red);font-weight:700">৳' + fa(s.te) + '</td>' +
      '<td>100%</td><td>' + allExp.length + ' টি</td></tr>';
    return '<div class="acc-dashboard">' +
      '<div class="acc-topline"><div><div class="acc-period">' + esc(periodLabel) + '</div></div><select class="acc-sel" onchange="_sumMonth=this.value;renderAccounts()">' + monOpts + '</select></div>' +
      '<div class="acc-money-hero"><div class="acc-money-label">বর্তমান অবস্থা</div><div class="acc-money-main ' + balCls + '">' + (tb < 0 ? '−' : '+') + '৳' + fa(Math.abs(tb)) + '</div><div class="sub" style="position:relative">আয় − ব্যয়</div></div>' +
      metrics +
      '<div class="acc-ledger-card"><div class="acc-ledger-title"><span>ব্যয়ের বই অনুযায়ী</span>' + (s.td ? '<span style="color:var(--red)">বকেয়া ৳' + fa(s.td) + '</span>' : '<span style="color:var(--green)">বকেয়া নেই</span>') + '</div>' +
      '<div style="overflow-x:auto"><table class="acc-sum-tbl"><thead><tr><th>খাত / হিসাব বই</th><th>ব্যবহার</th><th>শতকরা</th><th>এন্ট্রি</th></tr></thead>' +
      '<tbody>' + (tblRows || '<tr><td colspan="4" style="text-align:center;color:var(--ink3)">তথ্য নেই</td></tr>') + '</tbody>' +
      '<tfoot>' + tfoot + '</tfoot></table></div></div>' +
      '</div>';
  }

  window.openAccAccountDetails = function (account) {
    var label = A.ACCOUNT_LABELS[account] || account || 'হিসাব';
    var rows = A.Expense.getAll().filter(function (r) {
      return r.account === account && (_sumMonth === 'all' || A.monthKey(r.month) === _sumMonth);
    }).sort(function (a, b) {
      return String(a.dateKey).localeCompare(String(b.dateKey));
    });
    var total = rows.reduce(function (sum, r) { return sum + A.num(r.amount); }, 0);
    var title = document.getElementById('account-details-title');
    var root = document.getElementById('account-details-root');
    if (title) title.textContent = label + ' হিসাবের বিস্তারিত';
    if (root) {
      var body = rows.map(function (r) {
        var category = A.clean(r.category, '');
        var supplier = A.clean(r.supplier, '');
        var desc = A.clean(r.description, '') || category || 'ব্যয়';
        var qInfo = r.quantity ? A.num(r.quantity) + (r.unit ? ' ' + esc(r.unit) : '') + (r.unitPrice ? ' × ৳' + fa(r.unitPrice) : '') : 'উল্লেখ নেই';
        return '<tr>' +
          '<td>' + esc(A.dateLabel(r)) + '</td>' +
          '<td>' + esc(A.monthKey(r.month) || '') + '</td>' +
          '<td>' + esc(category || 'অন্যান্য') + '</td>' +
          '<td class="acc-desc-cell">' + esc(desc) + '</td>' +
          '<td>' + qInfo + '</td>' +
          '<td>' + esc(supplier || 'উল্লেখ নেই') + '</td>' +
          '<td class="acc-ledger-amt">৳' + fa(r.amount) + '</td>' +
          '</tr>';
      }).join('');
      root.innerHTML =
        '<div class="acc-detail-head"><div style="font-size:12px;color:var(--ink3);font-weight:800">' + esc(_sumMonth === 'all' ? 'সব মাস' : _sumMonth + ' মাস') + ' · মোট সংখ্যা: ' + rows.length + ' টি</div><div class="acc-detail-total">মোট ৳' + fa(total) + '</div></div>' +
        '<div class="acc-table-wrap"><table class="acc-detail-table"><thead><tr><th>তারিখ</th><th>মাস</th><th>খাত</th><th>বিবরণ</th><th>পরিমাণ</th><th>সরবরাহকারী</th><th>টাকা</th></tr></thead><tbody>' +
        (body || '<tr><td colspan="7" style="text-align:center;color:var(--ink3)">এই হিসাব বইতে তথ্য নেই</td></tr>') +
        '</tbody></table></div>';
    }
    openModal('account-details');
  };

  /* ══════════════ INCOME LIST ══════════════ */
  function buildIncomeList() {
    var months  = A.Income.months();
    if (_monF !== 'all' && months.indexOf(_monF) < 0) months.push(_monF);
    var monOpts = '<option value="all">সব মাস</option>' + months.map(function (m) {
      return '<option value="' + esc(m) + '"' + (_monF === m ? ' selected' : '') + '>' + esc(m) + '</option>';
    }).join('');
    var rows = A.Income.getAll();
    if (_monF !== 'all') rows = rows.filter(function (r) { return A.monthKey(r.month) === _monF; });
    rows = rows.slice().sort(function (a, b) { return (b._at || 0) - (a._at || 0); });
    var total = rows.reduce(function (s, r) { return s + A.num(r.amount); }, 0);
    var items = rows.map(function (r) {
      var desc = A.clean(r.note, '') || A.clean(r.source, '') || 'আয়';
      return '<div class="acc-list-item"><div class="acc-list-top">' +
        '<div class="acc-list-desc">' + esc(desc) + '</div>' +
        '<div class="acc-list-amt inc">৳' + fa(r.amount) + '</div>' +
        '<button class="acc-del-btn" onclick="delAccEntry(\'income\',\'' + esc(r.id) + '\')">✕</button>' +
        '</div><div class="acc-list-meta">' + esc(A.monthKey(r.month) || '') + (r.day ? ' · ' + r.day : '') + '</div></div>';
    }).join('');
    return '<div class="acc-filter-bar"><select class="acc-sel" onchange="_monF=this.value;renderAccounts()">' + monOpts + '</select></div>' +
      '<div style="font-size:12px;color:var(--ink3);margin-bottom:8px">মোট: <strong style="color:var(--green)">৳' + fa(total) + '</strong> (' + rows.length + ' টি)</div>' +
      (items || '<div class="acc-empty">কোনো আয়ের রেকর্ড নেই</div>');
  }

  /* ══════════════ EXPENSE LIST ══════════════ */
  function buildExpenseList() {
    var rows = A.Expense.getAll();
    if (_monF !== 'all') rows = rows.filter(function (r) { return A.monthKey(r.month) === _monF; });
    if (_accF !== 'all') rows = rows.filter(function (r) { return r.account === _accF; });
    _fromKey = A.toDateKey(_fromKey);
    _toKey = A.toDateKey(_toKey);
    rows = rows.filter(function (r) { return A.inRange(r, _fromKey, _toKey); });
    if (_dayF === '__none') rows = rows.filter(function (r) { return !r.day; });
    else if (_dayF !== 'all') rows = rows.filter(function (r) { return String(r.day || '') === String(_dayF); });
    rows = rows.slice().sort(function (a, b) {
      if (_sortF === 'amount_desc') return A.num(b.amount) - A.num(a.amount);
      if (_sortF === 'amount_asc') return A.num(a.amount) - A.num(b.amount);
      if (_sortF === 'newest') return (b._at || 0) - (a._at || 0);
      if (_sortF === 'oldest') return (a._at || 0) - (b._at || 0);
      return _sortF === 'date_desc' ? String(b.dateKey).localeCompare(String(a.dateKey)) : String(a.dateKey).localeCompare(String(b.dateKey));
    });
    var total = rows.reduce(function (s, r) { return s + A.num(r.amount); }, 0);
    function rowHtml(r) {
      var category = A.clean(r.category, '');
      var supplier = A.clean(r.supplier, '');
      var desc = A.clean(r.description, '') || category || 'ব্যয়';
      var qInfo = r.quantity ? A.num(r.quantity) + (r.unit ? ' ' + esc(r.unit) : '') + (r.unitPrice ? ' × ৳' + fa(r.unitPrice) : '') : 'উল্লেখ নেই';
      return '<tr>' +
        '<td>' + esc(A.dateLabel(r)) + '</td>' +
        '<td>' + esc(A.ACCOUNT_LABELS[r.account] || r.account || '') + '</td>' +
        '<td>' + esc(category || 'অন্যান্য') + '</td>' +
        '<td class="acc-desc-cell">' + esc(desc) + '</td>' +
        '<td>' + qInfo + '</td>' +
        '<td>' + esc(supplier || 'উল্লেখ নেই') + '</td>' +
        '<td class="acc-ledger-amt">৳' + fa(r.amount) + '</td>' +
        '<td><button class="acc-del-btn" onclick="delAccEntry(\'expense\',\'' + esc(r.id) + '\')">মুছুন</button></td>' +
        '</tr>';
    }
    var items = rows.map(rowHtml).join('');
    var filterOn = _monF !== 'all' || _dayF !== 'all' || _accF !== 'all';
    var rangeOn = _fromKey !== 'all' || _toKey !== 'all';
    var sortNames = { date_asc:'পুরাতন আগে', date_desc:'নতুন আগে', amount_desc:'বেশি টাকা', amount_asc:'কম টাকা', newest:'নতুন এন্ট্রি', oldest:'পুরাতন এন্ট্রি' };
    var chips = [
      filterOn ? 'ফিল্টার চালু' : 'সব তথ্য',
      rangeOn ? ((_fromKey !== 'all' ? A.dateLabel({ dateKey: _fromKey, day: 1 }) : 'শুরু নেই') + ' - ' + (_toKey !== 'all' ? A.dateLabel({ dateKey: _toKey, day: 1 }) : 'শেষ নেই')) : 'তারিখ সীমা নেই',
      sortNames[_sortF] || 'সাজানো',
    ].map(function (x) { return '<span class="acc-chip">' + esc(x) + '</span>'; }).join('');
    return '<div class="acc-money-hero" style="margin-bottom:8px"><div class="acc-money-label">ব্যয়</div><div class="acc-money-main" style="color:var(--red)">৳' + fa(total) + '</div><div class="sub" style="position:relative">মোট সংখ্যা: ' + rows.length + ' টি</div></div>' +
      '<div class="acc-toolbar">' +
      '<button type="button" class="acc-tool-btn' + (filterOn ? ' is-on' : '') + '" onclick="openAccFilterSheet()">ফিল্টার</button>' +
      '<button type="button" class="acc-tool-btn' + (rangeOn ? ' is-on' : '') + '" onclick="openAccRangeSheet()">তারিখ সীমা</button>' +
      '<button type="button" class="acc-tool-btn acc-sort-btn" onclick="openAccSortSheet()" title="সাজান">⇅</button>' +
      '</div><div class="acc-chipline">' + chips + '</div>' +
      '<div class="acc-expense-wrap"><table class="acc-expense-table"><thead><tr><th>তারিখ</th><th>হিসাব বই</th><th>খাত</th><th>বিবরণ</th><th>পরিমাণ</th><th>সরবরাহকারী</th><th>টাকা</th><th></th></tr></thead><tbody>' +
      (items || '<tr><td colspan="8" style="text-align:center;color:var(--ink3)">কোনো ব্যয়ের রেকর্ড নেই</td></tr>') +
      '</tbody></table></div>';
  }

  /* ══════════════ DUES (compact table) ══════════════ */
  function buildDues() {
    var accOpts = '<option value="all">সব হিসাব</option>' + Object.entries(A.ACCOUNT_LABELS).map(function (e) {
      return '<option value="' + e[0] + '"' + (_dueAccF === e[0] ? ' selected' : '') + '>' + esc(e[1]) + '</option>';
    }).join('');
    var dues = A.Dues.getAll().filter(function (d) { return A.num(d.total) > 0; });
    if (_dueAccF !== 'all') dues = dues.filter(function (d) { return d.account === _dueAccF; });
    var filterBar = '<div class="acc-filter-bar"><select class="acc-sel" onchange="_dueAccF=this.value;renderAccounts()">' + accOpts + '</select></div>';
    if (!dues.length) return filterBar + '<div class="acc-empty">এই হিসাব বইতে কোনো বকেয়া নেই</div>';
    var rows = dues.map(function (d) {
      var isDue = A.num(d.due) > 0;
      var supplier = A.clean(d.supplier, 'সরবরাহকারী');
      return '<tr>' +
        '<td><div>' + esc(supplier) + '</div><small style="color:var(--ink3)">' + esc(A.ACCOUNT_LABELS[d.account] || d.account) + '</small></td>' +
        '<td>৳' + fa(d.total) + '</td>' +
        '<td style="color:var(--green)">৳' + fa(d.paid) + '</td>' +
        '<td style="color:' + (isDue ? 'var(--red)' : 'var(--green)') + ';font-weight:700">' + (isDue ? '' : '✓') + '৳' + fa(Math.abs(A.num(d.due))) + '</td>' +
        '<td>' + (isDue ? '<button class="acc-pay-btn" onclick="payDue(\'' + esc(d.id) + '\')">পরিশোধ</button>' : '') + '</td>' +
        '</tr>';
    }).join('');
    var totalDue = dues.reduce(function (s, d) { return s + Math.max(0, A.num(d.due)); }, 0);
    return filterBar +
      '<div style="font-size:12px;color:var(--ink3);margin-bottom:8px">মোট বকেয়া: <strong style="color:var(--red)">৳' + fa(totalDue) + '</strong></div>' +
      '<div style="overflow-x:auto"><table class="acc-sum-tbl"><thead><tr><th>সরবরাহকারী</th><th>মোট</th><th>দেওয়া</th><th>বকেয়া</th><th></th></tr></thead><tbody>' + rows + '</tbody></table></div>';
  }

  /* ══════════════ SETTINGS ══════════════ */
  function buildSettings() {
    var cats = A.Categories.getAll();
    var offset = A.Settings.getHijriOffsetDays();
    var today = A.todayHijri();
    var offsetOpts = [-2,-1,0,1,2].map(function (d) {
      var label = d === 0 ? 'সমন্বয় নেই' : (d > 0 ? '+' + d + ' দিন' : d + ' দিন');
      return '<option value="' + d + '"' + (offset === d ? ' selected' : '') + '>' + label + '</option>';
    }).join('');
    var catRows = cats.map(function (c) {
      var isDef = A.Categories.isDefault(c);
      return '<div class="acc-cat-row"><span>' + esc(c) + (isDef ? ' <span style="font-size:9px;color:var(--ink3)">(ডিফল্ট)</span>' : '') + '</span>' +
        (isDef ? '' : '<button class="acc-del-btn" onclick="delAccCategory(\'' + esc(c) + '\')">✕</button>') + '</div>';
    }).join('');
    return '<div style="font-family:\'Noto Serif Bengali\',serif;font-weight:700;font-size:14px;margin-bottom:8px">হিজরী তারিখ সেটিংস</div>' +
      '<div class="acc-ledger-card" style="padding:10px;margin-bottom:12px"><div class="acc-filter-bar" style="margin-bottom:6px">' +
      '<select class="acc-sel" onchange="setAccHijriOffset(this.value)">' + offsetOpts + '</select>' +
      '</div><div style="font-size:11px;color:var(--ink3)">আজকের হিসাব তারিখ: <strong>' + esc(A.dateLabel({ hijriYear: today.year, month: today.month, day: today.day })) + '</strong><br>চাঁদ দেখার কারণে ১-২ দিন এদিক-সেদিক হলে এখান থেকে সমন্বয় করুন।</div></div>' +
      '<div style="font-family:\'Noto Serif Bengali\',serif;font-weight:700;font-size:14px;margin-bottom:8px">ব্যয়ের খাত ব্যবস্থাপনা</div>' +
      '<div style="margin-bottom:10px">' + catRows + '</div>' +
      '<div class="acc-filter-bar">' +
      '<input class="acc-sel" id="acc-new-cat" placeholder="নতুন খাত লিখুন" style="flex:3;border-radius:8px;padding:6px 10px;border:1px solid var(--cream2)">' +
      '<button class="acc-btn acc-btn-inc" onclick="addAccCategory()" style="flex:1.2;border-radius:8px">যোগ করুন</button>' +
      '</div>';
  }

  window.addAccCategory = function () {
    var el = document.getElementById('acc-new-cat');
    var name = el ? el.value.trim() : '';
    if (!name) return;
    A.Categories.add(name); el.value = '';
    window.renderAccounts();
  };
  window.delAccCategory = function (name) {
    if (!confirm('"' + name + '" খাত মুছবেন?')) return;
    A.Categories.del(name); window.renderAccounts();
  };
  window.setAccHijriOffset = function (value) {
    A.Settings.setHijriOffsetDays(value);
    _accDefaulted = false;
    showToast('হিজরী তারিখ সমন্বয় সংরক্ষিত');
    window.renderAccounts();
  };

  /* ══════════════ MAIN RENDER ══════════════ */
  window.renderAccounts = function () {
    A.ensureSeed();
    ensureCurrentMonthDefault();
    var root = document.getElementById('accounts-root');
    if (!root) return;
    var TABS = [
      { id: 'summary',  lbl: 'সারসংক্ষেপ' }, { id: 'income',   lbl: 'আয়' },
      { id: 'expense',  lbl: 'ব্যয়' },        { id: 'dues',     lbl: 'বকেয়া' },
      { id: 'reports',  lbl: 'রিপোর্ট' },      { id: 'settings', lbl: 'সেটিংস ⚙' },
    ];
    var tabsH = TABS.map(function (t) {
      return '<button class="acc-tab-btn' + (_tab === t.id ? ' active' : '') + '" onclick="_tab=\'' + t.id + '\';renderAccounts()">' + t.lbl + '</button>';
    }).join('');
    root.innerHTML =
      '<div class="acc-shell">' +
      '<div class="acc-add-btns"><button class="acc-btn acc-btn-inc" onclick="openAccModal(\'income\')">＋ আয় যোগ</button><button class="acc-btn acc-btn-exp" onclick="openAccModal(\'expense\')">＋ ব্যয় যোগ</button></div>' +
      '<div class="acc-tabs">' + tabsH + '</div>' +
      '<div class="acc-content" id="acc-body"></div></div>';
    var body = document.getElementById('acc-body');
    if      (_tab === 'summary')  body.innerHTML = buildSummary();
    else if (_tab === 'income')   body.innerHTML = buildIncomeList();
    else if (_tab === 'expense')  body.innerHTML = buildExpenseList();
    else if (_tab === 'dues')     body.innerHTML = buildDues();
    else if (_tab === 'settings') body.innerHTML = buildSettings();
    else if (_tab === 'reports') {
      if (typeof window.renderAccountsReports === 'function') window.renderAccountsReports(body);
      else body.innerHTML = '<div class="acc-empty">রিপোর্ট লোড হয়নি</div>';
    }
  };

  /* ══════════════ HELPERS ══════════════ */
  window.delAccEntry = function (type, id) {
    if (!confirm('এই এন্ট্রি মুছে ফেলবেন?')) return;
    if (type === 'income') A.Income.del(id); else A.Expense.del(id);
    window.renderAccounts();
  };

  window.payDue = function (dueId) {
    var amtStr = prompt('পরিশোধের পরিমাণ (টাকা):');
    var amt = parseFloat(amtStr);
    if (!amt || amt <= 0) return;
    A.Dues.recordPayment(dueId, amt);
    window.renderAccounts();
    showToast('পরিশোধ নথিভুক্ত ✓');
  };

})();
