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
var _detailAccount = '';
var _detailMonth = 'all';
var _detailCategory = 'all';
var _detailSupplier = 'all';
var _detailSearch = '';
var _detailSort = 'date_asc';
var _accDefaulted = false;
var _metricModalKind = '';
var _settingsModalOpen = false;
var _yearF        = 'all';
var _editEntryId  = null;
var _editEntryType = '';
var _editNeedsApproval = false;

(function () {
  var A   = MdrAccAPI;
  var esc = function (s) { return A.esc(s); };
  var fa  = function (n) { return A.fa(n); };
  var pct = function (n) { return A.pct ? A.pct(n) : bn(n) + '%'; };
  var count = function (n, label) { return A.count ? A.count(n, label) : bn(n) + (label ? ' ' + label : ''); };
  var bn  = function (s) { return String(s || '').replace(/[0-9]/g, function (d) { return '০১২৩৪৫৬৭৮৯'[d]; }); };

  function monthOptions(selected) {
    var current = selected === 'all' ? 'all' : A.monthKey(selected);
    return '<option value="all">সব মাস</option>' + A.MONTHS.map(function (m) {
      return '<option value="' + esc(m) + '"' + (current === m ? ' selected' : '') + '>' + esc(m) + '</option>';
    }).join('');
  }

  function normalizeMonthFilters() {
    if (_monF !== 'all') _monF = A.monthKey(_monF);
    if (_sumMonth !== 'all') _sumMonth = A.monthKey(_sumMonth);
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
    var current = A.todayHijri().month;
    _sumMonth = current || 'all';
    _monF = current || 'all';
    _accDefaulted = true;
  }

  if (!document.getElementById('acc-style')) {
    var cs = document.createElement('style');
    cs.id = 'acc-style';
    cs.textContent = `
body.page-daftar #panel-fees{margin-left:-12px;margin-right:-12px}
.acc-shell{padding-top:2px}
.acc-add-btns{display:grid;grid-template-columns:1fr 1fr .85fr;gap:6px;padding:2px 4px 8px}
.acc-add-btns.has-month{grid-template-columns:1fr 1fr minmax(96px,.85fr) .75fr;gap:6px;padding-bottom:6px}
.acc-btn{position:relative;overflow:hidden;padding:10px 0;border:none;border-radius:14px;font-size:13px;font-weight:800;cursor:pointer;font-family:inherit;box-shadow:0 8px 18px rgba(26,18,8,.08)}
.acc-add-btns.has-month .acc-btn{padding:8px 0;font-size:12px;border-radius:12px}
.acc-top-month{font-size:12px;border:1px solid var(--cream2);border-radius:12px;padding:0 7px;background:#fff;color:var(--ink1);min-width:0;font-family:inherit}
.acc-report-top{border:1px solid var(--cream2);border-radius:12px;background:#fff;color:var(--ink2);font-family:inherit;font-size:12px;font-weight:800;cursor:pointer;padding:0 6px;box-shadow:0 5px 13px rgba(26,18,8,.055)}
.acc-report-top.active{background:var(--ink);color:var(--gold2);border-color:var(--ink)}
.acc-top-settings{white-space:nowrap}
.acc-btn:active{transform:scale(.98)}
.acc-btn-inc{background:linear-gradient(135deg,#dcfce7,#bbf7d0);color:#065f46}
.acc-btn-exp{background:linear-gradient(135deg,#fee2e2,#fecaca);color:#991b1b}
.acc-tabs{display:flex;margin:0 4px 6px;padding:3px;gap:3px;overflow-x:auto;scrollbar-width:none;background:rgba(255,255,255,.72);border:1px solid rgba(26,18,8,.07);border-radius:14px;box-shadow:inset 0 1px 0 rgba(255,255,255,.7)}
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
.acc-metric-val{font-family:'Noto Serif Bengali',serif;font-size:13px;font-weight:800;color:var(--ink2);white-space:nowrap}
.acc-metric.good .acc-metric-val{color:var(--green)}.acc-metric.bad .acc-metric-val{color:var(--red)}.acc-metric.warn .acc-metric-val{color:var(--gold)}
.acc-ledger-card{background:#fff;border:1px solid rgba(26,18,8,.07);border-radius:16px;overflow:hidden;position:relative;box-shadow:0 5px 13px rgba(26,18,8,.055);margin-top:2px}
.acc-ledger-title{display:flex;align-items:center;justify-content:space-between;padding:10px 11px;border-bottom:1px solid var(--cream2);font-size:12px;font-weight:800;color:var(--ink2)}
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
.acc-money-main{font-family:'Noto Serif Bengali',serif;font-size:20px;font-weight:900;color:var(--ink2);position:relative;margin-top:0}
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
.acc-ledger-amt{font-family:'Noto Serif Bengali',serif;font-size:14px;font-weight:900;color:var(--red);white-space:nowrap}
.acc-ledger-table{margin-top:8px;border-top:1px dashed rgba(26,18,8,.12);padding-top:7px;display:grid;grid-template-columns:1fr 1fr;gap:4px 8px;font-size:10px;color:var(--ink3)}
.acc-ledger-table b{color:var(--ink2);font-size:11px}
.acc-table-wrap{overflow:auto;border:1px solid rgba(26,18,8,.07);border-radius:16px;background:#fff;max-height:none;flex:1;min-height:0}
body.page-daftar #modal-account-details .modal-title{margin-bottom:8px;gap:8px}
body.page-daftar #account-details-title{display:flex;align-items:center;gap:6px;min-width:0;flex:1;white-space:nowrap;overflow:hidden}
.acc-title-main{font-size:15px;overflow:hidden;text-overflow:ellipsis}
.acc-title-meta{font-size:10px;color:var(--ink3);font-family:'Noto Sans Bengali',sans-serif;font-weight:800;flex-shrink:0}
.acc-title-total{font-family:'Noto Serif Bengali',serif;font-size:12px;font-weight:900;color:var(--red);background:#fff4d9;border:1px solid rgba(154,106,33,.16);border-radius:999px;padding:4px 7px;white-space:nowrap;flex-shrink:0}
.acc-detail-tools{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:6px;margin-bottom:8px}
.acc-detail-tools .acc-sel{min-width:0;padding:6px 8px}
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
@media (min-width:520px){.acc-detail-tools{grid-template-columns:1fr 1fr 1fr 1.4fr 1fr auto}}
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
.acc-item-table th:nth-child(7),.acc-item-table td:nth-child(7){width:42px;text-align:center}
@media (max-width:640px){#modal-account-entry .modal{width:min(100%,calc(100vw - 16px));height:min(92vh,calc(100vh - 16px));padding:18px 14px 22px}#modal-account-entry .form-row{grid-template-columns:1fr;gap:10px}.acc-item-wrap{max-width:100%;overflow:auto}.acc-item-table th:nth-child(2),.acc-item-table td:nth-child(2){width:210px}}`;
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
        '<td><input class="form-input" value="' + (item.quantity || '') + '" type="number" placeholder="০" min="0" oninput="updateAccItem(' + i + ',\'quantity\',this.value)"></td>' +
        '<td><select class="form-input form-select" onchange="updateAccItem(' + i + ',\'unit\',this.value)">' + unitOptions(item.unit) + '</select></td>' +
        '<td><input class="form-input" value="' + (item.unitPrice || '') + '" type="number" placeholder="০" min="0" oninput="updateAccItem(' + i + ',\'unitPrice\',this.value)"></td>' +
        '<td><input class="form-input acc-item-amt" value="' + (item.amount || '') + '" type="number" placeholder="০" id="acc-item-amt-' + i + '" oninput="updateAccItem(' + i + ',\'amount\',this.value)"></td>' +
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
    if (field !== 'entry') rerenderAccountsView();
  };
  window.clearAccDateRange = function () {
    _fromKey = 'all'; _toKey = 'all';
    rerenderAccountsView();
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
    if (field === 'month') { _monF = value === 'all' ? 'all' : A.monthKey(value); _dayF = 'all'; _fromKey = 'all'; _toKey = 'all'; }
    if (field === 'day') _dayF = value;
    if (field === 'account') _accF = value;
    if (field === 'year') _yearF = value;
  };
  window.applyAccFilters = function () {
    window.closeAccSheet();
    rerenderAccountsView();
  };
  window.resetAccFilters = function () {
    _monF = 'all'; _dayF = 'all'; _accF = 'all'; _yearF = 'all';
    window.applyAccFilters();
  };
  window.openAccFilterSheet = function () {
    normalizeMonthFilters();
    var monOpts = monthOptions(_monF);
    var dayOpts = '<option value="all">সব দিন</option>' + Array.from({ length: 30 }, function (_, i) { var d = String(i + 1); return '<option value="' + d + '"' + (String(_dayF) === d ? ' selected' : '') + '>' + bn(d) + ' তারিখ</option>'; }).join('') +
      '<option value="__none"' + (_dayF === '__none' ? ' selected' : '') + '>দিন নেই</option>';
    var accOpts = '<option value="all">সব হিসাব</option>' + Object.entries(A.ACCOUNT_LABELS).map(function (e) { return '<option value="' + e[0] + '"' + (_accF === e[0] ? ' selected' : '') + '>' + esc(e[1]) + '</option>'; }).join('');
    var yearOpts = yearOptions(_yearF);
    _sheet('ফিল্টার নির্বাচন', '<div class="acc-sheet-grid">' +
      '<div class="acc-sheet-field"><label>বছর (হিজরী)</label><select class="acc-sel" onchange="setAccFilter(\'year\',this.value)">' + yearOpts + '</select></div>' +
      '<div class="acc-sheet-field"><label>মাস</label><select class="acc-sel" onchange="setAccFilter(\'month\',this.value)">' + monOpts + '</select></div>' +
      '<div class="acc-sheet-field"><label>দিন</label><select class="acc-sel" onchange="setAccFilter(\'day\',this.value)">' + dayOpts + '</select></div>' +
      '<div class="acc-sheet-field"><label>হিসাব বই</label><select class="acc-sel" onchange="setAccFilter(\'account\',this.value)">' + accOpts + '</select></div>' +
      '<div class="acc-filter-bar" style="margin:4px 0 0"><button type="button" class="acc-btn acc-btn-inc" onclick="applyAccFilters()" style="border-radius:10px;flex:2">প্রয়োগ</button><button type="button" class="acc-date-clear" onclick="resetAccFilters()" style="flex:1">রিসেট</button></div></div>');
  };
  window.setAccSort = function (value) {
    _sortF = value;
    window.closeAccSheet();
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
    _monF = 'all'; _dayF = 'all';
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

  /* ══════════════ OPEN MODAL (new + edit) ══════════════ */
  window.openAccModal = function (type, entryId) {
    _editEntryId   = entryId || null;
    _editEntryType = type;
    var entry = entryId
      ? (type === 'income' ? A.Income.getById(entryId) : A.Expense.getById(entryId))
      : null;
    _editNeedsApproval = !!(entry && !isAdminSession() && entryAgeHours(entry) > 24);

    _items = [_blank()];
    var incF = document.getElementById('acc-income-fields');
    var expF = document.getElementById('acc-expense-fields');
    if (incF) incF.style.display = type === 'income' ? '' : 'none';
    if (expF) expF.style.display = type === 'expense' ? '' : 'none';
    var t = document.getElementById('account-modal-title');
    if (t) t.textContent = entryId
      ? (type === 'income' ? 'আয় এডিট' : 'ব্যয় এডিট')
      : (type === 'income' ? 'আয় এন্ট্রি' : 'ব্যয় এন্ট্রি');
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
      if (accSel && entry) accSel.value = entry.account || 'general';
      if (se) se.value = entry ? A.clean(entry.supplier, '') : '';
      if (receiptEl) receiptEl.value = entry ? (entry.receiptNo || '') : '';
      if (entry) {
        _items = [{ category: A.clean(entry.category, ''), description: A.clean(entry.description, ''), quantity: entry.quantity || '', unit: entry.unit || 'কেজি', unitPrice: entry.unitPrice || '', amount: entry.amount || '' }];
      }
      _renderItems();
    }
    renderEditReasonField();
    openModal('account-entry');
  };

  /* ══════════════ SAVE (new + edit) ══════════════ */
  window.saveAccountEntry = function () {
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
        A.Income.update(_editEntryId, incomePatch);
        showToast('আয় আপডেট হয়েছে ✓');
      } else {
        A.Income.add(incomePatch);
        showToast('আয় সংরক্ষিত ✓');
      }
    } else {
      var account   = document.getElementById('acc-exp-account').value;
      var supplier  = (document.getElementById('acc-exp-supplier').value || '').trim();
      var receiptNo = (document.getElementById('acc-exp-receipt') ? document.getElementById('acc-exp-receipt').value : '').trim();
      var valid     = _items.filter(function (x) { return parseFloat(x.amount) > 0; });
      if (!valid.length) { showToast('কমপক্ষে একটি আইটেমের মোট টাকা দিন'); return; }
      if (isEdit) {
        var x = valid[0];
        var expensePatch = { account, hijriYear: parsed.year, month: parsed.month, day: parsed.day, category: x.category, description: x.description, quantity: x.quantity, unit: x.unit, unitPrice: x.unitPrice, amount: parseFloat(x.amount), supplier, receiptNo };
        if (_editNeedsApproval) {
          submitEntryApproval(type, originalEntry, { ...(originalEntry || {}), ...expensePatch });
          return;
        }
        A.Expense.update(_editEntryId, expensePatch);
        if (originalEntry) {
          var oldSup = A.clean(originalEntry.supplier, '');
          if (oldSup) A.Dues.cancelPurchase(oldSup, originalEntry.account, A.num(originalEntry.amount));
        }
        if (supplier) A.Dues.addOrUpdate(supplier, account, parseFloat(x.amount));
        showToast('ব্যয় আপডেট হয়েছে ✓');
      } else {
        valid.forEach(function (x) {
          A.Expense.add({ account, hijriYear: parsed.year, month: parsed.month, day: parsed.day, category: x.category, description: x.description, quantity: x.quantity, unit: x.unit, unitPrice: x.unitPrice, amount: parseFloat(x.amount), supplier, receiptNo });
          if (supplier) A.Dues.addOrUpdate(supplier, account, parseFloat(x.amount));
        });
        showToast(count(valid.length, 'টি') + ' ব্যয় সংরক্ষিত ✓');
      }
    }
    _editEntryId  = null;
    _editEntryType = '';
    _editNeedsApproval = false;
    closeModal('account-entry');
    rerenderAccountsView();
  };

  /* ══════════════ SUMMARY (Excel table + month + year filter) ══════════════ */
  function buildSummary() {
    normalizeMonthFilters();
    var AL   = A.ACCOUNT_LABELS;
    var accs = Object.keys(AL);
    var allExp = (_sumMonth === 'all' ? A.Expense.getAll() : A.Expense.getByMonth(_sumMonth))
      .filter(function (r) { return _yearF === 'all' || String(r.hijriYear) === _yearF; });
    var allInc = (_sumMonth === 'all' ? A.Income.getAll() : A.Income.getByMonth(_sumMonth))
      .filter(function (r) { return _yearF === 'all' || String(r.hijriYear) === _yearF; });
    var allDues = A.Dues.getAll();
    var s = {
      ti: allInc.reduce(function (sum, r) { return sum + A.num(r.amount); }, 0),
      te: allExp.reduce(function (sum, r) { return sum + A.num(r.amount); }, 0),
      td: A.Dues.totalDue(),
    };
    var rows = accs.map(function (acc) {
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
    var tb = s.ti - s.te;
    var paid = Math.max(0, s.te - Math.max(0, s.td));
    var balCls = tb >= 0 ? 'good' : 'bad';
    var metrics = '<div class="acc-metrics">' +
      '<button type="button" class="acc-metric acc-metric-click good" onclick="openAccMetricModal(\'income\')"><div class="acc-metric-lbl">আয়</div><div class="acc-metric-val">৳' + fa(s.ti) + '</div></button>' +
      '<button type="button" class="acc-metric acc-metric-click bad" onclick="openAccMetricModal(\'expense\')"><div class="acc-metric-lbl">ব্যয়</div><div class="acc-metric-val">৳' + fa(s.te) + '</div></button>' +
      '<div class="acc-metric good"><div class="acc-metric-lbl">পরিশোধ</div><div class="acc-metric-val">৳' + fa(paid) + '</div></div>' +
      '<button type="button" class="acc-metric acc-metric-click warn" onclick="openAccMetricModal(\'dues\')"><div class="acc-metric-lbl">বকেয়া</div><div class="acc-metric-val">৳' + fa(s.td) + '</div></button>' +
      '</div>';
    var tfoot = '<tr><td><strong>সর্বমোট</strong></td>' +
      '<td style="color:var(--red);font-weight:700">৳' + fa(s.te) + '</td>' +
      '<td>' + pct(100) + '</td><td style="color:var(--red);font-weight:700">৳' + fa(s.td) + '</td></tr>';
    var yearSel = '<select class="acc-sel" style="margin-bottom:8px" onchange="_yearF=this.value;renderAccounts()">' + yearOptions(_yearF) + '</select>';
    return '<div class="acc-dashboard">' +
      yearSel +
      '<div class="acc-money-hero"><div class="acc-money-label">বর্তমান অবস্থা</div><div class="acc-money-main ' + balCls + '">' + (tb < 0 ? '−' : '+') + '৳' + fa(Math.abs(tb)) + '</div></div>' +
      metrics +
      '<div class="acc-ledger-card"><div class="acc-ledger-title"><span>ব্যয়ের বই অনুযায়ী</span>' + (s.td ? '<span style="color:var(--red)">বকেয়া ৳' + fa(s.td) + '</span>' : '<span style="color:var(--green)">বকেয়া নেই</span>') + '</div>' +
      '<div style="overflow-x:auto"><table class="acc-sum-tbl"><thead><tr><th>খাত / হিসাব বই</th><th>ব্যবহার</th><th>শতকরা</th><th>বকেয়া</th></tr></thead>' +
      '<tbody>' + (tblRows || '<tr><td colspan="4" style="text-align:center;color:var(--ink3)">তথ্য নেই</td></tr>') + '</tbody>' +
      '<tfoot>' + tfoot + '</tfoot></table></div></div>' +
      '</div>';
  }

  function detailOptionHtml(options, selected, allLabel) {
    return '<option value="all">' + esc(allLabel) + '</option>' + options.map(function (v) {
      return '<option value="' + esc(v) + '"' + (selected === v ? ' selected' : '') + '>' + esc(v) + '</option>';
    }).join('');
  }

  function renderAccAccountDetails(account) {
    var label = A.ACCOUNT_LABELS[account] || account || 'হিসাব';
    var baseRows = A.Expense.getAll().filter(function (r) {
      return r.account === account;
    });
    var categories = [];
    var suppliers = [];
    baseRows.forEach(function (r) {
      var c = A.clean(r.category, '') || 'অন্যান্য';
      var s = A.clean(r.supplier, '') || 'উল্লেখ নেই';
      if (categories.indexOf(c) < 0) categories.push(c);
      if (suppliers.indexOf(s) < 0) suppliers.push(s);
    });
    categories.sort(function (a, b) { return a.localeCompare(b, 'bn'); });
    suppliers.sort(function (a, b) { return a.localeCompare(b, 'bn'); });
    var rows = baseRows.filter(function (r) {
      var month = A.monthKey(r.month);
      var category = A.clean(r.category, '') || 'অন্যান্য';
      var supplier = A.clean(r.supplier, '') || 'উল্লেখ নেই';
      var desc = A.clean(r.description, '') || category || 'ব্যয়';
      var haystack = [A.dateLabel(r), month, category, desc, supplier, String(r.amount || '')].join(' ').toLowerCase();
      return (_detailMonth === 'all' || month === _detailMonth) &&
        (_detailCategory === 'all' || category === _detailCategory) &&
        (_detailSupplier === 'all' || supplier === _detailSupplier) &&
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
      title.innerHTML =
        '<span class="acc-title-main">' + esc(label) + '</span>' +
        '<span class="acc-title-meta">' + esc(_detailMonth === 'all' ? 'সব মাস' : _detailMonth) + ' · ' + count(rows.length, 'টি') + '</span>' +
        '<span class="acc-title-total">৳' + fa(total) + '</span>';
    }
    if (root) {
      var body = rows.map(function (r) {
        var category  = A.clean(r.category, '');
        var supplier  = A.clean(r.supplier, '');
        var receiptNo = A.clean(r.receiptNo, '');
        var desc = A.clean(r.description, '') || category || 'ব্যয়';
        var qInfo = r.quantity ? bn(A.num(r.quantity)) + (r.unit ? ' ' + esc(r.unit) : '') + (r.unitPrice ? ' × ৳' + fa(r.unitPrice) : '') : 'উল্লেখ নেই';
        return '<tr>' +
          '<td>' + esc(A.dateLabel(r)) + '</td>' +
          '<td>' + esc(A.monthKey(r.month) || '') + '</td>' +
          '<td>' + esc(category || 'অন্যান্য') + '</td>' +
          '<td class="acc-desc-cell">' + esc(desc) + '</td>' +
          '<td>' + qInfo + '</td>' +
          '<td>' + esc(supplier || 'উল্লেখ নেই') + '</td>' +
          '<td style="color:var(--ink3);font-size:11px">' + (receiptNo ? esc(receiptNo) : '—') + '</td>' +
          '<td class="acc-ledger-amt">৳' + fa(r.amount) + '</td>' +
          '<td><div class="acc-row-actions"><button class="acc-icon-btn edit" title="এডিট" onclick="editAccEntry(\'expense\',\'' + esc(r.id) + '\')">✎</button><button class="acc-icon-btn del" title="মুছুন" onclick="delAccEntry(\'expense\',\'' + esc(r.id) + '\')">✕</button></div></td>' +
          '</tr>';
      }).join('');
      var filters =
        '<div class="acc-detail-tools">' +
        '<select class="acc-sel" onchange="setAccDetailFilter(\'month\',this.value)">' + monthOptions(_detailMonth) + '</select>' +
        '<select class="acc-sel" onchange="setAccDetailFilter(\'category\',this.value)">' + detailOptionHtml(categories, _detailCategory, 'সব খাত') + '</select>' +
        '<select class="acc-sel" onchange="setAccDetailFilter(\'supplier\',this.value)">' + detailOptionHtml(suppliers, _detailSupplier, 'সব সরবরাহকারী') + '</select>' +
        '<input class="acc-sel" id="acc-detail-search" value="' + esc(_detailSearch) + '" placeholder="বিবরণ খুঁজুন" oninput="setAccDetailFilter(\'search\',this.value)">' +
        '<select class="acc-sel" onchange="setAccDetailFilter(\'sort\',this.value)">' +
          '<option value="date_asc"' + (_detailSort === 'date_asc' ? ' selected' : '') + '>পুরাতন আগে</option>' +
          '<option value="date_desc"' + (_detailSort === 'date_desc' ? ' selected' : '') + '>নতুন আগে</option>' +
          '<option value="amount_desc"' + (_detailSort === 'amount_desc' ? ' selected' : '') + '>টাকা বেশি</option>' +
          '<option value="amount_asc"' + (_detailSort === 'amount_asc' ? ' selected' : '') + '>টাকা কম</option>' +
        '</select>' +
        '<button type="button" class="acc-detail-clear" onclick="clearAccDetailFilters()">রিসেট</button>' +
        '</div>';
      root.innerHTML =
        filters +
        '<div class="acc-table-wrap"><table class="acc-detail-table"><thead><tr><th>তারিখ</th><th>মাস</th><th>খাত</th><th>বিবরণ</th><th>পরিমাণ</th><th>সরবরাহকারী</th><th>রশিদ নং</th><th>টাকা</th><th></th></tr></thead><tbody>' +
        (body || '<tr><td colspan="9" style="text-align:center;color:var(--ink3)">এই হিসাব বইতে তথ্য নেই</td></tr>') +
        '</tbody></table></div>';
    }
  }

  window.openAccAccountDetails = function (account) {
    _metricModalKind = '';
    _settingsModalOpen = false;
    _detailAccount = account;
    _detailMonth = _sumMonth === 'all' ? 'all' : A.monthKey(_sumMonth);
    _detailCategory = 'all';
    _detailSupplier = 'all';
    _detailSearch = '';
    _detailSort = 'date_asc';
    renderAccAccountDetails(account);
    openModal('account-details');
  };

  window.openAccDueDetails = function (account) {
    _metricModalKind = 'dues';
    _settingsModalOpen = false;
    _dueAccF = account;
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
    return !!(_metricModalKind && modal && modal.classList.contains('show'));
  }

  function isSettingsModalOpen() {
    var modal = document.getElementById('modal-account-details');
    return !!(_settingsModalOpen && modal && modal.classList.contains('show'));
  }

  function renderAccMetricModal() {
    if (!_metricModalKind) return;
    var root = document.getElementById('account-details-root');
    var title = document.getElementById('account-details-title');
    if (!root) return;
    _detailAccount = '';
    if (title) title.textContent = metricTitle(_metricModalKind);
    if (_metricModalKind === 'income') root.innerHTML = buildIncomeList('renderAccMetricModal()');
    else if (_metricModalKind === 'expense') root.innerHTML = buildExpenseList();
    else if (_metricModalKind === 'dues') root.innerHTML = buildDues('renderAccMetricModal()');
  }

  window.renderAccMetricModal = renderAccMetricModal;
  window.openAccMetricModal = function (kind) {
    _metricModalKind = kind;
    _settingsModalOpen = false;
    renderAccMetricModal();
    openModal('account-details');
  };

  window.setAccDetailFilter = function (field, value) {
    if (field === 'month') _detailMonth = value === 'all' ? 'all' : A.monthKey(value);
    else if (field === 'category') _detailCategory = value || 'all';
    else if (field === 'supplier') _detailSupplier = value || 'all';
    else if (field === 'search') _detailSearch = value || '';
    else if (field === 'sort') _detailSort = value || 'date_asc';
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
    _detailMonth = 'all';
    _detailCategory = 'all';
    _detailSupplier = 'all';
    _detailSearch = '';
    _detailSort = 'date_asc';
    renderAccAccountDetails(_detailAccount);
  };

  /* ══════════════ INCOME LIST ══════════════ */
  function buildIncomeList(rerenderCmd) {
    normalizeMonthFilters();
    var monOpts = monthOptions(_monF);
    var rows = A.Income.getAll();
    if (_yearF !== 'all') rows = rows.filter(function (r) { return String(r.hijriYear) === _yearF; });
    if (_monF !== 'all') rows = rows.filter(function (r) { return A.monthKey(r.month) === _monF; });
    rows = rows.slice().sort(function (a, b) { return (b._at || 0) - (a._at || 0); });
    var total = rows.reduce(function (s, r) { return s + A.num(r.amount); }, 0);
    var items = rows.map(function (r) {
      var desc = A.clean(r.note, '') || A.clean(r.source, '') || 'আয়';
      return '<div class="acc-list-item"><div class="acc-list-top">' +
        '<div class="acc-list-desc">' + esc(desc) + '</div>' +
        '<div class="acc-list-amt inc">৳' + fa(r.amount) + '</div>' +
        '<div class="acc-row-actions"><button class="acc-icon-btn edit" title="এডিট" onclick="editAccEntry(\'income\',\'' + esc(r.id) + '\')">✎</button><button class="acc-icon-btn del" title="মুছুন" onclick="delAccEntry(\'income\',\'' + esc(r.id) + '\')">✕</button></div>' +
        '</div><div class="acc-list-meta">' + esc(A.monthKey(r.month) || '') + (r.day ? ' · ' + bn(r.day) : '') + '</div></div>';
    }).join('');
    return '<div class="acc-filter-bar"><select class="acc-sel" onchange="_monF=this.value;' + (rerenderCmd || 'renderAccounts()') + '">' + monOpts + '</select></div>' +
      '<div style="font-size:12px;color:var(--ink3);margin-bottom:8px">মোট: <strong style="color:var(--green)">৳' + fa(total) + '</strong> (' + count(rows.length, 'টি') + ')</div>' +
      (items || '<div class="acc-empty">কোনো আয়ের রেকর্ড নেই</div>');
  }

  /* ══════════════ EXPENSE LIST ══════════════ */
  function buildExpenseList() {
    normalizeMonthFilters();
    var rows = A.Expense.getAll();
    if (_yearF !== 'all') rows = rows.filter(function (r) { return String(r.hijriYear) === _yearF; });
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
      var category  = A.clean(r.category, '');
      var supplier  = A.clean(r.supplier, '');
      var receiptNo = A.clean(r.receiptNo, '');
      var desc = A.clean(r.description, '') || category || 'ব্যয়';
      var qInfo = r.quantity ? bn(A.num(r.quantity)) + (r.unit ? ' ' + esc(r.unit) : '') + (r.unitPrice ? ' × ৳' + fa(r.unitPrice) : '') : 'উল্লেখ নেই';
      return '<tr>' +
        '<td>' + esc(A.dateLabel(r)) + '</td>' +
        '<td>' + esc(A.ACCOUNT_LABELS[r.account] || r.account || '') + '</td>' +
        '<td>' + esc(category || 'অন্যান্য') + '</td>' +
        '<td class="acc-desc-cell">' + esc(desc) + '</td>' +
        '<td>' + qInfo + '</td>' +
        '<td>' + esc(supplier || 'উল্লেখ নেই') + '</td>' +
        '<td style="color:var(--ink3);font-size:11px">' + (receiptNo ? esc(receiptNo) : '—') + '</td>' +
        '<td class="acc-ledger-amt">৳' + fa(r.amount) + '</td>' +
        '<td><div class="acc-row-actions"><button class="acc-icon-btn edit" title="এডিট" onclick="editAccEntry(\'expense\',\'' + esc(r.id) + '\')">✎</button><button class="acc-icon-btn del" title="মুছুন" onclick="delAccEntry(\'expense\',\'' + esc(r.id) + '\')">✕</button></div></td>' +
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
    return '<div class="acc-money-hero" style="margin-bottom:8px"><div class="acc-money-label">ব্যয়</div><div class="acc-money-main" style="color:var(--red)">৳' + fa(total) + '</div><div class="sub" style="position:relative">মোট সংখ্যা: ' + count(rows.length, 'টি') + '</div></div>' +
      '<div class="acc-toolbar">' +
      '<button type="button" class="acc-tool-btn' + (filterOn ? ' is-on' : '') + '" onclick="openAccFilterSheet()">ফিল্টার</button>' +
      '<button type="button" class="acc-tool-btn' + (rangeOn ? ' is-on' : '') + '" onclick="openAccRangeSheet()">তারিখ সীমা</button>' +
      '<button type="button" class="acc-tool-btn acc-sort-btn" onclick="openAccSortSheet()" title="সাজান">⇅</button>' +
      '</div><div class="acc-chipline">' + chips + '</div>' +
      '<div class="acc-expense-wrap"><table class="acc-expense-table"><thead><tr><th>তারিখ</th><th>হিসাব বই</th><th>খাত</th><th>বিবরণ</th><th>পরিমাণ</th><th>সরবরাহকারী</th><th>রশিদ নং</th><th>টাকা</th><th></th></tr></thead><tbody>' +
      (items || '<tr><td colspan="9" style="text-align:center;color:var(--ink3)">কোনো ব্যয়ের রেকর্ড নেই</td></tr>') +
      '</tbody></table></div>';
  }

  /* ══════════════ DUES (compact table) ══════════════ */
  function buildDues(rerenderCmd) {
    var accOpts = '<option value="all">সব হিসাব</option>' + Object.entries(A.ACCOUNT_LABELS).map(function (e) {
      return '<option value="' + e[0] + '"' + (_dueAccF === e[0] ? ' selected' : '') + '>' + esc(e[1]) + '</option>';
    }).join('');
    var dues = A.Dues.getAll().filter(function (d) { return A.num(d.total) > 0; });
    if (_dueAccF !== 'all') dues = dues.filter(function (d) { return d.account === _dueAccF; });
    var filterBar = '<div class="acc-filter-bar"><select class="acc-sel" onchange="_dueAccF=this.value;' + (rerenderCmd || 'renderAccounts()') + '">' + accOpts + '</select></div>';
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
    var catRows = cats.map(function (c) {
      var isDef = A.Categories.isDefault(c);
      return '<div class="acc-cat-row"><span>' + esc(c) + (isDef ? ' <span style="font-size:9px;color:var(--ink3)">(ডিফল্ট)</span>' : '') + '</span>' +
        (isDef ? '' : '<button class="acc-del-btn" onclick="delAccCategory(\'' + esc(c) + '\')">✕</button>') + '</div>';
    }).join('');
    return '<div style="font-family:\'Noto Serif Bengali\',serif;font-weight:700;font-size:14px;margin-bottom:8px">ব্যয়ের খাত ব্যবস্থাপনা</div>' +
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
    if (isSettingsModalOpen()) renderAccSettingsModal();
    else window.renderAccounts();
  };
  window.delAccCategory = function (name) {
    if (!confirm('"' + name + '" খাত মুছবেন?')) return;
    A.Categories.del(name);
    if (isSettingsModalOpen()) renderAccSettingsModal();
    else window.renderAccounts();
  };

  function isAdminSession() {
    return !!(typeof MMSession !== 'undefined' && MMSession && MMSession.isAdmin && MMSession.isAdmin());
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
    if (title) title.textContent = 'হিসাব সেটিংস';
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
    if (title) title.textContent = 'হিসাব রিপোর্ট';
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
    var monthControl = '<select class="acc-top-month" onchange="_sumMonth=this.value;renderAccounts()">' + monthOptions(_sumMonth) + '</select>';
    var actionBtns = '<div style="display:flex;gap:4px;align-items:stretch"><button type="button" class="acc-report-top" style="flex:1" onclick="openAccReportsPanel()">রিপোর্ট</button><button type="button" class="acc-report-top" onclick="openAccSettingsPanel()" title="হিসাব সেটিংস" style="padding:0 8px">⚙</button></div>';
    root.innerHTML =
      '<div class="acc-shell">' +
      '<div class="acc-add-btns has-month"><button class="acc-btn acc-btn-inc" onclick="openAccModal(\'income\')">＋ আয়</button><button class="acc-btn acc-btn-exp" onclick="openAccModal(\'expense\')">＋ ব্যয়</button>' + monthControl + actionBtns + '</div>' +
      '<div class="acc-content" id="acc-body"></div></div>';
    var body = document.getElementById('acc-body');
    if (_tab === 'settings') body.innerHTML = buildSettings();
    else body.innerHTML = buildSummary();
  };

  /* ══════════════ HELPERS ══════════════ */
  window.delAccEntry = async function (type, id) {
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
    if (type === 'expense') {
      var sup = A.clean(entry.supplier, '');
      if (sup) A.Dues.cancelPurchase(sup, entry.account, A.num(entry.amount));
      A.Expense.del(id);
    } else {
      A.Income.del(id);
    }
    refreshAccountsViews();
  };

  window.editAccEntry = async function (type, id) {
    var entry = type === 'income' ? A.Income.getById(id) : A.Expense.getById(id);
    if (!entry) { showToast('এন্ট্রি পাওয়া যায়নি'); return; }
    closeModal('account-details');
    window.openAccModal(type, id);
  };

  window.payDue = function (dueId) {
    var amtStr = prompt('পরিশোধের পরিমাণ (টাকা):');
    var amt = parseFloat(amtStr);
    if (!amt || amt <= 0) return;
    A.Dues.recordPayment(dueId, amt);
    rerenderAccountsView();
    showToast('পরিশোধ নথিভুক্ত ✓');
  };

})();
