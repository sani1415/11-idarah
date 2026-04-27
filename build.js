const fs = require('fs');
const path = require('path');

const url = process.env.SUPABASE_URL || '';
const publishableKey = process.env.SUPABASE_PUBLISHABLE_KEY || process.env.SUPABASE_ANON_KEY || '';

const out = `window.MM_SUPABASE_CONFIG = ${JSON.stringify({ url, publishableKey }, null, 2)};\n`;

fs.writeFileSync(path.join(__dirname, 'supabase-config.js'), out, 'utf8');
console.log('Generated supabase-config.js');
