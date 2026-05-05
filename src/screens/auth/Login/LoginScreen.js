import React, { useContext, useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { AuthLayout } from '../../../components/AuthLayout';
import { Card } from '../../../components/Card';
import { Input } from '../../../components/Input';
import { Button } from '../../../components/Button';
import { AuthContext } from '../../../navigation/AppNavigator';

// ─── Utilitário: formata segundos em MM:SS ────────────────────────────────────
const formatTime = (seconds) => {
  const m = Math.floor(seconds / 60).toString().padStart(2, '0');
  const s = (seconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
};

const EXPIRY_SECONDS = 10 * 60; // 10 minutos (alinhado ao backend)
const MAX_ATTEMPTS = 5;         // Máximo de tentativas antes de bloquear

export const LoginScreen = ({ navigation }) => {
  const { login, confirmLogin } = useContext(AuthContext);

  // ── Passo 1: credenciais ──
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // ── Passo 2: verificação 2FA ──
  const [step, setStep] = useState(1);
  const [token2fa, setToken2fa] = useState('');
  const [code, setCode] = useState('');
  const [attempts, setAttempts] = useState(0);
  const [timeLeft, setTimeLeft] = useState(EXPIRY_SECONDS);
  const [expired, setExpired] = useState(false);
  const timerRef = useRef(null);

  // Inicia/reinicia o contador regressivo quando entra no passo 2 ou ao reenviar
  useEffect(() => {
    if (step === 2) {
      setTimeLeft(EXPIRY_SECONDS);
      setExpired(false);
      clearInterval(timerRef.current);
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
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

  // ── Passo 1: valida credenciais e solicita envio do código 2FA ──
  const handleLogin = async () => {
    if (!identifier || !password) {
      setError('Por favor, preencha todos os campos.');
      return;
    }
    setError('');
    setLoading(true);
    const result = await login(identifier, password);
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
      setError('O código expirou. Por favor, reenvie um novo código.');
      return;
    }
    if (attempts >= MAX_ATTEMPTS) {
      setError('Número máximo de tentativas atingido. Volte e tente novamente.');
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
        setError(`Limite de ${MAX_ATTEMPTS} tentativas atingido. Por favor, volte e tente novamente.`);
      } else {
        setError(`${result.message} (${MAX_ATTEMPTS - novasT} tentativa(s) restante(s))`);
      }
    }
    // Se success, o AppNavigator detecta isAuthenticated e navega automaticamente
  };

  // ── Reenviar código: chama o passo 1 novamente com as mesmas credenciais ──
  const handleResend = async () => {
    setError('');
    setCode('');
    setLoading(true);
    const result = await login(identifier, password);
    setLoading(false);
    if (result.success) {
      setToken2fa(result.token_2fa);
      setAttempts(0);
      // useEffect detecta mudança em token2fa e reinicia o timer
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
          <View style={[styles.timerBadge, expired && styles.timerBadgeExpired]}>
            <Text style={[styles.timerText, expired && styles.timerTextExpired]}>
              {expired ? 'Código expirado' : `Código válido por: ${formatTime(timeLeft)}`}
            </Text>
          </View>

          <Text style={styles.subtitle}>
            Enviamos um código de 6 dígitos para o e-mail vinculado à conta.{'\n'}
            Digite-o abaixo para concluir o login.
          </Text>

          {/* Indicador visual de tentativas */}
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
            onChangeText={(t) => { setCode(t); setError(''); }}
            style={{ textAlign: 'center', fontSize: 26, letterSpacing: 12 }}
          />

          <Button
            title={loading ? 'Verificando...' : 'Confirmar'}
            onPress={handleVerify2FA}
            style={[styles.btn, (bloqueado || expired) && styles.btnDisabled]}
            disabled={bloqueado || expired || loading}
          />

          {/* Botão de reenvio */}
          <TouchableOpacity
            onPress={handleResend}
            disabled={loading}
            style={{ marginTop: 14, alignItems: 'center' }}
          >
            <Text style={styles.linkBlue}>
              {loading ? 'Reenviando...' : '🔄 Reenviar código'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => {
              setStep(1); setCode(''); setError('');
              setAttempts(0); clearInterval(timerRef.current);
            }}
            style={{ marginTop: 10, alignItems: 'center' }}
          >
            <Text style={{ color: '#888', fontSize: 13 }}>← Voltar para o login</Text>
          </TouchableOpacity>
        </Card>
      </AuthLayout>
    );
  }

  // ── Tela do passo 1: nome + senha ──
  return (
    <AuthLayout>
      <Card style={styles.card}>
        <Text style={styles.title}>Faça seu login</Text>
        {error ? <Text style={styles.errorText}>{error}</Text> : null}
        <Input
          placeholder="Nome de usuário"
          value={identifier}
          onChangeText={(t) => { setIdentifier(t); setError(''); }}
        />
        <Input
          placeholder="Senha"
          secureTextEntry
          value={password}
          onChangeText={(t) => { setPassword(t); setError(''); }}
        />
        <Button
          title={loading ? 'Enviando código...' : 'Entrar'}
          onPress={handleLogin}
          style={styles.btn}
          disabled={loading}
        />
        <TouchableOpacity
          onPress={() => navigation.navigate('Recovery')}
          style={{ marginTop: 12, alignItems: 'center' }}
        >
          <Text style={styles.forgotPasswordText}>Esqueceu a senha?</Text>
        </TouchableOpacity>
      </Card>

      <TouchableOpacity onPress={() => navigation.navigate('Register')} style={styles.footerLinks}>
        <Text style={styles.footerLinkText}>
          Não tem conta? <Text style={styles.linkBlue}>Cadastrar</Text>
        </Text>
      </TouchableOpacity>
    </AuthLayout>
  );
};

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
    marginBottom: 14,
    color: '#666',
    lineHeight: 18,
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
    marginTop: 20,
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
  },
  timerBadge: {
    backgroundColor: '#E8F5E9',
    borderRadius: 12,
    paddingVertical: 6,
    paddingHorizontal: 16,
    alignSelf: 'center',
    marginBottom: 12,
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