import React from 'react';
import {
  View,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Logo } from './Logo';
import { useTheme } from '../navigation/AppNavigator';

export const AuthLayout = ({ children }) => {
  const { colors } = useTheme();

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
      edges={['top', 'bottom', 'left', 'right']}
    >
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          bounces={false}
          keyboardShouldPersistTaps="handled">
          <View style={styles.topSection}>
            <Logo showText={true} />
            <Text style={[styles.brandTitle, { color: colors.secondary }]}>
              CENA
            </Text>
            {children}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#72a8b0',
  },
  flex: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  topSection: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 25,
    paddingTop: 30,
    paddingBottom: 30,
  },
  brandTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    marginTop: 15,
    letterSpacing: 2,
  },
});
