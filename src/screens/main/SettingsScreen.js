import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Switch,
  Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useSelector, useDispatch } from 'react-redux';
import {
  toggleDarkMode,
  toggleNotifications,
  logoutUser,
} from '../../redux/authSlice';
import colors from '../../utils/colors';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const SettingsScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const dispatch = useDispatch();
  const darkMode = useSelector(s => s.auth.darkMode);
  const notifications = useSelector(s => s.auth.notificationsEnabled);
  const theme = darkMode ? colors.dark : colors.light;

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to log out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            try {
              //  Sign out from Firebase
              await dispatch(logoutUser()).unwrap();

              // Reset navigation stack to go directly to Login
              navigation.reset({
                index: 0,
                routes: [{ name: 'Login' }],
              });
            } catch (error) {
              console.log('Logout error:', error);
              Alert.alert('Error', 'Error while logging out.');
            }
          },
        },
      ],
      { cancelable: true },
    );
  };

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: theme.primaryBackground,
          paddingTop: insets.top,
          paddingBottom: insets.bottom + 10,
        },
      ]}
    >
      {/* ---------- Header ---------- */}
      <View
        style={[
          styles.headerBar,
          {
            borderColor: theme.border,
            backgroundColor: theme.primaryBackground,
          },
        ]}
      >
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
          activeOpacity={0.7}
        >
          <Icon name="arrow-back" size={22} color={theme.primaryText} />
        </TouchableOpacity>

        <Text
          style={[styles.headerTitle, { color: theme.primaryText }]}
          numberOfLines={1}
        >
          Settings
        </Text>

        {/* Invisible spacer to balance layout */}
        <View style={{ width: 22 }} />
      </View>

      {/* ---------- Edit Profile ---------- */}
      <TouchableOpacity
        style={[
          styles.row,
          { backgroundColor: theme.surface, borderColor: theme.border },
        ]}
        activeOpacity={0.8}
        onPress={() => navigation.navigate('EditProfile')}
      >
        <View style={styles.rowLeft}>
          <Icon name="person-circle-outline" size={22} color={theme.accent} />
          <Text style={[styles.rowText, { color: theme.primaryText }]}>
            Edit Profile
          </Text>
        </View>
        <Icon name="chevron-forward" size={20} color={theme.secondaryText} />
      </TouchableOpacity>

      {/* ---------- Dark Mode ---------- */}
      <View
        style={[
          styles.row,
          { backgroundColor: theme.surface, borderColor: theme.border },
        ]}
      >
        <View style={styles.rowLeft}>
          <Icon name="moon-outline" size={22} color={theme.accent} />
          <Text style={[styles.rowText, { color: theme.primaryText }]}>
            Dark Mode
          </Text>
        </View>
        <Switch
          value={darkMode}
          onValueChange={() => dispatch(toggleDarkMode())}
          trackColor={{ false: theme.border, true: theme.accent }}
          thumbColor={darkMode ? '#fff' : '#f4f3f4'}
        />
      </View>

      {/* ---------- Notifications ---------- */}
      <View
        style={[
          styles.row,
          { backgroundColor: theme.surface, borderColor: theme.border },
        ]}
      >
        <View style={styles.rowLeft}>
          <Icon name="notifications-outline" size={22} color={theme.accent} />
          <Text style={[styles.rowText, { color: theme.primaryText }]}>
            Notifications
          </Text>
        </View>
        <Switch
          value={notifications}
          onValueChange={() => dispatch(toggleNotifications())}
          trackColor={{ false: theme.border, true: theme.accent }}
          thumbColor={notifications ? '#fff' : '#f4f3f4'}
        />
      </View>

      {/* ---------- Logout ---------- */}
      <TouchableOpacity
        style={[
          styles.row,
          { backgroundColor: theme.surface, borderColor: theme.border },
        ]}
        activeOpacity={0.8}
        onPress={handleLogout}
      >
        <View style={styles.rowLeft}>
          <Icon name="log-out-outline" size={22} color={theme.accent} />
          <Text style={[styles.rowText, { color: theme.primaryText }]}>
            Logout
          </Text>
        </View>
        <Icon name="chevron-forward" size={20} color={theme.secondaryText} />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 16 },
  // centered header
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between', // spaces left button, title, spacer
    borderBottomWidth: 1,
    paddingVertical: 10,
    marginBottom: 30,
  },
  backButton: { padding: 4 },
  headerTitle: {
    fontSize: 22,
    fontWeight: '600',
    textAlign: 'center',
    flex: 1,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 18,
    marginBottom: 14,
    borderWidth: 1,
  },
  rowLeft: { flexDirection: 'row', alignItems: 'center' },
  rowText: { marginLeft: 10, fontSize: 16 },
});

export default SettingsScreen;
