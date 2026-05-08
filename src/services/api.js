import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const api = axios.create({
  baseURL: 'https://consumo-sustentavel.onrender.com',
  // baseURL: 'http://localhost:8000', // desenvolvimento local
});

// Interceptor: adiciona o token Bearer em todas as requisições autenticadas
api.interceptors.request.use(
  async config => {
    try {
      const token = await AsyncStorage.getItem('@CCN:token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.error('Erro ao ler token no interceptor:', error);
    }
    return config;
  },
  error => {
    return Promise.reject(error);
  },
);

/**
 * Define o token de autorização diretamente na instância do axios.
 * Útil para sincronização imediata após o login sem depender do AsyncStorage.
 */
export const setAuthToken = token => {
  if (token) {
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  } else {
    delete api.defaults.headers.common['Authorization'];
  }
};

// ─── Usuário ────────────────────────────────────────────────────────────────

export const authService = {
  /**
   * POST /usuario/send_2fa_email
   * Body: { nome: string, senha: string }
   * Valida credenciais e envia o código 2FA por e-mail.
   * Retorna: { message, token_2fa }
   */
  send2fa: async (name, password) => {
    const response = await api.post('/usuario/send_2fa_email', {
      nome: name,
      senha: password,
    });
    return response.data;
  },

  /**
   * POST /usuario/verify_2fa
   * Body: { codigo: string, token_2fa: string }
   * Verifica o código 2FA e retorna os tokens de sessão.
   * Retorna: { access_token, refresh_token, token_type }
   */
  verify2fa: async (codigo, token2fa) => {
    const response = await api.post('/usuario/verify_2fa', {
      codigo,
      token_2fa: token2fa,
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
  update: async userData => {
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

  /**
   * POST /usuario/forgot_password
   * Body: { email: EmailStr }
   * Envia código de recuperação de senha por e-mail.
   * Retorna: { message, token_reset }
   */
  forgotPassword: async email => {
    const response = await api.post('/usuario/forgot_password', { email });
    return response.data;
  },

  /**
   * POST /usuario/reset_password
   * Body: { codigo: string, token_reset: string, nova_senha: string }
   * Valida o código e atualiza a senha do usuário.
   */
  resetPassword: async (codigo, tokenReset, novaSenha) => {
    const response = await api.post('/usuario/reset_password', {
      codigo,
      token_reset: tokenReset,
      nova_senha: novaSenha,
    });
    return response.data;
  },

  /**
   * POST /usuario/resend_verification
   * Body: { nome: string, email: EmailStr, senha: string }
   * Reenvia o link de verificação de cadastro para o e-mail informado.
   */
  resendVerification: async (nome, email, senha) => {
    const response = await api.post('/usuario/resend_verification', {
      nome,
      email,
      senha,
    });
    return response.data;
  },
};

// ─── Utilitário de data ──────────────────────────────────────────────────────

/**
 * Converte DD/MM/YYYY → "YYYY-MM-DDTHH:mm:ss"
 * O backend espera datetime (não apenas date)
 */
const toIsoDateTime = dateStr => {
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

  getAllSimulations: async () => {
    const response = await api.get('/consumo/read_simulados');
    return response.data;
  },

  /**
   * POST /consumo/create  (requer Bearer token)
   * Body (ConsumoSchema): { tipo, valor, medida, dt: datetime, simulado: bool }
   */
  create: async data => {
    const response = await api.post('/consumo/create', {
      tipo: data.type,
      valor: parseFloat(data.value),
      medida: data.unit,
      dt: toIsoDateTime(data.date),
      simulado: false,
      descricao: data.description,
    });
    return response.data;
  },

  createSimulation: async data => {
    const response = await api.post('/consumo/create', {
      tipo: data.type,
      valor: parseFloat(data.value),
      medida: data.unit,
      dt: toIsoDateTime(data.date),
      simulado: true,
      descricao: data.description,
    });
    return response.data;
  },

  /**
   * DELETE /consumo/delete?con_id=<id>  (requer Bearer token)
   * Parâmetro query: con_id (não "id")
   */
  delete: async id => {
    const response = await api.delete(`/consumo/delete?con_id=${id}`);
    return response.data;
  },

  /**
   * PATCH /consumo/update (requer Bearer token)
   * Body (ConsumoUpdate): { con_id, con_tipo, con_valor, con_medida, con_dt, con_simulado, con_descricao }
   */
  update: async data => {
    const response = await api.patch('/consumo/update', {
      con_id: data.id,
      con_tipo: data.type,
      con_valor: parseFloat(data.value),
      con_medida: data.unit,
      con_dt: toIsoDateTime(data.date),
      con_simulado: data.simulated || false,
      con_descricao: data.description,
    });
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
  create: async data => {
    const response = await api.post('/meta/create', {
      tipo: data.type,
      valor: parseFloat(data.value),
      medida: data.unit,
      dt_inicio: toIsoDateTime(data.startDate || data.start),
      dt_fim: toIsoDateTime(data.endDate || data.end),
      descricao: data.description,
    });
    return response.data;
  },

  /**
   * DELETE /meta/delete?meta_id=<id>  (requer Bearer token)
   * Parâmetro query: meta_id (não "id")
   */
  delete: async id => {
    const response = await api.delete(`/meta/delete?meta_id=${id}`);
    return response.data;
  },

  /**
   * PATCH /meta/update (requer Bearer token)
   * Body (MetaUpdate): { meta_id, tipo, valor, medida, dt_inicio, dt_fim, descricao }
   */
  update: async data => {
    const response = await api.patch('/meta/update', {
      meta_id: data.id,
      tipo: data.type,
      valor: parseFloat(data.value),
      medida: data.unit,
      dt_inicio: toIsoDateTime(data.startDate),
      dt_fim: toIsoDateTime(data.endDate),
      meta_descricao: data.description,
    });
    return response.data;
  },
};

// ─── Foto ─────────────────────────────────────────────────────────────────────

export const photoService = {
  /**
   * POST /foto/create (requer Bearer token)
   * Body: FormData { foto: binary }
   */
  upload: async formData => {
    const response = await api.post('/foto/create', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  /**
   * GET /foto/read (requer Bearer token)
   * Retorna a foto do usuário
   */
  get: async () => {
    const response = await api.get('/foto/read', {
      responseType: 'blob',
    });
    return response.data;
  },
};

export default api;
