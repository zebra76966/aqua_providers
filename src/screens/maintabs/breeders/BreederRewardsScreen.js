// BreederRewardsScreen.js
import React, { useContext, useEffect, useRef, useState } from "react";
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, Animated, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { AuthContext } from "../../../authcontext";
import { baseUrl } from "../../../config";

const tierColors = {
  bronze: "#CD7F32",
  silver: "#B0BEC5",
  gold: "#FFD700",
  platinum: "#8E24AA",
};

const BreederRewardsScreen = ({ navigation }) => {
  const { token } = useContext(AuthContext);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  const fetchRewards = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${baseUrl}/breeders/rewards/`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const json = await res.json();

      if (!res.ok) {
        setError(json.message || "Failed to load rewards");
        return;
      }

      setData(json.data);
    } catch {
      setError("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRewards();

    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 400,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  if (loading) {
    return (
      <View style={styles.loaderWrap}>
        <ActivityIndicator size="large" color="#a580e9" />
      </View>
    );
  }

  if (error || !data) {
    return (
      <View style={styles.loaderWrap}>
        <Text style={{ color: "#b00020" }}>{error || "No data"}</Text>
      </View>
    );
  }

  const tierColor = tierColors[data.current_tier] || "#a580e9";

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="chevron-back" size={28} color="#a580e9" />
          </TouchableOpacity>
          <Text style={styles.title}>Rewards</Text>
        </View>

        {/* Tier Card */}
        <View style={[styles.tierCard, { borderColor: tierColor }]}>
          <Text style={[styles.tierLabel, { color: tierColor }]}>Current Tier</Text>
          <Text style={[styles.tierName, { color: tierColor }]}>{data.current_tier.toUpperCase()}</Text>
          <Text style={styles.points}>{data.points} points</Text>

          {data.next_tier && <Text style={styles.nextTier}>Next: {data.next_tier.next_tier.toUpperCase()}</Text>}

          {data.next_tier && (
            <View style={styles.progressWrap}>
              <View style={styles.progressTrack}>
                <Animated.View
                  style={[
                    styles.progressFill,
                    {
                      backgroundColor: tierColor,
                      width: `${Math.min(100, Math.max(10, data.points))}%`,
                    },
                  ]}
                />
              </View>
              <Text style={styles.progressHint}>Progress to {data.next_tier.next_tier}</Text>
            </View>
          )}
        </View>

        {/* Metrics */}
        <Text style={styles.sectionTitle}>Your Performance</Text>
        <View style={styles.metricsGrid}>
          <Metric label="Response Rate" value={`${data.metrics.response_rate}%`} />
          <Metric label="Avg Response" value={`${data.metrics.avg_response_hours}h`} />
          <Metric label="Rating" value={data.metrics.rating || "-"} />
          <Metric label="Reviews" value={data.metrics.reviews_count} />
          <Metric label="Species" value={data.metrics.species_count} />
        </View>

        {/* Benefits */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Current Benefits</Text>
          <Text style={styles.cardDesc}>{data.rewards.description}</Text>

          {data.rewards.features.map((f, i) => (
            <View key={i} style={styles.featureRow}>
              <Ionicons name="checkmark-circle" size={16} color="#4CAF50" />
              <Text style={styles.featureText}>{f}</Text>
            </View>
          ))}
        </View>

        {/* Next Tier Requirements */}
        {data.next_tier && (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Next Tier Requirements</Text>

            {Object.entries(data.next_tier.requirements).map(([k, v]) => (
              <View key={k} style={styles.reqRow}>
                <Text style={styles.reqKey}>{k.replace(/_/g, " ")}</Text>
                <Text style={styles.reqVal}>{v}</Text>
              </View>
            ))}
          </View>
        )}
      </Animated.View>
    </ScrollView>
  );
};

const Metric = ({ label, value }) => {
  const iconMap = {
    "Response Rate": "flash-outline",
    "Avg Response": "time-outline",
    Rating: "star-outline",
    Reviews: "chatbubble-outline",
    Species: "fish-outline",
  };

  return (
    <View style={styles.metricCard}>
      <Ionicons name={iconMap[label] || "stats-chart-outline"} size={18} color="#a580e9" />
      <Text style={styles.metricVal}>{value}</Text>
      <Text style={styles.metricLabel}>{label}</Text>
    </View>
  );
};

export default BreederRewardsScreen;

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: "#fff",
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 150,
  },
  loaderWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    color: "#333",
  },
  tierCard: {
    borderWidth: 1,
    borderRadius: 18,
    padding: 18,
    alignItems: "center",
    marginBottom: 20,
    backgroundColor: "#faf7ff",
  },
  tierLabel: {
    fontSize: 12,
    fontWeight: "600",
  },
  tierName: {
    fontSize: 28,
    fontWeight: "800",
    marginTop: 4,
  },
  points: {
    marginTop: 4,
    fontSize: 13,
    color: "#666",
  },
  nextTier: {
    marginTop: 6,
    fontSize: 12,
    color: "#777",
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#333",
    marginBottom: 10,
  },
  metricsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  metricCard: {
    width: "48%",
    backgroundColor: "#faf7ff",
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#e7dbff",
  },
  metricVal: {
    fontSize: 16,
    fontWeight: "800",
    color: "#333",
  },
  metricLabel: {
    marginTop: 2,
    fontSize: 11,
    color: "#777",
  },
  card: {
    backgroundColor: "#faf7ff",
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: "#e7dbff",
    marginBottom: 16,
  },
  cardDesc: {
    fontSize: 12,
    color: "#666",
    marginBottom: 8,
  },
  featureRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 6,
  },
  featureText: {
    fontSize: 12,
    color: "#444",
  },
  reqRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  reqKey: {
    fontSize: 12,
    color: "#666",
  },
  reqVal: {
    fontSize: 12,
    fontWeight: "700",
    color: "#333",
  },
  progressWrap: {
    width: "100%",
    marginTop: 10,
    alignItems: "center",
  },
  progressTrack: {
    width: "100%",
    height: 6,
    borderRadius: 6,
    backgroundColor: "#eee",
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 6,
  },
  progressHint: {
    marginTop: 6,
    fontSize: 11,
    color: "#777",
  },
  metricCard: {
    width: "48%",
    backgroundColor: "#faf7ff",
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#e7dbff",
    gap: 4,
  },
  tierCard: {
    borderWidth: 1,
    borderRadius: 18,
    padding: 18,
    alignItems: "center",
    marginBottom: 20,
    backgroundColor: "#faf7ff",
    shadowColor: "#a580e9",
    shadowOpacity: 0.15,
    shadowRadius: 14,
    elevation: 6,
  },
});
