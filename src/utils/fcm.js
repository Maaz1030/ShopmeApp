// src/utils/fcm.js
import messaging from '@react-native-firebase/messaging';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';

/**
 * Ask for notification permission (Android 13 / iOS),
 * get FCM token, and store it in Firestore -> shopme_users/{uid}.fcmToken
 */
export const registerFcmToken = async () => {
  try {
    // 🔹 Ask permission where required
    const permission = await messaging().requestPermission();
    const enabled =
      permission === messaging.AuthorizationStatus.AUTHORIZED ||
      permission === messaging.AuthorizationStatus.PROVISIONAL;
    if (!enabled) {
      console.log('Push permission not granted');
      return;
    }

    // 🔹 Get device token
    const token = await messaging().getToken();
    const uid = auth().currentUser?.uid;
    if (!token || !uid) return;

    // 🔹 Save to Firestore
    await firestore().collection('shopme_users').doc(uid).set(
      { fcmToken: token },
      { merge: true },
    );

    console.log('FCM token registered →', token);

    // 🔹 Refresh token if it changes
    messaging().onTokenRefresh(async newToken => {
      await firestore().collection('shopme_users').doc(uid).set(
        { fcmToken: newToken },
        { merge: true },
      );
      console.log('FCM token refreshed →', newToken);
    });
  } catch (err) {
    console.log('registerFcmToken error:', err);
  }
};