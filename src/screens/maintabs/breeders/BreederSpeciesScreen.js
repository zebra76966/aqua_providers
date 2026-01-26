// BreederSpeciesScreen.js
import React, { useContext, useEffect, useRef, useState } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, ActivityIndicator, Alert, Modal, Animated, Image } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { AuthContext } from "../../../authcontext";
import { baseUrl } from "../../../config";

const SPECIES_CATEGORIES = [
  { key: "freshwater_fish", label: "Freshwater" },
  { key: "marine_fish", label: "Saltwater" },
  { key: "pond_fish", label: "Pond Fish" },
  { key: "marine_invertebrate", label: "Invertebrate" },
];

const BreederSpeciesScreen = ({ navigation }) => {
  const { token } = useContext(AuthContext);

  const [loading, setLoading] = useState(true);
  const [list, setList] = useState([]);

  // bottom sheet
  const [sheetOpen, setSheetOpen] = useState(false);
  const slideAnim = useRef(new Animated.Value(400)).current;

  // picker
  const [activeCategory, setActiveCategory] = useState("freshwater_fish");
  const [speciesList, setSpeciesList] = useState([]);
  const [loadingSpecies, setLoadingSpecies] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [selectedSpecies, setSelectedSpecies] = useState(null);

  // form
  const [editing, setEditing] = useState(null);
  const [quantity, setQuantity] = useState(0);

  const [priceMin, setPriceMin] = useState("");
  const [priceMax, setPriceMax] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  const openSheet = (item = null) => {
    setEditing(item);

    if (item && item.has_stock_info) {
      setSelectedSpecies(item);
      setQuantity(Number(item.quantity || 0));
      setPriceMin(String(item.price_min || ""));
      setPriceMax(String(item.price_max || ""));
      setNotes(item.notes || "");
    } else {
      setSelectedSpecies(item);
      setQuantity(0);
      setPriceMin("");
      setPriceMax("");
      setNotes("");
    }

    setSheetOpen(true);
  };

  const closeSheet = () => {
    setSheetOpen(false);
  };

  useEffect(() => {
    Animated.timing(slideAnim, {
      toValue: sheetOpen ? 0 : 400,
      duration: sheetOpen ? 300 : 250,
      useNativeDriver: true,
    }).start();
  }, [sheetOpen]);

  const fetchMySpecies = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${baseUrl}/breeders/species/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (!res.ok) throw new Error();

      setList(json?.data?.species || []);
    } catch {
      Alert.alert("Error", "Failed to load species");
    } finally {
      setLoading(false);
    }
  };

  const fetchSpecies = async () => {
    setLoadingSpecies(true);
    try {
      const url = `${baseUrl}/tanks/search-species/?category=${activeCategory}`;
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      setSpeciesList(json.data || []);
    } catch {
      Alert.alert("Error", "Failed to load species list");
    } finally {
      setLoadingSpecies(false);
    }
  };

  useEffect(() => {
    fetchMySpecies();
  }, []);

  useEffect(() => {
    fetchSpecies();
  }, [activeCategory]);

  const save = async () => {
    if (!selectedSpecies) {
      Alert.alert("Missing", "Select a species");
      return;
    }

    try {
      setSaving(true);

      const payload = {
        quantity,
        price_min: Number(priceMin) || 0,
        price_max: Number(priceMax) || 0,
        notes,
      };

      let url = `${baseUrl}/breeders/species/add/`;
      let method = "POST";
      let body = {
        species_id: selectedSpecies.id,
        ...payload,
        availability: "available",
      };

      if (editing) {
        url = `${baseUrl}/breeders/species/${editing.id}/update/`;
        method = "PUT";
        body = payload;
      }

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.message);

      closeSheet();
      fetchMySpecies();
    } catch {
      Alert.alert("Error", "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id) => {
    Alert.alert("Remove", "Remove this species?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Remove",
        style: "destructive",
        onPress: async () => {
          try {
            await fetch(`${baseUrl}/breeders/species/${id}/remove/`, {
              method: "DELETE",
              headers: { Authorization: `Bearer ${token}` },
            });
            fetchMySpecies();
          } catch {
            Alert.alert("Error", "Failed to remove");
          }
        },
      },
    ]);
  };

  const filteredList = speciesList.filter((i) => {
    const q = searchQuery.toLowerCase();
    return i.name.toLowerCase().includes(q) || i.scientific_name.toLowerCase().includes(q);
  });

  if (loading) {
    return (
      <View style={styles.loaderWrap}>
        <ActivityIndicator size="large" color="#a580e9" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={26} color="#a580e9" />
        </TouchableOpacity>
        <Text style={styles.title}>My Species</Text>
        <TouchableOpacity onPress={() => openSheet()}>
          <Ionicons name="add-circle" size={28} color="#a580e9" />
        </TouchableOpacity>
      </View>

      <ScrollView>
        {list.length === 0 ? (
          <View style={styles.empty}>
            <Ionicons name="fish-outline" size={48} color="#ccc" />
            <Text style={styles.emptyText}>No species added yet</Text>
          </View>
        ) : (
          list.map((item) => (
            <View key={item.id} style={styles.card}>
              {item.metadata?.image_url ? (
                <Image source={{ uri: item.metadata.image_url }} style={styles.thumb} />
              ) : (
                <View style={styles.thumbPlaceholder}>
                  <Ionicons name="fish-outline" size={20} color="#aaa" />
                </View>
              )}

              <View style={{ flex: 1 }}>
                <Text style={styles.name}>{item.species_name}</Text>
                <Text style={styles.meta}>{item.scientific_name}</Text>

                {item.has_stock_info ? (
                  <>
                    <Text style={styles.meta}>Stock: {item.quantity}</Text>
                    <Text style={styles.meta}>
                      Price: {item.price_min ?? "-"} – {item.price_max ?? "-"}
                    </Text>
                  </>
                ) : (
                  <Text style={[styles.meta, { color: "#a580e9" }]}>Not in stock</Text>
                )}
              </View>

              <TouchableOpacity onPress={() => openSheet(item)}>
                <Ionicons name={item.has_stock_info ? "create-outline" : "add-circle-outline"} size={22} color="#a580e9" />
              </TouchableOpacity>

              {item.has_stock_info && (
                <TouchableOpacity onPress={() => remove(item.id)}>
                  <Ionicons name="trash-outline" size={22} color="#f44336" />
                </TouchableOpacity>
              )}
            </View>
          ))
        )}
      </ScrollView>

      {/* Bottom Sheet */}
      <Modal transparent visible={sheetOpen} animationType="none">
        <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={closeSheet} />
        <Animated.View style={[styles.sheet, { transform: [{ translateY: slideAnim }] }]}>
          <Text style={styles.sheetTitle}>{editing ? "Edit Species" : "Add Species"}</Text>

          {!editing && (
            <>
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

              <TextInput
                placeholder="Search species..."
                placeholderTextColor="#8A8A8A"
                style={styles.input}
                value={searchQuery}
                onFocus={() => setDropdownOpen(true)}
                onChangeText={(t) => {
                  setDropdownOpen(true);
                  setSearchQuery(t);
                }}
              />

              {dropdownOpen && searchQuery.length > 0 && (
                <View style={styles.dropdown}>
                  {loadingSpecies ? (
                    <ActivityIndicator size="small" color="#a580e9" />
                  ) : (
                    <ScrollView style={{ maxHeight: 180 }}>
                      {filteredList.slice(0, 10).map((i) => (
                        <TouchableOpacity
                          key={i.id}
                          style={styles.dropdownItem}
                          onPress={() => {
                            setSelectedSpecies(i);
                            setDropdownOpen(false);
                            setSearchQuery(i.name);
                          }}
                        >
                          <Text style={styles.dropdownName}>{i.name}</Text>
                          <Text style={styles.dropdownSci}>{i.scientific_name}</Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  )}
                </View>
              )}
            </>
          )}

          <View style={styles.qtyRow}>
            <TouchableOpacity style={styles.qtyBtn} onPress={() => setQuantity((q) => Math.max(0, q - 1))}>
              <Ionicons name="remove" size={18} color="#a580e9" />
            </TouchableOpacity>

            <View style={styles.qtyValue}>
              <Text style={styles.qtyText}>{quantity}</Text>
            </View>

            <TouchableOpacity style={styles.qtyBtn} onPress={() => setQuantity((q) => q + 1)}>
              <Ionicons name="add" size={18} color="#a580e9" />
            </TouchableOpacity>
          </View>

          <TextInput style={styles.input} placeholder="Price Min" placeholderTextColor="#8A8A8A" keyboardType="numeric" value={priceMin} onChangeText={setPriceMin} />
          <TextInput style={styles.input} placeholder="Price Max" placeholderTextColor="#8A8A8A" keyboardType="numeric" value={priceMax} onChangeText={setPriceMax} />
          <TextInput style={styles.input} placeholder="Notes" placeholderTextColor="#8A8A8A" value={notes} onChangeText={setNotes} />

          <TouchableOpacity style={styles.button} onPress={save} disabled={saving}>
            {saving ? <ActivityIndicator color="#004d40" /> : <Text style={styles.buttonText}>Save</Text>}
          </TouchableOpacity>
        </Animated.View>
      </Modal>
    </View>
  );
};

export default BreederSpeciesScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff", padding: 16, paddingBottom: 120 },
  loaderWrap: { flex: 1, alignItems: "center", justifyContent: "center" },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 12 },
  title: { fontSize: 20, fontWeight: "700", color: "#333" },
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "#faf7ff",
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: "#e7dbff",
    marginBottom: 10,
  },
  name: { fontSize: 15, fontWeight: "700", color: "#333" },
  meta: { fontSize: 12, color: "#666" },
  empty: { alignItems: "center", marginTop: 60 },
  emptyText: { marginTop: 8, color: "#888" },

  overlay: { position: "absolute", inset: 0, backgroundColor: "rgba(0,0,0,0.3)" },
  sheet: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
  },
  sheetTitle: { fontSize: 18, fontWeight: "700", marginBottom: 10 },

  input: {
    borderWidth: 1,
    borderColor: "#a580e9",
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
    backgroundColor: "#fff",
  },
  button: {
    backgroundColor: "#a580e9",
    padding: 14,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 10,
  },
  buttonText: { color: "#004d40", fontWeight: "700" },

  categoryWrap: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 10 },
  categoryPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#e7dbff",
    backgroundColor: "#fff",
  },
  categoryPillActive: { backgroundColor: "#a580e9", borderColor: "#a580e9" },
  categoryText: { fontSize: 12, fontWeight: "600", color: "#555" },
  categoryTextActive: { color: "#004d40" },

  dropdown: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e7dbff",
    borderRadius: 10,
    marginBottom: 10,
  },
  dropdownItem: { padding: 10, borderBottomWidth: 1, borderColor: "#f0e9ff" },
  dropdownName: { fontSize: 14, fontWeight: "700", color: "#333" },
  dropdownSci: { fontSize: 12, color: "#777", fontStyle: "italic" },
  thumb: {
    width: 52,
    height: 52,
    borderRadius: 10,
    marginRight: 8,
    backgroundColor: "#eee",
  },

  thumbPlaceholder: {
    width: 52,
    height: 52,
    borderRadius: 10,
    marginRight: 8,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f2f2f2",
  },
  qtyRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 14,
    marginBottom: 12,
  },

  qtyBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#a580e9",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
  },

  qtyValue: {
    minWidth: 60,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#a580e9",
    alignItems: "center",
  },

  qtyText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#333",
  },
});
