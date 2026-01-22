import React, { useContext, useEffect, useRef, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Animated, Alert, ActivityIndicator, Platform } from "react-native";
import DateTimePicker, { DateTimePickerAndroid } from "@react-native-community/datetimepicker";

import { Ionicons } from "@expo/vector-icons";
import { baseUrl } from "../../config";
import { AuthContext } from "../../authcontext";

const formatDate = (iso) => {
  const d = new Date(iso);
  return d.toLocaleString();
};

const BookingDetailsScreen = ({ route, navigation }) => {
  const { token } = useContext(AuthContext);
  const { booking } = route.params;

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  const [showPicker, setShowPicker] = useState(false);
  const [newDate, setNewDate] = useState(new Date(booking.scheduled_start));
  const [isLoading, setIsLoading] = useState(false);

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

  const handleReschedule = async () => {
    try {
      setIsLoading(true);

      const res = await fetch(`${baseUrl}/consultants/consultant/bookings/${booking.id}/reschedule/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          new_scheduled_start: newDate.toISOString(),
        }),
      });

      console.log("Reschedule response:", res);
      const json = await res.json();

      if (!res.ok) {
        Alert.alert("Error", json.message || "Reschedule failed");
        return;
      }

      Alert.alert("Success", "Booking rescheduled");
      navigation.goBack();
    } catch {
      Alert.alert("Error", "Something went wrong");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = async () => {
    Alert.alert("Cancel Booking", "Are you sure?", [
      { text: "No" },
      {
        text: "Yes",
        style: "destructive",
        onPress: async () => {
          try {
            setIsLoading(true);
            const res = await fetch(`${baseUrl}/consultants/consultant/bookings/${booking.id}/update-status/`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
              },
              body: JSON.stringify({ action: "cancel" }),
            });

            const json = await res.json();

            if (!res.ok) {
              Alert.alert("Error", json.message || "Cancel failed");
              return;
            }

            Alert.alert("Cancelled", "Booking cancelled");
            navigation.goBack();
          } catch {
            Alert.alert("Error", "Something went wrong");
          } finally {
            setIsLoading(false);
          }
        },
      },
    ]);
  };

  const serviceLabel = booking.services?.[0]?.label || "Service";

  return (
    <View style={styles.container}>
      <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => {
              if (navigation.canGoBack()) {
                navigation.goBack();
              } else {
                navigation.navigate("Bookings", {
                  screen: "BookingHome",
                });
              }
            }}
          >
            <Ionicons name="chevron-back" size={28} color="#a580e9" />
          </TouchableOpacity>

          <Text style={styles.title}>Booking Details</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>{serviceLabel}</Text>
          <Text style={styles.meta}>{booking.user_state}</Text>

          <View style={styles.row}>
            <Text style={styles.label}>Start</Text>
            <Text style={styles.value}>{formatDate(booking.scheduled_start)}</Text>
          </View>

          <View style={styles.row}>
            <Text style={styles.label}>End</Text>
            <Text style={styles.value}>{formatDate(booking.scheduled_end)}</Text>
          </View>

          <View style={styles.row}>
            <Text style={styles.label}>Duration</Text>
            <Text style={styles.value}>{booking.duration_minutes} min</Text>
          </View>

          <View style={styles.row}>
            <Text style={styles.label}>Price</Text>
            <Text style={styles.price}>${booking.full_price}</Text>
          </View>
        </View>

        {booking.can_reschedule && (
          <>
            <TouchableOpacity
              style={styles.outlineBtn}
              onPress={() => {
                if (Platform.OS === "android") {
                  DateTimePickerAndroid.open({
                    value: newDate,
                    mode: "datetime",
                    onChange: (event, selectedDate) => {
                      if (event?.type === "dismissed") return;
                      if (selectedDate) setNewDate(selectedDate);
                    },
                  });
                } else {
                  setShowPicker(true);
                }
              }}
            >
              <Ionicons name="calendar-outline" size={18} color="#a580e9" />
              <Text style={styles.outlineText}>Pick New Date & Time</Text>
            </TouchableOpacity>

            {Platform.OS === "ios" && showPicker && (
              <DateTimePicker
                value={newDate}
                mode="datetime"
                display="spinner"
                onChange={(event, selectedDate) => {
                  if (selectedDate) setNewDate(selectedDate);
                }}
              />
            )}

            <TouchableOpacity style={styles.button} onPress={handleReschedule} disabled={isLoading}>
              {isLoading ? <ActivityIndicator color="#004d40" /> : <Text style={styles.buttonText}>Reschedule to {newDate.toLocaleString()}</Text>}
            </TouchableOpacity>
          </>
        )}

        {booking.can_cancel && (
          <TouchableOpacity style={styles.dangerBtn} onPress={handleCancel}>
            <Text style={styles.dangerText}>Cancel Booking</Text>
          </TouchableOpacity>
        )}
      </Animated.View>
    </View>
  );
};

export default BookingDetailsScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 20,
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
  cardTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
  },
  meta: {
    marginTop: 4,
    fontSize: 12,
    color: "#777",
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 10,
  },
  label: {
    fontSize: 12,
    color: "#666",
  },
  value: {
    fontSize: 12,
    color: "#333",
  },
  price: {
    fontSize: 14,
    fontWeight: "700",
    color: "#a580e9",
  },
  outlineBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderWidth: 1,
    borderColor: "#a580e9",
    padding: 12,
    borderRadius: 10,
    marginBottom: 12,
  },
  outlineText: {
    color: "#a580e9",
    fontSize: 14,
  },
  button: {
    backgroundColor: "#a580e9",
    padding: 14,
    borderRadius: 10,
    alignItems: "center",
    marginBottom: 16,
  },
  buttonText: {
    color: "#004d40",
    fontWeight: "bold",
  },
  dangerBtn: {
    borderWidth: 1,
    borderColor: "#f44336",
    padding: 12,
    borderRadius: 10,
    alignItems: "center",
  },
  dangerText: {
    color: "#f44336",
    fontWeight: "600",
  },
});
