const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
const OUT = path.join(ROOT, 'public');
const ROOT_CONFIG = path.join(ROOT, 'supabase-config.js');

function createBuildVersion() {
  const raw =
    process.env.APP_VERSION ||
    process.env.VERCEL_GIT_COMMIT_SHA ||
    process.env.GITHUB_SHA ||
    '';
  if (raw) return raw.replace(/[^a-zA-Z0-9._-]/g, '').slice(0, 40);
  const d = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  return [
    d.getUTCFullYear(),
    pad(d.getUTCMonth() + 1),
    pad(d.getUTCDate()),
    pad(d.getUTCHours()),
    pad(d.getUTCMinutes()),
    pad(d.getUTCSeconds()),
  ].join('');
}

function readExistingConfig() {
  if (!fs.existsSync(ROOT_CONFIG)) return {};
  const text = fs.readFileSync(ROOT_CONFIG, 'utf8');
  const url = text.match(/url:\s*['"]([^'"]*)['"]|["']url["']:\s*["']([^"']*)["']/);
  const publishableKey = text.match(/publishableKey:\s*['"]([^'"]*)['"]|["']publishableKey["']:\s*["']([^"']*)["']/);
  return {
    url: (url && (url[1] || url[2])) || '',
    publishableKey: (publishableKey && (publishableKey[1] || publishableKey[2])) || '',
  };
}

function rmrf(dir) {
  if (fs.existsSync(dir)) fs.rmSync(dir, { recursive: true, force: true });
}

function copyDir(src, dest) {
  if (!fs.existsSync(src)) return;
  fs.cpSync(src, dest, { recursive: true });
}

function isVersionedAsset(url) {
  if (!url || /^(?:https?:)?\/\//i.test(url)) return false;
  if (/^(?:data:|mailto:|tel:|#)/i.test(url)) return false;
  const clean = url.split('#')[0].split('?')[0];
  return /\.(?:css|js)$/i.test(clean);
}

function versionAssetUrl(url, version) {
  if (!isVersionedAsset(url)) return url;
  const hashIndex = url.indexOf('#');
  const hash = hashIndex >= 0 ? url.slice(hashIndex) : '';
  const withoutHash = hashIndex >= 0 ? url.slice(0, hashIndex) : url;
  const queryIndex = withoutHash.indexOf('?');
  const base = queryIndex >= 0 ? withoutHash.slice(0, queryIndex) : withoutHash;
  const query = new URLSearchParams(queryIndex >= 0 ? withoutHash.slice(queryIndex + 1) : '');
  query.set('v', version);
  return base + '?' + query.toString() + hash;
}

function injectAppUpdate(html, relativeRoot, version) {
  if (html.includes('js/app-update.js')) return html;
  const src = `${relativeRoot}js/app-update.js?v=${encodeURIComponent(version)}`;
  const tag = `<script src="${src}" defer></script>`;
  if (/<\/body>/i.test(html)) return html.replace(/<\/body>/i, `${tag}\n</body>`);
  return `${html}\n${tag}\n`;
}

function transformHtml(html, relativeRoot, version) {
  let next = html
    .replace(/(<script\b[^>]*\bsrc=["'])([^"']+)(["'][^>]*>)/gi, function (_, before, url, after) {
      return before + versionAssetUrl(url, version) + after;
    })
    .replace(/(<link\b[^>]*\bhref=["'])([^"']+)(["'][^>]*>)/gi, function (match, before, url, after) {
      if (!/\brel=["'][^"']*stylesheet/i.test(match)) return match;
      return before + versionAssetUrl(url, version) + after;
    });
  return injectAppUpdate(next, relativeRoot, version);
}

function transformHtmlFile(file, relativeRoot, version) {
  const html = fs.readFileSync(file, 'utf8');
  fs.writeFileSync(file, transformHtml(html, relativeRoot, version), 'utf8');
}

const existing = readExistingConfig();
const url = process.env.SUPABASE_URL || existing.url || '';
const publishableKey =
  process.env.SUPABASE_PUBLISHABLE_KEY || process.env.SUPABASE_ANON_KEY || existing.publishableKey || '';
const buildVersion = createBuildVersion();

const configJs = `window.MM_SUPABASE_CONFIG = ${JSON.stringify({ url, publishableKey }, null, 2)};\n`;

rmrf(OUT);
fs.mkdirSync(OUT, { recursive: true });

const dirs = ['css', 'js', 'madrasa', 'dept', 'khedmat'];
for (const d of dirs) {
  copyDir(path.join(ROOT, d), path.join(OUT, d));
}

try {
  for (const name of fs.readdirSync(ROOT)) {
    if (!name.endsWith('.html')) continue;
    const src = path.join(ROOT, name);
    if (!fs.statSync(src).isFile()) continue;
    const dest = path.join(OUT, name);
    fs.copyFileSync(src, dest);
    transformHtmlFile(dest, '', buildVersion);
  }
} catch (e) {
  console.warn('[build] skip root html copy:', e.message);
}

for (const d of dirs) {
  const dir = path.join(OUT, d);
  if (!fs.existsSync(dir)) continue;
  for (const name of fs.readdirSync(dir)) {
    if (!name.endsWith('.html')) continue;
    const file = path.join(dir, name);
    if (fs.statSync(file).isFile()) transformHtmlFile(file, '../', buildVersion);
  }
}

for (const f of ['api-shared.js', 'api-mdr.js', 'supabase-config.example.js']) {
  const src = path.join(ROOT, f);
  if (fs.existsSync(src)) fs.copyFileSync(src, path.join(OUT, f));
}

fs.writeFileSync(path.join(OUT, 'supabase-config.js'), configJs, 'utf8');
fs.writeFileSync(ROOT_CONFIG, configJs, 'utf8');
fs.writeFileSync(
  path.join(OUT, 'app-version.json'),
  JSON.stringify({ version: buildVersion, builtAt: new Date().toISOString() }, null, 2) + '\n',
  'utf8'
);

console.log('Generated supabase-config.js → public/ + repo root');
console.log('Copied static assets →', OUT);
