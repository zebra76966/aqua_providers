import React, { useState, useContext } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from "react-native";
import { Picker } from "@react-native-picker/picker";
import Slider from "@react-native-community/slider";
import Icon from "react-native-vector-icons/FontAwesome5";
import MaterialIcons from "react-native-vector-icons/MaterialCommunityIcons";
import Entypo from "react-native-vector-icons/Entypo";
import { baseUrl } from "../../../config";
import { AuthContext } from "../../../authcontext";
import { Ionicons } from "@expo/vector-icons";

const AddTank = ({ navigation }) => {
  const [tankName, setTankName] = useState("");
  const [tankType, setTankType] = useState("");
  const [tankSize, setTankSize] = useState(35.6);
  const [sizeUnit, setSizeUnit] = useState("L"); // Default Litres
  const [tankSizeInput, setTankSizeInput] = useState(String(tankSize));
  const [tankSizeValue, setTankSizeValue] = useState(Number(tankSize));
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState(""); // Error message state

  const { token } = useContext(AuthContext);

  const handleSubmit = async () => {
    if (!tankName || !tankType || !tankSize) {
      setErrorMessage("Please fill in all required fields.");
      return;
    }

    setLoading(true);
    setErrorMessage(""); // Reset previous errors

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

      const data = await response.json();

      if (response.ok) {
        Alert.alert("Success", "Tank Added Successfully!");
        navigation.goBack();
      } else {
        // Display backend validation errors
        if (data?.dev_msg?.name?.length > 0) {
          setErrorMessage(data.dev_msg.name[0]);
        } else {
          setErrorMessage(data?.message || "Something went wrong.");
        }
      }
    } catch (error) {
      setErrorMessage(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ ...styles.backBtn, backgroundColor: "#1f1f1f", borderRadius: 8 }}>
          <Ionicons name="arrow-back" size={24} color="#a580e9" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Add Habitat</Text>
      </View>

      {/* Display Error Message */}
      {errorMessage ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{errorMessage}</Text>
        </View>
      ) : null}

      {/* Tank Name */}
      <View style={styles.inputContainer}>
        <Icon name="hashtag" size={16} color="#333" style={styles.icon} />
        <TextInput style={styles.input} placeholder="Tank Name" placeholderTextColor="#999" value={tankName} onChangeText={setTankName} />
      </View>

      {/* Tank Type Dropdown */}
      <View style={styles.inputContainer}>
        <MaterialIcons name="fish" size={18} color="#333" style={styles.icon} />
        <Picker selectedValue={tankType} style={styles.picker} onValueChange={(itemValue) => setTankType(itemValue)}>
          <Picker.Item label="Habitat Type" value="" />
          <Picker.Item label="Freshwater" value="Freshwater" />
          <Picker.Item label="Saltwater" value="Saltwater" />
          <Picker.Item label="Pond" value="Pondwater" />
          <Picker.Item label="Brackish" value="Brackishwater" />
        </Picker>
      </View>

      {/* Tank Size with Slider */}
      {/* Tank Size Slider + Input */}
      {/* Tank Size Input (No Slider) */}
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
        <TouchableOpacity style={[styles.toggleButton, sizeUnit === "L" && styles.toggleActive]} onPress={() => setSizeUnit("L")}>
          <Text style={sizeUnit === "L" ? styles.toggleTextActive : styles.toggleText}>Litres</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.toggleButton, sizeUnit === "G" && styles.toggleActive]} onPress={() => setSizeUnit("G")}>
          <Text style={sizeUnit === "G" ? styles.toggleTextActive : styles.toggleText}>Gallons</Text>
        </TouchableOpacity>
      </View>

      {/* Notes */}
      <View style={styles.inputContainer}>
        <Entypo name="text" size={18} color="#333" style={styles.icon} />
        <TextInput style={styles.input} placeholder="Notes (optional)" placeholderTextColor="#999" value={notes} onChangeText={setNotes} />
      </View>

      {/* Continue Button or Loader */}
      <TouchableOpacity
        style={{
          ...styles.continueButton,
          backgroundColor: errorMessage ? "#ccc" : "#a580e9",
        }}
        onPress={handleSubmit}
        disabled={loading || !!errorMessage}
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
    </View>
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
  icon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    height: 48,
    fontSize: 16,
    color: "#000",
  },
  picker: {
    flex: 1,
    height: 50,
    color: "#000",
  },
  sliderContainer: {
    marginBottom: 24,
  },
  sliderLabel: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  sizeBox: {
    position: "absolute",
    right: 0,
    top: 0,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderRadius: 8,
    borderColor: "#999",
    padding: 6,
    textAlign: "center",
    width: 100,
    marginBottom: 10,
  },
  sliderValue: {
    textAlign: "center",
    color: "#a580e9",
    fontWeight: "bold",
  },
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
  toggleActive: {
    backgroundColor: "#a580e9",
  },
  toggleText: {
    color: "#a580e9",
    fontWeight: "bold",
  },
  toggleTextActive: {
    color: "#fff",
    fontWeight: "bold",
  },
  continueButton: {
    flexDirection: "row",
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
  errorContainer: {
    backgroundColor: "#ffe6e6",
    padding: 10,
    borderRadius: 8,
    marginBottom: 16,
  },
  errorText: {
    color: "#cc0000",
    fontWeight: "bold",
  },
});

export default AddTank;
