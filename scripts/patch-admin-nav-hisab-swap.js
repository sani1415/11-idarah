/**
 * One-off maintainer script: swap bottom-nav বিভাগ ↔ shortcut হিসাব.
 * Run: node scripts/patch-admin-nav-hisab-swap.js
 */
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');

const DEPT_SVG =
  '<path stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><path stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" d="M9 22V12h6v10"/>';
const HISSAB_SVG =
  '<path stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" d="M3 6h18v12H3z"/><path stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" d="M7 10h.01M17 14h.01"/><circle stroke-width="1.75" cx="12" cy="12" r="2.5"/>';

const DEPT_ONELINE_RE = /<a class="main-nav-btn([^"]*)" href="([^"]*main-admin-dept\.html)" aria-label="বিভাগ">[\s\S]*?<span class="main-nav-lbl">বিভাগ<\/span><\/a>/g;

function hissabNavHtml(attrs, href) {
  return (
    `<a class="main-nav-btn${attrs}" href="${href}" aria-label="হিসাব" data-admin-perm="daftar">` +
    `<svg class="main-nav-ico" width="22" height="22" viewBox="0 0 24 24" aria-hidden="true" focusable="false">${HISSAB_SVG}</svg>` +
    `<span class="main-nav-lbl">হিসাব</span></a>`
  );
}

function patchNavLinks(text, accountsHref) {
  return text.replace(DEPT_ONELINE_RE, (_, extraAttrs) => hissabNavHtml(extraAttrs || '', accountsHref));
}

function patchShortcut(text) {
  const oldBlock =
    /<div class="shortcut-card" data-admin-perm="daftar" onclick="location\.href='madrasa\/mdr-admin-accounts\.html'"[\s\S]*?<span class="shortcut-label">হিসাব<\/span>\s*<\/div>/;
  const newBlock = `<div class="shortcut-card" data-admin-hub="dept" onclick="location.href='main-admin-dept.html'" role="button" tabindex="0" onkeydown="if(event.key==='Enter')this.click()">
      <span class="shortcut-ico" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1 2 2H5a2 2 0 0 1-2-2z"/><path d="M9 22V12h6v10"/></svg></span>
      <span class="shortcut-label">বিভাগ</span>
    </div>`;
  return text.replace(oldBlock, newBlock);
}

function walk(dir, out) {
  for (const name of fs.readdirSync(dir)) {
    const p = path.join(dir, name);
    const st = fs.statSync(p);
    if (st.isDirectory()) {
      if (name === 'node_modules' || name === '.git') continue;
      walk(p, out);
      continue;
    }
    if (!name.endsWith('.html')) continue;
    out.push(p);
  }
}

const files = [];
walk(root, files);
let changed = 0;

for (const file of files) {
  let text = fs.readFileSync(file, 'utf8');
  if (!text.includes('main-admin-dept.html') && !text.includes('mdr-admin-accounts.html')) continue;
  const rel = path.relative(root, file).replace(/\\/g, '/');
  const inMadrasa = rel.startsWith('madrasa/');
  const accountsHref = inMadrasa ? 'mdr-admin-accounts.html' : 'madrasa/mdr-admin-accounts.html';
  const before = text;

  if (text.includes('main-admin-dept.html') && text.includes('main-nav-lbl">বিভাগ')) {
    text = patchNavLinks(text, accountsHref);
  }
  if (rel === 'main-admin-madrasa.html') {
    text = patchShortcut(text);
  }
  if (rel === 'madrasa/mdr-admin-accounts.html' && text.includes('main-nav-btn is-active') && text.includes('main-admin-madrasa')) {
    text = text.replace(
      /<a class="main-nav-btn is-active" href="\.\.\/main-admin-madrasa\.html"/,
      '<a class="main-nav-btn" href="../main-admin-madrasa.html"'
    );
    text = text.replace(
      /<a class="main-nav-btn([^"]*)" href="mdr-admin-accounts\.html" aria-label="হিসাব"/,
      '<a class="main-nav-btn is-active" href="mdr-admin-accounts.html" aria-label="হিসাব"'
    );
  }
  if (rel === 'main-admin-dept.html') {
    text = text.replace(/\s*is-active(?=" href="main-admin-madrasa)/, '');
    text = text.replace(
      /<a class="main-nav-btn is-active" href="madrasa\/mdr-admin-accounts\.html"/,
      '<a class="main-nav-btn" href="madrasa/mdr-admin-accounts.html"'
    );
  }

  if (text !== before) {
    fs.writeFileSync(file, text, 'utf8');
    changed++;
    console.log('patched', rel);
  }
}

console.log('done, files changed:', changed);
