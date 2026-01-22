import React, { useState, useEffect, useContext, useCallback } from "react";
import { View, Text, StyleSheet, FlatList, Image, TouchableOpacity, TextInput, ActivityIndicator, Modal } from "react-native";
import { Feather } from "@expo/vector-icons";
import AntDesign from "@expo/vector-icons/AntDesign";
import { baseUrl } from "../../config";
import { AuthContext } from "../../authcontext";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import FontAwesome6 from "@expo/vector-icons/FontAwesome6";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import FontAwesome from "@expo/vector-icons/FontAwesome";

export default function TanksScreen() {
  const [searchText, setSearchText] = useState("");
  const { token, logout, activeTankId, activateTank, permissions } = useContext(AuthContext);

  const [tanksData, setTanksData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [noTanks, setNoTanks] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedTank, setSelectedTank] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const navigation = useNavigation();

  const localImages = [require("../../assets/tank1.jpg"), require("../../assets/tank2.jpg"), require("../../assets/tank3.jpg"), require("../../assets/tank4.jpg"), require("../../assets/tank5.jpg")];

  useFocusEffect(
    useCallback(() => {
      let isActive = true;

      const fetchTanks = async () => {
        if (!token) return;
        try {
          setLoading(true);
          const response = await fetch(`${baseUrl}/tanks/get-tanks/`, {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          });

          const result = await response.json();
          if (!isActive) return;

          if (response.ok && result.data.tanks) {
            const mappedData = result.data.tanks.map((tank, index) => ({
              id: tank.id,
              name: tank.name,
              dateAdded: tank.created_at?.split("T")[0] ?? "",
              fishType: tank.notes,
              waterType: tank.tank_type === "FRESH" ? "Freshwater" : "Saltwater",
              size: `${tank.size} ${tank.size_unit}`,
              image: localImages[index % localImages.length],
              waterParams: tank?.latest_water_parameters || [],
            }));
            setTanksData(mappedData);
          } else {
            if (result.status_code == 401) {
              logout();
              navigation.reset({ index: 0, routes: [{ name: "Login" }] });
            }
            setTanksData([]);
            setNoTanks(true);
          }
        } catch (error) {
          if (error.status == 401) {
            logout();
            navigation.reset({ index: 0, routes: [{ name: "Login" }] });
          }
          setTanksData([]);
          setNoTanks(true);
        } finally {
          if (isActive) setLoading(false);
        }
      };

      fetchTanks();
      return () => {
        isActive = false;
      };
    }, [token, baseUrl]),
  );

  const handleDeleteTank = async () => {
    if (!selectedTank) return;
    try {
      setDeleting(true);
      const response = await fetch(`${baseUrl}/tanks/tank/delete/${selectedTank.id}/`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        setTanksData((prev) => prev.filter((t) => t.id !== selectedTank.id));
      } else if (response.status === 401) {
        logout();
        navigation.reset({ index: 0, routes: [{ name: "Login" }] });
      } else {
        console.error("Failed to delete tank:", response);
      }
    } catch (error) {
      console.error("Error deleting tank:", error);
    } finally {
      setDeleting(false);
      setShowDeleteModal(false);
      setSelectedTank(null);
    }
  };

  const filteredTanks = tanksData.filter((tank) => tank.name.toLowerCase().includes(searchText.toLowerCase()));
  const canAddMoreTanks = typeof permissions?.max_habitats === "number" ? tanksData.length < permissions.max_habitats : true;

  const renderTankCard = ({ item }) => (
    <View style={styles.card}>
      <Image source={item.image} style={styles.image} />
      <View style={styles.cardContent}>
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
          <Text style={{ ...styles.tankName, flex: 1 }}>{item.name}</Text>

          <TouchableOpacity
            style={{ ...styles.activateButton, flex: 0.1, justifyContent: "center", backgroundColor: "#1f1f1fff" }}
            onPress={() =>
              navigation.navigate("TankDetail", {
                tankId: item.id,
                tankData: item,
              })
            }
          >
            <FontAwesome name="eye" size={20} color="#a580e9" />
          </TouchableOpacity>
        </View>

        <Text style={styles.dateAdded}>Added: {item.dateAdded}</Text>
        <Text style={styles.size}>Size: {item.size}</Text>
        <Text style={styles.fishType}>Fish/Notes: {item.fishType}</Text>
        <Text style={[styles.waterType, { color: item.waterType === "Saltwater" ? "#1E90FF" : "#32CD32" }]}>Water: {item.waterType}</Text>

        <View style={{ flexDirection: "row", gap: 10 }}>
          <TouchableOpacity
            style={{
              ...styles.activateButton,
              flex: 1,
              flexDirection: "row",
              justifyContent: "space-around",
              backgroundColor: "#1f1f1fff",
            }}
            onPress={() =>
              navigation.navigate("UpdateTank", {
                tankId: item.id,
                tankData: item,
              })
            }
          >
            <Text style={{ ...styles.activateText, color: "#a580e9" }}>Update</Text>
            <AntDesign name="setting" size={24} color="#a580e9" />
          </TouchableOpacity>

          <TouchableOpacity
            style={{
              ...styles.activateButton,
              flex: 1,
              alignItems: "center",
              backgroundColor: item.id === activeTankId ? "#32CD32" : "#a580e9",
            }}
            onPress={async () => {
              if (item.id === activeTankId) {
                navigation.navigate("Maintenance");
              } else {
                await activateTank(item.id);
              }
            }}
          >
            <Text style={styles.activateText}>{item.id === activeTankId ? "CHECK STATS" : "ACTIVATE"}</Text>
          </TouchableOpacity>
        </View>

        {/* 🗑️ Delete Button */}
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => {
            setSelectedTank(item);
            setShowDeleteModal(true);
          }}
        >
          <Feather name="trash-2" size={20} color="#fff" />
          <Text style={styles.deleteText}>Delete</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: "center", alignItems: "center" }]}>
        <ActivityIndicator size="large" color="#a580e9" />
      </View>
    );
  }

  if (noTanks || (tanksData && tanksData.length == 0)) {
    return (
      <View style={[styles.container, { justifyContent: "center", alignItems: "center" }]}>
        <MaterialCommunityIcons name="fishbowl-outline" size={150} color="#858585ff" />
        <Text style={styles.pText}>No tanks to Show :(</Text>
        {canAddMoreTanks ? (
          <TouchableOpacity
            style={{
              ...styles.activateButton,
              flexDirection: "row",
              justifyContent: "space-between",
              paddingLeft: 20,
              marginTop: 50,
              borderRadius: 30,
            }}
            onPress={() => navigation.navigate("AddTank")}
          >
            <Text
              style={{
                ...styles.activateText,
                color: "#000",
                marginRight: 20,
                fontSize: 20,
              }}
            >
              Add Habitat
            </Text>
            <AntDesign name="pluscircle" size={30} color="#000" />
          </TouchableOpacity>
        ) : (
          <View style={{ marginTop: 40, alignItems: "center" }}>
            <Text style={{ fontSize: 16, fontWeight: "bold", color: "#444" }}>Habitat limit reached</Text>
            <Text style={{ marginTop: 6, color: "#777", textAlign: "center" }}>Upgrade your plan to add more habitats.</Text>
          </View>
        )}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {canAddMoreTanks && (
        <TouchableOpacity style={styles.addButton} onPress={() => navigation.navigate("AddTank")}>
          <FontAwesome6 name="add" size={24} color="black" />
        </TouchableOpacity>
      )}

      {!canAddMoreTanks && (
        <View
          style={{
            position: "absolute",
            bottom: 100,
            right: 20,
            backgroundColor: "#FFE082",
            paddingHorizontal: 8,
            paddingVertical: 4,
            borderRadius: 6,
          }}
        >
          <Text style={{ fontSize: 11, fontWeight: "600" }}>Can't add more tanks, Limit Reached</Text>
        </View>
      )}

      <View style={styles.searchBar}>
        <Feather name="search" size={20} color="#999" />
        <TextInput placeholder="Search tanks..." placeholderTextColor="#999" value={searchText} onChangeText={setSearchText} style={styles.searchInput} />
      </View>

      <FlatList data={filteredTanks} keyExtractor={(item) => item.id.toString()} renderItem={renderTankCard} contentContainerStyle={{ paddingBottom: 200 }} />

      {/* 🧾 Delete Confirmation Modal */}
      <Modal visible={showDeleteModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Delete Tank</Text>
            <Text style={styles.modalText}>
              Are you sure you want to delete <Text style={{ fontWeight: "bold" }}>{selectedTank?.name}</Text>?
            </Text>

            <View style={styles.modalButtons}>
              <TouchableOpacity style={[styles.modalBtn, { backgroundColor: "#ccc" }]} onPress={() => setShowDeleteModal(false)} disabled={deleting}>
                <Text style={styles.modalBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalBtn, { backgroundColor: "#E74C3C" }]} onPress={handleDeleteTank} disabled={deleting}>
                <Text style={styles.modalBtnText}>{deleting ? "Deleting..." : "Delete"}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  addButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#a580e9",
    position: "absolute",
    bottom: 100,
    right: 20,
    zIndex: 9,
  },
  container: { flex: 1, backgroundColor: "#F8F8F8", padding: 16 },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 30,
    paddingHorizontal: 15,
    paddingVertical: 8,
    marginBottom: 15,
  },
  searchInput: { marginLeft: 10, flex: 1, fontSize: 16, color: "#000" },
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    flexDirection: "row",
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 6,
  },
  image: { width: 100, height: 100, borderRadius: 10, marginRight: 12 },
  cardContent: { flex: 1 },
  tankName: { fontWeight: "bold", fontSize: 16, marginBottom: 10 },
  dateAdded: { color: "#666", fontSize: 12, marginBottom: 4 },
  size: { color: "#666", fontSize: 12, marginBottom: 5 },
  fishType: { fontSize: 14 },
  waterType: { fontSize: 14, marginBottom: 8 },
  activateButton: {
    backgroundColor: "#a580e9",
    padding: 8,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 5,
  },
  activateText: { color: "#fff", fontWeight: "bold" },
  deleteButton: {
    backgroundColor: "#E74C3C",
    marginTop: 10,
    padding: 8,
    borderRadius: 8,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 6,
  },
  deleteText: { color: "#fff", fontWeight: "600" },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    width: "80%",
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 20,
  },
  modalTitle: { fontSize: 18, fontWeight: "bold", marginBottom: 10 },
  modalText: { fontSize: 15, color: "#444", marginBottom: 20 },
  modalButtons: { flexDirection: "row", justifyContent: "flex-end", gap: 10 },
  modalBtn: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: 8 },
  modalBtnText: { color: "#fff", fontWeight: "600" },
  pText: { fontWeight: "bold", fontSize: 18, color: "#3f3f3fff" },
});
