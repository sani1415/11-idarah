/**
 * Maktab student photos → Supabase Storage uploader
 * Uploads 6-digit (leading-zero) filenames from photos/ root
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const SUPABASE_URL = 'https://bbdtoucanihtrymzpynq.supabase.co';
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJiZHRvdWNhbmlodHJ5bXpweW5xIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU3NDA0NjEsImV4cCI6MjA5MTMxNjQ2MX0.TPQtymiXFogCPCrT2ZbYFVZ7ziBrm5NNcB_XgPaPGPw';
const BUCKET = 'student-photos';
const PHOTOS_ROOT = path.join(__dirname, '..', 'photos');

const supabase = createClient(SUPABASE_URL, ANON_KEY, { auth: { persistSession: false } });

(async () => {
  // 6-digit filenames = maktab IDs (e.g. 046101.jpg, 047202.jpg)
  // Also include unusual ones like 0044217.jpg, 146201.jpg
  const all = fs.readdirSync(PHOTOS_ROOT).filter(f => f.toLowerCase().endsWith('.jpg'));
  const maktab = all.filter(f => {
    const base = path.basename(f, '.jpg');
    return base.length === 6 || (base.length === 7 && base.startsWith('00'));
  });

  console.log(`📷  মক্তব ছবি upload হবে: ${maktab.length} টি`);
  console.log(`    (উদাহরণ: ${maktab.slice(0,3).join(', ')})\n`);

  let done = 0, failed = 0;
  for (let i = 0; i < maktab.length; i++) {
    const file = maktab[i];
    const buffer = fs.readFileSync(path.join(PHOTOS_ROOT, file));
    const { error } = await supabase.storage.from(BUCKET).upload(file, buffer, {
      contentType: 'image/jpeg',
      upsert: true,
    });
    if (error) { console.error(`  ❌ ${file}: ${error.message}`); failed++; }
    else done++;

    if ((i + 1) % 25 === 0 || i + 1 === maktab.length) {
      console.log(`  [${i + 1}/${maktab.length}] সম্পন্ন: ${done}, ব্যর্থ: ${failed}`);
    }
  }
  console.log(`\n✅  Upload শেষ — সম্পন্ন: ${done}, ব্যর্থ: ${failed}`);
})();
