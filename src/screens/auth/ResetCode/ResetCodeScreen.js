import React, { useContext, useState, useEffect, useRef } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Alert } from "react-native";
import { AuthLayout } from "../../../components/AuthLayout";
import { Card } from "../../../components/Card";
import { Input } from "../../../components/Input";
import { Button } from "../../../components/Button";
import { AuthContext, useTheme } from "../../../navigation/AppNavigator";

const formatTime = (seconds) => {
  const m = Math.floor(seconds / 60)
    .toString()
    .padStart(2, "0");
  const s = (seconds % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
};

const EXPIRY_SECONDS = 10 * 60;

export const ResetCodeScreen = ({ navigation, route }) => {
  const { colors } = useTheme();
  const { email, tokenReset } = route.params || {};
  const { forgotPassword, resetPasswordByCode } = useContext(AuthContext);

  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [currentToken, setCurrentToken] = useState(tokenReset);

  // Contador regressivo
  const [timeLeft, setTimeLeft] = useState(EXPIRY_SECONDS);
  const [expired, setExpired] = useState(false);
  const timerRef = useRef(null);

  // Reinicia o timer sempre que um novo token chega (reenvio)
  useEffect(() => {
    clearInterval(timerRef.current);
    setTimeLeft(EXPIRY_SECONDS);
    setExpired(false);
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
    return () => clearInterval(timerRef.current);
  }, [currentToken]);

  const handleResetPassword = async () => {
    if (code.length < 6) {
      setError("O código deve ter 6 dígitos.");
      return;
    }
    if (!password || password.length < 6) {
      setError("A nova senha deve conter no mínimo 6 caracteres.");
      return;
    }
    if (password !== confirmPassword) {
      setError("As senhas não coincidem.");
      return;
    }

    setError("");
    setLoading(true);
    try {
      const result = await resetPasswordByCode(code, currentToken, password);
      if (result.success) {
        Alert.alert("Sucesso!", "Sua senha foi redefinida com sucesso!", [
          { text: "Fazer Login", onPress: () => navigation.navigate("Login") },
        ]);
      } else {
        setError(result.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setError("");
    setCode("");
    setLoading(true);
    try {
      const result = await forgotPassword(email);
      if (result.success) {
        setCurrentToken(result.tokenReset);
        Alert.alert("Enviado", "Um novo código foi enviado para o seu e-mail.");
      } else {
        setError(result.message || "Erro ao reenviar o código.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout>
      <TouchableOpacity
        onPress={() => navigation.goBack()}
        style={styles.backBtn}
        disabled={loading}
      >
        <Text style={[styles.backBtnText, { color: colors.secondary }]}>{"← Voltar"}</Text>
      </TouchableOpacity>

      <Card style={[styles.card, { backgroundColor: colors.card }]}>
        <Text style={[styles.title, { color: colors.text }]}>
          Redefinir Senha
        </Text>

        <View style={[styles.timerBadge, expired ? styles.timerBadgeExpired : { backgroundColor: colors.background + '40' }]}>
          <Text style={[styles.timerText, expired ? styles.timerTextExpired : { color: colors.primary }]}>
            {expired
              ? "Código expirado"
              : `Válido por: ${formatTime(timeLeft)}`}
          </Text>
        </View>

        {error ? <Text style={styles.errorText}>{error}</Text> : null}
        
        <Text style={[styles.subtitle, { color: colors.textLight }]}>
          Digite o código de 6 dígitos enviado para {email} e crie sua nova senha abaixo.
        </Text>

        <Text style={[styles.label, { color: colors.text }]}>Código de Segurança</Text>
        <Input
          placeholder="000000"
          keyboardType="numeric"
          maxLength={6}
          value={code}
          editable={!loading}
          onChangeText={(t) => {
            setCode(t);
            setError("");
          }}
          style={styles.codeInput}
        />

        <Text style={[styles.label, { color: colors.text, marginTop: 10 }]}>Nova Senha</Text>
        <Input
          placeholder="No mínimo 6 caracteres"
          secureTextEntry
          value={password}
          editable={!loading}
          onChangeText={(t) => {
            setPassword(t);
            setError("");
          }}
        />
        
        <Text style={[styles.label, { color: colors.text }]}>Confirmar Senha</Text>
        <Input
          placeholder="Repita a nova senha"
          secureTextEntry
          value={confirmPassword}
          editable={!loading}
          onChangeText={(t) => {
            setConfirmPassword(t);
            setError("");
          }}
        />

        <Button
          title={loading ? "Redefinindo..." : "Redefinir Senha"}
          onPress={handleResetPassword}
          style={[styles.btn, loading && styles.btnDisabled]}
          disabled={loading}
        />

        <TouchableOpacity
          onPress={handleResend}
          disabled={loading}
          style={{ marginTop: 20, alignItems: "center" }}
        >
          <Text style={[styles.linkBlue, { color: colors.primary }]}>
            {loading ? "Aguarde..." : "Reenviar código"}
          </Text>
        </TouchableOpacity>
      </Card>
    </AuthLayout>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 35,
    padding: 30,
    marginTop: 20,
    width: "100%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 10,
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 14,
  },
  errorText: {
    color: "#FF4C4C",
    fontSize: 13,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 12,
    textAlign: "center",
    marginBottom: 20,
    lineHeight: 18,
  },
  label: {
    fontSize: 14,
    fontWeight: "bold",
    marginBottom: 5,
    marginLeft: 5,
  },
  btn: {
    backgroundColor: "#009DFF",
    borderRadius: 20,
    height: 55,
    marginTop: 15,
  },
  btnDisabled: {
    backgroundColor: "#A0C4E8",
  },
  backBtn: {
    alignSelf: "flex-start",
    marginBottom: 10,
  },
  backBtnText: {
    fontSize: 14,
    fontWeight: "bold",
  },
  timerBadge: {
    borderRadius: 12,
    paddingVertical: 6,
    paddingHorizontal: 16,
    alignSelf: "center",
    marginBottom: 12,
  },
  timerBadgeExpired: {
    backgroundColor: "#FFEBEE",
  },
  timerText: {
    fontWeight: "bold",
    fontSize: 13,
  },
  timerTextExpired: {
    color: "#C62828",
  },
  linkBlue: {
    fontWeight: "bold",
    fontSize: 14,
  },
  codeInput: {
    textAlign: "center",
    fontSize: 26,
    letterSpacing: 12,
    fontWeight: 'bold',
  }
});
