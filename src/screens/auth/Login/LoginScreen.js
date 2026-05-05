import React, { useContext, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, TouchableWithoutFeedback, Keyboard } from 'react-native';
import { AuthLayout } from '../../../components/AuthLayout';
import { Card } from '../../../components/Card';
import { Input } from '../../../components/Input';
import { Button } from '../../../components/Button';
import { AuthContext, useTheme } from '../../../navigation/AppNavigator';

export const LoginScreen = ({ navigation }) => {
  const { login } = useContext(AuthContext);
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = async () => {
    if (!identifier || !password) {
      setError("Por favor, preencha todos os campos.");
      return;
    }

    setError('');
    const result = await login(identifier, password);
    if (!result.success) {
      setError(result.message);
    }
  };

  return (
    <AuthLayout>
      <Card style={styles.card}>
        <Text style={styles.title}>Faça seu login</Text>
        {error ? <Text style={styles.errorText}>{error}</Text> : null}
        <Input
          placeholder="Email ou nome de usuário"
          keyboardType="email-address"
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
          title="Entrar"
          onPress={handleLogin}
          style={styles.btn}
        />
      </Card>

      <TouchableOpacity onPress={() => navigation.navigate('Recovery')} style={styles.footerLinks}>
        <Text style={styles.footerLinkText}>
          Esqueceu a senha? <Text style={styles.linkBlue}>Recuperar</Text>
        </Text>
      </TouchableOpacity>

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
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 10,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 25,
    color: '#000',
  },
  errorText: {
    color: '#FF4C4C',
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 15,
  },
  btn: {
    backgroundColor: '#009DFF',
    borderRadius: 20,
    height: 55,
    marginTop: 15,
  },
  footerLinks: {
    alignItems: 'center',
    marginTop: 15,
  },
  footerLinkText: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#000',
  },
  linkBlue: {
    color: '#00D1FF',
  },
});