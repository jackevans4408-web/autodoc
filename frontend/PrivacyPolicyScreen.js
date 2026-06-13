import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from "react-native";

export default function PrivacyPolicyScreen({ onBack }) {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerText}>Privacy Policy</Text>
        <View style={{ width: 60 }} />
      </View>
      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        <Text style={styles.lastUpdated}>Last Updated: June 12, 2026</Text>

        <Text style={styles.section}>1. Introduction</Text>
        <Text style={styles.body}>Engine Eye ("we", "our", or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, and safeguard your information when you use our mobile application.</Text>

        <Text style={styles.section}>2. Information We Collect</Text>
        <Text style={styles.body}>We collect the following types of information:</Text>
        <Text style={styles.bullet}>• Account Information: email address and password when you register</Text>
        <Text style={styles.bullet}>• Vehicle Information: year, make, model, engine size, mileage, and VIN you provide</Text>
        <Text style={styles.bullet}>• Diagnostic Data: car problems, photos, and OBD codes you submit for diagnosis</Text>
        <Text style={styles.bullet}>• Usage Data: how you interact with the app to improve our services</Text>

        <Text style={styles.section}>3. How We Use Your Information</Text>
        <Text style={styles.body}>We use your information to:</Text>
        <Text style={styles.bullet}>• Provide AI-powered car diagnostics</Text>
        <Text style={styles.bullet}>• Analyze mechanic quotes on your behalf</Text>
        <Text style={styles.bullet}>• Look up vehicle recalls from NHTSA</Text>
        <Text style={styles.bullet}>• Save your diagnosis and repair history</Text>
        <Text style={styles.bullet}>• Improve the accuracy of our AI responses</Text>

        <Text style={styles.section}>4. Third-Party Services</Text>
        <Text style={styles.body}>Engine Eye uses the following third-party services:</Text>
        <Text style={styles.bullet}>• Anthropic Claude AI — for vehicle diagnostics and quote analysis</Text>
        <Text style={styles.bullet}>• NHTSA — for vehicle recall data (public government API)</Text>
        <Text style={styles.bullet}>• YouTube — for DIY repair video suggestions</Text>
        <Text style={styles.bullet}>• Supabase — for secure user authentication</Text>

        <Text style={styles.section}>5. Data Storage</Text>
        <Text style={styles.body}>Your vehicle profiles, repair history, and maintenance data are stored locally on your device. Account information is stored securely on our servers. Diagnostic conversations are not permanently stored on our servers.</Text>

        <Text style={styles.section}>6. Data Security</Text>
        <Text style={styles.body}>We implement industry-standard security measures to protect your information. Your password is encrypted and never stored in plain text. We use secure HTTPS connections for all data transmission.</Text>

        <Text style={styles.section}>7. Children's Privacy</Text>
        <Text style={styles.body}>Engine Eye is not intended for users under the age of 13. We do not knowingly collect personal information from children under 13.</Text>

        <Text style={styles.section}>8. Your Rights</Text>
        <Text style={styles.body}>You have the right to:</Text>
        <Text style={styles.bullet}>• Access the personal data we hold about you</Text>
        <Text style={styles.bullet}>• Request deletion of your account and data</Text>
        <Text style={styles.bullet}>• Opt out of any marketing communications</Text>

        <Text style={styles.section}>9. Changes to This Policy</Text>
        <Text style={styles.body}>We may update this Privacy Policy from time to time. We will notify you of any changes by updating the date at the top of this policy.</Text>

        <Text style={styles.section}>10. Contact Us</Text>
        <Text style={styles.body}>If you have any questions about this Privacy Policy, please contact us at:</Text>
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