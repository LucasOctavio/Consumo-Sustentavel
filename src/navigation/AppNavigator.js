import React, { useState, createContext, useContext } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { AuthNavigator } from './AuthNavigator';
import { MainNavigator } from './MainNavigator';
import { lightColors, darkColors } from '../theme/colors';

import { authService, consumptionService, goalService } from '../services/api';
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
  const [loading, setLoading] = useState(false);

  // ⚠️ Estados declarados ANTES de loadBackendData para evitar erro de referência
  const [consumptions, setConsumptions] = useState([
    { id: 1, type: 'Água', value: 50, date: '25/04/2026', unit: 'L' },
    { id: 2, type: 'Energia', value: 12, date: '10/04/2026', unit: 'kWh' },
    { id: 3, type: 'Gás', value: 8, date: '20/03/2026', unit: 'm³' }
  ]);
  const [simulations, setSimulations] = useState([
    { id: 1, type: 'Água', value: 45, date: '27/04/2026', unit: 'L' },
    { id: 2, type: 'Energia', value: 15, date: '15/04/2026', unit: 'kWh' }
  ]);
  const [goals, setGoals] = useState([
    { id: 1, type: 'Energia', value: 50, unit: 'kWh', start: '01/04/2026', end: '30/04/2026', progress: 52 },
  ]);

  // Load data from backend when authenticated
  React.useEffect(() => {
    if (isAuthenticated) {
      loadBackendData();
    }
  }, [isAuthenticated]);

  const loadBackendData = async () => {
    setLoading(true);
    try {
      const [consumoData, metaData] = await Promise.all([
        consumptionService.getAll(),
        goalService.getAll()
      ]);
      if (Array.isArray(consumoData)) setConsumptions(consumoData);
      if (Array.isArray(metaData)) setGoals(metaData);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const colors = isDarkMode ? darkColors : lightColors;

  const login = async (identifier, password) => {
    try {
      const data = await authService.login(identifier, password);
      // O backend retorna access_token, refresh_token, token_type
      if (data.access_token) {
        await AsyncStorage.setItem('@CCN:token', data.access_token);
        
        // Buscar informações do usuário logado
        const userInfo = await authService.getUserInfo();
        setUserData({
          ...userInfo,
          name: userInfo.user_name,
          email: userInfo.user_email
        });
        
        setIsAuthenticated(true);
        return { success: true };
      }
      return { success: false, message: "Erro ao realizar login." };
    } catch (error) {
      console.error('Login error:', error);
      const message = error.response?.data?.detail || "E-mail ou senha incorretos.";
      return { success: false, message };
    }
  };

  const register = async (name, email, password) => {
    try {
      await authService.register(name, email, password);
      // Após registrar, faz login automaticamente
      return await login(name, password);
    } catch (error) {
      console.error('Register error:', error);
      const message = error.response?.data?.detail || "Erro ao realizar cadastro.";
      return { success: false, message };
    }
  };

  const logout = async () => {
    await AsyncStorage.removeItem('@CCN:token');
    setIsAuthenticated(false);
    setUserData(null);
  };

  const updateProfile = async (newInfo) => {
    try {
      await authService.update(newInfo);
      // Recarregar dados do usuário após atualização
      const userInfo = await authService.getUserInfo();
      setUserData({
        ...userInfo,
        name: userInfo.user_name,
        email: userInfo.user_email
      });
      return { success: true };
    } catch (error) {
      console.error('Update profile error:', error);
      return { success: false, message: "Erro ao atualizar perfil." };
    }
  };

  const checkEmail = (email) => {
    return users.find(u => u.email === email);
  };

  const resetPassword = (email, newPassword) => {
    setUsers(users.map(u => u.email === email ? { ...u, password: newPassword } : u));
    return { success: true };
  };



  const addConsumption = async (data) => {
    try {
      await consumptionService.create(data);
      await loadBackendData(); // Recarrega do backend para garantir sincronia
    } catch (error) {
      console.error('Error adding consumption:', error);
    }
  };

  const addSimulation = (data) => {
    setSimulations([{ id: Date.now(), ...data }, ...simulations]);
  };

  const addGoal = async (data) => {
    try {
      await goalService.create(data);
      await loadBackendData();
    } catch (error) {
      console.error('Error adding goal:', error);
    }
  };

  const deleteAccount = () => {
    setUsers(users.filter(u => u.email !== userData.email));
    setIsAuthenticated(false);
    setUserData(null);
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
        resetPassword,
        consumptions,
        simulations,
        goals,
        addConsumption,
        addSimulation,
        addGoal,
        deleteAccount
      }}>
        <NavigationContainer>
          {isAuthenticated ? <MainNavigator /> : <AuthNavigator />}
        </NavigationContainer>
      </AuthContext.Provider>
    </ThemeContext.Provider>
  );
};
