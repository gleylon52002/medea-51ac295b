import { Capacitor } from '@capacitor/core';
import { App } from '@capacitor/app';
import { StatusBar, Style } from '@capacitor/status-bar';
import { SplashScreen } from '@capacitor/splash-screen';

export const initNativeApp = () => {
  if (!Capacitor.isNativePlatform()) return;

  // Status bar
  StatusBar.setStyle({ style: Style.Dark }).catch(() => {});
  StatusBar.setBackgroundColor({ color: '#2d4a3e' }).catch(() => {});

  // Splash screen - auto hide after app loads
  SplashScreen.hide().catch(() => {});

  // Hardware back button handling
  App.addListener('backButton', ({ canGoBack }) => {
    if (canGoBack) {
      window.history.back();
    } else {
      App.exitApp();
    }
  });
};
