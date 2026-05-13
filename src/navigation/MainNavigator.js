import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { StyleSheet, View, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FontAwesome5, MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../navigation/AppNavigator';
import {
  HomeScreen,
  ConsumptionScreen,
  SimulatedScreen,
  GoalsScreen,
} from '../screens/main/MainScreens';
import { SettingsScreen } from '../screens/main/Settings/SettingsScreen';

const Tab = createBottomTabNavigator();

const TabIcon = ({ name, type, focused, color }) => {
  const IconComponent =
    type === 'Material' ? MaterialCommunityIcons : FontAwesome5;
  return (
    <View style={[styles.iconContainer, focused && styles.iconFocused]}>
      <IconComponent name={name} size={24} color={color} />
    </View>
  );
};

export const MainNavigator = () => {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const tabBarHeight = 60 + insets.bottom;

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ focused }) => {
          let iconName, type;
          const iconColor = focused ? '#fff' : 'rgba(255,255,255,0.4)';

          if (route.name === 'Home') {
            iconName = 'home';
            type = 'FontAwesome';
          } else if (route.name === 'Consumption') {
            iconName = 'shopping-basket';
            type = 'FontAwesome';
          } else if (route.name === 'Simulated') {
            iconName = 'chart-line';
            type = 'FontAwesome';
          } else if (route.name === 'Goals') {
            iconName = 'target';
            type = 'Material';
          } else if (route.name === 'Settings') {
            iconName = 'cog';
            type = 'FontAwesome';
          }

          return (
            <TabIcon
              name={iconName}
              type={type}
              focused={focused}
              color={iconColor}
            />
          );
        },
        tabBarActiveTintColor: '#fff',
        tabBarInactiveTintColor: 'rgba(255,255,255,0.4)',
        tabBarStyle: {
          backgroundColor: '#1E2C5A',
          borderTopWidth: 0,
          height: tabBarHeight,
          borderTopLeftRadius: 25,
          borderTopRightRadius: 25,
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          elevation: 25,
          paddingBottom: insets.bottom > 0 ? insets.bottom : 5,
        },
        tabBarShowLabel: false,
      })}>
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Consumption" component={ConsumptionScreen} />
      <Tab.Screen name="Simulated" component={SimulatedScreen} />
      <Tab.Screen name="Goals" component={GoalsScreen} />
      <Tab.Screen name="Settings" component={SettingsScreen} />
    </Tab.Navigator>
  );
};

const styles = StyleSheet.create({
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 44,
    height: 44,
    borderRadius: 22,
    marginTop: 10,
  },
  iconFocused: {
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
});
