import React from 'react';
import { View, StyleSheet, KeyboardAvoidingView, Platform, ScrollView, Text } from 'react-native';
import { Logo } from './Logo';
import { useTheme } from '../navigation/AppNavigator';

export const AuthLayout = ({ children }) => {
  const { colors } = useTheme();

  return (
    <KeyboardAvoidingView 
      style={[styles.container, { backgroundColor: colors.background }]} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView 
        contentContainerStyle={styles.scrollContent} 
        bounces={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.topSection}>
          <Logo showText={true} />
          <Text style={[styles.brandTitle, { color: colors.secondary }]}>CENA</Text>
          {children}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#72a8b0', // Consistent blue from prototype
  },
  scrollContent: {
    flexGrow: 1,
  },
  topSection: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 25,
    paddingTop: 40,
    paddingBottom: 40,
  },
  brandTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    marginTop: 15,
    letterSpacing: 2,
  }
});
