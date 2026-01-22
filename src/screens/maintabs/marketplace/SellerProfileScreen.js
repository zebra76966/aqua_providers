import React, { useEffect, useState, useContext } from "react";
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, Image, TouchableOpacity, Modal, TextInput } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { AuthContext } from "../../../authcontext";
import { fetchSellerProfile, createSellerReview } from "./api/marketplace";
import RatingStars from "./RatingStars";
import { Feather } from "@expo/vector-icons";

const SellerProfileScreen = ({ route, navigation }) => {
  const { sellerId, origin } = route.params;
  const { token } = useContext(AuthContext);

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  // Review Modal
  const [reviewModal, setReviewModal] = useState(false);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const loadProfile = async () => {
    setLoading(true);
    try {
      const data = await fetchSellerProfile(sellerId, token);
      setProfile(data);
    } catch (e) {
      console.log("Profile error", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, []);

  const handleSubmitReview = async () => {
    if (!rating) return alert("Please select a rating");

    setSubmitting(true);
    try {
      await createSellerReview(sellerId, rating, comment, null, token);
      setReviewModal(false);
      setRating(0);
      setComment("");
      loadProfile(); // refresh
    } catch (err) {
      alert(err.message || "Failed to submit review");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || !profile) {
    return (
      <SafeAreaView style={styles.center}>
        <ActivityIndicator size="large" color="#a580e9" />
      </SafeAreaView>
    );
  }

  const tags = profile.expertise_tags?.length ? profile.expertise_tags.join(", ") : "No expertise added";

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={{ paddingBottom: 60 }}>
        {/* Header */}
        {console.log(profile)}
        {origin == "MyUser" && (
          <TouchableOpacity style={styles.editProfileBtn} onPress={() => navigation.navigate("UpdateSellerProfile")}>
            <Feather name="edit-3" size={20} color="#004d40" />
            <Text style={styles.editProfileText}>Update Profile</Text>
          </TouchableOpacity>
        )}
        <View style={styles.header}>
          <Image
            source={{
              uri: "https://ui-avatars.com/api/?name=" + encodeURIComponent(profile.username),
            }}
            style={styles.avatar}
          />

          <Text style={styles.name}>{profile.username}</Text>
          <Text style={styles.tags}>{tags}</Text>

          {/* Rating Row */}
          <View style={styles.ratingRow}>
            <RatingStars rating={profile.rating} interactive={false} size={20} />
            <Text style={styles.ratingText}>{profile.rating.toFixed(1)} / 5</Text>
          </View>

          <Text style={styles.statsText}>
            {profile.total_items_sold} items sold · {profile.active_listings} active listings
          </Text>
        </View>

        {/* Profile Video */}
        {profile.profile_video_url && (
          <View style={styles.videoBox}>
            <Text style={styles.sectionTitle}>Profile Video</Text>
            <Text style={styles.small}>Video available</Text>
          </View>
        )}

        {/* Reviews */}
        <View style={styles.section}>
          <View style={styles.reviewHeaderRow}>
            <Text style={styles.sectionTitle}>Reviews ({profile.reviews_count})</Text>
            {origin != "MyUser" && (
              <TouchableOpacity onPress={() => setReviewModal(true)} style={styles.reviewBtn}>
                <Text style={styles.reviewBtnText}>Write Review</Text>
              </TouchableOpacity>
            )}
          </View>

          {profile.recent_reviews?.length === 0 && <Text style={styles.noReviews}>No reviews yet.</Text>}

          {profile.recent_reviews?.map((rev) => (
            <View key={rev.id} style={styles.reviewCard}>
              <RatingStars rating={rev.rating} interactive={false} size={18} />
              <Text style={styles.reviewComment}>{rev.comment}</Text>
              <Text style={styles.reviewDate}>{new Date(rev.created_at).toLocaleDateString()}</Text>
            </View>
          ))}
        </View>
      </ScrollView>

      {/* Review Modal */}
      <Modal transparent visible={reviewModal} animationType="slide">
        <View style={styles.modalBg}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Write a Review</Text>

            <RatingStars rating={rating} setRating={setRating} />

            <TextInput placeholder="Comment" style={styles.input} placeholderTextColor="#999" multiline value={comment} onChangeText={setComment} />

            <View style={styles.modalBtns}>
              <TouchableOpacity onPress={() => setReviewModal(false)} style={styles.btnOutline}>
                <Text style={styles.btnOutlineText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity onPress={handleSubmitReview} style={styles.btnPrimary}>
                {submitting ? <ActivityIndicator color="#004d40" /> : <Text style={styles.btnPrimaryText}>Submit</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

export default SellerProfileScreen;

// --- Styles Below ---
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff", paddingHorizontal: 16 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },

  header: { alignItems: "center", marginVertical: 20 },
  avatar: { width: 90, height: 90, borderRadius: 45 },
  name: { fontSize: 20, fontWeight: "700", marginTop: 10, color: "#333" },
  tags: { marginTop: 6, color: "#777", textAlign: "center" },

  ratingRow: { flexDirection: "row", alignItems: "center", marginTop: 8 },
  ratingText: { marginLeft: 6, color: "#555", fontWeight: "600" },

  statsText: { marginTop: 10, color: "#666", fontSize: 13 },

  section: { marginVertical: 20 },
  sectionTitle: { fontSize: 18, fontWeight: "700", color: "#a580e9" },

  reviewHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  reviewBtn: {
    borderWidth: 1,
    borderColor: "#a580e9",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 10,
  },
  reviewBtnText: { color: "#a580e9", fontWeight: "600" },

  noReviews: { color: "#777", marginTop: 6 },
  reviewCard: {
    borderWidth: 1,
    borderColor: "#e6f7f7",
    backgroundColor: "#f8fffe",
    padding: 12,
    borderRadius: 10,
    marginTop: 10,
  },
  reviewComment: { marginTop: 4, color: "#555" },
  reviewDate: { marginTop: 4, fontSize: 12, color: "#777" },

  modalBg: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    paddingHorizontal: 20,
  },
  modalCard: { backgroundColor: "#fff", padding: 16, borderRadius: 14 },
  modalTitle: { fontSize: 18, fontWeight: "700" },

  input: {
    borderWidth: 1,
    borderColor: "#a580e9",
    borderRadius: 10,
    padding: 10,
    marginTop: 10,
    height: 80,
  },

  modalBtns: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: 12,
    gap: 10,
  },

  btnPrimary: {
    backgroundColor: "#a580e9",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
  },
  btnPrimaryText: { color: "#004d40", fontWeight: "700" },

  btnOutline: {
    borderWidth: 1,
    borderColor: "#a580e9",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
  },
  btnOutlineText: { color: "#a580e9", fontWeight: "700" },

  videoBox: {
    borderWidth: 1,
    borderColor: "#d6f7f4",
    backgroundColor: "#f8fffe",
    padding: 12,
    marginBottom: 20,
    borderRadius: 10,
  },
  small: { fontSize: 12, color: "#777", marginTop: 6 },
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
