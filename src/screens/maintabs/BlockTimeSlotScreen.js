// BlockTimeSlotScreen.js
import React, { useContext, useEffect, useRef, useState } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Animated, TextInput, Alert } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { AuthContext } from "../../authcontext";
import { baseUrl } from "../../config";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Platform } from "react-native";

const BlockTimeSlotScreen = ({ navigation }) => {
  const { token } = useContext(AuthContext);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [blocked, setBlocked] = useState([]);

  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [reason, setReason] = useState("");

  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);

  const [pickerMode, setPickerMode] = useState(null); // "start" | "end"
  const [showPicker, setShowPicker] = useState(false);

  const [pickerStage, setPickerStage] = useState("date"); // "date" | "time"

  const openPicker = (mode) => {
    setPickerMode(mode);
    setPickerStage("date");
    setShowPicker(true);
  };

  const formatDisplay = (d) => (d ? `${d.toLocaleDateString()} ${d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}` : "Select");

  const toApiFormat = (d) => {
    const pad = (n) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}:00`;
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${baseUrl}/consultants/availability/me/`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.message);

      setBlocked(json.data?.upcoming_blocked_slots || []);
    } catch {
      Alert.alert("Error", "Failed to load blocked slots");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();

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

  const block = async () => {
    if (!startDate || !endDate) {
      Alert.alert("Missing fields", "Please select start and end time");
      return;
    }

    try {
      setSaving(true);

      const res = await fetch(`${baseUrl}/consultants/availability/block/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          start_datetime: toApiFormat(startDate),
          end_datetime: toApiFormat(endDate),
          reason,
          is_recurring: false,
        }),
      });

      console.log("json", res);
      const json = await res.json();

      if (!res.ok) throw new Error(json.message);

      setStart("");
      setEnd("");
      setReason("");

      fetchData();
      Alert.alert("Blocked", "Time slot blocked successfully");
    } catch {
      Alert.alert("Error", "Failed to block time");
    } finally {
      setSaving(false);
    }
  };

  const unblock = async (slotId) => {
    try {
      const res = await fetch(`${baseUrl}/consultants/availability/unblock/${slotId}/`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.message);

      fetchData();
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

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="chevron-back" size={28} color="#a580e9" />
          </TouchableOpacity>
          <Text style={styles.title}>Blocked Time</Text>
        </View>

        {/* Create block */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Block New Time</Text>

          <View style={{ gap: 10, marginBottom: 10 }}>
            <TouchableOpacity style={styles.dateBox} onPress={() => openPicker("start")}>
              <Ionicons name="calendar-outline" size={18} color="#a580e9" />
              <Text style={styles.dateText}>Start: {formatDisplay(startDate)}</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.dateBox} onPress={() => openPicker("end")}>
              <Ionicons name="calendar-outline" size={18} color="#a580e9" />
              <Text style={styles.dateText}>End: {formatDisplay(endDate)}</Text>
            </TouchableOpacity>
          </View>

          <TextInput placeholder="Reason (optional)" placeholderTextColor="#a580e9" style={styles.input} value={reason} onChangeText={setReason} />

          <TouchableOpacity style={styles.button} onPress={block} disabled={saving}>
            {saving ? <ActivityIndicator color="#004d40" /> : <Text style={styles.buttonText}>Block Time</Text>}
          </TouchableOpacity>
        </View>

        {/* List */}
        <Text style={styles.sectionTitle}>Upcoming Blocks</Text>

        {blocked.length === 0 ? (
          <View style={styles.emptyWrap}>
            <Ionicons name="calendar-outline" size={40} color="#ccc" />
            <Text style={styles.emptyText}>No blocked slots</Text>
          </View>
        ) : (
          blocked.map((b) => (
            <View key={`${b.slot_id}-${b.date}`} style={styles.blockCard}>
              <View style={{ flex: 1 }}>
                <Text style={styles.blockRange}>
                  {b.day_name}, {b.date}
                </Text>
                <Text style={styles.blockTime}>
                  {b.start_time.slice(0, 5)} → {b.end_time.slice(0, 5)} · {b.type}
                </Text>
                {!!b.reason && <Text style={styles.blockReason}>{b.reason}</Text>}
              </View>

              <TouchableOpacity onPress={() => unblock(b.slot_id)}>
                <Ionicons name="close-circle" size={22} color="#f44336" />
              </TouchableOpacity>
            </View>
          ))
        )}
      </Animated.View>

      {showPicker && (
        <DateTimePicker
          value={pickerMode === "start" ? startDate || new Date() : endDate || new Date()}
          mode={Platform.OS === "ios" ? "datetime" : pickerStage}
          display="default"
          onChange={(e, selected) => {
            if (!selected) {
              setShowPicker(false);
              return;
            }

            if (Platform.OS === "android") {
              if (pickerStage === "date") {
                const base = pickerMode === "start" ? startDate || new Date() : endDate || new Date();
                const merged = new Date(base);
                merged.setFullYear(selected.getFullYear(), selected.getMonth(), selected.getDate());

                if (pickerMode === "start") setStartDate(merged);
                if (pickerMode === "end") setEndDate(merged);

                setPickerStage("time");
                return;
              }

              if (pickerStage === "time") {
                const base = pickerMode === "start" ? startDate || new Date() : endDate || new Date();
                const merged = new Date(base);
                merged.setHours(selected.getHours(), selected.getMinutes());

                if (pickerMode === "start") setStartDate(merged);
                if (pickerMode === "end") setEndDate(merged);

                setShowPicker(false);
                return;
              }
            } else {
              // iOS – datetime in one go
              if (pickerMode === "start") setStartDate(selected);
              if (pickerMode === "end") setEndDate(selected);
              setShowPicker(false);
            }
          }}
        />
      )}
    </ScrollView>
  );
};

export default BlockTimeSlotScreen;

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
  card: {
    backgroundColor: "#faf7ff",
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: "#e7dbff",
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#333",
    marginBottom: 10,
  },
  input: {
    borderWidth: 1,
    borderColor: "#a580e9",
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
    backgroundColor: "#fff",
  },
  button: {
    marginTop: 6,
    backgroundColor: "#a580e9",
    padding: 14,
    borderRadius: 10,
    alignItems: "center",
  },
  buttonText: {
    color: "#004d40",
    fontWeight: "700",
  },
  blockCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "#faf7ff",
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: "#e7dbff",
    marginBottom: 10,
  },
  blockRange: {
    fontSize: 13,
    fontWeight: "700",
    color: "#333",
  },
  blockTime: {
    marginTop: 2,
    fontSize: 12,
    color: "#666",
  },
  blockReason: {
    marginTop: 2,
    fontSize: 11,
    color: "#777",
  },
  emptyWrap: {
    alignItems: "center",
    marginTop: 30,
  },
  emptyText: {
    marginTop: 8,
    color: "#888",
  },
  dateBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderWidth: 1,
    borderColor: "#a580e9",
    borderRadius: 10,
    padding: 12,
    backgroundColor: "#fff",
  },
  dateText: {
    fontSize: 13,
    color: "#333",
    fontWeight: "600",
  },
});
