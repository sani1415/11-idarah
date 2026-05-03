/**
 * প্রিন্ট সহায়ক — নতুন উইন্ডোতে HTML লিখে window.print()।
 */
(function (global) {
  'use strict';

  function esc(s) {
    return String(s || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  /**
   * @param {{ title?: string, bodyHtml: string }} opts
   */
  function printHTML(opts) {
    var title = opts.title || 'মাদরাসাতুল মদীনা';
    var body = opts.bodyHtml || '';
    var w = global.open('', '_blank');
    if (!w) {
      if (global.alert) global.alert('পপআপ ব্লক করা থাকলে প্রিন্ট খুলবে না।');
      return;
    }
    var doc = [
      '<!DOCTYPE html><html lang="bn"><head><meta charset="UTF-8">',
      '<meta name="viewport" content="width=device-width, initial-scale=1.0">',
      '<title>', esc(title), '</title>',
      '<style>',
      'body{font-family:"Tiro Bangla",serif;padding:18px;color:#1a1208;font-size:12px;line-height:1.45;}',
      'h1{font-size:16px;margin:0 0 12px;font-weight:700;}',
      'table{width:100%;border-collapse:collapse;margin-top:8px;}',
      'th,td{border:1px solid #ccc;padding:6px 8px;text-align:left;}',
      'th{background:#f2ead8;font-weight:600;}',
      '@media print{body{padding:0;}}',
      '</style></head><body>',
      body,
      '</body></html>'
    ].join('');
    w.document.open();
    w.document.write(doc);
    w.document.close();
    w.onload = function () {
      try {
        w.focus();
        w.print();
      } catch (e) { /* ignore */ }
    };
  }

  global.MMPrint = {
    esc: esc,
    printHTML: printHTML
  };
})(typeof window !== 'undefined' ? window : globalThis);
