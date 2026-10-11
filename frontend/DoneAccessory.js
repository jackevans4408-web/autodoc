import { View, Text, TouchableOpacity, Keyboard, Platform, StyleSheet, InputAccessoryView } from "react-native";

// The iPhone number keyboard has no Return key, so there is nothing to press to put it away. This adds a "Done" bar above it.
// Give number fields `inputAccessoryViewID={DONE_ROOT}` (or DONE_MODAL inside a Modal) and mount <DoneAccessory id=... />
// once in the same place. Two ids because a Modal and the screen behind it can be on screen at the same time.
export const DONE_ROOT = "doneBarRoot";
export const DONE_MODAL = "doneBarModal";

export default function DoneAccessory({ id }) {
  if (Platform.OS !== "ios") return null;
  return (
    <InputAccessoryView nativeID={id}>
      <View style={styles.bar}>
        <TouchableOpacity onPress={() => Keyboard.dismiss()} hitSlop={{ top: 10, bottom: 10, left: 20, right: 20 }}>
          <Text style={styles.done}>Done</Text>
        </TouchableOpacity>
      </View>
    </InputAccessoryView>
  );
}

const styles = StyleSheet.create({
  bar: { backgroundColor: "#1e1e21", borderTopWidth: 1, borderTopColor: "#2e2e33", paddingHorizontal: 16, paddingVertical: 10, flexDirection: "row", justifyContent: "flex-end" },
  done: { color: "#f5a623", fontSize: 17, fontWeight: "600" },
});
