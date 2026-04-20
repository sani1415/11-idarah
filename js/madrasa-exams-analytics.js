/**
 * পরীক্ষা বিশ্লেষণ (প্রোটোটাইপ) — বিষয়ভিত্তিক গড়, উত্তীর্ণ/অনুত্তীর্ণ।
 */
(function (global) {
  'use strict';

  function getApi() {
    return typeof API !== 'undefined' ? API : null;
  }

  function buildStats(examId) {
    var A = getApi();
    if (!A || !A.Exams) return null;
    var exam = A.Exams.getAll().find(function (e) { return e.id === examId; });
    var results = A.Exams.getResults(examId);
    if (!exam || !results.length) return null;

    var subjects = exam.subjects || [];
    var subjStats = subjects.map(function (sub, idx) {
      var sum = 0;
      var n = 0;
      for (var r = 0; r < results.length; r++) {
        var row = results[r];
        var subj = row.subjects && row.subjects[idx];
        if (subj && typeof subj.marks === 'number') {
          sum += subj.marks;
          n++;
        }
      }
      if (n === 0) return { name: sub.name, max: sub.max, avg: 0, pctOfMax: 0, n: 0 };
      var avg = Math.round((sum / n) * 10) / 10;
      var pct = sub.max ? Math.round((avg / sub.max) * 1000) / 10 : 0;
      return { name: sub.name, max: sub.max, avg: avg, pctOfMax: pct, n: n };
    });

    var pass = 0;
    for (var i = 0; i < results.length; i++) {
      if ((results[i].percentage || 0) >= 60) pass++;
    }

    return {
      exam: exam,
      examName: exam.name,
      resultCount: results.length,
      passCount: pass,
      failCount: results.length - pass,
      subjStats: subjStats
    };
  }

  /**
   * @param {string} examId
   * @param {{ esc: function, toBn: function }} ctx
   */
  function renderPanelHTML(examId, ctx) {
    var esc = ctx.esc;
    var toBn = ctx.toBn;
    var st = buildStats(examId);
    if (!st) {
      return '<div class="empty-state"><span class="empty-icon">📊</span><div class="empty-text">বিশ্লেষণের জন্য কমপক্ষে একটি ফলাফল লাগবে</div></div>';
    }

    var parts = [];
    parts.push('<div class="card-static" style="margin-bottom:12px;">');
    parts.push('<div style="font-size:13px;font-weight:700;margin-bottom:10px;color:var(--ink2);">সারসংক্ষেপ</div>');
    parts.push('<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;text-align:center;">');
    parts.push('<div style="background:var(--green-light);border-radius:8px;padding:10px;"><div style="font-size:16px;font-weight:700;color:var(--green);">' + toBn(st.passCount) + '</div><div style="font-size:10px;color:var(--ink3);">উত্তীর্ণ (≥৬০%)</div></div>');
    parts.push('<div style="background:var(--red-light);border-radius:8px;padding:10px;"><div style="font-size:16px;font-weight:700;color:var(--red);">' + toBn(st.failCount) + '</div><div style="font-size:10px;color:var(--ink3);">অনুত্তীর্ণ</div></div>');
    parts.push('<div style="background:var(--cream2);border-radius:8px;padding:10px;"><div style="font-size:16px;font-weight:700;">' + toBn(st.resultCount) + '</div><div style="font-size:10px;color:var(--ink3);">মোট জমা</div></div>');
    parts.push('</div></div>');

    parts.push('<div class="card-static">');
    parts.push('<div style="font-size:13px;font-weight:700;margin-bottom:10px;color:var(--ink2);">বিষয়ভিত্তিক গড় নম্বর</div>');
    for (var j = 0; j < st.subjStats.length; j++) {
      var s = st.subjStats[j];
      var bar = Math.min(100, s.pctOfMax || 0);
      parts.push('<div style="margin-bottom:12px;">');
      parts.push('<div style="display:flex;justify-content:space-between;font-size:12px;margin-bottom:4px;"><span>' + esc(s.name) + '</span><span style="font-weight:600;">' + toBn(s.avg) + ' / ' + toBn(s.max) + '</span></div>');
      parts.push('<div style="height:8px;border-radius:4px;background:var(--cream3);overflow:hidden;"><div style="height:100%;width:' + bar + '%;background:var(--blue);border-radius:4px;"></div></div>');
      parts.push('<div style="font-size:10px;color:var(--ink3);margin-top:2px;">গড়ের অনুপাত: ' + toBn(s.pctOfMax) + '%</div>');
      parts.push('</div>');
    }
    parts.push('</div>');

    return parts.join('');
  }

  global.ExamAnalytics = {
    buildStats: buildStats,
    renderPanelHTML: renderPanelHTML
  };
})(typeof window !== 'undefined' ? window : globalThis);
