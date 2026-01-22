import React, { useState, useContext } from "react";
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as ImagePicker from "expo-image-picker";

import { AuthContext } from "../../../authcontext";
import { updateMySellerProfile } from "./api/marketplace";

const UpdateSellerProfileScreen = ({ navigation }) => {
  const { token } = useContext(AuthContext);

  const [tags, setTags] = useState("");
  const [video, setVideo] = useState(null);
  const [loading, setLoading] = useState(false);

  const pickVideo = async () => {
    try {
      // Request permissions
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        alert("Permission required to access media library");
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Videos,
        allowsEditing: false,
        quality: 1,
      });

      if (!result.canceled) {
        const asset = result.assets[0];

        setVideo({
          uri: asset.uri,
          fileName: asset.fileName || "profile_video.mp4",
          type: "video/mp4",
        });
      }
    } catch (err) {
      console.log("Video picker error:", err);
    }
  };

  const handleUpdate = async () => {
    if (!tags && !video) {
      alert("Please enter tags or upload a video.");
      return;
    }

    setLoading(true);
    try {
      await updateMySellerProfile(
        {
          expertise_tags: tags,
          video,
        },
        token
      );

      alert("Profile updated successfully!");
      navigation.goBack();
    } catch (err) {
      alert(err.message || "Update failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.header}>Update Seller Profile</Text>

      {/* Expertise Tags */}
      <TextInput placeholder="Expertise Tags (comma separated)" placeholderTextColor="#999" style={styles.input} value={tags} onChangeText={setTags} />

      {/* Video Picker */}
      <TouchableOpacity onPress={pickVideo} style={styles.uploadBtn}>
        <Text style={styles.uploadText}>{video ? "✅ Video Selected" : "Upload Profile Video"}</Text>
      </TouchableOpacity>

      {/* Save */}
      <TouchableOpacity style={styles.saveBtn} onPress={handleUpdate}>
        {loading ? <ActivityIndicator color="#004d40" /> : <Text style={styles.saveText}>Save</Text>}
      </TouchableOpacity>
    </SafeAreaView>
  );
};

export default UpdateSellerProfileScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    paddingHorizontal: 16,
    paddingTop: 20,
  },
  header: {
    fontSize: 22,
    fontWeight: "700",
    color: "#a580e9",
    marginBottom: 20,
  },

  input: {
    borderWidth: 1,
    borderColor: "#a580e9",
    borderRadius: 10,
    padding: 10,
    marginBottom: 14,
  },

  uploadBtn: {
    backgroundColor: "#f8fffe",
    borderWidth: 1,
    borderColor: "#a580e9",
    padding: 14,
    borderRadius: 10,
    alignItems: "center",
    marginBottom: 20,
  },
  uploadText: { color: "#00796b", fontWeight: "600" },

  saveBtn: {
    backgroundColor: "#a580e9",
    padding: 14,
    borderRadius: 10,
    alignItems: "center",
  },
  saveText: { color: "#004d40", fontWeight: "700" },
});
