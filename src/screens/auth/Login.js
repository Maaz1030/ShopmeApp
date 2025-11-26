import React from 'react';
import {
  View,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { Formik } from 'formik';
import * as Yup from 'yup';
import { useDispatch, useSelector } from 'react-redux';
import { loginUser } from '../../redux/authSlice';
import FormInput from '../../components/FormInput';
import PasswordInput from '../../components/PasswordInput';
import FormButton from '../../components/FormButton';
import colors from '../../utils/colors';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const LoginScreen = ({ navigation }) => {
  const dispatch = useDispatch();
  const { loading, darkMode } = useSelector(state => state.auth);
  const theme = darkMode ? colors.dark : colors.light;
  const insets = useSafeAreaInsets();

  const LoginSchema = Yup.object().shape({
    email: Yup.string()
      .email('Please enter a valid email address')
      .required('Email is required'),
    password: Yup.string().required('Password is required'),
  });

  const handleLogin = async values => {
    const result = await dispatch(loginUser(values));
    if (loginUser.fulfilled.match(result)) {
      
        //navigation.replace('MainTabs') 
      return;
    } else {
      const message =
        result.payload?.toLowerCase()?.includes('password')
          ? 'Incorrect password. Please try again.'
          : result.payload?.toLowerCase()?.includes('user')
          ? 'No account found with this email.'
          : result.payload?.toLowerCase()?.includes('email')
          ? 'Please enter a valid email address.'
          : 'Login failed. Please check your credentials.';
      Alert.alert('Login Failed', message);
    }
  };

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: theme.primaryBackground,
        paddingTop: insets.top,
      }}
    >
      <KeyboardAwareScrollView
        contentContainerStyle={{
          flexGrow: 1,
          alignItems: 'center',
          paddingBottom: insets.bottom + 10,
        }}
        keyboardShouldPersistTaps="handled"
        enableOnAndroid
        enableResetScrollToCoords
        resetScrollToCoords={{ x: 0, y: 0 }}
        extraScrollHeight={24}
        showsVerticalScrollIndicator={false}
        contentInsetAdjustmentBehavior="never"
      >
        {/* Main Content: Logo and Form */}
        <View style={{ alignItems: 'center', width: '100%', paddingBottom: 40 }}>
          <Image
            source={require('../../assets/logo.png')}
            style={styles.logo}
            resizeMode="contain"
          />

          <Formik
            initialValues={{ email: '', password: '' }}
            validationSchema={LoginSchema}
            onSubmit={handleLogin}
          >
            {({ handleChange, handleSubmit, values, errors, touched }) => (
              <View style={{ width: '100%', paddingHorizontal: 20 }}>
                <FormInput
                  value={values.email}
                  onChangeText={handleChange('email')}
                  placeholder="Email"
                  keyboardType="email-address"
                  textColor={theme.primaryText}
                  placeholderTextColor={theme.secondaryText}
                  borderColor={theme.border}
                  backgroundColor={theme.surface}
                  error={touched.email && errors.email}
                />

                <PasswordInput
                  value={values.password}
                  onChangeText={handleChange('password')}
                  placeholder="Password"
                  textColor={theme.primaryText}
                  placeholderTextColor={theme.secondaryText}
                  borderColor={theme.border}
                  backgroundColor={theme.surface}
                  error={touched.password && errors.password}
                />

                <TouchableOpacity
                  onPress={() => navigation.navigate('ForgotPassword')}
                >
                  <Text style={[styles.forgot, { color: theme.secondaryText }]}>
                    Forgot Password?
                  </Text>
                </TouchableOpacity>

                <FormButton
                  title="Login"
                  onPress={handleSubmit}
                  loading={loading}
                  color={theme.accent}
                />
              </View>
            )}
          </Formik>
        </View>

        {/* Footer */}
        <View
          style={[
            styles.bottomSection,
            { backgroundColor: theme.primaryBackground },
          ]}
        >
          <View style={[styles.divider, { backgroundColor: theme.border }]} />
          <View style={styles.bottomRow}>
            <Text style={[styles.text, { color: theme.secondaryText }]}>
              Don’t have an account?
            </Text>
            <TouchableOpacity onPress={() => navigation.navigate('SignUp')}>
              <Text style={[styles.link, { color: theme.accent }]}>
                {' '}Sign Up
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAwareScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  logo: { width: 250, height: 250, marginTop: 70 },
  forgot: { fontSize: 14, textAlign: 'right', marginBottom: 20 },
  bottomSection: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
    marginTop: 'auto', // Pin footer to bottom of scroll content
  },
  divider: {
    width: '100%',
    height: StyleSheet.hairlineWidth,
    marginBottom: 20,
  },
  bottomRow: { flexDirection: 'row', justifyContent: 'center' },
  text: { fontSize: 14 },
  link: { fontWeight: '600' },
});

export default LoginScreen;