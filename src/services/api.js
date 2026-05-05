import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const api = axios.create({
  baseURL: 'https://consumo-sustentavel.onrender.com',
  // baseURL: 'http://localhost:8000', // desenvolvimento local
});

// Interceptor: adiciona o token Bearer em todas as requisições autenticadas
api.interceptors.request.use(async (config) => {
  try {
    const token = await AsyncStorage.getItem('@CCN:token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  } catch (error) {
    console.error('Erro ao ler token:', error);
  }
  return config;
});

// ─── Usuário ────────────────────────────────────────────────────────────────

export const authService = {
  /**
   * POST /usuario/login
   * Body: { nome: string, senha: string }
   * Retorna: { access_token, refresh_token, token_type }
   */
  login: async (name, password) => {
    const response = await api.post('/usuario/login', {
      nome: name,
      senha: password,
    });
    return response.data;
  },

  /**
   * POST /usuario/sign_up
   * Body: { nome: string, email: EmailStr, senha: string }
   * Retorna confirmação de cadastro
   */
  register: async (name, email, password) => {
    const response = await api.post('/usuario/sign_up', {
      nome: name,
      email: email,
      senha: password,
    });
    return response.data;
  },

  /**
   * GET /usuario/read  (requer Bearer token)
   * Retorna dados do usuário autenticado
   */
  getUserInfo: async () => {
    const response = await api.get('/usuario/read');
    return response.data;
  },

  /**
   * PATCH /usuario/update  (requer Bearer token)
   * Body (UsuarioUpdate): { user_name?: string, user_senha?: string }
   * Nota: e-mail NÃO pode ser alterado diretamente — apenas nome e senha
   */
  update: async (userData) => {
    const payload = {};
    if (userData.name && userData.name.trim().length > 0) {
      payload.user_name = userData.name.trim();
    }
    if (userData.password && userData.password.trim().length > 0) {
      payload.user_senha = userData.password.trim();
    }
    const response = await api.patch('/usuario/update', payload);
    return response.data;
  },

  /**
   * DELETE /usuario/delete  (requer Bearer token)
   */
  deleteAccount: async () => {
    const response = await api.delete('/usuario/delete');
    return response.data;
  },
};

// ─── Utilitário de data ──────────────────────────────────────────────────────

/**
 * Converte DD/MM/YYYY → "YYYY-MM-DDTHH:mm:ss"
 * O backend espera datetime (não apenas date)
 */
const toIsoDateTime = (dateStr) => {
  if (!dateStr) return null;
  const s = String(dateStr);
  // Já é datetime ISO
  if (s.includes('T')) return s;
  // DD/MM/YYYY → YYYY-MM-DDTHH:mm:ss
  if (s.includes('/')) {
    const [day, month, year] = s.split('/');
    return `${year}-${month}-${day}T00:00:00`;
  }
  // YYYY-MM-DD → adiciona horário
  if (s.includes('-') && s.length === 10) {
    return `${s}T00:00:00`;
  }
  return s;
};

// ─── Consumo ─────────────────────────────────────────────────────────────────

export const consumptionService = {
  /**
   * GET /consumo/read  (requer Bearer token)
   * Retorna lista de consumos do usuário
   */
  getAll: async () => {
    const response = await api.get('/consumo/read');
    return response.data;
  },

  /**
   * POST /consumo/create  (requer Bearer token)
   * Body (ConsumoSchema): { tipo, valor, medida, dt: datetime, simulado: bool }
   */
  create: async (data) => {
    const response = await api.post('/consumo/create', {
      tipo: data.type,
      valor: parseFloat(data.value),
      medida: data.unit,
      dt: toIsoDateTime(data.date),
      simulado: false,
    });
    return response.data;
  },

  createSimulation: async (data) => {
    const response = await api.post('/consumo/create', {
      tipo: data.type,
      valor: parseFloat(data.value),
      medida: data.unit,
      dt: toIsoDateTime(data.date),
      simulado: true,
    });
    return response.data;
  },

  /**
   * DELETE /consumo/delete?con_id=<id>  (requer Bearer token)
   * Parâmetro query: con_id (não "id")
   */
  delete: async (id) => {
    const response = await api.delete(`/consumo/delete?con_id=${id}`);
    return response.data;
  },
};

// ─── Meta ─────────────────────────────────────────────────────────────────────

export const goalService = {
  /**
   * GET /meta/read  (requer Bearer token)
   */
  getAll: async () => {
    const response = await api.get('/meta/read');
    return response.data;
  },

  /**
   * POST /meta/create  (requer Bearer token)
   * Body (MetaSchema): { tipo, valor, medida, dt_inicio: datetime, dt_fim: datetime }
   */
  create: async (data) => {
    const response = await api.post('/meta/create', {
      tipo: data.type,
      valor: parseFloat(data.value),
      medida: data.unit,
      dt_inicio: toIsoDateTime(data.startDate || data.start),
      dt_fim: toIsoDateTime(data.endDate || data.end),
    });
    return response.data;
  },

  /**
   * DELETE /meta/delete?meta_id=<id>  (requer Bearer token)
   * Parâmetro query: meta_id (não "id")
   */
  delete: async (id) => {
    const response = await api.delete(`/meta/delete?meta_id=${id}`);
    return response.data;
  },
};

export default api;
