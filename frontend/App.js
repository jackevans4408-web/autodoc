import { StatusBar } from "expo-status-bar";
import { StyleSheet, Text, View, TextInput, TouchableOpacity, ScrollView, ActivityIndicator, Image } from "react-native";
import { useState } from "react";
import * as ImagePicker from "expo-image-picker";

export default function App() {
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);

  const pickImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      alert("Permission to access photos is required!");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.7,
      base64: true,
    });
    if (!result.canceled) {
      setSelectedImage(result.assets[0]);
    }
  };

  const takePhoto = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      alert("Permission to use camera is required!");
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      quality: 0.7,
      base64: true,
    });
    if (!result.canceled) {
      setSelectedImage(result.assets[0]);
    }
  };

  const sendMessage = async () => {
    if (!message.trim() && !selectedImage) return;
    const userMessage = message;
    const userImage = selectedImage;
    setMessage("");
    setSelectedImage(null);
    setMessages(prev => [...prev, { role: "user", text: userMessage, image: userImage?.uri }]);
    setLoading(true);

    try {
      const body = { text: userMessage };
      if (userImage?.base64) {
        body.image_base64 = userImage.base64;
        body.image_type = "image/jpeg";
      }

      const response = await fetch("https://autodoc-production-1703.up.railway.app/diagnose", {
        method: "POST",
        headers: { "Accept": "application/json", "Content-Type": "application/json" },
        body: JSON.stringify(body),
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
          <Text style={styles.placeholder}>Describe your car problem or upload a photo...</Text>
        )}
        {messages.map((msg, i) => (
          <View key={i} style={[styles.bubble, msg.role === "user" ? styles.userBubble : styles.botBubble]}>
            {msg.image && <Image source={{ uri: msg.image }} style={styles.messageImage} />}
            {msg.text ? <Text style={msg.role === "user" ? styles.userText : styles.botText}>{msg.text}</Text> : null}
          </View>
        ))}
        {loading && <ActivityIndicator size="large" color="#f5a623" style={{ margin: 20 }} />}
      </ScrollView>

      {selectedImage && (
        <View style={styles.imagePreview}>
          <Image source={{ uri: selectedImage.uri }} style={styles.previewThumb} />
          <TouchableOpacity onPress={() => setSelectedImage(null)}>
            <Text style={styles.removeImage}>✕</Text>
          </TouchableOpacity>
        </View>
      )}

      <View style={styles.cameraRow}>
        <TouchableOpacity style={styles.cameraBtn} onPress={takePhoto}>
          <Text style={styles.cameraBtnText}>📷 Camera</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.cameraBtn} onPress={pickImage}>
          <Text style={styles.cameraBtnText}>🖼 Gallery</Text>
        </TouchableOpacity>
      </View>

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
  messageImage: { width: 200, height: 150, borderRadius: 8, marginBottom: 8 },
  imagePreview: { flexDirection: "row", alignItems: "center", padding: 8, backgroundColor: "#161618", borderTopWidth: 1, borderTopColor: "#2e2e33" },
  previewThumb: { width: 50, height: 50, borderRadius: 6, marginRight: 8 },
  removeImage: { color: "#888", fontSize: 18, padding: 4 },
  cameraRow: { flexDirection: "row", padding: 8, backgroundColor: "#161618", gap: 8 },
  cameraBtn: { flex: 1, backgroundColor: "#1e1e21", borderRadius: 8, padding: 10, alignItems: "center", borderWidth: 1, borderColor: "#2e2e33" },
  cameraBtnText: { color: "#e8e6e0", fontSize: 13 },
  inputArea: { flexDirection: "row", padding: 12, backgroundColor: "#161618", borderTopWidth: 1, borderTopColor: "#2e2e33" },
  input: { flex: 1, backgroundColor: "#1e1e21", color: "#e8e6e0", borderRadius: 8, padding: 10, fontSize: 14, borderWidth: 1, borderColor: "#2e2e33" },
  sendBtn: { backgroundColor: "#f5a623", borderRadius: 8, padding: 10, marginLeft: 8, justifyContent: "center" },
  sendText: { color: "#0d0d0e", fontWeight: "bold" },
});