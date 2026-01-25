import React, { useEffect, useRef, useState, useContext } from "react";
import { View, Text, StyleSheet, Animated, TouchableOpacity, ScrollView, ActivityIndicator } from "react-native";
import { Ionicons, MaterialCommunityIcons, Feather } from "@expo/vector-icons";
import { baseUrl } from "../../../config";
import { AuthContext } from "../../../authcontext";

const BreederDashboardScreen = ({ navigation }) => {
  const { token } = useContext(AuthContext);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  const [loading, setLoading] = useState(true);
  const [pendingCount, setPendingCount] = useState(0);
  const [speciesCount, setSpeciesCount] = useState(0);
  const [isAvailable, setIsAvailable] = useState(true);

  const fetchOverview = async () => {
    try {
      setLoading(true);

      const [inqRes, profileRes, availRes] = await Promise.all([
        fetch(`${baseUrl}/breeders/inquiries/?status=pending`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${baseUrl}/breeders/profile/`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${baseUrl}/breeders/availability/`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      const inqJson = await inqRes.json().catch(() => null);
      const profileJson = await profileRes.json().catch(() => null);
      const availJson = await availRes.json().catch(() => null);

      setPendingCount((inqJson?.data || []).length);
      setSpeciesCount((profileJson?.data?.species || []).length);

      // Very simple availability heuristic:
      const today = new Date().toISOString().split("T")[0];
      const blockedToday = (availJson?.data || []).some((slot) => slot.start_time?.startsWith(today));

      setIsAvailable(!blockedToday);
    } catch (e) {
      console.log("Breeder dashboard fetch error", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOverview();

    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 500,
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

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.welcome}>Breeder Hub</Text>
          <Ionicons name="fish-outline" size={28} color="#a580e9" />
        </View>

        <Text style={styles.subtitle}>Manage your availability, inquiries, and growth.</Text>

        <View style={styles.statsRow}>
          <StatCard label="Inquiries" value={pendingCount} />
          <StatCard label="Species" value={speciesCount} />
          <StatCard label="Today" value={isAvailable ? "Open" : "Blocked"} />
        </View>

        {/* Action Grid */}
        <View style={styles.grid}>
          {/* <ActionCard icon={<Ionicons name="calendar-outline" size={28} color="#a580e9" />} title="Availability" desc="Set or block days" onPress={() => navigation.navigate("BreederAvailability")} /> */}

          {/* <ActionCard icon={<Ionicons name="mail-unread-outline" size={28} color="#a580e9" />} title="Inquiries" desc="View & respond" onPress={() => navigation.navigate("BreederInquiries")} /> */}

          <ActionCard icon={<MaterialCommunityIcons name="shield-star-outline" size={28} color="#a580e9" />} title="Badges" desc="Your achievements" onPress={() => navigation.navigate("Badges")} />

          <ActionCard icon={<Feather name="gift" size={28} color="#a580e9" />} title="Rewards" desc="Unlock benefits" onPress={() => navigation.navigate("Rewards")} />

          <ActionCard icon={<Ionicons name="settings-outline" size={28} color="#a580e9" />} title="Settings" desc="Preferences & privacy" onPress={() => navigation.navigate("Settings")} />
        </View>
      </Animated.View>
    </ScrollView>
  );
};

const StatCard = ({ label, value }) => (
  <View style={styles.statCard}>
    <Text style={styles.statValue}>{value}</Text>
    <Text style={styles.statLabel}>{label}</Text>
  </View>
);

const ActionCard = ({ icon, title, desc, onPress }) => (
  <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.85}>
    {icon}
    <Text style={styles.cardTitle}>{title}</Text>
    <Text style={styles.cardDesc}>{desc}</Text>
  </TouchableOpacity>
);

export default BreederDashboardScreen;

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: "#ffffff",
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 40,
  },
  loaderWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  welcome: {
    fontSize: 20,
    fontWeight: "700",
    color: "#333",
  },
  subtitle: {
    fontSize: 13,
    color: "#666",
    marginBottom: 20,
  },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 24,
  },
  statCard: {
    width: "30%",
    backgroundColor: "#faf7ff",
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#e7dbff",
  },
  statValue: {
    fontSize: 18,
    fontWeight: "700",
    color: "#a580e9",
  },
  statLabel: {
    marginTop: 4,
    fontSize: 12,
    color: "#666",
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  card: {
    width: "48%",
    backgroundColor: "#faf7ff",
    borderRadius: 16,
    paddingVertical: 22,
    paddingHorizontal: 12,
    marginBottom: 14,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#e7dbff",
  },
  cardTitle: {
    marginTop: 10,
    fontSize: 15,
    fontWeight: "700",
    color: "#333",
  },
  cardDesc: {
    marginTop: 4,
    fontSize: 12,
    color: "#777",
    textAlign: "center",
  },
});
