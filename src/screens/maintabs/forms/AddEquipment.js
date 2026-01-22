import React, { useEffect, useState, useContext } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, Image } from "react-native";
import { ScrollView, KeyboardAvoidingView, Platform } from "react-native";

import { SafeAreaView } from "react-native-safe-area-context";
import DropDownPicker from "react-native-dropdown-picker";
import * as ImagePicker from "expo-image-picker";
import { AuthContext } from "../../../authcontext";
import { fetchEquipmentTypes, createEquipment } from "./api/equipment";
import { Ionicons } from "@expo/vector-icons";

const AddEquipment = ({ navigation, route }) => {
  const { token } = useContext(AuthContext);
  const { tankId } = route.params; // pass tank id

  const [equipmentTypes, setEquipmentTypes] = useState([]);
  const [typeOpen, setTypeOpen] = useState(false);
  const [equipmentType, setEquipmentType] = useState(null);

  const [equipmentName, setEquipmentName] = useState("");
  const [brand, setBrand] = useState("");
  const [wattage, setWattage] = useState("");
  const [modelNumber, setModelNumber] = useState("");
  const [notes, setNotes] = useState("");

  const [image, setImage] = useState(null);
  const [loading, setLoading] = useState(false);

  /* ---------- Load equipment types ---------- */
  useEffect(() => {
    (async () => {
      try {
        const data = await fetchEquipmentTypes(token);

        const normalized = Array.isArray(data)
          ? data
              .map((t) => {
                // if API returns objects
                if (typeof t === "object" && t !== null) {
                  return {
                    label: t.label || t.key?.toUpperCase(),
                    value: t.key,
                  };
                }

                // if API returns strings
                if (typeof t === "string") {
                  return {
                    label: t.replace(/_/g, " ").toUpperCase(),
                    value: t,
                  };
                }

                return null;
              })
              .filter(Boolean)
          : [];

        setEquipmentTypes(normalized);
      } catch (e) {
        Alert.alert("Error", e.message);
      }
    })();
  }, []);

  /* ---------- Image picker ---------- */
  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission required");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
    });

    if (!result.canceled) {
      setImage(result.assets[0]);
    }
  };

  /* ---------- Submit ---------- */
  const isValid = equipmentType && equipmentName && brand && wattage && modelNumber;

  const handleSubmit = async () => {
    setLoading(true);
    try {
      await createEquipment(
        {
          tank: tankId,
          equipment_type: equipmentType,
          equipment_name: equipmentName,
          brand,
          wattage,
          model_number: modelNumber,
          notes,
          image,
        },
        token,
      );

      Alert.alert("Success", "Equipment added successfully");
      navigation.goBack();
    } catch (e) {
      Alert.alert("Error", e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
              <TouchableOpacity onPress={() => navigation.goBack()}>
                <Ionicons name="arrow-back" size={24} color="#a580e9" />
              </TouchableOpacity>
              <Text style={styles.headerTitle}>Add Equipment</Text>
            </View>

            {/* Equipment Type */}
            <Text style={styles.label}>Equipment Type</Text>
            <DropDownPicker
              open={typeOpen}
              value={equipmentType}
              items={equipmentTypes}
              setOpen={setTypeOpen}
              setValue={setEquipmentType}
              setItems={setEquipmentTypes}
              searchable
              listMode="MODAL"
              modalTitle="Select Equipment Type"
              placeholder="Select equipment type"
              style={styles.dropdown}
            />

            {/* Inputs */}
            <TextInput style={styles.input} placeholder="Equipment Name" placeholderTextColor="#999" value={equipmentName} onChangeText={setEquipmentName} />
            <TextInput style={styles.input} placeholder="Brand" placeholderTextColor="#999" value={brand} onChangeText={setBrand} />
            <TextInput style={styles.input} placeholder="Wattage (e.g. 55W)" placeholderTextColor="#999" value={wattage} onChangeText={setWattage} />
            <TextInput style={styles.input} placeholder="Model Number" placeholderTextColor="#999" value={modelNumber} onChangeText={setModelNumber} />
            <TextInput style={styles.input} placeholder="Notes (optional)" placeholderTextColor="#999" value={notes} onChangeText={setNotes} />

            {/* Image */}
            <TouchableOpacity style={styles.imageBtn} onPress={pickImage}>
              <Text style={styles.imageText}>{image ? "Change Image" : "Add Image"}</Text>
            </TouchableOpacity>

            {image && <Image source={{ uri: image.uri }} style={styles.image} />}

            {/* Submit */}
            <TouchableOpacity style={[styles.submit, !isValid && { opacity: 0.5 }]} disabled={!isValid || loading} onPress={handleSubmit}>
              {loading ? <ActivityIndicator /> : <Text style={styles.submitText}>SAVE EQUIPMENT</Text>}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default AddEquipment;
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#f9f9f9" },
  container: { padding: 20 },
  header: { flexDirection: "row", alignItems: "center", marginBottom: 20 },
  headerTitle: { fontSize: 18, fontWeight: "bold", marginLeft: 12 },

  label: { fontWeight: "600", marginBottom: 6 },

  input: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#ddd",
  },

  dropdown: {
    borderColor: "#a580e9",
    borderRadius: 12,
    marginBottom: 12,
  },

  imageBtn: {
    borderWidth: 1,
    borderColor: "#a580e9",
    borderRadius: 12,
    padding: 12,
    alignItems: "center",
    marginBottom: 12,
  },

  imageText: { color: "#a580e9", fontWeight: "bold" },

  image: { width: "100%", height: 180, borderRadius: 12, marginBottom: 12 },

  submit: {
    backgroundColor: "#a580e9",
    padding: 14,
    borderRadius: 30,
    alignItems: "center",
  },

  submitText: { fontWeight: "bold", color: "#000" },
  scrollContent: {
    paddingBottom: 140, // 👈 clears bottom tab + safe area
  },
});
