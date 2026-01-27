// AddServiceScreen.js
import React, { useContext, useEffect, useRef, useState } from "react";
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ActivityIndicator, Animated, KeyboardAvoidingView, Platform, ScrollView, Alert } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { baseUrl } from "../../config";
import { AuthContext } from "../../authcontext";

const AddServiceScreen = ({ navigation }) => {
  const { token } = useContext(AuthContext);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  const [price, setPrice] = useState("");
  const [priceUnit, setPriceUnit] = useState("visit");
  const [duration, setDuration] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const [servicesList, setServicesList] = useState([]);
  const [loadingServices, setLoadingServices] = useState(true);
  const [label, setLabel] = useState("");

  useEffect(() => {
    const loadServices = async () => {
      try {
        setLoadingServices(true);
        const res = await fetch(`${baseUrl}/consultants/services/`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        const json = await res.json();
        const all = Object.values(json?.data || {}).flat();
        setServicesList(all);
      } catch (e) {
        Alert.alert("Error", "Failed to load services");
      } finally {
        setLoadingServices(false);
      }
    };

    loadServices();

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

  const handleSave = async () => {
    if (!label || !price || !duration) {
      Alert.alert("Missing fields", "Please fill in all fields");
      return;
    }

    try {
      setIsLoading(true);

      const res = await fetch(`${baseUrl}/consultants/services/add/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          label,
          price,
          price_unit: priceUnit,
          duration_minutes: Number(duration),
        }),
      });

      const json = await res.json();

      if (!res.ok) {
        Alert.alert("Error", json.message || "Failed to add service");
        return;
      }

      Alert.alert("Success", "Service added successfully");
      navigation.goBack();
    } catch (e) {
      Alert.alert("Error", "Something went wrong");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: "#fff" }} behavior={Platform.OS === "ios" ? "padding" : "height"}>
      <ScrollView contentContainerStyle={styles.container}>
        <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
          <View style={styles.header}>
            <TouchableOpacity onPress={() => navigation.goBack()}>
              <Ionicons name="chevron-back" size={28} color="#a580e9" />
            </TouchableOpacity>
            <Text style={styles.title}>Add Service</Text>
          </View>

          <Text style={styles.fieldLabel}>Select Service</Text>

          <View style={styles.card}>
            {loadingServices ? (
              <ActivityIndicator color="#a580e9" />
            ) : (
              servicesList.map((s) => {
                const active = label === s.label;
                return (
                  <TouchableOpacity key={s.id} style={[styles.serviceRow, active && styles.serviceRowActive]} onPress={() => setLabel(s.label)} activeOpacity={0.85}>
                    <Ionicons name={active ? "radio-button-on" : "radio-button-off"} size={20} color={active ? "#a580e9" : "#bbb"} />
                    <Text style={[styles.serviceText, active && styles.serviceTextActive]}>{s.label}</Text>
                  </TouchableOpacity>
                );
              })
            )}
          </View>

          <TextInput placeholder="Price" placeholderTextColor="#a580e9" keyboardType="numeric" style={styles.input} value={price} onChangeText={setPrice} />

          <Text style={styles.label}>Unit</Text>
          <View style={styles.unitRow}>
            {["hour", "visit", "job"].map((u) => (
              <TouchableOpacity key={u} style={[styles.unitChip, priceUnit === u && styles.unitActive]} onPress={() => setPriceUnit(u)}>
                <Text
                  style={{
                    color: priceUnit === u ? "#fff" : "#555",
                    fontWeight: "600",
                  }}
                >
                  {u}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <TextInput placeholder="Duration (minutes)" placeholderTextColor="#a580e9" keyboardType="numeric" style={styles.input} value={duration} onChangeText={setDuration} />

          <TouchableOpacity style={styles.button} onPress={handleSave} disabled={isLoading}>
            {isLoading ? <ActivityIndicator color="#004d40" /> : <Text style={styles.buttonText}>Add Service</Text>}
          </TouchableOpacity>
        </Animated.View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default AddServiceScreen;

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: "#ffffff",
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 150,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
    gap: 8,
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
  input: {
    borderWidth: 1,
    borderColor: "#a580e9",
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
    color: "#000",
  },
  button: {
    backgroundColor: "#a580e9",
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 10,
  },
  buttonText: {
    color: "#004d40",
    fontWeight: "bold",
    fontSize: 16,
  },
  fieldLabel: {
    fontSize: 13,
    color: "#666",
    marginBottom: 6,
    marginLeft: 2,
  },
  serviceRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#f0eaff",
  },
  serviceRowActive: {
    backgroundColor: "#f5efff",
  },
  serviceText: {
    fontSize: 14,
    color: "#333",
  },
  serviceTextActive: {
    fontWeight: "700",
    color: "#a580e9",
  },
  unitRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 20,
  },
  unitChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#eee",
  },
  unitActive: {
    backgroundColor: "#a580e9",
  },
  label: {
    fontSize: 12,
    color: "#666",
    marginBottom: 6,
  },
});
