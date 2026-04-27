import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useTheme } from '../navigation/AppNavigator';

export const Card = ({ children, style }) => {
  const { colors } = useTheme();
  return (
    <View style={[styles.card, { backgroundColor: colors.card }, style]}>
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
    marginVertical: 10,
    width: '100%',
  },
});
