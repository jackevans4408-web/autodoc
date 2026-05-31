import { StatusBar } from "expo-status-bar";
import { StyleSheet, Text, View, TextInput, TouchableOpacity, ScrollView, ActivityIndicator } from "react-native";
import { useState } from "react";

export default function App() {
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);

  const sendMessage = async () => {
    if (!message.trim()) return;
    const userMessage = message;
    setMessage("");
    setMessages(prev => [...prev, { role: "user", text: userMessage }]);
    setLoading(true);
    try {
      const response = await fetch("http://192.168.1.199:8080/diagnose", {
        method: "POST",
        headers: { "Accept": "application/json", "Content-Type": "application/json" },
        body: JSON.stringify({ text: userMessage }),
      });
      const data = await response.json();
      setMessages(prev => [...prev, { role: "bot", text: data.diagnosis }]);
    } catch (error) {
      setMessages(prev => [...prev, { role: "bot", text: "Error: " + error.message }]);
    }
    setLoading(false);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerText}>AutoDoc</Text>
        <Text style={styles.subHeader}>AI Car Diagnostics</Text>
      </View>
      <ScrollView style={styles.chatArea}>
        {messages.length === 0 && (
          <Text style={styles.placeholder}>Describe your car problem...</Text>
        )}
        {messages.map((msg, i) => (
          <View key={i} style={[styles.bubble, msg.role === "user" ? styles.userBubble : styles.botBubble]}>
            <Text style={msg.role === "user" ? styles.userText : styles.botText}>{msg.text}</Text>
          </View>
        ))}
        {loading && <ActivityIndicator size="large" color="#f5a623" style={{margin: 20}} />}
      </ScrollView>
      <View style={styles.inputArea}>
        <TextInput
          style={styles.input}
          value={message}
          onChangeText={setMessage}
          placeholder="Describe your car issue..."
          placeholderTextColor="#888"
          multiline
        />
        <TouchableOpacity style={styles.sendBtn} onPress={sendMessage}>
          <Text style={styles.sendText}>Send</Text>
        </TouchableOpacity>
      </View>
      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0d0d0e" },
  header: { backgroundColor: "#161618", paddingTop: 60, paddingBottom: 20, alignItems: "center", borderBottomWidth: 1, borderBottomColor: "#2e2e33" },
  headerText: { color: "#f5a623", fontSize: 28, fontWeight: "bold" },
  subHeader: { color: "#888", fontSize: 14, marginTop: 4 },
  chatArea: { flex: 1, padding: 16 },
  placeholder: { color: "#888", textAlign: "center", marginTop: 40, fontSize: 16 },
  bubble: { borderRadius: 12, padding: 12, marginBottom: 12, maxWidth: "85%" },
  userBubble: { backgroundColor: "#222226", alignSelf: "flex-end" },
  botBubble: { backgroundColor: "#1e1e21", alignSelf: "flex-start", borderWidth: 1, borderColor: "#2e2e33" },
  userText: { color: "#e8e6e0", fontSize: 14 },
  botText: { color: "#e8e6e0", fontSize: 14, lineHeight: 22 },
  inputArea: { flexDirection: "row", padding: 12, backgroundColor: "#161618", borderTopWidth: 1, borderTopColor: "#2e2e33" },
  input: { flex: 1, backgroundColor: "#1e1e21", color: "#e8e6e0", borderRadius: 8, padding: 10, fontSize: 14, borderWidth: 1, borderColor: "#2e2e33" },
  sendBtn: { backgroundColor: "#f5a623", borderRadius: 8, padding: 10, marginLeft: 8, justifyContent: "center" },
  sendText: { color: "#0d0d0e", fontWeight: "bold" },
});
