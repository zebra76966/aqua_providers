// MainTabs.js
import React, { useContext } from "react";
import { View } from "react-native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { AntDesign, MaterialCommunityIcons, Entypo, Feather } from "@expo/vector-icons";
import Header from "./header";
import DashboardScreen from "../screens/dashboard";

import { SafeAreaView } from "react-native-safe-area-context";

import ServicesStackNavigator from "../screens/maintabs/servicesStack";

import BoookingStackNavigator from "../screens/maintabs/bookingStack";
import CalendarScreen from "../screens/maintabs/CalendarScreen";
import SettingsStackNavigator from "../screens/maintabs/settingsStack";

// BreedersScreens============>
import BreederDashboardScreen from "../screens/maintabs/breeders/BreederDashboardScreen";
import { AuthContext } from "../authcontext";
import BreederInquiriesScreen from "../screens/maintabs/breeders/BreederInquiriesScreen";
import BreederAvailabilityScreen from "../screens/maintabs/breeders/BreederAvailabilityScreen";
import BreederBadgesScreen from "../screens/maintabs/breeders/BreederBadgesScreen";
import BreederRewardsScreen from "../screens/maintabs/breeders/BreederRewardsScreen";
import BreederSettingsScreen from "../screens/maintabs/breeders/BreederSettingsScreen";
import CalendarStackNavigator from "../screens/maintabs/calendarStack";
import SpeciesStackNavigator from "../screens/maintabs/breeders/breeedersSpeciesStack";
import BadgesScreen from "../screens/maintabs/badges/BadgesScreen";

const Tab = createBottomTabNavigator();

export default function MainTabs() {
  const { role } = useContext(AuthContext);

  console.log("role", role);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#000" }} edges={["bottom"]}>
      <View style={{ flex: 1 }}>
        <Header />
        <Tab.Navigator
          screenOptions={{
            headerShown: false,
            tabBarStyle: {
              backgroundColor: "#222",
              borderTopLeftRadius: 20,
              borderTopRightRadius: 20,
              height: 70,
              position: "absolute",
            },
            tabBarActiveTintColor: "#a580e9",
            tabBarInactiveTintColor: "#fff",
            tabBarShowLabel: true,
          }}
        >
          <Tab.Screen
            name="Dashboard"
            component={role == "consultant" ? DashboardScreen : BreederDashboardScreen}
            options={{
              tabBarIcon: ({ color }) => <AntDesign name="home" size={22} color={color} />,
            }}
          />

          {role == "consultant" && (
            <Tab.Screen
              name={"Services"}
              component={ServicesStackNavigator}
              options={{
                tabBarIcon: ({ color }) => <MaterialCommunityIcons name={"cog"} size={22} color={color} />,
              }}
            />
          )}

          <Tab.Screen
            name={"Badges"}
            component={BadgesScreen}
            options={{
              tabBarIcon: ({ color }) => <MaterialCommunityIcons name={"shield-star-outline"} size={22} color={color} />,
            }}
          />
          <Tab.Screen
            name={role == "consultant" ? "Bookings" : "Species"}
            component={role == "consultant" ? BoookingStackNavigator : SpeciesStackNavigator}
            options={{
              tabBarIcon: ({ color }) => <MaterialCommunityIcons name={role == "consultant" ? "book" : "fish"} size={22} color={color} />,
            }}
          />
          <Tab.Screen
            name={role == "consultant" ? "Calendar" : "Settings"}
            component={role == "consultant" ? CalendarStackNavigator : BreederSettingsScreen}
            options={{
              tabBarIcon: ({ color }) => <MaterialCommunityIcons name={role == "consultant" ? "calendar" : "cog"} size={22} color={color} />,
            }}
          />

          <Tab.Screen
            name="Profile"
            component={SettingsStackNavigator}
            options={{
              tabBarIcon: ({ color }) => <MaterialCommunityIcons name="face-man-shimmer-outline" size={22} color={color} />,
            }}
          />
        </Tab.Navigator>
      </View>
    </SafeAreaView>
  );
}
