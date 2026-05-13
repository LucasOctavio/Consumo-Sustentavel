import React, { useContext, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { AuthLayout } from "../../../components/AuthLayout";
import { Card } from "../../../components/Card";
import { Input } from "../../../components/Input";
import { Button } from "../../../components/Button";
import { AuthContext } from "../../../navigation/AppNavigator";

export const RegisterScreen = ({ navigation }) => {
  const { register, resendVerification } = useContext(AuthContext);

  // ── Campos do formulário ──
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // ── Estado da UI ──
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false); // true após cadastro enviado com sucesso
  const [resendMsg, setResendMsg] = useState(""); // mensagem de feedback do reenvio

  // ─── Validações locais antes de chamar a API ────────────────────────────────
  const validar = () => {
    if (!name.trim() || !email.trim() || !password) {
      setError("Por favor, preencha todos os campos.");
      return false;
    }
    if (!email.includes("@") || !email.includes(".")) {
      setError("Formato de e-mail inválido.");
      return false;
    }
    if (password.length < 6) {
      setError("A senha deve conter no mínimo 6 caracteres.");
      return false;
    }
    return true;
  };

  // ─── Passo 1: enviar dados para o backend ────────────────────────────────────
  // O backend NÃO cria o usuário no banco agora — apenas embute os dados num JWT
  // e envia o link de verificação por e-mail. A conta só é criada quando o usuário
  // clicar no link e o endpoint /verify_via_email for chamado.
  const handleRegister = async () => {
    if (!validar()) return;
    setError("");
    setLoading(true);
    const result = await register(name.trim(), email.trim(), password);
    setLoading(false);

    if (result.success) {
      // Mostra a tela de confirmação com opção de reenvio
      setDone(true);
    } else {
      setError(result.message);
    }
  };

  // ─── Reenviar link: regera o token JWT e manda novo e-mail ──────────────────
  const handleResend = async () => {
    setResendMsg("");
    setError("");
    setLoading(true);
    const result = await resendVerification(
      name.trim(),
      email.trim(),
      password,
    );
    setLoading(false);

    if (result.success) {
      setResendMsg(
        "✅ E-mail reenviado com sucesso! Verifique sua caixa de entrada.",
      );
    } else {
      // 409 = conta já verificada; outros = erros gerais
      setError(result.message);
    }
  };

  // ─── Tela pós-cadastro: instrução de verificação ─────────────────────────────
  if (done) {
    return (
      <AuthLayout>
        <Card style={styles.card}>
          {/* Ícone ilustrativo */}
          <Text style={styles.emailIcon}>📧</Text>

          <Text style={styles.title}>Verifique seu e-mail</Text>

          <Text style={styles.subtitle}>
            Enviamos um link de confirmação para:{"\n"}
            <Text style={styles.emailHighlight}>{email}</Text>
          </Text>

          <Text style={styles.instructions}>
            Clique no link recebido para concluir seu cadastro. Após confirmar,
            volte aqui e faça login normalmente.{"\n\n"}
            Não encontrou o e-mail? Verifique a pasta de spam.
          </Text>

          {/* Mensagem de sucesso de reenvio */}
          {resendMsg ? (
            <View style={styles.successBadge}>
              <Text style={styles.successText}>{resendMsg}</Text>
            </View>
          ) : null}

          {/* Erro ao reenviar */}
          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          {/* Botão de reenvio */}
          <TouchableOpacity
            onPress={handleResend}
            disabled={loading}
            style={styles.resendBtn}
          >
            <Text style={styles.resendText}>
              {loading ? "Reenviando..." : "🔄 Reenviar e-mail de verificação"}
            </Text>
          </TouchableOpacity>

          {/* Separador */}
          <View style={styles.separator} />

          {/* Botão de ir para o login */}
          <Button
            title="Ir para o Login"
            onPress={() => navigation.navigate("Login")}
            style={styles.btn}
          />

          {/* Voltar e tentar com outro e-mail */}
          <TouchableOpacity
            onPress={() => {
              setDone(false);
              setResendMsg("");
              setError("");
            }}
            style={{ marginTop: 12, alignItems: "center" }}
          >
            <Text style={{ color: "#888", fontSize: 13 }}>
              ← Usar outro e-mail
            </Text>
          </TouchableOpacity>
        </Card>
      </AuthLayout>
    );
  }

  // ─── Tela de cadastro ────────────────────────────────────────────────────────
  return (
    <AuthLayout>
      <Card style={styles.card}>
        <Text style={styles.title}>Faça o cadastro</Text>

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        <Input
          placeholder="Nome de usuário"
          value={name}
          onChangeText={(t) => {
            setName(t);
            setError("");
          }}
        />
        <Input
          placeholder="E-mail"
          keyboardType="email-address"
          autoCapitalize="none"
          value={email}
          onChangeText={(t) => {
            setEmail(t);
            setError("");
          }}
        />
        <Input
          placeholder="Senha (mínimo 6 caracteres)"
          secureTextEntry
          value={password}
          onChangeText={(t) => {
            setPassword(t);
            setError("");
          }}
        />

        {/* Indicador de força da senha */}
        {password.length > 0 && (
          <View style={styles.passwordStrengthRow}>
            {[...Array(4)].map((_, i) => (
              <View
                key={i}
                style={[
                  styles.passwordBar,
                  i < getPasswordStrength(password)
                    ? styles.passwordBarFilled(getPasswordStrength(password))
                    : styles.passwordBarEmpty,
                ]}
              />
            ))}
            <Text style={styles.passwordStrengthLabel}>
              {
                ["", "Fraca", "Regular", "Boa", "Forte"][
                  getPasswordStrength(password)
                ]
              }
            </Text>
          </View>
        )}

        <Button
          title={loading ? "Enviando..." : "Cadastrar"}
          onPress={handleRegister}
          style={styles.btn}
          disabled={loading}
        />
      </Card>

      <TouchableOpacity
        onPress={() => navigation.navigate("Login")}
        style={styles.footerLinks}
      >
        <Text style={styles.footerLinkText}>
          Já tem cadastro? Faça seu <Text style={styles.linkBlue}>login</Text>
        </Text>
      </TouchableOpacity>
    </AuthLayout>
  );
};

// ─── Utilitário: calcula força da senha (1–4) ─────────────────────────────────
const getPasswordStrength = (pwd) => {
  let score = 0;
  if (pwd.length >= 6) score++;
  if (pwd.length >= 10) score++;
  if (/[A-Z]/.test(pwd) || /[0-9]/.test(pwd)) score++;
  if (/[^A-Za-z0-9]/.test(pwd)) score++;
  return Math.max(1, score);
};

// ─── Estilos ─────────────────────────────────────────────────────────────────
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
  emailIcon: {
    fontSize: 48,
    textAlign: "center",
    marginBottom: 12,
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 14,
    color: "#000",
  },
  subtitle: {
    fontSize: 13,
    textAlign: "center",
    color: "#555",
    marginBottom: 8,
    lineHeight: 20,
  },
  emailHighlight: {
    fontWeight: "bold",
    color: "#009DFF",
  },
  instructions: {
    fontSize: 12,
    textAlign: "center",
    color: "#777",
    lineHeight: 18,
    marginBottom: 16,
  },
  errorText: {
    color: "#FF4C4C",
    fontSize: 13,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 12,
  },
  successBadge: {
    backgroundColor: "#E8F5E9",
    borderRadius: 10,
    padding: 10,
    marginBottom: 10,
  },
  successText: {
    color: "#2E7D32",
    fontSize: 13,
    fontWeight: "bold",
    textAlign: "center",
  },
  resendBtn: {
    alignItems: "center",
    paddingVertical: 10,
  },
  resendText: {
    color: "#009DFF",
    fontWeight: "bold",
    fontSize: 14,
  },
  separator: {
    height: 1,
    backgroundColor: "#EEE",
    marginVertical: 14,
  },
  btn: {
    backgroundColor: "#009DFF",
    borderRadius: 20,
    height: 55,
    marginTop: 8,
  },
  footerLinks: {
    alignItems: "center",
    marginTop: 28,
  },
  footerLinkText: {
    fontSize: 15,
    fontWeight: "bold",
    color: "#000",
  },
  linkBlue: {
    color: "#009DFF",
  },
  // ── Indicador de força da senha ──
  passwordStrengthRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 6,
    marginBottom: 2,
    paddingHorizontal: 4,
  },
  passwordBar: {
    flex: 1,
    height: 4,
    borderRadius: 2,
  },
  passwordBarFilled: (strength) => ({
    backgroundColor: ["", "#EF5350", "#FFA726", "#66BB6A", "#43A047"][strength],
  }),
  passwordBarEmpty: {
    backgroundColor: "#E0E0E0",
  },
  passwordStrengthLabel: {
    fontSize: 11,
    color: "#888",
    marginLeft: 6,
    minWidth: 40,
  },
});
