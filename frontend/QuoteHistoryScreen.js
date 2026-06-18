import { View, Text, TouchableOpacity, StyleSheet, ScrollView, TextInput, Modal, KeyboardAvoidingView, Platform, Image, ActivityIndicator, Keyboard } from "react-native";
import { useState, useEffect } from "react";
import * as SecureStore from "expo-secure-store";
import * as ImagePicker from "expo-image-picker";
import * as DocumentPicker from "expo-document-picker";

const ALL_MAINTENANCE_OPTIONS = [
  { key: "oil", label: "🛢 Oil Change", defaultInterval: 5000 },
  { key: "brakes", label: "🛑 Brake Pads", defaultInterval: 30000 },
  { key: "tires", label: "🔄 Tire Rotation", defaultInterval: 7500 },
  { key: "airfilter", label: "💨 Air Filter", defaultInterval: 15000 },
  { key: "cabinfilter", label: "🌬 Cabin Air Filter", defaultInterval: 15000 },
  { key: "transmission", label: "⚙️ Transmission Fluid", defaultInterval: 30000 },
  { key: "coolant", label: "🌡 Coolant Flush", defaultInterval: 50000 },
  { key: "sparkplugs", label: "⚡ Spark Plugs", defaultInterval: 30000 },
  { key: "battery", label: "🔋 Battery", defaultInterval: 50000 },
  { key: "brakefluid", label: "🔵 Brake Fluid", defaultInterval: 25000 },
  { key: "powersteering", label: "🔧 Power Steering Fluid", defaultInterval: 50000 },
  { key: "difffluid", label: "🔩 Differential Fluid", defaultInterval: 30000 },
  { key: "timingbelt", label: "⏱ Timing Belt", defaultInterval: 60000 },
  { key: "serpentine", label: "🔁 Serpentine Belt", defaultInterval: 60000 },
  { key: "fuelfilter", label: "⛽ Fuel Filter", defaultInterval: 30000 },
  { key: "wipers", label: "🌧 Wiper Blades", defaultInterval: 12000 },
];

export default function QuoteHistoryScreen({ car, cars = [], onBack, onRepairLogged, onMaintenanceUpdated }) {
  const displayCars = cars.length > 0 ? cars.slice(0, 3) : [car];

  const [activeTab, setActiveTab] = useState("quotes");
  const [repairs, setRepairs] = useState([]);
  const [quotes, setQuotes] = useState([]);
  const [showAddRepair, setShowAddRepair] = useState(false);
  const [showAddQuote, setShowAddQuote] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState(null);
  const [repairName, setRepairName] = useState("");
  const [repairDate, setRepairDate] = useState("");
  const [repairCost, setRepairCost] = useState("");
  const [repairMileage, setRepairMileage] = useState("");
  const [repairNotes, setRepairNotes] = useState("");
  const [expandedQuote, setExpandedQuote] = useState(null);
  const [expandedRepair, setExpandedRepair] = useState(null);
  const [carMileages, setCarMileages] = useState({});
  const [expandedMileageCar, setExpandedMileageCar] = useState(null);
  const [mileageInputs, setMileageInputs] = useState({});
  const [maintenance, setMaintenance] = useState({});
  const [activeMaintenanceItems, setActiveMaintenanceItems] = useState([]);
  const [showMaintenanceSetup, setShowMaintenanceSetup] = useState(false);
  const [showAddMaintenance, setShowAddMaintenance] = useState(false);
  const [editingMaintenance, setEditingMaintenance] = useState(null);
  const [maintData, setMaintData] = useState({});
  const [maintInterval, setMaintInterval] = useState("");
  const [quoteLineItems, setQuoteLineItems] = useState([]);
  const [selectedRepairs, setSelectedRepairs] = useState({});
  const [repairCosts, setRepairCosts] = useState({});
  const [selectedCarForRepair, setSelectedCarForRepair] = useState(null);
  const [extraRepairs, setExtraRepairs] = useState([{ name: "", cost: "" }]);
  const [showingRepairLogger, setShowingRepairLogger] = useState(false);

  useEffect(() => { loadData(); }, []);

  useEffect(() => {
    if (cars.length > 0) setSelectedCarForRepair(cars[0]);
    else if (car) setSelectedCarForRepair(car);
  }, [cars, car]);

  const loadData = async () => {
    try {
      const savedRepairs = await SecureStore.getItemAsync("repairHistory");
      const savedQuotes = await SecureStore.getItemAsync("savedQuotes");
      const savedMileages = await SecureStore.getItemAsync("carMileages");
      const savedMaintenance = await SecureStore.getItemAsync("maintenanceSchedule");
      const savedActive = await SecureStore.getItemAsync("activeMaintenanceItems");
      if (savedRepairs) setRepairs(JSON.parse(savedRepairs));
      if (savedQuotes) setQuotes(JSON.parse(savedQuotes));
      if (savedMileages) setCarMileages(JSON.parse(savedMileages));
      if (savedMaintenance) setMaintenance(JSON.parse(savedMaintenance));
      if (savedActive) setActiveMaintenanceItems(JSON.parse(savedActive));
    } catch (e) { console.log("Error loading data:", e); }
  };

  const totalSpent = repairs.reduce((sum, r) => sum + (parseFloat(r.cost) || 0), 0);

  const parseLineItems = (analysisText) => {
    const lines = analysisText.split('\n');
    const items = [];
    lines.forEach(line => {
      const cleaned = line.replace(/^[-•]\s*/, '').trim();
      if (cleaned && !cleaned.startsWith('✅') && !cleaned.startsWith('⚠️') &&
          !cleaned.startsWith('🚨') && !cleaned.startsWith('💰') &&
          !cleaned.startsWith('Pay:') && !cleaned.startsWith('Skip:') &&
          cleaned.length > 3) {
        const match = cleaned.match(/^(.+?)\s*\$/);
        if (match) {
          const name = match[1].trim();
          if (name.length > 2) items.push(name);
        }
      }
    });
    return [...new Set(items)].filter(i => i.length > 2);
  };

  const openRepairLoggerFromSaved = (analysisText) => {
    if (!analysisText) return;
    const items = parseLineItems(analysisText);
    if (items.length === 0) { alert("Could not parse line items. Try logging repairs manually."); return; }
    setQuoteLineItems(items);
    const initialSelected = {};
    const initialCosts = {};
    items.forEach((item, i) => { initialSelected[i] = false; initialCosts[i] = ""; });
    setSelectedRepairs(initialSelected);
    setRepairCosts(initialCosts);
    setExtraRepairs([{ name: "", cost: "" }]);
    setAnalysis(analysisText);
    setShowingRepairLogger(true);
    setShowAddQuote(true);
  };

  const saveRepairsFromQuote = async () => {
    const newRepairs = [];
    quoteLineItems.forEach((item, i) => {
      if (selectedRepairs[i]) {
        newRepairs.push({
          id: Date.now().toString() + i,
          name: item,
          date: new Date().toLocaleDateString(),
          cost: repairCosts[i] || "0",
          mileage: "",
          notes: `From quote — ${selectedCarForRepair?.year} ${selectedCarForRepair?.make} ${selectedCarForRepair?.model}`,
        });
      }
    });
    extraRepairs.forEach((r, i) => {
      if (r.name.trim()) {
        newRepairs.push({
          id: Date.now().toString() + "extra" + i,
          name: r.name,
          date: new Date().toLocaleDateString(),
          cost: r.cost || "0",
          mileage: "",
          notes: `From quote — ${selectedCarForRepair?.year} ${selectedCarForRepair?.make} ${selectedCarForRepair?.model}`,
        });
      }
    });
    if (newRepairs.length === 0) { alert("Please select at least one repair!"); return; }
    const updated = [...newRepairs, ...repairs];
    setRepairs(updated);
    await SecureStore.setItemAsync("repairHistory", JSON.stringify(updated));
    setShowingRepairLogger(false);
    setShowAddQuote(false);
    if (onRepairLogged && newRepairs.length > 0) onRepairLogged(newRepairs[0].name);
    setQuoteLineItems([]);
    setSelectedRepairs({});
    setRepairCosts({});
    setExtraRepairs([{ name: "", cost: "" }]);
    setAnalysis(null);
    setSelectedImage(null);
  };

  const saveCarMileage = async (carId, mileage) => {
    const updated = { ...carMileages, [carId]: mileage };
    setCarMileages(updated);
    await SecureStore.setItemAsync("carMileages", JSON.stringify(updated));
    setExpandedMileageCar(null);
  };

  const getMaintStatusForCar = (itemKey, carId, defaultInterval) => {
    const data = maintenance[`${itemKey}_${carId}`];
    const currentMileage = carMileages[carId];
    if (!data || !currentMileage) return null;
    const current = parseFloat(currentMileage);
    const lastMileage = parseFloat(data.lastMileage);
    const interval = parseFloat(data.interval || defaultInterval);
    return (lastMileage + interval) - current;
  };

  const saveMaintenanceForCar = async (itemKey, carId, lastMileage, interval) => {
    const key = `${itemKey}_${carId}`;
    const updated = { ...maintenance, [key]: { lastMileage, interval } };
    setMaintenance(updated);
    await SecureStore.setItemAsync("maintenanceSchedule", JSON.stringify(updated));
    setShowMaintenanceSetup(false);
    if (onMaintenanceUpdated) {
      const car = displayCars.find(c => (c.id || c.make + c.model + c.year) === carId);
      onMaintenanceUpdated(editingMaintenance?.label, lastMileage, interval || editingMaintenance?.defaultInterval, `${car?.year} ${car?.make} ${car?.model}`);
    }
    setEditingMaintenance(null);
    setMaintData({});
    setMaintInterval("");
  };

  const addMaintenanceItem = async (item) => {
    if (activeMaintenanceItems.find(i => i.key === item.key)) { alert("Already in your list!"); return; }
    const updated = [...activeMaintenanceItems, item];
    setActiveMaintenanceItems(updated);
    await SecureStore.setItemAsync("activeMaintenanceItems", JSON.stringify(updated));
    setShowAddMaintenance(false);
  };

  const deleteMaintenanceItem = async (key) => {
    const updated = activeMaintenanceItems.filter(i => i.key !== key);
    setActiveMaintenanceItems(updated);
    await SecureStore.setItemAsync("activeMaintenanceItems", JSON.stringify(updated));
  };

  const pickImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) { alert("Permission required!"); return; }
    const result = await ImagePicker.launchImageLibraryAsync({ allowsEditing: true, quality: 0.8, base64: true });
    if (!result.canceled) { setSelectedImage(result.assets[0]); setAnalysis(null); }
  };

  const takePhoto = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) { alert("Permission required!"); return; }
    const result = await ImagePicker.launchCameraAsync({ allowsEditing: true, quality: 0.8, base64: true });
    if (!result.canceled) { setSelectedImage(result.assets[0]); setAnalysis(null); }
  };

  const pickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({ type: ["image/*", "application/pdf"], copyToCacheDirectory: true });
      if (!result.canceled && result.assets?.[0]) {
        const asset = result.assets[0];
        setSelectedImage({ uri: asset.uri, base64: null, name: asset.name, isDocument: true });
        setAnalysis(null);
      }
    } catch (e) { alert("Error picking document"); }
  };

  const analyzeQuote = async () => {
    if (!selectedImage) { alert("Please upload a photo first!"); return; }
    setAnalyzing(true);
    try {
      const body = {
        text: `Analyze this mechanic repair quote for my ${car?.year} ${car?.make} ${car?.model}. Return ONLY this exact format, no extra text or paragraphs:

        ✅ NECESSARY
        - [Item] $[price] — [Fair price / Slightly high / Overpriced] (DIY $[price] if applicable)

        ⚠️ OPTIONAL / CAN WAIT
        - [Item] $[price] — [brief reason]

        🚨 OVERPRICED / SKIP
        - [Item] $[price] — [brief reason]

        ⚠️ IF LEFT UNFIXED
        - [Item]: [one sentence on damage risk and cost if ignored]

        💰 BOTTOM LINE
        Pay: [items] = $[total]
        Skip: $[amount saved]

        Be concise. One line per item. No paragraphs.`,
        image_base64: selectedImage.base64,
        image_type: "image/jpeg",
        car_year: car?.year,
        car_make: car?.make,
        car_model: car?.model,
      };
      const response = await fetch("https://autodoc-production-1703.up.railway.app/diagnose", {
        method: "POST",
        headers: { "Accept": "application/json", "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await response.json();
      setAnalysis(data.diagnosis);
      const newQuote = {
        id: Date.now().toString(),
        date: new Date().toLocaleDateString(),
        imageUri: selectedImage.uri,
        analysis: data.diagnosis,
      };
      const updated = [newQuote, ...quotes];
      setQuotes(updated);
      await SecureStore.setItemAsync("savedQuotes", JSON.stringify(updated));
    } catch (e) { alert("Error analyzing quote. Try again."); }
    setAnalyzing(false);
  };

  const addRepair = async () => {
    if (!repairName.trim()) { alert("Please enter a repair name"); return; }
    const newRepair = {
      id: Date.now().toString(),
      name: repairName,
      date: repairDate || new Date().toLocaleDateString(),
      cost: repairCost,
      mileage: repairMileage,
      notes: repairNotes,
    };
    const updated = [newRepair, ...repairs];
    setRepairs(updated);
    await SecureStore.setItemAsync("repairHistory", JSON.stringify(updated));
    setShowAddRepair(false);
    if (onRepairLogged) onRepairLogged(repairName);
    setRepairName(""); setRepairDate(""); setRepairCost(""); setRepairMileage(""); setRepairNotes("");
  };

  const deleteRepair = async (id) => {
    const updated = repairs.filter(r => r.id !== id);
    setRepairs(updated);
    await SecureStore.setItemAsync("repairHistory", JSON.stringify(updated));
  };

  const deleteQuote = async (id) => {
    const updated = quotes.filter(q => q.id !== id);
    setQuotes(updated);
    await SecureStore.setItemAsync("savedQuotes", JSON.stringify(updated));
  };

  const RepairLoggerContent = () => (
    <View>
      <View style={styles.modalHeader}>
        <Text style={styles.modalTitle}>Which repairs did you get done?</Text>
        <TouchableOpacity onPress={() => setShowingRepairLogger(false)}>
          <Text style={styles.modalClose}>← Back</Text>
        </TouchableOpacity>
      </View>
      <Text style={styles.extraRepairsLabel}>Select Vehicle</Text>
      {(cars.length > 0 ? cars : car ? [car] : []).map((c, i) => (
        <TouchableOpacity
          key={i}
          style={[styles.maintOption, { marginBottom: 6 }, selectedCarForRepair?.id === c?.id && { borderColor: "#f5a623", backgroundColor: "#f5a62311" }]}
          onPress={() => setSelectedCarForRepair(c)}
        >
          <Text style={styles.maintOptionLabel}>🚗 {c?.year} {c?.make} {c?.model}</Text>
          {selectedCarForRepair?.id === c?.id && <Text style={{ color: "#f5a623" }}>✓</Text>}
        </TouchableOpacity>
      ))}
      {quoteLineItems.length === 0 ? (
        <Text style={styles.noItemsText}>No line items found. Add repairs manually below.</Text>
      ) : (
        quoteLineItems.map((item, i) => (
          <View key={i} style={styles.repairSelectRow}>
            <TouchableOpacity style={[styles.repairCheckbox, selectedRepairs[i] && styles.repairCheckboxChecked]} onPress={() => setSelectedRepairs(prev => ({ ...prev, [i]: !prev[i] }))}>
              {selectedRepairs[i] && <Text style={styles.checkmark}>✓</Text>}
            </TouchableOpacity>
            <Text style={styles.repairSelectName} numberOfLines={1}>{item}</Text>
            <TextInput
              style={styles.repairCostInput}
              placeholder="cost + tax"
              placeholderTextColor="#555"
              value={repairCosts[i] || ""}
              onChangeText={(val) => { setRepairCosts(prev => ({ ...prev, [i]: val })); if (val) setSelectedRepairs(prev => ({ ...prev, [i]: true })); }}
              keyboardType="numeric"
              returnKeyType="done"
              onSubmitEditing={() => Keyboard.dismiss()}
            />
          </View>
        ))
      )}
      <Text style={styles.extraRepairsLabel}>+ Additional Repairs</Text>
      {extraRepairs.map((r, i) => (
        <View key={i} style={styles.repairSelectRow}>
          <TextInput
            style={styles.extraRepairName}
            placeholder="Repair name"
            placeholderTextColor="#555"
            value={r.name}
            onChangeText={(val) => { const updated = [...extraRepairs]; updated[i] = { ...updated[i], name: val }; setExtraRepairs(updated); }}
          />
          <TextInput
            style={styles.repairCostInput}
            placeholder="cost + tax"
            placeholderTextColor="#555"
            value={r.cost}
            onChangeText={(val) => { const updated = [...extraRepairs]; updated[i] = { ...updated[i], cost: val }; setExtraRepairs(updated); }}
            keyboardType="numeric"
            returnKeyType="done"
            onSubmitEditing={() => Keyboard.dismiss()}
          />
        </View>
      ))}
      <TouchableOpacity onPress={() => setExtraRepairs([...extraRepairs, { name: "", cost: "" }])}>
        <Text style={styles.addAnotherBtn}>+ Add Another</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.saveBtn} onPress={saveRepairsFromQuote}>
        <Text style={styles.saveBtnText}>Add to Repair History →</Text>
      </TouchableOpacity>
    </View>
  );

return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerText}>Quote / History</Text>
        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => {
            if (activeTab === "history") {
              setRepairName(""); setRepairDate(""); setRepairCost(""); setRepairMileage(""); setRepairNotes("");
              setShowAddRepair(true);
            } else {
              setSelectedImage(null); setAnalysis(null); setShowingRepairLogger(false);
              setShowAddQuote(true);
            }
          }}
        >
          <Text style={styles.addBtnText}>+ Add</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.tabs}>
        <TouchableOpacity style={[styles.tab, activeTab === "quotes" && styles.tabActive]} onPress={() => setActiveTab("quotes")}>
          <Text style={[styles.tabText, activeTab === "quotes" && styles.tabTextActive]}>📄 Quotes</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.tab, activeTab === "history" && styles.tabActive]} onPress={() => setActiveTab("history")}>
          <Text style={[styles.tabText, activeTab === "history" && styles.tabTextActive]}>🔧 Repair History</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {activeTab === "quotes" && (
          <View>
            <TouchableOpacity style={styles.newQuoteBtn} onPress={() => { setSelectedImage(null); setAnalysis(null); setShowingRepairLogger(false); setShowAddQuote(true); }}>
              <Text style={styles.newQuoteBtnText}>📷 Analyze New Quote</Text>
            </TouchableOpacity>
            {quotes.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyIcon}>📄</Text>
                <Text style={styles.emptyTitle}>No quotes saved yet</Text>
                <Text style={styles.emptySubtitle}>Upload a mechanic quote and Engine Eye will analyze it for you</Text>
              </View>
            ) : (
              quotes.map(quote => (
                <TouchableOpacity key={quote.id} style={styles.quoteCard} onPress={() => setExpandedQuote(expandedQuote === quote.id ? null : quote.id)}>
                  <View style={styles.quoteCardHeader}>
                    <Text style={styles.quoteDate}>📅 {quote.date}</Text>
                    <View style={styles.quoteCardActions}>
                      <Text style={styles.expandHint}>{expandedQuote === quote.id ? "▲ Collapse" : "▼ View"}</Text>
                      <TouchableOpacity onPress={() => deleteQuote(quote.id)} style={{ marginLeft: 12 }}>
                        <Text style={styles.deleteBtn}>✕</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                  <Image source={{ uri: quote.imageUri }} style={styles.quoteThumbnail} />
                  {expandedQuote === quote.id ? (
                    <View>
                      <Text style={styles.quoteAnalysisFull}>{quote.analysis}</Text>
                      <TouchableOpacity style={styles.logRepairsBtn} onPress={() => openRepairLoggerFromSaved(quote.analysis)}>
                        <Text style={styles.logRepairsBtnText}>🔧 Log Repairs from This Quote</Text>
                      </TouchableOpacity>
                    </View>
                  ) : (
                    <Text style={styles.quoteAnalysisPreview} numberOfLines={3}>{quote.analysis}</Text>
                  )}
                </TouchableOpacity>
              ))
            )}
          </View>
        )}

        {activeTab === "history" && (
          <View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>💰 Total Spent</Text>
              <Text style={styles.summaryAmount}>${totalSpent.toFixed(2)}</Text>
            </View>
            <Text style={styles.sectionTitle}>🚗 My Vehicles</Text>
            {displayCars.map((c) => {
              const carId = c.id || c.make + c.model + c.year;
              const mileage = carMileages[carId];
              const isExpanded = expandedMileageCar === carId;
              return (
                <View key={carId}>
                  <TouchableOpacity style={styles.mileageCard} onPress={() => { setExpandedMileageCar(isExpanded ? null : carId); setMileageInputs(prev => ({ ...prev, [carId]: mileage || "" })); }}>
                    <Text style={styles.mileageLabel}>🚗 {c.year} {c.make} {c.model}</Text>
                    <Text style={styles.mileageValue}>{mileage ? `${parseFloat(mileage).toLocaleString()} mi` : "Tap to set"}</Text>
                  </TouchableOpacity>
                  {isExpanded && (
                    <View style={styles.mileageInputRow}>
                      <TextInput style={styles.mileageInput} placeholder="Enter current mileage" placeholderTextColor="#888" value={mileageInputs[carId] || ""} onChangeText={(val) => setMileageInputs(prev => ({ ...prev, [carId]: val }))} keyboardType="numeric" />
                      <TouchableOpacity style={styles.mileageSaveBtn} onPress={() => saveCarMileage(carId, mileageInputs[carId])}>
                        <Text style={styles.mileageSaveBtnText}>Save</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              );
            })}
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>🔧 Maintenance Schedule</Text>
              <TouchableOpacity onPress={() => setShowAddMaintenance(true)}>
                <Text style={styles.sectionAdd}>+ Add</Text>
              </TouchableOpacity>
            </View>
            {activeMaintenanceItems.length === 0 ? (
              <TouchableOpacity style={styles.emptyMaint} onPress={() => setShowAddMaintenance(true)}>
                <Text style={styles.emptyMaintText}>+ Add maintenance items to track</Text>
              </TouchableOpacity>
            ) : (
              activeMaintenanceItems.map(item => (
                <View key={item.key} style={styles.maintCard}>
                  <View style={styles.maintTitleRow}>
                    <Text style={styles.maintLabel}>{item.label}</Text>
                    <TouchableOpacity onPress={() => deleteMaintenanceItem(item.key)}>
                      <Text style={styles.deleteBtn}>✕</Text>
                    </TouchableOpacity>
                  </View>
                  {displayCars.map((c) => {
                    const carId = c.id || c.make + c.model + c.year;
                    const milesRemaining = getMaintStatusForCar(item.key, carId, item.defaultInterval);
                    const data = maintenance[`${item.key}_${carId}`];
                    return (
                      <TouchableOpacity key={carId} style={styles.maintCarRow} onPress={() => { setEditingMaintenance({ ...item, carId }); setMaintData({ lastMileage: data?.lastMileage || "", interval: data?.interval || item.defaultInterval.toString() }); setShowMaintenanceSetup(true); }}>
                        <Text style={styles.maintCarName} numberOfLines={1}>{c.year} {c.make}</Text>
                        {milesRemaining !== null ? (
                          <View style={[styles.maintBadge, milesRemaining < 0 ? styles.badgeRed : milesRemaining < 500 ? styles.badgeYellow : styles.badgeGreen]}>
                            <Text style={styles.maintBadgeText}>
                              {milesRemaining < 0 ? `⚠️ ${Math.abs(Math.round(milesRemaining)).toLocaleString()} mi overdue` : milesRemaining < 500 ? `⚡ ${Math.round(milesRemaining).toLocaleString()} mi left` : `✅ ${Math.round(milesRemaining).toLocaleString()} mi left`}
                            </Text>
                          </View>
                        ) : <Text style={styles.maintSetup}>Tap to set up →</Text>}
                      </TouchableOpacity>
                    );
                  })}
                </View>
              ))
            )}
            <Text style={styles.sectionTitle}>📋 Repair Log</Text>
            {repairs.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyIcon}>🔧</Text>
                <Text style={styles.emptyTitle}>No repairs logged yet</Text>
                <TouchableOpacity style={styles.emptyBtn} onPress={() => setShowAddRepair(true)}>
                  <Text style={styles.emptyBtnText}>Log First Repair</Text>
                </TouchableOpacity>
              </View>
            ) : (
              repairs.map(repair => (
                <TouchableOpacity key={repair.id} style={styles.repairCard} onPress={() => setExpandedRepair(expandedRepair === repair.id ? null : repair.id)}>
                  <View style={styles.repairHeader}>
                    <Text style={styles.repairName}>{repair.name}</Text>
                    <View style={styles.quoteCardActions}>
                      <Text style={styles.expandHint}>{expandedRepair === repair.id ? "▲" : "▼"}</Text>
                      <TouchableOpacity onPress={() => deleteRepair(repair.id)} style={{ marginLeft: 12 }}>
                        <Text style={styles.deleteBtn}>✕</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                  {expandedRepair === repair.id && (
                    <View>
                      <View style={styles.repairDetails}>
                        {repair.date ? <Text style={styles.repairDetail}>📅 {repair.date}</Text> : null}
                        {repair.cost ? <Text style={styles.repairDetail}>💰 ${repair.cost}</Text> : null}
                        {repair.mileage ? <Text style={styles.repairDetail}>🚗 {repair.mileage} mi</Text> : null}
                      </View>
                      {repair.notes ? <Text style={styles.repairNotes}>{repair.notes}</Text> : null}
                    </View>
                  )}
                </TouchableOpacity>
              ))
            )}
          </View>
        )}
      </ScrollView>

      {/* Add Maintenance Item Modal */}
      <Modal visible={showAddMaintenance} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Maintenance Item</Text>
              <TouchableOpacity onPress={() => setShowAddMaintenance(false)}>
                <Text style={styles.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>
            <ScrollView>
              {ALL_MAINTENANCE_OPTIONS.filter(o => !activeMaintenanceItems.find(a => a.key === o.key)).map(item => (
                <TouchableOpacity key={item.key} style={styles.maintOption} onPress={() => addMaintenanceItem(item)}>
                  <Text style={styles.maintOptionLabel}>{item.label}</Text>
                  <Text style={styles.maintOptionInterval}>Every {item.defaultInterval.toLocaleString()} mi</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Maintenance Setup Modal */}
      <Modal visible={showMaintenanceSetup} animationType="slide" transparent>
        <KeyboardAvoidingView style={styles.modalOverlay} behavior={Platform.OS === "ios" ? "padding" : "height"}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{editingMaintenance?.label}</Text>
              <TouchableOpacity onPress={() => setShowMaintenanceSetup(false)}>
                <Text style={styles.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>
            {editingMaintenance && (
              <Text style={styles.maintCarLabel}>
                🚗 {displayCars.find(c => (c.id || c.make + c.model + c.year) === editingMaintenance.carId)?.year} {displayCars.find(c => (c.id || c.make + c.model + c.year) === editingMaintenance.carId)?.make} {displayCars.find(c => (c.id || c.make + c.model + c.year) === editingMaintenance.carId)?.model}
              </Text>
            )}
            <TextInput style={styles.input} placeholder="Last service mileage (e.g. 82000)" placeholderTextColor="#888" value={maintData.lastMileage || ""} onChangeText={(val) => setMaintData(prev => ({ ...prev, lastMileage: val }))} keyboardType="numeric" />
            <TextInput style={styles.input} placeholder={`Interval in miles (default: ${editingMaintenance?.defaultInterval?.toLocaleString()})`} placeholderTextColor="#888" value={maintData.interval || ""} onChangeText={(val) => setMaintData(prev => ({ ...prev, interval: val }))} keyboardType="numeric" />
            <TouchableOpacity style={styles.saveBtn} onPress={() => saveMaintenanceForCar(editingMaintenance.key, editingMaintenance.carId, maintData.lastMileage, maintData.interval || editingMaintenance.defaultInterval)}>
              <Text style={styles.saveBtnText}>Save</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Add Quote Modal — also handles inline repair logger */}
      <Modal visible={showAddQuote} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {!showingRepairLogger && (
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Analyze Quote</Text>
                <TouchableOpacity onPress={() => { setShowAddQuote(false); setSelectedImage(null); setAnalysis(null); setShowingRepairLogger(false); }}>
                  <Text style={styles.modalClose}>✕</Text>
                </TouchableOpacity>
              </View>
            )}
            <ScrollView keyboardShouldPersistTaps="handled">
              {!showingRepairLogger && (
                <View>
                  {!selectedImage ? (
                    <View style={styles.uploadArea}>
                      <Text style={styles.uploadText}>Upload your mechanic quote</Text>
                      <View style={styles.uploadButtons}>
                        <TouchableOpacity style={styles.uploadBtn} onPress={takePhoto}>
                          <Text style={styles.uploadBtnText}>📷 Camera</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.uploadBtn} onPress={pickImage}>
                          <Text style={styles.uploadBtnText}>🖼 Gallery</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.uploadBtn} onPress={pickDocument}>
                          <Text style={styles.uploadBtnText}>📄 Document</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  ) : (
                    <View>
                      <Image source={{ uri: selectedImage.uri }} style={styles.previewImage} />
                      <TouchableOpacity style={styles.changeBtn} onPress={() => { setSelectedImage(null); setAnalysis(null); }}>
                        <Text style={styles.changeBtnText}>Change Photo</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                  {selectedImage && !analysis && (
                    <TouchableOpacity style={styles.analyzeBtn} onPress={analyzeQuote} disabled={analyzing}>
                      {analyzing ? <ActivityIndicator color="#0d0d0e" /> : <Text style={styles.analyzeBtnText}>🔍 Analyze Quote</Text>}
                    </TouchableOpacity>
                  )}
                  {analysis && (
                    <View style={styles.analysisBox}>
                      <Text style={styles.analysisTitle}>📋 Analysis</Text>
                      <Text style={styles.analysisText}>{analysis}</Text>
                      <TouchableOpacity style={styles.logRepairsBtn} onPress={() => {
                        const items = parseLineItems(analysis);
                        if (items.length === 0) { alert("Could not parse line items. Add repairs manually."); return; }
                        setQuoteLineItems(items);
                        const initialSelected = {};
                        const initialCosts = {};
                        items.forEach((item, i) => { initialSelected[i] = false; initialCosts[i] = ""; });
                        setSelectedRepairs(initialSelected);
                        setRepairCosts(initialCosts);
                        setExtraRepairs([{ name: "", cost: "" }]);
                        setShowingRepairLogger(true);
                      }}>
                        <Text style={styles.logRepairsBtnText}>🔧 Log Repairs from This Quote</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={styles.doneBtn} onPress={() => {
                        setShowAddQuote(false);
                        setSelectedImage(null);
                        setAnalysis(null);
                        setShowingRepairLogger(false);
                        setQuoteLineItems([]);
                        setSelectedRepairs({});
                        setRepairCosts({});
                        setExtraRepairs([{ name: "", cost: "" }]);
                      }}>
                        <Text style={styles.doneBtnText}>Done — Saved to History</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              )}
              {showingRepairLogger && <RepairLoggerContent />}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Add Repair Modal */}
      <Modal visible={showAddRepair} animationType="slide" transparent>
        <KeyboardAvoidingView style={styles.modalOverlay} behavior={Platform.OS === "ios" ? "padding" : "height"}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Log a Repair</Text>
              <TouchableOpacity onPress={() => setShowAddRepair(false)}>
                <Text style={styles.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>
            <ScrollView keyboardShouldPersistTaps="handled">
              <TextInput style={styles.input} placeholder="Repair name (e.g. Oil Change, Brake Pads)" placeholderTextColor="#888" value={repairName} onChangeText={setRepairName} />
              <TextInput style={styles.input} placeholder="Date (e.g. 06/05/2026)" placeholderTextColor="#888" value={repairDate} onChangeText={setRepairDate} />
              <TextInput style={styles.input} placeholder="Cost (e.g. 250)" placeholderTextColor="#888" value={repairCost} onChangeText={setRepairCost} keyboardType="numeric" />
              <TextInput style={styles.input} placeholder="Mileage (e.g. 85000)" placeholderTextColor="#888" value={repairMileage} onChangeText={setRepairMileage} keyboardType="numeric" />
              <TextInput style={[styles.input, styles.notesInput]} placeholder="Notes (optional)" placeholderTextColor="#888" value={repairNotes} onChangeText={setRepairNotes} multiline />
              <TouchableOpacity style={styles.saveBtn} onPress={addRepair}>
                <Text style={styles.saveBtnText}>Save Repair</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0d0d0e" },
  header: { backgroundColor: "#161618", paddingTop: 60, paddingBottom: 20, paddingHorizontal: 20, flexDirection: "row", justifyContent: "space-between", alignItems: "center", borderBottomWidth: 1, borderBottomColor: "#2e2e33" },
  backBtn: { width: 60 },
  backText: { color: "#f5a623", fontSize: 14 },
  headerText: { color: "#f5a623", fontSize: 20, fontWeight: "bold" },
  addBtn: { backgroundColor: "#f5a623", borderRadius: 8, padding: 8, paddingHorizontal: 12 },
  addBtnText: { color: "#0d0d0e", fontWeight: "bold", fontSize: 13 },
  tabs: { flexDirection: "row", backgroundColor: "#161618", borderBottomWidth: 1, borderBottomColor: "#2e2e33" },
  tab: { flex: 1, padding: 14, alignItems: "center" },
  tabActive: { borderBottomWidth: 2, borderBottomColor: "#f5a623" },
  tabText: { color: "#888", fontSize: 14 },
  tabTextActive: { color: "#f5a623", fontWeight: "600" },
  content: { flex: 1, padding: 16 },
  summaryRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", backgroundColor: "#161618", borderRadius: 10, padding: 12, marginBottom: 10, borderWidth: 1, borderColor: "#2e2e33" },
  summaryLabel: { color: "#888", fontSize: 13 },
  summaryAmount: { color: "#f5a623", fontSize: 16, fontWeight: "bold" },
  sectionHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 16, marginBottom: 8 },
  sectionTitle: { color: "#888", fontSize: 12, fontWeight: "500", textTransform: "uppercase", letterSpacing: 0.5, marginTop: 16, marginBottom: 8 },
  sectionAdd: { color: "#f5a623", fontSize: 13, fontWeight: "600" },
  mileageCard: { backgroundColor: "#161618", borderRadius: 12, padding: 14, marginBottom: 8, borderWidth: 1, borderColor: "#2e2e33", flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  mileageLabel: { color: "#e8e6e0", fontSize: 13, fontWeight: "500" },
  mileageValue: { color: "#888", fontSize: 13 },
  mileageInputRow: { flexDirection: "row", gap: 8, marginBottom: 8 },
  mileageInput: { flex: 1, backgroundColor: "#1e1e21", color: "#e8e6e0", borderRadius: 8, padding: 10, fontSize: 14, borderWidth: 1, borderColor: "#2e2e33" },
  mileageSaveBtn: { backgroundColor: "#f5a623", borderRadius: 8, padding: 10, paddingHorizontal: 16, justifyContent: "center" },
  mileageSaveBtnText: { color: "#0d0d0e", fontWeight: "bold", fontSize: 14 },
  emptyMaint: { backgroundColor: "#161618", borderRadius: 10, padding: 14, borderWidth: 1, borderColor: "#2e2e33", borderStyle: "dashed", alignItems: "center", marginBottom: 8 },
  emptyMaintText: { color: "#888", fontSize: 14 },
  maintCard: { backgroundColor: "#161618", borderRadius: 10, padding: 14, marginBottom: 8, borderWidth: 1, borderColor: "#2e2e33" },
  maintTitleRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 10 },
  maintLabel: { color: "#e8e6e0", fontSize: 14, fontWeight: "600" },
  maintCarRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 6, borderTopWidth: 1, borderTopColor: "#2e2e33" },
  maintCarName: { color: "#888", fontSize: 13, flex: 1 },
  maintBadge: { alignSelf: "flex-start", borderRadius: 20, paddingHorizontal: 10, paddingVertical: 3 },
  badgeRed: { backgroundColor: "#e05a5a22", borderWidth: 1, borderColor: "#e05a5a" },
  badgeYellow: { backgroundColor: "#f5a62322", borderWidth: 1, borderColor: "#f5a623" },
  badgeGreen: { backgroundColor: "#4caf7d22", borderWidth: 1, borderColor: "#4caf7d" },
  maintBadgeText: { fontSize: 12, color: "#e8e6e0" },
  maintSetup: { color: "#888", fontSize: 12 },
  maintCarLabel: { color: "#888", fontSize: 13, marginBottom: 12 },
  maintOption: { backgroundColor: "#1e1e21", borderRadius: 10, padding: 14, marginBottom: 8, borderWidth: 1, borderColor: "#2e2e33", flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  maintOptionLabel: { color: "#e8e6e0", fontSize: 14 },
  maintOptionInterval: { color: "#888", fontSize: 12 },
  newQuoteBtn: { backgroundColor: "#f5a623", borderRadius: 10, padding: 14, alignItems: "center", marginBottom: 16 },
  newQuoteBtnText: { color: "#0d0d0e", fontWeight: "bold", fontSize: 15 },
  emptyState: { alignItems: "center", paddingTop: 40 },
  emptyIcon: { fontSize: 40, marginBottom: 12 },
  emptyTitle: { color: "#e8e6e0", fontSize: 16, fontWeight: "bold", marginBottom: 8 },
  emptySubtitle: { color: "#888", fontSize: 13, textAlign: "center", lineHeight: 20, marginBottom: 20, paddingHorizontal: 20 },
  emptyBtn: { backgroundColor: "#f5a623", borderRadius: 8, padding: 12, paddingHorizontal: 24 },
  emptyBtnText: { color: "#0d0d0e", fontWeight: "bold", fontSize: 14 },
  quoteCard: { backgroundColor: "#161618", borderRadius: 12, padding: 14, marginBottom: 12, borderWidth: 1, borderColor: "#2e2e33" },
  quoteCardHeader: { flexDirection: "row", justifyContent: "space-between", marginBottom: 8 },
  quoteDate: { color: "#888", fontSize: 13 },
  quoteThumbnail: { width: "100%", height: 120, borderRadius: 8, marginBottom: 8 },
  quoteAnalysisPreview: { color: "#888", fontSize: 13, lineHeight: 18 },
  quoteAnalysisFull: { color: "#e8e6e0", fontSize: 13, lineHeight: 20, marginTop: 8 },
  quoteCardActions: { flexDirection: "row", alignItems: "center" },
  expandHint: { color: "#f5a623", fontSize: 12 },
  logRepairsBtn: { backgroundColor: "#1e1e21", borderRadius: 8, padding: 12, alignItems: "center", marginTop: 12, borderWidth: 1, borderColor: "#f5a62344" },
  logRepairsBtnText: { color: "#f5a623", fontSize: 14, fontWeight: "500" },
  repairCard: { backgroundColor: "#161618", borderRadius: 12, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: "#2e2e33" },
  repairHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  repairName: { color: "#e8e6e0", fontSize: 15, fontWeight: "600", flex: 1 },
  deleteBtn: { color: "#888", fontSize: 16, padding: 4 },
  repairDetails: { flexDirection: "row", flexWrap: "wrap", gap: 12, marginTop: 8, marginBottom: 6 },
  repairDetail: { color: "#888", fontSize: 13 },
  repairNotes: { color: "#888", fontSize: 13, fontStyle: "italic", marginTop: 4 },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.7)", justifyContent: "flex-end" },
  modalContent: { backgroundColor: "#161618", borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 24, maxHeight: "90%" },
  modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 20 },
  modalTitle: { color: "#e8e6e0", fontSize: 18, fontWeight: "bold" },
  modalClose: { color: "#888", fontSize: 20 },
  uploadArea: { backgroundColor: "#1e1e21", borderRadius: 12, padding: 24, alignItems: "center", marginBottom: 16, borderWidth: 1, borderColor: "#2e2e33" },
  uploadText: { color: "#888", fontSize: 15, marginBottom: 16 },
  uploadButtons: { flexDirection: "row", gap: 8, flexWrap: "wrap", justifyContent: "center" },
  uploadBtn: { backgroundColor: "#161618", borderRadius: 8, padding: 12, paddingHorizontal: 16, borderWidth: 1, borderColor: "#2e2e33" },
  uploadBtnText: { color: "#e8e6e0", fontSize: 14 },
  previewImage: { width: "100%", height: 200, borderRadius: 10, marginBottom: 12 },
  changeBtn: { backgroundColor: "#1e1e21", borderRadius: 8, padding: 10, alignItems: "center", marginBottom: 12, borderWidth: 1, borderColor: "#2e2e33" },
  changeBtnText: { color: "#888", fontSize: 13 },
  analyzeBtn: { backgroundColor: "#f5a623", borderRadius: 10, padding: 14, alignItems: "center", marginBottom: 16 },
  analyzeBtnText: { color: "#0d0d0e", fontWeight: "bold", fontSize: 15 },
  analysisBox: { backgroundColor: "#1e1e21", borderRadius: 10, padding: 14, marginBottom: 16, borderWidth: 1, borderColor: "#2e2e33" },
  analysisTitle: { color: "#f5a623", fontWeight: "bold", fontSize: 15, marginBottom: 8 },
  analysisText: { color: "#e8e6e0", fontSize: 13, lineHeight: 20 },
  doneBtn: { backgroundColor: "#f5a623", borderRadius: 8, padding: 12, alignItems: "center", marginTop: 12 },
  doneBtnText: { color: "#0d0d0e", fontWeight: "bold", fontSize: 14 },
  input: { backgroundColor: "#1e1e21", color: "#e8e6e0", borderRadius: 8, padding: 12, fontSize: 14, borderWidth: 1, borderColor: "#2e2e33", marginBottom: 12 },
  notesInput: { height: 80, textAlignVertical: "top" },
  saveBtn: { backgroundColor: "#f5a623", borderRadius: 8, padding: 14, alignItems: "center", marginTop: 4, marginBottom: 20 },
  saveBtnText: { color: "#0d0d0e", fontWeight: "bold", fontSize: 16 },
  repairSelectRow: { flexDirection: "row", alignItems: "center", paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: "#2e2e33", gap: 10 },
  repairCheckbox: { width: 24, height: 24, borderRadius: 6, borderWidth: 2, borderColor: "#2e2e33", alignItems: "center", justifyContent: "center" },
  repairCheckboxChecked: { backgroundColor: "#f5a623", borderColor: "#f5a623" },
  checkmark: { color: "#0d0d0e", fontSize: 14, fontWeight: "bold" },
  repairSelectName: { flex: 1, color: "#e8e6e0", fontSize: 13 },
  repairCostInput: { width: 90, backgroundColor: "#0d0d0e", color: "#e8e6e0", borderRadius: 6, padding: 8, fontSize: 13, borderWidth: 1, borderColor: "#2e2e33", textAlign: "center" },
  noItemsText: { color: "#888", fontSize: 13, textAlign: "center", padding: 20 },
  extraRepairsLabel: { color: "#888", fontSize: 11, fontWeight: "600", textTransform: "uppercase", letterSpacing: 0.5, marginTop: 16, marginBottom: 8 },
  extraRepairName: { flex: 1, backgroundColor: "#0d0d0e", color: "#e8e6e0", borderRadius: 6, padding: 8, fontSize: 13, borderWidth: 1, borderColor: "#2e2e33" },
  addAnotherBtn: { color: "#f5a623", fontSize: 13, padding: 8, paddingLeft: 0 },
});