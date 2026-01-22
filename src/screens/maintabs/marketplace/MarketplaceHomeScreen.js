// screens/MarketplaceHomeScreen.js
import React, { useEffect, useState, useCallback, useContext } from "react";
import { View, Text, FlatList, StyleSheet, ActivityIndicator, TouchableOpacity, RefreshControl } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { fetchListings } from "./api/marketplace";
import { AuthContext } from "../../../authcontext";
import { Image } from "react-native";
import * as Location from "expo-location";
import { TextInput } from "react-native-gesture-handler";
import RBSheet from "react-native-raw-bottom-sheet";
import { useRef } from "react";
import { Ionicons } from "@expo/vector-icons";

const CATEGORIES = [
  { label: "All", value: "all" },
  { label: "Fish", value: "fish" },
  { label: "Equipment", value: "equipment" },
  { label: "Plants", value: "plants" },
  { label: "Accessories", value: "accessories" },
];

const MarketplaceHomeScreen = ({ navigation }) => {
  const { token, permissions } = useContext(AuthContext);
  const canSell = permissions?.marketplace_sell === true;

  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [location, setLocation] = useState(null);
  const [category, setCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [allListings, setAllListings] = useState([]);
  const [locationLabel, setLocationLabel] = useState("");
  const [locationLoading, setLocationLoading] = useState(false);

  const categorySheetRef = useRef(null);

  const onSelectCategory = (selected) => {
    categorySheetRef.current?.close();

    if (selected === category) return;

    setCategory(selected);
    requestLocationAndLoad(selected);
  };

  const requestLocationAndLoad = async (selectedCategory = "all") => {
    setLoading(true);
    setError("");

    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        setError("Location permission is required to use marketplace");
        setLoading(false);
        return;
      }

      const loc = await Location.getCurrentPositionAsync({});
      const coords = {
        lat: loc.coords.latitude,
        lon: loc.coords.longitude,
      };

      setLocation(coords);
      setLocationLoading(true);

      const address = await Location.reverseGeocodeAsync({
        latitude: coords.lat,
        longitude: coords.lon,
      });

      if (address?.length) {
        const a = address[0];

        const label = [a.street || a.name, a.city || a.subregion, a.region].filter(Boolean).join(", ");

        setLocationLabel(label);
      }

      setLocationLoading(false);

      const data = await fetchListings(token, {
        ...coords,
        category: selectedCategory,
      });

      setListings(data);
      setAllListings(data); // keep original dataset for search
    } catch (err) {
      setError(err.message || "Failed to load listings");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    requestLocationAndLoad(category);
  }, []);

  const onRefresh = useCallback(() => {
    if (!location) return;
    setRefreshing(true);
    requestLocationAndLoad(category);
  }, [location, category]);

  const renderItem = ({ item }) => (
    <TouchableOpacity style={styles.card} onPress={() => navigation.navigate("ListingDetails", { listingId: item.id })}>
      {/* Thumbnail */}
      <View style={styles.thumbWrapper}>
        {item.thumbnail ? (
          <Image source={{ uri: item.thumbnail }} style={styles.thumb} />
        ) : (
          <View style={styles.noThumb}>
            <Text style={{ color: "#aaa" }}>No Image</Text>
          </View>
        )}
      </View>

      {/* Right Content */}
      <View style={styles.cardContent}>
        <Text style={styles.title} numberOfLines={1}>
          {item.title}
        </Text>

        <Text style={styles.price}>€{item.base_price}</Text>

        <Text style={styles.seller}>Seller: {item.seller}</Text>

        <View style={styles.rowBetween}>
          <Text style={[styles.status, item.status === "active" && styles.statusActive]}>{item?.status?.toUpperCase()}</Text>

          <Text style={styles.date}>{new Date(item.created_at).toLocaleDateString()}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.center} edges={["top"]}>
        <ActivityIndicator size="large" color="#a580e9" />
      </SafeAreaView>
    );
  }

  return (
    <View style={styles.container} edges={["top"]}>
      <View style={styles.locationRow}>
        <Ionicons name="location-outline" size={16} color="#0d9c7a" />

        {locationLoading ? (
          <Text style={styles.locationTextMuted}>Detecting location…</Text>
        ) : (
          <Text style={styles.locationText} numberOfLines={1}>
            {locationLabel || "Location unavailable"}
          </Text>
        )}
      </View>

      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
        <Text style={styles.header}>Marketplace</Text>

        {canSell && (
          <TouchableOpacity style={{ ...styles.myListingsBtn, paddingHorizontal: 10 }} onPress={() => navigation.navigate("MyListings")}>
            <Text style={styles.myListingsText}>My Listings</Text>
          </TouchableOpacity>
        )}
      </View>
      <View style={styles.searchFilterRow}>
        <TextInput
          placeholder="Search listings..."
          value={searchQuery}
          onChangeText={(text) => {
            const filtered = Array.isArray(allListings) ? allListings.filter((item) => item.title?.toLowerCase().includes(text.toLowerCase())) : [];
          }}
          style={styles.searchInput}
        />
        <TouchableOpacity style={styles.filterBtn} onPress={() => categorySheetRef.current?.open()}>
          <Text style={styles.filterText}>{category?.toUpperCase()}</Text>
        </TouchableOpacity>
      </View>

      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      <FlatList
        data={listings}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderItem}
        contentContainerStyle={{ paddingVertical: 10 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={<Text style={styles.emptyText}>No listings yet.</Text>}
      />

      {canSell && (
        <TouchableOpacity style={styles.fab} onPress={() => navigation.navigate("CreateListing")}>
          <Text style={styles.fabText}>+</Text>
        </TouchableOpacity>
      )}

      {!canSell && (
        <View
          style={{
            position: "absolute",
            right: 20,
            bottom: 100,
            backgroundColor: "#000000cc",
            paddingVertical: 10,
            paddingHorizontal: 14,
            borderRadius: 14,
          }}
        >
          <Text style={{ color: "#fff", fontSize: 12, textAlign: "center" }}>Selling unlocked on Pro</Text>
        </View>
      )}

      <RBSheet
        ref={categorySheetRef}
        height={380}
        openDuration={250}
        closeOnDragDown
        closeOnPressMask
        customStyles={{
          container: {
            borderTopLeftRadius: 20,
            borderTopRightRadius: 20,
            padding: 16,
          },
          draggableIcon: {
            backgroundColor: "#ccc",
          },
        }}
      >
        <Text style={styles.sheetTitle}>Select Category</Text>

        {CATEGORIES.map((cat) => (
          <TouchableOpacity key={cat.value} style={[styles.sheetItem, cat.value === category && styles.sheetItemActive]} onPress={() => onSelectCategory(cat.value)}>
            <Text style={[styles.sheetItemText, cat.value === category && styles.sheetItemTextActive]}>{cat.label}</Text>
          </TouchableOpacity>
        ))}
      </RBSheet>
    </View>
  );
};

export default MarketplaceHomeScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ffffff",
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 100,
  },
  center: {
    flex: 1,
    backgroundColor: "#ffffff",
    justifyContent: "center",
    alignItems: "center",
  },
  header: {
    fontSize: 26,
    fontWeight: "bold",
    color: "#a580e9",
    marginBottom: 10,
  },
  card: {
    borderWidth: 1,
    borderColor: "#a580e9",
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    backgroundColor: "#f8fffe",
  },
  title: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 4,
  },
  price: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#a580e9",
    marginBottom: 4,
  },
  category: {
    fontSize: 12,
    color: "#777",
  },
  location: {
    fontSize: 12,
    color: "#999",
    marginTop: 2,
  },
  errorText: {
    color: "#b00020",
    marginBottom: 10,
  },
  emptyText: {
    textAlign: "center",
    marginTop: 30,
    color: "#999",
  },
  fab: {
    position: "absolute",
    right: 20,
    bottom: 100,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#a580e9",
    justifyContent: "center",
    alignItems: "center",
    elevation: 3,
  },
  fabText: {
    color: "#004d40",
    fontSize: 30,
    lineHeight: 30,
    fontWeight: "bold",
  },
  myListingsBtn: {
    borderWidth: 1,
    borderColor: "#a580e9",
    paddingVertical: 10,
    borderRadius: 10,
    marginBottom: 12,
    alignItems: "center",
  },
  myListingsText: {
    color: "#a580e9",
    fontWeight: "bold",
    fontSize: 16,
  },
  card: {
    flexDirection: "row",
    backgroundColor: "#f8fffe",
    borderWidth: 1,
    borderColor: "#a580e9",
    borderRadius: 14,
    padding: 10,
    marginBottom: 12,
    elevation: 2,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 6,
  },

  thumbWrapper: {
    width: 90,
    height: 90,
    borderRadius: 10,
    overflow: "hidden",
    backgroundColor: "#e6f7f7",
    marginRight: 12,
  },

  thumb: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },

  noThumb: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  cardContent: {
    flex: 1,
    justifyContent: "space-between",
    paddingVertical: 4,
  },

  title: {
    fontSize: 16,
    fontWeight: "700",
    color: "#333",
  },

  price: {
    marginTop: 4,
    fontSize: 15,
    fontWeight: "bold",
    color: "#a580e9",
  },

  seller: {
    marginTop: 6,
    fontSize: 12,
    color: "#777",
  },

  rowBetween: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 10,
    alignItems: "center",
  },

  status: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    fontSize: 11,
    fontWeight: "bold",
    color: "#666",
    backgroundColor: "#e6e6e6",
  },

  statusActive: {
    backgroundColor: "#d2f7f2",
    color: "#0d9c7a",
  },

  date: {
    fontSize: 11,
    color: "#888",
  },
  searchFilterRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },

  searchInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#a580e9",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginRight: 10,
    backgroundColor: "#f8fffe",
  },

  filterBtn: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#a580e9",
    backgroundColor: "#e6f7f7",
  },

  filterText: {
    fontWeight: "bold",
    color: "#a580e9",
    fontSize: 13,
  },
  sheetTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 16,
    color: "#333",
  },

  sheetItem: {
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 12,
    marginBottom: 10,
    backgroundColor: "#f5f5f5",
  },

  sheetItemActive: {
    backgroundColor: "#d2f7f2",
  },

  sheetItemText: {
    fontSize: 15,
    color: "#444",
  },

  sheetItemTextActive: {
    fontWeight: "bold",
    color: "#0d9c7a",
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
    gap: 6,
  },

  locationText: {
    fontSize: 13,
    color: "#0d9c7a",
    fontWeight: "500",
    flexShrink: 1,
  },

  locationTextMuted: {
    fontSize: 13,
    color: "#999",
  },
});
