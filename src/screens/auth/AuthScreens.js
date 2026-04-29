import React, { useContext, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, TouchableWithoutFeedback, Keyboard } from 'react-native';
import { AuthLayout } from '../../components/AuthLayout';
import { Card } from '../../components/Card';
import { Input } from '../../components/Input';
import { Button } from '../../components/Button';
import { AuthContext, useTheme } from '../../navigation/AppNavigator';



export const LoginScreen = ({ navigation }) => {
  const { login } = useContext(AuthContext);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = async () => {
    if (!email || !password) {
      setError("Por favor, preencha todos os campos.");
      return;
    }

    setError('');
    const result = await login(email, password);
    if (!result.success) {
      setError(result.message);
    }
  };

  return (
    <AuthLayout>
      <Card style={styles.card}>
        <Text style={styles.title}>Faça o login</Text>
        {error ? <Text style={styles.errorText}>{error}</Text> : null}
        <Input
          placeholder="Nome"
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
          onPress={handleLogin}
          style={styles.btn}
        />
      </Card>

      <View style={styles.footerLinks}>
        <TouchableOpacity onPress={() => navigation.navigate('Register')}>
          <Text style={styles.footerLinkText}>
            Não tem uma conta ainda? <Text style={styles.linkBlue}>cadastrar</Text>
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => navigation.navigate('Recovery')}
          style={{ marginTop: 15 }}
        >
          <Text style={styles.forgotPasswordText}>Esqueceu a senha?</Text>
        </TouchableOpacity>
      </View>
    </AuthLayout>
  );
};

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

export const NewPasswordScreen = ({ navigation, route }) => {
  const { email } = route.params || {};
  const { resetPassword } = useContext(AuthContext);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');

  const handleReset = () => {
    if (!password || password.length < 6) {
      setError(" a senha deve conter no minimo 6 caracteres ");
      return;
    }
    if (password !== confirmPassword) {
      setError("As senhas não coincidem.");
      return;
    }

    resetPassword(email, password);
    setError('');
    Alert.alert("Sucesso", "Sua senha foi redefinida com sucesso!");
    navigation.navigate('Login');
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

        <Button title="Redefinir Senha" onPress={handleReset} style={styles.btn} />
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
  forgotPasswordText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: 'bold',
    textDecorationLine: 'underline',
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
