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
  id: item.con_id || item.id || Date.now(),  // backend retorna con_id
  type: item.tipo || item.type || '?',
  value: item.valor !== undefined ? item.valor : item.value,
  date: normalizeDate(item.dt || item.date || ''),
  unit: item.medida || item.unit || '',
  simulado: item.simulado || false,
});

const normalizeGoal = (item) => ({
  id: item.meta_id || item.id || Date.now(),  // backend retorna meta_id
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
            name: userInfo.user_name || userInfo.nome || '',
            email: userInfo.user_email || userInfo.email || '',
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
      // Normaliza os campos do backend para o formato esperado pela UI e separa consumos de simulações
      if (Array.isArray(consumoData)) {
        const normalized = consumoData.map(normalizeConsumption);
        setConsumptions(normalized.filter(c => !c.simulado)); // Apenas consumos reais
        setSimulations(normalized.filter(c => c.simulado));   // Apenas simulações
      }
      if (Array.isArray(metaData)) setGoals(metaData.map(normalizeGoal));
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const colors = isDarkMode ? darkColors : lightColors;

  // Passo 1 do 2FA: valida credenciais e envia o código por e-mail
  // Retorna { success, token_2fa } em caso de sucesso ou { success: false, message } em caso de erro
  const login = async (identifier, password) => {
    try {
      const data = await authService.send2fa(identifier, password);
      if (data && data.token_2fa) {
        // Credenciais corretas → retorna o token temporário para o passo 2
        return { success: true, token_2fa: data.token_2fa };
      }
      return { success: false, message: 'Erro ao iniciar verificação 2FA.' };
    } catch (error) {
      console.error('Login error:', error);
      const msg = error.response?.data?.detail || 'Nome ou senha incorretos.';
      return { success: false, message: msg };
    }
  };

  // Passo 2 do 2FA: valida o código e finaliza o login, salvando o token de sessão
  const confirmLogin = async (codigo, token2fa) => {
    try {
      const data = await authService.verify2fa(codigo, token2fa);
      if (data && data.access_token) {
        await AsyncStorage.setItem('@CCN:token', data.access_token);
        if (data.refresh_token) {
          await AsyncStorage.setItem('@CCN:refresh_token', data.refresh_token);
        }
        // Busca dados do usuário após confirmação do 2FA
        const userInfo = await authService.getUserInfo();
        setUserData({
          ...userInfo,
          name: userInfo.user_name || userInfo.nome || '',
          email: userInfo.user_email || userInfo.email || '',
        });
        setIsAuthenticated(true);
        return { success: true };
      }
      return { success: false, message: 'Código inválido. Tente novamente.' };
    } catch (error) {
      console.error('2FA verify error:', error);
      const msg = error.response?.data?.detail || 'Código incorreto ou expirado.';
      return { success: false, message: msg };
    }
  };

  const register = async (name, email, password) => {
    try {
      await authService.register(name, email, password);
      // Cadastro ok: usuário deve verificar e-mail, depois fazer login manualmente
      return { success: true, requiresEmailVerification: true };
    } catch (error) {
      console.error('Register error:', error);
      const message = error.response?.data?.detail || 'Erro ao realizar cadastro.';
      return { success: false, message };
    }
  };

  // Reenvia o link de verificação usando os dados originais do cadastro
  const resendVerification = async (name, email, password) => {
    try {
      await authService.resendVerification(name, email, password);
      return { success: true };
    } catch (error) {
      console.error('Resend verification error:', error);
      const message = error.response?.data?.detail || 'Erro ao reenviar e-mail de verificação.';
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

  const forgotPassword = async (email) => {
    try {
      const data = await authService.forgotPassword(email);
      // token_reset pode ser undefined se o e-mail não existir (segurança)
      return { success: true, tokenReset: data.token_reset || null, message: data.message };
    } catch (error) {
      console.error('Forgot password error:', error);
      const message = error.response?.data?.detail || 'Erro ao solicitar recuperação de senha.';
      return { success: false, message };
    }
  };

  const resetPasswordByCode = async (codigo, tokenReset, novaSenha) => {
    try {
      await authService.resetPassword(codigo, tokenReset, novaSenha);
      return { success: true };
    } catch (error) {
      console.error('Reset password error:', error);
      const message = error.response?.data?.detail || 'Código incorreto ou expirado.';
      return { success: false, message };
    }
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

  const addSimulation = async (data) => {
    // Adiciona simulação localmente para resposta rápida da UI
    const localItem = {
      id: Date.now(),
      type: data.type,
      value: data.value,
      date: data.date,
      unit: data.unit,
      simulado: true
    };
    setSimulations(prev => [localItem, ...prev]);

    try {
      // Salva a simulação no banco de dados usando o novo serviço criado em api.js
      await consumptionService.createSimulation(data);
      await loadBackendData(); // Sincroniza dados com o banco após salvar
    } catch (error) {
      console.error('Error adding simulation:', error);
    }
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

  const deleteConsumption = async (id) => {
    // Remove localmente de imediato para UI responsiva
    setConsumptions(prev => prev.filter(c => c.id !== id));
    try {
      await consumptionService.delete(id);
    } catch (error) {
      console.error('Error deleting consumption:', error);
      // Recarrega do backend em caso de erro para restaurar estado correto
      await loadBackendData();
    }
  };

  const deleteSimulation = async (id) => {
    setSimulations(prev => prev.filter(s => s.id !== id));
    try {
      await consumptionService.delete(id);
    } catch (error) {
      console.error('Error deleting simulation:', error);
      await loadBackendData();
    }
  };

  const deleteGoal = async (id) => {
    setGoals(prev => prev.filter(g => g.id !== id));
    try {
      await goalService.delete(id);
    } catch (error) {
      console.error('Error deleting goal:', error);
      await loadBackendData();
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

  // Helper para parsear data DD/MM/YYYY para Date do JS e poder comparar os prazos
  const parseDateBr = (dateStr) => {
    if (!dateStr) return new Date();
    const [day, month, year] = String(dateStr).split('/').map(Number);
    return new Date(year, month - 1, day);
  };

  // Calcula dinamicamente a porcentagem de progresso das metas com base nos consumos reais!
  const goalsWithProgress = goals.map(goal => {
    const goalStart = parseDateBr(goal.start);
    const goalEnd = parseDateBr(goal.end);
    
    // Soma apenas os consumos que batem com o "tipo" da meta e ocorreram dentro do período estipulado
    const totalConsumed = consumptions.reduce((acc, c) => {
      if (c.type === goal.type) {
        const cDate = parseDateBr(c.date);
        if (cDate >= goalStart && cDate <= goalEnd) {
          return acc + Number(c.value);
        }
      }
      return acc;
    }, 0);
    
    // Define a porcentagem do progresso (limita em 100% no máximo para não quebrar a UI do gráfico circular)
    const progress = Number(goal.value) > 0 
      ? Math.min(100, Math.round((totalConsumed / Number(goal.value)) * 100)) 
      : 0;
      
    return { ...goal, progress };
  });

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
        confirmLogin,
        resendVerification,
        updateProfile,
        forgotPassword,
        resetPasswordByCode,
        consumptions,
        simulations,
        goals: goalsWithProgress,
        addConsumption,
        addSimulation,
        addGoal,
        deleteConsumption,
        deleteSimulation,
        deleteGoal,
        deleteAccount
      }}>
        <NavigationContainer>
          {isAuthenticated ? <MainNavigator /> : <AuthNavigator />}
        </NavigationContainer>
      </AuthContext.Provider>
    </ThemeContext.Provider>
  );
};
