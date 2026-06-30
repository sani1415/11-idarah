# AGENTS_MAP — কোথায় কী আছে

> এই repo-তে কাজ শুরুর আগে এক নজরে দেখে নাও কোন কাজের কোড কোথায়।
> বিস্তারিত নিয়ম: `CLAUDE.md` • behavior: `USER_MANUAL.md` • reorg ইতিহাস: `REORG_PLAN.md`

## এক নজরে — কাজ → ফাইল

| কাজ | HTML | JS |
|-----|------|----|
| Login hub / entry | `index.html`, `chat.html` | `js/core/` |
| Admin hub (subdomain `admin.idarah786.com`) | `admin/`, root `main-admin-*.html` | `js/shared/admin-nav.js`, `js/shared/admin-recent-feed.js` |
| মাদরাসা — staff UI | `madrasa/madrasa-*.html` | `js/madrasa/madrasa-*.js`, `js/madrasa/mdr-*.js` |
| মাদরাসা — admin UI | `madrasa/mdr-admin-*.html` | `js/madrasa/mdr-*.js` |
| বিভাগ (Department) | `dept/*.html` | `js/dept/` |
| খেদমত (Khedmat) | `khedmat/*.html` | `js/khedmat/` |

## `js/` ফোল্ডার মানচিত্র

- **`js/core/`** — app-wide foundation: `mm-session` (auth/session), `mm-boot`,
  `mm-permissions`, `mm-push`, `mm-install`, `app-update`, `capacitor-native`,
  `mm-hijri` / `hijri-utils` (তারিখ), `monitor-mode`, `mm-sample-data`।
- **`js/api/`** — Supabase data layer (RPC wrapper): `api-shared.js`, `api-mdr.js`, `api.js`।
  > RPC নাম পাল্টালে এখানকার wrapper **আর** `supabase/migrations/` একসাথে আপডেট করতে হবে।
- **`js/shared/`** — cross-module UI/helper: `admin-nav`, `admin-recent-feed`,
  `chat-api`, `chat-staff-nav`, `daftar-bottom-nav`, `alumni-integration`,
  `mm-student-modal`, `mm-teacher-modal`, `mam-overlay`।
- **`js/madrasa/`** — মাদরাসার সব feature: `madrasa-*` (accounts, attendance, exams,
  kormosuchi, print, daftar) + `mdr-*` (supabase sync, daftar, exams, khadimin,
  dastarkhan, home-panels) + `mm-old-madrasa-import-data`।
- **`js/dept/`** — `dept-api`, `dept-supabase-sync`, `dept-units`।
- **`js/khedmat/`** — `khedmat-api`।
- **`js/vendor/`** — build-এ generated Capacitor shims (gitignored)।

## Backend / build

- **DB পরিবর্তন** → `supabase/migrations/` (timestamped, **একমাত্র** migration source)।
  পুরনো numbered migrations শুধু reference হিসেবে `_archive/legacy-migrations/`-এ।
- **Edge function** → `supabase/functions/send-admin-push/`।
- **Build/deploy** → `build.js` (static copy + `?v=` cache-bust + script inject),
  `vercel.json`, `capacitor.config.json`। Output → `public/` (gitignored)।
- **Native (Android)** → `android/` (Capacitor)।
- **Dev/data scripts** → `scripts/`।

## জরুরি নিয়ম (CLAUDE.md থেকে সংক্ষেপে)

- পুরনো Waqf tables (`waqf_*`) ছোঁয়া যাবে না; এই app-এর tables `mdr_*`/`mdr_dept_*`/`mdr_khedmat_*`/`mdr_shared_*`।
- Frontend-এ service-role key/secret রাখা যাবে না; RLS deny-all + RPC pattern বজায়।
- User-facing text বাংলায়; user data render-এ safe escaping।
- নতুন write-side `localStorage` fallback যোগ করা যাবে না।

## Build constraint (path move করার আগে পড়ো)

`build.js` `['css','js','madrasa','dept','khedmat','admin','icons']` folder + root `*.html`
recursive copy করে। `js/`-এর **ভেতরে** subfolder নিরাপদ (recursive copy), কিন্তু কোনো top-level
folder rename/HTML নাম পরিবর্তন করলে `build.js` + প্রতিটা HTML reference + `vercel.json` redirect
একসাথে আপডেট করতে হবে (~১৯৫ inter-page link)।
