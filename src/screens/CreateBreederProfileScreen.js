// CreateBreederProfileScreen.js
import React, { useContext, useEffect, useRef, useState } from "react";
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, ActivityIndicator, Alert, Animated, Switch } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { baseUrl } from "../config";
import { AuthContext } from "../authcontext";

const CreateBreederProfileScreen = ({ navigation, route }) => {
  const { token } = useContext(AuthContext);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  const [submitting, setSubmitting] = useState(false);

  const [speciesList, setSpeciesList] = useState([]);
  const [selectedSpecies, setSelectedSpecies] = useState([]);

  const [companyName, setCompanyName] = useState("");
  const [bio, setBio] = useState("");
  const [website, setWebsite] = useState("");
  const [instagram, setInstagram] = useState("");
  const [facebook, setFacebook] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [years, setYears] = useState("");
  const [focus, setFocus] = useState("");
  const [certifications, setCertifications] = useState("");

  const [agreeTerms, setAgreeTerms] = useState(false);
  const [agreeGuidelines, setAgreeGuidelines] = useState(false);

  const [loadingSpecies, setLoadingSpecies] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const SPECIES_CATEGORIES = [
    { key: "freshwater_fish", label: "Freshwater" },
    { key: "marine_fish", label: "Saltwater" },
    { key: "pond_fish", label: "Pond Fish" },
    { key: "marine_invertebrate", label: "Invertebrate" },
  ];

  const [activeCategory, setActiveCategory] = useState("freshwater_fish");

  const fetchSpecies = async () => {
    setLoadingSpecies(true);
    try {
      const url = `${baseUrl}/tanks/search-species/?category=${activeCategory}`;
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();

      setSpeciesList(json.data || []);
    } catch (err) {
      Alert.alert("Error", "Failed to load species list.");
    } finally {
      setLoadingSpecies(false);
    }
  };

  useEffect(() => {
    fetchSpecies();
  }, [activeCategory]);

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

  const filteredList = speciesList.filter((item) => {
    const q = searchQuery.toLowerCase();
    return item.name.toLowerCase().includes(q) || item.scientific_name.toLowerCase().includes(q);
  });

  const addSpecies = (item) => {
    if (!selectedSpecies.find((s) => s.id === item.id)) {
      setSelectedSpecies((prev) => [...prev, item]);
    }
    setSearchQuery("");
    setDropdownOpen(false);
  };

  const removeSpecies = (id) => {
    setSelectedSpecies((prev) => prev.filter((s) => s.id !== id));
  };

  const handleSubmit = async () => {
    if (!companyName || !bio || !selectedSpecies.length) {
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
        species: selectedSpecies.map((s) => s.id), // <-- fix
        years_experience: Number(years) || 0,
        breeding_focus: focus,
        certifications: certifications
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
        agree_terms: true,
        agree_guidelines: true,
      };

      console.log("payload", payload);

      const res = await fetch(`${baseUrl}/breeders/apply/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const json = await res.json();

      if (!res.ok) {
        Alert.alert("Error", json.message || "Submission failed");
        return;
      }

      Alert.alert("Success", "Breeder application submitted");
      navigation.goBack();
    } catch {
      Alert.alert("Error", "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  // if (loadingSpecies) {
  //   return (
  //     <View style={styles.loaderWrap}>
  //       <ActivityIndicator size="large" color="#a580e9" />
  //     </View>
  //   );
  // }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="chevron-back" size={28} color="#a580e9" />
          </TouchableOpacity>
          <Text style={styles.title}>Apply as Breeder</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Business Info</Text>
          <TextInput style={styles.input} placeholder="Company Name" placeholderTextColor="#8A8A8A" value={companyName} onChangeText={setCompanyName} />
          <TextInput style={[styles.input, styles.textarea]} placeholder="Bio" placeholderTextColor="#8A8A8A" multiline value={bio} onChangeText={setBio} />
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Online Presence</Text>
          <TextInput style={styles.input} placeholder="Website" placeholderTextColor="#8A8A8A" value={website} onChangeText={setWebsite} />
          <TextInput style={styles.input} placeholder="Instagram" placeholderTextColor="#8A8A8A" value={instagram} onChangeText={setInstagram} />
          <TextInput style={styles.input} placeholder="Facebook" placeholderTextColor="#8A8A8A" value={facebook} onChangeText={setFacebook} />
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Breeding Details</Text>
          <TextInput style={styles.input} placeholder="Business Phone" placeholderTextColor="#8A8A8A" value={phone} onChangeText={setPhone} />
          <TextInput style={styles.input} placeholder="Business Address" placeholderTextColor="#8A8A8A" value={address} onChangeText={setAddress} />
          <TextInput style={styles.input} placeholder="Years of Experience" placeholderTextColor="#8A8A8A" keyboardType="numeric" value={years} onChangeText={setYears} />
          <TextInput style={styles.input} placeholder="Breeding Focus" placeholderTextColor="#8A8A8A" value={focus} onChangeText={setFocus} />
          <TextInput style={styles.input} placeholder="Certifications (comma separated)" placeholderTextColor="#8A8A8A" value={certifications} onChangeText={setCertifications} />
        </View>

        <View style={styles.categoryWrap}>
          {SPECIES_CATEGORIES.map((c) => (
            <TouchableOpacity
              key={c.key}
              style={[styles.categoryPill, activeCategory === c.key && styles.categoryPillActive]}
              onPress={() => {
                setActiveCategory(c.key);
                setSearchQuery("");
                setDropdownOpen(false);
              }}
            >
              <Text style={[styles.categoryText, activeCategory === c.key && styles.categoryTextActive]}>{c.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Species You Breed</Text>

          <TextInput
            placeholder="Search species..."
            placeholderTextColor="#a580e9"
            style={styles.input}
            value={searchQuery}
            onFocus={() => setDropdownOpen(true)}
            onChangeText={(text) => {
              setDropdownOpen(true);
              setSearchQuery(text);
            }}
          />

          {dropdownOpen && searchQuery.length > 0 && (
            <View style={styles.dropdownBox}>
              {loadingSpecies ? (
                <View style={styles.loaderWrap}>
                  <ActivityIndicator size="small" color="#a580e9" />
                </View>
              ) : filteredList.length === 0 ? (
                <Text style={styles.noMatch}>No matches found</Text>
              ) : (
                <ScrollView nestedScrollEnabled style={{ maxHeight: 220 }}>
                  {filteredList.slice(0, 10).map((item) => (
                    <TouchableOpacity key={item.id} style={styles.dropdownItem} onPress={() => addSpecies(item)}>
                      <View>
                        <Text style={styles.dropdownName}>{item.name}</Text>
                        <Text style={styles.dropdownScientific}>{item.scientific_name}</Text>
                      </View>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              )}
            </View>
          )}

          {selectedSpecies.length > 0 && (
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 10 }}>
              {selectedSpecies.map((s) => (
                <View key={s.id} style={styles.speciesChip}>
                  <Text style={styles.speciesChipText}>{s.name}</Text>
                  <TouchableOpacity onPress={() => removeSpecies(s.id)}>
                    <Ionicons name="close-circle" size={16} color="#a580e9" />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}
        </View>

        <View style={styles.switchRow}>
          <Text>Agree to Terms</Text>
          <Switch value={agreeTerms} onValueChange={setAgreeTerms} />
        </View>

        <View style={styles.switchRow}>
          <Text>Agree to Guidelines</Text>
          <Switch value={agreeGuidelines} onValueChange={setAgreeGuidelines} />
        </View>

        <TouchableOpacity style={styles.button} onPress={handleSubmit} disabled={submitting}>
          {submitting ? <ActivityIndicator color="#004d40" /> : <Text style={styles.buttonText}>Submit Application</Text>}
        </TouchableOpacity>
      </Animated.View>
    </ScrollView>
  );
};

export default CreateBreederProfileScreen;

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: "#fff",
    paddingHorizontal: 20,
    paddingTop: 80,
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
    backgroundColor: "#fff",
  },
  textarea: {
    minHeight: 80,
    textAlignVertical: "top",
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
  dropdownBox: {
    width: "100%",
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e7dbff",
    borderRadius: 10,
    marginTop: 5,
    elevation: 5,
    zIndex: 999,
  },

  dropdownItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderColor: "#f0e9ff",
  },

  dropdownName: {
    fontSize: 14,
    fontWeight: "700",
    color: "#333",
  },

  dropdownScientific: {
    fontSize: 12,
    color: "#777",
    fontStyle: "italic",
  },

  noMatch: {
    padding: 12,
    textAlign: "center",
    color: "#888",
  },

  speciesChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: "#efe6ff",
    borderRadius: 20,
  },

  speciesChipText: {
    fontSize: 12,
    color: "#333",
    fontWeight: "600",
  },
  categoryWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 12,
  },

  categoryPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#e7dbff",
    backgroundColor: "#fff",
  },

  categoryPillActive: {
    backgroundColor: "#a580e9",
    borderColor: "#a580e9",
  },

  categoryText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#555",
  },

  categoryTextActive: {
    color: "#004d40",
  },
});
