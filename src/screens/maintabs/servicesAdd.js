import React, { useContext, useEffect, useRef, useState } from "react";
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ActivityIndicator, Animated, KeyboardAvoidingView, Platform, ScrollView, Alert } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { baseUrl } from "../../config";
import { AuthContext } from "../../authcontext";

const AddServiceScreen = ({ route, navigation }) => {
  const { token } = useContext(AuthContext);
  const { service } = route.params;

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  const [price, setPrice] = useState("");
  const [priceUnit, setPriceUnit] = useState("visit");
  const [duration, setDuration] = useState("60");
  const [isLoading, setIsLoading] = useState(false);

  const allLabels = route.params?.allLabels || [service.label]; // pass all service labels from previous screen

  const [label, setLabel] = useState(service.label || "");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [category, setCategory] = useState(service.category || "consultation");

  const categories = ["consultation", "tank", "pond"];

  const filteredLabels = allLabels.filter((l) => l.toLowerCase().includes(label.toLowerCase()));

  useEffect(() => {
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
          category,
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

          <Text style={styles.fieldLabel}>Service Name</Text>
          <TextInput
            placeholder="Start typing service name..."
            placeholderTextColor="#a580e9"
            style={styles.input}
            value={label}
            onChangeText={(t) => {
              setLabel(t);
              setShowSuggestions(true);
            }}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
          />

          {showSuggestions && filteredLabels.length > 0 && (
            <View style={styles.suggestionBox}>
              {filteredLabels.map((item) => (
                <TouchableOpacity
                  key={item}
                  style={styles.suggestionItem}
                  onPress={() => {
                    setLabel(item);
                    setShowSuggestions(false);
                  }}
                >
                  <Text style={styles.suggestionText}>{item}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          <Text style={styles.fieldLabel}>Category</Text>
          <View style={styles.dropdown}>
            {categories.map((c) => (
              <TouchableOpacity key={c} style={[styles.dropdownItem, category === c && styles.dropdownItemActive]} onPress={() => setCategory(c)}>
                <Text style={[styles.dropdownText, category === c && styles.dropdownTextActive]}>{c}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <TextInput placeholder="Price" placeholderTextColor="#a580e9" keyboardType="numeric" style={styles.input} value={price} onChangeText={setPrice} />

          <TextInput placeholder="Price Unit (e.g. visit, hour)" placeholderTextColor="#a580e9" style={styles.input} value={priceUnit} onChangeText={setPriceUnit} />

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
    paddingBottom: 40,
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
  serviceLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
  },
  meta: {
    marginTop: 4,
    fontSize: 12,
    color: "#777",
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
  suggestionBox: {
    borderWidth: 1,
    borderColor: "#e7dbff",
    borderRadius: 10,
    marginBottom: 12,
    backgroundColor: "#fff",
    overflow: "hidden",
  },
  suggestionItem: {
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#f0eaff",
  },
  suggestionText: {
    color: "#333",
  },
  dropdown: {
    flexDirection: "row",
    marginBottom: 12,
  },
  dropdownItem: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#a580e9",
    marginRight: 8,
  },
  dropdownItemActive: {
    backgroundColor: "#a580e9",
  },
  dropdownText: {
    color: "#a580e9",
    fontSize: 13,
  },
  dropdownTextActive: {
    color: "#004d40",
    fontWeight: "600",
  },
});
