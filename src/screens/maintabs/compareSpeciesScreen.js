import React, { useContext, useEffect, useState } from "react";
import { View, Text, StyleSheet, ActivityIndicator, Image, ScrollView, TouchableOpacity, Alert } from "react-native";
import { useRoute, useNavigation } from "@react-navigation/native";
import { AuthContext } from "../../authcontext";
import { baseUrl } from "../../config";
import { Ionicons } from "@expo/vector-icons";
import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";

const CompareSpeciesScreen = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const { token } = useContext(AuthContext);

  const { tankId, tankDataLocal } = route.params || {};

  const [tank, setTank] = useState(tankDataLocal || null);
  const [loading, setLoading] = useState(false);

  const [imageUri, setImageUri] = useState(null);
  const [trackResult, setTrackResult] = useState(null);
  const [compareResult, setCompareResult] = useState(null);

  // Fetch tank if not passed in
  useEffect(() => {
    if (!tank && tankId && token) {
      fetchTankData();
    }
  }, [tankId, token]);

  const fetchTankData = async () => {
    try {
      setLoading(true);
      const tankRes = await fetch(`${baseUrl}/tanks/tank/${tankId}/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const tankJson = await tankRes.json();
      console.log("Fetched tank data (compare screen):", tankJson);
      setTank(tankJson.data);
    } catch (err) {
      console.error("Error fetching tank data:", err);
      Alert.alert("Error", "Failed to load tank details.");
    } finally {
      setLoading(false);
    }
  };

  const handlePickImage = async () => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permissionResult.granted) {
        Alert.alert("Permission required", "We need access to your photos to select an image.");
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.7,
      });

      if (!result.canceled) {
        const uri = result.assets[0].uri;
        setImageUri(uri);
        setTrackResult(null);
        setCompareResult(null);
      }
    } catch (err) {
      console.error("Error picking image:", err);
      Alert.alert("Error", "Could not open the image picker.");
    }
  };

  const handleCameraCapture = async () => {
    try {
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted) {
        return Alert.alert("Permission required", "Camera access is needed to capture an image.");
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        quality: 0.7,
      });

      if (!result.canceled) {
        const uri = result.assets[0].uri;
        setImageUri(uri);
        setTrackResult(null);
        setCompareResult(null);
      }
    } catch (err) {
      console.error("Camera error:", err);
      Alert.alert("Error", "Could not open camera.");
    }
  };

  const handleRunComparison = async () => {
    if (!imageUri) {
      Alert.alert("No image", "Please select an image first.");
      return;
    }

    try {
      setLoading(true);

      // Normalize URI for FormData
      const normalizedUri = imageUri.startsWith("file://") ? imageUri : `file://${imageUri}`;

      // 1️⃣ Call species-track to get predictions + crop_temp_path
      const trackFormData = new FormData();
      // NOTE: If backend expects "video" instead of "file", change "file" to "video"
      trackFormData.append("file", {
        uri: normalizedUri,
        name: "fish_compare.jpg",
        type: "image/jpeg",
      });

      const trackRes = await fetch(`${baseUrl}/ai-model/species-track/`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          // Don't set Content-Type manually for multipart
        },
        body: trackFormData,
      });

      const trackJson = await trackRes.json();
      console.log("🐟 Species Track Response:", trackJson);

      if (!trackRes.ok) {
        throw new Error(trackJson.detail || "Species-track request failed");
      }

      setTrackResult(trackJson);
      const cropTempPath = trackJson?.species?.[0]?.crop_temp_path;
      console.log("📌 crop_temp_path from track:", cropTempPath);

      // 2️⃣ Call species-compare with same file
      const compareFormData = new FormData();
      compareFormData.append("file", {
        uri: normalizedUri,
        name: "fish_compare.jpg",
        type: "image/jpeg",
      });

      const compareRes = await fetch(`${baseUrl}/ai-model/species-compare/`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: compareFormData,
      });

      const compareJson = await compareRes.json();
      console.log("🔍 Species Compare Response:", compareJson);
      console.log("🔍 Species Compare images array:", compareJson?.results?.[0]?.snapshot_images);

      if (!compareRes.ok) {
        throw new Error(compareJson.detail || "Species-compare request failed");
      }

      const snapshots = compareJson?.results?.[0]?.snapshot_images || [];
      console.log("🔍 Species Compare images array:", snapshots);

      setCompareResult({
        ...compareJson,
        snapshots: snapshots,
      });
    } catch (err) {
      console.error("Error during comparison:", err);
      Alert.alert("Error", err.message || "Failed to run comparison.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={{ flex: 1, ...styles.container }}>
      {/* Header */}
      <View style={{ ...styles.header }}>
        <View style={styles.tankCard}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={{ ...styles.backBtn, backgroundColor: "#1f1f1f", borderRadius: 8 }}>
            <Ionicons name="arrow-back" size={24} color="#a580e9" />
          </TouchableOpacity>
          <View style={{ marginLeft: 12, flex: 1 }}>
            <Text style={styles.tankName}>{tank?.name || "Compare Species"}</Text>
            {tank && (
              <>
                <Text style={styles.tankDetail}>
                  {tank.tank_type} • {tank.size} {tank.size_unit}
                </Text>
                {tank.notes ? <Text style={styles.tankNotes}>{tank.notes}</Text> : null}
              </>
            )}
          </View>
        </View>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 100 }}>
        <Text style={styles.sectionTitle}>Compare Species</Text>

        {/* Upload / Preview Card */}
        {/* Hide upload card after results come */}
        {!compareResult && (
          <View style={styles.uploadCard}>
            {imageUri ? (
              <Image source={{ uri: imageUri }} style={styles.previewImage} />
            ) : (
              <View style={styles.placeholderBox}>
                <MaterialCommunityIcons name="image-search-outline" size={46} color="#858585" />
                <Text style={styles.placeholderText}>Select or capture a fish image to compare.</Text>
              </View>
            )}

            {/* Buttons Row */}
            <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
              {/* Select Image */}
              <TouchableOpacity style={[styles.primaryBtn, { flex: 1, marginRight: 6 }]} onPress={handlePickImage}>
                <Feather name="image" size={18} color="#000" />
                <Text style={styles.primaryBtnText}>Gallery</Text>
              </TouchableOpacity>

              {/* Camera */}
              <TouchableOpacity style={[styles.primaryBtn, { flex: 1, marginLeft: 6 }]} onPress={handleCameraCapture}>
                <Feather name="camera" size={18} color="#000" />
                <Text style={styles.primaryBtnText}>Camera</Text>
              </TouchableOpacity>
            </View>

            {imageUri && (
              <TouchableOpacity style={[styles.primaryBtn, styles.runBtn]} onPress={handleRunComparison} disabled={loading}>
                {loading ? (
                  <ActivityIndicator size="small" color="#000" />
                ) : (
                  <>
                    <MaterialCommunityIcons name="cube-scan" size={18} color="#000" />
                    <Text style={styles.primaryBtnText}>Run Comparison</Text>
                  </>
                )}
              </TouchableOpacity>
            )}
          </View>
        )}

        {compareResult?.snapshots && (
          <View style={styles.snapshotSection}>
            <Text style={styles.snapshotTitle}>Snapshot History</Text>

            {compareResult.snapshots.length === 0 ? (
              <Text style={styles.noSnapshotsText}>No history found for this species.</Text>
            ) : (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 10 }}>
                {compareResult.snapshots.map((item, index) => (
                  <View key={index} style={styles.snapshotCard}>
                    <Image source={{ uri: item.url }} style={styles.snapshotImage} />
                    <Text style={styles.snapshotTimestamp}>{item.timestamp_str}</Text>
                  </View>
                ))}
              </ScrollView>
            )}
          </View>
        )}
        {compareResult && (
          <TouchableOpacity
            style={[styles.primaryBtn, { backgroundColor: "#a580e9", marginTop: 20 }]}
            onPress={() => {
              setImageUri(null);
              setTrackResult(null);
              setCompareResult(null);
            }}
          >
            <MaterialCommunityIcons name="reload" size={18} color="#000" />
            <Text style={styles.primaryBtnText}>Compare Again</Text>
          </TouchableOpacity>
        )}
      </ScrollView>

      {/* Global Loader Overlay (optional) */}
      {loading && (
        <View style={styles.loaderOverlay}>
          <ActivityIndicator size="large" color={styles.colors.primary} />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  colors: {
    primary: "#a580e9",
    secondary: "#000",
    white: "#fff",
  },
  container: {
    flex: 1,
    backgroundColor: "#fff",
    padding: 16,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  tankCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f8f9fa",
    padding: 16,
    borderRadius: 12,
    marginBottom: 10,
    flex: 1,
  },
  tankName: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#000",
  },
  tankDetail: {
    fontSize: 14,
    color: "#555",
    marginVertical: 2,
  },
  tankNotes: {
    fontSize: 13,
    fontStyle: "italic",
    color: "#333",
  },
  backBtn: {
    padding: 6,
    marginRight: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#000",
    marginBottom: 10,
  },

  // Upload / preview area
  uploadCard: {
    backgroundColor: "#f8f9fa",
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  placeholderBox: {
    height: 180,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#ddd",
    borderStyle: "dashed",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 14,
    paddingHorizontal: 20,
  },
  placeholderText: {
    marginTop: 8,
    fontSize: 14,
    color: "#555",
    textAlign: "center",
  },
  previewImage: {
    width: "100%",
    height: 200,
    borderRadius: 12,
    marginBottom: 14,
    backgroundColor: "#e0e0e0",
  },

  primaryBtn: {
    backgroundColor: "#a580e9",
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 30,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },
  primaryBtnText: {
    color: "#000",
    fontWeight: "bold",
    fontSize: 15,
    marginLeft: 8,
  },
  runBtn: {
    backgroundColor: "#ff8c00",
  },

  // Result cards
  resultCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  resultTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#000",
    marginBottom: 6,
  },
  resultLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: "#555",
  },
  resultValue: {
    fontSize: 14,
    color: "#000",
    marginTop: 2,
  },
  resultValueSmall: {
    fontSize: 12,
    color: "#333",
    marginTop: 2,
  },

  loaderOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.1)",
    justifyContent: "center",
    alignItems: "center",
  },
  snapshotSection: {
    backgroundColor: "#fff",
    padding: 14,
    borderRadius: 12,
    marginTop: 10,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },

  snapshotTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#000",
  },

  noSnapshotsText: {
    fontSize: 14,
    color: "#666",
    marginTop: 10,
    fontStyle: "italic",
  },

  snapshotCard: {
    marginRight: 14,
    width: 150,
    backgroundColor: "#f8f9fa",
    borderRadius: 12,
    padding: 10,
    shadowColor: "#000",
    shadowOpacity: 0.07,
    shadowRadius: 3,
    elevation: 3,
    alignItems: "center",
  },

  snapshotImage: {
    width: 130,
    height: 90,
    borderRadius: 10,
    marginBottom: 8,
    backgroundColor: "#e0e0e0",
  },

  snapshotTimestamp: {
    fontSize: 12,
    color: "#555",
    textAlign: "center",
  },
});

export default CompareSpeciesScreen;
