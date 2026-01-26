// SetWeeklyAvailabilityScreen.js
import React, { useContext, useEffect, useRef, useState } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Animated, Alert, Modal } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { AuthContext } from "../../authcontext";
import { baseUrl } from "../../config";

const DAYS = [
  { key: 1, label: "Monday" },
  { key: 2, label: "Tuesday" },
  { key: 3, label: "Wednesday" },
  { key: 4, label: "Thursday" },
  { key: 5, label: "Friday" },
  { key: 6, label: "Saturday" },
  { key: 7, label: "Sunday" },
];

const defaultDay = {
  is_available: false,
  start_time: "09:00",
  end_time: "17:00",
};

const SetWeeklyAvailabilityScreen = ({ navigation }) => {
  const { token } = useContext(AuthContext);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [week, setWeek] = useState({});

  const fetchAvailability = async () => {
    try {
      setLoading(true);

      const res = await fetch(`${baseUrl}/consultants/availability/me/`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const json = await res.json();
      console.log("availability response", json);

      if (!res.ok) throw new Error(json.message);

      const weekly = json?.data?.statistics?.weekly_availability || {};

      // Build a full 7-day map with defaults
      const map = {};
      DAYS.forEach((d) => {
        map[d.key] = { ...defaultDay };
      });

      /*
      weekly_availability is expected to look like:
      {
        "1": { is_available, start_time, end_time },
        "2": { ... }
      }
    */
      Object.entries(weekly).forEach(([dayKey, slot]) => {
        const k = Number(dayKey);
        map[k] = {
          is_available: !!slot.is_available,
          start_time: slot.start_time?.slice(0, 5) || "09:00",
          end_time: slot.end_time?.slice(0, 5) || "17:00",
        };
      });

      setWeek(map);
    } catch (e) {
      console.log(e);
      Alert.alert("Error", "Failed to load availability");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAvailability();
    Animated.parallel([Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }), Animated.timing(slideAnim, { toValue: 0, duration: 400, useNativeDriver: true })]).start();
  }, []);

  const toggleDay = (k) => setWeek((p) => ({ ...p, [k]: { ...p[k], is_available: !p[k].is_available } }));

  const updateTime = (k, field, val) => setWeek((p) => ({ ...p, [k]: { ...p[k], [field]: val } }));

  const save = async () => {
    const slots = DAYS.map((d) => ({
      day_of_week: d.key - 1,
      start_time: week[d.key].start_time,
      end_time: week[d.key].end_time,
      is_available: week[d.key].is_available,
      is_recurring: true,
    }));

    try {
      setSaving(true);
      const res = await fetch(`${baseUrl}/consultants/availability/bulk-update/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ slots: slots }),
      });
      console.log("res", JSON.stringify({ slots: slots }));
      const json = await res.json();

      if (!res.ok) throw new Error(json.message);

      Alert.alert("Saved", "Availability updated");
      navigation.goBack();
    } catch {
      Alert.alert("Error", "Failed to save availability");
    } finally {
      setSaving(false);
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
          <Text style={styles.title}>Weekly Availability</Text>
        </View>

        {DAYS.map((d) => {
          const day = week[d.key];
          return (
            <View key={d.key} style={styles.dayRow}>
              <TouchableOpacity onPress={() => toggleDay(d.key)} style={styles.dayLeft}>
                <Ionicons name={day?.is_available ? "checkbox" : "square-outline"} size={22} color="#a580e9" />
                <Text style={styles.dayLabel}>{d.label}</Text>
              </TouchableOpacity>

              {day?.is_available && (
                <View style={styles.timeWrap}>
                  <TimeBox value={day.start_time} onChange={(v) => updateTime(d.key, "start_time", v)} />
                  <Text style={{ color: "#777" }}>to</Text>
                  <TimeBox value={day.end_time} onChange={(v) => updateTime(d.key, "end_time", v)} />
                </View>
              )}
            </View>
          );
        })}

        <TouchableOpacity style={styles.button} onPress={save} disabled={saving}>
          {saving ? <ActivityIndicator color="#004d40" /> : <Text style={styles.buttonText}>Save</Text>}
        </TouchableOpacity>
      </Animated.View>
    </ScrollView>
  );
};

const TimeBox = ({ value, onChange }) => {
  const [open, setOpen] = useState(false);

  return (
    <>
      <TouchableOpacity style={styles.timeBox} onPress={() => setOpen(true)}>
        <Text style={styles.timeText}>{value}</Text>
      </TouchableOpacity>

      <TimePickerModal visible={open} value={value} onClose={() => setOpen(false)} onConfirm={onChange} />
    </>
  );
};

const TimePickerModal = ({ visible, value, onClose, onConfirm }) => {
  const [hour, setHour] = useState(parseInt(value.split(":")[0], 10));
  const [minute, setMinute] = useState(parseInt(value.split(":")[1], 10));

  const hours = Array.from({ length: 24 }, (_, i) => i);
  const minutes = ["00", "15", "30", "45"];

  useEffect(() => {
    if (visible) {
      const [h, m] = value.split(":");
      setHour(parseInt(h, 10));
      setMinute(m);
    }
  }, [visible]);

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.tpOverlay}>
        <View style={styles.tpSheet}>
          <View style={styles.tpHeader}>
            <Text style={styles.tpTitle}>Select Time</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={22} />
            </TouchableOpacity>
          </View>

          <View style={styles.tpPickers}>
            <ScrollView showsVerticalScrollIndicator={false}>
              {hours.map((h) => (
                <TouchableOpacity key={h} onPress={() => setHour(h)} style={[styles.tpItem, hour === h && styles.tpActive]}>
                  <Text style={[styles.tpText, hour === h && styles.tpTextActive]}>{String(h).padStart(2, "0")}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <Text style={{ fontSize: 20, fontWeight: "700" }}>:</Text>

            <ScrollView showsVerticalScrollIndicator={false}>
              {minutes.map((m) => (
                <TouchableOpacity key={m} onPress={() => setMinute(m)} style={[styles.tpItem, minute === m && styles.tpActive]}>
                  <Text style={[styles.tpText, minute === m && styles.tpTextActive]}>{m}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          <TouchableOpacity
            style={styles.tpConfirm}
            onPress={() => {
              onConfirm(`${String(hour).padStart(2, "0")}:${minute}`);
              onClose();
            }}
          >
            <Text style={styles.tpConfirmText}>Confirm</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

export default SetWeeklyAvailabilityScreen;

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
    marginBottom: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    color: "#333",
  },
  dayRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderColor: "#f0eaff",
  },
  dayLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  dayLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
  },
  timeWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  timeBox: {
    borderWidth: 1,
    borderColor: "#a580e9",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    minWidth: 60,
    alignItems: "center",
  },
  timeText: {
    fontSize: 12,
    color: "#333",
    fontWeight: "600",
  },
  button: {
    marginTop: 24,
    backgroundColor: "#a580e9",
    padding: 14,
    borderRadius: 10,
    alignItems: "center",
  },
  buttonText: {
    color: "#004d40",
    fontWeight: "700",
  },
  tpOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.35)",
    justifyContent: "flex-end",
  },
  tpSheet: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 16,
    maxHeight: "60%",
  },
  tpHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  tpTitle: {
    fontSize: 16,
    fontWeight: "800",
  },
  tpPickers: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 16,
    height: 160,
  },
  tpItem: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
    alignItems: "center",
  },
  tpActive: {
    backgroundColor: "#f0eaff",
  },
  tpText: {
    fontSize: 16,
    color: "#777",
  },
  tpTextActive: {
    color: "#a580e9",
    fontWeight: "800",
  },
  tpConfirm: {
    marginTop: 16,
    backgroundColor: "#a580e9",
    padding: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  tpConfirmText: {
    color: "#fff",
    fontWeight: "800",
  },
});
