import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Animated,
  StyleSheet,
  StatusBar,
} from 'react-native';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import { useDispatch } from 'react-redux';
import { setUser } from '../../redux/authSlice';
import colors from '../../utils/colors';

const SplashScreen = ({ navigation }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const dispatch = useDispatch();
  const [hasNavigated, setHasNavigated] = useState(false); //  prevent double navigation

  useEffect(() => {
    // Animate logo fade-in
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 1000,
      useNativeDriver: true,
    }).start();

    // Firebase auth state listener
    const unsubscribe = auth().onAuthStateChanged(async (currentUser) => {
      if (hasNavigated) return; //  ignore if already navigated once

      if (currentUser) {
        try {
          // Fetch Firestore user document
          const doc = await firestore().collection('shopme_users').doc(currentUser.uid).get();

          let userData;
          if (doc.exists) {
            userData = doc.data();
          } else {
            userData = {
              uid: currentUser.uid,
              name: currentUser.displayName || '',
              email: currentUser.email,
              photoURL: currentUser.photoURL || '',
            };
          }

          // Update Redux state
          dispatch(setUser(userData));

          // Navigate to main app after  animation
          setTimeout(() => {
            if (!hasNavigated) {
              setHasNavigated(true);
              navigation.reset({
                index: 0,
                routes: [{ name: 'MainTabs' }],
              });
            }
          }, 1200);
        } catch (error) {
          console.log('Auto-login error:', error.message);
          setTimeout(() => {
            if (!hasNavigated) {
              setHasNavigated(true);
              navigation.replace('Login');
            }
          }, 1200);
        }
      } else {
        // Not logged in
        setTimeout(() => {
          if (!hasNavigated) {
            setHasNavigated(true);
            navigation.replace('Login');
          }
        }, 1200);
      }
    });

    return () => {
      unsubscribe();
      setHasNavigated(true); //  stop future navigation after unmount
    };
  }, [fadeAnim, navigation, dispatch, hasNavigated]);

  return (
    <View style={styles.container}>
      <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />
      <Animated.Image
        source={require('../../assets/logo.png')}
        style={[styles.logo, { opacity: fadeAnim }]}
        resizeMode="contain"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.primary || '#000',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    width: 160,
    height: 160,
  },
});

export default SplashScreen;
