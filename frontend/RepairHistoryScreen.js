import { View, Text, TouchableOpacity, StyleSheet, ScrollView, TextInput, Modal, KeyboardAvoidingView, Platform } from "react-native";
import { useState, useEffect } from "react";
import * as SecureStore from "expo-secure-store";

export default function RepairHistoryScreen({ car, onBack }) {
  const [repairs, setRepairs] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [repairName, setRepairName] = useState("");
  const [repairDate, setRepairDate] = useState("");
  const [repairCost, setRepairCost] = useState("");
  const [repairMileage, setRepairMileage] = useState("");
  const [repairNotes, setRepairNotes] = useState("");

  useEffect(() => {
    loadRepairs();
  }, []);

  const loadRepairs = async () => {
    try {
      const saved = await SecureStore.getItemAsync("repairHistory");
      if (saved) setRepairs(JSON.parse(saved));
    } catch (e) {
      console.log("Error loading repairs:", e);
    }
  };

  const saveRepairs = async (newRepairs) => {
    try {
      await SecureStore.setItemAsync("repairHistory", JSON.stringify(newRepairs));
    } catch (e) {
      console.log("Error saving repairs:", e);
    }
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
    };
    const updated = [newRepair, ...repairs];
    setRepairs(updated);
    await saveRepairs(updated);
    setShowAddModal(false);
    setRepairName(""); setRepairDate(""); setRepairCost(""); setRepairMileage(""); setRepairNotes("");
  };

  const deleteRepair = async (id) => {
    const updated = repairs.filter(r => r.id !== id);
    setRepairs(updated);
    await saveRepairs(updated);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerText}>Repair History</Text>
        <TouchableOpacity style={styles.addBtn} onPress={() => setShowAddModal(true)}>
          <Text style={styles.addBtnText}>+ Add</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        <Text style={styles.carLabel}>{car?.year} {car?.make} {car?.model}</Text>

        {repairs.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>🔧</Text>
            <Text style={styles.emptyTitle}>No repairs logged yet</Text>
            <Text style={styles.emptySubtitle}>Track your repairs so AutoDoc can give smarter diagnoses over time</Text>
            <TouchableOpacity style={styles.emptyBtn} onPress={() => setShowAddModal(true)}>
              <Text style={styles.emptyBtnText}>Log Your First Repair</Text>
            </TouchableOpacity>
          </View>
        ) : (
          repairs.map(repair => (
            <View key={repair.id} style={styles.repairCard}>
              <View style={styles.repairHeader}>
                <Text style={styles.repairName}>{repair.name}</Text>
                <TouchableOpacity onPress={() => deleteRepair(repair.id)}>
                  <Text style={styles.deleteBtn}>✕</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.repairDetails}>
                {repair.date ? <Text style={styles.repairDetail}>📅 {repair.date}</Text> : null}
                {repair.cost ? <Text style={styles.repairDetail}>💰 ${repair.cost}</Text> : null}
                {repair.mileage ? <Text style={styles.repairDetail}>🚗 {repair.mileage} miles</Text> : null}
              </View>
              {repair.notes ? <Text style={styles.repairNotes}>{repair.notes}</Text> : null}
            </View>
          ))
        )}
      </ScrollView>

      <Modal visible={showAddModal} animationType="slide" transparent>
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Log a Repair</Text>
              <TouchableOpacity onPress={() => setShowAddModal(false)}>
                <Text style={styles.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>
            <ScrollView keyboardShouldPersistTaps="handled">
              <TextInput
                style={styles.input}
                placeholder="Repair name (e.g. Brake pad replacement)"
                placeholderTextColor="#888"
                value={repairName}
                onChangeText={setRepairName}
              />
              <TextInput
                style={styles.input}
                placeholder="Date (e.g. 06/05/2026)"
                placeholderTextColor="#888"
                value={repairDate}
                onChangeText={setRepairDate}
              />
              <TextInput
                style={styles.input}
                placeholder="Cost (e.g. 250)"
                placeholderTextColor="#888"
                value={repairCost}
                onChangeText={setRepairCost}
                keyboardType="numeric"
              />
              <TextInput
                style={styles.input}
                placeholder="Mileage at repair (e.g. 85000)"
                placeholderTextColor="#888"
                value={repairMileage}
                onChangeText={setRepairMileage}
                keyboardType="numeric"
              />
              <TextInput
                style={[styles.input, styles.notesInput]}
                placeholder="Notes (optional)"
                placeholderTextColor="#888"
                value={repairNotes}
                onChangeText={setRepairNotes}
                multiline
              />
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
  content: { flex: 1, padding: 20 },
  carLabel: { color: "#888", fontSize: 13, marginBottom: 16 },
  emptyState: { alignItems: "center", paddingTop: 60 },
  emptyIcon: { fontSize: 48, marginBottom: 16 },
  emptyTitle: { color: "#e8e6e0", fontSize: 18, fontWeight: "bold", marginBottom: 8 },
  emptySubtitle: { color: "#888", fontSize: 14, textAlign: "center", lineHeight: 20, marginBottom: 24, paddingHorizontal: 20 },
  emptyBtn: { backgroundColor: "#f5a623", borderRadius: 8, padding: 14, paddingHorizontal: 24 },
  emptyBtnText: { color: "#0d0d0e", fontWeight: "bold", fontSize: 15 },
  repairCard: { backgroundColor: "#161618", borderRadius: 12, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: "#2e2e33" },
  repairHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
  repairName: { color: "#e8e6e0", fontSize: 15, fontWeight: "600", flex: 1 },
  deleteBtn: { color: "#888", fontSize: 16, padding: 4 },
  repairDetails: { flexDirection: "row", flexWrap: "wrap", gap: 12, marginBottom: 6 },
  repairDetail: { color: "#888", fontSize: 13 },
  repairNotes: { color: "#888", fontSize: 13, fontStyle: "italic", marginTop: 4 },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.7)", justifyContent: "flex-end" },
  modalContent: { backgroundColor: "#161618", borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 24, maxHeight: "90%" },
  modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 20 },
  modalTitle: { color: "#e8e6e0", fontSize: 18, fontWeight: "bold" },
  modalClose: { color: "#888", fontSize: 20 },
  input: { backgroundColor: "#1e1e21", color: "#e8e6e0", borderRadius: 8, padding: 12, fontSize: 14, borderWidth: 1, borderColor: "#2e2e33", marginBottom: 12 },
  notesInput: { height: 80, textAlignVertical: "top" },
  saveBtn: { backgroundColor: "#f5a623", borderRadius: 8, padding: 14, alignItems: "center", marginTop: 4, marginBottom: 20 },
  saveBtnText: { color: "#0d0d0e", fontWeight: "bold", fontSize: 16 },
});