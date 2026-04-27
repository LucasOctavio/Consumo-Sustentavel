import React from 'react';
import { View, StyleSheet, Text } from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import { useTheme } from '../navigation/AppNavigator';

export const Logo = ({ isSmall = false, showText = false }) => {
  const { isDarkMode } = useTheme();
  
  const baseSize = isSmall ? 30 : 70;
  const iconSize = isSmall ? 15 : 30;
  const textSize = isSmall ? 18 : 32;

  return (
    <View style={styles.container}>
      {showText && (
        <Text style={[styles.text, { fontSize: textSize, color: isDarkMode ? '#FFF' : '#000' }]}>
          CCN
        </Text>
      )}
      
      <View style={[
        styles.logoCircle, 
        { 
          width: baseSize, 
          height: baseSize, 
          borderRadius: baseSize / 2,
          backgroundColor: isDarkMode ? '#1E2C5A' : '#82C1FF',
          borderColor: isDarkMode ? '#82C1FF' : '#000'
        }
      ]}>
        <View style={styles.dropWrapper}>
          <FontAwesome5 
            name="tint" 
            size={iconSize} 
            color={isDarkMode ? '#82C1FF' : '#4FC3F7'} 
          />
        </View>
        
        <View style={styles.leavesContainer}>
          <FontAwesome5 name="leaf" size={iconSize * 0.7} color="#4CD964" style={styles.leftLeaf} />
          <FontAwesome5 name="leaf" size={iconSize * 0.7} color="#4CD964" style={styles.rightLeaf} />
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontWeight: 'bold',
    marginRight: 10,
  },
  logoCircle: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    position: 'relative',
    overflow: 'hidden',
  },
  dropWrapper: {
    marginTop: -5,
  },
  leavesContainer: {
    flexDirection: 'row',
    position: 'absolute',
    bottom: -3,
  },
  leftLeaf: {
    transform: [{ rotate: '-45deg' }],
    marginRight: -3,
  },
  rightLeaf: {
    transform: [{ rotate: '45deg' }, { scaleX: -1 }],
    marginLeft: -3,
  }
});
