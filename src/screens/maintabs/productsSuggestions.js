import React, { useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, Linking, StyleSheet, Image } from "react-native";

const ProductSuggestions = ({ products, onViewProduct }) => {
  const [topCategory, setTopCategory] = useState("ALL");
  const [subCategory, setSubCategory] = useState("ALL");
  const categoryMap = products.reduce((acc, p) => {
    if (!acc[p.top_level_category]) {
      acc[p.top_level_category] = new Set();
    }
    acc[p.top_level_category].add(p.category);
    return acc;
  }, {});

  const topCategories = ["ALL", ...Object.keys(categoryMap)];
  const subCategories = topCategory === "ALL" ? ["ALL"] : ["ALL", ...Array.from(categoryMap[topCategory])];
  const filteredProducts = products.filter((p) => {
    if (topCategory !== "ALL" && p.top_level_category !== topCategory) return false;
    if (subCategory !== "ALL" && p.category !== subCategory) return false;
    return true;
  });

  return (
    <View style={{ marginTop: 20 }}>
      <Text style={styles.psTitle}>Recommended Products</Text>

      <View style={styles.productFilterRow}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {topCategories.map((cat) => (
            <TouchableOpacity
              key={cat}
              onPress={() => {
                setTopCategory(cat);
                setSubCategory("ALL");
              }}
              style={[styles.filterPill, topCategory === cat && styles.filterPillActive]}
            >
              <Text style={[styles.filterText, topCategory === cat && styles.filterTextActive]}>{cat}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {topCategory !== "ALL" && (
        <View style={styles.productFilterRow}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {subCategories.map((sub) => (
              <TouchableOpacity key={sub} onPress={() => setSubCategory(sub)} style={[styles.filterPillSmall, subCategory === sub && styles.filterPillActive]}>
                <Text style={[styles.filterTextSmall, subCategory === sub && styles.filterTextActive]}>{sub}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 10 }}>
        {filteredProducts.map((item, index) => (
          <TouchableOpacity key={index} style={styles.psCard} onPress={() => onViewProduct(item.affiliate_url)}>
            <View style={styles.psTag}>
              <Text style={styles.psTagText}>{item.category}</Text>
            </View>

            {/* Image Placeholder */}
            <View style={styles.psImageBox}>{item.image_url ? <Image source={{ uri: item.image_url }} style={styles.psImage} /> : <Text style={styles.psNoImage}>No Image</Text>}</View>

            <Text style={styles.psName}>{item.product_name}</Text>
            <Text style={styles.psDesc}>{item.description}</Text>

            <Text style={styles.psBtn}>View Product →</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  psTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#00A6A6",
    marginBottom: 4,
    marginLeft: 4,
  },

  psCard: {
    width: 220,
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 14,
    marginRight: 16,
    marginBottom: 10,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },

  psTag: {
    backgroundColor: "#a580e9",
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 12,
    alignSelf: "flex-start",
    marginBottom: 10,
  },

  psTagText: {
    fontSize: 12,
    fontWeight: "bold",
    color: "white",
  },

  psImageBox: {
    width: "100%",
    height: 80,
    backgroundColor: "#F0FFFF",
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },

  psImage: {
    width: "100%",
    height: "100%",
    borderRadius: 10,
    resizeMode: "cover",
  },

  psNoImage: {
    fontSize: 12,
    color: "#999",
  },

  psName: {
    fontWeight: "bold",
    fontSize: 14,
    marginBottom: 6,
    color: "#000",
  },

  psDesc: {
    fontSize: 12,
    color: "#555",
    marginBottom: 12,
  },

  psBtn: {
    marginTop: "auto",
    fontWeight: "bold",
    fontSize: 13,
    color: "#a580e9",
  },
  productFilterRow: {
    marginBottom: 10,
  },

  filterPill: {
    paddingVertical: 6,
    paddingHorizontal: 14,
    backgroundColor: "#EAF9F9",
    borderRadius: 20,
    marginRight: 8,
  },

  filterPillSmall: {
    paddingVertical: 4,
    paddingHorizontal: 12,
    backgroundColor: "#F1F1F1",
    borderRadius: 16,
    marginRight: 8,
  },

  filterPillActive: {
    backgroundColor: "#a580e9",
  },

  filterText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#007777",
  },

  filterTextSmall: {
    fontSize: 11,
    fontWeight: "600",
    color: "#555",
  },

  filterTextActive: {
    color: "#fff",
  },
});

export default ProductSuggestions;
