import React, { useEffect, useState, useContext, useRef } from "react";
import { View, Text, StyleSheet, ActivityIndicator, FlatList, Image, ScrollView, TouchableOpacity, Modal, TextInput, Alert, Animated } from "react-native";
import { Feather, MaterialCommunityIcons, AntDesign } from "@expo/vector-icons";
import { useRoute, useNavigation, useIsFocused } from "@react-navigation/native";
import { AuthContext } from "../../authcontext";
import { baseUrl } from "../../config";
import FontAwesome6 from "@expo/vector-icons/FontAwesome6";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";

const TankDetailsScreen = () => {
  const route = useRoute();
  const { token, permissions } = useContext(AuthContext);

  const { tankId } = route.params;
  const navigation = useNavigation();

  const [tank, setTank] = useState(null);
  const [species, setSpecies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [equipments, setEquipments] = useState([]);
  const [equipmentLoading, setEquipmentLoading] = useState(false);
  const fetchEquipments = async () => {
    try {
      setEquipmentLoading(true);

      const res = await fetch(`${baseUrl}/tanks/${tankId}/equipments/`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const json = await res.json();
      setEquipments(json.data || []);
    } catch (err) {
      console.error("Failed to fetch equipments", err);
      Alert.alert("Error", "Failed to load equipments");
    } finally {
      setEquipmentLoading(false);
    }
  };

  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [compatibilityModalVisible, setCompatibilityModalVisible] = useState(false);
  const [selectedSpecies, setSelectedSpecies] = useState(null);
  const [compatibilityIssues, setCompatibilityIssues] = useState([]);

  const [className, setClassName] = useState("");
  const [quantity, setQuantity] = useState("");
  const [notes, setNotes] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [isExpanded, setIsExpanded] = useState(false);
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [toggleList, setToggle] = useState("Species");

  const [slideAnim1] = useState(new Animated.Value(60));
  const [slideAnim2] = useState(new Animated.Value(60));

  const [compatibleModalVisible, setCompatibleModalVisible] = useState(false);
  const [compatibleLoading, setCompatibleLoading] = useState(false);
  const [compatibleData, setCompatibleData] = useState([]);

  const fetchCompatibleSpecies = async () => {
    try {
      setCompatibleLoading(true);

      const res = await fetch(`${baseUrl}/breeders/search/from-tank/`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          tank_id: tank.id,
          radius: 50000,
          lat: 19.076,
          lon: 72.8777,
        }),
      });

      const json = await res.json();
      setCompatibleData(json.data || []);
    } catch (err) {
      Alert.alert("Error", "Failed to load compatible species");
    } finally {
      setCompatibleLoading(false);
    }
  };

  useEffect(() => {
    if (compatibleModalVisible) {
      fetchCompatibleSpecies();
    }
  }, [compatibleModalVisible]);

  const sparkleAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(sparkleAnim, {
          toValue: 1.15,
          duration: 900,
          useNativeDriver: true,
        }),
        Animated.timing(sparkleAnim, {
          toValue: 1,
          duration: 900,
          useNativeDriver: true,
        }),
      ]),
    ).start();
  }, []);

  useEffect(() => {
    if (isExpanded) {
      Animated.spring(slideAnim1, { toValue: -150, useNativeDriver: true }).start();
      Animated.spring(slideAnim2, { toValue: -70, useNativeDriver: true }).start();
    } else {
      Animated.timing(slideAnim1, { toValue: 60, duration: 200, useNativeDriver: true }).start();
      Animated.timing(slideAnim2, { toValue: 60, duration: 200, useNativeDriver: true }).start();
    }
  }, [isExpanded]);

  const isFocused = useIsFocused();

  useEffect(() => {
    if (isFocused) {
      fetchTankData();
    }
  }, [isFocused, tankId, token]);

  useEffect(() => {
    if (isFocused && toggleList == "Equipments") {
      fetchEquipments();
    }
  }, [isFocused, tankId, token]);

  const fetchTankData = async () => {
    try {
      setLoading(true);
      const tankRes = await fetch(`${baseUrl}/tanks/tank/${tankId}/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const tankJson = await tankRes.json();
      console.log("Fetched tank data:", tankJson);
      const speciesRes = await fetch(`${baseUrl}/tanks/${tankId}/species/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const speciesJson = await speciesRes.json();

      console.log("Fetched species data:", speciesJson.species[0]);

      // Fetch compatibility for each species
      const speciesWithCompatibility = await Promise.all(
        speciesJson.species.map(async (item) => {
          const compatibilityRes = await fetch(
            `${baseUrl}/monitoring/${tankId}/check-compatibility/`, // Use the provided API URL
            {
              method: "POST",
              headers: {
                Authorization: `Bearer ${token}`, // Use the token from AuthContext
                "Content-Type": "application/json",
              },
              body: JSON.stringify({ class_name: item.metadata.species_Nomenclature }),
            },
          );
          const compatibilityJson = await compatibilityRes.json();
          return { ...item, compatibility: compatibilityJson };
        }),
      );

      setTank(tankJson.data);
      setSpecies(speciesWithCompatibility);
    } catch (err) {
      console.error("Error fetching data:", err);
      Alert.alert("Error", "Failed to load tank data or check compatibility.");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSpecies = async () => {
    if (!selectedSpecies) return;
    setLoading(true);
    try {
      await fetch(`${baseUrl}/tanks/species/delete/${selectedSpecies.id}/`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      setSpecies(species.filter((s) => s.id !== selectedSpecies.id));
      setDeleteModalVisible(false);
      setLoading(false);
    } catch (err) {
      console.error(err);
      setLoading(false);
      Alert.alert("Error", "Failed to delete species");
    }
  };

  const showCompatibilityIssues = (item) => {
    setSelectedSpecies(item);
    setCompatibilityIssues(item.compatibility.issues);
    setCompatibilityModalVisible(true);
  };

  const getIssueIcon = (issueText) => {
    if (issueText.toLowerCase().includes("temperature")) {
      return <MaterialCommunityIcons name="thermometer-alert" size={20} color="#e63946" />;
    }
    if (issueText.toLowerCase().includes("ph")) {
      return <MaterialCommunityIcons name="water-alert" size={20} color="#1d3557" />;
    }
    // Add more conditions for other types of issues if needed
    return <AntDesign name="exclamationcircleo" size={20} color="#ff8c00" />; // Default icon
  };
  const [fishModalVisible, setFishModalVisible] = useState(false);
  const [activeFish, setActiveFish] = useState(null);

  const can = (key) => permissions?.[key] === true;

  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color={styles.colors.primary} />
      </View>
    );
  }

  if (!tank) {
    return (
      <View style={styles.loader}>
        <Text style={styles.errorText}>Failed to load tank data</Text>
      </View>
    );
  }

  const renderEquipmentCard = ({ item }) => (
    <View style={styles.equipmentCard}>
      <Image source={{ uri: item.image_url }} style={styles.equipmentImage} />

      <View style={styles.equipmentContent}>
        <Text style={styles.equipmentName}>{item.equipment_name}</Text>
        <Text style={styles.equipmentType}>{item.equipment_type.toUpperCase()}</Text>

        <View style={styles.infoRow}>
          <MaterialCommunityIcons name="factory" size={16} color="#555" />
          <Text style={styles.equipmentDetail}>{item.brand}</Text>
        </View>

        <View style={styles.infoRow}>
          <MaterialCommunityIcons name="flash" size={16} color="#ffb703" />
          <Text style={styles.equipmentDetail}>{item.wattage}</Text>
        </View>

        <View style={styles.infoRow}>
          <MaterialCommunityIcons name="barcode-scan" size={16} color="#6a4c93" />
          <Text style={styles.equipmentDetail}>{item.model_number}</Text>
        </View>

        {item.notes ? <Text style={styles.equipmentNotes}>{item.notes}</Text> : null}
      </View>
    </View>
  );

  return (
    <View style={{ flex: 1, ...styles.container }}>
      <View style={{ ...styles.header }}>
        <View style={styles.tankCard}>
          <TouchableOpacity onPress={() => navigation.navigate("TanksHome")} style={{ ...styles.backBtn, backgroundColor: "#1f1f1f", borderRadius: 8 }}>
            <Ionicons name="arrow-back" size={24} color="#a580e9" />
          </TouchableOpacity>
          <View style={{ marginLeft: 12, flex: 1 }}>
            <Text style={styles.tankName}>{tank.name}</Text>
            <Text style={styles.tankDetail}>
              {tank.tank_type} • {tank.size} {tank.size_unit}
            </Text>
            <Text style={styles.tankNotes}>{tank.notes}</Text>
          </View>
        </View>
      </View>

      {/* Water Parameters Section */}
      {/* {tank.latest_water_parameters && (
        <View style={styles.waterParamsCard}>
          <Text style={styles.sectionTitle}>Water Parameters</Text>

          <View style={styles.paramRow}>
            <Feather name="droplet" size={18} color="#0077b6" />
            <Text style={styles.paramLabel}>pH:</Text>
            <Text style={styles.paramValue}>{tank.latest_water_parameters.estimated_ph}</Text>
          </View>

          <View style={styles.paramRow}>
            <Feather name="thermometer" size={18} color="#e63946" />
            <Text style={styles.paramLabel}>Temperature:</Text>
            <Text style={styles.paramValue}>{tank.latest_water_parameters.temperature}°C</Text>
          </View>

          <View style={styles.paramRow}>
            <MaterialCommunityIcons name="fish" size={18} color="#1d3557" />
            <Text style={styles.paramLabel}>Oxygen:</Text>
            <Text style={styles.paramValue}>{tank.latest_water_parameters.estimated_oxygen_mgL} mg/L</Text>
          </View>

          <View style={styles.paramRow}>
            <MaterialCommunityIcons name="chemical-weapon" size={18} color="#6a040f" />
            <Text style={styles.paramLabel}>Ammonia:</Text>
            <Text style={styles.paramValue}>{tank.latest_water_parameters.estimated_ammonia_ppm} ppm</Text>
          </View>

          <View style={styles.paramRow}>
            <MaterialCommunityIcons name="bottle-tonic-skull" size={18} color="#ff8c00" />
            <Text style={styles.paramLabel}>Nitrite:</Text>
            <Text style={styles.paramValue}>{tank.latest_water_parameters.estimated_nitrite_ppm} ppm</Text>
          </View>

          <View style={styles.paramRow}>
            <MaterialCommunityIcons name="bottle-tonic" size={18} color="#2a9d8f" />
            <Text style={styles.paramLabel}>Nitrate:</Text>
            <Text style={styles.paramValue}>{tank.latest_water_parameters.estimated_nitrate_ppm} ppm</Text>
          </View>
        </View>
      )} */}

      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
        <View style={{ flexDirection: "row", justifyContent: "end", alignItems: "center", gap: "2" }}>
          <Text style={styles.sectionTitle}> {toggleList}</Text>
          <TouchableOpacity
            style={{
              backgroundColor: "#161616ff",
              padding: 8,
              borderRadius: 10,
              marginLeft: 5,
              flexDirection: "row",
              alignItems: "center",
            }}
            onPress={() => {
              setToggle(toggleList == "Equipments" ? "Species" : "Equipments");
              fetchEquipments();
            }}
          >
            <AntDesign name="swap" size={22} color="#a580e9" />
          </TouchableOpacity>
        </View>

        <View style={{ flexDirection: "row", justifyContent: "end", alignItems: "center", gap: "2" }}>
          {toggleList == "Equipments" ? (
            <TouchableOpacity style={[styles.activateButton]} onPress={() => navigation.navigate("AddEquipment", { tankId: tank.id })}>
              <Text style={styles.activateText}>Add + </Text>
            </TouchableOpacity>
          ) : (
            <>
              <TouchableOpacity
                style={{
                  backgroundColor: "#ff8c00",
                  padding: 12,
                  borderRadius: 10,
                  marginRight: 5,
                  flexDirection: "row",
                  alignItems: "center",
                }}
                onPress={() =>
                  navigation.navigate("TankScanScreenTabs", {
                    tankDataLocal: tank,
                    tankId: tank.id,
                  })
                }
              >
                <MaterialCommunityIcons name="cube-scan" size={24} color="#fff" />
              </TouchableOpacity>
              <TouchableOpacity
                style={{
                  backgroundColor: "#ae68e7ff",
                  padding: 8,
                  borderRadius: 10,

                  flexDirection: "row",
                  alignItems: "center",
                }}
                onPress={() =>
                  navigation.navigate("TankScanScreenTabs", {
                    tankDataLocal: tank,
                    tankId: tank.id,
                  })
                }
              >
                <MaterialCommunityIcons name="bee-flower" size={32} color="#fff" />
              </TouchableOpacity>
              <Animated.View
                style={{
                  transform: [{ scale: sparkleAnim }],
                  marginLeft: 8,
                }}
              >
                <TouchableOpacity style={styles.sparkleFishBtn} onPress={() => setCompatibleModalVisible(true)}>
                  <MaterialCommunityIcons name="fish" size={26} color="#fff" />
                </TouchableOpacity>
              </Animated.View>
            </>
          )}
        </View>
      </View>

      {toggleList === "Equipments" ? (
        equipmentLoading ? (
          <ActivityIndicator size="large" color="#a580e9" />
        ) : equipments.length === 0 ? (
          <View style={{ alignItems: "center", marginTop: 50 }}>
            <MaterialCommunityIcons name="tools" size={48} color="#aaa" />
            <Text style={styles.pText}>No equipments added yet</Text>

            <TouchableOpacity style={[styles.activateButton, { marginTop: 20 }]} onPress={() => navigation.navigate("AddEquipment", { tankId: tank.id })}>
              <Text style={styles.activateText}>Add Equipment</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <FlatList data={equipments} keyExtractor={(item) => item.id.toString()} renderItem={renderEquipmentCard} contentContainerStyle={{ paddingBottom: 120 }} />
        )
      ) : species && species.length === 0 ? (
        <View style={{ justifyContent: "center", alignItems: "center", marginTop: 50 }}>
          <MaterialCommunityIcons name="jellyfish-outline" size={50} color="#858585ff" />
          <Text style={styles.pText}>No Species found :(</Text>
          <TouchableOpacity
            style={{
              ...styles.activateButton,
              flexDirection: "row",
              justifyContent: "space-between",
              paddingLeft: 20,
              marginTop: 50,
              borderRadius: 30,
              boxShadow: "0 10px 10px rgba(0,0,0,0.2)",
              backgroundColor: "#ff8c00",
            }}
            onPress={() => {
              navigation.navigate("TankScanScreenTabs", {
                tankDataLocal: tank,
                tankId: tank.id,
              });
            }}
          >
            <Text style={{ ...styles.activateText, color: "#000", marginRight: 20, fontSize: 18 }}>Add Species</Text>
            <MaterialCommunityIcons name="cube-scan" size={24} color="#000" />
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={species}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => (
            <View style={styles.speciesCard}>
              <TouchableOpacity
                style={{ flex: 1 }}
                activeOpacity={0.8}
                onPress={() => {
                  setActiveFish(item);
                  setFishModalVisible(true);
                }}
              >
                {/* ALL existing image + text content EXCEPT delete button */}
                <View style={{ flexDirection: "row" }}>
                  <Image source={{ uri: item?.last_scan_image_url || item?.metadata?.image_url }} style={styles.speciesImage} />

                  <View style={styles.speciesContent}>
                    <Text style={styles.speciesName}>{item.metadata.species_name}</Text>
                    <Text style={styles.speciesScientific}>{item.metadata.species_Nomenclature}</Text>

                    <View style={styles.infoRow}>
                      <MaterialCommunityIcons name="jellyfish-outline" size={16} color="#a580e9" />
                      <Text style={styles.speciesDetail}>{item.quantity} fish</Text>
                    </View>

                    <View style={styles.infoRow}>
                      <Feather name="maximize" size={16} color="#ff8c00" />
                      <Text style={styles.speciesDetail}>Max Size: {item.metadata.maximum_size}</Text>
                    </View>

                    <View style={styles.infoRow}>
                      <Feather name="thermometer" size={16} color="#e63946" />
                      <Text style={styles.speciesDetail}>Temp: {item.metadata.temperature}</Text>
                    </View>

                    <View style={styles.infoRow}>
                      <Feather name="droplet" size={16} color="#1d3557" />
                      <Text style={styles.speciesDetail}>
                        pH: {item.metadata.ideal_ph_min} - {item.metadata.ideal_ph_max}
                      </Text>
                    </View>
                    {tank.latest_water_parameters && (
                      <>
                        {!item?.compatibility?.is_compatible && (
                          <View style={styles.compatibilityContainer}>
                            <AntDesign name="warning" size={20} color="red" style={styles.warningIcon} />
                            <TouchableOpacity style={styles.issuesBtn} onPress={() => showCompatibilityIssues(item)}>
                              <Text style={styles.issuesBtnText}>Warnings</Text>
                            </TouchableOpacity>
                          </View>
                        )}
                      </>
                    )}
                  </View>
                </View>
              </TouchableOpacity>

              {/* Delete button stays OUTSIDE */}
              <TouchableOpacity
                style={styles.deleteBtn}
                onPress={() => {
                  setSelectedSpecies(item);
                  setDeleteModalVisible(true);
                }}
              >
                <Feather name="trash-2" size={20} color="#fff" />
              </TouchableOpacity>
            </View>
          )}
          contentContainerStyle={{ paddingBottom: 120 }}
        />
      )}

      {/* Floating Add Button */}
      {/* Floating Action Button Group */}
      {/* ONLY Add Species Button */}
      <TouchableOpacity
        style={[styles.addButton, { bottom: 85, right: 20, position: "absolute", backgroundColor: "#4CAF50" }]}
        onPress={() =>
          navigation.navigate("AddSpeciesScreen", {
            tankId: tank.id,
            type: tank.tank_type,
          })
        }
      >
        <MaterialCommunityIcons name="plus" size={26} color="#fff" />
      </TouchableOpacity>

      {can("historical_tracking") && (
        <TouchableOpacity
          style={[styles.addButton, { bottom: 220, backgroundColor: "#ee6affff" }]}
          onPress={() => {
            navigation.navigate("CompareSpeciesScreen", {
              tankDataLocal: tank,
              tankId: tank.id,
            });
          }}
        >
          <MaterialIcons name="compare" size={26} color="#fff" />
        </TouchableOpacity>
      )}

      {can("disease_detection") && (
        <TouchableOpacity
          style={[styles.addButton, { bottom: 155, backgroundColor: "#00b7ffff" }]}
          onPress={() => {
            navigation.navigate("DiseaseScanScreen", {
              tankDataLocal: tank,
              tankId: tank.id,
            });
          }}
        >
          <FontAwesome6 name="disease" size={26} color="#fff" />
        </TouchableOpacity>
      )}

      {!can("disease_detection") && (
        <View
          style={{
            position: "absolute",
            bottom: 155,
            right: 20,
            backgroundColor: "#000000aa",
            padding: 10,
            borderRadius: 20,
          }}
        >
          <Text style={{ color: "#fff", fontSize: 12 }}>{`Disease scan \navailable on Pro`}</Text>
        </View>
      )}

      {/* Delete Confirm Modal */}
      <Modal visible={deleteModalVisible} transparent animationType="fade" onRequestClose={() => setDeleteModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Delete {selectedSpecies?.metadata?.species_name}?</Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity style={[styles.modalBtn, { backgroundColor: "red" }]} onPress={handleDeleteSpecies}>
                {loading ? (
                  <ActivityIndicator size="small" color="#000" />
                ) : (
                  <>
                    <Text style={styles.modalBtnText}>Delete</Text>
                  </>
                )}
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalBtn, { backgroundColor: "#aaa" }]} onPress={() => setDeleteModalVisible(false)}>
                <Text style={styles.modalBtnText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Compatibility Issues Modal */}
      <Modal visible={compatibilityModalVisible} transparent animationType="fade" onRequestClose={() => setCompatibilityModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Warnings</Text>
            {compatibilityIssues.length > 0 ? (
              <ScrollView style={styles.issuesScrollView}>
                {compatibilityIssues.map((issue, index) => (
                  <View key={index} style={styles.issueItem}>
                    {getIssueIcon(issue)}
                    <Text style={styles.issueText}> {issue}</Text>
                  </View>
                ))}
              </ScrollView>
            ) : (
              <Text style={styles.issueText}>No issues found.</Text>
            )}
            <View style={styles.modalButtons}>
              <TouchableOpacity style={[styles.modalBtn, { backgroundColor: "#a580e9" }]} onPress={() => setCompatibilityModalVisible(false)}>
                <Text style={styles.modalBtnText}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={fishModalVisible} transparent animationType="slide" onRequestClose={() => setFishModalVisible(false)}>
        <View style={styles.detailsOverlay}>
          <View style={styles.detailsContainer}>
            <ScrollView>
              {/* Close button */}
              <TouchableOpacity style={styles.detailsCloseBtn} onPress={() => setFishModalVisible(false)}>
                <MaterialCommunityIcons name="close" size={28} color="#fff" />
              </TouchableOpacity>

              {/* Image */}
              <Image
                source={{
                  uri: activeFish?.last_scan_image_url || activeFish?.metadata?.image_url || "https://via.placeholder.com/400x300",
                }}
                style={styles.detailsImage}
              />

              {/* Title */}
              <Text style={styles.detailsTitle}>{activeFish?.metadata?.species_name}</Text>
              <Text style={styles.detailsSubtitle}>{activeFish?.metadata?.species_Nomenclature}</Text>

              {/* Info with icons */}
              <View style={styles.detailsInfoRow}>
                <Feather name="maximize" size={20} color="#ff8c00" />
                <Text style={styles.detailsInfoText}>Max Size: {activeFish?.metadata?.maximum_size}</Text>
              </View>

              <View style={styles.detailsInfoRow}>
                <Feather name="thermometer" size={20} color="#e63946" />
                <Text style={styles.detailsInfoText}>Temp: {activeFish?.metadata?.temperature}°C</Text>
              </View>

              <View style={styles.detailsInfoRow}>
                <Feather name="droplet" size={20} color="#00b4d8" />
                <Text style={styles.detailsInfoText}>
                  pH: {activeFish?.metadata?.ideal_ph_min} – {activeFish?.metadata?.ideal_ph_max}
                </Text>
              </View>

              <View style={styles.detailsInfoRow}>
                <MaterialCommunityIcons name="fish" size={22} color="#1d3557" />
                <Text style={styles.detailsInfoText}>Category: {activeFish?.species?.category}</Text>
              </View>

              <View style={styles.detailsInfoRow}>
                <MaterialCommunityIcons name="format-list-numbered" size={20} color="#6200ee" />
                <Text style={styles.detailsInfoText}>Quantity: {activeFish?.quantity}</Text>
              </View>

              {/* Notes */}
              {activeFish?.notes ? (
                <>
                  <Text style={styles.detailsSectionHeader}>Notes</Text>
                  <Text style={styles.detailsNotes}>{activeFish?.notes}</Text>
                </>
              ) : null}
              {/* Compatibility */}

              {tank.latest_water_parameters && (
                <>
                  {activeFish?.compatibility && !activeFish?.compatibility?.is_compatible && (
                    <>
                      <Text style={styles.detailsSectionHeader}>Compatibility Issues</Text>
                      {activeFish?.compatibility?.issues.map((issue, idx) => (
                        <Text key={idx} style={styles.detailsIssueText}>
                          • {issue}
                        </Text>
                      ))}
                    </>
                  )}
                </>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      <Modal visible={compatibleModalVisible} animationType="slide">
        <View style={{ flex: 1, backgroundColor: "#F2FAFB" }}>
          {/* Header */}
          <View style={styles.compatHeader}>
            <TouchableOpacity onPress={() => setCompatibleModalVisible(false)}>
              <Ionicons name="arrow-back" size={22} />
            </TouchableOpacity>

            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <MaterialCommunityIcons name="fishbowl-outline" size={22} color="#a580e9" style={{ marginRight: 8 }} />
              <Text style={styles.compatTitle}>Compatible Species</Text>
            </View>
          </View>

          {compatibleLoading ? (
            <ActivityIndicator size="large" style={{ marginTop: 40 }} />
          ) : (
            <ScrollView contentContainerStyle={{ padding: 16 }}>
              {compatibleData.map((breeder) => (
                <View key={breeder.id} style={styles.breederCard}>
                  {/* Breeder Top Row */}
                  <View style={styles.breederTop}>
                    <View style={styles.breederAvatar}>
                      <Ionicons name="person" size={18} color="#fff" />
                    </View>

                    <View style={{ flex: 1 }}>
                      <Text style={styles.breederName}>{breeder.name}</Text>
                      <View style={styles.inlineRow}>
                        <Ionicons name="business-outline" size={13} color="#666" />
                        <Text style={styles.breederCompany}>{breeder.company}</Text>
                      </View>
                    </View>

                    <View style={styles.ratingPill}>
                      <Ionicons name="star" size={12} color="#f5c518" />
                      <Text style={styles.ratingText}>{breeder.rating.toFixed(1)}</Text>
                    </View>
                  </View>

                  {/* Distance */}
                  <View style={styles.metaRow}>
                    <Ionicons name="navigate-outline" size={14} color="#a580e9" />
                    <Text style={styles.metaText}>
                      {breeder.distance_km.toFixed(1)} km away • {breeder.reviews} reviews
                    </Text>
                  </View>

                  {/* Species Section */}
                  <View style={styles.speciesSection}>
                    <View style={styles.sectionHeader}>
                      <MaterialCommunityIcons name="fish" size={16} color="#a580e9" />
                      <Text style={styles.sectionTitle}>Available Species</Text>
                    </View>

                    {breeder.compatible_species.map((s) => (
                      <View key={s.id} style={styles.speciesRow}>
                        <MaterialCommunityIcons name="fish-outline" size={18} color="#a580e9" />
                        <View style={{ marginLeft: 10 }}>
                          <Text style={styles.speciesName}>{s.species_name}</Text>
                          <Text style={styles.speciesSci}>{s.scientific_name}</Text>
                        </View>
                      </View>
                    ))}
                  </View>
                </View>
              ))}
            </ScrollView>
          )}
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  waterParamsCard: {
    backgroundColor: "#f0f8ff",
    padding: 14,
    borderRadius: 12,
    marginBottom: 20,
    marginTop: 10,
  },
  paramRow: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 4,
  },
  paramLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
    marginLeft: 6,
    width: 110,
  },
  paramValue: {
    fontSize: 14,
    color: "#000",
    fontWeight: "bold",
  },

  addButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#a580e9",
    position: "absolute",
    bottom: 40,
    right: 20,
    shadowColor: "#000",
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 5,
  },
  colors: {
    primary: "#a580e9",
    secondary: "#000",
    white: "#fff",
  },
  container: {
    flex: 1,
    backgroundColor: "#fff",
    padding: 16,
  },
  loader: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  errorText: {
    color: "red",
    fontSize: 16,
  },
  tankCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f8f9fa",
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
  },
  tankName: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#000",
  },
  tankDetail: {
    fontSize: 14,
    color: "#555",
    marginVertical: 2,
  },
  tankNotes: {
    fontSize: 13,
    fontStyle: "italic",
    color: "#333",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#000",
    marginBottom: 10,
  },
  speciesCard: {
    flexDirection: "row", // Keep image and content side-by-side
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 14,
    marginBottom: 14,
    alignItems: "flex-start", // Align items to the top to prevent stretching
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  speciesImage: {
    width: 70,
    height: 70,
    borderRadius: 12,
    backgroundColor: "#f0f0f0",
    marginRight: 12, // Add some space to the right of the image
  },
  speciesContent: {
    flex: 1, // Take up remaining space
    justifyContent: "space-between", // Push compatibility to the bottom
  },
  speciesName: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#000",
  },
  speciesScientific: {
    fontSize: 13,
    fontStyle: "italic",
    color: "#555",
    marginBottom: 6,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 3,
  },
  speciesDetail: {
    fontSize: 13,
    color: "#333",
    marginLeft: 6,
  },
  deleteBtn: {
    backgroundColor: "#e63946",
    padding: 8,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 8,
    alignSelf: "flex-start", // Align to top, next to content
  },
  pText: {
    fontWeight: "bold",
    fontSize: 18,
    color: "#3f3f3f",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalBox: {
    width: "85%",
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 12,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 12,
    color: "#000",
    textAlign: "center",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    padding: 8,
    borderRadius: 8,
    marginBottom: 12,
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 10,
  },
  modalBtn: {
    flex: 1,
    padding: 10,
    borderRadius: 8,
    marginHorizontal: 5,
    alignItems: "center",
  },
  modalBtnText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
  activateButton: {
    backgroundColor: "#a580e9",
    padding: 8,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 5,
  },
  activateText: { color: "#fff", fontWeight: "bold" },
  compatibilityContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 10, // Add space above issues section
    justifyContent: "flex-start",
  },
  warningIcon: {
    marginRight: 5,
  },
  issuesBtn: {
    backgroundColor: "#e63946",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
  },
  issuesBtnText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 12,
  },
  issuesScrollView: {
    maxHeight: 200, // Limit height of the scroll view
    marginBottom: 15,
  },
  issueItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  issueText: {
    fontSize: 14,
    color: "#333",
    marginLeft: 8,
    flexShrink: 1, // Allow text to wrap
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  backBtn: {
    padding: 6,
    marginRight: 10,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
  },
  detailsOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "flex-end",
  },

  detailsContainer: {
    backgroundColor: "#fff",
    width: "100%",
    height: "88%",
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    paddingBottom: 20,
    overflow: "hidden",
  },

  detailsCloseBtn: {
    position: "absolute",
    right: 15,
    top: 15,
    zIndex: 20,
    backgroundColor: "rgba(0,0,0,0.6)",
    padding: 6,
    borderRadius: 20,
  },

  detailsImage: {
    width: "100%",
    height: 230,
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
  },

  detailsTitle: {
    fontSize: 22,
    fontWeight: "bold",
    marginTop: 15,
    textAlign: "center",
    color: "#000",
  },

  detailsSubtitle: {
    fontSize: 15,
    fontStyle: "italic",
    textAlign: "center",
    color: "#444",
    marginBottom: 20,
  },

  detailsInfoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 6,
    paddingHorizontal: 20,
  },

  detailsInfoText: {
    fontSize: 16,
    marginLeft: 10,
    color: "#333",
  },

  detailsSectionHeader: {
    marginTop: 20,
    fontSize: 18,
    fontWeight: "bold",
    paddingHorizontal: 20,
    color: "#000",
  },

  detailsNotes: {
    fontSize: 15,
    marginTop: 6,
    paddingHorizontal: 20,
    color: "#444",
  },

  detailsIssueText: {
    fontSize: 15,
    color: "#d62828",
    paddingHorizontal: 20,
    marginTop: 4,
  },
  equipmentCard: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 14,
    marginBottom: 14,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },

  equipmentImage: {
    width: 70,
    height: 70,
    borderRadius: 12,
    backgroundColor: "#f0f0f0",
    marginRight: 12,
  },

  equipmentContent: {
    flex: 1,
  },

  equipmentName: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#000",
  },

  equipmentType: {
    fontSize: 12,
    color: "#a580e9",
    fontWeight: "600",
    marginBottom: 6,
  },

  equipmentDetail: {
    fontSize: 13,
    color: "#333",
    marginLeft: 6,
  },

  equipmentNotes: {
    marginTop: 6,
    fontSize: 13,
    fontStyle: "italic",
    color: "#555",
  },
  sparkleFishBtn: {
    backgroundColor: "#a580e9",
    padding: 10,
    borderRadius: 14,
    shadowColor: "#a580e9",
    shadowOpacity: 0.6,
    shadowRadius: 10,
    elevation: 6,
  },
  compatHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },

  compatTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#222",
  },

  breederCard: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 16,
    marginBottom: 18,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 3,
  },

  breederTop: {
    flexDirection: "row",
    alignItems: "center",
  },

  breederAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#a580e9",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },

  inlineRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 2,
  },

  breederName: {
    fontSize: 15,
    fontWeight: "700",
    color: "#222",
  },

  breederCompany: {
    fontSize: 12,
    color: "#666",
    marginLeft: 6,
  },

  ratingPill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF8E1",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },

  ratingText: {
    fontSize: 12,
    fontWeight: "600",
    marginLeft: 4,
  },

  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
  },

  metaText: {
    fontSize: 12,
    color: "#555",
    marginLeft: 6,
  },

  speciesSection: {
    marginTop: 14,
    backgroundColor: "#F6FAFB",
    borderRadius: 14,
    padding: 12,
  },

  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },

  sectionTitle: {
    fontSize: 13,
    fontWeight: "700",
    marginLeft: 6,
    color: "#333",
  },

  speciesRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
  },

  speciesName: {
    fontSize: 13,
    fontWeight: "600",
    color: "#222",
  },

  speciesSci: {
    fontSize: 11,
    fontStyle: "italic",
    color: "#666",
  },
});

export default TankDetailsScreen;
