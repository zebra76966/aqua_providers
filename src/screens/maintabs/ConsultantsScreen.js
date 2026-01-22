import React, { useState, useEffect, useContext } from "react";
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, ScrollView, Modal, TextInput, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { AuthContext } from "../../authcontext";
import { baseUrl } from "../../config";
import * as Location from "expo-location";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Animated, LayoutAnimation, Platform, UIManager } from "react-native";
import { Linking } from "react-native";
import { WebView } from "react-native-webview";
import * as Calendar from "expo-calendar";
import { DeviceEventEmitter } from "react-native";
import PaymentSuccessModal from "./utils/PaymentSuccessModal";
import BookingSuccessModal from "./utils/BookingSuccessModal";

/* ---------------------------------- */

export default function ConsultantsScreen() {
  const { token, permissions } = useContext(AuthContext);
  const canBookConsultant = permissions?.consultant_booking === true;
  const [checkingAvailability, setCheckingAvailability] = useState(false);
  const [availability, setAvailability] = useState(null);
  const [bookingStatus, setBookingStatus] = useState(null);

  const [bookingResult, setBookingResult] = useState(null);
  const [showPayment, setShowPayment] = useState(false);

  const [showSuccess, setShowSuccess] = useState(false);
  const [showBookingSuccess, setShowBookingSuccess] = useState(false);

  const [myBookings, setMyBookings] = useState([]);
  const [bookingsSummary, setBookingsSummary] = useState(null);
  const [loadingBookings, setLoadingBookings] = useState(false);

  const [selectedBookingId, setSelectedBookingId] = useState(null);
  const [bookingDetails, setBookingDetails] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [showBookingDetails, setShowBookingDetails] = useState(false);

  const [showConsultantDetails, setShowConsultantDetails] = useState(false);

  const fetchBookingDetails = async (bookingId) => {
    setLoadingDetails(true);
    try {
      const res = await fetch(`${baseUrl}/consultants/bookings/${bookingId}/`, { headers: { Authorization: `Bearer ${token}` } });

      const json = await res.json();
      setBookingDetails(json.data);
      setShowBookingDetails(true);
    } catch (e) {
      Alert.alert("Error", "Failed to load booking details");
    } finally {
      setLoadingDetails(false);
    }
  };

  const fetchMyBookings = async () => {
    setLoadingBookings(true);
    try {
      const res = await fetch(`${baseUrl}/consultants/bookings/`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const json = await res.json();
      setMyBookings(json.data || []);
      setBookingsSummary(json.summary || null);
    } catch (e) {
      console.log("Bookings fetch failed", e);
    } finally {
      setLoadingBookings(false);
    }
  };

  useEffect(() => {
    fetchMyBookings();
  }, []);

  const handlePaymentSuccess = () => {
    setShowPayment(false); // close WebView
    setShowRequestModal(false); // ✅ CLOSE request modal
    setAvailability(null); // clear slots
    setSelectedSlot(null); // reset slot
    showBookingDetails(false);
    setShowBookingsSheet(false);

    fetchMyBookings();

    setShowSuccess(true); // success modal
    fetchMyBookings();
  };

  const cancelBooking = async (bookingId) => {
    try {
      const res = await fetch(`${baseUrl}/consultants/bookings/${bookingId}/cancel/`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });

      const json = await res.json();
      Alert.alert("Canceled", json.message);
      fetchMyBookings();
    } catch {
      Alert.alert("Error", "Could not cancel booking");
    }
  };

  useEffect(() => {
    const sub = DeviceEventEmitter.addListener("PAYMENT_SUCCESS", () => {
      handlePaymentSuccess();
    });

    return () => sub.remove();
  }, []);

  const addToCalendar = async () => {
    const { status } = await Calendar.requestCalendarPermissionsAsync();
    if (status !== "granted") return;

    const calendars = await Calendar.getCalendarsAsync();
    const calendarId = calendars[0].id;

    await Calendar.createEventAsync(calendarId, {
      title: "Consultation Booking",
      startDate: new Date(bookingResult.scheduled_start),
      endDate: new Date(bookingResult.scheduled_end),
      timeZone: "UTC",
    });
  };

  const formatTime = (iso) => {
    const d = new Date(iso);
    return d.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const slotToId = (slot) => `${slot.start}_${slot.end}`;

  const checkAvailability = async () => {
    console.log("availability", "test");
    if (!selectedConsultant || !preferredDate || !selectedServices.length) {
      Alert.alert("Missing info", "Please select services and a date");
      return;
    }

    setCheckingAvailability(true);

    try {
      const res = await fetch(`${baseUrl}/consultants/${selectedConsultant.id}/availability/`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          services: selectedServices,
          date: preferredDate,
        }),
      });

      const json = await res.json();
      console.log("availability", json);
      setAvailability(json?.data || []);

      if (!json?.data) {
        Alert.alert("Not available", "Consultant is not available on this date");
      }
    } catch (e) {
      Alert.alert("Error", "Could not check availability");
    } finally {
      setCheckingAvailability(false);
    }
  };
  const bookConsultant = async () => {
    if (!selectedSlot) {
      Alert.alert("Select a time", "Please choose a time slot");
      return;
    }

    setSubmittingRequest(true);

    try {
      const res = await fetch(`${baseUrl}/consultants/book/`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          consultant: selectedConsultant.id,
          services: selectedServices,
          scheduled_start: selectedSlot.start,
          scheduled_end: selectedSlot.end,
          message,
          use_payment_link: true,
          success_url: "aqua://payment-success",
        }),
      });

      const json = await res.json();
      console.log("date selected-", `${preferredDate}T${selectedSlot}:00`);
      console.log("Booking response", json);
      setBookingResult(json?.data);

      // If payment link exists → open inside app
      if (json?.data?.payment_url) {
        setShowPayment(true);
      } else {
        // Alert.alert("Booked", "Your booking is confirmed");
        fetchMyBookings();
        setShowBookingSuccess(true);
        resetBookingFlow();
      }
    } catch (e) {
      Alert.alert("Error", "Booking failed");
    } finally {
      setSubmittingRequest(false);
    }
  };

  const resetBookingFlow = () => {
    setShowRequestModal(false);
    setMessage("");
    setPreferredDate("");
    setSelectedServices([]);
    setAvailability(null);
    setBookingResult(null);
  };

  const [selectedSlot, setSelectedSlot] = useState(null);

  useEffect(() => {
    if (!bookingResult?.booking_id) return;

    const interval = setInterval(() => {
      // 🔧 Replace with real API later
      setBookingStatus((prev) => (prev === "confirmed" ? prev : "confirmed"));
    }, 4000);

    return () => clearInterval(interval);
  }, [bookingResult]);

  useEffect(() => {
    if (Platform.OS === "android") {
      UIManager.setLayoutAnimationEnabledExperimental(true);
    }
  }, []);

  const [showBookingsSheet, setShowBookingsSheet] = useState(false);

  const [services, setServices] = useState({});
  const [selectedServices, setSelectedServices] = useState([]);

  const [radius, setRadius] = useState(10000);
  const [locationName, setLocationName] = useState("");

  const [consultants, setConsultants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);

  const [selectedConsultant, setSelectedConsultant] = useState(null);
  const [showRequestModal, setShowRequestModal] = useState(false);

  const [message, setMessage] = useState("");
  const [preferredDate, setPreferredDate] = useState("");
  const [latitude, setLatitude] = useState(null);
  const [longitude, setLongitude] = useState(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [submittingRequest, setSubmittingRequest] = useState(false);

  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permission denied", "Location is required to search consultants nearby");
        return;
      }

      const location = await Location.getCurrentPositionAsync({});
      const { latitude, longitude } = location.coords;

      setLatitude(latitude);
      setLongitude(longitude);

      // Reverse geocode to get city/area name
      const geo = await Location.reverseGeocodeAsync({
        latitude,
        longitude,
      });

      if (geo && geo.length > 0) {
        const place = geo[0];
        setLocationName(place.city || place.subregion || place.region || "Your location");
      }
    })();
  }, []);

  /* ---------- Fetch Services ---------- */
  const fetchServices = async () => {
    try {
      const res = await fetch(`${baseUrl}/consultants/services/`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const json = await res.json();

      // ✅ FIX: keep category structure
      setServices(json?.data || {});
    } catch (e) {
      console.log("Service fetch error", e);
    }
  };

  /* ---------- Search Consultants ---------- */
  const searchConsultants = async () => {
    if (latitude === null || longitude === null) {
      Alert.alert("Location not available", "Please allow location access");
      return;
    }

    setSearching(true);
    setHasSearched(true);

    const payload = {
      services: selectedServices, // <-- UUIDs now
      radius,
      lat: 78,
      lon: 20,
    };

    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setHasSearched(true);

    try {
      const res = await fetch(`${baseUrl}/consultants/search/`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const json = await res.json();

      const list = Array.isArray(json?.data) ? json.data : [];

      setConsultants(list);
    } catch (e) {
      console.log("Search error", e);
    } finally {
      setSearching(false);
    }
  };

  useEffect(() => {
    fetchServices().finally(() => setLoading(false));
  }, []);

  /* ---------- Toggle Service ---------- */
  const toggleService = (serviceId) => {
    setSelectedServices((prev) => (prev.includes(serviceId) ? prev.filter((id) => id !== serviceId) : [...prev, serviceId]));
  };

  const onDateChange = (event, selectedDate) => {
    if (Platform.OS === "android") {
      setShowDatePicker(false);
    }

    if (!selectedDate) return;

    const yyyy = selectedDate.getFullYear();
    const mm = String(selectedDate.getMonth() + 1).padStart(2, "0");
    const dd = String(selectedDate.getDate()).padStart(2, "0");

    setPreferredDate(`${yyyy}-${mm}-${dd}`);
  };
  useEffect(() => {
    if (!preferredDate || !selectedConsultant || selectedServices.length === 0) return;

    // reset previous slot selection
    setSelectedSlot(null);
    setAvailability(null);

    checkAvailability();
  }, [preferredDate]);

  const groupSlotsByHour = (slots = []) => {
    return slots.reduce((acc, slot) => {
      const hour = new Date(slot.start).getHours();
      if (!acc[hour]) acc[hour] = [];
      acc[hour].push(slot);
      return acc;
    }, {});
  };

  /* ---------- Create Request ---------- */
  const createRequest = async () => {
    if (!selectedServices.length) {
      Alert.alert("Select services", "Please select at least one service");
      return;
    }

    if (!selectedServices.length || !message || !preferredDate) {
      Alert.alert("Missing info", "Please select services, date, and add a message");
      return;
    }

    setSubmittingRequest(true);

    try {
      await fetch(`${baseUrl}/consultants/requests/create/`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          consultant: selectedConsultant.id,
          services: selectedServices,
          message,
          preferred_date: preferredDate,
        }),
      });

      Alert.alert("Success", "Request sent successfully");
      setShowRequestModal(false);
      setMessage("");
      setPreferredDate("");
    } catch (e) {
      Alert.alert("Error", "Could not send request");
    } finally {
      setSubmittingRequest(false);
    }
  };

  /* ---------------------------------- */

  const CATEGORY_META = {
    consultation: {
      label: "Consultation",
      icon: "chatbubbles-outline",
      color: "#6C63FF",
    },
    pond: {
      label: "Pond",
      icon: "water-outline",
      color: "#1E88E5",
    },
    tank: {
      label: "Tank",
      icon: "fish-outline",
      color: "#2E7D32",
    },
  };
  const [openCategories, setOpenCategories] = useState({});
  const toggleCategory = (key) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);

    setOpenCategories((prev) => {
      const isCurrentlyOpen = prev[key];

      // close everything, then optionally open clicked one
      return isCurrentlyOpen ? {} : { [key]: true };
    });
  };

  const getSelectedLabels = (items) =>
    items
      ?.filter((s) => selectedServices.includes(s.id))
      .map((s) => s.label)
      .join(", ");

  const getBookingUIState = (b) => {
    if (b.status === "confirmed" && b.payment_status === "paid") {
      return "CONFIRMED_PAID";
    }

    if (b.status === "pending" && b.payment_status === "pending" && b.consultant_status === "accepted") {
      return "AWAITING_PAYMENT";
    }

    return "WAITING_FOR_CONSULTANT";
  };

  const createPaymentForBooking = async (bookingId) => {
    try {
      const res = await fetch(`${baseUrl}/payments/bookings/${bookingId}/create-payment/`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          use_payment_link: true,
          success_url: "aqua://payment-success",
          cancel_url: "aqua://payment-cancel",
        }),
      });

      console.log("json Payment", res);
      const json = await res.json();

      if (json?.data?.payment_url) {
        setBookingResult({
          payment_url: json.data.payment_url,
        });
        setShowPayment(true);
      } else {
        Alert.alert("Error", "Payment link not generated");
      }
    } catch (e) {
      Alert.alert("Error", "Failed to create payment");
    }
  };

  const getBookingPillMeta = (b) => {
    if (b.status === "confirmed" && b.payment_status === "paid") {
      return {
        label: "Confirmed",
        bg: "#E8F5E9",
        color: "#2E7D32",
        icon: "checkmark-circle",
      };
    }

    if (b.consultant_status === "accepted") {
      return {
        label: "Awaiting Payment",
        bg: "#E3F2FD",
        color: "#1565C0",
        icon: "card-outline",
      };
    }

    return {
      label: "Pending",
      bg: "#FFF3E0",
      color: "#EF6C00",
      icon: "time-outline",
    };
  };

  return (
    <SafeAreaView style={styles.safe} edges={["left", "right", "bottom"]}>
      {loading ? (
        <View style={{ marginTop: 40 }}>
          <ActivityIndicator size="large" color="#a580e9" />
        </View>
      ) : (
        <>
          <ScrollView contentContainerStyle={styles.container}>
            {/* -------- Services -------- */}

            {/* -------- Header -------- */}
            <View style={styles.header}>
              <View>
                <Text style={styles.headerTitle}>Consultants</Text>

                {locationName ? (
                  <View style={styles.locationRow}>
                    <Ionicons name="location-outline" size={14} color="#666" />
                    <Text style={styles.locationText}>{locationName}</Text>
                  </View>
                ) : null}
              </View>
              <TouchableOpacity style={styles.myBookingsBtn} onPress={() => setShowBookingsSheet(true)}>
                <Ionicons name="calendar-outline" size={18} />
                <Text style={{ marginLeft: 6, fontWeight: "600" }}>My Bookings</Text>
              </TouchableOpacity>
            </View>

            {hasSearched && (
              <TouchableOpacity
                style={styles.searchAgain}
                onPress={() => {
                  LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                  setHasSearched(false);
                  setConsultants([]);
                }}
              >
                <Ionicons name="arrow-back" size={16} />
                <Text style={{ marginLeft: 6 }}>Search again</Text>
              </TouchableOpacity>
            )}

            {!hasSearched && (
              <View>
                {/* Services */}
                <Text style={styles.sectionTitle}>Services</Text>
                <Text style={styles.sectionHint}>Selected: {selectedServices.length}</Text>

                {Object.entries(services).map(([categoryKey, items]) => {
                  const meta = CATEGORY_META[categoryKey];
                  const isOpen = openCategories[categoryKey];
                  const selectedText = getSelectedLabels(items);

                  return (
                    <View key={categoryKey} style={styles.categoryBlock}>
                      {/* -------- Category Header -------- */}
                      <TouchableOpacity style={[styles.categoryHeader, isOpen && { backgroundColor: "#F6F8FF", borderRadius: 8, padding: 6 }]} onPress={() => toggleCategory(categoryKey)}>
                        <View style={{ flexDirection: "row", alignItems: "center" }}>
                          <Ionicons name={meta?.icon || "layers-outline"} size={18} color={meta?.color || "#555"} />
                          <Text style={[styles.categoryTitle, { marginLeft: 8 }]}>{meta?.label || categoryKey}</Text>
                        </View>

                        <Ionicons name={isOpen ? "chevron-up" : "chevron-down"} size={18} color="#666" />
                      </TouchableOpacity>

                      {/* -------- Dropdown -------- */}
                      {isOpen && (
                        <View style={styles.dropdown}>
                          {items.map((service) => {
                            const isActive = selectedServices.includes(service.id);

                            return (
                              <TouchableOpacity key={service.id} style={styles.dropdownItem} onPress={() => toggleService(service.id)}>
                                <Ionicons name={isActive ? "checkbox" : "square-outline"} size={18} color={isActive ? meta.color : "#999"} />
                                <Text style={styles.dropdownText}>{service.label}</Text>
                              </TouchableOpacity>
                            );
                          })}
                        </View>
                      )}

                      {/* -------- Selected summary -------- */}
                      {!!selectedText && <Text style={styles.selectedSummary}>Selected: {selectedText}</Text>}
                    </View>
                  );
                })}

                {/* Radius */}
                <View style={styles.radiusRow}>
                  <View style={{ flexDirection: "row", alignItems: "center" }}>
                    <Ionicons name="navigate-outline" size={16} color="#555" />
                    <Text style={[styles.radiusLabel, { marginLeft: 6 }]}>Radius</Text>
                  </View>

                  {[5, 10, 15, 25, 10000].map((r) => (
                    <TouchableOpacity key={r} style={[styles.radiusBtn, radius === r && styles.radiusActive]} onPress={() => setRadius(r)}>
                      <Text>{r} km</Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {/* Search */}

                <TouchableOpacity style={{ ...styles.button, opacity: selectedServices?.length == 0 ? 0.5 : 1 }} onPress={searchConsultants} disabled={selectedServices?.length == 0}>
                  {searching ? (
                    <ActivityIndicator />
                  ) : (
                    <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "center" }}>
                      <Ionicons name="search" size={18} />
                      <Text style={[styles.buttonText, { marginLeft: 8 }]}>Search Consultants</Text>
                    </View>
                  )}
                </TouchableOpacity>
              </View>
            )}

            {/* -------- Results -------- */}
            {/* -------- Empty State -------- */}
            {hasSearched && !searching && consultants.length === 0 && (
              <View style={styles.emptyState}>
                <Ionicons name="search-outline" size={48} color="#bbb" />
                <Text style={styles.emptyTitle}>No consultants found</Text>
                <Text style={styles.emptyText}>We couldn’t find any consultants matching your selected services in this area.</Text>
                <Text style={styles.emptyHint}>Try increasing the radius or selecting fewer services.</Text>
              </View>
            )}

            {console.log("consultants", consultants)}
            {consultants &&
              consultants.map((c) => {
                const grouped = (c.services || []).reduce((acc, s) => {
                  acc[s.category] = acc[s.category] || [];
                  acc[s.category].push(s.label);
                  return acc;
                }, {});

                return (
                  <Animated.View key={c.id}>
                    <TouchableOpacity
                      activeOpacity={0.9}
                      onPress={() => {
                        setSelectedConsultant(c);
                        setShowConsultantDetails(true);
                      }}
                      style={styles.consultantCard}
                    >
                      {/* Header */}
                      <View style={styles.cardHeader}>
                        <View style={styles.avatar}>
                          <Ionicons name="person" size={22} color="#fff" />
                        </View>

                        <View style={{ flex: 1 }}>
                          <Text style={styles.consultantName}>{c.name}</Text>
                          <Text style={styles.consultantCompany}>{c.company || "Independent Consultant"}</Text>
                        </View>

                        {/* Send Button */}
                        {canBookConsultant && (
                          <TouchableOpacity
                            style={styles.sendBtn}
                            onPress={() => {
                              setSelectedConsultant(c);
                              setShowRequestModal(true);
                            }}
                          >
                            <Ionicons name="send" size={16} color="#fff" />
                          </TouchableOpacity>
                        )}
                      </View>

                      {/* Services */}
                      <View style={styles.servicesWrap}>
                        {Object.entries(grouped).map(([category, labels]) =>
                          labels.map((label) => (
                            <View key={label} style={styles.serviceChip}>
                              <Ionicons name="checkmark-circle-outline" size={14} color="#a580e9" />
                              <Text style={styles.serviceText}>{label}</Text>
                            </View>
                          )),
                        )}
                      </View>

                      {/* Footer */}
                      <View style={styles.cardFooter}>
                        <View style={styles.footerItem}>
                          <Ionicons name="navigate-outline" size={14} color="#666" />
                          <Text style={styles.footerText}>{Number(c.distance_km).toFixed(1)} km</Text>
                        </View>

                        <View style={styles.footerItem}>
                          <Ionicons name="star" size={14} color="#f5c518" />
                          <Text style={styles.footerText}>
                            {c.rating.toFixed(1)} ({c.reviews})
                          </Text>
                        </View>
                      </View>
                    </TouchableOpacity>
                  </Animated.View>
                );
              })}
          </ScrollView>

          {/* -------- Request Modal -------- */}
          {canBookConsultant && (
            <Modal transparent visible={showRequestModal}>
              <View style={styles.modalOverlay}>
                <View style={styles.modal}>
                  <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
                    <Text style={styles.modalTitle}>Request {selectedConsultant?.name}</Text>

                    <TextInput placeholder="Describe your issue" placeholderTextColor="#999" style={styles.input} multiline value={message} onChangeText={setMessage} />

                    <TouchableOpacity onPress={() => setShowDatePicker(true)} style={[styles.input, styles.dateInput]}>
                      <Ionicons name="calendar-outline" size={18} color="#777" />
                      <Text style={{ marginLeft: 10, color: preferredDate ? "#000" : "#999" }}>{preferredDate || "Select preferred date"}</Text>
                    </TouchableOpacity>

                    {showDatePicker && <DateTimePicker value={preferredDate ? new Date(preferredDate) : new Date()} mode="date" display="calendar" minimumDate={new Date()} onChange={onDateChange} />}

                    {Array.isArray(availability) && availability.length > 0 && (
                      <>
                        <Text style={styles.sectionTitle}>Available Time Slots</Text>

                        {Object.entries(groupSlotsByHour(availability)).map(([hour, slots]) => (
                          <View key={hour} style={{ marginBottom: 14 }}>
                            <Text style={styles.hourLabel}>
                              {hour}:00 – {Number(hour) + 1}:00
                            </Text>

                            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10 }}>
                              {slots.map((slot) => {
                                const isActive = selectedSlot && selectedSlot.start === slot.start && selectedSlot.end === slot.end;

                                return (
                                  <TouchableOpacity key={slotToId(slot)} style={[styles.slotChip, isActive && styles.slotChipActive]} onPress={() => setSelectedSlot(slot)}>
                                    <Text
                                      style={{
                                        color: isActive ? "#fff" : "#333",
                                        fontWeight: "600",
                                      }}
                                    >
                                      {formatTime(slot.start)} – {formatTime(slot.end)}
                                    </Text>
                                  </TouchableOpacity>
                                );
                              })}
                            </ScrollView>
                          </View>
                        ))}
                      </>
                    )}

                    {checkingAvailability && (
                      <View style={{ marginVertical: 12 }}>
                        <ActivityIndicator />
                        <Text style={{ textAlign: "center", marginTop: 6 }}>Checking availability…</Text>
                      </View>
                    )}

                    {selectedSlot && (
                      <TouchableOpacity style={[styles.button, { backgroundColor: "#1E88E5", opacity: submittingRequest ? 0.7 : 1 }]} onPress={bookConsultant} disabled={submittingRequest}>
                        {submittingRequest ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Confirm & Book</Text>}
                      </TouchableOpacity>
                    )}
                  </ScrollView>

                  <TouchableOpacity onPress={() => setShowRequestModal(false)}>
                    <Text style={styles.cancel}>Cancel</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </Modal>
          )}

          {!canBookConsultant && (
            <View
              style={{
                backgroundColor: "#fff3cd",
                padding: 12,
                borderRadius: 12,
                paddingBottom: 30,
                marginBottom: 12,
              }}
            >
              <Text style={{ fontSize: 13, color: "#856404", textAlign: "center" }}>Consultant booking is available on Pro plans.</Text>
            </View>
          )}
        </>
      )}

      {showPayment && bookingResult?.payment_url && (
        <Modal visible transparent>
          <SafeAreaView style={{ flex: 1 }}>
            <WebView
              source={{ uri: bookingResult.payment_url }}
              onNavigationStateChange={(nav) => {
                if (nav.url.includes("success")) {
                  handlePaymentSuccess();
                }
              }}
            />
          </SafeAreaView>
        </Modal>
      )}
      <Modal visible={showConsultantDetails} animationType="slide">
        <SafeAreaView style={{ flex: 1, backgroundColor: "#F8F8F8" }}>
          {/* Header */}
          <View style={styles.detailsHeader}>
            <TouchableOpacity onPress={() => setShowConsultantDetails(false)}>
              <Ionicons name="arrow-back" size={22} />
            </TouchableOpacity>
            <Text style={styles.detailsTitle}>Consultant Details</Text>
          </View>

          {selectedConsultant && (
            <ScrollView contentContainerStyle={{ padding: 20 }}>
              {/* Hero (LEFT aligned) */}
              <View style={styles.detailsHeroRow}>
                <View style={styles.detailsAvatar}>
                  <Ionicons name="person" size={26} color="#fff" />
                </View>

                <View style={{ flex: 1 }}>
                  <Text style={styles.detailsName}>{selectedConsultant.name}</Text>
                  <View style={styles.inlineRow}>
                    <Ionicons name="briefcase-outline" size={14} color="#666" />
                    <Text style={styles.detailsCompany}>{selectedConsultant.company || "Independent Consultant"}</Text>
                  </View>
                </View>
              </View>

              {/* About */}
              <View style={styles.sectionBlock}>
                <View style={styles.sectionHeader}>
                  <Ionicons name="information-circle-outline" size={18} color="#a580e9" />
                  <Text style={styles.blockTitle}>About</Text>
                </View>
                <Text style={styles.aboutText}>Passionate aquatic consultant with years of experience in tank maintenance, aquascaping and eco-friendly solutions.</Text>
              </View>

              {/* Services */}
              <View style={styles.sectionBlock}>
                <View style={styles.sectionHeader}>
                  <Ionicons name="construct-outline" size={18} color="#a580e9" />
                  <Text style={styles.blockTitle}>Services</Text>
                </View>

                {/* {selectedConsultant.services.map((s) => (
            <View key={s.id} style={styles.iconRow}>
              <Ionicons name="checkmark-circle-outline" size={16} color="#a580e9" />
              <Text style={styles.listItem}>{s.label}</Text>
            </View>
          ))} */}
              </View>

              {/* Socials */}
              <View style={styles.sectionBlock}>
                <View style={styles.sectionHeader}>
                  <Ionicons name="share-social-outline" size={18} color="#a580e9" />
                  <Text style={styles.blockTitle}>Connect</Text>
                </View>

                <View style={styles.socialRow}>
                  <TouchableOpacity style={styles.socialPill}>
                    <Ionicons name="logo-instagram" size={18} color="#E1306C" />
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.socialPill}>
                    <Ionicons name="logo-facebook" size={18} color="#1877F2" />
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.socialPill}>
                    <Ionicons name="globe-outline" size={18} color="#555" />
                  </TouchableOpacity>
                </View>
              </View>

              {/* CTA */}
              {canBookConsultant && (
                <TouchableOpacity
                  style={[styles.button, { marginTop: 20, marginBottom: 40 }]}
                  onPress={() => {
                    setShowConsultantDetails(false);
                    setShowRequestModal(true);
                  }}
                >
                  <Text style={styles.buttonText}>Request Consultation</Text>
                </TouchableOpacity>
              )}
            </ScrollView>
          )}
        </SafeAreaView>
      </Modal>

      <Modal visible={showBookingsSheet} animationType="slide" transparent>
        <View style={styles.sheetOverlay}>
          <View style={styles.sheet}>
            <View style={styles.sheetHeader}>
              <Text style={{ fontWeight: "700", fontSize: 16 }}>My Bookings</Text>
              <TouchableOpacity onPress={() => setShowBookingsSheet(false)}>
                <Ionicons name="close" size={22} />
              </TouchableOpacity>
            </View>

            {loadingBookings ? (
              <View style={{ paddingVertical: 40 }}>
                <ActivityIndicator size="large" color="#a580e9" />
                <Text style={{ textAlign: "center", marginTop: 8 }}>Loading bookings…</Text>
              </View>
            ) : (
              <ScrollView>
                {bookingsSummary && (
                  <View style={{ flexDirection: "row", justifyContent: "space-around", marginBottom: 12 }}>
                    <View>
                      <Text style={{ fontWeight: "700", textAlign: "center" }}>{bookingsSummary.total}</Text>
                      <Text style={{ fontSize: 12, color: "#666" }}>Total</Text>
                    </View>

                    <View>
                      <Text style={{ fontWeight: "700", textAlign: "center" }}>{bookingsSummary.upcoming}</Text>
                      <Text style={{ fontSize: 12, color: "#666" }}>Upcoming</Text>
                    </View>

                    <View>
                      <Text style={{ fontWeight: "700", textAlign: "center" }}>{bookingsSummary.completed}</Text>
                      <Text style={{ fontSize: 12, color: "#666" }}>Completed</Text>
                    </View>
                  </View>
                )}

                {myBookings.map((b) => {
                  const pill = getBookingPillMeta(b);

                  return (
                    <TouchableOpacity key={b.id} style={styles.bookingCardNew} onPress={() => fetchBookingDetails(b.id)} activeOpacity={0.85}>
                      {/* Left */}
                      <View style={{ flex: 1 }}>
                        <Text style={styles.bookingCompany}>{b.consultant?.company_name}</Text>

                        <View style={styles.bookingRow}>
                          <Ionicons name="construct-outline" size={14} color="#777" />
                          <Text style={styles.bookingSub}>{b.services.map((s) => s.label).join(", ")}</Text>
                        </View>

                        <View style={styles.bookingRow}>
                          <Ionicons name="calendar-outline" size={14} color="#777" />
                          <Text style={styles.bookingSub}>{new Date(b.scheduled_start).toLocaleString()}</Text>
                        </View>

                        <View style={styles.bookingRow}>
                          <Ionicons name="cash-outline" size={14} color="#777" />
                          <Text style={styles.bookingSub}>£{b.full_price}</Text>
                        </View>
                      </View>

                      {/* Right */}
                      <View style={[styles.statusPillNew, { backgroundColor: pill.bg }]}>
                        <Ionicons name={pill.icon} size={14} color={pill.color} />
                        <Text
                          style={{
                            fontSize: 12,
                            fontWeight: "700",
                            marginLeft: 6,
                            color: pill.color,
                          }}
                        >
                          {pill.label}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>

      <Modal visible={showBookingDetails} animationType="slide">
        <SafeAreaView style={{ flex: 1, backgroundColor: "#F8F8F8" }}>
          {/* Header */}
          <View style={styles.detailsHeader}>
            <TouchableOpacity onPress={() => setShowBookingDetails(false)}>
              <Ionicons name="arrow-back" size={22} />
            </TouchableOpacity>
            <Text style={styles.detailsTitle}>Booking Details</Text>
          </View>

          {loadingDetails || !bookingDetails ? (
            <ActivityIndicator style={{ marginTop: 40 }} />
          ) : (
            <ScrollView contentContainerStyle={{ padding: 20 }}>
              <View style={styles.detailCard}>
                <View style={styles.detailRow}>
                  <Ionicons name="business-outline" size={18} color="#a580e9" />
                  <Text style={styles.detailMain}>{bookingDetails.consultant?.company_name}</Text>
                </View>

                <View style={styles.detailRow}>
                  <Ionicons name="calendar-outline" size={16} color="#777" />
                  <Text style={styles.detailSub}>{new Date(bookingDetails.scheduled_start).toLocaleString()}</Text>
                </View>

                <View style={styles.detailRow}>
                  <Ionicons name="cash-outline" size={16} color="#777" />
                  <Text style={styles.detailSub}>£{bookingDetails.full_price} total</Text>
                </View>
              </View>

              {/* Status */}
              <View style={styles.statusRow}>
                <Text style={styles.blockTitle}>Status</Text>
                <View style={[styles.statusBadge, bookingDetails.status === "confirmed" ? { backgroundColor: "#E8F5E9" } : { backgroundColor: "#FFF3E0" }]}>
                  <Text style={{ fontWeight: "600" }}>{bookingDetails.user_state}</Text>
                </View>
              </View>

              {/* Price */}
              <Text style={styles.blockTitle}>Price</Text>
              <View style={styles.priceRow}>
                <Text>Service</Text>
                <Text>£{bookingDetails.full_price}</Text>
              </View>
              <View style={styles.priceRow}>
                <Text>Booking Fee</Text>
                <Text>£{bookingDetails.booking_fee}</Text>
              </View>

              {/* ---------- STATE HANDLING ---------- */}
              {(() => {
                const uiState = getBookingUIState(bookingDetails);

                /* 🕒 Waiting for consultant */
                if (uiState === "WAITING_FOR_CONSULTANT") {
                  return (
                    <View style={styles.infoBox}>
                      <Ionicons name="time-outline" size={18} color="#EF6C00" />
                      <Text style={styles.infoText}>Waiting for consultant approval</Text>
                    </View>
                  );
                }

                /* 💳 Awaiting payment */
                if (uiState === "AWAITING_PAYMENT") {
                  return (
                    <View style={styles.paymentBox}>
                      <Text style={styles.paymentTitle}>Payment Required</Text>

                      <View style={styles.priceRow}>
                        <Text>Total</Text>
                        <Text style={{ fontWeight: "700" }}>£{bookingDetails.full_price}</Text>
                      </View>

                      <TouchableOpacity style={[styles.button, { backgroundColor: "#1E88E5" }]} onPress={() => createPaymentForBooking(bookingDetails.id)}>
                        <Ionicons name="card-outline" size={18} color="#fff" />
                        <Text style={[styles.buttonText, { color: "#fff", marginLeft: 8 }]}>Complete Payment</Text>
                      </TouchableOpacity>
                    </View>
                  );
                }

                /* ✅ Confirmed & paid */
                if (uiState === "CONFIRMED_PAID") {
                  return (
                    <View style={styles.successBox}>
                      <Ionicons name="checkmark-circle" size={32} color="#2E7D32" />
                      <Text style={styles.successTitle}>Booking Confirmed</Text>
                      <Text style={styles.successSub}>Payment received & consultant confirmed</Text>
                    </View>
                  );
                }

                return null;
              })()}

              {/* Cancel (only if allowed) */}
              {bookingDetails.can_cancel && (
                <TouchableOpacity
                  style={styles.cancelBtn}
                  onPress={() => {
                    Alert.alert("Cancel booking?", "This action cannot be undone", [
                      { text: "No" },
                      {
                        text: "Yes, Cancel",
                        style: "destructive",
                        onPress: async () => {
                          await cancelBooking(bookingDetails.id);
                          setShowBookingDetails(false);
                        },
                      },
                    ]);
                  }}
                >
                  <Text style={{ color: "#D32F2F", fontWeight: "600" }}>Cancel Booking</Text>
                </TouchableOpacity>
              )}
            </ScrollView>
          )}
        </SafeAreaView>
      </Modal>

      <PaymentSuccessModal
        visible={showSuccess}
        onClose={() => {
          setShowSuccess(false);
          resetBookingFlow();
        }}
        onViewBookings={() => {
          setShowSuccess(false);
          setShowBookingsSheet(true);
        }}
      />

      <BookingSuccessModal
        visible={showBookingSuccess}
        onClose={() => {
          setShowBookingSuccess(false);
          resetBookingFlow();
        }}
        onViewBookings={() => {
          fetchMyBookings();
          setShowBookingSuccess(false);
          setShowBookingsSheet(true);
        }}
      />
    </SafeAreaView>
  );
}

/* ---------------------------------- */

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#F8F8F8" },
  container: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },

  sectionTitle: { fontSize: 16, fontWeight: "700", marginBottom: 10 },

  chip: {
    backgroundColor: "#fff",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    flexDirection: "row",
    flexWrap: "wrap",

    gap: 3,
  },
  chipActive: { backgroundColor: "#a580e9" },
  chipText: { color: "#555" },
  chipTextActive: { color: "#fff", fontWeight: "600" },

  radiusRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 10,
    marginVertical: 14,
  },
  radiusLabel: { fontWeight: "600" },
  radiusBtn: {
    backgroundColor: "#eee",
    padding: 8,
    borderRadius: 10,
  },
  radiusActive: { backgroundColor: "#a580e9" },

  button: {
    backgroundColor: "#a580e9",
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginTop: 14,
    marginBottom: 100,
  },

  buttonText: { textAlign: "center", fontWeight: "bold" },

  card: {
    backgroundColor: "#fff",
    padding: 14,
    borderRadius: 12,
    marginTop: 12,
    flexDirection: "row",
    alignItems: "center",
  },
  name: { fontWeight: "700" },
  sub: { fontSize: 12, color: "#666" },

  requestBtn: {
    backgroundColor: "#a580e9",
    padding: 10,
    borderRadius: 10,
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
  },
  modal: {
    backgroundColor: "#fff",
    margin: 20,
    padding: 16,
    borderRadius: 14,
  },
  modalTitle: { fontWeight: "700", marginBottom: 10 },

  input: {
    backgroundColor: "#F4F4F4",
    padding: 12,
    borderRadius: 10,
    marginBottom: 10,
  },

  cancel: {
    textAlign: "center",
    color: "#777",
    marginTop: 10,
  },
  emptyState: {
    marginTop: 40,
    alignItems: "center",
    paddingHorizontal: 20,
  },

  emptyTitle: {
    marginTop: 12,
    fontSize: 16,
    fontWeight: "700",
    color: "#333",
  },

  emptyText: {
    marginTop: 6,
    fontSize: 13,
    color: "#666",
    textAlign: "center",
  },

  emptyHint: {
    marginTop: 4,
    fontSize: 12,
    color: "#999",
    textAlign: "center",
  },
  dateInput: {
    flexDirection: "row",
    alignItems: "center",
  },
  searchAgain: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
    padding: 8,
    borderRadius: 20,
    backgroundColor: "#eee",
    alignSelf: "flex-start",
  },
  header: {
    marginBottom: 20,
    flexDirection: "row",
    justifyContent: "space-between",
  },

  headerTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: "#a580e9",
  },

  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
  },

  locationText: {
    marginLeft: 4,
    fontSize: 12,
    color: "#666",
  },
  categoryTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#444",
    marginBottom: 8,
  },
  sectionHint: {
    fontSize: 12,
    color: "#888",
    marginBottom: 6,
  },
  categoryBlock: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 12,
    marginBottom: 14,
  },

  categoryHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  dropdown: {
    marginTop: 10,
    borderTopWidth: 1,
    borderTopColor: "#eee",
    paddingTop: 8,
  },

  dropdownItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
  },

  dropdownText: {
    marginLeft: 10,
    fontSize: 14,
    color: "#333",
  },

  selectedSummary: {
    marginTop: 6,
    fontSize: 12,
    color: "#666",
    fontStyle: "italic",
  },
  slotChip: {
    backgroundColor: "#eee",
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
  },
  slotChipActive: {
    backgroundColor: "#1E88E5",
  },
  priceBox: {
    backgroundColor: "#F4F6FA",
    borderRadius: 12,
    padding: 12,
    marginTop: 10,
  },
  priceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginVertical: 4,
  },
  myBookingsBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#EEF7F6",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    alignSelf: "flex-start",
    marginTop: 10,
  },
  sheetOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.3)",
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 16,
    maxHeight: "70%",
  },
  sheetHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  bookingCard: {
    backgroundColor: "#F8F8F8",
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    flexDirection: "row",
    alignItems: "center",
  },
  statusPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  hourLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: "#555",
    marginBottom: 6,
  },
  detailsHeader: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  detailsTitle: {
    fontSize: 16,
    fontWeight: "700",
    marginLeft: 12,
  },
  blockTitle: {
    fontSize: 12,
    color: "#777",
    marginTop: 16,
  },
  blockValue: {
    fontSize: 15,
    fontWeight: "600",
    marginTop: 4,
  },
  statusRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 16,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  cancelBtn: {
    marginTop: 30,
    padding: 14,
    borderRadius: 12,
    backgroundColor: "#FDECEA",
    alignItems: "center",
  },
  consultantCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    marginTop: 14,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },

  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
  },

  avatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#a580e9",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },

  consultantName: {
    fontSize: 15,
    fontWeight: "700",
    color: "#222",
  },

  consultantCompany: {
    fontSize: 12,
    color: "#777",
    marginTop: 2,
  },

  sendBtn: {
    backgroundColor: "#a580e9",
    padding: 10,
    borderRadius: 10,
  },

  servicesWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 12,
  },

  serviceChip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F4F6FA",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
  },

  serviceText: {
    fontSize: 12,
    marginLeft: 6,
    color: "#444",
  },

  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#eee",
  },

  footerItem: {
    flexDirection: "row",
    alignItems: "center",
  },

  footerText: {
    fontSize: 12,
    color: "#666",
    marginLeft: 4,
  },
  detailsHeroRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 16,
    marginBottom: 20,
  },

  inlineRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
  },

  detailsAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#a580e9",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 14,
  },

  detailsName: {
    fontSize: 16,
    fontWeight: "800",
    color: "#222",
  },

  detailsCompany: {
    fontSize: 12,
    color: "#666",
    marginLeft: 6,
  },

  sectionBlock: {
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 16,
    marginBottom: 14,
  },

  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },

  blockTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#333",
    marginLeft: 8,
  },

  aboutText: {
    fontSize: 14,
    color: "#555",
    lineHeight: 20,
  },

  iconRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
  },

  listItem: {
    fontSize: 13,
    color: "#444",
    marginLeft: 8,
  },

  socialRow: {
    flexDirection: "row",
    gap: 12,
    marginTop: 6,
  },

  socialPill: {
    backgroundColor: "#F4F6FA",
    padding: 10,
    borderRadius: 12,
  },
  infoBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF3E0",
    padding: 12,
    borderRadius: 12,
    marginTop: 20,
    gap: 8,
  },

  infoText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#EF6C00",
  },

  paymentBox: {
    backgroundColor: "#F4F6FA",
    padding: 16,
    borderRadius: 16,
    marginTop: 24,
  },

  paymentTitle: {
    fontSize: 15,
    fontWeight: "700",
    marginBottom: 12,
  },

  successBox: {
    alignItems: "center",
    backgroundColor: "#E8F5E9",
    padding: 20,
    borderRadius: 16,
    marginTop: 24,
  },

  successTitle: {
    fontSize: 16,
    fontWeight: "800",
    marginTop: 8,
    color: "#2E7D32",
  },

  successSub: {
    fontSize: 13,
    color: "#388E3C",
    marginTop: 4,
  },
  bookingCardNew: {
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    flexDirection: "row",
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },

  bookingCompany: {
    fontSize: 14,
    fontWeight: "800",
    color: "#222",
    marginBottom: 6,
  },

  bookingRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },

  bookingSub: {
    fontSize: 12,
    color: "#666",
    marginLeft: 6,
  },

  statusPillNew: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    alignSelf: "flex-start",
  },
  detailCard: {
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 16,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },

  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },

  detailMain: {
    fontSize: 16,
    fontWeight: "800",
    marginLeft: 10,
    color: "#222",
  },

  detailSub: {
    fontSize: 13,
    color: "#555",
    marginLeft: 10,
  },
});
