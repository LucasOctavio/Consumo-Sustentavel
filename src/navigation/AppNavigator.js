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

// Converte datas do backend (ISO: '2026-04-29' ou '2026-04-29T00:00:00') para DD/MM/YYYY
const normalizeDate = (dateStr) => {
  if (!dateStr) return '';
  // Formato ISO: '2026-04-29' ou '2026-04-29T00:00:00'
  if (String(dateStr).includes('-')) {
    const parts = String(dateStr).split('T')[0].split('-');
    if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  return String(dateStr); // já está em DD/MM/YYYY
};

// Normaliza dados vindos do backend para o formato esperado pela UI
const normalizeConsumption = (item) => ({
  id: item.id || item.cons_id || Date.now(),
  type: item.tipo || item.type || '?',
  value: item.valor !== undefined ? item.valor : item.value,
  date: normalizeDate(item.dt || item.date || ''),
  unit: item.medida || item.unit || '',
});

const normalizeGoal = (item) => ({
  id: item.id || item.meta_id || Date.now(),
  type: item.tipo || item.type || '?',
  value: item.valor !== undefined ? item.valor : item.value,
  unit: item.medida || item.unit || '',
  start: normalizeDate(item.dt_inicio || item.start || ''),
  end: normalizeDate(item.dt_fim || item.end || ''),
  progress: item.progress || 0,
});

export const AppNavigator = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userData, setUserData] = useState(null);
  const [users, setUsers] = useState([
    { name: 'Admin', email: 'admin@ccn.com', password: '123', profileImage: null }
  ]);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [loading, setLoading] = useState(false);

  // ⚠️ Estados declarados ANTES de loadBackendData para evitar erro de referência
  const [consumptions, setConsumptions] = useState([]);
  const [simulations, setSimulations] = useState([]);
  const [goals, setGoals] = useState([]);

  // Check token on initial load
  React.useEffect(() => {
    const checkToken = async () => {
      try {
        const token = await AsyncStorage.getItem('@CCN:token');
        if (token) {
          const userInfo = await authService.getUserInfo();
          setUserData({
            ...userInfo,
            name: userInfo.user_name,
            email: userInfo.user_email
          });
          setIsAuthenticated(true);
        }
      } catch (error) {
        console.log('No token found or error validating token', error);
      }
    };
    checkToken();
  }, []);

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
      // Normaliza os campos do backend para o formato esperado pela UI
      if (Array.isArray(consumoData)) setConsumptions(consumoData.map(normalizeConsumption));
      if (Array.isArray(metaData)) setGoals(metaData.map(normalizeGoal));
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
      // Atualiza o estado local com as informações editadas
      // Não recarrega do backend para preservar dados que o backend não retorna (ex: profileImage)
      setUserData(prev => ({
        ...prev,
        name: newInfo.name,
        email: newInfo.email,
        profileImage: newInfo.profileImage,
      }));
      return { success: true };
    } catch (error) {
      console.error('Update profile error:', error);
      const message = error.response?.data?.detail || "Erro ao atualizar perfil.";
      return { success: false, message };
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
    // Adiciona localmente de imediato para UI responsiva
    const localItem = {
      id: Date.now(),
      type: data.type,
      value: data.value,
      date: data.date,
      unit: data.unit,
    };
    setConsumptions(prev => [localItem, ...prev]);

    try {
      await consumptionService.create(data);
      // Sincroniza com backend após salvar com sucesso
      await loadBackendData();
    } catch (error) {
      console.error('Error adding consumption:', error);
      // Mantém o item adicionado localmente para não perder o dado
    }
  };

  const addSimulation = (data) => {
    setSimulations([{ id: Date.now(), ...data }, ...simulations]);
  };

  const addGoal = async (data) => {
    // Adiciona localmente de imediato com mapeamento correto dos campos de data
    const localGoal = {
      id: Date.now(),
      type: data.type,
      value: data.value,
      unit: data.unit,
      start: data.startDate || data.start,
      end: data.endDate || data.end,
      progress: 0,
    };
    setGoals(prev => [localGoal, ...prev]);

    try {
      await goalService.create(data);
      // Sincroniza com backend após salvar com sucesso
      await loadBackendData();
    } catch (error) {
      console.error('Error adding goal:', error);
      // Mantém a meta adicionada localmente para não perder o dado
    }
  };

  const deleteAccount = async () => {
    try {
      // Tenta deletar no backend primeiro
      await authService.deleteAccount();
    } catch (error) {
      console.error('Error deleting account on backend:', error);
      // Continua mesmo se o backend falhar (garante logout local)
    }
    // Remove token e limpa estado independente do resultado do backend
    await AsyncStorage.removeItem('@CCN:token');
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
