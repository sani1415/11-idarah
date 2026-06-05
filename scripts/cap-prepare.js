const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const OUT = path.join(ROOT, 'public');
const VENDOR_OUT = path.join(OUT, 'js', 'vendor');

const VENDOR_FILES = [
  ['node_modules/@capacitor/core/dist/capacitor.js', 'capacitor.js'],
  ['node_modules/@capacitor/app/dist/plugin.js', 'capacitor-app.js'],
  ['node_modules/@capacitor/status-bar/dist/plugin.js', 'capacitor-status-bar.js'],
];

function copyVendorFiles() {
  fs.mkdirSync(VENDOR_OUT, { recursive: true });
  for (const [srcRel, name] of VENDOR_FILES) {
    const src = path.join(ROOT, srcRel);
    if (!fs.existsSync(src)) {
      throw new Error('Missing Capacitor vendor file: ' + srcRel);
    }
    fs.copyFileSync(src, path.join(VENDOR_OUT, name));
  }
}

function ensurePlaceholderPublic() {
  fs.mkdirSync(OUT, { recursive: true });
  const indexPath = path.join(OUT, 'index.html');
  if (fs.existsSync(indexPath)) return;
  const html = [
    '<!DOCTYPE html>',
    '<html lang="bn">',
    '<head>',
    '<meta charset="UTF-8">',
    '<meta name="viewport" content="width=device-width, initial-scale=1.0">',
    '<title>Idarah</title>',
    '<meta http-equiv="refresh" content="0;url=https://www.idarah786.com/">',
    '</head>',
    '<body><p><a href="https://www.idarah786.com/">Idarah খুলুন</a></p></body>',
    '</html>',
    '',
  ].join('\n');
  fs.writeFileSync(indexPath, html, 'utf8');
}

copyVendorFiles();
ensurePlaceholderPublic();
console.log('Capacitor public assets ready →', OUT);
