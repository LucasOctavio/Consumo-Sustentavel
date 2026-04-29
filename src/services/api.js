import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const api = axios.create({
  // URL base para produção (hospedado no Render)
  baseURL: 'https://consumo-sustentavel.onrender.com',
  // URL para desenvolvimento local (descomente para usar o backend local)
  // baseURL: 'http://localhost:8000', 
});

// Interceptor: adiciona automaticamente o token de autenticação em todas as requisições
api.interceptors.request.use(async (config) => {
  try {
    const token = await AsyncStorage.getItem('@CCN:token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  } catch (error) {
    console.error('Error fetching token from storage', error);
  }
  return config;
});

// Serviço responsável pela autenticação e gestão do usuário
export const authService = {
  // Realiza o login do usuário
  login: async (name, password) => {
    const response = await api.post('/usuario/login', {
      nome: name,
      senha: password
    });
    return response.data;
  },
  
  register: async (name, email, password) => {
    const response = await api.post('/usuario/sign_in', {
      nome: name,
      email: email,
      senha: password
    });
    return response.data;
  },
 
  getUserInfo: async () => {
    const response = await api.get('/usuario/read');
    return response.data;
  },
 
  update: async (userData) => {
    // Monta apenas os campos preenchidos para não sobrescrever senha com string vazia
    const payload = {
      user_name: userData.name,
      user_email: userData.email,
    };
    // Só envia a senha se o usuário realmente digitou uma nova
    if (userData.password && userData.password.trim().length > 0) {
      payload.user_senha = userData.password.trim();
    }
    const response = await api.patch('/usuario/update', payload);
    return response.data;
  },

  deleteAccount: async () => {
    // Remove a conta do usuário autenticado no backend
    const response = await api.delete('/usuario/delete');
    return response.data;
  }
};

// Converte de DD/MM/YYYY para YYYY-MM-DD (para enviar ao backend)
const toIsoDate = (dateStr) => {
  if (!dateStr || !dateStr.includes('/')) return dateStr;
  const parts = dateStr.split('/');
  if (parts.length === 3) {
    return `${parts[2]}-${parts[1]}-${parts[0]}`;
  }
  return dateStr;
};

// Serviço responsável por gerenciar consumos e simulações
export const consumptionService = {
  // Busca todos os registros de consumo (reais e simulados)
  getAll: async () => {
    const response = await api.get('/consumo/read');
    return response.data;
  },
  // Cria um novo registro de consumo real
  create: async (data) => {
    const response = await api.post('/consumo/create', {
      valor: parseFloat(data.value),
      dt: toIsoDate(data.date), // Converte para o formato YYYY-MM-DD aceito pelo backend
      tipo: data.type,
      medida: data.unit,
      simulado: false // Define explicitamente que é um consumo real, não simulação
    });
    return response.data;
  },
  // Cria um novo registro de simulação no banco de dados
  createSimulation: async (data) => {
    const response = await api.post('/consumo/create', {
      valor: parseFloat(data.value),
      dt: toIsoDate(data.date), // Converte a data para ISO
      tipo: data.type,
      medida: data.unit,
      simulado: true // Define como simulação para diferenciar dos consumos reais
    });
    return response.data;
  },
  // Exclui um registro de consumo ou simulação pelo ID
  delete: async (id) => {
    const response = await api.delete(`/consumo/delete?id=${id}`);
    return response.data;
  }
};

// Serviço responsável por gerenciar as metas do usuário
export const goalService = {
  // Busca todas as metas criadas
  getAll: async () => {
    const response = await api.get('/meta/read');
    return response.data;
  },
  // Cria uma nova meta no banco de dados
  create: async (data) => {
    // O backend espera dt_inicio e dt_fim, então usamos toIsoDate para garantir o formato correto
    const response = await api.post('/meta/create', {
      valor: parseFloat(data.value),
      tipo: data.type,
      medida: data.unit,
      dt_inicio: toIsoDate(data.startDate || data.start),
      dt_fim: toIsoDate(data.endDate || data.end)
    });
    return response.data;
  },
  // Exclui uma meta pelo ID
  delete: async (id) => {
    const response = await api.delete(`/meta/delete?id=${id}`);
    return response.data;
  }
};

export default api;
