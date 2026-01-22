import React, { useState, useEffect, useContext } from "react";
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, ScrollView, Modal, TextInput, Alert, FlatList, LayoutAnimation, Platform, UIManager } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { AuthContext } from "../../../authcontext";
import { baseUrl } from "../../../config";
import * as Location from "expo-location";

if (Platform.OS === "android") {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export default function BreedersScreen({ navigation }) {
  const { token, permissions } = useContext(AuthContext);

  const canContactBreeder = permissions?.breeder_contact === true;

  const [favorites, setFavorites] = useState({});
  const toggleFavorite = (id) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setFavorites((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const [latitude, setLatitude] = useState(null);
  const [longitude, setLongitude] = useState(null);
  const [locationName, setLocationName] = useState("");

  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);

  const [breeders, setBreeders] = useState([]);

  const [name, setName] = useState("");
  const [radius, setRadius] = useState(50000);

  const [allSpecies, setAllSpecies] = useState([]);
  const [selectedSpecies, setSelectedSpecies] = useState([]);

  const [filterOpen, setFilterOpen] = useState(false);
  const [speciesSearch, setSpeciesSearch] = useState("");

  const [waterType, setWaterType] = useState("freshwater_fish");
  const [loadingSpecies, setLoadingSpecies] = useState(false);

  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();

      if (status !== "granted") {
        Alert.alert("Permission denied", "Location is required to show breeders nearby");
        return;
      }

      const location = await Location.getCurrentPositionAsync({});
      const { latitude, longitude } = location.coords;

      setLatitude(latitude);
      setLongitude(longitude);

      // Reverse geocode for city / area
      const geo = await Location.reverseGeocodeAsync({
        latitude,
        longitude,
      });

      if (geo && geo.length > 0) {
        const place = geo[0];
        setLocationName(place.city || place.subregion || place.region || "Your location");
      }
    })();
  }, []);

  /* ---------------- Fetch Species ---------------- */
  const fetchSpecies = async (category = "freshwater_fish") => {
    try {
      setLoadingSpecies(true);

      const res = await fetch(`${baseUrl}/tanks/search-species/?category=${category}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const json = await res.json();
      setAllSpecies(json?.data || []);
    } catch (e) {
      console.log("Species fetch error", e);
    } finally {
      setLoadingSpecies(false);
    }
  };

  useEffect(() => {
    fetchSpecies("freshwater_fish");
  }, []);

  const onWaterTypeChange = (type) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setWaterType(type);
    setSelectedSpecies([]); // reset selection
    fetchSpecies(type);
  };

  /* ---------------- Search Breeders ---------------- */
  const searchBreeders = async () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setSearching(true);

    if (latitude === null || longitude === null) {
      Alert.alert("Location not available", "Please allow location access to search nearby breeders");
      setSearching(false);
      return;
    }

    try {
      const res = await fetch(`${baseUrl}/breeders/search/`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          species: selectedSpecies.map((s) => s.id),
          radius,
          lat: latitude,
          lon: longitude,
        }),
      });

      const json = await res.json();

      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      setBreeders(json?.data || []);
    } catch (e) {
      Alert.alert("Error", "Failed to fetch breeders");
    } finally {
      setSearching(false);
    }
  };

  /* ---------------- Toggle Species ---------------- */
  const toggleSpecies = (item) => {
    setSelectedSpecies((prev) => (prev.some((s) => s.id === item.id) ? prev.filter((s) => s.id !== item.id) : [...prev, item]));
  };

  const filteredSpecies = allSpecies.filter((s) => (s.name || "").toLowerCase().includes(speciesSearch.toLowerCase()));

  /* ---------------- UI ---------------- */
  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <ActivityIndicator size="large" color="#a580e9" style={{ marginTop: 40 }} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={["left", "right", "bottom"]}>
      <ScrollView contentContainerStyle={styles.container}>
        {/* -------- Header -------- */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Breeders</Text>

          {locationName ? (
            <View style={styles.headerLoc}>
              <Ionicons name="location-outline" size={14} color="#666" />
              <Text style={styles.locationText}>{locationName}</Text>
            </View>
          ) : null}
        </View>

        {!canContactBreeder && (
          <View
            style={{
              backgroundColor: "#fff3cd",
              padding: 12,
              borderRadius: 12,
              marginTop: 12,
              marginBottom: 6,
            }}
          >
            <Text style={{ fontSize: 13, color: "#856404", textAlign: "center" }}>Contacting breeders is available on Pro plans.</Text>
          </View>
        )}

        {/* -------- Search Bar -------- */}
        <View style={styles.searchRow}>
          <View style={styles.searchInputA}>
            <Ionicons name="search" size={18} color="#777" />
            <TextInput placeholder="Search breeder name" value={name} placeholderTextColor={"#a580e9"} onChangeText={setName} style={{ marginLeft: 8, flex: 1 }} />
          </View>

          <TouchableOpacity style={styles.filterBtn} onPress={() => setFilterOpen(true)}>
            <Ionicons name="options-outline" size={20} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* -------- Selected Filters -------- */}
        {selectedSpecies.length > 0 && <Text style={styles.filterHint}>Species: {selectedSpecies.map((s) => s.species_name).join(", ")}</Text>}

        {/* -------- Search Button -------- */}
        <TouchableOpacity style={styles.button} onPress={searchBreeders}>
          {searching ? <ActivityIndicator /> : <Text style={styles.buttonText}>Search Breeders</Text>}
        </TouchableOpacity>

        {/* -------- Results -------- */}
        {breeders.length === 0 && !searching ? (
          <View style={styles.emptyState}>
            <Ionicons name="leaf-outline" size={48} color="#bbb" />
            <Text style={styles.emptyTitle}>No breeders found</Text>
            <Text style={styles.emptyText}>Try adjusting the name or species filters.</Text>
          </View>
        ) : (
          breeders.map((b) => {
            const isTopRated = Number(b.rating) >= 4.5;
            const speciesCount = b.species_count || b.species?.length || 0;
            const isFav = favorites[b.id];

            return (
              <TouchableOpacity
                key={b.id}
                style={styles.breederCard}
                activeOpacity={0.88}
                onPress={() => {
                  if (!canContactBreeder) {
                    Alert.alert("Upgrade Required", "Contacting breeders is available on Pro plans.");
                    return;
                  }

                  navigation.navigate("BreederDetail", { id: b.id });
                }}
              >
                {!canContactBreeder && (
                  <View
                    style={{
                      position: "absolute",
                      top: 12,
                      right: 12,
                      backgroundColor: "#00000099",
                      paddingHorizontal: 8,
                      paddingVertical: 4,
                      borderRadius: 10,
                    }}
                  >
                    <Ionicons name="lock-closed" size={14} color="#fff" />
                  </View>
                )}

                {/* Avatar */}
                <View style={styles.avatar}>
                  <Ionicons name="fish-outline" size={26} color="#a580e9" />
                </View>

                {/* Content */}
                <View style={styles.cardContent}>
                  <View style={styles.nameRow}>
                    <Text style={styles.breederName}>{b.name}</Text>

                    {isTopRated && (
                      <View style={styles.topRatedBadge}>
                        <Ionicons name="trophy" size={12} color="#fff" />
                        <Text style={styles.badgeText}>Top Rated</Text>
                      </View>
                    )}
                  </View>

                  <View style={styles.row}>
                    <Ionicons name="business-outline" size={14} color="#777" />
                    <Text style={styles.companyText}>{b.company || "Independent breeder"}</Text>
                  </View>

                  {/* Chips */}
                  <View style={styles.chipsRow}>
                    {speciesCount > 0 && (
                      <View style={styles.chip}>
                        <Ionicons name="fish" size={12} color="#a580e9" />
                        <Text style={styles.chipText}>{speciesCount} species</Text>
                      </View>
                    )}

                    {b.distance_km && (
                      <View style={styles.chip}>
                        <Ionicons name="location-outline" size={12} color="#a580e9" />
                        <Text style={styles.chipText}>{Number(b.distance_km).toFixed(1)} km</Text>
                      </View>
                    )}
                  </View>

                  {/* Rating */}
                  <View style={[styles.row, { marginTop: 6 }]}>
                    <Ionicons name="star" size={14} color="#f5c518" />
                    <Text style={styles.ratingText}>
                      {b.rating} • {b.reviews} reviews
                    </Text>
                  </View>
                </View>

                {/* Favorite */}
                <TouchableOpacity onPress={() => toggleFavorite(b.id)} hitSlop={10} style={{ marginTop: "auto" }}>
                  <Ionicons name={isFav ? "heart" : "heart-outline"} size={22} color={isFav ? "#ff5a5f" : "#bbb"} />
                </TouchableOpacity>
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>

      {/* -------- Filter Modal -------- */}
      <Modal visible={filterOpen} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modal}>
            <Text style={styles.modalLabel}>Water Type</Text>

            <View style={styles.waterToggleRow}>
              {[
                { key: "freshwater_fish", label: "Freshwater" },
                { key: "marine_fish", label: "Saltwater" },
                { key: "pond_fish", label: "Pond Fish" },
                { key: "marine_invertebrate", label: "Marine Invertebrate" },
              ].map((item) => {
                const active = waterType === item.key;

                return (
                  <TouchableOpacity key={item.key} style={[styles.waterToggleBtn, active && styles.waterToggleActive]} onPress={() => onWaterTypeChange(item.key)}>
                    <Text style={[styles.waterToggleText, active && styles.waterToggleTextActive]}>{item.label}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <Text style={styles.modalTitle}>Filter by Species</Text>

            <View style={styles.searchInput}>
              <Ionicons name="search" size={18} color="#a580e9" />
              <TextInput placeholder="Search species" value={speciesSearch} onChangeText={setSpeciesSearch} placeholderTextColor="#9be7e1" style={styles.searchTextInput} />
            </View>

            {loadingSpecies ? (
              <ActivityIndicator style={{ marginTop: 20 }} />
            ) : (
              <FlatList
                data={filteredSpecies}
                keyExtractor={(item) => String(item.id)}
                renderItem={({ item }) => {
                  const active = selectedSpecies.some((s) => s.id === item.id);

                  return (
                    <TouchableOpacity style={styles.speciesRow} onPress={() => toggleSpecies(item)}>
                      <Ionicons name={active ? "checkbox" : "square-outline"} size={18} color={active ? "#a580e9" : "#999"} />
                      <View style={{ marginLeft: 10 }}>
                        <Text style={styles.speciesText}>{item.name}</Text>
                        {!!item.scientific_name && <Text style={styles.speciesSub}>{item.scientific_name}</Text>}
                      </View>
                    </TouchableOpacity>
                  );
                }}
              />
            )}

            <TouchableOpacity style={[styles.button, { marginBottom: 10 }]} onPress={() => setFilterOpen(false)}>
              <Text style={styles.buttonText}>Apply Filters</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => setFilterOpen(false)}>
              <Text style={styles.cancel}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#F8F8F8" },
  container: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },

  headerLoc: { flexDirection: "row", alignItems: "center" },

  headerTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: "#a580e9",
  },

  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 14,
  },

  searchInputA: {
    flex: 1,
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 10,
    flexDirection: "row",
    alignItems: "center",
  },

  searchInput: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#a580e9",
    paddingHorizontal: 12,
    height: 46, //  fixed height
    marginBottom: 20,
  },

  searchTextInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 14,
    color: "#222", //  text now visible
    paddingVertical: 0, //  prevents Android clipping
  },

  filterBtn: {
    backgroundColor: "#a580e9",
    padding: 12,
    borderRadius: 12,
    marginLeft: 10,
  },

  filterHint: {
    marginTop: 8,
    fontSize: 12,
    color: "#666",
  },

  button: {
    backgroundColor: "#a580e9",
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 14,
  },

  buttonText: { textAlign: "center", fontWeight: "700" },

  card: {
    backgroundColor: "#fff",
    padding: 14,
    borderRadius: 12,
    marginTop: 12,
    flexDirection: "row",
    alignItems: "center",
  },

  name: { fontWeight: "700", fontSize: 14 },
  sub: { fontSize: 12, color: "#666", marginVertical: 2 },

  emptyState: { marginTop: 50, alignItems: "center" },
  emptyTitle: { marginTop: 10, fontWeight: "700" },
  emptyText: { fontSize: 12, color: "#666", marginTop: 4 },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
  },

  modal: {
    backgroundColor: "#fff",
    margin: 20,
    borderRadius: 14,
    padding: 16,
    maxHeight: "80%",
  },

  modalTitle: { fontWeight: "700", marginBottom: 10 },

  speciesRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
  },

  speciesText: { marginLeft: 10, fontSize: 14 },

  cancel: {
    textAlign: "center",
    color: "#777",
    marginTop: 6,
  },

  modalLabel: {
    fontSize: 13,
    fontWeight: "700",
    marginBottom: 6,
  },

  waterToggleRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 12,
  },

  waterToggleBtn: {
    // flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderRadius: 10,
    backgroundColor: "#eee",
    marginRight: 8,
    marginBottom: 8,
    alignItems: "center",
  },

  waterToggleActive: {
    backgroundColor: "#a580e9",
  },

  waterToggleText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#444",
  },

  waterToggleTextActive: {
    color: "#000",
  },

  speciesSub: {
    fontSize: 11,
    color: "#777",
  },

  row: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
  },

  breederCard: {
    backgroundColor: "#fff",
    borderRadius: 18,
    padding: 16,
    marginTop: 14,
    flexDirection: "row",
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 5 },
    elevation: 4,
  },

  avatar: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: "#E9FBF9",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
  },

  cardContent: {
    flex: 1,
  },

  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 5,

    marginBottom: 15,
  },

  breederName: {
    fontSize: 16,
    fontWeight: "800",
    color: "#222",
    marginRight: 6,
  },

  topRatedBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f5c518",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },

  badgeText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#fff",
    marginLeft: 4,
  },

  row: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
  },

  companyText: {
    marginLeft: 6,
    fontSize: 13,
    color: "#666",
  },

  ratingText: {
    marginLeft: 6,
    fontSize: 12,
    color: "#444",
  },

  chipsRow: {
    flexDirection: "row",
    marginTop: 6,
    gap: 8,
  },

  chip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F1FBFA",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },

  chipText: {
    fontSize: 11,
    marginLeft: 4,
    color: "#a580e9",
  },
});
