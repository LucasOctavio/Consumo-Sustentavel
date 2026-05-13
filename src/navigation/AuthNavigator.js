import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import {
  LoginScreen,
  RegisterScreen,
  RecoveryScreen,
  NewPasswordScreen,
} from '../screens/auth/AuthScreens';
import { ResetCodeScreen } from '../screens/auth/ResetCode/ResetCodeScreen';

const Stack = createNativeStackNavigator();

export const AuthNavigator = () => {
  return (
    <Stack.Navigator
      initialRouteName="Login"
      screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
      <Stack.Screen name="Recovery" component={RecoveryScreen} />
      <Stack.Screen name="ResetCode" component={ResetCodeScreen} />
      <Stack.Screen name="NewPassword" component={NewPasswordScreen} />
    </Stack.Navigator>
  );
};
