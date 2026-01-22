import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";

export default function BookingSuccessModal({ visible, onViewBookings, onClose }) {
  if (!visible) return null;

  return (
    <View style={styles.overlay}>
      <View style={styles.card}>
        <Ionicons name="checkmark-circle" size={72} color="#ffe5acff" />

        <Text style={styles.title}>Boooking Requested</Text>
        <Text style={styles.subtitle}>Your booking request was successful and the booking is waiting for consultant's confimation. </Text>

        <TouchableOpacity style={styles.primaryBtn} onPress={onViewBookings}>
          <Text style={styles.primaryText}>View My Bookings</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={onClose}>
          <Text style={styles.secondaryText}>Done</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: "absolute",
    inset: 0,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000,
  },
  card: {
    backgroundColor: "#fff",
    padding: 24,
    borderRadius: 20,
    width: "85%",
    alignItems: "center",
  },
  title: {
    fontSize: 20,
    fontWeight: "800",
    marginTop: 12,
  },
  subtitle: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    marginVertical: 10,
  },
  primaryBtn: {
    backgroundColor: "#a580e9",
    paddingVertical: 14,
    width: "100%",
    borderRadius: 14,
    marginTop: 14,
  },
  primaryText: {
    textAlign: "center",
    fontWeight: "700",
  },
  secondaryText: {
    marginTop: 14,
    color: "#777",
  },
});
