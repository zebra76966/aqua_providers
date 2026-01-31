import React, { useContext, useEffect, useRef, useState } from "react";
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, ActivityIndicator, Alert, Animated, Switch } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { baseUrl } from "../config";
import { AuthContext } from "../authcontext";

const CreateBusinessProfileScreen = ({ navigation, route }) => {
  const { token } = useContext(AuthContext);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [servicesList, setServicesList] = useState([]);
  const [selectedServices, setSelectedServices] = useState([]);

  const [companyName, setCompanyName] = useState("");
  const [bio, setBio] = useState("");
  const [website, setWebsite] = useState("");
  const [instagram, setInstagram] = useState("");
  const [facebook, setFacebook] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [years, setYears] = useState("");
  const [specialization, setSpecialization] = useState("");
  const [certifications, setCertifications] = useState("");

  const [agreeTerms, setAgreeTerms] = useState(false);
  const [agreeGuidelines, setAgreeGuidelines] = useState(false);

  const isEdit = route?.params?.mode === "edit";

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

    loadAll();
  }, []);

  const loadAll = async () => {
    try {
      setLoading(true);

      const [servicesRes, profileRes] = await Promise.all([
        fetch(`${baseUrl}/consultants/services/`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${baseUrl}/consultants/profile/`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      const servicesJson = await servicesRes.json();
      const profileJson = profileRes.ok ? await profileRes.json() : null;

      const allServices = Object.values(servicesJson?.data || {}).flat();
      setServicesList(allServices);

      if (profileJson?.data) {
        const p = profileJson.data;

        setCompanyName(p.company_name || "");
        setBio(p.bio || "");
        setWebsite(p.website || "");
        setInstagram(p.instagram || "");
        setFacebook(p.facebook || "");
        setPhone(p.business_phone || "");
        setAddress(p.business_address || "");
        setYears(p.years_experience ? String(p.years_experience) : "");
        setSpecialization(p.specialization || "");
        setCertifications((p.certifications || []).join(", "));
        setSelectedServices(p.services || []);
      }
    } catch (e) {
      console.log(e);
    } finally {
      setLoading(false);
    }
  };

  const toggleService = (id) => {
    setSelectedServices((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const handleSubmit = async () => {
    if (!companyName || !bio || !selectedServices.length) {
      Alert.alert("Missing fields", "Please fill required fields");
      return;
    }

    if (!agreeTerms || !agreeGuidelines) {
      Alert.alert("Required", "You must agree to terms & guidelines");
      return;
    }

    try {
      setSubmitting(true);

      const payload = {
        company_name: companyName,
        bio,
        website,
        instagram,
        facebook,
        business_phone: phone,
        business_address: address,
        services: selectedServices,
        years_experience: Number(years) || 0,
        specialization,
        certifications: certifications
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
        agree_terms: true,
        agree_guidelines: true,
      };

      const res = await fetch(`${baseUrl}/consultants/apply/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      console.log("Submission response:", json);

      if (!res.ok) {
        Alert.alert("Error", json.message || "Submission failed");
        return;
      }

      Alert.alert("Success", isEdit ? "Profile updated" : "Application submitted");

      if (route?.params?.from === "status") {
        navigation.goBack();
      } else {
        navigation.goBack();
      }
    } catch {
      Alert.alert("Error", "Something went wrong");
    } finally {
      setSubmitting(false);
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
          <Text style={styles.title}>{isEdit ? "Edit Business" : "Apply as Consultant"}</Text>
        </View>

        <TextInput style={styles.input} placeholder="Company Name" placeholderTextColor="#8A8A8A" value={companyName} onChangeText={setCompanyName} />
        <TextInput style={[styles.input, styles.textarea]} placeholder="Bio" multiline value={bio} onChangeText={setBio} />

        <TextInput style={styles.input} placeholder="Website" placeholderTextColor="#8A8A8A" value={website} onChangeText={setWebsite} />
        <TextInput style={styles.input} placeholder="Instagram" placeholderTextColor="#8A8A8A" value={instagram} onChangeText={setInstagram} />
        <TextInput style={styles.input} placeholder="Facebook" placeholderTextColor="#8A8A8A" value={facebook} onChangeText={setFacebook} />
        <TextInput style={styles.input} placeholder="Business Phone" placeholderTextColor="#8A8A8A" value={phone} onChangeText={setPhone} />
        <TextInput style={styles.input} placeholder="Business Address" placeholderTextColor="#8A8A8A" value={address} onChangeText={setAddress} />

        <TextInput style={styles.input} placeholder="Years of Experience" placeholderTextColor="#8A8A8A" keyboardType="numeric" value={years} onChangeText={setYears} />
        <TextInput style={styles.input} placeholder="Specialization" placeholderTextColor="#8A8A8A" value={specialization} onChangeText={setSpecialization} />
        <TextInput style={styles.input} placeholder="Certifications (comma separated)" placeholderTextColor="#8A8A8A" value={certifications} onChangeText={setCertifications} />

        {/* <Text style={styles.sectionTitle}>Services</Text>
        {servicesList.map((s) => (
          <TouchableOpacity key={s.id} style={styles.serviceRow} onPress={() => toggleService(s.id)}>
            <Ionicons name={selectedServices.includes(s.id) ? "checkbox" : "square-outline"} size={20} color="#a580e9" />
            <Text style={styles.serviceText}>{s.label}</Text>
          </TouchableOpacity>
        ))} */}

        <View style={styles.switchRow}>
          <Text>Agree to Terms</Text>
          <Switch value={agreeTerms} onValueChange={setAgreeTerms} />
        </View>

        <View style={styles.switchRow}>
          <Text>Agree to Guidelines</Text>
          <Switch value={agreeGuidelines} onValueChange={setAgreeGuidelines} />
        </View>

        <TouchableOpacity style={styles.button} onPress={handleSubmit} disabled={submitting}>
          {submitting ? <ActivityIndicator color="#004d40" /> : <Text style={styles.buttonText}>{isEdit ? "Update Profile" : "Submit Application"}</Text>}
        </TouchableOpacity>
      </Animated.View>
    </ScrollView>
  );
};

export default CreateBusinessProfileScreen;

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: "#fff",
    paddingHorizontal: 20,
    paddingTop: 100,
    paddingBottom: 150,
  },
  loaderWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
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
  input: {
    borderWidth: 1,
    borderColor: "#a580e9",
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
  },
  textarea: {
    minHeight: 80,
    textAlignVertical: "top",
  },
  sectionTitle: {
    fontWeight: "700",
    marginVertical: 10,
  },
  serviceRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  serviceText: {
    fontSize: 14,
  },
  switchRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginVertical: 8,
  },
  button: {
    backgroundColor: "#a580e9",
    padding: 14,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 20,
  },
  buttonText: {
    color: "#004d40",
    fontWeight: "bold",
  },
});
