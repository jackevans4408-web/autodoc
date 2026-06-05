import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Modal, KeyboardAvoidingView, Platform } from "react-native";
import { useState } from "react";
import CarProfileScreen from "./CarProfileScreen";

export default function SettingsScreen({ car, session, onBack, onSignOut, onCarUpdate }) {
  const [showChangeCar, setShowChangeCar] = useState(false);

  if (showChangeCar) {
    return <CarProfileScreen onSave={(newCar) => {
      onCarUpdate(newCar);
      setShowChangeCar(false);
    }} />;
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerText}>Settings</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView style={styles.content}>

        {/* Account Section */}
        <Text style={styles.sectionLabel}>Account</Text>
        <View style={styles.section}>
          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>📧 Email</Text>
            <Text style={styles.settingValue}>{session?.email || "—"}</Text>
          </View>
        </View>

        {/* Vehicle Section */}
        <Text style={styles.sectionLabel}>My Vehicle</Text>
        <View style={styles.section}>
          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>🚗 Current Car</Text>
            <Text style={styles.settingValue}>{car?.year} {car?.make} {car?.model}</Text>
          </View>
          <View style={styles.divider} />
          <TouchableOpacity style={styles.settingRow} onPress={() => setShowChangeCar(true)}>
            <Text style={styles.settingLabel}>🔄 Change Vehicle</Text>
            <Text style={styles.settingArrow}>→</Text>
          </TouchableOpacity>
        </View>

        {/* App Section */}
        <Text style={styles.sectionLabel}>App</Text>
        <View style={styles.section}>
          <TouchableOpacity style={styles.settingRow} onPress={() => alert("Coming soon!")}>
            <Text style={styles.settingLabel}>🔔 Notifications</Text>
            <Text style={styles.settingArrow}>→</Text>
          </TouchableOpacity>
          <View style={styles.divider} />
          <TouchableOpacity style={styles.settingRow} onPress={() => alert("Coming soon!")}>
            <Text style={styles.settingLabel}>💰 Subscription</Text>
            <Text style={styles.settingBadge}>Free</Text>
          </TouchableOpacity>
          <View style={styles.divider} />
          <TouchableOpacity style={styles.settingRow} onPress={() => alert("Coming soon!")}>
            <Text style={styles.settingLabel}>⭐ Rate AutoDoc</Text>
            <Text style={styles.settingArrow}>→</Text>
          </TouchableOpacity>
        </View>

        {/* Support Section */}
        <Text style={styles.sectionLabel}>Support</Text>
        <View style={styles.section}>
          <TouchableOpacity style={styles.settingRow} onPress={() => alert("Coming soon!")}>
            <Text style={styles.settingLabel}>❓ Help & FAQ</Text>
            <Text style={styles.settingArrow}>→</Text>
          </TouchableOpacity>
          <View style={styles.divider} />
          <TouchableOpacity style={styles.settingRow} onPress={() => alert("Coming soon!")}>
            <Text style={styles.settingLabel}>📋 Privacy Policy</Text>
            <Text style={styles.settingArrow}>→</Text>
          </TouchableOpacity>
          <View style={styles.divider} />
          <TouchableOpacity style={styles.settingRow} onPress={() => alert("Coming soon!")}>
            <Text style={styles.settingLabel}>📜 Terms of Service</Text>
            <Text style={styles.settingArrow}>→</Text>
          </TouchableOpacity>
        </View>

        {/* App Info */}
        <Text style={styles.sectionLabel}>About</Text>
        <View style={styles.section}>
          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>📱 Version</Text>
            <Text style={styles.settingValue}>1.0.0</Text>
          </View>
        </View>

        {/* Sign Out */}
        <TouchableOpacity style={styles.signOutBtn} onPress={onSignOut}>
          <Text style={styles.signOutText}>Sign Out</Text>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
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
  sectionLabel: { color: "#888", fontSize: 11, fontWeight: "600", textTransform: "uppercase", letterSpacing: 0.8, marginTop: 24, marginBottom: 8, marginLeft: 4 },
  section: { backgroundColor: "#161618", borderRadius: 12, borderWidth: 1, borderColor: "#2e2e33", overflow: "hidden" },
  settingRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 16 },
  settingLabel: { color: "#e8e6e0", fontSize: 15 },
  settingValue: { color: "#888", fontSize: 14 },
  settingArrow: { color: "#888", fontSize: 16 },
  settingBadge: { backgroundColor: "#4caf7d22", color: "#4caf7d", fontSize: 12, fontWeight: "600", paddingHorizontal: 10, paddingVertical: 3, borderRadius: 20, borderWidth: 1, borderColor: "#4caf7d44" },
  divider: { height: 1, backgroundColor: "#2e2e33", marginLeft: 16 },
  signOutBtn: { backgroundColor: "#161618", borderRadius: 12, borderWidth: 1, borderColor: "#e05a5a44", padding: 16, alignItems: "center", marginTop: 24 },
  signOutText: { color: "#e05a5a", fontSize: 15, fontWeight: "600" },
});