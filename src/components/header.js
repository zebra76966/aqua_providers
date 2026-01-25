// src/components/Header.js
import React, { useEffect, useState, useContext } from "react";
import { View, Image, StyleSheet, TouchableOpacity, Text } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation } from "@react-navigation/native";
import { AuthContext } from "../authcontext";

export default function Header() {
  const [profileImage, setProfileImage] = useState(require("../assets/user.jpg"));
  const navigation = useNavigation();
  const { role } = useContext(AuthContext);

  useEffect(() => {
    const loadProfileImage = async () => {
      try {
        const savedImage = await AsyncStorage.getItem("localProfileImage");
        if (savedImage) {
          setProfileImage({ uri: savedImage });
        }
      } catch (error) {
        console.error("Error loading profile image:", error);
      }
    };

    loadProfileImage();
    const interval = setInterval(loadProfileImage, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <View style={styles.headerRow}>
      <Image source={require("../assets/icon.png")} style={styles.logo} />

      <View style={styles.headerIcons}>
        <TouchableOpacity style={styles.astronautBtn} activeOpacity={0.85}>
          <Ionicons name="rocket-outline" size={18} color="#a580e9" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.switchBtn} activeOpacity={0.85} onPress={() => navigation.navigate("ApplicationStatus")}>
          <Ionicons name="swap-horizontal-outline" size={16} color="#004d40" />
          <Text style={styles.switchText}>Switch</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 12,
    backgroundColor: "#ffffff",
    borderBottomWidth: 1,
    borderColor: "#f0eaff",
  },

  logo: {
    width: 38,
    height: 38,
  },

  headerIcons: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },

  astronautBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#faf7ff",
    borderWidth: 1,
    borderColor: "#e7dbff",
    shadowColor: "#a580e9",
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
  },

  switchBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 18,
    backgroundColor: "#a580e9",
    shadowColor: "#a580e9",
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },

  switchText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#004d40",
  },
});
