import React from 'react';
import { TextInput, StyleSheet, View, Text } from 'react-native';
import { useTheme } from '../navigation/AppNavigator';

export const Input = ({ label, style, ...props }) => {
  const { colors } = useTheme();

  return (
    <View style={[styles.container, style]}>
      {label && (
        <Text style={[styles.label, { color: colors.text }]}>{label}</Text>
      )}
      <TextInput
        style={[
          styles.input,
          { color: colors.text, borderBottomColor: colors.border },
        ]}
        placeholderTextColor={colors.textLight}
        {...props}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 15,
    width: '100%',
  },
  label: {
    marginBottom: 5,
    fontSize: 14,
  },
  input: {
    borderBottomWidth: 1,
    paddingVertical: 10,
    fontSize: 16,
  },
});
