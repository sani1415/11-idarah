'use strict';
/* global MdrAccAPI */

/* ── global state (settable from inline onclick/onchange) ── */
var _rptTab    = 'item';
var _rptItem   = '';
var _rptSearch = '';

(function () {
  var A   = MdrAccAPI;
  var esc = function (s) { return A.esc(s); };
  var fa  = function (n) { return A.fa(n); };
  var num = function (n) { return A.num(n); };

  /* ── inject CSS once ── */
  if (!document.getElementById('rpt-style')) {
    var cs = document.createElement('style');
    cs.id = 'rpt-style';
    cs.textContent = `
.rpt-tabs{display:flex;gap:6px;flex-wrap:wrap;margin-bottom:12px}
.rpt-tab{padding:6px 12px;border-radius:20px;border:1px solid var(--cream2);background:#fff;cursor:pointer;font-size:11px;color:var(--ink2);font-family:inherit}
.rpt-tab.active{background:var(--gold);color:#fff;border-color:var(--gold);font-weight:700}
.rpt-sel{font-size:12px;border:1px solid var(--cream2);border-radius:8px;padding:6px 10px;background:#fff;color:var(--ink1);font-family:inherit;width:100%;box-sizing:border-box;margin-bottom:10px}
.rpt-stat-row{display:flex;gap:6px;flex-wrap:wrap;margin:8px 0 12px}
.rpt-stat{flex:1;min-width:70px;background:#fff;border-radius:8px;padding:8px;text-align:center;box-shadow:0 1px 3px rgba(0,0,0,.07)}
.rpt-stat-lbl{font-size:9px;color:var(--ink3);margin-bottom:2px}
.rpt-stat-val{font-size:13px;font-weight:700;font-family:'Noto Serif Bengali',serif}
.rpt-up{color:var(--red)}.rpt-dn{color:var(--green)}.rpt-eq{color:var(--ink3)}
.rpt-bar-row{display:flex;align-items:center;gap:6px;margin-bottom:6px}
.rpt-bar-lbl{font-size:11px;color:var(--ink2);width:80px;flex-shrink:0;text-align:right;line-height:1.2}
.rpt-bar-wrap{flex:1;background:var(--cream2);border-radius:3px;height:16px;overflow:hidden}
.rpt-bar-fill{height:100%;border-radius:3px}
.rpt-bar-val{font-size:11px;color:var(--ink1);font-weight:600;min-width:80px}
.rpt-tbl{width:100%;border-collapse:collapse;font-size:11px}
.rpt-tbl th{background:var(--cream2);padding:5px 6px;text-align:right;font-weight:700;font-size:10px}
.rpt-tbl td{padding:5px 6px;border-bottom:1px solid var(--cream2);text-align:right}
.rpt-tbl tr:last-child td{border:none}
.rpt-sec{font-family:'Noto Serif Bengali',serif;font-weight:700;font-size:14px;margin:12px 0 8px;color:var(--ink1)}
.rpt-card{background:#fff;border-radius:10px;padding:12px 14px;box-shadow:0 1px 4px rgba(0,0,0,.08);margin-bottom:8px}
.rpt-card-title{font-weight:700;font-size:13px;margin-bottom:6px}
.rpt-card-row{display:flex;justify-content:space-between;font-size:11px;color:var(--ink2);padding:2px 0}
.rpt-empty{text-align:center;padding:24px;color:var(--ink3);font-size:12px}
.rpt-chip{display:inline-block;padding:2px 5px;border-radius:3px;font-size:9px;font-weight:700;margin-left:3px}
.rpt-chip-hi{background:#fee2e2;color:#991b1b}.rpt-chip-lo{background:#d1fae5;color:#065f46}`;
    document.head.appendChild(cs);
  }

  /* ════════════════════════════════════════
     পণ্য বিশ্লেষণ
  ════════════════════════════════════════ */
  function buildItemReport() {
    var allItems = A.Expense.itemNames();
    if (!allItems.length) return '<div class="rpt-empty">পরিমাণসহ কোনো ব্যয় রেকর্ড নেই</div>';
    var items = _rptSearch ? allItems.filter(function(i){ return i.toLowerCase().indexOf(_rptSearch.toLowerCase()) >= 0 || i.indexOf(_rptSearch) >= 0; }) : allItems;
    if (!_rptItem || items.indexOf(_rptItem) < 0) _rptItem = items[0] || '';
    var itemOpts = items.map(function (i) {
      return '<option value="' + esc(i) + '"' + (i === _rptItem ? ' selected' : '') + '>' + esc(i) + '</option>';
    }).join('');
    var selHTML = '<input class="rpt-sel" id="rpt-item-search" placeholder="পণ্য খুঁজুন..." value="' + esc(_rptSearch) + '" oninput="updateRptSearch(this.value)" style="margin-bottom:6px">' +
      (items.length ? '<select class="rpt-sel" onchange="_rptItem=this.value;renderAccountsReports(document.getElementById(\'acc-body\'))">' + itemOpts + '</select>' : '<div class="rpt-empty">কোনো পণ্য পাওয়া যায়নি</div>');
    if (!_rptItem) return selHTML;

    var records = A.Expense.getByItem(_rptItem).filter(function (r) { return num(r.quantity) > 0; });
    records.sort(function (a, b) {
      var mo = A.MONTHS;
      var ai = mo.indexOf(A.monthKey(a.month)); var bi = mo.indexOf(A.monthKey(b.month));
      if (ai !== bi) return ai - bi;
      return num(a.day) - num(b.day);
    });
    if (!records.length) return selHTML + '<div class="rpt-empty">পরিমাণসহ কোনো রেকর্ড নেই</div>';

    var prices = records.map(function (r) { return num(r.unitPrice); }).filter(function (p) { return p > 0; });
    var totalQty = records.reduce(function (s, r) { return s + num(r.quantity); }, 0);
    var totalAmt = records.reduce(function (s, r) { return s + num(r.amount); }, 0);
    var avgPrice = prices.length ? Math.round(prices.reduce(function (s, p) { return s + p; }, 0) / prices.length) : 0;
    var minP = prices.length ? Math.min.apply(null, prices) : 0;
    var maxP = prices.length ? Math.max.apply(null, prices) : 0;
    var firstP = prices[0] || 0; var lastP = prices[prices.length - 1] || 0;
    var trendIcon = lastP > firstP ? '↑ বাড়ছে' : lastP < firstP ? '↓ কমছে' : '→ স্থির';
    var trendCls  = lastP > firstP ? 'rpt-up' : lastP < firstP ? 'rpt-dn' : 'rpt-eq';

    var statsH = '<div class="rpt-stat-row">' +
      '<div class="rpt-stat"><div class="rpt-stat-lbl">মোট পরিমাণ</div><div class="rpt-stat-val">' + fa(totalQty) + '</div></div>' +
      '<div class="rpt-stat"><div class="rpt-stat-lbl">মোট খরচ</div><div class="rpt-stat-val">৳' + fa(totalAmt) + '</div></div>' +
      '<div class="rpt-stat"><div class="rpt-stat-lbl">গড় মূল্য</div><div class="rpt-stat-val">৳' + fa(avgPrice) + '</div></div>' +
      '<div class="rpt-stat"><div class="rpt-stat-lbl">সর্বনিম্ন</div><div class="rpt-stat-val rpt-dn">৳' + fa(minP) + '</div></div>' +
      '<div class="rpt-stat"><div class="rpt-stat-lbl">সর্বোচ্চ</div><div class="rpt-stat-val rpt-up">৳' + fa(maxP) + '</div></div>' +
      '<div class="rpt-stat"><div class="rpt-stat-lbl">প্রবণতা</div><div class="rpt-stat-val ' + trendCls + '">' + trendIcon + '</div></div>' +
      '</div>';

    var byMonth = {};
    records.forEach(function (r) {
      var m = A.monthKey(r.month);
      if (!byMonth[m]) byMonth[m] = { qty: 0, amt: 0 };
      byMonth[m].qty += num(r.quantity);
      byMonth[m].amt += num(r.amount);
    });
    var maxQty = Math.max.apply(null, Object.keys(byMonth).map(function (m) { return byMonth[m].qty; }).concat([1]));
    var monthBars = Object.keys(byMonth).map(function (m) {
      var v = byMonth[m];
      return '<div class="rpt-bar-row"><div class="rpt-bar-lbl">' + esc(m) + '</div>' +
        '<div class="rpt-bar-wrap"><div class="rpt-bar-fill" style="width:' + Math.round(v.qty / maxQty * 100) + '%;background:var(--gold)"></div></div>' +
        '<div class="rpt-bar-val">' + fa(v.qty) + ' / ৳' + fa(v.amt) + '</div></div>';
    }).join('');

    var tblRows = records.map(function (r) {
      var isHigh = num(r.unitPrice) === maxP && prices.length > 1;
      var isLow  = num(r.unitPrice) === minP && prices.length > 1;
      var chip = isHigh ? '<span class="rpt-chip rpt-chip-hi">সর্বোচ্চ</span>' : isLow ? '<span class="rpt-chip rpt-chip-lo">সর্বনিম্ন</span>' : '';
      return '<tr><td>' + esc(A.monthKey(r.month) || '') + (r.day ? ' ' + r.day : '') + '</td>' +
        '<td>' + fa(num(r.quantity)) + '</td>' +
        '<td>' + (num(r.unitPrice) ? '৳' + fa(r.unitPrice) + chip : '—') + '</td>' +
        '<td><strong>৳' + fa(r.amount) + '</strong></td>' +
        '<td>' + esc(A.clean(r.supplier, '—') || '—') + '</td></tr>';
    }).join('');

    return selHTML + statsH +
      '<div class="rpt-sec">মাসিক পরিমাণ</div>' + monthBars +
      '<div class="rpt-sec">ক্রয়ের বিস্তারিত</div>' +
      '<div style="overflow-x:auto"><table class="rpt-tbl"><thead><tr><th>মাস</th><th>পরিমাণ</th><th>একক মূল্য</th><th>মোট</th><th>সরবরাহকারী</th></tr></thead><tbody>' + tblRows + '</tbody></table></div>';
  }

  /* ════════════════════════════════════════
     মাসিক সারসংক্ষেপ
  ════════════════════════════════════════ */
  function buildMonthlyReport() {
    var allMonths = [];
    A.Income.months().concat(A.Expense.months()).forEach(function (m) { if (allMonths.indexOf(m) < 0) allMonths.push(m); });
    var mo = A.MONTHS;
    allMonths.sort(function (a, b) { return mo.indexOf(a) - mo.indexOf(b); });
    if (!allMonths.length) return '<div class="rpt-empty">তথ্য নেই</div>';
    var AL = A.ACCOUNT_LABELS;
    var data = allMonths.map(function (m) {
      return {
        m: m,
        inc: A.Income.getByMonth(m).reduce(function (s, x) { return s + num(x.amount); }, 0),
        exp: A.Expense.getByMonth(m).reduce(function (s, x) { return s + num(x.amount); }, 0),
      };
    });
    var maxVal = Math.max.apply(null, data.map(function (d) { return Math.max(d.inc, d.exp); }).concat([1]));
    return data.map(function (d) {
      var bal = d.inc - d.exp;
      var breakdown = ['matbakh', 'madrasa', 'tamirat', 'general'].map(function (acc) {
        var v = A.Expense.getByAccount(acc).filter(function (r) { return A.monthKey(r.month) === d.m; }).reduce(function (s, x) { return s + num(x.amount); }, 0);
        return v ? '<div class="rpt-card-row"><span>' + esc(AL[acc]) + '</span><span>৳' + fa(v) + '</span></div>' : '';
      }).join('');
      return '<div class="rpt-card"><div class="rpt-card-title">' + esc(d.m) + '</div>' +
        '<div class="rpt-card-row"><span>আয়</span><span style="color:var(--green)">৳' + fa(d.inc) + '</span></div>' +
        '<div class="rpt-bar-wrap" style="margin:3px 0 6px"><div class="rpt-bar-fill" style="width:' + Math.round(d.inc / maxVal * 100) + '%;background:var(--green)"></div></div>' +
        '<div class="rpt-card-row"><span>ব্যয়</span><span style="color:var(--red)">৳' + fa(d.exp) + '</span></div>' +
        '<div class="rpt-bar-wrap" style="margin:3px 0 6px"><div class="rpt-bar-fill" style="width:' + Math.round(d.exp / maxVal * 100) + '%;background:var(--red)"></div></div>' +
        breakdown +
        '<div class="rpt-card-row" style="margin-top:4px;font-weight:700"><span>উদ্বৃত্ত</span><span style="color:' + (bal >= 0 ? 'var(--green)' : 'var(--red)') + '">' + (bal < 0 ? '−' : '') + '৳' + fa(Math.abs(bal)) + '</span></div>' +
        '</div>';
    }).join('');
  }

  /* ════════════════════════════════════════
     খাতভিত্তিক
  ════════════════════════════════════════ */
  function buildCategoryReport() {
    var byCat = {};
    A.Expense.getAll().forEach(function (r) {
      var k = A.clean(r.category, '') || '(খাত নেই)';
      if (!byCat[k]) byCat[k] = { amt: 0, cnt: 0 };
      byCat[k].amt += num(r.amount); byCat[k].cnt++;
    });
    var sorted = Object.keys(byCat).map(function (k) { return [k, byCat[k]]; }).sort(function (a, b) { return b[1].amt - a[1].amt; });
    if (!sorted.length) return '<div class="rpt-empty">কোনো তথ্য নেই</div>';
    var total = sorted.reduce(function (s, e) { return s + e[1].amt; }, 0);
    var maxAmt = sorted[0][1].amt || 1;
    return '<div style="font-size:11px;color:var(--ink3);margin-bottom:10px">মোট ব্যয়: <strong>৳' + fa(total) + '</strong></div>' +
      sorted.map(function (e) {
        return '<div class="rpt-bar-row"><div class="rpt-bar-lbl">' + esc(e[0]) + '</div>' +
          '<div class="rpt-bar-wrap"><div class="rpt-bar-fill" style="width:' + Math.round(e[1].amt / maxAmt * 100) + '%;background:#3b82f6"></div></div>' +
          '<div class="rpt-bar-val">৳' + fa(e[1].amt) + ' <span style="font-size:9px;color:var(--ink3)">(' + Math.round(e[1].amt / total * 100) + '%)</span></div></div>';
      }).join('');
  }

  /* ════════════════════════════════════════
     সরবরাহকারী
  ════════════════════════════════════════ */
  function buildSupplierReport() {
    var bySup = {};
    A.Expense.getAll().filter(function (r) { return r.supplier; }).forEach(function (r) {
      var k = A.clean(r.supplier, '') || 'সরবরাহকারী';
      if (!bySup[k]) bySup[k] = { items: {}, totalAmt: 0, cnt: 0 };
      bySup[k].totalAmt += num(r.amount); bySup[k].cnt++;
      var iName = A.clean(r.description, '') || A.clean(r.category, '') || '—';
      bySup[k].items[iName] = (bySup[k].items[iName] || 0) + num(r.amount);
    });
    var dues = A.Dues.getAll();
    var sorted = Object.keys(bySup).map(function (k) { return [k, bySup[k]]; }).sort(function (a, b) { return b[1].totalAmt - a[1].totalAmt; });
    if (!sorted.length) return '<div class="rpt-empty">সরবরাহকারীর তথ্য নেই</div>';
    return sorted.map(function (entry) {
      var sup = entry[0]; var v = entry[1];
      var due = dues.filter(function (d) { return (A.clean(d.supplier, '') || 'সরবরাহকারী') === sup; })[0];
      var topItems = Object.keys(v.items).map(function (nm) { return [nm, v.items[nm]]; })
        .sort(function (a, b) { return b[1] - a[1]; }).slice(0, 4)
        .map(function (e) { return '<div class="rpt-card-row"><span>' + esc(e[0]) + '</span><span>৳' + fa(e[1]) + '</span></div>'; }).join('');
      var dueRow = due ? '<div style="border-top:1px solid var(--cream2);margin-top:6px;padding-top:6px">' +
        '<div class="rpt-card-row"><span>পরিশোধিত</span><span>৳' + fa(due.paid) + '</span></div>' +
        '<div class="rpt-card-row"><span>বকেয়া</span><span style="color:' + (num(due.due) > 0 ? 'var(--red)' : 'var(--green)') + '">' + (num(due.due) > 0 ? '' : '✓ ') + '৳' + fa(Math.abs(num(due.due))) + '</span></div></div>' : '';
      return '<div class="rpt-card"><div class="rpt-card-title">' + esc(sup) + '</div>' +
        '<div class="rpt-card-row"><span>মোট কেনা</span><span style="font-weight:700">৳' + fa(v.totalAmt) + '</span></div>' +
        '<div class="rpt-card-row" style="color:var(--ink3)"><span>এন্ট্রি</span><span>' + v.cnt + ' টি</span></div>' +
        topItems + dueRow + '</div>';
    }).join('');
  }

  /* ── public entry point ── */
  window.renderAccountsReports = function (container) {
    var TABS = [
      { id: 'item', lbl: 'পণ্য বিশ্লেষণ' }, { id: 'monthly', lbl: 'মাসিক' },
      { id: 'category', lbl: 'খাত' }, { id: 'supplier', lbl: 'সরবরাহকারী' },
    ];
    var tabsH = TABS.map(function (t) {
      return '<button class="rpt-tab' + (_rptTab === t.id ? ' active' : '') + '" onclick="_rptTab=\'' + t.id + '\';renderAccountsReports(document.getElementById(\'acc-body\'))">' + t.lbl + '</button>';
    }).join('');
    var content = '';
    if (_rptTab === 'item')      content = buildItemReport();
    else if (_rptTab === 'monthly')   content = buildMonthlyReport();
    else if (_rptTab === 'category')  content = buildCategoryReport();
    else if (_rptTab === 'supplier')  content = buildSupplierReport();
    container.innerHTML = '<div class="rpt-tabs">' + tabsH + '</div>' + content;
  };

  window.updateRptSearch = function (value) {
    _rptSearch = value; _rptItem = '';
    window.renderAccountsReports(document.getElementById('acc-body'));
    setTimeout(function () {
      var el = document.getElementById('rpt-item-search');
      if (el) { el.focus(); el.setSelectionRange(el.value.length, el.value.length); }
    }, 0);
  };

})();
