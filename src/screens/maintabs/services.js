import React, { useContext, useEffect, useRef, useState } from "react";
import { View, Text, StyleSheet, FlatList, Animated, TouchableOpacity, ActivityIndicator, ScrollView } from "react-native";
import { SectionList } from "react-native";

import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { baseUrl } from "../../config";
import { AuthContext } from "../../authcontext";
import { useFocusEffect } from "@react-navigation/native";

const ServicesScreen = ({ navigation }) => {
  const { token } = useContext(AuthContext);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  const [isLoading, setIsLoading] = useState(true);
  const [services, setServices] = useState([]);
  const [error, setError] = useState("");

  const fetchServices = async () => {
    try {
      setIsLoading(true);
      const res = await fetch(`${baseUrl}/consultants/services/`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      const json = await res.json();
      console.log("Services data:", json);

      if (!res.ok) {
        setError(json.message || "Failed to load services");
        return;
      }

      const grouped = json.data || {};
      const flattened = Object.keys(grouped).map((key) => ({
        title: key,
        data: grouped[key],
      }));

      setServices(flattened);
    } catch (e) {
      setError("Something went wrong");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchServices();

    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);
  useFocusEffect(
    React.useCallback(() => {
      fetchServices();
    }, [token]),
  );

  if (isLoading) {
    return (
      <View style={styles.loaderWrap}>
        <ActivityIndicator size="large" color="#a580e9" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.loaderWrap}>
        <Text style={{ color: "#b00020" }}>{error}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
        <View style={styles.header}>
          <Text style={styles.title}>My Services</Text>
          <Text style={styles.subtitle}>Select what you offer</Text>
        </View>
      </Animated.View>

      <SectionList
        sections={services}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingBottom: 160 }}
        renderSectionHeader={({ section }) => <Text style={styles.sectionHeader}>{section.title.toUpperCase()}</Text>}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.card} activeOpacity={0.85} onPress={() => navigation.navigate("AddService", { service: item })}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>{item.label}</Text>
              <Ionicons name="add-circle-outline" size={20} color="#a580e9" />
            </View>

            <Text style={styles.cardMeta}>{item.category}</Text>
          </TouchableOpacity>
        )}
      />

      {/* Floating Add Button */}
      <TouchableOpacity style={styles.fab} activeOpacity={0.9} onPress={() => navigation.navigate("AddService")}>
        <Ionicons name="add" size={28} color="#fff" />
      </TouchableOpacity>
    </View>
  );
};

export default ServicesScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ffffff",
    paddingHorizontal: 20,
    paddingTop: 10,
  },

  loaderWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
  },
  header: {
    marginBottom: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    color: "#333",
  },
  subtitle: {
    marginTop: 4,
    color: "#777",
    fontSize: 13,
  },
  card: {
    backgroundColor: "#ffffff",
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#eee",
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
  },
  cardMeta: {
    marginTop: 6,
    fontSize: 12,
    color: "#777",
  },
  price: {
    marginTop: 10,
    fontSize: 15,
    fontWeight: "700",
    color: "#a580e9",
  },
  fab: {
    position: "absolute",
    right: 20,
    bottom: 100,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#a580e9",
    alignItems: "center",
    justifyContent: "center",
    elevation: 4,
  },
  sectionHeader: {
    marginTop: 20,
    marginBottom: 8,
    fontSize: 13,
    fontWeight: "700",
    color: "#a580e9",
    letterSpacing: 1,
  },
});
