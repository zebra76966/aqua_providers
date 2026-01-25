// BreederSettingsScreen.js
import React, { useContext, useEffect, useRef, useState } from "react";
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, Animated, TouchableOpacity, Switch, Alert } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { AuthContext } from "../../../authcontext";
import { baseUrl } from "../../../config";

const BreederSettingsScreen = ({ navigation }) => {
  const { token } = useContext(AuthContext);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [profileVisibility, setProfileVisibility] = useState("public");
  const [notifyInquiries, setNotifyInquiries] = useState(true);
  const [allowCalls, setAllowCalls] = useState(true);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${baseUrl}/breeders/settings/`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const json = await res.json();

      if (!res.ok) {
        Alert.alert("Error", json.message || "Failed to load settings");
        return;
      }

      const data = json.data || {};
      setProfileVisibility(data.profile_visibility || "public");
      setNotifyInquiries(!!data.notify_new_inquiries);
      setAllowCalls(!!data.allow_calls);
    } catch {
      Alert.alert("Error", "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    try {
      setSaving(true);

      const payload = {
        profile_visibility: profileVisibility,
        notify_new_inquiries: notifyInquiries,
        allow_calls: allowCalls,
      };

      const res = await fetch(`${baseUrl}/breeders/settings/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      console.log("res", res);
      const json = await res.json();

      if (!res.ok) {
        Alert.alert("Error", json.message || "Failed to update settings");
        return;
      }

      Alert.alert("Saved", "Your settings have been updated");
    } catch {
      Alert.alert("Error", "Something went wrong");
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    fetchSettings();

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

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="chevron-back" size={28} color="#a580e9" />
          </TouchableOpacity>
          <Text style={styles.title}>Settings</Text>
        </View>

        <Text style={styles.subtitle}>Control how your breeder profile behaves.</Text>

        {/* Profile Visibility */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Profile Visibility</Text>

          <View style={styles.pillRow}>
            {["public", "private"].map((v) => (
              <TouchableOpacity key={v} onPress={() => setProfileVisibility(v)} style={[styles.pill, profileVisibility === v && styles.pillActive]}>
                <Text style={[styles.pillText, profileVisibility === v && styles.pillTextActive]}>{v.toUpperCase()}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.hint}>{profileVisibility === "public" ? "Your breeder profile will be visible to users." : "Your profile will be hidden from public listings."}</Text>
        </View>

        {/* Toggles */}
        <View style={styles.card}>
          <View style={styles.switchRow}>
            <View>
              <Text style={styles.switchTitle}>New Inquiry Notifications</Text>
              <Text style={styles.switchDesc}>Get notified when someone contacts you</Text>
            </View>
            <Switch value={notifyInquiries} onValueChange={setNotifyInquiries} />
          </View>

          <View style={styles.switchRow}>
            <View>
              <Text style={styles.switchTitle}>Allow Calls</Text>
              <Text style={styles.switchDesc}>Let users call your business phone</Text>
            </View>
            <Switch value={allowCalls} onValueChange={setAllowCalls} />
          </View>
        </View>

        <TouchableOpacity style={styles.button} onPress={saveSettings} disabled={saving}>
          {saving ? <ActivityIndicator color="#004d40" /> : <Text style={styles.buttonText}>Save Changes</Text>}
        </TouchableOpacity>
      </Animated.View>
    </ScrollView>
  );
};

export default BreederSettingsScreen;

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: "#fff",
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
    color: "#333",
    marginBottom: 10,
  },
  pillRow: {
    flexDirection: "row",
    gap: 10,
  },
  pill: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#e7dbff",
  },
  pillActive: {
    backgroundColor: "#a580e9",
    borderColor: "#a580e9",
  },
  pillText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#555",
  },
  pillTextActive: {
    color: "#004d40",
  },
  hint: {
    marginTop: 8,
    fontSize: 12,
    color: "#777",
  },
  switchRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  switchTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#333",
  },
  switchDesc: {
    fontSize: 11,
    color: "#777",
  },
  button: {
    backgroundColor: "#a580e9",
    padding: 14,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 20,
  },
  buttonText: {
    color: "#004d40",
    fontWeight: "bold",
  },
});
