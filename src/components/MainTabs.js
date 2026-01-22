// MainTabs.js
import React from "react";
import { View } from "react-native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { AntDesign, MaterialCommunityIcons, Entypo, Feather } from "@expo/vector-icons";
import Header from "./header";
import DashboardScreen from "../screens/dashboard";
import ProductsScreen from "../screens/maintabs/products";
import TankScanScreen from "../screens/tankScanSreen";
import TanksScreen from "../screens/maintabs/tanks";
import SettingsScreen from "../screens/maintabs/settings";

import TanksStackNavigator from "../screens/maintabs/tanks";
import { SafeAreaView } from "react-native-safe-area-context";
import MarketplaceStackNavigator from "../screens/maintabs/marketplace/MarketplaceStackNavigator";
import FontAwesome5 from "@expo/vector-icons/FontAwesome5";
import ConsultantsScreen from "../screens/maintabs/ConsultantsScreen";

import BreedersStackNavigator from "../screens/maintabs/breeders/BreedersStackNavigator";
import ServicesScreen from "../screens/maintabs/services";
import ServicesStackNavigator from "../screens/maintabs/servicesStack";
import BookingsScreen from "../screens/maintabs/BookingsScreen";
import BoookingStackNavigator from "../screens/maintabs/bookingStack";
import CalendarScreen from "../screens/maintabs/CalendarScreen";
import SettingsStackNavigator from "../screens/maintabs/settingsStack";

const Tab = createBottomTabNavigator();

export default function MainTabs() {
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
            component={DashboardScreen}
            options={{
              tabBarIcon: ({ color }) => <AntDesign name="home" size={22} color={color} />,
            }}
          />
          {/* <Tab.Screen
            name="Habitat"
            component={TanksStackNavigator}
            options={{
              tabBarIcon: ({ color }) => <MaterialCommunityIcons name="waves" size={22} color={color} />,
            }}
          />

          <Tab.Screen
            name="Marketplace"
            component={MarketplaceStackNavigator}
            options={{
              tabBarIcon: ({ color }) => <FontAwesome5 name="store" size={22} color={color} />,
            }}
          /> */}

          <Tab.Screen
            name="Services"
            component={ServicesStackNavigator}
            options={{
              tabBarIcon: ({ color }) => <Entypo name="cog" size={22} color={color} />,
            }}
          />
          <Tab.Screen
            name="Bookings"
            component={BoookingStackNavigator}
            options={{
              tabBarIcon: ({ color }) => <AntDesign name="book" size={22} color={color} />,
            }}
          />
          <Tab.Screen
            name="Calendar"
            component={CalendarScreen}
            options={{
              tabBarIcon: ({ color }) => <MaterialCommunityIcons name="calendar" size={22} color={color} />,
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
