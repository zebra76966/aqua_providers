import React, { useContext, useEffect, useRef, useState } from "react";
import { View, Text, StyleSheet, Animated, TouchableOpacity, ScrollView, ActivityIndicator } from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { baseUrl } from "../config";
import { AuthContext } from "../authcontext";

const DashboardScreen = ({ navigation }) => {
  const { token, activeTankId, logout, permissions } = useContext(AuthContext);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  const [isLoading, setIsLoading] = useState(true);
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  const fetchDashboard = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`${baseUrl}/consultants/dashboard/`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`, // or however you store token
        },
      });

      const json = await response.json();
      console.log("Dashboard data:", json);

      if (!response.ok) {
        setError(json.message || "Failed to load dashboard");
        return;
      }

      setData(json);
    } catch (e) {
      setError("Something went wrong");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();

    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  if (isLoading) {
    return (
      <View style={styles.loaderWrap}>
        <ActivityIndicator size="large" color="#a580e9" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.loaderWrap}>
        <Text style={{ color: "#b00020" }}>{error}</Text>
      </View>
    );
  }
  const dashboard = data?.data;
  const info = dashboard?.consultant_info;
  const overview = dashboard?.overview;
  const revenue = dashboard?.revenue;

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
        {/* Header */}
        <Text style={styles.welcome}>Welcome back 👋</Text>
        <View style={styles.header}>
          <Text style={styles.logo}>{info?.company_name ? `${info.company_name}` : ""}</Text>
          <TouchableOpacity onPress={() => navigation.navigate("Profile")}>
            <Ionicons name="person-circle-outline" size={34} color="#a580e9" />
          </TouchableOpacity>
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{overview?.todays_bookings ?? 0}</Text>
            <Text style={styles.statLabel}>Today</Text>
          </View>

          <View style={styles.statCard}>
            <Text style={styles.statValue}>{overview?.pending_requests ?? 0}</Text>
            <Text style={styles.statLabel}>Pending</Text>
          </View>

          <View style={styles.statCard}>
            <Text style={styles.statValue}>{revenue?.monthly ? `$${revenue.monthly}` : "$0"}</Text>
            <Text style={styles.statLabel}>This Month</Text>
          </View>
        </View>

        {/* Quick Actions */}
        <Text style={styles.sectionTitle}>Quick Actions</Text>

        <View style={styles.actionsGrid}>
          <ActionCard icon={<MaterialCommunityIcons name="briefcase-outline" size={28} color="#a580e9" />} label="Services" onPress={() => navigation.navigate("Services")} />
          <ActionCard icon={<Ionicons name="calendar-outline" size={28} color="#a580e9" />} label="Calendar" onPress={() => navigation.navigate("Calendar")} />
          <ActionCard icon={<Ionicons name="list-outline" size={28} color="#a580e9" />} label="Bookings" onPress={() => navigation.navigate("Bookings")} />
          <ActionCard icon={<Ionicons name="settings-outline" size={28} color="#a580e9" />} label="Profile" onPress={() => navigation.navigate("Profile")} />
        </View>
      </Animated.View>
    </ScrollView>
  );
};

const ActionCard = ({ icon, label, onPress }) => (
  <TouchableOpacity style={styles.actionCard} onPress={onPress} activeOpacity={0.8}>
    {icon}
    <Text style={styles.actionLabel}>{label}</Text>
  </TouchableOpacity>
);

export default DashboardScreen;

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: "#ffffff",
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 30,
  },
  loaderWrap: {
    flex: 1,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  logo: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#a580e9",
  },
  welcome: {
    fontSize: 18,
    color: "#333",
    marginBottom: 10,
  },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 30,
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
    fontSize: 20,
    fontWeight: "bold",
    color: "#a580e9",
  },
  statLabel: {
    fontSize: 12,
    color: "#666",
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 12,
  },
  actionsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  actionCard: {
    width: "48%",
    backgroundColor: "#ffffff",
    borderRadius: 14,
    paddingVertical: 22,
    marginBottom: 14,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#eee",
  },
  actionLabel: {
    marginTop: 8,
    fontSize: 14,
    color: "#333",
    fontWeight: "500",
  },
});
