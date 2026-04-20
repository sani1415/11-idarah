# 🏫 Idarah Project UI Upgrade Instructions (Frontend Only)

## 🎯 Objective

Upgrade the existing **11-idarah prototype** by integrating advanced features from the old **1-madrasah project**, focusing ONLY on:

* UI structure
* frontend logic
* user flow
* visual system

⚠️ DO NOT implement backend/database logic
⚠️ DO NOT change core architecture
⚠️ Only simulate data if needed

---

# 🧠 Core Concept

You must maintain this separation:

* **Admin Hub = Overview + Alerts + Navigation**
* **Madrasa Admin = Operational Work Area**

---

# 📁 Target Project Structure

Main files to modify:

* `admin-hub.html`
* `madrasa/madrasa-admin.html`
* `madrasa/madrasa-staff.html`
* `js/api.js` (only for mock data functions)
* `css/style.css`

---

# 🧩 PHASE 1 — HIGH PRIORITY FEATURES

---

## ✅ 1. Attendance System (UI Only)

### 📍 Where to implement:

* `madrasa-admin.html` → Class Detail → New Tab: **"উপস্থিতি"**
* `madrasa-staff.html`
* `admin-hub.html` (summary alert only)

---

### 🎨 UI Requirements

Create a new tab:

```
Tabs:
[ ছাত্র ] [ উপস্থিতি ] [ কিতাব ] [ খুলুক ] [ লগ ] [ বেতন ]
```

---

### 📋 Attendance Screen Layout

```
Date Selector: [ < 19 Apr 2026 > ]

Summary:
Present: 25 | Absent: 5 | Not Marked: 2

Student List:
- Abdullah   [Present] [Absent] [Leave]
- Rahim      [Present] [Absent] [Leave]

[ Save Attendance ]
[ Copy Previous Day ]
```

---

### ⚙️ Behavior (Frontend Only)

* Toggle buttons for attendance state
* Store temporary state in JS (array/object)
* "Copy Previous Day" duplicates dummy data
* Prevent future date selection (UI level only)

---

## ✅ 2. Teacher Logs System

---

### 📍 Where:

* `madrasa-admin.html` → Class Detail → Tab: **লগ**
* `madrasa-staff.html`

---

### 📋 UI Layout

```
[ + নতুন লগ ]

Log Feed:
- ⚠️ Abdullah was absent without reason
- ✅ Karim improved behavior
- 🔴 Needs follow-up

Filter:
[ Today ] [ This Week ] [ Important ]
```

---

### ⚙️ Behavior

* Add log (modal)
* Tag:

  * normal
  * important
  * follow-up
* Store in temporary JS array

---

## ✅ 3. Admin Hub Pending Panel

---

### 📍 Modify: `admin-hub.html`

Add section:

```
⏳ Pending Work

- 3 attendance pending
- 5 unread messages
- 2 logs need follow-up
- 4 documents pending

[ View All ]
```

---

# 🧩 PHASE 2 — CORE ACADEMIC FEATURES

---

## ✅ 4. Education Progress (Kitab System)

---

### 📍 Where:

* `madrasa-admin.html` → Class Detail → Tab: **কিতাব অগ্রগতি**
* `madrasa-staff.html`

---

### 📋 UI Layout

```
Student List:

Abdullah
Book: Noorani Qaida
Progress: 45%

[ Update ]

Karim
Book: Hifz Juz 1
Progress: 80%
```

---

### ⚙️ Behavior

* Progress bar (visual only)
* Editable value (0–100)
* Store in JS

---

## ✅ 5. Husnul Khuluk System

---

### 📍 Where:

* Class Detail → Tab: **খুলুক**
* Student Detail

---

### 📋 UI Layout

```
Abdullah
Adab: ⭐⭐⭐⭐☆
Cleanliness: ⭐⭐⭐☆☆
Behavior: ⭐⭐⭐⭐⭐

[ Update ]
```

---

### ⚙️ Behavior

* Rating input (1–5)
* Show average
* Highlight low score (<3)

---

# 🧩 PHASE 3 — ADVANCED UI

---

## ✅ 6. Student Detail Upgrade

---

### 📍 Modify student detail screen

---

### 📋 Add Sections:

#### 🧾 Summary Cards

```
Attendance: 92%
Fee: Due
Khuluk: Good
```

---

#### 🎖️ Responsibility Badge

```
Role: Class Monitor
```

---

#### 📄 Documents Tab

```
- Birth Certificate (Pending)
- ID Card (Approved)
```

---

---

## ✅ 7. Class Card Enhancement

---

### 📍 Modify class cards

---

### Add:

```
Students: 30
Present: 28 | Absent: 2
⚠️ Attendance Pending
💰 Fee Due: 5
```

---

### Add badge system:

* green = normal
* orange = pending
* red = critical

---

---

## ✅ 8. Madrasa Staff Page Upgrade

---

### 📍 `madrasa-staff.html`

---

### Layout:

```
My Classes:

Class 3
- Students: 30
- Today: 2 absent
- [ Take Attendance ]
- [ Add Log ]

Quick Panel:
- Add Log
- Update Progress
- Mark Attendance
```

---

---

# 🎨 UI RULES

---

## 🔹 Cards

Use cards for:

* summary
* class
* module

---

## 🔹 Lists

Use lists for:

* logs
* students
* activity

---

## 🔹 Tabs

Use tabs for:

* class detail
* student detail

---

## 🔹 Badges

Use badges for:

* responsibility
* status
* alerts

---

---

# 📱 MOBILE RULES

---

* 2 cards per row max
* No wide tables
* Use vertical stacking
* Use floating button for "Add Student"

---

---

# ⚠️ IMPORTANT RESTRICTIONS

---

❌ Do NOT:

* add backend
* create API calls
* redesign navigation system
* break existing layout

---

✅ DO:

* extend existing UI
* reuse structure
* keep mobile-first design
* simulate data with JS

---

---

# 🚀 FINAL GOAL

After completing all phases:

The system should behave like:

* A real madrasa management UI
* Fully interactive frontend
* Ready for backend integration later

---

# 📌 EXECUTION STRATEGY

Follow this order:

1. Attendance UI
2. Logs system
3. Admin Hub pending panel
4. Kitab progress
5. Khuluk system
6. Student detail upgrade
7. Class card enhancement
8. Staff page upgrade

---

# 🧾 END

This is a frontend-only UI upgrade plan.
Focus on usability, clarity, and workflow.
