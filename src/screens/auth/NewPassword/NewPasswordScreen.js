import React, { useContext, useState } from 'react';
import { Text, StyleSheet, Alert } from 'react-native';
import { AuthLayout } from '../../../components/AuthLayout';
import { Card } from '../../../components/Card';
import { Input } from '../../../components/Input';
import { Button } from '../../../components/Button';
import { AuthContext } from '../../../navigation/AppNavigator';

export const NewPasswordScreen = ({ navigation, route }) => {
  const { resetPasswordByCode } = useContext(AuthContext);
  // Recebe o e-mail, código e token vindos da tela anterior
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

    // Se não houver token, o e-mail não estava cadastrado (segurança — não revelamos isso antes)
    if (!tokenReset) {
      Alert.alert('Atenção', 'Código inválido ou e-mail não cadastrado. Tente novamente.');
      navigation.navigate('Recovery');
      return;
    }

    setError('');
    setLoading(true);
    // Chama o endpoint real do backend: POST /usuario/reset_password
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
        <Text style={styles.subtitle}>
          Criando nova senha para: {email}
        </Text>

        <Input
          placeholder="Nova Senha"
          secureTextEntry
          value={password}
          onChangeText={(t) => { setPassword(t); setError(''); }}
        />
        <Input
          placeholder="Confirmar Senha"
          secureTextEntry
          value={confirmPassword}
          onChangeText={(t) => { setConfirmPassword(t); setError(''); }}
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
  btn: {
    backgroundColor: '#009DFF',
    borderRadius: 20,
    height: 55,
    marginTop: 15,
  },
});
