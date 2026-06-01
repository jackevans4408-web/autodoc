import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator } from "react-native";
import { useState } from "react";
import { signIn, signUp } from "./supabase";

export default function LoginScreen({ onLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [error, setError] = useState("");

  const handleAuth = async () => {
    console.log("signUp type:", typeof signUp);
    console.log("signIn type:", typeof signIn);
    setLoading(true);
    setError("");
    try {
      const result = isSignUp ? await signUp(email, password) : await signIn(email, password);
      if (result.success) {
        onLogin(result);
      } else {
        setError(result.error || "Something went wrong");
      }
    } catch (e) {
      setError(e.message);
    }
    setLoading(false);
  };

  return (
    <View style={styles.container}>
      <View style={styles.logoArea}>
        <Text style={styles.logo}>AutoDoc</Text>
        <Text style={styles.tagline}>AI Car Diagnostics</Text>
      </View>
      <View style={styles.form}>
        <Text style={styles.title}>{isSignUp ? "Create Account" : "Welcome Back"}</Text>
        {error ? <Text style={styles.error}>{error}</Text> : null}
        <TextInput
          style={styles.input}
          placeholder="Email"
          placeholderTextColor="#888"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
        />
        <TextInput
          style={styles.input}
          placeholder="Password"
          placeholderTextColor="#888"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />
        <TouchableOpacity style={styles.btn} onPress={handleAuth} disabled={loading}>
          {loading ? <ActivityIndicator color="#0d0d0e" /> : <Text style={styles.btnText}>{isSignUp ? "Sign Up" : "Sign In"}</Text>}
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setIsSignUp(!isSignUp)}>
          <Text style={styles.switchText}>
            {isSignUp ? "Already have an account? Sign In" : "Don't have an account? Sign Up"}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0d0d0e", justifyContent: "center", padding: 24 },
  logoArea: { alignItems: "center", marginBottom: 48 },
  logo: { color: "#f5a623", fontSize: 42, fontWeight: "bold" },
  tagline: { color: "#888", fontSize: 16, marginTop: 8 },
  form: { backgroundColor: "#161618", borderRadius: 16, padding: 24, borderWidth: 1, borderColor: "#2e2e33" },
  title: { color: "#e8e6e0", fontSize: 22, fontWeight: "bold", marginBottom: 20 },
  error: { color: "#e05a5a", fontSize: 13, marginBottom: 12 },
  input: { backgroundColor: "#1e1e21", color: "#e8e6e0", borderRadius: 8, padding: 12, fontSize: 14, borderWidth: 1, borderColor: "#2e2e33", marginBottom: 12 },
  btn: { backgroundColor: "#f5a623", borderRadius: 8, padding: 14, alignItems: "center", marginTop: 4 },
  btnText: { color: "#0d0d0e", fontWeight: "bold", fontSize: 16 },
  switchText: { color: "#888", textAlign: "center", marginTop: 16, fontSize: 13 },
});