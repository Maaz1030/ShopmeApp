
import React from 'react';
import { View, TextInput, Text, StyleSheet } from 'react-native';

const FormInput = ({
  value,
  onChangeText,
  placeholder,
  textColor = '#000',
  placeholderTextColor = '#999',
  borderColor = '#ccc',
  backgroundColor = '#fff',
  error,
  inputStyle,
  containerStyle,
  ...props
}) => (
  <View style={[styles.container, containerStyle]}>
    <TextInput
      style={[
        styles.input,
        {
          color: textColor, // dynamic text color
          borderColor,      // dynamic border
          backgroundColor,  // dynamic background
        },
        inputStyle,
      ]}
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      placeholderTextColor={placeholderTextColor}
      {...props}
    />
    {error ? <Text style={styles.errorText}>{error}</Text> : null}
  </View>
);

const styles = StyleSheet.create({
  container: { marginBottom: 14 },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
  },
  errorText: { color: 'red', fontSize: 13, marginTop: 4 },
});

export default FormInput;