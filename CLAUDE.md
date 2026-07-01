# Agent Instructions

এই repo-তে কাজ করা AI agent-এর জন্য সংক্ষিপ্ত নিয়ম। Project overview দরকার হলে আগে `README.md` পড়বে, user-facing behavior দরকার হলে `USER_MANUAL.md` পড়বে।

কোন কাজের কোড কোথায় আছে দ্রুত জানতে `AGENTS_MAP.md` দেখবে।

## Critical Boundaries

- Existing Waqf app/repo/data স্পর্শ করা যাবে না।
- Supabase project একই হলেও পুরনো Waqf tables স্পর্শ করা যাবে না: `waqf_students`, `waqf_messages`, `waqf_tasks`, `waqf_task_assignments`, `waqf_goals`, `waqf_quizzes`, `waqf_quiz_questions`, `waqf_quiz_assignees`, `waqf_quiz_submissions`, `waqf_documents`, `waqf_academic_history`, `waqf_teacher_notes`, `waqf_pwa_subscriptions`, `waqf_madrasa_config`, `waqf_app_kv`, `waqf_diary`, `waqf_student_groups`, `waqf_daily_schedule_rows`, `waqf_daily_schedule_proposals`, `waqf_task_completions`, `waqf_device_push_tokens`.
- এই app-এর Idarah tables সব `mdr_*` দিয়ে শুরু হবে: `mdr_*` (মাদরাসা), `mdr_dept_*`, `mdr_khedmat_*`, `mdr_shared_*`.
- Frontend-এ service-role key, secret, private token বা admin credential রাখা যাবে না।

## Source Of Truth

- Current app behavior Supabase/RPC-backed ধরে কাজ করবে।
- পুরনো local prototype code থাকতে পারে, কিন্তু নতুন write-side `localStorage` fallback যোগ করবে না, যদি user explicitly temporary prototype না চান।
- Database change লাগলে `supabase/migrations/`-এ migration লিখবে এবং frontend wrapper/RPC call একসাথে মিলিয়ে দেবে।
- Tables সরাসরি open access করবে না; RLS deny-all + controlled RPC pattern বজায় রাখবে।

## Frontend Rules

- Vanilla HTML/CSS/JS বজায় রাখবে।
- Existing UI pattern, Bangla wording, modal/navigation style অনুসরণ করবে।
- User-facing text বাংলায় রাখবে।
- Repeated shared behavior হলে existing helper আগে খুঁজবে: `app/js/core/mm-session.js`, `app/js/api/api-shared.js`, `app/js/api/api-mdr.js`, `app/js/<module>/*-supabase-sync.js`.
- User data render করলে escaping/safe rendering ব্যবহার করবে; raw HTML injection এড়াবে।
- Mobile layout ভাঙে কিনা খেয়াল করবে, কারণ app-এর অনেক কাজ mobile-first.

## Supabase Rules

- RPC নাম, parameter এবং frontend wrapper একই সাথে update করবে।
- `private.*` helper public execute grant পাবে না।
- Destructive SQL (`DELETE`, `DROP`, `TRUNCATE`, broad `UPDATE`) user approval ছাড়া চালাবে না।
- Existing data migration করলে rollback/verification ভাববে এবং summary-তে risk বলবে।
- Admin/restricted-admin permission scope backend RPC-তে enforce করবে, শুধু UI hide করে security ধরে নেবে না।

## Git And Workspace Rules

- User না বললে `git commit`, `git push`, `git reset --hard`, `git checkout --` চালাবে না।
- Dirty worktree স্বাভাবিক ধরে কাজ করবে; নিজের নয় এমন change revert করবে না।
- Unrelated file touch করবে না।
- Manual edits `apply_patch` দিয়ে করবে।
- Search/read করতে `rg` এবং parallel reads ব্যবহার করবে।

## Verification

কাজের ধরন অনুযায়ী অন্তত একটি relevant check চালাবে:

- JS edit: `node --check path/to/file.js`.
- Repo-level sanity: `npm run build`.
- Supabase/RPC edit: migration/RPC signature review, এবং সম্ভব হলে live RPC smoke test.
- UI edit: browser/rendered behavior check করা ভালো, বিশেষ করে modal, navigation, mobile layout, student/account/department flows.

Final response-এ সংক্ষেপে বলবে:

- কী পরিবর্তন হয়েছে।
- কোন file touch হয়েছে।
- কী verify করা হয়েছে বা করা যায়নি।
