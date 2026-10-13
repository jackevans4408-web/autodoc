import { View, Text, Animated, Easing, StyleSheet, AccessibilityInfo, ActivityIndicator } from "react-native";
import { useEffect, useRef, useState } from "react";
import Svg, { Path, Circle } from "react-native-svg";
import { CAR, GEAR } from "./loadingShapes";

const ORANGE = "#f5a623";
// Everything is drawn in the shapes' own units and scaled down by SCALE. Line widths are in those units too, so they are
// set heavier than they look (3 units is about 1.5 pixels at half size).
const SCALE = 0.5;
const STROKE = 3;
const HUB_STROKE = 2.5;
const GEAR_PX = GEAR.size * SCALE;
const CAR_W = CAR.width * SCALE;
const CAR_H = CAR.height * SCALE;
const TRACK_HEIGHT = 34;

// Shown while a diagnosis is loading (up to about 30 seconds). A gear spins, slides to the right, and turns into a car.
// With "Reduce Motion" turned on in iOS settings it falls back to a plain spinner.
export default function DiagnosingIndicator() {
  const [width, setWidth] = useState(260);
  const [reduceMotion, setReduceMotion] = useState(false);

  const spin = useRef(new Animated.Value(0)).current; // gear rotation, 0 to 1 = one turn
  const fade = useRef(new Animated.Value(0)).current; // whole animation fading in and out between cycles
  const move = useRef(new Animated.Value(0)).current; // gear travelling toward the right
  const morph = useRef(new Animated.Value(0)).current; // gear turning into the car

  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(setReduceMotion).catch(() => {});
  }, []);

  useEffect(() => {
    if (reduceMotion) return undefined;
    const t = (value, toValue, duration, easing = Easing.inOut(Easing.ease)) =>
      Animated.timing(value, { toValue, duration, easing, useNativeDriver: true });

    const spinLoop = Animated.loop(t(spin, 1, 1400, Easing.linear));
    const cycle = Animated.loop(
      Animated.sequence([
        t(fade, 1, 250),
        Animated.delay(700), // gear spins on the spot
        t(move, 1, 1600), // ...then travels to the side
        t(morph, 1, 600), // ...and becomes a car
        Animated.delay(1400), // the car stays in view for a moment
        t(fade, 0, 300),
        t(move, 0, 0), // reset for the next round while invisible
        t(morph, 0, 0),
      ])
    );
    spinLoop.start();
    cycle.start();
    return () => {
      spinLoop.stop();
      cycle.stop();
    };
  }, [reduceMotion]);

  // The car sits at the right edge; the gear stops in the middle of where the car will appear.
  const travel = Math.max(width - CAR_W + (CAR_W - GEAR_PX) / 2, 0);
  const gearOpacity = Animated.multiply(fade, Animated.subtract(1, morph));
  const carOpacity = Animated.multiply(fade, morph);

  return (
    <View
      style={styles.box}
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel="Engine Eye is working on your diagnosis. Please wait, this can take up to 30 seconds."
    >
      <Text style={styles.title}>Please wait as we load…</Text>
      <Text style={styles.hint}>This can take up to 30 seconds.</Text>

      {reduceMotion ? (
        <ActivityIndicator color={ORANGE} style={{ marginTop: 12 }} />
      ) : (
        <View style={styles.track} onLayout={(e) => setWidth(e.nativeEvent.layout.width)}>
          <Animated.View
            style={[
              styles.gear,
              {
                opacity: gearOpacity,
                transform: [
                  { translateX: move.interpolate({ inputRange: [0, 1], outputRange: [0, travel] }) },
                  { scale: morph.interpolate({ inputRange: [0, 1], outputRange: [1, 0.6] }) },
                  { rotate: spin.interpolate({ inputRange: [0, 1], outputRange: ["0deg", "360deg"] }) },
                ],
              },
            ]}
          >
            <Svg width={GEAR_PX} height={GEAR_PX} viewBox={`0 0 ${GEAR.size} ${GEAR.size}`}>
              <Path d={GEAR.path} fill="none" stroke={ORANGE} strokeWidth={STROKE} strokeLinejoin="round" />
            </Svg>
          </Animated.View>

          <Animated.View
            style={[
              styles.car,
              {
                opacity: carOpacity,
                transform: [
                  { translateX: morph.interpolate({ inputRange: [0, 1], outputRange: [-8, 0] }) },
                  { scale: morph.interpolate({ inputRange: [0, 1], outputRange: [0.7, 1] }) },
                ],
              },
            ]}
          >
            <Svg width={CAR_W} height={CAR_H} viewBox={`0 0 ${CAR.width} ${CAR.height}`}>
              <Path d={CAR.body} fill="none" stroke={ORANGE} strokeWidth={STROKE} strokeLinejoin="round" strokeLinecap="round" />
              {CAR.windows.map((d) => (
                <Path key={d} d={d} fill="none" stroke={ORANGE} strokeWidth={STROKE} strokeLinejoin="round" />
              ))}
              {CAR.wheels.map((w) => (
                <Circle key={`w${w.cx}`} cx={w.cx} cy={w.cy} r={w.r} fill="#0d0d0e" stroke={ORANGE} strokeWidth={STROKE} />
              ))}
              {CAR.wheels.map((w) => (
                <Circle key={`h${w.cx}`} cx={w.cx} cy={w.cy} r={2} fill="none" stroke={ORANGE} strokeWidth={HUB_STROKE} />
              ))}
            </Svg>
          </Animated.View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  box: { marginHorizontal: 20, marginVertical: 12 },
  title: { color: "#e8e6e0", fontSize: 15, fontWeight: "600" },
  hint: { color: "#888", fontSize: 12, marginTop: 2 },
  track: { height: TRACK_HEIGHT, marginTop: 8, justifyContent: "center" },
  gear: { position: "absolute", left: 0, top: (TRACK_HEIGHT - GEAR_PX) / 2 },
  car: { position: "absolute", right: 0, top: (TRACK_HEIGHT - CAR_H) / 2 },
});
