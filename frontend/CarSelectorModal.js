import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Modal } from "react-native";

export default function CarSelectorModal({ visible, cars, activeCar, onSelect, onAdd, onDelete, onClose }) {
  return (
    <Modal visible={visible} animationType="slide" transparent>
      <TouchableOpacity style={styles.overlay} onPress={onClose} activeOpacity={1}>
        <View style={styles.content}>
          <View style={styles.header}>
            <Text style={styles.title}>My Vehicles</Text>
            <TouchableOpacity onPress={onClose}>
              <Text style={styles.close}>✕</Text>
            </TouchableOpacity>
          </View>
          <ScrollView>
            {cars.map((car, i) => (
              <View key={i} style={styles.carRow}>
                <TouchableOpacity style={[styles.carOption, activeCar?.id === car.id && styles.carOptionActive]} onPress={() => onSelect(car)}>
                  <Text style={styles.carIcon}>🚗</Text>
                  <View style={styles.carInfo}>
                    <Text style={styles.carName}>{car.year} {car.make} {car.model}</Text>
                    {car.mileage ? <Text style={styles.carMileage}>{parseFloat(car.mileage).toLocaleString()} miles</Text> : null}
                  </View>
                  {activeCar?.id === car.id && <Text style={styles.checkmark}>✓</Text>}
                </TouchableOpacity>
                {cars.length > 1 && (
                  <TouchableOpacity style={styles.deleteCarBtn} onPress={() => onDelete(car.id)}>
                    <Text style={styles.deleteCarText}>✕</Text>
                  </TouchableOpacity>
                )}
              </View>
            ))}
            <TouchableOpacity style={styles.addCarBtn} onPress={onAdd}>
              <Text style={styles.addCarText}>+ Add Another Vehicle</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </TouchableOpacity>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.7)", justifyContent: "flex-end" },
  content: { backgroundColor: "#161618", borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 24, maxHeight: "70%", borderWidth: 1, borderColor: "#2e2e33" },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 20 },
  title: { color: "#e8e6e0", fontSize: 18, fontWeight: "bold" },
  close: { color: "#888", fontSize: 20 },
  carRow: { flexDirection: "row", alignItems: "center", marginBottom: 8 },
  carOption: { flex: 1, flexDirection: "row", alignItems: "center", backgroundColor: "#1e1e21", borderRadius: 12, padding: 14, borderWidth: 1, borderColor: "#2e2e33", gap: 12 },
  carOptionActive: { borderColor: "#f5a623", backgroundColor: "#f5a62311" },
  carIcon: { fontSize: 20 },
  carInfo: { flex: 1 },
  carName: { color: "#e8e6e0", fontSize: 15, fontWeight: "500" },
  carMileage: { color: "#888", fontSize: 12, marginTop: 2 },
  checkmark: { color: "#f5a623", fontSize: 16, fontWeight: "bold" },
  deleteCarBtn: { width: 36, height: 36, justifyContent: "center", alignItems: "center", marginLeft: 8 },
  deleteCarText: { color: "#888", fontSize: 16 },
  addCarBtn: { backgroundColor: "#1e1e21", borderRadius: 12, padding: 14, alignItems: "center", borderWidth: 1, borderColor: "#2e2e33", borderStyle: "dashed", marginTop: 4 },
  addCarText: { color: "#f5a623", fontSize: 14, fontWeight: "500" },
});