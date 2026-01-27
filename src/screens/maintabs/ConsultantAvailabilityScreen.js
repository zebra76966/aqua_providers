// ConsultantAvailabilityScreen.js
import React, { useContext, useEffect, useRef, useState } from "react";
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity, Animated, Alert } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { AuthContext } from "../../authcontext";
import { baseUrl } from "../../config";

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

const ConsultantAvailabilityScreen = ({ navigation }) => {
  const { token } = useContext(AuthContext);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  const [loading, setLoading] = useState(true);
  const [weekly, setWeekly] = useState({});
  const [blocked, setBlocked] = useState([]);
  const [error, setError] = useState("");

  const fetchAvailability = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${baseUrl}/consultants/availability/me/`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const json = await res.json();

      if (!res.ok) {
        setError(json.message || "Failed to load availability");
        return;
      }

      const slots = json.data.slots || [];

      console.log("availability", slots);

      const weeklyMap = {};
      const blockedArr = [];

      slots.forEach((s) => {
        if (s.type === "recurring" && s.status === "available") {
          // backend sends 1–7, UI expects 0–6
          const d = s.day_of_week - 1;

          if (!weeklyMap[d]) weeklyMap[d] = [];
          weeklyMap[d].push(s);
        } else {
          blockedArr.push(s);
        }
      });

      setWeekly(weeklyMap);
      setBlocked(blockedArr);
    } catch {
      setError("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAvailability();

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

  const confirmDelete = (slotId) => {
    Alert.alert("Delete Slot", "Remove this availability slot?", [
      { text: "Cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => deleteSlot(slotId),
      },
    ]);
  };

  const deleteSlot = async (id) => {
    try {
      await fetch(`${baseUrl}/consultants/availability/${id}/delete/`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchAvailability();
    } catch {
      Alert.alert("Error", "Failed to delete slot");
    }
  };

  const confirmUnblock = (id) => {
    Alert.alert("Unblock Time", "Unblock this time range?", [
      { text: "Cancel" },
      {
        text: "Unblock",
        onPress: () => unblockSlot(id),
      },
    ]);
  };

  const unblockSlot = async (id) => {
    try {
      await fetch(`${baseUrl}/consultants/availability/unblock/${id}/`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchAvailability();
    } catch {
      Alert.alert("Error", "Failed to unblock");
    }
  };

  if (loading) {
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

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="chevron-back" size={28} color="#a580e9" />
          </TouchableOpacity>
          <Text style={styles.title}>Your Availability</Text>
        </View>

        <Text style={styles.subtitle}>Manage your weekly hours and blocked dates.</Text>

        {/* Weekly */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Weekly Schedule</Text>

          {DAYS.map((d, idx) => {
            const slots = weekly[idx] || [];
            return (
              <View key={idx} style={styles.dayRow}>
                <Text style={styles.dayLabel}>{d}</Text>

                {slots.length === 0 ? (
                  <Text style={styles.emptySlot}>Not available</Text>
                ) : (
                  slots.map((s) => (
                    <View key={s.id} style={styles.slotPill}>
                      <Text style={styles.slotText}>
                        {s.start_time.slice(0, 5)} – {s.end_time.slice(0, 5)}
                      </Text>

                      <TouchableOpacity onPress={() => confirmDelete(s.id)}>
                        <Ionicons name="close-circle" size={16} color="#a580e9" />
                      </TouchableOpacity>
                    </View>
                  ))
                )}
              </View>
            );
          })}

          <TouchableOpacity style={styles.actionBtn} onPress={() => navigation.navigate("SetWeeklyAvailability")}>
            <Ionicons name="time-outline" size={18} color="#004d40" />
            <Text style={styles.actionText}>Set Weekly Availability</Text>
          </TouchableOpacity>
        </View>

        {/* Blocked */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Blocked Time</Text>

          {blocked.length === 0 ? (
            <Text style={styles.emptyBlock}>No blocked dates</Text>
          ) : (
            blocked.map((b) => (
              <View key={b.id} style={styles.blockCard}>
                <Text style={styles.blockRange}>
                  {b.day_name}
                  {b.date ? `, ${b.date}` : ""}
                </Text>

                <Text style={styles.blockTime}>
                  {b.start_time.slice(0, 5)} → {b.end_time.slice(0, 5)} · {b.type}
                </Text>

                {!!b.block_reason && <Text style={styles.blockReason}>{b.block_reason}</Text>}

                <TouchableOpacity onPress={() => confirmUnblock(b.id)}>
                  <Ionicons name="lock-open-outline" size={20} color="#a580e9" />
                </TouchableOpacity>
              </View>
            ))
          )}

          <TouchableOpacity style={styles.actionBtn} onPress={() => navigation.navigate("BlockTime")}>
            <Ionicons name="ban-outline" size={18} color="#004d40" />
            <Text style={styles.actionText}>Block Time</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>

      {console.log("blocked", blocked)}
    </ScrollView>
  );
};

export default ConsultantAvailabilityScreen;

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: "#fff",
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 140,
  },
  loaderWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 6,
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    color: "#333",
  },
  subtitle: {
    fontSize: 13,
    color: "#666",
    marginBottom: 20,
  },
  card: {
    backgroundColor: "#faf7ff",
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: "#e7dbff",
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "700",
    marginBottom: 12,
    color: "#333",
  },
  dayRow: {
    marginBottom: 10,
  },
  dayLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: "#444",
    marginBottom: 4,
  },
  emptySlot: {
    fontSize: 12,
    color: "#999",
  },
  slotPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#efe6ff",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 14,
    alignSelf: "flex-start",
    marginBottom: 4,
  },
  slotText: {
    fontSize: 12,
    color: "#333",
    fontWeight: "600",
  },
  actionBtn: {
    marginTop: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    alignSelf: "flex-start",
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 10,
    backgroundColor: "#a580e9",
  },
  actionText: {
    color: "#004d40",
    fontSize: 12,
    fontWeight: "700",
  },
  emptyBlock: {
    fontSize: 12,
    color: "#999",
    marginBottom: 6,
  },
  blockCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#fff",
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#eee",
    marginBottom: 8,
  },
  blockRange: {
    fontSize: 12,
    fontWeight: "700",
    color: "#333",
  },
  blockReason: {
    fontSize: 11,
    color: "#777",
  },
});
