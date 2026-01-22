import React, { useContext, useEffect, useRef, useState } from "react";
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Animated, Alert } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { baseUrl } from "../../config";
import { AuthContext } from "../../authcontext";

const TABS = ["pending", "active", "completed"];

const BookingsScreen = ({ navigation }) => {
  const { token } = useContext(AuthContext);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  const [activeTab, setActiveTab] = useState("pending");
  const [isLoading, setIsLoading] = useState(true);
  const [bookings, setBookings] = useState([]);
  const [error, setError] = useState("");

  const fetchBookings = async () => {
    try {
      setIsLoading(true);
      const res = await fetch(`${baseUrl}/consultants/consultant/bookings?status=${activeTab}`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      const json = await res.json();
      console.log("Bookings data:", json);

      if (!res.ok) {
        setError(json.message || "Failed to load bookings");
        return;
      }

      setBookings(json.data || []);
    } catch (e) {
      setError("Something went wrong");
    } finally {
      setIsLoading(false);
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      fetchBookings();
    }, [activeTab]),
  );

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

  const formatDate = (iso) => {
    const d = new Date(iso);
    return d.toLocaleString();
  };

  const updateStatus = async (id, action) => {
    try {
      const res = await fetch(`${baseUrl}/consultants/consultant/bookings/${id}/update-status/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ action }),
      });

      const json = await res.json();

      if (!res.ok) {
        Alert.alert("Error", json.message || "Action failed");
        return;
      }

      fetchBookings();
    } catch {
      Alert.alert("Error", "Something went wrong");
    }
  };

  return (
    <View style={styles.container}>
      <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
        <Text style={styles.title}>Bookings</Text>

        <View style={styles.tabs}>
          {TABS.map((t) => (
            <TouchableOpacity key={t} style={[styles.tab, activeTab === t && styles.tabActive]} onPress={() => setActiveTab(t)}>
              <Text style={[styles.tabText, activeTab === t && styles.tabTextActive]}>{t.toUpperCase()}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </Animated.View>

      {isLoading ? (
        <View style={styles.loaderWrap}>
          <ActivityIndicator size="large" color="#a580e9" />
        </View>
      ) : error ? (
        <View style={styles.loaderWrap}>
          <Text style={{ color: "#b00020" }}>{error}</Text>
        </View>
      ) : (
        <FlatList
          data={bookings}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingBottom: 140 }}
          renderItem={({ item }) => {
            const serviceLabel = item.services?.[0]?.label || "Service";
            const timeRange = `${formatDate(item.scheduled_start)} → ${formatDate(item.scheduled_end)}`;

            return (
              <TouchableOpacity style={styles.card} onPress={() => navigation.navigate("BookingDetails", { booking: item })}>
                <View style={styles.cardHeader}>
                  <Text style={styles.cardTitle}>{serviceLabel}</Text>
                  <Text style={styles.cardMeta}>{item.status}</Text>
                </View>

                <Text style={styles.cardSub}>{timeRange}</Text>

                <View style={styles.rowBetween}>
                  <Text style={styles.stateText}>{item.user_state}</Text>
                  <Text style={styles.price}>${item.full_price}</Text>
                </View>

                {(item.status === "pending" || item.status === "accepted") && (
                  <View style={styles.actions}>
                    {item.status === "pending" && (
                      <>
                        <ActionBtn icon="checkmark" color="#4caf50" onPress={() => updateStatus(item.id, "confirm")} />
                        <ActionBtn icon="close" color="#f44336" onPress={() => updateStatus(item.id, "decline")} />
                      </>
                    )}

                    {item.can_cancel && <ActionBtn icon="trash-outline" color="#f44336" onPress={() => updateStatus(item.id, "cancel")} />}

                    {item.can_reschedule && <ActionBtn icon="calendar-outline" color="#ff9800" onPress={() => navigation.navigate("BookingDetails", { booking: item })} />}
                  </View>
                )}
              </TouchableOpacity>
            );
          }}
        />
      )}
    </View>
  );
};

const ActionBtn = ({ icon, color, onPress }) => (
  <TouchableOpacity style={[styles.actionBtn, { borderColor: color }]} onPress={onPress}>
    <Ionicons name={icon} size={18} color={color} />
  </TouchableOpacity>
);

export default BookingsScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    color: "#333",
  },
  tabs: {
    flexDirection: "row",
    marginTop: 14,
    marginBottom: 20,
  },
  tab: {
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#a580e9",
    marginRight: 8,
  },
  tabActive: {
    backgroundColor: "#a580e9",
  },
  tabText: {
    fontSize: 12,
    color: "#a580e9",
  },
  tabTextActive: {
    color: "#004d40",
    fontWeight: "600",
  },
  loaderWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#eee",
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: "#333",
  },
  cardMeta: {
    fontSize: 11,
    color: "#777",
  },
  cardSub: {
    marginTop: 6,
    fontSize: 12,
    color: "#666",
  },
  actions: {
    flexDirection: "row",
    marginTop: 12,
  },
  actionBtn: {
    borderWidth: 1,
    borderRadius: 20,
    padding: 8,
    marginRight: 10,
  },
  rowBetween: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 6,
  },
  stateText: {
    fontSize: 12,
    color: "#666",
  },
  price: {
    fontSize: 14,
    fontWeight: "700",
    color: "#a580e9",
  },
});
