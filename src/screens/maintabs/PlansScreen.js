import React, { useEffect, useRef, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Animated, Easing, ScrollView, SafeAreaView } from "react-native";
import { Ionicons } from "@expo/vector-icons";

const PLANS = [
  {
    key: "free",
    name: "Basic",
    price: "Free",
    accent: "#B0BEC5",
    features: ["Basic tank creation & management", "Up to 5 tanks"],
    locked: ["AI assistance", "Disease detection", "Marketplace selling", "Consultation booking", "AI recommendations"],
  },
  {
    key: "premium",
    name: "Premium",
    price: "£5.99 / mo",
    accent: "#a580e9",
    features: ["Unlimited tanks", "AI assistance", "Disease detection", "AI recommendations"],
    locked: ["Priority support"],
  },
  {
    key: "elite",
    name: "Elite",
    price: "£8.99 / mo",
    accent: "#FFD700",
    features: ["Unlimited tanks", "Full AI suite", "Disease detection", "Marketplace selling", "Consultation booking", "AI recommendations", "Priority support"],
    locked: [],
    highlight: true,
  },
];

export default function PlansScreen() {
  const pulse = useRef(new Animated.Value(0)).current;
  const [selected, setSelected] = useState("elite");

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1,
          duration: 1400,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 0,
          duration: 1400,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>Choose Your Plan</Text>
        <Text style={styles.subtitle}>Unlock AI, insights, and marketplace power.</Text>

        {PLANS.map((plan) => {
          const isActive = selected === plan.key;

          return (
            <TouchableOpacity key={plan.key} activeOpacity={0.9} onPress={() => setSelected(plan.key)}>
              <Animated.View
                style={[
                  styles.card,
                  {
                    borderColor: plan.accent,
                    transform: plan.highlight
                      ? [
                          {
                            scale: pulse.interpolate({
                              inputRange: [0, 1],
                              outputRange: [1, 1.03],
                            }),
                          },
                        ]
                      : [],
                    backgroundColor: isActive ? "#fff" : "#FAFAFA",
                  },
                ]}
              >
                {plan.highlight && (
                  <View style={[styles.ribbon, { backgroundColor: plan.accent }]}>
                    <Text style={styles.ribbonText}>BEST VALUE</Text>
                  </View>
                )}

                <View style={styles.cardHeader}>
                  <Text style={styles.planName}>{plan.name}</Text>
                  <Text style={[styles.price, { color: plan.accent }]}>{plan.price}</Text>
                </View>

                {plan.features.map((f, i) => (
                  <View key={i} style={styles.row}>
                    <Ionicons name="checkmark-circle" size={18} color={plan.accent} />
                    <Text style={styles.rowText}>{f}</Text>
                  </View>
                ))}

                {plan.locked.map((f, i) => (
                  <View key={i} style={styles.rowMuted}>
                    <Ionicons name="close-circle-outline" size={18} color="#bbb" />
                    <Text style={styles.rowMutedText}>{f}</Text>
                  </View>
                ))}

                {isActive && (
                  <View style={[styles.activeBadge, { borderColor: plan.accent }]}>
                    <Text style={[styles.activeText, { color: plan.accent }]}>Selected</Text>
                  </View>
                )}
              </Animated.View>
            </TouchableOpacity>
          );
        })}

        <TouchableOpacity style={styles.cta}>
          <Text style={styles.ctaText}>Upgrade Now</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#F8F8F8" },

  container: {
    padding: 20,
    paddingTop: 60,
    paddingBottom: 100,
  },
  title: {
    fontSize: 26,
    fontWeight: "800",
    marginBottom: 6,
  },
  subtitle: {
    color: "#666",
    marginBottom: 20,
  },
  card: {
    borderWidth: 2,
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 4,
    overflow: "hidden",
  },
  ribbon: {
    position: "absolute",
    top: 0,
    right: 0,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderBottomLeftRadius: 12,
  },
  ribbonText: {
    color: "#000",
    fontSize: 10,
    fontWeight: "800",
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "baseline",
    marginBottom: 10,
  },
  planName: {
    fontSize: 18,
    fontWeight: "800",
  },
  price: {
    fontSize: 16,
    fontWeight: "700",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 6,
  },
  rowText: {
    fontSize: 13,
  },
  rowMuted: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 6,
    opacity: 0.5,
  },
  rowMutedText: {
    fontSize: 13,
    color: "#777",
  },
  activeBadge: {
    alignSelf: "flex-start",
    marginTop: 8,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 20,
  },
  activeText: {
    fontSize: 11,
    fontWeight: "700",
  },
  cta: {
    backgroundColor: "#000",
    padding: 16,
    borderRadius: 14,
    alignItems: "center",
    marginTop: 10,
  },
  ctaText: {
    color: "#fff",
    fontWeight: "800",
    letterSpacing: 0.3,
  },
});
