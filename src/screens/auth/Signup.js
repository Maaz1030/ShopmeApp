import React, { useState } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import FastImage from 'react-native-fast-image';
import { launchImageLibrary } from 'react-native-image-picker';
import Icon from 'react-native-vector-icons/Ionicons';
import { Formik } from 'formik';
import * as Yup from 'yup';
import { useDispatch, useSelector } from 'react-redux';
import { signUpUser } from '../../redux/authSlice';
import FormInput from '../../components/FormInput';
import PasswordInput from '../../components/PasswordInput';
import FormButton from '../../components/FormButton';
import colors from '../../utils/colors';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const SignUpScreen = ({ navigation }) => {
  const [photo, setPhoto] = useState(null);
  const dispatch = useDispatch();
  const { loading, darkMode } = useSelector(state => state.auth);
  const theme = darkMode ? colors.dark : colors.light;
  const insets = useSafeAreaInsets();

  const SignUpSchema = Yup.object().shape({
    name: Yup.string().required('Name is required'),
    email: Yup.string()
      .email('Enter a valid email')
      .required('Email is required'),
    password: Yup.string()
      .min(6, 'Password must be at least 6 characters')
      .required('Password is required'),
  });

  const handlePickImage = () => {
    launchImageLibrary({ mediaType: 'photo', quality: 0.6 }, response => {
      if (response.didCancel || response.errorCode) return;
      const uri = response.assets?.[0]?.uri;
      setPhoto(uri);
    });
  };

  const handleSignUp = async values => {
    const result = await dispatch(signUpUser({ ...values, photo }));
    if (signUpUser.fulfilled.match(result)) {
      Alert.alert('Welcome', 'Account created successfully.', [
        { text: 'OK', onPress: () => navigation.replace('MainTabs') },
      ]);
    } else {
      const msg = result.payload?.toLowerCase()?.includes('email-already')
        ? 'This email is already registered.'
        : result.payload?.toLowerCase()?.includes('network')
        ? 'Network error. Please try again.'
        : result.payload?.toLowerCase()?.includes('invalid-email')
        ? 'Please use a valid email address.'
        : 'Signup failed. Please try again.';
      Alert.alert('Signup Failed', msg);
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
        {/* Logo + Form Section */}
        <View style={{ alignItems: 'center', width: '100%' }}>
          <Image
            source={require('../../assets/logo.png')}
            style={styles.logo}
            resizeMode="contain"
          />

          {/* Avatar Picker */}
          <View style={styles.avatarSection}>
            <TouchableOpacity
              onPress={handlePickImage}
              style={[
                styles.imagePicker,
                { backgroundColor: theme.surface, borderColor: theme.border },
              ]}
            >
              {photo ? (
                <FastImage
                  style={styles.avatarPreview}
                  source={{ uri: photo }}
                  resizeMode={FastImage.resizeMode.cover}
                />
              ) : (
                <Icon name="add" size={36} color={theme.accent} />
              )}
            </TouchableOpacity>
            <Text style={[styles.uploadLabel, { color: theme.secondaryText }]}>
              Upload Profile Photo
            </Text>
          </View>

          {/* Formik Form */}
          <Formik
            initialValues={{ name: '', email: '', password: '' }}
            validationSchema={SignUpSchema}
            onSubmit={handleSignUp}
          >
            {({ handleChange, handleSubmit, values, errors, touched }) => (
              <View style={{ width: '100%', paddingHorizontal: 20 }}>
                <FormInput
                  value={values.name}
                  onChangeText={handleChange('name')}
                  placeholder="Name"
                  textColor={theme.primaryText}
                  placeholderTextColor={theme.secondaryText}
                  borderColor={theme.border}
                  backgroundColor={theme.surface}
                  error={touched.name && errors.name}
                />

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

                <FormButton
                  title="Sign Up"
                  onPress={handleSubmit}
                  loading={loading}
                  color={theme.accent}
                />
              </View>
            )}
          </Formik>
        </View>

        {/* Footer Section */}
        <View
          style={[
            styles.bottomSection,
            { backgroundColor: theme.primaryBackground },
          ]}
        >
          <View style={[styles.divider, { backgroundColor: theme.border }]} />
          <View style={styles.bottomRow}>
            <Text style={[styles.text, { color: theme.secondaryText }]}>
              Already have an account?
            </Text>
            <TouchableOpacity onPress={() => navigation.goBack()}>
              <Text style={[styles.link, { color: theme.accent }]}> Login</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAwareScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  logo: { width: 220, height: 220, marginTop: 10 },
  avatarSection: { alignItems: 'center', marginTop: -20, marginBottom: 10 },
  imagePicker: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  avatarPreview: { width: '100%', height: '100%' },
  uploadLabel: { fontSize: 13, marginTop: 6, textAlign: 'center' },
  bottomSection: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
    marginTop: 'auto', // pin footer to bottom of scroll content
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

export default SignUpScreen;
