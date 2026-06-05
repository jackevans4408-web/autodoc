import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Image, ActivityIndicator } from "react-native";
import { useState } from "react";
import * as ImagePicker from "expo-image-picker";

export default function MechanicQuoteScreen({ car, onBack }) {
  const [selectedImage, setSelectedImage] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const takePhoto = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) { alert("Camera permission required!"); return; }
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      quality: 0.8,
      base64: true,
    });
    if (!result.canceled) setSelectedImage(result.assets[0]);
  };

  const pickImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) { alert("Gallery permission required!"); return; }
    const result = await ImagePicker.launchImageLibraryAsync({
      allowsEditing: true,
      quality: 0.8,
      base64: true,
    });
    if (!result.canceled) setSelectedImage(result.assets[0]);
  };

  const analyzeQuote = async () => {
    if (!selectedImage) { alert("Please upload a photo of your mechanic quote first!"); return; }
    setLoading(true);
    setError("");

    try {
      const body = {
        text: `Please analyze this mechanic repair quote for my ${car?.year} ${car?.make} ${car?.model}. For each line item tell me: 1) Is this repair necessary or is it an upsell? 2) Is the price fair or inflated? 3) Can I DIY this? 4) Can it wait or is it urgent? End with a summary of what I should actually get done and what I can skip or negotiate.`,
        image_base64: selectedImage.base64,
        image_type: "image/jpeg",
        car_year: car?.year,
        car_make: car?.make,
        car_model: car?.model,
      };

      const response = await fetch("https://autodoc-production-1703.up.railway.app/diagnose", {
        method: "POST",
        headers: { "Accept": "application/json", "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await response.json();
      setAnalysis(data.diagnosis);
    } catch (e) {
      setError("Error analyzing quote. Please try again.");
    }
    setLoading(false);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerText}>Mechanic Quote</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView style={styles.content}>
        <Text style={styles.title}>Analyze Your Repair Quote</Text>
        <Text style={styles.subtitle}>Upload a photo of your mechanic's estimate and AutoDoc will tell you what's necessary, what's an upsell, and if the prices are fair.</Text>

        {!selectedImage ? (
          <View style={styles.uploadArea}>
            <Text style={styles.uploadIcon}>📄</Text>
            <Text style={styles.uploadText}>Upload your mechanic quote</Text>
            <View style={styles.uploadButtons}>
              <TouchableOpacity style={styles.uploadBtn} onPress={takePhoto}>
                <Text style={styles.uploadBtnText}>📷 Take Photo</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.uploadBtn} onPress={pickImage}>
                <Text style={styles.uploadBtnText}>🖼 Gallery</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <View style={styles.imageContainer}>
            <Image source={{ uri: selectedImage.uri }} style={styles.quoteImage} />
            <TouchableOpacity style={styles.changeBtn} onPress={() => setSelectedImage(null)}>
              <Text style={styles.changeBtnText}>Change Photo</Text>
            </TouchableOpacity>
          </View>
        )}

        {selectedImage && !analysis && (
          <TouchableOpacity style={styles.analyzeBtn} onPress={analyzeQuote} disabled={loading}>
            {loading ? (
              <ActivityIndicator color="#0d0d0e" />
            ) : (
              <Text style={styles.analyzeBtnText}>🔍 Analyze Quote</Text>
            )}
          </TouchableOpacity>
        )}

        {loading && (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>AutoDoc is analyzing your quote...</Text>
            <Text style={styles.loadingSubtext}>This may take a moment</Text>
          </View>
        )}

        {error ? <Text style={styles.error}>{error}</Text> : null}

        {analysis && (
          <View style={styles.analysisContainer}>
            <Text style={styles.analysisTitle}>📋 Quote Analysis</Text>
            {analysis.split('\n').filter(line => line.trim()).map((line, i) => {
              const isNecessary = line.toLowerCase().includes('necessary') || line.toLowerCase().includes('important') || line.toLowerCase().includes('urgent');
              const isUpsell = line.toLowerCase().includes('upsell') || line.toLowerCase().includes('unnecessary') || line.toLowerCase().includes('skip') || line.toLowerCase().includes('wait');
              const isCost = line.toLowerCase().includes('$') || line.toLowerCase().includes('price') || line.toLowerCase().includes('cost');
              const isHeader = line.startsWith('##') || line.startsWith('**');
              const cleaned = line.replace(/##\s*/g, '').replace(/\*\*/g, '').replace(/^-\s*/, '• ');
              return (
                <Text key={i} style={[
                  styles.analysisText,
                  isHeader && styles.analysisHeader,
                  isNecessary && styles.necessary,
                  isUpsell && styles.upsell,
                  isCost && styles.cost,
                ]}>
                  {cleaned}
                </Text>
              );
            })}
            <TouchableOpacity style={styles.newQuoteBtn} onPress={() => { setSelectedImage(null); setAnalysis(null); }}>
              <Text style={styles.newQuoteBtnText}>Analyze Another Quote</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0d0d0e" },
  header: { backgroundColor: "#161618", paddingTop: 60, paddingBottom: 20, paddingHorizontal: 20, flexDirection: "row", justifyContent: "space-between", alignItems: "center", borderBottomWidth: 1, borderBottomColor: "#2e2e33" },
  backBtn: { width: 60 },
  backText: { color: "#f5a623", fontSize: 14 },
  headerText: { color: "#f5a623", fontSize: 20, fontWeight: "bold" },
  content: { flex: 1, padding: 20 },
  title: { color: "#e8e6e0", fontSize: 22, fontWeight: "bold", marginBottom: 8 },
  subtitle: { color: "#888", fontSize: 14, lineHeight: 20, marginBottom: 24 },
  uploadArea: { backgroundColor: "#161618", borderRadius: 16, padding: 32, alignItems: "center", borderWidth: 1, borderColor: "#2e2e33", borderStyle: "dashed", marginBottom: 20 },
  uploadIcon: { fontSize: 48, marginBottom: 12 },
  uploadText: { color: "#888", fontSize: 16, marginBottom: 20 },
  uploadButtons: { flexDirection: "row", gap: 12 },
  uploadBtn: { backgroundColor: "#1e1e21", borderRadius: 8, padding: 12, paddingHorizontal: 20, borderWidth: 1, borderColor: "#2e2e33" },
  uploadBtnText: { color: "#e8e6e0", fontSize: 14 },
  imageContainer: { marginBottom: 20 },
  quoteImage: { width: "100%", height: 300, borderRadius: 12, marginBottom: 12 },
  changeBtn: { backgroundColor: "#1e1e21", borderRadius: 8, padding: 10, alignItems: "center", borderWidth: 1, borderColor: "#2e2e33" },
  changeBtnText: { color: "#888", fontSize: 13 },
  analyzeBtn: { backgroundColor: "#f5a623", borderRadius: 12, padding: 16, alignItems: "center", marginBottom: 20 },
  analyzeBtnText: { color: "#0d0d0e", fontWeight: "bold", fontSize: 16 },
  loadingContainer: { alignItems: "center", padding: 20 },
  loadingText: { color: "#e8e6e0", fontSize: 15, marginBottom: 8 },
  loadingSubtext: { color: "#888", fontSize: 13 },
  error: { color: "#e05a5a", textAlign: "center", marginTop: 12 },
  analysisContainer: { backgroundColor: "#161618", borderRadius: 16, padding: 20, borderWidth: 1, borderColor: "#2e2e33", marginBottom: 40 },
  analysisTitle: { color: "#f5a623", fontSize: 18, fontWeight: "bold", marginBottom: 16 },
  analysisText: { color: "#e8e6e0", fontSize: 14, lineHeight: 22, marginBottom: 4 },
  analysisHeader: { color: "#f5a623", fontWeight: "bold", fontSize: 15, marginTop: 12 },
  necessary: { color: "#e05a5a", fontWeight: "500" },
  upsell: { color: "#4caf7d", fontWeight: "500" },
  cost: { color: "#f5a623" },
  newQuoteBtn: { backgroundColor: "#1e1e21", borderRadius: 8, padding: 12, alignItems: "center", marginTop: 20, borderWidth: 1, borderColor: "#2e2e33" },
  newQuoteBtnText: { color: "#888", fontSize: 13 },
});