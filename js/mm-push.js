/* মাদরাসাতুল মদীনা — mm-push.js
   Web Push subscribe/refresh helper. SW register করে, permission নেয়,
   subscription RPC দিয়ে সংরক্ষণ করে। enablePush() অবশ্যই user gesture
   (বোতাম click) থেকে ডাকতে হবে। */
(function (global) {
  'use strict';

  // VAPID public key (নিরাপদ/public; private key শুধু Edge Function secret-এ)।
  var VAPID_PUBLIC_KEY = 'BEYljfp8CpXqcsnq24Z9DIKXhgcBVfegaFUduxtFDYtC9sreO5k8XlptNgoLRZRRdw_YLm_Mgvxjc7GRxs3ZcTU';

  function urlBase64ToUint8Array(base64String) {
    var padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    var base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
    var raw = atob(base64);
    var out = new Uint8Array(raw.length);
    for (var i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
    return out;
  }

  function supported() {
    return (typeof navigator !== 'undefined') &&
      ('serviceWorker' in navigator) &&
      (typeof window !== 'undefined') &&
      ('PushManager' in window) &&
      ('Notification' in window);
  }

  function permission() {
    return (typeof Notification !== 'undefined') ? Notification.permission : 'denied';
  }

  async function registerSW() {
    if (!('serviceWorker' in navigator)) return null;
    try { return await navigator.serviceWorker.register('/sw.js'); }
    catch (e) { return null; }
  }

  async function saveSub(sub) {
    if (!global.MMSharedAPI || !global.MMSession || !MMSession.getChatPin()) return false;
    var json = sub.toJSON();
    if (!json || !json.endpoint || !json.keys) return false;
    try {
      var res = await MMSharedAPI.pushSubscribe(
        MMSession.getChatActorId() || null,
        MMSession.getChatPin(),
        json.endpoint,
        json.keys.p256dh,
        json.keys.auth,
        MMSession.isAdmin(),
        navigator.userAgent
      );
      return !!(res && res.ok);
    } catch (e) { return false; }
  }

  // user gesture থেকে ডাকুন।
  async function enablePush() {
    if (!supported()) return { ok: false, error: 'unsupported' };
    await registerSW();
    var reg = await navigator.serviceWorker.ready;
    var perm = await Notification.requestPermission();
    if (perm !== 'granted') return { ok: false, error: 'denied' };
    var sub = await reg.pushManager.getSubscription();
    if (!sub) {
      try {
        sub = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
        });
      } catch (e) { return { ok: false, error: 'subscribe_failed' }; }
    }
    var ok = await saveSub(sub);
    return ok ? { ok: true } : { ok: false, error: 'save_failed' };
  }

  // permission আগে থেকেই granted হলে subscription RPC-তে পুনরায় সংরক্ষণ করে
  // (re-login/refresh-এর পর actor-এর সাথে আবার যুক্ত রাখে)। কোনো prompt দেখায় না।
  async function refreshSub() {
    if (!supported() || permission() !== 'granted') return false;
    await registerSW();
    var reg = await navigator.serviceWorker.ready;
    var sub = await reg.pushManager.getSubscription();
    if (sub) return await saveSub(sub);
    return false;
  }

  global.MMPush = {
    supported: supported,
    permission: permission,
    registerSW: registerSW,
    enablePush: enablePush,
    refreshSub: refreshSub
  };
})(window);
