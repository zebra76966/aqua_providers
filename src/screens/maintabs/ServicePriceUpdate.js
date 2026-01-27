import React, { useContext, useState } from "react";
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ActivityIndicator, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { AuthContext } from "../../authcontext";
import { baseUrl } from "../../config";

export default function UpdateServicePriceScreen({ route, navigation }) {
  const { token } = useContext(AuthContext);
  const { service } = route.params;

  // service shape:
  // {
  //   service: { id, label, category },
  //   price,
  //   price_unit,
  //   duration_minutes
  // }

  const [price, setPrice] = useState(service?.price || "");
  const [unit, setUnit] = useState(service?.price_unit || "hour");
  const [loading, setLoading] = useState(false);

  const updateService = async () => {
    if (!price) {
      Alert.alert("Missing price", "Please enter a price");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${baseUrl}/consultants/services/${service.service.id}/update/`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          price,
          price_unit: unit,
        }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json?.message);

      Alert.alert("Updated", "Service pricing updated");
      navigation.goBack();
    } catch (e) {
      Alert.alert("Error", "Failed to update service");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={22} />
        </TouchableOpacity>
        <Text style={styles.title}>Update Service</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.name}>{service.service.label}</Text>
        <Text style={styles.meta}>{service.service.category}</Text>

        <Text style={styles.label}>Price</Text>
        <TextInput value={price} onChangeText={setPrice} keyboardType="decimal-pad" placeholder="Enter price" style={styles.input} />

        <Text style={styles.label}>Unit</Text>
        <View style={styles.unitRow}>
          {["hour", "visit", "job"].map((u) => (
            <TouchableOpacity key={u} style={[styles.unitChip, unit === u && styles.unitActive]} onPress={() => setUnit(u)}>
              <Text
                style={{
                  color: unit === u ? "#fff" : "#555",
                  fontWeight: "600",
                }}
              >
                {u}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity style={[styles.button, loading && { opacity: 0.7 }]} onPress={updateService} disabled={loading}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Save Changes</Text>}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "#F8F8F8",
    padding: 20,
    paddingTop: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  title: {
    marginLeft: 12,
    fontSize: 18,
    fontWeight: "700",
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
  },
  name: {
    fontSize: 16,
    fontWeight: "800",
    color: "#222",
  },
  meta: {
    fontSize: 12,
    color: "#777",
    marginTop: 2,
    marginBottom: 16,
  },
  label: {
    fontSize: 12,
    color: "#666",
    marginBottom: 6,
  },
  input: {
    backgroundColor: "#F4F4F4",
    borderRadius: 10,
    padding: 12,
    marginBottom: 14,
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
  button: {
    backgroundColor: "#a580e9",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  buttonText: {
    color: "#fff",
    fontWeight: "700",
  },
});
