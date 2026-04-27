import React from 'react';
import { View, StyleSheet, Text } from 'react-native';
import { Logo } from './Logo';
import { useTheme } from '../navigation/AppNavigator';

export const Header = () => {
  const { colors } = useTheme();
  return (
    <View style={styles.header}>
      <Logo isSmall={true} />
      <View style={styles.centerContainer}>
        <Text style={[styles.headerText, { color: colors.secondary }]}>Consciência do Consumo Natural</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 15,
    position: 'relative',
  },
  centerContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 50, // Matches header paddingTop
    bottom: 15, // Matches header paddingBottom
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: -1,
  },
  headerText: {
    fontSize: 14,
    fontWeight: 'bold',
    opacity: 0.9,
    textAlign: 'center',
    maxWidth: '70%', // Prevent overlapping with logo on very small screens
  }
});
