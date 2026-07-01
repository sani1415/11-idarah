# Madrasatul Madina Idarah

মাদরাসা, বিভাগ এবং খেদমতে খালক কাজ পরিচালনার জন্য vanilla HTML/CSS/JS ভিত্তিক একটি management app. এই ফাইলটি human developer এবং AI agent-এর প্রথম project brief.

## Quick Map

| অংশ | পথ / ফাইল |
| --- | --- |
| মূল login | `app/index.html` |
| মাদরাসা admin | `app/admin/madrasa.html`, `app/madrasa/admin/`, `app/madrasa/` |
| বিভাগ admin | `app/admin/dept.html`, `app/dept/` |
| খেদমত admin | `app/admin/khedmat.html`, `app/khedmat/` |
| shared JS | `app/js/` |
| shared CSS | `app/css/style.css` |
| Supabase helper | `app/js/api/api-shared.js`, `app/js/api/api-mdr.js`, `supabase-config.js` |
| Supabase migrations | `supabase/migrations/` |
| older/legacy migrations | `_archive/legacy-migrations/` |
| scripts/tools | `scripts/`, `tools/` |
| agent rules | `CLAUDE.md` |
| user guide | `USER_MANUAL.md` |

## Stack

- Frontend: plain HTML, CSS, vanilla JavaScript.
- Backend/data: Supabase PostgreSQL through RPC functions.
- Auth model: app-level PIN/login verification through Supabase RPCs and `app/js/core/mm-session.js`.
- Styling: shared `app/css/style.css` plus page-specific CSS where needed.
- Build check: `npm run build`.

This is not a React/Vue/Next app. Do not add a framework unless the user explicitly asks.

## Current Architecture

The app started as a local prototype, so some old helpers and local sample-data code still exist. Current direction is database-backed behavior through Supabase. New work should treat Supabase/RPC as the source of truth and should not add new write-side `localStorage` fallback unless the user explicitly asks for a temporary prototype.

Important client-side files:

- `app/js/api/api-shared.js`: shared Supabase RPC wrapper.
- `app/js/api/api-mdr.js`: madrasa-specific RPC wrapper.
- `app/js/core/mm-session.js`: shared session/login state helper.
- `app/js/madrasa/mdr-supabase-sync.js`: madrasa Supabase sync layer.
- `app/js/dept/dept-supabase-sync.js`: department Supabase sync layer.
- `app/js/api/api.js`, `app/js/dept/dept-api.js`, `app/js/khedmat/khedmat-api.js`: module-facing APIs; inspect current implementation before assuming storage behavior.

Important database prefixes:

- `shared_*`: shared users/session-related data.
- `mdr_*`: madrasa module.
- `dept_*`: department module.
- `kh_*`: khedmat module.
- `private.*`: helper functions not directly callable by frontend.

RPC functions are usually `SECURITY DEFINER`; public tables generally keep RLS enabled with deny-all policies, then expose controlled operations through RPC.

## Module Notes

- Madrasa: students, attendance, daftar/accounts, dars, exams, hifz, library, alumni, kormosuchi, settings live under `app/madrasa/` (staff) and `app/madrasa/admin/` (জিম্মাদার/admin views), with JS in `app/js/madrasa/`.
- Department: department login, staff portal, admin view, transactions, inventory, dynamic fields and edit requests live under `app/dept/`, `app/admin/dept.html`, `app/js/dept/`.
- Khedmat: admin/staff flows live under `app/khedmat/`, `app/admin/khedmat.html`, `app/js/khedmat/`, and newer Supabase migration/RPC work.
- Chat/session/navigation helpers are shared across modules.

Always verify the exact current file before changing behavior; several modules have been migrated gradually.

## Running And Checking

Install dependencies if needed:

```bash
npm install
```

Run the repo build check:

```bash
npm run build
```

For a focused JS syntax check:

```bash
node --check app/js/some-file.js
```

For Supabase changes:

- Add or update SQL in `supabase/migrations/`.
- Keep RPC signatures aligned with the frontend wrapper.
- Verify migration syntax and, when appropriate, push/apply through the approved Supabase workflow.
- Do not expose service-role keys in frontend files.

## Documentation Roles

- `README.md`: project map, architecture, current source of truth.
- `CLAUDE.md`: AI agent operating rules.
- `USER_MANUAL.md`: user-facing usage guide.

`WORKFLOW.md` was merged into this README to avoid duplicate and stale instructions.
