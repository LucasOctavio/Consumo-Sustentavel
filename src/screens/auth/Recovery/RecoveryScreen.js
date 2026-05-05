import React, { useContext, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, TouchableWithoutFeedback, Keyboard } from 'react-native';
import { AuthLayout } from '../../../components/AuthLayout';
import { Card } from '../../../components/Card';
import { Input } from '../../../components/Input';
import { Button } from '../../../components/Button';
import { AuthContext, useTheme } from '../../../navigation/AppNavigator';

export const RecoveryScreen = ({ navigation }) => {
  const { checkEmail } = useContext(AuthContext);
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');

  const handleSendCode = () => {
    if (!email || !email.includes('@')) {
      setError("Por favor, insira um e-mail válido.");
      return;
    }

    const userExists = checkEmail(email);
    if (!userExists) {
      setError("Este e-mail não está cadastrado.");
      return;
    }

    setError('');
    Alert.alert("Código Enviado", `Enviamos um código de 6 dígitos para ${email}`);
    navigation.navigate('ResetCode', { email });
  };

  return (
    <AuthLayout>
      <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
        <Text style={styles.backBtnText}>{'> Voltar'}</Text>
      </TouchableOpacity>

      <Card style={styles.card}>
        <Text style={styles.title}>Redefinir senha</Text>
        {error ? <Text style={styles.errorText}>{error}</Text> : null}
        <Text style={styles.subtitle}>
          Insira o endereço de email da sua conta e enviaremos um código de segurança para alterar a senha da conta.
        </Text>

        <Text style={styles.label}>Endereço de email</Text>
        <Input
          placeholder="Email"
          keyboardType="email-address"
          value={email}
          onChangeText={(t) => { setEmail(t); setError(''); }}
        />

        <Button title="Enviar Código" onPress={handleSendCode} style={styles.btn} />
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
  subtitle: {
    fontSize: 12,
    textAlign: 'center',
    marginBottom: 20,
    color: '#666',
    lineHeight: 18,
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: -5,
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
  }
});
