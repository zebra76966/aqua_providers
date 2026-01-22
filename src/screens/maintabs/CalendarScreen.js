import React, { useContext, useEffect, useRef, useState } from "react";
import { View, Text, StyleSheet, SectionList, ActivityIndicator, Animated, TouchableOpacity } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { baseUrl } from "../../config";
import { AuthContext } from "../../authcontext";

const groupByDay = (items = []) => {
  const map = {};

  items.forEach((b) => {
    const d = new Date(b.scheduled_start);
    const key = d.toDateString();
    if (!map[key]) map[key] = [];
    map[key].push(b);
  });

  return Object.keys(map).map((k) => ({
    title: k,
    data: map[k],
  }));
};

const time = (iso) => new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

const CalendarScreen = ({ navigation }) => {
  const { token } = useContext(AuthContext);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  const [isLoading, setIsLoading] = useState(true);
  const [sections, setSections] = useState([]);
  const [error, setError] = useState("");

  const [rawDays, setRawDays] = useState([]);

  const [mode, setMode] = useState("all"); // all | today | week | booked

  const [selectedDate, setSelectedDate] = useState(null);

  const fetchCalendar = async () => {
    try {
      setIsLoading(true);
      const res = await fetch(`${baseUrl}/consultants/calendar/`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      const json = await res.json();

      if (!res.ok) {
        setError(json.message || "Failed to load calendar");
        return;
      }

      const days = json.data?.calendar || [];
      setRawDays(days);
      applyFilter(days, mode, selectedDate);
    } catch {
      setError("Something went wrong");
    } finally {
      setIsLoading(false);
    }
  };

  const applyFilter = (days, mode, date) => {
    let filtered = days;

    if (mode === "today") {
      filtered = days.filter((d) => d.is_today);
    }

    if (mode === "week") {
      const start = new Date();
      const end = new Date();
      end.setDate(start.getDate() + 7);

      filtered = days.filter((d) => {
        const cur = new Date(d.date);
        return cur >= start && cur <= end;
      });
    }

    if (mode === "booked") {
      filtered = days.filter((d) => d.bookings && d.bookings.length > 0);
    }

    if (mode === "date" && date) {
      const key = date.toISOString().slice(0, 10);
      filtered = days.filter((d) => d.date === key);
    }

    const sections = filtered.map((day) => ({
      title: `${day.day_of_week}, ${day.date}`,
      isToday: day.is_today,
      isWeekend: day.is_weekend,
      data: day.bookings.length ? day.bookings : [{ _empty: true }],
    }));

    setSections(sections);
  };

  useFocusEffect(
    React.useCallback(() => {
      fetchCalendar();
    }, []),
  );

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 400,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <View style={styles.container}>
      <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
        <Text style={styles.title}>Calendar</Text>
      </Animated.View>

      <View style={styles.filters}>
        <TouchableOpacity
          style={[styles.chip, mode === "today" && styles.chipActive]}
          onPress={() => {
            setMode("today");
            applyFilter(rawDays, "today");
          }}
        >
          <Text style={styles.chipText}>Today</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.chip, mode === "week" && styles.chipActive]}
          onPress={() => {
            setMode("week");
            applyFilter(rawDays, "week");
          }}
        >
          <Text style={styles.chipText}>Next 7 Days</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.chip, mode === "all" && styles.chipActive]}
          onPress={() => {
            setMode("all");
            applyFilter(rawDays, "all");
          }}
        >
          <Text style={styles.chipText}>All</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.chip, mode === "booked" && styles.chipActive]}
          onPress={() => {
            setMode("booked");
            applyFilter(rawDays, "booked");
          }}
        >
          <Text style={styles.chipText}>With Bookings</Text>
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <View style={styles.loaderWrap}>
          <ActivityIndicator size="large" color="#a580e9" />
        </View>
      ) : error ? (
        <View style={styles.loaderWrap}>
          <Text style={{ color: "#b00020" }}>{error}</Text>
        </View>
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={(item, index) => item.id || `empty-${index}`}
          contentContainerStyle={{ paddingBottom: 140 }}
          renderSectionHeader={({ section }) => (
            <Text style={[styles.sectionHeader, section.isToday && styles.todayHeader, section.isWeekend && styles.weekendHeader]}>
              {section.title}
              {section.isToday ? " • Today" : ""}
            </Text>
          )}
          renderItem={({ item }) => {
            if (item._empty) {
              return <Text style={styles.empty}>No bookings</Text>;
            }

            const start = new Date(item.start).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            });
            const end = new Date(item.end).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            });

            return (
              <TouchableOpacity
                style={[styles.card, { borderLeftColor: item.color || "#a580e9" }]}
                onPress={() =>
                  navigation.navigate("Bookings", {
                    screen: "BookingDetails",
                    params: {
                      booking: {
                        id: item.id,
                        scheduled_start: item.start,
                        scheduled_end: item.end,
                        services: item.extendedProps?.services?.map((s) => ({ label: s })),
                        full_price: item.extendedProps?.price,
                        user_state: item.extendedProps?.payment_status,
                        status: item.status,
                        can_reschedule: true,
                        can_cancel: true,
                      },
                    },
                  })
                }
              >
                <View style={styles.rowBetween}>
                  <Text style={styles.cardTitle}>{item.title}</Text>
                  <Text style={styles.time}>
                    {start} – {end}
                  </Text>
                </View>

                <Text style={styles.meta}>{item.status}</Text>
              </TouchableOpacity>
            );
          }}
        />
      )}
    </View>
  );
};

export default CalendarScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    color: "#333",
    marginBottom: 10,
  },
  loaderWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  sectionHeader: {
    marginTop: 20,
    marginBottom: 8,
    fontSize: 13,
    fontWeight: "700",
    color: "#a580e9",
    letterSpacing: 1,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#eee",
  },
  rowBetween: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: "#333",
  },
  time: {
    fontSize: 12,
    color: "#666",
  },
  meta: {
    marginTop: 4,
    fontSize: 11,
    color: "#777",
  },
  todayHeader: {
    color: "#004d40",
  },
  weekendHeader: {
    opacity: 0.7,
  },
  empty: {
    fontSize: 12,
    color: "#aaa",
    marginBottom: 10,
    marginLeft: 6,
  },
  filters: {
    flexDirection: "row",
    marginBottom: 12,
  },
  chip: {
    borderWidth: 1,
    borderColor: "#a580e9",
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
  },
  chipActive: {
    backgroundColor: "#a580e9",
    color: "#ffff",
  },
  chipText: {
    fontSize: 12,
    color: "#050505",
  },
});
