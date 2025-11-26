import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  Image,
} from 'react-native';
import FastImage from 'react-native-fast-image';
import Icon from 'react-native-vector-icons/Ionicons';
import { useSelector, useDispatch } from 'react-redux';
import { updateProfileData } from '../../redux/authSlice';
import { launchImageLibrary } from 'react-native-image-picker';
import { useSafeAreaInsets } from 'react-native-safe-area-context';  
import colors from '../../utils/colors';

const EditProfileScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();  
  const { user } = useSelector(state => state.auth);
  const darkMode = useSelector(state => state.auth.darkMode);
  const theme = darkMode ? colors.dark : colors.light;
  const dispatch = useDispatch();

  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [photo, setPhoto] = useState(user?.photoURL || '');
  const [uploading, setUploading] = useState(false);

  const handleImagePick = async () => {
    const result = await launchImageLibrary({ mediaType: 'photo' });
    if (result.didCancel || result.errorCode) return;
    const uri = result.assets?.[0]?.uri;
    if (uri) setPhoto(uri);
  };

  const handleSave = async () => {
    if (!name.trim() || !email.trim()) {
      Alert.alert('Missing Info', 'Please fill in all fields.');
      return;
    }
    setUploading(true);
    try {
      await dispatch(updateProfileData({ name, email, photo })).unwrap();
      Alert.alert('Profile Updated', 'Your changes have been saved.');
      navigation.goBack();
    } catch (error) {
      Alert.alert('Error', error || 'Unable to update profile.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: theme.primaryBackground,
          paddingTop: insets.top ,      
          paddingBottom: insets.bottom + 10,
        },
      ]}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name="arrow-back" size={22} color={theme.primaryText} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.primaryText }]}>
          Edit Profile
        </Text>
        <View style={{ width: 22 }} />
      </View>

      {/* Avatar */}
      <TouchableOpacity style={styles.avatarContainer} onPress={handleImagePick}>
        {photo ? (
          <FastImage
            style={styles.avatar}
            source={{ uri: photo }}
            resizeMode={FastImage.resizeMode.cover}
          />
        ) : (
          <Image
            source={require('../../assets/avatar.jpg')}
            style={styles.avatar}
            resizeMode="cover"
          />
        )}
        <View style={[styles.cameraBadge, { backgroundColor: theme.accent }]}>
          <Icon name="camera" size={16} color="#fff" />
        </View>
      </TouchableOpacity>

      {/* Fields */}
      <TextInput
        style={[
          styles.input,
          {
            backgroundColor: theme.surface,
            borderColor: theme.border,
            color: theme.primaryText,
          },
        ]}
        placeholder="Full Name"
        value={name}
        onChangeText={setName}
        placeholderTextColor={theme.secondaryText}
      />

      <TextInput
        style={[
          styles.input,
          {
            backgroundColor: theme.surface,
            borderColor: theme.border,
            color: theme.primaryText,
          },
        ]}
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        placeholderTextColor={theme.secondaryText}
        keyboardType="email-address"
        autoCapitalize="none"
      />

      {/* Save Button */}
      <TouchableOpacity
        style={[styles.saveButton, { backgroundColor: theme.accent }]}
        onPress={handleSave}
        activeOpacity={0.8}
        disabled={uploading}
      >
        {uploading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <>
            <Icon name="save-outline" size={20} color="#fff" />
            <Text style={styles.saveButtonText}>Update</Text>
          </>
        )}
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16,
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
  avatarContainer: {
    alignSelf: 'center',
    position: 'relative',
  },
  avatar: {
    width: 110,
    height: 110,
    borderRadius: 55,
  },
  cameraBadge: {
    position: 'absolute',
    bottom: 0,
    right: 6,
    borderRadius: 14,
    padding: 6,
  },
  input: {
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 15,
    marginTop: 16,
    borderWidth: 1,
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    paddingVertical: 14,
    marginTop: 30,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 6,
  },
});

export default EditProfileScreen;