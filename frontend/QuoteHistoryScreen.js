import { View, Text, TouchableOpacity, StyleSheet, ScrollView, TextInput, Modal, KeyboardAvoidingView, Platform, Image, ActivityIndicator } from "react-native";
import { useState, useEffect } from "react";
import * as SecureStore from "expo-secure-store";
import * as ImagePicker from "expo-image-picker";

export default function QuoteHistoryScreen({ car, onBack }) {
  const [activeTab, setActiveTab] = useState("quotes");
  const [repairs, setRepairs] = useState([]);
  const [quotes, setQuotes] = useState([]);
  const [showAddRepair, setShowAddRepair] = useState(false);
  const [showAddQuote, setShowAddQuote] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState(null);
  const [repairName, setRepairName] = useState("");
  const [repairDate, setRepairDate] = useState("");
  const [repairCost, setRepairCost] = useState("");
  const [repairMileage, setRepairMileage] = useState("");
  const [repairNotes, setRepairNotes] = useState("");
  const [nextServiceMiles, setNextServiceMiles] = useState("");
  const [expandedQuote, setExpandedQuote] = useState(null);
  const [expandedRepair, setExpandedRepair] = useState(null);
  const [currentMileage, setCurrentMileage] = useState("");
  const [showMileageInput, setShowMileageInput] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const savedRepairs = await SecureStore.getItemAsync("repairHistory");
      const savedQuotes = await SecureStore.getItemAsync("savedQuotes");
      const savedMileage = await SecureStore.getItemAsync("currentMileage");
      if (savedRepairs) setRepairs(JSON.parse(savedRepairs));
      if (savedQuotes) setQuotes(JSON.parse(savedQuotes));
      if (savedMileage) setCurrentMileage(savedMileage);
    } catch (e) {
      console.log("Error loading data:", e);
    }
  };

  const totalSpent = repairs.reduce((sum, r) => sum + (parseFloat(r.cost) || 0), 0);

  const getMaintenanceStatus = (repair) => {
    if (!repair.mileage || !repair.nextServiceMiles || !currentMileage) return null;
    const lastMileage = parseFloat(repair.mileage);
    const interval = parseFloat(repair.nextServiceMiles);
    const current = parseFloat(currentMileage);
    const nextDue = lastMileage + interval;
    const milesRemaining = nextDue - current;
    return { nextDue, milesRemaining };
  };

  const pickImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) { alert("Permission required!"); return; }
    const result = await ImagePicker.launchImageLibraryAsync({
      allowsEditing: true, quality: 0.8, base64: true,
    });
    if (!result.canceled) { setSelectedImage(result.assets[0]); setAnalysis(null); }
  };

  const takePhoto = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) { alert("Permission required!"); return; }
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true, quality: 0.8, base64: true,
    });
    if (!result.canceled) { setSelectedImage(result.assets[0]); setAnalysis(null); }
  };

  const analyzeQuote = async () => {
    if (!selectedImage) { alert("Please upload a photo first!"); return; }
    setAnalyzing(true);
    try {
      const body = {
        text: `Analyze this mechanic repair quote for my ${car?.year} ${car?.make} ${car?.model}. For each line item: 1) Necessary or upsell? 2) Fair price or inflated? 3) DIY possible? 4) Urgent or can wait? End with a summary of what to actually get done.`,
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
      const newQuote = {
        id: Date.now().toString(),
        date: new Date().toLocaleDateString(),
        imageUri: selectedImage.uri,
        analysis: data.diagnosis,
      };
      const updated = [newQuote, ...quotes];
      setQuotes(updated);
      await SecureStore.setItemAsync("savedQuotes", JSON.stringify(updated));
    } catch (e) {
      alert("Error analyzing quote. Try again.");
    }
    setAnalyzing(false);
  };

  const addRepair = async () => {
    if (!repairName.trim()) { alert("Please enter a repair name"); return; }
    const newRepair = {
      id: Date.now().toString(),
      name: repairName,
      date: repairDate || new Date().toLocaleDateString(),
      cost: repairCost,
      mileage: repairMileage,
      notes: repairNotes,
      nextServiceMiles: nextServiceMiles,
    };
    const updated = [newRepair, ...repairs];
    setRepairs(updated);
    await SecureStore.setItemAsync("repairHistory", JSON.stringify(updated));
    setShowAddRepair(false);
    setRepairName(""); setRepairDate(""); setRepairCost(""); setRepairMileage(""); setRepairNotes(""); setNextServiceMiles("");
  };

  const deleteRepair = async (id) => {
    const updated = repairs.filter(r => r.id !== id);
    setRepairs(updated);
    await SecureStore.setItemAsync("repairHistory", JSON.stringify(updated));
  };

  const deleteQuote = async (id) => {
    const updated = quotes.filter(q => q.id !== id);
    setQuotes(updated);
    await SecureStore.setItemAsync("savedQuotes", JSON.stringify(updated));
  };

  const saveMileage = async () => {
    await SecureStore.setItemAsync("currentMileage", currentMileage);
    setShowMileageInput(false);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerText}>Quote / History</Text>
        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => activeTab === "history" ? setShowAddRepair(true) : setShowAddQuote(true)}
        >
          <Text style={styles.addBtnText}>+ Add</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, activeTab === "quotes" && styles.tabActive]}
          onPress={() => setActiveTab("quotes")}
        >
          <Text style={[styles.tabText, activeTab === "quotes" && styles.tabTextActive]}>📄 Quotes</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === "history" && styles.tabActive]}
          onPress={() => setActiveTab("history")}
        >
          <Text style={[styles.tabText, activeTab === "history" && styles.tabTextActive]}>🔧 Repair History</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {activeTab === "quotes" && (
          <View>
            <TouchableOpacity style={styles.newQuoteBtn} onPress={() => setShowAddQuote(true)}>
              <Text style={styles.newQuoteBtnText}>📷 Analyze New Quote</Text>
            </TouchableOpacity>
            {quotes.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyIcon}>📄</Text>
                <Text style={styles.emptyTitle}>No quotes saved yet</Text>
                <Text style={styles.emptySubtitle}>Upload a mechanic quote and AutoDoc will tell you what's necessary vs an upsell</Text>
              </View>
            ) : (
              quotes.map(quote => (
                <TouchableOpacity
                  key={quote.id}
                  style={styles.quoteCard}
                  onPress={() => setExpandedQuote(expandedQuote === quote.id ? null : quote.id)}
                >
                  <View style={styles.quoteCardHeader}>
                    <Text style={styles.quoteDate}>📅 {quote.date}</Text>
                    <View style={styles.quoteCardActions}>
                      <Text style={styles.expandHint}>{expandedQuote === quote.id ? "▲ Collapse" : "▼ View"}</Text>
                      <TouchableOpacity onPress={() => deleteQuote(quote.id)} style={{ marginLeft: 12 }}>
                        <Text style={styles.deleteBtn}>✕</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                  <Image source={{ uri: quote.imageUri }} style={styles.quoteThumbnail} />
                  {expandedQuote === quote.id ? (
                    <Text style={styles.quoteAnalysisFull}>{quote.analysis}</Text>
                  ) : (
                    <Text style={styles.quoteAnalysisPreview} numberOfLines={3}>{quote.analysis}</Text>
                  )}
                </TouchableOpacity>
              ))
            )}
          </View>
        )}

        {activeTab === "history" && (
          <View>
            {/* Total Spent Card */}
            <View style={styles.summaryCard}>
              <Text style={styles.summaryLabel}>💰 Total Spent on Repairs</Text>
              <Text style={styles.summaryAmount}>${totalSpent.toFixed(2)}</Text>
            </View>

            {/* Current Mileage */}
            <TouchableOpacity style={styles.mileageCard} onPress={() => setShowMileageInput(!showMileageInput)}>
              <Text style={styles.mileageLabel}>🚗 Current Mileage</Text>
              <Text style={styles.mileageValue}>{currentMileage ? `${parseFloat(currentMileage).toLocaleString()} mi` : "Tap to set"}</Text>
            </TouchableOpacity>
            {showMileageInput && (
              <View style={styles.mileageInputRow}>
                <TextInput
                  style={styles.mileageInput}
                  placeholder="Enter current mileage"
                  placeholderTextColor="#888"
                  value={currentMileage}
                  onChangeText={setCurrentMileage}
                  keyboardType="numeric"
                />
                <TouchableOpacity style={styles.mileageSaveBtn} onPress={saveMileage}>
                  <Text style={styles.mileageSaveBtnText}>Save</Text>
                </TouchableOpacity>
              </View>
            )}

            {repairs.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyIcon}>🔧</Text>
                <Text style={styles.emptyTitle}>No repairs logged yet</Text>
                <Text style={styles.emptySubtitle}>Track repairs so AutoDoc can give smarter diagnoses over time</Text>
                <TouchableOpacity style={styles.emptyBtn} onPress={() => setShowAddRepair(true)}>
                  <Text style={styles.emptyBtnText}>Log First Repair</Text>
                </TouchableOpacity>
              </View>
            ) : (
              repairs.map(repair => {
                const status = getMaintenanceStatus(repair);
                return (
                  <TouchableOpacity
                    key={repair.id}
                    style={styles.repairCard}
                    onPress={() => setExpandedRepair(expandedRepair === repair.id ? null : repair.id)}
                  >
                    <View style={styles.repairHeader}>
                      <Text style={styles.repairName}>{repair.name}</Text>
                      <View style={styles.quoteCardActions}>
                        <Text style={styles.expandHint}>{expandedRepair === repair.id ? "▲" : "▼"}</Text>
                        <TouchableOpacity onPress={() => deleteRepair(repair.id)} style={{ marginLeft: 12 }}>
                          <Text style={styles.deleteBtn}>✕</Text>
                        </TouchableOpacity>
                      </View>
                    </View>

                    {status && (
                      <View style={[styles.serviceStatus, status.milesRemaining < 0 ? styles.serviceOverdue : status.milesRemaining < 500 ? styles.serviceWarning : styles.serviceGood]}>
                        <Text style={styles.serviceStatusText}>
                          {status.milesRemaining < 0
                            ? `⚠️ Overdue by ${Math.abs(Math.round(status.milesRemaining)).toLocaleString()} miles`
                            : status.milesRemaining < 500
                            ? `⚡ Due soon — ${Math.round(status.milesRemaining).toLocaleString()} miles left`
                            : `✅ Next service in ${Math.round(status.milesRemaining).toLocaleString()} miles`}
                        </Text>
                      </View>
                    )}

                    {expandedRepair === repair.id && (
                      <View>
                        <View style={styles.repairDetails}>
                          {repair.date ? <Text style={styles.repairDetail}>📅 {repair.date}</Text> : null}
                          {repair.cost ? <Text style={styles.repairDetail}>💰 ${repair.cost}</Text> : null}
                          {repair.mileage ? <Text style={styles.repairDetail}>🚗 {repair.mileage} mi</Text> : null}
                          {repair.nextServiceMiles ? <Text style={styles.repairDetail}>🔁 Every {repair.nextServiceMiles} mi</Text> : null}
                        </View>
                        {repair.notes ? <Text style={styles.repairNotes}>{repair.notes}</Text> : null}
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })
            )}
          </View>
        )}
      </ScrollView>

      {/* Add Quote Modal */}
      <Modal visible={showAddQuote} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Analyze Quote</Text>
              <TouchableOpacity onPress={() => { setShowAddQuote(false); setSelectedImage(null); setAnalysis(null); }}>
                <Text style={styles.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>
            <ScrollView keyboardShouldPersistTaps="handled">
              {!selectedImage ? (
                <View style={styles.uploadArea}>
                  <Text style={styles.uploadText}>Upload your mechanic quote</Text>
                  <View style={styles.uploadButtons}>
                    <TouchableOpacity style={styles.uploadBtn} onPress={takePhoto}>
                      <Text style={styles.uploadBtnText}>📷 Camera</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.uploadBtn} onPress={pickImage}>
                      <Text style={styles.uploadBtnText}>🖼 Gallery</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ) : (
                <View>
                  <Image source={{ uri: selectedImage.uri }} style={styles.previewImage} />
                  <TouchableOpacity style={styles.changeBtn} onPress={() => { setSelectedImage(null); setAnalysis(null); }}>
                    <Text style={styles.changeBtnText}>Change Photo</Text>
                  </TouchableOpacity>
                </View>
              )}
              {selectedImage && !analysis && (
                <TouchableOpacity style={styles.analyzeBtn} onPress={analyzeQuote} disabled={analyzing}>
                  {analyzing ? <ActivityIndicator color="#0d0d0e" /> : <Text style={styles.analyzeBtnText}>🔍 Analyze Quote</Text>}
                </TouchableOpacity>
              )}
              {analysis && (
                <View style={styles.analysisBox}>
                  <Text style={styles.analysisTitle}>📋 Analysis</Text>
                  <Text style={styles.analysisText}>{analysis}</Text>
                  <TouchableOpacity style={styles.doneBtn} onPress={() => { setShowAddQuote(false); setSelectedImage(null); setAnalysis(null); }}>
                    <Text style={styles.doneBtnText}>Done — Saved to History</Text>
                  </TouchableOpacity>
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Add Repair Modal */}
      <Modal visible={showAddRepair} animationType="slide" transparent>
        <KeyboardAvoidingView style={styles.modalOverlay} behavior={Platform.OS === "ios" ? "padding" : "height"}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Log a Repair</Text>
              <TouchableOpacity onPress={() => setShowAddRepair(false)}>
                <Text style={styles.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>
            <ScrollView keyboardShouldPersistTaps="handled">
              <TextInput style={styles.input} placeholder="Repair name (e.g. Oil Change)" placeholderTextColor="#888" value={repairName} onChangeText={setRepairName} />
              <TextInput style={styles.input} placeholder="Date (e.g. 06/05/2026)" placeholderTextColor="#888" value={repairDate} onChangeText={setRepairDate} />
              <TextInput style={styles.input} placeholder="Cost (e.g. 250)" placeholderTextColor="#888" value={repairCost} onChangeText={setRepairCost} keyboardType="numeric" />
              <TextInput style={styles.input} placeholder="Mileage at repair (e.g. 85000)" placeholderTextColor="#888" value={repairMileage} onChangeText={setRepairMileage} keyboardType="numeric" />
              <TextInput style={styles.input} placeholder="Next service interval in miles (e.g. 5000 for oil)" placeholderTextColor="#888" value={nextServiceMiles} onChangeText={setNextServiceMiles} keyboardType="numeric" />
              <TextInput style={[styles.input, styles.notesInput]} placeholder="Notes (optional)" placeholderTextColor="#888" value={repairNotes} onChangeText={setRepairNotes} multiline />
              <TouchableOpacity style={styles.saveBtn} onPress={addRepair}>
                <Text style={styles.saveBtnText}>Save Repair</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0d0d0e" },
  header: { backgroundColor: "#161618", paddingTop: 60, paddingBottom: 20, paddingHorizontal: 20, flexDirection: "row", justifyContent: "space-between", alignItems: "center", borderBottomWidth: 1, borderBottomColor: "#2e2e33" },
  backBtn: { width: 60 },
  backText: { color: "#f5a623", fontSize: 14 },
  headerText: { color: "#f5a623", fontSize: 20, fontWeight: "bold" },
  addBtn: { backgroundColor: "#f5a623", borderRadius: 8, padding: 8, paddingHorizontal: 12 },
  addBtnText: { color: "#0d0d0e", fontWeight: "bold", fontSize: 13 },
  tabs: { flexDirection: "row", backgroundColor: "#161618", borderBottomWidth: 1, borderBottomColor: "#2e2e33" },
  tab: { flex: 1, padding: 14, alignItems: "center" },
  tabActive: { borderBottomWidth: 2, borderBottomColor: "#f5a623" },
  tabText: { color: "#888", fontSize: 14 },
  tabTextActive: { color: "#f5a623", fontWeight: "600" },
  content: { flex: 1, padding: 16 },
  summaryCard: { backgroundColor: "#161618", borderRadius: 12, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: "#f5a62344", alignItems: "center" },
  summaryLabel: { color: "#888", fontSize: 13, marginBottom: 4 },
  summaryAmount: { color: "#f5a623", fontSize: 32, fontWeight: "bold" },
  mileageCard: { backgroundColor: "#161618", borderRadius: 12, padding: 14, marginBottom: 8, borderWidth: 1, borderColor: "#2e2e33", flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  mileageLabel: { color: "#888", fontSize: 13 },
  mileageValue: { color: "#e8e6e0", fontSize: 14, fontWeight: "500" },
  mileageInputRow: { flexDirection: "row", gap: 8, marginBottom: 12 },
  mileageInput: { flex: 1, backgroundColor: "#1e1e21", color: "#e8e6e0", borderRadius: 8, padding: 10, fontSize: 14, borderWidth: 1, borderColor: "#2e2e33" },
  mileageSaveBtn: { backgroundColor: "#f5a623", borderRadius: 8, padding: 10, paddingHorizontal: 16, justifyContent: "center" },
  mileageSaveBtnText: { color: "#0d0d0e", fontWeight: "bold", fontSize: 14 },
  newQuoteBtn: { backgroundColor: "#f5a623", borderRadius: 10, padding: 14, alignItems: "center", marginBottom: 16 },
  newQuoteBtnText: { color: "#0d0d0e", fontWeight: "bold", fontSize: 15 },
  emptyState: { alignItems: "center", paddingTop: 60 },
  emptyIcon: { fontSize: 48, marginBottom: 16 },
  emptyTitle: { color: "#e8e6e0", fontSize: 18, fontWeight: "bold", marginBottom: 8 },
  emptySubtitle: { color: "#888", fontSize: 14, textAlign: "center", lineHeight: 20, marginBottom: 24, paddingHorizontal: 20 },
  emptyBtn: { backgroundColor: "#f5a623", borderRadius: 8, padding: 14, paddingHorizontal: 24 },
  emptyBtnText: { color: "#0d0d0e", fontWeight: "bold", fontSize: 15 },
  quoteCard: { backgroundColor: "#161618", borderRadius: 12, padding: 14, marginBottom: 12, borderWidth: 1, borderColor: "#2e2e33" },
  quoteCardHeader: { flexDirection: "row", justifyContent: "space-between", marginBottom: 8 },
  quoteDate: { color: "#888", fontSize: 13 },
  quoteThumbnail: { width: "100%", height: 120, borderRadius: 8, marginBottom: 8 },
  quoteAnalysisPreview: { color: "#888", fontSize: 13, lineHeight: 18 },
  quoteAnalysisFull: { color: "#e8e6e0", fontSize: 13, lineHeight: 20, marginTop: 8 },
  quoteCardActions: { flexDirection: "row", alignItems: "center" },
  expandHint: { color: "#f5a623", fontSize: 12 },
  repairCard: { backgroundColor: "#161618", borderRadius: 12, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: "#2e2e33" },
  repairHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
  repairName: { color: "#e8e6e0", fontSize: 15, fontWeight: "600", flex: 1 },
  deleteBtn: { color: "#888", fontSize: 16, padding: 4 },
  serviceStatus: { borderRadius: 8, padding: 8, marginBottom: 8 },
  serviceOverdue: { backgroundColor: "#e05a5a22", borderWidth: 1, borderColor: "#e05a5a44" },
  serviceWarning: { backgroundColor: "#f5a62322", borderWidth: 1, borderColor: "#f5a62344" },
  serviceGood: { backgroundColor: "#4caf7d22", borderWidth: 1, borderColor: "#4caf7d44" },
  serviceStatusText: { fontSize: 13, color: "#e8e6e0" },
  repairDetails: { flexDirection: "row", flexWrap: "wrap", gap: 12, marginBottom: 6 },
  repairDetail: { color: "#888", fontSize: 13 },
  repairNotes: { color: "#888", fontSize: 13, fontStyle: "italic", marginTop: 4 },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.7)", justifyContent: "flex-end" },
  modalContent: { backgroundColor: "#161618", borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 24, maxHeight: "90%" },
  modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 20 },
  modalTitle: { color: "#e8e6e0", fontSize: 18, fontWeight: "bold" },
  modalClose: { color: "#888", fontSize: 20 },
  uploadArea: { backgroundColor: "#1e1e21", borderRadius: 12, padding: 24, alignItems: "center", marginBottom: 16, borderWidth: 1, borderColor: "#2e2e33" },
  uploadText: { color: "#888", fontSize: 15, marginBottom: 16 },
  uploadButtons: { flexDirection: "row", gap: 12 },
  uploadBtn: { backgroundColor: "#161618", borderRadius: 8, padding: 12, paddingHorizontal: 20, borderWidth: 1, borderColor: "#2e2e33" },
  uploadBtnText: { color: "#e8e6e0", fontSize: 14 },
  previewImage: { width: "100%", height: 200, borderRadius: 10, marginBottom: 12 },
  changeBtn: { backgroundColor: "#1e1e21", borderRadius: 8, padding: 10, alignItems: "center", marginBottom: 12, borderWidth: 1, borderColor: "#2e2e33" },
  changeBtnText: { color: "#888", fontSize: 13 },
  analyzeBtn: { backgroundColor: "#f5a623", borderRadius: 10, padding: 14, alignItems: "center", marginBottom: 16 },
  analyzeBtnText: { color: "#0d0d0e", fontWeight: "bold", fontSize: 15 },
  analysisBox: { backgroundColor: "#1e1e21", borderRadius: 10, padding: 14, marginBottom: 16, borderWidth: 1, borderColor: "#2e2e33" },
  analysisTitle: { color: "#f5a623", fontWeight: "bold", fontSize: 15, marginBottom: 8 },
  analysisText: { color: "#e8e6e0", fontSize: 13, lineHeight: 20 },
  doneBtn: { backgroundColor: "#f5a623", borderRadius: 8, padding: 12, alignItems: "center", marginTop: 12 },
  doneBtnText: { color: "#0d0d0e", fontWeight: "bold", fontSize: 14 },
  input: { backgroundColor: "#1e1e21", color: "#e8e6e0", borderRadius: 8, padding: 12, fontSize: 14, borderWidth: 1, borderColor: "#2e2e33", marginBottom: 12 },
  notesInput: { height: 80, textAlignVertical: "top" },
  saveBtn: { backgroundColor: "#f5a623", borderRadius: 8, padding: 14, alignItems: "center", marginTop: 4, marginBottom: 20 },
  saveBtnText: { color: "#0d0d0e", fontWeight: "bold", fontSize: 16 },
});