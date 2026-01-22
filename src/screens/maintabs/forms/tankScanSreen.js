import React, { useState, useEffect, useContext, useRef } from "react";
import { useRoute } from "@react-navigation/native";
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, ScrollView, TextInput, Image, Alert, Animated } from "react-native";
import { Camera, useCameraPermissions, CameraType, CameraView } from "expo-camera";
import { useNavigation } from "@react-navigation/native";
import { AuthContext } from "../../../authcontext";
import { baseUrl } from "../../../config";
import { Video } from "expo-av";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import RBSheet from "react-native-raw-bottom-sheet";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { SafeAreaView } from "react-native-safe-area-context";
import * as ImageManipulator from "expo-image-manipulator";
import * as ImagePicker from "expo-image-picker";

const TankScanScreenTabs = () => {
  const insets = useSafeAreaInsets();
  const route = useRoute();

  // NEW STATE
  const [captureMode, setCaptureMode] = useState("video"); // "video" | "image"
  const [imageUri, setImageUri] = useState(null);

  const { tankDataLocal } = route.params;
  const [facing, setFacing] = useState("back");
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [scanData, setScanData] = useState([]);
  const [scanType, setScanType] = useState("fish");
  const [zoom, setZoom] = useState(0);

  const [recording, setRecording] = useState(false);
  const [videoUri, setVideoUri] = useState(null);
  const [showPreview, setShowPreview] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);

  useEffect(() => {
    let interval;
    if (recording) {
      interval = setInterval(() => {
        setRecordingTime((prev) => {
          if (prev >= 9) {
            // Stop at 10
            cameraRef.current?.stopRecording();
            return 10;
          }
          return prev + 1;
        });
      }, 1000);
    } else {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [recording]);

  const cameraRef = useRef(null);
  const sheetRef = useRef(null);

  const navigation = useNavigation();

  const { token } = useContext(AuthContext);

  useEffect(() => {
    if (!permission) requestPermission();
  }, []);

  const handleRecordVideo = async () => {
    if (!cameraRef.current) return;

    try {
      const cameraPermission = await Camera.requestCameraPermissionsAsync();
      const micPermission = await Camera.requestMicrophonePermissionsAsync();

      if (!cameraPermission.granted || !micPermission.granted) {
        Alert.alert("Permission required", "Camera and microphone permissions are needed.");
        return;
      }

      setRecording(true);
      setRecordingTime(0);

      let recordingStarted = false;

      // Start recording
      const recordPromise = cameraRef.current.recordAsync({
        quality: "720p",
      });

      // Wait 300–500ms to ensure recording is initialized before we schedule the stop
      setTimeout(() => {
        recordingStarted = true;
      }, 500);

      // Auto stop after 10s (but only if recording actually started)
      const timeout = setTimeout(() => {
        if (recordingStarted && cameraRef.current) {
          cameraRef.current.stopRecording();
        }
      }, 10500); // small buffer, since init takes ~500ms

      const video = await recordPromise;

      clearTimeout(timeout);

      if (video?.uri) {
        setVideoUri(video.uri);
        setShowPreview(true);
      } else {
        Alert.alert("Error", "No video was recorded. Try again.");
      }
    } catch (err) {
      console.error("Record error:", err);
      Alert.alert("Error", err.message || "Failed to record video. Try again.");
    } finally {
      setRecording(false);
    }
  };

  const handleStopRecording = async () => {
    try {
      if (cameraRef.current && recording) {
        setRecording(false);
        await cameraRef.current.stopRecording();
      }
    } catch (err) {
      console.warn("Stop recording error:", err.message);
    }
  };

  // --- UPLOAD TO AI ---
  // --- UPLOAD TO AI (NEW MULTIMODEL ENDPOINT) ---
  const uploadMedia = async (uri, type = "video") => {
    setIsUploading(true);
    setShowPreview(false);

    try {
      const formData = new FormData();
      formData.append(type, {
        uri: uri.startsWith("file://") ? uri : `file://${uri}`,
        name: type === "video" ? "tank_scan.mp4" : "tank_scan.jpg",
        type: type === "video" ? "video/mp4" : "image/jpeg",
      });

      const response = await fetch("https://api.aquaai.uk/api/v1/ai-model/species-track/", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      const result = await response.json();
      console.log("result", result);
      if (!response.ok) throw new Error(result.detail || `${type} upload failed`);
      // (keep your mapping code the same)
      const predictions = result?.species || [];

      const mappedData = predictions.map((pred) => ({
        class_name: pred.class_name || "Unknown",
        confidence: pred.confidence || 0,
        crop_temp_path: pred.crop_temp_path || "",
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
      setTimeout(() => sheetRef.current?.open?.(), 100);
    } catch (error) {
      Alert.alert("Error", error.message);
    } finally {
      setIsUploading(false);
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
          crop_temp_path: fish.crop_temp_path,
        };

        console.log("payload", payload);

        console.log(fish);
        const res = await fetch(`${baseUrl}/tanks/${tankDataLocal.id}/add-species/`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        });

        if (!res.ok) {
          const errorText = await res.text(); // safer
          console.log("Error response:", errorText);
          throw new Error("Failed to add species: " + errorText);
        }
      }

      Alert.alert("Success", "Species added successfully!");
      sheetRef.current.close();
      navigation.navigate("TankDetail", {
        tankId: tankDataLocal.id,
        tankData: tankDataLocal,
      });
    } catch (error) {
      Alert.alert("Error", error.message);
      console.log(error);
    }
  };

  const getConfidenceColor = (value) => {
    if (value > 0.85) return "rgba(46,204,113,0.9)"; // green
    if (value > 0.6) return "rgba(241,196,15,0.9)"; // yellow
    return "rgba(231,76,60,0.9)"; // red
  };

  const handleTakePicture = async () => {
    if (!cameraRef.current) return;
    try {
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.8,
        base64: false,
      });
      if (photo?.uri) {
        setImageUri(photo.uri);
        setShowPreview(true);
      } else {
        Alert.alert("Error", "No image captured. Try again.");
      }
    } catch (err) {
      Alert.alert("Error", err.message || "Failed to take picture.");
    }
  };

  const [readyToShow, setReadyToShow] = useState(true);
  useEffect(() => {
    setReadyToShow(false);
    const t = setTimeout(() => setReadyToShow(true), 250); // short delay for unmount/remount
    return () => clearTimeout(t);
  }, [captureMode, facing]);

  // --- RENDER FISH FORM ---
  const FishCard = ({ fish, index, handleRemove, updateField, getConfidenceColor }) => {
    const [editing, setEditing] = useState(false);
    const [imageLoaded, setImageLoaded] = useState(true);

    return (
      <View key={index} style={styles.card}>
        <View style={styles.imageContainer}>
          <Image
            source={imageLoaded && fish.image_url ? { uri: fish.image_url } : require("../../../assets/placeholder-fish.png")}
            style={styles.fishImage}
            resizeMode="cover"
            onError={() => setImageLoaded(false)}
          />

          {/* Overlay info */}
          <View style={styles.overlayInfo}>
            <Text style={styles.overlayText} numberOfLines={1}>
              {fish.metadata.species_name || "Unknown"}
            </Text>
            <Text style={styles.overlaySubText} numberOfLines={1}>
              {fish.metadata.species_Nomenclature || ""}
            </Text>
            <Text style={styles.overlayQty}>Qty: {fish.quantity || "1"}</Text>
          </View>

          {/* Confidence Badge */}
          <View style={[styles.confidenceBadge, { backgroundColor: getConfidenceColor(fish.confidence) }]}>
            <Icon name="shield-check" size={16} color="#fff" style={{ marginRight: 4 }} />
            <Text style={styles.confidenceText}>{(fish.confidence * 100).toFixed(1)}%</Text>
          </View>

          {/* Action buttons */}
          <View style={styles.imageActions}>
            <TouchableOpacity style={styles.iconButtonSmall} onPress={() => setEditing(!editing)}>
              <Icon name={editing ? "check" : "pencil"} size={20} color="#fff" />
            </TouchableOpacity>
            <TouchableOpacity style={[styles.iconButtonSmall, { backgroundColor: "#ff4d4d" }]} onPress={() => handleRemove(index)}>
              <Icon name="delete" size={20} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Editable fields */}
        {editing && (
          <View style={styles.editSection}>
            <Text style={styles.label}>Species Name</Text>
            <TextInput style={styles.input} value={fish.metadata.species_name} placeholderTextColor="#999" onChangeText={(t) => updateField(index, "metadata.species_name", t)} />

            <Text style={styles.label}>Scientific Name</Text>
            <TextInput style={styles.input} value={fish.metadata.species_Nomenclature} placeholderTextColor="#999" onChangeText={(t) => updateField(index, "metadata.species_Nomenclature", t)} />

            <Text style={styles.label}>Quantity</Text>
            <TextInput style={styles.input} keyboardType="numeric" placeholderTextColor="#999" value={fish.quantity} onChangeText={(t) => updateField(index, "quantity", t)} />

            <Text style={styles.label}>Notes</Text>
            <TextInput style={styles.input} value={fish.notes} placeholderTextColor="#999" onChangeText={(t) => updateField(index, "notes", t)} />
          </View>
        )}
      </View>
    );
  };

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

  const handlePickFromGallery = async () => {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permission.granted) {
        Alert.alert("Permission required", "Gallery access is needed.");
        return;
      }

      // Only open gallery ONCE, with cropping
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.All,
        quality: 1,
        allowsEditing: true, // cropping here!!
        aspect: [4, 3],
      });

      if (result.canceled || !result.assets?.length) return;

      const asset = result.assets[0];

      if (asset.type === "video") {
        setVideoUri(asset.uri);
        setShowPreview(true);
        return;
      }

      // Single cropped image, no second picker!
      setImageUri(asset.uri);
      setShowPreview(true);
    } catch (err) {
      Alert.alert("Error", err.message || "Failed to pick media.");
    }
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

  if (showPreview && (videoUri || imageUri)) {
    const isVideo = !!videoUri;
    return (
      <SafeAreaView style={[styles.previewContainer, { flex: 1 }]}>
        <Text style={styles.previewTitle}>{isVideo ? "Preview Video" : "Preview Image"}</Text>

        {isVideo ? (
          <Video style={styles.previewVideo} source={{ uri: videoUri }} useNativeControls resizeMode="contain" shouldPlay />
        ) : (
          <Image style={styles.previewVideo} source={{ uri: imageUri }} resizeMode="contain" />
        )}

        <View style={styles.previewButtonsContainer}>
          <TouchableOpacity
            style={[styles.previewButton, { backgroundColor: "#e74c3c" }]}
            onPress={() => {
              setShowPreview(false);
              setVideoUri(null);
              setImageUri(null);
            }}
          >
            <Icon name="refresh" size={20} color="#fff" style={{ marginRight: 6 }} />
            <Text style={styles.previewButtonText}>Retake</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.previewButton, { backgroundColor: "#2ecc71" }]} onPress={() => uploadMedia(isVideo ? videoUri : imageUri, isVideo ? "video" : "image")}>
            <Icon name="upload" size={20} color="#fff" style={{ marginRight: 6 }} />
            <Text style={styles.previewButtonText}>Upload</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <View style={styles.container}>
      {permission?.granted && readyToShow && (
        <CameraView
          key={`${captureMode}-${facing}`} // ensure full remount when mode or facing changes
          mode={captureMode}
          facing={facing}
          ref={cameraRef}
          style={styles.camera}
          zoom={zoom}
          onCameraReady={() => console.log("Camera ready")}
        />
      )}

      <TouchableOpacity activeOpacity={0.7} style={styles.backButton} onPress={() => navigation.goBack()}>
        <Icon name="arrow-left" size={26} color="#fff" />
      </TouchableOpacity>

      <TouchableOpacity activeOpacity={0.8} style={styles.galleryButton} onPress={handlePickFromGallery}>
        <Icon name="image-multiple" size={26} color="#fff" />
      </TouchableOpacity>

      <View style={styles.captureToggleContainer}>
        <TouchableOpacity style={[styles.toggleButton, captureMode === "video" && styles.activeToggle]} onPress={() => setCaptureMode("video")}>
          <Text style={[styles.toggleText, captureMode === "video" && styles.activeText]}>Video</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.toggleButton, captureMode === "image" && styles.activeToggle]} onPress={() => setCaptureMode("image")}>
          <Text style={[styles.toggleText, captureMode === "image" && styles.activeText]}>Image</Text>
        </TouchableOpacity>
      </View>

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

          {recording && <Text style={{ color: "#fff", fontSize: 18, marginBottom: 8 }}>{recordingTime}s</Text>}

          {!recording ? (
            captureMode === "video" ? (
              <TouchableOpacity style={styles.button} onPress={handleRecordVideo}>
                <Text style={styles.buttonText}>Record Video (10s)</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity style={styles.button} onPress={handleTakePicture}>
                <Text style={styles.buttonText}>Capture Image</Text>
              </TouchableOpacity>
            )
          ) : (
            <TouchableOpacity style={[styles.button, { backgroundColor: "#e74c3c" }]} onPress={handleStopRecording}>
              <Text style={styles.buttonText}>Stop Recording</Text>
            </TouchableOpacity>
          )}

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
        height={800}
        customStyles={{
          wrapper: { backgroundColor: "rgba(0,0,0,0.5)" },
          container: {
            borderTopLeftRadius: 20,
            borderTopRightRadius: 20,
            padding: 15,
            position: "relative",
          },
          draggableIcon: { backgroundColor: "#ccc" },
        }}
      >
        <SafeAreaView style={{ flex: 1 }}>
          {/* Close Button */}
          <TouchableOpacity style={styles.closeButton} onPress={() => sheetRef.current.close()}>
            <Icon name="close" size={26} color="#ffffffff" />
          </TouchableOpacity>

          <ScrollView
            contentContainerStyle={{
              paddingBottom: 140 + insets.bottom, // ensures room for the button and safe area
            }}
            showsVerticalScrollIndicator={false}
          >
            <Text style={styles.modalTitle}>Review & Add Species</Text>
            {scanData.map((fish, index) => (
              <FishCard key={index} fish={fish} index={index} handleRemove={handleRemove} updateField={updateField} getConfidenceColor={getConfidenceColor} />
            ))}
          </ScrollView>

          {scanData.length > 0 && (
            <TouchableOpacity
              style={[
                styles.button,
                {
                  position: "absolute",
                  bottom: insets.bottom + 15, // lifts it above the safe area
                  left: 0,
                  right: 0,
                  borderRadius: 10,
                },
              ]}
              onPress={handleSubmit}
            >
              <Text style={styles.buttonText}>Confirm & Save</Text>
            </TouchableOpacity>
          )}
        </SafeAreaView>
      </RBSheet>
    </View>
  );
};

export default TankScanScreenTabs;

const styles = StyleSheet.create({
  captureToggleContainer: {
    position: "absolute",
    top: 50,
    alignSelf: "center",
    flexDirection: "row",
    backgroundColor: "rgba(0,0,0,0.4)",
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 30,
    zIndex: 20,
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
    backgroundColor: "rgba(0,0,0,0.65)",
    borderRadius: 14,
    paddingVertical: 4,
    paddingHorizontal: 8,
  },

  confidenceText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 12,
  },

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

  previewContainer: {
    flex: 1,
    backgroundColor: "#000",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 16,
  },
  previewTitle: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "600",
    marginBottom: 12,
  },
  previewVideo: {
    width: "100%",
    height: 400,
    borderRadius: 12,
  },
  previewButtonsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    marginTop: 30,
    paddingHorizontal: 10,
  },
  previewButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    marginHorizontal: 6,
  },
  previewButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  overlayInfo: {
    position: "absolute",
    left: 10,
    bottom: 10,
    backgroundColor: "rgba(0,0,0,0.5)",
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 6,
    maxWidth: "65%",
  },
  overlayText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 14,
  },
  overlaySubText: {
    color: "#ddd",
    fontSize: 12,
    marginTop: 2,
    fontStyle: "italic",
  },
  overlayQty: {
    color: "#fff",
    fontSize: 12,
    marginTop: 4,
  },
  imageActions: {
    position: "absolute",
    bottom: 10,
    right: 10,
    flexDirection: "row",
    gap: 8,
  },
  iconButtonSmall: {
    backgroundColor: "rgba(0,0,0,0.65)",
    padding: 6,
    borderRadius: 6,
  },
  editSection: {
    marginTop: 10,
    backgroundColor: "#fff",
    padding: 10,
    borderRadius: 8,
    elevation: 2,
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
  galleryButton: {
    position: "absolute",
    top: 120,
    left: 20,
    backgroundColor: "rgba(44, 212, 200, 0.5)",
    borderColor: "#a580e9",
    borderWidth: 1,
    padding: 10,
    borderRadius: 25,
    zIndex: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 4,
  },
});
