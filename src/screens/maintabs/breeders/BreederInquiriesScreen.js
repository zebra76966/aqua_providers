// BreederInquiriesScreen.js
import React, { useContext, useEffect, useRef, useState } from "react";
import { View, Text, StyleSheet, Animated, TouchableOpacity, ActivityIndicator, FlatList } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { AuthContext } from "../../../authcontext";
import { baseUrl } from "../../../config";

const BreederInquiriesScreen = ({ navigation }) => {
  const { token } = useContext(AuthContext);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  const [loading, setLoading] = useState(true);
  const [inquiries, setInquiries] = useState([]);
  const [error, setError] = useState("");

  const fetchInquiries = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${baseUrl}/breeders/inquiries/?status=pending`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      console.log("res", res);

      const json = await res.json();

      if (!res.ok) {
        throw new Error(json.message || "Failed to load inquiries");
      }

      setInquiries(json.data || []);
    } catch (e) {
      setError(e.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInquiries();

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

  const renderItem = ({ item }) => (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={0.85}
      onPress={() =>
        navigation.navigate("BreederInquiryDetail", {
          id: item.id,
        })
      }
    >
      <View style={styles.cardTop}>
        <Text style={styles.name}>{item.name || "Customer"}</Text>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>PENDING</Text>
        </View>
      </View>

      <Text numberOfLines={2} style={styles.preview}>
        {item.message || "New inquiry received"}
      </Text>

      <View style={styles.cardFooter}>
        <Ionicons name="time-outline" size={14} color="#777" />
        <Text style={styles.time}>{item.created_at || "Just now"}</Text>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#a580e9" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.center}>
        <Text style={{ color: "#b00020" }}>{error}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="chevron-back" size={28} color="#a580e9" />
          </TouchableOpacity>
          <Text style={styles.title}>Inquiries</Text>
        </View>

        {inquiries.length === 0 ? (
          <View style={styles.emptyWrap}>
            <Ionicons name="mail-open-outline" size={64} color="#a580e9" />
            <Text style={styles.emptyTitle}>No new inquiries</Text>
            <Text style={styles.emptyDesc}>You’re all caught up for now.</Text>
          </View>
        ) : (
          <FlatList data={inquiries} keyExtractor={(item) => String(item.id)} renderItem={renderItem} contentContainerStyle={{ paddingBottom: 40 }} showsVerticalScrollIndicator={false} />
        )}
      </Animated.View>
    </View>
  );
};

export default BreederInquiriesScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    color: "#333",
  },
  card: {
    backgroundColor: "#faf7ff",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#e7dbff",
  },
  cardTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  name: {
    fontSize: 15,
    fontWeight: "700",
    color: "#333",
  },
  badge: {
    backgroundColor: "#efe6ff",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#a580e9",
  },
  preview: {
    fontSize: 13,
    color: "#666",
    marginBottom: 10,
  },
  cardFooter: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  time: {
    fontSize: 11,
    color: "#777",
  },
  emptyWrap: {
    marginTop: 80,
    alignItems: "center",
  },
  emptyTitle: {
    marginTop: 16,
    fontSize: 18,
    fontWeight: "700",
    color: "#333",
  },
  emptyDesc: {
    marginTop: 6,
    fontSize: 13,
    color: "#666",
  },
});
