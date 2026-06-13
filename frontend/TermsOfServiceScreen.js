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
        <Text style={styles.lastUpdated}>Last Updated: June 13, 2026</Text>
        <Text style={styles.intro}>Please read these Terms of Service ("Terms") carefully before using Engine Eye. By downloading, installing, or using Engine Eye, you agree to be bound by these Terms. If you do not agree, do not use the app.</Text>

        <Text style={styles.section}>1. Acceptance of Terms</Text>
        <Text style={styles.body}>By accessing or using Engine Eye ("the App", "we", "our", "us"), you confirm that you are at least 18 years of age, have read and understood these Terms, and agree to be legally bound by them. These Terms constitute a legally binding agreement between you and Engine Eye.</Text>

        <Text style={styles.section}>2. Description of Service</Text>
        <Text style={styles.body}>Engine Eye provides AI-powered vehicle diagnostic assistance, mechanic quote analysis, maintenance tracking, recall lookup, OBD-II code interpretation, and related automotive tools. All AI-generated content is for informational purposes only and does not constitute professional mechanical, legal, or financial advice.</Text>

        <Text style={styles.section}>3. Intellectual Property Rights</Text>
        <Text style={styles.body}>Engine Eye and all of its contents, features, and functionality — including but not limited to the name "Engine Eye", the logo, user interface design, color scheme, AI prompt architecture, diagnostic formatting, feature set, code, databases, and all related materials — are the exclusive property of Engine Eye and are protected under United States and international copyright, trademark, trade secret, and intellectual property laws.</Text>
        <Text style={styles.body}>You are expressly prohibited from:</Text>
        <Text style={styles.bullet}>• Copying, cloning, recreating, or building any application substantially similar to Engine Eye</Text>
        <Text style={styles.bullet}>• Reverse engineering, decompiling, disassembling, or attempting to derive the source code of Engine Eye</Text>
        <Text style={styles.bullet}>• Scraping, extracting, or repurposing Engine Eye's features, AI prompt structure, design patterns, or diagnostic format</Text>
        <Text style={styles.bullet}>• Using Engine Eye's name, logo, branding, or trade dress in any form without prior written permission</Text>
        <Text style={styles.bullet}>• Distributing, sublicensing, selling, renting, or transferring any part of the App or its content</Text>
        <Text style={styles.bullet}>• Creating derivative works based on Engine Eye's proprietary systems or design</Text>
        <Text style={styles.bullet}>• Using automated tools, bots, or scrapers to access or extract content from Engine Eye</Text>
        <Text style={styles.bullet}>• Reproducing any portion of Engine Eye's interface, workflows, or user experience for commercial or competitive purposes</Text>
        <Text style={styles.body}>Any unauthorized use of Engine Eye's intellectual property may result in immediate legal action, including claims for injunctive relief, damages, and attorneys' fees under applicable law.</Text>

        <Text style={styles.section}>4. Trademark Notice</Text>
        <Text style={styles.body}>"Engine Eye" and the Engine Eye logo are proprietary marks of Engine Eye. All rights reserved. Unauthorized use of these marks in connection with any product or service is strictly prohibited and may constitute trademark infringement under 15 U.S.C. § 1125.</Text>

        <Text style={styles.section}>5. License to Use</Text>
        <Text style={styles.body}>Subject to these Terms, Engine Eye grants you a limited, non-exclusive, non-transferable, revocable license to use the App solely for your personal, non-commercial purposes. This license does not include any right to:</Text>
        <Text style={styles.bullet}>• Modify or create derivative works of the App</Text>
        <Text style={styles.bullet}>• Use the App for any commercial purpose or for any public display</Text>
        <Text style={styles.bullet}>• Remove or alter any proprietary notices or labels on the App</Text>
        <Text style={styles.bullet}>• Transfer the license to any third party</Text>

        <Text style={styles.section}>6. Disclaimer of Warranties</Text>
        <Text style={styles.body}>Engine Eye is provided "AS IS" and "AS AVAILABLE" without warranties of any kind, either express or implied, including but not limited to implied warranties of merchantability, fitness for a particular purpose, and non-infringement. Engine Eye does not warrant that:</Text>
        <Text style={styles.bullet}>• The App will be uninterrupted, error-free, or secure</Text>
        <Text style={styles.bullet}>• AI diagnostic results will be accurate, complete, or suitable for your specific vehicle</Text>
        <Text style={styles.bullet}>• Recall data from NHTSA will be current or complete</Text>
        <Text style={styles.bullet}>• Any defects will be corrected</Text>
        <Text style={styles.body}>Engine Eye's AI diagnostics are for informational purposes ONLY. Always consult a licensed mechanic before performing any vehicle repairs. Never rely solely on AI-generated advice for safety-critical repairs.</Text>

        <Text style={styles.section}>7. Limitation of Liability</Text>
        <Text style={styles.body}>To the fullest extent permitted by applicable law, Engine Eye and its owners, officers, employees, and agents shall not be liable for any indirect, incidental, special, consequential, or punitive damages, including but not limited to:</Text>
        <Text style={styles.bullet}>• Vehicle damage resulting from reliance on AI diagnostic information</Text>
        <Text style={styles.bullet}>• Personal injury resulting from repairs made based on App suggestions</Text>
        <Text style={styles.bullet}>• Financial loss from acting on quote analysis or cost estimates</Text>
        <Text style={styles.bullet}>• Loss of data, revenue, or profits</Text>
        <Text style={styles.bullet}>• Any inaccurate recall, VIN, or vehicle data</Text>
        <Text style={styles.body}>In no event shall Engine Eye's total liability to you exceed the amount you paid for the App in the twelve months preceding the claim, or $100, whichever is greater.</Text>

        <Text style={styles.section}>8. User Responsibilities</Text>
        <Text style={styles.body}>By using Engine Eye, you agree to:</Text>
        <Text style={styles.bullet}>• Provide accurate and truthful vehicle and account information</Text>
        <Text style={styles.bullet}>• Use the App only for lawful, personal, non-commercial purposes</Text>
        <Text style={styles.bullet}>• Not attempt to gain unauthorized access to any part of the App or its servers</Text>
        <Text style={styles.bullet}>• Not use the App to transmit harmful, offensive, or illegal content</Text>
        <Text style={styles.bullet}>• Not interfere with or disrupt the App's servers, networks, or infrastructure</Text>
        <Text style={styles.bullet}>• Not attempt to probe, scan, or test the vulnerability of the App's systems</Text>
        <Text style={styles.bullet}>• Comply with all applicable local, state, national, and international laws</Text>

        <Text style={styles.section}>9. Account Security</Text>
        <Text style={styles.body}>You are solely responsible for maintaining the confidentiality of your account credentials and for all activity that occurs under your account. You agree to notify us immediately at jack.evans4408@gmail.com of any unauthorized use of your account. Engine Eye will not be liable for any loss resulting from unauthorized use of your account.</Text>

        <Text style={styles.section}>10. Third-Party Services</Text>
        <Text style={styles.body}>Engine Eye integrates with third-party services including Anthropic (Claude AI), NHTSA, YouTube, and Supabase. Your use of these services is subject to their respective terms of service and privacy policies. Engine Eye is not responsible for the practices or content of any third-party services.</Text>

        <Text style={styles.section}>11. Termination</Text>
        <Text style={styles.body}>Engine Eye reserves the right to suspend or terminate your access to the App at any time, with or without notice, for any reason, including but not limited to violation of these Terms. Upon termination, your license to use the App immediately ceases. You may delete your account at any time through the Settings screen. Sections 3, 4, 6, 7, 12, and 13 survive termination.</Text>

        <Text style={styles.section}>12. Indemnification</Text>
        <Text style={styles.body}>You agree to indemnify, defend, and hold harmless Engine Eye and its owners, officers, employees, and agents from and against any claims, liabilities, damages, losses, costs, and expenses (including reasonable attorneys' fees) arising out of or in any way connected with your use of the App, your violation of these Terms, or your violation of any rights of any third party.</Text>

        <Text style={styles.section}>13. Governing Law and Dispute Resolution</Text>
        <Text style={styles.body}>These Terms shall be governed by and construed in accordance with the laws of the State of California, United States, without regard to conflict of law principles. Any dispute arising under these Terms shall be resolved exclusively through binding arbitration in accordance with the American Arbitration Association rules, except that either party may seek injunctive or other equitable relief in a court of competent jurisdiction to prevent infringement of intellectual property rights.</Text>

        <Text style={styles.section}>14. Changes to Terms</Text>
        <Text style={styles.body}>Engine Eye reserves the right to modify these Terms at any time. We will notify users of material changes by updating the date at the top of this page. Your continued use of the App after any changes constitutes your acceptance of the new Terms. If you do not agree to the modified Terms, you must stop using the App.</Text>

        <Text style={styles.section}>15. Severability</Text>
        <Text style={styles.body}>If any provision of these Terms is found to be unenforceable or invalid under applicable law, that provision shall be modified to the minimum extent necessary to make it enforceable, and the remaining provisions shall continue in full force and effect.</Text>

        <Text style={styles.section}>16. Entire Agreement</Text>
        <Text style={styles.body}>These Terms, together with our Privacy Policy, constitute the entire agreement between you and Engine Eye regarding your use of the App and supersede all prior agreements, understandings, and representations.</Text>

        <Text style={styles.section}>17. Contact</Text>
        <Text style={styles.body}>For questions, concerns, or legal notices regarding these Terms, contact us at:</Text>
        <Text style={styles.contact}>jack.evans4408@gmail.com</Text>
        <Text style={styles.body}>We will respond to legal inquiries within 30 days.</Text>

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
  body: { color: "#e8e6e0", fontSize: 14, lineHeight: 22, marginBottom: 8 },
  bullet: { color: "#e8e6e0", fontSize: 14, lineHeight: 22, marginLeft: 8, marginBottom: 4 },
  contact: { color: "#f5a623", fontSize: 14, marginTop: 4 },
});