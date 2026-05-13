import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../navigation/AppNavigator';
import { Header } from './Header';

export const AppLayout = ({ children, hideHeader = false }) => {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
      edges={['top', 'left', 'right']}
    >
      {!hideHeader && <Header />}
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: Math.max(insets.bottom + 90, 110) },
        ]}
        keyboardShouldPersistTaps="handled">
        {children}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 20,
  },
});
