const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://bbdtoucanihtrymzpynq.supabase.co';
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJiZHRvdWNhbmlodHJ5bXpweW5xIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU3NDA0NjEsImV4cCI6MjA5MTMxNjQ2MX0.TPQtymiXFogCPCrT2ZbYFVZ7ziBrm5NNcB_XgPaPGPw';
const BUCKET = 'student-photos';

const supabase = createClient(SUPABASE_URL, ANON_KEY, { auth: { persistSession: false } });

const maktabFiles = [
  '046101.jpg','046111.jpg','046114.jpg','046118.jpg','046122.jpg',
  '047202.jpg','047203.jpg','047204.jpg','047205.jpg','047206.jpg',
  '047207.jpg','047208.jpg','047209.jpg','047210.jpg','047211.jpg',
  '047212.jpg','047214.jpg','047215.jpg','047216.jpg','047217.jpg',
  '047218.jpg','047219.jpg','047220.jpg','047221.jpg','047222.jpg',
  '047223.jpg','047224.jpg','047225.jpg',
];

const numberedFiles = Array.from({length: 39}, (_, i) => `${i + 1}.jpg`);

const toDelete = [...maktabFiles, ...numberedFiles];

(async () => {
  const { error } = await supabase.storage.from(BUCKET).remove(toDelete);
  if (error) { console.error('❌', error.message); process.exit(1); }
  console.log(`✅  Supabase Storage থেকে মুছেছি: ${toDelete.length} টি`);
})();
