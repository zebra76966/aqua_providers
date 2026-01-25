import React, { useEffect, useState, useContext } from "react";
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity, Linking, Alert, Modal, TextInput } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import MapView, { Marker } from "react-native-maps";
import { AuthContext } from "../../../authcontext";
import { baseUrl } from "../../../config";

export default function BreederDetailScreen({ route, navigation }) {
  const { id } = route.params;
  const { token } = useContext(AuthContext);

  const [loading, setLoading] = useState(true);
  const [breeder, setBreeder] = useState(null);

  // Review flow
  const [reviewOpen, setReviewOpen] = useState(false);
  const [reviewText, setReviewText] = useState("");
  const [reviewRating, setReviewRating] = useState(0);
  const [submittingReview, setSubmittingReview] = useState(false);

  useEffect(() => {
    fetchBreeder();
  }, []);

  const fetchBreeder = async () => {
    try {
      const res = await fetch(`${baseUrl}/breeders/${id}/`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const json = await res.json();
      setBreeder(json?.data || null);
    } catch {
      Alert.alert("Error", "Failed to load breeder details");
    } finally {
      setLoading(false);
    }
  };

  const submitReview = async () => {
    if (!reviewRating || !reviewText.trim()) {
      Alert.alert("Missing info", "Please add rating and comment");
      return;
    }

    try {
      setSubmittingReview(true);

      await fetch(`${baseUrl}/breeders/${id}/reviews/`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          rating: reviewRating,
          comment: reviewText,
        }),
      });

      setReviewOpen(false);
      setReviewText("");
      setReviewRating(0);
      fetchBreeder();
    } catch {
      Alert.alert("Error", "Failed to submit review");
    } finally {
      setSubmittingReview(false);
    }
  };

  const openMapExternal = () => {
    if (!breeder?.location) return;
    const { lat, lon } = breeder.location;
    Linking.openURL(`https://www.google.com/maps?q=${lat},${lon}`);
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <ActivityIndicator size="large" color="#a580e9" style={{ marginTop: 40 }} />
      </SafeAreaView>
    );
  }

  if (!breeder) return null;

  return (
    <SafeAreaView style={styles.safe} edges={["left", "right", "bottom"]}>
      <ScrollView contentContainerStyle={styles.container}>
        {/* ---------- Header ---------- */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={22} color="#a580e9" />
          </TouchableOpacity>

          <View style={{ marginLeft: 12 }}>
            <Text style={styles.name}>{breeder.name}</Text>
            <Text style={styles.ratingText}>
              ⭐ {breeder.rating} • {breeder.reviews} reviews
            </Text>
          </View>
        </View>

        {/* ---------- Map + Distance ---------- */}
        {breeder.location && (
          <View style={styles.section}>
            <View style={styles.mapHeader}>
              <Text style={styles.sectionHeader}>Location</Text>
              {breeder.distance_km && <Text style={styles.distance}>{Number(breeder.distance_km).toFixed(1)} km away</Text>}
            </View>

            <MapView
              style={styles.map}
              initialRegion={{
                latitude: breeder.location.lat,
                longitude: breeder.location.lon,
                latitudeDelta: 0.01,
                longitudeDelta: 0.01,
              }}
            >
              <Marker
                coordinate={{
                  latitude: breeder.location.lat,
                  longitude: breeder.location.lon,
                }}
                onPress={openMapExternal}
              />
            </MapView>
          </View>
        )}

        {/* ---------- Company ---------- */}
        {breeder.company && (
          <View style={styles.section}>
            <View style={styles.row}>
              <Ionicons name="business-outline" size={18} color="#a580e9" />
              <Text style={styles.sectionTitle}>{breeder.company}</Text>
            </View>
          </View>
        )}

        {/* ---------- About ---------- */}
        {breeder.bio && (
          <View style={styles.section}>
            <Text style={styles.sectionHeader}>About</Text>
            <Text style={styles.bio}>{breeder.bio}</Text>
          </View>
        )}

        {/* ---------- Species ---------- */}
        {breeder.species?.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionHeader}>Species Bred</Text>

            {breeder.species.map((s) => (
              <View key={s.id} style={styles.speciesCard}>
                <Ionicons name="fish-outline" size={18} color="#a580e9" />
                <View style={{ marginLeft: 10 }}>
                  <Text style={styles.speciesName}>{s.species_name}</Text>
                  {s.scientific_name && <Text style={styles.speciesSub}>{s.scientific_name}</Text>}
                </View>
              </View>
            ))}
          </View>
        )}

        {/* ---------- Contact / Socials ---------- */}
        {breeder.contact && (
          <View style={styles.section}>
            <Text style={styles.sectionHeader}>Contact</Text>

            {breeder.contact.email && (
              <TouchableOpacity style={styles.contactRow} onPress={() => Linking.openURL(`mailto:${breeder.contact.email}`)}>
                <Ionicons name="mail-outline" size={18} color="#a580e9" />
                <Text style={styles.contactText}>{breeder.contact.email}</Text>
              </TouchableOpacity>
            )}

            {breeder.contact.website && (
              <TouchableOpacity style={styles.contactRow} onPress={() => Linking.openURL(breeder.contact.website)}>
                <Ionicons name="globe-outline" size={18} color="#a580e9" />
                <Text style={styles.contactText}>Website</Text>
              </TouchableOpacity>
            )}

            {breeder.contact.instagram && (
              <TouchableOpacity style={styles.contactRow} onPress={() => Linking.openURL(breeder.contact.instagram)}>
                <Ionicons name="logo-instagram" size={18} color="#a580e9" />
                <Text style={styles.contactText}>Instagram</Text>
              </TouchableOpacity>
            )}

            {breeder.contact.facebook && (
              <TouchableOpacity style={styles.contactRow} onPress={() => Linking.openURL(breeder.contact.facebook)}>
                <Ionicons name="logo-facebook" size={18} color="#a580e9" />
                <Text style={styles.contactText}>Facebook</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* ---------- Reviews ---------- */}
        <View style={styles.section}>
          <View style={styles.reviewHeader}>
            <Text style={styles.sectionHeader}>Reviews</Text>
            <TouchableOpacity onPress={() => setReviewOpen(true)}>
              <Text style={styles.writeReview}>Write a review</Text>
            </TouchableOpacity>
          </View>

          {breeder.reviews_list?.length ? (
            breeder.reviews_list.map((r) => (
              <View key={r.id} style={styles.reviewCard}>
                <Text style={styles.reviewUser}>{r.user}</Text>
                <Text style={styles.reviewStars}>{"⭐".repeat(r.rating)}</Text>
                <Text style={styles.reviewText}>{r.comment}</Text>
                <Text style={styles.reviewDate}>{r.date}</Text>
              </View>
            ))
          ) : (
            <Text style={styles.emptyText}>No reviews yet</Text>
          )}
        </View>
      </ScrollView>

      {/* ---------- Write Review Modal ---------- */}
      <Modal visible={reviewOpen} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>Write a Review</Text>

            <View style={styles.starRow}>
              {[1, 2, 3, 4, 5].map((i) => (
                <TouchableOpacity key={i} onPress={() => setReviewRating(i)}>
                  <Ionicons name={i <= reviewRating ? "star" : "star-outline"} size={28} color="#f5c518" />
                </TouchableOpacity>
              ))}
            </View>

            <TextInput placeholder="Share your experience" placeholderTextColor="#999" value={reviewText} onChangeText={setReviewText} multiline style={styles.reviewInput} />

            <TouchableOpacity style={styles.submitBtn} onPress={submitReview} disabled={submittingReview}>
              {submittingReview ? <ActivityIndicator /> : <Text style={styles.submitText}>Submit Review</Text>}
            </TouchableOpacity>

            <TouchableOpacity onPress={() => setReviewOpen(false)}>
              <Text style={styles.cancel}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

/* ---------------- STYLES ---------------- */

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#F8F8F8" },
  container: { padding: 20, paddingBottom: 100 },

  header: { flexDirection: "row", alignItems: "center", marginBottom: 20 },
  name: { fontSize: 22, fontWeight: "800" },
  ratingText: { fontSize: 13, color: "#555", marginTop: 4 },

  section: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
  },

  sectionHeader: { fontSize: 16, fontWeight: "700", marginBottom: 10 },
  sectionTitle: { marginLeft: 8, fontSize: 15, fontWeight: "600" },

  row: { flexDirection: "row", alignItems: "center" },

  bio: { fontSize: 14, lineHeight: 20, color: "#555" },

  mapHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
  },

  map: { height: 180, borderRadius: 12 },
  distance: { fontSize: 12, color: "#a580e9" },

  speciesCard: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },

  speciesName: { fontSize: 14, fontWeight: "600" },
  speciesSub: { fontSize: 12, color: "#777" },

  contactRow: { flexDirection: "row", alignItems: "center", paddingVertical: 10 },
  contactText: { marginLeft: 10, fontSize: 14, color: "#a580e9" },

  reviewHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  writeReview: { color: "#a580e9", fontWeight: "600" },

  reviewCard: {
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
    paddingVertical: 12,
  },

  reviewUser: { fontWeight: "600" },
  reviewStars: { color: "#f5c518", marginVertical: 2 },
  reviewText: { fontSize: 13, color: "#555" },
  reviewDate: { fontSize: 11, color: "#999", marginTop: 4 },

  emptyText: { fontSize: 12, color: "#777" },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
  },

  modal: {
    backgroundColor: "#fff",
    margin: 20,
    borderRadius: 16,
    padding: 16,
  },

  modalTitle: { fontSize: 16, fontWeight: "700" },

  starRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginVertical: 14,
  },

  reviewInput: {
    backgroundColor: "#F4F4F4",
    borderRadius: 12,
    padding: 12,
    minHeight: 80,
    textAlignVertical: "top",
  },

  submitBtn: {
    backgroundColor: "#a580e9",
    padding: 14,
    borderRadius: 12,
    marginTop: 14,
  },

  submitText: { textAlign: "center", fontWeight: "700" },

  cancel: {
    textAlign: "center",
    color: "#777",
    marginTop: 10,
  },
});
