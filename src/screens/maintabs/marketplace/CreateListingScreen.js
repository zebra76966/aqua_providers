// screens/CreateListingScreen.js
import React, { useState, useEffect } from "react";
import { View, Text, TextInput, StyleSheet, TouchableOpacity, ActivityIndicator, Alert, ScrollView, Image } from "react-native";
import DropDownPicker from "react-native-dropdown-picker";
import * as ImagePicker from "expo-image-picker";
import { createListing } from "./api/marketplace";
import { AuthContext } from "../../../authcontext";
import { useContext } from "react";
import * as Location from "expo-location";
import { fetchMarketplaceCategories } from "./api/marketplace";

const CreateListingScreen = ({ navigation }) => {
  const { token } = useContext(AuthContext);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [basePrice, setBasePrice] = useState("");
  const [category, setCategory] = useState("fish");
  const [location, setLocation] = useState("");
  const [thumbnail, setThumbnail] = useState(null);
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState([]);

  const [subcategory, setSubcategory] = useState(null);
  const [categoryOpen, setCategoryOpen] = useState(false);
  const [subcategoryOpen, setSubcategoryOpen] = useState(false);

  const [categoryItems, setCategoryItems] = useState([]);
  const [subcategoryItems, setSubcategoryItems] = useState([]);

  const [listingAddress, setListingAddress] = useState("");
  const [lat, setLat] = useState(null);
  const [lon, setLon] = useState(null);

  const [loadingCategories, setLoadingCategories] = useState(true);

  const loadCategories = async () => {
    try {
      const data = await fetchMarketplaceCategories(token);
      setCategories(data);

      setCategoryItems(
        data.map((cat) => ({
          label: cat.label,
          value: cat.key,
        }))
      );
    } catch (e) {
      Alert.alert("Error", "Failed to load categories");
    } finally {
      setLoadingCategories(false);
    }
  };

  useEffect(() => {
    if (!category) {
      setSubcategoryItems([]);
      setSubcategory(null);
      return;
    }

    const selected = categories.find((c) => c.key === category);
    if (selected) {
      setSubcategoryItems(
        selected.subcategories.map((sub) => ({
          label: sub.label,
          value: sub.key,
        }))
      );
      setSubcategory(null);
    }
  }, [category, categories]);

  const detectLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") return;

      const loc = await Location.getCurrentPositionAsync({});
      setLat(loc.coords.latitude);
      setLon(loc.coords.longitude);

      const address = await Location.reverseGeocodeAsync(loc.coords);
      if (address?.length) {
        const a = address[0];
        const label = [a.street || a.name, a.city || a.subregion, a.region].filter(Boolean).join(", ");

        setListingAddress(label);
      }
    } catch (e) {
      // silent fail, address still editable
    }
  };

  useEffect(() => {
    loadCategories();
    detectLocation();
  }, []);

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission required", "We need gallery permission to pick image.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
    });

    if (!result.canceled) {
      const asset = result.assets[0];
      setThumbnail({
        uri: asset.uri,
        mimeType: asset.mimeType || "image/jpeg",
        fileName: asset.fileName || "thumbnail.jpg",
      });
    }
  };

  const handleCreate = async () => {
    setLoading(true);
    try {
      await createListing(
        {
          title,
          description,
          base_price: basePrice,
          category,
          subcategory,
          listing_address: listingAddress,
          lat,
          lon,
          thumbnail,
        },
        token
      );

      Alert.alert("Success", "Listing created successfully");
      navigation.goBack();
    } catch (e) {
      Alert.alert("Error", e.message);
    } finally {
      setLoading(false);
    }
  };

  const isFormValid = title && description && basePrice && category && subcategory && listingAddress;

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 120 }} keyboardShouldPersistTaps="handled">
      <Text style={styles.header}>Create Listing</Text>

      <TextInput placeholder="Title" placeholderTextColor="#a580e9" style={styles.input} value={title} onChangeText={setTitle} />

      <TextInput placeholder="Description" placeholderTextColor="#a580e9" style={[styles.input, { height: 80 }]} value={description} onChangeText={setDescription} multiline />

      <TextInput placeholder="Base Price" placeholderTextColor="#a580e9" keyboardType="numeric" style={styles.input} value={basePrice} onChangeText={setBasePrice} />

      <Text style={styles.sectionLabel}>Category</Text>

      <DropDownPicker
        open={categoryOpen}
        value={category}
        items={categoryItems}
        setOpen={setCategoryOpen}
        setValue={setCategory}
        setItems={setCategoryItems}
        searchable
        placeholder="Select category"
        loading={loadingCategories}
        listMode="MODAL" // ✅ IMPORTANT
        modalTitle="Select Category"
        modalAnimationType="slide"
        style={styles.dropdown}
        dropDownContainerStyle={styles.dropdownContainer}
      />

      {category && (
        <>
          <Text style={styles.sectionLabel}>Subcategory</Text>
          <DropDownPicker
            open={subcategoryOpen}
            value={subcategory}
            items={subcategoryItems}
            setOpen={setSubcategoryOpen}
            setValue={setSubcategory}
            setItems={setSubcategoryItems}
            searchable
            placeholder="Select subcategory"
            listMode="MODAL" // ✅ IMPORTANT
            modalTitle="Select Subcategory"
            modalAnimationType="slide"
            style={styles.dropdown}
            dropDownContainerStyle={styles.dropdownContainer}
          />
        </>
      )}

      <TextInput placeholder="Listing address" style={styles.input} value={listingAddress} placeholderTextColor="#999" onChangeText={setListingAddress} />

      <TouchableOpacity style={styles.imagePicker} onPress={pickImage}>
        <Text style={styles.imagePickerText}>{thumbnail ? "Change Thumbnail" : "Pick Thumbnail"}</Text>
      </TouchableOpacity>

      {thumbnail && <Image source={{ uri: thumbnail.uri }} style={{ width: "100%", height: 180, borderRadius: 12, marginTop: 10 }} resizeMode="cover" />}

      <TouchableOpacity style={[styles.button, !isFormValid && { opacity: 0.5 }]} disabled={!isFormValid || loading} onPress={handleCreate}>
        {loading ? <ActivityIndicator color="#004d40" /> : <Text style={styles.buttonText}>Create Listing</Text>}
      </TouchableOpacity>
    </ScrollView>
  );
};

export default CreateListingScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ffffff",
    paddingHorizontal: 16,
    paddingTop: 20,
  },
  header: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#a580e9",
    marginBottom: 16,
  },
  input: {
    borderWidth: 1,
    borderColor: "#a580e9",
    borderRadius: 10,
    padding: 10,
    marginBottom: 10,
    color: "#000",
  },
  imagePicker: {
    borderWidth: 1,
    borderColor: "#a580e9",
    borderRadius: 10,
    padding: 12,
    alignItems: "center",
    marginTop: 4,
  },
  imagePickerText: {
    color: "#a580e9",
    fontWeight: "bold",
  },
  button: {
    backgroundColor: "#a580e9",
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 16,
  },
  buttonText: {
    color: "#004d40",
    fontWeight: "bold",
    fontSize: 16,
  },
  sectionLabel: {
    fontWeight: "600",
    marginBottom: 6,
    color: "#333",
  },

  selectorWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 10,
  },

  selectorChip: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#a580e9",
    marginRight: 8,
    marginBottom: 8,
  },

  selectorChipActive: {
    backgroundColor: "#a580e9",
  },

  selectorText: {
    color: "#a580e9",
    fontSize: 13,
  },

  selectorTextActive: {
    color: "#004d40",
    fontWeight: "bold",
  },
  dropdown: {
    borderColor: "#a580e9",
    borderRadius: 10,
    marginBottom: 12,
  },

  dropdownContainer: {
    borderColor: "#a580e9",
  },
});
