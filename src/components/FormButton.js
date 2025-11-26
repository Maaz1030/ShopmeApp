
import React from 'react';
import { TouchableOpacity, Text, ActivityIndicator, StyleSheet } from 'react-native';

const FormButton = ({ title, onPress, loading, color = '#007bff', textColor = '#fff' }) => (
  <TouchableOpacity
    style={[styles.button, { backgroundColor: color, opacity: loading ? 0.7 : 1 }]}
    onPress={onPress}
    disabled={loading}>
    {loading ? <ActivityIndicator color={textColor} /> : <Text style={[styles.text, { color: textColor }]}>{title}</Text>}
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  button: {
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  text: { fontSize: 16, fontWeight: '600' },
});

export default FormButton;