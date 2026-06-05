import { StatusBar } from "expo-status-bar";
import { useState, useEffect } from "react";
import * as ImagePicker from "expo-image-picker";
import LoginScreen from "./LoginScreen";
import CarProfileScreen from "./CarProfileScreen";
import MechanicQuoteScreen from "./MechanicQuoteScreen";
import * as SecureStore from "expo-secure-store";
import * as LocalAuthentication from "expo-local-authentication";
import { StyleSheet, Text, View, TextInput, TouchableOpacity, ScrollView, ActivityIndicator, Image, Linking, KeyboardAvoidingView, Platform, Keyboard } from "react-native";

function FormattedDiagnosis({ text }) {
  const lines = text.split('\n').filter(line => line.trim());
  return (
    <View>
      {lines.map((line, i) => {
        const isHeader = line.startsWith('##') || line.startsWith('**') && line.endsWith('**');
        const isUrgent = line.toLowerCase().includes('critical') || line.toLowerCase().includes('urgent') || line.toLowerCase().includes('high');
        const isCost = line.toLowerCase().includes('$') || line.toLowerCase().includes('cost') || line.toLowerCase().includes('price');
        const cleaned = line.replace(/##\s*/g, '').replace(/\*\*/g, '').replace(/^-\s*/, '• ');
        return (
          <Text key={i} style={[
            styles.botText,
            isHeader && styles.diagHeader,
            isUrgent && styles.diagUrgent,
            isCost && styles.diagCost,
          ]}>
            {cleaned}
          </Text>
        );
      })}
    </View>
  );
}

export default function App() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [diagnosing, setDiagnosing] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [car, setCar] = useState(null);
  const [showQuoteAnalyzer, setShowQuoteAnalyzer] = useState(false);
  const [showVehicleSelector, setShowVehicleSelector] = useState(false);
  const [pendingMessage, setPendingMessage] = useState(null);
  const [pendingImage, setPendingImage] = useState(null);
  const [differentVehicle, setDifferentVehicle] = useState(false);
  const [diffYear, setDiffYear] = useState("");
  const [diffMake, setDiffMake] = useState("");
  const [diffModel, setDiffModel] = useState("");

  useEffect(() => {
    checkSavedLogin();
  }, []);

  const checkSavedLogin = async () => {
    try {
      const savedSession = await SecureStore.getItemAsync("userSession");
      const savedCar = await SecureStore.getItemAsync("userCar");
      if (savedSession) {
        const hasBiometrics = await LocalAuthentication.hasHardwareAsync();
        const isEnrolled = await LocalAuthentication.isEnrolledAsync();
        if (hasBiometrics && isEnrolled) {
          const result = await LocalAuthentication.authenticateAsync({
            promptMessage: "Sign in to AutoDoc",
            fallbackLabel: "Use Password",
          });
          if (result.success) {
            setSession(JSON.parse(savedSession));
            if (savedCar) setCar(JSON.parse(savedCar));
          }
        } else {
          setSession(JSON.parse(savedSession));
          if (savedCar) setCar(JSON.parse(savedCar));
        }
      }
    } catch (e) {
      console.log("Auth error:", e);
    }
    setLoading(false);
  };

  const pickImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) { alert("Permission required!"); return; }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.7,
      base64: true,
    });
    if (!result.canceled) setSelectedImage(result.assets[0]);
  };

  const takePhoto = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) { alert("Permission required!"); return; }
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      quality: 0.7,
      base64: true,
    });
    if (!result.canceled) setSelectedImage(result.assets[0]);
  };

  const findNearbyShops = () => {
    Linking.openURL("maps://maps.apple.com/?q=auto+repair+shop+near+me");
  };

  const sendMessage = async (overrideCar = null) => {
    const userMessage = pendingMessage !== null ? pendingMessage : message;
    const userImage = pendingImage !== null ? pendingImage : selectedImage;
    if (!userMessage.trim() && !userImage) return;
    setMessage("");
    setSelectedImage(null);
    setPendingMessage(null);
    setPendingImage(null);
    setShowVehicleSelector(false);
    setDifferentVehicle(false);
    setDiffYear(""); setDiffMake(""); setDiffModel("");
    setMessages(prev => [...prev, { role: "user", text: userMessage, image: userImage?.uri }]);
    setDiagnosing(true);
    const activeCar = overrideCar || car;
    try {
      const body = {
        text: userMessage,
        car_year: activeCar?.year,
        car_make: activeCar?.make,
        car_model: activeCar?.model
      };
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
      setMessages(prev => [...prev, {
        role: "bot",
        text: data.diagnosis,
        videos: data.videos
      }]);
    } catch (error) {
      setMessages(prev => [...prev, { role: "bot", text: "Error: " + error.message }]);
    }
    setDiagnosing(false);
  };

  const signOut = async () => {
    await SecureStore.deleteItemAsync("userSession");
    await SecureStore.deleteItemAsync("userCar");
    setSession(null);
    setCar(null);
    setMessages([]);
  };

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: "center", alignItems: "center" }]}>
        <ActivityIndicator size="large" color="#f5a623" />
      </View>
    );
  }

  if (!session) {
    return <LoginScreen onLogin={async (user) => {
      await SecureStore.setItemAsync("userSession", JSON.stringify(user));
      setSession(user);
    }} />;
  }

  if (!car) {
    return <CarProfileScreen onSave={async (carData) => {
      await SecureStore.setItemAsync("userCar", JSON.stringify(carData));
      setCar(carData);
    }} />;
  }

  if (showQuoteAnalyzer) {
    return <MechanicQuoteScreen car={car} onBack={() => setShowQuoteAnalyzer(false)} />;
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <View style={styles.header}>
        <View>
          <Text style={styles.headerText}>AutoDoc</Text>
          <Text style={styles.carInfo}>{car.year} {car.make} {car.model}</Text>
        </View>
        <TouchableOpacity style={styles.quoteBtn} onPress={() => setShowQuoteAnalyzer(true)}>
          <Text style={styles.quoteBtnText}>📄 Quote</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={signOut}>
          <Text style={styles.signOut}>Sign Out</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.chatArea} keyboardShouldPersistTaps="handled">
        {messages.length === 0 && (
          <Text style={styles.placeholder}>Describe your car problem or upload a photo...</Text>
        )}
        {messages.map((msg, i) => (
          <View key={i} style={[styles.bubble, msg.role === "user" ? styles.userBubble : styles.botBubble]}>
            {msg.image && <Image source={{ uri: msg.image }} style={styles.messageImage} />}
            {msg.text ? (
              msg.role === "bot" ? (
                <FormattedDiagnosis text={msg.text} />
              ) : (
                <Text style={styles.userText}>{msg.text}</Text>
              )
            ) : null}
            {msg.videos && msg.videos.length > 0 && (
              <View style={styles.videosContainer}>
                <Text style={styles.videosHeader}>🎥 DIY Repair Videos</Text>
                {msg.videos.map((video, vi) => (
                  <TouchableOpacity
                    key={vi}
                    style={styles.videoItem}
                    onPress={() => Linking.openURL(video.url)}
                  >
                    <Text style={styles.videoTitle}>{video.title}</Text>
                    <Text style={styles.videoChannel}>{video.channel} • Watch on YouTube →</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        ))}
        {diagnosing && <ActivityIndicator size="large" color="#f5a623" style={{ margin: 20 }} />}
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
          <Text style={styles.cameraBtnText}>Camera</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.cameraBtn} onPress={pickImage}>
          <Text style={styles.cameraBtnText}>Gallery</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.cameraBtn} onPress={findNearbyShops}>
          <Text style={styles.cameraBtnText}>🔧 Shops</Text>
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
        <TouchableOpacity style={styles.sendBtn} onPress={() => {
          if (!message.trim() && !selectedImage) return;
          Keyboard.dismiss();
          setPendingMessage(message);
          setPendingImage(selectedImage);
          setShowVehicleSelector(true);
        }}>
          <Text style={styles.sendText}>Send</Text>
        </TouchableOpacity>
      </View>

      {showVehicleSelector && (
        <View style={styles.vehicleModal}>
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
          >
            <View style={styles.vehicleModalContent}>
              <Text style={styles.vehicleModalTitle}>Which vehicle?</Text>
              <TouchableOpacity style={styles.vehicleOption} onPress={() => sendMessage(car)}>
                <Text style={styles.vehicleOptionText}>🚗 My {car?.year} {car?.make} {car?.model}</Text>
              </TouchableOpacity>
              {!differentVehicle ? (
                <TouchableOpacity style={styles.vehicleOption} onPress={() => setDifferentVehicle(true)}>
                  <Text style={styles.vehicleOptionText}>🔧 Different Vehicle</Text>
                </TouchableOpacity>
              ) : (
                <View style={styles.diffVehicleForm}>
                  <TextInput
                    style={styles.diffInput}
                    placeholder="Year (e.g. 2020)"
                    placeholderTextColor="#888"
                    value={diffYear}
                    onChangeText={setDiffYear}
                    keyboardType="numeric"
                    maxLength={4}
                  />
                  <TextInput
                    style={styles.diffInput}
                    placeholder="Make (e.g. Toyota)"
                    placeholderTextColor="#888"
                    value={diffMake}
                    onChangeText={setDiffMake}
                  />
                  <TextInput
                    style={styles.diffInput}
                    placeholder="Model (e.g. Camry)"
                    placeholderTextColor="#888"
                    value={diffModel}
                    onChangeText={setDiffModel}
                  />
                  <TouchableOpacity
                    style={styles.vehicleOption}
                    onPress={() => sendMessage({ year: diffYear, make: diffMake, model: diffModel })}
                  >
                    <Text style={styles.vehicleOptionText}>Diagnose This Car →</Text>
                  </TouchableOpacity>
                </View>
              )}
              <TouchableOpacity
                style={styles.vehicleCancel}
                onPress={() => {
                  setShowVehicleSelector(false);
                  setPendingMessage(null);
                  setPendingImage(null);
                  setDifferentVehicle(false);
                  setDiffYear(""); setDiffMake(""); setDiffModel("");
                }}
              >
                <Text style={styles.vehicleCancelText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
        </View>
      )}

      <StatusBar style="auto" />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0d0d0e" },
  header: { backgroundColor: "#161618", paddingTop: 60, paddingBottom: 20, paddingHorizontal: 20, flexDirection: "row", justifyContent: "space-between", alignItems: "center", borderBottomWidth: 1, borderBottomColor: "#2e2e33" },
  headerText: { color: "#f5a623", fontSize: 28, fontWeight: "bold" },
  carInfo: { color: "#f5a623", fontSize: 12, marginTop: 2 },
  signOut: { color: "#888", fontSize: 13 },
  quoteBtn: { backgroundColor: "#1e1e21", borderRadius: 8, padding: 8, paddingHorizontal: 12, borderWidth: 1, borderColor: "#2e2e33" },
  quoteBtnText: { color: "#f5a623", fontSize: 12, fontWeight: "500" },
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
  diagHeader: { color: "#f5a623", fontWeight: "bold", fontSize: 15, marginTop: 8, marginBottom: 2 },
  diagUrgent: { color: "#e05a5a", fontWeight: "600" },
  diagCost: { color: "#4caf7d", fontWeight: "500" },
  videosContainer: { marginTop: 12, borderTopWidth: 1, borderTopColor: "#2e2e33", paddingTop: 12 },
  videosHeader: { color: "#f5a623", fontWeight: "bold", fontSize: 14, marginBottom: 8 },
  videoItem: { backgroundColor: "#0d0d0e", borderRadius: 8, padding: 10, marginBottom: 8, borderWidth: 1, borderColor: "#2e2e33" },
  videoTitle: { color: "#e8e6e0", fontSize: 13, fontWeight: "500", marginBottom: 4 },
  videoChannel: { color: "#f5a623", fontSize: 12 },
  vehicleModal: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.7)", justifyContent: "flex-end" },
  vehicleModalContent: { backgroundColor: "#161618", borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 24, borderWidth: 1, borderColor: "#2e2e33" },
  vehicleModalTitle: { color: "#e8e6e0", fontSize: 18, fontWeight: "bold", marginBottom: 16, textAlign: "center" },
  vehicleOption: { backgroundColor: "#1e1e21", borderRadius: 12, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: "#2e2e33" },
  vehicleOptionText: { color: "#e8e6e0", fontSize: 15, textAlign: "center" },
  vehicleCancel: { padding: 12, alignItems: "center" },
  vehicleCancelText: { color: "#888", fontSize: 14 },
  diffVehicleForm: { marginBottom: 12 },
  diffInput: { backgroundColor: "#0d0d0e", color: "#e8e6e0", borderRadius: 8, padding: 10, fontSize: 14, borderWidth: 1, borderColor: "#2e2e33", marginBottom: 8 },
});