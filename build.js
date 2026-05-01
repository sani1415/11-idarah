const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
const OUT = path.join(ROOT, 'public');
const ROOT_CONFIG = path.join(ROOT, 'supabase-config.js');

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

const existing = readExistingConfig();
const url = process.env.SUPABASE_URL || existing.url || '';
const publishableKey =
  process.env.SUPABASE_PUBLISHABLE_KEY || process.env.SUPABASE_ANON_KEY || existing.publishableKey || '';

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
    fs.copyFileSync(src, path.join(OUT, name));
  }
} catch (e) {
  console.warn('[build] skip root html copy:', e.message);
}

for (const f of ['api-shared.js', 'api-mdr.js', 'supabase-config.example.js']) {
  const src = path.join(ROOT, f);
  if (fs.existsSync(src)) fs.copyFileSync(src, path.join(OUT, f));
}

fs.writeFileSync(path.join(OUT, 'supabase-config.js'), configJs, 'utf8');
fs.writeFileSync(ROOT_CONFIG, configJs, 'utf8');

console.log('Generated supabase-config.js → public/ + repo root');
console.log('Copied static assets →', OUT);
