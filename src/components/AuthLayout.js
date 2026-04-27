import React from 'react';
import { View, StyleSheet, KeyboardAvoidingView, Platform, ScrollView, Text } from 'react-native';
import { Logo } from './Logo';
import { FontAwesome5 } from '@expo/vector-icons';

export const AuthLayout = ({ children }) => {
  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView 
        contentContainerStyle={styles.scrollContent} 
        bounces={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.topSection}>
          <Logo showText={true} />
          {children}
        </View>
        <View style={styles.bottomFooter}>
          <Text style={styles.footerText}>©2026 Entertainment, Inc.</Text>
          <FontAwesome5 name="mouse-pointer" size={20} color="#FFFFFF" style={{marginTop: 15}} />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#5EB3FF', // Consistent blue from prototype
  },
  scrollContent: {
    flexGrow: 1,
  },
  topSection: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 25,
    paddingTop: 60,
    paddingBottom: 40,
  },
  bottomFooter: {
    backgroundColor: '#1E2C5A', // The dark footer from the original overview
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 30,
  },
  footerText: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 10,
  }
});
