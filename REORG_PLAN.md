# Repo Reorganization Plan (AI-agent friendly)

> লক্ষ্য: folder নাম দেখেই বোঝা যাবে কোথায় কী আছে, junk/noise থাকবে না,
> একটাই source of truth থাকবে — যাতে যেকোনো AI agent কম context-এ দ্রুত কাজ করতে পারে।
> **মূলনীতি: build pipeline আর live URL contract ভাঙা যাবে না।**

---

## 0. মূল নীতি (কেন এই plan এমন)

1. **JS move নিরাপদ, HTML rename বিপজ্জনক।** `build.js` `cpSync` দিয়ে `js/` recursive copy করে,
   তাই `js/`-এর ভেতরে subfolder বানালে build ভাঙে না — শুধু HTML-এর `<script src>` path পাল্টে।
   কিন্তু HTML rename/move করলে **~১৯৫টা inter-page link (HTML) + ~৩০টা (JS) + nav helper**
   একসাথে ভাঙে, এবং live PWA-র bookmark/install-scope/`vercel.json` redirect প্রভাবিত হয়।
2. **সস্তা win আগে।** junk cleanup আর duplicate-migration — শূন্য ঝুঁকি, সর্বোচ্চ পরিষ্কার ফল।
3. **URL stable রাখা।** HTML ফাইল যেখানে আছে সেখানেই থাকবে; নাম-prefix (`madrasa-` = staff,
   `mdr-admin-` = admin) দিয়ে আগে থেকেই grouping আছে — সেটাই কাজে লাগানো হবে, rename নয়।
4. **প্রতি ধাপ আলাদা commit + verify।** এক ধাক্কায় ২৭৪ ফাইল নাড়ানো হবে না।

---

## 1. লক্ষ্য Tree (end-state)

```
11-idarah/
├── index.html  chat.html               # URL entry — root-এ থাকবে (stable)
├── main-admin-*.html                    # admin hub shells — root-এ থাকবে (stable URL)
├── sw.js  manifest.webmanifest
├── package.json  vercel.json  capacitor.config.json  build.js
├── README.md  USER_MANUAL.md  CLAUDE.md  CAPACITOR.md  AGENTS_MAP.md
│
├── css/                                 # root-এ থাকবে (build.js dirs)
│   └── ... (style.css, print.css, chat-page.css, ...)
├── icons/                               # root-এ থাকবে
│
├── js/                                  # ← মূল reorg এখানে (নিরাপদ)
│   ├── core/        # session, boot, permissions, hijri, install, push, update, native
│   ├── api/         # সব Supabase wrapper: api-shared, api-mdr, api, dept-api, khedmat-api ...
│   ├── shared/      # cross-module UI: admin-nav, chat-*, *-bottom-nav, modals, overlay
│   ├── madrasa/     # mdr-*, madrasa-* সব
│   ├── dept/        # dept-*
│   ├── khedmat/     # khedmat-*
│   └── vendor/      # build-generated (gitignored)
│
├── madrasa/   dept/   khedmat/   admin/  # HTML যেমন আছে (URL stable)
│
├── supabase/
│   ├── migrations/                      # একমাত্র migration source (timestamped)
│   └── functions/send-admin-push/
│
├── android/
├── scripts/                             # dev/build/data tools
│   └── sql/
└── _archive/                            # prototype, sample data, legacy migrations
```

পরিবর্তন আগের চেয়ে: `js/` flat → module subfolder; junk মুছে; এক migration dir; `_archive/`;
root-এ একটা `AGENTS_MAP.md` (নিচে ধাপ ৪)। **HTML আর css/icons folder যেমন আছে তেমন** — churn কম।

---

## ধাপ ১ — Junk + Duplicate cleanup  (ঝুঁকি: শূন্য • আগে করা)

git থেকে untrack + `.gitignore`-এ যোগ করতে হবে:

- `.tmp-analysis/`, `.tmp_admin_bootstrap.sql`
- `.playwright-cli/`
- `scripts/__pycache__/`
- `outputs/` (generated `.xlsx`)
- root-এর `মাতবাখ-মাদরাসা-তামিরাত-৪৭-৪৮.xlsx`

Duplicate migration:
- পুরনো `migrations/` (numbered `012`–`043`) আর `supabase/migrations/` (timestamped) মিলিয়ে দেখা —
  যেগুলো ইতিমধ্যে `supabase/migrations/`-এ আছে (যেমন `dept_expense_receipts`,
  `dept_inventory_no_negative`) সেগুলো বাদ।
- Supabase CLI শুধু `supabase/migrations/` পড়ে → root `migrations/` কে `_archive/legacy-migrations/`-এ
  সরানো (delete নয়, history reference রাখতে)।

**Verify:** `git status` clean; `supabase/migrations/` অপরিবর্তিত; `npm run build` পাস।

---

## ধাপ ২ — `js/` module split  (ঝুঁকি: কম • শুধু HTML script-path বদলায়)

1. `js/`-এ subfolder বানাও: `core/ api/ shared/ madrasa/ dept/ khedmat/`।
2. ফাইল সরানোর নিয়ম (prefix → folder):
   - `mm-session, mm-boot, mm-permissions, mm-hijri, hijri-utils, mm-install, mm-push,
     app-update, capacitor-native, monitor-mode` → `core/`
   - `api-shared (root), api-mdr (root), api, dept-api, khedmat-api,
     madrasa-accounts-api, chat-api` → `api/`
   - `admin-nav, admin-recent-feed, chat-staff-nav, daftar-bottom-nav,
     alumni-integration, mm-student-modal, mm-teacher-modal, mam-overlay` → `shared/`
   - `mdr-*, madrasa-*` (বাকি সব) → `madrasa/`
   - `dept-*` → `dept/` ; `khedmat-*` → `khedmat/`
   - `mm-sample-data, mm-example-data, mm-old-madrasa-import-data` → `_archive/`
3. **root-এর `api-shared.js` ও `api-mdr.js` → `js/api/`** এ আনা। এর জন্য:
   - প্রতিটা HTML-এর reference পাল্টানো,
   - `build.js`-এর line ~188 array (`'api-shared.js','api-mdr.js'`) → নতুন path-এ copy করা
     (অথবা build-এ public root-এ ওই দুটো রাখতে চাইলে আলাদা rule)।
4. সব HTML-এর `<script src="js/X.js">` → `js/<folder>/X.js` আপডেট। nav-helper JS-এর ভেতরের
   path string-ও (`admin-nav.js`, `daftar-bottom-nav.js`, `chat-staff-nav.js`) দেখা।

**কাজের ক্রম (একটা module করে):** আগে `core/`, তারপর `api/`, তারপর module-গুলো — প্রতিবার
`node --check` + একটা পেজ লোড করে দেখা। একসাথে সব নয়।

**Verify (প্রতি sub-step):**
- `node --check js/**/<changed>.js`
- `npm run build` পাস (public/ mirror ঠিক)
- grep দিয়ে নিশ্চিত: পুরনো `js/<file>.js` reference আর কোথাও নেই
- ব্রাউজারে ১টা করে staff + admin পেজ খুলে console error চেক

---

## ধাপ ৩ — `_archive/` আলাদা করা  (ঝুঁকি: কম–মাঝারি)

Prototype/unused HTML যেগুলো production flow-এ নেই, সেগুলো `_archive/`-এ:
- `madrasa/admin-overview-prototype.html`, `madrasa/madrasa-programs-prototype.html`
- **আগে যাচাই:** grep করে নিশ্চিত হও এগুলোর দিকে কোনো live link নেই, তবেই move।
  link থাকলে rename/move করো না — শুধু চিহ্নিত করে রাখো।

**Verify:** moved ফাইলের নামে কোনো `href`/`location.href` অবশিষ্ট নেই (grep)।

---

## ধাপ ৪ — `AGENTS_MAP.md` (এটাই agent-কে সবচেয়ে বেশি সাহায্য করবে)

Root-এ একটা ছোট map ফাইল, যা agent প্রথমেই পড়বে — "কোন কাজ → কোন ফাইল":

```
- Madrasa staff UI .............. madrasa/madrasa-*.html  +  js/madrasa/madrasa-*.js
- Madrasa admin UI .............. madrasa/mdr-admin-*.html +  js/madrasa/mdr-*.js
- Department .................... dept/*.html              +  js/dept/
- Khedmat ....................... khedmat/*.html           +  js/khedmat/
- Admin hub (subdomain) ......... admin/ , main-admin-*.html
- Supabase wrappers ............. js/api/   (RPC নাম পাল্টালে এখানে + migration একসাথে)
- Session/auth/boot ............. js/core/mm-session.js, js/core/mm-boot.js
- DB changes .................... supabase/migrations/ (timestamped, একমাত্র source)
- Build/deploy .................. build.js, vercel.json, capacitor.config.json
```

CLAUDE.md থেকে এই map-এ লিংক দেওয়া হবে।

---

## ধাপ ৫ (ঐচ্ছিক, সবার শেষে) — HTML staff/admin সাব-ফোল্ডার

> অন্য agent-এর `madrasa/staff/` + `madrasa/admin/` ভাগ — দেখতে ভালো, কিন্তু **সবচেয়ে ঝুঁকিপূর্ণ**
> (URL contract + ১৯৫ link)। **প্রয়োজন না হলে করো না।** করলে শর্ত:
- প্রতিটা rename-এ `vercel.json`-এ পুরনো→নতুন `redirects` যোগ (bookmark/PWA না ভাঙতে)।
- সব internal link + nav-helper + `capacitor.config.json` একসাথে আপডেট।
- নতুন কোনো `localStorage` write fallback নয়; existing pattern বজায়।
- আলাদা branch-এ, পুরো click-through QA-র পর merge।

`css → assets/css`, `icons → assets/icons` rename **সুপারিশ করছি না** — `build.js` + সব `<link>`
পাল্টানোর churn আছে, বিনিময়ে বাস্তব সুবিধা নেই।

---

## সারমর্ম — ঝুঁকি অনুযায়ী ক্রম

| ধাপ | কাজ | ঝুঁকি | লাভ |
|----|------|------|-----|
| ১ | junk + duplicate migration cleanup | শূন্য | বড় |
| ২ | `js/` module split | কম | বড় (agent navigation) |
| ৩ | `_archive/` prototype আলাদা | কম | মাঝারি |
| ৪ | `AGENTS_MAP.md` | শূন্য | বড় (agent onboarding) |
| ৫ | HTML staff/admin split (ঐচ্ছিক) | বেশি | কম |

প্রতি ধাপ = আলাদা commit + verify। ১, ৪ আগে করলেই কোডবেস সবচেয়ে দ্রুত "agent-friendly" হয়ে যায়।
```
