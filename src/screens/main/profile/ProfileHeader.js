import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import FastImage from 'react-native-fast-image';
import Icon from 'react-native-vector-icons/Ionicons';

const ProfileHeader = ({ profile, theme, onSettings }) => (
  <View style={styles.header}>
    <View style={styles.info}>
      <FastImage
        style={styles.avatar}
        source={
          profile?.photoURL
            ? { uri: profile.photoURL }
            : require('../../../assets/avatar.jpg')
        }
        resizeMode={FastImage.resizeMode.cover}
      />
      <View>
        <Text style={[styles.name, { color: theme.primaryText }]}>
          {profile?.name || 'User'}
        </Text>
        <Text style={[styles.email, { color: theme.secondaryText }]}>
          {profile?.email}
        </Text>
      </View>
    </View>

    <TouchableOpacity
      style={[
        styles.settingsBtn,
        { backgroundColor: theme.surface, borderColor: theme.border },
      ]}
      onPress={onSettings}
    >
      <Icon name="settings-outline" size={24} color={theme.primaryText} />
    </TouchableOpacity>
  </View>
);

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingHorizontal: 16,
    left: -3,
  },
  info: { flexDirection: 'row', alignItems: 'center' },
  avatar: { width: 70, height: 70, borderRadius: 35, marginRight: 12 },
  name: { fontSize: 18, fontWeight: '600' },
  email: { fontSize: 14, marginTop: 2 },
  settingsBtn: {
    padding: 8,
    borderRadius: 8,
    borderWidth: 1,
  },
});

export default ProfileHeader;
