/**
 * Student photos → Supabase Storage uploader
 * Usage: node scripts/upload-photos.js <SERVICE_ROLE_KEY>
 *
 * Creates bucket "student-photos" (public) if not exists,
 * then uploads all *.jpg from photos/ folder.
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const SUPABASE_URL = 'https://bbdtoucanihtrymzpynq.supabase.co';
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJiZHRvdWNhbmlodHJ5bXpweW5xIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU3NDA0NjEsImV4cCI6MjA5MTMxNjQ2MX0.TPQtymiXFogCPCrT2ZbYFVZ7ziBrm5NNcB_XgPaPGPw';
const BUCKET = 'student-photos';
const PHOTOS_DIR = path.join(__dirname, '..', 'photos');

const supabase = createClient(SUPABASE_URL, ANON_KEY, {
  auth: { persistSession: false },
});

async function ensureBucket() {
  console.log(`ℹ️   Bucket "${BUCKET}" ব্যবহার করা হবে (আগে থেকেই তৈরি)`);
}

async function uploadAll() {
  const files = fs.readdirSync(PHOTOS_DIR).filter(f => f.toLowerCase().endsWith('.jpg'));
  console.log(`📷  মোট ${files.length} টি ছবি upload হবে…\n`);

  let done = 0, skipped = 0, failed = 0;

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const filePath = path.join(PHOTOS_DIR, file);
    const buffer = fs.readFileSync(filePath);

    const { error } = await supabase.storage
      .from(BUCKET)
      .upload(file, buffer, {
        contentType: 'image/jpeg',
        upsert: true,
      });

    if (error) {
      console.error(`  ❌ ${file}: ${error.message}`);
      failed++;
    } else {
      done++;
    }

    if ((i + 1) % 25 === 0 || i + 1 === files.length) {
      process.stdout.write(`  [${i + 1}/${files.length}] সম্পন্ন: ${done}, ব্যর্থ: ${failed}\n`);
    }
  }

  console.log(`\n✅  Upload শেষ — সম্পন্ন: ${done}, ব্যর্থ: ${failed}, বাদ: ${skipped}`);

  const publicUrl = `${SUPABASE_URL}/storage/v1/object/public/${BUCKET}/47101.jpg`;
  console.log(`\n🔗  Public URL নমুনা:\n    ${publicUrl}`);
}

(async () => {
  try {
    await ensureBucket();
    await uploadAll();
  } catch (err) {
    console.error('❌  Error:', err.message);
    process.exit(1);
  }
})();
