/* Capacitor native shell helpers — শুধু Android/iOS app WebView-এ চলে। */
(function () {
  var Cap = window.Capacitor;
  if (!Cap || typeof Cap.isNativePlatform !== 'function' || !Cap.isNativePlatform()) return;

  var App = window.capacitorApp && window.capacitorApp.App;
  if (App && App.addListener) {
    App.addListener('backButton', function (info) {
      if (info && info.canGoBack) {
        window.history.back();
        return;
      }
      if (App.minimizeApp) {
        App.minimizeApp();
      } else if (App.exitApp) {
        App.exitApp();
      }
    });
  }

  var StatusBar = window.capacitorStatusBar && window.capacitorStatusBar.StatusBar;
  if (StatusBar) {
    if (StatusBar.setOverlaysWebView) {
      StatusBar.setOverlaysWebView({ overlay: false }).catch(function () {});
    }
    if (StatusBar.setBackgroundColor) {
      StatusBar.setBackgroundColor({ color: '#f7f1e6' }).catch(function () {});
    }
    if (StatusBar.setStyle) {
      StatusBar.setStyle({ style: 'DARK' }).catch(function () {});
    }
  }
})();
