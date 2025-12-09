import React from 'react';
import { Pressable, StyleSheet, Text, ViewStyle } from 'react-native';

type Props = {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary';
  style?: ViewStyle;
};

export const Button: React.FC<Props> = ({ title, onPress, variant = 'primary', style }) => {
  const isPrimary = variant === 'primary';
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.base,
        isPrimary ? styles.primary : styles.secondary,
        pressed && styles.pressed,
        style,
      ]}
    >
      <Text style={isPrimary ? styles.primaryText : styles.secondaryText}>{title}</Text>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  base: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  primary: {
    backgroundColor: '#6C63FF',
  },
  secondary: {
    borderWidth: 1,
    borderColor: '#6C63FF',
  },
  pressed: {
    opacity: 0.8,
  },
  primaryText: {
    color: '#fff',
    fontWeight: '700',
  },
  secondaryText: {
    color: '#6C63FF',
    fontWeight: '700',
  },
});
