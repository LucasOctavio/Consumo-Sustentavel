import React, { useContext, useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { AuthLayout } from '../../components/AuthLayout';
import { Card } from '../../components/Card';
import { Input } from '../../components/Input';
import { Button } from '../../components/Button';
import { AuthContext, useTheme } from '../../navigation/AppNavigator';

// ─── Utilitário: formata segundos em MM:SS ────────────────────────────────────
const formatTime = seconds => {
  const m = Math.floor(seconds / 60)
    .toString()
    .padStart(2, '0');
  const s = (seconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
};

// ─── Constantes de segurança ──────────────────────────────────────────────────
const EXPIRY_SECONDS = 10 * 60; // 10 minutos (alinhado ao backend)
const MAX_ATTEMPTS = 5; // Máximo de tentativas antes de bloquear

// ─────────────────────────────────────────────────────────────────────────────
// LoginScreen — dois passos: credenciais → código 2FA
// ─────────────────────────────────────────────────────────────────────────────
export const LoginScreen = ({ navigation }) => {
  const { login, confirmLogin } = useContext(AuthContext);

  // ── Passo 1: credenciais ──
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // ── Passo 2: verificação 2FA ──
  const [step, setStep] = useState(1);
  const [token2fa, setToken2fa] = useState('');
  const [code, setCode] = useState('');
  const [attempts, setAttempts] = useState(0); // tentativas usadas
  const [timeLeft, setTimeLeft] = useState(EXPIRY_SECONDS);
  const [expired, setExpired] = useState(false);
  const timerRef = useRef(null);

  // Inicia/reinicia o contador regressivo quando entra no passo 2
  useEffect(() => {
    if (step === 2) {
      setTimeLeft(EXPIRY_SECONDS);
      setExpired(false);
      clearInterval(timerRef.current);
      timerRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(timerRef.current);
            setExpired(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timerRef.current);
  }, [step, token2fa]); // re-executa ao reenviar (token2fa muda)

  // ── Passo 1: valida credenciais e solicita envio do código ──
  const handleLogin = async () => {
    if (!name || !password) {
      setError('Por favor, preencha todos os campos.');
      return;
    }
    setError('');
    setLoading(true);
    const result = await login(name, password);
    setLoading(false);

    if (result.success) {
      setToken2fa(result.token_2fa);
      setAttempts(0);
      setCode('');
      setStep(2);
    } else {
      setError(result.message);
    }
  };

  // ── Passo 2: valida o código 2FA ──
  const handleVerify2FA = async () => {
    if (expired) {
      setError('O código expirou. Reenvie um novo código.');
      return;
    }
    if (attempts >= MAX_ATTEMPTS) {
      setError(
        'Número máximo de tentativas atingido. Volte e tente novamente.',
      );
      return;
    }
    if (!code || code.length < 6) {
      setError('Digite o código de 6 dígitos enviado por e-mail.');
      return;
    }

    setError('');
    setLoading(true);
    const result = await confirmLogin(code, token2fa);
    setLoading(false);

    if (!result.success) {
      const novasT = attempts + 1;
      setAttempts(novasT);
      if (novasT >= MAX_ATTEMPTS) {
        setError(
          `Limite de ${MAX_ATTEMPTS} tentativas atingido. Por favor, volte e tente novamente.`,
        );
      } else {
        setError(
          `${result.message} (${MAX_ATTEMPTS - novasT} tentativa(s) restante(s))`,
        );
      }
    }
    // Se success, o AppNavigator detecta isAuthenticated e redireciona automaticamente
  };

  // ── Reenviar código: chama o passo 1 novamente usando as mesmas credenciais ──
  const handleResend = async () => {
    setError('');
    setCode('');
    setLoading(true);
    const result = await login(name, password);
    setLoading(false);
    if (result.success) {
      setToken2fa(result.token_2fa);
      setAttempts(0);
      // O useEffect detecta a mudança de token2fa e reinicia o timer
    } else {
      setError(result.message || 'Erro ao reenviar o código.');
    }
  };

  // ── Tela do passo 2: verificação 2FA ──
  if (step === 2) {
    const bloqueado = attempts >= MAX_ATTEMPTS;
    return (
      <AuthLayout>
        <Card style={styles.card}>
          <Text style={styles.title}>Verificação 2FA</Text>

          {/* Contador regressivo */}
          <View
            style={[styles.timerBadge, expired && styles.timerBadgeExpired]}>
            <Text
              style={[styles.timerText, expired && styles.timerTextExpired]}>
              {expired
                ? 'Código expirado'
                : `Código válido por: ${formatTime(timeLeft)}`}
            </Text>
          </View>

          <Text style={styles.subtitle}>
            Enviamos um código de 6 dígitos para o e-mail vinculado à conta.
            {'\n'}
            Digite-o abaixo para concluir o login.
          </Text>

          {/* Indicador de tentativas */}
          <View style={styles.attemptsRow}>
            {[...Array(MAX_ATTEMPTS)].map((_, i) => (
              <View
                key={i}
                style={[
                  styles.attemptDot,
                  i < attempts ? styles.attemptDotUsed : styles.attemptDotFree,
                ]}
              />
            ))}
          </View>
          <Text style={styles.attemptsLabel}>
            {bloqueado
              ? 'Limite atingido'
              : `${MAX_ATTEMPTS - attempts} tentativa(s) restante(s)`}
          </Text>

          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          <Input
            placeholder="000000"
            keyboardType="numeric"
            maxLength={6}
            value={code}
            editable={!bloqueado && !expired}
            onChangeText={t => {
              setCode(t);
              setError('');
            }}
            style={{ textAlign: 'center', fontSize: 26, letterSpacing: 12 }}
          />

          <Button
            title={loading ? 'Verificando...' : 'Confirmar'}
            onPress={handleVerify2FA}
            style={[styles.btn, (bloqueado || expired) && styles.btnDisabled]}
            disabled={bloqueado || expired || loading}
          />

          {/* Botão de reenvio — disponível após expiração ou por precaução */}
          <TouchableOpacity
            onPress={handleResend}
            disabled={loading}
            style={{ marginTop: 14, alignItems: 'center' }}>
            <Text style={styles.linkBlue}>
              {loading ? 'Reenviando...' : 'Reenviar código'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => {
              setStep(1);
              setCode('');
              setError('');
              setAttempts(0);
              clearInterval(timerRef.current);
            }}
            style={{ marginTop: 10, alignItems: 'center' }}>
            <Text style={{ color: '#888', fontSize: 13 }}>
              ← Voltar para o login
            </Text>
          </TouchableOpacity>
        </Card>
      </AuthLayout>
    );
  }

  // ── Tela do passo 1: nome + senha ──
  return (
    <AuthLayout>
      <Card style={styles.card}>
        <Text style={styles.title}>Faça o login</Text>
        {error ? <Text style={styles.errorText}>{error}</Text> : null}
        <Input
          placeholder="Nome"
          value={name}
          onChangeText={t => {
            setName(t);
            setError('');
          }}
        />
        <Input
          placeholder="Senha"
          secureTextEntry
          value={password}
          onChangeText={t => {
            setPassword(t);
            setError('');
          }}
        />

        <Button
          title={loading ? 'Enviando código...' : 'Entrar'}
          onPress={handleLogin}
          style={styles.btn}
          disabled={loading}
        />

        <TouchableOpacity
          onPress={() => navigation.navigate('Recovery')}
          style={{ marginTop: 12, alignItems: 'center' }}>
          <Text style={styles.forgotPasswordText}>Esqueceu a senha?</Text>
        </TouchableOpacity>
      </Card>

      <View style={styles.footerLinks}>
        <TouchableOpacity onPress={() => navigation.navigate('Register')}>
          <Text style={styles.footerLinkText}>
            Não tem uma conta ainda?{' '}
            <Text style={styles.linkBlue}>cadastrar</Text>
          </Text>
        </TouchableOpacity>
      </View>
    </AuthLayout>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// RegisterScreen — cadastro com e-mail de verificação
// ─────────────────────────────────────────────────────────────────────────────
export const RegisterScreen = ({ navigation }) => {
  const { register } = useContext(AuthContext);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const handleRegister = async () => {
    if (!name || !email || !password) {
      setError('Por favor, preencha todos os campos.');
      return;
    }
    if (!email.includes('@')) {
      setError('Formato de email inválido.');
      return;
    }
    if (password.length < 6) {
      setError('A senha deve conter no mínimo 6 caracteres.');
      return;
    }

    setError('');
    setLoading(true);
    const result = await register(name, email, password);
    setLoading(false);

    if (result.success) {
      setDone(true);
    } else {
      setError(result.message);
    }
  };

  if (done) {
    return (
      <AuthLayout>
        <Card style={styles.card}>
          <Text style={styles.title}>Verifique seu e-mail</Text>
          <Text style={styles.subtitle}>
            Cadastro realizado com sucesso! Enviamos um link de verificação para{' '}
            {email} {'\n\n'}
            Após verificar seu e-mail, volte aqui e faça login.
          </Text>
          <Button
            title="Ir para o Login"
            onPress={() => navigation.navigate('Login')}
            style={styles.btn}
          />
        </Card>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout>
      <Card style={styles.card}>
        <Text style={styles.title}>Faça o cadastro</Text>
        {error ? <Text style={styles.errorText}>{error}</Text> : null}
        <Input
          placeholder="Nome"
          value={name}
          onChangeText={t => {
            setName(t);
            setError('');
          }}
        />
        <Input
          placeholder="Email"
          keyboardType="email-address"
          value={email}
          onChangeText={t => {
            setEmail(t);
            setError('');
          }}
        />
        <Input
          placeholder="Senha"
          secureTextEntry
          value={password}
          onChangeText={t => {
            setPassword(t);
            setError('');
          }}
        />
        <Button
          title={loading ? 'Cadastrando...' : 'Cadastrar'}
          onPress={handleRegister}
          style={styles.btn}
          disabled={loading}
        />
      </Card>

      <TouchableOpacity
        onPress={() => navigation.navigate('Login')}
        style={styles.footerLinks}>
        <Text style={styles.footerLinkText}>
          Já tem cadastro? Faça seu <Text style={styles.linkBlue}>login</Text>
        </Text>
      </TouchableOpacity>
    </AuthLayout>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// RecoveryScreen — solicita e-mail para enviar o código de recuperação
// ─────────────────────────────────────────────────────────────────────────────
export const RecoveryScreen = ({ navigation }) => {
  const { forgotPassword } = useContext(AuthContext);
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSendCode = async () => {
    if (!email || !email.includes('@')) {
      setError('Por favor, insira um e-mail válido.');
      return;
    }
    setError('');
    setLoading(true);
    const result = await forgotPassword(email);
    setLoading(false);

    if (result.success) {
      // Navega para a tela de código passando o token recebido (ou null se e-mail não existir)
      navigation.navigate('ResetCode', {
        email,
        tokenReset: result.tokenReset,
      });
    } else {
      setError(result.message);
    }
  };

  return (
    <AuthLayout>
      <TouchableOpacity
        onPress={() => navigation.goBack()}
        style={styles.backBtn}>
        <Text style={styles.backBtnText}>{'← Voltar'}</Text>
      </TouchableOpacity>

      <Card style={styles.card}>
        <Text style={styles.title}>Redefinir senha</Text>
        {error ? <Text style={styles.errorText}>{error}</Text> : null}
        <Text style={styles.subtitle}>
          Insira o endereço de e-mail da sua conta e enviaremos um código de
          segurança para redefinir a senha.
        </Text>

        <Text style={styles.label}>Endereço de e-mail</Text>
        <Input
          placeholder="Email"
          keyboardType="email-address"
          value={email}
          onChangeText={t => {
            setEmail(t);
            setError('');
          }}
        />

        <Button
          title={loading ? 'Enviando...' : 'Enviar Código'}
          onPress={handleSendCode}
          style={styles.btn}
          disabled={loading}
        />
      </Card>
    </AuthLayout>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// ResetCodeScreen — digita o código de 6 dígitos recebido por e-mail
// ─────────────────────────────────────────────────────────────────────────────
export const ResetCodeScreen = ({ navigation, route }) => {
  const { email, tokenReset } = route.params || {};
  const { forgotPassword } = useContext(AuthContext);
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [currentToken, setCurrentToken] = useState(tokenReset);

  // Contador regressivo para o código de recuperação (10 min)
  const [timeLeft, setTimeLeft] = useState(EXPIRY_SECONDS);
  const [expired, setExpired] = useState(false);
  const timerRef = useRef(null);

  useEffect(() => {
    clearInterval(timerRef.current);
    setTimeLeft(EXPIRY_SECONDS);
    setExpired(false);
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          setExpired(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [currentToken]);

  const handleVerify = () => {
    if (expired) {
      setError('O código expirou. Reenvie um novo código.');
      return;
    }
    if (code.length < 6) {
      setError('O código deve ter 6 dígitos.');
      return;
    }
    setError('');
    // Passa o código e o token para a tela de nova senha
    navigation.navigate('NewPassword', {
      email,
      codigo: code,
      tokenReset: currentToken,
    });
  };

  const handleResend = async () => {
    setError('');
    setCode('');
    setLoading(true);
    const result = await forgotPassword(email);
    setLoading(false);
    if (result.success) {
      setCurrentToken(result.tokenReset);
      // O useEffect vai reiniciar o timer ao detectar currentToken diferente
    } else {
      setError(result.message || 'Erro ao reenviar o código.');
    }
  };

  return (
    <AuthLayout>
      <TouchableOpacity
        onPress={() => navigation.goBack()}
        style={styles.backBtn}>
        <Text style={styles.backBtnText}>{'← Voltar'}</Text>
      </TouchableOpacity>

      <Card style={styles.card}>
        <Text style={styles.title}>Verificar Código</Text>

        {/* Contador */}
        <View style={[styles.timerBadge, expired && styles.timerBadgeExpired]}>
          <Text style={[styles.timerText, expired && styles.timerTextExpired]}>
            {expired
              ? 'Código expirado'
              : `Válido por: ${formatTime(timeLeft)}`}
          </Text>
        </View>

        {error ? <Text style={styles.errorText}>{error}</Text> : null}
        <Text style={styles.subtitle}>
          Digite o código de 6 dígitos enviado para {email}.
        </Text>

        <Input
          placeholder="000000"
          keyboardType="numeric"
          maxLength={6}
          value={code}
          editable={!expired}
          onChangeText={t => {
            setCode(t);
            setError('');
          }}
          style={{ textAlign: 'center', fontSize: 26, letterSpacing: 12 }}
        />

        <Button
          title="Verificar"
          onPress={handleVerify}
          style={[styles.btn, expired && styles.btnDisabled]}
          disabled={expired}
        />

        <TouchableOpacity
          onPress={handleResend}
          disabled={loading}
          style={{ marginTop: 14, alignItems: 'center' }}>
          <Text style={styles.linkBlue}>
            {loading ? 'Reenviando...' : '🔄 Reenviar código'}
          </Text>
        </TouchableOpacity>
      </Card>
    </AuthLayout>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// NewPasswordScreen — define a nova senha após validar o código
// ─────────────────────────────────────────────────────────────────────────────
export const NewPasswordScreen = ({ navigation, route }) => {
  const { resetPasswordByCode } = useContext(AuthContext);
  const { email, codigo, tokenReset } = route.params || {};
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleReset = async () => {
    if (!password || password.length < 6) {
      setError('A senha deve conter no mínimo 6 caracteres.');
      return;
    }
    if (password !== confirmPassword) {
      setError('As senhas não coincidem.');
      return;
    }

    // Sem token (e-mail não cadastrado): backend retorna mensagem genérica por segurança
    if (!tokenReset) {
      Alert.alert(
        'Atenção',
        'Código inválido ou e-mail não cadastrado. Tente novamente.',
      );
      navigation.navigate('Recovery');
      return;
    }

    setError('');
    setLoading(true);
    const result = await resetPasswordByCode(codigo, tokenReset, password);
    setLoading(false);

    if (result.success) {
      Alert.alert('Sucesso! 🎉', 'Sua senha foi redefinida com sucesso!', [
        { text: 'Fazer Login', onPress: () => navigation.navigate('Login') },
      ]);
    } else {
      setError(result.message);
    }
  };

  return (
    <AuthLayout>
      <Card style={styles.card}>
        <Text style={styles.title}>Nova Senha</Text>
        {error ? <Text style={styles.errorText}>{error}</Text> : null}
        <Text style={styles.subtitle}>Criando nova senha para: {email}</Text>

        <Input
          placeholder="Nova Senha"
          secureTextEntry
          value={password}
          onChangeText={t => {
            setPassword(t);
            setError('');
          }}
        />
        <Input
          placeholder="Confirmar Senha"
          secureTextEntry
          value={confirmPassword}
          onChangeText={t => {
            setConfirmPassword(t);
            setError('');
          }}
        />

        <Button
          title={loading ? 'Redefinindo...' : 'Redefinir Senha'}
          onPress={handleReset}
          style={styles.btn}
          disabled={loading}
        />
      </Card>
    </AuthLayout>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Estilos
// ─────────────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  card: {
    borderRadius: 35,
    padding: 30,
    marginTop: 20,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 10,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 14,
    color: '#000',
  },
  errorText: {
    color: '#FF4C4C',
    fontSize: 13,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 12,
    textAlign: 'center',
    marginBottom: 18,
    color: '#666',
    lineHeight: 18,
  },
  label: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: -3,
  },
  btn: {
    backgroundColor: '#009DFF',
    borderRadius: 20,
    height: 55,
    marginTop: 15,
  },
  btnDisabled: {
    backgroundColor: '#A0C4E8',
  },
  footerLinks: {
    alignItems: 'center',
    marginTop: 30,
  },
  footerLinkText: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#000',
  },
  linkBlue: {
    color: '#009DFF',
    fontWeight: 'bold',
    fontSize: 14,
  },
  forgotPasswordText: {
    color: '#009DFF',
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: 4,
  },
  backBtn: {
    alignSelf: 'flex-start',
    marginBottom: 10,
  },
  backBtnText: {
    color: '#1E2C5A',
    fontSize: 14,
    fontWeight: 'bold',
  },
  // ── Timer badge ──
  timerBadge: {
    backgroundColor: '#E8F5E9',
    borderRadius: 12,
    paddingVertical: 6,
    paddingHorizontal: 16,
    alignSelf: 'center',
    marginBottom: 14,
  },
  timerBadgeExpired: {
    backgroundColor: '#FFEBEE',
  },
  timerText: {
    color: '#2E7D32',
    fontWeight: 'bold',
    fontSize: 13,
  },
  timerTextExpired: {
    color: '#C62828',
  },
  // ── Dots de tentativas ──
  attemptsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 4,
  },
  attemptsLabel: {
    textAlign: 'center',
    color: '#888',
    fontSize: 12,
    marginBottom: 10,
  },
  attemptDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  attemptDotFree: {
    backgroundColor: '#A5D6A7',
  },
  attemptDotUsed: {
    backgroundColor: '#EF9A9A',
  },
});
