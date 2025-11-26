import React, { useEffect } from 'react';
import { StyleSheet, Alert } from 'react-native';
import { Provider, useDispatch } from 'react-redux';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import store from './redux/store';
import { setUser } from './redux/authSlice'; 
import AppNavigator from './navigation/AppNavigator';

import messaging from '@react-native-firebase/messaging';
import notifee, { AndroidImportance } from '@notifee/react-native';
import { registerFcmToken } from './utils/fcm';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import auth from '@react-native-firebase/auth';
import { useNavigationContainerRef } from '@react-navigation/native';

// --- Component to use hooks (AppContent) ---
const AppContent = () => {
  const navigationRef = useNavigationContainerRef();
  const dispatch = useDispatch();

  useEffect(() => {
    async function setupNotifications() {
      try {
        await notifee.requestPermission();
        await notifee.createChannel({
          id: 'default_channel',
          name: 'Default Notifications',
          importance: AndroidImportance.HIGH,
        });

        await registerFcmToken();

        const unsubscribeMsg = messaging().onMessage(async remoteMessage => {
          const { title, body } = remoteMessage.notification || {};
          Alert.alert(title || 'New Message', body || '');
        });

        messaging().onNotificationOpenedApp(remoteMessage => {
          console.log('Opened from background →', remoteMessage.notification);
        });

        messaging()
          .getInitialNotification()
          .then(rm => {
            if (rm) console.log('Opened from quit →', rm.notification);
          });

        return unsubscribeMsg;
      } catch (err) {
        console.log('Notification setup error:', err);
      }
    }

    setupNotifications();
  }, []); //   Global auth listener

  useEffect(() => {
    const unsubscribeAuth = auth().onAuthStateChanged(firebaseUser => {
      if (firebaseUser) {
        //  FIX: ONLY dispatch the user state.
        
        dispatch(setUser(firebaseUser));
      } else {
        // User logged out → clear Redux and redirect to Login screen
        dispatch(setUser(null));

        // This reset logic is correct for LOGOUT (no user found)
        if (navigationRef.isReady()) {
          try {
            navigationRef.reset({
              index: 0,
              routes: [{ name: 'Login' }],
            });
          } catch (err) {
            console.log('Navigation reset error:', err);
          }
        }
      }
    });

    return unsubscribeAuth; // cleanup listener
  }, [navigationRef, dispatch]);

  return <AppNavigator navigationRef={navigationRef} />;
};
// --- End AppContent component ---

export default function App() {
  return (
    <SafeAreaProvider style={{ flex: 1 }}>
   
      <GestureHandlerRootView style={{ flex: 1 }}>
        
        <Provider store={store}>
           <AppContent />
        </Provider>
      
      </GestureHandlerRootView>
    
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({});
