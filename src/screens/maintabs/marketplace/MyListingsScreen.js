import React, { useEffect, useState, useContext, useCallback } from "react";
import { View, Text, FlatList, StyleSheet, ActivityIndicator, TouchableOpacity, RefreshControl } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { AuthContext } from "../../../authcontext";
import { fetchMyListings, fetchMySellerProfile } from "./api/marketplace";
import { Image } from "react-native";
import Feather from "react-native-vector-icons/Feather";

const MyListingsScreen = ({ navigation }) => {
  const { token } = useContext(AuthContext);

  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [Id, setId] = useState("");

  const loadData = async () => {
    setError("");
    try {
      const data = await fetchMyListings(token);
      setListings(data);
    } catch (err) {
      setError(err.message || "Failed to load your listings");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const loadMyProfile = async () => {
    setError("");
    try {
      const data = await fetchMySellerProfile(token);

      setId(data);
    } catch (err) {
      setError(err.message || "Failed to load your profile");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    loadMyProfile();
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadData();
  }, []);

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

      {/* Right side content */}
      <View style={styles.cardContent}>
        <Text style={styles.title}>{item.title}</Text>

        <Text style={styles.price}>€{item.base_price}</Text>

        <View style={styles.rowBetween}>
          <Text style={[styles.status, item.status === "active" && styles.statusActive]}>{item.status.toUpperCase()}</Text>

          <Text style={styles.date}>{new Date(item.created_at).toLocaleDateString()}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.center}>
        <ActivityIndicator size="large" color="#a580e9" />
      </SafeAreaView>
    );
  }

  return (
    <View style={styles.container}>
      {console.log("listings", listings)}
      <TouchableOpacity style={styles.editProfileBtn} onPress={() => navigation.navigate("SellerProfile", { sellerId: Id, origin: "MyUser" })}>
        <Feather name="user" size={20} color="#004d40" />
        <Text style={styles.editProfileText}>My Profile</Text>
      </TouchableOpacity>

      <Text style={styles.header}>My Listings</Text>

      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      <FlatList
        data={listings}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderItem}
        contentContainerStyle={{ paddingVertical: 10 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={<Text style={styles.emptyText}>You haven't posted any listings yet.</Text>}
      />

      <TouchableOpacity style={styles.fab} onPress={() => navigation.navigate("CreateListing")}>
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>
    </View>
  );
};

export default MyListingsScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    paddingHorizontal: 16,
    paddingTop: 1,
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
  card: {
    flexDirection: "row",
    backgroundColor: "#f8fffe",
    borderWidth: 1,
    borderColor: "#a580e9",
    borderRadius: 12,
    padding: 10,
    marginBottom: 12,
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
    justifyContent: "center",
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

  rowBetween: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 10,
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
  editProfileBtn: {
    position: "absolute",
    top: 10,
    right: 16,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#c9fff8",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#a580e9",
    zIndex: 20,
  },

  editProfileText: {
    marginLeft: 6,
    color: "#004d40",
    fontWeight: "600",
    fontSize: 13,
  },
});
