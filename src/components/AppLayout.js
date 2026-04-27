import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { useTheme } from '../navigation/AppNavigator';
import { Header } from './Header';

export const AppLayout = ({ children, hideHeader = false }) => {
  const { colors } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {!hideHeader && <Header />}
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {children}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 20,
    paddingBottom: 100,
  }
});
