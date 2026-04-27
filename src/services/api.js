import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const api = axios.create({
  baseURL: 'https://consumo-sustentavel.onrender.com',
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
    // API expects user_name, user_email, user_senha
    const response = await api.patch('/usuario/update', {
      user_name: userData.name,
      user_email: userData.email,
      user_senha: userData.password
    });
    return response.data;
  }
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
      data: data.date,
      tipo: data.type,
      medida: data.unit
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
    const response = await api.post('/meta/create', {
      valor: parseFloat(data.value),
      tipo: data.type,
      medida: data.unit,
      data_inicio: data.start,
      data_fim: data.end
    });
    return response.data;
  },
  delete: async (id) => {
    const response = await api.delete(`/meta/delete?id=${id}`);
    return response.data;
  }
};

export default api;
