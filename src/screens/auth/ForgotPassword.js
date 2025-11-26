import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import auth from '@react-native-firebase/auth';
import { useSelector } from 'react-redux';
import colors from '../../utils/colors';

const ForgotPasswordScreen = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  //  get theme from Redux
  const darkMode = useSelector(state => state.auth.darkMode);
  const theme = darkMode ? colors.dark : colors.light;

  const handlePasswordReset = async () => {
    if (!email.trim()) {
      Alert.alert('Missing Email', 'Please enter your registered email address.');
      return;
    }

    try {
      setLoading(true);
      await auth().sendPasswordResetEmail(email.trim());
      Alert.alert(
        'Password Reset',
        'A reset link has been sent to your email. Please check your inbox.'
      );
      navigation.goBack();
    } catch (error) {
      console.log('Password reset error:', error.message);
      Alert.alert('Error', 'Unable to send reset link. Please check the email and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.primaryBackground }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name="arrow-back" size={22} color={theme.primaryText} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.primaryText }]}>Forgot Password</Text>
        <View style={{ width: 22 }} />
      </View>

      {/* Content */}
      <Text style={[styles.infoText, { color: theme.secondaryText }]}>
        Enter your registered email address. We’ll send you a link to reset your password.
      </Text>

      <TextInput
        style={[
          styles.input,
          {
            backgroundColor: theme.surface,
            borderColor: theme.border,
            color: theme.primaryText,
          },
        ]}
        placeholder="Email Address"
        placeholderTextColor={theme.secondaryText}
        keyboardType="email-address"
        autoCapitalize="none"
        value={email}
        onChangeText={setEmail}
      />

      <TouchableOpacity
        style={[styles.resetButton, { backgroundColor: theme.accent }]}
        onPress={handlePasswordReset}
        activeOpacity={0.8}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <>
            <Icon name="mail-outline" size={20} color="#fff" />
            <Text style={styles.resetText}>Send Reset Link</Text>
          </>
        )}
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    paddingTop: 40,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 30,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  infoText: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 20,
  },
  input: {
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 15,
    borderWidth: 1,
  },
  resetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    paddingVertical: 14,
    marginTop: 25,
  },
  resetText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 6,
  },
});

export default ForgotPasswordScreen;