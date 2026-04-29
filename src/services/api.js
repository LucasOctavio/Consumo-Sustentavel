import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const api = axios.create({
  // URL para produção (Render)
  baseURL: 'https://consumo-sustentavel.onrender.com',
  // URL para desenvolvimento local (descomente para usar o backend local)
  // baseURL: 'http://localhost:8000', 
});

// Interceptor to add the token to every request
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

export const authService = {
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

export const consumptionService = {
  getAll: async () => {
    const response = await api.get('/consumo/read');
    return response.data;
  },
  create: async (data) => {
    // Mapping our local data keys to API expected keys if necessary
    // API expect: { valor, data, tipo, medida } (guessing based on docs)
    const response = await api.post('/consumo/create', {
      valor: parseFloat(data.value),
      dt: toIsoDate(data.date), // Converte para o formato do backend
      tipo: data.type,
      medida: data.unit,
      simulado: false // Campo obrigatório no backend
    });
    return response.data;
  },
  delete: async (id) => {
    const response = await api.delete(`/consumo/delete?id=${id}`);
    return response.data;
  }
};

export const goalService = {
  getAll: async () => {
    const response = await api.get('/meta/read');
    return response.data;
  },
  create: async (data) => {
    // O modal envia startDate/endDate; suporta também start/end por compatibilidade
    const response = await api.post('/meta/create', {
      valor: parseFloat(data.value),
      tipo: data.type,
      medida: data.unit,
      dt_inicio: toIsoDate(data.startDate || data.start),
      dt_fim: toIsoDate(data.endDate || data.end)
    });
    return response.data;
  },
  delete: async (id) => {
    const response = await api.delete(`/meta/delete?id=${id}`);
    return response.data;
  }
};

export default api;
