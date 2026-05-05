import React from 'react';
import { View, StyleSheet, Image } from 'react-native';

export const Logo = ({ isSmall = false, showText = false }) => {
  const size = isSmall ? 40 : 110;

  return (
    <View style={styles.container}>
      <Image
        source={require('../../assets/CCNXP.png')}
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
