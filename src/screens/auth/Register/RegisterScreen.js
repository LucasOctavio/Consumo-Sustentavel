import React, { useContext, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, TouchableWithoutFeedback, Keyboard } from 'react-native';
import { AuthLayout } from '../../../components/AuthLayout';
import { Card } from '../../../components/Card';
import { Input } from '../../../components/Input';
import { Button } from '../../../components/Button';
import { AuthContext, useTheme } from '../../../navigation/AppNavigator';

export const RegisterScreen = ({ navigation }) => {
  const { register } = useContext(AuthContext);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleRegister = async () => {
    if (!name || !email || !password) {
      setError("Por favor, preencha todos os campos.");
      return;
    }

    if (!email.includes('@')) {
      setError("Formato de email inválido.");
      return;
    }

    if (password.length < 6) {
      setError(" a senha deve conter no minimo 6 caracteres ");
      return;
    }

    setError('');
    const result = await register(name, email, password);
    if (!result.success) {
      setError(result.message);
    }
  };

  return (
    <AuthLayout>
      <Card style={styles.card}>
        <Text style={styles.title}>Faça o cadastro</Text>
        {error ? <Text style={styles.errorText}>{error}</Text> : null}
        <Input
          placeholder="Nome"
          value={name}
          onChangeText={(t) => { setName(t); setError(''); }}
        />
        <Input
          placeholder="Email"
          keyboardType="email-address"
          value={email}
          onChangeText={(t) => { setEmail(t); setError(''); }}
        />
        <Input
          placeholder="Senha"
          secureTextEntry
          value={password}
          onChangeText={(t) => { setPassword(t); setError(''); }}
        />
        <Button
          title="Entrar"
          onPress={handleRegister}
          style={styles.btn}
        />
      </Card>

      <TouchableOpacity onPress={() => navigation.navigate('Login')} style={styles.footerLinks}>
        <Text style={styles.footerLinkText}>
          Já tem cadastro faça seu <Text style={styles.linkBlue}>login</Text>
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
    marginTop: 30,
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
