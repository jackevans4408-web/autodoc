import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from "react-native";
import { useState } from "react";
import PrivacyPolicyScreen from "./PrivacyPolicyScreen";

// Shown once per user before anything is sent to the AI service.
export default function ConsentScreen({ onAgree, onDecline }) {
  const [showPrivacy, setShowPrivacy] = useState(false);
  const [busy, setBusy] = useState(false);

  if (showPrivacy) return <PrivacyPolicyScreen onBack={() => setShowPrivacy(false)} />;

  const agree = async () => {
    if (busy) return;
    setBusy(true);
    await onAgree();
    setBusy(false);
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.logo}>Engine Eye</Text>
        <Text style={styles.title}>Before you start</Text>
        <Text style={styles.body}>
          Engine Eye uses artificial intelligence to help diagnose car problems. To give you an answer, the information you submit is sent from the app to our server and then to Anthropic, the company that runs the Claude AI service.
        </Text>

        <Text style={styles.heading}>What is sent</Text>
        <Text style={styles.bullet}>• The problem descriptions and follow-up questions you type</Text>
        <Text style={styles.bullet}>• Photos you attach, including photos of mechanic quotes</Text>
        <Text style={styles.bullet}>• Your vehicle's year, make, model and engine</Text>

        <Text style={styles.heading}>Also shared</Text>
        <Text style={styles.bullet}>• Your vehicle's year, make and model go to the U.S. government's NHTSA database to look up safety recalls</Text>
        <Text style={styles.bullet}>• Search words from your diagnosis go to YouTube to find repair videos</Text>

        <Text style={styles.body}>
          We don't sell your information. Anthropic handles what it receives under its own privacy policy. You can withdraw your permission any time in Settings, and you can delete your account and data there too.
        </Text>

        <Text style={styles.notice}>
          Engine Eye gives general information, not a professional inspection. Always check with a qualified mechanic before repairs, especially for brakes, steering, fuel or electrical problems.
        </Text>

        <TouchableOpacity onPress={() => setShowPrivacy(true)}>
          <Text style={styles.link}>Read the full Privacy Policy</Text>
        </TouchableOpacity>
      </ScrollView>

      <View style={styles.buttons}>
        <TouchableOpacity style={[styles.agreeBtn, busy && { opacity: 0.6 }]} onPress={agree} disabled={busy}>
          <Text style={styles.agreeText}>Agree and Continue</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.declineBtn} onPress={onDecline} disabled={busy}>
          <Text style={styles.declineText}>Not Now</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0d0d0e" },
  content: { padding: 24, paddingTop: 70 },
  logo: { color: "#f5a623", fontSize: 18, fontWeight: "bold", marginBottom: 6 },
  title: { color: "#e8e6e0", fontSize: 26, fontWeight: "bold", marginBottom: 14 },
  body: { color: "#bdbdbd", fontSize: 15, lineHeight: 22, marginBottom: 14 },
  heading: { color: "#e8e6e0", fontSize: 16, fontWeight: "700", marginTop: 8, marginBottom: 6 },
  bullet: { color: "#bdbdbd", fontSize: 15, lineHeight: 22, marginBottom: 4 },
  notice: { color: "#e8e6e0", fontSize: 14, lineHeight: 20, backgroundColor: "#161618", borderColor: "#2e2e33", borderWidth: 1, borderRadius: 12, padding: 14, marginTop: 10, marginBottom: 14 },
  link: { color: "#f5a623", fontSize: 15, marginBottom: 20 },
  buttons: { padding: 20, paddingBottom: 34, borderTopWidth: 1, borderTopColor: "#2e2e33", backgroundColor: "#161618" },
  agreeBtn: { backgroundColor: "#f5a623", borderRadius: 12, paddingVertical: 15, alignItems: "center" },
  agreeText: { color: "#0d0d0e", fontSize: 16, fontWeight: "700" },
  declineBtn: { paddingVertical: 14, alignItems: "center", marginTop: 6 },
  declineText: { color: "#888", fontSize: 15 },
});
