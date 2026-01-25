import React, { useContext, useEffect, useRef, useState } from "react";
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Animated, ActivityIndicator, ScrollView, Alert, Switch } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { baseUrl } from "../../config";
import { AuthContext } from "../../authcontext";

const BusinessProfileScreen = ({ navigation }) => {
  const { token, role } = useContext(AuthContext);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isEdit, setIsEdit] = useState(false);

  const [companyName, setCompanyName] = useState("");
  const [bio, setBio] = useState("");
  const [website, setWebsite] = useState("");
  const [instagram, setInstagram] = useState("");
  const [facebook, setFacebook] = useState("");
  const [policy, setPolicy] = useState("");
  const [autoAccept, setAutoAccept] = useState(true);

  const fetchProfile = async () => {
    try {
      const res = await fetch(`${baseUrl}/consultants/profile/`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) return;

      const json = await res.json();
      const data = json?.data || json;

      if (data?.company_name) {
        setIsEdit(true);
        setCompanyName(data.company_name || "");
        setBio(data.bio || "");
        setWebsite(data.website || "");
        setInstagram(data.instagram || "");
        setFacebook(data.facebook || "");
        setPolicy(data.cancellation_policy || "");
        setAutoAccept(!!data.auto_accept);
      }
    } catch (e) {
      console.log("Business fetch error", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();

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
    if (!companyName.trim()) {
      Alert.alert("Missing", "Company name is required");
      return;
    }

    try {
      setSaving(true);

      const res = await fetch(`${baseUrl}/consultants/apply/`, {
        method: "OPTIONS",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          company_name: companyName,
          bio,
          website,
          instagram,
          facebook,
          cancellation_policy: policy,
          auto_accept: autoAccept,
        }),
      });

      console.log("Save business response:", res);
      const json = await res.json();

      if (!res.ok) {
        Alert.alert("Error", json.message || "Failed to save business");
        return;
      }

      Alert.alert("Success", isEdit ? "Business updated" : "Business created");
      navigation.goBack();
    } catch {
      Alert.alert("Error", "Something went wrong");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loaderWrap}>
        <ActivityIndicator size="large" color="#a580e9" />
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="chevron-back" size={28} color="#a580e9" />
          </TouchableOpacity>
          <Text style={styles.title}>{isEdit ? "Edit Business" : "Create Business"}</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Business Info</Text>

          <TextInput editable={false} style={[styles.input, styles.readOnly]} placeholder="Company Name" value={companyName} onChangeText={setCompanyName} />
          <TextInput editable={false} style={[styles.input, { height: 80 }, styles.readOnly]} placeholder="Short bio" value={bio} onChangeText={setBio} multiline />
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Online Presence</Text>

          <TextInput editable={false} style={[styles.input, styles.readOnly]} placeholder="Website" value={website} onChangeText={setWebsite} />
          <TextInput editable={false} style={[styles.input, styles.readOnly]} placeholder="Instagram" value={instagram} onChangeText={setInstagram} />
          <TextInput editable={false} style={[styles.input, styles.readOnly]} placeholder="Facebook" value={facebook} onChangeText={setFacebook} />
        </View>

        {/* <View style={styles.card}>
          <Text style={styles.sectionTitle}>Policies & Automation</Text>

          <TextInput  style={[styles.input, { height: 70 }]} placeholder="Cancellation policy" value={policy} onChangeText={setPolicy} multiline />

          <View style={styles.switchRow}>
            <Text style={styles.switchLabel}>Auto-accept bookings</Text>
            <Switch value={autoAccept} onValueChange={setAutoAccept} />
          </View>
        </View> */}

        {/* <TouchableOpacity style={styles.button} onPress={handleSave} disabled={saving}>
          {saving ? <ActivityIndicator color="#004d40" /> : <Text style={styles.buttonText}>Save Business</Text>}
        </TouchableOpacity> */}
      </Animated.View>
    </ScrollView>
  );
};

export default BusinessProfileScreen;

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: "#fff",
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 150,
  },
  loaderWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
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
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#333",
    marginBottom: 10,
  },
  input: {
    borderWidth: 1,
    borderColor: "#a580e9",
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
    color: "#000",
    backgroundColor: "#fff",
  },
  switchRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 6,
  },
  switchLabel: {
    fontSize: 13,
    color: "#333",
    fontWeight: "600",
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
  readOnly: {
    backgroundColor: "#f3f3f3",
  },
});
