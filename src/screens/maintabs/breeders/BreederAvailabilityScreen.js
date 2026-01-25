// BreederAvailabilityScreen.js
import React, { useContext, useEffect, useRef, useState } from "react";
import { View, Text, StyleSheet, Animated, TouchableOpacity, ActivityIndicator, Alert } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { AuthContext } from "../../../authcontext";
import { baseUrl } from "../../../config";

const BreederAvailabilityScreen = ({ navigation }) => {
  const { token } = useContext(AuthContext);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  const [loading, setLoading] = useState(true);
  const [todayStatus, setTodayStatus] = useState(null); // "available" | "blocked"

  const fetchAvailability = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${baseUrl}/breeders/availability/`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      console.log("json", res);

      const json = await res.json();

      if (!res.ok) throw new Error(json.message || "Failed");

      // Assume API returns something like { today: "available" | "blocked" }
      setTodayStatus(json?.data?.today || "blocked");
    } catch (e) {
      Alert.alert("Error", "Failed to load availability");
    } finally {
      setLoading(false);
    }
  };

  const setAvailableToday = async () => {
    try {
      const now = new Date();
      const start = new Date(now.setHours(9, 0, 0, 0)).toISOString();
      const end = new Date(now.setHours(17, 0, 0, 0)).toISOString();

      const res = await fetch(`${baseUrl}/breeders/availability/update/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          action: "set_available",
          start_time: start,
          end_time: end,
          notes: "Available today",
        }),
      });

      if (!res.ok) throw new Error();

      setTodayStatus("available");
    } catch {
      Alert.alert("Error", "Could not update availability");
    }
  };

  const blockToday = async () => {
    try {
      const now = new Date();
      const start = new Date(now.setHours(0, 0, 0, 0)).toISOString();
      const end = new Date(now.setHours(23, 59, 59, 0)).toISOString();

      const res = await fetch(`${baseUrl}/breeders/availability/block/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          start_time: start,
          end_time: end,
          reason: "Unavailable today",
        }),
      });

      if (!res.ok) throw new Error();

      setTodayStatus("blocked");
    } catch {
      Alert.alert("Error", "Could not block today");
    }
  };

  useEffect(() => {
    fetchAvailability();

    Animated.parallel([Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }), Animated.timing(slideAnim, { toValue: 0, duration: 400, useNativeDriver: true })]).start();
  }, []);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#a580e9" />
      </View>
    );
  }

  const isOpen = todayStatus === "available";

  return (
    <View style={styles.container}>
      <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="chevron-back" size={28} color="#a580e9" />
          </TouchableOpacity>
          <Text style={styles.title}>Availability</Text>
        </View>

        <View style={styles.statusCard}>
          <Ionicons name={isOpen ? "checkmark-circle-outline" : "close-circle-outline"} size={48} color={isOpen ? "#4caf50" : "#f44336"} />
          <Text style={styles.statusTitle}>{isOpen ? "You are Open Today" : "You are Blocked Today"}</Text>
          <Text style={styles.statusDesc}>{isOpen ? "Customers can reach you today." : "You are unavailable today."}</Text>
        </View>

        <View style={styles.actions}>
          {!isOpen ? (
            <TouchableOpacity style={styles.primaryBtn} onPress={setAvailableToday}>
              <Text style={styles.primaryText}>Set Available Today</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={styles.outlineBtn} onPress={blockToday}>
              <Text style={styles.outlineText}>Block Today</Text>
            </TouchableOpacity>
          )}
        </View>
      </Animated.View>
    </View>
  );
};

export default BreederAvailabilityScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    color: "#333",
  },
  statusCard: {
    backgroundColor: "#faf7ff",
    borderRadius: 18,
    padding: 24,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#e7dbff",
  },
  statusTitle: {
    marginTop: 12,
    fontSize: 18,
    fontWeight: "700",
    color: "#333",
  },
  statusDesc: {
    marginTop: 6,
    fontSize: 13,
    color: "#666",
    textAlign: "center",
  },
  actions: {
    marginTop: 24,
  },
  primaryBtn: {
    backgroundColor: "#a580e9",
    padding: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  primaryText: {
    color: "#004d40",
    fontWeight: "700",
  },
  outlineBtn: {
    borderWidth: 1,
    borderColor: "#a580e9",
    padding: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  outlineText: {
    color: "#a580e9",
    fontWeight: "700",
  },
});
