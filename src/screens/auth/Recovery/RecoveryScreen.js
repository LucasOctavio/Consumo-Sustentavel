import React, { useContext, useState } from 'react';
import { Text, StyleSheet, TouchableOpacity } from 'react-native';
import { AuthLayout } from '../../../components/AuthLayout';
import { Card } from '../../../components/Card';
import { Input } from '../../../components/Input';
import { Button } from '../../../components/Button';
import { AuthContext } from '../../../navigation/AppNavigator';

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
    // Chama o endpoint real do backend: POST /usuario/forgot_password
    const result = await forgotPassword(email);
    setLoading(false);

    if (result.success) {
      // Navega passando o token temporário (ou null se o e-mail não existir — segurança)
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
    marginBottom: 16,
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
  backBtn: {
    alignSelf: 'flex-start',
    marginBottom: 10,
  },
  backBtnText: {
    color: '#1E2C5A',
    fontSize: 14,
    fontWeight: 'bold',
  },
});
