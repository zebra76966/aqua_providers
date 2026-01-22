import React, { useState } from "react";
import { View, Text, TextInput, FlatList, TouchableOpacity, StyleSheet, Image, Animated } from "react-native";
import { Feather } from "@expo/vector-icons";
const dummyProducts = [
  { id: "1", name: "Fish Food Pellets", price: "$5.99", category: "Food", image: require("../../assets/prod1.jpg") },
  { id: "2", name: "Aquarium Heater", price: "$25.99", category: "Equipment", image: require("../../assets/prod2.jpg") },
  { id: "3", name: "Water Filter", price: "$40.00", category: "Equipment", image: require("../../assets/prod3.jpg") },
  { id: "4", name: "Aquarium Plant Decor", price: "$9.50", category: "Decoration", image: require("../../assets/prod1.jpg") },
  { id: "5", name: "Premium Fish Food", price: "$12.00", category: "Food", image: require("../../assets/prod2.jpg") },
  { id: "6", name: "LED Tank Light", price: "$18.99", category: "Equipment", image: require("../../assets/prod3.jpg") },
];

export default function ProductsScreen() {
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");

  const categories = ["All", "Food", "Equipment", "Decoration"];

  const filteredProducts = dummyProducts.filter((p) => {
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = selectedCategory === "All" || p.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const renderProduct = ({ item }) => (
    <View style={styles.productCard}>
      <Image source={item.image} style={styles.productImage} />
      <Text style={styles.productName}>{item.name}</Text>
      <Text style={styles.productPrice}>{item.price}</Text>
      <View style={styles.productButtons}>
        <TouchableOpacity style={styles.cartButton}>
          <Text style={styles.buttonText}>ADD TO CART</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.buyButton}>
          <Text style={styles.buttonText}>BUY NOW</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Search Bar */}
      <TextInput style={styles.searchBar} placeholder="Search products..." placeholderTextColor="#777" value={search} onChangeText={setSearch} />

      {/* Filter Buttons */}
      <View style={styles.filterRow}>
        {categories.map((cat) => (
          <TouchableOpacity key={cat} style={[styles.filterButton, selectedCategory === cat && styles.activeFilter]} onPress={() => setSelectedCategory(cat)}>
            <Text style={[styles.filterText, selectedCategory === cat && styles.activeFilterText]}>{cat}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Product List */}
      {/* <FlatList
        data={filteredProducts}
        keyExtractor={(item) => item.id}
        renderItem={renderProduct}
        numColumns={2}
        columnWrapperStyle={{ justifyContent: "space-between" }}
        contentContainerStyle={{ paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
      /> */}

      <View style={styles.wipOverlay}>
        <Animated.View style={styles.wipContainer}>
          <Feather name="tool" size={50} color="#a580e9" style={{ marginBottom: 16 }} />
          <Text style={styles.wipTitle}>Feature Under Progress</Text>
          <Text style={styles.wipText}>We’re working on this feature. It’ll be available soon 🚀</Text>
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8F8F8",
    padding: 16,
  },
  searchBar: {
    backgroundColor: "#fff",
    padding: 12,
    borderRadius: 30,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#ddd",
    fontSize: 14,
    color: "#333",
  },
  filterRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  filterButton: {
    paddingVertical: 6,
    paddingHorizontal: 14,
    backgroundColor: "#eee",
    borderRadius: 20,
  },
  activeFilter: {
    backgroundColor: "#a580e9",
  },
  filterText: {
    fontWeight: "bold",
    fontSize: 12,
    color: "#333",
  },
  activeFilterText: {
    color: "#fff",
  },
  productCard: {
    backgroundColor: "white",
    width: "48%",
    marginBottom: 16,
    borderRadius: 12,
    padding: 10,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  productImage: {
    width: "100%",
    height: 100,
    borderRadius: 8,
    marginBottom: 8,
  },
  productName: { fontWeight: "bold", fontSize: 14, marginBottom: 4 },
  productPrice: { color: "#a580e9", marginBottom: 8, fontWeight: "bold" },
  productButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 6,
  },
  cartButton: {
    flex: 1,
    backgroundColor: "#111",
    paddingVertical: 6,
    borderRadius: 6,
    alignItems: "center",
  },
  buyButton: {
    flex: 1,
    backgroundColor: "#a580e9",
    paddingVertical: 6,
    borderRadius: 6,
    alignItems: "center",
  },
  buttonText: { color: "white", fontSize: 10, fontWeight: "bold" },
  wipOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    // backgroundColor: "rgba(0,0,0,0.5)",
  },
  wipContainer: {
    width: "80%",
    backgroundColor: "white",
    borderRadius: 20,
    padding: 24,
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 6,
  },
  wipTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#a580e9",
    marginBottom: 8,
  },
  wipText: {
    color: "#555",
    textAlign: "center",
    marginBottom: 20,
  },
  wipCloseBtn: {
    backgroundColor: "#a580e9",
    paddingVertical: 10,
    paddingHorizontal: 30,
    borderRadius: 25,
  },
});
