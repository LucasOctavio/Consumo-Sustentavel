import React, { useState, createContext, useContext } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { AuthNavigator } from './AuthNavigator';
import { MainNavigator } from './MainNavigator';
import { lightColors, darkColors } from '../theme/colors';

import { authService } from '../services/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const AuthContext = createContext();
export const ThemeContext = createContext();

export const useTheme = () => useContext(ThemeContext);

export const AppNavigator = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userData, setUserData] = useState(null);
  const [users, setUsers] = useState([
    { name: 'Admin', email: 'admin@ccn.com', password: '123', profileImage: null }
  ]);
  const [isDarkMode, setIsDarkMode] = useState(false);

  const colors = isDarkMode ? darkColors : lightColors;

  const login = (name, password) => {
    const foundUser = users.find(u => (u.name === name || u.email === name) && u.password === password);
    if (foundUser) {
      setUserData(foundUser);
      setIsAuthenticated(true);
      return { success: true };
    }
    return { success: false, message: "Nome ou senha incorretos." };
  };

  const register = (name, email, password) => {
    if (users.find(u => u.email === email || u.name === name)) {
      return { success: false, message: "Usuário já cadastrado." };
    }
    const newUser = { name, email, password, profileImage: null };
    setUsers([...users, newUser]);
    setUserData(newUser);
    setIsAuthenticated(true);
    return { success: true };
  };

  const logout = () => {
    setIsAuthenticated(false);
    setUserData(null);
  };

  const updateProfile = (newInfo) => {
    const updatedUser = { ...userData, ...newInfo };
    setUserData(updatedUser);
    setUsers(users.map(u => u.email === userData.email ? updatedUser : u));
    return { success: true };
  };

  const checkEmail = (email) => {
    return users.find(u => u.email === email);
  };

  const resetPassword = (email, newPassword) => {
    setUsers(users.map(u => u.email === email ? { ...u, password: newPassword } : u));
    return { success: true };
  };

  return (
    <ThemeContext.Provider value={{ isDarkMode, setIsDarkMode, colors }}>
      <AuthContext.Provider value={{ 
        isAuthenticated, 
        setIsAuthenticated, 
        user: userData?.name || userData?.email,
        userData, 
        login,
        register,
        logout,
        updateProfile,
        checkEmail,
        resetPassword
      }}>
        <NavigationContainer>
          {isAuthenticated ? <MainNavigator /> : <AuthNavigator />}
        </NavigationContainer>
      </AuthContext.Provider>
    </ThemeContext.Provider>
  );
};
