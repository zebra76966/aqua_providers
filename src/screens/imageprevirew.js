import React from "react";
import { View, Image, StyleSheet } from "react-native";

export default function ImagePreview({ route }) {
  const { uri } = route.params;

  return (
    <View style={styles.container}>
      <Image source={{ uri }} style={styles.image} resizeMode="contain" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000" },
  image: { flex: 1, width: "100%", height: "100%" },
});
