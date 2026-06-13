import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from "react-native";

export default function TermsOfServiceScreen({ onBack }) {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerText}>Terms of Service</Text>
        <View style={{ width: 60 }} />
      </View>
      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        <Text style={styles.lastUpdated}>Last Updated: June 12, 2026</Text>

        <Text style={styles.section}>1. Acceptance of Terms</Text>
        <Text style={styles.body}>By downloading or using Engine Eye, you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use the app.</Text>

        <Text style={styles.section}>2. Description of Service</Text>
        <Text style={styles.body}>Engine Eye provides AI-powered vehicle diagnostic assistance, mechanic quote analysis, maintenance tracking, and related automotive tools. Our service is powered by artificial intelligence and is intended for informational purposes only.</Text>

        <Text style={styles.section}>3. Disclaimer of Warranties</Text>
        <Text style={styles.body}>Engine Eye is provided "as is" without any warranties. Our AI diagnostics are for informational purposes only and should NOT replace professional mechanical advice. Always consult a qualified mechanic before making repairs to your vehicle.</Text>

        <Text style={styles.section}>4. Limitation of Liability</Text>
        <Text style={styles.body}>Engine Eye and its developers are not liable for any damages arising from:</Text>
        <Text style={styles.bullet}>• Reliance on AI diagnostic information</Text>
        <Text style={styles.bullet}>• Vehicle repairs made based on app suggestions</Text>
        <Text style={styles.bullet}>• Inaccurate recall or vehicle data</Text>
        <Text style={styles.bullet}>• Any mechanical issues resulting from app use</Text>

        <Text style={styles.section}>5. User Responsibilities</Text>
        <Text style={styles.body}>You agree to:</Text>
        <Text style={styles.bullet}>• Provide accurate vehicle information</Text>
        <Text style={styles.bullet}>• Use the app for personal, non-commercial use only</Text>
        <Text style={styles.bullet}>• Not attempt to reverse engineer or hack the app</Text>
        <Text style={styles.bullet}>• Not use the app for any illegal purposes</Text>

        <Text style={styles.section}>6. Account Terms</Text>
        <Text style={styles.body}>You are responsible for maintaining the security of your account and password. Engine Eye cannot and will not be liable for any loss or damage from your failure to comply with this security obligation.</Text>

        <Text style={styles.section}>7. Intellectual Property</Text>
        <Text style={styles.body}>The Engine Eye app, including its design, logo, and code, is owned by Engine Eye and protected by copyright law. You may not copy, modify, or distribute any part of the app without written permission.</Text>

        <Text style={styles.section}>8. Termination</Text>
        <Text style={styles.body}>We reserve the right to terminate or suspend your account at any time for violations of these terms. You may delete your account at any time through the Settings screen.</Text>

        <Text style={styles.section}>9. Changes to Terms</Text>
        <Text style={styles.body}>We reserve the right to modify these terms at any time. Continued use of the app after changes constitutes acceptance of the new terms.</Text>

        <Text style={styles.section}>10. Governing Law</Text>
        <Text style={styles.body}>These terms are governed by the laws of the United States. Any disputes shall be resolved in the courts of the United States.</Text>

        <Text style={styles.section}>11. Contact</Text>
        <Text style={styles.body}>For questions about these Terms of Service, contact us at:</Text>
        <Text style={styles.contact}>jack.evans4408@gmail.com</Text>

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
  headerText: { color: "#f5a623", fontSize: 18, fontWeight: "bold" },
  content: { flex: 1 },
  contentContainer: { padding: 20 },
  lastUpdated: { color: "#888", fontSize: 12, marginBottom: 20 },
  section: { color: "#f5a623", fontSize: 15, fontWeight: "bold", marginTop: 24, marginBottom: 8 },
  body: { color: "#e8e6e0", fontSize: 14, lineHeight: 22, marginBottom: 8 },
  bullet: { color: "#e8e6e0", fontSize: 14, lineHeight: 22, marginLeft: 8, marginBottom: 4 },
  contact: { color: "#f5a623", fontSize: 14, marginTop: 4 },
});