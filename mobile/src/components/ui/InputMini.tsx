import React from 'react';
import { TextInput, StyleSheet, TextInputProps } from 'react-native';

export const InputMini: React.FC<TextInputProps> = (props) => {
  return <TextInput {...props} style={[styles.input, props.style]} placeholderTextColor="#94A3B8" />;
};

const styles = StyleSheet.create({
  input: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: '#0F172A',
    minWidth: 140,
    flexGrow: 1,
  },
});
