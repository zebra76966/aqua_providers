import React, { useContext, useEffect, useState, useRef } from "react";
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Modal, Dimensions } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import Animated, { FadeInUp, SlideInRight, useAnimatedProps, useSharedValue, withTiming } from "react-native-reanimated";
import Svg, { Defs, LinearGradient, Stop, Polygon, Circle } from "react-native-svg";

import AsyncStorage from "@react-native-async-storage/async-storage";
import { AuthContext } from "../../../authcontext";
import { baseUrl } from "../../../config";
import LottieView from "lottie-react-native";
import { Audio } from "expo-av";

const AnimatedCircle = Animated.createAnimatedComponent(Circle);
const { width } = Dimensions.get("window");

/* ===== GAUGE CONFIG ===== */
const RADIUS = 110;
const STROKE = 14;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
const HALF_CIRCUMFERENCE = Math.PI * RADIUS;

export default function BadgesScreen() {
  const navigation = useNavigation();
  const { token } = useContext(AuthContext);

  const [loading, setLoading] = useState(true);
  const [trust, setTrust] = useState(null);
  const [badgeDefs, setBadgeDefs] = useState([]);
  const [myBadges, setMyBadges] = useState({});
  const [selectedBadge, setSelectedBadge] = useState(null);
  const [showConfetti, setShowConfetti] = useState(false);

  const [showWhy, setShowWhy] = useState(false);
  const confettiRef = useRef(null);

  const progress = useSharedValue(0);

  /* ===== FETCH DATA ===== */
  useEffect(() => {
    if (!token) return;

    const headers = {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    };

    console.log("[Badges] Starting API calls...");

    Promise.all([
      fetch(`${baseUrl}/badges/trust-score/me/`, { headers }).then((r) => r.json()),
      fetch(`${baseUrl}/badges/definitions/`, { headers }).then((r) => r.json()),
      fetch(`${baseUrl}/badges/badges/me/`, { headers }).then((r) => r.json()),
      // Preview API – LOG ONLY (backend currently broken)
      fetch(`${baseUrl}/badges/evaluate-preview/user/`, {
        method: "POST",
        headers,
        body: JSON.stringify({}),
      }).then((r) => r.json()),
    ])
      .then(async ([trustRes, defsRes, myRes, previewRes]) => {
        const trustData = trustRes?.data || trustRes;
        const defsData = defsRes?.data || defsRes || [];
        const myBadgesData = myRes?.data || myRes || {};

        console.log("[Badges] trust:", trustData);
        console.log("[Badges] badge definitions:", defsData);
        console.log("[Badges] my badges:", myBadgesData);
        console.log("[Badges] preview (log only):", previewRes);

        setTrust(trustData);
        setBadgeDefs(defsData);
        setMyBadges(myBadgesData);

        if (myBadgesData?.recently_earned?.length > 0) {
          setTimeout(async () => {
            setShowConfetti(true);

            // 🔊 Play success sound
            const { sound } = await Audio.Sound.createAsync(require("../../../assets/success.mp3"));
            await sound.playAsync();

            // ⏱ Auto-dismiss after 3 seconds
            setTimeout(() => {
              setShowConfetti(false);
              setShowWhy(false);
            }, 3000);
          }, 500);
        }

        await AsyncStorage.setItem(
          "TRUST_CACHE",
          JSON.stringify({
            score: trustData?.trust_score?.trust_score,
            tier: trustData?.trust_score?.regulatory_tier,
            color: trustData?.trust_score?.tier_color,
            icon: trustData?.trust_score?.tier_icon,
          }),
        );

        const percent = trustData?.tier_progress?.progress_to_next?.percentage_complete || 0;

        progress.value = withTiming(percent / 100, { duration: 900 });
      })
      .catch((err) => console.log("❌ [Badges] API error:", err))
      .finally(() => setLoading(false));
  }, [token]);

  const animatedProps = useAnimatedProps(() => {
    const value = progress?.value ?? 0;
    return {
      strokeDasharray: `${HALF_CIRCUMFERENCE * value} ${CIRCUMFERENCE}`,
    };
  });

  const recentBadge = myBadges?.recently_earned?.[0];

  const resolvedRecentBadge = React.useMemo(() => {
    if (!recentBadge || !badgeDefs.length) return null;
    return badgeDefs.find((b) => b.badge_code === recentBadge.badge_code);
  }, [recentBadge, badgeDefs]);

  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color="#69c2d4" />
      </View>
    );
  }

  /* ===== DERIVED DATA ===== */

  const trustScore = trust?.trust_score?.trust_score || 0;
  const tier = trust?.trust_score?.regulatory_tier || "BRONZE";
  const tierColor = trust?.trust_score?.tier_color || "#999";
  const tierIcon = trust?.trust_score?.tier_icon || "🥉";

  const nextTier = trust?.tier_progress?.progress_to_next?.next_tier || "";
  const pointsToNext = trust?.points_to_next_tier || 0;

  const earnedCodes = myBadges?.badges?.map((b) => b.badge_code) || [];

  const activeBadges = badgeDefs.filter((b) => earnedCodes.includes(b.badge_code));

  const badgeColor = resolvedRecentBadge?.color || "#69c2d4";
  const badgePoints = resolvedRecentBadge?.trust_points;
  const badgeIcon = resolvedRecentBadge?.icon || "🏅";

  return (
    <View style={styles.container}>
      {/* HEADER */}
      <View style={styles.topHeader}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Trust Score</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* RECENT BADGE */}
      {recentBadge && (
        <Animated.View entering={FadeInUp} style={styles.recentBanner}>
          <TouchableOpacity style={styles.recentText} onPress={() => setShowConfetti(true)}>
            <Text style={{ fontWeight: "bold", textAlign: "center" }}>
              🎉 You earned <Text style={{ color: "#539dac" }}>{recentBadge.badge_name}</Text>
            </Text>
          </TouchableOpacity>
        </Animated.View>
      )}

      {/* GAUGE */}
      <View style={styles.gaugeWrap}>
        <Svg width={260} height={130}>
          <Circle cx="130" cy="130" r={RADIUS} stroke="#e0f2f5" strokeWidth={STROKE} fill="none" strokeDasharray={`${HALF_CIRCUMFERENCE} ${CIRCUMFERENCE}`} rotation="180" origin="130,130" />
          <AnimatedCircle cx="130" cy="130" r={RADIUS} stroke="#69c2d4" strokeWidth={STROKE} fill="none" rotation="180" origin="130,130" strokeLinecap="round" animatedProps={animatedProps} />
        </Svg>

        <View style={styles.scoreCenter}>
          <Text style={styles.scoreText}>{trustScore}</Text>
          <View style={styles.tierRow}>
            <Text style={{ fontSize: 18 }}>{tierIcon}</Text>
            <Text style={[styles.tierText, { color: tierColor }]}>{tier}</Text>
          </View>
        </View>
      </View>

      <Text style={styles.nextTier}>
        Next Tier: <Text style={styles.gold}>{nextTier}</Text> ({pointsToNext} pts away)
      </Text>

      {/* ACTIVE BADGES */}
      <Text style={styles.sectionTitle}>Active Badges</Text>

      {activeBadges?.length == 0 && <Text style={{ ...styles.sectionTitle, fontSize: 16, textAlign: "center", color: "#a3a3a3" }}>No badges to show :(</Text>}

      <FlatList
        horizontal
        showsHorizontalScrollIndicator={false}
        data={activeBadges}
        keyExtractor={(i) => i.badge_code}
        contentContainerStyle={styles.activeBadgesContainer}
        renderItem={({ item, index }) => (
          <Animated.View
            entering={SlideInRight.delay(index * 80)}
            style={{ overflow: "visible", height: 350 }} // ✅ sweet spot
          >
            <TouchableOpacity style={[styles.activeBadge, { borderColor: item.color || "#69c2d4" }]} onPress={() => setSelectedBadge(item)}>
              <View style={[styles.iconBubble, { backgroundColor: item.color + "22" }]}>
                <Text style={{ fontSize: 26 }}>{item.icon}</Text>
              </View>
              <Text style={styles.badgeLabel} numberOfLines={2}>
                {item.name}
              </Text>
            </TouchableOpacity>
          </Animated.View>
        )}
      />

      {/* ALL BADGES */}
      <Text style={styles.sectionTitle}>All Badges</Text>

      <FlatList
        data={badgeDefs}
        numColumns={2}
        keyExtractor={(i) => i.badge_code}
        contentContainerStyle={{ paddingBottom: 40 }}
        renderItem={({ item, index }) => {
          const earned = earnedCodes.includes(item.badge_code);
          return (
            <Animated.View entering={FadeInUp.delay(index * 50)}>
              <TouchableOpacity style={[styles.badgeCard, earned && styles.activeCard]} onPress={() => setSelectedBadge(item)}>
                <View style={[styles.iconBubble, { backgroundColor: item.color + "22" }]}>
                  <Text style={{ fontSize: 28 }}>{item.icon}</Text>
                </View>
                <Text style={styles.badgeName} numberOfLines={2}>
                  {item.name}
                </Text>
                <Text style={styles.badgePoints}>{item.trust_points} pts</Text>
              </TouchableOpacity>
            </Animated.View>
          );
        }}
      />

      {/* MODAL */}
      <Modal transparent visible={!!selectedBadge} animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={[styles.iconBubble, { backgroundColor: selectedBadge?.color + "22" }]}>
              <Text style={{ fontSize: 36 }}>{selectedBadge?.icon}</Text>
            </View>
            <Text style={styles.modalTitle}>{selectedBadge?.name}</Text>
            <Text style={styles.modalDesc}>{selectedBadge?.description}</Text>
            <Text style={styles.modalPoints}>{selectedBadge?.trust_points} trust points</Text>

            <TouchableOpacity style={styles.closeBtn} onPress={() => setSelectedBadge(null)}>
              <Text style={{ color: "#fff", fontWeight: "bold" }}>Got it</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {showConfetti && recentBadge && (
        <Modal transparent animationType="fade">
          <View style={styles.confettiOverlay}>
            {/* 🎊 Falling Confetti */}
            <LottieView ref={confettiRef} source={require("../../../assets/confetti.json")} autoPlay loop={false} style={styles.lottie} />

            {console.log("myBadges", myBadges)}
            {/* 🎉 Card */}
            <Animated.View entering={FadeInUp.springify().damping(12)} style={styles.confettiCard}>
              {/* Glow */}

              {/* Badge Row */}
              <View style={styles.badgeRow}>
                {/* LEFT – Badge */}
                <View style={styles.badge3DWrap}>
                  {/* Glow */}
                  <View style={[styles.hexGlow, { backgroundColor: badgeColor + "55" }]} />

                  <Svg width={96} height={96} viewBox="0 0 100 100">
                    <Defs>
                      <LinearGradient id="hexGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <Stop offset="0%" stopColor="#6ee7e750" />
                        <Stop offset="100%" stopColor="#2bb0b048" />
                      </LinearGradient>
                    </Defs>

                    <Polygon points="50,3 93,25 93,75 50,97 7,75 7,25" fill="none" stroke="#A6F0F0" strokeWidth="4" />

                    <Polygon points="50,8 88,28 88,72 50,92 12,72 12,28" fill="url(#hexGradient)" />
                  </Svg>

                  {/* Icon */}

                  {console.log("resolvedRecentBadge", resolvedRecentBadge)}

                  <View style={styles.hexIconWrap}>
                    <Text style={styles.badgeIconBig}>{badgeIcon}</Text>
                  </View>
                </View>

                {/* RIGHT – Text */}
                <View style={styles.badgeTextWrap}>
                  <Text style={styles.confettiTitle}>{recentBadge.badge_name}</Text>

                  <Text style={styles.confettiSub}>Badge Earned!</Text>

                  <View style={styles.pointsPill}>
                    <Text style={styles.pointsPillText}>+{badgePoints} Trust Points</Text>
                  </View>
                </View>
              </View>

              {/* 🧠 WHY SECTION */}
              <TouchableOpacity onPress={() => setShowWhy(!showWhy)} style={styles.whyToggle}>
                <Text style={styles.whyToggleText}>Why did I earn this? {showWhy ? "▲" : "▼"}</Text>
              </TouchableOpacity>

              {showWhy && (
                <Animated.Text entering={FadeInUp} style={styles.whyText}>
                  {badgeDefs.find((b) => b.badge_code === recentBadge.badge_code)?.description}
                </Animated.Text>
              )}

              <TouchableOpacity
                style={styles.confettiBtn}
                onPress={() => {
                  setShowConfetti(false);
                  setShowWhy(false);
                }}
              >
                <Text style={styles.confettiBtnText}>View My Badges</Text>
              </TouchableOpacity>
            </Animated.View>
          </View>
        </Modal>
      )}
    </View>
  );
}

/* ===== STYLES ===== */
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff", paddingHorizontal: 20, paddingBottom: 50 },
  loader: { flex: 1, justifyContent: "center", alignItems: "center" },

  topHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  headerTitle: { fontSize: 16, fontWeight: "bold" },

  recentBanner: { backgroundColor: "#e8f7fa", padding: 12, borderRadius: 14, marginVertical: 2 },
  recentText: { textAlign: "center", color: "#004d40" },

  gaugeWrap: { alignItems: "center", marginVertical: 20 },
  scoreCenter: { position: "absolute", top: 45, alignItems: "center" },
  scoreText: { fontSize: 36, fontWeight: "bold" },
  tierRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  tierText: { fontWeight: "600" },

  nextTier: { textAlign: "center", color: "#666", marginBottom: 20 },
  gold: { color: "#f5a623", fontWeight: "bold" },

  sectionTitle: { fontSize: 18, fontWeight: "600", marginVertical: 8 },

  iconBubble: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },

  activeBadgesContainer: {
    paddingVertical: 12,
    overflow: "visible",
  },

  activeBadge: {
    backgroundColor: "#fff",
    padding: 14,
    borderRadius: 18,
    alignItems: "center",
    marginRight: 12,
    width: 140,
    borderWidth: 1,
    elevation: 4,
    marginBottom: 20,
  },

  badgeLabel: {
    fontSize: 13,
    fontWeight: "600",
    textAlign: "center",
    minHeight: 34,
  },

  badgeCard: {
    width: (width - 60) / 2,
    height: 130,
    backgroundColor: "#f7f7f7",
    margin: 8,
    borderRadius: 20,
    padding: 16,
    alignItems: "center",
    justifyContent: "space-between",
  },

  activeCard: {
    backgroundColor: "#e0f2f5",
    elevation: 5,
  },

  badgeName: {
    fontWeight: "600",
    textAlign: "center",
    fontSize: 14,
    minHeight: 36,
  },

  badgePoints: {
    color: "#777",
    fontSize: 12,
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },

  modalCard: {
    backgroundColor: "#fff",
    padding: 24,
    borderRadius: 24,
    width: "82%",
    alignItems: "center",
  },

  modalTitle: { fontSize: 20, fontWeight: "bold", marginTop: 10 },
  modalDesc: { textAlign: "center", color: "#555", marginVertical: 12 },
  modalPoints: { fontWeight: "600", marginBottom: 16 },

  closeBtn: {
    backgroundColor: "#69c2d4",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 22,
  },
  confettiOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "center",
    alignItems: "center",
  },

  lottie: {
    position: "absolute",
    width: "100%",
    height: "100%",
  },

  confettiCard: {
    backgroundColor: "#fff",
    padding: 26,
    borderRadius: 28,
    width: "82%",
    alignItems: "center",
    elevation: 14,
    zIndex: 2,
  },

  glow: {
    position: "absolute",
    width: 170,
    height: 170,
    borderRadius: 85,
    backgroundColor: "#69c2d4",
    opacity: 0.6,
    top: -50,
  },

  badgeIconWrap: {
    width: 86,
    height: 86,
    borderRadius: 43,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
  },

  badgeIcon: {
    fontSize: 44,
  },

  confettiTitle: {
    fontSize: 22,
    fontWeight: "bold",
    textAlign: "start",
  },

  confettiSub: {
    fontSize: 14,
    color: "#777",
    marginTop: 2,
  },

  confettiPoints: {
    fontSize: 18,
    fontWeight: "700",
    color: "#69c2d4",
    marginTop: 12,
  },

  whyToggle: {
    marginTop: 10,
  },

  whyToggleText: {
    color: "#69c2d4",
    fontWeight: "600",
  },

  whyText: {
    textAlign: "center",
    color: "#555",
    marginTop: 8,
    paddingHorizontal: 10,
  },

  confettiBtn: {
    backgroundColor: "#69c2d4",
    paddingVertical: 16,
    borderRadius: 28,
    marginTop: 20,
    width: "100%",

    shadowColor: "#69c2d4",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.45,
    shadowRadius: 12,
    elevation: 10,
  },

  confettiBtnText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
    textAlign: "center",
  },

  sparkle: {
    position: "absolute",
    fontSize: 22,
    opacity: 0.9,
  },
  badgeRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },

  badge3DWrap: {
    width: 96,
    height: 96,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 16,
  },

  hexGlow: {
    position: "absolute",
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: "#9ee4e4",
    opacity: 0.55,
    shadowColor: "#1b2e2e",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 20,
    elevation: 20,
  },

  hexIconWrap: {
    position: "absolute",
    width: 96,
    height: 96,
    alignItems: "center",
    justifyContent: "center",
  },

  badgeIconBig: {
    fontSize: 38,
  },

  badgeTextWrap: {
    flex: 1,
  },

  pointsPill: {
    marginTop: 8,
    alignSelf: "flex-start",
    backgroundColor: "#e8f7fa",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },

  pointsPillText: {
    fontWeight: "700",
    color: "#69c2d4",
    fontSize: 14,
  },
});
