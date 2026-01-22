import React, { useState, useContext, useEffect } from "react";
import { View, Text, ScrollView, TouchableOpacity, Image, TextInput, ActivityIndicator, StyleSheet, Alert } from "react-native";
import * as ImagePicker from "expo-image-picker";
import { AuthContext } from "../../../authcontext";
import { baseUrl } from "../../../config";
import { Ionicons } from "@expo/vector-icons";

export default function AddSpeciesScreen({ navigation, route }) {
  const { tankId, type } = route.params; // type = freshwater_fish etc.
  const { token } = useContext(AuthContext);

  const [speciesList, setSpeciesList] = useState([]);
  const [loadingSpecies, setLoadingSpecies] = useState(true);

  const [selectedSpecies, setSelectedSpecies] = useState(null);

  const [quantity, setQuantity] = useState("");
  const [notes, setNotes] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  // ---------------------------
  // Fetch species list by category
  // ---------------------------
  const fetchSpecies = async () => {
    setLoadingSpecies(true);
    const typeName = type == "FRESH" ? "freshwater_fish" : type == "SALT" ? "marine_fish" : "";

    if (typeName == "") {
      return;
    }
    try {
      const url = `${baseUrl}/tanks/search-species/?category=${typeName}`;

      const res = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const json = await res.json();
      console.log("Fetched species list:", json);

      setSpeciesList(json.data || []);
    } catch (err) {
      console.log("Fetch species error:", err);
      Alert.alert("Error", "Failed to load species list.");
    } finally {
      setLoadingSpecies(false);
    }
  };

  useEffect(() => {
    fetchSpecies();
  }, []);

  // ---------------------------
  // Add Species API
  // ---------------------------
  const handleAddSpecies = async () => {
    if (!selectedSpecies || !quantity) {
      Alert.alert("Error", "Please select a species and enter quantity.");
      return;
    }

    try {
      const body = {
        tank_id: tankId,
        class_name: selectedSpecies.scientific_name,
        quantity: parseInt(quantity),
        notes,
        last_scan_image_url: imageUrl,
      };

      const res = await fetch(`${baseUrl}/tanks/${tankId}/add-species/`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(errorText);
      }

      Alert.alert("Success", "Species added successfully!");
      navigation.goBack();
    } catch (err) {
      console.error(err);
      Alert.alert("Error", "Failed to add species.");
    }
  };

  const filteredList = speciesList.filter((item) => {
    const q = searchQuery.toLowerCase();
    return item.name.toLowerCase().includes(q) || item.scientific_name.toLowerCase().includes(q);
  });
  const [dropdownOpen, setDropdownOpen] = useState(false);

  return (
    <View style={{ flex: 1, backgroundColor: "#fff" }}>
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={26} color="#a580e9" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Add New Species</Text>
      </View>

      {/* LOADING SPECIES LIST */}
      {loadingSpecies ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color="#a580e9" />
          <Text style={{ marginTop: 10, color: "#555" }}>Loading species...</Text>
        </View>
      ) : (
        <>
          <ScrollView style={{ padding: 20 }}>
            <View style={{ marginBottom: 2 }}>
              <Text style={styles.sectionTitle}>Search Species</Text>

              <TextInput
                placeholder="Search species..."
                placeholderTextColor="#a580e9"
                style={styles.input}
                value={searchQuery}
                onFocus={() => setDropdownOpen(true)}
                onChangeText={(text) => {
                  setDropdownOpen(true);
                  setSelectedSpecies(null);
                  setQuantity("");
                  setNotes("");
                  setImageUrl("");
                  setSearchQuery(text);
                }}
              />

              {dropdownOpen && searchQuery.length > 0 && (
                <View style={styles.dropdownBox}>
                  {filteredList.length === 0 ? (
                    <Text style={styles.noMatch}>No matches found</Text>
                  ) : (
                    <ScrollView nestedScrollEnabled style={{ maxHeight: 250 }}>
                      {filteredList.slice(0, 10).map((item) => (
                        <TouchableOpacity
                          key={item.id}
                          style={styles.dropdownItem}
                          onPress={() => {
                            setSelectedSpecies(item);
                            setSearchQuery(item.name);
                            setDropdownOpen(false);
                          }}
                        >
                          <Image source={item.image_url ? { uri: item.image_url } : require("../../../assets/placeholder-fish.png")} style={styles.dropdownImage} />
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
            </View>
            {/* <Text style={styles.sectionTitle}>Selected Species : {selectedSpecies.name}</Text> */}

            {/* <View style={styles.selectedCard}>
              <Image source={{ uri: selectedSpecies.image_url || "https://via.placeholder.com/120" }} style={styles.selectedImage} />
              <Text style={styles.selectedName}>{selectedSpecies.name}</Text>
              <Text style={styles.selectedScientific}>{selectedSpecies.scientific_name}</Text>
            </View> */}

            {/* Image Upload */}
            {/* {imageUrl ? <Image source={{ uri: imageUrl }} style={styles.previewImage} /> : null}

            <TouchableOpacity
              style={[styles.button, { backgroundColor: "#a580e9" }]}
              onPress={async () => {
                const result = await ImagePicker.launchImageLibraryAsync({
                  mediaTypes: ImagePicker.MediaTypeOptions.Images,
                  allowsEditing: true,
                  quality: 0.7,
                });

                if (!result.canceled) setImageUrl(result.assets[0].uri);
              }}
            >
              <Text style={styles.buttonText}>{imageUrl ? "Change Image" : "Upload Image"}</Text>
            </TouchableOpacity> */}

            <TextInput placeholder="Quantity" placeholderTextColor="#a580e9" keyboardType="numeric" value={quantity} onChangeText={setQuantity} style={styles.input} />

            <TextInput placeholder="Notes (optional)" placeholderTextColor="#a580e9" value={notes} onChangeText={setNotes} style={[styles.input, { height: 100 }]} multiline />

            <TouchableOpacity style={[styles.button, { backgroundColor: "#4CAF50" }]} onPress={handleAddSpecies}>
              <Text style={styles.buttonText}>Submit</Text>
            </TouchableOpacity>
          </ScrollView>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderColor: "#e0e0e0",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginLeft: 12,
  },
  loaderContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 12,
  },
  speciesItem: {
    flexDirection: "row",
    backgroundColor: "#f7f7f7",
    padding: 12,
    borderRadius: 10,
    marginBottom: 12,
    alignItems: "center",
  },
  speciesImage: {
    width: 60,
    height: 60,
    borderRadius: 10,
    marginRight: 12,
    backgroundColor: "#eee",
  },
  speciesName: {
    fontSize: 16,
    fontWeight: "bold",
  },
  speciesScientific: {
    fontSize: 13,
    color: "#666",
    fontStyle: "italic",
  },
  selectedCard: {
    alignItems: "center",
    marginBottom: 20,
  },
  selectedImage: {
    width: 120,
    height: 120,
    borderRadius: 12,
  },
  selectedName: {
    fontSize: 20,
    fontWeight: "bold",
    marginTop: 10,
  },
  selectedScientific: {
    fontSize: 15,
    fontStyle: "italic",
    color: "#555",
  },
  previewImage: {
    width: "100%",
    height: 180,
    borderRadius: 10,
    marginBottom: 15,
    marginTop: 10,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
    fontSize: 16,
  },
  button: {
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
    marginVertical: 10,
  },
  buttonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 16,
  },
  dropdownBox: {
    width: "100%",
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    marginTop: 5,
    elevation: 5,
    zIndex: 999,
  },

  dropdownItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderBottomWidth: 1,
    borderColor: "#eee",
  },

  dropdownImage: {
    width: 50,
    height: 50,
    borderRadius: 8,
    marginRight: 10,
  },

  noMatch: {
    padding: 10,
    textAlign: "center",
    color: "#888",
  },

  dropdownName: {
    fontSize: 16,
    fontWeight: "bold",
  },

  dropdownScientific: {
    fontSize: 13,
    color: "#666",
    fontStyle: "italic",
  },
});
