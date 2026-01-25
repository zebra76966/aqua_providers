// BreederBadgesScreen.js
import React, { useContext, useEffect, useRef, useState } from "react";
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, Animated, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { AuthContext } from "../../../authcontext";
import { baseUrl } from "../../../config";

const AnimatedBadge = ({ badge, unlocked, delay }) => {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(anim, {
      toValue: 1,
      duration: 450,
      delay,
      useNativeDriver: true,
    }).start();
  }, []);

  return (
    <Animated.View
      style={[
        styles.badgeCard,
        unlocked ? styles.badgeUnlocked : styles.badgeLocked,
        {
          opacity: anim,
          transform: [
            {
              translateY: anim.interpolate({
                inputRange: [0, 1],
                outputRange: [12, 0],
              }),
            },
            ...(unlocked
              ? [
                  {
                    scale: anim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.95, 1],
                    }),
                  },
                ]
              : []),
          ],
        },
      ]}
    >
      <View style={[unlocked ? styles.iconWrap : styles.iconWrapLocked, unlocked && { backgroundColor: badge.color + "22" }]}>
        <Text style={[styles.badgeIcon, { color: unlocked ? badge.color : "#bbb" }]}>{badge.icon}</Text>
      </View>

      <Text style={[styles.badgeTitle, !unlocked && { color: "#aaa" }]}>{badge.name}</Text>
      <Text style={styles.badgeDesc}>{badge.description}</Text>

      {unlocked ? (
        <>
          <View style={[styles.tierChip, { borderColor: badge.color }]}>
            <Text style={[styles.tierText, { color: badge.color }]}>Tier {badge.tier}</Text>
          </View>
          <Text style={styles.badgeStatus}>Unlocked</Text>
        </>
      ) : (
        <>
          <View style={styles.tierChipLocked}>
            <Text style={styles.tierTextLocked}>Tier {badge.tier}</Text>
          </View>
          <Text style={styles.badgeStatusLocked}>Locked</Text>
        </>
      )}
    </Animated.View>
  );
};

const BreederBadgesScreen = ({ navigation }) => {
  const { token } = useContext(AuthContext);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  const [loading, setLoading] = useState(true);
  const [badges, setBadges] = useState([]);
  const [error, setError] = useState("");

  const [earned, setEarned] = useState([]);
  const [available, setAvailable] = useState([]);
  const [summary, setSummary] = useState(null);

  const fetchBadges = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${baseUrl}/breeders/badges/`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const json = await res.json();

      if (!res.ok) {
        setError(json.message || "Failed to load badges");
        return;
      }

      const data = json.data || {};
      setEarned(data.earned_badges || []);
      setAvailable(data.available_badges || []);
      setSummary(data.summary || null);
    } catch {
      setError("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBadges();

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

  if (loading) {
    return (
      <View style={styles.loaderWrap}>
        <ActivityIndicator size="large" color="#a580e9" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.loaderWrap}>
        <Text style={{ color: "#b00020" }}>{error}</Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="chevron-back" size={28} color="#a580e9" />
          </TouchableOpacity>
          <Text style={styles.title}>Your Badges</Text>
        </View>

        <Text style={styles.subtitle}>Earn achievements as you grow your breeder journey.</Text>
        {earned?.length == 0 && (
          <View style={styles.emptyWrap}>
            <Ionicons name="ribbon-outline" size={48} color="#ccc" />
            <Text style={styles.emptyText}>No badges yet</Text>
          </View>
        )}

        {summary && (
          <View style={{ marginBottom: 16 }}>
            <Text style={{ fontSize: 13, color: "#666" }}>
              {summary.total_earned} / {summary.total_available} badges earned · Highest tier: {summary.highest_tier || 0}
            </Text>
          </View>
        )}

        <View style={styles.grid}>
          {earned.map((badge, index) => (
            <AnimatedBadge key={badge.badge_type} badge={badge} unlocked delay={index * 80} />
          ))}

          {available.map((badge, index) => (
            <AnimatedBadge key={badge.badge_type} badge={badge} unlocked={false} delay={(earned.length + index) * 80} />
          ))}
        </View>
      </Animated.View>
    </ScrollView>
  );
};

export default BreederBadgesScreen;

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: "#fff",
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 140,
  },
  loaderWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 6,
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    color: "#333",
  },
  subtitle: {
    fontSize: 13,
    color: "#666",
    marginBottom: 20,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  badgeCard: {
    width: "48%",
    backgroundColor: "#faf7ff",
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#e7dbff",
  },
  badgeLocked: {
    backgroundColor: "#f7f7f7",
    borderColor: "#eee",
  },
  badgeTitle: {
    marginTop: 8,
    fontSize: 14,
    fontWeight: "700",
    color: "#333",
    textAlign: "center",
  },
  badgeDesc: {
    marginTop: 4,
    fontSize: 11,
    color: "#777",
    textAlign: "center",
  },
  emptyWrap: {
    alignItems: "center",
    marginTop: 60,
    marginBottom: 50,
  },
  emptyText: {
    marginTop: 10,
    color: "#888",
  },
  badgeUnlocked: {
    backgroundColor: "#f9f6ff",
    shadowColor: "#a580e9",
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 4,
  },

  iconWrap: {
    width: 54,
    height: 54,
    borderRadius: 27,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 6,
  },

  iconWrapLocked: {
    width: 54,
    height: 54,
    borderRadius: 27,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 6,
    backgroundColor: "#eee",
  },

  badgeIcon: {
    fontSize: 26,
  },

  tierChip: {
    marginTop: 6,
    paddingHorizontal: 10,
    paddingVertical: 2,
    borderRadius: 12,
    borderWidth: 1,
  },

  tierText: {
    fontSize: 10,
    fontWeight: "700",
  },

  tierChipLocked: {
    marginTop: 6,
    paddingHorizontal: 10,
    paddingVertical: 2,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#ddd",
  },

  tierTextLocked: {
    fontSize: 10,
    fontWeight: "700",
    color: "#bbb",
  },

  badgeStatus: {
    marginTop: 6,
    fontSize: 11,
    fontWeight: "700",
    color: "#4CAF50",
  },

  badgeStatusLocked: {
    marginTop: 6,
    fontSize: 11,
    fontWeight: "700",
    color: "#bbb",
  },
});
