import { Modal, View, Text, TouchableOpacity, StyleSheet, useWindowDimensions } from "react-native";
import { useEffect, useState } from "react";
import { TUTORIAL_STEPS } from "./tutorialSteps";
import { padHole, placeCard } from "./tutorialLayout";

const CARD_WIDTH = 320;
const CARD_HEIGHT = 210; // an estimate used only to decide above or below the highlight
const DIM = "rgba(0,0,0,0.78)";
const ORANGE = "#f5a623";

// `targets` maps a step's target name to a React ref of the element to highlight.
// If an element cannot be measured the step simply shows a centred card, so the tour can never get stuck.
export default function Tutorial({ visible, targets, onFinish }) {
  const screen = useWindowDimensions();
  const [index, setIndex] = useState(0);
  const [hole, setHole] = useState(null);

  const step = TUTORIAL_STEPS[index];
  const last = index === TUTORIAL_STEPS.length - 1;

  useEffect(() => {
    if (visible) setIndex(0);
  }, [visible]);

  useEffect(() => {
    if (!visible) return undefined;
    setHole(null);
    const ref = step.target ? targets?.[step.target]?.current : null;
    if (!ref || typeof ref.measureInWindow !== "function") return undefined;
    // Wait a beat so the screen underneath has finished laying out.
    const timer = setTimeout(() => {
      try {
        ref.measureInWindow((x, y, width, height) => setHole(padHole({ x, y, width, height }, screen)));
      } catch (e) {
        setHole(null);
      }
    }, 120);
    return () => clearTimeout(timer);
  }, [visible, index]);

  if (!visible) return null;

  const card = { width: Math.min(CARD_WIDTH, screen.width - 32), height: CARD_HEIGHT };
  const pos = placeCard({ hole, screen, card });

  return (
    <Modal visible transparent animationType="fade" statusBarTranslucent onRequestClose={() => onFinish()}>
      <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
        {hole ? (
          <>
            <View style={[styles.dim, { top: 0, left: 0, right: 0, height: hole.y }]} />
            <View style={[styles.dim, { top: hole.y + hole.height, left: 0, right: 0, bottom: 0 }]} />
            <View style={[styles.dim, { top: hole.y, left: 0, width: hole.x, height: hole.height }]} />
            <View style={[styles.dim, { top: hole.y, left: hole.x + hole.width, right: 0, height: hole.height }]} />
            <View pointerEvents="none" style={[styles.ring, { top: hole.y, left: hole.x, width: hole.width, height: hole.height }]} />
          </>
        ) : (
          <View style={[styles.dim, StyleSheet.absoluteFill]} />
        )}

        <View
          style={[styles.card, { width: card.width, top: pos.top, left: pos.left }]}
          accessibilityViewIsModal
        >
          <Text style={styles.title}>{step.title}</Text>
          <Text style={styles.text}>{step.text}</Text>

          <View style={styles.dots}>
            {TUTORIAL_STEPS.map((s, i) => (
              <View key={s.id} style={[styles.dot, i === index && styles.dotActive]} />
            ))}
          </View>

          <View style={styles.buttons}>
            {last ? (
              <View />
            ) : (
              <TouchableOpacity onPress={() => onFinish()} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }} accessibilityRole="button" accessibilityLabel="Skip the tour">
                <Text style={styles.skip}>Skip</Text>
              </TouchableOpacity>
            )}
            <View style={styles.right}>
              {index > 0 && !last ? (
                <TouchableOpacity onPress={() => setIndex(index - 1)} style={styles.backBtn} accessibilityRole="button">
                  <Text style={styles.backText}>Back</Text>
                </TouchableOpacity>
              ) : null}
              <TouchableOpacity
                style={styles.nextBtn}
                onPress={() => (last ? onFinish() : setIndex(index + 1))}
                accessibilityRole="button"
              >
                <Text style={styles.nextText}>{last ? "Get started" : index === 0 ? "Start tour" : "Next"}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  dim: { position: "absolute", backgroundColor: DIM },
  ring: { position: "absolute", borderWidth: 2, borderColor: ORANGE, borderRadius: 12 },
  card: { position: "absolute", backgroundColor: "#161618", borderRadius: 16, borderWidth: 1, borderColor: "#2e2e33", padding: 18 },
  title: { color: "#e8e6e0", fontSize: 18, fontWeight: "700", marginBottom: 6 },
  text: { color: "#bdbdbd", fontSize: 14, lineHeight: 20 },
  dots: { flexDirection: "row", gap: 6, marginTop: 14, marginBottom: 14 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: "#3a3a3f" },
  dotActive: { backgroundColor: ORANGE, width: 16 },
  buttons: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  right: { flexDirection: "row", alignItems: "center", gap: 8 },
  skip: { color: "#888", fontSize: 14, paddingVertical: 8 },
  backBtn: { paddingVertical: 10, paddingHorizontal: 12 },
  backText: { color: "#e8e6e0", fontSize: 14 },
  nextBtn: { backgroundColor: ORANGE, borderRadius: 10, paddingVertical: 10, paddingHorizontal: 18 },
  nextText: { color: "#0d0d0e", fontSize: 14, fontWeight: "700" },
});
