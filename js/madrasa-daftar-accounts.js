'use strict';
/* global MdrAccAPI, renderAccountsReports, openModal, closeModal, showToast */

/* ── global state (settable from inline onclick) ── */
var _tab      = 'summary';
var _monFs    = [];   /* multi-select months — empty = all */
var _accFs    = [];   /* multi-select account books — empty = all */
var _catFs    = [];   /* multi-select categories — empty = all */
var _dayF     = 'all';
var _sortF    = 'date_desc';
var _dueAccFs  = [];
var _fromKey  = 'all';
var _toKey    = 'all';
var _detailAccount = '';
var _detailMonth = 'all';
var _detailMonthFs = [];
var _detailCategory = 'all';
var _detailCatFs = [];
var _detailSupFs = [];
var _detailSearch = '';
var _detailSort = 'date_desc';
var _accDefaulted = false;
var _metricModalKind = '';
var _settingsModalOpen = false;
var _yearFs       = [];
var _editEntryId  = null;
var _editEntryType = '';
var _editNeedsApproval = false;
var _paymentMethod = 'cash';
var _qardTab = 'entries'; /* 'entries' | 'recovery' */
var _payQardOpenBucket = null; /* করজ আদায় কার্ড — কোন খাত-কী খোলা */

(function () {
  var A   = MdrAccAPI;
  var esc = function (s) { return A.esc(s); };
  var fa  = function (n) { return A.fa(n); };
  var pct = function (n) { return A.pct ? A.pct(n) : bn(n) + '%'; };
  var count = function (n, label) { return A.count ? A.count(n, label) : bn(n) + (label ? ' ' + label : ''); };
  var bn  = function (s) { return String(s || '').replace(/[0-9]/g, function (d) { return '০১২৩৪৫৬৭৮৯'[d]; }); };

  /* হিসাব বই ফিল্টার/সারাংশে শুধু ব্যয়-বই — qard_return শুধু আয়ের ধরন */
  function expenseBookKeys() {
    return Object.keys(A.ACCOUNT_LABELS).filter(function (k) { return k !== 'qard_return'; });
  }
  function expenseBookEntries() {
    return Object.entries(A.ACCOUNT_LABELS).filter(function (e) { return e[0] !== 'qard_return'; });
  }

  function filterIconBtn(active, count) {
    var svg = '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0"><line x1="4" y1="6" x2="20" y2="6"/><line x1="8" y1="12" x2="16" y2="12"/><line x1="10" y1="18" x2="14" y2="18"/></svg>';
    return '<button type="button" class="acc-filter-icon-btn' + (active ? ' is-on' : '') + '" onclick="openAccFilterSheet(this)">' + svg + 'ফিল্টার' + (active && count ? '<span class="acc-filter-badge">' + bn(count) + '</span>' : '') + '</button>';
  }

  function monthOptions(selected) {
    var current = selected === 'all' ? 'all' : A.monthKey(selected);
    return '<option value="all">সব মাস</option>' + A.MONTHS.map(function (m) {
      return '<option value="' + esc(m) + '"' + (current === m ? ' selected' : '') + '>' + esc(m) + '</option>';
    }).join('');
  }

  function normalizeMonthFilters() {
    _monFs = _monFs.map(function (m) { return A.monthKey(m); });
  }

  function getAllYears() {
    var years = new Set();
    A.Income.getAll().forEach(function (r) { if (r.hijriYear) years.add(String(r.hijriYear)); });
    A.Expense.getAll().forEach(function (r) { if (r.hijriYear) years.add(String(r.hijriYear)); });
    return Array.from(years).sort();
  }
  function yearOptions(selected) {
    return '<option value="all">সব বছর</option>' + getAllYears().map(function (y) {
      return '<option value="' + y + '"' + (selected === y ? ' selected' : '') + '>' + A.bn(y) + '</option>';
    }).join('');
  }

  /* ── inject CSS once ── */

  function ensureCurrentMonthDefault() {
    if (_accDefaulted) return;
    _monFs = [];
    _accDefaulted = true;
  }

  if (!document.getElementById('acc-style')) {
    var cs = document.createElement('style');
    cs.id = 'acc-style';
    cs.textContent = `
body.page-daftar #panel-fees{margin-left:-12px;margin-right:-12px}
.acc-shell{padding-top:2px}
.acc-add-btns{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:6px;padding:2px 4px 8px}
.acc-add-btns.has-month{grid-template-columns:repeat(4,minmax(0,1fr));gap:6px;padding-bottom:6px}
.acc-add-btns.acc-readonly{grid-template-columns:repeat(2,minmax(0,1fr));align-items:stretch}
.acc-btn{position:relative;overflow:hidden;height:38px;padding:0 4px;border:none;border-radius:12px;font-size:12px;font-weight:800;cursor:pointer;font-family:inherit;box-shadow:0 8px 18px rgba(26,18,8,.08);white-space:nowrap}
.acc-add-btns.has-month .acc-btn{height:38px;padding:0 4px;font-size:12px;border-radius:12px}
.acc-filter-icon-btn{position:relative;display:inline-flex;align-items:center;justify-content:center;gap:5px;border:1px solid rgba(26,18,8,.12);background:#fff;color:var(--ink2);border-radius:12px;padding:0 10px;height:38px;font-size:12px;font-weight:700;cursor:pointer;font-family:inherit;box-shadow:0 4px 12px rgba(26,18,8,.06);white-space:nowrap;width:100%}
.acc-filter-icon-btn.is-on{background:var(--ink);color:var(--gold2);border-color:var(--ink)}
.acc-filter-badge{position:absolute;top:-5px;right:-5px;background:#e53e3e;color:#fff;border-radius:50%;min-width:16px;height:16px;font-size:9px;font-weight:800;display:flex;align-items:center;justify-content:center;padding:0 2px;line-height:1}
.acc-report-top{height:38px;border:1px solid var(--cream2);border-radius:12px;background:#fff;color:var(--ink2);font-family:inherit;font-size:12px;font-weight:800;cursor:pointer;padding:0 4px;box-shadow:0 5px 13px rgba(26,18,8,.055);white-space:nowrap}
.acc-report-top.active{background:var(--ink);color:var(--gold2);border-color:var(--ink)}
.acc-top-settings{white-space:nowrap}
.acc-btn:active{transform:scale(.98)}
.acc-btn-inc{background:linear-gradient(135deg,#dcfce7,#bbf7d0);color:#065f46}
.acc-btn-exp{background:linear-gradient(135deg,#fee2e2,#fecaca);color:#991b1b}
.acc-tabs{display:flex;margin:0 4px 6px;padding:3px;gap:3px;overflow-x:auto;scrollbar-width:none;background:rgba(255,255,255,.72);border:1px solid rgba(26,18,8,.07);border-radius:14px;box-shadow:inset 0 1px 0 rgba(255,255,255,.7)}
.acc-qard-tab-bar{display:flex;gap:0;margin:0 0 12px;padding:0 2px;border-bottom:2px solid var(--cream2);border-radius:12px 12px 0 0;background:rgba(255,255,255,.5)}
.acc-qard-toolbar{margin:0 0 10px}
.acc-qard-new-btn{width:100%;padding:10px 12px;border-radius:12px;border:1.5px dashed rgba(154,106,33,.38);background:linear-gradient(180deg,#fffefb,#fff8e8);color:var(--ink2);font-family:inherit;font-size:13px;font-weight:800;cursor:pointer;box-shadow:0 4px 12px rgba(26,18,8,.05)}
.acc-qard-new-btn:active{transform:scale(.99)}
.acc-qard-tab{flex:1;padding:10px 6px;border:none;border-bottom:2px solid transparent;margin-bottom:-2px;background:none;font-family:inherit;font-size:13px;font-weight:600;color:var(--ink3);cursor:pointer;transition:color .15s,border-color .15s}
.acc-qard-tab.is-active{color:var(--ink2);border-bottom-color:var(--gold);font-weight:800}
.acc-qard-tab.is-recovery.is-active{color:var(--green);border-bottom-color:var(--green)}
.qard-person-card{background:#fff;border:1px solid rgba(26,18,8,.09);border-radius:14px;padding:11px 13px;margin-bottom:8px;box-shadow:0 4px 10px rgba(26,18,8,.05)}
.qard-person-card:last-child{margin-bottom:0}
.qard-expand-wrap{border-top:1px solid var(--cream2);margin-top:9px;padding-top:9px}
.qard-expand-row{display:flex;gap:8px;align-items:center;margin-top:6px}
.acc-qard-pane{display:flex;flex-direction:column;flex:1;min-height:0}
.acc-qard-pane--recovery{padding-top:4px;overflow-y:auto;-webkit-overflow-scrolling:touch}
.acc-tab-btn{padding:6px 10px;border:none;border-radius:11px;background:none;cursor:pointer;font-size:11px;color:var(--ink3);white-space:nowrap;font-family:inherit}
.acc-tab-btn.active{color:#fff;background:linear-gradient(135deg,var(--gold),#9a6a21);font-weight:800;box-shadow:0 6px 14px rgba(154,106,33,.23)}
.acc-content{padding:0 4px 10px}
.acc-dashboard{background:transparent;border:0;border-radius:0;padding:0;box-shadow:none;position:relative;overflow:visible}
.acc-dashboard:before{display:none}
.acc-topline{display:flex;align-items:center;gap:8px;margin-bottom:6px;position:relative}
.acc-topline .acc-sel{max-width:180px;margin-left:auto;background:#fff}
.acc-period{font-size:11px;color:var(--ink3);font-weight:700}
.acc-metrics{display:grid;grid-template-columns:repeat(4,1fr);gap:5px;margin-bottom:10px;position:relative}
.acc-metric{background:rgba(255,255,255,.82);border:1px solid rgba(26,18,8,.06);border-radius:14px;padding:8px 5px;text-align:center;box-shadow:0 5px 13px rgba(26,18,8,.055)}
.acc-metric-click{cursor:pointer;font-family:inherit}
.acc-metric-click:hover{background:#fff8e8;border-color:rgba(201,149,42,.26)}
.acc-metric-click:focus-visible{outline:2px solid rgba(154,106,33,.35);outline-offset:2px}
.acc-metric-lbl{font-size:9px;color:var(--ink3);margin-bottom:3px}
.acc-metric-val{font-family:'Tiro Bangla',serif;font-size:13px;font-weight:800;color:var(--ink2);white-space:nowrap}
.acc-metric.good .acc-metric-val{color:var(--green)}.acc-metric.bad .acc-metric-val{color:var(--red)}.acc-metric.warn .acc-metric-val{color:var(--gold)}
.acc-ledger-card{background:#fff;border:1px solid rgba(26,18,8,.07);border-radius:16px;overflow:hidden;position:relative;box-shadow:0 5px 13px rgba(26,18,8,.055);margin-top:2px}
.acc-ledger-title{display:flex;align-items:center;justify-content:space-between;padding:10px 11px;border-bottom:1px solid var(--cream2);font-size:12px;font-weight:800;color:var(--ink2)}
.acc-ledger-title--center{justify-content:center;text-align:center}
.acc-ledger-card.acc-ledger-flat{background:transparent;border:0;border-radius:0;overflow:visible}
.acc-ledger-flat .acc-ledger-title{padding:6px 2px 8px;border-bottom:0}
.acc-sum-tbl{width:100%;border-collapse:separate;border-spacing:0;font-size:12px}
.acc-sum-tbl th{background:#faf3e8;padding:7px 5px;text-align:left;font-weight:800;font-size:10px;color:var(--ink3)}
.acc-sum-tbl th:first-child{text-align:left}
.acc-sum-tbl td{padding:7px 5px;border-bottom:1px solid rgba(26,18,8,.06);text-align:left;background:#fff}
.acc-sum-tbl tbody tr:nth-child(even) td{background:#fffaf2}
.acc-sum-tbl tfoot td{font-weight:800;border-top:1px solid var(--cream3);background:#f8eddc}
.acc-sum-row{cursor:pointer}
.acc-sum-row:hover td{background:#fff4d9}
.acc-sum-row:focus{outline:2px solid rgba(154,106,33,.32);outline-offset:-2px}
.acc-money-hero{display:flex;align-items:center;justify-content:center;gap:8px;background:linear-gradient(145deg,#fff,#fff4d9);border:1px solid rgba(184,134,45,.18);border-radius:16px;padding:8px 10px;margin-bottom:7px;text-align:center;box-shadow:0 8px 18px rgba(154,106,33,.08);position:relative;overflow:hidden}
.acc-money-hero:after{display:none}
.acc-money-label{font-size:11px;color:var(--ink3);font-weight:800;position:relative}
.acc-money-main{font-family:'Tiro Bangla',serif;font-size:20px;font-weight:900;color:var(--ink2);position:relative;margin-top:0}
.acc-money-main.good{color:var(--green)}.acc-money-main.bad{color:var(--red)}
.acc-break-row{display:grid;grid-template-columns:1.05fr .9fr .75fr .7fr;gap:0;align-items:center}
.acc-break-name{font-weight:900;color:var(--ink2);text-align:left}
.acc-pct-track{height:7px;background:#f3eadc;border-radius:999px;overflow:hidden;margin-top:5px}
.acc-pct-fill{height:100%;background:linear-gradient(90deg,var(--gold),#d8aa55);border-radius:999px}
.acc-ledger-list{display:grid;gap:8px}
.acc-ledger-row{background:rgba(255,255,255,.92);border:1px solid rgba(26,18,8,.07);border-radius:16px;padding:10px 11px;box-shadow:0 7px 18px rgba(26,18,8,.055)}
.acc-ledger-grid{display:grid;grid-template-columns:74px 1fr auto;gap:9px;align-items:center}
.acc-ledger-date{font-size:11px;color:var(--ink3);font-weight:900;background:#fff8e8;border:1px solid rgba(154,106,33,.14);border-radius:12px;padding:7px 6px;text-align:center}
.acc-ledger-desc{font-size:13px;font-weight:900;color:var(--ink2);line-height:1.25}
.acc-ledger-meta{font-size:10px;color:var(--ink3);font-weight:700;margin-top:3px}
.acc-ledger-amt{font-family:'Tiro Bangla',serif;font-size:14px;font-weight:900;color:var(--red);white-space:nowrap}
.acc-ledger-table{margin-top:8px;border-top:1px dashed rgba(26,18,8,.12);padding-top:7px;display:grid;grid-template-columns:1fr 1fr;gap:4px 8px;font-size:10px;color:var(--ink3)}
.acc-ledger-table b{color:var(--ink2);font-size:11px}
.acc-table-wrap{overflow:auto;border:1px solid rgba(26,18,8,.07);border-radius:16px;background:#fff;max-height:none;flex:1;min-height:0}
body.page-daftar #modal-account-details .modal-title{margin-bottom:10px;gap:8px;align-items:flex-start}
body.page-daftar #account-details-title{display:flex;flex-wrap:wrap;align-items:center;gap:6px;min-width:0;flex:1;overflow:hidden}
body.page-daftar #account-details-title.acc-title-root--qard{flex-direction:column;align-items:stretch;gap:0;padding-right:2px;overflow:visible}
.acc-title-main{font-size:15px;overflow:hidden;text-overflow:ellipsis;min-width:0}
.acc-title-meta{font-size:10px;color:var(--ink3);font-family:'Tiro Bangla',serif;font-weight:800;flex-shrink:0}
.acc-title-total{font-family:'Tiro Bangla',serif;font-size:12px;font-weight:900;color:var(--red);background:#fff4d9;border:1px solid rgba(154,106,33,.16);border-radius:999px;padding:4px 7px;white-space:nowrap;flex-shrink:0}
/* করজ মডাল শিরোনাম — এক কার্ডে মোট + তিন স্তম্ভ স্ট্যাট */
.acc-qard-title-card{
  width:100%;box-sizing:border-box;
  background:linear-gradient(168deg,#fffcf7 0%,#fff6e8 45%,#fdf3df 100%);
  border:1px solid rgba(184,134,45,.24);border-radius:16px;
  padding:12px 12px 11px;box-shadow:0 8px 22px rgba(26,18,8,.07);
}
.acc-qard-title-row{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:10px;min-width:0}
.acc-qard-title-name{font-size:16px;font-weight:900;color:var(--ink2);line-height:1.25;min-width:0;flex:1}
.acc-qard-title-amount{font-family:'Tiro Bangla',serif;font-size:20px;font-weight:900;color:#a67c1f;line-height:1;white-space:nowrap;flex-shrink:0;letter-spacing:-.02em}
.acc-qard-title-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:7px;text-align:center}
.acc-qard-stat{
  background:rgba(255,255,255,.88);border:1px solid rgba(26,18,8,.08);
  border-radius:12px;padding:8px 4px 9px;min-width:0;
}
.acc-qard-stat-lbl{display:block;font-size:9px;font-weight:800;color:var(--ink3);margin:0 0 5px;line-height:1.2}
.acc-qard-stat-val{display:block;font-size:13px;font-weight:900;color:var(--ink2);font-family:'Tiro Bangla',serif;line-height:1.2;word-break:break-word}
.acc-qard-stat-val--green{color:#15803d}
.acc-qard-stat-val--gold{color:#a16207}
.acc-detail-tools{display:flex;gap:6px;margin-bottom:8px;flex-wrap:wrap;align-items:stretch}
.acc-detail-tools .acc-sel{min-width:0;padding:6px 8px;flex:1}
.acc-detail-tools .acc-filter-icon-btn{flex:0 0 auto;min-width:90px}
.acc-detail-clear{border:1px solid rgba(193,68,14,.16);background:rgba(193,68,14,.07);color:var(--red);border-radius:8px;padding:6px 8px;font-size:12px;cursor:pointer;font-family:inherit}
body.page-daftar #modal-account-details .modal{display:flex;flex-direction:column;height:min(760px,calc(100vh - 32px));padding-bottom:14px}
body.page-daftar #account-details-root{display:flex;flex-direction:column;flex:1;min-height:0}
#modal-account-entry .modal{width:min(920px,calc(100vw - 24px));max-width:920px;height:min(820px,calc(100vh - 24px));max-height:calc(100vh - 24px);overflow:auto;padding:24px 22px 28px;box-sizing:border-box}
body.page-daftar #modal-account-entry .modal{width:min(920px,calc(100vw - 24px));height:min(820px,calc(100vh - 24px));max-height:calc(100vh - 24px)}
#modal-account-entry .modal-title{font-size:18px;margin-bottom:14px}
#modal-account-entry .form-row{grid-template-columns:repeat(2,minmax(0,1fr));gap:14px}
#modal-account-entry .form-group{min-width:0}
#modal-account-entry .form-label{font-size:12px;margin-bottom:6px}
#modal-account-entry .form-input{min-height:42px;font-size:14px;padding:10px 12px}
#modal-account-entry .submit-btn{min-height:44px;margin-top:12px}
.acc-detail-table{width:max-content;min-width:100%;border-collapse:separate;border-spacing:0;font-size:12px}
.acc-detail-table th{position:sticky;top:0;background:#faf3e8;color:var(--ink3);font-size:10px;font-weight:900;text-align:left;padding:7px 5px;border-bottom:1px solid rgba(26,18,8,.08);z-index:1;white-space:nowrap}
.acc-detail-table td{padding:7px 5px;border-bottom:1px solid rgba(26,18,8,.06);white-space:nowrap;text-align:left;background:#fff}
.acc-detail-table tbody tr:nth-child(even) td{background:#fffaf2}
.acc-detail-table .acc-desc-cell{white-space:nowrap;color:var(--ink2);font-weight:800;line-height:1.35}
.acc-detail-table th:nth-child(1),.acc-detail-table td:nth-child(1){min-width:74px}
.acc-detail-table th:nth-child(2),.acc-detail-table td:nth-child(2){min-width:48px}
.acc-detail-table th:nth-child(3),.acc-detail-table td:nth-child(3){min-width:66px}
.acc-detail-table th:nth-child(4),.acc-detail-table td:nth-child(4){min-width:104px}
.acc-detail-table th:nth-child(5),.acc-detail-table td:nth-child(5){min-width:74px}
.acc-detail-table th:nth-child(6),.acc-detail-table td:nth-child(6){min-width:78px}
.acc-detail-table th:nth-child(7),.acc-detail-table td:nth-child(7){min-width:58px}
.acc-detail-table th:nth-child(8),.acc-detail-table td:nth-child(8){min-width:64px}
.acc-detail-table th:nth-child(9),.acc-detail-table td:nth-child(9){min-width:58px}
/* করজে হাসানা: মাস কলাম নেই — nth-child ভিন্ন; না হলে খাত/বিবরণ কলাম ভুল min-width পায় */
/* করজ এন্ট্রি টেবিল: মাস+সরবরাহকারী কলাম নেই — তারিখ,খাত,বিবরণ,পরিমাণ,রশিদ,টাকা,(কর্ম) */
.acc-table-wrap--qard .acc-detail-table th:nth-child(1),.acc-table-wrap--qard .acc-detail-table td:nth-child(1){min-width:86px}
.acc-table-wrap--qard .acc-detail-table th:nth-child(2),.acc-table-wrap--qard .acc-detail-table td:nth-child(2){min-width:76px}
.acc-table-wrap--qard .acc-detail-table th:nth-child(3),.acc-table-wrap--qard .acc-detail-table td:nth-child(3){min-width:132px}
.acc-table-wrap--qard .acc-detail-table th:nth-child(4),.acc-table-wrap--qard .acc-detail-table td:nth-child(4){min-width:76px}
.acc-table-wrap--qard .acc-detail-table th:nth-child(5),.acc-table-wrap--qard .acc-detail-table td:nth-child(5){min-width:68px}
.acc-table-wrap--qard .acc-detail-table th:nth-child(6),.acc-table-wrap--qard .acc-detail-table td:nth-child(6){min-width:70px}
.acc-table-wrap--qard .acc-detail-table th:nth-child(7),.acc-table-wrap--qard .acc-detail-table td:nth-child(7){min-width:56px}
.acc-table-wrap--qard.acc-table-wrap--qard-ro .acc-detail-table th:nth-child(6),.acc-table-wrap--qard.acc-table-wrap--qard-ro .acc-detail-table td:nth-child(6){min-width:74px}
.acc-expense-wrap{overflow:auto;border:1px solid rgba(26,18,8,.07);border-radius:17px;background:#fff;max-height:60vh;box-shadow:0 10px 24px rgba(26,18,8,.055)}
.acc-expense-table{width:max-content;min-width:100%;border-collapse:separate;border-spacing:0;font-size:12px}
.acc-expense-table th{position:sticky;top:0;background:#faf3e8;color:var(--ink3);font-size:10px;font-weight:900;text-align:left;padding:7px 5px;border-bottom:1px solid rgba(26,18,8,.08);z-index:1;white-space:nowrap}
.acc-expense-table td{padding:7px 5px;border-bottom:1px solid rgba(26,18,8,.06);white-space:nowrap;text-align:left;background:#fff}
.acc-expense-table tbody tr:nth-child(even) td{background:#fffaf2}
.acc-expense-table .acc-desc-cell{white-space:normal;min-width:92px;max-width:140px;color:var(--ink2);font-weight:800}
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
.acc-day-head span:last-child{color:var(--red);font-family:'Tiro Bangla',serif}
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
.acc-sheet{width:min(430px,100%);background:#fffaf1;border:1px solid rgba(154,106,33,.2);border-radius:22px 22px 18px 18px;box-shadow:0 22px 64px rgba(26,18,8,.25);padding:12px;animation:accCalIn .16s ease-out;max-height:88vh;overflow-y:auto}
.acc-sheet-head{display:flex;align-items:center;justify-content:space-between;margin-bottom:10px}
.acc-sheet-title{font-family:'Tiro Bangla',serif;font-size:15px;font-weight:800;color:var(--ink2)}
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
.acc-cal-title{font-family:'Tiro Bangla',serif;font-weight:800;color:var(--ink2);font-size:15px}
.acc-cal-close{border:none;background:rgba(26,18,8,.06);border-radius:50%;width:30px;height:30px;cursor:pointer;color:var(--ink2)}
.acc-cal-year{display:flex;gap:8px;margin-bottom:10px}.acc-cal-year input{flex:1;text-align:center}
.acc-cal-months{display:grid;grid-template-columns:repeat(3,1fr);gap:6px;margin-bottom:10px}
.acc-cal-month,.acc-cal-day{border:1px solid rgba(26,18,8,.07);background:#fff;border-radius:11px;padding:8px 4px;font-family:inherit;cursor:pointer;color:var(--ink2)}
.acc-cal-month.is-on,.acc-cal-day.is-on{background:linear-gradient(135deg,var(--gold),#9a6a21);color:#fff;font-weight:800;border-color:transparent;box-shadow:0 7px 15px rgba(154,106,33,.2)}
.acc-cal-days{display:grid;grid-template-columns:repeat(6,1fr);gap:6px}
@keyframes accCalIn{from{transform:translateY(16px);opacity:.7}to{transform:none;opacity:1}}
.acc-del-btn{background:none;border:none;color:var(--ink3);cursor:pointer;font-size:14px;padding:0 4px;line-height:1}
.acc-row-actions{display:flex;align-items:center;justify-content:center;gap:2px}
.acc-icon-btn{border:1px solid rgba(26,18,8,.08);background:#fff;color:var(--ink3);border-radius:7px;width:26px;height:26px;display:inline-flex;align-items:center;justify-content:center;cursor:pointer;font-size:12px;font-family:inherit;padding:0}
.acc-icon-btn.edit{color:#7a5118;background:#fff8e8}
.acc-icon-btn.del{color:var(--red);background:#fff5f2}
.acc-pay-btn{font-size:11px;border:1px solid var(--gold);color:var(--gold);background:none;border-radius:6px;padding:3px 8px;cursor:pointer;font-family:inherit}
.acc-empty{text-align:center;padding:30px;color:var(--ink3);font-size:13px}
.acc-cat-row{display:flex;justify-content:space-between;align-items:center;padding:6px 10px;border-radius:6px;background:#fff;margin-bottom:4px;font-size:13px;box-shadow:0 1px 2px rgba(0,0,0,.05)}
.acc-item-wrap{overflow:auto;border:1px solid rgba(26,18,8,.08);border-radius:14px;background:#fff;box-shadow:0 6px 16px rgba(26,18,8,.045)}
.acc-item-table{width:max-content;min-width:100%;border-collapse:separate;border-spacing:0;font-size:13px}
.acc-item-table th{background:#faf3e8;color:var(--ink3);font-size:11px;font-weight:900;text-align:left;padding:8px 7px;border-bottom:1px solid rgba(26,18,8,.08);white-space:nowrap}
.acc-item-table td{padding:7px;border-bottom:1px solid rgba(26,18,8,.06);background:#fff;vertical-align:middle}
.acc-item-table tr:last-child td{border-bottom:none}
.acc-item-table tbody tr:nth-child(even) td{background:#fffaf2}
.acc-item-table .form-input{font-size:13px;padding:8px 10px;min-height:40px;width:100%;box-sizing:border-box}
.acc-item-table select.form-input{padding:7px 10px}
.acc-item-del{background:none;border:none;color:var(--red);cursor:pointer;font-size:14px;padding:4px 6px;line-height:1}
.acc-item-table th:nth-child(1),.acc-item-table td:nth-child(1){width:150px}
.acc-item-table th:nth-child(2),.acc-item-table td:nth-child(2){width:250px}
.acc-item-table th:nth-child(3),.acc-item-table td:nth-child(3){width:96px}
.acc-item-table th:nth-child(4),.acc-item-table td:nth-child(4){width:112px}
.acc-item-table th:nth-child(5),.acc-item-table td:nth-child(5){width:116px}
.acc-item-table th:nth-child(6),.acc-item-table td:nth-child(6){width:118px}
.acc-item-amt-val{font-weight:900;color:var(--red);font-size:14px}
.acc-item-table th:nth-child(7),.acc-item-table td:nth-child(7){width:42px;text-align:center}
@media (max-width:640px){#modal-account-entry .modal{width:min(100%,calc(100vw - 16px));height:min(92vh,calc(100vh - 16px));padding:18px 14px 22px}#modal-account-entry .form-row{grid-template-columns:1fr;gap:10px}.acc-item-wrap{max-width:100%;overflow:auto}.acc-item-table th:nth-child(2),.acc-item-table td:nth-child(2){width:210px}}
.acc-ms-section-head{font-size:11px;font-weight:800;color:var(--ink3);text-transform:uppercase;letter-spacing:.04em;margin-bottom:6px}
.acc-ms-selall{background:none;border:none;color:var(--gold);font-size:11px;font-weight:700;cursor:pointer;font-family:inherit;padding:0;text-decoration:underline}
.acc-ms-list{display:flex;flex-wrap:wrap;gap:6px;max-height:160px;overflow-y:auto;padding:2px 0 4px}
.acc-ms-item{display:flex;align-items:center;gap:6px;background:#fff;border:1.5px solid rgba(26,18,8,.1);border-radius:999px;padding:6px 12px 6px 8px;cursor:pointer;font-size:12px;color:var(--ink2);user-select:none;transition:background .12s,border-color .12s}
.acc-ms-item.is-on{background:var(--ink);border-color:var(--ink);color:var(--gold2)}
.acc-ms-cb{position:absolute;opacity:0;width:0;height:0;pointer-events:none}
.acc-ms-circle{width:16px;height:16px;flex-shrink:0;border:2px solid rgba(26,18,8,.2);border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:9px;color:transparent;transition:all .12s;font-weight:900}
.acc-ms-item.is-on .acc-ms-circle{border-color:rgba(255,255,255,.5);background:rgba(255,255,255,.2);color:var(--gold2)}
.acc-ms-chip{display:inline-flex;align-items:center;gap:4px;background:var(--ink);color:var(--gold2);border-radius:20px;padding:3px 8px 3px 10px;font-size:11px;font-weight:700}
.acc-ms-chip-x{background:none;border:none;color:var(--gold2);cursor:pointer;font-size:13px;padding:0 0 0 2px;line-height:1}
.acc-dd-backdrop{position:fixed;inset:0;z-index:9996;background:rgba(26,18,8,.15)}
.acc-dd-panel{background:#fffaf1;border:1px solid rgba(154,106,33,.22);border-radius:18px;box-shadow:0 20px 52px rgba(26,18,8,.22);overflow-y:auto;animation:accCalIn .12s ease-out}
.acc-dd-section{padding:8px 12px;border-bottom:1px solid rgba(26,18,8,.05)}
.acc-dd-section-list{display:flex;flex-direction:column;gap:3px;padding:2px 0}
@media (min-width:420px){.acc-dd-section{padding:8px 14px}}
.acc-dd-tabs{display:flex;gap:4px;overflow-x:auto;scrollbar-width:none;padding:6px 12px 0;border-bottom:1px solid rgba(26,18,8,.06)}
.acc-dd-tab{border:none;background:none;color:var(--ink3);font-size:10px;font-weight:700;cursor:pointer;padding:5px 10px;border-radius:7px 7px 0 0;font-family:inherit;white-space:nowrap}
.acc-dd-tab:hover,.acc-dd-tab:focus-visible{background:rgba(26,18,8,.04);color:var(--ink2)}
.acc-dd-tab.acc-dd-tab-on{background:var(--ink);color:var(--gold2)}`;
    document.head.appendChild(cs);
  }

  /* ══════════════ EXPENSE ITEMS STATE ══════════════ */
  var _items = [];
  function _blank() { return { category: '', description: '', quantity: '', unit: 'কেজি', unitPrice: '', amount: '' }; }
  var UNIT_OPTIONS = ['', 'কেজি', 'গ্রাম', 'লিটার', 'মিলি', 'পিস', 'টি', 'বস্তা', 'প্যাকেট', 'বোতল', 'সেট', 'জোড়া', 'ফুট', 'গজ', 'হাত', 'দিন', 'জন', 'বার'];
  function unitOptions(value) {
    var current = A.clean(value, '');
    var opts = UNIT_OPTIONS.slice();
    if (current && opts.indexOf(current) < 0) opts.push(current);
    return opts.map(function (u) {
      var label = u || 'মাপ নেই';
      return '<option value="' + esc(u) + '"' + (current === u ? ' selected' : '') + '>' + esc(label) + '</option>';
    }).join('');
  }

  function _renderItems() {
    var c = document.getElementById('acc-items-container');
    if (!c) return;
    var cats = A.Categories.getAll();
    var rows = _items.map(function (item, i) {
      var catOpts = cats.map(function (cat) {
        return '<option value="' + esc(cat) + '"' + (item.category === cat ? ' selected' : '') + '>' + esc(cat) + '</option>';
      }).join('');
      return '<tr>' +
        '<td><select class="form-input form-select" onchange="updateAccItem(' + i + ',\'category\',this.value)"><option value="">— খাত —</option>' + catOpts + '</select></td>' +
        '<td><input class="form-input" value="' + esc(item.description) + '" placeholder="পণ্য / বিবরণ" oninput="updateAccItem(' + i + ',\'description\',this.value)"></td>' +
        '<td><input class="form-input" value="' + (item.quantity || '') + '" type="text" inputmode="decimal" placeholder="০" oninput="updateAccItem(' + i + ',\'quantity\',this.value)"></td>' +
        '<td><select class="form-input form-select" onchange="updateAccItem(' + i + ',\'unit\',this.value)">' + unitOptions(item.unit) + '</select></td>' +
        '<td><input class="form-input" value="' + (item.unitPrice || '') + '" type="text" inputmode="decimal" placeholder="০" oninput="updateAccItem(' + i + ',\'unitPrice\',this.value)"></td>' +
        '<td><span class="acc-item-amt-val" id="acc-item-amt-' + i + '">' + fa(item.amount || '') + '</span></td>' +
        '<td>' + (_items.length > 1 ? '<button type="button" class="acc-item-del" onclick="removeAccItem(' + i + ')">✕</button>' : '') + '</td>' +
      '</tr>';
    }).join('');
    c.innerHTML = '<div class="acc-item-wrap"><table class="acc-item-table"><thead><tr><th>খাত</th><th>বিবরণ</th><th>পরিমাণ</th><th>মাপ</th><th>একক মূল্য</th><th>মোট</th><th></th></tr></thead><tbody>' + rows + '</tbody></table></div>';
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
      _items[i].amount = q * p;
      var el = document.getElementById('acc-item-amt-' + i);
      if (el) el.textContent = fa(_items[i].amount);
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
      _fromKey = key; _monFs = []; _dayF = 'all';
    } else if (field === 'to') {
      _toKey = key; _monFs = []; _dayF = 'all';
    }
    window.closeAccDatePicker();
    if (field !== 'entry') rerenderAccountsView();
  };
  window.clearAccDateRange = function () {
    _fromKey = 'all'; _toKey = 'all';
    rerenderAccountsView();
  };
  window.clearAccDateRangeOnly = function () {
    _fromKey = 'all'; _toKey = 'all';
    _rebuildMainFilterDropdown();
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
    if (field === 'day') _dayF = value;
  };
  window.applyAccFilters = function () {
    window.closeMainFilterDropdown();
    rerenderAccountsView();
  };
  window.resetAccFilters = function () {
    _monFs = []; _accFs = []; _catFs = []; _yearFs = []; _dayF = 'all'; _fromKey = 'all'; _toKey = 'all';
    window.closeMainFilterDropdown();
    rerenderAccountsView();
  };

  /* ── multi-select toggle helpers ── */
  function _msToggle(arr, val, checked) {
    var idx = arr.indexOf(val);
    if (checked && idx < 0) arr.push(val);
    if (!checked && idx >= 0) arr.splice(idx, 1);
  }
  window.toggleAccMonth = function (val, checked) { _msToggle(_monFs, A.monthKey(val), checked); };
  window.toggleAccAccount = function (val, checked) { _msToggle(_accFs, val, checked); };
  window.toggleAccCat = function (val, checked) { _msToggle(_catFs, val, checked); };
  window.toggleAccYear = function (val, checked) { _msToggle(_yearFs, val, checked); };
  window.toggleAllAccMonths = function () {
    _monFs = _monFs.length ? [] : A.MONTHS.slice();
    _rebuildMainFilterDropdown();
  };
  window.toggleAllAccAccounts = function () {
    _accFs = _accFs.length ? [] : expenseBookKeys();
    _rebuildMainFilterDropdown();
  };
  window.toggleAllAccCats = function () {
    var all = A.Categories ? A.Categories.getAll() : [];
    _catFs = _catFs.length ? [] : all.slice();
    _rebuildMainFilterDropdown();
  };
  window.toggleAllAccYears = function () {
    _yearFs = _yearFs.length ? [] : getAllYears().slice();
    _rebuildMainFilterDropdown();
  };

  function _msList(items, activeArr, toggleFn, toggleAllFn) {
    var allOn = activeArr.length === 0;
    var selAllLabel = allOn ? 'বাতিল সব' : 'সব নির্বাচন';
    var chips = items.map(function (item) {
      var val = typeof item === 'object' ? item[0] : item;
      var label = typeof item === 'object' ? item[1] : item;
      var on = allOn || activeArr.indexOf(val) >= 0;
      return '<label class="acc-ms-item' + (on ? ' is-on' : '') + '">' +
        '<input type="checkbox" class="acc-ms-cb" ' + (on ? 'checked' : '') + ' onchange="' + toggleFn + '(\'' + esc(val) + '\',this.checked)">' +
        '<span class="acc-ms-circle">✓</span>' +
        '<span>' + esc(label) + '</span></label>';
    }).join('');
    return '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:6px">' +
      '<div class="acc-ms-section-head">' + (arguments[4] || '') + '</div>' +
      '<button type="button" class="acc-ms-selall" onclick="' + toggleAllFn + '()">' + selAllLabel + '</button></div>' +
      '<div class="acc-ms-list">' + chips + '</div>';
  }

  /* ── Global main filter dropdown ── */
  var _mainFilterDropdownTrigger = null;
  function _rebuildMainFilterDropdown() {
    var trigger = _mainFilterDropdownTrigger;
    var scrollTop = 0;
    var existing = document.getElementById('acc-main-filter-dropdown');
    if (existing) {
      var panel = existing.querySelector('.acc-dd-panel');
      if (panel) scrollTop = panel.scrollTop;
    }
    window.closeMainFilterDropdown();
    window.closeAccFilterDropdown();
    if (trigger) { openAccFilterSheet(trigger); var p = document.querySelector('.acc-dd-panel'); if (p) p.scrollTop = scrollTop; }
  }
  window._rebuildMainFilterDropdown = _rebuildMainFilterDropdown;
  window.closeMainFilterDropdown = function () {
    var el = document.getElementById('acc-main-filter-dropdown');
    if (el) el.remove();
    _mainFilterDropdownTrigger = null;
  };
  window.openAccFilterSheet = function (triggerEl) {
    var existing = document.getElementById('acc-main-filter-dropdown');
    if (existing) { existing.remove(); _mainFilterDropdownTrigger = null; return; }
    window.closeAccFilterDropdown();
    if (!triggerEl) { normalizeMonthFilters(); _sheetBuildMainFilter(); return; }
    _mainFilterDropdownTrigger = triggerEl;
    normalizeMonthFilters();
    _sheetBuildMainFilter();
  };
  function _sheetBuildMainFilter() {
    var existing = document.getElementById('acc-main-filter-dropdown');
    if (existing) existing.remove();
    var years = getAllYears();
    /* collect sections + tab labels */
    var sections = [];
    var secIdx = 0;
    function _ddGroup(title, items, activeArr, toggleFn, toggleAllFn) {
      var sid = 'mfs-' + (secIdx++);
      var activeCount = activeArr.length;
      var itemsHtml = items.map(function (item) {
        var val = typeof item === 'object' ? item[0] : item;
        var label = typeof item === 'object' ? item[1] : item;
        var on = activeArr.indexOf(val) >= 0;
        return '<label class="acc-ms-item' + (on ? ' is-on' : '') + '" style="border-radius:10px;display:flex;width:100%;box-sizing:border-box">' +
          '<input type="checkbox" class="acc-ms-cb" ' + (on ? 'checked' : '') + ' onchange="' + toggleFn + '(\'' + esc(val) + '\',this.checked);window._refreshAccDropdownUI()">' +
          '<span class="acc-ms-circle">✓</span>' +
          '<span style="flex:1">' + esc(label) + '</span></label>';
      }).join('');
      var allOn = activeCount === 0;
      var html = '<div class="acc-dd-section" id="' + sid + '">' +
        '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:6px">' +
        '<div class="acc-ms-section-head">' + title + ' <span class="acc-dds-count" style="font-size:9px;font-weight:400;color:var(--ink3)">(' + bn(activeCount || items.length) + (activeCount ? '/' + bn(items.length) : '') + ')</span></div>' +
        '<button type="button" class="acc-ms-selall" onclick="' + toggleAllFn + '()">' + (allOn ? 'বাতিল সব' : 'সব নির্বাচন') + '</button></div>' +
        '<div class="acc-dd-section-list">' + itemsHtml + '</div>' +
        '<div class="acc-dds-chip-wrap" style="margin-top:4px;display:' + (activeCount ? 'flex' : 'none') + ';flex-wrap:wrap;gap:4px"><span class="acc-chip">' + bn(activeCount) + ' টি</span></div>' +
        '</div>';
      sections.push({ id: sid, title: title });
      return html;
    }
    var dayOpts = '<option value="all">সব দিন</option>' + Array.from({ length: 30 }, function (_, i) { var d = String(i + 1); return '<option value="' + d + '"' + (String(_dayF) === d ? ' selected' : '') + '>' + bn(d) + ' তারিখ</option>'; }).join('') +
      '<option value="__none"' + (_dayF === '__none' ? ' selected' : '') + '>দিন নেই</option>';
    var yrs = years.map(function (y) { return [y, A.bn ? A.bn(y) : y]; });
    var yearSection = years.length ? _ddGroup('বছর (হিজরী)', yrs, _yearFs, 'toggleAccYear', 'toggleAllAccYears') : '';
    var monthSection = _ddGroup('মাস', A.MONTHS, _monFs, 'toggleAccMonth', 'toggleAllAccMonths');
    var accSection = _ddGroup('হিসাব বই', expenseBookEntries(), _accFs, 'toggleAccAccount', 'toggleAllAccAccounts');
    var cats = A.Categories ? A.Categories.getAll() : [];
    var catSection = _ddGroup('খাত / ক্যাটাগরি', cats, _catFs, 'toggleAccCat', 'toggleAllAccCats');
    var rangeFromOn = _fromKey !== 'all', rangeToOn = _toKey !== 'all';
    var rangeSid = 'mfs-' + (secIdx++);
    var rangeSection = '<div class="acc-dd-section" id="' + rangeSid + '">' +
      '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:6px">' +
      '<div class="acc-ms-section-head">তারিখ সীমা</div>' +
      ((rangeFromOn || rangeToOn) ? '<button type="button" class="acc-ms-selall" onclick="clearAccDateRangeOnly()">সাফ</button>' : '') +
      '</div>' +
      '<div class="acc-range-picks">' +
      '<button type="button" class="acc-range-pick' + (rangeFromOn ? ' is-on' : '') + '" onclick="_rebuildMainFilterDropdown();openAccRangeSheet()"><small>শুরু</small><span>' + esc(rangeFromOn ? A.dateLabel({ dateKey: _fromKey, day: 1 }) : 'নির্বাচন করুন') + '</span></button>' +
      '<button type="button" class="acc-range-pick' + (rangeToOn ? ' is-on' : '') + '" onclick="_rebuildMainFilterDropdown();openAccRangeSheet()"><small>শেষ</small><span>' + esc(rangeToOn ? A.dateLabel({ dateKey: _toKey, day: 1 }) : 'নির্বাচন করুন') + '</span></button>' +
      '</div></div>';
    sections.push({ id: rangeSid, title: 'তারিখ সীমা' });
    var daySid = 'mfs-' + (secIdx++);
    var daySection = '<div class="acc-dd-section" id="' + daySid + '">' +
      '<div class="acc-ms-section-head" style="margin-bottom:6px">দিন</div>' +
      '<select class="acc-sel" onchange="setAccFilter(\'day\',this.value);window._refreshAccDropdownUI()" style="width:100%">' + dayOpts + '</select></div>';
    sections.push({ id: daySid, title: 'দিন' });
    /* build tabs — "সব" first */
    var tabsHtml = '<div class="acc-dd-tabs">' +
      '<button type="button" class="acc-dd-tab acc-dd-tab-on" data-target="all" onclick="window._filterByTab(this)">সব</button>' +
      sections.map(function (s) {
        return '<button type="button" class="acc-dd-tab" data-target="' + s.id + '" onclick="window._filterByTab(this)">' + esc(s.title) + '</button>';
      }).join('') + '</div>';
    var totalActive = _yearFs.length + _monFs.length + _accFs.length + _catFs.length + (_fromKey !== 'all' ? 1 : 0) + (_toKey !== 'all' ? 1 : 0) + (_dayF !== 'all' ? 1 : 0);
    var el = document.createElement('div');
    el.id = 'acc-main-filter-dropdown';
    el.className = 'acc-dd-backdrop';
    el.onclick = closeMainFilterDropdown;
    el.innerHTML = '<div class="acc-dd-panel" onclick="event.stopPropagation()">' +
      '<div class="acc-sheet-head" style="padding:10px 12px 6px"><div class="acc-sheet-title">ফিল্টার' + (totalActive ? ' (' + bn(totalActive) + ')' : '') + '</div><button type="button" class="acc-sheet-close" onclick="closeMainFilterDropdown()">✕</button></div>' +
      tabsHtml +
      (yearSection || '') +
      monthSection +
      accSection +
      catSection +
      rangeSection +
      daySection +
      '<div class="acc-filter-bar" style="margin:4px 12px 12px"><button type="button" class="acc-btn acc-btn-inc" onclick="applyAccFilters()" style="border-radius:10px;flex:2">প্রয়োগ করুন</button><button type="button" class="acc-date-clear" onclick="resetAccFilters()" style="flex:1">সব সাফ</button></div>' +
      '</div>';
    var trigger = _mainFilterDropdownTrigger;
    if (trigger) {
      var rect = trigger.getBoundingClientRect();
      var panelEl = el.querySelector('.acc-dd-panel');
      var dw = window.innerWidth >= 520 ? 360 : (window.innerWidth - 12);
      panelEl.style.position = 'fixed';
      panelEl.style.top = Math.min(rect.bottom + 4, window.innerHeight - 20) + 'px';
      panelEl.style.left = Math.max(4, Math.min(rect.left, window.innerWidth - dw - 4)) + 'px';
      panelEl.style.width = dw + 'px';
      panelEl.style.maxHeight = Math.min(560, window.innerHeight - rect.bottom - 24) + 'px';
      panelEl.style.overflowY = 'auto';
    }
    document.body.appendChild(el);
  };
  window.setAccSort = function (value) {
    _sortF = value;
    window.closeAccSheet();
    window.closeMainFilterDropdown();
    rerenderAccountsView();
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
    _monFs = []; _dayF = 'all';
    window.openAccRangeSheet();
    if (_fromKey !== 'all' && _toKey !== 'all') { window.closeAccSheet(); rerenderAccountsView(); }
  };

  function renderEditReasonField() {
    var modal = document.querySelector('#modal-account-entry .modal');
    if (!modal) return;
    var submit = modal.querySelector('.submit-btn');
    var wrap = document.getElementById('acc-edit-reason-wrap');
    if (!wrap) {
      wrap = document.createElement('div');
      wrap.id = 'acc-edit-reason-wrap';
      wrap.className = 'form-group';
      wrap.style.marginTop = '8px';
      wrap.innerHTML =
        '<label class="form-label">সংশোধনের কারণ</label>' +
        '<textarea class="form-input form-textarea" id="acc-edit-reason" rows="2" placeholder="জিম্মাদারের অনুমতির জন্য কারণ লিখুন"></textarea>' +
        '<div style="font-size:10px;color:var(--ink3);margin-top:4px">২৪ ঘণ্টার বেশি পুরনো এন্ট্রি সরাসরি বদলাবে না; বার্তায় অনুমোদন অনুরোধ যাবে।</div>';
      if (submit && submit.parentNode) submit.parentNode.insertBefore(wrap, submit);
      else modal.appendChild(wrap);
    }
    wrap.style.display = _editNeedsApproval ? '' : 'none';
    if (!_editNeedsApproval) {
      var reasonEl = document.getElementById('acc-edit-reason');
      if (reasonEl) reasonEl.value = '';
    }
    if (submit) submit.textContent = _editNeedsApproval ? 'অনুমোদন অনুরোধ পাঠান' : 'সংরক্ষণ করুন';
  }

  function submitEntryApproval(type, originalEntry, proposed) {
    var reasonEl = document.getElementById('acc-edit-reason');
    var reason = reasonEl ? reasonEl.value.trim() : '';
    if (!reason) { showToast('সংশোধনের কারণ লিখুন'); return; }
    requestEntryChange('edit', type, originalEntry, reason, proposed).then(function (ok) {
      if (ok) {
        showToast('এডিট অনুরোধ বার্তায় পাঠানো হয়েছে');
        _editEntryId = null;
        _editEntryType = '';
        _editNeedsApproval = false;
        closeModal('account-entry');
        refreshAccountsViews();
      } else {
        showToast('অনুরোধ পাঠানো যায়নি');
      }
    });
  }

  function ensureQardAccountOption(show) {
    var accSel = document.getElementById('acc-exp-account');
    if (!accSel) return;
    var opt = accSel.querySelector('option[value="qard"]');
    if (show) {
      if (!opt) {
        opt = document.createElement('option');
        opt.value = 'qard';
        opt.textContent = 'করজে হাসানা';
        accSel.appendChild(opt);
      }
    } else if (opt) {
      opt.remove();
    }
  }

  function resetAccEntryAccountChrome() {
    ensureQardAccountOption(false);
    var row = document.getElementById('acc-exp-account-row');
    if (row) row.style.display = '';
    var si = document.getElementById('acc-exp-supplier');
    if (si) si.removeAttribute('list');
  }

  /* ══════════════ OPEN MODAL (new + edit) ══════════════ */
  window.openAccModal = function (type, entryId, opts) {
    opts = opts || {};
    if (isAccountsReadOnly()) { showToast('এডমিন পেইজে হিসাব দেখা যায়, এন্ট্রি বদলানো যায় না'); return; }
    resetAccEntryAccountChrome();
    _editEntryId   = entryId || null;
    _editEntryType = type;
    var entry = entryId
      ? (type === 'income' ? A.Income.getById(entryId) : A.Expense.getById(entryId))
      : null;
    _editNeedsApproval = !!(entry && !isAdminSession() && entryAgeHours(entry) > 24);
    var qardGiveOnly = !!(opts.qardGiveOnly && type === 'expense' && !entryId);
    var forceQardUi = type === 'expense' && ((entry && entry.account === 'qard') || qardGiveOnly);

    _items = [_blank()];
    var incF = document.getElementById('acc-income-fields');
    var expF = document.getElementById('acc-expense-fields');
    if (incF) incF.style.display = type === 'income' ? '' : 'none';
    if (expF) expF.style.display = type === 'expense' ? '' : 'none';
    var t = document.getElementById('account-modal-title');
    if (t) {
      if (type === 'expense' && forceQardUi) {
        t.textContent = entryId ? 'করজে হাসানা — ব্যয় এডিট' : 'করজে হাসানা — নতুন করজ';
      } else {
        t.textContent = entryId
          ? (type === 'income' ? 'আয় এডিট' : 'ব্যয় এডিট')
          : (type === 'income' ? 'আয় এন্ট্রি' : 'ব্যয় এন্ট্রি');
      }
    }
    document.getElementById('account-entry-type').value = type;

    var hd = A.todayHijri();
    var dateEl = document.getElementById('acc-date');
    if (dateEl) {
      dateEl.value = entry
        ? (entry.dateKey || A.dateKey(entry.hijriYear, entry.month, entry.day))
        : A.dateKey(hd.year, A.monthFromNo(hd.monthNo), hd.day);
      dateEl.readOnly = true;
      dateEl.onclick = function () { window.openAccDatePicker('entry'); };
      dateEl.onfocus = dateEl.onclick;
      dateEl.style.cursor = 'pointer';
    }

    if (type === 'income') {
      var ae = document.getElementById('acc-inc-amount');
      var ne = document.getElementById('acc-inc-note');
      if (ae) ae.value = entry ? (entry.amount || '') : '';
      if (ne) ne.value = entry ? (A.clean(entry.note, '') || A.clean(entry.source, '')) : '';
    } else {
      var accSel     = document.getElementById('acc-exp-account');
      var se         = document.getElementById('acc-exp-supplier');
      var receiptEl  = document.getElementById('acc-exp-receipt');
      var qardAmtEl  = document.getElementById('acc-qard-amt');
      var entryAccount = (entry ? entry.account : null) || (qardGiveOnly ? 'qard' : 'matbakh');
      if (forceQardUi) {
        ensureQardAccountOption(true);
        var accRow = document.getElementById('acc-exp-account-row');
        if (accRow) accRow.style.display = 'none';
      }
      if (accSel) accSel.value = entryAccount;
      if (se) {
        se.value = entry
          ? (entry.account === 'qard'
            ? (A.clean(entry.category, '') || A.clean(entry.description, '') || A.clean(entry.supplier, ''))
            : A.clean(entry.supplier, ''))
          : '';
      }
      if (receiptEl) receiptEl.value = entry ? (entry.receiptNo || '') : '';
      if (qardAmtEl) qardAmtEl.value = (entry && entry.account === 'qard') ? (entry.amount || '') : '';
      if (entry && entry.account !== 'qard') {
        _items = [{ category: A.clean(entry.category, ''), description: A.clean(entry.description, ''), quantity: entry.quantity || '', unit: entry.unit || 'কেজি', unitPrice: entry.unitPrice || '', amount: entry.amount || '' }];
      }
      /* account-ভেদে form sections দেখাও/লুকাও */
      window.onAccExpAccountChange(entryAccount);
      _renderItems();
      window.setAccPayment((entry && entry.account !== 'qard') ? (entry.paymentMethod || 'cash') : 'cash');
    }
    renderEditReasonField();
    openModal('account-entry');
  };

  window.openQardGiveModal = function () {
    if (isAccountsReadOnly()) { showToast('এডমিন পেইজে হিসাব দেখা যায়, এন্ট্রি বদলানো যায় না'); return; }
    window.openAccModal('expense', null, { qardGiveOnly: true });
  };

  /* করজে হাসানা সিলেক্ট হলে ব্যয় ফর্ম সংক্ষিপ্ত করো */
  window.onAccExpAccountChange = function (val) {
    var isQard = val === 'qard';
    var receiptRow  = document.getElementById('acc-exp-receipt-row');
    var payRow      = document.getElementById('acc-exp-pay-row');
    var itemsSection = document.getElementById('acc-items-section');
    var qardAmtRow  = document.getElementById('acc-qard-amt-row');
    var supLabel    = document.getElementById('acc-exp-supplier-label');
    var supInput    = document.getElementById('acc-exp-supplier');
    if (receiptRow)   receiptRow.style.display   = isQard ? 'none' : '';
    if (payRow)       payRow.style.display        = isQard ? 'none' : '';
    if (itemsSection) itemsSection.style.display  = isQard ? 'none' : '';
    if (qardAmtRow)   qardAmtRow.style.display    = isQard ? '' : 'none';
    if (supLabel)     supLabel.textContent         = isQard ? 'খাত (করজ আদায়ের গ্রুপ)' : 'সরবরাহকারী';
    if (isQard && supInput) supInput.placeholder  = 'যেমন: মেরামত, বিদ্যুৎ, বাজার, বেতন…';
    if (!isQard && supInput) supInput.placeholder = 'নাম / দোকান';
    if (isQard) {
      fillQardCategoryDatalist();
      if (supInput) supInput.setAttribute('list', 'acc-qard-category-datalist');
    } else if (supInput) {
      supInput.removeAttribute('list');
    }
  };

  window.setAccPayment = function (val) {
    _paymentMethod = val === 'due' ? 'due' : 'cash';
    var cashBtn = document.getElementById('acc-pay-cash');
    var dueBtn  = document.getElementById('acc-pay-due');
    if (!cashBtn || !dueBtn) return;
    if (_paymentMethod === 'due') {
      cashBtn.style.cssText = 'flex:1;padding:9px;border-radius:8px;border:1.5px solid var(--cream3);background:#fff;color:var(--ink3);font-family:inherit;font-size:13px;font-weight:600;cursor:pointer';
      dueBtn.style.cssText  = 'flex:1;padding:9px;border-radius:8px;border:1.5px solid var(--red);background:var(--red-light);color:var(--red);font-family:inherit;font-size:13px;font-weight:700;cursor:pointer';
    } else {
      cashBtn.style.cssText = 'flex:1;padding:9px;border-radius:8px;border:1.5px solid var(--green2);background:var(--green-light);color:var(--green);font-family:inherit;font-size:13px;font-weight:700;cursor:pointer';
      dueBtn.style.cssText  = 'flex:1;padding:9px;border-radius:8px;border:1.5px solid var(--cream3);background:#fff;color:var(--ink3);font-family:inherit;font-size:13px;font-weight:600;cursor:pointer';
    }
  };

  /* ══════════════ SAVE (new + edit) ══════════════ */
  window.saveAccountEntry = async function () {
    try {
    var type   = document.getElementById('account-entry-type').value;
    var parsed = A.parseDateInput((document.getElementById('acc-date') || {}).value);
    if (!parsed || !parsed.year || !parsed.month || !parsed.day) { showToast('তারিখ লিখুন: সন-মাস-দিন'); return; }
    var isEdit = !!_editEntryId;
    var originalEntry = isEdit ? (type === 'income' ? A.Income.getById(_editEntryId) : A.Expense.getById(_editEntryId)) : null;

    if (type === 'income') {
      var amt  = parseFloat(document.getElementById('acc-inc-amount').value) || 0;
      var note = (document.getElementById('acc-inc-note').value || '').trim();
      if (!amt) { showToast('পরিমাণ লিখুন'); return; }
      var incomePatch = { hijriYear: parsed.year, month: parsed.month, day: parsed.day, amount: amt, note };
      if (isEdit) {
        if (_editNeedsApproval) {
          submitEntryApproval(type, originalEntry, { ...(originalEntry || {}), ...incomePatch });
          return;
        }
        await A.Income.update(_editEntryId, incomePatch);
        showToast('আয় আপডেট হয়েছে ✓');
      } else {
        await A.Income.add(incomePatch);
        showToast('আয় সংরক্ষিত ✓');
      }
    } else {
      var account   = document.getElementById('acc-exp-account').value;
      var supplier  = (document.getElementById('acc-exp-supplier').value || '').trim();
      var receiptNo = (document.getElementById('acc-exp-receipt') ? document.getElementById('acc-exp-receipt').value : '').trim();
      var isOnCredit = _paymentMethod === 'due';
      var isQardEntry = account === 'qard';
      var valid;
      if (isQardEntry) {
        /* করজে হাসানা: পরিমাণ + খাত (আদায় গ্রুপের কী) */
        var qardAmtEl = document.getElementById('acc-qard-amt');
        var qardAmt = parseFloat(qardAmtEl ? qardAmtEl.value : 0) || 0;
        if (!qardAmt || qardAmt <= 0) { showToast('পরিমাণ লিখুন'); if (qardAmtEl) qardAmtEl.focus(); return; }
        if (!supplier) { showToast('খাতের নাম লিখুন'); document.getElementById('acc-exp-supplier').focus(); return; }
        valid = [{ category: supplier, description: '', quantity: '', unit: '', unitPrice: '', amount: qardAmt }];
      } else {
        valid = _items.filter(function (x) { return parseFloat(x.amount) > 0; });
        if (!valid.length) { showToast('কমপক্ষে একটি আইটেমের মোট টাকা দিন'); return; }
      }
      if (isEdit) {
        var x = valid[0];
        var expensePatch = { account, hijriYear: parsed.year, month: parsed.month, day: parsed.day, category: x.category, description: x.description, quantity: x.quantity, unit: x.unit, unitPrice: x.unitPrice, amount: parseFloat(x.amount), supplier: isQardEntry ? '' : supplier, receiptNo, paymentMethod: isOnCredit ? 'due' : 'cash' };
        if (_editNeedsApproval) {
          submitEntryApproval(type, originalEntry, { ...(originalEntry || {}), ...expensePatch });
          return;
        }
        await A.Expense.update(_editEntryId, expensePatch);
        if (originalEntry) {
          var oldSup = A.clean(originalEntry.supplier, '');
          var wasOnCredit = originalEntry.paymentMethod !== 'cash';
          if (oldSup && wasOnCredit) await A.Dues.cancelPurchase(oldSup, originalEntry.account, A.num(originalEntry.amount));
        }
        if (!isQardEntry && supplier && isOnCredit) await A.Dues.addOrUpdate(supplier, account, parseFloat(x.amount));
        showToast('ব্যয় আপডেট হয়েছে ✓');
      } else {
        for (var vi = 0; vi < valid.length; vi++) {
          var item = valid[vi];
          var supSave = isQardEntry ? '' : supplier;
          await A.Expense.add({ account, hijriYear: parsed.year, month: parsed.month, day: parsed.day, category: item.category, description: item.description, quantity: item.quantity, unit: item.unit, unitPrice: item.unitPrice, amount: parseFloat(item.amount), supplier: supSave, receiptNo, paymentMethod: isOnCredit ? 'due' : 'cash' });
          if (supSave && isOnCredit) await A.Dues.addOrUpdate(supSave, account, parseFloat(item.amount));
        }
        showToast(count(valid.length, 'টি') + ' ব্যয় সংরক্ষিত ✓');
      }
    }
    _editEntryId  = null;
    _editEntryType = '';
    _editNeedsApproval = false;
    _paymentMethod = 'cash';
    closeModal('account-entry');
    refreshAccountsViews();
    } catch (err) {
      console.warn('[Accounts] save failed', err);
      showToast('ডাটাবেজে সংরক্ষণ হয়নি');
      if (A.bootstrapRemote) {
        try { await A.bootstrapRemote(); refreshAccountsViews(); } catch (e) {}
      }
    }
  };

  /* ══════════════ SUMMARY (Excel table + month + year filter) ══════════════ */
  function buildSummary() {
    normalizeMonthFilters();
    var AL   = A.ACCOUNT_LABELS;
    var accs = expenseBookKeys();
    var allExp = A.Expense.getAll().filter(function (r) {
      return (!_monFs.length || _monFs.indexOf(A.monthKey(r.month)) >= 0) &&
             (!_yearFs.length || _yearFs.indexOf(String(r.hijriYear)) >= 0);
    });
    var allInc = A.Income.getAll().filter(function (r) {
      return (!_monFs.length || _monFs.indexOf(A.monthKey(r.month)) >= 0) &&
             (!_yearFs.length || _yearFs.indexOf(String(r.hijriYear)) >= 0);
    });
    var allDues = A.Dues.getAll();
    /* করজে হাসানা (qard) আলাদা হিসাব — সাধারণ ব্যয়ে গণনা হবে না */
    var tq  = allExp.filter(function (r) { return r.account === 'qard'; }).reduce(function (sum, r) { return sum + A.num(r.amount); }, 0);
    var tqr = allInc.filter(function (r) { return r.account === 'qard_return'; }).reduce(function (sum, r) { return sum + A.num(r.amount); }, 0);
    var tqRemaining = Math.max(0, tq - tqr);
    var s = {
      ti: allInc.filter(function (r) { return r.account !== 'qard_return'; }).reduce(function (sum, r) { return sum + A.num(r.amount); }, 0),
      te: allExp.filter(function (r) { return r.account !== 'qard'; }).reduce(function (sum, r) { return sum + A.num(r.amount); }, 0),
      td: allDues.reduce(function (sum, d) { return sum + Math.max(0, A.num(d.due)); }, 0),
    };
    var rows = accs.filter(function (acc) { return acc !== 'qard'; }).map(function (acc) {
      var accRows = allExp.filter(function (r) { return r.account === acc; });
      var exp = accRows.reduce(function (sum, r) { return sum + A.num(r.amount); }, 0);
      var due = allDues.filter(function (d) { return d.account === acc; }).reduce(function (sum, d) { return sum + Math.max(0, A.num(d.due)); }, 0);
      if (!exp && !due) return null;
      return { id: acc, label: AL[acc], exp: exp, due: due, count: accRows.length, pct: s.te ? Math.round(exp / s.te * 100) : 0 };
    }).filter(Boolean);
    var tblRows = rows.map(function (r) {
      return '<tr class="acc-sum-row">' +
        '<td onclick="openAccAccountDetails(\'' + esc(r.id) + '\')" style="cursor:pointer"><div class="acc-break-name">' + esc(r.label) + '</div><div class="acc-pct-track"><div class="acc-pct-fill" style="width:' + r.pct + '%"></div></div></td>' +
        '<td onclick="openAccAccountDetails(\'' + esc(r.id) + '\')" style="cursor:pointer;color:var(--red);font-weight:800">৳' + fa(r.exp) + '</td>' +
        '<td>' + pct(r.pct) + '</td>' +
        (r.due > 0
          ? '<td onclick="openAccDueDetails(\'' + esc(r.id) + '\')" style="cursor:pointer;color:var(--red);font-weight:700">৳' + fa(r.due) + '</td>'
          : '<td style="color:var(--green)">—</td>') +
        '</tr>';
    }).join('');
    var tb = s.ti - s.te - tqRemaining;
    var balCls = tb >= 0 ? 'good' : 'bad';
    var qardMetric = tqRemaining > 0
      ? '<button type="button" class="acc-metric acc-metric-click warn" onclick="openAccAccountDetails(\'qard\')"><div class="acc-metric-lbl">করজে হাসানা বাকি</div><div class="acc-metric-val">৳' + fa(tqRemaining) + '</div></button>'
      : '<div class="acc-metric good"><div class="acc-metric-lbl">করজে হাসানা বাকি</div><div class="acc-metric-val">—</div></div>';
    var metrics = '<div class="acc-metrics">' +
      '<button type="button" class="acc-metric acc-metric-click good" onclick="openAccMetricModal(\'income\')"><div class="acc-metric-lbl">আয়</div><div class="acc-metric-val">৳' + fa(s.ti) + '</div></button>' +
      '<button type="button" class="acc-metric acc-metric-click bad" onclick="openAccMetricModal(\'expense\')"><div class="acc-metric-lbl">ব্যয়</div><div class="acc-metric-val">৳' + fa(s.te) + '</div></button>' +
      qardMetric +
      '<button type="button" class="acc-metric acc-metric-click warn" onclick="openAccMetricModal(\'dues\')"><div class="acc-metric-lbl">বর্তমান বকেয়া</div><div class="acc-metric-val">৳' + fa(s.td) + '</div></button>' +
      '</div>';
    var thead = '<tr><th>খাত</th><th>ব্যয়</th><th>শতকরা</th><th>বর্তমান বকেয়া</th></tr>';
    var tfoot = '<tr><td><strong>সর্বমোট</strong></td>' +
      '<td style="color:var(--red);font-weight:700">৳' + fa(s.te) + '</td>' +
      '<td>' + pct(100) + '</td><td style="color:var(--red);font-weight:700">৳' + fa(s.td) + '</td></tr>';
    return '<div class="acc-dashboard">' +
      '<div class="acc-money-hero"><div class="acc-money-label">বর্তমান অবস্থা</div><div class="acc-money-main ' + balCls + '">' + (tb < 0 ? '−' : '+') + '৳' + fa(Math.abs(tb)) + '</div></div>' +
      metrics +
      '<div class="acc-ledger-card"><div class="acc-ledger-title acc-ledger-title--center"><span>খাতওয়ারী হিসাব</span></div>' +
      '<div style="overflow-x:auto"><table class="acc-sum-tbl"><thead>' + thead + '</thead>' +
      '<tbody>' + (tblRows || '<tr><td colspan="4" style="text-align:center;color:var(--ink3)">তথ্য নেই</td></tr>') + '</tbody>' +
      '<tfoot>' + tfoot + '</tfoot></table></div></div>' +
      '</div>';
  }

  /** করজে হাসানা: আদায়/বাকি গ্রুপ — খাত → বিবরণ → সরবরাহকারী (পুরনো ডাটা) */
  function qardBucketKey(r) {
    var c = A.clean(r.category, '');
    if (c) return c;
    var d = A.clean(r.description, '');
    if (d) return d;
    var s = A.clean(r.supplier, '');
    if (s) return s;
    return 'উল্লেখ নেই';
  }

  function fillQardCategoryDatalist() {
    var dl = document.getElementById('acc-qard-category-datalist');
    if (!dl) return;
    var seen = {};
    var out = [];
    try {
      A.Expense.getAll().filter(function (r) { return r.account === 'qard'; }).forEach(function (r) {
        var k = qardBucketKey(r);
        if (k && k !== 'উল্লেখ নেই' && !seen[k]) { seen[k] = true; out.push(k); }
      });
    } catch (e1) { /* ignore */ }
    try {
      (A.Categories.getAll() || []).forEach(function (c) {
        var k = (c || '').trim();
        if (k && !seen[k]) { seen[k] = true; out.push(k); }
      });
    } catch (e2) { /* ignore */ }
    out.sort(function (a, b) { return a.localeCompare(b, 'bn'); });
    dl.innerHTML = out.map(function (t) {
      return '<option value="' + esc(t) + '"></option>';
    }).join('');
  }

  /** qard_return note-এর payKey কোন খাত-বাকেটে যোগ (পুরনো নোটে বিবরণ/সরবরাহকারী হলে মিলিয়ে অনুপাতে ভাগ) */
  function applyQardIncomeToBuckets(byBucket, payKey, returnAmt, qardExpenses) {
    if (!payKey || returnAmt <= 0) return;
    if (byBucket[payKey]) {
      byBucket[payKey].returned += returnAmt;
      return;
    }
    var matches = qardExpenses.filter(function (r) {
      var d = A.clean(r.description, '');
      var c = A.clean(r.category, '');
      var s = A.clean(r.supplier, '');
      return payKey === d || payKey === c || payKey === s || payKey === qardBucketKey(r);
    });
    if (!matches.length) {
      if (!byBucket[payKey]) byBucket[payKey] = { given: 0, returned: 0 };
      byBucket[payKey].returned += returnAmt;
      return;
    }
    var sub = {};
    matches.forEach(function (r) {
      var k = qardBucketKey(r);
      if (!sub[k]) sub[k] = 0;
      sub[k] += A.num(r.amount);
    });
    var keys = Object.keys(sub);
    if (keys.length === 1) {
      if (!byBucket[keys[0]]) byBucket[keys[0]] = { given: 0, returned: 0 };
      byBucket[keys[0]].returned += returnAmt;
      return;
    }
    var totalG = keys.reduce(function (sum, k) { return sum + sub[k]; }, 0);
    if (!totalG) {
      if (!byBucket[payKey]) byBucket[payKey] = { given: 0, returned: 0 };
      byBucket[payKey].returned += returnAmt;
      return;
    }
    var cents = Math.round(returnAmt * 100);
    var allocated = 0;
    keys.forEach(function (k, idx) {
      var share = idx === keys.length - 1 ? cents - allocated : Math.round(cents * sub[k] / totalG);
      allocated += share;
      var part = share / 100;
      if (!byBucket[k]) byBucket[k] = { given: 0, returned: 0 };
      byBucket[k].returned += part;
    });
  }

  function renderAccAccountDetails(account) {
    var label = A.ACCOUNT_LABELS[account] || account || 'হিসাব';
    var baseRows = A.Expense.getAll().filter(function (r) {
      return r.account === account;
    });
    var categories = [];
    var suppliers = [];
    var isQardAcct = account === 'qard';
    baseRows.forEach(function (r) {
      var c = A.clean(r.category, '') || 'অন্যান্য';
      var s = isQardAcct ? qardBucketKey(r) : (A.clean(r.supplier, '') || 'উল্লেখ নেই');
      if (categories.indexOf(c) < 0) categories.push(c);
      if (suppliers.indexOf(s) < 0) suppliers.push(s);
    });
    categories.sort(function (a, b) { return a.localeCompare(b, 'bn'); });
    suppliers.sort(function (a, b) { return a.localeCompare(b, 'bn'); });
    var rows = baseRows.filter(function (r) {
      var month = A.monthKey(r.month);
      var category = A.clean(r.category, '') || 'অন্যান্য';
      var supplier = A.clean(r.supplier, '') || 'উল্লেখ নেই';
      var bucket = isQardAcct ? qardBucketKey(r) : supplier;
      var desc = A.clean(r.description, '') || category || 'ব্যয়';
      var haystack = [A.dateLabel(r), month, category, desc, supplier, bucket, String(r.amount || '')].join(' ').toLowerCase();
      return (!_detailMonthFs.length || _detailMonthFs.indexOf(month) >= 0) &&
        (!_detailCatFs.length || _detailCatFs.indexOf(category) >= 0) &&
        (!_detailSupFs.length || _detailSupFs.indexOf(bucket) >= 0) &&
        (!_detailSearch || haystack.indexOf(String(_detailSearch).toLowerCase()) >= 0);
    }).sort(function (a, b) {
      if (_detailSort === 'amount_desc') return A.num(b.amount) - A.num(a.amount);
      if (_detailSort === 'amount_asc') return A.num(a.amount) - A.num(b.amount);
      if (_detailSort === 'date_desc') return String(b.dateKey).localeCompare(String(a.dateKey));
      return String(a.dateKey).localeCompare(String(b.dateKey));
    });
    var total = rows.reduce(function (sum, r) { return sum + A.num(r.amount); }, 0);
    var title = document.getElementById('account-details-title');
    var root = document.getElementById('account-details-root');
    if (title) {
      var monMeta = _detailMonthFs.length ? (bn(_detailMonthFs.length) + ' মাস') : 'সব মাস';
      if (account === 'qard') {
        /* করজে হাসানা: শিরোনাম দুই সারিতে — টেবিলে মাস কলাম নেই */
        var allQardInc = A.Income.getAll().filter(function (r) { return r.account === 'qard_return'; });
        var tqrTotal = allQardInc.reduce(function (s, r) { return s + A.num(r.amount); }, 0);
        var tqRem = Math.max(0, total - tqrTotal);
        title.className = 'acc-title-root acc-title-root--qard';
        title.innerHTML =
          '<div class="acc-qard-title-card">' +
            '<div class="acc-qard-title-row">' +
              '<span class="acc-qard-title-name">' + esc(label) + '</span>' +
              '<span class="acc-qard-title-amount">৳' + fa(total) + '</span>' +
            '</div>' +
            '<div class="acc-qard-title-grid">' +
              '<div class="acc-qard-stat"><span class="acc-qard-stat-lbl">এন্ট্রি</span><span class="acc-qard-stat-val">' + count(rows.length, 'টি') + '</span></div>' +
              '<div class="acc-qard-stat"><span class="acc-qard-stat-lbl">আদায়</span><span class="acc-qard-stat-val acc-qard-stat-val--green">৳' + fa(tqrTotal) + '</span></div>' +
              '<div class="acc-qard-stat"><span class="acc-qard-stat-lbl">বাকি</span><span class="acc-qard-stat-val acc-qard-stat-val--gold">৳' + fa(tqRem) + '</span></div>' +
            '</div>' +
          '</div>';
      } else {
        title.className = 'acc-title-root';
        title.innerHTML =
          '<span class="acc-title-main">' + esc(label) + '</span>' +
          '<span class="acc-title-meta">' + esc(monMeta) + ' · ' + count(rows.length, 'টি') + '</span>' +
          '<span class="acc-title-total">৳' + fa(total) + '</span>';
      }
    }
    if (root) {
      var readOnly = isAccountsReadOnly();
      var isQard = account === 'qard';
      var body = rows.map(function (r) {
        var category  = A.clean(r.category, '');
        var supplier  = A.clean(r.supplier, '');
        var receiptNo = A.clean(r.receiptNo, '');
        var desc = A.clean(r.description, '') || category || 'ব্যয়';
        var qInfo = r.quantity ? bn(A.num(r.quantity)) + (r.unit ? ' ' + esc(r.unit) : '') + (r.unitPrice ? ' × ৳' + fa(r.unitPrice) : '') : 'উল্লেখ নেই';
        /* qard-এ শুধু delete — আদায় খাত-ভিত্তিক সারিতে */
        var actionBtns = isQard
          ? '<button class="acc-icon-btn del" title="মুছুন" onclick="delAccEntry(\'expense\',\'' + esc(r.id) + '\')">✕</button>'
          : '<button class="acc-icon-btn edit" title="এডিট" onclick="editAccEntry(\'expense\',\'' + esc(r.id) + '\')">✎</button>' +
            '<button class="acc-icon-btn del" title="মুছুন" onclick="delAccEntry(\'expense\',\'' + esc(r.id) + '\')">✕</button>';
        var monthTd = isQard ? '' : ('<td>' + esc(A.monthKey(r.month) || '') + '</td>');
        var supTd = isQard ? '' : ('<td>' + esc(supplier || 'উল্লেখ নেই') + '</td>');
        return '<tr>' +
          '<td>' + esc(A.dateLabel(r)) + '</td>' +
          monthTd +
          '<td>' + esc(category || 'অন্যান্য') + '</td>' +
          '<td class="acc-desc-cell">' + esc(desc) + '</td>' +
          '<td>' + qInfo + '</td>' +
          supTd +
          '<td style="color:var(--ink3);font-size:11px">' + (receiptNo ? esc(receiptNo) : '—') + '</td>' +
          '<td class="acc-ledger-amt">৳' + fa(r.amount) + '</td>' +
          (readOnly ? '' : '<td><div class="acc-row-actions">' + actionBtns + '</div></td>') +
          '</tr>';
      }).join('');
      var detailFilterOn = _detailMonthFs.length > 0 || _detailCatFs.length > 0 || _detailSupFs.length > 0 || !!_detailSearch;
      var _storeDetailLists = function () {
        window._detailMonthsList = A.MONTHS.filter(function (m) { return baseRows.some(function (r) { return A.monthKey(r.month) === m; }); });
        window._detailCatsList = categories;
        window._detailSuppsList = suppliers;
      };
      _storeDetailLists();
      var activeFilterCount = _detailMonthFs.length + _detailCatFs.length + _detailSupFs.length;
      var filterBadge = activeFilterCount ? '<span class="acc-filter-badge">' + bn(activeFilterCount) + '</span>' : '';
      var filters =
        '<div class="acc-detail-tools">' +
        '<div style="position:relative">' +
        '<button type="button" class="acc-filter-icon-btn' + (activeFilterCount ? ' is-on' : '') + '" onclick="openAccDetailFilterDropdown(this)" style="width:100%">' +
        '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0"><line x1="4" y1="6" x2="20" y2="6"/><line x1="8" y1="12" x2="16" y2="12"/><line x1="10" y1="18" x2="14" y2="18"/></svg>' +
        'ফিল্টার' + filterBadge + '</button></div>' +
        '<input class="acc-sel" id="acc-detail-search" value="' + esc(_detailSearch) + '" placeholder="খুঁজুন" oninput="setAccDetailFilter(\'search\',this.value)" style="min-width:0">' +
        '<select class="acc-sel" onchange="setAccDetailFilter(\'sort\',this.value)" style="min-width:0">' +
          '<option value="date_asc"' + (_detailSort === 'date_asc' ? ' selected' : '') + '>পুরাতন আগে</option>' +
          '<option value="date_desc"' + (_detailSort === 'date_desc' ? ' selected' : '') + '>নতুন আগে</option>' +
          '<option value="amount_desc"' + (_detailSort === 'amount_desc' ? ' selected' : '') + '>টাকা বেশি</option>' +
          '<option value="amount_asc"' + (_detailSort === 'amount_asc' ? ' selected' : '') + '>টাকা কম</option>' +
        '</select>' +
        (detailFilterOn ? '<button type="button" class="acc-detail-clear" onclick="clearAccDetailFilters()">রিসেট</button>' : '') +
        '</div>';
      var monthTh = isQard ? '' : '<th>মাস</th>';
      var supTh = isQard ? '' : '<th>সরবরাহকারী</th>';
      var emptyColspan = isQard ? (readOnly ? 6 : 7) : (readOnly ? 8 : 9);
      var wrapCls = 'acc-table-wrap' + (isQard ? ' acc-table-wrap--qard' + (readOnly ? ' acc-table-wrap--qard-ro' : '') : '');
      var tableHtml = '<div class="' + wrapCls + '"><table class="acc-detail-table"><thead><tr><th>তারিখ</th>' + monthTh + '<th>খাত</th><th>বিবরণ</th><th>পরিমাণ</th>' + supTh + '<th>রশিদ নং</th><th>টাকা</th>' + (readOnly ? '' : '<th></th>') + '</tr></thead><tbody>' +
        (body || '<tr><td colspan="' + emptyColspan + '" style="text-align:center;color:var(--ink3)">এই হিসাব বইতে তথ্য নেই</td></tr>') +
        '</tbody></table></div>';
      if (isQard) {
        /* করজে হাসানা: tab system — এন্ট্রি সমূহ | ↩ আদায় */
        var tabBar =
          '<div class="acc-qard-tab-bar">' +
          '<button type="button" class="acc-qard-tab' + (_qardTab === 'entries' ? ' is-active' : '') + '" onclick="switchQardTab(\'entries\')">এন্ট্রি সমূহ</button>' +
          '<button type="button" class="acc-qard-tab is-recovery' + (_qardTab === 'recovery' ? ' is-active' : '') + '" onclick="switchQardTab(\'recovery\')">↩ আদায়</button>' +
          '</div>';
        root.innerHTML =
          tabBar +
          '<div id="qard-tab-entries" class="acc-qard-pane"' + (_qardTab !== 'entries' ? ' style="display:none"' : '') + '>' +
          (readOnly ? '' : '<div class="acc-qard-toolbar"><button type="button" class="acc-qard-new-btn" onclick="openQardGiveModal()">＋ নতুন করজ</button></div>') +
          filters + tableHtml +
          '</div>' +
          '<div id="qard-tab-recovery" class="acc-qard-pane acc-qard-pane--recovery"' + (_qardTab !== 'recovery' ? ' style="display:none"' : '') + '>' +
          buildQardBucketSummary(baseRows, readOnly) +
          '</div>';
      } else {
        root.innerHTML = filters + tableHtml;
      }
    }
  }

  /* খাত-ভিত্তিক করজে হাসানা আদায় সারসংক্ষেপ — card + inline expand */
  function buildQardBucketSummary(expenseRows, readOnly) {
    var PREFIX = 'করজে হাসানা আদায় — ';
    var byBucket = {};
    expenseRows.forEach(function (r) {
      var k = qardBucketKey(r);
      if (!byBucket[k]) byBucket[k] = { given: 0, returned: 0 };
      byBucket[k].given += A.num(r.amount);
    });
    A.Income.getAll().filter(function (r) { return r.account === 'qard_return'; }).forEach(function (r) {
      var note = A.clean(r.note, '');
      var payKey = note.indexOf(PREFIX) === 0 ? note.slice(PREFIX.length).trim() : '';
      if (!payKey) payKey = A.clean(r.source, '') || '';
      applyQardIncomeToBuckets(byBucket, payKey, A.num(r.amount), expenseRows);
    });
    var rows = Object.keys(byBucket).map(function (key) {
      var d = byBucket[key];
      return { key: key, given: d.given, returned: d.returned, remaining: Math.max(0, d.given - d.returned) };
    }).sort(function (a, b) { return b.remaining - a.remaining; });
    if (!rows.length) return '<div style="color:var(--ink3);font-size:13px;padding:16px 0;text-align:center">আদায়যোগ্য করজ নেই</div>';
    var cards = rows.map(function (r) {
      var isOpen = _payQardOpenBucket === r.key;
      var remColor = r.remaining > 0 ? 'var(--gold)' : 'var(--green)';
      var keyJs = JSON.stringify(r.key);
      var payBtn = (!readOnly && r.remaining > 0)
        ? '<button type="button" class="acc-pay-btn" style="' + (isOpen ? 'background:var(--ink2);color:#fff;border-color:var(--ink2)' : 'background:var(--green);color:#fff;border-color:var(--green)') + ';padding:5px 12px;font-size:12px" onclick="toggleQardExpand(' + keyJs + ',' + r.remaining + ')">' + (isOpen ? '▲ বন্ধ' : '↩ আদায়') + '</button>'
        : (r.remaining === 0 ? '<span style="color:var(--green);font-size:12px;font-weight:700">✓ পরিশোধিত</span>' : '');
      var statsHtml =
        '<div style="display:flex;gap:14px;margin-top:5px;font-size:11px;color:var(--ink3);flex-wrap:wrap">' +
        '<span>মোট করজ: <b style="color:var(--ink2)">৳' + fa(r.given) + '</b></span>' +
        '<span>আদায়: <b style="color:var(--green)">৳' + fa(r.returned) + '</b></span>' +
        '<span>বাকি: <b style="color:' + remColor + '">' + (r.remaining > 0 ? '৳' + fa(r.remaining) : '—') + '</b></span>' +
        '</div>';
      var expandHtml = (isOpen && !readOnly)
        ? '<div class="qard-expand-wrap">' +
          '<div style="font-size:11px;color:var(--ink3);font-weight:600">আদায়ের পরিমাণ · বাকি ৳' + fa(r.remaining) + '</div>' +
          '<div class="qard-expand-row">' +
          '<input type="number" id="qpay-expand-amt" class="form-input" placeholder="০" min="0.01" max="' + r.remaining + '" step="0.01" style="flex:1;min-height:0;height:40px;font-size:14px;padding:8px 12px">' +
          '<button type="button" style="height:40px;padding:0 16px;border:none;border-radius:10px;background:var(--green);color:#fff;font-family:inherit;font-size:13px;font-weight:700;cursor:pointer;white-space:nowrap;flex-shrink:0" onclick="confirmQardPay(' + keyJs + ')">✓ সংরক্ষণ</button>' +
          '</div></div>'
        : '';
      return '<div class="qard-person-card">' +
        '<div style="display:flex;align-items:flex-start;gap:8px">' +
        '<span style="font-weight:700;font-size:14px;flex:1;min-width:0;line-height:1.35;word-break:break-word">' + esc(r.key) + '</span>' +
        payBtn +
        '</div>' +
        statsHtml +
        expandHtml +
        '</div>';
    }).join('');
    return cards;
  }

  window.switchQardTab = function (tab) {
    _qardTab = tab;
    _payQardOpenBucket = null; /* ট্যাব বদলালে expand বন্ধ */
    renderAccAccountDetails(_detailAccount);
  };

  window.openAccAccountDetails = function (account) {
    _metricModalKind = '';
    _settingsModalOpen = false;
    _detailAccount = account;
    _qardTab = 'entries'; /* modal খুললে সর্বদা এন্ট্রি ট্যাব প্রথমে */
    _payQardOpenBucket = null;
    _detailMonthFs = _monFs.length ? _monFs.slice() : [];
    _detailCatFs = [];
    _detailCategory = 'all';
    _detailSupFs = [];
    _detailSearch = '';
    _detailSort = 'date_desc';
    renderAccAccountDetails(account);
    openModal('account-details');
  };

  window.openAccDueDetails = function (account) {
    _metricModalKind = 'dues';
    _settingsModalOpen = false;
    _dueAccFs = account && account !== 'all' ? [account] : [];
    renderAccMetricModal();
    openModal('account-details');
  };

  function metricTitle(kind) {
    if (kind === 'income') return 'আয়ের বিস্তারিত';
    if (kind === 'expense') return 'ব্যয়ের বিস্তারিত';
    if (kind === 'dues') return 'বকেয়ার বিস্তারিত';
    return 'বিস্তারিত হিসাব';
  }

  function isMetricModalOpen() {
    var modal = document.getElementById('modal-account-details');
    return !!(_metricModalKind && modal && (modal.classList.contains('open') || modal.classList.contains('show')));
  }

  function isSettingsModalOpen() {
    var modal = document.getElementById('modal-account-details');
    return !!(_settingsModalOpen && modal && (modal.classList.contains('open') || modal.classList.contains('show')));
  }

  function renderAccMetricModal() {
    if (!_metricModalKind) return;
    var root = document.getElementById('account-details-root');
    var title = document.getElementById('account-details-title');
    if (!root) return;
    _detailAccount = '';
    if (title) {
      title.className = '';
      title.textContent = metricTitle(_metricModalKind);
    }
    if (_metricModalKind === 'income') root.innerHTML = buildIncomeList();
    else if (_metricModalKind === 'expense') root.innerHTML = buildExpenseList();
    else if (_metricModalKind === 'dues') root.innerHTML = buildDues('renderAccMetricModal()');
  }

  window.renderAccMetricModal = renderAccMetricModal;
  window.openAccMetricModal = function (kind) {
    _metricModalKind = kind;
    _settingsModalOpen = false;
    if (kind === 'income' || kind === 'expense') {
      _accFs = [];
      _catFs = [];
      _dayF = 'all';
      _fromKey = 'all';
      _toKey = 'all';
    }
    renderAccMetricModal();
    openModal('account-details');
  };

  window.setAccDetailFilter = function (field, value) {
    if (field === 'search') _detailSearch = value || '';
    else if (field === 'sort') _detailSort = value || 'date_desc';
    renderAccAccountDetails(_detailAccount);
    if (field === 'search') {
      var searchEl = document.getElementById('acc-detail-search');
      if (searchEl) {
        searchEl.focus();
        var len = searchEl.value.length;
        if (searchEl.setSelectionRange) searchEl.setSelectionRange(len, len);
      }
    }
  };

  window.clearAccDetailFilters = function () {
    _detailMonthFs = [];
    _detailCatFs = [];
    _detailSupFs = [];
    _detailSearch = '';
    _detailSort = 'date_desc';
    renderAccAccountDetails(_detailAccount);
  };

  window.toggleDetailMonth = function (val, checked) { _msToggle(_detailMonthFs, A.monthKey(val), checked); };
  window.toggleAllDetailMonths = function () {
    var avail = window._detailMonthsList || A.MONTHS;
    _detailMonthFs = _detailMonthFs.length ? [] : avail.slice();
    _rebuildFilterDropdown();
  };
  window.toggleDetailCat = function (val, checked) { _msToggle(_detailCatFs, val, checked); };
  window.toggleAllDetailCats = function () {
    var avail = window._detailCatsList || [];
    _detailCatFs = _detailCatFs.length ? [] : avail.slice();
    _rebuildFilterDropdown();
  };
  window.openAccDetailFilterSheet = function (focus) {
    var avMons = window._detailMonthsList || A.MONTHS;
    var avCats = window._detailCatsList || [];
    var monSection = _msList(avMons, _detailMonthFs, 'toggleDetailMonth', 'toggleAllDetailMonths', 'মাস');
    var catSection = _msList(avCats, _detailCatFs, 'toggleDetailCat', 'toggleAllDetailCats', 'খাত / ক্যাটাগরি');
    var first = focus === 'cat' ? catSection : monSection;
    var second = focus === 'cat' ? monSection : catSection;
    var body = '<div style="margin-bottom:12px">' + first + '</div>' +
      '<div style="margin-bottom:12px">' + second + '</div>' +
      '<div class="acc-filter-bar" style="margin:4px 0 0"><button type="button" class="acc-btn acc-btn-inc" onclick="closeAccSheet();renderAccAccountDetails(_detailAccount)" style="border-radius:10px;flex:2">প্রয়োগ করুন</button><button type="button" class="acc-date-clear" onclick="clearAccDetailFilters()" style="flex:1">রিসেট</button></div>';
    _sheet('হিসাব বই ফিল্টার', body);
  };

  /* ── Grouped filter dropdown (নতুন ড্রপডাউন ফিল্টার) ── */
  var _detailDropdownTrigger = null;
  window.toggleDetailSupplier = function (val, checked) {
    _msToggle(_detailSupFs, val, checked);
    _rebuildFilterDropdown();
  };
  window.toggleAllDetailSuppliers = function () {
    var avail = window._detailSuppsList || [];
    _detailSupFs = _detailSupFs.length ? [] : avail.slice();
    _rebuildFilterDropdown(); /* rebuild needed because item list may change */
  };
  function _rebuildFilterDropdown() {
    var trigger = _detailDropdownTrigger;
    var scrollTop = 0;
    var existing = document.getElementById('acc-filter-dropdown');
    if (existing) {
      var panel = existing.querySelector('.acc-dd-panel');
      if (panel) scrollTop = panel.scrollTop;
    }
    window.closeAccFilterDropdown();
    if (trigger) { window.openAccDetailFilterDropdown(trigger); var p = document.querySelector('.acc-dd-panel'); if (p) p.scrollTop = scrollTop; }
  }
  window.openAccDetailFilterDropdown = function (triggerEl) {
    var existing = document.getElementById('acc-filter-dropdown');
    if (existing) { existing.remove(); _detailDropdownTrigger = null; return; }
    _detailDropdownTrigger = triggerEl;
    var avMons = window._detailMonthsList || A.MONTHS;
    var avCats = window._detailCatsList || [];
    var avSups = window._detailSuppsList || [];
    var sections = [];
    var secIdx = 0;
    function _ddGroup(title, items, activeArr, toggleFn, toggleAllFn) {
      var sid = 'dfs-' + (secIdx++);
      var activeCount = activeArr.length;
      var itemsHtml = items.map(function (item) {
        var on = activeArr.indexOf(item) >= 0;
        return '<label class="acc-ms-item' + (on ? ' is-on' : '') + '" style="border-radius:10px;display:flex;width:100%;box-sizing:border-box">' +
          '<input type="checkbox" class="acc-ms-cb" ' + (on ? 'checked' : '') + ' onchange="' + toggleFn + '(\'' + esc(item) + '\',this.checked);window._refreshAccDropdownUI()">' +
          '<span class="acc-ms-circle">✓</span>' +
          '<span style="flex:1">' + esc(item) + '</span></label>';
      }).join('');
      var allOn = activeCount === 0;
      var html = '<div class="acc-dd-section" id="' + sid + '">' +
        '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:6px">' +
        '<div class="acc-ms-section-head">' + title + ' <span class="acc-dds-count" style="font-size:9px;font-weight:400;color:var(--ink3)">(' + bn(activeCount || items.length) + (activeCount ? '/' + bn(items.length) : '') + ')</span></div>' +
        '<button type="button" class="acc-ms-selall" onclick="' + toggleAllFn + '()">' + (allOn ? 'বাতিল সব' : 'সব নির্বাচন') + '</button></div>' +
        '<div class="acc-dd-section-list">' + itemsHtml + '</div>' +
        '<div class="acc-dds-chip-wrap" style="margin-top:4px;display:' + (activeCount ? 'flex' : 'none') + ';flex-wrap:wrap;gap:4px;min-height:4px">' +
        (activeCount === 0 ? '' : '<span class="acc-chip">' + bn(activeCount) + ' টি</span>') +
        '</div>' +
        '</div>';
      sections.push({ id: sid, title: title });
      return html;
    }
    var supGroupTitle = (_detailAccount === 'qard') ? 'খাত (করজ গ্রুপ)' : 'সরবরাহকারী';
    var sectionsHtml = _ddGroup('মাস', avMons, _detailMonthFs, 'toggleDetailMonth', 'toggleAllDetailMonths') +
      _ddGroup('খাত', avCats, _detailCatFs, 'toggleDetailCat', 'toggleAllDetailCats') +
      _ddGroup(supGroupTitle, avSups, _detailSupFs, 'toggleDetailSupplier', 'toggleAllDetailSuppliers');
    var tabsHtml = '<div class="acc-dd-tabs">' +
      '<button type="button" class="acc-dd-tab acc-dd-tab-on" data-target="all" onclick="window._filterByTab(this)">সব</button>' +
      sections.map(function (s) {
        return '<button type="button" class="acc-dd-tab" data-target="' + s.id + '" onclick="window._filterByTab(this)">' + esc(s.title) + '</button>';
      }).join('') + '</div>';
    var totalActive = _detailMonthFs.length + _detailCatFs.length + _detailSupFs.length;
    var el = document.createElement('div');
    el.id = 'acc-filter-dropdown';
    el.className = 'acc-dd-backdrop';
    el.onclick = closeAccFilterDropdown;
    el.innerHTML = '<div class="acc-dd-panel" onclick="event.stopPropagation()">' +
      '<div class="acc-sheet-head" style="padding:10px 12px 6px"><div class="acc-sheet-title">ফিল্টার' + (totalActive ? ' (' + bn(totalActive) + ')' : '') + '</div><button type="button" class="acc-sheet-close" onclick="closeAccFilterDropdown()">✕</button></div>' +
      tabsHtml +
      sectionsHtml +
      '<div class="acc-filter-bar" style="margin:4px 12px 12px"><button type="button" class="acc-btn acc-btn-inc" onclick="closeAccFilterDropdown();renderAccAccountDetails(_detailAccount)" style="border-radius:10px;flex:2">প্রয়োগ করুন</button><button type="button" class="acc-date-clear" onclick="clearAccDetailFilters();closeAccFilterDropdown()" style="flex:1">রিসেট</button></div>' +
      '</div>';
    var rect = triggerEl.getBoundingClientRect();
    var panelEl = el.querySelector('.acc-dd-panel');
    var dw = window.innerWidth >= 520 ? 360 : (window.innerWidth - 12);
    panelEl.style.position = 'fixed';
    panelEl.style.top = Math.min(rect.bottom + 4, window.innerHeight - 20) + 'px';
    panelEl.style.left = Math.max(4, Math.min(rect.left, window.innerWidth - dw - 4)) + 'px';
    panelEl.style.width = dw + 'px';
    panelEl.style.maxHeight = Math.min(480, window.innerHeight - rect.bottom - 24) + 'px';
    panelEl.style.overflowY = 'auto';
    document.body.appendChild(el);
  };
  window.closeAccFilterDropdown = function () {
    var el = document.getElementById('acc-filter-dropdown');
    if (el) el.remove();
    _detailDropdownTrigger = null;
  };
  window._rebuildFilterDropdown = _rebuildFilterDropdown;

  window._filterByTab = function (tabBtn) {
    var tabs = tabBtn.parentElement.querySelectorAll('.acc-dd-tab');
    for (var i = 0; i < tabs.length; i++) tabs[i].classList.remove('acc-dd-tab-on');
    tabBtn.classList.add('acc-dd-tab-on');
    var target = tabBtn.getAttribute('data-target');
    var panel = tabBtn.closest('.acc-dd-panel');
    if (!panel) return;
    var sections = panel.querySelectorAll('.acc-dd-section');
    for (var s = 0; s < sections.length; s++) {
      if (target === 'all') sections[s].style.display = '';
      else sections[s].style.display = sections[s].id === target ? '' : 'none';
    }
    if (target !== 'all') {
      var targSection = panel.querySelector('#' + target);
      if (targSection) targSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  window._refreshAccDropdownUI = function () {
    var dd = document.getElementById('acc-main-filter-dropdown') || document.getElementById('acc-filter-dropdown');
    if (!dd) return;
    var totalActive = 0;
    var sections = dd.querySelectorAll('.acc-dd-section');
    for (var s = 0; s < sections.length; s++) {
      var section = sections[s];
      var cbs = section.querySelectorAll('.acc-ms-cb');
      var activeCount = 0;
      for (var c = 0; c < cbs.length; c++) if (cbs[c].checked) activeCount++;
      totalActive += activeCount;
      /* update count badge */
      var countSpan = section.querySelector('.acc-dds-count');
      if (countSpan && cbs.length) {
        countSpan.textContent = '(' + bn(activeCount || cbs.length) + (activeCount ? '/' + bn(cbs.length) : '') + ')';
      }
      /* update select-all button */
      var selAll = section.querySelector('.acc-ms-selall');
      if (selAll) selAll.textContent = activeCount === 0 ? 'বাতিল সব' : 'সব নির্বাচন';
      /* update chip */
      var chipWrap = section.querySelector('.acc-dds-chip-wrap');
      var chip = chipWrap ? chipWrap.querySelector('.acc-chip') : null;
      if (activeCount === 0) {
        if (chipWrap) chipWrap.style.display = 'none';
      } else {
        if (chipWrap) { chipWrap.style.display = 'flex'; if (chip) chip.textContent = bn(activeCount) + ' টি'; }
      }
      /* update item is-on classes */
      var items = section.querySelectorAll('.acc-ms-item');
      for (var it = 0; it < items.length; it++) {
        var cb = items[it].querySelector('.acc-ms-cb');
        if (cb) items[it].classList.toggle('is-on', cb.checked);
      }
    }
    /* update title count */
    var title = dd.querySelector('.acc-sheet-title');
    if (title) {
      title.textContent = 'ফিল্টার' + (totalActive ? ' (' + bn(totalActive) + ')' : '');
    }
  };

  /* ══════════════ INCOME LIST ══════════════ */
  function buildIncomeList() {
    normalizeMonthFilters();
    var rows = A.Income.getAll();
    if (_yearFs.length) rows = rows.filter(function (r) { return _yearFs.indexOf(String(r.hijriYear)) >= 0; });
    if (_monFs.length) rows = rows.filter(function (r) { return _monFs.indexOf(A.monthKey(r.month)) >= 0; });
    rows = rows.slice().sort(function (a, b) { return (b._at || 0) - (a._at || 0); });
    var total = rows.reduce(function (s, r) { return s + A.num(r.amount); }, 0);
    var readOnly = isAccountsReadOnly();
    var items = rows.map(function (r) {
      var desc = A.clean(r.note, '') || A.clean(r.source, '') || 'আয়';
      return '<div class="acc-list-item"><div class="acc-list-top">' +
        '<div class="acc-list-desc">' + esc(desc) + '</div>' +
        '<div class="acc-list-amt inc">৳' + fa(r.amount) + '</div>' +
        (readOnly ? '' : '<div class="acc-row-actions"><button class="acc-icon-btn edit" title="এডিট" onclick="editAccEntry(\'income\',\'' + esc(r.id) + '\')">✎</button><button class="acc-icon-btn del" title="মুছুন" onclick="delAccEntry(\'income\',\'' + esc(r.id) + '\')">✕</button></div>') +
        '</div><div class="acc-list-meta">' + esc(A.monthKey(r.month) || '') + (r.day ? ' · ' + bn(r.day) : '') + '</div></div>';
    }).join('');
    var filterOn = _monFs.length > 0 || _yearFs.length > 0;
    var activeCount = _monFs.length + _yearFs.length;
    var clearBtn = filterOn ? '<button type="button" class="acc-tool-btn" style="color:var(--red);margin-left:auto" onclick="resetAccFilters()">✕ সাফ</button>' : '';
    return '<div class="acc-money-hero" style="margin-bottom:8px"><div class="acc-money-label">আয়</div><div class="acc-money-main good">৳' + fa(total) + '</div><div class="sub">মোট সংখ্যা: ' + count(rows.length, 'টি') + '</div></div>' +
      '<div class="acc-toolbar">' + filterIconBtn(filterOn, activeCount) + clearBtn + '</div>' +
      (items || '<div class="acc-empty">কোনো আয়ের রেকর্ড নেই</div>');
  }

  /* ══════════════ EXPENSE LIST ══════════════ */
  function buildExpenseList() {
    normalizeMonthFilters();
    var rows = A.Expense.getAll();
    if (_yearFs.length) rows = rows.filter(function (r) { return _yearFs.indexOf(String(r.hijriYear)) >= 0; });
    if (_monFs.length) rows = rows.filter(function (r) { return _monFs.indexOf(A.monthKey(r.month)) >= 0; });
    if (_accFs.length) rows = rows.filter(function (r) { return _accFs.indexOf(r.account) >= 0; });
    if (_catFs.length) rows = rows.filter(function (r) { return _catFs.indexOf(A.clean(r.category, '') || '') >= 0; });
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
    /* করজে হাসানা (qard) আলাদা — মোট ব্যয়ে গণনা হবে না */
    var qardRows = rows.filter(function (r) { return r.account === 'qard'; });
    var nonQardRows = rows.filter(function (r) { return r.account !== 'qard'; });
    var total = nonQardRows.reduce(function (s, r) { return s + A.num(r.amount); }, 0);
    var qardTotal = qardRows.reduce(function (s, r) { return s + A.num(r.amount); }, 0);
    var readOnly = isAccountsReadOnly();
    function rowHtml(r) {
      var category  = A.clean(r.category, '');
      var supplier  = A.clean(r.supplier, '');
      var receiptNo = A.clean(r.receiptNo, '');
      var desc = A.clean(r.description, '') || category || 'ব্যয়';
      var qInfo = r.quantity ? bn(A.num(r.quantity)) + (r.unit ? ' ' + esc(r.unit) : '') + (r.unitPrice ? ' × ৳' + fa(r.unitPrice) : '') : 'উল্লেখ নেই';
      var isQardRow = r.account === 'qard';
      /* qard-এ আদায় করজে হাসানা modal-এর খাত-ভিত্তিক সারি থেকে; এখানে শুধু del */
      var actionBtns = isQardRow
        ? '<button class="acc-icon-btn del" title="মুছুন" onclick="delAccEntry(\'expense\',\'' + esc(r.id) + '\')">✕</button>'
        : '<button class="acc-icon-btn edit" title="এডিট" onclick="editAccEntry(\'expense\',\'' + esc(r.id) + '\')">✎</button><button class="acc-icon-btn del" title="মুছুন" onclick="delAccEntry(\'expense\',\'' + esc(r.id) + '\')">✕</button>';
      return '<tr>' +
        '<td>' + esc(A.dateLabel(r)) + '</td>' +
        '<td>' + esc(A.ACCOUNT_LABELS[r.account] || r.account || '') + '</td>' +
        '<td>' + esc(category || 'অন্যান্য') + '</td>' +
        '<td class="acc-desc-cell">' + esc(desc) + '</td>' +
        '<td>' + qInfo + '</td>' +
        '<td>' + esc(supplier || 'উল্লেখ নেই') + '</td>' +
        '<td style="color:var(--ink3);font-size:11px">' + (receiptNo ? esc(receiptNo) : '—') + '</td>' +
        '<td class="acc-ledger-amt">৳' + fa(r.amount) + '</td>' +
        (readOnly ? '' : '<td><div class="acc-row-actions">' + actionBtns + '</div></td>') +
        '</tr>';
    }
    var items = rows.map(rowHtml).join('');
    var filterOn = _monFs.length > 0 || _accFs.length > 0 || _catFs.length > 0 || _dayF !== 'all';
    var rangeOn = _fromKey !== 'all' || _toKey !== 'all';
    var anyFilterOn = filterOn || rangeOn;
    var activeCount = _monFs.length + _accFs.length + _catFs.length + _yearFs.length + (_dayF !== 'all' ? 1 : 0) + (rangeOn ? 1 : 0);
    var sortNames = { date_asc:'পুরাতন আগে', date_desc:'নতুন আগে', amount_desc:'বেশি টাকা', amount_asc:'কম টাকা', newest:'নতুন এন্ট্রি', oldest:'পুরাতন এন্ট্রি' };
    var chips = [
      anyFilterOn ? ('ফিল্টার চালু (' + bn(activeCount) + ')') : 'সব তথ্য',
      sortNames[_sortF] || 'সাজানো',
    ].map(function (x) { return '<span class="acc-chip">' + esc(x) + '</span>'; }).join('');
    var clearBtn = anyFilterOn ? '<button type="button" class="acc-tool-btn" style="color:var(--red);margin-left:auto" onclick="resetAccFilters()">✕ সাফ</button>' : '';
    var qardNote = qardTotal ? ('<div class="sub" style="color:var(--gold)">করজে হাসানা ৳' + fa(qardTotal) + ' (আলাদা)</div>') : '';
    return '<div class="acc-money-hero" style="margin-bottom:8px"><div class="acc-money-label">ব্যয়</div><div class="acc-money-main" style="color:var(--red)">৳' + fa(total) + '</div><div class="sub" style="position:relative">মোট সংখ্যা: ' + count(rows.length, 'টি') + '</div>' + qardNote + '</div>' +
      '<div class="acc-toolbar">' +
      filterIconBtn(anyFilterOn, activeCount) +
      '<button type="button" class="acc-tool-btn acc-sort-btn" onclick="openAccSortSheet()" title="সাজান">⇅</button>' +
      clearBtn +
      '</div><div class="acc-chipline">' + chips + '</div>' +
      '<div class="acc-expense-wrap"><table class="acc-expense-table"><thead><tr><th>তারিখ</th><th>হিসাব বই</th><th>খাত</th><th>বিবরণ</th><th>পরিমাণ</th><th>সরবরাহকারী</th><th>রশিদ নং</th><th>টাকা</th>' + (readOnly ? '' : '<th></th>') + '</tr></thead><tbody>' +
      (items || '<tr><td colspan="' + (readOnly ? '8' : '9') + '" style="text-align:center;color:var(--ink3)">কোনো ব্যয়ের রেকর্ড নেই</td></tr>') +
      '</tbody></table></div>';
  }

  /* ══════════════ DUES (compact table) ══════════════ */
  var _duesDropdownTrigger = null;
  window.toggleDueAccount = function (id, checked) {
    if (checked) {
      if (_dueAccFs.indexOf(id) < 0) _dueAccFs.push(id);
    } else {
      var idx = _dueAccFs.indexOf(id);
      if (idx >= 0) _dueAccFs.splice(idx, 1);
    }
  };
  window.toggleAllDueAccounts = function () {
    _dueAccFs = _dueAccFs.length ? [] : expenseBookKeys();
    _rebuildDuesDropdown();
  };
  window.openDuesFilterDropdown = function (triggerEl) {
    var existing = document.getElementById('acc-dues-filter-dropdown');
    if (existing) { existing.remove(); _duesDropdownTrigger = null; return; }
    _duesDropdownTrigger = triggerEl;
    var accounts = expenseBookEntries();
    var itemsHtml = accounts.map(function (e) {
      var id = e[0], label = e[1];
      var on = _dueAccFs.indexOf(id) >= 0;
      return '<label class="acc-ms-item' + (on ? ' is-on' : '') + '" style="border-radius:10px;display:flex;width:100%;box-sizing:border-box">' +
        '<input type="checkbox" class="acc-ms-cb" ' + (on ? 'checked' : '') + ' onchange="toggleDueAccount(\'' + esc(id) + '\',this.checked);window._refreshDuesDropdownUI()">' +
        '<span class="acc-ms-circle">✓</span>' +
        '<span style="flex:1">' + esc(label) + '</span></label>';
    }).join('');
    var allOn = _dueAccFs.length === 0;
    var totalActive = _dueAccFs.length;
    var el = document.createElement('div');
    el.id = 'acc-dues-filter-dropdown';
    el.className = 'acc-dd-backdrop';
    el.onclick = window.closeDuesFilterDropdown;
    el.innerHTML = '<div class="acc-dd-panel" onclick="event.stopPropagation()">' +
      '<div class="acc-sheet-head" style="padding:10px 12px 6px"><div class="acc-sheet-title">হিসাব বই' + (totalActive && !allOn ? ' (' + bn(totalActive) + ')' : '') + '</div><button type="button" class="acc-sheet-close" onclick="closeDuesFilterDropdown()">✕</button></div>' +
      '<div class="acc-dd-section"><div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:6px">' +
      '<div class="acc-ms-section-head">হিসাব বই <span class="acc-dds-count" style="font-size:9px;font-weight:400;color:var(--ink3)">(' + bn(totalActive || accounts.length) + (totalActive && !allOn ? '/' + bn(accounts.length) : '') + ')</span></div>' +
      '<button type="button" class="acc-ms-selall" onclick="toggleAllDueAccounts()">' + (allOn ? 'বাতিল সব' : 'সব নির্বাচন') + '</button></div>' +
      '<div class="acc-dd-section-list">' + itemsHtml + '</div></div>' +
      '<div class="acc-filter-bar" style="margin:4px 12px 12px"><button type="button" class="acc-btn acc-btn-inc" onclick="closeDuesFilterDropdown();renderAccMetricModal()" style="border-radius:10px;flex:2">প্রয়োগ করুন</button><button type="button" class="acc-date-clear" onclick="_dueAccFs=[];closeDuesFilterDropdown();renderAccMetricModal()" style="flex:1">রিসেট</button></div>' +
      '</div>';
    var rect = triggerEl.getBoundingClientRect();
    var panelEl = el.querySelector('.acc-dd-panel');
    panelEl.style.position = 'fixed';
    panelEl.style.top = Math.min(rect.bottom + 4, window.innerHeight - 20) + 'px';
    panelEl.style.left = Math.max(4, Math.min(rect.left, window.innerWidth - 300)) + 'px';
    panelEl.style.width = '260px';
    panelEl.style.maxHeight = Math.min(380, window.innerHeight - rect.bottom - 24) + 'px';
    panelEl.style.overflowY = 'auto';
    document.body.appendChild(el);
  };
  window.closeDuesFilterDropdown = function () {
    var el = document.getElementById('acc-dues-filter-dropdown');
    if (el) el.remove();
    _duesDropdownTrigger = null;
  };
  window._rebuildDuesDropdown = function () {
    var trigger = _duesDropdownTrigger;
    var scrollTop = 0;
    var existing = document.getElementById('acc-dues-filter-dropdown');
    if (existing) { var panel = existing.querySelector('.acc-dd-panel'); if (panel) scrollTop = panel.scrollTop; }
    window.closeDuesFilterDropdown();
    if (trigger) { window.openDuesFilterDropdown(trigger); var p = document.querySelector('.acc-dd-panel'); if (p) p.scrollTop = scrollTop; }
  };
  window._refreshDuesDropdownUI = function () {
    var dd = document.getElementById('acc-dues-filter-dropdown');
    if (!dd) return;
    var section = dd.querySelector('.acc-dd-section');
    if (!section) return;
    var cbs = section.querySelectorAll('.acc-ms-cb');
    var activeCount = 0;
    for (var c = 0; c < cbs.length; c++) if (cbs[c].checked) activeCount++;
    var countSpan = section.querySelector('.acc-dds-count');
    if (countSpan) countSpan.textContent = '(' + bn(activeCount || cbs.length) + (activeCount ? '/' + bn(cbs.length) : '') + ')';
    var selAll = section.querySelector('.acc-ms-selall');
    if (selAll) selAll.textContent = activeCount === 0 ? 'বাতিল সব' : 'সব নির্বাচন';
    var title = dd.querySelector('.acc-sheet-title');
    if (title) title.textContent = 'হিসাব বই' + (activeCount && activeCount < cbs.length ? ' (' + bn(activeCount) + ')' : '');
    var items = section.querySelectorAll('.acc-ms-item');
    for (var it = 0; it < items.length; it++) {
      var cb = items[it].querySelector('.acc-ms-cb');
      if (cb) items[it].classList.toggle('is-on', cb.checked);
    }
  };

  function buildDues(rerenderCmd) {
    var readOnly = isAccountsReadOnly();
    var activeCount = _dueAccFs.length;
    var badge = activeCount ? '<span class="acc-filter-badge">' + bn(activeCount) + '</span>' : '';
    var filterBar = '<div class="acc-toolbar">' +
      '<button type="button" class="acc-filter-icon-btn' + (activeCount ? ' is-on' : '') + '" onclick="openDuesFilterDropdown(this)" style="width:auto;min-width:100px">' +
      '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0"><line x1="4" y1="6" x2="20" y2="6"/><line x1="8" y1="12" x2="16" y2="12"/><line x1="10" y1="18" x2="14" y2="18"/></svg>' +
      'হিসাব বই' + badge + '</button></div>';
    var dues = A.Dues.getAll().filter(function (d) { return A.num(d.due) > 0; });
    if (_dueAccFs.length) dues = dues.filter(function (d) { return _dueAccFs.indexOf(d.account) >= 0; });
    if (!dues.length) return filterBar + '<div class="acc-empty">এই হিসাব বইতে কোনো বকেয়া নেই</div>';
    var rows = dues.map(function (d) {
      var isDue = A.num(d.due) > 0;
      var supplier = A.clean(d.supplier, 'সরবরাহকারী');
      return '<tr>' +
        '<td><div>' + esc(supplier) + '</div><small style="color:var(--ink3)">' + esc(A.ACCOUNT_LABELS[d.account] || d.account) + '</small></td>' +
        '<td>৳' + fa(d.total) + '</td>' +
        '<td style="color:var(--green)">৳' + fa(d.paid) + '</td>' +
        '<td style="color:' + (isDue ? 'var(--red)' : 'var(--green)') + ';font-weight:700">' + (isDue ? '' : '✓') + '৳' + fa(Math.abs(A.num(d.due))) + '</td>' +
        (readOnly ? '' : '<td>' + (isDue ? '<button class="acc-pay-btn" onclick="payDue(\'' + esc(d.id) + '\')">পরিশোধ</button>' : '') + '</td>') +
        '</tr>';
    }).join('');
    var totalDue = dues.reduce(function (s, d) { return s + Math.max(0, A.num(d.due)); }, 0);
    return filterBar +
      '<div style="font-size:12px;color:var(--ink3);margin-bottom:8px">মোট বকেয়া: <strong style="color:var(--red)">৳' + fa(totalDue) + '</strong></div>' +
      '<div style="overflow-x:auto"><table class="acc-sum-tbl"><thead><tr><th>সরবরাহকারী</th><th>মোট</th><th>দেওয়া</th><th>বকেয়া</th>' + (readOnly ? '' : '<th></th>') + '</tr></thead><tbody>' + rows + '</tbody></table></div>';
  }

  /* ══════════════ SETTINGS ══════════════ */
  function buildSettings() {
    var cats = A.Categories.getAll();
    var catRows = cats.map(function (c) {
      var isDef = A.Categories.isDefault(c);
      return '<div class="acc-cat-row"><span>' + esc(c) + (isDef ? ' <span style="font-size:9px;color:var(--ink3)">(ডিফল্ট)</span>' : '') + '</span>' +
        (isDef ? '' : '<button class="acc-del-btn" onclick="delAccCategory(\'' + esc(c) + '\')">✕</button>') + '</div>';
    }).join('');
    var pinBlock = '';
    if (!isAccountsReadOnly() && typeof MMSession !== 'undefined' && MMSession.getStaffUserId()) {
      pinBlock = '<div style="margin-top:18px;padding-top:14px;border-top:1px solid var(--cream2)">' +
        '<div style="font-weight:700;font-size:14px;margin-bottom:10px">PIN পরিবর্তন</div>' +
        '<form onsubmit="event.preventDefault();saveOwnPin()">' +
        '<div class="form-group"><label class="form-label">বর্তমান PIN</label><input class="form-input" type="password" id="pc-cur" maxlength="4" inputmode="numeric" pattern="[0-9]*" autocomplete="current-password" placeholder="বর্তমান PIN"></div>' +
        '<div class="form-group"><label class="form-label">নতুন PIN</label><input class="form-input" type="password" id="pc-new" maxlength="4" inputmode="numeric" pattern="[0-9]*" autocomplete="new-password" placeholder="নতুন ৪-সংখ্যার PIN"></div>' +
        '<div class="form-group"><label class="form-label">নতুন PIN নিশ্চিত করুন</label><input class="form-input" type="password" id="pc-conf" maxlength="4" inputmode="numeric" pattern="[0-9]*" autocomplete="new-password" placeholder="পুনরায় PIN লিখুন"></div>' +
        '<button type="submit" class="submit-btn" style="margin-top:4px">PIN সংরক্ষণ করুন</button>' +
        '<div style="color:var(--red);font-size:12px;text-align:center;margin-top:8px;min-height:18px" id="pc-err"></div>' +
        '</form>' +
        '</div>';
    }
    return '<div style="font-family:\'Tiro Bangla\',serif;font-weight:700;font-size:14px;margin-bottom:8px">ব্যয়ের খাত ব্যবস্থাপনা</div>' +
      '<div style="margin-bottom:10px">' + catRows + '</div>' +
      '<div class="acc-filter-bar">' +
      '<input class="acc-sel" id="acc-new-cat" placeholder="নতুন খাত লিখুন" style="flex:3;border-radius:8px;padding:6px 10px;border:1px solid var(--cream2)">' +
      '<button class="acc-btn acc-btn-inc" onclick="addAccCategory()" style="flex:1.2;border-radius:8px">যোগ করুন</button>' +
      '</div>' + pinBlock;
  }

  window.addAccCategory = async function () {
    var el = document.getElementById('acc-new-cat');
    var name = el ? el.value.trim() : '';
    if (!name) return;
    try {
      await A.Categories.add(name); el.value = '';
      if (isSettingsModalOpen()) renderAccSettingsModal();
      else window.renderAccounts();
    } catch (err) {
      console.warn('[Accounts] category add failed', err);
      showToast('খাত সংরক্ষণ হয়নি');
    }
  };
  window.delAccCategory = async function (name) {
    if (!confirm('"' + name + '" খাত মুছবেন?')) return;
    try {
      await A.Categories.del(name);
      if (isSettingsModalOpen()) renderAccSettingsModal();
      else window.renderAccounts();
    } catch (err) {
      console.warn('[Accounts] category delete failed', err);
      showToast('খাত মুছা যায়নি');
    }
  };

  function isAdminSession() {
    return !!(typeof MMSession !== 'undefined' && MMSession && MMSession.isAdmin && MMSession.isAdmin());
  }

  function isAdminAccountsPage() {
    return !!document.querySelector('.admin-accounts-shell') ||
      /(^|\/)mdr-admin-accounts\.html$/i.test((typeof location !== 'undefined' && location.pathname) || '');
  }

  function isAccountsReadOnly() {
    return isAdminAccountsPage();
  }

  function entryAgeHours(entry) {
    var at = Number(entry && entry._at);
    if (!at) return Infinity;
    return (Date.now() - at) / 36e5;
  }

  function describeEntry(type, entry) {
    if (!entry) return '';
    if (type === 'income') {
      return 'ধরন: আয়\nতারিখ: ' + A.dateLabel(entry) + '\nপরিমাণ: ৳' + fa(entry.amount) + '\nবিবরণ: ' + (A.clean(entry.note, '') || A.clean(entry.source, '') || 'আয়');
    }
    return 'ধরন: ব্যয়\nহিসাব বই: ' + (A.ACCOUNT_LABELS[entry.account] || entry.account || '—') +
      '\nতারিখ: ' + A.dateLabel(entry) +
      '\nখাত: ' + (A.clean(entry.category, '') || 'অন্যান্য') +
      '\nবিবরণ: ' + (A.clean(entry.description, '') || 'ব্যয়') +
      '\nপরিমাণ: ৳' + fa(entry.amount) +
      '\nসরবরাহকারী: ' + (A.clean(entry.supplier, '') || 'উল্লেখ নেই');
  }

  function sessionActorId() {
    if (typeof MMSession === 'undefined' || !MMSession) return null;
    return isAdminSession()
      ? (MMSession.getAdminUserId && MMSession.getAdminUserId())
      : (MMSession.getStaffUserId && MMSession.getStaffUserId());
  }

  function sessionPin() {
    if (typeof MMSession === 'undefined' || !MMSession) return null;
    return isAdminSession()
      ? (MMSession.getAdminPin && MMSession.getAdminPin())
      : (MMSession.getStaffPin && MMSession.getStaffPin());
  }

  async function requestEntryChange(action, type, entry, reason, proposed) {
    var fromName = (typeof MMSession !== 'undefined' && MMSession && MMSession.getName && MMSession.getName()) || 'দফতর দায়িত্বশীল';
    var isEdit = action === 'edit';
    var text = 'হিসাব সংশোধন অনুরোধ\nঅ্যাকশন: এন্ট্রি ' + (isEdit ? 'এডিট করতে চান' : 'মুছতে চান') + '\n' + describeEntry(type, entry);
    if (isEdit) text += '\n\nপ্রস্তাবিত পরিবর্তন\n' + describeEntry(type, proposed);
    text += '\nকারণ: ' + reason;
    var request = {
      kind: isEdit ? 'account_entry_edit' : 'account_entry_delete',
      status: 'pending',
      entryType: type,
      entryId: entry.id,
      snapshot: entry,
      proposed: proposed || null,
      reason: reason,
      requestedAt: new Date().toISOString(),
    };
    if (typeof ChatAPI !== 'undefined' && ChatAPI && ChatAPI.send && ChatAPI.sendRemote && sessionPin()) {
      try {
        var res = await ChatAPI.sendRemote(sessionActorId(), sessionPin(), 'daftar', text, isAdminSession(), { request: request });
        if (!res || !res.ok) throw new Error((res && res.error) || 'chat_request_send_failed');
        var extra = { request: request };
        if (res.id) extra.id = String(res.id);
        ChatAPI.send('daftar', 'daftar', fromName, text, extra);
      } catch (e) {
        console.warn('Account approval request remote send failed', e);
        return false;
      }
      return true;
    }
    return false;
  }

  function applyEntryEdit(type, id, proposed) {
    if (type === 'income') A.Income.update(id, proposed);
    else A.Expense.update(id, proposed);
  }

  function refreshAccountsViews() {
    if (isMetricModalOpen()) {
      renderAccMetricModal();
      return;
    }
    window.renderAccounts();
    if (_detailAccount && document.getElementById('account-details-root')) {
      renderAccAccountDetails(_detailAccount);
    }
  }

  function rerenderAccountsView() {
    if (isMetricModalOpen()) renderAccMetricModal();
    else window.renderAccounts();
  }

  function renderAccSettingsModal() {
    var title = document.getElementById('account-details-title');
    var root = document.getElementById('account-details-root');
    if (title) {
      title.className = '';
      title.textContent = 'হিসাব সেটিংস';
    }
    if (root) root.innerHTML = buildSettings();
  }

  window.renderAccSettingsModal = renderAccSettingsModal;

  window.openAccSettingsPanel = function () {
    _metricModalKind = '';
    _detailAccount = '';
    _settingsModalOpen = true;
    renderAccSettingsModal();
    openModal('account-details');
  };

  window.openAccReportsPanel = function () {
    _metricModalKind = '';
    _settingsModalOpen = false;
    var title = document.getElementById('account-details-title');
    var root = document.getElementById('account-details-root');
    if (title) {
      title.className = '';
      title.textContent = 'হিসাব রিপোর্ট';
    }
    if (root) {
      if (typeof window.renderAccountsReports === 'function') window.renderAccountsReports(root, { reset: true });
      else root.innerHTML = '<div class="acc-empty">রিপোর্ট লোড হয়নি</div>';
    }
    openModal('account-details');
  };

  function ensureAccountSettingsTopbar() { /* settings button এখন acc-add-btns-এ */ }

  /* ══════════════ MAIN RENDER ══════════════ */
  window.renderAccounts = function () {
    A.ensureSeed();
    ensureCurrentMonthDefault();
    normalizeMonthFilters();
    var root = document.getElementById('accounts-root');
    if (!root) return;
    var filterCount = _monFs.length + _yearFs.length;
    var filterBtnTop = filterIconBtn(filterCount > 0, filterCount);
    var readOnly = isAccountsReadOnly();
    var actionBtns = '<button type="button" class="acc-report-top" onclick="openAccReportsPanel()">রিপোর্ট</button>';
    var topControls = readOnly
      ? '<div class="acc-add-btns acc-readonly">' + filterBtnTop + actionBtns + '</div>'
      : '<div class="acc-add-btns has-month"><button class="acc-btn acc-btn-inc" onclick="openAccModal(\'income\')">＋ আয়</button><button class="acc-btn acc-btn-exp" onclick="openAccModal(\'expense\')">＋ ব্যয়</button>' + filterBtnTop + actionBtns + '</div>';
    root.innerHTML =
      '<div class="acc-shell">' +
      topControls +
      '<div class="acc-content" id="acc-body"></div></div>';
    var body = document.getElementById('acc-body');
    if (_tab === 'settings') body.innerHTML = buildSettings();
    else body.innerHTML = buildSummary();
  };

  /* ══════════════ HELPERS ══════════════ */
  window.delAccEntry = async function (type, id) {
    if (isAccountsReadOnly()) { showToast('এডমিন পেইজে হিসাব দেখা যায়, এন্ট্রি বদলানো যায় না'); return; }
    var entry = type === 'income' ? A.Income.getById(id) : A.Expense.getById(id);
    if (!entry) { showToast('এন্ট্রি পাওয়া যায়নি'); return; }
    if (!isAdminSession() && entryAgeHours(entry) > 24) {
      var reason = prompt('২৪ ঘণ্টার বেশি পুরনো এন্ট্রি মুছতে জিম্মাদারের অনুমতি লাগবে। কারণ লিখুন:');
      if (!reason || !reason.trim()) return;
      if (await requestEntryChange('delete', type, entry, reason.trim())) showToast('সংশোধন অনুরোধ বার্তায় পাঠানো হয়েছে');
      else showToast('অনুরোধ পাঠানো যায়নি');
      return;
    }
    if (!confirm('এই এন্ট্রি মুছে ফেলবেন?')) return;
    try {
      if (type === 'expense') {
        var sup = A.clean(entry.supplier, '');
        var wasCredit = entry.paymentMethod !== 'cash';
        if (sup && wasCredit) await A.Dues.cancelPurchase(sup, entry.account, A.num(entry.amount));
        await A.Expense.del(id);
      } else {
        await A.Income.del(id);
      }
      refreshAccountsViews();
    } catch (err) {
      console.warn('[Accounts] delete failed', err);
      showToast('ডাটাবেজ থেকে মুছা যায়নি');
      if (A.bootstrapRemote) {
        try { await A.bootstrapRemote(); refreshAccountsViews(); } catch (e) {}
      }
    }
  };

  window.editAccEntry = async function (type, id) {
    if (isAccountsReadOnly()) { showToast('এডমিন পেইজে হিসাব দেখা যায়, এন্ট্রি বদলানো যায় না'); return; }
    var entry = type === 'income' ? A.Income.getById(id) : A.Expense.getById(id);
    if (!entry) { showToast('এন্ট্রি পাওয়া যায়নি'); return; }
    window.openAccModal(type, id);
  };

  window.payDue = async function (dueId) {
    if (isAccountsReadOnly()) { showToast('এডমিন পেইজে হিসাব দেখা যায়, পরিশোধ এন্ট্রি করা যায় না'); return; }
    var amtStr = prompt('পরিশোধের পরিমাণ (টাকা):');
    var amt = parseFloat(amtStr);
    if (!amt || amt <= 0) return;
    try {
      await A.Dues.recordPayment(dueId, amt);
      rerenderAccountsView();
      showToast('পরিশোধ নথিভুক্ত ✓');
    } catch (err) {
      console.warn('[Accounts] due payment failed', err);
      showToast('ডাটাবেজে পরিশোধ সংরক্ষণ হয়নি');
      if (A.bootstrapRemote) {
        try { await A.bootstrapRemote(); rerenderAccountsView(); } catch (e) {}
      }
    }
  };

  /* ↩ আদায় — inline expand toggle */
  window.toggleQardExpand = function (bucketKey, remaining) {
    _payQardOpenBucket = (_payQardOpenBucket === bucketKey) ? null : bucketKey;
    _qardTab = 'recovery';
    renderAccAccountDetails(_detailAccount);
    /* expand খুললে পরিমাণ input-এ focus */
    if (_payQardOpenBucket === bucketKey) {
      setTimeout(function () {
        var el = document.getElementById('qpay-expand-amt');
        if (el) { el.focus(); el.select(); }
      }, 60);
    }
  };

  /* ↩ আদায় — ইনপুট থেকে সংরক্ষণ */
  window.confirmQardPay = async function (bucketKey) {
    if (isAccountsReadOnly()) { showToast('এডমিন পেইজে আদায় নথিভুক্ত করা যায় না'); return; }
    var amtEl = document.getElementById('qpay-expand-amt');
    var amt = parseFloat(amtEl ? amtEl.value : 0);
    if (!amt || amt <= 0) { showToast('সঠিক পরিমাণ লিখুন'); if (amtEl) amtEl.focus(); return; }
    var todayH = A.todayHijri();
    try {
      await A.Income.add({
        account: 'qard_return',
        hijriYear: todayH.year,
        month: todayH.month,
        day: todayH.day,
        amount: amt,
        note: 'করজে হাসানা আদায় — ' + String(bucketKey || ''),
        source: 'করজে হাসানা',
      });
      _payQardOpenBucket = null;
      refreshAccountsViews();
      showToast('আদায় নথিভুক্ত ✓');
    } catch (err) {
      console.warn('[Accounts] qard return failed', err);
      showToast('ডাটাবেজে সংরক্ষণ হয়নি');
      if (A.bootstrapRemote) {
        try { await A.bootstrapRemote(); refreshAccountsViews(); } catch (e) {}
      }
    }
  };

})();
