import React, { useEffect } from 'react';
import { StyleSheet, Alert } from 'react-native';
import { Provider } from 'react-redux';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import store from './redux/store';
import AppNavigator from './navigation/AppNavigator';

import messaging from '@react-native-firebase/messaging';
import notifee, { AndroidImportance } from '@notifee/react-native';
import { registerFcmToken } from './utils/fcm';  
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';

export default function App() {
  useEffect(() => {
    async function setupNotifications() {
      //  Ask Notifee permission + create channel
      await notifee.requestPermission();
      await notifee.createChannel({
        id: 'default_channel',
        name: 'Default Notifications',
        importance: AndroidImportance.HIGH,
      });

      //  Register the device token in Firestore
      await registerFcmToken();

      //  Foreground‑message handler
      const unsubscribe = messaging().onMessage(async remoteMessage => {
        const { title, body } = remoteMessage.notification || {};
        Alert.alert(title || 'New Message', body || '');
      });

      // 4️⃣ If user taps a notification (background/quit)
      messaging().onNotificationOpenedApp(remoteMessage => {
        console.log('Opened from background →', remoteMessage.notification);
      });
      messaging()
        .getInitialNotification()
        .then(rm => {
          if (rm) console.log('Opened from quit →', rm.notification);
        });

      return unsubscribe;
    }

    setupNotifications();
  }, []);

  return (
    <SafeAreaProvider style={{ flex: 1 }}>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <Provider store={store}>
          <AppNavigator />
        </Provider>
      </GestureHandlerRootView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({});