// screens/ListingDetailsScreen.js
import React, { useEffect, useState, useContext } from "react";
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity, Modal, TextInput, Alert, ScrollView, Image } from "react-native";
import { AuthContext } from "../../../authcontext";
import { fetchListingDetails, placeBid } from "./api/marketplace";
import { SafeAreaView } from "react-native-safe-area-context";

const ListingDetailsScreen = ({ route, navigation }) => {
  const { token } = useContext(AuthContext);
  const { listingId } = route.params;

  const [listing, setListing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [bidModalVisible, setBidModalVisible] = useState(false);
  const [bidAmount, setBidAmount] = useState("");
  const [bidMessage, setBidMessage] = useState("");
  const [bidLoading, setBidLoading] = useState(false);

  const loadDetails = async () => {
    setError("");
    try {
      const data = await fetchListingDetails(listingId, token);
      setListing(data);
    } catch (err) {
      setError(err.message || "Failed to load listing");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDetails();
  }, [listingId]);

  const handlePlaceBid = async () => {
    if (!bidAmount) {
      Alert.alert("Error", "Please enter bid amount");
      return;
    }
    setBidLoading(true);
    try {
      await placeBid(listingId, bidAmount, bidMessage, token);
      Alert.alert("Success", "Bid placed successfully!");
      setBidModalVisible(false);
      setBidAmount("");
      setBidMessage("");

      // 🔥 Re-fetch listing + bids
      loadDetails();
    } catch (err) {
      Alert.alert("Error", err.message || "Failed to place bid");
    } finally {
      setBidLoading(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.center}>
        <ActivityIndicator size="large" color="#a580e9" />
      </SafeAreaView>
    );
  }

  if (!listing) {
    return (
      <SafeAreaView style={styles.center}>
        <Text style={styles.errorText}>{error || "Listing not found"}</Text>
      </SafeAreaView>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      {/* Buttons */}

      {/*  FIXED BOTTOM BUTTON BAR */}
      {listing.status !== "sold" && (
        <SafeAreaView style={styles.bottomBar}>
          {!listing.is_mine_listing && (!listing.my_bidding_history || listing.my_bidding_history.length === 0) && (
            <TouchableOpacity style={styles.buttonPrimary} onPress={() => setBidModalVisible(true)}>
              <Text style={styles.buttonPrimaryText}>Place a Bid</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity style={styles.buttonOutline} onPress={() => navigation.navigate("ListingBids", { listingId })}>
            <Text style={styles.buttonOutlineText}>View Bids</Text>
          </TouchableOpacity>
        </SafeAreaView>
      )}

      <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 300 }}>
        {/* Top Image */}
        <View style={styles.imageWrapper}>
          <Image source={{ uri: listing.thumbnail }} style={styles.image} />

          {/* Price Badge */}
          <View style={styles.priceBadge}>
            <Text style={styles.priceBadgeText}>€{listing.base_price}</Text>
          </View>

          {/* Status Badge */}
          <View style={[styles.statusBadge, listing.status === "active" && styles.statusActive]}>
            <Text style={styles.statusBadgeText}>{listing.status.toUpperCase()}</Text>
          </View>
        </View>

        {/* Title */}
        <Text style={styles.title}>{listing.title}</Text>

        {console.log("listing id", listing)}

        {/* Seller + Created Date */}
        <View style={styles.metaRow}>
          <TouchableOpacity onPress={() => navigation.navigate("SellerProfile", { sellerId: listing.seller_user_id, origin: "OtherUser" })}>
            <Text style={[styles.metaText, { color: "#a580e9", fontWeight: "600" }]}>Seller: {listing.seller}</Text>
          </TouchableOpacity>

          <Text style={styles.metaText}>{new Date(listing.created_at).toLocaleDateString()}</Text>
        </View>

        {/* Description Box */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Description</Text>
          <View style={styles.descriptionBox}>
            <Text style={styles.descriptionText}>{listing.description}</Text>
          </View>
        </View>

        {listing.my_bidding_history && listing.my_bidding_history.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Your Bid</Text>

            <View style={styles.myBidCard}>
              <Text style={styles.myBidAmount}>€{listing.my_bidding_history[0].amount}</Text>

              <Text
                style={[
                  styles.statusBadgeSmall,
                  listing.my_bidding_history[0].status === "pending" && styles.statusPending,
                  listing.my_bidding_history[0].status === "accepted" && styles.statusAccepted,
                  listing.my_bidding_history[0].status === "rejected" && styles.statusRejected,
                ]}
              >
                {listing.my_bidding_history[0].status.toUpperCase()}
              </Text>

              <Text style={styles.bidDate}>{new Date(listing.my_bidding_history[0].created_at).toLocaleString()}</Text>
            </View>
          </View>
        )}

        {/* 🔶 TOP 5 BIDS */}
        {listing.bidding_history && listing.bidding_history.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Top Bids</Text>

            {listing.bidding_history.slice(0, 5).map((bid) => (
              <View key={bid.id} style={styles.bidCard}>
                <View style={styles.bidRow}>
                  <Text style={styles.bidBuyer}>{bid.buyer}</Text>

                  <Text
                    style={[
                      styles.statusBadgeSmall,
                      bid.status === "pending" && styles.statusPending,
                      bid.status === "accepted" && styles.statusAccepted,
                      bid.status === "rejected" && styles.statusRejected,
                    ]}
                  >
                    {bid.status.toUpperCase()}
                  </Text>
                </View>

                <Text style={styles.bidAmount}>€{bid.amount}</Text>

                <Text style={styles.bidDate}>{new Date(bid.created_at).toLocaleString()}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Bid Modal */}
        <Modal visible={bidModalVisible} animationType="fade" transparent onRequestClose={() => setBidModalVisible(false)}>
          <View style={styles.modalBackdrop}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Place a Bid</Text>

              <TextInput style={styles.input} keyboardType="numeric" placeholder="Amount" placeholderTextColor="#a580e9" value={bidAmount} onChangeText={setBidAmount} />

              <TextInput style={[styles.input, { height: 80 }]} placeholder="Message (optional)" placeholderTextColor="#a580e9" value={bidMessage} onChangeText={setBidMessage} multiline />

              <View style={styles.modalButtons}>
                <TouchableOpacity style={styles.buttonOutlineSmall} onPress={() => setBidModalVisible(false)} disabled={bidLoading}>
                  <Text style={styles.buttonOutlineText}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.buttonPrimarySmall} onPress={handlePlaceBid} disabled={bidLoading}>
                  {bidLoading ? <ActivityIndicator color="#004d40" /> : <Text style={styles.buttonPrimaryText}>Submit</Text>}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </ScrollView>
    </View>
  );
};

export default ListingDetailsScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ffffff",
    paddingHorizontal: 16,
    paddingTop: 10,
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#ffffff",
  },

  // IMAGE AREA
  imageWrapper: {
    width: "100%",
    height: 240,
    borderRadius: 16,
    overflow: "hidden",
    marginBottom: 14,
    position: "relative",
  },
  image: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },

  priceBadge: {
    position: "absolute",
    bottom: 12,
    left: 12,
    backgroundColor: "#a580e9",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 10,
  },
  priceBadgeText: {
    color: "#004d40",
    fontWeight: "bold",
    fontSize: 16,
  },

  statusBadge: {
    position: "absolute",
    top: 12,
    right: 12,
    backgroundColor: "#ccc",
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 10,
  },
  statusActive: {
    backgroundColor: "#c9ffee",
  },
  statusBadgeText: {
    color: "#333",
    fontWeight: "bold",
    fontSize: 12,
  },

  // CONTENT
  title: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 4,
  },

  metaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  metaText: {
    color: "#555",
    fontSize: 14,
  },

  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontWeight: "600",
    fontSize: 18,
    marginBottom: 6,
    color: "#a580e9",
  },
  descriptionBox: {
    backgroundColor: "#f8fffe",
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: "#d6f7f4",
  },
  descriptionText: {
    color: "#555",
    fontSize: 14,
    lineHeight: 20,
  },

  // Button
  bottomBar: {
    position: "absolute",
    bottom: 30,
    left: 0,
    right: 0,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,

    gap: 12,
    zIndex: 100,
  },

  buttonPrimary: {
    flex: 1,
    backgroundColor: "#a580e9",
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
  },
  buttonPrimaryText: {
    color: "#004d40",
    fontWeight: "bold",
  },
  buttonOutline: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#a580e9",
    backgroundColor: "#ffffff",
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
  },
  buttonOutlineText: {
    color: "#a580e9",
    fontWeight: "bold",
  },

  // MODAL
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    paddingHorizontal: 20,
  },
  modalContent: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 12,
  },

  input: {
    borderWidth: 1,
    borderColor: "#a580e9",
    borderRadius: 10,
    padding: 10,
    marginBottom: 12,
    color: "#000",
  },

  modalButtons: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 10,
    marginTop: 6,
  },
  buttonPrimarySmall: {
    backgroundColor: "#a580e9",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 10,
  },
  buttonOutlineSmall: {
    borderWidth: 1,
    borderColor: "#a580e9",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 10,
  },
  /* --- MY BID (highlighted card) --- */
  myBidCard: {
    backgroundColor: "#e6fffb",
    borderWidth: 1,
    borderColor: "#a580e9",
    borderRadius: 10,
    padding: 14,
    marginTop: 6,
  },
  myBidAmount: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#006d63",
  },
  bidDate: {
    marginTop: 6,
    color: "#777",
    fontSize: 12,
  },

  /* --- BID CARD --- */
  bidCard: {
    backgroundColor: "#f8fffe",
    borderWidth: 1,
    borderColor: "#d8f5f1",
    padding: 12,
    borderRadius: 10,
    marginTop: 10,
  },
  bidRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  bidBuyer: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
  },
  bidAmount: {
    marginTop: 4,
    fontSize: 16,
    fontWeight: "bold",
    color: "#a580e9",
  },

  /* --- STATUS BADGES --- */
  statusBadgeSmall: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    fontSize: 10,
    fontWeight: "bold",
    color: "#fff",
  },
  statusPending: {
    backgroundColor: "#f0ad4e",
  },
  statusAccepted: {
    backgroundColor: "#4caf50",
  },
  statusRejected: {
    backgroundColor: "#e57373",
  },
});
