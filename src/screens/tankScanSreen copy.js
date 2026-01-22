import React, { useState, useEffect, useContext, useRef } from "react";
import { useRoute } from "@react-navigation/native";
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, ScrollView, TextInput, Image, Alert, Animated } from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import { useNavigation } from "@react-navigation/native";
import { AuthContext } from "../authcontext";
import { baseUrl } from "../config";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import RBSheet from "react-native-raw-bottom-sheet";

import * as ImageManipulator from "expo-image-manipulator";

const TankScanScreen = () => {
  const { token, logout, activeTankId, activateTank } = useContext(AuthContext);
  const route = useRoute();
  const { tankDataLocal } = route.params;
  const [facing, setFacing] = useState("back");
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [scanData, setScanData] = useState([]);
  const [scanType, setScanType] = useState("fish");
  const [zoom, setZoom] = useState(0);

  const cameraRef = useRef(null);
  const sheetRef = useRef(null);

  const navigation = useNavigation();

  useEffect(() => {
    if (!permission) requestPermission();
  }, []);

  // --- CAMERA CAPTURE ---
  const handleScan = async () => {
    try {
      setScanned(true);
      if (!cameraRef.current) throw new Error("Camera not ready");

      // Capture full-quality image
      let photo = await cameraRef.current.takePictureAsync({
        quality: 1,
        skipProcessing: false,
      });

      uploadImage(photo.uri);
    } catch (error) {
      alert(error.message || "Failed to capture image.");
      setScanned(false);
    }
  };

  // --- UPLOAD TO AI (NEW MULTIMODEL ENDPOINT) ---
  const uploadImage = async (uri) => {
    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("image", {
        uri: uri.startsWith("file://") ? uri : `file://${uri}`,
        name: "scan.jpg",
        type: "application/octet-stream",
      });
      formData.append("type", scanType);

      const response = await fetch(`${baseUrl}/ai-model/inference/multimodel/`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      const result = await response.json();
      console.log(result);
      if (!response.ok) throw new Error(result.detail || "Upload failed");

      // --- NEW STRUCTURE ---
      const predictions = result?.data?.predictions || [];
      const mappedData = predictions.map((pred) => ({
        class_name: pred.class_name || "Unknown",
        confidence: pred.confidence || 0,
        metadata: {
          species_name: pred.metadata?.species_name || pred.species?.name || "Unknown Species",
          species_Nomenclature: pred.metadata?.species_Nomenclature || pred.species?.scientific_name || "",
          max_size_cm: pred.metadata?.max_size_cm || pred.metadata?.maximum_size || "",
          summary: pred.metadata?.summary || "",
          distribution: pred.metadata?.distribution || "",
          category: pred.species?.category || "",
        },
        image_url: pred.metadata?.image_url || result?.data?.image_url || null,
        quantity: "1",
        notes: "",
      }));

      setScanData(mappedData);
      sheetRef.current.open();
    } catch (error) {
      alert(error.message);
      setScanned(false);
    } finally {
      setIsUploading(false);
      setScanned(false);
    }
  };

  // --- SUBMIT ALL SPECIES ---
  const handleSubmit = async () => {
    try {
      for (let fish of scanData) {
        const payload = {
          tank_id: tankDataLocal.id,
          species_name: fish.metadata.species_name,
          class_name: fish.class_name,
          quantity: fish.quantity,
          notes: fish.notes,
          last_scan_image_url: fish.image_url,
        };
        console.log("Submitting species:", payload);

        const res = await fetch(`${baseUrl}/tanks/${tankDataLocal.id}/add-species/`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        });

        if (!res.ok) {
          const errorText = await res.text();
          throw new Error("Failed to add species: " + errorText);
        }
      }

      Alert.alert("Success", "Species added successfully!");
      sheetRef.current.close();

      await activateTank(tankDataLocal.id);
      navigation.navigate("TankAddWaterParams", {
        origin: "TankScan",
        tankData: tankDataLocal,
      });
    } catch (error) {
      Alert.alert("Error", error.message);
      console.log(error);
    }
  };

  // --- HELPER: CONFIDENCE COLORS ---
  const getConfidenceColor = (value) => {
    if (value > 0.85) return "rgba(46,204,113,0.9)";
    if (value > 0.6) return "rgba(241,196,15,0.9)";
    return "rgba(231,76,60,0.9)";
  };

  console.log(tankDataLocal);

  // --- RENDER FISH FORM ---
  const renderFishCard = (fish, index) => (
    <View key={index} style={styles.card}>
      {fish.image_url && (
        <View style={styles.imageContainer}>
          <Image source={{ uri: fish.image_url }} style={styles.fishImage} resizeMode="cover" />

          {/* Confidence Badge */}
          <View style={[styles.confidenceBadge, { backgroundColor: getConfidenceColor(fish.confidence) }]}>
            <Icon name="shield-check" size={16} color="#fff" style={{ marginRight: 4 }} />
            <Text style={styles.confidenceText}>{(fish.confidence * 100).toFixed(1)}%</Text>
          </View>
        </View>
      )}

      <Text style={styles.label}>Species Name</Text>
      <TextInput style={styles.input} value={fish.metadata.species_name} onChangeText={(t) => updateField(index, "metadata.species_name", t)} />

      <Text style={styles.label}>Scientific Name</Text>
      <TextInput style={styles.input} value={fish.metadata.species_Nomenclature} onChangeText={(t) => updateField(index, "metadata.species_Nomenclature", t)} />

      <Text style={styles.label}>Quantity</Text>
      <TextInput style={styles.input} keyboardType="numeric" value={fish.quantity} onChangeText={(t) => updateField(index, "quantity", t)} />

      <Text style={styles.label}>Notes</Text>
      <TextInput style={styles.input} value={fish.notes} onChangeText={(t) => updateField(index, "notes", t)} />

      <View style={styles.actionRow}>
        <TouchableOpacity style={styles.iconButton} onPress={() => handleRemove(index)}>
          <Icon name="delete" size={25} color="red" />
        </TouchableOpacity>
      </View>
    </View>
  );

  const updateField = (index, field, value) => {
    const updated = [...scanData];
    if (field.startsWith("metadata.")) {
      const key = field.split(".")[1];
      updated[index].metadata[key] = value;
    } else {
      updated[index][field] = value;
    }
    setScanData(updated);
  };

  const handleRemove = (index) => {
    const updated = scanData.filter((_, i) => i !== index);
    setScanData(updated);
  };

  // --- CAMERA PERMISSION ---

  if (!permission) return <View />;
  if (!permission.granted) {
    return (
      <View style={styles.centered}>
        <Text>We need your permission to access the camera.</Text>
        <TouchableOpacity onPress={requestPermission} style={styles.button}>
          <Text style={styles.buttonText}>Grant Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const LoadingScreen = () => {
    const [dots, setDots] = useState(".");

    useEffect(() => {
      const interval = setInterval(() => {
        setDots((prev) => (prev.length >= 3 ? "." : prev + "."));
      }, 500);
      return () => clearInterval(interval);
    }, []);

    const scale = useRef(new Animated.Value(1)).current;

    useEffect(() => {
      Animated.loop(
        Animated.sequence([Animated.timing(scale, { toValue: 1.2, duration: 600, useNativeDriver: true }), Animated.timing(scale, { toValue: 1, duration: 600, useNativeDriver: true })])
      ).start();
    }, []);

    return (
      <View style={styles.loadingContainer}>
        <Animated.View style={{ transform: [{ scale }] }}>
          <Icon name="fish" size={60} color="#a580e9" />
        </Animated.View>
        <Text style={styles.loadingText}>Analyzing {dots}</Text>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <CameraView style={styles.camera} facing={facing} ref={cameraRef} zoom={zoom} />
      <View style={styles.zoomVerticalContainer}>
        <TouchableOpacity style={styles.zoomButton} onPress={() => setZoom(Math.min(1, zoom + 0.1))}>
          <Icon name="plus" size={20} color="#fff" />
        </TouchableOpacity>

        <View style={styles.zoomVerticalBar}>
          <View style={[styles.zoomVerticalLevel, { height: `${zoom * 100}%` }]} />
        </View>

        <TouchableOpacity style={styles.zoomButton} onPress={() => setZoom(Math.max(0, zoom - 0.1))}>
          <Icon name="minus" size={20} color="#fff" />
        </TouchableOpacity>
      </View>

      {scanned || isUploading ? (
        <LoadingScreen />
      ) : (
        <View style={{ ...styles.overlay, paddingBottom: 50 }}>
          <View style={styles.toggleContainer}>
            <TouchableOpacity style={[styles.toggleButton, scanType === "fish" && styles.activeToggle]} onPress={() => setScanType("fish")}>
              <Text style={[styles.toggleText, scanType === "fish" && styles.activeText]}>Fish</Text>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.toggleButton, scanType === "plant" && styles.activeToggle]} onPress={() => setScanType("plant")}>
              <Text style={[styles.toggleText, scanType === "plant" && styles.activeText]}>Plant</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.button} onPress={handleScan}>
            <Text style={styles.buttonText}>Scan Tank</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.flipButton} onPress={() => setFacing((prev) => (prev === "back" ? "front" : "back"))}>
            <Text style={styles.flipText}>Flip</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Bottom Sheet */}
      <RBSheet
        ref={sheetRef}
        closeOnDragDown
        closeOnPressMask
        height={600}
        customStyles={{
          wrapper: { backgroundColor: "rgba(0,0,0,0.5)" },
          container: {
            borderTopLeftRadius: 20,
            borderTopRightRadius: 20,
            padding: 15,
          },
          draggableIcon: { backgroundColor: "#ccc" },
        }}
      >
        {/* Close Button */}
        <TouchableOpacity style={styles.closeButton} onPress={() => sheetRef.current.close()}>
          <Icon name="close" size={26} color="#fcfcfcff" />
        </TouchableOpacity>

        <ScrollView>
          <Text style={styles.modalTitle}>Review & Add Species</Text>
          {scanData.map((fish, index) => renderFishCard(fish, index))}
          {scanData.length > 0 && (
            <TouchableOpacity style={[styles.button, { marginTop: 20 }]} onPress={handleSubmit}>
              <Text style={styles.buttonText}>Confirm & Save</Text>
            </TouchableOpacity>
          )}
        </ScrollView>
      </RBSheet>
    </View>
  );
};

export default TankScanScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000" },
  camera: { flex: 1 },
  overlay: {
    position: "absolute",
    bottom: 60,
    width: "100%",
    alignItems: "center",
  },
  button: {
    backgroundColor: "#a580e9",
    padding: 14,
    borderRadius: 8,
    marginBottom: 10,
    width: "100%",
    alignItems: "center",
  },
  buttonText: { color: "#fff", fontWeight: "bold", fontSize: 16 },
  flipButton: { padding: 10 },
  flipText: { color: "#fff", fontSize: 16 },
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 15,
    textAlign: "center",
  },
  card: {
    backgroundColor: "#f2f2f2",
    padding: 12,
    borderRadius: 8,
    marginBottom: 10,
  },
  fishImage: {
    width: "100%",
    height: 180,
    borderRadius: 8,
  },
  imageContainer: {
    alignItems: "center",
    marginBottom: 10,
    position: "relative",
  },
  confidenceBadge: {
    position: "absolute",
    top: 8,
    right: 8,
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 14,
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  confidenceText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 12,
  },
  label: {
    fontWeight: "bold",
    marginTop: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 6,
    padding: 6,
    marginBottom: 8,
    backgroundColor: "#fff",
  },
  actionRow: {
    flexDirection: "row",
    marginTop: 8,
    justifyContent: "flex-end",
  },
  iconButton: {
    marginRight: 5,
    backgroundColor: "#383838ff",
    paddingVertical: 3,
    borderRadius: 6,
    paddingHorizontal: 10,
  },
  loadingContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.85)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 10,
  },
  loadingText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
    marginTop: 15,
  },
  iconPulse: {
    transform: [{ scale: 1 }],
  },
  toggleContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginBottom: 15,
  },
  toggleButton: {
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderWidth: 1,
    borderColor: "#a580e9",
    borderRadius: 20,
    marginHorizontal: 5,
  },
  activeToggle: {
    backgroundColor: "#a580e9",
  },
  toggleText: {
    color: "#a580e9",
    fontWeight: "600",
  },
  activeText: {
    color: "#fff",
  },
  closeButton: {
    position: "absolute",
    right: 15,
    top: 10,
    zIndex: 10,
    backgroundColor: "#1b1b1bff",
    borderRadius: 20,
    padding: 5,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  zoomContainer: {
    alignItems: "center",
    marginTop: 10,
  },
  zoomLabel: {
    color: "#fff",
    fontSize: 14,
    marginBottom: 4,
  },
  zoomSlider: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    width: "70%",
  },
  zoomBar: {
    height: 4,
    flex: 1,
    backgroundColor: "#555",
    borderRadius: 2,
    marginHorizontal: 10,
    overflow: "hidden",
  },
  zoomLevel: {
    height: "100%",
    backgroundColor: "#a580e9",
  },
  zoomVerticalContainer: {
    position: "absolute",
    top: 80, // tweak for your layout
    right: 20,
    alignItems: "center",
    zIndex: 10,
  },

  zoomButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(0,0,0,0.5)",
    alignItems: "center",
    justifyContent: "center",
    marginVertical: 8,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 3,
  },

  zoomVerticalBar: {
    width: 5,
    height: 110,
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: 3,
    marginVertical: 8,
    overflow: "hidden",
  },

  zoomVerticalLevel: {
    width: "100%",
    backgroundColor: "#a580e9",
    position: "absolute",
    bottom: 0,
  },
});
