import React, { useState, useEffect, useContext, useRef } from "react";
import { useRoute, useNavigation } from "@react-navigation/native";
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, ScrollView, Image, Alert, Animated } from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import { AuthContext } from "../../../authcontext";
import { baseUrl } from "../../../config";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";

import RBSheet from "react-native-raw-bottom-sheet";

const DiseaseScanScreen = () => {
  const route = useRoute();
  const { tankDataLocal } = route.params;

  const [facing, setFacing] = useState("back");
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [scanData, setScanData] = useState([]);
  const [zoom, setZoom] = useState(0);

  const cameraRef = useRef(null);
  const sheetRef = useRef(null);

  const navigation = useNavigation();
  const { token } = useContext(AuthContext);

  useEffect(() => {
    if (!permission) requestPermission();
  }, []);

  const handleScan = async () => {
    try {
      setScanned(true);
      if (!cameraRef.current) throw new Error("Camera not ready");

      const photo = await cameraRef.current.takePictureAsync({
        quality: 1,
        skipProcessing: false,
      });

      uploadImage(photo.uri);
    } catch (error) {
      alert(error.message || "Failed to capture image.");
      setScanned(false);
    }
  };

  const uploadImage = async (uri) => {
    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("image", {
        uri: uri.startsWith("file://") ? uri : `file://${uri}`,
        name: "disease_scan.jpg",
        type: "application/octet-stream",
      });

      const response = await fetch(`${baseUrl}/ai-model/disease/detection/`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      const result = await response.json();
      console.log("result", result);
      if (!response.ok) throw new Error(result.message || "Upload failed");

      const predictions = result?.data?.predictions || [];
      const mappedData = predictions.map((pred) => ({
        class_name: pred.class_name || "Unknown",
        confidence: pred.confidence || 0,
        bbox: pred.bbox || {},
        image_url: result?.data?.image_url || null,
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

  const getConfidenceColor = (value) => {
    if (value > 0.85) return "rgba(46,204,113,0.9)";
    if (value > 0.6) return "rgba(241,196,15,0.9)";
    return "rgba(231,76,60,0.9)";
  };

  const renderDiseaseCard = (disease, index) => {
    return (
      <View key={index} style={styles.card}>
        {disease.image_url && (
          <View style={styles.imageContainer}>
            <Image source={{ uri: disease.image_url }} style={styles.diseaseImage} resizeMode="cover" />
            <View style={[styles.confidenceBadge, { backgroundColor: getConfidenceColor(disease.confidence) }]}>
              <Icon name="alert-circle" size={16} color="#fff" style={{ marginRight: 4 }} />
              <Text style={styles.confidenceText}>{(disease.confidence * 100).toFixed(1)}%</Text>
            </View>
          </View>
        )}
        <Text style={styles.label}>Disease Name</Text>
        <Text style={styles.diseaseName}>{disease.class_name}</Text>

        {disease.bbox && (
          <Text style={styles.label}>
            BBox: x:{disease.bbox.x.toFixed(1)}, y:{disease.bbox.y.toFixed(1)}, w:{disease.bbox.width.toFixed(1)}, h:{disease.bbox.height.toFixed(1)}
          </Text>
        )}
      </View>
    );
  };

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

      <TouchableOpacity activeOpacity={0.7} style={styles.backButton} onPress={() => navigation.goBack()}>
        <Icon name="arrow-left" size={26} color="#fff" />
      </TouchableOpacity>
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
        <View style={{ ...styles.overlay, paddingBottom: 20 }}>
          <TouchableOpacity style={styles.button} onPress={handleScan}>
            <Text style={styles.buttonText}>Scan Disease</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.flipButton} onPress={() => setFacing((prev) => (prev === "back" ? "front" : "back"))}>
            <Text style={styles.flipText}>Flip</Text>
          </TouchableOpacity>
        </View>
      )}

      <RBSheet
        ref={sheetRef}
        closeOnDragDown
        closeOnPressMask
        height={600}
        customStyles={{
          wrapper: { backgroundColor: "rgba(0,0,0,0.5)" },
          container: { borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 15 },
          draggableIcon: { backgroundColor: "#ccc" },
        }}
      >
        <ScrollView>
          <Text style={styles.modalTitle}>Disease Detection Result</Text>
          {scanData.map((disease, index) => renderDiseaseCard(disease, index))}
        </ScrollView>
      </RBSheet>
    </View>
  );
};

export default DiseaseScanScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000" },
  camera: { flex: 1 },
  overlay: { position: "absolute", bottom: 60, width: "100%", alignItems: "center" },
  button: { backgroundColor: "#e74c3c", padding: 14, borderRadius: 8, marginBottom: 10, width: "100%", alignItems: "center" },
  buttonText: { color: "#fff", fontWeight: "bold", fontSize: 16 },
  flipButton: { padding: 10 },
  flipText: { color: "#fff", fontSize: 16 },
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },
  modalTitle: { fontSize: 20, fontWeight: "bold", marginBottom: 15, textAlign: "center" },
  card: { backgroundColor: "#f2f2f2", padding: 12, borderRadius: 8, marginBottom: 10 },
  imageContainer: { alignItems: "center", marginBottom: 10, position: "relative" },
  confidenceBadge: {
    position: "absolute",
    top: 8,
    right: 8,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.65)",
    borderRadius: 14,
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  confidenceText: { color: "#fff", fontWeight: "600", fontSize: 12 },
  diseaseImage: { width: "100%", height: 180, borderRadius: 8 },
  label: { fontWeight: "bold", marginTop: 6 },
  diseaseName: { fontSize: 16, marginBottom: 6 },
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
  backButton: {
    position: "absolute",
    top: 50,
    left: 20,
    backgroundColor: "#a580e9",
    borderRadius: 25,
    padding: 8,
    zIndex: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 4,
  },
});
