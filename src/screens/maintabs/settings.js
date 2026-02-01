import React, { useState, useContext, useEffect } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Image, TextInput, Alert, ActivityIndicator, ScrollView, Modal, Switch, Platform } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as ImagePicker from "expo-image-picker";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { AuthContext } from "../../authcontext";
import { useNavigation } from "@react-navigation/native";
import { baseUrl } from "../../config";
import { Ionicons } from "@expo/vector-icons";
import { Animated, Easing } from "react-native";

const STORAGE_KEY = "saved_addresses_v2";
const EMAIL_VISIBILITY_KEY = "email_visibility_v1";

export default function SettingsScreen() {
  const { logout, token, role } = useContext(AuthContext);
  const navigation = useNavigation();

  // Consultants Info

  const [consultant, setConsultant] = useState(null);
  const [consultantLoading, setConsultantLoading] = useState(true);

  const fetchConsultant = async () => {
    try {
      setConsultantLoading(true);

      const [dashRes, profileRes] = await Promise.all([
        fetch(`${baseUrl}/consultants/dashboard/`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${baseUrl}/consultants/profile/`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      const dashJson = await dashRes.json();
      const profileJson = await profileRes.json();

      setConsultant({
        ...dashJson?.data?.consultant_info,
        ...profileJson?.data,
      });
    } catch (e) {
      console.log("Consultant fetch error", e);
    } finally {
      setConsultantLoading(false);
    }
  };

  /* ---------------- Badges ---------------- */
  const [userBadge, setUserBadge] = useState(null);
  const [badgeDefs, setBadgeDefs] = useState([]);
  const [badgeLoading, setBadgeLoading] = useState(true);
  const [showBadgeModal, setShowBadgeModal] = useState(false);

  const activeEntity = Array.isArray(userBadge) ? userBadge[0] : userBadge;

  const pulse = React.useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1,
          duration: 1200,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 0,
          duration: 1200,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    ).start();
  }, []);

  const fetchBadges = async () => {
    try {
      setBadgeLoading(true);

      const [entityRes, defsRes] = await Promise.all([
        fetch(`${baseUrl}/badges/entity/`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${baseUrl}/badges/definitions/`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      const entityJson = await entityRes.json();
      const defsJson = await defsRes.json();

      console.log("entityJson", entityJson);
      console.log("defsJson", defsJson);

      const entity = entityJson?.data || entityJson;
      const defs = defsJson?.data || defsJson;

      setUserBadge(entity); // e.g. { code: "FOUNDING_MEMBER", level: "gold" }
      setBadgeDefs(defs || []);
    } catch (e) {
      console.log("Badge fetch error:", e);
    } finally {
      setBadgeLoading(false);
    }
  };

  /* ---------------- Profile ---------------- */
  const [profileImage, setProfileImage] = useState(null);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [showEmailToOthers, setShowEmailToOthers] = useState(false);

  /* ---------------- Address ---------------- */
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [country, setCountry] = useState("");
  const [postalCode, setPostalCode] = useState("");

  const [saveAddressToggle, setSaveAddressToggle] = useState(false);

  /* ---------------- Saved Addresses ---------------- */
  const [savedAddresses, setSavedAddresses] = useState([]);
  const [showListModal, setShowListModal] = useState(false);

  const [loading, setLoading] = useState(false);

  const [profileLoading, setProfileLoading] = useState(true);
  const fetchUserProfile = async () => {
    try {
      setProfileLoading(true);

      const res = await fetch(`${baseUrl}/user/profile/`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!res.ok) return;

      const json = await res.json();
      const data = json?.data || json;

      /* ---- NAME ---- */
      const fullName = data.name || "";
      const nameParts = fullName.trim().split(" ");

      setFirstName(nameParts[0] || "");
      setLastName(nameParts.slice(1).join(" ") || "");

      /* ---- ADDRESS ---- */
      setAddress(data.address || "");
      /* ---- EMAIL ---- */
      setEmail(data.email || "");

      setCity(data.city || "");
      setState(data.state || "");
      setCountry(data.country || "");
      setPostalCode(data.postal_code || "");

      /* ---- PROFILE IMAGE ---- */
      if (data.profile_picture) {
        setProfileImage({ uri: data.profile_picture });
      }
    } catch (e) {
      console.log("Profile fetch error:", e);
    } finally {
      setProfileLoading(false);
    }
  };

  useEffect(() => {
    fetchUserProfile();
    fetchBadges();
    fetchConsultant();
  }, []);

  useEffect(() => {
    loadEmailVisibility();
  }, []);

  const resolvedBadge = React.useMemo(() => {
    if (!userBadge || !badgeDefs.length) return null;

    const entity = Array.isArray(userBadge) ? userBadge[0] : userBadge;
    return badgeDefs.find((b) => b.badge_type === entity?.badge_type);
  }, [userBadge, badgeDefs]);

  const loadEmailVisibility = async () => {
    const stored = await AsyncStorage.getItem(EMAIL_VISIBILITY_KEY);
    if (stored !== null) {
      setShowEmailToOthers(stored === "true");
    }
  };

  const handleEmailVisibilityToggle = async (value) => {
    setShowEmailToOthers(value);
    await AsyncStorage.setItem(EMAIL_VISIBILITY_KEY, value.toString());
  };

  /* ---------------- Load Saved ---------------- */
  useEffect(() => {
    loadSavedAddresses();
  }, []);

  const loadSavedAddresses = async () => {
    const data = await AsyncStorage.getItem(STORAGE_KEY);
    if (!data) return;

    const parsed = JSON.parse(data);
    setSavedAddresses(parsed);

    const def = parsed.find((a) => a.isDefault);
    if (def) applyAddress(def);
  };

  const persistAddresses = async (list) => {
    setSavedAddresses(list);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  };

  const currentAddress = {
    address,
    city,
    state,
    country,
    postalCode,
  };

  const isNewAddress = () => !savedAddresses.some((a) => a.address === address && a.city === city && a.state === state && a.country === country && a.postalCode === postalCode);

  /* ---------------- Image Picker ---------------- */
  const handleImagePick = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") return;

    const res = await ImagePicker.launchImageLibraryAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.9,
    });

    if (!res.canceled) setProfileImage(res.assets[0]);
  };

  /* ---------------- Address Actions ---------------- */
  const saveAddress = async (makeDefault = false) => {
    const updated = [...savedAddresses.map((a) => ({ ...a, isDefault: false })), { ...currentAddress, isDefault: makeDefault }];
    await persistAddresses(updated);
  };

  const applyAddress = (item) => {
    setAddress(item.address);
    setCity(item.city);
    setState(item.state);
    setCountry(item.country);
    setPostalCode(item.postalCode);
    setShowListModal(false);
  };

  const deleteAddress = async (index) => {
    const updated = savedAddresses.filter((_, i) => i !== index);
    await persistAddresses(updated);
  };

  const setDefaultAddress = async (index) => {
    const updated = savedAddresses.map((a, i) => ({
      ...a,
      isDefault: i === index,
    }));
    await persistAddresses(updated);
    applyAddress(updated[index]);
  };

  /* ---------------- API UPDATE ---------------- */
  const handleUpdate = async () => {
    setLoading(true);

    try {
      if (saveAddressToggle && address && isNewAddress()) {
        await saveAddress(true);
      }

      const token = await AsyncStorage.getItem("token");

      const formData = new FormData();
      formData.append("first_name", firstName ?? "");
      formData.append("last_name", lastName ?? "");
      formData.append("address", address ?? "");
      formData.append("city", city ?? "");
      formData.append("state", state ?? "");
      formData.append("country", country ?? "");
      formData.append("postal_code", postalCode ?? "");

      if (profileImage?.uri) {
        formData.append("profile_picture", {
          uri: Platform.OS === "android" ? profileImage.uri : profileImage.uri.replace("file://", ""),
          name: profileImage.fileName || "profile.jpeg",
          type: profileImage.type || "image/jpeg",
        });
      }

      const response = await fetch(`${baseUrl}/user/profile/update/`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const responseText = await response.text();

      console.log("PROFILE UPDATE STATUS:", response.status);
      console.log("PROFILE UPDATE RESPONSE:", responseText);

      if (!response.ok) {
        throw new Error(responseText || "Profile update failed");
      }

      Alert.alert("Success", "Profile updated");
    } catch (error) {
      console.error("Profile update error:", error);
      Alert.alert("Error", error?.message || "Something went wrong while updating profile");
    } finally {
      setLoading(false);
    }
  };

  /* ---------------- Logout ---------------- */
  const handleLogout = () => {
    Alert.alert("Logout", "Are you sure?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Logout",
        style: "destructive",
        onPress: async () => {
          await logout();
          navigation.reset({ index: 0, routes: [{ name: "Login" }] });
        },
      },
    ]);
  };

  /* ---------------- UI ---------------- */

  return (
    <>
      {profileLoading ? (
        <View style={{ marginTop: 40 }}>
          <ActivityIndicator size="large" color="#a580e9" />
        </View>
      ) : (
        <>
          <ScrollView contentContainerStyle={styles.container}>
            {consultantLoading ? (
              <ActivityIndicator style={{ marginTop: 10 }} />
            ) : consultant ? (
              <View style={styles.businessCard}>
                <View style={styles.businessHeader}>
                  <View>
                    <Text style={styles.businessName}>{consultant.company_name}</Text>
                    <Text style={styles.businessMeta}>
                      ⭐ {consultant.rating || 0} • {consultant.reviews_count || 0} reviews
                    </Text>
                  </View>

                  {/* <Switch
                    value={consultant.is_active}
                    onValueChange={(v) => {
                      // later hook to API
                      setConsultant((c) => ({ ...c, is_active: v }));
                    }}
                  /> */}
                </View>

                <Text style={styles.businessSub}>
                  {consultant.total_services || 0} services • {consultant.auto_accept ? "Auto-accept on" : "Manual approval"}
                </Text>

                <View style={styles.businessActions}>
                  {role == "consultant" && (
                    <TouchableOpacity onPress={() => navigation.navigate("Services")}>
                      <Text style={styles.businessLink}>Manage Services</Text>
                    </TouchableOpacity>
                  )}

                  <TouchableOpacity onPress={() => navigation.navigate("BusinessProfile")}>
                    <Text style={styles.businessLink}>Edit Business</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <TouchableOpacity style={styles.createBusiness} onPress={() => navigation.navigate("CreateBusiness")}>
                <Ionicons name="business-outline" size={20} color="#a580e9" />
                <Text style={styles.createText}>Create your business profile</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity style={styles.upgradeBtn} activeOpacity={0.9} onPress={() => navigation.navigate("Plans")}>
              <Ionicons name="sparkles" size={14} color="#000" />
              <Text style={styles.upgradeText}>Premium</Text>
            </TouchableOpacity>

            <View style={{ ...styles.profileHeader, marginTop: 20 }}>
              <TouchableOpacity onPress={handleImagePick}>
                <Image source={profileImage ? { uri: profileImage.uri } : require("../../assets/user.jpg")} style={styles.profileImage} />
              </TouchableOpacity>

              {badgeLoading ? (
                <ActivityIndicator style={{ marginLeft: 12 }} size="small" />
              ) : resolvedBadge ? (
                <TouchableOpacity onPress={() => setShowBadgeModal(true)} activeOpacity={0.9}>
                  <Animated.View
                    style={[
                      styles.badgeCardInline,
                      {
                        borderColor: resolvedBadge.color,
                        shadowColor: resolvedBadge.color,
                        transform: [
                          {
                            scale: pulse.interpolate({
                              inputRange: [0, 1],
                              outputRange: [1, 1.05],
                            }),
                          },
                        ],
                      },
                    ]}
                  >
                    <Text style={styles.badgeEmoji}>{resolvedBadge.icon}</Text>
                    <View>
                      <Text style={styles.badgeTitle}>{resolvedBadge.name}</Text>
                      <Text style={styles.badgeTier}>Tier {resolvedBadge.tier}</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={16} color="#999" />
                  </Animated.View>
                </TouchableOpacity>
              ) : null}
            </View>

            <View style={styles.inputContainer}>
              <TextInput style={styles.input} placeholderTextColor="#a580e9" placeholder="First name" value={firstName} onChangeText={setFirstName} />
              <TextInput style={styles.input} placeholderTextColor="#a580e9" placeholder="Last name" value={lastName} onChangeText={setLastName} />

              {/* EMAIL (VIEW ONLY) */}
              <View style={styles.emailRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.emailLabel}>Email</Text>
                  <TextInput style={[styles.input, styles.disabledInput]} placeholderTextColor="#8A8A8A" value={email} editable={false} />
                </View>

                <View style={styles.emailToggle}>
                  <Text style={styles.toggleSmall}>Show to others</Text>
                  <Switch value={showEmailToOthers} onValueChange={handleEmailVisibilityToggle} />
                </View>
              </View>

              {savedAddresses.length > 0 && (
                <TouchableOpacity style={styles.savedBtn} onPress={() => setShowListModal(true)}>
                  <Ionicons name="location-outline" size={18} />
                  <Text style={styles.savedBtnText}>Saved Addresses</Text>
                </TouchableOpacity>
              )}

              {/* SAVE TOGGLE */}
              <View style={styles.toggleRow}>
                <Text style={styles.toggleLabel}>Save this address</Text>
                <Switch value={saveAddressToggle} onValueChange={setSaveAddressToggle} />
              </View>

              <TextInput style={styles.input} placeholderTextColor="#a580e9" placeholder="Address" value={address} onChangeText={setAddress} />
              <TextInput style={styles.input} placeholderTextColor="#a580e9" placeholder="City" value={city} onChangeText={setCity} />
              <TextInput style={styles.input} placeholderTextColor="#a580e9" placeholder="State" value={state} onChangeText={setState} />
              <TextInput style={styles.input} placeholderTextColor="#a580e9" placeholder="Country" value={country} onChangeText={setCountry} />
              <TextInput style={styles.input} placeholderTextColor="#a580e9" placeholder="Postal Code" value={postalCode} onChangeText={setPostalCode} />
            </View>

            <TouchableOpacity style={styles.button} onPress={handleUpdate}>
              {loading ? <ActivityIndicator /> : <Text style={styles.buttonText}>Update Profile</Text>}
            </TouchableOpacity>

            <TouchableOpacity style={[styles.button, styles.logoutBtn]} onPress={handleLogout}>
              <Ionicons name="log-out-outline" size={18} color="#fff" />
              <Text style={styles.logoutText}>Logout</Text>
            </TouchableOpacity>
          </ScrollView>

          <Modal transparent visible={showListModal}>
            <View style={styles.modalOverlay}>
              <View style={styles.listModal}>
                {savedAddresses.map((item, i) => (
                  <TouchableOpacity key={i} style={styles.addressCard} onPress={() => applyAddress(item)}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.addressText}>{item.address}</Text>
                      <Text style={styles.addressSub}>
                        {item.city}, {item.state} {item.postalCode}
                      </Text>
                      {item.isDefault && <Text style={styles.defaultBadge}>DEFAULT</Text>}
                    </View>

                    <View style={styles.cardActions}>
                      <TouchableOpacity onPress={() => setDefaultAddress(i)} style={{ marginBottom: 20, backgroundColor: "black", padding: 5, borderRadius: 10 }}>
                        <Ionicons name="star" size={20} color={item.isDefault ? "#a580e9" : "#ccc"} />
                      </TouchableOpacity>

                      <TouchableOpacity onPress={() => deleteAddress(i)}>
                        <Ionicons name="trash" size={22} color="#ff4d4d" />
                      </TouchableOpacity>
                    </View>
                  </TouchableOpacity>
                ))}

                <TouchableOpacity onPress={() => setShowListModal(false)}>
                  <Text style={styles.modalCancel}>Close</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>

          <Modal animationType="slide" transparent visible={showBadgeModal}>
            <View style={styles.sheetOverlay}>
              <View style={styles.sheet}>
                {/* Handle */}
                <View style={styles.sheetHandle} />

                {/* Header */}
                <View style={[styles.sheetHeader, { borderColor: resolvedBadge?.color }]}>
                  <Text style={styles.sheetEmoji}>{resolvedBadge?.icon}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.sheetTitle}>{resolvedBadge?.name}</Text>
                    <Text style={styles.sheetDesc}>{resolvedBadge?.description}</Text>
                  </View>
                </View>

                {/* Meta */}
                {activeEntity && (
                  <View style={styles.metaGrid}>
                    <View style={styles.metaItem}>
                      <Text style={styles.metaLabel}>Earned</Text>
                      <Text style={styles.metaValue}>{new Date(activeEntity.earned_at).toDateString()}</Text>
                    </View>

                    {activeEntity.expires_at && (
                      <View style={styles.metaItem}>
                        <Text style={styles.metaLabel}>Expires</Text>
                        <Text style={styles.metaValue}>{new Date(activeEntity.expires_at).toDateString()}</Text>
                      </View>
                    )}

                    <View style={styles.metaItem}>
                      <Text style={styles.metaLabel}>Validations</Text>
                      <Text style={styles.metaValue}>{activeEntity.validation_count}</Text>
                    </View>
                  </View>
                )}

                {/* Signals */}
                {resolvedBadge?.authority_signals?.length > 0 && (
                  <>
                    <Text style={styles.sectionTitle}>Authority Signals</Text>
                    <View style={styles.signalWrap}>
                      {resolvedBadge.authority_signals.map((s, i) => (
                        <View key={i} style={[styles.signalChip, { borderColor: resolvedBadge.color }]}>
                          <Text style={styles.signalText}>{s}</Text>
                        </View>
                      ))}
                    </View>
                  </>
                )}

                <TouchableOpacity onPress={() => setShowBadgeModal(false)}>
                  <Text style={styles.sheetClose}>Close</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>
        </>
      )}
    </>
  );
}

/* ---------------- Styles ---------------- */
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#F8F8F8" },
  container: { padding: 20, paddingBottom: 130 },
  profileImage: { width: 120, height: 120, borderRadius: 60, alignSelf: "center" },

  inputContainer: { marginTop: 20 },
  input: { backgroundColor: "#fff", color: "#a580e9", padding: 12, borderRadius: 10, marginBottom: 10 },

  toggleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  toggleLabel: { fontWeight: "600" },

  button: { backgroundColor: "#a580e9", padding: 14, borderRadius: 10 },
  buttonText: { textAlign: "center", fontWeight: "bold" },

  savedBtn: { backgroundColor: "#a580e9", color: "#fff", width: "160", padding: 10, borderRadius: 50, flexDirection: "row", alignItems: "center", marginBottom: 1, marginTop: 10 },
  savedBtnText: { marginLeft: 6 },

  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.4)", justifyContent: "center" },
  listModal: { backgroundColor: "#fff", margin: 20, borderRadius: 14, padding: 16 },

  addressCard: {
    flexDirection: "row",
    padding: 14,
    borderRadius: 12,
    backgroundColor: "#F8F8F8",
    marginBottom: 10,
  },
  addressText: { fontWeight: "bold" },
  addressSub: { color: "#666", fontSize: 12 },
  defaultBadge: { marginTop: 4, fontSize: 11, fontWeight: "bold", color: "#a580e9" },

  cardActions: { justifyContent: "space-between", marginLeft: 10, alignItems: "center" },

  modalCancel: { textAlign: "center", marginTop: 10, color: "#777" },

  logoutBtn: {
    backgroundColor: "#ff4d4d",
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
    marginTop: 10,
  },
  logoutText: { color: "#fff", fontWeight: "bold" },
  emailRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 10,
    marginBottom: 10,
  },

  emailLabel: {
    fontWeight: "600",
    marginBottom: 4,
  },

  emailToggle: {
    alignItems: "center",
    justifyContent: "center",
    paddingBottom: 6,
  },

  toggleSmall: {
    fontSize: 11,
    marginBottom: 4,
    color: "#555",
    textAlign: "center",
  },

  disabledInput: {
    backgroundColor: "#eee",
    color: "#777",
  },
  badgeWrap: {
    alignItems: "center",
    marginTop: 10,
    paddingVertical: 8,
    paddingHorizontal: 14,
    backgroundColor: "#fff",
    borderRadius: 14,
    alignSelf: "center",
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },

  badgeIcon: {
    width: 40,
    height: 40,
    marginBottom: 4,
  },

  badgeTitle: {
    fontWeight: "700",
    color: "#333",
    fontSize: 14,
  },

  badgeDesc: {
    fontSize: 11,
    color: "#666",
    marginTop: 2,
    textAlign: "center",
  },

  badgeEmoji: {
    fontSize: 32,
  },

  badgeTier: {
    fontSize: 11,
    color: "#666",
  },

  sheetOverlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.4)",
  },

  sheet: {
    backgroundColor: "#fff",
    padding: 20,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },

  sheetBadge: {
    alignItems: "center",
    padding: 16,
    borderRadius: 16,
    borderWidth: 2,
    marginBottom: 14,
  },

  sheetEmoji: { fontSize: 48 },
  sheetTitle: { fontSize: 18, fontWeight: "800", marginTop: 6 },
  sheetDesc: { fontSize: 13, color: "#666", textAlign: "center", marginTop: 4 },

  sheetMeta: { marginVertical: 10 },
  meta: { fontSize: 12, color: "#444", marginBottom: 4 },

  signalWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 14,
  },

  signalChip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    borderWidth: 1,
  },

  signalText: { fontSize: 11 },

  sheetClose: {
    textAlign: "center",
    marginTop: 10,
    color: "#777",
    fontWeight: "600",
  },
  profileHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },

  badgeCardInline: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "#fff",
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 16,
    borderWidth: 1.5,
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
  },
  sheetHandle: {
    width: 40,
    height: 4,
    borderRadius: 4,
    backgroundColor: "#ddd",
    alignSelf: "center",
    marginBottom: 12,
  },

  sheetHeader: {
    flexDirection: "row",
    gap: 14,
    padding: 14,
    borderRadius: 16,
    borderWidth: 2,
    marginBottom: 16,
    alignItems: "center",
  },

  metaGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
  },

  metaItem: {
    backgroundColor: "#F6F6F6",
    padding: 10,
    borderRadius: 12,
    flex: 1,
    marginHorizontal: 4,
  },

  metaLabel: {
    fontSize: 11,
    color: "#777",
  },

  metaValue: {
    fontSize: 12,
    fontWeight: "700",
    marginTop: 2,
  },

  sectionTitle: {
    fontWeight: "700",
    marginBottom: 8,
    color: "#333",
  },
  upgradeBtn: {
    // position: "absolute",
    // top: 10,
    // right: 16,
    // zIndex: 10,
    flexDirection: "row",
    width: 100,
    alignItems: "center",
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    backgroundColor: "#FFD700",
    shadowColor: "#FFD700",
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
  },

  upgradeText: {
    fontSize: 12,
    fontWeight: "800",
    color: "#000",
    letterSpacing: 0.3,
  },

  businessCard: {
    backgroundColor: "#faf7ff",
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#e7dbff",
  },
  businessHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  businessName: {
    fontSize: 18,
    fontWeight: "800",
    color: "#333",
  },
  businessMeta: {
    fontSize: 12,
    color: "#777",
    marginTop: 2,
  },
  businessSub: {
    marginTop: 6,
    fontSize: 12,
    color: "#666",
  },
  businessActions: {
    flexDirection: "row",
    marginTop: 12,
    gap: 16,
  },
  businessLink: {
    color: "#a580e9",
    fontWeight: "600",
  },
  createBusiness: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#a580e9",
    marginBottom: 20,
  },
  createText: {
    color: "#a580e9",
    fontWeight: "600",
  },
});
