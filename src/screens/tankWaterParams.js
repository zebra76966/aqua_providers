import React, { useState, useContext } from "react";
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView, Alert } from "react-native";
import { useRoute } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { AuthContext } from "../authcontext";
import { baseUrl } from "../config";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";

export default function TankAddWaterParams({ navigation }) {
  const { token, activateTank, activeTankId } = useContext(AuthContext);
  const route = useRoute();
  const { origin, tankData } = route.params;

  const [activeForm, setActiveForm] = useState("tank"); // "tank" | "water"

  // Water parameters form state
  const [temperature, setTemperature] = useState(String(""));
  const [oxygen, setOxygen] = useState(String(""));
  const [nitrite, setNitrite] = useState(String(""));
  const [nitrate, setNitrate] = useState(String(""));
  const [ammonia, setAmmonia] = useState(String(""));
  const [ph, setPh] = useState(String(""));
  const [waterType, setWaterType] = useState(tankData?.tank_type || "");

  // New saltwater parameters
  const [magnesium, setMagnesium] = useState(String(tankData?.waterParams?.magnesium_mgL ?? ""));
  const [alkalinity, setAlkalinity] = useState(String(tankData?.waterParams?.alkalinity_dkh ?? ""));
  const [calcium, setCalcium] = useState(String(tankData?.waterParams?.calcium_mgL ?? ""));
  const [phosphate, setPhosphate] = useState(String(tankData?.waterParams?.phosphate_ppm ?? ""));
  console.log("tankData", tankData);

  const updateWaterParams = async () => {
    try {
      const res = await fetch(`${baseUrl}/tanks/${activeTankId}/water-parameters/`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          temperature: parseFloat(temperature),
          estimated_oxygen_mgL: parseFloat(oxygen),
          estimated_nitrite_ppm: parseFloat(nitrite),
          estimated_nitrate_ppm: parseFloat(nitrate),
          estimated_ammonia_ppm: parseFloat(ammonia),
          estimated_ph: parseFloat(ph), // NEW
          // Saltwater-specific fields
          magnesium_mgL: waterType === "SALT" ? parseFloat(magnesium) : null,
          alkalinity_dkh: waterType === "SALT" ? parseFloat(alkalinity) : null,
          calcium_mgL: waterType === "SALT" ? parseFloat(calcium) : null,
          phosphate_ppm: waterType === "SALT" ? parseFloat(phosphate) : null,
        }),
      });

      if (res.ok) {
        Alert.alert("Success", "Water parameters updated successfully");
        if (origin === "TankScan") {
          navigation.navigate("MainTabs");
        } else {
          navigation.goBack();
        }
      } else {
        const err = await res.json();
        Alert.alert("Error", JSON.stringify(err));
      }
    } catch (e) {
      Alert.alert("Error", e.message);
    }
  };

  const renderWaterForm = () => {
    const hasValues = temperature.trim() !== "" || oxygen.trim() !== "" || nitrite.trim() !== "" || nitrate.trim() !== "" || ammonia.trim() !== "" || ph.trim() !== "";

    const renderInput = (label, value, setter, placeholder) => (
      <View style={{ marginBottom: 16 }}>
        <Text style={{ fontSize: 14, fontWeight: "600", marginBottom: 6 }}>{label}</Text>
        <TextInput style={styles.input} placeholder={placeholder} placeholderTextColor="#999" value={value} onChangeText={setter} keyboardType="numeric" />
      </View>
    );

    return (
      <ScrollView style={{ marginBottom: 80 }}>
        {/* Scan button */}
        <TouchableOpacity
          style={{
            ...styles.activateButton,
            flexDirection: "row",
            justifyContent: "center",
            paddingLeft: 20,
            marginBottom: 50,
            borderRadius: 8,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.2,
            shadowRadius: 6,
            elevation: 6,
            backgroundColor: "#ff8c00",
          }}
          onPress={() =>
            navigation.navigate("PhScanScreen", {
              onScanComplete: (result) => {
                if (result.estimated_ph) setPh(String(result.estimated_ph));
                if (result.estimated_oxygen_mgL) setOxygen(String(result.estimated_oxygen_mgL));
                if (result.estimated_nitrite_ppm) setNitrite(String(result.estimated_nitrite_ppm));
                if (result.estimated_nitrate_ppm) setNitrate(String(result.estimated_nitrate_ppm));
                if (result.estimated_ammonia_ppm) setAmmonia(String(result.estimated_ammonia_ppm));
              },
            })
          }
        >
          <Text
            style={{
              ...styles.activateText,
              color: "#000",
              marginRight: 20,
              fontSize: 18,
            }}
          >
            Scan Ph Strip
          </Text>
          <MaterialCommunityIcons name="cube-scan" size={24} color="#000" />
        </TouchableOpacity>

        {renderInput("Temperature (°C)", temperature, setTemperature, "Enter temperature")}
        {renderInput("Oxygen (mg/L)", oxygen, setOxygen, "Enter oxygen")}
        {renderInput("Nitrite (ppm)", nitrite, setNitrite, "Enter nitrite")}
        {renderInput("Nitrate (ppm)", nitrate, setNitrate, "Enter nitrate")}
        {renderInput("Ammonia (ppm)", ammonia, setAmmonia, "Enter ammonia")}
        {renderInput("pH", ph, setPh, "Enter pH")}

        {waterType === "SALT" && (
          <>
            <Text style={{ fontSize: 16, fontWeight: "700", marginTop: 20, marginBottom: 10 }}>Saltwater Parameters</Text>
            {renderInput("Magnesium (mg/L)", magnesium, setMagnesium, "Enter magnesium")}
            {renderInput("Alkalinity (dKH)", alkalinity, setAlkalinity, "Enter alkalinity")}
            {renderInput("Calcium (mg/L)", calcium, setCalcium, "Enter calcium")}
            {renderInput("Phosphate (ppm)", phosphate, setPhosphate, "Enter phosphate")}
          </>
        )}

        {/* Conditionally render update button */}
        {hasValues && (
          <TouchableOpacity style={styles.saveBtn} onPress={updateWaterParams}>
            <Text style={styles.saveText}>Update Water Parameters</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    );
  };

  return (
    <SafeAreaView style={{ ...styles.container, paddingVertical: 50 }}>
      {/* Header with back button */}
      {origin === "TankScan" ? null : (
        <View style={{ ...styles.header }}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={{ ...styles.backBtn, backgroundColor: "#1f1f1f", borderRadius: 8 }}>
            <Ionicons name="arrow-back" size={24} color="#a580e9" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Add Water</Text>
        </View>
      )}

      {/* Toggle Buttons */}
      {/* <View style={styles.toggleRow}>
        <TouchableOpacity style={[styles.toggleBtn, activeForm === "tank" && styles.activeToggle]} onPress={() => setActiveForm("tank")}>
          <Text style={styles.toggleText}>Tank Info</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.toggleBtn, activeForm === "water" && styles.activeToggle]} onPress={() => setActiveForm("water")}>
          <Text style={styles.toggleText}>Water Params</Text>
        </TouchableOpacity>
      </View> */}

      {renderWaterForm()}
      {origin === "TankScan" ? (
        <View style={{ ...styles.skipContainer, marginBottom: 80 }}>
          <TouchableOpacity style={styles.skipButton} onPress={() => navigation.navigate("MainTabs")}>
            <Text style={styles.skipText}>Skip</Text>
          </TouchableOpacity>
        </View>
      ) : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  activateButton: {
    backgroundColor: "#a580e9",
    padding: 8,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 5,
  },
  container: { flex: 1, backgroundColor: "#F8F8F8", padding: 16 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 30,
  },
  backBtn: {
    padding: 6,
    marginRight: 10,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
  },
  toggleRow: { flexDirection: "row", marginBottom: 16 },
  toggleBtn: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    backgroundColor: "#ddd",
    alignItems: "center",
    marginHorizontal: 5,
  },
  activeToggle: { backgroundColor: "#a580e9" },
  toggleText: { color: "#fff", fontWeight: "bold" },
  input: {
    backgroundColor: "#fff",
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#ccc",
  },
  saveBtn: {
    backgroundColor: "#1f1f1f",
    padding: 14,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 10,
  },
  saveText: { color: "#a580e9", fontWeight: "bold", fontSize: 16 },
  skipContainer: {
    position: "absolute",
    bottom: 30,
    left: 20,
    right: 20,
    alignItems: "center",
  },
  skipButton: {
    backgroundColor: "#a580e9",
    paddingVertical: 14,
    paddingHorizontal: 40,
    borderRadius: 30,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 6,
  },
  skipText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
    letterSpacing: 0.5,
  },
});
