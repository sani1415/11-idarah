# মাদরাসাতুল মদীনা — ম্যানেজমেন্ট সিস্টেম CLAUDE.md

## প্রজেক্ট পরিচয়

এটি একটি সম্পূর্ণ প্রতিষ্ঠান ব্যবস্থাপনা সিস্টেম। জিম্মাদার (admin) একটি মাস্টার ড্যাশবোর্ড থেকে সব মডিউল দেখবেন ও নিয়ন্ত্রণ করবেন। প্রতিটি মডিউলের দায়িত্বশীলরা আলাদা আলাদা ডিভাইস থেকে লগইন করে তাদের কাজ করবেন।

### বিদ্যমান প্রজেক্ট (হাত দেওয়া যাবে না)
ওয়াকফ সহবত অ্যাপ (`waqful-madinah` repo) আলাদা প্রজেক্টে production-এ চলছে।
সেই প্রজেক্টের কোনো ফাইল বা Supabase টেবিলে (`students`, `messages`, `tasks`, `task_assignments`, `goals`, `quizzes`, `quiz_questions`, `quiz_assignees`, `quiz_submissions`, `documents`, `academic_history`, `teacher_notes`, `pwa_subscriptions`, `madrasa_config`, `app_kv`) **কখনো হাত দেওয়া যাবে না।**

### এই প্রজেক্ট
একই Supabase project-এ নতুন টেবিল (`shared_*`, `dept_*`, `mdr_*`, `kh_*` prefix) তৈরি হবে। নতুন Vercel deployment হবে আলাদা।

### বর্তমান প্রোটোটাইপ রিপো (`test-markaz`)
- **ভ্যানিলা HTML + JS**, ডেটা এখন **`localStorage`**-ভিত্তিক (`js/api.js`, `js/dept-api.js`, ইত্যাদি)। Supabase মাইগ্রেশন নিচের স্কিমা অনুযায়ী **ভবিষ্যৎ** ধাপ।
- **ফাইল বিন্যাস (হাইব্রিড):** যৌথ `css/`, `js/`; মডিউলভিত্তিক HTML — `madrasa/`, `dept/`, `khedmat/`; মূল এন্ট্রি রুটে — `index.html`, `main-admin-madrasa.html`, `main-admin-dept.html`, `main-admin-khedmat.html`, `main-admin-recent.html`, `chat.html`, `staff-portal.html`। CSS: `css/style.css` (রুট) বা `../css/style.css` (সাবফোল্ডার); JS: `js/...` বা `../js/...`।
- **`backup/`** — পুনর্বিন্যাসের আগের সম্পূর্ণ কপি রাখা যেতে পারে; সমস্যা হলে রুট পুনরুদ্ধারের রেফারেন্স।

### সাম্প্রতিক আপডেট (2026-04-22)

- `madrasa/madrasa-admin.html`-এ teacher/class flow-এর layout refine করা হয়েছে: বড় স্ক্রিনে content width বৃদ্ধি, teacher bottom-nav space-fill, ছোট স্ক্রিনে scroll fallback।
- শিক্ষক-সংক্রান্ত label/data consistency ঠিক করা হয়েছে: “শিক্ষক/স্টাফ” থেকে “শ্রেণি শিক্ষক” (যেখানে ডেটা আসলে `API.Teachers.getByDept(...)` ক্লাস-শিক্ষক নির্ভর)।
- `js/api.js`-এ `Teachers.getByDept(dept)` এখন class-name তারপর teacher-name অনুযায়ী sorted return করে (বাংলা locale)।
- `madrasa/madrasa-settings.html`-এ duplicate class-teacher assignment ব্লক করা হয়েছে (একই বর্ষে একাধিক শিক্ষক যোগ প্রতিরোধ)।
- `madrasa/madrasa-admin.html`-এ inline style cleanup করা হয়েছে: reusable CSS class-এ refactor; file থেকে inline `style="..."` অপসারণ সম্পন্ন।
- Dynamic progress width (`prog-fill`, `khuluk-fill`) এখন `data-pct` + `applyPercentWidths()` দিয়ে সেট হয়; inline width style আর ব্যবহার হচ্ছে না।
- Tab/Nav interaction consistency উন্নত: div→button conversion (যেখানে প্রযোজ্য), এবং tab-এ `aria-selected` sync রাখা হয়েছে।

---

## UI Reference ফাইল (হুবহু copy করবে না)

- `main-admin-madrasa.html`, `main-admin-dept.html`, `main-admin-khedmat.html` (রুট) → Main admin UI ধারণা
- `staff-portal.html` (রুট) → Staff Portal-এর UI ধারণা

এগুলো শুধু visual reference। Real backend data দিয়ে নতুন করে বানাতে হবে।

---

## Architecture Rules

- সব ডেটা লজিক আলাদা JS-এ — প্রোটোটাইপে `js/api.js`, `js/dept-api.js`, `js/khedmat-api.js`, `js/chat-api.js`; HTML শুধু `API` / `DeptAPI` ইত্যাদি call করবে। ভবিষ্যতে ফাইল নাম `api-*.js` বা মডিউল ভাগ একই নীতি।
- **`js/mm-session.js` (`MMSession`)** — `sessionStorage`-এর কী নাম ও লগইন স্টেট এক জায়গায়; HTML সরাসরি `sessionStorage` ব্যবহার করবে না (ব্যতিক্রম নেই)।
- **`API.persistLoadArr` / `API.persistSaveArr`** — হিফজ/লাইব্রেরি/পুরনো ছাত্রের মতো অস্থায়ী অতিরিক্ত লোকাল ডেটা; পরে ডোমেইন API-তে টেনে নেওয়া সহজ। **`localStorage` সরাসরি HTML-এ নয়।**
- **Shared CSS:** `css/style.css` (রুট HTML: `href="css/style.css"`; সাবফোল্ডার: `href="../css/style.css"`)
- বিদ্যমান ওয়াকফ অ্যাপের pattern অনুসরণ করো: RLS + RPC-gated access
- Direct REST call নেই — সব কিছু RPC দিয়ে (প্রোটোটাইপে এখনও Supabase নেই; `localStorage` শুধু ডেভ/ডেমো)
- Vanilla JS only (no React/Vue)
- সব user-facing text বাংলায়
- Supabase client সবসময় `supabaseClient` নামে
- `esc()` function দিয়ে user data render করতে হবে
- `supabase-config.js` gitignored — কখনো real keys commit করবে না

## Madrasa Department Scope Decision

- মাদ্রাসা মডিউল **একটাই থাকবে**; কিতাব বিভাগ ও মক্তব বিভাগ আলাদা app/module নয়, বরং একই Madrasa module-এর দুইটি department scope।
- ডেটা ও operational কাজ department-aware হবে: ছাত্র, বর্ষ/শ্রেণি, শিক্ষক, হাজিরা, দরস, পরীক্ষা, বিদায় ছাত্র, রিপোর্ট—সব জায়গায় `dept`/division context মানতে হবে।
- Main admin unified overview দেখবেন, কিন্তু `সর্বমোট / কিতাব / মক্তব` filter করে আলাদা রিপোর্টও দেখতে পারবেন।
- দফতর/হাজিরা কাজের সময় selected department বাধ্যতামূলক থাকবে; কিতাব হাজিরা ও মক্তব হাজিরা data scope আলাদা থাকবে।
- Future feature/menu system config-driven ও department-aware হবে। কোনো feature শুধু কিতাব বা শুধু মক্তবের জন্য হলে menu config/permission key-তে `depts: ['kitab']` বা `depts: ['maktab']` দিয়ে control করতে হবে।
- বর্ষ/শ্রেণি management settings থেকে হবে; class `id` stable থাকবে, display name/order/roll prefix/next promotion route/active status edit করা যাবে। Delete না করে inactive করা preferred, কারণ attendance/exam/log/history class-এর সাথে linked থাকে।
- Year-end promotion hardcoded class order/mapping ব্যবহার করবে না; `mdr_classes`/prototype `mm_classes`-এর saved `next_class_id` ও `sort_order` থেকে route নেবে।

## File Size Limits

- যেকোনো API/মডিউল JS (`js/api.js`, `js/dept-api.js`, …) → max 800 lines, প্রয়োজনে module ভাগ করো
- `css/style.css` → max 500 lines
- যেকোনো `.html` → max 600 lines
- নতুন `.js` → max 800 lines

## Data Safety Rules (CRITICAL)

- **DELETE, DROP, TRUNCATE, UPDATE (mass) — চালানোর আগে অবশ্যই user-কে exact SQL দেখিয়ে explicit approval নিতে হবে**
- SQL-এ `WHERE` clause ছাড়া কোনো `DELETE` বা `UPDATE` লেখা যাবে না
- বিদ্যমান ওয়াকফ টেবিলে কোনো migration চালানো যাবে না

## Git Rules

- `git commit` বা `git push` user explicitly না বললে চালাবে না
- প্রতিটি কাজের পরে summary দেবে (কী করলে, কোন ফাইল বদলালে)

## Service Worker

- প্রোটোটাইপ রিপোতে এখনও `sw.js` নেই। **PWA যোগ করলে:** প্রতিটি ফাইল পরিবর্তনে `sw.js`-এর cache version বাড়াতে হবে; নতুন ফাইল `LOCAL_SHELL` array-তে যোগ করতে হবে।

---

## Supabase Database Schema

### Naming Convention
```
বিদ্যমান (ওয়াকফ)  → students, messages, tasks... (হাত দেওয়া যাবে না)
shared             → shared_users, shared_notifications
বিভাগ মডিউল       → dept_departments, dept_transactions, dept_inventory
মাদ্রাসা মডিউল    → mdr_students, mdr_classes, mdr_attendance...
খেদমত মডিউল       → kh_beneficiaries, kh_activities, kh_transactions
```

---

### Migration ক্রম (নতুন, 012 থেকে শুরু)

```
012_shared_users.sql
013_dept_tables.sql
014_dept_rls_rpc.sql
015_mdr_tables.sql
016_mdr_rls_rpc.sql
017_kh_tables.sql
018_kh_rls_rpc.sql
```

---

### 012 — shared_users

```sql
CREATE TABLE IF NOT EXISTS shared_users (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name          text NOT NULL,
  pin           text NOT NULL,
  role          text NOT NULL,
  -- 'admin' | 'dept_head' | 'madrasa_teacher' | 'daftar' | 'khedmat' | 'library' | 'alumni_tracker' | 'hifz'
  module_access text[] NOT NULL DEFAULT '{}',
  -- '{dept}' | '{madrasa}' | '{khedmat}' | '{admin}'
  dept_id       uuid REFERENCES dept_departments(id) ON DELETE SET NULL,
  -- বিভাগীয় দায়িত্বশীলের জন্য কোন বিভাগ
  class_id      uuid REFERENCES mdr_classes(id) ON DELETE SET NULL,
  -- বর্ষ দায়িত্বশীলের জন্য কোন বর্ষ
  is_active     boolean NOT NULL DEFAULT true,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE shared_users ENABLE ROW LEVEL SECURITY;
CREATE POLICY "deny_all_shared_users" ON shared_users FOR ALL USING (false);
```

---

### 013 — dept_tables

#### dept_departments
```sql
CREATE TABLE IF NOT EXISTS dept_departments (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name         text NOT NULL,           -- 'কৃষি বিভাগ'
  emoji        text NOT NULL DEFAULT '🏢',
  description  text,
  is_active    boolean NOT NULL DEFAULT true,
  sort_order   integer NOT NULL DEFAULT 0,
  created_at   timestamptz NOT NULL DEFAULT now()
);
```

#### dept_transactions
```sql
CREATE TABLE IF NOT EXISTS dept_transactions (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  dept_id      uuid NOT NULL REFERENCES dept_departments(id) ON DELETE CASCADE,
  type         text NOT NULL CHECK (type IN ('income', 'expense')),
  amount       numeric(12,2) NOT NULL,
  description  text NOT NULL,
  txn_date     date NOT NULL DEFAULT CURRENT_DATE,
  metadata     jsonb NOT NULL DEFAULT '{}',
  -- উপ-বিভাগ অনুযায়ী অতিরিক্ত ক্ষেত্র (প্লট, মৌচাক, ব্যাচ ইত্যাদি); প্রোটোটাইপে `js/dept-api.js` TRANSACTION.metadata
  entered_by   uuid NOT NULL REFERENCES shared_users(id),
  is_locked    boolean NOT NULL DEFAULT false,
  -- true হলে শুধু admin পরিবর্তন করতে পারবে
  lock_requested_by uuid REFERENCES shared_users(id),
  -- সংশোধন অনুরোধ করেছেন কে
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);
```

#### dept_inventory
```sql
CREATE TABLE IF NOT EXISTS dept_inventory (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  dept_id      uuid NOT NULL REFERENCES dept_departments(id) ON DELETE CASCADE,
  item_name    text NOT NULL,           -- 'ধান', 'মধু'
  unit         text NOT NULL,           -- 'কেজি', 'লিটার', 'পিস'
  quantity     numeric(12,2) NOT NULL DEFAULT 0,
  unit_price   numeric(12,2),           -- optional
  notes        text,
  updated_by   uuid NOT NULL REFERENCES shared_users(id),
  updated_at   timestamptz NOT NULL DEFAULT now()
);
```

#### dept_edit_requests
```sql
-- দায়িত্বশীল locked entry সংশোধন চাইলে admin-এর approval লাগবে
CREATE TABLE IF NOT EXISTS dept_edit_requests (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id uuid NOT NULL REFERENCES dept_transactions(id) ON DELETE CASCADE,
  requested_by   uuid NOT NULL REFERENCES shared_users(id),
  reason         text NOT NULL,
  status         text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected')),
  reviewed_by    uuid REFERENCES shared_users(id),
  created_at     timestamptz NOT NULL DEFAULT now()
);
```

---

### 015 — mdr_tables

#### mdr_divisions (বিভাগ: কিতাব / মক্তব)
```sql
CREATE TABLE IF NOT EXISTS mdr_divisions (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name       text NOT NULL,   -- 'কিতাব বিভাগ' | 'মক্তব বিভাগ'
  code       text NOT NULL,   -- 'kitab' | 'maktab'
  created_at timestamptz NOT NULL DEFAULT now()
);
-- Seed data:
INSERT INTO mdr_divisions (name, code) VALUES
  ('কিতাব বিভাগ', 'kitab'),
  ('মক্তব বিভাগ', 'maktab');
```

#### mdr_classes (বর্ষ)
```sql
CREATE TABLE IF NOT EXISTS mdr_classes (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  division_id  uuid NOT NULL REFERENCES mdr_divisions(id),
  name         text NOT NULL,     -- '১ম বর্ষ' | 'ইয়াদা বর্ষ' | '২য় বর্ষ'
  code         text NOT NULL,     -- 'y1' | 'iyada' | 'y2' ... 'y8' | 'm1'...'m5'
  roll_prefix  integer,           -- 100, 200... (ইয়াদার জন্য NULL, আলাদা ই prefix)
  is_iyada     boolean NOT NULL DEFAULT false,
  sort_order   integer NOT NULL DEFAULT 0,
  created_at   timestamptz NOT NULL DEFAULT now()
);
-- Seed data (কিতাব বিভাগ):
-- ১ম বর্ষ (roll_prefix=100), ইয়াদা (is_iyada=true), ২য়-৭ম বর্ষ (200-700); ৮ম বর্ষ বর্তমান স্কিমায় রাখা হবে না
-- Seed data (মক্তব বিভাগ):
-- ১ম-৫ম বর্ষ
```

#### mdr_students
```sql
CREATE TABLE IF NOT EXISTS mdr_students (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id      text NOT NULL UNIQUE,
  -- কিতাব: '৪৭০০১', মক্তব: 'ম৪৭০০১'
  name            text NOT NULL,
  address         text,
  guardian_name   text,
  guardian_phone  text,
  guardian_occupation text,
  division_id     uuid NOT NULL REFERENCES mdr_divisions(id),
  current_class_id uuid NOT NULL REFERENCES mdr_classes(id),
  current_roll    text NOT NULL,
  -- কিতাব: '১০১', ইয়াদা: 'ই০১', মক্তব: '১০১'
  admission_date  date NOT NULL DEFAULT CURRENT_DATE,
  hijri_year      text NOT NULL,   -- ভর্তির হিজরী সন, যেমন '১৪৪৭'
  status          text NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'alumni', 'dropped')),
  is_waqf         boolean NOT NULL DEFAULT false,
  -- ওয়াকফ বিভাগে গেলে true
  is_hifz         boolean NOT NULL DEFAULT false,
  -- হিফজ বিভাগে নির্বাচিত হলে true
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);
```

#### mdr_class_history (বর্ষ পরিবর্তনের ইতিহাস)
```sql
CREATE TABLE IF NOT EXISTS mdr_class_history (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES mdr_students(id) ON DELETE CASCADE,
  class_id   uuid NOT NULL REFERENCES mdr_classes(id),
  roll       text NOT NULL,
  from_date  date NOT NULL,
  to_date    date,
  -- NULL মানে বর্তমানে এই বর্ষে আছে
  notes      text,
  created_at timestamptz NOT NULL DEFAULT now()
);
```

#### mdr_attendance
```sql
CREATE TABLE IF NOT EXISTS mdr_attendance (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id   uuid NOT NULL REFERENCES mdr_classes(id) ON DELETE CASCADE,
  date       date NOT NULL DEFAULT CURRENT_DATE,
  entered_by uuid NOT NULL REFERENCES shared_users(id),
  -- দফতর দায়িত্বশীল
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (class_id, date)
);
```

#### mdr_attendance_details
```sql
CREATE TABLE IF NOT EXISTS mdr_attendance_details (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  attendance_id uuid NOT NULL REFERENCES mdr_attendance(id) ON DELETE CASCADE,
  student_id    uuid NOT NULL REFERENCES mdr_students(id) ON DELETE CASCADE,
  is_present    boolean NOT NULL DEFAULT true,
  UNIQUE (attendance_id, student_id)
);
```

#### mdr_books (কিতাব তালিকা — বর্ষভিত্তিক)
```sql
CREATE TABLE IF NOT EXISTS mdr_books (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id   uuid NOT NULL REFERENCES mdr_classes(id) ON DELETE CASCADE,
  name       text NOT NULL,      -- 'হেদায়াতুন নাহু'
  total_pages integer,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
```

#### mdr_book_progress (কিতাব অগ্রগতি — বর্ষভিত্তিক)
```sql
CREATE TABLE IF NOT EXISTS mdr_book_progress (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  book_id      uuid NOT NULL REFERENCES mdr_books(id) ON DELETE CASCADE,
  pages_done   integer NOT NULL DEFAULT 0,
  notes        text,
  updated_by   uuid NOT NULL REFERENCES shared_users(id),
  updated_at   timestamptz NOT NULL DEFAULT now(),
  UNIQUE (book_id)
  -- একটি বইয়ের একটিই current progress row
);
```

#### mdr_akhlaq (হুসনুল খুলুক মূল্যায়ন)
```sql
CREATE TABLE IF NOT EXISTS mdr_akhlaq (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES mdr_students(id) ON DELETE CASCADE,
  score      integer NOT NULL CHECK (score BETWEEN 0 AND 100),
  reason     text NOT NULL,
  evaluated_by uuid NOT NULL REFERENCES shared_users(id),
  evaluated_at timestamptz NOT NULL DEFAULT now()
  -- প্রতিটি মূল্যায়ন আলাদা row — ইতিহাস রাখে
);
```

#### mdr_exams
```sql
CREATE TABLE IF NOT EXISTS mdr_exams (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name       text NOT NULL,      -- 'ষান্মাসিক পরীক্ষা ১৪৪৭'
  type       text NOT NULL CHECK (type IN ('half_yearly', 'yearly', 'test')),
  class_id   uuid NOT NULL REFERENCES mdr_classes(id) ON DELETE CASCADE,
  exam_date  date,
  created_by uuid NOT NULL REFERENCES shared_users(id),
  created_at timestamptz NOT NULL DEFAULT now()
);
```

#### mdr_exam_subjects
```sql
CREATE TABLE IF NOT EXISTS mdr_exam_subjects (
  id       uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  exam_id  uuid NOT NULL REFERENCES mdr_exams(id) ON DELETE CASCADE,
  name     text NOT NULL,        -- 'নাহু', 'ফিকহ'
  max_marks integer NOT NULL DEFAULT 100
);
```

#### mdr_exam_results
```sql
CREATE TABLE IF NOT EXISTS mdr_exam_results (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  exam_id    uuid NOT NULL REFERENCES mdr_exams(id) ON DELETE CASCADE,
  student_id uuid NOT NULL REFERENCES mdr_students(id) ON DELETE CASCADE,
  subject_id uuid NOT NULL REFERENCES mdr_exam_subjects(id) ON DELETE CASCADE,
  marks      numeric(5,2) NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (exam_id, student_id, subject_id)
);
```

#### mdr_fee_summary (বেতন summary — ম্যানুয়াল এন্ট্রি)
```sql
CREATE TABLE IF NOT EXISTS mdr_fee_summary (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  month           text NOT NULL,       -- '২০২৫-০৪'
  total_students  integer NOT NULL,
  paid_count      integer NOT NULL,
  unpaid_count    integer NOT NULL,
  total_due       numeric(12,2),
  late_payers     text,               -- নাম বা ID-র list (text)
  notes           text,
  entered_by      uuid NOT NULL REFERENCES shared_users(id),
  created_at      timestamptz NOT NULL DEFAULT now(),
  UNIQUE (month)
);
```

#### mdr_logs (বর্ষের লগ ও ছাত্রের লগ)
```sql
CREATE TABLE IF NOT EXISTS mdr_logs (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type       text NOT NULL CHECK (type IN ('class', 'student')),
  -- 'class' = বর্ষের লগ, 'student' = ছাত্রের লগ
  class_id   uuid REFERENCES mdr_classes(id) ON DELETE CASCADE,
  student_id uuid REFERENCES mdr_students(id) ON DELETE CASCADE,
  content    text NOT NULL,
  written_by uuid NOT NULL REFERENCES shared_users(id),
  created_at timestamptz NOT NULL DEFAULT now()
);
```

#### mdr_hifz_groups
```sql
CREATE TABLE IF NOT EXISTS mdr_hifz_groups (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name       text NOT NULL,     -- 'গ্রুপ ১'
  teacher_id uuid REFERENCES shared_users(id),
  created_at timestamptz NOT NULL DEFAULT now()
);
```

#### mdr_hifz_students
```sql
CREATE TABLE IF NOT EXISTS mdr_hifz_students (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES mdr_students(id) ON DELETE CASCADE,
  group_id   uuid REFERENCES mdr_hifz_groups(id),
  joined_at  date NOT NULL DEFAULT CURRENT_DATE,
  UNIQUE (student_id)
);
```

#### mdr_hifz_progress
```sql
CREATE TABLE IF NOT EXISTS mdr_hifz_progress (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id     uuid NOT NULL REFERENCES mdr_hifz_groups(id) ON DELETE CASCADE,
  paras_done   integer NOT NULL DEFAULT 0,
  surahs_done  integer NOT NULL DEFAULT 0,
  notes        text,
  updated_by   uuid NOT NULL REFERENCES shared_users(id),
  updated_at   timestamptz NOT NULL DEFAULT now()
);
```

#### mdr_library_books
```sql
CREATE TABLE IF NOT EXISTS mdr_library_books (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title       text NOT NULL,
  author      text,
  category    text,
  total_copies integer NOT NULL DEFAULT 1,
  available   integer NOT NULL DEFAULT 1,
  created_at  timestamptz NOT NULL DEFAULT now()
);
```

#### mdr_library_issues
```sql
CREATE TABLE IF NOT EXISTS mdr_library_issues (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  book_id     uuid NOT NULL REFERENCES mdr_library_books(id) ON DELETE CASCADE,
  student_id  uuid NOT NULL REFERENCES mdr_students(id) ON DELETE CASCADE,
  issued_at   date NOT NULL DEFAULT CURRENT_DATE,
  due_date    date,
  returned_at date,
  issued_by   uuid NOT NULL REFERENCES shared_users(id),
  created_at  timestamptz NOT NULL DEFAULT now()
);
```

#### mdr_alumni (পুরনো ছাত্র)
```sql
CREATE TABLE IF NOT EXISTS mdr_alumni (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id    uuid NOT NULL REFERENCES mdr_students(id) ON DELETE CASCADE,
  left_date     date NOT NULL,
  left_reason   text NOT NULL CHECK (left_reason IN ('completed', 'dropped')),
  -- 'completed' = পড়া শেষ, 'dropped' = মাঝপথে
  last_class_id uuid REFERENCES mdr_classes(id),
  created_at    timestamptz NOT NULL DEFAULT now(),
  UNIQUE (student_id)
);
```

#### mdr_alumni_followups (পুরনো ছাত্রের followup)
```sql
CREATE TABLE IF NOT EXISTS mdr_alumni_followups (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  alumni_id  uuid NOT NULL REFERENCES mdr_alumni(id) ON DELETE CASCADE,
  contact_date date NOT NULL DEFAULT CURRENT_DATE,
  current_status text NOT NULL,   -- 'ইমামতি করছেন', 'ব্যবসা করছেন'
  notes      text,
  entered_by uuid NOT NULL REFERENCES shared_users(id),
  created_at timestamptz NOT NULL DEFAULT now()
);
```

---

### 017 — kh_tables

#### kh_activity_types (কার্যক্রমের ধরন — admin যোগ করবেন)
```sql
CREATE TABLE IF NOT EXISTS kh_activity_types (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name       text NOT NULL,    -- 'চিকিৎসা সহায়তা'
  emoji      text NOT NULL DEFAULT '🤝',
  is_active  boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
-- Seed:
INSERT INTO kh_activity_types (name, emoji) VALUES
  ('চিকিৎসা সহায়তা', '🏥'),
  ('খাদ্য সহায়তা', '🍚'),
  ('আর্থিক সহায়তা', '💵'),
  ('অন্যান্য সেবা', '🤝');
```

#### kh_beneficiaries (উপকারভোগী)
```sql
CREATE TABLE IF NOT EXISTS kh_beneficiaries (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name         text NOT NULL,
  address      text,
  phone        text,
  family_info  text,     -- পরিবারের বিবরণ
  first_contact date NOT NULL DEFAULT CURRENT_DATE,
  notes        text,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);
```

#### kh_activities (কার্যক্রম)
```sql
CREATE TABLE IF NOT EXISTS kh_activities (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  beneficiary_id  uuid NOT NULL REFERENCES kh_beneficiaries(id) ON DELETE CASCADE,
  type_id         uuid NOT NULL REFERENCES kh_activity_types(id),
  title           text NOT NULL,
  description     text NOT NULL,
  amount_spent    numeric(12,2) NOT NULL DEFAULT 0,
  activity_date   date NOT NULL DEFAULT CURRENT_DATE,
  entered_by      uuid NOT NULL REFERENCES shared_users(id),
  created_at      timestamptz NOT NULL DEFAULT now()
);
```

#### kh_logs (দায়িত্বশীলের দৈনিক লগ)
```sql
CREATE TABLE IF NOT EXISTS kh_logs (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  content    text NOT NULL,
  log_date   date NOT NULL DEFAULT CURRENT_DATE,
  written_by uuid NOT NULL REFERENCES shared_users(id),
  created_at timestamptz NOT NULL DEFAULT now()
);
```

#### kh_fund_transactions (তহবিল হিসাব)
```sql
CREATE TABLE IF NOT EXISTS kh_fund_transactions (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type        text NOT NULL CHECK (type IN ('income', 'expense')),
  amount      numeric(12,2) NOT NULL,
  source      text,
  -- 'মাদ্রাসা তহবিল' | 'বিকাশ দান' | NULL
  description text NOT NULL,
  txn_date    date NOT NULL DEFAULT CURRENT_DATE,
  activity_id uuid REFERENCES kh_activities(id) ON DELETE SET NULL,
  -- কোন কার্যক্রমের জন্য ব্যয় হলে link
  entered_by  uuid NOT NULL REFERENCES shared_users(id),
  created_at  timestamptz NOT NULL DEFAULT now()
);
```

---

## RPC Pattern (সব মডিউলে একই pattern)

```
hub_*      → Admin Hub-এর bootstrap ও summary RPCs
dept_rel_* → বিভাগ মডিউলের RPCs
mdr_rel_*  → মাদ্রাসা মডিউলের RPCs
kh_rel_*   → খেদমত মডিউলের RPCs
```

সব RPC:
- `SECURITY DEFINER`
- `GRANT EXECUTE TO anon`
- PIN verification: `private.verify_admin_pin(p_pin)` বা `private.verify_user_pin(p_user_id, p_pin)`

---

## File Tree

### বর্তমান প্রোটোটাইপ (`test-markaz`)

```
test-markaz/
├── CLAUDE.md
├── WORKFLOW.md                  ← (ঐচ্ছিক) কাজের নোট
├── backup/                      ← পুনরুদ্ধার রেফারেন্স (ঐচ্ছিক)
│
├── css/
│   └── style.css                ← যৌথ স্টাইল (max 500 lines)
├── js/
│   ├── api.js                   ← মাদ্রাসা মডিউল API (localStorage)
│   ├── mm-session.js            ← সেশন কী / MMSession (শুধু এখান থেকে)
│   ├── dept-api.js              ← বিভাগ মডিউল + উপ-বিভাগ extra field config
│   ├── khedmat-api.js
│   ├── chat-api.js
│   └── monitor-mode.js
│
├── index.html                   ← ভূমিকা / PIN → মডিউলে redirect
├── main-admin-madrasa.html      ← জিম্মাদার: মাদ্রাসা unified dashboard + dept filter
├── main-admin-dept.html         ← জিম্মাদার: বিভাগ summary
├── main-admin-khedmat.html      ← জিম্মাদার: খেদমত summary
├── main-admin-recent.html       ← জিম্মাদার: সাম্প্রতিক কার্যক্রম
├── chat.html                    ← স্টাফ ↔ জিম্মাদার বার্তা
├── staff-portal.html            ← UI রেফারেন্স / পোর্টাল ধারণা
│
├── madrasa/                     ← মাদ্রাসা মডিউল পেজ (madrasa-*.html)
├── dept/                        ← বিভাগ মডিউল (dept-index, dept-staff, dept-dashboard)
├── khedmat/                     ← খেদমত মডিউল (khedmat-*.html)
└── .vscode/                     ← (ঐচ্ছিক) এডিটর সেটিং
```

**নোট:** ভবিষ্যত Vercel/Supabase বিল্ডে ফাইল নাম সরলীকৃত হতে পারে (`admin.html`, `dept.html`, …) — নিচের ব্লক সেই লক্ষ্যের ধারণা।

### ভবিষ্যত production লেআউট (`markaz-hub/` — পরিকল্পনা)

```
markaz-hub/
├── CLAUDE.md
├── supabase-config.js           ← gitignored (real keys)
├── supabase-config.example.js
├── package.json
├── build.js
├── sw.js                        ← PWA হলে
├── pwa-notify.js
├── css/style.css                ← বা একক style.css (টিম সিদ্ধান্ত)
├── migrations/                  ← 012–018
├── api-shared.js / api-dept.js / api-mdr.js / api-kh.js   ← Supabase ক্লায়েন্ট লেয়ার
├── admin.html
├── dept.html
├── madrasa.html
└── khedmat.html
```

---

## বিভাগ মডিউল — উপ-বিভাগ (কৃষি / মধু / বেকারি ইত্যাদি)

প্রোটোটাইপে **একই লেনদেন মডেল** সব `dept_id`-এর জন্য; অতিরিক্ত ১–২টি ক্ষেত্রের প্রয়োজন হলে:

- প্রতিটি লেনদেনে **`metadata`** অবজেক্ট (যেমন `plot`, `hives`, `batch`)।
- **`js/dept-api.js`**-এ **`SUBDEPT_EXTRA_FIELDS`** — `dept_id` → ফর্ম ফিল্ডের তালিকা; **`getSubdeptFields(dept_id)`** UI ব্যবহার করে।
- **`dept/dept-staff.html`** মডালে সেই ফিল্ডগুলো ডাইনামিক ভরে; নতুন উপ-বিভাগের জন্য সাধারণত **নতুন HTML কপি নয়**, শুধু কনফিগ/কী বাড়ানো।

Supabase মাইগ্রেশনে `dept_transactions.metadata jsonb` (উপরের 013 স্কিমা) একই ধারণা ধরে রাখে।

---

## Roles ও Access

| Role | লগইন | কী দেখবেন |
|------|-------|-----------|
| admin | PIN (4 digit) | সব মডিউল, সব ডেটা |
| dept_head | user_id + PIN | শুধু নিজের বিভাগ |
| madrasa_teacher | user_id + PIN | শুধু নিজের বর্ষ |
| daftar | user_id + PIN | উপস্থিতি + বেতন summary |
| khedmat | user_id + PIN | খেদমত মডিউল |
| library | user_id + PIN | লাইব্রেরি |
| alumni_tracker | user_id + PIN | পুরনো ছাত্র |
| hifz | user_id + PIN | হিফজ বিভাগ |

---

## কাজের ক্রম (agent এই ক্রমে কাজ করবে)

### ধাপ ১ — Database (সর্বপ্রথম)
1. `migrations/012_shared_users.sql` লেখো
2. `migrations/013_dept_tables.sql` লেখো
3. `migrations/014_dept_rls_rpc.sql` লেখো — RLS + RPC for dept
4. বাকি migrations (015-018) লেখো

**গুরুত্বপূর্ণ:** migrations লেখার পরে user-কে বলবে Supabase SQL Editor-এ ক্রমানুসারে run করতে। নিজে run করবে না।

### ধাপ ২ — Shared Layer
1. `supabase-config.example.js` বানাও
2. `package.json` + `build.js` বানাও
3. `api-shared.js` বানাও — login, PIN verify, user bootstrap

### ধাপ ৩ — বিভাগ মডিউল (সবার আগে, সবচেয়ে সহজ)
1. Supabase লেয়ার: `api-dept.js` (বা মডিউল ভাগ) বানাও — প্রোটোটাইপের লজিক `js/dept-api.js` থেকে পোর্ট করতে পারো।
2. দায়িত্বশীলের পোর্টাল: পরিকল্পনায় `dept.html` — বর্তমান প্রোটোটাইপে `dept/dept-index.html`, `dept/dept-staff.html`, `dept/dept-dashboard.html`।
3. Main admin page: পরিকল্পনায় `admin.html` — প্রোটোটাইপে `main-admin-dept.html`-এ বিভাগ মডিউলের summary/লিঙ্ক।

### ধাপ ৪ — খেদমত মডিউল
1. Supabase লেয়ার: `api-kh.js` (বা মডিউল ভাগ) বানাও — প্রোটোটাইপের লজিক `js/khedmat-api.js` থেকে পোর্ট করতে পারো।
2. পোর্টাল: পরিকল্পনায় এক পাতা `khedmat.html` — বর্তমান প্রোটোটাইপে `khedmat/khedmat-admin.html`, `khedmat/khedmat-staff.html`।
3. Main admin page: পরিকল্পনায় `admin.html` — প্রোটোটাইপে `main-admin-khedmat.html`-এ খেদমত মডিউল কার্ড/সারসংক্ষেপ।

### ধাপ ৫ — মাদ্রাসা মডিউল (সবচেয়ে জটিল, সবশেষে)
1. Supabase লেয়ার: `api-mdr.js` (বা মডিউল ভাগ) বানাও — প্রোটোটাইপের লজিক `js/api.js` (+ প্রয়োজনে ভাগ) থেকে পোর্ট করতে পারো।
2. পোর্টাল: পরিকল্পনায় `madrasa.html` — বর্তমান প্রোটোটাইপে `madrasa/` ফোল্ডারে একাধিক পেজ (`madrasa-admin.html`, `madrasa-daftar.html`, `madrasa-staff.html`, `madrasa-hifz.html`, `madrasa-library.html`, `madrasa-exams.html`, `madrasa-alumni.html`, `madrasa-settings.html` ইত্যাদি)।
3. Main admin page: পরিকল্পনায় `admin.html` — প্রোটোটাইপে `main-admin-madrasa.html`-এ মাদ্রাসা মডিউল dashboard/লিঙ্ক।
4. ক্রস-মডিউল: প্রোটোটাইপে `chat.html` স্টাফ↔জিম্মাদার বার্তা; Supabase চালু হলে একই ধারণা ধরে রাখো।

### ধাপ ৬ — PWA ও Service Worker
1. `sw.js` বানাও — প্রোটোটাইপে এখনও নেই; নতুন করে যোগ করতে হবে।
2. `pwa-notify.js` বানাও (Web Push হলে) — প্রোটোটাইপে এখনও নেই।
3. প্রতিটি HTML-এ PWA manifest লিঙ্ক (ও আইকন মেটা) যোগ করো।

---

## UI Guidelines

- Mobile-first, বাংলা ফন্ট: `Noto Sans Bengali` + `Noto Serif Bengali`
- Color palette: বিদ্যমান prototype থেকে নাও (`css/style.css` + `main-admin-madrasa.html` দেখো)
- Bottom navigation: প্রতিটি পোর্টালে
- PIN-based login: numpad UI (বিদ্যমান prototype দেখো)
- সব form-এ বাংলা placeholder ও label
- Toast notification সব action-এ

## Main Admin Summary (`main-admin-*.html` — প্রোটোটাইপ; ভবিষ্যতে `admin.html`)

হোম ড্যাশবোর্ডে দেখাবে:
- মোট ছাত্র, কর্মী, বিভাগ সংখ্যা
- আজকের উপস্থিতি (মাদ্রাসা)
- সব বিভাগের আয়/ব্যয় summary
- খেদমতে খালক এই মাসের সারসংক্ষেপ
- সাম্প্রতিক কার্যক্রম feed (সব মডিউল থেকে)
- দায়িত্ব বণ্টন তালিকা (admin manage করবেন)

---

## Deployment

- **Vercel:** `SUPABASE_URL`, `SUPABASE_ANON_KEY` env set করো
- **Build:** `npm run build` → `supabase-config.js` generate হবে
- **Domain:** আলাদা domain বা subdomain (বিদ্যমান ওয়াকফ অ্যাপ থেকে আলাদা)

---

## Self-Maintenance

প্রতিটি feature যোগের পরে এই CLAUDE.md আপডেট করো যদি কোনো rule বদলায়।
