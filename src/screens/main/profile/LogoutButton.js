import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';

const LogoutButton = ({ theme, onPress }) => (
  <TouchableOpacity
    style={[styles.button, { backgroundColor: theme.accent }]}
    onPress={onPress}
  >
    <Icon
      name="log-out-outline"
      size={20}
      color="#fff"
      style={{ marginRight: 6 }}
    />
    <Text style={styles.text}>Logout</Text>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
    paddingVertical: 14,
    position: 'absolute',
    bottom: 30,
    left: 16,
    right: 16,
  },
  text: { color: '#fff', fontSize: 16, fontWeight: '600' },
});

export default LogoutButton;
