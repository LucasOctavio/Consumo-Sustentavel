import React from 'react';
import { View, StyleSheet, Text } from 'react-native';
import { Logo } from './Logo';
import { useTheme } from '../navigation/AppNavigator';

export const Header = () => {
  const { colors } = useTheme();
  const logoSize = 60;

  return (
    <View style={[styles.header, { backgroundColor: colors.background }]}>
      <Logo size={logoSize} />
      <View style={styles.titleContainer}>
        <Text style={styles.headerText}>Consumo Econômico Natural Azul</Text>
      </View>
      {/* Spacer para equilibrar o layout e centralizar o texto no meio da tela */}
      <View style={{ width: logoSize }} />
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 15,
    borderBottomLeftRadius: 25,
    borderBottomRightRadius: 25,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 10,
  },
  titleContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1E90FF',
    textAlign: 'center',
  }
});
