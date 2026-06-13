/* মাদরাসাতুল মদীনা — service worker
   উদ্দেশ্য: Web Push notification + app-icon badge। ইচ্ছাকৃতভাবে কোনো asset
   cache করে না, যাতে বিদ্যমান no-cache HTML/আপডেট কৌশল না ভাঙে। */

self.addEventListener('install', function () {
  self.skipWaiting();
});

self.addEventListener('activate', function (event) {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('push', function (event) {
  var data = {};
  try { data = event.data ? event.data.json() : {}; } catch (e) { data = {}; }
  var title = data.title || 'নতুন বার্তা';
  var options = {
    body: data.body || '',
    icon: '/admin/icons/icon.svg',
    tag: data.tag || 'admin-chat',
    renotify: true,
    data: { url: data.url || '/chat.html' }
  };
  event.waitUntil((async function () {
    await self.registration.showNotification(title, options);
    try {
      if (self.navigator && self.navigator.setAppBadge) {
        if (typeof data.count === 'number' && data.count > 0) {
          await self.navigator.setAppBadge(data.count);
        } else {
          await self.navigator.setAppBadge();
        }
      }
    } catch (e) {}
  })());
});

self.addEventListener('notificationclick', function (event) {
  event.notification.close();
  var target = (event.notification.data && event.notification.data.url) || '/chat.html';
  var absolute = new URL(target, self.location.origin).href;
  event.waitUntil((async function () {
    var all = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    // বিদ্যমান কোনো window থাকলে সেটাকেই সামনে আনি (focus সবচেয়ে গুরুত্বপূর্ণ)।
    for (var i = 0; i < all.length; i++) {
      var c = all[i];
      if ('focus' in c) {
        try { if ('navigate' in c && c.url !== absolute) await c.navigate(absolute); } catch (e) {}
        try { return await c.focus(); } catch (e) {}
      }
    }
    // কোনো window খোলা না থাকলে নতুন করে অ্যাপ খুলি (absolute URL দিয়ে)।
    if (self.clients.openWindow) {
      try { return await self.clients.openWindow(absolute); } catch (e) {}
    }
  })());
});
