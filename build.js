const fs = require('fs');
const path = require('path');

const configPath = path.join(__dirname, 'supabase-config.js');

function readExistingConfig() {
  if (!fs.existsSync(configPath)) return {};
  const text = fs.readFileSync(configPath, 'utf8');
  const url = text.match(/url:\s*['"]([^'"]*)['"]|["']url["']:\s*["']([^"']*)["']/);
  const publishableKey = text.match(/publishableKey:\s*['"]([^'"]*)['"]|["']publishableKey["']:\s*["']([^"']*)["']/);
  return {
    url: (url && (url[1] || url[2])) || '',
    publishableKey: (publishableKey && (publishableKey[1] || publishableKey[2])) || '',
  };
}

const existing = readExistingConfig();
const url = process.env.SUPABASE_URL || existing.url || '';
const publishableKey = process.env.SUPABASE_PUBLISHABLE_KEY || process.env.SUPABASE_ANON_KEY || existing.publishableKey || '';

const out = `window.MM_SUPABASE_CONFIG = ${JSON.stringify({ url, publishableKey }, null, 2)};\n`;

fs.writeFileSync(configPath, out, 'utf8');
console.log('Generated supabase-config.js');
