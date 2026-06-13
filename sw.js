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
  var url = (event.notification.data && event.notification.data.url) || '/chat.html';
  event.waitUntil((async function () {
    var all = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    for (var i = 0; i < all.length; i++) {
      var c = all[i];
      if ('focus' in c) {
        try { await c.navigate(url); } catch (e) {}
        return c.focus();
      }
    }
    if (self.clients.openWindow) return self.clients.openWindow(url);
  })());
});
