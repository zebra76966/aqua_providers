import React, { useState, useContext, useCallback } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Platform, KeyboardAvoidingView, ScrollView, Keyboard, TouchableWithoutFeedback, Alert } from "react-native";
import { Picker } from "@react-native-picker/picker";
import Slider from "@react-native-community/slider";
import Icon from "react-native-vector-icons/FontAwesome5";
import MaterialIcons from "react-native-vector-icons/MaterialCommunityIcons";
import Entypo from "react-native-vector-icons/Entypo";
import { baseUrl } from "../config";
import { AuthContext } from "../authcontext";
import { useFocusEffect } from "@react-navigation/native";

const TankSetupScreen = ({ navigation }) => {
  const [tankName, setTankName] = useState("");
  const [tankType, setTankType] = useState("");
  const [tankSize, setTankSize] = useState(50);
  const [sizeUnit, setSizeUnit] = useState("L");
  const [tankSizeInput, setTankSizeInput] = useState(String(tankSize));
  const [tankSizeValue, setTankSizeValue] = useState(Number(tankSize));

  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [checkingTanks, setCheckingTanks] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");

  const { token, logout } = useContext(AuthContext);

  const handleUnauthorized = () => {
    Alert.alert("Session Expired", "Please log in again to continue.");
    logout();
    navigation.reset({
      index: 0,
      routes: [{ name: "Login" }],
    });
  };

  // ✅ Fetch Tanks on focus
  useFocusEffect(
    useCallback(() => {
      let isActive = true;

      const fetchTanks = async () => {
        if (!token) return;
        try {
          setCheckingTanks(true);
          const response = await fetch(`${baseUrl}/tanks/get-tanks/`, {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          });

          if (response.status === 401) {
            if (isActive) handleUnauthorized();
            return;
          }

          const result = await response.json();
          if (!isActive) return;

          if (response.ok && result?.data?.tanks?.length > 0) {
            console.log("Tanks exist, redirecting to MainTabs", result);
            navigation.reset({
              index: 0,
              routes: [{ name: "MainTabs" }],
            });
          }
        } catch (error) {
          console.error("Error fetching tanks:", error);
        } finally {
          if (isActive) setCheckingTanks(false);
        }
      };

      fetchTanks();

      return () => {
        isActive = false;
      };
    }, [token]),
  );

  const handleSubmit = async () => {
    if (!tankName || !tankType || !tankSize) {
      setErrorMsg("Please fill in all required fields.");
      return;
    }

    setLoading(true);
    setErrorMsg("");

    try {
      const response = await fetch(`${baseUrl}/tanks/tank/create/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: tankName,
          tank_type: tankType.toUpperCase() === "FRESHWATER" ? "FRESH" : "SALT",
          size: parseFloat(tankSize?.toFixed(1)),
          size_unit: sizeUnit,
          notes,
        }),
      });

      if (response.status === 401) {
        handleUnauthorized();
        return;
      }

      const data = await response.json();
      console.log("Tank creation response:", data);

      if (response.ok) {
        navigation.navigate("TankScan", {
          tankDataLocal: { name: tankName, id: data?.data?.id, tank_type: tankType.toUpperCase() === "FRESHWATER" ? "FRESH" : "SALT" },
        });
      } else {
        const message = data?.dev_msg?.name?.[0] || data?.message || "Something went wrong. Please try again.";
        setErrorMsg(message);
        console.error("Tank creation failed:", data);
      }
    } catch (error) {
      setErrorMsg(error.message);
    } finally {
      setLoading(false);
    }
  };

  if (checkingTanks) {
    return (
      <View style={[styles.container, { justifyContent: "center" }]}>
        <ActivityIndicator size="large" color="#a580e9" />
        <Text style={{ textAlign: "center", marginTop: 12 }}>Checking your tanks...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: "#ffffff" }} behavior={Platform.OS === "ios" ? "padding" : "height"}>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
          <Text style={styles.title}>AQUA AI</Text>

          {/* Tank Name */}
          <View style={styles.inputContainer}>
            <Icon name="hashtag" size={16} color="#333" style={styles.icon} />
            <TextInput style={styles.input} placeholder="Tank Name" placeholderTextColor="#999" value={tankName} onChangeText={setTankName} />
          </View>

          {/* Tank Type Dropdown */}
          <View style={styles.inputContainer}>
            <MaterialIcons name="fish" size={18} color="#333" style={styles.icon} />
            <Picker selectedValue={tankType} style={styles.picker} onValueChange={(itemValue) => setTankType(itemValue)}>
              <Picker.Item label="Tank Type" value="" />
              <Picker.Item label="Freshwater" value="Freshwater" />
              <Picker.Item label="Saltwater" value="Saltwater" />
            </Picker>
          </View>

          {/* Tank Size Slider */}
          {/* Tank Size Slider + Input */}
          <View style={styles.inputContainer}>
            <MaterialIcons name="ruler" size={18} color="#333" style={styles.icon} />
            <TextInput
              style={styles.input}
              placeholder={`Tank Size (${sizeUnit})`}
              placeholderTextColor="#999"
              keyboardType="numeric"
              value={tankSizeInput}
              onChangeText={(val) => {
                setTankSizeInput(val);

                if (val === "") {
                  setTankSizeValue(0);
                  setTankSize(0);
                  return;
                }

                const num = parseFloat(val);
                if (!isNaN(num)) {
                  setTankSizeValue(num);
                  setTankSize(num);
                }
              }}
            />
          </View>

          {/* Toggle Gallons / Litres */}
          <View style={styles.toggleContainer}>
            <TouchableOpacity style={[styles.toggleButton, sizeUnit === "G" && styles.toggleActive]} onPress={() => setSizeUnit("G")}>
              <Text style={sizeUnit === "G" ? styles.toggleTextActive : styles.toggleText}>Gallons</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.toggleButton, sizeUnit === "L" && styles.toggleActive]} onPress={() => setSizeUnit("L")}>
              <Text style={sizeUnit === "L" ? styles.toggleTextActive : styles.toggleText}>Litres</Text>
            </TouchableOpacity>
          </View>

          {/* Notes */}
          <View style={styles.inputContainer}>
            <Entypo name="text" size={18} color="#333" style={styles.icon} />
            <TextInput style={styles.input} placeholder="Notes (optional)" placeholderTextColor="#999" value={notes} onChangeText={setNotes} />
          </View>

          {/* Error Message */}
          {errorMsg ? (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{errorMsg}</Text>
            </View>
          ) : null}

          {/* Continue */}
          <TouchableOpacity
            style={{
              ...styles.continueButton,
              backgroundColor: errorMsg ? "#ccc" : "#a580e9",
            }}
            onPress={handleSubmit}
            disabled={loading || !!errorMsg}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#000" />
            ) : (
              <>
                <Text style={{ ...styles.continueText, color: "#000" }}>CONTINUE</Text>
                <Entypo name="chevron-right" size={22} color="#000" />
              </>
            )}
          </TouchableOpacity>
        </ScrollView>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  sizeInput: {
    width: 60,
    textAlign: "center",
    fontSize: 16,
    color: "#000",
  },
  container: {
    flex: 1,
    padding: 24,
    paddingTop: 60,
    backgroundColor: "#f9f9f9",
  },
  title: {
    fontSize: 22,
    textAlign: "center",
    color: "#a580e9",
    fontWeight: "bold",
    letterSpacing: 2,
    marginBottom: 30,
  },
  inputContainer: {
    flexDirection: "row",
    borderWidth: 1,
    borderColor: "#888",
    borderRadius: 24,
    alignItems: "center",
    paddingHorizontal: 14,
    marginBottom: 18,
    backgroundColor: "#fff",
  },
  icon: { marginRight: 10 },
  input: {
    flex: 1,
    height: 48,
    fontSize: 16,
    color: "#000",
  },
  picker: { flex: 1, height: 50, color: "#000" },
  sliderContainer: { marginBottom: 24 },
  sliderLabel: { flexDirection: "row", alignItems: "center", marginBottom: 8 },
  sizeBox: {
    position: "absolute",
    right: 0,
    top: 0,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderRadius: 8,
    borderColor: "#999",
    padding: 6,
  },
  sliderValue: { textAlign: "center", color: "#a580e9", fontWeight: "bold" },
  toggleContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginBottom: 20,
  },
  toggleButton: {
    flex: 1,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: "#a580e9",
    alignItems: "center",
  },
  toggleActive: { backgroundColor: "#a580e9" },
  toggleText: { color: "#a580e9", fontWeight: "bold" },
  toggleTextActive: { color: "#fff", fontWeight: "bold" },
  continueButton: {
    flexDirection: "row",
    backgroundColor: "#111",
    paddingVertical: 14,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 30,
  },
  continueText: {
    color: "#a580e9",
    fontSize: 16,
    fontWeight: "bold",
    marginRight: 10,
  },
  errorBox: {
    backgroundColor: "#ffeaea",
    borderRadius: 10,
    padding: 10,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: "#ffb3b3",
  },
  errorText: {
    color: "#cc0000",
    textAlign: "center",
    fontWeight: "600",
  },
});

export default TankSetupScreen;
