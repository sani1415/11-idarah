/**
 * জিম্মাদার নেভ — স্লাইডিং পিল ইন্ডিকেটর
 * .main-nav-এ স্বয়ংক্রিয়ভাবে কাজ করে।
 */
(function () {
  'use strict';

  function init() {
    var nav = document.querySelector('.main-nav');
    if (!nav || nav.querySelector('.main-nav-pill')) return;

    var pill = document.createElement('span');
    pill.className = 'main-nav-pill';
    pill.setAttribute('aria-hidden', 'true');
    nav.insertBefore(pill, nav.firstChild);

    var active = nav.querySelector('.main-nav-btn.is-active');
    if (active) {
      place(pill, active);
      /* দুই ফ্রেম পরে transition চালু — প্রথম placement অ্যানিমেশন ছাড়া */
      requestAnimationFrame(function () {
        requestAnimationFrame(function () {
          nav.classList.add('pill-active');
        });
      });
    }

    nav.querySelectorAll('.main-nav-btn').forEach(function (btn) {
      btn.addEventListener('click', function (e) {
        var href = btn.getAttribute('href');
        if (!href || btn.classList.contains('is-active')) return;
        e.preventDefault();
        /* active সরিয়ে নতুন আইটেমে দাও যাতে রঙও সাথে যায় */
        var prev = nav.querySelector('.is-active');
        if (prev) prev.classList.remove('is-active');
        btn.classList.add('is-active');
        place(pill, btn);
        /* পুরনো content যেন ঝুলে না থাকে: ওয়ার্ম না হলে সাথে সাথে লোডিং কভার
           দেখাই, তারপর সরাসরি navigate (কৃত্রিম বিলম্ব ছাড়া)। */
        showNavCover();
        location.href = href;
      });
    });
  }

  function isWarm() {
    return !!(window.MMSession && MMSession.isAppDataWarm && MMSession.isAppDataWarm());
  }

  function showNavCover() {
    if (isWarm()) return;
    try { sessionStorage.setItem('mm_nav_loading', '1'); } catch (e) {}
    if (window.MMLoading && MMLoading.show) MMLoading.show();
  }

  function place(pill, btn) {
    var nr = pill.parentElement.getBoundingClientRect();
    var br = btn.getBoundingClientRect();
    pill.style.left   = (br.left   - nr.left) + 'px';
    pill.style.width  = br.width             + 'px';
    pill.style.top    = (br.top    - nr.top)  + 'px';
    pill.style.height = br.height            + 'px';
  }

  /* permission-check শেষ হওয়ার পরে run করতে rAF ব্যবহার */
  if (document.readyState !== 'loading') {
    requestAnimationFrame(init);
  } else {
    document.addEventListener('DOMContentLoaded', function () {
      requestAnimationFrame(init);
    });
  }
})();
