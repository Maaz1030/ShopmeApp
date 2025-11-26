
import React from 'react';
import { StatusBar } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';
import { useSelector } from 'react-redux';
import auth from '@react-native-firebase/auth'; 
import colors from '../utils/colors';

// Screens
import LoginScreen from '../screens/auth/Login';
import SignUpScreen from '../screens/auth/Signup';
import ForgotPasswordScreen from '../screens/auth/ForgotPassword';
import HomeScreen from '../screens/main/HomeScreen';
import SellScreen from '../screens/main/SellScreen';
import MessagesList from '../screens/main/chatting/MessagesList';
import ProfileScreen from '../screens/main/profile/ProfileScreen';
import ProductDetailScreen from '../screens/main/ProductDetailScreen';
import ChatScreen from '../screens/main/chatting/ChatScreen';
import SettingsScreen from '../screens/main/SettingsScreen';
import EditProfileScreen from '../screens/main/EditProfile';
import SplashScreen from '../screens/main/SplashScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

/* ---------------- TAB NAV (unchanged) -------------------- */
function MainTabs() {
  const insets = useSafeAreaInsets();
  const darkMode = useSelector(state => state.auth.darkMode);
  const theme = darkMode ? colors.dark : colors.light;

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarHideOnKeyboard: true,
        tabBarActiveTintColor: theme.accent,
        tabBarInactiveTintColor: theme.secondaryText,
        tabBarStyle: {
          backgroundColor: theme.surface,
          borderTopColor: theme.border,
          borderTopWidth: 0.6,
          height: 60 + insets.bottom,
          paddingBottom: insets.bottom || 6,
          paddingTop: 6,
        },
        tabBarIcon: ({ color, size }) => {
          let iconName = 'home-outline';
          if (route.name === 'Home') iconName = 'home-outline';
          if (route.name === 'Sell') iconName = 'add-circle-outline';
          if (route.name === 'Messages') iconName = 'chatbubble-outline';
          if (route.name === 'Profile') iconName = 'person-outline';
          return <Icon name={iconName} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Sell" component={SellScreen} />
      <Tab.Screen name="Messages" component={MessagesList} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}


/* ------------- MAIN APP NAVIGATOR ------------------------ */

export default function AppNavigator({ navigationRef }) {
  const { user, darkMode } = useSelector(state => state.auth);
  const theme = darkMode ? colors.dark : colors.light;

  
  // Fallback to Firebase’s auth user if Redux user is not yet set
  const firebaseUser = auth().currentUser;
  const isUserLoggedIn = Boolean(user?.uid || firebaseUser?.uid);

  return (
    <NavigationContainer ref={navigationRef}>
      <StatusBar
        barStyle={darkMode ? 'light-content' : 'dark-content'}
        backgroundColor={theme.primaryBackground}
        animated={true}
      />

      {/* use isUserLoggedIn instead of Redux user */}
      {isUserLoggedIn ? (
        <Stack.Navigator
          screenOptions={{ headerShown: false, animation: 'slide_from_right' }}
        >
          <Stack.Screen name="MainTabs" component={MainTabs} />
          <Stack.Screen name="Settings" component={SettingsScreen} />
          <Stack.Screen name="ProductDetail" component={ProductDetailScreen} />
          <Stack.Screen name="ChatScreen" component={ChatScreen} />
          <Stack.Screen name="EditProfile" component={EditProfileScreen} />
        </Stack.Navigator>
      ) : (
        <Stack.Navigator
          screenOptions={{ headerShown: false, animation: 'fade' }}
        >
          <Stack.Screen name="Splash" component={SplashScreen} />
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="SignUp" component={SignUpScreen} />
          <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
        </Stack.Navigator>
      )}
    </NavigationContainer>
  );
}