/* মাদরাসাতুল মদীনা — mm-install.js
   অ্যাপ install না থাকলে খোলার সময় একটি install banner দেখায়।
   - সব পেজে service worker register করে (installability + push)।
   - Android/Chromium: beforeinstallprompt ধরে আসল install prompt।
   - iOS Safari: programmatic prompt নেই, তাই সংক্ষিপ্ত নির্দেশনা দেখায়।
   admin ও মূল — দুই অ্যাপেই কাজ করে (যে origin-এ খোলা হবে সেখানে)। */
(function () {
  'use strict';
  if (typeof window === 'undefined' || typeof navigator === 'undefined') return;

  // সব পেজে SW register (idempotent)।
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', function () {
      navigator.serviceWorker.register('/sw.js').catch(function () {});
    });
  }

  function isStandalone() {
    try {
      return (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) ||
        window.navigator.standalone === true;
    } catch (e) { return false; }
  }

  var DISMISS_KEY = 'mm_install_dismissed_until';
  function dismissedRecently() {
    try {
      var until = parseInt(localStorage.getItem(DISMISS_KEY) || '0', 10);
      return !!until && Date.now() < until;
    } catch (e) { return false; }
  }
  function snooze(days) {
    try { localStorage.setItem(DISMISS_KEY, String(Date.now() + days * 86400000)); } catch (e) {}
  }

  function isIos() { return /iphone|ipad|ipod/i.test(navigator.userAgent || ''); }
  function isIosSafari() {
    var ua = navigator.userAgent || '';
    return isIos() && /safari/i.test(ua) && !/(crios|fxios|edgios|opios)/i.test(ua);
  }

  var deferredPrompt = null;

  function removeBanner() {
    var b = document.getElementById('mm-install-bar');
    if (b && b.parentNode) b.parentNode.removeChild(b);
  }

  function injectStyleOnce() {
    if (document.getElementById('mm-install-style')) return;
    var st = document.createElement('style');
    st.id = 'mm-install-style';
    st.textContent =
      '#mm-install-bar{position:fixed;left:12px;right:12px;bottom:calc(14px + env(safe-area-inset-bottom));z-index:2147483600;' +
      'display:flex;align-items:center;gap:12px;background:#fffdf8;border:1px solid rgba(201,149,42,.4);' +
      'border-radius:16px;padding:12px 14px;box-shadow:0 10px 30px rgba(26,18,8,.22);max-width:520px;margin:0 auto;' +
      "font-family:'Tiro Bangla',serif;animation:mmInstallUp .28s ease}" +
      '@keyframes mmInstallUp{from{transform:translateY(16px);opacity:0}to{transform:none;opacity:1}}' +
      '#mm-install-bar .mmi-ico{flex:0 0 auto;width:40px;height:40px;border-radius:12px;display:flex;align-items:center;' +
      'justify-content:center;background:linear-gradient(145deg,#1a1208,#3d2e14);color:#e7c25a;font-size:20px}' +
      '#mm-install-bar .mmi-txt{flex:1;min-width:0}' +
      '#mm-install-bar .mmi-title{font-size:14px;font-weight:700;color:#3d2e14;line-height:1.2}' +
      '#mm-install-bar .mmi-sub{font-size:11px;color:#6b5a3e;line-height:1.35;margin-top:2px}' +
      '#mm-install-bar .mmi-actions{flex:0 0 auto;display:flex;flex-direction:column;gap:6px}' +
      '#mm-install-bar button{font-family:inherit;cursor:pointer;border-radius:10px;font-size:12px;font-weight:700;' +
      'padding:8px 12px;border:1px solid transparent;white-space:nowrap}' +
      '#mm-install-bar .mmi-yes{background:linear-gradient(135deg,#c9952a,#9a6a21);color:#fff}' +
      '#mm-install-bar .mmi-no{background:transparent;color:#6b5a3e;padding:4px 8px}';
    (document.head || document.documentElement).appendChild(st);
  }

  function showBanner(opts) {
    if (!document.body || document.getElementById('mm-install-bar')) return;
    injectStyleOnce();
    var bar = document.createElement('div');
    bar.id = 'mm-install-bar';
    bar.setAttribute('role', 'dialog');
    bar.setAttribute('aria-label', 'অ্যাপ ইনস্টল');
    bar.innerHTML =
      '<div class="mmi-ico">📲</div>' +
      '<div class="mmi-txt"><div class="mmi-title">অ্যাপটি ইনস্টল করুন</div>' +
      '<div class="mmi-sub">' + opts.sub + '</div></div>' +
      '<div class="mmi-actions">' +
      (opts.showInstall ? '<button class="mmi-yes" id="mmi-yes">ইনস্টল</button>' : '') +
      '<button class="mmi-no" id="mmi-no">পরে</button></div>';
    document.body.appendChild(bar);
    var no = document.getElementById('mmi-no');
    if (no) no.onclick = function () { removeBanner(); snooze(7); };
    var yes = document.getElementById('mmi-yes');
    if (yes && opts.onInstall) yes.onclick = opts.onInstall;
  }

  async function doInstall() {
    if (!deferredPrompt) { removeBanner(); return; }
    removeBanner();
    try {
      deferredPrompt.prompt();
      await deferredPrompt.userChoice;
    } catch (e) {}
    deferredPrompt = null;
  }

  // Android / Chromium — আসল install prompt।
  window.addEventListener('beforeinstallprompt', function (e) {
    e.preventDefault();
    deferredPrompt = e;
    if (isStandalone() || dismissedRecently()) return;
    setTimeout(function () {
      showBanner({
        sub: 'হোম স্ক্রিনে যোগ করুন — দ্রুত খুলুন ও নোটিফিকেশন পান।',
        showInstall: true,
        onInstall: doInstall
      });
    }, 1500);
  });

  window.addEventListener('appinstalled', function () {
    deferredPrompt = null;
    removeBanner();
    try { localStorage.removeItem(DISMISS_KEY); } catch (e) {}
  });

  // iOS Safari — programmatic prompt নেই, তাই নির্দেশনা।
  if (isIosSafari() && !isStandalone() && !dismissedRecently()) {
    var run = function () {
      setTimeout(function () {
        showBanner({
          sub: 'Share ⬆️ → “Add to Home Screen” চাপুন।',
          showInstall: false,
          onInstall: null
        });
      }, 1800);
    };
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', run);
    else run();
  }
})();
