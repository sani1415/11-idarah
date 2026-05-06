/**
 * chat.html-এ স্টাফের নিচের নেভ — সংশ্লিষ্ট পোর্টালের bottom-nav-এর একই আইটেম।
 */
(function (global) {
  'use strict';

  function chatActive() {
    return (
      '<div class="nav-item active" aria-current="page">' +
      '<span class="nav-icon" aria-hidden="true"><svg class="nav-svg" viewBox="0 0 24 24" fill="none"><path d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg></span>' +
      '<span class="nav-label">বার্তা</span></div>'
    );
  }

  function linkDept(href, svgInner, label) {
    return (
      '<a class="nav-item" href="' + href + '">' +
      '<span class="nav-icon" aria-hidden="true"><svg class="nav-svg" viewBox="0 0 24 24" fill="none">' + svgInner + '</svg></span>' +
      '<span class="nav-label">' + label + '</span></a>'
    );
  }

  function linkTeacher(href, svgInner, label, aria) {
    var a = aria ? ' aria-label="' + aria + '"' : '';
    return '<a class="nav-item" href="' + href + '"' + a + '><svg class="nav-svg" viewBox="0 0 24 24" fill="none">' + svgInner + '</svg><span>' + label + '</span></a>';
  }

  function linkDaftar(href, svgInner, label) {
    return (
      '<a class="nav-item" href="' + href + '">' +
      '<span class="nav-icon" aria-hidden="true"><svg class="nav-svg" viewBox="0 0 24 24" fill="none">' + svgInner + '</svg></span>' +
      '<span class="nav-label">' + label + '</span></a>'
    );
  }

  function navDept() {
    return (
      linkDept('dept/dept-staff.html#txn', '<path d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>', 'হিসাব') +
      linkDept('dept/dept-staff.html#products', '<path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>', 'পণ্য') +
      linkDept('dept/dept-staff.html#inv', '<path d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>', 'মজুদ') +
      linkDept('dept/dept-staff.html#report', '<path d="M4 19V5m0 14h16M8 16V9m4 7V6m4 10v-4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>', 'রিপোর্ট') +
      chatActive()
    );
  }

  function navTeacher() {
    return (
      linkTeacher('madrasa/madrasa-class.html', '<path d="M3 9.5L12 3l9 6.5V20a1.5 1.5 0 01-1.5 1.5h-5V14.5h-5V21.5H4.5A1.5 1.5 0 013 20V9.5z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/>', 'হোম', 'হোম') +
      linkTeacher('madrasa/madrasa-class.html?tab=kitab', '<path d="M4 19.5A2.5 2.5 0 016.5 17H20" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>', 'কিতাব', null) +
      linkTeacher('madrasa/madrasa-class.html?tab=log', '<path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/><path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>', 'লগ', null) +
      linkTeacher('madrasa/madrasa-class-exams.html', '<path d="M4 19.5A2.5 2.5 0 016.5 17H20" stroke="currentColor" stroke-width="1.5"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z" stroke="currentColor" stroke-width="1.5"/><path d="M9 7h6M9 12h4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>', 'পরীক্ষা', 'পরীক্ষা ও ফল') +
      chatActive()
    );
  }

  function navDaftar() {
    return (
      linkDaftar('madrasa/madrasa-home.html', '<path d="M3 10.5L12 3l9 7.5V21a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1V10.5z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>', 'মাদ্রাসা') +
      linkDaftar('madrasa/madrasa-daftar.html', '<path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>', 'হাজিরা') +
      linkDaftar('madrasa/madrasa-daftar.html#fees', '<path d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>', 'হিসাব') +
      linkDaftar('madrasa/madrasa-yearend.html', '<path d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>', 'বর্ষ') +
      chatActive()
    );
  }

  function linkLib(href, svgInner, label, title) {
    var t = title ? ' title="' + title + '"' : '';
    return (
      '<a class="nav-item" href="' + href + '"' + t + '>' +
      '<span class="nav-icon" aria-hidden="true"><svg class="nav-svg" viewBox="0 0 24 24" fill="none">' + svgInner + '</svg></span>' +
      '<span class="nav-label">' + label + '</span></a>'
    );
  }

  function navLibrary() {
    return (
      linkLib('madrasa/madrasa-library.html', '<path d="M4 19.5A2.5 2.5 0 016.5 17H20" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>', 'বই তালিকা', null) +
      linkLib('madrasa/madrasa-library.html#issued', '<path d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V12.75a9 9 0 00-9-9z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>', 'ইস্যু', null) +
      chatActive()
    );
  }

  function navHifz() {
    return (
      linkLib('madrasa/madrasa-hifz.html', '<path d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0111.186 0z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>', 'হোম', null) +
      chatActive()
    );
  }

  function navAlumni() {
    return (
      linkLib('madrasa/madrasa-alumni.html', '<path d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>', 'তালিকা', null) +
      chatActive()
    );
  }

  function navKhedmat() {
    return (
      linkDept('khedmat/khedmat-staff.html#ben', '<path d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>', 'মাখদুম') +
      linkDept('khedmat/khedmat-staff.html#fin', '<path d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>', 'তহবিল') +
      linkDept('khedmat/khedmat-staff.html#log', '<path d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V12.75a9 9 0 00-9-9z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>', 'দৈনিক লগ') +
      chatActive()
    );
  }

  global.MMChatStaffNav = {
    getInnerHtml: function (role, deptRole) {
      if (deptRole === 'dept') return navDept();
      if (role === 'teacher') return navTeacher();
      if (role === 'daftar') return navDaftar();
      if (role === 'library') return navLibrary();
      if (role === 'hifz') return navHifz();
      if (role === 'alumni') return navAlumni();
      if (role === 'khedmat') return navKhedmat();
      return navHifz();
    },
  };
})(typeof window !== 'undefined' ? window : this);
