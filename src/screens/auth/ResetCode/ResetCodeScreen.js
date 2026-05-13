import React, { useContext, useState, useEffect, useRef } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { AuthLayout } from "../../../components/AuthLayout";
import { Card } from "../../../components/Card";
import { Input } from "../../../components/Input";
import { Button } from "../../../components/Button";
import { AuthContext } from "../../../navigation/AppNavigator";

const formatTime = (seconds) => {
  const m = Math.floor(seconds / 60)
    .toString()
    .padStart(2, "0");
  const s = (seconds % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
};

const EXPIRY_SECONDS = 10 * 60;

export const ResetCodeScreen = ({ navigation, route }) => {
  const { email, tokenReset } = route.params || {};
  const { forgotPassword, verifyResetCode } = useContext(AuthContext);

  const [code, setCode] = useState("");
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

  const handleVerify = async () => {
    if (code.length < 6) {
      setError("O código deve ter 6 dígitos.");
      return;
    }
    setError("");
    setLoading(true);

    try {
      const result = await verifyResetCode(code, currentToken);
      if (result.success) {
        // Só navega se o código for validado com sucesso pelo backend
        navigation.navigate("NewPassword", {
          email,
          codigo: code,
          tokenReset: currentToken,
        });
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
      >
        <Text style={styles.backBtnText}>{"← Voltar"}</Text>
      </TouchableOpacity>

      <Card style={styles.card}>
        <Text style={styles.title}>Verificar Código</Text>

        {/* Contador */}
        <View style={[styles.timerBadge, expired && styles.timerBadgeExpired]}>
          <Text style={[styles.timerText, expired && styles.timerTextExpired]}>
            {expired
              ? "Código expirado"
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
          editable={!loading}
          onChangeText={(t) => {
            setCode(t);
            setError("");
          }}
          style={{ textAlign: "center", fontSize: 26, letterSpacing: 12 }}
        />

        <Button
          title={loading ? "Verificando..." : "Verificar"}
          onPress={handleVerify}
          style={[styles.btn, loading && styles.btnDisabled]}
          disabled={loading}
        />

        <TouchableOpacity
          onPress={handleResend}
          disabled={loading}
          style={{ marginTop: 14, alignItems: "center" }}
        >
          <Text style={styles.linkBlue}>
            {loading ? "Aguarde..." : "🔄 Reenviar código"}
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
    color: "#000",
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
    marginBottom: 14,
    color: "#666",
    lineHeight: 18,
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
    color: "#1E2C5A",
    fontSize: 14,
    fontWeight: "bold",
  },
  timerBadge: {
    backgroundColor: "#E8F5E9",
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
    color: "#2E7D32",
    fontWeight: "bold",
    fontSize: 13,
  },
  timerTextExpired: {
    color: "#C62828",
  },
  linkBlue: {
    color: "#009DFF",
    fontWeight: "bold",
    fontSize: 14,
  },
});
