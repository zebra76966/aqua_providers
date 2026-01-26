import React, { useContext, useEffect, useRef, useState } from "react";
import { View, Text, StyleSheet, ActivityIndicator, Animated, Alert, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { baseUrl } from "../config";
import { AuthContext } from "../authcontext";
import { useFocusEffect } from "@react-navigation/native";

const ApplicationStatusScreen = ({ navigation, route }) => {
  const { token, logout, setRole, role } = useContext(AuthContext);
  const fromDashboard = route?.params?.fromDashboard === true;

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  const [isLoading, setIsLoading] = useState(true);

  const [error, setError] = useState("");
  const [showRolePicker, setShowRolePicker] = useState(false);

  const [consultantStatus, setConsultantStatus] = useState(null);
  const [breederStatus, setBreederStatus] = useState(null);
  const [consultantMsg, setConsultantMsg] = useState("");
  const [breederMsg, setBreederMsg] = useState("");

  const [roleSelector, setRoleSelector] = useState(false);

  const handleLogout = () => {
    Alert.alert("Logout", "Are you sure?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Logout",
        style: "destructive",
        onPress: async () => {
          await logout();
          navigation.reset({ index: 0, routes: [{ name: "Login" }] });
        },
      },
    ]);
  };

  const fetchStatus = async () => {
    try {
      setIsLoading(true);

      const [cRes, bRes] = await Promise.all([
        fetch(`${baseUrl}/consultants/application/status/`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${baseUrl}/breeders/application/status/`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      if (cRes.status === 401 || bRes.status === 401) {
        await logout();
        navigation.reset({ index: 0, routes: [{ name: "Login" }] });
        return;
      }

      const cJson = await cRes.json().catch(() => null);
      const bJson = await bRes.json().catch(() => null);

      const cStatus = cRes.ok ? (cJson?.data?.status?.admin_status ?? (cJson?.data?.status?.application_status ? cJson.data.status.application_status : "not_applied")) : "not_applied";

      const bStatus = bRes.ok ? (bJson?.data?.status?.admin_status ?? (bJson?.data?.status?.application_status ? bJson.data.status.application_status : "not_applied")) : "not_applied";
      console.log("here-----------4", cStatus);
      console.log("here-----------5", bStatus);
      setConsultantStatus(cStatus);
      setBreederStatus(bStatus);
      setConsultantMsg(cJson?.data?.message || "");
      setBreederMsg(bJson?.data?.message || "");

      // Auto-route if one is approved

      if (bStatus === "approved" && cStatus === "approved") {
        console.log("here-----------45");

        setRoleSelector(true);

        return;
      }

      // Auto-route only if NOT coming from dashboard
      if (!fromDashboard) {
        if (bStatus === "approved" && cStatus === "approved") {
          setRoleSelector(true);
          return;
        }

        if (cStatus === "approved" && bStatus !== "approved") {
          setRole("consultant");
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
          }, 600);
          return;
        }

        if (bStatus === "approved" && cStatus !== "approved") {
          setRole("breeder");
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
          }, 600);
          return;
        }
      }
    } catch (e) {
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

  const HandleRoleSelection = (role) => {
    console.log("role", role);
    setRole(role);

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
    }, 200);
  };

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

  const getStatusIcon = (status) => {
    switch (status) {
      case "approved":
        return { name: "checkmark-circle-outline", color: "#4caf50" };
      case "pending":
        return { name: "time-outline", color: "#a580e9" };
      case "rejected":
        return { name: "close-circle-outline", color: "#f44336" };
      default:
        return { name: "help-circle-outline", color: "#999" };
    }
  };

  const renderContent = () => {
    const noneApplied = consultantStatus === "not_applied" && breederStatus === "not_applied";

    const showConsultantStatus = consultantStatus && consultantStatus !== "not_applied";
    const showBreederStatus = breederStatus && breederStatus !== "not_applied";

    console.log("authRole", role);

    if (noneApplied && !showRolePicker) {
      return (
        <>
          <Ionicons name="sparkles-outline" size={64} color="#a580e9" />
          <Text style={styles.title}>Choose Your Path</Text>
          <Text style={styles.desc}>How would you like to join Aqua?</Text>

          <View style={styles.roleWrap}>
            <TouchableOpacity style={styles.roleCard} onPress={() => navigation.navigate("CreateBusinessProfile")}>
              <Ionicons name="briefcase-outline" size={32} color="#a580e9" />
              <Text style={styles.roleTitle}>Consultant</Text>
              <Text style={styles.roleDesc}>Offer services, manage bookings, grow your business.</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.roleCard} onPress={() => navigation.navigate("CreateBreederProfile")}>
              <Ionicons name="fish-outline" size={32} color="#a580e9" />
              <Text style={styles.roleTitle}>Breeder</Text>
              <Text style={styles.roleDesc}>Sell species, manage inquiries, build your brand.</Text>
            </TouchableOpacity>
          </View>
        </>
      );
    }

    if (consultantStatus === "approved" && breederStatus === "approved") {
      return (
        <>
          <Ionicons name="sparkles-outline" size={64} color="#a580e9" />
          <Text style={styles.title}>Open As</Text>
          <Text style={styles.desc}>Select you Role for today</Text>

          <View style={styles.roleWrap}>
            <TouchableOpacity style={styles.roleCard} onPress={() => HandleRoleSelection("consultant")}>
              <Ionicons name="briefcase-outline" size={32} color="#a580e9" />
              <Text style={styles.roleTitle}>Consultant</Text>
              <Text style={styles.roleDesc}>Offer services, manage bookings, grow your business.</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.roleCard} onPress={() => HandleRoleSelection("breeder")}>
              <Ionicons name="fish-outline" size={32} color="#a580e9" />
              <Text style={styles.roleTitle}>Breeder</Text>
              <Text style={styles.roleDesc}>Sell species, manage inquiries, build your brand.</Text>
            </TouchableOpacity>
          </View>
        </>
      );
    }

    return (
      <View style={{ width: "100%", gap: 16 }}>
        {showConsultantStatus &&
          (() => {
            const icon = getStatusIcon(consultantStatus);
            return (
              <View style={styles.card}>
                <Ionicons name={icon.name} size={40} color={icon.color} />
                <Text style={styles.title}>Consultant</Text>
                <Text style={styles.desc}>{consultantStatus.toUpperCase()}</Text>
                {!!consultantMsg && <Text style={styles.sub}>{consultantMsg}</Text>}
              </View>
            );
          })()}

        {showBreederStatus &&
          (() => {
            const icon = getStatusIcon(breederStatus);
            return (
              <View style={styles.card}>
                <Ionicons name={icon.name} size={40} color={icon.color} />
                <Text style={styles.title}>Breeder</Text>
                <Text style={styles.desc}>{breederStatus.toUpperCase()}</Text>
                {!!breederMsg && <Text style={styles.sub}>{breederMsg}</Text>}
              </View>
            );
          })()}

        <View style={styles.roleWrap}>
          {consultantStatus == "not_applied" && (
            <TouchableOpacity style={styles.roleCard} onPress={() => navigation.navigate("CreateBusinessProfile")}>
              <Ionicons name="briefcase-outline" size={32} color="#a580e9" />
              <Text style={styles.roleTitle}>Apply for Consultant</Text>
              <Text style={styles.roleDesc}>Offer services, manage bookings, grow your business.</Text>
            </TouchableOpacity>
          )}
          {breederStatus == "not_applied" && (
            <TouchableOpacity style={styles.roleCard} onPress={() => navigation.navigate("CreateBreederProfile")}>
              <Ionicons name="fish-outline" size={32} color="#a580e9" />
              <Text style={styles.roleTitle}>Apply for Breeder</Text>
              <Text style={styles.roleDesc}>Sell species, manage inquiries, build your brand.</Text>
            </TouchableOpacity>
          )}
        </View>

        <TouchableOpacity style={[styles.button, styles.logoutBtn]} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={18} color="#fff" />
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>
    );
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

  logoutBtn: {
    backgroundColor: "#ff4d4d",
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
    marginTop: 10,
  },
  logoutText: { color: "#fff", fontWeight: "bold" },
});
