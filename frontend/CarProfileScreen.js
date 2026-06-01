import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Modal, FlatList } from "react-native";
import { useState } from "react";

const ALL_MAKES = [
  "Acura", "Alfa Romeo", "Aston Martin", "Audi", "Bentley", "BMW", "Bugatti",
  "Buick", "Cadillac", "Chevrolet", "Chrysler", "Dodge", "Ferrari", "Fiat",
  "Ford", "Genesis", "GMC", "Honda", "Hummer", "Hyundai", "Infiniti", "Jaguar",
  "Jeep", "Kia", "Lamborghini", "Land Rover", "Lexus", "Lincoln", "Lotus",
  "Maserati", "Maybach", "Mazda", "McLaren", "Mercedes-Benz", "MINI", "Mitsubishi",
  "Nissan", "Pagani", "Pontiac", "Porsche", "Ram", "Rolls-Royce", "Saab",
  "Saturn", "Scion", "Smart", "Subaru", "Suzuki", "Tesla", "Toyota",
  "Volkswagen", "Volvo", "Other"
];

export default function CarProfileScreen({ onSave }) {
  const [year, setYear] = useState("");
  const [make, setMake] = useState("");
  const [model, setModel] = useState("");
  const [mileage, setMileage] = useState("");
  const [error, setError] = useState("");
  const [showMakePicker, setShowMakePicker] = useState(false);
  const [makeSearch, setMakeSearch] = useState("");

  const filteredMakes = ALL_MAKES.filter(m =>
    m.toLowerCase().includes(makeSearch.toLowerCase())
  );

  const handleSave = () => {
    if (!year || !make || !model) {
      setError("Please fill in year, make, and model");
      return;
    }
    if (year.length !== 4 || isNaN(year)) {
      setError("Please enter a valid 4-digit year");
      return;
    }
    onSave({ year, make, model, mileage });
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerText}>AutoDoc</Text>
        <Text style={styles.subHeader}>Set Up Your Car</Text>
      </View>

      <View style={styles.form}>
        <Text style={styles.title}>Tell us about your car</Text>
        <Text style={styles.subtitle}>This helps AutoDoc give you more accurate diagnoses</Text>

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <Text style={styles.label}>Year</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. 2019"
          placeholderTextColor="#888"
          value={year}
          onChangeText={setYear}
          keyboardType="numeric"
          maxLength={4}
        />

        <Text style={styles.label}>Make</Text>
        <TouchableOpacity style={styles.dropdown} onPress={() => setShowMakePicker(true)}>
          <Text style={make ? styles.dropdownSelected : styles.dropdownPlaceholder}>
            {make || "Select your car make..."}
          </Text>
          <Text style={styles.dropdownArrow}>▼</Text>
        </TouchableOpacity>

        <Text style={styles.label}>Model</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. XC90, Huracan, Civic"
          placeholderTextColor="#888"
          value={model}
          onChangeText={setModel}
        />

        <Text style={styles.label}>Mileage (optional)</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. 45000"
          placeholderTextColor="#888"
          value={mileage}
          onChangeText={setMileage}
          keyboardType="numeric"
        />

        <TouchableOpacity style={styles.btn} onPress={handleSave}>
          <Text style={styles.btnText}>Save My Car</Text>
        </TouchableOpacity>
      </View>

      <Modal visible={showMakePicker} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Make</Text>
              <TouchableOpacity onPress={() => { setShowMakePicker(false); setMakeSearch(""); }}>
                <Text style={styles.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>
            <TextInput
              style={styles.searchInput}
              placeholder="Search makes..."
              placeholderTextColor="#888"
              value={makeSearch}
              onChangeText={setMakeSearch}
              autoFocus
            />
            <FlatList
              data={filteredMakes}
              keyExtractor={item => item}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[styles.makeItem, make === item && styles.makeItemSelected]}
                  onPress={() => { setMake(item); setShowMakePicker(false); setMakeSearch(""); }}
                >
                  <Text style={[styles.makeItemText, make === item && styles.makeItemTextSelected]}>
                    {item}
                  </Text>
                  {make === item && <Text style={styles.checkmark}>✓</Text>}
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0d0d0e" },
  header: { backgroundColor: "#161618", paddingTop: 60, paddingBottom: 20, alignItems: "center", borderBottomWidth: 1, borderBottomColor: "#2e2e33" },
  headerText: { color: "#f5a623", fontSize: 28, fontWeight: "bold" },
  subHeader: { color: "#888", fontSize: 14, marginTop: 4 },
  form: { padding: 24 },
  title: { color: "#e8e6e0", fontSize: 22, fontWeight: "bold", marginBottom: 8 },
  subtitle: { color: "#888", fontSize: 14, marginBottom: 24, lineHeight: 20 },
  error: { color: "#e05a5a", fontSize: 13, marginBottom: 12 },
  label: { color: "#888", fontSize: 12, fontWeight: "500", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 8, marginTop: 16 },
  input: { backgroundColor: "#1e1e21", color: "#e8e6e0", borderRadius: 8, padding: 12, fontSize: 14, borderWidth: 1, borderColor: "#2e2e33" },
  dropdown: { backgroundColor: "#1e1e21", borderRadius: 8, padding: 12, fontSize: 14, borderWidth: 1, borderColor: "#2e2e33", flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  dropdownPlaceholder: { color: "#888", fontSize: 14 },
  dropdownSelected: { color: "#e8e6e0", fontSize: 14 },
  dropdownArrow: { color: "#888", fontSize: 12 },
  btn: { backgroundColor: "#f5a623", borderRadius: 8, padding: 14, alignItems: "center", marginTop: 32, marginBottom: 40 },
  btnText: { color: "#0d0d0e", fontWeight: "bold", fontSize: 16 },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.7)", justifyContent: "flex-end" },
  modalContent: { backgroundColor: "#161618", borderTopLeftRadius: 20, borderTopRightRadius: 20, maxHeight: "80%", paddingBottom: 20 },
  modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 20, borderBottomWidth: 1, borderBottomColor: "#2e2e33" },
  modalTitle: { color: "#e8e6e0", fontSize: 18, fontWeight: "bold" },
  modalClose: { color: "#888", fontSize: 20, padding: 4 },
  searchInput: { backgroundColor: "#1e1e21", color: "#e8e6e0", borderRadius: 8, padding: 12, fontSize: 14, borderWidth: 1, borderColor: "#2e2e33", margin: 16 },
  makeItem: { padding: 16, borderBottomWidth: 1, borderBottomColor: "#2e2e33", flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  makeItemSelected: { backgroundColor: "#f5a62322" },
  makeItemText: { color: "#e8e6e0", fontSize: 15 },
  makeItemTextSelected: { color: "#f5a623", fontWeight: "bold" },
  checkmark: { color: "#f5a623", fontSize: 16 },
});