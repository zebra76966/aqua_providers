import React from "react";
import { View, TouchableOpacity } from "react-native";
import { AntDesign } from "@expo/vector-icons";

const RatingStars = ({ rating, setRating, size = 22, interactive = true }) => {
  const handlePress = (value) => {
    if (!interactive) return;
    setRating(value);
  };

  return (
    <View style={{ flexDirection: "row" }}>
      {[1, 2, 3, 4, 5].map((star) => (
        <TouchableOpacity key={star} onPress={() => handlePress(star)} disabled={!interactive}>
          <AntDesign name={star <= rating ? "star" : "staro"} size={size} color="#f4b400" style={{ marginRight: 4 }} />
        </TouchableOpacity>
      ))}
    </View>
  );
};

export default RatingStars;
