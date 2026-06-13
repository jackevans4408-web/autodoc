import { View, Text, Animated, StyleSheet, Easing } from "react-native";
import { useEffect, useRef } from "react";

export default function LoadingScreen({ onFinish }) {
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const blinkAnim = useRef(new Animated.Value(1)).current;
  const symbolOpacity = useRef(new Animated.Value(0)).current;
  const textOpacity = useRef(new Animated.Value(0)).current;
  const taglineOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 6,
        tension: 40,
        useNativeDriver: true,
      }),
      Animated.delay(600),
      Animated.timing(blinkAnim, {
        toValue: 0.05,
        duration: 150,
        easing: Easing.ease,
        useNativeDriver: true,
      }),
      Animated.timing(blinkAnim, {
        toValue: 1,
        duration: 150,
        easing: Easing.ease,
        useNativeDriver: true,
      }),
      Animated.timing(symbolOpacity, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.parallel([
        Animated.timing(textOpacity, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(taglineOpacity, {
          toValue: 1,
          duration: 700,
          useNativeDriver: true,
        }),
      ]),
      Animated.delay(800),
    ]).start(() => onFinish());
  }, []);

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.eyeContainer, { transform: [{ scale: scaleAnim }] }]}>
        <Animated.Image
          source={require("./assets/eye_open.png")}
          style={[styles.eye, { transform: [{ scaleY: blinkAnim }] }]}
          resizeMode="contain"
        />
        <Animated.Image
          source={require("./assets/eye_symbol.png")}
          style={[styles.symbol, { opacity: symbolOpacity, transform: [{ scaleY: blinkAnim }] }]}
          resizeMode="contain"
        />
      </Animated.View>
      <Animated.Text style={[styles.title, { opacity: textOpacity }]}>
        Engine Eye
      </Animated.Text>
      <Animated.Text style={[styles.tagline, { opacity: taglineOpacity }]}>
        AI Car Diagnostics
      </Animated.Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0d0d0e", alignItems: "center", justifyContent: "center" },
  eyeContainer: { width: 280, height: 280, alignItems: "center", justifyContent: "center" },
  eye: { width: 280, height: 280, position: "absolute" },
  symbol: { width: 280, height: 280, position: "absolute" },
  title: { color: "#f5a623", fontSize: 36, fontWeight: "bold", marginTop: 32, letterSpacing: 2 },
  tagline: { color: "#888", fontSize: 14, marginTop: 8, letterSpacing: 1 },
});