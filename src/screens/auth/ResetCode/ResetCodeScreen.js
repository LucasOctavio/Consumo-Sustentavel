import React, { useContext, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, TouchableWithoutFeedback, Keyboard } from 'react-native';
import { AuthLayout } from '../../../components/AuthLayout';
import { Card } from '../../../components/Card';
import { Input } from '../../../components/Input';
import { Button } from '../../../components/Button';
import { AuthContext, useTheme } from '../../../navigation/AppNavigator';

export const ResetCodeScreen = ({ navigation, route }) => {
  const { email } = route.params || {};
  const [code, setCode] = useState('');
  const [error, setError] = useState('');

  const handleVerify = () => {
    if (code.length < 6) {
      setError("O código deve ter 6 dígitos.");
      return;
    }
    setError('');
    navigation.navigate('NewPassword', { email });
  };

  return (
    <AuthLayout>
      <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
        <Text style={styles.backBtnText}>{'> Voltar'}</Text>
      </TouchableOpacity>

      <Card style={styles.card}>
        <Text style={styles.title}>Verificar Código</Text>
        {error ? <Text style={styles.errorText}>{error}</Text> : null}
        <Text style={styles.subtitle}>
          Digite o código de 6 dígitos enviado para {email}.
        </Text>

        <Input
          placeholder="000000"
          keyboardType="numeric"
          maxLength={6}
          value={code}
          onChangeText={(t) => { setCode(t); setError(''); }}
          style={{ textAlign: 'center', fontSize: 24, letterSpacing: 10 }}
        />

        <Button title="Verificar" onPress={handleVerify} style={styles.btn} />
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
