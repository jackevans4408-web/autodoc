import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Modal, FlatList, ActivityIndicator } from "react-native";
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

const ENGINE_SIZES = [
  "3-Cylinder", "4-Cylinder", "5-Cylinder", "V6", "V8", "V10", "V12",
  "Electric", "Hybrid", "Diesel", "Other"
];

export default function CarProfileScreen({ onSave }) {
  const [vin, setVin] = useState("");
  const [vinLoading, setVinLoading] = useState(false);
  const [vinError, setVinError] = useState("");
  const [year, setYear] = useState("");
  const [make, setMake] = useState("");
  const [model, setModel] = useState("");
  const [engine, setEngine] = useState("");
  const [mileage, setMileage] = useState("");
  const [error, setError] = useState("");
  const [showMakePicker, setShowMakePicker] = useState(false);
  const [showEnginePicker, setShowEnginePicker] = useState(false);
  const [makeSearch, setMakeSearch] = useState("");

  const filteredMakes = ALL_MAKES.filter(m =>
    m.toLowerCase().includes(makeSearch.toLowerCase())
  );

  const decodeVin = async () => {
    if (vin.length !== 17) {
      setVinError("VIN must be exactly 17 characters");
      return;
    }
    setVinLoading(true);
    setVinError("");
    try {
      const response = await fetch(
        `https://vpic.nhtsa.dot.gov/api/vehicles/decodevin/${vin}?format=json`
      );
      const data = await response.json();
      const results = data.Results;

      const getValue = (variable) => {
        const item = results.find(r => r.Variable === variable);
        return item?.Value && item.Value !== "Not Applicable" && item.Value !== "null" ? item.Value : "";
      };

      const decodedYear = getValue("Model Year");
      const decodedMake = getValue("Make");
      const decodedModel = getValue("Model");
      const decodedDisplacement = getValue("Displacement (L)");
      const decodedCylinders = getValue("Number of Cylinders");

      if (!decodedYear && !decodedMake) {
        setVinError("Could not decode this VIN. Please enter details manually.");
        setVinLoading(false);
        return;
      }

      if (decodedYear) setYear(decodedYear);
      if (decodedMake) {
        const matchedMake = ALL_MAKES.find(m => m.toLowerCase() === decodedMake.toLowerCase());
        setMake(matchedMake || decodedMake);
      }
      if (decodedModel) setModel(decodedModel);

      // Set engine size from cylinders
      if (decodedCylinders) {
        const cyl = parseInt(decodedCylinders);
        if (cyl === 3) setEngine("3-Cylinder");
        else if (cyl === 4) setEngine("4-Cylinder");
        else if (cyl === 5) setEngine("5-Cylinder");
        else if (cyl === 6) setEngine("V6");
        else if (cyl === 8) setEngine("V8");
        else if (cyl === 10) setEngine("V10");
        else if (cyl === 12) setEngine("V12");
      }

    } catch (e) {
      setVinError("Error decoding VIN. Please enter details manually.");
    }
    setVinLoading(false);
  };

  const handleSave = () => {
    if (!year || !make || !model) {
      setError("Please fill in year, make, and model");
      return;
    }
    if (year.length !== 4 || isNaN(year)) {
      setError("Please enter a valid 4-digit year");
      return;
    }
    onSave({ year, make, model, engine, mileage, vin });
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

        {/* VIN Decoder */}
        <Text style={styles.label}>VIN (optional — auto-fills details)</Text>
        <View style={styles.vinRow}>
          <TextInput
            style={styles.vinInput}
            placeholder="Enter 17-digit VIN"
            placeholderTextColor="#888"
            value={vin}
            onChangeText={(text) => { setVin(text.toUpperCase()); setVinError(""); }}
            maxLength={17}
            autoCapitalize="characters"
          />
          <TouchableOpacity
            style={[styles.vinBtn, (vin.length !== 17 || vinLoading) && styles.vinBtnDisabled]}
            onPress={decodeVin}
            disabled={vin.length !== 17 || vinLoading}
          >
            {vinLoading ? (
              <ActivityIndicator size="small" color="#0d0d0e" />
            ) : (
              <Text style={styles.vinBtnText}>Decode</Text>
            )}
          </TouchableOpacity>
        </View>
        {vinError ? <Text style={styles.vinError}>{vinError}</Text> : null}
        {vin.length === 17 && year && make ? (
          <Text style={styles.vinSuccess}>✅ VIN decoded successfully!</Text>
        ) : null}

        <View style={styles.dividerRow}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>or enter manually</Text>
          <View style={styles.dividerLine} />
        </View>

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

        <Text style={styles.label}>Engine Size</Text>
        <TouchableOpacity style={styles.dropdown} onPress={() => setShowEnginePicker(true)}>
          <Text style={engine ? styles.dropdownSelected : styles.dropdownPlaceholder}>
            {engine || "Select engine size..."}
          </Text>
          <Text style={styles.dropdownArrow}>▼</Text>
        </TouchableOpacity>

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

      {/* Make Picker Modal */}
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

      {/* Engine Picker Modal */}
      <Modal visible={showEnginePicker} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Engine Size</Text>
              <TouchableOpacity onPress={() => setShowEnginePicker(false)}>
                <Text style={styles.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>
            <FlatList
              data={ENGINE_SIZES}
              keyExtractor={item => item}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[styles.makeItem, engine === item && styles.makeItemSelected]}
                  onPress={() => { setEngine(item); setShowEnginePicker(false); }}
                >
                  <Text style={[styles.makeItemText, engine === item && styles.makeItemTextSelected]}>
                    {item}
                  </Text>
                  {engine === item && <Text style={styles.checkmark}>✓</Text>}
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
  vinRow: { flexDirection: "row", gap: 8 },
  vinInput: { flex: 1, backgroundColor: "#1e1e21", color: "#e8e6e0", borderRadius: 8, padding: 12, fontSize: 13, borderWidth: 1, borderColor: "#2e2e33" },
  vinBtn: { backgroundColor: "#f5a623", borderRadius: 8, padding: 12, paddingHorizontal: 16, justifyContent: "center" },
  vinBtnDisabled: { backgroundColor: "#2e2e33" },
  vinBtnText: { color: "#0d0d0e", fontWeight: "bold", fontSize: 14 },
  vinError: { color: "#e05a5a", fontSize: 12, marginTop: 6 },
  vinSuccess: { color: "#4caf7d", fontSize: 12, marginTop: 6 },
  dividerRow: { flexDirection: "row", alignItems: "center", marginVertical: 20, gap: 10 },
  dividerLine: { flex: 1, height: 1, backgroundColor: "#2e2e33" },
  dividerText: { color: "#888", fontSize: 12 },
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