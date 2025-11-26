
import React, { useState } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  Text,
  StyleSheet,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';

const PasswordInput = ({
  value,
  onChangeText,
  placeholder = 'Password',
  placeholderTextColor = '#999',
  borderColor = '#ccc',
  backgroundColor = '#fff',
  error,
  textColor = '#000',
  inputStyle,
  containerStyle,
}) => {
  const [showPass, setShowPass] = useState(false);

  return (
    <View style={[styles.container, containerStyle]}>
      <View style={[styles.inputRow, { borderColor, backgroundColor }]}>
        <TextInput
          style={[styles.input, { color: textColor }, inputStyle]}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={placeholderTextColor}
          secureTextEntry={!showPass}
        />
        <TouchableOpacity onPress={() => setShowPass(!showPass)}>
          <Icon
            name={showPass ? 'eye' : 'eye-off'}
            size={22}
            color={placeholderTextColor}
          />
        </TouchableOpacity>
      </View>
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { marginBottom: 14 },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
  },
  input: { flex: 1, fontSize: 16, paddingVertical: 12 },
  errorText: { color: 'red', fontSize: 13, marginTop: 4 },
});

export default PasswordInput;
