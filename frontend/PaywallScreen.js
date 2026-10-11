import { View, Text, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator, Alert } from "react-native";
import { useState, useEffect } from "react";
import PrivacyPolicyScreen from "./PrivacyPolicyScreen";
import TermsOfServiceScreen from "./TermsOfServiceScreen";
import { PLANS } from "./plans";
import { waitForPaidTier } from "./api";
import { purchasesAvailable, loadPlans, buyPlan, restorePurchases } from "./purchases";

// reason: optional sentence explaining why the paywall appeared (e.g. the daily limit message).
export default function PaywallScreen({ session, reason, currentTier = "free", onClose, onUpgraded, onSessionUpdate }) {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState(null);
  const [showPrivacy, setShowPrivacy] = useState(false);
  const [showTerms, setShowTerms] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!purchasesAvailable()) {
        setLoading(false);
        return;
      }
      try {
        const loaded = await loadPlans();
        if (!cancelled) setPlans(loaded);
      } catch (e) {
        console.log("Could not load plans:", e?.message || e);
      }
      if (!cancelled) setLoading(false);
    })();
    return () => { cancelled = true; };
  }, []);

  // The backend activates the plan from a RevenueCat webhook, so wait for it to show up.
  const activate = async () => {
    setStatus("Activating your plan…");
    const usage = await waitForPaidTier(session, { onSession: onSessionUpdate });
    if (usage) {
      onUpgraded?.(usage);
    } else {
      setStatus("Your purchase went through. It can take a minute to activate; reopen the app if it doesn't show up.");
    }
  };

  const purchase = async (plan) => {
    if (busy) return;
    setBusy(true);
    setStatus(null);
    try {
      const result = await buyPlan(plan.pkg);
      if (result.ok) await activate();
    } catch (e) {
      Alert.alert("Purchase failed", e?.message || "Something went wrong. You have not been charged.");
    }
    setBusy(false);
  };

  const restore = async () => {
    if (busy) return;
    setBusy(true);
    setStatus(null);
    try {
      const found = await restorePurchases();
      if (found) await activate();
      else Alert.alert("Nothing to restore", "We couldn't find an active subscription for this Apple ID.");
    } catch (e) {
      Alert.alert("Restore failed", e?.message || "Please try again.");
    }
    setBusy(false);
  };

  if (showPrivacy) return <PrivacyPolicyScreen onBack={() => setShowPrivacy(false)} />;
  if (showTerms) return <TermsOfServiceScreen onBack={() => setShowTerms(false)} />;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onClose} style={styles.backBtn}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerText}>Upgrade</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView style={styles.content} contentContainerStyle={{ paddingBottom: 40 }}>
        {reason ? <Text style={styles.reason}>{reason}</Text> : null}
        <Text style={styles.title}>Get more from Engine Eye</Text>

        <View style={[styles.card, currentTier === "free" && styles.cardCurrent]}>
          <Text style={styles.planName}>{PLANS[0].name}{currentTier === "free" ? "  ·  Current plan" : ""}</Text>
          {PLANS[0].features.map((f) => <Text key={f} style={styles.feature}>• {f}</Text>)}
        </View>

        {loading ? <ActivityIndicator color="#f5a623" style={{ marginTop: 24 }} /> : null}

        {!loading && plans.length === 0 ? (
          <Text style={styles.unavailable}>Subscriptions aren't available right now. Please try again later.</Text>
        ) : null}

        {plans.map((plan) => {
          const info = PLANS.find((p) => p.tier === plan.tier);
          const isCurrent = currentTier === plan.tier;
          return (
            <View key={plan.productId} style={[styles.card, isCurrent && styles.cardCurrent]}>
              <Text style={styles.planName}>{info.name}{isCurrent ? "  ·  Current plan" : ""}</Text>
              <Text style={styles.price}>{plan.priceString} / month</Text>
              {info.features.map((f) => <Text key={f} style={styles.feature}>• {f}</Text>)}
              {!isCurrent ? (
                <TouchableOpacity style={[styles.subscribeBtn, busy && { opacity: 0.5 }]} disabled={busy} onPress={() => purchase(plan)}>
                  <Text style={styles.subscribeText}>Subscribe</Text>
                </TouchableOpacity>
              ) : null}
            </View>
          );
        })}

        {status ? <Text style={styles.status}>{status}</Text> : null}
        {busy ? <ActivityIndicator color="#f5a623" style={{ marginTop: 12 }} /> : null}

        <TouchableOpacity onPress={restore} disabled={busy} style={styles.restoreBtn}>
          <Text style={styles.restoreText}>Restore Purchases</Text>
        </TouchableOpacity>

        <Text style={styles.disclosure}>
          Subscriptions renew automatically every month at the price shown unless cancelled at least 24 hours before the end of the current period.
          Payment is charged to your Apple ID account at confirmation of purchase. Manage or cancel anytime in your Apple ID account settings.
          Daily limits use a rolling 24-hour window.
        </Text>
        <View style={styles.linksRow}>
          <TouchableOpacity onPress={() => setShowTerms(true)}><Text style={styles.link}>Terms of Use</Text></TouchableOpacity>
          <Text style={styles.linkDot}>·</Text>
          <TouchableOpacity onPress={() => setShowPrivacy(true)}><Text style={styles.link}>Privacy Policy</Text></TouchableOpacity>
        </View>
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
  reason: { color: "#e8e6e0", fontSize: 15, backgroundColor: "#f5a62322", borderColor: "#f5a62355", borderWidth: 1, borderRadius: 12, padding: 14, marginBottom: 16, lineHeight: 21 },
  title: { color: "#e8e6e0", fontSize: 22, fontWeight: "bold", marginBottom: 16 },
  card: { backgroundColor: "#161618", borderRadius: 12, borderWidth: 1, borderColor: "#2e2e33", padding: 16, marginBottom: 12 },
  cardCurrent: { borderColor: "#4caf7d66" },
  planName: { color: "#e8e6e0", fontSize: 17, fontWeight: "700", marginBottom: 4 },
  price: { color: "#f5a623", fontSize: 15, fontWeight: "600", marginBottom: 8 },
  feature: { color: "#bdbdbd", fontSize: 14, marginTop: 2 },
  subscribeBtn: { backgroundColor: "#f5a623", borderRadius: 10, paddingVertical: 12, alignItems: "center", marginTop: 14 },
  subscribeText: { color: "#0d0d0e", fontSize: 15, fontWeight: "700" },
  unavailable: { color: "#888", fontSize: 14, textAlign: "center", marginTop: 20 },
  status: { color: "#e8e6e0", fontSize: 14, textAlign: "center", marginTop: 14, lineHeight: 20 },
  restoreBtn: { alignItems: "center", paddingVertical: 16, marginTop: 8 },
  restoreText: { color: "#f5a623", fontSize: 15 },
  disclosure: { color: "#777", fontSize: 11, lineHeight: 16, marginTop: 8 },
  linksRow: { flexDirection: "row", justifyContent: "center", alignItems: "center", marginTop: 12 },
  link: { color: "#f5a623", fontSize: 12 },
  linkDot: { color: "#777", marginHorizontal: 8 },
});
