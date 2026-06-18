import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from "react-native";
import { useState } from "react";

const FAQS = [
  {
    question: "How does Engine Eye diagnose my car?",
    answer: "Engine Eye uses Claude AI by Anthropic to analyze your car problem descriptions, photos, and OBD-II codes. It provides expert-level diagnosis in plain English, including possible causes, repair costs, and recommended actions."
  },
  {
    question: "How do I analyze a mechanic quote?",
    answer: "Tap '📄 Quotes' in the header, then tap '📷 Analyze New Quote'. Upload a photo of your mechanic's quote using your camera, gallery, or a document file. Engine Eye will break down each item and tell you what's necessary, optional, or overpriced."
  },
  {
    question: "What is an OBD-II code?",
    answer: "OBD-II codes (like P0420 or P0300) are diagnostic trouble codes your car's computer generates when it detects a problem. You can read these codes with an OBD-II scanner (available at auto parts stores). Tap the '+' button and select '🔢 OBD Code' to analyze one."
  },
  {
    question: "How do I check for recalls on my vehicle?",
    answer: "Open the side menu (☰) and scroll to 'Active Recalls'. Engine Eye automatically checks the NHTSA database for recalls on your vehicle. If you've entered your VIN, results will be specific to your exact vehicle."
  },
  {
    question: "How do I add my VIN?",
    answer: "When adding or editing a vehicle in Car Profile, enter your 17-character VIN in the VIN field and tap 'Decode'. Engine Eye will auto-fill your vehicle details and use your VIN for more accurate recall lookups."
  },
  {
    question: "Can I track multiple vehicles?",
    answer: "Yes! You can add up to 3 vehicles. Tap the vehicle name in the header to switch between cars, or go to Settings to manage your vehicles."
  },
  {
    question: "How does the repair history work?",
    answer: "Go to '📄 Quotes' → 'Repair History' tab to log repairs manually or import them directly from an analyzed quote. You can track repair dates, costs, mileage, and notes for each vehicle."
  },
  {
    question: "What is maintenance tracking?",
    answer: "In the Repair History tab, tap '+ Add' under Maintenance Schedule to track items like oil changes, tire rotations, and brake pads. Set your current mileage and service intervals to see when each service is due."
  },
  {
    question: "Is my data private and secure?",
    answer: "Yes. Your vehicle data and repair history are stored locally on your device using encrypted storage. Account credentials are secured with Supabase using bcrypt password hashing. We never sell your data. See our Privacy Policy for full details."
  },
  {
    question: "How do I find auto repair shops nearby?",
    answer: "Tap '🔧 Shops' in the top right corner of the main screen. This opens Apple Maps with auto repair shops near your current location."
  },
  {
    question: "The diagnosis seems wrong — what should I do?",
    answer: "AI diagnostics are for informational purposes only and should not replace a professional mechanic's assessment. If you're unsure, always consult a licensed mechanic. You can ask Engine Eye follow-up questions to get more detail on any diagnosis."
  },
  {
    question: "How do I contact support?",
    answer: "Email us at jack.evans4408@gmail.com. We typically respond within 1-2 business days."
  },
];

export default function HelpFAQScreen({ onBack }) {
  const [expandedIndex, setExpandedIndex] = useState(null);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerText}>Help & FAQ</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView style={styles.content}>
        <Text style={styles.intro}>Have a question? Find answers to the most common questions about Engine Eye below.</Text>

        {FAQS.map((faq, i) => (
          <TouchableOpacity
            key={i}
            style={styles.faqCard}
            onPress={() => setExpandedIndex(expandedIndex === i ? null : i)}
          >
            <View style={styles.faqHeader}>
              <Text style={styles.faqQuestion}>{faq.question}</Text>
              <Text style={styles.faqArrow}>{expandedIndex === i ? "▲" : "▼"}</Text>
            </View>
            {expandedIndex === i && (
              <Text style={styles.faqAnswer}>{faq.answer}</Text>
            )}
          </TouchableOpacity>
        ))}

        <View style={styles.contactCard}>
          <Text style={styles.contactTitle}>Still need help?</Text>
          <Text style={styles.contactText}>Email us at jack.evans4408@gmail.com and we'll get back to you within 1-2 business days.</Text>
        </View>

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
  intro: { color: "#888", fontSize: 14, lineHeight: 20, marginBottom: 20 },
  faqCard: { backgroundColor: "#161618", borderRadius: 12, padding: 16, marginBottom: 10, borderWidth: 1, borderColor: "#2e2e33" },
  faqHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", gap: 12 },
  faqQuestion: { color: "#e8e6e0", fontSize: 14, fontWeight: "600", flex: 1, lineHeight: 20 },
  faqArrow: { color: "#f5a623", fontSize: 12, marginTop: 2 },
  faqAnswer: { color: "#888", fontSize: 14, lineHeight: 22, marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: "#2e2e33" },
  contactCard: { backgroundColor: "#161618", borderRadius: 12, padding: 20, marginTop: 8, borderWidth: 1, borderColor: "#f5a62344" },
  contactTitle: { color: "#f5a623", fontSize: 15, fontWeight: "bold", marginBottom: 8 },
  contactText: { color: "#888", fontSize: 14, lineHeight: 20 },
});