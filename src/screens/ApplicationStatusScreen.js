import React, { useContext, useEffect, useRef, useState } from "react";
import { View, Text, StyleSheet, ActivityIndicator, Animated, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { baseUrl } from "../config";
import { AuthContext } from "../authcontext";
import { useFocusEffect } from "@react-navigation/native";

const ApplicationStatusScreen = ({ navigation }) => {
  const { token } = useContext(AuthContext);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  const [isLoading, setIsLoading] = useState(true);
  const [status, setStatus] = useState(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [showRolePicker, setShowRolePicker] = useState(false);

  const fetchStatus = async () => {
    try {
      setIsLoading(true);

      const res = await fetch(`${baseUrl}/consultants/application/status/`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      const json = await res.json();
      console.log("Application status:", json);

      if (!res.ok) {
        if (json.message == "No consultant profile found") {
          setStatus("not_applied");
          return;
        } else {
          setError(json.message || "Failed to load status");
          return;
        }
      }

      const data = json.data || json;

      const appStatus = data.status?.application_status; // pending | approved | rejected
      setStatus(appStatus);
      setMessage(data.message || "");

      if (appStatus === "approved") {
        setTimeout(() => {
          navigation.reset({
            index: 0,
            routes: [
              {
                name: "MainTabs",
                state: {
                  index: 0,
                  routes: [{ name: "Dashboard" }],
                },
              },
            ],
          });
        }, 800);
      }
    } catch {
      setError("Something went wrong");
    } finally {
      setIsLoading(false);
    }
  };

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

  useFocusEffect(
    React.useCallback(() => {
      fetchStatus();

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
    }, []),
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

  const renderContent = () => {
    switch (status) {
      case "pending":
        return (
          <>
            <Ionicons name="time-outline" size={64} color="#a580e9" />
            <Text style={styles.title}>Application Under Review</Text>
            <Text style={styles.desc}>We’re reviewing your application. This usually takes a short while.</Text>
            {message ? <Text style={styles.sub}>{message}</Text> : null}
          </>
        );

      case "rejected":
        return (
          <>
            <Ionicons name="close-circle-outline" size={64} color="#f44336" />
            <Text style={styles.title}>Application Rejected</Text>
            <Text style={styles.desc}>Unfortunately, your application was not approved.</Text>
            {message ? <Text style={styles.sub}>{message}</Text> : null}

            <TouchableOpacity style={styles.outlineBtn}>
              <Text style={styles.outlineText}>Reapply (Coming Soon)</Text>
            </TouchableOpacity>
          </>
        );

      case "not_applied":
        if (showRolePicker) {
          return (
            <>
              <Ionicons name="sparkles-outline" size={64} color="#a580e9" />
              <Text style={styles.title}>Choose Your Path</Text>
              <Text style={styles.desc}>How would you like to join Aqua?</Text>

              <View style={styles.roleWrap}>
                {/* Consultant */}
                <TouchableOpacity
                  style={styles.roleCard}
                  activeOpacity={0.9}
                  onPress={() =>
                    navigation.navigate("CreateBusinessProfile", {
                      from: "status",
                    })
                  }
                >
                  <Ionicons name="briefcase-outline" size={32} color="#a580e9" />
                  <Text style={styles.roleTitle}>Consultant</Text>
                  <Text style={styles.roleDesc}>Offer services, manage bookings, grow your business.</Text>
                </TouchableOpacity>

                {/* Breeder (Disabled) */}
                <View style={[styles.roleCard, styles.roleDisabled]}>
                  <Ionicons name="fish-outline" size={32} color="#bbb" />
                  <Text style={[styles.roleTitle, { color: "#aaa" }]}>Breeder</Text>
                  <Text style={styles.roleDesc}>Coming soon</Text>
                </View>
              </View>
            </>
          );
        }

        return (
          <>
            <Ionicons name="briefcase-outline" size={64} color="#a580e9" />
            <Text style={styles.title}>Become a Consultant</Text>
            <Text style={styles.desc}>You haven’t applied yet. Start your journey as a provider.</Text>

            <TouchableOpacity style={styles.button} onPress={() => setShowRolePicker(true)}>
              <Text style={styles.buttonText}>Apply Now</Text>
            </TouchableOpacity>
          </>
        );

      case "approved":
        return (
          <>
            <Ionicons name="checkmark-circle-outline" size={64} color="#4caf50" />
            <Text style={styles.title}>Approved!</Text>
            <Text style={styles.desc}>Your consultant profile is live. Taking you to your dashboard…</Text>
          </>
        );

      default:
        return null;
    }
  };

  return (
    <View style={styles.container}>
      <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
        <View style={styles.card}>{renderContent()}</View>
      </Animated.View>
    </View>
  );
};

export default ApplicationStatusScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    paddingHorizontal: 24,
    justifyContent: "center",
  },
  loaderWrap: {
    flex: 1,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
  card: {
    backgroundColor: "#faf7ff",
    borderRadius: 18,
    padding: 24,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#e7dbff",
  },
  title: {
    marginTop: 16,
    fontSize: 20,
    fontWeight: "700",
    color: "#333",
    textAlign: "center",
  },
  desc: {
    marginTop: 8,
    fontSize: 14,
    color: "#666",
    textAlign: "center",
  },
  sub: {
    marginTop: 6,
    fontSize: 12,
    color: "#888",
    textAlign: "center",
  },
  button: {
    marginTop: 20,
    backgroundColor: "#a580e9",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 10,
  },
  buttonText: {
    color: "#004d40",
    fontWeight: "700",
  },
  outlineBtn: {
    marginTop: 20,
    borderWidth: 1,
    borderColor: "#a580e9",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 10,
  },
  outlineText: {
    color: "#a580e9",
    fontWeight: "600",
  },
  roleWrap: {
    marginTop: 20,
    width: "100%",
    gap: 14,
  },

  roleCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: "#e7dbff",
    alignItems: "center",
  },

  roleDisabled: {
    opacity: 0.5,
  },

  roleTitle: {
    marginTop: 8,
    fontSize: 16,
    fontWeight: "700",
    color: "#333",
  },

  roleDesc: {
    marginTop: 4,
    fontSize: 12,
    color: "#777",
    textAlign: "center",
  },
});
