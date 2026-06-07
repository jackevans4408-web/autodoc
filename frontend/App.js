import { StatusBar } from "expo-status-bar";
import { StyleSheet, Text, View, TextInput, TouchableOpacity, ScrollView, ActivityIndicator, Image, Linking, KeyboardAvoidingView, Platform, Keyboard } from "react-native";
import { useState, useEffect } from "react";
import * as ImagePicker from "expo-image-picker";
import * as DocumentPicker from "expo-document-picker";
import LoginScreen from "./LoginScreen";
import CarProfileScreen from "./CarProfileScreen";
import QuoteHistoryScreen from "./QuoteHistoryScreen";
import SettingsScreen from "./SettingsScreen";
import CarSelectorModal from "./CarSelectorModal";
import * as SecureStore from "expo-secure-store";

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
  const [cars, setCars] = useState([]);
  const [showCarSelector, setShowCarSelector] = useState(false);
  const [showAddCar, setShowAddCar] = useState(false);
  const [showQuoteHistory, setShowQuoteHistory] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showVehicleSelector, setShowVehicleSelector] = useState(false);
  const [pendingMessage, setPendingMessage] = useState(null);
  const [pendingImage, setPendingImage] = useState(null);
  const [differentVehicle, setDifferentVehicle] = useState(false);
  const [diffYear, setDiffYear] = useState("");
  const [diffMake, setDiffMake] = useState("");
  const [diffModel, setDiffModel] = useState("");
  const [showMediaOptions, setShowMediaOptions] = useState(false);

  useEffect(() => {
    checkSavedLogin();
  }, []);

  const checkSavedLogin = async () => {
    try {
      const savedSession = await SecureStore.getItemAsync("userSession");
      const savedCar = await SecureStore.getItemAsync("userCar");
      const savedCars = await SecureStore.getItemAsync("userCars");

      if (savedSession) {
        setSession(JSON.parse(savedSession));

        if (savedCar) {
          const parsedCar = JSON.parse(savedCar);
          if (!parsedCar.id) parsedCar.id = Date.now().toString();
          setCar(parsedCar);

          if (savedCars) {
            setCars(JSON.parse(savedCars));
          } else {
            const migratedCars = [parsedCar];
            setCars(migratedCars);
            await SecureStore.setItemAsync("userCars", JSON.stringify(migratedCars));
          }
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

  const pickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ["image/*", "application/pdf"],
        copyToCacheDirectory: true,
      });
      if (!result.canceled && result.assets?.[0]) {
        const asset = result.assets[0];
        setSelectedImage({ uri: asset.uri, base64: null, name: asset.name, isDocument: true });
      }
    } catch (e) {
      alert("Error picking document");
    }
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
    await SecureStore.deleteItemAsync("userCars");
    setSession(null);
    setCar(null);
    setCars([]);
    setMessages([]);
  };

  const selectCar = async (selectedCar) => {
    setCar(selectedCar);
    await SecureStore.setItemAsync("userCar", JSON.stringify(selectedCar));
    setShowCarSelector(false);
    setMessages([]);
  };

  const deleteCar = async (carId) => {
    const updated = cars.filter(c => c.id !== carId);
    setCars(updated);
    await SecureStore.setItemAsync("userCars", JSON.stringify(updated));
    if (car?.id === carId && updated.length > 0) {
      setCar(updated[0]);
      await SecureStore.setItemAsync("userCar", JSON.stringify(updated[0]));
    }
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

  if (!car || showAddCar) {
    return <CarProfileScreen onSave={async (carData) => {
      const newCar = { ...carData, id: Date.now().toString() };
      const updatedCars = [...cars, newCar];
      setCars(updatedCars);
      setCar(newCar);
      await SecureStore.setItemAsync("userCars", JSON.stringify(updatedCars));
      await SecureStore.setItemAsync("userCar", JSON.stringify(newCar));
      setShowAddCar(false);
    }} />;
  }

  if (showQuoteHistory) {
    return <QuoteHistoryScreen car={car} onBack={() => setShowQuoteHistory(false)} />;
  }

  if (showSettings) {
    return <SettingsScreen
      car={car}
      session={session}
      onBack={() => setShowSettings(false)}
      onSignOut={signOut}
      onShowQuoteHistory={() => { setShowSettings(false); setShowQuoteHistory(true); }}
    />;
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <View style={styles.header}>
        <Text style={styles.headerText}>AutoDoc</Text>
        <TouchableOpacity style={styles.carSelector} onPress={() => setShowCarSelector(true)}>
          <Text style={styles.carSelectorText} numberOfLines={1}>{car.year} {car.make} {car.model}</Text>
          <Text style={styles.carSelectorArrow}>▼</Text>
        </TouchableOpacity>
        <View style={styles.headerRight}>
          <TouchableOpacity onPress={() => setShowQuoteHistory(true)}>
            <Text style={styles.quoteHistoryBtn}>📄 Quotes</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.shopsBtn} onPress={() => Linking.openURL("maps://maps.apple.com/?q=auto+repair+shop+near+me")}>
            <Text style={styles.shopsBtnText}>🔧 Shops</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.menuBtn} onPress={() => setShowSettings(true)}>
            <View style={styles.menuLine} />
            <View style={styles.menuLine} />
            <View style={styles.menuLine} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.chatArea} keyboardShouldPersistTaps="handled">
        {messages.length === 0 && (
          <View style={styles.emptyChat}>
            <Text style={styles.emptyChatIcon}>🔧</Text>
            <Text style={styles.emptyChatTitle}>AutoDoc</Text>
            <Text style={styles.emptyChatSub}>Describe your car problem, upload a photo, or attach a mechanic quote</Text>
          </View>
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
                  <TouchableOpacity key={vi} style={styles.videoItem} onPress={() => Linking.openURL(video.url)}>
                    <Text style={styles.videoTitle}>{video.title}</Text>
                    <Text style={styles.videoChannel}>{video.channel} • Watch on YouTube →</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        ))}
        {diagnosing && (
          <View style={styles.typingIndicator}>
            <ActivityIndicator size="small" color="#f5a623" />
            <Text style={styles.typingText}>AutoDoc is diagnosing...</Text>
          </View>
        )}
      </ScrollView>

      {selectedImage && (
        <View style={styles.imagePreview}>
          <Image source={{ uri: selectedImage.uri }} style={styles.previewThumb} />
          <Text style={styles.previewName} numberOfLines={1}>{selectedImage.name || "Photo attached"}</Text>
          <TouchableOpacity onPress={() => setSelectedImage(null)}>
            <Text style={styles.removeImage}>✕</Text>
          </TouchableOpacity>
        </View>
      )}

      {showMediaOptions && (
        <View style={styles.mediaOptions}>
          <TouchableOpacity style={styles.mediaOption} onPress={() => { takePhoto(); setShowMediaOptions(false); }}>
            <Text style={styles.mediaOptionIcon}>📷</Text>
            <Text style={styles.mediaOptionText}>Camera</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.mediaOption} onPress={() => { pickImage(); setShowMediaOptions(false); }}>
            <Text style={styles.mediaOptionIcon}>🖼</Text>
            <Text style={styles.mediaOptionText}>Gallery</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.mediaOption} onPress={() => { pickDocument(); setShowMediaOptions(false); }}>
            <Text style={styles.mediaOptionIcon}>📄</Text>
            <Text style={styles.mediaOptionText}>Document</Text>
          </TouchableOpacity>
        </View>
      )}

      <View style={styles.inputRow}>
        <TouchableOpacity
          style={[styles.plusBtn, showMediaOptions && styles.plusBtnActive]}
          onPress={() => setShowMediaOptions(!showMediaOptions)}
        >
          <Text style={styles.plusBtnText}>{showMediaOptions ? "✕" : "+"}</Text>
        </TouchableOpacity>
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
          setShowMediaOptions(false);
          setPendingMessage(message);
          setPendingImage(selectedImage);
          setShowVehicleSelector(true);
        }}>
          <Text style={styles.sendText}>↑</Text>
        </TouchableOpacity>
      </View>

      {showVehicleSelector && (
        <View style={styles.vehicleModal}>
          <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"}>
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
                  <TextInput style={styles.diffInput} placeholder="Year (e.g. 2020)" placeholderTextColor="#888" value={diffYear} onChangeText={setDiffYear} keyboardType="numeric" maxLength={4} />
                  <TextInput style={styles.diffInput} placeholder="Make (e.g. Toyota)" placeholderTextColor="#888" value={diffMake} onChangeText={setDiffMake} />
                  <TextInput style={styles.diffInput} placeholder="Model (e.g. Camry)" placeholderTextColor="#888" value={diffModel} onChangeText={setDiffModel} />
                  <TouchableOpacity style={styles.vehicleOption} onPress={() => sendMessage({ year: diffYear, make: diffMake, model: diffModel })}>
                    <Text style={styles.vehicleOptionText}>Diagnose This Car →</Text>
                  </TouchableOpacity>
                </View>
              )}
              <TouchableOpacity style={styles.vehicleCancel} onPress={() => {
                setShowVehicleSelector(false);
                setPendingMessage(null);
                setPendingImage(null);
                setDifferentVehicle(false);
                setDiffYear(""); setDiffMake(""); setDiffModel("");
              }}>
                <Text style={styles.vehicleCancelText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
        </View>
      )}

      <CarSelectorModal
        visible={showCarSelector}
        cars={cars}
        activeCar={car}
        onSelect={selectCar}
        onAdd={() => { setShowCarSelector(false); setShowAddCar(true); }}
        onDelete={deleteCar}
        onClose={() => setShowCarSelector(false)}
      />

      <StatusBar style="auto" />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0d0d0e" },
  header: { backgroundColor: "#161618", paddingTop: 56, paddingBottom: 12, paddingHorizontal: 16, flexDirection: "row", justifyContent: "space-between", alignItems: "center", borderBottomWidth: 1, borderBottomColor: "#2e2e33" },
  headerText: { color: "#f5a623", fontSize: 20, fontWeight: "bold" },
  carSelector: { flexDirection: "row", alignItems: "center", gap: 5, backgroundColor: "#1e1e21", borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6, borderWidth: 1, borderColor: "#2e2e33", maxWidth: 130 },
  carSelectorText: { color: "#e8e6e0", fontSize: 11, fontWeight: "500" },
  carSelectorArrow: { color: "#888", fontSize: 9 },
  headerRight: { flexDirection: "row", alignItems: "center", gap: 10 },
  quoteHistoryBtn: { color: "#f5a623", fontSize: 11, fontWeight: "500" },
  shopsIcon: { fontSize: 16 },
  menuBtn: { width: 28, height: 20, justifyContent: "space-between" },
  menuLine: { width: 20, height: 2, backgroundColor: "#e8e6e0", borderRadius: 2 },
  chatArea: { flex: 1, padding: 16 },
  emptyChat: { alignItems: "center", paddingTop: 80 },
  emptyChatIcon: { fontSize: 48, marginBottom: 12 },
  emptyChatTitle: { color: "#f5a623", fontSize: 24, fontWeight: "bold", marginBottom: 8 },
  emptyChatSub: { color: "#888", fontSize: 14, textAlign: "center", lineHeight: 20, paddingHorizontal: 32 },
  bubble: { borderRadius: 16, padding: 12, marginBottom: 12, maxWidth: "88%" },
  userBubble: { backgroundColor: "#222226", alignSelf: "flex-end" },
  botBubble: { backgroundColor: "#161618", alignSelf: "flex-start", borderWidth: 1, borderColor: "#2e2e33" },
  userText: { color: "#e8e6e0", fontSize: 14 },
  botText: { color: "#e8e6e0", fontSize: 14, lineHeight: 22 },
  messageImage: { width: 200, height: 150, borderRadius: 8, marginBottom: 8 },
  typingIndicator: { flexDirection: "row", alignItems: "center", gap: 8, padding: 12 },
  typingText: { color: "#888", fontSize: 13 },
  imagePreview: { flexDirection: "row", alignItems: "center", padding: 8, paddingHorizontal: 16, backgroundColor: "#161618", borderTopWidth: 1, borderTopColor: "#2e2e33", gap: 8 },
  previewThumb: { width: 40, height: 40, borderRadius: 6 },
  previewName: { flex: 1, color: "#888", fontSize: 12 },
  removeImage: { color: "#888", fontSize: 18, padding: 4 },
  mediaOptions: { backgroundColor: "#161618", borderTopWidth: 1, borderTopColor: "#2e2e33", flexDirection: "row", padding: 12, gap: 8 },
  mediaOption: { flex: 1, backgroundColor: "#1e1e21", borderRadius: 12, padding: 12, alignItems: "center", borderWidth: 1, borderColor: "#2e2e33" },
  mediaOptionIcon: { fontSize: 22, marginBottom: 4 },
  mediaOptionText: { color: "#888", fontSize: 11 },
  inputRow: { flexDirection: "row", padding: 12, backgroundColor: "#161618", borderTopWidth: 1, borderTopColor: "#2e2e33", alignItems: "flex-end", gap: 8 },
  plusBtn: { width: 42, height: 42, borderRadius: 21, backgroundColor: "#1e1e21", borderWidth: 1, borderColor: "#2e2e33", justifyContent: "center", alignItems: "center" },
  plusBtnActive: { backgroundColor: "#2e2e33", borderColor: "#f5a623" },
  plusBtnText: { color: "#f5a623", fontSize: 22, fontWeight: "300", lineHeight: 26 },
  input: { flex: 1, backgroundColor: "#1e1e21", color: "#e8e6e0", borderRadius: 20, paddingHorizontal: 14, paddingVertical: 10, fontSize: 14, borderWidth: 1, borderColor: "#2e2e33", maxHeight: 100 },
  shopsBtn: { backgroundColor: "#1e1e21", borderRadius: 20, paddingHorizontal: 10, paddingVertical: 5, borderWidth: 1, borderColor: "#2e2e33" },
  shopsBtnText: { color: "#e8e6e0", fontSize: 11, fontWeight: "500" },
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