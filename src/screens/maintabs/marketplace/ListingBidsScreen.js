// screens/ListingBidsScreen.js
import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, ActivityIndicator, FlatList, TouchableOpacity, Alert } from "react-native";
import { fetchBids, acceptBid, rejectBid } from "./api/marketplace";
import { AuthContext } from "../../../authcontext";
import { useContext } from "react";

const ListingBidsScreen = ({ route }) => {
  const { token } = useContext(AuthContext);
  const { listingId } = route.params;
  const [bids, setBids] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState(null);
  const [error, setError] = useState("");

  const loadBids = async () => {
    setError("");
    try {
      const data = await fetchBids(listingId, token);
      setBids(data);
    } catch (err) {
      setError(err.message || "Failed to load bids");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBids();
  }, [listingId]);

  const handleAccept = async (bidId) => {
    setActionLoadingId(bidId);
    try {
      await acceptBid(bidId, token);
      Alert.alert("Success", "Bid accepted");
      loadBids();
    } catch (err) {
      Alert.alert("Error", err.message || "Failed to accept bid");
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleReject = async (bidId) => {
    setActionLoadingId(bidId);
    try {
      await rejectBid(bidId, token);
      Alert.alert("Success", "Bid rejected");
      loadBids();
    } catch (err) {
      Alert.alert("Error", err.message || "Failed to reject bid");
    } finally {
      setActionLoadingId(null);
    }
  };

  const renderItem = ({ item }) => {
    const isBusy = actionLoadingId === item.id;

    return (
      <View style={styles.card}>
        <Text style={styles.amount}>${item.amount}</Text>
        {item.bidder && <Text style={styles.bidder}>By: {item.bidder.username || item.bidder.name}</Text>}
        {!!item.message && <Text style={styles.message}>{item.message}</Text>}

        <View style={styles.actionsRow}>
          <TouchableOpacity style={[styles.actionButton, styles.acceptButton]} onPress={() => handleAccept(item.id)} disabled={isBusy}>
            <Text style={styles.actionText}>{isBusy ? "..." : "Accept"}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.actionButton, styles.rejectButton]} onPress={() => handleReject(item.id)} disabled={isBusy}>
            <Text style={styles.actionText}>{isBusy ? "..." : "Reject"}</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#a580e9" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Bids for Listing #{listingId}</Text>

      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      <FlatList data={bids} keyExtractor={(item) => item.id.toString()} renderItem={renderItem} ListEmptyComponent={<Text style={styles.emptyText}>No bids yet.</Text>} />
    </View>
  );
};

export default ListingBidsScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ffffff",
    paddingHorizontal: 16,
    paddingTop: 20,
  },
  center: {
    flex: 1,
    backgroundColor: "#ffffff",
    justifyContent: "center",
    alignItems: "center",
  },
  header: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#a580e9",
    marginBottom: 12,
  },
  card: {
    borderWidth: 1,
    borderColor: "#a580e9",
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
  },
  amount: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#a580e9",
  },
  bidder: {
    fontSize: 13,
    color: "#555",
    marginTop: 4,
  },
  message: {
    marginTop: 6,
    color: "#666",
  },
  actionsRow: {
    flexDirection: "row",
    marginTop: 10,
    gap: 8,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: "center",
  },
  acceptButton: {
    backgroundColor: "#a580e9",
  },
  rejectButton: {
    backgroundColor: "#ff4d4f",
  },
  actionText: {
    color: "#fff",
    fontWeight: "bold",
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
});
