import React, { useContext } from 'react';
import { View, StyleSheet, Image } from 'react-native';
import { ThemeContext } from '../navigation/AppNavigator';

export const Logo = ({
  isSmall = false,
  showText = false,
  size: customSize,
}) => {
  const { isDarkMode } = useContext(ThemeContext);
  const size = customSize || (isSmall ? 40 : 110);

  return (
    <View style={styles.container}>
      <Image
        source={require('../../assets/cena.png')}
        style={{ width: size, height: size, resizeMode: 'contain' }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
