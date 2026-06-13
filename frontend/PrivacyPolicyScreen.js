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
        <Text style={styles.lastUpdated}>Last Updated: June 13, 2026</Text>
        <Text style={styles.intro}>Engine Eye ("we", "our", "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, store, share, and protect your information when you use the Engine Eye mobile application. By using Engine Eye, you consent to the practices described in this policy.</Text>

        <Text style={styles.section}>1. Information We Collect</Text>
        <Text style={styles.body}>We collect the following categories of information:</Text>
        <Text style={styles.subheader}>Account Information</Text>
        <Text style={styles.bullet}>• Email address and encrypted password when you register</Text>
        <Text style={styles.bullet}>• Account creation date and last login timestamp</Text>
        <Text style={styles.subheader}>Vehicle Information</Text>
        <Text style={styles.bullet}>• Vehicle year, make, model, engine size, and mileage you provide</Text>
        <Text style={styles.bullet}>• Vehicle Identification Number (VIN) if provided for recall lookup</Text>
        <Text style={styles.bullet}>• Maintenance history and repair logs you create</Text>
        <Text style={styles.subheader}>Diagnostic Data</Text>
        <Text style={styles.bullet}>• Text descriptions of car problems you submit</Text>
        <Text style={styles.bullet}>• Photos and images you upload for diagnosis</Text>
        <Text style={styles.bullet}>• OBD-II diagnostic trouble codes you enter</Text>
        <Text style={styles.bullet}>• Mechanic quotes you upload for analysis</Text>
        <Text style={styles.subheader}>Usage Data</Text>
        <Text style={styles.bullet}>• Features you use and how frequently</Text>
        <Text style={styles.bullet}>• App performance data and crash reports</Text>
        <Text style={styles.bullet}>• Device type, operating system version, and app version</Text>

        <Text style={styles.section}>2. How We Use Your Information</Text>
        <Text style={styles.body}>We use the information we collect to:</Text>
        <Text style={styles.bullet}>• Provide AI-powered vehicle diagnostics through Anthropic's Claude AI</Text>
        <Text style={styles.bullet}>• Analyze mechanic quotes and provide cost comparisons</Text>
        <Text style={styles.bullet}>• Look up vehicle-specific recall data from the NHTSA database</Text>
        <Text style={styles.bullet}>• Decode VIN numbers to auto-populate vehicle information</Text>
        <Text style={styles.bullet}>• Save and display your diagnosis and repair history</Text>
        <Text style={styles.bullet}>• Track maintenance schedules across multiple vehicles</Text>
        <Text style={styles.bullet}>• Suggest relevant DIY repair videos via YouTube</Text>
        <Text style={styles.bullet}>• Authenticate your identity and secure your account</Text>
        <Text style={styles.bullet}>• Improve the accuracy and performance of the App</Text>
        <Text style={styles.bullet}>• Respond to your support requests and inquiries</Text>
        <Text style={styles.bullet}>• Comply with legal obligations</Text>

        <Text style={styles.section}>3. How We Store Your Information</Text>
        <Text style={styles.body}>Your data is stored in the following ways:</Text>
        <Text style={styles.subheader}>Local Device Storage</Text>
        <Text style={styles.body}>Vehicle profiles, repair history, maintenance schedules, and saved diagnoses are stored locally on your device using encrypted secure storage. This data remains on your device and is not automatically uploaded to our servers.</Text>
        <Text style={styles.subheader}>Secure Cloud Storage</Text>
        <Text style={styles.body}>Account credentials (email and encrypted password) are stored securely on Supabase servers with industry-standard encryption. Passwords are hashed and salted — we never store your plain text password.</Text>
        <Text style={styles.subheader}>Diagnostic Processing</Text>
        <Text style={styles.body}>When you submit a diagnosis, your query and any images are transmitted securely to our backend server and then to Anthropic's Claude AI for processing. Diagnostic conversations are processed in real time and are not permanently stored on our servers after the response is delivered.</Text>

        <Text style={styles.section}>4. Third-Party Services</Text>
        <Text style={styles.body}>Engine Eye uses the following third-party services, each with their own privacy practices:</Text>
        <Text style={styles.subheader}>Anthropic (Claude AI)</Text>
        <Text style={styles.body}>Powers our AI diagnostic engine. Your diagnostic queries and images are sent to Anthropic for processing. Anthropic's privacy policy governs their handling of this data. See anthropic.com/privacy.</Text>
        <Text style={styles.subheader}>NHTSA (National Highway Traffic Safety Administration)</Text>
        <Text style={styles.body}>A U.S. government public API used to retrieve vehicle recall data and decode VIN numbers. No personal data is shared with NHTSA beyond your vehicle's year, make, model, or VIN.</Text>
        <Text style={styles.subheader}>YouTube Data API</Text>
        <Text style={styles.body}>Used to suggest relevant DIY repair videos based on your diagnosed issue. Search queries related to your diagnosis may be sent to YouTube. Google's privacy policy applies. See policies.google.com/privacy.</Text>
        <Text style={styles.subheader}>Supabase</Text>
        <Text style={styles.body}>Provides secure user authentication and database services. Your email and encrypted credentials are stored on Supabase's servers. See supabase.com/privacy.</Text>
        <Text style={styles.subheader}>Railway</Text>
        <Text style={styles.body}>Hosts our backend API server. Diagnostic requests pass through Railway's infrastructure. See railway.app/legal/privacy.</Text>

        <Text style={styles.section}>5. Data Sharing and Disclosure</Text>
        <Text style={styles.body}>We do not sell, rent, trade, or share your personal information with third parties for marketing purposes. We may share your information only in the following circumstances:</Text>
        <Text style={styles.bullet}>• With third-party service providers listed above, solely to operate the App</Text>
        <Text style={styles.bullet}>• If required by law, court order, or government authority</Text>
        <Text style={styles.bullet}>• To protect the rights, safety, or property of Engine Eye or its users</Text>
        <Text style={styles.bullet}>• In connection with a merger, acquisition, or sale of assets, with prior notice to you</Text>
        <Text style={styles.bullet}>• With your explicit consent for any other purpose</Text>

        <Text style={styles.section}>6. Data Security</Text>
        <Text style={styles.body}>We implement industry-standard security measures to protect your information, including:</Text>
        <Text style={styles.bullet}>• HTTPS/TLS encryption for all data transmitted between the App and our servers</Text>
        <Text style={styles.bullet}>• Encrypted local storage on your device using Expo SecureStore</Text>
        <Text style={styles.bullet}>• Bcrypt password hashing — your password is never stored in plain text</Text>
        <Text style={styles.bullet}>• Secure authentication tokens with expiration</Text>
        <Text style={styles.bullet}>• Regular security reviews of our backend infrastructure</Text>
        <Text style={styles.body}>However, no method of transmission over the internet or electronic storage is 100% secure. While we strive to use commercially acceptable means to protect your information, we cannot guarantee absolute security.</Text>

        <Text style={styles.section}>7. Your Privacy Rights</Text>
        <Text style={styles.body}>You have the following rights regarding your personal data:</Text>
        <Text style={styles.bullet}>• Right to Access: Request a copy of the personal data we hold about you</Text>
        <Text style={styles.bullet}>• Right to Correction: Request correction of inaccurate or incomplete data</Text>
        <Text style={styles.bullet}>• Right to Deletion: Request deletion of your account and associated data</Text>
        <Text style={styles.bullet}>• Right to Portability: Request your data in a portable format</Text>
        <Text style={styles.bullet}>• Right to Opt-Out: Opt out of any non-essential data processing</Text>
        <Text style={styles.bullet}>• Right to Withdraw Consent: Withdraw consent at any time where processing is based on consent</Text>
        <Text style={styles.body}>To exercise any of these rights, contact us at jack.evans4408@gmail.com. We will respond within 30 days.</Text>

        <Text style={styles.section}>8. California Privacy Rights (CCPA)</Text>
        <Text style={styles.body}>If you are a California resident, you have additional rights under the California Consumer Privacy Act (CCPA), including the right to know what personal information we collect, the right to delete your personal information, and the right to non-discrimination for exercising your privacy rights. Engine Eye does not sell personal information. To submit a CCPA request, contact us at jack.evans4408@gmail.com.</Text>

        <Text style={styles.section}>9. Children's Privacy</Text>
        <Text style={styles.body}>Engine Eye is not directed to children under the age of 13. We do not knowingly collect personal information from children under 13. If we discover that a child under 13 has provided us with personal information, we will promptly delete it. If you believe we have inadvertently collected information from a child under 13, please contact us immediately at jack.evans4408@gmail.com.</Text>

        <Text style={styles.section}>10. Data Retention</Text>
        <Text style={styles.body}>We retain your personal information for as long as your account is active or as needed to provide you services. Local device data is retained until you delete it or uninstall the App. Account data is retained until you request deletion. If you request account deletion, we will delete your data within 30 days, except where retention is required by law.</Text>

        <Text style={styles.section}>11. International Data Transfers</Text>
        <Text style={styles.body}>Engine Eye is operated in the United States. If you are accessing the App from outside the United States, your information may be transferred to, stored, and processed in the United States. By using Engine Eye, you consent to the transfer of your information to the United States, where data protection laws may differ from those in your country.</Text>

        <Text style={styles.section}>12. Cookies and Tracking</Text>
        <Text style={styles.body}>Engine Eye is a mobile application and does not use browser cookies. We may use anonymized analytics to understand app usage patterns and improve performance. We do not use cross-app tracking or share your device advertising ID with third parties for advertising purposes.</Text>

        <Text style={styles.section}>13. Changes to This Privacy Policy</Text>
        <Text style={styles.body}>We may update this Privacy Policy from time to time to reflect changes in our practices or for legal, operational, or regulatory reasons. We will notify you of material changes by updating the date at the top of this policy. Your continued use of Engine Eye after any changes constitutes your acceptance of the updated policy. We encourage you to review this policy periodically.</Text>

        <Text style={styles.section}>14. Contact Us</Text>
        <Text style={styles.body}>If you have any questions, concerns, or requests regarding this Privacy Policy or our data practices, please contact us at:</Text>
        <Text style={styles.contact}>jack.evans4408@gmail.com</Text>
        <Text style={styles.body}>We take privacy seriously and will respond to all inquiries within 30 days.</Text>

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
  lastUpdated: { color: "#888", fontSize: 12, marginBottom: 8 },
  intro: { color: "#e8e6e0", fontSize: 14, lineHeight: 22, marginBottom: 20, fontStyle: "italic" },
  section: { color: "#f5a623", fontSize: 15, fontWeight: "bold", marginTop: 24, marginBottom: 8 },
  subheader: { color: "#e8e6e0", fontSize: 14, fontWeight: "600", marginTop: 10, marginBottom: 4 },
  body: { color: "#e8e6e0", fontSize: 14, lineHeight: 22, marginBottom: 8 },
  bullet: { color: "#e8e6e0", fontSize: 14, lineHeight: 22, marginLeft: 8, marginBottom: 4 },
  contact: { color: "#f5a623", fontSize: 14, marginTop: 4, marginBottom: 8 },
});