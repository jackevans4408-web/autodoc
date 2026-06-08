import { StatusBar } from "expo-status-bar";
import { StyleSheet, Text, View, TextInput, TouchableOpacity, ScrollView, ActivityIndicator, Image, Linking, KeyboardAvoidingView, Platform, Keyboard, Modal, Animated } from "react-native";
import { useState, useEffect, useRef } from "react";
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
  let inCostSection = false;
  const elements = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];
    const cleaned = line.replace(/##?\s*/g, '').trim();
    if (!cleaned) { i++; continue; }

    if (cleaned.startsWith('💰')) inCostSection = true;
    else if (cleaned.startsWith('🔧') || cleaned.startsWith('📋') ||
      cleaned.startsWith('⚠️') || cleaned.startsWith('🛠') ||
      cleaned.startsWith('🔍') || cleaned.startsWith('🚨')) {
      inCostSection = false;
    }

    const isUrgency = cleaned.toLowerCase().includes('urgency:');
    const isSectionHeader = cleaned.startsWith('🔧') || cleaned.startsWith('📋') ||
      cleaned.startsWith('💰') || cleaned.startsWith('⚠️') ||
      cleaned.startsWith('🛠') || cleaned.startsWith('🔍') ||
      cleaned.startsWith('🚨') || cleaned.startsWith('🔴');
    const isBullet = cleaned.startsWith('•') || cleaned.startsWith('-');
    const isStep = /^Step \d+:/i.test(cleaned);
    const isNumbered = /^\d+\./.test(cleaned);
    const isCostLine = inCostSection && cleaned.includes('DIY') && cleaned.includes('Shop') && !isSectionHeader;
    const isCritical = isUrgency && (cleaned.toLowerCase().includes('critical') || cleaned.toLowerCase().includes('high'));
    const isMedium = isUrgency && cleaned.toLowerCase().includes('medium');
    const isLow = isUrgency && cleaned.toLowerCase().includes('low');

    if (cleaned.startsWith('💰') && isSectionHeader) {
      elements.push(
        <View key={i}>
          <Text style={styles.sectionHeader}>{cleaned}</Text>
          <View style={styles.costHeaderRow}>
            <Text style={styles.costHeaderCause}>Issue</Text>
            <View style={styles.costCols}>
              <Text style={styles.costHeaderDiy}>DIY</Text>
              <Text style={styles.costHeaderShop}>Shop</Text>
            </View>
          </View>
        </View>
      );
      i++; continue;
    }

    if (isCostLine) {
      const parts = cleaned.split(':');
      const causeName = parts[0]?.trim();
      const costPart = parts.slice(1).join(':').trim();
      const diyMatch = costPart.match(/DIY\s*\$[\d,\.]+[-–]\$?[\d,\.]+/i);
      const shopMatch = costPart.match(/Shop\s*\$[\d,\.]+[-–]\$?[\d,\.]+/i);
      const diy = diyMatch ? diyMatch[0].replace(/DIY\s*/i, '').trim() : '';
      const shop = shopMatch ? shopMatch[0].replace(/Shop\s*/i, '').trim() : '';
      elements.push(
        <View key={i} style={styles.costRow}>
          <Text style={styles.costCause} numberOfLines={2}>{causeName}</Text>
          <View style={styles.costCols}>
            <Text style={styles.costDiy}>{diy}</Text>
            <Text style={styles.costShop}>{shop}</Text>
          </View>
        </View>
      );
      i++; continue;
    }

    if (isBullet) {
      elements.push(
        <View key={i} style={styles.bulletRow}>
          <Text style={styles.bulletSymbol}>•</Text>
          <Text style={styles.bulletContent}>{cleaned.replace(/^[•\-]\s*/, '')}</Text>
        </View>
      );
      i++; continue;
    }

    if (isStep) {
      elements.push(
        <View key={i} style={styles.stepRow}>
          <Text style={styles.stepText}>{cleaned}</Text>
        </View>
      );
      i++; continue;
    }

    elements.push(
      <Text key={i} style={[
        styles.botText,
        isSectionHeader && styles.sectionHeader,
        isCritical && styles.urgencyCritical,
        isMedium && styles.urgencyMedium,
        isLow && styles.urgencyLow,
        isNumbered && styles.numberedText,
      ]}>
        {cleaned}
      </Text>
    );
    i++;
  }

  return <View style={{ paddingVertical: 4 }}>{elements}</View>;
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
  const [conversationHistory, setConversationHistory] = useState([]);
  const [showMenuPanel, setShowMenuPanel] = useState(false);
  const [savedDiagnoses, setSavedDiagnoses] = useState([]);
  const [recalls, setRecalls] = useState(null);
  const [loadingRecalls, setLoadingRecalls] = useState(false);
  const scrollViewRef = useRef(null);
  const slideAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    checkSavedLogin();
  }, []);

  useEffect(() => {
    if (car?.year && car?.make && car?.model) {
      loadRecalls();
    }
  }, [car]);

  const checkSavedLogin = async () => {
    try {
      const savedSession = await SecureStore.getItemAsync("userSession");
      const savedCar = await SecureStore.getItemAsync("userCar");
      const savedCars = await SecureStore.getItemAsync("userCars");
      const savedDiags = await SecureStore.getItemAsync("savedDiagnoses");
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
      if (savedDiags) setSavedDiagnoses(JSON.parse(savedDiags));
    } catch (e) {
      console.log("Auth error:", e);
    }
    setLoading(false);
  };

  const loadRecalls = async () => {
    setLoadingRecalls(true);
    try {
      const url = `https://api.nhtsa.gov/recalls/recallsByVehicle?make=${car.make}&model=${car.model}&modelYear=${car.year}`;
      const response = await fetch(url);
      const data = await response.json();
      setRecalls(data.results || []);
    } catch (e) {
      setRecalls([]);
    }
    setLoadingRecalls(false);
  };

  const openMenuPanel = () => {
    setShowMenuPanel(true);
    Animated.timing(slideAnim, {
      toValue: 1,
      duration: 250,
      useNativeDriver: true,
    }).start();
  };

  const closeMenuPanel = () => {
    Animated.timing(slideAnim, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start(() => setShowMenuPanel(false));
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

  const startNewDiagnosis = () => {
    setMessages([]);
    setConversationHistory([]);
    setMessage("");
    setSelectedImage(null);
  };

  const saveDiagnosisToHistory = async (problem, diagnosisText) => {
    const newDiag = {
      id: Date.now().toString(),
      problem: problem,
      diagnosis: diagnosisText,
      date: new Date().toLocaleDateString(),
      car: `${car?.year} ${car?.make} ${car?.model}`,
    };
    const updated = [newDiag, ...savedDiagnoses];
    setSavedDiagnoses(updated);
    await SecureStore.setItemAsync("savedDiagnoses", JSON.stringify(updated));
  };

  const loadDiagnosis = (diag) => {
    setMessages([
      { role: "user", text: diag.problem },
      { role: "bot", text: diag.diagnosis }
    ]);
    setConversationHistory([
      { role: "user", content: diag.problem },
      { role: "assistant", content: diag.diagnosis }
    ]);
    closeMenuPanel();
  };

  const deleteSavedDiagnosis = async (id) => {
    const updated = savedDiagnoses.filter(d => d.id !== id);
    setSavedDiagnoses(updated);
    await SecureStore.setItemAsync("savedDiagnoses", JSON.stringify(updated));
  };

  const sendMessage = async (overrideCar = null, directMessage = null) => {
    const userMessage = directMessage !== null ? directMessage : (pendingMessage !== null ? pendingMessage : message);
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
    const currentHistory = [...conversationHistory];
    const isFollowup = currentHistory.length > 0;

    try {
      const body = {
        text: userMessage,
        car_year: activeCar?.year,
        car_make: activeCar?.make,
        car_model: activeCar?.model,
        conversation_history: currentHistory.length > 0 ? currentHistory : null,
        is_followup: isFollowup,
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

      const updatedHistory = [
        ...currentHistory,
        { role: "user", content: userMessage },
        { role: "assistant", content: data.diagnosis }
      ];
      setConversationHistory(updatedHistory);

      setMessages(prev => [...prev, {
        role: "bot",
        text: data.diagnosis,
        videos: data.videos
      }]);

      if (!isFollowup) {
        saveDiagnosisToHistory(userMessage, data.diagnosis);
      }

      setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 100);

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
    setConversationHistory([]);
  };

  const selectCar = async (selectedCar) => {
    setCar(selectedCar);
    await SecureStore.setItemAsync("userCar", JSON.stringify(selectedCar));
    setShowCarSelector(false);
    setMessages([]);
    setConversationHistory([]);
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
    <KeyboardAvoidingView style={styles.container} behavior="padding">
      <View style={styles.header}>
        <TouchableOpacity style={styles.menuBtn} onPress={openMenuPanel}>
          <View style={styles.menuLine} />
          <View style={styles.menuLine} />
          <View style={styles.menuLine} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerText}>AutoDoc</Text>
          <TouchableOpacity style={styles.carSelector} onPress={() => setShowCarSelector(true)}>
            <Text style={styles.carSelectorText} numberOfLines={1}>{car.year} {car.make} {car.model}</Text>
            <Text style={styles.carSelectorArrow}>▼</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity onPress={() => setShowQuoteHistory(true)}>
            <Text style={styles.quoteHistoryBtn}>📄 Quotes</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.shopsBtn} onPress={() => Linking.openURL("maps://maps.apple.com/?q=auto+repair+shop+near+me")}>
            <Text style={styles.shopsBtnText}>🔧 Shops</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView ref={scrollViewRef} style={styles.chatArea} keyboardShouldPersistTaps="handled">
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
        {conversationHistory.length > 0 && (
          <TouchableOpacity style={styles.newDiagBtn} onPress={startNewDiagnosis}>
            <Text style={styles.newDiagBtnText}>+ New</Text>
          </TouchableOpacity>
        )}
        <TextInput
          style={styles.input}
          value={message}
          onChangeText={setMessage}
          placeholder={conversationHistory.length > 0 ? "Ask a follow-up question..." : "Describe your car issue..."}
          placeholderTextColor="#888"
          multiline
        />
        <TouchableOpacity style={styles.sendBtn} onPress={() => {
          if (!message.trim() && !selectedImage) return;
          Keyboard.dismiss();
          setShowMediaOptions(false);
          if (conversationHistory.length > 0) {
            const msgToSend = message;
            setMessage("");
            sendMessage(car, msgToSend);
          } else {
            setPendingMessage(message);
            setPendingImage(selectedImage);
            setShowVehicleSelector(true);
          }
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

      {/* Left Side Menu Panel */}
      {showMenuPanel && (
        <Modal visible={showMenuPanel} transparent animationType="none">
          <View style={styles.menuOverlay}>
            <Animated.View style={[styles.menuPanel, {
              transform: [{
                translateX: slideAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [-400, 0],
                })
              }]
            }]}>
              <ScrollView>
                <View style={styles.menuPanelHeader}>
                  <Text style={styles.menuPanelTitle}>AutoDoc</Text>
                  <TouchableOpacity onPress={closeMenuPanel}>
                    <Text style={styles.menuPanelClose}>✕</Text>
                  </TouchableOpacity>
                </View>

                {/* Settings Button */}
                <TouchableOpacity style={styles.menuSettingsBtn} onPress={() => { closeMenuPanel(); setShowSettings(true); }}>
                  <Text style={styles.menuSettingsBtnText}>⚙️ Settings</Text>
                  <Text style={styles.menuSettingsArrow}>→</Text>
                </TouchableOpacity>

                <View style={styles.menuDivider} />

                {/* My Vehicle & Recalls */}
                <Text style={styles.menuSectionLabel}>My Vehicle</Text>
                <View style={styles.menuVehicleCard}>
                  <Text style={styles.menuVehicleName}>🚗 {car?.year} {car?.make} {car?.model}</Text>
                  <TouchableOpacity onPress={() => { closeMenuPanel(); setShowCarSelector(true); }}>
                    <Text style={styles.menuVehicleChange}>Change →</Text>
                  </TouchableOpacity>
                </View>

                <Text style={styles.menuSectionLabel}>Active Recalls</Text>
                {loadingRecalls ? (
                  <ActivityIndicator size="small" color="#f5a623" style={{ marginVertical: 12 }} />
                ) : recalls === null ? (
                  <Text style={styles.menuRecallLoading}>Loading recalls...</Text>
                ) : recalls.length === 0 ? (
                  <Text style={styles.menuNoRecalls}>✅ No active recalls found</Text>
                ) : (
                  recalls.map((recall, i) => (
                    <View key={i} style={styles.menuRecallCard}>
                      <Text style={styles.menuRecallComponent}>{recall.Component}</Text>
                      <Text style={styles.menuRecallSummary} numberOfLines={2}>{recall.Summary}</Text>
                    </View>
                  ))
                )}

                <View style={styles.menuDivider} />

                {/* Diagnosis History */}
                <Text style={styles.menuSectionLabel}>Diagnosis History</Text>
                {savedDiagnoses.length === 0 ? (
                  <Text style={styles.menuNoDiagnoses}>No saved diagnoses yet</Text>
                ) : (
                  savedDiagnoses.map((diag) => (
                    <TouchableOpacity key={diag.id} style={styles.menuDiagItem} onPress={() => loadDiagnosis(diag)}>
                      <View style={styles.menuDiagContent}>
                        <Text style={styles.menuDiagProblem} numberOfLines={1}>{diag.problem}</Text>
                        <Text style={styles.menuDiagMeta}>{diag.car} · {diag.date}</Text>
                      </View>
                      <TouchableOpacity onPress={() => deleteSavedDiagnosis(diag.id)}>
                        <Text style={styles.menuDiagDelete}>✕</Text>
                      </TouchableOpacity>
                    </TouchableOpacity>
                  ))
                )}

                <View style={styles.menuDivider} />

                {/* Sign Out */}
                <TouchableOpacity style={styles.menuSignOut} onPress={signOut}>
                  <Text style={styles.menuSignOutText}>Sign Out</Text>
                </TouchableOpacity>

                <View style={{ height: 40 }} />
              </ScrollView>
            </Animated.View>

            {/* Tap outside to close */}
            <TouchableOpacity style={styles.menuOverlayTap} onPress={closeMenuPanel} activeOpacity={1} />
          </View>
        </Modal>
      )}

      <StatusBar style="auto" />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0d0d0e" },
  header: { backgroundColor: "#161618", paddingTop: 56, paddingBottom: 12, paddingHorizontal: 16, flexDirection: "row", alignItems: "center", borderBottomWidth: 1, borderBottomColor: "#2e2e33", gap: 12 },
  menuBtn: { width: 24, height: 18, justifyContent: "space-between" },
  menuLine: { width: 20, height: 2, backgroundColor: "#e8e6e0", borderRadius: 2 },
  headerCenter: { flex: 1 },
  headerText: { color: "#f5a623", fontSize: 20, fontWeight: "bold" },
  carSelector: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 2 },
  carSelectorText: { color: "#888", fontSize: 11 },
  carSelectorArrow: { color: "#888", fontSize: 9 },
  headerRight: { flexDirection: "row", alignItems: "center", gap: 10 },
  quoteHistoryBtn: { color: "#f5a623", fontSize: 11, fontWeight: "500" },
  shopsBtn: { backgroundColor: "#1e1e21", borderRadius: 20, paddingHorizontal: 10, paddingVertical: 5, borderWidth: 1, borderColor: "#2e2e33" },
  shopsBtnText: { color: "#e8e6e0", fontSize: 11, fontWeight: "500" },
  chatArea: { flex: 1, padding: 16 },
  emptyChat: { alignItems: "center", paddingTop: 80 },
  emptyChatIcon: { fontSize: 48, marginBottom: 12 },
  emptyChatTitle: { color: "#f5a623", fontSize: 24, fontWeight: "bold", marginBottom: 8 },
  emptyChatSub: { color: "#888", fontSize: 14, textAlign: "center", lineHeight: 20, paddingHorizontal: 32 },
  bubble: { borderRadius: 16, padding: 12, marginBottom: 12, maxWidth: "96%" },
  userBubble: { backgroundColor: "#222226", alignSelf: "flex-end" },
  botBubble: { backgroundColor: "#161618", alignSelf: "flex-start", borderWidth: 1, borderColor: "#2e2e33" },
  userText: { color: "#e8e6e0", fontSize: 14 },
  botText: { color: "#e8e6e0", fontSize: 14, lineHeight: 22 },
  messageImage: { width: 200, height: 150, borderRadius: 8, marginBottom: 8 },
  sectionHeader: { color: "#f5a623", fontWeight: "bold", fontSize: 15, marginTop: 14, marginBottom: 6 },
  urgencyCritical: { color: "#e05a5a", fontWeight: "bold", fontSize: 15, marginBottom: 8 },
  urgencyMedium: { color: "#f5a623", fontWeight: "bold", fontSize: 15, marginBottom: 8 },
  urgencyLow: { color: "#4caf7d", fontWeight: "bold", fontSize: 15, marginBottom: 8 },
  bulletRow: { flexDirection: "row", marginBottom: 4, paddingRight: 8 },
  bulletSymbol: { color: "#e8e6e0", fontSize: 14, marginRight: 6, lineHeight: 22 },
  bulletContent: { color: "#e8e6e0", fontSize: 14, lineHeight: 22, flex: 1 },
  stepRow: { marginBottom: 4 },
  stepText: { color: "#e8e6e0", fontSize: 14, lineHeight: 22 },
  numberedText: { color: "#e8e6e0", fontSize: 14, lineHeight: 22, marginBottom: 4, fontWeight: "500" },
  costHeaderRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingBottom: 6, borderBottomWidth: 1, borderBottomColor: "#f5a62344", marginBottom: 4 },
  costHeaderCause: { color: "#888", fontSize: 11, fontWeight: "600", textTransform: "uppercase", flex: 1 },
  costCols: { flexDirection: "row", gap: 8 },
  costHeaderDiy: { color: "#4caf7d", fontSize: 11, fontWeight: "600", textTransform: "uppercase", width: 75, textAlign: "right" },
  costHeaderShop: { color: "#f5a623", fontSize: 11, fontWeight: "600", textTransform: "uppercase", width: 80, textAlign: "right" },
  costRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", paddingVertical: 5, borderBottomWidth: 1, borderBottomColor: "#2e2e33" },
  costCause: { color: "#e8e6e0", fontSize: 13, flex: 1, marginRight: 8, lineHeight: 18 },
  costDiy: { color: "#4caf7d", fontSize: 13, fontWeight: "500", width: 75, textAlign: "right" },
  costShop: { color: "#f5a623", fontSize: 13, fontWeight: "500", width: 80, textAlign: "right" },
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
  inputRow: { flexDirection: "row", padding: 12, paddingBottom: 8, backgroundColor: "#161618", borderTopWidth: 1, borderTopColor: "#2e2e33", alignItems: "center", gap: 8 },
  plusBtn: { width: 42, height: 42, borderRadius: 21, backgroundColor: "#1e1e21", borderWidth: 1, borderColor: "#2e2e33", justifyContent: "center", alignItems: "center" },
  plusBtnActive: { backgroundColor: "#2e2e33", borderColor: "#f5a623" },
  plusBtnText: { color: "#f5a623", fontSize: 22, fontWeight: "300", lineHeight: 26 },
  newDiagBtn: { backgroundColor: "#1e1e21", borderRadius: 20, paddingHorizontal: 10, paddingVertical: 6, borderWidth: 1, borderColor: "#f5a62344" },
  newDiagBtnText: { color: "#f5a623", fontSize: 12, fontWeight: "500" },
  input: { flex: 1, backgroundColor: "#1e1e21", color: "#e8e6e0", borderRadius: 20, paddingHorizontal: 14, paddingVertical: 10, fontSize: 14, borderWidth: 1, borderColor: "#2e2e33", maxHeight: 100 },
  sendBtn: { width: 42, height: 42, borderRadius: 21, backgroundColor: "#f5a623", justifyContent: "center", alignItems: "center" },
  sendText: { color: "#0d0d0e", fontWeight: "bold", fontSize: 20, marginTop: -2 },
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
  menuOverlay: { flex: 1, flexDirection: "row" },
  menuPanel: { width: "80%", backgroundColor: "#161618", borderRightWidth: 1, borderRightColor: "#2e2e33" },
  menuOverlayTap: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)" },
  menuPanelHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 20, paddingTop: 60, borderBottomWidth: 1, borderBottomColor: "#2e2e33" },
  menuPanelTitle: { color: "#f5a623", fontSize: 20, fontWeight: "bold" },
  menuPanelClose: { color: "#888", fontSize: 20 },
  menuSettingsBtn: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 16, margin: 16, backgroundColor: "#1e1e21", borderRadius: 12, borderWidth: 1, borderColor: "#2e2e33" },
  menuSettingsBtnText: { color: "#e8e6e0", fontSize: 15, fontWeight: "500" },
  menuSettingsArrow: { color: "#888", fontSize: 16 },
  menuDivider: { height: 1, backgroundColor: "#2e2e33", marginVertical: 8 },
  menuSectionLabel: { color: "#888", fontSize: 11, fontWeight: "600", textTransform: "uppercase", letterSpacing: 0.8, paddingHorizontal: 16, paddingVertical: 8 },
  menuVehicleCard: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginHorizontal: 16, backgroundColor: "#1e1e21", borderRadius: 10, padding: 12, borderWidth: 1, borderColor: "#2e2e33", marginBottom: 8 },
  menuVehicleName: { color: "#e8e6e0", fontSize: 13, fontWeight: "500" },
  menuVehicleChange: { color: "#f5a623", fontSize: 12 },
  menuRecallLoading: { color: "#888", fontSize: 13, paddingHorizontal: 16, paddingBottom: 8 },
  menuNoRecalls: { color: "#4caf7d", fontSize: 13, paddingHorizontal: 16, paddingBottom: 8 },
  menuRecallCard: { marginHorizontal: 16, backgroundColor: "#1e1e21", borderRadius: 10, padding: 12, borderWidth: 1, borderColor: "#e05a5a44", marginBottom: 8 },
  menuRecallComponent: { color: "#e05a5a", fontWeight: "600", fontSize: 13, marginBottom: 4 },
  menuRecallSummary: { color: "#888", fontSize: 12, lineHeight: 18 },
  menuNoDiagnoses: { color: "#888", fontSize: 13, paddingHorizontal: 16, paddingBottom: 8 },
  menuDiagItem: { flexDirection: "row", alignItems: "center", marginHorizontal: 16, backgroundColor: "#1e1e21", borderRadius: 10, padding: 12, borderWidth: 1, borderColor: "#2e2e33", marginBottom: 8 },
  menuDiagContent: { flex: 1 },
  menuDiagProblem: { color: "#e8e6e0", fontSize: 13, fontWeight: "500", marginBottom: 2 },
  menuDiagMeta: { color: "#888", fontSize: 11 },
  menuDiagDelete: { color: "#888", fontSize: 14, padding: 4 },
  menuSignOut: { margin: 16, backgroundColor: "#161618", borderRadius: 12, borderWidth: 1, borderColor: "#e05a5a44", padding: 14, alignItems: "center" },
  menuSignOutText: { color: "#e05a5a", fontSize: 14, fontWeight: "600" },
});