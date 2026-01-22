import React, { useState, useEffect, useRef, useContext } from "react";
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, Modal, ScrollView, Animated } from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import { useNavigation, useRoute } from "@react-navigation/native";
import Slider from "@react-native-community/slider";
import MaterialIcons from "react-native-vector-icons/MaterialCommunityIcons";
import { AuthContext } from "../authcontext";
import { baseUrl } from "../config";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import * as ImageManipulator from "expo-image-manipulator";

const PhScanScreen = () => {
  const [childModalVisible, setChildModalVisible] = useState(false);

  const [highPh, setHighPh] = useState(null);
  const [ammonia, setAmmonia] = useState(null);
  const [nitrite, setNitrite] = useState(null);
  const [nitrate, setNitrate] = useState(null);

  const [facing, setFacing] = useState("back");
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [loading, setLoading] = useState(false);
  const [scanResult, setScanResult] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [pHscale, setPhScale] = useState(3.5);

  const { token } = useContext(AuthContext);
  const navigation = useNavigation();
  const route = useRoute();
  const cameraRef = useRef(null);
  useEffect(() => {
    if (!permission) requestPermission();
  }, []);

  const hsvToRgb = (h, s, v) => {
    let f = (n, k = (n + h / 60) % 6) => v - v * s * Math.max(Math.min(k, 4 - k, 1), 0);
    const r = Math.round(f(5) * 255);
    const g = Math.round(f(3) * 255);
    const b = Math.round(f(1) * 255);
    return `rgb(${r}, ${g}, ${b})`;
  };

  const handleScan = async () => {
    if (!cameraRef.current) return;
    setLoading(true);
    setScanned(true);

    try {
      // 1. Take a picture from the camera
      const photo = await cameraRef.current.takePictureAsync({ base64: false });

      // 2. Compress the image
      const compressedPhoto = await ImageManipulator.manipulateAsync(
        photo.uri,
        [{ resize: { width: 800 } }], // scale down for faster uploads
        { compress: 0.6, format: ImageManipulator.SaveFormat.JPEG },
      );

      // 3. Build formData with compressed image
      const formData = new FormData();
      formData.append("image", {
        uri: compressedPhoto.uri,
        type: "image/jpeg",
        name: "ph-test.jpg",
      });

      // 4. Send POST request
      const response = await fetch(`${baseUrl}/ai-model/tankph-view/`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result?.message || "Failed to scan pH");
      }

      // set values and show modal
      console.log("result", result);
      setScanResult(result.data);
      setPhScale(result.data.estimated_ph || 3.5);
      setModalVisible(true);
    } catch (error) {
      console.error(error);
      Alert.alert("Error", error.message || "Something went wrong");
      setScanned(false);
    } finally {
      setLoading(false);
    }
  };

  const flipCamera = () => {
    setFacing((prev) => (prev === "back" ? "front" : "back"));
  };

  const handleConfirm = () => {
    setModalVisible(false);
    if (route.params?.onScanComplete) {
      route.params.onScanComplete({
        ...scanResult,
        estimated_ph: pHscale,
      });
    }
    navigation.goBack(); // ✅ return to form
  };

  const handleRetake = () => {
    setModalVisible(false);
    setScanned(false);
    setScanResult(null);
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

  // Chart data
  const testKitChart = {
    pH: [
      { value: 6.0, color: "#f7f6aa" },
      { value: 6.4, color: "#f5f4bf" },
      { value: 6.6, color: "#d0e2b3" },
      { value: 6.8, color: "#b5d1bb" },
      { value: 7.0, color: "#a0cbc4" },
      { value: 7.2, color: "#91c2c5" },
      { value: 7.6, color: "#6ca9d4" },
    ],
    highPh: [
      { value: 7.4, color: "#c59f58" },
      { value: 7.8, color: "#c07d4a" },
      { value: 8.0, color: "#a55e48" },
      { value: 8.2, color: "#824647" },
      { value: 8.4, color: "#6c4272" },
      { value: 8.8, color: "#5a3972" },
    ],
    ammonia: [
      { value: "0 ppm", color: "#f3f265" },
      { value: "0.25 ppm", color: "#d4d45e" },
      { value: "0.50 ppm", color: "#b7c45e" },
      { value: "1.0 ppm", color: "#88b64f" },
      { value: "2.0 ppm", color: "#6ca143" },
      { value: "4.0 ppm", color: "#497d36" },
      { value: "8.0 ppm", color: "#2d5e2c" },
    ],
    nitrite: [
      { value: "0 ppm", color: "#cfe9f3" },
      { value: "0.25 ppm", color: "#9d98cf" },
      { value: "0.50 ppm", color: "#8162a7" },
      { value: "1.0 ppm", color: "#814d76" },
      { value: "2.0 ppm", color: "#6d3563" },
      { value: "5.0 ppm", color: "#5a1f49" },
    ],
    nitrate: [
      { value: "0 ppm", color: "#f3e264" },
      { value: "5 ppm", color: "#dca149" },
      { value: "10 ppm", color: "#c76f38" },
      { value: "20 ppm", color: "#b14b2a" },
      { value: "40 ppm", color: "#a33428" },
      { value: "80 ppm", color: "#892529" },
      { value: "160 ppm", color: "#661c22" },
    ],
  };

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
        Animated.sequence([Animated.timing(scale, { toValue: 1.2, duration: 600, useNativeDriver: true }), Animated.timing(scale, { toValue: 1, duration: 600, useNativeDriver: true })]),
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
      <CameraView style={styles.camera} facing={facing} ref={cameraRef}>
        {loading ? (
          <LoadingScreen />
        ) : (
          <View style={styles.overlay}>
            <TouchableOpacity style={styles.button} onPress={handleScan}>
              <Text style={styles.buttonText}>Scan pH test strip</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.flipButton} onPress={flipCamera}>
              <Text style={styles.flipText}>Flip</Text>
            </TouchableOpacity>
          </View>
        )}
      </CameraView>

      {/* Result Modal */}
      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.modalBackground}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Water Test Results</Text>

            {console.log("scanResult", scanResult)}
            {scanResult && (
              <View style={styles.resultBox}>
                <View style={styles.resultRow}>
                  <MaterialIcons name="flask-outline" size={22} color="#a580e9" />
                  <Text style={styles.resultText}>Estimated pH: {pHscale.toFixed(1)}</Text>
                </View>
                {/* <View style={styles.resultRow}>
                  <MaterialIcons name="water" size={22} color="#a580e9" />
                  <Text style={styles.resultText}>Oxygen: {scanResult.estimated_oxygen_mgL} mg/L</Text>
                </View> */}
                <View style={styles.resultRow}>
                  <MaterialIcons name="leaf" size={22} color="#a580e9" />
                  <Text style={styles.resultText}>Nitrate: {scanResult.estimated_nitrate_ppm} ppm</Text>
                </View>
                <View style={styles.resultRow}>
                  <MaterialIcons name="leaf-maple" size={22} color="#a580e9" />
                  <Text style={styles.resultText}>Nitrite: {scanResult.estimated_nitrite_ppm} ppm</Text>
                </View>
                <View style={styles.resultRow}>
                  <MaterialIcons name="fish" size={22} color="#a580e9" />
                  <Text style={styles.resultText}>Ammonia: {scanResult.estimated_ammonia_ppm} ppm</Text>
                </View>
                {/* <View style={styles.resultRow}>
                  <MaterialIcons name="cloud-outline" size={22} color="#a580e9" />
                  <Text style={styles.resultText}>CO₂ Level: {scanResult.estimated_co2_level}</Text>
                </View> */}
                {scanResult?.average_color_hsv && (
                  <View style={styles.colorPreviewContainer}>
                    <Text style={styles.colorPreviewLabel}>Detected Color</Text>
                    <View
                      style={[
                        styles.colorCircle,
                        {
                          backgroundColor: `rgb(${scanResult.avg_color_rgb[0]}, ${scanResult.avg_color_rgb[1]}, ${scanResult.avg_color_rgb[2]})`,
                        },
                      ]}
                    />
                  </View>
                )}
              </View>
            )}

            {/* Button inside main modal */}
            <View style={styles.actionRow}>
              <TouchableOpacity style={[styles.actionButton, { backgroundColor: "#3498db", marginTop: 10 }]} onPress={() => setChildModalVisible(true)}>
                <Text style={styles.actionText}>Open Full Test Chart</Text>
              </TouchableOpacity>
            </View>
            {/* Slider (still optional if you want both methods) */}
            <View style={{ marginVertical: 15 }}>
              <Text style={styles.sliderLabelText}>Adjust pH</Text>
              <Slider
                style={{ width: "100%", height: 40 }}
                minimumValue={0}
                maximumValue={14}
                value={pHscale}
                onValueChange={setPhScale}
                minimumTrackTintColor="#a580e9"
                maximumTrackTintColor="#ccc"
                thumbTintColor="#a580e9"
              />
              <Text style={styles.sliderValue}>{pHscale.toFixed(1)}</Text>
            </View>

            {/* Action Buttons */}
            <View style={styles.actionRow}>
              <TouchableOpacity style={[styles.actionButton, { backgroundColor: "#e74c3c" }]} onPress={handleRetake}>
                <Text style={styles.actionText}>Retake</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.actionButton, { backgroundColor: "#27ae60" }]} onPress={handleConfirm}>
                <Text style={styles.actionText}>Confirm</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Child Modal for Chart */}
      <Modal visible={childModalVisible} transparent animationType="fade">
        <View style={styles.modalBackground}>
          <View style={[styles.modalContent, { maxHeight: "85%" }]}>
            <Text style={styles.modalTitle}>Select Test Values</Text>

            {/* 🔑 Scrollable container */}
            <ScrollView contentContainerStyle={styles.scrollContent}>
              {Object.entries(testKitChart).map(([key, values]) => (
                <View key={key} style={{ marginBottom: 15 }}>
                  <Text
                    style={{
                      fontWeight: "600",
                      marginBottom: 6,
                      textTransform: "capitalize",
                    }}
                  >
                    {key}
                  </Text>
                  <View style={styles.colorGrid}>
                    {values.map((item, idx) => {
                      const isSelected =
                        (key === "pH" && pHscale === item.value) ||
                        (key === "highPh" && highPh === item.value) ||
                        (key === "ammonia" && ammonia === item.value) ||
                        (key === "nitrite" && nitrite === item.value) ||
                        (key === "nitrate" && nitrate === item.value);

                      return (
                        <TouchableOpacity
                          key={idx}
                          style={[styles.colorBox, { backgroundColor: item.color }, isSelected && styles.colorBoxSelected]}
                          onPress={() => {
                            if (key === "pH") setPhScale(item.value);
                            if (key === "highPh") setHighPh(item.value);
                            if (key === "ammonia") setAmmonia(item.value);
                            if (key === "nitrite") setNitrite(item.value);
                            if (key === "nitrate") setNitrate(item.value);
                          }}
                        >
                          <Text style={styles.colorValue}>{item.value}</Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>
              ))}

              {/* Done button at the bottom */}
              <TouchableOpacity style={[styles.actionButton, { backgroundColor: "#27ae60", marginTop: 10 }]} onPress={() => setChildModalVisible(false)}>
                <Text style={styles.actionText}>Done</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default PhScanScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000" },
  camera: { flex: 0.8 },
  overlay: {
    position: "absolute",
    bottom: 60,
    width: "100%",
    alignItems: "center",
  },
  button: {
    backgroundColor: "#2196F3",
    padding: 14,
    borderRadius: 8,
    marginBottom: 10,
    width: "60%",
    alignItems: "center",
  },
  buttonText: { color: "#fff", fontWeight: "bold", fontSize: 16 },
  flipButton: { padding: 10 },
  flipText: { color: "#fff", fontSize: 16 },
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },

  // modal styles
  modalBackground: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 20,
    width: "85%",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 12,
    textAlign: "center",
    color: "#333",
  },
  resultBox: { marginBottom: 10 },
  resultRow: { flexDirection: "row", alignItems: "center", marginBottom: 6 },
  resultText: { marginLeft: 8, fontSize: 15, color: "#444" },

  sliderLabelText: { textAlign: "center", color: "#333", fontWeight: "600" },
  sliderValue: {
    textAlign: "center",
    color: "#a580e9",
    fontWeight: "bold",
    marginTop: 4,
  },
  actionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 15,
  },
  actionButton: {
    flex: 1,
    marginHorizontal: 6,
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  colorPreviewContainer: {
    marginTop: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  colorPreviewLabel: {
    fontSize: 14,
    color: "#555",
    marginBottom: 8,
  },
  colorCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 2,
    borderColor: "#ccc",
  },
  colorGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    marginVertical: 10,
  },
  colorBox: {
    width: 60,
    height: 40,
    margin: 6,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#ccc",
  },
  colorBoxSelected: {
    borderWidth: 3,
    borderColor: "#a580e9",
  },
  colorValue: {
    fontWeight: "bold",
    color: "#333",
  },
  scrollContent: {
    paddingBottom: 20,
  },

  actionText: { color: "#fff", fontWeight: "bold" },
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
});
